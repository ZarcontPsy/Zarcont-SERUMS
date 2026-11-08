/* =========================================================================
   Agente 6 · V2.1 · harness Node (sin navegador, sin build)
   Valida:
   1. part9-perf: tipo de sombra PCF, culling/recorte del atrio, densidad al
      completar misiones, restauración al salir del atrio, banco original y
      ajustes (HTML + mount + toggle + persistencia).
   2. part6-world: restauración máxima persistida (restored) que nunca baja.
   3. CSS: llaves balanceadas y selectores esperados.
   4. Declaraciones de part9 sin colisión con los demás archivos del build.

   Uso: node harness.js
   ========================================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = path.resolve(__dirname, '..', '..', 'src');
const read = (name) => fs.readFileSync(path.join(SRC, name), 'utf8');

let pass = 0;
let fail = 0;
const failures = [];
function check(label, condition, extra) {
  if (condition) { pass += 1; return true; }
  fail += 1;
  failures.push(label + (extra === undefined ? '' : ' → ' + JSON.stringify(extra)));
  return false;
}
function eq(label, expected, actual) {
  return check(label, actual === expected, { expected, actual });
}
function near(label, actual, min, max) {
  return check(label, typeof actual === 'number' && actual >= min && actual <= max, { actual, min, max });
}
function noThrow(label, fn) {
  try { fn(); pass += 1; return true; } catch (e) {
    fail += 1;
    failures.push(label + ' → lanzó: ' + (e && e.stack || e));
    return false;
  }
}

/* -------------------------------------------------------------------------
   Stubs compartidos
   ------------------------------------------------------------------------- */
function baseCampaign() {
  const areas = [
    'area-psi-salud-publica', 'area-psi-cuidado-integral', 'area-psi-etica',
    'area-psi-investigacion', 'area-psi-gestion'
  ];
  const missions = [];
  areas.forEach((areaId, i) => {
    for (let k = 0; k < 3; k += 1) {
      missions.push({ id: 'm-' + i + '-' + k, areaId: areaId, index: k, kind: k === 2 ? 'boss' : 'mission' });
    }
  });
  const questions = {};
  for (let i = 0; i < 4; i += 1) {
    questions['q-campaign-' + i] = { id: 'q-campaign-' + i, source: 'campaign', areaId: areas[0], options: [{ id: 'A', text: 'a' }], answer: 'A' };
  }
  for (let i = 0; i < 2; i += 1) {
    questions['q-dash-' + i] = { id: 'q-dash-' + i, source: 'dashboard', generated: true, areaId: areas[1], options: [{ id: 'A', text: 'a' }], answer: 'A' };
  }
  for (let i = 0; i < 3; i += 1) {
    questions['q-fc-' + i] = { id: 'q-fc-' + i, source: 'flashcards', generated: true, areaId: areas[2], options: [{ id: 'A', text: 'a' }], answer: 'A' };
  }
  questions['q-legacy'] = { id: 'q-legacy', areaId: areas[3], options: [{ id: 'A', text: 'a' }], answer: 'A' };
  return {
    areas: areas.map((id, i) => ({ id, short: 'Área ' + i, title: 'Área ' + i, accent: '#7AA2FF' })),
    missions,
    questions,
    rules: {},
    characters: [],
    cosmetics: [],
    achievements: []
  };
}
function baseState() {
  return {
    settings: {
      sound: false, volume: 0.7, reducedMotion: false, effectsQuality: 'medio',
      onlyOriginalBank: false, feedbackMode: 'end', sourceWeights: { campaign: 0.6, dashboard: 0.15, flashcards: 0.25 }
    },
    missions: {},
    questions: {},
    v2: { world: { chests: {}, guides: {}, stations: {}, fragments: {}, visited: {}, restored: {} } }
  };
}
function fakeDocument() {
  const factories = [];
  const els = {};
  function FakeEl(selector) {
    this.selector = selector;
    this.textContent = '';
    this.className = '';
    this.attrs = {};
    this.classes = {};
    const self = this;
    this.classList = {
      toggle: function (name, on) {
        if (on === undefined) on = !self.classes[name];
        self.classes[name] = !!on;
      },
      contains: function (name) { return !!self.classes[name]; }
    };
    this.setAttribute = function (key, value) { self.attrs[key] = String(value); };
    this.getAttribute = function (key) { return self.attrs[key]; };
    this.closest = function () { return self; };
    this.querySelector = function (sel) { return els[sel] || null; };
  }
  const root = new FakeEl('[data-v2-perf-settings]');
  els['[data-v2-perf-settings]'] = root;
  const toggleEl = new FakeEl('toggle');
  toggleEl.attrs['data-action'] = 'v2-perf-original-bank';
  els['[data-action="v2-perf-original-bank"]'] = toggleEl;
  ['campaign', 'dashboard', 'flashcards', 'other', 'allowed'].forEach((k) => {
    els['[data-v2-perf-count="' + k + '"]'] = new FakeEl('count-' + k);
  });
  els['[data-v2-perf-active]'] = new FakeEl('active');
  els['[data-v2-perf-shadow]'] = new FakeEl('shadow');
  els['[data-v2-perf-cull]'] = new FakeEl('cull');
  els['[data-v2-perf-draws]'] = new FakeEl('draws');
  const doc = {
    documentElement: {},
    title: '',
    head: { appendChild: function () {} },
    body: { appendChild: function () {}, classList: { toggle: function () {} } },
    createElement: function () { return { width: 0, height: 0, getContext: function () { return null; } }; },
    getElementById: function () { return null; },
    querySelector: function (sel) { return els[sel] || null; },
    querySelectorAll: function () { return []; },
    addEventListener: function (type, fn, capture) { doc._listeners.push({ type, fn, capture }); },
    _listeners: [],
    _els: els
  };
  return doc;
}
function fakeWindow(doc) {
  const timers = [];
  const win = {
    matchMedia: function () { return { matches: false }; },
    devicePixelRatio: 1,
    setTimeout: function (fn) { timers.push(fn); return timers.length; },
    clearTimeout: function () {},
    addEventListener: function () {},
    _timers: timers
  };
  win.window = win;
  win.document = doc;
  return win;
}

/* -------------------------------------------------------------------------
   Raíces falsas del atrio (equivalente a v2aHub.roots de part5-assets)
   ------------------------------------------------------------------------- */
const GATE_ANGLES = [202, 274, 346, 58, 130];
function worldMesh(x, z) {
  return {
    isMesh: true,
    geometry: {
      boundingSphere: { center: { x: 0, y: 0, z: 0 } },
      computeBoundingSphere: function () {},
      getAttribute: function () { return { count: 24 }; }
    },
    matrixWorld: { elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, 0, z, 1] }
  };
}
function makeGroupRoot(name, x, z, extraMeshes, areaId) {
  const meshes = [worldMesh(x, z)];
  for (let i = 1; i < (extraMeshes || 1); i += 1) meshes.push(worldMesh(x, z));
  const root = {
    name: name,
    visible: true,
    userData: { v2aDecorative: true },
    position: { x: x, y: 0, z: z },
    children: meshes,
    updateMatrixWorld: function () {},
    traverse: function (fn) { fn(root); meshes.forEach(fn); }
  };
  if (areaId) root.userData.areaId = areaId;
  return root;
}
function makeVegRoot(name, x, z, count) {
  const arr = new Float32Array(16 * count);
  for (let i = 0; i < count; i += 1) {
    arr[i * 16 + 12] = x;
    arr[i * 16 + 14] = z;
  }
  return {
    name: name,
    isInstancedMesh: true,
    visible: true,
    count: count,
    userData: { v2aDecorative: true },
    instanceMatrix: { array: arr },
    geometry: {
      boundingSphere: { center: { x: 0, y: 0, z: 0 } },
      computeBoundingSphere: function () {},
      getAttribute: function () { return { count: 24 }; }
    },
    updateMatrixWorld: function () {},
    traverse: function (fn) { fn(this); }
  };
}
function makeDustRoot(count) {
  const geo = {
    drawRange: { start: 0, count: Infinity },
    setDrawRange: function (start, n) { this.drawRange = { start: start, count: n }; },
    getAttribute: function () { return { count: count }; }
  };
  return {
    name: 'v2-hub-dust',
    isPoints: true,
    visible: true,
    userData: { v2aDecorative: true },
    geometry: geo,
    traverse: function (fn) { fn(this); }
  };
}
function buildHubRoots() {
  const roots = [];
  const AREA_IDS = ['area-psi-salud-publica', 'area-psi-cuidado-integral', 'area-psi-etica', 'area-psi-investigacion', 'area-psi-gestion'];
  for (let i = 0; i < GATE_ANGLES.length; i += 1) {
    const a = GATE_ANGLES[i] * Math.PI / 180;
    roots.push(makeGroupRoot('v2-hub-props-' + AREA_IDS[i], Math.cos(a) * 7.6, Math.sin(a) * 7.6, 2, AREA_IDS[i]));
    roots.push(makeVegRoot('v2-hub-veg-' + AREA_IDS[i], Math.cos(a) * 7.6, Math.sin(a) * 7.6, 12));
    roots.push(makeGroupRoot('v2-minion-' + AREA_IDS[i], Math.cos(a + 0.34) * 5.85, Math.sin(a + 0.34) * 5.85, 2, AREA_IDS[i]));
  }
  roots.push(makeDustRoot(45));
  return roots;
}

/* -------------------------------------------------------------------------
   Contexto part9-perf
   ------------------------------------------------------------------------- */
function buildPerfContext(options) {
  const opts = options || {};
  const doc = fakeDocument();
  const win = fakeWindow(doc);
  const camp = baseCampaign();
  const st = baseState();
  if (opts.onlyOriginal) st.settings.onlyOriginalBank = true;
  if (opts.quality) st.settings.effectsQuality = opts.quality;
  const roots = buildHubRoots();
  const sandbox = {
    console,
    window: win,
    document: doc,
    navigator: { maxTouchPoints: 0 },
    performance: { now: function () { return Date.now(); } },
    state: st,
    CAMP: camp,
    QUESTION_BY_ID: camp.questions,
    AREA_BY_ID: camp.areas.reduce((acc, a) => { acc[a.id] = a; return acc; }, {}),
    areaMissions: function (areaId) { return camp.missions.filter((m) => m.areaId === areaId); },
    areaProgress: function (areaId) {
      const list = camp.missions.filter((m) => m.areaId === areaId);
      const done = list.filter((m) => st.missions[m.id] && st.missions[m.id].completedAt).length;
      return { done, total: list.length, pct: list.length ? done / list.length : 0 };
    },
    missionCompleted: function (id) { return !!(st.missions[id] && st.missions[id].completedAt); },
    persist: function () { sandbox._persistCalls = (sandbox._persistCalls || 0) + 1; },
    saveSettings: function () { sandbox._saveSettingsCalls = (sandbox._saveSettingsCalls || 0) + 1; },
    esc: function (value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },
    icon: function () { return '<svg></svg>'; },
    toast: function (message) { sandbox._toasts = sandbox._toasts || []; sandbox._toasts.push(message); return true; },
    syncHUD: function () {},
    screen: opts.screen === undefined ? 'hub' : opts.screen,
    hubGroup: { visible: opts.hubVisible === undefined ? true : opts.hubVisible, children: [] },
    hubHero: opts.hero || { x: 0, z: 3.3, facing: 0 },
    hubCircle: null,
    v2aHub: { roots: roots, built: true, quality: 'medio', minions: [], dust: null, props: 0, veg: 0 },
    THREE: { PCFShadowMap: 1, PCFSoftShadowMap: 2, BasicShadowMap: 0, VSMShadowMap: 3 },
    renderer: {
      shadowMap: { enabled: true, type: 2 },
      domElement: {}
    },
    portraitRenderer: null,
    moonLight: null,
    _persistCalls: 0,
    _saveSettingsCalls: 0
  };
  sandbox.globalThis = sandbox;
  const context = vm.createContext(sandbox);
  vm.runInContext(read('part0-v2-core.js'), context, { filename: 'part0-v2-core.js' });
  const V2 = sandbox.V2;
  check('part9 · V2 core cargado', !!V2);
  /* API world mínima, como la publica part6-world. */
  sandbox._worldUpdates = 0;
  V2.world = {
    update: function (dt, time) { sandbox._worldUpdates += 1; sandbox._lastWorldTime = time; },
    boot: function () { sandbox._worldBoots = (sandbox._worldBoots || 0) + 1; }
  };
  V2.modules = V2.modules || {};
  V2.modules.world = true;
  if (opts.noThree) { sandbox.THREE = undefined; sandbox.renderer = null; }
  noThrow('part9 · carga sin excepciones', function () {
    vm.runInContext(read('part9-perf.js'), context, { filename: 'part9-perf.js' });
  });
  return { sandbox, context, V2, roots, camp, st };
}

/* -------------------------------------------------------------------------
   Contexto part6-world (sin THREE: la restauración no lo necesita)
   ------------------------------------------------------------------------- */
function buildWorldContext() {
  const camp = baseCampaign();
  const st = baseState();
  const doc = fakeDocument();
  const win = fakeWindow(doc);
  win.__SERUMS_V2__ = null;
  const roots = buildHubRoots();
  const sandbox = {
    console,
    window: win,
    document: doc,
    performance: { now: function () { return Date.now(); } },
    state: st,
    CAMP: camp,
    QUESTION_BY_ID: camp.questions,
    AREA_BY_ID: camp.areas.reduce((acc, a) => { acc[a.id] = a; return acc; }, {}),
    areaMissions: function (areaId) { return camp.missions.filter((m) => m.areaId === areaId); },
    areaProgress: function (areaId) {
      const list = camp.missions.filter((m) => m.areaId === areaId);
      const done = list.filter((m) => st.missions[m.id] && st.missions[m.id].completedAt).length;
      return { done, total: list.length, pct: list.length ? done / list.length : 0 };
    },
    missionCompleted: function (id) { return !!(st.missions[id] && st.missions[id].completedAt); },
    persist: function () { sandbox._persistCalls = (sandbox._persistCalls || 0) + 1; },
    saveSettings: function () {},
    syncHUD: function () {},
    screen: 'hub',
    nowISO: function () { return '2026-11-06T12:00:00.000Z'; },
    shortDate: function (iso) { return String(iso || '').slice(0, 10); },
    plural: function (n, one, many) { return n === 1 ? one : many; },
    esc: function (value) { return String(value == null ? '' : value); },
    icon: function () { return ''; },
    toast: function () {},
    screen: 'hub',
    hubGroup: { visible: true, children: [] },
    hubHero: { x: 0, z: 3.3 },
    THREE: { PCFShadowMap: 1, PCFSoftShadowMap: 2, BasicShadowMap: 0, VSMShadowMap: 3 },
    renderer: { shadowMap: { enabled: true, type: 2 }, domElement: {} },
    portraitRenderer: null,
    moonLight: null,
    v2aHub: { roots: roots, built: true, quality: 'medio', minions: [], dust: null, props: 0, veg: 0 },
    _persistCalls: 0
  };
  sandbox.globalThis = sandbox;
  const context = vm.createContext(sandbox);
  vm.runInContext(read('part0-v2-core.js'), context, { filename: 'part0-v2-core.js' });
  sandbox.V2 = sandbox.V2 || sandbox.window.__SERUMS_V2__;
  noThrow('part6 · carga sin excepciones', function () {
    vm.runInContext(read('part6-world.js'), context, { filename: 'part6-world.js' });
  });
  noThrow('part6+part9 · carga combinada sin excepciones', function () {
    vm.runInContext(read('part9-perf.js'), context, { filename: 'part9-perf.js' });
  });
  return { sandbox, context, state: st, camp, roots };
}

/* =========================================================================
   1 · SOMBRAS
   ========================================================================= */
function testShadow() {
  const perf = buildPerfContext({});
  const { sandbox, V2 } = perf;
  eq('sombras · tipo de partida leído por el módulo', 2, sandbox.v2pShadowState.loadedType);
  eq('sombras · renderer.shadowMap.type corregido a PCFShadowMap al cargar', 1, sandbox.renderer.shadowMap.type);
  let stats = V2.perf.stats();
  eq('sombras · stats.shadow.type', 1, stats.shadow.type);
  eq('sombras · stats.shadow.warningFree', true, stats.shadow.warningFree);
  eq('sombras · stats.shadow.legacyType', false, stats.shadow.legacyType);
  check('sombras · stats.shadow.fixes ≥ 1', stats.shadow.fixes >= 1, stats.shadow.fixes);
  /* Un tercero vuelve a poner PCFSoft: el guardia debe corregirlo en el frame. */
  sandbox.renderer.shadowMap.type = 2;
  sandbox.v2pCull.lastTick = 0;
  sandbox.v2pCull.lastTime = -1;
  V2.world.update(0.016, 101);
  eq('sombras · el guardia corrige un tipo reintroducido', 1, sandbox.renderer.shadowMap.type);
  /* Sin renderer/THREE no debe romper. */
  const bare = buildPerfContext({ noThree: true });
  eq('sombras · sin THREE/renderer stats.shadow.available', false, bare.V2.perf.stats().shadow.available);
  check('sombras · sin THREE/renderer no lanza', typeof bare.V2.perf.stats().shadow.name === 'string');
}

/* =========================================================================
   2 · CULLING / DENSIDAD DEL ATRIO
   ========================================================================= */
function testCulling() {
  const perf = buildPerfContext({});
  const { sandbox, V2, roots } = perf;
  const props = roots.filter((r) => r.name.indexOf('v2-hub-props-') === 0);
  const vegs = roots.filter((r) => r.name.indexOf('v2-hub-veg-') === 0);
  const minions = roots.filter((r) => r.name.indexOf('v2-minion-') === 0);
  const dust = roots.filter((r) => r.name === 'v2-hub-dust')[0];

  sandbox.v2pProgressCache.ready = false;
  sandbox.v2pTick(Date.now());
  let s = V2.perf.stats().culling;
  eq('culling · detecta 5 props, 5 veg, 5 esbirros y polvo', 16, s.targets);
  eq('culling · dibujos totales calculados', 26, s.drawCallsTotal);
  check('culling · oculta props lejanos (medio)', props.filter((r) => !r.visible).length >= 3, props.map((r) => r.visible));
  check('culling · conserva props cercanos', props.filter((r) => r.visible).length >= 2, props.map((r) => r.visible));
  near('culling · dibujos visibles', s.drawCallsVisible, 11, 15);
  near('culling · dibujos ahorrados', s.drawCallsSaved, 10, 15);
  check('culling · porcentaje ahorrado 30-60 %', s.savedPercent >= 30 && s.savedPercent <= 60, s.savedPercent);
  check('culling · vegetación instanciada recortada', vegs.every((v) => v.count === 9), vegs.map((v) => v.count));
  near('culling · instancias de vegetación dibujadas', s.vegetation.drawn, 27, 45);
  near('culling · polvo instanciado recortado (32/45)', dust.geometry.drawRange.count, 30, 34);
  check('culling · esbirros cercanos visibles', minions.filter((m) => m.visible).length === 2, minions.map((m) => m.visible));
  eq('culling · vértices totales calculados', 1965, s.vertices.total);
  check('culling · ahorro de vértices ≥ 35 %', s.vertices.savedPercent >= 35, s.vertices);
  /* Los interactivos (v2wWorldRoot) no están en v2aHub.roots: no se tocan. */
  const interactive = makeGroupRoot('v2w-interactive-chest', 6, 6, 2);
  sandbox.hubGroup.children.push(interactive);
  sandbox.v2pTick(Date.now());
  eq('culling · objeto interactivo fuera de v2aHub.roots intacto', true, interactive.visible);
  /* Histéresis + cercanía: el héroe va a la puerta 274 y sus props reaparecen. */
  sandbox.hubHero.x = Math.cos(274 * Math.PI / 180) * 6.4;
  sandbox.hubHero.z = Math.sin(274 * Math.PI / 180) * 6.4;
  sandbox.v2pTick(Date.now());
  eq('culling · props de la puerta visitada visibles', true, props[1].visible);
  eq('culling · esbirro de la puerta visitada visible', true, minions[1].visible);

  /* Densidad con todas las misiones completadas. */
  perf.camp.missions.forEach((m) => { perf.st.missions[m.id] = { completedAt: '2026-01-01T00:00:00.000Z' }; });
  sandbox.v2pProgress(true);
  sandbox.v2pTick(Date.now());
  s = V2.perf.stats().culling;
  eq('densidad · todas las misiones completadas detectadas', true, s.allMissionsComplete);
  eq('densidad · 5 áreas completadas', 5, s.completedAreas.length);
  eq('densidad · esbirros ocultos con el atrio restaurado', 0, minions.filter((m) => m.visible).length);
  check('densidad · vegetación más escasa', vegs.every((v) => v.count <= 4), vegs.map((v) => v.count));
  check('densidad · polvo reducido', dust.geometry.drawRange.count <= 18, dust.geometry.drawRange.count);
  check('densidad · más dibujos ahorrados que antes', s.drawCallsSaved >= 15, s.drawCallsSaved);
  check('densidad · ahorro ≥ 55 %', s.savedPercent >= 55, s.savedPercent);
  check('densidad · ahorro de vértices ≥ 70 %', s.vertices.savedPercent >= 70, s.vertices);

  /* Salir del atrio restaura todo (sin dejar props ocultos al volver). */
  sandbox.screen = 'duel';
  sandbox.hubGroup.visible = false;
  sandbox.v2pTick(Date.now());
  eq('restauración · todos los props visibles al salir del atrio', true, props.every((r) => r.visible));
  eq('restauración · vegetación a su cuenta original', true, vegs.every((v) => v.count === 12));
  eq('restauración · polvo a su cuenta original', 45, dust.geometry.drawRange.count);
  s = V2.perf.stats().culling;
  eq('restauración · hubVisible false', false, s.hubVisible);
  eq('restauración · sin dibujos ahorrados en pausa', 0, s.drawCallsSaved);

  /* Volver al atrio vuelve a aplicar el recorte. */
  sandbox.screen = 'hub';
  sandbox.hubGroup.visible = true;
  sandbox.hubHero.x = 0;
  sandbox.hubHero.z = 3.3;
  sandbox.v2pTick(Date.now());
  s = V2.perf.stats().culling;
  check('vuelta al atrio · recorte reaplicado', s.drawCallsSaved > 0, s.drawCallsSaved);

  /* El enganche al bucle llama al update original y ejecuta el tick. */
  sandbox.v2pCull.lastTick = 0;
  sandbox.v2pCull.lastTime = -1;
  const before = sandbox._worldUpdates;
  sandbox.V2.world.update(0.016, 202);
  eq('hooks · update original ejecutado', before + 1, sandbox._worldUpdates);
  check('hooks · tick ejecutado desde V2.world.update', V2.perf.stats().culling.lastTick > 0);
  /* Doble enganche con el mismo timestamp no duplica el tick. */
  const tickBefore = sandbox.v2pCull.lastTick;
  sandbox.V2.world.update(0.016, 202);
  eq('hooks · mismo frame no duplica trabajo', tickBefore, sandbox.v2pCull.lastTick);
  /* Ruta oficial de part4-flow: V2.call('world','update') + V2.call('perf','update'). */
  sandbox.v2pCull.lastTick = 0;
  sandbox.v2pCull.lastTime = -1;
  sandbox.V2.world.update(0.016, 404);
  const tickOne = sandbox.v2pCull.lastTick;
  sandbox.V2.perf.update(0.016, 404);
  eq('hooks · perf.update del mismo frame no repite el tick', tickOne, sandbox.v2pCull.lastTick);
  eq('hooks · perf.boot responde (part4-flow)', true, sandbox.V2.perf.boot());
  eq('hooks · perf.boot reafirma PCFShadowMap', 1, sandbox.renderer.shadowMap.type);

  /* Calidades: sin misiones completadas para comparar solo el efecto calidad. */
  Object.keys(perf.st.missions).forEach((id) => { delete perf.st.missions[id]; });
  sandbox.v2pProgress(true);
  perf.st.settings.effectsQuality = 'bajo';
  sandbox.v2pCull.lastTick = 0;
  sandbox.v2pTick(Date.now());
  const low = V2.perf.stats().culling;
  perf.st.settings.effectsQuality = 'alto';
  sandbox.v2pCull.lastTick = 0;
  sandbox.v2pTick(Date.now());
  const high = V2.perf.stats().culling;
  check('calidad · baja oculta más que alta', low.drawCallsSaved > high.drawCallsSaved, { low: low.drawCallsSaved, high: high.drawCallsSaved });
  eq('calidad · alto sin esbirro oculto por calidad', 5, minions.filter((m) => m.visible).length);
  eq('calidad · alto conserva toda la vegetación', true, vegs.every((v) => v.count === 12));

  /* Reconstrucción de part5 (nuevas raíces) no deja estado viejo. */
  const fresh = buildHubRoots();
  sandbox.v2aHub.roots = fresh;
  sandbox.v2pTick(Date.now());
  s = V2.perf.stats().culling;
  eq('rebuild · targets refrescados', 16, s.targets);
  check('rebuild · dibujos totales recalculados', s.drawCallsTotal === 26, s.drawCallsTotal);
}

/* =========================================================================
   3 · BANCO ORIGINAL
   ========================================================================= */
function testBank() {
  const perf = buildPerfContext({});
  const { sandbox, V2, camp } = perf;
  const mixed = Object.keys(camp.questions).map((id) => camp.questions[id]);
  eq('banco · sin filtro, todo permitido', true, mixed.every((q) => V2.perf.questionAllowed(q)));
  eq('banco · filterQuestions sin filtro conserva 10', 10, V2.perf.filterQuestions(mixed).length);
  eq('banco · null no permitido', false, V2.perf.questionAllowed(null));
  eq('banco · filterQuestions(null) = []', 0, V2.perf.filterQuestions(null).length);
  let bank = V2.perf.stats().bank;
  eq('banco · campaña', 4, bank.campaign);
  eq('banco · dashboard', 2, bank.dashboard);
  eq('banco · flashcards', 3, bank.flashcards);
  eq('banco · otras', 1, bank.other);
  eq('banco · total', 10, bank.total);
  eq('banco · activas sin filtro', 10, bank.allowed);
  eq('banco · sin filtro onlyOriginalBank', false, bank.onlyOriginalBank);

  /* Toggle directo por API. */
  V2.perf.setOnlyOriginalBank(true);
  eq('banco · toggle por API persiste onlyOriginalBank', true, perf.st.settings.onlyOriginalBank);
  check('banco · toggle guarda (saveSettings)', sandbox._saveSettingsCalls >= 1, sandbox._saveSettingsCalls);
  check('banco · toggle guarda (persist)', sandbox._persistCalls >= 1, sandbox._persistCalls);
  bank = V2.perf.stats().bank;
  eq('banco · activas con filtro = campaña', 4, bank.allowed);
  eq('banco · descartadas con filtro', 6, bank.filtered);
  eq('banco · solo campaign permitido', true, V2.perf.questionAllowed(camp.questions['q-campaign-0']));
  eq('banco · dashboard excluido', false, V2.perf.questionAllowed(camp.questions['q-dash-0']));
  eq('banco · flashcards excluidas', false, V2.perf.questionAllowed(camp.questions['q-fc-0']));
  eq('banco · sin source excluida', false, V2.perf.questionAllowed(camp.questions['q-legacy']));
  const filtered = V2.perf.filterQuestions(mixed);
  eq('banco · filterQuestions con filtro = 4', 4, filtered.length);
  eq('banco · filterQuestions no muta la lista', 10, mixed.length);

  /* Ajustes: HTML. */
  const html = V2.perf.settingsHTML();
  check('ajustes · HTML no vacío', html.length > 200, html.length);
  check('ajustes · contiene toggle de banco original', html.indexOf('data-action="v2-perf-original-bank"') !== -1);
  check('ajustes · texto exacto del toggle', html.indexOf('Usar solo preguntas del banco original') !== -1);
  check('ajustes · toggle encendido con el filtro', html.indexOf('class="toggle is-on"') !== -1);
  check('ajustes · aria-pressed true', html.indexOf('aria-pressed="true"') !== -1);
  check('ajustes · contadores del banco', html.indexOf('data-v2-perf-count="campaign"') !== -1 &&
    html.indexOf('data-v2-perf-count="dashboard"') !== -1 && html.indexOf('data-v2-perf-count="flashcards"') !== -1);
  check('ajustes · botón de revisión de banco', html.indexOf('data-action="v2-perf-bank-audit"') !== -1);
  check('ajustes · estado de sombras', html.indexOf('data-v2-perf-shadow') !== -1);
  check('ajustes · estado del atrio', html.indexOf('data-v2-perf-cull') !== -1);

  /* mountSettings: sincroniza e instala eventos una sola vez. */
  eq('ajustes · mountSettings devuelve true', true, V2.perf.mountSettings());
  eq('ajustes · mountSettings idempotente', true, V2.perf.mountSettings());
  const listeners = sandbox.document._listeners.filter((l) => l.type === 'click' && l.capture === true);
  eq('ajustes · un solo listener de click en captura', 1, listeners.length);
  const root = sandbox.document._els['[data-v2-perf-settings]'];
  const toggle = sandbox.document._els['[data-action="v2-perf-original-bank"]'];
  eq('ajustes · toggle sincronizado is-on', true, toggle.classes['is-on']);
  eq('ajustes · contador activo sincronizado', '4', sandbox.document._els['[data-v2-perf-count="allowed"]'].textContent);
  eq('ajustes · contador campaña sincronizado', '4', sandbox.document._els['[data-v2-perf-count="campaign"]'].textContent);

  /* Click real en el toggle (captura, apaga el filtro). */
  const clickEvent = {
    target: toggle, preventDefault: function () { this.defaultPrevented = true; },
    stopPropagation: function () { this.propagationStopped = true; }
  };
  sandbox.v2pOnSettingsClick(clickEvent);
  eq('ajustes · click apaga onlyOriginalBank', false, perf.st.settings.onlyOriginalBank);
  eq('ajustes · click previene el evento', true, !!clickEvent.defaultPrevented);
  eq('ajustes · click detiene la propagación', true, !!clickEvent.propagationStopped);
  eq('ajustes · toggle pintado apagado', false, !!toggle.classes['is-on']);
  eq('ajustes · contador activo tras apagar', '10', sandbox.document._els['[data-v2-perf-count="allowed"]'].textContent);
  sandbox.v2pOnSettingsClick(clickEvent);
  eq('ajustes · segundo click enciende', true, perf.st.settings.onlyOriginalBank);

  /* Botón de auditoría: toast con la composición. */
  const auditEl = { getAttribute: function () { return 'v2-perf-bank-audit'; } };
  sandbox.v2pOnSettingsClick({ target: { closest: function () { return auditEl; } }, preventDefault: function () {}, stopPropagation: function () {} });
  check('ajustes · auditoría avisa con el conteo', (sandbox._toasts || []).some((m) => m.indexOf('Banco: 10 preguntas') === 0), sandbox._toasts);

  /* stats() completo. */
  const stats = V2.perf.stats();
  check('stats · versión', typeof stats.version === 'string' && stats.version.length > 0, stats.version);
  check('stats · culling y banco presentes', !!stats.culling && !!stats.bank && !!stats.shadow, Object.keys(stats));
  eq('stats · settings.onlyOriginalBank', true, stats.settings.onlyOriginalBank);
  check('stats · sin errores internos', (stats.errors || []).length === 0, stats.errors);
  const api = ['settingsHTML', 'mountSettings', 'questionAllowed', 'filterQuestions', 'update', 'stats'];
  check('API · métodos del contrato', api.every((m) => typeof V2.perf[m] === 'function'), api);
}

/* =========================================================================
   3b · Carga defensiva sin estado, DOM ni THREE
   ========================================================================= */
function testBareLoad() {
  const sandbox = {
    console,
    window: { matchMedia: function () { return { matches: false }; }, setTimeout: function () { return 0; }, addEventListener: function () {} },
    performance: { now: function () { return Date.now(); } }
  };
  sandbox.globalThis = sandbox;
  const context = vm.createContext(sandbox);
  vm.runInContext(read('part0-v2-core.js'), context, { filename: 'part0-v2-core.js' });
  sandbox.V2.world = { update: function () {} };
  noThrow('bare · part9 carga sin state/CAMP/document/THREE', function () {
    vm.runInContext(read('part9-perf.js'), context, { filename: 'part9-perf.js' });
  });
  check('bare · API publicada', !!sandbox.V2.perf && typeof sandbox.V2.perf.settingsHTML === 'function');
  eq('bare · filtro por defecto permite', true, sandbox.V2.perf.questionAllowed({ source: 'dashboard' }));
  eq('bare · filterQuestions(null)', 0, sandbox.V2.perf.filterQuestions(null).length);
  eq('bare · stats no lanza', 'string', typeof sandbox.V2.perf.stats().version);
  eq('bare · banco vacío', 0, sandbox.V2.perf.stats().bank.total);
  eq('bare · sin sombras', false, sandbox.V2.perf.stats().shadow.available);
  const html = sandbox.V2.perf.settingsHTML();
  check('bare · settingsHTML devuelve sección', html.indexOf('<section') === 0, html.slice(0, 40));
  eq('bare · HTML equilibrado (section)', (html.match(/<section/g) || []).length, (html.match(/<\/section>/g) || []).length);
  eq('bare · HTML equilibrado (div)', (html.match(/<div/g) || []).length, (html.match(/<\/div>/g) || []).length);
  eq('bare · mountSettings sin DOM devuelve true', true, sandbox.V2.perf.mountSettings());
  eq('bare · update sin targets no lanza', undefined, sandbox.V2.perf.update(0.016, 1.5));
}

/* =========================================================================
   4 · RESTAURACIÓN MÁXIMA (part6-world)
   ========================================================================= */
function testRestoration() {
  const ctx = buildWorldContext();
  const { sandbox, state } = ctx;
  const V2 = sandbox.V2;
  check('restauración · V2.world publicado', !!V2 && !!V2.world, !!V2);
  const areaA = 'area-psi-salud-publica';
  const areaB = 'area-psi-cuidado-integral';

  eq('restauración · nivel calculado inicial 0', 0, sandbox.v2wCalculatedRestoration(areaA));
  eq('restauración · nivel efectivo inicial 0', 0, sandbox.v2wRestorationLevel(areaA));
  eq('restauración · restored vacío al inicio', 0, Object.keys(state.v2.world.restored).length);
  const persistBefore = sandbox._persistCalls;

  /* Completar una misión: nivel 1 y persistencia. */
  const missionsA = sandbox.v2wAreaMissions(areaA);
  check('restauración · 3 misiones en el área A', missionsA.length === 3, missionsA.length);
  state.missions[missionsA[0].id] = { completedAt: '2026-01-01T00:00:00.000Z' };
  eq('restauración · calculado 1 con una misión', 1, sandbox.v2wCalculatedRestoration(areaA));
  eq('restauración · efectivo 1', 1, sandbox.v2wRestorationLevel(areaA));
  eq('restauración · guardado 1', 1, state.v2.world.restored[areaA]);
  check('restauración · persistió al subir', sandbox._persistCalls > persistBefore, sandbox._persistCalls);
  const afterFirst = sandbox._persistCalls;

  /* Repetir no vuelve a guardar (solo al subir). */
  sandbox.v2wRestorationLevel(areaA);
  sandbox.v2wRestorationLevel(areaA);
  eq('restauración · sin persistencia si no sube', afterFirst, sandbox._persistCalls);

  /* Subir a 2 y a 3. */
  state.missions[missionsA[1].id] = { completedAt: '2026-01-02T00:00:00.000Z' };
  eq('restauración · calculado 2 con dos misiones', 2, sandbox.v2wCalculatedRestoration(areaA));
  eq('restauración · efectivo 2', 2, sandbox.v2wRestorationLevel(areaA));
  eq('restauración · guardado 2', 2, state.v2.world.restored[areaA]);
  state.missions[missionsA[2].id] = { completedAt: '2026-01-03T00:00:00.000Z' };
  eq('restauración · efectivo 3 con todo el área', 3, sandbox.v2wRestorationLevel(areaA));
  eq('restauración · guardado 3', 3, state.v2.world.restored[areaA]);

  /* Recalcular a la baja no retrocede. */
  delete state.missions[missionsA[0].id];
  delete state.missions[missionsA[1].id];
  delete state.missions[missionsA[2].id];
  eq('restauración · calculado vuelve a 0', 0, sandbox.v2wCalculatedRestoration(areaA));
  eq('restauración · efectivo se queda en 3 (no retrocede)', 3, sandbox.v2wRestorationLevel(areaA));
  eq('restauración · guardado sigue en 3', 3, state.v2.world.restored[areaA]);

  /* Valor guardado por encima del calculado (importación/versión previa). */
  state.v2.world.restored[areaB] = 2;
  eq('restauración · guardado 2 manda sobre calculado 0', 2, sandbox.v2wRestorationLevel(areaB));

  /* Firma de v2wSyncRestoration: área real (nunca "undefined:") y cambia con el
     nivel, que es lo que refresca la restauración visual. */
  const sigBefore = sandbox.v2wRestorationSignature();
  check('firma · no contiene "undefined:"', sigBefore.indexOf('undefined') === -1, sigBefore);
  check('firma · usa el areaId real con su nivel', sigBefore.indexOf('area-psi-salud-publica:3') !== -1, sigBefore);
  eq('firma · un tramo por cada guía/puerta', 5, sigBefore.split('|').length);
  state.v2.world.restored[areaB] = 3;
  const sigAfter = sandbox.v2wRestorationSignature();
  check('firma · cambia al subir un nivel guardado', sigBefore !== sigAfter, { sigBefore, sigAfter });
  check('firma · refleja el nuevo nivel', sigAfter.indexOf('area-psi-cuidado-integral:3') !== -1, sigAfter);

  /* v2wSaveRestoration persiste solo cuando sube (vía v2wPersist → persist). */
  state.v2.world.restored[areaB] = 0;
  const persistBeforeSave = sandbox._persistCalls;
  eq('guardado máximo · v2wSaveRestoration sube a 2 y devuelve 2', 2, sandbox.v2wSaveRestoration(areaB, 2));
  eq('guardado máximo · estado guardado en restored', 2, state.v2.world.restored[areaB]);
  eq('guardado máximo · persist() llamado al subir', persistBeforeSave + 1, sandbox._persistCalls);
  eq('guardado máximo · repetir no vuelve a subir', 2, sandbox.v2wSaveRestoration(areaB, 2));
  eq('guardado máximo · repetir no persiste', persistBeforeSave + 1, sandbox._persistCalls);
  eq('guardado máximo · bajar se ignora', 2, sandbox.v2wSaveRestoration(areaB, 1));
  eq('guardado máximo · bajar no modifica restored', 2, state.v2.world.restored[areaB]);
  eq('guardado máximo · bajar no persiste', persistBeforeSave + 1, sandbox._persistCalls);
  eq('guardado máximo · tope de nivel 3', 3, sandbox.v2wSaveRestoration(areaB, 9));
  eq('guardado máximo · valor final', 3, state.v2.world.restored[areaB]);

  /* Saneamiento de valores inválidos. */
  state.v2.world.restored[areaB] = 99;
  eq('restauración · 99 se acota a 3', 3, sandbox.v2wSavedRestoration(areaB));
  state.v2.world.restored[areaB] = -5;
  eq('restauración · negativo se acota a 0', 0, sandbox.v2wSavedRestoration(areaB));
  state.v2.world.restored[areaB] = '2.9';
  eq('restauración · texto numérico se trunca a 2', 2, sandbox.v2wSavedRestoration(areaB));
  state.v2.world.restored[areaB] = 'nope';
  eq('restauración · texto inválido vale 0', 0, sandbox.v2wSavedRestoration(areaB));
  state.v2.world.restored = [];
  eq('restauración · restored array se reemplaza', 0, sandbox.v2wSavedRestoration(areaB));
  eq('restauración · restored queda como objeto', '[object Object]', Object.prototype.toString.call(state.v2.world.restored));

  /* Estado consistente en stats(). */
  state.v2.world.restored[areaA] = 3;
  const stats = V2.world.stats();
  check('restauración · stats incluye saved/calculated', !!stats.restoration && !!stats.restoration.saved && !!stats.restoration.calculated, stats.restoration);
  eq('restauración · stats.saved área A', 3, stats.restoration.saved[areaA]);
  eq('restauración · stats.levels área A', 3, stats.restoration.levels[areaA]);
  eq('restauración · stats persiste', true, stats.restoration.persists);
  eq('restauración · stats maxLevel', 3, stats.restoration.maxLevel);
  eq('restauración · recompensas intactas (sin claves nuevas)', undefined, stats.rewards.rewardTable);

  /* Guardado aditivo: las claves previas de state.v2.world siguen. */
  check('restauración · state.v2.world conserva chests/guides/stations/fragments/visited', ['chests', 'guides', 'stations', 'fragments', 'visited', 'restored'].every((k) => state.v2.world[k] && typeof state.v2.world[k] === 'object'), Object.keys(state.v2.world));

  /* Integración real del build: part0 → part6 → part9 en el mismo contexto. */
  eq('integración · V2.perf publicado tras part6+part9', true, !!V2.perf && typeof V2.perf.stats === 'function');
  eq('integración · part9 fija PCFShadowMap', 1, sandbox.renderer.shadowMap.type);
  sandbox.v2pCull.lastTick = 0;
  sandbox.v2pCull.lastTime = -1;
  V2.world.update(0.016, 900);
  eq('integración · culling enganchado a V2.world.update', 16, V2.perf.stats().culling.targets);
  check('integración · tick ejecutado desde el update real', V2.perf.stats().culling.lastTick > 0);
  eq('integración · restauración máxima intacta tras part9', 3, V2.world.stats().restoration.levels[areaA]);
  eq('integración · stats.restoration.saved intacto', 3, V2.world.stats().restoration.saved[areaA]);
}

/* =========================================================================
   5 · CSS
   ========================================================================= */
function testCss() {
  const css = read('part9-perf.css');
  const stripped = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''");
  let open = 0;
  let close = 0;
  for (let i = 0; i < stripped.length; i += 1) {
    if (stripped[i] === '{') open += 1;
    if (stripped[i] === '}') close += 1;
  }
  eq('CSS · llaves balanceadas', open, close);
  check('CSS · usa prefijo .v2-perf-', css.indexOf('.v2-perf-settings') !== -1 && css.indexOf('.v2-perf-grid') !== -1);
  check('CSS · estilos de chip del banco', css.indexOf('.v2-perf-chip') !== -1);
  check('CSS · media query móvil', css.indexOf('@media') !== -1);
  check('CSS · movimiento reducido', css.indexOf('.reduced-motion') !== -1);
  const build = read('../build-game.js');
  check('CSS · incluida por build-game.js', build.indexOf("'part9-perf.css'") !== -1);
  check('JS · part9-perf.js incluida por build-game.js', build.indexOf("'part9-perf.js'") !== -1);
}

/* =========================================================================
   6 · Sin colisiones de nombres con los demás archivos del build
   ========================================================================= */
function testNoCollisions() {
  const files = ['part0-v2-core.js', 'part1-core.js', 'part2-world.js', 'part3-ui.js', 'part3b-cosmetics-core.js',
    'part3c-cosmetics-models.js', 'part3d-cosmetics-ui.js', 'part3f-map.js', 'part3h-modes.js', 'part3j-learning.js',
    'part3m-final.js', 'part5-combat.js', 'part5-heroes.js', 'part5-assets.js', 'part5-feedback.js', 'part6-world.js',
    'part4-flow.js'];
  const declared = new Set();
  const declRe = /^(?:var\s+([A-Za-z_$][\w$]*)|function\s+([A-Za-z_$][\w$]*))/gm;
  files.forEach((file) => {
    let code = '';
    try { code = read(file); } catch (e) { return; }
    let m;
    while ((m = declRe.exec(code)) !== null) declared.add(m[1] || m[2]);
  });
  const part9 = read('part9-perf.js');
  const own = new Set();
  let m;
  while ((m = declRe.exec(part9)) !== null) own.add(m[1] || m[2]);
  const collisions = Array.from(own).filter((name) => declared.has(name));
  eq('nombres · part9 no redeclara variables/funciones de otros archivos', JSON.stringify([]), JSON.stringify(collisions));
  check('nombres · todos los símbolos usan prefijo v2p/V2P', Array.from(own).every((n) => /^v2p/i.test(n) || /^V2P/.test(n)), collisions);
}

/* =========================================================================
   Ejecución
   ========================================================================= */
try {
  testShadow();
  testCulling();
  testBank();
  testBareLoad();
  testRestoration();
  testCss();
  testNoCollisions();
} catch (error) {
  fail += 1;
  failures.push('excepción no controlada: ' + (error && error.stack || error));
}

console.log('\n================ RESUMEN HARNESS AGENTE 6 ================');
console.log('PASS:', pass, ' FAIL:', fail);
if (failures.length) {
  console.log('\nFallos:');
  failures.forEach((f, i) => console.log(' ', i + 1 + '.', f));
  process.exitCode = 1;
} else {
  console.log('Todo correcto.');
}
