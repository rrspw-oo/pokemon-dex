import database from "../data/complete_pokemon_database.json";

const records = [];
const byId = new Map();
const enPrefix = new Map();
const zhChar = new Map();
const enSubstring = new Map();

function pushIndex(map, key, idx) {
  let bucket = map.get(key);
  if (!bucket) {
    bucket = [];
    map.set(key, bucket);
  }
  if (bucket[bucket.length - 1] !== idx) bucket.push(idx);
}

function indexRecord(entry, idx) {
  const enLower = (entry.name_en || "").toLowerCase();
  const zh = entry.name_zh_tw || "";

  for (let len = 1; len <= Math.min(enLower.length, 12); len++) {
    pushIndex(enPrefix, enLower.slice(0, len), idx);
  }

  for (let i = 0; i < enLower.length; i++) {
    for (let j = i + 2; j <= Math.min(enLower.length, i + 8); j++) {
      pushIndex(enSubstring, enLower.slice(i, j), idx);
    }
  }

  for (const ch of zh) {
    pushIndex(zhChar, ch, idx);
  }
}

database.forEach((entry, idx) => {
  records.push(entry);
  if (!byId.has(entry.id)) byId.set(entry.id, []);
  byId.get(entry.id).push(idx);
  indexRecord(entry, idx);
});

export const totalCount = records.length;

export function getById(id) {
  const idxs = byId.get(Number(id));
  return idxs ? idxs.map((i) => records[i]) : [];
}

export function getRecord(idx) {
  return records[idx];
}

function intersectAll(buckets) {
  if (buckets.length === 0) return [];
  if (buckets.length === 1) return buckets[0];
  const counts = new Map();
  for (const bucket of buckets) {
    for (const idx of bucket) counts.set(idx, (counts.get(idx) || 0) + 1);
  }
  const target = buckets.length;
  const result = [];
  for (const [idx, c] of counts) if (c === target) result.push(idx);
  return result;
}

function searchEnglish(query) {
  const q = query.toLowerCase();
  const prefixHits = enPrefix.get(q);
  if (prefixHits && prefixHits.length) {
    return prefixHits.map((idx) => ({ idx, score: 100 }));
  }
  const subHits = enSubstring.get(q);
  if (subHits && subHits.length) {
    return subHits.map((idx) => ({ idx, score: 60 }));
  }
  return [];
}

function searchChinese(query) {
  const chars = Array.from(query);
  const buckets = chars.map((c) => zhChar.get(c)).filter(Boolean);
  if (buckets.length !== chars.length) return [];
  const matched = intersectAll(buckets);
  return matched.map((idx) => ({ idx, score: 80 }));
}

function searchNumeric(query) {
  const exact = byId.get(Number(query));
  const out = [];
  if (exact) for (const i of exact) out.push({ idx: i, score: 100 });
  const queryStr = String(query);
  for (const [id, idxs] of byId) {
    if (id === Number(query)) continue;
    if (String(id).startsWith(queryStr)) {
      for (const i of idxs) out.push({ idx: i, score: 50 });
    }
  }
  return out;
}

const isNumeric = (s) => /^\d+$/.test(s);
const hasCJK = (s) => /[一-鿿]/.test(s);

export function search(rawQuery, limit = 50) {
  if (!rawQuery) return [];
  const query = rawQuery.trim();
  if (!query) return [];

  let hits;
  if (isNumeric(query)) hits = searchNumeric(query);
  else if (hasCJK(query)) hits = searchChinese(query);
  else hits = searchEnglish(query);

  const seen = new Set();
  const unique = [];
  hits.sort((a, b) => b.score - a.score || records[a.idx].id - records[b.idx].id);
  for (const hit of hits) {
    const r = records[hit.idx];
    const key = `${r.id}-${r.name_en}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(r);
    if (unique.length >= limit) break;
  }
  return unique;
}

export function suggest(rawQuery, limit = 8) {
  return search(rawQuery, limit).map((entry) => ({
    id: entry.id,
    text: entry.name_zh_tw || entry.name_en,
    chineseName: entry.name_zh_tw,
    englishName: entry.name_en,
    isVariant: !!entry.is_variant,
  }));
}

export function getEvolutionFamily() {
  return [];
}
