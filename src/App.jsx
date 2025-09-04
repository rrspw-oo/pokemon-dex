import { useState } from "react";
import SearchBox from "./components/SearchBox";
import PokemonGrid from "./components/PokemonGrid";
import Footer from "./components/Footer";
import { searchPokemon } from "./services/pokemonApi";
import "./App.css";
import "./styles/pixelEffects.css";

function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchCache, setSearchCache] = useState(new Map());
  const [error, setError] = useState(null);

  const handleSearch = async (query) => {
    if (!query || query.length < 1) {
      setSearchResults([]);
      setError(null);
      return;
    }

    // 檢查緩存
    if (searchCache.has(query)) {
      console.log("使用緩存結果");
      setSearchResults(searchCache.get(query));
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 調用 searchPokemon，預設顯示進化鏈
      const results = await searchPokemon(query.trim(), true);

      // 儲存緩存
      setSearchCache((prevCache) => {
        const newCache = new Map(prevCache);
        newCache.set(query, results);
        return newCache;
      });

      setSearchResults(results);

      if (results.length === 0) {
        setError(`找不到包含 "${query}" 的寶可夢`);
      }
    } catch (err) {
      console.error("搜尋錯誤:", err);
      setError("搜尋時發生錯誤，請稍後再試");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePokemonClick = (pokemon) => {
    // 重新搜尋該寶可夢，顯示其進化鏈
    handleSearch(pokemon.id.toString());
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>寶可夢搜尋器</h1>
          <p>Pokemon Search Tool</p>
        </header>

        <SearchBox onSearch={handleSearch} isLoading={isLoading} />

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="loading">
            <div className="loading-spinner">
              <img
                src="/pikachuLibre.png"
                alt="Loading Pokemon..."
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentElement.classList.add(
                    "loading-spinner-fallback"
                  );
                  e.target.parentElement.classList.remove("loading-spinner");
                }}
              />
            </div>
            <p>搜尋中...</p>
          </div>
        ) : (
          <PokemonGrid pokemon={searchResults} onPokemonClick={handlePokemonClick} />
        )}

        <Footer />
      </div>
    </div>
  );
}

export default App;
