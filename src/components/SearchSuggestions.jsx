import { useEffect, useRef } from "react";
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

  // 當選中項目改變時，滾動到可見區域
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

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

  return (
    <div className="search-suggestions" data-visible={isVisible}>
      {isLoading && (
        <div className="suggestion-item loading">
          <div className="suggestion-spinner"></div>
          <span>搜尋中...</span>
        </div>
      )}

      {suggestions.map((suggestion, index) => (
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