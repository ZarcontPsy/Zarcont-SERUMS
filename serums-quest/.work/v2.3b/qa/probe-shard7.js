'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');
const OUT = path.resolve(__dirname, '..', 'evidence', 'debug');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await open({ port: 9575, profile: path.join(__dirname, 'profiles', 'probe8'), bundle: path.join(ROOT, 'dist', 'index.html'), width: 390, height: 844 });
  try {
    await h.seed(JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8')), { reload: true });
    await sleep(2000);
    await h.ev(`(() => {
      const scene = window.__v23b.scene();
      window.__objs = { sphere:null, rings:[], sprites:[], lines:[], points:[] };
      scene.traverse(o => {
        if (o.geometry && o.geometry.type === 'SphereGeometry') window.__objs.sphere = o;
        if (o.geometry && o.geometry.type === 'TorusGeometry' && o.material && o.material.color) window.__objs.rings.push(o);
        if (o.isSprite) window.__objs.sprites.push(o);
        if (o.isLine) window.__objs.lines.push(o);
        if (o.isPoints) window.__objs.points.push(o);
      });
      return true;
    })()`);
    const cases = [
      ['sphere', 'window.__objs.sphere.visible=false'],
      ['rings', 'window.__objs.sphere.visible=true; window.__objs.rings.forEach(o=>o.visible=false)'],
      ['sprites', 'window.__objs.rings.forEach(o=>o.visible=true); window.__objs.sprites.forEach(o=>o.visible=false)'],
      ['lines', 'window.__objs.sprites.forEach(o=>o.visible=true); window.__objs.lines.forEach(o=>o.visible=false)'],
      ['points', 'window.__objs.lines.forEach(o=>o.visible=true); window.__objs.points.forEach(o=>o.visible=false)']
    ];
    for (const [name, code] of cases) {
      await h.ev(`(() => { ${code}; return true; })()`);
      await sleep(250);
      await h.shot(path.join(OUT, '390-hide-' + name + '.png'));
    }
  } finally { await h.close(); }
})().catch(e => { console.error(e); process.exit(1); });
