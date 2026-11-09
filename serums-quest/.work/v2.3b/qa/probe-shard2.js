'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');
(async () => {
  const h = await open({ port: 9570, profile: path.join(__dirname, 'profiles', 'probe3'), bundle: path.join(ROOT, 'dist', 'index.html'), width: 390, height: 844 });
  try {
    await h.seed(JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8')), { reload: true });
    await sleep(2000);
    const info = await h.ev(`(() => {
      const pts = [[350,430],[360,460],[330,480]];
      return pts.map(([x,y]) => {
        const els = document.elementsFromPoint(x,y).slice(0,8).map(el => ({ tag: el.tagName, id: el.id, cls: String(el.className).slice(0,80), bg: getComputedStyle(el).backgroundColor, zi: getComputedStyle(el).zIndex, pos: getComputedStyle(el).position }));
        const c = document.getElementById('v23bCinema'); const g = c.getContext('webgl2') || c.getContext('webgl'); let px = null;
        if (g) { const dpr = c.width/innerWidth; const glx = Math.round(x*dpr), gly = Math.round(c.height - y*dpr); const b = new Uint8Array(4); g.readPixels(glx, gly, 1,1, g.RGBA, g.UNSIGNED_BYTE, b); px = Array.from(b); }
        return { x, y, els, canvasPixel: px, canvasStyle: { opacity: getComputedStyle(c).opacity, z: getComputedStyle(c).zIndex } };
      });
    })()`);
    console.log(JSON.stringify(info, null, 1));
  } finally { await h.close(); }
})().catch(e => { console.error(e); process.exit(1); });
