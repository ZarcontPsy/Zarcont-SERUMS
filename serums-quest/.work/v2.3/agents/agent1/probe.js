'use strict';
/* Sonda del Agente 1: estado real de héroes/cosméticos y capturas base.
   No modifica el juego: solo lo abre, prueba y captura. */
const fs = require('fs');
const path = require('path');
const cdp = require('../../qa/cdp.js');

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const OUT = __dirname;
const save = JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8'));

(async () => {
  const b = await cdp.open({
    port: 9541,
    profile: path.join(ROOT, '.work', 'v2.3', 'qa', 'profiles', 'p9541'),
    bundle: path.join(ROOT, '.work', 'v2.3', 'preview', 'a1.html'),
    width: 1280, height: 720
  });
  try {
    await b.seed(save);
    await b.dismissBanners();
    const info = await b.ev(`(() => {
      const out = {};
      out.screen = window.__v22.screen();
      out.thumbs = window.__v22.thumbs();
      out.fitAll = window.__v22.fitAllHeroes();
      out.state = (() => { try { const s = window.__v22.lastResult(); return { equipped: JSON.parse(JSON.stringify(window.__gameState().screen)), }; } catch (e) { return String(e); } })();
      out.sig = window.__v22.cosmeticSignatures().slice(0, 3);
      return out;
    })()`);
    console.log('info', JSON.stringify(info).slice(0, 1200));

    await b.ev(`window.__v22.openWardrobe()`);
    await b.waitFor("!!document.querySelector('#wardrobePreviewMount canvas')", 8000);
    await cdp.sleep(1200);
    await b.shotClip('#wardrobePreviewMount', path.join(OUT, 'probe-wardrobe-noa.png'), 1);
    await b.shot(path.join(OUT, 'probe-wardrobe-full.png'));

    // Cambiar a Ilan en el inventario y ver si conserva su atuendo.
    const tabs = await b.ev(`Array.from(document.querySelectorAll('.miniHeroTab')).map(x => x.getAttribute('data-hero'))`);
    console.log('heroTabs', tabs);
    await b.click('.miniHeroTab[data-hero="ilan"]', 900);
    await b.shotClip('#wardrobePreviewMount', path.join(OUT, 'probe-wardrobe-ilan.png'), 1);
    const equipped = await b.ev(`(() => { try { return JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')).collection.equipped; } catch (e) { return String(e); } })()`);
    console.log('equipped', JSON.stringify(equipped));

    // Probar una pieza de cada ranura en el visor: seleccionar Ilan y equipar cabeza.
    const test = await b.ev(`(() => {
      const out = {};
      try {
        const c = window.COSMETIC_BY_ID ? null : null;
      } catch (e) {}
      return out;
    })()`);
    console.log('test', JSON.stringify(test));
    console.log('errors', JSON.stringify(b.errors.slice(0, 6)));
  } finally {
    await b.close();
  }
})().catch((e) => { console.error('PROBE FAIL', e); process.exit(1); });
