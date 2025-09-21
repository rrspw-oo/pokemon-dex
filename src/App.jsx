import { useState } from "react";
import SearchBox from "./components/SearchBox";
import PokemonGrid from "./components/PokemonGrid";
import Footer from "./components/Footer";
import { searchPokemon, searchPokemonForms } from "./services/pokemonApi";
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
      setError("搜尋時發生錯誤，請稍後再試");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePokemonClick = async (pokemon) => {

    const cacheKey = `forms_evos_${pokemon.id}`;

    // 檢查緩存
    if (searchCache.has(cacheKey)) {
      setSearchResults(searchCache.get(cacheKey));
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 搜尋該寶可夢的所有型態和進化鏈
      const forms = await searchPokemonForms(pokemon.id);

      // 儲存緩存
      setSearchCache((prevCache) => {
        const newCache = new Map(prevCache);
        newCache.set(cacheKey, forms);
        return newCache;
      });

      setSearchResults(forms);

      if (forms.length === 0) {
        setError(`找不到 ${pokemon.chineseName} 的型態資料`);
      } else {
      }
    } catch (err) {
      setError(`載入 ${pokemon.chineseName} 型態時發生錯誤，請稍後再試`);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <p>Pokemon Search Tool</p>
        </header>
        <SearchBox onSearch={handleSearch} isLoading={isLoading} />
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        <PokemonGrid
          pokemon={searchResults}
          onPokemonClick={handlePokemonClick}
        />
        <Footer />
      </div>
    </div>
  );
}

export default App;
