import { useEffect, useRef, useState } from "react";
import SearchSuggestions from "./SearchSuggestions";
import { suggestPokemon } from "../services/pokemonApi";
import { useT } from "../i18n";

const LIST_ID = "search-suggestions";

function SearchBox({ onSearch, onSelect, resetKey, presetQuery }) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const blurTimer = useRef(null);

  useEffect(() => {
    setQuery(presetQuery);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  }, [resetKey, presetQuery]);

  const close = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setActiveIndex(-1);
    const next = value.trim() ? suggestPokemon(value) : [];
    setSuggestions(next);
    setOpen(next.length > 0);
  };

  const submit = () => {
    const q = query.trim();
    if (!q) return;
    close();
    inputRef.current?.blur();
    onSearch(q);
  };

  const pick = (pokemon) => {
    clearTimeout(blurTimer.current);
    close();
    inputRef.current?.blur();
    onSelect(pokemon, query.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown" && open) {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp" && open) {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && activeIndex >= 0) pick(suggestions[activeIndex]);
      else submit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  const clear = () => {
    setQuery("");
    setSuggestions([]);
    close();
    inputRef.current?.focus();
  };

  return (
    <form
      className="search"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="search-field">
        <input
          ref={inputRef}
          type="search"
          enterKeyHint="search"
          className="search-input"
          value={query}
          placeholder={t("輸入編號名稱屬性或進化條件")}
          aria-label={t("搜尋寶可夢")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          role="combobox"
          aria-expanded={open}
          aria-controls={LIST_ID}
          aria-autocomplete="list"
          aria-activedescendant={open && activeIndex >= 0 ? `${LIST_ID}-${activeIndex}` : undefined}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            clearTimeout(blurTimer.current);
            setOpen(suggestions.length > 0);
          }}
          onBlur={() => {
            blurTimer.current = setTimeout(close, 200);
          }}
        />
        {query && (
          <button type="button" className="search-clear" aria-label={t("清除")} onClick={clear} onPointerDown={(e) => e.preventDefault()}>
            ×
          </button>
        )}
      </div>
      <button type="submit" className="search-go" disabled={!query.trim()}>
        GO
      </button>
      {open && (
        <SearchSuggestions
          id={LIST_ID}
          suggestions={suggestions}
          activeIndex={activeIndex}
          onPick={pick}
          onHover={setActiveIndex}
        />
      )}
    </form>
  );
}

export default SearchBox;
