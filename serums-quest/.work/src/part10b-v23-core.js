/* =========================================================================
   SERUMS QUEST · V2.3 · núcleo compartido de la fase 1
   -------------------------------------------------------------------------
   Solo el coordinador (Agente 0) edita este archivo. Los agentes de trabajo
   leen estas utilidades y escriben únicamente en su propio part1x-v23-*.
   No contiene reglas de juego: es estado de presentación y helpers de UI.
   ========================================================================= */
var V23 = {
  version: '2.3.0-phase2',
  builtAt: '2026-11-08',
  agents: {
    anchors: 'part11-v23-anchors.js',
    visor: 'part12-v23-visor.js',
    shop: 'part13-v23-shop.js',
    welcome: 'part14-v23-welcome.js',
    integration: 'part15-v23-integration.js',
    cinema: 'part16-v23b-cinema.js',
    cosmeticsCore: 'part17a-v23c-core.js',
    cosmeticsGate: 'part17g-v23c-gate.js'
  },
  preview: {
    heroId: null,
    source: '',
    zoom: 1,
    autoFrame: true
  },
  tutorial: {
    active: false,
    step: 0,
    total: 5,
    seenThisSession: false,
    returnScreen: 'title',
    overlay: null
  },
  flags: {
    welcomeMounted: false,
    shopMounted: false,
    anchorsReady: false,
    visorReady: false,
    catalogReady: false
  }
};
window.__v23 = window.__v23 || {};

function v23ById(id) { return document.getElementById(id); }
function v23Q(sel, root) { try { return (root || document).querySelector(sel); } catch (e) { return null; } }
function v23QA(sel, root) { try { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); } catch (e) { return []; } }
function v23Clamp(n, lo, hi) { n = Number(n); if (!isFinite(n)) n = lo; return Math.max(lo, Math.min(hi, n)); }
function v23Escape(value) { return typeof esc === 'function' ? esc(value) : String(value == null ? '' : value); }
function v23StorageAllowed() {
  try { return typeof storageEnabled === 'boolean' ? storageEnabled : true; } catch (e) { return true; }
}
function v23HeroList() {
  try { return CAMP.characters.map(function (c) { return c.id; }); } catch (e) { return []; }
}
function v23RarityToken(c) {
  try { return cosmeticRarityKey(c); } catch (e) { return (c && c.rarity) || 'comun'; }
}
function v23SetText(el, text) { if (el) el.textContent = String(text == null ? '' : text); }
function v23ToggleClass(el, cls, on) { if (el) el.classList[on ? 'add' : 'remove'](cls); }
function v23IsReducedMotion() {
  try { return !!(state && state.settings && state.settings.reducedMotion); } catch (e) { return false; }
}
function v23Quality() {
  try { return (state && state.settings && state.settings.effectsQuality) || 'medio'; } catch (e) { return 'medio'; }
}
