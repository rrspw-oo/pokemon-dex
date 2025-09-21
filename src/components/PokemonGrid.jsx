import { memo } from "react";
import PokemonCard from "./PokemonCard";
import "./PokemonGrid.css";

const PokemonGrid = memo(function PokemonGrid({ pokemon, onPokemonClick }) {
  if (!pokemon || pokemon.length === 0) {
    return (
      <div className="pokemon-grid-empty">
        <div className="empty-state"></div>
      </div>
    );
  }

  return (
    <div className="pokemon-grid">
      <div className="pokemon-cards">
        {pokemon.map((poke, index) => {
          // Create a more robust unique key that accounts for variants and evolution sources
          const totalStats = poke.total_stats || poke.stats?.reduce((sum, stat) => sum + stat.value, 0) || 0;
          const isVariant = poke.is_variant || false;
          const variantId = isVariant ? 'variant' : 'base';
          const nameKey = poke.name || poke.englishName || `pokemon-${poke.id}`;

          const uniqueKey = `${poke.id}-${nameKey}-${totalStats}-${variantId}-${index}`;

          return (
            <PokemonCard
              key={uniqueKey}
              pokemon={poke}
              onClick={onPokemonClick}
            />
          );
        })}
      </div>
    </div>
  );
});

export default PokemonGrid;
