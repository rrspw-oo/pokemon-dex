import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, "../src/data/complete_pokemon_database.json");
const OUT = resolve(__dirname, "../src/data/pvp.json");
const CACHE_DIR = resolve(__dirname, "../node_modules/.cache/pogo");
const REFRESH = process.argv.includes("--refresh");
const PVPOKE = "https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data";
const LEAGUES = [1500, 2500, 10000];
const MAX_LEVEL = 50;
const SOURCES = {
  pvpokeGameMaster: [`${PVPOKE}/gamemaster.min.json`, "pvpoke_gamemaster.json"],
  gameMaster: ["https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json", "game_master.json"],
  texts: [
    "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Texts/Latest%20APK/JSON/i18n_chinesetraditional.json",
    "i18n_chinesetraditional.json",
  ],
  ...Object.fromEntries(LEAGUES.map((cp) => [`rank${cp}`, [`${PVPOKE}/rankings/all/overall/rankings-${cp}.json`, `pvpoke_rankings_${cp}.json`]])),
};
const REGION = { alolan: "alola", galarian: "galar", hisuian: "hisui", paldean: "paldea" };

async function load([url, name]) {
  mkdirSync(CACHE_DIR, { recursive: true });
  const file = join(CACHE_DIR, name);
  if (REFRESH || !existsSync(file)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed: ${url}`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  return JSON.parse(readFileSync(file, "utf8"));
}

const words = (s) =>
  (s || "")
    .toLowerCase()
    .replace(/♀/g, " female ")
    .replace(/♂/g, " male ")
    .replace(/mid-night/g, "midnight")
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((w) => REGION[w] || w);

function cpmTable(gm) {
  const base = gm.find((t) => t.templateId === "PLAYER_LEVEL_SETTINGS").data.playerLevel.cpMultiplier;
  const table = [];
  for (let level = 1; level <= MAX_LEVEL; level += 0.5) {
    const i = Math.floor(level) - 1;
    const m = Number.isInteger(level) ? base[i] : Math.sqrt((base[i] ** 2 + base[i + 1] ** 2) / 2);
    table.push([level, Number(m.toFixed(8))]);
  }
  return table;
}

function moveNames(gm, t) {
  const names = new Map();
  for (const tpl of gm) {
    const m = tpl.templateId.match(/^V(\d{4})_MOVE_(.+)$/);
    if (!m) continue;
    const zh = t.get(`move_name_${m[1]}`);
    if (zh) names.set(m[2].replace(/_FAST$/, ""), zh);
  }
  return names;
}

function score(record, cand) {
  const recordWords = new Set(words(record.form_en || record.name_en));
  const paren = (cand.speciesName.match(/\(([^)]*)\)/) || [])[1];
  let s = 0;
  if ([...record.types].map((x) => x.toLowerCase()).sort().join() === [...cand.types].filter((x) => x !== "none").sort().join()) s += 10;
  if (!paren) s += record.is_variant || record.form_en ? 0 : 3;
  for (const w of words(paren)) if (recordWords.has(w)) s += 5;
  return s;
}

async function pokeapiMoveName(id) {
  const slug = id.replace(/^AEGISLASH_CHARGE_/, "").toLowerCase().replace(/_/g, "-");
  const file = join(CACHE_DIR, `pokeapi_move_${slug}.json`);
  if (!existsSync(file)) {
    const res = await fetch(`https://pokeapi.co/api/v2/move/${slug}`);
    if (!res.ok) return null;
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  const move = JSON.parse(readFileSync(file, "utf8"));
  return move.names.find((n) => n.language.name === "zh-hant")?.name || null;
}

async function main() {
  const [pvpoke, gm, textsRaw, ...ranks] = await Promise.all([
    load(SOURCES.pvpokeGameMaster),
    load(SOURCES.gameMaster),
    load(SOURCES.texts),
    ...LEAGUES.map((cp) => load(SOURCES[`rank${cp}`])),
  ]);
  const t = new Map();
  for (let i = 0; i < textsRaw.data.length; i += 2) t.set(textsRaw.data[i].toLowerCase(), textsRaw.data[i + 1]);
  const zhMoves = moveNames(gm, t);
  const movesById = new Map(pvpoke.moves.map((m) => [m.moveId, m]));

  const rankings = LEAGUES.map((cp, li) => new Map(ranks[li].map((r, i) => [r.speciesId, { rank: i + 1, r }])));

  const candidatesByDex = new Map();
  for (const p of pvpoke.pokemon) {
    if (p.released === false || p.speciesId.includes("_shadow") || p.tags?.includes("duplicate")) continue;
    if (!candidatesByDex.has(p.dex)) candidatesByDex.set(p.dex, []);
    candidatesByDex.get(p.dex).push(p);
  }

  const db = JSON.parse(readFileSync(DB_PATH, "utf8"));
  const byDex = new Map();
  db.forEach((r) => {
    delete r.go_id;
    if (!byDex.has(r.id)) byDex.set(r.id, []);
    byDex.get(r.id).push(r);
  });

  const report = { unmatched: [], weak: [] };
  const used = new Set();
  for (const [dex, records] of byDex) {
    const cands = candidatesByDex.get(dex) || [];
    const pairs = [];
    records.forEach((r, ri) => cands.forEach((c, ci) => pairs.push({ ri, ci, s: score(r, c) })));
    pairs.sort((a, b) => b.s - a.s || a.ci - b.ci || a.ri - b.ri);
    const takenR = new Set();
    const takenC = new Set();
    for (const p of pairs) {
      if (takenR.has(p.ri) || takenC.has(p.ci) || p.s < 10) continue;
      takenR.add(p.ri);
      takenC.add(p.ci);
      records[p.ri].go_id = cands[p.ci].speciesId;
      used.add(cands[p.ci].speciesId);
      if (records.length > 1 && p.s < 13) report.weak.push(`${dex} ${records[p.ri].form_en || records[p.ri].name_en} -> ${cands[p.ci].speciesName} (${p.s})`);
    }
    records.forEach((r, ri) => {
      if (!takenR.has(ri) && cands.length) report.unmatched.push(`${dex} ${r.form_en || r.name_en}`);
    });
  }

  const moveOut = {};
  const pokemonOut = {};
  const ids = [];
  const idIndex = new Map();
  const ref = (id) => {
    if (!idIndex.has(id)) {
      idIndex.set(id, ids.length);
      ids.push(id);
    }
    return idIndex.get(id);
  };
  const known = (id) => used.has(id.replace(/_shadow$/, ""));
  for (const p of pvpoke.pokemon) {
    if (!known(p.speciesId) || p.released === false) continue;
    const entry = { s: [p.baseStats.atk, p.baseStats.def, p.baseStats.hp] };
    const elite = new Set(p.eliteMoves || []);
    LEAGUES.forEach((cp, li) => {
      const hit = rankings[li].get(p.speciesId);
      if (!hit) return;
      const moveset = hit.r.moveset;
      entry[cp] = [
        hit.rank,
        hit.r.score,
        moveset,
        moveset.filter((id) => elite.has(id)),
        (hit.r.matchups || []).map((m) => m.opponent).filter(known).map(ref),
        (hit.r.counters || []).map((m) => m.opponent).filter(known).map(ref),
      ];
    });
    pokemonOut[p.speciesId] = entry;
  }

  for (const m of pvpoke.moves) {
    const zh = zhMoves.get(m.moveId) || (m.moveId.startsWith("HIDDEN_POWER") && zhMoves.get("HIDDEN_POWER"));
    moveOut[m.moveId] = [zh || m.name, m.type, m.energyGain > 0 ? 1 : 0];
  }

  for (const [id, m] of Object.entries(moveOut)) {
    if (!/^[A-Za-z]/.test(m[0])) continue;
    const plus = id.endsWith("_PLUS");
    const base = id.replace(/^AEGISLASH_CHARGE_/, "").replace(/_PLUS$/, "").replace(/^(GULP_MISSILE|TECHNO_BLAST)_.+$/, "$1");
    const zh = zhMoves.get(base) || (await pokeapiMoveName(base));
    if (zh) m[0] = plus ? `${zh}＋` : zh;
  }

  writeFileSync(DB_PATH, JSON.stringify(db, null, 2) + "\n");
  writeFileSync(
    OUT,
    JSON.stringify({
      generatedAt: new Date().toISOString().slice(0, 10),
      leagues: LEAGUES,
      maxLevel: MAX_LEVEL,
      cpm: cpmTable(gm),
      moves: moveOut,
      ids,
      pokemon: pokemonOut,
    })
  );
  writeFileSync(join(CACHE_DIR, "pvp-report.json"), JSON.stringify(report, null, 2));
  const missingZh = Object.entries(moveOut).filter(([, m]) => /^[A-Za-z]/.test(m[0])).map(([id]) => id);
  console.log(
    `matched ${db.filter((r) => r.go_id).length}/${db.length}, pokemon ${Object.keys(pokemonOut).length}, moves ${Object.keys(moveOut).length}, moves without zh ${missingZh.length} ${missingZh.join(" ")}, unmatched ${report.unmatched.length}, weak ${report.weak.length}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
