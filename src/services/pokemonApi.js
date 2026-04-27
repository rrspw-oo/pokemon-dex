import { search as indexSearch, suggest as indexSuggest, getById } from "../utils/searchIndex";
import { getSpriteWithFallback, hasLocalSprite } from "../utils/localSpriteUtils";
import { searchCustomPokemon } from "../data/customPokemon";

const TYPE_ZH = {
  normal: "一般", fire: "火", water: "水", electric: "電", grass: "草",
  ice: "冰", fighting: "格鬥", poison: "毒", ground: "地面", flying: "飛行",
  psychic: "超能力", bug: "蟲", rock: "岩石", ghost: "幽靈", dragon: "龍",
  dark: "惡", steel: "鋼", fairy: "妖精", meow: "喵",
};

const TYPE_COLOR = {
  normal: "#A8A878", fire: "#F08030", water: "#6890F0", electric: "#F8D030",
  grass: "#78C850", ice: "#98D8D8", fighting: "#C03028", poison: "#A040A0",
  ground: "#E0C068", flying: "#A890F0", psychic: "#F85888", bug: "#A8B820",
  rock: "#B8A038", ghost: "#705898", dragon: "#7038F8", dark: "#705848",
  steel: "#B8B8D0", fairy: "#EE99AC", meow: "#FF69B4",
};

export function getTypeColor(typeName) {
  return TYPE_COLOR[(typeName || "").toLowerCase()] || "#68A090";
}

function spriteUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

function shinyUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`;
}

function pixelUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

function buildPokemon(entry) {
  const id = entry.id;
  const types = (entry.types || []).map((t) => ({
    name: t.toLowerCase(),
    chinese: TYPE_ZH[t.toLowerCase()] || t,
  }));
  const localSprite = getSpriteWithFallback(id, entry.name_en);
  const stats = entry.stats
    ? [
        { name: "hp", value: entry.stats.hp },
        { name: "attack", value: entry.stats.attack },
        { name: "defense", value: entry.stats.defense },
        { name: "sp_attack", value: entry.stats.sp_attack },
        { name: "sp_defense", value: entry.stats.sp_defense },
        { name: "speed", value: entry.stats.speed },
      ]
    : [];
  return {
    id,
    name: entry.name_en,
    chineseName: entry.name_zh_tw,
    englishName: entry.name_en,
    image: localSprite.primary || spriteUrl(id),
    imageFallback: localSprite.fallback || pixelUrl(id),
    imageAlternatives: localSprite.alternatives || [pixelUrl(id)],
    isLocalSprite: localSprite.isLocal,
    hasLocalSprite: hasLocalSprite(),
    originalImage: spriteUrl(id),
    shinyImage: shinyUrl(id),
    hasShinySprite: true,
    hasPixelShiny: false,
    types,
    height: 0,
    weight: 0,
    stats,
    total_stats: entry.total_stats,
    is_variant: !!entry.is_variant,
    error: false,
  };
}

function buildCustom(customPokemon) {
  return {
    id: customPokemon.id,
    name: customPokemon.name_en,
    englishName: customPokemon.name_en,
    chineseName: customPokemon.name_zh_tw,
    types: customPokemon.types.map((t) => ({
      name: t.toLowerCase(),
      chinese: TYPE_ZH[t.toLowerCase()] || t,
    })),
    stats: customPokemon.stats,
    total_stats: customPokemon.total_stats,
    image: customPokemon.image,
    shinyImage: customPokemon.shinyImage,
    gmaxImage: customPokemon.gmaxImage,
    hasShinySprite: customPokemon.hasShinySprite,
    hasGmaxForm: customPokemon.hasGmaxForm,
    is_variant: customPokemon.is_variant,
    is_custom: true,
    error: false,
  };
}

export function searchPokemon(query, _includeEvolutions = false, maxResults = 50) {
  if (!query) return Promise.resolve([]);
  const customResults = searchCustomPokemon(query);
  if (customResults.length > 0) {
    return Promise.resolve(customResults.map(buildCustom));
  }
  const entries = indexSearch(query, maxResults);
  return Promise.resolve(entries.map(buildPokemon));
}

export function searchPokemonForms(pokemonId) {
  const entries = getById(pokemonId);
  return Promise.resolve(entries.map(buildPokemon));
}

export function fetchPokemonById(idOrName) {
  if (/^\d+$/.test(String(idOrName))) {
    const entries = getById(idOrName);
    if (entries.length) return Promise.resolve(buildPokemon(entries[0]));
  }
  const entries = indexSearch(String(idOrName), 1);
  if (entries.length) return Promise.resolve(buildPokemon(entries[0]));
  return Promise.resolve(null);
}

export function getPokemonSearchSuggestions(query, maxSuggestions = 8) {
  if (!query) return Promise.resolve([]);
  const customResults = searchCustomPokemon(query);
  if (customResults.length > 0) return Promise.resolve([]);
  return Promise.resolve(indexSuggest(query, maxSuggestions));
}

export function getEvolutionRequirementText() {
  return "";
}

export function fetchEvolutionChain() {
  return Promise.resolve([]);
}

export function fetchCompleteEvolutionChain() {
  return Promise.resolve([]);
}
