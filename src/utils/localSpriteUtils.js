// Pokemon sprite utilities with enhanced mapping service
import { pokemonSpriteMappingService } from './pokemonSpriteMappingService.js';

// Get PokemonDB sprite URL for Pokemon ID (replaces local sprites)
export function getLocalSpritePath() {
  // This function now returns null since we removed local sprites
  // All sprites will be served from PokemonDB
  return null;
}

// Get sprite URL with enhanced mapping service and fallback system
export function getSpriteWithFallback(pokemonId, pokemonName, isSearchError = false) {
  // Use the enhanced sprite mapping service
  const spriteData = pokemonSpriteMappingService.getSpriteUrls(pokemonId, pokemonName);



  return {
    primary: spriteData.primary,
    isLocal: false,
    fallback: spriteData.fallback,
    alternatives: spriteData.alternatives, // Pass through alternative URLs
    placeholder: generatePixelPlaceholder(pokemonName, isSearchError),
    processedName: spriteData.processedName, // For debugging
    debugInfo: spriteData.debugInfo
  };
}

// Generate pixel-style placeholder
function generatePixelPlaceholder(pokemonName, isSearchError = false) {
  // Use different image for search errors (Image #3 instead of Image #2)
  if (isSearchError) {
    return "/pokemonBall.svg"; // Replace Image #2 with Image #3 during search errors
  }

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated;">
      <defs>
        <pattern id="checkerboard" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="4" height="4" fill="#f0f0f0"/>
          <rect x="4" y="4" width="4" height="4" fill="#f0f0f0"/>
          <rect x="4" y="0" width="4" height="4" fill="#e0e0e0"/>
          <rect x="0" y="4" width="4" height="4" fill="#e0e0e0"/>
        </pattern>
      </defs>
      <rect width="64" height="64" fill="url(#checkerboard)" stroke="#ccc" stroke-width="1"/>
      <rect x="12" y="12" width="40" height="40" fill="#f8f8f8" stroke="#ddd" stroke-width="1"/>
      <!-- Simple pixel art face -->
      <rect x="20" y="24" width="4" height="4" fill="#333"/>
      <rect x="40" y="24" width="4" height="4" fill="#333"/>
      <rect x="28" y="32" width="8" height="4" fill="#666" rx="1"/>
      <text x="32" y="54" text-anchor="middle" font-family="monospace" font-size="6" fill="#888">
        ${pokemonName ? pokemonName.substring(0, 8).toUpperCase() : 'POKEMON'}
      </text>
    </svg>
  `)}`;
}

// Check if local sprite exists for Pokemon ID (now always returns false)
export function hasLocalSprite() {
  return false; // No local sprites available
}

// Get all available local sprite IDs (now returns empty array)
export function getAvailableSpriteIds() {
  return []; // No local sprites available
}