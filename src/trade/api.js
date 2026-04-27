import { LISTING_STATUS, emptyListing, isMatch } from "./types";

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
      have: { ...emptyListing().have, pokemonId: 128, pokemonName: "Tauros (Paldean Aqua)", ivAttack: 14, ivDefense: 15, ivStamina: 13, cp: 1498, level: 50, shiny: false, isVariant: true, formNote: "Paldean Aqua Breed" },
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

export async function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function signInWithEmail(email) {
  await delay(120);
  if (!email || !email.includes("@")) throw new Error("Invalid email");
  const session = {
    userId: `local-${btoa(email).replace(/=/g, "")}`,
    email,
    trainerCode: null,
    region: null,
    verified: false,
    createdAt: Date.now(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function signOut() {
  localStorage.removeItem(SESSION_KEY);
}

export async function listListings({ search = "", region = null, limit = 50 } = {}) {
  await delay();
  const all = loadAll().filter((l) => l.status === LISTING_STATUS.OPEN);
  const q = (search || "").toLowerCase().trim();
  let out = all;
  if (region) out = out.filter((l) => l.region === region);
  if (q) {
    out = out.filter((l) => {
      const blob = `${l.have.pokemonName} ${l.want.pokemonName} ${l.note}`.toLowerCase();
      return blob.includes(q);
    });
  }
  out.sort((a, b) => b.createdAt - a.createdAt);
  return out.slice(0, limit);
}

export async function findMatchesFor(listing) {
  await delay();
  const all = loadAll().filter((l) => l.status === LISTING_STATUS.OPEN);
  return all.filter((l) => l.userId !== listing.userId && isMatch(listing, l));
}

export async function createListing(input) {
  await delay();
  const session = await getSession();
  if (!session) throw new Error("not_authenticated");
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
  await delay();
  const all = loadAll();
  const idx = all.findIndex((l) => l.id === id);
  if (idx === -1) throw new Error("not_found");
  all[idx] = { ...all[idx], status, updatedAt: Date.now() };
  persist(all);
  return all[idx];
}

export async function getMyListings() {
  await delay();
  const session = await getSession();
  if (!session) return [];
  return loadAll().filter((l) => l.userId === session.userId);
}
