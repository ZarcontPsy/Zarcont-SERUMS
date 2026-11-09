/* =========================================================================
   COSMÉTICOS — modelos voxel modulares, acople y animación
   ========================================================================= */
var CLEAN_COLOR = {
  bronze: '#b9874f', silver: '#d9e2ef', gold: '#e4c07a', ink: '#243040',
  teal: '#69d3c1', blue: '#7aa2ff', violet: '#c49bff', lime: '#b8d46a',
  amber: '#f3b562', rose: '#ff8b9d', bone: '#f2f0ea', dark: '#141a25'
};
function effectQualityFactor() {
  var q = state.settings.effectsQuality || 'medio';
  return q === 'bajo' ? 0.38 : (q === 'alto' ? 1.18 : 0.72);
}
function qCount(base) {
  return Math.max(1, Math.round(base * effectQualityFactor()));
}
function addCosmeticGlow(parent, color, scale, x, y, z, opacity) {
  var s = makeGlowSprite(color, scale, opacity == null ? 0.22 : opacity);
  s.position.set(x || 0, y || 0, z || 0);
  parent.add(s);
  return s;
}
function decorateRarity(group, c, y) {
  var key = cosmeticRarityKey(c);
  var rank = rarityUI(key).order;
  if (rank < 3) return;
  var qf = effectQualityFactor();
  var col = rarityUI(key).color;
  addCosmeticGlow(group, col, 0.42 + rank * 0.12, 0, y == null ? 0.15 : y, 0.02, rank >= 5 ? 0.4 : 0.25);
  if (rank >= 4 && qf > 0.5) {
    var b = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.035), new THREE.MeshBasicMaterial({ color: color(col), transparent: true, opacity: 0.8 }));
    b.position.set(0.18, (y == null ? 0.15 : y) + 0.16, 0.02);
    group.add(b);
  }
}
function addAnim(anim, spec) { anim.push(spec); }
function buildBoxGroup(boxes) { return mergedVoxels(boxes); }

/*  Capas de cosméticos sobre la prenda base.
    · setVoxelDepthLayer (part2) desempata caras coplanares entre mallas.
    · Un desplazamiento mínimo en +Z separa placas apoyadas en el torso, el
      peinado sobre la cabeza y las calzas sobre las piernas. Se mide en
      unidades voxel (~0,4-0,5 cm a escala de héroe de ~1,9 m). */
var COSMETIC_DEPTH_LAYER = {
  cabeza: 12, peinado: 11, accesorios: 10, torso: 9, piernas: 8, extras: 7,
  amuletos: 6, efectos: 5, mascota: 4, estela: 3, marcos: 2
};
var COSMETIC_Z_LIFT = { cabeza: 0.005, peinado: 0.004, torso: 0.004, piernas: 0.004, accesorios: 0.004, extras: 0.004, amuletos: 0.004 };
/* Tocado que cubre el cráneo: ahí el pelo base debe ocultarse. */
var HEAD_COSMETIC_HIDES_HAIR = { 'c-cabeza-casco': 1, 'c-cabeza-gorro': 1 };

function cosmeticBaseParts(avatar) {
  return avatar && avatar.head && avatar.head.userData ? avatar.head.userData : {};
}
function setBaseGroupsVisible(groups, visible) {
  if (!groups) return;
  groups.forEach(function (group) { if (group) group.visible = visible; });
}
function applyCosmeticLayering(group, slot) {
  if (!group) return group;
  if (typeof setVoxelDepthLayer === 'function') {
    setVoxelDepthLayer(group, COSMETIC_DEPTH_LAYER[slot] || 3);
  }
  var lift = COSMETIC_Z_LIFT[slot];
  if (lift) group.position.z += lift;
  return group;
}
function buildHeadPiece(c, qf) {
  var g = new THREE.Group();
  var id = c.id;
  var boxes = [];
  if (id === 'c-cabeza-diadema') {
    boxes = [
      [0, 0.49, 0.04, 0.56, 0.065, 0.12, '#b68ad9'],
      [0, 0.49, 0.22, 0.36, 0.05, 0.035, '#e7d6ff', true],
      [-0.25, 0.49, 0.08, 0.08, 0.09, 0.1, '#7aa2ff', true],
      [0.25, 0.49, 0.08, 0.08, 0.09, 0.1, '#69d3c1', true],
      [0, 0.55, 0.04, 0.08, 0.06, 0.08, CLEAN_COLOR.gold, true]
    ];
  } else if (id === 'c-cabeza-casco') {
    boxes = [
      [0, 0.49, -0.01, 0.64, 0.38, 0.56, '#445064'],
      [-0.29, 0.33, 0.02, 0.17, 0.35, 0.42, '#313a48'],
      [0.29, 0.33, 0.02, 0.17, 0.35, 0.42, '#313a48'],
      [0, 0.41, 0.24, 0.48, 0.15, 0.08, '#161d29'],
      [0, 0.44, 0.31, 0.34, 0.055, 0.02, '#7aa2ff', true],
      [0, 0.66, -0.03, 0.22, 0.08, 0.18, CLEAN_COLOR.silver]
    ];
  } else if (id === 'c-cabeza-gorro') {
    boxes = [
      [0, 0.55, 0, 0.56, 0.18, 0.48, '#5d754d'],
      [0, 0.63, 0.03, 0.35, 0.12, 0.34, '#455b39'],
      [0, 0.53, 0.25, 0.45, 0.055, 0.16, '#384b30'],
      [0, 0.48, 0.06, 0.57, 0.045, 0.5, '#c8a969'],
      [0.16, 0.62, 0.22, 0.08, 0.06, 0.02, CLEAN_COLOR.teal, true]
    ];
  } else if (id === 'c-cabeza-corona') {
    boxes = [
      [0, 0.65, 0.0, 0.54, 0.11, 0.34, '#55422c'],
      [0, 0.65, 0.17, 0.36, 0.055, 0.02, CLEAN_COLOR.gold, true],
      [-0.25, 0.78, 0, 0.09, 0.28, 0.09, CLEAN_COLOR.gold],
      [0.25, 0.78, 0, 0.09, 0.28, 0.09, CLEAN_COLOR.gold],
      [0, 0.88, 0, 0.09, 0.36, 0.09, CLEAN_COLOR.gold, true],
      [-0.13, 0.82, 0, 0.06, 0.15, 0.06, '#f1d596', true],
      [0.13, 0.82, 0, 0.06, 0.15, 0.06, '#f1d596', true]
    ];
    addAnim(g.userData.anim = [], { type: 'orbit-stars', color: CLEAN_COLOR.gold, radius: 0.55, count: qCount(3) });
  } else if (id === 'c-cabeza-auriculares') {
    boxes = [
      [0, 0.63, 0.0, 0.58, 0.07, 0.08, '#26344b'],
      [-0.29, 0.43, 0.0, 0.13, 0.23, 0.26, '#1b2638'],
      [0.29, 0.43, 0.0, 0.13, 0.23, 0.26, '#1b2638'],
      [-0.29, 0.43, 0.14, 0.08, 0.18, 0.03, CLEAN_COLOR.blue, true],
      [0.29, 0.43, 0.14, 0.08, 0.18, 0.03, CLEAN_COLOR.blue, true],
      [0, 0.51, 0.22, 0.3, 0.035, 0.02, CLEAN_COLOR.teal, true]
    ];
  } else if (id.indexOf('x-dominio-') === 0) {
    var gold = /-oro$/.test(id);
    var areaColor = id.indexOf('salud') !== -1 ? CLEAN_COLOR.teal : id.indexOf('cuidado') !== -1 ? CLEAN_COLOR.blue : id.indexOf('etica') !== -1 ? CLEAN_COLOR.violet : id.indexOf('investigacion') !== -1 ? CLEAN_COLOR.lime : CLEAN_COLOR.amber;
    var band = gold ? CLEAN_COLOR.gold : '#746b59';
    var gem = gold ? '#fff0bf' : areaColor;
    boxes = [
      [0, 0.64, 0.0, 0.56, 0.12, 0.36, band],
      [0, 0.67, 0.2, 0.34, 0.045, 0.03, gem, true],
      [-0.2, 0.74, 0, 0.06, 0.22, 0.06, gold ? CLEAN_COLOR.gold : areaColor],
      [0.2, 0.74, 0, 0.06, 0.22, 0.06, gold ? CLEAN_COLOR.gold : areaColor],
      [0, 0.9, 0.03, 0.12, 0.25, 0.12, gem, true],
      [-0.1, 0.78, 0.05, 0.05, 0.05, 0.05, CLEAN_COLOR.bone, true],
      [0.1, 0.78, 0.05, 0.05, 0.05, 0.05, CLEAN_COLOR.bone, true]
    ];
    /* V2.2 · Motivo propio por área: la silueta cambia, no solo el color. */
    if (id.indexOf('salud') !== -1) {
      boxes.push([-0.18, 0.96, 0.02, 0.16, 0.2, 0.1, '#b8d46a', true], [0.18, 0.96, 0.02, 0.16, 0.2, 0.1, '#b8d46a', true], [0, 1.08, 0.02, 0.34, 0.12, 0.12, areaColor, true]);
    } else if (id.indexOf('cuidado') !== -1) {
      boxes.push([-0.16, 0.98, 0.02, 0.18, 0.18, 0.12, areaColor, true], [0.16, 0.98, 0.02, 0.18, 0.18, 0.12, areaColor, true], [0, 0.94, 0.04, 0.28, 0.3, 0.1, areaColor, true]);
    } else if (id.indexOf('etica') !== -1) {
      boxes.push([0, 1.0, 0.02, 0.48, 0.06, 0.08, gold ? CLEAN_COLOR.gold : CLEAN_COLOR.violet], [-0.18, 0.92, 0.02, 0.08, 0.2, 0.08, areaColor, true], [0.18, 0.92, 0.02, 0.08, 0.2, 0.08, areaColor, true]);
    } else if (id.indexOf('investigacion') !== -1) {
      boxes.push([0, 1.02, 0.02, 0.18, 0.26, 0.14, areaColor, true], [-0.16, 0.94, 0.02, 0.1, 0.12, 0.08, '#f5f7d9', true], [0.16, 0.94, 0.02, 0.1, 0.12, 0.08, '#f5f7d9', true]);
    } else {
      boxes.push([0, 0.98, 0.02, 0.34, 0.1, 0.34, areaColor, true], [0, 1.08, 0.02, 0.2, 0.12, 0.2, gold ? CLEAN_COLOR.gold : areaColor, true], [-0.2, 1.02, 0.02, 0.08, 0.08, 0.08, CLEAN_COLOR.gold, true], [0.2, 1.02, 0.02, 0.08, 0.08, 0.08, CLEAN_COLOR.gold, true]);
    }
    if (gold) {
      boxes.push([-0.3, 1.02, 0.02, 0.05, 0.18, 0.05, CLEAN_COLOR.gold, true], [0.3, 1.02, 0.02, 0.05, 0.18, 0.05, CLEAN_COLOR.gold, true]);
    }
    addAnim(g.userData.anim = [], { type: 'orbit-stars', color: gem, radius: 0.5, count: qCount(gold ? 4 : 2) });
  } else {
    boxes = [
      [0, 0.57, 0, 0.52, 0.12, 0.4, CLEAN_COLOR.violet],
      [0, 0.6, 0.2, 0.3, 0.04, 0.02, CLEAN_COLOR.gold, true]
    ];
  }
  addPartBoxes(g, boxes);
  decorateRarity(g, c, 0.6);
  return g;
}
function buildHairPiece(c, qf) {
  var g = new THREE.Group();
  var id = c.id;
  var boxes = [];
  if (id === 'c-peinado-coleta') {
    boxes = [
      [0, 0.56, -0.02, 0.53, 0.16, 0.47, '#633d27'],
      [-0.22, 0.42, -0.1, 0.09, 0.42, 0.23, '#633d27'],
      [0.23, 0.3, -0.29, 0.15, 0.58, 0.13, '#633d27'],
      [0.27, 0.01, -0.35, 0.12, 0.26, 0.1, '#633d27'],
      [0.25, 0.44, -0.29, 0.18, 0.07, 0.15, CLEAN_COLOR.gold, true],
      [0.28, 0.4, -0.31, 0.12, 0.12, 0.03, CLEAN_COLOR.teal, true]
    ];
    addAnim(g.userData.anim = [], { type: 'hair-tail', phase: 0.3 });
  } else if (id === 'c-peinado-rizos') {
    boxes = [
      [0, 0.58, -0.01, 0.54, 0.17, 0.48, '#241c2b'],
      [-0.26, 0.38, -0.02, 0.11, 0.36, 0.34, '#241c2b'],
      [0.26, 0.38, -0.02, 0.11, 0.36, 0.34, '#241c2b'],
      [-0.27, 0.24, 0.08, 0.13, 0.16, 0.2, '#35283d'],
      [0.27, 0.23, 0.08, 0.13, 0.16, 0.2, '#35283d'],
      [0, 0.2, -0.25, 0.42, 0.28, 0.1, '#241c2b']
    ];
  } else if (id === 'c-peinado-mecha') {
    boxes = [
      [0, 0.58, -0.01, 0.54, 0.16, 0.48, '#2a1e17'],
      [-0.23, 0.4, -0.03, 0.09, 0.4, 0.32, '#2a1e17'],
      [0.26, 0.3, -0.1, 0.16, 0.58, 0.14, '#a36cff'],
      [0.24, 0.56, 0.24, 0.14, 0.08, 0.07, '#d8c2ff', true],
      [0, 0.67, 0.02, 0.2, 0.07, 0.3, '#2a1e17']
    ];
    addAnim(g.userData.anim = [], { type: 'hair-tail', phase: 1.6 });
  } else if (id === 'c-peinado-mono') {
    boxes = [
      [0, 0.58, -0.01, 0.53, 0.16, 0.47, '#4a2a20'],
      [0, 0.79, -0.12, 0.3, 0.26, 0.28, '#4a2a20'],
      [0, 0.8, -0.12, 0.18, 0.17, 0.18, '#6c4031'],
      [-0.23, 0.44, -0.02, 0.08, 0.28, 0.36, '#4a2a20'],
      [0, 0.81, 0.02, 0.06, 0.05, 0.16, CLEAN_COLOR.gold, true]
    ];
  }
  addPartBoxes(g, boxes);
  decorateRarity(g, c, 0.55);
  return g;
}
function buildTorsoPiece(c, qf) {
  var g = new THREE.Group();
  var id = c.id;
  var boxes = [];
  if (id === 'c-torso-abrigo') {
    boxes = [
      [0, 0.4, 0.22, 0.82, 0.62, 0.06, '#5b3b33'],
      [0, 0.62, 0.12, 0.92, 0.15, 0.4, '#3b2828'],
      [0, 0.35, 0.0, 0.88, 0.12, 0.48, '#31201f'],
      [-0.24, -0.1, -0.2, 0.3, 0.65, 0.1, '#4a302b'],
      [0.24, -0.1, -0.2, 0.3, 0.65, 0.1, '#4a302b'],
      [0, 0.18, 0.23, 0.55, 0.07, 0.03, CLEAN_COLOR.gold],
      [-0.35, 0.54, 0.0, 0.18, 0.18, 0.36, '#3a2625']
    ];
  } else if (id === 'c-torso-bata') {
    boxes = [
      [0, 0.4, 0.23, 0.78, 0.66, 0.05, '#e4e8ee'],
      [-0.18, -0.2, -0.18, 0.3, 0.7, 0.09, '#e4e8ee'],
      [0.18, -0.2, -0.18, 0.3, 0.7, 0.09, '#e4e8ee'],
      [0, 0.68, 0.06, 0.82, 0.12, 0.36, '#d9e2ef'],
      [-0.22, 0.36, 0.27, 0.18, 0.15, 0.04, '#aebac9'],
      [0.22, 0.3, 0.27, 0.12, 0.18, 0.02, CLEAN_COLOR.blue, true],
      [0, 0.18, 0.26, 0.52, 0.06, 0.02, CLEAN_COLOR.blue]
    ];
  } else if (id === 'c-torso-manto') {
    boxes = [
      [0, 0.45, -0.26, 0.95, 0.9, 0.08, '#1e2944'],
      [0, 0.7, 0.06, 0.96, 0.15, 0.44, '#151d31'],
      [0, 0.63, 0.25, 0.25, 0.07, 0.04, CLEAN_COLOR.gold, true],
      [-0.4, 0.48, 0.05, 0.2, 0.48, 0.12, '#2c3c64'],
      [0.4, 0.48, 0.05, 0.2, 0.48, 0.12, '#2c3c64'],
      [0, 0.15, -0.31, 0.5, 0.07, 0.04, CLEAN_COLOR.violet, true]
    ];
    addAnim(g.userData.anim = [], { type: 'stars', color: CLEAN_COLOR.violet, radius: 0.8, count: qCount(5) });
  } else if (id === 'c-torso-chaleco') {
    boxes = [
      [0, 0.4, 0.235, 0.74, 0.56, 0.05, '#61724a'],
      [-0.3, 0.35, 0.02, 0.21, 0.62, 0.45, '#4c5e3d'],
      [0.3, 0.35, 0.02, 0.21, 0.62, 0.45, '#4c5e3d'],
      [-0.2, 0.35, 0.27, 0.16, 0.14, 0.03, '#a68856'],
      [0.18, 0.3, 0.27, 0.16, 0.14, 0.03, '#a68856'],
      [0, 0.16, 0.26, 0.52, 0.06, 0.025, CLEAN_COLOR.gold]
    ];
  } else if (id === 'c-torso-poncho') {
    boxes = [
      [0, 0.5, 0.02, 0.98, 0.25, 0.58, '#477066'],
      [0, 0.35, 0.02, 1.04, 0.24, 0.6, '#5b4d34'],
      [0, 0.13, 0.02, 0.9, 0.5, 0.56, '#3f6059'],
      [0, 0.54, 0.3, 0.48, 0.06, 0.05, CLEAN_COLOR.gold, true],
      [0, 0.34, 0.3, 0.3, 0.22, 0.03, CLEAN_COLOR.teal, true],
      [-0.42, 0.2, 0.02, 0.2, 0.2, 0.4, '#6b593d'],
      [0.42, 0.2, 0.02, 0.2, 0.2, 0.4, '#6b593d']
    ];
  } else if (id === 'x-capa-errorario') {
    boxes = [
      [0, 0.47, -0.27, 0.98, 1.0, 0.08, '#20293a'],
      [0, 0.72, 0.04, 0.96, 0.16, 0.44, '#161d2c'],
      [-0.4, 0.25, -0.32, 0.12, 0.7, 0.05, '#2b3b52'],
      [0.4, 0.25, -0.32, 0.12, 0.7, 0.05, '#2b3b52'],
      [0, 0.4, -0.33, 0.55, 0.08, 0.025, CLEAN_COLOR.rose, true],
      [0, 0.12, -0.33, 0.34, 0.05, 0.025, CLEAN_COLOR.teal, true],
      [0, 0.26, -0.33, 0.2, 0.05, 0.025, CLEAN_COLOR.violet, true]
    ];
    addAnim(g.userData.anim = [], { type: 'runes', color: CLEAN_COLOR.rose, radius: 0.65, count: qCount(4) });
  } else {
    boxes = [
      [0, 0.38, 0.23, 0.8, 0.58, 0.05, CLEAN_COLOR.blue],
      [0, 0.58, 0.25, 0.5, 0.12, 0.06, CLEAN_COLOR.gold]
    ];
  }
  /* Prendas que tapan la espalda: la capa nativa queda debajo y debe ocultarse. */
  g.userData.coversBack = id === 'c-torso-manto' || id === 'c-torso-poncho' ||
    id === 'c-torso-abrigo' || id === 'c-torso-bata' || id === 'x-capa-errorario';
  addPartBoxes(g, boxes);
  decorateRarity(g, c, 0.5);
  return g;
}
function buildLegPair(c, qf, avatar) {
  var id = c.id;
  if (id === 'c-piernas-falda') {
    var g = new THREE.Group();
    addPartBoxes(g, [
      [0, 0.83, 0, 0.92, 0.1, 0.58, '#4d3b2b'],
      [0, 0.56, 0, 0.78, 0.5, 0.5, '#5a4632'],
      [-0.32, 0.35, 0.03, 0.25, 0.34, 0.38, '#5a4632'],
      [0.32, 0.35, 0.03, 0.25, 0.34, 0.38, '#5a4632'],
      [0, 0.74, 0.28, 0.66, 0.06, 0.03, CLEAN_COLOR.gold, true],
      [0, 0.45, 0.28, 0.22, 0.2, 0.03, '#c6a05c']
    ]);
    addAnim(g.userData.anim = [], { type: 'cloth', phase: 0.4 });
    var native = new THREE.Group(); native.add(g); decorateRarity(g, c, 0.6); return [{ parent: avatar.body, group: g }];
  }
  var boxes;
  if (id === 'c-piernas-ruta') {
    boxes = [
      [-0.02, 0.58, 0.02, 0.3, 0.2, 0.3, '#5a4632'],
      [0.03, 0.42, 0.06, 0.25, 0.12, 0.26, '#7a5a3a'],
      [0, 0.29, 0.06, 0.3, 0.2, 0.3, '#2f3b4a'],
      [0, 0.31, 0.22, 0.14, 0.06, 0.03, CLEAN_COLOR.teal, true],
      [0, 0.13, 0.08, 0.32, 0.14, 0.36, '#1c232e'],
      [0, 0.47, 0.18, 0.1, 0.16, 0.04, CLEAN_COLOR.gold, true]
    ];
  } else boxes = id === 'c-piernas-grebas' ? [
    [-0.1, 0.55, 0.0, 0.34, 0.18, 0.35, '#75808e'],
    [0, 0.32, 0.06, 0.29, 0.45, 0.34, '#aeb6c8'],
    [0, 0.08, 0.08, 0.3, 0.16, 0.4, '#4a5563'],
    [0, 0.23, 0.25, 0.15, 0.08, 0.02, CLEAN_COLOR.blue, true]
  ] : [
    [-0.02, 0.58, 0.02, 0.3, 0.2, 0.3, '#574431'],
    [0.03, 0.42, 0.06, 0.25, 0.12, 0.26, '#8a6746'],
    [0, 0.27, 0.05, 0.28, 0.2, 0.28, '#3d5162'],
    [0, 0.29, 0.22, 0.14, 0.06, 0.03, CLEAN_COLOR.teal, true]
  ];
  var out = [];
  [-1, 1].forEach(function (side) {
    var g = new THREE.Group();
    addPartBoxes(g, boxes.map(function (b) { return b.slice(); }));
    decorateRarity(g, c, 0.4);
    out.push({ parent: side < 0 ? avatar.leftLeg : avatar.rightLeg, group: g });
  });
  return out;
}
function buildHeadAccessory(c, qf) {
  var g = new THREE.Group();
  if (c.id === 'c-accesorios-gafas') {
    addPartBoxes(g, [
      [-0.11, 0.34, 0.255, 0.17, 0.12, 0.035, '#26344b'],
      [0.11, 0.34, 0.255, 0.17, 0.12, 0.035, '#26344b'],
      [-0.11, 0.34, 0.275, 0.11, 0.065, 0.012, CLEAN_COLOR.blue, true],
      [0.11, 0.34, 0.275, 0.11, 0.065, 0.012, CLEAN_COLOR.blue, true],
      [0, 0.34, 0.267, 0.09, 0.027, 0.015, CLEAN_COLOR.gold],
      [-0.24, 0.34, 0.2, 0.03, 0.035, 0.08, '#26344b']
    ]);
  }
  decorateRarity(g, c, 0.34);
  return g;
}
function buildAmulet(c, qf) {
  var g = new THREE.Group();
  var id = c.id;
  if (id === 'c-amuleto-enfoque') {
    addPartBoxes(g, [
      [0, 0.58, 0.235, 0.3, 0.025, 0.02, CLEAN_COLOR.gold],
      [0, 0.5, 0.255, 0.08, 0.12, 0.04, '#d8af67'],
      [0, 0.42, 0.26, 0.17, 0.17, 0.04, CLEAN_COLOR.teal, true],
      [0, 0.42, 0.285, 0.08, 0.08, 0.02, '#dffcf4', true]
    ]);
  } else if (id === 'c-amuleto-sello') {
    addPartBoxes(g, [
      [0, 0.57, 0.235, 0.3, 0.025, 0.02, CLEAN_COLOR.gold],
      [0, 0.47, 0.255, 0.2, 0.2, 0.05, '#6e7787'],
      [0, 0.47, 0.285, 0.09, 0.09, 0.02, CLEAN_COLOR.gold, true],
      [-0.08, 0.47, 0.3, 0.025, 0.12, 0.012, '#f4e6c2']
    ]);
  } else if (id === 'c-amuleto-nudo') {
    addPartBoxes(g, [
      [0, 0.57, 0.235, 0.3, 0.025, 0.02, '#b59663'],
      [-0.08, 0.44, 0.255, 0.2, 0.11, 0.04, '#b4a09d'],
      [0.06, 0.34, 0.255, 0.14, 0.2, 0.04, '#8f7d84'],
      [0, 0.42, 0.285, 0.08, 0.07, 0.018, CLEAN_COLOR.rose, true]
    ]);
  } else if (id === 'c-amuleto-criterio') {
    addPartBoxes(g, [
      [0, 0.57, 0.235, 0.3, 0.025, 0.02, CLEAN_COLOR.gold],
      [0, 0.47, 0.255, 0.14, 0.14, 0.04, '#d8af67'],
      [0, 0.45, 0.28, 0.08, 0.08, 0.02, CLEAN_COLOR.violet, true],
      [0, 0.35, 0.255, 0.06, 0.2, 0.04, '#d8af67'],
      [-0.04, 0.3, 0.255, 0.14, 0.05, 0.04, '#d8af67'],
      [-0.11, 0.29, 0.255, 0.05, 0.1, 0.04, '#d8af67'],
      [0.11, 0.38, 0.255, 0.05, 0.12, 0.04, '#d8af67'],
      [0, 0.42, 0.285, 0.03, 0.12, 0.01, '#f4e6c2', true]
    ]);
  } else {
    addPartBoxes(g, [
      [0, 0.57, 0.235, 0.3, 0.025, 0.02, CLEAN_COLOR.gold],
      [0, 0.42, 0.255, 0.18, 0.27, 0.06, '#2b2945'],
      [0, 0.44, 0.29, 0.1, 0.16, 0.02, CLEAN_COLOR.violet, true],
      [0.09, 0.52, 0.29, 0.06, 0.06, 0.02, '#f1e6ff', true]
    ]);
  }
  decorateRarity(g, c, 0.45);
  return g;
}
function buildHipExtra(c, qf, avatar) {
  var g = new THREE.Group();
  if (c.id === 'c-accesorios-bolso') {
    addPartBoxes(g, [
      [0.43, 0.84, 0.07, 0.35, 0.3, 0.19, '#604a32'],
      [0.43, 0.9, 0.18, 0.28, 0.11, 0.04, '#c59d62'],
      [0.43, 1.03, 0.06, 0.08, 0.28, 0.04, '#443322']
    ]);
  } else if (c.id === 'c-accesorios-pluma') {
    addPartBoxes(g, [
      [-0.4, 1.34, -0.02, 0.07, 0.58, 0.07, '#e2d9ca'],
      [-0.44, 1.58, 0.02, 0.14, 0.38, 0.05, '#9d7ac4'],
      [-0.4, 1.35, 0.02, 0.1, 0.08, 0.06, CLEAN_COLOR.gold, true],
      [-0.38, 1.18, 0.03, 0.18, 0.16, 0.08, '#3c2d4f']
    ]);
  } else if (c.id === 'x-reloj-arena') {
    g.position.set(-0.7, 1.48, -0.05);
    addPartBoxes(g, [
      [-0.18, 0, 0, 0.36, 0.08, 0.3, '#b98d58'],
      [0.18, 0, 0, 0.36, 0.08, 0.3, '#b98d58'],
      [0, 0.01, 0, 0.03, 0.36, 0.03, '#d5c39a', true],
      [0, -0.01, 0, 0.26, 0.22, 0.045, CLEAN_COLOR.teal, true]
    ]);
    addAnim(g.userData.anim = [], { type: 'float', baseY: 1.48, phase: 1.1, amplitude: 0.12, rotate: 0.35 });
  } else if (c.id === 'x-cuaderno-orbital') {
    g.position.set(-0.72, 1.52, -0.1);
    addPartBoxes(g, [
      [0, 0, 0, 0.4, 0.5, 0.07, '#232d42'],
      [0, 0.05, 0.05, 0.32, 0.4, 0.025, '#dce7f2'],
      [-0.2, 0, 0, 0.04, 0.52, 0.08, CLEAN_COLOR.gold],
      [0.2, 0, 0, 0.04, 0.52, 0.08, CLEAN_COLOR.gold],
      [0, 0.08, 0.08, 0.12, 0.05, 0.015, CLEAN_COLOR.blue, true]
    ]);
    addAnim(g.userData.anim = [], { type: 'orbit', radius: 0.55, speed: 0.45, baseY: 1.52, phase: 0.2 });
  } else if (c.id.indexOf('x-trofeo-') === 0) {
    var trophyColor = c.id.indexOf('salud') !== -1 ? CLEAN_COLOR.teal : c.id.indexOf('cuidado') !== -1 ? CLEAN_COLOR.blue : c.id.indexOf('etica') !== -1 ? CLEAN_COLOR.violet : c.id.indexOf('investigacion') !== -1 ? CLEAN_COLOR.lime : CLEAN_COLOR.amber;
    g.position.set(0.75, 1.65, -0.35);
    var kind = c.id.indexOf('salud') !== -1 ? 'seed' : c.id.indexOf('cuidado') !== -1 ? 'lantern' : c.id.indexOf('etica') !== -1 ? 'mirror' : c.id.indexOf('investigacion') !== -1 ? 'prism' : 'gear';
    if (kind === 'seed') addPartBoxes(g, [[0, 0, 0, 0.22, 0.26, 0.18, trophyColor], [0, 0.2, 0, 0.08, 0.18, 0.08, '#e5fff9', true]]);
    else if (kind === 'lantern') addPartBoxes(g, [[0, 0, 0, 0.22, 0.12, 0.22, CLEAN_COLOR.gold], [0, 0.16, 0, 0.3, 0.24, 0.3, '#2d3850'], [0, 0.18, 0, 0.16, 0.12, 0.16, trophyColor, true]]);
    else if (kind === 'mirror') addPartBoxes(g, [[0, 0, 0, 0.24, 0.36, 0.08, '#332b42'], [0, 0.04, 0.05, 0.16, 0.24, 0.02, trophyColor, true]]);
    else if (kind === 'prism') addPartBoxes(g, [[0, 0, 0, 0.26, 0.34, 0.12, trophyColor], [0, 0.1, 0.07, 0.14, 0.16, 0.02, '#f5f7d9', true]]);
    else addPartBoxes(g, [[0, 0, 0, 0.3, 0.08, 0.3, CLEAN_COLOR.gold], [0, 0.12, 0, 0.14, 0.14, 0.14, trophyColor, true]]);
    addAnim(g.userData.anim = [], { type: 'orbit', radius: 0.16, speed: 0.7, baseY: 1.65, phase: 1.3 });
  }
  decorateRarity(g, c, 0.35);
  return g;
}
function buildAmuletHolder(c, qf) { return buildAmulet(c, qf); }
function buildLegExtra() { return null; }

/* -------------------------------------------------------------------------
   Efectos, marcos, mascotas y estelas
   ------------------------------------------------------------------------- */
function buildEffectPiece(c, qf, avatar) {
  var g = new THREE.Group();
  var id = c.id;
  var colors = {
    'c-efecto-aura': '#e4c07a', 'c-efecto-chispas': '#f3b562', 'c-efecto-bruma': '#7aa2ff',
    'c-efecto-constelacion': '#c49bff', 'x-aura-amanecer': '#f3b562'
  };
  var colorHex = colors[id] || CLEAN_COLOR.blue;
  if (id.indexOf('x-arma-') === 0) {
    var areaColors = { 'x-arma-destello': CLEAN_COLOR.teal, 'x-arma-marea': CLEAN_COLOR.blue, 'x-arma-sello': CLEAN_COLOR.violet, 'x-arma-prisma': CLEAN_COLOR.lime, 'x-arma-orbita': CLEAN_COLOR.amber };
    var wc = areaColors[id] || CLEAN_COLOR.gold;
    var n = qCount(5);
    for (var wi = 0; wi < n; wi++) {
      var p = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: color(wc), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
      p.scale.setScalar(0.12 + (wi % 3) * 0.05);
      p.position.set((wi % 2 ? 0.16 : -0.16), 0.35 + wi * 0.16, 0.09);
      g.add(p);
    }
    /* V2.2 · cada efecto de arma tiene una silueta propia, no solo color. */
    if (id === 'x-arma-destello') {
      addPartBoxes(g, [[0, 0.92, 0.12, 0.055, 0.95, 0.055, wc], [0, 1.42, 0.12, 0.18, 0.18, 0.06, '#f5f7d9', true], [-0.18, 1.18, 0.12, 0.2, 0.05, 0.04, CLEAN_COLOR.gold, true]]);
    } else if (id === 'x-arma-marea') {
      addPartBoxes(g, [[0, 0.82, 0.12, 0.12, 0.85, 0.06, wc], [-0.2, 1.22, 0.12, 0.13, 0.13, 0.05, wc], [0.2, 1.22, 0.12, 0.13, 0.13, 0.05, wc], [0, 1.36, 0.12, 0.13, 0.16, 0.05, '#dff2ff', true]]);
    } else if (id === 'x-arma-sello') {
      addPartBoxes(g, [[0, 0.9, 0.12, 0.34, 0.34, 0.08, wc], [0, 0.9, 0.17, 0.18, 0.18, 0.04, '#f5f7d9', true], [0, 1.22, 0.12, 0.08, 0.22, 0.05, CLEAN_COLOR.gold]]);
    } else if (id === 'x-arma-prisma') {
      addPartBoxes(g, [[0, 0.9, 0.12, 0.22, 0.55, 0.12, wc], [0, 1.2, 0.12, 0.34, 0.1, 0.14, '#f5f7d9', true], [0, 0.62, 0.12, 0.3, 0.06, 0.1, CLEAN_COLOR.gold]]);
    } else {
      addPartBoxes(g, [[0, 0.92, 0.12, 0.44, 0.07, 0.1, wc], [-0.24, 0.92, 0.12, 0.07, 0.42, 0.08, wc], [0.24, 0.92, 0.12, 0.07, 0.42, 0.08, wc], [0, 1.18, 0.12, 0.1, 0.1, 0.1, CLEAN_COLOR.gold, true]]);
    }
    addAnim(g.userData.anim = [], { type: 'weapon-motes', color: wc, count: n });
    return g;
  }
  if (id === 'c-efecto-aura' || id === 'x-aura-amanecer') {
    var aura = makeGlowSprite(colorHex, id === 'x-aura-amanecer' ? 2.8 : 2.2, 0.2);
    aura.position.y = 1.1;
    aura.renderOrder = 1;
    g.add(aura);
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.018, 4, 28), new THREE.MeshBasicMaterial({ color: color(colorHex), transparent: true, opacity: 0.38, depthWrite: false }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.04;
    ring.renderOrder = 1;
    g.add(ring);
    addAnim(g.userData.anim = [], { type: 'aura', color: colorHex, ring: ring, baseY: 1.1 });
  } else if (id === 'c-efecto-chispas') {
    var count = qCount(8);
    for (var i = 0; i < count; i++) {
      var sp = makeGlowSprite(colorHex, 0.17, 0.7);
      sp.position.set((Math.random() - 0.5) * 1.3, 0.5 + Math.random() * 1.8, (Math.random() - 0.5) * 0.8);
      g.add(sp);
    }
    addAnim(g.userData.anim = [], { type: 'sparks', color: colorHex, count: count });
  } else if (id === 'c-efecto-bruma') {
    var mistCount = qCount(7);
    for (var mi = 0; mi < mistCount; mi++) {
      var mist = new THREE.Sprite(new THREE.SpriteMaterial({ map: SOFT_GLOW, color: color(colorHex), transparent: true, opacity: 0.12, depthWrite: false }));
      mist.scale.set(1.6 + (mi % 2) * 0.5, 0.7, 1);
      mist.position.set(-1.0 + (mi % 4) * 0.65, 0.15 + Math.floor(mi / 4) * 0.1, -0.2 + (mi % 3) * 0.25);
      /* Orden fijo: la bruma usa blending normal y el orden por distancia
         cambiaba con la cámara (parpadeo de transparencias). */
      mist.renderOrder = 10 + mi;
      g.add(mist);
    }
    addAnim(g.userData.anim = [], { type: 'mist', color: colorHex });
  } else if (id === 'c-efecto-constelacion') {
    var stars = qCount(9);
    for (var si = 0; si < stars; si++) {
      var star = makeGlowSprite(CLEAN_COLOR.gold, 0.42, 0.7);
      star.position.set((Math.random() - 0.5) * 1.9, 0.5 + Math.random() * 2.1, -0.1 + (Math.random() - 0.5) * 0.7);
      g.add(star);
    }
    // Estrellas sólidas, visibles también desde el retrato frontal.
    for (var sb = 0; sb < 9; sb++) {
      var sx = [-0.62, -0.34, 0.0, 0.35, 0.64, -0.48, 0.44, -0.18, 0.2][sb];
      var sy = [1.8, 2.2, 1.55, 2.05, 1.35, 1.1, 1.95, 0.72, 2.3][sb];
      addPartBoxes(g, [[sx, sy, 0.16 + (sb % 3) * 0.04, 0.07, 0.07, 0.07, CLEAN_COLOR.gold, true]]);
    }
    addAnim(g.userData.anim = [], { type: 'constellation', color: CLEAN_COLOR.gold, count: stars });
  }
  return g;
}
function buildFramePiece(c, qf, avatar) {
  var g = new THREE.Group();
  var id = c.id;
  var colorHex = id === 'c-marco-bronce' ? '#b9874f' : id === 'c-marco-platino' ? '#d9e2ef' : id === 'c-marco-vacio' ? '#a57ad8' : '#e4c07a';
  var w = 1.38, h = 2.55, t = 0.065;
  var mat = new THREE.MeshBasicMaterial({ color: color(colorHex), transparent: true, opacity: 0.48, depthWrite: false, blending: THREE.AdditiveBlending });
  var frame = new THREE.Group();
  var top = new THREE.Mesh(new THREE.BoxGeometry(w, t, t), mat);
  top.position.y = h / 2;
  var bottom = top.clone(); bottom.position.y = -h / 2;
  var left = new THREE.Mesh(new THREE.BoxGeometry(t, h, t), mat); left.position.x = -w / 2;
  var right = left.clone(); right.position.x = w / 2;
  top.renderOrder = 1; bottom.renderOrder = 1; left.renderOrder = 1; right.renderOrder = 1;
  frame.add(top, bottom, left, right);
  frame.position.set(0, 1.35, -0.68);
  g.add(frame);
  var glow = makeGlowSprite(colorHex, 2.6, 0.13);
  glow.position.set(0, 1.35, -0.72);
  glow.renderOrder = 2;
  g.add(glow);
  if (id === 'c-marco-bronce') {
    addPartBoxes(g, [
      [-0.69, 2.63, 0, 0.17, 0.17, 0.12, '#d8a25c', true],
      [0.69, 2.63, 0, 0.17, 0.17, 0.12, '#d8a25c', true],
      [-0.69, 0.07, 0, 0.17, 0.17, 0.12, '#d8a25c', true],
      [0.69, 0.07, 0, 0.17, 0.17, 0.12, '#d8a25c', true],
      [0, 2.78, 0, 0.28, 0.12, 0.1, CLEAN_COLOR.gold, true]
    ]);
  } else if (id === 'c-marco-platino') {
    addPartBoxes(g, [
      [-0.56, 1.35, 0, 0.035, 2.28, 0.035, '#f2f7ff', true],
      [0.56, 1.35, 0, 0.035, 2.28, 0.035, '#f2f7ff', true],
      [0, 2.49, 0, 1.15, 0.035, 0.035, '#f2f7ff', true],
      [0, 0.21, 0, 1.15, 0.035, 0.035, '#f2f7ff', true],
      [0, 2.66, 0, 0.18, 0.22, 0.08, '#dfe9ff', true]
    ]);
  }
  if (id === 'c-marco-constelacion') {
    for (var i = 0; i < qCount(6); i++) {
      var st = makeGlowSprite(CLEAN_COLOR.gold, 0.24, 0.65);
      st.position.set((Math.random() - 0.5) * 1.7, 0.2 + Math.random() * 2.3, -0.62);
      st.renderOrder = 2;
      g.add(st);
    }
  } else if (id === 'c-marco-vacio') {
    var voidGlow = makeGlowSprite(CLEAN_COLOR.violet, 3.0, 0.16);
    voidGlow.position.set(0, 1.4, -0.7);
    voidGlow.renderOrder = 2;
    g.add(voidGlow);
  }
  addAnim(g.userData.anim = [], { type: 'frame', baseY: 1.35, color: colorHex });
  return g;
}
function buildPetPiece(c, qf, avatar) {
  var g = new THREE.Group();
  var id = c.id;
  var stage = cosmeticStage(c);
  var petColor = id === 'x-luciernaga-observatorio' ? CLEAN_COLOR.teal : id === 'x-buho-cometa' ? '#6b8fc9' : '#b56a42';
  g.position.set(-0.64, 1.4, 0.12);
  if (id === 'x-luciernaga-observatorio') {
    g.scale.setScalar(1.15);
    var size = 0.16 + stage * 0.05;
    addPartBoxes(g, [
      [0, 0, 0, size, size * 1.2, size, '#21362f'],
      [0, 0.02, 0.05, size * 0.6, size * 0.6, 0.04, CLEAN_COLOR.teal, true],
      [-size, 0.04, 0, size, 0.05, 0.16, '#d9fff7'],
      [size, 0.04, 0, size, 0.05, 0.16, '#d9fff7']
    ]);
    if (stage >= 2) addPartBoxes(g, [[0, -0.18, 0, 0.1, 0.1, 0.1, CLEAN_COLOR.gold, true]]);
    if (stage >= 3) {
      var halo = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.012, 4, 20), new THREE.MeshBasicMaterial({ color: color(CLEAN_COLOR.gold), transparent: true, opacity: 0.7, depthWrite: false }));
      halo.rotation.x = Math.PI / 2; halo.position.y = 0.18; halo.renderOrder = 2; g.add(halo);
    }
    addAnim(g.userData.anim = [], { type: 'pet', baseY: 1.4, baseX: -0.64, baseZ: 0.12, phase: 0.2, orbit: 0.2, speed: 0.7, glowColor: petColor });
  } else if (id === 'x-buho-cometa') {
    var scale = 1 + (stage - 1) * 0.12;
    addPartBoxes(g, [
      [-0.13, 0, 0, 0.26, 0.3, 0.22, '#364b6c'],
      [0, 0.1, 0.02, 0.34, 0.3, 0.27, '#587cad'],
      [-0.13, 0.3, 0, 0.1, 0.08, 0.1, '#2a3a53'],
      [0.13, 0.3, 0, 0.1, 0.08, 0.1, '#2a3a53'],
      [-0.09, 0.16, 0.26, 0.04, 0.04, 0.02, '#fff5d0', true],
      [0.09, 0.16, 0.26, 0.04, 0.04, 0.02, '#fff5d0', true],
      [-0.23, 0.0, 0, 0.1, 0.26, 0.18, '#455e83'],
      [0.23, 0.0, 0, 0.1, 0.26, 0.18, '#455e83']
    ]);
    g.scale.setScalar(scale * 1.24);
    addAnim(g.userData.anim = [], { type: 'pet', baseY: 1.42, baseX: -0.62, baseZ: 0.16, phase: 1.4, orbit: 0.23, speed: 0.55, glowColor: petColor });
  } else if (id === 'x-zorro-tinta') {
    addPartBoxes(g, [
      [-0.14, 0, 0, 0.3, 0.24, 0.24, '#3a3148'],
      [0, 0.15, 0.02, 0.34, 0.28, 0.28, '#4a3d5c'],
      [-0.12, 0.34, 0, 0.1, 0.18, 0.1, '#2a2335'],
      [0.12, 0.34, 0, 0.1, 0.18, 0.1, '#2a2335'],
      [-0.06, 0.22, 0.17, 0.045, 0.045, 0.02, '#e8d9b0', true],
      [0.06, 0.22, 0.17, 0.045, 0.045, 0.02, '#e8d9b0', true],
      [-0.28, 0.02, -0.05, 0.18, 0.14, 0.38, '#4a3d5c'],
      [0.02, 0.05, -0.26, 0.13, 0.1, 0.34, '#3a3148'],
      [0, 0.08, -0.44, 0.22, 0.06, 0.14, '#d8c7a0']
    ]);
    if (stage >= 2) addPartBoxes(g, [[0, 0.1, 0.15, 0.24, 0.06, 0.05, CLEAN_COLOR.violet, true]]);
    if (stage >= 3) addPartBoxes(g, [[-0.14, 0.22, 0.19, 0.06, 0.14, 0.04, CLEAN_COLOR.gold, true]]);
    g.scale.setScalar(1.16);
    addAnim(g.userData.anim = [], { type: 'pet', baseY: 1.4, baseX: -0.62, baseZ: 0.14, phase: 2.2, orbit: 0.27, speed: 0.5, glowColor: '#8f7ad8' });
  } else {
    addPartBoxes(g, [
      [-0.12, 0, 0, 0.28, 0.22, 0.22, '#8b4f36'],
      [0, 0.13, 0.02, 0.32, 0.27, 0.26, '#b56a42'],
      [-0.12, 0.31, 0, 0.09, 0.15, 0.09, '#6a3828'],
      [0.12, 0.31, 0, 0.09, 0.15, 0.09, '#6a3828'],
      [-0.06, 0.2, 0.15, 0.04, 0.04, 0.02, '#f1d995', true],
      [0.06, 0.2, 0.15, 0.04, 0.04, 0.02, '#f1d995', true],
      [-0.26, 0.0, -0.04, 0.16, 0.12, 0.34, '#7d452f'],
      [0.04, 0.02, -0.22, 0.11, 0.09, 0.3, '#b56a42']
    ]);
    if (stage >= 2) addPartBoxes(g, [[0, 0.05, 0.15, 0.22, 0.06, 0.05, CLEAN_COLOR.gold]]);
    if (stage >= 3) addPartBoxes(g, [[-0.13, 0.2, 0.18, 0.06, 0.13, 0.04, CLEAN_COLOR.rose, true]]);
    g.scale.setScalar(1.18);
    addAnim(g.userData.anim = [], { type: 'pet', baseY: 1.4, baseX: -0.62, baseZ: 0.14, phase: 2.2, orbit: 0.27, speed: 0.5, glowColor: petColor });
  }
  return g;
}
function buildTrailPiece(c, qf, avatar) {
  var g = new THREE.Group();
  g.position.set(0, 0.3, 0);
  var stage = cosmeticStage(c);
  var count = qCount(5 + stage * 2);
  var colorHex = stage >= 3 ? CLEAN_COLOR.gold : stage >= 2 ? CLEAN_COLOR.violet : CLEAN_COLOR.teal;
  for (var i = 0; i < count; i++) {
    var sp = makeGlowSprite(colorHex, 0.34 + (i % 3) * 0.08, 0.55);
    sp.position.set(-0.38 + (i % 4) * 0.24, 0.06 + (i % 2) * 0.08, 0.12 - i * 0.07);
    g.add(sp);
  }
  // Arco de luz delante y a los lados: la estela se lee también de frente.
  addPartBoxes(g, [
    [-0.56, 0.08, 0.18, 0.16, 0.035, 0.08, colorHex, true],
    [-0.34, 0.14, 0.25, 0.14, 0.035, 0.08, colorHex, true],
    [0.34, 0.14, 0.25, 0.14, 0.035, 0.08, colorHex, true],
    [0.56, 0.08, 0.18, 0.16, 0.035, 0.08, colorHex, true]
  ]);
  var ribbon = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.018, 4, 30), new THREE.MeshBasicMaterial({ color: color(colorHex), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  ribbon.rotation.x = Math.PI / 2;
  ribbon.position.set(0, 0.04, 0.1);
  ribbon.renderOrder = 2;
  g.add(ribbon);
  addAnim(g.userData.anim = [], { type: 'trail', color: colorHex, stage: stage, ribbon: ribbon });
  return g;
}

/* -------------------------------------------------------------------------
   Acople al héroe, conflictos y limpieza
   ------------------------------------------------------------------------- */
function chooseAnchorForCosmetic(c, avatar) {
  if (c.category === 'cabeza' || c.category === 'peinado') return avatar.head;
  if (c.category === 'torso') return avatar.torso;
  if (c.category === 'amuletos') return avatar.torso;
  if (c.category === 'accesorios') {
    if (c.id === 'c-accesorios-gafas') return avatar.head;
    if (c.id === 'c-accesorios-brujula') return avatar.leftArm;
    return avatar.body;
  }
  if (c.category === 'extras') return avatar.body;
  if (c.category === 'efectos') {
    if (c.id.indexOf('x-arma-') === 0) return avatar.weapon;
    return avatar.root;
  }
  if (c.category === 'marcos') return avatar.root;
  if (c.category === 'mascota') return avatar.root;
  if (c.category === 'estela') return avatar.root;
  return avatar.body;
}
function addPieceGroup(avatar, parent, group, c, animList, slot) {
  parent.add(group);
  applyCosmeticLayering(group, slot);
  group.name = 'cosmetic-' + slot + '-' + c.id;
  avatar.cosmetics.groups.push(group);
  group.userData.cosmeticId = c.id;
  group.userData.slot = slot;
  /* Recoge animaciones del grupo y de sus hijos: las piezas nuevas pueden
     animar aspas, alas u hojas por separado. */
  group.traverse(function (node) {
    if (!node.userData || !node.userData.anim) return;
    node.userData.anim.forEach(function (spec) {
      if (!spec.group) spec.group = node;
      animList.push(spec);
    });
  });
  return group;
}
function clearAvatarCosmetics(avatar) {
  if (!avatar) return;
  if (avatar.cosmetics && avatar.cosmetics.groups) {
    var disposedMaterials = [];
    avatar.cosmetics.groups.forEach(function (group) {
      if (group.parent) group.parent.remove(group);
      group.traverse(function (node) {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
          if (disposedMaterials.indexOf(node.material) === -1) {
            disposedMaterials.push(node.material);
            node.material.dispose();
          }
        }
      });
    });
  }
  avatar.cosmetics = { groups: [], animated: [], slots: {}, title: null, frame: null };
  var parts = cosmeticBaseParts(avatar);
  setBaseGroupsVisible(parts.baseHatGroups, true);
  setBaseGroupsVisible(parts.baseHairGroups, true);
  if (avatar.hairTail) avatar.hairTail.visible = true;
  if (avatar.cape) avatar.cape.visible = true;
}
function applyOutfitToAvatar(avatar, characterId, outfitOverride) {
  if (!avatar) return;
  clearAvatarCosmetics(avatar);
  var outfit = outfitOverride !== undefined ? (outfitOverride || {}) : getCharacterOutfit(characterId);
  var parts = cosmeticBaseParts(avatar);
  var hasHeadOrHair = !!(outfit.cabeza || outfit.peinado);
  /* Un tocado o un peinado sustituyen el sombrero base. */
  if (hasHeadOrHair) setBaseGroupsVisible(parts.baseHatGroups, false);
  /* Un peinado sustituye TODO el pelo base (antes solo se ocultaba la cola). */
  if (outfit.peinado) {
    setBaseGroupsVisible(parts.baseHairGroups, false);
    if (avatar.hairTail) avatar.hairTail.visible = false;
  } else if (outfit.cabeza && HEAD_COSMETIC_HIDES_HAIR[outfit.cabeza]) {
    setBaseGroupsVisible(parts.baseHairGroups, false);
  }
  var animated = [];
  var qf = effectQualityFactor();
  COSMETIC_SLOT_ORDER.forEach(function (slot) {
    var id = outfit[slot];
    if (!id) return;
    var c = COSMETIC_BY_ID[id];
    if (!c) return;
    var stage = cosmeticStage(c);
    var group = null;
    var customBuilder = (window.V23C && V23C.pieces && slot !== 'piernas') ? V23C.pieces[id] : null;
    if (customBuilder) {
      group = customBuilder(c, qf, avatar, slot);
    } else if (slot === 'cabeza') group = buildHeadPiece(c, qf);
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
    if (group) {
      if (slot === 'marcos') avatar.cosmetics.frame = group;
      var parent = chooseAnchorForCosmetic(c, avatar);
      if (slot === 'extras') parent = avatar.body;
      addPieceGroup(avatar, parent, group, c, animated, slot);
      /* La prenda que cubre la espalda oculta la capa nativa del héroe. */
      if (slot === 'torso' && group.userData.coversBack && avatar.cape) avatar.cape.visible = false;
      avatar.cosmetics.slots[slot] = c.id;
    }
  });
  var pants = outfit.piernas ? COSMETIC_BY_ID[outfit.piernas] : null;
  if (pants) {
    var customPants = (window.V23C && V23C.pieces) ? V23C.pieces[pants.id] : null;
    var pieces = customPants ? customPants(pants, qf, avatar, 'piernas') : buildLegPair(pants, qf, avatar);
    if (Array.isArray(pieces)) {
      pieces.forEach(function (p) {
        addPieceGroup(avatar, p.parent, p.group, pants, animated, 'piernas');
      });
      avatar.cosmetics.slots.piernas = pants.id;
    }
  }
  avatar.cosmetics.animated = animated;
  if (outfit.titulo) avatar.cosmetics.title = outfit.titulo;
}
function buildWristCompass(c, qf) {
  var g = new THREE.Group();
  addPartBoxes(g, [
    [0, -0.58, 0.05, 0.3, 0.08, 0.28, '#574631'],
    [0.01, -0.56, 0.2, 0.16, 0.2, 0.04, CLEAN_COLOR.gold],
    [0.01, -0.56, 0.23, 0.1, 0.1, 0.02, '#d9fbff', true],
    [0, -0.56, 0.24, 0.02, 0.13, 0.012, CLEAN_COLOR.rose, true]
  ]);
  decorateRarity(g, c, 0.1);
  return g;
}
function animateAvatarCosmetics(av, dt, time, running, speedNorm) {
  if (!av || !av.cosmetics) return;
  /* Reducir movimiento congela también los adornos 3D: no es solo CSS. */
  try {
    if (state && state.settings && state.settings.reducedMotion) { dt = 0; time = 0; }
  } catch (e) {}
  try { if (window.V23C && V23C.update) V23C.update(av, dt, time, running, speedNorm); } catch (e) {}
  var qf = effectQualityFactor();
  av.cosmetics.animated.forEach(function (a) {
    var g = a.group;
    if (!g) return;
    if (a.type === 'orbit-stars' || a.type === 'stars' || a.type === 'constellation') {
      g.rotation.y = time * 0.25;
      g.position.y = Math.sin(time * 1.4 + (a.phase || 0)) * 0.03;
    } else if (a.type === 'aura') {
      if (a.ring) a.ring.scale.setScalar(1 + Math.sin(time * 1.4) * 0.08);
      g.position.y = Math.sin(time * 0.8) * 0.02;
    } else if (a.type === 'sparks' || a.type === 'mist') {
      g.rotation.y = time * (a.type === 'sparks' ? 0.4 : 0.12);
    } else if (a.type === 'float') {
      g.position.y = (a.baseY || g.position.y) + Math.sin(time * 1.2 + a.phase) * (a.amplitude || 0.1);
      if (a.rotate) g.rotation.y += dt * a.rotate;
    } else if (a.type === 'orbit') {
      var radius = a.radius || 0.5;
      var baseY = a.baseY || 1.5;
      g.position.set(-0.45 + Math.cos(time * (a.speed || 0.45) + (a.phase || 0)) * radius, baseY + Math.sin(time * 1.3 + a.phase) * 0.07, -0.2 + Math.sin(time * (a.speed || 0.45) + (a.phase || 0)) * radius * 0.4);
    } else if (a.type === 'hair-tail') {
      g.rotation.x = -0.05 - (running ? speedNorm * 0.12 : 0) + Math.sin(time * 2.2 + a.phase) * 0.05;
      g.rotation.z = Math.sin(time * 1.6 + a.phase) * 0.035;
    } else if (a.type === 'cloth') {
      g.rotation.x = Math.sin(time * 1.4 + a.phase) * 0.025 - (running ? 0.04 : 0);
    } else if (a.type === 'runes') {
      g.rotation.y = time * 0.12;
    } else if (a.type === 'frame') {
      g.position.y = (a.baseY || 1.35) + Math.sin(time * 0.8) * 0.02;
      g.rotation.y = Math.sin(time * 0.35) * 0.08;
    } else if (a.type === 'pet') {
      var baseY = a.baseY || 1.35;
      var baseX = a.baseX == null ? -0.72 : a.baseX;
      var baseZ = a.baseZ == null ? 0.08 : a.baseZ;
      var orbit = a.orbit || 0.2;
      g.position.set(baseX + Math.cos(time * (a.speed || 0.6) + (a.phase || 0)) * orbit, baseY + Math.sin(time * 2 + a.phase) * 0.12, baseZ + Math.sin(time * (a.speed || 0.6) + (a.phase || 0)) * orbit * 0.45);
      g.rotation.y = Math.cos(time * 0.8 + a.phase) * 0.2;
      g.rotation.z = Math.sin(time * 2.2 + a.phase) * 0.04;
    } else if (a.type === 'weapon-motes') {
      g.rotation.y = time * 0.9;
    } else if (a.type === 'trail') {
      g.rotation.y = Math.sin(time * 0.5) * 0.05;
      g.position.y = 0.28 + Math.sin(time * 1.5) * 0.025;
      if (a.ribbon) a.ribbon.rotation.z = time * 0.25;
    }
  });
}

/* -------------------------------------------------------------------------
   Utilidades de marcos 2D y títulos
   ------------------------------------------------------------------------- */
function equippedFrameFor(characterId) {
  var outfit = getCharacterOutfit(characterId);
  return outfit.marcos ? COSMETIC_BY_ID[outfit.marcos] : null;
}
function frameColorFor(characterId) {
  var c = equippedFrameFor(characterId);
  if (!c) return '';
  if (c.id === 'c-marco-bronce') return '#b9874f';
  if (c.id === 'c-marco-platino') return '#d9e2ef';
  if (c.id === 'c-marco-vacio') return '#c49bff';
  return '#e4c07a';
}
