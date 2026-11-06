/* =========================================================================
   MUNDO VOXEL — observatorio, héroes, guardianes y arena de duelo
   ========================================================================= */
var THREE = window.THREE;
var canvas = document.getElementById('game');
var parentWindow = window.parent && window.parent !== window ? window.parent : null;
function post(message) {
  if (!parentWindow) return;
  message.source = 'dsh-game-studio';
  try { parentWindow.postMessage(message, '*'); } catch (e) {}
}
function reportError(text) { post({ type: 'error', message: String(text).slice(0, 300) }); }
window.addEventListener('error', function (event) { reportError(event.message || event.error || 'error'); });
window.addEventListener('unhandledrejection', function (event) {
  var reason = event.reason;
  reportError((reason && reason.message) || reason || 'unhandled rejection');
});

var renderer = null;
try {
  if (!THREE) throw new Error('no se encontró el runtime de three.js');
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
} catch (error) {
  renderer = null;
  var fail = document.createElement('div');
  fail.className = 'loadingShell';
  fail.innerHTML = '<div><div class="loadingRune"></div><b>El observatorio necesita WebGL</b><small>No se pudo iniciar el render 3D. Prueba con otro navegador o activa la aceleración por hardware.</small></div>';
  document.body.appendChild(fail);
  reportError('WebGL no disponible: ' + (error && error.message || error));
}
if (renderer) {
  canvas.addEventListener('webglcontextlost', function (event) { event.preventDefault(); reportError('El contexto WebGL se perdió.'); });
}

var scene = new THREE.Scene();
scene.fog = new THREE.Fog(RULES.palette ? RULES.palette.fog : '#090e1a', 28, 78);
var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 500);
var clock = 0;
var ARENA_POS = new THREE.Vector3(160, 0, -64);
var HUB_RADIUS = Number(RULES.worldRadius) || 9.2;
var BOX = new THREE.BoxGeometry(1, 1, 1);
var dummy = new THREE.Object3D();
var palette = RULES.palette || {};

function color(hex) { return new THREE.Color(hex); }
function mulberry32(seed) {
  var a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
var rng = mulberry32(Number(RULES.seed) || 41);

function radialTexture(stops, size) {
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
var GLOW_TEX = radialTexture([[0, 'rgba(255,255,255,1)'], [0.24, 'rgba(255,240,206,0.6)'], [1, 'rgba(255,255,255,0)']]);
var SOFT_GLOW = radialTexture([[0, 'rgba(255,255,255,0.6)'], [0.45, 'rgba(255,255,255,0.15)'], [1, 'rgba(255,255,255,0)']], 64);
var BLOB_TEX = radialTexture([[0, 'rgba(0,0,0,0.5)'], [0.55, 'rgba(0,0,0,0.24)'], [1, 'rgba(0,0,0,0)']], 64);

function makeGlowSprite(hex, scale, opacity) {
  var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: GLOW_TEX,
    color: color(hex),
    transparent: true,
    opacity: opacity == null ? 0.6 : opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false
  }));
  sprite.scale.set(scale || 4, scale || 4, 1);
  return sprite;
}
function makeBlob(radius) {
  var mesh = new THREE.Mesh(new THREE.PlaneGeometry(radius, radius), new THREE.MeshBasicMaterial({ map: BLOB_TEX, transparent: true, opacity: 0.7, depthWrite: false }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.015;
  mesh.renderOrder = 2;
  return mesh;
}

/** Merges a list of boxes into one vertex-coloured mesh per material kind.
 *  Box format: [x, y, z, width, height, depth, colour, glow] */
function mergedVoxels(boxes) {
  var groups = [[], []];
  for (var i = 0; i < boxes.length; i++) groups[boxes[i][7] ? 1 : 0].push(boxes[i]);
  var out = new THREE.Group();
  for (var p = 0; p < 2; p++) {
    if (!groups[p].length) continue;
    var positions = [], normals = [], colors = [], indices = [];
    for (var b = 0; b < groups[p].length; b++) {
      var box = groups[p][b];
      var geo = new THREE.BoxGeometry(box[3], box[4], box[5]);
      geo.translate(box[0], box[1], box[2]);
      var pos = geo.attributes.position, nor = geo.attributes.normal, base = positions.length / 3;
      var tint = color(box[6]);
      for (var v = 0; v < pos.count; v++) {
        positions.push(pos.getX(v), pos.getY(v), pos.getZ(v));
        normals.push(nor.getX(v), nor.getY(v), nor.getZ(v));
        colors.push(tint.r, tint.g, tint.b);
      }
      var index = geo.index.array;
      for (var k = 0; k < index.length; k++) indices.push(base + index[k]);
      geo.dispose();
    }
    var merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    merged.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    merged.setIndex(indices);
    merged.computeBoundingSphere();
    var material = p === 0
      ? new THREE.MeshLambertMaterial({ vertexColors: true })
      : new THREE.MeshBasicMaterial({ vertexColors: true });
    var mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = p === 0;
    mesh.receiveShadow = p === 0;
    out.add(mesh);
  }
  return out;
}

function addVoxel(parent, boxes) {
  var model = mergedVoxels(boxes);
  parent.add(model);
  return model;
}

function addLabelSprite(text, subtext, accent, scale) {
  var c = document.createElement('canvas');
  c.width = 640; c.height = 188;
  var g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = 'rgba(5,8,14,0.70)';
  roundedRect(g, 40, 26, 560, 124, 16);
  g.fill();
  g.strokeStyle = accent;
  g.globalAlpha = 0.55;
  g.lineWidth = 2;
  roundedRect(g, 40, 26, 560, 124, 16);
  g.stroke();
  g.globalAlpha = 1;
  g.fillStyle = accent;
  g.fillRect(c.width / 2 - 50, 26, 100, 2);
  g.font = '800 34px "Bahnschrift","Segoe UI",sans-serif';
  g.fillStyle = '#f1f3f8';
  g.fillText(String(text).toUpperCase().slice(0, 28), c.width / 2, 78);
  g.font = '700 20px "Segoe UI",sans-serif';
  g.fillStyle = 'rgba(194,205,225,0.9)';
  g.fillText(String(subtext || '').toUpperCase().slice(0, 38), c.width / 2, 116);
  var tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  var sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, fog: false }));
  var s = scale || 3.4;
  sprite.scale.set(s, s * 0.294, 1);
  sprite.renderOrder = 20;
  return sprite;
}
function roundedRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/* -------------------------------------------------------------------------
   Héroe voxel modular
   ------------------------------------------------------------------------- */
function heroLook(id) { return HERO_LOOKS[id] || HERO_LOOKS.ilan; }
function addPartBoxes(part, boxes) {
  var mesh = mergedVoxels(boxes);
  part.add(mesh);
  return mesh;
}
function makeHead(look, id) {
  var pivot = new THREE.Group();
  pivot.position.set(0, 1.68, 0);
  pivot.userData.baseHatGroups = [];
  var headColor = look.skin;
  var boxes = [
    [0, 0.06, 0, 0.20, 0.12, 0.18, look.skinShade],
    [0, 0.30, 0, 0.49, 0.48, 0.44, headColor],
    [0, 0.30, 0.225, 0.31, 0.32, 0.015, look.skin],
    [-0.255, 0.30, 0.0, 0.04, 0.16, 0.14, look.skinShade],
    [0.255, 0.30, 0.0, 0.04, 0.16, 0.14, look.skinShade],
    [-0.105, 0.34, 0.232, 0.075, 0.075, 0.015, '#1b2028'],
    [0.105, 0.34, 0.232, 0.075, 0.075, 0.015, '#1b2028'],
    [-0.105, 0.352, 0.24, 0.026, 0.026, 0.006, look.accent, true],
    [0.105, 0.352, 0.24, 0.026, 0.026, 0.006, look.accent, true],
    [0, 0.255, 0.246, 0.06, 0.12, 0.02, look.skinShade],
    [0, 0.17, 0.243, 0.14, 0.045, 0.012, '#613b35']
  ];
  addPartBoxes(pivot, boxes);
  var ext = [];
  var hair = look.hair;
  var hs = look.hairStyle;
  if (hs === 'side') {
    ext.push([0, 0.58, -0.02, 0.52, 0.16, 0.48, hair]);
    ext.push([-0.23, 0.47, -0.06, 0.08, 0.28, 0.38, hair]);
    ext.push([0.16, 0.54, 0.23, 0.16, 0.10, 0.08, hair]);
    ext.push([0, 0.29, -0.24, 0.52, 0.4, 0.10, hair]);
  } else if (hs === 'bob') {
    ext.push([0, 0.56, -0.01, 0.55, 0.18, 0.50, hair]);
    ext.push([-0.24, 0.38, -0.02, 0.08, 0.38, 0.46, hair]);
    ext.push([0.24, 0.38, -0.02, 0.08, 0.38, 0.46, hair]);
    ext.push([0, 0.25, -0.25, 0.50, 0.55, 0.10, hair]);
    ext.push([-0.16, 0.51, 0.23, 0.22, 0.09, 0.08, hair]);
  } else if (hs === 'ponytail') {
    ext.push([0, 0.58, -0.01, 0.53, 0.15, 0.48, hair]);
    ext.push([-0.23, 0.46, -0.04, 0.08, 0.28, 0.4, hair]);
    ext.push([0.2, 0.35, -0.31, 0.18, 0.5, 0.15, hair]);
    ext.push([0.23, 0.05, -0.36, 0.14, 0.26, 0.12, hair]);
  } else if (hs === 'highPony') {
    ext.push([0, 0.59, -0.04, 0.50, 0.13, 0.44, hair]);
    ext.push([-0.19, 0.65, -0.1, 0.16, 0.2, 0.18, hair]);
    ext.push([0.12, 0.72, -0.18, 0.13, 0.42, 0.12, hair]);
    ext.push([0.18, 0.97, -0.23, 0.12, 0.32, 0.1, hair]);
    ext.push([-0.23, 0.38, -0.03, 0.07, 0.25, 0.36, hair]);
  } else if (hs === 'bun') {
    ext.push([0, 0.57, -0.02, 0.52, 0.16, 0.46, hair]);
    ext.push([0, 0.8, -0.16, 0.27, 0.24, 0.27, hair]);
    ext.push([-0.23, 0.44, -0.02, 0.07, 0.28, 0.4, hair]);
    ext.push([0.20, 0.48, 0.23, 0.11, 0.22, 0.07, hair]);
  } else if (hs === 'short') {
    ext.push([0, 0.56, -0.01, 0.53, 0.16, 0.47, hair]);
    ext.push([-0.23, 0.45, -0.02, 0.07, 0.22, 0.4, hair]);
    ext.push([0.23, 0.45, -0.02, 0.07, 0.22, 0.4, hair]);
  } else if (hs === 'bald') {
    ext.push([-0.19, 0.48, 0.23, 0.16, 0.07, 0.03, look.skinShade]);
    ext.push([0.05, 0.50, 0.235, 0.09, 0.04, 0.02, look.skinShade]);
  } else if (hs === 'bunBeard') {
    ext.push([0, 0.58, -0.01, 0.53, 0.16, 0.47, hair]);
    ext.push([-0.23, 0.45, -0.02, 0.08, 0.28, 0.42, hair]);
    ext.push([0.23, 0.45, -0.02, 0.08, 0.28, 0.42, hair]);
    ext.push([0, 0.82, -0.13, 0.26, 0.23, 0.26, hair]);
    ext.push([0, 0.1, 0.26, 0.35, 0.27, 0.12, hair]);
    ext.push([0, -0.03, 0.22, 0.25, 0.18, 0.09, hair]);
  } else if (hs === 'long') {
    ext.push([0, 0.58, -0.02, 0.54, 0.16, 0.48, hair]);
    ext.push([-0.25, 0.32, -0.02, 0.1, 0.55, 0.46, hair]);
    ext.push([0.25, 0.32, -0.02, 0.1, 0.55, 0.46, hair]);
    ext.push([0, 0.1, -0.28, 0.5, 0.7, 0.11, hair]);
    ext.push([-0.18, 0.53, 0.23, 0.18, 0.08, 0.08, hair]);
  } else if (hs === 'longBeard') {
    ext.push([0, 0.6, -0.02, 0.55, 0.14, 0.5, hair]);
    ext.push([-0.25, 0.37, -0.03, 0.08, 0.4, 0.44, hair]);
    ext.push([0.25, 0.37, -0.03, 0.08, 0.4, 0.44, hair]);
    ext.push([0, 0.62, 0.22, 0.36, 0.08, 0.06, hair]);
    ext.push([0, 0.04, 0.255, 0.4, 0.4, 0.13, hair]);
    ext.push([0, -0.23, 0.22, 0.27, 0.25, 0.09, hair]);
  }
  if (look.extra === 'headband') {
    ext.push([0, 0.49, 0.23, 0.51, 0.055, 0.04, look.trim, true]);
    ext.push([0.21, 0.49, 0.18, 0.08, 0.075, 0.11, look.accent, true]);
  }
  if (look.extra === 'brim') {
    var brim = new THREE.Group();
    addPartBoxes(brim, [
      [0, 0.61, 0.0, 0.82, 0.075, 0.76, look.outfit2],
      [0, 0.69, 0.0, 0.45, 0.18, 0.4, look.outfit],
      [0, 0.61, 0.38, 0.63, 0.05, 0.03, look.trim],
      [0, 0.55, 0.27, 0.22, 0.08, 0.02, look.accent, true]
    ]);
    pivot.add(brim);
    pivot.userData.baseHatGroups.push(brim);
  }
  if (look.extra === 'glasses') {
    ext.push([-0.11, 0.34, 0.255, 0.16, 0.11, 0.035, '#26344b']);
    ext.push([0.11, 0.34, 0.255, 0.16, 0.11, 0.035, '#26344b']);
    ext.push([0, 0.34, 0.26, 0.09, 0.025, 0.02, look.trim]);
    ext.push([-0.11, 0.34, 0.266, 0.1, 0.055, 0.01, look.accent, true]);
    ext.push([0.11, 0.34, 0.266, 0.1, 0.055, 0.01, look.accent, true]);
  }
  if (look.extra === 'earring') {
    ext.push([0.26, 0.22, 0.05, 0.04, 0.12, 0.04, look.trim, true]);
  }
  if (look.extra === 'hood') {
    var hood = new THREE.Group();
    addPartBoxes(hood, [
      [0, 0.42, -0.07, 0.65, 0.35, 0.58, look.outfit],
      [-0.31, 0.34, 0.0, 0.09, 0.5, 0.45, look.outfit],
      [0.31, 0.34, 0.0, 0.09, 0.5, 0.45, look.outfit],
      [0, 0.62, -0.03, 0.56, 0.13, 0.52, look.outfit2],
      [0, 0.42, 0.21, 0.3, 0.26, 0.04, look.accent, true]
    ]);
    pivot.add(hood);
    pivot.userData.baseHatGroups.push(hood);
  }
  if (look.extra === 'cowl') {
    var cowl = new THREE.Group();
    addPartBoxes(cowl, [
      [0, 0.48, -0.06, 0.67, 0.3, 0.57, look.outfit],
      [-0.3, 0.35, 0.03, 0.11, 0.48, 0.43, look.outfit2],
      [0.3, 0.35, 0.03, 0.11, 0.48, 0.43, look.outfit2],
      [0, 0.66, -0.14, 0.32, 0.17, 0.2, look.outfit],
      [0, 0.48, 0.24, 0.24, 0.07, 0.04, look.trim, true]
    ]);
    pivot.add(cowl);
    pivot.userData.baseHatGroups.push(cowl);
  }
  if (look.extra === 'halo') {
    var haloMat = new THREE.MeshBasicMaterial({ color: color(look.trim) });
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.018, 4, 20), haloMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.77;
    pivot.add(ring);
  }
  /* Accesorios de identidad: no son color, son silueta. */
  if (id === 'ilan') {
    ext.push([-0.26, 0.49, 0.2, 0.16, 0.04, 0.02, look.trim, true]);
    ext.push([0.27, 0.27, 0.08, 0.03, 0.08, 0.03, look.trim]);
  } else if (id === 'mara') {
    ext.push([0.27, 0.79, 0.02, 0.055, 0.32, 0.03, '#e6c07a']);
    ext.push([0.28, 0.93, 0.01, 0.04, 0.18, 0.02, look.accent, true]);
    ext.push([0, 0.54, 0.255, 0.34, 0.075, 0.025, '#ddba70']);
  } else if (id === 'noa') {
    ext.push([0.24, 0.43, -0.05, 0.035, 0.28, 0.035, '#d9b65b']);
    ext.push([0.255, 0.57, -0.05, 0.065, 0.055, 0.045, look.accent, true]);
    ext.push([-0.21, 0.39, -0.2, 0.06, 0.16, 0.06, look.outfit2]);
  } else if (id === 'teo') {
    ext.push([0, 0.61, 0.18, 0.42, 0.035, 0.04, look.trim, true]);
    ext.push([0, 0.58, 0.22, 0.055, 0.055, 0.03, '#f2e8ff', true]);
    ext.push([0.25, 0.24, 0.08, 0.035, 0.09, 0.035, look.outfit2]);
  } else if (id === 'lia') {
    ext.push([0, 0.56, 0.235, 0.35, 0.035, 0.015, look.trim]);
    ext.push([-0.24, 0.46, 0.08, 0.04, 0.16, 0.06, look.outfit2]);
    ext.push([0.26, 0.21, 0.05, 0.045, 0.14, 0.045, look.trim, true]);
  } else if (id === 'kian') {
    ext.push([0, 0.51, 0.225, 0.43, 0.09, 0.055, '#8f9daa']);
    ext.push([0, 0.455, 0.257, 0.16, 0.11, 0.018, look.accent, true]);
    ext.push([-0.29, 0.38, 0.06, 0.06, 0.08, 0.06, look.trim]);
  } else if (id === 'amaru') {
    ext.push([-0.18, 0.51, 0.225, 0.105, 0.085, 0.04, '#19241e']);
    ext.push([0.18, 0.51, 0.225, 0.105, 0.085, 0.04, '#19241e']);
    ext.push([-0.18, 0.51, 0.248, 0.065, 0.055, 0.012, look.accent, true]);
    ext.push([0.18, 0.51, 0.248, 0.065, 0.055, 0.012, look.accent, true]);
    ext.push([0.32, 0.58, 0.02, 0.05, 0.22, 0.04, '#d6b774']);
  } else if (id === 'ona') {
    ext.push([-0.18, 0.35, 0.258, 0.17, 0.12, 0.025, '#121d31']);
    ext.push([-0.18, 0.35, 0.275, 0.1, 0.065, 0.014, look.accent, true]);
    ext.push([0.25, 0.38, 0.06, 0.045, 0.17, 0.055, look.trim]);
    ext.push([0, 0.78, 0.02, 0.05, 0.18, 0.05, look.trim]);
  } else if (id === 'iris') {
    ext.push([0, 0.59, 0.235, 0.4, 0.03, 0.018, look.trim, true]);
    ext.push([-0.26, 0.28, 0.08, 0.035, 0.22, 0.06, '#ddd2bd']);
    ext.push([0.26, 0.28, 0.08, 0.035, 0.22, 0.06, '#ddd2bd']);
    ext.push([0, 0.83, 0.02, 0.12, 0.035, 0.03, look.trim, true]);
  } else if (id === 'zenon') {
    ext.push([-0.12, 0.35, 0.25, 0.11, 0.09, 0.028, '#2a2013']);
    ext.push([-0.12, 0.35, 0.268, 0.07, 0.05, 0.012, look.accent, true]);
    ext.push([0.25, 0.24, 0.055, 0.04, 0.11, 0.04, '#d4b36a']);
    ext.push([0, 0.62, 0.18, 0.38, 0.03, 0.035, look.trim]);
  }
  if (ext.length) addPartBoxes(pivot, ext);
  return pivot;
}
function makeHairTail(id, look) {
  var g = new THREE.Group();
  if (id === 'mara') {
    g.position.set(0.02, 0.37, -0.28);
    addPartBoxes(g, [
      [0, -0.13, 0, 0.15, 0.25, 0.12, look.hair],
      [0.02, -0.38, -0.02, 0.12, 0.3, 0.1, look.hair],
      [0.04, -0.58, -0.03, 0.08, 0.18, 0.08, look.hair]
    ]);
    return g;
  }
  if (id === 'lia') {
    g.position.set(0.16, 0.83, -0.22);
    addPartBoxes(g, [
      [0, -0.18, 0, 0.14, 0.3, 0.13, look.hair],
      [0.03, -0.46, -0.02, 0.12, 0.32, 0.1, look.hair],
      [0.05, -0.73, -0.02, 0.09, 0.26, 0.08, look.hair],
      [0, -0.31, 0.075, 0.17, 0.07, 0.03, look.trim, true]
    ]);
    return g;
  }
  if (id === 'iris') {
    g.position.set(0, 0.57, -0.22);
    addPartBoxes(g, [
      [0, -0.18, 0, 0.46, 0.42, 0.14, look.hair],
      [-0.21, -0.48, 0.01, 0.13, 0.4, 0.1, look.hair],
      [0.21, -0.48, 0.01, 0.13, 0.4, 0.1, look.hair],
      [0, -0.72, 0, 0.34, 0.36, 0.1, look.hair],
      [0, -0.91, 0, 0.2, 0.22, 0.06, look.hair]
    ]);
    return g;
  }
  if (id === 'zenon') {
    g.position.set(0, 0.12, 0.26);
    addPartBoxes(g, [
      [0, -0.16, 0, 0.28, 0.3, 0.1, look.hair],
      [0, -0.38, -0.02, 0.19, 0.24, 0.08, look.hair],
      [0, -0.54, -0.025, 0.1, 0.14, 0.06, look.hair]
    ]);
    return g;
  }
  if (id === 'teo') {
    g.position.set(0, 0.12, 0.25);
    addPartBoxes(g, [
      [0, -0.12, 0, 0.2, 0.18, 0.07, look.hair],
      [0, -0.24, -0.01, 0.12, 0.12, 0.05, look.hair]
    ]);
    return g;
  }
  return null;
}
function makeCapeGroup(id, look) {
  var g = new THREE.Group();
  if (id === 'ilan') {
    g.position.set(0, 1.58, -0.26);
    addPartBoxes(g, [
      [-0.22, -0.42, 0, 0.32, 0.76, 0.075, look.outfit2],
      [-0.22, -0.8, 0.005, 0.28, 0.08, 0.065, look.trim],
      [0.2, -0.27, 0, 0.27, 0.5, 0.065, look.outfit],
      [0.2, -0.52, 0.005, 0.24, 0.06, 0.055, look.trim]
    ]);
    return g;
  }
  if (id === 'noa') {
    g.position.set(0, 1.52, -0.25);
    addPartBoxes(g, [
      [-0.18, -0.46, 0, 0.28, 0.88, 0.065, look.outfit],
      [0.18, -0.46, 0, 0.28, 0.88, 0.065, look.outfit],
      [-0.18, -0.91, 0, 0.26, 0.06, 0.055, look.outfit2],
      [0.18, -0.91, 0, 0.26, 0.06, 0.055, look.outfit2],
      [0.18, -0.52, 0.04, 0.13, 0.12, 0.03, look.trim]
    ]);
    return g;
  }
  if (id === 'lia') {
    g.position.set(-0.15, 1.56, -0.24);
    addPartBoxes(g, [
      [0, -0.28, 0, 0.24, 0.48, 0.065, look.outfit2],
      [0.07, -0.58, 0.005, 0.16, 0.3, 0.055, look.trim],
      [0.1, -0.74, 0.005, 0.09, 0.16, 0.04, look.accent, true]
    ]);
    return g;
  }
  if (id === 'kian') {
    g.position.set(0, 1.6, -0.28);
    addPartBoxes(g, [
      [0, -0.28, 0, 0.98, 0.56, 0.08, look.outfit2],
      [0, -0.55, 0, 0.9, 0.06, 0.065, look.trim],
      [-0.52, -0.16, 0.02, 0.1, 0.3, 0.12, look.outfit]
    ]);
    return g;
  }
  if (id === 'amaru') {
    g.position.set(0, 1.54, -0.27);
    addPartBoxes(g, [
      [0, -0.42, 0, 0.94, 0.88, 0.07, look.outfit2],
      [-0.42, -0.34, 0.01, 0.12, 0.6, 0.075, look.outfit],
      [0.42, -0.34, 0.01, 0.12, 0.6, 0.075, look.outfit],
      [0, -0.72, 0.01, 0.68, 0.07, 0.06, look.trim],
      [0, -0.5, 0.045, 0.2, 0.08, 0.03, look.trim, true]
    ]);
    return g;
  }
  if (id === 'ona') {
    g.position.set(0, 1.6, -0.26);
    addPartBoxes(g, [
      [-0.2, -0.46, 0, 0.3, 0.92, 0.07, look.outfit2],
      [0.2, -0.46, 0, 0.3, 0.92, 0.07, look.outfit2],
      [-0.2, -0.91, 0.005, 0.26, 0.06, 0.06, look.trim],
      [0.2, -0.91, 0.005, 0.26, 0.06, 0.06, look.trim],
      [0.34, -0.3, 0.02, 0.12, 0.08, 0.03, look.accent, true]
    ]);
    return g;
  }
  if (id === 'iris') {
    g.position.set(0, 1.6, -0.28);
    addPartBoxes(g, [
      [-0.32, -0.58, 0, 0.34, 1.02, 0.075, look.outfit],
      [0.32, -0.58, 0, 0.34, 1.02, 0.075, look.outfit],
      [0, -0.82, 0.01, 0.32, 0.56, 0.075, look.outfit2],
      [-0.32, -1.08, 0.005, 0.3, 0.06, 0.06, look.trim],
      [0.32, -1.08, 0.005, 0.3, 0.06, 0.06, look.trim],
      [0, -1.12, 0.005, 0.28, 0.04, 0.05, look.accent, true]
    ]);
    return g;
  }
  if (id === 'zenon') {
    g.position.set(0, 1.6, -0.28);
    addPartBoxes(g, [
      [0, -0.52, 0, 1.0, 0.92, 0.075, look.outfit],
      [0, -0.48, 0.02, 0.86, 0.1, 0.07, look.outfit2],
      [-0.4, -0.8, 0.01, 0.22, 0.4, 0.065, look.outfit2],
      [0.4, -0.8, 0.01, 0.22, 0.4, 0.065, look.outfit2],
      [0, -0.97, 0.005, 0.72, 0.055, 0.06, look.trim]
    ]);
    return g;
  }
  if (id === 'mara') {
    g.position.set(0, 1.56, -0.27);
    addPartBoxes(g, [
      [0, -0.42, 0, 0.88, 0.62, 0.075, look.outfit2],
      [0, -0.62, 0.005, 0.92, 0.06, 0.06, look.trim],
      [0, -0.36, 0.04, 0.3, 0.08, 0.03, look.accent, true]
    ]);
    return g;
  }
  return null;
}
function makeIdentityDetails(id, look, torso, body, head) {
  var t = [], b = [];
  var out = { cape: null, hairTail: null, floaters: null };
  if (id === 'ilan') {
    t.push([0, 0.72, 0.01, 0.48, 0.18, 0.33, look.outfit2]);
    t.push([0, 0.79, 0.17, 0.18, 0.14, 0.04, look.trim]);
    t.push([-0.22, 0.42, 0.215, 0.16, 0.2, 0.02, look.outfit2]);
    t.push([0.24, 0.36, 0.214, 0.1, 0.12, 0.02, look.trim]);
    b.push([0.34, 0.88, 0.05, 0.24, 0.2, 0.16, '#6a5135']);
  } else if (id === 'mara') {
    t.push([0, 0.71, 0.02, 0.66, 0.16, 0.42, '#d8b76f']);
    t.push([0.2, 0.59, 0.22, 0.12, 0.23, 0.03, '#d8b76f']);
    t.push([0, 0.18, 0, 0.78, 0.1, 0.46, '#5e4431']);
    t.push([-0.24, 0.18, 0.23, 0.13, 0.09, 0.03, look.trim]);
    b.push([0, 1.26, -0.34, 0.5, 0.56, 0.23, '#5b402c']);
    b.push([0, 1.47, -0.46, 0.44, 0.15, 0.12, '#d2b276']);
    b.push([0, 1.62, -0.37, 0.88, 0.14, 0.14, '#c7a66c']);
    b.push([-0.44, 1.62, -0.37, 0.07, 0.16, 0.16, '#7a613d']);
    b.push([0.44, 1.62, -0.37, 0.07, 0.16, 0.16, '#7a613d']);
    b.push([-0.3, 0.93, 0.13, 0.2, 0.22, 0.17, '#72563a']);
  } else if (id === 'noa') {
    t.push([0, 0.74, 0.01, 0.42, 0.2, 0.3, look.outfit]);
    t.push([0, 0.78, 0.16, 0.16, 0.12, 0.03, look.outfit2]);
    t.push([0.22, 0.38, 0.212, 0.14, 0.13, 0.026, look.outfit2]);
    t.push([0.22, 0.42, 0.227, 0.09, 0.025, 0.012, look.trim, true]);
    t.push([-0.2, 0.5, 0.215, 0.07, 0.32, 0.02, '#c4ced9']);
    b.push([0.27, 0.93, -0.31, 0.12, 0.55, 0.12, '#7b8faf']);
    b.push([0.32, 0.78, 0.03, 0.24, 0.1, 0.18, '#7b8faf']);
  } else if (id === 'teo') {
    t.push([0, 0.63, 0, 1.02, 0.24, 0.48, look.outfit2]);
    t.push([0, 0.66, 0.25, 0.32, 0.05, 0.03, look.trim, true]);
    t.push([-0.24, 0.31, 0.215, 0.07, 0.07, 0.025, '#d2c7e2']);
    t.push([0.22, 0.31, 0.215, 0.07, 0.07, 0.025, '#d2c7e2']);
    t.push([0, 0.21, 0.22, 0.06, 0.06, 0.025, look.accent, true]);
    b.push([-0.38, 0.82, 0.03, 0.16, 0.26, 0.21, '#6b547e']);
    b.push([0.38, 0.82, 0.03, 0.16, 0.26, 0.21, '#6b547e']);
    b.push([0.3, 1.04, 0.02, 0.22, 0.18, 0.12, '#8e693a']);
  } else if (id === 'lia') {
    t.push([-0.34, 0.56, 0, 0.32, 0.15, 0.36, look.outfit2]);
    t.push([-0.37, 0.5, 0.03, 0.26, 0.06, 0.28, look.trim]);
    t.push([0.22, 0.24, 0.215, 0.15, 0.09, 0.02, look.trim]);
    t.push([0, 0.73, 0.18, 0.18, 0.04, 0.025, look.accent, true]);
    b.push([0.3, 0.94, 0.08, 0.2, 0.18, 0.15, '#4a2432']);
    b.push([0.32, 0.82, -0.18, 0.13, 0.4, 0.08, look.outfit2]);
  } else if (id === 'kian') {
    t.push([-0.42, 0.6, 0, 0.3, 0.2, 0.38, look.outfit2]);
    t.push([0.42, 0.6, 0, 0.3, 0.2, 0.38, look.outfit2]);
    t.push([0, 0.39, 0.226, 0.68, 0.44, 0.075, look.outfit2]);
    t.push([0, 0.42, 0.27, 0.16, 0.16, 0.026, look.accent, true]);
    t.push([0, 0.18, 0, 0.84, 0.13, 0.48, '#1d262f']);
    b.push([-0.4, 0.42, 0.02, 0.2, 0.33, 0.23, '#303d49']);
    b.push([0.4, 0.42, 0.02, 0.2, 0.33, 0.23, '#303d49']);
  } else if (id === 'amaru') {
    t.push([0, 0.68, 0.02, 0.64, 0.15, 0.41, look.outfit2]);
    t.push([0, 0.37, 0.22, 0.38, 0.04, 0.02, look.trim]);
    t.push([0.22, 0.36, 0.217, 0.09, 0.09, 0.02, look.accent, true]);
    b.push([0.3, 0.92, 0.04, 0.22, 0.22, 0.15, '#654d32']);
    b.push([0.3, 0.78, -0.18, 0.12, 0.3, 0.1, '#70553a']);
    b.push([-0.34, 0.78, -0.12, 0.13, 0.25, 0.12, '#d2b174']);
  } else if (id === 'ona') {
    t.push([-0.36, 0.64, 0, 0.16, 0.22, 0.33, look.trim]);
    t.push([0.36, 0.64, 0, 0.16, 0.22, 0.33, look.trim]);
    t.push([0, 0.72, 0, 0.7, 0.08, 0.44, look.outfit]);
    t.push([-0.24, 0.32, 0.22, 0.24, 0.12, 0.025, look.outfit2]);
    t.push([0.06, 0.32, 0.235, 0.11, 0.04, 0.012, look.accent, true]);
    b.push([0, 1.24, -0.32, 0.52, 0.16, 0.18, look.outfit2]);
    b.push([-0.17, 1.27, -0.43, 0.45, 0.08, 0.08, '#8db7ff', true]);
    b.push([0, 1.05, -0.31, 0.12, 0.3, 0.12, look.trim]);
    var holo = new THREE.Group();
    holo.position.set(0.48, 1.58, 0.08);
    addPartBoxes(holo, [
      [0, 0.2, 0, 0.26, 0.18, 0.015, look.accent, true],
      [0, 0.2, 0.015, 0.2, 0.12, 0.008, '#d9ecff', true],
      [0, -0.05, 0, 0.18, 0.14, 0.012, '#8db7ff', true],
      [0, -0.22, 0, 0.25, 0.1, 0.012, look.trim, true]
    ]);
    out.floaters = holo;
  } else if (id === 'iris') {
    t.push([0, 0.64, 0.02, 0.88, 0.2, 0.46, look.outfit2]);
    t.push([0, 0.67, 0.25, 0.32, 0.05, 0.03, look.trim, true]);
    t.push([0, 0.28, 0.216, 0.26, 0.3, 0.022, look.outfit2]);
    t.push([0, 0.29, 0.228, 0.12, 0.12, 0.012, look.accent, true]);
    b.push([-0.37, 0.95, 0.02, 0.15, 0.25, 0.2, '#5c4779']);
    b.push([0.37, 0.95, 0.02, 0.15, 0.25, 0.2, '#5c4779']);
    b.push([0, 0.42, -0.22, 0.18, 0.18, 0.14, '#e7d6b4']);
  } else if (id === 'zenon') {
    t.push([0, 0.64, 0, 1.03, 0.3, 0.49, look.outfit2]);
    t.push([0, 0.58, 0.24, 0.38, 0.07, 0.03, look.trim, true]);
    t.push([-0.27, 0.29, 0.22, 0.08, 0.1, 0.03, '#d4b36a']);
    t.push([0.26, 0.29, 0.22, 0.08, 0.1, 0.03, '#d4b36a']);
    b.push([0, 1.08, -0.34, 0.62, 0.24, 0.16, '#4b3520']);
    b.push([-0.18, 1.35, -0.42, 0.12, 0.38, 0.12, '#d0b173']);
    b.push([0.18, 1.35, -0.42, 0.12, 0.38, 0.12, '#d0b173']);
    var pages = new THREE.Group();
    pages.position.set(-0.48, 1.72, 0.02);
    addPartBoxes(pages, [
      [0, 0, 0, 0.3, 0.39, 0.025, '#e9dfc5', true],
      [-0.05, -0.24, 0.02, 0.2, 0.1, 0.02, look.trim, true],
      [0.3, -0.12, 0.02, 0.16, 0.22, 0.02, look.accent, true]
    ]);
    out.floaters = pages;
  }
  if (t.length) addPartBoxes(torso, t);
  if (b.length) addPartBoxes(body, b);
  var cape = makeCapeGroup(id, look);
  if (cape) {
    body.add(cape);
    out.cape = cape;
  }
  var tail = makeHairTail(id, look);
  if (tail) {
    head.add(tail);
    out.hairTail = tail;
  }
  if (out.floaters) {
    out.floaters.userData.baseY = out.floaters.position.y;
    body.add(out.floaters);
  }
  return out;
}
function makeArm(look, side, id) {
  var pivot = new THREE.Group();
  var bulk = look.style === 'armor' ? 1.22 : (look.style === 'robe' || look.style === 'cloak' || look.style === 'archivist' ? 1.06 : 1);
  pivot.position.set(side * 0.47 * look.body.shoulder, 1.53, 0);
  var sleeve = look.style === 'robe' || look.style === 'cloak' || look.style === 'archivist' ? look.outfit2 : look.outfit;
  var boxes = [
    [0, -0.26, 0, 0.2 * bulk, 0.53, 0.22 * bulk, sleeve],
    [0, -0.56, 0.02, 0.19 * bulk, 0.19, 0.21 * bulk, look.outfit],
    [0, -0.72, 0.055, 0.19, 0.17, 0.23, look.skin]
  ];
  if (id === 'teo' || id === 'iris' || id === 'zenon') {
    boxes.push([0, -0.4, 0.03, 0.23 * bulk, 0.26, 0.25 * bulk, sleeve]);
    boxes.push([0, -0.61, 0.04, 0.22, 0.06, 0.225, look.trim]);
  }
  if (id === 'kian') {
    boxes.push([side * 0.07, -0.02, 0, 0.38, 0.2, 0.35, look.outfit2]);
    boxes.push([side * 0.1, -0.09, 0.03, 0.32, 0.07, 0.3, look.trim]);
    boxes.push([0, -0.6, 0.03, 0.25, 0.19, 0.27, '#667382']);
    boxes.push([0, -0.72, 0.06, 0.26, 0.18, 0.26, '#4b5866']);
  } else if (id === 'lia') {
    boxes.push([side * 0.02, -0.01, 0, 0.29, 0.15, 0.28, look.outfit2]);
    boxes.push([0, -0.73, 0.065, 0.2, 0.18, 0.24, '#41232e']);
    boxes.push([0, -0.6, 0.04, 0.21, 0.04, 0.23, look.trim]);
  } else if (id === 'noa') {
    boxes.push([0, -0.72, 0.065, 0.2, 0.18, 0.24, look.outfit2]);
    boxes.push([0, -0.58, 0.04, 0.21, 0.035, 0.23, look.trim]);
  } else if (id === 'amaru') {
    boxes.push([0, -0.58, 0.04, 0.23, 0.05, 0.24, look.trim]);
  } else if (id === 'ona') {
    boxes.push([0, -0.72, 0.065, 0.2, 0.18, 0.24, '#1c2c4b']);
    boxes.push([0, -0.58, 0.04, 0.21, 0.035, 0.23, look.accent, true]);
  } else if (id === 'iris' || id === 'zenon') {
    boxes.push([0, -0.72, 0.065, 0.21, 0.18, 0.24, look.outfit]);
  } else if (id === 'ilan') {
    boxes.push([0, -0.72, 0.065, 0.2, 0.18, 0.24, '#253b5d']);
    boxes.push([0, -0.58, 0.04, 0.21, 0.035, 0.23, look.trim]);
  }
  addPartBoxes(pivot, boxes);
  return pivot;
}
function makeLeg(look, side, id) {
  var pivot = new THREE.Group();
  pivot.position.set(side * 0.19, 0.93, 0);
  var legBulk = look.style === 'armor' ? 1.15 : 1;
  var boxes = [
    [0, -0.25, 0, 0.25 * legBulk, 0.5, 0.27 * legBulk, look.leg],
    [0, -0.59, 0.015, 0.23 * legBulk, 0.22, 0.26 * legBulk, look.outfit],
    [0, -0.82, 0.06, 0.28, 0.17, 0.37, '#171c26'],
    [0, -0.79, 0.16, 0.24, 0.06, 0.22, look.trim]
  ];
  if (id === 'kian') {
    boxes.push([0, -0.39, 0.04, 0.3, 0.15, 0.3, '#667382']);
    boxes.push([0, -0.86, 0.07, 0.31, 0.2, 0.42, '#343e49']);
    boxes.push([0, -0.73, 0.08, 0.29, 0.04, 0.38, look.trim]);
  } else if (id === 'ona' || id === 'noa') {
    boxes.push([0, -0.69, 0.07, 0.27, 0.42, 0.33, id === 'noa' ? '#e3e7ec' : '#1f2c48']);
    boxes.push([0, -0.59, 0.04, 0.25, 0.035, 0.28, look.trim]);
  } else if (id === 'mara' || id === 'amaru') {
    boxes.push([0, -0.12, 0.06, 0.27, 0.15, 0.29, look.outfit2]);
    boxes.push([0, -0.57, 0.03, 0.25, 0.04, 0.27, look.trim]);
  } else if (id === 'iris' || id === 'zenon') {
    boxes.push([0, -0.34, 0.02, 0.27, 0.36, 0.3, look.outfit]);
    boxes.push([0, -0.17, 0.02, 0.27, 0.04, 0.3, look.trim]);
  } else if (id === 'lia') {
    boxes.push([0, -0.49, 0.03, 0.26, 0.24, 0.28, look.outfit2]);
    boxes.push([0, -0.56, 0.04, 0.255, 0.035, 0.27, look.trim]);
  }
  addPartBoxes(pivot, boxes);
  return pivot;
}

function buildWeapon(prop, look) {
  var g = new THREE.Group();
  var accent = look.accent;
  var wood = '#6f5135';
  var brass = '#d9b674';
  var dark = '#2b2c35';
  var boxes = [];
  if (prop === 'compass') {
    boxes = [
      [0, 0.03, 0, 0.07, 0.25, 0.07, dark],
      [0, 0.26, 0, 0.38, 0.38, 0.08, brass],
      [0, 0.26, 0.047, 0.24, 0.24, 0.012, '#0e1826'],
      [0, 0.26, 0.058, 0.04, 0.2, 0.018, accent, true],
      [-0.1, 0.26, 0.06, 0.09, 0.04, 0.016, '#f3dfb0', true],
      [0.1, 0.26, 0.06, 0.09, 0.04, 0.016, '#f3dfb0', true]
    ];
  } else if (prop === 'mapStaff') {
    boxes = [
      [0, 0.55, 0, 0.065, 1.9, 0.065, wood],
      [0, 1.48, 0, 0.41, 0.12, 0.12, brass],
      [0, 1.12, 0, 0.32, 0.62, 0.09, '#cfb27b'],
      [0, 1.12, 0.052, 0.24, 0.48, 0.012, look.outfit2],
      [0.14, 1.54, 0, 0.06, 0.16, 0.06, accent, true]
    ];
  } else if (prop === 'lens') {
    boxes = [
      [0, -0.15, 0, 0.055, 0.34, 0.055, dark],
      [0, 0.24, 0, 0.06, 0.18, 0.06, brass],
      [0, 0.47, 0, 0.42, 0.06, 0.06, brass],
      [0, 0.24, 0.12, 0.46, 0.46, 0.05, accent, true],
      [0, 0.24, 0.15, 0.3, 0.3, 0.02, '#d8f6ff', true]
    ];
  } else if (prop === 'bookStaff') {
    boxes = [
      [0, 0.4, 0, 0.065, 1.55, 0.065, wood],
      [0, 1.13, 0, 0.28, 0.06, 0.06, brass],
      [0, 1.32, 0, 0.36, 0.32, 0.12, look.outfit2],
      [0, 1.32, 0.07, 0.28, 0.24, 0.03, look.trim],
      [-0.14, 1.32, 0.085, 0.03, 0.24, 0.02, brass],
      [0.14, 1.32, 0.085, 0.03, 0.24, 0.02, brass],
      [0, 1.05, 0, 0.2, 0.14, 0.08, '#c6b8dc', true]
    ];
  } else if (prop === 'watch') {
    boxes = [
      [0, 0.2, 0, 0.31, 0.31, 0.11, brass],
      [0, 0.2, 0.064, 0.24, 0.24, 0.025, '#f0e2b8'],
      [0, 0.2, 0.078, 0.19, 0.19, 0.012, '#d8c89f'],
      [0, 0.27, 0.086, 0.017, 0.08, 0.014, '#4b3820'],
      [0.08, 0.19, 0.086, 0.06, 0.015, 0.014, '#4b3820'],
      [0, 0.39, 0, 0.06, 0.1, 0.05, brass],
      [0, -0.02, 0, 0.06, 0.16, 0.045, accent, true],
      [-0.08, -0.13, 0, 0.08, 0.08, 0.055, '#e8c57a'],
      [0.06, -0.22, 0, 0.1, 0.06, 0.045, accent, true],
      [0.2, -0.08, 0, 0.06, 0.2, 0.035, look.trim, true]
    ];
  } else if (prop === 'hammer') {
    boxes = [
      [0, 0.28, 0, 0.08, 1.05, 0.08, wood],
      [0, 0.83, 0, 0.52, 0.38, 0.35, look.outfit2],
      [0, 0.83, 0.18, 0.34, 0.24, 0.035, look.trim],
      [0, 0.83, -0.18, 0.34, 0.24, 0.035, look.trim],
      [0, 0.38, 0, 0.2, 0.08, 0.1, brass],
      [0, 0.9, 0.2, 0.12, 0.12, 0.02, accent, true]
    ];
  } else if (prop === 'lantern') {
    boxes = [
      [0, 0.18, 0, 0.055, 1.05, 0.055, wood],
      [0, 0.72, 0, 0.35, 0.06, 0.35, brass],
      [0, 0.48, 0, 0.28, 0.3, 0.28, '#6b5130'],
      [0, 0.48, 0, 0.19, 0.23, 0.19, accent, true],
      [0, 0.28, 0, 0.36, 0.06, 0.36, brass],
      [0, 0.9, 0, 0.12, 0.3, 0.12, brass],
      [0, 1.03, 0.055, 0.15, 0.04, 0.03, accent, true]
    ];
  } else if (prop === 'compassTool') {
    boxes = [
      [0, 0.2, 0, 0.06, 0.8, 0.06, brass],
      [-0.09, 0.0, 0, 0.06, 0.42, 0.06, look.outfit2],
      [0.2, 0.0, 0, 0.06, 0.42, 0.06, look.outfit2],
      [-0.22, -0.2, 0, 0.15, 0.05, 0.07, look.trim],
      [0.22, -0.2, 0, 0.15, 0.05, 0.07, look.trim],
      [0, 0.62, 0, 0.44, 0.05, 0.05, accent, true],
      [0, 0.52, 0, 0.05, 0.23, 0.05, look.trim],
      [0.2, 0.35, 0, 0.22, 0.19, 0.025, accent, true],
      [0.2, 0.35, 0.018, 0.14, 0.12, 0.012, '#e1eeff', true]
    ];
  } else if (prop === 'farol') {
    boxes = [
      [0, 0.42, 0, 0.06, 1.52, 0.06, brass],
      [-0.2, 0.98, 0, 0.06, 0.32, 0.06, brass],
      [0.2, 0.98, 0, 0.06, 0.32, 0.06, brass],
      [0, 1.0, 0, 0.3, 0.4, 0.3, '#e7d6b4'],
      [0, 1.0, 0.02, 0.23, 0.31, 0.26, accent, true],
      [0, 1.23, 0, 0.4, 0.06, 0.4, brass],
      [0, 1.32, 0, 0.12, 0.14, 0.12, brass],
      [0, 0.45, 0, 0.18, 0.08, 0.18, look.trim, true]
    ];
  } else {
    boxes = [
      [0, 0.35, 0, 0.065, 1.7, 0.065, wood],
      [0, 1.1, 0, 0.3, 0.08, 0.3, brass],
      [0, 1.28, 0, 0.36, 0.36, 0.08, brass],
      [0, 1.28, 0.06, 0.24, 0.24, 0.03, '#121b2a'],
      [0, 1.28, 0.076, 0.15, 0.15, 0.02, accent, true],
      [0, 1.43, 0.02, 0.12, 0.12, 0.08, look.trim, true],
      [0, 0.32, 0, 0.16, 0.05, 0.16, look.trim]
    ];
  }
  addPartBoxes(g, boxes);
  if (prop === 'farol' || prop === 'lantern') {
    var gl = makeGlowSprite(accent, 1.6, 0.55);
    gl.position.set(0, prop === 'farol' ? 1.0 : 0.48, 0);
    g.add(gl);
  }
  if (prop === 'archiveStaff' || prop === 'bookStaff') {
    var gl2 = makeGlowSprite(accent, 0.8, 0.5);
    gl2.position.set(0, 1.3, 0);
    g.add(gl2);
  }
  return g;
}

function buildHeroAvatar(id) {
  var look = heroLook(id);
  var root = new THREE.Group();
  var body = new THREE.Group();
  root.add(body);
  var leftLeg = makeLeg(look, -1, id);
  var rightLeg = makeLeg(look, 1, id);
  body.add(leftLeg, rightLeg);
  var torsoBoxes = [
    [0, 0.33, 0, 0.72, 0.66, 0.39, look.outfit],
    [0, 0.58, 0, 0.58, 0.18, 0.34, look.outfit2],
    [0, 0.20, 0.205, 0.38, 0.36, 0.025, look.outfit2],
    [0, 0.16, 0, 0.74, 0.13, 0.42, '#202738'],
    [0, 0.16, 0.215, 0.17, 0.08, 0.03, look.trim],
    [0.17, 0.71, 0, 0.16, 0.10, 0.35, look.trim],
    [-0.17, 0.71, 0, 0.16, 0.10, 0.35, look.trim],
    [0, 0.69, -0.16, 0.46, 0.08, 0.16, look.accent, true]
  ];
  if (look.style === 'coat') {
    torsoBoxes.push([-0.2, -0.02, -0.2, 0.3, 0.5, 0.1, look.outfit2]);
    torsoBoxes.push([0.2, -0.02, -0.2, 0.3, 0.5, 0.1, look.outfit2]);
    torsoBoxes.push([0, 0.25, 0, 0.6, 0.1, 0.43, look.trim]);
    torsoBoxes.push([-0.37, 0.07, 0, 0.07, 0.34, 0.36, look.outfit2]);
    torsoBoxes.push([0.37, 0.07, 0, 0.07, 0.34, 0.36, look.outfit2]);
  } else if (look.style === 'poncho') {
    torsoBoxes.push([0, 0.32, 0, 0.88, 0.6, 0.47, look.outfit2]);
    torsoBoxes.push([0, 0.48, 0.02, 0.94, 0.12, 0.49, look.trim]);
    torsoBoxes.push([-0.26, 0.03, -0.24, 0.3, 0.38, 0.1, look.outfit2]);
    torsoBoxes.push([0.26, 0.03, -0.24, 0.3, 0.38, 0.1, look.outfit2]);
    torsoBoxes.push([0, 0.3, 0.24, 0.24, 0.2, 0.025, look.accent, true]);
  } else if (look.style === 'robe') {
    torsoBoxes.push([0, -0.02, 0, 0.68, 0.52, 0.43, look.outfit]);
    torsoBoxes.push([0, 0.24, 0, 0.8, 0.1, 0.45, look.trim]);
    torsoBoxes.push([0, 0.44, 0.2, 0.16, 0.2, 0.02, look.accent, true]);
    torsoBoxes.push([-0.34, 0.15, 0, 0.08, 0.34, 0.36, look.outfit2]);
    torsoBoxes.push([0.34, 0.15, 0, 0.08, 0.34, 0.36, look.outfit2]);
  } else if (look.style === 'jacket') {
    torsoBoxes.push([-0.22, 0.52, 0.21, 0.2, 0.18, 0.02, look.trim]);
    torsoBoxes.push([0.22, 0.52, 0.21, 0.2, 0.18, 0.02, look.trim]);
    torsoBoxes.push([0, 0.39, 0.215, 0.13, 0.27, 0.025, look.outfit2]);
    torsoBoxes.push([-0.22, 0.03, -0.21, 0.26, 0.42, 0.08, look.outfit2]);
    torsoBoxes.push([0.22, 0.03, -0.21, 0.26, 0.42, 0.08, look.outfit2]);
    torsoBoxes.push([0, 0.71, 0.22, 0.18, 0.05, 0.02, look.accent, true]);
  } else if (look.style === 'armor') {
    torsoBoxes.push([0, 0.37, 0.22, 0.62, 0.4, 0.08, look.outfit2]);
    torsoBoxes.push([0, 0.5, 0.27, 0.17, 0.17, 0.02, look.accent, true]);
    torsoBoxes.push([-0.4, 0.56, 0, 0.23, 0.17, 0.34, look.outfit2]);
    torsoBoxes.push([0.4, 0.56, 0, 0.23, 0.17, 0.34, look.outfit2]);
    torsoBoxes.push([0, 0.11, 0, 0.8, 0.12, 0.49, look.leg]);
    torsoBoxes.push([0, 0.74, 0, 0.74, 0.08, 0.45, look.trim]);
  } else if (look.style === 'cloak') {
    torsoBoxes.push([0, 0.23, -0.28, 0.78, 1.0, 0.1, look.outfit2]);
    torsoBoxes.push([-0.36, 0.42, -0.19, 0.25, 0.64, 0.11, look.outfit]);
    torsoBoxes.push([0.36, 0.42, -0.19, 0.25, 0.64, 0.11, look.outfit]);
    torsoBoxes.push([0, 0.63, 0.21, 0.34, 0.07, 0.02, look.trim]);
    torsoBoxes.push([0, 0.35, 0.205, 0.16, 0.34, 0.02, look.accent, true]);
  } else if (look.style === 'architect') {
    torsoBoxes.push([0, 0.34, 0, 0.8, 0.64, 0.44, look.outfit2]);
    torsoBoxes.push([0, 0.56, 0, 0.8, 0.12, 0.45, look.outfit]);
    torsoBoxes.push([-0.37, 0.68, 0, 0.13, 0.22, 0.35, look.trim]);
    torsoBoxes.push([0.37, 0.68, 0, 0.13, 0.22, 0.35, look.trim]);
    torsoBoxes.push([0, 0.28, 0.23, 0.24, 0.1, 0.02, look.accent, true]);
    torsoBoxes.push([0, 0.08, 0, 0.7, 0.18, 0.42, look.outfit]);
  } else if (look.style === 'archivist') {
    torsoBoxes.push([0, 0.31, 0, 0.78, 0.68, 0.43, look.outfit]);
    torsoBoxes.push([0, 0.34, 0.24, 0.64, 0.38, 0.05, '#4b3520']);
    torsoBoxes.push([0, 0.56, 0.26, 0.17, 0.2, 0.02, look.trim, true]);
    torsoBoxes.push([0, 0.05, -0.22, 0.74, 0.48, 0.1, look.outfit2]);
    torsoBoxes.push([0, 0.26, 0, 0.8, 0.08, 0.44, look.trim]);
    torsoBoxes.push([-0.38, 0.58, 0, 0.15, 0.12, 0.36, look.leg]);
    torsoBoxes.push([0.38, 0.58, 0, 0.15, 0.12, 0.36, look.leg]);
  } else {
    torsoBoxes.push([0, 0.16, 0, 0.76, 0.12, 0.42, look.trim]);
  }
  var torso = new THREE.Group();
  torso.position.y = 1.0;
  addPartBoxes(torso, torsoBoxes);
  body.add(torso);
  var head = makeHead(look, id);
  head.scale.setScalar(look.body.head || 1);
  body.add(head);
  var leftArm = makeArm(look, -1, id);
  var rightArm = makeArm(look, 1, id);
  body.add(leftArm, rightArm);
  var identity = makeIdentityDetails(id, look, torso, body, head);
  var weapon = buildWeapon(look.prop, look);
  weapon.position.set(0, -0.72, 0.08);
  weapon.rotation.set(0.02, 0, -0.055);
  rightArm.add(weapon);
  if (look.extra === 'halo') {
    var orb = makeGlowSprite(look.accent, 0.75, 0.42);
    orb.position.set(0, 2.5, 0);
    body.add(orb);
  }
  root.scale.set(look.body.w || 1, look.body.h || 1, look.body.w || 1);
  var avatar = {
    id: id,
    look: look,
    root: root,
    body: body,
    torso: torso,
    head: head,
    leftArm: leftArm,
    rightArm: rightArm,
    leftLeg: leftLeg,
    rightLeg: rightLeg,
    weapon: weapon,
    cape: identity.cape,
    hairTail: identity.hairTail,
    floaters: identity.floaters,
    attackTimer: 0,
    hurtTimer: 0,
    celebrateTimer: 0,
    attackStyle: (look.anim && look.anim.attack) || 'slash',
    idleT: rng() * 10,
    facing: Math.PI,
    currentMotion: 0,
    stateTag: 'idle'
  };
  root.userData.avatar = avatar;
  return avatar;
}

function disposeObject(obj) {
  if (!obj) return;
  obj.traverse(function (node) {
    if (node.geometry) node.geometry.dispose();
    if (node.material) {
      if (Array.isArray(node.material)) node.material.forEach(function (m) { m.dispose(); });
      else node.material.dispose();
    }
  });
  if (obj.parent) obj.parent.remove(obj);
}

/* -------------------------------------------------------------------------
   Guardián de ruta
   ------------------------------------------------------------------------- */
var GUARDIAN_DATA = {
  'area-psi-salud-publica': { name: 'Custodio del Territorio', type: 'tree', height: 3.5, color: '#69D3C1' },
  'area-psi-cuidado-integral': { name: 'Custodio del Cuidado', type: 'heart', height: 3.4, color: '#7AA2FF' },
  'area-psi-etica': { name: 'Custodio de la Confianza', type: 'mirror', height: 3.5, color: '#C49BFF' },
  'area-psi-investigacion': { name: 'Custodio de la Evidencia', type: 'prism', height: 3.3, color: '#B8D46A' },
  'area-psi-gestion': { name: 'Custodio del Sistema', type: 'tower', height: 3.6, color: '#F3B562' }
};
function makeWardShield(hex, radius) {
  var mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius || 1.7, 1),
    new THREE.MeshBasicMaterial({ color: color(hex), wireframe: true, transparent: true, opacity: 0.075, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  mesh.position.y = 2.0;
  mesh.userData.ward = true;
  return mesh;
}
function buildGuardian(areaId) {
  var area = AREA_BY_ID[areaId] || CAMP.areas[0];
  var info = GUARDIAN_DATA[area.id] || GUARDIAN_DATA['area-psi-salud-publica'];
  var accent = info.color || area.accent;
  var root = new THREE.Group();
  var body = new THREE.Group();
  root.add(body);
  var animated = { shards: [], rings: [], hands: [], trays: [], pages: [], gears: [], core: null };
  var eye = null;
  var mid = '#2b3446';
  var dark = '#151b27';
  var glowBox = accent;
  if (info.type === 'tree') {
    body.position.y = 0.35;
    addPartBoxes(body, [
      [0, 1.2, 0, 0.82, 2.35, 0.68, '#4b3a29'],
      [0, 1.3, 0.35, 0.6, 1.65, 0.06, '#2d3d31'],
      [0, 0.32, 0.02, 1.25, 0.28, 0.72, '#3a2e22'],
      [-0.52, 0.16, 0.2, 0.35, 0.2, 0.4, '#3d3226'],
      [0.52, 0.16, -0.1, 0.35, 0.2, 0.4, '#3d3226'],
      [0, 1.33, 0.38, 0.22, 0.54, 0.04, accent, true],
      [-0.47, 1.75, 0.4, 0.12, 0.2, 0.03, accent, true],
      [0.47, 1.75, 0.4, 0.12, 0.2, 0.03, accent, true],
      [0, 2.0, 0.4, 0.62, 0.1, 0.06, '#d7b778']
    ]);
    var branchLeft = new THREE.Group();
    branchLeft.position.set(-0.25, 2.02, 0);
    addPartBoxes(branchLeft, [
      [-0.53, 0.22, 0, 1.02, 0.2, 0.26, '#4d3b29'],
      [-0.92, 0.45, 0, 0.22, 0.62, 0.22, '#4d3b29'],
      [-1.15, 0.74, 0, 0.58, 0.3, 0.28, '#31624f'],
      [-1.32, 0.94, 0.02, 0.26, 0.2, 0.2, accent, true]
    ]);
    var branchRight = new THREE.Group();
    branchRight.position.set(0.25, 2.02, 0);
    addPartBoxes(branchRight, [
      [0.53, 0.29, 0, 1.02, 0.2, 0.26, '#4d3b29'],
      [0.94, 0.56, 0, 0.22, 0.6, 0.22, '#4d3b29'],
      [1.12, 0.84, 0, 0.52, 0.28, 0.28, '#356b56'],
      [1.3, 1.0, 0.02, 0.23, 0.18, 0.2, accent, true]
    ]);
    branchLeft.userData.baseY = branchLeft.position.y;
    branchRight.userData.baseY = branchRight.position.y;
    body.add(branchLeft, branchRight);
    animated.hands.push(branchLeft, branchRight);
    for (var ti = 0; ti < 6; ti++) {
      var leaf = new THREE.Group();
      addPartBoxes(leaf, [
        [0, 0, 0, 0.32, 0.2, 0.26, ti % 2 ? '#3d7962' : '#4b8a69'],
        [0, 0.1, 0.11, 0.16, 0.06, 0.02, accent, true]
      ]);
      leaf.position.set(-0.85 + (ti % 3) * 0.85, 2.7 + Math.floor(ti / 3) * 0.38, 0.18 + (ti % 2) * 0.12);
      body.add(leaf);
      animated.shards.push({ group: leaf, baseY: leaf.position.y, baseX: leaf.position.x, angle: ti * 1.7, speed: 0.4 + ti * 0.06 });
    }
    eye = makeGlowSprite(accent, 1.8, 0.7);
    body.add(eye);
    eye.position.set(0, 1.38, 0.42);
  } else if (info.type === 'heart') {
    body.position.y = 2.05;
    addPartBoxes(body, [
      [-0.38, 0.18, 0, 0.66, 0.7, 0.5, '#33466d'],
      [0.38, 0.18, 0, 0.66, 0.7, 0.5, '#33466d'],
      [0, -0.18, 0.02, 0.9, 0.58, 0.5, '#3b4d73'],
      [0, -0.6, 0.04, 0.5, 0.4, 0.4, '#2b3a59'],
      [0, 0.2, 0.28, 0.78, 0.52, 0.06, '#1c2b46'],
      [0, 0.24, 0.31, 0.42, 0.36, 0.02, accent, true],
      [0, 0.22, 0.32, 0.18, 0.48, 0.02, '#dff8ff', true],
      [-0.56, -0.06, 0.03, 0.08, 0.55, 0.32, '#7aa2ff'],
      [0.56, -0.06, 0.03, 0.08, 0.55, 0.32, '#7aa2ff'],
      [0, -0.42, 0.25, 0.36, 0.06, 0.03, accent, true],
      [0, -0.55, 0, 0.2, 0.16, 0.2, glowBox, true]
    ]);
    eye = makeGlowSprite(accent, 1.2, 0.8);
    eye.position.set(0, 0.1, 0.38);
    body.add(eye);
    var handL = new THREE.Group();
    handL.position.set(-1.12, 0.3, 0.15);
    addPartBoxes(handL, [
      [0, 0, 0, 0.55, 0.24, 0.38, '#2b3446'],
      [-0.2, -0.1, 0, 0.18, 0.38, 0.24, '#283247'],
      [0, 0.03, 0.22, 0.3, 0.06, 0.03, accent, true]
    ]);
    var handR = new THREE.Group();
    handR.position.set(1.12, 0.3, 0.15);
    addPartBoxes(handR, [
      [0, 0, 0, 0.55, 0.24, 0.38, '#2b3446'],
      [0.2, -0.1, 0, 0.18, 0.38, 0.24, '#283247'],
      [0, 0.03, 0.22, 0.3, 0.06, 0.03, accent, true]
    ]);
    handL.userData.baseY = handL.position.y;
    handR.userData.baseY = handR.position.y;
    body.add(handL, handR);
    animated.hands.push(handL, handR);
    var halo = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.028, 4, 40), new THREE.MeshBasicMaterial({ color: color(accent), transparent: true, opacity: 0.6 }));
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.85;
    body.add(halo);
    animated.rings.push({ mesh: halo, speed: 0.18, axis: 'z' });
    animated.core = eye;
  } else if (info.type === 'mirror') {
    body.position.y = 1.55;
    addPartBoxes(body, [
      [0, 0.1, 0, 0.78, 1.45, 0.55, dark],
      [0, 0.78, 0, 0.9, 0.82, 0.62, '#2b3042'],
      [0, 0.82, 0.34, 0.68, 0.6, 0.06, '#0e1220'],
      [0, 0.82, 0.38, 0.58, 0.5, 0.03, accent, true],
      [-0.47, 0.4, 0, 0.09, 0.44, 0.09, accent, true],
      [0.47, 0.4, 0, 0.09, 0.44, 0.09, accent, true],
      [0, -0.6, 0.03, 0.5, 0.4, 0.34, mid],
      [0, -0.42, 0.05, 0.26, 0.09, 0.03, '#e7d6b4']
    ]);
    eye = makeGlowSprite(accent, 2.1, 0.58);
    eye.position.set(0, 0.83, 0.45);
    body.add(eye);
    var beam = new THREE.Group();
    beam.position.y = 0.05;
    addPartBoxes(beam, [
      [-1.1, 0, 0, 2.2, 0.09, 0.11, '#a78b63'],
      [0, 0.04, 0, 0.2, 0.16, 0.18, accent, true]
    ]);
    body.add(beam);
    [-1.08, 1.08].forEach(function (x) {
      var tray = new THREE.Group();
      tray.position.set(x, -0.05, 0);
      addPartBoxes(tray, [
        [0, -0.36, 0, 0.04, 0.7, 0.04, '#b79b69'],
        [0, -0.72, 0, 0.44, 0.06, 0.1, '#b79b69'],
        [0, -0.58, 0, 0.25, 0.2, 0.22, '#efd6ad'],
        [0, -0.6, 0.12, 0.12, 0.1, 0.02, accent, true]
      ]);
      body.add(tray);
      animated.trays.push({ group: tray, baseY: tray.position.y, phase: x > 0 ? Math.PI : 0 });
    });
    animated.rings.push({ mesh: beam, speed: 0.15, axis: 'y' });
  } else if (info.type === 'prism') {
    body.position.y = 2.15;
    var crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.02, 0), new THREE.MeshLambertMaterial({ color: color('#425b2b'), emissive: color(accent), emissiveIntensity: 0.28, flatShading: true }));
    crystal.scale.set(0.9, 1.3, 0.9);
    body.add(crystal);
    addPartBoxes(body, [
      [0, 0.12, 0, 0.56, 0.34, 0.12, '#0d1410'],
      [0, 0.12, 0.12, 0.24, 0.16, 0.02, accent, true],
      [0, 0.66, 0, 0.13, 0.22, 0.13, accent, true],
      [-0.82, -0.18, 0, 0.2, 0.2, 0.2, '#506b35'],
      [0.84, -0.1, 0, 0.2, 0.2, 0.2, '#506b35']
    ]);
    eye = makeGlowSprite(accent, 1.8, 0.7);
    eye.position.set(0, 0.13, 0.35);
    body.add(eye);
    var ringA = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.025, 4, 36), new THREE.MeshBasicMaterial({ color: color(accent), transparent: true, opacity: 0.5 }));
    ringA.rotation.x = 1.1;
    ringA.position.y = 0.1;
    var ringB = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.02, 4, 30), new THREE.MeshBasicMaterial({ color: color('#e7f4bd'), transparent: true, opacity: 0.33 }));
    ringB.rotation.x = 0.4;
    ringB.rotation.z = 1.2;
    body.add(ringA, ringB);
    animated.rings.push({ mesh: ringA, speed: 0.22, axis: 'y' }, { mesh: ringB, speed: -0.17, axis: 'z' });
    for (var pl = 0; pl < 5; pl++) {
      var lens = new THREE.Group();
      addPartBoxes(lens, [
        [0, 0, 0, 0.34, 0.06, 0.22, '#445b30'],
        [0, 0.02, 0.08, 0.2, 0.02, 0.16, accent, true]
      ]);
      lens.position.set((pl % 2 ? 1 : -1) * (1.55 + (pl % 3) * 0.22), -0.4 + pl * 0.32, -0.25 + (pl % 2) * 0.42);
      body.add(lens);
      animated.shards.push({ group: lens, baseY: lens.position.y, baseX: lens.position.x, angle: pl * 1.2, speed: 0.3 + pl * 0.05 });
    }
    animated.core = crystal;
  } else {
    body.position.y = 0.08;
    addPartBoxes(body, [
      [0, 0.38, 0, 1.95, 0.5, 1.5, '#353a42'],
      [0, 0.74, 0, 1.62, 0.28, 1.2, '#4c4030'],
      [-0.72, 1.55, 0, 0.24, 1.5, 0.24, '#4b4438'],
      [0.72, 1.55, 0, 0.24, 1.5, 0.24, '#4b4438'],
      [0, 1.43, 0, 1.2, 0.32, 0.92, '#5e4931'],
      [0, 2.2, 0, 1.5, 0.24, 1.05, '#383c45'],
      [0, 2.42, 0, 0.78, 0.3, 0.64, '#6d5231'],
      [0, 2.72, 0, 0.35, 0.4, 0.32, accent, true],
      [-0.31, 2.38, 0.34, 0.22, 0.08, 0.02, accent, true],
      [0.31, 2.38, 0.34, 0.22, 0.08, 0.02, accent, true]
    ]);
    var gear = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.08, 6, 16), new THREE.MeshLambertMaterial({ color: color('#b48b54') }));
    gear.rotation.x = Math.PI / 2;
    gear.position.set(0, 1.56, 0.6);
    body.add(gear);
    animated.gears.push({ mesh: gear, speed: 0.7 });
    var gear2 = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.055, 6, 12), new THREE.MeshLambertMaterial({ color: color(accent) }));
    gear2.rotation.x = Math.PI / 2;
    gear2.position.set(0.58, 1.85, 0.42);
    body.add(gear2);
    animated.gears.push({ mesh: gear2, speed: -1.0 });
    eye = makeGlowSprite(accent, 1.8, 0.7);
    eye.position.set(0, 2.7, 0.24);
    body.add(eye);
    for (var pg = 0; pg < 3; pg++) {
      var pane = new THREE.Group();
      addPartBoxes(pane, [
        [0, 0, 0, 0.44, 0.26, 0.02, accent, true],
        [0, 0, 0.026, 0.34, 0.17, 0.008, '#f6e7c8', true],
        [0, 0.16, 0.03, 0.2, 0.03, 0.01, '#f6e7c8', true]
      ]);
      pane.position.set(-1.15 + pg * 1.15, 2.75 + (pg % 2) * 0.34, -0.3 + (pg % 2) * 0.32);
      body.add(pane);
      animated.pages.push({ group: pane, baseY: pane.position.y, baseX: pane.position.x, phase: pg * 2.1 });
    }
    animated.core = eye;
  }
  var eyeHeight = info.type === 'tree' ? 1.75 : info.type === 'heart' ? 2.15 : info.type === 'mirror' ? 2.36 : info.type === 'prism' ? 2.28 : 2.78;
  if (eye) eye.position.x = eye.position.x;
  var ward = makeWardShield(accent, info.type === 'heart' ? 1.55 : 1.8);
  ward.position.y = eyeHeight;
  root.add(ward);
  var underGlow = makeGlowSprite(accent, info.type === 'tower' ? 4.8 : 4.2, 0.2);
  underGlow.position.y = 0.2;
  root.add(underGlow);
  var light = new THREE.PointLight(accent, 1.25, 9, 2);
  light.position.set(0, eyeHeight, 0.6);
  root.add(light);
  var shadow = makeBlob(info.type === 'tower' ? 2.7 : 2.2);
  root.add(shadow);
  var nameLabel = addLabelSprite(info.name, 'Guardián · ' + area.short, accent, 3.35);
  nameLabel.position.y = info.height + 0.7;
  root.add(nameLabel);
  var guardian = {
    root: root,
    body: body,
    shards: animated.shards,
    hands: animated.hands,
    trays: animated.trays,
    rings: animated.rings,
    gears: animated.gears,
    pages: animated.pages,
    core: animated.core,
    eye: eye,
    ward: ward,
    shieldPulse: 0,
    name: info.name,
    type: info.type,
    accent: accent,
    glow: underGlow,
    light: light,
    label: nameLabel,
    height: info.height,
    baseBodyY: body.position.y,
    hoverSeed: rng() * 7,
    hurtTimer: 0,
    attackTimer: 0,
    phase: rng() * 6
  };
  root.userData.guardian = guardian;
  return guardian;
}

/* -------------------------------------------------------------------------
   Escena del observatorio
   ------------------------------------------------------------------------- */
var sceneRoot = new THREE.Group();
var hubGroup = new THREE.Group();
var arenaGroup = new THREE.Group();
scene.add(sceneRoot);
sceneRoot.add(hubGroup, arenaGroup);
arenaGroup.visible = false;

var ambient = new THREE.HemisphereLight('#93a6e8', '#201625', 1.0);
scene.add(ambient);
var moonLight = new THREE.DirectionalLight('#f5d6ae', 2.1);
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(1024, 1024);
moonLight.shadow.camera.left = -13;
moonLight.shadow.camera.right = 13;
moonLight.shadow.camera.top = 13;
moonLight.shadow.camera.bottom = -13;
moonLight.shadow.camera.near = 1;
moonLight.shadow.camera.far = 60;
moonLight.shadow.bias = -0.001;
scene.add(moonLight, moonLight.target);
var rimLight = new THREE.DirectionalLight('#7899ff', 0.85);
rimLight.position.set(-8, 6, -8);
scene.add(rimLight);

// Noche: estrellas y luna.
var starGeo = new THREE.BufferGeometry();
var starPos = [], starColors = [];
var starPalette = ['#e7e9ff', '#aebdff', '#f3d8b0', '#9fefe0'];
for (var si = 0; si < 620; si++) {
  var theta = rng() * Math.PI * 2;
  var phi = 0.06 + rng() * 1.2;
  var radius = 140 + rng() * 70;
  starPos.push(Math.cos(theta) * Math.cos(phi) * radius, Math.sin(phi) * radius * 0.72, Math.sin(theta) * Math.cos(phi) * radius);
  var sc = color(starPalette[Math.floor(rng() * starPalette.length)]);
  starColors.push(sc.r, sc.g, sc.b);
}
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
starGeo.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
var starField = new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 1.4, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.9, fog: false, depthWrite: false }));
scene.add(starField);
var moon = new THREE.Sprite(new THREE.SpriteMaterial({
  map: radialTexture([[0, '#fffcef'], [0.4, '#fff3cd'], [0.48, 'rgba(255,240,195,0.28)'], [1, 'rgba(255,240,195,0)']]),
  transparent: true, depthWrite: false, fog: false
}));
moon.scale.set(24, 24, 1);
scene.add(moon);

function buildFloor(group, radius, center, accentColor, borderHex) {
  var count = 0;
  var N = Math.ceil(radius * 2 + 2);
  for (var gx = -N; gx <= N; gx++) {
    for (var gz = -N; gz <= N; gz++) {
      var x = gx + 0.5, z = gz + 0.5;
      if (x * x + z * z <= (radius + 0.3) * (radius + 0.3)) count++;
    }
  }
  var tiles = new THREE.InstancedMesh(BOX, new THREE.MeshLambertMaterial(), Math.max(1, count));
  tiles.count = 0;
  tiles.receiveShadow = true;
  tiles.castShadow = false;
  var tint = new THREE.Color();
  var border = new THREE.InstancedMesh(BOX, new THREE.MeshLambertMaterial(), Math.max(1, 220));
  border.count = 0;
  border.receiveShadow = true;
  for (var gx2 = -N; gx2 <= N; gx2++) {
    for (var gz2 = -N; gz2 <= N; gz2++) {
      var px = gx2 + 0.5, pz = gz2 + 0.5;
      var d = Math.sqrt(px * px + pz * pz);
      if (d > radius + 0.3) continue;
      var shade = 0.88 + rng() * 0.22;
      var ring = Math.floor(d * 1.2);
      if (d > radius - 0.8) tint.set('#544634').multiplyScalar(shade);
      else if (ring % 4 === 0 && d > radius - 2.2) tint.set('#383d48').multiplyScalar(shade);
      else tint.set(palette.stone || '#263048').multiplyScalar(shade);
      addBlock(tiles, px, -0.12, pz, 0.97, 0.22, 0.97, tint);
      if (d > radius - 0.7 && d < radius + 0.3) {
        var edgeTint = new THREE.Color(borderHex || palette.gold || '#e4c07a').multiplyScalar(0.38 + rng() * 0.16);
        addBlock(border, px, 0.03, pz, 0.82, 0.12, 0.82, edgeTint, gx2, gz2);
      }
    }
  }
  tiles.instanceMatrix.needsUpdate = true;
  border.instanceMatrix.needsUpdate = true;
  group.add(tiles, border);
  var base = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.45, radius + 0.1, 1.0, 32), new THREE.MeshLambertMaterial({ color: color('#11151f') }));
  base.position.y = -0.7;
  base.receiveShadow = true;
  group.add(base);
  var under = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.92, radius * 0.75, 2.6, 32), new THREE.MeshLambertMaterial({ color: color('#0b0e17') }));
  under.position.y = -1.7;
  group.add(under);
  var rim = new THREE.Mesh(new THREE.TorusGeometry(radius + 0.18, 0.055, 4, 64), new THREE.MeshBasicMaterial({ color: color(accentColor || palette.gold), transparent: true, opacity: 0.45 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.06;
  group.add(rim);
  return { tiles: tiles, border: border, base: base, rim: rim };
}
function addBlock(mesh, x, y, z, sx, sy, sz, tint) {
  dummy.position.set(x, y, z);
  dummy.rotation.set(0, 0, 0);
  dummy.scale.set(sx, sy, sz);
  dummy.updateMatrix();
  mesh.setMatrixAt(mesh.count, dummy.matrix);
  mesh.setColorAt(mesh.count, tint);
  mesh.count++;
}

var hubFloor = buildFloor(hubGroup, HUB_RADIUS, new THREE.Vector3(0, 0, 0), palette.gold);

/* Pisos y caminos de luz hacia las cinco rutas */
var GATE_ANGLES = [202, 274, 346, 58, 130].map(function (deg) { return deg * Math.PI / 180; });
var gateGroups = [];
CAMP.areas.forEach(function (area, index) {
  var angle = GATE_ANGLES[index];
  var gx = Math.cos(angle) * 7.1;
  var gz = Math.sin(angle) * 7.1;
  var gate = new THREE.Group();
  gate.position.set(gx, 0, gz);
  gate.rotation.y = Math.atan2(-gx, -gz);
  var stone = '#2a3040';
  var stone2 = '#3d4351';
  var accent = area.accent;
  var arch = mergedVoxels([
    [0, 0.1, 0, 3.0, 0.22, 1.1, '#171d28'],
    [-1.22, 1.55, 0, 0.35, 2.9, 0.45, stone],
    [1.22, 1.55, 0, 0.35, 2.9, 0.45, stone],
    [-1.22, 2.98, 0, 0.55, 0.3, 0.62, stone2],
    [1.22, 2.98, 0, 0.55, 0.3, 0.62, stone2],
    [0, 3.06, 0, 2.8, 0.42, 0.58, stone],
    [0, 3.3, 0, 1.2, 0.16, 0.44, accent, true],
    [-0.85, 0.35, 0.3, 0.16, 0.34, 0.16, accent, true],
    [0.85, 0.35, 0.3, 0.16, 0.34, 0.16, accent, true],
    [0, 1.35, 0.38, 0.42, 1.9, 0.06, accent, true],
    [-0.30, 1.9, 0.32, 0.22, 0.22, 0.1, '#e8e5d9', true],
    [0.30, 1.9, 0.32, 0.22, 0.22, 0.1, '#e8e5d9', true],
    [0, 1.04, 0.32, 0.72, 0.3, 0.1, lookDoorPanel(area), false],
    [0, 0.4, 0.34, 1.5, 0.2, 0.25, '#1a202b']
  ]);
  gate.add(arch);
  var glow = makeGlowSprite(accent, 4.8, 0.22);
  glow.position.set(0, 1.8, -0.15);
  gate.add(glow);
  var beacon = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshBasicMaterial({ color: color(accent) }));
  beacon.position.y = 3.55;
  gate.add(beacon);
  var label = addLabelSprite(area.short, index + 1 + '/4 rutas · ' + area.blurb.split('.')[0], accent, 3.15);
  label.position.y = 4.15;
  gate.add(label);
  var light = new THREE.PointLight(accent, 0.8, 6, 2);
  light.position.set(0, 2.2, 0.4);
  gate.add(light);
  var hit = new THREE.Mesh(new THREE.BoxGeometry(3.0, 4.0, 2.2), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  hit.position.set(0, 1.8, 0.4);
  hit.userData.gateArea = area.id;
  gate.add(hit);
  hubGroup.add(gate);
  gateGroups.push({ area: area, group: gate, label: label, beacon: beacon, glow: glow, light: light, angle: angle, position: new THREE.Vector3(gx, 0, gz), hit: hit, index: index });

  // camino
  var path = new THREE.Group();
  var steps = 6;
  for (var s = 1; s <= steps; s++) {
    var t = s / (steps + 1);
    var px = Math.cos(angle) * (2.6 + t * 3.6);
    var pz = Math.sin(angle) * (2.6 + t * 3.6);
    var block = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.035, 0.18), new THREE.MeshBasicMaterial({ color: color(accent), transparent: true, opacity: 0.22 + s * 0.035 }));
    block.position.set(px, 0.02, pz);
    block.rotation.y = -angle;
    path.add(block);
  }
  hubGroup.add(path);
});
function lookDoorPanel(area) {
  return area.id === 'area-psi-salud-publica' ? '#1d4f45' : area.id === 'area-psi-cuidado-integral' ? '#263560' : area.id === 'area-psi-etica' ? '#432a5b' : area.id === 'area-psi-investigacion' ? '#41502a' : '#5c3e22';
}

/* Dais central y orrery */
var dais = new THREE.Group();
dais.position.y = 0.08;
dais.add((function () {
  var m = mergedVoxels([
    [0, 0.0, 0, 5.0, 0.25, 5.0, '#1a202b'],
    [0, 0.26, 0, 4.3, 0.2, 4.3, '#252b38'],
    [0.15, 0.44, -0.1, 3.0, 0.18, 3.0, '#343844'],
    [0, 0.54, 0, 2.0, 0.16, 2.0, '#47443a']
  ]);
  return m;
})());
var goldRuneMat = new THREE.MeshBasicMaterial({ color: color(palette.gold || '#e4c07a'), transparent: true, opacity: 0.75 });
var daisRing = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.025, 4, 32), goldRuneMat);
daisRing.rotation.x = Math.PI / 2;
daisRing.position.y = 0.7;
dais.add(daisRing);
var orrery = new THREE.Group();
orrery.position.y = 0.58;
var orreryBase = mergedVoxels([
  [0, 0.18, 0, 0.8, 0.36, 0.8, '#30323a'],
  [0, 0.5, 0, 0.4, 0.3, 0.4, palette.gold || '#e4c07a'],
  [0, 0.9, 0, 0.12, 0.9, 0.12, '#6b5b3f']
]);
orrery.add(orreryBase);
var orreryRings = [];
for (var ri = 0; ri < 3; ri++) {
  var ring = new THREE.Mesh(new THREE.TorusGeometry(1.05 + ri * 0.2, 0.035, 4, 28), new THREE.MeshBasicMaterial({ color: color(palette.gold || '#e4c07a'), transparent: true, opacity: 0.6 - ri * 0.1 }));
  ring.rotation.x = Math.PI / 2 + (ri - 1) * 0.35;
  ring.rotation.z = ri * 0.7;
  ring.position.y = 1.4 + ri * 0.18;
  orrery.add(ring);
  orreryRings.push({ mesh: ring, speed: 0.12 + ri * 0.05, tilt: (ri - 1) * 0.3 });
}
var orbitStones = [];
CAMP.areas.forEach(function (area, i) {
  var stone = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.26), new THREE.MeshBasicMaterial({ color: color(area.accent) }));
  stone.position.y = 1.55;
  orrery.add(stone);
  orbitStones.push({ mesh: stone, angle: i / CAMP.areas.length * Math.PI * 2, radius: 1.35, speed: 0.16 + i * 0.012 });
});
var orreryLight = new THREE.PointLight(palette.gold || '#e4c07a', 1.0, 6, 2);
orreryLight.position.y = 1.6;
orrery.add(orreryLight);
var orreryGlow = makeGlowSprite(palette.gold || '#e4c07a', 4.4, 0.2);
orreryGlow.position.y = 1.4;
orrery.add(orreryGlow);
dais.add(orrery);
hubGroup.add(dais);

/* Islas lejanas, materia suspendida y vegetación de cristal */
function buildDistantIsland(x, y, z, size, colorHex) {
  var g = new THREE.Group();
  g.position.set(x, y, z);
  var boxes = [
    [0, 0, 0, size, 0.5, size * 0.8, '#252b35'],
    [size * 0.25, 0.5, 0, size * 0.45, 1.7, size * 0.3, '#39414d'],
    [size * 0.25, 1.4, 0, size * 0.54, 0.2, size * 0.4, '#55574d'],
    [-size * 0.3, -0.55, 0, size * 0.7, 0.35, size * 0.5, '#181d25'],
    [size * 0.25, 1.7, 0, 0.26, 1.2, 0.26, colorHex, true]
  ];
  g.add(mergedVoxels(boxes));
  var crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), new THREE.MeshLambertMaterial({ color: color(colorHex), emissive: color(colorHex), emissiveIntensity: 0.4 }));
  crystal.position.set(-size * 0.2, 1.0, 0.1);
  g.add(crystal);
  var glow = makeGlowSprite(colorHex, 2.2, 0.2);
  glow.position.y = 1.1;
  g.add(glow);
  hubGroup.add(g);
  return g;
}
buildDistantIsland(-17, -1, -24, 7, palette.teal || '#69d3c1');
buildDistantIsland(19, 1, -29, 8.5, palette.blue || '#7aa2ff');
buildDistantIsland(-24, 2, 12, 5.5, palette.violet || '#c49bff');
buildDistantIsland(24, -2, 13, 6.5, palette.amber || '#f3b562');
var drifter = buildDistantIsland(4, 5, -33, 4.4, palette.gold || '#e4c07a');
drifter.scale.setScalar(0.8);

var hubParticles = [];
var particleGeo = new THREE.BufferGeometry();
var particleCount = 76;
var pPositions = new Float32Array(particleCount * 3);
for (var pi = 0; pi < particleCount; pi++) {
  var rr = 3 + rng() * 7.8;
  var aa = rng() * Math.PI * 2;
  var yy = 0.4 + rng() * 4.2;
  pPositions[pi * 3] = Math.cos(aa) * rr;
  pPositions[pi * 3 + 1] = yy;
  pPositions[pi * 3 + 2] = Math.sin(aa) * rr;
  hubParticles.push({ x: pPositions[pi * 3], y: yy, z: pPositions[pi * 3 + 2], speed: 0.1 + rng() * 0.25, phase: rng() * 10 });
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
var dust = new THREE.Points(particleGeo, new THREE.PointsMaterial({ size: 0.075, color: color('#f4dca8'), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
hubGroup.add(dust);
var hubGlow = makeGlowSprite('#809eff', 28, 0.08);
hubGlow.position.set(0, 1.5, -1);
hubGroup.add(hubGlow);

/* Aro ambiente bajo el observatorio */
var abyssRing = new THREE.Mesh(new THREE.TorusGeometry(10.2, 0.06, 4, 64), new THREE.MeshBasicMaterial({ color: color(palette.blue), transparent: true, opacity: 0.25 }));
abyssRing.rotation.x = Math.PI / 2;
abyssRing.position.y = -0.3;
hubGroup.add(abyssRing);

/* -------------------------------------------------------------------------
   Arena de duelo
   ------------------------------------------------------------------------- */
var arenaFloor = buildFloor(arenaGroup, 6.3, ARENA_POS, palette.violet, '#5c526a');
arenaGroup.position.copy(ARENA_POS);
var arenaDais = new THREE.Group();
arenaDais.position.y = 0.07;
arenaDais.add(mergedVoxels([
  [0, 0, 0, 5.8, 0.2, 5.8, '#151a24'],
  [0, 0.19, 0, 4.4, 0.13, 4.4, '#202632'],
  [0, 0.31, 0, 2.8, 0.08, 2.8, '#323642']
]));
var arenaRuneMat = new THREE.MeshBasicMaterial({ color: color(palette.violet), transparent: true, opacity: 0.7 });
var arenaRune = new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.025, 4, 32), arenaRuneMat);
arenaRune.rotation.x = Math.PI / 2;
arenaRune.position.y = 0.39;
arenaDais.add(arenaRune);
var arenaRune2 = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.018, 4, 40), arenaRuneMat.clone());
arenaRune2.rotation.x = Math.PI / 2;
arenaRune2.position.y = 0.15;
arenaDais.add(arenaRune2);
arenaGroup.add(arenaDais);
var arenaPillars = [];
for (var ap = 0; ap < 6; ap++) {
  var aa2 = ap / 6 * Math.PI * 2;
  var px2 = Math.cos(aa2) * 5.15, pz2 = Math.sin(aa2) * 5.15;
  var pillar = new THREE.Group();
  pillar.position.set(px2, 0, pz2);
  var h2 = ap % 2 ? 2.1 : 2.8;
  pillar.add(mergedVoxels([
    [0, 0.1, 0, 0.9, 0.2, 0.9, '#171c26'],
    [0, h2 / 2, 0, 0.32, h2, 0.32, '#2a3040'],
    [0, h2 + 0.15, 0, 0.55, 0.2, 0.55, '#3a3e49'],
    [0, h2 + 0.3, 0, 0.18, 0.16, 0.18, palette.violet, true]
  ]));
  arenaGroup.add(pillar);
  arenaPillars.push({ group: pillar, phase: ap * 1.2 });
}
var arenaGlow = makeGlowSprite(palette.violet, 14, 0.11);
arenaGlow.position.set(0, 2.2, -4.8);
arenaGroup.add(arenaGlow);
var arenaBackRing = new THREE.Mesh(new THREE.TorusGeometry(4.5, 0.035, 4, 48), new THREE.MeshBasicMaterial({ color: color(palette.violet), transparent: true, opacity: 0.22 }));
arenaBackRing.position.set(0, 3.4, -5.8);
arenaGroup.add(arenaBackRing);
var arenaLight = new THREE.PointLight(palette.violet, 1.1, 12, 2);
arenaLight.position.set(0, 4.5, 0);
arenaGroup.add(arenaLight);
var arenaKey = new THREE.PointLight('#ffe4c2', 1.45, 12, 2);
arenaKey.position.set(0, 5.0, 4.4);
arenaGroup.add(arenaKey);
var guardian = null;
var dueling = false;

/* Sombra del héroe */
var heroShadow = makeBlob(1.9);
hubGroup.add(heroShadow);
var heroAvatar = null;
var heroHolder = new THREE.Group();
hubGroup.add(heroHolder);
var avatarRenderTarget = null;
var arenaHeroShadow = makeBlob(1.9);
arenaHeroShadow.visible = false;
arenaGroup.add(arenaHeroShadow);

function rebuildHeroAvatar() {
  if (heroAvatar) {
    disposeObject(heroAvatar.root);
    heroAvatar = null;
  }
  heroAvatar = buildHeroAvatar(state.collection.selectedCharacterId);
  if (typeof applyOutfitToAvatar === 'function') applyOutfitToAvatar(heroAvatar, state.collection.selectedCharacterId);
  heroHolder.add(heroAvatar.root);
  heroHolder.position.set(hubHero.x, 0, hubHero.z);
  heroAvatar.root.rotation.y = hubHero.facing;
  syncHudPortrait();
}

/* -------------------------------------------------------------------------
   Movimiento / interacción
   ------------------------------------------------------------------------- */
var hubHero = { x: 0, z: 3.3, facing: Math.PI, vx: 0, vz: 0, moving: false };
var currentInteract = null;
var selectedGate = -1;
var cameraFocus = new THREE.Vector3(0, 0, 3.3);
var cameraTarget = new THREE.Vector3(0, 1.5, 3.3);
var titleTime = 0;
var cameraShake = 0;
var cameraMode = 'title';
var duelCamIntro = 0;

function walkableAt(x, z) {
  var d = Math.hypot(x, z);
  if (d > HUB_RADIUS - 0.25) return false;
  if (d < 1.9) {
    // el dais central es accesible; solo el pedestal bloquea
    if (Math.hypot(x, z) < 1.05) return false;
  }
  return true;
}
function updateHub(dt) {
  if (screen !== 'hub') { hubHero.moving = false; return; }
  var input = readInput();
  var dx = input.x, dz = input.z;
  var mag = Math.hypot(dx, dz);
  if (mag > 0) { dx /= mag; dz /= mag; }
  var speed = Number(RULES.heroSpeed) || 4.5;
  hubHero.vx = lerp(hubHero.vx, dx * speed, Math.min(1, dt * 12));
  hubHero.vz = lerp(hubHero.vz, dz * speed, Math.min(1, dt * 12));
  if (mag > 0) {
    hubHero.facing = lerpAngle(hubHero.facing, Math.atan2(dx, dz), Math.min(1, dt * 11));
  }
  var nx = hubHero.x + hubHero.vx * dt;
  var nz = hubHero.z + hubHero.vz * dt;
  var moved = false;
  if (walkableAt(nx, hubHero.z)) { hubHero.x = nx; moved = true; }
  if (walkableAt(hubHero.x, nz)) { hubHero.z = nz; moved = true; }
  hubHero.moving = moved && (Math.abs(hubHero.vx) + Math.abs(hubHero.vz) > 0.35);
  if (hubHero.moving && Math.random() < dt * 5) {
    // paso discreto y muy suave
    // tone(130 + Math.random() * 20, 0.025, 'triangle', 0.003);
  }
  updateInteract();
}
function lerpAngle(a, b, t) {
  var diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}
function readInput() {
  var x = 0, z = 0;
  if (screen === 'hub') {
    if (keys['ArrowLeft'] || keys['KeyA']) x -= 1;
    if (keys['ArrowRight'] || keys['KeyD']) x += 1;
    if (keys['ArrowUp'] || keys['KeyW']) z -= 1;
    if (keys['ArrowDown'] || keys['KeyS']) z += 1;
  }
  x += touchInput.x;
  z += touchInput.z;
  return { x: clamp(x, -1, 1), z: clamp(z, -1, 1) };
}
function updateInteract() {
  currentInteract = null;
  selectedGate = -1;
  var best = null;
  gateGroups.forEach(function (g, i) {
    var d = Math.hypot(hubHero.x - g.position.x, hubHero.z - g.position.z);
    if (d < 1.85) {
      if (!best || d < best.dist) { best = { type: 'gate', gate: g, dist: d }; selectedGate = i; }
    }
  });
  var dCenter = Math.hypot(hubHero.x, hubHero.z);
  if (dCenter < 2.45 && (!best || dCenter < best.dist)) best = { type: 'oracle', dist: dCenter };
  currentInteract = best;
  if (screen === 'hub') {
    if (best) {
      EL.prompt.classList.remove('hidden');
      EL.prompt.querySelector('span').innerHTML = best.type === 'oracle'
        ? '<b>Consultar la bitácora</b> · cinco rutas'
        : 'Abrir ruta de <b>' + esc(best.gate.area.short) + '</b>';
      EL.touchAction.classList.remove('hidden');
    } else {
      EL.prompt.classList.add('hidden');
      EL.touchAction.classList.add('hidden');
    }
    syncGateHighlights();
  } else {
    EL.prompt.classList.add('hidden');
  }
}
function syncGateHighlights() {
  gateGroups.forEach(function (g, i) {
    var active = selectedGate === i;
    g.label.material.opacity = active ? 1 : 0.82;
    g.glow.material.opacity = active ? 0.4 : 0.18;
    g.light.intensity = active ? 1.4 : 0.65;
  });
}
function activateInteract() {
  if (screen !== 'hub') return;
  if (!currentInteract) {
    // En el centro del observatorio sin objetivo: abre la bitácora como acceso rápido.
    openJournal(selectedAreaId);
    return;
  }
  if (currentInteract.type === 'oracle') openJournal(selectedAreaId);
  else openJournal(currentInteract.gate.area.id);
}

/* -------------------------------------------------------------------------
   Animación del héroe y de la escena
   ------------------------------------------------------------------------- */
function animateHero(dt, time) {
  if (!heroAvatar) return;
  var av = heroAvatar;
  var running = screen === 'hub' && hubHero.moving;
  var speedNorm = clamp(Math.hypot(hubHero.vx, hubHero.vz) / (Number(RULES.heroSpeed) || 4.5), 0, 1);
  var data = av.look.anim || { idle: 1.6, gait: 9, lean: 0.05 };
  av.idleT += dt * (running ? data.gait : data.idle);
  av.attackTimer = Math.max(0, av.attackTimer - dt);
  av.hurtTimer = Math.max(0, av.hurtTimer - dt);
  av.celebrateTimer = Math.max(0, av.celebrateTimer - dt);
  var t = av.idleT;
  var breath = Math.sin(t) * 0.018;
  var sway = Math.sin(t * 0.57 + av.look.body.head * 2.1);
  var legSwing = running ? Math.sin(t) * 0.66 : 0;
  var armSwing = running ? Math.sin(t) * 0.54 : 0;
  var stance = av.look.anim && av.look.anim.attack === 'hammer' ? 0.17 : 0.045;
  av.body.position.y = running ? Math.abs(Math.sin(t)) * 0.075 : breath * 0.9;
  av.body.position.x = 0;
  av.body.position.z = running ? 0.035 : 0;
  av.body.rotation.x = running ? data.lean * speedNorm : 0;
  av.body.rotation.y = running ? Math.sin(t) * 0.018 : sway * 0.018;
  av.body.rotation.z = running ? Math.sin(t) * 0.018 : sway * 0.012;
  av.torso.rotation.x = (av.look.id === 'zenon' || av.look.id === 'teo') ? 0.055 : 0;
  av.torso.rotation.y = 0;
  av.torso.rotation.z = running ? -Math.sin(t) * 0.025 : 0;
  av.head.rotation.x = (av.look.id === 'zenon' ? 0.06 : 0) + (running ? 0.03 : 0);
  av.head.rotation.y = running ? Math.sin(t) * 0.03 : Math.sin(t * 0.23) * 0.055;
  av.head.rotation.z = running ? Math.sin(t) * 0.025 : Math.sin(t * 0.35) * 0.018;
  av.leftLeg.rotation.x = legSwing;
  av.rightLeg.rotation.x = -legSwing;
  av.leftLeg.rotation.z = running ? 0.01 : 0;
  av.rightLeg.rotation.z = running ? -0.01 : 0;
  av.leftArm.rotation.x = -armSwing * 0.72 - (running ? 0.1 : 0);
  av.rightArm.rotation.x = armSwing * 0.72 - (running ? 0.08 : 0);
  av.leftArm.rotation.z = stance + (running ? 0 : Math.sin(t * 0.7) * 0.015);
  av.rightArm.rotation.z = -stance - (running ? 0 : Math.sin(t * 0.7) * 0.015);
  av.rightArm.rotation.y = 0;
  /* Posturas de reposo propias: el cuerpo también cuenta la identidad. */
  if (!running) {
    if (av.look.id === 'kian') { av.leftArm.rotation.x -= 0.2; av.rightArm.rotation.x -= 0.12; av.leftArm.rotation.z += 0.14; av.rightArm.rotation.z -= 0.14; }
    else if (av.look.id === 'teo' || av.look.id === 'zenon') { av.leftArm.rotation.x -= 0.16; av.head.rotation.x += 0.03; }
    else if (av.look.id === 'lia') { av.body.position.y += Math.sin(t * 1.2) * 0.012; av.head.rotation.z += 0.025 * Math.sin(t * 0.8); }
    else if (av.look.id === 'ilan') { av.leftArm.rotation.z -= 0.1; av.leftArm.rotation.x -= 0.08; }
    else if (av.look.id === 'mara') { av.rightArm.rotation.x += 0.06; }
    else if (av.look.id === 'noa') { av.head.rotation.y += 0.04 * Math.sin(t * 0.4); av.leftArm.rotation.x -= 0.12; }
    else if (av.look.id === 'amaru') { av.head.rotation.y += 0.08 * Math.sin(t * 0.28); }
    else if (av.look.id === 'ona') { av.head.rotation.z -= 0.025; av.rightArm.rotation.x += 0.06; }
    else if (av.look.id === 'iris') { av.leftArm.rotation.x -= 0.1; av.rightArm.rotation.x -= 0.08; }
  }
  if (av.hurtTimer > 0) {
    var h = av.hurtTimer / 0.52;
    av.body.rotation.z = Math.sin((1 - h) * 28) * 0.13 * h;
    av.body.rotation.x = -0.1 * h;
    av.body.position.x = Math.sin((1 - h) * 24) * 0.075 * h;
    av.body.position.z = -0.08 * h;
    av.head.rotation.z = -0.13 * h;
    av.leftArm.rotation.x = -0.5 * h;
    av.rightArm.rotation.x = 0.3 * h;
    av.leftArm.rotation.z = 0.35 * h;
    av.rightArm.rotation.z = -0.2 * h;
  }
  if (av.attackTimer > 0) {
    var a = 1 - av.attackTimer / 0.6;
    var arc = Math.sin(Math.min(1, a * 1.12) * Math.PI);
    var lunge = Math.sin(Math.min(1, a * 1.3) * Math.PI);
    if (av.attackStyle === 'hammer') {
      av.rightArm.rotation.x = -2.55 * arc;
      av.leftArm.rotation.x = -1.4 * arc;
      av.rightArm.rotation.z = -0.15 + 0.1 * arc;
      av.torso.rotation.y = -0.18 * arc;
      av.body.position.z = 0.18 * lunge;
      av.body.position.y = breath + Math.max(0, Math.sin(a * Math.PI)) * 0.1;
    } else if (av.attackStyle === 'staff') {
      av.rightArm.rotation.x = -1.9 * arc;
      av.leftArm.rotation.x = -1.15 * arc;
      av.rightArm.rotation.z = -0.35 + 0.2 * arc;
      av.leftArm.rotation.z = 0.38;
      av.torso.rotation.y = -0.25 * arc;
      av.body.rotation.y = -0.08 * arc;
      av.body.position.z = 0.12 * lunge;
    } else if (av.attackStyle === 'lantern') {
      av.rightArm.rotation.x = -2.3 * arc;
      av.leftArm.rotation.x = -0.55 * arc;
      av.rightArm.rotation.z = -0.22 + 0.25 * arc;
      av.head.rotation.x = 0.05 * arc;
      av.torso.rotation.y = -0.16 * arc;
    } else if (av.attackStyle === 'cast') {
      av.rightArm.rotation.x = -2.05 * arc;
      av.leftArm.rotation.x = -0.8 * arc;
      av.rightArm.rotation.z = -0.48 * arc;
      av.leftArm.rotation.z = 0.36 * arc;
      av.torso.rotation.y = -0.36 * arc;
      av.body.position.y = breath + arc * 0.07;
    } else {
      av.rightArm.rotation.x = -2.15 * arc;
      av.rightArm.rotation.z = -0.55 * arc;
      av.torso.rotation.y = -0.4 * arc;
      av.body.rotation.y = -0.16 * arc;
      av.body.position.z = 0.16 * lunge;
      av.leftArm.rotation.x = 0.5 * arc;
      av.leftArm.rotation.z = 0.25 * arc;
    }
  }
  if (av.celebrateTimer > 0) {
    var c = av.celebrateTimer / 2.5;
    av.body.position.y = Math.abs(Math.sin((1 - c) * Math.PI * 3)) * 0.34;
    av.leftArm.rotation.x = -2.35;
    av.rightArm.rotation.x = -2.35;
    av.leftArm.rotation.z = 0.65;
    av.rightArm.rotation.z = -0.65;
    av.head.rotation.y = Math.sin((1 - c) * 16) * 0.1;
  }
  if (av.cape) {
    av.cape.rotation.x = -0.035 - (running ? speedNorm * 0.2 : 0) - (av.attackTimer > 0 ? 0.12 : 0) + Math.sin(time * 2 + av.idleT * 0.2) * 0.025;
    av.cape.rotation.z = Math.sin(time * 1.3 + av.idleT * 0.3) * 0.022;
  }
  if (av.hairTail) {
    av.hairTail.rotation.x = -0.03 - (running ? speedNorm * 0.18 : 0) - (av.attackTimer > 0 ? 0.06 : 0) + Math.sin(time * 2.4 + av.idleT * 0.2) * 0.035;
    av.hairTail.rotation.z = Math.sin(time * 1.8) * 0.025;
  }
  if (av.floaters) {
    av.floaters.rotation.y = time * 0.5;
    av.floaters.position.y = (av.floaters.userData.baseY || 0) + Math.sin(time * 1.4) * 0.025;
  }
  if (typeof animateAvatarCosmetics === 'function') animateAvatarCosmetics(av, dt, time, running, speedNorm);
  av.currentMotion = running ? speedNorm : 0;
}
function triggerHeroAttack() {
  if (!heroAvatar) return;
  heroAvatar.attackTimer = 0.6;
  heroAvatar.stateTag = 'attack';
  sfxAttack();
  flashAttack();
  spawnSlashArc(heroAvatar.look.accent);
  var start = arenaWorld(duelPositions.hero).add(new THREE.Vector3(0.25, 1.4, 0.25));
  var targetY = guardian ? guardian.height * 0.54 : 1.8;
  var end = arenaWorld(duelPositions.guardian).add(new THREE.Vector3(0, targetY, 0));
  spawnLightProjectile(start, end, heroAvatar.look.accent, function () { impactGuardian(heroAvatar ? heroAvatar.look.accent : '#9ec6ff'); });
}
function triggerHeroHurt() {
  if (!heroAvatar) return;
  heroAvatar.hurtTimer = 0.52;
  heroAvatar.stateTag = 'hurt';
  pulseHeroShield(heroAvatar.look.accent);
  flashHit();
  cameraShake = Math.max(cameraShake, 0.22);
  spawnPulse(arenaWorld(duelPositions.hero).add(new THREE.Vector3(0, 1.25, 0)), heroAvatar.look.accent, 1.4);
  sfxHit();
}
function triggerHeroCelebrate() {
  if (!heroAvatar) return;
  heroAvatar.celebrateTimer = 2.5;
  heroAvatar.stateTag = 'celebrate';
}
function animateGuardian(dt, time) {
  if (!guardian) return;
  var g = guardian;
  g.hurtTimer = Math.max(0, g.hurtTimer - dt);
  g.attackTimer = Math.max(0, g.attackTimer - dt);
  g.shieldPulse = Math.max(0, (g.shieldPulse || 0) - dt * 1.9);
  var hoverAmount = g.type === 'tower' || g.type === 'tree' ? 0.025 : 0.11;
  var hover = Math.sin(time * 1.05 + g.hoverSeed) * hoverAmount;
  g.body.position.y = g.baseBodyY + hover;
  g.body.position.x = g.hurtTimer > 0 ? Math.sin((1 - g.hurtTimer / 0.46) * 22) * 0.07 : 0;
  g.body.position.z = g.attackTimer > 0 ? Math.sin((1 - g.attackTimer / 0.45) * Math.PI) * 0.16 : 0;
  g.body.rotation.y = Math.sin(time * 0.35 + g.phase) * (g.type === 'mirror' ? 0.04 : 0.1);
  g.body.rotation.z = g.hurtTimer > 0 ? Math.sin((1 - g.hurtTimer / 0.46) * 26) * 0.11 : 0;
  g.body.rotation.x = g.attackTimer > 0 ? -0.03 : 0;
  if (g.eye) g.eye.material.opacity = 0.46 + Math.sin(time * 2.2 + g.phase) * 0.12 + (g.attackTimer > 0 ? 0.3 : 0);
  g.shards.forEach(function (s) {
    s.group.rotation.y = time * s.speed + s.angle;
    s.group.position.y = s.baseY + Math.sin(time * 0.9 + s.angle) * 0.1;
    if (s.baseX != null) s.group.position.x = s.baseX + Math.sin(time * 0.55 + s.angle) * 0.08;
  });
  g.hands.forEach(function (hand, i) {
    hand.rotation.z = Math.sin(time * 1.2 + i * Math.PI) * 0.055;
    if (hand.userData.baseY != null) hand.position.y = hand.userData.baseY + Math.sin(time * 1.4 + i) * 0.028;
  });
  g.trays.forEach(function (tray) {
    tray.group.position.y = tray.baseY + Math.sin(time * 1.05 + tray.phase) * 0.055;
    tray.group.rotation.z = Math.sin(time * 0.7 + tray.phase) * 0.035;
  });
  g.rings.forEach(function (item) {
    item.mesh.rotation[item.axis || 'y'] += dt * item.speed;
  });
  g.gears.forEach(function (item) {
    item.mesh.rotation.z += dt * item.speed;
  });
  if (g.type === 'prism' && g.core) {
    g.core.rotation.y += dt * 0.38;
    g.core.rotation.z = Math.sin(time * 0.5) * 0.16;
  }
  g.pages.forEach(function (page) {
    page.group.position.y = page.baseY + Math.sin(time * 1.2 + page.phase) * 0.11;
    page.group.rotation.y = Math.sin(time * 0.7 + page.phase) * 0.25;
    page.group.position.x = page.baseX + Math.cos(time * 0.45 + page.phase) * 0.07;
  });
  if (g.glow) g.glow.material.opacity = 0.16 + Math.sin(time * 1.3 + g.phase) * 0.035;
  if (g.light) g.light.intensity = 1.05 + Math.sin(time * 1.7 + g.phase) * 0.22 + (g.attackTimer > 0 ? 0.5 : 0);
  if (g.ward) {
    g.ward.material.opacity = 0.035 + g.shieldPulse * 0.3;
    g.ward.scale.setScalar(1 + g.shieldPulse * 0.1);
    g.ward.rotation.y += dt * (0.18 + g.shieldPulse * 0.6);
    g.ward.rotation.x += dt * 0.07;
    g.ward.visible = g.root.visible;
  }
  if (g.label) {
    g.label.position.y = g.height + 0.7 + Math.sin(time * 0.7 + g.phase) * 0.03;
  }
}

/* Partículas de impacto */
var sparkPool = [];
var sparkLayer = new THREE.Group();
scene.add(sparkLayer);
for (var s = 0; s < 36; s++) {
  var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: color('#ffe2a8'), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  sp.scale.set(0.15, 0.15, 1);
  sparkLayer.add(sp);
  sparkPool.push({ sprite: sp, life: 0, max: 0.7, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 });
}
function spawnSparksAt(point, hex, count) {
  var used = 0;
  sparkPool.forEach(function (p) {
    if (p.life > 0 || used >= count) return;
    p.life = p.max = 0.4 + Math.random() * 0.55;
    p.x = point.x + (Math.random() - 0.5) * 0.8;
    p.y = point.y + Math.random() * 1.2;
    p.z = point.z + (Math.random() - 0.5) * 0.8;
    p.vx = (Math.random() - 0.5) * 2.4;
    p.vy = 0.7 + Math.random() * 2.2;
    p.vz = (Math.random() - 0.5) * 2.4;
    p.sprite.material.color.set(hex);
    p.sprite.material.opacity = 1;
    p.sprite.position.set(p.x, p.y, p.z);
    p.sprite.scale.set(0.22 + Math.random() * 0.22, 0.22 + Math.random() * 0.22, 1);
    used++;
  });
}
function updateSparks(dt) {
  sparkPool.forEach(function (p) {
    if (p.life <= 0) return;
    p.life -= dt;
    p.vy -= 5.2 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    var a = Math.max(0, p.life / p.max);
    p.sprite.position.set(p.x, p.y, p.z);
    p.sprite.material.opacity = a;
    p.sprite.scale.setScalar(0.1 + a * 0.36);
    if (p.life <= 0) p.sprite.material.opacity = 0;
  });
}

/* Rayo de ataque del guardián */
var bolt = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
  new THREE.LineBasicMaterial({ color: color(palette.violet), transparent: true, opacity: 0, blending: THREE.AdditiveBlending })
);
bolt.visible = false;
scene.add(bolt);
var boltTimer = 0;
function guardianAttackVisual() {
  if (!guardian) return;
  var from = arenaWorld(duelPositions.guardian).add(new THREE.Vector3(0, 2.2, 0));
  var to = arenaWorld(duelPositions.hero).add(new THREE.Vector3(0, 1.4, 0));
  var pts = [];
  for (var i = 0; i < 6; i++) {
    var t = i / 5;
    pts.push(new THREE.Vector3(
      lerp(from.x, to.x, t) + (i > 0 && i < 5 ? (Math.random() - 0.5) * 0.6 : 0),
      lerp(from.y, to.y, t) + (i > 0 && i < 5 ? (Math.random() - 0.5) * 0.6 : 0),
      lerp(from.z, to.z, t) + (i > 0 && i < 5 ? (Math.random() - 0.5) * 0.3 : 0)
    ));
  }
  bolt.geometry.dispose();
  bolt.geometry = new THREE.BufferGeometry().setFromPoints(pts);
  bolt.material.color.set(guardian.accent);
  bolt.visible = true;
  bolt.material.opacity = 0.85;
  boltTimer = 0.26;
  guardian.attackTimer = 0.45;
}
function updateBolt(dt) {
  if (boltTimer > 0) {
    boltTimer -= dt;
    bolt.material.opacity = Math.max(0, boltTimer / 0.26) * 0.9;
    if (boltTimer <= 0) bolt.visible = false;
  }
}

/* -------------------------------------------------------------------------
   Cámara
   ------------------------------------------------------------------------- */
var duelPositions = {
  hero: new THREE.Vector3(-2.45, 0, -0.35),
  guardian: new THREE.Vector3(2.45, 0, -0.45)
};
function arenaWorld(local) {
  return local.clone().add(new THREE.Vector3(ARENA_POS.x, 0, ARENA_POS.z));
}

/* -------------------------------------------------------------------------
   Efectos de duelo: luz, proyectiles y escudos
   ------------------------------------------------------------------------- */
var heroShield = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.3, 1),
  new THREE.MeshBasicMaterial({ color: color('#7aa2ff'), wireframe: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })
);
heroShield.position.copy(duelPositions.hero);
heroShield.position.y = 1.25;
arenaGroup.add(heroShield);
var heroShieldPulse = 0;
var projectileEffects = [];
var arcEffects = [];
var pulseEffects = [];

function pulseHeroShield(hex) {
  heroShield.material.color.set(hex || '#9ebdff');
  heroShieldPulse = 1;
}
function spawnLightProjectile(from, to, hex, onArrive) {
  var group = new THREE.Group();
  var core = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), new THREE.MeshBasicMaterial({ color: color(hex) }));
  var glow = makeGlowSprite(hex, 1.4, 0.75);
  group.add(core, glow);
  group.position.copy(from);
  scene.add(group);
  projectileEffects.push({ group: group, from: from.clone(), to: to.clone(), t: 0, duration: 0.34, onArrive: onArrive || null, color: hex });
}
function spawnSlashArc(hex) {
  var geo = new THREE.RingGeometry(0.76, 1.12, 24, 1, 0.2, 1.5);
  var mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: color(hex), transparent: true, opacity: 0.56, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  var p = arenaWorld(duelPositions.hero);
  mesh.position.set(p.x + 0.26, 1.45, p.z + 0.34);
  mesh.quaternion.copy(camera.quaternion);
  mesh.rotateZ(-0.6);
  scene.add(mesh);
  arcEffects.push({ mesh: mesh, life: 0.26, max: 0.26, spin: 1.7 });
}
function spawnPulse(point, hex, scale) {
  var sprite = makeGlowSprite(hex, (scale || 1.2) * 0.5, 0.95);
  sprite.position.copy(point);
  scene.add(sprite);
  pulseEffects.push({ sprite: sprite, life: 0.5, max: 0.5, size: scale || 1.2 });
}
function impactGuardian(hex) {
  if (!guardian) return;
  var p = arenaWorld(duelPositions.guardian);
  guardian.shieldPulse = 0.9;
  guardian.hurtTimer = 0.46;
  cameraShake = Math.max(cameraShake, 0.16);
  spawnSparksAt(p.clone().add(new THREE.Vector3(0, guardian.height * 0.58, 0)), hex, 18);
  spawnPulse(p.clone().add(new THREE.Vector3(0, guardian.height * 0.55, 0)), hex, 2.1);
  tone(820, 0.14, 'triangle', 0.025, 1140);
}
function clearCombatEffects() {
  projectileEffects.forEach(function (e) {
    scene.remove(e.group);
    disposeObject(e.group);
  });
  projectileEffects = [];
  arcEffects.forEach(function (e) {
    scene.remove(e.mesh);
    if (e.mesh.geometry) e.mesh.geometry.dispose();
    if (e.mesh.material) e.mesh.material.dispose();
  });
  arcEffects = [];
  pulseEffects.forEach(function (e) {
    scene.remove(e.sprite);
    if (e.sprite.material) e.sprite.material.dispose();
  });
  pulseEffects = [];
  heroShieldPulse = 0;
  heroShield.material.opacity = 0;
  bolt.visible = false;
  boltTimer = 0;
}
function updateCombatEffects(dt) {
  for (var i = projectileEffects.length - 1; i >= 0; i--) {
    var e = projectileEffects[i];
    e.t += dt / e.duration;
    var t = Math.min(1, e.t);
    var ease = t * t * (3 - 2 * t);
    e.group.position.lerpVectors(e.from, e.to, ease);
    e.group.position.y += Math.sin(t * Math.PI) * 0.55;
    e.group.rotation.x += dt * 8;
    e.group.rotation.y += dt * 11;
    if (t >= 1) {
      if (e.onArrive) e.onArrive();
      scene.remove(e.group);
      disposeObject(e.group);
      projectileEffects.splice(i, 1);
    }
  }
  for (var a = arcEffects.length - 1; a >= 0; a--) {
    var arc = arcEffects[a];
    arc.life -= dt;
    var at = Math.max(0, arc.life / arc.max);
    arc.mesh.material.opacity = at * 0.52;
    arc.mesh.scale.setScalar(1 + (1 - at) * 0.6);
    arc.mesh.rotateZ(dt * arc.spin);
    if (arc.life <= 0) {
      scene.remove(arc.mesh);
      arc.mesh.geometry.dispose();
      arc.mesh.material.dispose();
      arcEffects.splice(a, 1);
    }
  }
  for (var p = pulseEffects.length - 1; p >= 0; p--) {
    var pulse = pulseEffects[p];
    pulse.life -= dt;
    var pt = Math.max(0, pulse.life / pulse.max);
    pulse.sprite.material.opacity = pt * 0.8;
    pulse.sprite.scale.setScalar(pulse.size * (0.5 + (1 - pt) * 1.5));
    if (pulse.life <= 0) {
      scene.remove(pulse.sprite);
      pulse.sprite.material.dispose();
      pulseEffects.splice(p, 1);
    }
  }
  heroShieldPulse = Math.max(0, heroShieldPulse - dt * 1.8);
  if (arenaGroup.visible) {
    heroShield.visible = heroShieldPulse > 0.01;
    heroShield.material.opacity = 0.05 + heroShieldPulse * 0.5;
    heroShield.scale.setScalar(1 + heroShieldPulse * 0.18);
    heroShield.rotation.y += dt * 0.8;
    heroShield.rotation.x += dt * 0.3;
  } else {
    heroShield.visible = false;
  }
  updateBolt(dt);
}
function configureMissionStage(areaId) {
  var area = AREA_BY_ID[areaId] || CAMP.areas[0];
  arenaRuneMat.color.set(area.accent);
  arenaRune2.material.color.set(area.accent);
  arenaLight.color.set(area.accent);
  arenaGlow.material.color.set(area.accent);
  arenaBackRing.material.color.set(area.accent);
  return area;
}
function beginDuelStage(areaId) {
  clearCombatEffects();
  var area = configureMissionStage(areaId);
  if (guardian) { disposeObject(guardian.root); guardian = null; }
  guardian = buildGuardian(area.id);
  guardian.root.position.copy(duelPositions.guardian);
  /* Tres cuartos hacia la cámara: se ve la máscara del guardián, no su perfil. */
  guardian.root.rotation.y = -0.58;
  arenaGroup.add(guardian.root);
  arenaGroup.visible = true;
  hubGroup.visible = false;
  if (heroAvatar) {
    heroHolder.remove(heroAvatar.root);
    arenaGroup.add(heroAvatar.root);
    heroAvatar.root.position.copy(duelPositions.hero);
    heroAvatar.root.rotation.y = Math.atan2(duelPositions.guardian.x - duelPositions.hero.x, duelPositions.guardian.z - duelPositions.hero.z);
    heroShield.material.color.set(heroAvatar.look.accent);
  }
  heroShield.position.set(duelPositions.hero.x, 1.25, duelPositions.hero.z);
  heroShield.visible = false;
  heroShieldPulse = 0;
  arenaHeroShadow.visible = true;
  arenaHeroShadow.position.copy(duelPositions.hero);
  arenaHeroShadow.position.y = 0.015;
  duelCamIntro = 0;
  cameraMode = 'duel';
  view = 'duel';
}
function endDuelStage() {
  clearCombatEffects();
  if (guardian) { disposeObject(guardian.root); guardian = null; }
  arenaGroup.visible = false;
  hubGroup.visible = true;
  if (heroAvatar) {
    arenaGroup.remove(heroAvatar.root);
    heroHolder.add(heroAvatar.root);
    heroAvatar.root.position.set(0, 0, 0);
    heroAvatar.root.rotation.y = hubHero.facing;
  }
  arenaHeroShadow.visible = false;
  heroShield.visible = false;
  cameraMode = 'hub';
  view = 'hub';
  cameraShake = 0;
  bolt.visible = false;
}
function placeCamera(dt, time) {
  if (!renderer) return;
  if (cameraMode === 'title') {
    titleTime += dt;
    var drift = Math.sin(titleTime * 0.055) * 0.35;
    var wanted = new THREE.Vector3(hubHero.x - 7.6 + drift, 5.1 + Math.sin(titleTime * 0.2) * 0.18, hubHero.z + 10.6);
    camera.position.lerp(wanted, Math.min(1, dt * 2.0));
    camera.lookAt(hubHero.x - 2.8, 1.45, hubHero.z - 1.0);
    scene.fog.near = 24; scene.fog.far = 70;
  } else if (cameraMode === 'duel') {
    var dx = ARENA_POS.x, dz = ARENA_POS.z;
    var shake = cameraShake > 0 ? cameraShake * 0.5 : 0;
    cameraShake = Math.max(0, cameraShake - dt);
    duelCamIntro = Math.min(1, duelCamIntro + dt * 0.54);
    var introEase = 1 - Math.pow(1 - duelCamIntro, 3);
    var camDist = lerp(14.2, 9.85, introEase);
    var camHeight = lerp(7.8, 5.65, introEase);
    var wanted2 = new THREE.Vector3(dx + 0.7 + (Math.random() - 0.5) * shake, camHeight + (Math.random() - 0.5) * shake, dz + camDist);
    camera.position.lerp(wanted2, Math.min(1, dt * 2.5));
    camera.lookAt(dx, lerp(2.45, 1.8, introEase), dz - 0.35);
    scene.fog.near = 18; scene.fog.far = 58;
  } else {
    var hx = hubHero.x, hz = hubHero.z;
    var wanted3 = new THREE.Vector3(hx + 0.2, 12.2, hz + 14.0);
    camera.position.lerp(wanted3, Math.min(1, dt * 3.6));
    camera.lookAt(hx, 1.1, hz - 2.0);
    scene.fog.near = 20; scene.fog.far = 64;
  }
  var focus = cameraMode === 'duel' ? ARENA_POS : (cameraMode === 'title' ? new THREE.Vector3(0, 0, 0) : new THREE.Vector3(hubHero.x, 0, hubHero.z));
  moonLight.position.set(focus.x - 8, 17, focus.z + 11);
  moonLight.target.position.set(focus.x, 0, focus.z);
  rimLight.position.set(focus.x - 10, 7, focus.z - 8);
  rimLight.target.position.set(focus.x, 0, focus.z);
  starField.position.set(camera.position.x * 0.5, camera.position.y * 0.1, camera.position.z * 0.5);
  moon.position.set(camera.position.x - 45, 44, camera.position.z - 100);
  hubGlow.position.set(0, 1.4, 0);
}
function resizeRenderer() {
  if (!renderer) return;
  var width = window.innerWidth || 1, height = window.innerHeight || 1;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resizeRenderer);
resizeRenderer();

/* -------------------------------------------------------------------------
   Retratos generados desde los mismos modelos
   ========================================================================= */
var portraitRenderer = null;
var portraitCache = {};
function ensurePortraitRenderer() {
  if (portraitRenderer) return portraitRenderer;
  var c = document.createElement('canvas');
  portraitRenderer = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true, preserveDrawingBuffer: true });
  portraitRenderer.setPixelRatio(1);
  portraitRenderer.setClearColor(0x000000, 0);
  portraitRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  portraitRenderer.toneMappingExposure = 1.15;
  portraitRenderer.outputColorSpace = THREE.SRGBColorSpace;
  return portraitRenderer;
}
function renderHeroPortrait(id, size, outfitOverride) {
  var s = size || 320;
  var explicit = outfitOverride !== undefined;
  var outfit = explicit ? (outfitOverride || {}) : (typeof getCharacterOutfit === 'function' ? getCharacterOutfit(id) : {});
  var outfitKey = Object.keys(outfit).sort().map(function (k) { return k + '=' + outfit[k]; }).join(',');
  var cacheKey = id + ':' + s + ':' + outfitKey;
  if (portraitCache[cacheKey]) return portraitCache[cacheKey];
  var r = ensurePortraitRenderer();
  r.setSize(s, s, false);
  var stage = new THREE.Scene();
  stage.add(new THREE.HemisphereLight('#b6c6ff', '#30222c', 1.9));
  var key = new THREE.DirectionalLight('#ffe2c4', 2.3);
  key.position.set(-3, 6, 5);
  stage.add(key);
  var fill = new THREE.DirectionalLight('#7ba6ff', 1.1);
  fill.position.set(4, 3, -3);
  stage.add(fill);
  var avatar = buildHeroAvatar(id);
  if (typeof applyOutfitToAvatar === 'function') applyOutfitToAvatar(avatar, id, outfit);
  var look = heroLook(id);
  /* Pose de presentación: el arma se separa de la silueta y queda visible en la mano. */
  avatar.root.rotation.y = -0.46;
  avatar.body.rotation.y = -0.04;
  avatar.head.rotation.y = 0.16;
  avatar.head.rotation.z = -0.012;
  avatar.rightArm.rotation.x = -0.18;
  avatar.rightArm.rotation.z = 0.94;
  avatar.rightArm.rotation.y = -0.05;
  avatar.weapon.rotation.z = -0.88;
  avatar.weapon.rotation.x = 0.06;
  avatar.weapon.position.z = 0.12;
  avatar.leftArm.rotation.x = -0.12;
  avatar.leftArm.rotation.z = -0.16;
  avatar.leftLeg.rotation.x = 0.04;
  avatar.rightLeg.rotation.x = -0.05;
  if (id === 'lia') {
    avatar.rightArm.rotation.x = -0.06;
    avatar.rightArm.rotation.z = 1.15;
    avatar.weapon.scale.setScalar(1.16);
  } else if (id === 'ona') {
    avatar.rightArm.rotation.z = 1.06;
    avatar.weapon.scale.setScalar(1.08);
  } else if (id === 'mara' || id === 'teo' || id === 'zenon' || id === 'iris') {
    avatar.rightArm.rotation.z = 0.82;
    avatar.weapon.rotation.z = -0.78;
  } else if (id === 'kian') {
    avatar.rightArm.rotation.x = 0.08;
    avatar.rightArm.rotation.z = 1.12;
    avatar.weapon.rotation.z = -1.04;
  }
  if (avatar.cape) avatar.cape.rotation.x = -0.06;
  if (avatar.hairTail) avatar.hairTail.rotation.x = 0.04;
  stage.add(avatar.root);
  var ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.018, 4, 40), new THREE.MeshBasicMaterial({ color: color(look.accent), transparent: true, opacity: 0.5 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.03;
  ring.scale.set(1.1, 1.1, 1);
  stage.add(ring);
  var glow = makeGlowSprite(look.accent, 3.6, 0.12);
  glow.position.y = 1.4;
  stage.add(glow);
  var box = new THREE.Box3().setFromObject(avatar.root);
  var center = box.getCenter(new THREE.Vector3());
  var extent = box.getSize(new THREE.Vector3());
  var cam = new THREE.PerspectiveCamera(25, 1, 0.1, 100);
  var dist = Math.max(extent.y / (2 * Math.tan(12.5 * Math.PI / 180)), extent.x * 1.35) * 1.12;
  cam.position.set(center.x + dist * 0.3, center.y + extent.y * 0.1, center.z + dist * 1.02);
  cam.lookAt(center.x, center.y - extent.y * 0.01, center.z);
  r.render(stage, cam);
  var data = r.domElement.toDataURL('image/png');
  portraitCache[cacheKey] = data;
  disposeObject(avatar.root);
  ring.geometry.dispose();
  ring.material.dispose();
  return data;
}
function renderSlots(size) {
  var out = {};
  var px = size || 256;
  Object.keys(HERO_SLOTS).forEach(function (slot) {
    var heroId = HERO_SLOTS[slot];
    if (GAME.slots && GAME.slots[slot] && GAME.slots[slot].custom && GAME.assets && GAME.assets[slot]) return;
    try { out[slot] = renderHeroPortrait(heroId, px); } catch (e) { reportError('retrato ' + heroId + ': ' + (e.message || e)); }
  });
  return out;
}
window.__renderSlots = renderSlots;

/* -------------------------------------------------------------------------
   Estado del motor de UI que depende del 3D
   ------------------------------------------------------------------------- */
function rebuildWorldSelection() {
  if (!heroAvatar) return;
  var id = state.collection.selectedCharacterId;
  if (heroAvatar.id !== id) {
    var root = heroAvatar.root;
    var isInArena = root.parent === arenaGroup;
    disposeObject(root);
    heroAvatar = buildHeroAvatar(id);
    if (typeof applyOutfitToAvatar === 'function') applyOutfitToAvatar(heroAvatar, id);
    if (isInArena) {
      arenaGroup.add(heroAvatar.root);
      heroAvatar.root.position.copy(duelPositions.hero);
      heroAvatar.root.rotation.y = Math.atan2(duelPositions.guardian.x - duelPositions.hero.x, duelPositions.guardian.z - duelPositions.hero.z);
    } else {
      heroHolder.add(heroAvatar.root);
      heroAvatar.root.position.set(hubHero.x, 0, hubHero.z);
      heroAvatar.root.rotation.y = hubHero.facing;
    }
    syncHudPortrait();
  }
}
