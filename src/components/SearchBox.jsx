import { useState, useCallback, useRef, useEffect } from "react";
import SearchSuggestions from "./SearchSuggestions";
import { getPokemonSearchSuggestions } from "../services/pokemonApi";
import "./SearchBox.css";

function SearchBox({ onSearch, isLoading, resetKey }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [caretPosition, setCaretPosition] = useState(0);
  const [showCaret, setShowCaret] = useState(false);

  const suggestionsTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const isSelectingSuggestionRef = useRef(false);
  const measureSpanRef = useRef(null);

  // Update caret position
  const updateCaretPosition = useCallback(() => {
    if (!inputRef.current || !measureSpanRef.current) return;

    const input = inputRef.current;
    const cursorPos = input.selectionStart || 0;
    const textBeforeCursor = query.substring(0, cursorPos);

    measureSpanRef.current.textContent = textBeforeCursor;
    const textWidth = measureSpanRef.current.offsetWidth;

    setCaretPosition(16 + textWidth);
  }, [query]);

  // Update caret position when query changes
  useEffect(() => {
    updateCaretPosition();
  }, [query, updateCaretPosition]);

  // Handle reset from parent component
  useEffect(() => {
    if (resetKey) {
      setQuery("");
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
      setShowCaret(false);

      // Clear any pending timeouts
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current);
        suggestionsTimeoutRef.current = null;
      }
    }
  }, [resetKey]);

  // 搜尋功能（現在只在提交和選擇建議時使用）
  const performSearch = useCallback(
    (searchQuery) => {
      onSearch(searchQuery);
    },
    [onSearch]
  );

  // 獲取搜尋建議
  const fetchSuggestions = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsFetchingSuggestions(true);

    try {
      const newSuggestions = await getPokemonSearchSuggestions(searchQuery, 50);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    } catch (error) {
      console.warn("Search suggestions error:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsFetchingSuggestions(false);
    }
  }, []);

  // 防抖獲取建議
  const debouncedFetchSuggestions = useCallback(
    (searchQuery) => {
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current);
      }

      suggestionsTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(searchQuery);
      }, 200); // 建議獲取延遲較短
    },
    [fetchSuggestions]
  );

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
    // Set flag to prevent focus handler from retriggering suggestions
    isSelectingSuggestionRef.current = true;

    // Use englishName or id for search instead of formatted text
    const searchTerm =
      suggestion.englishName || suggestion.id?.toString() || suggestion.text;
    setQuery(searchTerm);
    setSuggestions([]); // Clear suggestions array to prevent retrigger
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    performSearch(searchTerm);

    // Reset flag after a short delay
    setTimeout(() => {
      isSelectingSuggestionRef.current = false;
    }, 200);
  };

  // 處理鍵盤導航
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case "Enter":
        e.preventDefault();
        if (
          selectedSuggestionIndex >= 0 &&
          suggestions[selectedSuggestionIndex]
        ) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        } else if (query.trim()) {
          performSearch(query.trim());
          setShowSuggestions(false);
        }
        break;

      case "Escape":
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
    // Don't show suggestions if we're in the middle of selecting one
    if (
      !isSelectingSuggestionRef.current &&
      query.length >= 1 &&
      suggestions.length > 0
    ) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = (e) => {
    if (e.relatedTarget && e.relatedTarget.type === 'submit') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
      return;
    }

    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 150);
  };

  return (
    <div className="search-box" ref={containerRef}>
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-container">
          <span
            ref={measureSpanRef}
            style={{
              position: "absolute",
              visibility: "hidden",
              whiteSpace: "pre",
              fontFamily: "Press Start 2P, Courier New, monospace",
              fontSize: "14px",
            }}
          />

          {showCaret && (
            <div
              className="pixel-caret"
              style={{ left: `${caretPosition}px` }}
            />
          )}

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              handleInputFocus();
              setShowCaret(true);
              updateCaretPosition();
            }}
            onBlur={() => {
              handleInputBlur();
              setShowCaret(false);
            }}
            onClick={updateCaretPosition}
            onKeyUp={updateCaretPosition}
            placeholder={showCaret ? "" : " # or names"}
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
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
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
