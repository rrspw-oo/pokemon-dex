import PokemonCard from "./PokemonCard";
import { useT } from "../i18n";

function PokemonGrid({ pokemon, visible, onSelect, onLoadMore }) {
  const t = useT();
  const shown = pokemon.slice(0, visible);
  return (
    <section className="results" aria-label={t("搜尋結果")}>
      <p className="results-count">
        {t("找到 {n} 筆", { n: pokemon.length })}
      </p>
      <div className="poke-grid">
        {shown.map((p, i) => (
          <PokemonCard key={p.key} pokemon={p} onSelect={onSelect} eager={i < 6} />
        ))}
      </div>
      {visible < pokemon.length && (
        <button type="button" className="pixel-button load-more" onClick={onLoadMore}>
          LOAD MORE {shown.length}/{pokemon.length}
        </button>
      )}
    </section>
  );
}

export default PokemonGrid;
