'use strict';
/* Diagnóstico A2: estado real del visor y cajas 3D de héroes/piezas. */
const path = require('path');
const fs = require('fs');
const { open, sleep, ROOT } = require(path.resolve(__dirname, '..', '..', '..', 'qa', 'cdp.js'));
const save = JSON.parse(fs.readFileSync(path.resolve(ROOT, '.work', 'v2', 'qa', 'save-full.json'), 'utf8'));
const OUT = path.resolve(__dirname, '..', 'shots');

(async () => {
  const b = await open({ port: 9542, width: 1308, height: 662, bundle: path.resolve(ROOT, '.work', 'v2.3', 'preview', 'a2.html') });
  try {
    await b.seed(save);
    await b.ev('window.__v22.openShop()');
    await sleep(1400);
    const info = await b.ev(`(() => {
      const mount = document.getElementById('shopPreviewMount');
      const cv = mount && mount.querySelector('canvas');
      const out = { screen: window.__v22.screen(), mount: null, canvas: null };
      if (mount) { const r = mount.getBoundingClientRect(); out.mount = { w: Math.round(r.width), h: Math.round(r.height) }; }
      if (cv) { const r = cv.getBoundingClientRect(); out.canvas = { w: Math.round(r.width), h: Math.round(r.height), attrW: cv.width, attrH: cv.height }; }
      out.preview = !!(typeof wardrobe !== 'undefined' && wardrobe.preview && wardrobe.preview.avatar);
      out.previewBox = null;
      if (out.preview) {
        const box = new THREE.Box3().setFromObject(wardrobe.preview.avatar.root);
        const s = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
        out.previewBox = { size: [s.x, s.y, s.z].map(n => Math.round(n * 100) / 100), center: [c.x, c.y, c.z].map(n => Math.round(n * 100) / 100) };
        out.cam = { pos: wardrobe.preview.camera.position.toArray().map(n => Math.round(n * 100) / 100), fov: wardrobe.preview.camera.fov, aspect: wardrobe.preview.camera.aspect };
      }
      out.heroes = CAMP.characters.map(h => h.id);
      out.effects = ALL_COSMETICS.filter(c => c.category === 'efectos').map(c => ({ id: c.id, name: c.name }));
      out.frames = ALL_COSMETICS.filter(c => c.category === 'marcos').map(c => ({ id: c.id, name: c.name }));
      return out;
    })()`);
    console.log(JSON.stringify(info, null, 2));

    const boxes = await b.ev(`(() => {
      const out = {};
      const ids = ['c-efecto-aura','c-efecto-chispas','c-efecto-bruma','c-efecto-constelacion','x-aura-amanecer','c-marco-bronce','c-marco-platino','c-marco-vacio','c-marco-constelacion'];
      ['ilan','noa','zenon'].forEach(hero => {
        const av = buildHeroAvatar(hero);
        const base = new THREE.Box3().setFromObject(av.root);
        const bs = base.getSize(new THREE.Vector3());
        out[hero] = { base: [bs.x, bs.y, bs.z].map(n => +n.toFixed(2)), pieces: {} };
        ids.forEach(id => {
          const c = COSMETIC_BY_ID[id];
          const outfit = {}; outfit[c.category] = id;
          applyOutfitToAvatar(av, hero, outfit);
          const box = new THREE.Box3().setFromObject(av.root);
          const s = box.getSize(new THREE.Vector3());
          const pc = new THREE.Box3().setFromObject(av.cosmetics.groups[av.cosmetics.groups.length - 1]);
          const ps = pc.getSize(new THREE.Vector3());
          out[hero].pieces[id] = { full: [s.x, s.y, s.z].map(n => +n.toFixed(2)), piece: [ps.x, ps.y, ps.z].map(n => +n.toFixed(2)), pbMinY: +pc.min.y.toFixed(2), pbMaxY: +pc.max.y.toFixed(2) };
        });
        disposeObject(av.root);
      });
      return out;
    })()`);
    console.log(JSON.stringify(boxes, null, 2));

    await b.shot(path.join(OUT, 'diag-shop-1308.png'));
    const mountBox = await b.ev(`(() => { const m = document.getElementById('shopPreviewMount'); const r = m.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`);
    await b.shotClip('#shopPreviewMount', path.join(OUT, 'diag-canvas-1308.png'), 1);
    console.log('mountBox', JSON.stringify(mountBox));
    console.log('errors', JSON.stringify(b.errors.slice(0, 5)));
  } finally {
    await b.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
