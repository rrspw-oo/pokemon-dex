import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../src/data/go_evolutions.json");
const FORMS_OUT = resolve(__dirname, "../src/data/go_forms.json");
const CACHE_DIR = resolve(__dirname, "../node_modules/.cache/pogo");
const REFRESH = process.argv.includes("--refresh");
const SOURCES = {
  gameMaster: "https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json",
  texts: "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Texts/Latest%20APK/JSON/i18n_chinesetraditional.json",
};

const ITEM_OVERRIDE = { ITEM_OTHER_EVOLUTION_STONE_A: "索財靈的硬幣" };
const REGION_ZH = { ALOLA: "阿羅拉", GALARIAN: "伽勒爾", HISUIAN: "洗翠", PALDEA: "帕底亞" };
const POKEAPI_FORM = {
  KYUREM_NORMAL: "kyurem",
  HOOPA_CONFINED: "hoopa",
  NECROZMA_NORMAL: "necrozma",
  NECROZMA_DUSK_MANE: "necrozma-dusk",
  NECROZMA_DAWN_WINGS: "necrozma-dawn",
  ZACIAN_HERO: "zacian",
  ZACIAN_CROWNED_SWORD: "zacian-crowned",
  ZAMAZENTA_HERO: "zamazenta",
  ZAMAZENTA_CROWNED_SHIELD: "zamazenta-crowned",
  ZYGARDE_COMPLETE_FIFTY_PERCENT: "zygarde",
  ZYGARDE_COMPLETE_TEN_PERCENT: "zygarde-10-power-construct",
  ZYGARDE_COMPLETE: "zygarde-complete",
  FURFROU_NATURAL: "furfrou",
};
const LURE_WEATHER = { ITEM_TROY_DISK_RAINY: "雨天" };
const hasCjk = (s) => /[\u3400-\u9fff]/.test(s || "");

async function load(url, name) {
  mkdirSync(CACHE_DIR, { recursive: true });
  const file = join(CACHE_DIR, name);
  if (REFRESH || !existsSync(file)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed: ${url}`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  return JSON.parse(readFileSync(file, "utf8"));
}

function textLookup(raw) {
  const pairs = raw.data;
  const map = new Map();
  for (let i = 0; i < pairs.length; i += 2) map.set(pairs[i].toLowerCase(), pairs[i + 1]);
  return (key) => map.get(key.toLowerCase());
}

function questTypes(goal, t) {
  for (const c of goal.condition || []) {
    const list = c.withPokemonType?.pokemonType || c.withOpponentPokemonBattleStatus?.opponentPokemonType;
    if (list) return list.map((x) => t(x.replace("POKEMON_TYPE_", "pokemon_type_")) || x).join("/");
  }
  return null;
}

function questText(quest, t) {
  const goal = quest.goals[0];
  const n = goal.target;
  const types = questTypes(goal, t);
  const combat = goal.condition?.find((c) => c.withCombatType)?.withCombatType.combatType || [];
  const where = combat.some((x) => x.includes("MAX")) ? "在團體戰或極巨對戰" : combat.length ? "在團體戰" : "";
  switch (quest.questType) {
    case "QUEST_CATCH_POKEMON":
      return `設為夥伴捕捉 ${n} 隻${types}屬性`;
    case "QUEST_FIGHT_POKEMON":
    case "QUEST_COMPLETE_BATTLE":
      return `設為夥伴${where}戰勝 ${n} 隻${types}屬性`;
    case "QUEST_COMPLETE_RAID_BATTLE":
      return `設為夥伴在團體戰獲勝 ${n} 次`;
    case "QUEST_BUDDY_EVOLUTION_WALK":
      return `和夥伴步行 ${n} 公里`;
    case "QUEST_BUDDY_EARN_AFFECTION_POINTS":
      return `和夥伴獲得 ${n} 顆心心`;
    case "QUEST_BUDDY_FEED":
      return `餵夥伴 ${n} 次點心`;
    case "QUEST_LAND_THROW":
      return `設為夥伴投出 ${n} 次 Excellent`;
    case "QUEST_USE_INCENSE":
      return n > 1 ? `設為夥伴使用 ${n} 個薰香` : "設為夥伴使用薰香";
    default:
      return null;
  }
}

function describe(branch, quests, t) {
  const lines = [];
  if (branch.candyCost) lines.push(`${branch.candyCost} 顆糖果`);
  if (branch.evolutionItemRequirement) {
    const item = ITEM_OVERRIDE[branch.evolutionItemRequirement] || t(`${branch.evolutionItemRequirement}_name`) || branch.evolutionItemRequirement;
    lines.push(branch.evolutionItemRequirementCost ? `${item} ×${branch.evolutionItemRequirementCost}` : item);
  }
  if (branch.lureItemRequirement) {
    const lure = (t(`${branch.lureItemRequirement}_name`) || branch.lureItemRequirement).replace("誘餌模組", "模組");
    const weather = LURE_WEATHER[branch.lureItemRequirement];
    lines.push(weather ? `${lure}或${weather}` : lure);
  }
  if (branch.genderRequirement) lines.push(branch.genderRequirement === "MALE" ? "限雄性" : "限雌性");
  if (branch.onlyDaytime) lines.push("限白天");
  if (branch.onlyNighttime) lines.push("限夜晚");
  if (branch.onlyDuskPeriod) lines.push("限黃昏");
  if (branch.onlyFullMoon) lines.push("限滿月");
  if (branch.onlyUpsideDown) lines.push("手機上下顛倒時進化");

  const questIds = (branch.questDisplay || []).map((q) => q.questRequirementTemplateId);
  const questLines = questIds.map((id) => quests.get(id)).filter(Boolean);
  for (const quest of questLines) {
    const text = questText(quest, t);
    if (!text) continue;
    lines.push(text);
  }
  if (!questLines.some((q) => q.questType === "QUEST_BUDDY_EVOLUTION_WALK") && branch.kmBuddyDistanceRequirement) {
    lines.push(`和夥伴步行 ${branch.kmBuddyDistanceRequirement} 公里`);
  }
  if (branch.mustBeBuddy && !lines.some((l) => l.includes("夥伴"))) lines.push("須設為夥伴");
  if (branch.noCandyCostViaTrade) lines.push("交換後進化免糖果");
  return lines;
}

async function pokeapiForm(form) {
  const name = POKEAPI_FORM[form] || form.toLowerCase().replace(/_/g, "-");
  const file = join(CACHE_DIR, `pokeapi_form_${name}.json`);
  if (!existsSync(file)) {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon-form/${name}`);
    if (!res.ok) return null;
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  return JSON.parse(readFileSync(file, "utf8"));
}

function describeFormChange(change, t, dexByName, moveZh) {
  const comp = change.componentPokemonSettings;
  const compZh = comp && t(`pokemon_name_${String(dexByName.get(comp.pokedexId)).padStart(4, "0")}`);
  if (comp?.formChangeType === "UNFUSE") return [`解除與${compZh}的合體`];
  const lines = [];
  if (change.candyCost) lines.push(`${change.candyCost} 顆糖果`);
  if (change.stardustCost) lines.push(`${change.stardustCost} 星星沙子`);
  if (change.item) lines.push(`${t(`${change.item}_name`) || change.item} ×${change.itemCostCount}`);
  if (comp?.formChangeType === "FUSE") {
    lines.push(`與${compZh}合體`);
    if (comp.componentCandyCost) lines.push(`${compZh}的糖果 ${comp.componentCandyCost} 顆`);
  }
  for (const req of change.requiredCinematicMoves || []) {
    for (const move of req.requiredMoves) lines.push(`須學會${moveZh.get(move) || move}`);
  }
  return lines;
}

async function buildForms(gm, t, dexByName) {
  const moveZh = new Map();
  for (const tpl of gm) {
    const m = tpl.templateId.match(/^V(\d{4})_MOVE_(.+)$/);
    const zh = m && t(`move_name_${m[1]}`);
    if (zh) moveZh.set(m[2].replace(/_FAST$/, ""), zh);
  }

  const bySpecies = new Map();
  for (const tpl of gm) {
    const ps = tpl.data.pokemonSettings;
    const m = tpl.templateId.match(/^V(\d{4})_POKEMON_/);
    if (!ps || !m || !ps.formChange || !ps.form) continue;
    const dex = Number(m[1]);
    if (!bySpecies.has(dex)) bySpecies.set(dex, []);
    bySpecies.get(dex).push(ps);
  }

  const out = {};
  for (const [dex, templates] of [...bySpecies].sort((a, b) => a[0] - b[0])) {
    const order = [];
    const add = (form) => !order.includes(form) && order.push(form);
    templates.forEach((ps) => add(ps.form));
    templates.forEach((ps) => ps.formChange.forEach((c) => c.availableForm.forEach(add)));

    const forms = [];
    for (const form of order) {
      const api = await pokeapiForm(form);
      const sprite = api?.sprites?.front_default?.split("/sprites/pokemon/")[1]?.replace(/\.png$/, "") || null;
      const i18n = t(`form_${form}`);
      const apiZh = api && (api.names.find((n) => n.language.name === "zh-hant")?.name || api.form_names.find((n) => n.language.name === "zh-hant")?.name);
      forms.push({ id: form, zh: (hasCjk(i18n) ? i18n : apiZh || i18n || form).replace(/的樣子/g, ""), sprite: sprite || String(dex) });
    }
    forms.sort((a, b) => (b.sprite === String(dex)) - (a.sprite === String(dex)));
    const zhOf = (form) => forms.find((f) => f.id === form).zh;

    const to = {};
    for (const ps of templates) {
      for (const change of ps.formChange) {
        const described = describeFormChange(change, t, dexByName, moveZh);
        const lines = described.length ? described : ["免費變回"];
        for (const target of change.availableForm) {
          if (!to[target]) to[target] = [];
          to[target].push({ from: zhOf(ps.form), lines });
        }
      }
    }
    for (const target of Object.keys(to)) {
      const conditions = new Set(to[target].map((o) => o.lines.join("/")));
      if (conditions.size === 1) {
        to[target] = [{ lines: to[target][0].lines }];
        continue;
      }
      const bestByFrom = new Map();
      for (const o of to[target]) {
        const prev = bestByFrom.get(o.from);
        if (!prev || o.lines.length > prev.lines.length) bestByFrom.set(o.from, o);
      }
      to[target] = [...bestByFrom.values()];
      if (to[target].length === 1) to[target] = [{ lines: to[target][0].lines }];
    }
    out[dex] = { forms, to };
  }
  return out;
}

async function main() {
  const gm = await load(SOURCES.gameMaster, "game_master.json");
  const t = textLookup(await load(SOURCES.texts, "i18n_chinesetraditional.json"));

  const quests = new Map();
  const dexByName = new Map();
  for (const tpl of gm) {
    const q = tpl.data.evolutionQuestTemplate;
    if (q) quests.set(tpl.templateId, q);
    const ps = tpl.data.pokemonSettings;
    const m = tpl.templateId.match(/^V(\d{4})_POKEMON_/);
    if (ps && m && !ps.form) dexByName.set(ps.pokemonId, Number(m[1]));
  }

  const byTarget = new Map();
  const regional = new Map();
  for (const tpl of gm) {
    const ps = tpl.data.pokemonSettings;
    const m = tpl.templateId.match(/^V(\d{4})_POKEMON_/);
    if (!ps || !m || !ps.evolutionBranch) continue;
    const from = Number(m[1]);
    const rank = !ps.form ? 0 : ps.form.endsWith("_NORMAL") ? 1 : 2;
    for (const branch of ps.evolutionBranch) {
      if (!branch.evolution) continue;
      const to = dexByName.get(branch.evolution);
      if (!to || to === from) continue;
      const lines = describe(branch, quests, t);
      const region = rank === 2 && Object.keys(REGION_ZH).find((r) => ps.form.split("_").includes(r));
      if (region) {
        if (!regional.has(to)) regional.set(to, []);
        regional.get(to).push({ from, form: REGION_ZH[region], lines: [...lines] });
        lines.unshift(`限${REGION_ZH[region]}`);
      }
      const option = { from, lines };
      const formName =
        branch.form && (t(`form_${branch.form}`) || t(`form_${branch.form.split("_").slice(1).join("_")}`));
      if (formName?.trim() && !branch.genderRequirement) option.form = formName.trim().replace(/的樣子/g, "");
      const entry = byTarget.get(to);
      if (!entry || rank < entry.rank) byTarget.set(to, { rank, options: [option] });
      else if (rank === entry.rank) entry.options.push(option);
    }
  }

  for (const [to, entry] of byTarget) {
    if (entry.rank === 2 || !regional.has(to)) continue;
    const baseConditions = new Set(entry.options.map((o) => o.lines.join("/")));
    for (const option of regional.get(to)) {
      if (!baseConditions.has(option.lines.join("/"))) entry.options.push(option);
    }
  }

  const out = {};
  for (const [to, { options }] of [...byTarget].sort((a, b) => a[0] - b[0])) {
    const seen = new Set();
    out[to] = options.filter((o) => {
      const key = `${o.from}|${o.form || ""}|${o.lines.join("/")}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const genderLines = new Set(["限雄性", "限雌性"]);
    const withoutGender = out[to].map((o) => o.lines.filter((l) => !genderLines.has(l)).join("/"));
    const genders = new Set(out[to].flatMap((o) => o.lines.filter((l) => genderLines.has(l))));
    if (genders.size === 2 && new Set(withoutGender).size === 1) {
      out[to] = [{ from: out[to][0].from, lines: out[to][0].lines.filter((l) => !genderLines.has(l)) }];
    }
    const forms = new Set(out[to].map((o) => o.form || ""));
    const conditions = new Set(out[to].map((o) => o.lines.join("/")));
    if (conditions.size === 1) out[to] = [{ from: out[to][0].from, lines: out[to][0].lines }];
    else if (forms.size === 1) out[to].forEach((o) => delete o.form);
    else if (forms.has("")) out[to].forEach((o) => (o.form ||= "一般"));
  }

  writeFileSync(
    OUT,
    JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), source: "PokeMiners game_masters", byTarget: out })
  );
  const formsOut = await buildForms(gm, t, dexByName);
  writeFileSync(FORMS_OUT, JSON.stringify(formsOut));
  console.log(`targets ${Object.keys(out).length}, quests ${quests.size}, form-change species ${Object.keys(formsOut).length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
