import { useMemo, useState } from "react";
import PokemonGrid from "./PokemonGrid";
import RankRow from "./RankRow";
import { LEAGUES, usePvpData } from "../services/pvpData";
import { getPokemonOfType, getSecondTypes, typeInfo } from "../services/pokemonApi";
import { TYPE_ZH } from "../utils/types";

const TYPES = Object.keys(TYPE_ZH).filter((t) => t !== "meow");
const PAGE_SIZE = 12;
const TOP = 5;

function TypeChip({ type, active, count, onClick }) {
  const info = typeInfo(type);
  return (
    <button
      type="button"
      className={`type-chip ${active ? "is-on" : ""}`}
      style={{ "--type-color": info.color }}
      aria-pressed={active}
      onClick={onClick}
    >
      {info.zh}
      {count != null && <small>{count}</small>}
    </button>
  );
}

function TypeView({ type, type2, onChange, onSelect }) {
  const data = usePvpData();
  const [league, setLeague] = useState(1500);
  const [showAll, setShowAll] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const pokemon = useMemo(() => (type ? getPokemonOfType(type, type2) : []), [type, type2]);
  const secondTypes = useMemo(() => (type ? getSecondTypes(type) : new Map()), [type]);

  const ranked = useMemo(() => {
    if (!data) return [];
    return pokemon
      .filter((p) => p.goId)
      .flatMap((p) => [
        { pokemon: p, entry: data.pokemon[p.goId] },
        { pokemon: { ...p, shadow: true }, entry: data.pokemon[`${p.goId}_shadow`] },
      ])
      .filter((row) => row.entry?.[league])
      .sort((a, b) => a.entry[league][0] - b.entry[league][0]);
  }, [data, pokemon, league]);

  const change = (nextType, nextType2) => {
    setShowAll(false);
    setVisible(PAGE_SIZE);
    onChange(nextType, nextType2);
  };

  const label = type ? [type, type2].filter(Boolean).map((t) => TYPE_ZH[t]).join(" + ") : "";
  const rows = showAll ? ranked : ranked.slice(0, TOP);

  return (
    <section className="type-view">
      <div className="panel">
        <h3 className="panel-title">屬性</h3>
        <div className="type-picker">
          {TYPES.map((t) => (
            <TypeChip key={t} type={t} active={t === type} onClick={() => change(t, null)} />
          ))}
        </div>
        {type && (
          <>
            <p className="picker-label">第二屬性</p>
            <div className="type-picker">
              <button
                type="button"
                className={`type-chip type-chip-any ${!type2 ? "is-on" : ""}`}
                aria-pressed={!type2}
                onClick={() => change(type, null)}
              >
                不限
              </button>
              {TYPES.filter((t) => secondTypes.has(t)).map((t) => (
                <TypeChip
                  key={t}
                  type={t}
                  active={t === type2}
                  count={secondTypes.get(t)}
                  onClick={() => change(type, t === type2 ? null : t)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {type && (
        <div className="panel">
          <h3 className="panel-title">{label} 最強排名</h3>
          <div className="segmented" role="group" aria-label="聯盟">
            {LEAGUES.map(([cap, name]) => (
              <button
                key={cap}
                type="button"
                className={league === cap ? "is-on" : ""}
                aria-pressed={league === cap}
                onClick={() => setLeague(cap)}
              >
                {name}
              </button>
            ))}
          </div>
          {!data ? (
            <p className="panel-empty">載入中</p>
          ) : ranked.length === 0 ? (
            <p className="panel-empty">此聯盟沒有排名資料</p>
          ) : (
            <>
              <ol className="rank-list">
                {rows.map(({ pokemon: p, entry }, i) => (
                  <RankRow
                    key={`${p.key}-${p.shadow ? "s" : "n"}`}
                    rank={i + 1}
                    pokemon={p}
                    tags={LEAGUES.filter(([cap]) => entry[cap] && entry[cap][0] <= 100).map(([cap, , short]) => ({
                      label: `${short} #${entry[cap][0]}`,
                      active: cap === league,
                    }))}
                    matchups={entry[league][4].map((i) => data.ids[i])}
                    counters={entry[league][5].map((i) => data.ids[i])}
                    onSelect={onSelect}
                  />
                ))}
              </ol>
              {ranked.length > TOP && (
                <button type="button" className="pixel-button show-all" onClick={() => setShowAll((v) => !v)}>
                  {showAll ? "只看前五名" : `看全部排名（${ranked.length}）`}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {type && (
        <div className="type-all">
          <h3 className="section-title">全部 {label} 屬性寶可夢</h3>
          <PokemonGrid
            pokemon={pokemon}
            visible={visible}
            onSelect={onSelect}
            onLoadMore={() => setVisible((v) => v + PAGE_SIZE)}
          />
        </div>
      )}
    </section>
  );
}

export default TypeView;
