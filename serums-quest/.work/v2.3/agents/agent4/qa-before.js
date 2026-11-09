'use strict';
/* =========================================================================
   Agente 4 · reproducción del fallo ORIGINAL con el build base V2.2
   (.work/v2.3/preview/base.html, compilado antes del arreglo del núcleo).
   1) Pulsar «Siguiente» en el tutorial remonta todo el .overlayShell, cambia
      screen a 'tutorial' y desmonta el título.
   2) Con localStorage bloqueado se entra en la pantalla de recuperación
      «No he borrado tu partida».
   ========================================================================= */
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../qa/cdp.js');
const SAVE = JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2', 'qa', 'save-full.json'), 'utf8'));
const OUT = path.join(ROOT, '.work', 'v2.3', 'agents', 'agent4');
const EVID = path.join(OUT, 'evidence');
const BASE = path.join(ROOT, '.work', 'v2.3', 'preview', 'base.html');
const PRELOAD = `(() => { try { Object.defineProperty(window, 'localStorage', { configurable: true, get: function () { throw new Error('localStorage blocked by QA'); } }); } catch (e) {} })();`;
const report = { startedAt: new Date().toISOString(), cases: [], shots: [], errors: [] };
function saveWith(patch) {
  const base = JSON.parse(JSON.stringify(SAVE));
  base.settings = Object.assign({}, base.settings, { tutorialSeen: false, backupReminder: false }, patch || {});
  return base;
}
function record(id, data) { report.cases.push({ id, data, at: new Date().toISOString() }); console.log('[' + id + ']', JSON.stringify(data).slice(0, 1200)); }
(async () => {
  const s = await open({ bundle: BASE, port: 9544, width: 1280, height: 720, profile: path.join(ROOT, '.work', 'v2.3', 'qa', 'profiles', 'a4') });
  try {
    await s.seed(saveWith());
    await s.waitFor("!!document.querySelector('.tutorialShell')", 9000);
    await sleep(500);
    await s.ev("(() => { const ov=document.querySelector('.overlayShell'); if (ov) ov.setAttribute('data-qa-overlay','1'); const cv=document.querySelector('#game'); if (cv) cv.setAttribute('data-qa-canvas','1'); return true; })()");
    const before = await s.ev(`(() => ({
      screen: window.__v22.screen(),
      overlayMarked: !!document.querySelector('.overlayShell[data-qa-overlay="1"]'),
      title: !!document.querySelector('.titleScreen'),
      step: (document.querySelector('.tutorialBody .eyebrow') || {}).textContent || null,
      render: window.__v22.renderCount || 0
    }))()`);
    await s.shot(path.join(EVID, 'before-tutorial-step1.png'));
    await s.click('[data-action="tutorial-next"]', 700);
    const after = await s.ev(`(() => ({
      screen: window.__v22.screen(),
      overlayMarked: !!document.querySelector('.overlayShell[data-qa-overlay="1"]'),
      title: !!document.querySelector('.titleScreen'),
      step: (document.querySelector('.tutorialBody .eyebrow') || {}).textContent || null,
      render: window.__v22.renderCount || 0
    }))()`);
    await s.shot(path.join(EVID, 'before-tutorial-step2.png'));
    record('BEFORE-TUTORIAL-ALLOWED', { before, after, overlayRemounted: !after.overlayMarked, renderDelta: after.render - before.render, titleVisibleBefore: before.title, titleVisibleAfter: after.title });
    report.errors = s.errors.slice(0, 20);
  } catch (e) {
    report.fatal = String(e && e.stack || e);
    console.error('FATAL', report.fatal);
  } finally { await s.close(); }
  /* Almacenamiento bloqueado con el build base */
  let b = null;
  try {
    b = await open({ bundle: BASE, port: 9544, width: 1280, height: 720, profile: path.join(ROOT, '.work', 'v2.3', 'qa', 'profiles', 'a4-blocked'), preload: PRELOAD });
    b.waitFor("!!document.querySelector('.recoveryShell')", 9000).then(() => {});
    await sleep(2600);
    const blocked = await b.ev(`(() => ({
      screen: window.__v22 && window.__v22.screen ? window.__v22.screen() : null,
      recovery: !!document.querySelector('.recoveryShell'),
      recoveryTitle: (document.querySelector('.recoveryShell h1') || {}).textContent || null,
      tutorial: !!document.querySelector('.tutorialShell'),
      title: !!document.querySelector('.titleScreen'),
      storageBanner: !!document.querySelector('.storageBanner')
    }))()`);
    await b.shot(path.join(EVID, 'before-blocked-storage.png'));
    record('BEFORE-STORAGE-BLOCKED', blocked);
  } catch (e) {
    report.blockedFatal = String(e && e.stack || e);
    console.error('BLOCKED FATAL', report.blockedFatal);
  } finally { if (b) await b.close(); }
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(OUT, 'qa-before.json'), JSON.stringify(report, null, 2));
  console.log('WROTE', path.join(OUT, 'qa-before.json'));
})();
