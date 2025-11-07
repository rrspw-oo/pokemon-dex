import { memo, useState, useEffect } from "react";
import { getTypeColor } from "../services/pokemonApi";
import { getChineseName } from "../utils/pokemonNamesHelper";
import "./PokemonCard.css";
import "../styles/pixelEffects.css";

const PokemonCard = memo(function PokemonCard({ pokemon, onClick }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState(new Set());
  const [isShiny, setIsShiny] = useState(false);
  const [resolvedChineseName, setResolvedChineseName] = useState(pokemon.chineseName);

  // Fallback name resolution when Chinese name is missing or equals English name
  useEffect(() => {
    const needsResolution = !pokemon.chineseName ||
                          pokemon.chineseName === pokemon.englishName ||
                          pokemon.chineseName === pokemon.name ||
                          pokemon.chineseName === "未知寶可夢";

    if (needsResolution) {

      getChineseName(pokemon.id, pokemon.englishName || pokemon.name)
        .then(resolvedName => {
          if (resolvedName && resolvedName !== pokemon.englishName && resolvedName !== pokemon.name) {
            setResolvedChineseName(resolvedName);
          } else {
          }
        })
        .catch(error => {
        });
    }
  }, [pokemon.id, pokemon.chineseName, pokemon.englishName, pokemon.name]);

  // Build fallback image chain
  const getImageChain = () => {
    const chain = [];

    // Use shiny images if shiny mode is enabled and available
    if (isShiny && pokemon.hasShinySprite && pokemon.shinyImage) {
      chain.push(pokemon.shinyImage);
    }

    // Fallback to normal images
    if (pokemon.image) chain.push(pokemon.image);
    if (pokemon.imageFallback && pokemon.imageFallback !== pokemon.image) {
      chain.push(pokemon.imageFallback);
    }
    // Add any alternative URLs if available
    if (pokemon.imageAlternatives) {
      pokemon.imageAlternatives.forEach((url) => {
        if (!chain.includes(url)) chain.push(url);
      });
    }
    return chain;
  };

  const handleImageError = (event) => {
    const failedUrl = event.target.src;
    const imageChain = getImageChain();


    // Track failed URL
    setFailedUrls((prev) => new Set([...prev, failedUrl]));

    // Try next image in chain
    if (currentImageIndex < imageChain.length - 1) {
      setCurrentImageIndex((prev) => prev + 1);
    } else {
      // All images failed
      setImageError(true);
      setImageLoaded(true);
    }
  };

  const handleImageLoad = () => {
    const loadedUrl = getCurrentImageUrl();
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


  // Get basic pixel class for all Pokemon (no type-based effects)
  const getPixelClass = () => {
    return "pixel-art";
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(pokemon);
    }
  };

  const handleShinyToggle = (event) => {
    event.stopPropagation(); // Prevent card click when toggling shiny
    if (pokemon.hasShinySprite) {
      setIsShiny(!isShiny);
      setCurrentImageIndex(0); // Reset image index when switching modes
      setImageError(false); // Reset error state
      setFailedUrls(new Set()); // Reset failed URLs
    }
  };

  return (
    <div
      className={`pokemon-card pokemon-card-pixel clickable ${
        isShiny ? "shiny" : ""
      }`}
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
          alt={`${resolvedChineseName} (${pokemon.englishName})`}
          className={`pokemon-image ${
            imageLoaded ? "loaded" : ""
          } ${getPixelClass()} ${
            pokemon.isLocalSprite ? "local-sprite" : "external-sprite"
          }`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
          key={`${pokemon.id}-${currentImageIndex}-${
            imageError ? "error" : "loading"
          }-${isShiny ? "shiny" : "normal"}`}
        />
      </div>

      <div className="pokemon-names">
        <h3 className="pokemon-name-zh">{resolvedChineseName}</h3>
        <p className="pokemon-name-en">{pokemon.englishName}</p>
        {pokemon.hasShinySprite && (
          <button
            className={`shiny-toggle ${isShiny ? "active" : ""}`}
            onClick={handleShinyToggle}
            title={isShiny ? "切換至一般型態" : "切換至閃光型態"}
          >
            Shiny
          </button>
        )}
      </div>

      <div className="pokemon-info">
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
