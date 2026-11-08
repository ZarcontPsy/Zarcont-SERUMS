/* =========================================================================
   SERUMS QUEST · V2.2 · Tienda 3D, miniaturas, interfaz y avisos
   -------------------------------------------------------------------------
   Módulo de integración del Agente 0. Se carga al final para reutilizar las
   funciones y el estado del juego sin duplicar el catálogo ni el guardado.
   Prefijos V22/v22 para no colisionar con V2 (motor de feedback/resumen).
   ========================================================================= */
var V22 = {
  version: '2.2.0',
  thumbCache: {},
  thumbQueue: [],
  thumbQueued: {},
  thumbBusy: false,
  thumbRenderer: null,
  thumbScene: null,
  thumbCamera: null,
  thumbAvatar: null,
  thumbSize: 160,
  shopTryId: null,
  shopCompare: false,
  previewMode: '',
  previewCategory: '',
  previewKey: '',
  storageWarned: false,
  resultRender: 0,
  lastDuelFit: 0
};

/* -------------------------------------------------------------------------
   Utilidades
   ------------------------------------------------------------------------- */
function v22ById(id) { return document.getElementById(id); }
function v22Q(sel, root) { try { return (root || document).querySelector(sel); } catch (e) { return null; } }
function v22QA(sel, root) { try { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); } catch (e) { return []; } }
function v22SetHTML(el, html) { if (el) el.innerHTML = html; }
function v22Num(n) { n = Number(n); return isFinite(n) ? n : 0; }
function v22Rarity(c) { return rarityUI(cosmeticRarityKey(c)); }
function v22SlotLabel(c) { return cosmeticSlotLabel(c.category); }
function v22OutfitFor(characterId) {
  try { return getCharacterOutfit(characterId) || {}; } catch (e) { return {}; }
}
function v22Clone(o) {
  var out = {};
  Object.keys(o || {}).forEach(function (k) { out[k] = o[k]; });
  return out;
}
function v22StatusFor(c, mode) {
  var owned = cosmeticOwned(c.id);
  if (mode === 'specific') {
    if (!owned) return { label: 'Bloqueado', cls: 'is-locked' };
    if (wardrobe.saved[c.category] === c.id && wardrobe.draft[c.category] === c.id) return { label: 'Equipado', cls: 'is-equipped' };
    if (wardrobe.draft[c.category] === c.id) return { label: 'Probando', cls: 'is-trying' };
    if (wardrobe.saved[c.category] === c.id) return { label: 'Actual', cls: 'is-current' };
    return { label: 'Poseído', cls: 'is-owned' };
  }
  if (owned) return { label: 'Poseído', cls: 'is-owned' };
  return { label: 'En tienda', cls: 'is-shop' };
}
function v22ThumbHTML(id) {
  var src = V22.thumbCache[id];
  if (src) return '<img src="' + src + '" alt="" draggable="false" />';
  return '<span class="cosmeticThumbLoading" aria-hidden="true"></span>';
}

/* -------------------------------------------------------------------------
   Miniaturas: un único renderizador fuera de pantalla y caché en memoria
   ------------------------------------------------------------------------- */
function v22EnsureThumbRenderer() {
  if (V22.thumbRenderer) return V22.thumbRenderer;
  try {
    var canvas = document.createElement('canvas');
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setSize(V22.thumbSize, V22.thumbSize, false);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    var scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#c4d2ff', '#2b2238', 2.1));
    var key = new THREE.DirectionalLight('#ffe5ca', 2.5); key.position.set(-3, 6, 5); scene.add(key);
    var rim = new THREE.DirectionalLight('#7ba6ff', 1.6); rim.position.set(4, 4, -3); scene.add(rim);
    var camera = new THREE.PerspectiveCamera(26, 1, 0.1, 80);
    V22.thumbRenderer = renderer;
    V22.thumbScene = scene;
    V22.thumbCamera = camera;
    return renderer;
  } catch (e) {
    return null;
  }
}
function v22TitleThumb(c) {
  try {
    var canvas = document.createElement('canvas');
    canvas.width = V22.thumbSize; canvas.height = V22.thumbSize;
    var ctx = canvas.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, 0, V22.thumbSize);
    g.addColorStop(0, 'rgba(18,25,42,.95)'); g.addColorStop(1, 'rgba(7,11,19,.98)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, V22.thumbSize, V22.thumbSize);
    ctx.strokeStyle = 'rgba(228,192,122,.55)'; ctx.lineWidth = 2;
    ctx.strokeRect(10.5, 10.5, V22.thumbSize - 21, V22.thumbSize - 21);
    ctx.fillStyle = '#e4c07a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '600 42px Georgia, serif'; ctx.fillText('Aa', V22.thumbSize / 2, V22.thumbSize / 2 - 14);
    ctx.fillStyle = '#a7b2c9'; ctx.font = '700 9px Segoe UI, sans-serif';
    var label = String(c.name || '').slice(0, 18).toUpperCase();
    ctx.fillText(label, V22.thumbSize / 2, V22.thumbSize / 2 + 32);
    return canvas.toDataURL('image/png');
  } catch (e) { return ''; }
}
function v22FrameThumbCamera(avatar, c) {
  var cam = V22.thumbCamera;
  if (!cam || !avatar) return;
  var cat = c.category;
  var y = 1.25, h = 3.0, dist = 4.4, side = 0.32;
  if (cat === 'cabeza' || cat === 'peinado' || cat === 'amuletos' || (cat === 'accesorios' && c.id === 'c-accesorios-gafas')) {
    y = 1.98; h = 2.15; dist = 3.35; side = 0.2;
  } else if (cat === 'torso' || cat === 'accesorios' || cat === 'extras') {
    y = 1.32; h = 2.35; dist = 3.35; side = 0.26;
  } else if (cat === 'marcos' || cat === 'efectos' || cat === 'mascota' || cat === 'estela') {
    y = 1.35; h = 3.1; dist = 4.9; side = 0.34;
  }
  cam.position.set(side, y + h * 0.18, dist);
  cam.lookAt(0, y, 0);
  cam.fov = 26; cam.updateProjectionMatrix();
}
function v22RenderThumb(c) {
  if (!c) return '';
  if (c.category === 'titulo') return v22TitleThumb(c);
  var renderer = v22EnsureThumbRenderer();
  if (!renderer) return '';
  try {
    if (!V22.thumbAvatar) V22.thumbAvatar = buildHeroAvatar('noa');
    var av = V22.thumbAvatar;
    var outfit = {};
    outfit[c.category] = c.id;
    applyOutfitToAvatar(av, 'noa', outfit);
    av.root.rotation.set(0, 0.32, 0);
    V22.thumbScene.add(av.root);
    v22FrameThumbCamera(av, c);
    renderer.render(V22.thumbScene, V22.thumbCamera);
    var data = renderer.domElement.toDataURL('image/png');
    if (av.root.parent) av.root.parent.remove(av.root);
    return data;
  } catch (e) {
    try { if (V22.thumbAvatar && V22.thumbAvatar.root.parent) V22.thumbAvatar.root.parent.remove(V22.thumbAvatar.root); } catch (e2) {}
    return '';
  }
}
function v22QueueThumbs(ids) {
  (ids || ALL_COSMETICS.map(function (c) { return c.id; })).forEach(function (id) {
    if (V22.thumbCache[id] || V22.thumbQueued[id]) return;
    V22.thumbQueued[id] = true;
    V22.thumbQueue.push(id);
  });
  v22PumpThumbs();
}
function v22PumpThumbs() {
  if (V22.thumbBusy) return;
  if (!V22.thumbQueue.length) return;
  V22.thumbBusy = true;
  var id = V22.thumbQueue.shift();
  var c = COSMETIC_BY_ID[id];
  var data = c ? v22RenderThumb(c) : '';
  if (data) V22.thumbCache[id] = data;
  V22.thumbBusy = false;
  v22HydrateThumbs(document);
  if (V22.thumbQueue.length) window.setTimeout(v22PumpThumbs, 14);
}
function v22HydrateThumbs(root) {
  var nodes = v22QA('[data-cosmetic-thumb]', root);
  nodes.forEach(function (node) {
    var id = node.getAttribute('data-cosmetic-thumb');
    if (!id || node.getAttribute('data-thumb-ready') === '1') return;
    if (V22.thumbCache[id]) {
      node.innerHTML = '<img src="' + V22.thumbCache[id] + '" alt="" draggable="false" />';
      node.setAttribute('data-thumb-ready', '1');
      node.classList.add('is-ready');
    }
  });
  var missing = nodes.filter(function (n) { return n.getAttribute('data-thumb-ready') !== '1'; }).map(function (n) { return n.getAttribute('data-cosmetic-thumb'); });
  if (missing.length) v22QueueThumbs(missing);
}

/* -------------------------------------------------------------------------
   Tarjetas y detalle
   ------------------------------------------------------------------------- */
function cosmeticCardHTML(c, outfit, mode) {
  if (!c) return '';
  var status = v22StatusFor(c, mode);
  var rarity = v22Rarity(c);
  var selected = mode === 'specific' ? wardrobe.selectedId === c.id : shop.selectedId === c.id;
  var price = !cosmeticOwned(c.id) && Number(c.price) > 0 ? '<span class="cosmeticCardPrice">◇' + formatNumber(c.price) + '</span>' : '';
  return '<button type="button" class="cosmeticCard ' + status.cls + (selected ? ' is-selected' : '') + '" style="--rarity-color:' + rarity.color + '" data-action="' + (mode === 'specific' ? 'wardrobe-item' : 'shop-item') + '" data-id="' + esc(c.id) + '" aria-pressed="' + (selected ? 'true' : 'false') + '">' +
    '<span class="cosmeticCardThumb" data-cosmetic-thumb="' + esc(c.id) + '">' + v22ThumbHTML(c.id) + '</span>' +
    '<span class="cosmeticCardBody"><span class="cosmeticCardName">' + esc(c.name) + '</span><small>' + esc(rarity.label) + ' · ' + esc(v22SlotLabel(c)) + '</small></span>' +
    '<span class="cosmeticCardFoot"><span class="cosmeticCardStatus">' + esc(status.label) + '</span>' + price + '</span>' +
  '</button>';
}
function v22RequirementHTML(c, mode) {
  var owned = cosmeticOwned(c.id);
  var req = cosmeticRequirementInfo(c);
  var progress = cosmeticProgressText(c);
  var html = '<div class="cosmeticMeta"><span>' + (owned ? 'Progreso' : 'Cómo conseguirlo') + '</span><b>' + esc(progress) + '</b></div>';
  if (!owned && req && req.requirementText) html += '<div class="cosmeticMeta"><span>Requisito</span><b>' + esc(req.requirementText) + '</b></div>';
  html += '<div class="cosmeticMeta"><span>Tu saldo</span><b>◇' + formatNumber(state.coins) + '</b></div>';
  return html;
}
function cosmeticDetailHTML(c, mode) {
  if (!c) return '<div class="wardrobeEmpty"><span class="eyebrow noRule">Selecciona una pieza</span><h3>Previsualiza antes de equipar.</h3><p>Elige una tarjeta del catálogo. La vista 3D se actualiza sin recargar la pantalla.</p></div>';
  var rarity = v22Rarity(c);
  var owned = cosmeticOwned(c.id);
  var status = v22StatusFor(c, mode);
  var tryOn = mode === 'shop' && V22.shopTryId === c.id;
  var actions = '';
  if (mode === 'specific') {
    if (owned) {
      actions += '<button type="button" class="btn btn--primary btn--sm" data-action="wardrobe-item" data-id="' + esc(c.id) + '">' + (wardrobe.draft[c.category] === c.id ? 'Quitar del borrador' : 'Probar esta pieza') + '</button>';
      if (wardrobe.draft[c.category] && wardrobe.draft[c.category] !== c.id) actions += '<button type="button" class="btn btn--ghost btn--sm" data-action="wardrobe-clear" data-slot="' + esc(c.category) + '">Quitar pieza actual</button>';
    } else {
      actions += '<div class="cosmeticNotice">' + esc(cosmeticRequirementInfo(c).requirementText || 'Se consigue jugando.') + '</div>';
      if (!isExtraCosmetic(c)) actions += '<button type="button" class="btn btn--ghost btn--sm" data-action="open-shop">Ir a la tienda</button>';
    }
  } else if (owned) {
    actions += '<button type="button" class="btn btn--primary btn--sm" data-action="shop-equip" data-id="' + esc(c.id) + '">Equipar en el héroe</button>';
    actions += '<button type="button" class="btn btn--ghost btn--sm" data-action="shop-compare">' + (V22.shopCompare ? 'Ver con la pieza' : 'Comparar con lo equipado') + '</button>';
    actions += '<button type="button" class="btn btn--quiet btn--sm" data-action="open-wardrobe">Abrir inventario</button>';
  } else {
    var can = !!(cosmeticRequirementInfo(c) && cosmeticRequirementInfo(c).canBuy);
    actions += '<button type="button" class="btn btn--ghost btn--sm" data-action="shop-try" data-id="' + esc(c.id) + '">' + (tryOn ? 'Dejar de probar' : 'Probar sin comprar') + '</button>';
    actions += '<button type="button" class="btn btn--ghost btn--sm" data-action="shop-compare">' + (V22.shopCompare ? 'Ver con la pieza' : 'Comparar') + '</button>';
    actions += '<button type="button" class="btn ' + (can ? 'btn--primary' : '') + ' btn--sm" data-action="shop-buy" data-id="' + esc(c.id) + '" ' + (can ? '' : 'disabled') + '>' + (can ? 'Comprar por ◇' + formatNumber(c.price) : 'Compra bloqueada') + '</button>';
    if (shop.confirmId === c.id) {
      actions += '<div class="buyConfirm"><b>Confirmar compra</b><p>' + esc(c.name) + ' · ◇' + formatNumber(c.price) + ' · saldo después: ◇' + formatNumber(Math.max(0, state.coins - c.price)) + '</p><div><button type="button" class="btn btn--gold btn--sm" data-action="shop-confirm" data-id="' + esc(c.id) + '">Confirmar</button><button type="button" class="btn btn--quiet btn--sm" data-action="shop-cancel-buy">Cancelar</button></div></div>';
    }
  }
  return '<div class="cosmeticDetailHead"><span class="chip" style="color:' + rarity.color + ';border-color:' + rarity.color + '">' + esc(rarity.label) + '</span><span class="chip">' + esc(v22SlotLabel(c)) + '</span><span class="chip cosmeticStatusChip">' + esc(tryOn ? 'Probando' : status.label) + '</span></div>' +
    '<h3>' + esc(c.name) + '</h3>' +
    '<p class="cosmeticDesc">' + esc(c.description || '') + '</p>' +
    (c.category === 'titulo' ? '<p class="tiny dim">Los títulos se muestran junto al nombre; no son una pieza 3D.</p>' : '') +
    v22RequirementHTML(c, mode) +
    '<div class="cosmeticActions">' + actions + '</div>';
}

/* -------------------------------------------------------------------------
   Tienda: cuadrícula + visor + actualización incremental
   ------------------------------------------------------------------------- */
function shopScreenHTML() {
  var list = shopFiltered();
  if (!shop.selectedId || !list.some(function (c) { return c.id === shop.selectedId; })) {
    shop.selectedId = list.length ? list[0].id : null;
    V22.shopTryId = shop.selectedId;
  }
  var selected = shop.selectedId ? COSMETIC_BY_ID[shop.selectedId] : null;
  if (selected && !cosmeticOwned(selected.id)) V22.shopTryId = selected.id;
  var cats = ['todas'].concat(COSMETIC_SLOT_ORDER.filter(function (s) { return s !== 'titulo'; })).map(function (s) {
    return '<option value="' + esc(s) + '" ' + (shop.slot === s ? 'selected' : '') + '>' + esc(s === 'todas' ? 'Todas las ranuras' : cosmeticSlotLabel(s)) + '</option>';
  }).join('');
  var rarities = ['todas'].concat(RARITY_ORDER).map(function (r) {
    return '<option value="' + esc(r) + '" ' + (shop.rarity === r ? 'selected' : '') + '>' + esc(r === 'todas' ? 'Todas las rarezas' : rarityUI(r).label) + '</option>';
  }).join('');
  var ownedCount = shopCosmetics().filter(function (c) { return cosmeticOwned(c.id); }).length;
  var char = CHARACTER_BY_ID[state.collection.selectedCharacterId] || CAMP.characters[0];
  return '<div class="overlay"><div class="overlayShell shopShell">' +
    '<div class="sheetHead v22SheetHead"><div><span class="eyebrow"><span class="kickerDot" style="background:var(--gold);box-shadow:0 0 12px var(--gold)"></span>Tienda de ecos</span><h1>Objetos que ya existían <em>en tu colección.</em></h1><p>Los 33 cosméticos originales conservan su precio y sus requisitos. La compra se confirma con tu saldo y no se puede repetir.</p></div>' +
      '<div class="sheetHeadSide"><span class="chip chip--gold">' + icon('coin', 12) + ' ◇' + formatNumber(state.coins) + '</span><span class="chip">' + ownedCount + '/33 originales</span><button type="button" class="sheetClose" data-action="close-sheet" aria-label="Cerrar">' + icon('close', 17) + '</button></div></div>' +
    '<div class="shopLayout">' +
      '<aside class="panel shopRail"><span class="eyebrow noRule">Filtrar</span><select class="selectMini wide" data-v22-shop-slot>' + cats + '</select><div class="v22RailGap"><select class="selectMini wide" data-v22-shop-rarity>' + rarities + '</select></div><div class="sectionDivider"></div><div class="shopNote"><b>Monedas de estudio</b><p>Se ganan respondiendo y cerrando rutas. Tope de ◇120 al día; ya ganadas no se pierden.</p></div><button type="button" class="btn btn--ghost btn--sm btn--block" data-action="open-wardrobe">Ir al inventario ' + icon('chevronRight', 11) + '</button></aside>' +
      '<section class="panel shopList"><div class="shopListHead"><h2>Catálogo original</h2><span class="chip" id="shopCount">' + list.length + ' resultados</span></div><div class="cosmeticGrid shopGrid" id="shopGrid">' + (list.map(function (c) { return cosmeticCardHTML(c, v22OutfitFor(state.collection.selectedCharacterId), 'shop'); }).join('') || '<div class="wardrobeEmpty"><p>No hay cosméticos con ese filtro.</p></div>') + '</div></section>' +
      '<aside class="panel shopDetail"><div class="cosmeticPreviewMount" id="shopPreviewMount"><span class="previewHint">Arrastra para girar</span><span class="previewCorner" style="--accent:' + (char ? HERO_LOOKS[char.id].accent : 'var(--blue)') + '">' + esc(char ? char.name : 'Héroe') + '<br /><small>Prueba en vivo</small></span></div><div class="shopDetailBody" id="shopDetailBody">' + cosmeticDetailHTML(selected, 'shop') + '</div></aside>' +
    '</div>' +
    '<div class="atlasFooter"><span>Los extras de constancia, repaso, dominio, jefes, mascotas y títulos no se venden: se ganan jugando.</span><span>' + icon('shield', 11) + ' Sin dinero real.</span></div>' +
  '</div></div>';
}
function v22UpdateShopCards() {
  var list = shopFiltered();
  var grid = v22ById('shopGrid');
  if (grid) {
    var scrollTop = grid.scrollTop;
    grid.innerHTML = list.map(function (c) { return cosmeticCardHTML(c, v22OutfitFor(state.collection.selectedCharacterId), 'shop'); }).join('') || '<div class="wardrobeEmpty"><p>No hay cosméticos con ese filtro.</p></div>';
    grid.scrollTop = scrollTop;
    v22HydrateThumbs(grid);
  }
  var count = v22ById('shopCount');
  if (count) count.textContent = list.length + ' resultados';
  if (!list.some(function (c) { return c.id === shop.selectedId; })) shop.selectedId = list.length ? list[0].id : null;
  v22UpdateShopDetail();
}
function v22UpdateShopDetail() {
  var body = v22ById('shopDetailBody');
  var c = shop.selectedId ? COSMETIC_BY_ID[shop.selectedId] : null;
  if (body) body.innerHTML = cosmeticDetailHTML(c, 'shop');
  v22UpdateShopCardSelection();
  v22UpdateShopPreview();
}
function v22UpdateShopCardSelection() {
  v22QA('#shopGrid .cosmeticCard').forEach(function (card) {
    var on = card.getAttribute('data-id') === shop.selectedId;
    card.classList.toggle('is-selected', on);
    card.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}
function v22UpdateShopPreview() {
  if (screen === 'shop' && !V22.previewMode) V22.previewMode = 'shop';
  if (screen === 'shop') {
    var c = shop.selectedId ? COSMETIC_BY_ID[shop.selectedId] : null;
    V22.previewCategory = c ? c.category : '';
    if (wardrobe.preview) wardrobe.preview.lastKey = '';
    updateWardrobeAvatar();
  }
}
function shopSelect(id) {
  var c = COSMETIC_BY_ID[id];
  if (!c) return;
  shop.selectedId = id;
  shop.confirmId = null;
  if (!cosmeticOwned(id)) V22.shopTryId = id;
  v22UpdateShopDetail();
  sfxClick();
}
function shopAskBuy(id) {
  var c = COSMETIC_BY_ID[id];
  if (!c) return;
  shop.selectedId = id;
  shop.confirmId = id;
  v22UpdateShopDetail();
  sfxClick();
}
function shopCancelBuy() { shop.confirmId = null; v22UpdateShopDetail(); }
function shopConfirmBuy(id) {
  var result = buyCosmetic(id);
  if (!result.ok) { toast(result.reason, 'warn', 4200); shop.confirmId = null; v22UpdateShopDetail(); return; }
  shop.confirmId = null;
  V22.shopTryId = id;
  toast('«' + result.cosmetic.name + '» comprado por ◇' + formatNumber(result.price) + '. Ya está en tu colección.', 'success', 4200);
  v22UpdateShopCards();
  var head = v22Q('.shopShell .sheetHeadSide .chip--gold');
  if (head) head.innerHTML = icon('coin', 12) + ' ◇' + formatNumber(state.coins);
  var ownedChip = v22QA('.shopShell .sheetHeadSide .chip').filter(function (el) { return el !== head; })[0];
  if (ownedChip) ownedChip.textContent = shopCosmetics().filter(function (x) { return cosmeticOwned(x.id); }).length + '/33 originales';
  syncHUD();
  refreshAllPortraits();
  sfxPurchase();
}
function v22EquipSelected() {
  var c = shop.selectedId ? COSMETIC_BY_ID[shop.selectedId] : null;
  if (!c) return;
  var charId = state.collection.selectedCharacterId;
  var outfit = v22Clone(v22OutfitFor(charId));
  if (cosmeticOwned(c.id)) outfit[c.category] = c.id;
  setCharacterOutfit(charId, outfit);
  persist();
  if (heroAvatar) applyOutfitToAvatar(heroAvatar, charId);
  V22.shopTryId = c.id;
  V22.shopCompare = false;
  v22UpdateShopCards();
  toast('«' + c.name + '» equipado en ' + (CHARACTER_BY_ID[charId] ? CHARACTER_BY_ID[charId].name : 'el héroe') + '.', 'success', 2600);
  sfxSelect();
}

/* -------------------------------------------------------------------------
   Inventario: tarjetas + detalle + preview incremental
   ------------------------------------------------------------------------- */
function wardrobeScreenHTML() {
  var characterId = wardrobe.characterId || state.collection.selectedCharacterId;
  var char = CHARACTER_BY_ID[characterId] || CAMP.characters[0];
  var look = HERO_LOOKS[char.id];
  var outfitView = wardrobe.compareSaved ? wardrobe.saved : wardrobe.draft;
  var selected = wardrobe.selectedId ? COSMETIC_BY_ID[wardrobe.selectedId] : null;
  var allInSlot = filteredCosmeticsFor(wardrobe.slot, wardrobe.rarity, false);
  var slotCounts = {};
  COSMETIC_SLOT_ORDER.forEach(function (s) { slotCounts[s] = cosmeticsInSlot(s).filter(function (c) { return cosmeticOwned(c.id); }).length + '/' + cosmeticsInSlot(s).length; });
  var heroTabs = state.collection.ownedCharacterIds.map(function (id) {
    var c = CHARACTER_BY_ID[id]; if (!c) return '';
    return '<button type="button" class="miniHeroTab ' + (id === characterId ? 'is-active' : '') + '" data-action="wardrobe-hero" data-hero="' + esc(id) + '">' + esc(c.name.split(' ')[0]) + '</button>';
  }).join('');
  var rarities = ['todas'].concat(RARITY_ORDER).map(function (r) {
    return '<option value="' + esc(r) + '" ' + (wardrobe.rarity === r ? 'selected' : '') + '>' + esc(r === 'todas' ? 'Todas las rarezas' : rarityUI(r).label) + '</option>';
  }).join('');
  var items = allInSlot.length ? allInSlot.map(function (c) { return cosmeticCardHTML(c, wardrobe.saved, 'specific'); }).join('') : '<div class="wardrobeEmpty"><p>No hay piezas para este filtro.</p></div>';
  var currentSaved = Object.keys(wardrobe.saved).length;
  var currentDraft = Object.keys(wardrobe.draft).length;
  return '<div class="overlay"><div class="overlayShell wardrobeShell">' +
    '<div class="sheetHead v22SheetHead"><div><span class="eyebrow"><span class="kickerDot" style="background:' + look.accent + '"></span>Estudio de equipamiento</span><h1>El atuendo <em>se prueba antes de salir.</em></h1><p>Gira el héroe, compara y guarda. Solo se equipan piezas que ya posees; las bloqueadas muestran su requisito.</p></div>' +
      '<div class="sheetHeadSide"><span class="chip">' + cosmeticsOwnedCountLabel() + ' cosméticos</span><span class="chip">' + state.collection.ownedCharacterIds.length + '/10 héroes</span><button type="button" class="sheetClose" data-action="close-sheet" aria-label="Cerrar">' + icon('close', 17) + '</button></div></div>' +
    '<div class="wardrobeHeroBar"><span class="eyebrow noRule">Héroe</span><div class="miniHeroTabs">' + heroTabs + '</div><span class="wardrobeTitle">Título: <b>' + esc(titleText(char.id) || 'sin título') + '</b></span></div>' +
    '<div class="wardrobeGrid">' +
      '<aside class="panel wardrobeSlots"><span class="eyebrow noRule">Ranuras · una pieza activa</span><div class="slotList">' + slotTabsHTML(wardrobe.slot, 'wardrobe-slot', slotCounts) + '</div><div class="sectionDivider"></div><div class="wardrobeMeta"><span class="tiny dim">Atuendo guardado</span><b>' + currentSaved + ' piezas</b><span class="tiny dim">Borrador</span><b>' + currentDraft + ' piezas</b></div></aside>' +
      '<section class="wardrobeStage"><div class="previewMount" id="wardrobePreviewMount"><div class="previewHint">Arrastra para girar</div><div class="previewCorner" style="--accent:' + look.accent + '">' + esc(char.name) + '<br /><small>' + esc(look.klass) + '</small></div></div>' +
        '<div class="compareStrip"><span><b>Ahora</b><br />' + (currentSaved ? currentSaved + ' ' + plural(currentSaved, 'pieza', 'piezas') : 'sin cosméticos') + '</span>' + icon('arrowRight', 14) + '<span><b>Borrador</b><br />' + (currentDraft ? currentDraft + ' ' + plural(currentDraft, 'pieza', 'piezas') : 'sin cosméticos') + '</span></div>' +
        '<div class="wardrobeActions"><button type="button" class="btn btn--ghost btn--sm" data-action="wardrobe-compare">' + (wardrobe.compareSaved ? icon('layers', 13) + ' Ver borrador' : icon('eye', 13) + ' Ver atuendo actual') + '</button><button type="button" class="btn btn--quiet btn--sm" data-action="wardrobe-discard" ' + (wardrobeDirty() ? '' : 'disabled') + '>Descartar</button><button type="button" class="btn btn--primary btn--sm" data-action="wardrobe-save" ' + (wardrobeDirty() ? '' : 'disabled') + '>' + icon('check', 13) + ' Guardar atuendo</button></div>' +
      '</section>' +
      '<section class="panel wardrobeItems"><div class="wardrobeItemsHead"><div><span class="eyebrow noRule">' + esc(cosmeticSlotLabel(wardrobe.slot)) + '</span><h2>' + allInSlot.length + ' piezas</h2></div><div class="wardrobeFilter"><select class="selectMini" data-v22-wardrobe-rarity>' + rarities + '</select></div></div>' +
        '<div class="cosmeticGrid wardrobeGridItems" id="wardrobeItemsGrid">' + items + '</div>' +
        '<div class="cosmeticDetail" id="wardrobeDetail">' + cosmeticDetailHTML(selected, 'specific') + '</div>' +
      '</section>' +
    '</div>' +
    '<div class="atlasFooter"><span>El borrador no se guarda hasta pulsar «Guardar atuendo». La vista 3D respeta las capas base y las anclas de identidad.</span><span>' + icon('spark', 11) + ' Arrastra el héroe para girarlo.</span></div>' +
  '</div></div>';
}
function v22UpdateWardrobeItems() {
  var list = filteredCosmeticsFor(wardrobe.slot, wardrobe.rarity, false);
  var grid = v22ById('wardrobeItemsGrid');
  if (grid) {
    var scrollTop = grid.scrollTop;
    grid.innerHTML = list.length ? list.map(function (c) { return cosmeticCardHTML(c, wardrobe.saved, 'specific'); }).join('') : '<div class="wardrobeEmpty"><p>No hay piezas para este filtro.</p></div>';
    grid.scrollTop = scrollTop;
    v22HydrateThumbs(grid);
  }
  var detail = v22ById('wardrobeDetail');
  var selected = wardrobe.selectedId ? COSMETIC_BY_ID[wardrobe.selectedId] : null;
  if (detail) detail.innerHTML = cosmeticDetailHTML(selected, 'specific');
  v22QA('#wardrobeItemsGrid .cosmeticCard').forEach(function (card) {
    var on = card.getAttribute('data-id') === wardrobe.selectedId;
    card.classList.toggle('is-selected', on);
    card.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  if (wardrobe.preview) wardrobe.preview.lastKey = '';
  updateWardrobeAvatar();
}
function wardrobeSelectItem(id) {
  var c = COSMETIC_BY_ID[id];
  if (!c) return;
  wardrobe.selectedId = id;
  if (cosmeticOwned(id)) {
    if (wardrobe.draft[c.category] === id) delete wardrobe.draft[c.category];
    else wardrobe.draft[c.category] = id;
    wardrobe.previewDirty = true;
  }
  V22.previewCategory = c.category;
  v22UpdateWardrobeItems();
  var detail = v22ById('wardrobeDetail');
  if (detail) detail.innerHTML = cosmeticDetailHTML(c, 'specific');
  sfxSelect();
}
function wardrobeClearSlot(slot) {
  if (!wardrobe.draft[slot]) return;
  delete wardrobe.draft[slot];
  wardrobe.previewDirty = true;
  v22UpdateWardrobeItems();
  sfxSelect();
}
function wardrobeSave() {
  if (!wardrobe.characterId) return;
  if (state.collection.ownedCharacterIds.indexOf(wardrobe.characterId) === -1) return;
  setCharacterOutfit(wardrobe.characterId, wardrobe.draft);
  wardrobe.saved = getCharacterOutfit(wardrobe.characterId);
  wardrobe.draft = v22Clone(wardrobe.saved);
  wardrobe.compareSaved = false;
  persist();
  v22UpdateWardrobeItems();
  toast('Atuendo guardado. El héroe ya lo lleva en el observatorio y en los duelos.', 'success', 3600);
  sfxSelect();
}
function wardrobeDiscard() {
  wardrobe.draft = v22Clone(wardrobe.saved);
  wardrobe.selectedId = null;
  wardrobe.compareSaved = false;
  V22.previewKey = '';
  if (wardrobe.preview) wardrobe.preview.lastKey = '';
  var grid = v22ById('wardrobeItemsGrid');
  if (grid) v22UpdateWardrobeItems();
  else renderScreen();
  mountWardrobePreview();
}
function wardrobeSetSlot(slot) {
  wardrobe.slot = slot; wardrobe.selectedId = null; wardrobe.compareSaved = false;
  renderScreen();
  mountWardrobePreview();
}
function wardrobeSetRarity(rarity) {
  wardrobe.rarity = rarity || 'todas'; wardrobe.selectedId = null;
  v22UpdateWardrobeItems();
}

/* -------------------------------------------------------------------------
   Visor 3D compartido + cambio por ranura (sin reconstruir el héroe)
   ------------------------------------------------------------------------- */
function v22RemoveSlotGroups(avatar, slot) {
  if (!avatar.cosmetics) return;
  var keep = [];
  avatar.cosmetics.groups.forEach(function (group) {
    if (group.userData && group.userData.slot === slot) {
      if (group.parent) group.parent.remove(group);
      try {
        group.traverse(function (node) {
          if (node.geometry) node.geometry.dispose();
          if (node.material) node.material.dispose();
        });
      } catch (e) {}
      avatar.cosmetics.animated = (avatar.cosmetics.animated || []).filter(function (spec) { return spec.group !== group; });
    } else keep.push(group);
  });
  avatar.cosmetics.groups = keep;
  delete avatar.cosmetics.slots[slot];
  if (slot === 'marcos') avatar.cosmetics.frame = null;
}
function v22AttachSlot(avatar, c, slot, qf) {
  var group = null;
  if (slot === 'cabeza') group = buildHeadPiece(c, qf);
  else if (slot === 'peinado') group = buildHairPiece(c, qf);
  else if (slot === 'torso') group = buildTorsoPiece(c, qf);
  else if (slot === 'accesorios') group = (c.id === 'c-accesorios-gafas' ? buildHeadAccessory(c, qf) : c.id === 'c-accesorios-brujula' ? buildWristCompass(c, qf) : buildHipExtra(c, qf, avatar));
  else if (slot === 'extras') group = buildHipExtra(c, qf, avatar);
  else if (slot === 'amuletos') { group = buildAmulet(c, qf); group.scale.setScalar(1.32); group.position.z += 0.025; }
  else if (slot === 'efectos') group = buildEffectPiece(c, qf, avatar);
  else if (slot === 'marcos') {
    if (state.settings.hide3dFrames) return;
    group = buildFramePiece(c, qf, avatar);
    avatar.cosmetics.frame = group;
  } else if (slot === 'mascota') group = buildPetPiece(c, qf, avatar);
  else if (slot === 'estela') group = buildTrailPiece(c, qf, avatar);
  if (!group) return;
  var parent = chooseAnchorForCosmetic(c, avatar);
  if (slot === 'extras') parent = avatar.body;
  addPieceGroup(avatar, parent, group, c, avatar.cosmetics.animated, slot);
  if (slot === 'torso' && group.userData.coversBack && avatar.cape) avatar.cape.visible = false;
  avatar.cosmetics.slots[slot] = c.id;
}
function v22ApplyOutfitDelta(avatar, characterId, outfit) {
  if (!avatar) return false;
  if (!avatar.cosmetics) { applyOutfitToAvatar(avatar, characterId, outfit); return false; }
  var changed = false;
  var qf = effectQualityFactor();
  COSMETIC_SLOT_ORDER.forEach(function (slot) {
    var now = outfit[slot] || null;
    var prev = avatar.cosmetics.slots[slot] || null;
    if (now === prev) return;
    changed = true;
    v22RemoveSlotGroups(avatar, slot);
    if (now) {
      var c = COSMETIC_BY_ID[now];
      if (c) v22AttachSlot(avatar, c, slot, qf);
    }
  });
  var parts = cosmeticBaseParts(avatar);
  var hasHeadOrHair = !!(outfit.cabeza || outfit.peinado);
  setBaseGroupsVisible(parts.baseHatGroups, !hasHeadOrHair);
  var hideHair = !!(outfit.peinado || (outfit.cabeza && HEAD_COSMETIC_HIDES_HAIR[outfit.cabeza]));
  setBaseGroupsVisible(parts.baseHairGroups, !hideHair);
  if (avatar.hairTail) avatar.hairTail.visible = !outfit.peinado;
  if (avatar.cape) {
    var torso = outfit.torso ? COSMETIC_BY_ID[outfit.torso] : null;
    avatar.cape.visible = !(torso && (torso.id === 'c-torso-manto' || torso.id === 'c-torso-poncho' || torso.id === 'c-torso-abrigo' || torso.id === 'c-torso-bata' || torso.id === 'x-capa-errorario'));
  }
  avatar.cosmetics.title = outfit.titulo || null;
  return changed;
}
function v22PreviewOutfit() {
  if (V22.previewMode === 'shop') {
    var outfit = v22Clone(v22OutfitFor(state.collection.selectedCharacterId));
    if (V22.shopCompare) return outfit;
    if (V22.shopTryId && COSMETIC_BY_ID[V22.shopTryId]) outfit[COSMETIC_BY_ID[V22.shopTryId].category] = V22.shopTryId;
    return outfit;
  }
  return wardrobe.compareSaved ? v22Clone(wardrobe.saved) : v22Clone(wardrobe.draft);
}
function v22FramePreview(avatar, category) {
  var p = wardrobe.preview;
  if (!p || !avatar) return;
  var box = new THREE.Box3().setFromObject(avatar.root);
  var center = box.getCenter(new THREE.Vector3());
  var extent = box.getSize(new THREE.Vector3());
  var y = center.y, dist = 0;
  if (category === 'cabeza' || category === 'peinado' || category === 'amuletos' || category === 'accesorios') {
    y = Math.max(1.55, center.y + extent.y * 0.28); dist = Math.max(2.1, extent.y * 0.72);
  } else if (category === 'torso') {
    y = center.y; dist = Math.max(2.7, extent.y * 1.05);
  } else {
    y = center.y - extent.y * 0.02; dist = Math.max(3.2, extent.y * 1.55);
  }
  p.camera.position.set(center.x + dist * 0.24, y + extent.y * 0.08, center.z + dist);
  p.camera.lookAt(center.x, y, center.z);
  p.camera.fov = 26; p.camera.updateProjectionMatrix();
}
function updateWardrobeAvatar() {
  var p = wardrobe.preview;
  if (!p) return;
  var charId = V22.previewMode === 'shop' ? state.collection.selectedCharacterId : wardrobe.characterId;
  if (!charId) return;
  var outfit = v22PreviewOutfit();
  var key = charId + ':' + Object.keys(outfit).sort().map(function (k) { return k + '=' + outfit[k]; }).join(',') + ':' + V22.previewCategory;
  if (p.lastKey === key && p.avatar) return;
  if (!p.avatar || p.avatar.id !== charId) {
    if (p.avatar) { p.root.remove(p.avatar.root); disposeObject(p.avatar.root); }
    p.avatar = buildHeroAvatar(charId);
    applyOutfitToAvatar(p.avatar, charId, outfit);
    p.root.add(p.avatar.root);
  } else {
    v22ApplyOutfitDelta(p.avatar, charId, outfit);
  }
  p.lastKey = key;
  var look = heroLook(charId);
  p.ring.material.color.set(look.accent);
  p.glow.material.color.set(look.accent);
  v22FramePreview(p.avatar, V22.previewCategory);
}
function mountWardrobePreview() {
  var mount = v22ById('wardrobePreviewMount');
  if (!mount) return;
  var p = ensureWardrobePreview();
  if (p.canvas.parentNode !== mount) mount.insertBefore(p.canvas, mount.firstChild);
  p.canvas.style.width = '100%';
  p.canvas.style.height = '100%';
  p.canvas.style.display = 'block';
  V22.previewMode = 'wardrobe';
  V22.previewCategory = wardrobe.selectedId ? COSMETIC_BY_ID[wardrobe.selectedId].category : '';
  updateWardrobeAvatar();
}
function v22MountShopPreview() {
  var mount = v22ById('shopPreviewMount');
  if (!mount) return;
  var p = ensureWardrobePreview();
  if (p.canvas.parentNode !== mount) mount.insertBefore(p.canvas, mount.firstChild);
  p.canvas.style.width = '100%';
  p.canvas.style.height = '100%';
  p.canvas.style.display = 'block';
  V22.previewMode = 'shop';
  var c = shop.selectedId ? COSMETIC_BY_ID[shop.selectedId] : null;
  V22.previewCategory = c ? c.category : '';
  updateWardrobeAvatar();
}
function updateWardrobePreview(dt, time) {
  if (screen !== 'wardrobe' && screen !== 'shop') return;
  if (!wardrobe.preview || !wardrobe.preview.avatar) return;
  var p = wardrobe.preview;
  var av = p.avatar;
  av.root.rotation.y = wardrobe.rotation;
  av.body.position.y = Math.sin(time * 1.4) * 0.012;
  av.head.rotation.y = Math.sin(time * 0.55) * 0.025 + 0.1;
  av.leftArm.rotation.z = 0.04 + Math.sin(time * 0.8) * 0.012;
  av.rightArm.rotation.z = -0.04 - Math.sin(time * 0.8) * 0.012;
  animateAvatarCosmetics(av, dt, time, false, 0);
  if (p.ring) p.ring.rotation.z = time * 0.08;
  p.renderer.render(p.scene, p.camera);
}

/* -------------------------------------------------------------------------
   Duelo: red de seguridad para que el panel nunca salga del alto
   ------------------------------------------------------------------------- */
function v22FitDuelPanel() {
  if (screen !== 'duel') return;
  var panel = v22Q('.duelPanel');
  if (!panel) return;
  var rect = panel.getBoundingClientRect();
  var maxBottom = window.innerHeight - 8;
  if (rect.bottom > maxBottom + 1) {
    var nextH = Math.max(180, Math.floor(rect.height - (rect.bottom - maxBottom)));
    panel.style.setProperty('--v22-clamp-h', nextH + 'px');
    panel.classList.add('v22-duel-clamped');
    if (panel.scrollHeight > panel.clientHeight) panel.classList.add('v22-duel-scroll');
  }
  var body = v22Q('.duelPanelBody');
  if (body) body.classList.toggle('v22-can-scroll', body.scrollHeight > body.clientHeight + 2);
}
function v22DuelTick() {
  v22UpdateMapLabels();
  if (screen !== 'duel') return;
  var now = Date.now();
  if (now - V22.lastDuelFit < 240) return;
  V22.lastDuelFit = now;
  v22FitDuelPanel();
}

/* -------------------------------------------------------------------------
   Atrio: etiquetas que se desvanecen con la distancia
   ------------------------------------------------------------------------- */
function v22UpdateMapLabels() {
  if (typeof gateGroups === 'undefined' || !gateGroups || !camera) return;
  for (var i = 0; i < gateGroups.length; i++) {
    var g = gateGroups[i];
    if (!g || !g.label) continue;
    var d = camera.position.distanceTo(g.position);
    var op = d > 19 ? 0 : d < 11 ? 1 : (19 - d) / 8;
    if (g.label.material) g.label.material.opacity = op;
    g.label.visible = op > 0.05;
    if (g.label.visible) {
      var s = 2.2 + op * 0.1;
      g.label.scale.set(s, s * 0.294, 1);
    }
  }
}

/* -------------------------------------------------------------------------
   Resumen: microtexto consistente
   ------------------------------------------------------------------------- */
function v2smVerdictLine(result) {
  if (!result) return '';
  var total = v2smNumber(result.total) || v2smNumber(result.answered) || 0;
  var answered = v2smNumber(result.answered) || total;
  var correct = v2smNumber(result.correct);
  var accuracy = v2smAccuracy(result);
  var pieces = [];
  pieces.push('Respondiste ' + answered + ' de ' + total);
  pieces.push(correct + ' ' + (correct === 1 ? 'correcta' : 'correctas'));
  pieces.push(accuracy + ' % de precisión');
  return pieces.join(' · ') + '.';
}

/* -------------------------------------------------------------------------
   Avisos de almacenamiento: una vez, cierre, auto-ocultado e indicador
   ------------------------------------------------------------------------- */
function v22RemoveStorageBanner() {
  var old = v22ById('storageBanner') || v22Q('.storageBanner');
  if (old) { old.classList.add('is-hiding'); window.setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, 260); }
}
function v22ShowStorageIndicator() {
  if (v22ById('storageIndicator')) return;
  var el = document.createElement('button');
  el.type = 'button';
  el.id = 'storageIndicator';
  el.className = 'storageIndicator';
  el.setAttribute('data-action', 'storage-info');
  el.setAttribute('aria-label', 'El guardado local está bloqueado. Pulsa para saber más.');
  el.title = 'El guardado local está bloqueado. El progreso de esta sesión no se conservará al cerrar.';
  el.innerHTML = icon('alert', 13) + '<span>Sin guardado</span>';
  document.body.appendChild(el);
}
function showStorageWarning() {
  if (storageEnabled || V22.storageWarned) return;
  V22.storageWarned = true;
  v22ShowStorageIndicator();
  if (v22Q('.storageBanner')) return;
  var banner = document.createElement('div');
  banner.id = 'storageBanner';
  banner.className = 'storageBanner';
  banner.innerHTML = icon('alert', 15) + '<span><b>El navegador bloquea el guardado local.</b> El progreso de esta sesión no se conservará al cerrar. Exporta un respaldo cuando termines un nivel.</span><button type="button" class="btn btn--ghost btn--sm" data-action="export-save">Exportar</button><button type="button" class="storageBannerClose" data-action="storage-dismiss" aria-label="Cerrar aviso">' + icon('close', 14) + '</button>';
  document.body.appendChild(banner);
  var timer = window.setTimeout(function () { v22RemoveStorageBanner(); }, 6200);
  banner.addEventListener('mouseenter', function () { window.clearTimeout(timer); });
  banner.addEventListener('mouseleave', function () { timer = window.setTimeout(function () { v22RemoveStorageBanner(); }, 2600); });
}
function v22StorageInfo() {
  toast('El guardado local está bloqueado por el navegador. Exporta tu partida desde Ajustes o al cerrar un nivel; el progreso de esta sesión se mantiene mientras la pestaña siga abierta.', 'warn', 6200);
}
function v22AfterResult() {
  if (screen !== 'result') return;
  V22.resultRender++;
  if (storageEnabled) return;
  var foot = v22Q('.resultFoot .actions');
  if (!foot || foot.getAttribute('data-v22-export') === '1') return;
  foot.setAttribute('data-v22-export', '1');
  var b = document.createElement('button');
  b.type = 'button';
  b.className = 'btn btn--gold';
  b.setAttribute('data-action', 'export-save');
  b.innerHTML = icon('download', 14) + ' Exportar ahora';
  foot.insertBefore(b, foot.firstChild);
}

/* -------------------------------------------------------------------------
   Acciones nuevas
   ------------------------------------------------------------------------- */
document.addEventListener('click', function (event) {
  var t = event.target && event.target.closest ? event.target.closest('[data-action]') : null;
  if (!t) return;
  var action = t.getAttribute('data-action');
  if (action === 'shop-try') {
    event.preventDefault();
    var id = t.getAttribute('data-id');
    V22.shopTryId = V22.shopTryId === id ? null : id;
    V22.shopCompare = false;
    v22UpdateShopDetail();
    return;
  }
  if (action === 'shop-compare') {
    event.preventDefault();
    V22.shopCompare = !V22.shopCompare;
    if (wardrobe.preview) wardrobe.preview.lastKey = '';
    v22UpdateShopDetail();
    return;
  }
  if (action === 'shop-equip') {
    event.preventDefault();
    v22EquipSelected();
    return;
  }
  if (action === 'storage-dismiss') {
    event.preventDefault();
    v22RemoveStorageBanner();
    v22ShowStorageIndicator();
    return;
  }
  if (action === 'storage-info') {
    event.preventDefault();
    v22StorageInfo();
    return;
  }
});
document.addEventListener('change', function (event) {
  var t = event.target;
  if (!t || !t.matches) return;
  if (t.matches('[data-v22-shop-slot]')) { shop.slot = t.value; shop.selectedId = null; V22.shopTryId = null; v22UpdateShopCards(); return; }
  if (t.matches('[data-v22-shop-rarity]')) { shop.rarity = t.value; shop.selectedId = null; V22.shopTryId = null; v22UpdateShopCards(); return; }
  if (t.matches('[data-v22-wardrobe-rarity]')) { wardrobeSetRarity(t.value); return; }
});

/* Hidratación inicial y bucle ligero (etiquetas/duelo). */
V22.hydrate = function (root) { v22HydrateThumbs(root || document); };
V22.mountShop = function () { v22MountShopPreview(); v22HydrateThumbs(document); };
V22.afterResult = v22AfterResult;
V22.showStorageWarning = showStorageWarning;
V22.applyOutfitDelta = v22ApplyOutfitDelta;
V22.fitDuelPanel = v22FitDuelPanel;
try {
  window.__v22 = {
    version: V22.version,
    openShop: function () { openShop(); },
    openWardrobe: function () { openWardrobe(); },
    openHub: function () { enterHub(); },
    launchMission: function (id) { launchMission(id); },
    answer: function (letter) { answerCurrent(letter); },
    setScreen: function (name) { setScreen(name); },
    lastResult: function () { return lastResult || null; },
    screen: function () { return screen; },
    storageBlocked: function () { storageEnabled = false; showStorageWarning(); },
    thumbs: function () { return Object.keys(V22.thumbCache).length; },
    gateInfo: function () {
      if (typeof gateGroups === 'undefined' || !gateGroups) return [];
      return gateGroups.map(function (g) { return { area: g.area && g.area.id, label: !!g.label, opacity: g.label && g.label.material ? g.label.material.opacity : null, scale: g.label ? g.label.scale.x : null }; });
    },
    cosmeticSignatures: function () {
      try {
        var av = V22.thumbAvatar || buildHeroAvatar('noa');
        var out = [];
        ALL_COSMETICS.forEach(function (c) {
          var outfit = {}; outfit[c.category] = c.id;
          applyOutfitToAvatar(av, 'noa', outfit);
          var verts = 0, groups = 0, colors = {}, box = null;
          av.cosmetics.groups.forEach(function (g) {
            groups += 1;
            try { box = box ? box.union(new THREE.Box3().setFromObject(g)) : new THREE.Box3().setFromObject(g); } catch (e) {}
            g.traverse(function (n) {
              if (n.geometry && n.geometry.attributes && n.geometry.attributes.position) verts += n.geometry.attributes.position.count;
              if (n.material && n.material.color) colors[n.material.color.getHexString()] = 1;
            });
          });
          var size = [0, 0, 0];
          if (box) { var s = box.getSize(new THREE.Vector3()); size = [Math.round(s.x * 100) / 100, Math.round(s.y * 100) / 100, Math.round(s.z * 100) / 100]; }
          out.push({ id: c.id, category: c.category, groups: groups, verts: verts, colors: Object.keys(colors).length, size: size });
        });
        return out;
      } catch (e) { return []; }
    },
    fitAllHeroes: function () {
      try {
        var heroes = CAMP.characters.map(function (h) { return h.id; });
        var cases = 0, failures = [];
        heroes.forEach(function (heroId) {
          var av = buildHeroAvatar(heroId);
          ALL_COSMETICS.forEach(function (c) {
            cases += 1;
            try {
              var outfit = {}; outfit[c.category] = c.id;
              applyOutfitToAvatar(av, heroId, outfit);
              if (c.category !== 'titulo' && !av.cosmetics.groups.length) failures.push(heroId + ':' + c.id + ':sin-grupo');
              if (av.cosmetics.groups.length) {
                var box = new THREE.Box3().setFromObject(av.root);
                var size = box.getSize(new THREE.Vector3());
                if (!(size.y > 0.1 && size.y < 9 && size.x < 9 && size.z < 9)) failures.push(heroId + ':' + c.id + ':bbox');
              }
            } catch (e) { failures.push(heroId + ':' + c.id + ':error'); }
          });
          try { disposeObject(av.root); } catch (e) {}
        });
        return { cases: cases, failures: failures.slice(0, 24), count: failures.length, heroes: heroes.length };
      } catch (e) { return { cases: 0, failures: [String(e)], count: 1, heroes: 0 }; }
    },
    renderCount: 0
  };
} catch (e) {}
try {
  var v22StaleBanner = document.querySelector('.storageBanner');
  if (v22StaleBanner && v22StaleBanner.parentNode) v22StaleBanner.parentNode.removeChild(v22StaleBanner);
  if (!storageEnabled) showStorageWarning();
  window.setInterval(v22DuelTick, 300);
  window.setInterval(function () { if (!storageEnabled) showStorageWarning(); }, 2200);
  window.addEventListener('resize', function () { V22.lastDuelFit = 0; v22FitDuelPanel(); v22UpdateMapLabels(); }, { passive: true });
} catch (e) {}
