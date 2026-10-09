import { useLang } from "../i18n";

function TypeBadges({ types, onTypeClick }) {
  const en = useLang() === "en";
  return (
    <span className="type-badges">
      {types.map((t) =>
        onTypeClick ? (
          <button
            key={t.name}
            type="button"
            className="type-badge is-link"
            style={{ "--type-color": t.color }}
            onClick={() => onTypeClick(t.name)}
          >
            {en ? t.en : t.zh}
          </button>
        ) : (
          <span key={t.name} className="type-badge" style={{ "--type-color": t.color }}>
            {en ? t.en : t.zh}
          </span>
        )
      )}
    </span>
  );
}

export default TypeBadges;
