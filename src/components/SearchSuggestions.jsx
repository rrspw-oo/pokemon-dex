import { useEffect, useRef, useState, useCallback } from "react";
import "./SearchSuggestions.css";

function SearchSuggestions({
  query,
  suggestions,
  isVisible,
  onSuggestionClick,
  onSuggestionHover,
  selectedIndex = -1,
  isLoading = false
}) {
  const suggestionRefs = useRef([]);
  const containerRef = useRef(null);
  const [displayCount, setDisplayCount] = useState(5);

  useEffect(() => {
    setDisplayCount(5);
  }, [suggestions]);

  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  const loadMoreSuggestions = useCallback(() => {
    setDisplayCount(prev => Math.min(prev + 5, suggestions.length));
  }, [suggestions.length]);

  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const threshold = 50;

    if (scrollHeight - scrollTop - clientHeight < threshold) {
      if (displayCount < suggestions.length) {
        loadMoreSuggestions();
      }
    }
  }, [displayCount, suggestions.length, loadMoreSuggestions]);

  if (!isVisible || (!suggestions.length && !isLoading)) {
    return null;
  }

  const handleSuggestionClick = (suggestion, index) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion, index);
    }
  };

  const handleSuggestionMouseEnter = (index) => {
    if (onSuggestionHover) {
      onSuggestionHover(index);
    }
  };

  // 移除 highlightMatch 函數，新設計不需要高亮

  // 移除類型圖示，採用更簡潔的設計

  const displayedSuggestions = suggestions.slice(0, displayCount);
  const hasMore = displayCount < suggestions.length;

  return (
    <div
      className="search-suggestions"
      data-visible={isVisible}
      ref={containerRef}
      onScroll={handleScroll}
    >
      {isLoading && (
        <div className="suggestion-item loading">
          <div className="suggestion-spinner"></div>
          <span>搜尋中...</span>
        </div>
      )}

      {displayedSuggestions.map((suggestion, index) => (
        <div
          key={`${suggestion.text}-${suggestion.id || index}`}
          ref={el => suggestionRefs.current[index] = el}
          className={`suggestion-item ${
            index === selectedIndex ? 'selected' : ''
          }`}
          onClick={() => handleSuggestionClick(suggestion, index)}
          onMouseEnter={() => handleSuggestionMouseEnter(index)}
        >
          <div className="suggestion-content">
            <div className="pokemon-info">
              <div className="pokemon-main-line">
                <span className="pokemon-id">
                  #{suggestion.id?.toString().padStart(3, '0') || '???'}
                </span>
                <span className="pokemon-name-chinese">
                  {suggestion.chineseName || '未知'}
                </span>
              </div>
              <div className="pokemon-secondary-line">
                <span className="pokemon-name-english">
                  {suggestion.englishName || suggestion.text}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {hasMore && !isLoading && (
        <div className="suggestions-load-more">
          <button onClick={loadMoreSuggestions} type="button">
            Load More ({suggestions.length - displayCount} more)
          </button>
        </div>
      )}

      {!isLoading && suggestions.length === 0 && query && (
        <div className="suggestion-item no-results">
          <div className="suggestion-icon">❌</div>
          <div className="suggestion-content">
            <div className="suggestion-text">沒有找到相關建議</div>
            <div className="suggestion-meta">試試不同的關鍵字</div>
          </div>
        </div>
      )}

      {!query && (
        <div className="suggestion-section">
          <div className="suggestion-header">熱門搜尋</div>
        </div>
      )}
    </div>
  );
}

export default SearchSuggestions;