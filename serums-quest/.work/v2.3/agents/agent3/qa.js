'use strict';
/* =========================================================================
   V2.3 · Fase 1 · Agente 3 · QA del catálogo e inventario
   -------------------------------------------------------------------------
   Abre .work/v2.3/preview/a3.html con el arnés CDP (puerto 9543, perfil
   propio), mide la cuadrícula por intersección real con el viewport, prueba
   búsqueda/orden/filtros/scroll/selección/compra/equipado y captura los 7
   tamaños de la matriz. No modifica el juego ni archivos compartidos.
   ========================================================================= */
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../qa/cdp');
const SAVE = JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2', 'qa', 'save-full.json'), 'utf8'));
const CAMPAIGN = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'campaign.json'), 'utf8'));
const EXTRAS = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'extras.json'), 'utf8'));
const PREVIEW = process.env.PREVIEW_FILE ? path.resolve(process.env.PREVIEW_FILE) : path.join(ROOT, '.work', 'v2.3', 'preview', 'a3.html');
const BASE = path.join(ROOT, '.work', 'v2.3', 'agents', 'agent3');
const EVID = path.join(BASE, 'evidence');
const SHOTS = path.join(BASE, 'shots');
const OUT = path.join(EVID, 'qa-agent3.json');
const SIZES = [[640, 360], [844, 390], [1024, 600], [1308, 662], [768, 1024], [1280, 720], [1920, 1080]];
const ORIGINALS = CAMPAIGN.cosmetics.map((c) => c.id);
const EXTRA_IDS = EXTRAS.cosmetics.map((c) => c.id);

const result = {
  startedAt: new Date().toISOString(),
  preview: PREVIEW,
  sizes: [],
  interactions: {},
  wardrobe: {},
  thumbs: {},
  errors: [],
  shots: []
};
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function demoSave() {
  const s = clone(SAVE);
  s.settings = Object.assign({}, s.settings, { tutorialSeen: true, backupReminder: false, sound: false, ambient: false });
  s.coins = 500;
  s.achievements = {};
  s.collection = Object.assign({}, s.collection);
  s.collection.ownedCosmeticIds = ORIGINALS.slice(0, 7).concat(EXTRA_IDS.slice(0, 6));
  return s;
}
/* Original comprable más barato que no esté en la partida de prueba. */
function cheapestBuyableId() {
  const owned = demoSave().collection.ownedCosmeticIds;
  const candidates = CAMPAIGN.cosmetics
    .filter((c) => !c.unlockRequirements && Number(c.price) > 0 && owned.indexOf(c.id) === -1)
    .sort((a, b) => Number(a.price) - Number(b.price));
  return candidates.length ? candidates[0] : null;
}
async function shot(s, name) {
  const file = path.join(SHOTS, name + '.png');
  await s.shot(file);
  result.shots.push(file);
  return file;
}
async function waitThumbs(s, ms) {
  await sleep(ms == null ? 900 : ms);
}
async function measure(s) {
  return s.ev(`(() => {
    const st = window.__v23Shop.state();
    const grid = document.querySelector('#shopGrid') || document.querySelector('#wardrobeItemsGrid');
    const gr = grid ? grid.getBoundingClientRect() : null;
    const head = document.querySelector('.v23ShopHead, .v23WardrobeHead');
    const overlay = document.querySelector('.v23Overlay');
    const cards = grid ? [...grid.querySelectorAll('.cosmeticCard')] : [];
    const first = cards[0] ? cards[0].getBoundingClientRect() : null;
    return {
      state: st,
      headH: head ? Math.round(head.getBoundingClientRect().height) : null,
      grid: gr ? { x: Math.round(gr.x), y: Math.round(gr.y), w: Math.round(gr.width), h: Math.round(gr.height) } : null,
      card: first ? { w: Math.round(first.width), h: Math.round(first.height) } : null,
      navs: performance.getEntriesByType('navigation').length,
      screenOverflowX: document.documentElement.scrollWidth - window.innerWidth,
      overlayOverflowX: overlay ? overlay.scrollWidth - overlay.clientWidth : 0,
      overlayOverflowY: overlay ? overlay.scrollHeight - overlay.clientHeight : 0,
      bodyScrollX: document.body.scrollWidth - window.innerWidth,
      countText: (document.querySelector('[data-v23-count]') || {}).textContent || '',
      cardsRendered: cards.length,
      thumbImgs: grid ? grid.querySelectorAll('.cosmeticCardThumb img').length : 0,
      thumbPlaceholders: grid ? grid.querySelectorAll('.v23ThumbPh').length : 0,
      empty: !!document.querySelector('.v23Empty')
    };
  })()`);
}
function sizeName(w, h) { return w + 'x' + h; }

(async () => {
  const s = await open({ bundle: PREVIEW, port: 9543, width: 1308, height: 662 });
  try {
    /* -------------------- Matriz de 7 tamaños (tienda) -------------------- */
    for (const [w, h] of SIZES) {
      await s.setViewport(w, h);
      await s.seed(demoSave());
      await s.dismissBanners();
      await sleep(500);
      await s.ev('window.__v22.openShop()');
      const ok = await s.waitFor("!!document.querySelector('.v23ShopShell')", 8000);
      if (!ok) { result.errors.push('sin tienda a ' + sizeName(w, h)); continue; }
      await waitThumbs(s, 1300);
      const m = await measure(s);
      const entry = { size: sizeName(w, h), ok: true, measure: m, renderCount: m.state.renderCount, thumbsAtOpen: m.state.thumbs, mounts: m.state.mounts };
      result.sizes.push(entry);
      await shot(s, 'shop-' + sizeName(w, h));
      console.log('[size] ' + sizeName(w, h) + ' visible=' + m.state.visible + ' full=' + m.state.fullyVisible + ' total=' + m.state.total + ' cols=' + m.state.columns + ' head=' + m.headH + ' canvas=' + (m.state.canvas ? m.state.canvas.w + 'x' + m.state.canvas.h : '-') + ' thumbs=' + m.state.thumbs.generated + ' overflowX=' + m.overlayOverflowX);
    }

    /* -------------------- Interacciones a 1308×662 -------------------- */
    await s.setViewport(1308, 662);
    await s.seed(demoSave());
    await s.dismissBanners();
    await sleep(500);
    await s.ev('window.__v22.openShop()');
    await s.waitFor("!!document.querySelector('.v23ShopShell')", 8000);
    await waitThumbs(s, 1200);
    await shot(s, 'shop-1308x662-inicial');
    const I = {};
    I.before = await measure(s);
    I.demoOwned = demoSave().collection.ownedCosmeticIds.length;

    /* Búsqueda con debounce */
    await s.ev('window.__v23Shop.scrollGrid(280)');
    await sleep(120);
    I.scrollBeforeSearch = await s.ev('document.querySelector("#shopGrid").scrollTop');
    await s.ev(`(() => { const el = document.querySelector('[data-v23-search="shop"]'); el.value = 'corona'; el.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
    await sleep(70);
    I.searchPending = await measure(s);
    await sleep(260);
    I.searchApplied = await measure(s);
    I.search = {
      scrollBefore: I.scrollBeforeSearch,
      pendingTotal: I.searchPending.state.total,
      appliedTotal: I.searchApplied.state.total,
      scrollAfter: I.searchApplied.state.grid ? I.searchApplied.state.grid.scrollTop : null,
      renderDelta: I.searchApplied.state.renderCount - I.before.state.renderCount,
      canvasSame: I.searchApplied.state.canvas && I.searchApplied.state.canvas.same,
      countText: I.searchApplied.countText
    };
    await shot(s, 'shop-1308x662-busqueda');

    /* Limpiar búsqueda */
    await s.click('[data-v23-search-clear="shop"]', 260);
    I.afterClear = await measure(s);
    I.clear = { total: I.afterClear.state.total, query: I.afterClear.state.filters.query, renderDelta: I.afterClear.state.renderCount - I.before.state.renderCount };

    /* Orden por precio ascendente */
    await s.ev(`(() => { const el = document.querySelector('[data-v23-sort="shop"]'); el.value = 'precio-asc'; el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
    await sleep(260);
    I.sort = await measure(s);
    I.sortPrices = await s.ev(`(() => [...document.querySelectorAll('#shopGrid .cosmeticCard')].slice(0, 8).map(c => ({ id: c.getAttribute('data-id'), price: (c.querySelector('.cosmeticCardPrice') || {}).textContent || '' })))()`);
    I.sort.renderDelta = I.sort.state.renderCount - I.before.state.renderCount;
    await shot(s, 'shop-1308x662-orden-precio');

    /* Filtro estado = En tienda */
    await s.ev(`(() => { const el = document.querySelector('[data-v23-filter-status="shop"]'); el.value = 'tienda'; el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
    await sleep(260);
    I.status = await measure(s);
    I.statusCards = await s.ev(`(() => [...document.querySelectorAll('#shopGrid .cosmeticCard')].map(c => ({ id: c.getAttribute('data-id'), status: (c.querySelector('.cosmeticCardStatus') || {}).textContent, price: (c.querySelector('.cosmeticCardPrice') || {}).textContent || '' })))()`);
    I.statusCheck = {
      total: I.status.state.total,
      allEnTienda: I.statusCards.every((c) => c.status === 'En tienda'),
      renderDelta: I.status.state.renderCount - I.before.state.renderCount,
      scrollTop: I.status.state.grid ? I.status.state.grid.scrollTop : null
    };
    await shot(s, 'shop-1308x662-filtro-tienda');

    /* Filtro colección = Extras (con estado todos) */
    await s.ev(`(() => { const st = document.querySelector('[data-v23-filter-status="shop"]'); st.value = 'todos'; st.dispatchEvent(new Event('change', { bubbles: true })); const el = document.querySelector('[data-v23-filter-collection="shop"]'); el.value = 'extras'; el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
    await sleep(320);
    I.collection = await measure(s);
    I.collectionCards = await s.ev(`(() => [...document.querySelectorAll('#shopGrid .cosmeticCard')].slice(0, 6).map(c => ({ id: c.getAttribute('data-id'), status: (c.querySelector('.cosmeticCardStatus') || {}).textContent })))()`);
    I.collectionCheck = {
      total: I.collection.state.total,
      allExtraIds: I.collectionCards.every((c) => c.id.indexOf('x-') === 0),
      statuses: I.collectionCards.map((c) => c.status),
      renderDelta: I.collection.state.renderCount - I.before.state.renderCount
    };
    await shot(s, 'shop-1308x662-coleccion-extras');

    /* Búsqueda sin resultados */
    await s.ev('window.__v23Shop.search("zzzz")');
    await sleep(200);
    I.empty = await measure(s);
    I.emptyCheck = { total: I.empty.state.total, emptyVisible: I.empty.empty, countText: I.empty.countText };
    await shot(s, 'shop-1308x662-sin-resultados');

    /* Limpiar todo */
    await s.click('[data-v23-reset="shop"]', 320);
    I.reset = await measure(s);
    I.resetCheck = { total: I.reset.state.total, filters: I.reset.state.filters, renderDelta: I.reset.state.renderCount - I.before.state.renderCount };

    /* Scroll + miniaturas bajo demanda */
    I.thumbsBeforeScroll = I.reset.state.thumbs;
    await s.ev('window.__v23Shop.scrollGrid(99999)');
    await sleep(900);
    await s.ev('window.__v23Shop.scrollGrid(0)');
    await sleep(300);
    I.thumbsAfterScroll = (await measure(s)).state.thumbs;
    I.thumbsCheck = {
      generatedAtOpen: I.before.state.thumbs.generated,
      generatedBeforeScroll: I.thumbsBeforeScroll.generated,
      generatedAfterScroll: I.thumbsAfterScroll.generated,
      cached: I.thumbsAfterScroll.cached,
      total: I.reset.state.total
    };
    await shot(s, 'shop-1308x662-scroll');

    /* Selección conservando scroll */
    await s.ev('window.__v23Shop.resetFilters(true)');
    await sleep(200);
    await s.ev('window.__v23Shop.scrollGrid(430)');
    await sleep(150);
    const targetId = await s.ev(`(() => { const grid = document.querySelector('#shopGrid'); const cards = [...grid.querySelectorAll('.cosmeticCard')]; const gr = grid.getBoundingClientRect(); const visible = cards.find(c => { const r = c.getBoundingClientRect(); return r.top > gr.top + 20 && r.bottom < gr.bottom; }); return visible ? visible.getAttribute('data-id') : null; })()`);
    const scrollBeforeSelect = await s.ev('document.querySelector("#shopGrid").scrollTop');
    if (targetId) await s.click('[data-v23-card="' + targetId + '"]', 350);
    const afterSelect = await measure(s);
    I.select = {
      targetId: targetId,
      selectedId: afterSelect.state.selectedId,
      detailTitle: await s.ev('(() => { const h = document.querySelector("#shopDetailBody h3"); return h ? h.textContent : null; })()'),
      scrollBefore: scrollBeforeSelect,
      scrollAfter: afterSelect.state.grid ? afterSelect.state.grid.scrollTop : null,
      renderDelta: afterSelect.state.renderCount - I.before.state.renderCount,
      canvasSame: afterSelect.state.canvas && afterSelect.state.canvas.same,
      sameNodeCount: afterSelect.state.canvas ? afterSelect.state.canvas.canvasCount : null
    };

    /* Compra real */
    const buyId = cheapestBuyableId();
    I.buy = { id: buyId ? buyId.id : null, price: buyId ? Number(buyId.price) : null };
    if (buyId) {
      const coinsBefore = await s.ev('window.__v23Shop.state().coins');
      const ownedBefore = await s.ev('window.__v23Shop.state().ownedCosmetics');
      const scrollBeforeBuy = await s.ev('document.querySelector("#shopGrid").scrollTop');
      await s.ev('window.__v23Shop.scrollGrid(0)');
      await s.click('[data-v23-card="' + buyId.id + '"]', 260);
      await s.click('[data-action="shop-buy"]', 260);
      I.buy.confirmVisible = await s.ev('!!document.querySelector(".buyConfirm")');
      await s.click('[data-action="shop-confirm"]', 500);
      const afterBuy = await measure(s);
      I.buy.coinsBefore = coinsBefore;
      I.buy.coinsAfter = afterBuy.state.coins;
      I.buy.ownedBefore = ownedBefore;
      I.buy.ownedAfter = afterBuy.state.ownedCosmetics;
      I.buy.selectedId = afterBuy.state.selectedId;
      I.buy.cardStatus = await s.ev('(() => { const c = document.querySelector(\'[data-v23-card="' + buyId.id + '"]\'); return c ? (c.querySelector(".cosmeticCardStatus") || {}).textContent : "sin-tarjeta"; })()');
      I.buy.countText = afterBuy.countText;
      I.buy.coinsChip = await s.ev('(() => { const el = document.querySelector("[data-v23-coins-value]"); return el ? el.textContent : null; })()');
      I.buy.renderDelta = afterBuy.state.renderCount - I.before.state.renderCount;
      I.buy.canvasSame = afterBuy.state.canvas && afterBuy.state.canvas.same;
      I.buy.scrollBefore = scrollBeforeBuy;
      I.buy.scrollAfter = afterBuy.state.grid ? afterBuy.state.grid.scrollTop : null;
      await shot(s, 'shop-1308x662-compra');
      /* Equipado */
      const equipVisible = await s.ev('!!document.querySelector(\'[data-action="shop-equip"]\')');
      if (equipVisible) await s.click('[data-action="shop-equip"]', 420);
      I.equip = await s.ev(`(() => ({
        outfit: window.__v23Shop.outfit(),
        draft: window.__v23Shop.draft(),
        renderCount: window.__v23Shop.state().renderCount,
        canvasSame: window.__v23Shop.state().canvas && window.__v23Shop.state().canvas.same
      }))()`);
      I.equip.equippedWith = Object.keys(I.equip.outfit).map((k) => I.equip.outfit[k]).indexOf(buyId.id) !== -1;
      I.equip.renderDelta = I.equip.renderCount - I.before.state.renderCount;
      await shot(s, 'shop-1308x662-equipado');
    }

    result.interactions = I;

    /* -------------------- Inventario -------------------- */
    await s.ev('window.__v23Shop.openWardrobe()');
    await s.waitFor("!!document.querySelector('.v23WardrobeShell')", 8000);
    await waitThumbs(s, 1200);
    const W = {};
    W.before = await measure(s);
    W.mounts = await s.ev(`(() => ({
      preview: !!document.querySelector('#wardrobePreviewMount'),
      canvas: !!document.querySelector('#wardrobePreviewMount canvas'),
      grid: !!document.querySelector('#wardrobeItemsGrid'),
      visor: !!document.querySelector('.v23VisorMount')
    }))()`);
    await shot(s, 'wardrobe-1308x662');
    /* Seleccionar una pieza poseída del slot actual */
    W.itemIds = await s.ev(`(() => [...document.querySelectorAll('#wardrobeItemsGrid .cosmeticCard')].slice(0, 5).map(c => ({ id: c.getAttribute('data-id'), status: (c.querySelector('.cosmeticCardStatus') || {}).textContent })))()`);
    const ownedCard = W.itemIds.find((c) => c.status === 'Poseído' || c.status === 'Probando' || c.status === 'Actual' || c.status === 'Equipado');
    if (ownedCard) {
      await s.click('[data-v23-card="' + ownedCard.id + '"]', 400);
      W.afterSelect = await measure(s);
      W.select = {
        id: ownedCard.id,
        selectedId: W.afterSelect.state.selectedId,
        draftKeys: await s.ev('Object.keys(window.__v23Shop.draft()).length'),
        renderDelta: W.afterSelect.state.renderCount - W.before.state.renderCount,
        canvasSame: W.afterSelect.state.canvas && W.afterSelect.state.canvas.same
      };
      await shot(s, 'wardrobe-1308x662-seleccion');
    }
    /* Cambio de ranura sin renderScreen */
    const slotBefore = W.before.state.renderCount;
    await s.click('.v23SlotChip[data-slot="torso"]', 400);
    W.slot = await measure(s);
    W.slotCheck = {
      slot: W.slot.state.filters.slot,
      renderDelta: W.slot.state.renderCount - slotBefore,
      canvasSame: W.slot.state.canvas && W.slot.state.canvas.same,
      total: W.slot.state.total
    };
    await shot(s, 'wardrobe-1308x662-ranura-torso');
    /* Búsqueda en inventario */
    await s.ev(`(() => { const el = document.querySelector('[data-v23-search="wardrobe"]'); el.value = 'manto'; el.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
    await sleep(300);
    W.search = await measure(s);
    W.searchCheck = { total: W.search.state.total, query: W.search.state.filters.query, renderDelta: W.search.state.renderCount - slotBefore };
    await s.ev(`(() => { const el = document.querySelector('[data-v23-search="wardrobe"]'); el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
    await sleep(260);
    /* Guardar atuendo */
    const dirty = await s.ev('!!document.querySelector(\'[data-action="wardrobe-save"]:not(:disabled)\')');
    if (dirty) await s.click('[data-action="wardrobe-save"]', 400);
    W.saved = {
      dirtyBefore: dirty,
      outfit: await s.ev('window.__v23Shop.outfit()'),
      renderCount: await s.ev('window.__v23Shop.state().renderCount')
    };
    W.saved.renderDelta = W.saved.renderCount - slotBefore;
    await shot(s, 'wardrobe-1308x662-guardado');
    result.wardrobe = W;

    /* Inventario en tamaños pequeños */
    for (const [w, h] of [[844, 390], [640, 360]]) {
      await s.setViewport(w, h);
      await s.seed(demoSave());
      await s.dismissBanners();
      await sleep(450);
      await s.ev('window.__v22.openWardrobe()');
      await s.waitFor("!!document.querySelector('.v23WardrobeShell')", 8000);
      await waitThumbs(s, 900);
      const m = await measure(s);
      result.sizes.push({ size: 'wardrobe-' + sizeName(w, h), ok: true, measure: m, renderCount: m.state.renderCount, thumbsAtOpen: m.state.thumbs, mounts: m.state.mounts });
      await shot(s, 'wardrobe-' + sizeName(w, h));
      console.log('[wardrobe] ' + sizeName(w, h) + ' visible=' + m.state.visible + ' full=' + m.state.fullyVisible + ' total=' + m.state.total + ' overflowX=' + m.overlayOverflowX);
    }

    /* Tienda de nuevo a 844×390/640×360 para comprobar que el catálogo sigue usable */
    for (const [w, h] of [[844, 390], [640, 360]]) {
      await s.setViewport(w, h);
      await s.seed(demoSave());
      await s.dismissBanners();
      await sleep(450);
      await s.ev('window.__v22.openShop()');
      await s.waitFor("!!document.querySelector('.v23ShopShell')", 8000);
      await waitThumbs(s, 900);
      await s.ev('window.__v23Shop.scrollGrid(180)');
      await sleep(250);
      const m = await measure(s);
      result.sizes.push({ size: 'shop-small-' + sizeName(w, h), ok: true, measure: m, renderCount: m.state.renderCount, thumbsAtOpen: m.state.thumbs, mounts: m.state.mounts });
      await shot(s, 'shop-small-' + sizeName(w, h));
      console.log('[shop-small] ' + sizeName(w, h) + ' visible=' + m.state.visible + ' total=' + m.state.total + ' scrollable=' + (m.state.grid ? m.state.grid.scrollH > m.state.grid.clientH : false) + ' overflowX=' + m.overlayOverflowX);
    }

    result.navs = await s.ev('performance.getEntriesByType("navigation").length');
    result.errors = (s.errors || []).slice(0, 20);
  } catch (e) {
    result.fatal = String(e && e.stack || e);
    console.error(result.fatal);
  } finally {
    await s.close();
  }
  result.finishedAt = new Date().toISOString();
  fs.mkdirSync(EVID, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
  console.log('WROTE', OUT);
  const print = (r) => 'visible=' + r.measure.state.visible + ' full=' + r.measure.state.fullyVisible + ' total=' + r.measure.state.total + ' cols=' + r.measure.state.columns + ' head=' + r.measure.headH;
  result.sizes.forEach((x) => console.log(x.size, print(x), 'thumb=' + x.measure.state.thumbs.generated, 'ovX=' + x.measure.overlayOverflowX));
})();
