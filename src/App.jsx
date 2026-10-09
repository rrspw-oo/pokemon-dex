import { useEffect, useState } from "react";
import SearchBox from "./components/SearchBox";
import PokemonGrid from "./components/PokemonGrid";
import PokemonDetail from "./components/PokemonDetail";
import TypeView from "./components/TypeView";
import CupView from "./components/CupView";
import Footer from "./components/Footer";
import { searchPokemon, getPokemonByKey } from "./services/pokemonApi";

const PAGE_SIZE = 12;
const EXAMPLES = ["皮卡丘", "#150", "阿羅拉", "惡屬性", "捕捉惡屬性", "誘餌"];
const TABS = [
  ["dex", "圖鑑"],
  ["types", "屬性"],
  ["cups", "盃賽"],
];
const BACK_LABELS = { pokemon: "上一隻", list: "全部結果", types: "屬性排行", cups: "盃賽", home: "返回" };

const navFromState = (state) => ({
  view: state?.view || "dex",
  pokemonKey: state?.pokemonKey ?? null,
  from: state?.from || null,
  type: state?.type || null,
  type2: state?.type2 || null,
  cup: state?.cup || null,
  league: state?.league || 1500,
});

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [nav, setNav] = useState(() => navFromState(window.history.state));
  const [resetKey, setResetKey] = useState(0);
  const [presetQuery, setPresetQuery] = useState("");

  const selected = nav.pokemonKey == null ? null : getPokemonByKey(nav.pokemonKey);

  useEffect(() => {
    const onPop = (e) => setNav(navFromState(e.state));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const go = (next, replace = false) => {
    const state = { ...next };
    if (replace) window.history.replaceState(state, "");
    else window.history.pushState(state, "");
    setNav(navFromState(state));
    window.scrollTo(0, 0);
  };

  const runSearch = (q) => {
    setQuery(q);
    setResults(searchPokemon(q));
    setVisible(PAGE_SIZE);
  };

  const openDetail = (pokemon) => {
    const from = selected ? "pokemon" : nav.view === "dex" ? (results ? "list" : "home") : nav.view;
    go({
      view: nav.view,
      type: nav.type,
      type2: nav.type2,
      cup: nav.cup,
      league: nav.league,
      pokemonKey: pokemon.key,
      from,
    });
  };

  const handleSearch = (q) => {
    runSearch(q);
    if (nav.view !== "dex" || selected) go({ view: "dex" });
  };

  const handleSuggestion = (pokemon, typed) => {
    runSearch(typed);
    go({ view: "dex", pokemonKey: pokemon.key, from: "list" });
  };

  const runExample = (example) => {
    setPresetQuery(example);
    setResetKey((k) => k + 1);
    handleSearch(example);
  };

  const openType = (type, type2 = null, replace = false) => go({ view: "types", type, type2 }, replace);

  const reset = () => {
    setPresetQuery("");
    setQuery("");
    setResults(null);
    setResetKey((k) => k + 1);
    go({ view: "dex" }, true);
  };

  const renderView = () => {
    if (selected) {
      return (
        <PokemonDetail
          key={selected.key}
          pokemon={selected}
          onSelect={openDetail}
          onTypeClick={(type) => openType(type)}
          backLabel={BACK_LABELS[nav.from] || "返回"}
          onBack={() => window.history.back()}
        />
      );
    }
    if (nav.view === "types") {
      return (
        <TypeView
          type={nav.type}
          type2={nav.type2}
          onChange={(type, type2) => openType(type, type2, true)}
          onSelect={openDetail}
        />
      );
    }
    if (nav.view === "cups") {
      return (
        <CupView
          cupId={nav.cup}
          league={nav.league}
          onLeague={(league) => go({ view: "cups", league }, true)}
          onOpen={(cup) => go({ view: "cups", cup, league: nav.league })}
          onBack={() => window.history.back()}
          onSelect={openDetail}
        />
      );
    }
    if (results === null) {
      return (
        <section className="home">
          <div className="chips">
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" className="chip" onClick={() => runExample(ex)}>
                {ex}
              </button>
            ))}
          </div>
        </section>
      );
    }
    if (results.length === 0) return <p className="message">找不到「{query}」相關的寶可夢</p>;
    return (
      <PokemonGrid
        pokemon={results}
        visible={visible}
        onSelect={openDetail}
        onLoadMore={() => setVisible((v) => v + PAGE_SIZE)}
      />
    );
  };

  return (
    <div className="shell">
      <header className="bezel">
        <span className="power-led" aria-hidden="true" />
        <h1 className="title">
          <button type="button" onClick={reset} aria-label="重設搜尋">
            Pok<span className="title-acute">e</span>mon OmniSearch
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

        <nav className="tabs" aria-label="功能">
          {TABS.map(([view, label]) => (
            <button
              key={view}
              type="button"
              className={nav.view === view ? "is-on" : ""}
              aria-current={nav.view === view ? "page" : undefined}
              onClick={() => go({ view })}
            >
              {label}
            </button>
          ))}
        </nav>

        {renderView()}
      </main>

      <Footer />
    </div>
  );
}

export default App;
