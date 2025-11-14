import vankImage from '../customContent/VANKNN.png';
import vankShinyImage from '../customContent/VANKNN_shinny.png';
import vankGmaxImage from '../customContent/VANKNN G-MAX.png';

const customPokemon = [
  {
    id: 101010,
    name_en: 'VANK',
    name_zh_tw: 'VANK',
    types: ['Fairy', 'Grass'],
    image: vankImage,
    shinyImage: vankShinyImage,
    gmaxImage: vankGmaxImage,
    hasShinySprite: true,
    hasGmaxForm: true,
    stats: [
      { name: 'hp', value: 100 },
      { name: 'attack', value: 100 },
      { name: 'defense', value: 100 },
      { name: 'special-attack', value: 100 },
      { name: 'special-defense', value: 100 },
      { name: 'speed', value: 100 }
    ],
    total_stats: 600,
    is_variant: false,
    is_custom: true,
    search_rules: {
      exact_match_only: true,
      exclude_from_type_search: true,
      allowed_queries: ['VANK', 'vank', '101010']
    }
  }
];

export function getCustomPokemon() {
  return customPokemon;
}

export function searchCustomPokemon(query) {
  if (!query || typeof query !== 'string') {
    return [];
  }

  const normalizedQuery = query.trim();

  const matchedPokemon = customPokemon.filter(pokemon => {
    const { allowed_queries } = pokemon.search_rules;
    return allowed_queries.some(allowedQuery =>
      normalizedQuery === allowedQuery
    );
  });

  return matchedPokemon;
}

export function isCustomPokemonId(id) {
  return customPokemon.some(pokemon => pokemon.id === parseInt(id));
}

export function getCustomPokemonById(id) {
  return customPokemon.find(pokemon => pokemon.id === parseInt(id));
}

export default customPokemon;
