'use strict';
/* QA funcional de la Fase 1B: tutorial automático, teclado, foco, ayuda,
   almacenamiento bloqueado, movimiento reducido, calidad, FPS y cero
   remontajes. Escribe en .work/v2.3b/evidence/data/. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');

const DATA = path.resolve(__dirname, '..', 'evidence', 'data');
const SHOTS = path.resolve(__dirname, '..', 'evidence', 'after');
const SAVE_ALL = path.resolve(__dirname, '..', '..', 'v2.3', 'qa', 'save-v23-all.json');
const SAVE_TUT = path.resolve(__dirname, '..', '..', 'v2.3', 'qa', 'save-v23-tutorial.json');
const BUNDLE = path.join(ROOT, 'dist', 'index.html');
const BLOCKED = `(() => { try { Object.defineProperty(window, 'localStorage', { configurable: true, get: function () { throw new Error('localStorage blocked by QA'); } }); } catch (e) {} })();`;

function sha(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function pixelDiff(a, b) {
  const py = process.env.PYTHON || 'C:\\Python313\\python.exe';
  const code = [
    'from PIL import Image, ImageChops',
    'import numpy as np, sys, json',
    'a=Image.open(sys.argv[1]).convert("RGB"); b=Image.open(sys.argv[2]).convert("RGB")',
    'd=np.array(ImageChops.difference(a,b))',
    'print(json.dumps({"max":int(d.max()),"changed":int((d.max(axis=2)>2).sum()),"sum":int(d.sum())}))'
  ].join('\n');
  try {
    return JSON.parse(execFileSync(py, ['-c', code, a, b], { encoding: 'utf8' }).trim());
  } catch (e) {
    return null;
  }
}
async function key(h, code, keyName, keyCode) {
  return h.ev(`(() => { const e = new KeyboardEvent('keydown', { code: ${JSON.stringify(code)}, key: ${JSON.stringify(keyName)}, bubbles: true, cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; })()`);
}
async function clickAction(h, action) {
  return h.ev(`(() => { const el = document.querySelector('[data-action="${action}"]'); if (!el) return false; el.click(); return true; })()`);
}
function readJSON(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }

(async () => {
  fs.mkdirSync(DATA, { recursive: true });
  fs.mkdirSync(SHOTS, { recursive: true });
  const report = { generatedAt: new Date().toISOString(), cases: [], errors: [], notes: [] };

  /* ---------------------------------------------------------------------
     1 · Tutorial automático + teclado + ayuda + persistencia
     --------------------------------------------------------------------- */
  const h = await open({ port: 9564, profile: path.join(__dirname, 'profiles', 'functional'), bundle: BUNDLE, width: 1280, height: 720 });
  try {
    await h.seed(readJSON(SAVE_TUT), { reload: true });
    await sleep(2400);
    const first = await h.ev(`(() => {
      window.__qa = { canvas: window.__v23b.canvas(), scene: window.__v23b.scene(), renderer: window.__v23b.renderer(), overlay: window.__v23welcome.tutorialNode(), title: document.querySelector('.titleScreen'), game: document.getElementById('game') };
      const st = window.__v23welcome.tutorialState();
      return { st, screen: window.__v23.screen(), mode: window.__v23b.mode(), active: window.__v23b.active(), renderCount: window.__v23.renderCount(), titlePaints: window.__v23welcome.titlePaints(), canvasCount: document.querySelectorAll('canvas').length, overlayVisible: !document.getElementById('v23Tutorial').hidden, zone: window.__v23b.zone() };
    })()`);
    report.cases.push({ name: 'auto-tutorial', pass: first.st.active && first.st.step === 0 && first.screen === 'title' && first.mode === 'tutorial' && first.overlayVisible, data: first });
    await h.shot(path.join(SHOTS, 'functional-tutorial-auto-1280.png'));

    const step1 = await h.ev(`(() => { const prevented = (() => { const e = new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true, cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; })(); return { prevented, st: window.__v23welcome.tutorialState(), screen: window.__v23.screen(), mode: window.__v23b.mode(), sameOverlay: window.__qa.overlay === window.__v23welcome.tutorialNode(), sameCanvas: window.__qa.canvas === window.__v23b.canvas(), sameScene: window.__qa.scene === window.__v23b.scene(), sameTitle: window.__qa.title === document.querySelector('.titleScreen'), renderCount: window.__v23.renderCount(), titlePaints: window.__v23welcome.titlePaints() }; })()`);
    report.cases.push({ name: 'enter-avanza-sin-entrar-al-juego', pass: step1.prevented && step1.st.step === 1 && step1.screen === 'title' && step1.mode === 'tutorial', data: step1 });
    await h.shot(path.join(SHOTS, 'functional-tutorial-step2-1280.png'));

    const step2 = await h.ev(`(() => { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight', key: 'ArrowRight', bubbles: true, cancelable: true })); return window.__v23welcome.tutorialState(); })()`);
    const step3 = await h.ev(`(() => { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft', key: 'ArrowLeft', bubbles: true, cancelable: true })); return window.__v23welcome.tutorialState(); })()`);
    report.cases.push({ name: 'flechas-navegan', pass: step2.step === 2 && step3.step === 1, data: { step2, step3 } });

    const closed = await h.ev(`(() => { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true, cancelable: true })); return { st: window.__v23welcome.tutorialState(), screen: window.__v23.screen(), mode: window.__v23b.mode(), hidden: document.getElementById('v23Tutorial').hidden, sameTitle: window.__qa.title === document.querySelector('.titleScreen'), renderCount: window.__v23.renderCount(), titlePaints: window.__v23welcome.titlePaints() }; })()`);
    report.cases.push({ name: 'esc-cierra-y-vuelve-a-bienvenida', pass: !closed.st.active && closed.hidden && closed.screen === 'title' && closed.mode === 'welcome' && closed.renderCount === 0, data: closed });
    await h.shot(path.join(SHOTS, 'functional-welcome-after-tutorial-1280.png'));

    /* Reabrir desde Ayuda */
    await clickAction(h, 'open-help');
    await sleep(500);
    const helpScreen = await h.ev("({ screen: window.__v23.screen(), hasTutorialButton: !!document.querySelector('[data-action=\"open-tutorial\"]') })");
    await clickAction(h, 'open-tutorial');
    await sleep(600);
    const reopened = await h.ev(`(() => ({ st: window.__v23welcome.tutorialState(), screen: window.__v23.screen(), mode: window.__v23b.mode(), sameOverlay: window.__qa.overlay === window.__v23welcome.tutorialNode(), canvas: window.__v23b.canvas() === window.__qa.canvas }))()`);
    report.cases.push({ name: 'reabrir-desde-ayuda', pass: helpScreen.screen === 'help' && helpScreen.hasTutorialButton && reopened.st.active && reopened.st.returnScreen === 'help' && reopened.sameOverlay && reopened.canvas, data: { helpScreen, reopened } });
    await h.shot(path.join(SHOTS, 'functional-tutorial-from-help-1280.png'));
    await clickAction(h, 'tutorial-close');
    await sleep(500);
    const backHelp = await h.ev("({ screen: window.__v23.screen(), tutorial: window.__v23welcome.tutorialState(), mode: window.__v23b.mode() })");
    report.cases.push({ name: 'cerrar-vuelve-a-ayuda', pass: backHelp.screen === 'help' && !backHelp.tutorial.active && backHelp.mode === null, data: backHelp });
    await clickAction(h, 'close-help');
    await sleep(500);

    /* Persistencia: tutorialSeen queda guardado y no reaparece al recargar. */
    if (h.target) await h.navigate(h.target);
    await sleep(2200);
    const reloaded = await h.ev("({ st: window.__v23welcome.tutorialState(), screen: window.__v23.screen(), tutorialSeen: !!(window.__v23.snapshot && window.__v23.snapshot().tutorialSeen) })");
    const saved = await h.readSave();
    report.cases.push({ name: 'solo-primera-vez', pass: !reloaded.st.active && reloaded.screen === 'title' && saved && saved.settings && saved.settings.tutorialSeen === true, data: { reloaded, tutorialSeen: saved && saved.settings && saved.settings.tutorialSeen } });

    /* Cero remontajes del canvas/escena al alternar welcome ↔ tutorial. */
    await clickAction(h, 'open-tutorial');
    await sleep(700);
    await h.ev("(() => { window.__qa = { canvas: window.__v23b.canvas(), scene: window.__v23b.scene(), renderer: window.__v23b.renderer(), overlay: window.__v23welcome.tutorialNode(), title: document.querySelector('.titleScreen'), game: document.getElementById('game') }; return true; })()");
    await h.ev("(() => { window.__v23welcome.stepTo(2); return true; })()");
    await sleep(900);
    await h.ev("(() => { window.__v23welcome.stepTo(4); return true; })()");
    await sleep(900);
    const lifecycle = await h.ev(`(() => ({ canvasCount: document.querySelectorAll('canvas').length, cinemaCount: document.querySelectorAll('#v23bCinema').length, sameCanvas: window.__qa.canvas === window.__v23b.canvas(), sameScene: window.__qa.scene === window.__v23b.scene(), sameRenderer: window.__qa.renderer === window.__v23b.renderer(), sameOverlay: window.__qa.overlay === window.__v23welcome.tutorialNode(), titlePaints: window.__v23welcome.titlePaints(), renderCount: window.__v23.renderCount(), mode: window.__v23b.mode(), step: window.__v23b.step() }))()`);
    const savedBefore = await h.readSave();
    report.cases.push({ name: 'cero-remontajes', pass: lifecycle.canvasCount === 2 && lifecycle.cinemaCount === 1 && lifecycle.sameCanvas && lifecycle.sameScene && lifecycle.sameRenderer && lifecycle.sameOverlay && lifecycle.titlePaints === 1 && lifecycle.renderCount === 0, data: lifecycle });
    await h.ev("(() => { window.__v23welcome.close(); return true; })()");
    await sleep(400);
    const savedAfter = await h.readSave();
    const stableSave = (() => {
      const a = Object.assign({}, savedBefore || {}); const b = Object.assign({}, savedAfter || {});
      delete a.updatedAt; delete b.updatedAt;
      return JSON.stringify(a) === JSON.stringify(b);
    })();
    report.cases.push({ name: 'guardado-intacto', pass: stableSave, data: { savedBytes: JSON.stringify(savedBefore || {}).length, note: 'solo updatedAt cambia al persistir el cierre' } });
    report.consoleErrors = h.errors.slice();
    report.warnings = h.warnings.slice(0, 20);
  } finally {
    await h.close();
  }

  /* ---------------------------------------------------------------------
     2 · Almacenamiento bloqueado
     --------------------------------------------------------------------- */
  const hb = await open({ port: 9565, profile: path.join(__dirname, 'profiles', 'blocked'), bundle: BUNDLE, width: 1280, height: 720, preload: BLOCKED });
  try {
    await sleep(2400);
    const blocked = await hb.ev(`(() => {
      const st = window.__v23welcome.tutorialState();
      window.__qa2 = { overlay: window.__v23welcome.tutorialNode(), canvas: window.__v23b.canvas() };
      return {
        st, screen: window.__v23.screen(), mode: window.__v23b.mode(),
        storageEnabled: window.__v23.snapshot().storageEnabled,
        recovery: window.__v23welcome.recovery(),
        chip: (() => { const el = document.querySelector('.storageIndicator'); return el ? el.innerText.replace(/\\s+/g, ' ').trim() : null; })(),
        recoveryScreen: !!document.querySelector('.recoveryShell, [data-screen="recovery"]'),
        errorCount: window.__v23b.errors().length
      };
    })()`);
    await hb.shot(path.join(SHOTS, 'functional-blocked-tutorial-1280.png'));
    const blockedStep = await hb.ev(`(() => { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true, cancelable: true })); return { st: window.__v23welcome.tutorialState(), sameOverlay: window.__qa2.overlay === window.__v23welcome.tutorialNode(), sameCanvas: window.__qa2.canvas === window.__v23b.canvas(), mode: window.__v23b.mode() }; })()`);
    report.cases.push({ name: 'almacenamiento-bloqueado', pass: blocked.st.active && blocked.storageEnabled === false && blocked.recovery.storageEnabled === false && !blocked.recovery.corrupt && blocked.mode === 'tutorial' && blocked.recoveryScreen === false && /SIN GUARDADO/i.test(blocked.chip || '') && blockedStep.st.step === 1 && blockedStep.sameOverlay && blockedStep.sameCanvas, data: { blocked, blockedStep } });
    report.blockedErrors = hb.errors.slice();
  } finally {
    await hb.close();
  }

  /* ---------------------------------------------------------------------
     3 · Movimiento reducido, calidad, FPS y encuadre
     --------------------------------------------------------------------- */
  const hp = await open({ port: 9566, profile: path.join(__dirname, 'profiles', 'perf'), bundle: BUNDLE, width: 1280, height: 720 });
  try {
    await hp.seed(readJSON(SAVE_ALL), { reload: true });
    await sleep(2000);
    await hp.ev("(() => { window.__v23.setReducedMotion(true); return true; })()");
    await sleep(800);
    const redA = path.join(SHOTS, 'functional-reduced-a-1280.png');
    const redB = path.join(SHOTS, 'functional-reduced-b-1280.png');
    await hp.shot(redA); await sleep(900); await hp.shot(redB);
    const pixel = pixelDiff(redA, redB);
    const reducedSame = sha(redA) === sha(redB) || (pixel && pixel.max <= 2 && pixel.changed === 0);
    const redInfo = await hp.ev("({ reduced: window.__v23b.reduced(), fps: window.__v23b.fps(), mode: window.__v23b.mode() })");
    await hp.ev("(() => { window.__v23.setReducedMotion(false); return true; })()");
    await sleep(800);
    const movA = path.join(SHOTS, 'functional-motion-a-1280.png');
    const movB = path.join(SHOTS, 'functional-motion-b-1280.png');
    await hp.shot(movA); await sleep(900); await hp.shot(movB);
    const motionDiff = sha(movA) !== sha(movB);
    report.cases.push({ name: 'movimiento-reducido-estatico', pass: reducedSame && redInfo.reduced === true && motionDiff, data: { reducedSame, motionDiff, redInfo, pixelDiff: pixel } });

    const fpsByMode = {};
    async function fpsNow(label) {
      const vals = [];
      for (let i = 0; i < 18; i++) { const v = await hp.ev("window.__gameState ? window.__gameState().fps : null"); if (typeof v === 'number') vals.push(v); await sleep(110); }
      vals.sort((a, b) => a - b);
      fpsByMode[label] = { min: vals[0], median: vals[Math.floor(vals.length / 2)], max: vals[vals.length - 1] };
    }
    for (const q of ['bajo', 'medio', 'alto']) {
      await hp.ev('(() => { window.__v23.setQuality(' + JSON.stringify(q) + '); return true; })()');
      await sleep(600);
      await fpsNow('welcome-' + q);
      const stats = await hp.ev("window.__v23b.stats()");
      report.cases.push({ name: 'calidad-' + q, pass: stats.quality === q, data: stats });
    }
    await hp.ev("(() => { window.__v23welcome.open('title'); return true; })()");
    await sleep(900);
    for (const q of ['bajo', 'medio', 'alto']) {
      await hp.ev('(() => { window.__v23.setQuality(' + JSON.stringify(q) + '); return true; })()');
      await sleep(500);
      await fpsNow('tutorial-' + q);
    }
    report.cases.push({ name: 'fps-min-60', pass: Object.keys(fpsByMode).every(k => fpsByMode[k].min >= 60), data: fpsByMode });
    report.perf = fpsByMode;
    report.perfErrors = hp.errors.slice();
  } finally {
    await hp.close();
  }

  /* ---------------------------------------------------------------------
     4 · Resumen
     --------------------------------------------------------------------- */
  report.failures = report.cases.filter(c => !c.pass);
  report.pass = report.failures.length === 0;
  report.summary = { cases: report.cases.length, pass: report.cases.filter(c => c.pass).length, fail: report.failures.length };
  fs.writeFileSync(path.join(DATA, 'functional.json'), JSON.stringify(report, null, 1));
  console.log(JSON.stringify(report.summary));
  report.cases.forEach(c => console.log((c.pass ? 'PASS' : 'FAIL') + '  ' + c.name));
  if (report.failures.length) console.log(JSON.stringify(report.failures, null, 1));
  console.log('errors', JSON.stringify(report.consoleErrors), JSON.stringify(report.blockedErrors), JSON.stringify(report.perfErrors));
})().catch(e => { console.error(e); process.exit(1); });
