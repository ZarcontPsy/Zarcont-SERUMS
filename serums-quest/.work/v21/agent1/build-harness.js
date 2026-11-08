'use strict';
/* =========================================================================
   Agente 1 · Sementera del banco de pruebas de geometría/parpadeo.
   Ensambla harness.html a partir de:
     · dist/index.html (runtime three.js r187 ya empaquetado, sin red)
     · src/campaign.json + src/extras.json + game.json (datos)
     · .work/src/part1-core.js (solo HERO_LOOKS/HERO_SLOTS)
     · .work/src/part2-world.js y .work/src/part3c-cosmetics-models.js
   No construye el juego, no toca game.js/dist/export. Sin dependencias.
   Uso: node .work/v21/agent1/build-harness.js
   ========================================================================= */
const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const PROJECT = path.resolve(HERE, '..', '..', '..');
const WORK = path.join(PROJECT, '.work', 'src');
const SRC = path.join(PROJECT, 'src');
const DIST = path.join(PROJECT, 'dist', 'index.html');
const OUT = path.join(HERE, 'harness.html');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}
function safeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
function sliceBetween(text, startMarker, endMarker) {
  const a = text.indexOf(startMarker);
  if (a < 0) throw new Error('No se encontró el marcador inicial: ' + startMarker);
  const b = text.indexOf(endMarker, a + startMarker.length);
  if (b < 0) throw new Error('No se encontró el marcador final: ' + endMarker);
  return text.slice(a, b);
}
function extractThree() {
  const html = read(DIST);
  const comment = html.indexOf('/* three.js');
  if (comment < 0) throw new Error('dist/index.html no contiene el runtime de three.js');
  const open = html.lastIndexOf('<script>', comment);
  if (open < 0) throw new Error('No se encontró la etiqueta <script> del runtime three.js');
  const close = html.indexOf('</script>', comment);
  if (close < 0) throw new Error('No se encontró el cierre del runtime three.js');
  const code = html.slice(html.indexOf('>', open) + 1, close);
  if (code.indexOf('window.THREE=') === -1 && code.indexOf('window.THREE =') === -1) {
    throw new Error('El bloque extraído de three.js no publica window.THREE');
  }
  return code;
}

function build() {
  const campaign = JSON.parse(read(path.join(SRC, 'campaign.json')));
  const extras = JSON.parse(read(path.join(SRC, 'extras.json')));
  const game = JSON.parse(read(path.join(PROJECT, 'game.json')));
  const heroIds = campaign.characters.map((c) => c.id);

  /* Mismo catálogo que build-game.js: originales + extras, todos compatibles. */
  const cosmetics = campaign.cosmetics.concat(extras.cosmetics.map((c) => Object.assign({}, c, {
    isExtra: true,
    shopAvailable: false,
    compatibleCharacterIds: heroIds.slice()
  })));
  const categories = campaign.cosmeticCategories.concat(extras.categories);

  const part1 = read(path.join(WORK, 'part1-core.js'));
  const HERO_LOOKS = sliceBetween(part1, 'var HERO_LOOKS = {', 'var HERO_SLOTS = {');
  const HERO_SLOTS = sliceBetween(part1, 'var HERO_SLOTS = {', 'var COSMETIC_SLOT_LABELS = {');
  const part2 = read(path.join(WORK, 'part2-world.js'));
  const part3c = read(path.join(WORK, 'part3c-cosmetics-models.js'));
  const driver = read(path.join(HERE, 'driver.js'));
  const three = extractThree();

  const dataScript = `
var GAME = {
  title: ${safeJson(game.title || 'SERUMS QUEST')},
  rules: ${safeJson(game.rules || {})},
  slots: {},
  assets: {}
};
var RULES = GAME.rules;
var CAMPAIGN_DATA = ${safeJson({
    areas: campaign.areas,
    characters: campaign.characters.map((c) => ({ id: c.id, name: c.name, klass: c.klass, slot: c.slot })),
    cosmetics: cosmetics,
    cosmeticCategories: categories
  })};
var CAMP = CAMPAIGN_DATA;
var AREA_BY_ID = {};
var CHARACTER_BY_ID = {};
var COSMETIC_BY_ID = {};
var COSMETIC_SLOT_ORDER = [];
var COSMETIC_SLOT_LOOKUP = {};
var ALL_COSMETICS = CAMP.cosmetics.slice();
CAMP.areas.forEach(function (a) { AREA_BY_ID[a.id] = a; });
CAMP.characters.forEach(function (c) { CHARACTER_BY_ID[c.id] = c; });
CAMP.cosmetics.forEach(function (c) { COSMETIC_BY_ID[c.id] = c; });
CAMP.cosmeticCategories.forEach(function (s) { COSMETIC_SLOT_ORDER.push(s.id); COSMETIC_SLOT_LOOKUP[s.id] = s; });
var RARITY_UI = {
  inicial: { label: 'Inicial', color: '#B8C1D0', glow: '#8B98AF', order: 0 },
  comun: { label: 'Común', color: '#AEB6C8', glow: '#78859A', order: 1 },
  poco_comun: { label: 'Poco común', color: '#78D5A5', glow: '#42B386', order: 2 },
  raro: { label: 'Raro', color: '#7AA2FF', glow: '#4F79E8', order: 3 },
  epico: { label: 'Épico', color: '#C49BFF', glow: '#965DE1', order: 4 },
  legendario: { label: 'Legendario', color: '#F3C978', glow: '#E5A742', order: 5 }
};
function rarityUI(key) { return RARITY_UI[key] || RARITY_UI.comun; }
function cosmeticRarityKey(c) { return (c && c.rarity) || 'comun'; }
function cosmeticStage(c) { return 1; }
function getCharacterOutfit() { return {}; }
function syncHudPortrait() {}
function persist() {}
var state = {
  settings: { effectsQuality: 'alto', hide3dFrames: false, reduceMotion: false, onlyOriginalBank: false },
  collection: { selectedCharacterId: 'ilan', ownedCharacterIds: ['ilan'], ownedCosmeticIds: [], equipped: {} },
  coins: 9999,
  daily: { streak: 60, bestStreak: 60 },
  errors: {},
  missions: {},
  achievements: {},
  reviews: { onTimeSessions: 0, earlySessions: 0 },
  counters: {}
};
var session = null;
var V2 = {
  version: 'v21-agent1-harness',
  call: function () {},
  quality: function () { return 'alto'; },
  reducedMotion: function () { return false; },
  isTouch: function () { return false; },
  budget: function () { return { props: 12, particles: 80, decor: 12, maxDrawCalls: 60 }; },
  emit: function () {},
  clamp: function (v, a, b) { return Math.max(a, Math.min(b, v)); },
  lerp: function (a, b, t) { return a + (b - a) * t; },
  rand: function () { return Math.random(); },
  palette: {},
  assets: { ids: {}, prop: null }
};
${HERO_LOOKS}
${HERO_SLOTS}
`;

  const modelScript = `(function () {
${part2}
${part3c}
window.__V21 = {
  THREE: THREE,
  renderer: renderer,
  scene: scene,
  camera: camera,
  hubGroup: hubGroup,
  arenaGroup: arenaGroup,
  sceneRoot: sceneRoot,
  starField: (typeof starField !== 'undefined' ? starField : null),
  moon: (typeof moon !== 'undefined' ? moon : null),
  sparkLayer: (typeof sparkLayer !== 'undefined' ? sparkLayer : null),
  bolt: (typeof bolt !== 'undefined' ? bolt : null),
  heroShield: (typeof heroShield !== 'undefined' ? heroShield : null),
  moonLight: (typeof moonLight !== 'undefined' ? moonLight : null),
  rimLight: (typeof rimLight !== 'undefined' ? rimLight : null),
  ambient: (typeof ambient !== 'undefined' ? ambient : null),
  buildHeroAvatar: buildHeroAvatar,
  applyOutfitToAvatar: (typeof applyOutfitToAvatar === 'function' ? applyOutfitToAvatar : null),
  buildHairPiece: (typeof buildHairPiece === 'function' ? buildHairPiece : null),
  mergedVoxels: mergedVoxels,
  addPartBoxes: addPartBoxes,
  buildGuardian: buildGuardian,
  disposeObject: disposeObject,
  animateAvatarCosmetics: (typeof animateAvatarCosmetics === 'function' ? animateAvatarCosmetics : null),
  HERO_LOOKS: HERO_LOOKS,
  HERO_SLOTS: HERO_SLOTS,
  GUARDIAN_DATA: GUARDIAN_DATA,
  COSMETIC_BY_ID: COSMETIC_BY_ID,
  COSMETIC_SLOT_ORDER: COSMETIC_SLOT_ORDER,
  state: state,
  cameraNear: camera.near,
  cameraFar: camera.far,
  shadowTypeInitial: (renderer && renderer.shadowMap ? renderer.shadowMap.type : null),
  shadowSoftType: THREE.PCFSoftShadowMap,
  shadowPcfType: THREE.PCFShadowMap,
  mergeStats: (typeof mergedVoxelsStats === 'object' ? mergedVoxelsStats : null)
};
window.__V21_READY = true;
})();`;

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>SERUMS QUEST V2.1 · banco de geometría (Agente 1)</title>
<style>
  html, body { margin: 0; background: #0b0f18; color: #cfd6e4; }
  body { font: 12px/1.45 Consolas, "Courier New", monospace; }
  #game { display: block; width: 384px; height: 384px; border: 1px solid #273246; }
  #log { padding: 8px 10px; white-space: pre-wrap; max-width: 760px; }
  #log b { color: #e4c07a; }
</style></head>
<body>
<canvas id="game"></canvas>
<div id="log">cargando banco de pruebas…</div>
<script>${three}</script>
<script>${dataScript}</script>
<script>${modelScript}</script>
<script>${driver}</script>
</body></html>
`;

  fs.writeFileSync(OUT, html);
  return {
    out: OUT,
    bytes: Buffer.byteLength(html),
    heroes: heroIds.length,
    cosmetics: cosmetics.length,
    categories: categories.map((c) => c.id),
    part2Bytes: Buffer.byteLength(part2),
    part3cBytes: Buffer.byteLength(part3c),
    threeBytes: Buffer.byteLength(three)
  };
}

if (require.main === module) {
  try {
    const r = build();
    console.log('harness:', r.out);
    console.log('bytes:', r.bytes, '| heroes:', r.heroes, '| cosmeticos:', r.cosmetics);
    console.log('part2:', r.part2Bytes, '| part3c:', r.part3cBytes, '| three:', r.threeBytes);
  } catch (error) {
    console.error('ERROR:', error && error.message || error);
    process.exitCode = 1;
  }
}

module.exports = { build };
