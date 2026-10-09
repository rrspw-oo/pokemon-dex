import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, "../src/data/complete_pokemon_database.json");
const CACHE_DIR = resolve(__dirname, "../node_modules/.cache/pokeapi");
const API = "https://pokeapi.co/api/v2";
const CONCURRENCY = 16;
const SPRITE_PREFIX = "/sprites/pokemon/";
const STAT_KEYS = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
const DB_STAT_KEYS = ["hp", "attack", "defense", "sp_attack", "sp_defense", "speed"];
const FORM_ZH = {
  hisui: "洗翠",
  paldea: "帕底亞",
  "combat-breed": "鬥戰種",
  "blaze-breed": "火熾種",
  "aqua-breed": "水瀾種",
  origin: "起源形態",
  "white-striped": "白條紋",
  therian: "靈獸形態",
  female: "雌性",
  "family-of-three": "三隻家庭",
  "blue-plumage": "藍羽毛",
  "yellow-plumage": "黃羽毛",
  "white-plumage": "白羽毛",
  "three-segment": "三節形態",
  roaming: "徒步形態",
  droopy: "下垂姿勢",
  stretchy: "平挺姿勢",
  sandy: "砂土蓑衣",
  trash: "垃圾蓑衣",
};
const FORM_ZH_OVERRIDE = {
  "darmanitan-galar-zen": "達摩狒狒(伽勒爾・達摩模式)",
};

mkdirSync(CACHE_DIR, { recursive: true });

async function getJson(url) {
  const file = resolve(CACHE_DIR, url.replace(API, "").replace(/[^a-z0-9]+/gi, "_") + ".json");
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      writeFileSync(file, JSON.stringify(json));
      return json;
    }
    if (res.status === 404) return null;
    await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
  }
  throw new Error(`Failed: ${url}`);
}

async function pool(items, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        results[i] = await worker(items[i]);
      }
    })
  );
  return results;
}

const stemOf = (url) => (url ? url.slice(url.indexOf(SPRITE_PREFIX) + SPRITE_PREFIX.length).replace(/\.png$/, "") : null);
const nameIn = (list, lang) => list?.find((n) => n.language.name === lang)?.name || null;
const tokens = (s) =>
  s
    .toLowerCase()
    .replace(/mid-night/g, "midnight")
    .replace(/♀/g, " female ")
    .replace(/♂/g, " male ")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);

function candidateFromPokemon(pokemon, form, isDefault) {
  return {
    name: form ? form.name : pokemon.name,
    pokemonName: pokemon.name,
    isDefault,
    types: pokemon.types.map((t) => t.type.name),
    stats: STAT_KEYS.map((k) => pokemon.stats.find((s) => s.stat.name === k).base_stat),
    sprite: stemOf(form?.sprites?.front_default) || stemOf(pokemon.sprites.front_default),
    shiny: stemOf(form?.sprites?.front_shiny) || stemOf(pokemon.sprites.front_shiny),
    formUrl: form ? null : pokemon.forms[0]?.url,
    form,
  };
}

async function buildCandidates(species, needForms) {
  const out = [];
  for (const variety of species.varieties) {
    if (variety.pokemon.name.endsWith("-gmax")) continue;
    const pokemon = await getJson(variety.pokemon.url);
    if (!pokemon) continue;
    out.push(candidateFromPokemon(pokemon, null, variety.is_default));
    if (!needForms) continue;
    if (variety.is_default && pokemon.sprites.front_female) {
      out.push({
        ...candidateFromPokemon(pokemon, null, false),
        name: `${pokemon.name}-female`,
        isDefault: false,
        sprite: stemOf(pokemon.sprites.front_female),
        shiny: stemOf(pokemon.sprites.front_shiny_female),
        female: true,
      });
    }
    for (const ref of pokemon.forms.slice(1)) {
      const form = await getJson(ref.url);
      if (form && form.sprites.front_default) out.push(candidateFromPokemon(pokemon, form, false));
    }
  }
  return out;
}

function score(entry, cand) {
  const types = entry.types.map((t) => t.toLowerCase());
  let s = 0;
  if (types.join("/") === cand.types.join("/")) s += 10;
  const stats = DB_STAT_KEYS.map((k) => entry.stats[k]);
  s += stats.filter((v, i) => v === cand.stats[i]).length;
  const nameTokens = new Set(tokens(entry.name_en));
  const extra = tokens(cand.name).filter((t) => !tokens(cand.name.split("-")[0]).includes(t));
  s += extra.filter((t) => nameTokens.has(t)).length * 20;
  if (cand.female) s += nameTokens.has("female") ? -1 : -5;
  if (cand.isDefault && !entry.is_variant) s += 1;
  return s;
}

function assign(entries, candidates) {
  const pairs = [];
  entries.forEach((e, ei) =>
    candidates.forEach((c, ci) => pairs.push({ ei, ci, s: score(e, c) }))
  );
  pairs.sort((a, b) => b.s - a.s || a.ci - b.ci || a.ei - b.ei);
  const usedE = new Set();
  const usedC = new Set();
  const result = new Array(entries.length);
  for (const p of pairs) {
    if (usedE.has(p.ei) || usedC.has(p.ci)) continue;
    usedE.add(p.ei);
    usedC.add(p.ci);
    result[p.ei] = { cand: candidates[p.ci], score: p.s };
  }
  return result;
}

function dictionaryZh(cand) {
  const keys = Object.keys(FORM_ZH).filter((k) => cand.name.includes(k));
  return keys.length ? keys.map((k) => FORM_ZH[k]).join("・") : null;
}

async function formNames(cand) {
  if (cand.female) return { zhForm: FORM_ZH.female };
  const form = cand.form || (cand.formUrl ? await getJson(cand.formUrl) : null);
  if (!form) return {};
  return {
    zhFull: nameIn(form.names, "zh-hant"),
    zhForm: nameIn(form.form_names, "zh-hant"),
    enFull: nameIn(form.names, "en"),
    enForm: nameIn(form.form_names, "en"),
  };
}

function compose(base, full, form) {
  if (full) return full;
  if (!form) return null;
  if (form.includes(base)) return form;
  return `${base}(${form})`;
}

async function main() {
  const db = JSON.parse(readFileSync(DB_PATH, "utf8"));
  const bySpecies = new Map();
  db.forEach((e) => {
    if (!bySpecies.has(e.id)) bySpecies.set(e.id, []);
    bySpecies.get(e.id).push(e);
  });

  const ids = [...bySpecies.keys()];
  const report = { nameFixes: [], unmatched: [], weak: [], statDiffs: [], typeDiffs: [], forms: [] };
  let done = 0;

  await pool(ids, async (id) => {
    const entries = bySpecies.get(id);
    const species = await getJson(`${API}/pokemon-species/${id}`);
    const multi = entries.length > 1;
    const candidates = await buildCandidates(species, multi);
    const matches = assign(entries, multi ? candidates : candidates.filter((c) => c.isDefault));
    const base = entries.find((e) => !e.is_variant) || entries[0];
    const speciesZh = nameIn(species.names, "zh-hant");
    const oldBaseZh = base.name_zh_tw.replace(/\(.*$/, "");
    if (speciesZh && !base.name_zh_tw.includes(speciesZh)) {
      report.nameFixes.push(`${id} ${oldBaseZh} -> ${speciesZh}`);
      for (const e of entries) e.name_zh_tw = e.name_zh_tw.replace(oldBaseZh, speciesZh);
    }
    const gmaxByName = new Map(
      species.varieties
        .filter((v) => v.pokemon.name.endsWith("-gmax"))
        .map((v) => [v.pokemon.name, v.pokemon.url])
    );

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const m = matches[i];
      delete entry.sprite;
      delete entry.shiny_sprite;
      delete entry.gmax_sprite;
      delete entry.form_zh;
      delete entry.form_en;
      if (!m) {
        report.unmatched.push(`${id} ${entry.name_en}`);
        continue;
      }
      const { cand } = m;
      if (cand.sprite !== String(id)) entry.sprite = cand.sprite;
      if (cand.shiny !== `shiny/${cand.sprite}`) report.unmatched.push(`${id} ${entry.name_en} shiny ${cand.shiny}`);
      if (multi && m.score < 10) report.weak.push(`${id} ${entry.name_en} -> ${cand.name} (score ${m.score})`);

      const gmaxUrl = gmaxByName.get(`${cand.pokemonName}-gmax`);
      if (gmaxUrl && !cand.female && cand.name === cand.pokemonName) {
        const gmax = await getJson(gmaxUrl);
        entry.gmax_sprite = stemOf(gmax.sprites.front_default);
      }

      const dbStats = DB_STAT_KEYS.map((k) => entry.stats[k]);
      if (dbStats.join() !== cand.stats.join()) {
        report.statDiffs.push(`${id} ${entry.name_en} [${cand.name}] db=${dbStats.join(",")} api=${cand.stats.join(",")}`);
        DB_STAT_KEYS.forEach((k, idx) => (entry.stats[k] = cand.stats[idx]));
        entry.total_stats = cand.stats.reduce((a, b) => a + b, 0);
      }
      const dbTypes = entry.types.map((t) => t.toLowerCase()).join("/");
      if (dbTypes !== cand.types.join("/")) report.typeDiffs.push(`${id} ${entry.name_en} [${cand.name}] db=${dbTypes} api=${cand.types.join("/")}`);

      if (multi && !cand.isDefault) {
        const names = await formNames(cand);
        const zh =
          FORM_ZH_OVERRIDE[cand.name] ||
          compose(base.name_zh_tw, names.zhFull, names.zhForm || dictionaryZh(cand));
        const enBase = base.name_en.replace(/\s*\(.*$/, "");
        const en = compose(enBase, names.enFull, names.enForm) || cand.name;
        if (entry.name_zh_tw === base.name_zh_tw && zh) entry.form_zh = zh.replace(/的樣子/g, "");
        if (entry.name_en === base.name_en || /^[a-z]/.test(entry.name_en)) entry.form_en = en;
        report.forms.push(`${id} ${entry.name_en} -> ${cand.name} sprite=${cand.sprite} zh=${entry.form_zh || entry.name_zh_tw} en=${entry.form_en || entry.name_en}`);
      }
    }
    done++;
    if (done % 100 === 0) process.stdout.write(`  ${done}/${ids.length}\n`);
  });

  writeFileSync(DB_PATH, JSON.stringify(db, null, 2) + "\n");
  writeFileSync(resolve(CACHE_DIR, "../forms-report.json"), JSON.stringify(report, null, 2));
  console.log(
    `entries ${db.length}, nameFixes ${report.nameFixes.length}, unmatched ${report.unmatched.length}, weak ${report.weak.length}, statDiffs ${report.statDiffs.length}, typeDiffs ${report.typeDiffs.length}, forms ${report.forms.length}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
