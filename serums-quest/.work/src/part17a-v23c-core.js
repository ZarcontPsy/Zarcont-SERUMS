/* =========================================================================
   V2.3 · FASE 2 · NÚCLEO DE COSMÉTICOS REFORZADOS
   -------------------------------------------------------------------------
   Registro de constructores por pieza y pequeñas herramientas compartidas por
   los seis agentes de trabajo. Cada agente escribe solo su propio archivo y
   registra aquí sus piezas; el integrador no reescribe sus modelos.
   ========================================================================= */
var V23C = window.V23C = window.V23C || {};

V23C.version = '2.3c-fase2';
V23C.revision = 'f2-1';
V23C.pieces = V23C.pieces || {};
V23C.anim = V23C.anim || {};
V23C.notes = V23C.notes || {};
V23C.gate = V23C.gate || {};

V23C.register = function (id, fn, note) {
  if (!id || typeof fn !== 'function') return false;
  V23C.pieces[id] = fn;
  if (note) V23C.notes[id] = note;
  return true;
};
V23C.registerMany = function (map, note) {
  Object.keys(map || {}).forEach(function (id) { V23C.register(id, map[id], note); });
};

/* Materiales y primitivas. Se usan formas reales (cilindro, cono, esfera,
   toro, plano) además de voxels para que la silueta no sea una caja. */
V23C.mat = function (hex, opts) {
  var o = opts || {};
  var m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(hex),
    roughness: o.roughness == null ? 0.52 : o.roughness,
    metalness: o.metalness == null ? 0.22 : o.metalness,
    emissive: new THREE.Color(o.emissive || '#000000'),
    emissiveIntensity: o.emissiveIntensity == null ? 1 : o.emissiveIntensity,
    transparent: !!o.transparent,
    opacity: o.opacity == null ? 1 : o.opacity,
    depthWrite: o.depthWrite !== false,
    side: o.side || THREE.FrontSide
  });
  return m;
};
V23C.basic = function (hex, opts) {
  var o = opts || {};
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(hex),
    transparent: !!o.transparent,
    opacity: o.opacity == null ? 1 : o.opacity,
    depthWrite: o.depthWrite !== false,
    blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    side: o.side || THREE.FrontSide,
    fog: false
  });
};
V23C.mesh = function (geometry, material, x, y, z) {
  var m = new THREE.Mesh(geometry, material);
  m.position.set(x || 0, y || 0, z || 0);
  return m;
};
V23C.box = function (w, h, d, hex, x, y, z, opts) {
  return V23C.mesh(new THREE.BoxGeometry(w, h, d), V23C.mat(hex, opts), x, y, z);
};
V23C.cyl = function (rt, rb, h, seg, hex, x, y, z, opts) {
  return V23C.mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 12), V23C.mat(hex, opts), x, y, z);
};
V23C.cone = function (r, h, seg, hex, x, y, z, opts) {
  return V23C.mesh(new THREE.ConeGeometry(r, h, seg || 10), V23C.mat(hex, opts), x, y, z);
};
V23C.sphere = function (r, hex, x, y, z, opts) {
  return V23C.mesh(new THREE.SphereGeometry(r, 14, 10), V23C.mat(hex, opts), x, y, z);
};
V23C.torus = function (r, tube, hex, x, y, z, opts) {
  return V23C.mesh(new THREE.TorusGeometry(r, tube, 5, 32), V23C.mat(hex, opts), x, y, z);
};
V23C.plane = function (w, h, hex, x, y, z, opts) {
  var m = V23C.mesh(new THREE.PlaneGeometry(w, h), V23C.mat(hex, opts), x, y, z);
  if (opts && opts.basic) m.material = V23C.basic(hex, opts);
  return m;
};
V23C.circle = function (r, hex, x, y, z, opts) {
  var m = V23C.mesh(new THREE.CircleGeometry(r, 36), V23C.mat(hex, opts), x, y, z);
  return m;
};
V23C.glow = function (hex, scale, x, y, z, opacity) {
  var s = makeGlowSprite(hex, scale, opacity == null ? 0.3 : opacity);
  s.position.set(x || 0, y || 0, z || 0);
  return s;
};
V23C.soft = function (hex, w, h, x, y, z, opacity) {
  var s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: SOFT_GLOW, color: new THREE.Color(hex), transparent: true,
    opacity: opacity == null ? 0.18 : opacity, depthWrite: false,
    blending: THREE.AdditiveBlending, fog: false
  }));
  s.scale.set(w, h, 1);
  s.position.set(x || 0, y || 0, z || 0);
  return s;
};
V23C.line = function (points, hex, opacity) {
  var geo = new THREE.BufferGeometry().setFromPoints(points);
  var line = new THREE.Line(geo, new THREE.LineBasicMaterial({
    color: new THREE.Color(hex), transparent: true, opacity: opacity == null ? 0.5 : opacity,
    depthWrite: false, blending: THREE.AdditiveBlending, fog: false
  }));
  return line;
};
V23C.group = function (children) {
  var g = new THREE.Group();
  (children || []).forEach(function (c) { if (c) g.add(c); });
  return g;
};
V23C.addAnim = function (group, spec) {
  if (!group.userData.anim) group.userData.anim = [];
  group.userData.anim.push(spec);
  return spec;
};

/* Texto en canvas para runas, etiquetas y placas. */
V23C.texture = function (text, opts) {
  var o = opts || {};
  var w = o.w || 256, h = o.h || 128;
  var c = document.createElement('canvas');
  c.width = w; c.height = h;
  var g = c.getContext('2d');
  g.clearRect(0, 0, w, h);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = (o.weight || '700') + ' ' + (o.size || 64) + 'px ' + (o.font || 'Bahnschrift, "Segoe UI", sans-serif');
  if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = o.glowBlur || 14; }
  g.fillStyle = o.color || '#f5f1e7';
  g.fillText(text, w / 2, h / 2 + (o.dy || 0));
  var tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};
V23C.signSprite = function (text, hex, scale, opts) {
  var o = opts || {};
  var sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: V23C.texture(text, { w: 512, h: 96, size: o.size || 50, color: o.color || '#f5f1e7', glow: o.glow }),
    transparent: true, depthWrite: false, fog: false
  }));
  sp.scale.set((scale || 1) * 2.5, (scale || 1) * 0.47, 1);
  return sp;
};

/* Animaciones adicionales para las firmas de la fase 2. Se ejecutan antes de
   las animaciones históricas; no las sustituyen. */
V23C.update = function (av, dt, time, running, speedNorm) {
  if (!av || !av.cosmetics || !av.cosmetics.animated) return;
  av.cosmetics.animated.forEach(function (a) {
    var g = a.group;
    if (!g) return;
    if (a.type === 'v23c-spin') {
      g.rotation.y = time * (a.speed || 0.6) + (a.phase || 0);
    } else if (a.type === 'v23c-spin-x') {
      g.rotation.x = time * (a.speed || 0.6) + (a.phase || 0);
    } else if (a.type === 'v23c-bob') {
      g.position.y = (a.baseY || g.position.y) + Math.sin(time * (a.speed || 1.2) + (a.phase || 0)) * (a.amplitude || 0.04);
    } else if (a.type === 'v23c-pulse') {
      var k = 1 + Math.sin(time * (a.speed || 1.5) + (a.phase || 0)) * (a.amplitude || 0.08);
      g.scale.setScalar(k);
    } else if (a.type === 'v23c-sway') {
      g.rotation.z = Math.sin(time * (a.speed || 1.1) + (a.phase || 0)) * (a.amplitude || 0.06);
      g.rotation.x = Math.cos(time * (a.speed || 0.9) + (a.phase || 0)) * (a.amplitude || 0.04);
    } else if (a.type === 'v23c-orbit') {
      var radius = a.radius || 0.6;
      var ay = a.baseY == null ? 1.2 : a.baseY;
      var ax = a.baseX == null ? 0 : a.baseX;
      var az = a.baseZ == null ? 0 : a.baseZ;
      var ang = time * (a.speed || 0.6) + (a.phase || 0);
      g.position.set(ax + Math.cos(ang) * radius, ay + (a.tilt ? Math.sin(ang * 2) * a.tilt : 0), az + Math.sin(ang) * radius * 0.55);
      g.rotation.y = -ang;
    } else if (a.type === 'v23c-rays') {
      if (a.rays) a.rays.rotation.z = time * (a.speed || 0.08);
      if (a.disc) a.disc.scale.setScalar(1 + Math.sin(time * 1.4) * 0.025);
    } else if (a.type === 'v23c-bands') {
      if (a.bands) a.bands.forEach(function (b, i) { b.rotation.y = time * (0.18 + i * 0.04) * (i % 2 ? -1 : 1); });
      if (a.ring) a.ring.rotation.z = time * 0.45;
    } else if (a.type === 'v23c-twinkle') {
      (a.stars || []).forEach(function (s, i) {
        var v = 0.55 + 0.45 * Math.sin(time * 1.7 + i * 1.3);
        if (s.material) s.material.opacity = v * (a.baseOpacity || 0.85);
      });
    } else if (a.type === 'v23c-dissolve') {
      if (a.parts) a.parts.forEach(function (p, i) {
        var u = (time * 0.12 + i * 0.07) % 1;
        p.position.y = (p.userData.baseY || 0) + u * (a.rise || 0.6);
        p.position.x = (p.userData.baseX || 0) + Math.sin(u * 6.28 + i) * 0.05;
        if (p.material) p.material.opacity = (1 - u) * (a.opacity || 0.55);
      });
    } else if (a.type === 'v23c-trail-arc') {
      if (a.arc) a.arc.rotation.z = -time * 0.2;
      if (a.sparks) a.sparks.forEach(function (s, i) {
        var u = (time * 0.5 + i * 0.13) % 1;
        s.position.y = 0.1 + u * 1.7;
        s.position.x = Math.sin(u * 3.14) * (i % 2 ? 0.6 : -0.6) * u;
        if (s.material) s.material.opacity = (1 - u) * 0.75;
      });
    }
  });
};

/* Estadísticas básicas de una pieza para la puerta de calidad. */
V23C.stats = function (group) {
  var meshes = 0, colors = {}, emissive = 0, animated = 0, sprites = 0;
  group.traverse(function (n) {
    if (n.isMesh) {
      meshes += 1;
      if (n.material) {
        if (n.material.color) colors[n.material.color.getHexString()] = 1;
        if (n.material.emissive && (n.material.emissive.r + n.material.emissive.g + n.material.emissive.b) > 0.02) emissive += 1;
      }
    }
    if (n.isSprite) sprites += 1;
  });
  animated = (group.userData.anim || []).length;
  return { meshes: meshes, tones: Object.keys(colors).length, emissive: emissive, sprites: sprites, animated: animated };
};
