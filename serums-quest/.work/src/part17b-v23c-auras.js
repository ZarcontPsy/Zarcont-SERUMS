/* =========================================================================
   V2.3 · FASE 2 · AURAS Y SUELO (AGENTE 2)
   -------------------------------------------------------------------------
   Cuatro efectos con silueta frontal propia:
     · Aura de alba        sol, corona de rayos y horizonte
     · Aura del amanecer   cintas horizontales y anillos rúnicos
     · Bruma de estudio    niebla baja, páginas y glifos
     · Constelación        estrellas sólidas unidas orbitando al héroe
   Solo geometría procedural; no usa texturas externas ni toca el visor.
   ========================================================================= */
(function () {
  'use strict';
  if (!window.V23C) return;

  var PAL = {
    gold: '#e4c07a', teal: '#69d3c1', blue: '#7aa2ff', violet: '#c49bff',
    amber: '#f3b562', lime: '#b8d46a', rose: '#ff8b9d',
    bone: '#f2f0ea', pale: '#fff1cf', paper: '#cdd9e8', ink: '#44536b'
  };
  var TAU = Math.PI * 2;

  function qty(base, qf, min) {
    return Math.max(min == null ? 1 : min, Math.round(base * qf));
  }

  /* Los specs de animación guardan referencias a subgrupos. La puerta de
     calidad clona el grupo (JSON.stringify del userData), así que el array de
     animaciones se declara sin serialización para no recorrer esas referencias. */
  function animBag(g) {
    var list = [];
    list.toJSON = function () { return []; };
    g.userData.anim = list;
    return g;
  }

  function glowMat(hex, opacity) {
    return V23C.basic(hex, {
      transparent: true,
      opacity: opacity == null ? 0.45 : opacity,
      additive: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
  }
  function ringGlow(hex, radius, tube, opacity, arc) {
    var m = V23C.mesh(new THREE.TorusGeometry(radius, tube, 3, 48, arc || TAU), glowMat(hex, opacity), 0, 0, 0);
    m.renderOrder = 3;
    return m;
  }
  function barGlow(hex, w, h, d, x, y, z, opacity) {
    var m = V23C.mesh(new THREE.BoxGeometry(w, h, d), glowMat(hex, opacity), x, y, z);
    m.renderOrder = 3;
    return m;
  }
  function rodXY(ax, ay, bx, by, radius, hex, z, opacity) {
    var dx = bx - ax, dy = by - ay;
    var len = Math.sqrt(dx * dx + dy * dy);
    var m = V23C.mesh(new THREE.CylinderGeometry(radius, radius, len, 5),
      V23C.mat(hex, {
        roughness: 0.34, metalness: 0.26, emissive: hex,
        emissiveIntensity: 0.8, transparent: true,
        opacity: opacity == null ? 0.95 : opacity
      }),
      (ax + bx) / 2, (ay + by) / 2, z || 0);
    m.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;
    return m;
  }
  function rodXZ(ax, az, bx, bz, width, hex, y, opacity) {
    var dx = bx - ax, dz = bz - az;
    var len = Math.sqrt(dx * dx + dz * dz);
    var m = barGlow(hex, len, 0.008, width || 0.01, (ax + bx) / 2, y == null ? 0.022 : y, (az + bz) / 2, opacity == null ? 0.45 : opacity);
    m.rotation.y = -Math.atan2(dz, dx);
    return m;
  }

  /* -----------------------------------------------------------------------
     AURA DE ALBA · raro
     Disco solar detrás del torso, corona radial de rayos, abanico ascendente
     y línea de horizonte en los pies. Se distingue del amanecer por el disco
     y por los rayos verticales.
     --------------------------------------------------------------------- */
  function buildAlba(c, qf, avatar, slot) {
    var g = animBag(new THREE.Group());
    var disc = new THREE.Group();
    disc.position.set(0, 1.42, -0.4);

    var face = V23C.cyl(0.55, 0.55, 0.08, 30, PAL.gold, 0, 0, 0, {
      roughness: 0.34, metalness: 0.38, emissive: PAL.amber, emissiveIntensity: 0.55
    });
    face.rotation.x = Math.PI / 2;
    disc.add(face);

    var inner = V23C.cyl(0.4, 0.4, 0.05, 26, PAL.pale, 0, 0, 0.05, {
      roughness: 0.22, metalness: 0.2, emissive: PAL.pale, emissiveIntensity: 0.85
    });
    inner.rotation.x = Math.PI / 2;
    disc.add(inner);

    disc.add(V23C.sphere(0.19, PAL.bone, 0, 0, 0.09, {
      roughness: 0.18, metalness: 0.1, emissive: PAL.pale, emissiveIntensity: 1
    }));

    disc.add(V23C.torus(0.59, 0.035, PAL.amber, 0, 0, 0.06, {
      roughness: 0.3, metalness: 0.42, emissive: PAL.amber, emissiveIntensity: 0.85
    }));

    var halo = ringGlow(PAL.teal, 0.69, 0.012, 0.5);
    halo.position.z = 0.02;
    disc.add(halo);
    var innerHalo = ringGlow(PAL.blue, 0.46, 0.008, 0.45);
    innerHalo.position.z = 0.1;
    disc.add(innerHalo);

    /* Destellos del borde: conos que rompen el contorno del disco. */
    var flares = qty(8, qf, 6);
    for (var i = 0; i < flares; i++) {
      var fa = i / flares * TAU;
      var flare = V23C.cone(0.05, 0.24, 5, i % 2 ? PAL.gold : PAL.pale,
        Math.cos(fa) * 0.67, Math.sin(fa) * 0.67, 0.02, {
          roughness: 0.4, emissive: PAL.amber, emissiveIntensity: 0.8
        });
      flare.rotation.z = fa - Math.PI / 2;
      disc.add(flare);
    }
    var back = V23C.glow(PAL.amber, 2.2, 0, 0, -0.14, 0.18);
    back.renderOrder = 2;
    disc.add(back);
    g.add(disc);

    /* Corona radial que gira muy despacio; el abanico ascendente queda fijo
       para que la firma vertical no pierda altura al girar. */
    var crown = new THREE.Group();
    crown.position.set(0, 1.42, -0.5);
    var rays = qty(12, qf, 8);
    for (var r = 0; r < rays; r++) {
      var ra = r / rays * TAU + 0.12;
      var len = 0.48 + (r % 3) * 0.04;
      var beam = V23C.cyl(0.014, 0.05, len, 5, r % 2 ? PAL.amber : PAL.gold, 0, 0, 0, {
        roughness: 0.45, emissive: PAL.amber, emissiveIntensity: 0.65
      });
      beam.position.set(Math.cos(ra) * (0.52 + len / 2), Math.sin(ra) * (0.52 + len / 2), 0);
      beam.rotation.z = ra - Math.PI / 2;
      crown.add(beam);
      if (r % 2 === 0) {
        var tip = V23C.glow(PAL.pale, 0.18, Math.cos(ra) * (0.52 + len), Math.sin(ra) * (0.52 + len), 0.03, 0.5);
        tip.renderOrder = 4;
        crown.add(tip);
      }
    }
    crown.add(ringGlow(PAL.teal, 1.02, 0.006, 0.34, Math.PI * 1.25));
    g.add(crown);

    var fan = new THREE.Group();
    fan.position.z = -0.46;
    var fanN = qty(5, qf, 4);
    for (var f = 0; f < fanN; f++) {
      var k = fanN === 1 ? 0.5 : f / (fanN - 1);
      var fx = (k - 0.5) * 1.7;
      var fh = 0.42 + (1 - Math.abs(k - 0.5) * 2) * 0.16;
      var shaft = V23C.cyl(0.045, 0.018, fh, 6, f % 2 ? PAL.gold : PAL.pale, fx, 1.96 + fh / 2, 0, {
        roughness: 0.4, emissive: PAL.amber, emissiveIntensity: 0.6
      });
      shaft.rotation.z = -fx * 0.08;
      fan.add(shaft);
      var fanGlow = V23C.glow(f % 2 ? PAL.gold : PAL.pale, 0.26, fx * 1.06, 1.96 + fh, 0.02, 0.32);
      fanGlow.renderOrder = 4;
      fan.add(fanGlow);
    }
    g.add(fan);

    var horizon = new THREE.Group();
    horizon.add(barGlow(PAL.teal, 2.0, 0.012, 0.03, 0, 0.022, 0.1, 0.7));
    horizon.add(barGlow(PAL.gold, 1.4, 0.008, 0.025, 0, 0.042, 0.12, 0.6));
    var oval = ringGlow(PAL.gold, 0.72, 0.01, 0.3);
    oval.rotation.x = Math.PI / 2;
    oval.scale.set(1.35, 0.55, 1);
    oval.position.set(0, 0.02, 0.08);
    horizon.add(oval);
    var glintL = V23C.glow(PAL.pale, 0.3, -0.78, 0.1, 0.14, 0.3);
    var glintR = V23C.glow(PAL.pale, 0.3, 0.78, 0.1, 0.14, 0.3);
    glintL.renderOrder = glintR.renderOrder = 4;
    horizon.add(glintL, glintR);
    g.add(horizon);

    V23C.addAnim(g, { type: 'v23c-rays', rays: crown, disc: disc, speed: 0.07 });
    V23C.addAnim(g, { type: 'v23c-pulse', speed: 0.8, amplitude: 0.012, phase: 0.4 });
    return g;
  }

  /* -----------------------------------------------------------------------
     AURA DEL AMANECER · épico
     Cintas horizontales que envuelven el cuerpo, anillo rúnico en el pecho y
     anillo rúnico proyectado en el suelo. Sin disco solar ni rayos verticales.
     --------------------------------------------------------------------- */
  function buildAmanecer(c, qf, avatar, slot) {
    var g = animBag(new THREE.Group());
    var bands = [];
    var bandCols = [PAL.amber, PAL.gold, PAL.rose, PAL.teal, PAL.gold];
    var bandTilts = [0.06, -0.075, 0.05, -0.07, 0.045];
    var ticks = qty(6, qf, 4);

    for (var i = 0; i < 5; i++) {
      var b = new THREE.Group();
      b.position.y = 0.6 + i * 0.35;
      b.rotation.z = bandTilts[i];
      var rad = 0.66 + (i % 2 ? 0.07 : 0) + i * 0.012;
      var ribbon = V23C.mesh(new THREE.TorusGeometry(rad, i % 2 ? 0.03 : 0.02, 5, 44),
        V23C.mat(bandCols[i], {
          roughness: 0.32, metalness: 0.3, emissive: bandCols[i], emissiveIntensity: 0.55
        }), 0, 0, 0);
      ribbon.rotation.x = Math.PI / 2;
      b.add(ribbon);

      var arc = V23C.mesh(new THREE.TorusGeometry(rad + 0.06, 0.009, 3, 40, Math.PI * 1.2),
        glowMat(bandCols[(i + 2) % 5], 0.55), 0, 0, 0);
      arc.rotation.x = Math.PI / 2;
      arc.rotation.z = i * 0.8;
      b.add(arc);

      for (var t = 0; t < ticks; t++) {
        var ta = t / ticks * TAU + i * 0.5;
        var tick = V23C.box(0.04, 0.075, 0.018, t % 2 ? PAL.gold : PAL.pale,
          Math.cos(ta) * (rad + 0.01), 0.035, Math.sin(ta) * (rad + 0.01), {
            roughness: 0.4, emissive: PAL.gold, emissiveIntensity: 0.55
          });
        tick.rotation.y = -ta;
        b.add(tick);
      }
      if (i % 2 === 0) {
        var shard = V23C.mesh(new THREE.OctahedronGeometry(0.045 + i * 0.006, 0),
          V23C.mat(PAL.pale, {
            roughness: 0.2, metalness: 0.15, emissive: PAL.amber, emissiveIntensity: 0.9
          }), 0, 0, 0);
        var sa = i * 1.7;
        shard.position.set(Math.cos(sa) * (rad + 0.1), 0.06, Math.sin(sa) * (rad + 0.1));
        b.add(shard);
      }
      bands.push(b);
      g.add(b);
    }

    var chest = new THREE.Group();
    chest.position.set(0, 1.43, 0.32);
    chest.add(V23C.mesh(new THREE.TorusGeometry(0.3, 0.022, 5, 40),
      V23C.mat(PAL.gold, {
        roughness: 0.28, metalness: 0.35, emissive: PAL.gold, emissiveIntensity: 0.9
      }), 0, 0, 0));
    var chestHalo = ringGlow(PAL.amber, 0.37, 0.008, 0.5);
    chestHalo.position.z = -0.01;
    chest.add(chestHalo);
    var spokes = qty(8, qf, 6);
    for (var s = 0; s < spokes; s++) {
      var spa = s / spokes * TAU;
      var spoke = V23C.box(0.022, 0.085, 0.014, s % 2 ? PAL.pale : PAL.teal,
        Math.cos(spa) * 0.3, Math.sin(spa) * 0.3, 0.012, {
          roughness: 0.4, emissive: PAL.gold, emissiveIntensity: 0.7
        });
      spoke.rotation.z = spa - Math.PI / 2;
      chest.add(spoke);
    }
    chest.add(V23C.mesh(new THREE.OctahedronGeometry(0.06, 0),
      V23C.mat(PAL.pale, {
        roughness: 0.2, metalness: 0.1, emissive: PAL.amber, emissiveIntensity: 1
      }), 0, 0, 0.03));
    g.add(chest);

    var floor = new THREE.Group();
    floor.position.set(0, 0.03, 0.08);
    var fRing = V23C.mesh(new THREE.TorusGeometry(0.92, 0.02, 5, 56),
      V23C.mat(PAL.amber, {
        roughness: 0.4, metalness: 0.25, emissive: PAL.amber, emissiveIntensity: 0.85
      }), 0, 0, 0);
    fRing.rotation.x = Math.PI / 2;
    floor.add(fRing);
    var fInner = ringGlow(PAL.teal, 0.7, 0.008, 0.45);
    fInner.rotation.x = Math.PI / 2;
    floor.add(fInner);

    var marks = qty(10, qf, 8);
    for (var m = 0; m < marks; m++) {
      var ma = m / marks * TAU;
      var mark = V23C.box(0.03, 0.012, 0.16, m % 2 ? PAL.gold : PAL.pale,
        Math.cos(ma) * 0.88, 0.012, Math.sin(ma) * 0.88, {
          roughness: 0.45, emissive: PAL.amber, emissiveIntensity: 0.8
        });
      mark.rotation.y = Math.PI / 2 - ma;
      floor.add(mark);
    }
    var nodes = qty(4, qf, 3);
    for (var n = 0; n < nodes; n++) {
      var na = n / nodes * TAU + 0.4;
      floor.add(V23C.sphere(0.032 + (n % 2) * 0.012, n % 2 ? PAL.teal : PAL.gold,
        Math.cos(na) * 0.62, 0.03, Math.sin(na) * 0.62, {
          roughness: 0.3, emissive: n % 2 ? PAL.teal : PAL.gold, emissiveIntensity: 0.9
        }));
    }
    var outerArc = V23C.mesh(new THREE.TorusGeometry(1.02, 0.006, 3, 40, Math.PI * 0.7),
      glowMat(PAL.violet, 0.25), 0, 0, 0);
    outerArc.rotation.x = Math.PI / 2;
    outerArc.rotation.z = 1.4;
    floor.add(outerArc);
    g.add(floor);

    var motes = qty(8, qf, 5);
    for (var q = 0; q < motes; q++) {
      var qa = q / motes * TAU + 0.7;
      var mot = V23C.glow(q % 2 ? PAL.amber : PAL.gold, 0.16 + (q % 3) * 0.03,
        Math.cos(qa) * 1.0, 0.35 + (q % 4) * 0.42, Math.sin(qa) * 0.55, 0.4);
      mot.renderOrder = 4;
      g.add(mot);
    }

    /* Las cintas se inclinan y giran: la precesión se lee como olas. El anillo
       del pecho gira en su propio plano y el del suelo barre las runas. */
    V23C.addAnim(g, { type: 'v23c-bands', bands: bands, ring: chest });
    V23C.addAnim(g, { type: 'v23c-bands', bands: [floor] });
    return g;
  }

  /* -----------------------------------------------------------------------
     BRUMA DE ESTUDIO · común
     Cuatro capas de niebla a ras de suelo, páginas flotando con renglones,
     glifos que ascienden y surcos de luz. Se lee como niebla con páginas.
     --------------------------------------------------------------------- */
  function buildBruma(c, qf, avatar, slot) {
    var g = animBag(new THREE.Group());
    var layers = [];

    for (var i = 0; i < 4; i++) {
      var layer = new THREE.Group();
      layer.position.y = 0.2 + i * 0.15;
      var puffs = qty(i === 0 ? 5 : 4, qf, 2);
      for (var p = 0; p < puffs; p++) {
        var pa = p / puffs * TAU + i * 0.8;
        var puff = V23C.soft(i % 2 ? PAL.blue : PAL.teal,
          1.3 + ((p + i) % 3) * 0.16, 0.34 + ((p + i) % 2) * 0.1,
          Math.cos(pa) * (0.42 + i * 0.06), 0.02 + ((p + i) % 3) * 0.03,
          Math.sin(pa) * (0.24 + i * 0.05) + 0.04, 0.12 + (i % 2) * 0.03);
        puff.renderOrder = 10 + i;
        layer.add(puff);
      }
      var dustArc = V23C.mesh(new THREE.TorusGeometry(0.66 + i * 0.12, 0.008, 3, 40, Math.PI * 1.15),
        glowMat(i % 2 ? PAL.violet : PAL.teal, 0.28), 0, 0.01, 0);
      dustArc.rotation.x = Math.PI / 2;
      dustArc.rotation.z = i * 1.1;
      dustArc.renderOrder = 4;
      layer.add(dustArc);
      layers.push(layer);
      g.add(layer);
    }

    var ground = new THREE.Group();
    for (var f = 0; f < 3; f++) {
      var groove = V23C.mesh(new THREE.TorusGeometry(0.5 + f * 0.22, 0.011, 3, 44, Math.PI * (0.9 + f * 0.1)),
        V23C.mat(f % 2 ? PAL.teal : PAL.blue, {
          roughness: 0.5, metalness: 0.2,
          emissive: f % 2 ? PAL.teal : PAL.blue, emissiveIntensity: 0.7
        }), 0, 0, 0);
      groove.rotation.x = Math.PI / 2;
      groove.rotation.z = f * 1.9;
      groove.position.y = 0.03;
      ground.add(groove);
    }
    for (var r = 0; r < 2; r++) {
      var runner = barGlow(PAL.blue, 1.3, 0.012, 0.02,
        r ? 0.3 : -0.22, 0.024, 0.12 - r * 0.32, 0.45);
      runner.rotation.y = r ? -0.26 : 0.2;
      ground.add(runner);
    }
    for (var b = 0; b < 4; b++) {
      ground.add(V23C.sphere(0.028, b % 2 ? PAL.teal : PAL.blue,
        Math.cos(b * 1.7 + 0.4) * 0.82, 0.045, Math.sin(b * 1.7 + 0.4) * 0.5, {
          roughness: 0.3, emissive: b % 2 ? PAL.teal : PAL.blue, emissiveIntensity: 0.8
        }));
    }
    g.add(ground);

    var pages = [];
    var pageData = [
      [-0.84, 1.02, 0.46, -0.34],
      [0.8, 1.26, 0.38, 0.26],
      [-1.02, 0.62, 0.2, 0.2],
      [1.02, 0.78, 0.5, -0.2],
      [1.06, 1.5, 0.32, 0.38]
    ];
    var pageN = Math.min(pageData.length, Math.max(3, Math.round(5 * qf)));
    for (var pi = 0; pi < pageN; pi++) {
      var pd = pageData[pi];
      var page = new THREE.Group();
      page.position.set(pd[0], pd[1], pd[2]);
      page.rotation.x = -0.24;
      page.rotation.z = pd[3];

      var backSheet = V23C.box(0.27, 0.35, 0.008, PAL.paper, 0.015, -0.012, -0.014, {
        roughness: 0.85, metalness: 0.02
      });
      backSheet.rotation.z = 0.05;
      page.add(backSheet);
      page.add(V23C.box(0.28, 0.36, 0.012, PAL.bone, 0, 0, 0, {
        roughness: 0.9, metalness: 0.01
      }));
      page.add(V23C.box(0.16, 0.012, 0.004, PAL.teal, -0.03, 0.085, 0.008, {
        roughness: 0.6, emissive: PAL.teal, emissiveIntensity: 0.35
      }));
      page.add(V23C.box(0.2, 0.008, 0.004, PAL.ink, -0.015, 0.035, 0.008));
      page.add(V23C.box(0.18, 0.008, 0.004, PAL.ink, -0.025, -0.01, 0.008));
      page.add(V23C.box(0.13, 0.008, 0.004, PAL.ink, -0.05, -0.055, 0.008));
      var dogEar = V23C.box(0.07, 0.07, 0.006, PAL.gold, 0.1, 0.14, 0.01, {
        roughness: 0.4, emissive: PAL.gold, emissiveIntensity: 0.4
      });
      dogEar.rotation.z = 0.62;
      page.add(dogEar);
      var pageGlow = V23C.soft(PAL.blue, 0.7, 0.5, 0, 0, -0.03, 0.1);
      pageGlow.renderOrder = 9;
      page.add(pageGlow);
      pages.push(page);
      g.add(page);
    }

    var glyphs = [];
    var glyphCols = [PAL.teal, PAL.blue, PAL.violet, PAL.gold];
    var glyphN = qty(7, qf, 5);
    for (var gl = 0; gl < glyphN; gl++) {
      var ga = gl / glyphN * TAU + 0.4;
      var gr = 0.7 + (gl % 3) * 0.14;
      var gy = 0.45 + (gl % 4) * 0.28;
      var gx = Math.cos(ga) * gr;
      var gz = 0.3 + Math.sin(ga) * 0.26;
      var gcol = glyphCols[gl % 4];
      var glyph;
      if (gl % 3 === 0) {
        glyph = V23C.mesh(new THREE.TorusGeometry(0.055, 0.011, 3, 14),
          glowMat(gcol, 0.85), gx, gy, gz);
      } else if (gl % 3 === 1) {
        glyph = V23C.mesh(new THREE.OctahedronGeometry(0.05, 0),
          V23C.mat(gcol, {
            roughness: 0.25, metalness: 0.2, emissive: gcol,
            emissiveIntensity: 0.9, transparent: true, opacity: 0.9
          }), gx, gy, gz);
      } else {
        glyph = V23C.cone(0.042, 0.12, 4, gcol, gx, gy, gz, {
          roughness: 0.4, emissive: gcol, emissiveIntensity: 0.7,
          transparent: true, opacity: 0.85
        });
      }
      glyph.userData.baseX = gx;
      glyph.userData.baseY = gy;
      glyphs.push(glyph);
      g.add(glyph);
    }

    V23C.addAnim(g, { type: 'v23c-bands', bands: layers });
    V23C.addAnim(g, { type: 'v23c-bands', bands: pages });
    V23C.addAnim(g, { type: 'v23c-dissolve', parts: glyphs, rise: 0.5, opacity: 0.7 });
    return g;
  }

  /* -----------------------------------------------------------------------
     CONSTELACIÓN DE LOGROS · legendario
     Osa Mayor real (7 estrellas sólidas y 7 líneas), órbita de cuentas,
     cúpula celeste de arcos, partículas y proyección en el suelo.
     --------------------------------------------------------------------- */
  var DIPPER = [
    [-1.02, 0.22], [-0.7, -0.14], [-0.42, 0.14], [-0.78, 0.46],
    [0.04, 0.32], [0.56, 0.44], [1.04, 0.18]
  ];
  var DIPPER_LINKS = [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [4, 5], [5, 6]];
  var DIPPER_COLS = [PAL.gold, PAL.pale, PAL.blue, PAL.pale, PAL.gold, PAL.pale, PAL.gold];

  function buildConstelacion(c, qf, avatar, slot) {
    var g = animBag(new THREE.Group());
    var orbit = new THREE.Group();
    orbit.position.set(0, 1.42, 0.12);
    orbit.rotation.x = -0.23;
    orbit.rotation.z = 0.2;
    /* La Osa Mayor se compacta alrededor del torso: el héroe recupera el
       encuadre y la constelación sigue orbitando al mismo nivel del pecho. */
    var SC = 0.62;

    var twinklers = [];
    for (var i = 0; i < DIPPER.length; i++) {
      var pt = DIPPER[i];
      var main = i === 0 || i === 6;
      var size = 0.07 + (i % 3) * 0.017 + (main ? 0.022 : 0);
      var star = V23C.mesh(new THREE.OctahedronGeometry(size, 0),
        V23C.mat(DIPPER_COLS[i], {
          roughness: 0.26, metalness: 0.22, emissive: DIPPER_COLS[i],
          emissiveIntensity: 0.95, transparent: true, opacity: 0.96
        }), pt[0] * SC, pt[1] * SC, (i % 3) * 0.03 - 0.03);
      star.rotation.z = i * 0.5;
      orbit.add(star);
      twinklers.push(star);

      var halo = V23C.glow(DIPPER_COLS[i], 0.34 + size * 2, pt[0] * SC, pt[1] * SC, star.position.z + 0.02, 0.45);
      halo.renderOrder = 5;
      orbit.add(halo);
    }

    for (var l = 0; l < DIPPER_LINKS.length; l++) {
      var a = DIPPER[DIPPER_LINKS[l][0]];
      var b = DIPPER[DIPPER_LINKS[l][1]];
      orbit.add(rodXY(a[0] * SC, a[1] * SC, b[0] * SC, b[1] * SC, 0.011, l % 2 ? PAL.violet : PAL.gold, 0.01, 0.95));
      orbit.add(V23C.line([
        new THREE.Vector3(a[0] * SC, a[1] * SC, 0.03),
        new THREE.Vector3(b[0] * SC, b[1] * SC, 0.03)
      ], PAL.gold, 0.5));
    }

    for (var e = 0; e < 5; e++) {
      var ea = e / 5 * TAU + 0.6;
      var er = (0.72 + (e % 2) * 0.18) * SC;
      var field = V23C.mesh(new THREE.OctahedronGeometry(0.03 + (e % 2) * 0.012, 0),
        V23C.mat(e % 2 ? PAL.violet : PAL.pale, {
          roughness: 0.3, metalness: 0.2, emissive: PAL.gold,
          emissiveIntensity: 0.8, transparent: true, opacity: 0.9
        }), Math.cos(ea) * er, (0.35 + (e % 3) * 0.18) * SC, Math.sin(ea) * 0.2 * SC);
      orbit.add(field);
      twinklers.push(field);
    }
    g.add(orbit);

    /* Cúpula celeste contenida: tres arcos anidados detrás del héroe. Su
       cumbre queda a la altura de la cabeza, no por encima del retrato. */
    var dome = new THREE.Group();
    dome.position.set(0, 1.12, -0.22);
    var archA = V23C.mesh(new THREE.TorusGeometry(0.82, 0.008, 3, 64, Math.PI), glowMat(PAL.violet, 0.4), 0, 0, -0.04);
    dome.add(archA);
    var archB = V23C.mesh(new THREE.TorusGeometry(0.78, 0.008, 3, 64, Math.PI), glowMat(PAL.blue, 0.32), 0, 0, -0.14);
    archB.rotation.z = 0.04;
    dome.add(archB);
    var archC = V23C.mesh(new THREE.TorusGeometry(0.72, 0.006, 3, 56, Math.PI), glowMat(PAL.teal, 0.26), 0, 0, -0.24);
    archC.rotation.z = -0.05;
    dome.add(archC);
    var beadPos = [[0, 0.82, -0.04], [-0.6, 0.5, -0.14], [0.6, 0.5, -0.14]];
    for (var db = 0; db < beadPos.length; db++) {
      var bead = V23C.mesh(new THREE.OctahedronGeometry(0.045, 0),
        V23C.mat(db === 1 ? PAL.pale : PAL.gold, {
          roughness: 0.25, metalness: 0.2, emissive: PAL.gold,
          emissiveIntensity: 0.9, transparent: true, opacity: 0.9
        }), beadPos[db][0], beadPos[db][1], beadPos[db][2]);
      dome.add(bead);
      twinklers.push(bead);
    }
    g.add(dome);

    var belt = new THREE.Group();
    belt.position.y = 1.08;
    var beltRing = V23C.mesh(new THREE.TorusGeometry(0.8, 0.008, 3, 72), glowMat(PAL.violet, 0.32), 0, 0, 0);
    beltRing.rotation.x = Math.PI / 2;
    belt.add(beltRing);
    var tiltRing = V23C.mesh(new THREE.TorusGeometry(0.84, 0.006, 3, 72), glowMat(PAL.teal, 0.18), 0, 0, 0);
    tiltRing.rotation.x = Math.PI / 2;
    tiltRing.rotation.z = 0.22;
    belt.add(tiltRing);
    var beltBeads = qty(9, qf, 7);
    for (var bd = 0; bd < beltBeads; bd++) {
      var ba = bd / beltBeads * TAU;
      var beltBead = V23C.mesh(new THREE.OctahedronGeometry(0.032 + (bd % 2) * 0.012, 0),
        V23C.mat(bd % 2 ? PAL.pale : PAL.gold, {
          roughness: 0.28, metalness: 0.2, emissive: PAL.gold,
          emissiveIntensity: 0.85, transparent: true, opacity: 0.95
        }), Math.cos(ba) * 0.8, 0, Math.sin(ba) * 0.8);
      belt.add(beltBead);
      twinklers.push(beltBead);
    }
    g.add(belt);

    var proj = new THREE.Group();
    proj.position.set(0, 0.03, 0.1);
    proj.rotation.y = 0.3;
    var projScale = 0.52;
    for (var d = 0; d < DIPPER.length; d++) {
      var gp = DIPPER[d];
      proj.add(V23C.cyl(0.034, 0.034, 0.012, 6, d % 2 ? PAL.teal : PAL.gold,
        gp[0] * projScale, 0, gp[1] * projScale, {
          roughness: 0.4, metalness: 0.3,
          emissive: d % 2 ? PAL.teal : PAL.gold, emissiveIntensity: 0.8
        }));
    }
    for (var pl = 0; pl < DIPPER_LINKS.length; pl++) {
      var ga = DIPPER[DIPPER_LINKS[pl][0]];
      var gb = DIPPER[DIPPER_LINKS[pl][1]];
      proj.add(rodXZ(ga[0] * projScale, ga[1] * projScale, gb[0] * projScale, gb[1] * projScale, 0.01, PAL.gold, 0.012, 0.45));
    }
    var projArc = V23C.mesh(new THREE.TorusGeometry(0.75, 0.006, 3, 48, Math.PI * 1.3), glowMat(PAL.violet, 0.22), 0, 0, 0);
    projArc.rotation.x = Math.PI / 2;
    projArc.rotation.z = 0.6;
    proj.add(projArc);
    g.add(proj);

    var motes = new THREE.Group();
    var moteN = qty(14, qf, 9);
    for (var m = 0; m < moteN; m++) {
      var ma = m / moteN * TAU + 0.3;
      var mr = 0.55 + (m % 4) * 0.045;
      var my = 0.38 + (m % 6) * 0.105;
      var mote = V23C.soft(m % 3 ? PAL.violet : PAL.blue, 0.12, 0.12,
        Math.cos(ma) * mr, my, Math.sin(ma) * mr * 0.85, 0.45);
      mote.renderOrder = 6;
      motes.add(mote);
      if (m % 2 === 0) {
        var dust = V23C.mesh(new THREE.OctahedronGeometry(0.016, 0),
          V23C.mat(PAL.pale, {
            roughness: 0.3, metalness: 0.2, emissive: PAL.gold,
            emissiveIntensity: 0.8, transparent: true, opacity: 0.9
          }), Math.cos(ma) * mr, my, Math.sin(ma) * mr * 0.85);
        motes.add(dust);
        twinklers.push(dust);
      }
    }
    g.add(motes);

    /* Órbita de la constelación, del cinturón y de las partículas + parpadeo
       de las estrellas sólidas. */
    V23C.addAnim(g, { type: 'v23c-bands', bands: [orbit, belt, motes] });
    V23C.addAnim(g, { type: 'v23c-twinkle', stars: twinklers, baseOpacity: 0.85 });
    return g;
  }

  V23C.register('c-efecto-aura', buildAlba,
    'Disco solar tras el torso, corona de rayos giratoria, abanico ascendente y horizonte.');
  V23C.register('x-aura-amanecer', buildAmanecer,
    'Cintas horizontales, anillo rúnico en el pecho y anillo rúnico proyectado.');
  V23C.register('c-efecto-bruma', buildBruma,
    'Cuatro capas de niebla baja, páginas con renglones y glifos flotantes.');
  V23C.register('c-efecto-constelacion', buildConstelacion,
    'Osa Mayor sólida orbitando, cúpula celeste, partículas y proyección en el suelo.');
})();
