function TypeBadges({ types, onTypeClick }) {
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
            {t.zh}
          </button>
        ) : (
          <span key={t.name} className="type-badge" style={{ "--type-color": t.color }}>
            {t.zh}
          </span>
        )
      )}
    </span>
  );
}

export default TypeBadges;
