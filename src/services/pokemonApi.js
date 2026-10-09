import { search, getById, getByKey, records } from "../utils/searchIndex";
import { searchCustomPokemon, getCustomPokemon } from "../data/customPokemon";
import { getEvolutionChainForSpecies } from "../utils/evolutionIndex";
import goEvolutions from "../data/go_evolutions.json";
import goForms from "../data/go_forms.json";
import { TYPE_ZH, TYPE_COLOR } from "../utils/types";

const SPRITE_CDN = "https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/";
const SPRITE_RAW = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";

const spriteUrls = (stem) => (stem ? [`${SPRITE_RAW}${stem}.png`, `${SPRITE_CDN}${stem}.png`] : []);

const toTypes = (types) =>
  types.map((t) => {
    const name = t.toLowerCase();
    return { name, zh: TYPE_ZH[name] || t, color: TYPE_COLOR[name] || "#68A090" };
  });

function fromRecord(r) {
  const sprite = r.sprite || String(r.id);
  return {
    key: r.key,
    id: r.id,
    zh: r.zh,
    en: r.en,
    types: toTypes(r.types),
    stats: r.stats,
    total: r.total_stats,
    image: spriteUrls(sprite),
    shinyImage: spriteUrls(`shiny/${sprite}`),
    gmaxImage: spriteUrls(r.gmax_sprite),
    goId: r.go_id || null,
    hint: r.hint || null,
    isVariant: !!r.is_variant,
    isCustom: false,
  };
}

function fromCustom(c) {
  return {
    key: `custom-${c.id}`,
    id: c.id,
    zh: c.name_zh_tw,
    en: c.name_en,
    types: toTypes(c.types),
    stats: Object.fromEntries(c.stats.map((s) => [s.name.replace("special-", "sp_"), s.value])),
    total: c.total_stats,
    image: [c.image],
    shinyImage: c.shinyImage ? [c.shinyImage] : [],
    gmaxImage: c.gmaxImage ? [c.gmaxImage] : [],
    isVariant: false,
    isCustom: true,
  };
}

export function searchPokemon(query) {
  const custom = searchCustomPokemon(query);
  if (custom.length) return custom.map(fromCustom);
  return search(query).map(fromRecord);
}

export function suggestPokemon(query, limit = 8) {
  if (searchCustomPokemon(query).length) return [];
  return search(query).slice(0, limit).map(fromRecord);
}

export function getPokemonByKey(key) {
  if (typeof key === "string" && key.startsWith("custom-")) {
    const c = getCustomPokemon().find((p) => `custom-${p.id}` === key);
    return c ? fromCustom(c) : null;
  }
  const r = getByKey(key);
  return r ? fromRecord(r) : null;
}

export function getFamily(pokemon) {
  if (pokemon.isCustom) return { forms: [], stages: [] };
  const forms = getById(pokemon.id).filter((r) => r.key !== pokemon.key).map(fromRecord);
  const chain = getEvolutionChainForSpecies(pokemon.id);
  if (chain.length < 2) return { forms, stages: [] };
  const stages = [];
  for (const node of chain) {
    const base = getById(node.id)[0];
    if (!base) continue;
    if (!stages[node.stage]) stages[node.stage] = [];
    stages[node.stage].push({
      pokemon: fromRecord(base),
      isBase: node.stage === 0,
      go: goEvolutions.byTarget[node.id] || null,
    });
  }
  return { forms, stages: stages.filter(Boolean) };
}

const recordBySprite = new Map(records.map((r) => [r.sprite || String(r.id), r]));

export function getFormChanges(pokemon) {
  const data = !pokemon.isCustom && goForms[pokemon.id];
  if (!data) return null;
  const forms = data.forms.map((f) => {
    const record = recordBySprite.get(f.sprite);
    return {
      id: f.id,
      options: data.to[f.id] || [],
      pokemon: record ? fromRecord(record) : { key: `form-${f.id}`, id: pokemon.id, zh: f.zh, image: spriteUrls(f.sprite) },
      linked: !!record,
      label: f.zh,
    };
  });
  return { forms, linkedKeys: new Set(forms.filter((f) => f.linked).map((f) => f.pokemon.key)) };
}
