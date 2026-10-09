import { memo } from "react";
import Sprite from "./Sprite";
import TypeBadges from "./TypeBadges";
import { formatId } from "../utils/format";

const PokemonCard = memo(function PokemonCard({ pokemon, onSelect, eager }) {
  return (
    <button type="button" className="poke-card" onClick={() => onSelect(pokemon)}>
      <span className="poke-card-top">
        <span className="dex-no">{formatId(pokemon.id)}</span>
        <TypeBadges types={pokemon.types} />
      </span>
      <span className="sprite-tile">
        <Sprite key={pokemon.image[0]} urls={pokemon.image} alt={pokemon.zh} eager={eager} />
      </span>
      <span className="poke-card-zh">{pokemon.zh}</span>
      <span className="poke-card-en">{pokemon.en}</span>
      {pokemon.hint && <span className="poke-card-hint">{pokemon.hint}</span>}
    </button>
  );
});

export default PokemonCard;
