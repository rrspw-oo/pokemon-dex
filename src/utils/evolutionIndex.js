import data from "../data/evolution_chains.json";

export function getEvolutionChainForSpecies(speciesId) {
  const chainId = data.speciesToChain[speciesId];
  if (chainId == null) return [];
  return data.chains[chainId] || [];
}
