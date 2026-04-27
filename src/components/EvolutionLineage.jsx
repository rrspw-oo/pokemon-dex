import { memo } from "react";
import { describeEvolution } from "../utils/evolutionIndex";
import "./EvolutionLineage.css";

function spriteUrlFor(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

const EvolutionLineage = memo(function EvolutionLineage({
  chain,
  currentId,
  onSelect,
}) {
  if (!chain || chain.length === 0) return null;

  const stages = [];
  for (const node of chain) {
    let bucket = stages[node.stage];
    if (!bucket) {
      bucket = [];
      stages[node.stage] = bucket;
    }
    bucket.push(node);
  }
  const filledStages = stages.filter(Boolean);
  if (filledStages.length <= 1) return null;

  return (
    <div className="evolution-lineage" role="region" aria-label="Evolution lineage">
      <div className="evolution-lineage__title">EVOLUTION</div>
      <div className="evolution-lineage__rail">
        {filledStages.map((bucket, stageIdx) => (
          <div key={`stage-${stageIdx}`} className="evolution-lineage__group">
            {stageIdx > 0 && (
              <div className="evolution-lineage__arrow" aria-hidden="true">
                <span className="evolution-lineage__arrow-tip">▶</span>
                <span className="evolution-lineage__arrow-text">
                  {describeEvolution(bucket[0])}
                </span>
              </div>
            )}
            <div className="evolution-lineage__stage">
              {bucket.map((node) => {
                const isCurrent = node.id === currentId;
                return (
                  <button
                    key={`${node.id}-${node.name}`}
                    type="button"
                    className={`evolution-lineage__node${isCurrent ? " is-current" : ""}`}
                    onClick={() => onSelect && onSelect(node.id)}
                    aria-current={isCurrent ? "true" : undefined}
                  >
                    <img
                      className="evolution-lineage__sprite"
                      src={spriteUrlFor(node.id)}
                      alt={node.name}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="evolution-lineage__id">
                      #{String(node.id).padStart(3, "0")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default EvolutionLineage;
