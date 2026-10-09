import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, "../src/data/complete_pokemon_database.json");
const OUT = resolve(__dirname, "../src/data/cards.json");
const API = "https://api.tcgdex.net/v2";
const ASSETS = "https://assets.tcgdex.net/";
const DEX_IDS = [789];
const MAX_CARDS = 6;

async function get(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`Failed: ${path}`);
  return res.json();
}

const baseName = (name) =>
  name
    .replace(/^(伽勒爾|帕底亞|阿羅拉|洗翠)\s*/, "")
    .replace(/\s*(VMAX|VSTAR|V|ex|GX)$/, "")
    .trim();

const setCache = new Map();
const setInfo = (lang, id) => {
  const key = `${lang}/${id}`;
  if (!setCache.has(key)) setCache.set(key, get(`/${lang}/sets/${encodeURIComponent(id)}`));
  return setCache.get(key);
};

async function describe(lang, brief) {
  const card = await get(`/${lang}/cards/${encodeURIComponent(brief.id)}`);
  const set = await setInfo(lang, card.set.id);
  return {
    id: brief.id,
    img: brief.image.replace(ASSETS, ""),
    set: card.set.name,
    no: card.localId,
    date: set.releaseDate || "",
  };
}

const newestFirst = (a, b) => b.date.localeCompare(a.date);

async function main() {
  const db = JSON.parse(readFileSync(DB_PATH, "utf8"));
  const zhAll = await get("/zh-tw/cards");
  const out = {};

  for (const dex of DEX_IDS) {
    const zhName = db.find((r) => r.id === dex && !r.form_zh).name_zh_tw;
    const zhBriefs = zhAll.filter((c) => c.image && baseName(c.name) === zhName);
    const enBriefs = (await get(`/en/cards?dexId=${dex}`)).filter((c) => c.image && !c.image.includes("/tcgp/"));

    const zh = (await Promise.all(zhBriefs.map((c) => describe("zh-tw", c)))).sort(newestFirst);
    const en = (await Promise.all(enBriefs.map((c) => describe("en", c)))).sort(newestFirst);

    out[dex] = [...zh, ...en].slice(0, MAX_CARDS).map(({ id, img, set, no }) => ({ id, img, set, no }));
    console.log(`${dex} ${zhName}: zh-tw ${zh.length}, en ${en.length}, kept ${out[dex].length}`);
  }

  writeFileSync(OUT, JSON.stringify(out));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
