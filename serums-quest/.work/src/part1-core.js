/* =========================================================================
   SERUMS QUEST — OBSERVATORIO DE LAS CINCO RUTAS
   Fase 2 · héroes, guardianes y animación voxel
   ========================================================================= */
var GAME = window.GAME || {};
var RULES = GAME.rules || {};
var CAMP = window.__SERUMS_CAMPAIGN__ || CAMPAIGN_DATA;
var EL = {};
var APP_VERSION = RULES.version || 'Fase 2';
var BUILD_DATE = RULES.buildDate || '2026-11-06';
var SAVE_SCHEMA_VERSION = 2;
var SAVE_KEY = 'serumsquest:voxel:state:v1';
var PREIMPORT_KEY = 'serumsquest:voxel:preimport:v1';
var BACKUP_KEY = 'serumsquest:voxel:backup:v1';
var CORRUPT_KEY = 'serumsquest:voxel:corrupt:v1';
var SETTINGS_KEY = 'serumsquest:voxel:settings:v1';
/* Clave de solo lectura que consume el panel «Nivel y XP» del HUB. */
var QUEST_SNAPSHOT_KEY = 'serumsquest:snapshot:v1';
var recoveryInfo = { corrupt: false, raw: null };
var recoveryLock = false;

document.documentElement.lang = 'es';
document.title = GAME.title || 'SERUMS QUEST: Observatorio de las Cinco Rutas';

(function injectStyles() {
  var style = document.createElement('style');
  style.id = 'serums-voxel-styles';
  style.textContent = STYLE_CSS;
  document.head.appendChild(style);
})();

var AREA_BY_ID = {};
var MISSION_BY_ID = {};
var QUESTION_BY_ID = {};
var CHARACTER_BY_ID = {};
var COSMETIC_BY_ID = {};
var ACHIEVEMENT_BY_ID = {};
CAMP.areas.forEach(function (a) { AREA_BY_ID[a.id] = a; });
CAMP.missions.forEach(function (m) { MISSION_BY_ID[m.id] = m; });
Object.keys(CAMP.questions).forEach(function (id) { QUESTION_BY_ID[id] = CAMP.questions[id]; });
CAMP.characters.forEach(function (c) { CHARACTER_BY_ID[c.id] = c; });
CAMP.cosmetics.forEach(function (c) { COSMETIC_BY_ID[c.id] = c; });
CAMP.achievements.forEach(function (a) { ACHIEVEMENT_BY_ID[a.id] = a; });

var AREA_GLYPHS = {
  'area-psi-salud-publica': '✦',
  'area-psi-cuidado-integral': '♡',
  'area-psi-etica': '⚖',
  'area-psi-investigacion': '◇',
  'area-psi-gestion': '▦'
};

var HERO_LOOKS = {
  ilan: {
    slot: 'personaje_ilan', klass: 'Táctico', weapon: 'Brújula de rutas',
    accent: '#7AA2FF', skin: '#C98C63', skinShade: '#AE7350', hair: '#2B1D15',
    outfit: '#273D70', outfit2: '#36558F', trim: '#E4C07A', leg: '#1B2B50',
    style: 'coat', hairStyle: 'side', extra: 'headband', prop: 'compass',
    body: { h: 1.04, w: 0.95, head: 1.0, shoulder: 0.98, leg: 1.0 },
    anim: { idle: 1.75, gait: 9.2, attack: 'slash', lean: 0.05 },
    silhouette: 'long coat, shoulder drape, high collar',
    closeupArm: { x: -0.52, z: -0.26 }
  },
  mara: {
    slot: 'personaje_mara', klass: 'Rastreadora', weapon: 'Bastón mapamundi',
    accent: '#69D3C1', skin: '#A97148', skinShade: '#8C5B3A', hair: '#392419',
    outfit: '#55734A', outfit2: '#C7A65F', trim: '#EFD79F', leg: '#3B4E37',
    style: 'poncho', hairStyle: 'ponytail', extra: 'brim', prop: 'mapStaff',
    body: { h: 0.93, w: 1.07, head: 1.04, shoulder: 1.04, leg: 0.9 },
    anim: { idle: 1.45, gait: 10.4, attack: 'staff', lean: 0.08 },
    silhouette: 'wide brim hat, round poncho, backpack',
    closeupArm: { x: -0.36, z: -0.18 }
  },
  noa: {
    slot: 'personaje_noa', klass: 'Analista', weapon: 'Lente prismática',
    accent: '#8DB7FF', skin: '#E1B08A', skinShade: '#C69472', hair: '#1D2532',
    outfit: '#DDE2E9', outfit2: '#7B8FAF', trim: '#7AA2FF', leg: '#38445C',
    style: 'coat', hairStyle: 'bob', extra: 'glasses', prop: 'lens',
    body: { h: 1.08, w: 0.86, head: 0.97, shoulder: 0.84, leg: 1.06 },
    anim: { idle: 1.6, gait: 8.3, attack: 'cast', lean: 0.04 },
    silhouette: 'tall lab coat, bob, round lens',
    closeupArm: { x: -0.62, z: -0.22 }
  },
  teo: {
    slot: 'personaje_teo', klass: 'Mentor', weapon: 'Báculo de escucha',
    accent: '#C49BFF', skin: '#82563E', skinShade: '#684330', hair: '#D8D3C9',
    outfit: '#493A5D', outfit2: '#74608C', trim: '#C49BFF', leg: '#332944',
    style: 'robe', hairStyle: 'bunBeard', extra: 'bun', prop: 'bookStaff',
    body: { h: 1.01, w: 1.08, head: 1.02, shoulder: 1.03, leg: 0.97 },
    anim: { idle: 1.35, gait: 8.6, attack: 'staff', lean: 0.06 },
    silhouette: 'broad mantled robe, beard, book staff',
    closeupArm: { x: -0.34, z: -0.14 }
  },
  lia: {
    slot: 'personaje_lia', klass: 'Duelista', weapon: 'Cronómetro de chispa',
    accent: '#F3B562', skin: '#C88C6A', skinShade: '#AD7557', hair: '#ED6A46',
    outfit: '#71334B', outfit2: '#A44553', trim: '#F3B562', leg: '#3D2030',
    style: 'jacket', hairStyle: 'highPony', extra: 'earring', prop: 'watch',
    body: { h: 0.98, w: 0.9, head: 0.99, shoulder: 0.92, leg: 1.02 },
    anim: { idle: 2.05, gait: 11.0, attack: 'slash', lean: 0.1 },
    silhouette: 'high ponytail, asymmetric jacket, scarf tail',
    closeupArm: { x: -1.08, z: -0.42 }
  },
  kian: {
    slot: 'personaje_kian', klass: 'Guardián', weapon: 'Martillo-sello',
    accent: '#AEB6C8', skin: '#6A452D', skinShade: '#523421', hair: '#261A14',
    outfit: '#3B4654', outfit2: '#8493A8', trim: '#BFC9D8', leg: '#2A333E',
    style: 'armor', hairStyle: 'bald', extra: 'shoulder', prop: 'hammer',
    body: { h: 0.96, w: 1.18, head: 1.04, shoulder: 1.18, leg: 0.94 },
    anim: { idle: 1.15, gait: 7.8, attack: 'hammer', lean: 0.07 },
    silhouette: 'broadest shoulders, bald seal brow, gauntlets',
    closeupArm: { x: -0.48, z: -0.22 }
  },
  amaru: {
    slot: 'personaje_amaru', klass: 'Vigía', weapon: 'Linterna de ruta',
    accent: '#69D3C1', skin: '#9B6644', skinShade: '#7E5136', hair: '#2B1B15',
    outfit: '#3D6A61', outfit2: '#C49A50', trim: '#E6C88C', leg: '#2D4D47',
    style: 'poncho', hairStyle: 'short', extra: 'hood', prop: 'lantern',
    body: { h: 0.94, w: 1.04, head: 1.06, shoulder: 1.0, leg: 0.92 },
    anim: { idle: 1.55, gait: 10.0, attack: 'lantern', lean: 0.08 },
    silhouette: 'deep hood, shoulder cape, lantern pole',
    closeupArm: { x: -0.5, z: -0.2 }
  },
  ona: {
    slot: 'personaje_ona', klass: 'Arquitecta', weapon: 'Compás de planos',
    accent: '#7AA2FF', skin: '#D6A27D', skinShade: '#BC8765', hair: '#4A2B5C',
    outfit: '#293B67', outfit2: '#4D669A', trim: '#9BC0FF', leg: '#1E2C4C',
    style: 'architect', hairStyle: 'bun', extra: 'collar', prop: 'compassTool',
    body: { h: 1.08, w: 0.91, head: 0.96, shoulder: 0.96, leg: 1.07 },
    anim: { idle: 1.5, gait: 8.6, attack: 'cast', lean: 0.03 },
    silhouette: 'tall collar, bun, floating drafting frame',
    closeupArm: { x: -0.66, z: -0.28 }
  },
  iris: {
    slot: 'personaje_iris', klass: 'Protectora', weapon: 'Farol de custodia',
    accent: '#C49BFF', skin: '#7B4B36', skinShade: '#633A29', hair: '#ECE8E0',
    outfit: '#3B2D54', outfit2: '#655081', trim: '#E7D6B4', leg: '#2A203D',
    style: 'cloak', hairStyle: 'long', extra: 'halo', prop: 'farol',
    body: { h: 1.04, w: 0.95, head: 0.99, shoulder: 0.94, leg: 1.0 },
    anim: { idle: 1.3, gait: 8.5, attack: 'lantern', lean: 0.04 },
    silhouette: 'long cloak, white hair, halo and lantern',
    closeupArm: { x: -0.4, z: -0.18 }
  },
  zenon: {
    slot: 'personaje_zenon', klass: 'Cronista', weapon: 'Bastón de crónica',
    accent: '#E4C07A', skin: '#8C6148', skinShade: '#735039', hair: '#E4DED1',
    outfit: '#5B4425', outfit2: '#8A6A3A', trim: '#E4C07A', leg: '#3E2E1B',
    style: 'archivist', hairStyle: 'longBeard', extra: 'cowl', prop: 'archiveStaff',
    body: { h: 1.01, w: 1.06, head: 1.04, shoulder: 1.08, leg: 0.95 },
    anim: { idle: 1.2, gait: 7.6, attack: 'staff', lean: 0.11 },
    silhouette: 'hunched archivist, wide cowl, long beard, scroll rack',
    closeupArm: { x: -0.32, z: -0.12 }
  }
};

var HERO_SLOTS = {
  personaje_ilan: 'ilan',
  personaje_mara: 'mara',
  personaje_noa: 'noa',
  personaje_teo: 'teo',
  personaje_lia: 'lia',
  personaje_kian: 'kian',
  personaje_amaru: 'amaru',
  personaje_ona: 'ona',
  personaje_iris: 'iris',
  personaje_zenon: 'zenon'
};

var COSMETIC_SLOT_LABELS = {};
CAMP.cosmeticCategories.forEach(function (s) { COSMETIC_SLOT_LABELS[s.id] = s.label; });

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value) || 0)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function pad2(value) { return String(value).padStart(2, '0'); }
function formatNumber(value) { return String(Math.round(Number(value) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function formatPct(value, digits) { return (Number(value) * 100).toFixed(digits == null ? 0 : digits).replace('.0', '') + '%'; }
function plural(n, one, many) { return Number(n) === 1 ? one : (many || one + 's'); }
function nowISO(now) { return (now ? new Date(now) : new Date()).toISOString(); }
function dateKey(now) {
  var d = now ? new Date(now) : new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}
function addMinutes(iso, minutes) { return new Date(new Date(iso).getTime() + Number(minutes || 0) * 60000).toISOString(); }
function addDays(iso, days) { return new Date(new Date(iso).getTime() + Number(days || 0) * 86400000).toISOString(); }
function parseDate(value) {
  if (!value) return null;
  var d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}
function timeAgo(iso) {
  var d = parseDate(iso);
  if (!d) return '';
  var s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 60) return 'hace un momento';
  if (s < 3600) return 'hace ' + Math.floor(s / 60) + ' min';
  if (s < 86400) return 'hace ' + Math.floor(s / 3600) + ' h';
  return 'hace ' + Math.floor(s / 86400) + ' d';
}
function timeUntil(iso) {
  var d = parseDate(iso);
  if (!d) return 'sin programar';
  var ms = d.getTime() - Date.now();
  if (ms <= 0) return 'ahora';
  var mins = Math.ceil(ms / 60000);
  if (mins < 60) return 'en ' + mins + ' min';
  var hours = Math.ceil(mins / 60);
  if (hours < 24) return 'en ' + hours + ' h';
  var days = Math.ceil(hours / 24);
  return 'en ' + days + ' ' + plural(days, 'día', 'días');
}
function shortDate(iso) {
  var d = parseDate(iso);
  if (!d) return '—';
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}
function uid(prefix) { return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7); }

var ICON_PATHS = {
  spark: '<path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/>',
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.7-4 3.1-6 7-6s6.3 2 7 6"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M14.6 9.2c-.6-.7-1.5-1-2.6-1-1.5 0-2.5.7-2.5 1.9 0 1.1.8 1.5 2.6 1.9 1.9.4 2.8.9 2.8 2.1 0 1.2-1.1 2-2.9 2-1.2 0-2.2-.4-2.9-1.2M12 6.6v10.8"/>',
  heart: '<path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9z"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  check: '<path d="M5 12.5l4 4L19 6.5"/>',
  checkCircle: '<circle cx="12" cy="12" r="8.5"/><path d="M8 12.2l2.6 2.6L16.5 9"/>',
  chevronRight: '<path d="M9 5l7 7-7 7"/>',
  chevronLeft: '<path d="M15 5l-7 7 7 7"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  book: '<path d="M4 5.5c3-1 5.5-.4 8 1.3v13c-2.5-1.7-5-2.3-8-1.3v-13z"/><path d="M20 5.5c-3-1-5.5-.4-8 1.3v13c2.5-1.7 5-2.3 8-1.3v-13z"/>',
  rotate: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.1M12 19.1v2.1M21.2 12h-2.1M4.9 12H2.8M18.5 5.5l-1.5 1.5M7 17l-1.5 1.5M18.5 18.5L17 17M7 7L5.5 5.5"/>',
  play: '<path d="M8 5l11 7-11 7V5z"/>',
  pause: '<rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/>',
  sound: '<path d="M4 10v4h4l5 4V6l-5 4H4z"/><path d="M16 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/>',
  soundOff: '<path d="M4 10v4h4l5 4V6l-5 4H4z"/><path d="M16 10l5 5M21 10l-5 5"/>',
  alert: '<path d="M12 4l9 16H3L12 4z"/><path d="M12 9v5M12 17.2v.1"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 13v4M8 20h8M10 17h4"/>',
  arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  arrowDown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  flame: '<path d="M13 3c1 4 4.5 5.2 4.5 9A5.5 5.5 0 0 1 12 17.5 5.5 5.5 0 0 1 6.5 12c0-2 .9-3.5 2.3-4.8.2 1.6.8 2.5 1.8 2.7-.2-2.6 1-5.4 2.4-6.9z"/>',
  shield: '<path d="M12 3l7 3v5c0 4.4-2.8 7.8-7 10-4.2-2.2-7-5.6-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.7"/>',
  compass: '<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z"/>',
  seal: '<path d="M6 3h12v6a6 6 0 0 1-12 0V3z"/><path d="M9 14v7l3-2 3 2v-7"/>',
  feather: '<path d="M20 4C12 4 6 8 5 16l-2 4M5 16c5 1 11-2 13-9"/><path d="M8 13l4 4"/>',
  scroll: '<path d="M7 3h11v15a3 3 0 0 1-3 3H7a3 3 0 0 1 0-6h11"/><path d="M7 3a3 3 0 0 0 0 6"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5M3 16l9 5 9-5"/>',
  bag: '<path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
  crown: '<path d="M4 18h16l1-10-5 4-4-7-4 7-5-4 1 10z"/><path d="M5 21h14"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8L12 3.5z"/>',
  flag: '<path d="M6 21V4M6 5h11l-2 4 2 4H6"/>',
  bookOpen: '<path d="M4 5.5c3-1 5.5-.4 8 1.3v13c-2.5-1.7-5-2.3-8-1.3v-13z"/><path d="M20 5.5c-3-1-5.5-.4-8 1.3v13c2.5-1.7 5-2.3 8-1.3v-13z"/>',
  chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-5M12 16V8M16 16v-3M20 16V6"/>',
  square: '<rect x="4" y="4" width="16" height="16" rx="3"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.1"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5"/>'
};

function icon(name, size) {
  var s = size || 16;
  return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON_PATHS[name] || ICON_PATHS.spark) + '</svg>';
}
function heartSvg(filled) {
  return '<svg width="17" height="17" viewBox="0 0 24 24" fill="' + (filled ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.7" aria-hidden="true">' + ICON_PATHS.heart + '</svg>';
}

/* -------------------------------------------------------------------------
   Persistencia
   ------------------------------------------------------------------------- */
function baseAreaStats() {
  var out = {};
  CAMP.areas.forEach(function (a) {
    out[a.id] = { answered: 0, correct: 0, wrong: 0, totalTimeMs: 0, reliableAnswered: 0, reliableCorrect: 0, reliableWrong: 0 };
  });
  return out;
}
function defaultState() {
  var at = nowISO();
  return {
    schema: SAVE_SCHEMA_VERSION,
    appVersion: APP_VERSION,
    createdAt: at,
    updatedAt: at,
    profile: { name: 'Serumista', createdAt: at },
    xp: 0,
    coins: 0,
    stage: 1,
    academic: { answered: 0, correct: 0, wrong: 0, totalTimeMs: 0, sessions: 0, byArea: baseAreaStats(), recent: [] },
    questions: {},
    questionTags: {},
    errors: {},
    missions: {},
    achievements: {},
    collection: {
      ownedCharacterIds: ['ilan'],
      ownedCosmeticIds: [],
      selectedCharacterId: 'ilan',
      equipped: {}
    },
    daily: { lastCompletedDate: null, streak: 0, bestStreak: 0, totalCompleted: 0, graceWeek: null },
    reviews: { lastCompletedDate: null, completed: 0, onTimeSessions: 0, earlySessions: 0 },
    settings: { sound: false, ambient: false, muted: false, volume: 0.7, reducedMotion: false, extraTime: false, effectsQuality: 'medio', qualityChosen: false, hide3dFrames: false, textScale: 'normal', highContrast: false, tutorialSeen: false, backupReminder: true, sourceWeights: { campaign: 0.6, dashboard: 0.15, flashcards: 0.25 }, feedbackMode: 'end', onlyOriginalBank: false },
    modeStats: {
      dailyDate: null,
      claims: {},
      dailyWins: 0,
      survivalWins: 0,
      survivalBest: 0,
      timedRuns: 0,
      timedBest: 0,
      timedAce: 0,
      simulacros: 0,
      simulacroHistory: []
    },
    backup: { lastExportedAt: null, lastPromptAt: null },
    importedFrom: null,
    importedAt: null,
    events: [],
    v2: {
      world: {
        chests: {},
        guides: {},
        stations: {},
        fragments: {},
        visited: {},
        restored: {}
      }
    }
  };
}

var storageEnabled = true;
try {
  var testKey = 'serumsquest:voxel:test';
  window.localStorage.setItem(testKey, '1');
  window.localStorage.removeItem(testKey);
} catch (e) { storageEnabled = false; }

function numberField(value, fallback) {
  var n = Number(value);
  return isFinite(n) && n >= 0 ? Math.trunc(n) : (fallback || 0);
}
function objField(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function normalizeState(raw) {
  var base = defaultState();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  var out = Object.assign({}, base, raw);
  out.profile = Object.assign({}, base.profile, objField(raw.profile));
  out.profile.name = String(out.profile.name || 'Serumista').slice(0, 40);
  out.xp = numberField(raw.xp, 0);
  out.coins = numberField(raw.coins, 0);
  out.stage = clamp(numberField(raw.stage, 1), 1, 4);
  out.academic = Object.assign({}, base.academic, objField(raw.academic));
  out.academic.answered = numberField(out.academic.answered, 0);
  out.academic.correct = Math.min(out.academic.answered, numberField(out.academic.correct, 0));
  out.academic.wrong = numberField(out.academic.wrong, 0);
  out.academic.byArea = baseAreaStats();
  var rawAreas = objField(raw.academic && raw.academic.byArea);
  CAMP.areas.forEach(function (a) {
    var x = objField(rawAreas[a.id]);
    out.academic.byArea[a.id] = {
      answered: numberField(x.answered, 0),
      correct: numberField(x.correct, 0),
      wrong: numberField(x.wrong, 0),
      totalTimeMs: numberField(x.totalTimeMs, 0),
      reliableAnswered: numberField(x.reliableAnswered, 0),
      reliableCorrect: numberField(x.reliableCorrect, 0),
      reliableWrong: numberField(x.reliableWrong, 0)
    };
  });
  out.academic.recent = Array.isArray(out.academic.recent) ? out.academic.recent.slice(-80) : [];
  out.questions = objField(raw.questions);
  out.questionTags = {};
  var rawTags = objField(raw.questionTags);
  Object.keys(rawTags).forEach(function (id) {
    if (!QUESTION_BY_ID[id]) return;
    var t = objField(rawTags[id]);
    if (t.difficult || t.favorite) out.questionTags[id] = { difficult: !!t.difficult, favorite: !!t.favorite, updatedAt: t.updatedAt || nowISO() };
  });
  out.errors = {};
  var rawErrors = objField(raw.errors);
  Object.keys(rawErrors).forEach(function (id) {
    if (QUESTION_BY_ID[id]) out.errors[id] = Object.assign({}, rawErrors[id], { questionId: id });
  });
  out.missions = {};
  var rawMissions = objField(raw.missions);
  Object.keys(rawMissions).forEach(function (id) {
    if (MISSION_BY_ID[id]) out.missions[id] = rawMissions[id];
  });
  out.achievements = {};
  var rawAch = objField(raw.achievements);
  Object.keys(rawAch).forEach(function (id) {
    if (ACHIEVEMENT_BY_ID[id]) out.achievements[id] = rawAch[id];
  });
  out.collection = Object.assign({}, base.collection, objField(raw.collection));
  var ownedChars = Array.isArray(raw.collection && raw.collection.ownedCharacterIds) ? raw.collection.ownedCharacterIds.filter(function (id) { return CHARACTER_BY_ID[id]; }) : [];
  if (ownedChars.indexOf('ilan') === -1) ownedChars.unshift('ilan');
  out.collection.ownedCharacterIds = Array.from(new Set(ownedChars));
  out.collection.ownedCosmeticIds = Array.isArray(raw.collection && raw.collection.ownedCosmeticIds) ? Array.from(new Set(raw.collection.ownedCosmeticIds.filter(function (id) { return COSMETIC_BY_ID[id]; }))) : [];
  out.collection.selectedCharacterId = CHARACTER_BY_ID[out.collection.selectedCharacterId] && out.collection.ownedCharacterIds.indexOf(out.collection.selectedCharacterId) !== -1 ? out.collection.selectedCharacterId : out.collection.ownedCharacterIds[0];
  out.collection.equipped = objField(raw.collection && raw.collection.equipped);
  out.daily = Object.assign({}, base.daily, objField(raw.daily));
  out.reviews = Object.assign({}, base.reviews, objField(raw.reviews));
  out.modeStats = Object.assign({}, base.modeStats, objField(raw.modeStats));
  out.modeStats.claims = objField(out.modeStats.claims);
  out.modeStats.simulacroHistory = Array.isArray(out.modeStats.simulacroHistory) ? out.modeStats.simulacroHistory.slice(0, 30) : [];
  out.settings = Object.assign({}, base.settings, objField(raw.settings));
  var rawWeights = objField(out.settings.sourceWeights);
  function weightField(value, fallback) {
    var n = Number(value);
    return isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback;
  }
  out.settings.sourceWeights = {
    campaign: weightField(rawWeights.campaign, base.settings.sourceWeights.campaign),
    dashboard: weightField(rawWeights.dashboard, base.settings.sourceWeights.dashboard),
    flashcards: weightField(rawWeights.flashcards, base.settings.sourceWeights.flashcards)
  };
  var weightTotal = out.settings.sourceWeights.campaign + out.settings.sourceWeights.dashboard + out.settings.sourceWeights.flashcards;
  if (!(weightTotal > 0)) out.settings.sourceWeights = Object.assign({}, base.settings.sourceWeights);
  out.settings.textScale = out.settings.textScale === 'grande' ? 'grande' : 'normal';
  out.settings.feedbackMode = out.settings.feedbackMode === 'each' ? 'each' : 'end';
  out.settings.onlyOriginalBank = !!out.settings.onlyOriginalBank;
  out.backup = Object.assign({}, base.backup, objField(raw.backup));
  out.schema = SAVE_SCHEMA_VERSION;
  out.events = Array.isArray(raw.events) ? raw.events.slice(-100) : [];
  out.importedFrom = raw.importedFrom || null;
  out.importedAt = raw.importedAt || null;
  out.v2 = Object.assign({}, base.v2, objField(raw.v2));
  out.v2.world = Object.assign({}, base.v2.world, objField(out.v2.world));
  ['chests', 'guides', 'stations', 'fragments', 'visited', 'restored'].forEach(function (key) {
    var clean = {};
    var source = objField(out.v2.world[key]);
    Object.keys(source).forEach(function (id) {
      if (!id || id.length > 90) return;
      var value = source[id];
      if (value && typeof value === 'object' && !Array.isArray(value)) clean[id] = Object.assign({}, value);
      else clean[id] = value;
    });
    out.v2.world[key] = clean;
  });
  out.updatedAt = raw.updatedAt || base.updatedAt;
  out.createdAt = raw.createdAt || base.createdAt;
  return out;
}

function loadState() {
  var raw = null;
  try {
    raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState();
    var parsed = JSON.parse(raw);
    var out = normalizeState(parsed);
    if (parsed && Number(parsed.schema) < SAVE_SCHEMA_VERSION) {
      out.migrations = (out.migrations || []).concat([{ from: Number(parsed.schema) || 1, to: SAVE_SCHEMA_VERSION, at: nowISO() }]);
    }
    return out;
  } catch (e) {
    console.warn('No se pudo cargar el guardado local.', e);
    /* Si el navegador bloquea el almacenamiento, no hay un guardado corrupto:
       simplemente no hay guardado accesible. Entrar en recuperación confundiría
       al jugador y ocultaría la bienvenida. */
    if (!storageEnabled) return defaultState();
    recoveryInfo.corrupt = true;
    recoveryInfo.raw = raw;
    recoveryLock = true;
    return defaultState();
  }
}
var state = loadState();
function persist() {
  if (recoveryLock) return false;
  state.updatedAt = nowISO();
  try { window.localStorage.setItem(SAVE_KEY, JSON.stringify(state)); writeQuestSnapshot(); return true; } catch (e) { storageEnabled = false; return false; }
}
function backupCurrentState(reason) {
  try {
    window.localStorage.setItem(PREIMPORT_KEY, JSON.stringify({
      at: nowISO(),
      reason: reason || 'manual',
      state: state
    }));
    return true;
  } catch (e) { return false; }
}
function loadSettings() {
  try { var raw = window.localStorage.getItem(SETTINGS_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}
function saveSettings() {
  try { window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); } catch (e) {}
}

/* -------------------------------------------------------------------------
   Snapshot para el HUB (clave 'serumsquest:snapshot:v1')
   El HUB solo lee level, levelPercent, rank, xp, answered, hasActivity y
   lastSession.title (en applyQuestSnapshot). Se escriben además algunos
   campos de contexto con el mismo nombre que usaba la app 1.2.
   ------------------------------------------------------------------------- */
function lastSnapshotSession() {
  if (lastResult && lastResult.title) {
    return {
      id: lastResult.missionId || null,
      mode: lastResult.mode || null,
      title: lastResult.title,
      endedAt: lastResult.finishedAt || nowISO(),
      score: Number(lastResult.score) || 0,
      accuracy: Number(lastResult.accuracy) || 0
    };
  }
  var latest = null;
  Object.keys(state.missions || {}).forEach(function (id) {
    var rec = state.missions[id];
    if (!rec) return;
    var at = rec.lastAt || rec.completedAt;
    if (!at) return;
    if (!latest || String(at) > String(latest.at)) latest = { id: id, at: at };
  });
  if (!latest) return null;
  var mission = MISSION_BY_ID[latest.id];
  if (!mission) return null;
  var record = state.missions[latest.id] || {};
  return {
    id: latest.id,
    mode: mission.kind === 'boss' ? 'boss' : 'mission',
    title: mission.title,
    endedAt: latest.at,
    score: Number(record.lastScore) || 0,
    accuracy: Number(record.lastAccuracy) || 0
  };
}
function questSnapshotData() {
  var level = levelAt(state.xp);
  var rank = currentRank();
  var ms = currentMissionStats();
  var selected = selectedCharacter();
  var stage = CAMP.rules.stages[String(state.stage)] || {};
  return {
    version: APP_VERSION,
    schemaVersion: SAVE_SCHEMA_VERSION,
    updatedAt: nowISO(),
    level: level.level,
    levelPercent: level.percent,
    xp: Number(state.xp) || 0,
    xpToNext: level.maxed ? 0 : Math.max(0, level.needed - level.into),
    coins: Number(state.coins) || 0,
    rank: rank.name,
    rankColor: rank.color || '',
    stage: state.stage,
    stageName: stage.name || 'Iniciación',
    answered: Number(state.academic.answered) || 0,
    accuracy: state.academic.answered ? Math.round(overallAccuracy() * 1000) / 10 : 0,
    missions: ms.missions,
    bosses: ms.bosses,
    mastered: masteredCount(),
    streak: Number(state.daily.streak) || 0,
    hasActivity: Number(state.academic.answered) > 0 || Number(state.xp) > 0 || Number(state.academic.sessions) > 0 || Object.keys(state.missions || {}).length > 0 || !!state.importedAt,
    selectedCharacterId: selected.id,
    selectedCharacterName: selected.name,
    selectedCharacterTitle: selected.title || '',
    selectedCharacterRarity: selected.rarity || '',
    charactersOwned: state.collection.ownedCharacterIds.length,
    charactersTotal: CAMP.characters.length,
    cosmeticsOwned: state.collection.ownedCosmeticIds.length,
    lastSession: lastSnapshotSession()
  };
}
function writeQuestSnapshot() {
  if (recoveryLock || !storageEnabled) return null;
  try {
    var snap = questSnapshotData();
    window.localStorage.setItem(QUEST_SNAPSHOT_KEY, JSON.stringify(snap));
    return snap;
  } catch (e) { return null; }
}

/* -------------------------------------------------------------------------
   Progresión
   ------------------------------------------------------------------------- */
var LV = CAMP.rules.levels || { base: 80, linear: 40, quadratic: 10, maxLevel: 50 };
function levelCurve(level) {
  var l = Math.max(1, Math.floor(Number(level) || 1));
  return LV.base + LV.linear * (l - 1) + LV.quadratic * Math.pow(l - 1, 2);
}
function levelAt(xp) {
  var xpValue = Math.max(0, Number(xp) || 0);
  var level = 1;
  var remaining = xpValue;
  while (level < LV.maxLevel && remaining >= levelCurve(level)) {
    remaining -= levelCurve(level);
    level += 1;
  }
  if (level >= LV.maxLevel) return { level: level, into: 0, needed: 0, percent: 100, total: xpValue, maxed: true };
  var needed = levelCurve(level);
  return { level: level, into: remaining, needed: needed, percent: Math.round((remaining / needed) * 1000) / 10, total: xpValue, maxed: false };
}
function currentLevel() { return levelAt(state.xp).level; }
function currentMissionStats() {
  var missions = 0, bosses = 0;
  Object.keys(state.missions).forEach(function (id) {
    var m = state.missions[id];
    if (!m || !m.completedAt) return;
    if (MISSION_BY_ID[id] && MISSION_BY_ID[id].kind === 'boss') bosses += 1; else missions += 1;
  });
  return { missions: missions, bosses: bosses };
}
function masteredCount() {
  return Object.keys(state.questions).filter(function (id) {
    return QUESTION_BY_ID[id] && Number(state.questions[id].mastery) >= 3;
  }).length;
}
function areasCorrectCount() {
  var n = 0;
  CAMP.areas.forEach(function (a) {
    if (state.academic.byArea[a.id] && state.academic.byArea[a.id].reliableCorrect > 0) n += 1;
  });
  return n;
}
function overallAccuracy() {
  return state.academic.answered ? state.academic.correct / state.academic.answered : 0;
}
function currentRank() {
  var ranks = CAMP.rules.ranks.slice().sort(function (a, b) { return a.xp - b.xp; });
  var ms = currentMissionStats();
  var stats = {
    xp: state.xp,
    answered: state.academic.answered,
    accuracy: overallAccuracy(),
    mastered: masteredCount(),
    areas: areasCorrectCount(),
    bosses: ms.bosses
  };
  var chosen = ranks[0];
  ranks.forEach(function (r) {
    if (stats.xp >= r.xp && stats.answered >= r.answered && stats.accuracy >= r.accuracy && stats.mastered >= r.mastered && stats.areas >= r.areas && stats.bosses >= r.bosses) chosen = r;
  });
  return chosen;
}
function nextRank() {
  var ranks = CAMP.rules.ranks.slice().sort(function (a, b) { return a.xp - b.xp; });
  var current = currentRank();
  var idx = ranks.findIndex(function (r) { return r.id === current.id; });
  return ranks[idx + 1] || null;
}
function stageInfo() {
  return CAMP.rules.stages[String(state.stage)] || CAMP.rules.stages['1'];
}
function stageRequirements() {
  var rules = CAMP.rules.stageRules;
  var stats = {
    answered: state.academic.answered,
    accuracy: overallAccuracy(),
    mastered: masteredCount(),
    missions: currentMissionStats().missions
  };
  var target = Math.min(4, state.stage + 1);
  if (state.stage >= 4) return { target: 4, complete: true, items: [], stats: stats };
  var items = [];
  if (target === 2) {
    items = [
      { label: 'Respuestas', have: stats.answered, need: rules.minAnswersForStage2, met: stats.answered >= rules.minAnswersForStage2 },
      { label: 'Precisión', have: Math.round(stats.accuracy * 100), need: Math.round(rules.minAccuracyStage2 * 100), suffix: '%', met: stats.accuracy >= rules.minAccuracyStage2 }
    ];
  } else if (target === 3) {
    items = [
      { label: 'Respuestas', have: stats.answered, need: rules.minAnswersForStage3, met: stats.answered >= rules.minAnswersForStage3 },
      { label: 'Precisión', have: Math.round(stats.accuracy * 100), need: Math.round(rules.minAccuracyStage3 * 100), suffix: '%', met: stats.accuracy >= rules.minAccuracyStage3 },
      { label: 'Dominadas', have: stats.mastered, need: rules.minMasteredStage3, met: stats.mastered >= rules.minMasteredStage3 }
    ];
  } else {
    items = [
      { label: 'Respuestas', have: stats.answered, need: rules.minAnswersForStage4, met: stats.answered >= rules.minAnswersForStage4 },
      { label: 'Precisión', have: Math.round(stats.accuracy * 100), need: Math.round(rules.minAccuracyStage4 * 100), suffix: '%', met: stats.accuracy >= rules.minAccuracyStage4 },
      { label: 'Dominadas', have: stats.mastered, need: rules.minMasteredStage4, met: stats.mastered >= rules.minMasteredStage4 },
      { label: 'Misiones', have: stats.missions, need: rules.minMissionsStage4, met: stats.missions >= rules.minMissionsStage4 }
    ];
  }
  return { target: target, complete: items.every(function (i) { return i.met; }), items: items, stats: stats };
}
function evaluateStage() {
  var req = stageRequirements();
  if (req.complete && state.stage < 4) {
    var from = state.stage;
    state.stage = req.target;
    return { from: from, to: state.stage };
  }
  return null;
}
function missionCompleted(id) { return !!(state.missions[id] && state.missions[id].completedAt); }
function missionUnlockInfo(mission) {
  if (!mission) return { unlocked: false, requirements: [] };
  if (missionCompleted(mission.id)) return { unlocked: true, completed: true, requirements: [] };
  var unlock = mission.unlock || { missions: [], level: 1, stage: 1 };
  var level = currentLevel();
  var reqs = [];
  (unlock.missions || []).forEach(function (id) {
    var prev = MISSION_BY_ID[id];
    if (!prev) return;
    reqs.push({ key: 'pre:' + id, label: 'Completar «' + prev.title + '»', have: missionCompleted(id) ? 1 : 0, need: 1, met: missionCompleted(id) });
  });
  if (unlock.level > 1) reqs.push({ key: 'level', label: 'Nivel ' + unlock.level, have: level, need: unlock.level, met: level >= unlock.level });
  if (unlock.stage > 1) reqs.push({ key: 'stage', label: 'Etapa ' + (CAMP.rules.stages[String(unlock.stage)] || {}).name, have: state.stage, need: unlock.stage, met: state.stage >= unlock.stage });
  return { unlocked: reqs.every(function (r) { return r.met; }), completed: false, requirements: reqs };
}
function availableMissions() {
  var list = CAMP.missions.filter(function (m) { return missionUnlockInfo(m).unlocked && !missionCompleted(m.id); });
  sortMissions(list);
  return list;
}
function sortMissions(list) {
  list.sort(function (a, b) {
    if (a.kind !== b.kind) return a.kind === 'boss' ? 1 : -1;
    var ai = CAMP.areas.findIndex(function (x) { return x.id === a.areaId; });
    var bi = CAMP.areas.findIndex(function (x) { return x.id === b.areaId; });
    if (ai !== bi) return ai - bi;
    return a.index - b.index;
  });
  return list;
}
function nextRecommended() {
  var avail = availableMissions();
  if (avail.length) return avail[0];
  var all = CAMP.missions.filter(function (m) { return missionUnlockInfo(m).unlocked; });
  sortMissions(all);
  return all[0] || null;
}
function areaMissions(areaId) {
  return CAMP.missions.filter(function (m) { return m.areaId === areaId; }).sort(function (a, b) {
    if (a.kind !== b.kind) return a.kind === 'boss' ? 1 : -1;
    return a.index - b.index;
  });
}
function areaProgress(areaId) {
  var list = areaMissions(areaId);
  var done = list.filter(function (m) { return missionCompleted(m.id); }).length;
  return { done: done, total: list.length, pct: list.length ? done / list.length : 0 };
}

var RECOVERY_DAYS = (CAMP.rules.recovery && CAMP.rules.recovery.intervalsDays) || [1, 3, 7, 14, 30];
var FIRST_REVIEW_MINUTES = (CAMP.rules.recovery && CAMP.rules.recovery.firstDelayMinutes) || RULES.firstReviewMinutes || 20;
function baseXpForQuestion(question, session) {
  if (!session) return 20;
  if (session.mode === 'boss') {
    var idx = session.cursor;
    return idx < 2 ? 20 : (idx < 5 ? 35 : 50);
  }
  if (session.mode === 'review') return 20;
  if (session.questionTiers && session.questionTiers[question.id]) {
    return { iniciacion: 10, desarrollo: 20, especializacion: 35, dominio: 50, repaso: 20 }[session.questionTiers[question.id]] || 20;
  }
  var mission = MISSION_BY_ID[session.missionId];
  return mission ? mission.rewards.questionXp : 20;
}
function rewardMultiplier(prior, correct) {
  if (!prior) return { multiplier: 1, reason: 'Primera respuesta correcta.' };
  if (!correct) return { multiplier: 0, reason: 'Respuesta incorrecta: no se otorga XP ni monedas.' };
  if (prior.lastResult === 'wrong') return { multiplier: 0.7, reason: 'Recuperación de una pregunta fallada.' };
  if (prior.lastResult === 'correct') {
    var last = parseDate(prior.lastCorrectAt || prior.lastAttemptAt);
    var hours = last ? (Date.now() - last.getTime()) / 3600000 : 9999;
    if (hours < 6) return { multiplier: 0, reason: 'Repetición dentro de las primeras 6 horas: sin XP.', suppressed: true };
    if (Number(prior.mastery) >= 3) {
      if (hours < 24 * 7) return { multiplier: 0, reason: 'Pregunta dominada: el repaso aún no cumple 7 días.', suppressed: true };
      return { multiplier: 0.1, reason: 'Repaso espaciado de una pregunta dominada.' };
    }
    if (hours < 24) return { multiplier: 0.25, reason: 'Segunda práctica del día: recompensa reducida.' };
    return { multiplier: 0.4, reason: 'Repaso posterior: recompensa parcial.' };
  }
  return { multiplier: 1, reason: 'Primera respuesta correcta.' };
}
function ensureDailyCounters() {
  if (!state.counters || state.counters.date !== dateKey()) {
    state.counters = { date: dateKey(), coins: 0, xp: 0, sessions: 0 };
  }
  return state.counters;
}
function applyXpCoins(xp, coins) {
  var before = currentLevel();
  var counters = ensureDailyCounters();
  var coinCap = 120;
  var requested = Math.max(0, Math.round(Number(coins) || 0));
  var allowedCoins = Math.max(0, Math.min(requested, coinCap - (Number(counters.coins) || 0)));
  state.xp = Math.max(0, state.xp + Math.max(0, Math.round(Number(xp) || 0)));
  state.coins = Math.max(0, state.coins + allowedCoins);
  counters.coins = (Number(counters.coins) || 0) + allowedCoins;
  counters.xp = (Number(counters.xp) || 0) + Math.max(0, Math.round(Number(xp) || 0));
  /* El HUB debe ver el XP nuevo (y el nivel si cambió) sin esperar al guardado. */
  writeQuestSnapshot();
  return { before: before, after: currentLevel(), coinsAdded: allowedCoins, coinCap: coinCap, capReached: requested > allowedCoins };
}
function applyQuestionResult(questionId, chosen, durationMs, session) {
  var q = QUESTION_BY_ID[questionId];
  if (!q) return null;
  var prior = state.questions[questionId] || null;
  var correct = chosen === q.answer;
  var at = nowISO();
  var base = baseXpForQuestion(q, session);
  var mult = rewardMultiplier(prior, correct);
  var xp = correct && !mult.suppressed ? Math.max(1, Math.round(base * mult.multiplier)) : 0;
  var coins = correct && !mult.suppressed && (!prior || !prior.firstCorrectAt) ? 1 : 0;
  if (correct && xp) applyXpCoins(xp, coins);
  var mastery = Math.max(0, Math.min(5, Number(prior && prior.mastery) || 0));
  if (!correct) mastery = Math.max(0, mastery - 1);
  else if (!(prior && prior.lastResult === 'correct' && prior.lastCorrectAt && (Date.now() - (parseDate(prior.lastCorrectAt) || new Date(0)).getTime()) < 86400000)) mastery = Math.min(5, mastery + 1);
  state.questions[questionId] = {
    attempts: (prior && prior.attempts || 0) + 1,
    correct: (prior && prior.correct || 0) + (correct ? 1 : 0),
    wrong: (prior && prior.wrong || 0) + (correct ? 0 : 1),
    mastery: mastery,
    streak: correct ? ((prior && prior.streak) || 0) + 1 : 0,
    bestStreak: Math.max((prior && prior.bestStreak) || 0, correct ? ((prior && prior.streak) || 0) + 1 : 0),
    lastResult: correct ? 'correct' : 'wrong',
    lastAttemptAt: at,
    lastCorrectAt: correct ? at : (prior && prior.lastCorrectAt) || null,
    firstCorrectAt: (prior && prior.firstCorrectAt) || (correct ? at : null),
    recoveryLevel: correct ? Math.max(Number(prior && prior.recoveryLevel) || 0, nextErrorLevel(questionId, true)) : 0,
    nextReviewAt: correct ? nextReviewDate(questionId, at, true) : addMinutes(at, FIRST_REVIEW_MINUTES),
    areaId: q.areaId,
    confidence: q.confidence,
    lastSessionId: session ? session.id : null
  };
  var error = state.errors[questionId];
  if (correct) {
    if (error) {
      var lv = Math.min(RECOVERY_DAYS.length - 1, Math.max(0, Number(error.recoveryLevel) || 0));
      error.recoveryLevel = lv + 1;
      error.recoveredAt = error.recoveredAt || at;
      error.lastCorrectAt = at;
      error.nextReviewAt = addDays(at, RECOVERY_DAYS[lv]);
      error.confidence = q.confidence;
    }
  } else {
    if (!error) {
      error = {
        questionId: questionId,
        areaId: q.areaId,
        confidence: q.confidence,
        firstAt: at,
        lastAt: at,
        count: 0,
        recoveryLevel: 0,
        recoveredAt: null,
        nextReviewAt: null
      };
      state.errors[questionId] = error;
    }
    error.count = (Number(error.count) || 0) + 1;
    error.lastAt = at;
    error.lastWrongAt = at;
    error.recoveryLevel = 0;
    error.recoveredAt = null;
    error.nextReviewAt = addMinutes(at, FIRST_REVIEW_MINUTES);
    error.confidence = q.confidence;
  }
  state.academic.answered += 1;
  if (correct) state.academic.correct += 1; else state.academic.wrong += 1;
  state.academic.totalTimeMs += Math.max(0, Math.min(1800000, Number(durationMs) || 0));
  var area = state.academic.byArea[q.areaId];
  if (area) {
    area.answered += 1;
    area.totalTimeMs = (Number(area.totalTimeMs) || 0) + Math.max(0, Math.min(1800000, Number(durationMs) || 0));
    if (correct) area.correct += 1; else area.wrong += 1;
    if (q.confidence === 'alta' || q.confidence === 'media') {
      area.reliableAnswered += 1;
      if (correct) area.reliableCorrect += 1; else area.reliableWrong += 1;
    }
  }
  state.academic.recent.push({ at: at, correct: correct, areaId: q.areaId, confidence: q.confidence, durationMs: Math.max(0, Math.min(1800000, Number(durationMs) || 0)), mode: session ? session.mode : 'practice' });
  state.academic.recent = state.academic.recent.slice(-80);
  return { correct: correct, xp: xp, coins: coins, reason: mult.reason, mastery: mastery, suppressed: !!mult.suppressed, answer: q.answer };
}
function nextErrorLevel(questionId, correct) {
  var err = state.errors[questionId];
  return err ? Math.min(RECOVERY_DAYS.length - 1, Math.max(0, Number(err.recoveryLevel) || 0)) : 0;
}
function nextReviewDate(questionId, iso, correct) {
  var err = state.errors[questionId];
  var level = err ? Math.min(RECOVERY_DAYS.length - 1, Math.max(0, Number(err.recoveryLevel) || 0)) : 0;
  return addDays(iso, RECOVERY_DAYS[level]);
}
function dueErrors(now) {
  var t = (now ? new Date(now) : new Date()).getTime();
  return Object.keys(state.errors).map(function (id) { return state.errors[id]; }).filter(function (e) {
    if (!e || !QUESTION_BY_ID[e.questionId]) return false;
    var due = parseDate(e.nextReviewAt);
    return !due || due.getTime() <= t;
  }).sort(function (a, b) {
    if (!!a.recoveredAt !== !!b.recoveredAt) return a.recoveredAt ? 1 : -1;
    return String(a.nextReviewAt || '').localeCompare(String(b.nextReviewAt || ''));
  });
}
function errorStats() {
  var pending = 0, due = 0, recovered = 0, mastered = 0;
  Object.keys(state.errors).forEach(function (id) {
    var e = state.errors[id];
    if (!e) return;
    if (e.recoveredAt) recovered += 1; else pending += 1;
    if (Number(e.recoveryLevel) >= 2) mastered += 1;
    var at = parseDate(e.nextReviewAt);
    if ((!at || at.getTime() <= Date.now()) && QUESTION_BY_ID[e.questionId]) due += 1;
  });
  return { pending: pending, due: due, recovered: recovered, mastered: mastered, total: pending + recovered };
}
function sessionResult(session, reason) {
  var entries = session.orders.map(function (id) { return session.answers[id]; }).filter(Boolean);
  var answered = entries.filter(function (e) { return !e.omitted; }).length;
  var correct = entries.filter(function (e) { return e.correct; }).length;
  var wrong = entries.filter(function (e) { return !e.correct && !e.omitted; }).length;
  var omitted = session.questions.length - entries.length + entries.filter(function (e) { return e.omitted; }).length;
  var accuracy = answered ? correct / answered : 0;
  var allAnswered = answered >= session.questions.length;
  var pass = false;
  var label = 'La ruta exige completar la sesión.';
  if (reason === 'abandoned') label = 'Ruta abandonada: tus respuestas quedan guardadas, pero no hay recompensa de cierre.';
  else if (reason === 'hearts') label = 'Tus corazones se agotaron. La ruta queda abierta para volver a intentarlo.';
  else if (session.mode === 'mission') {
    pass = allAnswered && accuracy >= (RULES.missionPass || 0.6);
    label = pass ? 'Misión superada: la ruta queda registrada.' : 'La misión exige responder todo y al menos ' + Math.round((RULES.missionPass || 0.6) * 100) + '% de aciertos.';
  } else if (session.mode === 'boss') {
    var coverage = session.questions.length ? correct / session.questions.length : 0;
    pass = allAnswered && coverage >= (RULES.bossPass || 0.7);
    label = pass ? 'Jefe superado: el sello de la ruta es tuyo.' : 'El jefe exige al menos ' + Math.round((RULES.bossPass || 0.7) * 100) + '% de aciertos sobre el total.';
  } else if (session.mode === 'review') {
    pass = answered >= Math.min(3, session.questions.length) && accuracy >= (RULES.reviewPass || 0.5) && reason !== 'hearts';
    label = pass ? 'Repaso completado: la memoria vuelve a ordenarse.' : 'El repaso exige al menos ' + Math.min(3, session.questions.length) + ' respuestas y ' + Math.round((RULES.reviewPass || 0.5) * 100) + '% de aciertos.';
  } else if (session.mode === 'practice') {
    pass = answered >= 1;
    label = 'Práctica libre completada. Sin recompensa de cierre; tus respuestas alimentan las estadísticas.';
  } else if (session.mode === 'daily' || session.mode === 'survival' || session.mode === 'timed' || session.mode === 'simulacro') {
    if (session.mode === 'daily') {
      pass = answered >= session.questions.length && accuracy >= 0.6;
      label = pass ? 'Desafío diario completado.' : 'El desafío exige responder todo y al menos 60 % de aciertos.';
    } else if (session.mode === 'survival') {
      pass = (Number(session.hearts) || 0) > 0 && (answered + omitted) >= session.questions.length;
      label = pass ? 'Supervivencia completada.' : 'Sin oportunidades restantes: no hay recompensa de finalización.';
    } else {
      var coverage = session.questions.length ? correct / session.questions.length : 0;
      var minAns = session.mode === 'timed' ? 8 : 10;
      pass = coverage >= 0.7 && answered >= minAns;
      label = pass ? (session.mode === 'timed' ? 'Contrarreloj superado.' : 'Simulacro superado.') : 'La recompensa exige precisión sobre el total y respuestas suficientes, no solo velocidad.';
    }
  }
  if (reason === 'hearts') pass = false;
  if (reason === 'time' && (session.mode === 'timed' || session.mode === 'simulacro')) {
    var timedCoverage = session.questions.length ? correct / session.questions.length : 0;
    pass = timedCoverage >= 0.7 && answered >= (session.mode === 'timed' ? 8 : 10);
    if (!pass) label = 'El tiempo terminó antes de alcanzar la precisión y el mínimo de respuestas requeridos.';
  }
  return { answered: answered, correct: correct, wrong: wrong, omitted: omitted, accuracy: accuracy, allAnswered: allAnswered, pass: pass, label: label, total: session.questions.length };
}
function calcCompletionReward(session, result) {
  if (!result.pass) return { xp: 0, coins: 0, reason: result.label, duplicate: false };
  if (session.mode === 'mission' || session.mode === 'boss') {
    var wasCompleted = missionCompleted(session.missionId);
    if (wasCompleted) return { xp: 0, coins: 0, reason: 'Esta ruta ya estaba completada; no repite la recompensa de cierre.', duplicate: true };
    var m = MISSION_BY_ID[session.missionId];
    var xp = m.kind === 'boss' ? 80 : 30;
    var coins = m.kind === 'boss' ? 25 : 8;
    applyXpCoins(xp, coins);
    return { xp: xp, coins: coins, reason: 'Recompensa de cierre de ruta.', duplicate: false };
  }
  if (session.mode === 'review') {
    if (state.reviews.lastCompletedDate === dateKey()) return { xp: 0, coins: 0, reason: 'El bono diario de repaso ya fue registrado.', duplicate: true };
    state.reviews.lastCompletedDate = dateKey();
    state.reviews.completed += 1;
    applyXpCoins(30, 5);
    return { xp: 30, coins: 5, reason: 'Bono diario de repaso.', duplicate: false };
  }
  if (session.mode === 'daily' || session.mode === 'survival' || session.mode === 'timed' || session.mode === 'simulacro') {
    return modeCompletionReward(session, result);
  }
  return { xp: 0, coins: 0, reason: 'Sin recompensa de cierre.' };
}
function achievementMetrics() {
  var ms = currentMissionStats();
  var areasWithCorrect = 0, completedAreas = 0;
  CAMP.areas.forEach(function (a) {
    if (state.academic.byArea[a.id] && state.academic.byArea[a.id].reliableCorrect > 0) areasWithCorrect += 1;
    var route = areaMissions(a.id).filter(function (m) { return m.kind === 'mission'; });
    if (route.length && route.every(function (m) { return missionCompleted(m.id); })) completedAreas += 1;
  });
  return {
    answered: state.academic.answered,
    correct: state.academic.correct,
    accuracy: overallAccuracy(),
    missions: ms.missions,
    bosses: ms.bosses,
    mastered: masteredCount(),
    level: currentLevel(),
    coins: state.coins,
    areasCorrect: areasWithCorrect,
    areasCompleted: completedAreas,
    recoveries: Object.keys(state.errors).filter(function (id) { return state.errors[id].recoveredAt; }).length,
    dailyStreak: Math.max(state.daily.streak || 0, state.daily.bestStreak || 0),
    survivalWins: Number(state.modeStats && state.modeStats.survivalWins) || 0,
    timedAce: Number(state.modeStats && state.modeStats.timedAce) || 0,
    dailyWins: Number(state.modeStats && state.modeStats.dailyWins) || 0,
    survivalBest: Number(state.modeStats && state.modeStats.survivalBest) || 0,
    timedBest: Number(state.modeStats && state.modeStats.timedBest) || 0,
    simulacros: Number(state.modeStats && state.modeStats.simulacros) || 0
  };
}
function checkAchievements() {
  var metrics = achievementMetrics();
  var unlocked = [];
  CAMP.achievements.forEach(function (def) {
    if (state.achievements[def.id] && state.achievements[def.id].unlockedAt) return;
    var have = Number(metrics[def.metric]) || 0;
    if (def.metric === 'accuracy' && metrics.answered < 20) have = 0;
    if (have >= Number(def.target)) {
      state.achievements[def.id] = { unlockedAt: nowISO(), xp: def.xp, coins: def.coins };
      applyXpCoins(def.xp, def.coins);
      unlocked.push(def);
    }
  });
  return unlocked;
}
function syncCharacters() {
  var ms = currentMissionStats();
  var unlocked = [];
  CAMP.characters.forEach(function (char) {
    if (!char || state.collection.ownedCharacterIds.indexOf(char.id) !== -1) return;
    var access = char.access || {};
    if (access.kind === 'reward' && Number(access.missions || 0) > 0 && ms.missions >= Number(access.missions)) {
      state.collection.ownedCharacterIds.push(char.id);
      unlocked.push(char);
    }
  });
  return unlocked;
}
function heroRequirementState(char) {
  var owned = state.collection.ownedCharacterIds.indexOf(char.id) !== -1;
  var access = char.access || {};
  var ms = currentMissionStats();
  var lv = currentLevel();
  var levelNeed = Number(access.level || 0);
  var missionNeed = Number(access.missions || 0);
  var price = Number(char.price) || 0;
  if (owned) return { owned: true, canRecruit: false, kind: access.kind, price: price, char: char };
  if (access.kind === 'reward') {
    return {
      owned: false,
      kind: 'reward',
      price: 0,
      canRecruit: ms.missions >= missionNeed,
      missionsNeed: missionNeed,
      missionsHave: ms.missions,
      reason: ms.missions >= missionNeed ? 'La recompensa ya está lista.' : 'Completa ' + missionNeed + ' misiones (' + ms.missions + '/' + missionNeed + ').'
    };
  }
  var levelMet = !levelNeed || lv >= levelNeed;
  var coinsMet = state.coins >= price;
  var reason = '';
  if (!levelMet) reason = 'Alcanza el nivel ' + levelNeed + ' (nivel actual ' + lv + ').';
  else if (!coinsMet) reason = 'Te faltan ' + formatNumber(price - state.coins) + ' monedas.';
  else reason = 'Puedes reclamar a este héroe.';
  return {
    owned: false,
    kind: 'purchase',
    price: price,
    canRecruit: levelMet && coinsMet,
    levelNeed: levelNeed,
    levelHave: lv,
    levelMet: levelMet,
    coinsMet: coinsMet,
    missionsNeed: missionNeed,
    missionsHave: ms.missions,
    reason: reason
  };
}
function purchaseHero(heroId) {
  var char = CHARACTER_BY_ID[heroId];
  if (!char) return { ok: false, reason: 'Héroe desconocido.' };
  if (state.collection.ownedCharacterIds.indexOf(heroId) !== -1) return { ok: false, reason: 'Ya forma parte de tu colección.' };
  var req = heroRequirementState(char);
  if (!req.canRecruit) return { ok: false, reason: req.reason };
  if (req.kind === 'reward') {
    state.collection.ownedCharacterIds.push(heroId);
    persist();
    return { ok: true, free: true, char: char };
  }
  if (state.coins < req.price) return { ok: false, reason: 'No tienes monedas suficientes.' };
  state.coins -= req.price;
  state.collection.ownedCharacterIds.push(heroId);
  state.collection.unlockedBy = state.collection.unlockedBy || {};
  state.collection.unlockedBy[heroId] = { method: 'purchase', at: nowISO(), price: req.price };
  persist();
  return { ok: true, free: false, char: char, price: req.price };
}

/* -------------------------------------------------------------------------
   Importación del SERUMS QUEST original (esquema 2)
   ------------------------------------------------------------------------- */
function parseLegacyProgress(text) {
  if (!text || !String(text).trim()) throw new Error('El portapapeles o el archivo están vacíos.');
  var parsed;
  try { parsed = JSON.parse(String(text).trim()); } catch (e) { throw new Error('Ese archivo no contiene JSON válido.'); }
  if (parsed && parsed.app === 'SERUMS QUEST VOXEL') {
    var voxel = normalizeState(parsed.state || parsed);
    var vx = voxel.collection || {};
    return {
      state: voxel,
      kind: 'voxel',
      summary: {
        name: voxel.profile.name,
        xp: voxel.xp,
        coins: voxel.coins,
        level: levelAt(voxel.xp).level,
        rank: currentRankName(voxel),
        ownedCharacters: (vx.ownedCharacterIds || []).length,
        ownedCosmetics: (vx.ownedCosmeticIds || []).length,
        achievements: Object.keys(voxel.achievements || {}).length,
        missions: Object.keys(voxel.missions || {}).filter(function (id) { return voxel.missions[id] && voxel.missions[id].completedAt; }).length,
        errors: Object.keys(voxel.errors || {}).length,
        stage: voxel.stage,
        difficulties: [],
        missingCosmetics: 0,
        saveSchema: voxel.schema
      }
    };
  }
  if (parsed && parsed.app && parsed.app !== 'SERUMS QUEST') throw new Error('El archivo pertenece a otra aplicación, no a SERUMS QUEST.');
  var raw = parsed && parsed.state ? parsed.state : parsed;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('No encuentro un progreso reconocible dentro del archivo.');
  if (!parsed.state && raw.schemaVersion == null && !raw.profile && raw.xp == null) throw new Error('El archivo no parece una partida guardada de SERUMS QUEST.');
  var out = defaultState();
  out.profile.name = String((raw.profile && raw.profile.name) || 'Serumista').slice(0, 40);
  out.xp = numberField(raw.xp, 0);
  out.coins = numberField(raw.coins, 0);
  out.stage = clamp(numberField(raw.stage, 1), 1, 4);
  out.createdAt = raw.createdAt || out.createdAt;
  out.academic.answered = numberField(raw.academic && raw.academic.answered, 0);
  out.academic.correct = Math.min(out.academic.answered, numberField(raw.academic && raw.academic.correct, 0));
  out.academic.wrong = numberField(raw.academic && raw.academic.wrong, 0);
  out.academic.totalTimeMs = numberField(raw.academic && raw.academic.totalTimeMs, 0);
  out.academic.sessions = numberField(raw.academic && raw.academic.sessions, 0);
  var byArea = objField(raw.academic && raw.academic.byArea);
  CAMP.areas.forEach(function (a) {
    var src = objField(byArea[a.id]);
    out.academic.byArea[a.id] = {
      answered: numberField(src.answered, 0),
      correct: numberField(src.correct, 0),
      wrong: numberField(src.wrong, 0),
      reliableAnswered: numberField(src.reliableAnswered, 0),
      reliableCorrect: numberField(src.reliableCorrect, 0),
      reliableWrong: numberField(src.reliableWrong, 0)
    };
  });
  out.academic.recent = Array.isArray(raw.academic && raw.academic.recent) ? raw.academic.recent.slice(-80) : [];
  var rawQuestions = objField(raw.questions);
  Object.keys(rawQuestions).forEach(function (id) {
    if (QUESTION_BY_ID[id]) out.questions[id] = rawQuestions[id];
  });
  var rawErrors = objField(raw.errors);
  Object.keys(rawErrors).forEach(function (id) {
    if (QUESTION_BY_ID[id]) out.errors[id] = Object.assign({}, rawErrors[id], { questionId: id });
  });
  var rawMissions = objField(raw.missions);
  Object.keys(rawMissions).forEach(function (id) {
    if (MISSION_BY_ID[id]) out.missions[id] = rawMissions[id];
  });
  var rawAchievements = objField(raw.achievements);
  Object.keys(rawAchievements).forEach(function (id) {
    if (ACHIEVEMENT_BY_ID[id]) out.achievements[id] = rawAchievements[id];
  });
  var coll = objField(raw.collection);
  var ownedCharacters = Array.isArray(coll.ownedCharacterIds) ? coll.ownedCharacterIds.filter(function (id) { return CHARACTER_BY_ID[id]; }) : ['ilan'];
  if (ownedCharacters.indexOf('ilan') === -1) ownedCharacters.unshift('ilan');
  out.collection.ownedCharacterIds = Array.from(new Set(ownedCharacters));
  out.collection.ownedCosmeticIds = Array.isArray(coll.ownedCosmeticIds) ? Array.from(new Set(coll.ownedCosmeticIds.filter(function (id) { return COSMETIC_BY_ID[id]; }))) : [];
  out.collection.selectedCharacterId = CHARACTER_BY_ID[coll.selectedCharacterId] && out.collection.ownedCharacterIds.indexOf(coll.selectedCharacterId) !== -1 ? coll.selectedCharacterId : out.collection.ownedCharacterIds[0];
  out.collection.equipped = {};
  var rawEquipped = objField(coll.equipped);
  Object.keys(rawEquipped).forEach(function (charId) {
    if (out.collection.ownedCharacterIds.indexOf(charId) === -1) return;
    var outfit = objField(rawEquipped[charId]);
    var clean = {};
    Object.keys(outfit).forEach(function (slot) {
      if (COSMETIC_BY_ID[outfit[slot]] && out.collection.ownedCosmeticIds.indexOf(outfit[slot]) !== -1) clean[slot] = outfit[slot];
    });
    if (Object.keys(clean).length) out.collection.equipped[charId] = clean;
  });
  out.daily = Object.assign({}, out.daily, objField(raw.daily));
  if (raw.modeStats) out.modeStats = Object.assign({}, out.modeStats, objField(raw.modeStats));
  out.importedFrom = 'SERUMS QUEST ' + (raw.appVersion || '1.2.x');
  out.importedAt = nowISO();
  var difficulty = [];
  var unresolvedErrors = Object.keys(rawErrors).length - Object.keys(out.errors).length;
  var unresolvedMissions = Object.keys(rawMissions).length - Object.keys(out.missions).length;
  if (unresolvedErrors > 0) difficulty.push(unresolvedErrors + ' ' + plural(unresolvedErrors, 'error de una pregunta que no está', 'errores de preguntas que no están') + ' en la campaña actual');
  if (unresolvedMissions > 0) difficulty.push(unresolvedMissions + ' ' + plural(unresolvedMissions, 'misión o modo fuera', 'misiones o modos fuera') + ' de la campaña');
  return {
    state: out,
    summary: {
      name: out.profile.name,
      xp: out.xp,
      coins: out.coins,
      level: levelAt(out.xp).level,
      rank: currentRankName(out),
      ownedCharacters: out.collection.ownedCharacterIds.length,
      ownedCosmetics: out.collection.ownedCosmeticIds.length,
      achievements: Object.keys(out.achievements).length,
      missions: Object.keys(out.missions).filter(function (id) { return out.missions[id] && out.missions[id].completedAt; }).length,
      errors: Object.keys(out.errors).length,
      stage: out.stage,
      difficulties: difficulty,
      missingCosmetics: Array.isArray(coll.ownedCosmeticIds) ? coll.ownedCosmeticIds.filter(function (id) { return !COSMETIC_BY_ID[id]; }).length : 0
    }
  };
}
function currentRankName(snapshot) {
  var ranks = CAMP.rules.ranks.slice().sort(function (a, b) { return a.xp - b.xp; });
  var ms = { missions: 0, bosses: 0 };
  Object.keys(snapshot.missions || {}).forEach(function (id) {
    var m = snapshot.missions[id];
    if (!m || !m.completedAt) return;
    if (MISSION_BY_ID[id] && MISSION_BY_ID[id].kind === 'boss') ms.bosses += 1; else ms.missions += 1;
  });
  var answered = snapshot.academic.answered || 0;
  var accuracy = answered ? (snapshot.academic.correct || 0) / answered : 0;
  var mastered = Object.keys(snapshot.questions || {}).filter(function (id) { return Number((snapshot.questions[id] || {}).mastery) >= 3; }).length;
  var areas = CAMP.areas.filter(function (a) { return snapshot.academic.byArea && snapshot.academic.byArea[a.id] && snapshot.academic.byArea[a.id].reliableCorrect > 0; }).length;
  var chosen = ranks[0];
  ranks.forEach(function (r) {
    if ((snapshot.xp || 0) >= r.xp && answered >= r.answered && accuracy >= r.accuracy && mastered >= r.mastered && areas >= r.areas && ms.bosses >= r.bosses) chosen = r;
  });
  return chosen.name;
}
function applyLegacyImport(candidate) {
  backupCurrentState('previous-state');
  state = candidate;
  state.updatedAt = nowISO();
  persist();
  saveSettings();
}

function findLegacyLocalState() {
  var keys = ['serumsquest:state:v1', 'serumsquest:backup:v1', 'serumsquest:journal:v1'];
  for (var i = 0; i < keys.length; i++) {
    try {
      var raw = window.localStorage.getItem(keys[i]);
      if (!raw) continue;
      var parsed = JSON.parse(raw);
      var text = JSON.stringify(parsed.state || parsed.value || parsed);
      if (text && text.length > 20) return { key: keys[i], text: text };
    } catch (e) {}
  }
  return null;
}

/* -------------------------------------------------------------------------
   Utilidades de juego
   ------------------------------------------------------------------------- */
function totalMissionPractice() {
  return Object.keys(state.questions).length;
}
function nextDueLabel() {
  var due = dueErrors();
  if (!due.length) return null;
  return due.length + ' ' + plural(due.length, 'pregunta', 'preguntas') + ' por repasar';
}
function areaName(id) { return AREA_BY_ID[id] ? AREA_BY_ID[id].short : 'Ruta'; }
function heroName(id) {
  if (CHARACTER_BY_ID[id]) return CHARACTER_BY_ID[id].name;
  return 'Ilan Vega';
}
function selectedCharacter() {
  return CHARACTER_BY_ID[state.collection.selectedCharacterId] || CAMP.characters[0];
}
function selectedLook() {
  return HERO_LOOKS[state.collection.selectedCharacterId] || HERO_LOOKS.ilan;
}
function missionConditionLabel(m) {
  if (missionCompleted(m.id)) return 'Completada';
  var u = missionUnlockInfo(m);
  if (u.unlocked) return 'Disponible';
  return 'Bloqueada';
}
function cosmeticCountOwned() { return state.collection.ownedCosmeticIds.length; }
function activeMissionQuestionStats(session) {
  if (!session) return [];
  return session.questions.map(function (qid, index) {
    return { index: index, answered: !!session.answers[qid], current: index === session.cursor };
  });
}
function validateLegacySummary(summary) { return summary && summary.name ? summary : null; }

/* -------------------------------------------------------------------------
   Sonido sintetizado
   ------------------------------------------------------------------------- */
var audioCtx = null;
var ambientNodes = null;
function initAudio() {
  if (!state.settings.sound || state.settings.muted) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (state.settings.ambient) startAmbient();
  } catch (e) { audioCtx = null; }
}
function tone(freq, duration, type, volume, slideTo) {
  if (!audioCtx || !state.settings.sound || state.settings.muted) return;
  var vol = Math.max(0, Number(state.settings.volume == null ? 0.7 : state.settings.volume));
  if (!vol) return;
  try {
    var now = audioCtx.currentTime;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    gain.gain.setValueAtTime(Math.max(0.0001, (volume || 0.04) * vol), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  } catch (e) {}
}
function chord(freqs, duration, volume) {
  freqs.forEach(function (f, i) {
    window.setTimeout(function () { tone(f, duration, 'triangle', volume || 0.03); }, i * 70);
  });
}
function startAmbient() {
  if (ambientNodes || !audioCtx || !state.settings.sound || !state.settings.ambient || state.settings.muted) return;
  try {
    var master = audioCtx.createGain();
    master.gain.value = 0.018 * Math.max(0, Number(state.settings.volume == null ? 0.7 : state.settings.volume));
    master.connect(audioCtx.destination);
    var filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    filter.Q.value = 0.6;
    filter.connect(master);
    var freqs = [55, 82.41, 110, 164.81];
    var nodes = freqs.map(function (f, idx) {
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = idx % 2 ? 'sine' : 'triangle';
      osc.frequency.value = f;
      gain.gain.value = idx === 0 ? 0.5 : 0.17;
      osc.connect(gain).connect(filter);
      osc.start();
      return { osc: osc, gain: gain };
    });
    ambientNodes = { master: master, nodes: nodes, filter: filter };
  } catch (e) {}
}
function stopAmbient() {
  if (!ambientNodes) return;
  try {
    ambientNodes.nodes.forEach(function (n) { try { n.osc.stop(); } catch (e) {} });
    ambientNodes.master.disconnect();
  } catch (e) {}
  ambientNodes = null;
}
function sfxClick() { tone(740, 0.05, 'triangle', 0.025); }
function sfxSelect() { tone(520, 0.08, 'sine', 0.03, 680); }
function sfxAttack() { tone(190, 0.18, 'sawtooth', 0.035, 86); tone(370, 0.1, 'triangle', 0.022, 720); }
function sfxHit() { tone(120, 0.22, 'square', 0.03, 62); }
function sfxCorrect() { chord([523.25, 659.25, 783.99], 0.22, 0.026); }
function sfxWrong() { tone(145, 0.28, 'sawtooth', 0.03, 92); }
function sfxVictory() { chord([392, 523.25, 659.25, 783.99], 0.5, 0.028); }
function sfxDefeat() { chord([196, 164.81, 130.81], 0.55, 0.026); }
function sfxPurchase() { chord([440, 554.37, 659.25], 0.18, 0.022); }
function sfxAchievement() { chord([659.25, 783.99, 1046.5], 0.35, 0.022); }
function setSoundEnabled(enabled) {
  state.settings.sound = !!enabled;
  if (state.settings.sound) {
    state.settings.muted = false;
    initAudio();
    if (state.settings.ambient) startAmbient();
    sfxSelect();
  } else {
    stopAmbient();
  }
  saveSettings();
  persist();
}
function setAmbientEnabled(enabled) {
  state.settings.ambient = !!enabled;
  if (state.settings.ambient) {
    state.settings.sound = true;
    state.settings.muted = false;
    initAudio();
    startAmbient();
  } else {
    stopAmbient();
  }
  saveSettings();
  persist();
}
function setMuted(enabled) {
  state.settings.muted = !!enabled;
  if (state.settings.muted) stopAmbient();
  else if (state.settings.sound) {
    initAudio();
    if (state.settings.ambient) startAmbient();
    sfxSelect();
  }
  saveSettings();
  persist();
}
window.__audioProbe = function () {
  return {
    context: audioCtx ? audioCtx.state : 'none',
    sound: !!state.settings.sound,
    ambient: !!state.settings.ambient,
    muted: !!state.settings.muted,
    volume: Number(state.settings.volume) || 0,
    ambientRunning: !!ambientNodes
  };
};
function setVolume(value) {
  state.settings.volume = clamp(Number(value) || 0, 0, 1);
  if (ambientNodes && ambientNodes.master) {
    try { ambientNodes.master.gain.value = 0.018 * state.settings.volume; } catch (e) {}
  }
  saveSettings();
  persist();
}
function applyMotionSetting() {
  if (document && document.body) document.body.classList.toggle('reduced-motion', !!state.settings.reducedMotion);
}
function setReducedMotion(enabled) {
  state.settings.reducedMotion = !!enabled;
  applyMotionSetting();
  saveSettings();
  persist();
}
function setExtraTime(enabled) {
  state.settings.extraTime = !!enabled;
  saveSettings();
  persist();
}

/* -------------------------------------------------------------------------
   Runtime UI base
   ------------------------------------------------------------------------- */
var screen = 'boot';
var view = 'hub';
var selectedAreaId = CAMP.areas[0].id;
var selectedMissionId = null;
var FINAL_RELEASE = true;
var session = null;
var pausedDuel = false;
var lastFeedback = null;
var lastResult = null;
var importPreview = null;
var importText = '';
var toastTimer = 0;
var loadingHidden = false;
var touchInput = { x: 0, z: 0 };
var virtualKeys = {};
var lastFrameTime = performance.now();
var fps = 60;
var nowMs = 0;
var victoryAt = 0;

EL.root = document.getElementById('ui') || (function () {
  var n = document.createElement('div');
  n.id = 'ui';
  document.body.appendChild(n);
  return n;
})();
EL.root.innerHTML = '<div id="loading" class="loadingShell"><div><div class="loadingRune"></div><b>Abriendo el observatorio</b><small>Las cinco rutas esperan. Cargando la campaña y los modelos voxel.</small></div></div>' +
  '<header id="hud" class="hud hidden"></header>' +
  '<div id="tracker" class="tracker hidden"></div>' +
  '<div id="prompt" class="prompt hidden"><kbd>E</kbd><span></span></div>' +
  '<div id="hintRow" class="hintRow hidden"><span><kbd>WASD</kbd> mover</span><span><kbd>E</kbd> interactuar</span><span><kbd>M</kbd> bitácora</span><span><kbd>R</kbd> repaso</span><span><kbd>Esc</kbd> pausa</span></div>' +
  '<div id="screen" class="screenRoot"></div>' +
  '<div id="touchControls" class="touchControls"><div id="joystickBase" class="joystick" role="group" aria-label="Joystick de movimiento"><div id="joystickThumb" class="joystickThumb"></div></div><div class="touchQuick"><button type="button" class="touchQuickBtn" data-action="open-map" aria-label="Abrir mapa">' + icon('map', 17) + '<span>Mapa</span></button><button type="button" class="touchQuickBtn" data-action="open-pause" aria-label="Abrir pausa">' + icon('pause', 17) + '<span>Pausa</span></button></div></div>' +
  '<button id="touchAction" class="touchAction hidden" type="button" aria-label="Interactuar">' + icon('spark', 20) + '<span>E</span></button>' +
  '<div id="rotatePrompt" class="rotatePrompt" aria-live="polite"><div><span class="rotateIcon">' + icon('rotate', 30) + '</span><b>Gira el dispositivo.</b><p>Este observatorio se juega mejor en horizontal. Gira el teléfono para ver el mapa, el duelo y los paneles completos.</p></div></div>' +
  '<div id="toastStack" class="toastStack"></div>' +
  '<div id="hitFlash" class="hitFlash"></div>' +
  '<div id="attackFlash" class="attackFlash"></div>' +
  '<div id="fadeLayer" class="fadeLayer"></div>';
EL.hud = document.getElementById('hud');
EL.tracker = document.getElementById('tracker');
EL.prompt = document.getElementById('prompt');
EL.hintRow = document.getElementById('hintRow');
EL.screen = document.getElementById('screen');
EL.touchControls = document.getElementById('touchControls');
EL.touchAction = document.getElementById('touchAction');
EL.toastStack = document.getElementById('toastStack');
EL.hitFlash = document.getElementById('hitFlash');
EL.attackFlash = document.getElementById('attackFlash');
EL.fadeLayer = document.getElementById('fadeLayer');

function toast(message, tone, duration) {
  if (!EL.toastStack) return;
  var node = document.createElement('div');
  node.className = 'toast ' + (tone ? 'is-' + tone : '');
  node.innerHTML = icon(tone === 'error' ? 'alert' : (tone === 'warn' ? 'info' : 'checkCircle'), 15) + '<div>' + esc(message) + '</div>';
  EL.toastStack.appendChild(node);
  window.setTimeout(function () {
    node.style.opacity = '0';
    node.style.transform = 'translateY(7px)';
    node.style.transition = 'opacity 180ms ease, transform 180ms ease';
    window.setTimeout(function () { node.remove(); }, 220);
  }, duration || 3600);
}
function setLoading(show) {
  var el = document.getElementById('loading');
  if (!el) return;
  if (show) { el.classList.remove('hidden'); loadingHidden = false; }
  else { el.classList.add('hidden'); loadingHidden = true; }
}
function flashHit() {
  EL.hitFlash.classList.remove('is-on');
  void EL.hitFlash.offsetWidth;
  EL.hitFlash.classList.add('is-on');
}
function flashAttack() {
  EL.attackFlash.classList.remove('is-on');
  void EL.attackFlash.offsetWidth;
  EL.attackFlash.classList.add('is-on');
}
