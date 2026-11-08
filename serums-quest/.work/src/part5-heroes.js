/* =========================================================================
   SERUMS QUEST · V2 · ELENCO DE HÉROES
   Carrusel deslizante, ficha de reclutamiento y modelo voxel giratorio.
   Agente 5 · se concatena después de part3* y antes de part4-flow.
   Sustituye heroesScreenHTML() y recruitScreenHTML() de part3-ui.

   Composición (referencia V2.1): cabecera con título y onda, avatar/monedas
   arriba, tarjetas laterales parciales y tarjeta central grande con fondo
   propio, nombre, descripción, rareza, atributos y botón de precio/estado.
   La geometría voxel es la de part2-world (mergedVoxels del Agente 1): este
   módulo no crea geometría propia, solo la reutiliza y la encuadra.
   ========================================================================= */

var V2H = {
  booted: false,
  mounted: false,
  prepared: '',
  prevScreen: '',
  lastRecruitId: null,
  index: 0,
  heroId: '',
  spin: -0.42,
  reduced: false,
  rendererFailed: false,
  renderer: null,
  canvas: null,
  scene: null,
  camera: null,
  pivot: null,
  avatar: null,
  ring: null,
  ring2: null,
  glow: null,
  blob: null,
  accentLight: null,
  carousel: null,
  viewport: null,
  deck: null,
  stageHost: null,
  stageW: 0,
  stageH: 0,
  drag: null,
  stageObserver: null,
  suppressClick: false,
  suppressTimer: 0,
  wheelAt: 0,
  frames: 0,
  dirty: true,
  uid: 0
};

var V2H_MOTIFS = {
  'area-psi-salud-publica': 'island',
  'area-psi-cuidado-integral': 'heart',
  'area-psi-etica': 'scale',
  'area-psi-investigacion': 'prism',
  'area-psi-gestion': 'blueprint'
};

var V2H_KEYS_HTML = '<span class="v2-hero-keys"><kbd>←</kbd><kbd>→</kbd> mover <span>·</span> <kbd>Enter</kbd> elegir <span>·</span> <kbd>Esc</kbd> cerrar</span>';

/* -------------------------------------------------------------------------
   Utilidades
   ------------------------------------------------------------------------- */
function v2hChars() {
  try {
    if (!CAMP || !Array.isArray(CAMP.characters)) return [];
    return CAMP.characters.filter(function (c) { return c && c.id && CHARACTER_BY_ID[c.id]; });
  } catch (error) {
    return [];
  }
}
function v2hLook(id) {
  if (HERO_LOOKS && HERO_LOOKS[id]) return HERO_LOOKS[id];
  if (HERO_LOOKS && HERO_LOOKS.ilan) return HERO_LOOKS.ilan;
  return { accent: '#7aa2ff', klass: 'Héroe', weapon: 'Ruta' };
}
function v2hIndexById(id) {
  var chars = v2hChars();
  for (var i = 0; i < chars.length; i++) {
    if (chars[i].id === id) return i;
  }
  return -1;
}
function v2hClampIndex(value) {
  var max = Math.max(0, v2hChars().length - 1);
  var n = Math.round(Number(value) || 0);
  return Math.max(0, Math.min(max, n));
}
function v2hCurrentIndex() {
  V2H.index = v2hClampIndex(V2H.index);
  return V2H.index;
}
function v2hCurrentHero() {
  return v2hChars()[v2hCurrentIndex()] || null;
}
function v2hPortrait(id, size) {
  try {
    if (typeof renderHeroPortrait !== 'function') return '';
    return renderHeroPortrait(id, size) || '';
  } catch (error) {
    V2.softError('heroes.portrait', error);
    return '';
  }
}
function v2hShort(text, max) {
  var value = String(text || '').replace(/\s+/g, ' ').trim();
  var limit = Number(max) || 120;
  if (value.length <= limit) return value;
  var cut = value.slice(0, limit);
  var space = cut.lastIndexOf(' ');
  if (space > limit * 0.55) cut = cut.slice(0, space);
  return cut.replace(/[.,;:·\-]+$/, '') + '…';
}
function v2hAttrRows(char, look) {
  var attrs = (char && char.attributes) || {};
  var keys = Object.keys(attrs).slice(0, 5);
  if (!keys.length) return '';
  return keys.map(function (key) {
    var value = Math.max(0, Math.min(100, Math.round(Number(attrs[key]) || 0)));
    var label = key.charAt(0).toUpperCase() + key.slice(1);
    return '<div class="v2-hero-attr">' +
      '<span class="v2-hero-attrName">' + esc(label) + '</span>' +
      '<span class="v2-hero-attrBar"><i style="width:' + value + '%;background:' + look.accent + '"></i></span>' +
      '<b>' + value + '</b>' +
    '</div>';
  }).join('');
}
function v2hSlotClass(offset) {
  if (offset === 0) return 'is-center';
  if (offset === -1) return 'is-prev';
  if (offset === 1) return 'is-next';
  if (offset === -2) return 'is-prev2';
  if (offset === 2) return 'is-next2';
  return offset < 0 ? 'is-hidden is-left' : 'is-hidden is-right';
}

/* -------------------------------------------------------------------------
   Fondo dibujado en código: gradiente por área + isla/símbolo + constelación
   ------------------------------------------------------------------------- */
function v2hStars(char, accent) {
  var seed = 0;
  var id = String(char && char.id || 'hero');
  for (var s = 0; s < id.length; s++) seed = (seed * 31 + id.charCodeAt(s)) % 99079;
  var rnd = V2.rand(seed || 13);
  var points = [];
  var out = '';
  for (var i = 0; i < 6; i++) {
    var x = 42 + rnd() * 236;
    var y = 46 + rnd() * 286;
    points.push([x, y]);
    out += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (0.9 + rnd() * 1.5).toFixed(2) + '" fill="#f2f0ea" fill-opacity="' + (0.22 + rnd() * 0.36).toFixed(2) + '"/>';
  }
  for (var j = 0; j < points.length - 1; j++) {
    if (j % 2) continue;
    out += '<line x1="' + points[j][0].toFixed(1) + '" y1="' + points[j][1].toFixed(1) + '" x2="' + points[j + 1][0].toFixed(1) + '" y2="' + points[j + 1][1].toFixed(1) + '" stroke="' + accent + '" stroke-opacity="0.18" stroke-width="0.7"/>';
  }
  return out;
}
function v2hMotif(kind, accent) {
  var a = accent || '#7aa2ff';
  if (kind === 'heart') {
    return '<g>' +
      '<circle cx="160" cy="194" r="52" fill="none" stroke="' + a + '" stroke-opacity="0.22" stroke-width="1"/>' +
      '<circle cx="160" cy="194" r="82" fill="none" stroke="' + a + '" stroke-opacity="0.12" stroke-width="1" stroke-dasharray="2 8"/>' +
      '<path d="M160 240 c-28 -20 -46 -36 -46 -58 0 -16 12 -28 28 -28 8 0 14 4 18 10 4 -6 10 -10 18 -10 16 0 28 12 28 28 0 22 -18 38 -46 58z" fill="' + a + '" fill-opacity="0.13" stroke="' + a + '" stroke-opacity="0.5" stroke-width="1.2"/>' +
      '<path d="M130 194 h12 l6 -11 7 22 6 -15 5 4 h24" fill="none" stroke="#f2f0ea" stroke-opacity="0.3" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</g>';
  }
  if (kind === 'scale') {
    return '<g>' +
      '<line x1="160" y1="128" x2="160" y2="268" stroke="' + a + '" stroke-opacity="0.35" stroke-width="1.2"/>' +
      '<line x1="108" y1="156" x2="212" y2="156" stroke="' + a + '" stroke-opacity="0.5" stroke-width="1.2" stroke-linecap="round"/>' +
      '<path d="M108 156 l-13 26 a15 15 0 0 0 26 0z" fill="' + a + '" fill-opacity="0.14" stroke="' + a + '" stroke-opacity="0.45"/>' +
      '<path d="M212 156 l-13 26 a15 15 0 0 0 26 0z" fill="' + a + '" fill-opacity="0.14" stroke="' + a + '" stroke-opacity="0.45"/>' +
      '<circle cx="160" cy="128" r="3.2" fill="#e4c07a" fill-opacity="0.85"/>' +
      '<path d="M146 196 h28 M142 208 h36 M150 220 h20" stroke="' + a + '" stroke-opacity="0.28" stroke-width="1" stroke-linecap="round"/>' +
    '</g>';
  }
  if (kind === 'prism') {
    return '<g>' +
      '<path d="M160 136 l60 104 h-120 z" fill="' + a + '" fill-opacity="0.1" stroke="' + a + '" stroke-opacity="0.45" stroke-width="1.2" stroke-linejoin="round"/>' +
      '<line x1="160" y1="136" x2="160" y2="242" stroke="#f2f0ea" stroke-opacity="0.2" stroke-width="1"/>' +
      '<line x1="160" y1="176" x2="216" y2="196" stroke="#b8d46a" stroke-opacity="0.5" stroke-width="1.2" stroke-dasharray="3 5"/>' +
      '<line x1="160" y1="176" x2="104" y2="196" stroke="#69d3c1" stroke-opacity="0.45" stroke-width="1.2" stroke-dasharray="3 5"/>' +
      '<line x1="160" y1="176" x2="160" y2="248" stroke="#c49bff" stroke-opacity="0.42" stroke-width="1.2" stroke-dasharray="3 5"/>' +
      '<circle cx="160" cy="176" r="3" fill="#e4c07a" fill-opacity="0.9"/>' +
    '</g>';
  }
  if (kind === 'blueprint') {
    return '<g stroke="' + a + '" stroke-opacity="0.32" fill="none" stroke-width="1">' +
      '<path d="M92 236 l68 26 68 -26 -68 -26z"/>' +
      '<path d="M92 236 v-30 l68 26 68 -26 v30" stroke-opacity="0.22"/>' +
      '<path d="M124 220 v44 M196 220 v44" stroke-opacity="0.18"/>' +
    '</g>' +
    '<g fill="' + a + '" fill-opacity="0.14" stroke="' + a + '" stroke-opacity="0.38">' +
      '<rect x="128" y="188" width="26" height="42" rx="2"/>' +
      '<rect x="160" y="172" width="30" height="58" rx="2"/>' +
      '<rect x="194" y="198" width="24" height="32" rx="2"/>' +
    '</g>' +
    '<circle cx="234" cy="174" r="3" fill="#e4c07a" fill-opacity="0.8"/>';
  }
  return '<g>' +
    '<ellipse cx="160" cy="268" rx="98" ry="15" fill="' + a + '" fill-opacity="0.12"/>' +
    '<path d="M62 262 C96 236 126 246 158 238 C194 229 224 240 258 258" fill="none" stroke="' + a + '" stroke-opacity="0.55" stroke-width="1.5" stroke-linecap="round"/>' +
    '<path d="M78 274 C112 260 142 268 170 262 C204 255 232 264 256 274" fill="none" stroke="#f2f0ea" stroke-opacity="0.18" stroke-width="1" stroke-linecap="round"/>' +
    '<path d="M160 234 v-44 m0 0 l22 9 -22 9" fill="none" stroke="#e4c07a" stroke-opacity="0.68" stroke-width="1.2" stroke-linejoin="round"/>' +
    '<circle cx="198" cy="212" r="2.6" fill="#e4c07a" fill-opacity="0.8"/>' +
    '<path d="M92 246 q34 -26 68 -12" fill="none" stroke="' + a + '" stroke-opacity="0.4" stroke-width="1" stroke-dasharray="3 7" stroke-linecap="round"/>' +
  '</g>';
}
function v2hArt(char, look, variant) {
  var accent = look.accent || '#7aa2ff';
  var motif = V2H_MOTIFS[char.areaAffinity] || 'island';
  var key = String(char.id || 'hero').replace(/[^a-z0-9]/gi, '');
  var tag = 'v2h' + String(variant || 'x') + key;
  return '<svg class="v2-hero-art" viewBox="0 0 320 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' +
    '<defs>' +
      '<linearGradient id="' + tag + '-sky" x1="0" y1="0" x2="0.35" y2="1">' +
        '<stop offset="0" stop-color="#0d1626"/><stop offset="0.55" stop-color="#080d18"/><stop offset="1" stop-color="#04060c"/>' +
      '</linearGradient>' +
      '<radialGradient id="' + tag + '-glow" cx="0.5" cy="0.4" r="0.55">' +
        '<stop offset="0" stop-color="' + accent + '" stop-opacity="0.32"/>' +
        '<stop offset="0.62" stop-color="' + accent + '" stop-opacity="0.08"/>' +
        '<stop offset="1" stop-color="' + accent + '" stop-opacity="0"/>' +
      '</radialGradient>' +
      '<linearGradient id="' + tag + '-fade" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0.45" stop-color="#05070d" stop-opacity="0"/>' +
        '<stop offset="0.82" stop-color="#05070d" stop-opacity="0.55"/>' +
        '<stop offset="1" stop-color="#05070d" stop-opacity="0.9"/>' +
      '</linearGradient>' +
    '</defs>' +
    '<rect width="320" height="420" fill="url(#' + tag + '-sky)"/>' +
    '<rect width="320" height="420" fill="url(#' + tag + '-glow)"/>' +
    '<circle cx="160" cy="190" r="118" fill="none" stroke="' + accent + '" stroke-opacity="0.15"/>' +
    '<circle cx="160" cy="190" r="142" fill="none" stroke="' + accent + '" stroke-opacity="0.09" stroke-dasharray="2 9"/>' +
    v2hMotif(motif, accent) +
    v2hStars(char, accent) +
    '<rect y="236" width="320" height="184" fill="url(#' + tag + '-fade)"/>' +
  '</svg>';
}

/* -------------------------------------------------------------------------
   Cabecera con título y onda
   ------------------------------------------------------------------------- */
function v2hWaveSVG() {
  V2H.uid += 1;
  var id = 'v2hWave' + V2H.uid;
  return '<svg class="v2-hero-wave" viewBox="0 0 560 28" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
    '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="#69d3c1"/><stop offset="0.34" stop-color="#7aa2ff"/>' +
      '<stop offset="0.62" stop-color="#c49bff"/><stop offset="0.82" stop-color="#b8d46a"/>' +
      '<stop offset="1" stop-color="#f3b562" stop-opacity="0"/>' +
    '</linearGradient></defs>' +
    '<path d="M0 21 C50 6 92 6 130 15 C172 25 206 25 244 14 C286 2 318 4 356 13 C398 23 436 22 474 12 C508 3 536 6 560 15" fill="none" stroke="url(#' + id + ')" stroke-width="1.6" stroke-linecap="round"/>' +
    '<path d="M0 26 C48 14 90 14 128 21 C170 28 206 28 244 20 C286 10 318 12 356 20 C398 28 436 27 474 19 C508 12 536 14 560 22" fill="none" stroke="url(#' + id + ')" stroke-width="1" stroke-opacity="0.42" stroke-linecap="round"/>' +
  '</svg>';
}
function v2hHeader(eyebrow, titleHTML, lead) {
  var chars = v2hChars();
  var char = (typeof selectedCharacter === 'function' ? selectedCharacter() : null) || chars[0] || null;
  var look = (typeof selectedLook === 'function' ? selectedLook() : null) || (char ? v2hLook(char.id) : v2hLook('ilan'));
  var owned = state.collection.ownedCharacterIds.length;
  var honor = char && typeof titleText === 'function' ? titleText(char.id) : '';
  var frame = char && typeof frameColorFor === 'function' ? frameColorFor(char.id) : '';
  var avatar = char ? v2hPortrait(char.id, 92) : '';
  var avatarHTML = '<span class="v2-hero-avatar"' + (frame ? ' style="box-shadow:0 0 0 1px ' + frame + ',0 0 18px ' + frame + '66"' : '') + '>' +
    (avatar ? '<img src="' + avatar + '" alt="" draggable="false" />' : '<b>' + esc(char ? String(char.name || '◇').charAt(0) : '◇') + '</b>') +
  '</span>';
  return '<header class="v2-hero-head">' +
    '<div class="v2-hero-title">' +
      '<span class="eyebrow"><span class="kickerDot" style="background:' + look.accent + ';box-shadow:0 0 12px ' + look.accent + '"></span>' + esc(eyebrow) + '</span>' +
      '<h1>' + titleHTML + '</h1>' +
      v2hWaveSVG() +
      '<p>' + lead + '</p>' +
    '</div>' +
    '<div class="v2-hero-top">' +
      '<span class="v2-hero-owner">' + avatarHTML +
        '<span class="v2-hero-ownerText"><small>En ruta</small><b>' + esc(char ? char.name : '') + '</b>' +
        (honor ? '<em>«' + esc(honor) + '»</em>' : '') + '</span>' +
      '</span>' +
      '<span class="v2-hero-stat">' + icon('coin', 13) + '<b>' + formatNumber(state.coins) + '</b><small>monedas</small></span>' +
      '<span class="v2-hero-stat">' + icon('user', 13) + '<b>' + owned + '/' + chars.length + '</b><small>héroes</small></span>' +
      '<span class="v2-hero-stat v2-hero-stat--wide">' + icon('layers', 13) + '<b>' + countOwnedCosmetics() + '/' + countAllCosmetics() + '</b><small>cosméticos</small></span>' +
      '<button type="button" class="sheetClose v2-hero-close" data-action="close-sheet" aria-label="Cerrar y volver">' + icon('close', 17) + '</button>' +
    '</div>' +
  '</header>';
}

/* -------------------------------------------------------------------------
   Botón por estado + requisito
   ------------------------------------------------------------------------- */
function v2hRequirementLine(char, req, owned) {
  if (owned) return '';
  if (req.kind === 'reward') {
    var have = Number(req.missionsHave) || 0;
    var need = Number(req.missionsNeed) || 0;
    var pct = need ? Math.min(100, Math.round(have / need * 100)) : 0;
    return '<div class="v2-hero-req">' +
      '<span class="v2-hero-reqBar"><i style="width:' + pct + '%"></i></span>' +
      '<span class="v2-hero-reqText">' + icon('trophy', 10) + ' ' + have + '/' + need + ' misiones completadas</span>' +
    '</div>';
  }
  if (req.levelNeed && !req.levelMet) {
    return '<div class="v2-hero-req"><span class="v2-hero-reqText">' + icon('lock', 10) + ' Nivel ' + req.levelNeed + ' · actual ' + (req.levelHave || currentLevel()) + '</span></div>';
  }
  if (!req.coinsMet) {
    return '<div class="v2-hero-req"><span class="v2-hero-reqText">' + icon('coin', 10) + ' ' + formatNumber(req.price) + ' · tienes ' + formatNumber(state.coins) + '</span></div>';
  }
  return '';
}
function v2hCTA(char, owned, active, req) {
  if (owned) {
    if (active) {
      return '<button type="button" class="v2-hero-cta is-current" disabled aria-current="true">' + icon('checkCircle', 15) + ' En ruta</button>';
    }
    return '<button type="button" class="v2-hero-cta is-pick" data-action="select-hero" data-hero="' + esc(char.id) + '">' + icon('check', 15) + ' Elegir</button>';
  }
  if (req.kind === 'reward') {
    var have = Number(req.missionsHave) || 0;
    var need = Number(req.missionsNeed) || 0;
    if (req.canRecruit) {
      return '<button type="button" class="v2-hero-cta is-reward" data-action="open-recruit" data-hero="' + esc(char.id) + '" aria-label="Reclamar recompensa: ' + esc(char.name) + '">' + icon('trophy', 15) + ' Reclamar recompensa</button>';
    }
    return '<button type="button" class="v2-hero-cta is-blocked" data-action="open-recruit" data-hero="' + esc(char.id) + '" aria-label="Bloqueado: ' + have + ' de ' + need + ' misiones. Ver requisitos">' +
      icon('lock', 15) + ' Bloqueado · ' + have + '/' + need + ' misiones</button>';
  }
  if (req.canRecruit) {
    return '<button type="button" class="v2-hero-cta is-buy" data-action="open-recruit" data-hero="' + esc(char.id) + '" aria-label="Comprar a ' + esc(char.name) + ' por ' + formatNumber(req.price) + ' monedas">' +
      icon('coin', 15) + ' Comprar ◇ ' + formatNumber(req.price) + '</button>';
  }
  return '<button type="button" class="v2-hero-cta is-blocked" data-action="open-recruit" data-hero="' + esc(char.id) + '" aria-label="Bloqueado. Ver requisitos de ' + esc(char.name) + '">' +
    icon('lock', 15) + ' Bloqueado</button>';
}

/* -------------------------------------------------------------------------
   Tarjeta del carrusel
   ------------------------------------------------------------------------- */
function v2hCardHTML(char, index, centerIndex) {
  var chars = v2hChars();
  var look = v2hLook(char.id);
  var owned = state.collection.ownedCharacterIds.indexOf(char.id) !== -1;
  var active = state.collection.selectedCharacterId === char.id;
  var req = heroRequirementState(char);
  var honor = typeof titleText === 'function' ? titleText(char.id) : '';
  var frame = typeof frameColorFor === 'function' ? frameColorFor(char.id) : '';
  var portrait = v2hPortrait(char.id, 300);
  var rarity = String(char.rarity || 'comun').replace(/[^a-z_]/gi, '');
  var portraitHTML = portrait
    ? '<img class="v2-hero-portrait" src="' + portrait + '" alt="' + esc(char.name) + '" draggable="false"' + (frame ? ' style="filter:drop-shadow(0 0 16px ' + frame + '55)"' : '') + ' />'
    : '<span class="v2-hero-portrait is-empty"><b>' + esc(String(char.name || '◇').charAt(0)) + '</b></span>';
  var badge = active
    ? '<span class="v2-hero-badge is-active">' + icon('checkCircle', 10) + ' En ruta</span>'
    : owned
      ? '<span class="v2-hero-badge">' + icon('check', 10) + ' En colección</span>'
      : '<span class="v2-hero-badge is-locked">' + icon('lock', 10) + ' ' + (req.kind === 'reward' ? 'Recompensa' : 'Por reclutar') + '</span>';
  return '<article class="v2-carousel-card ' + v2hSlotClass(index - centerIndex) + '" data-v2-card="' + index + '" data-v2-id="' + esc(char.id) + '" role="group" aria-roledescription="tarjeta" aria-label="Héroe ' + (index + 1) + ' de ' + chars.length + ': ' + esc(char.name) + '">' +
    '<div class="v2-hero-card" style="--hero-accent:' + look.accent + '">' +
      '<div class="v2-hero-artBox">' + v2hArt(char, look, 'c' + index) + '</div>' +
      '<div class="v2-hero-media">' +
        portraitHTML +
        '<div class="v2-hero-stage" data-v2-stage aria-hidden="true"></div>' +
        '<span class="v2-hero-sideName" aria-hidden="true">' +
          '<span class="v2-hero-sideRarity v2-hero-rarity--' + esc(rarity) + '">' + esc(char.rarityLabel || 'Héroe') + '</span>' +
          '<b>' + esc(char.name) + '</b>' +
          '<small>' + esc(look.klass) + '</small>' +
        '</span>' +
      '</div>' +
      '<div class="v2-hero-copy">' +
        '<div class="v2-hero-badges">' +
          '<span class="v2-hero-rarity v2-hero-rarity--' + esc(rarity) + '">' + esc(char.rarityLabel || 'Héroe') + '</span>' +
          badge +
        '</div>' +
        '<span class="v2-hero-kicker">' + esc(look.klass) + ' · ' + esc(areaName(char.areaAffinity)) + '</span>' +
        '<h2 class="v2-hero-name">' + esc(char.name) + '</h2>' +
        (honor ? '<em class="v2-hero-honor">«' + esc(honor) + '»</em>' : '') +
        '<p class="v2-hero-desc">' + esc(v2hShort(char.description, 132)) + '</p>' +
        '<div class="v2-hero-tags">' +
          '<span class="v2-hero-tag">' + icon('seal', 10) + ' ' + esc(look.weapon) + '</span>' +
          '<span class="v2-hero-tag v2-hero-tag--title">' + icon('star', 10) + ' ' + esc(char.title || 'Ruta') + '</span>' +
        '</div>' +
        '<div class="v2-hero-attrs">' + v2hAttrRows(char, look) + '</div>' +
        '<div class="v2-hero-actions">' +
          v2hCTA(char, owned, active, req) +
          v2hRequirementLine(char, req, owned) +
        '</div>' +
      '</div>' +
    '</div>' +
  '</article>';
}

/* -------------------------------------------------------------------------
   Pantalla de héroes
   ------------------------------------------------------------------------- */
function v2hPrepareHeroes() {
  var chars = v2hChars();
  if (!chars.length) { V2H.index = 0; return; }
  if (V2H.prepared !== 'heroes') {
    var focusId = null;
    if (V2H.prevScreen === 'recruit' && V2H.lastRecruitId && CHARACTER_BY_ID[V2H.lastRecruitId]) focusId = V2H.lastRecruitId;
    if (!focusId) focusId = state.collection.selectedCharacterId;
    var idx = v2hIndexById(focusId);
    V2H.index = idx < 0 ? 0 : idx;
    if (V2H.prepared) V2H.prevScreen = V2H.prepared;
    V2H.prepared = 'heroes';
  }
  V2H.index = v2hClampIndex(V2H.index);
}
function v2hPrepareRecruit() {
  if (V2H.prepared !== 'recruit') {
    if (V2H.prepared) V2H.prevScreen = V2H.prepared;
    V2H.prepared = 'recruit';
  }
  if (recruitHeroId && CHARACTER_BY_ID[recruitHeroId]) V2H.lastRecruitId = recruitHeroId;
}
function v2hEmptyHTML() {
  return '<div class="overlay v2-hero-overlay"><div class="overlayShell v2-hero-shell">' +
    '<div class="v2-hero-empty"><b>No se encontró el elenco.</b><p>La campaña no tiene héroes disponibles en este momento.</p>' +
    '<button type="button" class="btn btn--ghost btn--sm" data-action="close-sheet">Volver ' + icon('chevronRight', 12) + '</button></div>' +
  '</div></div>';
}
function v2hSafetyHTML() {
  var chars = v2hChars();
  var rows = chars.map(function (c) {
    var owned = state.collection.ownedCharacterIds.indexOf(c.id) !== -1;
    var look = v2hLook(c.id);
    var img = v2hPortrait(c.id, 200);
    return '<button type="button" class="v2-hero-safeRow" ' + (owned ? 'data-action="select-hero"' : 'data-action="open-recruit"') + ' data-hero="' + esc(c.id) + '" style="--hero-accent:' + look.accent + '">' +
      (img ? '<img src="' + img + '" alt="" />' : '<span class="v2-hero-safeInitial">' + esc(String(c.name || '◇').charAt(0)) + '</span>') +
      '<span><b>' + esc(c.name) + '</b><small>' + esc(look.klass) + ' · ' + esc(look.weapon) + '</small></span>' +
    '</button>';
  }).join('');
  return '<div class="overlay v2-hero-overlay"><div class="overlayShell v2-hero-shell">' +
    '<div class="v2-hero-head"><div class="v2-hero-title"><span class="eyebrow"><span class="kickerDot"></span>Elenco del observatorio</span><h1>Elige quién camina <em>contigo.</em></h1></div>' +
    '<div class="v2-hero-top"><button type="button" class="sheetClose" data-action="close-sheet" aria-label="Cerrar">' + icon('close', 17) + '</button></div></div>' +
    '<div class="v2-hero-safeGrid">' + rows + '</div>' +
  '</div></div>';
}
function heroesScreenHTML() {
  try {
    var chars = v2hChars();
    if (!chars.length) return v2hEmptyHTML();
    v2hPrepareHeroes();
    var index = v2hCurrentIndex();
    var look = v2hLook(chars[index].id);
    var cards = [];
    for (var i = 0; i < chars.length; i++) cards.push(v2hCardHTML(chars[i], i, index));
    var dots = chars.map(function (c, dotIndex) {
      return '<button type="button" class="v2-carousel-dot' + (dotIndex === index ? ' is-active' : '') + '" data-action="v2-hero-goto" data-index="' + dotIndex + '" aria-label="Ver a ' + esc(c.name) + '" aria-current="' + (dotIndex === index ? 'true' : 'false') + '"></button>';
    }).join('');
    return '<div class="overlay v2-hero-overlay">' +
      '<div class="overlayShell v2-hero-shell">' +
        v2hHeader('Elenco del observatorio', 'Diez formas de mirar <em>un mismo caso.</em>', 'Desliza, arrastra o usa las flechas. El modelo gira con el arma y los cosméticos equipados.') +
        '<div class="v2-carousel" data-v2-carousel style="--hero-accent:' + look.accent + '">' +
          '<div class="v2-carousel-viewport" data-v2-viewport role="region" aria-roledescription="carrusel" aria-label="Héroes del observatorio">' +
            '<div class="v2-carousel-deck" data-v2-deck>' + cards.join('') + '</div>' +
            '<div class="v2-hero-sr" aria-live="polite" data-v2-live>Héroe ' + (index + 1) + ' de ' + chars.length + ': ' + esc(chars[index].name) + '</div>' +
          '</div>' +
          '<div class="v2-carousel-foot">' +
            '<button type="button" class="v2-carousel-nav" data-action="v2-hero-prev" aria-label="Héroe anterior"' + (index <= 0 ? ' disabled' : '') + '>' + icon('chevronLeft', 18) + '</button>' +
            '<span class="v2-carousel-pos"><b data-v2-pos>' + (index + 1) + '</b><small>/ ' + chars.length + '</small></span>' +
            '<div class="v2-carousel-dots" role="group" aria-label="Ir a un héroe">' + dots + '</div>' +
            V2H_KEYS_HTML +
            '<button type="button" class="v2-carousel-nav" data-action="v2-hero-next" aria-label="Héroe siguiente"' + (index >= chars.length - 1 ? ' disabled' : '') + '>' + icon('chevronRight', 18) + '</button>' +
          '</div>' +
        '</div>' +
        '<p class="v2-hero-note">Los héroes solo cambian la voz, la silueta y la lectura de cada ruta. Ninguno altera preguntas, claves ni recompensas. Toca una tarjeta lateral para acercarla.</p>' +
      '</div>' +
    '</div>';
  } catch (error) {
    V2.softError('heroes.screen', error);
    return v2hSafetyHTML();
  }
}

/* -------------------------------------------------------------------------
   Pantalla de reclutamiento
   ------------------------------------------------------------------------- */
function recruitScreenHTML() {
  try {
    var char = recruitHeroId && CHARACTER_BY_ID[recruitHeroId];
    if (!char) return '';
    v2hPrepareRecruit();
    var look = v2hLook(char.id);
    var req = heroRequirementState(char);
    var owned = req.owned;
    var isReward = req.kind === 'reward';
    var canRecruit = !owned && req.canRecruit;
    var level = typeof currentLevel === 'function' ? currentLevel() : 1;
    var honor = typeof titleText === 'function' ? titleText(char.id) : '';
    var rarity = String(char.rarity || 'comun').replace(/[^a-z_]/gi, '');
    var requirementRows = '';
    if (owned) {
      requirementRows = '<div class="v2-hero-reqRow is-met">' + icon('check', 12) + '<span>Ya forma parte de tu colección.</span></div>';
    } else if (isReward) {
      requirementRows = '<div class="v2-hero-reqRow ' + (req.canRecruit ? 'is-met' : '') + '">' + icon(req.canRecruit ? 'check' : 'lock', 12) + '<span>Completar ' + req.missionsNeed + ' misiones · ' + req.missionsHave + '/' + req.missionsNeed + '</span></div>' +
        '<div class="v2-hero-reqBarBig"><i style="width:' + (req.missionsNeed ? Math.min(100, Math.round((Number(req.missionsHave) || 0) / req.missionsNeed * 100)) : 0) + '%"></i></div>';
    } else {
      if (req.levelNeed) {
        requirementRows += '<div class="v2-hero-reqRow ' + (req.levelMet ? 'is-met' : '') + '">' + icon(req.levelMet ? 'check' : 'lock', 12) + '<span>Nivel ' + req.levelNeed + ' · actual ' + level + '</span></div>';
      }
      requirementRows += '<div class="v2-hero-reqRow ' + (req.coinsMet ? 'is-met' : '') + '">' + icon(req.coinsMet ? 'check' : 'lock', 12) + '<span>' + formatNumber(req.price) + ' monedas · tienes ' + formatNumber(state.coins) + '</span></div>';
    }
    var primary;
    if (owned) {
      primary = '<div class="v2-hero-notice"><b>Ya forma parte de tu colección.</b> Vuelve al carrusel para elegirlo.</div>' +
        '<button type="button" class="btn btn--primary btn--lg btn--block" data-action="select-hero" data-hero="' + esc(char.id) + '">' + icon('check', 16) + ' Elegir héroe</button>';
    } else if (canRecruit) {
      primary = '<button type="button" class="btn ' + (isReward ? 'btn--gold' : 'btn--primary') + ' btn--lg btn--block" data-action="recruit-confirm">' +
        icon(isReward ? 'trophy' : 'spark', 16) + (isReward ? ' Reclamar recompensa' : ' Reclutar por ◇' + formatNumber(req.price)) + '</button>' +
        '<p class="v2-hero-tiny">' + (isReward ? 'Esta recompensa no cuesta monedas.' : 'Se descontarán de tu saldo actual: ◇' + formatNumber(state.coins) + '. Sin dinero real.') + '</p>';
    } else {
      primary = '<button type="button" class="btn btn--block btn--lg" disabled>' + icon('lock', 16) + ' Reclutamiento bloqueado</button>' +
        '<p class="v2-hero-tiny">' + esc(req.reason) + '</p>';
    }
    return '<div class="overlay v2-hero-overlay">' +
      '<div class="overlayShell v2-hero-shell">' +
        v2hHeader('Ecos de la colección', 'Un nuevo rostro <em>para el observatorio.</em>', 'Las reglas originales se conservan: Ilan es inicial, Amaru se gana con misiones, Zenón exige nivel 8 y los demás se compran con monedas de estudio.') +
        '<div class="v2-hero-recruit" style="--hero-accent:' + look.accent + '">' +
          '<section class="v2-hero-recruitMedia">' +
            '<div class="v2-hero-recruitArt">' + v2hArt(char, look, 'r') + '</div>' +
            '<div class="v2-hero-stage" data-v2-stage aria-hidden="true"></div>' +
            '<div class="v2-hero-recruitPlaque">' +
              '<span class="v2-hero-rarity v2-hero-rarity--' + esc(rarity) + '">' + esc(char.rarityLabel || 'Héroe') + '</span>' +
              '<b>' + esc(char.name) + '</b>' +
              '<small>' + esc(look.klass) + ' · ' + esc(look.weapon) + '</small>' +
              (honor ? '<em>«' + esc(honor) + '»</em>' : '') +
            '</div>' +
          '</section>' +
          '<section class="panel v2-hero-recruitBody">' +
            '<div class="v2-hero-tags">' +
              '<span class="v2-hero-tag">' + icon('compass', 10) + ' ' + esc(areaName(char.areaAffinity)) + '</span>' +
              '<span class="v2-hero-tag">' + icon('seal', 10) + ' ' + esc(look.weapon) + '</span>' +
            '</div>' +
            '<h2 class="v2-hero-recruitName">' + esc(char.name) + '</h2>' +
            '<p class="v2-hero-kicker">' + esc(char.title) + ' · ' + esc(look.klass) + ' · ' + esc(char.rarityLabel) + '</p>' +
            '<p class="v2-hero-desc v2-hero-desc--full">' + esc(char.description) + '</p>' +
            (char.quote ? '<p class="v2-hero-quote">“' + esc(char.quote) + '”</p>' : '') +
            '<div class="v2-hero-attrs">' + v2hAttrRows(char, look) + '</div>' +
            '<div class="v2-hero-recruitDivider"></div>' +
            '<span class="eyebrow noRule">Requisitos originales</span>' +
            '<div class="v2-hero-reqList">' + requirementRows + '</div>' +
            '<div class="v2-hero-balance"><span>Tu saldo</span><b>◇ ' + formatNumber(state.coins) + '</b></div>' +
            '<div class="v2-hero-recruitActions">' + primary +
              '<button type="button" class="btn btn--quiet btn--block btn--sm" data-action="close-sheet">Volver a los héroes</button>' +
            '</div>' +
            '<p class="v2-hero-tiny">La compra se registra en tu guardado local. Los héroes no alteran preguntas, claves ni recompensas de ruta.</p>' +
          '</section>' +
        '</div>' +
        '<p class="v2-hero-note">La selección se guarda al instante y se refleja en el mundo 3D. Los requisitos y precios son los de la colección original.</p>' +
      '</div>' +
    '</div>';
  } catch (error) {
    V2.softError('heroes.recruit', error);
    return v2hSafetyHTML();
  }
}

/* -------------------------------------------------------------------------
   Modelo 3D: renderer propio, luces, arma y cosméticos
   ------------------------------------------------------------------------- */
function v2hEnsureRenderer() {
  if (V2H.renderer) return true;
  if (V2H.rendererFailed) return false;
  try {
    if (typeof THREE === 'undefined' || !THREE || !THREE.WebGLRenderer) throw new Error('three.js no disponible');
    var canvas = document.createElement('canvas');
    canvas.className = 'v2-hero-canvas';
    if (canvas.addEventListener) {
      canvas.addEventListener('webglcontextlost', function (event) {
        event.preventDefault();
        V2H.rendererFailed = true;
        v2hShowFallback(V2H.heroId);
      }, false);
    }
    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      /* Mismos ajustes que el visor del mundo: profundidad real y antialias.
         La geometría viene de part2-world (mergedVoxels): aquí no se genera. */
      antialias: true,
      alpha: true,
      depth: true,
      stencil: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    var ratio = Math.max(1, Math.min(1.5, window.devicePixelRatio || 1));
    if (V2.quality() === 'bajo') ratio = 1;
    renderer.setPixelRatio(ratio);
    renderer.setSize(300, 360, false);
    renderer.setClearColor(0x000000, 0);
    renderer.autoClear = true;
    renderer.sortObjects = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    var scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#c9d6ff', '#241a2e', 2.1));
    var key = new THREE.DirectionalLight('#ffe6ca', 2.4);
    key.position.set(-3, 6, 5.2);
    scene.add(key);
    var rim = new THREE.DirectionalLight('#7ba6ff', 1.5);
    rim.position.set(4.2, 3.6, -3);
    scene.add(rim);
    var accentLight = new THREE.PointLight('#7aa2ff', 0.9, 9, 2);
    accentLight.position.set(0, 1.7, 2.2);
    scene.add(accentLight);
    var camera = new THREE.PerspectiveCamera(26, 1, 0.1, 60);
    var pivot = new THREE.Group();
    scene.add(pivot);
    var ring = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.016, 4, 48),
      new THREE.MeshBasicMaterial({ color: color('#e4c07a'), transparent: true, opacity: 0.5 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.02;
    scene.add(ring);
    var ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.16, 0.007, 3, 56),
      new THREE.MeshBasicMaterial({ color: color('#7aa2ff'), transparent: true, opacity: 0.3 })
    );
    ring2.rotation.x = Math.PI / 2;
    ring2.position.y = 0.02;
    scene.add(ring2);
    var glow = makeGlowSprite('#7aa2ff', 3.5, 0.1);
    glow.position.set(0, 1.25, -0.45);
    scene.add(glow);
    var blob = makeBlob(2.6);
    blob.position.y = 0.012;
    scene.add(blob);
    V2H.canvas = canvas;
    V2H.renderer = renderer;
    V2H.scene = scene;
    V2H.camera = camera;
    V2H.pivot = pivot;
    V2H.ring = ring;
    V2H.ring2 = ring2;
    V2H.glow = glow;
    V2H.blob = blob;
    V2H.accentLight = accentLight;
    return true;
  } catch (error) {
    V2H.rendererFailed = true;
    V2.softError('heroes.renderer', error);
    return false;
  }
}
function v2hPose(avatar) {
  if (!avatar) return;
  if (avatar.root) avatar.root.rotation.y = 0;
  if (avatar.body) avatar.body.rotation.y = -0.02;
  if (avatar.head) {
    avatar.head.rotation.y = 0.12;
    avatar.head.rotation.z = -0.012;
  }
  if (avatar.rightArm) {
    avatar.rightArm.rotation.x = -0.18;
    avatar.rightArm.rotation.z = 0.94;
    avatar.rightArm.rotation.y = -0.05;
  }
  if (avatar.leftArm) {
    avatar.leftArm.rotation.x = -0.12;
    avatar.leftArm.rotation.z = -0.16;
  }
  if (avatar.rightLeg) avatar.rightLeg.rotation.x = -0.05;
  if (avatar.leftLeg) avatar.leftLeg.rotation.x = 0.04;
  if (avatar.weapon) {
    avatar.weapon.rotation.z = -0.88;
    avatar.weapon.rotation.x = 0.06;
    avatar.weapon.position.z = 0.12;
  }
  var id = avatar.id;
  if (id === 'lia') {
    if (avatar.rightArm) { avatar.rightArm.rotation.x = -0.06; avatar.rightArm.rotation.z = 1.15; }
    if (avatar.weapon) avatar.weapon.scale.setScalar(1.16);
  } else if (id === 'ona') {
    if (avatar.rightArm) avatar.rightArm.rotation.z = 1.06;
    if (avatar.weapon) avatar.weapon.scale.setScalar(1.08);
  } else if (id === 'mara' || id === 'teo' || id === 'zenon' || id === 'iris') {
    if (avatar.rightArm) avatar.rightArm.rotation.z = 0.82;
    if (avatar.weapon) avatar.weapon.rotation.z = -0.78;
  } else if (id === 'kian') {
    if (avatar.rightArm) { avatar.rightArm.rotation.x = 0.08; avatar.rightArm.rotation.z = 1.12; }
    if (avatar.weapon) avatar.weapon.rotation.z = -1.04;
  }
  if (avatar.cape) avatar.cape.rotation.x = -0.06;
  if (avatar.hairTail) avatar.hairTail.rotation.x = 0.04;
}
function v2hFrameCamera() {
  var camera = V2H.camera;
  var avatar = V2H.avatar;
  if (!camera || !avatar || !avatar.root) return;
  try {
    avatar.root.updateMatrixWorld(true);
    var box = new THREE.Box3().setFromObject(avatar.root);
    var center = box.getCenter(new THREE.Vector3());
    var extent = box.getSize(new THREE.Vector3());
    var aspect = camera.aspect || 1;
    var vFov = 26 * Math.PI / 180;
    var distV = (extent.y / 2) / Math.tan(vFov / 2);
    var hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    var distH = (extent.x / 2) / Math.tan(hFov / 2);
    var dist = Math.max(distV, distH * 1.05) * 1.2;
    camera.position.set(center.x + dist * 0.04, center.y + extent.y * 0.07, center.z + dist * 1.02);
    camera.lookAt(center.x, center.y - extent.y * 0.03, center.z);
    camera.updateProjectionMatrix();
    var ringScale = Math.max(0.62, Math.min(1.6, extent.x * 0.95));
    if (V2H.ring) V2H.ring.scale.setScalar(ringScale);
    if (V2H.ring2) V2H.ring2.scale.setScalar(ringScale);
    if (V2H.glow) V2H.glow.position.set(center.x, center.y - extent.y * 0.02, center.z - 0.45);
  } catch (error) {
    V2.softError('heroes.camera', error);
  }
}
function v2hBuildModel(heroId) {
  var pivot = V2H.pivot;
  if (!pivot) return false;
  if (V2H.avatar) {
    try {
      pivot.remove(V2H.avatar.root);
      if (typeof disposeObject === 'function') disposeObject(V2H.avatar.root);
    } catch (error) { /* la malla anterior ya no existe */ }
    V2H.avatar = null;
  }
  var avatar = null;
  try {
    avatar = buildHeroAvatar(heroId);
    if (typeof applyOutfitToAvatar === 'function') applyOutfitToAvatar(avatar, heroId);
    v2hPose(avatar);
    pivot.add(avatar.root);
    V2H.avatar = avatar;
    var look = v2hLook(heroId);
    if (V2H.ring) V2H.ring.material.color.set(look.accent);
    if (V2H.ring2) V2H.ring2.material.color.set(look.accent);
    if (V2H.glow) V2H.glow.material.color.set(look.accent);
    if (V2H.accentLight) V2H.accentLight.color.set(look.accent);
    V2H.spin = -0.42;
    pivot.rotation.y = V2H.spin;
    v2hFrameCamera();
    return true;
  } catch (error) {
    V2H.avatar = null;
    if (avatar && avatar.root) {
      try {
        if (avatar.root.parent) avatar.root.parent.remove(avatar.root);
        if (typeof disposeObject === 'function') disposeObject(avatar.root);
      } catch (disposeError) { /* malla incompleta */ }
    }
    V2.softError('heroes.model', error);
    return false;
  }
}
function v2hResizeStage(force) {
  var stage = V2H.stageHost;
  if (!stage || !V2H.renderer || !V2H.camera) return;
  var w = Math.round(stage.clientWidth || 0);
  var h = Math.round(stage.clientHeight || 0);
  if (w < 8 || h < 8) {
    V2H.dirty = true;
    return;
  }
  if (!force && V2H.stageW === w && V2H.stageH === h) return;
  V2H.stageW = w;
  V2H.stageH = h;
  V2H.renderer.setSize(w, h, false);
  V2H.camera.aspect = w / h;
  V2H.camera.updateProjectionMatrix();
  if (V2H.avatar) v2hFrameCamera();
  V2H.dirty = true;
}
function v2hRender() {
  if (!V2H.renderer || !V2H.scene || !V2H.camera) return;
  try {
    V2H.renderer.render(V2H.scene, V2H.camera);
    V2H.dirty = false;
  } catch (error) {
    V2H.rendererFailed = true;
    V2.softError('heroes.render', error);
    v2hShowFallback(V2H.heroId);
  }
}
function v2hShowFallback(heroId) {
  var stage = V2H.stageHost;
  if (!stage) return;
  stage.classList.add('is-2d');
  if (V2H.canvas && V2H.canvas.parentNode === stage) stage.removeChild(V2H.canvas);
  var img = stage.querySelector('.v2-hero-fallback');
  var src = v2hPortrait(heroId, 300);
  if (!img) {
    img = document.createElement('img');
    img.className = 'v2-hero-fallback';
    img.alt = '';
    img.draggable = false;
    stage.appendChild(img);
  }
  if (src) {
    img.src = src;
    img.classList.remove('is-empty');
  } else {
    img.removeAttribute('src');
    img.classList.add('is-empty');
  }
}
function v2hObserveStage(stage) {
  if (!stage || typeof ResizeObserver !== 'function') return;
  if (!V2H.stageObserver) {
    V2H.stageObserver = new ResizeObserver(function () {
      if (!V2H.mounted) return;
      v2hResizeStage(true);
      v2hRender();
    });
  }
  V2H.stageObserver.disconnect();
  V2H.stageObserver.observe(stage);
}
function v2hAttachStage(heroId) {
  var stage = V2H.stageHost;
  if (!stage) return;
  V2H.heroId = heroId;
  if (!V2H.rendererFailed && v2hEnsureRenderer()) {
    stage.classList.remove('is-2d');
    var fallback = stage.querySelector('.v2-hero-fallback');
    if (fallback) fallback.parentNode.removeChild(fallback);
    if (V2H.canvas) {
      if (V2H.canvas.parentNode && V2H.canvas.parentNode !== stage) V2H.canvas.parentNode.removeChild(V2H.canvas);
      if (V2H.canvas.parentNode !== stage) stage.insertBefore(V2H.canvas, stage.firstChild);
      V2H.stageW = 0;
      V2H.stageH = 0;
      v2hResizeStage(true);
    }
    v2hObserveStage(stage);
    if (v2hBuildModel(heroId)) {
      V2H.dirty = true;
      v2hRender();
      /* El layout de la tarjeta termina de asentarse en el mismo frame del
         montaje; un segundo encuadre evita el modelo a escala 0,985. */
      window.requestAnimationFrame(function () {
        if (!V2H.mounted || V2H.stageHost !== stage) return;
        v2hResizeStage(true);
        v2hRender();
      });
      return;
    }
  }
  if (V2H.stageObserver) V2H.stageObserver.disconnect();
  v2hShowFallback(heroId);
}
function v2hDisposeAll() {
  try {
    if (V2H.stageObserver) {
      V2H.stageObserver.disconnect();
      V2H.stageObserver = null;
    }
    if (V2H.avatar && V2H.pivot) {
      V2H.pivot.remove(V2H.avatar.root);
      if (typeof disposeObject === 'function') disposeObject(V2H.avatar.root);
    }
    V2H.avatar = null;
    [V2H.ring, V2H.ring2, V2H.blob].forEach(function (mesh) {
      if (!mesh) return;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
      if (mesh.parent) mesh.parent.remove(mesh);
    });
    if (V2H.glow) {
      if (V2H.glow.material) V2H.glow.material.dispose();
      if (V2H.glow.parent) V2H.glow.parent.remove(V2H.glow);
    }
    V2H.ring = V2H.ring2 = V2H.blob = V2H.glow = null;
    var renderer = V2H.renderer;
    if (V2H.canvas && V2H.canvas.parentNode) V2H.canvas.parentNode.removeChild(V2H.canvas);
    V2H.canvas = null;
    V2H.renderer = null;
    V2H.scene = null;
    V2H.camera = null;
    V2H.pivot = null;
    V2H.mounted = false;
    V2H.stageHost = null;
    if (renderer) {
      try { renderer.dispose(); } catch (error) {}
      try { if (renderer.forceContextLoss) renderer.forceContextLoss(); } catch (error) {}
    }
  } catch (error) {
    V2.softError('heroes.dispose', error);
  }
}

/* -------------------------------------------------------------------------
   Montaje y desmontaje
   ------------------------------------------------------------------------- */
function v2hLayout() {
  var carousel = V2H.carousel;
  var viewport = V2H.viewport;
  if (!carousel || !viewport) return;
  var w = Math.round(viewport.clientWidth || 0);
  var h = Math.round(viewport.clientHeight || 0);
  if (w < 40 || h < 40) return;
  /* Tarjeta central grande, proporción estable en 960×540 / 1024×768 / 1280×720. */
  var cardW = Math.min(w * 0.6, h * 1.42, 640);
  cardW = Math.max(cardW, Math.min(w * 0.82, 380));
  cardW = Math.min(cardW, w * 0.92);
  /* Las tarjetas laterales muestran media tarjeta: el borde interior queda
     bajo la central y el exterior dentro de la vista. Así se lee la vecina
     sin robar protagonismo a la ficha central. */
  var sideHalf = cardW * 0.39;
  var step = cardW * 0.5;
  /* No se recorta la tarjeta vecina: su borde exterior queda dentro de la
     vista (6 px de holgura para la proyección de rotateY). */
  var maxStep = w / 2 - sideHalf - 6;
  step = Math.min(step, Math.max(cardW * 0.34, maxStep));
  var step2 = step + cardW * 0.62;
  carousel.style.setProperty('--v2-card-w', Math.round(cardW) + 'px');
  carousel.style.setProperty('--v2-step', Math.round(step) + 'px');
  carousel.style.setProperty('--v2-step2', Math.round(step2) + 'px');
  carousel.classList.toggle('is-narrow', cardW < 460);
}
function v2hApplySlots() {
  var root = EL.screen;
  if (!root || screen !== 'heroes') return;
  var chars = v2hChars();
  var center = v2hCurrentIndex();
  var cards = root.querySelectorAll('[data-v2-card]');
  for (var i = 0; i < cards.length; i++) {
    var idx = Number(cards[i].getAttribute('data-v2-card'));
    if (!isFinite(idx)) idx = 0;
    cards[i].className = 'v2-carousel-card ' + v2hSlotClass(idx - center);
    if (idx === center) cards[i].setAttribute('aria-current', 'true');
    else cards[i].removeAttribute('aria-current');
  }
  var prev = root.querySelector('[data-action="v2-hero-prev"]');
  var next = root.querySelector('[data-action="v2-hero-next"]');
  if (prev) prev.disabled = center <= 0;
  if (next) next.disabled = center >= chars.length - 1;
  var pos = root.querySelector('[data-v2-pos]');
  if (pos) pos.textContent = String(center + 1);
  var dots = root.querySelectorAll('.v2-carousel-dot');
  for (var d = 0; d < dots.length; d++) {
    var active = d === center;
    dots[d].className = 'v2-carousel-dot' + (active ? ' is-active' : '');
    dots[d].setAttribute('aria-current', active ? 'true' : 'false');
  }
  var live = root.querySelector('[data-v2-live]');
  if (live && chars[center]) live.textContent = 'Héroe ' + (center + 1) + ' de ' + chars.length + ': ' + chars[center].name;
  if (V2H.carousel && chars[center]) V2H.carousel.style.setProperty('--hero-accent', v2hLook(chars[center].id).accent);
}
function v2hMount() {
  try {
    if (!V2H.booted) v2hBoot();
    if (typeof screen === 'undefined') return;
    if (screen !== 'heroes' && screen !== 'recruit') return;
    var root = EL.screen;
    if (!root) return;
    var chars = v2hChars();
    if (!chars.length) return;
    var hero = null;
    if (screen === 'heroes') hero = v2hCurrentHero();
    else if (recruitHeroId && CHARACTER_BY_ID[recruitHeroId]) hero = CHARACTER_BY_ID[recruitHeroId];
    if (!hero) return;
    V2H.mounted = true;
    V2H.reduced = !!V2.reducedMotion();
    V2H.carousel = root.querySelector('[data-v2-carousel]');
    V2H.viewport = root.querySelector('[data-v2-viewport]');
    V2H.deck = root.querySelector('[data-v2-deck]');
    if (screen === 'heroes') {
      v2hBindDeck();
      v2hLayout();
      v2hApplySlots();
    }
    V2H.stageHost = screen === 'heroes'
      ? root.querySelector('.v2-carousel-card.is-center [data-v2-stage]')
      : root.querySelector('[data-v2-stage]');
    v2hAttachStage(hero.id);
  } catch (error) {
    V2.softError('heroes.mount', error);
  }
}
function v2hUnmount() {
  if (V2H.prepared) {
    V2H.prevScreen = V2H.prepared;
    V2H.prepared = '';
  }
  V2H.mounted = false;
  V2H.carousel = null;
  V2H.viewport = null;
  V2H.deck = null;
  V2H.stageHost = null;
  V2H.drag = null;
  if (V2H.stageObserver) {
    V2H.stageObserver.disconnect();
    V2H.stageObserver = null;
  }
  V2H.suppressClick = false;
  V2H.stageW = 0;
  V2H.stageH = 0;
  if (V2H.avatar && V2H.pivot) {
    try {
      V2H.pivot.remove(V2H.avatar.root);
      if (typeof disposeObject === 'function') disposeObject(V2H.avatar.root);
    } catch (error) { /* nada que liberar */ }
  }
  V2H.avatar = null;
  if (V2H.canvas && V2H.canvas.parentNode) V2H.canvas.parentNode.removeChild(V2H.canvas);
}
function v2hUpdate(dt, time) {
  if (!V2H.mounted) return;
  if (typeof screen === 'undefined') return;
  if (screen !== 'heroes' && screen !== 'recruit') return;
  if (V2H.rendererFailed) return;
  if (!V2H.renderer || !V2H.scene || !V2H.camera || !V2H.avatar) return;
  if (document.hidden) return;
  V2H.reduced = !!V2.reducedMotion();
  V2H.frames += 1;
  if ((!V2H.stageW || !V2H.stageH) && (V2H.frames % 20 === 0)) v2hResizeStage(true);
  if (V2.quality() === 'bajo' && (V2H.frames % 2)) return;
  var step = Math.max(0, Math.min(0.05, Number(dt) || 0));
  var t = Number(time) || 0;
  if (V2H.reduced) {
    if (!V2H.dirty) return;
    v2hRender();
    return;
  }
  V2H.spin += step * 0.36;
  if (V2H.pivot) V2H.pivot.rotation.y = V2H.spin;
  var avatar = V2H.avatar;
  if (avatar.body) avatar.body.position.y = Math.sin(t * 1.5) * 0.012;
  if (avatar.head) avatar.head.rotation.y = 0.12 + Math.sin(t * 0.6) * 0.03;
  if (typeof animateAvatarCosmetics === 'function') {
    try { animateAvatarCosmetics(avatar, step, t, false, 0); } catch (error) { /* cosmético sin animación */ }
  }
  if (V2H.ring) V2H.ring.rotation.z = t * 0.1;
  if (V2H.ring2) V2H.ring2.rotation.z = -t * 0.07;
  v2hRender();
}

/* -------------------------------------------------------------------------
   Navegación del carrusel
   ------------------------------------------------------------------------- */
function v2hGoTo(index) {
  if (!V2H.mounted || screen !== 'heroes') return;
  var chars = v2hChars();
  if (!chars.length) return;
  var next = Math.max(0, Math.min(chars.length - 1, Math.round(Number(index) || 0)));
  if (next === v2hCurrentIndex()) return;
  V2H.index = next;
  v2hApplySlots();
  var hero = chars[next];
  var root = EL.screen;
  var stage = root ? root.querySelector('.v2-carousel-card.is-center [data-v2-stage]') : null;
  if (stage) {
    V2H.stageHost = stage;
    v2hAttachStage(hero.id);
  }
  try { sfxClick(); } catch (error) {}
}
function v2hStep(delta) {
  if (!V2H.mounted || screen !== 'heroes') return;
  var value = Number(delta) || 0;
  if (!value) return;
  v2hGoTo(v2hCurrentIndex() + (value > 0 ? 1 : -1));
}
function v2hChooseCurrent() {
  if (!V2H.mounted || screen !== 'heroes') return;
  var hero = v2hCurrentHero();
  if (!hero) return;
  var owned = state.collection.ownedCharacterIds.indexOf(hero.id) !== -1;
  if (!owned) {
    if (typeof openRecruit === 'function') openRecruit(hero.id);
    return;
  }
  if (state.collection.selectedCharacterId !== hero.id && typeof selectHero === 'function') selectHero(hero.id);
}
function v2hOpen() {
  if (typeof screen !== 'undefined' && screen === 'duel') return;
  if (screen === 'heroes' || screen === 'recruit') {
    if (!V2H.mounted) v2hMount();
    return;
  }
  if (typeof openHeroes === 'function') openHeroes();
}
function v2hClose() {
  if (typeof screen === 'undefined') return;
  if (screen === 'heroes' || screen === 'recruit') {
    if (typeof closeSheet === 'function') closeSheet();
  }
}

/* -------------------------------------------------------------------------
   Gestos: arrastre, rueda y clic en tarjetas laterales
   ------------------------------------------------------------------------- */
function v2hBindDeck() {
  var view = V2H.viewport;
  if (!view || view.getAttribute('data-v2-bound') === '1') return;
  view.setAttribute('data-v2-bound', '1');
  view.addEventListener('pointerdown', v2hPointerDown);
  view.addEventListener('wheel', v2hWheel, { passive: false });
}
function v2hPointerDown(event) {
  if (!V2H.mounted || screen !== 'heroes') return;
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  V2H.drag = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, moved: false };
  window.addEventListener('pointermove', v2hPointerMove, false);
  window.addEventListener('pointerup', v2hPointerUp, false);
  window.addEventListener('pointercancel', v2hPointerEnd, false);
}
function v2hPointerMove(event) {
  var drag = V2H.drag;
  if (!drag || event.pointerId !== drag.id) return;
  drag.dx = event.clientX - drag.x;
  var dy = event.clientY - drag.y;
  if (!drag.moved && Math.abs(drag.dx) > 8 && Math.abs(drag.dx) > Math.abs(dy)) drag.moved = true;
}
function v2hPointerEnd() {
  V2H.drag = null;
  window.removeEventListener('pointermove', v2hPointerMove, false);
  window.removeEventListener('pointerup', v2hPointerUp, false);
  window.removeEventListener('pointercancel', v2hPointerEnd, false);
}
function v2hPointerUp(event) {
  var drag = V2H.drag;
  if (!drag || event.pointerId !== drag.id) {
    v2hPointerEnd();
    return;
  }
  var dx = drag.dx;
  var moved = drag.moved;
  v2hPointerEnd();
  if (!moved) return;
  V2H.suppressClick = true;
  window.clearTimeout(V2H.suppressTimer);
  V2H.suppressTimer = window.setTimeout(function () { V2H.suppressClick = false; }, 300);
  if (dx <= -40) v2hStep(1);
  else if (dx >= 40) v2hStep(-1);
}
function v2hWheel(event) {
  if (!V2H.mounted || screen !== 'heroes') return;
  if (event.ctrlKey) return;
  var now = Date.now();
  var absX = Math.abs(event.deltaX || 0);
  var absY = Math.abs(event.deltaY || 0);
  var delta = absX > absY ? event.deltaX : event.deltaY;
  if (!delta || Math.abs(delta) < 6) return;
  event.preventDefault();
  if (now - V2H.wheelAt < 260) return;
  V2H.wheelAt = now;
  v2hStep(delta > 0 ? 1 : -1);
}

/* -------------------------------------------------------------------------
   Teclado y clic
   ------------------------------------------------------------------------- */
function v2hOnClick(event) {
  if (!V2H.booted) return;
  if (typeof screen === 'undefined') return;
  if (screen !== 'heroes' && screen !== 'recruit') return;
  if (V2H.suppressClick) {
    V2H.suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  var target = event.target && event.target.closest ? event.target.closest('[data-action]') : null;
  var action = target ? target.getAttribute('data-action') : '';
  if (action && action.indexOf('v2-hero-') === 0) {
    event.preventDefault();
    if (action === 'v2-hero-prev') v2hStep(-1);
    else if (action === 'v2-hero-next') v2hStep(1);
    else if (action === 'v2-hero-goto') v2hGoTo(Number(target.getAttribute('data-index')));
    return;
  }
  if (screen !== 'heroes') return;
  var card = event.target && event.target.closest ? event.target.closest('[data-v2-card]') : null;
  if (!card) return;
  if (event.target.closest('button, a, input, select, textarea, [role="button"]')) return;
  var idx = Number(card.getAttribute('data-v2-card'));
  if (!isFinite(idx)) return;
  if (idx === v2hCurrentIndex()) return;
  event.preventDefault();
  event.stopPropagation();
  v2hGoTo(idx);
}
function v2hOnKey(event) {
  if (event.defaultPrevented) return;
  if (!V2H.booted || !V2H.mounted) return;
  if (typeof screen === 'undefined') return;
  if (screen !== 'heroes' && screen !== 'recruit') return;
  var target = event.target;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) return;
  var code = event.code || '';
  if (screen === 'recruit') {
    if (code === 'Escape') {
      event.preventDefault();
      v2hClose();
    }
    return;
  }
  if (code === 'ArrowLeft') { event.preventDefault(); v2hStep(-1); return; }
  if (code === 'ArrowRight') { event.preventDefault(); v2hStep(1); return; }
  if (code === 'Home') { event.preventDefault(); v2hGoTo(0); return; }
  if (code === 'End') { event.preventDefault(); v2hGoTo(v2hChars().length - 1); return; }
  if (code === 'Enter' || code === 'NumpadEnter') {
    var active = document.activeElement;
    if (active && active !== document.body && active.closest && active.closest('button, a, input, select, textarea')) return;
    event.preventDefault();
    v2hChooseCurrent();
    return;
  }
  if (code === 'Escape') {
    event.preventDefault();
    v2hClose();
  }
}
function v2hOnResize() {
  if (!V2H.mounted) return;
  if (typeof screen === 'undefined') return;
  if (screen !== 'heroes' && screen !== 'recruit') return;
  if (screen === 'heroes') v2hLayout();
  v2hResizeStage();
  v2hRender();
}
function v2hOnVisibility() {
  if (document.hidden) return;
  if (!V2H.mounted) return;
  V2H.dirty = true;
  if (!V2.reducedMotion()) v2hRender();
}

/* -------------------------------------------------------------------------
   Arranque
   ------------------------------------------------------------------------- */
function v2hBoot() {
  if (V2H.booted) return;
  V2H.booted = true;
  document.addEventListener('click', v2hOnClick, true);
  window.addEventListener('keydown', v2hOnKey, false);
  window.addEventListener('resize', v2hOnResize, { passive: true });
  window.addEventListener('orientationchange', v2hOnResize, { passive: true });
  document.addEventListener('visibilitychange', v2hOnVisibility, { passive: true });
  window.addEventListener('pagehide', v2hDisposeAll, { once: true });
  window.addEventListener('pageshow', function (event) {
    if (!event || !event.persisted) return;
    V2H.rendererFailed = false;
    if (typeof screen !== 'undefined' && (screen === 'heroes' || screen === 'recruit')) v2hMount();
  });
}

/* -------------------------------------------------------------------------
   API V2
   ------------------------------------------------------------------------- */
V2.heroes = {
  boot: v2hBoot,
  mount: v2hMount,
  unmount: v2hUnmount,
  update: v2hUpdate,
  open: v2hOpen,
  close: v2hClose
};
