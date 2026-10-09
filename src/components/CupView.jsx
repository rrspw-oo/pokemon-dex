import { useState } from "react";
import RankRow from "./RankRow";
import LeagueIcon from "./LeagueIcon";
import { useCupsData } from "../services/pvpData";
import { getPokemonByGoId } from "../services/pokemonApi";
import { useLang, useT } from "../i18n";

const LEAGUE_GROUPS = [
  { cp: 500, icon: "little", name: "小小盃", sub: "CP 500" },
  { cp: 1500, icon: "great", name: "超級聯盟", sub: "CP 1500" },
  { cp: 2500, icon: "ultra", name: "高級聯盟", sub: "CP 2500" },
  { cp: 10000, icon: "master", name: "大師聯盟", sub: "無 CP 上限" },
];

const groupOf = (cp) => LEAGUE_GROUPS.find((g) => g.cp === cp);
const REMIX = /\s?(Remix|Rmix)$/;
const listName = (zh) =>
  zh.replace(/：(超級|高級|大師)聯盟版|：迷你版|HLVer\.|^(UL|ML)(?=紀念)/g, "").replace(/(.)小小盃/, "$1盃");
const listNameEn = (en) =>
  en
    .replace(/: (Great|Ultra|Master) League Edition|: Little Edition|^(UL|ML) (?=Premier Classic)/g, "")
    .replace(/^Little (?=\S+ Cup)/, "");

function CupName({ cup }) {
  const lang = useLang();
  const full = lang === "en" ? cup.en : cup.zh;
  const [name, sub] = (lang === "en" ? listNameEn(full) : listName(full)).replace(REMIX, "").split(/：|: /);
  return (
    <span className="cup-name">
      {REMIX.test(full) ? (
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
  const t = useT();
  const group = groupOf(league);
  const list = cups.filter((c) => c.cp === league);
  return (
    <>
      <div className="league-picker" role="group" aria-label={t("聯盟")}>
        {LEAGUE_GROUPS.map((g) => (
          <button
            key={g.cp}
            type="button"
            className={`league-option ${g.cp === league ? "is-on" : ""}`}
            aria-pressed={g.cp === league}
            onClick={() => onLeague(g.cp)}
          >
            <LeagueIcon league={g.icon} />
            <span className="league-option-name">{t(g.name)}</span>
            <span className="league-option-sub">{t(g.sub)}</span>
          </button>
        ))}
      </div>
      {group && (
        <div className="panel">
          <h3 className="panel-title">
            {t("{name} {sub} 的盃賽", { name: t(group.name), sub: t(group.sub) })}
          </h3>
          <div className="cup-grid">
            {list.map((cup) => (
              <button key={cup.id} type="button" className="cup-card" onClick={() => onOpen(cup.id)}>
                <CupIcon icon={cup.icon} />
                <CupName cup={cup} />
                {cup.diff && (
                  <span className="cup-rule">
                    <span>{t("多禁 {n} 種", { n: cup.diff.removed.length })}</span>
                    {cup.diff.added.length > 0 && <span>{t("多開放 {n} 種", { n: cup.diff.added.length })}</span>}
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

function megaNote(info, t) {
  if (!info) return null;
  const [iv, , cp, baseCp] = info;
  return (
    <>
      <span>{t("進化前 CP {cp}", { cp: baseCp })}</span>
      <span>{t("超級進化 CP {cp}", { cp })}</span>
      <span>IV {iv.join("/")}</span>
    </>
  );
}

function CupDetail({ cup, data, onBack, onSelect }) {
  const t = useT();
  const en = useLang() === "en";
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
            {t(group ? group.name : "全部盃賽")}
          </button>
        </div>
        <h3 className="cup-title">
          <CupIcon icon={cup.icon} />
          {en ? cup.en : cup.zh}
        </h3>
        <ul className="cup-rules">
          {(en ? cup.rulesEn : cup.rules).map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        {cup.diff && (
          <div className="cup-diff">
            <p>
              {en
                ? t("比{base}多禁：{list}", { base: cup.diff.baseEn, list: cup.diff.removedEn.join(", ") })
                : t("比{base}多禁：{list}", { base: cup.diff.base, list: cup.diff.removed.join("、") })}
            </p>
            {cup.diff.added.length > 0 && (
              <p>{t("多開放：{list}", { list: en ? cup.diff.addedEn.join(", ") : cup.diff.added.join("、") })}</p>
            )}
          </div>
        )}
      </div>
      <div className="panel">
        <h3 className="panel-title">{t("推薦排名")}</h3>
        {cup.megaTop && (
          <div className="segmented rank-filter" role="group" aria-label={t("排名範圍")}>
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
                {t(label)}
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
                note={megaOnly && megaNote(info, t)}
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
  const t = useT();
  const data = useCupsData();
  if (!data) return <p className="message">{t("載入中")}</p>;
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
