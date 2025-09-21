import "./PokemonCardSkeleton.css";

function PokemonCardSkeleton() {
  return (
    <div className="pokemon-card-skeleton">
      <div className="skeleton-image"></div>
      <div className="skeleton-content">
        <div className="skeleton-id"></div>
        <div className="skeleton-name"></div>
        <div className="skeleton-name-en"></div>
        <div className="skeleton-types">
          <div className="skeleton-type"></div>
          <div className="skeleton-type"></div>
        </div>
      </div>
    </div>
  );
}

export default PokemonCardSkeleton;