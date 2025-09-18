import { useState, useCallback, useRef } from "react";
import "./SearchBox.css";

function SearchBox({ onSearch, isLoading }) {
  const [query, setQuery] = useState("");
  const timeoutRef = useRef(null);

  // Debounce search to avoid too many API calls
  const debouncedSearch = useCallback((searchQuery) => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      onSearch(searchQuery);
    }, 300); // 降低延遲時間到 300ms，提升回應速度
  }, [onSearch]);

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
