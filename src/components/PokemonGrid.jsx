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
        {pokemon.map((poke) => (
          <PokemonCard 
            key={`${poke.id}-${poke.name}`} 
            pokemon={poke} 
            onClick={onPokemonClick}
          />
        ))}
      </div>
    </div>
  );
});

export default PokemonGrid;
