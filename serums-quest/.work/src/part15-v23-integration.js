/* =========================================================================
   V2.3 · FASE 1 · AGENTE 0 · INTEGRACIÓN Y ARNÉS QA
   -------------------------------------------------------------------------
   Solo el coordinador edita este archivo. Aquí se unen los hooks públicos de
   los cuatro agentes, se exponen las ayudas de QA y se resuelven las
   interacciones entre visor, catálogo, encaje y bienvenida.
   ========================================================================= */
(function v23Integration() {
  var root = window.__v23 = window.__v23 || {};
  root.version = V23.version;
  root.builtAt = V23.builtAt;

  /* Abridores seguros: las funciones del juego viven dentro del IIFE, no en
     window. Se llaman por su nombre léxico y se captura cualquier error para
     que una pantalla rota no deje al QA sin diagnóstico. */
  function safeCall(label, fn) {
    try { return fn(); } catch (e) {
      try { if (window.V2 && V2.softError) V2.softError('v23:' + label, e); } catch (e2) {}
      try { console.warn('[V2.3] ' + label, e); } catch (e3) {}
      return null;
    }
  }
  root.openTitle = function () { return safeCall('openTitle', function () { enterTitle(); return true; }); };
  root.openShop = function () { return safeCall('openShop', function () { openShop(); return true; }); };
  root.openWardrobe = function () { return safeCall('openWardrobe', function () { openWardrobe(); return true; }); };
  root.openTutorial = function () { return safeCall('openTutorial', function () { openTutorial('title'); return true; }); };
  root.closeTutorial = function () { return safeCall('closeTutorial', function () { closeTutorial(); return true; }); };
  root.enterHub = function () { return safeCall('enterHub', function () { enterGame(); return true; }); };
  root.setQuality = function (quality) {
    if (['bajo', 'medio', 'alto'].indexOf(quality) === -1) return false;
    safeCall('setEffectsQuality', function () { setEffectsQuality(quality); });
    return true;
  };
  root.setReducedMotion = function (on) { return safeCall('setReducedMotion', function () { setReducedMotion(!!on); return true; }); };
  root.setPreviewHero = function (id) {
    if (typeof V23.preview === 'undefined') V23.preview = { heroId: null };
    V23.preview.heroId = id || null;
    if (window.__v23Visor && typeof window.__v23Visor.setHero === 'function') {
      try { window.__v23Visor.setHero(id); } catch (e) {}
    }
    return V23.preview.heroId;
  };
  root.screen = function () { return typeof screen === 'string' ? screen : null; };
  root.renderCount = function () { try { return window.__v22 && window.__v22.renderCount || 0; } catch (e) { return 0; } };
  root.fps = function () {
    try { return window.__gameState ? window.__gameState().fps : null; } catch (e) { return null; }
  };
  root.snapshot = function () {
    try {
      return {
        version: V23.version,
        screen: typeof screen === 'string' ? screen : null,
        tutorial: V23.tutorial ? { active: !!V23.tutorial.active, step: V23.tutorial.step, total: V23.tutorial.total } : null,
        selectedCharacterId: state && state.collection ? state.collection.selectedCharacterId : null,
        ownedCosmetics: state && state.collection && state.collection.ownedCosmeticIds ? state.collection.ownedCosmeticIds.length : 0,
        coins: state ? state.coins : null,
        fps: root.fps(),
        canvasCount: document.querySelectorAll('canvas').length,
        previewHero: V23.preview ? V23.preview.heroId : null,
        quality: state && state.settings ? state.settings.effectsQuality : null,
        reducedMotion: !!(state && state.settings && state.settings.reducedMotion),
        storageEnabled: typeof storageEnabled === 'boolean' ? storageEnabled : null,
        renderCount: root.renderCount()
      };
    } catch (e) { return { error: String(e && e.message || e) }; }
  };
  root.visibleCards = function (selector) {
    var list = Array.prototype.slice.call(document.querySelectorAll(selector || '#shopGrid .cosmeticCard, #v23ShopGrid .cosmeticCard'));
    var vh = window.innerHeight || 0;
    var vw = window.innerWidth || 0;
    return list.filter(function (el) {
      var r = el.getBoundingClientRect();
      return r.width > 1 && r.height > 1 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
    }).length;
  };
  root.previewCanvas = function () {
    var c = document.querySelector('#shopPreviewMount canvas, #wardrobePreviewMount canvas, .v23-visor-canvas canvas');
    if (!c) return null;
    var r = c.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), id: c.getAttribute('data-v23-canvas') || '', sameNode: c === root._lastCanvas };
  };
  root.mark = function (selector, key, value) {
    var el = document.querySelector(selector);
    if (!el) return false;
    el.setAttribute('data-v23-' + (key || 'mark'), value == null ? '1' : String(value));
    return true;
  };
  root.hasMark = function (selector, key, value) {
    var el = document.querySelector(selector);
    if (!el) return false;
    return el.getAttribute('data-v23-' + (key || 'mark')) === (value == null ? '1' : String(value));
  };
  root.navigationCount = function () {
    try { return performance.getEntriesByType('navigation').length; } catch (e) { return null; }
  };

  /* Los hooks de los agentes se enlazan sin sobrescribirlos. */
  root.anchors = window.__v23Anchors || null;
  root.visor = window.__v23Visor || null;
  root.shop = window.__v23Shop || null;
  root.welcome = window.__v23welcome || window.__v23Welcome || null;
  root.cinema = window.__v23b || null;

  try {
    if (!window.__v22) window.__v22 = {};
    window.__v22.openV23Shop = function () { return root.openShop(); };
    window.__v22.openV23Wardrobe = function () { return root.openWardrobe(); };
  } catch (e) {}
})();
