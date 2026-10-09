import { useState } from "react";
import RankRow from "./RankRow";
import LeagueIcon from "./LeagueIcon";
import { useCupsData } from "../services/pvpData";
import { getPokemonByGoId } from "../services/pokemonApi";

const LEAGUE_GROUPS = [
  { cp: 500, icon: "little", name: "小小盃", sub: "CP 500" },
  { cp: 1500, icon: "great", name: "超級聯盟", sub: "CP 1500" },
  { cp: 2500, icon: "ultra", name: "高級聯盟", sub: "CP 2500" },
  { cp: 10000, icon: "master", name: "大師聯盟", sub: "無 CP 上限" },
];

const groupOf = (cp) => LEAGUE_GROUPS.find((g) => g.cp === cp);
const REMIX = /(Remix|Rmix)$/;
const listName = (zh) =>
  zh.replace(/：(超級|高級|大師)聯盟版|：迷你版|HLVer\.|^(UL|ML)(?=紀念)/g, "").replace(/(.)小小盃/, "$1盃");

function CupName({ zh }) {
  const [name, sub] = listName(zh).replace(REMIX, "").split("：");
  return (
    <span className="cup-name">
      {REMIX.test(zh) ? (
        <>
          {name.slice(0, -1)}
          <span className="cup-name-tail">
            {name.slice(-1)}
            <sup className="cup-remix">Remix</sup>
          </span>
        </>
      ) : (
        name
      )}
      {sub && <small className="cup-sub">{sub}</small>}
    </span>
  );
}

function CupIcon({ icon }) {
  return <img className="cup-icon" src={`${import.meta.env.BASE_URL}cup-icons/${icon}.png`} alt="" width="24" height="24" />;
}

function CupList({ cups, league, onLeague, onOpen }) {
  const group = groupOf(league);
  const list = cups.filter((c) => c.cp === league);
  return (
    <>
      <div className="league-picker" role="group" aria-label="聯盟">
        {LEAGUE_GROUPS.map((g) => (
          <button
            key={g.cp}
            type="button"
            className={`league-option ${g.cp === league ? "is-on" : ""}`}
            aria-pressed={g.cp === league}
            onClick={() => onLeague(g.cp)}
          >
            <LeagueIcon league={g.icon} />
            <span className="league-option-name">{g.name}</span>
            <span className="league-option-sub">{g.sub}</span>
          </button>
        ))}
      </div>
      {group && (
        <div className="panel">
          <h3 className="panel-title">
            {group.name} {group.sub} 的盃賽
          </h3>
          <div className="cup-grid">
            {list.map((cup) => (
              <button key={cup.id} type="button" className="cup-card" onClick={() => onOpen(cup.id)}>
                <CupIcon icon={cup.icon} />
                <CupName zh={cup.zh} />
                {cup.diff && (
                  <span className="cup-rule">
                    <span>多禁 {cup.diff.removed.length} 種</span>
                    {cup.diff.added.length > 0 && <span>多開放 {cup.diff.added.length} 種</span>}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function megaNote(info) {
  if (!info) return null;
  const [iv, level, cp, baseCp] = info;
  return (
    <>
      <span>進化前 CP {baseCp}</span>
      <span>超級進化 CP {cp}</span>
      <span>
        Lv {level}・IV {iv.join("/")}
      </span>
    </>
  );
}

function CupDetail({ cup, data, onBack, onSelect }) {
  const [megaOnly, setMegaOnly] = useState(false);
  const ids = (list) => list.map((i) => data.ids[i]);
  const group = groupOf(cup.cp);
  const rows = megaOnly ? cup.megaTop : cup.top;
  return (
    <>
      <div className="panel">
        <div className="cup-head">
          <button type="button" className="nav-back" onClick={onBack}>
            <span className="chevron-left" aria-hidden="true" />
            {group ? group.name : "全部盃賽"}
          </button>
        </div>
        <h3 className="cup-title">
          <CupIcon icon={cup.icon} />
          {cup.zh}
        </h3>
        <ul className="cup-rules">
          {cup.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        {cup.diff && (
          <div className="cup-diff">
            <p>比{cup.diff.base}多禁：{cup.diff.removed.join("、")}</p>
            {cup.diff.added.length > 0 && <p>多開放：{cup.diff.added.join("、")}</p>}
          </div>
        )}
      </div>
      <div className="panel">
        <h3 className="panel-title">推薦排名</h3>
        {cup.megaTop && (
          <div className="segmented rank-filter" role="group" aria-label="排名範圍">
            {[
              [false, "全部"],
              [true, "只看超級進化"],
            ].map(([value, label]) => (
              <button
                key={label}
                type="button"
                className={megaOnly === value ? "is-on" : ""}
                aria-pressed={megaOnly === value}
                onClick={() => setMegaOnly(value)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <ol className="rank-list">
          {rows.map(([idIndex, , moveset, matchups, counters, rank, info], i) => {
            const pokemon = getPokemonByGoId(data.ids[idIndex]);
            if (!pokemon) return null;
            return (
              <RankRow
                key={`${pokemon.key}-${i}`}
                rank={megaOnly ? rank : i + 1}
                pokemon={pokemon}
                note={megaOnly && megaNote(info)}
                moveset={moveset}
                moves={data.moves}
                matchups={ids(matchups)}
                counters={ids(counters)}
                onSelect={onSelect}
              />
            );
          })}
        </ol>
      </div>
    </>
  );
}

function CupView({ cupId, league, onLeague, onOpen, onBack, onSelect }) {
  const data = useCupsData();
  if (!data) return <p className="message">載入中</p>;
  const cup = cupId && data.cups.find((c) => c.id === cupId);
  return (
    <section className="cup-view">
      {cup ? (
        <CupDetail cup={cup} data={data} onBack={onBack} onSelect={onSelect} />
      ) : (
        <CupList cups={data.cups} league={league} onLeague={onLeague} onOpen={onOpen} />
      )}
    </section>
  );
}

export default CupView;
