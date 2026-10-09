import { useEffect, useState } from "react";
import SearchBox from "./components/SearchBox";
import PokemonGrid from "./components/PokemonGrid";
import PokemonDetail from "./components/PokemonDetail";
import Footer from "./components/Footer";
import { searchPokemon, getPokemonByKey } from "./services/pokemonApi";

const PAGE_SIZE = 12;
const EXAMPLES = ["皮卡丘", "#150", "阿羅拉", "惡屬性", "捕捉惡屬性", "誘餌"];

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState(() => {
    const key = window.history.state?.pokemonKey;
    return key == null ? null : getPokemonByKey(key);
  });
  const [resetKey, setResetKey] = useState(0);
  const [presetQuery, setPresetQuery] = useState("");

  useEffect(() => {
    const onPop = (e) => {
      const key = e.state?.pokemonKey;
      setSelected(key == null ? null : getPokemonByKey(key));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const runSearch = (q) => {
    const found = searchPokemon(q);
    setQuery(q);
    setResults(found);
    setVisible(PAGE_SIZE);
    return found;
  };

  const openDetail = (pokemon, from = selected ? "pokemon" : "list") => {
    setSelected(pokemon);
    window.history.pushState({ pokemonKey: pokemon.key, from }, "");
    window.scrollTo(0, 0);
  };

  const handleSearch = (q) => {
    runSearch(q);
    if (selected) window.history.replaceState(null, "");
    setSelected(null);
  };

  const handleSuggestion = (pokemon, typed) => {
    runSearch(typed);
    openDetail(pokemon);
  };

  const runExample = (example) => {
    setPresetQuery(example);
    setResetKey((k) => k + 1);
    handleSearch(example);
  };

  const reset = () => {
    setPresetQuery("");
    setQuery("");
    setResults(null);
    setSelected(null);
    setResetKey((k) => k + 1);
    window.history.replaceState(null, "");
  };

  return (
    <div className="shell">
      <header className="bezel">
        <span className="power-led" aria-hidden="true" />
        <h1 className="title">
          <button type="button" onClick={reset} aria-label="重設搜尋">
            Pokemon Search Tool
          </button>
        </h1>
      </header>

      <main className="screen">
        <SearchBox
          onSearch={handleSearch}
          onSelect={handleSuggestion}
          resetKey={resetKey}
          presetQuery={presetQuery}
        />

        {selected ? (
          <PokemonDetail
            key={selected.key}
            pokemon={selected}
            onSelect={(p) => openDetail(p)}
            backLabel={window.history.state?.from === "pokemon" ? "上一隻" : "全部結果"}
            onBack={() => window.history.back()}
          />
        ) : results === null ? (
          <section className="home">
            <div className="chips">
              {EXAMPLES.map((ex) => (
                <button key={ex} type="button" className="chip" onClick={() => runExample(ex)}>
                  {ex}
                </button>
              ))}
            </div>
          </section>
        ) : results.length === 0 ? (
          <p className="message">找不到「{query}」相關的寶可夢</p>
        ) : (
          <PokemonGrid
            pokemon={results}
            visible={visible}
            onSelect={(p) => openDetail(p)}
            onLoadMore={() => setVisible((v) => v + PAGE_SIZE)}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
