export const REGIONS = [
  "TW", "JP", "KR", "HK", "CN", "SG", "MY", "TH", "VN", "PH", "ID",
  "US", "CA", "MX", "BR", "AR", "CL",
  "GB", "FR", "DE", "IT", "ES", "NL", "PL", "RU",
  "AU", "NZ",
  "ZA", "EG",
];

export const LANGUAGES = ["zh-TW", "en", "ja", "ko", "es", "fr", "de", "pt", "ru"];

export const LISTING_STATUS = {
  OPEN: "open",
  PENDING: "pending",
  COMPLETED: "completed",
  EXPIRED: "expired",
  REMOVED: "removed",
};

export function emptyListing() {
  return {
    id: null,
    userId: null,
    have: {
      pokemonId: null,
      pokemonName: "",
      ivAttack: null,
      ivDefense: null,
      ivStamina: null,
      cp: null,
      level: null,
      shiny: false,
      isVariant: false,
      formNote: "",
    },
    want: {
      pokemonId: null,
      pokemonName: "",
      shiny: false,
      isVariant: false,
      formNote: "",
    },
    region: null,
    languages: [],
    note: "",
    status: LISTING_STATUS.OPEN,
    createdAt: null,
    updatedAt: null,
    expiresAt: null,
  };
}

export function listingMatchesQuery(listing, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  const fields = [
    listing.have.pokemonName,
    listing.want.pokemonName,
    listing.note,
    listing.region,
  ];
  return fields.some((f) => (f || "").toLowerCase().includes(q));
}

export function isMatch(myListing, theirListing) {
  return (
    myListing.have.pokemonId === theirListing.want.pokemonId &&
    myListing.want.pokemonId === theirListing.have.pokemonId
  );
}
