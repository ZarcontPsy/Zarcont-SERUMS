'use strict';
/* Línea base V2.2: bienvenida/tutorial, tienda y visor. No modifica el juego. */
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('./cdp');
const EVID = path.join(ROOT, '.work', 'v2.3', 'evidence');
const SAVE = JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2', 'qa', 'save-full.json'), 'utf8'));
const OUT = path.join(ROOT, '.work', 'v2.3', 'qa', 'baseline.json');
const result = { startedAt: new Date().toISOString(), cases: [], shots: [], errors: [] };
function saveWith(patch) {
  return Object.assign(JSON.parse(JSON.stringify(SAVE)), patch || {});
}
function record(id, detail, data) {
  result.cases.push({ id, detail, data: data || null, at: new Date().toISOString() });
  console.log('[' + id + '] ' + detail + (data ? ' :: ' + JSON.stringify(data).slice(0, 800) : ''));
}
async function titleShot(s, name) {
  const file = path.join(EVID, 'base-' + name + '.png');
  await s.shot(file);
  result.shots.push(file);
}
(async () => {
  const s = await open({ bundle: path.join(ROOT, '.work', 'v2.3', 'preview', 'base.html'), port: 9531, width: 1280, height: 720 });
  try {
    await s.seed(saveWith({ settings: Object.assign({}, SAVE.settings, { tutorialSeen: true, backupReminder: false }) }));
    await s.dismissBanners();
    await sleep(700);
    await titleShot(s, 'title-1280x720');
    const title = await s.ev(`(() => ({
      screen: window.__v22 && window.__v22.screen ? window.__v22.screen() : null,
      titleVisible: !!document.querySelector('.titleScreen'),
      titleChars: document.querySelectorAll('.titleHeroImg').length,
      buttons: [...document.querySelectorAll('.titleScreen button')].map(b => (b.textContent || '').trim()).slice(0, 20),
      canvas: !!document.querySelector('#game'),
      storageBanner: !!document.querySelector('.storageBanner'),
      welcomeText: (document.querySelector('.titleLead') || {}).textContent || ''
    }))()`);
    record('BASE-TITLE', 'Bienvenida V2.2', title);

    /* Tutorial con almacenamiento permitido */
    await s.seed(saveWith({ settings: Object.assign({}, SAVE.settings, { tutorialSeen: false, backupReminder: false }) }));
    await s.waitFor("!!document.querySelector('.tutorialShell')", 8000);
    await s.ev("(() => { document.querySelector('#screen').setAttribute('data-qa-screen','1'); const ov=document.querySelector('.overlayShell'); if(ov) ov.setAttribute('data-qa-overlay','1'); const cv=document.querySelector('#game'); if(cv) cv.setAttribute('data-qa-canvas','1'); return true; })()");
    await titleShot(s, 'tutorial-step1-allowed');
    const before = await s.ev(`(() => ({
      screen: window.__v22.screen(), marker: !!document.querySelector('.overlayShell[data-qa-overlay="1"]'),
      screenMarker: !!document.querySelector('#screen[data-qa-screen="1"]'), canvasMarker: !!document.querySelector('#game[data-qa-canvas="1"]'),
      render: window.__v22.renderCount || 0, title: !!document.querySelector('.titleScreen'), step: (document.querySelector('.tutorialBody .eyebrow') || {}).textContent || '',
      overlayClass: (document.querySelector('.overlayShell') || {}).className || ''
    }))()`);
    await s.click('[data-action="tutorial-next"]', 700);
    await titleShot(s, 'tutorial-step2-allowed');
    const after = await s.ev(`(() => ({
      screen: window.__v22.screen(), marker: !!document.querySelector('.overlayShell[data-qa-overlay="1"]'),
      screenMarker: !!document.querySelector('#screen[data-qa-screen="1"]'), canvasMarker: !!document.querySelector('#game[data-qa-canvas="1"]'),
      render: window.__v22.renderCount || 0, title: !!document.querySelector('.titleScreen'), step: (document.querySelector('.tutorialBody .eyebrow') || {}).textContent || '',
      overlayClass: (document.querySelector('.overlayShell') || {}).className || ''
    }))()`);
    record('BASE-TUTORIAL-ALLOWED', 'Avance de paso con almacenamiento permitido', { before, after, overlayRemounted: !after.marker, renderDelta: after.render - before.render, titleVisibleBefore: before.title });
    await s.click('[data-action="tutorial-skip"]', 900);

    /* Tienda a 1308x662 */
    await s.setViewport(1308, 662);
    await s.ev('window.__v22.openShop()');
    await s.waitFor("!!document.querySelector('.shopShell')", 8000);
    await sleep(1200);
    const shop = await s.ev(`(() => {
      const grid = document.querySelector('#shopGrid');
      const cards = [...document.querySelectorAll('#shopGrid .cosmeticCard')];
      const gr = grid ? grid.getBoundingClientRect() : null;
      const visible = cards.filter(c => { const r=c.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0; }).length;
      const thumbs = document.querySelectorAll('#shopGrid .cosmeticCardThumb img').length;
      const shell = document.querySelector('.shopShell');
      const head = document.querySelector('.v22SheetHead');
      return { total: cards.length, visible, thumbs, grid: gr ? { x:Math.round(gr.x), y:Math.round(gr.y), w:Math.round(gr.width), h:Math.round(gr.height), scrollH:grid.scrollHeight } : null,
        shell: shell ? { w:Math.round(shell.getBoundingClientRect().width), h:Math.round(shell.getBoundingClientRect().height) } : null,
        headH: head ? Math.round(head.getBoundingClientRect().height) : null,
        canvas: !!document.querySelector('#shopPreviewMount canvas'),
        canvasBox: (() => { const c=document.querySelector('#shopPreviewMount canvas'); if(!c) return null; const r=c.getBoundingClientRect(); return { w:Math.round(r.width), h:Math.round(r.height) }; })(),
        hasSearch: !!document.querySelector('#shopSearch'), hasSort: !!document.querySelector('[data-v22-shop-sort]') };
    })()`);
    record('BASE-SHOP-1308x662', 'Tienda V2.2 a 1308×662', shop);
    await titleShot(s, 'shop-1308x662');

    /* Efecto en el visor de tienda */
    await s.ev(`(() => { const c=document.querySelector('#shopGrid .cosmeticCard[data-id="c-efecto-aura"]'); if(c) c.click(); return !!c; })()`);
    await sleep(1000);
    const effect = await s.ev(`(() => {
      const c=document.querySelector('#shopPreviewMount canvas');
      const d=document.querySelector('#shopDetailBody h3');
      let ink=null;
      try { const ctx=c.getContext('webgl2')||c.getContext('webgl'); if(ctx){ ink = { draw: ctx.getParameter(ctx.CURRENT_PROGRAM) ? true : false, err: ctx.getError() }; } } catch(e) { ink=String(e); }
      return { selected: d ? d.textContent : null, canvas: c ? {w:Math.round(c.getBoundingClientRect().width),h:Math.round(c.getBoundingClientRect().height)} : null, ink };
    })()`);
    record('BASE-SHOP-EFFECT', 'Efecto Aura de alba en visor V2.2', effect);
    await titleShot(s, 'shop-effect-1308x662');
    result.errors = s.errors.slice(0, 20);
  } catch (e) {
    result.fatal = String(e && e.stack || e);
    console.error(result.fatal);
  } finally {
    await s.close();
  }

  /* Almacenamiento bloqueado */
  const preload = `(() => { try { Object.defineProperty(window, 'localStorage', { configurable: true, get: function(){ throw new Error('localStorage blocked by QA'); } }); } catch (e) {} })();`;
  let b = null;
  try {
    b = await open({ bundle: path.join(ROOT, '.work', 'v2.3', 'preview', 'base.html'), port: 9532, width: 1280, height: 720, preload });
    await b.waitFor("!!document.querySelector('.tutorialShell')", 9000);
    await b.ev("(() => { const ov=document.querySelector('.overlayShell'); if(ov) ov.setAttribute('data-qa-overlay','1'); return true; })()");
    const before = await b.ev(`(() => ({ storageBanner: !!document.querySelector('.storageBanner'), screen: window.__v22.screen(), marker: !!document.querySelector('.overlayShell[data-qa-overlay="1"]'), title: !!document.querySelector('.titleScreen') }))()`);
    await b.shot(path.join(EVID, 'base-tutorial-step1-blocked.png')); result.shots.push(path.join(EVID, 'base-tutorial-step1-blocked.png'));
    await b.click('[data-action="tutorial-next"]', 700);
    const after = await b.ev(`(() => ({ storageBanner: !!document.querySelector('.storageBanner'), screen: window.__v22.screen(), marker: !!document.querySelector('.overlayShell[data-qa-overlay="1"]'), title: !!document.querySelector('.titleScreen') }))()`);
    await b.shot(path.join(EVID, 'base-tutorial-step2-blocked.png')); result.shots.push(path.join(EVID, 'base-tutorial-step2-blocked.png'));
    record('BASE-TUTORIAL-BLOCKED', 'Avance con almacenamiento bloqueado', { before, after, overlayRemounted: !after.marker });
    result.errors = (result.errors || []).concat((b.errors || []).slice(0, 20));
  } catch (e) {
    result.blockedFatal = String(e && e.stack || e);
    console.error(result.blockedFatal);
  } finally { if (b) await b.close(); }

  result.finishedAt = new Date().toISOString();
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
  console.log('WROTE', OUT);
})();
