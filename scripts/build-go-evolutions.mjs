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
  textsEn: "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Texts/Latest%20APK/JSON/i18n_english.json",
};

const ITEM_OVERRIDE = { ITEM_OTHER_EVOLUTION_STONE_A: ["索財靈的硬幣", "Gimmighoul Coin"] };
const TEMP_EVO_SUFFIX = {
  TEMP_EVOLUTION_MEGA: "_mega",
  TEMP_EVOLUTION_MEGA_X: "_mega_x",
  TEMP_EVOLUTION_MEGA_Y: "_mega_y",
  TEMP_EVOLUTION_PRIMAL: "_primal",
};
const REGION_ZH = { ALOLA: "阿羅拉", GALARIAN: "伽勒爾", HISUIAN: "洗翠", PALDEA: "帕底亞" };
const REGION_EN = { ALOLA: "Alolan", GALARIAN: "Galarian", HISUIAN: "Hisuian", PALDEA: "Paldean" };
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
const LURE_WEATHER = { ITEM_TROY_DISK_RAINY: ["雨天", "rain"] };
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

const zhKey = (lines) => lines.map(([zh]) => zh).join("/");

function textLookup(raw) {
  const pairs = raw.data;
  const map = new Map();
  for (let i = 0; i < pairs.length; i += 2) map.set(pairs[i].toLowerCase(), pairs[i + 1]);
  return (key) => map.get(key.toLowerCase());
}

function questTypes(goal, T) {
  for (const c of goal.condition || []) {
    const list = c.withPokemonType?.pokemonType || c.withOpponentPokemonBattleStatus?.opponentPokemonType;
    if (list) {
      const keys = list.map((x) => x.replace("POKEMON_TYPE_", "pokemon_type_"));
      return [keys.map((k) => T.zh(k) || k).join("/"), keys.map((k) => T.en(k) || k).join("/")];
    }
  }
  return ["", ""];
}

function questText(quest, T) {
  const goal = quest.goals[0];
  const n = goal.target;
  const [types, typesEn] = questTypes(goal, T);
  const combat = goal.condition?.find((c) => c.withCombatType)?.withCombatType.combatType || [];
  const max = combat.some((x) => x.includes("MAX"));
  const where = max ? "在團體戰或極巨對戰" : combat.length ? "在團體戰" : "";
  const whereEn = max ? " in raids or Max Battles" : combat.length ? " in raids" : "";
  switch (quest.questType) {
    case "QUEST_CATCH_POKEMON":
      return [`設為夥伴捕捉 ${n} 隻${types}屬性`, `Catch ${n} ${typesEn}-type with it as buddy`];
    case "QUEST_FIGHT_POKEMON":
    case "QUEST_COMPLETE_BATTLE":
      return [`設為夥伴${where}戰勝 ${n} 隻${types}屬性`, `Defeat ${n} ${typesEn}-type${whereEn} as buddy`];
    case "QUEST_COMPLETE_RAID_BATTLE":
      return [`設為夥伴在團體戰獲勝 ${n} 次`, `Win ${n} raids as buddy`];
    case "QUEST_BUDDY_EVOLUTION_WALK":
      return [`和夥伴步行 ${n} 公里`, `Walk ${n} km as buddy`];
    case "QUEST_BUDDY_EARN_AFFECTION_POINTS":
      return [`和夥伴獲得 ${n} 顆心心`, `Earn ${n} hearts as buddy`];
    case "QUEST_BUDDY_FEED":
      return [`餵夥伴 ${n} 次點心`, `Feed ${n} treats as buddy`];
    case "QUEST_LAND_THROW":
      return [`設為夥伴投出 ${n} 次 Excellent`, `Make ${n} Excellent throws as buddy`];
    case "QUEST_USE_INCENSE":
      return n > 1 ? [`設為夥伴使用 ${n} 個薰香`, `Use ${n} Incense as buddy`] : ["設為夥伴使用薰香", "Use Incense as buddy"];
    default:
      return null;
  }
}

function describe(branch, quests, T) {
  const lines = [];
  if (branch.candyCost) lines.push([`${branch.candyCost} 顆糖果`, `${branch.candyCost} Candy`]);
  if (branch.evolutionItemRequirement) {
    const key = branch.evolutionItemRequirement;
    const [zh, en] = ITEM_OVERRIDE[key] || [T.zh(`${key}_name`) || key, T.en(`${key}_name`) || key];
    const cost = branch.evolutionItemRequirementCost;
    lines.push(cost ? [`${zh} ×${cost}`, `${en} ×${cost}`] : [zh, en]);
  }
  if (branch.lureItemRequirement) {
    const key = branch.lureItemRequirement;
    const lure = (T.zh(`${key}_name`) || key).replace("誘餌模組", "模組");
    const lureEn = (T.en(`${key}_name`) || key).replace(" Lure Module", " Lure");
    const weather = LURE_WEATHER[key];
    lines.push(weather ? [`${lure}或${weather[0]}`, `${lureEn} or ${weather[1]}`] : [lure, lureEn]);
  }
  if (branch.genderRequirement) lines.push(branch.genderRequirement === "MALE" ? ["限雄性", "Male only"] : ["限雌性", "Female only"]);
  if (branch.onlyDaytime) lines.push(["限白天", "Daytime only"]);
  if (branch.onlyNighttime) lines.push(["限夜晚", "Nighttime only"]);
  if (branch.onlyDuskPeriod) lines.push(["限黃昏", "Dusk only"]);
  if (branch.onlyFullMoon) lines.push(["限滿月", "Full moon only"]);
  if (branch.onlyUpsideDown) lines.push(["手機上下顛倒時進化", "Turn your phone upside down"]);

  const questIds = (branch.questDisplay || []).map((q) => q.questRequirementTemplateId);
  const questLines = questIds.map((id) => quests.get(id)).filter(Boolean);
  for (const quest of questLines) {
    const text = questText(quest, T);
    if (!text) continue;
    lines.push(text);
  }
  if (!questLines.some((q) => q.questType === "QUEST_BUDDY_EVOLUTION_WALK") && branch.kmBuddyDistanceRequirement) {
    const km = branch.kmBuddyDistanceRequirement;
    lines.push([`和夥伴步行 ${km} 公里`, `Walk ${km} km as buddy`]);
  }
  if (branch.mustBeBuddy && !lines.some(([zh]) => zh.includes("夥伴"))) lines.push(["須設為夥伴", "Must be your buddy"]);
  if (branch.noCandyCostViaTrade) lines.push(["交換後進化免糖果", "No Candy cost if traded"]);
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

function describeFormChange(change, T, dexByName, moveNames) {
  const comp = change.componentPokemonSettings;
  const compKey = comp && `pokemon_name_${String(dexByName.get(comp.pokedexId)).padStart(4, "0")}`;
  const compZh = comp && T.zh(compKey);
  const compEn = comp && T.en(compKey);
  if (comp?.formChangeType === "UNFUSE") return [[`解除與${compZh}的合體`, `Unfuse from ${compEn}`]];
  const lines = [];
  if (change.candyCost) lines.push([`${change.candyCost} 顆糖果`, `${change.candyCost} Candy`]);
  if (change.stardustCost) lines.push([`${change.stardustCost} 星星沙子`, `${change.stardustCost} Stardust`]);
  if (change.item) {
    const key = `${change.item}_name`;
    lines.push([`${T.zh(key) || change.item} ×${change.itemCostCount}`, `${T.en(key) || change.item} ×${change.itemCostCount}`]);
  }
  if (comp?.formChangeType === "FUSE") {
    lines.push([`與${compZh}合體`, `Fuse with ${compEn}`]);
    if (comp.componentCandyCost) lines.push([`${compZh}的糖果 ${comp.componentCandyCost} 顆`, `${comp.componentCandyCost} ${compEn} Candy`]);
  }
  for (const req of change.requiredCinematicMoves || []) {
    for (const move of req.requiredMoves) {
      const [zh, en] = moveNames.get(move) || [move, move];
      lines.push([`須學會${zh}`, `Must know ${en}`]);
    }
  }
  return lines;
}

async function buildForms(gm, T, dexByName) {
  const moveNames = new Map();
  for (const tpl of gm) {
    const m = tpl.templateId.match(/^V(\d{4})_MOVE_(.+)$/);
    const zh = m && T.zh(`move_name_${m[1]}`);
    if (zh) moveNames.set(m[2].replace(/_FAST$/, ""), [zh, T.en(`move_name_${m[1]}`) || zh]);
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
      const i18n = T.zh(`form_${form}`);
      const apiName = (lang) => api && (api.names.find((n) => n.language.name === lang)?.name || api.form_names.find((n) => n.language.name === lang)?.name);
      forms.push({
        id: form,
        zh: (hasCjk(i18n) ? i18n : apiName("zh-hant") || i18n || form).replace(/的樣子/g, ""),
        en: T.en(`form_${form}`) || apiName("en") || form,
        sprite: sprite || String(dex),
      });
    }
    forms.sort((a, b) => (b.sprite === String(dex)) - (a.sprite === String(dex)));
    const nameOf = (form) => forms.find((f) => f.id === form);

    const to = {};
    for (const ps of templates) {
      for (const change of ps.formChange) {
        const described = describeFormChange(change, T, dexByName, moveNames);
        const lines = described.length ? described : [["免費變回", "Free to change back"]];
        for (const target of change.availableForm) {
          if (!to[target]) to[target] = [];
          to[target].push({ from: nameOf(ps.form), lines });
        }
      }
    }
    const split = (o) => ({
      ...(o.from ? { from: o.from.zh, fromEn: o.from.en } : {}),
      lines: o.lines.map(([zh]) => zh),
      en: o.lines.map(([, en]) => en),
    });
    for (const target of Object.keys(to)) {
      const conditions = new Set(to[target].map((o) => o.lines.map(([zh]) => zh).join("/")));
      if (conditions.size === 1) {
        to[target] = [split({ lines: to[target][0].lines })];
        continue;
      }
      const bestByFrom = new Map();
      for (const o of to[target]) {
        const prev = bestByFrom.get(o.from.id);
        if (!prev || o.lines.length > prev.lines.length) bestByFrom.set(o.from.id, o);
      }
      const best = [...bestByFrom.values()];
      to[target] = best.length === 1 ? [split({ lines: best[0].lines })] : best.map(split);
    }
    out[dex] = { forms, to };
  }
  return out;
}

async function main() {
  const gm = await load(SOURCES.gameMaster, "game_master.json");
  const t = textLookup(await load(SOURCES.texts, "i18n_chinesetraditional.json"));
  const T = { zh: t, en: textLookup(await load(SOURCES.textsEn, "i18n_english.json")) };

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
  const megas = new Map();
  for (const tpl of gm) {
    const ps = tpl.data.pokemonSettings;
    const m = tpl.templateId.match(/^V(\d{4})_POKEMON_/);
    if (!ps || !m || !ps.evolutionBranch) continue;
    const from = Number(m[1]);
    const rank = !ps.form ? 0 : ps.form.endsWith("_NORMAL") ? 1 : 2;
    for (const branch of ps.evolutionBranch) {
      if (branch.temporaryEvolution && rank < 2) {
        if (!megas.has(from)) megas.set(from, new Map());
        const goId = `${ps.pokemonId.toLowerCase()}${TEMP_EVO_SUFFIX[branch.temporaryEvolution]}`;
        megas.get(from).set(goId, {
          goId,
          cost: branch.temporaryEvolutionEnergyCost,
          next: branch.temporaryEvolutionEnergyCostSubsequent,
        });
      }
      if (!branch.evolution) continue;
      const to = dexByName.get(branch.evolution);
      if (!to || to === from) continue;
      const lines = describe(branch, quests, T);
      const region = rank === 2 && Object.keys(REGION_ZH).find((r) => ps.form.split("_").includes(r));
      if (region) {
        if (!regional.has(to)) regional.set(to, []);
        regional.get(to).push({ from, form: [REGION_ZH[region], REGION_EN[region]], lines: [...lines] });
        lines.unshift([`限${REGION_ZH[region]}`, `${REGION_EN[region]} form only`]);
      }
      const option = { from, lines };
      const formKey = branch.form && [`form_${branch.form}`, `form_${branch.form.split("_").slice(1).join("_")}`];
      const formName = formKey && (t(formKey[0]) || t(formKey[1]));
      if (formName?.trim() && !branch.genderRequirement) {
        option.form = [formName.trim().replace(/的樣子/g, ""), (T.en(formKey[0]) || T.en(formKey[1]) || formName).trim()];
      }
      const entry = byTarget.get(to);
      if (!entry || rank < entry.rank) byTarget.set(to, { rank, options: [option] });
      else if (rank === entry.rank) entry.options.push(option);
    }
  }

  for (const [to, entry] of byTarget) {
    if (entry.rank === 2 || !regional.has(to)) continue;
    const baseConditions = new Set(entry.options.map((o) => zhKey(o.lines)));
    for (const option of regional.get(to)) {
      if (!baseConditions.has(zhKey(option.lines))) entry.options.push(option);
    }
  }

  const out = {};
  for (const [to, { options }] of [...byTarget].sort((a, b) => a[0] - b[0])) {
    const seen = new Set();
    let list = options.filter((o) => {
      const key = `${o.from}|${o.form?.[0] || ""}|${zhKey(o.lines)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const genderLines = new Set(["限雄性", "限雌性"]);
    const notGender = ([zh]) => !genderLines.has(zh);
    const withoutGender = list.map((o) => zhKey(o.lines.filter(notGender)));
    const genders = new Set(list.flatMap((o) => o.lines.filter((l) => !notGender(l)).map(([zh]) => zh)));
    if (genders.size === 2 && new Set(withoutGender).size === 1) {
      list = [{ from: list[0].from, lines: list[0].lines.filter(notGender) }];
    }
    const forms = new Set(list.map((o) => o.form?.[0] || ""));
    const conditions = new Set(list.map((o) => zhKey(o.lines)));
    if (conditions.size === 1) list = [{ from: list[0].from, lines: list[0].lines }];
    else if (forms.size === 1) list.forEach((o) => delete o.form);
    else if (forms.has("")) list.forEach((o) => (o.form ||= ["一般", "Normal"]));
    out[to] = list.map((o) => ({
      from: o.from,
      lines: o.lines.map(([zh]) => zh),
      en: o.lines.map(([, en]) => en),
      ...(o.form ? { form: o.form[0], formEn: o.form[1] } : {}),
    }));
  }

  writeFileSync(
    OUT,
    JSON.stringify({
      generatedAt: new Date().toISOString().slice(0, 10),
      source: "PokeMiners game_masters",
      byTarget: out,
      megas: Object.fromEntries([...megas].sort((a, b) => a[0] - b[0]).map(([dex, m]) => [dex, [...m.values()]])),
    })
  );
  const formsOut = await buildForms(gm, T, dexByName);
  writeFileSync(FORMS_OUT, JSON.stringify(formsOut));
  console.log(`targets ${Object.keys(out).length}, mega species ${megas.size}, quests ${quests.size}, form-change species ${Object.keys(formsOut).length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
