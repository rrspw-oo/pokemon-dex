import data from "../data/evolution_chains.json";
import { getById } from "./searchIndex";

const ITEM_ZH = {
  "thunder-stone": "雷之石", "fire-stone": "火之石", "water-stone": "水之石",
  "leaf-stone": "葉之石", "moon-stone": "月之石", "sun-stone": "日之石",
  "shiny-stone": "光之石", "dusk-stone": "暗之石", "dawn-stone": "覺醒石",
  "ice-stone": "冰之石", "kings-rock": "王者之證", "metal-coat": "金屬膜",
  "dragon-scale": "龍之鱗片", "up-grade": "升級資料", "dubious-disc": "可疑修正檔",
  "prism-scale": "美麗鱗片", "reaper-cloth": "靈界之布",
  electirizer: "電力增強器", magmarizer: "熔岩增強器", protector: "護具",
  "razor-claw": "銳利之爪", "razor-fang": "銳利之牙",
};

export function describeEvolution(node) {
  if (!node || !node.trigger) return "基本型態";
  const parts = [];
  switch (node.trigger) {
    case "level-up":
      if (node.minLevel) parts.push(`等級 ${node.minLevel}`);
      if (node.minHappiness) parts.push(`親密度 ${node.minHappiness}`);
      if (node.timeOfDay) parts.push(node.timeOfDay === "day" ? "白天" : "夜晚");
      break;
    case "use-item":
      if (node.item) parts.push(`使用 ${ITEM_ZH[node.item] || node.item}`);
      break;
    case "trade":
      parts.push("交換");
      if (node.item) parts.push(`攜帶 ${ITEM_ZH[node.item] || node.item}`);
      break;
    default:
      parts.push("特殊條件");
  }
  return parts.length ? parts.join("，") : "進化條件";
}

export function getEvolutionChainForSpecies(speciesId) {
  const chainId = data.speciesToChain[speciesId];
  if (chainId == null) return [];
  return data.chains[chainId] || [];
}
