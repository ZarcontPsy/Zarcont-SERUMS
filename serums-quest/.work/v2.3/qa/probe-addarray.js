'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');
(async () => {
  const h = await open({ port: 9587, profile: path.join(__dirname, 'profiles', 'addarray'), bundle: path.join(ROOT, 'dist', 'index.html'), width: 1308, height: 662 });
  try {
    await h.seed(JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8')), { reload: true });
    await sleep(1000);
    await h.ev(`(() => {
      window.__addStacks = [];
      const proto = THREE.Object3D.prototype;
      const orig = proto.add;
      proto.add = function () {
        for (let i = 0; i < arguments.length; i++) {
          if (Array.isArray(arguments[i])) {
            window.__addStacks.push({ at: new Date().toISOString(), stack: String(new Error().stack).split('\\n').slice(0, 8).join(' | '), current: window.__currentPiece || '' });
          }
        }
        return orig.apply(this, arguments);
      };
      return true;
    })()`);
    await h.ev("(() => { window.__v23Shop.openShop(); return true; })()");
    await sleep(900);
    await h.ev("(() => { window.__v23Shop.filter('collection', 'todos'); return true; })()");
    await sleep(400);
    const ids = await h.ev("Array.from(document.querySelectorAll('[data-cosmetic-thumb]')).map(n=>n.getAttribute('data-cosmetic-thumb'))");
    for (const id of ids) {
      await h.ev(`(() => { window.__currentPiece = ${JSON.stringify(id)}; window.__v23Shop.select(${JSON.stringify(id)}); return true; })()`);
      await sleep(90);
    }
    const stacks = await h.ev("window.__addStacks");
    console.log(JSON.stringify(stacks, null, 1).slice(0, 12000));
  } finally { await h.close(); }
})().catch(e => { console.error(e); process.exit(1); });
