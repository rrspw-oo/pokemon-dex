import { useMemo, useState } from "react";
import { bestIv } from "../utils/pvpIv";
import { LEAGUES, usePvpData } from "../services/pvpData";
import { Matchups, MoveChips } from "./Opponents";
import ShadowIcon from "./ShadowIcon";
import { useT } from "../i18n";

function PvpPanel({ goId, onSelect }) {
  const t = useT();
  const data = usePvpData();
  const [league, setLeague] = useState(1500);
  const [shadow, setShadow] = useState(false);

  const hasShadow = Boolean(data?.pokemon[`${goId}_shadow`]);
  const entry = data?.pokemon[shadow && hasShadow ? `${goId}_shadow` : goId];
  const best = useMemo(() => entry && bestIv(entry.s, league, data.cpm), [entry, league, data]);

  if (data && !entry) return null;

  const ranking = entry?.[league];
  const opponentIds = (list) => list.map((i) => data.ids[i]);

  return (
    <section className="panel">
      <h3 className="panel-title panel-title-row">
        {t("PvP 推薦")}
        {hasShadow && (
          <button
            type="button"
            className={`shadow-toggle ${shadow ? "is-on" : ""}`}
            aria-pressed={shadow}
            onClick={() => setShadow((v) => !v)}
          >
            <ShadowIcon title={t("暗影")} />
            {t("暗影")}
          </button>
        )}
      </h3>
      {!data ? (
        <p className="panel-empty">{t("載入中")}</p>
      ) : (
        <>
          <div className="segmented" role="group" aria-label={t("聯盟")}>
            {LEAGUES.map(([cap, label]) => (
              <button
                key={cap}
                type="button"
                className={league === cap ? "is-on" : ""}
                aria-pressed={league === cap}
                onClick={() => setLeague(cap)}
              >
                {t(label)}
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
                  <dt>{t(label)}</dt>
                  <dd>
                    <MoveChips
                      moveset={ranking[2].filter((id) => data.moves[id]?.[2] === fast)}
                      moves={data.moves}
                      elite={ranking[3]}
                    />
                  </dd>
                </div>
              ))
            ) : (
              <div className="pvp-row">
                <dt>{t("推薦招式")}</dt>
                <dd className="pvp-muted">{t("未列入此聯盟排名")}</dd>
              </div>
            )}
            {ranking && (
              <div className="pvp-row">
                <dt>{t("聯盟排名")}</dt>
                <dd>
                  #{ranking[0]}
                  <span className="pvp-muted">{t("分數 {n}", { n: ranking[1] })}</span>
                </dd>
              </div>
            )}
            <div className="pvp-row">
              <dt>{t("推薦 IV")}</dt>
              <dd>
                <span className="iv">
                  <span>{t("攻擊 {n}", { n: best.iv[0] })}</span>
                  <span>{t("防禦 {n}", { n: best.iv[1] })}</span>
                  <span>HP {best.iv[2]}</span>
                </span>
                <span className="pvp-muted">
                  Lv {best.level} · CP {best.cp}
                </span>
              </dd>
            </div>
          </dl>

          {ranking && (
            <Matchups matchups={opponentIds(ranking[4])} counters={opponentIds(ranking[5])} onSelect={onSelect} />
          )}
        </>
      )}
    </section>
  );
}

export default PvpPanel;
