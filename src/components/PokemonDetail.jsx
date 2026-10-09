import { Fragment, useMemo, useRef, useState } from "react";
import Sprite from "./Sprite";
import TypeBadges from "./TypeBadges";
import PvpPanel from "./PvpPanel";
import CardsPanel from "./CardsPanel";
import { getFamily, getFormChanges, getMegas } from "../services/pokemonApi";
import { formatId } from "../utils/format";

function MiniCard({ pokemon, label, current, selected, onClick }) {
  return (
    <button
      type="button"
      className={`mini-card ${current ? "is-current" : ""} ${selected ? "is-selected" : ""}`}
      onClick={() => onClick(pokemon)}
      aria-pressed={selected === undefined ? undefined : selected}
      aria-current={current ? "true" : undefined}
    >
      <Sprite key={pokemon.image[0]} urls={pokemon.image} alt={label || pokemon.zh} />
      <span className="mini-card-zh">{label || pokemon.zh}</span>
    </button>
  );
}

function GoBlock({ title, options, emptyText }) {
  return (
    <div className="go-block">
      <p className="go-condition-title">
        <span className="go-badge">GO</span>
        {title}
      </p>
      {options.length > 0
        ? options.map((option, i) => (
            <div key={i} className="go-line">
              {option.label && <p className="go-line-label">{option.label}</p>}
              <ul className="go-chips">
                {option.lines.map((line, j) => (
                  <Fragment key={line}>
                    {j > 0 && (
                      <li className="go-plus" aria-hidden="true">
                        +
                      </li>
                    )}
                    <li>{line}</li>
                  </Fragment>
                ))}
              </ul>
            </div>
          ))
        : emptyText && <p className="go-option-empty">{emptyText}</p>}
    </div>
  );
}

function GoOpen({ target, onSelect }) {
  return (
    <button type="button" className="pixel-button go-open" onClick={() => onSelect(target)}>
      查看{target.zh} →
    </button>
  );
}

function GoHint({ text }) {
  return (
    <p className="go-condition go-hint">
      <span className="go-badge">GO</span>
      {text}
    </p>
  );
}

function MegaBlock({ id, current, onSelect }) {
  const megas = getMegas(id);
  if (megas.length === 0) return null;
  const primal = megas.every((m) => m.goId.endsWith("_primal"));
  const energy = primal ? "能量" : "超級能量";
  const costs = [...new Set(megas.map((m) => `${m.cost}/${m.next}`))];
  return (
    <div className="go-block mega-block">
      <p className="go-condition-title">
        <span className="go-badge">GO</span>
        {primal ? "原始回歸" : "超級進化"}
      </p>
      <div className="mega-cards">
        {megas.map((m) => (
          <MiniCard key={m.goId} pokemon={m.pokemon} current={m.pokemon.key === current} onClick={onSelect} />
        ))}
      </div>
      {costs.map((cost) => {
        const [first, next] = cost.split("/");
        return (
          <ul key={cost} className="go-chips">
            <li>
              首次 {first} {energy}
            </li>
            <li>
              之後 {next} {energy}
            </li>
          </ul>
        );
      })}
    </div>
  );
}

const optionsFrom = (member, fromId) =>
  (member.go || []).filter((o) => fromId == null || o.from === fromId).map((o) => ({ label: o.form, lines: o.lines }));

function EvolutionPanel({ pokemon, family, onSelect }) {
  const panelRef = useRef(null);
  const all = family.stages.flatMap((stage, i) => stage.map((m) => ({ ...m, stage: i })));
  const linked = (child, parent) =>
    child.go ? child.go.some((o) => o.from === parent.pokemon.id) : family.stages[parent.stage].length === 1;
  const nextOf = (member) => all.filter((m) => m.stage === member.stage + 1 && linked(m, member));
  const current = all.find((m) => m.pokemon.id === pokemon.id);
  const nexts = current ? nextOf(current) : [];
  const prevs = current && nexts.length === 0 ? all.filter((m) => m.stage === current.stage - 1 && linked(current, m)) : [];
  const open = (target) => {
    if (target.key !== pokemon.key) onSelect(target, panelRef.current.getBoundingClientRect().top);
  };

  return (
    <section className="panel evo-panel" ref={panelRef}>
      <h3 className="panel-title">進化</h3>
      {family.stages.length === 0 ? (
        getMegas(pokemon.id).length > 0 ? (
          <div className="go-condition">
            <MegaBlock id={pokemon.id} current={pokemon.key} onSelect={open} />
          </div>
        ) : (
          <p className="panel-empty">此寶可夢不會進化</p>
        )
      ) : (
        <>
          <div className="evo-chain">
            {family.stages.map((stage, i) => (
              <Fragment key={i}>
                {i > 0 && <span className="evo-chevron" aria-hidden="true" />}
                <div
                  className={`evo-stage ${stage.length >= 4 ? "is-wide" : ""}`}
                  style={{ "--cols": stage.length >= 4 ? 4 : stage.length }}
                >
                  {stage.map(({ pokemon: p }) => (
                    <MiniCard key={p.key} pokemon={p} current={p.id === pokemon.id} selected={p.id === pokemon.id} onClick={open} />
                  ))}
                </div>
              </Fragment>
            ))}
          </div>
          {nexts.length > 2 ? (
            <GoHint text="點選進化後的寶可夢查看 Pokémon GO 進化條件" />
          ) : (
            <div className="go-condition" aria-live="polite">
              {nexts.map((next) => (
                <GoBlock
                  key={next.pokemon.key}
                  title={`進化成${next.pokemon.zh}`}
                  options={optionsFrom(next, current.pokemon.id)}
                  emptyText="Pokémon GO 目前沒有這個進化"
                />
              ))}
              {prevs.map((prev) => (
                <GoBlock
                  key={prev.pokemon.key}
                  title={`由${prev.pokemon.zh}進化成${current.pokemon.zh}`}
                  options={optionsFrom(current, prev.pokemon.id)}
                  emptyText="Pokémon GO 目前沒有這個進化"
                />
              ))}
              <MegaBlock id={current.pokemon.id} current={pokemon.key} onSelect={open} />
            </div>
          )}
        </>
      )}
    </section>
  );
}

function FormChangePanel({ pokemon, formChanges, onSelect }) {
  const [pickedId, setPickedId] = useState(null);
  const picked = formChanges.forms.find((f) => f.id === pickedId);

  return (
    <section className="panel">
      <h3 className="panel-title">型態變化</h3>
      <div className="mini-grid">
        {formChanges.forms.map((f) => (
          <MiniCard
            key={f.id}
            pokemon={f.pokemon}
            label={f.label}
            current={f.pokemon.key === pokemon.key}
            selected={f.id === pickedId}
            onClick={() => setPickedId(f.id)}
          />
        ))}
      </div>
      {picked ? (
        <div className="go-condition" aria-live="polite">
          <GoBlock
            title={`變換成${picked.label}`}
            options={picked.options.map((o) => ({ label: o.from && `從${o.from}`, lines: o.lines }))}
            emptyText="目前無法透過型態變化獲得，在官方有活動時方可進化"
          />
          {picked.linked && picked.pokemon.key !== pokemon.key && <GoOpen target={picked.pokemon} onSelect={onSelect} />}
        </div>
      ) : (
        <GoHint text="點選型態查看 Pokémon GO 變換條件" />
      )}
    </section>
  );
}

function PokemonDetail({ pokemon, onSelect, onBack, backLabel, onTypeClick }) {
  const [mode, setMode] = useState("normal");
  const family = useMemo(() => getFamily(pokemon), [pokemon]);
  const formChanges = useMemo(() => getFormChanges(pokemon), [pokemon]);
  const megaKeys = new Set(getMegas(pokemon.id).map((m) => m.pokemon.key));
  const otherForms = family.forms.filter((p) => !megaKeys.has(p.key) && !formChanges?.linkedKeys.has(p.key));
  const modes = [
    ["normal", "一般", pokemon.image],
    ["shiny", "閃光", pokemon.shinyImage],
    ["gmax", "超極巨化", pokemon.gmaxImage],
  ].filter(([, , urls]) => urls.length);
  const urls = modes.find(([m]) => m === mode)?.[2] || pokemon.image;

  return (
    <article className="detail">
      <section className="panel detail-main">
        <div className="detail-head">
          <button type="button" className="nav-back" onClick={onBack}>
            <span className="chevron-left" aria-hidden="true" />
            {backLabel}
          </button>
          <span className="detail-meta">
            <span className="dex-no">{formatId(pokemon.id)}</span>
            <TypeBadges types={pokemon.types} onTypeClick={pokemon.isCustom ? undefined : onTypeClick} />
          </span>
        </div>
        <div className={`sprite-tile sprite-tile-large ${mode}`}>
          <Sprite key={urls[0]} urls={urls} alt={`${pokemon.zh} ${pokemon.en}`} eager />
        </div>
        <h2 className="detail-zh">{pokemon.zh}</h2>
        <p className="detail-en">{pokemon.en}</p>

        {modes.length > 1 && (
          <div className="segmented" role="group" aria-label="外觀">
            {modes.map(([m, label]) => (
              <button
                key={m}
                type="button"
                className={mode === m ? "is-on" : ""}
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="detail-side">
        {!pokemon.isCustom && <EvolutionPanel pokemon={pokemon} family={family} onSelect={onSelect} />}
        {formChanges && <FormChangePanel pokemon={pokemon} formChanges={formChanges} onSelect={onSelect} />}
        {otherForms.length > 0 && (
          <section className="panel">
            <h3 className="panel-title">其他型態</h3>
            <div className="mini-grid">
              {otherForms.map((p) => (
                <MiniCard key={p.key} pokemon={p} onClick={onSelect} />
              ))}
            </div>
          </section>
        )}
        {pokemon.goId && <PvpPanel goId={pokemon.goId} onSelect={onSelect} />}
        {!pokemon.isCustom && <CardsPanel key={pokemon.key} dex={pokemon.id} name={pokemon.zh} />}
      </div>
    </article>
  );
}

export default PokemonDetail;
