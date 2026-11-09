'use strict';
/* =========================================================================
   Agente 4 · QA con almacenamiento BLOQUEADO
   El preload lanza al acceder a window.localStorage. Se verifica:
   - no aparece la pantalla de recuperación «No he borrado tu partida»;
   - se ve la bienvenida (CTA «Comenzar», sin progreso) y el tutorial;
   - avanzar el tutorial conserva overlay, título y canvas (sin remontaje);
   - al recargar no se puede guardar tutorialSeen: el tutorial vuelve a
     ofrecerse, que es el comportamiento correcto sin almacenamiento.
   ========================================================================= */
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../qa/cdp.js');
const OUT = path.join(ROOT, '.work', 'v2.3', 'agents', 'agent4');
const EVID = path.join(OUT, 'evidence');
const PREVIEW = path.join(ROOT, '.work', 'v2.3', 'preview', 'a4.html');
const PRELOAD = `(() => { try { Object.defineProperty(window, 'localStorage', { configurable: true, get: function () { throw new Error('localStorage blocked by QA'); } }); } catch (e) {} })();`;
const report = { startedAt: new Date().toISOString(), cases: [], shots: [], errors: [] };
function record(id, data) { report.cases.push({ id, data, at: new Date().toISOString() }); console.log('[' + id + ']', JSON.stringify(data).slice(0, 1200)); }
async function shot(s, name) { const f = path.join(EVID, name); await s.shot(f); report.shots.push(f); return f; }
(async () => {
  const s = await open({ bundle: PREVIEW, port: 9544, width: 1280, height: 720, profile: path.join(ROOT, '.work', 'v2.3', 'qa', 'profiles', 'a4'), preload: PRELOAD });
  try {
    /* El tutorial debe abrirse solo: settings por defecto, tutorialSeen=false */
    const opened = await s.waitFor("!!document.querySelector('#v23Tutorial.is-open')", 9000);
    await sleep(700);
    const first = await s.ev(`(() => {
      const cta = document.querySelector('.v23wCta');
      return {
        screen: window.__v22.screen ? window.__v22.screen() : null,
        welcome: !!document.querySelector('.titleScreen.v23w'),
        tutorial: !!document.querySelector('#v23Tutorial.is-open'),
        recovery: !!document.querySelector('.recoveryShell'),
        recoveryText: !!document.querySelector('.recoveryBox'),
        storageBanner: !!document.querySelector('.storageBanner'),
        storageBannerText: (document.querySelector('.storageBanner') || {}).textContent || null,
        cta: cta ? cta.innerText.replace(/\\n/g, ' · ') : null,
        routes: document.querySelectorAll('.v23wRoute').length,
        state: window.__v23welcome.tutorialState(),
        recoveryState: window.__v23welcome.recovery(),
        storedSave: (() => { try { return localStorage.getItem('serumsquest:voxel:state:v1'); } catch (e) { return 'BLOCKED'; } })(),
        mutations: 0,
        stepTitle: (document.querySelector('#v23TutBody h2') || {}).textContent || null
      };
    })()`);
    first.tutorialOpened = opened;
    await shot(s, 'blocked-tutorial-step1-1280x720.png');
    record('BLOCKED-STEP1', first);

    /* Marcar identidades y observar #screen */
    await s.ev(`(() => {
      const t = document.querySelector('.titleScreen'); if (t) t.setAttribute('data-qa-title', '1');
      const c = document.querySelector('#game'); if (c) c.setAttribute('data-qa-canvas', '1');
      const o = document.querySelector('#v23Tutorial'); if (o) o.setAttribute('data-qa-tut', '1');
      window.__qaMut = 0;
      window.__qaObs = new MutationObserver(function (l) { window.__qaMut += l.length; });
      window.__qaObs.observe(document.querySelector('#screen'), { childList: true, subtree: true });
      return true;
    })()`);
    await s.ev("document.querySelector('[data-action=\"tutorial-next\"]').click()");
    await sleep(420);
    await shot(s, 'blocked-tutorial-step2-1280x720.png');
    const step2 = await s.ev(`(() => ({
      state: window.__v23welcome.tutorialState(),
      sameOverlay: !!document.querySelector('#v23Tutorial[data-qa-tut="1"]'),
      titleMarked: !!document.querySelector('.titleScreen[data-qa-title="1"]'),
      canvasMarked: !!document.querySelector('#game[data-qa-canvas="1"]'),
      titleStill: !!document.querySelector('.titleScreen.v23w'),
      screen: window.__v22.screen(),
      recovery: !!document.querySelector('.recoveryShell'),
      mutations: window.__qaMut,
      stepTitle: (document.querySelector('#v23TutBody h2') || {}).textContent || null,
      renderCount: window.__v22.renderCount || 0
    }))()`);
    record('BLOCKED-STEP2', step2);

    /* Saltar y ver la bienvenida sin almacenamiento */
    await s.ev("document.querySelector('[data-action=\"tutorial-skip\"]').click()");
    await sleep(500);
    const welcome = await s.ev(`(() => ({
      tutorialOpen: !!document.querySelector('#v23Tutorial.is-open'),
      welcome: !!document.querySelector('.titleScreen.v23w'),
      recovery: !!document.querySelector('.recoveryShell'),
      storageBanner: !!document.querySelector('.storageBanner'),
      cta: (document.querySelector('.v23wCta') || {}).innerText.replace(/\\n/g, ' · '),
      recoveryState: window.__v23welcome.recovery(),
      tutorialSeenMemory: window.__v23welcome.tutorialState().seenThisSession
    }))()`);
    await shot(s, 'blocked-welcome-1280x720.png');
    record('BLOCKED-WELCOME', welcome);

    /* Recarga: sin almacenamiento no se puede guardar tutorialSeen */
    await s.navigate(s.target);
    await s.waitFor("!!document.querySelector('#v23Tutorial.is-open')", 9000);
    await sleep(500);
    const reload = await s.ev(`(() => ({
      screen: window.__v22.screen(),
      welcome: !!document.querySelector('.titleScreen.v23w'),
      tutorial: !!document.querySelector('#v23Tutorial.is-open'),
      recovery: !!document.querySelector('.recoveryShell'),
      storageBanner: !!document.querySelector('.storageBanner'),
      recoveryState: window.__v23welcome.recovery(),
      cta: (document.querySelector('.v23wCta') || {}).innerText.replace(/\\n/g, ' · ')
    }))()`);
    record('BLOCKED-RELOAD', reload);
    await shot(s, 'blocked-reload-tutorial-1280x720.png');

    /* Cerrar con Esc y comprobar en 640×360 */
    await s.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'Escape', key: 'Escape', windowsVirtualKeyCode: 27 });
    await s.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'Escape', key: 'Escape', windowsVirtualKeyCode: 27 });
    await sleep(300);
    await s.setViewport(640, 360);
    await sleep(500);
    await shot(s, 'blocked-welcome-640x360.png');
    await s.ev("document.querySelector('.v23wCta2').click()");
    await s.waitFor("!!document.querySelector('#v23Tutorial.is-open')", 4000);
    await sleep(400);
    const small = await s.ev(`(() => {
      const p = document.querySelector('.v23tutPanel');
      const r = p.getBoundingClientRect();
      return { tutorial: !!document.querySelector('#v23Tutorial.is-open'), panel: { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom) }, scrolls: p.scrollHeight > p.clientHeight + 1, recovery: !!document.querySelector('.recoveryShell') };
    })()`);
    await shot(s, 'blocked-tutorial-640x360.png');
    record('BLOCKED-640x360', small);

    report.errors = s.errors.slice(0, 30);
    record('CONSOLE-ERRORS', report.errors);
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(OUT, 'qa-blocked.json'), JSON.stringify(report, null, 2));
    console.log('WROTE', path.join(OUT, 'qa-blocked.json'));
  } catch (e) {
    report.fatal = String(e && e.stack || e);
    console.error('FATAL', report.fatal);
    report.errors = s.errors.slice(0, 30);
    try { fs.writeFileSync(path.join(OUT, 'qa-blocked.json'), JSON.stringify(report, null, 2)); } catch (e2) {}
  } finally {
    await s.close();
  }
})();
