'use strict';
const path = require('path');
const fs = require('fs');
const { open, sleep, ROOT } = require('./cdp');
const save = JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8'));
const mixed = JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-mixed.json'), 'utf8'));
const EVID = path.join(ROOT, '.work', 'v2.3', 'evidence');
function out(name, obj) { console.log('## ' + name + '\n' + JSON.stringify(obj, null, 1)); }
(async () => {
  const bundle = process.env.V23_BUNDLE ? path.resolve(process.env.V23_BUNDLE) : path.join(ROOT, '.work', 'v2.3', 'preview', 'combined.html');
  const s = await open({ bundle, port: 9537, width: 1308, height: 662 });
  try {
    await s.seed(save);
    await sleep(900);
    out('TITLE', await s.ev(`(() => ({ v: window.__v23 && window.__v23.version, welcome: !!document.querySelector('.v23w'), paints: window.__v23welcome && window.__v23welcome.titlePaints(), anchors: window.__v23Anchors && window.__v23Anchors.stats(), visor: !!window.__v23Visor, shop: !!window.__v23Shop, overflow: document.documentElement.scrollWidth-innerWidth }))()`));
    await s.ev('window.__v23.openShop()');
    await s.waitFor("!!document.querySelector('.v23ShopShell')", 8000);
    await sleep(1800);
    out('SHOP', await s.ev(`(() => {
      const cards=[...document.querySelectorAll('#shopGrid .cosmeticCard')];
      const counts=window.__v23Shop.counts();
      const grid=document.querySelector('#shopGrid');
      const mount=document.querySelector('#shopPreviewMount');
      const cv=mount?mount.querySelector('canvas'):null;
      const stage=document.querySelector('.v23VisorStage');
      return { total:cards.length, counts, thumbs:document.querySelectorAll('#shopGrid .cosmeticCardThumb img').length, thumbInfo:window.__v23Shop.thumbs(),
        grid: grid?{w:Math.round(grid.getBoundingClientRect().width),h:Math.round(grid.getBoundingClientRect().height),scrollH:grid.scrollHeight}:null,
        mount: mount?{w:Math.round(mount.getBoundingClientRect().width),h:Math.round(mount.getBoundingClientRect().height)}:null,
        canvas: cv?{w:Math.round(cv.getBoundingClientRect().width),h:Math.round(cv.getBoundingClientRect().height),id:cv.getAttribute('data-v23-canvas-id')}:null,
        stage: stage?{w:Math.round(stage.getBoundingClientRect().width),h:Math.round(stage.getBoundingClientRect().height)}:null,
        layout: (()=>{const l=document.querySelector('.v23ShopLayout'); return l?getComputedStyle(l).gridTemplateColumns:null})(),
        shellH: (()=>{const sh=document.querySelector('.v23ShopShell'); return sh?Math.round(sh.getBoundingClientRect().height):null})(),
        errors: window.__v23Shop.errors() };
    })()`));
    await s.shot(path.join(EVID, 'combined-shop-1308.png'));

    /* Incremental update / scroll preservation */
    const marker = await s.ev(`(() => { const sh=document.querySelector('.v23ShopShell'); sh.setAttribute('data-qa-mark','1'); const g=document.querySelector('#shopGrid'); g.scrollTop=120; return {scroll:g.scrollTop, render:window.__v22.renderCount}; })()`);
    await s.ev(`window.__v23Shop.select('c-efecto-aura')`);
    await sleep(900);
    const afterSelect = await s.ev(`(() => { const sh=document.querySelector('.v23ShopShell'); const g=document.querySelector('#shopGrid'); const cv=document.querySelector('#shopPreviewMount canvas'); return {mark:sh&&sh.getAttribute('data-qa-mark'), scroll:g?g.scrollTop:null, render:window.__v22.renderCount, canvas:!!cv, detail:(document.querySelector('#shopDetailBody h3')||{}).textContent||'', hero:window.__v23Visor&&window.__v23Visor.info?window.__v23Visor.info():null}; })()`);
    out('SELECT', { marker, afterSelect });
    await s.shot(path.join(EVID, 'combined-shop-effect-1308.png'));

    /* Hero selector */
    const beforeHero = await s.ev(`window.__v23Visor.info()`);
    await s.ev(`window.__v23Visor.hero('ilan')`);
    await sleep(700);
    const afterHero = await s.ev(`window.__v23Visor.info()`);
    out('HERO', { beforeHero, afterHero, shopSelected: await s.ev('window.__gameState().selectedCharacterId') });
    await s.shot(path.join(EVID, 'combined-shop-ilan-1308.png'));

    /* Search/filter/sort */
    const search = await s.ev(`window.__v23Shop.search('aura')`);
    await sleep(500);
    out('SEARCH', { state: search, counts: await s.ev('window.__v23Shop.counts()'), names: await s.ev(`[...document.querySelectorAll('#shopGrid .cosmeticCardName')].map(x=>x.textContent)`) });
    await s.ev(`window.__v23Shop.search(''); window.__v23Shop.filter('rarity','raro')`);
    await sleep(400);
    out('FILTER', await s.ev(`({ counts: window.__v23Shop.counts(), names: [...document.querySelectorAll('#shopGrid .cosmeticCardName')].map(x=>x.textContent).slice(0,12) })`));
    await s.ev(`window.__v23Shop.resetFilters(false)`);
    await sleep(400);

    /* Thumbnails under demand */
    await s.ev(`(() => { const g=document.querySelector('#shopGrid'); g.scrollTop=g.scrollHeight; return true; })()`);
    await sleep(1200);
    out('THUMBS', await s.ev('window.__v23Shop.thumbs()'));

    /* Wardrobe */
    await s.ev('window.__v23.openWardrobe()');
    await s.waitFor("!!document.querySelector('.wardrobeShell')", 8000);
    await sleep(1500);
    out('WARDROBE', await s.ev(`(() => { const cards=document.querySelectorAll('#wardrobeItemsGrid .cosmeticCard'); const cv=document.querySelector('#wardrobePreviewMount canvas'); return {cards:cards.length, canvas:!!cv, canvasBox:cv?[Math.round(cv.getBoundingClientRect().width),Math.round(cv.getBoundingClientRect().height)]:null, scrollH:(document.querySelector('#wardrobeItemsGrid')||{}).scrollHeight, overflow:document.documentElement.scrollWidth-innerWidth}; })()`));
    await s.shot(path.join(EVID, 'combined-wardrobe-1308.png'));
    out('ERRORS', s.errors.slice(0, 12));
  } catch (e) { console.error('FATAL', e && e.stack || e); }
  await s.close();
})();
