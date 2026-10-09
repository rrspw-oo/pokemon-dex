import { useEffect, useRef } from "react";
import Sprite from "./Sprite";
import { formatId } from "../utils/format";
import { nameOf, useLang } from "../i18n";

const TAP_SLOP = 10;

function SearchSuggestions({ id, suggestions, activeIndex, onPick, onHover }) {
  const lang = useLang();
  const listRef = useRef(null);
  const touch = useRef(null);

  useEffect(() => {
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const onTouchStart = (e) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, moved: false };
  };

  const onTouchMove = (e) => {
    const t = e.touches[0];
    const start = touch.current;
    if (start && Math.hypot(t.clientX - start.x, t.clientY - start.y) > TAP_SLOP) start.moved = true;
  };

  const onTouchEnd = (e, p) => {
    const start = touch.current;
    touch.current = null;
    if (!start || start.moved) return;
    e.preventDefault();
    onPick(p);
  };

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
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={(e) => onTouchEnd(e, p)}
          onPointerEnter={(e) => e.pointerType === "mouse" && onHover(i)}
        >
          <span className="suggestion-sprite">
            <Sprite key={p.image[0]} urls={p.image} alt="" eager />
          </span>
          <span className="suggestion-text">
            <span className="suggestion-zh">{nameOf(p, lang)}</span>
            {(lang === "en" ? p.hintEn : p.hint || p.en) && (
              <span className="suggestion-en">{lang === "en" ? p.hintEn : p.hint || p.en}</span>
            )}
          </span>
          <span className="dex-no">{formatId(p.id)}</span>
        </li>
      ))}
    </ul>
  );
}

export default SearchSuggestions;
