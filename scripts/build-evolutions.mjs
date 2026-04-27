import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../src/data/evolution_chains.json");
const API = "https://pokeapi.co/api/v2";
const MAX_SPECIES = 1025;
const CONCURRENCY = 16;

const idFromUrl = (url) => {
  const m = url.match(/\/(\d+)\/?$/);
  return m ? Number(m[1]) : null;
};

async function getJson(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res.json();
    if (res.status === 404) return null;
    await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
  }
  throw new Error(`Failed: ${url}`);
}

function flattenChain(node, stage = 0, acc = []) {
  const detail = node.evolution_details && node.evolution_details[0];
  acc.push({
    id: idFromUrl(node.species.url),
    name: node.species.name,
    stage,
    trigger: detail?.trigger?.name || null,
    minLevel: detail?.min_level || null,
    item: detail?.item?.name || null,
    minHappiness: detail?.min_happiness || null,
    timeOfDay: detail?.time_of_day || null,
  });
  for (const next of node.evolves_to || []) flattenChain(next, stage + 1, acc);
  return acc;
}

async function processSpecies(id) {
  const species = await getJson(`${API}/pokemon-species/${id}`);
  if (!species || !species.evolution_chain) return null;
  const chainId = idFromUrl(species.evolution_chain.url);
  return { id, chainId };
}

async function pool(items, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: CONCURRENCY }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      try {
        results[i] = await worker(items[i], i);
      } catch (err) {
        results[i] = null;
        process.stderr.write(`! ${items[i]}: ${err.message}\n`);
      }
      if (i % 50 === 0) process.stdout.write(`  ${i}/${items.length}\r`);
    }
  });
  await Promise.all(runners);
  return results;
}

async function main() {
  const ids = Array.from({ length: MAX_SPECIES }, (_, i) => i + 1);
  console.log(`fetching species 1..${MAX_SPECIES}`);
  const speciesMap = await pool(ids, processSpecies);

  const chainIds = new Set();
  const speciesToChain = {};
  for (const s of speciesMap) {
    if (!s) continue;
    speciesToChain[s.id] = s.chainId;
    chainIds.add(s.chainId);
  }

  console.log(`\nfetching ${chainIds.size} unique chains`);
  const chainList = [...chainIds];
  const chains = await pool(chainList, async (cid) => {
    const data = await getJson(`${API}/evolution-chain/${cid}`);
    return data ? { cid, nodes: flattenChain(data.chain) } : null;
  });

  const chainsById = {};
  for (const c of chains) if (c) chainsById[c.cid] = c.nodes;

  const out = {
    version: 1,
    generatedAt: new Date().toISOString().slice(0, 10),
    speciesToChain,
    chains: chainsById,
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(out));
  console.log(`\nwrote ${OUT} (${(JSON.stringify(out).length / 1024).toFixed(1)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
