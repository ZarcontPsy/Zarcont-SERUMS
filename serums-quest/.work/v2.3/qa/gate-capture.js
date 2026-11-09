'use strict';
/* Captura de la puerta de calidad: métricas de silueta, hojas de silueta y
   comparación estructural de efectos. Escribe en .work/v2.3/evidence/. */
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');

const EV = path.join(ROOT, '.work', 'v2.3', 'evidence');
const SIL = path.join(EV, 'silhouettes');
const DATA = path.join(EV, 'qa');
const BUNDLE = path.join(ROOT, 'dist', 'index.html');

function saveDataUrl(dataUrl, file) {
  if (!dataUrl || dataUrl.indexOf('base64,') < 0) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(dataUrl.slice(dataUrl.indexOf('base64,') + 7), 'base64'));
  return true;
}

(async () => {
  fs.mkdirSync(SIL, { recursive: true });
  fs.mkdirSync(DATA, { recursive: true });
  const h = await open({ port: 9584, profile: path.join(__dirname, 'profiles', 'gate-capture'), bundle: BUNDLE, width: 1280, height: 720 });
  try {
    await h.seed(JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8')), { reload: true });
    await sleep(1500);
    const all = await h.ev("window.__v23cGate ? window.__v23cGate.all().map(x => ({id:x.id,category:x.category,rarity:x.rarity,forms:x.forms,tones:x.tones,emissive:x.emissive,meshes:x.meshes,sprites:x.sprites,anims:x.anims,boxiness:x.boxiness,boxinessFront:x.boxinessFront,boxinessSide:x.boxinessSide,components:x.components,extrema:x.extrema,aspect:x.aspect,verdict:x.verdict,silhouette:x.silhouette,silhouetteSide:x.silhouetteSide,error:x.error})) : null", true);
    const clean = [];
    (all || []).forEach((p) => {
      const c = Object.assign({}, p);
      if (c.silhouette) { saveDataUrl(c.silhouette, path.join(SIL, p.id + '.png')); delete c.silhouette; }
      if (c.silhouetteSide) { saveDataUrl(c.silhouetteSide, path.join(SIL, p.id + '-side.png')); delete c.silhouetteSide; }
      clean.push(c);
    });
    const effectIds = ['c-efecto-aura', 'x-aura-amanecer', 'c-efecto-bruma', 'c-efecto-constelacion', 'c-efecto-chispas', 'x-estela-racha', 'x-arma-destello', 'x-arma-marea', 'x-arma-sello', 'x-arma-prisma', 'x-arma-orbita'];
    const effectSil = await h.ev(`(() => { const out = {}; ${JSON.stringify(effectIds)}.forEach(function(id){ try { out[id] = window.__v23cGate.renderPiece(id, 'front'); } catch(e) { out[id] = ''; } }); return out; })()`);
    Object.keys(effectSil || {}).forEach((id) => saveDataUrl(effectSil[id], path.join(SIL, 'effect-' + id + '.png')));
    const compare = await h.ev("window.__v23cGate.compareEffects()", true);
    fs.writeFileSync(path.join(DATA, 'gate.json'), JSON.stringify({ all: clean, compare }, null, 1));
    const fail = clean.filter((p) => !p.verdict || !p.verdict.pass);
    console.log('pieces', clean.length, 'pass', clean.length - fail.length, 'fail', fail.length, 'effectPass', compare && compare.pass, 'min', compare && compare.min, 'auraMin', compare && compare.auraMin);
    fail.slice(0, 20).forEach((p) => console.log(p.id, '->', p.verdict && p.verdict.reasons.join('|')));
    console.log('errors', JSON.stringify(h.errors));
    console.log('warnings', JSON.stringify(h.warnings.slice(0, 8)));
  } finally { await h.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
