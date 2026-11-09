'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');
const OUT = path.resolve(__dirname, '..', 'evidence', 'after');
(async () => {
  const h = await open({ port: 9591, profile: path.join(__dirname, 'profiles', 'two'), bundle: path.join(ROOT, 'dist', 'index.html'), width: 1308, height: 662 });
  try {
    await h.seed(JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8')), { reload: true });
    await sleep(900);
    await h.ev("(() => { window.__v23Shop.openShop(); return true; })()");
    await sleep(900);
    await h.ev("(() => { window.__v23Shop.filter('collection', 'todos'); window.__v23Visor.hero('noa'); return true; })()");
    await sleep(400);
    for (const id of ['c-cabeza-gorro', 'c-cabeza-corona']) {
      await h.ev(`(() => { window.__v23Shop.select(${JSON.stringify(id)}); return true; })()`);
      await sleep(500);
      await h.shotClip('#shopPreviewMount canvas', path.join(OUT, 'pieza-noa-' + id + '.png'), 2);
      console.log(id, await h.ev("window.__v23Visor.info().hero.height"));
    }
    console.log('errors', h.errors.length);
  } finally { await h.close(); }
})().catch(e => { console.error(e); process.exit(1); });
