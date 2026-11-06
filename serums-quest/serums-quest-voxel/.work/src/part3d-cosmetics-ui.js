/* =========================================================================
   COSMÉTICOS — inventario/equipador, tienda, ajustes y galerías de QA
   ========================================================================= */
var wardrobe = {
  active: false,
  characterId: null,
  slot: 'cabeza',
  rarity: 'todas',
  draft: {},
  saved: {},
  selectedId: null,
  compareSaved: false,
  preview: null,
  rotation: -0.35,
  dragging: false,
  lastX: 0,
  previewDirty: true,
  raf: 0
};
var shop = {
  active: false,
  slot: 'todas',
  rarity: 'todas',
  selectedId: null,
  confirmId: null
};

function cosmeticsOwnedCountLabel() { return countOwnedCosmetics() + '/' + countAllCosmetics(); }
function raritySelectHTML(selected, action) {
  return '<select class="selectMini" data-' + action + '>' + ['todas'].concat(RARITY_ORDER).map(function (r) {
    var label = r === 'todas' ? 'Todas las rarezas' : rarityUI(r).label;
    return '<option value="' + r + '" ' + (selected === r ? 'selected' : '') + '>' + label + '</option>';
  }).join('') + '</select>';
}
function slotTabsHTML(active, action, counts) {
  return COSMETIC_SLOT_ORDER.map(function (slot) {
    var meta = COSMETIC_SLOT_LOOKUP[slot];
    var count = counts ? counts[slot] : 0;
    return '<button type="button" class="slotTab ' + (active === slot ? 'is-active' : '') + '" data-action="' + action + '" data-slot="' + esc(slot) + '">' +
      '<span>' + esc(meta ? meta.label : slot) + '</span><small>' + count + '</small></button>';
  }).join('');
}
function slotCounts() {
  var counts = {};
  COSMETIC_SLOT_ORDER.forEach(function (slot) { counts[slot] = cosmeticsInSlot(slot).length; });
  return counts;
}
function filteredCosmeticsFor(slot, rarity, onlyOwned) {
  return ALL_COSMETICS.filter(function (c) {
    return c.category === slot && (rarity === 'todas' || cosmeticRarityKey(c) === rarity) && (!onlyOwned || cosmeticOwned(c.id));
  });
}
function itemStatus(c, outfit) {
  if (!cosmeticOwned(c.id)) return { label: 'Bloqueado', cls: 'chip' };
  if (outfit && outfit[c.category] === c.id) return { label: 'Equipado', cls: 'chip chip--completed' };
  if (wardrobe.draft[c.category] === c.id) return { label: 'Probando', cls: 'chip chip--accent' };
  return { label: 'Poseído', cls: 'chip' };
}

/* -------------------------------------------------------------------------
   Equipador / inventario
   ------------------------------------------------------------------------- */
function openWardrobe(characterId) {
  if (screen === 'duel') return;
  wardrobe.active = true;
  wardrobe.characterId = characterId || state.collection.selectedCharacterId;
  if (state.collection.ownedCharacterIds.indexOf(wardrobe.characterId) === -1 && state.collection.ownedCharacterIds.length) {
    wardrobe.characterId = state.collection.ownedCharacterIds[0];
  }
  wardrobe.saved = getCharacterOutfit(wardrobe.characterId);
  wardrobe.draft = Object.assign({}, wardrobe.saved);
  wardrobe.slot = 'cabeza';
  wardrobe.rarity = 'todas';
  wardrobe.selectedId = null;
  wardrobe.compareSaved = false;
  sheetReturn = screen === 'pause' ? 'pause' : (screen === 'title' ? 'title' : 'hub');
  setScreen('wardrobe');
  initAudio();
  sfxSelect();
}
function wardrobeCharacterSwitch(id) {
  if (state.collection.ownedCharacterIds.indexOf(id) === -1) return;
  wardrobe.characterId = id;
  wardrobe.saved = getCharacterOutfit(id);
  wardrobe.draft = Object.assign({}, wardrobe.saved);
  wardrobe.selectedId = null;
  wardrobe.compareSaved = false;
  wardrobe.previewDirty = true;
  renderScreen();
  mountWardrobePreview();
}
function wardrobeSetSlot(slot) {
  wardrobe.slot = slot;
  wardrobe.selectedId = null;
  wardrobe.compareSaved = false;
  renderScreen();
  mountWardrobePreview();
}
function wardrobeSetRarity(rarity) {
  wardrobe.rarity = rarity || 'todas';
  renderScreen();
  mountWardrobePreview();
}
function wardrobeSelectItem(id) {
  var c = COSMETIC_BY_ID[id];
  if (!c) return;
  wardrobe.selectedId = id;
  if (cosmeticOwned(id)) {
    if (wardrobe.draft[c.category] === id) delete wardrobe.draft[c.category];
    else wardrobe.draft[c.category] = id;
    wardrobe.previewDirty = true;
    sfxClick();
  } else {
    sfxClick();
  }
  renderScreen();
  mountWardrobePreview();
}
function wardrobeClearSlot(slot) {
  if (wardrobe.draft[slot]) { delete wardrobe.draft[slot]; wardrobe.previewDirty = true; sfxSelect(); renderScreen(); mountWardrobePreview(); }
}
function wardrobeSave() {
  if (!wardrobe.characterId) return;
  if (state.collection.ownedCharacterIds.indexOf(wardrobe.characterId) === -1) return;
  setCharacterOutfit(wardrobe.characterId, wardrobe.draft);
  wardrobe.saved = getCharacterOutfit(wardrobe.characterId);
  wardrobe.draft = Object.assign({}, wardrobe.saved);
  wardrobe.compareSaved = false;
  toast('Atuendo guardado. El héroe ya lo lleva en el observatorio y en los duelos.', 'success', 3800);
  renderScreen();
  mountWardrobePreview();
  sfxVictory();
}
function wardrobeDiscard() {
  wardrobe.draft = Object.assign({}, wardrobe.saved);
  wardrobe.selectedId = null;
  wardrobe.compareSaved = false;
  wardrobe.previewDirty = true;
  renderScreen();
  mountWardrobePreview();
  sfxClick();
}
function wardrobeDirty() {
  return Object.keys(wardrobe.saved).sort().some(function (k) { return wardrobe.saved[k] !== wardrobe.draft[k]; }) ||
    Object.keys(wardrobe.draft).sort().some(function (k) { return wardrobe.saved[k] !== wardrobe.draft[k]; });
}
function frameBadge(c) {
  var meta = rarityUI(cosmeticRarityKey(c));
  return '<span class="rarityDot" style="background:' + meta.color + ';box-shadow:0 0 8px ' + meta.color + '"></span>';
}
function cosmeticCardHTML(c, outfit, mode) {
  var statusLabel, statusCls = 'chip';
  if (mode === 'specific') {
    if (!cosmeticOwned(c.id)) statusLabel = 'Bloqueado';
    else if (wardrobe.saved[c.category] === c.id && wardrobe.draft[c.category] === c.id) { statusLabel = 'Equipado'; statusCls = 'chip chip--completed'; }
    else if (wardrobe.draft[c.category] === c.id) { statusLabel = 'Probando'; statusCls = 'chip chip--accent'; }
    else if (wardrobe.saved[c.category] === c.id) { statusLabel = 'Actual'; statusCls = 'chip chip--gold'; }
    else statusLabel = 'Poseído';
  } else {
    var status = itemStatus(c, outfit);
    statusLabel = status.label; statusCls = status.cls || 'chip';
  }
  var selected = mode === 'specific' ? wardrobe.selectedId === c.id : shop.selectedId === c.id;
  var rarity = rarityUI(cosmeticRarityKey(c));
  var priceText = !cosmeticOwned(c.id) && Number(c.price) > 0 ? '<span class="itemPrice">◇' + formatNumber(c.price) + '</span>' : '';
  return '<button type="button" class="cosmeticItem ' + (selected ? 'is-selected ' : '') + (cosmeticOwned(c.id) ? 'is-owned ' : 'is-locked') + '" style="--rarity-color:' + rarity.color + '" data-action="' + (mode === 'specific' ? 'wardrobe-item' : 'shop-item') + '" data-id="' + esc(c.id) + '">' +
    '<span class="rarityBar"></span>' + frameBadge(c) +
    '<span class="cosmeticItemCopy"><b>' + esc(c.name) + '</b><small>' + esc(rarity.label) + ' · ' + esc(cosmeticSlotLabel(c.category)) + '</small></span>' +
    priceText + '<span class="' + statusCls + '">' + esc(statusLabel) + '</span>' +
  '</button>';
}
function cosmeticDetailHTML(c, mode) {
  if (!c) return '<div class="wardrobeEmpty"><span class="eyebrow noRule">Selecciona una pieza</span><h3>Previsualiza antes de equipar.</h3><p>Elige una ranura y una pieza de la lista. La vista 3D se actualizará al instante.</p></div>';
  var rarity = rarityUI(cosmeticRarityKey(c));
  var owned = cosmeticOwned(c.id);
  var req = cosmeticRequirementInfo(c);
  var status = mode === 'specific'
    ? (owned ? (wardrobe.saved[c.category] === c.id && wardrobe.draft[c.category] === c.id ? 'Equipado' : wardrobe.draft[c.category] === c.id ? 'Probando' : wardrobe.saved[c.category] === c.id ? 'Actual' : 'Poseído') : 'Bloqueado')
    : (owned ? 'Poseído' : 'Bloqueado');
  var progress = cosmeticProgressText(c);
  var nextStage = Array.isArray(c.stageLabels) && owned ? cosmeticStageLabel(c) : '';
  var titleExtra = c.category === 'titulo' ? '<p class="tiny dim">Los títulos se muestran junto al nombre; no son una pieza 3D.</p>' : '';
  var actions = '';
  if (mode === 'specific') {
    if (owned) {
      actions = '<button type="button" class="btn btn--primary btn--sm btn--block" data-action="wardrobe-item" data-id="' + esc(c.id) + '">' + (wardrobe.draft[c.category] === c.id ? 'Quitar del borrador' : 'Probar esta pieza') + '</button>';
    } else {
      actions = '<div class="notice">' + esc(req.requirementText) + '<br /><b>Progreso:</b> ' + esc(progress) + '</div>' +
        (isExtraCosmetic(c) ? '' : '<button type="button" class="btn btn--ghost btn--sm btn--block" data-action="open-shop">Ir a la tienda</button>');
    }
    if (wardrobe.draft[c.category] && wardrobe.draft[c.category] !== c.id) actions += '<button type="button" class="btn btn--quiet btn--sm btn--block" data-action="wardrobe-clear" data-slot="' + esc(c.category) + '">Quitar la pieza actual de la ranura</button>';
  } else {
    if (owned) actions = '<div class="notice"><b>Ya está en tu colección.</b> Puedes equiparlo desde el inventario.</div>';
    else {
      var can = req && req.canBuy;
      actions = '<div class="shopRequirement"><span>Requisito</span><b>' + esc(req ? req.requirementText : '') + '</b></div>' +
        '<div class="shopRequirement"><span>Tu saldo</span><b>◇' + formatNumber(state.coins) + '</b></div>' +
        (req && req.levelNeed && !req.levelOk ? '<div class="notice">' + icon('lock', 12) + ' Necesitas nivel ' + req.levelNeed + '.</div>' : '') +
        (req && req.achievementId && !req.achievementOk ? '<div class="notice">' + icon('lock', 12) + ' Primero consigue el logro correspondiente.</div>' : '') +
        '<button type="button" class="btn ' + (can ? 'btn--primary' : '') + ' btn--block" data-action="shop-buy" data-id="' + esc(c.id) + '" ' + (can ? '' : 'disabled') + '>' + icon('coin', 14) + (can ? ' Comprar por ◇' + formatNumber(c.price) : ' Compra bloqueada') + '</button>' +
        (shop.confirmId === c.id ? '<div class="buyConfirm"><b>Confirmar compra</b><p>' + esc(c.name) + ' · ◇' + formatNumber(c.price) + ' · saldo después: ◇' + formatNumber(Math.max(0, state.coins - c.price)) + '</p><div><button type="button" class="btn btn--gold btn--sm" data-action="shop-confirm" data-id="' + esc(c.id) + '">Confirmar</button><button type="button" class="btn btn--ghost btn--sm" data-action="shop-cancel-buy">Cancelar</button></div></div>' : '');
    }
  }
  return '<div class="cosmeticDetailHead">' + frameBadge(c) + '<span class="chip" style="color:' + rarity.color + ';border-color:' + rarity.color + '">' + esc(rarity.label) + '</span><span class="chip">' + esc(cosmeticSlotLabel(c.category)) + '</span><span class="chip">' + esc(status) + '</span></div>' +
    '<h3>' + esc(c.name) + '</h3><p class="cosmeticDesc">' + esc(c.description || '') + '</p>' + titleExtra +
    '<div class="cosmeticProgress"><span>' + esc(cosmeticOwned(c.id) ? 'Progreso' : 'Cómo conseguirlo') + '</span><b>' + esc(progress) + '</b>' +
    (nextStage ? '<small>' + esc(nextStage) + '</small>' : '') + '</div>' +
    (req && req.nextTier ? '<div class="bar"><i style="width:' + Math.round(req.pct * 100) + '%;background:' + rarity.color + '"></i></div>' : '') +
    '<div class="cosmeticActions">' + actions + '</div>';
}
function wardrobeScreenHTML() {
  var characterId = wardrobe.characterId || state.collection.selectedCharacterId;
  var char = CHARACTER_BY_ID[characterId] || CAMP.characters[0];
  var look = HERO_LOOKS[char.id];
  var outfitView = wardrobe.compareSaved ? wardrobe.saved : wardrobe.draft;
  var selected = wardrobe.selectedId ? COSMETIC_BY_ID[wardrobe.selectedId] : null;
  var allInSlot = filteredCosmeticsFor(wardrobe.slot, wardrobe.rarity, false);
  var ownedInSlot = filteredCosmeticsFor(wardrobe.slot, wardrobe.rarity, true);
  var slotCounts = {};
  COSMETIC_SLOT_ORDER.forEach(function (s) { slotCounts[s] = cosmeticsInSlot(s).filter(function (c) { return cosmeticOwned(c.id); }).length + '/' + cosmeticsInSlot(s).length; });
  var heroTabs = state.collection.ownedCharacterIds.map(function (id) {
    var c = CHARACTER_BY_ID[id]; if (!c) return '';
    return '<button type="button" class="miniHeroTab ' + (id === characterId ? 'is-active' : '') + '" data-action="wardrobe-hero" data-hero="' + esc(id) + '">' + esc(c.name.split(' ')[0]) + '</button>';
  }).join('');
  var items = allInSlot.length ? allInSlot.map(function (c) { return cosmeticCardHTML(c, wardrobe.saved, 'specific'); }).join('') : '<div class="wardrobeEmpty"><p>No hay piezas para este filtro.</p></div>';
  var currentSaved = Object.keys(wardrobe.saved).length;
  var currentDraft = Object.keys(wardrobe.draft).length;
  var title = titleText(char.id);
  return '<div class="overlay"><div class="overlayShell wardrobeShell">' +
    '<div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot" style="background:' + look.accent + '"></span>Estudio de equipamiento</span><h1>El atuendo <em>se prueba antes de salir.</em></h1><p>Gira el héroe, compara y guarda. Solo se equipan piezas que ya posees; los cosméticos bloqueados muestran su requisito y tu progreso.</p></div>' +
      '<div class="sheetHeadSide"><span class="chip">' + cosmeticsOwnedCountLabel() + ' cosméticos</span><span class="chip">' + state.collection.ownedCharacterIds.length + '/10 héroes</span><button type="button" class="sheetClose" data-action="close-sheet" aria-label="Cerrar">' + icon('close', 17) + '</button></div>' +
    '</div>' +
    '<div class="wardrobeHeroBar"><span class="eyebrow noRule">Héroe</span><div class="miniHeroTabs">' + heroTabs + '</div><span class="wardrobeTitle">Título: <b>' + esc(title || 'sin título') + '</b></span></div>' +
    '<div class="wardrobeGrid">' +
      '<aside class="panel wardrobeSlots"><span class="eyebrow noRule">Ranuras · una pieza activa</span><div class="slotList">' + slotTabsHTML(wardrobe.slot, 'wardrobe-slot', slotCounts) + '</div><div class="sectionDivider"></div><div class="wardrobeMeta"><span class="tiny dim">Atuendo guardado</span><b>' + currentSaved + ' piezas</b><span class="tiny dim">Borrador</span><b>' + currentDraft + ' piezas</b></div></aside>' +
      '<section class="wardrobeStage"><div class="previewMount" id="wardrobePreviewMount"><div class="previewHint">Arrastra para girar</div><div class="previewCorner" style="--accent:' + look.accent + '">' + esc(char.name) + '<br /><small>' + esc(look.klass) + '</small></div></div>' +
        '<div class="compareStrip"><span><b>Ahora</b><br />' + (currentSaved ? currentSaved + ' ' + plural(currentSaved, 'pieza', 'piezas') : 'sin cosméticos') + '</span>' + icon('arrowRight', 14) + '<span><b>Borrador</b><br />' + (currentDraft ? currentDraft + ' ' + plural(currentDraft, 'pieza', 'piezas') : 'sin cosméticos') + '</span></div>' +
        '<div class="wardrobeActions"><button type="button" class="btn btn--ghost btn--sm" data-action="wardrobe-compare">' + (wardrobe.compareSaved ? icon('layers', 13) + ' Ver borrador' : icon('eye', 13) + ' Ver atuendo actual') + '</button><button type="button" class="btn btn--quiet btn--sm" data-action="wardrobe-discard" ' + (wardrobeDirty() ? '' : 'disabled') + '>Descartar</button><button type="button" class="btn btn--primary btn--sm" data-action="wardrobe-save" ' + (wardrobeDirty() ? '' : 'disabled') + '>' + icon('check', 13) + ' Guardar atuendo</button></div>' +
      '</section>' +
      '<section class="panel wardrobeItems"><div class="wardrobeItemsHead"><div><span class="eyebrow noRule">' + esc(cosmeticSlotLabel(wardrobe.slot)) + '</span><h2>' + allInSlot.length + ' piezas</h2></div><div class="wardrobeFilter">' + raritySelectHTML(wardrobe.rarity, 'wardrobe-rarity-select') + '</div></div>' +
        '<div class="cosmeticList">' + items + '</div>' +
        '<div class="cosmeticDetail">' + cosmeticDetailHTML(selected, 'specific') + '</div>' +
      '</section>' +
    '</div>' +
    '<div class="atlasFooter"><span>El borrador no se guarda hasta pulsar «Guardar atuendo». La vista 3D respeta las capas base y las anclas de identidad de cada héroe.</span><span>' + icon('spark', 11) + ' Arrastra el héroe para girarlo.</span></div>' +
  '</div></div>';
}

/* -------------------------------------------------------------------------
   Tienda
   ------------------------------------------------------------------------- */
function shopFiltered() {
  return shopCosmetics().filter(function (c) {
    return (shop.slot === 'todas' || c.category === shop.slot) && (shop.rarity === 'todas' || cosmeticRarityKey(c) === shop.rarity);
  });
}
function shopScreenHTML() {
  var list = shopFiltered();
  var selected = shop.selectedId ? COSMETIC_BY_ID[shop.selectedId] : null;
  var cats = ['todas'].concat(COSMETIC_SLOT_ORDER.filter(function (s) { return s !== 'titulo'; })).map(function (s) {
    return '<option value="' + esc(s) + '" ' + (shop.slot === s ? 'selected' : '') + '>' + esc(s === 'todas' ? 'Todas las ranuras' : cosmeticSlotLabel(s)) + '</option>';
  }).join('');
  var ownedCount = shopCosmetics().filter(function (c) { return cosmeticOwned(c.id); }).length;
  return '<div class="overlay"><div class="overlayShell">' +
    '<div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot" style="background:var(--gold);box-shadow:0 0 12px var(--gold)"></span>Tienda de ecos</span><h1>Objetos que ya existían <em>en tu colección.</em></h1><p>Los 33 cosméticos originales conservan su precio y sus requisitos. La compra se confirma con tu saldo y no se puede repetir.</p></div>' +
      '<div class="sheetHeadSide"><span class="chip chip--gold">' + icon('coin', 12) + ' ◇' + formatNumber(state.coins) + '</span><span class="chip">' + ownedCount + '/33 originales</span><button type="button" class="sheetClose" data-action="close-sheet" aria-label="Cerrar">' + icon('close', 17) + '</button></div>' +
    '</div>' +
    '<div class="shopLayout">' +
      '<aside class="panel shopRail"><span class="eyebrow noRule">Filtrar</span><select class="selectMini wide" data-shop-slot>' + cats + '</select><div style="margin-top:8px">' + raritySelectHTML(shop.rarity, 'shop-rarity-select') + '</div><div class="sectionDivider"></div><div class="shopNote"><b>Monedas de estudio</b><p>Se ganan respondiendo y cerrando rutas. Tope de ◇120 al día; ya ganadas no se pierden.</p></div><button type="button" class="btn btn--ghost btn--sm btn--block" data-action="open-wardrobe">Ir al inventario ' + icon('chevronRight', 11) + '</button></aside>' +
      '<section class="panel shopList"><div class="shopListHead"><h2>Catálogo original</h2><span class="chip">' + list.length + ' resultados</span></div><div class="cosmeticList shopGrid">' + (list.map(function (c) { return cosmeticCardHTML(c, getCharacterOutfit(state.collection.selectedCharacterId), 'shop'); }).join('') || '<div class="wardrobeEmpty"><p>No hay cosméticos con ese filtro.</p></div>') + '</div></section>' +
      '<aside class="panel shopDetail">' + cosmeticDetailHTML(selected, 'shop') + '</aside>' +
    '</div>' +
    '<div class="atlasFooter"><span>Los extras de constancia, repaso, dominio, jefes, mascotas y títulos no se venden: se ganan jugando.</span><span>' + icon('shield', 11) + ' Sin dinero real.</span></div>' +
  '</div></div>';
}
function shopSelect(id) { shop.selectedId = id; shop.confirmId = null; renderScreen(); sfxClick(); }
function shopAskBuy(id) { shop.selectedId = id; shop.confirmId = id; renderScreen(); sfxClick(); }
function shopConfirmBuy(id) {
  var result = buyCosmetic(id);
  if (!result.ok) { toast(result.reason, 'warn', 4500); renderScreen(); return; }
  shop.confirmId = null;
  toast('«' + result.cosmetic.name + '» comprado por ◇' + formatNumber(result.price) + '. Ya está en tu colección.', 'success', 4300);
  renderScreen();
  syncHUD();
  refreshAllPortraits();
  sfxPurchase();
}
function shopCancelBuy() { shop.confirmId = null; renderScreen(); }

/* -------------------------------------------------------------------------
   Previsualización 3D del atuendo
   ------------------------------------------------------------------------- */
function ensureWardrobePreview() {
  if (wardrobe.preview) return wardrobe.preview;
  var canvas = document.createElement('canvas');
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(420, 420, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  var scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#c0cdff', '#302434', 2.0));
  var key = new THREE.DirectionalLight('#ffe3c8', 2.4);
  key.position.set(-3, 6, 5); scene.add(key);
  var rim = new THREE.DirectionalLight('#7ba6ff', 1.5);
  rim.position.set(4, 4, -3); scene.add(rim);
  var camera = new THREE.PerspectiveCamera(26, 1, 0.1, 80);
  var root = new THREE.Group(); scene.add(root);
  var ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.018, 4, 40), new THREE.MeshBasicMaterial({ color: color('#7AA2FF'), transparent: true, opacity: 0.45 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.03; root.add(ring);
  var glow = makeGlowSprite('#7AA2FF', 3.4, 0.1); glow.position.y = 1.3; scene.add(glow);
  wardrobe.preview = { canvas: canvas, renderer: renderer, scene: scene, camera: camera, root: root, avatar: null, ring: ring, glow: glow, lastKey: '' };
  canvas.addEventListener('pointerdown', function (event) { wardrobe.dragging = true; wardrobe.lastX = event.clientX; try { canvas.setPointerCapture(event.pointerId); } catch (e) {} });
  canvas.addEventListener('pointermove', function (event) {
    if (!wardrobe.dragging) return;
    wardrobe.rotation += (event.clientX - wardrobe.lastX) * 0.012;
    wardrobe.lastX = event.clientX;
  });
  canvas.addEventListener('pointerup', function () { wardrobe.dragging = false; });
  canvas.addEventListener('pointercancel', function () { wardrobe.dragging = false; });
  return wardrobe.preview;
}
function mountWardrobePreview() {
  var mount = document.getElementById('wardrobePreviewMount');
  if (!mount) return;
  var p = ensureWardrobePreview();
  mount.insertBefore(p.canvas, mount.firstChild);
  p.canvas.style.width = '100%';
  p.canvas.style.height = '100%';
  p.canvas.style.display = 'block';
  updateWardrobeAvatar();
}
function updateWardrobeAvatar() {
  var p = wardrobe.preview;
  if (!p || !wardrobe.characterId) return;
  var outfit = wardrobe.compareSaved ? wardrobe.saved : wardrobe.draft;
  var key = wardrobe.characterId + ':' + Object.keys(outfit).sort().map(function (k) { return k + '=' + outfit[k]; }).join(',');
  if (p.lastKey === key) return;
  if (p.avatar) { p.root.remove(p.avatar.root); disposeObject(p.avatar.root); p.avatar = null; }
  var avatar = buildHeroAvatar(wardrobe.characterId);
  applyOutfitToAvatar(avatar, wardrobe.characterId, outfit);
  p.root.add(avatar.root);
  p.avatar = avatar;
  p.lastKey = key;
  var look = heroLook(wardrobe.characterId);
  p.ring.material.color.set(look.accent);
  p.glow.material.color.set(look.accent);
  var box = new THREE.Box3().setFromObject(avatar.root);
  var center = box.getCenter(new THREE.Vector3());
  var extent = box.getSize(new THREE.Vector3());
  var dist = Math.max(extent.y / (2 * Math.tan(13 * Math.PI / 180)), extent.x * 1.35) * 1.02;
  p.camera.position.set(center.x + dist * 0.34, center.y + extent.y * 0.1, center.z + dist * 1.04);
  p.camera.lookAt(center.x, center.y - 0.02 * extent.y, center.z);
}
function updateWardrobePreview(dt, time) {
  if (screen !== 'wardrobe' || !wardrobe.preview || !wardrobe.preview.avatar) return;
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
   Galerías de aprobación (QA)
   ------------------------------------------------------------------------- */
var SHOWCASE_OUTFITS = {
  kian: { cabeza: 'c-cabeza-casco', torso: 'c-torso-manto', piernas: 'c-piernas-grebas', extras: 'x-trofeo-gestion', mascota: 'x-buho-cometa', marcos: 'c-marco-constelacion', titulo: 'x-titulo-en-ruta' },
  noa: { cabeza: 'c-cabeza-auriculares', torso: 'c-torso-bata', piernas: 'c-piernas-falda', accesorios: 'c-accesorios-gafas', extras: 'x-cuaderno-orbital', efectos: 'x-arma-prisma', estela: 'x-estela-racha', titulo: 'x-titulo-criterio' },
  lia: { cabeza: 'c-cabeza-corona', peinado: 'c-peinado-coleta', torso: 'c-torso-poncho', piernas: 'c-piernas-ruta', accesorios: 'c-accesorios-brujula', mascota: 'x-zorro-tinta', marcos: 'c-marco-platino', titulo: 'x-titulo-cartografo' },
  zenon: { cabeza: 'x-dominio-etica-oro', peinado: 'c-peinado-mono', torso: 'x-capa-errorario', piernas: 'c-piernas-grebas', amuletos: 'c-amuleto-criterio', efectos: 'x-aura-amanecer', pet: null, mascota: 'x-luciernaga-observatorio', marcos: 'c-marco-constelacion', titulo: 'x-titulo-maestro' }
};
function showcaseScreenHTML() {
  var all = ['kian', 'noa', 'lia', 'zenon'];
  var page = Number(RULES.devShowcasePage) || 1;
  var ids = all.slice((page - 1) * 2, page * 2);
  if (!ids.length) { page = 1; ids = all.slice(0, 2); }
  var cards = ids.map(function (id) {
    var c = CHARACTER_BY_ID[id];
    var img = renderHeroPortrait(id, 720, SHOWCASE_OUTFITS[id]);
    return '<article class="showcaseCard" style="--hero-accent:' + HERO_LOOKS[id].accent + '"><img src="' + img + '" alt="' + esc(c.name) + ' con cosméticos" /><div><span class="chip">' + esc(HERO_LOOKS[id].klass) + '</span><h3>' + esc(c.name) + '</h3><p>' + esc(c.title) + ' · cosméticos de varias ranuras</p></div></article>';
  }).join('');
  return '<div class="overlay"><div class="overlayShell"><div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot"></span>Aprobación de Fase 3 · página ' + page + '/2</span><h1>Cuatro siluetas, <em>un mismo sistema de acople.</em></h1><p>Kian, Noa, Lía y Zenón con cosméticos de varias ranuras. Armas y anclas de identidad conservadas.</p></div><div class="sheetHeadSide"><span class="chip">' + page + '/2</span><button type="button" class="sheetClose" data-action="close-sheet">' + icon('close', 17) + '</button></div></div><div class="showcaseGrid showcaseGrid--large">' + cards + '</div></div></div>';
}
function slotGalleryItems() {
  return [
    ['cabeza', 'ilan', { cabeza: 'c-cabeza-corona' }],
    ['peinado', 'mara', { peinado: 'c-peinado-coleta' }],
    ['torso', 'teo', { torso: 'c-torso-manto' }],
    ['piernas', 'lia', { piernas: 'c-piernas-grebas' }],
    ['accesorios', 'noa', { accesorios: 'c-accesorios-gafas' }],
    ['extras', 'zenon', { extras: 'x-reloj-arena' }],
    ['amuletos', 'iris', { amuletos: 'c-amuleto-criterio' }],
    ['efectos', 'ona', { efectos: 'c-efecto-constelacion' }],
    ['marcos', 'kian', { marcos: 'c-marco-constelacion' }],
    ['mascota', 'amaru', { mascota: 'x-buho-cometa' }],
    ['estela', 'mara', { estela: 'x-estela-racha' }],
    ['titulo', 'zenon', { titulo: 'x-titulo-maestro' }]
  ];
}
function slotGalleryHTML() {
  var all = slotGalleryItems();
  var page = Number(RULES.devSlotPage) || 1;
  var cells = all.slice((page - 1) * 6, page * 6);
  if (!cells.length) { page = 1; cells = all.slice(0, 6); }
  var cards = cells.map(function (cell, index) {
    var slot = cell[0], hero = cell[1], outfit = cell[2];
    var img = renderHeroPortrait(hero, 500, outfit);
    var c = COSMETIC_BY_ID[outfit[slot]];
    var originalIndex = all.findIndex(function (x) { return x[0] === slot; });
    return '<article class="slotCapture"><div class="slotCaptureImg"><img src="' + img + '" alt="' + esc(cosmeticSlotLabel(slot)) + '" /></div><div class="slotCaptureCopy"><span class="chip">' + (originalIndex + 1) + ' · ' + esc(cosmeticSlotLabel(slot)) + '</span><b>' + esc(c ? c.name : slot) + '</b><small>' + esc(CHARACTER_BY_ID[hero] ? CHARACTER_BY_ID[hero].name : '') + '</small></div></article>';
  }).join('');
  return '<div class="overlay"><div class="overlayShell"><div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot"></span>Fase 3 · 12 ranuras · página ' + page + '/2</span><h1>Una pieza equipada <em>en cada ranura.</em></h1><p>Las 9 ranuras originales y las 3 nuevas. Los títulos se muestran junto al nombre.</p></div><div class="sheetHeadSide"><span class="chip">' + page + '/2</span><button type="button" class="sheetClose" data-action="close-sheet">' + icon('close', 17) + '</button></div></div><div class="slotGalleryGrid slotGalleryGrid--paged">' + cards + '</div></div></div>';
}

/* -------------------------------------------------------------------------
   Ajustes de calidad
   ------------------------------------------------------------------------- */
function clearPortraitCache() {
  Object.keys(portraitCache).forEach(function (key) { delete portraitCache[key]; });
}
function setEffectsQuality(level) {
  if (['bajo', 'medio', 'alto'].indexOf(level) === -1) return;
  state.settings.effectsQuality = level;
  saveSettings();
  persist();
  clearPortraitCache();
  if (heroAvatar) { applyOutfitToAvatar(heroAvatar, state.collection.selectedCharacterId); }
  if (wardrobe.preview && wardrobe.preview.avatar) { wardrobe.preview.lastKey = ''; updateWardrobeAvatar(); }
  toast('Calidad de efectos: ' + (level === 'bajo' ? 'baja' : level === 'alto' ? 'alta' : 'media') + '.', 'success', 2200);
  renderScreen();
}
function toggle3dFrames() {
  state.settings.hide3dFrames = !state.settings.hide3dFrames;
  saveSettings();
  persist();
  clearPortraitCache();
  if (heroAvatar) applyOutfitToAvatar(heroAvatar, state.collection.selectedCharacterId);
  if (wardrobe.preview && wardrobe.preview.avatar) { wardrobe.preview.lastKey = ''; updateWardrobeAvatar(); }
  toast(state.settings.hide3dFrames ? 'Marcos holográficos 3D ocultos.' : 'Marcos holográficos 3D visibles.', 'success', 2600);
  renderScreen();
}

document.addEventListener('change', function (event) {
  var t = event.target;
  if (!t || !t.matches) return;
  if (t.matches('[data-wardrobe-rarity-select]')) { wardrobeSetRarity(t.value); return; }
  if (t.matches('[data-shop-slot]')) { shop.slot = t.value; shop.selectedId = null; renderScreen(); return; }
  if (t.matches('[data-shop-rarity-select]')) { shop.rarity = t.value; shop.selectedId = null; renderScreen(); return; }
});
