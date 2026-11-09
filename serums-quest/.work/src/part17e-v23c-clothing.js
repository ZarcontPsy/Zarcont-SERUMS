/* =========================================================================
   V2.3 · FASE 2 · AGENTE 5 · ROPA
   -------------------------------------------------------------------------
   Modelos reforzados de cabezas, peinados, torsos y piernas.
   Convenciones: cabeza/peinado hijo de avatar.head (cuello y=0, +Z cara);
   torso hijo de avatar.torso (y≈-0,3…0,8, +Z pecho); piernas en pareja sobre
   avatar.leftLeg / rightLeg, en espacio del cuerpo (pie y≈0).
   Solo V23C: primitivas, materiales, brillos y animaciones.
   ========================================================================= */
;(function () {
  var V23C = window.V23C;
  if (!V23C || typeof V23C.register !== 'function') return;

  var PI = Math.PI, TAU = Math.PI * 2;

  /* Paleta del Observatorio, con sombras propias para tela, papel y metal. */
  var C = {
    bone: '#f2f0ea', bone2: '#ddd8c9', bone3: '#bcb7a6',
    paper: '#f0e4c5', paper2: '#ddcba3', paper3: '#c3ad80', fold: '#8f7c57',
    ink: '#243040', night: '#141a25', navy: '#1b2440', navy2: '#151d31',
    blue: '#7aa2ff', blue2: '#3f5d8c', blue3: '#2c3c64',
    teal: '#69d3c1', teal2: '#2f6f66',
    violet: '#c49bff', violet2: '#7a4bd0', violet3: '#3a2d63',
    rose: '#ff8b9d', rose2: '#a23a5a',
    gold: '#e4c07a', gold2: '#b98a4e', amber: '#f3b562',
    steel: '#8e99a8', steel2: '#c7d2e0', steel3: '#3c4654',
    wood: '#5a4632', wood2: '#3a2c20', leather: '#4a302b', leather2: '#2b1f1c',
    olive: '#556b4a', olive2: '#3f5238', glass: '#d9fbff'
  };

  var CLOTH = { roughness: 0.88, metalness: 0.03 };
  var SOFT = { roughness: 0.93, metalness: 0.01 };
  var PAPER = { roughness: 0.9, metalness: 0.02 };
  var METAL = { roughness: 0.3, metalness: 0.75 };
  var DULL = { roughness: 0.58, metalness: 0.35 };

  function EM(hex, k) {
    return { emissive: hex, emissiveIntensity: k == null ? 0.95 : k, roughness: 0.45, metalness: 0.12 };
  }
  function Q(qf, base) { return Math.max(1, Math.round(base * (qf == null ? 0.72 : qf))); }
  function H(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  function bx(g, w, h, d, hex, x, y, z, o) { var m = V23C.box(w, h, d, hex, x, y, z, o); g.add(m); return m; }
  function cy(g, rt, rb, h, seg, hex, x, y, z, o) { var m = V23C.cyl(rt, rb, h, seg, hex, x, y, z, o); g.add(m); return m; }
  function cn(g, r, h, seg, hex, x, y, z, o) { var m = V23C.cone(r, h, seg, hex, x, y, z, o); g.add(m); return m; }
  function bl(g, r, hex, x, y, z, o) { var m = V23C.sphere(r, hex, x, y, z, o); g.add(m); return m; }
  function tr(g, r, tube, hex, x, y, z, o) { var m = V23C.torus(r, tube, hex, x, y, z, o); g.add(m); return m; }
  function pl(g, w, h, hex, x, y, z, o) { var m = V23C.plane(w, h, hex, x, y, z, o); g.add(m); return m; }
  function dc(g, r, hex, x, y, z, o) { var m = V23C.circle(r, hex, x, y, z, o); g.add(m); return m; }
  function ln(g, pts, hex, op) { var m = V23C.line(pts, hex, op); g.add(m); return m; }
  function gl(g, hex, scale, x, y, z, op) { var s = V23C.glow(hex, scale, x, y, z, op); g.add(s); return s; }
  function sf(g, hex, w, h, x, y, z, op) { var s = V23C.soft(hex, w, h, x, y, z, op); g.add(s); return s; }
  function st(g, hex, x, y, z, size, op) { return gl(g, hex, size, x, y, z, op == null ? 0.85 : op); }
  function an(g, spec) { V23C.addAnim(g, spec); }
  function bothLegs(avatar, make) {
    if (!avatar || !avatar.leftLeg || !avatar.rightLeg) return [];
    return [
      { parent: avatar.leftLeg, group: make(-1) },
      { parent: avatar.rightLeg, group: make(1) }
    ];
  }

  /* -----------------------------------------------------------------------
     CABEZAS
     ----------------------------------------------------------------------- */

  /* Diadema de circuitos (raro): cinta, placa, pistas luminosas, nodos y cintas. */
  V23C.register('c-cabeza-diadema', function () {
    var g = new THREE.Group();
    var band = tr(g, 0.264, 0.024, C.violet2, 0, 0.468, 0, METAL);
    band.rotation.x = PI / 2; band.scale.y = 0.93;
    var band2 = tr(g, 0.257, 0.009, C.gold, 0, 0.452, 0, METAL);
    band2.rotation.x = PI / 2; band2.scale.y = 0.94;

    bx(g, 0.2, 0.09, 0.045, '#2a3556', 0, 0.468, 0.235, DULL);
    bx(g, 0.15, 0.055, 0.02, C.violet, 0, 0.47, 0.261, METAL);
    bx(g, 0.105, 0.012, 0.012, C.gold, 0, 0.505, 0.264, METAL);
    tr(g, 0.033, 0.008, C.gold2, 0, 0.5, 0.266, METAL);

    var nodes = [];
    [-0.085, 0, 0.085].forEach(function (x, i) {
      var col = i === 0 ? C.blue : C.teal;
      bl(g, 0.019, col, x, 0.468, 0.273, EM(col, 1.6));
      nodes.push(gl(g, col, 0.15, x, 0.468, 0.277, 0.9));
    });
    ln(g, [V3(-0.205, 0.47, 0.236), V3(-0.14, 0.488, 0.248), V3(-0.085, 0.468, 0.258)], C.teal, 0.85);
    ln(g, [V3(0.205, 0.47, 0.236), V3(0.14, 0.488, 0.248), V3(0.085, 0.468, 0.258)], C.blue, 0.85);
    ln(g, [V3(-0.085, 0.468, 0.258), V3(-0.042, 0.452, 0.262), V3(0.0, 0.468, 0.258)], C.violet, 0.7);

    [-1, 1].forEach(function (s) {
      var cap = cy(g, 0.034, 0.042, 0.055, 8, C.violet, s * 0.262, 0.462, 0.0, METAL);
      cap.rotation.z = PI / 2;
      bl(g, 0.018, C.gold, s * 0.292, 0.462, 0.0, METAL);
      var rib = bx(g, 0.058, 0.2, 0.014, s < 0 ? C.violet2 : C.violet, s * 0.085, 0.36, -0.25, CLOTH);
      rib.rotation.x = 0.15; rib.rotation.z = s * 0.08;
      bx(g, 0.052, 0.035, 0.02, C.gold, s * 0.09, 0.25, -0.272, METAL);
    });
    an(g, { type: 'v23c-twinkle', stars: nodes, baseOpacity: 0.9 });
    return g;
  }, 'diadema de circuitos');

  /* Casco de vigía (épico): cresta, visera, lente animada, lámparas y remaches. */
  V23C.register('c-cabeza-casco', function (c, qf) {
    var g = new THREE.Group();
    cy(g, 0.205, 0.306, 0.24, 14, C.steel3, 0, 0.53, 0, METAL);
    var dome = bl(g, 0.285, C.steel, 0, 0.625, 0, METAL);
    dome.scale.set(1.06, 0.56, 1.0);
    var brow = tr(g, 0.302, 0.027, C.steel2, 0, 0.448, 0, METAL);
    brow.rotation.x = PI / 2; brow.scale.y = 0.9;
    bx(g, 0.36, 0.058, 0.026, '#2b3a55', 0, 0.452, 0.247, DULL);
    bx(g, 0.3, 0.018, 0.016, C.gold, 0, 0.448, 0.263, METAL);

    /* Visera corta por encima de los ojos. */
    var visor = bx(g, 0.4, 0.034, 0.15, C.steel3, 0, 0.415, 0.285, DULL);
    visor.rotation.x = -0.12;
    var lip = bx(g, 0.34, 0.012, 0.14, C.gold2, 0, 0.407, 0.292, DULL);
    lip.rotation.x = -0.12;

    /* Guardas y remaches del borde. */
    [-1, 1].forEach(function (s) {
      var guard = bx(g, 0.07, 0.2, 0.26, C.steel3, s * 0.29, 0.35, 0.0, DULL);
      guard.rotation.z = s * 0.06;
      var hinge = cy(g, 0.028, 0.028, 0.05, 8, C.gold2, s * 0.323, 0.4, 0.02, METAL);
      hinge.rotation.z = PI / 2;
    });
    [-0.24, -0.12, 0, 0.12, 0.24].forEach(function (x, i) {
      bl(g, 0.014, i % 2 ? C.gold2 : C.steel2, x, 0.452, 0.253, METAL);
    });

    /* Lámparas laterales delanteras. */
    var lamps = [];
    [-1, 1].forEach(function (s) {
      var house = cy(g, 0.044, 0.05, 0.07, 10, '#202a3f', s * 0.238, 0.43, 0.205, METAL);
      house.rotation.x = PI / 2;
      tr(g, 0.043, 0.009, C.gold2, s * 0.238, 0.43, 0.242, METAL);
      dc(g, 0.032, C.amber, s * 0.238, 0.43, 0.244, EM(C.amber, 1.7));
      lamps.push(gl(g, C.amber, 0.2, s * 0.238, 0.43, 0.25, 0.95));
    });

    /* Cresta: montura, aleta, cono y cresta trasera. */
    bx(g, 0.075, 0.06, 0.34, C.steel3, 0, 0.79, 0, DULL);
    var fin = bx(g, 0.034, 0.18, 0.28, '#2b3a55', 0, 0.86, -0.01, DULL);
    fin.rotation.x = 0.14;
    cn(g, 0.045, 0.2, 6, C.steel2, 0, 0.99, 0.03, METAL);
    var tail = cn(g, 0.036, 0.16, 6, C.steel3, 0, 0.9, -0.14, METAL);
    tail.rotation.x = -0.55;
    var ridge = bx(g, 0.012, 0.06, 0.24, C.gold, 0, 0.925, 0.03, METAL);
    ridge.rotation.x = 0.12;

    /* Lente de barrido: aro, cristal, órbita de nodos. */
    var lensY = 0.552, lensZ = 0.272;
    tr(g, 0.078, 0.016, C.gold2, 0, lensY, lensZ, METAL);
    var lensCore = dc(g, 0.06, C.blue, 0, lensY, lensZ + 0.004, EM(C.blue, 1.4));
    dc(g, 0.034, C.glass, 0, lensY, lensZ + 0.008, EM(C.glass, 1.8));
    var lensGlow = gl(g, C.glass, 0.32, 0, lensY, lensZ + 0.012, 0.85);
    var scan = new THREE.Group();
    scan.position.set(0, lensY, lensZ + 0.006);
    g.add(scan);
    var scanRing = tr(scan, 0.1, 0.008, C.glass, 0, 0, 0, EM(C.glass, 1.5));
    scanRing.rotation.x = 0.45;
    for (var i = 0; i < 3; i++) {
      var a = i / 3 * TAU;
      bl(scan, 0.013, C.teal, Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0, EM(C.teal, 1.4));
    }
    var crestGem = bl(g, 0.026, C.teal, 0, 0.815, 0.152, EM(C.teal, 1.6));
    gl(g, C.teal, 0.18, 0, 0.815, 0.16, 0.8);

    an(g, { type: 'v23c-rays', rays: scan, disc: lensCore, speed: 0.55 });
    an(g, { type: 'v23c-twinkle', stars: lamps.concat([lensGlow]), baseOpacity: 0.95 });
    return g;
  }, 'casco de vigía animado');

  /* Gorro de campaña (común): copa blanda, vuelta, ala, insignia y costuras. */
  V23C.register('c-cabeza-gorro', function () {
    var g = new THREE.Group();
    var dome = bl(g, 0.29, C.olive, 0, 0.61, 0, CLOTH);
    dome.scale.set(1.02, 0.6, 0.98);
    cn(g, 0.085, 0.13, 8, C.olive2, -0.055, 0.73, -0.02, CLOTH);
    var cuff = tr(g, 0.286, 0.026, C.olive2, 0, 0.532, 0, CLOTH);
    cuff.rotation.x = PI / 2; cuff.scale.y = 0.92;
    var fold = cy(g, 0.285, 0.296, 0.045, 16, C.olive2, 0, 0.545, 0, CLOTH);

    var brim = bx(g, 0.44, 0.028, 0.2, C.wood2, 0, 0.503, 0.27, CLOTH);
    brim.rotation.x = 0.14;
    var brimLip = cy(g, 0.026, 0.026, 0.4, 8, '#2a3626', 0, 0.5, 0.366, CLOTH);
    brimLip.rotation.z = PI / 2;
    var brimEdge = bx(g, 0.4, 0.021, 0.02, C.wood, 0, 0.509, 0.36, CLOTH);
    brimEdge.rotation.x = 0.14;

    [-1, 1].forEach(function (s) {
      var flap = bx(g, 0.05, 0.13, 0.2, C.olive2, s * 0.287, 0.43, -0.04, CLOTH);
      flap.rotation.z = s * 0.1;
      bx(g, 0.032, 0.08, 0.02, C.wood, s * 0.29, 0.465, 0.075, CLOTH);
      bl(g, 0.011, C.gold2, s * 0.29, 0.505, 0.082, METAL);
    });

    /* Insignia de ruta. */
    tr(g, 0.055, 0.009, C.gold2, 0, 0.565, 0.284, METAL);
    dc(g, 0.048, '#2a3626', 0, 0.565, 0.287, DULL);
    tr(g, 0.03, 0.007, C.teal, 0, 0.565, 0.291, METAL);
    ln(g, [V3(-0.036, 0.553, 0.294), V3(-0.012, 0.572, 0.294), V3(0.022, 0.558, 0.294), V3(0.04, 0.574, 0.294)], C.bone, 0.8);
    bx(g, 0.26, 0.012, 0.012, C.wood, 0, 0.515, 0.255, CLOTH).rotation.x = 0.14;
    ln(g, [V3(-0.21, 0.532, 0.2), V3(-0.12, 0.548, 0.23), V3(0.12, 0.548, 0.23), V3(0.21, 0.532, 0.2)], C.olive2, 0.5);
    return g;
  }, 'gorro de campaña');

  /* Corona de constelaciones (legendario): cinco puntas, joyas y dos órbitas. */
  V23C.register('c-cabeza-corona', function (c, qf) {
    var g = new THREE.Group();
    var band = tr(g, 0.258, 0.032, C.gold, 0, 0.585, 0, METAL);
    band.rotation.x = PI / 2; band.scale.y = 0.9;
    var band2 = tr(g, 0.25, 0.011, C.gold2, 0, 0.554, 0, METAL);
    band2.rotation.x = PI / 2; band2.scale.y = 0.91;

    var tips = [];
    var angles = [0, 72, -72, 144, -144];
    var tipCols = [C.teal, C.violet, C.blue, C.violet, C.teal];
    angles.forEach(function (deg, i) {
      var a = deg * PI / 180;
      var x = Math.sin(a) * 0.235, z = Math.cos(a) * 0.225;
      var h = 0.31 - Math.abs(a) / PI * 0.13;
      var base = cy(g, 0.046, 0.062, 0.03, 6, C.gold2, x, 0.62, z, METAL);
      var spike = cn(g, 0.042, h, 6, C.gold, x, 0.635 + h / 2, z, METAL);
      spike.rotation.y = a;
      tr(g, 0.05, 0.008, C.gold2, x, 0.635, z, METAL).rotation.x = PI / 2;
      bl(g, 0.026, tipCols[i], x, 0.646 + h, z, EM(tipCols[i], 1.2));
      tips.push(st(g, tipCols[i], x, 0.646 + h, z, 0.14, 0.8));
    });

    /* Joyas entre puntas. */
    [36, 108, -36, -108, 180].forEach(function (deg, i) {
      var a = deg * PI / 180;
      var x = Math.sin(a) * 0.246, z = Math.cos(a) * 0.238;
      var col = i % 2 ? C.teal : C.violet;
      tr(g, 0.035, 0.008, C.gold2, x, 0.592, z, METAL);
      bl(g, 0.027, col, x, 0.592, z, EM(col, 1.1));
      if (i < 3) tips.push(st(g, col, x, 0.592, z, 0.12, 0.75));
    });

    /* Gema frontal y cruz de luz. */
    var frontGem = bl(g, 0.045, C.violet, 0, 0.59, 0.25, EM(C.violet, 1.5));
    tr(g, 0.056, 0.01, C.gold, 0, 0.59, 0.255, METAL);
    bx(g, 0.018, 0.11, 0.012, C.glass, 0, 0.59, 0.262, EM(C.glass, 1.4)).rotation.z = 0.4;
    bx(g, 0.018, 0.11, 0.012, C.glass, 0, 0.59, 0.262, EM(C.glass, 1.4)).rotation.z = -0.4;
    bl(g, 0.031, C.gold, 0, 0.64, 0.0, EM(C.gold, 0.7));

    /* Órbita horizontal de estrellas. */
    var orbitA = new THREE.Group();
    orbitA.position.set(0, 0.8, 0);
    g.add(orbitA);
    var n = Q(qf, 7);
    for (var i = 0; i < n; i++) {
      var a2 = i / n * TAU + 0.3;
      var rr = 0.32 + H(i + 4) * 0.06;
      var x2 = Math.cos(a2) * rr, z2 = Math.sin(a2) * rr;
      var y2 = (H(i + 9) - 0.5) * 0.07;
      tips.push(st(orbitA, i % 3 ? C.gold : C.glass, x2, y2, z2, 0.1 + H(i) * 0.04, 0.85));
      if (i % 2 === 0) bl(orbitA, 0.012, C.glass, x2, y2, z2, EM(C.glass, 1.2));
    }

    /* Órbita vertical corta y partículas propias. */
    var orbitB = new THREE.Group();
    orbitB.position.set(0, 0.9, 0.0);
    g.add(orbitB);
    var m = Q(qf, 5);
    for (var j = 0; j < m; j++) {
      var a3 = j / m * TAU;
      tips.push(st(orbitB, C.gold, Math.cos(a3) * 0.18, Math.sin(a3) * 0.18, 0.01, 0.09, 0.8));
    }
    var parts = [];
    var pn = Q(qf, 6);
    for (var k = 0; k < pn; k++) {
      var px = (H(k * 3 + 1) - 0.5) * 0.5;
      var py = 0.64 + H(k * 7 + 2) * 0.2;
      var pz = (H(k * 11 + 5) - 0.5) * 0.28;
      var p = gl(g, C.gold, 0.1, px, py, pz, 0.7);
      p.userData.baseX = px; p.userData.baseY = py;
      parts.push(p);
    }
    gl(g, C.gold, 0.95, 0, 0.78, -0.02, 0.16);
    an(g, { type: 'v23c-bands', bands: [orbitA] });
    an(g, { type: 'v23c-rays', rays: orbitB, disc: frontGem, speed: 0.35 });
    an(g, { type: 'v23c-twinkle', stars: tips, baseOpacity: 0.9 });
    an(g, { type: 'v23c-dissolve', parts: parts, rise: 0.5, opacity: 0.7 });
    return g;
  }, 'corona legendaria con órbitas');

  /* Auriculares de foco (poco común): banda, copas, diadema, luces y micro. */
  V23C.register('c-cabeza-auriculares', function () {
    var g = new THREE.Group();
    var glowLights = [];
    [-1, 1].forEach(function (s) {
      var cup = cy(g, 0.09, 0.1, 0.07, 12, '#26344b', s * 0.29, 0.35, 0.0, DULL);
      cup.rotation.z = PI / 2;
      var cushion = tr(g, 0.075, 0.018, '#1b2638', s * 0.252, 0.35, 0.0, CLOTH);
      cushion.rotation.y = PI / 2;
      var cap = dc(g, 0.075, '#44536b', s * 0.327, 0.35, 0.0, METAL);
      cap.rotation.y = s * PI / 2;
      var led = dc(g, 0.031, C.teal, s * 0.331, 0.35, 0.0, DULL);
      led.rotation.y = s * PI / 2;
      bl(g, 0.012, C.blue, s * 0.336, 0.35, 0.0, METAL);
      glowLights.push(gl(g, C.teal, 0.16, s * 0.338, 0.35, 0.0, 0.55));
      var arm = cy(g, 0.018, 0.018, 0.12, 6, C.steel3, s * 0.28, 0.46, 0.0, METAL);
      arm.rotation.z = s * 0.28;
    });

    /* Banda sobre la cabeza, por segmentos. */
    var segs = [
      [-0.27, 0.465, 0.52], [-0.235, 0.55, 0.2], [-0.14, 0.635, 0.02],
      [0, 0.662, 0], [0.14, 0.635, -0.02], [0.235, 0.55, -0.2], [0.27, 0.465, -0.52]
    ];
    segs.forEach(function (q) {
      var bar = bx(g, 0.085, 0.034, 0.06, '#26344b', q[0], q[1], 0.0, DULL);
      bar.rotation.z = q[2];
      var inlay = bx(g, 0.07, 0.012, 0.064, C.teal, q[0], q[1] + 0.006, 0.0, DULL);
      inlay.rotation.z = q[2];
    });

    /* Diadema de sujeción. */
    var crown = tr(g, 0.256, 0.009, C.gold2, 0, 0.512, 0, METAL);
    crown.rotation.x = PI / 2; crown.scale.y = 0.9;
    bx(g, 0.07, 0.028, 0.024, C.teal, 0, 0.512, 0.235, DULL);
    glowLights.push(gl(g, C.teal, 0.11, 0, 0.512, 0.252, 0.45));

    /* Micrófono articulado. */
    var boom = cy(g, 0.008, 0.008, 0.2, 6, C.steel3, -0.195, 0.4, 0.15, METAL);
    boom.rotation.x = PI / 2; boom.rotation.y = 0.55;
    var mic = bl(g, 0.02, '#1b2638', -0.155, 0.405, 0.235, DULL);
    bl(g, 0.009, C.blue, -0.155, 0.405, 0.251, METAL);
    bx(g, 0.016, 0.03, 0.02, C.gold2, -0.245, 0.4, 0.08, METAL);
    return g;
  }, 'auriculares de foco');

  /* -----------------------------------------------------------------------
     PEINADOS
     ----------------------------------------------------------------------- */

  /* Coleta de cometa (común): casquete, flequillo barrido y cola segmentada. */
  V23C.register('c-peinado-coleta', function () {
    var g = new THREE.Group();
    var cap = bl(g, 0.285, '#5b3423', 0, 0.575, -0.005, CLOTH);
    cap.scale.set(1.0, 0.56, 0.96);
    bx(g, 0.46, 0.2, 0.16, '#4a2a1d', 0, 0.44, -0.18, CLOTH);
    [-1, 1].forEach(function (s) {
      bx(g, 0.08, 0.22, 0.3, '#5b3423', s * 0.235, 0.47, -0.05, CLOTH);
    });
    var f1 = bx(g, 0.24, 0.07, 0.13, '#76452c', 0.03, 0.485, 0.215, CLOTH);
    f1.rotation.z = -0.12;
    var f2 = bx(g, 0.16, 0.06, 0.12, '#8f5a3a', 0.13, 0.455, 0.225, CLOTH);
    f2.rotation.z = -0.28;
    var f3 = bx(g, 0.1, 0.045, 0.1, '#3f2419', -0.1, 0.5, 0.23, CLOTH);
    f3.rotation.z = 0.18;

    /* Coleta alta, a un lado, con mechones. */
    tr(g, 0.052, 0.019, C.gold, 0.13, 0.652, -0.21, METAL);
    cy(g, 0.046, 0.05, 0.055, 8, '#3f2419', 0.13, 0.652, -0.21, CLOTH).rotation.x = PI / 2;
    bl(g, 0.085, '#5b3423', 0.16, 0.7, -0.255, CLOTH);
    bl(g, 0.1, '#76452c', 0.2, 0.63, -0.33, CLOTH);
    var seg1 = cy(g, 0.07, 0.09, 0.22, 8, '#5b3423', 0.225, 0.53, -0.365, CLOTH);
    seg1.rotation.x = 0.14; seg1.rotation.z = -0.1;
    var seg2 = cy(g, 0.052, 0.07, 0.2, 8, '#76452c', 0.235, 0.38, -0.39, CLOTH);
    seg2.rotation.x = 0.08; seg2.rotation.z = -0.06;
    var tip = cn(g, 0.058, 0.2, 8, '#8f5a3a', 0.225, 0.25, -0.4, CLOTH);
    tip.rotation.x = PI;
    var strand = bx(g, 0.026, 0.34, 0.02, '#3f2419', 0.185, 0.42, -0.36, CLOTH);
    strand.rotation.x = 0.12;
    var strand2 = bx(g, 0.02, 0.26, 0.018, '#6d4028', 0.26, 0.42, -0.38, CLOTH);
    strand2.rotation.x = 0.12; strand2.rotation.z = -0.08;
    bl(g, 0.02, C.teal, 0.235, 0.4, -0.4, METAL);
    bl(g, 0.022, C.gold, 0.225, 0.16, -0.405, METAL);
    return g;
  }, 'coleta de cometa');

  /* Rizos de tinta (poco común): volumen irregular, rizos y brillo azulado. */
  V23C.register('c-peinado-rizos', function () {
    var g = new THREE.Group();
    var cap = bl(g, 0.28, '#241c2b', 0, 0.57, -0.01, CLOTH);
    cap.scale.set(1.0, 0.55, 0.96);
    var curls = [
      [0.0, 0.66, -0.06, 0.135, '#2f2437'], [-0.14, 0.64, 0.02, 0.12, '#35283d'],
      [0.15, 0.63, 0.0, 0.12, '#403150'], [-0.22, 0.56, 0.05, 0.1, '#2f2437'],
      [0.23, 0.55, 0.04, 0.11, '#35283d'], [-0.24, 0.45, 0.0, 0.09, '#403150'],
      [0.25, 0.43, 0.0, 0.1, '#2f2437'], [-0.2, 0.34, 0.03, 0.08, '#35283d'],
      [0.21, 0.32, 0.04, 0.08, '#403150'], [0, 0.7, -0.12, 0.14, '#403150'],
      [-0.12, 0.6, -0.2, 0.12, '#2f2437'], [0.12, 0.58, -0.22, 0.12, '#35283d'],
      [0, 0.45, -0.24, 0.13, '#241c2b'], [-0.06, 0.71, 0.06, 0.1, '#56406a'],
      [0.07, 0.67, 0.12, 0.085, '#56406a'], [-0.17, 0.27, -0.04, 0.075, '#241c2b'],
      [0.18, 0.25, -0.06, 0.075, '#35283d']
    ];
    curls.forEach(function (q) { bl(g, q[3], q[4], q[0], q[1], q[2], CLOTH); });
    var rings = [
      [-0.265, 0.3, 0.02, 0.045, '#1c1522'], [0.27, 0.28, 0.0, 0.05, '#2f2437'],
      [-0.24, 0.18, -0.04, 0.04, '#2f2437'], [0.235, 0.16, -0.07, 0.04, '#403150']
    ];
    rings.forEach(function (q) {
      var r = tr(g, q[3], 0.019, q[4], q[0], q[1], q[2], CLOTH);
      r.rotation.z = q[0] < 0 ? -0.3 : 0.3;
    });
    var coil = cy(g, 0.035, 0.045, 0.16, 6, '#35283d', -0.255, 0.24, 0.05, CLOTH);
    coil.rotation.z = 0.2;
    var coil2 = cy(g, 0.03, 0.04, 0.14, 6, '#403150', 0.255, 0.22, 0.04, CLOTH);
    coil2.rotation.z = -0.24;
    bx(g, 0.16, 0.02, 0.05, '#6d5588', -0.05, 0.69, 0.1, CLOTH).rotation.z = -0.15;
    bx(g, 0.12, 0.018, 0.04, '#56406a', 0.14, 0.66, 0.08, CLOTH).rotation.z = -0.3;
    bx(g, 0.1, 0.016, 0.03, '#465b8a', 0.02, 0.72, -0.02, CLOTH).rotation.z = 0.1;
    return g;
  }, 'rizos de tinta');

  /* Mecha violeta (raro): franja que sigue el peinado, degradado y punta luminosa. */
  V23C.register('c-peinado-mecha', function (c, qf) {
    var g = new THREE.Group();
    var cap = bl(g, 0.28, '#2a1e17', 0, 0.575, -0.005, CLOTH);
    cap.scale.set(1.0, 0.56, 0.96);
    bx(g, 0.44, 0.18, 0.15, '#3c2a20', 0, 0.44, -0.18, CLOTH);
    var side = bx(g, 0.08, 0.22, 0.32, '#2a1e17', -0.235, 0.47, -0.04, CLOTH);
    side.rotation.z = -0.05;
    var fringeA = bx(g, 0.22, 0.06, 0.13, '#3c2a20', -0.03, 0.488, 0.22, CLOTH);
    fringeA.rotation.z = 0.14;
    var fringeB = bx(g, 0.12, 0.05, 0.1, '#4a3527', 0.13, 0.463, 0.228, CLOTH);
    fringeB.rotation.z = -0.22;

    /* Mechón lateral con degradado. */
    var root = bx(g, 0.1, 0.16, 0.1, '#3a2350', 0.13, 0.65, 0.12, CLOTH);
    root.rotation.z = -0.22;
    var seg1 = bx(g, 0.09, 0.2, 0.085, '#5a36a0', 0.205, 0.55, 0.08, CLOTH);
    seg1.rotation.z = -0.3;
    var seg2 = bx(g, 0.08, 0.2, 0.075, '#7a4bd0', 0.255, 0.42, 0.02, CLOTH);
    seg2.rotation.z = -0.2;
    var seg3 = bx(g, 0.07, 0.18, 0.065, '#a36cff', 0.285, 0.28, -0.04, CLOTH);
    seg3.rotation.z = -0.1;
    var tip = cn(g, 0.05, 0.18, 6, C.violet, 0.295, 0.15, -0.07, CLOTH);
    tip.rotation.x = PI;
    bl(g, 0.032, C.violet, 0.295, 0.055, -0.075, EM(C.violet, 1.5));
    var tipGlow = gl(g, C.violet, 0.3, 0.295, 0.055, -0.07, 0.9);
    var shine = bx(g, 0.018, 0.3, 0.018, '#e2ccff', 0.225, 0.47, 0.1, CLOTH);
    shine.rotation.z = -0.26;
    var shine2 = bx(g, 0.012, 0.22, 0.012, '#c49bff', 0.275, 0.32, 0.06, CLOTH);
    shine2.rotation.z = -0.16;
    var pin = cy(g, 0.011, 0.011, 0.1, 6, C.gold, 0.13, 0.652, 0.185, METAL);
    pin.rotation.z = 0.95;
    var tie = tr(g, 0.035, 0.01, C.gold2, 0.13, 0.652, 0.18, METAL);
    tie.rotation.z = 0.4;

    var motes = [tipGlow];
    var mn = Q(qf, 3);
    for (var i = 0; i < mn; i++) {
      motes.push(gl(g, i % 2 ? C.violet : '#e2ccff', 0.11, 0.24 + i * 0.035, 0.48 - i * 0.11, 0.11 - i * 0.03, 0.6));
    }
    an(g, { type: 'v23c-twinkle', stars: motes, baseOpacity: 0.9 });
    return g;
  }, 'mecha violeta luminosa');

  /* Moño de archivo (común): recogido, cinta, horquilla y mechones de marco. */
  V23C.register('c-peinado-mono', function () {
    var g = new THREE.Group();
    var cap = bl(g, 0.282, '#4a2a20', 0, 0.575, -0.005, CLOTH);
    cap.scale.set(1.0, 0.56, 0.96);
    bx(g, 0.46, 0.18, 0.15, '#381f18', 0, 0.44, -0.18, CLOTH);
    var bun = bl(g, 0.148, '#4a2a20', 0, 0.78, -0.14, CLOTH);
    bun.scale.set(1.0, 0.92, 0.95);
    bl(g, 0.09, '#5c372a', -0.04, 0.845, -0.15, CLOTH);
    var wrap = tr(g, 0.14, 0.022, '#381f18', 0, 0.777, -0.14, CLOTH);
    wrap.rotation.x = PI / 2;
    tr(g, 0.142, 0.009, C.teal, 0, 0.777, -0.14, METAL).rotation.x = PI / 2;
    var pin = cy(g, 0.008, 0.008, 0.32, 6, C.gold, 0, 0.79, -0.14, METAL);
    pin.rotation.z = PI / 2;
    bl(g, 0.022, C.gold2, 0.165, 0.79, -0.14, METAL);
    bl(g, 0.016, C.gold2, -0.165, 0.79, -0.14, METAL);

    [-1, 1].forEach(function (s) {
      var front = bx(g, 0.18, 0.06, 0.12, '#5c372a', s * 0.02, 0.495, 0.215, CLOTH);
      front.rotation.z = s * 0.12;
      var lock = bx(g, 0.055, 0.24, 0.11, '#4a2a20', s * 0.235, 0.44, 0.06, CLOTH);
      lock.rotation.z = s * 0.06;
      var lock2 = bx(g, 0.035, 0.16, 0.06, '#7d4c35', s * 0.255, 0.32, 0.02, CLOTH);
      lock2.rotation.z = s * 0.14;
    });
    ln(g, [V3(0, 0.52, 0.245), V3(0, 0.64, 0.12)], '#381f18', 0.5);
    var ribbon = bx(g, 0.07, 0.2, 0.014, '#7d4c35', 0.09, 0.67, -0.24, CLOTH);
    ribbon.rotation.x = 0.2; ribbon.rotation.z = 0.1;
    var ribbon2 = bx(g, 0.05, 0.14, 0.012, '#5c372a', 0.02, 0.66, -0.245, CLOTH);
    ribbon2.rotation.x = 0.22; ribbon2.rotation.z = -0.12;
    return g;
  }, 'moño de archivo');

  /* -----------------------------------------------------------------------
     TORSOS
     ----------------------------------------------------------------------- */

  /* Abrigo de guardia (raro): solapas, forro, cinturón, botones y faldones. */
  V23C.register('c-torso-abrigo', function () {
    var g = new THREE.Group();
    bx(g, 0.82, 0.94, 0.06, '#3b2828', 0, 0.28, -0.215, CLOTH);
    bx(g, 0.78, 0.34, 0.05, '#5b3b33', 0, 0.5, -0.25, CLOTH);
    bx(g, 0.34, 0.6, 0.07, '#5b3b33', -0.21, 0.38, 0.215, CLOTH);
    bx(g, 0.34, 0.6, 0.07, '#5b3b33', 0.21, 0.38, 0.215, CLOTH);
    bx(g, 0.07, 0.5, 0.03, C.blue2, 0, 0.4, 0.242, CLOTH);

    var lapL = bx(g, 0.17, 0.32, 0.035, '#3b2828', -0.17, 0.56, 0.252, CLOTH);
    lapL.rotation.z = 0.34; lapL.rotation.y = 0.1;
    var lapR = bx(g, 0.17, 0.32, 0.035, '#3b2828', 0.17, 0.56, 0.252, CLOTH);
    lapR.rotation.z = -0.34; lapR.rotation.y = -0.1;
    var edgeL = bx(g, 0.02, 0.3, 0.012, C.blue, -0.1, 0.55, 0.269, CLOTH);
    edgeL.rotation.z = 0.34;
    var edgeR = bx(g, 0.02, 0.3, 0.012, C.blue, 0.1, 0.55, 0.269, CLOTH);
    edgeR.rotation.z = -0.34;

    bx(g, 0.44, 0.1, 0.28, '#3b2828', 0, 0.705, 0.0, CLOTH);
    bx(g, 0.5, 0.04, 0.3, C.blue2, 0, 0.737, 0.0, CLOTH);
    [-1, 1].forEach(function (s) {
      bx(g, 0.22, 0.08, 0.3, '#4a302b', s * 0.33, 0.64, 0.0, CLOTH);
      bl(g, 0.018, C.gold, s * 0.33, 0.695, 0.0, METAL);
      var ep = tr(g, 0.03, 0.007, C.gold2, s * 0.33, 0.695, 0.0, METAL);
      ep.rotation.x = PI / 2;
      var pocket = bx(g, 0.2, 0.06, 0.02, '#3b2828', s * 0.26, 0.14, 0.235, CLOTH);
      pocket.rotation.z = -s * 0.06;
    });

    bx(g, 0.8, 0.09, 0.45, C.leather2, 0, 0.17, 0.0, CLOTH);
    bx(g, 0.14, 0.1, 0.03, C.gold, 0, 0.17, 0.262, METAL);
    bx(g, 0.08, 0.055, 0.018, '#3b2828', 0, 0.17, 0.279, DULL);
    [[-0.1, 0.28], [0.1, 0.28], [-0.1, 0.4], [0.1, 0.4], [-0.1, 0.52], [0.1, 0.52]].forEach(function (q) {
      var b = cy(g, 0.022, 0.022, 0.014, 8, '#c9a96a', q[0], q[1], 0.256, METAL);
      b.rotation.x = PI / 2;
    });

    [-1, 1].forEach(function (s) {
      var tail = bx(g, 0.34, 0.32, 0.16, '#4a302b', s * 0.19, -0.15, 0.02, CLOTH);
      tail.rotation.x = -0.06; tail.rotation.z = s * 0.03;
      bx(g, 0.3, 0.26, 0.05, C.blue2, s * 0.19, -0.14, 0.075, CLOTH);
      bx(g, 0.35, 0.03, 0.17, '#3b2828', s * 0.19, -0.305, 0.02, CLOTH);
      bx(g, 0.02, 0.26, 0.02, C.blue, s * 0.36, -0.14, 0.07, CLOTH);
    });

    /* Insignia emisiva de guardia. */
    bx(g, 0.09, 0.11, 0.02, C.blue, -0.2, 0.47, 0.262, EM(C.blue, 1.2));
    bx(g, 0.055, 0.055, 0.012, C.glass, -0.2, 0.47, 0.274, EM(C.glass, 1.3));
    bx(g, 0.07, 0.012, 0.012, C.gold, -0.2, 0.415, 0.269, METAL);
    var badge = gl(g, C.blue, 0.24, -0.2, 0.47, 0.26, 0.75);
    ln(g, [V3(-0.34, 0.63, 0.247), V3(-0.34, 0.18, 0.247)], '#2b1f1c', 0.4);
    ln(g, [V3(0.34, 0.63, 0.247), V3(0.34, 0.18, 0.247)], '#2b1f1c', 0.4);
    ln(g, [V3(-0.36, 0.21, -0.246), V3(0.36, 0.21, -0.246)], C.blue2, 0.35);
    an(g, { type: 'v23c-twinkle', stars: [badge], baseOpacity: 0.7 });
    g.userData.coversBack = true;
    return g;
  }, 'abrigo de guardia');

  /* Bata de evidencia (poco común): solapas, fichas, bolsillos, faldones y etiquetas. */
  V23C.register('c-torso-bata', function () {
    var g = new THREE.Group();
    bx(g, 0.74, 0.58, 0.06, C.bone, 0, 0.39, 0.205, SOFT);
    bx(g, 0.33, 0.64, 0.05, C.bone, -0.2, 0.38, 0.235, SOFT);
    bx(g, 0.33, 0.64, 0.05, C.bone, 0.2, 0.38, 0.235, SOFT);
    bx(g, 0.05, 0.46, 0.02, C.blue2, 0, 0.42, 0.246, CLOTH);

    var lL = bx(g, 0.16, 0.3, 0.03, C.bone2, -0.17, 0.57, 0.262, SOFT);
    lL.rotation.z = 0.4;
    var lR = bx(g, 0.16, 0.3, 0.03, C.bone2, 0.17, 0.57, 0.262, SOFT);
    lR.rotation.z = -0.4;
    var pL = bx(g, 0.018, 0.3, 0.012, C.blue, -0.09, 0.56, 0.278, CLOTH);
    pL.rotation.z = 0.4;
    var pR = bx(g, 0.018, 0.3, 0.012, C.blue, 0.09, 0.56, 0.278, CLOTH);
    pR.rotation.z = -0.4;

    /* Solapas de hombro: sobresalen del torso y rompen el rectángulo. */
    [-1, 1].forEach(function (s) {
      var wing = bx(g, 0.34, 0.09, 0.04, C.bone2, s * 0.33, 0.655, 0.247, SOFT);
      wing.rotation.z = -s * 0.3;
      var wingEdge = bx(g, 0.33, 0.014, 0.045, C.blue, s * 0.33, 0.64, 0.251, CLOTH);
      wingEdge.rotation.z = -s * 0.3;
      var tip = bx(g, 0.1, 0.055, 0.035, C.bone3, s * 0.48, 0.638, 0.245, SOFT);
      tip.rotation.z = -s * 0.55;
      var yoke = bx(g, 0.14, 0.03, 0.2, C.bone2, s * 0.4, 0.625, 0.0, SOFT);
      yoke.rotation.z = -s * 0.1;
    });
    bx(g, 0.44, 0.07, 0.3, C.bone2, 0, 0.712, 0.0, SOFT);
    bx(g, 0.12, 0.05, 0.03, C.bone3, -0.16, 0.7, 0.12, SOFT).rotation.z = -0.3;
    bx(g, 0.12, 0.05, 0.03, C.bone3, 0.16, 0.7, 0.12, SOFT).rotation.z = 0.3;

    /* Bolsillo de pecho con fichas de evidencia y lápiz. */
    bx(g, 0.17, 0.12, 0.018, C.bone2, -0.2, 0.48, 0.272, SOFT);
    bx(g, 0.18, 0.035, 0.026, C.bone3, -0.2, 0.536, 0.278, SOFT);
    [[-0.24, C.amber], [-0.2, C.rose], [-0.16, C.teal]].forEach(function (q) {
      var card = bx(g, 0.04, 0.085, 0.01, q[1], q[0], 0.56, 0.284, SOFT);
      card.rotation.z = (q[0] + 0.2) * 0.8;
    });
    var pen = cy(g, 0.009, 0.009, 0.16, 6, C.ink, -0.105, 0.52, 0.282, DULL);
    pen.rotation.z = 0.35;
    bl(g, 0.012, C.gold2, -0.078, 0.548, 0.283, METAL);

    /* Sello circular y bolsillo bajo derecho con etiqueta. */
    dc(g, 0.04, C.bone3, 0.2, 0.57, 0.268, SOFT);
    dc(g, 0.026, C.blue2, 0.2, 0.57, 0.272, CLOTH);
    bx(g, 0.18, 0.14, 0.018, C.bone2, 0.2, 0.29, 0.272, SOFT);
    bx(g, 0.18, 0.035, 0.026, C.bone3, 0.2, 0.356, 0.276, SOFT);
    bx(g, 0.06, 0.045, 0.012, C.paper, 0.255, 0.31, 0.286, SOFT);
    bx(g, 0.018, 0.045, 0.014, C.rose, 0.287, 0.31, 0.286, SOFT);
    bx(g, 0.018, 0.045, 0.014, C.blue, 0.267, 0.31, 0.286, SOFT);

    [[-0.075, 0.32], [-0.075, 0.43], [-0.075, 0.54]].forEach(function (q) {
      var b = cy(g, 0.019, 0.019, 0.013, 8, C.bone3, q[0], q[1], 0.264, DULL);
      b.rotation.x = PI / 2;
    });
    bx(g, 0.5, 0.045, 0.02, C.bone3, 0, 0.15, 0.264, SOFT);
    bl(g, 0.035, C.bone2, 0.27, 0.15, 0.272, SOFT);
    bx(g, 0.045, 0.18, 0.02, C.bone2, 0.29, 0.07, 0.26, SOFT).rotation.z = 0.08;

    /* Faldones en dos capas, con vuelo A. */
    [-1, 1].forEach(function (s) {
      var panel = bx(g, 0.36, 0.42, 0.06, C.bone, s * 0.23, -0.09, 0.19, SOFT);
      panel.rotation.z = s * 0.025;
      bx(g, 0.34, 0.38, 0.03, C.bone2, s * 0.23, -0.1, 0.145, SOFT);
      bx(g, 0.37, 0.03, 0.07, C.bone3, s * 0.23, -0.3, 0.19, SOFT);
      bx(g, 0.02, 0.34, 0.01, C.blue, s * 0.415, -0.1, 0.235, CLOTH);
    });
    bx(g, 0.68, 0.5, 0.04, C.bone2, 0, 0.38, -0.187, SOFT);
    bx(g, 0.04, 0.34, 0.02, C.bone3, 0, 0.36, -0.21, SOFT);

    /* Etiqueta de evidencia colgando del faldón. */
    bx(g, 0.1, 0.06, 0.014, C.bone, 0.3, 0.06, 0.26, SOFT);
    bx(g, 0.02, 0.06, 0.016, C.amber, 0.3, 0.06, 0.262, SOFT);
    bx(g, 0.045, 0.018, 0.012, C.ink, 0.3, 0.075, 0.268, SOFT);

    ln(g, [V3(-0.36, 0.64, 0.247), V3(-0.36, 0.17, 0.247)], C.bone3, 0.55);
    ln(g, [V3(0.36, 0.64, 0.247), V3(0.36, 0.17, 0.247)], C.bone3, 0.55);
    ln(g, [V3(-0.34, 0.62, 0.265), V3(-0.26, 0.45, 0.268), V3(-0.1, 0.29, 0.268)], C.bone3, 0.45);
    ln(g, [V3(-0.32, 0.67, -0.213), V3(-0.32, 0.2, -0.213)], C.bone3, 0.4);
    ln(g, [V3(0.32, 0.67, -0.213), V3(0.32, 0.2, -0.213)], C.bone3, 0.4);
    g.userData.coversBack = true;
    return g;
  }, 'bata de evidencia');

  /* Manto de constelaciones (épico): capa fluida en capas, capelina de hombros
     visible al frente, campo de estrellas, constelaciones emisivas y broche. */
  V23C.register('c-torso-manto', function (c, qf) {
    var g = new THREE.Group();
    var starGlows = [];

    /* Espalda: capa en capas y vuelo. */
    bx(g, 0.9, 0.94, 0.05, C.navy, 0, 0.27, -0.235, CLOTH);
    bx(g, 1.06, 0.12, 0.04, C.blue3, 0, -0.13, -0.252, CLOTH);
    bx(g, 1.16, 0.14, 0.04, C.night, 0, -0.235, -0.258, CLOTH);
    bx(g, 1.14, 0.012, 0.014, C.gold2, 0, -0.3, -0.28, CLOTH);
    [-1, 1].forEach(function (s) {
      var side = bx(g, 0.24, 0.78, 0.045, C.blue3, s * 0.44, 0.22, -0.21, CLOTH);
      side.rotation.z = s * 0.14; side.rotation.y = s * 0.12;
      bx(g, 0.02, 0.65, 0.02, C.gold2, s * 0.46, 0.22, -0.235, CLOTH);
    });
    for (var w = 0; w < 5; w++) {
      var hem = cn(g, 0.075, 0.16, 6, w % 2 ? C.night : C.blue3, -0.32 + w * 0.16, -0.245, -0.262, CLOTH);
      hem.rotation.x = PI;
    }
    /* Cuello bajo y alzado trasero: la cabeza queda libre y el manto gana silueta. */
    bx(g, 0.32, 0.05, 0.14, C.night, 0, 0.705, -0.12, CLOTH);
    bx(g, 0.34, 0.06, 0.05, C.night, 0, 0.715, -0.28, CLOTH);
    [-1, 1].forEach(function (s) {
      var tip = bx(g, 0.065, 0.15, 0.045, C.blue3, s * 0.15, 0.775, -0.285, CLOTH);
      tip.rotation.z = -s * 0.3;
      bl(g, 0.01, C.gold, s * 0.15, 0.84, -0.29, METAL);
    });

    /* Capelina de hombros y caída lateral al frente. */
    [-1, 1].forEach(function (s) {
      var mantle = bx(g, 0.3, 0.09, 0.34, C.blue3, s * 0.28, 0.695, 0.12, CLOTH);
      mantle.rotation.z = -s * 0.14; mantle.rotation.y = -s * 0.1;
      var mantleEdge = bx(g, 0.26, 0.05, 0.06, C.navy2, s * 0.29, 0.662, 0.272, CLOTH);
      mantleEdge.rotation.z = -s * 0.14;
      var mantleTrim = bx(g, 0.28, 0.014, 0.02, C.gold2, s * 0.28, 0.648, 0.29, METAL);
      mantleTrim.rotation.z = -s * 0.14;

      var drape = bx(g, 0.16, 0.58, 0.04, C.navy, s * 0.42, 0.33, 0.2, CLOTH);
      drape.rotation.z = s * 0.06; drape.rotation.y = s * 0.18;
      var lining = bx(g, 0.014, 0.54, 0.016, C.violet3, s * 0.335, 0.33, 0.224, CLOTH);
      lining.rotation.z = s * 0.06;
      var flow = pl(g, 0.22, 0.54, C.blue3, s * 0.45, 0.28, 0.15, { side: THREE.DoubleSide, roughness: 0.9, metalness: 0.02 });
      flow.rotation.y = s * 0.5; flow.rotation.z = s * 0.08;
      var flare = bx(g, 0.18, 0.18, 0.05, C.navy, s * 0.43, -0.1, 0.19, CLOTH);
      flare.rotation.z = s * 0.18;
      var flareHem = bx(g, 0.18, 0.012, 0.06, C.gold, s * 0.43, -0.195, 0.192, EM(C.gold, 0.6));
      flareHem.rotation.z = s * 0.18;
      var corner = bx(g, 0.1, 0.16, 0.035, C.blue3, s * 0.48, -0.02, 0.17, CLOTH);
      corner.rotation.z = s * 0.4;
      var tail = pl(g, 0.16, 0.4, C.night, s * 0.47, -0.04, 0.1, { side: THREE.DoubleSide, roughness: 0.9, metalness: 0.02 });
      tail.rotation.y = s * 0.45; tail.rotation.z = s * 0.1;
      bl(g, 0.012, C.gold, s * 0.16, 0.72, 0.292, METAL);
      ln(g, [V3(s * 0.34, 0.6, 0.225), V3(s * 0.37, 0.4, 0.225), V3(s * 0.43, 0.18, 0.225), V3(s * 0.46, -0.01, 0.22)], C.gold, 0.6);
    });

    /* Bandas en V desde los hombros al broche; dejan el pecho central abierto. */
    [-1, 1].forEach(function (s) {
      var band = bx(g, 0.075, 0.32, 0.03, C.navy, s * 0.12, 0.62, 0.225, CLOTH);
      band.rotation.z = -s * 0.55;
      var bandLine = bx(g, 0.014, 0.31, 0.034, C.violet3, s * 0.104, 0.62, 0.228, CLOTH);
      bandLine.rotation.z = -s * 0.55;
      bl(g, 0.011, C.gold, s * 0.205, 0.748, 0.25, METAL);
      bl(g, 0.009, C.glass, s * 0.155, 0.67, 0.242, EM(C.glass, 1.2));
      bl(g, 0.008, C.gold, s * 0.09, 0.55, 0.242, EM(C.gold, 1.1));
    });

    /* Broche del guardián, protagonista frontal. */
    var brooch = tr(g, 0.075, 0.014, C.gold, 0, 0.58, 0.262, METAL);
    var broochGem = bl(g, 0.042, C.violet, 0, 0.58, 0.27, EM(C.violet, 1.5));
    bx(g, 0.014, 0.12, 0.014, C.glass, 0, 0.58, 0.281, EM(C.glass, 1.5)).rotation.z = 0.5;
    bx(g, 0.014, 0.12, 0.014, C.glass, 0, 0.58, 0.281, EM(C.glass, 1.5)).rotation.z = -0.5;
    bl(g, 0.013, C.gold, -0.09, 0.64, 0.255, METAL);
    bl(g, 0.013, C.gold, 0.09, 0.64, 0.255, METAL);
    ln(g, [V3(-0.09, 0.64, 0.257), V3(-0.04, 0.605, 0.267), V3(0, 0.58, 0.27), V3(0.04, 0.605, 0.267), V3(0.09, 0.64, 0.257)], C.gold, 0.65);
    starGlows.push(gl(g, C.violet, 0.34, 0, 0.58, 0.29, 0.8));

    /* Campo de estrellas frontal: hombros y caída lateral (menos en calidad baja). */
    var frontStarPts = [[0.2, 0.715], [0.3, 0.692], [0.35, 0.56], [0.39, 0.43], [0.43, 0.27]];
    var frontStarN = qf >= 1.1 ? 5 : (qf >= 0.55 ? 4 : 3);
    [-1, 1].forEach(function (s) {
      for (var fi = 0; fi < frontStarN; fi++) {
        var q = frontStarPts[fi];
        var col = fi % 3 === 0 ? C.gold : (fi % 3 === 1 ? C.glass : C.teal);
        var z = q[1] > 0.66 ? 0.302 : 0.234;
        starGlows.push(gl(g, col, 0.09 + (fi % 2) * 0.04, s * q[0], q[1], z, 0.9));
        if (fi % 2 === 0) bl(g, 0.011, col, s * q[0], q[1], z + 0.002, EM(col, 1.2));
      }
    });

    /* Constelaciones frontales: una estática por lado y una animada a la derecha. */
    ln(g, [V3(-0.46, 0.47, 0.232), V3(-0.41, 0.39, 0.232), V3(-0.36, 0.43, 0.232), V3(-0.34, 0.31, 0.232)], C.teal, 0.8);
    ln(g, [V3(-0.41, 0.39, 0.232), V3(-0.39, 0.27, 0.232)], C.gold, 0.65);
    starGlows.push(gl(g, C.teal, 0.12, -0.46, 0.47, 0.234, 0.8));
    starGlows.push(gl(g, C.gold, 0.1, -0.39, 0.27, 0.234, 0.8));
    bl(g, 0.012, C.glass, -0.41, 0.39, 0.234, EM(C.glass, 1.2));
    bl(g, 0.011, C.gold, -0.36, 0.43, 0.234, EM(C.gold, 1.2));

    var frontConstel = new THREE.Group();
    frontConstel.position.set(0.405, 0.4, 0.234);
    g.add(frontConstel);
    var fp = [V3(-0.06, 0.1, 0), V3(-0.02, 0.02, 0), V3(0.04, 0.06, 0), V3(0.05, -0.06, 0)];
    ln(frontConstel, [fp[0], fp[1], fp[2]], C.gold, 0.85);
    ln(frontConstel, [fp[1], fp[3]], C.teal, 0.7);
    for (var j = 0; j < fp.length; j++) {
      bl(frontConstel, 0.012, j % 2 ? C.gold : C.glass, fp[j].x, fp[j].y, 0, EM(j % 2 ? C.gold : C.glass, 1.3));
      if (j % 2 === 0) starGlows.push(gl(frontConstel, C.gold, 0.11, fp[j].x, fp[j].y, 0.004, 0.8));
    }

    /* Campo de estrellas de la espalda. */
    var sn = Q(qf, 12);
    for (var bi = 0; bi < sn; bi++) {
      var sbx = (H(bi * 5 + 1) - 0.5) * 0.78;
      var sby = 0.02 + H(bi * 7 + 3) * 0.72;
      var sbz = -0.264 - H(bi * 11 + 2) * 0.018;
      var bcol = bi % 4 === 0 ? C.gold : (bi % 4 === 1 ? C.glass : (bi % 4 === 2 ? C.teal : C.violet));
      starGlows.push(gl(g, bcol, 0.09 + H(bi) * 0.06, sbx, sby, sbz, 0.85));
      if (bi % 3 === 0) bl(g, 0.013, bcol, sbx, sby, sbz - 0.004, EM(bcol, 1.2));
    }
    var constel = new THREE.Group();
    constel.position.set(0, 0.36, -0.276);
    g.add(constel);
    var pts = [V3(-0.19, 0.12, 0), V3(-0.08, 0.2, 0), V3(0.03, 0.1, 0), V3(0.14, 0.18, 0), V3(0.21, -0.02, 0)];
    ln(constel, pts, C.violet, 0.75);
    ln(constel, [V3(-0.08, 0.2, 0), V3(-0.02, -0.08, 0)], C.gold, 0.6);
    ln(constel, [V3(0.14, 0.18, 0), V3(0.08, -0.12, 0)], C.teal, 0.6);
    for (var j2 = 0; j2 < pts.length; j2++) {
      bl(constel, 0.017, j2 % 2 ? C.gold : C.glass, pts[j2].x, pts[j2].y, 0, EM(j2 % 2 ? C.gold : C.glass, 1.3));
      if (j2 % 2 === 0) gl(constel, C.gold, 0.13, pts[j2].x, pts[j2].y, 0.006, 0.8);
    }
    gl(g, C.violet, 1.1, 0, 0.42, -0.3, 0.12);
    an(g, { type: 'v23c-rays', rays: constel, disc: broochGem, speed: 0.12 });
    an(g, { type: 'v23c-rays', rays: frontConstel, speed: 0.16 });
    an(g, { type: 'v23c-twinkle', stars: starGlows, baseOpacity: 0.85 });
    g.userData.coversBack = true;
    return g;
  }, 'manto de constelaciones');

  /* Chaleco de misiones (común): bolsillos, cinta reflectante y costuras. */
  V23C.register('c-torso-chaleco', function () {
    var g = new THREE.Group();
    bx(g, 0.28, 0.52, 0.06, C.olive, -0.19, 0.38, 0.21, CLOTH);
    bx(g, 0.28, 0.52, 0.06, C.olive, 0.19, 0.38, 0.21, CLOTH);
    bx(g, 0.14, 0.26, 0.02, C.ink, 0, 0.53, 0.225, CLOTH);
    bx(g, 0.66, 0.56, 0.05, C.olive2, 0, 0.38, -0.21, CLOTH);
    [-1, 1].forEach(function (s) {
      bx(g, 0.15, 0.09, 0.32, C.olive2, s * 0.26, 0.655, 0.0, CLOTH);
      bx(g, 0.15, 0.16, 0.02, C.olive2, s * 0.2, 0.5, 0.247, CLOTH);
      bx(g, 0.16, 0.035, 0.026, C.olive2, s * 0.2, 0.585, 0.25, CLOTH);
      bx(g, 0.17, 0.13, 0.02, C.olive2, s * 0.2, 0.29, 0.245, CLOTH);
      bx(g, 0.18, 0.035, 0.026, C.olive2, s * 0.2, 0.358, 0.25, CLOTH);
      bl(g, 0.011, C.wood, s * 0.2, 0.36, 0.266, METAL);
      bx(g, 0.02, 0.18, 0.012, C.olive2, s * 0.28, 0.42, 0.24, CLOTH);
      bx(g, 0.08, 0.03, 0.012, C.wood, s * 0.25, 0.16, 0.247, CLOTH);
    });
    /* Cuello alto, tensores laterales y bolsa de ruta. */
    bx(g, 0.3, 0.06, 0.1, C.olive2, 0, 0.71, 0.05, CLOTH);
    [-1, 1].forEach(function (s) {
      bx(g, 0.09, 0.05, 0.14, C.olive2, s * 0.37, 0.2, 0.0, CLOTH);
      bx(g, 0.05, 0.045, 0.04, C.steel3, s * 0.405, 0.2, 0.07, METAL);
      bx(g, 0.025, 0.035, 0.06, C.gold2, s * 0.42, 0.2, 0.06, METAL);
    });
    bx(g, 0.11, 0.16, 0.1, C.wood, 0.33, 0.1, 0.2, CLOTH);
    bx(g, 0.12, 0.04, 0.11, '#6b4d31', 0.33, 0.165, 0.205, CLOTH);
    bl(g, 0.012, C.gold2, 0.33, 0.17, 0.257, METAL);
    /* Cinta reflectante delantera y trasera. */
    bx(g, 0.64, 0.05, 0.02, '#e8eef0', 0, 0.45, 0.247, DULL);
    bx(g, 0.64, 0.01, 0.022, C.teal, 0, 0.473, 0.25, CLOTH);
    bx(g, 0.64, 0.01, 0.022, C.teal, 0, 0.427, 0.25, CLOTH);
    bx(g, 0.64, 0.05, 0.02, '#e8eef0', 0, 0.45, -0.232, DULL);
    bx(g, 0.64, 0.01, 0.022, C.teal, 0, 0.473, -0.235, CLOTH);

    bx(g, 0.014, 0.46, 0.016, C.ink, 0, 0.39, 0.253, CLOTH);
    bx(g, 0.032, 0.05, 0.02, C.steel3, 0, 0.6, 0.258, METAL);
    bx(g, 0.05, 0.02, 0.03, C.gold2, 0, 0.588, 0.26, METAL);
    dc(g, 0.043, C.teal, -0.26, 0.55, 0.25, CLOTH);
    ln(g, [V3(-0.29, 0.55, 0.254), V3(-0.255, 0.575, 0.254), V3(-0.22, 0.54, 0.254)], C.ink, 0.7);
    tr(g, 0.025, 0.008, C.steel3, 0.3, 0.09, 0.24, METAL).rotation.x = PI / 2;
    ln(g, [V3(-0.34, 0.64, 0.245), V3(-0.34, 0.16, 0.245)], C.olive2, 0.6);
    ln(g, [V3(0.34, 0.64, 0.245), V3(0.34, 0.16, 0.245)], C.olive2, 0.6);
    ln(g, [V3(-0.3, 0.64, -0.238), V3(-0.3, 0.18, -0.238)], C.olive2, 0.4);
    ln(g, [V3(0.3, 0.64, -0.238), V3(0.3, 0.18, -0.238)], C.olive2, 0.4);
    return g;
  }, 'chaleco de misiones');

  /* Poncho de viaje (raro): guardas geométricas, flecos, borde y textura. */
  V23C.register('c-torso-poncho', function (c, qf) {
    var g = new THREE.Group();
    bx(g, 0.62, 0.26, 0.05, '#477066', 0, 0.56, 0.215, CLOTH);
    bx(g, 0.82, 0.2, 0.05, '#4f786d', 0, 0.37, 0.23, CLOTH);
    bx(g, 1.0, 0.24, 0.05, '#3f6059', 0, 0.17, 0.245, CLOTH);
    bx(g, 0.66, 0.26, 0.05, '#3f6059', 0, 0.56, -0.2, CLOTH);
    bx(g, 0.86, 0.2, 0.05, '#477066', 0, 0.37, -0.21, CLOTH);
    bx(g, 1.02, 0.24, 0.05, '#35534d', 0, 0.17, -0.22, CLOTH);
    [-1, 1].forEach(function (s) {
      var side = bx(g, 0.12, 0.6, 0.45, '#6b593d', s * 0.48, 0.35, 0.0, CLOTH);
      side.rotation.z = s * 0.06;
      bx(g, 0.3, 0.08, 0.46, '#5b4d34', s * 0.26, 0.665, 0.0, CLOTH);
      var point = cn(g, 0.07, 0.18, 6, '#6b593d', s * 0.47, 0.03, 0.0, CLOTH);
      point.rotation.x = PI;
    });
    var neck = tr(g, 0.17, 0.03, '#6b593d', 0, 0.7, 0.0, CLOTH);
    neck.rotation.x = PI / 2;
    bx(g, 1.02, 0.05, 0.07, '#3a4f49', 0, 0.06, 0.245, CLOTH);
    bx(g, 1.02, 0.05, 0.07, '#3a4f49', 0, 0.06, -0.22, CLOTH);

    /* Guardas: bandas escalonadas de motivos geométricos. */
    var guards = [
      { y: 0.62, z: 0.242, n: 5, w: 0.1, gap: 0.14 },
      { y: 0.43, z: 0.257, n: 6, w: 0.11, gap: 0.155 },
      { y: 0.24, z: 0.272, n: 7, w: 0.12, gap: 0.16 }
    ];
    var emitters = [];
    guards.forEach(function (band, bi) {
      for (var i = 0; i < band.n; i++) {
        var x = (i - (band.n - 1) / 2) * band.gap;
        var col = i % 3 === 0 ? C.gold : (i % 3 === 1 ? C.teal : C.bone);
        bx(g, band.w, 0.045, 0.014, col, x, band.y, band.z, i === 2 ? EM(col, 0.7) : CLOTH);
        bx(g, band.w * 0.5, 0.045, 0.016, col, x, band.y + 0.055, band.z, i === 2 ? EM(col, 0.7) : CLOTH).rotation.z = PI / 4;
        if (bi === 1 && i % 2 === 0) {
          var e = gl(g, C.teal, 0.12, x, band.y, band.z + 0.012, 0.7);
          emitters.push(e);
        }
      }
    });
    bx(g, 0.72, 0.01, 0.016, C.gold, 0, 0.62, 0.252, CLOTH);
    bx(g, 0.94, 0.01, 0.016, C.gold, 0, 0.43, 0.267, CLOTH);
    bx(g, 1.0, 0.01, 0.016, C.gold, 0, 0.24, 0.282, CLOTH);

    /* Textura de tejido y bordes. */
    for (var t = 0; t < 8; t++) {
      var tx = -0.38 + t * 0.11;
      bx(g, 0.05, 0.012, 0.012, t % 2 ? '#4f786d' : '#35534d', tx, 0.12, 0.274, CLOTH);
      bx(g, 0.05, 0.012, 0.012, t % 2 ? '#3f6059' : '#477066', tx, 0.12, -0.249, CLOTH);
    }
    ln(g, [V3(-0.46, 0.095, 0.276), V3(0.46, 0.095, 0.276)], '#2c443f', 0.65);
    ln(g, [V3(-0.48, 0.095, -0.25), V3(0.48, 0.095, -0.25)], '#2c443f', 0.65);

    /* Flecos del borde, delantero y trasero. */
    var fn = Math.max(8, Math.round(12 * (qf == null ? 0.72 : qf)));
    for (var f = 0; f < fn; f++) {
      var fx = -0.46 + f * (0.92 / (fn - 1));
      var fc = f % 3 === 0 ? C.teal : (f % 3 === 1 ? C.gold : C.bone);
      cy(g, 0.011, 0.013, 0.1, 5, fc, fx, 0.005, 0.252, CLOTH);
      bl(g, 0.014, '#6b593d', fx, 0.055, 0.252, CLOTH);
      cy(g, 0.01, 0.012, 0.08, 5, fc, fx, 0.005, -0.225, CLOTH);
    }

    /* Medallón central emisivo. */
    dc(g, 0.055, '#2c443f', 0, 0.55, 0.246, CLOTH);
    dc(g, 0.043, C.teal, 0, 0.55, 0.251, EM(C.teal, 0.9));
    tr(g, 0.056, 0.008, C.gold, 0, 0.55, 0.253, METAL);
    gl(g, C.teal, 1.2, 0, 0.4, 0.26, 0.12);
    an(g, { type: 'v23c-twinkle', stars: emitters, baseOpacity: 0.8 });
    g.userData.coversBack = true;
    return g;
  }, 'poncho de viaje');

  /* Capa del Errorario (épico): capa amplia, capucha, runas y marcas de error. */
  V23C.register('x-capa-errorario', function (c, qf) {
    var g = new THREE.Group();
    bx(g, 0.94, 0.9, 0.06, '#1a2233', 0, 0.25, -0.235, CLOTH);
    bx(g, 1.02, 0.2, 0.05, '#141b2a', 0, -0.16, -0.232, CLOTH);
    [-1, 1].forEach(function (s) {
      var side = bx(g, 0.22, 0.8, 0.05, '#202a3e', s * 0.45, 0.2, -0.2, CLOTH);
      side.rotation.z = s * 0.1;
      bx(g, 0.06, 0.55, 0.02, C.rose2, s * 0.39, 0.25, -0.27, CLOTH);
      bx(g, 0.2, 0.08, 0.42, '#252f45', s * 0.33, 0.67, 0.0, CLOTH);
    });
    for (var w = 0; w < 6; w++) {
      var hem = cn(g, 0.07, 0.16, 6, w % 2 ? '#141b2a' : '#252f45', -0.4 + w * 0.16, -0.235, -0.225, CLOTH);
      hem.rotation.x = PI;
    }
    bx(g, 1.0, 0.035, 0.03, C.violet3, 0, -0.305, -0.24, CLOTH);

    /* Cuello/capelina sobre los hombros, por debajo del cráneo. */
    var cowl = tr(g, 0.34, 0.055, '#252f45', 0, 0.68, -0.02, CLOTH);
    cowl.rotation.x = PI / 2; cowl.scale.y = 0.78;
    var cowl2 = tr(g, 0.37, 0.045, '#202a3e', 0, 0.648, -0.03, CLOTH);
    cowl2.rotation.x = PI / 2; cowl2.scale.y = 0.8;
    bx(g, 0.44, 0.07, 0.08, '#252f45', 0, 0.68, -0.27, CLOTH);
    [-1, 1].forEach(function (s) {
      var fold = bx(g, 0.16, 0.1, 0.2, '#202a3e', s * 0.26, 0.67, -0.14, CLOTH);
      fold.rotation.z = s * 0.15; fold.rotation.y = -s * 0.2;
      bl(g, 0.012, C.gold2, s * 0.3, 0.7, -0.18, METAL);
    });

    /* Capucha alta detrás del cráneo: paneles altos con z ≤ −0,35 y tope y≈0,97. */
    bx(g, 0.54, 0.16, 0.14, '#252f45', 0, 0.645, -0.3, CLOTH);
    bx(g, 0.4, 0.1, 0.1, '#202a3e', 0, 0.775, -0.41, CLOTH);
    bx(g, 0.46, 0.28, 0.07, '#202a3e', 0, 0.82, -0.4, CLOTH);
    bx(g, 0.36, 0.1, 0.06, '#252f45', 0, 0.94, -0.4, CLOTH);
    [-1, 1].forEach(function (s) {
      var wing = bx(g, 0.13, 0.26, 0.12, '#202a3e', s * 0.27, 0.79, -0.42, CLOTH);
      wing.rotation.z = s * 0.14; wing.rotation.y = -s * 0.12;
      var edge = bx(g, 0.04, 0.24, 0.02, C.violet3, s * 0.21, 0.8, -0.365, CLOTH);
      edge.rotation.z = s * 0.14;
    });
    var peak = cn(g, 0.09, 0.2, 6, '#202a3e', 0, 0.9, -0.46, CLOTH);
    peak.rotation.x = 0.3;
    bx(g, 0.3, 0.05, 0.04, C.gold, 0, 0.86, -0.445, METAL);
    bl(g, 0.026, C.violet, 0, 0.86, -0.452, EM(C.violet, 1.2));
    ln(g, [V3(-0.23, 0.9, -0.442), V3(0, 0.97, -0.45), V3(0.23, 0.9, -0.442)], C.violet, 0.45);

    /* Cierres delanteros y cadena. */
    [-1, 1].forEach(function (s) {
      dc(g, 0.038, C.gold, s * 0.19, 0.62, 0.238, METAL);
      dc(g, 0.024, '#2a2038', s * 0.19, 0.62, 0.242, DULL);
      bl(g, 0.016, C.violet, s * 0.19, 0.62, 0.248, EM(C.violet, 1.1));
    });
    ln(g, [V3(-0.19, 0.62, 0.25), V3(0, 0.56, 0.26), V3(0.19, 0.62, 0.25)], C.gold, 0.55);

    /* Runa circular con nodos. */
    var runePts = [];
    for (var i = 0; i <= 24; i++) {
      var a = i / 24 * TAU;
      runePts.push(V3(Math.cos(a) * 0.19, 0.34 + Math.sin(a) * 0.19, -0.301));
    }
    ln(g, runePts, C.rose, 0.85);
    var inner = [];
    for (var i2 = 0; i2 <= 18; i2++) {
      var a2 = i2 / 18 * TAU;
      inner.push(V3(Math.cos(a2) * 0.12, 0.34 + Math.sin(a2) * 0.12, -0.304));
    }
    ln(g, inner, C.violet, 0.7);
    ln(g, [V3(0, 0.47, -0.303), V3(-0.08, 0.28, -0.303), V3(0.06, 0.25, -0.303), V3(0.11, 0.4, -0.303)], C.rose, 0.9);
    ln(g, [V3(-0.12, 0.34, -0.303), V3(-0.04, 0.4, -0.303), V3(0.02, 0.33, -0.303)], C.teal, 0.8);
    var runeNodes = [];
    [[-0.19, 0.34], [0.19, 0.34], [0, 0.53], [0, 0.15]].forEach(function (q, i3) {
      var col = i3 % 2 ? C.teal : C.rose;
      bl(g, 0.02, col, q[0], q[1], -0.306, EM(col, 1.4));
      runeNodes.push(gl(g, col, 0.17, q[0], q[1], -0.31, 0.85));
    });

    /* Marcas de error: barras y fragmentos. */
    var err = [[-0.27, 0.51], [0.27, 0.2], [-0.2, 0.18]];
    err.forEach(function (q, i4) {
      var b1 = bx(g, 0.1, 0.018, 0.016, i4 === 1 ? C.teal : C.rose, q[0], q[1], -0.31, CLOTH);
      b1.rotation.z = 0.3 + i4 * 0.2;
      var b2 = bx(g, 0.08, 0.016, 0.016, i4 === 1 ? C.violet : C.teal, q[0] + 0.02, q[1] - 0.04, -0.312, CLOTH);
      b2.rotation.z = -0.28;
      if (i4 === 0) {
        bx(g, 0.05, 0.05, 0.012, C.rose, q[0] + 0.12, q[1] + 0.03, -0.315, CLOTH);
        bx(g, 0.03, 0.02, 0.012, C.violet, q[0] + 0.15, q[1] - 0.03, -0.315, CLOTH);
      }
    });

    /* Partículas propias que se disuelven. */
    var parts = [];
    var pn = Q(qf, 6);
    for (var p = 0; p < pn; p++) {
      var px = (H(p * 3 + 2) - 0.5) * 0.7;
      var py = -0.2 + H(p * 7 + 4) * 0.9;
      var pz = -0.3 - H(p * 11 + 1) * 0.03;
      var sp = gl(g, p % 2 ? C.teal : C.rose, 0.12, px, py, pz, 0.7);
      sp.userData.baseX = px; sp.userData.baseY = py;
      parts.push(sp);
    }
    gl(g, C.rose, 1.3, 0, 0.34, -0.33, 0.12);
    an(g, { type: 'v23c-twinkle', stars: runeNodes, baseOpacity: 0.85 });
    an(g, { type: 'v23c-dissolve', parts: parts, rise: 0.55, opacity: 0.6 });
    g.userData.coversBack = true;
    return g;
  }, 'capa del Errorario');

  /* -----------------------------------------------------------------------
     PIERNAS
     ----------------------------------------------------------------------- */

  /* Perneras de ruta (común): correas cruzadas, placa y remaches. */
  V23C.register('c-piernas-ruta', function (c, qf, avatar) {
    return bothLegs(avatar, function (s) {
      var g = new THREE.Group();
      cy(g, 0.13, 0.155, 0.34, 10, C.wood, 0, 0.34, 0.02, CLOTH);
      var top = tr(g, 0.14, 0.022, C.leather, 0, 0.51, 0.02, CLOTH);
      top.rotation.x = PI / 2;
      var low = tr(g, 0.15, 0.02, C.leather2, 0, 0.18, 0.02, CLOTH);
      low.rotation.x = PI / 2;
      var s1 = bx(g, 0.28, 0.05, 0.02, C.leather2, 0, 0.34, 0.17, CLOTH);
      s1.rotation.z = 0.62;
      var s2 = bx(g, 0.28, 0.05, 0.02, C.leather2, 0, 0.4, 0.174, CLOTH);
      s2.rotation.z = -0.62;
      tr(g, 0.033, 0.009, C.gold, 0.02, 0.37, 0.186, METAL);
      bx(g, 0.034, 0.009, 0.014, C.gold2, 0.02, 0.37, 0.193, METAL);
      bx(g, 0.12, 0.18, 0.02, C.blue3, 0, 0.33, 0.174, DULL);
      bx(g, 0.025, 0.18, 0.022, C.gold2, -0.06, 0.33, 0.177, METAL);
      bx(g, 0.025, 0.18, 0.022, C.gold2, 0.06, 0.33, 0.177, METAL);
      dc(g, 0.036, C.navy, 0, 0.34, 0.184, DULL);
      ln(g, [V3(-0.025, 0.31, 0.187), V3(0.01, 0.35, 0.187), V3(0.026, 0.32, 0.187)], C.teal, 0.9);
      bx(g, 0.055, 0.2, 0.18, C.blue3, s * 0.145, 0.34, 0.01, DULL);
      [[-0.03, 0.4], [0.03, 0.4], [-0.03, 0.27], [0.03, 0.27]].forEach(function (q) {
        bl(g, 0.013, C.gold2, q[0], q[1], 0.184, METAL);
      });
      bl(g, 0.013, C.gold2, s * 0.145, 0.44, 0.08, METAL);
      bl(g, 0.013, C.gold2, s * 0.145, 0.24, 0.08, METAL);
      var knee = tr(g, 0.115, 0.02, C.leather, 0, 0.545, 0.02, CLOTH);
      knee.rotation.x = PI / 2;
      var ankle = tr(g, 0.128, 0.022, C.leather2, 0, 0.11, 0.03, CLOTH);
      ankle.rotation.x = PI / 2;
      return g;
    });
  }, 'perneras de ruta');

  /* Falda de mapas (poco común): paneles plegados, rollos, rutas y costuras. */
  V23C.register('c-piernas-falda', function (c, qf, avatar) {
    return bothLegs(avatar, function (s) {
      var g = new THREE.Group();
      var inw = -s;
      /* Cinturón por mitades, con desfase mínimo para no coplanar en el centro. */
      bx(g, 0.5, 0.06, 0.03, C.leather, inw * 0.08, 0.79, 0.2 + s * 0.003, CLOTH);
      bx(g, 0.5, 0.06, 0.03, C.leather, inw * 0.08, 0.79, -0.19 + s * 0.003, CLOTH);
      bx(g, 0.04, 0.06, 0.35, C.leather, s * 0.22, 0.79, 0.0, CLOTH);
      bx(g, 0.07, 0.03, 0.04, C.gold2, inw * 0.08, 0.79, 0.22, METAL);

      var under = pl(g, 0.54, 0.5, C.paper2, inw * 0.1, 0.55, 0.17, { side: THREE.DoubleSide, roughness: 0.9, metalness: 0.02 });
      under.rotation.y = s * 0.08;
      under.rotation.x = 0.06;
      under.rotation.z = -s * 0.08;
      var front = pl(g, 0.36, 0.46, C.paper, inw * 0.03, 0.58, 0.196, { side: THREE.DoubleSide, roughness: 0.9, metalness: 0.02 });
      front.rotation.y = s * 0.14;
      front.rotation.x = 0.07;
      front.rotation.z = -s * 0.13;
      var side = pl(g, 0.42, 0.5, C.paper2, s * 0.27, 0.56, 0.0, { side: THREE.DoubleSide, roughness: 0.9, metalness: 0.02 });
      side.rotation.y = s * PI / 2;
      var back = pl(g, 0.5, 0.46, C.paper2, inw * 0.08, 0.55, -0.175, { side: THREE.DoubleSide, roughness: 0.9, metalness: 0.02 });
      back.rotation.y = -s * 0.1;
      back.rotation.x = -0.04;
      back.rotation.z = -s * 0.1;
      var flap = pl(g, 0.14, 0.24, C.paper3, inw * 0.02, 0.64, 0.205, { side: THREE.DoubleSide, roughness: 0.92, metalness: 0.02 });
      flap.rotation.z = s * 0.3;

      /* Vuelo lateral de mapas: dos pliegues que se abren hacia el bajo. */
      var flyA = pl(g, 0.26, 0.3, C.paper3, s * 0.2, 0.41, 0.15, { side: THREE.DoubleSide, roughness: 0.92, metalness: 0.02 });
      flyA.rotation.y = s * 0.5;
      flyA.rotation.z = -s * 0.4;
      var flyB = pl(g, 0.2, 0.24, C.paper2, s * 0.27, 0.37, 0.13, { side: THREE.DoubleSide, roughness: 0.92, metalness: 0.02 });
      flyB.rotation.y = s * 0.62;
      flyB.rotation.z = -s * 0.55;
      ln(g, [V3(s * 0.32, 0.54, 0.16), V3(s * 0.42, 0.42, 0.155), V3(s * 0.5, 0.3, 0.15)], C.gold, 0.75);
      ln(g, [V3(s * 0.3, 0.5, 0.145), V3(s * 0.4, 0.38, 0.14)], C.rose, 0.55);

      /* Costuras y pliegues. */
      bx(g, 0.02, 0.46, 0.02, C.fold, inw * 0.2, 0.55, 0.172, CLOTH).rotation.y = s * 0.08;
      bx(g, 0.36, 0.012, 0.012, C.paper3, inw * 0.03, 0.36, 0.201, CLOTH).rotation.y = s * 0.14;
      ln(g, [V3(inw * 0.14, 0.78, 0.202), V3(inw * 0.19, 0.55, 0.205), V3(inw * 0.17, 0.35, 0.207)], C.fold, 0.55);

      /* Rutas doradas emisivas y rosa de los vientos. */
      ln(g, [V3(inw * 0.14, 0.72, 0.205), V3(inw * 0.05, 0.62, 0.207), V3(inw * 0.1, 0.5, 0.209), V3(inw * 0.02, 0.4, 0.211)], C.gold, 0.95);
      ln(g, [V3(inw * 0.22, 0.68, 0.204), V3(inw * 0.18, 0.56, 0.206), V3(inw * 0.24, 0.46, 0.208), V3(inw * 0.16, 0.38, 0.21)], C.rose, 0.65);
      dc(g, 0.05, C.paper3, inw * 0.02, 0.62, 0.212, PAPER);
      dc(g, 0.037, C.gold2, inw * 0.02, 0.62, 0.213, EM(C.gold2, 0.6));
      ln(g, [V3(inw * 0.02, 0.665, 0.215), V3(inw * 0.02, 0.575, 0.215)], C.fold, 0.8);
      ln(g, [V3(inw * 0.065, 0.62, 0.215), V3(inw * -0.025, 0.62, 0.215)], C.fold, 0.8);
      bl(g, 0.012, C.teal, inw * 0.07, 0.53, 0.213, DULL);
      bl(g, 0.01, C.rose, inw * 0.16, 0.44, 0.213, DULL);

      /* Borde dorado emisivo del vuelo. */
      bx(g, 0.34, 0.014, 0.018, C.gold, inw * 0.03, 0.35, 0.202, EM(C.gold, 0.8));
      bx(g, 0.04, 0.12, 0.014, C.gold2, inw * 0.2, 0.41, 0.2, CLOTH);

      /* Rollos de papel colgando del cinturón. */
      [[s * 0.39, 0.52, 0.2, 0.36], [s * 0.14, 0.52, 0.205, 0.22]].forEach(function (q, i) {
        var roll = cy(g, 0.032, 0.032, q[3], 8, C.paper3, q[0], q[1], q[2], PAPER);
        roll.rotation.z = s * (i ? -0.16 : 0.18);
        var cap1 = dc(g, 0.032, C.fold, q[0], q[1] + q[3] / 2, q[2], PAPER);
        cap1.rotation.x = -PI / 2;
        var cord = tr(g, 0.035, 0.007, C.ink, q[0], q[1], q[2], CLOTH);
        cord.rotation.x = PI / 2;
        if (i === 0) {
          var strap = bx(g, 0.03, 0.2, 0.026, C.leather, s * 0.34, 0.735, 0.195, CLOTH);
          strap.rotation.z = s * 0.55;
          bx(g, 0.055, 0.045, 0.03, C.gold2, s * 0.33, 0.7, 0.205, METAL);
        }
      });
      /* Etiqueta de mapa cosida. */
      bx(g, 0.11, 0.055, 0.012, C.paper, inw * 0.18, 0.3, 0.195, PAPER);
      bx(g, 0.02, 0.055, 0.014, C.teal, inw * 0.18, 0.3, 0.198, CLOTH);
      return g;
    });
  }, 'falda de mapas');

  /* Grebas de método (raro): placas, rodilleras, biseles, correas y runas. */
  V23C.register('c-piernas-grebas', function (c, qf, avatar) {
    return bothLegs(avatar, function (s) {
      var g = new THREE.Group();
      cy(g, 0.145, 0.125, 0.3, 10, C.steel3, 0, 0.33, 0.01, METAL);
      bx(g, 0.2, 0.26, 0.05, C.steel, 0, 0.33, 0.125, METAL);
      bx(g, 0.022, 0.25, 0.054, C.steel2, -0.1, 0.33, 0.126, METAL);
      bx(g, 0.022, 0.25, 0.054, C.steel2, 0.1, 0.33, 0.126, METAL);
      bx(g, 0.18, 0.018, 0.056, C.steel2, 0, 0.455, 0.127, METAL);
      bx(g, 0.18, 0.018, 0.056, C.steel2, 0, 0.205, 0.127, METAL);
      var knee = bl(g, 0.135, C.steel2, 0, 0.51, 0.09, METAL);
      knee.scale.set(1.0, 0.7, 0.8);
      var kneeRim = tr(g, 0.105, 0.016, C.gold2, 0, 0.51, 0.155, METAL);
      bl(g, 0.035, C.blue3, 0, 0.51, 0.175, EM(C.blue, 0.8));
      [[-0.08, 0.44], [0.08, 0.44], [-0.08, 0.22], [0.08, 0.22], [0, 0.39], [0, 0.27]].forEach(function (q) {
        bl(g, 0.014, C.gold2, q[0], q[1], 0.153, METAL);
      });
      [-1, 1].forEach(function (hs) {
        var hinge = cy(g, 0.026, 0.026, 0.05, 8, C.steel3, hs * 0.155, 0.33, 0.02, METAL);
        hinge.rotation.x = PI / 2;
      });
      [[0.43, 0.14], [0.24, 0.14]].forEach(function (q, i) {
        var strap = tr(g, 0.14, 0.022, C.leather, 0, q[0], q[1], CLOTH);
        strap.rotation.x = PI / 2;
        bx(g, 0.05, 0.045, 0.02, C.gold2, 0.06, q[0], q[1] + 0.01, METAL);
        bx(g, 0.032, 0.026, 0.024, C.steel3, 0.06, q[0], q[1] + 0.014, METAL);
      });
      /* Runa luminosa sobre la placa. */
      ln(g, [V3(-0.05, 0.42, 0.154), V3(-0.02, 0.35, 0.154), V3(0.04, 0.37, 0.154), V3(0.05, 0.27, 0.154), V3(-0.04, 0.28, 0.154)], C.teal, 0.95);
      ln(g, [V3(-0.05, 0.35, 0.155), V3(0.05, 0.35, 0.155)], C.blue, 0.75);
      var runeGlows = [
        gl(g, C.teal, 0.18, 0.05, 0.27, 0.158, 0.85),
        gl(g, C.blue, 0.14, -0.05, 0.42, 0.158, 0.7)
      ];
      an(g, { type: 'v23c-twinkle', stars: runeGlows, baseOpacity: 0.85 });
      return g;
    });
  }, 'grebas de método');

})();
