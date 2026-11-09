'use strict';
/* Regresión de la Fase 1B sobre los sistemas ya corregidos: matriz 69×10,
   catálogo de tienda a 1308×662 y visor/canvas único. */
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');
const DATA = path.resolve(__dirname, '..', 'evidence', 'data');
const SAVE = path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json');

(async () => {
  const h = await open({ port: 9580, profile: path.join(__dirname, 'profiles', 'regression'), bundle: path.join(ROOT, 'dist', 'index.html'), width: 1308, height: 662 });
  const out = { startedAt: new Date().toISOString() };
  try {
    await h.seed(JSON.parse(fs.readFileSync(SAVE, 'utf8')), { reload: true });
    await sleep(1200);
    out.matrix = await h.ev(`new Promise((resolve) => {
      window.__v23Anchors.matrixAsync({ chunk: 30 }).then(function (r) {
        resolve({ total: r.total, pass: r.pass, fail: r.fail, cases: r.cases ? r.cases.length : null });
      }).catch(function (e) { resolve({ error: String(e && e.message || e) }); });
    })`, true);
    out.anchorsBefore = await h.ev('window.__v23Anchors.stats()');
    out.catalog = await h.ev(`(() => {
      window.__v23.openShop();
      const total = document.querySelectorAll('#v23ShopGrid .cosmeticCard').length || document.querySelectorAll('#shopGrid .cosmeticCard').length;
      const visible = window.__v23.visibleCards();
      const canvas = window.__v23.previewCanvas();
      return { total, visible, canvas };
    })()`);
    await sleep(700);
    out.catalogAfter = await h.ev(`(() => ({ total: document.querySelectorAll('#v23ShopGrid .cosmeticCard').length || document.querySelectorAll('#shopGrid .cosmeticCard').length, visible: window.__v23.visibleCards(), screen: window.__v23.screen(), canvas: window.__v23.previewCanvas() }))()`);
    out.errors = h.errors;
    out.warnings = h.warnings.slice(0, 10);
    fs.mkdirSync(DATA, { recursive: true });
    fs.writeFileSync(path.join(DATA, 'regression-1b.json'), JSON.stringify(out, null, 1));
    console.log(JSON.stringify({ matrix: out.matrix, catalog: out.catalogAfter, errors: out.errors.length, warnings: out.warnings.length }, null, 1));
  } finally { await h.close(); }
})().catch(e => { console.error(e); process.exit(1); });
