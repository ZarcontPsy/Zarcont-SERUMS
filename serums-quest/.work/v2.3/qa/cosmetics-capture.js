'use strict';
/* Captura comparativa de piezas en el visor de la tienda: Ilan, Kian y Noa ×
   las mismas piezas. Se ejecuta igual antes y después de la Fase 2; solo
   cambia el destino (--before / --after). */
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');

const MODE = process.argv.includes('--after') ? 'after' : 'before';
const OUT = path.join(ROOT, '.work', 'v2.3', 'evidence', MODE);
const BUNDLE = path.join(ROOT, 'dist', 'index.html');
const HEROES = ['ilan', 'kian', 'noa'];
const PIECES = [
  ['c-torso-bata', 'torso', 'Bata de evidencia'],
  ['c-piernas-falda', 'piernas', 'Falda de mapas'],
  ['c-torso-manto', 'torso', 'Manto de constelaciones'],
  ['c-peinado-mecha', 'peinado', 'Mecha violeta'],
  ['c-cabeza-casco', 'cabeza', 'Casco de vigía'],
  ['c-cabeza-diadema', 'cabeza', 'Diadema de circuitos'],
  ['c-accesorios-bolso', 'extras', 'Bolso de campo'],
  ['c-accesorios-brujula', 'accesorios', 'Brújula de muñeca'],
  ['x-cuaderno-orbital', 'extras', 'Cuaderno orbital'],
  ['x-luciernaga-observatorio', 'mascota', 'Luciérnaga del observatorio'],
  ['x-trofeo-salud', 'extras', 'Trofeo del Territorio']
];
const EFFECTS = [
  ['c-efecto-aura', 'Aura de alba'],
  ['x-aura-amanecer', 'Aura del amanecer'],
  ['c-efecto-bruma', 'Bruma de estudio'],
  ['c-efecto-constelacion', 'Constelación de logros'],
  ['c-efecto-chispas', 'Chispas de racha'],
  ['x-estela-racha', 'Estela de racha'],
  ['x-arma-destello', 'Destello del Territorio'],
  ['x-arma-marea', 'Marea del Cuidado'],
  ['x-arma-sello', 'Sello de la Confianza'],
  ['x-arma-prisma', 'Prisma de la Evidencia'],
  ['x-arma-orbita', 'Órbita del Sistema']
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await open({
    port: 9582,
    profile: path.join(__dirname, 'profiles', 'cosmetics-' + MODE),
    bundle: BUNDLE,
    width: 1308,
    height: 662
  });
  const report = { mode: MODE, startedAt: new Date().toISOString(), pieces: [], effects: [], errors: [], warnings: [] };
  try {
    await h.seed(JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8')), { reload: true });
    await sleep(900);
    await h.ev("(() => { window.__v23Shop.openShop(); return true; })()");
    await sleep(1100);
    await h.ev("(() => { window.__v23Shop.filter('collection', 'todos'); return true; })()");
    await sleep(700);
    for (const hero of HEROES) {
      await h.ev(`(() => { window.__v23Visor.hero(${JSON.stringify(hero)}); return true; })()`);
      await sleep(320);
      for (const [id, slot, label] of PIECES) {
        await h.ev(`(() => { window.__v23Shop.select(${JSON.stringify(id)}); return true; })()`);
        await sleep(420);
        const file = path.join(OUT, 'pieza-' + hero + '-' + id + '.png');
        await h.shotClip('#shopPreviewMount canvas', file, 2);
        const info = await h.ev("(() => { const i = window.__v23Visor.info(); return { heroId: i.heroId, pieceId: i.pieceId, category: i.category, canvas: i.canvas, heroHeight: i.hero && i.hero.height, effect: i.effect && { visible: i.effect.visible, projected: i.effect.projected } }; })()");
        report.pieces.push({ hero, id, slot, label, file: path.relative(ROOT, file), info });
      }
    }
    for (const hero of HEROES) {
      await h.ev(`(() => { window.__v23Visor.hero(${JSON.stringify(hero)}); return true; })()`);
      await sleep(320);
      for (const [id, label] of EFFECTS) {
        await h.ev(`(() => { window.__v23Shop.select(${JSON.stringify(id)}); return true; })()`);
        await sleep(430);
        await h.ev('(() => { window.__v23Visor.measure(); return true; })()');
        await sleep(140);
        const file = path.join(OUT, 'efecto-' + hero + '-' + id + '.png');
        await h.shotClip('#shopPreviewMount canvas', file, 2);
        const info = await h.ev("(() => { const i = window.__v23Visor.info(); return { heroId: i.heroId, pieceId: i.pieceId, category: i.category, canvas: i.canvas, heroHeight: i.hero && i.hero.height, effect: i.effect && { visible: i.effect.visible, projected: i.effect.projected, measured: i.effect.measured } }; })()");
        report.effects.push({ hero, id, label, file: path.relative(ROOT, file), info });
      }
    }
    report.errors = h.errors.slice();
    report.warnings = h.warnings.slice(0, 10);
    fs.writeFileSync(path.join(OUT, 'capture.json'), JSON.stringify(report, null, 1));
    console.log('pieces', report.pieces.length, 'effects', report.effects.length, 'errors', report.errors.length);
  } finally { await h.close(); }
})().catch(e => { console.error(e); process.exit(1); });
