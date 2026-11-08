/* =========================================================================
   SERUMS QUEST · V2 · AGENTE 6 — mundo interactivo del atrio
   Cofres escondidos, fragmentos de conocimiento, guías por isla,
   telescopio y biblioteca de repaso, sombras del error y restauración
   visual por dominio.

   Todo es geometría/canvas generada en código: sin red, sin imágenes IA,
   sin archivos externos. ES5 (var/function) y defensivo si falta THREE,
   hubGroup, una función del juego o el DOM.

   La restauración de cada puerta guarda su nivel máximo en
   state.v2.world.restored[areaId]: nunca retrocede y se persiste al subir.

   API pública: V2.world = { boot, update, nearest, interact, close,
   isOpen, refreshShadows, save, stats, ids }.
   ========================================================================= */

/* -------------------------------------------------------------------------
   Puente con el núcleo V2
   ------------------------------------------------------------------------- */
function v2wCore() {
  try {
    if (typeof V2 !== 'undefined' && V2) return V2;
  } catch (e) {}
  try { return window.__SERUMS_V2__ || null; } catch (e2) { return null; }
}
function v2wSoft(error) {
  var core = v2wCore();
  try { if (core && core.softError) core.softError('world', error); } catch (e) {}
}
function v2wQuality() {
  var q = 'medio';
  try {
    var core = v2wCore();
    if (core && core.quality) q = core.quality();
  } catch (e) {}
  if (q !== 'bajo' && q !== 'medio' && q !== 'alto') q = 'medio';
  return q;
}
function v2wReducedMotion() {
  try {
    var core = v2wCore();
    if (core && core.reducedMotion) return !!core.reducedMotion();
  } catch (e) {}
  try {
    if (typeof state !== 'undefined' && state && state.settings && state.settings.reducedMotion) return true;
  } catch (e2) {}
  try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e3) { return false; }
}
function v2wIsTouch() {
  try {
    var core = v2wCore();
    if (core && core.isTouch) return !!core.isTouch();
  } catch (e) {}
  try { return !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); } catch (e2) { return false; }
}
function v2wEmit(type, payload) {
  try {
    var core = v2wCore();
    if (core && core.emit) core.emit(type, payload || null);
  } catch (e) {}
}
function v2wNoop() {}
function v2wIsFunction(value) {
  return typeof value === 'function';
}
function v2wClamp(value, min, max) {
  var n = Number(value);
  if (!isFinite(n)) n = min;
  return Math.max(min, Math.min(max, n));
}

/* -------------------------------------------------------------------------
   Constantes de diseño
   ------------------------------------------------------------------------- */
var V2W_VERSION = '2.0.0-world';
var V2W_INTERACT_RADIUS = 1.25;
var V2W_REFRESH_MS = 2000;
var V2W_CHEST_XP = 5;
var V2W_CHEST_COINS = 5;
var V2W_FRAGMENT_XP = 5;
var V2W_GUIDE_XP = 5;

/* Reparto alrededor de cada puerta (radianes desde el ángulo de la puerta).
   Las puertas están a radio 7.1 y el atrio camina hasta 8.95. */
var V2W_LAYOUT = {
  chestRadius: 8.15,
  chestOffset: 0,
  shadowRadius: 6.55,
  shadowOffset: -0.14,
  guideRadius: 5.60,
  guideOffset: 0.56,
  fragARadius: 4.00,
  fragAOffset: 0.1745,
  fragBRadius: 5.15,
  fragBOffset: -0.3491
};
var V2W_GATE_ANGLES = [202, 274, 346, 58, 130];

/* Catálogo pedagógico: 5 áreas, 15 fragmentos (10 libres + 5 en cofres) y
   5 guías. Los textos clínicos no se escriben aquí: se leen del banco. */
var V2W_AREAS = [
  {
    id: 'area-psi-salud-publica',
    key: 'salud-publica',
    guide: { name: 'Killa', role: 'vigía comunitaria', questionId: '2026-i-psicologia-q069' },
    fragments: [
      { id: 'v2w-frag-salud-publica-1', slot: 'free', questionId: 'v2-fc-card-ottawa-01-2', title: 'Las cinco estrategias de Ottawa' },
      { id: 'v2w-frag-salud-publica-2', slot: 'free', questionId: 'v2-fc-card-modelo-sujetos-01-2', title: 'Escenarios de promoción' },
      { id: 'v2w-frag-salud-publica-c', slot: 'chest', questionId: 'v2-fc-card-agua-01-2', title: 'Agua segura y coliformes' }
    ]
  },
  {
    id: 'area-psi-cuidado-integral',
    key: 'cuidado-integral',
    guide: { name: 'Nampi', role: 'acompañante de cuidado', questionId: '2026-i-psicologia-q082' },
    fragments: [
      { id: 'v2w-frag-cuidado-integral-1', slot: 'free', questionId: 'v2-fc-card-aps-01-2', title: 'Longitudinalidad en APS' },
      { id: 'v2w-frag-cuidado-integral-2', slot: 'free', questionId: 'v2-fc-card-adulto-01-2', title: 'Captación en cualquier contacto' },
      { id: 'v2w-frag-cuidado-integral-c', slot: 'chest', questionId: 'v2-fc-card-adolescente-01-2', title: 'Adolescente que acude solo' }
    ]
  },
  {
    id: 'area-psi-etica',
    key: 'etica',
    guide: { name: 'Atoq', role: 'custodio del acuerdo', questionId: '2025-i-psicologia-q036' },
    fragments: [
      { id: 'v2w-frag-etica-1', slot: 'free', questionId: 'v2-fc-card-psi-et-1-3-2', title: 'Consentimiento informado, no solo una firma' },
      { id: 'v2w-frag-etica-2', slot: 'free', questionId: 'v2-fc-card-psi-et-2-1-2', title: 'Intérprete competente y privacidad' },
      { id: 'v2w-frag-etica-c', slot: 'chest', questionId: 'v2-fc-card-psi-et-1-1-2', title: 'Confidencialidad frente a terceros' }
    ]
  },
  {
    id: 'area-psi-investigacion',
    key: 'investigacion',
    guide: { name: 'Suni', role: 'analista de evidencia', questionId: '2026-i-psicologia-q029' },
    fragments: [
      { id: 'v2w-frag-investigacion-1', slot: 'free', questionId: 'v2-fc-card-psi-in-1-1-2', title: 'Escalas: ordinal, intervalo y razón' },
      { id: 'v2w-frag-investigacion-2', slot: 'free', questionId: 'v2-fc-card-psi-in-2-1-2', title: 'Alfa de Cronbach y validez de contenido' },
      { id: 'v2w-frag-investigacion-c', slot: 'chest', questionId: 'v2-fc-card-psi-in-3-2-2', title: 'Criterios de autoría' }
    ]
  },
  {
    id: 'area-psi-gestion',
    key: 'gestion',
    guide: { name: 'Tawa', role: 'tejedora de procesos', questionId: '2026-i-psicologia-q055' },
    fragments: [
      { id: 'v2w-frag-gestion-1', slot: 'free', questionId: 'v2-fc-card-psi-ge-1-2-2', title: 'Amenazas del entorno en el FODA' },
      { id: 'v2w-frag-gestion-2', slot: 'free', questionId: 'v2-fc-card-psi-ge-2-6-2', title: 'Redes integradas de salud' },
      { id: 'v2w-frag-gestion-c', slot: 'chest', questionId: 'v2-fc-card-psi-ge-3-1-2', title: 'Productividad y rendimiento' }
    ]
  }
];

/* -------------------------------------------------------------------------
   Utilidades de datos
   ------------------------------------------------------------------------- */
function v2wNowISO() {
  try { if (v2wIsFunction(nowISO)) return nowISO(); } catch (e) {}
  try { return new Date().toISOString(); } catch (e2) { return ''; }
}
function v2wShortDate(iso) {
  if (!iso) return '—';
  try { if (v2wIsFunction(shortDate)) return shortDate(iso); } catch (e) {}
  try {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
  } catch (e2) { return '—'; }
}
function v2wPlural(n, one, many) {
  try { if (v2wIsFunction(plural)) return plural(n, one, many); } catch (e) {}
  return Number(n) === 1 ? one : (many || one + 's');
}
function v2wEscape(value) {
  try { if (v2wIsFunction(esc)) return esc(value); } catch (e) {}
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function v2wIcon(name, size) {
  try { if (v2wIsFunction(icon)) return icon(name, size); } catch (e) {}
  return '';
}
function v2wAreaById(areaId) {
  try {
    if (typeof AREA_BY_ID !== 'undefined' && AREA_BY_ID && AREA_BY_ID[areaId]) return AREA_BY_ID[areaId];
  } catch (e) {}
  try {
    if (typeof CAMP !== 'undefined' && CAMP && CAMP.areas) {
      for (var i = 0; i < CAMP.areas.length; i++) {
        if (CAMP.areas[i] && CAMP.areas[i].id === areaId) return CAMP.areas[i];
      }
    }
  } catch (e2) {}
  return null;
}
function v2wAreaShort(area) {
  if (!area) return 'Ruta';
  if (area.short) return area.short;
  if (area.title) return String(area.title).replace(/^Área [IVX]+ · /, '');
  return 'Ruta';
}
function v2wAreaIndex(areaId) {
  try {
    if (typeof CAMP !== 'undefined' && CAMP && CAMP.areas) {
      for (var i = 0; i < CAMP.areas.length; i++) if (CAMP.areas[i] && CAMP.areas[i].id === areaId) return i;
    }
  } catch (e) {}
  return -1;
}
function v2wAreaMissions(areaId) {
  try { if (v2wIsFunction(areaMissions)) { var list = areaMissions(areaId); if (list) return list; } } catch (e) {}
  var out = [];
  try {
    if (typeof CAMP !== 'undefined' && CAMP && CAMP.missions) {
      for (var i = 0; i < CAMP.missions.length; i++) {
        if (CAMP.missions[i] && CAMP.missions[i].areaId === areaId) out.push(CAMP.missions[i]);
      }
    }
  } catch (e2) {}
  return out;
}
function v2wAreaProgress(areaId) {
  try {
    if (v2wIsFunction(areaProgress)) {
      var p = areaProgress(areaId);
      if (p && typeof p.done === 'number') return p;
    }
  } catch (e) {}
  var list = v2wAreaMissions(areaId);
  var done = 0;
  for (var i = 0; i < list.length; i++) {
    try { if (state.missions[list[i].id] && state.missions[list[i].id].completedAt) done += 1; } catch (e2) {}
  }
  return { done: done, total: list.length, pct: list.length ? done / list.length : 0 };
}
function v2wQuestion(questionId) {
  if (!questionId) return null;
  try {
    if (typeof QUESTION_BY_ID !== 'undefined' && QUESTION_BY_ID && QUESTION_BY_ID[questionId]) return QUESTION_BY_ID[questionId];
  } catch (e) {}
  return null;
}
function v2wAnswerText(q) {
  if (!q) return '';
  try {
    if (q.options) {
      for (var i = 0; i < q.options.length; i++) {
        var opt = q.options[i];
        if (!opt) continue;
        if (opt.id === q.answer) return String(opt.text || q.answer || '');
      }
    }
  } catch (e) {}
  return q.answer ? String(q.answer) : '';
}
function v2wExcerpt(text, maxLength) {
  var s = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
  if (!s) return '';
  var max = Number(maxLength) || 210;
  if (s.length <= max) return s;
  var cut = s.slice(0, max);
  var lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '), cut.lastIndexOf(': '));
  if (lastStop > max * 0.52) return cut.slice(0, lastStop + 1).trim();
  var lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > max * 0.6) cut = cut.slice(0, lastSpace);
  return cut.replace(/[.,;:\s]+$/, '') + '…';
}
function v2wHexToRgb(hex) {
  var h = String(hex == null ? '#7aa2ff' : hex).replace('#', '');
  if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
  if (h.length < 6) h = '7aa2ff';
  var r = parseInt(h.slice(0, 2), 16);
  var g = parseInt(h.slice(2, 4), 16);
  var b = parseInt(h.slice(4, 6), 16);
  if (!isFinite(r)) r = 122;
  if (!isFinite(g)) g = 162;
  if (!isFinite(b)) b = 255;
  return { r: r, g: g, b: b };
}
function v2wRgbHex(r, g, b) {
  function part(n) {
    var v = Math.round(v2wClamp(n, 0, 255));
    var s = v.toString(16);
    return s.length < 2 ? '0' + s : s;
  }
  return '#' + part(r) + part(g) + part(b);
}
function v2wMixHex(hexA, hexB, t) {
  var a = v2wHexToRgb(hexA);
  var b = v2wHexToRgb(hexB);
  var k = v2wClamp(t, 0, 1);
  return v2wRgbHex(a.r + (b.r - a.r) * k, a.g + (b.g - a.g) * k, a.b + (b.b - a.b) * k);
}
function v2wRound(value, decimals) {
  var f = Math.pow(10, Number(decimals) || 0);
  return Math.round(Number(value) * f) / f;
}

/* -------------------------------------------------------------------------
   Catálogo de interacciones (posiciones del atrio)
   ------------------------------------------------------------------------- */
var v2wCatalogReady = false;
var v2wChests = [];
var v2wChestById = {};
var v2wGuides = [];
var v2wGuideById = {};
var v2wFrags = [];
var v2wFragById = {};
var v2wStations = [];
var v2wStationById = {};
var v2wShadows = [];
var v2wShadowById = {};
var v2wItems = [];
var v2wItemById = {};
var v2wMarkers = [];
var v2wIds = null;
var v2wFreeFrags = [];

function v2wFindGate(areaId) {
  try {
    if (typeof gateGroups !== 'undefined' && gateGroups && gateGroups.length) {
      for (var i = 0; i < gateGroups.length; i++) {
        var g = gateGroups[i];
        if (g && g.area && g.area.id === areaId) return g;
      }
    }
  } catch (e) {}
  return null;
}
function v2wGateAngle(gate, index) {
  if (gate) {
    if (typeof gate.angle === 'number' && isFinite(gate.angle)) return gate.angle;
    if (gate.position && isFinite(gate.position.x) && isFinite(gate.position.z)) {
      return Math.atan2(gate.position.z, gate.position.x);
    }
  }
  var deg = V2W_GATE_ANGLES[index] || 0;
  return deg * Math.PI / 180;
}
function v2wPolarX(angle, radius) { return Math.cos(angle) * radius; }
function v2wPolarZ(angle, radius) { return Math.sin(angle) * radius; }
function v2wYawToCenter(x, z) { return Math.atan2(-x, -z); }

function v2wBuildCatalog() {
  if (v2wCatalogReady) return;
  v2wChests = [];
  v2wChestById = {};
  v2wGuides = [];
  v2wGuideById = {};
  v2wFrags = [];
  v2wFragById = {};
  v2wStations = [];
  v2wStationById = {};
  v2wShadows = [];
  v2wShadowById = {};
  v2wItems = [];
  v2wItemById = {};
  v2wMarkers = [];
  v2wFreeFrags = [];
  v2wGuideScreenCache = {};
  var stationDefs = [
    { id: 'v2w-telescope', kind: 'telescope', label: 'Telescopio del repaso', angle: 99, radius: 3.05, accent: '#7AA2FF', markerY: 2.02, phase: 0.4 },
    { id: 'v2w-library', kind: 'library', label: 'Biblioteca de fichas', angle: 250, radius: 3.05, accent: '#69D3C1', markerY: 2.46, phase: 1.9 }
  ];
  var i, j, def, area, gate, angle, shortLabel, accent;
  for (i = 0; i < V2W_AREAS.length; i++) {
    def = V2W_AREAS[i];
    area = v2wAreaById(def.id) || { id: def.id, short: def.key, title: def.key, accent: '#7AA2FF', blurb: '' };
    gate = v2wFindGate(def.id);
    angle = v2wGateAngle(gate, i);
    shortLabel = v2wAreaShort(area);
    accent = area.accent || '#7AA2FF';

    var chestId = 'v2w-chest-' + def.key;
    var chestFrag = null;
    for (j = 0; j < def.fragments.length; j++) {
      if (def.fragments[j].slot === 'chest') { chestFrag = def.fragments[j]; break; }
    }
    var chestX = v2wPolarX(angle + V2W_LAYOUT.chestOffset, V2W_LAYOUT.chestRadius);
    var chestZ = v2wPolarZ(angle + V2W_LAYOUT.chestOffset, V2W_LAYOUT.chestRadius);
    var chest = {
      id: chestId, kind: 'chest', areaId: def.id, key: def.key, short: shortLabel, accent: accent,
      angle: angle, x: chestX, z: chestZ, yaw: v2wYawToCenter(chestX, chestZ),
      fragmentId: chestFrag ? chestFrag.id : null,
      opened: false, markerIndex: -1, phase: i * 1.17,
      label: 'Cofre de ' + shortLabel
    };
    v2wChests.push(chest);
    v2wChestById[chestId] = chest;

    var guideX = v2wPolarX(angle + V2W_LAYOUT.guideOffset, V2W_LAYOUT.guideRadius);
    var guideZ = v2wPolarZ(angle + V2W_LAYOUT.guideOffset, V2W_LAYOUT.guideRadius);
    var guideId = 'v2w-guide-' + def.key;
    var guide = {
      id: guideId, kind: 'guide', areaId: def.id, key: def.key, short: shortLabel, accent: accent,
      angle: angle, x: guideX, z: guideZ, yaw: v2wYawToCenter(guideX, guideZ),
      name: def.guide.name, role: def.guide.role, questionId: def.guide.questionId,
      completed: false, markerIndex: -1, phase: i * 1.31, bob: 0,
      label: def.guide.name + ' · ' + shortLabel
    };
    v2wGuides.push(guide);
    v2wGuideById[guideId] = guide;

    var shadowX = v2wPolarX(angle + V2W_LAYOUT.shadowOffset, V2W_LAYOUT.shadowRadius);
    var shadowZ = v2wPolarZ(angle + V2W_LAYOUT.shadowOffset, V2W_LAYOUT.shadowRadius);
    var shadowId = 'v2w-shadow-' + def.key;
    var shadow = {
      id: shadowId, kind: 'shadow', areaId: def.id, key: def.key, short: shortLabel, accent: accent,
      angle: angle, x: shadowX, z: shadowZ, yaw: v2wYawToCenter(shadowX, shadowZ),
      count: 0, active: false, index: v2wShadows.length, phase: i * 0.93,
      label: 'Sombra del error · ' + shortLabel
    };
    v2wShadows.push(shadow);
    v2wShadowById[shadowId] = shadow;

    for (j = 0; j < def.fragments.length; j++) {
      var fdef = def.fragments[j];
      var fx = null, fz = null;
      if (fdef.slot !== 'chest') {
        if (j === 0) {
          fx = v2wPolarX(angle + V2W_LAYOUT.fragAOffset, V2W_LAYOUT.fragARadius);
          fz = v2wPolarZ(angle + V2W_LAYOUT.fragAOffset, V2W_LAYOUT.fragARadius);
        } else {
          fx = v2wPolarX(angle + V2W_LAYOUT.fragBOffset, V2W_LAYOUT.fragBRadius);
          fz = v2wPolarZ(angle + V2W_LAYOUT.fragBOffset, V2W_LAYOUT.fragBRadius);
        }
      }
      var frag = {
        id: fdef.id, kind: 'fragment', areaId: def.id, key: def.key, short: shortLabel, accent: accent,
        slot: fdef.slot, questionId: fdef.questionId, title: fdef.title,
        x: fx, z: fz, yaw: fx == null ? 0 : v2wYawToCenter(fx, fz),
        chestId: fdef.slot === 'chest' ? chestId : null,
        collected: false, markerIndex: -1, crystalIndex: -1,
        phase: i * 0.77 + j * 1.41,
        label: 'Fragmento · ' + fdef.title
      };
      v2wFrags.push(frag);
      v2wFragById[frag.id] = frag;
      if (frag.slot === 'free') v2wFreeFrags.push(frag);
    }
  }

  for (i = 0; i < stationDefs.length; i++) {
    var sd = stationDefs[i];
    var sAngle = Number(sd.angle) * Math.PI / 180;
    var sx = v2wPolarX(sAngle, sd.radius);
    var sz = v2wPolarZ(sAngle, sd.radius);
    var station = {
      id: sd.id, kind: sd.kind, areaId: null, key: sd.kind, short: sd.label, accent: sd.accent,
      angle: sAngle, x: sx, z: sz, yaw: v2wYawToCenter(sx, sz),
      markerY: sd.markerY, markerIndex: -1, phase: sd.phase,
      label: sd.label
    };
    v2wStations.push(station);
    v2wStationById[sd.id] = station;
  }

  /* Marcadores: cofres, fragmentos libres, guías y estaciones. */
  function addMarker(owner, baseY) {
    owner.markerIndex = v2wMarkers.length;
    v2wMarkers.push({
      owner: owner, kind: owner.kind, x: owner.x, z: owner.z, baseY: baseY,
      color: owner.accent || '#7AA2FF', visible: true, phase: owner.phase || 0, scale: 1
    });
  }
  for (i = 0; i < v2wChests.length; i++) addMarker(v2wChests[i], 1.28);
  for (i = 0; i < v2wFrags.length; i++) if (v2wFrags[i].slot === 'free') addMarker(v2wFrags[i], 1.56);
  for (i = 0; i < v2wGuides.length; i++) addMarker(v2wGuides[i], 1.52);
  for (i = 0; i < v2wStations.length; i++) addMarker(v2wStations[i], v2wStations[i].markerY);

  /* Índices de cristal para los fragmentos libres. */
  for (i = 0; i < v2wFreeFrags.length; i++) v2wFreeFrags[i].crystalIndex = i;

  v2wItems = [];
  for (i = 0; i < v2wChests.length; i++) v2wItems.push(v2wChests[i]);
  for (i = 0; i < v2wGuides.length; i++) v2wItems.push(v2wGuides[i]);
  for (i = 0; i < v2wStations.length; i++) v2wItems.push(v2wStations[i]);
  for (i = 0; i < v2wFreeFrags.length; i++) v2wItems.push(v2wFreeFrags[i]);
  for (i = 0; i < v2wShadows.length; i++) v2wItems.push(v2wShadows[i]);
  for (i = 0; i < v2wItems.length; i++) v2wItemById[v2wItems[i].id] = v2wItems[i];

  v2wBuildIds();
  v2wCatalogReady = true;
}

function v2wBuildIds() {
  var ids = {
    version: V2W_VERSION,
    all: [], chests: [], fragments: [], guides: [], stations: [], shadows: [],
    byArea: {}, byId: {}
  };
  function entry(obj, extra) {
    var out = {
      id: obj.id,
      kind: obj.kind,
      label: obj.label,
      areaId: obj.areaId || null,
      x: (typeof obj.x === 'number' && isFinite(obj.x)) ? v2wRound(obj.x, 3) : null,
      z: (typeof obj.z === 'number' && isFinite(obj.z)) ? v2wRound(obj.z, 3) : null
    };
    if (extra) {
      for (var k in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, k)) out[k] = extra[k];
      }
    }
    ids.all.push(out);
    ids.byId[out.id] = out;
    if (out.areaId) {
      if (!ids.byArea[out.areaId]) ids.byArea[out.areaId] = [];
      ids.byArea[out.areaId].push(out);
    }
    return out;
  }
  var i;
  for (i = 0; i < v2wChests.length; i++) {
    ids.chests.push(entry(v2wChests[i], { fragmentId: v2wChests[i].fragmentId }));
  }
  for (i = 0; i < v2wFrags.length; i++) {
    var catalogQ = v2wQuestion(v2wFrags[i].questionId);
    ids.fragments.push(entry(v2wFrags[i], {
      slot: v2wFrags[i].slot,
      chestId: v2wFrags[i].chestId,
      questionId: v2wFrags[i].questionId,
      flashcardId: catalogQ && catalogQ.flashcardId ? String(catalogQ.flashcardId) : null,
      title: v2wFrags[i].title
    }));
  }
  for (i = 0; i < v2wGuides.length; i++) {
    ids.guides.push(entry(v2wGuides[i], { name: v2wGuides[i].name, questionId: v2wGuides[i].questionId }));
  }
  for (i = 0; i < v2wStations.length; i++) {
    ids.stations.push(entry(v2wStations[i], {}));
  }
  for (i = 0; i < v2wShadows.length; i++) {
    ids.shadows.push(entry(v2wShadows[i], {}));
  }
  v2wIds = ids;
}

/* -------------------------------------------------------------------------
   Estado guardado (las claves existentes de state.v2.world; restored es
   aditiva y la crea el Agente 0 en part1-core)
   ------------------------------------------------------------------------- */
function v2wWorldState() {
  try {
    if (typeof state === 'undefined' || !state) return null;
    if (!state.v2 || typeof state.v2 !== 'object') state.v2 = {};
    if (!state.v2.world || typeof state.v2.world !== 'object') state.v2.world = {};
    var world = state.v2.world;
    var keys = ['chests', 'guides', 'stations', 'fragments', 'visited'];
    for (var i = 0; i < keys.length; i++) {
      if (!world[keys[i]] || typeof world[keys[i]] !== 'object' || Object.prototype.toString.call(world[keys[i]]) === '[object Array]') {
        world[keys[i]] = {};
      }
    }
    return world;
  } catch (e) {
    v2wSoft(e);
    return null;
  }
}
function v2wReadEntry(bucketName, id) {
  var world = v2wWorldState();
  if (!world || !world[bucketName]) return null;
  var value = world[bucketName][id];
  return value && typeof value === 'object' ? value : null;
}
function v2wEnsureEntry(bucketName, id) {
  var world = v2wWorldState();
  if (!world) return null;
  if (!world[bucketName][id] || typeof world[bucketName][id] !== 'object') world[bucketName][id] = {};
  return world[bucketName][id];
}
function v2wMarkVisited(id) {
  var world = v2wWorldState();
  if (!world || !id) return;
  world.visited[id] = v2wNowISO();
}
function v2wPersist() {
  try {
    if (v2wIsFunction(persist)) { persist(); return true; }
  } catch (e) { v2wSoft(e); }
  return false;
}

/* -------------------------------------------------------------------------
   Restauración máxima por puerta (state.v2.world.restored[areaId])
   El máximo alcanzado nunca retrocede; se guarda al subir.
   ------------------------------------------------------------------------- */
var V2W_RESTORE_MAX = 3;
function v2wRestoredBucket() {
  var world = v2wWorldState();
  if (!world) return null;
  if (!world.restored || typeof world.restored !== 'object' ||
      Object.prototype.toString.call(world.restored) === '[object Array]') {
    world.restored = {};
  }
  return world.restored;
}
function v2wSavedRestoration(areaId) {
  if (!areaId) return 0;
  var bucket = v2wRestoredBucket();
  if (!bucket) return 0;
  var raw = bucket[areaId];
  var n = Number(raw);
  if (!isFinite(n)) return 0;
  n = Math.floor(n);
  if (n < 0) return 0;
  return n > V2W_RESTORE_MAX ? V2W_RESTORE_MAX : n;
}
function v2wSaveRestoration(areaId, level, silent) {
  if (!areaId) return 0;
  var bucket = v2wRestoredBucket();
  if (!bucket) return 0;
  var prev = v2wSavedRestoration(areaId);
  var next = Math.floor(Number(level) || 0);
  if (next < 0) next = 0;
  if (next > V2W_RESTORE_MAX) next = V2W_RESTORE_MAX;
  if (next <= prev) return prev;
  bucket[areaId] = next;
  /* Solo al subir: el guardado es aditivo y no toca recompensas. */
  if (!silent) v2wPersist();
  v2wEmit('world:restored', { areaId: areaId, level: next, previous: prev });
  return next;
}
function v2wSyncHud() {
  try {
    if (v2wIsFunction(syncHUD) && typeof screen !== 'undefined' && screen === 'hub') syncHUD();
  } catch (e) {}
}

/* -------------------------------------------------------------------------
   Recompensas (siempre por applyXpCoins; una sola vez por registro)
   ------------------------------------------------------------------------- */
var v2wAwardLog = [];
var v2wLastAward = null;
function v2wAward(xp, coins, meta) {
  var requestedXp = Math.max(0, Math.round(Number(xp) || 0));
  var requestedCoins = Math.max(0, Math.round(Number(coins) || 0));
  var result = { xp: requestedXp, coins: 0, capReached: false, applied: false, at: v2wNowISO() };
  try {
    if (v2wIsFunction(applyXpCoins)) {
      var applied = applyXpCoins(requestedXp, requestedCoins);
      result.applied = true;
      if (applied && typeof applied === 'object') {
        result.coins = Number(applied.coinsAdded) || 0;
        result.capReached = !!applied.capReached;
      } else {
        result.coins = requestedCoins;
      }
    }
  } catch (e) {
    v2wSoft(e);
  }
  if (meta && meta.id) {
    var row = {
      id: meta.id, kind: meta.kind || 'world', xp: result.xp, coins: result.coins,
      capReached: result.capReached, applied: result.applied, at: result.at
    };
    v2wAwardLog.push(row);
    if (v2wAwardLog.length > 60) v2wAwardLog.shift();
    v2wLastAward = row;
  }
  v2wSyncHud();
  return result;
}
function v2wCollectFragment(fragmentId) {
  var frag = v2wFragById[fragmentId];
  if (!frag) return null;
  var world = v2wWorldState();
  if (!world) return null;
  var existing = world.fragments[fragmentId];
  if (existing && typeof existing === 'object' && existing.collectedAt) {
    return { entry: existing, awarded: false, award: null, fragment: frag };
  }
  var q = v2wQuestion(frag.questionId);
  var entry = {
    collectedAt: v2wNowISO(),
    questionId: frag.questionId,
    flashcardId: q && q.flashcardId ? String(q.flashcardId) : (q && q.sheetId ? String(q.sheetId) : String(frag.questionId)),
    sheetId: q && q.sheetId ? String(q.sheetId) : null,
    title: frag.title,
    areaId: frag.areaId,
    source: frag.slot === 'chest' ? 'chest' : 'atrio'
  };
  world.fragments[fragmentId] = entry;
  var award = v2wAward(V2W_FRAGMENT_XP, 0, { id: fragmentId, kind: 'fragment' });
  entry.xp = award.xp;
  frag.collected = true;
  v2wSyncFragments();
  v2wSyncMarkers();
  return { entry: entry, awarded: true, award: award, fragment: frag };
}

/* -------------------------------------------------------------------------
   Utilidades 3D compartidas
   ------------------------------------------------------------------------- */
var v2wWorldRoot = null;
var v2wDummy = null;
var v2wThreeOk = false;
var v2wChestBodyMesh = null;
var v2wChestLids = [];
var v2wGuideBodyMesh = null;
var v2wGuideAccentMesh = null;
var v2wTelescopeGroup = null;
var v2wLibraryGroup = null;
var v2wFragmentMesh = null;
var v2wMarkerMesh = null;
var v2wMarkerRing = null;
var v2wShadowBodyMesh = null;
var v2wShadowEyeMesh = null;
var v2wShadowRingMesh = null;
var v2wShadowSprites = [];
var v2wRestVegMesh = null;
var v2wRestRuneMesh = null;
var v2wRestCrystalMesh = null;
var v2wRestColumnMesh = null;
var v2wRestHaloMesh = null;
var v2wRestLevels = {};
var v2wLastRefresh = 0;
var v2wLastShadowSignature = '';
var v2wShadowState = { total: 0, byArea: {}, active: 0, at: 0 };

function v2wColor(hex) {
  try {
    if (typeof color === 'function') return color(hex);
  } catch (e) {}
  try { return new THREE.Color(hex); } catch (e2) { return null; }
}
function v2wMergedPart(boxes) {
  if (!v2wIsFunction(mergedVoxels)) return null;
  var group = null;
  try { group = mergedVoxels(boxes); } catch (e) { v2wSoft(e); return null; }
  if (!group || !group.children || !group.children.length) return null;
  for (var i = 0; i < group.children.length; i++) {
    var child = group.children[i];
    if (child && child.isMesh && child.geometry && child.material) {
      return { geometry: child.geometry, material: child.material };
    }
  }
  return null;
}
function v2wHideAllInstances(mesh, capacity) {
  if (!mesh || !v2wDummy || !capacity) return;
  v2wDummy.position.set(0, -100, 0);
  v2wDummy.rotation.set(0, 0, 0);
  v2wDummy.scale.set(0.0001, 0.0001, 0.0001);
  v2wDummy.updateMatrix();
  for (var i = 0; i < capacity; i++) {
    try { mesh.setMatrixAt(i, v2wDummy.matrix); } catch (e) { return; }
  }
  try { mesh.instanceMatrix.needsUpdate = true; } catch (e2) {}
}
function v2wInstanced(part, capacity, name) {
  if (!v2wThreeOk || !part || !capacity) return null;
  var mesh = null;
  try {
    mesh = new THREE.InstancedMesh(part.geometry, part.material, capacity);
  } catch (e) {
    v2wSoft(e);
    return null;
  }
  mesh.name = name || 'v2w-instanced';
  mesh.count = 0;
  mesh.frustumCulled = false;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.raycast = v2wNoop;
  mesh.userData = mesh.userData || {};
  mesh.userData.v2wDecorative = true;
  v2wHideAllInstances(mesh, capacity);
  if (v2wWorldRoot) v2wWorldRoot.add(mesh);
  return mesh;
}
function v2wSetInstanceColor(mesh, index, hex) {
  if (!mesh || !mesh.setColorAt) return;
  var col = v2wColor(hex);
  if (!col) return;
  try { mesh.setColorAt(index, col); } catch (e) { v2wSoft(e); }
}
function v2wFlushColors(mesh) {
  if (!mesh) return;
  try {
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  } catch (e) {}
}
function v2wMarkDecorative(root) {
  if (!root || !root.traverse) return root;
  try {
    root.traverse(function (node) {
      if (!node) return;
      node.userData = node.userData || {};
      node.userData.v2wDecorative = true;
      if (node.isMesh || node.isInstancedMesh || node.isSprite || node.isPoints) {
        node.castShadow = false;
        node.receiveShadow = false;
        node.raycast = v2wNoop;
      }
    });
  } catch (e) {
    v2wSoft(e);
  }
  return root;
}
function v2wCountDrawables(root) {
  var count = 0;
  if (!root || !root.traverse) return count;
  try {
    root.traverse(function (node) {
      if (node && (node.isMesh || node.isInstancedMesh || node.isSprite || node.isPoints)) count += 1;
    });
  } catch (e) {}
  return count;
}

/* -------------------------------------------------------------------------
   Geometrías del mundo
   ------------------------------------------------------------------------- */
var V2W_CHEST_BODY = [
  [0, 0.03, 0, 0.98, 0.06, 0.66, '#17120d'],
  [0, 0.14, 0, 0.86, 0.2, 0.56, '#2a2118'],
  [0, 0.27, 0, 0.92, 0.09, 0.62, '#4a3824'],
  [-0.38, 0.17, 0, 0.05, 0.2, 0.52, '#6a512f'],
  [0.38, 0.17, 0, 0.05, 0.2, 0.52, '#6a512f'],
  [0, 0.28, 0.316, 0.94, 0.06, 0.035, '#e4c07a'],
  [0, 0.27, 0.335, 0.12, 0.1, 0.03, '#f0d494']
];
var V2W_CHEST_LID = [
  [0, 0.06, 0.315, 0.94, 0.12, 0.62, '#5a432a'],
  [0, 0.13, 0.315, 0.86, 0.035, 0.56, '#6d5333'],
  [0, 0.14, 0.315, 0.1, 0.04, 0.1, '#e4c07a'],
  [0, 0.03, 0.625, 0.12, 0.05, 0.035, '#f0d494']
];
var V2W_GUIDE_BODY = [
  [0, 0.04, 0, 0.34, 0.08, 0.28, '#3b4150'],
  [0, 0.17, 0, 0.28, 0.34, 0.24, '#8f96a6'],
  [0, 0.4, 0, 0.34, 0.24, 0.28, '#a7adbb'],
  [-0.19, 0.38, 0, 0.08, 0.24, 0.1, '#7c8494'],
  [0.19, 0.38, 0, 0.08, 0.24, 0.1, '#7c8494'],
  [0, 0.64, 0, 0.3, 0.26, 0.26, '#c7a184'],
  [0, 0.77, 0, 0.34, 0.06, 0.3, '#5d6678'],
  [0, 0.7, -0.1, 0.32, 0.24, 0.1, '#4c5464'],
  [0.27, 0.32, 0.02, 0.05, 0.64, 0.05, '#8a6f4d'],
  [0.27, 0.66, 0.02, 0.09, 0.09, 0.09, '#e4c07a']
];
var V2W_GUIDE_ACCENT = [
  [-0.075, 0.66, 0.136, 0.055, 0.05, 0.02, '#ffffff', true],
  [0.075, 0.66, 0.136, 0.055, 0.05, 0.02, '#ffffff', true],
  [0, 0.42, 0.146, 0.2, 0.035, 0.02, '#ffffff', true],
  [0.27, 0.79, 0.02, 0.08, 0.08, 0.08, '#ffffff', true]
];
var V2W_TELESCOPE_BOXES = [
  [0, 0.04, 0, 0.72, 0.08, 0.72, '#1b202b'],
  [-0.25, 0.32, 0.1, 0.08, 0.58, 0.08, '#3b4354'],
  [0.25, 0.32, 0.1, 0.08, 0.58, 0.08, '#3b4354'],
  [0, 0.32, -0.24, 0.08, 0.58, 0.08, '#3b4354'],
  [0, 0.68, 0, 0.18, 0.36, 0.18, '#5a6272'],
  [0.03, 0.9, 0.02, 0.17, 0.17, 0.17, '#4a5264'],
  [0.08, 0.98, 0.08, 0.16, 0.16, 0.16, '#5a6272'],
  [0.13, 1.06, 0.14, 0.16, 0.16, 0.16, '#4a5264'],
  [0.18, 1.14, 0.2, 0.16, 0.16, 0.16, '#5a6272'],
  [0.22, 1.22, 0.24, 0.13, 0.18, 0.18, '#e4c07a', true],
  [0.26, 1.22, 0.28, 0.05, 0.16, 0.16, '#69d3c1', true],
  [0.2, 0.62, -0.12, 0.24, 0.06, 0.24, '#e4c07a']
];
var V2W_LIBRARY_BOXES = [
  [0, 0.04, 0, 1.6, 0.08, 0.72, '#1b202b'],
  [0, 0.95, -0.24, 1.5, 1.7, 0.16, '#4a3a28'],
  [-0.75, 0.95, 0, 0.12, 1.8, 0.62, '#5a4630'],
  [0.75, 0.95, 0, 0.12, 1.8, 0.62, '#5a4630'],
  [0, 1.76, 0, 1.7, 0.12, 0.72, '#6a5333'],
  [0, 0.56, 0.02, 1.34, 0.06, 0.55, '#3b3021'],
  [0, 1.06, 0.02, 1.34, 0.06, 0.55, '#3b3021'],
  [0, 1.5, 0.02, 1.34, 0.06, 0.55, '#3b3021'],
  [-0.55, 0.68, 0.06, 0.12, 0.2, 0.28, '#69d3c1'],
  [-0.38, 0.68, 0.06, 0.1, 0.22, 0.3, '#7aa2ff'],
  [-0.22, 0.68, 0.06, 0.11, 0.18, 0.26, '#c49bff'],
  [-0.05, 0.68, 0.06, 0.1, 0.24, 0.3, '#f3b562'],
  [0.16, 0.68, 0.06, 0.12, 0.2, 0.28, '#b8d46a'],
  [0.34, 0.68, 0.06, 0.1, 0.22, 0.28, '#69d3c1'],
  [-0.44, 1.18, 0.06, 0.12, 0.2, 0.28, '#c49bff'],
  [-0.2, 1.18, 0.06, 0.1, 0.22, 0.3, '#7aa2ff'],
  [0.04, 1.18, 0.06, 0.12, 0.2, 0.28, '#f3b562'],
  [0.28, 1.18, 0.06, 0.1, 0.18, 0.26, '#b8d46a'],
  [0, 0.63, 0.56, 0.7, 0.06, 0.42, '#e8e2d2'],
  [0, 0.7, 0.56, 0.06, 0.2, 0.06, '#8a6f4d'],
  [0, 1.82, 0, 0.42, 0.16, 0.16, '#e4c07a', true],
  [0, 1.68, 0, 0.14, 0.12, 0.14, '#69d3c1', true]
];
var V2W_SHADOW_BODY = [
  [0, 0.04, 0, 0.9, 0.08, 0.7, '#080b12'],
  [0, 0.25, 0, 0.7, 0.4, 0.48, '#0e1420'],
  [0, 0.52, 0, 0.58, 0.3, 0.4, '#121a2a'],
  [0, 0.72, 0, 0.46, 0.2, 0.32, '#172034'],
  [0, 0.88, 0, 0.36, 0.16, 0.26, '#1b253b'],
  [-0.36, 0.34, 0, 0.16, 0.34, 0.16, '#0b101a'],
  [0.36, 0.34, 0, 0.16, 0.34, 0.16, '#0b101a'],
  [-0.28, 0.62, 0.02, 0.12, 0.22, 0.12, '#101726'],
  [0.28, 0.62, 0.02, 0.12, 0.22, 0.12, '#101726'],
  [0, 0.9, -0.08, 0.44, 0.06, 0.36, '#232b42']
];
var V2W_SHADOW_EYES = [
  [-0.085, 0.78, 0.145, 0.07, 0.05, 0.02, '#ff8b9d', true],
  [0.085, 0.78, 0.145, 0.07, 0.05, 0.02, '#ff8b9d', true]
];

function v2wBuildChests3D() {
  var bodyPart = v2wMergedPart(V2W_CHEST_BODY);
  var lidPart = v2wMergedPart(V2W_CHEST_LID);
  if (!bodyPart || !lidPart) return;
  v2wChestBodyMesh = v2wInstanced(bodyPart, v2wChests.length, 'v2w-chests');
  if (!v2wChestBodyMesh) return;
  for (var i = 0; i < v2wChests.length; i++) {
    var chest = v2wChests[i];
    v2wDummy.position.set(chest.x, 0, chest.z);
    v2wDummy.rotation.set(0, chest.yaw, 0);
    v2wDummy.scale.set(1, 1, 1);
    v2wDummy.updateMatrix();
    v2wChestBodyMesh.setMatrixAt(i, v2wDummy.matrix);
    var group = null;
    try { group = new THREE.Group(); } catch (e) { group = null; }
    if (!group) continue;
    group.position.set(chest.x, 0, chest.z);
    group.rotation.y = chest.yaw;
    var lid = null;
    try { lid = new THREE.Mesh(lidPart.geometry, lidPart.material); } catch (e2) { lid = null; }
    if (!lid) continue;
    lid.position.set(0, 0.34, -0.31);
    lid.castShadow = false;
    lid.receiveShadow = false;
    lid.raycast = v2wNoop;
    group.add(lid);
    v2wWorldRoot.add(group);
    v2wChestLids.push({ chest: chest, group: group, lid: lid });
  }
  v2wChestBodyMesh.count = v2wChests.length;
  try { v2wChestBodyMesh.instanceMatrix.needsUpdate = true; } catch (e3) {}
}

function v2wBuildGuides3D() {
  var bodyPart = v2wMergedPart(V2W_GUIDE_BODY);
  var accentPart = v2wMergedPart(V2W_GUIDE_ACCENT);
  var count = v2wGuides.length;
  if (!bodyPart || !count) return;
  v2wGuideBodyMesh = v2wInstanced(bodyPart, count, 'v2w-guides');
  if (accentPart) v2wGuideAccentMesh = v2wInstanced(accentPart, count, 'v2w-guide-accents');
  for (var i = 0; i < count; i++) {
    var g = v2wGuides[i];
    v2wSetInstanceColor(v2wGuideBodyMesh, i, v2wMixHex(g.accent, '#ffffff', 0.74));
    if (v2wGuideAccentMesh) v2wSetInstanceColor(v2wGuideAccentMesh, i, g.accent);
    v2wDummy.position.set(g.x, 0, g.z);
    v2wDummy.rotation.set(0, g.yaw, 0);
    v2wDummy.scale.set(1, 1, 1);
    v2wDummy.updateMatrix();
    if (v2wGuideBodyMesh) v2wGuideBodyMesh.setMatrixAt(i, v2wDummy.matrix);
    if (v2wGuideAccentMesh) v2wGuideAccentMesh.setMatrixAt(i, v2wDummy.matrix);
  }
  if (v2wGuideBodyMesh) { v2wGuideBodyMesh.count = count; try { v2wGuideBodyMesh.instanceMatrix.needsUpdate = true; } catch (e1) {} }
  if (v2wGuideAccentMesh) { v2wGuideAccentMesh.count = count; try { v2wGuideAccentMesh.instanceMatrix.needsUpdate = true; } catch (e2) {} }
  v2wFlushColors(v2wGuideBodyMesh);
  v2wFlushColors(v2wGuideAccentMesh);
}

function v2wBuildStations3D() {
  for (var i = 0; i < v2wStations.length; i++) {
    var st = v2wStations[i];
    var group = null;
    try { group = new THREE.Group(); } catch (e) { group = null; }
    if (!group) continue;
    group.position.set(st.x, 0, st.z);
    group.rotation.y = st.yaw;
    var model = null;
    try { model = mergedVoxels(st.kind === 'telescope' ? V2W_TELESCOPE_BOXES : V2W_LIBRARY_BOXES); } catch (e2) { model = null; }
    if (model) group.add(model);
    group.name = 'v2w-station-' + st.kind;
    v2wWorldRoot.add(group);
    if (st.kind === 'telescope') v2wTelescopeGroup = group;
    else v2wLibraryGroup = group;
  }
}

function v2wBuildFragments3D() {
  var count = v2wFreeFrags.length;
  if (!count) return;
  var geo = null, mat = null;
  try {
    geo = new THREE.OctahedronGeometry(1, 0);
    mat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.93, fog: false });
  } catch (e) { return; }
  var mesh = null;
  try { mesh = new THREE.InstancedMesh(geo, mat, count); } catch (e2) { return; }
  mesh.name = 'v2w-fragments';
  mesh.frustumCulled = false;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.raycast = v2wNoop;
  mesh.count = count;
  v2wHideAllInstances(mesh, count);
  v2wWorldRoot.add(mesh);
  v2wFragmentMesh = mesh;
  for (var i = 0; i < count; i++) {
    var frag = v2wFreeFrags[i];
    v2wSetInstanceColor(mesh, i, v2wMixHex(frag.accent, '#f2f0ea', 0.35));
  }
  v2wFlushColors(mesh);
}

function v2wBuildMarkers3D() {
  var count = v2wMarkers.length;
  if (!count) return;
  var geo = null, mat = null, ringGeo = null, ringMat = null;
  try {
    geo = new THREE.OctahedronGeometry(1, 0);
    mat = new THREE.MeshBasicMaterial({
      color: '#ffffff', transparent: true, opacity: 0.9,
      depthWrite: false, blending: THREE.AdditiveBlending, fog: false
    });
    ringGeo = new THREE.TorusGeometry(1, 0.055, 3, 16);
    ringMat = new THREE.MeshBasicMaterial({
      color: '#ffffff', transparent: true, opacity: 0.5,
      depthWrite: false, blending: THREE.AdditiveBlending, fog: false
    });
  } catch (e) { return; }
  var diamond = null, ring = null;
  try {
    diamond = new THREE.InstancedMesh(geo, mat, count);
    ring = new THREE.InstancedMesh(ringGeo, ringMat, count);
  } catch (e2) { return; }
  var list = [diamond, ring];
  for (var m = 0; m < list.length; m++) {
    list[m].name = 'v2w-markers-' + m;
    list[m].frustumCulled = false;
    list[m].castShadow = false;
    list[m].receiveShadow = false;
    list[m].raycast = v2wNoop;
    list[m].count = count;
    v2wHideAllInstances(list[m], count);
    v2wWorldRoot.add(list[m]);
  }
  v2wMarkerMesh = diamond;
  v2wMarkerRing = ring;
  for (var i = 0; i < count; i++) {
    var rec = v2wMarkers[i];
    v2wSetInstanceColor(diamond, i, rec.color);
    v2wSetInstanceColor(ring, i, rec.color);
  }
  v2wFlushColors(diamond);
  v2wFlushColors(ring);
}

function v2wCanvas(size) {
  try {
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    return canvas;
  } catch (e) { return null; }
}
function v2wCanvasContext(canvas) {
  if (!canvas || !canvas.getContext) return null;
  try { return canvas.getContext('2d'); } catch (e) { return null; }
}
function v2wDrawShadowCount(rec) {
  if (!rec || !rec.ctx || !rec.canvas || !rec.texture) return;
  var ctx = rec.ctx;
  var size = rec.canvas.width || 128;
  var label = String(rec.count);
  try {
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.36, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6,10,18,0.86)';
    ctx.fill();
    ctx.lineWidth = size * 0.025;
    ctx.strokeStyle = 'rgba(243,181,98,0.92)';
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f3b562';
    ctx.font = '800 ' + Math.round(size * 0.4) + 'px "Segoe UI","Bahnschrift",sans-serif';
    ctx.fillText(label, size / 2, size * 0.46);
    ctx.font = '700 ' + Math.round(size * 0.105) + 'px "Segoe UI",sans-serif';
    ctx.fillStyle = '#e8dfc8';
    ctx.fillText(rec.count === 1 ? 'error' : 'errores', size / 2, size * 0.8);
  } catch (e) { v2wSoft(e); return; }
  try { rec.texture.needsUpdate = true; } catch (e2) {}
}
function v2wBuildShadowSprites() {
  for (var i = 0; i < v2wShadows.length; i++) {
    var sh = v2wShadows[i];
    var canvas = v2wCanvas(128);
    var ctx = v2wCanvasContext(canvas);
    if (!canvas || !ctx) { v2wShadowSprites.push(null); continue; }
    var texture = null;
    try {
      texture = new THREE.CanvasTexture(canvas);
      if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
    } catch (e) { texture = null; }
    if (!texture) { v2wShadowSprites.push(null); continue; }
    var material = null, sprite = null;
    try {
      material = new THREE.SpriteMaterial({
        map: texture, transparent: true, depthTest: false, depthWrite: false, fog: false
      });
      sprite = new THREE.Sprite(material);
    } catch (e2) { sprite = null; }
    if (!sprite) { v2wShadowSprites.push(null); continue; }
    sprite.scale.set(0.9, 0.9, 1);
    sprite.position.set(sh.x, 1.68, sh.z);
    sprite.visible = false;
    sprite.renderOrder = 18;
    sprite.raycast = v2wNoop;
    v2wWorldRoot.add(sprite);
    sh.sprite = sprite;
    sh.canvas = canvas;
    sh.ctx = ctx;
    sh.texture = texture;
    v2wShadowSprites.push(sprite);
  }
}
function v2wBuildShadows3D() {
  var n = v2wShadows.length;
  if (!n) return;
  var bodyPart = v2wMergedPart(V2W_SHADOW_BODY);
  var eyePart = v2wMergedPart(V2W_SHADOW_EYES);
  if (bodyPart) v2wShadowBodyMesh = v2wInstanced(bodyPart, n, 'v2w-shadow-bodies');
  if (eyePart) v2wShadowEyeMesh = v2wInstanced(eyePart, n, 'v2w-shadow-eyes');
  var ringGeo = null, ringMat = null;
  try {
    ringGeo = new THREE.TorusGeometry(1, 0.05, 3, 22);
    ringMat = new THREE.MeshBasicMaterial({
      color: v2wColor('#8f6bff'), transparent: true, opacity: 0.5,
      depthWrite: false, blending: THREE.AdditiveBlending, fog: false
    });
  } catch (e) {}
  if (ringGeo && ringMat) {
    var ring = null;
    try { ring = new THREE.InstancedMesh(ringGeo, ringMat, n); } catch (e2) { ring = null; }
    if (ring) {
      ring.name = 'v2w-shadow-rings';
      ring.frustumCulled = false;
      ring.castShadow = false;
      ring.receiveShadow = false;
      ring.raycast = v2wNoop;
      ring.count = n;
      v2wHideAllInstances(ring, n);
      v2wWorldRoot.add(ring);
      v2wShadowRingMesh = ring;
    }
  }
  v2wBuildShadowSprites();
}

function v2wBuildRestoration3D() {
  var areas = v2wGuides.length;
  if (!areas) return;
  var vegGeo = null, vegMat = null, runeGeo = null, runeMat = null, crystalGeo = null, crystalMat = null;
  var columnGeo = null, columnMat = null, haloGeo = null, haloMat = null;
  try {
    vegGeo = new THREE.BoxGeometry(1, 1, 1);
    vegMat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    runeGeo = new THREE.TorusGeometry(1, 0.035, 3, 28);
    runeMat = new THREE.MeshBasicMaterial({
      color: '#ffffff', transparent: true, opacity: 0.6,
      depthWrite: false, blending: THREE.AdditiveBlending, fog: false
    });
    crystalGeo = new THREE.OctahedronGeometry(1, 0);
    crystalMat = new THREE.MeshBasicMaterial({
      color: '#ffffff', transparent: true, opacity: 0.85,
      depthWrite: false, blending: THREE.AdditiveBlending, fog: false
    });
    columnGeo = new THREE.CylinderGeometry(0.55, 0.85, 1, 8, 1, true);
    columnMat = new THREE.MeshBasicMaterial({
      color: '#ffffff', transparent: true, opacity: 0.42,
      depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false
    });
    haloGeo = new THREE.TorusGeometry(1, 0.04, 3, 36);
    haloMat = new THREE.MeshBasicMaterial({
      color: '#ffffff', transparent: true, opacity: 0.16,
      depthWrite: false, blending: THREE.AdditiveBlending, fog: false
    });
  } catch (e) { return; }
  var veg = null, rune = null, crystal = null, column = null, halo = null;
  try {
    veg = new THREE.InstancedMesh(vegGeo, vegMat, areas * 6);
    rune = new THREE.InstancedMesh(runeGeo, runeMat, areas * 2);
    crystal = new THREE.InstancedMesh(crystalGeo, crystalMat, areas * 3);
    column = new THREE.InstancedMesh(columnGeo, columnMat, areas * 2);
    halo = new THREE.InstancedMesh(haloGeo, haloMat, areas * 2);
  } catch (e2) { return; }
  var list = [veg, rune, crystal, column, halo];
  var capacities = [areas * 6, areas * 2, areas * 3, areas * 2, areas * 2];
  for (var i = 0; i < list.length; i++) {
    list[i].name = 'v2w-restoration-' + i;
    list[i].frustumCulled = false;
    list[i].castShadow = false;
    list[i].receiveShadow = false;
    list[i].raycast = v2wNoop;
    list[i].count = 0;
    v2wHideAllInstances(list[i], capacities[i]);
    v2wWorldRoot.add(list[i]);
  }
  v2wRestVegMesh = veg;
  v2wRestRuneMesh = rune;
  rune.visible = false;
  v2wRestCrystalMesh = crystal;
  v2wRestColumnMesh = column;
  column.visible = false;
  v2wRestHaloMesh = halo;
  /* V2.2: el atrio prioriza puertas y etiquetas; los aros y columnas de
     restauración se retiran del espacio y la restauración se lee en
     vegetación/cristales. */
  halo.visible = false;
}

function v2wBuild3D() {
  if (typeof THREE === 'undefined' || !THREE) return false;
  if (typeof hubGroup === 'undefined' || !hubGroup) return false;
  v2wThreeOk = true;
  try { v2wDummy = new THREE.Object3D(); } catch (e) { return false; }
  try { v2wWorldRoot = new THREE.Group(); } catch (e2) { return false; }
  v2wWorldRoot.name = 'v2w-world-root';
  hubGroup.add(v2wWorldRoot);
  try { v2wBuildChests3D(); } catch (e3) { v2wSoft(e3); }
  try { v2wBuildGuides3D(); } catch (e4) { v2wSoft(e4); }
  try { v2wBuildStations3D(); } catch (e5) { v2wSoft(e5); }
  try { v2wBuildFragments3D(); } catch (e6) { v2wSoft(e6); }
  try { v2wBuildMarkers3D(); } catch (e7) { v2wSoft(e7); }
  try { v2wBuildShadows3D(); } catch (e8) { v2wSoft(e8); }
  try { v2wBuildRestoration3D(); } catch (e9) { v2wSoft(e9); }
  v2wMarkDecorative(v2wWorldRoot);
  return true;
}

/* =========================================================================
   PARTE B · sincronización con el estado, sombras, restauración y animación
   ========================================================================= */
var v2wCounts = { chests: 0, fragments: 0, guides: 0, unlocked: 0, shadows: 0 };
var v2wBuilt = false;

function v2wGuideState(areaId) {
  return v2wReadEntry('guides', areaId);
}
function v2wEnsureGuideState(areaId) {
  return v2wEnsureEntry('guides', areaId);
}
function v2wChestState(chestId) {
  return v2wReadEntry('chests', chestId);
}
function v2wEnsureChestState(chestId) {
  return v2wEnsureEntry('chests', chestId);
}
function v2wFragmentState(fragmentId) {
  return v2wReadEntry('fragments', fragmentId);
}
function v2wStationState(stationId) {
  return v2wReadEntry('stations', stationId);
}
function v2wNoteStationUse(stationId) {
  var rec = v2wEnsureEntry('stations', stationId);
  if (!rec) return null;
  rec.uses = (Number(rec.uses) || 0) + 1;
  rec.usedAt = v2wNowISO();
  return rec;
}
function v2wUnlockedFragments() {
  var out = [];
  for (var i = 0; i < v2wFrags.length; i++) {
    var frag = v2wFrags[i];
    var entry = v2wFragmentState(frag.id);
    if (entry && entry.collectedAt) out.push({ fragment: frag, entry: entry });
  }
  return out;
}
function v2wCountUnlocked() {
  return v2wUnlockedFragments().length;
}
function v2wGuideCompletedCount() {
  var n = 0;
  for (var i = 0; i < v2wGuides.length; i++) if (v2wGuides[i].completed) n += 1;
  return n;
}
function v2wChestOpenedCount() {
  var n = 0;
  for (var i = 0; i < v2wChests.length; i++) if (v2wChests[i].opened) n += 1;
  return n;
}
function v2wShadowActiveCount() {
  var n = 0;
  for (var i = 0; i < v2wShadows.length; i++) if (v2wShadows[i].active) n += 1;
  return n;
}
function v2wStationUseTotal() {
  var n = 0;
  for (var i = 0; i < v2wStations.length; i++) {
    var rec = v2wStationState(v2wStations[i].id);
    if (rec) n += Number(rec.uses) || 0;
  }
  return n;
}
function v2wSyncHudIfAvailable() {
  v2wSyncHud();
}

/* -------------------------------------------------------------------------
   Sincronización de banderas de estado
   ------------------------------------------------------------------------- */
function v2wSyncStateFlags() {
  var world = v2wWorldState();
  var i, rec;
  var counts = { chests: 0, fragments: 0, guides: 0, unlocked: 0, shadows: 0 };
  for (i = 0; i < v2wChests.length; i++) {
    rec = world ? world.chests[v2wChests[i].id] : null;
    v2wChests[i].opened = !!(rec && rec.openedAt);
    if (v2wChests[i].opened) counts.chests += 1;
  }
  for (i = 0; i < v2wFrags.length; i++) {
    rec = world ? world.fragments[v2wFrags[i].id] : null;
    v2wFrags[i].collected = !!(rec && rec.collectedAt);
    if (v2wFrags[i].collected) { counts.fragments += 1; counts.unlocked += 1; }
  }
  for (i = 0; i < v2wGuides.length; i++) {
    rec = world ? world.guides[v2wGuides[i].areaId] : null;
    v2wGuides[i].completed = !!(rec && rec.completedAt);
    if (v2wGuides[i].completed) counts.guides += 1;
  }
  counts.shadows = v2wShadowActiveCount();
  v2wCounts = counts;
}

/* -------------------------------------------------------------------------
   Sincronización visual
   ------------------------------------------------------------------------- */
function v2wMarkerColor(owner) {
  if (!owner) return '#7AA2FF';
  if (owner.kind === 'chest') return owner.opened ? '#6f7c97' : '#e4c07a';
  if (owner.kind === 'fragment') return owner.accent || '#69D3C1';
  if (owner.kind === 'guide') return owner.completed ? '#69d3c1' : (owner.accent || '#C49BFF');
  if (owner.kind === 'telescope') return '#7aa2ff';
  if (owner.kind === 'library') return '#69d3c1';
  return owner.accent || '#7AA2FF';
}
function v2wMarkerVisible(owner) {
  if (!owner) return false;
  if (owner.kind === 'fragment') return !owner.collected;
  if (owner.kind === 'shadow') return false;
  return true;
}
var V2W_MARKER_RANGE = 6.5;
var V2W_MARKER_FADE = 1.2;
var v2wLastMarkerCull = 0;
var v2wHeroRef = { x: 0, z: 0, ok: false };

function v2wRefreshHeroRef() {
  try {
    if (typeof hubHero !== 'undefined' && hubHero && typeof hubHero.x === 'number' && typeof hubHero.z === 'number') {
      v2wHeroRef.x = hubHero.x;
      v2wHeroRef.z = hubHero.z;
      v2wHeroRef.ok = true;
      return true;
    }
  } catch (e) {}
  v2wHeroRef.ok = false;
  return false;
}
function v2wMarkerBaseScale(rec) {
  if (!rec) return 0.15;
  if (rec.kind === 'fragment') return 0.105;
  if (rec.kind === 'chest' || rec.kind === 'guide') return 0.21;
  return 0.18;
}
function v2wMarkerRingBaseScale(rec) {
  if (!rec) return 0.3;
  if (rec.kind === 'fragment') return 0.21;
  if (rec.kind === 'chest' || rec.kind === 'guide') return 0.38;
  return 0.32;
}
function v2wApplyMarkerTransforms(time, animate) {
  if (!v2wMarkerMesh && !v2wMarkerRing) return;
  var ringAllowed = v2wQuality() !== 'bajo';
  if (v2wMarkerRing) v2wMarkerRing.visible = ringAllowed;
  var hasHero = v2wRefreshHeroRef();
  var t = Number(time) || 0;
  for (var i = 0; i < v2wMarkers.length; i++) {
    var rec = v2wMarkers[i];
    if (!rec) continue;
    var fade = 0;
    if (rec.visible) {
      fade = 1;
      if (hasHero) {
        var dx = v2wHeroRef.x - rec.x;
        var dz = v2wHeroRef.z - rec.z;
        var distance = Math.sqrt(dx * dx + dz * dz);
        fade = v2wClamp((V2W_MARKER_RANGE - distance) / V2W_MARKER_FADE, 0, 1);
      }
    }
    rec.fade = fade;
    var scale = rec.visible ? v2wMarkerBaseScale(rec) * fade : 0.0001;
    if (scale < 0.0008) scale = 0.0001;
    var y = rec.baseY + ((animate && rec.visible) ? Math.sin(t * 1.25 + rec.phase) * 0.065 : 0);
    if (v2wMarkerMesh) {
      v2wDummy.position.set(rec.x, y, rec.z);
      v2wDummy.rotation.set(0, animate ? (t * 0.7 + rec.phase) : 0, 0);
      v2wDummy.scale.set(scale, scale, scale);
      v2wDummy.updateMatrix();
      try { v2wMarkerMesh.setMatrixAt(i, v2wDummy.matrix); } catch (e) {}
    }
    if (v2wMarkerRing) {
      var ringScale = (rec.visible && ringAllowed) ? v2wMarkerRingBaseScale(rec) * fade : 0.0001;
      if (ringScale < 0.0008) ringScale = 0.0001;
      v2wDummy.position.set(rec.x, y - 0.03, rec.z);
      v2wDummy.rotation.set(Math.PI / 2, 0, animate ? (t * 0.5 + rec.phase) : 0);
      v2wDummy.scale.set(ringScale, ringScale, ringScale);
      v2wDummy.updateMatrix();
      try { v2wMarkerRing.setMatrixAt(i, v2wDummy.matrix); } catch (e2) {}
    }
  }
  try { if (v2wMarkerMesh) v2wMarkerMesh.instanceMatrix.needsUpdate = true; } catch (e3) {}
  try { if (v2wMarkerRing) v2wMarkerRing.instanceMatrix.needsUpdate = true; } catch (e4) {}
}
function v2wSyncMarkers() {
  if (!v2wMarkers.length) return;
  for (var i = 0; i < v2wMarkers.length; i++) {
    var rec = v2wMarkers[i];
    if (!rec || !rec.owner) continue;
    rec.visible = v2wMarkerVisible(rec.owner);
    rec.color = v2wMarkerColor(rec.owner);
    v2wSetInstanceColor(v2wMarkerMesh, i, rec.color);
    v2wSetInstanceColor(v2wMarkerRing, i, rec.color);
  }
  v2wApplyMarkerTransforms(0, false);
  v2wFlushColors(v2wMarkerMesh);
  v2wFlushColors(v2wMarkerRing);
}
function v2wSyncChests() {
  for (var i = 0; i < v2wChestLids.length; i++) {
    var rec = v2wChestLids[i];
    if (!rec || !rec.lid || !rec.chest) continue;
    rec.lid.rotation.x = rec.chest.opened ? 1.15 : 0;
  }
}
function v2wSyncGuides() {
  if (!v2wGuides.length) return;
  if (v2wReducedMotion()) v2wApplyGuideMatrices(0);
}
function v2wSyncFragments() {
  if (!v2wFragmentMesh) return;
  for (var i = 0; i < v2wFreeFrags.length; i++) {
    var frag = v2wFreeFrags[i];
    var index = frag.crystalIndex;
    if (index < 0) continue;
    var scale = frag.collected ? 0.0001 : 0.17;
    v2wDummy.position.set(frag.x, 0.86, frag.z);
    v2wDummy.rotation.set(0, 0, 0);
    v2wDummy.scale.set(scale, scale, scale);
    v2wDummy.updateMatrix();
    try { v2wFragmentMesh.setMatrixAt(index, v2wDummy.matrix); } catch (e) {}
  }
  try { v2wFragmentMesh.instanceMatrix.needsUpdate = true; } catch (e2) {}
}
function v2wApplyGuideMatrices(time) {
  if (!v2wDummy) return;
  var t = Number(time) || 0;
  var bob = v2wReducedMotion() ? 0 : 1;
  for (var i = 0; i < v2wGuides.length; i++) {
    var g = v2wGuides[i];
    g.bob = bob ? Math.sin(t * 1.15 + g.phase) * 0.025 : 0;
    var yaw = g.yaw + (bob ? Math.sin(t * 0.45 + g.phase) * 0.045 : 0);
    v2wDummy.position.set(g.x, g.bob, g.z);
    v2wDummy.rotation.set(0, yaw, 0);
    v2wDummy.scale.set(1, 1, 1);
    v2wDummy.updateMatrix();
    if (v2wGuideBodyMesh) v2wGuideBodyMesh.setMatrixAt(i, v2wDummy.matrix);
    if (v2wGuideAccentMesh) v2wGuideAccentMesh.setMatrixAt(i, v2wDummy.matrix);
  }
  try { if (v2wGuideBodyMesh) v2wGuideBodyMesh.instanceMatrix.needsUpdate = true; } catch (e) {}
  try { if (v2wGuideAccentMesh) v2wGuideAccentMesh.instanceMatrix.needsUpdate = true; } catch (e2) {}
}

/* -------------------------------------------------------------------------
   Restauración visual por dominio (3 niveles, sin recompensas)
   El nivel calculado se combina con el máximo guardado para que una puerta
   ya restaurada no retroceda si el progreso se recalcula a la baja.
   ------------------------------------------------------------------------- */
function v2wGateCenter(angle) {
  return { x: v2wPolarX(angle, 7.1), z: v2wPolarZ(angle, 7.1) };
}
function v2wTangential(angle, offset) {
  return { x: -Math.sin(angle) * offset, z: Math.cos(angle) * offset };
}
function v2wCalculatedRestoration(areaId) {
  var progress = v2wAreaProgress(areaId);
  var mastered = 0;
  try {
    var ids = Object.keys(state.questions || {});
    for (var i = 0; i < ids.length; i++) {
      var questionState = state.questions[ids[i]];
      if (!questionState) continue;
      var q = v2wQuestion(ids[i]);
      var qArea = q && q.areaId ? q.areaId : questionState.areaId;
      if (qArea === areaId && Number(questionState.mastery) >= 3) mastered += 1;
    }
  } catch (e) {}
  var level = 0;
  if (progress.done >= 1 || mastered >= 3) level = 1;
  if ((progress.total > 0 && progress.pct >= 0.5) || mastered >= 8) level = 2;
  if ((progress.total > 0 && progress.done >= progress.total) || mastered >= 15) level = 3;
  return level > V2W_RESTORE_MAX ? V2W_RESTORE_MAX : level;
}
function v2wRestorationLevel(areaId) {
  var calculated = v2wCalculatedRestoration(areaId);
  var saved = v2wSavedRestoration(areaId);
  if (calculated > saved) saved = v2wSaveRestoration(areaId, calculated);
  return calculated > saved ? calculated : saved;
}
function v2wRestorationSignature() {
  var parts = [];
  for (var i = 0; i < v2wGuides.length; i++) {
    var areaId = v2wGuides[i].areaId;
    parts.push(areaId + ':' + v2wRestorationLevel(areaId));
  }
  return parts.join('|');
}
function v2wSyncRestoration(force) {
  if (!v2wRestVegMesh && !v2wRestRuneMesh && !v2wRestCrystalMesh && !v2wRestColumnMesh && !v2wRestHaloMesh) return;
  var signature = v2wRestorationSignature();
  if (!force && signature === v2wRestSignatureCache) return;
  v2wRestSignatureCache = signature;
  var vegIndex = 0, runeIndex = 0, crystalIndex = 0, columnIndex = 0, haloIndex = 0;
  var levels = {};
  for (var i = 0; i < v2wGuides.length; i++) {
    var guide = v2wGuides[i];
    var areaId = guide.areaId;
    var level = v2wRestorationLevel(areaId);
    levels[areaId] = level;
    v2wRestLevels[areaId] = level;
    var gate = v2wGateCenter(guide.angle);
    var accent = guide.accent || '#7AA2FF';
    if (v2wRestVegMesh) {
      var vegActive = level >= 3 ? 6 : (level >= 2 ? 4 : (level >= 1 ? 2 : 0));
      for (var v = 0; v < vegActive; v++) {
        var slot = v2wVegSlot(v);
        var pos = v2wTangential(guide.angle, slot.offset);
        var x = gate.x + pos.x;
        var z = gate.z + pos.z;
        v2wDummy.position.set(x, slot.height / 2, z);
        v2wDummy.rotation.set(0, guide.angle + slot.turn, 0);
        v2wDummy.scale.set(slot.width, slot.height, slot.width);
        v2wDummy.updateMatrix();
        try { v2wRestVegMesh.setMatrixAt(vegIndex, v2wDummy.matrix); } catch (e) {}
        v2wSetInstanceColor(v2wRestVegMesh, vegIndex, v2wMixHex(accent, slot.tint, 0.56));
        vegIndex += 1;
      }
    }
    if (v2wRestRuneMesh) {
      var runeCount = level >= 3 ? 2 : (level >= 2 ? 1 : 0);
      for (var r = 0; r < runeCount; r++) {
        var radius = r === 0 ? 1.62 : 2.08;
        v2wDummy.position.set(gate.x, 0.27 + r * 0.03, gate.z);
        v2wDummy.rotation.set(Math.PI / 2, 0, r * 0.35);
        v2wDummy.scale.set(radius, radius, radius);
        v2wDummy.updateMatrix();
        try { v2wRestRuneMesh.setMatrixAt(runeIndex, v2wDummy.matrix); } catch (e2) {}
        v2wSetInstanceColor(v2wRestRuneMesh, runeIndex, accent);
        runeIndex += 1;
      }
    }
    if (v2wRestCrystalMesh) {
      var crystalCount = level >= 3 ? 3 : (level >= 2 ? 1 : 0);
      for (var c = 0; c < crystalCount; c++) {
        var cSlot = v2wCrystalSlot(c);
        var cPos = v2wTangential(guide.angle, cSlot.offset);
        v2wDummy.position.set(gate.x + cPos.x, cSlot.y, gate.z + cPos.z);
        v2wDummy.rotation.set(0, guide.angle * 1.7 + c, 0);
        v2wDummy.scale.set(cSlot.scale, cSlot.scale * 1.7, cSlot.scale);
        v2wDummy.updateMatrix();
        try { v2wRestCrystalMesh.setMatrixAt(crystalIndex, v2wDummy.matrix); } catch (e3) {}
        v2wSetInstanceColor(v2wRestCrystalMesh, crystalIndex, v2wMixHex(accent, '#f2f0ea', c === 0 ? 0.2 : 0.5));
        crystalIndex += 1;
      }
    }
    if (level > 0 && v2wRestColumnMesh) {
      var columnHeight = level >= 3 ? 3.35 : (level >= 2 ? 2.45 : 1.55);
      var columnRadius = level >= 3 ? 0.30 : (level >= 2 ? 0.23 : 0.17);
      var columnColor = level >= 3
        ? v2wMixHex(accent, '#ffffff', 0.42)
        : (level >= 2 ? v2wMixHex(accent, '#ffffff', 0.16) : v2wMixHex(accent, '#05070d', 0.55));
      var sides = v2wQuality() === 'bajo' ? 1 : 2;
      for (var k = 0; k < sides; k++) {
        var sideOffset = k === 0 ? -1.95 : 1.95;
        var cpos = v2wTangential(guide.angle, sideOffset);
        v2wDummy.position.set(gate.x + cpos.x, columnHeight / 2 + 0.05, gate.z + cpos.z);
        v2wDummy.rotation.set(0, guide.angle + (k ? 0.16 : -0.16), 0);
        v2wDummy.scale.set(columnRadius, columnHeight, columnRadius);
        v2wDummy.updateMatrix();
        try { v2wRestColumnMesh.setMatrixAt(columnIndex, v2wDummy.matrix); } catch (e7) {}
        v2wSetInstanceColor(v2wRestColumnMesh, columnIndex, columnColor);
        columnIndex += 1;
      }
    }
    if (level > 0 && v2wRestHaloMesh) {
      var haloCount = 1;
      var haloColor = level >= 3
        ? v2wMixHex(accent, '#ffffff', 0.28)
        : (level >= 2 ? v2wMixHex(accent, '#ffffff', 0.12) : v2wMixHex(accent, '#05070d', 0.55));
      for (var h = 0; h < haloCount; h++) {
        var haloRadius = level >= 3 ? 1.1 : (level >= 2 ? 1.0 : 0.85);
        v2wDummy.position.set(gate.x, 3.52 - h * 0.1, gate.z);
        v2wDummy.rotation.set(Math.PI / 2, 0, guide.angle + (h ? 0.7 : 0));
        v2wDummy.scale.set(haloRadius, haloRadius, haloRadius);
        v2wDummy.updateMatrix();
        try { v2wRestHaloMesh.setMatrixAt(haloIndex, v2wDummy.matrix); } catch (e8) {}
        v2wSetInstanceColor(v2wRestHaloMesh, haloIndex, haloColor);
        haloIndex += 1;
      }
    }
  }
  if (v2wRestVegMesh) {
    v2wRestVegMesh.count = vegIndex;
    try { v2wRestVegMesh.instanceMatrix.needsUpdate = true; } catch (e4) {}
    v2wFlushColors(v2wRestVegMesh);
  }
  if (v2wRestRuneMesh) {
    v2wRestRuneMesh.count = runeIndex;
    try { v2wRestRuneMesh.instanceMatrix.needsUpdate = true; } catch (e5) {}
    v2wFlushColors(v2wRestRuneMesh);
  }
  if (v2wRestCrystalMesh) {
    v2wRestCrystalMesh.count = crystalIndex;
    try { v2wRestCrystalMesh.instanceMatrix.needsUpdate = true; } catch (e6) {}
    v2wFlushColors(v2wRestCrystalMesh);
  }
  if (v2wRestColumnMesh) {
    v2wRestColumnMesh.count = columnIndex;
    try { v2wRestColumnMesh.instanceMatrix.needsUpdate = true; } catch (e9) {}
    v2wFlushColors(v2wRestColumnMesh);
  }
  if (v2wRestHaloMesh) {
    v2wRestHaloMesh.count = haloIndex;
    try { v2wRestHaloMesh.instanceMatrix.needsUpdate = true; } catch (e10) {}
    v2wFlushColors(v2wRestHaloMesh);
  }
}
var v2wRestSignatureCache = '';
function v2wVegSlot(index) {
  if (index === 0) return { offset: -1.72, height: 0.52, width: 0.12, turn: 0.4, tint: '#b8d46a' };
  if (index === 1) return { offset: 1.72, height: 0.52, width: 0.12, turn: -0.4, tint: '#69d3c1' };
  if (index === 2) return { offset: -2.02, height: 0.78, width: 0.15, turn: 0.7, tint: '#b8d46a' };
  if (index === 3) return { offset: 2.02, height: 0.78, width: 0.15, turn: -0.7, tint: '#69d3c1' };
  if (index === 4) return { offset: -2.35, height: 0.96, width: 0.14, turn: 0.95, tint: '#b8d46a' };
  return { offset: 2.35, height: 0.96, width: 0.14, turn: -0.95, tint: '#69d3c1' };
}
function v2wCrystalSlot(index) {
  if (index === 0) return { offset: -2.55, y: 0.9, scale: 0.13 };
  if (index === 1) return { offset: 2.55, y: 0.78, scale: 0.11 };
  return { offset: 2.95, y: 0.66, scale: 0.1 };
}

/* -------------------------------------------------------------------------
   Sombras del error (derivadas de dueErrors, nunca marcadas a mano)
   ------------------------------------------------------------------------- */
function v2wDueList() {
  try {
    if (v2wIsFunction(dueErrors)) {
      var list = dueErrors();
      return list && list.length ? list : [];
    }
  } catch (e) {
    v2wSoft(e);
  }
  return [];
}
function v2wRefreshShadowData() {
  var list = v2wDueList();
  var byArea = {};
  for (var i = 0; i < list.length; i++) {
    var err = list[i];
    if (!err) continue;
    var q = v2wQuestion(err.questionId);
    var areaId = q && q.areaId ? q.areaId : (err.areaId || null);
    if (!areaId) continue;
    byArea[areaId] = (byArea[areaId] || 0) + 1;
  }
  var total = list.length;
  var active = 0;
  var signatureParts = [];
  for (var s = 0; s < v2wShadows.length; s++) {
    var shadow = v2wShadows[s];
    shadow.count = byArea[shadow.areaId] || 0;
    shadow.active = shadow.count > 0;
    if (shadow.active) active += 1;
    signatureParts.push(shadow.key + ':' + shadow.count);
  }
  var changed = signatureParts.join('|') !== v2wLastShadowSignature;
  v2wLastShadowSignature = signatureParts.join('|');
  v2wShadowState = { total: total, byArea: byArea, active: active, at: Date.now() };
  v2wCounts.shadows = active;
  return changed;
}
function v2wApplyShadowVisuals() {
  var i, sh;
  for (i = 0; i < v2wShadows.length; i++) {
    sh = v2wShadows[i];
    var scale = sh.active ? 1 : 0.0001;
    if (v2wShadowBodyMesh) {
      v2wDummy.position.set(sh.x, 0, sh.z);
      v2wDummy.rotation.set(0, sh.yaw, 0);
      v2wDummy.scale.set(scale, scale, scale);
      v2wDummy.updateMatrix();
      try { v2wShadowBodyMesh.setMatrixAt(sh.index, v2wDummy.matrix); } catch (e) {}
    }
    if (v2wShadowEyeMesh) {
      v2wDummy.position.set(sh.x, 0, sh.z);
      v2wDummy.rotation.set(0, sh.yaw, 0);
      v2wDummy.scale.set(scale, scale, scale);
      v2wDummy.updateMatrix();
      try { v2wShadowEyeMesh.setMatrixAt(sh.index, v2wDummy.matrix); } catch (e2) {}
    }
    if (v2wShadowRingMesh) {
      v2wDummy.position.set(sh.x, 0.055, sh.z);
      v2wDummy.rotation.set(Math.PI / 2, 0, 0);
      v2wDummy.scale.set(scale * 0.58, scale * 0.58, scale * 0.58);
      v2wDummy.updateMatrix();
      try { v2wShadowRingMesh.setMatrixAt(sh.index, v2wDummy.matrix); } catch (e3) {}
    }
    if (sh.sprite) {
      sh.sprite.visible = !!sh.active;
      if (sh.active && sh.drawnCount !== sh.count) {
        sh.drawnCount = sh.count;
        v2wDrawShadowCount(sh);
      }
    }
  }
  try { if (v2wShadowBodyMesh) v2wShadowBodyMesh.instanceMatrix.needsUpdate = true; } catch (e4) {}
  try { if (v2wShadowEyeMesh) v2wShadowEyeMesh.instanceMatrix.needsUpdate = true; } catch (e5) {}
  try { if (v2wShadowRingMesh) v2wShadowRingMesh.instanceMatrix.needsUpdate = true; } catch (e6) {}
}

/* -------------------------------------------------------------------------
   Animación (sin allocations por frame)
   ------------------------------------------------------------------------- */
function v2wHubVisible() {
  try {
    if (typeof hubGroup !== 'undefined' && hubGroup) return hubGroup.visible !== false;
  } catch (e) {}
  return false;
}
function v2wAnimateMarkers(time) {
  v2wApplyMarkerTransforms(time, true);
}
function v2wAnimateFragments(time) {
  if (!v2wFragmentMesh) return;
  for (var i = 0; i < v2wFreeFrags.length; i++) {
    var frag = v2wFreeFrags[i];
    var index = frag.crystalIndex;
    if (index < 0) continue;
    var scale = frag.collected ? 0.0001 : 0.17;
    var y = 0.86 + (frag.collected ? 0 : Math.sin(time * 1.15 + frag.phase) * 0.055);
    v2wDummy.position.set(frag.x, y, frag.z);
    v2wDummy.rotation.set(0, time * 0.85 + frag.phase, 0);
    v2wDummy.scale.set(scale, scale, scale);
    v2wDummy.updateMatrix();
    try { v2wFragmentMesh.setMatrixAt(index, v2wDummy.matrix); } catch (e) {}
  }
  try { v2wFragmentMesh.instanceMatrix.needsUpdate = true; } catch (e2) {}
}
function v2wAnimateShadows(time) {
  var any = false;
  for (var i = 0; i < v2wShadows.length; i++) {
    var sh = v2wShadows[i];
    if (!sh.active) continue;
    any = true;
    var y = Math.sin(time * 1.05 + sh.phase) * 0.045;
    var yaw = sh.yaw + Math.sin(time * 0.55 + sh.phase) * 0.035;
    if (v2wShadowBodyMesh) {
      v2wDummy.position.set(sh.x, y, sh.z);
      v2wDummy.rotation.set(0, yaw, 0);
      v2wDummy.scale.set(1, 1, 1);
      v2wDummy.updateMatrix();
      try { v2wShadowBodyMesh.setMatrixAt(sh.index, v2wDummy.matrix); } catch (e) {}
    }
    if (v2wShadowEyeMesh) {
      v2wDummy.position.set(sh.x, y, sh.z);
      v2wDummy.rotation.set(0, yaw, 0);
      v2wDummy.scale.set(1, 1, 1);
      v2wDummy.updateMatrix();
      try { v2wShadowEyeMesh.setMatrixAt(sh.index, v2wDummy.matrix); } catch (e2) {}
    }
    if (v2wShadowRingMesh) {
      v2wDummy.position.set(sh.x, 0.055, sh.z);
      v2wDummy.rotation.set(Math.PI / 2, 0, time * 0.4 + sh.phase);
      v2wDummy.scale.set(0.58, 0.58, 0.58);
      v2wDummy.updateMatrix();
      try { v2wShadowRingMesh.setMatrixAt(sh.index, v2wDummy.matrix); } catch (e3) {}
    }
  }
  if (!any) return;
  try { if (v2wShadowBodyMesh) v2wShadowBodyMesh.instanceMatrix.needsUpdate = true; } catch (e4) {}
  try { if (v2wShadowEyeMesh) v2wShadowEyeMesh.instanceMatrix.needsUpdate = true; } catch (e5) {}
  try { if (v2wShadowRingMesh) v2wShadowRingMesh.instanceMatrix.needsUpdate = true; } catch (e6) {}
}

/* -------------------------------------------------------------------------
   Sincronización completa
   ------------------------------------------------------------------------- */
function v2wSyncAll() {
  v2wSyncStateFlags();
  try { v2wSyncChests(); } catch (e) { v2wSoft(e); }
  try { v2wSyncFragments(); } catch (e2) { v2wSoft(e2); }
  try { v2wSyncMarkers(); } catch (e3) { v2wSoft(e3); }
  try { v2wSyncGuides(); } catch (e4) { v2wSoft(e4); }
  try { v2wSyncRestoration(); } catch (e5) { v2wSoft(e5); }
}
function v2wRefreshShadowsInternal(force) {
  var changed = false;
  try { changed = v2wRefreshShadowData(); } catch (e) { v2wSoft(e); }
  try { v2wApplyShadowVisuals(); } catch (e2) { v2wSoft(e2); }
  if ((changed || force) && v2wUI && v2wUI.open && (v2wUI.mode === 'shadow' || v2wUI.mode === 'telescope')) {
    try { v2wRenderPanel({ noFocus: true }); } catch (e3) { v2wSoft(e3); }
  }
  return v2wShadowState;
}

/* =========================================================================
   PARTE C · panel DOM, contenido, acciones e interacción
   ========================================================================= */
var v2wUI = {
  root: null, panel: null, eyebrow: null, titleEl: null, bodyEl: null, footEl: null, liveEl: null,
  open: false, mode: null, id: null, readerId: null, flash: '',
  focusReturn: null, keyInstalled: false
};
var v2wGuideScreenCache = {};

/* -------------------------------------------------------------------------
   Helpers de HTML
   ------------------------------------------------------------------------- */
function v2wChip(text, tone) {
  var cls = 'v2-world-chip' + (tone ? ' v2-world-chip--' + tone : '');
  return '<span class="' + cls + '">' + text + '</span>';
}
function v2wButton(action, label, opts) {
  var o = opts || {};
  var cls = 'v2-world-btn' + (o.primary ? ' v2-world-btn--primary' : (o.ghost ? ' v2-world-btn--ghost' : ''));
  var attrs = ' type="button" class="' + cls + '" data-action="' + v2wEscape(action) + '"';
  if (o.id) attrs += ' data-world-id="' + v2wEscape(o.id) + '"';
  if (o.fragment) attrs += ' data-fragment="' + v2wEscape(o.fragment) + '"';
  if (o.source) attrs += ' data-source="' + v2wEscape(o.source) + '"';
  if (o.autofocus) attrs += ' data-v2w-autofocus="1"';
  if (o.disabled) attrs += ' disabled aria-disabled="true"';
  if (o.title) attrs += ' title="' + v2wEscape(o.title) + '"';
  return '<button' + attrs + '>' + label + '</button>';
}
function v2wFootNote() {
  return '<span class="v2-world-footNote">Esc o E cierra</span>';
}
function v2wFlashBanner(text) {
  return '<div class="v2-world-banner" role="status">' + v2wIcon('checkCircle', 15) + '<div>' + v2wEscape(text) + '</div></div>';
}
function v2wCountBlock(count, label, dim) {
  return '<div class="v2-world-count' + (dim ? ' v2-world-count--dim' : '') + '"><b>' + count + '</b><span>' + label + '</span></div>';
}
function v2wStatusLine(text, tone) {
  var cls = 'v2-world-status' + (tone ? ' v2-world-status--' + tone : '');
  return '<div class="' + cls + '">' + v2wIcon(tone === 'dim' ? 'info' : 'checkCircle', 12) + ' ' + v2wEscape(text) + '</div>';
}
function v2wAreaLabel(areaId) {
  var area = v2wAreaById(areaId);
  return area ? v2wAreaShort(area) : 'Ruta';
}
function v2wQuestionOrigin(q) {
  if (!q) return 'Banco de estudio';
  if (q.source === 'flashcards' || q.source === 'dashboard') {
    return q.examTitle ? String(q.examTitle) : (q.origin ? String(q.origin) : 'Banco de estudio');
  }
  return q.origin ? String(q.origin) : (q.examTitle ? String(q.examTitle) : 'Banco de estudio');
}
function v2wQuestionSourceLine(q) {
  if (!q) return 'Fuente no disponible en este banco.';
  var html = 'Fuente: <b>' + v2wEscape(v2wQuestionOrigin(q)) + '</b>';
  if (q.origin && String(q.origin) !== v2wQuestionOrigin(q)) html += ' · procedencia ' + v2wEscape(q.origin);
  html += '<br>Pregunta <b>' + v2wEscape(q.id) + '</b>';
  if (q.flashcardId) html += ' · ficha <b>' + v2wEscape(q.flashcardId) + '</b>';
  return html;
}
function v2wFlashcardPreview(frag, q) {
  var html = '';
  html += '<hr class="v2-world-hr">';
  html += '<h3 class="v2-world-cardTitle">' + v2wEscape(frag.title) + '</h3>';
  if (q && q.stem) html += '<p class="v2-world-question">' + v2wEscape(q.stem) + '</p>';
  if (q) {
    html += '<div class="v2-world-key"><span>Clave</span><b>' + v2wEscape(v2wAnswerText(q)) + '</b></div>';
    if (q.explanation) html += '<blockquote class="v2-world-quote">' + v2wEscape(q.explanation) + '</blockquote>';
    html += '<div class="v2-world-source">' + v2wQuestionSourceLine(q) + '</div>';
  } else {
    html += '<p class="v2-world-note">El banco de preguntas no está disponible en esta sesión.</p>';
  }
  return html;
}

/* -------------------------------------------------------------------------
   Montaje del overlay (document.body, fuera de #screen)
   ------------------------------------------------------------------------- */
function v2wEnsureOverlay() {
  if (v2wUI.root) return v2wUI.root;
  if (typeof document === 'undefined' || !document.body) return null;
  var root = null;
  try { root = document.createElement('div'); } catch (e) { return null; }
  if (!root) return null;
  root.id = 'v2-world-overlay';
  root.className = 'v2-world-overlay';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML =
    '<div class="v2-world-scrim" aria-hidden="true"></div>' +
    '<section class="v2-world-panel" role="dialog" aria-modal="true" aria-labelledby="v2w-title">' +
      '<header class="v2-world-head">' +
        '<div class="v2-world-headText">' +
          '<p class="v2-world-eyebrow" id="v2w-eyebrow"></p>' +
          '<h2 class="v2-world-title" id="v2w-title"></h2>' +
        '</div>' +
        '<button type="button" class="v2-world-close" data-action="v2-world-close" aria-label="Cerrar panel">×</button>' +
      '</header>' +
      '<div class="v2-world-body" id="v2w-body"></div>' +
      '<footer class="v2-world-foot" id="v2w-foot"></footer>' +
      '<div class="v2-world-live" id="v2w-live" aria-live="polite"></div>' +
    '</section>';
  try { document.body.appendChild(root); } catch (e2) { return null; }
  v2wUI.root = root;
  try { v2wUI.panel = root.querySelector('.v2-world-panel'); } catch (e3) { v2wUI.panel = null; }
  try { v2wUI.eyebrow = root.querySelector('.v2-world-eyebrow'); } catch (e4) { v2wUI.eyebrow = null; }
  try { v2wUI.titleEl = root.querySelector('.v2-world-title'); } catch (e5) { v2wUI.titleEl = null; }
  try { v2wUI.bodyEl = root.querySelector('#v2w-body'); } catch (e6) { v2wUI.bodyEl = null; }
  try { v2wUI.footEl = root.querySelector('#v2w-foot'); } catch (e7) { v2wUI.footEl = null; }
  try { v2wUI.liveEl = root.querySelector('#v2w-live'); } catch (e8) { v2wUI.liveEl = null; }
  try { root.addEventListener('click', v2wOnOverlayClick, false); } catch (e9) { v2wSoft(e9); }
  var core = v2wCore();
  if (core && core.quality && core.quality() === 'bajo') root.className += ' is-low';
  return root;
}

function v2wClosestAction(node) {
  var current = node;
  var guard = 0;
  while (current && guard < 24) {
    guard += 1;
    if (current.getAttribute) {
      var action = current.getAttribute('data-action');
      if (action) return current;
    }
    if (v2wUI.root && current === v2wUI.root) break;
    current = current.parentNode;
  }
  return null;
}
function v2wOnOverlayClick(event) {
  if (!v2wUI.open) return;
  var el = v2wClosestAction(event.target);
  if (!el) return;
  var action = el.getAttribute('data-action') || '';
  if (action.indexOf('v2-world-') !== 0) return;
  try {
    event.preventDefault();
    event.stopPropagation();
  } catch (e) {}
  v2wHandleAction(action, el);
}
function v2wOpenPanel(mode, id, opts) {
  var root = v2wEnsureOverlay();
  if (!root) return false;
  var o = opts || {};
  if (!v2wUI.open) {
    try { v2wUI.focusReturn = document.activeElement || null; } catch (e) { v2wUI.focusReturn = null; }
    v2wUI.open = true;
    try { root.classList.add('is-open'); } catch (e2) {}
    try { root.setAttribute('aria-hidden', 'false'); } catch (e3) {}
    try {
      if (v2wQuality() === 'bajo') root.classList.add('is-low');
      else root.classList.remove('is-low');
    } catch (e4) {}
  }
  v2wUI.mode = mode;
  v2wUI.id = id || null;
  if (mode === 'library') v2wUI.readerId = o.readerId || null;
  else v2wUI.readerId = null;
  v2wRenderPanel(o);
  return true;
}
function v2wClosePanel(restoreFocus) {
  if (!v2wUI.open) return false;
  v2wUI.open = false;
  v2wUI.mode = null;
  v2wUI.id = null;
  v2wUI.readerId = null;
  if (v2wUI.root) {
    try { v2wUI.root.classList.remove('is-open'); } catch (e) {}
    try { v2wUI.root.setAttribute('aria-hidden', 'true'); } catch (e2) {}
  }
  if (v2wUI.liveEl) {
    try { v2wUI.liveEl.textContent = ''; } catch (e3) {}
  }
  var target = v2wUI.focusReturn;
  v2wUI.focusReturn = null;
  if (restoreFocus !== false && target && target.focus) {
    try { target.focus(); } catch (e4) {}
  }
  return true;
}
function v2wFocusAction(action) {
  if (!v2wUI.panel || !action) { v2wFocusDefault(); return; }
  var el = null;
  try { el = v2wUI.panel.querySelector('[data-action="' + action + '"]'); } catch (e) { el = null; }
  if (el && el.focus) {
    try { el.focus(); return; } catch (e2) {}
  }
  v2wFocusDefault();
}
function v2wFocusDefault() {
  if (!v2wUI.panel) return;
  var el = null;
  try { el = v2wUI.panel.querySelector('[data-v2w-autofocus]'); } catch (e) { el = null; }
  if (!el) {
    try { el = v2wUI.panel.querySelector('.v2-world-close'); } catch (e2) { el = null; }
  }
  if (el && el.focus) {
    try { el.focus(); } catch (e3) {}
  }
}
function v2wFocusableNodes() {
  if (!v2wUI.panel || !v2wUI.panel.querySelectorAll) return [];
  var out = [];
  try {
    var nodes = v2wUI.panel.querySelectorAll('button:not([disabled])');
    for (var i = 0; i < nodes.length; i++) if (nodes[i] && nodes[i].focus) out.push(nodes[i]);
  } catch (e) {}
  return out;
}
function v2wMoveFocus(backwards) {
  var nodes = v2wFocusableNodes();
  if (!nodes.length) return;
  var active = null;
  try { active = document.activeElement; } catch (e) {}
  var index = -1;
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i] === active) { index = i; break; }
  }
  var next = index === -1 ? (backwards ? nodes.length - 1 : 0) : (index + (backwards ? -1 : 1) + nodes.length) % nodes.length;
  try { nodes[next].focus(); } catch (e2) {}
}
function v2wRenderPanel(opts) {
  var o = opts || {};
  if (!v2wUI.open || !v2wUI.bodyEl) return;
  var data = null;
  try { data = v2wPanelData(v2wUI.mode, v2wUI.id); } catch (e) { v2wSoft(e); data = null; }
  if (!data) { v2wClosePanel(); return; }
  var flash = v2wUI.flash;
  v2wUI.flash = '';
  if (v2wUI.eyebrow) v2wUI.eyebrow.textContent = data.eyebrow || '';
  if (v2wUI.titleEl) v2wUI.titleEl.textContent = data.title || '';
  if (v2wUI.panel) {
    try {
      if (v2wUI.panel.style && v2wUI.panel.style.setProperty) v2wUI.panel.style.setProperty('--v2w-accent', data.accent || '#69d3c1');
    } catch (e2) {}
  }
  try {
    v2wUI.bodyEl.innerHTML = (flash ? v2wFlashBanner(flash) : '') + (data.body || '');
  } catch (e3) { v2wSoft(e3); }
  try {
    if (v2wUI.footEl) v2wUI.footEl.innerHTML = (data.foot || '');
  } catch (e4) { v2wSoft(e4); }
  if (v2wUI.liveEl) {
    try { v2wUI.liveEl.textContent = flash || ''; } catch (e5) {}
  }
  if (o.noFocus) return;
  if (o.focusAction) v2wFocusAction(o.focusAction);
  else v2wFocusDefault();
}

/* -------------------------------------------------------------------------
   Contenido de cada panel
   ------------------------------------------------------------------------- */
function v2wPanelData(mode, id) {
  if (mode === 'chest') return v2wPanelChest(id);
  if (mode === 'fragment') return v2wPanelFragment(id);
  if (mode === 'guide') return v2wPanelGuide(id);
  if (mode === 'telescope') return v2wPanelTelescope(id);
  if (mode === 'library') return v2wPanelLibrary(id);
  if (mode === 'shadow') return v2wPanelShadow(id);
  return null;
}

function v2wPanelChest(chestId) {
  var chest = v2wChestById[chestId];
  if (!chest) return null;
  var st = v2wChestState(chestId);
  var opened = !!(st && st.openedAt);
  var frag = v2wFragById[chest.fragmentId];
  var q = frag ? v2wQuestion(frag.questionId) : null;
  var excerpt = q ? v2wExcerpt(q.explanation, 220) : 'Fragmento del banco de preguntas del juego.';
  var html = '';
  html += '<p class="v2-world-lede">' +
    (opened
      ? 'Este cofre ya fue abierto. La recompensa se entregó una sola vez.'
      : 'Un cofre oculto junto a la puerta de <b>' + v2wEscape(chest.short) + '</b>. Se abre una sola vez y guarda su contenido.') +
    '</p>';
  html += '<div class="v2-world-rewards">' +
    v2wChip('+5 XP', 'xp') +
    v2wChip('+5 monedas · tope diario 120', 'coin') +
    v2wChip('Fragmento + flashcard', 'frag') +
    '</div>';
  if (opened) {
    html += v2wStatusLine('Abierto el ' + v2wShortDate(st.openedAt));
    if (st && typeof st.coins === 'number') {
      html += '<p class="v2-world-note">Recibido: <b>+' + (Number(st.xp) || 5) + ' XP del cofre + 5 XP del fragmento</b> · <b>' +
        (st.coins > 0 ? '+' + st.coins + ' ' + v2wPlural(st.coins, 'moneda', 'monedas') : '0 monedas (tope diario)') +
        '</b>.</p>';
    }
  }
  html += '<div class="v2-world-rewardBox">' +
    '<h3>' + v2wEscape(frag ? frag.title : 'Fragmento de conocimiento') + '</h3>' +
    '<p>' + v2wEscape(excerpt) + '</p>' +
    '</div>';
  html += '<p class="v2-world-note">' +
    (opened
      ? 'La flashcard está disponible en la Biblioteca de fichas.'
      : 'Al abrirlo se guarda el fragmento, se desbloquea su flashcard y se entrega la recompensa.') +
    '</p>';
  var foot = '';
  if (opened && frag) {
    foot += v2wButton('v2-world-library-read', v2wIcon('bookOpen', 14) + ' Ver flashcard', { primary: true, fragment: frag.id, autofocus: true });
  } else if (!opened) {
    foot += v2wButton('v2-world-chest-open', v2wIcon('seal', 14) + ' Abrir cofre', { primary: true, id: chestId, autofocus: true });
  }
  foot += v2wButton('v2-world-close', 'Cerrar', { ghost: true });
  return {
    accent: chest.accent,
    eyebrow: 'Cofre escondido · ' + chest.short,
    title: opened ? 'Cofre abierto' : 'Cofre de ' + chest.short,
    body: html,
    foot: v2wFootNote() + foot
  };
}

function v2wPanelFragment(fragmentId) {
  var frag = v2wFragById[fragmentId];
  if (!frag || frag.slot === 'chest') return null;
  var entry = v2wFragmentState(fragmentId);
  var collected = !!(entry && entry.collectedAt);
  var q = v2wQuestion(frag.questionId);
  var html = '';
  html += '<p class="v2-world-lede">' +
    (collected
      ? 'Fragmento guardado. Su flashcard ya forma parte de la Biblioteca.'
      : 'Un fragmento de conocimiento del banco. Guárdalo para desbloquear su flashcard; la recompensa es única.') +
    '</p>';
  html += '<div class="v2-world-rewards">' +
    v2wChip('+' + V2W_FRAGMENT_XP + ' XP', 'xp') +
    v2wChip('Flashcard', 'frag') +
    v2wChip('Guardado único', 'soft') +
    '</div>';
  html += '<blockquote class="v2-world-quote">' +
    v2wEscape(q ? v2wExcerpt(q.explanation, 240) : 'El banco no tiene explicación para esta pregunta.') +
    '</blockquote>';
  html += '<div class="v2-world-source">' + (q ? v2wQuestionSourceLine(q) : 'Pregunta <b>' + v2wEscape(frag.questionId) + '</b>') + '</div>';
  if (collected) {
    html += v2wStatusLine('Guardado el ' + v2wShortDate(entry.collectedAt));
    html += v2wFlashcardPreview(frag, q);
  } else {
    html += '<div class="v2-world-empty"><b>Flashcard bloqueada</b>' +
      'Al guardar el fragmento se desbloquea «' + v2wEscape(frag.title) + '» en la Biblioteca de fichas.' +
      '</div>';
    html += '<p class="v2-world-note">Guardar entrega +' + V2W_FRAGMENT_XP + ' XP una sola vez. Repetir la lectura no da XP.</p>';
  }
  var foot = '';
  if (collected) {
    foot += v2wButton('v2-world-library-read', v2wIcon('bookOpen', 14) + ' Ver flashcard', { primary: true, fragment: frag.id, autofocus: true });
  } else {
    foot += v2wButton('v2-world-fragment-save', v2wIcon('scroll', 14) + ' Guardar fragmento · +5 XP', { primary: true, id: frag.id, autofocus: true });
  }
  foot += v2wButton('v2-world-close', 'Cerrar', { ghost: true });
  return {
    accent: frag.accent,
    eyebrow: 'Fragmento de conocimiento · ' + frag.short,
    title: frag.title,
    body: html,
    foot: v2wFootNote() + foot
  };
}

function v2wGuideScreens(areaId) {
  if (v2wGuideScreenCache[areaId]) return v2wGuideScreenCache[areaId];
  var guide = null;
  for (var i = 0; i < v2wGuides.length; i++) if (v2wGuides[i].areaId === areaId) guide = v2wGuides[i];
  if (!guide) return [];
  var area = v2wAreaById(areaId) || { id: areaId, short: guide.short, blurb: '', icon: 'compass' };
  var missions = v2wAreaMissions(areaId);
  var missionCount = 0, bossCount = 0;
  for (i = 0; i < missions.length; i++) {
    if (missions[i] && missions[i].kind === 'boss') bossCount += 1;
    else missionCount += 1;
  }
  var screens = [];
  screens.push({
    title: 'La ruta de ' + v2wAreaShort(area),
    html: '<p class="v2-world-lede">Soy <b>' + v2wEscape(guide.name) + '</b>, ' + v2wEscape(guide.role) + ' de esta ruta. ' + v2wEscape(area.blurb || '') + '</p>' +
      '<div class="v2-world-metaRow"><span><b>' + missionCount + '</b> ' + v2wPlural(missionCount, 'misión', 'misiones') + '</span>' +
      '<span><b>' + bossCount + '</b> ' + v2wPlural(bossCount, 'jefe de ruta', 'jefes de ruta') + '</span>' +
      '<span>Ruta <b>' + (v2wAreaIndex(areaId) + 1) + '</b> de 5</span></div>' +
      '<p class="v2-world-note">Lección breve de tres pantallas como máximo. La primera lectura da +5 XP; repetirla no da recompensa.</p>'
  });
  var q = v2wQuestion(guide.questionId);
  if (q && q.explanation) {
    screens.push({
      title: 'Idea clave del banco',
      html: '<p class="v2-world-question">' + v2wEscape(q.stem) + '</p>' +
        '<blockquote class="v2-world-quote">' + v2wEscape(q.explanation) + '</blockquote>' +
        '<div class="v2-world-source">' + v2wQuestionSourceLine(q) + '</div>' +
        '<p class="v2-world-note">Texto del banco de preguntas del juego; esta lección no añade datos clínicos.</p>'
    });
  }
  screens.push({
    title: 'Cómo practicar esta ruta',
    html: '<ul class="v2-world-list">' +
      '<li><span class="v2-world-listIcon">' + v2wIcon('book', 15) + '</span><div><b>Bitácora (J):</b> elige una misión de ' + v2wEscape(v2wAreaShort(area)) + ' y responde sin prisa.</div></li>' +
      '<li><span class="v2-world-listIcon">' + v2wIcon('rotate', 15) + '</span><div><b>Repaso espaciado (R):</b> las preguntas falladas vuelven cuando toca; el telescopio te dice cuántas hay.</div></li>' +
      '<li><span class="v2-world-listIcon">' + v2wIcon('compass', 15) + '</span><div><b>Restauración:</b> la puerta gana vegetación, runas y luz al completar misiones o dominar preguntas. Es visual y no da recompensas.</div></li>' +
      '<li><span class="v2-world-listIcon">' + v2wIcon('shield', 15) + '</span><div><b>Sin farmeo:</b> repetir misiones, lecciones o cofres no multiplica las recompensas.</div></li>' +
      '</ul>' +
      '<p class="v2-world-note">La ruta termina con su jefe de área. Las respuestas correctas sostienen el escudo del duelo.</p>'
  });
  v2wGuideScreenCache[areaId] = screens;
  return screens;
}
function v2wPrepareGuide(guide) {
  if (!guide) return null;
  var stateRec = v2wEnsureGuideState(guide.areaId);
  if (!stateRec) return null;
  var screens = v2wGuideScreens(guide.areaId);
  if (!screens.length) return null;
  var step = v2wClamp(Number(stateRec.step) || 0, 0, screens.length - 1);
  stateRec.step = step;
  if (step >= screens.length - 1 && !stateRec.completedAt) {
    stateRec.completedAt = v2wNowISO();
    stateRec.xp = V2W_GUIDE_XP;
    v2wAward(V2W_GUIDE_XP, 0, { id: guide.id, kind: 'guide' });
    v2wPersist();
    guide.completed = true;
    v2wSyncMarkers();
    v2wUI.flash = 'Lección completada · +' + V2W_GUIDE_XP + ' XP';
    v2wEmit('world:guide', { id: guide.id, areaId: guide.areaId, xp: V2W_GUIDE_XP });
  }
  return { state: stateRec, screens: screens, step: step };
}
function v2wPanelGuide(guideIdOrAreaId) {
  var guide = v2wGuideById[guideIdOrAreaId] || null;
  if (!guide) {
    for (var i = 0; i < v2wGuides.length; i++) {
      if (v2wGuides[i].areaId === guideIdOrAreaId) { guide = v2wGuides[i]; break; }
    }
  }
  if (!guide) return null;
  var view = v2wPrepareGuide(guide);
  if (!view) return null;
  var step = view.step;
  var screens = view.screens;
  var last = step >= screens.length - 1;
  var stateRec = view.state;
  var html = '';
  if (stateRec.completedAt) {
    html += v2wStatusLine('Completada el ' + v2wShortDate(stateRec.completedAt) + ' · repetir no da XP', 'gold');
  }
  html += '<div class="v2-world-dots" aria-hidden="true">';
  for (var d = 0; d < screens.length; d++) html += '<span class="v2-world-dot' + (d <= step ? ' is-on' : '') + '"></span>';
  html += '</div>';
  html += screens[step].html;
  var foot = '';
  if (step > 0) foot += v2wButton('v2-world-guide-prev', v2wIcon('chevronLeft', 14) + ' Anterior', { ghost: true, id: guide.areaId });
  if (!last) {
    foot += v2wButton('v2-world-guide-next', 'Siguiente ' + v2wIcon('chevronRight', 14), { primary: true, id: guide.areaId, autofocus: true });
  } else {
    foot += v2wButton('v2-world-close', v2wIcon('check', 14) + ' Terminar lección', { primary: true, autofocus: true });
  }
  foot += v2wButton('v2-world-close', 'Cerrar', { ghost: true });
  return {
    accent: guide.accent,
    eyebrow: 'Guía de ' + guide.short + ' · ' + (step + 1) + ' de ' + screens.length,
    title: screens[step].title,
    body: html,
    foot: v2wFootNote() + foot
  };
}

function v2wPanelTelescope() {
  v2wRefreshShadowData();
  var due = v2wShadowState.total;
  var nextLabel = null;
  try { if (v2wIsFunction(nextDueLabel)) nextLabel = nextDueLabel(); } catch (e) {}
  if (!nextLabel && due > 0) nextLabel = due + ' ' + v2wPlural(due, 'pregunta', 'preguntas') + ' por repasar';
  var html = '';
  html += v2wCountBlock(due, due > 0 ? v2wPlural(due, 'error vencido por revisar', 'errores vencidos por revisar') : 'sin errores vencidos', due === 0);
  html += '<p class="v2-world-lede">' + (due > 0
    ? 'El telescopio reúne los errores que ya toca revisar. El repaso espaciado real decide cuándo vuelven.'
    : 'No hay errores vencidos. El telescopio no inventa repasos: espera a que alguna pregunta cumpla su fecha.') + '</p>';
  if (nextLabel) {
    html += '<div class="v2-world-metaRow"><span><b>' + v2wEscape(nextLabel) + '</b></span><span>fechas del repaso espaciado</span></div>';
  }
  var rows = '';
  for (var i = 0; i < v2wGuides.length; i++) {
    var guide = v2wGuides[i];
    var count = v2wShadowState.byArea[guide.areaId] || 0;
    if (!count) continue;
    rows += '<li><span class="v2-world-listIcon">' + v2wIcon('alert', 14) + '</span><div><b>' + v2wEscape(guide.short) + '</b> · ' +
      count + ' ' + v2wPlural(count, 'error vencido', 'errores vencidos') + '</div></li>';
  }
  if (rows) html += '<ul class="v2-world-list">' + rows + '</ul>';
  html += '<p class="v2-world-note">Abrir el repaso no marca nada a mano: las sombras del error se disipan cuando su área queda sin errores vencidos.</p>';
  var foot = '';
  foot += v2wButton('v2-world-review-open', v2wIcon('rotate', 14) + ' Abrir repaso', {
    primary: true, source: 'telescope', autofocus: due > 0, disabled: due === 0
  });
  foot += v2wButton('v2-world-close', 'Cerrar', { ghost: true });
  return {
    accent: '#7AA2FF',
    eyebrow: 'Estación de repaso · Observatorio',
    title: 'Telescopio del repaso',
    body: html,
    foot: v2wFootNote() + foot
  };
}

function v2wPanelShadow(shadowId) {
  v2wRefreshShadowData();
  var shadow = v2wShadowById[shadowId];
  if (!shadow) return null;
  var count = shadow.count;
  var area = v2wAreaById(shadow.areaId);
  var html = '';
  html += v2wCountBlock(count, count > 0 ? v2wPlural(count, 'error vencido en esta ruta', 'errores vencidos en esta ruta') : 'sin errores vencidos', count === 0);
  html += '<p class="v2-world-lede">' + (count > 0
    ? 'La sombra se forma con los errores vencidos de <b>' + v2wEscape(shadow.short) + '</b>. No se derrota respondiendo lo mismo: se disipa cuando el repaso deja el área sin errores vencidos.'
    : 'La sombra se disipó: no quedan errores vencidos en <b>' + v2wEscape(shadow.short) + '</b>.') + '</p>';
  if (area && area.blurb) {
    html += '<div class="v2-world-metaRow"><span>' + v2wEscape(area.blurb) + '</span></div>';
  }
  html += '<p class="v2-world-note">El número viene de <b>dueErrors()</b> y se actualiza solo. No hay recompensa por la sombra y no se puede farmear.</p>';
  var foot = '';
  if (count > 0) {
    foot += v2wButton('v2-world-review-open', v2wIcon('rotate', 14) + ' Repasar ahora', {
      primary: true, source: 'shadow', id: shadowId, autofocus: true
    });
  }
  foot += v2wButton('v2-world-close', 'Cerrar', { ghost: true });
  return {
    accent: shadow.accent || '#C49BFF',
    eyebrow: 'Errores vencidos · ' + shadow.short,
    title: count > 0 ? 'Sombra del error' : 'La sombra se disipó',
    body: html,
    foot: v2wFootNote() + foot
  };
}

function v2wPanelLibrary() {
  var unlocked = v2wUnlockedFragments();
  var readerId = v2wUI.readerId;
  if (readerId) {
    var readerFrag = v2wFragById[readerId];
    var readerEntry = v2wFragmentState(readerId);
    if (readerFrag && readerEntry && readerEntry.collectedAt) {
      var rq = v2wQuestion(readerFrag.questionId);
      var rhtml = '';
      rhtml += '<div class="v2-world-metaRow"><span>' + v2wEscape(v2wAreaLabel(readerFrag.areaId)) + '</span><span>ficha <b>' +
        v2wEscape(readerEntry.flashcardId || (rq && rq.flashcardId) || '—') + '</b></span><span>pregunta <b>' +
        v2wEscape(readerFrag.questionId) + '</b></span></div>';
      if (rq && rq.stem) rhtml += '<p class="v2-world-question">' + v2wEscape(rq.stem) + '</p>';
      if (rq) {
        rhtml += '<div class="v2-world-key"><span>Clave</span><b>' + v2wEscape(v2wAnswerText(rq)) + '</b></div>';
        if (rq.explanation) rhtml += '<blockquote class="v2-world-quote">' + v2wEscape(rq.explanation) + '</blockquote>';
        rhtml += '<div class="v2-world-source">' + v2wQuestionSourceLine(rq) + '</div>';
      } else {
        rhtml += '<p class="v2-world-note">El banco de preguntas no está disponible en esta sesión.</p>';
      }
      rhtml += '<p class="v2-world-note">Lector local: el contenido viene del banco del juego y no hace peticiones de red.</p>';
      return {
        accent: readerFrag.accent,
        eyebrow: 'Flashcard · ' + readerFrag.short,
        title: readerFrag.title,
        body: rhtml,
        foot: v2wFootNote() +
          v2wButton('v2-world-library-back', v2wIcon('chevronLeft', 14) + ' Volver a la lista', { primary: true, autofocus: true }) +
          v2wButton('v2-world-close', 'Cerrar', { ghost: true })
      };
    }
    v2wUI.readerId = null;
  }

  var html = '';
  html += '<p class="v2-world-lede">Las flashcard se desbloquean al guardar fragmentos. Este lector es local: no usa red ni servicios externos.</p>';
  html += '<div class="v2-world-rewards">' +
    v2wChip('<b>' + unlocked.length + '</b> de ' + v2wFrags.length + ' fichas', 'frag') +
    v2wChip('10 fragmentos en el atrio + 5 en cofres', 'soft') +
    '</div>';
  if (!unlocked.length) {
    html += '<div class="v2-world-empty"><b>Aún no hay fichas</b>' +
      'Busca los 10 fragmentos que flotan en el atrio y abre los 5 cofres escondidos. Cada fragmento guardado desbloquea una flashcard aquí.' +
      '</div>';
  } else {
    html += '<div class="v2-world-rows">';
    for (var i = 0; i < unlocked.length; i++) {
      var frag = unlocked[i].fragment;
      var entry = unlocked[i].entry;
      var q = v2wQuestion(frag.questionId);
      html += '<button type="button" class="v2-world-row" data-action="v2-world-library-read" data-fragment="' + v2wEscape(frag.id) + '">' +
        '<span class="v2-world-rowIcon" aria-hidden="true">' + v2wIcon('bookOpen', 15) + '</span>' +
        '<span class="v2-world-rowBody"><b>' + v2wEscape(frag.title) + '</b><small>' +
        v2wEscape(v2wAreaLabel(frag.areaId)) + ' · ' + v2wEscape(v2wQuestionOrigin(q)) + ' · ' +
        v2wEscape(entry.flashcardId || (q && q.flashcardId) || 'ficha') + '</small></span>' +
        '<span class="v2-world-rowGo" aria-hidden="true">›</span>' +
        '</button>';
    }
    html += '</div>';
  }
  var foot = '';
  if (!unlocked.length) {
    foot += v2wButton('v2-world-close', v2wIcon('compass', 14) + ' Explorar el atrio', { primary: true, autofocus: true });
  } else {
    foot += v2wButton('v2-world-close', 'Cerrar', { ghost: true, autofocus: !unlocked.length });
  }
  return {
    accent: '#69D3C1',
    eyebrow: 'Biblioteca · lector local',
    title: 'Biblioteca de fichas',
    body: html,
    foot: v2wFootNote() + foot
  };
}

/* -------------------------------------------------------------------------
   Acciones
   ------------------------------------------------------------------------- */
function v2wActionChestOpen(chestId) {
  var chest = v2wChestById[chestId];
  if (!chest) return false;
  var stateRec = v2wEnsureChestState(chestId);
  if (!stateRec) return false;
  if (stateRec.openedAt) {
    v2wUI.flash = 'Este cofre ya estaba abierto; no se repite la recompensa.';
    v2wRenderPanel({ noFocus: true });
    return false;
  }
  stateRec.openedAt = v2wNowISO();
  chest.opened = true;
  var award = v2wAward(V2W_CHEST_XP, V2W_CHEST_COINS, { id: chestId, kind: 'chest' });
  stateRec.xp = award.xp;
  stateRec.coins = award.coins;
  stateRec.capReached = award.capReached;
  var fragResult = null;
  if (chest.fragmentId) fragResult = v2wCollectFragment(chest.fragmentId);
  v2wSyncChests();
  v2wSyncMarkers();
  v2wPersist();
  var totalXp = award.xp + (fragResult && fragResult.awarded && fragResult.award ? fragResult.award.xp : 0);
  var coinsText = award.coins > 0
    ? '+' + award.coins + ' ' + v2wPlural(award.coins, 'moneda', 'monedas')
    : '0 monedas (tope diario de 120)';
  v2wUI.flash = 'Cofre abierto · +' + totalXp + ' XP · ' + coinsText;
  v2wEmit('world:chest', { id: chestId, xp: totalXp, coins: award.coins, capReached: award.capReached, fragmentId: chest.fragmentId });
  v2wRenderPanel({ focusAction: chest.fragmentId ? 'v2-world-library-read' : '' });
  return true;
}
function v2wActionFragmentSave(fragmentId) {
  var frag = v2wFragById[fragmentId];
  if (!frag || frag.slot === 'chest') return false;
  var existing = v2wFragmentState(fragmentId);
  if (existing && existing.collectedAt) {
    v2wUI.flash = 'El fragmento ya estaba guardado; no se repite la recompensa.';
    v2wRenderPanel({ noFocus: true });
    return false;
  }
  var result = v2wCollectFragment(fragmentId);
  v2wPersist();
  if (result && result.awarded) {
    v2wUI.flash = 'Fragmento guardado · +' + V2W_FRAGMENT_XP + ' XP · flashcard desbloqueada';
    v2wEmit('world:fragment', { id: fragmentId, questionId: frag.questionId, xp: V2W_FRAGMENT_XP });
  } else {
    v2wUI.flash = 'El fragmento ya estaba guardado.';
  }
  v2wRenderPanel({ focusAction: 'v2-world-library-read' });
  return true;
}
function v2wActionGuideStep(areaId, delta) {
  var guide = null;
  for (var i = 0; i < v2wGuides.length; i++) if (v2wGuides[i].areaId === areaId) guide = v2wGuides[i];
  if (!guide) return false;
  var stateRec = v2wEnsureGuideState(areaId);
  if (!stateRec) return false;
  var screens = v2wGuideScreens(areaId);
  if (!screens.length) return false;
  var step = v2wClamp((Number(stateRec.step) || 0) + delta, 0, screens.length - 1);
  stateRec.step = step;
  v2wPersist();
  if (delta > 0 && step >= screens.length - 1 && !stateRec.completedAt) {
    v2wPrepareGuide(guide);
  }
  v2wRenderPanel({ focusAction: step < screens.length - 1 ? 'v2-world-guide-next' : '' });
  return true;
}
function v2wActionLibraryRead(fragmentId) {
  var frag = v2wFragById[fragmentId];
  if (!frag) return false;
  var entry = v2wFragmentState(fragmentId);
  if (!entry || !entry.collectedAt) return false;
  v2wUI.readerId = fragmentId;
  if (v2wUI.mode !== 'library') {
    v2wUI.mode = 'library';
    v2wUI.id = 'v2w-library';
  }
  v2wRenderPanel({ focusAction: 'v2-world-library-back' });
  return true;
}
function v2wLaunchReview() {
  try {
    if (v2wIsFunction(openReview)) { openReview(); return true; }
  } catch (e) { v2wSoft(e); }
  return false;
}
function v2wActionReview(source, shadowId) {
  if (!v2wIsFunction(openReview)) {
    v2wUI.flash = 'El repaso espaciado no está disponible en esta pantalla.';
    v2wRenderPanel({ noFocus: true });
    return false;
  }
  if (source === 'telescope') {
    v2wClosePanel();
    v2wLaunchReview();
    return true;
  }
  if (source === 'shadow') {
    v2wRefreshShadowData();
    var shadow = v2wShadowById[shadowId];
    if (!shadow || !shadow.count) {
      v2wUI.flash = 'La sombra se disipó: no quedan errores vencidos en esta ruta.';
      v2wRenderPanel({ noFocus: true });
      return false;
    }
    v2wMarkVisited(shadowId);
    v2wPersist();
    v2wClosePanel();
    v2wLaunchReview();
    return true;
  }
  return false;
}
function v2wHandleAction(action, target) {
  var worldId = target && target.getAttribute ? (target.getAttribute('data-world-id') || '') : '';
  var fragmentId = target && target.getAttribute ? (target.getAttribute('data-fragment') || '') : '';
  var source = target && target.getAttribute ? (target.getAttribute('data-source') || '') : '';
  if (action === 'v2-world-close') { v2wClosePanel(); return true; }
  if (action === 'v2-world-chest-open') return v2wActionChestOpen(worldId);
  if (action === 'v2-world-fragment-save') return v2wActionFragmentSave(worldId);
  if (action === 'v2-world-guide-next') return v2wActionGuideStep(worldId || v2wUI.id, 1);
  if (action === 'v2-world-guide-prev') return v2wActionGuideStep(worldId || v2wUI.id, -1);
  if (action === 'v2-world-library-read') return v2wActionLibraryRead(fragmentId || worldId);
  if (action === 'v2-world-library-back') {
    v2wUI.readerId = null;
    v2wRenderPanel({ focusAction: 'v2-world-library-read' });
    return true;
  }
  if (action === 'v2-world-review-open') return v2wActionReview(source, worldId);
  return false;
}

/* -------------------------------------------------------------------------
   Teclado en fase de captura (E/Enter/Espacio/Escape)
   ------------------------------------------------------------------------- */
function v2wOnKeydown(event) {
  if (!v2wUI.open) return;
  var code = event.code || '';
  var key = event.key || '';
  if (code === 'Escape' || key === 'Escape' || key === 'Esc') {
    event.preventDefault();
    event.stopPropagation();
    v2wClosePanel();
    return;
  }
  if (code === 'Tab' || key === 'Tab') {
    event.preventDefault();
    event.stopPropagation();
    v2wMoveFocus(!!event.shiftKey);
    return;
  }
  var isEnter = code === 'Enter' || code === 'NumpadEnter' || key === 'Enter';
  var isSpace = code === 'Space' || key === ' ' || key === 'Spacebar';
  if (isEnter || isSpace) {
    var focused = v2wClosestAction(event.target);
    var tag = focused && focused.tagName ? String(focused.tagName).toUpperCase() : '';
    if (tag === 'BUTTON') {
      /* El botón enfocado recibe la activación nativa; el juego no. */
      event.stopPropagation();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    var primary = null;
    try { primary = v2wUI.panel ? v2wUI.panel.querySelector('[data-v2w-autofocus]') : null; } catch (e) { primary = null; }
    if (primary && primary.click) {
      try { primary.click(); } catch (e2) {}
    }
    return;
  }
  if (code === 'KeyE' || key === 'e' || key === 'E') {
    event.preventDefault();
    event.stopPropagation();
    v2wClosePanel();
    return;
  }
  var gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD',
    'KeyM', 'KeyR', 'KeyG', 'KeyH', 'KeyI', 'KeyJ', 'KeyP', 'KeyC'];
  var blocked = false;
  for (var i = 0; i < gameKeys.length; i++) if (code === gameKeys[i]) blocked = true;
  if (blocked || /^Digit[0-9]$/.test(code)) {
    event.preventDefault();
    event.stopPropagation();
  }
}
function v2wInstallEvents() {
  if (v2wUI.keyInstalled) return;
  if (typeof window === 'undefined' || !window.addEventListener) return;
  try {
    window.addEventListener('keydown', v2wOnKeydown, true);
    v2wUI.keyInstalled = true;
  } catch (e) { v2wSoft(e); }
}

/* -------------------------------------------------------------------------
   Interacción en el atrio
   ------------------------------------------------------------------------- */
function v2wPromptFor(item) {
  if (!item) return '';
  if (item.kind === 'chest') return item.opened ? 'Revisar cofre' : 'Abrir cofre · +5 XP';
  if (item.kind === 'fragment') return 'Guardar · +5 XP';
  if (item.kind === 'guide') return item.completed ? 'Repasar lección' : 'Escuchar lección · +5 XP';
  if (item.kind === 'telescope') {
    var due = v2wShadowState.total;
    return due > 0 ? due + ' por repasar' : 'Sin repasos vencidos';
  }
  if (item.kind === 'library') {
    var n = v2wCountUnlocked();
    return n + ' de ' + v2wFrags.length + ' fichas';
  }
  if (item.kind === 'shadow') {
    return item.count + ' ' + v2wPlural(item.count, 'error vencido', 'errores vencidos');
  }
  return '';
}
function v2wNearest(x, z) {
  if (!v2wItems.length) return null;
  var px = Number(x) || 0;
  var pz = Number(z) || 0;
  var maxD2 = V2W_INTERACT_RADIUS * V2W_INTERACT_RADIUS;
  var best = null;
  var bestD2 = maxD2;
  var i, d2, dx, dz, item;
  for (i = 0; i < v2wChests.length; i++) {
    item = v2wChests[i];
    dx = px - item.x; dz = pz - item.z; d2 = dx * dx + dz * dz;
    if (d2 <= bestD2) { bestD2 = d2; best = item; }
  }
  for (i = 0; i < v2wGuides.length; i++) {
    item = v2wGuides[i];
    dx = px - item.x; dz = pz - item.z; d2 = dx * dx + dz * dz;
    if (d2 <= bestD2) { bestD2 = d2; best = item; }
  }
  for (i = 0; i < v2wStations.length; i++) {
    item = v2wStations[i];
    dx = px - item.x; dz = pz - item.z; d2 = dx * dx + dz * dz;
    if (d2 <= bestD2) { bestD2 = d2; best = item; }
  }
  for (i = 0; i < v2wFreeFrags.length; i++) {
    item = v2wFreeFrags[i];
    if (item.collected) continue;
    dx = px - item.x; dz = pz - item.z; d2 = dx * dx + dz * dz;
    if (d2 <= bestD2) { bestD2 = d2; best = item; }
  }
  for (i = 0; i < v2wShadows.length; i++) {
    item = v2wShadows[i];
    if (!item.active) continue;
    dx = px - item.x; dz = pz - item.z; d2 = dx * dx + dz * dz;
    if (d2 <= bestD2) { bestD2 = d2; best = item; }
  }
  if (!best) return null;
  return {
    id: best.id,
    kind: best.kind,
    label: best.label,
    prompt: v2wPromptFor(best),
    dist: Math.sqrt(bestD2)
  };
}
function v2wInteract(id) {
  if (!id) return false;
  var item = v2wItemById[id];
  if (!item) {
    var collectedFrag = v2wFragById[id];
    if (collectedFrag) {
      var entry = v2wFragmentState(id);
      if (entry && entry.collectedAt) {
        v2wMarkVisited(id);
        v2wPersist();
        return v2wOpenPanel('library', 'v2w-library', { readerId: id });
      }
    }
    return false;
  }
  if (item.kind === 'shadow') {
    v2wRefreshShadowData();
    if (!item.active) return false;
    v2wMarkVisited(id);
    v2wPersist();
    return v2wOpenPanel('shadow', id);
  }
  if (item.kind === 'chest') {
    v2wMarkVisited(id);
    v2wPersist();
    return v2wOpenPanel('chest', id);
  }
  if (item.kind === 'fragment') {
    v2wMarkVisited(id);
    v2wPersist();
    if (item.collected) return v2wOpenPanel('library', 'v2w-library', { readerId: id });
    return v2wOpenPanel('fragment', id);
  }
  if (item.kind === 'guide') {
    var stateRec = v2wEnsureGuideState(item.areaId);
    if (stateRec && stateRec.completedAt) stateRec.step = 0;
    v2wMarkVisited(id);
    v2wPersist();
    return v2wOpenPanel('guide', id);
  }
  if (item.kind === 'telescope' || item.kind === 'library') {
    v2wNoteStationUse(id);
    v2wMarkVisited(id);
    v2wPersist();
    return v2wOpenPanel(item.kind, id);
  }
  return false;
}

/* =========================================================================
   PARTE D · arranque, bucle, API y registro
   ========================================================================= */
var v2wReady = false;
var v2wLastScreen = '';

function v2wBoot() {
  try {
    v2wBuildCatalog();
    try {
      if (v2wAPI && v2wAPI.ids !== v2wIds) v2wAPI.ids = v2wIds;
    } catch (apiError) {}
    v2wEnsureOverlay();
    v2wInstallEvents();
    if (!v2wBuilt) v2wBuilt = v2wBuild3D();
    v2wReady = true;
    v2wSyncAll();
    v2wRefreshShadowsInternal(true);
    v2wSyncRestoration(true);
    if (v2wReducedMotion()) {
      v2wSyncFragments();
      v2wSyncMarkers();
      v2wApplyGuideMatrices(0);
    }
    v2wEmit('world:boot', {
      built: v2wBuilt,
      chests: v2wChests.length,
      fragments: v2wFrags.length,
      guides: v2wGuides.length,
      stations: v2wStations.length,
      shadows: v2wShadows.length
    });
    return true;
  } catch (e) {
    v2wSoft(e);
    v2wReady = true;
    return false;
  }
}

function v2wUpdate(dt, time) {
  if (!v2wReady) return;
  try {
    var currentScreen = (typeof screen !== 'undefined') ? screen : '';
    if (currentScreen !== v2wLastScreen) {
      v2wLastScreen = currentScreen;
      if (currentScreen === 'hub') {
        v2wSyncAll();
        v2wRefreshShadowsInternal(true);
      }
    }
    var now = Date.now();
    if (!v2wLastRefresh || now - v2wLastRefresh >= V2W_REFRESH_MS) {
      v2wLastRefresh = now;
      v2wSyncAll();
      v2wRefreshShadowsInternal(false);
    }
    if (v2wThreeOk && v2wHubVisible()) {
      if (!v2wReducedMotion()) {
        var t = Number(time) || 0;
        v2wAnimateMarkers(t);
        v2wApplyGuideMatrices(t);
        v2wAnimateFragments(t);
        v2wAnimateShadows(t);
      } else if (now - v2wLastMarkerCull > 150) {
        /* Sin movimiento, el héroe sigue moviéndose: actualiza el culling. */
        v2wLastMarkerCull = now;
        v2wApplyMarkerTransforms(0, false);
      }
    }
  } catch (e) {
    v2wSoft(e);
  }
}

function v2wClose() {
  return v2wClosePanel();
}
function v2wIsOpen() {
  return !!v2wUI.open;
}
function v2wRefreshShadows() {
  var data = v2wRefreshShadowsInternal(true);
  return {
    active: data ? data.active : 0,
    total: data ? data.total : 0,
    byArea: data ? data.byArea : {}
  };
}
function v2wSave() {
  return v2wPersist();
}

function v2wRestorationStats() {
  var levels = {};
  var saved = {};
  var calculated = {};
  var total = 0;
  var maxLevels = 0;
  for (var i = 0; i < v2wGuides.length; i++) {
    var areaId = v2wGuides[i].areaId;
    var level = v2wRestorationLevel(areaId);
    levels[areaId] = level;
    saved[areaId] = v2wSavedRestoration(areaId);
    calculated[areaId] = v2wCalculatedRestoration(areaId);
    total += level;
    maxLevels += 3;
  }
  return {
    levels: levels,
    saved: saved,
    calculated: calculated,
    total: total,
    maxLevels: maxLevels,
    persists: true,
    maxLevel: V2W_RESTORE_MAX
  };
}

function v2wStats() {
  v2wBuildCatalog();
  v2wRefreshShadowData();
  v2wSyncStateFlags();
  var i;
  var chestList = [];
  var openedChests = 0;
  for (i = 0; i < v2wChests.length; i++) {
    var chest = v2wChests[i];
    var chestState = v2wChestState(chest.id);
    var openedAt = chestState && chestState.openedAt ? chestState.openedAt : null;
    if (openedAt) openedChests += 1;
    chestList.push({
      id: chest.id, areaId: chest.areaId, x: v2wRound(chest.x, 3), z: v2wRound(chest.z, 3),
      opened: !!openedAt, openedAt: openedAt,
      fragmentId: chest.fragmentId,
      coins: chestState && typeof chestState.coins === 'number' ? chestState.coins : null
    });
  }
  var fragmentList = [];
  var collectedFragments = 0;
  var freeCollected = 0, chestCollected = 0;
  for (i = 0; i < v2wFrags.length; i++) {
    var frag = v2wFrags[i];
    var fragState = v2wFragmentState(frag.id);
    var collectedAt = fragState && fragState.collectedAt ? fragState.collectedAt : null;
    if (collectedAt) {
      collectedFragments += 1;
      if (frag.slot === 'chest') chestCollected += 1; else freeCollected += 1;
    }
    var fragQ = v2wQuestion(frag.questionId);
    fragmentList.push({
      id: frag.id, areaId: frag.areaId, slot: frag.slot, title: frag.title,
      questionId: frag.questionId, collected: !!collectedAt, collectedAt: collectedAt,
      flashcardId: (fragState && fragState.flashcardId) ? fragState.flashcardId : (fragQ && fragQ.flashcardId ? String(fragQ.flashcardId) : null),
      x: frag.x == null ? null : v2wRound(frag.x, 3),
      z: frag.z == null ? null : v2wRound(frag.z, 3)
    });
  }
  var guideList = [];
  for (i = 0; i < v2wGuides.length; i++) {
    var guide = v2wGuides[i];
    var guideState = v2wGuideState(guide.areaId);
    guideList.push({
      id: guide.id, areaId: guide.areaId, name: guide.name, short: guide.short,
      completed: !!(guideState && guideState.completedAt),
      completedAt: guideState && guideState.completedAt ? guideState.completedAt : null,
      step: guideState ? (Number(guideState.step) || 0) : 0,
      screens: v2wGuideScreens(guide.areaId).length,
      questionId: guide.questionId
    });
  }
  var stationList = [];
  var stationUses = 0;
  for (i = 0; i < v2wStations.length; i++) {
    var station = v2wStations[i];
    var stationState = v2wStationState(station.id);
    var uses = stationState ? (Number(stationState.uses) || 0) : 0;
    stationUses += uses;
    stationList.push({
      id: station.id, kind: station.kind, x: v2wRound(station.x, 3), z: v2wRound(station.z, 3),
      uses: uses, usedAt: stationState && stationState.usedAt ? stationState.usedAt : null
    });
  }
  var shadowList = [];
  for (i = 0; i < v2wShadows.length; i++) {
    shadowList.push({
      id: v2wShadows[i].id, areaId: v2wShadows[i].areaId,
      count: v2wShadows[i].count, active: !!v2wShadows[i].active,
      x: v2wRound(v2wShadows[i].x, 3), z: v2wRound(v2wShadows[i].z, 3)
    });
  }
  var positions = [];
  for (i = 0; i < v2wItems.length; i++) {
    var item = v2wItems[i];
    var active = true;
    if (item.kind === 'fragment') active = !item.collected;
    if (item.kind === 'shadow') active = !!item.active;
    positions.push({
      id: item.id, kind: item.kind, label: item.label, areaId: item.areaId || null,
      x: v2wRound(item.x, 3), z: v2wRound(item.z, 3), active: active
    });
  }
  var awardLog = v2wAwardLog.slice(-20);
  var sessionXp = 0, sessionCoins = 0;
  for (i = 0; i < v2wAwardLog.length; i++) {
    sessionXp += Number(v2wAwardLog[i].xp) || 0;
    sessionCoins += Number(v2wAwardLog[i].coins) || 0;
  }
  var drawables = v2wCountDrawables(v2wWorldRoot);
  var instancedCount = 0;
  try {
    if (v2wWorldRoot && v2wWorldRoot.traverse) {
      v2wWorldRoot.traverse(function (node) { if (node && node.isInstancedMesh) instancedCount += 1; });
    }
  } catch (e) {}
  var restoration = v2wRestorationStats();
  return {
    version: V2W_VERSION,
    built: !!v2wBuilt,
    ready: !!v2wReady,
    three: !!v2wThreeOk,
    quality: v2wQuality(),
    reducedMotion: v2wReducedMotion(),
    open: !!v2wUI.open,
    openMode: v2wUI.mode,
    openId: v2wUI.id,
    readerId: v2wUI.readerId,
    counts: {
      interactives: v2wItems.length,
      catalogEntries: v2wIds && v2wIds.all ? v2wIds.all.length : 0,
      chests: v2wChests.length,
      fragments: v2wFrags.length,
      freeFragments: v2wFreeFrags.length,
      chestFragments: v2wFrags.length - v2wFreeFrags.length,
      guides: v2wGuides.length,
      stations: v2wStations.length,
      shadows: v2wShadowActiveCount(),
      shadowSlots: v2wShadows.length,
      markers: v2wMarkers.length
    },
    chests: {
      total: v2wChests.length,
      opened: openedChests,
      list: chestList
    },
    fragments: {
      total: v2wFrags.length,
      collected: collectedFragments,
      freeTotal: v2wFreeFrags.length,
      freeCollected: freeCollected,
      chestTotal: v2wFrags.length - v2wFreeFrags.length,
      chestCollected: chestCollected,
      list: fragmentList
    },
    guides: {
      total: v2wGuides.length,
      completed: v2wGuideCompletedCount(),
      list: guideList
    },
    stations: {
      total: v2wStations.length,
      uses: stationUses,
      list: stationList
    },
    shadows: {
      active: v2wShadowState.active,
      dueTotal: v2wShadowState.total,
      byArea: v2wShadowState.byArea,
      list: shadowList
    },
    restoration: {
      levels: restoration.levels,
      saved: restoration.saved,
      calculated: restoration.calculated,
      persists: true,
      maxLevel: restoration.maxLevel,
      total: restoration.total,
      maxLevels: restoration.maxLevels,
      visuals: {
        vegetation: v2wRestVegMesh ? v2wRestVegMesh.count : 0,
        runes: v2wRestRuneMesh ? v2wRestRuneMesh.count : 0,
        crystals: v2wRestCrystalMesh ? v2wRestCrystalMesh.count : 0,
        columns: v2wRestColumnMesh ? v2wRestColumnMesh.count : 0,
        halos: v2wRestHaloMesh ? v2wRestHaloMesh.count : 0
      }
    },
    rewards: {
      log: awardLog,
      sessionXp: sessionXp,
      sessionCoins: sessionCoins
    },
    positions: positions,
    markers: {
      total: v2wMarkers.length,
      distanceCulling: true,
      range: V2W_MARKER_RANGE,
      fadeBand: V2W_MARKER_FADE,
      sizes: { chest: 0.21, guide: 0.21, fragment: 0.105, station: 0.18 }
    },
    objects: {
      drawables: drawables,
      instanced: instancedCount,
      markers: v2wMarkers.length,
      shadowSprites: v2wShadowSprites.length,
      particles: 0,
      pointLights: 0
    },
    refreshEveryMs: V2W_REFRESH_MS,
    interactRadius: V2W_INTERACT_RADIUS
  };
}

/* Catálogo listo antes de publicar la API (ids siempre disponible). */
try {
  v2wBuildCatalog();
} catch (catalogError) {
  v2wSoft(catalogError);
}

var v2wAPI = {
  boot: v2wBoot,
  update: v2wUpdate,
  nearest: v2wNearest,
  interact: v2wInteract,
  close: v2wClose,
  isOpen: v2wIsOpen,
  refreshShadows: v2wRefreshShadows,
  save: v2wSave,
  stats: v2wStats,
  ids: v2wIds
};

try {
  if (typeof V2 !== 'undefined' && V2) {
    V2.world = v2wAPI;
    if (typeof V2.register === 'function') V2.register('world', v2wAPI);
  }
} catch (e) {
  v2wSoft(e);
}

