'use strict';
const path = require('path');
const { open, sleep, ROOT } = require('../../qa/cdp');
const SAVE = JSON.parse(require('fs').readFileSync(path.join(ROOT, '.work', 'v2', 'qa', 'save-full.json'), 'utf8'));
const PREVIEW = path.join(ROOT, '.work', 'v2.3', 'preview', 'a3.html');
(async () => {
  const s = await open({ bundle: PREVIEW, port: 9543, width: 640, height: 360 });
  try {
    const save = JSON.parse(JSON.stringify(SAVE));
    save.settings = Object.assign({}, save.settings, { tutorialSeen: true, backupReminder: false });
    await s.seed(save); await s.dismissBanners(); await sleep(400);
    await s.setViewport(640, 360);
    await s.ev('window.__v22.openShop()');
    await s.waitFor("!!document.querySelector('.v23ShopShell')", 8000);
    await sleep(500);
    const m = await s.ev(`(() => {
      const out = {};
      const sel = document.querySelector('.v23Select');
      const filter = sel.parentElement;
      const rail = filter.parentElement;
      const r = (el) => Math.round(el.getBoundingClientRect().height);
      out.before = { select: r(sel), filter: r(filter), rail: r(rail) };
      sel.style.height = '26px';
      out.inlineSelect = { select: r(sel), filter: r(filter), rail: r(rail), computed: getComputedStyle(sel).height };
      sel.style.flex = '0 0 26px';
      out.inlineFlex = { select: r(sel), filter: r(filter), rail: r(rail), computed: getComputedStyle(sel).height };
      filter.style.height = 'auto';
      out.filterAuto = { select: r(sel), filter: r(filter), rail: r(rail) };
      const cs = getComputedStyle(filter);
      out.filterStyle = { display: cs.display, dir: cs.flexDirection, align: cs.alignItems, height: cs.height, flex: cs.flex };
      const selCs = getComputedStyle(sel);
      out.selStyle = { boxSizing: selCs.boxSizing, display: selCs.display, lineHeight: selCs.lineHeight, padding: selCs.padding, border: selCs.borderWidth, appearance: selCs.appearance };
      return out;
    })()`);
    console.log(JSON.stringify(m, null, 2));
  } finally { await s.close(); }
})();
