import "./TopNav.css";

export default function TopNav({ view, onChange, tradeBadge = 0 }) {
  return (
    <nav className="topnav" aria-label="primary">
      <div className="topnav__inner">
        <button
          type="button"
          className={`topnav__tab${view === "dex" ? " is-active" : ""}`}
          onClick={() => onChange("dex")}
          aria-current={view === "dex" ? "page" : undefined}
        >
          <span className="topnav__icon" aria-hidden="true">[#]</span>
          <span className="topnav__label">DEX</span>
        </button>
        <button
          type="button"
          className={`topnav__tab${view === "trade" ? " is-active" : ""}`}
          onClick={() => onChange("trade")}
          aria-current={view === "trade" ? "page" : undefined}
        >
          <span className="topnav__icon" aria-hidden="true">[&lt;&gt;]</span>
          <span className="topnav__label">TRADE</span>
          {tradeBadge > 0 && (
            <span className="topnav__badge" aria-label={`${tradeBadge} new matches`}>
              {tradeBadge > 99 ? "99+" : tradeBadge}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
