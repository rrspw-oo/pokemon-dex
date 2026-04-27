import { LISTING_STATUS, emptyListing, isMatch } from "./types";
import { HAS_SUPABASE, supabase } from "./supabaseClient";

const STORAGE_KEY = "pokemon-dex.trade.listings.v1";
const SESSION_KEY = "pokemon-dex.trade.session.v1";

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed();
    return JSON.parse(raw);
  } catch {
    return seed();
  }
}

function persist(listings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
  } catch {}
}

function seed() {
  const now = Date.now();
  const sample = [
    {
      ...emptyListing(),
      id: "demo-1",
      userId: "demo-user-jp",
      have: { ...emptyListing().have, pokemonId: 128, pokemonName: "Tauros (Paldean Aqua)", ivAttack: 14, ivDefense: 15, ivStamina: 13, cp: 1498, level: 50, isVariant: true, formNote: "Paldean Aqua Breed" },
      want: { ...emptyListing().want, pokemonId: 214, pokemonName: "Heracross", shiny: true, formNote: "Latin America regional" },
      region: "JP",
      languages: ["ja", "en"],
      note: "Looking for shiny Heracross, willing to do multiple trades",
      createdAt: now - 1000 * 60 * 60 * 4,
      updatedAt: now - 1000 * 60 * 60 * 4,
      expiresAt: now + 1000 * 60 * 60 * 24 * 14,
    },
    {
      ...emptyListing(),
      id: "demo-2",
      userId: "demo-user-tw",
      have: { ...emptyListing().have, pokemonId: 1, pokemonName: "Bulbasaur", ivAttack: 15, ivDefense: 15, ivStamina: 15, cp: 1500, level: 41, shiny: true },
      want: { ...emptyListing().want, pokemonId: 4, pokemonName: "Charmander", shiny: true },
      region: "TW",
      languages: ["zh-TW", "en"],
      note: "Hundo shiny for hundo shiny only",
      createdAt: now - 1000 * 60 * 30,
      updatedAt: now - 1000 * 60 * 30,
      expiresAt: now + 1000 * 60 * 60 * 24 * 14,
    },
    {
      ...emptyListing(),
      id: "demo-3",
      userId: "demo-user-fr",
      have: { ...emptyListing().have, pokemonId: 4, pokemonName: "Charmander", ivAttack: 12, ivDefense: 14, ivStamina: 13, shiny: true },
      want: { ...emptyListing().want, pokemonId: 1, pokemonName: "Bulbasaur", shiny: true },
      region: "FR",
      languages: ["fr", "en"],
      note: "Open to remote trade after Forever Friend",
      createdAt: now - 1000 * 60 * 10,
      updatedAt: now - 1000 * 60 * 10,
      expiresAt: now + 1000 * 60 * 60 * 24 * 14,
    },
  ];
  persist(sample);
  return sample;
}

function delay(ms = 80) {
  return new Promise((r) => setTimeout(r, ms));
}

function rowToListing(row) {
  return {
    id: row.id,
    userId: row.user_id,
    have: {
      pokemonId: row.have_pokemon_id,
      pokemonName: row.have_pokemon_name,
      ivAttack: row.have_iv_attack,
      ivDefense: row.have_iv_defense,
      ivStamina: row.have_iv_stamina,
      cp: row.have_cp,
      level: row.have_level,
      shiny: !!row.have_shiny,
      isVariant: !!row.have_is_variant,
      formNote: row.have_form_note || "",
    },
    want: {
      pokemonId: row.want_pokemon_id,
      pokemonName: row.want_pokemon_name,
      shiny: !!row.want_shiny,
      isVariant: !!row.want_is_variant,
      formNote: row.want_form_note || "",
    },
    region: row.region,
    languages: row.languages || [],
    note: row.note || "",
    status: row.status,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : null,
  };
}

function listingToRow(input, userId) {
  return {
    user_id: userId,
    have_pokemon_id: input.have.pokemonId,
    have_pokemon_name: input.have.pokemonName,
    have_iv_attack: input.have.ivAttack,
    have_iv_defense: input.have.ivDefense,
    have_iv_stamina: input.have.ivStamina,
    have_cp: input.have.cp,
    have_level: input.have.level,
    have_shiny: !!input.have.shiny,
    have_is_variant: !!input.have.isVariant,
    have_form_note: input.have.formNote || "",
    want_pokemon_id: input.want.pokemonId,
    want_pokemon_name: input.want.pokemonName,
    want_shiny: !!input.want.shiny,
    want_is_variant: !!input.want.isVariant,
    want_form_note: input.want.formNote || "",
    region: input.region,
    languages: input.languages || [],
    note: input.note || "",
    status: LISTING_STATUS.OPEN,
  };
}

export async function getSession() {
  if (HAS_SUPABASE) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return null;
    const u = data.session.user;
    return {
      userId: u.id,
      email: u.email,
      verified: !!u.user_metadata?.verified,
      createdAt: new Date(u.created_at).getTime(),
    };
  }
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function onAuthChange(handler) {
  if (!HAS_SUPABASE) return () => {};
  const { data } = supabase.auth.onAuthStateChange(() => {
    getSession().then(handler);
  });
  return () => data.subscription.unsubscribe();
}

export async function signInWithEmail(email) {
  if (HAS_SUPABASE) {
    if (!email || !email.includes("@")) throw new Error("Invalid email");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    });
    if (error) throw new Error(error.message);
    return { pending: true, email };
  }
  await delay(120);
  if (!email || !email.includes("@")) throw new Error("Invalid email");
  const session = {
    userId: `local-${btoa(email).replace(/=/g, "")}`,
    email,
    verified: false,
    createdAt: Date.now(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function signOut() {
  if (HAS_SUPABASE) {
    await supabase.auth.signOut();
    return;
  }
  localStorage.removeItem(SESSION_KEY);
}

export async function listListings({ search = "", region = null, limit = 50 } = {}) {
  if (HAS_SUPABASE) {
    let q = supabase
      .from("listings")
      .select("*")
      .eq("status", LISTING_STATUS.OPEN)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (region) q = q.eq("region", region);
    if (search) {
      const s = `%${search}%`;
      q = q.or(`have_pokemon_name.ilike.${s},want_pokemon_name.ilike.${s},note.ilike.${s}`);
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data || []).map(rowToListing);
  }
  await delay();
  const all = loadAll().filter((l) => l.status === LISTING_STATUS.OPEN);
  const qs = (search || "").toLowerCase().trim();
  let out = all;
  if (region) out = out.filter((l) => l.region === region);
  if (qs) {
    out = out.filter((l) => {
      const blob = `${l.have.pokemonName} ${l.want.pokemonName} ${l.note}`.toLowerCase();
      return blob.includes(qs);
    });
  }
  out.sort((a, b) => b.createdAt - a.createdAt);
  return out.slice(0, limit);
}

export async function findMatchesFor(listing) {
  if (HAS_SUPABASE) {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("status", LISTING_STATUS.OPEN)
      .neq("user_id", listing.userId)
      .eq("have_pokemon_id", listing.want.pokemonId)
      .eq("want_pokemon_id", listing.have.pokemonId);
    if (error) throw new Error(error.message);
    return (data || []).map(rowToListing);
  }
  await delay();
  const all = loadAll().filter((l) => l.status === LISTING_STATUS.OPEN);
  return all.filter((l) => l.userId !== listing.userId && isMatch(listing, l));
}

export async function createListing(input) {
  const session = await getSession();
  if (!session || session.pending) throw new Error("not_authenticated");
  if (HAS_SUPABASE) {
    const row = listingToRow(input, session.userId);
    const { data, error } = await supabase.from("listings").insert(row).select().single();
    if (error) throw new Error(error.message);
    return rowToListing(data);
  }
  await delay();
  const now = Date.now();
  const all = loadAll();
  const listing = {
    ...emptyListing(),
    ...input,
    id: `l-${now}-${Math.random().toString(36).slice(2, 8)}`,
    userId: session.userId,
    status: LISTING_STATUS.OPEN,
    createdAt: now,
    updatedAt: now,
    expiresAt: now + 1000 * 60 * 60 * 24 * 14,
  };
  all.push(listing);
  persist(all);
  return listing;
}

export async function updateListingStatus(id, status) {
  if (HAS_SUPABASE) {
    const { data, error } = await supabase
      .from("listings")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rowToListing(data);
  }
  await delay();
  const all = loadAll();
  const idx = all.findIndex((l) => l.id === id);
  if (idx === -1) throw new Error("not_found");
  all[idx] = { ...all[idx], status, updatedAt: Date.now() };
  persist(all);
  return all[idx];
}

export async function getMyListings() {
  const session = await getSession();
  if (!session) return [];
  if (HAS_SUPABASE) {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", session.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToListing);
  }
  return loadAll().filter((l) => l.userId === session.userId);
}
