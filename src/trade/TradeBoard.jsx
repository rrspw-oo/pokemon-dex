import { useEffect, useMemo, useState } from "react";
import { listListings, getSession, signInWithEmail, signOut } from "./api";
import { REGIONS } from "./types";
import "./TradeBoard.css";

function formatRelative(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function spriteUrl(id) {
  if (!id) return null;
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export default function TradeBoard({ onCreate }) {
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [emailInput, setEmailInput] = useState("");
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    getSession().then(setSession);
  }, []);

  useEffect(() => {
    setLoading(true);
    listListings({ search, region }).then((res) => {
      setListings(res);
      setLoading(false);
    });
  }, [search, region]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const s = await signInWithEmail(emailInput);
      setSession(s);
      setEmailInput("");
    } catch (err) {
      setAuthError(err.message || "sign in failed");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setSession(null);
  };

  const counts = useMemo(() => ({
    open: listings.length,
  }), [listings]);

  return (
    <div className="trade-board">
      <div className="trade-board__topbar">
        <div className="trade-board__brand">GLOBAL TRADE BOARD</div>
        {session ? (
          <div className="trade-board__session">
            <span className="trade-board__email">{session.email}</span>
            <button type="button" className="trade-board__signout" onClick={handleSignOut}>
              SIGN OUT
            </button>
          </div>
        ) : (
          <form className="trade-board__signin" onSubmit={handleSignIn}>
            <input
              type="email"
              required
              placeholder="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
            <button type="submit">SIGN IN</button>
          </form>
        )}
      </div>

      {authError && <div className="trade-board__error">{authError}</div>}

      <div className="trade-board__filters">
        <input
          type="text"
          className="trade-board__search"
          placeholder="search Pokemon, region, notes"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="trade-board__region"
          value={region || ""}
          onChange={(e) => setRegion(e.target.value || null)}
        >
          <option value="">ALL REGIONS</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button
          type="button"
          className="trade-board__post"
          onClick={() => onCreate && onCreate()}
          disabled={!session}
          title={session ? "Create new listing" : "Sign in to post"}
        >
          + POST LISTING
        </button>
      </div>

      <div className="trade-board__count">
        {loading ? "loading..." : `${counts.open} open listings`}
      </div>

      <ul className="trade-board__list">
        {listings.map((l) => (
          <li key={l.id} className="trade-card">
            <div className="trade-card__side trade-card__side--have">
              <div className="trade-card__side-label">HAVE</div>
              {l.have.pokemonId && (
                <img
                  src={spriteUrl(l.have.pokemonId)}
                  alt={l.have.pokemonName}
                  className="trade-card__sprite"
                  loading="lazy"
                />
              )}
              <div className="trade-card__name">{l.have.pokemonName}</div>
              <div className="trade-card__meta">
                {l.have.shiny && <span className="trade-card__chip trade-card__chip--shiny">SHINY</span>}
                {l.have.ivAttack != null && (
                  <span className="trade-card__chip">
                    {l.have.ivAttack}/{l.have.ivDefense}/{l.have.ivStamina}
                  </span>
                )}
                {l.have.cp && <span className="trade-card__chip">CP {l.have.cp}</span>}
              </div>
            </div>
            <div className="trade-card__arrow">{"<>"}</div>
            <div className="trade-card__side trade-card__side--want">
              <div className="trade-card__side-label">WANT</div>
              {l.want.pokemonId && (
                <img
                  src={spriteUrl(l.want.pokemonId)}
                  alt={l.want.pokemonName}
                  className="trade-card__sprite"
                  loading="lazy"
                />
              )}
              <div className="trade-card__name">{l.want.pokemonName}</div>
              <div className="trade-card__meta">
                {l.want.shiny && <span className="trade-card__chip trade-card__chip--shiny">SHINY</span>}
              </div>
            </div>
            <div className="trade-card__footer">
              <span className="trade-card__region">{l.region}</span>
              <span className="trade-card__age">{formatRelative(l.createdAt)}</span>
            </div>
            {l.note && <div className="trade-card__note">{l.note}</div>}
          </li>
        ))}
      </ul>

      {!loading && listings.length === 0 && (
        <div className="trade-board__empty">
          no listings match. {session ? "be the first to post." : "sign in to post."}
        </div>
      )}
    </div>
  );
}
