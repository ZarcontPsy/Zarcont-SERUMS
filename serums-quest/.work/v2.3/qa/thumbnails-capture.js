'use strict';
/* Regenera y captura miniaturas de tienda/inventario. Se ejecuta antes y
   después; el mismo guion y el mismo formato. */
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');

const MODE = process.argv.includes('--after') ? 'after' : 'before';
const EV = path.join(ROOT, '.work', 'v2.3', 'evidence');
const OUT = path.join(EV, 'thumbs-' + MODE);
const BUNDLE = path.join(ROOT, 'dist', 'index.html');
const KEYS = [
  'c-torso-bata', 'c-piernas-falda', 'c-torso-manto', 'c-peinado-mecha', 'c-cabeza-casco',
  'c-cabeza-diadema', 'c-accesorios-bolso', 'c-accesorios-brujula', 'x-cuaderno-orbital',
  'x-luciernaga-observatorio', 'x-trofeo-salud'
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await open({ port: 9585, profile: path.join(__dirname, 'profiles', 'thumbs-' + MODE), bundle: BUNDLE, width: 1308, height: 662 });
  const report = { mode: MODE, collections: {}, keys: {}, errors: [] };
  try {
    await h.seed(JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8')), { reload: true });
    await sleep(900);
    await h.ev("(() => { window.__v23Shop.openShop(); return true; })()");
    await sleep(900);
    for (const collection of ['originales', 'extras']) {
      await h.ev(`(() => { window.__v23Shop.filter('collection', ${JSON.stringify(collection)}); return true; })()`);
      await sleep(450);
      const max = await h.ev("(() => { const g=document.getElementById('shopGrid'); return g ? g.scrollHeight - g.clientHeight : 0; })()");
      for (let top = 0; top <= max + 200; top += 280) {
        await h.ev(`(() => { window.__v23Shop.scrollGrid(${top}); return true; })()`);
        await sleep(110);
      }
      await sleep(800);
      report.collections[collection] = await h.ev("window.__v23Shop.thumbs()");
    }
    /* Extrae las miniaturas clave directamente de las tarjetas del DOM. */
    await h.ev("(() => { window.__v23Shop.filter('collection', 'todos'); return true; })()");
    await sleep(500);
    for (const top of [0, 500, 1000, 1500, 2000, 2500, 3000]) {
      await h.ev(`(() => { window.__v23Shop.scrollGrid(${top}); return true; })()`);
      await sleep(100);
    }
    await sleep(600);
    const data = await h.ev(`(() => {
      const out = {};
      ${JSON.stringify(KEYS)}.forEach(function (id) {
        const card = document.querySelector('[data-cosmetic-thumb="' + id + '"]');
        const img = card ? card.querySelector('img') : null;
        out[id] = img ? img.src : '';
      });
      return { keys: out, thumbs: window.__v23Shop.thumbs(), counts: window.__v23Shop.counts() };
    })()`);
    Object.keys(data.keys).forEach((id) => {
      const src = data.keys[id];
      if (!src || src.indexOf('base64,') < 0) return;
      const file = path.join(OUT, id + '.png');
      fs.writeFileSync(file, Buffer.from(src.slice(src.indexOf('base64,') + 7), 'base64'));
      report.keys[id] = path.relative(ROOT, file);
    });
    report.thumbs = data.thumbs;
    report.counts = data.counts;
    await h.ev("(() => { window.__v23Shop.openWardrobe(); return true; })()");
    await sleep(900);
    report.wardrobe = await h.ev("window.__v23Shop.thumbs()");
    report.errors = h.errors;
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
    console.log(JSON.stringify({ mode: MODE, thumbs: report.thumbs, wardrobe: report.wardrobe, keys: Object.keys(report.keys).length, errors: h.errors.length }, null, 1));
  } finally { await h.close(); }
})().catch(e => { console.error(e); process.exit(1); });
