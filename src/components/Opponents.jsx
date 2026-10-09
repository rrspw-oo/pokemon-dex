import { useState } from "react";
import Sprite from "./Sprite";
import ShadowIcon from "./ShadowIcon";
import { getPokemonByGoId } from "../services/pokemonApi";
import { TYPE_COLOR } from "../utils/types";
import { shortName } from "../utils/format";

export function OpponentList({ ids, onSelect }) {
  const list = ids.map(getPokemonByGoId).filter(Boolean);
  if (list.length === 0) return <span className="pvp-muted">無資料</span>;
  return (
    <span className="opponents">
      {list.map((p, i) => (
        <button
          key={`${p.key}-${i}`}
          type="button"
          className={`opponent ${p.shadow ? "is-shadow" : ""}`}
          onClick={() => onSelect(p)}
        >
          <Sprite key={p.image[0]} urls={p.image} alt={p.zh} />
          <span className="opponent-name">
            {p.shadow && <ShadowIcon />}
            {shortName(p.zh)}
          </span>
        </button>
      ))}
    </span>
  );
}

export function MoveChips({ moveset, moves, elite = [] }) {
  return (
    <span className="move-list">
      {moveset.map((id) => {
        const move = moves[id];
        if (!move) return null;
        return (
          <span key={id} className="move-chip" style={{ "--type-color": TYPE_COLOR[move[1]] }}>
            {move[0]}
            {elite.includes(id) && <em>菁英</em>}
          </span>
        );
      })}
    </span>
  );
}

export function Collapsible({ title, className = "", children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`matchup-block ${className} ${open ? "is-open" : ""}`}>
      <button type="button" className="matchup-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {title}
      </button>
      <div className="collapse" aria-hidden={!open}>
        <div className="collapse-inner">{children}</div>
      </div>
    </div>
  );
}

export function Matchups({ matchups, counters, onSelect, children }) {
  return (
    <div className="matchups">
      {children}
      <Collapsible title="擅長對付">
        <OpponentList ids={matchups} onSelect={onSelect} />
      </Collapsible>
      <Collapsible title="剋星">
        <OpponentList ids={counters} onSelect={onSelect} />
      </Collapsible>
    </div>
  );
}
