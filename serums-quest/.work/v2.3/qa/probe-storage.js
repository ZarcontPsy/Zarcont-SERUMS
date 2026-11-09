'use strict';
const path = require('path');
const { open, sleep, ROOT } = require('./cdp');
const preload = `(() => { try { Object.defineProperty(window, 'localStorage', { configurable: true, get: function(){ throw new Error('localStorage blocked by QA'); } }); } catch (e) {} })();`;
(async () => {
  const s = await open({ bundle: path.join(ROOT, '.work', 'v2.3', 'preview', 'core-check.html'), port: 9533, width: 1280, height: 720, preload });
  await sleep(1200);
  const out = await s.ev(`(() => ({
    screen: window.__v22 ? window.__v22.screen() : null,
    tutorial: !!document.querySelector('.tutorialShell'),
    recovery: !!document.querySelector('.recoveryShell'),
    storageBanner: !!document.querySelector('.storageBanner'),
    title: !!document.querySelector('.titleScreen'),
    text: document.body.innerText.slice(0, 220)
  }))()`);
  await s.shot(path.join(ROOT, '.work', 'v2.3', 'evidence', 'core-storage-blocked.png'));
  console.log(JSON.stringify(out, null, 2));
  console.log('errors', JSON.stringify((s.errors || []).slice(0, 8), null, 1));
  await s.close();
})();
