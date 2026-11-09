'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');
const OUT = path.resolve(__dirname, '..', 'evidence', 'spot');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await open({ port: 9589, profile: path.join(__dirname, 'profiles', 'spot'), bundle: path.join(ROOT, 'dist', 'index.html'), width: 1308, height: 662 });
  try {
    await h.seed(JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8')), { reload: true });
    await sleep(900);
    await h.ev("(() => { window.__v23Shop.openShop(); return true; })()");
    await sleep(900);
    await h.ev("(() => { window.__v23Shop.filter('collection', 'todos'); return true; })()");
    await sleep(400);
    const ids = ['c-torso-manto', 'x-capa-errorario', 'c-accesorios-brujula', 'c-accesorios-gafas', 'x-luciernaga-observatorio', 'x-buho-cometa', 'x-zorro-tinta', 'c-marco-constelacion', 'c-marco-platino', 'c-marco-vacio'];
    for (const id of ids) {
      await h.ev(`(() => { window.__v23Shop.select(${JSON.stringify(id)}); return true; })()`);
      await sleep(380);
      await h.shotClip('#shopPreviewMount canvas', path.join(OUT, id + '.png'), 2);
      const info = await h.ev("(() => { const i=window.__v23Visor.info(); return {id:i.pieceId,heroHeight:i.hero.height,visible:i.effect.visible,canvas:i.canvas}; })()");
      console.log(id, JSON.stringify(info));
    }
    console.log('errors', JSON.stringify(h.errors));
  } finally { await h.close(); }
})().catch(e => { console.error(e); process.exit(1); });
