/* =========================================================================
   V2.3 · FASE 2 · AGENTE 3 · EFECTOS DE MOVIMIENTO
   -------------------------------------------------------------------------
   Chispas de racha y Estela de racha (ancladas a avatar.root, a ras de suelo)
   y los cinco efectos de arma (anclados a avatar.weapon):
   Destello del Territorio, Marea del Cuidado, Sello de la Confianza,
   Prisma de la Evidencia y Órbita del Sistema.

   Registro V23C (cada pieza reemplaza el constructor histórico de part3c).
   Todo es procedural: cilindros, conos, esferas, toros, planos, anillos,
   placas octogonales biseladas, líneas y brillos. Sin DOM, sin texturas
   externas, sin imágenes de IA y sin tocar el arma base.
   ========================================================================= */
(function () {
  var V = window.V23C;
  if (!V || !V.register) return;

  /* Paleta del Observatorio + color de ruta de cada arma. */
  var P = {
    teal: '#69d3c1', tealL: '#d9fff7', tealD: '#2e7d72',
    blue: '#7aa2ff', blueL: '#dff2ff', blueD: '#2f5fae',
    violet: '#c49bff', violetL: '#e7d6ff', violetD: '#6a4a9e',
    lime: '#b8d46a', limeL: '#eef8cf', limeD: '#5f7f2e',
    amber: '#f3b562', amberL: '#ffe6b8', amberD: '#a86b2a',
    gold: '#e4c07a', bronze: '#b9874f', bone: '#f2f0ea', dark: '#141a25'
  };
  var TAU = Math.PI * 2;

  /* --- utilidades ------------------------------------------------------- */
  function n(base, qf) { return Math.max(1, Math.round(base * (qf || 0.72))); }
  function em(hex, i) {
    return { emissive: hex, emissiveIntensity: i == null ? 0.85 : i, roughness: 0.42, metalness: 0.3 };
  }
  function at(o, x, y, z) { o.position.set(x || 0, y || 0, z || 0); return o; }
  function rot(o, x, y, z) { o.rotation.set(x || 0, y || 0, z || 0); return o; }
  function facet(o) {
    if (o && o.material) { o.material.flatShading = true; o.material.needsUpdate = true; }
    return o;
  }
  /* Arco de toro abierto: cintas, olas, guardas y aros parciales. */
  function arc(r, tube, len, hex, opt) {
    return V.mesh(new THREE.TorusGeometry(r, tube, 5, 26, len), V.mat(hex, opt));
  }
  /* Sector de anillo plano y aditivo: cintas de luz a ras de suelo. */
  function ribbon(ri, ro, len, start, hex, opacity) {
    var mat = V.basic(hex, {
      transparent: true, opacity: opacity, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    });
    var mesh = V.mesh(new THREE.RingGeometry(ri, ro, 28, 1, start, len), mat);
    mesh.renderOrder = 2;
    return mesh;
  }
  /* Placa octogonal biselada (nunca una caja lisa como forma dominante). */
  function slab(w, d, h, hex, x, y, z, opt) {
    var mesh = V.mesh(new THREE.CylinderGeometry(0.5, 0.5, h, 8), V.mat(hex, opt));
    mesh.scale.set(w, 1, d);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }
  function spark(hex, size, opacity) {
    var s = makeGlowSprite(hex, size, opacity == null ? 0.62 : opacity);
    s.renderOrder = 3;
    return s;
  }
  /* Partícula sólida que puede desvanecerse (opacidad la anima el núcleo). */
  function chip(hex, h) {
    var mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hex), emissive: new THREE.Color(hex), emissiveIntensity: 1.1,
      roughness: 0.42, metalness: 0.3, transparent: true, opacity: 0.92, depthWrite: false
    });
    return new THREE.Mesh(new THREE.ConeGeometry(0.028, h, 4), mat);
  }
  function edge(points, hex, opacity) { return V.line(points, hex, opacity == null ? 0.55 : opacity); }
  function v3(x, y, z) { return new THREE.Vector3(x, y, z); }
  function addAll(g, list) { for (var i = 0; i < list.length; i++) if (list[i]) g.add(list[i]); }

  /* =======================================================================
     1 · CHISPAS DE RACHA  ·  poco común  ·  avatar.root
     Firma: arcos que ascienden con estela, brasas sobre el suelo y parpadeo.
     Nada de estrellas sueltas: cada chispa pertenece a un arco o a una brasa.
     ======================================================================= */
  V.register('c-efecto-chispas', function (c, qf) {
    var q = qf || 0.72, g = new THREE.Group(), i;
    var hi = q > 0.55;

    /* suelo: dos aros de brasa + halo bajo (no nube de puntos) */
    var bedA = rot(V.torus(0.62, 0.016, P.amber, 0, 0.03, 0, em(P.amber, 0.55)), Math.PI / 2, 0, 0);
    var bedB = rot(V.torus(0.4, 0.011, P.gold, 0, 0.022, 0, em(P.gold, 0.5)), Math.PI / 2, 0, 0);
    addAll(g, [bedA, bedB]);
    if (hi) g.add(V.soft(P.amber, 1.7, 0.55, 0, 0.04, 0, 0.14));

    /* brasas: conos inclinados + núcleos calientes + carbones apagados */
    var embers = n(9, q);
    for (i = 0; i < embers; i++) {
      var a = (i / embers) * TAU + (i % 3) * 0.21;
      var rr = 0.5 + (i % 4) * 0.14;
      var ex = Math.cos(a) * rr, ez = Math.sin(a) * rr * 0.78;
      var coal = V.cone(0.028 + (i % 3) * 0.007, 0.075 + (i % 2) * 0.045, 4,
        i % 3 ? P.amber : P.gold, ex, 0.045, ez, em(P.amber, 0.9));
      rot(coal, 0.15 + (i % 4) * 0.16, a, 0.12);
      g.add(coal);
      if (i % 3 === 0) g.add(at(spark(P.amberL, 0.15, 0.34), ex, 0.07, ez));
      if (i % 4 === 1) g.add(V.sphere(0.024, P.bone, ex * 0.9, 0.035, ez * 0.9, em(P.bone, 0.6)));
    }
    /* carbones apagados: tono oscuro y base de brasas */
    var charred = n(3, q);
    for (i = 0; i < charred; i++) {
      var ca = 0.7 + i * 2.1;
      g.add(slab(0.09, 0.07, 0.028, P.dark, Math.cos(ca) * 0.7, 0.018, Math.sin(ca) * 0.55));
    }

    /* arcos grandes que nacen del suelo y suben (firma principal) */
    var big = hi ? 3 : 2;
    for (i = 0; i < big; i++) {
      var R = 0.7 + i * 0.16;
      var rise = arc(R, 0.018 - i * 0.002, 1.4 + i * 0.1,
        i === 1 ? P.amberL : P.amber, em(P.amber, 0.6));
      rot(rise, 0, 0.5 + i * 1.0, 0);
      rise.position.y = 0.02;
      g.add(rise);
    }

    /* corona de arcos pequeños que el núcleo hace girar (v23c-trail-arc) */
    var arcGroup = new THREE.Group();
    arcGroup.position.y = 0.42;
    var crown = hi ? 3 : 2;
    for (i = 0; i < crown; i++) {
      var small = arc(0.2 + i * 0.045, 0.012, 1.25, i === 1 ? P.gold : P.amberL, em(P.amber, 0.7));
      rot(small, 0.4 * i, i * 2.0, 0.3 * i);
      arcGroup.add(small);
    }
    g.add(arcGroup);

    /* chispas en arco: esquirlas sólidas + brillos; suben y se apagan */
    var sparks = [];
    for (i = 0; i < n(7, q); i++) {
      sparks.push(at(chip(i % 2 ? P.amberL : P.gold, 0.1 + (i % 3) * 0.03),
        0, 0.3, ((i % 3) - 1) * 0.22));
    }
    for (i = 0; i < n(6, q); i++) {
      sparks.push(at(spark(i % 2 ? P.amberL : P.amber, 0.12 + (i % 3) * 0.04, 0.7),
        0, 0.45, ((i % 3) - 1) * 0.3));
    }
    addAll(g, sparks);

    V.addAnim(g, { type: 'v23c-spin', speed: 0.22, phase: 0.4 });
    V.addAnim(g, { type: 'v23c-trail-arc', arc: arcGroup, sparks: sparks });
    V.addAnim(g, { type: 'v23c-pulse', speed: 2.2, amplitude: 0.02 });
    return g;
  }, 'arcos ascendentes con estela, brasas de suelo y parpadeo');

  /* =======================================================================
     2 · ESTELA DE RACHA  ·  épico  ·  avatar.root
     Firma: cintas/arcos de luz horizontales que salen de los pies y quedan
     atrás, con punta ascendente, varias capas y rastro. No es una nube de
     puntos: son sectores de anillo macizos + plumas + líneas de rastro.
     ======================================================================= */
  V.register('x-estela-racha', function (c, qf) {
    var q = qf || 0.72, g = new THREE.Group(), i;
    var hi = q > 0.55;
    g.position.y = 0.02;
    var START = 0.1 * Math.PI;

    /* tres capas de cinta plana barriendo la parte trasera del héroe */
    var bands = [
      [0.16, 0.5, 0.86, P.violet, 0.44],
      [0.42, 0.72, 0.9, P.violetL, 0.3],
      [0.64, 0.74, 0.8, P.gold, 0.2]
    ];
    for (i = 0; i < bands.length; i++) {
      if (i === 2 && !hi) continue;
      var b = bands[i];
      var fan = ribbon(b[0], b[1], b[2] * Math.PI, START, b[3], b[4]);
      rot(fan, -Math.PI / 2, 0, 0);
      fan.position.y = 0.016 + i * 0.03;
      g.add(fan);
    }
    /* bordes: dos aros finos que cierran la silueta del suelo */
    var rimIn = ribbon(0.46, 0.5, 0.86 * Math.PI, START, P.violetD, 0.6);
    rot(rimIn, -Math.PI / 2, 0, 0);
    rimIn.position.y = 0.012;
    g.add(rimIn);
    var rimOut = ribbon(0.7, 0.73, 0.8 * Math.PI, 0.14 * Math.PI, P.gold, 0.5);
    rot(rimOut, -Math.PI / 2, 0, 0);
    rimOut.position.y = 0.05;
    g.add(rimOut);

    /* puntas ascendentes en el borde trasero */
    var tips = hi ? 6 : 4;
    for (i = 0; i < tips; i++) {
      var ang = 0.16 * Math.PI + (i / (tips - 1)) * 0.68 * Math.PI;
      var rr = i % 2 ? 0.66 : 0.54;
      var tx = Math.cos(ang) * rr;
      var tz = -Math.sin(ang) * rr;
      var th = 0.36 + (i % 3) * 0.1;
      var tip = V.cone(0.038, th, 5, i % 2 ? P.gold : P.violetL,
        tx, 0.04 + th / 2, tz, em(i % 2 ? P.gold : P.violet, 0.8));
      rot(tip, Math.sin(ang) * 0.34, 0, -Math.cos(ang) * 0.34);
      g.add(tip);
      if (i % 2 === 0) g.add(at(spark(P.violetL, 0.16, 0.48), tx, 0.05 + th, tz));
    }

    /* dos arcos delanteros bajos: la estela se lee también de frente */
    var frontR = arc(0.3, 0.016, 1.2, P.violetL, em(P.violet, 0.65));
    rot(frontR, 0, -0.7, 0);
    frontR.position.set(0.34, 0.04, 0.24);
    var frontL = arc(0.3, 0.016, 1.2, P.violetL, em(P.violet, 0.65));
    rot(frontL, 0, Math.PI - 0.7, 0);
    frontL.position.set(-0.34, 0.04, 0.24);
    addAll(g, [frontR, frontL]);

    /* rastro: tres líneas largas que se quedan atrás */
    g.add(edge([v3(-0.09, 0.05, 0.04), v3(-0.24, 0.075, -0.32), v3(-0.37, 0.1, -0.64), v3(-0.43, 0.16, -0.88)], P.teal, 0.5));
    g.add(edge([v3(0.09, 0.05, 0.04), v3(0.25, 0.075, -0.34), v3(0.39, 0.1, -0.66), v3(0.45, 0.17, -0.9)], P.gold, 0.5));
    g.add(edge([v3(0, 0.05, 0), v3(0.04, 0.09, -0.4), v3(-0.03, 0.13, -0.78), v3(0.02, 0.19, -1.0)], P.violetL, 0.42));

    /* plumas macizas del rastro (dirección clara hacia atrás) */
    var tailR = V.cone(0.065, 0.32, 5, P.violetD, -0.24, 0.08, -0.4, em(P.violet, 0.45));
    rot(tailR, -Math.PI / 2, 0, 0);
    g.add(tailR);
    var tailL = V.cone(0.06, 0.28, 5, P.violetD, 0.26, 0.08, -0.44, em(P.violet, 0.45));
    rot(tailL, -Math.PI / 2, 0, 0);
    g.add(tailL);

    /* remaches de luz sobre el borde */
    var studs = hi ? 4 : 2;
    for (i = 0; i < studs; i++) {
      var sa = 0.28 * Math.PI + i * 0.42;
      g.add(V.sphere(0.028, P.bone, Math.cos(sa) * 0.52, 0.062, -Math.sin(sa) * 0.52, em(P.bone, 0.7)));
    }

    /* postes finos del rastro: familia cilindro y acento teal */
    g.add(V.cyl(0.016, 0.024, 0.16, 6, P.teal, -0.6, 0.12, -0.24, em(P.teal, 0.65)));
    g.add(V.cyl(0.016, 0.024, 0.16, 6, P.teal, 0.6, 0.12, -0.24, em(P.teal, 0.65)));
    if (hi) {
      g.add(at(spark(P.tealL, 0.14, 0.45), -0.6, 0.22, -0.24));
      g.add(at(spark(P.tealL, 0.14, 0.45), 0.6, 0.22, -0.24));
    }

    /* pocas motas bajas, pegadas a las cintas */
    var motes = n(4, q);
    for (i = 0; i < motes; i++) {
      g.add(at(spark(i % 2 ? P.gold : P.violetL, 0.11 + (i % 2) * 0.05, 0.42),
        -0.5 + (i % 4) * 0.33, 0.075 + (i % 2) * 0.05, -0.24 - Math.floor(i / 4) * 0.3));
    }

    V.addAnim(g, { type: 'v23c-spin', speed: 0.3, phase: 0.6 });
    V.addAnim(g, { type: 'v23c-bob', baseY: 0.02, amplitude: 0.03, speed: 1.05 });
    V.addAnim(g, { type: 'v23c-pulse', speed: 1.5, amplitude: 0.022 });
    return g;
  }, 'cintas de suelo en capas con punta ascendente y rastro');

  /* =======================================================================
     3 · DESTELLO DEL TERRITORIO  ·  épico  ·  avatar.weapon
     Firma: lanza/aguja de luz vertical, cruz de guarda, punta brillante y
     motas que suben por el asta. Silueta alargada y afilada.
     ======================================================================= */
  V.register('x-arma-destello', function (c, qf) {
    var q = qf || 0.72, g = new THREE.Group(), i;
    g.position.set(0.02, 0.02, 0.14);

    /* asta de luz, hoja afilada y contrapunta */
    g.add(V.cyl(0.03, 0.045, 0.72, 6, P.tealL, 0, 0.72, 0, em(P.teal, 0.8)));
    var blade = V.cone(0.052, 0.42, 4, P.bone, 0, 1.24, 0, em(P.teal, 0.55));
    facet(blade);
    rot(blade, 0, 0.78, 0);
    g.add(blade);
    var pommel = V.cone(0.042, 0.26, 4, P.teal, 0, 0.2, 0, em(P.teal, 0.8));
    rot(pommel, Math.PI, 0.6, 0);
    g.add(pommel);

    /* cruz de guarda: barra cilíndrica, conteras cónicas y anillo */
    var guard = V.cyl(0.032, 0.032, 0.56, 8, P.gold, 0, 0.36, 0, em(P.gold, 0.5));
    rot(guard, 0, 0, Math.PI / 2);
    var ferrA = V.cone(0.045, 0.12, 4, P.tealL, -0.3, 0.36, 0, em(P.teal, 0.85));
    rot(ferrA, 0, 0, Math.PI / 2);
    var ferrB = V.cone(0.045, 0.12, 4, P.tealL, 0.3, 0.36, 0, em(P.teal, 0.85));
    rot(ferrB, 0, 0, -Math.PI / 2);
    var guardRing = V.torus(0.098, 0.016, P.gold, 0, 0.36, 0, em(P.gold, 0.6));
    rot(guardRing, Math.PI / 2, 0, 0);
    addAll(g, [guard, ferrA, ferrB, guardRing]);

    /* nudillos biselados y empuñadura oscura */
    g.add(slab(0.08, 0.1, 0.05, P.tealD, -0.17, 0.36, 0));
    g.add(slab(0.08, 0.1, 0.05, P.tealD, 0.17, 0.36, 0));
    g.add(V.cyl(0.052, 0.052, 0.08, 8, P.dark, 0, 0.1, 0));
    var band = V.torus(0.056, 0.01, P.gold, 0, 0.145, 0, em(P.gold, 0.5));
    rot(band, Math.PI / 2, 0, 0);
    g.add(band);

    /* punta brillante y brillos */
    g.add(V.sphere(0.032, P.bone, 0, 1.44, 0, em(P.bone, 1)));
    g.add(at(spark(P.tealL, 0.36, 0.7), 0, 1.46, 0));
    if (q > 0.5) g.add(V.glow(P.teal, 0.55, 0, 0.4, 0, 0.28));

    /* motas que recorren el asta (suben y se apagan) */
    var lane = new THREE.Group();
    lane.position.set(0, -0.3, 0);
    lane.scale.set(0.78, 0.95, 0.78);
    var sparks = [];
    for (i = 0; i < n(6, q); i++) {
      sparks.push(at(spark(i % 2 ? P.tealL : P.bone, 0.1 + (i % 3) * 0.045, 0.8),
        0, 0.4, ((i % 3) - 1) * 0.05));
    }
    for (i = 0; i < n(3, q); i++) sparks.push(at(chip(P.tealL, 0.09), 0, 0.5, 0));
    addAll(lane, sparks);
    g.add(lane);

    V.addAnim(g, { type: 'v23c-pulse', speed: 1.7, amplitude: 0.045 });
    V.addAnim(g, { type: 'v23c-bob', baseY: 0.02, amplitude: 0.018, speed: 1.1, phase: 0.6 });
    V.addAnim(g, { type: 'v23c-trail-arc', sparks: sparks });
    return g;
  }, 'lanza vertical de luz con cruz de guarda y motas ascendentes');

  /* =======================================================================
     4 · MAREA DEL CUIDADO  ·  épico  ·  avatar.weapon
     Firma: ola/tridente curvo con gotas y dos arcos laterales. Silueta
     ondulada: dos crestas cruzadas para conservar volumen al girar.
     ======================================================================= */
  V.register('x-arma-marea', function (c, qf) {
    var q = qf || 0.72, g = new THREE.Group(), i;
    g.position.set(0, 0.02, 0.1);

    /* cresta principal + cresta cruzada fina (volumen) */
    var crestA = arc(0.3, 0.05, 2.5, P.blue, em(P.blue, 0.9));
    rot(crestA, 0, 0, -1.1);
    crestA.position.set(0, 0.98, 0);
    var crestB = arc(0.2, 0.032, 2.2, P.blueL, em(P.blue, 0.6));
    rot(crestB, 0, 1.15, 1.9);
    crestB.position.set(0.02, 0.78, 0);
    addAll(g, [crestA, crestB]);

    /* tres puntas de tridente sobre la cresta */
    var prongC = V.cone(0.035, 0.22, 5, P.blueL, 0.05, 1.37, 0, em(P.blue, 0.9));
    var prongL = V.cone(0.03, 0.18, 5, P.blueL, -0.1, 1.32, 0.02, em(P.blue, 0.85));
    rot(prongL, 0, 0, 0.34);
    var prongR = V.cone(0.03, 0.18, 5, P.blueL, 0.2, 1.32, 0.02, em(P.blue, 0.85));
    rot(prongR, 0, 0, -0.34);
    addAll(g, [prongC, prongL, prongR]);

    /* dos arcos laterales */
    var sideL = arc(0.24, 0.018, 1.5, P.blueL, em(P.blue, 0.7));
    rot(sideL, 0, 1.05, 0.5);
    sideL.position.set(-0.28, 0.82, 0);
    var sideR = arc(0.24, 0.018, 1.5, P.blueL, em(P.blue, 0.7));
    rot(sideR, 0, -1.05, -0.5);
    sideR.position.set(0.28, 0.82, 0);
    addAll(g, [sideL, sideR]);

    /* gotas: esferas y lágrimas cónicas */
    var drops = n(7, q);
    for (i = 0; i < drops; i++) {
      var da = i * 1.7;
      var dr = 0.1 + (i % 4) * 0.06;
      var dx = Math.cos(da) * dr + (i % 2 ? 0.08 : -0.08);
      var dy = 0.55 + (i % 5) * 0.16;
      var dz = Math.sin(da) * 0.12;
      if (i % 3 === 0) {
        var dropCone = V.cone(0.026, 0.1, 5, P.blueL, dx, dy, dz, em(P.blue, 0.85));
        rot(dropCone, Math.PI, 0, 0);
        g.add(dropCone);
      } else {
        g.add(V.sphere(0.026 + (i % 3) * 0.008, i % 2 ? P.blueL : P.bone, dx, dy, dz, em(P.blue, 0.7)));
      }
    }

    /* espina, base biselada y abrazadera */
    g.add(V.cyl(0.02, 0.028, 0.95, 6, P.blueD, 0, 0.72, -0.02, em(P.blue, 0.3)));
    g.add(slab(0.14, 0.14, 0.05, P.dark, 0, 0.26, 0));
    var collar = V.cyl(0.075, 0.09, 0.06, 10, P.gold, 0, 0.3, 0, em(P.gold, 0.45));
    var collarRing = V.torus(0.085, 0.012, P.blueL, 0, 0.34, 0, em(P.blue, 0.6));
    rot(collarRing, Math.PI / 2, 0, 0);
    addAll(g, [collar, collarRing]);

    g.add(at(spark(P.blueL, 0.42, 0.55), 0, 1.0, 0.05));
    if (q > 0.5) g.add(V.soft(P.blue, 0.95, 0.7, 0.02, 0.85, 0.02, 0.12));

    V.addAnim(g, { type: 'v23c-spin', speed: 0.38, phase: 0.2 });
    V.addAnim(g, { type: 'v23c-bob', baseY: 0.02, amplitude: 0.055, speed: 1.2, phase: 1.1 });
    V.addAnim(g, { type: 'v23c-pulse', speed: 1.5, amplitude: 0.03 });
    return g;
  }, 'ola y tridente curvo con gotas y arcos laterales');

  /* =======================================================================
     5 · SELLO DE LA CONFIANZA  ·  épico  ·  avatar.weapon
     Firma: disco/sello circular grueso con runas, mango y anillo. Silueta
     redonda de frente: medallón vertical montado junto a la empuñadura.
     ======================================================================= */
  V.register('x-arma-sello', function (c, qf) {
    var q = qf || 0.72, g = new THREE.Group(), i;
    g.position.set(0.02, 0.78, 0.2);

    /* medallón vertical: el disco gira en su plano y la silueta sigue redonda */
    var md = new THREE.Group();
    var back = V.cyl(0.16, 0.16, 0.02, 18, P.dark, 0, 0, -0.04, em(P.violet, 0.2));
    rot(back, Math.PI / 2, 0, 0);
    var disc = V.cyl(0.2, 0.21, 0.055, 20, P.violetD, 0, 0, 0, em(P.violet, 0.35));
    rot(disc, Math.PI / 2, 0, 0);
    var face = V.cyl(0.175, 0.185, 0.022, 20, P.violet, 0, 0, 0.036, em(P.violet, 0.6));
    rot(face, Math.PI / 2, 0, 0);
    var rim = V.torus(0.205, 0.018, P.violet, 0, 0, 0, em(P.violet, 0.95));
    var innerRing = V.torus(0.13, 0.01, P.violetL, 0, 0, 0.052, em(P.violet, 0.9));
    addAll(md, [back, disc, face, rim, innerRing]);

    /* runas radiales sobre la cara frontal (tamaño variable: se nota el giro) */
    var runes = n(8, q);
    for (i = 0; i < runes; i++) {
      var ra = (i / runes) * TAU;
      var rh = 0.052 + (i % 3) * 0.018;
      var rune = V.box(0.022, rh, 0.012, i % 3 ? P.bone : P.gold,
        Math.cos(ra) * 0.165, Math.sin(ra) * 0.165, 0.052, em(P.violetL, 0.9));
      rune.rotation.z = ra - Math.PI / 2;
      md.add(rune);
      if (i % 2 === 0) {
        md.add(V.sphere(0.017, P.violetL,
          Math.cos(ra + 0.2) * 0.105, Math.sin(ra + 0.2) * 0.105, 0.054, em(P.violet, 1)));
      }
    }
    /* aguja del sello: referencia visible del giro */
    md.add(V.cone(0.028, 0.085, 4, P.bone, 0, 0.215, 0.052, em(P.bone, 0.9)));

    /* emblema central, halo trasero y astillas que rompen el borde */
    md.add(V.sphere(0.045, P.violetL, 0, 0, 0.055, em(P.violet, 1.1)));
    md.add(V.torus(0.075, 0.009, P.gold, 0, 0, 0.052, em(P.gold, 0.7)));
    var backHalo = V.torus(0.24, 0.008, P.violetL, 0, 0, -0.065, em(P.violet, 0.8));
    rot(backHalo, 0, 0.25, 0);
    md.add(backHalo);
    var shards = n(4, q);
    for (i = 0; i < shards; i++) {
      var sa2 = 0.6 + i * 2.1;
      md.add(V.sphere(0.02, P.gold, Math.cos(sa2) * 0.27, Math.sin(sa2) * 0.27, 0.02, em(P.gold, 0.9)));
    }
    g.add(md);

    /* mango, pomo y anillo (fijos: sostienen el medallón) */
    g.add(V.cyl(0.052, 0.052, 0.03, 8, P.violetD, 0, 0.21, 0, em(P.violet, 0.4)));
    g.add(V.cyl(0.03, 0.036, 0.14, 8, P.gold, 0, 0.28, 0, em(P.gold, 0.5)));
    g.add(V.sphere(0.038, P.gold, 0, 0.37, 0, em(P.gold, 0.6)));
    g.add(V.torus(0.058, 0.012, P.violetL, 0, 0.43, 0, em(P.violet, 0.9)));

    /* montura al asta y brillos */
    var clasp = V.cyl(0.012, 0.012, 0.2, 6, P.gold, 0, 0, -0.15, em(P.gold, 0.5));
    rot(clasp, Math.PI / 2, 0, 0);
    g.add(clasp);
    g.add(at(spark(P.violetL, 0.4, 0.55), 0, 0, 0.1));
    if (q > 0.5) g.add(V.soft(P.violet, 0.95, 0.95, 0, 0, 0.02, 0.12));

    V.addAnim(g, { type: 'v23c-trail-arc', arc: md });
    V.addAnim(g, { type: 'v23c-bob', baseY: 0.78, amplitude: 0.03, speed: 1.15, phase: 0.4 });
    V.addAnim(g, { type: 'v23c-pulse', speed: 1.8, amplitude: 0.04 });
    return g;
  }, 'medallón redondo con runas, mango y anillo que gira en su plano');

  /* =======================================================================
     6 · PRISMA DE LA EVIDENCIA  ·  épico  ·  avatar.weapon
     Firma: prisma facetado alto con aristas, destellos y base. Silueta
     triangular/facetada (pirámide de 4 caras + cuerpo + aristas de luz).
     ======================================================================= */
  V.register('x-arma-prisma', function (c, qf) {
    var q = qf || 0.72, g = new THREE.Group(), i;
    var hi = q > 0.55;
    g.position.set(0, 0.02, 0.02);
    var cx = -0.2, cz = 0.02;

    /* cuerpo facetado */
    var low = V.cone(0.19, 0.26, 4, P.limeD, cx, 0.38, cz, em(P.lime, 0.35));
    facet(low);
    rot(low, Math.PI, Math.PI / 4, 0);
    var body = V.cyl(0.155, 0.19, 0.62, 4, P.lime, cx, 0.82, cz, em(P.lime, 0.55));
    facet(body);
    rot(body, 0, Math.PI / 4, 0);
    var top = V.cone(0.155, 0.34, 4, P.limeL, cx, 1.3, cz, em(P.lime, 0.7));
    facet(top);
    rot(top, 0, Math.PI / 4, 0);
    addAll(g, [low, body, top]);

    /* base biselada + aro de apoyo */
    var pedestal = V.cyl(0.13, 0.17, 0.07, 6, P.gold, cx, 0.27, cz, em(P.gold, 0.4));
    rot(pedestal, 0, Math.PI / 6, 0);
    var halo = V.torus(0.16, 0.012, P.limeL, cx, 0.31, cz, em(P.lime, 0.9));
    rot(halo, Math.PI / 2, 0, 0);
    addAll(g, [pedestal, halo]);
    /* pie oscuro biselado: ancla el prisma y suma tono profundo */
    g.add(slab(0.22, 0.19, 0.03, P.dark, cx, 0.225, cz));
    /* abrazadera al asta del arma */
    var clamp = V.cyl(0.013, 0.013, 0.2, 6, P.gold, -0.1, 0.92, cz, em(P.gold, 0.5));
    rot(clamp, 0, 0, Math.PI / 2);
    g.add(clamp);

    /* aristas de luz */
    var edges = hi ? 4 : 2;
    for (i = 0; i < edges; i++) {
      var ea = Math.PI / 4 + i * Math.PI / 2;
      var ux = Math.cos(ea), uz = Math.sin(ea);
      g.add(edge([
        v3(cx + ux * 0.19, 0.51, cz + uz * 0.19),
        v3(cx + ux * 0.155, 1.13, cz + uz * 0.155)
      ], P.limeL, 0.6));
      if (hi) g.add(edge([v3(cx + ux * 0.155, 1.13, cz + uz * 0.155), v3(cx, 1.47, cz)], P.limeL, 0.45));
    }

    /* destellos y marca de evidencia sobre la cara del cristal */
    g.add(V.sphere(0.028, P.bone, cx + 0.1, 1.0, cz + 0.12, em(P.limeL, 0.8)));
    if (hi) g.add(V.sphere(0.024, P.bone, cx - 0.11, 0.72, cz - 0.08, em(P.limeL, 0.8)));
    var mark = rot(V.box(0.1, 0.02, 0.014, P.bone, cx + 0.02, 0.94, cz + 0.13, em(P.limeL, 0.9)), 0, 0, 0.2);
    g.add(mark);

    /* motas que suben por el prisma */
    var lane = new THREE.Group();
    lane.position.set(cx, -0.26, cz);
    lane.scale.set(0.55, 0.9, 0.5);
    var sparks = [];
    for (i = 0; i < n(5, q); i++) {
      sparks.push(at(spark(i % 2 ? P.limeL : P.bone, 0.14 + (i % 3) * 0.05, 0.75),
        0, 0.4, ((i % 3) - 1) * 0.05));
    }
    for (i = 0; i < n(2, q); i++) sparks.push(at(chip(P.limeL, 0.09), 0, 0.5, 0));
    addAll(lane, sparks);
    g.add(lane);

    V.addAnim(g, { type: 'v23c-spin', speed: 0.5, phase: 0.4 });
    V.addAnim(g, { type: 'v23c-pulse', speed: 1.8, amplitude: 0.045 });
    V.addAnim(g, { type: 'v23c-trail-arc', sparks: sparks });
    return g;
  }, 'prisma facetado alto con aristas, destellos y base');

  /* =======================================================================
     7 · ÓRBITA DEL SISTEMA  ·  épico  ·  avatar.weapon
     Firma: anillos orbitales inclinados alrededor del arma con 2–3
     planetoides; silueta de elipses cruzadas.
     ======================================================================= */
  V.register('x-arma-orbita', function (c, qf) {
    var q = qf || 0.72, g = new THREE.Group(), i;
    var cy = 0.94;

    /* tres anillos inclinados que se cruzan */
    var ringA2 = V.torus(0.32, 0.022, P.amber, 0, cy, 0, em(P.amber, 0.9));
    rot(ringA2, Math.PI / 2 - 0.3, 0, 0.18);
    var ringB2 = V.torus(0.31, 0.017, P.gold, 0, cy - 0.02, 0, em(P.gold, 0.8));
    rot(ringB2, Math.PI / 2 + 0.42, 0, -0.24);
    var ringC2 = V.torus(0.22, 0.012, P.amberL, 0, cy + 0.04, 0, em(P.amber, 0.8));
    rot(ringC2, Math.PI / 2 + 0.92, 0, 0.5);
    addAll(g, [ringA2, ringB2, ringC2]);

    /* planetoides: esfera anillada, esfera dorada y satélite pequeño */
    var planetA3 = V.sphere(0.072, P.amber, 0.32, cy + 0.08, 0.1, em(P.amber, 1));
    var planetRing = V.torus(0.11, 0.008, P.bone, 0.32, cy + 0.08, 0.1, em(P.bone, 0.7));
    rot(planetRing, 1.15, 0.4, 0.2);
    var planetB3 = V.sphere(0.052, P.gold, -0.3, cy - 0.1, -0.12, em(P.gold, 0.9));
    var planetC3 = V.sphere(0.04, P.amberL, 0.07, cy + 0.22, -0.24, em(P.amber, 0.8));
    var satellite = V.cone(0.03, 0.13, 4, P.bronze, -0.18, cy + 0.2, 0.08, em(P.gold, 0.4));
    rot(satellite, 0.5, 0.7, 0.8);
    addAll(g, [planetA3, planetRing, planetB3, planetC3, satellite]);

    /* abrazadera al arma */
    g.add(V.cyl(0.085, 0.1, 0.07, 10, P.dark, 0, 0.62, 0));
    g.add(slab(0.18, 0.16, 0.05, P.bronze, 0, 0.6, 0, em(P.bronze, 0.15)));
    var collarRing = V.torus(0.1, 0.013, P.gold, 0, 0.66, 0, em(P.gold, 0.7));
    rot(collarRing, Math.PI / 2, 0, 0);
    g.add(collarRing);

    /* núcleo de luz entre los anillos */
    if (q > 0.5) g.add(V.glow(P.amber, 0.55, 0, cy, 0, 0.22));

    /* pocas motas entre anillos */
    for (i = 0; i < n(4, q); i++) {
      var ma = i * 1.9;
      var mr = 0.2 + (i % 2) * 0.12;
      g.add(at(spark(P.amberL, 0.1 + (i % 2) * 0.04, 0.5),
        Math.cos(ma) * mr, cy + Math.sin(ma * 1.3) * 0.1, Math.sin(ma) * mr * 0.6));
    }

    V.addAnim(g, { type: 'v23c-orbit', radius: 0.05, baseY: 0.02, baseX: 0, baseZ: 0, speed: 0.5, tilt: 0.03 });
    V.addAnim(g, { type: 'v23c-spin', speed: 0.35, phase: 0.4 });
    V.addAnim(g, { type: 'v23c-pulse', speed: 1.7, amplitude: 0.04 });
    return g;
  }, 'anillos orbitales inclinados con planetoides alrededor del arma');
})();
