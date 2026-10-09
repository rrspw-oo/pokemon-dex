import { useEffect, useRef } from "react";
import Sprite from "./Sprite";
import { formatId } from "../utils/format";

function SearchSuggestions({ id, suggestions, activeIndex, onPick, onHover }) {
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <ul
      id={id}
      ref={listRef}
      className="suggestions"
      role="listbox"
      onPointerDown={(e) => e.preventDefault()}
    >
      {suggestions.map((p, i) => (
        <li
          key={p.key}
          id={`${id}-${i}`}
          role="option"
          aria-selected={i === activeIndex}
          className={`suggestion ${i === activeIndex ? "is-active" : ""}`}
          onClick={() => onPick(p)}
          onPointerEnter={() => onHover(i)}
        >
          <span className="suggestion-sprite">
            <Sprite key={p.image[0]} urls={p.image} alt="" eager />
          </span>
          <span className="suggestion-text">
            <span className="suggestion-zh">{p.zh}</span>
            <span className="suggestion-en">{p.hint || p.en}</span>
          </span>
          <span className="dex-no">{formatId(p.id)}</span>
        </li>
      ))}
    </ul>
  );
}

export default SearchSuggestions;
