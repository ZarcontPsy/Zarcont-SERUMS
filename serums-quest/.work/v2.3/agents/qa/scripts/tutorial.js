'use strict';
/* Caso 2 · Bienvenida/tutorial: causa raíz (sin remontaje), guardado visto y
   recarga; Caso 3 · almacenamiento bloqueado con el preload del arnés. */
const C = require('./common');

async function identity(s) {
  return s.ev(`(() => {
    const cur = {
      title: document.querySelector('.titleScreen'),
      canvas: document.querySelector('#game'),
      overlay: document.querySelector('#v23Tutorial')
    };
    const st = window.__v23welcome.tutorialState();
    const overlay = cur.overlay;
    return {
      step: st.step, active: st.active, total: st.total,
      sameTitle: !!cur.title && cur.title === window.__qa.title,
      sameCanvas: !!cur.canvas && cur.canvas === window.__qa.canvas,
      sameOverlay: !!overlay && overlay === window.__qa.overlay,
      titleConnected: !!(cur.title && document.body.contains(cur.title)),
      overlayOpen: !!(overlay && !overlay.hidden && overlay.classList.contains('is-open')),
      screen: window.__v23.screen(),
      renderCount: window.__v23.renderCount(),
      renderDelta: window.__v23.renderCount() - window.__qa.render,
      titlePaints: window.__v23welcome.titlePaints(),
      titlePaintDelta: window.__v23welcome.titlePaints() - window.__qa.paints,
      screenMutations: window.__qa.mut,
      progress: (document.querySelector('.v23tutProgressText') || {}).textContent || null,
      stepTitle: (document.querySelector('.v23tutBody h2') || {}).textContent || null,
      nextLabel: (document.querySelector('[data-action="tutorial-next"]') || {}).textContent || null,
      recovery: !!document.querySelector('.recoveryShell'),
      storageBannerText: (document.querySelector('.storageBanner') || {}).textContent || null,
      titleNodeClass: cur.title ? cur.title.className : null
    };
  })()`);
}

async function markStart(s) {
  await s.ev(`(() => {
    window.__qa = {
      title: document.querySelector('.titleScreen'),
      canvas: document.querySelector('#game'),
      overlay: document.querySelector('#v23Tutorial'),
      screen: document.querySelector('#screen'),
      render: window.__v23.renderCount(),
      paints: window.__v23welcome.titlePaints()
    };
    window.__qa.mut = 0;
    if (window.__qaObs) try { window.__qaObs.disconnect(); } catch (e) {}
    window.__qaObs = new MutationObserver(function (list) { window.__qa.mut += list.length; });
    window.__qaObs.observe(document.querySelector('#screen'), { childList: true, subtree: true });
    return true;
  })()`);
}

(async () => {
  const report = { startedAt: new Date().toISOString(), allowed: {}, blocked: {}, checks: {} };
  let s;
  /* -------- Sesión A: guardado permitido, tutorial ya visto / no visto -------- */
  try {
    s = await C.launch({ width: 1280, height: 720, preload: C.NAV_COUNTER_PRELOAD });
    await s.seed(C.readSave('all'));
    await C.sleep(1800);
    const navsA = C.trackNavigations(s);
    report.allowed.withTutorialSeen = await s.ev(`(() => ({
      screen: window.__v23.screen(),
      tutorialOpen: !!document.querySelector('#v23Tutorial.is-open'),
      tutorialState: window.__v23welcome.tutorialState(),
      title: !!document.querySelector('.titleScreen.v23w'),
      titlePaints: window.__v23welcome.titlePaints(),
      docGen: window.__qaDocGen == null ? null : window.__qaDocGen,
      nav: window.__v23.navigationCount(),
      cta: (document.querySelector('.v23wCta') || {}).innerText || null,
      ctas: document.querySelectorAll('[data-action="menu-continue"], [data-action="open-tutorial"]').length,
      routes: document.querySelectorAll('.v23wRoute').length
    }))()`);
    await s.shot(C.SHOTS + '\\welcome-tutorial-visto-1280x720.png');

    /* Guardado con tutorialSeen=false: debe abrirse solo. */
    await s.seed(C.readSave('tutorial'));
    const opened = await s.waitFor("!!document.querySelector('#v23Tutorial.is-open')", 9000);
    await C.sleep(500);
    report.allowed.autoOpen = { opened, state: await s.ev('window.__v23welcome.tutorialState()'), screen: await s.ev('window.__v23.screen()') };
    await markStart(s);
    report.allowed.steps = [];
    report.allowed.step1Shot = C.rel(await C.shot(s, 'tutorial-step1-1280x720.png'));
    report.allowed.steps.push(Object.assign({ phase: 'step1' }, await identity(s)));
    for (let i = 0; i < 4; i += 1) {
      await s.click('[data-action="tutorial-next"]', 550);
      const row = await identity(s);
      row.phase = 'after-next-' + (i + 1);
      report.allowed.steps.push(row);
      console.log(row.phase, JSON.stringify({ step: row.step, sameOverlay: row.sameOverlay, sameTitle: row.sameTitle, sameCanvas: row.sameCanvas, screen: row.screen, renderDelta: row.renderDelta, paints: row.titlePaintDelta, mut: row.screenMutations }));
    }
    report.allowed.step5Shot = C.rel(await C.shot(s, 'tutorial-step5-1280x720.png'));
    report.allowed.afterSteps = await identity(s);

    /* Saltar y comprobar guardado + recarga. */
    await s.click('[data-action="tutorial-skip"]', 600);
    report.allowed.afterClose = await s.ev(`(() => ({
      open: !!document.querySelector('#v23Tutorial.is-open'),
      hidden: document.querySelector('#v23Tutorial') ? document.querySelector('#v23Tutorial').hidden : null,
      state: window.__v23welcome.tutorialState(),
      tutorialSeen: (() => { try { return JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')).settings.tutorialSeen; } catch (e) { return 'ERR'; } })(),
      screen: window.__v23.screen(),
      title: !!document.querySelector('.titleScreen.v23w')
    }))()`);
    const docGenBeforeReload = await s.ev('window.__qaDocGen');
    await s.navigate(s.target);
    await C.sleep(1800);
    report.allowed.afterReload = await s.ev(`(() => ({
      tutorialOpen: !!document.querySelector('#v23Tutorial.is-open'),
      screen: window.__v23.screen(),
      title: !!document.querySelector('.titleScreen.v23w'),
      tutorialSeen: (() => { try { return JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')).settings.tutorialSeen; } catch (e) { return 'ERR'; } })(),
      docGen: window.__qaDocGen == null ? null : window.__qaDocGen,
      nav: window.__v23.navigationCount()
    }))()`);
    report.allowed.afterReload.docGenBefore = docGenBeforeReload;
    await s.shot(C.SHOTS + '\\welcome-after-reload-1280x720.png');
    report.allowed.errors = C.summarizeErrors(s);
    report.allowed.cdpNavigations = navsA.map((n) => n.url);
    report.allowed.final = await s.ev('({ screen: window.__v23.screen(), nav: window.__v23.navigationCount(), docGen: window.__qaDocGen, renderCount: window.__v23.renderCount() })');
  } catch (e) {
    report.allowed.fatal = String(e && e.stack || e);
  } finally {
    if (s) { report.allowed.sessionErrors = C.summarizeErrors(s); await s.close(); }
  }

  /* -------- Sesión B: almacenamiento bloqueado -------- */
  s = null;
  try {
    s = await C.launch({ width: 1280, height: 720, profile: 'p9545-blocked', preload: C.BLOCKED_PRELOAD + '\n' + C.NAV_COUNTER_PRELOAD });
    const opened = await s.waitFor("!!document.querySelector('#v23Tutorial.is-open')", 10000);
    await C.sleep(700);
    const navsB = C.trackNavigations(s);
    const blocked1 = await s.ev(`(() => {
      let ls = 'ok'; try { localStorage.getItem('x'); } catch (e) { ls = 'throws'; }
      return {
        storage: ls,
        tutorialOpen: !!document.querySelector('#v23Tutorial.is-open'),
        tutorialState: window.__v23welcome.tutorialState(),
        welcome: !!document.querySelector('.titleScreen.v23w'),
        recovery: !!document.querySelector('.recoveryShell'),
        recoveryText: document.body.innerText.indexOf('No he borrado tu partida') !== -1,
        storageBanner: !!document.querySelector('.storageBanner'),
        storageBannerText: (document.querySelector('.storageBanner') || {}).innerText || null,
        cta: (document.querySelector('.v23wCta') || {}).innerText || null,
        ctas: document.querySelectorAll('[data-action="menu-continue"], [data-action="open-tutorial"]').length,
        routes: document.querySelectorAll('.v23wRoute').length,
        storageInfo: window.__v23welcome.recovery(),
        screen: window.__v23.screen(),
        docGen: window.__qaDocGen == null ? null : window.__qaDocGen,
        nav: window.__v23.navigationCount(),
        corrupt: !!(window.__v22 && window.__v22.corrupt)
      };
    })()`);
    report.blocked.initial = Object.assign({ autoOpened: opened }, blocked1);
    report.blocked.welcomeShot = C.rel(await C.shot(s, 'blocked-welcome-1280x720.png'));
    report.blocked.step1Shot = C.rel(await C.shot(s, 'blocked-tutorial-step1-1280x720.png'));

    await markStart(s);
    report.blocked.steps = [];
    report.blocked.steps.push(Object.assign({ phase: 'step1' }, await identity(s)));
    await s.click('[data-action="tutorial-next"]', 600);
    report.blocked.steps.push(Object.assign({ phase: 'after-next-1' }, await identity(s)));
    report.blocked.step2Shot = C.rel(await C.shot(s, 'blocked-tutorial-step2-1280x720.png'));
    report.blocked.afterStep = await s.ev('({ step: window.__v23welcome.tutorialState().step, recovery: !!document.querySelector(".recoveryShell"), banner: (document.querySelector(".storageBanner")||{}).innerText || null })');

    /* Recarga: sin almacenamiento, el tutorial puede volver a ofrecerse. */
    const genBefore = await s.ev('window.__qaDocGen');
    await s.navigate(s.target);
    const reopened = await s.waitFor("!!document.querySelector('#v23Tutorial.is-open')", 9000);
    await C.sleep(600);
    report.blocked.afterReload = await s.ev(`(() => ({
      tutorialOpen: !!document.querySelector('#v23Tutorial.is-open'),
      screen: window.__v23.screen(),
      welcome: !!document.querySelector('.titleScreen.v23w'),
      recovery: !!document.querySelector('.recoveryShell'),
      storageBanner: !!document.querySelector('.storageBanner'),
      tutorialSeen: (() => { try { return JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')); } catch (e) { return 'throws'; } })(),
      docGen: window.__qaDocGen == null ? null : window.__qaDocGen
    }))()`);
    report.blocked.afterReload.docGenBefore = genBefore;
    report.blocked.afterReload.tutorialReopened = reopened;
    report.blocked.reloadShot = C.rel(await C.shot(s, 'blocked-reload-1280x720.png'));
    report.blocked.errors = C.summarizeErrors(s);
    report.blocked.cdpNavigations = navsB.map((n) => n.url);
  } catch (e) {
    report.blocked.fatal = String(e && e.stack || e);
  } finally {
    if (s) { report.blocked.sessionErrors = C.summarizeErrors(s); await s.close(); }
  }

  C.writeJSON('tutorial.json', report);
  console.log('allowed fatal', report.allowed.fatal || 'none', 'blocked fatal', report.blocked.fatal || 'none');
})();
