function TypeBadges({ types }) {
  return (
    <span className="type-badges">
      {types.map((t) => (
        <span key={t.name} className="type-badge" style={{ "--type-color": t.color }}>
          {t.zh}
        </span>
      ))}
    </span>
  );
}

export default TypeBadges;
