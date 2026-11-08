/* =========================================================================
   SERUMS QUEST · V2 · PARTE 5 — COMBATE Y EFECTOS (Agente 1)
   Enriquece el duelo de los 5 guardianes y los 10 héroes con luz, escudos y
   partículas. No cambia reglas, daño, XP, monedas ni el guardado.

   API pública (se registra al final del archivo):
     V2.combat = { update, onDuelStart, onDuelEnd, heroAttack, guardianAttack,
                   onHeartsChanged, onSessionEnd, reset }

   Presupuesto: 18 / 40 / 80 partículas simultáneas (bajo / medio / alto).
   Sin allocations por frame; geometrías y materiales reutilizados.
   Todo el CSS es inline y creado por JS (#v2-damage-layer).
   ========================================================================= */

/* Estilo del guardián por área y golpe temático del guardián. */
var V2C_AREA_STYLE = {
  'area-psi-salud-publica': 'territorio',
  'area-psi-cuidado-integral': 'cuidado',
  'area-psi-etica': 'confianza',
  'area-psi-investigacion': 'evidencia',
  'area-psi-gestion': 'sistema'
};
var V2C_AREA_STRIKE = {
  territorio: 'roots',
  cuidado: 'pulse',
  confianza: 'reflect',
  evidencia: 'rays',
  sistema: 'gears'
};
var V2C_STRIKE_LABEL = {
  roots: 'raíces',
  pulse: 'pulso de luz',
  reflect: 'reflejos',
  rays: 'rayos del prisma',
  gears: 'engranajes'
};

/* Estilo de ataque por héroe: sabor visual, arma narrada y color. */
var V2C_HERO_STYLE = {
  ilan: { flavor: 'stars', label: 'constelación', accent: '#7AA2FF', shake: 0.1, ring: 2.1 },
  mara: { flavor: 'mapRing', label: 'mapa', accent: '#69D3C1', shake: 0.1, ring: 2.3 },
  noa: { flavor: 'prism', label: 'prisma', accent: '#8DB7FF', shake: 0.09, ring: 2.0 },
  teo: { flavor: 'echo', label: 'ecos', accent: '#C49BFF', shake: 0.08, ring: 2.0 },
  lia: { flavor: 'timewave', label: 'onda temporal', accent: '#F3B562', shake: 0.1, ring: 2.2 },
  kian: { flavor: 'shock', label: 'onda de choque', accent: '#AEB6C8', shake: 0.13, ring: 2.8 },
  amaru: { flavor: 'lantern', label: 'haz', accent: '#69D3C1', shake: 0.09, ring: 2.1 },
  ona: { flavor: 'blueprint', label: 'geometría', accent: '#7AA2FF', shake: 0.09, ring: 2.2 },
  iris: { flavor: 'aura', label: 'aura', accent: '#C49BFF', shake: 0.07, ring: 2.4 },
  zenon: { flavor: 'pages', label: 'páginas', accent: '#E4C07A', shake: 0.09, ring: 2.1 }
};

var V2C_RGB_CACHE = {};
var V2C_UP = null;

/* Estado interno del módulo. */
var v2c = {
  ready: false,
  active: false,
  areaId: '',
  styleId: 'territorio',
  accent: '#7aa2ff',
  phase: 0,
  maxHearts: 3,
  lastHearts: 3,
  quality: 'medio',
  reduced: false,
  particleCap: 40,
  shapeCap: 2,
  ambient: true,
  budgetT: 0,
  emberT: 0,
  pool: null,
  geo: null,
  particles: null,
  style: null,
  layer: null,
  numbers: null,
  finish: null,
  glyphTex: {},
  tmp: null
};

/* -------------------------------------------------------------------------
   Utilidades defensivas
   ------------------------------------------------------------------------- */
function v2cClamp(value, min, max) {
  var n = Number(value);
  if (!isFinite(n)) n = min;
  return Math.max(min, Math.min(max, n));
}
function v2cEsc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
function v2cError(error) {
  try {
    if (typeof V2 !== 'undefined' && V2 && V2.softError) V2.softError('combat', error);
    else if (window.console && console.warn) console.warn('[V2 combat]', error);
  } catch (ignore) {}
}
function v2cSupported() {
  return !!(window.THREE && window.THREE.Group && typeof scene !== 'undefined' && scene &&
    typeof camera !== 'undefined' && camera && typeof arenaGroup !== 'undefined' && arenaGroup &&
    typeof duelPositions !== 'undefined' && duelPositions);
}
function v2cThreeColor(hex) {
  try {
    if (typeof color === 'function') return color(hex);
  } catch (e) {}
  return new THREE.Color(hex);
}
function v2cRGB(hex) {
  var key = String(hex || '#ffffff').toLowerCase();
  var cached = V2C_RGB_CACHE[key];
  if (cached) return cached;
  var n = parseInt(key.replace('#', ''), 16);
  if (!isFinite(n)) n = 0xffffff;
  cached = { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
  V2C_RGB_CACHE[key] = cached;
  return cached;
}
function v2cEmitEvent(type, extra) {
  try {
    if (typeof V2 === 'undefined' || !V2 || !V2.emit) return;
    var payload = { type: type, areaId: v2c.areaId, at: Date.now() };
    if (extra) {
      for (var key in extra) {
        if (extra.hasOwnProperty(key)) payload[key] = extra[key];
      }
    }
    V2.emit('combat', payload);
  } catch (e) {}
}

/* -------------------------------------------------------------------------
   Presupuesto y calidad
   ------------------------------------------------------------------------- */
function v2cRefreshBudget(force) {
  var q = 'medio';
  var reduced = false;
  try { if (typeof V2 !== 'undefined' && V2 && V2.quality) q = V2.quality(); } catch (e) {}
  try { if (typeof V2 !== 'undefined' && V2 && V2.reducedMotion) reduced = !!V2.reducedMotion(); } catch (e) {}
  if (q !== 'bajo' && q !== 'alto') q = 'medio';
  if (!force && q === v2c.quality && reduced === v2c.reduced) return;
  var oldCap = v2c.particleCap;
  v2c.quality = q;
  v2c.reduced = reduced;
  if (q === 'bajo') {
    v2c.particleCap = 18;
    v2c.shapeCap = 1;
    v2c.ambient = false;
  } else if (q === 'alto') {
    v2c.particleCap = 80;
    v2c.shapeCap = 3;
    v2c.ambient = !reduced;
  } else {
    v2c.particleCap = 40;
    v2c.shapeCap = 2;
    v2c.ambient = !reduced;
  }
  if (oldCap !== v2c.particleCap && v2c.particles) v2cTrimParticles();
  if (v2c.layer) {
    v2c.layer.setAttribute('data-v2-quality', v2c.quality);
    v2c.layer.setAttribute('data-v2-particles', String(v2c.particleCap));
  }
}

/* -------------------------------------------------------------------------
   Inicialización perezosa (THREE, vectores temporales, pool y partículas)
   ------------------------------------------------------------------------- */
function v2cEnsureTmp() {
  if (v2c.tmp) return true;
  if (!v2cSupported()) return false;
  var THREE = window.THREE;
  V2C_UP = new THREE.Vector3(0, 1, 0);
  v2c.tmp = {
    v1: new THREE.Vector3(),
    v2: new THREE.Vector3(),
    v3: new THREE.Vector3(),
    dir: new THREE.Vector3(),
    proj: new THREE.Vector3(),
    dummy: new THREE.Object3D(),
    warn: new THREE.Color('#ff8b9d'),
    scr: { x: 0, y: 0, ok: false }
  };
  return true;
}

function v2cInit() {
  if (v2c.ready) return true;
  if (!v2cSupported()) return false;
  if (!v2cEnsureTmp()) return false;
  if (!v2cEnsurePool()) return false;
  v2cEnsureParticles();
  v2c.ready = true;
  v2cRefreshBudget(true);
  return true;
}

/* -------------------------------------------------------------------------
   Partículas: un único THREE.Points (1 draw call) con tope por calidad.
   ------------------------------------------------------------------------- */
function v2cEnsureParticles() {
  if (v2c.particles || !v2cSupported()) return;
  try {
    var THREE = window.THREE;
    var max = 80;
    var p = {
      max: max,
      head: 0,
      active: 0,
      dirty: false,
      pos: new Float32Array(max * 3),
      col: new Float32Array(max * 3),
      vx: new Float32Array(max),
      vy: new Float32Array(max),
      vz: new Float32Array(max),
      life: new Float32Array(max),
      maxLife: new Float32Array(max),
      r: new Float32Array(max),
      g: new Float32Array(max),
      b: new Float32Array(max)
    };
    for (var i = 0; i < max; i++) p.pos[i * 3 + 1] = -50;
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(p.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(p.col, 3));
    var matOpts = {
      size: 0.26,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      vertexColors: true,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      fog: false
    };
    if (typeof GLOW_TEX !== 'undefined' && GLOW_TEX) matOpts.map = GLOW_TEX;
    var material = new THREE.PointsMaterial(matOpts);
    var points = new THREE.Points(geo, material);
    points.frustumCulled = false;
    points.visible = false;
    scene.add(points);
    p.points = points;
    p.geo = geo;
    p.material = material;
    v2c.particles = p;
  } catch (e) {
    v2cError(e);
    v2c.particles = null;
  }
}

function v2cEmit(x, y, z, count, hex, spread, rise, lifeBase, lifeVar) {
  var p = v2c.particles;
  if (!p || count <= 0) return;
  var cap = Math.min(v2c.particleCap, p.max);
  if (cap <= 0) return;
  var rgb = v2cRGB(hex);
  var glow = v2c.quality === 'bajo' ? 0.55 : (v2c.quality === 'alto' ? 1 : 0.8);
  for (var i = 0; i < count; i++) {
    var idx = p.head % cap;
    p.head = (p.head + 1) % cap;
    var j = idx * 3;
    p.pos[j] = x + (Math.random() - 0.5) * spread;
    p.pos[j + 1] = y + (Math.random() - 0.5) * spread * 0.65;
    p.pos[j + 2] = z + (Math.random() - 0.5) * spread;
    p.vx[idx] = (Math.random() - 0.5) * 1.7;
    p.vy[idx] = rise * (0.35 + Math.random() * 0.95);
    p.vz[idx] = (Math.random() - 0.5) * 1.7;
    p.life[idx] = lifeBase + Math.random() * lifeVar;
    p.maxLife[idx] = p.life[idx];
    p.r[idx] = rgb.r * glow;
    p.g[idx] = rgb.g * glow;
    p.b[idx] = rgb.b * glow;
  }
  p.dirty = true;
  p.points.visible = true;
}

function v2cBurst(x, y, z, size, hex, rises) {
  var count = v2c.quality === 'alto' ? size : (v2c.quality === 'medio' ? Math.max(3, Math.round(size * 0.6)) : Math.max(2, Math.round(size * 0.3)));
  v2cEmit(x, y, z, count, hex, 0.85, rises == null ? 1.4 : rises, 0.5, 0.65);
}

function v2cUpdateParticles(dt) {
  var p = v2c.particles;
  if (!p) return;
  var cap = Math.min(v2c.particleCap, p.max);
  var active = 0;
  var i, j;
  for (i = 0; i < cap; i++) {
    j = i * 3;
    if (p.life[i] <= 0) {
      if (p.col[j] !== 0 || p.col[j + 1] !== 0 || p.col[j + 2] !== 0) {
        p.col[j] = 0; p.col[j + 1] = 0; p.col[j + 2] = 0;
        p.pos[j] = 0; p.pos[j + 1] = -50; p.pos[j + 2] = 0;
        p.dirty = true;
      }
      continue;
    }
    p.life[i] -= dt;
    if (p.life[i] <= 0) {
      p.col[j] = 0; p.col[j + 1] = 0; p.col[j + 2] = 0;
      p.pos[j] = 0; p.pos[j + 1] = -50; p.pos[j + 2] = 0;
      p.dirty = true;
      continue;
    }
    p.vy[i] -= 1.1 * dt;
    p.pos[j] += p.vx[i] * dt;
    p.pos[j + 1] += p.vy[i] * dt;
    p.pos[j + 2] += p.vz[i] * dt;
    var a = p.life[i] / p.maxLife[i];
    var fade = a < 0.55 ? a / 0.55 : 1;
    p.col[j] = p.r[i] * fade;
    p.col[j + 1] = p.g[i] * fade;
    p.col[j + 2] = p.b[i] * fade;
    active++;
  }
  p.active = active;
  p.points.visible = active > 0;
  if (active > 0 || p.dirty) {
    p.geo.attributes.position.needsUpdate = true;
    p.geo.attributes.color.needsUpdate = true;
  }
  p.dirty = false;
}

function v2cTrimParticles() {
  var p = v2c.particles;
  if (!p) return;
  var cap = Math.min(v2c.particleCap, p.max);
  for (var i = cap; i < p.max; i++) {
    var j = i * 3;
    p.life[i] = 0;
    p.pos[j] = 0; p.pos[j + 1] = -50; p.pos[j + 2] = 0;
    p.col[j] = 0; p.col[j + 1] = 0; p.col[j + 2] = 0;
  }
  p.head = p.head % Math.max(1, cap);
  p.dirty = true;
}

function v2cStopParticles() {
  var p = v2c.particles;
  if (!p) return;
  for (var i = 0; i < p.max; i++) {
    var j = i * 3;
    p.life[i] = 0;
    p.pos[j] = 0; p.pos[j + 1] = -50; p.pos[j + 2] = 0;
    p.col[j] = 0; p.col[j + 1] = 0; p.col[j + 2] = 0;
  }
  p.head = 0;
  p.active = 0;
  p.dirty = false;
  p.points.visible = false;
  p.geo.attributes.position.needsUpdate = true;
  p.geo.attributes.color.needsUpdate = true;
}

function v2cDisposeParticles() {
  var p = v2c.particles;
  if (!p) return;
  v2c.particles = null;
  try {
    if (p.points && p.points.parent) p.points.parent.remove(p.points);
    if (p.geo) p.geo.dispose();
    if (p.material) p.material.dispose();
  } catch (e) {}
}

/* -------------------------------------------------------------------------
   Pool de efectos 3D: 4 kits con geometrías compartidas y materiales propios.
   ------------------------------------------------------------------------- */
function v2cNewGlow(hex, scale, opacity) {
  var sprite;
  if (typeof makeGlowSprite === 'function') {
    sprite = makeGlowSprite(hex, scale, opacity);
    if (sprite.material) sprite.material.userData.v2cBase = hex;
  } else {
    var material = new THREE.SpriteMaterial({
      transparent: true,
      opacity: opacity == null ? 0.6 : opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false
    });
    if (typeof GLOW_TEX !== 'undefined' && GLOW_TEX) material.map = GLOW_TEX;
    material.color.set(hex);
    material.userData.v2cBase = hex;
    sprite = new THREE.Sprite(material);
    sprite.scale.set(scale || 1, scale || 1, 1);
  }
  sprite.castShadow = false;
  return sprite;
}

function v2cMat(hex, opacity, additive) {
  return new THREE.MeshBasicMaterial({
    color: v2cThreeColor(hex),
    transparent: true,
    opacity: opacity == null ? 1 : opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
    blending: additive === false ? THREE.NormalBlending : THREE.AdditiveBlending
  });
}

function v2cEnsurePool() {
  if (v2c.pool) return true;
  if (!v2cSupported()) return false;
  try {
    var THREE = window.THREE;
    v2c.geo = {
      box: new THREE.BoxGeometry(1, 1, 1),
      octa: new THREE.OctahedronGeometry(0.24, 0),
      torus: new THREE.TorusGeometry(1, 0.03, 6, 40),
      ringSeg: new THREE.RingGeometry(0.66, 1.0, 24, 1, 0.12, 1.5),
      beam: new THREE.CylinderGeometry(0.05, 0.17, 1, 7, 1, true),
      quad: new THREE.PlaneGeometry(1, 1)
    };
    v2c.pool = [];
    for (var i = 0; i < 4; i++) v2c.pool.push(v2cMakeKit(i));
    return true;
  } catch (e) {
    v2cError(e);
    v2c.geo = null;
    v2c.pool = null;
    return false;
  }
}

function v2cMakeKit(index) {
  var geo = v2c.geo;
  var group = new THREE.Group();
  group.visible = false;
  var shapes = {
    glow: v2cNewGlow('#ffffff', 1.2, 0.85),
    core: new THREE.Mesh(geo.box, v2cMat('#ffffff', 0.95)),
    ringA: new THREE.Mesh(geo.torus, v2cMat('#ffffff', 0.6)),
    ringB: new THREE.Mesh(geo.torus, v2cMat('#ffffff', 0.6)),
    arc: new THREE.Mesh(geo.ringSeg, v2cMat('#ffffff', 0.7)),
    beam: new THREE.Mesh(geo.beam, v2cMat('#ffffff', 0.5)),
    shardA: new THREE.Mesh(geo.octa, v2cMat('#ffffff', 0.85)),
    shardB: new THREE.Mesh(geo.octa, v2cMat('#ffffff', 0.85)),
    quadA: new THREE.Mesh(geo.quad, v2cMat('#ffffff', 0.4)),
    quadB: new THREE.Mesh(geo.quad, v2cMat('#ffffff', 0.4))
  };
  shapes.ringA.rotation.x = Math.PI / 2;
  shapes.ringB.rotation.x = Math.PI / 2;
  var list = ['glow', 'core', 'ringA', 'ringB', 'arc', 'beam', 'shardA', 'shardB', 'quadA', 'quadB'];
  for (var i = 0; i < list.length; i++) {
    var shape = shapes[list[i]];
    if (shape.isMesh) {
      shape.castShadow = false;
      shape.receiveShadow = false;
      shape.renderOrder = 5;
    }
    shape.visible = false;
    group.add(shape);
  }
  return {
    index: index,
    active: false,
    kind: 'hero',
    flavor: 'stars',
    t: 0,
    charge: 0.14,
    flight: 0.34,
    telegraph: 0.4,
    strikeDelay: 0.18,
    after: 0.45,
    dur: 0.95,
    impacted: false,
    struck: false,
    xp: 0,
    heroId: '',
    numText: '',
    numSub: '',
    numColor: '#ffffff',
    ringScale: 2.1,
    beamThickness: 1,
    shake: 0.1,
    from: new THREE.Vector3(),
    to: new THREE.Vector3(),
    group: group,
    shapes: shapes,
    list: list,
    dir: new THREE.Vector3()
  };
}

function v2cHideShapes(kit) {
  for (var i = 0; i < kit.list.length; i++) kit.shapes[kit.list[i]].visible = false;
}

function v2cEndKit(kit) {
  if (!kit) return;
  kit.active = false;
  kit.impacted = false;
  kit.struck = false;
  kit.group.visible = false;
  v2cHideShapes(kit);
  if (kit.group.parent) kit.group.parent.remove(kit.group);
}

function v2cEndAllKits() {
  if (!v2c.pool) return;
  for (var i = 0; i < v2c.pool.length; i++) v2cEndKit(v2c.pool[i]);
}

function v2cDisposePool() {
  if (!v2c.pool) return;
  for (var i = 0; i < v2c.pool.length; i++) {
    var kit = v2c.pool[i];
    v2cEndKit(kit);
    kit.group.traverse(function (node) {
      if (node.isSprite) {
        if (node.material) node.material.dispose();
        return;
      }
      if (node.material && !Array.isArray(node.material)) node.material.dispose();
    });
  }
  v2c.pool = null;
  var geo = v2c.geo;
  if (geo) {
    if (geo.box) geo.box.dispose();
    if (geo.octa) geo.octa.dispose();
    if (geo.torus) geo.torus.dispose();
    if (geo.ringSeg) geo.ringSeg.dispose();
    if (geo.beam) geo.beam.dispose();
    if (geo.quad) geo.quad.dispose();
  }
  v2c.geo = null;
}

function v2cAcquireKit(kind, flavor, from, to, accent) {
  if (!v2c.pool) {
    if (!v2cEnsurePool()) return null;
  }
  var kit = null;
  var i;
  for (i = 0; i < v2c.pool.length; i++) {
    if (!v2c.pool[i].active) { kit = v2c.pool[i]; break; }
  }
  if (!kit) kit = v2c.pool[0];
  v2cBeginKit(kit, kind, flavor, from, to, accent);
  return kit;
}

function v2cBeginKit(kit, kind, flavor, from, to, accent) {
  v2cHideShapes(kit);
  kit.active = true;
  kit.kind = kind;
  kit.flavor = flavor;
  kit.t = 0;
  kit.charge = 0.14;
  kit.flight = v2c.reduced ? 0.02 : 0.34;
  kit.telegraph = v2c.reduced ? 0.34 : 0.4;
  kit.strikeDelay = v2c.reduced ? 0.06 : 0.18;
  kit.after = 0.45;
  kit.dur = 0.95;
  kit.impacted = false;
  kit.struck = false;
  kit.xp = 0;
  kit.heroId = '';
  kit.numText = '';
  kit.numSub = '';
  kit.numColor = accent;
  kit.accentHex = accent;
  kit.ringScale = 2.1;
  kit.beamThickness = 1;
  kit.shake = 0.1;
  kit.from.copy(from);
  kit.to.copy(to);
  kit.dist = Math.sqrt(
    (to.x - from.x) * (to.x - from.x) +
    (to.y - from.y) * (to.y - from.y) +
    (to.z - from.z) * (to.z - from.z)
  );
  kit.group.position.copy(from);
  kit.group.visible = true;
  if (kit.group.parent !== scene) scene.add(kit.group);
  var key;
  for (var i = 0; i < kit.list.length; i++) {
    key = kit.list[i];
    var mat = kit.shapes[key].material;
    if (mat && mat.color) mat.color.set(accent);
    if (mat) mat.opacity = 0.6;
  }
  if (kind === 'guardian') v2cSetupGuardianTelegraph(kit);
  else if (kind === 'burst') v2cSetupBurst(kit);
  else v2cSetupHeroCharge(kit);
}

/* Orientación del haz dentro del grupo (el grupo está en el origen del efecto). */
function v2cAimBeam(kit, mesh, thickness) {
  var dx = kit.to.x - kit.from.x;
  var dy = kit.to.y - kit.from.y;
  var dz = kit.to.z - kit.from.z;
  var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (len < 0.01) len = 0.01;
  kit.dir.set(dx / len, dy / len, dz / len);
  mesh.position.set(dx * 0.5, dy * 0.5, dz * 0.5);
  mesh.quaternion.setFromUnitVectors(V2C_UP, kit.dir);
  mesh.scale.set(thickness, len, thickness);
  return len;
}

/* -------------------------------------------------------------------------
   Animación de los kits
   ------------------------------------------------------------------------- */
function v2cUpdateKits(dt, time) {
  if (!v2c.pool) return;
  for (var i = 0; i < v2c.pool.length; i++) {
    var kit = v2c.pool[i];
    if (!kit.active) continue;
    kit.t += dt;
    if (kit.kind === 'hero') v2cStepHeroKit(kit, time);
    else if (kit.kind === 'guardian') v2cStepGuardianKit(kit, time);
    else v2cStepBurstKit(kit);
  }
}

function v2cSetupHeroCharge(kit) {
  var s = kit.shapes;
  s.glow.visible = true;
  s.glow.position.set(0, 0, 0);
  s.glow.scale.setScalar(0.9);
  s.glow.material.opacity = 0.7;
  s.core.visible = kit.flavor !== 'aura';
  s.core.position.set(0, 0, 0);
  s.core.scale.setScalar(0.22);
  s.core.material.opacity = 0.9;
  s.ringA.visible = false;
  s.ringB.visible = false;
  s.arc.visible = false;
  s.beam.visible = false;
  s.shardA.visible = false;
  s.shardB.visible = false;
  s.quadA.visible = false;
  s.quadB.visible = false;
  s.quadA.rotation.set(0, 0, 0);
  s.quadB.rotation.set(0, 0, 0);
}

function v2cStepHeroKit(kit, time) {
  var s = kit.shapes;
  var charge = kit.charge;
  var flight = kit.flight;
  var t = kit.t;
  var p = t <= charge ? 0 : (t - charge) / flight;
  if (p > 1) p = 1;
  var e = p * p * (3 - 2 * p);
  var flavor = kit.flavor;

  if (!kit.impacted) {
    var bob = Math.sin(p * Math.PI) * 0.32;
    if (flavor !== 'aura') {
      kit.group.position.set(
        kit.from.x + (kit.to.x - kit.from.x) * e,
        kit.from.y + (kit.to.y - kit.from.y) * e + bob,
        kit.from.z + (kit.to.z - kit.from.z) * e
      );
    } else {
      kit.group.position.copy(kit.from);
    }
    var chargeP = Math.min(1, t / charge);

    if (flavor === 'stars') {
      var a1 = t * 9.5;
      s.core.visible = true;
      s.core.position.set(Math.cos(a1 * 0.7) * 0.12, Math.sin(a1 * 0.9) * 0.1, Math.sin(a1 * 0.7) * 0.12);
      s.core.rotation.set(t * 6, t * 5, t * 3);
      s.core.scale.setScalar(0.2 + chargeP * 0.14);
      s.shardA.visible = true;
      s.shardB.visible = true;
      s.shardA.position.set(Math.cos(a1) * 0.42, Math.sin(a1 * 1.3) * 0.28, Math.sin(a1) * 0.42);
      s.shardB.position.set(Math.cos(a1 + 2.1) * 0.48, Math.sin(a1 * 1.1 + 1) * 0.26, Math.sin(a1 + 2.1) * 0.48);
      s.shardA.scale.setScalar(0.55);
      s.shardB.scale.setScalar(0.42);
      s.shardA.rotation.set(t * 2, t * 3, 0);
      s.shardB.rotation.set(0, t * 2.4, t * 2);
      s.shardA.material.opacity = 0.9;
      s.shardB.material.opacity = 0.7;
      s.glow.visible = true;
      s.glow.position.set(0, 0, 0);
      s.glow.scale.setScalar(1.15 + Math.sin(t * 14) * 0.12);
      s.glow.material.opacity = 0.8;
    } else if (flavor === 'mapRing') {
      s.core.visible = true;
      s.core.scale.set(0.16, 0.16, 0.55);
      s.core.rotation.set(0, 0, 0);
      s.ringA.visible = true;
      s.ringA.position.set(0, 0, 0);
      s.ringA.rotation.set(Math.PI / 2, 0, t * 6);
      s.ringA.scale.setScalar(0.72);
      s.ringA.material.opacity = 0.55;
      s.glow.visible = true;
      s.glow.scale.setScalar(1.05);
      s.glow.material.opacity = 0.65;
    } else if (flavor === 'prism') {
      s.beam.visible = true;
      v2cAimBeam(kit, s.beam, 0.75);
      s.beam.material.opacity = Math.min(1, chargeP * 1.7) * 0.5;
      s.shardA.visible = true;
      s.shardB.visible = true;
      s.shardA.position.set(0, 0.2, 0);
      s.shardB.position.set(0, -0.18, 0);
      s.shardA.scale.set(0.6, 0.9, 0.6);
      s.shardB.scale.set(0.5, 1.2, 0.5);
      s.shardA.rotation.set(t * 3, t * 2, t * 1.2);
      s.shardB.rotation.set(0, t * 2.2, 0);
      s.shardA.material.opacity = 0.7;
      s.shardB.material.opacity = 0.55;
      s.glow.visible = true;
      s.glow.scale.setScalar(0.9);
      s.glow.material.opacity = 0.55;
    } else if (flavor === 'echo') {
      s.glow.visible = true;
      s.glow.scale.setScalar(0.85 + Math.sin(t * 8) * 0.1);
      s.glow.material.opacity = 0.6;
      s.ringA.visible = true;
      s.ringA.position.set(0, 0, 0);
      s.ringA.rotation.set(Math.PI / 2, 0, 0);
      s.ringA.scale.setScalar(0.45 + p * 0.9);
      s.ringA.material.opacity = 0.45 * (1 - p * 0.6);
      s.ringB.visible = true;
      s.ringB.position.set(0, 0, 0);
      s.ringB.quaternion.copy(camera.quaternion);
      s.ringB.scale.setScalar(0.25 + e * 1.1);
      s.ringB.material.opacity = 0.35 * (1 - p * 0.7);
      s.core.visible = true;
      s.core.scale.setScalar(0.16);
      s.core.rotation.set(t * 4, t * 3, 0);
    } else if (flavor === 'timewave') {
      s.arc.visible = p < 0.35;
      if (s.arc.visible) {
        s.arc.position.set(0, 0, 0);
        s.arc.quaternion.copy(camera.quaternion);
        s.arc.rotateZ(t * 9);
        s.arc.scale.setScalar(1.25);
        s.arc.material.opacity = 0.6;
      }
      s.ringA.visible = true;
      s.ringA.position.set(0, 0, 0);
      s.ringA.rotation.set(Math.PI / 2, 0, 0);
      s.ringA.scale.setScalar(0.55 + p * 1.25);
      s.ringA.material.opacity = 0.6 * (1 - p * 0.35);
      s.glow.visible = true;
      s.glow.scale.setScalar(0.95);
      s.glow.material.opacity = 0.65;
      s.core.visible = true;
      s.core.scale.setScalar(0.14);
      s.core.rotation.set(0, 0, 0);
    } else if (flavor === 'shock') {
      kit.group.position.y = 0.22 + Math.sin(p * Math.PI) * 0.12;
      s.ringA.visible = true;
      s.ringA.position.set(0, 0, 0);
      s.ringA.rotation.set(Math.PI / 2, 0, 0);
      s.ringA.scale.setScalar(1.0 + p * 0.8);
      s.ringA.material.opacity = 0.55;
      s.core.visible = true;
      s.core.scale.set(0.5, 0.5, 0.5);
      s.core.rotation.set(t * 7, t * 6, 0);
      s.glow.visible = true;
      s.glow.scale.setScalar(1.5);
      s.glow.material.opacity = 0.7;
    } else if (flavor === 'lantern') {
      s.beam.visible = true;
      v2cAimBeam(kit, s.beam, 2.6);
      s.beam.material.opacity = Math.min(1, chargeP * 1.5) * 0.4;
      s.core.visible = false;
      s.glow.visible = true;
      s.glow.scale.setScalar(1.3);
      s.glow.material.opacity = 0.75;
    } else if (flavor === 'blueprint') {
      s.quadA.visible = true;
      s.quadB.visible = true;
      s.quadA.position.set(Math.cos(t * 3) * 0.28, Math.sin(t * 2.4) * 0.2, Math.sin(t * 3) * 0.15);
      s.quadB.position.set(Math.cos(t * 3 + 2.4) * 0.3, Math.sin(t * 2.1 + 1) * 0.22, Math.sin(t * 3 + 2.4) * 0.15);
      s.quadA.rotation.set(t * 1.4, t * 1.9, 0);
      s.quadB.rotation.set(t * 1.1, -t * 1.6, t * 0.7);
      s.quadA.scale.set(0.54, 0.36, 1);
      s.quadB.scale.set(0.4, 0.28, 1);
      s.quadA.material.opacity = 0.4;
      s.quadB.material.opacity = 0.32;
      s.core.visible = true;
      s.core.scale.setScalar(0.14);
      s.core.rotation.set(t * 3, t * 4, 0);
      s.glow.visible = true;
      s.glow.scale.setScalar(0.8);
      s.glow.material.opacity = 0.5;
    } else if (flavor === 'aura') {
      var reach = kit.dist ? Math.max(1.4, kit.dist * 0.92) : kit.ringScale;
      s.ringA.visible = true;
      s.ringA.position.set(0, 0, 0);
      s.ringA.rotation.set(Math.PI / 2, 0, 0);
      s.ringA.scale.setScalar(0.35 + e * reach);
      s.ringA.material.opacity = 0.45 * (1 - p * 0.55);
      s.ringB.visible = true;
      s.ringB.position.set(0, 0, 0);
      s.ringB.quaternion.copy(camera.quaternion);
      s.ringB.scale.setScalar(0.25 + e * reach * 0.9);
      s.ringB.material.opacity = 0.32 * (1 - p * 0.6);
      s.glow.visible = true;
      s.glow.scale.setScalar(1.1);
      s.glow.material.opacity = 0.55;
    } else if (flavor === 'pages') {
      s.quadA.visible = true;
      s.quadB.visible = true;
      s.shardA.visible = true;
      s.shardB.visible = true;
      var pp = t * 7;
      s.quadA.position.set(Math.cos(pp) * 0.3, Math.sin(pp * 1.2) * 0.22, Math.sin(pp) * 0.3);
      s.quadB.position.set(Math.cos(pp + 2) * 0.32, Math.sin(pp * 1.2 + 1.4) * 0.2, Math.sin(pp + 2) * 0.32);
      s.quadA.rotation.set(t * 2.2, t * 1.7, t * 0.9);
      s.quadB.rotation.set(t * 1.4, -t * 2.1, t * 1.2);
      s.quadA.scale.set(0.34, 0.46, 1);
      s.quadB.scale.set(0.3, 0.4, 1);
      s.quadA.material.opacity = 0.55;
      s.quadB.material.opacity = 0.45;
      s.shardA.position.set(0, 0.15, 0);
      s.shardB.position.set(0, -0.15, 0);
      s.shardA.scale.set(0.4, 0.55, 0.4);
      s.shardB.scale.set(0.35, 0.5, 0.35);
      s.shardA.rotation.set(t * 3, 0, t * 2);
      s.shardB.rotation.set(0, t * 3, t * 2);
      s.shardA.material.opacity = 0.6;
      s.shardB.material.opacity = 0.5;
      s.glow.visible = true;
      s.glow.scale.setScalar(1.2);
      s.glow.material.opacity = 0.7;
    }
    if (p >= 0.97) {
      kit.impacted = true;
      kit.impactAt = kit.t;
      v2cHeroImpact(kit);
    }
    return;
  }

  var q = (kit.t - kit.impactAt) / kit.after;
  if (q > 1) q = 1;
  var alpha = 1 - q;
  v2cHideShapes(kit);
  kit.group.position.set(kit.to.x, kit.to.y, kit.to.z);
  s.ringB.visible = true;
  s.ringB.position.set(0, 0, 0);
  s.ringB.quaternion.copy(camera.quaternion);
  s.ringB.scale.setScalar(0.4 + q * kit.ringScale);
  s.ringB.material.opacity = alpha * 0.62;
  s.glow.visible = true;
  s.glow.position.set(0, 0, 0);
  s.glow.scale.setScalar(1.2 + q * 1.6);
  s.glow.material.opacity = alpha * 0.6;
  if (kit.flavor === 'shock') {
    s.ringA.visible = true;
    s.ringA.position.set(0, -kit.to.y + 0.2, 0);
    s.ringA.rotation.set(Math.PI / 2, 0, 0);
    s.ringA.scale.setScalar(0.8 + q * 2.4);
    s.ringA.material.opacity = alpha * 0.5;
  }
  if (kit.t >= kit.impactAt + kit.after) v2cEndKit(kit);
}

function v2cHeroImpact(kit) {
  var g = (typeof guardian !== 'undefined') ? guardian : null;
  if (g) {
    g.hurtTimer = 0.46;
    g.shieldPulse = 0.95;
  }
  v2cAddShake(kit.shake);
  var accent = kit.accentHex || v2c.accent;
  v2cBurst(kit.to.x, kit.to.y, kit.to.z, 14, accent, 1.5);
  v2cBurst(kit.to.x, kit.to.y, kit.to.z, 6, '#f6e7c8', 1.1);
  v2cSpawnNumber(kit.to.x, kit.to.y + 0.55, kit.to.z + 0.12, kit.numText, kit.numSub, kit.numColor);
  try {
    if (typeof tone === 'function') tone(780, 0.12, 'triangle', 0.018, 1120);
  } catch (e) {}
  v2cEmitEvent('heroImpact', { hero: kit.heroId, xp: kit.xp });
}

function v2cSetupBurst(kit) {
  var s = kit.shapes;
  s.glow.visible = true;
  s.glow.position.set(0, 0, 0);
  s.glow.material.opacity = 0.7;
  s.ringB.visible = true;
  s.ringB.position.set(0, 0, 0);
  s.ringB.quaternion.copy(camera.quaternion);
  s.ringB.material.opacity = 0.55;
  s.core.visible = false;
}

function v2cStepBurstKit(kit) {
  var s = kit.shapes;
  var p = Math.min(1, kit.t / kit.dur);
  var alpha = 1 - p;
  kit.group.position.copy(kit.from);
  s.ringB.visible = true;
  s.ringB.quaternion.copy(camera.quaternion);
  s.ringB.scale.setScalar(0.4 + p * 2.4);
  s.ringB.material.opacity = alpha * 0.6;
  s.glow.visible = true;
  s.glow.scale.setScalar(1.6 + p * 1.8);
  s.glow.material.opacity = alpha * 0.55;
  if (p >= 1) v2cEndKit(kit);
}

/* -------------------------------------------------------------------------
   Guardián: aviso (telegraph) y golpe con el estilo del área
   ------------------------------------------------------------------------- */
function v2cSetupGuardianTelegraph(kit) {
  var s = kit.shapes;
  s.glow.visible = true;
  s.glow.position.set(0, 0, 0);
  s.glow.scale.setScalar(0.8);
  s.glow.material.opacity = 0.25;
  s.ringB.visible = true;
  s.ringB.position.set(0, 0, 0);
  s.ringB.quaternion.copy(camera.quaternion);
  s.ringB.scale.setScalar(1.9);
  s.ringB.material.opacity = 0.5;
  s.core.visible = v2c.shapeCap > 1;
  s.core.position.set(0, 0, 0);
  s.core.scale.setScalar(0.16);
  s.core.material.opacity = 0.8;
  if (v2c.shapeCap > 1) {
    s.shardA.visible = true;
    s.shardB.visible = true;
    s.shardA.position.set(-0.55, 0.2, 0);
    s.shardB.position.set(0.55, -0.15, 0);
    s.shardA.scale.setScalar(0.4);
    s.shardB.scale.setScalar(0.34);
    s.shardA.material.opacity = 0.6;
    s.shardB.material.opacity = 0.5;
  }
}

function v2cStepGuardianKit(kit, time) {
  var s = kit.shapes;
  if (!kit.struck) {
    var p = Math.min(1, kit.t / kit.telegraph);
    kit.group.position.copy(kit.from);
    s.glow.visible = true;
    s.glow.scale.setScalar(0.6 + p * 1.5);
    s.glow.material.opacity = 0.2 + p * 0.7;
    s.ringB.visible = true;
    s.ringB.quaternion.copy(camera.quaternion);
    if (v2c.reduced) {
      s.ringB.scale.setScalar(1.7);
      s.ringB.material.opacity = 0.35 + p * 0.25;
    } else {
      s.ringB.scale.setScalar(1.9 - p * 1.25);
      s.ringB.material.opacity = 0.35 + p * 0.35;
    }
    if (s.core.visible) {
      s.core.scale.setScalar(0.12 + p * 0.16);
      s.core.rotation.set(time * 3, time * 4, 0);
    }
    if (s.shardA.visible) {
      var spin = time * 5;
      s.shardA.position.set(Math.cos(spin) * 0.6, Math.sin(spin * 1.3) * 0.3, Math.sin(spin) * 0.6);
      s.shardB.position.set(Math.cos(spin + 2.2) * 0.62, Math.sin(spin * 1.1 + 1) * 0.3, Math.sin(spin + 2.2) * 0.62);
      s.shardA.rotation.set(spin, spin * 0.7, 0);
      s.shardB.rotation.set(0, spin * 0.8, spin);
    }
    if (kit.t >= kit.telegraph) {
      kit.struck = true;
      v2cGuardianStrikeShapes(kit);
      if (v2c.style) v2c.style.surge = 1;
    }
    return;
  }

  var since = kit.t - kit.telegraph;
  var ready = since >= kit.strikeDelay;
  var strike = Math.min(1, since / Math.max(0.01, kit.strikeDelay));
  if (!kit.impacted) {
    v2cAnimateGuardianStrike(kit, strike, since);
    if (ready) {
      kit.impacted = true;
      kit.impactAt = kit.t;
      v2cGuardianImpact(kit);
    }
    return;
  }
  var q = (kit.t - kit.impactAt) / kit.after;
  if (q > 1) q = 1;
  var alpha = 1 - q;
  v2cHideShapes(kit);
  kit.group.position.set(kit.to.x, kit.to.y, kit.to.z);
  s.ringB.visible = true;
  s.ringB.position.set(0, 0, 0);
  s.ringB.quaternion.copy(camera.quaternion);
  s.ringB.scale.setScalar(0.35 + q * 2.1);
  s.ringB.material.opacity = alpha * 0.55;
  s.glow.visible = true;
  s.glow.position.set(0, 0, 0);
  s.glow.scale.setScalar(1.2 + q * 1.5);
  s.glow.material.opacity = alpha * 0.55;
  if (kit.t >= kit.impactAt + kit.after) v2cEndKit(kit);
}

function v2cGuardianStrikeShapes(kit) {
  var s = kit.shapes;
  v2cHideShapes(kit);
  var flavor = kit.flavor;
  var accent = v2c.accent;
  if (flavor === 'roots') {
    kit.group.position.set(kit.to.x, 0.04, kit.to.z);
    s.ringA.visible = true;
    s.ringA.position.set(0, 0, 0);
    s.ringA.rotation.set(Math.PI / 2, 0, 0);
    s.ringA.material.opacity = 0.5;
    if (v2c.shapeCap > 1) {
      s.shardA.visible = true;
      s.shardB.visible = true;
      s.shardA.material.color.set('#4b8a69');
      s.shardB.material.color.set('#69D3C1');
      s.shardA.material.opacity = 0.85;
      s.shardB.material.opacity = 0.75;
    }
  } else if (flavor === 'pulse') {
    kit.group.position.copy(kit.from);
    s.ringA.visible = true;
    s.ringA.position.set(0, 0, 0);
    s.ringA.rotation.set(Math.PI / 2, 0, 0);
    s.ringA.material.opacity = 0.45;
    s.ringB.visible = true;
    s.ringB.position.set(0, 0, 0);
    s.ringB.quaternion.copy(camera.quaternion);
    s.ringB.material.opacity = 0.4;
    s.glow.visible = true;
    s.glow.position.set(0, 0, 0);
    s.glow.scale.setScalar(1.4);
    s.glow.material.opacity = 0.6;
  } else if (flavor === 'reflect' || flavor === 'rays') {
    kit.group.position.copy(kit.from);
    s.beam.visible = true;
    v2cAimBeam(kit, s.beam, flavor === 'rays' ? 0.55 : 0.9);
    s.beam.material.color.set(accent);
    s.beam.material.opacity = 0.55;
    if (v2c.shapeCap > 1) {
      s.shardA.visible = true;
      s.shardB.visible = true;
      s.shardA.position.set((kit.to.x - kit.from.x) * 0.45, (kit.to.y - kit.from.y) * 0.45 + 0.4, (kit.to.z - kit.from.z) * 0.45);
      s.shardB.position.set((kit.to.x - kit.from.x) * 0.55, (kit.to.y - kit.from.y) * 0.55 - 0.25, (kit.to.z - kit.from.z) * 0.55);
      s.shardA.material.color.set(flavor === 'rays' ? '#e7f4bd' : '#e7d6b4');
      s.shardB.material.color.set(flavor === 'rays' ? '#B8D46A' : '#C49BFF');
      s.shardA.material.opacity = 0.7;
      s.shardB.material.opacity = 0.6;
    }
    s.glow.visible = true;
    s.glow.position.set(0, 0, 0);
    s.glow.scale.setScalar(1.1);
    s.glow.material.opacity = 0.6;
  } else {
    kit.group.position.set(kit.to.x, 0.12, kit.to.z);
    s.ringB.visible = true;
    s.ringB.position.set(0, 0, 0);
    s.ringB.quaternion.copy(camera.quaternion);
    s.ringB.material.opacity = 0.45;
    s.ringA.visible = true;
    s.ringA.position.set(0, 0, 0);
    s.ringA.rotation.set(Math.PI / 2, 0, 0);
    s.ringA.material.opacity = 0.35;
    if (v2c.shapeCap > 1) {
      s.quadA.visible = true;
      s.quadA.position.set(0, 1.1, 0);
      s.quadA.rotation.set(-Math.PI / 2, 0, 0);
      s.quadA.scale.set(2.2, 2.2, 1);
      s.quadA.material.color.set(accent);
      s.quadA.material.opacity = 0.22;
    }
  }
}

function v2cAnimateGuardianStrike(kit, strike, since) {
  var s = kit.shapes;
  var flavor = kit.flavor;
  var grow = 0.2 + strike * 1;
  if (flavor === 'roots') {
    if (s.ringA.visible) {
      s.ringA.scale.setScalar(0.5 + strike * 2.4);
      s.ringA.material.opacity = 0.45 * (1 - strike * 0.4);
    }
    if (s.shardA.visible) {
      s.shardA.position.set(-0.9, -0.1 + strike * 0.9, 0.2);
      s.shardB.position.set(0.85, -0.1 + strike * 1.1, -0.15);
      s.shardA.scale.set(0.18, 0.6 + strike * 1.8, 0.18);
      s.shardB.scale.set(0.16, 0.5 + strike * 1.5, 0.16);
    }
  } else if (flavor === 'pulse') {
    if (s.ringA.visible) {
      s.ringA.scale.setScalar(0.5 + strike * 2.2);
      s.ringA.material.opacity = 0.4 * (1 - strike * 0.5);
    }
    if (s.ringB.visible) {
      s.ringB.scale.setScalar(0.4 + strike * 2.6);
      s.ringB.material.opacity = 0.38 * (1 - strike * 0.6);
    }
    s.glow.scale.setScalar(1.2 + strike * 2.2);
    s.glow.material.opacity = 0.55 * (1 - strike * 0.5);
  } else if (flavor === 'reflect' || flavor === 'rays') {
    s.beam.material.opacity = 0.2 + strike * 0.45;
    if (s.shardA.visible) {
      s.shardA.rotation.set(since * 7, since * 5, 0);
      s.shardB.rotation.set(0, since * 6, since * 4);
      s.shardA.scale.setScalar(0.35 + strike * 0.25);
      s.shardB.scale.setScalar(0.3 + strike * 0.2);
    }
    s.glow.scale.setScalar(0.8 + strike * 0.8);
    s.glow.material.opacity = 0.4 + strike * 0.3;
  } else {
    if (s.ringB.visible) {
      s.ringB.rotation.z = since * 5;
      s.ringB.scale.setScalar(1.5 - strike * 0.9);
      s.ringB.material.opacity = 0.45;
    }
    if (s.ringA.visible) {
      s.ringA.scale.setScalar(1.2 + strike * 1.8);
      s.ringA.material.opacity = 0.3 * (1 - strike * 0.6);
    }
    if (s.quadA.visible) {
      s.quadA.rotation.z = since * 2;
      s.quadA.material.opacity = 0.16 + strike * 0.2;
    }
  }
}

function v2cGuardianImpact(kit) {
  try {
    if (typeof pulseHeroShield === 'function') pulseHeroShield(v2c.accent);
    if (typeof triggerHeroHurt === 'function') triggerHeroHurt();
    if (typeof cameraShake !== 'undefined') {
      if (v2c.reduced) cameraShake = 0;
      else if (cameraShake > 0.14) cameraShake = 0.14;
    }
  } catch (e) {
    v2cError(e);
  }
  v2cBurst(kit.to.x, kit.to.y, kit.to.z, 12, '#ff8b9d', 1.2);
  v2cBurst(kit.to.x, kit.to.y, kit.to.z, 6, v2c.accent, 1.0);
  v2cSpawnNumber(kit.to.x, kit.to.y + 0.72, kit.to.z, kit.numText, kit.numSub, kit.numColor);
  if (v2c.style) v2c.style.flare = 1;
  v2cEmitEvent('guardianImpact', { hearts: v2c.lastHearts });
}

function v2cAddShake(amount) {
  if (v2c.reduced) return;
  if (typeof cameraShake === 'undefined') return;
  var value = Math.min(0.14, Math.max(0, Number(amount) || 0));
  if (value > 0) cameraShake = Math.max(cameraShake, value);
}

/* -------------------------------------------------------------------------
   Números de daño: capa DOM propia, máximo 4 vivos.
   ------------------------------------------------------------------------- */
function v2cEnsureLayer() {
  if (v2c.layer && v2c.layer.parentNode) {
    if (!v2c.numbers) v2cBuildNumbers();
    return v2c.layer;
  }
  if (v2c.layer && !v2c.layer.parentNode) {
    v2c.layer = null;
    v2c.numbers = null;
  }
  var layer = document.getElementById('v2-damage-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'v2-damage-layer';
    var ls = layer.style;
    ls.position = 'fixed';
    ls.left = '0';
    ls.top = '0';
    ls.right = '0';
    ls.bottom = '0';
    ls.pointerEvents = 'none';
    ls.zIndex = '30';
    ls.overflow = 'hidden';
    ls.contain = 'layout paint';
    ls.fontFamily = '"Bahnschrift","Segoe UI",system-ui,sans-serif';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
  }
  v2c.layer = layer;
  layer.setAttribute('data-v2-quality', v2c.quality);
  layer.setAttribute('data-v2-particles', String(v2c.particleCap));
  v2c.numbers = null;
  v2cBuildNumbers();
  return layer;
}

function v2cBuildNumbers() {
  if (!v2c.layer) return;
  var numbers = [];
  for (var i = 0; i < 4; i++) {
    var el = document.createElement('div');
    var s = el.style;
    s.position = 'absolute';
    s.left = '0';
    s.top = '0';
    s.transform = 'translate(-50%,-50%)';
    s.transformOrigin = '50% 50%';
    s.opacity = '0';
    s.pointerEvents = 'none';
    s.whiteSpace = 'nowrap';
    s.textAlign = 'center';
    s.fontWeight = '900';
    s.lineHeight = '1.05';
    s.letterSpacing = '0.02em';
    s.willChange = 'transform, opacity';
    v2c.layer.appendChild(el);
    numbers.push({ el: el, life: 0, max: 1, drift: 0 });
  }
  v2c.numbers = numbers;
}

function v2cProject(x, y, z) {
  var out = v2c.tmp.scr;
  var v = v2c.tmp.proj;
  v.set(x, y, z);
  v.project(camera);
  out.x = (v.x * 0.5 + 0.5) * (window.innerWidth || 1);
  out.y = (-v.y * 0.5 + 0.5) * (window.innerHeight || 1);
  out.ok = v.z < 1 && isFinite(out.x) && isFinite(out.y);
  return out;
}

function v2cSpawnNumber(x, y, z, text, sub, hex) {
  try {
    if (!text) return;
    if (!v2cEnsureTmp()) return;
    v2cEnsureLayer();
    var screen = v2cProject(x, y, z);
    if (!screen.ok) return;
    var w = window.innerWidth || 1;
    var h = window.innerHeight || 1;
    var px = v2cClamp(screen.x, 54, w - 54);
    var py = v2cClamp(screen.y, 56, h - 84);
    var target = null;
    var i;
    for (i = 0; i < v2c.numbers.length; i++) {
      if (v2c.numbers[i].life <= 0) { target = v2c.numbers[i]; break; }
    }
    if (!target) {
      target = v2c.numbers[0];
      for (i = 1; i < v2c.numbers.length; i++) {
        if (v2c.numbers[i].life < target.life) target = v2c.numbers[i];
      }
    }
    var fs = w < 560 ? '16px' : '19px';
    var color = hex || '#e4c07a';
    target.el.style.left = px.toFixed(1) + 'px';
    target.el.style.top = py.toFixed(1) + 'px';
    target.el.style.color = color;
    target.el.style.opacity = '1';
    target.el.style.transform = 'translate(-50%,-50%) translate(0px,0px) scale(1)';
    target.el.innerHTML = '<b style="display:block;font-size:' + fs + ';' +
      'text-shadow:0 2px 10px rgba(0,0,0,0.85), 0 0 18px ' + color + '66;">' + v2cEsc(text) + '</b>' +
      '<span style="display:block;font-size:9.5px;letter-spacing:0.16em;text-transform:uppercase;' +
      'color:rgba(242,240,234,0.72);text-shadow:0 1px 6px rgba(0,0,0,0.8);margin-top:2px;">' + v2cEsc(sub || '') + '</span>';
    target.life = target.max = 1.15;
    target.drift = (Math.random() - 0.5) * 18;
  } catch (e) {
    v2cError(e);
  }
}

function v2cUpdateNumbers(dt) {
  if (!v2c.numbers) return;
  for (var i = 0; i < v2c.numbers.length; i++) {
    var n = v2c.numbers[i];
    if (n.life <= 0) continue;
    n.life -= dt;
    if (n.life <= 0) {
      n.el.style.opacity = '0';
      n.el.innerHTML = '';
      continue;
    }
    var p = 1 - n.life / n.max;
    var y = -p * 54;
    var scale = p < 0.16 ? 0.7 + (p / 0.16) * 0.38 : 1.08 - (p - 0.16) * 0.1;
    var opacity = p < 0.7 ? 1 : Math.max(0, (1 - p) / 0.3);
    n.el.style.transform = 'translate(-50%,-50%) translate(' + (n.drift * p).toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + scale.toFixed(2) + ')';
    n.el.style.opacity = opacity.toFixed(2);
  }
}

function v2cClearNumbers(removeLayer) {
  if (v2c.numbers) {
    for (var i = 0; i < v2c.numbers.length; i++) {
      v2c.numbers[i].life = 0;
      v2c.numbers[i].el.style.opacity = '0';
      v2c.numbers[i].el.innerHTML = '';
    }
  }
  if (removeLayer) {
    v2c.numbers = null;
    if (v2c.layer && v2c.layer.parentNode) v2c.layer.parentNode.removeChild(v2c.layer);
    v2c.layer = null;
  }
}

/* -------------------------------------------------------------------------
   Estilo del guardián por área
   ------------------------------------------------------------------------- */
function v2cGlyphTexture(areaId) {
  if (v2c.glyphTex[areaId]) return v2c.glyphTex[areaId];
  try {
    var glyph = (typeof AREA_GLYPHS !== 'undefined' && AREA_GLYPHS[areaId]) || '✦';
    var canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    var g = canvas.getContext('2d');
    g.clearRect(0, 0, 128, 128);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = '900 92px "Segoe UI Symbol","Segoe UI",sans-serif';
    g.fillStyle = '#ffffff';
    g.shadowColor = '#ffffff';
    g.shadowBlur = 16;
    g.fillText(String(glyph), 64, 68);
    var tex = new THREE.CanvasTexture(canvas);
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    v2c.glyphTex[areaId] = tex;
    return tex;
  } catch (e) {
    v2cError(e);
    return null;
  }
}

function v2cNewMesh(geo, hex, opacity, additive) {
  var mesh = new THREE.Mesh(geo, v2cMat(hex, opacity, additive));
  mesh.material.userData.v2cBase = hex;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.renderOrder = 4;
  return mesh;
}

function v2cNewLine(geo, hex, opacity) {
  var material = new THREE.LineBasicMaterial({
    color: v2cThreeColor(hex),
    transparent: true,
    opacity: opacity == null ? 0.4 : opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false
  });
  var line = new THREE.LineSegments(geo, material);
  line.castShadow = false;
  line.receiveShadow = false;
  return line;
}

function v2cStyleKind(areaId) {
  var kind = V2C_AREA_STYLE[areaId];
  if (kind) return kind;
  if (guardian && guardian.type === 'tree') return 'territorio';
  if (guardian && guardian.type === 'heart') return 'cuidado';
  if (guardian && guardian.type === 'mirror') return 'confianza';
  if (guardian && guardian.type === 'prism') return 'evidencia';
  if (guardian && guardian.type === 'tower') return 'sistema';
  return 'territorio';
}

function v2cBuildStyle(areaId) {
  if (!v2cSupported()) return;
  var g = (typeof guardian !== 'undefined') ? guardian : null;
  if (!g || !g.root) return;
  var area = null;
  try { area = (typeof AREA_BY_ID !== 'undefined' && AREA_BY_ID[areaId]) || null; } catch (e) {}
  var kind = v2cStyleKind(areaId);
  var accent = g.accent || (area && area.accent) || V2C_HERO_STYLE.ilan.accent;
  var height = Number(g.height) || 3.4;
  var group = new THREE.Group();
  group.name = 'v2c-style';
  group.position.set(0, 0, 0);
  var parts = {
    hue: accent,
    tint: [],
    rings: [],
    beams: [],
    gears: [],
    plans: [],
    leafData: null,
    leaves: null,
    shards: null,
    shardData: null,
    balance: null,
    fan: null,
    heartGlow: null,
    rootLines: null
  };
  var det = v2c.shapeCap;

  /* Comunes: runa de suelo, aro superior, aura y glifo del área. */
  var foot = v2cNewMesh(new THREE.TorusGeometry(1.9, 0.022, 4, 48), accent, 0.2);
  foot.rotation.x = Math.PI / 2;
  foot.position.y = 0.035;
  group.add(foot);
  parts.foot = foot;
  parts.tint.push(foot);

  var haloGeo = new THREE.TorusGeometry(0.7, 0.015, 4, 40);
  parts.haloGeo = haloGeo;
  var haloA = v2cNewMesh(haloGeo, accent, 0.42);
  haloA.rotation.x = Math.PI / 2;
  haloA.position.y = height + 0.14;
  group.add(haloA);
  parts.haloA = haloA;
  parts.tint.push(haloA);

  var haloB = v2cNewMesh(haloGeo, '#f6e7c8', 0.18);
  haloB.rotation.x = Math.PI / 2;
  haloB.position.y = height + 0.26;
  haloB.scale.setScalar(0.68);
  group.add(haloB);
  parts.haloB = haloB;

  var aura = v2cNewGlow(accent, 4.4, 0.08);
  aura.position.y = height * 0.52;
  group.add(aura);
  parts.aura = aura;
  parts.tint.push(aura);

  var warn = v2cNewMesh(new THREE.TorusGeometry(2.15, 0.03, 4, 52), '#ff8b9d', 0.0);
  warn.rotation.x = Math.PI / 2;
  warn.position.y = 0.05;
  warn.visible = false;
  group.add(warn);
  parts.warn = warn;

  var glyph = null;
  var tex = v2cGlyphTexture(areaId);
  if (tex) {
    var glyphMat = new THREE.SpriteMaterial({
      map: tex,
      color: v2cThreeColor(accent),
      transparent: true,
      opacity: 0.13,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false
    });
    glyphMat.userData.v2cBase = accent;
    glyph = new THREE.Sprite(glyphMat);
    glyph.position.set(0, height * 0.56, -0.78);
    glyph.scale.set(1.7, 1.7, 1);
    glyph.castShadow = false;
    group.add(glyph);
    parts.glyph = glyph;
    parts.tint.push(glyph);
  }

  if (kind === 'territorio') v2cBuildTerritorio(group, parts, accent, height, det);
  else if (kind === 'cuidado') v2cBuildCuidado(group, parts, accent, height, det);
  else if (kind === 'confianza') v2cBuildConfianza(group, parts, accent, height, det);
  else if (kind === 'evidencia') v2cBuildEvidencia(group, parts, accent, height, det);
  else v2cBuildSistema(group, parts, accent, height, det);

  g.root.add(group);
  v2c.style = {
    areaId: areaId,
    kind: kind,
    accent: accent,
    height: height,
    group: group,
    parts: parts,
    t: Math.random() * 8,
    speed: 1,
    flare: 0,
    surge: 0
  };
  v2c.styleId = kind;
  v2c.accent = accent;
  v2cApplyPhaseVisual();
}

function v2cBuildTerritorio(group, parts, accent, height, det) {
  /* Raíces: líneas de savia que salen del tronco + nudos de madera. */
  var points = [];
  var i, a, r;
  for (i = 0; i < 14; i++) {
    a = (i / 14) * Math.PI * 2 + 0.3;
    r = 1.05 + (i % 4) * 0.42;
    points.push(new THREE.Vector3(Math.cos(a) * 0.34, 0.18, Math.sin(a) * 0.34));
    points.push(new THREE.Vector3(Math.cos(a) * r, 0.035, Math.sin(a) * r));
  }
  var rootGeo = new THREE.BufferGeometry().setFromPoints(points);
  var rootLines = v2cNewLine(rootGeo, accent, 0.42);
  group.add(rootLines);
  parts.rootLines = rootLines;

  var knots = [];
  for (i = 0; i < 7; i++) {
    a = (i / 7) * Math.PI * 2 + 0.15;
    r = 0.75 + (i % 3) * 0.5;
    knots.push([Math.cos(a) * r, 0.06, Math.sin(a) * r, 0.2 + (i % 2) * 0.14, 0.09, 0.34 + (i % 3) * 0.12, i % 2 ? '#3d6b56' : '#4b8a69', i % 2 === 0]);
  }
  var knotMesh = mergedVoxels(knots);
  knotMesh.traverse(function (node) {
    node.castShadow = false;
    node.receiveShadow = false;
    if (node.material) { node.material.transparent = true; node.material.opacity = 0.82; }
  });
  group.add(knotMesh);

  /* Hojas flotantes: instanced (1 draw call). */
  var leafCount = det === 1 ? 6 : (det === 2 ? 9 : 13);
  var leafGeo = new THREE.PlaneGeometry(0.3, 0.2);
  var leafMat = v2cMat(accent, 0.62);
  var leaves = new THREE.InstancedMesh(leafGeo, leafMat, leafCount);
  leaves.frustumCulled = false;
  leaves.castShadow = false;
  leaves.receiveShadow = false;
  var data = [];
  for (i = 0; i < leafCount; i++) {
    a = (i / leafCount) * Math.PI * 2;
    r = 1.15 + (i % 3) * 0.28;
    data.push({
      x: Math.cos(a) * r,
      y: height * 0.62 + (i % 4) * 0.3,
      z: Math.sin(a) * r * 0.7,
      scale: 0.7 + (i % 4) * 0.16,
      phase: a * 1.7,
      speed: 0.55 + (i % 3) * 0.16,
      tilt: (i % 2 ? 0.5 : -0.4)
    });
  }
  group.add(leaves);
  parts.leaves = leaves;
  parts.leafData = data;
}

function v2cBuildCuidado(group, parts, accent, height, det) {
  var ringGeo = new THREE.TorusGeometry(1, 0.02, 6, 44);
  var count = det === 1 ? 2 : 3;
  for (var i = 0; i < count; i++) {
    var ring = v2cNewMesh(ringGeo, i === 1 ? '#dff8ff' : accent, 0.26);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = height * 0.36 + i * 0.44;
    ring.scale.setScalar(0.8 + i * 0.34);
    group.add(ring);
    parts.rings.push({ mesh: ring, base: 0.8 + i * 0.34, phase: i * 1.3 });
  }
  var glow = v2cNewGlow(accent, 2.6, 0.12);
  glow.position.set(0, height * 0.56, 0.1);
  group.add(glow);
  parts.heartGlow = glow;
  parts.tint.push(glow);
}

function v2cBuildConfianza(group, parts, accent, height, det) {
  var planeGeo = new THREE.PlaneGeometry(1.15, 1.6);
  var borderGeo = new THREE.EdgesGeometry(planeGeo);
  var borderMat = new THREE.LineBasicMaterial({
    color: v2cThreeColor(accent),
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false
  });
  var positions = [-1.25, 1.25];
  for (var i = 0; i < positions.length; i++) {
    if (i === 1 && det < 2) continue;
    var panel = v2cNewMesh(planeGeo, accent, 0.09);
    panel.position.set(positions[i], height * 0.55, -0.05);
    panel.rotation.y = positions[i] * 0.32;
    panel.rotation.z = positions[i] * -0.06;
    group.add(panel);
    parts.tint.push(panel);
    var border = new THREE.LineSegments(borderGeo, borderMat);
    border.position.copy(panel.position);
    border.rotation.copy(panel.rotation);
    group.add(border);
  }

  /* Balanza flotante: una sola malla fusionada que se mece. */
  var gold = '#e4c07a';
  var boxes = [
    [0, 0, 0, 1.05, 0.045, 0.05, gold],
    [0, -0.24, 0, 0.05, 0.5, 0.05, '#b79b69'],
    [-0.5, -0.42, 0, 0.03, 0.32, 0.03, '#b79b69'],
    [0.5, -0.42, 0, 0.03, 0.32, 0.03, '#b79b69'],
    [-0.5, -0.58, 0, 0.26, 0.035, 0.14, '#efd6ad'],
    [0.5, -0.58, 0, 0.26, 0.035, 0.14, '#efd6ad'],
    [0, 0.16, 0, 0.12, 0.12, 0.12, accent, true]
  ];
  var balanceMesh = mergedVoxels(boxes);
  balanceMesh.traverse(function (node) {
    node.castShadow = false;
    node.receiveShadow = false;
    if (node.material) { node.material.transparent = true; node.material.opacity = 0.9; }
  });
  var balance = new THREE.Group();
  balance.position.set(0, height * 0.93, 0.15);
  balance.add(balanceMesh);
  group.add(balance);
  parts.balance = balance;

  /* Reflejos que orbitan (instanced). */
  if (det > 1) {
    var shardGeo = new THREE.PlaneGeometry(0.42, 0.62);
    var shardMat = v2cMat('#e7d6b4', 0.38);
    var count = det === 2 ? 3 : 4;
    var shards = new THREE.InstancedMesh(shardGeo, shardMat, count);
    shards.frustumCulled = false;
    var data = [];
    for (i = 0; i < count; i++) {
      data.push({ radius: 1.5 + (i % 2) * 0.35, y: height * 0.42 + i * 0.22, phase: (i / count) * Math.PI * 2, speed: 0.22 + i * 0.05 });
    }
    group.add(shards);
    parts.shards = shards;
    parts.shardData = data;
  }
}

function v2cBuildEvidencia(group, parts, accent, height, det) {
  var fan = new THREE.Group();
  fan.position.set(0, height * 0.58, 0);
  group.add(fan);
  parts.fan = fan;
  var beamGeo = new THREE.BoxGeometry(0.045, 2.5, 0.045);
  var count = det === 1 ? 3 : (det === 2 ? 4 : 5);
  var colors = ['#e7f4bd', '#B8D46A', '#ffffff', '#d6e9a0', '#B8D46A'];
  for (var i = 0; i < count; i++) {
    var pivot = new THREE.Group();
    pivot.rotation.y = (i / count) * Math.PI * 2;
    pivot.rotation.z = 0.18;
    var beam = v2cNewMesh(beamGeo, colors[i % colors.length], 0.28);
    beam.position.set(0, 1.25, 0);
    pivot.add(beam);
    fan.add(pivot);
    parts.beams.push(beam);
  }
  var ring = v2cNewMesh(new THREE.TorusGeometry(0.62, 0.016, 4, 32), accent, 0.3);
  ring.rotation.x = Math.PI / 2;
  fan.add(ring);
  parts.rings.push({ mesh: ring, base: 1, phase: 0 });
  var prismGlow = v2cNewGlow('#e7f4bd', 1.8, 0.2);
  fan.add(prismGlow);
  parts.tint.push(prismGlow);
}

function v2cBuildSistema(group, parts, accent, height, det) {
  var gold = '#b48b54';
  var gears = det === 1 ? [
    { radius: 0.52, teeth: 8, x: -1.1, y: height * 0.45, z: 0.35, tilt: 0.1, speed: 0.7 }
  ] : [
    { radius: 0.5, teeth: 9, x: -1.15, y: height * 0.42, z: 0.35, tilt: 0.12, speed: 0.75 },
    { radius: 0.32, teeth: 7, x: 1.12, y: height * 0.58, z: 0.3, tilt: -0.18, speed: -1.0 },
    { radius: 0.4, teeth: 8, x: 0.6, y: height * 0.84, z: -0.4, tilt: 0.2, speed: 0.55 }
  ];
  for (var i = 0; i < gears.length; i++) {
    var cfg = gears[i];
    var gear = new THREE.Group();
    gear.position.set(cfg.x, cfg.y, cfg.z);
    gear.rotation.x = cfg.tilt;
    var ring = v2cNewMesh(new THREE.TorusGeometry(cfg.radius, cfg.radius * 0.13, 5, Math.max(10, cfg.teeth * 2)), gold, 0.85, false);
    gear.add(ring);
    var teeth = [];
    for (var k = 0; k < cfg.teeth; k++) {
      var a = (k / cfg.teeth) * Math.PI * 2;
      teeth.push([Math.cos(a) * (cfg.radius + 0.08), Math.sin(a) * (cfg.radius + 0.08), 0, 0.13, 0.17, 0.1, k % 2 ? gold : accent, k % 2 === 0]);
    }
    var toothMesh = mergedVoxels(teeth);
    toothMesh.traverse(function (node) {
      node.castShadow = false;
      node.receiveShadow = false;
      if (node.material) { node.material.transparent = true; node.material.opacity = 0.85; }
    });
    gear.add(toothMesh);
    group.add(gear);
    parts.gears.push({ group: gear, speed: cfg.speed });
  }

  var planCount = det === 1 ? 1 : 2;
  for (i = 0; i < planCount; i++) {
    var w = 1.05 + i * 0.25;
    var h = 0.68 + i * 0.18;
    var box = new THREE.BoxGeometry(w, h, 0.02);
    var edges = new THREE.EdgesGeometry(box);
    box.dispose();
    var frame = v2cNewLine(edges, accent, 0.34);
    frame.position.set(i === 0 ? -1.5 : 1.45, height * 0.7 + i * 0.42, -0.5 - i * 0.15);
    group.add(frame);
    parts.plans.push({ mesh: frame, baseY: frame.position.y, phase: i * 2.1, speed: 0.22 + i * 0.1 });
  }

  var planRing = v2cNewMesh(new THREE.TorusGeometry(2.3, 0.018, 4, 44), accent, 0.16);
  planRing.rotation.x = Math.PI / 2;
  planRing.position.y = 0.09;
  group.add(planRing);
  parts.rings.push({ mesh: planRing, base: 1, phase: 0 });
}

function v2cUpdateStyle(dt, time) {
  var st = v2c.style;
  if (!st) return;
  var p = st.parts;
  var motion = v2c.reduced ? 0.22 : 1;
  st.t += dt * st.speed * motion * (v2c.quality === 'bajo' ? 0.75 : 1);
  st.flare = Math.max(0, st.flare - dt * 1.9);
  st.surge = Math.max(0, st.surge - dt * 2.6);
  var t = st.t;
  var flare = st.flare;
  var surge = st.surge;

  if (p.haloA) {
    p.haloA.rotation.z = t * 0.55;
    p.haloA.material.opacity = 0.26 + v2c.phase * 0.08 + flare * 0.5;
    p.haloA.scale.setScalar(1 + surge * 0.18 + Math.sin(t * 1.5) * 0.05);
    p.haloA.position.y = st.height + 0.14 + Math.sin(t * 1.1) * 0.04;
  }
  if (p.haloB) {
    p.haloB.rotation.z = -t * 0.8;
    p.haloB.material.opacity = 0.12 + flare * 0.22;
    p.haloB.position.y = p.haloA ? p.haloA.position.y + 0.12 : st.height + 0.26;
  }
  if (p.foot) {
    p.foot.rotation.z = -t * 0.16;
    p.foot.material.opacity = 0.15 + v2c.phase * 0.05 + flare * 0.2;
    p.foot.scale.setScalar(1 + surge * 0.06);
  }
  if (p.aura) p.aura.material.opacity = 0.06 + flare * 0.08 + surge * 0.05;
  if (p.glyph) p.glyph.material.opacity = 0.11 + flare * 0.55;
  if (p.warn) {
    p.warn.rotation.z = t * 0.2;
    if (p.warn.visible) p.warn.material.opacity = 0.13 + Math.sin(t * 2.1) * 0.05;
  }

  if (st.kind === 'territorio') {
    if (p.rootLines) p.rootLines.material.opacity = 0.3 + Math.sin(t * 0.9) * 0.08 + flare * 0.3;
    if (p.leaves && p.leafData) v2cUpdateLeaves(p, t);
  } else if (st.kind === 'cuidado') {
    var beat = Math.sin(t * 2.5);
    beat = beat > 0.55 ? (beat - 0.55) / 0.45 : 0;
    for (var i = 0; i < p.rings.length; i++) {
      var item = p.rings[i];
      item.mesh.scale.setScalar(item.base * (1 + beat * 0.18));
      item.mesh.material.opacity = 0.14 + beat * 0.3 + flare * 0.15;
    }
    if (p.heartGlow) p.heartGlow.material.opacity = 0.08 + beat * 0.18 + flare * 0.12;
  } else if (st.kind === 'confianza') {
    if (p.balance) p.balance.rotation.z = Math.sin(t * 0.7) * 0.075;
    if (p.shards && p.shardData) v2cUpdateShards(p, t);
  } else if (st.kind === 'evidencia') {
    if (p.fan) p.fan.rotation.y = t * 0.42;
    for (i = 0; i < p.beams.length; i++) {
      p.beams[i].material.opacity = 0.2 + Math.sin(t * 1.4 + i * 0.9) * 0.07 + flare * 0.3;
    }
  } else if (st.kind === 'sistema') {
    for (i = 0; i < p.gears.length; i++) {
      p.gears[i].group.rotation.z = t * p.gears[i].speed;
    }
    for (i = 0; i < p.plans.length; i++) {
      var plan = p.plans[i];
      plan.mesh.rotation.y = t * plan.speed + plan.phase;
      plan.mesh.position.y = plan.baseY + Math.sin(t * 0.9 + plan.phase) * 0.08;
    }
  }
}

function v2cUpdateLeaves(parts, t) {
  var dummy = v2c.tmp.dummy;
  var data = parts.leafData;
  for (var i = 0; i < data.length; i++) {
    var leaf = data[i];
    dummy.position.set(
      leaf.x + Math.sin(t * leaf.speed + leaf.phase) * 0.16,
      leaf.y + Math.sin(t * leaf.speed * 0.8 + leaf.phase) * 0.2,
      leaf.z + Math.cos(t * leaf.speed + leaf.phase) * 0.16
    );
    dummy.rotation.set(
      leaf.tilt + Math.sin(t * 0.8 + leaf.phase) * 0.5,
      t * 0.6 + leaf.phase,
      Math.cos(t * 0.9 + leaf.phase) * 0.5
    );
    dummy.scale.setScalar(leaf.scale);
    dummy.updateMatrix();
    parts.leaves.setMatrixAt(i, dummy.matrix);
  }
  parts.leaves.instanceMatrix.needsUpdate = true;
}

function v2cUpdateShards(parts, t) {
  var dummy = v2c.tmp.dummy;
  var data = parts.shardData;
  for (var i = 0; i < data.length; i++) {
    var shard = data[i];
    var angle = shard.phase + t * shard.speed;
    dummy.position.set(Math.cos(angle) * shard.radius, shard.y + Math.sin(t * 0.9 + shard.phase) * 0.12, Math.sin(angle) * shard.radius * 0.6);
    dummy.rotation.set(0.2, -angle, Math.sin(t + shard.phase) * 0.3);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    parts.shards.setMatrixAt(i, dummy.matrix);
  }
  parts.shards.instanceMatrix.needsUpdate = true;
}

function v2cApplyPhaseVisual() {
  var st = v2c.style;
  if (!st) return;
  var phase = v2c.phase;
  var warnHex = phase >= 3 ? '#ff8b9d' : (phase >= 2 ? '#f3b562' : null);
  var mix = phase >= 3 ? 0.55 : (phase >= 2 ? 0.34 : 0.1);
  for (var i = 0; i < st.parts.tint.length; i++) {
    var node = st.parts.tint[i];
    if (!node || !node.material) continue;
    var base = node.material.userData.v2cBase;
    if (base && node.material.color) {
      node.material.color.set(base);
      if (warnHex) node.material.color.lerp(v2c.tmp.warn.set(warnHex), mix);
    }
  }
  if (st.parts.warn) {
    st.parts.warn.visible = phase >= 2;
    st.parts.warn.material.opacity = phase >= 2 ? 0.16 : 0;
  }
  st.speed = 1 + phase * 0.34;
  st.flare = Math.max(st.flare, phase > 0 ? 0.7 : 0);
}

function v2cDisposeTree(root) {
  if (!root) return;
  root.traverse(function (node) {
    if (node.isSprite) {
      if (node.material) node.material.dispose();
      return;
    }
    if (node.geometry) node.geometry.dispose();
    if (node.material) {
      if (Array.isArray(node.material)) {
        for (var i = 0; i < node.material.length; i++) node.material[i].dispose();
      } else {
        node.material.dispose();
      }
    }
  });
}

function v2cClearStyle() {
  var st = v2c.style;
  v2c.style = null;
  if (!st) return;
  if (st.group && st.group.parent) st.group.parent.remove(st.group);
  v2cDisposeTree(st.group);
  st.group = null;
}

/* -------------------------------------------------------------------------
   Fin de sesión: disolución del guardián o retirada del héroe
   ------------------------------------------------------------------------- */
function v2cBeginFinish(pass) {
  if (!v2cSupported()) return false;
  v2cClearFinish(false);
  var g = (typeof guardian !== 'undefined') ? guardian : null;
  var group = new THREE.Group();
  var accent = v2c.accent;
  var finish = {
    active: true,
    pass: !!pass,
    t: 0,
    dur: 1.15,
    root: g ? g.root : null,
    baseY: g ? g.root.position.y : 0,
    group: group
  };
  var baseX = ARENA_POS.x + duelPositions.guardian.x;
  var baseZ = ARENA_POS.z + duelPositions.guardian.z;
  var heroX = ARENA_POS.x + duelPositions.hero.x;
  var heroZ = ARENA_POS.z + duelPositions.hero.z;
  try {
    if (pass) {
      var columnGeo = new THREE.CylinderGeometry(0.55, 1.25, 5.4, 12, 1, true);
      var columnMat = v2cMat('#ffffff', 0.0);
      var column = new THREE.Mesh(columnGeo, columnMat);
      column.position.set(baseX, 2.7, baseZ);
      column.castShadow = false;
      group.add(column);
      finish.column = column;
      var glow = v2cNewGlow(accent, 3.2, 0.0);
      glow.position.set(baseX, 1.8, baseZ);
      group.add(glow);
      finish.glow = glow;
      var ringGeo = new THREE.TorusGeometry(1, 0.035, 5, 40);
      var ringA = new THREE.Mesh(ringGeo, v2cMat(accent, 0.0));
      ringA.rotation.x = Math.PI / 2;
      ringA.position.set(baseX, 0.12, baseZ);
      ringA.castShadow = false;
      group.add(ringA);
      finish.ringA = ringA;
      var ringB = new THREE.Mesh(ringGeo, v2cMat('#f6e7c8', 0.0));
      ringB.rotation.x = Math.PI / 2;
      ringB.position.set(baseX, 0.35, baseZ);
      ringB.castShadow = false;
      group.add(ringB);
      finish.ringB = ringB;
      v2cEmit(baseX, 1.6, baseZ, 26, accent, 1.8, 1.8, 0.8, 0.9);
      v2cEmit(baseX, 1.6, baseZ, 10, '#f6e7c8', 1.4, 1.5, 0.7, 0.7);
      v2cAddShake(0.09);
      try { if (typeof tone === 'function') tone(660, 0.5, 'sine', 0.014, 990); } catch (e) {}
    } else {
      var dome = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), new THREE.MeshBasicMaterial({
        color: v2cThreeColor('#ff8b9d'),
        wireframe: true,
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false
      }));
      dome.position.set(heroX, 1.2, heroZ);
      group.add(dome);
      finish.dome = dome;
      var fall = v2cNewGlow('#ff8b9d', 1.8, 0.0);
      fall.position.set(heroX, 1.1, heroZ);
      group.add(fall);
      finish.glow = fall;
      var ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 4, 36), v2cMat('#ff8b9d', 0.0));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(heroX, 0.1, heroZ);
      group.add(ring);
      finish.ringA = ring;
      try {
        if (typeof heroAvatar !== 'undefined' && heroAvatar) {
          heroAvatar.hurtTimer = Math.max(Number(heroAvatar.hurtTimer) || 0, 0.52);
          heroAvatar.stateTag = 'hurt';
        }
      } catch (ignore) {}
      v2cEmit(heroX, 1.2, heroZ, 14, '#ff8b9d', 1.0, 0.7, 0.7, 0.7);
      try { if (typeof tone === 'function') tone(196, 0.5, 'triangle', 0.014, 130); } catch (e) {}
    }
    scene.add(group);
    v2c.finish = finish;
    v2cEmitEvent(pass ? 'guardianDefeat' : 'heroRetreat', { areaId: v2c.areaId });
    return true;
  } catch (e) {
    v2cError(e);
    try { scene.remove(group); v2cDisposeTree(group); } catch (ignore) {}
    return false;
  }
}

function v2cUpdateFinish(dt) {
  var f = v2c.finish;
  if (!f || !f.active) return;
  f.t += dt;
  var p = Math.min(1, f.t / f.dur);
  var ease = p * p * (3 - 2 * p);
  if (f.pass) {
    if (f.column) {
      f.column.material.opacity = Math.sin(Math.min(1, p * 1.3) * Math.PI) * 0.5;
      f.column.scale.set(1 - p * 0.45, 1 + ease * 0.5, 1 - p * 0.45);
      f.column.rotation.y += dt * 1.2;
    }
    if (f.glow) {
      f.glow.material.opacity = Math.sin(Math.min(1, p * 1.15) * Math.PI) * 0.75;
      f.glow.scale.setScalar(3.2 + ease * 3.4);
    }
    if (f.ringA) {
      f.ringA.scale.setScalar(0.5 + ease * 3.6);
      f.ringA.material.opacity = (1 - p) * 0.6;
    }
    if (f.ringB) {
      f.ringB.scale.setScalar(0.3 + ease * 2.2);
      f.ringB.material.opacity = (1 - p) * 0.4;
    }
    if (f.root) {
      var shrink = Math.max(0.05, 1 - ease * 0.92);
      f.root.scale.set(shrink, shrink, shrink);
      f.root.position.y = f.baseY + ease * 1.05;
      f.root.rotation.y += dt * (0.2 + ease * 0.8);
      if (p >= 0.97) f.root.visible = false;
    }
  } else {
    if (f.dome) {
      f.dome.material.opacity = Math.sin(Math.min(1, p * 1.2) * Math.PI) * 0.32;
      f.dome.scale.setScalar(1 - p * 0.35);
      f.dome.rotation.y += dt * 0.9;
    }
    if (f.glow) f.glow.material.opacity = Math.sin(Math.min(1, p * 1.12) * Math.PI) * 0.55;
    if (f.ringA) {
      f.ringA.scale.setScalar(0.4 + ease * 2.4);
      f.ringA.material.opacity = (1 - p) * 0.45;
    }
  }
  if (p >= 1) v2cClearFinish(false);
}

function v2cClearFinish(restore) {
  var f = v2c.finish;
  v2c.finish = null;
  if (!f) return;
  f.active = false;
  if (f.group) {
    if (f.group.parent) f.group.parent.remove(f.group);
    v2cDisposeTree(f.group);
    f.group = null;
  }
  if (restore && f.root && typeof guardian !== 'undefined' && guardian && guardian.root === f.root) {
    f.root.scale.set(1, 1, 1);
    f.root.position.y = f.baseY;
    f.root.visible = true;
  }
}

/* -------------------------------------------------------------------------
   Ambiente del guardián (motas de luz)
   ------------------------------------------------------------------------- */
function v2cAmbient(dt) {
  if (!v2c.ambient || v2c.reduced || !v2c.active || !v2c.particles) return;
  var g = (typeof guardian !== 'undefined') ? guardian : null;
  if (!g || !v2c.style) return;
  v2c.emberT -= dt;
  if (v2c.emberT > 0) return;
  v2c.emberT = v2c.quality === 'alto' ? 0.22 : 0.4;
  var base = duelPositions.guardian;
  var h = g.height || 3.2;
  v2cEmit(
    ARENA_POS.x + base.x + (Math.random() - 0.5) * 2.6,
    0.3 + Math.random() * (h + 0.2),
    ARENA_POS.z + base.z + (Math.random() - 0.5) * 2.6,
    1, v2c.accent, 0.2, 0.22, 1.5, 1.3
  );
}

/* -------------------------------------------------------------------------
   API pública
   ------------------------------------------------------------------------- */
function v2cOnDuelStart(areaId) {
  try {
    if (!v2cSupported()) return;
    v2c.active = true;
    v2cInit();
    v2cClearFinish(false);
    v2cClearStyle();
    v2cEndAllKits();
    v2cStopParticles();
    v2cClearNumbers(true);
    v2c.phase = 0;
    v2c.emberT = 0.5;
    v2c.areaId = String(areaId || '');
    var g = (typeof guardian !== 'undefined') ? guardian : null;
    v2c.accent = (g && g.accent) || (V2C_HERO_STYLE.ilan.accent);
    v2cRefreshBudget(true);
    var s = (typeof session !== 'undefined') ? session : null;
    v2c.maxHearts = (s && typeof s.hearts === 'number') ? s.hearts : 3;
    v2c.lastHearts = v2c.maxHearts;
    v2cBuildStyle(v2c.areaId);
    v2cEmitEvent('duelStart', { style: v2c.styleId, quality: v2c.quality, reduced: v2c.reduced });
  } catch (e) {
    v2cError(e);
  }
}

function v2cOnDuelEnd() {
  try {
    v2cClearFinish(true);
    v2cClearStyle();
    v2cEndAllKits();
    v2cStopParticles();
    v2cClearNumbers(true);
    v2c.active = false;
    v2c.phase = 0;
    v2cEmitEvent('duelEnd', {});
  } catch (e) {
    v2cError(e);
  }
}

function v2cHeroAttack(question, applied, session) {
  try {
    if (!v2cSupported()) return false;
    if (!v2c.active) return false;
    if (!v2cInit()) return false;
    v2cRefreshBudget(false);
    var g = (typeof guardian !== 'undefined') ? guardian : null;
    var hero = (typeof heroAvatar !== 'undefined') ? heroAvatar : null;
    var look = hero && hero.look ? hero.look : null;
    var heroId = (look && look.id) || null;
    if (!heroId) {
      try {
        heroId = (typeof state !== 'undefined' && state && state.collection && state.collection.selectedCharacterId) || 'ilan';
      } catch (e) { heroId = 'ilan'; }
    }
    var conf = V2C_HERO_STYLE[heroId] || V2C_HERO_STYLE.ilan;
    var accent = (look && look.accent) || conf.accent;

    if (hero) {
      hero.attackTimer = 0.6;
      hero.stateTag = 'attack';
    }
    try { if (typeof flashAttack === 'function') flashAttack(); } catch (e) {}
    try { if (typeof sfxAttack === 'function') sfxAttack(); } catch (e) {}
    if (!v2c.reduced && v2c.quality !== 'bajo' && (heroId === 'ilan' || heroId === 'mara' || heroId === 'lia') &&
      typeof spawnSlashArc === 'function') {
      try { spawnSlashArc(accent); } catch (e) {}
    }

    var from = v2c.tmp.v1;
    var to = v2c.tmp.v2;
    var heroY = 1.34 + (heroId === 'kian' ? 0.08 : (heroId === 'zenon' ? -0.05 : 0));
    from.set(ARENA_POS.x + duelPositions.hero.x + 0.3, heroY, ARENA_POS.z + duelPositions.hero.z + 0.28);
    var guardianY = (g ? g.height : 3.4) * 0.58;
    to.set(ARENA_POS.x + duelPositions.guardian.x, guardianY, ARENA_POS.z + duelPositions.guardian.z + 0.1);

    var kit = v2cAcquireKit('hero', conf.flavor, from, to, accent);
    if (!kit) return false;
    kit.heroId = heroId;
    kit.shake = conf.shake;
    kit.ringScale = conf.ring;
    kit.dur = 1.1 + conf.ring * 0.04;
    var xp = 0;
    if (applied && typeof applied.xp === 'number') xp = Math.max(0, Math.round(applied.xp));
    kit.xp = xp;
    kit.numText = xp > 0 ? '+' + xp + ' XP' : '✦';
    kit.numSub = xp > 0 ? conf.label : (applied && applied.suppressed ? 'repaso · sin XP extra' : 'luz plena');
    kit.numColor = xp > 0 ? '#e4c07a' : accent;
    v2cEmitEvent('heroAttack', { hero: heroId, flavor: conf.flavor, xp: xp });
    return true;
  } catch (e) {
    v2cError(e);
    return false;
  }
}

function v2cGuardianAttack(question, chosenOption, session) {
  try {
    if (!v2cSupported()) return false;
    if (!v2c.active) return false;
    if (!v2cInit()) return false;
    v2cRefreshBudget(false);
    var g = (typeof guardian !== 'undefined') ? guardian : null;
    var accent = v2c.accent || (g && g.accent) || '#7aa2ff';
    var from = v2c.tmp.v1;
    var to = v2c.tmp.v2;
    var guardianY = (g ? g.height : 3.4) * 0.56;
    from.set(ARENA_POS.x + duelPositions.guardian.x, guardianY, ARENA_POS.z + duelPositions.guardian.z + 0.08);
    to.set(ARENA_POS.x + duelPositions.hero.x, 1.25, ARENA_POS.z + duelPositions.hero.z + 0.08);
    var kit = v2cAcquireKit('guardian', V2C_AREA_STRIKE[v2c.styleId] || 'roots', from, to, accent);
    if (!kit) return false;
    kit.telegraph = v2c.reduced ? 0.34 : (v2c.quality === 'bajo' ? 0.3 : 0.4);
    kit.strikeDelay = v2c.reduced ? 0.06 : 0.18;
    kit.after = 0.45;
    kit.dur = kit.telegraph + kit.strikeDelay + kit.after + 0.05;
    kit.shake = 0.08;
    kit.numColor = '#ff8b9d';
    kit.numSub = V2C_STRIKE_LABEL[kit.flavor] || 'guardián';
    var heartsRelevant = !!(session && (session.mode === 'mission' || session.mode === 'boss' ||
      session.mode === 'review' || session.mode === 'survival'));
    kit.numText = heartsRelevant ? '-1 ♥' : '✦';
    if (g) g.attackTimer = 0.45;
    if (v2c.style) v2c.style.flare = 1;
    try { if (typeof tone === 'function') tone(250, 0.18, 'sine', 0.012, 330); } catch (e) {}
    v2cEmitEvent('guardianTelegraph', {
      flavor: kit.flavor,
      hearts: session ? session.hearts : null,
      boss: !!(session && session.mode === 'boss')
    });
    return true;
  } catch (e) {
    v2cError(e);
    return false;
  }
}

function v2cOnHeartsChanged(session, question) {
  try {
    if (!v2cSupported() || !v2c.active) return;
    var hearts = (session && typeof session.hearts === 'number') ? session.hearts : v2c.lastHearts;
    if (hearts >= v2c.lastHearts) {
      v2c.lastHearts = hearts;
      return;
    }
    v2c.lastHearts = hearts;
    v2c.phase = Math.min(3, v2c.phase + 1);
    v2cApplyPhaseVisual();
    var g = (typeof guardian !== 'undefined') ? guardian : null;
    var at = v2c.tmp.v1;
    at.set(ARENA_POS.x + duelPositions.guardian.x, (g ? g.height : 3.4) * 0.5, ARENA_POS.z + duelPositions.guardian.z);
    var kit = v2cAcquireKit('burst', 'phase', at, at, v2c.accent);
    if (kit) {
      kit.dur = 0.6;
      kit.group.position.copy(at);
    }
    v2cBurst(at.x, at.y, at.z, 10, v2c.accent, 1.4);
    v2cBurst(at.x, at.y, at.z, 6, '#f3b562', 1.0);
    v2cAddShake(v2c.phase >= 2 ? 0.07 : 0.05);
    try { if (typeof tone === 'function') tone(v2c.phase >= 2 ? 170 : 220, 0.24, 'triangle', 0.02, v2c.phase >= 2 ? 115 : 165); } catch (e) {}
    v2cEmitEvent('phase', { phase: v2c.phase, hearts: hearts, boss: !!(session && session.mode === 'boss') });
  } catch (e) {
    v2cError(e);
  }
}

function v2cOnSessionEnd(finishedSession, result) {
  try {
    if (!v2cSupported() || !result) return false;
    if (!v2c.active) return false;
    var pass = !!result.pass;
    if (!v2cBeginFinish(pass)) return false;
    return true;
  } catch (e) {
    v2cError(e);
    return false;
  }
}

function v2cUpdate(dt, time) {
  if (!v2c.active && !v2c.finish) return;
  try {
    if (!isFinite(dt) || dt <= 0) dt = 0.016;
    if (dt > 0.06) dt = 0.06;
    v2c.budgetT -= dt;
    if (v2c.budgetT <= 0) {
      v2c.budgetT = 1.5;
      v2cRefreshBudget(false);
    }
    v2cUpdateNumbers(dt);
    v2cUpdateParticles(dt);
    v2cUpdateStyle(dt, time);
    v2cUpdateKits(dt, time);
    v2cUpdateFinish(dt);
    v2cAmbient(dt);
  } catch (e) {
    v2cError(e);
  }
}

function v2cReset() {
  try {
    v2c.active = false;
    v2c.phase = 0;
    v2cClearFinish(true);
    v2cClearStyle();
    v2cEndAllKits();
    v2cStopParticles();
    v2cClearNumbers(true);
    v2cDisposePool();
    v2cDisposeParticles();
    for (var key in v2c.glyphTex) {
      if (v2c.glyphTex.hasOwnProperty(key) && v2c.glyphTex[key]) {
        try { v2c.glyphTex[key].dispose(); } catch (e) {}
        delete v2c.glyphTex[key];
      }
    }
    v2c.ready = false;
    v2cEmitEvent('reset', {});
  } catch (e) {
    v2cError(e);
  }
}

/* Registro del módulo. V2.call('combat', …) resuelve estas funciones. */
if (typeof V2 !== 'undefined' && V2) {
  V2.combat = {
    update: v2cUpdate,
    onDuelStart: v2cOnDuelStart,
    onDuelEnd: v2cOnDuelEnd,
    heroAttack: v2cHeroAttack,
    guardianAttack: v2cGuardianAttack,
    onHeartsChanged: v2cOnHeartsChanged,
    onSessionEnd: v2cOnSessionEnd,
    reset: v2cReset
  };
  if (V2.modules) V2.modules.combat = true;
}
