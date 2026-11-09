'use strict';
/* Caso 3 (apoyo) · Bienvenida limpia con almacenamiento bloqueado y banner. */
const C = require('./common');

(async () => {
  const report = { startedAt: new Date().toISOString(), data: {}, fatal: null };
  let s;
  try {
    s = await C.launch({ width: 1280, height: 720, profile: 'p9545-blocked2', preload: C.BLOCKED_PRELOAD + '\n' + C.NAV_COUNTER_PRELOAD });
    await s.waitFor("!!document.querySelector('#v23Tutorial.is-open')", 9000);
    await C.sleep(600);
    await s.click('[data-action="tutorial-skip"]', 700);
    await C.sleep(500);
    report.data = await s.ev(`(() => {
      let ls = 'ok'; try { localStorage.getItem('x'); } catch (e) { ls = 'throws'; }
      const banner = document.querySelector('.storageBanner');
      const text = document.body.innerText || '';
      return {
        storage: ls,
        screen: window.__v23.screen(),
        tutorialOpen: !!document.querySelector('#v23Tutorial.is-open'),
        welcome: !!document.querySelector('.titleScreen.v23w'),
        recovery: !!document.querySelector('.recoveryShell'),
        recoveryText: text.indexOf('No he borrado tu partida') !== -1,
        storageBanner: !!banner,
        bannerText: banner ? banner.innerText.replace(/\\s+/g, ' ').trim() : null,
        sinGuardado: /sin guardado/i.test(text),
        guardadoChip: (function () { const els = Array.prototype.slice.call(document.querySelectorAll('#storageIndicator, .storageIndicator, .storageBanner')); return els.map(function (e) { return (e.innerText || '').replace(/\\s+/g, ' ').trim(); }); })(),
        cta: (document.querySelector('.v23wCta') || {}).innerText || null,
        ctas: document.querySelectorAll('[data-action="menu-continue"], [data-action="open-tutorial"]').length,
        routes: document.querySelectorAll('.v23wRoute').length,
        tools: document.querySelectorAll('.v23wTool').length,
        overflow: document.documentElement.scrollWidth > innerWidth + 1 || document.documentElement.scrollHeight > innerHeight + 1,
        storageInfo: window.__v23welcome.recovery(),
        docGen: window.__qaDocGen == null ? null : window.__qaDocGen,
        nav: window.__v23.navigationCount()
      };
    })()`);
    report.shot = C.rel(await C.shot(s, 'blocked-welcome-clean-1280x720.png'));
    await s.setViewport(640, 360);
    await C.sleep(600);
    await C.shot(s, 'blocked-welcome-640x360.png');
    report.data640 = await s.ev(`(() => ({ ctas: document.querySelectorAll('[data-action="menu-continue"], [data-action="open-tutorial"]').length, routes: document.querySelectorAll('.v23wRoute').length, overflow: document.documentElement.scrollWidth > innerWidth + 1 || document.documentElement.scrollHeight > innerHeight + 1, banner: !!document.querySelector('.storageBanner') }))()`);
    report.errors = C.summarizeErrors(s);
  } catch (e) {
    report.fatal = String(e && e.stack || e);
  } finally {
    if (s) { report.sessionErrors = C.summarizeErrors(s); await s.close(); }
  }
  C.writeJSON('blocked-welcome.json', report);
  console.log(JSON.stringify(report, null, 1));
})();
