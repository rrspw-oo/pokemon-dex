import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import sharp from "sharp";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../src/data/cups.json");
const PVP = resolve(__dirname, "../src/data/pvp.json");
const DB = resolve(__dirname, "../src/data/complete_pokemon_database.json");
const CACHE_DIR = resolve(__dirname, "../node_modules/.cache/pogo");
const ICON_DIR = resolve(__dirname, "../public/cup-icons");
const ICON_SIZE = 24;
const REFRESH = process.argv.includes("--refresh");
const PVPOKE = "https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data";
const TOP = 30;

const PVPOKE_CUP = {
  COMBAT_LEAGUE_VS_SEEKER_GREAT_RETRO: ["retro", 1500],
  COMBAT_LEAGUE_VS_SEEKER_GREAT_LITTLE: ["little", 500],
  COMBAT_LEAGUE_VS_SEEKER_FANTASY_ULTRA: ["fantasy", 2500],
  COMBAT_LEAGUE_VS_SEEKER_WILLPOWER: ["willpower", 1500],
  COMBAT_LEAGUE_VS_SEEKER_GREAT_REMIX: ["remix", 1500],
  COMBAT_LEAGUE_VS_SEEKER_GREAT_CATCH: ["catch", 1500],
  COMBAT_LEAGUE_VS_SEEKER_MASTER_PREMIER: ["premier", 10000],
  COMBAT_LEAGUE_VS_SEEKER_ULTRA_PREMIER: ["premier", 2500],
  COMBAT_LEAGUE_VS_SEEKER_MASTER_CLASSIC: ["classic", 10000],
};
const STANDARD = {
  COMBAT_LEAGUE_VS_SEEKER_GREAT: 1500,
  COMBAT_LEAGUE_VS_SEEKER_ULTRA: 2500,
  COMBAT_LEAGUE_VS_SEEKER_MASTER: 10000,
};
const REGION = { alolan: "ALOLA", galarian: "GALARIAN", hisuian: "HISUIAN", paldean: "PALDEA" };

async function load(url, name) {
  mkdirSync(CACHE_DIR, { recursive: true });
  const file = join(CACHE_DIR, name);
  if (REFRESH || !existsSync(file)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed: ${url}`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  return JSON.parse(readFileSync(file, "utf8"));
}

async function cupIcon(url) {
  const stem = decodeURIComponent(url.split("/").pop()).replace(/\.png$/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const out = join(ICON_DIR, `${stem}.png`);
  if (REFRESH || !existsSync(out)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed: ${url}`);
    mkdirSync(ICON_DIR, { recursive: true });
    await sharp(Buffer.from(await res.arrayBuffer()))
      .trim()
      .resize(ICON_SIZE, ICON_SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ palette: true, compressionLevel: 9 })
      .toFile(out);
  }
  return stem;
}

const rankingFile = (cup, cp) => load(`${PVPOKE}/rankings/${cup}/overall/rankings-${cp}.json`, `pvpoke_rankings_${cup}_${cp}.json`);
const leagueCp = (cp) => (cp <= 500 ? 500 : cp <= 1500 ? 1500 : cp <= 2500 ? 2500 : 10000);

function goForms(p, goName) {
  const base = goName.toLowerCase();
  const suffix = p.speciesId.startsWith(`${base}_`) ? p.speciesId.slice(base.length + 1) : "";
  if (!suffix) return ["FORM_UNSET", `${goName}_NORMAL`];
  const mapped = REGION[suffix] || suffix.toUpperCase();
  return [`${goName}_${mapped}`];
}

function matchesList(list, p, goName) {
  const hit = list.find((e) => e.id === goName);
  if (!hit) return false;
  if (!hit.forms) return true;
  return goForms(p, goName).some((f) => hit.forms.includes(f));
}

async function main() {
  const gm = await load("https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json", "game_master.json");
  const textsRaw = await load(
    "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Texts/Latest%20APK/JSON/i18n_chinesetraditional.json",
    "i18n_chinesetraditional.json"
  );
  const pvpoke = await load(`${PVPOKE}/gamemaster.min.json`, "pvpoke_gamemaster.json");
  const pvp = JSON.parse(readFileSync(PVP, "utf8"));
  const zhByGoId = new Map(
    JSON.parse(readFileSync(DB, "utf8"))
      .filter((r) => r.go_id)
      .map((r) => [r.go_id, r.form_zh || r.name_zh_tw])
  );
  const t = new Map();
  for (let i = 0; i < textsRaw.data.length; i += 2) t.set(textsRaw.data[i].toLowerCase(), textsRaw.data[i + 1]);

  const goNameByDex = new Map();
  for (const tpl of gm) {
    const ps = tpl.data.pokemonSettings;
    const m = tpl.templateId.match(/^V(\d{4})_POKEMON_/);
    if (ps && m && !ps.form) goNameByDex.set(Number(m[1]), ps.pokemonId);
  }
  const pokemonById = new Map(pvpoke.pokemon.map((p) => [p.speciesId, p]));
  const linked = new Set(Object.keys(pvp.pokemon));

  const ids = [];
  const idIndex = new Map();
  const ref = (id) => {
    if (!idIndex.has(id)) {
      idIndex.set(id, ids.length);
      ids.push(id);
    }
    return idIndex.get(id);
  };

  const pool = pvpoke.pokemon.filter(
    (p) => p.released !== false && !p.speciesId.includes("_shadow") && !p.tags?.includes("mega") && goNameByDex.has(p.dex)
  );
  const zhOf = (p) => (zhByGoId.get(p.speciesId) || p.speciesName).replace(/的樣子\)/, ")");
  const allowedByCup = new Map();

  const seenTitles = new Set();
  const leagues = gm
    .filter((tpl) => tpl.data.combatLeague && tpl.templateId.startsWith("COMBAT_LEAGUE_VS_SEEKER_") && !tpl.templateId.includes("MEGAS"))
    .reverse()
    .map((tpl) => ({ id: tpl.templateId, league: tpl.data.combatLeague, zh: t.get(tpl.data.combatLeague.title.toLowerCase()) }))
    .filter((l) => {
      if (!l.zh || seenTitles.has(l.zh)) return false;
      seenTitles.add(l.zh);
      return true;
    })
    .reverse();

  const cups = [];
  for (const { id, league, zh } of leagues) {
    const conds = league.pokemonCondition || [];
    const maxCp = conds.find((c) => c.withPokemonCpLimit)?.withPokemonCpLimit.maxCp || 10000;
    const cp = leagueCp(maxCp);
    const types = conds.find((c) => c.withPokemonType)?.withPokemonType.pokemonType.map((x) => x.replace("POKEMON_TYPE_", "").toLowerCase());
    const whitelist = conds.find((c) => c.pokemonWhiteList)?.pokemonWhiteList.pokemon;
    const banlist = conds.find((c) => c.pokemonBanList)?.pokemonBanList.pokemon || [];
    const banned = new Set(league.bannedPokemon || []);
    const maxLevel = conds.find((c) => c.pokemonLevelRange)?.pokemonLevelRange.maxLevel;
    const caughtWindow = conds.some((c) => c.pokemonCaughtTimestamp);

    const eligible = (speciesId) => {
      const p = pokemonById.get(speciesId.replace(/_shadow$/, ""));
      if (!p || p.tags?.includes("mega")) return false;
      const goName = goNameByDex.get(p.dex);
      if (!goName || banned.has(goName)) return false;
      if (types && !p.types.some((x) => types.includes(x))) return false;
      if (whitelist && !matchesList(whitelist, p, goName)) return false;
      if (matchesList(banlist, p, goName)) return false;
      return true;
    };

    const source = PVPOKE_CUP[id] || (STANDARD[id] && ["all", STANDARD[id]]);
    const ranking = source ? await rankingFile(source[0], source[1]) : await rankingFile("all", cp);
    const top = [];
    for (const r of ranking) {
      if (top.length >= TOP) break;
      if (!linked.has(r.speciesId.replace(/_shadow$/, ""))) continue;
      if (!source && !eligible(r.speciesId)) continue;
      const keep = (list) => (list || []).map((m) => m.opponent).filter((o) => linked.has(o.replace(/_shadow$/, "")) && (source || eligible(o))).map(ref);
      top.push([ref(r.speciesId), r.score, r.moveset.filter((m) => m !== "none"), keep(r.matchups), keep(r.counters)]);
    }
    if (top.length === 0) continue;

    const rules = [maxCp >= 6000 ? "無 CP 上限" : `CP 上限 ${maxCp}`];
    if (types) rules.push(`限 ${types.map((x) => t.get(`pokemon_type_${x}`) || x).join("、")} 屬性`);
    if (whitelist) rules.push(`限指定的 ${new Set(whitelist.map((e) => e.id)).size} 種寶可夢`);
    if (banlist.length) {
      const isBanned = (p) =>
        banned.has(goNameByDex.get(p.dex)) || matchesList(banlist, p, goNameByDex.get(p.dex));
      const inBanlist = (p) => matchesList(banlist, p, goNameByDex.get(p.dex));
      const typeNames = [...new Set(pool.flatMap((p) => p.types))].filter((x) => x !== "none");
      const bannedTypes = typeNames.filter((type) => {
        const ofType = pool.filter((p) => p.types.includes(type));
        return ofType.length >= 3 && ofType.filter(isBanned).length / ofType.length >= 0.95;
      });
      const exceptions = pool
        .filter((p) => p.types.some((x) => bannedTypes.includes(x)) && !isBanned(p))
        .map(zhOf);
      const others = new Set(
        pool.filter((p) => inBanlist(p) && !p.types.some((x) => bannedTypes.includes(x))).map((p) => p.dex)
      ).size;
      if (bannedTypes.length) {
        const names = bannedTypes.map((x) => t.get(`pokemon_type_${x}`) || x).join("、");
        rules.push(`禁用 ${names} 屬性${exceptions.length ? `（${exceptions.join("、")}除外）` : ""}`);
      }
      if (others) rules.push(`另禁用 ${others} 種寶可夢`);
    }
    if (maxLevel && maxLevel < 51) rules.push(`等級上限 ${maxLevel}`);
    if (caughtWindow) rules.push("限賽季期間捕捉的寶可夢");
    if (banned.has("MEWTWO") || banned.has("MEW")) rules.push("禁用傳說、幻之寶可夢等");
    else if (banned.size > 2) rules.push(`禁用 ${banned.size} 種寶可夢`);

    allowedByCup.set(zh.replace(/\s+/g, ""), new Set(pool.filter((p) => eligible(p.speciesId)).map(zhOf)));
    cups.push({
      id: id.replace("COMBAT_LEAGUE_VS_SEEKER_", "").toLowerCase(),
      zh: zh.replace(/\s+/g, ""),
      cp,
      standard: Boolean(STANDARD[id]),
      icon: await cupIcon(league.iconUrl),
      rules,
      source: source ? "pvpoke" : "derived",
      top,
    });
  }

  for (const cup of cups) {
    const baseZh = cup.zh.replace(/(：.+版)?(Remix|Rmix)$/, "");
    if (baseZh === cup.zh) continue;
    const base = allowedByCup.get(baseZh);
    const own = allowedByCup.get(cup.zh);
    const removed = [...base].filter((n) => !own.has(n));
    const added = [...own].filter((n) => !base.has(n));
    cup.diff = { base: baseZh, removed, added };
  }

  cups.sort((a, b) => b.standard - a.standard || a.cp - b.cp || a.zh.localeCompare(b.zh, "zh-Hant"));
  const moves = {};
  const missing = new Set();
  for (const cup of cups) {
    for (const entry of cup.top) {
      for (const move of entry[2]) {
        if (pvp.moves[move]) moves[move] = pvp.moves[move];
        else missing.add(move);
      }
    }
  }
  if (missing.size) console.log(`moves missing from pvp.json: ${[...missing].join(" ")}`);
  writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), ids, moves, cups }));
  console.log(`cups ${cups.length} (pvpoke ${cups.filter((c) => c.source === "pvpoke").length}), ids ${ids.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
