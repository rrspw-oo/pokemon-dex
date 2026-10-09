import { Fragment, useMemo, useState } from "react";
import Sprite from "./Sprite";
import TypeBadges from "./TypeBadges";
import PvpPanel from "./PvpPanel";
import { getFamily, getFormChanges } from "../services/pokemonApi";
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

function GoCondition({ title, options, emptyText, target, onSelect }) {
  return (
    <div className="go-condition" aria-live="polite">
      <p className="go-condition-title">
        <span className="go-badge">GO</span>
        {title}
      </p>
      {options.length > 0
        ? options.map((option, i) => (
            <div key={i} className="go-option">
              {(option.form || option.from) && <p className="go-option-form">{option.form || `從${option.from}`}</p>}
              <ul>
                {option.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ))
        : emptyText && <p className="go-option-empty">{emptyText}</p>}
      {target && (
        <button type="button" className="pixel-button go-open" onClick={() => onSelect(target)}>
          查看{target.zh} →
        </button>
      )}
    </div>
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

function EvolutionPanel({ pokemon, family, onSelect }) {
  const stages = family.stages[0]?.some((m) => m.pokemon.id === pokemon.id) ? family.stages.slice(1) : family.stages;
  const members = stages.flat();
  const [pickedKey, setPickedKey] = useState(null);
  const picked =
    members.find((m) => m.pokemon.key === pickedKey) || members.find((m) => m.pokemon.id === pokemon.id);

  return (
    <section className="panel">
      <h3 className="panel-title">進化</h3>
      {family.stages.length === 0 ? (
        <p className="panel-empty">此寶可夢不會進化</p>
      ) : (
        <>
          <div className={`evo-chain ${stages.length === 1 ? "is-single" : ""}`}>
            {stages.map((stage, i) => (
              <Fragment key={i}>
                {i > 0 && <span className="evo-chevron" aria-hidden="true" />}
                <div className="evo-stage" style={{ "--cols": Math.min(stage.length, 3) }}>
                  {stage.map(({ pokemon: p }) => (
                    <MiniCard
                      key={p.key}
                      pokemon={p}
                      current={p.id === pokemon.id}
                      selected={p.key === picked?.pokemon.key}
                      onClick={(target) => setPickedKey(target.key)}
                    />
                  ))}
                </div>
              </Fragment>
            ))}
          </div>
          {picked ? (
            <GoCondition
              title={picked.isBase ? `${picked.pokemon.zh}是進化起點` : `進化成${picked.pokemon.zh}`}
              options={picked.isBase || !picked.go ? [] : picked.go.map(({ form, lines }) => ({ form, lines }))}
              emptyText={picked.isBase ? null : "Pokémon GO 目前沒有這個進化"}
              target={picked.pokemon.id === pokemon.id ? null : picked.pokemon}
              onSelect={onSelect}
            />
          ) : (
            <GoHint text="點選寶可夢查看 Pokémon GO 進化條件" />
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
        <GoCondition
          title={`變換成${picked.label}`}
          options={picked.options}
          emptyText="目前無法透過型態變化獲得"
          target={picked.linked && picked.pokemon.key !== pokemon.key ? picked.pokemon : null}
          onSelect={onSelect}
        />
      ) : (
        <GoHint text="點選型態查看 Pokémon GO 變換條件" />
      )}
    </section>
  );
}

function PokemonDetail({ pokemon, onSelect, onBack, backLabel }) {
  const [mode, setMode] = useState("normal");
  const family = useMemo(() => getFamily(pokemon), [pokemon]);
  const formChanges = useMemo(() => getFormChanges(pokemon), [pokemon]);
  const otherForms = formChanges ? family.forms.filter((p) => !formChanges.linkedKeys.has(p.key)) : family.forms;
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
            <TypeBadges types={pokemon.types} />
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
        {pokemon.goId && <PvpPanel goId={pokemon.goId} />}
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
      </div>
    </article>
  );
}

export default PokemonDetail;
