import { memo } from "react";
import Sprite from "./Sprite";
import TypeBadges from "./TypeBadges";
import { formatId } from "../utils/format";
import { nameOf, useLang } from "../i18n";

const PokemonCard = memo(function PokemonCard({ pokemon, onSelect, eager }) {
  const lang = useLang();
  const hint = lang === "en" ? pokemon.hintEn : pokemon.hint;
  return (
    <button type="button" className="poke-card" onClick={() => onSelect(pokemon)}>
      <span className="poke-card-top">
        <span className="dex-no">{formatId(pokemon.id)}</span>
        <TypeBadges types={pokemon.types} />
      </span>
      <span className="sprite-tile">
        <Sprite key={pokemon.image[0]} urls={pokemon.image} alt={nameOf(pokemon, lang)} eager={eager} />
      </span>
      <span className="poke-card-zh">{nameOf(pokemon, lang)}</span>
      {lang !== "en" && <span className="poke-card-en">{pokemon.en}</span>}
      {hint && <span className="poke-card-hint">{hint}</span>}
    </button>
  );
});

export default PokemonCard;
