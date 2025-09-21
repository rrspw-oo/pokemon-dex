import { useState, useCallback, useRef } from "react";
import SearchSuggestions from "./SearchSuggestions";
import { getPokemonSearchSuggestions } from "../services/pokemonApi";
import "./SearchBox.css";

function SearchBox({ onSearch, isLoading }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  const suggestionsTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // 搜尋功能（現在只在提交和選擇建議時使用）
  const performSearch = useCallback((searchQuery) => {
    onSearch(searchQuery);
  }, [onSearch]);

  // 獲取搜尋建議
  const fetchSuggestions = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsFetchingSuggestions(true);

    try {
      const newSuggestions = await getPokemonSearchSuggestions(searchQuery, 5);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    } catch (error) {
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsFetchingSuggestions(false);
    }
  }, []);

  // 防抖獲取建議
  const debouncedFetchSuggestions = useCallback((searchQuery) => {
    if (suggestionsTimeoutRef.current) {
      clearTimeout(suggestionsTimeoutRef.current);
    }

    suggestionsTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 200); // 建議獲取延遲較短
  }, [fetchSuggestions]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedSuggestionIndex(-1); // 重置選中項目

    if (value.length === 0) {
      onSearch(""); // Clear results immediately when input is empty
      setSuggestions([]);
      setShowSuggestions(false);
    } else if (value.length >= 1) {
      // 只獲取建議，不立即搜尋
      debouncedFetchSuggestions(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    onSearch("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  // 處理建議點擊
  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    performSearch(suggestion.text);
  };

  // 處理鍵盤導航
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        } else if (query.trim()) {
          performSearch(query.trim());
          setShowSuggestions(false);
        }
        break;

      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        inputRef.current?.blur();
        break;

      default:
        break;
    }
  };

  // 處理輸入框焦點
  const handleInputFocus = () => {
    if (query.length >= 1 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // 延遲隱藏建議，讓點擊事件能夠觸發
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 150);
  };

  return (
    <div className="search-box" ref={containerRef}>
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-container">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="enter Pokemon's # or names"
            className="search-input"
            disabled={isLoading}
            autoComplete="off"
            role="combobox"
            aria-expanded={showSuggestions}
            aria-haspopup="listbox"
            aria-autocomplete="list"
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

          <SearchSuggestions
            query={query}
            suggestions={suggestions}
            isVisible={showSuggestions}
            onSuggestionClick={handleSuggestionClick}
            onSuggestionHover={setSelectedSuggestionIndex}
            selectedIndex={selectedSuggestionIndex}
            isLoading={isFetchingSuggestions}
          />
        </div>
      </form>
    </div>
  );
}

export default SearchBox;
