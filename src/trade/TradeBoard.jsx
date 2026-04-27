import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listListings,
  listListingsMatchingMe,
  getSession,
  signInWithEmail,
  signOut,
  expressInterest,
  respondToInterest,
  getMyInterests,
  getProfile,
} from "./api";
import { REGIONS, FILTER_SIDE, INTEREST_STATUS } from "./types";
import PokemonPicker from "./PokemonPicker";
import CreateListingPanel from "./CreateListingPanel";
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

export default function TradeBoard() {
  const [listings, setListings] = useState([]);
  const [region, setRegion] = useState(null);
  const [pokemonFilter, setPokemonFilter] = useState({ pokemonId: null, pokemonName: "", pokemonNameZh: "" });
  const [side, setSide] = useState(FILTER_SIDE.ANY);
  const [matchesOnly, setMatchesOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [emailInput, setEmailInput] = useState("");
  const [authError, setAuthError] = useState(null);
  const [authNotice, setAuthNotice] = useState(null);
  const [interests, setInterests] = useState({ sent: [], received: [] });
  const [revealedFor, setRevealedFor] = useState({});
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getSession().then(setSession);
  }, []);

  const refreshInterests = useCallback(async () => {
    const i = await getMyInterests();
    setInterests(i);
  }, []);

  useEffect(() => {
    if (session && !session.pending) refreshInterests();
  }, [session, refreshInterests]);

  const refreshListings = useCallback(async () => {
    setLoading(true);
    let res;
    if (matchesOnly) {
      res = await listListingsMatchingMe();
    } else {
      res = await listListings({
        region,
        pokemonId: pokemonFilter.pokemonId,
        side,
      });
    }
    setListings(res);
    setLoading(false);
  }, [region, pokemonFilter, side, matchesOnly]);

  useEffect(() => {
    refreshListings();
  }, [refreshListings]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthNotice(null);
    try {
      const result = await signInWithEmail(emailInput);
      if (result && result.pending) {
        setAuthNotice(`Magic link sent to ${result.email}. Check your inbox.`);
        setEmailInput("");
      } else {
        setSession(result);
        setEmailInput("");
      }
    } catch (err) {
      setAuthError(err.message || "sign in failed");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setSession(null);
    setInterests({ sent: [], received: [] });
  };

  const handleInterest = async (listing) => {
    if (!session || session.pending) {
      setAuthError("sign in to express interest");
      return;
    }
    try {
      await expressInterest(listing);
      await refreshInterests();
    } catch (err) {
      setAuthError(err.message || "could not send interest");
    }
  };

  const handleRespond = async (interest, status) => {
    try {
      await respondToInterest(interest.id, status);
      await refreshInterests();
      if (status === INTEREST_STATUS.REVEALED) {
        const fromProfile = await getProfile(interest.from_user_id);
        setRevealedFor((prev) => ({ ...prev, [interest.id]: fromProfile }));
      }
    } catch (err) {
      setAuthError(err.message || "could not respond");
    }
  };

  const interestByListingId = useMemo(() => {
    const map = {};
    for (const i of interests.sent) map[i.listing_id] = i;
    return map;
  }, [interests.sent]);

  const incomingPending = interests.received.filter(
    (i) => i.status === INTEREST_STATUS.PENDING
  );

  return (
    <div className="trade-board">
      <div className="trade-board__topbar">
        <div className="trade-board__brand">GLOBAL TRADE BOARD</div>
        {session && !session.pending ? (
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

      {authNotice && <div className="trade-board__notice">{authNotice}</div>}
      {authError && <div className="trade-board__error">{authError}</div>}

      {incomingPending.length > 0 && (
        <div className="trade-board__inbox">
          <div className="trade-board__inbox-title">
            {incomingPending.length} INCOMING INTEREST
            {incomingPending.length > 1 ? "S" : ""}
          </div>
          <ul className="trade-board__inbox-list">
            {incomingPending.map((i) => (
              <li key={i.id} className="trade-board__inbox-item">
                <span className="trade-board__inbox-from">
                  someone wants to trade your listing
                </span>
                <span className="trade-board__inbox-actions">
                  <button
                    type="button"
                    className="trade-board__btn trade-board__btn--accept"
                    onClick={() => handleRespond(i, INTEREST_STATUS.REVEALED)}
                  >
                    REVEAL CODE
                  </button>
                  <button
                    type="button"
                    className="trade-board__btn trade-board__btn--decline"
                    onClick={() => handleRespond(i, INTEREST_STATUS.DECLINED)}
                  >
                    DECLINE
                  </button>
                </span>
                {revealedFor[i.id] && (
                  <span className="trade-board__inbox-revealed">
                    {revealedFor[i.id].handle ? `@${revealedFor[i.id].handle} ` : ""}
                    {revealedFor[i.id].trainerCode || "(trainer code not set)"}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="trade-board__filters">
        <PokemonPicker
          value={pokemonFilter}
          onChange={setPokemonFilter}
          placeholder="filter by Pokemon..."
        />
        <div className="trade-board__side">
          {[FILTER_SIDE.ANY, FILTER_SIDE.HAS, FILTER_SIDE.WANTS].map((s) => (
            <button
              key={s}
              type="button"
              className={`trade-board__side-btn${side === s ? " is-active" : ""}`}
              onClick={() => setSide(s)}
              disabled={!pokemonFilter.pokemonId && s !== FILTER_SIDE.ANY}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
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
          className={`trade-board__matches${matchesOnly ? " is-active" : ""}`}
          onClick={() => setMatchesOnly((m) => !m)}
          disabled={!session || session.pending}
          title={
            !session || session.pending
              ? "sign in and post listings to see matches"
              : "show only listings that match yours"
          }
        >
          {matchesOnly ? "* MATCHES ME *" : "MATCHES ME"}
        </button>
        <button
          type="button"
          className="trade-board__post"
          onClick={() => setCreating(true)}
          disabled={!session || session.pending}
          title={session && !session.pending ? "Create new listing" : "Sign in to post"}
        >
          + POST LISTING
        </button>
      </div>

      {creating && session && !session.pending && (
        <CreateListingPanel
          session={session}
          onClose={() => setCreating(false)}
          onCreated={() => refreshListings()}
        />
      )}

      <div className="trade-board__count">
        {loading
          ? "loading..."
          : `${listings.length} ${matchesOnly ? "matching" : "open"} listing${listings.length === 1 ? "" : "s"}`}
      </div>

      <ul className="trade-board__list">
        {listings.map((l) => {
          const myInterest = interestByListingId[l.id];
          const isMine = session && session.userId === l.userId;
          return (
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
              {!isMine && (
                <div className="trade-card__cta">
                  {myInterest ? (
                    <span className="trade-card__interest-status">
                      {myInterest.status === INTEREST_STATUS.PENDING && "INTEREST SENT"}
                      {myInterest.status === INTEREST_STATUS.REVEALED && "CODE REVEALED"}
                      {myInterest.status === INTEREST_STATUS.DECLINED && "DECLINED"}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="trade-card__interest-btn"
                      onClick={() => handleInterest(l)}
                      disabled={!session || session.pending}
                    >
                      INTERESTED
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {!loading && listings.length === 0 && (
        <div className="trade-board__empty">
          {matchesOnly
            ? "no matches yet. post listings of what you want and what you have."
            : "no listings match your filters."}
        </div>
      )}
    </div>
  );
}
