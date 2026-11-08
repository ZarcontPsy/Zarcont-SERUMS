'use strict';
/* =========================================================================
   Driver del banco de pruebas (navegador). Se inyecta después de
   part2-world.js + part3c-cosmetics-models.js dentro del mismo IIFE.
   Mide:
     1) pares de caras coplanares del mismo sentido que se solapan
        (causa directa de z-fighting), incluidas mallas distintas;
     2) parpadeo real: dos fotogramas con cámara desplazada 0,006 rad y
        recuento de píxeles interiores planos que cambian de color.
   Todo con el renderer, escena, luces y cámara reales del juego
   (near/far y shadowMap tal como están en part2-world.js).
   ========================================================================= */
(function () {
  'use strict';

  var V = window.__V21;
  var logEl = document.getElementById('log');
  function log(message) { if (logEl) logEl.textContent = String(message); }
  if (!V) {
    window.__V21RUN = { error: 'falta window.__V21 (el modelo no cargó)' };
    log('ERROR: falta el puente __V21');
    return;
  }

  var THREE = V.THREE;
  var W = 384;
  var H = 384;
  var renderer = V.renderer;
  var scene = V.scene;
  var camera = V.camera;
  var gl = renderer.getContext();

  /* ---------------------------------------------------------------------
     Escenario aislado: ocultamos el atrio/arena y dejamos solo luces,
     suelo y el modelo bajo prueba.
     --------------------------------------------------------------------- */
  V.hubGroup.visible = false;
  V.arenaGroup.visible = false;
  if (V.sceneRoot) V.sceneRoot.visible = true;
  if (V.starField) V.starField.visible = false;
  if (V.moon) V.moon.visible = false;
  if (V.sparkLayer) V.sparkLayer.visible = false;
  if (V.bolt) V.bolt.visible = false;
  if (V.heroShield) V.heroShield.visible = false;
  scene.fog = null;
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = true;
  camera.aspect = W / H;
  camera.fov = 42;
  camera.updateProjectionMatrix();
  if (V.moonLight) {
    V.moonLight.position.set(-8, 17, 11);
    V.moonLight.target.position.set(0, 1, 0);
    V.moonLight.target.updateMatrixWorld();
  }
  if (V.rimLight) {
    V.rimLight.position.set(-10, 7, -8);
    V.rimLight.target.position.set(0, 1, 0);
    V.rimLight.target.updateMatrixWorld();
  }
  if (V.ambient) V.ambient.intensity = Math.max(V.ambient.intensity, 1.0);

  var stage = new THREE.Group();
  stage.name = 'stage';
  scene.add(stage);
  var ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshLambertMaterial({ color: 0x2b3342 }));
  ground.name = 'ground';
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  stage.add(ground);
  var models = new THREE.Group();
  models.name = 'models';
  stage.add(models);

  var pixel = new Uint8Array(W * H * 4);

  /* ---------------------------------------------------------------------
     Captura y comparación de fotogramas
     --------------------------------------------------------------------- */
  function renderFrame() {
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    return pixel.slice();
  }

  function placeCamera(dist, yaw, pitch, targetY) {
    var horizontal = Math.cos(pitch) * dist;
    camera.position.set(Math.sin(yaw) * horizontal, targetY + Math.sin(pitch) * dist, Math.cos(yaw) * horizontal);
    camera.lookAt(0, targetY, 0);
    camera.updateMatrixWorld();
  }

  function flatAt(buf, x, y, tol) {
    /* Radio 3 px: un desplazamiento de cámara subpíxel no puede convertir
       este píxel en otra región plana distinta, así que los bordes/
       siluetas no cuentan como parpadeo. */
    var i = (y * W + x) * 4;
    var r = buf[i], g = buf[i + 1], b = buf[i + 2];
    for (var dy = -3; dy <= 3; dy += 3) {
      for (var dx = -3; dx <= 3; dx += 3) {
        if (!dx && !dy) continue;
        var j = ((y + dy) * W + (x + dx)) * 4;
        if (buf[j + 3] < 250) return false;
        if (Math.abs(buf[j] - r) > tol || Math.abs(buf[j + 1] - g) > tol || Math.abs(buf[j + 2] - b) > tol) return false;
      }
    }
    return true;
  }

  function diffFrames(a, b) {
    var changed = 0, flat = 0, maxD = 0;
    for (var y = 2; y < H - 2; y++) {
      for (var x = 2; x < W - 2; x++) {
        var i = (y * W + x) * 4;
        if (a[i + 3] < 250 || b[i + 3] < 250) continue;
        var dr = a[i] - b[i];
        var dg = a[i + 1] - b[i + 1];
        var db = a[i + 2] - b[i + 2];
        var d = Math.abs(dr);
        if (Math.abs(dg) > d) d = Math.abs(dg);
        if (Math.abs(db) > d) d = Math.abs(db);
        if (d < 18) continue;
        changed++;
        if (d > maxD) maxD = d;
        if (flatAt(a, x, y, 7) && flatAt(b, x, y, 7)) flat++;
      }
    }
    return { changed: changed, flat: flat, maxD: maxD };
  }

  function snapshot(name) {
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
    var c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#0b0f18';
    ctx.fillRect(0, 0, W, H);
    try { ctx.drawImage(renderer.domElement, 0, 0, W, H); } catch (e) { return null; }
    return { name: name, data: c.toDataURL('image/jpeg', 0.84) };
  }

  /* Captura de diagnóstico: pinta en magenta los píxeles interiores planos
     que cambian entre dos fotogramas con la cámara desplazada. */
  function maskSnapshot(name, spec) {
    placeCamera(spec.dist, spec.angle, spec.pitch, spec.targetY);
    var frameA = renderFrame();
    placeCamera(spec.dist, spec.angle + YAW_STEP, spec.pitch + 0.00012, spec.targetY);
    var frameB = renderFrame();
    var c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#0b0f18';
    ctx.fillRect(0, 0, W, H);
    try { ctx.drawImage(renderer.domElement, 0, 0, W, H); } catch (e) { return null; }
    var image = ctx.getImageData(0, 0, W, H);
    var data = image.data;
    var marked = 0;
    for (var y = 2; y < H - 2; y++) {
      for (var x = 2; x < W - 2; x++) {
        var i = (y * W + x) * 4;
        if (frameA[i + 3] < 250 || frameB[i + 3] < 250) continue;
        var d = Math.abs(frameA[i] - frameB[i]);
        if (Math.abs(frameA[i + 1] - frameB[i + 1]) > d) d = Math.abs(frameA[i + 1] - frameB[i + 1]);
        if (Math.abs(frameA[i + 2] - frameB[i + 2]) > d) d = Math.abs(frameA[i + 2] - frameB[i + 2]);
        if (d < 18) continue;
        if (!flatAt(frameA, x, y, 7) || !flatAt(frameB, x, y, 7)) continue;
        var j = ((H - 1 - y) * W + x) * 4;
        data[j] = 255; data[j + 1] = 0; data[j + 2] = 255; data[j + 3] = 255;
        marked++;
      }
    }
    ctx.putImageData(image, 0, 0);
    return { name: name, data: c.toDataURL('image/jpeg', 0.84), marked: marked };
  }

  /* ---------------------------------------------------------------------
     Auditoría geométrica de caras coplanares
     --------------------------------------------------------------------- */
  function visibleChain(node) {
    var p = node;
    while (p) {
      if (p.visible === false) return false;
      p = p.parent;
    }
    return true;
  }
  function labelOf(node) {
    var p = node;
    while (p) {
      if (p.name && p.name.indexOf('voxels-') !== 0) return p.name;
      if (p.userData && p.userData.cosmeticId) {
        return 'cosmetic:' + (p.userData.slot || '?') + ':' + p.userData.cosmeticId;
      }
      p = p.parent;
    }
    return 'unnamed';
  }
  function materialColor(material) {
    if (!material) return { r: 0, g: 0, b: 0 };
    var c = material.color;
    if (!c) return { r: 1, g: 1, b: 1 };
    return { r: c.r, g: c.g, b: c.b };
  }
  function colorDelta(a, b) {
    return Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b));
  }

  /* Solapamiento real de dos triángulos coplanares en 2D (SAT). El AABB por
     ejes del mundo daba falsos positivos en grupos rotados/escalados. */
  function triangleOverlap(A, B) {
    var axes = [
      [A[1] - A[3], A[2] - A[0]],
      [A[3] - A[5], A[4] - A[2]],
      [A[5] - A[1], A[0] - A[4]],
      [B[1] - B[3], B[2] - B[0]],
      [B[3] - B[5], B[4] - B[2]],
      [B[5] - B[1], B[0] - B[4]]
    ];
    for (var i = 0; i < axes.length; i++) {
      var nx = axes[i][0], ny = axes[i][1];
      var len = Math.sqrt(nx * nx + ny * ny);
      if (len < 1e-12) continue;
      nx /= len; ny /= len;
      var a0 = A[0] * nx + A[1] * ny;
      var a1 = A[2] * nx + A[3] * ny;
      var a2 = A[4] * nx + A[5] * ny;
      var b0 = B[0] * nx + B[1] * ny;
      var b1 = B[2] * nx + B[3] * ny;
      var b2 = B[4] * nx + B[5] * ny;
      var aMin = Math.min(a0, a1, a2), aMax = Math.max(a0, a1, a2);
      var bMin = Math.min(b0, b1, b2), bMax = Math.max(b0, b1, b2);
      if (aMax <= bMin + 1e-7 || bMax <= aMin + 1e-7) return false;
    }
    return true;
  }

  function auditCoplanar(root) {
    root.updateMatrixWorld(true);
    var buckets = Object.create(null);
    var triangles = 0;
    var a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    var meshId = 0;
    var labels = [];

    root.traverse(function (node) {
      if (!node.isMesh || !node.geometry || !node.geometry.attributes || !node.geometry.attributes.position) return;
      if (!visibleChain(node)) return;
      var material = Array.isArray(node.material) ? node.material[0] : node.material;
      if (!material) return;
      if (material.transparent && material.depthWrite === false) return;
      if (material.wireframe) return;
      if (material.opacity === 0) return;
      meshId += 1;
      var mid = meshId;
      var label = labelOf(node);
      labels[mid] = label;
      var layer = material.polygonOffset ? (Number(material.polygonOffsetUnits) || 0) : 0;
      var geo = node.geometry;
      var pos = geo.attributes.position;
      var colAttr = geo.attributes.color;
      var index = geo.index;
      var count = index ? index.count : pos.count;
      var matrix = node.matrixWorld;
      var baseColor = materialColor(material);

      for (var t = 0; t + 2 < count; t += 3) {
        var ia = index ? index.getX(t) : t;
        var ib = index ? index.getX(t + 1) : t + 1;
        var ic = index ? index.getX(t + 2) : t + 2;
        a.fromBufferAttribute(pos, ia).applyMatrix4(matrix);
        b.fromBufferAttribute(pos, ib).applyMatrix4(matrix);
        c.fromBufferAttribute(pos, ic).applyMatrix4(matrix);
        var ux = b.x - a.x, uy = b.y - a.y, uz = b.z - a.z;
        var vx = c.x - a.x, vy = c.y - a.y, vz = c.z - a.z;
        var nx = uy * vz - uz * vy;
        var ny = uz * vx - ux * vz;
        var nz = ux * vy - uy * vx;
        var len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        if (len < 1e-9) continue;
        nx /= len; ny /= len; nz /= len;
        var axis = Math.abs(nx) >= Math.abs(ny) && Math.abs(nx) >= Math.abs(nz) ? 0 : (Math.abs(ny) >= Math.abs(nz) ? 1 : 2);
        var plane = nx * a.x + ny * a.y + nz * a.z;
        var key = (Math.round(nx * 1000) / 1000) + ',' + (Math.round(ny * 1000) / 1000) + ',' + (Math.round(nz * 1000) / 1000) +
          '|' + axis + '|' + Math.round(plane * 2000);
        var tri = {
          mesh: mid,
          layer: layer,
          plane: plane,
          axis: axis,
          cx: (a.x + b.x + c.x) / 3,
          cy: (a.y + b.y + c.y) / 3,
          cz: (a.z + b.z + c.z) / 3,
          minU: 0,
          maxU: 0,
          minV: 0,
          maxV: 0,
          pts: null,
          color: null
        };
        var pa = axis === 0 ? [a.y, a.z] : axis === 1 ? [a.x, a.z] : [a.x, a.y];
        var pb = axis === 0 ? [b.y, b.z] : axis === 1 ? [b.x, b.z] : [b.x, b.y];
        var pc = axis === 0 ? [c.y, c.z] : axis === 1 ? [c.x, c.z] : [c.x, c.y];
        tri.pts = [pa[0], pa[1], pb[0], pb[1], pc[0], pc[1]];
        tri.minU = Math.min(pa[0], pb[0], pc[0]);
        tri.maxU = Math.max(pa[0], pb[0], pc[0]);
        tri.minV = Math.min(pa[1], pb[1], pc[1]);
        tri.maxV = Math.max(pa[1], pb[1], pc[1]);
        if (colAttr && colAttr.count > ia) {
          tri.color = { r: colAttr.getX(ia), g: colAttr.getY(ia), b: colAttr.getZ(ia) };
        } else {
          tri.color = baseColor;
        }
        if (!buckets[key]) buckets[key] = [];
        buckets[key].push(tri);
        triangles++;
      }
    });

    var pairs = 0, sameMesh = 0, crossMesh = 0, colorPairs = 0, crossColorPairs = 0;
    var sameMeshColorPairs = 0, unresolvedCrossColorPairs = 0;
    var exactColorPairs = 0, exactCrossColorPairs = 0, exactSameMeshColorPairs = 0, exactUnresolvedCrossColorPairs = 0;
    var samples = [];
    var grouped = Object.create(null);
    var keys = Object.keys(buckets);
    for (var k = 0; k < keys.length; k++) {
      var list = buckets[keys[k]];
      if (list.length < 2) continue;
      var limit = list.length > 900 ? 900 : list.length;
      for (var i = 0; i < limit; i++) {
        var A = list[i];
        for (var j = i + 1; j < limit; j++) {
          var B = list[j];
          var ou = Math.min(A.maxU, B.maxU) - Math.max(A.minU, B.minU);
          if (ou <= 0.0001) continue;
          var ov = Math.min(A.maxV, B.maxV) - Math.max(A.minV, B.minV);
          if (ov <= 0.0001) continue;
          if (!triangleOverlap(A.pts, B.pts)) continue;
          pairs++;
          var differentMesh = A.mesh !== B.mesh;
          if (differentMesh) crossMesh++; else sameMesh++;
          var differentColor = colorDelta(A.color, B.color) > 0.02;
          if (differentColor) {
            colorPairs++;
            var exact = Math.abs(A.plane - B.plane) <= 1e-5;
            if (exact) exactColorPairs++;
            if (differentMesh) {
              crossColorPairs++;
              if (exact) exactCrossColorPairs++;
              /* polygonOffset distinto => la profundidad ya no empata:
                 no hay parpadeo. Solo cuenta si comparten capa. */
              if (A.layer === B.layer) {
                unresolvedCrossColorPairs++;
                if (exact) exactUnresolvedCrossColorPairs++;
              }
            } else {
              sameMeshColorPairs++;
              if (exact) exactSameMeshColorPairs++;
            }
            var la = labels[A.mesh] || '?';
            var lb = labels[B.mesh] || '?';
            var gkey = la < lb ? (la + ' <> ' + lb) : (lb + ' <> ' + la);
            if (!differentMesh) gkey += ' · misma malla';
            if (!grouped[gkey]) grouped[gkey] = 0;
            grouped[gkey] += 1;
            if (exact && (!differentMesh || A.layer === B.layer) && samples.length < 15) {
              samples.push({
                pair: gkey,
                sameMesh: !differentMesh,
                layer: A.layer,
                axis: A.axis,
                plane: Math.round(A.plane * 1000) / 1000,
                colorA: [Math.round(A.color.r * 1000) / 1000, Math.round(A.color.g * 1000) / 1000, Math.round(A.color.b * 1000) / 1000],
                colorB: [Math.round(B.color.r * 1000) / 1000, Math.round(B.color.g * 1000) / 1000, Math.round(B.color.b * 1000) / 1000],
                centroidA: [Math.round(A.cx * 1000) / 1000, Math.round(A.cy * 1000) / 1000, Math.round(A.cz * 1000) / 1000],
                centroidB: [Math.round(B.cx * 1000) / 1000, Math.round(B.cy * 1000) / 1000, Math.round(B.cz * 1000) / 1000]
              });
            }
          }
        }
      }
    }
    var top = Object.keys(grouped).map(function (key) { return { pair: key, count: grouped[key] }; })
      .sort(function (x, y) { return y.count - x.count; })
      .slice(0, 12);
    return {
      triangles: triangles,
      pairs: pairs,
      sameMesh: sameMesh,
      crossMesh: crossMesh,
      colorPairs: colorPairs,
      exactColorPairs: exactColorPairs,
      crossColorPairs: crossColorPairs,
      crossExactColorPairs: exactCrossColorPairs,
      sameMeshColorPairs: sameMeshColorPairs,
      sameMeshExactColorPairs: exactSameMeshColorPairs,
      unresolvedCrossColorPairs: unresolvedCrossColorPairs,
      unresolvedColorPairs: sameMeshColorPairs + unresolvedCrossColorPairs,
      exactUnresolvedColorPairs: exactSameMeshColorPairs + exactUnresolvedCrossColorPairs,
      samples: samples,
      top: top
    };
  }

  /* ---------------------------------------------------------------------
     Modelos
     --------------------------------------------------------------------- */
  var MODEL_SLOTS = ['cabeza', 'peinado', 'torso', 'piernas', 'accesorios', 'extras', 'amuletos', 'efectos', 'marcos', 'mascota', 'estela'];
  var FULL_OUTFIT = {
    cabeza: 'c-cabeza-corona',
    peinado: 'c-peinado-coleta',
    torso: 'c-torso-manto',
    piernas: 'c-piernas-falda',
    accesorios: 'c-accesorios-gafas',
    extras: 'x-trofeo-salud',
    amuletos: 'c-amuleto-enfoque',
    efectos: 'c-efecto-aura',
    marcos: 'c-marco-constelacion',
    mascota: 'x-luciernaga-observatorio',
    estela: 'x-estela-racha'
  };

  var heroIds = Object.keys(V.HERO_LOOKS);
  var cosmeticById = V.COSMETIC_BY_ID;
  var cosmeticIds = Object.keys(cosmeticById);
  var bySlot = {};
  cosmeticIds.forEach(function (id) {
    var c = cosmeticById[id];
    if (!c) return;
    if (MODEL_SLOTS.indexOf(c.category) === -1) return;
    (bySlot[c.category] || (bySlot[c.category] = [])).push(id);
  });

  function clearModels() {
    while (models.children.length) V.disposeObject(models.children[0]);
  }
  function nameAvatar(av) {
    if (!av) return;
    if (av.root) av.root.name = 'hero:' + av.id;
    if (av.body) av.body.name = 'hero-body';
    if (av.torso) av.torso.name = 'hero-torso';
    if (av.head) av.head.name = 'hero-head';
    if (av.leftArm) av.leftArm.name = 'hero-arm-left';
    if (av.rightArm) av.rightArm.name = 'hero-arm-right';
    if (av.leftLeg) av.leftLeg.name = 'hero-leg-left';
    if (av.rightLeg) av.rightLeg.name = 'hero-leg-right';
    if (av.weapon) av.weapon.name = 'hero-weapon';
    if (av.cape) av.cape.name = 'base-cape';
    if (av.hairTail) av.hairTail.name = 'base-hair-tail';
    if (av.floaters) av.floaters.name = 'base-floaters';
    var ud = av.head && av.head.userData ? av.head.userData : {};
    (ud.baseHatGroups || []).forEach(function (group, i) { if (group) group.name = 'base-hat-' + i; });
    (ud.baseHairGroups || []).forEach(function (group, i) { if (group) group.name = 'base-hair-' + i; });
    (ud.baseDetailGroups || []).forEach(function (group, i) { if (group) group.name = 'base-head-details-' + i; });
    if (av.cosmetics && av.cosmetics.groups) {
      av.cosmetics.groups.forEach(function (group) {
        if (!group) return;
        group.name = 'cosmetic:' + (group.userData.slot || '?') + ':' + (group.userData.cosmeticId || '?');
      });
    }
  }
  function poseAvatar(av) {
    if (!av) return;
    av.body.rotation.y = -0.02;
    av.head.rotation.y = 0.12;
    av.head.rotation.z = -0.012;
    av.rightArm.rotation.x = -0.16;
    av.rightArm.rotation.z = 0.52;
    av.weapon.rotation.z = -0.62;
    av.weapon.rotation.x = 0.05;
    av.leftArm.rotation.x = -0.1;
    av.leftLeg.rotation.x = 0.04;
    av.rightLeg.rotation.x = -0.05;
    if (av.cape) av.cape.rotation.x = -0.05;
    if (av.hairTail) av.hairTail.rotation.x = 0.04;
  }
  function buildHero(id, outfit) {
    clearModels();
    var av = V.buildHeroAvatar(id);
    if (V.applyOutfitToAvatar) V.applyOutfitToAvatar(av, id, outfit || {});
    nameAvatar(av);
    poseAvatar(av);
    if (V.animateAvatarCosmetics) V.animateAvatarCosmetics(av, 0.016, 3.2, false, 0);
    models.add(av.root);
    av.root.position.set(0, 0, 0);
    return av;
  }
  function buildGuardian(areaId) {
    clearModels();
    var g = V.buildGuardian(areaId);
    if (g.root) g.root.name = 'guardian:' + areaId;
    if (g.body) g.body.name = 'guardian-body';
    if (g.label) g.label.visible = false;
    if (g.rings) g.rings.forEach(function (item, i) { item.mesh.rotation[item.axis || 'y'] += 0.4 * (i + 1); });
    if (g.gears) g.gears.forEach(function (item, i) { item.mesh.rotation.z += 0.5 * (i + 1); });
    if (g.shards) g.shards.forEach(function (item, i) { item.group.rotation.y = i * 1.3; });
    if (g.ward) g.ward.material.opacity = 0.14;
    models.add(g.root);
    g.root.position.set(0, 0, 0);
    return g;
  }

  /* ---------------------------------------------------------------------
     Vistas y parpadeo
     --------------------------------------------------------------------- */
  var HERO_VIEWS = [
    /* 1,12 m quedaba dentro del pelo/manto de teo (artefacto de clipping del
       near plane, no del juego: la cámara real nunca baja de ~4,8 m). */
    { label: 'close', d: 1.7, pitch: 0.05, targetY: 1.62 },
    { label: 'mid', d: 3.05, pitch: 0.16, targetY: 1.12 },
    { label: 'far', d: 8.6, pitch: 0.24, targetY: 1.02 }
  ];
  var GUARDIAN_VIEWS = [
    { label: 'close', d: 2.4, pitch: 0.08, targetY: 1.7 },
    { label: 'mid', d: 5.2, pitch: 0.16, targetY: 1.7 },
    { label: 'far', d: 9.5, pitch: 0.22, targetY: 1.6 }
  ];
  var ANGLES = [0.55, 2.1, 3.6, 5.15];
  var YAW_STEP = 0.0014;

  function runViews(views, angles, caseName) {
    var out = { name: caseName, views: [], worst: null };
    for (var vi = 0; vi < views.length; vi++) {
      var view = views[vi];
      for (var ai = 0; ai < angles.length; ai++) {
        var yaw = angles[ai];
        placeCamera(view.d, yaw, view.pitch, view.targetY);
        var frameA = renderFrame();
        placeCamera(view.d, yaw + YAW_STEP, view.pitch + 0.00012, view.targetY);
        var frameB = renderFrame();
        var d = diffFrames(frameA, frameB);
        var row = {
          view: view.label,
          dist: view.d,
          angle: Math.round(yaw * 1000) / 1000,
          changed: d.changed,
          flat: d.flat,
          maxD: d.maxD
        };
        out.views.push(row);
        if (!out.worst || row.flat > out.worst.flat || (row.flat === out.worst.flat && row.changed > out.worst.changed)) {
          out.worst = { view: view.label, dist: view.d, angle: yaw, pitch: view.pitch, targetY: view.targetY, flat: row.flat, changed: row.changed, maxD: row.maxD };
        }
      }
    }
    return out;
  }

  function sumFlat(views) {
    var total = 0;
    views.forEach(function (r) { total += r.flat; });
    return total;
  }

  function nextTick() {
    return new Promise(function (resolve) { setTimeout(resolve, 0); });
  }

  /* ---------------------------------------------------------------------
     Informe
     --------------------------------------------------------------------- */
  /* Diagnóstico puntual de mergedVoxels con las cajas del peinado coleta. */
  function runProbe() {
    var boxes = [
      [0, 0.56, -0.02, 0.53, 0.16, 0.47, '#633d27'],
      [-0.22, 0.42, -0.1, 0.09, 0.42, 0.23, '#633d27'],
      [0.23, 0.3, -0.29, 0.15, 0.58, 0.13, '#633d27'],
      [0.27, 0.01, -0.35, 0.12, 0.26, 0.1, '#633d27'],
      [0.25, 0.44, -0.29, 0.18, 0.07, 0.15, '#e4c07a', true],
      [0.28, 0.4, -0.31, 0.12, 0.12, 0.03, '#69d3c1', true]
    ];
    var group = V.mergedVoxels(boxes);
    var holder = new THREE.Group();
    holder.add(group);
    stage.add(holder);
    var audit = auditCoplanar(holder);
    var meshes = [];
    group.traverse(function (node) {
      if (!node.isMesh) return;
      meshes.push({
        name: node.name,
        vertices: node.geometry.attributes.position.count,
        triangles: node.geometry.index ? node.geometry.index.count / 3 : node.geometry.attributes.position.count / 3,
        layer: node.material.polygonOffset ? node.material.polygonOffsetUnits : 0
      });
    });
    return { probe: 'coleta', audit: audit, meshes: meshes, stats: group.userData.voxelStats };
  }

  function runProbeAvatar() {
    var av = buildHero('ilan', { peinado: 'c-peinado-coleta' });
    var group = null;
    (av.cosmetics.groups || []).forEach(function (item) { if (item.userData.slot === 'peinado') group = item; });
    var meshes = [];
    if (group) {
      group.traverse(function (node) {
        if (!node.isMesh) return;
        var colors = [];
        var col = node.geometry.attributes.color;
        if (col) {
          for (var i = 0; i < col.count && colors.length < 12; i += 4) {
            var key = [col.getX(i), col.getY(i), col.getZ(i)].map(function (v) { return Math.round(v * 1000) / 1000; }).join(',');
            if (colors.indexOf(key) === -1) colors.push(key);
          }
        }
        meshes.push({
          name: node.name,
          parent: labelOf(node),
          triangles: node.geometry.index ? node.geometry.index.count / 3 : node.geometry.attributes.position.count / 3,
          layer: node.material.polygonOffset ? node.material.polygonOffsetUnits : 0,
          colors: colors
        });
      });
    }
    var audit = auditCoplanar(av.root);
    return { probe: 'avatar-coleta', groupName: group && group.name, meshes: meshes, audit: audit };
  }

  function runProbeLayers() {
    var av = buildHero('teo', FULL_OUTFIT);
    var out = [];
    av.root.traverse(function (node) {
      if (!node.isMesh) return;
      var layer = node.material.polygonOffset ? node.material.polygonOffsetUnits : 0;
      var parentNames = [];
      var p = node.parent;
      while (p && parentNames.length < 4) { parentNames.push(p.name || '(sin nombre)'); p = p.parent; }
      out.push({ mesh: node.name, parent: labelOf(node), chain: parentNames.join(' < '), layer: layer, material: node.material.uuid.slice(0, 8) });
    });
    var audit = auditCoplanar(av.root);
    return { probe: 'layers-teo', meshes: out, audit: audit };
  }

  async function run(options) {
    var opts = options || {};
    if (opts.mode === 'probe') return runProbe(opts);
    if (opts.mode === 'probe-avatar') return runProbeAvatar(opts);
    if (opts.mode === 'probe-layers') return runProbeLayers(opts);
    var full = opts.mode !== 'quick';
    var report = {
      generatedAt: new Date().toISOString(),
      harness: 'SERUMS QUEST V2.1 · Agente 1 · geometría/parpadeo',
      env: {},
      warnings: [],
      cases: [],
      shots: []
    };
    var debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    report.env.webgl = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    report.env.cameraNear = V.camera.near;
    report.env.cameraFar = V.camera.far;
    report.env.cameraFov = V.camera.fov;
    report.env.shadowTypeInitial = V.shadowTypeInitial;
    report.env.pcfSoftType = V.shadowSoftType;
    report.env.pcfType = V.shadowPcfType;
    report.env.camera = { near: V.camera.near, far: V.camera.far };
    report.env.userAgent = navigator.userAgent;

    log('control de determinismo…');
    buildHero('ilan', FULL_OUTFIT);
    placeCamera(3.05, 0.9, 0.16, 1.12);
    var controlA = renderFrame();
    var controlB = renderFrame();
    report.control = diffFrames(controlA, controlB);
    report.env.shadowTypeAfterFirstRender = renderer.shadowMap.type;
    if (report.control.changed !== 0) report.warnings.push('el control de doble render no es determinista: ' + JSON.stringify(report.control));

    /* 1 · Héroes con todas las ranuras equipadas */
    log('héroes con todas las ranuras…');
    var heroFlatTotal = 0;
    var heroFlatWorst = null;
    var heroCoplanarTotal = 0;
    var heroCoplanarRawTotal = 0;
    var heroCoplanarWorst = null;
    for (var hi = 0; hi < heroIds.length; hi++) {
      var heroId = heroIds[hi];
      var av = buildHero(heroId, FULL_OUTFIT);
      var audit = auditCoplanar(av.root);
      var views = runViews(HERO_VIEWS, ANGLES, 'hero:' + heroId);
      var flatTotal = sumFlat(views.views);
      heroFlatTotal += flatTotal;
      if (!heroFlatWorst || flatTotal > heroFlatWorst.flat) {
        heroFlatWorst = { id: heroId, flat: flatTotal, worst: views.worst };
      }
      heroCoplanarTotal += audit.exactUnresolvedColorPairs;
      heroCoplanarRawTotal += audit.crossColorPairs;
      if (!heroCoplanarWorst || audit.exactUnresolvedColorPairs > heroCoplanarWorst.exactUnresolvedColorPairs) {
        heroCoplanarWorst = {
          id: heroId,
          exactUnresolvedColorPairs: audit.exactUnresolvedColorPairs,
          unresolvedColorPairs: audit.unresolvedColorPairs,
          crossColorPairs: audit.crossColorPairs,
          audit: audit
        };
      }
      report.cases.push({
        kind: 'hero',
        id: heroId,
        triangles: audit.triangles,
        coplanar: {
          pairs: audit.pairs, sameMesh: audit.sameMesh, crossMesh: audit.crossMesh,
          colorPairs: audit.colorPairs, crossColorPairs: audit.crossColorPairs,
          sameMeshColorPairs: audit.sameMeshColorPairs,
          sameMeshExactColorPairs: audit.sameMeshExactColorPairs,
          unresolvedCrossColorPairs: audit.unresolvedCrossColorPairs,
          unresolvedColorPairs: audit.unresolvedColorPairs,
          exactUnresolvedColorPairs: audit.exactUnresolvedColorPairs,
          exactColorPairs: audit.exactColorPairs,
          samples: audit.samples,
          top: audit.top
        },
        flatTotal: flatTotal,
        views: views.views
      });
      if (full) {
        placeCamera(3.05, 0.55, 0.16, 1.12);
        var midShot = snapshot('hero-' + heroId + '-mid-front');
        if (midShot) report.shots.push(midShot);
        if (heroId === 'ilan' || heroId === 'teo' || heroId === 'iris') {
          buildHero(heroId, {});
          placeCamera(3.05, 0.55, 0.16, 1.12);
          var baseShot = snapshot('hero-' + heroId + '-base-mid-front');
          if (baseShot) report.shots.push(baseShot);
        }
      }
      if (hi === 0 || flatTotal > 0) {
        placeCamera(views.worst.dist, views.worst.angle + YAW_STEP * 0.5, views.worst.pitch, views.worst.targetY);
        var shot = snapshot('hero-' + heroId + '-' + views.worst.view + '-flat' + flatTotal);
        if (shot) report.shots.push(shot);
        if (flatTotal > 0) {
          var mask = maskSnapshot('hero-' + heroId + '-mask', views.worst);
          if (mask) report.shots.push(mask);
        }
      }
      await nextTick();
    }

    /* 2 · Guardianes */
    log('guardianes…');
    var guardianFlatTotal = 0;
    var guardianFlatWorst = null;
    var guardianCoplanarTotal = 0;
    var guardianCoplanarRawTotal = 0;
    var guardianIds = Object.keys(V.GUARDIAN_DATA);
    for (var gi = 0; gi < guardianIds.length; gi++) {
      var areaId = guardianIds[gi];
      var g = buildGuardian(areaId);
      var gAudit = auditCoplanar(g.root);
      var gViews = runViews(GUARDIAN_VIEWS, ANGLES, 'guardian:' + areaId);
      var gFlat = sumFlat(gViews.views);
      guardianFlatTotal += gFlat;
      guardianCoplanarTotal += gAudit.exactUnresolvedColorPairs;
      guardianCoplanarRawTotal += gAudit.crossColorPairs;
      if (!guardianFlatWorst || gFlat > guardianFlatWorst.flat) guardianFlatWorst = { areaId: areaId, flat: gFlat, worst: gViews.worst };
      report.cases.push({
        kind: 'guardian',
        id: areaId,
        triangles: gAudit.triangles,
        coplanar: {
          pairs: gAudit.pairs, sameMesh: gAudit.sameMesh, crossMesh: gAudit.crossMesh,
          colorPairs: gAudit.colorPairs, crossColorPairs: gAudit.crossColorPairs,
          sameMeshColorPairs: gAudit.sameMeshColorPairs,
          sameMeshExactColorPairs: gAudit.sameMeshExactColorPairs,
          unresolvedCrossColorPairs: gAudit.unresolvedCrossColorPairs,
          unresolvedColorPairs: gAudit.unresolvedColorPairs,
          exactUnresolvedColorPairs: gAudit.exactUnresolvedColorPairs,
          exactColorPairs: gAudit.exactColorPairs,
          samples: gAudit.samples,
          top: gAudit.top
        },
        flatTotal: gFlat,
        views: gViews.views
      });
      placeCamera(gViews.worst.dist, gViews.worst.angle + YAW_STEP * 0.5, gViews.worst.pitch, gViews.worst.targetY);
      var gShot = snapshot('guardian-' + areaId.replace('area-psi-', '') + '-flat' + gFlat);
      if (gShot) report.shots.push(gShot);
      await nextTick();
    }

    /* 3 · Efectos: cada efecto equipado en un héroe */
    var effectFlatTotal = 0;
    var effectCoplanarTotal = 0;
    var effectCoplanarRawTotal = 0;
    var effectWorst = [];
    if (full) {
      log('efectos equipados…');
      var effectIds = bySlot.efectos || [];
      for (var ei = 0; ei < effectIds.length; ei++) {
        var outfit = Object.assign({}, FULL_OUTFIT, { efectos: effectIds[ei] });
        var eav = buildHero('ilan', outfit);
        var eAudit = auditCoplanar(eav.root);
        var eViews = runViews([
          { label: 'mid', d: 2.35, pitch: 0.12, targetY: 1.2 },
          { label: 'far', d: 7.4, pitch: 0.2, targetY: 1.05 }
        ], ANGLES, 'effect:' + effectIds[ei]);
        var eFlat = sumFlat(eViews.views);
        effectFlatTotal += eFlat;
        effectCoplanarTotal += eAudit.exactUnresolvedColorPairs;
        effectCoplanarRawTotal += eAudit.crossColorPairs;
        effectWorst.push({ id: effectIds[ei], flat: eFlat, exactUnresolvedColorPairs: eAudit.exactUnresolvedColorPairs, crossColorPairs: eAudit.crossColorPairs, worst: eViews.worst });
        if (eFlat > 0 && effectWorst.length <= 4) {
          placeCamera(eViews.worst.dist, eViews.worst.angle + YAW_STEP * 0.5, eViews.worst.pitch, eViews.worst.targetY);
          var eShot = snapshot('effect-' + effectIds[ei] + '-flat' + eFlat);
          if (eShot) report.shots.push(eShot);
        }
        await nextTick();
      }
    }

    /* 4 · Auditoría por cosmético individual: 10 héroes × 69 cosméticos */
    var cosmeticCases = [];
    if (full) {
      log('auditoría de cada cosmético en cada héroe…');
      var step = 0;
      for (var hci = 0; hci < heroIds.length; hci++) {
        var hid = heroIds[hci];
        for (var si = 0; si < MODEL_SLOTS.length; si++) {
          var slot = MODEL_SLOTS[si];
          var ids = bySlot[slot] || [];
          for (var ci = 0; ci < ids.length; ci++) {
            var single = {};
            single[slot] = ids[ci];
            var sav = buildHero(hid, single);
            var sAudit = auditCoplanar(sav.root);
            cosmeticCases.push({
              hero: hid,
              slot: slot,
              id: ids[ci],
              triangles: sAudit.triangles,
              colorPairs: sAudit.colorPairs,
              crossColorPairs: sAudit.crossColorPairs,
              sameMeshPairs: sAudit.sameMesh,
              sameMeshColorPairs: sAudit.sameMeshColorPairs,
              unresolvedColorPairs: sAudit.unresolvedColorPairs,
              exactUnresolvedColorPairs: sAudit.exactUnresolvedColorPairs,
              top: sAudit.top.slice(0, 3)
            });
            step++;
            if (step % 25 === 0) await nextTick();
          }
        }
        await nextTick();
      }
    }
    var cosmeticSorted = cosmeticCases.slice().sort(function (a, b) {
      return (b.exactUnresolvedColorPairs - a.exactUnresolvedColorPairs) || (b.unresolvedColorPairs - a.unresolvedColorPairs) ||
        (b.crossColorPairs - a.crossColorPairs) || (b.colorPairs - a.colorPairs);
    });
    var cosmeticCrossColorTotal = 0;
    var cosmeticUnresolvedTotal = 0;
    var cosmeticSameMeshPairsTotal = 0;
    var cosmeticSameMeshColorTotal = 0;
    cosmeticCases.forEach(function (row) {
      cosmeticCrossColorTotal += row.crossColorPairs;
      cosmeticUnresolvedTotal += row.exactUnresolvedColorPairs;
      cosmeticSameMeshPairsTotal += row.sameMeshPairs;
      cosmeticSameMeshColorTotal += row.sameMeshColorPairs;
    });

    report.env.mergeStats = V.mergeStats ? {
      calls: V.mergeStats.calls,
      boxes: V.mergeStats.boxes,
      dropped: V.mergeStats.dropped,
      facesKept: V.mergeStats.facesKept,
      facesCulled: V.mergeStats.facesCulled,
      trianglesBefore: V.mergeStats.trianglesBefore,
      trianglesAfter: V.mergeStats.trianglesAfter
    } : null;

    report.summary = {
      control: report.control,
      heroFlatTotal: heroFlatTotal,
      heroFlatWorst: heroFlatWorst,
      heroCoplanarUnresolvedTotal: heroCoplanarTotal,
      heroCoplanarRawCrossColorTotal: heroCoplanarRawTotal,
      heroCoplanarWorst: heroCoplanarWorst,
      guardianFlatTotal: guardianFlatTotal,
      guardianFlatWorst: guardianFlatWorst,
      guardianCoplanarUnresolvedTotal: guardianCoplanarTotal,
      guardianCoplanarRawCrossColorTotal: guardianCoplanarRawTotal,
      effectFlatTotal: effectFlatTotal,
      effectCoplanarUnresolvedTotal: effectCoplanarTotal,
      effectCoplanarRawCrossColorTotal: effectCoplanarRawTotal,
      effectWorst: effectWorst.slice().sort(function (a, b) { return (b.flat - a.flat) || (b.unresolvedColorPairs - a.unresolvedColorPairs); }).slice(0, 10),
      cosmeticAuditCases: cosmeticCases.length,
      cosmeticAuditCrossColorTotal: cosmeticCrossColorTotal,
      cosmeticAuditUnresolvedTotal: cosmeticUnresolvedTotal,
      cosmeticAuditSameMeshPairsTotal: cosmeticSameMeshPairsTotal,
      cosmeticAuditSameMeshColorTotal: cosmeticSameMeshColorTotal,
      cosmeticAuditWorst: cosmeticSorted.slice(0, 20)
    };
    report.summary.flickerTotal = heroFlatTotal + guardianFlatTotal + effectFlatTotal;
    report.summary.coplanarUnresolvedTotal = heroCoplanarTotal + guardianCoplanarTotal + effectCoplanarTotal + cosmeticUnresolvedTotal;
    report.summary.coplanarRawCrossColorTotal = heroCoplanarRawTotal + guardianCoplanarRawTotal + effectCoplanarRawTotal + cosmeticCrossColorTotal;
    report.summary.ok = report.control.changed === 0 &&
      report.summary.flickerTotal === 0 &&
      report.summary.coplanarUnresolvedTotal === 0;

    log('listo: flicker=' + report.summary.flickerTotal + ' coplanares sin resolver=' + report.summary.coplanarUnresolvedTotal +
      ' (brutos=' + report.summary.coplanarRawCrossColorTotal + ')');
    return report;
  }

  window.__V21RUN = { run: run };
  log('banco listo · héroes: ' + heroIds.length + ' · cosméticos: ' + cosmeticIds.length + ' · three: r' + THREE.REVISION);
})();
