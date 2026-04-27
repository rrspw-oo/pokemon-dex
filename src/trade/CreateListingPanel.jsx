import { useState } from "react";
import PokemonPicker from "./PokemonPicker";
import { REGIONS } from "./types";
import { createListing, upsertMyProfile, getProfile } from "./api";
import "./CreateListingPanel.css";

export default function CreateListingPanel({ session, onClose, onCreated }) {
  const [have, setHave] = useState({ pokemonId: null, pokemonName: "", pokemonNameZh: "" });
  const [haveShiny, setHaveShiny] = useState(false);
  const [haveIvA, setHaveIvA] = useState("");
  const [haveIvD, setHaveIvD] = useState("");
  const [haveIvS, setHaveIvS] = useState("");
  const [haveCp, setHaveCp] = useState("");

  const [want, setWant] = useState({ pokemonId: null, pokemonName: "", pokemonNameZh: "" });
  const [wantShiny, setWantShiny] = useState(false);

  const [region, setRegion] = useState("");
  const [note, setNote] = useState("");

  const [handle, setHandle] = useState("");
  const [trainerCode, setTrainerCode] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const canSubmit = have.pokemonId && want.pokemonId && region && !submitting;

  async function ensureProfile() {
    const existing = await getProfile(session.userId);
    const finalHandle = handle.trim() || existing?.handle || session.email.split("@")[0];
    const finalCode = trainerCode.replace(/\s+/g, "") || existing?.trainerCode || null;
    const finalRegion = region || existing?.region || null;
    if (!existing || !existing.trainerCode || !existing.handle) {
      await upsertMyProfile({
        handle: finalHandle,
        trainerCode: finalCode,
        region: finalRegion,
        languages: existing?.languages || [],
      });
    }
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await ensureProfile();
      const listing = await createListing({
        have: {
          pokemonId: have.pokemonId,
          pokemonName: have.pokemonName,
          ivAttack: haveIvA ? Number(haveIvA) : null,
          ivDefense: haveIvD ? Number(haveIvD) : null,
          ivStamina: haveIvS ? Number(haveIvS) : null,
          cp: haveCp ? Number(haveCp) : null,
          shiny: haveShiny,
          isVariant: false,
          formNote: "",
        },
        want: {
          pokemonId: want.pokemonId,
          pokemonName: want.pokemonName,
          shiny: wantShiny,
          isVariant: false,
          formNote: "",
        },
        region,
        languages: [],
        note,
      });
      onCreated && onCreated(listing);
      onClose && onClose();
    } catch (err) {
      setError(err.message || "could not create listing");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="create-panel" role="dialog" aria-label="Create new listing">
      <div className="create-panel__inner">
        <div className="create-panel__head">
          <span className="create-panel__title">NEW LISTING</span>
          <button type="button" className="create-panel__close" onClick={onClose} aria-label="Close">
            X
          </button>
        </div>
        <form className="create-panel__form" onSubmit={submit}>
          <fieldset className="create-panel__group">
            <legend>HAVE</legend>
            <PokemonPicker value={have} onChange={setHave} placeholder="Pokemon you offer" />
            <div className="create-panel__row">
              <label className="create-panel__check">
                <input
                  type="checkbox"
                  checked={haveShiny}
                  onChange={(e) => setHaveShiny(e.target.checked)}
                />
                SHINY
              </label>
            </div>
            <div className="create-panel__row create-panel__row--ivs">
              <input type="number" min="0" max="15" placeholder="ATK"
                value={haveIvA} onChange={(e) => setHaveIvA(e.target.value)} />
              <input type="number" min="0" max="15" placeholder="DEF"
                value={haveIvD} onChange={(e) => setHaveIvD(e.target.value)} />
              <input type="number" min="0" max="15" placeholder="STA"
                value={haveIvS} onChange={(e) => setHaveIvS(e.target.value)} />
              <input type="number" min="10" max="5000" placeholder="CP"
                value={haveCp} onChange={(e) => setHaveCp(e.target.value)} />
            </div>
          </fieldset>

          <fieldset className="create-panel__group">
            <legend>WANT</legend>
            <PokemonPicker value={want} onChange={setWant} placeholder="Pokemon you seek" />
            <div className="create-panel__row">
              <label className="create-panel__check">
                <input
                  type="checkbox"
                  checked={wantShiny}
                  onChange={(e) => setWantShiny(e.target.checked)}
                />
                SHINY
              </label>
            </div>
          </fieldset>

          <fieldset className="create-panel__group">
            <legend>WHERE</legend>
            <select required value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="">select region</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </fieldset>

          <fieldset className="create-panel__group">
            <legend>NOTE (OPTIONAL)</legend>
            <textarea
              rows={2}
              maxLength={240}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="anything else..."
            />
          </fieldset>

          <fieldset className="create-panel__group create-panel__group--profile">
            <legend>YOUR PROFILE</legend>
            <div className="create-panel__hint">
              Only revealed to trainers you accept after they express interest.
            </div>
            <div className="create-panel__row">
              <label className="create-panel__field">
                HANDLE
                <input
                  type="text"
                  maxLength={24}
                  placeholder="@nickname"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                />
              </label>
              <label className="create-panel__field">
                TRAINER CODE
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9 ]*"
                  maxLength={15}
                  placeholder="0000 0000 0000"
                  value={trainerCode}
                  onChange={(e) => setTrainerCode(e.target.value)}
                />
              </label>
            </div>
          </fieldset>

          {error && <div className="create-panel__error">{error}</div>}

          <div className="create-panel__actions">
            <button type="button" className="create-panel__cancel" onClick={onClose}>
              CANCEL
            </button>
            <button type="submit" className="create-panel__submit" disabled={!canSubmit}>
              {submitting ? "POSTING..." : "POST LISTING"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
