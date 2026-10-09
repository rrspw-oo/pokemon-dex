import PokemonCard from "./PokemonCard";

function PokemonGrid({ pokemon, visible, onSelect, onLoadMore }) {
  const shown = pokemon.slice(0, visible);
  return (
    <section className="results" aria-label="搜尋結果">
      <p className="results-count">
        找到 {pokemon.length} 筆
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
