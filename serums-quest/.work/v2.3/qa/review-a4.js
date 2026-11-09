'use strict';
const path = require('path');
const { open, sleep, ROOT } = require('./cdp');
const all = JSON.parse(require('fs').readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8'));
const tutorial = JSON.parse(require('fs').readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-tutorial.json'), 'utf8'));
(async () => {
  const s = await open({ bundle: path.join(ROOT, '.work', 'v2.3', 'preview', 'a4-our.html'), port: 9535, width: 1280, height: 720 });
  await s.seed(all);
  await sleep(1000);
  await s.shot(path.join(ROOT, '.work', 'v2.3', 'evidence', 'review-a4-title-1280.png'));
  const title = await s.ev(`(() => ({
    node: !!document.querySelector('.v23w'), paints: window.__v23welcome && window.__v23welcome.titlePaints(),
    buttons: [...document.querySelectorAll('.v23w button')].map(b => (b.textContent || '').trim()).filter(Boolean).slice(0, 20),
    routes: document.querySelectorAll('.v23wRoute').length,
    figures: document.querySelectorAll('.v23wFigure').length,
    overflow: document.documentElement.scrollWidth - innerWidth
  }))()`);
  console.log('TITLE', JSON.stringify(title, null, 2));
  await s.seed(tutorial);
  await sleep(1200);
  await s.shot(path.join(ROOT, '.work', 'v2.3', 'evidence', 'review-a4-tutorial-1.png'));
  await s.ev("(() => { const n=window.__v23welcome.tutorialNode(); n.querySelector('.v23tutPanel').setAttribute('data-qa-node','1'); document.querySelector('.v23w').setAttribute('data-qa-title','1'); document.querySelector('#game').setAttribute('data-qa-canvas','1'); return true; })()");
  const before = await s.ev(`(() => ({ active: window.__v23welcome.tutorialState(), samePanel: !!document.querySelector('.v23tutPanel[data-qa-node="1"]'), hasTitle: !!document.querySelector('.v23w[data-qa-title="1"]'), sameCanvas: !!document.querySelector('#game[data-qa-canvas="1"]'), screens: window.__v22.renderCount }))()`);
  await s.click('[data-action="tutorial-next"]', 700);
  await s.shot(path.join(ROOT, '.work', 'v2.3', 'evidence', 'review-a4-tutorial-2.png'));
  const after = await s.ev(`(() => ({ active: window.__v23welcome.tutorialState(), samePanel: !!document.querySelector('.v23tutPanel[data-qa-node="1"]'), hasTitle: !!document.querySelector('.v23w[data-qa-title="1"]'), sameCanvas: !!document.querySelector('#game[data-qa-canvas="1"]'), screens: window.__v22.renderCount }))()`);
  console.log('TUT', JSON.stringify({ before, after }, null, 2));
  console.log('errors', JSON.stringify((s.errors || []).slice(0, 6), null, 1));
  await s.close();
})();
