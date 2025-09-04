// Pokemon names helper for JSON data
// Provides the same API as the original pokemonNames.js

let pokemonData = null;

// Import the complete Pokemon database
import completePokemonDatabase from "../data/complete_pokemon_database.json";

// Transform complete database to name-focused structure
function transformPokemonData(completeDatabase) {
  const pokemon = {};
  const searchIndex = { zh: {}, en: {} };

  // Process each Pokemon, keeping only base forms (is_variant: false) for main data
  // but include all forms for search
  completeDatabase.forEach((entry) => {
    const id = entry.id.toString();

    // Always include in search index for comprehensive search
    const zhName = entry.name_zh_tw;
    const enName = entry.name_en;

    // Build Chinese search index
    if (zhName) {
      for (let char of zhName) {
        if (!searchIndex.zh[char]) searchIndex.zh[char] = [];
        if (!searchIndex.zh[char].includes(id)) {
          searchIndex.zh[char].push(id);
        }
      }
    }

    // Build English search index
    if (enName) {
      const words = enName.toLowerCase().split(/[\s-]/);
      words.forEach((word) => {
        if (word) {
          if (!searchIndex.en[word]) searchIndex.en[word] = [];
          if (!searchIndex.en[word].includes(id)) {
            searchIndex.en[word].push(id);
          }
        }
      });
    }

    // Only store base forms in main pokemon object (avoid duplicate entries)
    if (!entry.is_variant && zhName && enName) {
      pokemon[id] = {
        zh: zhName,
        en: enName,
      };
    }
  });

  return {
    version: "2.0.0",
    lastUpdated: new Date().toISOString().split("T")[0],
    totalCount: Object.keys(pokemon).length,
    pokemon,
    searchIndex,
    complete: completeDatabase, // Keep reference to complete data
  };
}

// Lazy load the JSON data
async function loadPokemonData() {
  if (!pokemonData) {
    try {
      pokemonData = transformPokemonData(completePokemonDatabase);
    } catch (error) {
      console.error("Error loading Pokemon data:", error);
      // Fallback to empty data structure
      pokemonData = {
        version: "2.0.0",
        lastUpdated: new Date().toISOString().split("T")[0],
        totalCount: 0,
        pokemon: {},
        searchIndex: { zh: {}, en: {} },
        complete: [],
      };
    }
  }
  return pokemonData;
}

// Export the pokemon names object for backward compatibility
export const pokemonNames = new Proxy(
  {},
  {
    get(_, prop) {
      // For synchronous access, we need to check if data is loaded
      if (pokemonData && pokemonData.pokemon) {
        return pokemonData.pokemon[prop];
      }
      // If data not loaded, return undefined (matches original behavior)
      return undefined;
    },
    has(_, prop) {
      return pokemonData?.pokemon && prop in pokemonData.pokemon;
    },
    ownKeys() {
      return pokemonData?.pokemon ? Object.keys(pokemonData.pokemon) : [];
    },
    getOwnPropertyDescriptor(_, prop) {
      if (pokemonData?.pokemon && prop in pokemonData.pokemon) {
        return {
          enumerable: true,
          configurable: true,
          value: pokemonData.pokemon[prop],
        };
      }
      return undefined;
    },
  }
);

// Initialize data loading
let dataLoadingPromise = null;

// Ensure data is loaded before using other functions
export async function ensureDataLoaded() {
  if (!dataLoadingPromise) {
    dataLoadingPromise = loadPokemonData();
  }
  return dataLoadingPromise;
}

// PokeAPI name to Database name conversion mapping
function convertPokeApiNameToDbName(pokeApiName) {
  // Convert PokeAPI hyphen format to database format
  const conversions = {
    // Necrozma forms
    "necrozma-dusk": "Necrozma(Dusk Mane)",
    "necrozma-dawn": "Necrozma(Dawn Wings)",
    "necrozma-ultra": "Necrozma (Ultra)",

    // Lycanroc forms
    "lycanroc-midday": "Lycanroc (Midday)",
    "lycanroc-midnight": "Lycanroc (MidNight)",
    "lycanroc-dusk": "Lycanroc (Dusk)",

    // Oricorio forms
    "oricorio-baile": "Oricorio",
    "oricorio-pom-pom": "Oricorio",
    "oricorio-pau": "Oricorio",
    "oricorio-sensu": "Oricorio",

    // Wishiwashi forms
    "wishiwashi-solo": "Wishiwashi(Solo)",
    "wishiwashi-school": "Wishiwashi(School)",
    
    // Rockruff forms
    "rockruff": "Rockruff",
    "rockruff-own-tempo": "Rockruff",

    // Minior forms
    "minior-red-meteor": "Minior(Meteor)",
    "minior-red": "Minior(Red core)",
    "minior-orange-meteor": "Minior(Meteor)",
    "minior-orange": "Minior(Orange core)",
    "minior-yellow-meteor": "Minior(Meteor)",
    "minior-yellow": "Minior(Yellow core)",
    "minior-green-meteor": "Minior(Meteor)",
    "minior-green": "Minior(Green core)",
    "minior-blue-meteor": "Minior(Meteor)",
    "minior-blue": "Minior(Blue core)",
    "minior-indigo-meteor": "Minior(Meteor)",
    "minior-indigo": "Minior(Indigo core)",
    "minior-violet-meteor": "Minior(Meteor)",
    "minior-violet": "Minior(Violet core)",

    // Zygarde forms
    "zygarde-50": "Zygarde (50% )",
    "zygarde-10": "Zygarde(10%)",
    "zygarde-complete": "Zygarde(100%)",

    // Gimmighoul forms - need special handling for roaming vs chest
    "gimmighoul-chest": "Gimmighoul",
    "gimmighoul-roaming": "Gimmighoul",

    // Ogerpon forms
    "ogerpon-teal": "Ogerpon(Teal Mask)",
    "ogerpon-wellspring": "Ogerpon(Wellspring Mask)",
    "ogerpon-hearthflame": "Ogerpon(Hearthflame Mask)",
    "ogerpon-cornerstone": "Ogerpon(Cornerstone Mask)",

    // Terapagos forms
    "terapagos-normal": "Terapagos(Normal)",
    "terapagos-terastal": "Terapagos(Terastal )",
    "terapagos-stellar": "Terapagos(Stellar Form)",

    // Paradox Pokemon - Ancient Forms (past paradox)
    "great-tusk": "Great Tusk",
    "scream-tail": "Scream Tail", 
    "brute-bonnet": "Brute Bonnet",
    "flutter-mane": "Flutter Mane",
    "slither-wing": "Slither Wing",
    "sandy-shocks": "Sandy Shocks",
    "roaring-moon": "Roaring Moon",

    // Paradox Pokemon - Future Forms (future paradox)
    "iron-treads": "Iron Treads",
    "iron-bundle": "Iron Bundle",
    "iron-hands": "Iron Hands",
    "iron-jugulis": "Iron Jugulis",
    "iron-moth": "Iron Moth",
    "iron-thorns": "Iron Thorns",
    "iron-valiant": "Iron Valiant",

    // Additional Paradox Pokemon from DLC
    "walking-wake": "Walking Wake",
    "iron-leaves": "Iron Leaves",
    "gouging-fire": "Gouging Fire",
    "raging-bolt": "Raging Bolt",
    "iron-boulder": "Iron Boulder",
    "iron-crown": "Iron Crown",

    // Other special cases that might cause issues
    "mr-mime": "Mr. Mime",
    "mime-jr": "Mime Jr.",
    "type-null": "Type: Null",
    "ho-oh": "Ho-Oh",
    "porygon-z": "Porygon-Z",
    "jangmo-o": "Jangmo-o",
    "hakamo-o": "Hakamo-o",
    "kommo-o": "Kommo-o",
    "tapu-koko": "Tapu Koko",
    "tapu-lele": "Tapu Lele",
    "tapu-bulu": "Tapu Bulu",
    "tapu-fini": "Tapu Fini",
  };

  return conversions[pokeApiName] || pokeApiName;
}

// Get Chinese name by Pokemon ID or English name - supports variants
export async function getChineseName(pokemonId, englishName) {
  await ensureDataLoaded();

  if (englishName) {
    // First try direct match
    let exactMatch = pokemonData.complete.find(
      (entry) => entry.name_en?.toLowerCase() === englishName.toLowerCase()
    );

    // If no direct match, try converting PokeAPI name format
    if (!exactMatch) {
      const convertedName = convertPokeApiNameToDbName(
        englishName.toLowerCase()
      );
      exactMatch = pokemonData.complete.find(
        (entry) => entry.name_en?.toLowerCase() === convertedName.toLowerCase()
      );
    }

    // If still no match, try partial matching for forms
    if (!exactMatch && pokemonId) {
      // Find all entries with the same ID and try to match by form characteristics
      const sameIdEntries = pokemonData.complete.filter(
        (entry) => entry.id === parseInt(pokemonId)
      );

      if (sameIdEntries.length > 1) {
        // Special handling for specific Pokemon
        if (englishName.includes("necrozma")) {
          if (englishName.includes("dusk")) {
            exactMatch = sameIdEntries.find((entry) =>
              entry.name_en?.includes("Dusk Mane")
            );
          } else if (englishName.includes("dawn")) {
            exactMatch = sameIdEntries.find((entry) =>
              entry.name_en?.includes("Dawn Wings")
            );
          } else if (englishName.includes("ultra")) {
            exactMatch = sameIdEntries.find((entry) =>
              entry.name_en?.includes("Ultra")
            );
          }
        } else if (englishName.includes("lycanroc")) {
          if (englishName.includes("midnight")) {
            exactMatch = sameIdEntries.find((entry) =>
              entry.name_zh_tw?.includes("黑夜")
            );
          } else if (englishName.includes("dusk")) {
            exactMatch = sameIdEntries.find((entry) =>
              entry.name_zh_tw?.includes("黃昏")
            );
          } else if (englishName.includes("midday")) {
            exactMatch = sameIdEntries.find(
              (entry) =>
                !entry.name_zh_tw?.includes("黑夜") &&
                !entry.name_zh_tw?.includes("黃昏")
            );
          }
        } else if (englishName.includes("gimmighoul")) {
          if (englishName.includes("roaming")) {
            exactMatch = sameIdEntries.find((entry) => entry.stats?.speed > 50); // Roaming form has higher speed
          } else {
            exactMatch = sameIdEntries.find(
              (entry) => entry.stats?.speed <= 50
            ); // Chest form has lower speed
          }
        } else if (englishName.includes("oricorio")) {
          if (englishName.includes("pom-pom")) {
            exactMatch = sameIdEntries.find((entry) =>
              entry.name_zh_tw?.includes("啪滋風")
            );
          } else if (englishName.includes("pau")) {
            exactMatch = sameIdEntries.find((entry) =>
              entry.name_zh_tw?.includes("呼拉風")
            );
          } else if (englishName.includes("sensu")) {
            exactMatch = sameIdEntries.find((entry) =>
              entry.name_zh_tw?.includes("輕盈風")
            );
          } else {
            exactMatch = sameIdEntries.find((entry) =>
              entry.name_zh_tw?.includes("熱辣風")
            );
          }
        }
      }
    }

    if (exactMatch && exactMatch.name_zh_tw) {
      return exactMatch.name_zh_tw;
    }
  }

  // Then try by ID in main pokemon data (base forms only)
  if (pokemonData.pokemon[pokemonId]) {
    return pokemonData.pokemon[pokemonId].zh;
  }

  // Fallback search in complete database by ID (first entry for that ID)
  if (pokemonId) {
    const idMatch = pokemonData.complete.find(
      (entry) => entry.id === parseInt(pokemonId)
    );
    if (idMatch && idMatch.name_zh_tw) {
      return idMatch.name_zh_tw;
    }
  }

  return englishName || "未知寶可夢";
}

// Get English name by Pokemon ID or PokeAPI name - supports variants
export async function getEnglishName(pokemonId, pokeApiName) {
  await ensureDataLoaded();

  // If we have a PokeAPI name, try to find the correct database format
  if (pokeApiName) {
    // First try direct match
    let exactMatch = pokemonData.complete.find(
      (entry) => entry.name_en?.toLowerCase() === pokeApiName.toLowerCase()
    );

    // If no direct match, try converting PokeAPI name format
    if (!exactMatch) {
      const convertedName = convertPokeApiNameToDbName(
        pokeApiName.toLowerCase()
      );
      exactMatch = pokemonData.complete.find(
        (entry) => entry.name_en?.toLowerCase() === convertedName.toLowerCase()
      );
    }

    // If still no match, try partial matching for forms
    if (!exactMatch && pokemonId) {
      // Find all entries with the same ID
      const sameIdEntries = pokemonData.complete.filter(
        (entry) => entry.id === parseInt(pokemonId)
      );

      if (sameIdEntries.length > 1) {
        // Use the same matching logic as getChineseName for consistency
        if (pokeApiName.includes("necrozma")) {
          if (pokeApiName.includes("dusk")) {
            exactMatch = sameIdEntries.find((entry) =>
              entry.name_en?.includes("Dusk Mane")
            );
          } else if (pokeApiName.includes("dawn")) {
            exactMatch = sameIdEntries.find((entry) =>
              entry.name_en?.includes("Dawn Wings")
            );
          } else if (pokeApiName.includes("ultra")) {
            exactMatch = sameIdEntries.find((entry) =>
              entry.name_en?.includes("Ultra")
            );
          }
        } else if (pokeApiName.includes("lycanroc")) {
          if (pokeApiName.includes("midnight")) {
            exactMatch = sameIdEntries.find((entry) =>
              entry.name_zh_tw?.includes("黑夜")
            );
          } else if (pokeApiName.includes("dusk")) {
            exactMatch = sameIdEntries.find((entry) =>
              entry.name_zh_tw?.includes("黃昏")
            );
          } else if (pokeApiName.includes("midday")) {
            exactMatch = sameIdEntries.find(
              (entry) =>
                !entry.name_zh_tw?.includes("黑夜") &&
                !entry.name_zh_tw?.includes("黃昏")
            );
          }
        } else if (pokeApiName.includes("gimmighoul")) {
          if (pokeApiName.includes("roaming")) {
            exactMatch = sameIdEntries.find((entry) => entry.stats?.speed > 50);
          } else {
            exactMatch = sameIdEntries.find(
              (entry) => entry.stats?.speed <= 50
            );
          }
        } else if (pokeApiName.includes("oricorio")) {
          if (pokeApiName.includes("pom-pom")) {
            exactMatch = sameIdEntries.find((entry) =>
              entry.name_zh_tw?.includes("啪滋風")
            );
          } else if (pokeApiName.includes("pau")) {
            exactMatch = sameIdEntries.find((entry) =>
              entry.name_zh_tw?.includes("呼拉風")
            );
          } else if (pokeApiName.includes("sensu")) {
            exactMatch = sameIdEntries.find((entry) =>
              entry.name_zh_tw?.includes("輕盈風")
            );
          } else {
            exactMatch = sameIdEntries.find((entry) =>
              entry.name_zh_tw?.includes("熱辣風")
            );
          }
        }
      }
    }

    if (exactMatch && exactMatch.name_en) {
      return exactMatch.name_en;
    }
  }

  // Fallback to ID-based lookup
  if (pokemonData.pokemon[pokemonId]) {
    return pokemonData.pokemon[pokemonId].en;
  }

  // Final fallback to complete database by ID
  if (pokemonId) {
    const idMatch = pokemonData.complete.find(
      (entry) => entry.id === parseInt(pokemonId)
    );
    if (idMatch && idMatch.name_en) {
      return idMatch.name_en;
    }
  }

  return pokeApiName || "Unknown Pokemon";
}

// Get both names
export async function getBothNames(pokemonId, englishName) {
  await ensureDataLoaded();
  const chinese = await getChineseName(pokemonId, englishName);
  const english =
    pokemonData.pokemon[pokemonId]?.en || englishName || "Unknown Pokemon";
  return { chinese, english };
}

// Enhanced search with index support - returns ALL forms for matched names
export async function searchPokemonNames(query) {
  if (!query || query.length < 1) return [];

  await ensureDataLoaded();

  const lowerQuery = query.toLowerCase();
  const results = [];
  const seenEntries = new Set(); // Track unique entries by id + name_en combination

  // Search through complete database for comprehensive results
  pokemonData.complete.forEach((entry) => {
    const zhName = entry.name_zh_tw?.toLowerCase() || "";
    const enName = entry.name_en?.toLowerCase() || "";
    const entryKey = `${entry.id}-${entry.name_en}`;

    // Check if query matches Chinese or English name
    if (
      (zhName.includes(lowerQuery) || enName.includes(lowerQuery)) &&
      !seenEntries.has(entryKey)
    ) {
      seenEntries.add(entryKey);
      results.push({
        id: entry.id,
        zh: entry.name_zh_tw,
        en: entry.name_en,
        is_variant: entry.is_variant || false,
      });
    }
  });

  // For Chinese name search, if we find matches, also include all forms of same ID
  if (lowerQuery.length >= 1 && results.length > 0) {
    const foundIds = [...new Set(results.map((r) => r.id))];

    foundIds.forEach((id) => {
      // Find all forms for this ID
      const allForms = pokemonData.complete.filter((entry) => entry.id === id);

      allForms.forEach((form) => {
        const formKey = `${form.id}-${form.name_en}`;
        if (!seenEntries.has(formKey)) {
          seenEntries.add(formKey);
          results.push({
            id: form.id,
            zh: form.name_zh_tw,
            en: form.name_en,
            is_variant: form.is_variant || false,
          });
        }
      });
    });
  }

  // Remove duplicates and sort by ID, then by variant status (base forms first)
  const uniqueResults = results
    .filter(
      (result, index, self) =>
        index ===
        self.findIndex((r) => r.id === result.id && r.en === result.en)
    )
    .sort((a, b) => {
      if (a.id !== b.id) return a.id - b.id;
      return (a.is_variant ? 1 : 0) - (b.is_variant ? 1 : 0);
    });

  return uniqueResults.slice(0, 50); // Limit results
}

// Synchronous versions for backward compatibility
// These will work only after data is loaded

export function getChineseNameSync(pokemonId, englishName) {
  if (!pokemonData?.pokemon) {
    console.warn(
      "Pokemon data not loaded. Use async version or call ensureDataLoaded() first."
    );
    return englishName || "未知寶可夢";
  }

  // First try by ID
  if (pokemonData.pokemon[pokemonId]) {
    return pokemonData.pokemon[pokemonId].zh;
  }

  // Then try by English name
  const entry = Object.values(pokemonData.pokemon).find(
    (pokemon) => pokemon.en.toLowerCase() === englishName?.toLowerCase()
  );

  return entry?.zh || englishName || "未知寶可夢";
}

export function getEnglishNameSync(pokemonId) {
  if (!pokemonData?.pokemon) {
    console.warn(
      "Pokemon data not loaded. Use async version or call ensureDataLoaded() first."
    );
    return "Unknown Pokemon";
  }
  return pokemonData.pokemon[pokemonId]?.en || "Unknown Pokemon";
}

export function searchPokemonNamesSync(query) {
  if (!pokemonData?.pokemon) {
    console.warn(
      "Pokemon data not loaded. Use async version or call ensureDataLoaded() first."
    );
    return [];
  }

  if (!query || query.length < 1) return [];

  const lowerQuery = query.toLowerCase();
  const results = [];

  Object.entries(pokemonData.pokemon).forEach(([id, names]) => {
    const zhName = names.zh.toLowerCase();
    const enName = names.en.toLowerCase();

    // Check if query matches start of any name
    if (zhName.includes(lowerQuery) || enName.includes(lowerQuery)) {
      results.push({
        id: parseInt(id),
        zh: names.zh,
        en: names.en,
      });
    }
  });

  return results.slice(0, 50); // Limit results
}

// Utility functions for PWA support
export function getPokemonDataVersion() {
  return pokemonData?.version || "1.0.0";
}

export function getPokemonCount() {
  return pokemonData?.totalCount || 0;
}

export function getLastUpdated() {
  return pokemonData?.lastUpdated;
}

// Auto-load data when module is imported
if (typeof window !== "undefined") {
  ensureDataLoaded().catch(console.error);
}
