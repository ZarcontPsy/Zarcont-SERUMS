/* Extrae la campaña y el catálogo RPG originales para empaquetarlos en el juego voxel. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const gameRoot = path.resolve(__dirname, '..', '..');
const workspaceRoot = path.resolve(gameRoot, '..');
const outDir = path.resolve(__dirname, '..', 'src');

global.window = global;
global.structuredClone = (value) => JSON.parse(JSON.stringify(value));
global.STUDY_CONTENT = { version: '2.5.0', sheets: [], topics: [], sources: [] };
global.StudyTaxonomy = null;

function load(base, rel) {
  const file = path.join(base, rel);
  vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: file });
}

load(workspaceRoot, 'EXAMEN STUDIO/datos/banco-oficial.js');
load(workspaceRoot, 'study-data/temario.js');
load(workspaceRoot, 'study-shared/taxonomy.js');
load(gameRoot, 'data/quest-map.js');
load(gameRoot, 'js/config.js');
load(gameRoot, 'js/util.js');
load(gameRoot, 'js/progression.js');
load(gameRoot, 'js/characters.js');
load(gameRoot, 'js/content.js');

QuestContent.build();
const catalog = QuestContent.catalog;
const C = window.QUEST_CONFIG;
const chars = window.QuestCharacters;

const areas = C.areas.map((id) => {
  const meta = C.areaMeta[id];
  const route = QuestContent.getAreaRoute(id);
  return {
    id,
    short: meta.short,
    title: meta.title,
    accent: meta.accent,
    blurb: meta.blurb,
    icon: meta.icon,
    missions: route.missions.map((m) => m.id),
    boss: route.boss ? route.boss.id : null
  };
});

function missionPayload(m) {
  return {
    id: m.id,
    kind: m.kind,
    areaId: m.areaId,
    areaShort: m.areaShort,
    areaTitle: m.areaTitle,
    accent: m.accent,
    index: m.index,
    title: m.title,
    subtitle: m.subtitle,
    description: m.description,
    tier: m.tier,
    tierLabel: m.tierLabel,
    feedback: m.feedback,
    questionIds: m.questionIds,
    questionCount: m.questionCount,
    estimatedMinutes: m.estimatedMinutes,
    rewards: m.rewards,
    unlock: m.unlock
  };
}

const missions = catalog.all.map(missionPayload);
const usedIds = [];
for (const m of catalog.all) for (const id of m.questionIds) if (!usedIds.includes(id)) usedIds.push(id);

const questions = {};
for (const id of usedIds) {
  const q = QuestContent.getQuestion(id);
  if (!q) throw new Error('Pregunta no encontrada: ' + id);
  questions[id] = {
    id: q.id,
    areaId: q.areaId,
    stem: q.stem,
    options: q.options.map((o) => ({ id: o.id, text: o.text })),
    answer: q.answer,
    examTitle: q.examTitle,
    cycle: q.cycle,
    page: q.page,
    complexity: q.complexity,
    confidence: q.confidence
  };
}

const cosmeticCategories = C.rpg.slots.map((s) => ({ id: s.id, label: s.label }));
const characterCatalog = chars.characters.map((c) => ({
  id: c.id,
  name: c.name,
  title: c.title,
  personality: c.personality,
  rarity: c.rarity,
  rarityLabel: c.rarityLabel,
  price: c.price,
  areaAffinity: c.areaAffinity,
  access: c.access,
  quote: c.quote,
  description: c.description,
  attributes: c.attributes,
  signature: c.signature,
  slots: c.slotIds
}));
const cosmeticCatalog = chars.cosmetics.map((c) => ({
  id: c.id,
  name: c.name,
  description: c.description,
  category: c.category,
  rarity: c.rarity,
  rarityLabel: c.rarityLabel,
  price: c.price,
  compatibleCharacterIds: c.compatibleCharacterIds,
  unlockRequirements: c.unlockRequirements
}));
const achievements = C.achievements.map((a) => ({
  id: a.id,
  name: a.name,
  description: a.description,
  xp: a.xp,
  coins: a.coins,
  metric: a.metric,
  target: a.target
}));

const payload = {
  meta: {
    source: 'SERUMS QUEST 1.2.0',
    generatedAt: new Date().toISOString(),
    questionCount: usedIds.length,
    missionCount: catalog.missionList.length,
    bossCount: catalog.bossList.length,
    areaCount: areas.length,
    note: 'Preguntas oficiales de Psicología empaquetadas para la campaña. Sin PDFs ni fichas externas.'
  },
  areas,
  missions,
  questions,
  characters: characterCatalog,
  cosmetics: cosmeticCatalog,
  cosmeticCategories,
  achievements,
  rules: {
    levelBase: C.levels.base,
    levelLinear: C.levels.linear,
    levelQuadratic: C.levels.quadratic,
    maxLevel: C.levels.maxLevel,
    passMission: C.pass.mission,
    passBoss: 0.7,
    recovery: C.recovery,
    xp: C.xp,
    coins: C.coins,
    stages: C.stages,
    stageRules: C.stageRules,
    ranks: C.ranks
  }
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'campaign.json'), JSON.stringify(payload, null, 2));
console.log(JSON.stringify({
  areas: areas.length,
  missions: catalog.missionList.length,
  bosses: catalog.bossList.length,
  questions: usedIds.length,
  characters: characterCatalog.length,
  cosmetics: cosmeticCatalog.length,
  bytes: fs.statSync(path.join(outDir, 'campaign.json')).size
}, null, 2));
