// Pokemon API service for fetching Pokemon data
import {
  getChineseNameSync,
  getChineseName,
  getEnglishName,
  searchPokemonNamesSync,
  ensureDataLoaded,
} from "../utils/pokemonNamesHelper";
import {
  getSpriteWithFallback,
  hasLocalSprite,
} from "../utils/localSpriteUtils";

const POKE_API_BASE = "https://pokeapi.co/api/v2";

// Enhanced cache with size limits and LRU eviction
class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// Cache for API responses with size limit
const apiCache = new LRUCache(100);

// Request coalescing to prevent duplicate API calls
const pendingRequests = new Map();

// Helper function for request coalescing
async function coalesceRequest(key, requestFn) {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const promise = requestFn();
  pendingRequests.set(key, promise);

  try {
    const result = await promise;
    pendingRequests.delete(key);
    return result;
  } catch (error) {
    pendingRequests.delete(key);
    throw error;
  }
}

// Initialize Pokemon data loading
ensureDataLoaded().catch(() => {});

// Generate placeholder pixel sprite
function generatePlaceholderSprite(pokemonName, isSearchError = false) {
  // Use different image for search errors (Image #3 instead of Image #2)
  if (isSearchError) {
    return "/pokemonBall.svg"; // Replace Image #2 with Image #3 during search errors
  }

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated;">
      <rect width="64" height="64" fill="#e0e0e0" stroke="#999" stroke-width="1"/>
      <rect x="8" y="8" width="48" height="48" fill="#f5f5f5" stroke="#ccc" stroke-width="1"/>
      <circle cx="20" cy="24" r="3" fill="#333"/>
      <circle cx="44" cy="24" r="3" fill="#333"/>
      <rect x="28" y="32" width="8" height="4" fill="#666" rx="2"/>
      <text x="32" y="52" text-anchor="middle" dominant-baseline="central"
            font-family="monospace" font-size="8" fill="#666">
        ${pokemonName ? pokemonName.substring(0, 6) : "???"}
      </text>
    </svg>
  `)}`;
}

// Input validation function
function validatePokemonIdentifier(idOrName) {
  if (!idOrName) return false;

  const identifier = idOrName.toString().trim();

  // Check for empty string
  if (!identifier) return false;

  // Check if it's a valid number (Pokemon ID)
  if (/^\d+$/.test(identifier)) {
    const id = parseInt(identifier);
    return id >= 1 && id <= 1025; // Valid Pokemon ID range
  }

  // Check if it's a valid Pokemon name (only letters, hyphens, and spaces)
  if (!/^[a-zA-Z\s\-.']+$/.test(identifier)) {
    return false;
  }

  // Additional check for problematic characters
  const problematicChars = /[ㄅ-ㄭㄱ-ㅎㅏ-ㅣ가-힣一-龯]/;
  if (problematicChars.test(identifier)) {
    return false;
  }

  return true;
}

// Fetch Pokemon by ID or name (single Pokémon)
export async function fetchPokemonById(idOrName) {
  if (!validatePokemonIdentifier(idOrName)) {
    throw new Error(`Invalid Pokemon identifier: ${idOrName}`);
  }

  const cacheKey = `pokemon_${idOrName}`;

  if (apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }

  // Use request coalescing to prevent duplicate API calls
  return coalesceRequest(cacheKey, async () => {
    try {
    const sanitizedId = idOrName.toString().toLowerCase().trim();
    const response = await fetch(`${POKE_API_BASE}/pokemon/${sanitizedId}`);
    if (!response.ok) {
      throw new Error(`Pokemon not found: ${idOrName}`);
    }

    const pokemon = await response.json();
    // Get Chinese and English names using enhanced helpers
    const chineseName = await getChineseName(pokemon.id, pokemon.name);
    const englishName = await getEnglishName(pokemon.id, pokemon.name);

    const spriteData = getSpriteWithFallback(pokemon.id, pokemon.name);

    const result = {
      id: pokemon.id,
      name: pokemon.name,
      chineseName: chineseName,
      englishName: englishName,
      image: pokemon.sprites?.other?.["official-artwork"]?.front_default || spriteData.primary,
      imageFallback: pokemon.sprites?.front_default || spriteData.fallback,
      imageAlternatives: spriteData.alternatives, // Pass through alternative URLs
      isLocalSprite: spriteData.isLocal,
      hasLocalSprite: hasLocalSprite(),
      originalImage:
        pokemon.sprites?.other?.["official-artwork"]?.front_default ||
        pokemon.sprites?.front_default,
      // Add shiny sprite support
      shinyImage:
        pokemon.sprites?.other?.["official-artwork"]?.front_shiny ||
        pokemon.sprites?.front_shiny,
      hasShinySprite: !!(
        pokemon.sprites?.other?.["official-artwork"]?.front_shiny ||
        pokemon.sprites?.front_shiny
      ),
      types: pokemon.types.map((type) => ({
        name: type.type.name,
        chinese: getTypeChineseName(type.type.name),
      })),
      height: pokemon.height,
      weight: pokemon.weight,
      stats: pokemon.stats.map((stat) => ({
        name: stat.stat.name,
        value: stat.base_stat,
      })),
      // Add debug info for troubleshooting
      spriteDebugInfo: spriteData.debugInfo,
    };

    apiCache.set(cacheKey, result);
    return result;
  } catch (error) {

    const chineseName =
      getChineseNameSync(idOrName) || `未知寶可夢 (${idOrName})`;
    const spriteData = getSpriteWithFallback(idOrName, chineseName, true);

    return {
      id: parseInt(idOrName) || 0,
      name: idOrName.toString(),
      chineseName: chineseName,
      englishName: idOrName.toString(),
      image: spriteData.placeholder || spriteData.fallback,
      imageFallback: spriteData.placeholder || spriteData.fallback,
      imageAlternatives: spriteData.alternatives || [], // Include alternatives even in error case
      isLocalSprite: false,
      hasLocalSprite: hasLocalSprite(),
      // Add shiny sprite fallback for error cases
      shinyImage: null,
      hasShinySprite: false,
      types: [],
      height: 0,
      weight: 0,
      stats: [],
      error: true,
      errorMessage: `無法載入寶可夢資料: ${error.message}`,
      spriteDebugInfo: spriteData.debugInfo,
    };
    }
  });
}

// Search Pokemon by query (supports Chinese, English, and ID with forms and evolution chains)
export async function searchPokemon(query, includeEvolutions = false, maxResults = 20) {
  if (!query || query.length < 1) return [];

  const cacheKey = `search_${query}_${includeEvolutions}_${maxResults}`;

  if (apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }

  try {
    // Ensure Pokemon data is loaded
    await ensureDataLoaded();

    // If query is a number, fetch all forms for that ID
    if (/^\d+$/.test(query)) {
      const id = parseInt(query, 10);

      if (!validatePokemonIdentifier(id)) {
        throw new Error(`Invalid Pokemon ID: ${id}`);
      }

      // Fetch species data to get all forms and base ID
      const speciesResponse = await fetch(
        `${POKE_API_BASE}/pokemon-species/${id}`
      );
      if (!speciesResponse.ok) {
        throw new Error(`Species not found for ID: ${id}`);
      }
      const speciesData = await speciesResponse.json();
      const baseId = speciesData.id; // Base ID (e.g., 741 for Oricorio)

      // Get all form names from varieties
      const forms = speciesData.varieties.map(
        (variety) => variety.pokemon.name
      );

      // Fetch data for each form
      const promises = forms.map(async (formName) => {
        try {
          const pokemon = await fetchPokemonById(formName);
          // Override id to base ID
          pokemon.id = baseId;
          // Use enhanced Chinese name lookup for all forms
          pokemon.chineseName = await getChineseName(pokemon.id, formName);
          pokemon.is_variant = formName !== "oricorio-baile"; // Mark non-baile as variants
          return pokemon;
        } catch (error) {
          return null;
        }
      });

      const results = await Promise.all(promises);
      let validResults = results.filter((result) => result !== null && !result.error);

      if (validResults.length === 0) {
        throw new Error(`No forms found for ID ${id}`);
      }

      // If evolution forms are requested, add evolution chain
      if (includeEvolutions && validResults.length > 0) {
        try {
          const evolutionChain = await fetchCompleteEvolutionChain(id);

          // Filter out current Pokemon forms to avoid duplicates and errors
          const currentFormNames = validResults.map(
            (r) => r.englishName?.toLowerCase() || r.name?.toLowerCase()
          );
          const evolutions = evolutionChain.filter((evolution) => {
            const evolutionName =
              evolution.englishName?.toLowerCase() ||
              evolution.name?.toLowerCase();
            return !currentFormNames.includes(evolutionName) && !evolution.error;
          });

          validResults = [...validResults, ...evolutions];

          // Sort by Pokemon ID to maintain consistent ordering
          validResults.sort((a, b) => a.id - b.id);
        } catch (evolutionError) {
        }
      }

      apiCache.set(cacheKey, validResults);
      return validResults;
    }

    // Enhanced logic for name search - supports all forms for Chinese names
    const nameMatches = searchPokemonNamesSync(query);

    if (nameMatches.length > 0) {
      // For Chinese name search, get all forms for each matched ID
      const allFormsToFetch = [];
      const processedIds = new Set();

      // 並行處理species API呼叫以提升效能，限制處理數量
      const speciesPromises = nameMatches.slice(0, Math.min(maxResults, 15)).map(async (match) => {
        if (processedIds.has(match.id)) {
          return null;
        }
        processedIds.add(match.id);

        try {
          const speciesResponse = await fetch(
            `${POKE_API_BASE}/pokemon-species/${match.id}`
          );
          if (speciesResponse.ok) {
            const speciesData = await speciesResponse.json();
            const forms = speciesData.varieties.map(
              (variety) => variety.pokemon.name
            );

            // If multiple forms exist, return all forms
            if (forms.length > 1) {
              return forms.map((formName) => ({
                id: match.id,
                name: formName,
                isForm: true,
              }));
            } else {
              // Single form, use the match directly
              return [{
                id: match.id,
                name: match.en.toLowerCase(),
                isForm: false,
              }];
            }
          } else {
            // Fallback to direct ID fetch
            return [{
              id: match.id,
              name: match.id.toString(),
              isForm: false,
            }];
          }
        } catch (error) {
          return [{
            id: match.id,
            name: match.id.toString(),
            isForm: false,
          }];
        }
      });

      const speciesResults = await Promise.all(speciesPromises);
      // 扁平化結果並過濾null值
      speciesResults.forEach(result => {
        if (result) {
          allFormsToFetch.push(...result);
        }
      });

      const promises = allFormsToFetch.map(async (formData) => {
        try {
          const pokemon = await fetchPokemonById(formData.name);
          // Override ID to base ID for consistency
          pokemon.id = formData.id;
          return pokemon;
        } catch (error) {
          return null;
        }
      });

      const results = await Promise.all(promises);
      const validResults = results.filter((result) => result !== null && !result.error);

      // Deduplicate results by Chinese name and ID to avoid showing identical Pokemon
      const deduplicatedResults = [];
      const seen = new Set();

      for (const pokemon of validResults) {
        const key = `${pokemon.id}-${pokemon.chineseName}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduplicatedResults.push(pokemon);
        } else {
        }
      }

      let finalResults = deduplicatedResults.slice(0, maxResults);

      // If evolution forms are requested, add evolution chains for each result
      // 限制進化鏈載入的數量以提升效能
      if (includeEvolutions && finalResults.length > 0 && finalResults.length <= 3) {
        const evolutionPromises = finalResults.map(async (pokemon) => {
          try {
            const evolutionChain = await fetchCompleteEvolutionChain(
              pokemon.id
            );
            // Filter out the current Pokemon to avoid duplicates and errors
            return evolutionChain.filter(
              (evolution) => evolution.id !== pokemon.id && !evolution.error
            );
          } catch (error) {
            return [];
          }
        });

        const evolutionResults = await Promise.all(evolutionPromises);
        const allEvolutions = evolutionResults.flat();

        // Combine original results with evolution forms
        const combinedResults = [...finalResults, ...allEvolutions];

        // Remove duplicates again based on ID and name combination, and filter out errors
        const seenEvolutions = new Set();
        finalResults = combinedResults.filter((pokemon) => {
          const key = `${pokemon.id}-${pokemon.englishName || pokemon.name}`;
          if (seenEvolutions.has(key) || pokemon.error) {
            return false;
          }
          seenEvolutions.add(key);
          return true;
        });

        // Sort by Pokemon ID to maintain consistent ordering and limit final results
        finalResults.sort((a, b) => a.id - b.id);
        finalResults = finalResults.slice(0, maxResults);
      }

      apiCache.set(cacheKey, finalResults);
      return finalResults;
    }

    // Try direct API search for valid identifiers
    if (validatePokemonIdentifier(query)) {
      try {
        const pokemon = await fetchPokemonById(query);

        // Filter out error Pokemon - return empty array if the main Pokemon has error
        if (pokemon.error) {
          apiCache.set(cacheKey, []);
          return [];
        }

        let results = [pokemon];

        // If evolution forms are requested, add evolution chain
        if (includeEvolutions) {
          try {
            const evolutionChain = await fetchCompleteEvolutionChain(
              pokemon.id
            );
            // Filter out the current Pokemon to avoid duplicates and errors
            const evolutions = evolutionChain.filter(
              (evolution) => evolution.id !== pokemon.id && !evolution.error
            );
            results = [...results, ...evolutions];

            // Sort by Pokemon ID to maintain consistent ordering
            results.sort((a, b) => a.id - b.id);
          } catch (evolutionError) {
          }
        }

        apiCache.set(cacheKey, results);
        return results;
      } catch (error) {
        apiCache.set(cacheKey, []);
        return [];
      }
    } else {
      apiCache.set(cacheKey, []);
      return [];
    }
  } catch (error) {
    apiCache.set(cacheKey, []);
    return [];
  }
}

// Pokemon type Chinese names
function getTypeChineseName(englishType) {
  const typeMap = {
    normal: "一般",
    fire: "火",
    water: "水",
    electric: "電",
    grass: "草",
    ice: "冰",
    fighting: "格鬥",
    poison: "毒",
    ground: "地面",
    flying: "飛行",
    psychic: "超能力",
    bug: "蟲",
    rock: "岩石",
    ghost: "幽靈",
    dragon: "龍",
    dark: "惡",
    steel: "鋼",
    fairy: "妖精",
  };

  return typeMap[englishType.toLowerCase()] || englishType;
}

// Fetch evolution chain for a Pokemon
export async function fetchEvolutionChain(pokemonId) {
  const cacheKey = `evolution_${pokemonId}`;

  if (apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }

  try {
    // First get the species data to find evolution chain URL
    const speciesResponse = await fetch(
      `${POKE_API_BASE}/pokemon-species/${pokemonId}`
    );
    if (!speciesResponse.ok) {
      throw new Error(`Species not found: ${pokemonId}`);
    }

    const speciesData = await speciesResponse.json();
    const evolutionChainUrl = speciesData.evolution_chain.url;

    // Fetch the evolution chain
    const evolutionResponse = await fetch(evolutionChainUrl);
    if (!evolutionResponse.ok) {
      throw new Error(`Evolution chain not found`);
    }

    const evolutionData = await evolutionResponse.json();
    const evolutionChain = parseEvolutionChain(evolutionData.chain);

    apiCache.set(cacheKey, evolutionChain);
    return evolutionChain;
  } catch (error) {
    return [];
  }
}

// Parse evolution chain data recursively
function parseEvolutionChain(chainData) {
  const evolutionChain = [];

  function processEvolution(currentEvolution, stage = 0) {
    const pokemonName = currentEvolution.species.name;
    const pokemonId = extractIdFromUrl(currentEvolution.species.url);

    // Get evolution details
    const evolutionDetails = currentEvolution.evolution_details[0] || {};
    const evolutionTrigger = evolutionDetails.trigger?.name || null;
    const minLevel = evolutionDetails.min_level || null;
    const item = evolutionDetails.item?.name || null;
    const minHappiness = evolutionDetails.min_happiness || null;
    const timeOfDay = evolutionDetails.time_of_day || null;

    const evolutionInfo = {
      id: pokemonId,
      name: pokemonName,
      stage: stage,
      evolutionTrigger,
      minLevel,
      item,
      minHappiness,
      timeOfDay,
      // Will be populated when we fetch Pokemon data
      chineseName: null,
      englishName: null,
      image: null,
    };

    evolutionChain.push(evolutionInfo);

    // Process next evolutions
    if (currentEvolution.evolves_to && currentEvolution.evolves_to.length > 0) {
      currentEvolution.evolves_to.forEach((nextEvolution) => {
        processEvolution(nextEvolution, stage + 1);
      });
    }
  }

  processEvolution(chainData);
  return evolutionChain;
}

// Helper function to extract ID from Pokemon species URL
function extractIdFromUrl(url) {
  const matches = url.match(/\/(\d+)\/$/);
  return matches ? parseInt(matches[1]) : null;
}

// Get evolution requirements in Chinese
export function getEvolutionRequirementText(evolutionInfo) {
  if (!evolutionInfo.evolutionTrigger) {
    return "基本型態";
  }

  const requirements = [];

  switch (evolutionInfo.evolutionTrigger) {
    case "level-up":
      if (evolutionInfo.minLevel) {
        requirements.push(`等級 ${evolutionInfo.minLevel}`);
      }
      if (evolutionInfo.minHappiness) {
        requirements.push(`親密度 ${evolutionInfo.minHappiness}`);
      }
      if (evolutionInfo.timeOfDay) {
        const timeText = evolutionInfo.timeOfDay === "day" ? "白天" : "夜晚";
        requirements.push(timeText);
      }
      break;
    case "use-item":
      if (evolutionInfo.item) {
        const itemText = getItemChineseName(evolutionInfo.item);
        requirements.push(`使用 ${itemText}`);
      }
      break;
    case "trade":
      requirements.push("交換");
      if (evolutionInfo.item) {
        const itemText = getItemChineseName(evolutionInfo.item);
        requirements.push(`攜帶 ${itemText}`);
      }
      break;
    default:
      requirements.push("特殊條件");
  }

  return requirements.length > 0 ? requirements.join("，") : "進化條件";
}

// Get item Chinese name
function getItemChineseName(itemName) {
  const itemMap = {
    "thunder-stone": "雷之石",
    "fire-stone": "火之石",
    "water-stone": "水之石",
    "leaf-stone": "葉之石",
    "moon-stone": "月之石",
    "sun-stone": "日之石",
    "shiny-stone": "光之石",
    "dusk-stone": "暗之石",
    "dawn-stone": "覺醒石",
    "ice-stone": "冰之石",
    "kings-rock": "王者之證",
    "metal-coat": "金屬膜",
    "dragon-scale": "龍之鱗片",
    "up-grade": "升級資料",
    "dubious-disc": "可疑修正檔",
    "prism-scale": "美麗鱗片",
    "reaper-cloth": "靈界之布",
    electirizer: "電力增強器",
    magmarizer: "熔岩增強器",
    protector: "護具",
    "razor-claw": "銳利之爪",
    "razor-fang": "銳利之牙",
  };

  return itemMap[itemName] || itemName;
}

// Fetch complete evolution chain with Pokemon data
export async function fetchCompleteEvolutionChain(pokemonId) {
  try {
    const evolutionChain = await fetchEvolutionChain(pokemonId);

    // Fetch Pokemon data for each evolution
    const promises = evolutionChain.map(async (evolution) => {
      try {
        const pokemon = await fetchPokemonById(evolution.id);
        return {
          ...evolution,
          chineseName: pokemon.chineseName,
          englishName: pokemon.englishName,
          image: pokemon.image,
          types: pokemon.types,
          // Add shiny sprite support for evolution chain
          shinyImage: pokemon.shinyImage,
          hasShinySprite: pokemon.hasShinySprite,
          imageFallback: pokemon.imageFallback,
          imageAlternatives: pokemon.imageAlternatives,
          isLocalSprite: pokemon.isLocalSprite,
          hasLocalSprite: pokemon.hasLocalSprite,
          originalImage: pokemon.originalImage,
          height: pokemon.height,
          weight: pokemon.weight,
          stats: pokemon.stats,
        };
      } catch (error) {
        return {
          ...evolution,
          chineseName: `未知寶可夢 ${evolution.id}`,
          englishName: evolution.name,
          image: generatePlaceholderSprite(evolution.name, true),
          types: [],
          // Add shiny sprite fallback for error cases
          shinyImage: null,
          hasShinySprite: false,
          imageFallback: generatePlaceholderSprite(evolution.name, true),
          imageAlternatives: [],
          isLocalSprite: false,
          hasLocalSprite: false,
          originalImage: null,
          height: 0,
          weight: 0,
          stats: [],
          error: true,
        };
      }
    });

    const completeEvolutionChain = await Promise.all(promises);
    return completeEvolutionChain;
  } catch (error) {
    return [];
  }
}

// Get type color for styling
export function getTypeColor(typeName) {
  const typeColors = {
    normal: "#A8A878",
    fire: "#F08030",
    water: "#6890F0",
    electric: "#F8D030",
    grass: "#78C850",
    ice: "#98D8D8",
    fighting: "#C03028",
    poison: "#A040A0",
    ground: "#E0C068",
    flying: "#A890F0",
    psychic: "#F85888",
    bug: "#A8B820",
    rock: "#B8A038",
    ghost: "#705898",
    dragon: "#7038F8",
    dark: "#705848",
    steel: "#B8B8D0",
    fairy: "#EE99AC",
  };

  return typeColors[typeName.toLowerCase()] || "#68A090";
}

// Search Pokemon forms and variants for a specific Pokemon ID
export async function searchPokemonForms(pokemonId) {
  const cacheKey = `forms_${pokemonId}`;

  // Check cache first
  if (apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }

  try {
    await ensureDataLoaded();

    const id = parseInt(pokemonId);
    const results = [];
    const seenEntries = new Set();

    // Step 1: Get evolution chain
    try {
      const evolutionChain = await fetchCompleteEvolutionChain(id);

      for (const evolution of evolutionChain) {
        if (!evolution.error && !seenEntries.has(evolution.id)) {
          seenEntries.add(evolution.id);
          results.push(evolution);
        }
      }
    } catch (evolutionError) {
      // Evolution chain fetch failed, continue with variants
    }

    // Step 2: Get API variants from PokeAPI species for the specific Pokemon
    try {
      const speciesResponse = await fetch(`${POKE_API_BASE}/pokemon-species/${id}`);
      if (speciesResponse.ok) {
        const speciesData = await speciesResponse.json();
        const varieties = speciesData.varieties || [];

        for (const variety of varieties) {
          try {
            const variantPokemon = await fetchPokemonById(variety.pokemon.name);

            // Skip if Pokemon data has error flag
            if (variantPokemon.error) {
              continue;
            }

            // Override ID to maintain consistency
            variantPokemon.id = id;
            variantPokemon.is_api_variant = true;

            // Use existing sprite system for API variants
            const variantName = variety.pokemon.name;
            const spriteData = getSpriteWithFallback(variantPokemon.id, variantName);

            // Check if this is a mega/gmax special form
            const isMegaOrGmax = variantName.includes('-mega') || variantName.includes('-gmax');

            if (isMegaOrGmax) {
              // For mega/gmax, prioritize PokeAPI official artwork like in fetchPokemonById
              variantPokemon.image = variantPokemon.originalImage || spriteData.primary;
              variantPokemon.imageFallback = variantPokemon.sprites?.front_default || spriteData.fallback;
            } else {
              // For other forms, use existing sprite system logic
              variantPokemon.image = spriteData.primary;
              variantPokemon.imageFallback = spriteData.fallback;
            }
            variantPokemon.imageAlternatives = spriteData.alternatives;
            variantPokemon.isLocalSprite = spriteData.isLocal;


            // Check if this variant is already in results
            const exists = results.find(r =>
              r.id === variantPokemon.id &&
              r.englishName === variantPokemon.englishName
            );

            if (!exists) {
              results.push(variantPokemon);
            }
          } catch (variantError) {
            // Variant fetch failed, continue with next
          }
        }
      }
    } catch (apiError) {
      // API species fetch failed, continue with current results
    }

    apiCache.set(cacheKey, results);
    return results;

  } catch (error) {
    // Fallback: try to get at least the base Pokemon
    try {
      const basePokemon = await fetchPokemonById(pokemonId.toString());
      const fallbackResult = [basePokemon];
      apiCache.set(cacheKey, fallbackResult);
      return fallbackResult;
    } catch (fallbackError) {
      apiCache.set(cacheKey, []);
      return [];
    }
  }
}

// Get search suggestions for autocomplete (minimal implementation)
export async function getPokemonSearchSuggestions(query, maxSuggestions = 5) {
  try {
    await ensureDataLoaded();

    // Use the existing searchPokemonNamesSync function for suggestions
    const { getSearchSuggestions, isValidSearchQuery } = await import('../utils/pokemonNamesHelper.js');

    // Validate the search query
    if (!isValidSearchQuery || !isValidSearchQuery(query)) {
      return [];
    }

    // Get suggestions from the helper
    return getSearchSuggestions ? getSearchSuggestions(query, maxSuggestions) : [];
  } catch (error) {
    return [];
  }
}
