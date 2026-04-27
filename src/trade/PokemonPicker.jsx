import { useEffect, useMemo, useRef, useState } from "react";
import { suggest } from "../utils/searchIndex";
import "./PokemonPicker.css";

function spriteUrl(id) {
  if (!id) return null;
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export default function PokemonPicker({
  value,
  onChange,
  placeholder = "search Pokemon",
  autoFocus = false,
  clearable = true,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const containerRef = useRef(null);

  const results = useMemo(() => {
    if (!query) return [];
    return suggest(query, 8);
  }, [query]);

  useEffect(() => {
    function onDocClick(e) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(item) {
    onChange({
      pokemonId: item.id,
      pokemonName: item.englishName || item.text,
      pokemonNameZh: item.chineseName || "",
    });
    setQuery("");
    setOpen(false);
    setActive(0);
  }

  function onKeyDown(e) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="poke-picker" ref={containerRef}>
      {value && value.pokemonId ? (
        <div className="poke-picker__chip">
          <img
            src={spriteUrl(value.pokemonId)}
            alt=""
            className="poke-picker__chip-sprite"
            loading="lazy"
          />
          <span className="poke-picker__chip-name">
            {value.pokemonName}
            {value.pokemonNameZh ? ` / ${value.pokemonNameZh}` : ""}
          </span>
          {clearable && (
            <button
              type="button"
              className="poke-picker__chip-clear"
              onClick={() =>
                onChange({ pokemonId: null, pokemonName: "", pokemonNameZh: "" })
              }
              aria-label="Clear selection"
            >
              X
            </button>
          )}
        </div>
      ) : (
        <input
          type="text"
          className="poke-picker__input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          autoFocus={autoFocus}
          autoComplete="off"
        />
      )}
      {open && results.length > 0 && (
        <ul className="poke-picker__list" role="listbox">
          {results.map((r, idx) => (
            <li
              key={`${r.id}-${r.englishName}`}
              className={`poke-picker__item${idx === active ? " is-active" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(r);
              }}
              onMouseEnter={() => setActive(idx)}
            >
              <img
                src={spriteUrl(r.id)}
                alt=""
                className="poke-picker__item-sprite"
                loading="lazy"
              />
              <span className="poke-picker__item-id">
                #{String(r.id).padStart(3, "0")}
              </span>
              <span className="poke-picker__item-name">
                {r.chineseName || r.englishName}
              </span>
              <span className="poke-picker__item-en">{r.englishName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
