/* =========================================================================
   SERUMS QUEST · V2.3 · FASE 2 · AGENTE 4 — MARCOS Y MASCOTAS
   -------------------------------------------------------------------------
   Piezas registradas en V23C (part17a):
     · c-marco-bronce        (común)      esquinas reforzadas, biseles, remaches
     · c-marco-platino       (raro)       metal pulido, ornamento en esquinas, doble filo
     · c-marco-vacio         (épico)      portal negro, anillo violeta, partículas hacia dentro
     · c-marco-constelacion  (legendario) aro de mapa estelar, órbitas reales, cristal
     · x-luciernaga-observatorio (raro)   insecto con alas translúcidas y abdomen vivo
     · x-buho-cometa         (épico)      búho con alas desplegadas y cola de cometa
     · x-zorro-tinta         (épico)      zorro de tinta con cola amplia y pincelada

   ACOPLE
   - Marcos en avatar.root, geometría en coordenadas del avatar (centrada en
     y≈1,35 y z≈−0,68, detrás del héroe): no tapan cara ni pecho.
   - La decoración orbital de la constelación vive detrás del plano del marco
     (z≈−0,98…−1,11) y gira sobre su propia normal, sin barrer en profundidad:
     así nunca entra en el volumen del cuerpo (0 penetraciones de encaje).
   - El animador histórico 'frame' escribe group.position.y en valor ABSOLUTO;
     como la geometría ya está a y≈1,35, se usa baseY≈0 (el mismo valor que el
     visor fuerza en v23vTuneCosmetics). Así visor y juego coinciden y el marco
     no se duplica en altura.
   - Mascotas en avatar.root, geometría construida alrededor del origen local
     y colocada por el animador 'pet' (baseX/baseY/baseZ + órbita). El grupo
     conserva además esa posición de reposo para que las miniaturas, que no
     animan, también muestren la mascota al lado del héroe.
   - El dibujo interior de cada mascota va en un grupo 'art' a escala de
     compañero: la escala del grupo se queda en 1,3–1,7 según el contrato,
     pero el bicho no se come al héroe ni choca con su torso.
   - El suelo lo añade el visor: aquí no se construye suelo.

   ANIMACIÓN PROPIA
   'v23c4-flap' (alas) y 'v23c4-tail' (cola) son sub-animaciones que mueven
   subgrupos, no la pieza. Se enganchan con un envoltorio aditivo y protegido
   sobre V23C.update: el núcleo corre igual y ningún spec ajeno cambia. Si otro
   archivo redefine V23C.update después, las piezas siguen viéndose (solo se
   quedan quietos alas y cola).

   Cargar SIEMPRE después de part17a-v23c-core.js.
   ========================================================================= */
(function () {
  if (!window.V23C || typeof V23C.register !== 'function') return;

  var PI = Math.PI;

  /* ------------------------------------------------------------------ */
  /* Utilidades                                                          */
  /* ------------------------------------------------------------------ */
  function v3(x, y, z) { return new THREE.Vector3(x, y, z); }
  function qc(base, qf) { return Math.max(1, Math.round(base * (qf == null ? 0.72 : qf))); }
  function stageOf(c) { return typeof cosmeticStage === 'function' ? cosmeticStage(c) : 1; }
  function addMesh(g, m) { g.add(m); return m; }
  function addRail(g, x, y, z, len, horizontal, radius, hex, opts) {
    var m = V23C.cyl(radius, radius, len, 6, hex, x, y, z, opts);
    if (horizontal) m.rotation.z = PI / 2;
    return addMesh(g, m);
  }
  function addPlate(g, w, h, d, hex, x, y, z, rz, opts) {
    var m = V23C.box(w, h, d, hex, x, y, z, opts);
    if (rz) m.rotation.z = rz;
    return addMesh(g, m);
  }
  function addRivet(g, x, y, z, r, hex, opts) {
    return addMesh(g, V23C.sphere(r, hex, x, y, z, opts));
  }
  function addGlow(g, hex, scale, x, y, z, opacity) {
    return addMesh(g, V23C.glow(hex, scale, x, y, z, opacity));
  }
  /* El grupo de la mascota conserva la escala de contrato (1,3–1,7); el
     dibujo interior se ajusta aparte para que el compañero no se coma al
     héroe ni choque con su torso cuando la órbita lo acerca. */
  function fitPetArt(g, k) {
    var art = new THREE.Group();
    art.scale.setScalar(k);
    while (g.children.length) art.add(g.children.pop());
    g.add(art);
    return art;
  }
  /* Marcas graduadas de un aro: se colocan en el plano XY del padre. */
  function addTicks(parent, radius, count, longLen, shortLen, hex, hexLong, z, opts) {
    for (var i = 0; i < count; i++) {
      var a = (i / count) * PI * 2;
      var big = i % 3 === 0;
      var m = V23C.box(0.018, big ? longLen : shortLen, 0.022, big ? hexLong : hex,
        Math.cos(a) * radius, Math.sin(a) * radius, z, opts);
      m.rotation.z = a - PI / 2;
      parent.add(m);
    }
  }

  /* ------------------------------------------------------------------ */
  /* MARCO DE BRONCE · común                                             */
  /* Silueta: marco grueso de perfil hexagonal, esquinas en rombo con     */
  /* remache y pinchos, crestería superior y línea interior.             */
  /* ------------------------------------------------------------------ */
  V23C.register('c-marco-bronce', function (c, qf) {
    var g = new THREE.Group();
    var Z = -0.68, HW = 0.73, TOP = 2.5, BOT = 0.16, CY = 1.33;
    var BR = { deep: '#5a3a1d', body: '#a2703a', lit: '#cf9c58', pale: '#efd7a2', rust: '#7d4f26' };
    var metal = { metalness: 0.62, roughness: 0.38 };
    var metalPale = { metalness: 0.72, roughness: 0.3 };

    /* cuatro barras de perfil hexagonal (biseladas, no cajas planas) */
    addRail(g, 0, TOP, Z, 1.46, true, 0.062, BR.body, metal);
    addRail(g, 0, BOT, Z, 1.46, true, 0.062, BR.body, metal);
    addRail(g, -HW, CY, Z, 2.34, false, 0.062, BR.body, metal);
    addRail(g, HW, CY, Z, 2.34, false, 0.062, BR.body, metal);

    /* sombra trasera y bisel claro delantero: perfil con dos alturas */
    addPlate(g, 1.4, 0.052, 0.05, BR.deep, 0, TOP - 0.085, Z - 0.07);
    addPlate(g, 1.4, 0.052, 0.05, BR.deep, 0, BOT + 0.085, Z - 0.07);
    addPlate(g, 0.05, 2.2, 0.05, BR.deep, -HW + 0.08, CY, Z - 0.07);
    addPlate(g, 0.05, 2.2, 0.05, BR.deep, HW - 0.08, CY, Z - 0.07);
    addPlate(g, 1.31, 0.026, 0.03, BR.lit, 0, TOP - 0.025, Z + 0.05);
    addPlate(g, 1.31, 0.026, 0.03, BR.lit, 0, BOT + 0.025, Z + 0.05);
    addPlate(g, 0.026, 2.18, 0.03, BR.lit, -HW + 0.025, CY, Z + 0.05);
    addPlate(g, 0.026, 2.18, 0.03, BR.lit, HW - 0.025, CY, Z + 0.05);

    /* esquinas reforzadas: placa en rombo, remache y pincho diagonal */
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(function (d) {
      var cx = d[0] * HW, cy = d[1] > 0 ? TOP : BOT;
      addPlate(g, 0.17, 0.17, 0.135, BR.rust, cx, cy, Z, PI / 4, metal);
      addRivet(g, cx, cy, Z + 0.072, 0.036, BR.pale, metalPale);
      var stud = V23C.cone(0.042, 0.1, 6, BR.lit, cx + d[0] * 0.06, cy + d[1] * 0.06, Z - 0.012, metal);
      stud.rotation.z = Math.atan2(-d[0], d[1]);
      g.add(stud);
    });

    /* remaches a lo largo de las cuatro barras */
    var xs = qf < 0.5 ? [0] : [-0.42, 0, 0.42];
    var ys = qf < 0.5 ? [CY] : [0.75, CY, 1.91];
    xs.forEach(function (x) {
      addRivet(g, x, TOP, Z + 0.062, 0.023, BR.pale, metalPale);
      addRivet(g, x, BOT, Z + 0.062, 0.023, BR.pale, metalPale);
    });
    ys.forEach(function (y) {
      addRivet(g, -HW, y, Z + 0.062, 0.023, BR.pale, metalPale);
      addRivet(g, HW, y, Z + 0.062, 0.023, BR.pale, metalPale);
    });

    /* crestería superior y remate inferior de bronce */
    addPlate(g, 0.28, 0.12, 0.13, BR.rust, 0, TOP + 0.065, Z, 0, metal);
    addMesh(g, V23C.cone(0.085, 0.14, 6, BR.lit, 0, TOP + 0.18, Z, metal));
    addRivet(g, 0, TOP + 0.255, Z, 0.026, BR.pale, metalPale);
    addRivet(g, 0, 0.37, Z + 0.02, 0.06, BR.rust, metalPale);
    var drop = V23C.cone(0.045, 0.1, 6, BR.lit, 0, 0.28, Z, metal);
    drop.rotation.x = PI;
    g.add(drop);

    /* línea simple interior */
    g.add(V23C.line([
      v3(-0.6, 0.3, Z + 0.02), v3(0.6, 0.3, Z + 0.02),
      v3(0.6, 2.36, Z + 0.02), v3(-0.6, 2.36, Z + 0.02),
      v3(-0.6, 0.3, Z + 0.02)
    ], BR.pale, 0.42));

    V23C.addAnim(g, { type: 'frame', baseY: 0.0001, phase: 0.35, color: BR.body });
    return g;
  }, 'Bronce: perfil hexagonal, esquinas en rombo con pinchos, remaches y línea interior.');

  /* ------------------------------------------------------------------ */
  /* MARCO DE PLATINO · raro                                             */
  /* Silueta: rails de dos filos pulidos, abanicos de hojas en las        */
  /* esquinas con gema, vetas de luz y corona superior.                   */
  /* ------------------------------------------------------------------ */
  V23C.register('c-marco-platino', function (c, qf) {
    var g = new THREE.Group();
    var Z = -0.68, HW = 0.73, TOP = 2.5, BOT = 0.16, CY = 1.33;
    var P = { core: '#4c5b73', steel: '#8496b0', edge: '#cfdcee', polish: '#f2f7ff', ice: '#bfe4ff' };
    var metal = { metalness: 0.82, roughness: 0.22 };
    var metalEdge = { metalness: 0.92, roughness: 0.14 };
    var gemMat = { metalness: 0.4, roughness: 0.18, emissive: '#bfe4ff', emissiveIntensity: 1.25 };
    var glows = [];

    /* núcleo de cada rail (caja) */
    addPlate(g, 1.46, 0.086, 0.088, P.core, 0, TOP, Z, 0, metal);
    addPlate(g, 1.46, 0.086, 0.088, P.core, 0, BOT, Z, 0, metal);
    addPlate(g, 0.086, 2.34, 0.088, P.core, -HW, CY, Z, 0, metal);
    addPlate(g, 0.086, 2.34, 0.088, P.core, HW, CY, Z, 0, metal);

    /* doble filo: dos cuchillas de sección roma por rail */
    function blade(x, y, z, len, horizontal) {
      var m = V23C.cyl(0.021, 0.021, len, 4, P.polish, x, y, z, metalEdge);
      if (horizontal) m.rotation.z = PI / 2;
      g.add(m);
    }
    blade(0, TOP, Z + 0.058, 1.42, true); blade(0, TOP, Z - 0.058, 1.42, true);
    blade(0, BOT, Z + 0.058, 1.42, true); blade(0, BOT, Z - 0.058, 1.42, true);
    blade(-HW, CY, Z + 0.058, 2.3, false); blade(-HW, CY, Z - 0.058, 2.3, false);
    blade(HW, CY, Z + 0.058, 2.3, false); blade(HW, CY, Z - 0.058, 2.3, false);

    /* labio biselado interior (acero medio: quinto tono del metal) */
    addPlate(g, 1.34, 0.026, 0.03, P.steel, 0, TOP - 0.055, Z + 0.05);
    addPlate(g, 1.34, 0.026, 0.03, P.steel, 0, BOT + 0.055, Z + 0.05);
    addPlate(g, 0.026, 2.24, 0.03, P.steel, -HW + 0.055, CY, Z + 0.05);
    addPlate(g, 0.026, 2.24, 0.03, P.steel, HW - 0.055, CY, Z + 0.05);

    /* ornamentos de esquina: abanico de hojas, gema doble y aro */
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(function (d) {
      var cx = d[0] * HW, cy = d[1] > 0 ? TOP : BOT;
      var base = Math.atan2(d[1], d[0]);
      var leaves = qf < 0.5 ? [0] : [-0.45, 0, 0.45];
      leaves.forEach(function (a) {
        var leaf = V23C.box(0.15, 0.032, 0.034, P.edge,
          cx + Math.cos(base + a) * 0.1, cy + Math.sin(base + a) * 0.1 + (d[1] < 0 ? 0.07 : 0), Z - 0.005, metal);
        leaf.rotation.z = base + a;
        g.add(leaf);
      });
      var gemUp = V23C.cone(0.062, 0.1, 6, P.ice, cx, cy + 0.05, Z + 0.06, gemMat);
      var gemDn = V23C.cone(0.062, 0.1, 6, P.ice, cx, cy - 0.05, Z + 0.06, gemMat);
      gemDn.rotation.x = PI;
      g.add(gemUp); g.add(gemDn);
      g.add(V23C.torus(0.095, 0.011, P.polish, cx, cy, Z + 0.06, metalEdge));
      glows.push(addGlow(g, P.ice, 0.3, cx, cy, Z + 0.075, 0.45));
    });

    /* vetas de luz: tiras aditivas sobre los rails */
    var vein = { basic: true, transparent: true, opacity: 0.55, additive: true, depthWrite: false };
    g.add(V23C.plane(0.64, 0.022, P.ice, -0.35, TOP, Z + 0.072, vein));
    g.add(V23C.plane(0.64, 0.022, P.ice, 0.35, BOT, Z + 0.072, vein));
    g.add(V23C.plane(0.022, 0.82, P.ice, -HW, 0.82, Z + 0.072, vein));
    g.add(V23C.plane(0.022, 0.82, P.ice, HW, 1.84, Z + 0.072, vein));
    var diag = V23C.plane(0.34, 0.016, P.polish, -0.58, 2.24, Z + 0.072, vein);
    diag.rotation.z = -0.9; g.add(diag);
    var diag2 = V23C.plane(0.34, 0.016, P.polish, 0.58, 0.42, Z + 0.072, vein);
    diag2.rotation.z = -0.9; g.add(diag2);
    glows.push(addGlow(g, P.polish, 0.22, -0.35, TOP, Z + 0.08, 0.5));
    glows.push(addGlow(g, P.polish, 0.22, HW, 1.84, Z + 0.08, 0.5));

    /* corona pulida superior y cierre inferior con gema */
    addPlate(g, 0.3, 0.1, 0.11, P.core, 0, TOP + 0.05, Z, 0, metal);
    g.add(V23C.torus(0.075, 0.014, P.polish, 0, TOP + 0.135, Z + 0.012, metalEdge));
    g.add(V23C.cone(0.075, 0.16, 6, P.polish, 0, TOP + 0.2, Z, metalEdge));
    addPlate(g, 0.24, 0.09, 0.1, P.core, 0, BOT + 0.01, Z, 0, metal);
    addRivet(g, 0, BOT + 0.15, Z + 0.03, 0.05, P.ice, gemMat);

    V23C.addAnim(g, { type: 'frame', baseY: 0.0001, phase: 1.1, color: P.ice });
    if (glows.length) V23C.addAnim(g, { type: 'v23c-twinkle', stars: glows, baseOpacity: 0.5 });
    return g;
  }, 'Platino: doble filo pulido, abanicos con gema en las esquinas y vetas de luz.');

  /* ------------------------------------------------------------------ */
  /* MARCO DEL VACÍO · épico                                             */
  /* Silueta: interior negro elíptico, borde irregular con pinchos,      */
  /* anillos de energía contrarrotantes y partículas que caen al centro. */
  /* ------------------------------------------------------------------ */
  V23C.register('c-marco-vacio', function (c, qf) {
    var g = new THREE.Group();
    var Z = -0.68, CY = 1.36, RX = 0.76, RY = 1.19;
    var V = { hole: '#030206', deep: '#0a0416', ink: '#160c24', shade: '#241539', mid: '#4a2a78', glow: '#7a4bd0', lit: '#c49bff', pale: '#efe2ff' };
    var metal = { metalness: 0.35, roughness: 0.45 };
    var emissiveMid = { metalness: 0.3, roughness: 0.35, emissive: V.glow, emissiveIntensity: 1.5 };

    /* interior absorbente (opaco: el visor no lo dibuja delante del héroe) */
    var hole = V23C.circle(1, V.hole, 0, CY, Z - 0.06);
    hole.material = V23C.basic(V.hole, { side: THREE.DoubleSide });
    hole.scale.set(RX * 1.02, RY * 0.96, 1);
    g.add(hole);
    var deep = V23C.circle(1, V.deep, 0, CY, Z - 0.05);
    deep.material = V23C.basic(V.deep, { side: THREE.DoubleSide });
    deep.scale.set(RX * 0.8, RY * 0.78, 1);
    g.add(deep);

    /* borde irregular: segmentos con radio variable y pinchos hacia fuera */
    var segs = qc(16, qf);
    for (var i = 0; i < segs; i++) {
      var ang = (i / segs) * PI * 2;
      var jit = 0.9 + 0.16 * Math.sin(i * 2.39 + 0.7);
      var rx = RX * jit, ry = RY * jit;
      var seg = V23C.box(0.3, 0.075, 0.17, [V.ink, V.shade, V.mid, V.ink][i % 4],
        Math.cos(ang) * rx, CY + Math.sin(ang) * ry, Z + (i % 2 ? 0.02 : -0.02), metal);
      seg.rotation.z = ang + PI / 2;
      seg.rotation.y = Math.sin(i * 1.7) * 0.3;
      g.add(seg);
      if (i % 4 === 1 && Math.sin(ang) > -0.45) {
        var spike = V23C.cone(0.055, 0.2, 5, V.mid,
          Math.cos(ang) * (rx + 0.11), CY + Math.sin(ang) * (ry + 0.11), Z,
          { metalness: 0.5, roughness: 0.4, emissive: V.mid, emissiveIntensity: 0.4 });
        spike.rotation.z = Math.atan2(-Math.cos(ang), Math.sin(ang));
        g.add(spike);
      }
    }

    /* remates superior e inferior del portal: fijan el alto (≈2,5) en todas
       las calidades, porque el borde irregular depende del número de tramos */
    var crownVoid = V23C.cone(0.075, 0.36, 5, V.mid, 0, CY + RY * 0.92, Z,
      { metalness: 0.4, roughness: 0.45, emissive: V.mid, emissiveIntensity: 0.5 });
    g.add(crownVoid);
    var footVoid = V23C.cone(0.06, 0.28, 5, V.ink, 0, CY - RY * 0.925, Z, { metalness: 0.3, roughness: 0.5 });
    footVoid.rotation.x = PI;
    g.add(footVoid);

    /* anillo de energía principal + marcas que giran */
    var ringA = new THREE.Group();
    ringA.position.set(0, CY, Z + 0.01);
    ringA.add(V23C.torus(0.68, 0.03, V.glow, 0, 0, 0, emissiveMid));
    var marks = qc(6, qf);
    for (var k = 0; k < marks; k++) {
      var ka = (k / marks) * PI * 2;
      var mk = V23C.box(0.09, 0.028, 0.03, V.lit, Math.cos(ka) * 0.68, Math.sin(ka) * 0.68, 0.008,
        { metalness: 0.2, roughness: 0.3, emissive: V.lit, emissiveIntensity: 1.2 });
      mk.rotation.z = ka;
      ringA.add(mk);
    }
    g.add(ringA);

    /* segundo anillo (arcos que contrarrotan) */
    var ringB = new THREE.Group();
    ringB.position.set(0, CY, Z + 0.04);
    ringB.add(V23C.torus(0.84, 0.008, V.lit, 0, 0, 0, { transparent: true, opacity: 0.5, emissive: V.mid, emissiveIntensity: 0.8, depthWrite: false }));
    for (var b = 0; b < 3; b++) {
      var ba = (b / 3) * PI * 2;
      var arc = V23C.box(0.46, 0.022, 0.022, V.lit, Math.cos(ba) * 0.84, Math.sin(ba) * 0.84, 0,
        { transparent: true, opacity: 0.72, emissive: V.lit, emissiveIntensity: 1.1, depthWrite: false });
      arc.rotation.z = ba + PI / 2;
      ringB.add(arc);
    }
    g.add(ringB);

    /* filamentos oscuros dentro del portal (oclusión correcta) */
    var fil = qc(4, qf);
    for (var f = 0; f < fil; f++) {
      var fx = fil === 1 ? 0 : -0.45 + (0.9 * f) / (fil - 1);
      var fh = 1.05 + 0.5 * Math.sin(f * 1.9 + 1.2);
      var bar = V23C.box(0.026, fh, 0.02, V.shade, fx, CY, Z - 0.02,
        { emissive: V.mid, emissiveIntensity: 0.45, metalness: 0.2, roughness: 0.6 });
      bar.rotation.z = Math.sin(f * 2.1) * 0.16;
      g.add(bar);
    }

    /* núcleo oscuro con brillo violeta y motas */
    var core = addGlow(g, V.lit, 1.5, 0, CY, Z - 0.03, 0.3);
    for (var s = 0; s < 3; s++) {
      var sa = (s / 3) * PI * 2 + 0.6;
      addMesh(g, V23C.sphere(0.045, V.lit, Math.cos(sa) * 0.4, CY + Math.sin(sa) * 0.55, Z - 0.01,
        { emissive: V.lit, emissiveIntensity: 1.4, metalness: 0.25, roughness: 0.3 }));
    }

    /* partículas que van hacia dentro: cada una en un pivote girado para
       que su disolución local +Y avance hacia el centro del portal */
    var parts = [];
    var nPart = qc(10, qf);
    var R = 0.9;
    for (var p = 0; p < nPart; p++) {
      var pa = (p / nPart) * PI * 2 + 0.2;
      var pivot = new THREE.Group();
      pivot.position.set(0, CY, Z + 0.015);
      pivot.rotation.z = PI / 2 + pa;
      var mot = V23C.glow(V.lit, 0.1 + (p % 3) * 0.035, 0, -R, 0, 0.75);
      var off = ((p % 3) - 1) * 0.16;
      mot.position.set(off, -R, 0);
      mot.userData.baseX = off;
      mot.userData.baseY = -R;
      pivot.add(mot);
      g.add(pivot);
      parts.push(mot);
    }

    V23C.addAnim(g, { type: 'frame', baseY: 0.0001, phase: 2.4, color: V.glow });
    /* sin 'disc': el pulso de v23c-rays reescalaría el brillo del núcleo */
    V23C.addAnim(g, { type: 'v23c-rays', rays: ringA, speed: 0.35 });
    V23C.addAnim(g, { type: 'v23c-bands', ring: ringB });
    V23C.addAnim(g, { type: 'v23c-dissolve', parts: parts, rise: R, opacity: 0.9 });
    return g;
  }, 'Vacío: portal negro elíptico, borde irregular, anillos contrarrotantes y partículas absorbidas.');

  /* ------------------------------------------------------------------ */
  /* MARCO DE CONSTELACIÓN · legendario                                  */
  /* Silueta: marco de vitrina de cuatro lados (y 0,12–2,54; centro 1,33)  */
  /* con moldura interior, anclas de brújula en las esquinas y cristal de  */
  /* crestería; dentro, el dial estelar graduado con su alidada y          */
  /* estrellas orbitando en anillos concéntricos (z ≤ −0,94).              */
  /* ------------------------------------------------------------------ */
  V23C.register('c-marco-constelacion', function (c, qf) {
    var g = new THREE.Group();
    var Z = -0.68, CY = 1.34, RING = 0.92, HW = 1.18, TOP = 2.54, BOT = 0.12;
    var K = { gold: '#e4c07a', pale: '#f6e6b8', deep: '#3a2f4d', night: '#1c2b4a', star: '#ffffff', ice: '#cfeeff', blue: '#8fb6ff' };
    var metal = { metalness: 0.68, roughness: 0.28 };
    var orbitStars = [];
    var dust = [];

    /* aro graduado: dos círculos, marcas radiales y alidada */
    var dial = new THREE.Group();
    dial.position.set(0, CY, Z);
    dial.add(V23C.torus(RING, 0.026, K.gold, 0, 0, 0, metal));
    dial.add(V23C.torus(RING - 0.12, 0.009, '#9c7b45', 0, 0, 0, metal));
    dial.add(V23C.torus(RING + 0.055, 0.008, '#b9974f', 0, 0, 0, metal));
    addTicks(dial, RING - 0.06, qc(18, qf), 0.1, 0.055, K.gold, K.pale, 0.005, metal);
    dial.add(V23C.box(RING * 2 - 0.18, 0.016, 0.02, K.pale, 0, 0, 0.004, metal));
    dial.add(V23C.sphere(0.03, K.pale, RING - 0.1, 0, 0.006, { emissive: K.pale, emissiveIntensity: 0.7, metalness: 0.5, roughness: 0.3 }));
    dial.add(V23C.sphere(0.03, K.pale, -(RING - 0.1), 0, 0.006, { emissive: K.pale, emissiveIntensity: 0.7, metalness: 0.5, roughness: 0.3 }));
    g.add(dial);

    /* marco de vitrina: cuatro lados con moldura interior, anclas de
       brújula en las esquinas y cristal de crestería */
    var midY = (TOP + BOT) / 2;
    addRail(g, -HW, midY, Z, TOP - BOT, false, 0.046, K.gold, metal);
    addRail(g, HW, midY, Z, TOP - BOT, false, 0.046, K.gold, metal);
    addRail(g, 0, TOP, Z, HW * 2, true, 0.046, K.gold, metal);
    addRail(g, 0, BOT, Z, HW * 2, true, 0.046, K.gold, metal);
    addRail(g, -HW + 0.085, midY, Z - 0.02, TOP - BOT - 0.2, false, 0.014, K.pale, metal);
    addRail(g, HW - 0.085, midY, Z - 0.02, TOP - BOT - 0.2, false, 0.014, K.pale, metal);
    addRail(g, 0, TOP - 0.085, Z - 0.02, HW * 2 - 0.22, true, 0.014, K.pale, metal);
    addRail(g, 0, BOT + 0.085, Z - 0.02, HW * 2 - 0.22, true, 0.014, K.pale, metal);
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(function (d) {
      var cx = d[0] * HW, cy = d[1] > 0 ? TOP : BOT;
      /* arriba en diagonal; abajo en horizontal, para no bajar del suelo */
      var base = d[1] > 0 ? Math.atan2(d[1], d[0]) : (d[0] > 0 ? 0 : PI);
      g.add(V23C.torus(0.085, 0.012, K.gold, cx, cy, Z + 0.012, metal));
      g.add(V23C.sphere(0.042, K.pale, cx, cy, Z + 0.026,
        { emissive: K.pale, emissiveIntensity: 0.9, metalness: 0.5, roughness: 0.3 }));
      [-0.5, 0.5].forEach(function (a) {
        var ray = V23C.box(0.13, 0.016, 0.016, K.gold,
          cx + Math.cos(base + a) * 0.1, cy + Math.sin(base + a) * 0.1, Z + 0.005, metal);
        ray.rotation.z = base + a;
        g.add(ray);
      });
    });
    var crest = new THREE.Group();
    crest.position.set(0, TOP + 0.01, Z);
    var crA = V23C.cone(0.06, 0.07, 6, K.ice, 0, 0.035, 0,
      { emissive: K.blue, emissiveIntensity: 1, metalness: 0.3, roughness: 0.2 });
    var crB = V23C.cone(0.06, 0.07, 6, K.ice, 0, -0.035, 0,
      { emissive: K.blue, emissiveIntensity: 1, metalness: 0.3, roughness: 0.2 });
    crB.rotation.x = PI;
    crest.add(crA); crest.add(crB);
    crest.add(V23C.torus(0.085, 0.01, K.gold, 0, 0, 0, metal));
    g.add(crest);

    /* líneas de constelación: dos trazos finos emisivos dentro del dial */
    g.add(V23C.line([
      v3(-0.7, CY + 0.56, Z - 0.012), v3(-0.42, CY + 0.72, Z - 0.012), v3(-0.1, CY + 0.58, Z - 0.012),
      v3(0.18, CY + 0.74, Z - 0.012), v3(0.5, CY + 0.6, Z - 0.012), v3(0.72, CY + 0.44, Z - 0.012)
    ], K.pale, 0.5));
    g.add(V23C.line([
      v3(-0.74, CY - 0.4, Z - 0.012), v3(-0.5, CY - 0.54, Z - 0.012), v3(-0.26, CY - 0.4, Z - 0.012),
      v3(-0.04, CY - 0.56, Z - 0.012), v3(0.22, CY - 0.42, Z - 0.012)
    ], K.blue, 0.42));

    /* estrellas orbitando: anillos en el plano del marco, retrasados por
       detrás del plano del encaje (z ≤ −0,90) para no penetrar el cuerpo.
       Giran sobre su normal (rotation.z) en vez de barrer en profundidad:
       cada estrella recorre una circunferencia con z casi constante. */
    var orbits = qf > 0.55 ? 3 : 2;
    var orbitRings = [];
    for (var o = 0; o < orbits; o++) {
      var orb = new THREE.Group();
      orb.position.set(0, CY, -0.98 - o * 0.02);
      var rad = 1.13 - o * 0.06;
      var tilt = (o % 2 ? -1 : 1) * (0.03 + o * 0.01);
      var tilted = new THREE.Group();
      tilted.rotation.x = tilt;
      tilted.add(V23C.torus(rad, 0.006, '#8a6f3d', 0, 0, 0, metal));
      var stars = 2 + (o % 2);
      for (var s = 0; s < stars; s++) {
        var sa = (s / stars) * PI * 2 + o * 0.7;
        var sx = Math.cos(sa) * rad, sy = Math.sin(sa) * rad;
        tilted.add(V23C.sphere(0.028, K.star, sx, sy, 0,
          { emissive: K.pale, emissiveIntensity: 1.1, metalness: 0.1, roughness: 0.4 }));
        orbitStars.push(addMesh(tilted, V23C.glow(K.pale, 0.17, sx, sy, 0, 0.6)));
      }
      orb.add(tilted);
      g.add(orb);
      orbitRings.push(orb);
    }

    /* cristal central con anillo propio */
    var crystal = new THREE.Group();
    crystal.position.set(0, CY, Z - 0.01);
    var cA = V23C.cone(0.11, 0.26, 6, K.ice, 0, 0.13, 0, { emissive: K.blue, emissiveIntensity: 0.9, metalness: 0.3, roughness: 0.2 });
    var cB = V23C.cone(0.11, 0.26, 6, K.ice, 0, -0.13, 0, { emissive: K.blue, emissiveIntensity: 0.9, metalness: 0.3, roughness: 0.2 });
    cB.rotation.x = PI;
    crystal.add(cA); crystal.add(cB);
    var crystalRing = new THREE.Group();
    crystalRing.add(V23C.torus(0.21, 0.014, K.gold, 0, 0, 0, metal));
    for (var r = 0; r < 3; r++) {
      var ra = (r / 3) * PI * 2;
      crystalRing.add(V23C.sphere(0.022, K.pale, Math.cos(ra) * 0.21, Math.sin(ra) * 0.21, 0,
        { emissive: K.pale, emissiveIntensity: 1.1 }));
    }
    crystal.add(crystalRing);
    var crystalGlow = addGlow(crystal, K.ice, 1.0, 0, 0, 0.02, 0.35);
    g.add(crystal);

    /* remates superior e inferior */
    var topStar = new THREE.Group();
    topStar.position.set(0, CY + RING, Z);
    topStar.add(V23C.sphere(0.05, K.pale, 0, 0, 0, { emissive: K.gold, emissiveIntensity: 1.2, metalness: 0.4, roughness: 0.3 }));
    for (var t = 0; t < 4; t++) {
      var ray = V23C.box(0.16, 0.018, 0.018, K.gold, Math.cos(t * PI / 2) * 0.09, Math.sin(t * PI / 2) * 0.09, 0, metal);
      ray.rotation.z = t * PI / 2;
      topStar.add(ray);
    }
    g.add(topStar);
    var pendant = V23C.cone(0.07, 0.18, 6, K.gold, 0, CY - RING + 0.04, Z, metal);
    pendant.rotation.x = PI;
    g.add(pendant);

    /* anclas laterales del aro: refuerzan la lectura de marco completo */
    [-1, 1].forEach(function (s) {
      g.add(V23C.torus(0.075, 0.012, K.gold, s * RING, CY, Z, metal));
      g.add(V23C.sphere(0.05, K.pale, s * RING, CY, Z + 0.01,
        { emissive: K.pale, emissiveIntensity: 0.85, metalness: 0.5, roughness: 0.3 }));
    });

    /* polvo de estrellas que se desprende del mapa */
    var nDust = qc(8, qf);
    for (var d = 0; d < nDust; d++) {
      var da = (d / nDust) * PI * 2;
      var dr = 0.45 + (d % 3) * 0.14;
      var spec = V23C.glow(K.pale, 0.09, Math.cos(da) * dr, CY + Math.sin(da) * dr, Z + 0.02, 0.5);
      spec.userData.baseX = Math.cos(da) * dr;
      spec.userData.baseY = CY + Math.sin(da) * dr;
      g.add(spec);
      dust.push(spec);
    }

    V23C.addAnim(g, { type: 'frame', baseY: 0.0001, phase: 0.8, color: K.gold });
    V23C.addAnim(g, { type: 'v23c-rays', rays: dial, disc: crystalGlow, speed: 0.09 });
    orbitRings.forEach(function (orb, i) {
      V23C.addAnim(g, { type: 'v23c-rays', rays: orb, speed: i % 2 ? -0.13 - i * 0.02 : 0.16 + i * 0.02 });
    });
    V23C.addAnim(g, { type: 'v23c-bands', ring: crystalRing });
    V23C.addAnim(g, { type: 'v23c-twinkle', stars: orbitStars, baseOpacity: 0.5 });
    V23C.addAnim(g, { type: 'v23c-dissolve', parts: dust, rise: 0.55, opacity: 0.5 });
    return g;
  }, 'Constelación: aro graduado con alidada, tres órbitas de estrellas, líneas y cristal.');

  /* ------------------------------------------------------------------ */
  /* LUCIÉRNAGA DEL OBSERVATORIO · raro                                  */
  /* Silueta: abdomen luminoso segmentado, tórax y cabeza oscura,         */
  /* antenas con punta de luz y alas translúcidas que baten.              */
  /* ------------------------------------------------------------------ */
  V23C.register('x-luciernaga-observatorio', function (c, qf) {
    var g = new THREE.Group();
    var stage = stageOf(c);
    var TEAL = '#69d3c1', MINT = '#bff7e8', GOLD = '#e4c07a';
    var dark = '#16302a', shell = '#21362f', shell2 = '#2c4a40';
    var glows = [], wings = [];

    /* abdomen luminoso con anillos segmentados */
    var abd = V23C.sphere(0.13, shell, 0, -0.1, -0.02, { emissive: TEAL, emissiveIntensity: 0.35, roughness: 0.45, metalness: 0.15 });
    abd.scale.set(1, 1.18, 1.02);
    g.add(abd);
    for (var i = 0; i < 3; i++) {
      var seg = V23C.torus(0.115 - i * 0.012, 0.009, TEAL, 0, -0.045 - i * 0.075, -0.02,
        { emissive: TEAL, emissiveIntensity: 1.3, metalness: 0.2, roughness: 0.35 });
      seg.rotation.x = PI / 2;
      g.add(seg);
    }

    /* tórax y cabeza */
    var th = V23C.sphere(0.095, shell2, 0, 0.06, -0.01, { metalness: 0.25, roughness: 0.4 });
    th.scale.set(1, 0.95, 1);
    g.add(th);
    g.add(V23C.sphere(0.072, dark, 0, 0.17, 0.02, { metalness: 0.3, roughness: 0.35 }));

    /* ojos, antenas con punta de luz y patas */
    [-1, 1].forEach(function (s) {
      g.add(V23C.sphere(0.03, MINT, s * 0.045, 0.18, 0.072, { emissive: MINT, emissiveIntensity: 1.1, roughness: 0.3 }));
      var ant = V23C.cyl(0.007, 0.007, 0.14, 5, shell2, s * 0.035, 0.27, 0.055, { roughness: 0.5 });
      ant.rotation.z = -s * 0.28;
      ant.rotation.x = -0.25;
      g.add(ant);
      g.add(V23C.sphere(0.016, MINT, s * 0.055, 0.335, 0.075, { emissive: MINT, emissiveIntensity: 1.4, roughness: 0.3 }));
      [-1, 1].forEach(function (z) {
        var leg = V23C.cyl(0.008, 0.008, 0.12, 4, dark, s * 0.08, -0.19, z * 0.03, { roughness: 0.5 });
        leg.rotation.z = -s * 0.5;
        leg.rotation.x = z * 0.25;
        g.add(leg);
      });
    });

    /* alas: uno o dos pares según la etapa, con vena luminosa */
    var pairs = stage >= 2 ? 2 : 1;
    [-1, 1].forEach(function (s) {
      var wg = new THREE.Group();
      wg.position.set(s * 0.04, 0.075, -0.01);
      wg.userData.flapSide = s;
      for (var p = 0; p < pairs; p++) {
        var wing = V23C.circle(0.13, MINT, s * (0.05 + p * 0.012), 0.02 + p * 0.05, -0.02 - p * 0.03,
          { transparent: true, opacity: 0.3 - p * 0.07, depthWrite: false, side: THREE.DoubleSide });
        wing.scale.set(1, 0.56, 1);
        wing.rotation.z = s * (0.32 + p * 0.18);
        wing.rotation.y = -s * 0.42;
        wg.add(wing);
        var vein = V23C.box(0.12, 0.012, 0.008, MINT, s * 0.04, 0.02 + p * 0.05, -0.028 - p * 0.03,
          { transparent: true, opacity: 0.5, depthWrite: false, emissive: MINT, emissiveIntensity: 0.5 });
        vein.rotation.z = s * (0.32 + p * 0.18);
        wg.add(vein);
      }
      g.add(wg);
      wings.push(wg);
    });

    /* brillo del abdomen y de la cabeza */
    glows.push(addGlow(g, TEAL, 0.32 + stage * 0.06, 0, -0.12, 0.015, 0.55));
    glows.push(addGlow(g, MINT, 0.15, 0, 0.3, 0.05, 0.5));

    /* etapa 3: corona orbital dorada */
    if (stage >= 3) {
      var halo = V23C.torus(0.16, 0.008, GOLD, 0, 0.1, -0.04, { emissive: GOLD, emissiveIntensity: 0.8, metalness: 0.6, roughness: 0.3 });
      halo.rotation.x = 0.6;
      halo.rotation.z = 0.2;
      g.add(halo);
      g.add(V23C.sphere(0.026, GOLD, 0.17, 0.18, 0.06, { emissive: GOLD, emissiveIntensity: 1.2, roughness: 0.3 }));
      g.add(V23C.sphere(0.02, GOLD, -0.19, 0.05, -0.1, { emissive: GOLD, emissiveIntensity: 1.2, roughness: 0.3 }));
      glows.push(addGlow(g, GOLD, 0.2, -0.18, 0.22, 0.02, 0.5));
    }

    /* estela: motas que retroceden y se apagan */
    var trailPivot = new THREE.Group();
    trailPivot.position.set(0, -0.08, -0.03);
    trailPivot.rotation.x = -PI / 2;
    g.add(trailPivot);
    var trail = [];
    var nTrail = 3 + stage + (qf > 1 ? 2 : 0);
    for (var t2 = 0; t2 < nTrail; t2++) {
      var mot = V23C.glow(TEAL, 0.08 + (t2 % 3) * 0.03, ((t2 % 3) - 1) * 0.07, 0.06 + t2 * 0.05, 0, 0.55);
      mot.userData.baseX = ((t2 % 3) - 1) * 0.07;
      mot.userData.baseY = 0.06 + t2 * 0.05;
      trailPivot.add(mot);
      trail.push(mot);
    }

    fitPetArt(g, 1.05);
    /* Reposo del grupo en la misma posición que usa el animador: las
       miniaturas (que no animan) también muestran la mascota al lado. */
    g.position.set(-0.64, 1.42, 0.14);
    g.scale.setScalar(1.4 + (stage - 1) * 0.13);
    V23C.addAnim(g, { type: 'pet', baseY: 1.42, baseX: -0.64, baseZ: 0.14, phase: 0.25, orbit: 0.2, speed: 0.72, glowColor: TEAL });
    V23C.addAnim(g, { type: 'v23c4-flap', wings: wings, speed: 9 + stage * 1.5, amplitude: 0.38, phase: 0.4 });
    V23C.addAnim(g, { type: 'v23c-twinkle', stars: glows, baseOpacity: 0.6 });
    V23C.addAnim(g, { type: 'v23c-dissolve', parts: trail, rise: 0.5, opacity: 0.55 });
    return g;
  }, 'Luciérnaga: abdomen segmentado luminoso, alas translúcidas que baten y estela de motas.');

  /* ------------------------------------------------------------------ */
  /* BÚHO COMETA · épico                                                 */
  /* Silueta: búho con disco facial, ojos grandes, pico, penachos, alas    */
  /* desplegadas y cola de cometa con estela.                             */
  /* ------------------------------------------------------------------ */
  V23C.register('x-buho-cometa', function (c, qf) {
    var g = new THREE.Group();
    var stage = stageOf(c);
    var BODY = '#3a5175', BLUE = '#587cad', DEEP = '#2a3a53', LIGHT = '#8fa9cc', GOLD = '#e4c07a', PALE = '#f5f9ff', BEAK = '#e8b567';
    var glows = [], wings = [];

    /* cuerpo y pecho claro */
    var body = V23C.sphere(0.15, BODY, 0, 0.02, -0.01, { roughness: 0.5, metalness: 0.12 });
    body.scale.set(1.02, 1.24, 0.95);
    g.add(body);
    var chest = V23C.sphere(0.1, LIGHT, 0, 0, 0.095, { roughness: 0.55 });
    chest.scale.set(1, 1.15, 0.55);
    g.add(chest);

    /* cabeza, disco facial, ojos grandes y pico */
    g.add(V23C.sphere(0.125, '#4a6fa4', 0, 0.245, 0.02, { roughness: 0.45 }));
    [-1, 1].forEach(function (s) {
      g.add(V23C.circle(0.075, '#dfe8f6', s * 0.055, 0.255, 0.145, { roughness: 0.5 }));
      g.add(V23C.sphere(0.046, PALE, s * 0.055, 0.255, 0.165, { emissive: '#eaf3ff', emissiveIntensity: 0.25, roughness: 0.3 }));
      g.add(V23C.sphere(0.024, '#101722', s * 0.055, 0.255, 0.2, { roughness: 0.2, metalness: 0.1 }));
      glows.push(addGlow(g, '#dff0ff', 0.085, s * 0.055, 0.255, 0.212, 0.6));
      var tuft = V23C.cone(0.045, 0.14, 5, DEEP, s * 0.088, 0.35, 0.01, { roughness: 0.5 });
      tuft.rotation.z = -s * 0.34;
      g.add(tuft);
    });
    var beak = V23C.cone(0.036, 0.095, 5, BEAK, 0, 0.185, 0.185, { roughness: 0.45, metalness: 0.2 });
    beak.rotation.x = PI / 2;
    g.add(beak);

    /* patas con garras */
    [-1, 1].forEach(function (s) {
      g.add(V23C.cyl(0.017, 0.017, 0.1, 5, BEAK, s * 0.055, -0.185, 0.03, { roughness: 0.5 }));
      var claw = V23C.cone(0.032, 0.06, 5, BEAK, s * 0.055, -0.24, 0.045, { roughness: 0.5 });
      claw.rotation.x = PI / 2;
      g.add(claw);
    });

    /* alas desplegadas con plumas por capas y punta de luz */
    var featherLen = stage >= 3 ? 3 : 2;
    [-1, 1].forEach(function (s) {
      var wg = new THREE.Group();
      wg.position.set(s * 0.085, 0.09, -0.02);
      wg.userData.flapSide = s;
      /* alas desplegadas pero barridas hacia atrás: no invaden al héroe */
      wg.userData.restY = -s * 0.38;
      wg.rotation.y = -s * 0.38;
      for (var f = 0; f < featherLen; f++) {
        var len = (0.2 - f * 0.038) * (stage >= 2 ? 1.14 : 0.92);
        var feather = V23C.box(len, 0.044 - f * 0.006, 0.14 - f * 0.018, f === 0 ? '#455e83' : BLUE,
          s * (len * 0.45), 0.02 - f * 0.05, -f * 0.014, { roughness: 0.5 });
        feather.rotation.z = -s * (0.06 + f * 0.12);
        wg.add(feather);
      }
      var tip = V23C.cone(0.026, 0.075, 5, GOLD, s * 0.22, -0.055, 0, { emissive: GOLD, emissiveIntensity: 0.7, roughness: 0.35 });
      tip.rotation.z = -s * (PI / 2);
      wg.add(tip);
      g.add(wg);
      wings.push(wg);
    });

    /* cola de cometa: plumas cónicas hacia atrás */
    var tailN = 3 + stage;
    for (var t = 0; t < tailN; t++) {
      var spread = (t / Math.max(1, tailN - 1) - 0.5) * 0.9;
      var tl = (0.28 + (t % 2) * 0.1) * (stage >= 2 ? 1.12 : 0.9);
      var plume = V23C.cone(0.042, tl, 5, t % 3 === 0 ? GOLD : BLUE,
        Math.sin(spread) * 0.13, 0.02 + Math.cos(spread) * 0.02, -0.16 - tl * 0.4,
        t % 3 === 0
          ? { emissive: GOLD, emissiveIntensity: 0.55, roughness: 0.4 }
          : { roughness: 0.5 });
      plume.rotation.x = -PI / 2 - spread * 0.35;
      plume.rotation.z = spread * 0.6;
      g.add(plume);
    }

    /* estela de cometa: motas que retroceden (pivote girado) */
    var trailPivot = new THREE.Group();
    trailPivot.position.set(0, 0.02, -0.18);
    trailPivot.rotation.x = -PI / 2;
    g.add(trailPivot);
    var trail = [];
    var nTrail = 4 + stage * 2;
    for (var p = 0; p < nTrail; p++) {
      var mot = V23C.glow(p % 3 === 0 ? GOLD : '#a9c8f0', 0.085 + (p % 3) * 0.03,
        ((p % 4) - 1.5) * 0.06, 0.05 + p * 0.045, 0, 0.6);
      mot.userData.baseX = ((p % 4) - 1.5) * 0.06;
      mot.userData.baseY = 0.05 + p * 0.045;
      trailPivot.add(mot);
      trail.push(mot);
    }

    /* etapa 3: corona estelar */
    if (stage >= 3) {
      var crown = V23C.torus(0.12, 0.012, GOLD, 0, 0.39, 0.02, { emissive: GOLD, emissiveIntensity: 0.9, metalness: 0.7, roughness: 0.3 });
      crown.rotation.x = 1.15;
      g.add(crown);
      g.add(V23C.sphere(0.028, '#dff0ff', 0, 0.4, 0.055, { emissive: '#dff0ff', emissiveIntensity: 1.2, roughness: 0.3 }));
      glows.push(addGlow(g, GOLD, 0.18, 0.08, 0.4, 0.03, 0.5));
    }

    fitPetArt(g, 0.7);
    /* Reposo del grupo en la misma posición que usa el animador. */
    g.position.set(-0.64, 1.42, 0.16);
    g.scale.setScalar(1.34 + (stage - 1) * 0.15);
    V23C.addAnim(g, { type: 'pet', baseY: 1.42, baseX: -0.64, baseZ: 0.16, phase: 1.4, orbit: 0.23, speed: 0.55, glowColor: '#7aa2ff' });
    V23C.addAnim(g, { type: 'v23c4-flap', wings: wings, speed: 6.5, amplitude: 0.34, phase: 0.6 });
    V23C.addAnim(g, { type: 'v23c-dissolve', parts: trail, rise: 0.45, opacity: 0.6 });
    V23C.addAnim(g, { type: 'v23c-twinkle', stars: glows, baseOpacity: 0.55 });
    return g;
  }, 'Búho cometa: disco facial, ojos grandes, alas desplegadas que baten, cola y estela de cometa.');

  /* ------------------------------------------------------------------ */
  /* ZORRO DE TINTA · épico                                              */
  /* Silueta: zorro oscuro con orejas, hocico, cola amplia en curva,      */
  /* manchas de tinta y pincelada con estela.                             */
  /* ------------------------------------------------------------------ */
  V23C.register('x-zorro-tinta', function (c, qf) {
    var g = new THREE.Group();
    var stage = stageOf(c);
    var INK = '#241d31', BODY = '#3a3148', FUR = '#4a3d5c', LIGHT = '#6a5b7a', BONE = '#d8c7a0', VIOLET = '#c49bff', GOLD = '#e4c07a';
    var glows = [];

    /* cuerpo, pecho y patas (más ancho y largo: se lee como zorro) */
    var body = V23C.sphere(0.165, BODY, 0, 0.02, -0.02, { roughness: 0.55, metalness: 0.1 });
    body.scale.set(1.18, 1, 1.42);
    g.add(body);
    var chest = V23C.sphere(0.105, LIGHT, 0, 0, 0.13, { roughness: 0.6 });
    chest.scale.set(1, 1.1, 0.52);
    g.add(chest);
    [-1, 1].forEach(function (s) {
      [-1, 1].forEach(function (z) {
        g.add(V23C.cyl(0.024, 0.02, 0.12, 5, INK, s * 0.092, -0.16, z * 0.088, { roughness: 0.6 }));
        var paw = V23C.sphere(0.032, INK, s * 0.092, -0.215, z * 0.088 + 0.012, { roughness: 0.7 });
        paw.scale.set(1, 0.7, 1.2);
        g.add(paw);
      });
    });

    /* cabeza, hocico, orejas y ojos */
    var head = V23C.sphere(0.135, FUR, 0, 0.2, 0.13, { roughness: 0.5 });
    head.scale.set(1.12, 1, 1.04);
    g.add(head);
    var snout = V23C.cone(0.06, 0.19, 6, LIGHT, 0, 0.165, 0.27, { roughness: 0.55 });
    snout.rotation.x = PI / 2;
    g.add(snout);
    g.add(V23C.sphere(0.026, INK, 0, 0.165, 0.365, { roughness: 0.3 }));
    [-1, 1].forEach(function (s) {
      var ear = V23C.cone(0.058, 0.17, 4, INK, s * 0.105, 0.3, 0.115, { roughness: 0.55 });
      ear.rotation.z = -s * 0.22;
      g.add(ear);
      var inner = V23C.cone(0.031, 0.1, 4, LIGHT, s * 0.102, 0.29, 0.135, { roughness: 0.6 });
      inner.rotation.z = -s * 0.22;
      g.add(inner);
      g.add(V23C.sphere(0.029, BONE, s * 0.063, 0.215, 0.235, { emissive: '#efe6d6', emissiveIntensity: 0.35, roughness: 0.35 }));
      g.add(V23C.sphere(0.014, '#0d0a12', s * 0.063, 0.215, 0.258, { roughness: 0.3 }));
    });

    /* cola amplia en curva (grupo animable) */
    var tail = new THREE.Group();
    tail.position.set(0, 0.03, -0.2);
    tail.userData.restRotY = 0;
    var segs = stage >= 2 ? 4 : 3;
    for (var i = 0; i < segs; i++) {
      var r = 0.135 - i * 0.022;
      var ts = V23C.sphere(r, i === segs - 1 ? BONE : FUR, 0, 0.03 + i * 0.055, -0.11 - i * 0.105, { roughness: 0.55 });
      ts.scale.set(1.18, 1.05, 1.45 + i * 0.06);
      tail.add(ts);
    }
    if (stage >= 2) glows.push(addMesh(tail, V23C.glow(VIOLET, 0.18, 0, 0.18, -0.44, 0.5)));
    g.add(tail);

    /* manchas de tinta sobre el cuerpo */
    [[-0.115, 0.05, 0.115, 0.046], [0.098, 0.05, 0.11, 0.042], [-0.063, 0.115, -0.1, 0.052], [0.104, -0.02, -0.055, 0.036]].forEach(function (s) {
      var spot = V23C.sphere(s[3], INK, s[0], s[1], s[2], { roughness: 0.4, metalness: 0.15 });
      spot.scale.set(1.25, 1.25, 0.5);
      g.add(spot);
    });

    /* etapas: tinta viva y accesorio dorado */
    if (stage >= 2) {
      g.add(V23C.sphere(0.032, VIOLET, 0, 0.09, 0.19, { emissive: VIOLET, emissiveIntensity: 1.1, roughness: 0.4 }));
      glows.push(addGlow(g, VIOLET, 0.16, 0, 0.09, 0.21, 0.5));
    }
    if (stage >= 3) {
      var collar = V23C.torus(0.075, 0.011, GOLD, 0, 0.12, 0.16, { emissive: GOLD, emissiveIntensity: 0.55, metalness: 0.7, roughness: 0.3 });
      collar.rotation.x = PI / 2 - 0.2;
      g.add(collar);
      g.add(V23C.sphere(0.028, GOLD, 0, 0.052, 0.21, { emissive: GOLD, emissiveIntensity: 0.9, roughness: 0.3 }));
      glows.push(addGlow(g, GOLD, 0.15, 0, 0.052, 0.22, 0.45));
    }

    /* pincelada y estela de tinta */
    g.add(V23C.line([
      v3(-0.11, 0.02, -0.44), v3(-0.03, 0.07, -0.6), v3(0.07, 0.03, -0.78)
    ], VIOLET, 0.4));
    var trailPivot = new THREE.Group();
    trailPivot.position.set(0, 0.05, -0.31);
    trailPivot.rotation.x = -PI / 2;
    g.add(trailPivot);
    var trail = [];
    var nTrail = 4 + stage * 2;
    for (var p = 0; p < nTrail; p++) {
      var mot = V23C.glow(p % 2 ? VIOLET : '#7a63a8', 0.075 + (p % 3) * 0.028,
        ((p % 4) - 1.5) * 0.07, 0.04 + p * 0.05, 0, 0.55);
      mot.userData.baseX = ((p % 4) - 1.5) * 0.07;
      mot.userData.baseY = 0.04 + p * 0.05;
      trailPivot.add(mot);
      trail.push(mot);
    }

    fitPetArt(g, 0.78);
    /* Reposo del grupo en la misma posición que usa el animador. */
    g.position.set(-0.64, 1.4, 0.14);
    g.scale.setScalar(1.32 + (stage - 1) * 0.16);
    V23C.addAnim(g, { type: 'pet', baseY: 1.4, baseX: -0.64, baseZ: 0.14, phase: 2.2, orbit: 0.26, speed: 0.5, glowColor: VIOLET });
    V23C.addAnim(g, { type: 'v23c4-tail', tail: [tail], speed: 2.0, amplitude: 0.26, phase: 0.9 });
    V23C.addAnim(g, { type: 'v23c-dissolve', parts: trail, rise: 0.42, opacity: 0.55 });
    V23C.addAnim(g, { type: 'v23c-twinkle', stars: glows, baseOpacity: 0.5 });
    return g;
  }, 'Zorro de tinta: orejas y hocico, cola amplia que se mece, manchas y estela de pincelada.');

  /* ------------------------------------------------------------------ */
  /* Sub-animaciones propias (alas y cola)                               */
  /* Mueven subgrupos referenciados por el spec; nunca la pieza entera.  */
  /* ------------------------------------------------------------------ */
  var SUB_ANIM = {
    'v23c4-flap': function (a, time) {
      var amp = a.amplitude == null ? 0.4 : a.amplitude;
      var sp = a.speed == null ? 7 : a.speed;
      var ph = a.phase || 0;
      (a.wings || []).forEach(function (w) {
        var side = w.userData.flapSide || 1;
        w.rotation.z = (w.userData.restZ || 0) + side * Math.sin(time * sp + ph) * amp;
        w.rotation.y = (w.userData.restY || 0) + Math.cos(time * sp * 0.5 + ph) * 0.12 * side;
      });
    },
    'v23c4-tail': function (a, time) {
      var ph = a.phase || 0;
      var amp = a.amplitude == null ? 0.24 : a.amplitude;
      (a.tail || []).forEach(function (t, i) {
        t.rotation.y = (t.userData.restRotY || 0) + Math.sin(time * (a.speed || 2.1) + ph + i * 0.6) * amp;
        t.rotation.z = Math.cos(time * 1.5 + ph + i) * 0.07;
      });
    }
  };
  (function hookSubAnim() {
    if (V23C.__v23dHooked || typeof V23C.update !== 'function') return;
    V23C.__v23dHooked = true;
    var baseUpdate = V23C.update;
    V23C.update = function (av, dt, time, running, speedNorm) {
      baseUpdate.call(V23C, av, dt, time, running, speedNorm);
      var list = av && av.cosmetics && av.cosmetics.animated;
      if (!list) return;
      for (var i = 0; i < list.length; i++) {
        var a = list[i];
        var fn = SUB_ANIM[a.type];
        if (fn && a.group) {
          try { fn(a, time, dt, running); } catch (e) {}
        }
      }
    };
  })();
})();
