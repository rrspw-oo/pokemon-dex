import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, "../src/data/complete_pokemon_database.json");
const OUT = resolve(__dirname, "../src/data/cards.json");
const CACHE_DIR = resolve(__dirname, "../node_modules/.cache/tcgdex");
const REPORT = join(CACHE_DIR, "cards-report.json");
const REFRESH = process.argv.includes("--refresh");
const API = "https://api.tcgdex.net/v2";
const ASSETS = "https://assets.tcgdex.net/";
const MAX_CARDS = 6;
const CONCURRENCY = 4;
const ZH_ALIASES = { 電飛鼠: "導電飛鼠", 胡帕: "懲戒胡帕", 連擊武道熊師: "武道熊師", 一擊武道熊師: "武道熊師" };

async function get(path) {
  const file = join(CACHE_DIR, `${path.replace(/[^\w.-]+/g, "_")}.json`);
  if (!REFRESH && existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${API}${path}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const data = JSON.parse(text);
      writeFileSync(file, text);
      return data;
    } catch (err) {
      if (attempt === 5) throw new Error(`Failed: ${path} (${err.message})`);
      await new Promise((r) => setTimeout(r, attempt * 2000));
    }
  }
}

async function pool(items, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

async function setCards(lang) {
  const sets = await pool(await get(`/${lang}/sets`), (s) => get(`/${lang}/sets/${encodeURIComponent(s.id)}`));
  const cards = new Map();
  for (const set of sets) {
    if (set.serie?.id === "tcgp") continue;
    for (const c of set.cards || []) {
      if (!c.image) continue;
      cards.set(c.id, { id: c.id, name: c.name, img: c.image.replace(ASSETS, ""), set: set.name, no: c.localId, date: set.releaseDate || "" });
    }
  }
  return cards;
}

const stripName = (name) => name.replace(/[(（].*$/, "").trim();

function nameCandidates(name) {
  const base = name
    .replace(/^<[^>]*>/, "")
    .replace(/^(伽勒爾|帕底亞|阿羅拉|洗翠|光輝|起源|超級)\s*/, "")
    .replace(/\s*(VMAX|VSTAR|V-UNION|V|ex|EX|GX|BREAK)$/, "")
    .replace(/(?<=[^A-Z])[XYＸＹ]$/, "")
    .trim();
  const candidates = [base, base.split(/\s+/)[0], base.split("的").pop()];
  return candidates.map((n) => ZH_ALIASES[n] || n);
}

const newestFirst = (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id);

async function main() {
  mkdirSync(CACHE_DIR, { recursive: true });
  const db = JSON.parse(readFileSync(DB_PATH, "utf8"));
  const dexIds = [...new Set(db.map((r) => r.id))].sort((a, b) => a - b);
  const zhToDex = new Map();
  for (const r of db) zhToDex.set(stripName(r.name_zh_tw), r.id);

  const zhCards = await setCards("zh-tw");
  const enCards = await setCards("en");
  console.log(`zh-tw cards with image ${zhCards.size}, en ${enCards.size}`);

  const zhByDex = new Map();
  const unmatched = {};
  for (const card of zhCards.values()) {
    const dex = nameCandidates(card.name).map((n) => zhToDex.get(n)).find(Boolean);
    if (dex) zhByDex.set(dex, [...(zhByDex.get(dex) || []), card]);
    else unmatched[card.name] = (unmatched[card.name] || 0) + 1;
  }

  const enIds = await pool(dexIds, (dex) => get(`/en/cards?dexId=eq:${dex}`));

  const sets = {};
  const cards = {};
  dexIds.forEach((dex, i) => {
    const zh = (zhByDex.get(dex) || []).sort(newestFirst);
    const en = enIds[i]
      .map((c) => enCards.get(c.id))
      .filter(Boolean)
      .sort(newestFirst);
    const kept = [...zh, ...en].slice(0, MAX_CARDS);
    if (!kept.length) return;
    cards[dex] = kept.map((card) => card.img);
    for (const card of kept) sets[card.img.slice(0, card.img.lastIndexOf("/"))] = card.set;
  });

  const counts = Object.values(cards).map((list) => list.length);
  const zhSpecies = [...zhByDex.keys()].length;
  console.log(
    `species with cards ${counts.length} of ${dexIds.length}, with zh-tw cards ${zhSpecies}, cards kept ${counts.reduce((a, b) => a + b, 0)}`,
  );
  writeFileSync(REPORT, JSON.stringify({ unmatchedZhNames: unmatched }, null, 2));
  writeFileSync(OUT, JSON.stringify({ sets, cards }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
