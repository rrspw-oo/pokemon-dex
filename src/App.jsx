import { useState, useMemo } from "react";
import SearchBox from "./components/SearchBox";
import PokemonGrid from "./components/PokemonGrid";
import Footer from "./components/Footer";
import { searchPokemon, searchPokemonForms } from "./services/pokemonApi";
import "./App.css";
import "./styles/pixelEffects.css";

// LRU Cache implementation for app-level caching
class LRUCache {
  constructor(maxSize = 50) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
  }
}

function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [displayCount, setDisplayCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resetKey, setResetKey] = useState(0);

  // Use memoized LRU cache for better memory management
  const searchCache = useMemo(() => new LRUCache(50), []);

  const handleSearch = async (query) => {
    if (!query || query.length < 1) {
      setSearchResults([]);
      setAllResults([]);
      setDisplayCount(5);
      setError(null);
      return;
    }

    // 檢查緩存
    if (searchCache.has(query)) {
      const cachedResults = searchCache.get(query);
      setAllResults(cachedResults);
      setSearchResults(cachedResults.slice(0, 5));
      setDisplayCount(5);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await searchPokemon(query.trim(), false);

      // 儲存緩存
      searchCache.set(query, results);

      setAllResults(results);
      setSearchResults(results.slice(0, 5));
      setDisplayCount(5);

      if (results.length === 0) {
        setError(`找不到包含 "${query}" 的寶可夢`);
      }
    } catch (error) {
      console.warn('Search error:', error);
      setError("搜尋時發生錯誤，請稍後再試");
      setSearchResults([]);
      setAllResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    const newDisplayCount = displayCount + 5;
    setDisplayCount(newDisplayCount);
    setSearchResults(allResults.slice(0, newDisplayCount));
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
      searchCache.set(cacheKey, forms);

      setSearchResults(forms);

      if (forms.length === 0) {
        setError(`找不到 ${pokemon.chineseName} 的型態資料`);
      }
    } catch (error) {
      console.warn('Pokemon forms error:', error);
      setError(`載入 ${pokemon.chineseName} 型態時發生錯誤，請稍後再試`);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHeaderClick = () => {
    // Clear all search state and reset SearchBox
    setSearchResults([]);
    setAllResults([]);
    setDisplayCount(5);
    setError(null);
    searchCache.clear();
    setIsLoading(false);

    // Trigger SearchBox reset by updating resetKey
    setResetKey(prev => prev + 1);
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header" onClick={handleHeaderClick} style={{ cursor: 'pointer' }}>
          <p>Pokemon Search Tool</p>
        </header>
        <SearchBox onSearch={handleSearch} isLoading={isLoading} resetKey={resetKey} />
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        <PokemonGrid
          pokemon={searchResults}
          onPokemonClick={handlePokemonClick}
          isLoading={isLoading}
          onLoadMore={handleLoadMore}
          hasMore={allResults.length > displayCount}
          totalCount={allResults.length}
          displayCount={displayCount}
        />
        <Footer />
      </div>
    </div>
  );
}

export default App;
