'use strict';
/* Agente 4 · smoke: bienvenida y tutorial en un solo tamaño. No toca el juego. */
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../qa/cdp.js');
const SAVE = JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2', 'qa', 'save-full.json'), 'utf8'));
const OUT = path.join(ROOT, '.work', 'v2.3', 'agents', 'agent4', 'evidence');
const PREVIEW = path.join(ROOT, '.work', 'v2.3', 'preview', 'a4.html');
function saveWith(patch) {
  const base = JSON.parse(JSON.stringify(SAVE));
  base.settings = Object.assign({}, base.settings, { tutorialSeen: true, backupReminder: false }, patch || {});
  return base;
}
(async () => {
  const s = await open({ bundle: PREVIEW, port: 9544, width: 1280, height: 720, profile: path.join(ROOT, '.work', 'v2.3', 'qa', 'profiles', 'a4') });
  try {
    await s.seed(saveWith());
    await s.dismissBanners();
    await sleep(900);
    await s.shot(path.join(OUT, 'smoke-welcome-1280x720.png'));
    const title = await s.ev(`(() => ({
      screen: window.__v22.screen(),
      hasWelcome: !!document.querySelector('.titleScreen.v23w'),
      welcomeOnTop: !!document.querySelector('.v23wCta'),
      heroImgs: document.querySelectorAll('.v23wFigure img').length,
      imgsLoaded: [...document.querySelectorAll('.v23wFigure img')].map(i => i.naturalWidth),
      nav: [...document.querySelectorAll('.v23wNavBtn')].map(b => b.textContent.trim()),
      routes: [...document.querySelectorAll('.v23wRoute')].map(b => b.textContent.trim()),
      cta: (document.querySelector('.v23wCta') || {}).innerText,
      tools: [...document.querySelectorAll('.v23wTool')].map(b => b.getAttribute('aria-label')),
      viewport: { w: innerWidth, h: innerHeight },
      docOverflow: document.documentElement.scrollWidth - innerWidth,
      shell: (() => { const r = document.querySelector('.v23wShell').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, bottom: r.bottom }; })(),
      render: window.__v22.renderCount || 0,
      fps: window.__gameState().fps
    }))()`);
    console.log('TITLE', JSON.stringify(title, null, 2));

    await s.ev("document.querySelector('[data-action=\"open-tutorial\"]').click()");
    await sleep(500);
    await s.shot(path.join(OUT, 'smoke-tutorial-1280x720.png'));
    const tut = await s.ev(`(() => ({
      active: window.__v23welcome.tutorialState(),
      overlay: !!document.querySelector('#v23Tutorial.is-open'),
      overlayInScreen: !!document.querySelector('#screen #v23Tutorial'),
      titleStill: !!document.querySelector('.titleScreen.v23w'),
      render: window.__v22.renderCount || 0,
      title: (document.querySelector('#v23TutBody h2') || {}).textContent,
      panel: (() => { const r = document.querySelector('.v23tutPanel').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom) }; })()
    }))()`);
    console.log('TUT', JSON.stringify(tut, null, 2));
    await s.ev("document.querySelector('[data-action=\"tutorial-next\"]').click()");
    await sleep(350);
    await s.shot(path.join(OUT, 'smoke-tutorial2-1280x720.png'));
    const tut2 = await s.ev(`(() => ({
      state: window.__v23welcome.tutorialState(),
      sameNode: window.__v23welcome.tutorialNode() === document.querySelector('#v23Tutorial'),
      title: (document.querySelector('#v23TutBody h2') || {}).textContent,
      render: window.__v22.renderCount || 0,
      titleStill: !!document.querySelector('.titleScreen.v23w')
    }))()`);
    console.log('TUT2', JSON.stringify(tut2, null, 2));
    console.log('ERRORS', JSON.stringify(s.errors.slice(0, 10), null, 2));
    console.log('WARNINGS', JSON.stringify(s.warnings.slice(0, 10), null, 2));
  } catch (e) {
    console.error('FATAL', e && e.stack || e);
    console.log('ERRORS', JSON.stringify(s.errors.slice(0, 10), null, 2));
  } finally {
    await s.close();
  }
})();
