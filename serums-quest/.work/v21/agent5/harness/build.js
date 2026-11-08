'use strict';
/* Agente 5 · harness local del selector de héroes.
   Reproduce la concatenación de .work/build-game.js SIN escribir game.js ni dist/:
   toma three.js y window.GAME del dist vigente y recompone CSS + partes en un HTML
   de pruebas dentro de .work/v21/agent5/. No se integra en el build. */
const fs = require('fs');
const path = require('path');

const harnessDir = __dirname;
const project = path.resolve(harnessDir, '..', '..', '..', '..'); // serums-quest
const src = path.join(project, '..', '.work', 'src');
const workSrc = path.join(project, '.work', 'src');
const distFile = path.join(project, 'dist', 'index.html');

const dist = fs.readFileSync(distFile, 'utf8');
const scriptOpen = /<script/g;
const scriptPos = [];
let m;
while ((m = scriptOpen.exec(dist))) scriptPos.push(m.index);
if (scriptPos.length < 3) throw new Error('dist/index.html inesperado: faltan scripts');
const seg = (start, end) => dist.slice(start, end);
const tagStart = (index) => dist.indexOf('>', scriptPos[index]) + 1;
const tagEnd = (index) => dist.indexOf('</script>', tagStart(index));
const threeCode = seg(tagStart(0), tagEnd(0));
const gameCode = seg(tagStart(1), tagEnd(1));

const gameMatch = /^\s*window\.GAME=([\s\S]*);\s*$/.exec(gameCode);
if (!gameMatch) throw new Error('No se pudo leer window.GAME del dist');
const game = JSON.parse(gameMatch[1]);
game.rules = game.rules || {};
game.rules.devScreen = 'heroes';
game.rules.devQuality = 'alto';
game.rules.devSkipTutorial = true;
delete game.rules.devOwnAllCosmetics;

/* Misma transformación de campaña que .work/build-game.js */
const campaign = JSON.parse(fs.readFileSync(path.join(project, 'src', 'campaign.json'), 'utf8'));
const extras = JSON.parse(fs.readFileSync(path.join(project, 'src', 'extras.json'), 'utf8'));
const modes = JSON.parse(fs.readFileSync(path.join(project, 'src', 'modes.json'), 'utf8'));
campaign.achievements = campaign.achievements.concat(modes.achievements);
campaign.meta.achievementCount = campaign.achievements.length;
const allHeroIds = campaign.characters.map((c) => c.id);
const originalCatalog = campaign.cosmetics.map((c) => Object.assign({}, c, { compatibleCharacterIds: allHeroIds.slice(), isExtra: false }));
const extraCatalog = extras.cosmetics.map((c) => Object.assign({}, c, { compatibleCharacterIds: allHeroIds.slice(), isExtra: true, shopAvailable: false }));
campaign.cosmeticCategories = campaign.cosmeticCategories.concat(extras.categories);
campaign.cosmetics = originalCatalog.concat(extraCatalog);
campaign.meta.cosmeticCount = campaign.cosmetics.length;
campaign.meta.originalCosmeticCount = originalCatalog.length;
campaign.meta.extraCosmeticCount = extraCatalog.length;

function readOptionalJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; }
}
const contentV2 = readOptionalJson(path.join(project, 'src', 'content-v2.json'), null)
  || readOptionalJson(path.join(project, '.work', 'v2', 'questions-v2.json'), { questions: [] });
const questionList = Array.isArray(contentV2) ? contentV2 : (contentV2.questions || contentV2.bank || []);
const explanationMap = readOptionalJson(path.join(project, 'src', 'explanations-original.json'), null)
  || readOptionalJson(path.join(project, '.work', 'v2', 'explanations-original.json'), {});
function complexityForDifficulty(v) { if (v === 'alta') return 35; if (v === 'media') return 25; return 18; }
function difficultyForComplexity(v) { const n = Number(v) || 0; if (n >= 32) return 'alta'; if (n >= 22) return 'media'; return 'base'; }
function normalizeOptionList(options) {
  if (!Array.isArray(options)) return [];
  return options.map((opt, index) => {
    if (opt && typeof opt === 'object') return { id: String(opt.id || String.fromCharCode(65 + index)), text: String(opt.text || '').trim() };
    return { id: String.fromCharCode(65 + index), text: String(opt || '').trim() };
  }).filter((opt) => opt.text);
}
const sourceCounts = { campaign: 0, dashboard: 0, flashcards: 0 };
let addedQuestions = 0; let skippedQuestions = 0;
const seenQuestionIds = new Set();
Object.keys(campaign.questions).forEach((id) => {
  const q = campaign.questions[id];
  seenQuestionIds.add(id); sourceCounts.campaign += 1;
  q.source = 'campaign';
  q.origin = q.origin || q.examTitle || 'Psicología · SERUMS';
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
  } else { q.explanationGenerated = !!q.explanationGenerated; }
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
  out.options = options; out.answer = answer;
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

const optionalCss = ['part5-heroes.css', 'part5-feedback.css', 'part5-assets.css', 'part6-world.css', 'part7-duel.css', 'part8-summary.css', 'part9-perf.css']
  .map((name) => path.join(workSrc, name))
  .filter((file) => fs.existsSync(file));
const css = ['styles.css', 'part3e-cosmetics.css', 'part3g-map.css', 'part3i-modes.css', 'part3k-learning.css', 'part3n-final.css']
  .map((name) => fs.readFileSync(path.join(workSrc, name), 'utf8'))
  .concat(optionalCss.map((file) => fs.readFileSync(file, 'utf8')))
  .join('\n');

const partCandidates = [
  'part0-v2-core.js', 'part1-core.js', 'part2-world.js', 'part3-ui.js',
  'part3b-cosmetics-core.js', 'part3c-cosmetics-models.js', 'part3d-cosmetics-ui.js',
  'part3f-map.js', 'part3h-modes.js', 'part3j-learning.js', 'part3m-final.js',
  'part5-combat.js', 'part5-heroes.js', 'part5-assets.js', 'part5-feedback.js',
  'part6-world.js', 'part7-duel.js', 'part8-summary.js', 'part9-perf.js', 'part4-flow.js'
];
const parts = partCandidates
  .filter((name) => fs.existsSync(path.join(workSrc, name)))
  .map((name) => ({ name, code: fs.readFileSync(path.join(workSrc, name), 'utf8') }));

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}
const header = 'var CAMPAIGN_DATA = ' + safeJson(campaign) + ';\n' +
  'var STYLE_CSS = ' + safeJson(css) + ';\n' +
  '(function () {\n\'use strict\';\n';
const footer = '\n})();\n';
/* Solo en el harness: permite RULES.devScreen (en el juego final está bloqueado). */
const bundle = (header + parts.map((part) => part.code).join('\n') + footer)
  .replace('var FINAL_RELEASE = true;', 'var FINAL_RELEASE = false;');

const driver = fs.readFileSync(path.join(harnessDir, 'driver.js'), 'utf8');
const html = '<!doctype html>\n<html lang="es"><head><meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">\n' +
  '<title>SERUMS QUEST · harness Agente 5</title>\n' +
  '<style>html,body{margin:0;height:100%;overflow:hidden;background:#000}canvas{display:block;width:100vw;height:100vh;touch-action:none;outline:none}</style></head>\n' +
  '<body><canvas id="game" tabindex="0"></canvas>\n' +
  '<script>' + threeCode + '</script>\n' +
  '<script>window.GAME=' + JSON.stringify(game) + ';</script>\n' +
  '<script>' + bundle + '</script>\n' +
  '<script>' + driver + '</script>\n' +
  '</body></html>\n';

fs.mkdirSync(harnessDir, { recursive: true });
fs.writeFileSync(path.join(harnessDir, 'harness.html'), html);
try {
  fs.writeFileSync(path.join(harnessDir, 'bundle-check.js'), bundle);
  require('child_process').execFileSync(process.execPath, ['--check', path.join(harnessDir, 'bundle-check.js')], { stdio: 'inherit' });
  console.log('bundle node --check: OK');
} catch (error) {
  console.error('bundle node --check: FAIL');
  process.exitCode = 1;
}
console.log('harness bytes:', Buffer.byteLength(html), '| parts:', parts.map((p) => p.name).join(', '));
