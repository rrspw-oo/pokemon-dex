import { useState } from "react";
import Sprite from "./Sprite";
import ShadowIcon from "./ShadowIcon";
import { getPokemonByGoId } from "../services/pokemonApi";
import { TYPE_COLOR } from "../utils/types";
import { nameOf, useLang, useT } from "../i18n";

export function OpponentList({ ids, onSelect }) {
  const t = useT();
  const lang = useLang();
  const list = ids.map(getPokemonByGoId).filter(Boolean);
  if (list.length === 0) return <span className="pvp-muted">{t("無資料")}</span>;
  return (
    <span className="opponents">
      {list.map((p, i) => (
        <button
          key={`${p.key}-${i}`}
          type="button"
          className={`opponent ${p.shadow ? "is-shadow" : ""}`}
          onClick={() => onSelect(p)}
        >
          <Sprite key={p.image[0]} urls={p.image} alt={nameOf(p, lang)} />
          <span className="opponent-name">
            {p.shadow && <ShadowIcon title={t("暗影")} />}
            {nameOf(p, lang)}
          </span>
        </button>
      ))}
    </span>
  );
}

export function MoveChips({ moveset, moves, elite = [] }) {
  const t = useT();
  const en = useLang() === "en";
  return (
    <span className="move-list">
      {moveset.map((id) => {
        const move = moves[id];
        if (!move) return null;
        return (
          <span key={id} className="move-chip" style={{ "--type-color": TYPE_COLOR[move[1]] }}>
            {en ? move[3] : move[0]}
            {elite.includes(id) && <em>{t("菁英")}</em>}
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
  const t = useT();
  return (
    <div className="matchups">
      {children}
      {matchups.length > 0 && (
        <Collapsible title={t("擅長對付")}>
          <OpponentList ids={matchups} onSelect={onSelect} />
        </Collapsible>
      )}
      {counters.length > 0 && (
        <Collapsible title={t("剋星")}>
          <OpponentList ids={counters} onSelect={onSelect} />
        </Collapsible>
      )}
    </div>
  );
}
