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
      const sel = document.querySelector('.v23Filter--slot select');
      const filter = sel.parentElement;
      const rail = filter.parentElement;
      const out = { trials: [] };
      const h = (el) => Math.round(el.getBoundingClientRect().height);
      const trial = (label, fn) => { fn(); out.trials.push({ label, sel: h(sel), filter: h(filter), rail: h(rail), computedSel: getComputedStyle(sel).height }); };
      trial('base', () => {});
      trial('filter align-items:flex-start', () => { filter.style.alignItems = 'flex-start'; });
      trial('filter display:block', () => { filter.style.display = 'block'; });
      trial('filter display:flex dir row', () => { filter.style.display='flex'; filter.style.flexDirection='row'; });
      trial('filter flex:none', () => { filter.style.flexDirection='column'; filter.style.flex='0 0 auto'; });
      trial('rail align-items:flex-start', () => { rail.style.alignItems = 'flex-start'; });
      trial('rail height:auto', () => { rail.style.height = 'auto'; });
      trial('rail height:44px', () => { rail.style.height = '44px'; });
      return out;
    })()`);
    console.log(JSON.stringify(m, null, 2));
  } finally { await s.close(); }
})();
