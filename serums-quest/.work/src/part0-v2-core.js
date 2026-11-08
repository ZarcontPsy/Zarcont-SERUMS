/* =========================================================================
   SERUMS QUEST · V2 · núcleo de integración
   Checkpoint 1 · namespace, presupuesto de efectos y puente entre módulos.
   Este archivo se carga antes que part1-core.js: no toca el DOM ni el estado
   al evaluarse; todas las consultas se resuelven cuando se llaman.
   ========================================================================= */
var V2 = window.__SERUMS_V2__ = window.__SERUMS_V2__ || {};
V2.version = '2.0.0-checkpoint1';
V2.modules = V2.modules || {};
V2.events = V2.events || [];
V2._errors = V2._errors || [];

V2.clamp = function (value, min, max) {
  var n = Number(value);
  if (!isFinite(n)) n = min;
  return Math.max(min, Math.min(max, n));
};
V2.lerp = function (a, b, t) { return a + (b - a) * t; };
V2.rand = function (seed) {
  var s = Number(seed) || 1;
  return function () {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
V2.now = function () { return (window.performance && performance.now) ? performance.now() : Date.now(); };

V2.quality = function () {
  try {
    if (typeof state !== 'undefined' && state && state.settings && state.settings.effectsQuality) {
      return state.settings.effectsQuality;
    }
  } catch (e) {}
  return 'medio';
};
V2.reducedMotion = function () {
  try {
    if (typeof state !== 'undefined' && state && state.settings && state.settings.reducedMotion) return true;
  } catch (e) {}
  try {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) { return false; }
};
V2.isTouch = function () {
  try { return !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); } catch (e) { return false; }
};
V2.pixelRatio = function (max) {
  var ratio = Number(window.devicePixelRatio) || 1;
  var cap = max || (V2.quality() === 'bajo' ? 1 : V2.quality() === 'alto' ? 1.75 : 1.35);
  return Math.max(1, Math.min(cap, ratio));
};
V2.budget = function () {
  var q = V2.quality();
  if (q === 'bajo') return { props: 5, particles: 18, decor: 10, maxDrawCalls: 70, glow: 0.55 };
  if (q === 'alto') return { props: 12, particles: 80, decor: 26, maxDrawCalls: 150, glow: 1 };
  return { props: 8, particles: 45, decor: 18, maxDrawCalls: 105, glow: 0.8 };
};
V2.palette = {
  obsidian: '#05070d',
  sky: '#0a1120',
  stone: '#263048',
  gold: '#e4c07a',
  ink: '#f2f0ea',
  blue: '#7aa2ff',
  teal: '#69d3c1',
  violet: '#c49bff',
  lime: '#b8d46a',
  amber: '#f3b562',
  rose: '#ff8b9d',
  muted: '#a7b2c9',
  dim: '#6f7c97'
};

V2.call = function (module, method) {
  var args = Array.prototype.slice.call(arguments, 2);
  try {
    var mod = V2[module];
    if (!mod || typeof mod[method] !== 'function') return undefined;
    return mod[method].apply(mod, args);
  } catch (error) {
    V2._errors.push({ at: Date.now(), module: module, method: method, message: String(error && error.message || error) });
    if (V2._errors.length > 40) V2._errors.shift();
    try { console.warn('[V2] ' + module + '.' + method, error); } catch (e) {}
    return undefined;
  }
};
V2.has = function (module, method) {
  return !!(V2[module] && typeof V2[module][method] === 'function');
};
V2.emit = function (type, payload) {
  V2.events.push({ at: Date.now(), type: type, payload: payload || null });
  if (V2.events.length > 120) V2.events.shift();
};
V2.qualityFactor = function () {
  var q = V2.quality();
  return q === 'bajo' ? 0.45 : q === 'alto' ? 1 : 0.72;
};
V2.register = function (name, module) {
  V2[name] = module;
  V2.modules[name] = true;
};
V2.assetRegistry = function (icons) {
  V2.assets = V2.assets || {};
  V2.assets.ids = icons || {};
};
V2.color = function (hex) {
  try { return new THREE.Color(hex); } catch (e) { return null; }
};
V2.dispose = function (obj) {
  try {
    if (typeof disposeObject === 'function') disposeObject(obj);
  } catch (e) {}
};
V2.softError = function (scope, error) {
  V2._errors.push({ at: Date.now(), module: scope || 'v2', method: 'error', message: String(error && error.message || error) });
  if (V2._errors.length > 40) V2._errors.shift();
};
V2.ready = function () {
  return typeof state !== 'undefined' && !!state && !!document.getElementById('game');
};
window.__V2 = V2;
