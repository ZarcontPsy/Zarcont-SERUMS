'use strict';
/* =========================================================================
   Agente 4 · QA de bienvenida y tutorial
   - 7 tamaños (640×360, 844×390, 1024×600, 1308×662, 768×1024, 1280×720,
     1920×1080): captura y medidas de desborde/CTAs/rutas.
   - Tutorial: el nodo, el título y el canvas #game conservan identidad al
     avanzar; 0 mutaciones de #screen y 0 renderScreen() extra; panel sin
     scroll interno en 360 de alto.
   - Almacenamiento permitido: tutorialSeen se guarda, no reaparece al
     recargar; Ayuda y Ajustes abren el tutorial; Esc cierra.
   - FPS del título y del tutorial.
   ========================================================================= */
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../qa/cdp.js');
const SAVE = JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2', 'qa', 'save-full.json'), 'utf8'));
const OUT = path.join(ROOT, '.work', 'v2.3', 'agents', 'agent4');
const EVID = path.join(OUT, 'evidence');
const PREVIEW = path.join(ROOT, '.work', 'v2.3', 'preview', 'a4.html');
const SIZES = [
  [640, 360], [844, 390], [1024, 600], [1308, 662], [768, 1024], [1280, 720], [1920, 1080]
];
const report = { startedAt: new Date().toISOString(), sizes: {}, cases: [], shots: [], errors: [] };
function saveWith(patch) {
  const base = JSON.parse(JSON.stringify(SAVE));
  base.settings = Object.assign({}, base.settings, { tutorialSeen: true, backupReminder: false }, patch || {});
  return base;
}
function record(id, data) {
  report.cases.push({ id, data, at: new Date().toISOString() });
  console.log('[' + id + ']', JSON.stringify(data).slice(0, 1400));
}
async function shot(s, name) {
  const file = path.join(EVID, name);
  await s.shot(file);
  report.shots.push(file);
  return file;
}
const titleMetrics = `(() => {
  const q = (sel) => document.querySelector(sel);
  const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(r.bottom), right: Math.round(r.right) }; };
  const inside = (el) => { const r = el && el.getBoundingClientRect(); return !!r && r.top >= -1 && r.left >= -1 && r.bottom <= innerHeight + 1 && r.right <= innerWidth + 1; };
  const routes = [...document.querySelectorAll('.v23wRoute')];
  const routeLabels = routes.map(b => {
    const longSpan = b.querySelector('.v23wRouteLong');
    const shortSpan = b.querySelector('.v23wRouteShort');
    const usingLong = longSpan && getComputedStyle(longSpan).display !== 'none';
    return usingLong ? longSpan.textContent : (shortSpan ? shortSpan.textContent : '');
  });
  const routeLabelNode = routes.map(b => b.querySelector('.v23wRouteTop b'));
  const cta = q('.v23wCta'), cta2 = q('.v23wCta2');
  const copy = q('.v23wCopy'), stage = q('.v23wStage');
  return {
    screen: window.__v22.screen(),
    welcome: !!q('.titleScreen.v23w'),
    titleMarked: !!q('.titleScreen[data-qa-title="1"]'),
    canvasMarked: !!q('#game[data-qa-canvas="1"]'),
    canvas: !!q('#game'),
    images: [...document.querySelectorAll('.v23wFigure img')].map(i => i.naturalWidth),
    cta: cta ? cta.innerText.replace(/\\n/g, ' · ') : null,
    ctaInside: inside(cta), cta2Inside: inside(cta2),
    ctaRect: rect(cta), cta2Rect: rect(cta2),
    copyRect: rect(copy), stageRect: rect(stage),
    stageOverflow: stage ? getComputedStyle(stage).overflow : null,
    stageImgsClippedByDesign: stage ? (getComputedStyle(stage).overflow === 'hidden' || [...document.querySelectorAll('.v23wFigure')].every(inside)) : false,
    topSoundIcons: document.querySelectorAll('.v23wSound').length,
    routes: routes.length,
    routesInside: routes.every(inside),
    routesFullLabels: routeLabelNode.every(b => b && b.scrollWidth <= b.clientWidth + 1),
    routeLabels: routeLabels,
    nav: document.querySelectorAll('.v23wNavBtn').length,
    navInside: [...document.querySelectorAll('.v23wNavBtn')].every(inside),
    tools: [...document.querySelectorAll('.v23wTool')].map(b => b.getAttribute('aria-label')),
    toolsInside: [...document.querySelectorAll('.v23wTool')].every(inside),
    docOverflowX: document.documentElement.scrollWidth - innerWidth,
    docOverflowY: document.documentElement.scrollHeight - innerHeight,
    shellBottom: rect(q('.v23wShell')).bottom,
    vw: innerWidth, vh: innerHeight,
    version: (q('.v23wVersion') || {}).textContent || null,
    storageBanner: !!q('.storageBanner'),
    titlePaints: window.__v23welcome.titlePaints(),
    fps: window.__gameState().fps,
    renderCount: window.__v22.renderCount || 0
  };
})()`;
const tutMetrics = `(() => {
  const q = (sel) => document.querySelector(sel);
  const panel = q('.v23tutPanel');
  const r = panel ? panel.getBoundingClientRect() : null;
  return {
    state: window.__v23welcome.tutorialState(),
    open: !!q('#v23Tutorial.is-open'),
    overlayMarked: !!q('#v23Tutorial[data-qa-tut="1"]'),
    outsideScreen: !!q('body > #v23Tutorial') && !q('#screen #v23Tutorial'),
    titleStill: !!q('.titleScreen.v23w'),
    canvasMarked: !!q('#game[data-qa-canvas="1"]'),
    stepTitle: (q('#v23TutBody h2') || {}).textContent || null,
    kicker: (q('.v23tutKicker') || {}).textContent || null,
    progressText: (q('.v23tutProgressText') || {}).textContent || null,
    progressWidth: q('.v23tutProgressBar i') ? q('.v23tutProgressBar i').style.width : null,
    dots: document.querySelectorAll('.v23tutDot').length,
    activeDot: [...document.querySelectorAll('.v23tutDot')].findIndex(d => d.classList.contains('is-active')),
    prevDisabled: !!(q('[data-action="tutorial-prev"]') || {}).disabled,
    nextLabel: (q('[data-action="tutorial-next"]') || {}).textContent.trim(),
    panel: r ? { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom) } : null,
    panelFits: !!r && r.top >= -1 && r.bottom <= innerHeight + 1 && r.width <= innerWidth + 1,
    panelScrolls: panel ? (panel.scrollHeight > panel.clientHeight + 1) : null,
    focusedInside: !!(panel && panel.contains(document.activeElement)),
    renderCount: window.__v22.renderCount || 0,
    fps: window.__gameState().fps
  };
})()`;
function measureFps(s, seconds) {
  return s.ev(`new Promise(function (resolve) {
    var n = 0;
    var t0 = performance.now();
    function frame() {
      n += 1;
      var dt = performance.now() - t0;
      if (dt < ${Math.round((seconds || 1.6) * 1000)}) requestAnimationFrame(frame);
      else resolve({ fps: Math.round((n / (dt / 1000)) * 10) / 10, frames: n, ms: Math.round(dt) });
    }
    requestAnimationFrame(frame);
  })`, true);
}
async function press(s, code, key) {
  await s.send('Input.dispatchKeyEvent', { type: 'keyDown', code, key: key || code, windowsVirtualKeyCode: key === 'Escape' ? 27 : 0 });
  await s.send('Input.dispatchKeyEvent', { type: 'keyUp', code, key: key || code, windowsVirtualKeyCode: key === 'Escape' ? 27 : 0 });
  await sleep(260);
}
(async () => {
  const s = await open({ bundle: PREVIEW, port: 9544, width: 1280, height: 720, profile: path.join(ROOT, '.work', 'v2.3', 'qa', 'profiles', 'a4') });
  try {
    await s.seed(saveWith());
    await s.dismissBanners();
    await sleep(900);
    /* Marcadores de identidad */
    await s.ev(`(() => {
      const t = document.querySelector('.titleScreen'); if (t) t.setAttribute('data-qa-title', '1');
      const c = document.querySelector('#game'); if (c) c.setAttribute('data-qa-canvas', '1');
      return true;
    })()`);
    await s.ev(`window.__qaMut = 0; window.__qaObs = new MutationObserver(function (list) { window.__qaMut += list.length; }); window.__qaObs.observe(document.querySelector('#screen'), { childList: true, subtree: true, attributes: false, characterData: false }); true`);

    /* --- 1. Bienvenida en 7 tamaños --- */
    for (const [w, h] of SIZES) {
      await s.setViewport(w, h);
      await sleep(520);
      const key = w + 'x' + h;
      const m = await s.ev(titleMetrics);
      report.sizes[key] = m;
      await shot(s, 'welcome-' + key + '.png');
      record('WELCOME-' + key, m);
    }

    /* FPS de la bienvenida a 1280×720 */
    await s.setViewport(1280, 720);
    await sleep(600);
    const fpsTitle = await measureFps(s, 1.8);
    record('FPS-TITLE-1280x720', fpsTitle);

    /* --- 2. Tutorial manual desde «Cómo jugar» --- */
    await s.ev("document.querySelector('.v23wCta2').click()");
    await s.waitFor("!!document.querySelector('#v23Tutorial.is-open')", 4000);
    await sleep(420);
    await s.ev(`(() => { const t = document.querySelector('#v23Tutorial'); if (t) t.setAttribute('data-qa-tut', '1'); window.__qaMut = 0; return true; })()`);
    const t1 = await s.ev(tutMetrics);
    report.tutorialStep1 = t1;
    await shot(s, 'tutorial-step1-1280x720.png');
    record('TUT-STEP1', t1);
    const beforeRender = t1.renderCount;
    const steps = [];
    for (let i = 2; i <= 5; i += 1) {
      await s.ev("document.querySelector('[data-action=\"tutorial-next\"]').click()");
      await sleep(360);
      const m = await s.ev(tutMetrics);
      steps.push(m);
      await shot(s, 'tutorial-step' + i + '-1280x720.png');
      record('TUT-STEP' + i, m);
    }
    /* En el último paso «Siguiente» se convierte en «Terminar» */
    const lastStepBefore = await s.ev(`(() => ({ next: (document.querySelector('[data-action="tutorial-next"]') || {}).textContent.trim(), state: window.__v23welcome.tutorialState() }))()`);
    await s.ev("document.querySelector('[data-action=\"tutorial-next\"]').click()");
    await sleep(450);
    const after = await s.ev(`(() => ({
      state: window.__v23welcome.tutorialState(),
      open: !!document.querySelector('#v23Tutorial.is-open'),
      overlayMarked: !!document.querySelector('#v23Tutorial[data-qa-tut="1"]'),
      titleMarked: !!document.querySelector('.titleScreen[data-qa-title="1"]'),
      canvasMarked: !!document.querySelector('#game[data-qa-canvas="1"]'),
      mutations: window.__qaMut,
      renderCount: window.__v22.renderCount || 0,
      seenSaved: (() => { try { const raw = localStorage.getItem('serumsquest:voxel:settings:v1'); return raw ? !!JSON.parse(raw).tutorialSeen : null; } catch (e) { return null; } })(),
      lastNext: document.querySelector('[data-action="tutorial-next"]') ? document.querySelector('[data-action="tutorial-next"]').textContent.trim() : null
    }))()`);
    record('TUT-COMPLETE', { beforeRender, lastStepBefore, after, stepRenderDeltas: steps.map(x => x.renderCount - beforeRender), sameOverlay: after.overlayMarked, sameTitle: after.titleMarked, sameCanvas: after.canvasMarked });
    report.tutorialComplete = { beforeRender, lastStepBefore, after, steps };

    /* FPS del tutorial (reabrir) */
    await s.ev("document.querySelector('.v23wCta2').click()");
    await sleep(400);
    const fpsTut = await measureFps(s, 1.8);
    record('FPS-TUTORIAL-1280x720', fpsTut);
    await press(s, 'Escape', 'Escape');
    const escClosed = await s.ev('!document.querySelector("#v23Tutorial.is-open")');
    record('TUT-ESC-CLOSE', { closed: escClosed, titleStill: await s.ev('!!document.querySelector(".titleScreen.v23w")') });

    /* --- 3. Recarga: no reaparece una vez visto --- */
    await s.navigate(s.target);
    await sleep(1400);
    const afterReload = await s.ev(`(() => ({
      tutorialOpen: !!document.querySelector('#v23Tutorial.is-open'),
      tutorialSeen: window.__v23welcome.tutorialState().seenThisSession,
      savedSeen: (() => { try { const raw = localStorage.getItem('serumsquest:voxel:settings:v1'); return raw ? JSON.parse(raw).tutorialSeen : null; } catch (e) { return null; } })(),
      welcome: !!document.querySelector('.titleScreen.v23w'),
      storageBanner: !!document.querySelector('.storageBanner')
    }))()`);
    record('RELOAD-NO-AUTO-TUTORIAL', afterReload);
    await s.ev(`(() => { const t = document.querySelector('.titleScreen'); if (t) t.setAttribute('data-qa-title', '1'); const c = document.querySelector('#game'); if (c) c.setAttribute('data-qa-canvas', '1'); return true; })()`);

    /* --- 4. Tutorial en los 7 tamaños (paso 1) --- */
    const tutSizes = {};
    for (const [w, h] of SIZES) {
      await s.setViewport(w, h);
      await sleep(420);
      await s.ev("document.querySelector('.v23wCta2').click()");
      await s.waitFor("!!document.querySelector('#v23Tutorial.is-open')", 4000);
      await sleep(360);
      const m = await s.ev(tutMetrics);
      tutSizes[w + 'x' + h] = m;
      report.sizes[w + 'x' + h].tutorial = { panel: m.panel, panelFits: m.panelFits, panelScrolls: m.panelScrolls, prevDisabled: m.prevDisabled, progressText: m.progressText };
      await shot(s, 'tutorial-' + w + 'x' + h + '.png');
      record('TUTORIAL-' + w + 'x' + h, { panel: m.panel, fits: m.panelFits, scrolls: m.panelScrolls, title: m.stepTitle });
      await press(s, 'Escape', 'Escape');
      await sleep(200);
    }
    report.tutorialSizes = tutSizes;

    /* --- 5. Ayuda → tutorial; Esc vuelve a la ayuda --- */
    await s.setViewport(1280, 720);
    await sleep(500);
    await s.ev("document.querySelector('.v23wTool[data-action=\"open-help\"]').click()");
    await s.waitFor("!!document.querySelector('.v23HelpTutorial')", 5000);
    await sleep(300);
    const help = await s.ev(`(() => ({
      screen: window.__v22.screen(), help: !!document.querySelector('.v23HelpShell'),
      tutorialButton: !!document.querySelector('.v23HelpTutorial [data-action="open-tutorial"]'),
      closeButtons: document.querySelectorAll('.v23HelpShell [data-action="close-help"]').length
    }))()`);
    await shot(s, 'help-1280x720.png');
    await s.ev("document.querySelector('.v23HelpTutorial [data-action=\"open-tutorial\"]').click()");
    await sleep(420);
    const helpTut = await s.ev(tutMetrics);
    await press(s, 'Escape', 'Escape');
    await sleep(200);
    const backHelp = await s.ev(`(() => ({ screen: window.__v22.screen(), help: !!document.querySelector('.v23HelpShell'), tutorialOpen: !!document.querySelector('#v23Tutorial.is-open') }))()`);
    await s.ev("document.querySelector('.v23HelpShell [data-action=\"close-help\"]').click()");
    await sleep(500);
    const backTitle = await s.ev(`(() => ({ screen: window.__v22.screen(), welcome: !!document.querySelector('.titleScreen.v23w'), tutorialOpen: !!document.querySelector('#v23Tutorial.is-open') }))()`);
    record('HELP-FLOW', { help, helpTut: { title: helpTut.stepTitle, outsideScreen: helpTut.outsideScreen }, backHelp, backTitle });

    /* --- 5b. Ajustes → «Repetir tutorial»; Esc vuelve a Ajustes --- */
    await s.ev("document.querySelector('.v23wTool[data-action=\"open-settings\"]').click()");
    await s.waitFor("!!document.querySelector('.settingsPanel')", 5000);
    await sleep(350);
    const settingsBefore = await s.ev(`(() => ({ screen: window.__v22.screen(), repeat: !document.querySelector('.settingsPanel') ? false : [...document.querySelectorAll('[data-action="open-tutorial"]')].length }))()`);
    await s.ev("document.querySelector('.settingsPanel [data-action=\"open-tutorial\"]').click()");
    await sleep(450);
    const settingsTut = await s.ev(tutMetrics);
    await press(s, 'Escape', 'Escape');
    await sleep(250);
    const settingsAfter = await s.ev(`(() => ({ screen: window.__v22.screen(), settings: !!document.querySelector('.settingsPanel'), tutorialOpen: !!document.querySelector('#v23Tutorial.is-open') }))()`);
    await s.ev("document.querySelector('[data-action=\"close-settings\"]').click()");
    await sleep(650);
    const settingsBackTitle = await s.ev(`(() => ({ screen: window.__v22.screen(), welcome: !!document.querySelector('.titleScreen.v23w') }))()`);
    record('SETTINGS-TUTORIAL', { settingsBefore, tutorialTitle: settingsTut.stepTitle, returnScreen: settingsTut.state.returnScreen, settingsAfter, settingsBackTitle });

    /* --- 5c. Movimiento de reposo real (transform cambia sin tocar el renderer) --- */
    const motion = await s.ev(`new Promise(function (resolve) {
      var bg = document.querySelector('.v23wBg');
      var img = document.querySelector('.v23wFigure--front img');
      if (!bg || !img) return resolve(null);
      var b0 = getComputedStyle(bg).transform, i0 = getComputedStyle(img).transform;
      setTimeout(function () {
        resolve({ bgChanged: getComputedStyle(bg).transform !== b0, heroChanged: getComputedStyle(img).transform !== i0, bg0: b0, bg1: getComputedStyle(bg).transform, hero0: i0, hero1: getComputedStyle(img).transform });
      }, 900);
    })`, true);
    record('IDLE-MOTION', motion);

    /* --- 5d. Héroe equipado y partida importada en la bienvenida --- */
    const equippedSave = JSON.parse(JSON.stringify(SAVE));
    equippedSave.settings = Object.assign({}, equippedSave.settings, { tutorialSeen: true, backupReminder: false });
    equippedSave.importedAt = '2026-11-01T12:00:00.000Z';
    equippedSave.collection = Object.assign({}, equippedSave.collection, {
      equipped: {
        noa: { cabeza: 'c-cabeza-corona', torso: 'c-torso-manto', piernas: 'c-piernas-grebas', accesorios: 'c-accesorios-gafas', efectos: 'c-efecto-constelacion', marcos: 'c-marco-constelacion' }
      }
    });
    await s.seed(equippedSave);
    await sleep(1000);
    await s.dismissBanners();
    const imported = await s.ev(`(() => ({
      screen: window.__v22.screen(),
      importedPill: (document.querySelector('.v23wStat.is-teal') || {}).textContent || null,
      heroSrc: (document.querySelector('.v23wFigure--front img') || {}).src ? 'data-url' : null,
      heroPlaque: (document.querySelector('.v23wHeroTag') || {}).innerText || null,
      cta: (document.querySelector('.v23wCta') || {}).innerText.replace(/\\n/g, ' · '),
      stats: [...document.querySelectorAll('.v23wStat')].map(function (s) { return s.textContent.trim(); })
    }))()`);
    await shot(s, 'welcome-equipped-imported-1280x720.png');
    record('EQUIPPED-IMPORTED', imported);

    /* --- 5e. Duelo en pausa: CTA y pastilla --- */
    await s.seed(saveWith());
    await sleep(900);
    await s.ev("window.__v22.launchMission('mission-sp-1')");
    await s.waitFor("window.__v22.screen() === 'duel'", 8000);
    await sleep(600);
    await press(s, 'Escape', 'Escape');
    await s.waitFor("!!document.querySelector('.pauseGrid')", 5000);
    await sleep(300);
    await s.ev("document.querySelector('[data-action=\"suspend-duel-menu\"]').click()");
    await s.waitFor("window.__v22.screen() === 'title'", 6000);
    await sleep(700);
    const paused = await s.ev(`(() => ({
      screen: window.__v22.screen(),
      cta: (document.querySelector('.v23wCta') || {}).innerText.replace(/\\n/g, ' · '),
      pausedPill: (document.querySelector('.v23wStat.is-gold') || {}).textContent || null,
      img: !!document.querySelector('.v23wFigure--front img')
    }))()`);
    await shot(s, 'welcome-paused-duel-1280x720.png');
    record('PAUSED-DUEL', paused);
    await s.seed(saveWith());
    await s.dismissBanners();
    await sleep(800);
    await shot(s, 'title-after-help-1280x720.png');

    /* --- 6. Movimiento reducido: animaciones decorativas desactivadas --- */
    const reduced = await s.ev(`(() => {
      document.body.classList.add('reduced-motion');
      const img = document.querySelector('.v23wFigure img');
      const bg = document.querySelector('.v23wBg');
      const halo = document.querySelector('.v23wHalo');
      const tut = document.querySelector('#v23Tutorial');
      const a = img ? getComputedStyle(img).animationName : null;
      const b = bg ? getComputedStyle(bg).animationName : null;
      const c = halo ? getComputedStyle(halo, '::before').animationName : null;
      const d = tut ? getComputedStyle(tut).animationName : null;
      document.body.classList.remove('reduced-motion');
      return { figure: a, background: b, haloBefore: c, tutorial: d };
    })()`);
    record('REDUCED-MOTION', reduced);

    /* --- 7. Emulación táctil a 844×390: controles alcanzables --- */
    await s.send('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 2, mobile: true });
    await s.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await sleep(700);
    const touch = await s.ev(`(() => {
      const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height), top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right) }; };
      const cta = document.querySelector('.v23wCta'), cta2 = document.querySelector('.v23wCta2');
      return {
        coarse: matchMedia('(pointer: coarse)').matches,
        vw: innerWidth, vh: innerHeight,
        cta: r(cta), cta2: r(cta2), tool: r(document.querySelector('.v23wTool')), route: r(document.querySelector('.v23wRoute')), nav: r(document.querySelector('.v23wNavBtn')),
        docOverflowX: document.documentElement.scrollWidth - innerWidth,
        docOverflowY: document.documentElement.scrollHeight - innerHeight
      };
    })()`);
    await shot(s, 'welcome-touch-844x390.png');
    record('TOUCH-844x390', touch);
    await s.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await s.setViewport(1280, 720);
    await sleep(500);

    /* --- 8. Tarjetas de ruta abren el mapa del área --- */
    await s.ev("document.querySelector('.v23wRoute[data-area=\"area-psi-etica\"]').click()");
    await s.waitFor("window.__v22.screen() === 'map'", 6000);
    await sleep(900);
    const mapState = await s.ev(`(() => ({ screen: window.__v22.screen(), map: !!document.querySelector('.mapScreen'), welcome: !!document.querySelector('.titleScreen.v23w'), area: (document.querySelector('.mapRailHead small') || {}).textContent || null, routesOpened: window.__v23welcome.routeOpens() }))()`);
    await shot(s, 'route-ethics-map-1280x720.png');
    record('ROUTE-CARD-MAP', mapState);
    await s.ev("(() => { const b = document.querySelector('[data-action=\"map-close\"]'); if (b) b.click(); return true; })()");
    await sleep(900);
    const backFromMap = await s.ev(`(() => ({ screen: window.__v22.screen(), welcome: !!document.querySelector('.titleScreen.v23w') }))()`);
    record('MAP-CLOSE-TITLE', backFromMap);

    /* Errores de consola */
    report.errors = s.errors.slice(0, 30);
    record('CONSOLE-ERRORS', report.errors);
    report.finishedAt = new Date().toISOString();
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, 'qa-welcome.json'), JSON.stringify(report, null, 2));
    console.log('WROTE', path.join(OUT, 'qa-welcome.json'));
  } catch (e) {
    report.fatal = String(e && e.stack || e);
    console.error('FATAL', report.fatal);
    report.errors = s.errors.slice(0, 30);
    try { fs.writeFileSync(path.join(OUT, 'qa-welcome.json'), JSON.stringify(report, null, 2)); } catch (e2) {}
  } finally {
    await s.close();
  }
})();
