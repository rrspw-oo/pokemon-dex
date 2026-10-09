import { createContext, useContext } from "react";

const EN = {
  圖鑑: "Pokédex",
  屬性: "Types",
  盃賽: "Cups",
  上一隻: "Previous",
  全部結果: "All results",
  屬性排行: "Type rankings",
  返回: "Back",
  "找不到「{query}」相關的寶可夢": "No Pokémon found for “{query}”",
  重設搜尋: "Reset search",
  功能: "Sections",
  上一張: "Previous",
  關閉: "Close",
  下一張: "Next",
  卡牌: "Cards",
  收卡: "Hide cards",
  發卡: "Show cards",
  "{n} 張": "{n} cards",
  此寶可夢暫搜尋不到卡牌: "No cards found for this Pokémon",
  小小盃: "Little Cup",
  超級聯盟: "Great League",
  高級聯盟: "Ultra League",
  大師聯盟: "Master League",
  超級: "Great",
  高級: "Ultra",
  大師: "Master",
  "無 CP 上限": "No CP limit",
  聯盟: "League",
  "{name} {sub} 的盃賽": "{name} ({sub}) cups",
  "多禁 {n} 種": "{n} more banned",
  "多開放 {n} 種": "{n} more allowed",
  "進化前 CP {cp}": "Before Mega CP {cp}",
  "超級進化 CP {cp}": "Mega CP {cp}",
  全部盃賽: "All cups",
  "比{base}多禁：{list}": "Banned on top of {base}: {list}",
  "多開放：{list}": "Also allowed: {list}",
  推薦排名: "Rankings",
  排名範圍: "Ranking scope",
  全部: "All",
  只看超級進化: "Megas only",
  載入中: "Loading",
  無資料: "No data",
  菁英: "Elite",
  擅長對付: "Wins against",
  剋星: "Countered by",
  "查看{name}": "View {name}",
  能量: "Energy",
  超級能量: "Mega Energy",
  原始回歸: "Primal Reversion",
  超級進化: "Mega Evolution",
  "首次 {n} {energy}": "First {n} {energy}",
  "之後 {n} {energy}": "Then {n} {energy}",
  進化: "Evolution",
  此寶可夢不會進化: "This Pokémon does not evolve",
  "點選進化後的寶可夢查看 Pokémon GO 進化條件": "Tap an evolution to see its Pokémon GO requirements",
  "進化成{name}": "Evolves into {name}",
  "Pokémon GO 目前沒有這個進化": "Not available in Pokémon GO yet",
  "由{from}進化成{to}": "{to} evolves from {from}",
  型態變化: "Form change",
  "變換成{name}": "Change to {name}",
  "從{name}": "From {name}",
  目前無法透過型態變化獲得在官方有活動時方可進化: "Not available through form change; only during official events",
  "點選型態查看 Pokémon GO 變換條件": "Tap a form to see its Pokémon GO requirements",
  一般: "Normal",
  閃光: "Shiny",
  超極巨化: "Gigantamax",
  外觀: "Appearance",
  其他型態: "Other forms",
  搜尋結果: "Search results",
  "找到 {n} 筆": "{n} found",
  "PvP 推薦": "PvP",
  暗影: "Shadow",
  一般招式: "Fast",
  特殊招式: "Charged",
  推薦招式: "Recommended moves",
  未列入此聯盟排名: "Not ranked in this league",
  聯盟排名: "League rank",
  "分數 {n}": "Score {n}",
  "推薦 IV": "Best IVs",
  "攻擊 {n}": "Atk {n}",
  "防禦 {n}": "Def {n}",
  第二屬性: "Second type",
  不限: "Any",
  "{label} 最強排名": "Top {label}-type Pokémon",
  此聯盟沒有排名資料: "No rankings in this league",
  只看前五名: "Top 5 only",
  "看全部排名（{n}）": "Show all ({n})",
  "全部 {label} 屬性寶可夢": "All {label}-type Pokémon",
  輸入編號名稱屬性或進化條件: "Number, name, type or evolution item",
  搜尋寶可夢: "Search Pokémon",
  清除: "Clear",
  語言: "Language",
};

const ZH = {
  目前無法透過型態變化獲得在官方有活動時方可進化: "目前無法透過型態變化獲得，在官方有活動時方可進化",
  輸入編號名稱屬性或進化條件: "輸入編號、名稱、屬性或進化條件",
};

export const LANGS = ["zh", "en"];
export const LangContext = createContext("zh");

export function initialLang() {
  const param = new URLSearchParams(window.location.search).get("lang");
  if (LANGS.includes(param)) return param;
  try {
    const saved = window.localStorage.getItem("lang");
    if (LANGS.includes(saved)) return saved;
  } catch {
    return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
  }
  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

export function translate(lang, text, vars) {
  let out = (lang === "en" ? EN[text] : ZH[text]) ?? text;
  for (const [key, value] of Object.entries(vars || {})) out = out.replaceAll(`{${key}}`, value);
  return out;
}

export const useLang = () => useContext(LangContext);

export function useT() {
  const lang = useLang();
  return (text, vars) => translate(lang, text, vars);
}

export const nameOf = (pokemon, lang) => (lang === "en" ? pokemon.en || pokemon.zh : pokemon.zh);
