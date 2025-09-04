import { memo, useState } from "react";
import { getTypeColor } from "../services/pokemonApi";
import "./PokemonCard.css";
import "../styles/pixelEffects.css";

const PokemonCard = memo(function PokemonCard({ pokemon, onClick }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState(new Set());

  // Build fallback image chain
  const getImageChain = () => {
    const chain = [];
    if (pokemon.image) chain.push(pokemon.image);
    if (pokemon.imageFallback && pokemon.imageFallback !== pokemon.image) {
      chain.push(pokemon.imageFallback);
    }
    // Add any alternative URLs if available
    if (pokemon.imageAlternatives) {
      pokemon.imageAlternatives.forEach(url => {
        if (!chain.includes(url)) chain.push(url);
      });
    }
    return chain;
  };

  const handleImageError = (event) => {
    const failedUrl = event.target.src;
    const imageChain = getImageChain();
    
    console.warn(`Image failed to load for Pokemon ${pokemon.id} (${pokemon.englishName}):`, failedUrl);
    
    // Track failed URL
    setFailedUrls(prev => new Set([...prev, failedUrl]));
    
    // Try next image in chain
    if (currentImageIndex < imageChain.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
      console.log(`Trying fallback image ${currentImageIndex + 1}/${imageChain.length} for Pokemon ${pokemon.id}`);
    } else {
      // All images failed
      console.error(`All images failed for Pokemon ${pokemon.id} (${pokemon.englishName}). Failed URLs:`, Array.from(failedUrls));
      setImageError(true);
      setImageLoaded(true);
    }
  };

  const handleImageLoad = () => {
    const loadedUrl = getCurrentImageUrl();
    console.log(`Successfully loaded image for Pokemon ${pokemon.id} (${pokemon.englishName}):`, loadedUrl);
    setImageLoaded(true);
  };

  // Get current image URL to display
  const getCurrentImageUrl = () => {
    const imageChain = getImageChain();
    
    if (imageError) {
      // All images failed, return placeholder
      return pokemon.imageFallback || pokemon.image;
    }
    
    // Return current image in chain
    if (currentImageIndex < imageChain.length) {
      return imageChain[currentImageIndex];
    }
    
    // Fallback to original image
    return pokemon.image;
  };

  const formatId = (id) => {
    return `#${id.toString().padStart(3, "0")}`;
  };

  const formatStat = (statName) => {
    const statMap = {
      hp: "HP",
      attack: "攻擊",
      defense: "防禦",
      "special-attack": "特攻",
      "special-defense": "特防",
      speed: "速度",
    };
    return statMap[statName] || statName;
  };

  // Get basic pixel class for all Pokemon (no type-based effects)
  const getPixelClass = () => {
    return "pixel-art";
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(pokemon);
    }
  };

  return (
    <div 
      className="pokemon-card pokemon-card-pixel clickable" 
      onClick={handleCardClick}
    >
      <div className="pokemon-header">
        <div className="pokemon-id">{formatId(pokemon.id)}</div>
        {pokemon.types && pokemon.types.length > 0 && (
          <div className="pokemon-types">
            {pokemon.types.map((type, index) => (
              <span
                key={index}
                className="type-badge"
                style={{ backgroundColor: getTypeColor(type.name) }}
              >
                {type.chinese}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="pokemon-image-container">
        {!imageLoaded && (
          <div className="image-placeholder">
            <div className="placeholder-spinner pixel-spinner"></div>
          </div>
        )}
        <img
          src={getCurrentImageUrl()}
          alt={`${pokemon.chineseName} (${pokemon.englishName})`}
          className={`pokemon-image ${
            imageLoaded ? "loaded" : ""
          } ${getPixelClass()} ${
            pokemon.isLocalSprite ? "local-sprite" : "external-sprite"
          }`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
          key={`${pokemon.id}-${currentImageIndex}-${imageError ? "error" : "loading"}`}
        />
      </div>

      <div className="pokemon-names">
        <h3 className="pokemon-name-zh">{pokemon.chineseName}</h3>
        <p className="pokemon-name-en">{pokemon.englishName}</p>
      </div>

      <div className="pokemon-info">
        {false && (
          <div className="pokemon-stats">
            <h4>基礎數值</h4>
            <div className="stats-grid">
              {pokemon.stats.map((stat, index) => (
                <div key={index} className="stat-item">
                  <span className="stat-name">{formatStat(stat.name)}</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar"
                      style={{
                        width: `${Math.min((stat.value / 255) * 100, 100)}%`,
                        backgroundColor:
                          stat.value >= 100
                            ? "#4CAF50"
                            : stat.value >= 70
                            ? "#FFC107"
                            : "#FF5722",
                      }}
                    ></div>
                    <span className="stat-value">{stat.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pokemon.error && (
          <div className="error-info">
            <p>資料載入異常</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default PokemonCard;
