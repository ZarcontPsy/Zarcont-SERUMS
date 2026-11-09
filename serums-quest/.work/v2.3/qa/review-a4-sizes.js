'use strict';
const path = require('path');
const { open, sleep, ROOT } = require('./cdp');
const all = JSON.parse(require('fs').readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8'));
const tutorial = JSON.parse(require('fs').readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-tutorial.json'), 'utf8'));
const SIZES = [[640, 360], [844, 390], [1024, 600], [1308, 662], [768, 1024], [1280, 720], [1920, 1080]];
(async () => {
  const s = await open({ bundle: path.join(ROOT, '.work', 'v2.3', 'preview', 'a4-our.html'), port: 9536, width: 1280, height: 720 });
  const out = [];
  try {
    await s.seed(all);
    for (const [w, h] of SIZES) {
      await s.setViewport(w, h);
      await sleep(450);
      const m = await s.ev(`(() => {
        const q = (sel) => document.querySelector(sel);
        const r = (el) => el ? el.getBoundingClientRect() : null;
        const stage = q('.v23wStage'), copy = q('.v23wCopy'), routes = q('.v23wRoutes'), dock = q('.v23wDock');
        return {
          title: !!q('.v23w'), overflowX: document.documentElement.scrollWidth - innerWidth, overflowY: document.documentElement.scrollHeight - innerHeight,
          stage: r(stage) ? [Math.round(r(stage).width), Math.round(r(stage).height)] : null,
          copy: r(copy) ? [Math.round(r(copy).width), Math.round(r(copy).height)] : null,
          routes: q('.v23wRoutes') ? document.querySelectorAll('.v23wRoute').length : 0,
          routeLabels: [...document.querySelectorAll('.v23wRoute b')].map(x => x.textContent),
          buttons: [...document.querySelectorAll('.v23wCta, .v23wCta2')].map(b => ({ text: (b.textContent || '').trim().slice(0, 30), w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height) })),
          topNav: getComputedStyle(q('.v23wNav')).display,
          dockVisible: dock ? dock.getBoundingClientRect().height > 0 : false,
          fontTitle: getComputedStyle(q('.v23wLogo')).fontSize
        };
      })()`);
      out.push({ size: w + 'x' + h, ...m });
      await s.shot(path.join(ROOT, '.work', 'v2.3', 'evidence', 'review-a4-' + w + 'x' + h + '.png'));
    }
    await s.seed(tutorial);
    await s.waitFor("window.__v23welcome && window.__v23welcome.tutorialState().active", 9000);
    for (const [w, h] of SIZES) {
      await s.setViewport(w, h);
      await sleep(350);
      const m = await s.ev(`(() => { const p=document.querySelector('.v23tutPanel'); const r=p?p.getBoundingClientRect():null; return { panel: r?[Math.round(r.width),Math.round(r.height)]:null, overflowY: document.documentElement.scrollHeight-innerHeight, bodyScroll: document.querySelector('.v23tutBody') ? document.querySelector('.v23tutBody').scrollHeight > document.querySelector('.v23tutBody').clientHeight+2 : null, footVisible: (() => { const f=document.querySelector('.v23tutFoot'); if(!f) return false; const rr=f.getBoundingClientRect(); return rr.bottom <= innerHeight+2 && rr.top>=0; })() }; })()`);
      out.push({ size: w + 'x' + h, tutorial: m });
      await s.shot(path.join(ROOT, '.work', 'v2.3', 'evidence', 'review-a4-tut-' + w + 'x' + h + '.png'));
    }
  } catch (e) { console.error(e); }
  console.log(JSON.stringify(out, null, 2));
  await s.close();
})();
