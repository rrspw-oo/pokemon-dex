import RankRow from "./RankRow";
import { useCupsData } from "../services/pvpData";
import { getPokemonByGoId } from "../services/pokemonApi";

const GROUPS = [
  ["常駐聯盟", (c) => c.standard],
  ["迷你盃賽 CP 500", (c) => !c.standard && c.cp === 500],
  ["超級盃賽 CP 1500", (c) => !c.standard && c.cp === 1500],
  ["高級盃賽 CP 2500", (c) => !c.standard && c.cp === 2500],
  ["大師盃賽", (c) => !c.standard && c.cp === 10000],
];

function CupList({ cups, onOpen }) {
  return GROUPS.map(([title, test]) => {
    const list = cups.filter(test);
    if (list.length === 0) return null;
    return (
      <div key={title} className="panel">
        <h3 className="panel-title">{title}</h3>
        <div className="cup-grid">
          {list.map((cup) => (
            <button key={cup.id} type="button" className="cup-card" onClick={() => onOpen(cup.id)}>
              <span className="cup-name">{cup.zh}</span>
              <span className="cup-rule">{cup.rules.slice(1).join("・") || cup.rules[0]}</span>
              {cup.source === "derived" && <span className="cup-tag">推估</span>}
            </button>
          ))}
        </div>
      </div>
    );
  });
}

function CupDetail({ cup, data, onBack, onSelect }) {
  const ids = (list) => list.map((i) => data.ids[i]);
  return (
    <>
      <div className="panel">
        <div className="cup-head">
          <button type="button" className="nav-back" onClick={onBack}>
            <span className="chevron-left" aria-hidden="true" />
            全部盃賽
          </button>
          {cup.source === "derived" && <span className="cup-tag">推估</span>}
        </div>
        <h3 className="cup-title">{cup.zh}</h3>
        <ul className="cup-rules">
          {cup.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </div>
      <div className="panel">
        <h3 className="panel-title">推薦排名</h3>
        <ol className="rank-list">
          {cup.top.map(([idIndex, score, moveset, matchups, counters], i) => {
            const pokemon = getPokemonByGoId(data.ids[idIndex]);
            if (!pokemon) return null;
            return (
              <RankRow
                key={`${pokemon.key}-${i}`}
                rank={i + 1}
                pokemon={pokemon}
                score={score}
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

function CupView({ cupId, onOpen, onBack, onSelect }) {
  const data = useCupsData();
  if (!data) return <p className="message">載入中</p>;
  const cup = cupId && data.cups.find((c) => c.id === cupId);
  return (
    <section className="cup-view">
      {cup ? (
        <CupDetail cup={cup} data={data} onBack={onBack} onSelect={onSelect} />
      ) : (
        <CupList cups={data.cups} onOpen={onOpen} />
      )}
    </section>
  );
}

export default CupView;
