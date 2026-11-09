/* =========================================================================
   V2.3 · FASE 1 · AGENTE 3 · CATÁLOGO DE TIENDA E INVENTARIO
   -------------------------------------------------------------------------
   Propiedad exclusiva del Agente 3. Se carga después del visor.
   Puede leer cualquier archivo, pero solo escribe aquí (y en
   .work/v2.3/agents/agent3/).

   Decisiones simples documentadas en REPORTE.md:
   - La tienda abre en la colección «Originales» (los 33 de V2.2) para
     conservar el catálogo comercial histórico. El selector de colección
     permite consultar además Recompensas, Maestría, Títulos y Extras; los
     extras nunca se compran: muestran «Se gana» y su requisito.
   - «En tienda» = original sin poseer con nivel/logro cumplidos.
     «Bloqueados» = requisito pendiente o extra que se gana jugando.
   - Buscar/filtrar/ordenar vuelve arriba la cuadrícula (cambio de filtro);
     seleccionar, comprar y equipar conservan el scroll.
   - Miniaturas bajo demanda con IntersectionObserver (margen 160 px) sobre
     V22.thumbCache / v22RenderThumb. No se generan las 33/69 al abrir.
   - No se redefinen v22FramePreview, v22MountShopPreview,
     mountWardrobePreview, updateWardrobePreview ni el visor: solo se monta
     el catálogo alrededor de #shopPreviewMount y #wardrobePreviewMount.
   ========================================================================= */

var V23SHOP = {
  version: '2.3.0-a3',
  shopMounts: 0,
  wardrobeMounts: 0,
  thumbsGenerated: 0,
  thumbQueue: [],
  thumbQueued: {},
  thumbTimer: 0,
  observer: null,
  filterKeys: { shop: '', wardrobe: '' },
  searchTimer: 0,
  searchMode: '',
  canvasAtMount: null,
  canvasScreen: '',
  lastRefresh: '',
  errors: []
};

/* Valores por defecto en los objetos compartidos de V2.2 (solo campos nuevos). */
(function v23ShopStateDefaults() {
  try {
    if (typeof shop !== 'undefined' && shop) {
      if (typeof shop.query !== 'string') shop.query = '';
      if (!shop.status) shop.status = 'todos';
      if (!shop.collection) shop.collection = 'originales';
      if (!shop.sort) shop.sort = 'rareza';
    }
    if (typeof wardrobe !== 'undefined' && wardrobe) {
      if (typeof wardrobe.query !== 'string') wardrobe.query = '';
      if (!wardrobe.status) wardrobe.status = 'todos';
      if (!wardrobe.collection) wardrobe.collection = 'todos';
      if (!wardrobe.sort) wardrobe.sort = 'nombre';
    }
  } catch (e) { /* estado compartido aún no disponible */ }
})();

/* -------------------------------------------------------------------------
   Utilidades del catálogo
   ------------------------------------------------------------------------- */
function v23ShopMode(mode) { return mode === 'wardrobe' ? 'wardrobe' : 'shop'; }
function v23ShopFilters(mode) { return v23ShopMode(mode) === 'wardrobe' ? wardrobe : shop; }
function v23ShopGridId(mode) { return v23ShopMode(mode) === 'wardrobe' ? 'wardrobeItemsGrid' : 'shopGrid'; }
function v23ShopGridSel(mode) { return '#' + v23ShopGridId(mode); }
function v23ShopNormalize(text) {
  var s = String(text == null ? '' : text).toLowerCase();
  try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) {}
  return s;
}
function v23ShopLabel(text) { return v23Escape(text); }

var V23SHOP_COLLECTIONS = [
  { id: 'todos', label: 'Todos' },
  { id: 'originales', label: 'Originales' },
  { id: 'recompensas', label: 'Recompensas' },
  { id: 'maestria', label: 'Maestría' },
  { id: 'titulos', label: 'Títulos' },
  { id: 'extras', label: 'Extras' }
];
var V23SHOP_SHOP_STATUS = [
  { value: 'todos', label: 'Todos' },
  { value: 'poseidos', label: 'Poseídos' },
  { value: 'tienda', label: 'En tienda' },
  { value: 'bloqueados', label: 'Bloqueados' }
];
var V23SHOP_WARDROBE_STATUS = [
  { value: 'todos', label: 'Todos' },
  { value: 'poseidos', label: 'Solo poseídos' }
];
var V23SHOP_SORTS = [
  { value: 'rareza', label: 'Rareza' },
  { value: 'precio-asc', label: 'Precio ↑' },
  { value: 'precio-desc', label: 'Precio ↓' },
  { value: 'nombre', label: 'Nombre' }
];

function v23ShopCollectionOf(c) {
  if (!c) return 'extras';
  if (!isExtraCosmetic(c)) return 'originales';
  if (c.category === 'titulo') return 'titulos';
  var kind = c.unlockRequirements && c.unlockRequirements.kind;
  if (kind === 'areaMastery' || kind === 'areaMasteryGold' || kind === 'bossDefeated' || kind === 'bossMastery') return 'maestria';
  if (kind === 'streak' || kind === 'recoveries' || kind === 'onTimeReviewSessions' || kind === 'earlyReviewSessions') return 'recompensas';
  return 'extras';
}
function v23ShopInCollection(c, key) {
  if (!key || key === 'todos') return true;
  if (key === 'extras') return isExtraCosmetic(c);
  return v23ShopCollectionOf(c) === key;
}
function v23ShopStatusOf(c) {
  if (!c) return 'bloqueado';
  if (cosmeticOwned(c.id)) return 'poseido';
  if (isExtraCosmetic(c)) return 'extra';
  var info = null;
  try { info = cosmeticRequirementInfo(c); } catch (e) { info = null; }
  if (info && (info.levelOk === false || info.achievementOk === false)) return 'bloqueado';
  return 'tienda';
}
function v23ShopMatchesStatus(c, status) {
  if (!status || status === 'todos') return true;
  var st = v23ShopStatusOf(c);
  if (status === 'poseidos') return st === 'poseido';
  if (status === 'tienda') return st === 'tienda';
  if (status === 'bloqueados') return st === 'bloqueado' || st === 'extra';
  return true;
}
function v23ShopPrice(c) {
  var p = Number(c && c.price);
  return isFinite(p) && p > 0 ? p : null;
}
function v23ShopSort(list, key) {
  var arr = (list || []).slice();
  var byName = function (a, b) {
    try { return String(a.name).localeCompare(String(b.name), 'es'); } catch (e) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; }
  };
  arr.sort(function (a, b) {
    if (key === 'nombre') return byName(a, b);
    if (key === 'precio-asc' || key === 'precio-desc') {
      var pa = v23ShopPrice(a), pb = v23ShopPrice(b);
      if (pa == null && pb == null) return byName(a, b);
      if (pa == null) return 1;
      if (pb == null) return -1;
      if (pa !== pb) return key === 'precio-asc' ? pa - pb : pb - pa;
      return byName(a, b);
    }
    var ra = rarityUI(cosmeticRarityKey(a)).order;
    var rb = rarityUI(cosmeticRarityKey(b)).order;
    if (ra !== rb) return rb - ra;
    return byName(a, b);
  });
  return arr;
}
function v23ShopPool(mode) {
  var f = v23ShopFilters(mode);
  var out = [];
  ALL_COSMETICS.forEach(function (c) {
    if (v23ShopInCollection(c, f.collection)) out.push(c);
  });
  return out;
}
function v23ShopFilterList(mode) {
  var m = v23ShopMode(mode);
  var f = v23ShopFilters(m);
  var slot = f.slot || 'todas';
  var rarity = f.rarity || 'todas';
  var q = v23ShopNormalize(f.query || '');
  var out = [];
  v23ShopPool(m).forEach(function (c) {
    if (slot !== 'todas' && c.category !== slot) return;
    if (rarity !== 'todas' && cosmeticRarityKey(c) !== rarity) return;
    if (m === 'shop') {
      if (!v23ShopMatchesStatus(c, f.status)) return;
    } else if (f.status === 'poseidos' && !cosmeticOwned(c.id)) return;
    if (q) {
      var hay = v23ShopNormalize(c.name + ' ' + (c.description || '') + ' ' + cosmeticSlotLabel(c.category) + ' ' + rarityUI(cosmeticRarityKey(c)).label);
      if (hay.indexOf(q) === -1) return;
    }
    out.push(c);
  });
  return v23ShopSort(out, m === 'shop' ? (f.sort || 'rareza') : (f.sort || 'nombre'));
}
function v23ShopFilterKey(mode) {
  var f = v23ShopFilters(mode);
  return [v23ShopMode(mode), f.slot || '', f.rarity || '', f.status || '', f.collection || '', f.sort || '', v23ShopNormalize(f.query || '')].join('|');
}
function v23ShopEnsureSelection(mode, list) {
  var m = v23ShopMode(mode);
  var has = function (id) {
    for (var i = 0; i < (list || []).length; i++) if (list[i].id === id) return true;
    return false;
  };
  if (m === 'wardrobe') {
    if (wardrobe.selectedId && !has(wardrobe.selectedId)) wardrobe.selectedId = null;
    return;
  }
  if (shop.selectedId && has(shop.selectedId)) return;
  shop.selectedId = list && list.length ? list[0].id : null;
}

/* -------------------------------------------------------------------------
   Controles (opciones y selects)
   ------------------------------------------------------------------------- */
function v23ShopOptionHTML(value, label, selected) {
  return '<option value="' + esc(value) + '"' + (String(value) === String(selected) ? ' selected' : '') + '>' + esc(label) + '</option>';
}
function v23ShopSlotOptions() {
  var out = [{ value: 'todas', label: 'Todas las ranuras' }];
  COSMETIC_SLOT_ORDER.forEach(function (slot) { out.push({ value: slot, label: cosmeticSlotLabel(slot) }); });
  return out;
}
function v23ShopRarityOptions() {
  var out = [{ value: 'todas', label: 'Todas las rarezas' }];
  RARITY_ORDER.forEach(function (key) { out.push({ value: key, label: rarityUI(key).label }); });
  return out;
}
function v23ShopStatusOptions(mode) {
  return v23ShopMode(mode) === 'wardrobe' ? V23SHOP_WARDROBE_STATUS : V23SHOP_SHOP_STATUS;
}
function v23ShopCollectionOptions() {
  var counts = { todos: ALL_COSMETICS.length, originales: 0, recompensas: 0, maestria: 0, titulos: 0, extras: 0 };
  ALL_COSMETICS.forEach(function (c) {
    var key = v23ShopCollectionOf(c);
    if (counts[key] == null) counts[key] = 0;
    counts[key] += 1;
    if (isExtraCosmetic(c)) counts.extras = (counts.extras || 0) + 1;
  });
  /* «Extras» es el conjunto completo de extras (36), no un cuarto grupo. */
  counts.extras = 0;
  ALL_COSMETICS.forEach(function (c) { if (isExtraCosmetic(c)) counts.extras += 1; });
  return V23SHOP_COLLECTIONS.map(function (item) {
    var n = counts[item.id] == null ? 0 : counts[item.id];
    return { value: item.id, label: item.label + ' (' + n + ')' };
  });
}
function v23ShopSafeValue(options, value, fallback) {
  for (var i = 0; i < options.length; i++) if (String(options[i].value) === String(value)) return String(value);
  return fallback;
}
function v23ShopSelectHTML(mode, kind, options, value, label) {
  var m = v23ShopMode(mode);
  var current = v23ShopSafeValue(options, value, options.length ? options[0].value : '');
  var html = '<label class="v23Filter v23Filter--' + esc(kind) + '" data-v23-field="' + esc(kind) + '">' +
    '<span class="v23FilterLabel">' + esc(label) + '</span>' +
    '<select class="selectMini v23Select" data-v23-' + (kind === 'sort' ? 'sort' : 'filter-' + kind) + '="' + m + '" aria-label="' + esc(label) + '">';
  options.forEach(function (opt) { html += v23ShopOptionHTML(opt.value, opt.label, current); });
  html += '</select></label>';
  return html;
}
function v23ShopSearchHTML(mode) {
  var m = v23ShopMode(mode);
  var q = v23ShopFilters(m).query || '';
  return '<div class="v23Search' + (q ? ' is-on' : '') + '">' +
    '<input type="search" class="v23SearchInput" data-v23-search="' + m + '" autocomplete="off" spellcheck="false" placeholder="Buscar nombre o descripción" value="' + esc(q) + '" aria-label="Buscar cosméticos por nombre o descripción" />' +
    '<button type="button" class="v23SearchClear" data-v23-search-clear="' + m + '" aria-label="Limpiar búsqueda" title="Limpiar búsqueda">' + icon('close', 11) + '</button>' +
  '</div>';
}
function v23ShopSortHTML(mode) {
  var m = v23ShopMode(mode);
  var f = v23ShopFilters(m);
  return v23ShopSelectHTML(m, 'sort', V23SHOP_SORTS, f.sort || 'rareza', 'Orden');
}

/* -------------------------------------------------------------------------
   Cabeceras y estructura
   ------------------------------------------------------------------------- */
function v23ShopHeroLook(id) {
  try { return HERO_LOOKS[id] || { accent: 'var(--blue)', klass: '' }; } catch (e) { return { accent: 'var(--blue)', klass: '' }; }
}
function v23ShopHeaderHTML() {
  var ownedCount = 0;
  shopCosmetics().forEach(function (c) { if (cosmeticOwned(c.id)) ownedCount += 1; });
  return '<header class="sheetHead v22SheetHead v23ShopHead" data-v23-shop-head>' +
    '<div class="v23HeadMain">' +
      '<span class="eyebrow"><span class="kickerDot" style="background:var(--gold);box-shadow:0 0 12px var(--gold)"></span>Tienda de ecos</span>' +
      '<h1>Objetos que ya existían <em>en tu colección.</em></h1>' +
      '<p>Los 33 cosméticos originales conservan su precio y sus requisitos. Las recompensas y los extras muestran cómo se ganan. La compra se confirma con tu saldo.</p>' +
    '</div>' +
    '<div class="sheetHeadSide v23HeadSide">' +
      '<span class="chip chip--gold v23CoinsChip" data-v23-coins>' + icon('coin', 12) + ' <b data-v23-coins-value>◇' + formatNumber(state.coins) + '</b></span>' +
      '<span class="chip v23OwnedChip" data-v23-owned>' + ownedCount + '/33 originales</span>' +
      '<button type="button" class="btn btn--ghost btn--sm v23HeadAlt" data-action="open-wardrobe">Inventario</button>' +
      '<button type="button" class="sheetClose" data-action="close-sheet" aria-label="Cerrar">' + icon('close', 17) + '</button>' +
    '</div>' +
  '</header>';
}
function v23ShopRailHTML() {
  return '<aside class="panel shopRail v23ShopRail" data-v23-shop-rail>' +
    '<div class="v23RailHead"><span class="eyebrow noRule">Filtrar</span><button type="button" class="v23LinkBtn" data-v23-reset="shop">Limpiar</button></div>' +
    v23ShopSelectHTML('shop', 'slot', v23ShopSlotOptions(), shop.slot || 'todas', 'Ranura') +
    v23ShopSelectHTML('shop', 'rarity', v23ShopRarityOptions(), shop.rarity || 'todas', 'Rareza') +
    v23ShopSelectHTML('shop', 'status', v23ShopStatusOptions('shop'), shop.status || 'todos', 'Estado') +
    v23ShopSelectHTML('shop', 'collection', v23ShopCollectionOptions(), shop.collection || 'originales', 'Colección') +
    '<div class="sectionDivider v23RailDivider"></div>' +
    '<div class="shopNote v23ShopNote"><b>Monedas de estudio</b><p>Se ganan respondiendo y cerrando rutas. Tope de ◇120 al día; ya ganadas no se pierden.</p></div>' +
    '<button type="button" class="btn btn--ghost btn--sm btn--block v23RailInv" data-action="open-wardrobe">Ir al inventario ' + icon('chevronRight', 11) + '</button>' +
  '</aside>';
}
function v23ShopCatalogHeadHTML(list) {
  return '<div class="v23CatalogHead">' +
    '<div class="v23CatTitle"><h2>Catálogo</h2><span class="chip v23Count" data-v23-count aria-live="polite">' + list.length + ' resultados</span></div>' +
    v23ShopSearchHTML('shop') +
    v23ShopSortHTML('shop') +
  '</div>';
}
function v23ShopDetailHTML() {
  var char = CHARACTER_BY_ID[state.collection.selectedCharacterId] || CAMP.characters[0];
  var look = v23ShopHeroLook(char ? char.id : '');
  var selected = shop.selectedId ? COSMETIC_BY_ID[shop.selectedId] : null;
  return '<aside class="panel shopDetail v23Detail" data-v23-shop-detail>' +
    '<div class="cosmeticPreviewMount v23PreviewMount" id="shopPreviewMount">' +
      '<span class="previewHint">Arrastra para girar</span>' +
      '<span class="previewCorner v23PreviewCorner" data-v23-preview-corner style="--accent:' + look.accent + '">' + esc(char ? char.name : 'Héroe') + '<br /><small>Prueba en vivo</small></span>' +
    '</div>' +
    '<div class="shopDetailBody v23DetailBody" id="shopDetailBody">' + cosmeticDetailHTML(selected, 'shop') + '</div>' +
  '</aside>';
}
function shopScreenHTML() {
  V23SHOP.shopMounts += 1;
  var list = v23ShopFilterList('shop');
  v23ShopEnsureSelection('shop', list);
  var selected = shop.selectedId ? COSMETIC_BY_ID[shop.selectedId] : null;
  if (selected && !cosmeticOwned(selected.id)) V22.shopTryId = selected.id;
  V23SHOP.filterKeys.shop = v23ShopFilterKey('shop');
  V23SHOP.canvasScreen = '';
  var cards = v23ShopCardsHTML(list, 'shop');
  return '<div class="overlay v23Overlay v23ShopOverlay" data-v23-mode="shop">' +
    '<div class="overlayShell shopShell v23ShopShell" data-v23-shop-screen>' +
      v23ShopHeaderHTML() +
      '<div class="shopLayout v23ShopLayout">' +
        v23ShopRailHTML() +
        '<section class="panel shopList v23Catalog" data-v23-shop-catalog>' +
          v23ShopCatalogHeadHTML(list) +
          '<div class="cosmeticGrid shopGrid v23Grid" id="shopGrid" data-v23-grid="shop">' + cards + '</div>' +
        '</section>' +
        v23ShopDetailHTML() +
      '</div>' +
      '<div class="atlasFooter v23ShopFoot"><span>Los extras de constancia, repaso, dominio, jefes, mascotas y títulos no se venden: se ganan jugando.</span><span>' + icon('shield', 11) + ' Sin dinero real.</span></div>' +
    '</div></div>';
}

/* -------------------------------------------------------------------------
   Tarjetas compactas
   ------------------------------------------------------------------------- */
function v23ShopThumbHTML(c) {
  var cache = c ? V22.thumbCache[c.id] : '';
  if (cache) return '<img src="' + cache + '" alt="" draggable="false" />';
  return '<span class="v23ThumbPh" aria-hidden="true"></span>';
}
function cosmeticCardHTML(c, outfit, mode) {
  if (!c) return '';
  var inWardrobe = mode === 'specific';
  var status = v22StatusFor(c, mode);
  if (!inWardrobe) {
    var st = v23ShopStatusOf(c);
    if (st === 'extra') status = { label: 'Se gana', cls: 'is-reward' };
    else if (st === 'poseido') status = { label: 'Poseído', cls: 'is-owned' };
    else if (st === 'bloqueado') status = { label: 'Bloqueado', cls: 'is-locked' };
    else status = { label: 'En tienda', cls: 'is-shop' };
  }
  var rarity = v22Rarity(c);
  var owned = cosmeticOwned(c.id);
  var selected = inWardrobe ? wardrobe.selectedId === c.id : shop.selectedId === c.id;
  var price = '';
  if (!owned) {
    if (isExtraCosmetic(c)) price = '<span class="cosmeticCardPrice v23CardReward">Se gana</span>';
    else if (Number(c.price) > 0) price = '<span class="cosmeticCardPrice">◇' + formatNumber(c.price) + '</span>';
  }
  var cached = !!V22.thumbCache[c.id];
  var thumb = '<span class="cosmeticCardThumb v23CardThumb' + (cached ? ' is-ready' : '') + '" data-cosmetic-thumb="' + esc(c.id) + '"' + (cached ? ' data-thumb-ready="1"' : '') + '>' + v23ShopThumbHTML(c) + '</span>';
  var title = c.name + ' · ' + rarity.label + ' · ' + v22SlotLabel(c) + (owned ? '' : (isExtraCosmetic(c) ? ' · Se gana jugando' : (Number(c.price) > 0 ? ' · ◇' + formatNumber(c.price) : '')));
  return '<button type="button" class="cosmeticCard v23Card ' + status.cls + (selected ? ' is-selected' : '') + '" style="--rarity-color:' + rarity.color + '" data-action="' + (inWardrobe ? 'wardrobe-item' : 'shop-item') + '" data-id="' + esc(c.id) + '" data-v23-card="' + esc(c.id) + '" data-v23-rarity="' + esc(cosmeticRarityKey(c)) + '" aria-pressed="' + (selected ? 'true' : 'false') + '" title="' + esc(title) + '">' +
    thumb +
    '<span class="v23CardBody"><span class="cosmeticCardName">' + esc(c.name) + '</span><small class="v23CardMeta">' + esc(rarity.label) + ' · ' + esc(v22SlotLabel(c)) + '</small></span>' +
    '<span class="v23CardFoot"><span class="cosmeticCardStatus">' + esc(status.label) + '</span>' + price + '</span>' +
  '</button>';
}
function v23ShopEmptyHTML(mode) {
  var m = v23ShopMode(mode);
  return '<div class="wardrobeEmpty v23Empty">' +
    '<span class="eyebrow noRule">Sin resultados</span>' +
    '<h3>No hay cosméticos con ese filtro.</h3>' +
    '<p>Prueba otra colección, cambia la ranura o limpia la búsqueda.</p>' +
    '<button type="button" class="btn btn--ghost btn--sm" data-v23-reset="' + m + '">Limpiar filtros</button>' +
  '</div>';
}
function v23ShopCardsHTML(list, mode) {
  var m = v23ShopMode(mode);
  if (!list || !list.length) return v23ShopEmptyHTML(m);
  var outfit = m === 'shop' ? v22OutfitFor(state.collection.selectedCharacterId) : wardrobe.saved;
  return list.map(function (c) { return cosmeticCardHTML(c, outfit, m === 'shop' ? 'shop' : 'specific'); }).join('');
}

/* -------------------------------------------------------------------------
   Miniaturas bajo demanda (IntersectionObserver + caché de V2.2)
   ------------------------------------------------------------------------- */
function v23ShopEnsureObserver() {
  if (V23SHOP.observer || typeof IntersectionObserver === 'undefined') return V23SHOP.observer;
  try {
    V23SHOP.observer = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (!entry.isIntersecting) continue;
        var node = entry.target;
        try { V23SHOP.observer.unobserve(node); } catch (e) {}
        var id = node.getAttribute('data-cosmetic-thumb');
        if (!id) continue;
        if (V22.thumbCache[id]) v23ShopPaintThumb(node, id);
        else v23ShopQueueThumb(id);
      }
    }, { root: null, rootMargin: '160px 0px', threshold: 0.01 });
  } catch (e) {
    V23SHOP.observer = null;
  }
  return V23SHOP.observer;
}
function v23ShopResetObserver() {
  if (!V23SHOP.observer) return;
  try { V23SHOP.observer.disconnect(); } catch (e) {}
}
function v23ShopPaintThumb(node, id) {
  var src = V22.thumbCache[id];
  if (!node || !src) return false;
  if (node.getAttribute('data-thumb-ready') === '1' && v22Q('img', node)) return true;
  node.innerHTML = '<img src="' + src + '" alt="" draggable="false" />';
  node.setAttribute('data-thumb-ready', '1');
  node.classList.add('is-ready');
  return true;
}
function v23ShopQueueThumb(id) {
  if (!id || V22.thumbCache[id] || V23SHOP.thumbQueued[id]) return;
  V23SHOP.thumbQueued[id] = true;
  V23SHOP.thumbQueue.push(id);
  v23ShopPumpThumbs();
}
function v23ShopPumpThumbs() {
  if (V23SHOP.thumbTimer || !V23SHOP.thumbQueue.length) return;
  V23SHOP.thumbTimer = window.setTimeout(function () {
    V23SHOP.thumbTimer = 0;
    var id = V23SHOP.thumbQueue.shift();
    if (!id) return;
    delete V23SHOP.thumbQueued[id];
    if (!V22.thumbCache[id]) {
      var c = COSMETIC_BY_ID[id];
      if (c) {
        var data = '';
        try { data = v22RenderThumb(c) || ''; } catch (e) { data = ''; }
        if (data) {
          V22.thumbCache[id] = data;
          V23SHOP.thumbsGenerated += 1;
        }
      }
    }
    if (V22.thumbCache[id]) {
      v23QA('[data-cosmetic-thumb="' + id.replace(/"/g, '\\"') + '"]').forEach(function (node) { v23ShopPaintThumb(node, id); });
    }
    if (V23SHOP.thumbQueue.length) v23ShopPumpThumbs();
  }, 12);
}
/* Reemplazo perezoso del hidratador de V2.2: nunca encola el catálogo entero. */
function v22HydrateThumbs(root) {
  var scope = root || document;
  var nodes = v23QA('[data-cosmetic-thumb]', scope);
  if (!nodes.length) return;
  var observer = v23ShopEnsureObserver();
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (node.getAttribute('data-thumb-ready') === '1') continue;
    var id = node.getAttribute('data-cosmetic-thumb');
    if (!id) continue;
    if (V22.thumbCache[id]) { v23ShopPaintThumb(node, id); continue; }
    if (!observer) { v23ShopQueueThumb(id); continue; }
    try { observer.observe(node); } catch (e) { v23ShopQueueThumb(id); }
  }
}

/* -------------------------------------------------------------------------
   Inventario (misma compactación y filtros; mounts del Agente 2 intactos)
   ------------------------------------------------------------------------- */
function v23WardrobeHeadHTML() {
  var characterId = wardrobe.characterId || state.collection.selectedCharacterId;
  var char = CHARACTER_BY_ID[characterId] || CAMP.characters[0];
  var look = v23ShopHeroLook(char ? char.id : '');
  return '<header class="sheetHead v22SheetHead v23WardrobeHead" data-v23-wardrobe-head>' +
    '<div class="v23HeadMain">' +
      '<span class="eyebrow"><span class="kickerDot" style="background:' + look.accent + '"></span>Estudio de equipamiento</span>' +
      '<h1>El atuendo <em>se prueba antes de salir.</em></h1>' +
      '<p>Gira el héroe, compara y guarda. Solo se equipan piezas que ya posees; las bloqueadas muestran su requisito.</p>' +
    '</div>' +
    '<div class="sheetHeadSide v23HeadSide">' +
      '<span class="chip" data-v23-owned-cosmetics>' + cosmeticsOwnedCountLabel() + ' cosméticos</span>' +
      '<span class="chip">' + state.collection.ownedCharacterIds.length + '/10 héroes</span>' +
      '<button type="button" class="btn btn--ghost btn--sm v23HeadAlt" data-action="open-shop">Tienda</button>' +
      '<button type="button" class="sheetClose" data-action="close-sheet" aria-label="Cerrar">' + icon('close', 17) + '</button>' +
    '</div>' +
  '</header>';
}
function v23WardrobeHeroBarHTML(characterId) {
  var heroTabs = state.collection.ownedCharacterIds.map(function (id) {
    var c = CHARACTER_BY_ID[id];
    if (!c) return '';
    return '<button type="button" class="miniHeroTab v23HeroTab ' + (id === characterId ? 'is-active' : '') + '" data-action="wardrobe-hero" data-hero="' + esc(id) + '" data-v23-hero="' + esc(id) + '">' + esc(c.name.split(' ')[0]) + '</button>';
  }).join('');
  return '<div class="wardrobeHeroBar v23HeroBar">' +
    '<span class="eyebrow noRule">Héroe</span>' +
    '<div class="miniHeroTabs v23HeroTabs">' + heroTabs + '</div>' +
    '<span class="wardrobeTitle v23WardrobeTitle">Título: <b data-v23-title>' + esc(titleText(characterId) || 'sin título') + '</b></span>' +
  '</div>';
}
function v23WardrobeStageMetaHTML() {
  var currentSaved = Object.keys(wardrobe.saved || {}).length;
  var currentDraft = Object.keys(wardrobe.draft || {}).length;
  var dirty = wardrobeDirty();
  return '<div class="compareStrip v23CompareStrip"><span><b>Ahora</b><br />' + (currentSaved ? currentSaved + ' ' + plural(currentSaved, 'pieza', 'piezas') : 'sin cosméticos') + '</span>' + icon('arrowRight', 14) + '<span><b>Borrador</b><br />' + (currentDraft ? currentDraft + ' ' + plural(currentDraft, 'pieza', 'piezas') : 'sin cosméticos') + '</span></div>' +
    '<div class="wardrobeActions v23WardrobeActions">' +
      '<button type="button" class="btn btn--ghost btn--sm" data-action="wardrobe-compare">' + (wardrobe.compareSaved ? icon('layers', 13) + ' Ver borrador' : icon('eye', 13) + ' Ver atuendo actual') + '</button>' +
      '<button type="button" class="btn btn--quiet btn--sm" data-action="wardrobe-discard" ' + (dirty ? '' : 'disabled') + '>Descartar</button>' +
      '<button type="button" class="btn btn--primary btn--sm" data-action="wardrobe-save" ' + (dirty ? '' : 'disabled') + '>' + icon('check', 13) + ' Guardar atuendo</button>' +
    '</div>';
}
function v23WardrobeStageHTML(char, look) {
  return '<aside class="panel wardrobeStage v23WardrobeStage">' +
    '<div class="previewMount v23PreviewMount" id="wardrobePreviewMount">' +
      '<div class="previewHint">Arrastra para girar</div>' +
      '<div class="previewCorner v23PreviewCorner" data-v23-preview-corner style="--accent:' + look.accent + '">' + esc(char.name) + '<br /><small>' + esc(look.klass) + '</small></div>' +
    '</div>' +
    '<div class="v23StageMeta" data-v23-stage-meta>' + v23WardrobeStageMetaHTML() + '</div>' +
  '</aside>';
}
function v23WardrobeSlotChipsHTML() {
  var pool = v23ShopPool('wardrobe');
  var counts = {};
  pool.forEach(function (c) { counts[c.category] = (counts[c.category] || 0) + 1; });
  var slots = ['todas'].concat(COSMETIC_SLOT_ORDER.filter(function (s) { return counts[s]; }));
  return '<div class="v23SlotChips" data-v23-slot-chips>' + slots.map(function (s) {
    var active = (wardrobe.slot || 'cabeza') === s;
    return '<button type="button" class="v23SlotChip' + (active ? ' is-active' : '') + '" data-action="wardrobe-slot" data-slot="' + esc(s) + '" data-v23-slot="' + esc(s) + '" aria-pressed="' + (active ? 'true' : 'false') + '">' + esc(s === 'todas' ? 'Todas' : cosmeticSlotLabel(s)) + '<small>' + (counts[s] || pool.length) + '</small></button>';
  }).join('') + '</div>';
}
function v23WardrobeToolsHTML(list) {
  var f = wardrobe;
  return '<div class="v23WardrobeTools">' +
    v23WardrobeSlotChipsHTML() +
    '<div class="v23WardrobeRow">' +
      v23ShopSearchHTML('wardrobe') +
      v23ShopSelectHTML('wardrobe', 'rarity', v23ShopRarityOptions(), f.rarity || 'todas', 'Rareza') +
      v23ShopSelectHTML('wardrobe', 'status', v23ShopStatusOptions('wardrobe'), f.status || 'todos', 'Estado') +
      v23ShopSelectHTML('wardrobe', 'collection', v23ShopCollectionOptions(), f.collection || 'todos', 'Colección') +
      v23ShopSortHTML('wardrobe') +
      '<span class="chip v23Count" data-v23-count aria-live="polite">' + list.length + ' piezas</span>' +
    '</div>' +
  '</div>';
}
function wardrobeScreenHTML() {
  V23SHOP.wardrobeMounts += 1;
  var characterId = wardrobe.characterId || state.collection.selectedCharacterId;
  var char = CHARACTER_BY_ID[characterId] || CAMP.characters[0];
  var look = v23ShopHeroLook(char ? char.id : '');
  var list = v23ShopFilterList('wardrobe');
  v23ShopEnsureSelection('wardrobe', list);
  var selected = wardrobe.selectedId ? COSMETIC_BY_ID[wardrobe.selectedId] : null;
  V23SHOP.filterKeys.wardrobe = v23ShopFilterKey('wardrobe');
  return '<div class="overlay v23Overlay v23WardrobeOverlay" data-v23-mode="wardrobe">' +
    '<div class="overlayShell wardrobeShell v23WardrobeShell" data-v23-wardrobe-screen>' +
      v23WardrobeHeadHTML() +
      v23WardrobeHeroBarHTML(characterId) +
      '<div class="wardrobeGrid v23WardrobeGrid">' +
        v23WardrobeStageHTML(char, look) +
        '<section class="panel wardrobeItems v23WardrobeItems">' +
          v23WardrobeToolsHTML(list) +
          '<div class="cosmeticGrid wardrobeGridItems v23Grid" id="wardrobeItemsGrid" data-v23-grid="wardrobe">' + v23ShopCardsHTML(list, 'wardrobe') + '</div>' +
          '<div class="cosmeticDetail v23WardrobeDetail" id="wardrobeDetail">' + cosmeticDetailHTML(selected, 'specific') + '</div>' +
        '</section>' +
      '</div>' +
      '<div class="atlasFooter v23WardrobeFoot"><span>El borrador no se guarda hasta pulsar «Guardar atuendo». La vista 3D respeta las capas base y las anclas de identidad.</span><span>' + icon('spark', 11) + ' Arrastra el héroe para girarlo.</span></div>' +
    '</div></div>';
}

/* -------------------------------------------------------------------------
   Actualizaciones incrementales (sin renderScreen)
   ------------------------------------------------------------------------- */
function v23ShopCountEl() { return v22Q('[data-v23-count]'); }
function v23ShopSyncCount(mode, list) {
  var el = v23ShopCountEl();
  if (!el) return;
  el.textContent = list.length + (v23ShopMode(mode) === 'shop' ? ' resultados' : ' piezas');
  el.setAttribute('data-v23-total', String(list.length));
}
function v23ShopSyncChrome(mode) {
  var m = v23ShopMode(mode);
  if (m === 'shop') {
    var coins = v22Q('[data-v23-coins-value]');
    if (coins) coins.textContent = '◇' + formatNumber(state.coins);
    var owned = v22Q('[data-v23-owned]');
    if (owned) {
      var n = 0;
      shopCosmetics().forEach(function (c) { if (cosmeticOwned(c.id)) n += 1; });
      owned.textContent = n + '/33 originales';
    }
    return;
  }
  var ownedChip = v22Q('[data-v23-owned-cosmetics]');
  if (ownedChip) ownedChip.textContent = cosmeticsOwnedCountLabel() + ' cosméticos';
  var title = v22Q('[data-v23-title]');
  if (title) title.textContent = titleText(wardrobe.characterId || state.collection.selectedCharacterId) || 'sin título';
  var char = CHARACTER_BY_ID[wardrobe.characterId || state.collection.selectedCharacterId] || CAMP.characters[0];
  var look = v23ShopHeroLook(char ? char.id : '');
  var corner = v22Q('[data-v23-preview-corner]');
  if (corner && char) corner.innerHTML = esc(char.name) + '<br /><small>' + esc(look.klass) + '</small>';
  var meta = v22Q('[data-v23-stage-meta]');
  if (meta) meta.innerHTML = v23WardrobeStageMetaHTML();
  var heroId = wardrobe.characterId || state.collection.selectedCharacterId;
  v23QA('[data-v23-hero]').forEach(function (btn) {
    var on = btn.getAttribute('data-v23-hero') === heroId;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}
function v22UpdateShopCardSelection() {
  v23QA('#shopGrid [data-v23-card]').forEach(function (card) {
    var on = card.getAttribute('data-id') === shop.selectedId;
    card.classList.toggle('is-selected', on);
    card.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}
function v23ShopUpdateSelection(rootSel, selectedId) {
  v23QA((rootSel || '') + ' [data-v23-card]').forEach(function (card) {
    var on = card.getAttribute('data-id') === selectedId;
    card.classList.toggle('is-selected', on);
    card.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}
function v22UpdateShopDetail() {
  if (screen !== 'shop') return;
  var body = v22ById('shopDetailBody');
  var selected = shop.selectedId ? COSMETIC_BY_ID[shop.selectedId] : null;
  if (body) body.innerHTML = cosmeticDetailHTML(selected, 'shop');
  v22UpdateShopCardSelection();
  v23ShopSyncChrome('shop');
  try { v22UpdateShopPreview(); } catch (e) {}
}
function v23ShopRefresh(opts) {
  opts = opts || {};
  if (screen !== 'shop') return false;
  var grid = v22ById('shopGrid');
  if (!grid) return false;
  var list = v23ShopFilterList('shop');
  v23ShopEnsureSelection('shop', list);
  var scrollTop = opts.resetScroll ? 0 : grid.scrollTop;
  v23ShopResetObserver();
  grid.innerHTML = v23ShopCardsHTML(list, 'shop');
  grid.scrollTop = scrollTop;
  v22HydrateThumbs(grid);
  v23ShopSyncCount('shop', list);
  v22UpdateShopDetail();
  V23SHOP.lastRefresh = 'shop';
  return true;
}
function v22UpdateShopCards() { v23ShopRefresh({ resetScroll: false, reason: 'cards' }); }
function v23WardrobeApplyPreview() {
  try {
    if (wardrobe.preview) wardrobe.preview.lastKey = '';
    if (v22ById('wardrobePreviewMount') && typeof mountWardrobePreview === 'function') mountWardrobePreview();
    else if (typeof updateWardrobeAvatar === 'function') updateWardrobeAvatar();
  } catch (e) { V23SHOP.errors.push('preview: ' + (e && e.message || e)); }
}
function v23WardrobeRefresh(opts) {
  opts = opts || {};
  if (screen !== 'wardrobe') return false;
  var grid = v22ById('wardrobeItemsGrid');
  if (!grid) return false;
  var list = v23ShopFilterList('wardrobe');
  v23ShopEnsureSelection('wardrobe', list);
  var scrollTop = opts.resetScroll ? 0 : grid.scrollTop;
  v23ShopResetObserver();
  grid.innerHTML = v23ShopCardsHTML(list, 'wardrobe');
  grid.scrollTop = scrollTop;
  v22HydrateThumbs(grid);
  v23ShopSyncCount('wardrobe', list);
  var selected = wardrobe.selectedId ? COSMETIC_BY_ID[wardrobe.selectedId] : null;
  var detail = v22ById('wardrobeDetail');
  if (detail) detail.innerHTML = cosmeticDetailHTML(selected, 'specific');
  v23ShopSyncChrome('wardrobe');
  v23WardrobeApplyPreview();
  V23SHOP.lastRefresh = 'wardrobe';
  return true;
}
function v22UpdateWardrobeItems() { return v23WardrobeRefresh({ resetScroll: false, reason: 'items' }); }
function v23ShopSyncControls(mode) {
  var m = v23ShopMode(mode);
  var f = v23ShopFilters(m);
  ['slot', 'rarity', 'status', 'collection'].forEach(function (kind) {
    var sel = v22Q('[data-v23-filter-' + kind + '="' + m + '"]');
    if (!sel) return;
    var value = String(f[kind] == null ? '' : f[kind]);
    if (sel.value === value) return;
    var exists = v23QA('option', sel).some(function (o) { return o.value === value; });
    if (exists) sel.value = value;
  });
  var sortSel = v22Q('[data-v23-sort="' + m + '"]');
  if (sortSel && sortSel.value !== String(f.sort || '')) sortSel.value = f.sort;
  var input = v22Q('[data-v23-search="' + m + '"]');
  if (input && input.value !== (f.query || '')) input.value = f.query || '';
  var box = input && input.parentNode && input.parentNode.classList ? input.parentNode : null;
  if (box) box.classList.toggle('is-on', !!(f.query && String(f.query).length));
}
function v23ShopApply(mode, reason) {
  var m = v23ShopMode(mode);
  var key = v23ShopFilterKey(m);
  var reset = key !== V23SHOP.filterKeys[m];
  V23SHOP.filterKeys[m] = key;
  if (m === 'shop') v23ShopRefresh({ resetScroll: reset, reason: reason });
  else v23WardrobeRefresh({ resetScroll: reset, reason: reason });
  v23ShopSyncControls(m);
  return true;
}
function v23ShopResetFilters(mode, useDefaults) {
  var m = v23ShopMode(mode);
  var f = v23ShopFilters(m);
  f.query = '';
  f.rarity = 'todas';
  if (m === 'shop') {
    f.slot = 'todas';
    f.status = 'todos';
    f.collection = useDefaults ? 'originales' : 'todos';
    f.sort = 'rareza';
    shop.confirmId = null;
  } else {
    f.slot = useDefaults ? 'cabeza' : 'todas';
    f.status = 'todos';
    f.collection = 'todos';
    f.sort = 'nombre';
    wardrobe.selectedId = null;
    wardrobe.compareSaved = false;
  }
  V23SHOP.filterKeys[m] = '';
  v23ShopApply(m, 'reset');
  return true;
}

/* -------------------------------------------------------------------------
   Selección y compra (solo tarjeta, contador, saldo y detalle)
   ------------------------------------------------------------------------- */
function v23ShopFindCard(id) {
  var cards = v23QA('[data-v23-card]');
  for (var i = 0; i < cards.length; i++) if (cards[i].getAttribute('data-id') === id) return cards[i];
  return null;
}
function v23ShopPatchCard(id) {
  var mode = screen === 'wardrobe' ? 'wardrobe' : (screen === 'shop' ? 'shop' : '');
  if (!mode) return false;
  var grid = v22ById(v23ShopGridId(mode));
  var card = v23ShopFindCard(id);
  if (!grid || !card) return false;
  var list = v23ShopFilterList(mode);
  var still = false;
  for (var i = 0; i < list.length; i++) if (list[i].id === id) { still = true; break; }
  if (!still) {
    card.parentNode.removeChild(card);
    if (!v23QA('[data-v23-card]', grid).length) grid.innerHTML = v23ShopEmptyHTML(mode);
    else v22HydrateThumbs(grid);
    v23ShopSyncCount(mode, list);
    return true;
  }
  var c = COSMETIC_BY_ID[id];
  if (!c) return false;
  var outfit = mode === 'shop' ? v22OutfitFor(state.collection.selectedCharacterId) : wardrobe.saved;
  var wrap = document.createElement('div');
  wrap.innerHTML = cosmeticCardHTML(c, outfit, mode === 'shop' ? 'shop' : 'specific');
  var next = wrap.firstChild;
  if (!next) return false;
  card.parentNode.replaceChild(next, card);
  v22HydrateThumbs(grid);
  v23ShopUpdateSelection('#' + v23ShopGridId(mode), mode === 'shop' ? shop.selectedId : wardrobe.selectedId);
  v23ShopSyncCount(mode, list);
  return true;
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
  V22.shopTryId = id;
  v22UpdateShopDetail();
  var body = v22ById('shopDetailBody');
  if (body) body.scrollTop = body.scrollHeight;
  sfxClick();
}
function shopCancelBuy() {
  shop.confirmId = null;
  v22UpdateShopDetail();
}
function shopConfirmBuy(id) {
  var result = buyCosmetic(id);
  if (!result.ok) {
    toast(result.reason, 'warn', 4200);
    shop.confirmId = null;
    v22UpdateShopDetail();
    return;
  }
  shop.confirmId = null;
  V22.shopTryId = id;
  toast('«' + result.cosmetic.name + '» comprado por ◇' + formatNumber(result.price) + '. Ya está en tu colección.', 'success', 4200);
  v23ShopPatchCard(id);
  v23ShopSyncChrome('shop');
  v22UpdateShopDetail();
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
  v23ShopPatchCard(c.id);
  v22UpdateShopDetail();
  toast('«' + c.name + '» equipado en ' + (CHARACTER_BY_ID[charId] ? CHARACTER_BY_ID[charId].name : 'el héroe') + '.', 'success', 2600);
  sfxSelect();
}

/* -------------------------------------------------------------------------
   Inventario: selección, ranura, rareza y héroe sin renderScreen
   ------------------------------------------------------------------------- */
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
  v23WardrobeRefresh({ resetScroll: false, reason: 'item' });
  sfxSelect();
}
function wardrobeSetSlot(slot) {
  wardrobe.slot = slot || 'cabeza';
  wardrobe.selectedId = null;
  wardrobe.compareSaved = false;
  v23ShopApply('wardrobe', 'slot');
  return true;
}
function wardrobeSetRarity(rarity) {
  wardrobe.rarity = rarity || 'todas';
  v23ShopApply('wardrobe', 'rarity');
  return true;
}
function wardrobeCharacterSwitch(id) {
  if (state.collection.ownedCharacterIds.indexOf(id) === -1) return;
  if (wardrobe.characterId === id) return;
  wardrobe.characterId = id;
  wardrobe.saved = getCharacterOutfit(id);
  wardrobe.draft = v22Clone(wardrobe.saved);
  wardrobe.selectedId = null;
  wardrobe.compareSaved = false;
  wardrobe.previewDirty = true;
  v23WardrobeRefresh({ resetScroll: true, reason: 'hero' });
  return true;
}

/* -------------------------------------------------------------------------
   Montaje: se envuelve V22.mountShop para montar visor + detalle + miniaturas
   ------------------------------------------------------------------------- */
(function v23ShopMountHooks() {
  try {
    var previousMountShop = V22.mountShop;
    V22.mountShop = function v23MountShop() {
      if (typeof previousMountShop === 'function') previousMountShop();
      try {
        V23SHOP.canvasAtMount = v22Q('#shopPreviewMount canvas') || V23SHOP.canvasAtMount;
        V23SHOP.canvasScreen = 'shop';
        var grid = v22ById('shopGrid');
        v22HydrateThumbs(grid || document);
        V23.flags.shopMounted = true;
        V23.flags.catalogReady = true;
      } catch (e) {
        V23SHOP.errors.push('mountShop: ' + (e && e.message || e));
      }
    };
  } catch (e) {
    V23SHOP.errors.push('hook mountShop: ' + (e && e.message || e));
  }
  try {
    var previousHydrate = V22.hydrate;
    V22.hydrate = function v23Hydrate(root) {
      if (typeof previousHydrate === 'function') {
        try { previousHydrate(root); } catch (e) {}
      }
      v22HydrateThumbs(root || document);
    };
  } catch (e) {
    V23SHOP.errors.push('hook hydrate: ' + (e && e.message || e));
  }
})();

/* -------------------------------------------------------------------------
   Eventos delegados (input/change/click) sobre la pantalla actual
   ------------------------------------------------------------------------- */
document.addEventListener('input', function (event) {
  var t = event.target;
  if (!t || !t.getAttribute) return;
  var mode = t.getAttribute('data-v23-search');
  if (!mode) return;
  var m = v23ShopMode(mode);
  var f = v23ShopFilters(m);
  f.query = t.value;
  var box = t.parentNode;
  if (box && box.classList) box.classList.toggle('is-on', !!t.value);
  if (V23SHOP.searchTimer) window.clearTimeout(V23SHOP.searchTimer);
  V23SHOP.searchMode = m;
  V23SHOP.searchTimer = window.setTimeout(function () {
    V23SHOP.searchTimer = 0;
    v23ShopApply(V23SHOP.searchMode, 'search');
  }, 150);
});
document.addEventListener('change', function (event) {
  var t = event.target;
  if (!t || !t.getAttribute) return;
  var sortMode = t.getAttribute('data-v23-sort');
  if (sortMode) {
    var ms = v23ShopMode(sortMode);
    v23ShopFilters(ms).sort = t.value || 'rareza';
    v23ShopApply(ms, 'sort');
    return;
  }
  var kinds = ['slot', 'rarity', 'status', 'collection'];
  for (var i = 0; i < kinds.length; i++) {
    var mode = t.getAttribute('data-v23-filter-' + kinds[i]);
    if (!mode) continue;
    var m = v23ShopMode(mode);
    var f = v23ShopFilters(m);
    f[kinds[i]] = t.value;
    if (kinds[i] === 'slot' && !f[kinds[i]]) f.slot = 'todas';
    if (kinds[i] === 'rarity' && !f[kinds[i]]) f.rarity = 'todas';
    if (kinds[i] === 'status' && !f[kinds[i]]) f.status = 'todos';
    if (kinds[i] === 'collection' && !f[kinds[i]]) f.collection = 'todos';
    if (m === 'wardrobe' && kinds[i] === 'slot') { wardrobe.selectedId = null; wardrobe.compareSaved = false; }
    v23ShopApply(m, 'filter');
    return;
  }
});
document.addEventListener('click', function (event) {
  var t = event.target && event.target.closest ? event.target.closest('[data-v23-reset], [data-v23-search-clear]') : null;
  if (!t) return;
  var resetMode = t.getAttribute('data-v23-reset');
  if (resetMode) {
    event.preventDefault();
    v23ShopResetFilters(resetMode, false);
    return;
  }
  var clearMode = t.getAttribute('data-v23-search-clear');
  if (!clearMode) return;
  event.preventDefault();
  var m = v23ShopMode(clearMode);
  v23ShopFilters(m).query = '';
  var input = v22Q('[data-v23-search="' + m + '"]');
  if (input) {
    input.value = '';
    if (input.parentNode && input.parentNode.classList) input.parentNode.classList.remove('is-on');
    try { input.focus(); } catch (e) {}
  }
  v23ShopApply(m, 'search');
}, true);

/* -------------------------------------------------------------------------
   QA: estado, conteo por intersección real y API window.__v23Shop
   ------------------------------------------------------------------------- */
function v23ShopVisibleInfo(selector) {
  var grid = v22Q(selector);
  if (!grid) return null;
  var gr = grid.getBoundingClientRect();
  var vw = window.innerWidth || 0;
  var vh = window.innerHeight || 0;
  var left = Math.max(gr.left, 0);
  var right = Math.min(gr.right, vw);
  var top = Math.max(gr.top, 0);
  var bottom = Math.min(gr.bottom, vh);
  var cards = v23QA('.cosmeticCard', grid);
  var visible = 0;
  var fully = 0;
  var cardH = 0;
  for (var i = 0; i < cards.length; i++) {
    var r = cards[i].getBoundingClientRect();
    if (!cardH) cardH = r.height;
    var ix = Math.min(r.right, right) - Math.max(r.left, left);
    var iy = Math.min(r.bottom, bottom) - Math.max(r.top, top);
    if (ix > 1 && iy > 1) {
      visible += 1;
      if (ix >= r.width - 2 && iy >= r.height - 2) fully += 1;
    }
  }
  var columns = 0;
  try {
    var track = window.getComputedStyle(grid).gridTemplateColumns || '';
    columns = track.split(/\s+/).filter(function (x) { return x && x !== 'none'; }).length;
  } catch (e) { columns = 0; }
  return {
    total: cards.length,
    visible: visible,
    fullyVisible: fully,
    columns: columns,
    cardHeight: Math.round(cardH),
    grid: {
      x: Math.round(gr.x), y: Math.round(gr.y), w: Math.round(gr.width), h: Math.round(gr.height),
      clientH: grid.clientHeight, scrollH: grid.scrollHeight, scrollTop: Math.round(grid.scrollTop)
    }
  };
}
function v23ShopCanvasInfo() {
  var c = v22Q('#shopPreviewMount canvas') || v22Q('#wardrobePreviewMount canvas');
  if (!c) return null;
  var screenName = screen === 'wardrobe' ? 'wardrobe' : (screen === 'shop' ? 'shop' : '');
  if (V23SHOP.canvasScreen !== screenName || !V23SHOP.canvasAtMount) {
    V23SHOP.canvasScreen = screenName;
    V23SHOP.canvasAtMount = c;
  }
  var r = c.getBoundingClientRect();
  return {
    w: Math.round(r.width), h: Math.round(r.height),
    same: V23SHOP.canvasAtMount === c,
    canvasCount: document.querySelectorAll('canvas').length
  };
}
function v23ShopState() {
  var mode = screen === 'wardrobe' ? 'wardrobe' : (screen === 'shop' ? 'shop' : '');
  var info = mode ? v23ShopVisibleInfo(v23ShopGridSel(mode)) : null;
  var f = mode ? v23ShopFilters(mode) : null;
  var head = v22Q('[data-v23-shop-head]') || v22Q('[data-v23-wardrobe-head]');
  var shell = v22Q('.v23ShopShell') || v22Q('.v23WardrobeShell');
  var overlay = v22Q('.v23Overlay');
  var overflowX = false;
  try {
    overflowX = (document.documentElement.scrollWidth > window.innerWidth + 1) || (overlay ? overlay.scrollWidth > overlay.clientWidth + 1 : false);
  } catch (e) { overflowX = false; }
  var shellRect = shell ? shell.getBoundingClientRect() : null;
  return {
    screen: typeof screen === 'string' ? screen : null,
    mode: mode,
    filters: f ? { slot: f.slot, rarity: f.rarity, status: f.status, collection: f.collection, query: f.query, sort: f.sort } : null,
    selectedId: mode === 'wardrobe' ? wardrobe.selectedId : shop.selectedId,
    total: info ? info.total : 0,
    visible: info ? info.visible : 0,
    fullyVisible: info ? info.fullyVisible : 0,
    columns: info ? info.columns : 0,
    cardHeight: info ? info.cardHeight : 0,
    grid: info ? info.grid : null,
    headerH: head ? Math.round(head.getBoundingClientRect().height) : null,
    shell: shellRect ? { w: Math.round(shellRect.width), h: Math.round(shellRect.height) } : null,
    overflowX: overflowX,
    overlayScrollY: overlay ? Math.max(0, overlay.scrollHeight - overlay.clientHeight) : 0,
    thumbs: { generated: V23SHOP.thumbsGenerated, cached: Object.keys(V22.thumbCache).length, queued: V23SHOP.thumbQueue.length },
    mounts: { shop: V23SHOP.shopMounts, wardrobe: V23SHOP.wardrobeMounts },
    renderCount: (window.__v22 && window.__v22.renderCount) || 0,
    canvas: v23ShopCanvasInfo(),
    coins: state.coins,
    ownedCosmetics: state.collection.ownedCosmeticIds.length,
    heroId: state.collection.selectedCharacterId,
    at: Date.now()
  };
}
function v23ShopApiMode(mode) { return mode === 'wardrobe' ? 'wardrobe' : (screen === 'wardrobe' ? 'wardrobe' : 'shop'); }
function v23ShopApiSetInput(mode) {
  var m = v23ShopMode(mode);
  var input = v22Q('[data-v23-search="' + m + '"]');
  if (input) {
    input.value = v23ShopFilters(m).query || '';
    var box = input.parentNode;
    if (box && box.classList) box.classList.toggle('is-on', !!input.value);
  }
}

window.__v23Shop = {
  version: V23SHOP.version,
  openShop: function () { openShop(); return v23ShopState(); },
  openWardrobe: function () { openWardrobe(); return v23ShopState(); },
  close: function () { closeSheet(); return true; },
  setup: function (mode) {
    var m = mode === 'wardrobe' ? 'wardrobe' : 'shop';
    try {
      if (m === 'shop') { if (screen !== 'shop') openShop(); v23ShopResetFilters('shop', true); }
      else { if (screen !== 'wardrobe') openWardrobe(); v23ShopResetFilters('wardrobe', true); }
    } catch (e) {
      V23SHOP.errors.push('setup: ' + (e && e.message || e));
    }
    return v23ShopState();
  },
  state: v23ShopState,
  visible: function () {
    var info = v23ShopVisibleInfo(v23ShopGridSel(v23ShopApiMode()));
    return info ? info.visible : 0;
  },
  total: function () {
    var info = v23ShopVisibleInfo(v23ShopGridSel(v23ShopApiMode()));
    return info ? info.total : 0;
  },
  counts: function () {
    var info = v23ShopVisibleInfo(v23ShopGridSel(v23ShopApiMode()));
    return { total: info ? info.total : 0, visible: info ? info.visible : 0, fullyVisible: info ? info.fullyVisible : 0 };
  },
  select: function (id) {
    if (screen === 'wardrobe') wardrobeSelectItem(id);
    else shopSelect(id);
    return v23ShopState();
  },
  search: function (query) {
    var m = v23ShopMode(v23ShopApiMode());
    v23ShopFilters(m).query = String(query == null ? '' : query);
    v23ShopApiSetInput(m);
    v23ShopApply(m, 'search');
    return v23ShopState();
  },
  sort: function (key) {
    var m = v23ShopMode(v23ShopApiMode());
    var valid = V23SHOP_SORTS.some(function (s) { return s.value === key; });
    v23ShopFilters(m).sort = valid ? key : 'rareza';
    v23ShopApply(m, 'sort');
    return v23ShopState();
  },
  filter: function (kind, value) {
    var m = v23ShopMode(v23ShopApiMode());
    var f = v23ShopFilters(m);
    if (kind === 'slot' || kind === 'rarity' || kind === 'status' || kind === 'collection') {
      f[kind] = value;
      if (m === 'wardrobe' && kind === 'slot') { wardrobe.selectedId = null; wardrobe.compareSaved = false; }
      v23ShopApply(m, 'filter');
    }
    return v23ShopState();
  },
  resetFilters: function (defaults) {
    var m = v23ShopMode(v23ShopApiMode());
    v23ShopResetFilters(m, !!defaults);
    return v23ShopState();
  },
  scrollGrid: function (top) {
    var grid = v22ById(v23ShopGridId(v23ShopApiMode()));
    if (!grid) return 0;
    grid.scrollTop = Math.max(0, Number(top) || 0);
    return grid.scrollTop;
  },
  thumbs: function () {
    return { generated: V23SHOP.thumbsGenerated, cached: Object.keys(V22.thumbCache).length, queued: V23SHOP.thumbQueue.length, failed: V23SHOP.errors.slice() };
  },
  outfit: function () {
    try { return v22Clone(state.collection.equipped[state.collection.selectedCharacterId] || {}); } catch (e) { return {}; }
  },
  allOutfits: function () {
    try { return v22Clone(state.collection.equipped || {}); } catch (e) { return {}; }
  },
  draft: function () {
    try { return v22Clone(wardrobe.draft || {}); } catch (e) { return {}; }
  },
  saved: function () {
    try { return v22Clone(wardrobe.saved || {}); } catch (e) { return {}; }
  },
  canvas: v23ShopCanvasInfo,
  errors: function () { return V23SHOP.errors.slice(); }
};
