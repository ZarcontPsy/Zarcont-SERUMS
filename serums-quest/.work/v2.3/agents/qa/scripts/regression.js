'use strict';
/* Caso 8 · Regresión básica de navegación desde la bienvenida + caso 9
   (cero recargas completas) en toda la pasada. */
const C = require('./common');

async function press(h, code, key, keyCode) {
  await h.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode });
  await h.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode });
  await C.sleep(450);
}

const stateExpr = `(() => ({
  screen: window.__v23.screen(),
  title: !!document.querySelector('.titleScreen.v23w'),
  tutorials: document.querySelectorAll('#v23Tutorial.is-open').length,
  tutorialState: window.__v23welcome.tutorialState(),
  help: !!document.querySelector('.helpShell'),
  settings: !!document.querySelector('.settingsShell, [data-action="close-settings"]'),
  map: !!document.querySelector('.mapHud, .mapOverlay, [data-action="map-close"]'),
  shop: !!document.querySelector('[data-v23-shop-screen]'),
  wardrobe: !!document.querySelector('[data-v23-wardrobe-screen]'),
  ctas: document.querySelectorAll('[data-action="menu-continue"], [data-action="open-tutorial"]').length,
  routes: document.querySelectorAll('.v23wRoute').length,
  gameSame: document.querySelector('#game') === window.__qaGame,
  canvasCount: document.querySelectorAll('canvas').length,
  renderCount: window.__v23.renderCount(),
  version: (document.querySelector('.v23wVersion') || {}).innerText || null,
  nav: window.__v23.navigationCount(),
  docGen: window.__qaDocGen == null ? null : window.__qaDocGen
}))()`;

(async () => {
  const report = { startedAt: new Date().toISOString(), steps: [], checks: {}, errors: {}, fatal: null };
  let s;
  try {
    s = await C.launch({ width: 1280, height: 720, preload: C.NAV_COUNTER_PRELOAD });
    await s.seed(C.readSave('all'));
    await C.sleep(900);
    const navs = C.trackNavigations(s);
    await s.ev('(() => { window.__qaGame = document.querySelector("#game"); window.__qaTitle = document.querySelector(".titleScreen"); return true; })()');
    report.start = await s.ev(stateExpr);
    report.start.versionBox = await s.ev(`(() => { const el = document.querySelector('.v23wVersion'); if (!el) return null; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { text: el.innerText, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), inside: r.x >= 0 && r.y >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1, display: cs.display, visibility: cs.visibility, opacity: cs.opacity }; })()`);
    await s.shot(C.SHOTS + '\\regresion-bienvenida-1280x720.png');

    /* Mapa → Esc (comportamiento existente: vuelve al atrio) */
    await s.click('[data-action="open-map"]', 1300);
    report.steps.push({ id: 'abrir-mapa', data: await s.ev(stateExpr) });
    await press(s, 'Escape', 'Escape', 27);
    await C.sleep(700);
    report.steps.push({ id: 'mapa-escape', data: await s.ev(stateExpr) });
    await s.ev('window.__v23.openTitle()');
    await C.sleep(600);

    /* Ajustes → Esc → bienvenida */
    await s.click('[data-action="open-settings"]', 700);
    report.steps.push({ id: 'abrir-ajustes', data: await s.ev(stateExpr) });
    await press(s, 'Escape', 'Escape', 27);
    await C.sleep(500);
    report.steps.push({ id: 'ajustes-escape', data: await s.ev(stateExpr) });

    /* Ajustes → Repetir tutorial → Esc → Ajustes */
    await s.click('[data-action="open-settings"]', 700);
    await s.click('.settingsActions [data-action="open-tutorial"]', 700);
    report.steps.push({ id: 'ajustes-repetir-tutorial', data: await s.ev(stateExpr) });
    await s.shot(C.SHOTS + '\\regresion-ajustes-tutorial-1280x720.png');
    await press(s, 'Escape', 'Escape', 27);
    report.steps.push({ id: 'tutorial-escape-ajustes', data: await s.ev(stateExpr) });
    await press(s, 'Escape', 'Escape', 27);
    await C.sleep(400);
    report.steps.push({ id: 'ajustes-escape-2', data: await s.ev(stateExpr) });

    /* Ayuda → Cómo jugar → Esc → Ayuda → Esc → bienvenida */
    await s.click('[data-action="open-help"]', 800);
    report.steps.push({ id: 'abrir-ayuda', data: await s.ev(stateExpr) });
    await s.click('.v23HelpTutorial [data-action="open-tutorial"]', 700);
    report.steps.push({ id: 'ayuda-como-jugar', data: await s.ev(stateExpr) });
    await s.shot(C.SHOTS + '\\regresion-ayuda-tutorial-1280x720.png');
    await press(s, 'Escape', 'Escape', 27);
    report.steps.push({ id: 'tutorial-escape-ayuda', data: await s.ev(stateExpr) });
    await press(s, 'Escape', 'Escape', 27);
    await C.sleep(400);
    report.steps.push({ id: 'ayuda-escape', data: await s.ev(stateExpr) });

    /* Tienda: abrir y cerrar con Esc */
    await s.click('[data-action="open-shop"]', 1400);
    report.steps.push({ id: 'abrir-tienda', data: await s.ev(stateExpr) });
    await press(s, 'Escape', 'Escape', 27);
    await C.sleep(700);
    report.steps.push({ id: 'cerrar-tienda-escape', data: await s.ev(stateExpr) });
    /* Inventario: abrir y cerrar con Esc */
    await s.click('[data-action="open-wardrobe"]', 1500);
    report.steps.push({ id: 'abrir-inventario', data: await s.ev(stateExpr) });
    await press(s, 'Escape', 'Escape', 27);
    await C.sleep(700);
    report.steps.push({ id: 'cerrar-inventario-escape', data: await s.ev(stateExpr) });
    await s.shot(C.SHOTS + '\\regresion-bienvenida-final-1280x720.png');

    report.checks = await s.ev(`(() => ({
      versionVisible: (function () { const el = document.querySelector('.v23wVersion'); if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.x >= 0 && r.right <= innerWidth + 1 && (el.innerText || '').indexOf('V2.3') === 0; })(),
      versionText: (document.querySelector('.v23wVersion') || {}).innerText || null,
      gameSame: document.querySelector('#game') === window.__qaGame,
      title: !!document.querySelector('.titleScreen.v23w'),
      ctas: document.querySelectorAll('[data-action="menu-continue"], [data-action="open-tutorial"]').length,
      routes: document.querySelectorAll('.v23wRoute').length,
      tools: document.querySelectorAll('.v23wTool').length,
      overlap: document.documentElement.scrollWidth > innerWidth + 1 || document.documentElement.scrollHeight > innerHeight + 1,
      nav: window.__v23.navigationCount(), docGen: window.__qaDocGen,
      renderCount: window.__v23.renderCount(),
      canvasCount: document.querySelectorAll('canvas').length,
      shopErrors: window.__v23Shop.errors(),
      screen: window.__v23.screen()
    }))()`);
    report.navs = navs.map((n) => n.url);
    report.errors = C.summarizeErrors(s);
  } catch (e) {
    report.fatal = String(e && e.stack || e);
  } finally {
    if (s) { report.sessionErrors = C.summarizeErrors(s); await s.close(); }
  }
  C.writeJSON('regression.json', report);
  console.log(JSON.stringify({ start: { version: report.start && report.start.version, versionBox: report.start && report.start.versionBox, nav: report.start && report.start.nav }, steps: report.steps.map((x) => ({ id: x.id, screen: x.data.screen, title: x.data.title, tutorials: x.data.tutorials, help: x.data.help, settings: x.data.settings, shop: x.data.shop, wardrobe: x.data.wardrobe, ctas: x.data.ctas, routes: x.data.routes, gameSame: x.data.gameSame })), checks: report.checks, navs: report.navs, errors: { c: report.errors.errorCount, w: report.errors.warningCount, nl: report.errors.nonLocal }, fatal: report.fatal }, null, 1));
})();
