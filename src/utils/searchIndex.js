import database from "../data/complete_pokemon_database.json";
import goEvolutions from "../data/go_evolutions.json";
import { TYPE_ZH } from "./types";

const normalize = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]/g, "");

export const records = database.map((entry, key) => {
  const zh = entry.form_zh || entry.name_zh_tw;
  const en = entry.form_en || entry.name_en;
  return {
    ...entry,
    key,
    zh,
    en,
    enKeys: [...new Set([normalize(en), normalize(entry.name_en)])],
    enWords: en.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean),
    zhKeys: [...new Set([zh, entry.name_zh_tw])],
  };
});

const byId = new Map();
for (const r of records) {
  if (!byId.has(r.id)) byId.set(r.id, []);
  byId.get(r.id).push(r);
}

const baseNames = [...byId.values()].map((rs) => ({ id: rs[0].id, name: normalize(rs[0].name_en) }));

const TYPE_BY_QUERY = new Map(
  Object.entries(TYPE_ZH).flatMap(([en, zh]) => [
    [en, en],
    [zh, en],
  ])
);

const conditions = Object.entries(goEvolutions.byTarget).flatMap(([to, options]) =>
  options.flatMap((o) =>
    o.lines.map((line) => ({ from: o.from, to: Number(to), form: o.form, line, norm: line.replace(/\s+/g, "") }))
  )
);

function typeOf(query) {
  return TYPE_BY_QUERY.get(query.toLowerCase().replace(/\s+/g, "").replace(/(屬性|系)$/, "")) || null;
}

function conditionMatches(query) {
  const q = query.replace(/\s+/g, "").replace(/誘餌(模組)?/g, "模組");
  const out = new Map();
  for (const c of conditions) {
    if (!(c.norm.includes(q) || Array.from(q).every((ch) => c.norm.includes(ch)))) continue;
    const key = `${c.from}>${c.to}>${c.form || ""}`;
    if (!out.has(key)) out.set(key, c);
  }
  return [...out.values()];
}

export function getById(id) {
  return byId.get(Number(id)) || [];
}

export function getByKey(key) {
  return records[key];
}

function editDistance(a, b) {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

function scoreEnglish(r, q) {
  let best = 0;
  for (const k of r.enKeys) {
    if (k === q) return 100;
    if (k.startsWith(q)) best = Math.max(best, 90);
    else if (k.includes(q)) best = Math.max(best, 60);
  }
  if (best < 80 && r.enWords.some((w) => w.startsWith(q))) best = 80;
  return best;
}

function scoreChinese(r, q) {
  let best = 0;
  for (const k of r.zhKeys) {
    if (k === q) return 100;
    if (k.startsWith(q)) best = Math.max(best, 90);
    else if (k.includes(q)) best = Math.max(best, 70);
    else if (Array.from(q).every((ch) => k.includes(ch))) best = Math.max(best, 50);
  }
  return best;
}

function fuzzyIds(q) {
  const limit = q.length <= 4 ? 1 : q.length <= 8 ? 2 : 3;
  const hits = new Map();
  for (const { id, name } of baseNames) {
    const d = Math.min(editDistance(q, name), editDistance(q, name.slice(0, q.length)));
    if (d <= limit) hits.set(id, d);
  }
  return hits;
}

export function search(rawQuery) {
  const query = (rawQuery || "").trim();
  if (!query) return [];
  const numeric = query.replace(/^#/, "");
  const scored = [];

  if (/^\d+$/.test(numeric)) {
    const n = Number(numeric);
    for (const r of records) {
      if (r.id === n) scored.push({ r, s: 100 });
      else if (String(r.id).startsWith(numeric)) scored.push({ r, s: 50 });
    }
  } else if (/[㐀-鿿]/.test(query)) {
    for (const r of records) {
      const s = scoreChinese(r, query);
      if (s) scored.push({ r, s });
    }
    const named = new Set(scored.map((x) => x.r.key));
    const hints = new Map();
    for (const c of conditionMatches(query)) {
      const sources = byId.get(c.from) || [];
      const base = (c.form && sources.find((r) => r.zh.includes(c.form))) || sources[0];
      const target = byId.get(c.to)?.[0];
      if (!base || !target || named.has(base.key)) continue;
      if (!hints.has(base.key)) hints.set(base.key, { base, lines: new Map() });
      const lines = hints.get(base.key).lines;
      if (!lines.has(c.line)) lines.set(c.line, []);
      lines.get(c.line).push(c.form ? `${target.zh}（${c.form}）` : target.zh);
    }
    for (const { base, lines } of hints.values()) {
      const single = new Set([...lines.values()].flat()).size === 1;
      const hint = [...lines]
        .map(([line, targets]) => (single ? `${line}才可進化` : `${targets.join("、")}：${line}`))
        .join("；");
      scored.push({ r: { ...base, hint }, s: 45 });
    }
  } else {
    const q = normalize(query);
    if (!q) return [];
    for (const r of records) {
      const s = scoreEnglish(r, q);
      if (s) scored.push({ r, s });
    }
    if (scored.length === 0 && q.length >= 3) {
      const fuzzy = fuzzyIds(q);
      for (const r of records) {
        if (fuzzy.has(r.id)) scored.push({ r, s: 40 - fuzzy.get(r.id) });
      }
    }
  }

  const type = typeOf(query);
  if (type) {
    const seen = new Set(scored.map((x) => x.r.key));
    for (const r of records) {
      if (!seen.has(r.key) && r.types.some((t) => t.toLowerCase() === type)) scored.push({ r, s: 40 });
    }
  }

  scored.sort((a, b) => b.s - a.s || a.r.id - b.r.id || a.r.key - b.r.key);
  return scored.map((x) => x.r);
}
