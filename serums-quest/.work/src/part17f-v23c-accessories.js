/* =========================================================================
   V2.3 · FASE 2 · AGENTE 6 · ACCESORIOS, AMULETOS Y TOCADOS
   -------------------------------------------------------------------------
   25 piezas registradas en V23C:
     accesorios   gafas (cabeza), brújula (muñeca), bolso y pluma (cadera)
     amuletos     enfoque, sello, nudo y criterio (pecho)
     extras       reloj de arena, cuaderno orbital y cinco trofeos
     cabeza       tocados de dominio (5 rutas) y sus versiones doradas

   Convenciones respetadas: nada de cajas lisas (cilindros, conos, esferas,
   toros, planos y cajas sólo como placas con remaches), ES5, sin texturas ni
   imágenes externas, sin DOM. Las piezas comunes no emiten ni animan; las
   raras emiten y animan; las épicas tienen dos o más elementos animados; las
   doradas añaden órbitas y partículas propias.

   Animos: se declaran con V23C.addAnim y se resuelven en este mismo archivo
   con los tipos ax-* (ver axApplyList). El cuaderno y los trofeos usan la
   órbita histórica (part11 mide su radio y recoloca la pieza), así que su
   detalle se anima con group.userData.axTick para no duplicar desplazamientos.
   ========================================================================= */
(function () {
  var V = window.V23C;
  if (!V || typeof V.register !== 'function') return;

  var P = {
    brass: '#b9874f', brassD: '#7d5731', bronze: '#94683a', gold: '#e4c07a',
    goldL: '#f8e6b4', goldD: '#b28a4c', ink: '#19212e', ink2: '#2b3648',
    steel: '#8e9bb0', silver: '#d9e2ef', leather: '#6b4a2d', leatherD: '#3e2b1c',
    leatherL: '#96693f', paper: '#efe7d4', paperD: '#c9bca2', bone: '#f2f0ea',
    teal: '#69d3c1', tealL: '#d9fff8', blue: '#7aa2ff', blueL: '#dce9ff',
    violet: '#c49bff', violetL: '#f0e2ff', lime: '#b8d46a', limeL: '#f0ffcf',
    amber: '#f3b562', amberL: '#ffe6b8', rose: '#ff8b9d', glass: '#a9dcf2',
    cord: '#cbb79b', mauve: '#b4a09d', plum: '#8f7d84', wax: '#c4655a'
  };
  var METAL = { metalness: 0.86, roughness: 0.28 };
  var CLOTH = { metalness: 0.05, roughness: 0.88 };
  var GEM = { metalness: 0.2, roughness: 0.18 };

  var QF = 0.72;
  function qn(n) { return Math.max(1, Math.round(n * QF)); }
  function segs(n) { return QF > 0.95 ? n : (QF > 0.6 ? Math.max(8, Math.round(n * 0.74)) : Math.max(6, Math.round(n * 0.5))); }

  function em(hex, glow, k) {
    return V.mat(hex, { metalness: 0.18, roughness: 0.22, emissive: glow || hex, emissiveIntensity: k == null ? 0.85 : k });
  }
  function strut(g, a, b, r, hex, opts) {
    var dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-4;
    var m = V.cyl(r, r, len, 6, hex, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, opts);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / len, dy / len, dz / len));
    if (g) g.add(m);
    return m;
  }
  function gem(g, r, hex, glow, k, x, y, z) {
    var m = V.mesh(new THREE.SphereGeometry(r, 12, 8), glow ? em(hex, glow, k) : V.mat(hex, GEM), x, y, z);
    if (g) g.add(m);
    return m;
  }
  function rivet(g, r, hex, x, y, z) {
    var m = V.mesh(new THREE.SphereGeometry(r, 8, 6), V.mat(hex, { metalness: 0.8, roughness: 0.3 }), x, y, z);
    if (g) g.add(m);
    return m;
  }

  /* -----------------------------------------------------------------------
     Animación ax-* (se engancha una sola vez sobre V23C.update)
     ----------------------------------------------------------------------- */
  var AX_ON = false;
  function axApplyList(av, time) {
    var list = av && av.cosmetics && av.cosmetics.animated;
    if (!list) return;
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      if (!a || !a.type || a.type.indexOf('ax-') !== 0) continue;
      var t = a.target;
      var sp = a.speed == null ? 1 : a.speed;
      var ph = a.phase || 0;
      var ang = time * sp + ph;
      var j, p, u, k, mats;
      if (a.type === 'ax-twinkle') {
        mats = a.mats || [];
        for (j = 0; j < mats.length; j++) {
          if (!mats[j]) continue;
          mats[j].opacity = (a.min == null ? 0.25 : a.min) + (1 - (a.min == null ? 0.25 : a.min)) * (0.5 + 0.5 * Math.sin(ang + j * 1.9));
        }
      } else if (a.type === 'ax-fall') {
        var ps = a.parts || [];
        for (j = 0; j < ps.length; j++) {
          p = ps[j];
          u = ((time * sp + j / ps.length) % 1 + 1) % 1;
          p.position.y = (a.top == null ? 0.06 : a.top) - u * ((a.top == null ? 0.06 : a.top) - (a.bottom == null ? -0.06 : a.bottom));
          p.position.x = Math.sin(u * 6.283 + j) * (a.wobble == null ? 0.004 : a.wobble);
        }
      } else if (a.type === 'ax-particle') {
        var ps2 = a.parts || [];
        for (j = 0; j < ps2.length; j++) {
          p = ps2[j];
          u = ((time * sp + j / ps2.length) % 1 + 1) % 1;
          p.position.y = (p.userData.axY || 0) + u * (a.height == null ? 0.3 : a.height);
          p.position.x = (p.userData.axX || 0) + Math.cos(u * 6.283 + j) * (a.radius == null ? 0.02 : a.radius);
          p.position.z = (p.userData.axZ || 0) + Math.sin(u * 6.283 + j) * (a.radius == null ? 0.02 : a.radius);
          if (p.material) p.material.opacity = (1 - u) * (a.opacity == null ? 0.75 : a.opacity);
        }
      } else if (!t) {
        continue;
      } else if (a.type === 'ax-spin') {
        t.rotation[a.axis || 'y'] = ang;
      } else if (a.type === 'ax-pulse') {
        k = 1 + Math.sin(ang) * (a.amp == null ? 0.08 : a.amp);
        t.scale.set(k, k, k);
      } else if (a.type === 'ax-sway') {
        t.rotation[a.axis || 'z'] = (a.base || 0) + Math.sin(ang) * (a.amp == null ? 0.06 : a.amp);
      }
    }
  }
  function axTickGroups(av, time) {
    var gs = av && av.cosmetics && av.cosmetics.groups;
    if (!gs) return;
    for (var i = 0; i < gs.length; i++) {
      var fn = gs[i] && gs[i].userData && gs[i].userData.axTick;
      if (fn) fn(time);
    }
  }
  function axInstall() {
    if (AX_ON || typeof V.update !== 'function') return;
    AX_ON = true;
    var base = V.update;
    V.update = function (av, dt, time, running, speedNorm) {
      try { base.call(V, av, dt, time, running, speedNorm); } catch (e) {}
      try { axApplyList(av, time); } catch (e2) {}
      try { axTickGroups(av, time); } catch (e3) {}
    };
  }

  function reg(id, build) {
    V.register(id, function (c, quality, avatar, slot) {
      QF = (typeof quality === 'number' && quality > 0) ? quality : 0.72;
      axInstall();
      return build(c, quality, avatar, slot);
    });
  }

  /* =======================================================================
     1 · GAFAS DE PRECISIÓN · cabeza · poco común
     Dos lentes con brillo, puente, patillas, bisagras y cordón de cuentas.
     ======================================================================= */
  function buildGlasses() {
    var g = new THREE.Group();
    var frame = V.mat(P.brass, METAL);
    var gold = V.mat(P.gold, METAL);
    var dark = V.mat(P.ink, { metalness: 0.45, roughness: 0.4 });
    var bronze = V.mat(P.bronze, { metalness: 0.75, roughness: 0.34 });
    var bone = V.mat(P.bone, { metalness: 0.25, roughness: 0.4 });
    var lens = V.mat(P.glass, { metalness: 0.1, roughness: 0.06, transparent: true, opacity: 0.4, emissive: P.blue, emissiveIntensity: 0.4, side: THREE.DoubleSide, depthWrite: false });
    var shineM = V.basic('#eaf7ff', { transparent: true, opacity: 0.5, additive: true, depthWrite: false });
    var rimGeo = new THREE.TorusGeometry(0.082, 0.011, 6, segs(30));
    var lensGeo = new THREE.CircleGeometry(0.073, 20);
    var templeGeo = new THREE.CylinderGeometry(0.008, 0.0065, 0.29, 6);
    var tipGeo = new THREE.SphereGeometry(0.013, 8, 6);
    [-1, 1].forEach(function (s) {
      g.add(V.mesh(rimGeo, frame, s * 0.114, 0.352, 0.255));
      g.add(V.mesh(lensGeo, lens, s * 0.114, 0.352, 0.258));
      var sh = V.mesh(new THREE.PlaneGeometry(0.047, 0.015), shineM, s * 0.114 - 0.02, 0.373, 0.263);
      sh.rotation.z = -0.5;
      g.add(sh);
      var hinge = V.mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.032, 8), gold, s * 0.198, 0.358, 0.24);
      hinge.rotation.z = 0.2;
      g.add(hinge);
      var temple = V.mesh(templeGeo, dark, s * 0.198, 0.356, 0.088);
      temple.rotation.x = Math.PI / 2;
      g.add(temple);
      g.add(V.mesh(tipGeo, frame, s * 0.198, 0.356, -0.062));
      g.add(V.mesh(new THREE.SphereGeometry(0.01, 8, 6), bone, s * 0.03, 0.33, 0.252));
    });
    var bridge = V.cyl(0.008, 0.008, 0.078, 8, P.brass, 0, 0.37, 0.256, METAL);
    bridge.rotation.z = Math.PI / 2;
    g.add(bridge);
    var plate = V.box(0.08, 0.02, 0.02, P.bronze, 0, 0.398, 0.246, { metalness: 0.75, roughness: 0.34 });
    plate.rotation.x = -0.12;
    g.add(plate);
    g.add(V.mesh(new THREE.SphereGeometry(0.008, 8, 6), gold, 0, 0.398, 0.258));
    for (var i = 0; i < qn(3); i++) {
      g.add(V.sphere(0.0115, i % 2 ? P.brass : P.bone, 0.212, 0.322 - i * 0.034, 0.018 - i * 0.008, METAL));
    }
    g.add(V.line([
      new THREE.Vector3(0.212, 0.34, 0.03),
      new THREE.Vector3(0.216, 0.3, 0.012),
      new THREE.Vector3(0.22, 0.254, 0.0)
    ], P.brass, 0.5));
    g.add(V.torus(0.016, 0.005, P.gold, 0.212, 0.244, -0.002, METAL));
    V.addAnim(g, { type: 'ax-twinkle', mats: [shineM], speed: 2.1, min: 0.16 });
    return g;
  }

  /* =======================================================================
     2 · BRÚJULA DE MUÑECA · leftArm · común
     Esfera con aro graduado, aguja, correa y cadena corta.
     ======================================================================= */
  function buildCompass() {
    var g = new THREE.Group();
    var leather = V.mat(P.leather, CLOTH);
    var brass = V.mat(P.brass, METAL);
    var brassD = V.mat(P.brassD, { metalness: 0.7, roughness: 0.36 });
    var gold = V.mat(P.gold, METAL);
    var ink = V.mat(P.ink, { metalness: 0.25, roughness: 0.5 });
    var bone = V.mat(P.bone, { metalness: 0.3, roughness: 0.4 });
    var rose = V.mat(P.rose, GEM);
    var strap = V.torus(0.099, 0.021, P.leather, 0, -0.6, 0, CLOTH);
    strap.rotation.x = Math.PI / 2;
    g.add(strap);
    g.add(V.box(0.036, 0.028, 0.014, P.brass, 0.088, -0.588, 0.072, METAL));
    g.add(V.cyl(0.005, 0.005, 0.03, 6, P.gold, 0.088, -0.588, 0.08, METAL));
    /* Soporte que enlaza la correa con el instrumento, ya delante y afuera
       de la muñeca (z positivo, x hacia el exterior del brazo). */
    var mount = V.mesh(new THREE.BoxGeometry(0.07, 0.05, 0.1), brassD, -0.02, -0.578, 0.078);
    mount.rotation.x = -0.25;
    g.add(mount);
    g.add(V.torus(0.026, 0.008, P.brass, -0.02, -0.588, 0.116, METAL));
    var inst = new THREE.Group();
    inst.position.set(-0.048, -0.545, 0.162);
    inst.scale.setScalar(1.62);
    var caseM = V.mesh(new THREE.CylinderGeometry(0.09, 0.094, 0.04, segs(26)), brass, 0, 0, 0);
    caseM.rotation.x = Math.PI / 2;
    inst.add(caseM);
    var back = V.mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.014, 20), brassD, 0, 0, -0.023);
    back.rotation.x = Math.PI / 2;
    inst.add(back);
    inst.add(V.torus(0.093, 0.012, P.gold, 0, 0, 0.021, METAL));
    inst.add(V.circle(0.08, P.ink, 0, 0, 0.026, { metalness: 0.2, roughness: 0.5 }));
    var tickMat = V.mat(P.bone, { metalness: 0.35, roughness: 0.4 });
    for (var i = 0; i < 12; i++) {
      var a = i / 12 * Math.PI * 2;
      var long = i % 3 === 0;
      var tk = V.mesh(new THREE.BoxGeometry(0.006, long ? 0.02 : 0.011, 0.004), tickMat,
        Math.sin(a) * 0.062, Math.cos(a) * 0.062, 0.029);
      tk.rotation.z = -a;
      inst.add(tk);
    }
    [-1, 1].forEach(function (s) {
      inst.add(V.mesh(new THREE.SphereGeometry(0.007, 8, 6), gold, s * 0.068, 0, 0.03));
    });
    var needle = new THREE.Group();
    needle.position.set(0, 0, 0.033);
    needle.rotation.z = 0.5;
    var n1 = V.cone(0.011, 0.07, 4, P.rose, 0, 0.03, 0, GEM);
    var n2 = V.cone(0.008, 0.045, 4, P.bone, 0, -0.024, 0, { metalness: 0.2, roughness: 0.4 });
    n2.rotation.x = Math.PI;
    needle.add(n1);
    needle.add(n2);
    needle.add(V.mesh(new THREE.SphereGeometry(0.011, 8, 6), gold, 0, 0, 0.004));
    inst.add(needle);
    var dome = V.mesh(new THREE.SphereGeometry(0.082, 18, 12), V.mat(P.glass, { metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.24, depthWrite: false, side: THREE.DoubleSide }));
    dome.position.set(0, 0, 0.019);
    dome.scale.z = 0.36;
    inst.add(dome);
    inst.add(V.torus(0.018, 0.006, P.gold, 0, 0.096, -0.008, METAL));
    for (var k = 0; k < qn(3); k++) {
      var link = V.torus(0.019, 0.0055, k % 2 ? P.brass : P.brassD, 0.012, -0.095 - k * 0.034, -0.004, METAL);
      if (k % 2) link.rotation.y = Math.PI / 2;
      inst.add(link);
    }
    inst.add(V.mesh(new THREE.SphereGeometry(0.014, 8, 6), brassD, 0.012, -0.196, -0.004));
    g.add(inst);
    return g;
  }

  /* =======================================================================
     3 · BOLSO DE CAMPO · extras · común
     Cuerpo redondeado, solapa, correas con hebilla, bolsillos, parches,
     libreta que asoma y correa al hombro.
     ======================================================================= */
  function buildBag() {
    var g = new THREE.Group();
    g.position.set(0.7, 0.98, 0.03);
    g.rotation.y = 0.12;
    var leather = V.mat(P.leather, CLOTH);
    var leatherD = V.mat(P.leatherD, CLOTH);
    var leatherL = V.mat(P.leatherL, CLOTH);
    var brass = V.mat(P.brass, METAL);
    var gold = V.mat(P.gold, METAL);
    var ink = V.mat(P.ink, { metalness: 0.3, roughness: 0.5 });
    var paper = V.mat(P.paper, CLOTH);
    var bone = V.mat(P.bone, { metalness: 0.25, roughness: 0.4 });
    var teal = V.mat(P.teal, { metalness: 0.25, roughness: 0.5 });
    g.add(V.mesh(new THREE.BoxGeometry(0.4, 0.3, 0.2), leather, 0, 0, 0));
    var roll = V.mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.4, segs(18)), leatherL, 0, 0.15, 0);
    roll.rotation.z = Math.PI / 2;
    g.add(roll);
    var roll2 = V.mesh(new THREE.CylinderGeometry(0.078, 0.078, 0.38, segs(14)), leatherD, 0, -0.145, 0);
    roll2.rotation.z = Math.PI / 2;
    g.add(roll2);
    var flap = V.box(0.36, 0.2, 0.02, P.leatherL, 0, 0.09, 0.106, CLOTH);
    flap.rotation.x = -0.06;
    g.add(flap);
    var flapTip = V.mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.35, 10), leatherL, 0, -0.012, 0.113);
    flapTip.rotation.z = Math.PI / 2;
    g.add(flapTip);
    [-1, 1].forEach(function (s) {
      g.add(V.mesh(new THREE.BoxGeometry(0.044, 0.24, 0.016), leatherD, s * 0.1, 0.045, 0.122));
      g.add(V.mesh(new THREE.BoxGeometry(0.056, 0.046, 0.012), gold, s * 0.1, -0.055, 0.132));
      g.add(V.mesh(new THREE.BoxGeometry(0.034, 0.024, 0.018), ink, s * 0.1, -0.055, 0.136));
      g.add(V.mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.048, 6), brass, s * 0.1, -0.055, 0.143));
      g.add(V.mesh(new THREE.SphereGeometry(0.012, 8, 6), brass, s * 0.18, 0.115, 0.1));
      g.add(V.mesh(new THREE.SphereGeometry(0.012, 8, 6), brass, s * 0.18, -0.115, 0.1));
      g.add(V.torus(0.024, 0.007, P.brass, s * 0.212, 0.13, 0, METAL));
    });
    g.add(V.mesh(new THREE.BoxGeometry(0.21, 0.13, 0.055), leather, -0.08, -0.075, 0.112));
    var pk = V.mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.21, 10), leatherL, -0.08, -0.008, 0.112);
    pk.rotation.z = Math.PI / 2;
    g.add(pk);
    g.add(V.sphere(0.015, P.gold, -0.08, -0.095, 0.143, METAL));
    g.add(V.mesh(new THREE.BoxGeometry(0.16, 0.07, 0.09), leatherD, 0.085, -0.19, 0.055));
    g.add(V.mesh(new THREE.BoxGeometry(0.14, 0.05, 0.012), leatherL, 0.085, -0.155, 0.105));
    g.add(V.sphere(0.011, P.gold, 0.085, -0.175, 0.108, METAL));
    var side = V.mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.16, 12), leatherD, 0.215, 0.0, 0.0);
    g.add(side);
    g.add(V.mesh(new THREE.BoxGeometry(0.024, 0.06, 0.13), leatherL, 0.25, 0.06, 0.0));
    g.add(V.mesh(new THREE.SphereGeometry(0.012, 8, 6), gold, 0.25, 0.06, 0.07));
    var patch = V.circle(0.04, P.teal, -0.12, 0.03, 0.101, { metalness: 0.25, roughness: 0.5 });
    g.add(patch);
    g.add(V.mesh(new THREE.SphereGeometry(0.008, 8, 6), gold, -0.12, 0.03, 0.108));
    var note = new THREE.Group();
    note.position.set(0.07, 0.215, 0.048);
    note.rotation.x = -0.22;
    note.rotation.z = 0.08;
    note.add(V.mesh(new THREE.BoxGeometry(0.12, 0.15, 0.014), paper, 0, 0, 0));
    note.add(V.mesh(new THREE.BoxGeometry(0.085, 0.008, 0.016), ink, 0, 0.036, 0.004));
    note.add(V.mesh(new THREE.BoxGeometry(0.06, 0.007, 0.016), ink, 0, 0.012, 0.004));
    g.add(note);
    var strap = V.mesh(new THREE.BoxGeometry(0.055, 0.36, 0.022), leatherD, -0.13, 0.33, 0.04);
    strap.rotation.z = 0.5;
    g.add(strap);
    var sb = V.mesh(new THREE.BoxGeometry(0.06, 0.05, 0.024), gold, -0.245, 0.485, 0.06);
    sb.rotation.z = 0.5;
    g.add(sb);
    var tag = V.mesh(new THREE.BoxGeometry(0.05, 0.07, 0.01), leatherL, 0.27, -0.02, 0.03);
    tag.rotation.z = -0.18;
    g.add(tag);
    g.add(V.mesh(new THREE.TorusGeometry(0.02, 0.005, 5, 14), brass, 0.238, -0.01, 0.024));
    g.add(V.mesh(new THREE.SphereGeometry(0.009, 8, 6), bone, 0.27, -0.02, 0.037));
    return g;
  }

  /* =======================================================================
     4 · PLUMA DE ARCHIVO · extras · raro
     Cañón, plumón de barbas planas, plumín emisivo y talabarte.
     ======================================================================= */
  function buildFeather() {
    var g = new THREE.Group();
    g.position.set(-0.6, 1.26, 0.05);
    g.rotation.z = 0.17;
    g.rotation.y = 0.18;
    var silver = V.mat(P.silver, METAL);
    var gold = V.mat(P.gold, METAL);
    var violet = V.mat(P.violet, { metalness: 0.25, roughness: 0.45, side: THREE.DoubleSide });
    var violetL = V.mat(P.violetL, { metalness: 0.15, roughness: 0.5, side: THREE.DoubleSide });
    var blueL = V.mat(P.blueL, { metalness: 0.2, roughness: 0.5, side: THREE.DoubleSide });
    var ink = V.mat(P.ink, { metalness: 0.3, roughness: 0.5 });
    var leather = V.mat(P.leatherD, CLOTH);
    var loop = V.torus(0.048, 0.013, P.leatherD, 0, -0.1, 0, CLOTH);
    loop.rotation.x = Math.PI / 2;
    g.add(loop);
    g.add(V.mesh(new THREE.BoxGeometry(0.09, 0.028, 0.05), leather, -0.05, -0.1, 0.0));
    g.add(V.cyl(0.006, 0.013, 0.5, 6, P.silver, 0, 0.04, 0, METAL));
    var nib = V.mesh(new THREE.ConeGeometry(0.019, 0.09, 6), em(P.gold, P.violet, 0.7), 0, -0.255, 0);
    nib.rotation.x = Math.PI;
    g.add(nib);
    g.add(V.torus(0.02, 0.006, P.gold, 0, -0.19, 0, METAL));
    g.add(V.box(0.008, 0.46, 0.006, P.violet, 0, 0.03, 0.002, { metalness: 0.2, roughness: 0.5 }));
    var vane = new THREE.Group();
    vane.position.set(0, 0.09, 0);
    var mats = [violet, violetL, blueL];
    var leaf = V.mesh(new THREE.SphereGeometry(0.068, 12, 10), violet, 0, 0.01, 0);
    leaf.scale.set(1.02, 3.1, 0.17);
    vane.add(leaf);
    var leaf2 = V.mesh(new THREE.SphereGeometry(0.058, 12, 10), mats[1], 0.006, 0.02, 0.004);
    leaf2.scale.set(0.72, 2.85, 0.13);
    vane.add(leaf2);
    var barbN = qn(6);
    for (var i = 0; i < barbN; i++) {
      var u = i / Math.max(1, barbN - 1);
      var by = 0.19 - u * 0.32;
      [-1, 1].forEach(function (s) {
        var barb = V.mesh(new THREE.ConeGeometry(0.011, 0.12, 4), mats[(i + (s > 0 ? 1 : 0)) % 3], s * 0.048, by, 0);
        barb.rotation.z = -s * (0.98 - u * 0.22);
        vane.add(barb);
      });
    }
    g.add(vane);
    g.add(V.torus(0.015, 0.004, P.gold, 0, -0.3, 0.004, METAL));
    gem(g, 0.018, P.rose, P.rose, 0.75, 0, -0.34, 0.004);
    var tag = V.mesh(new THREE.BoxGeometry(0.036, 0.05, 0.006), ink, 0.025, -0.3, 0.02);
    tag.rotation.z = 0.2;
    g.add(tag);
    g.add(V.glow(P.violet, 0.2, 0, -0.28, 0.03, 0.32));
    V.addAnim(g, { type: 'ax-sway', target: vane, axis: 'z', speed: 1.5, amp: 0.07 });
    return g;
  }

  /* =======================================================================
     AMULETOS · torso · y 0.28-0.62, z positivo
     ======================================================================= */
  function amuletCord(g, yTop, zTop, yBot, zBot, halfW, hex, beadHex) {
    var beadMat = V.mat(beadHex || P.bone, { metalness: 0.55, roughness: 0.32 });
    [-1, 1].forEach(function (s) {
      var a = [s * halfW, yTop, zTop];
      var b = [0, yBot, zBot];
      strut(g, a, b, 0.0065, hex, { metalness: 0.65, roughness: 0.34 });
      for (var i = 1; i <= 2; i++) {
        var u = i / 3;
        g.add(V.mesh(new THREE.SphereGeometry(0.008, 8, 6), beadMat,
          a[0] * (1 - u), a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u));
      }
    });
  }

  /* 5 · Amuleto de enfoque · raro: prisma triangular con haz de luz. */
  function buildFocus() {
    var g = new THREE.Group();
    amuletCord(g, 0.62, 0.185, 0.47, 0.245, 0.14, P.brass, P.gold);
    g.add(V.torus(0.025, 0.008, P.gold, 0, 0.47, 0.25, METAL));
    var prism = V.mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.062, 3), em(P.teal, P.tealL, 0.7), 0, 0.395, 0.262);
    prism.rotation.x = Math.PI / 2;
    prism.rotateY(0.52);
    g.add(prism);
    var goldM = V.mat(P.gold, METAL);
    for (var i = 0; i < 3; i++) {
      var a = 0.52 + i * Math.PI * 2 / 3;
      strut(g, [0, 0.395, 0.296], [Math.cos(a) * 0.07, 0.395 + Math.sin(a) * 0.07, 0.296], 0.0035, P.gold, METAL);
    }
    var halo = V.torus(0.116, 0.008, P.goldL, 0, 0.395, 0.262, { metalness: 0.85, roughness: 0.25, emissive: P.gold, emissiveIntensity: 0.35 });
    g.add(halo);
    var core = gem(g, 0.03, '#eafffb', P.tealL, 1.1, 0, 0.395, 0.268);
    var beamMat = V.basic(P.tealL, { transparent: true, opacity: 0.17, additive: true, depthWrite: false, side: THREE.DoubleSide });
    var beam = V.mesh(new THREE.ConeGeometry(0.058, 0.22, 10), beamMat, 0, 0.548, 0.262);
    g.add(beam);
    g.add(V.mesh(new THREE.ConeGeometry(0.026, 0.15, 8), beamMat, 0, 0.522, 0.262));
    g.add(V.mesh(new THREE.CircleGeometry(0.03, 14), beamMat, 0, 0.66, 0.262));
    var tip = V.mesh(new THREE.ConeGeometry(0.026, 0.07, 6), goldM, 0, 0.325, 0.262);
    tip.rotation.x = Math.PI;
    g.add(tip);
    gem(g, 0.017, P.tealL, P.teal, 0.9, 0, 0.3, 0.262);
    g.add(V.glow(P.teal, 0.34, 0, 0.395, 0.29, 0.3));
    V.addAnim(g, { type: 'ax-spin', target: halo, axis: 'z', speed: -0.7 });
    V.addAnim(g, { type: 'ax-pulse', target: core, speed: 2.2, amp: 0.16 });
    return g;
  }

  /* 6 · Sello del método · épico: disco de bronce, marca grabada, anillo
     rúnico giratorio, gema pulsante y cintas que se mecen. */
  function buildSeal() {
    var g = new THREE.Group();
    amuletCord(g, 0.62, 0.19, 0.5, 0.25, 0.15, P.bronze, P.gold);
    g.add(V.torus(0.028, 0.009, P.gold, 0, 0.49, 0.255, METAL));
    var disc = V.mesh(new THREE.CylinderGeometry(0.123, 0.123, 0.046, segs(28)), V.mat(P.bronze, { metalness: 0.75, roughness: 0.38 }), 0, 0.4, 0.268);
    disc.rotation.x = Math.PI / 2;
    g.add(disc);
    g.add(V.torus(0.126, 0.015, P.gold, 0, 0.4, 0.268, METAL));
    var plate = V.mesh(new THREE.CylinderGeometry(0.106, 0.106, 0.012, 24), V.mat(P.brassD, { metalness: 0.7, roughness: 0.4 }), 0, 0.4, 0.294);
    plate.rotation.x = Math.PI / 2;
    g.add(plate);
    g.add(V.torus(0.056, 0.006, P.gold, 0, 0.4, 0.302, METAL));
    var barMat = V.mat(P.bone, { metalness: 0.35, roughness: 0.4 });
    var b1 = V.mesh(new THREE.BoxGeometry(0.012, 0.145, 0.006), barMat, 0, 0.4, 0.303);
    b1.rotation.z = 0.72;
    g.add(b1);
    var b2 = V.mesh(new THREE.BoxGeometry(0.012, 0.145, 0.006), barMat, 0, 0.4, 0.303);
    b2.rotation.z = -0.72;
    g.add(b2);
    for (var i = 0; i < 4; i++) {
      var a = Math.PI / 4 + i * Math.PI / 2;
      g.add(V.mesh(new THREE.SphereGeometry(0.012, 8, 6), V.mat(P.gold, METAL), Math.cos(a) * 0.092, 0.4 + Math.sin(a) * 0.092, 0.301));
    }
    var ring = new THREE.Group();
    ring.position.set(0, 0.4, 0.27);
    var runeMat = V.mat(P.gold, { metalness: 0.8, roughness: 0.25, emissive: P.gold, emissiveIntensity: 0.4 });
    for (var k = 0; k < qn(6); k++) {
      var rk = k / qn(6) * Math.PI * 2;
      var rp = V.mesh(new THREE.BoxGeometry(0.015, 0.04, 0.01), runeMat, Math.cos(rk) * 0.183, Math.sin(rk) * 0.183, 0.017);
      rp.rotation.z = rk;
      ring.add(rp);
    }
    g.add(ring);
    var core = gem(g, 0.032, P.amber, P.amber, 1.15, 0, 0.4, 0.308);
    var ribbons = new THREE.Group();
    ribbons.position.set(0, 0.33, 0.25);
    var ribMat = V.mat(P.violet, { metalness: 0.2, roughness: 0.6, side: THREE.DoubleSide });
    [-1, 1].forEach(function (s) {
      var r = V.mesh(new THREE.PlaneGeometry(0.055, 0.17), ribMat, s * 0.03, -0.08, 0);
      r.rotation.z = s * 0.12;
      ribbons.add(r);
    });
    g.add(ribbons);
    g.add(V.glow(P.amber, 0.42, 0, 0.4, 0.32, 0.3));
    V.addAnim(g, { type: 'ax-spin', target: ring, axis: 'z', speed: -0.55 });
    V.addAnim(g, { type: 'ax-pulse', target: core, speed: 2.0, amp: 0.14 });
    V.addAnim(g, { type: 'ax-sway', target: ribbons, axis: 'z', speed: 1.6, amp: 0.09 });
    return g;
  }

  /* 7 · Nudo de la memoria · poco común: cordón anudado, lazadas y flecos. */
  function buildKnot() {
    var g = new THREE.Group();
    var cordMat = V.mat(P.cord, { metalness: 0.05, roughness: 0.9 });
    var mauveMat = V.mat(P.mauve, { metalness: 0.05, roughness: 0.88 });
    var plumMat = V.mat(P.plum, CLOTH);
    var goldM = V.mat(P.gold, METAL);
    amuletCord(g, 0.62, 0.18, 0.47, 0.25, 0.14, P.cord, P.gold);
    var toggle = V.mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.1, 8), plumMat, 0, 0.575, 0.24);
    toggle.rotation.z = Math.PI / 2;
    g.add(toggle);
    var t1 = V.torus(0.062, 0.02, P.cord, 0, 0.42, 0.268, { metalness: 0.05, roughness: 0.9 });
    t1.rotation.z = 0.7;
    g.add(t1);
    var t2 = V.torus(0.049, 0.018, P.mauve, 0, 0.41, 0.282, { metalness: 0.05, roughness: 0.9 });
    t2.rotation.z = -0.7;
    g.add(t2);
    var core = V.sphere(0.041, P.cord, 0, 0.41, 0.278, { metalness: 0.05, roughness: 0.9 });
    core.scale.set(1.1, 0.9, 0.85);
    g.add(core);
    [-1, 1].forEach(function (s) {
      var loop = V.torus(0.031, 0.012, s > 0 ? P.mauve : P.cord, s * 0.035, 0.31, 0.273, { metalness: 0.05, roughness: 0.9 });
      loop.scale.y = 1.7;
      loop.rotation.z = s * 0.16;
      g.add(loop);
    });
    var tassels = new THREE.Group();
    tassels.position.set(0, 0.29, 0.268);
    for (var i = 0; i < qn(3); i++) {
      var x = (i - (qn(3) - 1) / 2) * 0.038;
      var t = V.cone(0.017, 0.11, 6, P.mauve, x, -0.085, 0, { metalness: 0.05, roughness: 0.9 });
      t.rotation.x = Math.PI;
      tassels.add(t);
      var fray = V.cone(0.011, 0.05, 5, P.plum, x, -0.155, 0, { metalness: 0.05, roughness: 0.9 });
      fray.rotation.x = Math.PI;
      tassels.add(fray);
    }
    g.add(tassels);
    gem(g, 0.026, P.rose, P.rose, 0.65, 0.005, 0.235, 0.3);
    g.add(V.torus(0.017, 0.005, P.gold, 0.048, 0.325, 0.28, METAL));
    var tag = V.circle(0.028, P.plum, -0.057, 0.34, 0.285);
    g.add(tag);
    g.add(V.mesh(new THREE.BoxGeometry(0.012, 0.028, 0.006), cordMat, -0.057, 0.34, 0.291));
    V.addAnim(g, { type: 'ax-sway', target: tassels, axis: 'z', speed: 1.25, amp: 0.1 });
    return g;
  }

  /* 8 · Reliquia del criterio · épico: relicario oval, balanza colgante,
     halo giratorio y gema pulsante. */
  function buildCriterion() {
    var g = new THREE.Group();
    var goldM = V.mat(P.gold, METAL);
    var goldL = V.mat(P.goldL, { metalness: 0.8, roughness: 0.25 });
    var boneM = V.mat(P.bone, { metalness: 0.4, roughness: 0.35 });
    amuletCord(g, 0.62, 0.19, 0.52, 0.245, 0.15, P.gold, P.goldL);
    g.add(V.torus(0.026, 0.008, P.gold, 0, 0.512, 0.25, METAL));
    var rel = new THREE.Group();
    rel.position.set(0, 0.44, 0.268);
    var frame = V.torus(0.077, 0.013, P.gold, 0, 0, 0, METAL);
    frame.scale.y = 1.28;
    rel.add(frame);
    var backPlate = V.circle(0.073, P.ink, 0, 0, 0.004);
    backPlate.scale.y = 1.27;
    rel.add(backPlate);
    var mirror = V.circle(0.061, P.violetL, 0, 0, 0.012, { metalness: 0.2, roughness: 0.14, emissive: P.violet, emissiveIntensity: 0.6 });
    mirror.scale.y = 1.26;
    rel.add(mirror);
    [-1, 1].forEach(function (s) {
      var prong = V.cone(0.011, 0.04, 5, P.goldL, s * 0.085, 0, 0.006, METAL);
      prong.rotation.z = s * Math.PI / 2;
      rel.add(prong);
      var fili = V.torus(0.016, 0.004, P.goldL, 0, s * 0.1, 0.004, METAL);
      fili.scale.y = 1.3;
      rel.add(fili);
    });
    g.add(rel);
    var gemCore = gem(g, 0.028, P.violetL, P.violet, 1.0, 0, 0.44, 0.292);
    var halo = V.torus(0.113, 0.006, P.goldL, 0, 0.44, 0.27, { metalness: 0.85, roughness: 0.22, emissive: P.violet, emissiveIntensity: 0.35 });
    g.add(halo);
    var balance = new THREE.Group();
    balance.position.set(0, 0.29, 0.283);
    var beam = V.mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.29, 6), goldM, 0, 0, 0);
    beam.rotation.z = Math.PI / 2;
    balance.add(beam);
    balance.add(V.mesh(new THREE.SphereGeometry(0.015, 10, 8), goldM, 0, 0, 0));
    balance.add(V.mesh(new THREE.TorusGeometry(0.014, 0.005, 5, 16), goldM, 0, 0.028, 0));
    [-1, 1].forEach(function (s) {
      var ex = s * 0.135;
      for (var c = 0; c < 3; c++) {
        var cx = ex + (c - 1) * 0.028;
        var cz = (c - 1) * 0.02;
        strut(balance, [ex, 0, 0], [cx, -0.1, cz], 0.0032, P.goldL, { metalness: 0.6, roughness: 0.3 });
        balance.add(V.mesh(new THREE.SphereGeometry(0.004, 6, 5), goldL, cx, -0.1, cz));
      }
      var pan = V.mesh(new THREE.CylinderGeometry(0.041, 0.031, 0.012, 14), V.mat(P.gold, METAL), ex, -0.104, 0);
      balance.add(pan);
      var rim = V.mesh(new THREE.TorusGeometry(0.04, 0.005, 5, 20), goldL, ex, -0.097, 0);
      rim.rotation.x = Math.PI / 2;
      balance.add(rim);
      balance.add(V.mesh(new THREE.SphereGeometry(0.006, 6, 5), boneM, ex, -0.092, 0));
    });
    g.add(balance);
    var drop = V.mesh(new THREE.ConeGeometry(0.019, 0.06, 6), V.mat(P.gold, METAL), 0, 0.145, 0.283);
    drop.rotation.x = Math.PI;
    g.add(drop);
    gem(g, 0.012, P.violetL, P.violet, 0.9, 0, 0.17, 0.283);
    g.add(V.glow(P.violet, 0.38, 0, 0.44, 0.3, 0.28));
    V.addAnim(g, { type: 'ax-spin', target: halo, axis: 'z', speed: 0.5 });
    V.addAnim(g, { type: 'ax-pulse', target: gemCore, speed: 1.9, amp: 0.15 });
    V.addAnim(g, { type: 'ax-sway', target: balance, axis: 'z', speed: 1.1, amp: 0.055 });
    return g;
  }

  /* =======================================================================
     9 · RELOJ DE ARENA FLOTANTE · extras · raro
     Dos bulbos de vidrio, arena que cae, marco giratorio y base.
     ======================================================================= */
  function buildHourglass() {
    var g = new THREE.Group();
    g.position.set(-0.62, 1.3, 0.04);
    var brass = V.mat(P.brass, METAL);
    var brassD = V.mat(P.brassD, { metalness: 0.7, roughness: 0.38 });
    var gold = V.mat(P.gold, METAL);
    var bone = V.mat(P.bone, { metalness: 0.35, roughness: 0.4 });
    g.add(V.mesh(new THREE.CylinderGeometry(0.14, 0.158, 0.036, segs(20)), brassD, 0, -0.26, 0));
    g.add(V.torus(0.142, 0.011, P.gold, 0, -0.244, 0, METAL));
    for (var f = 0; f < 3; f++) {
      var fa = f / 3 * Math.PI * 2;
      g.add(V.mesh(new THREE.SphereGeometry(0.026, 8, 6), brass, Math.cos(fa) * 0.128, -0.292, Math.sin(fa) * 0.128));
    }
    g.add(V.mesh(new THREE.BoxGeometry(0.105, 0.044, 0.012), gold, 0, -0.256, 0.142));
    g.add(V.mesh(new THREE.BoxGeometry(0.082, 0.026, 0.016), V.mat(P.ink, { metalness: 0.4, roughness: 0.5 }), 0, -0.256, 0.149));
    g.add(V.mesh(new THREE.CylinderGeometry(0.011, 0.018, 0.055, 8), brass, 0, -0.207, 0));
    var glass = V.mat(P.glass, { metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });
    var top = V.mesh(new THREE.SphereGeometry(0.112, 16, 12), glass, 0, 0.1, 0);
    top.scale.y = 0.84;
    g.add(top);
    var bot = V.mesh(new THREE.SphereGeometry(0.112, 16, 12), glass, 0, -0.1, 0);
    bot.scale.y = 0.84;
    g.add(bot);
    g.add(V.mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.032, 10), V.mat(P.gold, METAL), 0, 0, 0));
    var sandTop = V.mesh(new THREE.ConeGeometry(0.074, 0.09, 12), V.mat(P.amber, { metalness: 0.15, roughness: 0.6, emissive: P.amber, emissiveIntensity: 0.35 }), 0, 0.118, 0);
    sandTop.rotation.x = Math.PI;
    g.add(sandTop);
    g.add(V.mesh(new THREE.ConeGeometry(0.074, 0.08, 12), V.mat(P.amber, { metalness: 0.15, roughness: 0.6, emissive: P.amber, emissiveIntensity: 0.35 }), 0, -0.142, 0));
    g.add(V.mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.105, 6), em(P.amberL, P.amber, 0.9), 0, 0.008, 0));
    var grainMat = em(P.amberL, P.amber, 0.9);
    grainMat.transparent = true;
    grainMat.opacity = 0.9;
    var grains = [];
    for (var gi = 0; gi < qn(5); gi++) {
      var gr = V.mesh(new THREE.SphereGeometry(0.0075, 6, 5), grainMat, 0, 0.03 - gi * 0.02, 0.012);
      g.add(gr);
      grains.push(gr);
    }
    var cage = new THREE.Group();
    var ringA = V.mesh(new THREE.TorusGeometry(0.172, 0.009, 5, 30), gold, 0, 0, 0);
    cage.add(ringA);
    var ringB = V.mesh(new THREE.TorusGeometry(0.172, 0.009, 5, 30), brass, 0, 0, 0);
    ringB.rotation.y = Math.PI / 2;
    cage.add(ringB);
    cage.add(V.mesh(new THREE.SphereGeometry(0.024, 10, 8), gold, 0, 0.185, 0));
    cage.add(V.mesh(new THREE.ConeGeometry(0.016, 0.06, 6), gold, 0, 0.222, 0));
    cage.add(V.mesh(new THREE.SphereGeometry(0.02, 10, 8), brassD, 0, -0.19, 0));
    var finial = V.mesh(new THREE.SphereGeometry(0.014, 8, 6), bone, 0, 0.262, 0);
    cage.add(finial);
    g.add(cage);
    g.add(V.glow(P.amber, 0.3, 0, 0.0, 0.02, 0.3));
    V.addAnim(g, { type: 'ax-spin', target: cage, axis: 'y', speed: 0.45 });
    V.addAnim(g, { type: 'ax-fall', parts: grains, top: 0.055, bottom: -0.055, speed: 0.55, wobble: 0.005 });
    return g;
  }

  /* =======================================================================
     10 · CUADERNO ORBITAL · extras · raro
     Tapa, lomo, marcapáginas, hojas que pasan, runas orbitando y pluma.
     Usa la órbita histórica como única animación de posición (part11 mide su
     radio); el resto del movimiento se resuelve con axTick.
     ======================================================================= */
  function buildNotebook() {
    var g = new THREE.Group();
    g.position.set(-0.6, 1.3, 0.02);
    g.rotation.y = 0.3;
    g.rotation.z = 0.05;
    var ink = V.mat(P.ink, { metalness: 0.35, roughness: 0.45 });
    var leatherD = V.mat(P.leatherD, CLOTH);
    var paper = V.mat(P.paper, { metalness: 0.02, roughness: 0.9, side: THREE.DoubleSide });
    var paperD = V.mat(P.paperD, { metalness: 0.02, roughness: 0.9 });
    var gold = V.mat(P.gold, METAL);
    var brass = V.mat(P.brass, METAL);
    var rose = V.mat(P.rose, { metalness: 0.2, roughness: 0.55, side: THREE.DoubleSide });
    var rune = em(P.blue, P.blue, 1.1);
    g.add(V.mesh(new THREE.BoxGeometry(0.4, 0.54, 0.022), leatherD, 0, 0, -0.032));
    g.add(V.mesh(new THREE.BoxGeometry(0.37, 0.51, 0.036), paperD, 0.01, 0, -0.002));
    g.add(V.mesh(new THREE.BoxGeometry(0.4, 0.54, 0.024), ink, 0, 0, 0.03));
    var spine = V.mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.56, 10), V.mat(P.leather, CLOTH), -0.196, 0, 0);
    g.add(spine);
    for (var b = 0; b < 3; b++) {
      var band = V.mesh(new THREE.TorusGeometry(0.038, 0.006, 5, 18), gold, -0.196, -0.18 + b * 0.18, 0);
      band.rotation.x = Math.PI / 2;
      g.add(band);
    }
    g.add(V.mesh(new THREE.TorusGeometry(0.09, 0.008, 5, 28), gold, 0.03, 0.08, 0.044));
    g.add(V.circle(0.062, P.blueL, 0.03, 0.08, 0.045, { metalness: 0.15, roughness: 0.3, emissive: P.blue, emissiveIntensity: 0.45 }));
    for (var ri = 0; ri < 6; ri++) {
      var ra = ri / 6 * Math.PI * 2;
      var rt = V.mesh(new THREE.BoxGeometry(0.009, 0.024, 0.006), brass, 0.03 + Math.cos(ra) * 0.11, 0.08 + Math.sin(ra) * 0.11, 0.045);
      rt.rotation.z = ra;
      g.add(rt);
    }
    [[-0.172, 0.245], [0.172, 0.245], [-0.172, -0.245], [0.172, -0.245]].forEach(function (p) {
      g.add(V.mesh(new THREE.ConeGeometry(0.03, 0.04, 4), gold, p[0], p[1], 0.042));
    });
    g.add(V.mesh(new THREE.BoxGeometry(0.048, 0.08, 0.022), gold, 0.214, -0.02, 0.036));
    var mark = V.mesh(new THREE.PlaneGeometry(0.055, 0.26), rose, 0.12, -0.35, 0.052);
    mark.rotation.x = 0.16;
    g.add(mark);
    g.add(V.mesh(new THREE.SphereGeometry(0.016, 8, 6), gold, 0.12, -0.49, 0.05));
    var pen = V.mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.42, 8), brass, -0.238, 0.02, 0.05);
    g.add(pen);
    g.add(V.mesh(new THREE.ConeGeometry(0.011, 0.045, 6), gold, -0.238, 0.25, 0.05));
    g.add(V.mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.04, 8), gold, -0.238, -0.196, 0.05));
    var loose = [[0.22, -0.32, -0.32], [0.26, -0.36, -0.55]];
    for (var lk = 0; lk < loose.length; lk++) {
      var sheetL = V.mesh(new THREE.PlaneGeometry(0.24, 0.32), paper, loose[lk][0], loose[lk][1], 0.058 + lk * 0.002);
      sheetL.rotation.z = loose[lk][2];
      g.add(sheetL);
    }
    var tilt = new THREE.Group();
    tilt.position.set(0, 0.02, 0);
    tilt.rotation.x = 1.02;
    tilt.rotation.z = 0.34;
    var spin = new THREE.Group();
    tilt.add(spin);
    for (var qi = 0; qi < qn(5); qi++) {
      var qa = qi / qn(5) * Math.PI * 2;
      var glyph = V.mesh(new THREE.PlaneGeometry(0.055, 0.075), rune, Math.cos(qa) * 0.33, 0, Math.sin(qa) * 0.33);
      glyph.rotation.y = -qa;
      spin.add(glyph);
      spin.add(V.mesh(new THREE.SphereGeometry(0.016, 8, 6), em(P.blueL, P.blue, 0.85), Math.cos(qa) * 0.33, 0.06, Math.sin(qa) * 0.33));
    }
    g.add(tilt);
    var pages = [];
    for (var pi = 0; pi < 3; pi++) {
      var pivot = new THREE.Group();
      pivot.position.set(-0.19, 0, 0.056);
      var sheet = V.mesh(new THREE.PlaneGeometry(0.36, 0.5), paper, 0.181, 0, 0);
      pivot.add(sheet);
      pivot.add(V.mesh(new THREE.BoxGeometry(0.34, 0.006, 0.002), paperD, 0.181, 0.21, 0.002));
      pivot.rotation.y = -0.12 * pi;
      g.add(pivot);
      pages.push({ pivot: pivot, phase: pi * 0.33 });
    }
    g.userData.axTick = function (time) {
      for (var i = 0; i < pages.length; i++) {
        var u = ((time * 0.24 + pages[i].phase) % 1 + 1) % 1;
        var k = u < 0.6 ? u / 0.6 : 1;
        k = k * k * (3 - 2 * k);
        pages[i].pivot.rotation.y = -k * Math.PI * 0.98;
      }
      spin.rotation.y = time * 0.55;
      spin.rotation.z = Math.sin(time * 0.8) * 0.05;
    };
    V.addAnim(g, { type: 'orbit', radius: 0.22, speed: 0.4, baseY: 1.3, phase: 0.4 });
    return g;
  }

  /* =======================================================================
     11-15 · TROFEOS DE GUARDIÁN · extras · raro
     Base escalonada, placa, columna, asas y emblema propio por ruta.
     ======================================================================= */
  var TROPHY = {
    salud: { c: P.teal, c2: P.tealL },
    cuidado: { c: P.blue, c2: P.blueL },
    etica: { c: P.violet, c2: P.violetL },
    investigacion: { c: P.lime, c2: P.limeL },
    gestion: { c: P.amber, c2: P.amberL }
  };
  function trophyEmblem(kind, area, goldM, brassM) {
    var e = new THREE.Group();
    var cm = em(area.c, area.c2, 0.7);
    if (kind === 'salud') {
      e.add(V.mesh(new THREE.CylinderGeometry(0.011, 0.014, 0.12, 8), V.mat(P.lime, { metalness: 0.2, roughness: 0.5 }), 0, 0.02, 0));
      [-1, 1].forEach(function (s) {
        var leaf = V.mesh(new THREE.SphereGeometry(0.055, 12, 8), cm, s * 0.05, 0.09, 0.004);
        leaf.scale.set(1.3, 0.32, 0.7);
        leaf.rotation.z = s * 0.6;
        e.add(leaf);
      });
      e.add(V.mesh(new THREE.SphereGeometry(0.031, 10, 8), em(P.tealL, P.teal, 1.0), 0, 0.15, 0.012));
      e.add(V.mesh(new THREE.TorusGeometry(0.03, 0.005, 5, 16), goldM, 0, 0.118, 0));
    } else if (kind === 'cuidado') {
      e.add(V.mesh(new THREE.ConeGeometry(0.07, 0.05, 10), brassM, 0, 0.13, 0));
      e.add(V.mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.08, 10), V.mat(P.glass, { metalness: 0.1, roughness: 0.1, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide }), 0, 0.065, 0));
      e.add(V.mesh(new THREE.SphereGeometry(0.028, 10, 8), em(area.c2, area.c, 1.1), 0, 0.06, 0));
      var handle = V.mesh(new THREE.TorusGeometry(0.042, 0.008, 5, 20), goldM, 0, 0.158, 0);
      handle.rotation.y = Math.PI / 2;
      e.add(handle);
      e.add(V.mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.012, 12), goldM, 0, 0.02, 0));
    } else if (kind === 'etica') {
      var fr = V.mesh(new THREE.TorusGeometry(0.066, 0.012, 5, 26), goldM, 0, 0.08, 0);
      fr.scale.y = 1.26;
      e.add(fr);
      var mi = V.circle(0.053, P.violetL, 0, 0.08, 0.005, { metalness: 0.2, roughness: 0.12, emissive: P.violet, emissiveIntensity: 0.65 });
      mi.scale.y = 1.24;
      e.add(mi);
      e.add(V.mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.09, 8), brassM, 0, -0.015, 0));
      e.add(V.mesh(new THREE.SphereGeometry(0.014, 8, 6), goldM, 0, 0.036, 0));
    } else if (kind === 'investigacion') {
      var prism = V.mesh(new THREE.CylinderGeometry(0.076, 0.076, 0.16, 3), em(area.c, area.c2, 0.9), 0, 0.07, 0);
      prism.rotation.y = 0.5;
      e.add(prism);
      [-1, 1].forEach(function (s) {
        var plane = V.mesh(new THREE.PlaneGeometry(0.16, 0.16), V.basic(area.c2, { transparent: true, opacity: 0.3, additive: true, depthWrite: false, side: THREE.DoubleSide }), 0, 0.07, s * 0.005);
        plane.rotation.z = s * 0.8;
        e.add(plane);
      });
      e.add(V.mesh(new THREE.TorusGeometry(0.058, 0.006, 5, 20), goldM, 0, -0.012, 0));
    } else {
      e.add(V.mesh(new THREE.TorusGeometry(0.066, 0.019, 6, 24), brassM, 0, 0.075, 0));
      for (var t = 0; t < 8; t++) {
        var ta = t / 8 * Math.PI * 2;
        var tooth = V.mesh(new THREE.BoxGeometry(0.026, 0.038, 0.026), goldM, Math.cos(ta) * 0.077, 0.075 + Math.sin(ta) * 0.077, 0);
        tooth.rotation.z = ta;
        e.add(tooth);
      }
      e.add(V.mesh(new THREE.SphereGeometry(0.028, 10, 8), em(area.c, area.c2, 0.8), 0, 0.075, 0.012));
      e.add(V.mesh(new THREE.ConeGeometry(0.018, 0.08, 6), goldM, 0, 0.17, 0));
    }
    return e;
  }
  function buildTrophy(kind) {
    var g = new THREE.Group();
    var area = TROPHY[kind];
    g.position.set(0.62, 1.28, -0.18);
    var brass = V.mat(P.brass, METAL);
    var brassD = V.mat(P.brassD, { metalness: 0.7, roughness: 0.38 });
    var gold = V.mat(P.gold, METAL);
    var ink = V.mat(P.ink, { metalness: 0.4, roughness: 0.5 });
    var bone = V.mat(P.bone, { metalness: 0.35, roughness: 0.4 });
    g.add(V.mesh(new THREE.CylinderGeometry(0.145, 0.155, 0.055, segs(20)), brassD, 0, -0.29, 0));
    g.add(V.mesh(new THREE.CylinderGeometry(0.105, 0.13, 0.032, 18), brass, 0, -0.245, 0));
    g.add(V.mesh(new THREE.TorusGeometry(0.11, 0.008, 5, 26), gold, 0, -0.228, 0));
    for (var f = 0; f < 3; f++) {
      var fa = Math.PI / 6 + f / 3 * Math.PI * 2;
      g.add(V.mesh(new THREE.SphereGeometry(0.023, 8, 6), brassD, Math.cos(fa) * 0.118, -0.317, Math.sin(fa) * 0.118));
    }
    g.add(V.mesh(new THREE.BoxGeometry(0.115, 0.046, 0.012), gold, 0, -0.262, 0.148));
    g.add(V.mesh(new THREE.BoxGeometry(0.09, 0.026, 0.016), ink, 0, -0.262, 0.155));
    g.add(V.mesh(new THREE.SphereGeometry(0.0095, 8, 6), gold, 0, -0.262, 0.166));
    g.add(V.mesh(new THREE.CylinderGeometry(0.033, 0.06, 0.17, 12), brass, 0, -0.13, 0));
    var collar = V.mesh(new THREE.TorusGeometry(0.049, 0.01, 5, 20), gold, 0, -0.052, 0);
    collar.rotation.x = Math.PI / 2;
    g.add(collar);
    [-1, 1].forEach(function (s) {
      var handle = V.mesh(new THREE.TorusGeometry(0.06, 0.013, 5, 20), gold, s * 0.104, 0.02, 0);
      handle.scale.y = 1.45;
      handle.rotation.z = s * 0.16;
      g.add(handle);
    });
    var cup = V.mesh(new THREE.ConeGeometry(0.09, 0.08, 12), brass, 0, 0.062, 0);
    cup.rotation.x = Math.PI;
    g.add(cup);
    var rim = V.mesh(new THREE.TorusGeometry(0.083, 0.01, 5, 22), gold, 0, 0.1, 0);
    rim.rotation.x = Math.PI / 2;
    g.add(rim);
    var emblem = trophyEmblem(kind, area, gold, brass);
    emblem.position.set(0, 0.198, 0);
    emblem.scale.setScalar(1.22);
    g.add(emblem);
    var orbit = new THREE.Group();
    orbit.position.set(0, 0.24, 0);
    for (var oi = 0; oi < qn(3); oi++) {
      var oa = oi / qn(3) * Math.PI * 2;
      gem(orbit, 0.013, area.c, area.c2, 0.9, Math.cos(oa) * 0.145, 0.02, Math.sin(oa) * 0.145);
    }
    g.add(orbit);
    g.add(V.glow(area.c, 0.3, 0, 0.24, 0.02, 0.26));
    g.userData.axTick = function (time) {
      emblem.rotation.y = time * 0.65;
      orbit.rotation.y = -time * 0.9;
      orbit.position.y = 0.24 + Math.sin(time * 1.5) * 0.012;
    };
    V.addAnim(g, { type: 'orbit', radius: 0.11, speed: 0.4, baseY: 1.28, phase: 0.7 });
    /* +18 % de escala para que base, placa y emblema se lean en la miniatura
       de 160 px; el radio de la órbita y el anclaje no cambian. */
    g.scale.setScalar(1.18);
    return g;
  }

  /* =======================================================================
     16-25 · TOCADOS DE DOMINIO · cabeza · épico / legendario
     Aro con remaches, cresta, cintas, motivo propio por ruta, gemas y
     órbitas. La versión dorada comparte el motivo y suma doble órbita,
     partículas y materiales áureos.
     ======================================================================= */
  var AREA = {
    salud: { c: P.teal, c2: P.tealL },
    cuidado: { c: P.blue, c2: P.blueL },
    etica: { c: P.violet, c2: P.violetL },
    investigacion: { c: P.lime, c2: P.limeL },
    gestion: { c: P.amber, c2: P.amberL }
  };
  function domainMotif(area, gold, trim, cm) {
    var m = new THREE.Group();
    m.position.set(0, 0.735, 0.215);
    m.scale.setScalar(1.18);
    if (area === 'salud') {
      m.add(V.mesh(new THREE.CylinderGeometry(0.011, 0.014, 0.19, 8), V.mat(P.lime, { metalness: 0.25, roughness: 0.5 }), 0, 0.085, 0));
      [-1, 1].forEach(function (s) {
        var leaf = V.mesh(new THREE.SphereGeometry(0.062, 12, 8), cm, s * 0.055, 0.155, 0.006);
        leaf.scale.set(1.35, 0.34, 0.72);
        leaf.rotation.z = s * 0.62;
        m.add(leaf);
        m.add(V.mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.09, 4), trim, s * 0.055, 0.153, 0.02));
      });
      m.add(V.mesh(new THREE.SphereGeometry(0.032, 10, 8), em(P.tealL, P.teal, 1.0), 0, 0.212, 0.014));
      m.add(V.mesh(new THREE.TorusGeometry(0.028, 0.005, 5, 16), trim, 0, 0.182, 0));
    } else if (area === 'cuidado') {
      [-1, 1].forEach(function (s) {
        m.add(V.mesh(new THREE.SphereGeometry(0.055, 12, 8), cm, s * 0.046, 0.16, 0));
      });
      var tip = V.mesh(new THREE.ConeGeometry(0.082, 0.135, 12), cm, 0, 0.085, 0);
      tip.rotation.x = Math.PI;
      m.add(tip);
      m.add(V.mesh(new THREE.TorusGeometry(0.092, 0.006, 5, 26), trim, 0, 0.128, 0.01));
      m.add(V.mesh(new THREE.SphereGeometry(0.024, 10, 8), em(P.blueL, P.blue, 0.9), 0, 0.143, 0.04));
    } else if (area === 'etica') {
      m.add(V.mesh(new THREE.CylinderGeometry(0.011, 0.014, 0.18, 8), trim, 0, 0.09, 0));
      var beam = V.mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.24, 6), trim, 0, 0.178, 0);
      beam.rotation.z = Math.PI / 2;
      m.add(beam);
      [-1, 1].forEach(function (s) {
        var chain = V.mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.09, 5), trim, s * 0.108, 0.132, 0);
        m.add(chain);
        m.add(V.mesh(new THREE.CylinderGeometry(0.036, 0.028, 0.009, 12), cm, s * 0.108, 0.084, 0));
        var ring = V.mesh(new THREE.TorusGeometry(0.034, 0.004, 5, 16), trim, s * 0.108, 0.088, 0);
        ring.rotation.x = Math.PI / 2;
        m.add(ring);
      });
      m.add(V.mesh(new THREE.SphereGeometry(0.014, 8, 6), trim, 0, 0.19, 0));
    } else if (area === 'investigacion') {
      var prism = V.mesh(new THREE.CylinderGeometry(0.066, 0.066, 0.17, 3), em(area === 'investigacion' ? P.lime : P.lime, P.limeL, 0.9), 0, 0.135, 0);
      prism.rotation.y = 0.5;
      m.add(prism);
      for (var s2 = 0; s2 < 4; s2++) {
        var aa = s2 / 4 * Math.PI * 2 + 0.4;
        var spike = V.mesh(new THREE.ConeGeometry(0.02, 0.09, 5), trim, Math.cos(aa) * 0.09, 0.135 + Math.sin(aa) * 0.09, 0.01);
        spike.rotation.z = -aa + Math.PI / 2;
        m.add(spike);
      }
      m.add(V.mesh(new THREE.TorusGeometry(0.052, 0.006, 5, 18), trim, 0, 0.05, 0));
    } else {
      m.add(V.mesh(new THREE.TorusGeometry(0.06, 0.017, 6, 24), trim, 0, 0.135, 0));
      for (var t2 = 0; t2 < 8; t2++) {
        var ta = t2 / 8 * Math.PI * 2;
        var tooth = V.mesh(new THREE.BoxGeometry(0.024, 0.034, 0.024), trim, Math.cos(ta) * 0.071, 0.135 + Math.sin(ta) * 0.071, 0);
        tooth.rotation.z = ta;
        m.add(tooth);
      }
      m.add(V.mesh(new THREE.SphereGeometry(0.026, 10, 8), cm, 0, 0.135, 0.012));
      m.add(V.mesh(new THREE.CylinderGeometry(0.013, 0.02, 0.07, 6), trim, 0, 0.215, 0));
      var roof = V.mesh(new THREE.ConeGeometry(0.026, 0.035, 6), trim, 0, 0.262, 0);
      m.add(roof);
    }
    return m;
  }
  function buildDomain(area, gold) {
    var g = new THREE.Group();
    var A = AREA[area];
    var bandHex = gold ? P.gold : P.brassD;
    var bandM = V.mat(bandHex, gold ? { metalness: 0.92, roughness: 0.2 } : { metalness: 0.72, roughness: 0.34 });
    var trimHex = gold ? P.goldL : P.gold;
    var trim = V.mat(trimHex, METAL);
    var crestHex = gold ? P.gold : P.bronze;
    var cm = em(gold ? P.bone : A.c, gold ? P.goldL : A.c2, gold ? 1.0 : 0.75);
    var band = V.mesh(new THREE.TorusGeometry(0.273, 0.025, 6, segs(34)), bandM, 0, 0.6, 0);
    band.rotation.x = Math.PI / 2;
    g.add(band);
    var crest = V.box(0.22, 0.118, 0.06, crestHex, 0, 0.652, 0.236, gold ? { metalness: 0.9, roughness: 0.22 } : { metalness: 0.7, roughness: 0.36 });
    g.add(crest);
    g.add(V.box(0.244, 0.02, 0.042, trimHex, 0, 0.706, 0.24, METAL));
    g.add(V.box(0.184, 0.082, 0.012, P.ink, 0, 0.652, 0.2675, { metalness: 0.35, roughness: 0.5 }));
    var crestGem = gem(g, 0.035, gold ? P.goldL : A.c, gold ? P.gold : A.c2, 1.15, 0, 0.658, 0.275);
    var rivetM = V.mat(gold ? P.goldL : P.bone, { metalness: 0.75, roughness: 0.28 });
    var rivetN = qn(gold ? 13 : 9);
    for (var i = 0; i < rivetN; i++) {
      var a = -1.22 + (i / (rivetN - 1)) * 2.44;
      g.add(V.mesh(new THREE.SphereGeometry(0.011, 8, 6), rivetM, Math.sin(a) * 0.276, 0.6, Math.cos(a) * 0.276));
    }
    [-1, 1].forEach(function (s) {
      var spur = V.cone(0.03, 0.16, 6, gold ? P.gold : A.c, s * 0.286, 0.73, 0.02, gold ? { metalness: 0.9, roughness: 0.22 } : { metalness: 0.5, roughness: 0.4 });
      spur.rotation.z = -s * 1.02;
      g.add(spur);
      g.add(V.mesh(new THREE.SphereGeometry(0.016, 8, 6), trim, s * 0.262, 0.672, 0.033));
      g.add(V.mesh(new THREE.SphereGeometry(0.009, 8, 6), rivetM, s * 0.252, 0.75, 0.02));
      var sideCrest = V.cone(0.032, 0.1, 5, gold ? P.gold : A.c, s * 0.172, 0.72, 0.19, gold ? { metalness: 0.9, roughness: 0.22 } : { metalness: 0.5, roughness: 0.4 });
      sideCrest.rotation.z = -s * 0.35;
      g.add(sideCrest);
      g.add(V.mesh(new THREE.SphereGeometry(0.011, 8, 6), trim, s * 0.172, 0.757, 0.198));
    });
    var ribbons = new THREE.Group();
    var ribM = V.mat(gold ? P.goldD : A.c, { metalness: gold ? 0.7 : 0.2, roughness: 0.55, side: THREE.DoubleSide });
    [-1, 1].forEach(function (s) {
      var r = V.mesh(new THREE.PlaneGeometry(0.058, 0.15), ribM, s * 0.036, 0.56, -0.268);
      r.rotation.x = 0.1;
      r.rotation.z = s * 0.09;
      ribbons.add(r);
    });
    g.add(ribbons);
    var motif = domainMotif(area, gold, trim, cm);
    g.add(motif);
    var orbit = new THREE.Group();
    orbit.position.set(0, 0.86, 0.215);
    orbit.rotation.x = 1.12;
    orbit.rotation.z = 0.2;
    orbit.add(V.mesh(new THREE.TorusGeometry(0.158, 0.0065, 5, 30), trim, 0, 0, 0));
    for (var oi = 0; oi < qn(4); oi++) {
      var oa = oi / qn(4) * Math.PI * 2;
      gem(orbit, 0.015, gold ? P.goldL : A.c, gold ? P.gold : A.c2, 0.95, Math.cos(oa) * 0.158, Math.sin(oa) * 0.158, 0);
    }
    g.add(orbit);
    g.add(V.glow(gold ? P.gold : A.c, gold ? 0.66 : 0.46, 0, 0.86, 0.2, gold ? 0.34 : 0.2));
    V.addAnim(g, { type: 'ax-spin', target: orbit, axis: 'y', speed: gold ? 0.75 : 0.5 });
    V.addAnim(g, { type: 'ax-pulse', target: crestGem, speed: 1.9, amp: 0.12 });
    V.addAnim(g, { type: 'ax-sway', target: ribbons, axis: 'z', speed: 1.3, amp: 0.08 });
    if (gold) {
      var orbit2 = new THREE.Group();
      orbit2.position.set(0, 0.86, 0.215);
      orbit2.rotation.x = 1.55;
      orbit2.rotation.z = -0.5;
      orbit2.add(V.mesh(new THREE.TorusGeometry(0.212, 0.005, 5, 32), V.mat(P.goldL, { metalness: 0.9, roughness: 0.2, emissive: P.gold, emissiveIntensity: 0.35 }), 0, 0, 0));
      for (var oi2 = 0; oi2 < qn(3); oi2++) {
        var oa2 = oi2 / qn(3) * Math.PI * 2 + 0.5;
        gem(orbit2, 0.012, P.bone, P.goldL, 1.0, Math.cos(oa2) * 0.212, Math.sin(oa2) * 0.212, 0);
      }
      g.add(orbit2);
      var dust = [];
      for (var di = 0; di < qn(5); di++) {
        var da = di / qn(5) * Math.PI * 2;
        var pmat = em(P.goldL, P.gold, 1.0);
        pmat.transparent = true;
        pmat.opacity = 0.8;
        var spark = V.mesh(new THREE.SphereGeometry(0.011, 6, 5), pmat, Math.cos(da) * 0.135, 0.82, 0.215 + Math.sin(da) * 0.135);
        spark.userData.axX = Math.cos(da) * 0.135;
        spark.userData.axY = 0.82;
        spark.userData.axZ = 0.215 + Math.sin(da) * 0.135;
        g.add(spark);
        dust.push(spark);
      }
      V.addAnim(g, { type: 'ax-spin', target: orbit2, axis: 'y', speed: -0.55 });
      V.addAnim(g, { type: 'ax-particle', parts: dust, speed: 0.4, height: 0.26, radius: 0.05, opacity: 0.85 });
    }
    return g;
  }

  /* -----------------------------------------------------------------------
     Registro de las 25 piezas
     ----------------------------------------------------------------------- */
  reg('c-accesorios-gafas', buildGlasses);
  reg('c-accesorios-brujula', buildCompass);
  reg('c-accesorios-bolso', buildBag);
  reg('c-accesorios-pluma', buildFeather);
  reg('c-amuleto-enfoque', buildFocus);
  reg('c-amuleto-sello', buildSeal);
  reg('c-amuleto-nudo', buildKnot);
  reg('c-amuleto-criterio', buildCriterion);
  reg('x-reloj-arena', buildHourglass);
  reg('x-cuaderno-orbital', buildNotebook);
  ['salud', 'cuidado', 'etica', 'investigacion', 'gestion'].forEach(function (kind) {
    reg('x-trofeo-' + kind, function () { return buildTrophy(kind); });
    reg('x-dominio-' + kind, function () { return buildDomain(kind, false); });
    reg('x-dominio-' + kind + '-oro', function () { return buildDomain(kind, true); });
  });

  axInstall();
})();
