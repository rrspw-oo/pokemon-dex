import { useEffect, useMemo, useState } from "react";
import { bestIv } from "../utils/pvpIv";
import { TYPE_COLOR } from "../utils/types";

const LEAGUES = [
  [1500, "超級聯盟"],
  [2500, "高級聯盟"],
  [10000, "大師聯盟"],
];

function PvpPanel({ goId }) {
  const [data, setData] = useState(null);
  const [league, setLeague] = useState(1500);

  useEffect(() => {
    let alive = true;
    import("../data/pvp.json").then((m) => alive && setData(m.default));
    return () => {
      alive = false;
    };
  }, []);

  const entry = data?.pokemon[goId];
  const best = useMemo(() => entry && bestIv(entry.s, league, data.cpm), [entry, league, data]);

  if (data && !entry) return null;

  const ranking = entry?.[league];

  return (
    <section className="panel">
      <h3 className="panel-title">PvP 推薦</h3>
      {!data ? (
        <p className="panel-empty">載入中</p>
      ) : (
        <>
          <div className="segmented" role="group" aria-label="聯盟">
            {LEAGUES.map(([cap, label]) => (
              <button
                key={cap}
                type="button"
                className={league === cap ? "is-on" : ""}
                aria-pressed={league === cap}
                onClick={() => setLeague(cap)}
              >
                {label}
              </button>
            ))}
          </div>

          <dl className="pvp">
            {ranking ? (
              [
                ["一般招式", 1],
                ["特殊招式", 0],
              ].map(([label, fast]) => (
                <div className="pvp-row" key={label}>
                  <dt>{label}</dt>
                  <dd>
                    {ranking[2]
                      .filter((id) => data.moves[id][2] === fast)
                      .map((id) => (
                        <span key={id} className="move-chip" style={{ "--type-color": TYPE_COLOR[data.moves[id][1]] }}>
                          {data.moves[id][0]}
                          {ranking[3].includes(id) && <em>菁英</em>}
                        </span>
                      ))}
                  </dd>
                </div>
              ))
            ) : (
              <div className="pvp-row">
                <dt>推薦招式</dt>
                <dd className="pvp-muted">未列入此聯盟排名</dd>
              </div>
            )}
            {ranking && (
              <div className="pvp-row">
                <dt>聯盟排名</dt>
                <dd>
                  #{ranking[0]}
                  <span className="pvp-muted">分數 {ranking[1]}</span>
                </dd>
              </div>
            )}
            <div className="pvp-row">
              <dt>推薦 IV</dt>
              <dd>
                <span className="iv">
                  <span>攻擊 {best.iv[0]}</span>
                  <span>防禦 {best.iv[1]}</span>
                  <span>HP {best.iv[2]}</span>
                </span>
                <span className="pvp-muted">
                  Lv {best.level} · CP {best.cp}
                </span>
              </dd>
            </div>
          </dl>

        </>
      )}
    </section>
  );
}

export default PvpPanel;
