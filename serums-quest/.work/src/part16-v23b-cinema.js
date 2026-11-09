/* =========================================================================
   V2.3 · FASE 1B · AGENTE 2 · ESCENA CINEMATOGRÁFICA COMPARTIDA
   -------------------------------------------------------------------------
   Una sola escena, un solo renderizador y un solo canvas para la bienvenida y
   el tutorial. La escena es independiente del atrio: esfera astral con halo,
   anillos de orrery, cristales voxel en primer plano con brillo por ruta,
   niebla luminosa y partículas. No hay etiquetas ni props del mundo.

   Composición en dos pasadas sobre el mismo renderer:
     1) fondo a pantalla completa con bgCamera (capa 0);
     2) grupo de héroes/mini-escena encajado en la zona DOM con heroCamera
        (capa 2) y viewport+scissor exactos. Así el encuadre se calcula con la
        caja real del grupo y deja >= 9 % de margen dentro de la zona.
   La escena y el canvas se crean una vez; los cambios de pantalla solo
   alternan visibilidad, cámara y textos. Nunca se remonta el renderer.
   ========================================================================= */

var V23B = {
  version: 'v23b-cinema-1',
  canvasId: 'v23b-cinema-1',
  rendererId: 'v23b-renderer-1',
  sceneId: 'v23b-scene-1',
  ready: false,
  failed: null,
  active: false,
  mode: null,
  step: 0,
  canvas: null,
  renderer: null,
  scene: null,
  bgCamera: null,
  heroCamera: null,
  bgGroup: null,
  welcomeGroup: null,
  tutorialGroups: [],
  welcomeKey: '',
  zone: null,
  zoneSelector: '',
  frameCount: 0,
  fps: 0,
  lastTime: 0,
  startedAt: 0,
  reduced: false,
  quality: 'medio',
  qualityApplied: '',
  transition: null,
  pointer: { x: 0, y: 0, tx: 0, ty: 0 },
  backdrop: null,
  particles: [],
  errors: [],
  stats: { avatars: 0, draws: 0, particles: 0 },
  _resizeAt: 0,
  _lastZoneCheck: 0,
  _tickHandle: 0
};
window.__v23b = window.__v23b || {};

function v23bNow() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
function v23bSafe(label, fn) {
  try { return fn(); } catch (e) {
    try { V23B.errors.push({ at: Date.now(), label: label, message: String(e && e.message || e) }); } catch (e2) {}
    try { if (V2 && V2.softError) V2.softError('v23b:' + label, e); } catch (e3) {}
    try { console.warn('[V2.3B] ' + label, e); } catch (e4) {}
    return null;
  }
}
function v23bClamp(n, lo, hi) { n = Number(n); if (!isFinite(n)) n = lo; return Math.max(lo, Math.min(hi, n)); }
function v23bMotionAllowed() {
  try {
    if (state && state.settings && state.settings.reducedMotion) return false;
    if (document.body.classList.contains('reduced-motion')) return false;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  } catch (e) {}
  return true;
}
function v23bQualityKey() {
  try { return (state && state.settings && state.settings.effectsQuality) || 'medio'; } catch (e) { return 'medio'; }
}
function v23bIsTouch() {
  try { return !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); } catch (e) { return false; }
}
function v23bCssColor(hex) { try { return new THREE.Color(hex); } catch (e) { return new THREE.Color('#ffffff'); } }
function v23bEase(t) { return 1 - Math.pow(1 - v23bClamp(t, 0, 1), 3); }

/* -------------------------------------------------------------------------
   Texturas locales
   ------------------------------------------------------------------------- */
function v23bRadialTexture(stops, size) {
  var c = document.createElement('canvas');
  c.width = c.height = size || 128;
  var g = c.getContext('2d');
  var grad = g.createRadialGradient(c.width / 2, c.height / 2, 0, c.width / 2, c.height / 2, c.width / 2);
  stops.forEach(function (s) { grad.addColorStop(s[0], s[1]); });
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  var tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
var V23B_TEX = {};
function v23bGlowTex() {
  if (V23B_TEX.glow) return V23B_TEX.glow;
  if (typeof GLOW_TEX !== 'undefined' && GLOW_TEX) { V23B_TEX.glow = GLOW_TEX; return GLOW_TEX; }
  V23B_TEX.glow = v23bRadialTexture([[0, 'rgba(255,255,255,1)'], [0.24, 'rgba(255,240,206,0.6)'], [1, 'rgba(255,255,255,0)']], 128);
  return V23B_TEX.glow;
}
function v23bSoftTex() {
  if (V23B_TEX.soft) return V23B_TEX.soft;
  if (typeof SOFT_GLOW !== 'undefined' && SOFT_GLOW) { V23B_TEX.soft = SOFT_GLOW; return SOFT_GLOW; }
  V23B_TEX.soft = v23bRadialTexture([[0, 'rgba(255,255,255,0.6)'], [0.45, 'rgba(255,255,255,0.15)'], [1, 'rgba(255,255,255,0)']], 64);
  return V23B_TEX.soft;
}
function v23bTextTexture(label, opts) {
  var o = opts || {};
  var w = o.w || 256, h = o.h || 256;
  var c = document.createElement('canvas');
  c.width = w; c.height = h;
  var g = c.getContext('2d');
  g.clearRect(0, 0, w, h);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = (o.weight || '700') + ' ' + (o.size || 128) + 'px ' + (o.font || 'Bahnschrift, "Arial Narrow", sans-serif');
  if (o.shadow) {
    g.shadowColor = o.shadow; g.shadowBlur = o.shadowBlur || 18;
  }
  g.fillStyle = o.color || '#f4efe4';
  g.fillText(label, w / 2, h / 2 + (o.dy || 0));
  var tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 2;
  return tex;
}
function v23bLabelSprite(text, color, scale, opts) {
  var o = opts || {};
  var tex = v23bTextTexture(text, { w: 256, h: 128, size: o.size || 74, weight: byWeight(o.weight), color: color || '#f4efe4', shadow: o.shadow, font: o.font });
  var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
  sp.scale.set((scale || 1) * 1.6, (scale || 1) * 0.8, 1);
  return sp;
}
function byWeight(w) { return w == null ? '800' : String(w); }

/* -------------------------------------------------------------------------
   Geometría de apoyo
   ------------------------------------------------------------------------- */
function v23bMat(color, opts) {
  var o = opts || {};
  return new THREE.MeshStandardMaterial({
    color: v23bCssColor(color),
    roughness: o.roughness == null ? 0.62 : o.roughness,
    metalness: o.metalness == null ? 0.18 : o.metalness,
    emissive: o.emissive ? v23bCssColor(o.emissive) : new THREE.Color('#000000'),
    emissiveIntensity: o.emissiveIntensity == null ? 1 : o.emissiveIntensity,
    transparent: !!o.transparent,
    opacity: o.opacity == null ? 1 : o.opacity,
    depthWrite: o.depthWrite !== false,
    side: o.side || THREE.FrontSide
  });
}
function v23bBasic(color, opts) {
  var o = opts || {};
  return new THREE.MeshBasicMaterial({
    color: v23bCssColor(color),
    transparent: !!o.transparent,
    opacity: o.opacity == null ? 1 : o.opacity,
    depthWrite: o.depthWrite !== false,
    blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    side: o.side || THREE.FrontSide,
    fog: false
  });
}
function v23bBox(w, h, d, color, x, y, z, opts) {
  var mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), v23bMat(color, opts));
  mesh.position.set(x || 0, y || 0, z || 0);
  return mesh;
}
function v23bGlow(color, scale, opacity) {
  var sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: v23bGlowTex(), color: v23bCssColor(color), transparent: true,
    opacity: opacity == null ? 0.6 : opacity, depthWrite: false,
    blending: THREE.AdditiveBlending, fog: false
  }));
  sp.scale.set(scale || 2, scale || 2, 1);
  return sp;
}
function v23bSetLayer(obj, layer) {
  if (!obj) return obj;
  obj.traverse(function (n) { if (n.layers) n.layers.set(layer); });
  return obj;
}
function v23bBoxOf(objects) {
  var box = new THREE.Box3();
  var any = false;
  (objects || []).forEach(function (obj) {
    if (!obj || !obj.traverse) return;
    obj.updateWorldMatrix(true, true);
    obj.traverse(function (node) {
      if (!node.isMesh || !node.geometry || node.isSprite) return;
      node.updateWorldMatrix(true, false);
      var b = new THREE.Box3().setFromObject(node);
      if (isFinite(b.min.x) && isFinite(b.max.x)) { box.union(b); any = true; }
    });
  });
  return any ? box : null;
}
function v23bCenterOf(objects) {
  var box = v23bBoxOf(objects);
  if (!box) return new THREE.Vector3();
  return box.getCenter(new THREE.Vector3());
}
function v23bDisc(radius, color, opacity, ringColor) {
  var g = new THREE.Group();
  var tex = v23bRadialTexture([[0, 'rgba(255,255,255,0.9)'], [0.45, 'rgba(255,255,255,0.25)'], [1, 'rgba(255,255,255,0)']], 128);
  var disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 48), new THREE.MeshBasicMaterial({
    map: tex, color: v23bCssColor(color), transparent: true, opacity: opacity == null ? 0.5 : opacity,
    depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false
  }));
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.01;
  g.add(disc);
  if (ringColor) {
    var ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.74, 0.014, 4, 72), v23bBasic(ringColor, { transparent: true, opacity: 0.55, additive: true }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.03;
    g.add(ring);
    var ring2 = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.98, 0.006, 4, 84), v23bBasic(ringColor, { transparent: true, opacity: 0.22, additive: true }));
    ring2.rotation.x = Math.PI / 2;
    ring2.position.y = 0.035;
    g.add(ring2);
  }
  return g;
}
function v23bOrb(radius, color, opacity) {
  var g = new THREE.Group();
  var core = new THREE.Mesh(new THREE.SphereGeometry(radius, 18, 14), v23bBasic(color, { transparent: true, opacity: opacity == null ? 0.9 : opacity }));
  g.add(core);
  var h = v23bGlow(color, radius * 5.2, 0.55);
  g.add(h);
  return g;
}

/* -------------------------------------------------------------------------
   Renderer + escena (una sola vez)
   ------------------------------------------------------------------------- */
function v23bCreateRenderer() {
  if (V23B.renderer) return V23B.renderer;
  var canvas = document.createElement('canvas');
  canvas.id = 'v23bCinema';
  canvas.className = 'v23bCinema';
  canvas.setAttribute('data-v23b-canvas', V23B.canvasId);
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  var renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false
    });
  } catch (e) {
    try { canvas.parentNode.removeChild(canvas); } catch (e2) {}
    V23B.failed = 'webgl';
    return null;
  }
  renderer.setPixelRatio(v23bPixelRatio());
  renderer.setSize(window.innerWidth || 1280, window.innerHeight || 720, false);
  renderer.setClearColor(0x05070d, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.autoClear = true;
  renderer.shadowMap.enabled = false;
  V23B.canvas = canvas;
  V23B.renderer = renderer;
  canvas.setAttribute('data-v23b-renderer', V23B.rendererId);
  return renderer;
}
function v23bPixelRatio() {
  var q = V23B.quality || v23bQualityKey();
  var dpr = Number(window.devicePixelRatio) || 1;
  if (q === 'bajo') return Math.min(0.85, dpr);
  if (q === 'alto') return Math.min(1.5, Math.max(1, dpr));
  return Math.min(1.15, Math.max(1, dpr));
}
function v23bBuildScene() {
  if (V23B.scene) return;
  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#05070d', 30, 90);
  V23B.scene = scene;
  var bgCam = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
  bgCam.position.set(0, 0, 0);
  bgCam.lookAt(0, 0, -1);
  bgCam.layers.set(0);
  V23B.bgCamera = bgCam;
  var heroCam = new THREE.PerspectiveCamera(28, 1, 0.1, 160);
  heroCam.position.set(0.6, 1.8, 8);
  heroCam.lookAt(0, 1.2, 0);
  heroCam.layers.set(2);
  V23B.heroCamera = heroCam;

  var hemi = new THREE.HemisphereLight('#c6d4ff', '#211a31', 1.75);
  var key = new THREE.DirectionalLight('#ffe3c0', 2.95);
  key.position.set(-4, 7, 6);
  var fill = new THREE.DirectionalLight('#7ba6ff', 1.45);
  fill.position.set(5, 3, 4);
  var rim = new THREE.DirectionalLight('#9a7cff', 1.85);
  rim.position.set(-2, 5, -6);
  var low = new THREE.DirectionalLight('#69d3c1', 0.62);
  low.position.set(2, -2, 4);
  [hemi, key, fill, rim, low].forEach(function (l) { l.layers.enableAll(); scene.add(l); });
  V23B.lights = { hemi: hemi, key: key, fill: fill, rim: rim, low: low };

  V23B.bgGroup = new THREE.Group();
  V23B.bgGroup.name = 'v23b-backdrop';
  scene.add(V23B.bgGroup);
  v23bBuildBackdrop();
}
function v23bBuildBackdrop() {
  var bg = V23B.bgGroup;
  var state = {
    sphere: null, halo: null, rings: [], stars: null, dust: null, motes: null,
    clusters: [], nebulas: [], constellations: [], sphereDust: null, uTime: { value: 0 }
  };
  V23B.backdrop = state;

  /* Esfera astral: cuerpo oscuro con borde luminoso violeta. */
  var uniforms = {
    uTime: state.uTime,
    uBase: { value: v23bCssColor('#171043') },
    uMid: { value: v23bCssColor('#53309e') },
    uRim: { value: v23bCssColor('#d4bcff') },
    uWarm: { value: v23bCssColor('#8bf0de') }
  };
  var sphereMat = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: [
      'varying vec3 vNormalV;',
      'varying vec3 vViewV;',
      'varying vec3 vPos;',
      'void main(){',
      '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
      '  vNormalV = normalize(normalMatrix * normal);',
      '  vViewV = normalize(-mv.xyz);',
      '  vPos = position;',
      '  gl_Position = projectionMatrix * mv;',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform float uTime;',
      'uniform vec3 uBase; uniform vec3 uMid; uniform vec3 uRim; uniform vec3 uWarm;',
      'varying vec3 vNormalV; varying vec3 vViewV; varying vec3 vPos;',
      'void main(){',
      '  float d = max(dot(normalize(vNormalV), normalize(vViewV)), 0.0);',
      '  float rim = pow(1.0 - d, 1.8);',
      '  float bands = 0.5 + 0.5 * sin(vPos.y * 5.5 + sin(vPos.x * 0.8 + uTime * 0.06) * 1.2);',
      '  vec3 col = mix(uBase, uMid, 0.48 + bands * 0.24);',
      '  col = mix(col, uRim, rim * 0.92);',
      '  col += uRim * rim * 0.45;',
      '  float hl = pow(max(dot(normalize(vNormalV), normalize(vec3(-0.45, 0.72, 0.52))), 0.0), 5.0);',
      '  col += uWarm * hl * 0.35;',
      '  col += uWarm * rim * 0.16 * (0.5 + 0.5 * sin(uTime * 0.18 + vPos.x * 0.4));',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n')
  });
  var sphere = new THREE.Mesh(new THREE.SphereGeometry(10.5, 40, 28), sphereMat);
  sphere.position.set(-5.2, 3.3, -24);
  bg.add(sphere);
  state.sphere = sphere;
  var halo = v23bGlow('#9a7cff', 46, 0.52);
  halo.position.set(-5.2, 3.4, -25.2);
  bg.add(halo);
  state.halo = halo;
  var halo2 = v23bGlow('#69d3c1', 24, 0.16);
  halo2.position.set(-8.8, 1.2, -23.8);
  bg.add(halo2);
  var topGlow = v23bGlow('#c8b4ff', 18, 0.28);
  topGlow.position.set(-9.4, 10.2, -23.6);
  bg.add(topGlow);

  /* Anillos de orrery alrededor de la esfera. */
  var ringColors = ['#e4c07a', '#7aa2ff', '#c49bff'];
  for (var ri = 0; ri < 3; ri += 1) {
    var ring = new THREE.Mesh(new THREE.TorusGeometry(12.2 + ri * 1.25, 0.022 + ri * 0.004, 3, 96),
      v23bBasic(ringColors[ri], { transparent: true, opacity: 0.16 + ri * 0.05, additive: true }));
    ring.position.copy(sphere.position);
    ring.rotation.set(1.24 + ri * 0.16, 0.3 + ri * 0.22, 0.18 + ri * 0.2);
    ring.userData.spin = 0.012 + ri * 0.006;
    bg.add(ring);
    state.rings.push(ring);
    var bead = new THREE.Sprite(new THREE.SpriteMaterial({ map: v23bGlowTex(), color: v23bCssColor(ringColors[ri]), transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    bead.scale.set(0.9, 0.9, 1);
    bead.userData.ringRef = ring;
    bead.userData.phase = ri * 2.1;
    bead.userData.radius = 12.2 + ri * 1.25;
    bg.add(bead);
    state.rings.push(bead);
  }

  /* Polvo estelar cercano a la esfera. */
  var sphereDustGeo = new THREE.BufferGeometry();
  var sd = [];
  for (var sdi = 0; sdi < 90; sdi += 1) {
    var a = Math.random() * Math.PI * 2;
    var b = Math.acos(2 * Math.random() - 1);
    var rad = 11.1 + Math.random() * 1.2;
    sd.push(Math.sin(b) * Math.cos(a) * rad - 5.2, Math.sin(b) * Math.sin(a) * rad * 0.9 + 3.3, Math.cos(b) * rad - 24);
  }
  sphereDustGeo.setAttribute('position', new THREE.Float32BufferAttribute(sd, 3));
  var sphereDust = new THREE.Points(sphereDustGeo, new THREE.PointsMaterial({
    map: v23bGlowTex(), color: v23bCssColor('#b7a5ff'), size: 0.18, transparent: true,
    opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: false
  }));
  bg.add(sphereDust);
  state.sphereDust = sphereDust;

  /* Estrellas del fondo. */
  var starGeo = new THREE.BufferGeometry();
  var sp = [], sc = [];
  var pal = ['#e7e9ff', '#aebdff', '#f3d8b0', '#9fefe0', '#c8b4ff'];
  for (var si = 0; si < 460; si += 1) {
    sp.push((Math.random() - 0.5) * 95, (Math.random() - 0.2) * 45 + 2, -30 - Math.random() * 55);
    var col = v23bCssColor(pal[Math.floor(Math.random() * pal.length)]);
    sc.push(col.r, col.g, col.b);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  starGeo.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
  var stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    map: v23bGlowTex(), size: 0.28, vertexColors: true, transparent: true,
    opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: false
  }));
  bg.add(stars);
  state.stars = stars;

  /* Constelaciones de línea fina sobre el fondo. */
  var constellationSeed = [
    [[-6.5, 8.6, -30], [-3.4, 9.8, -31], [-0.6, 8.9, -30.5], [1.4, 10.6, -31.4], [3.6, 9.6, -32]],
    [[5.8, 5.4, -29], [7.9, 6.8, -30], [10.1, 5.9, -31], [11.5, 7.6, -32]]
  ];
  constellationSeed.forEach(function (points) {
    var verts = [];
    points.forEach(function (p) { verts.push(p[0], p[1], p[2]); });
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    var line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: v23bCssColor('#8aa8ff'), transparent: true, opacity: 0.23, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    bg.add(line);
    state.constellations.push(line);
    points.forEach(function (p) {
      var dot = new THREE.Sprite(new THREE.SpriteMaterial({ map: v23bGlowTex(), color: v23bCssColor('#dce6ff'), transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      dot.position.set(p[0], p[1], p[2]);
      dot.scale.set(0.45, 0.45, 1);
      bg.add(dot);
    });
  });

  /* Cristales voxel en primer plano (InstancedMesh: 1 draw por racimo). */
  var routes = ['#69d3c1', '#7aa2ff', '#c49bff', '#b8d46a', '#f3b562'];
  var layout = [
    { side: -1, y: -1.2, z: -15.5, s: 0.72, route: 0 },
    { side: -1, y: 3.2, z: -21.0, s: 0.52, route: 1 },
    { side: 1, y: -1.0, z: -15.0, s: 0.68, route: 2 },
    { side: 1, y: 3.6, z: -21.5, s: 0.50, route: 3 },
    { side: 0, y: -2.6, z: -18.0, s: 0.80, route: 4 },
    { side: -1, y: 6.2, z: -23.0, s: 0.42, route: 1 },
    { side: 1, y: 6.0, z: -24.0, s: 0.40, route: 2 }
  ];
  layout.forEach(function (L, idx) {
    var cluster = v23bCrystalCluster(routes[L.route], L.s, idx * 17 + 3);
    cluster.position.set(L.side * 6.5, L.y, L.z);
    cluster.userData.base = { side: L.side, y: L.y, z: L.z, x: L.side * 6.5, scale: L.s };
    cluster.userData.phase = idx * 1.3;
    cluster.userData.route = routes[L.route];
    bg.add(cluster);
    state.clusters.push(cluster);
  });

  /* Niebla/nebulosa luminosa en la base. */
  var nebulaColors = ['#4b2f9b', '#1d5d6d', '#6b3a86'];
  for (var ni = 0; ni < 3; ni += 1) {
    var neb = new THREE.Sprite(new THREE.SpriteMaterial({
      map: v23bSoftTex(), color: v23bCssColor(nebulaColors[ni]), transparent: true,
      opacity: 0.30 - ni * 0.04, depthWrite: false, blending: THREE.AdditiveBlending, fog: false
    }));
    neb.position.set(-8 + ni * 8, -1.4 + ni * 0.4, -6.5 - ni * 2.8);
    neb.scale.set(22, 7.0, 1);
    bg.add(neb);
    state.nebulas.push(neb);
  }

  /* Polvo ambiental. */
  var dustGeo = new THREE.BufferGeometry();
  var dp = [];
  for (var di = 0; di < 340; di += 1) {
    dp.push((Math.random() - 0.5) * 42, Math.random() * 18 - 2, -1 - Math.random() * 18);
  }
  dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3));
  var dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    map: v23bGlowTex(), color: v23bCssColor('#9db7ff'), size: 0.09, transparent: true,
    opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: false
  }));
  bg.add(dust);
  state.dust = dust;

  /* Motas que ascienden desde la niebla. */
  var moteGeo = new THREE.BufferGeometry();
  var mp = [], mc = [];
  for (var mi = 0; mi < 120; mi += 1) {
    mp.push((Math.random() - 0.5) * 28, Math.random() * 5 - 2.2, -2 - Math.random() * 8);
    var cc = v23bCssColor(routes[mi % routes.length]);
    mc.push(cc.r, cc.g, cc.b);
  }
  moteGeo.setAttribute('position', new THREE.Float32BufferAttribute(mp, 3));
  moteGeo.setAttribute('color', new THREE.Float32BufferAttribute(mc, 3));
  var motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
    map: v23bGlowTex(), size: 0.22, vertexColors: true, transparent: true,
    opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: false
  }));
  bg.add(motes);
  state.motes = motes;
  state.moteBase = mp.slice();
  V23B.stats.particles = 460 + 340 + 120 + 90;
  v23bApplyQuality();
}
function v23bCrystalCluster(colorHex, scale, seed) {
  var g = new THREE.Group();
  var rnd = (function (s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })(seed || 1);
  var count = 9;
  var geo = new THREE.BoxGeometry(1, 1, 1);
  var mat = new THREE.MeshStandardMaterial({ color: v23bCssColor('#15121f'), roughness: 0.34, metalness: 0.55 });
  var mesh = new THREE.InstancedMesh(geo, mat, count);
  var dummy = new THREE.Object3D();
  var tint = v23bCssColor(colorHex);
  for (var i = 0; i < count; i += 1) {
    var w = (0.22 + rnd() * 0.5) * scale;
    var h = (0.5 + rnd() * 1.7) * scale;
    var d = (0.2 + rnd() * 0.5) * scale;
    dummy.position.set((rnd() - 0.5) * 1.4 * scale, h * 0.5 + rnd() * 0.4 * scale - 0.4 * scale, (rnd() - 0.5) * 1.2 * scale);
    dummy.rotation.set((rnd() - 0.5) * 0.4, rnd() * Math.PI, (rnd() - 0.5) * 0.25);
    dummy.scale.set(w, h, d);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    var mix = 0.75 + rnd() * 0.25;
    mesh.setColorAt(i, new THREE.Color(tint.r * 0.35 * mix, tint.g * 0.35 * mix, tint.b * 0.35 * mix));
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  g.add(mesh);
  var veinGeo = new THREE.BoxGeometry(1, 1, 1);
  var veinMat = new THREE.MeshBasicMaterial({ color: v23bCssColor(colorHex), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  var veins = new THREE.InstancedMesh(veinGeo, veinMat, 4);
  for (var v = 0; v < 4; v += 1) {
    dummy.position.set((rnd() - 0.5) * 0.7 * scale, (0.35 + rnd() * 1.1) * scale, (rnd() - 0.5) * 0.6 * scale);
    dummy.rotation.set(0, rnd() * Math.PI, (rnd() - 0.5) * 0.5);
    dummy.scale.set(0.045 * scale, (0.22 + rnd() * 0.46) * scale, 0.045 * scale);
    dummy.updateMatrix();
    veins.setMatrixAt(v, dummy.matrix);
  }
  veins.instanceMatrix.needsUpdate = true;
  g.add(veins);
  var glow = v23bGlow(colorHex, 4.8 * scale, 0.28);
  glow.position.y = 0.9 * scale;
  g.add(glow);
  return g;
}

/* -------------------------------------------------------------------------
   Cámara: encaje por caja real y composición por zona
   ------------------------------------------------------------------------- */
function v23bFitCamera(objects, aspect, opts) {
  var o = opts || {};
  var box = v23bBoxOf(objects);
  if (!box || !isFinite(box.min.x)) {
    return { position: new THREE.Vector3(0.5, 2.4, 9), look: new THREE.Vector3(0, 1.2, 0), box: null, margin: 0 };
  }
  var center = box.getCenter(new THREE.Vector3());
  var size = box.getSize(new THREE.Vector3());
  var margin = o.margin || 1.24;
  var fov = o.fov || 28;
  var vFov = fov * Math.PI / 180;
  var distV = (size.y * margin / 2) / Math.tan(vFov / 2);
  var hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(0.2, aspect));
  var distH = (size.x * margin / 2) / Math.tan(hFov / 2);
  var dist = Math.max(distV, distH, 3.2);
  var dir = new THREE.Vector3(o.yaw == null ? 0.20 : o.yaw, o.pitch == null ? 0.10 : o.pitch, 1).normalize();
  var pos = center.clone().addScaledVector(dir, dist * 1.02);
  var look = center.clone();
  look.y += size.y * (o.lookLift || 0);
  /* Refina el encuadre con la caja proyectada real: centra la silueta y aleja
     la cámara lo justo para que ningún vértice entre en el 9,5 % de margen. */
  var refined = v23bRefineCamera(pos, look, box, fov, aspect, 0.095);
  return { position: refined.position, look: refined.look, box: box, size: size, margin: margin, dist: pos.distanceTo(look) };
}
function v23bRefineCamera(position, look, box, fov, aspect, margin) {
  var pos = position.clone();
  var target = look.clone();
  var m = margin == null ? 0.095 : margin;
  for (var pass = 0; pass < 5; pass += 1) {
    var cam = new THREE.PerspectiveCamera(fov, aspect, 0.1, 200);
    cam.position.copy(pos);
    cam.lookAt(target);
    cam.updateMatrixWorld(true);
    cam.updateProjectionMatrix();
    var pts = [];
    [box.min.x, box.max.x].forEach(function (x) {
      [box.min.y, box.max.y].forEach(function (y) {
        [box.min.z, box.max.z].forEach(function (z) {
          pts.push(new THREE.Vector3(x, y, z).project(cam));
        });
      });
    });
    var minX = 1, maxX = -1, minY = 1, maxY = -1;
    pts.forEach(function (p) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); });
    var cx = (minX + maxX) / 2;
    var cy = (minY + maxY) / 2;
    var dist = pos.distanceTo(target);
    var vHalf = Math.tan(fov * Math.PI / 360) * dist;
    var right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0).normalize();
    var up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1).normalize();
    var offset = right.multiplyScalar(cx * vHalf * Math.max(0.2, aspect)).add(up.multiplyScalar(cy * vHalf));
    pos.add(offset);
    target.add(offset);
    var halfW = (maxX - minX) / 2;
    var halfH = (maxY - minY) / 2;
    var overflow = Math.max(halfW / (1 - 2 * m), halfH / (1 - 2 * m), 1);
    if (overflow <= 1.003) break;
    var dir = pos.clone().sub(target).normalize();
    pos.copy(target).addScaledVector(dir, dist * overflow * 1.015);
  }
  return { position: pos, look: target };
}
function v23bProjectedMargins(fit, aspect, zoneW, zoneH) {
  if (!fit || !fit.box) return null;
  var cam = new THREE.PerspectiveCamera(28, aspect, 0.1, 160);
  cam.position.copy(fit.position);
  cam.lookAt(fit.look);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  return v23bMarginsForBox(fit.box, cam);
}
function v23bMarginsForBox(box, cam) {
  if (!box) return null;
  var pts = [];
  [box.min.x, box.max.x].forEach(function (x) {
    [box.min.y, box.max.y].forEach(function (y) {
      [box.min.z, box.max.z].forEach(function (z) {
        var p = new THREE.Vector3(x, y, z).project(cam);
        pts.push(p);
      });
    });
  });
  var minX = 1, maxX = -1, minY = 1, maxY = -1;
  pts.forEach(function (p) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); });
  return {
    top: Math.max(0, (1 - maxY) / 2),
    bottom: Math.max(0, (1 + minY) / 2),
    left: Math.max(0, (1 + minX) / 2),
    right: Math.max(0, (1 - maxX) / 2),
    width: (maxX - minX) / 2,
    height: (maxY - minY) / 2
  };
}

/* -------------------------------------------------------------------------
   Avatares
   ------------------------------------------------------------------------- */
function v23bApplyOutfit(avatar, id) {
  try {
    if (typeof applyOutfitToAvatar === 'function') {
      var outfit = (typeof getCharacterOutfit === 'function') ? getCharacterOutfit(id) : null;
      applyOutfitToAvatar(avatar, id, outfit || undefined);
    }
  } catch (e) { /* la silueta base sigue siendo válida */ }
}
function v23bPoseHero(avatar, variant) {
  if (!avatar) return;
  var v = variant || 'welcome';
  avatar.root.rotation.y = v === 'welcome' ? -0.06 : 0;
  avatar.body.rotation.y = 0;
  avatar.head.rotation.y = 0.14;
  avatar.head.rotation.z = -0.015;
  avatar.rightArm.rotation.x = -0.16;
  avatar.rightArm.rotation.z = 0.92;
  avatar.rightArm.rotation.y = -0.04;
  avatar.weapon.rotation.z = -0.86;
  avatar.weapon.rotation.x = 0.06;
  if (avatar.weapon) avatar.weapon.position.z = 0.12;
  avatar.leftArm.rotation.x = -0.1;
  avatar.leftArm.rotation.z = -0.14;
  avatar.leftLeg.rotation.x = 0.03;
  avatar.rightLeg.rotation.x = -0.04;
  if (avatar.cape) avatar.cape.rotation.x = -0.05;
  if (avatar.hairTail) avatar.hairTail.rotation.x = 0.03;
}
function v23bAvatar(id) {
  if (typeof buildHeroAvatar !== 'function') return null;
  var avatar = buildHeroAvatar(id);
  v23bApplyOutfit(avatar, id);
  v23bPoseHero(avatar, 'welcome');
  return avatar;
}
function v23bRoster() {
  var hero = 'ilan';
  try {
    hero = (state && state.collection && state.collection.selectedCharacterId) || 'ilan';
  } catch (e) {}
  var mates = [];
  try {
    var owned = (state.collection.ownedCharacterIds || []).filter(function (id) { return id !== hero && CHARACTER_BY_ID[id]; });
    mates = owned.slice();
    CAMP.characters.forEach(function (c) { if (c.id !== hero && mates.indexOf(c.id) === -1) mates.push(c.id); });
  } catch (e) {}
  return { hero: hero, mates: mates.slice(0, 2) };
}
function v23bOutfitSig(id) {
  try {
    var outfit = (typeof getCharacterOutfit === 'function') ? (getCharacterOutfit(id) || {}) : {};
    return Object.keys(outfit).sort().map(function (k) { return k + '=' + outfit[k]; }).join(',');
  } catch (e) { return ''; }
}
function v23bRosterKey(roster) {
  return roster.hero + ':' + v23bOutfitSig(roster.hero) + '|' + roster.mates.map(function (id) {
    return id + ':' + v23bOutfitSig(id);
  }).join(',');
}

/* -------------------------------------------------------------------------
   BIENVENIDA · grupo de tres héroes
   ------------------------------------------------------------------------- */
function v23bBuildWelcome(force) {
  var roster = v23bRoster();
  var key = v23bRosterKey(roster);
  if (!force && V23B.welcomeGroup && V23B.welcomeKey === key) return V23B.welcomeGroup;
  if (V23B.welcomeGroup) {
    try { V23B.scene.remove(V23B.welcomeGroup); disposeObject(V23B.welcomeGroup); } catch (e) {}
    V23B.welcomeGroup = null;
  }
  var group = new THREE.Group();
  group.name = 'v23b-welcome';
  group.position.set(-16, 0, 0);

  var hero = v23bAvatar(roster.hero);
  var mateA = roster.mates[0] ? v23bAvatar(roster.mates[0]) : null;
  var mateB = roster.mates[1] ? v23bAvatar(roster.mates[1]) : null;
  var fitObjects = [];
  if (hero) {
    hero.root.position.set(0.05, 0, 0.3);
    hero.root.scale.setScalar(1.08);
    group.add(hero.root);
    fitObjects.push(hero.body);
    V23B.stats.avatars = 1;
  }
  if (mateA) {
    mateA.root.position.set(-1.02, 0, -0.95);
    mateA.root.scale.setScalar(0.79);
    mateA.root.rotation.y = 0.40;
    group.add(mateA.root);
    fitObjects.push(mateA.body);
    V23B.stats.avatars += 1;
  }
  if (mateB) {
    mateB.root.position.set(1.08, 0, -1.10);
    mateB.root.scale.setScalar(0.76);
    mateB.root.rotation.y = -0.44;
    group.add(mateB.root);
    fitObjects.push(mateB.body);
    V23B.stats.avatars += 1;
  }

  var accent = '#7aa2ff';
  try { accent = (heroLook(roster.hero) && heroLook(roster.hero).accent) || '#7aa2ff'; } catch (e) {}
  var floor = v23bDisc(3.9, accent, 0.34, '#e4c07a');
  group.add(floor);
  var halo = new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.012, 4, 96), v23bBasic(accent, { transparent: true, opacity: 0.38, additive: true }));
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 0.05;
  group.add(halo);
  var halo2 = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.006, 4, 100), v23bBasic('#e4c07a', { transparent: true, opacity: 0.18, additive: true }));
  halo2.rotation.x = Math.PI / 2;
  halo2.position.y = 0.06;
  group.add(halo2);
  var backGlow = v23bGlow(accent, 7.5, 0.12);
  backGlow.position.set(0, 2.0, -1.6);
  group.add(backGlow);

  /* Chispas alrededor del grupo. */
  var sparkGeo = new THREE.BufferGeometry();
  var sp = [];
  for (var i = 0; i < 44; i += 1) {
    var a = Math.random() * Math.PI * 2;
    var rr = 1.1 + Math.random() * 2.6;
    sp.push(Math.cos(a) * rr, 0.2 + Math.random() * 3.0, Math.sin(a) * rr * 0.55 + 0.2);
  }
  sparkGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  var sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({
    map: v23bGlowTex(), color: v23bCssColor(accent), size: 0.16, transparent: true,
    opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: false
  }));
  group.add(sparks);
  V23B.stats.particles += 44;

  group.userData = {
    hero: hero, mates: [mateA, mateB], floor: floor, halo: halo, halo2: halo2,
    sparks: sparks, fitObjects: fitObjects, accent: accent, key: key, kind: 'welcome',
    tick: function (t) {
      var wob = V23B.reduced ? 0 : Math.sin(t * 1.05);
      if (hero) {
        hero.root.position.y = wob * 0.012;
        hero.body.rotation.y = wob * 0.022;
        hero.head.rotation.y = 0.14 + wob * 0.035;
        hero.leftArm.rotation.z = -0.14 - wob * 0.02;
      }
      if (mateA) { mateA.root.position.y = V23B.reduced ? 0 : Math.sin(t * 0.9 + 1.6) * 0.008; }
      if (mateB) { mateB.root.position.y = V23B.reduced ? 0 : Math.sin(t * 0.82 + 3.2) * 0.008; }
      halo.rotation.z = V23B.reduced ? 0 : t * 0.06;
      halo2.rotation.z = V23B.reduced ? 0 : -t * 0.035;
      floor.children[0].material.opacity = 0.30 + (V23B.reduced ? 0 : Math.sin(t * 0.8) * 0.05);
      sparks.rotation.y = V23B.reduced ? 0 : t * 0.05;
    }
  };
  group.traverse(function (n) { if (n.layers) n.layers.set(2); });
  V23B.scene.add(group);
  V23B.welcomeGroup = group;
  V23B.welcomeKey = key;
  return group;
}

/* -------------------------------------------------------------------------
   TUTORIAL · cinco mini-escenas
   ------------------------------------------------------------------------- */
function v23bBuildTutorial() {
  if (V23B.tutorialGroups.length) return V23B.tutorialGroups;
  var heroId = v23bRoster().hero;
  var groups = [];
  for (var i = 0; i < 5; i += 1) {
    var g = new THREE.Group();
    g.name = 'v23b-tutorial-' + i;
    g.position.set(i * 16, 0, 0);
    g.visible = false;
    V23B.scene.add(g);
    groups.push(g);
  }
  v23bBuildStepMovement(groups[0], heroId);
  v23bBuildStepDuel(groups[1], heroId);
  v23bBuildStepReview(groups[2], heroId);
  v23bBuildStepMap(groups[3], heroId);
  v23bBuildStepShop(groups[4], heroId);
  groups.forEach(function (g) { g.traverse(function (n) { if (n.layers) n.layers.set(2); }); });
  V23B.tutorialGroups = groups;
  return groups;
}
function v23bHeroOnStage(id) {
  var a = v23bAvatar(id);
  if (a) V23B.stats.avatars += 1;
  return a;
}
function v23bStepShell(g, accent, radius, fitObjects) {
  var floor = v23bDisc(radius || 3.3, accent, 0.32, accent);
  g.add(floor);
  var glow = v23bGlow(accent, radius * 2.1, 0.10);
  glow.position.set(0, 0.7, -1.2);
  g.add(glow);
  g.userData.fitObjects = fitObjects || [];
  g.userData.floor = floor;
  return floor;
}

/* Paso 1 · movimiento */
function v23bBuildStepMovement(g, heroId) {
  var accent = '#69d3c1';
  var hero = v23bHeroOnStage(heroId);
  var fit = [];
  if (hero) {
    hero.root.position.set(-0.5, 0, 0);
    hero.root.rotation.y = 1.18;
    hero.root.scale.setScalar(1.02);
    g.add(hero.root);
    fit.push(hero.body);
  }
  for (var i = 0; i < 6; i += 1) {
    var tile = v23bBox(0.82, 0.06, 0.82, i % 2 ? '#1c2638' : '#202c42', -2.1 + i * 0.84, 0, 0.65, { roughness: 0.8, metalness: 0.12 });
    g.add(tile);
    var line = v23bBox(0.82, 0.012, 0.03, i % 2 ? '#2f405e' : '#39506f', -2.1 + i * 0.84, 0.035, 0.65);
    g.add(line);
  }
  v23bStepShell(g, accent, 3.0, fit);

  var touch = (window.innerWidth < 760) || (v23bIsTouch() && window.innerWidth < 1100);
  var keys = [];
  var keyGroup = new THREE.Group();
  var touchGroup = new THREE.Group();
  g.add(keyGroup, touchGroup);
  var labels = ['W', 'A', 'S', 'D', 'E'];
  var keyPositions = [
    [1.18, 1.62, 0.92],
    [0.62, 0.86, 1.02],
    [1.24, 0.86, 1.02],
    [1.86, 0.86, 1.02],
    [2.48, 1.62, 0.92]
  ];
  labels.forEach(function (label, idx) {
    var k = v23bKeycap(label, idx === 4 ? '#e4c07a' : accent);
    k.position.set(keyPositions[idx][0], keyPositions[idx][1], keyPositions[idx][2]);
    k.rotation.x = -0.16;
    k.rotation.y = -0.16;
    k.scale.setScalar(0.76);
    k.userData.phase = idx * 0.42;
    k.userData.baseY = keyPositions[idx][1];
    keyGroup.add(k);
    keys.push(k);
  });
  var joy = v23bJoystick(accent);
  joy.position.set(1.12, 0.28, 1.0);
  touchGroup.add(joy);
  keys.push(joy);
  var btn = v23bJoystickButton('E', '#e4c07a');
  btn.position.set(2.12, 0.28, 0.8);
  touchGroup.add(btn);
  keys.push(btn);
  keyGroup.visible = !touch;
  touchGroup.visible = touch;
  var pulse = v23bGlow(accent, 5.2, 0.10);
  pulse.position.set(0, 1.2, 0.6);
  g.add(pulse);
  fit.push(keyGroup, touchGroup);

  g.userData.kind = 'movement';
  g.userData.hero = hero;
  g.userData.keys = keys;
  g.userData.keyGroup = keyGroup;
  g.userData.touchGroup = touchGroup;
  g.userData.accent = accent;
  g.userData.fitObjects = fit;
  g.userData.tick = function (t) {
    var m = V23B.reduced;
    var touchMode = (window.innerWidth < 760) || (v23bIsTouch() && window.innerWidth < 1100);
    keyGroup.visible = !touchMode;
    touchGroup.visible = touchMode;
    if (hero) {
      var walk = m ? 0 : Math.sin(t * 4.0);
      hero.root.position.x = m ? -0.5 : -0.5 + Math.sin(t * 0.7) * 0.28;
      hero.root.position.y = m ? 0 : Math.abs(Math.sin(t * 4.0)) * 0.035;
      hero.leftLeg.rotation.x = walk * 0.42;
      hero.rightLeg.rotation.x = -walk * 0.42;
      hero.leftArm.rotation.x = -0.1 - walk * 0.35;
      hero.rightArm.rotation.x = -0.16 + walk * 0.18;
      hero.rightArm.rotation.z = 0.92;
      hero.head.rotation.y = 0.05;
      hero.body.rotation.y = 0;
    }
    keys.forEach(function (k, idx) {
      var on = m ? idx === 0 : (Math.floor(t * 2.2) % keys.length) === idx;
      if (k.userData.keycap) {
        var target = on ? 1 : 0.12;
        k.userData.lit = k.userData.lit == null ? 0 : k.userData.lit + (target - k.userData.lit) * 0.18;
        k.userData.face.material.emissiveIntensity = 0.25 + k.userData.lit * 1.5;
        k.userData.face.material.emissive.set(k.userData.accent);
        k.userData.glow.material.opacity = 0.08 + k.userData.lit * 0.3;
        k.position.y = (k.userData.baseY || 1.28) + Math.sin(t * 1.4 + idx) * 0.03 + k.userData.lit * 0.03;
      } else if (k.userData.joystick) {
        var ring = k.userData.ring;
        if (ring) ring.material.opacity = 0.35 + (m ? 0 : Math.sin(t * 1.7) * 0.12);
        if (k.userData.stick) k.userData.stick.rotation.z = m ? 0 : Math.sin(t * 1.2) * 0.16;
      }
    });
    pulse.material.opacity = m ? 0.08 : 0.08 + Math.sin(t * 1.5) * 0.025;
  };
}
function v23bKeycap(label, accent) {
  var g = new THREE.Group();
  var shadow = v23bBox(0.7, 0.7, 0.12, '#0b101b', 0, 0, 0, { roughness: 0.8, metalness: 0.2 });
  shadow.position.z = -0.04;
  g.add(shadow);
  var faceMat = new THREE.MeshStandardMaterial({ color: '#1a2437', roughness: 0.34, metalness: 0.45, emissive: v23bCssColor(accent), emissiveIntensity: 0.22 });
  var face = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.64, 0.1), faceMat);
  face.position.z = 0.02;
  g.add(face);
  var rim = v23bBox(0.7, 0.02, 0.02, '#3a4c6c', 0, 0.35, 0.06);
  g.add(rim);
  var tex = v23bTextTexture(label, { w: 128, h: 128, size: 82, color: '#f6f2e7', shadow: 'rgba(0,0,0,0.45)', shadowBlur: 8 });
  var letter = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
  letter.position.set(0, 0, 0.08);
  g.add(letter);
  var glow = v23bGlow(accent, 1.5, 0.1);
  glow.position.set(0, 0, -0.04);
  g.add(glow);
  g.userData.keycap = true;
  g.userData.face = face;
  g.userData.letter = letter;
  g.userData.glow = glow;
  g.userData.accent = accent;
  g.userData.lit = 0.1;
  return g;
}
function v23bJoystick(accent) {
  var g = new THREE.Group();
  var base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.78, 0.12, 36), v23bMat('#111827', { roughness: 0.4, metalness: 0.4 }));
  g.add(base);
  var ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.014, 4, 48), v23bBasic(accent, { transparent: true, opacity: 0.4, additive: true }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.09;
  g.add(ring);
  var stick = new THREE.Group();
  var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.55, 12), v23bMat('#d7e2f7', { roughness: 0.3, metalness: 0.3 }));
  shaft.position.y = 0.3;
  var ball = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 10), v23bMat('#7aa2ff', { roughness: 0.25, metalness: 0.25, emissive: '#2b4e9a', emissiveIntensity: 0.5 }));
  ball.position.y = 0.62;
  stick.add(shaft, ball);
  g.add(stick);
  g.userData.joystick = true;
  g.userData.ring = ring;
  g.userData.stick = stick;
  return g;
}
function v23bJoystickButton(label, color) {
  var g = new THREE.Group();
  var base = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.5, 0.14, 28), v23bMat('#111827', { roughness: 0.4, metalness: 0.4 }));
  g.add(base);
  var top = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.08, 28), v23bMat(color, { roughness: 0.28, metalness: 0.3, emissive: color, emissiveIntensity: 0.35 }));
  top.position.y = 0.11;
  g.add(top);
  var tex = v23bTextTexture(label, { w: 128, h: 128, size: 76, color: '#1b1306' });
  var sp = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
  sp.rotation.x = -Math.PI / 2;
  sp.position.y = 0.16;
  g.add(sp);
  return g;
}
function v23bSpriteLabel(text, color, scale) {
  var tex = v23bTextTexture(text, { w: 512, h: 96, size: 52, color: color, shadow: 'rgba(0,0,0,0.4)', shadowBlur: 12 });
  var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
  sp.scale.set(2.4 * (scale || 1), 0.45 * (scale || 1), 1);
  return sp;
}

/* Paso 2 · duelo */
function v23bBuildStepDuel(g, heroId) {
  var accent = '#f3b562';
  var hero = v23bHeroOnStage(heroId);
  var fit = [];
  if (hero) {
    hero.root.position.set(-1.45, 0, 0.15);
    hero.root.rotation.y = 0.98;
    hero.root.scale.setScalar(0.98);
    g.add(hero.root);
    fit.push(hero.body);
  }
  var guardian = null;
  try {
    guardian = buildGuardian('area-psi-cuidado-integral');
    guardian.label.visible = false;
    guardian.root.position.set(1.5, 0, -0.1);
    guardian.root.rotation.y = -0.45;
    guardian.root.scale.setScalar(0.88);
    g.add(guardian.root);
    fit.push(guardian.body);
    V23B.stats.avatars += 1;
  } catch (e) { guardian = null; }
  v23bStepShell(g, accent, 3.5, fit);

  var cardTex = v23bQuestionTexture();
  var card = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 1.25), new THREE.MeshBasicMaterial({ map: cardTex, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  card.position.set(0.1, 2.85, 1.25);
  card.rotation.x = -0.08;
  card.rotation.y = -0.1;
  g.add(card);
  var cardGlow = v23bGlow('#7aa2ff', 3.4, 0.13);
  cardGlow.position.copy(card.position);
  cardGlow.position.z -= 0.1;
  g.add(cardGlow);
  fit.push(card);

  var strikes = [];
  for (var i = 0; i < 5; i += 1) {
    var s = v23bGlow(i % 2 ? '#ffd7a1' : '#7aa2ff', 0.9, 0.0);
    s.position.set(0, 1.2, 0.4);
    g.add(s);
    strikes.push(s);
  }
  var fitBox = v23bBoxOf(fit);
  if (fitBox) { fitBox.expandByPoint(new THREE.Vector3(0.1, 3.5, 1.4)); }
  g.userData.kind = 'duel';
  g.userData.hero = hero;
  g.userData.guardian = guardian;
  g.userData.tick = function (t) {
    var m = V23B.reduced;
    var cyc = m ? 0.4 : (t * 0.55) % 1;
    if (hero) {
      var atk = cyc < 0.25 ? Math.sin((cyc / 0.25) * Math.PI) : 0;
      hero.root.position.x = -1.45 + atk * 0.45;
      hero.rightArm.rotation.x = -0.16 - atk * 0.85;
      hero.rightArm.rotation.z = 0.92 - atk * 0.35;
      hero.weapon.rotation.z = -0.86 + atk * 0.6;
      hero.body.rotation.y = atk * 0.08;
      hero.head.rotation.y = 0.12;
    }
    if (guardian) {
      guardian.body.position.y = guardian.baseBodyY + (m ? 0 : Math.sin(t * 1.1) * 0.05);
      guardian.root.rotation.y = -0.45 + (m ? 0 : Math.sin(t * 0.7) * 0.06);
      if (guardian.rings) guardian.rings.forEach(function (r) { if (r.mesh) r.mesh.rotation.z += V23B.reduced ? 0 : 0.002; });
      if (guardian.shards) guardian.shards.forEach(function (sh) {
        if (sh.group) sh.group.position.y = sh.baseY + (m ? 0 : Math.sin(t * 0.9 + sh.angle) * 0.06);
      });
      guardian.hurtTimer = Math.max(0, guardian.hurtTimer - 0.016);
    }
    strikes.forEach(function (s, idx) {
      var phase = m ? idx * 0.1 : ((t * 0.55 + idx * 0.16) % 0.8) / 0.8;
      var x = -1.0 + phase * 2.4;
      s.position.set(x, 1.15 + Math.sin(phase * Math.PI) * 0.6, 0.45);
      s.material.opacity = m ? 0.1 : Math.max(0, 0.7 - Math.abs(phase - 0.5) * 1.2);
      s.scale.setScalar(0.5 + Math.sin(phase * Math.PI) * 0.65);
    });
    card.position.y = 2.85 + (m ? 0 : Math.sin(t * 0.9) * 0.04);
    cardGlow.material.opacity = 0.10 + (m ? 0 : Math.sin(t * 1.4) * 0.03);
  };
}
function v23bQuestionTexture() {
  var c = document.createElement('canvas');
  c.width = 640; c.height = 360;
  var g = c.getContext('2d');
  g.clearRect(0, 0, 640, 360);
  var r = 26;
  function round(x, y, w, h, rad) {
    g.beginPath();
    g.moveTo(x + rad, y);
    g.arcTo(x + w, y, x + w, y + h, rad);
    g.arcTo(x + w, y + h, x, y + h, rad);
    g.arcTo(x, y + h, x, y, rad);
    g.arcTo(x, y, x + w, y, rad);
    g.closePath();
  }
  g.fillStyle = 'rgba(10, 15, 26, 0.92)';
  round(8, 8, 624, 344, r); g.fill();
  g.strokeStyle = 'rgba(160, 184, 230, 0.38)'; g.lineWidth = 2; round(8, 8, 624, 344, r); g.stroke();
  g.fillStyle = '#69d3c1';
  g.font = '800 22px Bahnschrift, sans-serif'; g.textAlign = 'left';
  g.fillText('PREGUNTA 3 / 8', 42, 58);
  g.fillStyle = '#f1f3f8';
  g.font = '600 27px "Segoe UI", sans-serif';
  g.fillText('Elige una sola respuesta.', 42, 106);
  var opts = ['A · Observar y registrar', 'B · Ignorar la señal', 'C · Duplicar el registro'];
  for (var i = 0; i < 3; i += 1) {
    var y = 148 + i * 58;
    g.fillStyle = i === 0 ? 'rgba(122, 162, 255, 0.20)' : 'rgba(255,255,255,0.055)';
    round(38, y, 564, 44, 12); g.fill();
    g.strokeStyle = i === 0 ? 'rgba(122, 162, 255, 0.75)' : 'rgba(190, 208, 245, 0.18)';
    g.lineWidth = 2; round(38, y, 564, 44, 12); g.stroke();
    g.fillStyle = i === 0 ? '#dce7ff' : '#a7b2c9';
    g.font = '600 22px "Segoe UI", sans-serif';
    g.fillText(opts[i], 58, y + 29);
    if (i === 0) {
      g.fillStyle = '#69d3c1';
      g.beginPath(); g.arc(570, y + 22, 7, 0, Math.PI * 2); g.fill();
    }
  }
  var tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 2;
  return tex;
}

/* Paso 3 · repaso */
function v23bBuildStepReview(g, heroId) {
  var accent = '#c49bff';
  v23bStepShell(g, accent, 3.2, []);
  var chartTex = v23bStarChartTexture();
  var chart = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.8), new THREE.MeshBasicMaterial({ map: chartTex, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  chart.position.set(1.05, 1.7, -0.6);
  chart.rotation.y = -0.24;
  g.add(chart);
  var chartGlow = v23bGlow(accent, 4.0, 0.10);
  chartGlow.position.set(1.05, 1.6, -0.9);
  g.add(chartGlow);

  var scope = new THREE.Group();
  scope.position.set(-1.25, 0.2, 0.2);
  var base = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.52, 0.12, 24), v23bMat('#141b28', { roughness: 0.5, metalness: 0.5 }));
  base.position.y = 0.06;
  scope.add(base);
  var legs = [];
  for (var li = 0; li < 3; li += 1) {
    var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.05, 1.3, 8), v23bMat('#a2875a', { roughness: 0.5, metalness: 0.3 }));
    leg.position.set(Math.cos(li * Math.PI * 2 / 3) * 0.34, 0.62, Math.sin(li * Math.PI * 2 / 3) * 0.34);
    leg.rotation.z = Math.cos(li * Math.PI * 2 / 3) * 0.18;
    leg.rotation.x = -Math.sin(li * Math.PI * 2 / 3) * 0.18;
    scope.add(leg);
    legs.push(leg);
  }
  var hinge = new THREE.Group();
  hinge.position.y = 1.3;
  scope.add(hinge);
  var tube = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.27, 1.55, 18), v23bMat('#26324a', { roughness: 0.32, metalness: 0.55, emissive: '#101a2e', emissiveIntensity: 0.4 }));
  tube.rotation.z = Math.PI / 2;
  tube.rotation.y = 0.12;
  hinge.add(tube);
  var lens = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.045, 8, 28), v23bMat('#e4c07a', { roughness: 0.25, metalness: 0.6, emissive: '#e4c07a', emissiveIntensity: 0.25 }));
  lens.rotation.y = Math.PI / 2;
  lens.position.x = 0.8;
  hinge.add(lens);
  var lensGlow = v23bGlow('#e4c07a', 1.6, 0.35);
  lensGlow.position.set(0.82, 0, 0);
  hinge.add(lensGlow);
  var beam = new THREE.Mesh(new THREE.ConeGeometry(0.62, 3.4, 20, 1, true), v23bBasic(accent, { transparent: true, opacity: 0.10, additive: true, side: THREE.DoubleSide }));
  beam.rotation.z = -Math.PI / 2;
  beam.position.set(2.0, 0.12, -0.4);
  hinge.add(beam);
  hinge.rotation.z = -0.08;
  g.add(scope);

  /* Sombra del error que se disipa. */
  var shadow = new THREE.Group();
  shadow.position.set(-1.35, 0.2, 0.9);
  var shMat = new THREE.MeshBasicMaterial({ color: v23bCssColor('#0a0714'), transparent: true, opacity: 0.45, depthWrite: false });
  for (var si = 0; si < 7; si += 1) {
    var part = new THREE.Mesh(new THREE.BoxGeometry(0.16 + Math.random() * 0.24, 0.5 + Math.random() * 0.7, 0.16), shMat);
    part.position.set((Math.random() - 0.5) * 0.55, 0.25 + si * 0.19, (Math.random() - 0.5) * 0.4);
    part.rotation.z = (Math.random() - 0.5) * 0.25;
    shadow.add(part);
  }
  g.add(shadow);
  var dissolveGeo = new THREE.BufferGeometry();
  var dp = [];
  for (var di = 0; di < 48; di += 1) dp.push((Math.random() - 0.5) * 1.2, Math.random() * 1.4, (Math.random() - 0.5) * 0.8);
  dissolveGeo.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3));
  var dissolve = new THREE.Points(dissolveGeo, new THREE.PointsMaterial({
    map: v23bGlowTex(), color: v23bCssColor(accent), size: 0.18, transparent: true,
    opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: false
  }));
  dissolve.position.copy(shadow.position);
  g.add(dissolve);
  g.userData.kind = 'review';
  g.userData.fitObjects = [chart, scope, shadow];
  g.userData.tick = function (t) {
    var m = V23B.reduced;
    var cyc = m ? 0.35 : (t * 0.32) % 1;
    hinge.rotation.y = -0.08 + (m ? 0 : Math.sin(t * 0.5) * 0.22);
    hinge.rotation.z = -0.08 + (m ? 0 : Math.sin(t * 0.35) * 0.05);
    lensGlow.material.opacity = 0.28 + (m ? 0 : Math.sin(t * 1.2) * 0.08);
    beam.material.opacity = 0.06 + (m ? 0.03 : Math.sin(t * 0.8) * 0.025);
    shMat.opacity = m ? 0.22 : 0.46 - cyc * 0.34;
    shadow.scale.setScalar(m ? 1 : 1 - cyc * 0.25);
    shadow.rotation.y = m ? 0 : t * 0.1;
    var pos = dissolve.geometry.attributes.position;
    for (var i = 0; i < pos.count; i += 1) {
      var y = pos.getY(i);
      if (!m) { y += 0.006; if (y > 1.7) y = 0.05; pos.setY(i, y); }
    }
    pos.needsUpdate = true;
    dissolve.material.opacity = m ? 0.35 : 0.35 + Math.sin(t * 1.2) * 0.18;
    chartGlow.material.opacity = 0.08 + (m ? 0 : Math.sin(t * 0.9) * 0.03);
  };
}
function v23bStarChartTexture() {
  var c = document.createElement('canvas');
  c.width = 512; c.height = 320;
  var g = c.getContext('2d');
  g.clearRect(0, 0, 512, 320);
  g.fillStyle = 'rgba(10, 12, 24, 0.9)';
  g.fillRect(0, 0, 512, 320);
  g.strokeStyle = 'rgba(196, 155, 255, 0.22)';
  g.lineWidth = 1;
  for (var i = 0; i <= 8; i += 1) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 320); g.stroke(); }
  for (var j = 0; j <= 5; j += 1) { g.beginPath(); g.moveTo(0, j * 64); g.lineTo(512, j * 64); g.stroke(); }
  var pts = [[72, 88], [154, 58], [238, 112], [310, 72], [390, 128], [448, 80], [206, 212], [330, 234], [120, 248]];
  g.strokeStyle = 'rgba(122, 162, 255, 0.55)';
  g.lineWidth = 2;
  g.beginPath();
  pts.slice(0, 6).forEach(function (p, idx) { if (idx === 0) g.moveTo(p[0], p[1]); else g.lineTo(p[0], p[1]); });
  g.stroke();
  pts.forEach(function (p) {
    g.fillStyle = '#e7e9ff';
    g.beginPath(); g.arc(p[0], p[1], 3.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(196,155,255,0.28)';
    g.beginPath(); g.arc(p[0], p[1], 8, 0, Math.PI * 2); g.fill();
  });
  g.fillStyle = '#69d3c1';
  g.font = '700 18px Bahnschrift, sans-serif';
  g.fillText('ERRORARIO · REPASO', 20, 28);
  var tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* Paso 4 · mapa */
function v23bBuildStepMap(g) {
  var accent = '#b8d46a';
  v23bStepShell(g, accent, 4.2, []);
  var routes = [
    { color: '#69d3c1', name: 'Salud', a: 0.2 },
    { color: '#7aa2ff', name: 'Cuidado', a: 1.5 },
    { color: '#c49bff', name: 'Ética', a: 2.7 },
    { color: '#b8d46a', name: 'Evidencia', a: 3.8 },
    { color: '#f3b562', name: 'Gestión', a: 5.0 }
  ];
  var sun = v23bOrb(0.62, '#e4c07a', 0.95);
  sun.position.set(0, 1.05, 0);
  g.add(sun);
  var sunGlow = v23bGlow('#e4c07a', 6.5, 0.22);
  sunGlow.position.copy(sun.position);
  g.add(sunGlow);
  var islands = [];
  routes.forEach(function (route, idx) {
    var rad = 1.45 + idx * 0.33;
    var y = 1.05 + Math.sin(idx * 1.4) * 0.28;
    var x = Math.cos(route.a) * rad;
    var z = Math.sin(route.a) * rad * 0.8;
    var island = new THREE.Group();
    island.position.set(x, y, z);
    var rock = v23bBox(0.68, 0.22, 0.68, '#222a3a', 0, 0, 0, { roughness: 0.8, metalness: 0.25 });
    island.add(rock);
    var top = v23bBox(0.54, 0.08, 0.54, '#31405a', 0, 0.15, 0);
    island.add(top);
    var gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.19, 0), v23bBasic(route.color, { transparent: true, opacity: 0.95 }));
    gem.position.y = 0.5;
    island.add(gem);
    var glow = v23bGlow(route.color, 1.5, 0.25);
    glow.position.y = 0.34;
    island.add(glow);
    g.add(island);
    islands.push({ group: island, baseY: y, phase: idx * 1.1, color: route.color, gem: gem, glow: glow });
  });
  /* Arcos de constelación entre islas. */
  var arcs = [];
  for (var i = 0; i < routes.length; i += 1) {
    var a0 = islands[i].group.position;
    var a1 = islands[(i + 1) % islands.length].group.position;
    var mid = a0.clone().add(a1).multiplyScalar(0.5);
    mid.y += 0.42;
    var curve = new THREE.QuadraticBezierCurve3(a0.clone(), mid, a1.clone());
    var pts = curve.getPoints(26);
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: v23bCssColor(routes[i].color), transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    g.add(line);
    var bead = v23bGlow(routes[i].color, 0.8, 0.6);
    g.add(bead);
    arcs.push({ line: line, bead: bead, curve: curve, offset: i * 0.2, color: routes[i].color });
  }
  /* Anillos orbitales. */
  var rings = [];
  routes.forEach(function (route, idx) {
    var ring = new THREE.Mesh(new THREE.TorusGeometry(1.45 + idx * 0.33, 0.006, 4, 80), v23bBasic(route.color, { transparent: true, opacity: 0.12 + idx * 0.02, additive: true }));
    ring.rotation.x = Math.PI / 2 + (idx % 2 ? 0.08 : -0.06);
    ring.position.y = 1.0 + Math.sin(idx * 1.4) * 0.28;
    g.add(ring);
    rings.push(ring);
  });
  g.userData.kind = 'map';
  g.userData.fitObjects = [sun].concat(islands.map(function (is) { return is.group; }));
  g.userData.islands = islands;
  g.userData.tick = function (t) {
    var m = V23B.reduced;
    sun.rotation.y = m ? 0 : t * 0.12;
    sunGlow.material.opacity = 0.18 + (m ? 0 : Math.sin(t * 1.2) * 0.04);
    islands.forEach(function (is, idx) {
      var on = m ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.9 - idx * 1.1);
      is.group.position.y = is.baseY + (m ? 0 : Math.sin(t * 0.8 + is.phase) * 0.05);
      is.gem.rotation.y = m ? 0 : t * 0.6;
      is.gem.rotation.x = m ? 0 : Math.sin(t * 0.4 + idx) * 0.25;
      is.glow.material.opacity = 0.12 + on * 0.28;
      is.gem.material.opacity = 0.65 + on * 0.35;
    });
    arcs.forEach(function (arc, idx) {
      var u = m ? 0.4 : (t * 0.18 + arc.offset) % 1;
      var p = arc.curve.getPoint(u);
      arc.bead.position.copy(p);
      arc.bead.scale.setScalar(0.45 + (m ? 0 : Math.sin(t * 1.5 + idx) * 0.12));
      arc.bead.material.opacity = 0.35 + (m ? 0 : Math.sin(t * 1.4 + idx) * 0.18);
      arc.line.material.opacity = 0.20 + (m ? 0 : Math.sin(t * 0.7 + idx) * 0.08);
    });
    rings.forEach(function (r, idx) {
      r.rotation.z = m ? 0 : t * (0.02 + idx * 0.004) * (idx % 2 ? -1 : 1);
    });
  };
}

/* Paso 5 · tienda */
function v23bBuildStepShop(g, heroId) {
  var accent = '#e4c07a';
  var hero = v23bHeroOnStage(heroId);
  var fit = [];
  if (hero) {
    hero.root.position.set(0, 0.42, 0);
    hero.root.scale.setScalar(1.02);
    g.add(hero.root);
    fit.push(hero.body);
  }
  var podium = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.3, 0.3, 36), v23bMat('#1a2232', { roughness: 0.42, metalness: 0.5 }));
  podium.position.y = 0.15;
  g.add(podium);
  var pRing = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.014, 4, 64), v23bBasic(accent, { transparent: true, opacity: 0.6, additive: true }));
  pRing.rotation.x = Math.PI / 2;
  pRing.position.y = 0.31;
  g.add(pRing);
  v23bStepShell(g, accent, 3.4, fit);
  g.userData.floor.position.y = -0.01;

  /* Piezas de escaparate en pedestales. */
  var items = [];
  var itemDefs = [
    { color: '#c49bff', angle: 0.8, label: 'Manto' },
    { color: '#69d3c1', angle: 2.4, label: 'Brújula' },
    { color: '#f3b562', angle: 4.1, label: 'Trofeo' }
  ];
  itemDefs.forEach(function (def, idx) {
    var ped = new THREE.Group();
    var px = Math.cos(def.angle) * 2.05;
    var pz = Math.sin(def.angle) * 1.35;
    ped.position.set(px, 0.01, pz);
    var stand = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.55, 18), v23bMat('#222b3d', { roughness: 0.5, metalness: 0.4 }));
    stand.position.y = 0.28;
    ped.add(stand);
    var item = new THREE.Group();
    if (idx === 0) {
      item.add(v23bBox(0.34, 0.5, 0.04, def.color, 0, 0, 0, { emissive: def.color, emissiveIntensity: 0.2 }));
      var collar = v23bBox(0.4, 0.06, 0.06, '#e4c07a', 0, 0.28, 0);
      item.add(collar);
    } else if (idx === 1) {
      var ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.035, 6, 24), v23bMat('#e4c07a', { metalness: 0.7, roughness: 0.25 }));
      ring.rotation.x = Math.PI / 2;
      item.add(ring);
      var needle = v23bBox(0.04, 0.02, 0.35, def.color, 0, 0.02, 0, { emissive: def.color, emissiveIntensity: 0.5 });
      item.add(needle);
    } else {
      var cup = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.08, 0.3, 12), v23bMat('#e4c07a', { metalness: 0.75, roughness: 0.22 }));
      cup.position.y = 0.1;
      item.add(cup);
      var stem = v23bBox(0.06, 0.22, 0.06, '#b88f45', 0, -0.06, 0);
      item.add(stem);
      var base = v23bBox(0.24, 0.04, 0.24, '#7b5c2e', 0, -0.18, 0);
      item.add(base);
    }
    item.position.y = 0.82;
    ped.add(item);
    var glow = v23bGlow(def.color, 1.7, 0.22);
    glow.position.y = 0.75;
    ped.add(glow);
    g.add(ped);
    items.push({ group: ped, item: item, glow: glow, baseY: 0.82, phase: idx * 1.2, color: def.color });
  });

  /* Adornos que cambian sobre el héroe. */
  var hat = new THREE.Group();
  var brim = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.58, 0.05, 20), v23bMat('#1a2233', { roughness: 0.5, metalness: 0.3 }));
  var crown = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.3, 20), v23bMat('#233049', { roughness: 0.5, metalness: 0.3 }));
  crown.position.y = 0.17;
  var band = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.026, 4, 24), v23bBasic('#e4c07a', { transparent: true, opacity: 0.8, additive: true }));
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.08;
  hat.add(brim, crown, band);
  hat.position.set(0, 2.62, 0);
  if (hero) hero.root.add(hat);
  var aura = new THREE.Mesh(new THREE.TorusGeometry(0.96, 0.012, 4, 64), v23bBasic('#c49bff', { transparent: true, opacity: 0.0, additive: true }));
  aura.rotation.x = Math.PI / 2;
  aura.position.y = 0.12;
  if (hero) hero.root.add(aura);
  var cape = new THREE.Group();
  var capeMesh = v23bBox(0.86, 1.15, 0.05, '#3a2560', 0, 1.42, -0.34, { roughness: 0.52, metalness: 0.25, emissive: '#6b3fae', emissiveIntensity: 0.28 });
  capeMesh.rotation.x = 0.10;
  var capeTrim = v23bBox(0.9, 0.06, 0.07, '#e4c07a', 0, 2.0, -0.34, { emissive: '#e4c07a', emissiveIntensity: 0.4 });
  cape.add(capeMesh, capeTrim);
  cape.visible = false;
  if (hero) hero.root.add(cape);

  g.userData.kind = 'shop';
  g.userData.hero = hero;
  g.userData.hat = hat;
  g.userData.aura = aura;
  g.userData.cape = cape;
  g.userData.items = items;
  fit.push(podium, hat, aura, cape);
  items.forEach(function (it) { fit.push(it.group); });
  g.userData.fitObjects = fit;
  g.userData.tick = function (t) {
    var m = V23B.reduced;
    if (hero) {
      hero.root.rotation.y = 0.18 + (m ? 0.2 : Math.sin(t * 0.52) * 0.95);
      hero.root.position.y = 0.42 + (m ? 0 : Math.sin(t * 1.1) * 0.012);
      hero.head.rotation.y = 0.14;
    }
    var phase = m ? 1 : Math.floor(t / 2.4) % 3;
    hat.visible = phase === 0;
    if (cape) cape.visible = phase === 1;
    hat.position.y = 2.62 + (m ? 0 : Math.sin(t * 1.3) * 0.012);
    if (hero) {
      aura.material.opacity = phase === 2 ? 0.62 : 0.05;
      aura.rotation.z = m ? 0 : t * 0.5;
    }
    items.forEach(function (it, idx) {
      it.item.rotation.y = m ? idx : t * 0.7 + idx;
      it.item.position.y = it.baseY + (m ? 0 : Math.sin(t * 1.2 + it.phase) * 0.05);
      it.glow.material.opacity = 0.16 + (m ? 0 : Math.sin(t * 1.4 + idx) * 0.05);
      it.group.rotation.y = m ? 0 : Math.sin(t * 0.3 + idx) * 0.08;
    });
  };
}

/* -------------------------------------------------------------------------
   Activación, zona y cámara
   ------------------------------------------------------------------------- */
function v23bMeasureZone(force) {
  var now = v23bNow();
  if (!force && V23B.zone && now - (V23B._lastZoneCheck || 0) < 120) return V23B.zone;
  V23B._lastZoneCheck = now;
  var rect = null;
  if (V23B.mode === 'welcome') {
    var el = document.querySelector('.titleScreen.v23w [data-v23b-zone="welcome"]');
    if (el) rect = el.getBoundingClientRect();
  } else if (V23B.mode === 'tutorial') {
    var el2 = document.querySelector('#v23Tutorial [data-v23b-zone="tutorial"]');
    if (el2) rect = el2.getBoundingClientRect();
  }
  if (!rect || rect.width < 24 || rect.height < 24) { V23B.zone = null; return null; }
  var vw = window.innerWidth || 1, vh = window.innerHeight || 1;
  var left = v23bClamp(rect.left, 0, vw - 1);
  var top = v23bClamp(rect.top, 0, vh - 1);
  var right = v23bClamp(rect.right, left + 1, vw);
  var bottom = v23bClamp(rect.bottom, top + 1, vh);
  V23B.zone = { x: left, y: top, w: right - left, h: bottom - top, css: { x: left, y: top, w: right - left, h: bottom - top } };
  return V23B.zone;
}
function v23bZoneAspect() {
  var z = V23B.zone || v23bMeasureZone(true);
  if (!z) return 1;
  return Math.max(0.35, z.w / Math.max(1, z.h));
}
function v23bCurrentFitGroup() {
  if (V23B.mode === 'welcome' && V23B.welcomeGroup) {
    return { group: V23B.welcomeGroup, objects: V23B.welcomeGroup.userData.fitObjects, margin: 1.26, yaw: 0.16, pitch: 0.08 };
  }
  if (V23B.mode === 'tutorial' && V23B.tutorialGroups.length) {
    var g = V23B.tutorialGroups[V23B.step];
    var mapStep = V23B.step === 3;
    if (g) {
      var objects = g.userData.fitObjects;
      if (g.userData.kind === 'movement') {
        var touchMode = (window.innerWidth < 760) || (v23bIsTouch() && window.innerWidth < 1100);
        objects = [g.userData.hero && g.userData.hero.body, touchMode ? g.userData.touchGroup : g.userData.keyGroup].filter(Boolean);
      }
      return { group: g, objects: objects, margin: 1.30, yaw: mapStep ? 0.20 : 0.12, pitch: mapStep ? 0.34 : 0.06 };
    }
  }
  return null;
}
function v23bFitForMode() {
  var c = v23bCurrentFitGroup();
  if (!c) return null;
  return v23bFitCamera(c.objects, v23bZoneAspect(), { margin: c.margin, yaw: c.yaw, pitch: c.pitch, fov: 28 });
}
function v23bApplyCameraImmediate(fit) {
  if (!fit) return;
  var cam = V23B.heroCamera;
  cam.position.copy(fit.position);
  cam.lookAt(fit.look);
  cam.updateProjectionMatrix();
  V23B.transition = null;
}
function v23bTransitionTo(fit, duration) {
  if (!fit) return;
  if (V23B.reduced || !duration) { v23bApplyCameraImmediate(fit); return; }
  var cam = V23B.heroCamera;
  var fromPos = cam.position.clone();
  var fromLook = new THREE.Vector3();
  cam.getWorldDirection(fromLook);
  fromLook.multiplyScalar(4).add(cam.position);
  V23B.transition = {
    t: 0, dur: duration || 0.72,
    fromPos: fromPos, fromLook: fromLook,
    toPos: fit.position.clone(), toLook: fit.look.clone()
  };
}
function v23bSetMode(mode) {
  if (!V23B.renderer) return;
  var next = mode || null;
  if (V23B.mode === next && V23B.active === !!next) {
    if (next === 'welcome') v23bBuildWelcome(false);
    v23bUpdateZoneAndCamera(true);
    return;
  }
  V23B.mode = next;
  V23B.active = !!next;
  if (!next) {
    V23B.zone = null;
    V23B.zoneSelector = '';
    if (V23B.canvas) V23B.canvas.classList.remove('is-on');
    document.body.classList.remove('v23bCinemaOn');
    return;
  }
  V23B.startedAt = v23bNow();
  if (next === 'welcome') {
    v23bBuildWelcome(false);
    if (V23B.welcomeGroup) V23B.welcomeGroup.visible = true;
    v23bTutorialVisible(-1);
  } else {
    v23bBuildTutorial();
    if (V23B.welcomeGroup) V23B.welcomeGroup.visible = false;
    v23bTutorialVisible(V23B.step);
  }
  if (V23B.canvas) V23B.canvas.classList.add('is-on');
  document.body.classList.add('v23bCinemaOn');
  v23bLayoutBackdrop();
  v23bUpdateZoneAndCamera(true);
  V23B._resizeAt = v23bNow();
}
function v23bUpdateZoneAndCamera(immediate) {
  if (!V23B.active) return;
  v23bMeasureZone(true);
  v23bResize();
  var fit = v23bFitForMode();
  if (!fit) return;
  if (immediate) v23bApplyCameraImmediate(fit);
  else v23bTransitionTo(fit, 0.65);
  var c = v23bCurrentFitGroup();
  if (c && c.group) {
    V23B._lastFit = {
      mode: V23B.mode, step: V23B.step,
      box: fit.box ? { min: fit.box.min.toArray(), max: fit.box.max.toArray() } : null,
      margins: v23bProjectedMargins(fit, v23bZoneAspect(), 1, 1)
    };
  }
}
function v23bTutorialVisible(step) {
  V23B.tutorialGroups.forEach(function (g, idx) {
    g.visible = V23B.mode === 'tutorial' && (idx === step || (V23B.transition && (idx === V23B._transitionFrom || idx === V23B.step)));
  });
}
function v23bSetStep(step, immediate) {
  var total = 5;
  var next = v23bClamp(step, 0, total - 1);
  var prev = V23B.step;
  if (!V23B.tutorialGroups.length) v23bBuildTutorial();
  V23B.step = next;
  if (V23B.mode !== 'tutorial') v23bSetMode('tutorial');
  V23B._transitionFrom = prev;
  var jump = Math.abs(next - prev) > 1;
  v23bTutorialVisible(next);
  v23bMeasureZone(true);
  var fit = v23bFitForMode();
  if (!fit) return;
  if (immediate || jump || V23B.reduced) {
    v23bApplyCameraImmediate(fit);
    if (V23B.transition) V23B.transition = null;
    V23B.tutorialGroups.forEach(function (g, idx) { g.visible = idx === next; });
  } else {
    v23bTransitionTo(fit, 0.72);
    window.setTimeout(function () {
      if (V23B.step === next) V23B.tutorialGroups.forEach(function (g, idx) { g.visible = idx === next; });
    }, 780);
  }
  V23B._lastFit = {
    mode: 'tutorial', step: next,
    box: fit.box ? { min: fit.box.min.toArray(), max: fit.box.max.toArray() } : null,
    margins: v23bProjectedMargins(fit, v23bZoneAspect(), 1, 1)
  };
}
function v23bResize() {
  if (!V23B.renderer) return;
  var w = window.innerWidth || 1;
  var h = window.innerHeight || 1;
  var pr = v23bPixelRatio();
  var r = V23B.renderer;
  r.setPixelRatio(pr);
  r.setSize(w, h, false);
  if (V23B.canvas) {
    V23B.canvas.style.width = w + 'px';
    V23B.canvas.style.height = h + 'px';
  }
  if (V23B.bgCamera) {
    V23B.bgCamera.aspect = w / h;
    V23B.bgCamera.updateProjectionMatrix();
  }
  if (V23B.heroCamera) {
    var aspect = v23bZoneAspect();
    V23B.heroCamera.aspect = aspect;
    V23B.heroCamera.updateProjectionMatrix();
  }
}
function v23bLayoutBackdrop() {
  if (!V23B.backdrop) return;
  var s = V23B.backdrop;
  var w = window.innerWidth || 1;
  var h = window.innerHeight || 1;
  var portrait = w < h * 0.92;
  var aspect = w / h;
  var tutorial = V23B.mode === 'tutorial';
  var sphereX = portrait ? 0.6 : (tutorial ? -4.2 : -5.2);
  var sphereY = portrait ? 4.5 : 3.3;
  if (s.sphere) {
    s.sphere.position.set(sphereX, sphereY, -24);
    s.sphere.scale.setScalar(portrait ? 0.92 : 1);
  }
  if (s.halo) s.halo.position.set(sphereX, sphereY + 0.1, -25.2);
  if (s.rings) s.rings.forEach(function (o) {
    if (o.userData && o.userData.ringRef) return;
    if (o.position) o.position.set(sphereX, sphereY, -24);
  });
  var halfAt = function (z) { return Math.tan(19 * Math.PI / 180) * Math.max(0.35, aspect) * Math.abs(z); };
  if (s.clusters) {
    s.clusters.forEach(function (c) {
      var b = c.userData.base;
      var half = halfAt(b.z);
      var x = b.side === 0 ? 0 : b.side * half * 0.72;
      c.position.set(x, b.y, b.z);
      /* En vertical el texto ocupa todo el ancho: los cristales negros se
         retiran para no ensuciar la lectura; quedan esfera, niebla y polvo. */
      c.visible = !portrait;
    });
  }
  if (s.nebulas) {
    s.nebulas.forEach(function (n, i) {
      var half = halfAt(-7) * 0.55;
      n.position.x = (i - 1) * half;
      n.position.z = -9.0 - i * 2.8;
      n.scale.set(portrait ? half * 2.8 : half * 1.7, portrait ? 6.0 : 7.2, 1);
    });
  }
  V23B.reduced = !v23bMotionAllowed();
}

/* -------------------------------------------------------------------------
   Interacción y ciclo
   ------------------------------------------------------------------------- */
function v23bOnPointer(event) {
  if (!V23B.active) return;
  var x = (event.clientX / (window.innerWidth || 1)) * 2 - 1;
  var y = (event.clientY / (window.innerHeight || 1)) * 2 - 1;
  V23B.pointer.tx = v23bClamp(x, -1, 1);
  V23B.pointer.ty = v23bClamp(y, -1, 1);
}
function v23bUpdateBackdrop(dt, t) {
  var s = V23B.backdrop;
  if (!s) return;
  s.uTime.value = V23B.reduced ? 0 : t;
  var m = V23B.reduced;
  if (!m) {
    V23B.pointer.x += (V23B.pointer.tx - V23B.pointer.x) * Math.min(1, dt * 2.2);
    V23B.pointer.y += (V23B.pointer.ty - V23B.pointer.y) * Math.min(1, dt * 2.2);
  } else {
    V23B.pointer.x = 0; V23B.pointer.y = 0;
  }
  var px = V23B.pointer.x, py = V23B.pointer.y;
  if (V23B.bgGroup) {
    V23B.bgGroup.position.x = px * 0.55;
    V23B.bgGroup.position.y = -py * 0.35;
  }
  s.rings.forEach(function (o) {
    if (o.userData && o.userData.ringRef) {
      var ring = o.userData.ringRef;
      var rad = o.userData.radius;
      var animT = m ? 0 : t;
      var a = animT * 0.15 + o.userData.phase;
      var pos = new THREE.Vector3(Math.cos(a) * rad, Math.sin(a * 1.3) * rad * 0.18, Math.sin(a) * rad);
      o.position.copy(ring.position).add(pos.applyAxisAngle(new THREE.Vector3(1, 0.3, 0.15).normalize(), 0.4));
    } else if (!m) {
      o.rotation.z += o.userData.spin || 0.01;
    }
  });
  if (s.sphereDust) s.sphereDust.rotation.y = m ? 0 : t * 0.014;
  if (s.stars) s.stars.rotation.y = m ? 0 : t * 0.003;
  s.clusters.forEach(function (c) {
    c.position.y = c.userData.base.y + (m ? 0 : Math.sin(t * 0.35 + c.userData.phase) * 0.10);
    c.rotation.y = m ? 0 : Math.sin(t * 0.18 + c.userData.phase) * 0.05;
  });
  if (s.motes && s.moteBase) {
    var pos = s.motes.geometry.attributes.position;
    if (!m) {
      for (var i = 0; i < pos.count; i += 1) {
        var y = pos.getY(i) + dt * (0.12 + (i % 5) * 0.03);
        if (y > 4.2) y = -2.2;
        pos.setY(i, y);
        pos.setX(i, s.moteBase[i * 3] + Math.sin(t * 0.3 + i) * 0.2);
      }
      pos.needsUpdate = true;
    }
    s.motes.material.opacity = 0.55 + (m ? 0 : Math.sin(t * 0.8) * 0.12);
  }
  s.nebulas.forEach(function (n, i) {
    n.material.opacity = (0.22 - i * 0.03) + (m ? 0 : Math.sin(t * 0.35 + i) * 0.035);
  });
}
function v23bUpdateCamera(dt) {
  var cam = V23B.heroCamera;
  if (!cam) return;
  var tr = V23B.transition;
  if (tr) {
    tr.t += dt / tr.dur;
    var k = v23bEase(v23bClamp(tr.t, 0, 1));
    cam.position.lerpVectors(tr.fromPos, tr.toPos, k);
    var look = new THREE.Vector3().lerpVectors(tr.fromLook, tr.toLook, k);
    cam.lookAt(look);
    if (tr.t >= 1) { V23B.transition = null; cam.position.copy(tr.toPos); cam.lookAt(tr.toLook); }
  }
  cam.updateProjectionMatrix();
}
function v23bRenderFrame(dt, t) {
  var r = V23B.renderer;
  if (!r) return;
  var w = window.innerWidth || 1;
  var h = window.innerHeight || 1;
  r.setScissorTest(false);
  r.setViewport(0, 0, w, h);
  r.autoClear = true;
  r.clear();
  var bg = V23B.bgCamera;
  bg.aspect = w / h;
  bg.updateProjectionMatrix();
  r.render(V23B.scene, bg);
  var z = V23B.zone;
  if (!z || z.w < 20 || z.h < 20) return;
  var cam = V23B.heroCamera;
  cam.aspect = z.w / z.h;
  cam.updateProjectionMatrix();
  var sx = Math.round(z.x);
  var sy = Math.round(h - (z.y + z.h));
  var sw = Math.round(z.w);
  var sh = Math.round(z.h);
  r.autoClear = false;
  r.clearDepth();
  r.setViewport(sx, sy, sw, sh);
  r.setScissor(sx, sy, sw, sh);
  r.setScissorTest(true);
  r.render(V23B.scene, cam);
  r.setScissorTest(false);
  r.setViewport(0, 0, w, h);
  r.autoClear = true;
  V23B.stats.draws = r.info.render.calls;
}
function v23bFrame(now) {
  V23B._tickHandle = 0;
  if (!V23B.active || !V23B.renderer) { V23B.lastTime = now; V23B._tickHandle = requestAnimationFrame(v23bFrame); return; }
  var dt = Math.min(0.05, Math.max(0.001, (now - (V23B.lastTime || now)) / 1000));
  V23B.lastTime = now;
  V23B.frameCount += 1;
  V23B.fps = V23B.fps ? V23B.fps * 0.9 + (1 / dt) * 0.1 : 1 / dt;
  var t = (now - V23B.startedAt) / 1000;
  V23B.reduced = !v23bMotionAllowed();
  var q = v23bQualityKey();
  if (q !== V23B.qualityApplied) { V23B.quality = q; v23bApplyQuality(); }
  try {
    var prevZone = V23B.zone ? { w: V23B.zone.w, h: V23B.zone.h } : null;
    var z = v23bMeasureZone(false);
    if (z && prevZone && (z.w !== prevZone.w || z.h !== prevZone.h)) {
      v23bResize();
      var newFit = v23bFitForMode();
      if (newFit) v23bApplyCameraImmediate(newFit);
    }
    v23bUpdateBackdrop(dt, t);
    var c = v23bCurrentFitGroup();
    if (c && c.group && c.group.userData && typeof c.group.userData.tick === 'function') c.group.userData.tick(V23B.reduced ? 0 : t);
    if (V23B.mode === 'welcome' && V23B.welcomeGroup) V23B.welcomeGroup.visible = true;
    v23bUpdateCamera(dt);
    v23bRenderFrame(dt, t);
  } catch (e) {
    try { V23B.errors.push({ at: Date.now(), label: 'frame', message: String(e && e.message || e) }); } catch (e2) {}
    try { if (V2 && V2.softError) V2.softError('v23b:frame', e); } catch (e3) {}
  }
  V23B._tickHandle = requestAnimationFrame(v23bFrame);
}
function v23bApplyQuality() {
  var q = v23bQualityKey();
  V23B.quality = q;
  V23B.qualityApplied = q;
  var s = V23B.backdrop;
  if (!s) return;
  var low = q === 'bajo';
  var high = q === 'alto';
  if (s.dust) s.dust.visible = !low;
  if (s.motes) s.motes.geometry.setDrawRange(0, low ? 34 : high ? 120 : 78);
  if (s.stars) s.stars.geometry.setDrawRange(0, low ? 220 : high ? 460 : 340);
  if (s.sphereDust) s.sphereDust.geometry.setDrawRange(0, low ? 36 : 90);
  s.clusters.forEach(function (c, idx) {
    var portrait = (window.innerWidth || 1) < (window.innerHeight || 1) * 0.92;
    c.visible = !portrait && (!low || idx < 5);
  });
  if (V23B.renderer) {
    V23B.renderer.setPixelRatio(v23bPixelRatio());
    V23B.renderer.setSize(window.innerWidth || 1, window.innerHeight || 1, false);
  }
}

/* -------------------------------------------------------------------------
   Sincronización con pantallas y tutorial
   ------------------------------------------------------------------------- */
function v23bSyncScreen() {
  if (!V23B.renderer) return;
  var isTutorial = false;
  try { isTutorial = !!(V23 && V23.tutorial && V23.tutorial.active); } catch (e) {}
  var current = '';
  try { current = (typeof screen === 'string') ? screen : ''; } catch (e) {}
  if (isTutorial) { if (V23B.mode !== 'tutorial') v23bSetMode('tutorial'); return; }
  if (current === 'title') { if (V23B.mode !== 'welcome') v23bSetMode('welcome'); return; }
  if (V23B.mode) v23bSetMode(null);
}
function v23bOpenWelcome() {
  if (!V23B.renderer) return;
  v23bSyncScreen();
  v23bSetMode('welcome');
}
function v23bOpenTutorial(step) {
  if (!V23B.renderer) return;
  v23bSyncScreen();
  v23bSetMode('tutorial');
  v23bSetStep(step == null ? 0 : step, true);
}
function v23bCloseTutorial() {
  v23bSyncScreen();
}
function v23bAfterTitlePaint() {
  if (!V23B.renderer) return;
  try {
    if (V23 && V23.tutorial && V23.tutorial.active) return;
    v23bSetMode('welcome');
  } catch (e) {}
}

/* -------------------------------------------------------------------------
   Init y enganches
   ------------------------------------------------------------------------- */
function v23bInit() {
  if (V23B.ready || V23B.failed) return;
  if (!window.THREE) { V23B.failed = 'three'; return; }
  var renderer = v23bCreateRenderer();
  if (!renderer) return;
  v23bBuildScene();
  V23B.ready = true;
  document.body.classList.add('v23bReady');
  V23B._resizeAt = v23bNow();
  window.addEventListener('resize', function () {
    if (V23B._resizeAt && v23bNow() - V23B._resizeAt < 40) return;
    V23B._resizeAt = v23bNow();
    v23bResize();
    v23bUpdateZoneAndCamera(true);
    v23bLayoutBackdrop();
  }, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', function () { v23bResize(); v23bUpdateZoneAndCamera(true); }, { passive: true });
  }
  window.addEventListener('pointermove', v23bOnPointer, { passive: true });
  window.addEventListener('v23b:title-painted', v23bAfterTitlePaint);
  window.addEventListener('v23b:tutorial-opened', function (e) {
    var step = e && e.detail && typeof e.detail.step === 'number' ? e.detail.step : 0;
    v23bOpenTutorial(step);
  });
  window.addEventListener('v23b:tutorial-step', function (e) {
    var step = e && e.detail && typeof e.detail.step === 'number' ? e.detail.step : 0;
    v23bSetStep(step, !!(e && e.detail && e.detail.immediate));
  });
  window.addEventListener('v23b:tutorial-closed', v23bCloseTutorial);
  window.addEventListener('v23b:settings-changed', function () {
    V23B.reduced = !v23bMotionAllowed();
    v23bApplyQuality();
    v23bUpdateZoneAndCamera(true);
  });
  /* setScreen se envuelve una sola vez para saber cuándo el cine debe estar
     visible. No cambia el comportamiento de la pantalla. */
  try {
    if (typeof setScreen === 'function' && !setScreen.__v23bWrapped) {
      var originalSetScreen = setScreen;
      var wrapped = function (next) {
        var out = originalSetScreen.apply(null, arguments);
        try { v23bSyncScreen(); } catch (e) {}
        return out;
      };
      wrapped.__v23bWrapped = true;
      setScreen = wrapped;
    }
  } catch (e) {}
  v23bLayoutBackdrop();
  v23bSyncScreen();
  V23B._tickHandle = requestAnimationFrame(v23bFrame);
  try { window.dispatchEvent(new CustomEvent('v23b:ready')); } catch (e) {}
  try {
    if (typeof sendRenders === 'function') { /* no interferir con el Game Studio */ }
  } catch (e) {}
}

/* API pública de QA (solo lectura/control de presentación). */
window.__v23b = {
  version: V23B.version,
  canvasId: V23B.canvasId,
  rendererId: V23B.rendererId,
  sceneId: V23B.sceneId,
  ready: function () { return V23B.ready; },
  failed: function () { return V23B.failed; },
  active: function () { return V23B.active; },
  mode: function () { return V23B.mode; },
  step: function () { return V23B.step; },
  canvas: function () { return V23B.canvas; },
  renderer: function () { return V23B.renderer; },
  scene: function () { return V23B.scene; },
  frameCount: function () { return V23B.frameCount; },
  fps: function () { return Math.round(V23B.fps * 10) / 10; },
  creationCount: function () { return { canvases: document.querySelectorAll('#v23bCinema').length, renderers: V23B.renderer ? 1 : 0 }; },
  zone: function () { var z = V23B.zone; return z ? { x: Math.round(z.x), y: Math.round(z.y), w: Math.round(z.w), h: Math.round(z.h) } : null; },
  framing: function () { return V23B._lastFit || null; },
  projectedMargins: function () {
    var fit = v23bFitForMode();
    return fit ? v23bProjectedMargins(fit, v23bZoneAspect(), 1, 1) : null;
  },
  liveMargins: function () {
    var c = v23bCurrentFitGroup();
    var cam = V23B.heroCamera;
    if (!c || !cam) return null;
    var box = v23bBoxOf(c.objects);
    var live = new THREE.PerspectiveCamera(cam.fov, cam.aspect, cam.near, cam.far);
    live.position.copy(cam.position);
    var dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    live.lookAt(cam.position.clone().add(dir.multiplyScalar(4)));
    live.updateMatrixWorld(true);
    live.updateProjectionMatrix();
    return v23bMarginsForBox(box, live);
  },
  openWelcome: v23bOpenWelcome,
  openTutorial: v23bOpenTutorial,
  setStep: v23bSetStep,
  close: function () { v23bSetMode(null); },
  quality: function () { return V23B.quality; },
  reduced: function () { return V23B.reduced; },
  stats: function () {
    var s = V23B.backdrop;
    var activeParticles = 0;
    var clusters = 0;
    if (s) {
      if (s.motes) activeParticles += s.motes.geometry.drawRange.count === Infinity ? s.motes.geometry.attributes.position.count : s.motes.geometry.drawRange.count;
      if (s.stars) activeParticles += s.stars.geometry.drawRange.count === Infinity ? s.stars.geometry.attributes.position.count : s.stars.geometry.drawRange.count;
      if (s.sphereDust) activeParticles += s.sphereDust.geometry.drawRange.count === Infinity ? s.sphereDust.geometry.attributes.position.count : s.sphereDust.geometry.drawRange.count;
      if (s.dust && s.dust.visible) activeParticles += s.dust.geometry.attributes.position.count;
      clusters = s.clusters.filter(function (c) { return c.visible; }).length;
    }
    return {
      avatars: V23B.stats.avatars,
      draws: V23B.stats.draws,
      particles: V23B.stats.particles,
      activeParticles: activeParticles,
      clusters: clusters,
      quality: V23B.quality,
      reduced: V23B.reduced,
      canvasNode: V23B.canvas ? (V23B.canvas === document.getElementById('v23bCinema')) : false
    };
  },
  errors: function () { return V23B.errors.slice(); },
  skipWorldRender: function () { return !!(V23B.active && V23B.ready); }
};

/* Arranque diferido: no retrasa el boot del juego ni la primera pantalla. */
window.setTimeout(function () {
  v23bSafe('init', v23bInit);
}, 30);
