'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const project = path.resolve(__dirname, '..');
const src = path.resolve(__dirname, 'src');
const v2dir = path.resolve(__dirname, 'v2');
const campaign = JSON.parse(fs.readFileSync(path.join(project, 'src', 'campaign.json'), 'utf8'));
const extras = JSON.parse(fs.readFileSync(path.join(project, 'src', 'extras.json'), 'utf8'));
const modes = JSON.parse(fs.readFileSync(path.join(project, 'src', 'modes.json'), 'utf8'));
campaign.achievements = campaign.achievements.concat(modes.achievements);
campaign.meta.achievementCount = campaign.achievements.length;

const v23CssCandidates = ['part11-v23-anchors.css', 'part12-v23-visor.css', 'part13-v23-shop.css', 'part14-v23-welcome.css', 'part15-v23-integration.css', 'part16-v23b-cinema.css'];
const v23CssOnly = (process.env.GAME_CSS_ONLY || '').split(',').map((s) => s.trim()).filter(Boolean);
function allowV23(name) {
  if (!/^part1[1-5]-v23(?:-|\.)/.test(name)) return true;
  if (!v23CssOnly.length) return true;
  return v23CssOnly.some((only) => name.indexOf(only) === 0);
}
const optionalCss = ['part5-heroes.css', 'part5-feedback.css', 'part5-assets.css', 'part6-world.css', 'part7-duel.css', 'part8-summary.css', 'part9-perf.css', 'part10-v22.css']
  .concat(v23CssCandidates)
  .filter((name) => allowV23(name))
  .map((name) => path.join(src, name))
  .filter((file) => fs.existsSync(file));
const css = [
  'styles.css', 'part3e-cosmetics.css', 'part3g-map.css', 'part3i-modes.css',
  'part3k-learning.css', 'part3n-final.css'
].map((name) => fs.readFileSync(path.join(src, name), 'utf8'))
  .concat(optionalCss.map((file) => fs.readFileSync(file, 'utf8')))
  .join('\n');

// Fase 3: compatibilidad abierta a los diez hÃ©roes y catÃ¡logo ampliado.
const allHeroIds = campaign.characters.map((c) => c.id);
const originalCatalog = campaign.cosmetics.map((c) => Object.assign({}, c, {
  compatibleCharacterIds: allHeroIds.slice(),
  isExtra: false
}));
const extraCatalog = extras.cosmetics.map((c) => Object.assign({}, c, {
  compatibleCharacterIds: allHeroIds.slice(),
  isExtra: true,
  shopAvailable: false
}));
campaign.cosmeticCategories = campaign.cosmeticCategories.concat(extras.categories);
campaign.cosmetics = originalCatalog.concat(extraCatalog);
campaign.meta.cosmeticCount = campaign.cosmetics.length;
campaign.meta.originalCosmeticCount = originalCatalog.length;
campaign.meta.extraCosmeticCount = extraCatalog.length;

/* -------------------------------------------------------------------------
   V2 Â· contenido de Study Dashboard y Study Flashcards
   El Agente 4 entrega preguntas normalizadas y explicaciones de las originales.
   La campaÃ±a original nunca se sobrescribe: solo se completa su explicaciÃ³n.
   ------------------------------------------------------------------------- */
function readOptionalJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; }
}
const contentV2 = readOptionalJson(path.join(project, 'src', 'content-v2.json'), null)
  || readOptionalJson(path.join(v2dir, 'questions-v2.json'), { questions: [] });
const questionList = Array.isArray(contentV2) ? contentV2 : (contentV2.questions || contentV2.bank || []);
const explanationMap = readOptionalJson(path.join(project, 'src', 'explanations-original.json'), null)
  || readOptionalJson(path.join(v2dir, 'explanations-original.json'), {});

function complexityForDifficulty(value) {
  if (value === 'alta') return 35;
  if (value === 'media') return 25;
  return 18;
}
function difficultyForComplexity(value) {
  const n = Number(value) || 0;
  if (n >= 32) return 'alta';
  if (n >= 22) return 'media';
  return 'base';
}
function normalizeOptionList(options) {
  if (!Array.isArray(options)) return [];
  return options.map((opt, index) => {
    if (opt && typeof opt === 'object') {
      return { id: String(opt.id || String.fromCharCode(65 + index)), text: String(opt.text || '').trim() };
    }
    return { id: String.fromCharCode(65 + index), text: String(opt || '').trim() };
  }).filter((opt) => opt.text);
}

const sourceCounts = { campaign: 0, dashboard: 0, flashcards: 0 };
let addedQuestions = 0;
let skippedQuestions = 0;
const seenQuestionIds = new Set();

Object.keys(campaign.questions).forEach((id) => {
  const q = campaign.questions[id];
  seenQuestionIds.add(id);
  sourceCounts.campaign += 1;
  q.source = 'campaign';
  q.origin = q.origin || q.examTitle || 'PsicologÃ­a Â· SERUMS';
  q.difficulty = q.difficulty || difficultyForComplexity(q.complexity);
  q.tags = Array.isArray(q.tags) ? q.tags : [];
  q.generated = false;
  q.confidence = q.confidence || 'alta';
  if (!q.explanation) {
    const extra = explanationMap && explanationMap[id];
    if (extra && extra.explanation) {
      q.explanation = String(extra.explanation);
      q.explanationGenerated = extra.explanationGenerated !== false;
      if (Array.isArray(extra.tags) && !q.tags.length) q.tags = extra.tags;
      if (extra.difficulty) q.difficulty = extra.difficulty;
    }
  } else {
    q.explanationGenerated = !!q.explanationGenerated;
  }
});

questionList.forEach((raw) => {
  if (!raw || !raw.id || seenQuestionIds.has(raw.id)) { skippedQuestions += 1; return; }
  const options = normalizeOptionList(raw.options);
  const answer = String(raw.answer || raw.clave || '').toUpperCase();
  if (options.length < 2 || !options.some((opt) => opt.id === answer)) { skippedQuestions += 1; return; }
  const out = Object.assign({}, raw);
  out.id = String(raw.id);
  out.areaId = String(raw.areaId || raw.area || '');
  out.stem = String(raw.stem || raw.enunciado || '').trim();
  out.options = options;
  out.answer = answer;
  out.examTitle = raw.examTitle || raw.origin || 'Banco de estudio';
  out.cycle = raw.cycle || '2026-II';
  out.page = raw.page == null ? null : raw.page;
  out.complexity = Number(raw.complexity) || complexityForDifficulty(raw.difficulty);
  out.confidence = raw.confidence || 'media';
  out.source = raw.source || (out.id.indexOf('v2-fc') === 0 ? 'flashcards' : out.id.indexOf('v2-dash') === 0 ? 'dashboard' : 'campaign');
  out.origin = String(raw.origin || out.examTitle);
  out.explanation = String(raw.explanation || '').trim();
  out.explanationGenerated = raw.explanationGenerated !== false;
  out.difficulty = raw.difficulty || difficultyForComplexity(out.complexity);
  out.tags = Array.isArray(raw.tags) ? raw.tags.map(String) : [];
  out.generated = !!raw.generated;
  if (!out.stem || !out.explanation) { skippedQuestions += 1; return; }
  campaign.questions[out.id] = out;
  seenQuestionIds.add(out.id);
  sourceCounts[out.source] = (sourceCounts[out.source] || 0) + 1;
  addedQuestions += 1;
});

campaign.meta.questionCount = Object.keys(campaign.questions).length;
campaign.meta.sourceCounts = sourceCounts;
campaign.meta.note = 'Banco combinado V2: campaÃ±a de PsicologÃ­a + fichas de Study Dashboard + tarjetas de Study Flashcards. Las preguntas de ficha y las tarjetas abiertas convertidas estÃ¡n marcadas como generadas; las claves de las tarjetas cerradas son las de la fuente.';
campaign.meta.v2 = {
  added: addedQuestions,
  skipped: skippedQuestions,
  contentVersion: (contentV2 && contentV2.meta && contentV2.meta.version) || '2.0.0',
  generatedExplanations: Object.keys(campaign.questions).filter((id) => campaign.questions[id].explanationGenerated).length
};

const partCandidates = [
  'part0-v2-core.js',
  'part1-core.js',
  'part2-world.js',
  'part3-ui.js',
  'part3b-cosmetics-core.js',
  'part17a-v23c-core.js',
  'part3c-cosmetics-models.js',
  'part17b-v23c-auras.js',
  'part17c-v23c-motion.js',
  'part17d-v23c-frames.js',
  'part17e-v23c-clothing.js',
  'part17f-v23c-accessories.js',
  'part17g-v23c-gate.js',
  'part3d-cosmetics-ui.js',
  'part3f-map.js',
  'part3h-modes.js',
  'part3j-learning.js',
  'part3m-final.js',
  'part5-combat.js',
  'part5-heroes.js',
  'part5-assets.js',
  'part5-feedback.js',
  'part6-world.js',
  'part7-duel.js',
  'part8-summary.js',
  'part9-perf.js',
  'part4-flow.js',
  'part10-v22.js',
  'part10b-v23-core.js',
  'part11-v23-anchors.js',
  'part12-v23-visor.js',
  'part13-v23-shop.js',
  'part14-v23-welcome.js',
  'part15-v23-integration.js',
  'part16-v23b-cinema.js'
];
const v23JsOnly = (process.env.GAME_PARTS_ONLY || '').split(',').map((s) => s.trim()).filter(Boolean);
function allowV23Js(name) {
  if (!/^part1[1-5]-v23(?:-|\.)/.test(name)) return true;
  if (!v23JsOnly.length) return true;
  return v23JsOnly.some((only) => name.indexOf(only) === 0);
}
const parts = partCandidates
  .filter((name) => allowV23Js(name))
  .filter((name) => fs.existsSync(path.join(src, name)))
  .map((name) => ({ name: name, code: fs.readFileSync(path.join(src, name), 'utf8') }));

function safeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

const header = '/* SERUMS QUEST â€” OBSERVATORIO DE LAS CINCO RUTAS\n' +
  '   V2.3 Â· Fase 2 Â· cosmÃ©ticos con estÃ¡ndar reforzado.\n' +
  '   Generado desde src/campaign.json, src/extras.json, src/content-v2.json y .work/src.\n' +
  '   No editar a mano: cambia las fuentes y ejecuta .work/build-game.js. */\n' +
  'var CAMPAIGN_DATA = ' + safeJson(campaign) + ';\n' +
  'var STYLE_CSS = ' + safeJson(css) + ';\n' +
  '(function () {\n\'use strict\';\n';
const footer = '\n})();\n';
const code = header + parts.map((part) => part.code).join('\n') + footer;
const outFile = process.env.GAME_OUT ? path.resolve(process.env.GAME_OUT) : path.join(project, 'game.js');
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, code);
console.log('game.js bytes:', Buffer.byteLength(code));
console.log('out:', outFile);
console.log('parts:', parts.map((p) => p.name).join(', '));
console.log('questions:', campaign.meta.questionCount, JSON.stringify(sourceCounts), 'added', addedQuestions, 'skipped', skippedQuestions);
console.log('explanations generated:', campaign.meta.v2.generatedExplanations);
try {
  execFileSync(process.execPath, ['--check', outFile], { stdio: 'inherit' });
  console.log('node --check: OK');
} catch (error) {
  process.exitCode = 1;
}

