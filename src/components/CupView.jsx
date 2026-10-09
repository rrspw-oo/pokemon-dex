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
const listName = (zh) => zh.replace(/：(超級|高級|大師)聯盟版|：迷你版|HLVer\.|^(UL|ML)(?=紀念)/g, "");

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
                <span className="cup-name">{listName(cup.zh)}</span>
                <span className="cup-rule">{cup.rules.slice(1).join("・") || cup.rules[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function CupDetail({ cup, data, onBack, onSelect }) {
  const ids = (list) => list.map((i) => data.ids[i]);
  const group = groupOf(cup.cp);
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
      </div>
      <div className="panel">
        <h3 className="panel-title">推薦排名</h3>
        <ol className="rank-list">
          {cup.top.map(([idIndex, , moveset, matchups, counters], i) => {
            const pokemon = getPokemonByGoId(data.ids[idIndex]);
            if (!pokemon) return null;
            return (
              <RankRow
                key={`${pokemon.key}-${i}`}
                rank={i + 1}
                pokemon={pokemon}
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
