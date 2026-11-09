'use strict';
/* QA de la Fase 2: matriz 69×10, efectos en 3 héroes con altura del héroe,
   FPS por calidad, miniaturas regeneradas, peso del HTML y errores. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');

const EV = path.join(ROOT, '.work', 'v2.3', 'evidence');
const QA = path.join(EV, 'qa');
const BUNDLE = path.join(ROOT, 'dist', 'index.html');
const HEROES = ['ilan', 'kian', 'noa'];
const EFFECTS = ['c-efecto-aura', 'x-aura-amanecer', 'c-efecto-bruma', 'c-efecto-constelacion', 'c-efecto-chispas', 'x-estela-racha', 'x-arma-destello', 'x-arma-marea', 'x-arma-sello', 'x-arma-prisma', 'x-arma-orbita'];
const KEYS = ['c-torso-bata', 'c-piernas-falda', 'c-torso-manto', 'c-peinado-mecha', 'c-cabeza-casco', 'c-cabeza-diadema', 'c-accesorios-bolso', 'c-accesorios-brujula', 'x-cuaderno-orbital', 'x-luciernaga-observatorio', 'x-trofeo-salud'];
function sha(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function size(file) { try { return fs.statSync(file).size; } catch (e) { return null; } }

(async () => {
  fs.mkdirSync(QA, { recursive: true });
  const report = { startedAt: new Date().toISOString(), effects: [], matrix: null, fps: {}, thumbnails: null, weight: null, errors: [], warnings: [], keyThumbs: {} };
  const h = await open({ port: 9586, profile: path.join(__dirname, 'profiles', 'phase2-qa'), bundle: BUNDLE, width: 1308, height: 662 });
  try {
    await h.seed(JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8')), { reload: true });
    await sleep(1200);
    report.matrix = await h.ev(`new Promise((resolve) => {
      window.__v23Anchors.matrixAsync({ chunk: 30 }).then(function (r) {
        resolve({ total: r.total, pass: r.pass, fail: r.fail, cases: r.cases ? r.cases.length : null, failures: (r.cases || []).filter(function(c){return c.status !== 'PASS';}).slice(0, 12) });
      }).catch(function (e) { resolve({ error: String(e && e.message || e) }); });
    })`, true);
    await h.ev("(() => { window.__v23Shop.openShop(); return true; })()");
    await sleep(900);
    await h.ev("(() => { window.__v23Shop.filter('collection', 'todos'); return true; })()");
    await sleep(400);
    for (const hero of HEROES) {
      await h.ev(`(() => { window.__v23Visor.hero(${JSON.stringify(hero)}); return true; })()`);
      await sleep(220);
      for (const id of EFFECTS) {
        await h.ev(`(() => { window.__v23Shop.select(${JSON.stringify(id)}); return true; })()`);
        await sleep(360);
        await h.ev("(() => { window.__v23Visor.measure(); return true; })()");
        await sleep(120);
        const row = await h.ev(`(() => { const i = window.__v23Visor.info(); const m = window.__v23Visor.measure(); return { hero: ${JSON.stringify(hero)}, id: ${JSON.stringify(id)}, pieceId: i.pieceId, category: i.category, heroHeight: i.hero && i.hero.height, heroProjected: i.hero && i.hero.projected, effect: i.effect, measure: m, rendererAlive: i.rendererAlive, canvasId: i.canvasId }; })()`);
        report.effects.push(row);
      }
    }
    for (const q of ['bajo', 'medio', 'alto']) {
      await h.ev(`(() => { window.__v23.setQuality(${JSON.stringify(q)}); window.__v23.openTitle(); return true; })()`);
      await sleep(600);
      report.fps['title-' + q] = await h.ev(`new Promise((resolve) => { const v=[]; let n=0; const t=setInterval(function(){ const f=window.__gameState && window.__gameState().fps; if (typeof f==='number') v.push(f); n++; if(n>=16){ clearInterval(t); v.sort(function(a,b){return a-b;}); resolve({min:v[0],median:v[Math.floor(v.length/2)],max:v[v.length-1]}); } }, 100); })`, true);
      await h.ev("(() => { window.__v23.openShop(); return true; })()");
      await sleep(600);
      report.fps['shop-' + q] = await h.ev(`new Promise((resolve) => { const v=[]; let n=0; const t=setInterval(function(){ const f=window.__gameState && window.__gameState().fps; if (typeof f==='number') v.push(f); n++; if(n>=16){ clearInterval(t); v.sort(function(a,b){return a-b;}); resolve({min:v[0],median:v[Math.floor(v.length/2)],max:v[v.length-1]}); } }, 100); })`, true);
    }
    /* Genera las 69 miniaturas y extrae las clave. */
    await h.ev("(() => { window.__v23Shop.filter('collection', 'todos'); return true; })()");
    for (const collection of ['originales', 'extras']) {
      await h.ev(`(() => { window.__v23Shop.filter('collection', ${JSON.stringify(collection)}); return true; })()`);
      await sleep(300);
      const max = await h.ev("(() => { const g=document.getElementById('shopGrid'); return g ? g.scrollHeight - g.clientHeight : 0; })()");
      for (let top = 0; top <= max + 200; top += 280) {
        await h.ev(`(() => { window.__v23Shop.scrollGrid(${top}); return true; })()`);
        await sleep(80);
      }
    }
    await sleep(900);
    report.thumbnails = await h.ev("window.__v23Shop.thumbs()");
    await h.ev("(() => { window.__v23Shop.filter('collection', 'todos'); return true; })()");
    for (const top of [0, 500, 1000, 1500, 2000, 2500, 3000]) { await h.ev(`(() => { window.__v23Shop.scrollGrid(${top}); return true; })()`); await sleep(80); }
    await sleep(400);
    const thumbs = await h.ev(`(() => { const out={}; ${JSON.stringify(KEYS)}.forEach(function(id){ const el=document.querySelector('[data-cosmetic-thumb="'+id+'"] img'); out[id]=el?el.src:''; }); return out; })()`);
    const beforeDir = path.join(EV, 'thumbs-before');
    const afterDir = path.join(EV, 'thumbs-after');
    fs.mkdirSync(afterDir, { recursive: true });
    Object.keys(thumbs).forEach((id) => {
      if (!thumbs[id] || thumbs[id].indexOf('base64,') < 0) return;
      const file = path.join(afterDir, id + '.png');
      fs.writeFileSync(file, Buffer.from(thumbs[id].slice(thumbs[id].indexOf('base64,') + 7), 'base64'));
      const before = path.join(beforeDir, id + '.png');
      report.keyThumbs[id] = { after: path.relative(ROOT, file), afterSha: sha(file), beforeSha: fs.existsSync(before) ? sha(before) : null, changed: fs.existsSync(before) ? sha(file) !== sha(before) : null };
    });
    report.weight = {
      dist: size(BUNDLE),
      game: size(path.join(ROOT, 'game.js')),
      baseline: 3812635,
      growth: size(BUNDLE) != null ? size(BUNDLE) - 3812635 : null,
      budget: 1200000,
      withinBudget: size(BUNDLE) != null ? (size(BUNDLE) - 3812635) <= 1200000 : null
    };
    report.errors = h.errors;
    report.warnings = h.warnings.slice(0, 12);
    fs.writeFileSync(path.join(QA, 'phase2-qa.json'), JSON.stringify(report, null, 1));
    const minHero = Math.min.apply(null, report.effects.map((e) => e.heroHeight || 0));
    console.log(JSON.stringify({
      matrix: report.matrix,
      effects: report.effects.length,
      minHeroHeight: minHero,
      effectsVisible: report.effects.filter((e) => e.effect && e.effect.visible).length,
      fps: report.fps,
      thumbnails: report.thumbnails,
      keyThumbs: Object.keys(report.keyThumbs).length,
      changedThumbs: Object.keys(report.keyThumbs).filter((k) => report.keyThumbs[k].changed).length,
      weight: report.weight,
      errors: report.errors.length
    }, null, 1));
  } finally { await h.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
