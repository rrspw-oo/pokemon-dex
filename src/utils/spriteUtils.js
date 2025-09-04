// Pokemon sprite utilities for PokemonDB integration

// Convert Pokemon name to PokemonDB URL format
export function pokemonNameToSlug(name) {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .replace(/[♀♂]/g, '') // Remove gender symbols
    .replace(/['']/g, '') // Remove apostrophes
    .replace(/[:.]/g, '') // Remove colons and periods
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove special characters except hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Get PokemonDB sprite URL
export function getPokemonDBSpriteUrl(pokemonName, generation = 'scarlet-violet', spriteType = 'icon') {
  const slug = pokemonNameToSlug(pokemonName);
  return `https://img.pokemondb.net/sprites/${generation}/${spriteType}/${slug}.png`;
}

// Get multiple sprite URL options for fallback
export function getPokemonSpriteUrls(pokemonName, pokemonId) {
  const slug = pokemonNameToSlug(pokemonName);
  
  // Primary sprite sources in order of preference
  const spriteOptions = [
    // Latest generation icons (small, colorful)
    `https://img.pokemondb.net/sprites/scarlet-violet/icon/${slug}.png`,
    
    // Sword/Shield icons
    `https://img.pokemondb.net/sprites/sword-shield/icon/${slug}.png`,
    
    // Sun/Moon icons  
    `https://img.pokemondb.net/sprites/sun-moon/icon/${slug}.png`,
    
    // X/Y icons
    `https://img.pokemondb.net/sprites/x-y/icon/${slug}.png`,
    
    // Black/White icons (classic pixel art)
    `https://img.pokemondb.net/sprites/black-white/icon/${slug}.png`,
    
    // Diamond/Pearl icons
    `https://img.pokemondb.net/sprites/diamond-pearl/icon/${slug}.png`,
    
    // Ruby/Sapphire icons
    `https://img.pokemondb.net/sprites/ruby-sapphire/icon/${slug}.png`,
    
    // Gold/Silver icons (very retro)
    `https://img.pokemondb.net/sprites/gold-silver/icon/${slug}.png`,
    
    // Red/Blue icons (most retro)
    `https://img.pokemondb.net/sprites/red-blue/icon/${slug}.png`
  ];
  
  // If we have an ID, also try ID-based URLs as fallback
  if (pokemonId) {
    spriteOptions.push(
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`,
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/${pokemonId}.png`
    );
  }
  
  return spriteOptions;
}

// Special name mappings for Pokemon with unique naming conventions
const specialNameMappings = {
  // Nidoran with gender symbols
  'nidoran♀': 'nidoran-f',
  'nidoran♂': 'nidoran-m',
  
  // Mr. Mime
  'mr. mime': 'mr-mime',
  'mr.mime': 'mr-mime',
  'mime jr.': 'mime-jr',
  'mime jr': 'mime-jr',
  
  // Type: Null
  'type: null': 'type-null',
  'type null': 'type-null',
  
  // Tapu Pokemon
  'tapu koko': 'tapu-koko',
  'tapu lele': 'tapu-lele', 
  'tapu bulu': 'tapu-bulu',
  'tapu fini': 'tapu-fini',
  
  // Ho-Oh
  'ho-oh': 'ho-oh',
  'ho oh': 'ho-oh',
  
  // Porygon
  'porygon2': 'porygon2',
  'porygon-z': 'porygon-z',
  
  // Flabébé
  'flabébé': 'flabebe',
  
  // Farfetch'd
  "farfetch'd": 'farfetchd',
  'farfetchd': 'farfetchd',
  
  // Paradox Pokemon - Ancient Forms (past)
  'great tusk': 'great-tusk',
  'scream tail': 'scream-tail',
  'brute bonnet': 'brute-bonnet',
  'flutter mane': 'flutter-mane',
  'slither wing': 'slither-wing',
  'sandy shocks': 'sandy-shocks',
  'roaring moon': 'roaring-moon',
  'walking wake': 'walking-wake',
  'gouging fire': 'gouging-fire',
  'raging bolt': 'raging-bolt',
  
  // Paradox Pokemon - Future Forms (iron)
  'iron treads': 'iron-treads',
  'iron bundle': 'iron-bundle',
  'iron hands': 'iron-hands',
  'iron jugulis': 'iron-jugulis',
  'iron moth': 'iron-moth',
  'iron thorns': 'iron-thorns',
  'iron valiant': 'iron-valiant',
  'iron leaves': 'iron-leaves',
  'iron boulder': 'iron-boulder',
  'iron crown': 'iron-crown',
  
  // Necrozma forms
  'necrozma': 'necrozma',
  'necrozma(dusk mane)': 'necrozma-dusk',
  'necrozma(dawn wings)': 'necrozma-dawn',
  'necrozma (ultra)': 'necrozma-ultra',
  'ultra necrozma': 'necrozma-ultra',
  'necrozma-dusk': 'necrozma-dusk',
  'necrozma-dawn': 'necrozma-dawn', 
  'necrozma-ultra': 'necrozma-ultra',

  // Oricorio forms
  'oricorio': 'oricorio-baile', // Default form
  'oricorio-baile': 'oricorio-baile',
  'oricorio-pom-pom': 'oricorio-pom-pom',
  'oricorio-pau': 'oricorio-pau', 
  'oricorio-sensu': 'oricorio-sensu',

  // Lycanroc forms
  'lycanroc': 'lycanroc-midday', // Default form
  'lycanroc-midday': 'lycanroc-midday',
  'lycanroc-midnight': 'lycanroc-midnight',
  'lycanroc-dusk': 'lycanroc-dusk',

  // Wishiwashi forms
  'wishiwashi': 'wishiwashi-solo', // Default form
  'wishiwashi(solo)': 'wishiwashi-solo',
  'wishiwashi(school)': 'wishiwashi-school',
  'wishiwashi-solo': 'wishiwashi-solo',
  'wishiwashi-school': 'wishiwashi-school',

  // Minior forms (meteor is default)
  'minior': 'minior-red-meteor',
  'minior(meteor)': 'minior-red-meteor',
  'minior-red-meteor': 'minior-red-meteor',
  'minior-orange-meteor': 'minior-orange-meteor',
  'minior-yellow-meteor': 'minior-yellow-meteor',
  'minior-green-meteor': 'minior-green-meteor',
  'minior-blue-meteor': 'minior-blue-meteor',
  'minior-indigo-meteor': 'minior-indigo-meteor',
  'minior-violet-meteor': 'minior-violet-meteor',

  // Zygarde forms
  'zygarde': 'zygarde-50', // Default 50% form
  'zygarde (50% )': 'zygarde-50',
  'zygarde(10%)': 'zygarde-10',
  'zygarde(100%)': 'zygarde-complete',
  'zygarde-50': 'zygarde-50',
  'zygarde-10': 'zygarde-10',
  'zygarde-complete': 'zygarde-complete',

  // Other multi-word Pokemon
  'jangmo-o': 'jangmo-o',
  'hakamo-o': 'hakamo-o',
  'kommo-o': 'kommo-o',
  
  // Regional forms
  'alolan': function(name) {
    return `${pokemonNameToSlug(name.replace('alolan', '').trim())}-alola`;
  },
  'galarian': function(name) {
    return `${pokemonNameToSlug(name.replace('galarian', '').trim())}-galar`;
  },
  'hisuian': function(name) {
    return `${pokemonNameToSlug(name.replace('hisuian', '').trim())}-hisui`;
  },
  'paldean': function(name) {
    return `${pokemonNameToSlug(name.replace('paldean', '').trim())}-paldea`;
  }
};

// Enhanced form name processing for database to sprite URL conversion
export function processDatabaseFormName(name) {
  if (!name) return '';
  
  // Clean and normalize the name
  let processedName = name.toLowerCase()
    .replace(/['']/g, '') // Remove apostrophes
    .replace(/[:.]/g, '') // Remove colons and periods  
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();

  // Handle parentheses forms (common in database)
  // Convert "Pokemon(Form Name)" to "pokemon-form-name"
  const parenthesesMatch = processedName.match(/^([^(]+)\(([^)]+)\)$/);
  if (parenthesesMatch) {
    const baseName = parenthesesMatch[1].trim();
    const formName = parenthesesMatch[2].trim();
    
    // Special cases for specific forms
    if (baseName === 'necrozma') {
      if (formName === 'dusk mane') return 'necrozma-dusk-mane';
      if (formName === 'dawn wings') return 'necrozma-dawn-wings';
      if (formName === 'ultra' || formName === 'ultra necrozma') return 'necrozma-ultra';
    }
    
    if (baseName === 'oricorio') {
      // Oricorio forms are all mapped to baile (base form) in most sprite sources
      return 'oricorio-baile';
    }
    
    if (baseName === 'lycanroc') {
      if (formName === 'dusk') return 'lycanroc-dusk';
      if (formName === 'midnight') return 'lycanroc-midnight';
      return 'lycanroc-midday'; // Default
    }
    
    if (baseName === 'wishiwashi') {
      if (formName === 'school') return 'wishiwashi-school';
      return 'wishiwashi-solo'; // Default
    }
    
    if (baseName === 'minior') {
      if (formName.includes('meteor')) return 'minior-red-meteor';
      return 'minior-red-meteor'; // Default to meteor form
    }
    
    if (baseName === 'zygarde') {
      if (formName.includes('10')) return 'zygarde-10';
      if (formName.includes('100')) return 'zygarde-complete';
      return 'zygarde-50'; // Default
    }
    
    // General case: convert to kebab-case
    const formSlug = formName
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return `${pokemonNameToSlug(baseName)}-${formSlug}`;
  }
  
  // Apply existing special name mappings
  return applySpecialNameMappings(name);
}

// Apply special name mappings (enhanced)
export function applySpecialNameMappings(name) {
  if (!name) return '';
  
  const lowerName = name.toLowerCase()
    .replace(/['']/g, '') // Remove apostrophes
    .replace(/[:.()]/g, ' ') // Replace special chars with space
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
  
  // Check for exact matches first
  if (specialNameMappings[lowerName]) {
    const mapping = specialNameMappings[lowerName];
    return typeof mapping === 'function' ? mapping(name) : mapping;
  }
  
  // Check for partial matches (useful for forms) - prioritize longer matches
  const matchingKeys = Object.keys(specialNameMappings)
    .filter(key => typeof specialNameMappings[key] === 'string' && lowerName.includes(key) && key.length > 3)
    .sort((a, b) => b.length - a.length); // Longer matches first
  
  if (matchingKeys.length > 0) {
    return specialNameMappings[matchingKeys[0]];
  }
  
  // Check for regional forms
  for (const [region, mapper] of Object.entries(specialNameMappings)) {
    if (typeof mapper === 'function' && lowerName.includes(region)) {
      return mapper(name);
    }
  }
  
  return pokemonNameToSlug(name);
}

// Get optimized sprite URL with enhanced form handling
export function getOptimizedSpriteUrl(pokemonName, pokemonId) {
  // Use enhanced database form name processing
  const processedSlug = processDatabaseFormName(pokemonName);
  
  // For latest generation sprites (preferred)
  const modernUrl = `https://img.pokemondb.net/sprites/scarlet-violet/icon/${processedSlug}.png`;
  
  // For classic pixel art (fallback)
  const classicUrl = `https://img.pokemondb.net/sprites/black-white/icon/${processedSlug}.png`;
  
  // Additional fallback with different generations
  const alternativeUrls = [
    `https://img.pokemondb.net/sprites/sword-shield/icon/${processedSlug}.png`,
    `https://img.pokemondb.net/sprites/sun-moon/icon/${processedSlug}.png`,
    `https://img.pokemondb.net/sprites/x-y/icon/${processedSlug}.png`
  ];
  
  // If we have an ID, also try ID-based URLs as final fallback
  if (pokemonId) {
    alternativeUrls.push(
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`,
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/${pokemonId}.png`
    );
  }
  
  return {
    primary: modernUrl,
    fallback: classicUrl,
    alternatives: alternativeUrls,
    processedName: processedSlug
  };
}