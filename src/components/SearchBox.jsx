import { useState, useCallback } from "react";
import "./SearchBox.css";

function SearchBox({ onSearch, isLoading }) {
  const [query, setQuery] = useState("");

  // Debounce search to avoid too many API calls
  const debounce = useCallback((func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }, []);

  const debouncedSearch = useCallback(
    debounce((searchQuery) => {
      onSearch(searchQuery);
    }, 600), // 增加延遲時間到 600ms，給使用者更多時間輸入
    [onSearch, debounce]
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // 提高最小字符數要求，避免過早觸發搜尋
    if (value.length >= 2) {
      // 從 1 字符改為 2 字符
      debouncedSearch(value);
    } else if (value.length === 0) {
      onSearch(""); // Clear results immediately when input is empty
    }
    // 1 個字符時不進行搜尋，避免過早載入
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const clearSearch = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <div className="search-box">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-container">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="enter Pokemon's # or names"
            className="search-input"
            disabled={isLoading}
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="clear-button"
              disabled={isLoading}
            ></button>
          )}
          <button
            type="submit"
            className="search-button"
            disabled={isLoading || query.trim().length < 1}
          >
            {isLoading ? "Catching..." : "GO"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SearchBox;
