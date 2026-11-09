'use strict';
const cdp = require('../../qa/cdp.js');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const save = JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'agents', 'agent1', 'save-agent1.json'), 'utf8'));
(async () => {
  const b = await cdp.open({
    port: 9541,
    profile: path.join(ROOT, '.work', 'v2.3', 'qa', 'profiles', 'p9541'),
    bundle: path.join(ROOT, '.work', 'v2.3', 'preview', 'a1.html'),
    width: 1280, height: 720
  });
  await b.seed(save);
  await b.dismissBanners();
  await cdp.sleep(800);
  const out = await b.ev(`(() => ({
    ready: window.__v23Anchors.ready,
    api: Object.keys(window.__v23Anchors).sort(),
    stats: window.__v23Anchors.stats(),
    fitAll: window.__v22.fitAllHeroes(),
    thumbs: window.__v22.thumbs(),
    screen: window.__v22.screen(),
    hud: window.__gameState ? null : 'sin-game-state'
  }))()`);
  console.log(JSON.stringify(out, null, 1));
  console.log('CDP errors', JSON.stringify(b.errors.slice(0, 8)));
  console.log('CDP warnings', JSON.stringify(b.warnings.slice(0, 5)));
  await b.shot(path.join(ROOT, '.work', 'v2.3', 'agents', 'agent1', 'final-hub.png'));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
