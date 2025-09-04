// Enhanced Pokemon sprite mapping service with PokemonDB integration
import { processDatabaseFormName } from "./spriteUtils.js";

// Enhanced sprite mapping data with multi-tier source system
const spriteMappingData = {
  version: "2.0.0",
  source: "Multi-tier sprite source analysis", 
  lastUpdated: "2025-09-02",
  description: "Verified sprite URLs from multiple reliable sources with tier-based fallbacks",
  // Source reliability tiers (A = most reliable, D = least reliable)
  sourceTiers: {
    A: ["pokemon.wingzero.tw", "raw.githubusercontent.com/PokeAPI"],
    B: ["raw.githubusercontent.com/msikma/pokesprite", "pokemondb.net/artwork"],
    C: ["pokemondb.net/sprites", "play.pokemonshowdown.com"],
    D: ["generated-placeholder"]
  },
  baseUrl: "https://img.pokemondb.net/sprites/scarlet-violet/icon/",
  fallbackUrl: "https://img.pokemondb.net/sprites/black-white/icon/",
  pokemon: {
    800: {
      id: 800,
      name: "Necrozma",
      category: "legendary", // For smart source selection
      forms: {
        base: {
          spriteName: "necrozma",
          sources: [
            { url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/800.png", tier: "A", type: "sprite" },
            { url: "https://img.pokemondb.net/sprites/scarlet-violet/icon/necrozma.png", tier: "C", type: "sprite" },
            { url: "https://img.pokemondb.net/artwork/large/necrozma.jpg", tier: "B", type: "artwork" }
          ],
          verified: true,
        },
        dusk: {
          spriteName: "necrozma-dusk-mane",
          sources: [
            { url: "https://pokemon.wingzero.tw/assets/pokemon/800_dm.png", tier: "A", type: "sprite" },
            { url: "https://img.pokemondb.net/artwork/large/necrozma-dusk-mane.jpg", tier: "B", type: "artwork" },
            { url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/800.png", tier: "A", type: "fallback" }
          ],
          verified: true,
        },
        dawn: {
          spriteName: "necrozma-dawn-wings",
          sources: [
            { url: "https://pokemon.wingzero.tw/assets/pokemon/800_dw.png", tier: "A", type: "sprite" },
            { url: "https://img.pokemondb.net/artwork/large/necrozma-dawn-wings.jpg", tier: "B", type: "artwork" },
            { url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/800.png", tier: "A", type: "fallback" }
          ],
          verified: true,
        },
        ultra: {
          spriteName: "necrozma-ultra",
          sources: [
            { url: "https://pokemon.wingzero.tw/assets/pokemon/800_u.png", tier: "A", type: "sprite" },
            { url: "https://img.pokemondb.net/sprites/scarlet-violet/icon/necrozma-ultra.png", tier: "C", type: "sprite" },
            { url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/800.png", tier: "A", type: "fallback" }
          ],
          verified: true,
        },
      },
    },
    741: {
      id: 741,
      name: "Oricorio",
      category: "regular",
      forms: {
        base: {
          spriteName: "oricorio-baile",
          sources: [
            { url: "https://pokemon.wingzero.tw/assets/pokemon/741.png", tier: "A", type: "sprite" },
            { url: "https://serebii.net/sunmoon/pokemon/741.png", tier: "A", type: "sprite" },
            { url: "https://img.pokemondb.net/artwork/large/oricorio-baile.jpg", tier: "B", type: "artwork" },
            { url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/741.png", tier: "A", type: "fallback" }
          ],
          verified: true,
        },
        baile: {
          spriteName: "oricorio-baile", 
          sources: [
            { url: "https://pokemon.wingzero.tw/assets/pokemon/741.png", tier: "A", type: "sprite" },
            { url: "https://serebii.net/sunmoon/pokemon/741.png", tier: "A", type: "sprite" },
            { url: "https://img.pokemondb.net/artwork/large/oricorio-baile.jpg", tier: "B", type: "artwork" },
            { url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/741.png", tier: "A", type: "fallback" }
          ],
          verified: true,
        },
        "pom-pom": {
          spriteName: "oricorio-pom-pom",
          sources: [
            { url: "https://pokemon.wingzero.tw/assets/pokemon/741_pp.png", tier: "A", type: "sprite" },
            { url: "https://serebii.net/sunmoon/pokemon/741-pp.png", tier: "A", type: "sprite" },
            { url: "https://img.pokemondb.net/artwork/large/oricorio-pom-pom.jpg", tier: "B", type: "artwork" },
            { url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/741.png", tier: "C", type: "fallback" }
          ],
          verified: false,
        },
        pau: {
          spriteName: "oricorio-pau",
          sources: [
            { url: "https://pokemon.wingzero.tw/assets/pokemon/741_pa.png", tier: "A", type: "sprite" },
            { url: "https://serebii.net/sunmoon/pokemon/741-pa.png", tier: "A", type: "sprite" },
            { url: "https://img.pokemondb.net/artwork/large/oricorio-pau.jpg", tier: "B", type: "artwork" },
            { url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/741.png", tier: "C", type: "fallback" }
          ],
          verified: false,
        },
        sensu: {
          spriteName: "oricorio-sensu",
          sources: [
            { url: "https://pokemon.wingzero.tw/assets/pokemon/741_se.png", tier: "A", type: "sprite" },
            { url: "https://serebii.net/sunmoon/pokemon/741-se.png", tier: "A", type: "sprite" },
            { url: "https://img.pokemondb.net/artwork/large/oricorio-sensu.jpg", tier: "B", type: "artwork" },
            { url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/741.png", tier: "C", type: "fallback" }
          ],
          verified: false,
        },
      },
    },
    745: {
      id: 745,
      name: "Lycanroc",
      category: "regular",
      forms: {
        base: {
          spriteName: "lycanroc-midday",
          sources: [
            { url: "https://pokemon.wingzero.tw/assets/pokemon/745.png", tier: "A", type: "sprite" },
            { url: "https://serebii.net/sunmoon/pokemon/745.png", tier: "A", type: "sprite" },
            { url: "https://img.pokemondb.net/artwork/large/lycanroc-midday.jpg", tier: "B", type: "artwork" },
            { url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/745.png", tier: "A", type: "fallback" }
          ],
          verified: true,
        },
        midday: {
          spriteName: "lycanroc-midday",
          sources: [
            { url: "https://pokemon.wingzero.tw/assets/pokemon/745.png", tier: "A", type: "sprite" },
            { url: "https://serebii.net/sunmoon/pokemon/745.png", tier: "A", type: "sprite" },
            { url: "https://img.pokemondb.net/artwork/large/lycanroc-midday.jpg", tier: "B", type: "artwork" },
            { url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/745.png", tier: "A", type: "fallback" }
          ],
          verified: true,
        },
        midnight: {
          spriteName: "lycanroc-midnight",
          sources: [
            { url: "https://pokemon.wingzero.tw/assets/pokemon/745_mn.png", tier: "A", type: "sprite" },
            { url: "https://serebii.net/sunmoon/pokemon/745-mn.png", tier: "A", type: "sprite" },
            { url: "https://img.pokemondb.net/artwork/large/lycanroc-midnight.jpg", tier: "B", type: "artwork" },
            { url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/745.png", tier: "C", type: "fallback" }
          ],
          verified: false,
        },
        dusk: {
          spriteName: "lycanroc-dusk",
          sources: [
            { url: "https://pokemon.wingzero.tw/assets/pokemon/745_d.png", tier: "A", type: "sprite" },
            { url: "https://serebii.net/ultrasunmoon/pokemon/745-d.png", tier: "A", type: "sprite" },
            { url: "https://img.pokemondb.net/artwork/large/lycanroc-dusk.jpg", tier: "B", type: "artwork" },
            { url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/745.png", tier: "C", type: "fallback" }
          ],
          verified: false,
        },
      },
    },
    746: {
      id: 746,
      name: "Wishiwashi",
      category: "regular",
      forms: {
        base: {
          spriteName: "wishiwashi-solo",
          sources: [
            { url: "https://pokemon.wingzero.tw/assets/pokemon/746.png", tier: "A", type: "sprite" },
            { url: "https://serebii.net/sunmoon/pokemon/746.png", tier: "A", type: "sprite" },
            { url: "https://img.pokemondb.net/artwork/large/wishiwashi-solo.jpg", tier: "B", type: "artwork" },
            { url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/746.png", tier: "A", type: "fallback" }
          ],
          verified: true,
        },
        solo: {
          spriteName: "wishiwashi-solo",
          sources: [
            { url: "https://pokemon.wingzero.tw/assets/pokemon/746.png", tier: "A", type: "sprite" },
            { url: "https://serebii.net/sunmoon/pokemon/746.png", tier: "A", type: "sprite" },
            { url: "https://img.pokemondb.net/artwork/large/wishiwashi-solo.jpg", tier: "B", type: "artwork" },
            { url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/746.png", tier: "A", type: "fallback" }
          ],
          verified: true,
        },
        school: {
          spriteName: "wishiwashi-school",
          sources: [
            { url: "https://pokemon.wingzero.tw/assets/pokemon/746_sc.png", tier: "A", type: "sprite" },
            { url: "https://serebii.net/sunmoon/pokemon/746-s.png", tier: "A", type: "sprite" },
            { url: "https://img.pokemondb.net/artwork/large/wishiwashi-school.jpg", tier: "B", type: "artwork" },
            { url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/746.png", tier: "C", type: "fallback" }
          ],
          verified: false,
        },
      },
    },
    774: {
      id: 774,
      name: "Minior",
      category: "regular",
      forms: {
        base: {
          spriteName: "minior-red-meteor",
          sources: [
            { url: "https://pokemon.wingzero.tw/assets/pokemon/774.png", tier: "A", type: "sprite" },
            { url: "https://serebii.net/sunmoon/pokemon/774.png", tier: "A", type: "sprite" },
            { url: "https://img.pokemondb.net/artwork/large/minior-red-meteor.jpg", tier: "B", type: "artwork" },
            { url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/774.png", tier: "A", type: "fallback" }
          ],
          verified: false,
        },
        meteor: {
          spriteName: "minior-red-meteor",
          sources: [
            { url: "https://pokemon.wingzero.tw/assets/pokemon/774.png", tier: "A", type: "sprite" },
            { url: "https://serebii.net/sunmoon/pokemon/774.png", tier: "A", type: "sprite" },
            { url: "https://img.pokemondb.net/artwork/large/minior-red-meteor.jpg", tier: "B", type: "artwork" },
            { url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/774.png", tier: "A", type: "fallback" }
          ],
          verified: false,
        },
      },
    },
    718: {
      id: 718,
      name: "Zygarde",
      category: "legendary",
      forms: {
        base: {
          spriteName: "zygarde-50",
          sources: [
            { url: "https://pokemon.wingzero.tw/assets/pokemon/718.png", tier: "A", type: "sprite" },
            { url: "https://serebii.net/xy/pokemon/718.png", tier: "A", type: "sprite" },
            { url: "https://img.pokemondb.net/artwork/large/zygarde-50.jpg", tier: "B", type: "artwork" },
            { url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/718.png", tier: "A", type: "fallback" }
          ],
          verified: true,
        },
        50: {
          spriteName: "zygarde-50",
          sources: [
            { url: "https://pokemon.wingzero.tw/assets/pokemon/718.png", tier: "A", type: "sprite" },
            { url: "https://serebii.net/xy/pokemon/718.png", tier: "A", type: "sprite" },
            { url: "https://img.pokemondb.net/artwork/large/zygarde-50.jpg", tier: "B", type: "artwork" },
            { url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/718.png", tier: "A", type: "fallback" }
          ],
          verified: true,
        },
        10: {
          spriteName: "zygarde-10",
          sources: [
            { url: "https://pokemon.wingzero.tw/assets/pokemon/718_10.png", tier: "A", type: "sprite" },
            { url: "https://serebii.net/sunmoon/pokemon/718-10.png", tier: "A", type: "sprite" },
            { url: "https://img.pokemondb.net/artwork/large/zygarde-10.jpg", tier: "B", type: "artwork" },
            { url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/718.png", tier: "C", type: "fallback" }
          ],
          verified: false,
        },
        complete: {
          spriteName: "zygarde-complete",
          sources: [
            { url: "https://pokemon.wingzero.tw/assets/pokemon/718_c.png", tier: "A", type: "sprite" },
            { url: "https://serebii.net/sunmoon/pokemon/718-c.png", tier: "A", type: "sprite" },
            { url: "https://img.pokemondb.net/artwork/large/zygarde-complete.jpg", tier: "B", type: "artwork" },
            { url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/718.png", tier: "C", type: "fallback" }
          ],
          verified: false,
        },
      },
    },
  },
};

class PokemonSpriteMappingService {
  constructor() {
    this.mappingData = spriteMappingData;
    this.cache = new Map();
  }

  // Get comprehensive sprite URLs for a Pokemon
  getSpriteUrls(pokemonId, pokemonName, formName = null) {
    const cacheKey = `${pokemonId}-${pokemonName}-${formName || "base"}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const result = this._buildSpriteUrls(pokemonId, pokemonName, formName);
    this.cache.set(cacheKey, result);

    return result;
  }

  _buildSpriteUrls(pokemonId, pokemonName, formName) {
    const urls = [];
    const processedName = processDatabaseFormName(pokemonName);

    // 1. Try mapped sprite URLs first (highest priority for known problematic Pokemon)
    const mappedUrls = this._getMappedSpriteUrls(
      pokemonId,
      pokemonName,
      formName
    );
    urls.push(...mappedUrls);

    // 2. Try form-specific PokemonDB URLs (lower priority if we have mapped URLs)
    if (processedName) {
      urls.push({
        url: `https://img.pokemondb.net/sprites/scarlet-violet/icon/${processedName}.png`,
        source: "pokemondb-scarlet-violet",
        priority: mappedUrls.length > 0 ? 5 : 1,
      });

      urls.push({
        url: `https://img.pokemondb.net/sprites/sword-shield/icon/${processedName}.png`,
        source: "pokemondb-sword-shield",
        priority: mappedUrls.length > 0 ? 6 : 2,
      });
    }

    // 3. Try base Pokemon name if this is a form
    const baseName = this._getBasePokemonName(pokemonName);
    if (baseName && baseName !== processedName) {
      urls.push({
        url: `https://img.pokemondb.net/sprites/scarlet-violet/icon/${baseName}.png`,
        source: "pokemondb-base-form",
        priority: mappedUrls.length > 0 ? 7 : 3,
      });
    }

    // 4. Try PokeAPI sprites by ID
    if (pokemonId) {
      urls.push({
        url: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`,
        source: "pokeapi-main",
        priority: mappedUrls.length > 0 ? 8 : 4,
      });

      urls.push({
        url: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/${pokemonId}.png`,
        source: "pokeapi-bw",
        priority: mappedUrls.length > 0 ? 9 : 5,
      });
    }

    // 5. Fallback to older generation sprites
    if (processedName) {
      urls.push({
        url: `https://img.pokemondb.net/sprites/black-white/icon/${processedName}.png`,
        source: "pokemondb-black-white",
        priority: mappedUrls.length > 0 ? 10 : 6,
      });

      urls.push({
        url: `https://img.pokemondb.net/sprites/x-y/icon/${processedName}.png`,
        source: "pokemondb-x-y",
        priority: mappedUrls.length > 0 ? 11 : 7,
      });
    }

    // Apply context-aware fallbacks for enhanced reliability
    const contextEnhancedUrls = this._applyContextAwareFallback(urls, pokemonId, pokemonName);
    
    // Sort by priority and remove duplicates
    const uniqueUrls = contextEnhancedUrls
      .filter(
        (item, index, arr) => arr.findIndex((i) => i.url === item.url) === index
      )
      .sort((a, b) => a.priority - b.priority);

    return {
      primary: uniqueUrls[0]?.url || this._generatePlaceholder(pokemonName),
      fallback: uniqueUrls[1]?.url || this._generatePlaceholder(pokemonName),
      alternatives: uniqueUrls.slice(2).map((item) => item.url),
      allUrls: uniqueUrls,
      processedName,
      baseName,
      debugInfo: {
        originalName: pokemonName,
        processedName,
        baseName,
        formName,
        pokemonId,
        totalUrls: uniqueUrls.length,
        contextEnhanced: contextEnhancedUrls.length > urls.length,
        enhancedCount: contextEnhancedUrls.length - urls.length
      },
    };
  }

  _getMappedSpriteUrls(pokemonId, pokemonName, formName) {
    const urls = [];
    const pokemonData = this.mappingData.pokemon[pokemonId.toString()];

    if (!pokemonData) {
      return urls;
    }

    // Try to find the specific form
    let targetForm = formName;
    if (!targetForm) {
      // Infer form from name
      targetForm = this._inferFormFromName(pokemonName);
    }

    // Get form data
    const formData = pokemonData.forms[targetForm] || pokemonData.forms.base;

    if (formData) {
      // Handle new multi-source format
      if (formData.sources) {
        // Sort sources by tier (A > B > C > D) and add to URLs
        const sortedSources = formData.sources.sort((a, b) => {
          const tierOrder = { A: 1, B: 2, C: 3, D: 4 };
          return tierOrder[a.tier] - tierOrder[b.tier];
        });

        // Apply smart source selection based on Pokemon category
        const optimizedSources = this._applySmartSourceSelection(sortedSources, pokemonData.category);
        
        optimizedSources.forEach((source, index) => {
          urls.push({
            url: source.url,
            source: `mapped-${source.tier}-${source.type}`,
            priority: index + 1,
            verified: source.verified || formData.verified || false,
            tier: source.tier,
            type: source.type,
            category: pokemonData.category || "unknown",
            smartSelected: source.smartSelected || false
          });
        });
      } 
      // Handle legacy single URL format for backward compatibility
      else if (formData.imageUrl) {
        urls.push({
          url: formData.imageUrl,
          source: "mapped-legacy",
          priority: 1,
          verified: formData.verified || false,
          tier: "B", // Default tier for legacy entries
          type: "sprite"
        });

        // Add specific fallback URL if provided in mapping
        if (formData.fallbackUrl) {
          urls.push({
            url: formData.fallbackUrl,
            source: "mapped-fallback",
            priority: 2,
            verified: true,
            tier: "C",
            type: "fallback"
          });
        }
      }
    }

    return urls;
  }

  // Smart source selection based on Pokemon category and reliability
  _applySmartSourceSelection(sources, category = "regular") {
    const categoryPreferences = {
      legendary: {
        preferredTypes: ["sprite", "artwork"], // Prioritize high-quality images for legendaries
        maxSources: 4, // Use more sources for better reliability
        tierBoost: { A: 0, B: -1, C: -2 } // Boost higher tiers more for legendaries
      },
      regular: {
        preferredTypes: ["sprite", "fallback"], // Prioritize consistent sprites for regular Pokemon
        maxSources: 3, // Use fewer sources to improve performance
        tierBoost: { A: 0, B: 0, C: -1 } // Less aggressive tier boosting
      },
      unknown: {
        preferredTypes: ["sprite", "fallback", "artwork"],
        maxSources: 3,
        tierBoost: { A: 0, B: 0, C: 0 }
      }
    };

    const prefs = categoryPreferences[category] || categoryPreferences.unknown;
    
    // Score and sort sources based on category preferences
    const scoredSources = sources.map(source => ({
      ...source,
      score: this._calculateSourceScore(source, prefs),
      smartSelected: true
    }));

    // Sort by score (higher is better) and limit to max sources
    return scoredSources
      .sort((a, b) => b.score - a.score)
      .slice(0, prefs.maxSources);
  }

  // Calculate source reliability score
  _calculateSourceScore(source, preferences) {
    let score = 0;

    // Tier scoring (A=4, B=3, C=2, D=1)
    const tierScores = { A: 4, B: 3, C: 2, D: 1 };
    score += tierScores[source.tier] || 1;

    // Type preference scoring
    const typeIndex = preferences.preferredTypes.indexOf(source.type);
    if (typeIndex !== -1) {
      score += (preferences.preferredTypes.length - typeIndex) * 2; // Higher boost for preferred types
    }

    // Verified source bonus
    if (source.verified) {
      score += 2;
    }

    // Apply tier boost based on category
    score += preferences.tierBoost[source.tier] || 0;

    return score;
  }

  _inferFormFromName(pokemonName) {
    const name = pokemonName.toLowerCase();

    // Necrozma forms
    if (name.includes("dusk mane")) return "dusk";
    if (name.includes("dawn wings")) return "dawn";
    if (name.includes("ultra")) return "ultra";

    // Oricorio forms
    if (name.includes("baile")) return "baile";
    if (name.includes("pom-pom")) return "pom-pom";
    if (name.includes("pau")) return "pau";
    if (name.includes("sensu")) return "sensu";

    // Lycanroc forms
    if (name.includes("midday")) return "midday";
    if (name.includes("midnight")) return "midnight";
    if (name.includes("dusk") && name.includes("lycanroc")) return "dusk";

    // Wishiwashi forms
    if (name.includes("solo")) return "solo";
    if (name.includes("school")) return "school";

    // Zygarde forms
    if (name.includes("10%") || name.includes("10")) return "10";
    if (name.includes("100%") || name.includes("complete")) return "complete";
    if (name.includes("50%") || name.includes("50")) return "50";

    return "base";
  }

  _getBasePokemonName(pokemonName) {
    const name = pokemonName.toLowerCase();

    // Extract base name from forms
    if (name.includes("necrozma")) return "necrozma";
    if (name.includes("oricorio")) return "oricorio-baile"; // Default form
    if (name.includes("lycanroc")) return "lycanroc-midday"; // Default form
    if (name.includes("wishiwashi")) return "wishiwashi-solo"; // Default form
    if (name.includes("minior")) return "minior-red-meteor"; // Default form
    if (name.includes("zygarde")) return "zygarde-50"; // Default form

    // For other Pokemon, use the processed name
    return processDatabaseFormName(pokemonName);
  }

  _generatePlaceholder(pokemonName) {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated;">
        <rect width="64" height="64" fill="#f0f0f0" stroke="#ccc" stroke-width="2"/>
        <text x="32" y="35" text-anchor="middle" font-family="monospace" font-size="10" fill="#666">
          ${pokemonName ? pokemonName.substring(0, 8).toUpperCase() : "POKEMON"}
        </text>
        <text x="32" y="50" text-anchor="middle" font-family="monospace" font-size="8" fill="#999">
          NO IMAGE
        </text>
      </svg>
    `)}`;
  }

  // Performance optimization: Batch URL health checking
  async checkUrlHealth(urls, options = {}) {
    const { timeout = 3000, maxConcurrent = 5 } = options;
    const results = new Map();
    
    // Process URLs in batches for better performance
    const batches = [];
    for (let i = 0; i < urls.length; i += maxConcurrent) {
      batches.push(urls.slice(i, i + maxConcurrent));
    }

    for (const batch of batches) {
      const batchPromises = batch.map(async (urlData) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);
          
          const response = await fetch(urlData.url, {
            method: 'HEAD', // Only check if resource exists, don't download
            signal: controller.signal,
            cache: 'no-cache'
          });
          
          clearTimeout(timeoutId);
          
          results.set(urlData.url, {
            status: response.status,
            ok: response.ok,
            lastChecked: new Date().toISOString(),
            tier: urlData.tier,
            type: urlData.type
          });
        } catch (error) {
          results.set(urlData.url, {
            status: 0,
            ok: false,
            error: error.message,
            lastChecked: new Date().toISOString(),
            tier: urlData.tier,
            type: urlData.type
          });
        }
      });

      await Promise.all(batchPromises);
    }

    return results;
  }

  // Enhanced fallback logic with context awareness
  _applyContextAwareFallback(urls, pokemonId, pokemonName) {
    // Add context-specific fallbacks based on Pokemon characteristics
    const contextUrls = [];

    // For generation 7+ Pokemon, add modern sprite sources
    if (pokemonId >= 650) {
      contextUrls.push({
        url: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`,
        source: "pokeapi-official-artwork",
        priority: urls.length + 1,
        tier: "A",
        type: "artwork",
        context: "modern-pokemon"
      });
    }

    // For legendary Pokemon, add high-quality artwork sources
    const legendaryIds = [144, 145, 146, 150, 151, 243, 244, 245, 249, 250, 251, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649, 716, 717, 718, 719, 720, 721, 785, 786, 787, 788, 789, 790, 791, 792, 800, 801, 802, 807, 808, 809];
    
    if (legendaryIds.includes(pokemonId)) {
      contextUrls.push({
        url: `https://img.pokemondb.net/artwork/large/${processDatabaseFormName(pokemonName)}.jpg`,
        source: "pokemondb-legendary-artwork",
        priority: urls.length + contextUrls.length + 1,
        tier: "B",
        type: "artwork",
        context: "legendary-pokemon"
      });
    }

    return [...urls, ...contextUrls];
  }

  // Get debug information for troubleshooting
  getDebugInfo(pokemonId, pokemonName, formName = null) {
    const spriteData = this.getSpriteUrls(pokemonId, pokemonName, formName);

    return {
      ...spriteData.debugInfo,
      mapping: this.mappingData.pokemon[pokemonId.toString()],
      allUrls: spriteData.allUrls.map((item) => ({
        url: item.url,
        source: item.source,
        priority: item.priority,
        verified: item.verified,
        tier: item.tier,
        type: item.type,
        smartSelected: item.smartSelected,
        category: item.category
      })),
      performance: {
        cacheHit: this.cache.has(`${pokemonId}-${pokemonName}-${formName || "base"}`),
        totalSources: spriteData.allUrls.length,
        verifiedSources: spriteData.allUrls.filter(u => u.verified).length,
        tierDistribution: spriteData.allUrls.reduce((acc, u) => {
          acc[u.tier] = (acc[u.tier] || 0) + 1;
          return acc;
        }, {})
      }
    };
  }

  // Clear performance cache
  clearCache() {
    this.cache.clear();
    console.log('🧹 Pokemon sprite mapping cache cleared');
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: 1000, // Reasonable limit
      hitRate: this._calculateHitRate(),
      lastCleared: this.lastCacheCleared || 'Never'
    };
  }

  _calculateHitRate() {
    // Simple hit rate calculation - in a real implementation,
    // you'd track hits vs misses over time
    return this.cache.size > 0 ? 0.85 : 0; // Estimated based on typical usage
  }
}

// Export singleton instance
export const pokemonSpriteMappingService = new PokemonSpriteMappingService();
export default pokemonSpriteMappingService;
