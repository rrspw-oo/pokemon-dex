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
const MAX_PER_LANG = 6;
const MAX_BY_PRICE = 3;
const PRICE_MIN = 100;
const RARITY_TIER = {
  "Special illustration rare": 6,
  "Hyper rare": 6,
  "Mega Hyper Rare": 6,
  "Secret Rare": 6,
  "Rare Secret": 6,
  "Rare Rainbow": 6,
  "Illustration rare": 5,
  "Ultra Rare": 5,
  "Rare Ultra": 5,
  "Shiny Ultra Rare": 5,
  "Rare Shiny GX": 5,
  "Black White Rare": 5,
  "Rare Holo Star": 5,
  "Rare Prism Star": 5,
  "LEGEND": 5,
  "Amazing Rare": 4,
  "Radiant Rare": 4,
  "Shiny rare": 4,
  "Rare Shiny": 4,
  "Shiny Rare": 4,
  "ACE SPEC Rare": 4,
  "Double rare": 3,
  "Rare Holo V": 3,
  "Rare Holo VMAX": 3,
  "Rare Holo VSTAR": 3,
  "Holo Rare V": 3,
  "Holo Rare VMAX": 3,
  "Holo Rare VSTAR": 3,
  "Rare PRIME": 3,
  "Rare Holo GX": 3,
  "Rare Holo EX": 3,
  "Rare Holo LV.X": 3,
  "Rare BREAK": 3,
  "Rare Prime": 3,
  "Rare Holo": 2,
  "Holo Rare": 2,
  "Rare": 1,
  "Uncommon": 0,
  "Common": 0,
  "Promo": 0,
  "None": 0,
};
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
      cards.set(c.id, {
        id: c.id,
        name: c.name,
        img: c.image.replace(ASSETS, ""),
        set: set.name,
        no: c.localId,
        date: set.releaseDate || "",
        secret: Number(c.localId) > set.cardCount?.official,
      });
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
const zhOrder = (a, b) => b.secret - a.secret || newestFirst(a, b);
const specialOrder = (a, b) => b.tier - a.tier || b.secret - a.secret || (b.price ?? 0) - (a.price ?? 0) || newestFirst(a, b);

function marketPrice(card) {
  const prices = Object.values(card.pricing?.tcgplayer || {})
    .map((variant) => variant?.marketPrice)
    .filter((n) => typeof n === "number");
  return prices.length ? Math.min(...prices) : null;
}

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
  const enWanted = [...new Set(enIds.flat().map((c) => c.id))].filter((id) => enCards.has(id));
  console.log(`fetching ${enWanted.length} English card details`);
  const unknownRarity = {};
  let priceUpdated = "";
  await pool(enWanted, async (id) => {
    const detail = await get(`/en/cards/${encodeURIComponent(id)}`);
    const card = enCards.get(id);
    card.rarity = detail.rarity || "";
    card.tier = RARITY_TIER[card.rarity] ?? 0;
    card.price = marketPrice(detail);
    if (card.rarity && !(card.rarity in RARITY_TIER)) unknownRarity[card.rarity] = (unknownRarity[card.rarity] || 0) + 1;
    const updated = detail.pricing?.tcgplayer?.updated || "";
    if (updated > priceUpdated) priceUpdated = updated;
  });

  const sets = {};
  const cards = {};
  const prices = {};
  dexIds.forEach((dex, i) => {
    const zh = (zhByDex.get(dex) || []).sort(zhOrder).slice(0, MAX_PER_LANG);
    const en = [...new Map(enIds[i].map((c) => [c.id, enCards.get(c.id)])).values()].filter(Boolean);
    const byPrice = en
      .filter((card) => card.price >= PRICE_MIN)
      .sort((a, b) => b.price - a.price)
      .slice(0, MAX_BY_PRICE);
    const bySpecial = en.filter((card) => !byPrice.includes(card)).sort(specialOrder);
    const kept = [...zh, ...[...byPrice, ...bySpecial].slice(0, MAX_PER_LANG)];
    if (!kept.length) return;
    cards[dex] = kept.map((card) => card.img);
    for (const card of kept) {
      sets[card.img.slice(0, card.img.lastIndexOf("/"))] = card.set;
      if (card.price >= PRICE_MIN) prices[card.img] = Math.round(card.price);
    }
  });

  const counts = Object.values(cards).map((list) => list.length);
  const zhSpecies = [...zhByDex.keys()].length;
  console.log(
    `species with cards ${counts.length} of ${dexIds.length}, with zh-tw cards ${zhSpecies}, cards kept ${counts.reduce((a, b) => a + b, 0)}`,
  );
  const priceDate = priceUpdated.slice(0, 7).replace("-", ".");
  console.log(`prices kept ${Object.keys(prices).length}, price date ${priceDate}`);
  writeFileSync(REPORT, JSON.stringify({ unmatchedZhNames: unmatched, unknownRarity }, null, 2));
  writeFileSync(OUT, JSON.stringify({ sets, cards, prices, priceDate }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
