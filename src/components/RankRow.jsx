import Sprite from "./Sprite";
import TypeBadges from "./TypeBadges";
import ShadowIcon from "./ShadowIcon";
import { Collapsible, Matchups, MoveChips } from "./Opponents";
import { nameOf, useLang, useT } from "../i18n";

function RankRow({ rank, pokemon, tags = [], note, moveset, moves, matchups, counters, onSelect }) {
  const t = useT();
  const lang = useLang();
  const expandable = Boolean(matchups?.length || counters?.length || moveset);

  return (
    <li className={`rank-row ${pokemon.shadow ? "is-shadow" : ""}`}>
      <div className="rank-main">
        <span className="rank-no">{rank}</span>
        <button type="button" className="rank-pokemon" onClick={() => onSelect(pokemon)}>
          <Sprite key={pokemon.image[0]} urls={pokemon.image} alt={nameOf(pokemon, lang)} />
          <span className="rank-body">
            <span className="rank-head">
              <span className="rank-names">
                <span className="rank-name">
                  {pokemon.shadow && <ShadowIcon title={t("暗影")} />}
                  {nameOf(pokemon, lang)}
                </span>
                {lang !== "en" && <span className="rank-en">{pokemon.en}</span>}
              </span>
              <TypeBadges types={pokemon.types} />
            </span>
            {note && <span className="rank-note">{note}</span>}
            {tags.length > 0 && (
              <span className="rank-meta">
                {tags.map((tag) => (
                  <span key={tag.label} className={`league-tag ${tag.active ? "is-active" : ""}`}>
                    {tag.label}
                  </span>
                ))}
              </span>
            )}
          </span>
        </button>
      </div>
      {expandable && (
        <Matchups matchups={matchups} counters={counters} onSelect={onSelect}>
          {moveset && (
            <Collapsible title={t("推薦招式")} className="rank-moves-collapsible">
              <MoveChips moveset={moveset} moves={moves} />
            </Collapsible>
          )}
        </Matchups>
      )}
    </li>
  );
}

export default RankRow;
