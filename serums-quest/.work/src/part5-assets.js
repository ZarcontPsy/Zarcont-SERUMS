/* =========================================================================
   SERUMS QUEST · V2 · AGENTE 3 — assets y mundo visual
   Catálogo de props por isla, decoración del atrio, esbirros decorativos,
   cielo/aurora, partículas ambientales y variantes del escenario de duelo.
   Todo es geometría y canvas generados en código: sin texturas externas,
   sin imágenes de IA, sin red. ES5 (var/function) y defensivo si faltan
   THREE / hubGroup / mapState.
   ========================================================================= */

/* -------------------------------------------------------------------------
   Puente con el núcleo V2 y utilidades locales
   ------------------------------------------------------------------------- */
function v2aCore() {
  try {
    if (typeof V2 !== 'undefined' && V2) return V2;
  } catch (e) {}
  try { return window.__SERUMS_V2__ || null; } catch (e2) { return null; }
}
function v2aSoft(error) {
  var core = v2aCore();
  try { if (core && core.softError) core.softError('assets', error); } catch (e) {}
}
function v2aQuality() {
  var core = v2aCore();
  var q = 'medio';
  try { if (core && core.quality) q = core.quality(); } catch (e) {}
  if (q !== 'bajo' && q !== 'medio' && q !== 'alto') q = 'medio';
  return q;
}
function v2aBudget() {
  var core = v2aCore();
  try {
    if (core && core.budget) {
      var b = core.budget();
      if (b && b.props && b.particles) return b;
    }
  } catch (e) {}
  var q = v2aQuality();
  if (q === 'bajo') return { props: 5, particles: 18, decor: 10, maxDrawCalls: 70, glow: 0.55 };
  if (q === 'alto') return { props: 12, particles: 80, decor: 26, maxDrawCalls: 150, glow: 1 };
  return { props: 8, particles: 45, decor: 18, maxDrawCalls: 105, glow: 0.8 };
}
function v2aRandom(seed) {
  var core = v2aCore();
  try { if (core && core.rand) return core.rand(seed); } catch (e) {}
  var s = Number(seed) || 1;
  return function () {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function v2aHex2(n) {
  var s = Math.round(Math.max(0, Math.min(255, n))).toString(16);
  return s.length < 2 ? '0' + s : s;
}
function v2aTint(hex, factor) {
  var h = String(hex == null ? '#7aa2ff' : hex).replace('#', '');
  if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
  if (h.length < 6) h = '7aa2ff';
  var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  if (!isFinite(r)) r = 122;
  if (!isFinite(g)) g = 162;
  if (!isFinite(b)) b = 255;
  var f = factor == null ? 1 : Number(factor);
  if (!isFinite(f)) f = 1;
  return '#' + v2aHex2(r * f) + v2aHex2(g * f) + v2aHex2(b * f);
}
function v2aColor(hex) {
  try { return new THREE.Color(hex); } catch (e) { return null; }
}
function v2aNoop() {}
function v2aDispose(root) {
  if (!root) return;
  try {
    if (typeof disposeObject === 'function') { disposeObject(root); return; }
  } catch (e) { v2aSoft(e); }
  if (root.parent) root.parent.remove(root);
}
function v2aMerge(boxes) {
  if (!boxes || !boxes.length) return null;
  if (typeof mergedVoxels !== 'function') return null;
  var group = null;
  try { group = mergedVoxels(boxes); } catch (e) { v2aSoft(e); return null; }
  try {
    group.traverse(function (node) {
      if (node && (node.isMesh || node.isInstancedMesh)) {
        node.castShadow = false;
        node.receiveShadow = false;
      }
    });
  } catch (e2) {}
  return group;
}
function v2aMarkDecorative(root) {
  if (!root || !root.traverse) return root;
  try {
    root.traverse(function (node) {
      if (!node) return;
      node.userData = node.userData || {};
      node.userData.v2aDecorative = true;
      if (node.isMesh || node.isInstancedMesh || node.isSprite || node.isPoints || node.isLine) node.raycast = v2aNoop;
    });
  } catch (e) { v2aSoft(e); }
  return root;
}
function v2aSnapYaw(yaw) {
  return Math.round(yaw / (Math.PI / 2)) * (Math.PI / 2);
}
function v2aPlaceBox(out, box, place) {
  var yaw = place.yaw || 0;
  var c = Math.round(Math.cos(yaw));
  var s = Math.round(Math.sin(yaw));
  var scale = place.scale == null ? 1 : place.scale;
  var lx = box[0] * scale, ly = box[1] * scale, lz = box[2] * scale;
  var wx = place.x + lx * c + lz * s;
  var wz = place.z - lx * s + lz * c;
  var w = box[3] * scale, d = box[5] * scale;
  if (s !== 0) { var tmp = w; w = d; d = tmp; }
  out.push([wx, place.y + ly, wz, w, box[4] * scale, d, box[6], box[7]]);
}
function v2aCanvas(width, height) {
  try {
    var c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    return c;
  } catch (e) { return null; }
}
function v2aTexture(canvas) {
  if (!canvas) return null;
  try {
    var tex = new THREE.CanvasTexture(canvas);
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  } catch (e) { v2aSoft(e); return null; }
}

/* -------------------------------------------------------------------------
   Catálogo maestro (ids estables en kebab-case con prefijo v2-)
   ------------------------------------------------------------------------- */
var V2A_AREA_ORDER = [
  'area-psi-salud-publica',
  'area-psi-cuidado-integral',
  'area-psi-etica',
  'area-psi-investigacion',
  'area-psi-gestion'
];
var V2A_AREA_META = {
  'area-psi-salud-publica': { accent: '#69D3C1', alt: '#B8D46A', motif: 'raices', short: 'Salud pública' },
  'area-psi-cuidado-integral': { accent: '#7AA2FF', alt: '#69D3C1', motif: 'pulso', short: 'Cuidado integral' },
  'area-psi-etica': { accent: '#C49BFF', alt: '#E4C07A', motif: 'balanza', short: 'Ética e interculturalidad' },
  'area-psi-investigacion': { accent: '#B8D46A', alt: '#7AA2FF', motif: 'prisma', short: 'Investigación' },
  'area-psi-gestion': { accent: '#F3B562', alt: '#C49BFF', motif: 'engranaje', short: 'Gestión de servicios' }
};

/* Cada entrada: id, label, kind y el arquetipo voxel que la dibuja.
   Los cinco primeros de cada área son la selección de calidad baja;
   el orden también reparte los props por los doce anillos del atrio. */
var V2A_PROPS = {
  'area-psi-salud-publica': [
    { id: 'v2-sp-arco-raices', label: 'Arco de raíces', kind: 'estructura', arch: 'arco' },
    { id: 'v2-sp-arbol-comunitario', label: 'Árbol comunitario', kind: 'vegetacion', arch: 'arbol' },
    { id: 'v2-sp-brasero-asamblea', label: 'Brasero de asamblea', kind: 'luz', arch: 'brasero' },
    { id: 'v2-sp-tambor-ronda', label: 'Tambor de ronda', kind: 'instrumento', arch: 'tambor' },
    { id: 'v2-sp-huerto-comunitario', label: 'Huerto comunitario', kind: 'vegetacion', arch: 'huerto' },
    { id: 'v2-sp-faro-territorio', label: 'Faro del territorio', kind: 'luz', arch: 'faro' },
    { id: 'v2-sp-fuente-manantial', label: 'Fuente manantial', kind: 'agua', arch: 'fuente' },
    { id: 'v2-sp-totem-territorio', label: 'Tótem del territorio', kind: 'estructura', arch: 'totem' },
    { id: 'v2-sp-bancal-juncos', label: 'Bancal de juncos', kind: 'vegetacion', arch: 'juncos' },
    { id: 'v2-sp-banco-encuentro', label: 'Banco de encuentro', kind: 'estructura', arch: 'banco' },
    { id: 'v2-sp-mesa-mapas', label: 'Mesa de mapas', kind: 'estructura', arch: 'mesa' },
    { id: 'v2-sp-campana-comunidad', label: 'Campana de comunidad', kind: 'instrumento', arch: 'campana' }
  ],
  'area-psi-cuidado-integral': [
    { id: 'v2-ci-arco-corazon', label: 'Arco del corazón', kind: 'estructura', arch: 'arco' },
    { id: 'v2-ci-arbol-cuna', label: 'Árbol cuna', kind: 'vegetacion', arch: 'arbol' },
    { id: 'v2-ci-brasero-pulso', label: 'Brasero del pulso', kind: 'luz', arch: 'brasero' },
    { id: 'v2-ci-campanas-suaves', label: 'Campanas suaves', kind: 'instrumento', arch: 'campana' },
    { id: 'v2-ci-fuente-marea', label: 'Fuente de marea', kind: 'agua', arch: 'fuente' },
    { id: 'v2-ci-jardin-romero', label: 'Jardín de romero', kind: 'vegetacion', arch: 'jardin' },
    { id: 'v2-ci-faro-escucha', label: 'Faro de escucha', kind: 'luz', arch: 'faro' },
    { id: 'v2-ci-pilar-abrazo', label: 'Pilar del abrazo', kind: 'estructura', arch: 'pilar' },
    { id: 'v2-ci-espejo-pulso', label: 'Espejo del pulso', kind: 'estructura', arch: 'espejo' },
    { id: 'v2-ci-banco-ternura', label: 'Banco de ternura', kind: 'estructura', arch: 'banco' },
    { id: 'v2-ci-lente-vinculo', label: 'Lente del vínculo', kind: 'instrumento', arch: 'lente' },
    { id: 'v2-ci-huerto-calma', label: 'Huerto de calma', kind: 'vegetacion', arch: 'huerto' }
  ],
  'area-psi-etica': [
    { id: 'v2-et-arco-balanzas', label: 'Arco de balanzas', kind: 'estructura', arch: 'arco' },
    { id: 'v2-et-arbol-testigo', label: 'Árbol testigo', kind: 'vegetacion', arch: 'arbol' },
    { id: 'v2-et-brasero-juramento', label: 'Brasero del juramento', kind: 'luz', arch: 'brasero' },
    { id: 'v2-et-campana-silencio', label: 'Campana del silencio', kind: 'instrumento', arch: 'campana' },
    { id: 'v2-et-fuente-juramento', label: 'Fuente del juramento', kind: 'agua', arch: 'fuente' },
    { id: 'v2-et-espejo-velo', label: 'Espejo del velo', kind: 'estructura', arch: 'espejo' },
    { id: 'v2-et-obelisco-dignidad', label: 'Obelisco de la dignidad', kind: 'estructura', arch: 'totem' },
    { id: 'v2-et-jardin-hibisco', label: 'Jardín de hibisco', kind: 'vegetacion', arch: 'jardin' },
    { id: 'v2-et-pozo-velo', label: 'Pozo del velo', kind: 'agua', arch: 'pozo' },
    { id: 'v2-et-lente-confianza', label: 'Lente de confianza', kind: 'instrumento', arch: 'lente' },
    { id: 'v2-et-pilar-testimonio', label: 'Pilar del testimonio', kind: 'estructura', arch: 'pilar' },
    { id: 'v2-et-mesa-acuerdos', label: 'Mesa de acuerdos', kind: 'estructura', arch: 'mesa' }
  ],
  'area-psi-investigacion': [
    { id: 'v2-in-prisma-faro', label: 'Prisma faro', kind: 'luz', arch: 'prisma' },
    { id: 'v2-in-arbol-datos', label: 'Árbol de datos', kind: 'vegetacion', arch: 'arbol' },
    { id: 'v2-in-brasero-hipotesis', label: 'Brasero de hipótesis', kind: 'luz', arch: 'brasero' },
    { id: 'v2-in-lente-observatorio', label: 'Lente del observatorio', kind: 'instrumento', arch: 'lente' },
    { id: 'v2-in-estanque-muestra', label: 'Estanque de muestra', kind: 'agua', arch: 'pozo' },
    { id: 'v2-in-arco-evidencia', label: 'Arco de la evidencia', kind: 'estructura', arch: 'arco' },
    { id: 'v2-in-mesa-planos', label: 'Mesa de planos', kind: 'estructura', arch: 'mesa' },
    { id: 'v2-in-esfera-evidencia', label: 'Esfera de evidencia', kind: 'instrumento', arch: 'globo' },
    { id: 'v2-in-tubo-ensayo', label: 'Tubo de ensayo', kind: 'instrumento', arch: 'tubo' },
    { id: 'v2-in-pilar-validez', label: 'Pilar de validez', kind: 'estructura', arch: 'pilar' },
    { id: 'v2-in-jardin-helechos', label: 'Jardín de helechos', kind: 'vegetacion', arch: 'jardin' },
    { id: 'v2-in-atril-bitacora', label: 'Atril de bitácora', kind: 'estructura', arch: 'atril' }
  ],
  'area-psi-gestion': [
    { id: 'v2-ge-torre-engranajes', label: 'Torre de engranajes', kind: 'estructura', arch: 'reloj' },
    { id: 'v2-ge-arbol-turnos', label: 'Árbol de turnos', kind: 'vegetacion', arch: 'arbol' },
    { id: 'v2-ge-brasero-equipo', label: 'Brasero de equipo', kind: 'luz', arch: 'brasero' },
    { id: 'v2-ge-astrolabio-rutas', label: 'Astrolabio de rutas', kind: 'instrumento', arch: 'lente' },
    { id: 'v2-ge-fuente-canales', label: 'Fuente de canales', kind: 'agua', arch: 'fuente' },
    { id: 'v2-ge-arco-planificacion', label: 'Arco de planificación', kind: 'estructura', arch: 'arco' },
    { id: 'v2-ge-mesa-tablero', label: 'Mesa de tablero', kind: 'estructura', arch: 'mesa' },
    { id: 'v2-ge-tambor-turnos', label: 'Tambor de turnos', kind: 'instrumento', arch: 'tambor' },
    { id: 'v2-ge-faro-calidad', label: 'Faro de calidad', kind: 'luz', arch: 'faro' },
    { id: 'v2-ge-pilar-procesos', label: 'Pilar de procesos', kind: 'estructura', arch: 'pilar' },
    { id: 'v2-ge-huerto-suministro', label: 'Huerto de suministro', kind: 'vegetacion', arch: 'huerto' },
    { id: 'v2-ge-brujula-servicios', label: 'Brújula de servicios', kind: 'instrumento', arch: 'globo' }
  ]
};

var V2A_MINION_LIST = [
  { id: 'v2-minion-brote', label: 'Brote de ronda', kind: 'esbirro', areaId: 'area-psi-salud-publica' },
  { id: 'v2-minion-pulso', label: 'Pulso de cuidado', kind: 'esbirro', areaId: 'area-psi-cuidado-integral' },
  { id: 'v2-minion-velo', label: 'Velo de confianza', kind: 'esbirro', areaId: 'area-psi-etica' },
  { id: 'v2-minion-prisma', label: 'Prisma de evidencia', kind: 'esbirro', areaId: 'area-psi-investigacion' },
  { id: 'v2-minion-engranaje', label: 'Engranaje de equipo', kind: 'esbirro', areaId: 'area-psi-gestion' }
];
var V2A_ARENA_LIST = [
  { id: 'v2-arena-raices', label: 'Raíces del territorio', kind: 'arena', areaId: 'area-psi-salud-publica' },
  { id: 'v2-arena-marea', label: 'Marea del cuidado', kind: 'arena', areaId: 'area-psi-cuidado-integral' },
  { id: 'v2-arena-velo', label: 'Velo de la confianza', kind: 'arena', areaId: 'area-psi-etica' },
  { id: 'v2-arena-prisma', label: 'Prisma de la evidencia', kind: 'arena', areaId: 'area-psi-investigacion' },
  { id: 'v2-arena-engranajes', label: 'Engranajes del sistema', kind: 'arena', areaId: 'area-psi-gestion' }
];
var V2A_SKY_LIST = [
  { id: 'v2-sky-nebulosa', label: 'Nebulosa del observatorio', kind: 'cielo' },
  { id: 'v2-sky-aurora-azul', label: 'Aurora azul', kind: 'cielo' },
  { id: 'v2-sky-aurora-verde', label: 'Aurora verde agua', kind: 'cielo' },
  { id: 'v2-sky-aurora-violeta', label: 'Aurora violeta', kind: 'cielo' },
  { id: 'v2-sky-polvo-estelar', label: 'Polvo estelar', kind: 'cielo' }
];

/* Doce anillos alrededor de cada puerta (radio 7.1 del atrio).
   Se mantiene libre el corredor radial: ningún slot baja de 0.20 rad. */
var V2A_HUB_SLOTS = [
  { r: 6.40, off: -0.50, y: 0.00, scale: 0.98 },
  { r: 6.40, off: 0.50, y: 0.00, scale: 0.98 },
  { r: 6.95, off: -0.32, y: 0.00, scale: 0.96 },
  { r: 6.95, off: 0.32, y: 0.00, scale: 0.96 },
  { r: 7.80, off: -0.45, y: 0.00, scale: 1.00 },
  { r: 7.80, off: 0.45, y: 0.00, scale: 1.00 },
  { r: 7.80, off: -0.20, y: 0.00, scale: 0.94 },
  { r: 7.80, off: 0.20, y: 0.00, scale: 0.94 },
  { r: 8.55, off: -0.52, y: 0.10, scale: 0.92 },
  { r: 8.55, off: 0.52, y: 0.10, scale: 0.92 },
  { r: 8.60, off: -0.36, y: 0.10, scale: 0.90 },
  { r: 8.60, off: 0.36, y: 0.10, scale: 0.90 }
];

/* Doce posiciones sobre el borde de cada isla del mapa (radio útil 2.7).
   Se evitan el centro, los nodos, la puerta del jefe y las etiquetas. */
var V2A_MAP_SLOTS = [
  { a: 0, r: 2.30, s: 0.34 },
  { a: 20, r: 2.10, s: 0.32 },
  { a: 38, r: 2.36, s: 0.30 },
  { a: 54, r: 2.05, s: 0.31 },
  { a: 126, r: 2.12, s: 0.33 },
  { a: 146, r: 2.30, s: 0.29 },
  { a: 166, r: 2.02, s: 0.32 },
  { a: 186, r: 2.32, s: 0.30 },
  { a: 206, r: 2.10, s: 0.33 },
  { a: 226, r: 2.30, s: 0.29 },
  { a: 306, r: 2.18, s: 0.32 },
  { a: 330, r: 2.30, s: 0.30 }
];

/* -------------------------------------------------------------------------
   Paletas por área (obsidiana + acento + secundario)
   ------------------------------------------------------------------------- */
function v2aAreaMeta(areaId) {
  var base = V2A_AREA_META[areaId] || { accent: '#7AA2FF', alt: '#69D3C1', motif: 'prisma', short: 'Ruta' };
  var out = { id: areaId || 'area-psi-salud-publica', accent: base.accent, alt: base.alt, motif: base.motif, short: base.short };
  try {
    var live = null;
    if (typeof AREA_BY_ID !== 'undefined' && AREA_BY_ID) live = AREA_BY_ID[areaId];
    else if (typeof CAMP !== 'undefined' && CAMP && CAMP.areas) {
      for (var i = 0; i < CAMP.areas.length; i++) { if (CAMP.areas[i].id === areaId) { live = CAMP.areas[i]; break; } }
    }
    if (live) {
      if (live.accent) out.accent = live.accent;
      if (live.short) out.short = live.short;
    }
  } catch (e) {}
  return out;
}
function v2aPalette(areaId) {
  var meta = v2aAreaMeta(areaId);
  return {
    accent: meta.accent,
    mid: v2aTint(meta.accent, 0.70),
    dark: v2aTint(meta.accent, 0.38),
    glow: v2aTint(meta.accent, 1.35),
    alt: meta.alt,
    altMid: v2aTint(meta.alt, 0.70),
    altDark: v2aTint(meta.alt, 0.45),
    altGlow: v2aTint(meta.alt, 1.30),
    bone: '#F2F0EA',
    gold: '#E4C07A',
    goldDark: '#8D6B3A',
    stone: '#2C3444',
    stoneDark: '#1A202B',
    wood: '#4A3626',
    woodDark: '#302319',
    water: v2aTint(meta.accent, 0.95)
  };
}

/* -------------------------------------------------------------------------
   Arquetipos voxel: cada prop es una lista de cajas [x,y,z,w,h,d,color,glow].
   Son diseños compactos (≤1.3 de ancho) para no tapar puertas ni nodos.
   Cada lista se transforma al mundo y las 12 de un área se fusionan con
   mergedVoxels en un solo lote (2 draw calls por área). V2.assets.prop(id)
   devuelve un prop suelto ya fusionado si otro módulo necesita uno aislado.
   ------------------------------------------------------------------------- */
var V2A_ARCH = {
  arbol: function (p, v) {
    var wide = v % 2 === 0;
    var out = [
      [0, 0.10, 0, 0.50, 0.20, 0.50, '#2A2420'],
      [0, 0.52, 0, 0.18, 0.86, 0.18, p.woodDark],
      [-0.20, 0.42, 0.06, 0.10, 0.46, 0.10, p.woodDark],
      [0.20, 0.46, -0.06, 0.10, 0.52, 0.10, p.woodDark],
      [0, 1.02, 0, wide ? 0.74 : 0.64, 0.28, wide ? 0.74 : 0.64, p.dark],
      [0.14, 1.26, 0.04, 0.52, 0.26, 0.50, p.mid],
      [-0.18, 1.20, -0.08, 0.42, 0.22, 0.42, p.accent],
      [-0.30, 1.32, 0.12, 0.12, 0.12, 0.12, p.glow, true]
    ];
    if (wide) out.push([0, 1.44, 0, 0.30, 0.18, 0.30, p.glow, true]);
    else out.push([0.06, 1.40, 0, 0.34, 0.16, 0.34, p.accent]);
    return out;
  },
  arco: function (p, v) {
    var out = [
      [0, 0.06, 0, 1.42, 0.12, 0.52, '#19202A'],
      [-0.54, 0.95, 0, 0.20, 1.80, 0.34, p.stone],
      [0.54, 0.95, 0, 0.20, 1.80, 0.34, p.stone],
      [-0.54, 1.90, 0, 0.30, 0.18, 0.46, p.stoneDark],
      [0.54, 1.90, 0, 0.30, 0.18, 0.46, p.stoneDark],
      [0, 2.00, 0, 1.34, 0.18, 0.30, p.stone],
      [0, 2.12, 0, 0.66, 0.12, 0.22, p.accent, true],
      [-0.70, 0.30, 0.18, 0.14, 0.30, 0.14, p.alt],
      [0.70, 0.30, 0.18, 0.14, 0.30, 0.14, p.alt]
    ];
    if (v % 2 === 0) out.push([0, 1.46, 0.02, 0.12, 0.12, 0.12, p.glow, true]);
    else out.push([0, 1.46, 0.02, 0.18, 0.06, 0.03, p.bone, true]);
    return out;
  },
  totem: function (p, v) {
    var out = [
      [0, 0.08, 0, 0.58, 0.16, 0.58, p.stoneDark],
      [0, 0.50, 0, 0.34, 0.80, 0.34, p.stone],
      [0, 0.94, 0, 0.42, 0.10, 0.42, p.stoneDark],
      [0, 1.20, 0, 0.26, 0.40, 0.26, p.accent],
      [0, 1.45, 0, 0.16, 0.14, 0.16, p.glow, true],
      [-0.25, 0.24, 0, 0.10, 0.28, 0.10, p.alt],
      [0.25, 0.24, 0, 0.10, 0.28, 0.10, p.alt]
    ];
    if (v % 2 === 0) out.push([0, 1.00, 0.23, 0.16, 0.06, 0.02, p.glow, true]);
    return out;
  },
  tambor: function (p) {
    return [
      [0, 0.08, 0, 0.68, 0.12, 0.68, '#1A202B'],
      [-0.18, 0.34, 0, 0.12, 0.50, 0.12, p.woodDark],
      [0.18, 0.34, 0, 0.12, 0.50, 0.12, p.woodDark],
      [0, 0.70, 0, 0.62, 0.40, 0.62, p.wood],
      [0, 0.92, 0, 0.68, 0.06, 0.68, p.bone],
      [0, 0.70, 0.33, 0.48, 0.24, 0.03, p.accent, true],
      [0.40, 1.04, 0.05, 0.06, 0.30, 0.06, p.wood],
      [-0.40, 1.01, -0.04, 0.06, 0.26, 0.06, p.wood]
    ];
  },
  faro: function (p) {
    return [
      [0, 0.07, 0, 0.34, 0.14, 0.34, p.stoneDark],
      [0, 0.90, 0, 0.10, 1.60, 0.10, p.stone],
      [0, 1.72, 0, 0.30, 0.08, 0.30, p.stoneDark],
      [0, 1.62, 0, 0.26, 0.22, 0.26, p.glow, true],
      [0, 1.82, 0, 0.34, 0.06, 0.34, p.stoneDark],
      [-0.18, 0.34, 0.16, 0.10, 0.20, 0.10, p.alt],
      [0.20, 0.31, -0.14, 0.08, 0.16, 0.08, p.alt]
    ];
  },
  banco: function (p) {
    return [
      [0, 0.05, 0, 0.98, 0.10, 0.38, '#19202A'],
      [-0.38, 0.20, 0, 0.10, 0.30, 0.34, p.woodDark],
      [0.38, 0.20, 0, 0.10, 0.30, 0.34, p.woodDark],
      [0, 0.38, 0, 1.06, 0.09, 0.40, p.wood],
      [0, 0.55, -0.17, 1.06, 0.28, 0.07, p.woodDark],
      [0, 0.68, -0.17, 1.06, 0.05, 0.07, p.accent, true]
    ];
  },
  huerto: function (p) {
    return [
      [0, 0.10, 0, 1.00, 0.20, 0.60, p.woodDark],
      [0, 0.21, 0, 0.90, 0.06, 0.52, '#2C241C'],
      [-0.26, 0.38, 0.05, 0.08, 0.30, 0.08, p.mid],
      [-0.26, 0.55, 0.05, 0.20, 0.10, 0.20, p.accent],
      [0.08, 0.35, -0.06, 0.08, 0.24, 0.08, p.mid],
      [0.08, 0.49, -0.06, 0.18, 0.09, 0.18, p.alt],
      [0.34, 0.37, 0.12, 0.07, 0.20, 0.07, p.mid],
      [0.34, 0.49, 0.12, 0.14, 0.08, 0.14, p.glow, true]
    ];
  },
  brasero: function (p) {
    return [
      [0, 0.05, 0, 0.58, 0.10, 0.58, p.stoneDark],
      [-0.19, 0.24, 0, 0.08, 0.30, 0.08, p.stone],
      [0.19, 0.24, 0, 0.08, 0.30, 0.08, p.stone],
      [0, 0.44, 0, 0.44, 0.16, 0.44, p.stone],
      [0, 0.59, 0, 0.30, 0.20, 0.30, p.glow, true],
      [0, 0.74, 0, 0.16, 0.16, 0.16, p.accent, true],
      [0, 0.89, 0, 0.07, 0.12, 0.07, '#FFE6B8', true]
    ];
  },
  fuente: function (p) {
    return [
      [0, 0.10, 0, 0.98, 0.20, 0.98, p.stoneDark],
      [0, 0.28, 0, 0.84, 0.18, 0.84, p.stone],
      [0, 0.42, 0, 0.68, 0.08, 0.68, p.water],
      [0, 0.76, 0, 0.16, 0.78, 0.16, p.stoneDark],
      [0, 1.16, 0, 0.34, 0.10, 0.34, p.stone],
      [0, 1.27, 0, 0.20, 0.12, 0.20, p.glow, true],
      [-0.34, 0.31, 0.30, 0.14, 0.12, 0.14, p.alt],
      [0.31, 0.30, -0.27, 0.12, 0.10, 0.12, p.alt]
    ];
  },
  pozo: function (p) {
    return [
      [0, 0.08, 0, 0.82, 0.16, 0.62, p.stoneDark],
      [-0.33, 0.22, 0.20, 0.18, 0.24, 0.16, p.stone],
      [0.33, 0.22, 0.20, 0.18, 0.24, 0.16, p.stone],
      [-0.33, 0.22, -0.20, 0.18, 0.24, 0.16, p.stone],
      [0.33, 0.22, -0.20, 0.18, 0.24, 0.16, p.stone],
      [0, 0.30, 0, 0.50, 0.08, 0.38, p.water],
      [0, 0.38, 0, 0.18, 0.10, 0.18, p.glow, true],
      [0, 0.60, 0, 0.06, 0.52, 0.06, p.woodDark],
      [0, 0.86, 0, 0.50, 0.06, 0.10, p.wood]
    ];
  },
  espejo: function (p) {
    return [
      [0, 0.06, 0, 0.86, 0.10, 0.44, p.stoneDark],
      [-0.32, 0.75, 0, 0.12, 1.30, 0.12, p.stone],
      [0.32, 0.75, 0, 0.12, 1.30, 0.12, p.stone],
      [0, 1.38, 0, 0.86, 0.14, 0.20, p.stone],
      [0, 0.70, 0, 0.56, 1.00, 0.06, p.mid],
      [0, 0.88, 0, 0.24, 0.44, 0.08, p.glow, true],
      [0, 0.44, 0, 0.28, 0.20, 0.09, p.accent, true],
      [0, 1.46, 0, 0.30, 0.06, 0.10, p.alt]
    ];
  },
  campana: function (p) {
    return [
      [0, 0.06, 0, 0.78, 0.10, 0.50, p.stoneDark],
      [-0.33, 0.68, 0, 0.12, 1.28, 0.12, p.stone],
      [0.33, 0.68, 0, 0.12, 1.28, 0.12, p.stone],
      [0, 1.34, 0, 0.84, 0.12, 0.18, p.stone],
      [0, 1.04, 0, 0.32, 0.36, 0.32, p.gold],
      [0, 0.84, 0, 0.40, 0.08, 0.40, p.goldDark],
      [0, 0.76, 0, 0.10, 0.10, 0.10, p.bone],
      [0, 1.26, 0, 0.14, 0.10, 0.14, p.accent, true]
    ];
  },
  prisma: function (p) {
    return [
      [0, 0.06, 0, 0.66, 0.12, 0.66, p.stoneDark],
      [0, 0.40, 0, 0.34, 0.60, 0.34, p.stone],
      [0, 0.82, 0, 0.30, 0.30, 0.30, p.accent],
      [0, 1.06, 0, 0.20, 0.20, 0.20, p.glow, true],
      [0, 1.24, 0, 0.10, 0.16, 0.10, '#FFFFFF', true],
      [-0.30, 0.28, 0.20, 0.10, 0.20, 0.10, p.alt, true],
      [0.30, 0.23, -0.20, 0.10, 0.16, 0.10, p.alt, true]
    ];
  },
  mesa: function (p) {
    return [
      [0, 0.10, 0, 0.86, 0.10, 0.58, p.woodDark],
      [-0.34, 0.30, 0, 0.08, 0.50, 0.08, p.woodDark],
      [0.34, 0.30, 0, 0.08, 0.50, 0.08, p.woodDark],
      [0, 0.55, 0, 0.96, 0.08, 0.64, p.wood],
      [-0.18, 0.62, 0.06, 0.32, 0.04, 0.24, '#D9CFAE'],
      [0.22, 0.65, -0.10, 0.16, 0.12, 0.16, p.accent, true],
      [0.02, 0.63, 0.20, 0.06, 0.08, 0.06, p.glow, true],
      [-0.36, 0.70, -0.18, 0.10, 0.22, 0.10, p.alt]
    ];
  },
  lente: function (p) {
    return [
      [0, 0.06, 0, 0.58, 0.10, 0.58, p.stoneDark],
      [-0.22, 0.40, 0.18, 0.06, 0.66, 0.06, p.stone],
      [0.22, 0.40, 0.18, 0.06, 0.66, 0.06, p.stone],
      [0, 0.40, -0.24, 0.06, 0.66, 0.06, p.stone],
      [0, 0.82, 0, 0.34, 0.12, 0.34, p.stoneDark],
      [0, 0.98, 0, 0.40, 0.30, 0.10, p.glow, true],
      [0, 1.16, 0, 0.16, 0.10, 0.16, p.accent, true]
    ];
  },
  jardin: function (p) {
    return [
      [0, 0.06, 0, 0.78, 0.12, 0.60, p.stoneDark],
      [-0.22, 0.28, 0.10, 0.06, 0.34, 0.06, p.mid],
      [-0.22, 0.48, 0.10, 0.18, 0.10, 0.18, p.accent],
      [0.04, 0.24, -0.08, 0.06, 0.28, 0.06, p.mid],
      [0.04, 0.42, -0.08, 0.15, 0.09, 0.15, p.alt],
      [0.26, 0.26, 0.14, 0.05, 0.26, 0.05, p.mid],
      [0.26, 0.42, 0.14, 0.13, 0.08, 0.13, p.glow, true],
      [0, 0.18, 0.22, 0.48, 0.06, 0.16, p.mid]
    ];
  },
  juncos: function (p) {
    return [
      [0, 0.06, 0, 0.68, 0.12, 0.50, '#242A2A'],
      [-0.20, 0.45, 0.02, 0.05, 0.70, 0.05, p.mid],
      [-0.20, 0.85, 0.02, 0.10, 0.20, 0.10, p.accent],
      [-0.02, 0.50, -0.08, 0.05, 0.80, 0.05, p.mid],
      [-0.02, 0.95, -0.08, 0.11, 0.22, 0.11, p.alt],
      [0.18, 0.42, 0.10, 0.05, 0.64, 0.05, p.mid],
      [0.18, 0.78, 0.10, 0.09, 0.18, 0.09, p.glow, true]
    ];
  },
  pilar: function (p, v) {
    var out = [
      [0, 0.06, 0, 0.78, 0.12, 0.78, p.stoneDark],
      [0, 0.28, 0, 0.60, 0.34, 0.60, p.stone],
      [0, 1.36, 0, 0.40, 1.90, 0.40, p.stone],
      [0, 2.34, 0, 0.56, 0.16, 0.56, p.stoneDark],
      [0, 2.50, 0, 0.30, 0.16, 0.30, p.accent, true],
      [0, 1.50, 0.21, 0.16, 0.36, 0.03, p.glow, true],
      [0, 0.66, 0.21, 0.30, 0.08, 0.03, p.alt]
    ];
    if (v % 2 === 1) out.push([0, 2.62, 0, 0.12, 0.12, 0.12, p.bone, true]);
    return out;
  },
  globo: function (p) {
    return [
      [0, 0.10, 0, 0.68, 0.20, 0.68, p.stoneDark],
      [0, 0.42, 0, 0.24, 0.44, 0.24, p.stone],
      [0, 0.86, 0, 0.44, 0.44, 0.44, p.altDark],
      [0, 0.86, 0, 0.50, 0.06, 0.50, p.accent, true],
      [0, 0.86, 0, 0.06, 0.50, 0.50, p.accent, true],
      [0, 1.16, 0, 0.10, 0.10, 0.10, p.glow, true],
      [-0.30, 0.30, 0.18, 0.10, 0.16, 0.10, p.alt]
    ];
  },
  tubo: function (p) {
    return [
      [0, 0.10, 0, 0.68, 0.20, 0.58, p.stoneDark],
      [0, 0.50, 0, 0.30, 0.60, 0.30, p.stone],
      [0, 1.02, 0, 0.22, 0.46, 0.22, p.glow, true],
      [0, 1.34, 0, 0.16, 0.20, 0.16, p.accent, true],
      [-0.28, 0.40, 0.14, 0.14, 0.40, 0.14, p.alt],
      [0.28, 0.40, -0.12, 0.12, 0.34, 0.12, p.alt]
    ];
  },
  atril: function (p) {
    return [
      [0, 0.06, 0, 0.68, 0.12, 0.58, p.stoneDark],
      [0, 0.45, 0, 0.16, 0.70, 0.16, p.woodDark],
      [0, 0.86, 0.05, 0.58, 0.10, 0.40, p.wood],
      [0, 0.97, 0.10, 0.48, 0.06, 0.34, p.bone],
      [0, 1.04, 0.12, 0.16, 0.02, 0.20, p.accent, true],
      [-0.24, 0.50, 0, 0.08, 0.40, 0.08, p.woodDark]
    ];
  },
  reloj: function (p) {
    return [
      [0, 0.06, 0, 0.88, 0.12, 0.88, p.stoneDark],
      [0, 0.40, 0, 0.50, 0.60, 0.50, p.stone],
      [0, 0.95, 0, 0.62, 0.50, 0.62, p.stone],
      [0, 1.15, 0.33, 0.34, 0.34, 0.05, p.gold],
      [0, 1.15, 0.36, 0.10, 0.26, 0.02, p.accent, true],
      [0, 1.35, 0, 0.34, 0.30, 0.34, p.stone],
      [0, 1.58, 0, 0.18, 0.18, 0.18, p.glow, true],
      [-0.44, 0.50, 0.20, 0.12, 0.12, 0.12, p.alt],
      [0.46, 0.34, -0.18, 0.10, 0.10, 0.10, p.alt]
    ];
  }
};

function v2aArchBoxes(arch, palette, variant) {
  var fn = V2A_ARCH[arch] || V2A_ARCH.totem;
  try { return fn(palette, variant || 0); } catch (e) { v2aSoft(e); return V2A_ARCH.totem(palette, 0); }
}
function v2aPropSpecs(areaId) {
  return V2A_PROPS[areaId] || V2A_PROPS[V2A_AREA_ORDER[0]];
}

/* -------------------------------------------------------------------------
   Canvas de ambiente: banderines, runas de piso y bandas de aurora
   ------------------------------------------------------------------------- */
function v2aDrawMotif(g, motif, cx, cy, r, colorHex, weight) {
  if (!g) return;
  try {
    g.save();
    g.strokeStyle = colorHex;
    g.fillStyle = colorHex;
    g.lineWidth = weight || 4;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    var i, a;
    if (motif === 'raices') {
      for (i = 0; i < 5; i++) {
        a = -Math.PI / 2 + (i - 2) * 0.30;
        g.beginPath();
        g.moveTo(cx, cy + r * 0.55);
        g.quadraticCurveTo(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.1, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.95);
        g.stroke();
        g.beginPath();
        g.arc(cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.48, r * 0.055, 0, Math.PI * 2);
        g.fill();
      }
      g.beginPath();
      g.arc(cx, cy + r * 0.55, r * 0.12, 0, Math.PI * 2);
      g.fill();
    } else if (motif === 'pulso') {
      for (i = 0; i < 3; i++) {
        g.beginPath();
        g.arc(cx, cy, r * (0.38 + i * 0.22), 0.55, Math.PI * 2 - 0.55);
        g.stroke();
      }
      g.beginPath();
      g.moveTo(cx - r * 0.3, cy);
      g.lineTo(cx - r * 0.1, cy);
      g.lineTo(cx + r * 0.02, cy - r * 0.24);
      g.lineTo(cx + r * 0.14, cy + r * 0.24);
      g.lineTo(cx + r * 0.28, cy);
      g.lineTo(cx + r * 0.4, cy);
      g.stroke();
    } else if (motif === 'balanza') {
      g.beginPath();
      g.moveTo(cx, cy - r * 0.7);
      g.lineTo(cx, cy + r * 0.7);
      g.stroke();
      g.beginPath();
      g.moveTo(cx - r * 0.72, cy - r * 0.34);
      g.lineTo(cx + r * 0.72, cy - r * 0.34);
      g.stroke();
      for (i = 0; i < 2; i++) {
        a = i === 0 ? -1 : 1;
        g.beginPath();
        g.moveTo(cx + a * r * 0.72, cy - r * 0.34);
        g.lineTo(cx + a * r * 0.72, cy - r * 0.06);
        g.stroke();
        g.beginPath();
        g.arc(cx + a * r * 0.72, cy - r * 0.02, r * 0.20, 0.1, Math.PI - 0.1);
        g.stroke();
      }
      g.beginPath();
      g.arc(cx, cy - r * 0.74, r * 0.07, 0, Math.PI * 2);
      g.fill();
    } else if (motif === 'prisma') {
      g.beginPath();
      g.moveTo(cx, cy - r * 0.66);
      g.lineTo(cx + r * 0.62, cy + r * 0.48);
      g.lineTo(cx - r * 0.62, cy + r * 0.48);
      g.closePath();
      g.stroke();
      g.beginPath();
      g.moveTo(cx, cy - r * 0.28);
      g.lineTo(cx + r * 0.3, cy + r * 0.26);
      g.lineTo(cx - r * 0.3, cy + r * 0.26);
      g.closePath();
      g.stroke();
      for (i = 0; i < 3; i++) {
        a = -Math.PI / 2 + i * (Math.PI * 2 / 3);
        g.beginPath();
        g.moveTo(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82);
        g.lineTo(cx + Math.cos(a) * r * 1.02, cy + Math.sin(a) * r * 1.02);
        g.stroke();
      }
    } else {
      g.beginPath();
      g.arc(cx, cy, r * 0.58, 0, Math.PI * 2);
      g.stroke();
      for (i = 0; i < 8; i++) {
        a = i * Math.PI / 4;
        g.beginPath();
        g.moveTo(cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62);
        g.lineTo(cx + Math.cos(a) * r * 0.88, cy + Math.sin(a) * r * 0.88);
        g.stroke();
        g.beginPath();
        g.arc(cx + Math.cos(a) * r * 0.88, cy + Math.sin(a) * r * 0.88, r * 0.07, 0, Math.PI * 2);
        g.fill();
      }
      g.beginPath();
      g.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
      g.stroke();
    }
    g.restore();
  } catch (e) { v2aSoft(e); }
}
function v2aBannerTexture(areaId, accent) {
  var meta = v2aAreaMeta(areaId);
  var canvas = v2aCanvas(192, 256);
  if (!canvas) return null;
  var g = canvas.getContext('2d');
  if (!g) return null;
  try {
    g.clearRect(0, 0, 192, 256);
    /* La driza ocupa u = 0: ese borde es el que queda pegado al palo.
       El vuelo crece hacia la derecha; nada de la tela rodea el mástil. */
    var grad = g.createLinearGradient(0, 12, 0, 226);
    grad.addColorStop(0, accent);
    grad.addColorStop(0.52, v2aTint(accent, 0.58));
    grad.addColorStop(1, '#101722');
    g.beginPath();
    g.moveTo(11, 12);
    g.lineTo(182, 12);
    g.lineTo(182, 188);
    g.lineTo(96.5, 158);
    g.lineTo(11, 188);
    g.closePath();
    g.fillStyle = grad;
    g.fill();

    /* Orillo de la driza, por dentro del borde de la tela. */
    g.fillStyle = '#E4C07A';
    g.fillRect(0, 6, 13, 188);
    g.globalAlpha = 0.5;
    g.fillStyle = '#8A6A33';
    g.fillRect(9, 6, 4, 188);
    g.globalAlpha = 1;

    /* Galón del vuelo. */
    g.globalAlpha = 0.9;
    g.lineWidth = 5;
    g.strokeStyle = '#E4C07A';
    g.beginPath();
    g.moveTo(13, 14);
    g.lineTo(180, 14);
    g.lineTo(180, 185);
    g.lineTo(96.5, 156);
    g.lineTo(13, 185);
    g.stroke();
    g.globalAlpha = 1;

    v2aDrawMotif(g, meta.motif, 100, 94, 42, '#F7F3E8', 5);

    /* Colgantes de las dos puntas del vuelo. */
    g.fillStyle = '#E4C07A';
    g.fillRect(18, 184, 8, 44);
    g.fillRect(164, 184, 8, 44);
    g.fillStyle = '#C9A35F';
    g.beginPath();
    g.arc(22, 234, 6, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(168, 234, 6, 0, Math.PI * 2);
    g.fill();

    /* Casquillo de la driza: abraza el borde de la tela, no el palo. */
    g.fillStyle = '#F0D49A';
    g.fillRect(0, 16, 20, 7);
    g.fillStyle = '#8A6A33';
    g.fillRect(17, 16, 3, 7);
  } catch (e) { v2aSoft(e); }
  return v2aTexture(canvas);
}
function v2aCrestTexture(areaId, accent) {
  var meta = v2aAreaMeta(areaId);
  var canvas = v2aCanvas(256, 256);
  if (!canvas) return null;
  var g = canvas.getContext('2d');
  if (!g) return null;
  try {
    g.clearRect(0, 0, 256, 256);
    g.strokeStyle = accent;
    g.globalAlpha = 0.85;
    g.lineWidth = 2.5;
    g.beginPath(); g.arc(128, 128, 118, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(128, 128, 96, 0, Math.PI * 2); g.stroke();
    g.globalAlpha = 0.45;
    g.beginPath(); g.arc(128, 128, 72, 0, Math.PI * 2); g.stroke();
    g.globalAlpha = 0.8;
    for (var i = 0; i < 16; i++) {
      var a = i * Math.PI / 8;
      g.beginPath();
      g.moveTo(128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100);
      g.lineTo(128 + Math.cos(a) * 112, 128 + Math.sin(a) * 112);
      g.stroke();
    }
    v2aDrawMotif(g, meta.motif, 128, 128, 56, '#F2F0EA', 3);
    g.globalAlpha = 1;
  } catch (e) { v2aSoft(e); }
  return v2aTexture(canvas);
}
function v2aRibbonTexture() {
  var canvas = v2aCanvas(512, 192);
  if (!canvas) return null;
  var g = canvas.getContext('2d');
  if (!g) return null;
  try {
    g.clearRect(0, 0, 512, 192);
    g.lineCap = 'round';
    for (var b = 0; b < 3; b++) {
      var y = 54 + b * 30;
      g.beginPath();
      g.moveTo(-10, y);
      g.bezierCurveTo(130, y - 36 - b * 6, 260, y + 38 + b * 5, 522, y - 10);
      g.lineWidth = 13 - b * 3;
      g.strokeStyle = 'rgba(255,255,255,' + (0.46 - b * 0.11) + ')';
      g.shadowColor = 'rgba(255,255,255,0.85)';
      g.shadowBlur = 26;
      g.stroke();
    }
    g.shadowBlur = 0;
  } catch (e) { v2aSoft(e); }
  return v2aTexture(canvas);
}

/* -------------------------------------------------------------------------
   Cielo y ambiente
   ------------------------------------------------------------------------- */
var v2aSky = { built: false, group: null, aurora: null, auroraSprites: [], nebulaSprites: [], stars: null };
function v2aApplySkyQuality(q) {
  if (!v2aSky.built) return;
  var auroraCount = q === 'alto' ? 3 : q === 'medio' ? 2 : 1;
  var nebulaCount = q === 'alto' ? 2 : q === 'medio' ? 1 : 0;
  var starCount = q === 'alto' ? 160 : q === 'medio' ? 90 : 45;
  var i;
  try {
    for (i = 0; i < v2aSky.auroraSprites.length; i++) {
      var item = v2aSky.auroraSprites[i];
      if (item && item.sprite) item.sprite.visible = i < auroraCount;
    }
    for (i = 0; i < v2aSky.nebulaSprites.length; i++) {
      if (v2aSky.nebulaSprites[i]) v2aSky.nebulaSprites[i].visible = i < nebulaCount;
    }
    if (v2aSky.stars && v2aSky.stars.geometry && v2aSky.stars.geometry.setDrawRange) {
      v2aSky.stars.geometry.setDrawRange(0, starCount);
    }
  } catch (e) { v2aSoft(e); }
}
function v2aEnsureSky() {
  if (v2aSky.built) return;
  if (typeof THREE === 'undefined' || !THREE) return;
  if (typeof scene === 'undefined' || !scene) return;
  try {
    var group = new THREE.Group();
    group.name = 'v2-sky';
    var aurora = new THREE.Group();
    group.add(aurora);
    /* Se construye siempre la capa completa (3 auroras, 2 nebulosas, 160 estrellas)
       y la calidad solo cambia visibilidad/rango de dibujo: así el ajuste en
       caliente no obliga a regenerar texturas ni geometría. */
    var auroraCount = 3;
    var nebulaCount = 2;
    var starCount = 160;
    var ribbon = v2aRibbonTexture();
    var ribbons = [
      { x: -70, y: 38, z: -100, scale: 150, hex: '#7AA2FF', opacity: 0.10, phase: 0.4, speed: 0.21 },
      { x: 62, y: 46, z: -92, scale: 132, hex: '#69D3C1', opacity: 0.085, phase: 2.1, speed: 0.17 },
      { x: 20, y: 32, z: 108, scale: 140, hex: '#C49BFF', opacity: 0.075, phase: 4.2, speed: 0.13 }
    ];
    for (var i = 0; i < auroraCount; i++) {
      var data = ribbons[i];
      var material = null;
      if (ribbon) {
        material = new THREE.SpriteMaterial({
          map: ribbon, color: v2aColor(data.hex), transparent: true, opacity: data.opacity,
          depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, fog: false
        });
      } else {
        material = new THREE.SpriteMaterial({
          color: v2aColor(data.hex), transparent: true, opacity: data.opacity,
          depthWrite: false, blending: THREE.AdditiveBlending, fog: false
        });
      }
      var sprite = new THREE.Sprite(material);
      sprite.scale.set(data.scale, data.scale * 0.32, 1);
      sprite.position.set(data.x, data.y, data.z);
      aurora.add(sprite);
      v2aSky.auroraSprites.push({ sprite: sprite, base: data.opacity, phase: data.phase, speed: data.speed, amp: data.opacity * 0.35 });
    }
    v2aSky.aurora = aurora;
    v2aSky.group = group;
    for (var n = 0; n < nebulaCount; n++) {
      if (typeof makeGlowSprite !== 'function') break;
      var neb = makeGlowSprite(n === 0 ? '#7AA2FF' : '#C49BFF', n === 0 ? 170 : 130, n === 0 ? 0.05 : 0.042);
      if (!neb) continue;
      neb.position.set(n === 0 ? -30 : 110, n === 0 ? 18 : 30, n === 0 ? -150 : -80);
      neb.material.fog = false;
      group.add(neb);
      v2aSky.nebulaSprites.push(neb);
    }
    var starGeo = new THREE.BufferGeometry();
    var starPos = [];
    var starCols = [];
    var starPalette = ['#E7E9FF', '#AEBDFF', '#F3D8B0', '#9FEFE0'];
    var rnd = v2aRandom(7411);
    for (var s = 0; s < starCount; s++) {
      var theta = rnd() * Math.PI * 2;
      var phi = 0.04 + rnd() * 1.42;
      var radius = 118 + rnd() * 92;
      starPos.push(Math.cos(theta) * Math.cos(phi) * radius, Math.sin(phi) * radius * 0.78, Math.sin(theta) * Math.cos(phi) * radius);
      var cc = new THREE.Color(starPalette[Math.floor(rnd() * starPalette.length)]);
      starCols.push(cc.r, cc.g, cc.b);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.Float32BufferAttribute(starCols, 3));
    var stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      size: 1.15, sizeAttenuation: false, vertexColors: true, transparent: true,
      opacity: 0.58, depthWrite: false, fog: false
    }));
    group.add(stars);
    v2aSky.stars = stars;
    v2aMarkDecorative(group);
    scene.add(group);
    v2aSky.built = true;
    v2aApplySkyQuality(v2aQuality());
  } catch (e) {
    v2aSoft(e);
  }
}

/* -------------------------------------------------------------------------
   Atrio: props por puerta, vegetación instanciada, esbirros y polvo
   ------------------------------------------------------------------------- */
var v2aHub = { built: false, roots: [], minions: [], dust: null, props: 0, veg: 0, quality: null };
var v2aHubVegGeo = null;

function v2aHubVegetationGeometry() {
  if (!v2aHubVegGeo) {
    try { v2aHubVegGeo = new THREE.BoxGeometry(1, 1, 1); } catch (e) { v2aHubVegGeo = null; }
  }
  return v2aHubVegGeo;
}
function v2aGateList() {
  var gates = null;
  try {
    if (typeof gateGroups !== 'undefined' && gateGroups && gateGroups.length) gates = gateGroups;
  } catch (e) {}
  if (gates) return gates;
  var fallback = [];
  var angles = [202, 274, 346, 58, 130];
  for (var i = 0; i < V2A_AREA_ORDER.length; i++) {
    var areaId = V2A_AREA_ORDER[i];
    var meta = v2aAreaMeta(areaId);
    fallback.push({
      area: { id: areaId, accent: meta.accent, short: meta.short },
      angle: angles[i] * Math.PI / 180,
      index: i
    });
  }
  return fallback;
}
function v2aBuildHubProps(gate, area, count) {
  var specs = v2aPropSpecs(area.id);
  var pal = v2aPalette(area.id);
  var boxes = [];
  var built = 0;
  for (var i = 0; i < count && i < specs.length; i++) {
    var slot = V2A_HUB_SLOTS[i];
    if (!slot) break;
    var a = gate.angle + slot.off;
    var x = Math.cos(a) * slot.r;
    var z = Math.sin(a) * slot.r;
    var yaw = v2aSnapYaw(Math.atan2(-x, -z));
    var scale = slot.scale * (specs[i].scale || 1);
    var place = { x: x, z: z, y: slot.y, yaw: yaw, scale: scale };
    var list = v2aArchBoxes(specs[i].arch, pal, i);
    for (var b = 0; b < list.length; b++) v2aPlaceBox(boxes, list[b], place);
    built++;
  }
  var merged = v2aMerge(boxes);
  if (merged) {
    merged.name = 'v2-hub-props-' + area.id;
    v2aMarkDecorative(merged);
    hubGroup.add(merged);
    v2aHub.roots.push(merged);
  }
  return built;
}
function v2aBuildHubVegetation(gate, areaId, q) {
  var geo = v2aHubVegetationGeometry();
  if (!geo) return 0;
  var count = q === 'alto' ? 10 : q === 'medio' ? 7 : 4;
  var pal = v2aPalette(areaId);
  var material = null;
  try {
    material = new THREE.MeshLambertMaterial({ color: v2aColor(v2aTint(pal.accent, 0.85)) });
  } catch (e) { return 0; }
  var mesh = null;
  try { mesh = new THREE.InstancedMesh(geo, material, count); } catch (e2) { return 0; }
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  var temp = new THREE.Object3D();
  var rnd = v2aRandom(9001 + gate.index * 37);
  var placed = 0;
  for (var i = 0; i < count; i++) {
    var side = i % 2 === 0 ? -1 : 1;
    var off = side * (0.22 + rnd() * 0.34);
    var radius = 7.35 + rnd() * 1.05;
    var angle = gate.angle + off;
    var x = Math.cos(angle) * radius;
    var z = Math.sin(angle) * radius;
    var h = 0.10 + rnd() * 0.22;
    temp.position.set(x, 0.05 + h * 0.5, z);
    temp.rotation.set(0, rnd() * Math.PI * 2, 0);
    temp.scale.set(0.045 + rnd() * 0.045, h, 0.045 + rnd() * 0.045);
    temp.updateMatrix();
    mesh.setMatrixAt(placed, temp.matrix);
    placed++;
  }
  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true;
  mesh.name = 'v2-hub-veg-' + areaId;
  v2aMarkDecorative(mesh);
  hubGroup.add(mesh);
  v2aHub.roots.push(mesh);
  return placed;
}
function v2aMinionBoxes(p) {
  return [
    [0, 0.34, 0, 0.46, 0.34, 0.42, '#2B3346'],
    [0, 0.34, 0.22, 0.28, 0.14, 0.03, p.accent, true],
    [-0.13, 0.36, 0.235, 0.08, 0.08, 0.02, p.bone, true],
    [0.13, 0.36, 0.235, 0.08, 0.08, 0.02, p.bone, true],
    [-0.31, 0.40, 0, 0.14, 0.28, 0.28, '#3A4256'],
    [0.31, 0.40, 0, 0.14, 0.28, 0.28, '#3A4256'],
    [0, 0.58, -0.02, 0.20, 0.10, 0.20, p.accent, true],
    [0, 0.56, 0, 0.08, 0.08, 0.08, p.glow, true],
    [-0.16, 0.12, 0.10, 0.12, 0.12, 0.12, p.alt],
    [0.16, 0.08, -0.12, 0.10, 0.10, 0.10, p.alt],
    [0.02, 0.16, -0.22, 0.09, 0.09, 0.09, p.altMid]
  ];
}
function v2aBuildMinion(areaId, gate, index) {
  var pal = v2aPalette(areaId);
  var root = null;
  try { root = new THREE.Group(); } catch (e) { return; }
  var x = Math.cos(gate.angle + 0.34) * 5.85;
  var z = Math.sin(gate.angle + 0.34) * 5.85;
  root.position.set(x, 0.72, z);
  root.rotation.y = v2aSnapYaw(Math.atan2(-x, -z));
  var body = v2aMerge(v2aMinionBoxes(pal));
  if (body) root.add(body);
  var ring = null;
  try {
    var ringMat = new THREE.MeshBasicMaterial({
      color: v2aColor(pal.accent), transparent: true, opacity: 0.55,
      depthWrite: false, blending: THREE.AdditiveBlending, fog: false
    });
    ring = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.012, 4, 20), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.36;
    root.add(ring);
  } catch (e2) { ring = null; }
  v2aMarkDecorative(root);
  root.name = 'v2-minion-' + areaId;
  hubGroup.add(root);
  v2aHub.roots.push(root);
  v2aHub.minions.push({
    root: root,
    ring: ring,
    baseY: 0.72,
    baseRot: root.rotation.y,
    phase: index * 1.73 + 0.6,
    areaId: areaId
  });
}
function v2aBuildHubDust() {
  var budget = v2aBudget();
  var count = Math.max(4, Math.min(110, Number(budget.particles) || 18));
  var positions = new Float32Array(count * 3);
  var base = new Float32Array(count * 3);
  var colors = new Float32Array(count * 3);
  var phases = [];
  var speeds = [];
  var rnd = v2aRandom(4417);
  var hexList = ['#E4C07A', '#7AA2FF', '#69D3C1', '#C49BFF', '#B8D46A', '#F3B562'];
  var colorCache = [];
  for (var c = 0; c < hexList.length; c++) {
    try { colorCache.push(new THREE.Color(hexList[c])); } catch (e) { colorCache.push(null); }
  }
  for (var i = 0; i < count; i++) {
    var angle = rnd() * Math.PI * 2;
    var radius = 2.4 + rnd() * 6.2;
    var x = Math.cos(angle) * radius;
    var z = Math.sin(angle) * radius;
    var y = 0.35 + rnd() * 3.15;
    var k = i * 3;
    positions[k] = x; positions[k + 1] = y; positions[k + 2] = z;
    base[k] = x; base[k + 1] = y; base[k + 2] = z;
    var col = colorCache[Math.floor(rnd() * colorCache.length)];
    if (col) { colors[k] = col.r; colors[k + 1] = col.g; colors[k + 2] = col.b; }
    else { colors[k] = 0.9; colors[k + 1] = 0.8; colors[k + 2] = 0.5; }
    phases.push(rnd() * 12);
    speeds.push(0.6 + rnd() * 0.8);
  }
  var geo = null, mat = null, points = null;
  try {
    geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    mat = new THREE.PointsMaterial({
      size: 0.075, vertexColors: true, transparent: true, opacity: 0.5,
      depthWrite: false, blending: THREE.AdditiveBlending, fog: false
    });
    points = new THREE.Points(geo, mat);
  } catch (e2) { return; }
  points.frustumCulled = false;
  points.name = 'v2-hub-dust';
  v2aMarkDecorative(points);
  hubGroup.add(points);
  v2aHub.roots.push(points);
  v2aHub.dust = {
    points: points,
    attr: geo.getAttribute('position'),
    base: base,
    phases: phases,
    speeds: speeds,
    count: count
  };
}

function v2aBuildHub() {
  if (typeof THREE === 'undefined' || !THREE) return;
  if (typeof hubGroup === 'undefined' || !hubGroup) return;
  try {
    var q = v2aQuality();
    var budget = v2aBudget();
    var count = Math.max(2, Math.min(5, Number(budget.props) || 4));
    var gates = v2aGateList();
    var builtProps = 0, builtVeg = 0;
    for (var i = 0; i < gates.length; i++) {
      var gate = gates[i];
      if (!gate) continue;
      var area = gate.area;
      if (!area || !area.id) continue;
      if (!gate.angle && gate.angle !== 0) gate.angle = (gate.position && Math.atan2(gate.position.z, gate.position.x)) || 0;
      builtProps += v2aBuildHubProps(gate, area, count);
      builtVeg += v2aBuildHubVegetation(gate, area.id, q);
      v2aBuildMinion(area.id, gate, i);
    }
    v2aBuildHubDust();
    v2aHub.props = builtProps;
    v2aHub.veg = builtVeg;
    v2aHub.quality = q;
    v2aHub.built = true;
  } catch (e) {
    v2aSoft(e);
  }
}
function v2aClearHubRoots() {
  var roots = v2aHub.roots || [];
  for (var i = 0; i < roots.length; i++) {
    var root = roots[i];
    if (!root) continue;
    try {
      root.traverse(function (node) {
        if (!node) return;
        if (node.isInstancedMesh && node.dispose) {
          try { node.dispose(); } catch (e0) {}
        }
        if (node.geometry && node.geometry !== v2aHubVegGeo) {
          try { if (node.geometry.dispose) node.geometry.dispose(); } catch (e1) {}
        }
        if (node.material) {
          try { if (node.material.dispose) node.material.dispose(); } catch (e2) {}
        }
      });
    } catch (e3) {}
    try { if (root.parent) root.parent.remove(root); } catch (e4) {}
  }
  v2aHub.roots = [];
  v2aHub.minions = [];
  v2aHub.dust = null;
  v2aHub.props = 0;
  v2aHub.veg = 0;
  v2aHub.built = false;
}
function v2aRebuildHub() {
  v2aClearHubRoots();
  v2aBuildHub();
}
function v2aDecorateHub() {
  v2aEnsureSky();
  if (v2aHub.built) return;
  v2aBuildHub();
}

/* -------------------------------------------------------------------------
   Mapa: props y vegetación alrededor del borde de cada isla
   ------------------------------------------------------------------------- */
function v2aDecorateMapIsland(area, group, islandCfg) {
  if (typeof THREE === 'undefined' || !THREE) return;
  if (!group || !area || !area.id) return;
  /* El mapa usa su propio renderer y update() no corre en screen === 'map':
     estos props son estáticos, con brillo por material pero sin animación. */
  try {
    var q = v2aQuality();
    var budget = v2aBudget();
    var count = Math.max(3, Math.min(12, Number(budget.props) || 8));
    var specs = v2aPropSpecs(area.id);
    var pal = v2aPalette(area.id);
    var boxes = [];
    var built = 0;
    for (var i = 0; i < count && i < specs.length; i++) {
      var slot = V2A_MAP_SLOTS[i];
      if (!slot) break;
      var a = slot.a * Math.PI / 180;
      var x = Math.cos(a) * slot.r;
      var z = Math.sin(a) * slot.r;
      var place = {
        x: x, z: z, y: 0.14,
        yaw: v2aSnapYaw(Math.atan2(-x, -z)),
        scale: slot.s * (specs[i].scale || 1)
      };
      var list = v2aArchBoxes(specs[i].arch, pal, i);
      for (var b = 0; b < list.length; b++) v2aPlaceBox(boxes, list[b], place);
      built++;
    }
    var merged = v2aMerge(boxes);
    if (merged) {
      v2aMarkDecorative(merged);
      merged.name = 'v2-map-props-' + (islandCfg && islandCfg.order ? islandCfg.order : 'x');
      group.add(merged);
    }
    var vegCount = q === 'alto' ? 10 : q === 'medio' ? 6 : 3;
    var vegGeo = null, vegMat = null, veg = null;
    try {
      vegGeo = new THREE.BoxGeometry(1, 1, 1);
      vegMat = new THREE.MeshLambertMaterial({ color: v2aColor(v2aTint(pal.accent, 0.95)) });
      veg = new THREE.InstancedMesh(vegGeo, vegMat, vegCount);
    } catch (e3) { veg = null; }
    if (veg) {
      var temp = new THREE.Object3D();
      var rnd = v2aRandom(5200 + (islandCfg && islandCfg.order ? islandCfg.order : 1) * 41);
      var placed = 0;
      for (var v = 0; v < vegCount; v++) {
        var slotV = V2A_MAP_SLOTS[(v + 4) % V2A_MAP_SLOTS.length];
        var angleV = slotV.a * Math.PI / 180 + (rnd() - 0.5) * 0.10;
        var radiusV = 1.55 + rnd() * 0.75;
        var xV = Math.cos(angleV) * radiusV;
        var zV = Math.sin(angleV) * radiusV;
        var hV = 0.06 + rnd() * 0.09;
        temp.position.set(xV, 0.14 + hV * 0.5, zV);
        temp.rotation.set(0, rnd() * Math.PI * 2, 0);
        temp.scale.set(0.018 + rnd() * 0.018, hV, 0.018 + rnd() * 0.018);
        temp.updateMatrix();
        veg.setMatrixAt(placed, temp.matrix);
        placed++;
      }
      veg.count = placed;
      veg.instanceMatrix.needsUpdate = true;
      veg.castShadow = false;
      veg.receiveShadow = false;
      veg.name = 'v2-map-veg-' + (islandCfg && islandCfg.order ? islandCfg.order : 'x');
      v2aMarkDecorative(veg);
      group.add(veg);
    }
    try {
      v2aMapStats.built = (v2aMapStats.built || 0) + 1;
      v2aMapStats.props = (v2aMapStats.props || 0) + built;
    } catch (e4) {}
  } catch (e) {
    v2aSoft(e);
  }
}
var v2aMapStats = { built: 0, props: 0 };

/* -------------------------------------------------------------------------
   Variantes del escenario de duelo (arenaGroup local a ARENA_POS)
   ------------------------------------------------------------------------- */
var v2aArena = {
  group: null, active: false, areaId: null,
  pennants: [], pennantMat: null, crest: null, ring: null,
  particles: null, textures: [], light: null, origin: null
};
var V2A_ARENA_STANDARD_ANGLES = [30, 150, 270];

function v2aArenaExtraBoxes(p, motif) {
  var out = [];
  var angles = [45, 135, 225, 315];
  for (var i = 0; i < angles.length; i++) {
    var a = angles[i] * Math.PI / 180;
    var x = Math.cos(a) * 4.95;
    var z = Math.sin(a) * 4.95;
    if (motif === 'raices') {
      out.push([x, 0.22, z, 0.34, 0.18, 0.34, p.dark]);
      out.push([x, 0.36, z, 0.22, 0.14, 0.22, p.mid]);
      out.push([x, 0.48, z, 0.08, 0.12, 0.08, p.altGlow, true]);
    } else if (motif === 'pulso') {
      out.push([x, 0.16, z, 0.36, 0.22, 0.36, p.stoneDark]);
      out.push([x, 0.34, z, 0.24, 0.18, 0.24, p.stone]);
      out.push([x, 0.50, z, 0.14, 0.16, 0.14, p.glow, true]);
    } else if (motif === 'balanza') {
      out.push([x, 0.12, z, 0.32, 0.18, 0.32, p.stoneDark]);
      out.push([x, 0.44, z, 0.10, 0.52, 0.10, p.stone]);
      out.push([x, 0.74, z, 0.24, 0.08, 0.24, p.gold]);
      out.push([x, 0.84, z, 0.09, 0.09, 0.09, p.accent, true]);
    } else if (motif === 'prisma') {
      out.push([x, 0.12, z, 0.30, 0.18, 0.30, p.stoneDark]);
      out.push([x, 0.38, z, 0.20, 0.34, 0.20, p.mid]);
      out.push([x, 0.62, z, 0.12, 0.18, 0.12, p.altGlow, true]);
      out.push([x, 0.74, z, 0.06, 0.10, 0.06, p.bone, true]);
    } else {
      out.push([x, 0.14, z, 0.34, 0.20, 0.34, p.stoneDark]);
      out.push([x, 0.36, z, 0.22, 0.22, 0.22, p.stone]);
      out.push([x, 0.56, z, 0.10, 0.18, 0.10, p.gold]);
      out.push([x, 0.70, z, 0.08, 0.08, 0.08, p.altGlow, true]);
    }
  }
  return out;
}

function v2aApplyArenaVariant(areaId) {
  if (typeof THREE === 'undefined' || !THREE) return;
  if (typeof arenaGroup === 'undefined' || !arenaGroup) return;
  v2aClearArenaVariant();
  try {
    var id = areaId || V2A_AREA_ORDER[0];
    var meta = v2aAreaMeta(id);
    var pal = v2aPalette(id);
    var q = v2aQuality();
    var group = new THREE.Group();
    group.name = 'v2-arena-variant';

    /* Estandartes + halos sobre los pilares existentes. */
    var boxes = [];
    for (var i = 0; i < V2A_ARENA_STANDARD_ANGLES.length; i++) {
      var a = V2A_ARENA_STANDARD_ANGLES[i] * Math.PI / 180;
      var x = Math.cos(a) * 5.85;
      var z = Math.sin(a) * 5.85;
      boxes.push([x, 0.07, z, 0.48, 0.14, 0.48, '#141A24']);
      boxes.push([x, 1.20, z, 0.09, 2.26, 0.09, pal.stone]);
      boxes.push([x, 2.36, z, 0.16, 0.12, 0.16, pal.stoneDark]);
      boxes.push([x, 2.46, z, 0.12, 0.12, 0.12, pal.accent, true]);
    }
    for (var ap = 0; ap < 6; ap++) {
      var pa = ap / 6 * Math.PI * 2;
      var px = Math.cos(pa) * 5.15;
      var pz = Math.sin(pa) * 5.15;
      var ph = ap % 2 ? 2.1 : 2.8;
      boxes.push([px, ph + 0.44, pz, 0.20, 0.20, 0.20, pal.accent, true]);
      boxes.push([px, ph + 0.58, pz, 0.10, 0.10, 0.10, pal.glow, true]);
    }
    var extra = v2aArenaExtraBoxes(pal, meta.motif);
    for (var e = 0; e < extra.length; e++) boxes.push(extra[e]);
    var staticMesh = v2aMerge(boxes);
    if (staticMesh) {
      v2aMarkDecorative(staticMesh);
      group.add(staticMesh);
    }

    /* Banderines dibujados en canvas (una textura compartida por área).
       Malla plana con el pivote en el borde de la driza: el borde queda a ras
       del palo y la tela se extiende media anchura hacia fuera. La ondulación
       nace con amplitud cero en ese borde y crece hacia el vuelo. */
    var bannerTex = v2aBannerTexture(id, meta.accent);
    if (bannerTex) {
      v2aArena.textures.push(bannerTex);
      var pennantMat = new THREE.MeshBasicMaterial({
        map: bannerTex, transparent: true, opacity: 0.92, depthWrite: false,
        depthTest: true, side: THREE.DoubleSide, fog: false
      });
      v2aArena.pennantMat = pennantMat;
      var pW = 0.66, pH = 1.02;
      /* El palo mide 0.09 de lado. El borde de la tela gira con la cámara
         alrededor del eje, así que se despega 0.045*sqrt(2) + 0.01 para no
         rozar las esquinas en ningún ángulo (0.030 de aire de frente). */
      var pGap = 0.075;
      var pTop = 2.24; /* 0.06 libre bajo el remate, que empieza en 2.30 */
      for (var s = 0; s < V2A_ARENA_STANDARD_ANGLES.length; s++) {
        var sa = V2A_ARENA_STANDARD_ANGLES[s] * Math.PI / 180;
        var sx = Math.cos(sa) * 5.85;
        var sz = Math.sin(sa) * 5.85;
        /* Pivote de la tela en el borde de la driza: geometría desplazada
           media anchura y malla separada pGap del eje del palo. */
        var clothGeo = new THREE.PlaneGeometry(pW, pH, 10, 12);
        clothGeo.translate(pW / 2, -pH / 2, 0);
        var pivot = new THREE.Group();
        pivot.position.set(sx, pTop, sz);
        var cloth = new THREE.Mesh(clothGeo, pennantMat);
        cloth.position.x = pGap;
        cloth.renderOrder = 3;
        v2aMarkDecorative(cloth);
        pivot.add(cloth);
        group.add(pivot);
        var clothAttr = clothGeo.getAttribute('position');
        var clothBase = new Float32Array(clothAttr.array.length);
        clothBase.set(clothAttr.array);
        v2aArena.pennants.push({
          pivot: pivot, mesh: cloth, geo: clothGeo, attr: clothAttr, base: clothBase,
          width: pW, height: pH, gap: pGap,
          baseX: sx, baseY: pTop, baseZ: sz, phase: s * 1.9 + 0.3
        });
      }
    }

    /* Runa de piso dibujada en canvas, aditiva y muy tenue. */
    var crestTex = v2aCrestTexture(id, meta.accent);
    if (crestTex) {
      v2aArena.textures.push(crestTex);
      var crestMat = new THREE.MeshBasicMaterial({
        map: crestTex, transparent: true, opacity: 0.18, depthWrite: false,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false
      });
      var crest = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.8), crestMat);
      crest.rotation.x = -Math.PI / 2;
      crest.position.y = 0.362;
      crest.renderOrder = 2;
      group.add(crest);
      v2aArena.crest = crest;
    }
    var ring = null;
    try {
      var ringMat = new THREE.MeshBasicMaterial({
        color: v2aColor(meta.accent), transparent: true, opacity: 0.42,
        depthWrite: false, blending: THREE.AdditiveBlending, fog: false
      });
      ring = new THREE.Mesh(new THREE.TorusGeometry(4.22, 0.03, 4, 64), ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.44;
      group.add(ring);
      v2aArena.ring = ring;
    } catch (e2) { v2aArena.ring = null; }

    /* Partículas ambientales de la variante (presupuesto visible de la escena). */
    var budget = v2aBudget();
    var pCount = Math.max(3, Math.round((Number(budget.particles) || 18) * 0.35));
    var positions = new Float32Array(pCount * 3);
    var base = new Float32Array(pCount * 3);
    var colors = new Float32Array(pCount * 3);
    var phases = [];
    var rnd = v2aRandom(8800 + (id.charCodeAt(id.length - 1) || 3) * 13);
    var colA = null, colB = null;
    try { colA = new THREE.Color(meta.accent); colB = new THREE.Color('#F2F0EA'); } catch (e3) {}
    for (var pi = 0; pi < pCount; pi++) {
      var pang = rnd() * Math.PI * 2;
      var prad = 1.5 + rnd() * 4.1;
      var px2 = Math.cos(pang) * prad;
      var pz2 = Math.sin(pang) * prad;
      var py = 0.55 + rnd() * 3.6;
      var k = pi * 3;
      positions[k] = px2; positions[k + 1] = py; positions[k + 2] = pz2;
      base[k] = px2; base[k + 1] = py; base[k + 2] = pz2;
      var useB = rnd() > 0.72 && colB;
      var col = useB ? colB : colA;
      if (col) { colors[k] = col.r; colors[k + 1] = col.g; colors[k + 2] = col.b; }
      else { colors[k] = 0.8; colors[k + 1] = 0.9; colors[k + 2] = 0.85; }
      phases.push(rnd() * 12);
    }
    try {
      var pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      var pMat = new THREE.PointsMaterial({
        size: 0.08, vertexColors: true, transparent: true, opacity: 0.62,
        depthWrite: false, blending: THREE.AdditiveBlending, fog: false
      });
      var points = new THREE.Points(pGeo, pMat);
      points.frustumCulled = false;
      v2aMarkDecorative(points);
      group.add(points);
      v2aArena.particles = { points: points, attr: pGeo.getAttribute('position'), base: base, phases: phases, count: pCount };
    } catch (e4) { v2aArena.particles = null; }

    try {
      if (q !== 'bajo') {
        var light = new THREE.PointLight(meta.accent, 0.85, 11, 2);
        light.position.set(0, 4.2, 0);
        light.castShadow = false;
        group.add(light);
        v2aArena.light = light;
      } else {
        v2aArena.light = null;
      }
    } catch (e5) { v2aArena.light = null; }

    v2aMarkDecorative(group);
    arenaGroup.add(group);
    /* Origen en mundo del grupo (ARENA_POS) para orientar los banderines. */
    try {
      v2aArena.origin = new THREE.Vector3();
      group.getWorldPosition(v2aArena.origin);
    } catch (e6) { v2aArena.origin = null; }
    v2aArena.group = group;
    v2aArena.active = true;
    v2aArena.areaId = id;
  } catch (e) {
    v2aSoft(e);
    v2aArena.active = false;
  }
}
function v2aClearArenaVariant() {
  if (!v2aArena) return;
  try {
    if (v2aArena.group) {
      v2aDispose(v2aArena.group);
      v2aArena.group = null;
    }
    if (v2aArena.light) {
      try { if (v2aArena.light.parent) v2aArena.light.parent.remove(v2aArena.light); } catch (e) {}
      try { if (v2aArena.light.dispose) v2aArena.light.dispose(); } catch (e2) {}
      v2aArena.light = null;
    }
    for (var i = 0; i < v2aArena.textures.length; i++) {
      try { if (v2aArena.textures[i] && v2aArena.textures[i].dispose) v2aArena.textures[i].dispose(); } catch (e3) {}
    }
  } catch (e4) { v2aSoft(e4); }
  v2aArena.textures = [];
  v2aArena.pennants = [];
  v2aArena.pennantMat = null;
  v2aArena.crest = null;
  v2aArena.ring = null;
  v2aArena.particles = null;
  v2aArena.origin = null;
  v2aArena.active = false;
  v2aArena.areaId = null;
}

/* -------------------------------------------------------------------------
   Animación (O(1) por frame, sin allocations)
   ------------------------------------------------------------------------- */
var v2aFrameCounter = 0;
var v2aMotionCache = { value: false, ready: false };
function v2aMotionOn() {
  if (!v2aMotionCache.ready || v2aFrameCounter % 90 === 0) {
    var core = v2aCore();
    var value = false;
    try { if (core && core.reducedMotion) value = !!core.reducedMotion(); } catch (e) {}
    v2aMotionCache.value = value;
    v2aMotionCache.ready = true;
  }
  return v2aMotionCache.value;
}
function v2aUpdateSky(motion, time) {
  if (!v2aSky.group) return;
  try {
    if (typeof camera !== 'undefined' && camera && camera.position) {
      v2aSky.group.position.set(camera.position.x, 0, camera.position.z);
    }
  } catch (e) {}
  if (motion) return;
  try {
    if (v2aSky.aurora) v2aSky.aurora.rotation.y = time * 0.0065;
    for (var i = 0; i < v2aSky.auroraSprites.length; i++) {
      var it = v2aSky.auroraSprites[i];
      var m = it.sprite.material;
      if (m) m.opacity = it.base + Math.sin(time * it.speed + it.phase) * it.amp;
    }
    if (v2aSky.stars) v2aSky.stars.rotation.y = time * 0.0013;
  } catch (e2) {}
}
function v2aUpdateMinions(motion, time) {
  if (motion) return;
  for (var i = 0; i < v2aHub.minions.length; i++) {
    var it = v2aHub.minions[i];
    if (!it.root) continue;
    it.root.position.y = it.baseY + Math.sin(time * 1.35 + it.phase) * 0.075;
    it.root.rotation.y = it.baseRot + Math.sin(time * 0.55 + it.phase) * 0.16;
    if (it.ring) it.ring.rotation.z = time * (0.34 + i * 0.04) + it.phase;
  }
}
function v2aUpdateDust(motion, time) {
  if (motion || !v2aHub.dust) return;
  var d = v2aHub.dust;
  var arr = d.attr ? d.attr.array : null;
  if (!arr) return;
  for (var i = 0; i < d.count; i++) {
    var k = i * 3;
    var ph = d.phases[i];
    var sp = d.speeds[i];
    arr[k] = d.base[k] + Math.sin(time * 0.18 * sp + ph) * 0.55;
    arr[k + 1] = d.base[k + 1] + Math.sin(time * 0.26 * sp + ph * 1.3) * 0.38;
    arr[k + 2] = d.base[k + 2] + Math.cos(time * 0.15 * sp + ph) * 0.5;
  }
  d.attr.needsUpdate = true;
}
function v2aUpdateArena(motion, time) {
  if (!v2aArena.active || !v2aArena.group) return;
  try {
    var i, it, attr, base, arr, v, bx, by, u, drop, anclaje, s1, s2;
    var ox = v2aArena.origin ? v2aArena.origin.x : 0;
    var oz = v2aArena.origin ? v2aArena.origin.z : 0;
    var camX = 0, camZ = 0, hasCam = false;
    try {
      if (typeof camera !== 'undefined' && camera && camera.position) {
        camX = camera.position.x; camZ = camera.position.z; hasCam = true;
      }
    } catch (e0) {}
    /* El borde de la driza queda fijo al palo: el grupo pivote gira con la
       cámara alrededor del eje del palo; la tela ya nace en ese borde. */
    for (i = 0; i < v2aArena.pennants.length; i++) {
      it = v2aArena.pennants[i];
      if (!it || !it.pivot) continue;
      if (hasCam) {
        var adx = camX - ox - it.baseX;
        var adz = camZ - oz - it.baseZ;
        if (adx * adx + adz * adz > 0.000001) it.pivot.rotation.y = Math.atan2(adx, adz);
      }
    }
    if (motion) return;
    for (i = 0; i < v2aArena.pennants.length; i++) {
      it = v2aArena.pennants[i];
      if (!it || !it.attr || !it.base) continue;
      attr = it.attr; base = it.base; arr = attr.array;
      var w = it.width || 1, h = it.height || 1;
      for (v = 0; v < arr.length; v += 3) {
        bx = base[v]; by = base[v + 1];
        u = bx / w;
        if (u < 0) u = 0; else if (u > 1) u = 1;
        drop = by < 0 ? -by / h : 0;
        /* Amplitud 0 en la driza; crece con la distancia al palo y al anclaje. */
        anclaje = u * (0.32 + 0.68 * drop);
        s1 = Math.sin(bx * 7.4 - time * 2.05 + it.phase);
        s2 = Math.sin(bx * 13.1 - time * 3.5 + it.phase * 1.6 + drop * 2.4);
        arr[v] = bx + s2 * 0.009 * anclaje;
        arr[v + 1] = by + s1 * 0.005 * anclaje;
        arr[v + 2] = (s1 * 0.048 + s2 * 0.012) * anclaje;
      }
      attr.needsUpdate = true;
    }
    if (v2aArena.pennantMat) v2aArena.pennantMat.opacity = 0.84 + Math.sin(time * 0.9) * 0.06;
    if (v2aArena.crest) v2aArena.crest.rotation.z = -time * 0.012;
    if (v2aArena.ring && v2aArena.ring.material) v2aArena.ring.material.opacity = 0.34 + Math.sin(time * 0.8) * 0.08;
    var p = v2aArena.particles;
    if (p && p.attr) {
      var arr2 = p.attr.array;
      for (var j = 0; j < p.count; j++) {
        var k = j * 3;
        var ph = p.phases[j];
        arr2[k] = p.base[k] + Math.sin(time * 0.22 + ph) * 0.42;
        arr2[k + 1] = p.base[k + 1] + Math.sin(time * 0.33 + ph * 1.4) * 0.35;
        arr2[k + 2] = p.base[k + 2] + Math.cos(time * 0.19 + ph) * 0.42;
      }
      p.attr.needsUpdate = true;
    }
  } catch (e) { v2aSoft(e); }
}
function v2aUpdate(dt, time) {
  if (typeof THREE === 'undefined' || !THREE) return;
  v2aFrameCounter = (v2aFrameCounter + 1) % 900000;
  /* Calidad en caliente cada ~1,5 s: el atrio se reconstruye y el cielo
     cambia visibilidad/rango de estrellas sin regenerar texturas. */
  if (v2aFrameCounter === 1 || v2aFrameCounter % 90 === 0) {
    var qNow = v2aQuality();
    v2aEnsureSky();
    v2aApplySkyQuality(qNow);
    if (v2aHub.built && v2aHub.quality !== qNow) v2aRebuildHub();
    else if (!v2aHub.built) v2aBuildHub();
  }
  var motion = v2aMotionOn();
  var t = Number(time) || 0;
  v2aUpdateSky(motion, t);
  var hubVisible = false;
  try { hubVisible = typeof hubGroup !== 'undefined' && hubGroup && hubGroup.visible; } catch (e) {}
  if (hubVisible) {
    v2aUpdateMinions(motion, t);
    v2aUpdateDust(motion, t);
  }
  var arenaVisible = false;
  try { arenaVisible = typeof arenaGroup !== 'undefined' && arenaGroup && arenaGroup.visible; } catch (e2) {}
  if (arenaVisible) v2aUpdateArena(motion, t);
}

/* -------------------------------------------------------------------------
   Fábrica pública opcional: un prop suelto ya fusionado por mergedVoxels
   ------------------------------------------------------------------------- */
function v2aProp(id, opts) {
  if (typeof THREE === 'undefined' || !THREE) return null;
  var spec = V2A_SPEC_BY_ID[id];
  if (!spec) return null;
  var pal = v2aPalette(spec.areaId);
  var group = v2aMerge(v2aArchBoxes(spec.arch, pal, 0));
  if (!group) return null;
  v2aMarkDecorative(group);
  if (opts && typeof opts.scale === 'number') group.scale.setScalar(opts.scale);
  return group;
}

/* -------------------------------------------------------------------------
   Catálogo público V2.assets.ids
   5 claves de área (12 props cada una) + 3 claves de grupo: v2-minions,
   v2-arena y v2-sky. V2.assets.catalog separa areas/minions/arena/sky
   para quien prefiera no mezclar grupos con ids de área.
   ------------------------------------------------------------------------- */
function v2aCopyIdList(list) {
  var out = [];
  for (var i = 0; i < list.length; i++) {
    var item = { id: list[i].id, label: list[i].label, kind: list[i].kind };
    if (list[i].areaId) item.areaId = list[i].areaId;
    out.push(item);
  }
  return out;
}
var V2A_IDS = {};
var V2A_SPEC_BY_ID = {};
for (var v2aAreaIdx = 0; v2aAreaIdx < V2A_AREA_ORDER.length; v2aAreaIdx++) {
  var v2aAreaId = V2A_AREA_ORDER[v2aAreaIdx];
  var v2aSpecs = V2A_PROPS[v2aAreaId] || [];
  var v2aIdList = [];
  for (var v2aPropIdx = 0; v2aPropIdx < v2aSpecs.length; v2aPropIdx++) {
    v2aSpecs[v2aPropIdx].areaId = v2aAreaId;
    V2A_SPEC_BY_ID[v2aSpecs[v2aPropIdx].id] = v2aSpecs[v2aPropIdx];
    v2aIdList.push({ id: v2aSpecs[v2aPropIdx].id, label: v2aSpecs[v2aPropIdx].label, kind: v2aSpecs[v2aPropIdx].kind });
  }
  V2A_IDS[v2aAreaId] = v2aIdList;
}
V2A_IDS['v2-minions'] = v2aCopyIdList(V2A_MINION_LIST);
V2A_IDS['v2-arena'] = v2aCopyIdList(V2A_ARENA_LIST);
V2A_IDS['v2-sky'] = v2aCopyIdList(V2A_SKY_LIST);

var V2A_CATALOG = {
  areas: {},
  minions: v2aCopyIdList(V2A_MINION_LIST),
  arena: v2aCopyIdList(V2A_ARENA_LIST),
  sky: v2aCopyIdList(V2A_SKY_LIST)
};
for (var v2aCatIdx = 0; v2aCatIdx < V2A_AREA_ORDER.length; v2aCatIdx++) {
  V2A_CATALOG.areas[V2A_AREA_ORDER[v2aCatIdx]] = V2A_IDS[V2A_AREA_ORDER[v2aCatIdx]];
}
function v2aStats() {
  return {
    quality: v2aHub.quality || v2aQuality(),
    budget: v2aBudget(),
    hubProps: v2aHub.props,
    hubVeg: v2aHub.veg,
    minions: v2aHub.minions.length,
    hubDust: v2aHub.dust ? v2aHub.dust.count : 0,
    skyBuilt: v2aSky.built,
    arenaActive: v2aArena.active,
    arenaArea: v2aArena.areaId,
    mapIslands: v2aMapStats.built,
    mapProps: v2aMapStats.props
  };
}

var v2aModule = {
  version: 'v2-assets-1',
  ids: V2A_IDS,
  catalog: V2A_CATALOG,
  areaOrder: V2A_AREA_ORDER,
  prop: v2aProp,
  decorateHub: v2aDecorateHub,
  decorateMapIsland: v2aDecorateMapIsland,
  applyArenaVariant: v2aApplyArenaVariant,
  clearArenaVariant: v2aClearArenaVariant,
  update: v2aUpdate,
  stats: v2aStats
};
var v2aCoreRef = v2aCore();
if (v2aCoreRef) {
  try {
    if (v2aCoreRef.register) v2aCoreRef.register('assets', v2aModule);
    else {
      v2aCoreRef.assets = v2aModule;
      v2aCoreRef.modules = v2aCoreRef.modules || {};
      v2aCoreRef.modules.assets = true;
    }
  } catch (e) { v2aSoft(e); }
}
