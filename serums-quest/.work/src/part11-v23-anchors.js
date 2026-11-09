/* =========================================================================
   V2.3 · FASE 1 · AGENTE 1 · SISTEMA DE ENCAJE 69 × 10
   -------------------------------------------------------------------------
   Propiedad exclusiva del Agente 1 (lee el resto del juego, no lo modifica).
   Se carga después del motor de cosméticos y del núcleo V2.3.

   Qué hace
   --------
   1. Mide la geometría REAL de cada uno de los 10 avatares (cabeza, cráneo,
      pelo visible, torso, brazos, piernas, pies, suelo, arma, capa) en
      coordenadas locales del cuerpo. Nada se supone: todas las anclas salen
      de las cajas de los grupos base del propio avatar.
   2. Envuelve addPieceGroup (el único punto por el que pasan los 69
      cosméticos, tanto en applyOutfitToAvatar como en v22AttachSlot) y aplica
      una transformación de encaje (escala/desplazamiento por héroe y ranura)
      sin tocar la geometría de las piezas. También envuelve
      animateAvatarCosmetics para que las piezas animadas conserven el encaje
      cuando su animación sobrescribe la posición.
   3. Expone window.__v23Anchors con QA real: matriz 69×10, renderiza el
      avatar con y sin la pieza (cámara de busto y de cuerpo completo) y
      compara píxeles; mide penetración, hueco flotante, parpadeo y bbox.

   Reglas que se conservan
   -----------------------
   · Conflicto de ranuras y visibilidad de pelo/sombrero base: los decide el
     motor (applyOutfitToAvatar). Aquí no se tocan.
   · Anclas de identidad: cara, ojos, rasgos, arma y capa base no se mueven ni
     se ocultan. El casco/gorro sólo oculta el pelo base, como ya hacía.
   · No se crea geometría nueva: sólo se escalan/desplazan grupos existentes.

   Degradación
   -----------
   Todo va en try/catch. Si algo falta, V23A.ready queda false con el motivo y
   el juego sigue con el comportamiento anterior (encaje identidad).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (window.__v23Anchors && window.__v23Anchors.__part === 'part11-v23-anchors') return;

  var V23A = {
    __part: 'part11-v23-anchors',
    version: '1.0.0',
    ready: false,
    reason: '',
    fitting: true,
    fitted: 0,
    errors: [],
    warnings: [],
    lastError: '',
    qaReady: false
  };

  /* -----------------------------------------------------------------------
     Utilidades numéricas y de cajas
     ----------------------------------------------------------------------- */
  function v23aClamp(n, lo, hi) { n = Number(n); if (!isFinite(n)) n = lo; return Math.max(lo, Math.min(hi, n)); }
  function v23aPad(n) { n = Math.round((Number(n) || 0) * 1000) / 1000; return n; }
  function v23aNow() { return Date.now(); }
  function v23aMin(a, b) { return a < b ? a : b; }
  function v23aMax(a, b) { return a > b ? a : b; }
  function v23aBoxEmpty() { return new THREE.Box3().makeEmpty(); }
  function v23aBoxValid(box) { return !!(box && box.min && box.max && isFinite(box.min.x) && box.max.x >= box.min.x - 1e-6 && box.max.y >= box.min.y - 1e-6); }
  function v23aBoxSize(box) { return new THREE.Vector3(box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z); }
  function v23aBoxCenter(box) { return new THREE.Vector3((box.min.x + box.max.x) / 2, (box.min.y + box.max.y) / 2, (box.min.z + box.max.z) / 2); }
  function v23aBoxToWorld(box, node) { return box.clone().applyMatrix4(node.matrixWorld); }
  function v23aIsCosmeticNode(n) { return !!(n && n.userData && n.userData.cosmeticId); }

  /* Distancia punto→caja (0 dentro). */
  function v23aPointBoxDist(p, box) {
    if (!v23aBoxValid(box)) return Infinity;
    var dx = Math.max(box.min.x - p.x, 0, p.x - box.max.x);
    var dy = Math.max(box.min.y - p.y, 0, p.y - box.max.y);
    var dz = Math.max(box.min.z - p.z, 0, p.z - box.max.z);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  /* Profundidad dentro de la caja (-1 si está fuera). */
  function v23aPointBoxDepth(p, box) {
    if (!v23aBoxValid(box)) return -1;
    if (p.x < box.min.x || p.x > box.max.x || p.y < box.min.y || p.y > box.max.y || p.z < box.min.z || p.z > box.max.z) return -1;
    return Math.min(p.x - box.min.x, box.max.x - p.x, p.y - box.min.y, box.max.y - p.y, p.z - box.min.z, box.max.z - p.z);
  }

  /* Recorre una malla y acumula la caja de sus geometrías en el espacio de
     `space` (usando matrices de mundo). Salta los cosméticos si se pide. */
  function v23aWalkBox(node, out, spaceInv, skip, noSprites) {
    if (!node) return;
    if (skip && skip(node)) return;
    if (node.isMesh && node.geometry) {
      if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
      var bb = node.geometry.boundingBox;
      if (bb && !bb.isEmpty()) {
        var m = new THREE.Matrix4().multiplyMatrices(spaceInv, node.matrixWorld);
        var tb = bb.clone().applyMatrix4(m);
        if (v23aBoxValid(tb)) out.union(tb);
      }
      return;
    }
    if (node.isSprite) {
      if (noSprites) return;
      var p = new THREE.Vector3().setFromMatrixPosition(node.matrixWorld).applyMatrix4(spaceInv);
      out.expandByPoint(p);
      var half = 0.5 * (Math.abs(node.scale.x) + Math.abs(node.scale.y)) * 0.5;
      out.expandByPoint(p.clone().addScalar(half));
      out.expandByPoint(p.clone().addScalar(-half));
      return;
    }
    var kids = node.children || [];
    for (var i = 0; i < kids.length; i++) v23aWalkBox(kids[i], out, spaceInv, skip, noSprites);
  }

  function v23aBoxOf(node, space, skip, noSprites) {
    var box = v23aBoxEmpty();
    if (!node || !space || !space.matrixWorld) return box;
    node.updateWorldMatrix(true, true);
    var inv = new THREE.Matrix4().copy(space.matrixWorld).invert();
    v23aWalkBox(node, box, inv, skip || null, !!noSprites);
    return box;
  }

  /* Caja AABB de una caja expresada en el espacio de `from` al de `to`. */
  function v23aBoxBetween(box, fromNode, toNode) {
    if (!v23aBoxValid(box)) return v23aBoxEmpty();
    if (!fromNode || !toNode || fromNode === toNode) return box.clone();
    var m = new THREE.Matrix4().copy(toNode.matrixWorld).invert().multiply(fromNode.matrixWorld);
    return v23aApplyBox(box, m);
  }
  function v23aApplyBox(box, m) {
    var out = v23aBoxEmpty();
    if (!v23aBoxValid(box)) return out;
    for (var i = 0; i < 8; i++) {
      var v = new THREE.Vector3(
        (i & 1) ? box.max.x : box.min.x,
        (i & 2) ? box.max.y : box.min.y,
        (i & 4) ? box.max.z : box.min.z
      ).applyMatrix4(m);
      out.expandByPoint(v);
    }
    return out;
  }
  function v23aPointBetween(p, fromNode, toNode) {
    var m = new THREE.Matrix4().copy(toNode.matrixWorld).invert().multiply(fromNode.matrixWorld);
    return p.clone().applyMatrix4(m);
  }

  /* Muestras de superficie (centroides de triángulo + centros de sprite) en
     el espacio de `space`. */
  function v23aSamples(node, space, maxPts) {
    var pts = [];
    if (!node || !space) return pts;
    node.updateWorldMatrix(true, true);
    var inv = new THREE.Matrix4().copy(space.matrixWorld).invert();
    var m = new THREE.Matrix4();
    (function walk(n) {
      if (!n) return;
      if (n.isSprite) {
        return;
      }
      if (n.isMesh && n.geometry) {
        var pos = n.geometry.attributes && n.geometry.attributes.position;
        if (!pos) return;
        var idx = n.geometry.index;
        m.multiplyMatrices(inv, n.matrixWorld);
        var count = idx ? idx.count : pos.count;
        var ptsCount = pos.count;
        var limit = Math.min(count, 2400);
        for (var i = 0; i + 2 < limit; i += 3) {
          var a = idx ? idx.getX(i) : i;
          var b = idx ? idx.getX(i + 1) : i + 1;
          var c = idx ? idx.getX(i + 2) : i + 2;
          if (a >= ptsCount || b >= ptsCount || c >= ptsCount) continue;
          var v = new THREE.Vector3(
            (pos.getX(a) + pos.getX(b) + pos.getX(c)) / 3,
            (pos.getY(a) + pos.getY(b) + pos.getY(c)) / 3,
            (pos.getZ(a) + pos.getZ(b) + pos.getZ(c)) / 3
          ).applyMatrix4(m);
          pts.push(v);
        }
        return;
      }
      var kids = n.children || [];
      for (var k = 0; k < kids.length; k++) walk(kids[k]);
    })(node);
    if (pts.length > maxPts && maxPts > 0) {
      var out = [];
      var stride = pts.length / maxPts;
      for (var j = 0; j < maxPts; j++) out.push(pts[Math.floor(j * stride)]);
      return out;
    }
    return pts;
  }

  /* Vértices en una columna central (para medir la coronilla real, sin
     confundirla con una coleta alta o un moño lateral). */
  function v23aTopCentralY(node, space, maxX, maxZ) {
    if (!node) return -Infinity;
    node.updateWorldMatrix(true, true);
    var inv = new THREE.Matrix4().copy(space.matrixWorld).invert();
    var m = new THREE.Matrix4();
    var top = -Infinity;
    (function walk(n) {
      if (!n) return;
      if (n.isMesh && n.geometry && n.geometry.attributes && n.geometry.attributes.position) {
        var pos = n.geometry.attributes.position;
        m.multiplyMatrices(inv, n.matrixWorld);
        var v = new THREE.Vector3();
        for (var i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i).applyMatrix4(m);
          if (Math.abs(v.x) <= maxX && Math.abs(v.z) <= maxZ && v.y > top) top = v.y;
        }
        return;
      }
      var kids = n.children || [];
      for (var k = 0; k < kids.length; k++) walk(kids[k]);
    })(node);
    return top;
  }

  /* -----------------------------------------------------------------------
     Medida real del avatar
     ----------------------------------------------------------------------- */
  var v23aSlotOf = {};
  function v23aParentKind(av, parent) {
    if (!av || !parent) return 'other';
    if (parent === av.head) return 'head';
    if (parent === av.torso) return 'torso';
    if (parent === av.leftArm || parent === av.rightArm) return 'arm';
    if (parent === av.leftLeg || parent === av.rightLeg) return 'leg';
    if (parent === av.weapon) return 'weapon';
    if (parent === av.body) return 'body';
    if (parent === av.root) return 'root';
    return 'other';
  }

  function v23aMeasure(av) {
    var hairNow = !!(av.head && av.head.getObjectByName && av.head.getObjectByName('base-hair') && av.head.getObjectByName('base-hair').visible);
    if (av.__v23aM) {
      if (!!av.__v23aM.hairVisible === hairNow) return av.__v23aM;
      av.__v23aM = null;
      av.__v23aVol = null;
    }
    av.root.updateWorldMatrix(true, true);
    var body = av.body, head = av.head, torso = av.torso;
    var skipC = v23aIsCosmeticNode;
    var skullNode = head.getObjectByName ? head.getObjectByName('base-head') : null;
    var hairNode = head.getObjectByName ? head.getObjectByName('base-hair') : null;
    var detailsNode = head.getObjectByName ? head.getObjectByName('base-head-details') : null;
    var hairVisible = hairNow;
    var skullH = v23aBoxOf(skullNode || head, head, skipC);
    var hairH = hairNode ? v23aBoxOf(hairNode, head, skipC) : null;
    var detailsH = detailsNode ? v23aBoxOf(detailsNode, head, skipC) : null;
    var headAllH = v23aBoxOf(head, head, skipC);
    var skullTop = v23aBoxValid(skullH) ? skullH.max.y : 0.54;
    var hairTopCentral = hairVisible ? v23aTopCentralY(hairNode, head, 0.18, 0.18) : -Infinity;
    var hairTopBox = (hairH && v23aBoxValid(hairH)) ? hairH.max.y : -Infinity;
    var crownH = Math.max(skullTop, isFinite(hairTopCentral) ? Math.min(hairTopCentral, skullTop + 0.22) : skullTop);
    if (!isFinite(hairTopCentral) && hairVisible && isFinite(hairTopBox)) crownH = Math.max(crownH, Math.min(hairTopBox, skullTop + 0.15));
    var eyeLocal = new THREE.Vector3(0, 0, 0);
    if (v23aBoxValid(skullH)) {
      var sw = skullH.max.x - skullH.min.x, sh = skullH.max.y - skullH.min.y, sd = skullH.max.z - skullH.min.z;
      eyeLocal.set(sw * 0.215, skullH.min.y + sh * 0.58, skullH.max.z + sd * 0.022);
    }
    var torsoL = v23aBoxOf(torso, torso, skipC);
    var armL = v23aBoxOf(av.leftArm, av.leftArm, function (n) { return skipC(n) || n === av.weapon; });
    var armR = v23aBoxOf(av.rightArm, av.rightArm, function (n) { return skipC(n) || n === av.weapon; });
    var legL = v23aBoxOf(av.leftLeg, av.leftLeg, skipC);
    var legR = v23aBoxOf(av.rightLeg, av.rightLeg, skipC);
    var weaponL = av.weapon ? v23aBoxOf(av.weapon, av.weapon, skipC) : v23aBoxEmpty();
    var capeB = av.cape ? v23aBoxOf(av.cape, body, skipC) : v23aBoxEmpty();

    var skullB = v23aBoxBetween(skullH, head, body);
    var hairB = hairH ? v23aBoxBetween(hairH, head, body) : v23aBoxEmpty();
    var detailsB = detailsH ? v23aBoxBetween(detailsH, head, body) : v23aBoxEmpty();
    var headAllB = v23aBoxBetween(headAllH, head, body);
    var torsoB = v23aBoxBetween(torsoL, torso, body);
    var armLB = v23aBoxBetween(armL, av.leftArm, body);
    var armRB = v23aBoxBetween(armR, av.rightArm, body);
    var legLB = v23aBoxBetween(legL, av.leftLeg, body);
    var legRB = v23aBoxBetween(legR, av.rightLeg, body);
    var weaponB = av.weapon ? v23aBoxBetween(weaponL, av.weapon, body) : v23aBoxEmpty();

    var silhouetteB = v23aBoxEmpty();
    [skullB, torsoB, armLB, armRB, legLB, legRB].forEach(function (b) { if (v23aBoxValid(b)) silhouetteB.union(b); });
    var fullB = silhouetteB.clone();
    if (v23aBoxValid(headAllB)) fullB.union(headAllB);
    if (v23aBoxValid(weaponB)) fullB.union(weaponB);
    if (v23aBoxValid(capeB)) fullB.union(capeB);
    var feetY = Infinity;
    if (v23aBoxValid(legLB)) feetY = Math.min(feetY, legLB.min.y);
    if (v23aBoxValid(legRB)) feetY = Math.min(feetY, legRB.min.y);
    if (!isFinite(feetY)) feetY = 0;

    var neckB = v23aBoxEmpty();
    if (v23aBoxValid(torsoB) && v23aBoxValid(skullB)) {
      var cx = (skullB.min.x + skullB.max.x) / 2;
      var nw = (skullB.max.x - skullB.min.x) * 0.42;
      var nz = (skullB.max.z - skullB.min.z) * 0.5;
      neckB = new THREE.Box3(
        new THREE.Vector3(cx - nw, torsoB.max.y - 0.045, -nz * 0.5),
        new THREE.Vector3(cx + nw, skullB.min.y + 0.03, nz * 0.9)
      );
    }
    var feetB = new THREE.Box3(
      new THREE.Vector3(silhouetteB.min.x, feetY - 0.02, -0.3),
      new THREE.Vector3(silhouetteB.max.x, feetY + 0.24, 0.32)
    );
    var bodyBoxB = silhouetteB.clone();
    var rootScale = new THREE.Vector3(av.root.scale.x || 1, av.root.scale.y || 1, av.root.scale.z || 1);
    var look = av.look || (typeof heroLook === 'function' ? heroLook(av.id) : {}) || {};

    var m = {
      id: av.id,
      look: look,
      rootScale: [v23aPad(rootScale.x), v23aPad(rootScale.y), v23aPad(rootScale.z)],
      headScale: head.scale ? v23aPad(head.scale.x || 1) : 1,
      skullH: skullH, hairH: hairH, detailsH: detailsH, headAllH: headAllH,
      crownH: crownH, eyeLocal: eyeLocal, hairVisible: hairVisible,
      skullB: skullB, hairB: hairB, hairVisibleB: hairVisible, detailsB: detailsB, headAllB: headAllB,
      torsoB: torsoB, armLB: armLB, armRB: armRB, legLB: legLB, legRB: legRB,
      weaponB: weaponB, capeB: capeB,
      silhouetteB: silhouetteB, fullB: fullB, neckB: neckB, feetB: feetB, bodyBoxB: bodyBoxB,
      feetY: feetY,
      armReach: Math.max(Math.abs(armLB.max.x), Math.abs(armLB.min.x), Math.abs(armRB.max.x), Math.abs(armRB.min.x)),
      shoulderReach: Math.max(Math.abs(torsoB.max.x), Math.abs(torsoB.min.x), Math.abs(armLB.max.x), Math.abs(armRB.max.x)),
      torsoHalfY: torsoB ? (torsoB.max.y - torsoB.min.y) * 0.5 : 0.33,
      legPivotY: av.leftLeg ? av.leftLeg.position.y : 0.93,
      style: (look && look.style) || '',
      hairStyle: (look && look.hairStyle) || ''
    };
    av.__v23aM = m;
    return m;
  }

  /* Volúmenes en el espacio local de `space`. Se cachean por avatar+espacio. */
  function v23aVolumes(av, space) {
    var m = v23aMeasure(av);
    if (!space) space = av.body;
    if (!av.__v23aVol) av.__v23aVol = {};
    var key = space.uuid;
    if (av.__v23aVol[key]) return av.__v23aVol[key];
    var mat = new THREE.Matrix4().copy(space.matrixWorld).invert().multiply(av.body.matrixWorld);
    function conv(b) { return v23aApplyBox(b, mat); }
    var v = {
      head: conv(v23aBoxValid(m.skullB) ? m.skullB : m.headAllB),
      skull: conv(m.skullB),
      hair: m.hairVisible ? conv(m.hairB) : v23aBoxEmpty(),
      torso: conv(m.torsoB),
      armL: conv(m.armLB),
      armR: conv(m.armRB),
      legL: conv(m.legLB),
      legR: conv(m.legRB),
      neck: conv(m.neckB),
      feet: conv(m.feetB),
      weapon: conv(m.weaponB),
      cape: conv(m.capeB),
      body: conv(m.silhouetteB),
      full: conv(m.fullB)
    };
    v.headSupport = v.head.clone();
    if (v23aBoxValid(v.hair)) v.headSupport.union(v.hair);
    av.__v23aVol[key] = v;
    return v;
  }

  /* Anclas legibles por héroe (para QA y para el resumen). */
  function v23aAnchors(av) {
    var m = v23aMeasure(av);
    var b = av.body;
    var hb = m.headAllB;
    var tb = m.torsoB;
    var handL = new THREE.Box3();
    var handR = new THREE.Box3();
    if (v23aBoxValid(m.armLB)) handL = new THREE.Box3(new THREE.Vector3(m.armLB.min.x, m.armLB.min.y, m.armLB.min.z), new THREE.Vector3(m.armLB.max.x, m.armLB.min.y + 0.12, m.armLB.max.z));
    if (v23aBoxValid(m.armRB)) handR = new THREE.Box3(new THREE.Vector3(m.armRB.min.x, m.armRB.min.y, m.armRB.min.z), new THREE.Vector3(m.armRB.max.x, m.armRB.min.y + 0.12, m.armRB.max.z));
    var eyeB = v23aPointBetween(m.eyeLocal, av.head, b);
    var crownB = v23aPointBetween(new THREE.Vector3(0, m.crownH, 0), av.head, b);
    return {
      id: av.id,
      style: m.style,
      hairStyle: m.hairStyle,
      scale: m.rootScale,
      headScale: m.headScale,
      groundY: 0,
      feetY: v23aPad(m.feetY),
      hipsY: v23aPad(tb.min.y),
      waistY: v23aPad(tb.min.y),
      chestY: v23aPad(tb.max.y - 0.1),
      neckY: v23aPad(v23aBoxValid(m.neckB) ? (m.neckB.min.y + m.neckB.max.y) / 2 : hb.min.y),
      crown: [v23aPad(crownB.x), v23aPad(crownB.y), v23aPad(crownB.z)],
      forehead: [v23aPad(eyeB.x), v23aPad(eyeB.y), v23aPad(hb.max.z)],
      eyes: [v23aPad(eyeB.x), v23aPad(eyeB.y), v23aPad(eyeB.z)],
      head: v23aBoxSummary(m.headAllB),
      torso: v23aBoxSummary(tb),
      backZ: v23aPad(tb.min.z),
      chestZ: v23aPad(tb.max.z),
      shoulders: v23aPad(m.shoulderReach),
      arms: { left: v23aBoxSummary(m.armLB), right: v23aBoxSummary(m.armRB), hands: [v23aBoxSummary(handL), v23aBoxSummary(handR)] },
      legs: { left: v23aBoxSummary(m.legLB), right: v23aBoxSummary(m.legRB) },
      feet: v23aBoxSummary(m.feetB),
      weapon: v23aBoxSummary(m.weaponB),
      cape: v23aBoxSummary(m.capeB),
      body: v23aBoxSummary(m.silhouetteB)
    };
  }
  function v23aBoxSummary(box) {
    if (!v23aBoxValid(box)) return null;
    var s = v23aBoxSize(box), c = v23aBoxCenter(box);
    return {
      min: [v23aPad(box.min.x), v23aPad(box.min.y), v23aPad(box.min.z)],
      max: [v23aPad(box.max.x), v23aPad(box.max.y), v23aPad(box.max.z)],
      size: [v23aPad(s.x), v23aPad(s.y), v23aPad(s.z)],
      center: [v23aPad(c.x), v23aPad(c.y), v23aPad(c.z)]
    };
  }

  /* -----------------------------------------------------------------------
     Encaje: transformaciones por ranura y por pieza
     ----------------------------------------------------------------------- */
  /* Reglas de piezas concretas medidas contra el cráneo real (no rediseño:
     sólo asiento, profundidad y compresión de profundidad). */
  var v23aPieceRules = {
    /* La diadema está modelada dentro del cráneo: se asienta sobre la
       coronilla real (corona del pelo) y se adelanta hasta la frente. */
    'c-cabeza-diadema': { seat: 'crown', sink: 0.035, frontZ: 0.014, note: 'tiara asentada en coronilla' },
    /* Las gafas comparten z con las gafas base de Noa: se separan 3 cm. */
    'c-accesorios-gafas': { dz: 0.03, note: 'gafas separadas del cristal base' },
    /* El cuaderno orbita con centro fijo a la izquierda; se le da centro
       propio delante del torso para que no atraviese el cuerpo. */
    'x-cuaderno-orbital': { orbitCenter: [0, 1.52, 0.32], note: 'órbita delante del torso' },
    /* La geometría nueva del marco de platino ya vive detrás de la silueta;
       el desplazamiento histórico de −0,62 lo alejaba demasiado en Kian. */
    'c-marco-platino': { note: 'marco nuevo detrás de la silueta' }
  };

  function v23aConfig(slot, id) {
    /* support: volúmenes de apoyo (solape interno permitido, se informa
       aparte como penetraInterna). foreign: partes ajenas; entrar en ellas es
       penetración visible y sí falla. gapRef: referencia para el hueco. */
    var cfg = {
      cabeza: { support: ['headSupport', 'neck'], foreign: ['torso', 'armL', 'armR', 'legL', 'legR'], tol: 0.10, penAllow: 0.28, penForeign: 0.05 },
      peinado: { support: ['headSupport', 'neck', 'torso'], foreign: ['armL', 'armR', 'legL', 'legR'], tol: 0.10, penAllow: 0.30, penForeign: 0.05 },
      torso: { support: ['torso', 'neck', 'armL', 'armR', 'legL', 'legR'], foreign: ['skull'], tol: 0.10, penAllow: 0.35, penForeign: 0.10 },
      piernas: { support: ['legL', 'legR', 'torso'], foreign: ['skull', 'armL', 'armR'], tol: 0.14, penAllow: 0.30, penForeign: 0.06 },
      accesorios: { support: ['body'], foreign: ['headSupport', 'torso', 'armL', 'armR'], tol: 0.35, penAllow: 0.35, penForeign: 0.06 },
      extras: { support: ['body', 'armL', 'armR', 'legL', 'legR', 'torso'], foreign: ['headSupport'], tol: 0.35, penAllow: 0.35, penForeign: 0.06 },
      amuletos: { support: ['torso', 'neck', 'headSupport'], foreign: ['armL', 'armR'], tol: 0.12, penAllow: 0.30, penForeign: 0.06 },
      efectos: { support: [], foreign: [], gapRef: ['body'], tol: 0.95, penAllow: 0, penForeign: 99 },
      marcos: { support: [], foreign: ['body'], gapRef: ['body'], tol: 1.10, penAllow: 0, penForeign: 0.06 },
      mascota: { support: [], foreign: ['body', 'armL', 'armR', 'headSupport', 'legL', 'legR', 'torso'], gapRef: ['body'], tol: 1.30, penAllow: 0, penForeign: 0.05 },
      estela: { support: ['feet', 'legL', 'legR'], foreign: [], tol: 0.55, penAllow: 0.20, penForeign: 0.05 },
      titulo: { support: [], foreign: [], tol: 999, penAllow: 0, penForeign: 99 }
    };
    var src = cfg[slot] || cfg.extras;
    var out = {
      support: (src.support || []).slice(),
      foreign: (src.foreign || []).slice(),
      gapRef: (src.gapRef || src.support || []).slice(),
      tol: src.tol,
      penAllow: src.penAllow,
      penForeign: src.penForeign
    };
    if (slot === 'accesorios') {
      if (id === 'c-accesorios-gafas') { out.support = ['headSupport']; out.gapRef = ['headSupport']; out.foreign = ['torso', 'armL', 'armR']; out.tol = 0.08; out.penAllow = 0.15; out.penForeign = 0.05; }
      else if (id === 'c-accesorios-brujula') { out.support = ['armL', 'torso']; out.gapRef = ['armL']; out.foreign = ['headSupport']; out.tol = 0.08; out.penAllow = 0.25; out.penForeign = 0.06; }
    } else if (slot === 'extras') {
      if (id === 'c-accesorios-bolso' || id === 'c-accesorios-pluma') {
        out.support = ['body', 'armL', 'armR', 'legL', 'legR', 'torso']; out.gapRef = ['body']; out.foreign = ['headSupport']; out.tol = 0.35; out.penAllow = 0.35; out.penForeign = 0.06;
      } else {
        out.support = []; out.gapRef = ['body']; out.foreign = ['body', 'armL', 'armR', 'headSupport', 'legL', 'legR', 'torso']; out.tol = 0.8; out.penAllow = 0; out.penForeign = 0.05;
      }
    } else if (slot === 'efectos') {
      if (id && id.indexOf('x-arma-') === 0) {
        out.support = ['weapon', 'armR', 'torso', 'legL', 'legR']; out.gapRef = ['weapon']; out.foreign = ['headSupport', 'armL']; out.tol = 0.45; out.penAllow = 0.35; out.penForeign = 0.10;
      } else {
        out.penForeign = 99; out.tol = 0.95; out.gapRef = ['body'];
      }
    }
    return out;
  }

  function v23aFit(av, parent, group, c, slot) {
    var kind = v23aParentKind(av, parent);
    var m = v23aMeasure(av);
    var vol = v23aVolumes(av, parent);
    /* Las piezas con animación absoluta deben medirse desde su posición de
       reposo, no desde la posición de autor: si no, el primer fotograma
       estático (retratos) quedaría desplazado. */
    try {
      var a0 = group.userData && group.userData.anim && group.userData.anim[0];
      if (a0 && a0.type === 'orbit' && a0.radius != null) {
        group.position.set(-0.45, a0.baseY != null ? a0.baseY : group.position.y, -0.2);
      } else if (a0 && a0.type === 'pet') {
        group.position.set(a0.baseX != null ? a0.baseX : group.position.x, a0.baseY != null ? a0.baseY : group.position.y, a0.baseZ != null ? a0.baseZ : group.position.z);
      } else if (a0 && (a0.type === 'float' || a0.type === 'frame') && a0.baseY != null) {
        group.position.y = a0.baseY;
      } else if (a0 && a0.type === 'trail') {
        group.position.y = 0.28;
      }
      group.updateMatrixWorld(true);
    } catch (eA) {}
    var box = v23aBoxOf(group, parent, null, true);
    if (!v23aBoxValid(box)) box = v23aBoxOf(group, parent);
    if (!v23aBoxValid(box)) return null;
    var t = { sx: 1, sy: 1, sz: 1, dx: 0, dy: 0, dz: 0, kind: kind, note: '', mask: null, anchor: '' };
    var rule = (c && v23aPieceRules[c.id]) || null;
    var id = c ? c.id : '';

    function scale(sx, sy, sz) {
      if (sx === 1 && sy === 1 && sz === 1) return;
      group.scale.x *= sx; group.scale.y *= sy; group.scale.z *= sz;
      t.sx *= sx; t.sy *= sy; t.sz *= sz;
      group.updateMatrixWorld(true);
      box = v23aBoxOf(group, parent, null, true);
    }
    function move(dx, dy, dz) {
      if (!dx && !dy && !dz) return;
      group.position.x += dx; group.position.y += dy; group.position.z += dz;
      t.dx += dx; t.dy += dy; t.dz += dz;
      group.updateMatrixWorld(true);
      box = v23aBoxOf(group, parent, null, true);
    }

    try {
      if (slot === 'cabeza' || slot === 'peinado') {
        t.anchor = 'coronilla/frente';
        var headSup = vol.headSupport;
        var skull = vol.skull;
        if (v23aBoxValid(headSup)) {
          var crown = headSup.max.y;
          var front = headSup.max.z;
          if (rule && rule.seat === 'crown') {
            var sink = rule.sink == null ? 0.03 : rule.sink;
            move(0, (crown - sink) - box.min.y, 0);
            if (box.max.z < front + 0.004) move(0, 0, (front + (rule.frontZ || 0.01)) - box.max.z);
          } else if (box.min.y > crown + 0.06) {
            /* Pieza que flota por encima de la coronilla: se asienta. */
            move(0, (crown + 0.01) - box.min.y, 0);
          }
          /* Pieza frontal que quedaría enterrada en el cráneo: se adelanta
             hasta la superficie de la cara (sólo si no es un casco/pieza
             envolvente, es decir, si su fondo está por detrás del cráneo). */
          if (!rule && box.min.z < skull.min.z + 0.02 && box.max.z < front - 0.06 && (box.max.y - box.min.y) < 0.24) {
            move(0, 0, (front + 0.012) - box.max.z);
            t.note = 'banda frontal adelantada';
          }
        }
      } else if (slot === 'torso') {
        t.anchor = 'pecho/espalda';
        var torso = vol.torso;
        if (v23aBoxValid(torso)) {
          var pw = Math.max(1e-4, box.max.x - box.min.x);
          var needW = (torso.max.x - torso.min.x) + 0.06;
          var sx = v23aClamp(needW / pw, 1, 1.7);
          if (sx > 1.001) { scale(sx, 1, sx); t.note = 'ancho al torso ' + v23aPad(sx); }
          var front = torso.max.z;
          if (box.max.z < front + 0.012) {
            move(0, 0, (front + 0.012) - box.max.z);
            if (!t.note) t.note = 'paneles al frente del torso';
          } else if (box.min.z > front + 0.08) {
            move(0, 0, (front + 0.02) - box.max.z);
            t.note = 'prenda pegada al torso';
          }
        }
      } else if (slot === 'piernas') {
        t.anchor = 'piernas';
        /* Las piezas de piernas están modeladas en espacio del cuerpo (pie en
           y≈0), pero se cuelgan del pivote de la pierna en y≈0.93: se
           compensa el pivote para que caigan sobre cada pierna. */
        var legSup = kind === 'leg' ? (parent === av.leftLeg ? vol.legL : vol.legR) : null;
        if (kind === 'leg') {
          var pivotY = parent.position.y;
          move(0, -pivotY, 0);
          if (legSup && v23aBoxValid(legSup)) {
            var lw = Math.max(1e-4, legSup.max.x - legSup.min.x);
            var pw2 = Math.max(1e-4, box.max.x - box.min.x);
            var want = (lw + 0.035) / pw2;
            if (want > 1.04) scale(v23aClamp(want, 1, 1.35), 1, v23aClamp(want, 1, 1.35));
            if (Math.abs(box.min.z) < 0.02 && Math.abs(box.max.z) < 0.02) move(0, 0, 0);
          }
          t.note = 'pivote de pierna compensado';
        }
      } else if (slot === 'accesorios') {
        t.anchor = id === 'c-accesorios-gafas' ? 'frente' : (id === 'c-accesorios-brujula' ? 'muñeca' : 'cadera');
        if (rule && rule.dz) move(0, 0, rule.dz);
        if (id === 'c-accesorios-bolso') {
          /* Bolso al costado de la cadera: fuera del torso y delante del
             brazo que cuelga, para que se lea en la vista frontal. */
          var torsoB = vol.torso;
          if (v23aBoxValid(torsoB)) {
            var want = torsoB.max.x + 0.02;
            if (box.min.x < want) move(want - box.min.x, 0, 0);
          }
          move(0, 0, 0.05);
          t.note = 'bolso al costado, delante del brazo';
        }
      } else if (slot === 'extras') {
        t.anchor = 'cuerpo/manos';
        var bodyBox = vol.body;
        var anim0 = group.userData && group.userData.anim && group.userData.anim[0];
        if (id === 'x-cuaderno-orbital') {
          t.anchor = 'cuerpo (órbita)';
          /* Centro de órbita propio: delante del torso, sin atravesarlo. */
          var r = anim0 && anim0.radius ? anim0.radius : 0.55;
          var wantX = -(Math.abs(bodyBox.max.x) + 0.18 + r);
          var wantZ = 0.30;
          t.mask = { x: true, y: true, z: true };
          move(wantX - (-0.45), 0, wantZ - (-0.2));
          t.note = 'órbita propia delante del torso';
        } else if (id && id.indexOf('x-trofeo-') === 0) {
          var aa = group.userData && group.userData.anim && group.userData.anim[0];
          var rad = aa && aa.radius ? aa.radius : 0.16;
          var shoulder = Math.max(Math.abs(bodyBox.max.x), Math.abs(bodyBox.min.x));
          var centerX = Math.max(0.75, shoulder + 0.22 + rad + 0.12);
          t.mask = { x: true, y: true, z: true };
          move(centerX - (-0.45), 0, -0.35 - (-0.2));
          t.note = 'trofeo fuera del hombro';
        } else if (id === 'x-reloj-arena') {
          /* El reloj flota a un costado; se asegura separación del brazo. */
          if (v23aBoxValid(bodyBox)) {
            var inner = box.max.x;
            if (inner > -(Math.abs(bodyBox.min.x) + 0.06)) {
              var delta = -(Math.abs(bodyBox.min.x) + 0.06) - inner;
              move(delta, 0, 0);
                t.note = 'reloj separado del brazo';
            }
          }
        }
        if (id === 'c-accesorios-pluma') {
          var tb2 = vol.torso;
          if (v23aBoxValid(tb2) && box.max.x < 0 && box.max.x > tb2.min.x - 0.02 && box.min.x < tb2.max.x && box.max.y > tb2.min.y && box.min.y < tb2.max.y) {
            move((tb2.min.x - 0.03) - box.max.x, 0, 0);
            t.note = 'pluma fuera del torso';
          }
        }
      } else if (slot === 'amuletos') {
        t.anchor = 'cuello/pecho';
        var torsoV = vol.torso;
        var frontV = v23aBoxValid(torsoV) ? torsoV.max.z : 0.21;
        /* Si hay prenda de torso equipada, el amuleto descansa sobre ella. */
        var garment = null;
        var list = (av.cosmetics && av.cosmetics.groups) || [];
        for (var gi = 0; gi < list.length; gi++) {
          if (list[gi] && list[gi] !== group && list[gi].userData && list[gi].userData.slot === 'torso') { garment = list[gi]; break; }
        }
        if (garment) {
          var gb = v23aBoxOf(garment, parent);
          if (v23aBoxValid(gb)) frontV = Math.max(frontV, gb.max.z);
        }
        var dz = (frontV + 0.012) - box.min.z;
        if (Math.abs(dz) > 0.004) { move(0, 0, dz); t.note = 'pendiente sobre pecho/prenda'; }
      } else if (slot === 'efectos') {
        if (id && id.indexOf('x-arma-') === 0) {
          t.anchor = 'arma';
          var wv = vol.weapon;
          if (v23aBoxValid(wv)) {
            var wh = wv.max.y - wv.min.y;
            var want2 = v23aClamp(wh / 1.55, 0.90, 1.25);
            if (Math.abs(want2 - 1) > 0.02) scale(want2, want2, want2);
            var wc = v23aBoxCenter(wv), pc = v23aBoxCenter(box);
            move(wc.x - pc.x, wc.y - pc.y, 0);
            box = v23aBoxOf(group, parent, null, true);
            /* El brillo no debe quedar enterrado dentro de la malla del arma. */
            var fwd = (wv.max.z + 0.07) - box.min.z;
            if (fwd > 0) move(0, 0, fwd);
            t.note = 'efecto centrado y delante del arma';
          }
        } else {
          t.anchor = 'cuerpo';
        }
      } else if (slot === 'marcos') {
        t.anchor = 'cuerpo (detrás)';
        if (rule && rule.dz) move(0, 0, rule.dz);
        var sil = vol.body;
        if (v23aBoxValid(sil)) {
          var bw = sil.max.x - sil.min.x, bh = sil.max.y - sil.min.y, bc = v23aBoxCenter(sil);
          var s = Math.max(1, (bh + 0.35) / 2.55, (bw + 0.3) / 1.38);
          s = v23aClamp(s, 1, 1.5);
          if (s > 1.001) { scale(s, s, s); t.note = 'marco al tamaño del cuerpo'; }
          /* La animación 'frame' sobrescribe y: se compensa en el hook. */
          t.mask = { y: true };
          move(0, (bc.y + 0.02) - (1.35 * s), 0);
        }
      } else if (slot === 'mascota') {
        t.anchor = 'cuerpo (órbita de mascota)';
        var sil2 = vol.body;
        var spec = group.userData && group.userData.anim && group.userData.anim[0];
        if (v23aBoxValid(sil2)) {
          var reach = Math.max(Math.abs(sil2.max.x), Math.abs(sil2.min.x));
          var orbit = (spec && spec.orbit) || 0.2;
          var wantX2 = -(reach + 0.30 + orbit);
          if (spec && typeof spec.baseX === 'number') {
            var oldX = spec.baseX;
            spec.baseX = wantX2;
            move(wantX2 - oldX, 0, 0);
          } else {
            move(wantX2 - box.min.x - 0.2, 0, 0);
          }
          t.note = 'mascota fuera del cuerpo';
        }
      } else if (slot === 'estela') {
        t.anchor = 'pies/suelo';
      }
    } catch (e) {
      V23A.errors.push('fit ' + (id || '?') + ': ' + (e && e.message ? e.message : e));
    }

    /* La animación sobrescribe la posición de estos tipos: se reaplica el
       desplazamiento después de animar para que el encaje no se pierda. */
    if (!t.mask) {
      var anims = (group.userData && group.userData.anim) || [];
      for (var i = 0; i < anims.length; i++) {
        var ty = anims[i] && anims[i].type;
        if (ty === 'pet' || ty === 'orbit') { t.mask = { x: true, y: true, z: true }; break; }
        if (ty === 'float' || ty === 'trail' || ty === 'frame' || ty === 'aura') {
          t.mask = t.mask || { y: true };
        } else if (ty === 'orbit-stars' || ty === 'stars' || ty === 'constellation') {
          /* Sólo sobrescriben y. */
          t.mask = t.mask || { y: true };
        }
      }
    }
    if (t.mask && (t.dx || t.dy || t.dz)) {
      group.userData.v23AnimOffset = {
        x: t.mask.x ? t.dx : 0,
        y: t.mask.y ? t.dy : 0,
        z: t.mask.z ? t.dz : 0
      };
    }
    group.userData.v23Fit = {
      slot: slot,
      kind: kind,
      anchor: t.anchor,
      scale: [v23aPad(t.sx), v23aPad(t.sy), v23aPad(t.sz)],
      offset: [v23aPad(t.dx), v23aPad(t.dy), v23aPad(t.dz)],
      note: t.note
    };
    return t;
  }

  /* -----------------------------------------------------------------------
     Envoltorios del motor
     ----------------------------------------------------------------------- */
  var v23aOrigAdd = null;
  var v23aOrigAnimate = null;

  function v23aInstall() {
    if (typeof addPieceGroup !== 'function' || typeof applyOutfitToAvatar !== 'function' ||
      typeof buildHeroAvatar !== 'function' || typeof animateAvatarCosmetics !== 'function' || typeof THREE === 'undefined') {
      V23A.reason = 'faltan funciones del motor de cosméticos';
      return false;
    }
    v23aOrigAdd = addPieceGroup;
    addPieceGroup = function (avatar, parent, group, c, animList, slot) {
      if (!V23A.fitting || !avatar || !parent || !group) return v23aOrigAdd.apply(null, arguments);
      var pushed = false;
      try {
        parent.add(group);
        applyCosmeticLayering(group, slot);
        group.name = 'cosmetic-' + slot + '-' + c.id;
        avatar.cosmetics.groups.push(group);
        group.userData.cosmeticId = c.id;
        group.userData.slot = slot;
        pushed = true;
        try { v23aFit(avatar, parent, group, c, slot); } catch (e) { V23A.errors.push('fit ' + (c && c.id) + ': ' + (e && e.message ? e.message : e)); }
        if (group.userData.anim) {
          group.userData.anim.forEach(function (spec) {
            spec.group = group;
            animList.push(spec);
          });
        }
        V23A.fitted += 1;
        return group;
      } catch (e) {
        V23A.lastError = String(e && e.message ? e.message : e);
        V23A.errors.push('addPieceGroup ' + (c && c.id) + ': ' + V23A.lastError);
        if (!pushed) {
          try { return v23aOrigAdd.apply(null, arguments); } catch (e2) { V23A.errors.push('fallback: ' + (e2 && e2.message ? e2.message : e2)); }
        }
        return group;
      }
    };

    v23aOrigAnimate = animateAvatarCosmetics;
    animateAvatarCosmetics = function (av, dt, time, running, speedNorm) {
      try { v23aOrigAnimate(av, dt, time, running, speedNorm); } catch (e) { V23A.errors.push('anim: ' + (e && e.message ? e.message : e)); }
      try {
        var list = av && av.cosmetics && av.cosmetics.animated;
        if (!list || !list.length) return;
        for (var i = 0; i < list.length; i++) {
          var g = list[i].group;
          var o = g && g.userData && g.userData.v23AnimOffset;
          if (!o) continue;
          if (o.x) g.position.x += o.x;
          if (o.y) g.position.y += o.y;
          if (o.z) g.position.z += o.z;
        }
      } catch (e2) { if (V23A.errors.length < 80) V23A.errors.push('animOffset: ' + (e2 && e2.message ? e2.message : e2)); }
    };
    return true;
  }

  /* -----------------------------------------------------------------------
     QA: render fuera de pantalla, con y sin pieza
     ----------------------------------------------------------------------- */
  var Q = {
    size: 192,
    renderer: null,
    scene: null,
    camera: null,
    canvas: null,
    ctx2d: null,
    avatars: {},
    busy: false
  };

  function v23aQA() {
    if (Q.renderer) return Q;
    if (typeof THREE === 'undefined') throw new Error('THREE no disponible');
    var canvas = document.createElement('canvas');
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(1);
    renderer.setSize(Q.size, Q.size, false);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = false;
    var scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#c4d2ff', '#2b2238', 2.3));
    var key = new THREE.DirectionalLight('#ffe5ca', 2.5); key.position.set(-3, 6, 5); scene.add(key);
    var rim = new THREE.DirectionalLight('#7ba6ff', 1.7); rim.position.set(4, 4, -3); scene.add(rim);
    var camera = new THREE.PerspectiveCamera(30, 1, 0.05, 80);
    var ctx = document.createElement('canvas');
    ctx.width = Q.size; ctx.height = Q.size;
    Q.renderer = renderer; Q.scene = scene; Q.camera = camera; Q.canvas = canvas;
    Q.ctx2d = ctx.getContext('2d', { willReadFrequently: true });
    return Q;
  }

  function v23aResetPose(av) {
    av.root.position.set(0, 0, 0);
    av.root.rotation.set(0, 0, 0);
    av.root.scale.set((av.look && av.look.body && av.look.body.w) || 1, (av.look && av.look.body && av.look.body.h) || 1, (av.look && av.look.body && av.look.body.w) || 1);
    if (av.body) { av.body.position.set(0, 0, 0); av.body.rotation.set(0, 0, 0); }
    if (av.head) av.head.rotation.set(0, 0, 0);
    if (av.leftArm) av.leftArm.rotation.set(0, 0, 0);
    if (av.rightArm) av.rightArm.rotation.set(0, 0, 0);
    if (av.leftLeg) av.leftLeg.rotation.set(0, 0, 0);
    if (av.rightLeg) av.rightLeg.rotation.set(0, 0, 0);
    if (av.weapon) { av.weapon.rotation.set(0.02, 0, -0.055); av.weapon.position.set(0, -0.72, 0.08); av.weapon.scale.set(1, 1, 1); }
    av.root.updateMatrixWorld(true);
  }

  function v23aPrepAvatar(heroId, outfit) {
    var qa = v23aQA();
    var av = Q.avatars[heroId];
    if (!av) {
      av = buildHeroAvatar(heroId);
      Q.avatars[heroId] = av;
      qa.scene.add(av.root);
    }
    /* Sólo el avatar en uso está visible: los demás quedan en la escena para
       reutilizar geometría, pero no deben ocultar la pieza que se mide. */
    Object.keys(Q.avatars).forEach(function (otherId) {
      var other = Q.avatars[otherId];
      if (other && other.root) other.root.visible = (otherId === heroId);
    });
    var prevFrames = state && state.settings ? state.settings.hide3dFrames : false;
    if (state && state.settings) state.settings.hide3dFrames = false;
    try { applyOutfitToAvatar(av, heroId, outfit || {}); }
    finally { if (state && state.settings) state.settings.hide3dFrames = prevFrames; }
    v23aResetPose(av);
    av.root.updateMatrixWorld(true);
    return av;
  }

  function v23aFrameCamera(cam, boxWorld, pad) {
    var c = v23aBoxCenter(boxWorld);
    var s = v23aBoxSize(boxWorld);
    var r = 0.5 * Math.max(s.x, s.y, s.z) * (pad || 1.18) + 0.04;
    var dist = r / Math.sin((cam.fov * Math.PI / 180) * 0.5);
    cam.position.set(c.x + dist * 0.30, c.y + s.y * 0.06 + dist * 0.06, c.z + dist * 0.96);
    cam.lookAt(c.x, c.y, c.z);
    cam.updateProjectionMatrix();
  }

  function v23aFrameFront(cam, boxWorld, pad) {
    var c = v23aBoxCenter(boxWorld);
    var s = v23aBoxSize(boxWorld);
    var r = 0.5 * Math.max(s.x, s.y) * (pad || 1.16) + 0.04;
    var dist = r / Math.sin((cam.fov * Math.PI / 180) * 0.5);
    cam.position.set(c.x, c.y + s.y * 0.05, c.z + dist);
    cam.lookAt(c.x, c.y, c.z);
    cam.updateProjectionMatrix();
  }

  function v23aRenderPixels() {
    var qa = Q;
    qa.renderer.render(qa.scene, qa.camera);
    qa.ctx2d.clearRect(0, 0, qa.size, qa.size);
    qa.ctx2d.drawImage(qa.canvas, 0, 0);
    var data = qa.ctx2d.getImageData(0, 0, qa.size, qa.size).data;
    return new Uint8ClampedArray(data);
  }

  function v23aPixelDiff(a, b) {
    if (!a || !b || a.length !== b.length) return { count: 0, bbox: null };
    var n = 0, minx = 1e9, miny = 1e9, maxx = -1, maxy = -1;
    var size = Q.size;
    for (var i = 0, p = 0; i < a.length; i += 4, p++) {
      var d = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
      var da = Math.abs(a[i + 3] - b[i + 3]);
      if (d > 24 || da > 40) {
        n++;
        var x = p % size, y = (p / size) | 0;
        if (x < minx) minx = x; if (x > maxx) maxx = x;
        if (y < miny) miny = y; if (y > maxy) maxy = y;
      }
    }
    return { count: n, bbox: maxx >= 0 ? [minx, miny, maxx, maxy] : null };
  }

  function v23aFlipRatio(a, b, mask) {
    if (!a || !b || !mask) return 0;
    var n = 0, total = 0;
    for (var i = 0, p = 0; i < a.length; i += 4, p++) {
      if (!mask[p]) continue;
      total++;
      var d = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) + Math.abs(a[i + 3] - b[i + 3]);
      if (d > 140) n++;
    }
    return total ? n / total : 0;
  }

  function v23aPieceGroups(av) {
    var out = [];
    var list = (av.cosmetics && av.cosmetics.groups) || [];
    for (var i = 0; i < list.length; i++) {
      var g = list[i];
      if (g && g.parent) out.push(g);
    }
    return out;
  }

  function v23aSetVisible(groups, on) {
    for (var i = 0; i < groups.length; i++) { try { groups[i].visible = on; } catch (e) {} }
  }

  function v23aAudit(heroId, cosmeticId, opts) {
    opts = opts || {};
    var started = v23aNow();
    var res = {
      hero: heroId, cosmetic: cosmeticId, slot: '', visible: false, penetraCuerpo: false,
      huecoFlotante: false, parpadeo: false, bbox: null, areaFull: 0, areaBust: 0, areaFront: 0,
      gap: null, penDepth: 0, penCount: 0, samples: 0, raw: !!opts.raw,
      transform: null, anchor: '', note: '', error: '', ms: 0
    };
    try {
      var c = COSMETIC_BY_ID[cosmeticId];
      if (!c) throw new Error('cosmético inexistente');
      res.slot = c.category;
      if (res.slot === 'titulo') {
        var prevFitting0 = V23A.fitting;
        if (opts.raw) V23A.fitting = false;
        var avT;
        try { avT = v23aPrepAvatar(heroId, (function () { var o = {}; o.titulo = cosmeticId; return o; })()); }
        finally { V23A.fitting = prevFitting0; }
        res.visible = !!(avT.cosmetics && avT.cosmetics.title === cosmeticId);
        res.anchor = 'HUD (título)';
        res.note = 'ranura de texto: sin geometría 3D';
        res.areaFull = res.visible ? -1 : 0;
        res.status = res.visible ? 'PASS' : 'FAIL';
        res.ms = v23aNow() - started;
        return res;
      }
      var prevFitting = V23A.fitting;
      if (opts.raw) V23A.fitting = false;
      var av;
      try {
        var outfit = {}; outfit[res.slot] = cosmeticId;
        av = v23aPrepAvatar(heroId, outfit);
      } finally {
        V23A.fitting = prevFitting;
      }
      var groups = v23aPieceGroups(av);
      if (!groups.length) throw new Error('la pieza no creó grupo');
      var qa = v23aQA();
      var m = v23aMeasure(av);
      var vol = v23aVolumes(av, av.body);
      var pieceBoxB = v23aBoxEmpty();
      var pieceSpritesB = v23aBoxEmpty();
      for (var i = 0; i < groups.length; i++) {
        var gb = v23aBoxBetween(v23aBoxOf(groups[i], groups[i].parent, null, true), groups[i].parent, av.body);
        if (v23aBoxValid(gb)) pieceBoxB.union(gb);
        var gs = v23aBoxBetween(v23aBoxOf(groups[i], groups[i].parent), groups[i].parent, av.body);
        if (v23aBoxValid(gs)) pieceSpritesB.union(gs);
      }
      if (!v23aBoxValid(pieceBoxB)) pieceBoxB = pieceSpritesB.clone();
      var pieceVisualB = pieceBoxB.clone();
      if (v23aBoxValid(pieceSpritesB)) pieceVisualB.union(pieceSpritesB);
      if (!v23aBoxValid(pieceBoxB)) throw new Error('bbox de pieza vacía');
      var samplesB = [];
      for (var s = 0; s < groups.length; s++) {
        var pts = v23aSamples(groups[s], av.body, Math.max(60, Math.floor(320 / groups.length)));
        for (var q = 0; q < pts.length; q++) samplesB.push(pts[q]);
      }
      res.samples = samplesB.length;
      var cfg = v23aConfig(res.slot, cosmeticId);
      /* Penetración: puntos de la pieza dentro de volúmenes del cuerpo. */
      var inner = { count: 0, worst: 0, key: '' };
      var outer = { count: 0, worst: 0, key: '' };
      for (var pi = 0; pi < samplesB.length; pi++) {
        var p = samplesB[pi];
        for (var si2 = 0; si2 < cfg.support.length; si2++) {
          var sk = cfg.support[si2];
          var sbx = vol[sk];
          if (!v23aBoxValid(sbx)) continue;
          var sd = v23aPointBoxDepth(p, sbx);
          if (sd > cfg.penAllow) {
            inner.count++;
            if (sd - cfg.penAllow > inner.worst) { inner.worst = sd - cfg.penAllow; inner.key = sk; }
          }
        }
        for (var fi = 0; fi < cfg.foreign.length; fi++) {
          var fk = cfg.foreign[fi];
          var fbx = vol[fk];
          if (!v23aBoxValid(fbx)) continue;
          var fd = v23aPointBoxDepth(p, fbx);
          if (fd > cfg.penForeign) {
            outer.count++;
            if (fd - cfg.penForeign > outer.worst) { outer.worst = fd - cfg.penForeign; outer.key = fk; }
          }
        }
      }
      res.penCount = outer.count;
      res.penDepth = v23aPad(outer.worst);
      res.penZone = outer.key || '';
      res.penetraCuerpo = outer.count > Math.max(2, Math.round(samplesB.length * 0.03));
      res.penetraInterna = inner.count > Math.max(2, Math.round(samplesB.length * 0.05));
      res.penInternaCount = inner.count;
      res.penInternaDepth = v23aPad(inner.worst);
      res.penInternaZone = inner.key || '';
      /* Hueco flotante: distancia mínima de la pieza a su anclaje. */
      var gap = Infinity;
      var gapRefs = cfg.gapRef && cfg.gapRef.length ? cfg.gapRef : cfg.support;
      for (var si = 0; si < samplesB.length; si++) {
        for (var k = 0; k < gapRefs.length; k++) {
          var sb = vol[gapRefs[k]];
          if (!v23aBoxValid(sb)) continue;
          var dd = v23aPointBoxDist(samplesB[si], sb);
          if (dd < gap) gap = dd;
          if (gap === 0) break;
        }
        if (gap === 0) break;
      }
      res.gap = isFinite(gap) ? v23aPad(gap) : null;
      res.huecoFlotante = isFinite(gap) ? gap > cfg.tol : false;
      /* Render: vistas de cuerpo completo y busto. */
      var fullBoxB = v23aBoxValid(m.fullB) ? m.fullB.clone() : pieceBoxB.clone();
      fullBoxB.union(pieceVisualB);
      var bustBoxB = v23aBoxValid(m.headAllB) ? m.headAllB.clone() : pieceBoxB.clone();
      var headC = v23aBoxCenter(bustBoxB);
      var hs = v23aBoxSize(bustBoxB);
      bustBoxB = new THREE.Box3(
        new THREE.Vector3(headC.x - Math.max(hs.x, 0.7), headC.y - Math.max(hs.y, 0.62), headC.z - 0.55),
        new THREE.Vector3(headC.x + Math.max(hs.x, 0.7), headC.y + Math.max(hs.y, 0.7), headC.z + 0.55)
      );
      v23aSetVisible(groups, true);
      var bodyWorld = av.body.matrixWorld;
      var fullWorld = fullBoxB.clone().applyMatrix4(bodyWorld);
      v23aFrameCamera(qa.camera, fullWorld, 1.16);
      var fullWith = v23aRenderPixels();
      v23aSetVisible(groups, false);
      var fullWithout = v23aRenderPixels();
      v23aSetVisible(groups, true);
      var fullWith2 = v23aRenderPixels();
      var fullWith3 = v23aRenderPixels();
      var diffFull = v23aPixelDiff(fullWith, fullWithout);
      res.areaFull = diffFull.count;
      var bustWorld = bustBoxB.clone().applyMatrix4(bodyWorld);
      v23aFrameCamera(qa.camera, bustWorld, 1.12);
      var bustWith = v23aRenderPixels();
      v23aSetVisible(groups, false);
      var bustWithout = v23aRenderPixels();
      v23aSetVisible(groups, true);
      var diffBust = v23aPixelDiff(bustWith, bustWithout);
      res.areaBust = diffBust.count;
      /* Vista frontal: las piezas laterales (muñeca izquierda, bolso) pueden
         quedar tapadas por el cuerpo en la vista de tres cuartos. */
      v23aFrameFront(qa.camera, fullWorld, 1.16);
      var frontWith = v23aRenderPixels();
      v23aSetVisible(groups, false);
      var frontWithout = v23aRenderPixels();
      v23aSetVisible(groups, true);
      var diffFront = v23aPixelDiff(frontWith, frontWithout);
      res.areaFront = diffFront.count;
      /* Parpadeo: 3 fotogramas idénticos + jitter de cámara. */
      var frames = [fullWith, fullWith2, fullWith3];
      qa.camera.position.x += 0.012;
      qa.camera.updateMatrixWorld(true);
      var jitter = v23aRenderPixels();
      qa.camera.position.x -= 0.012;
      qa.camera.updateMatrixWorld(true);
      var frameDiff = Math.max(
        v23aPixelDiff(frames[0], frames[1]).count,
        v23aPixelDiff(frames[1], frames[2]).count
      );
      var mask = new Uint8Array(Q.size * Q.size);
      if (diffFull.bbox) {
        var bb = diffFull.bbox;
        for (var yy = Math.max(0, bb[1] - 1); yy <= Math.min(Q.size - 1, bb[3] + 1); yy++) {
          for (var xx = Math.max(0, bb[0] - 1); xx <= Math.min(Q.size - 1, bb[2] + 1); xx++) mask[yy * Q.size + xx] = 1;
        }
      }
      var flip = res.areaFull > 30 ? v23aFlipRatio(fullWith, jitter, mask) : 0;
      var polyOff = 0, mats = 0;
      for (var gi2 = 0; gi2 < groups.length; gi2++) {
        groups[gi2].traverse(function (n2) {
          if (!n2.isMesh || !n2.material) return;
          mats++;
          var list2 = Array.isArray(n2.material) ? n2.material : [n2.material];
          for (var mi = 0; mi < list2.length; mi++) {
            var mm = list2[mi];
            if (!mm || mm.isSpriteMaterial) continue;
            if (!mm.polygonOffset || !(Number(mm.polygonOffsetUnits) < 0)) polyOff++;
          }
        });
      }
      res.materials = mats;
      res.depthLayerMissing = polyOff;
      res.parpadeo = frameDiff > 4 || polyOff > 0;
      res.jitter = v23aPad(flip);
      res.framesDiffer = frameDiff;
      /* bbox de la pieza en coordenadas del cuerpo. */
      var psz = v23aBoxSize(pieceBoxB), pc = v23aBoxCenter(pieceBoxB);
      res.bbox = {
        size: [v23aPad(psz.x), v23aPad(psz.y), v23aPad(psz.z)],
        center: [v23aPad(pc.x), v23aPad(pc.y), v23aPad(pc.z)],
        minY: v23aPad(pieceBoxB.min.y), maxY: v23aPad(pieceBoxB.max.y)
      };
      var t = groups[0].userData && groups[0].userData.v23Fit;
      if (t) {
        res.transform = { scale: t.scale, offset: t.offset, kind: t.kind };
        res.anchor = t.anchor || '';
        res.note = t.note || '';
      }
      res.visible = res.areaFull >= (opts.minArea || 14) || res.areaBust >= (opts.minArea || 14) || res.areaFront >= (opts.minArea || 14);
      res.status = (res.visible && !res.penetraCuerpo && !res.huecoFlotante && !res.parpadeo) ? 'PASS' : 'FAIL';
      res.failReason = res.status === 'PASS' ? '' :
        (!res.visible ? 'invisible' : '') +
        (res.penetraCuerpo ? (res.visible ? '|' : '') + 'penetra' : '') +
        (res.huecoFlotante ? ((res.visible || res.penetraCuerpo) ? '|' : '') + 'flota' : '') +
        (res.parpadeo ? ((res.visible || res.penetraCuerpo || res.huecoFlotante) ? '|' : '') + 'parpadea' : '');
    } catch (e) {
      res.error = String((e && e.message) || e);
      res.status = 'ERROR';
      res.failReason = 'error: ' + res.error;
    }
    res.ms = v23aNow() - started;
    return res;
  }

  /* Instantánea de render para evidencia (PNG dataURL sobre fondo oscuro). */
  function v23aShot(heroId, cosmeticId, opts) {
    opts = opts || {};
    var size = opts.size || 224;
    try {
      var c = COSMETIC_BY_ID[cosmeticId];
      if (!c) return '';
      var slot = c.category;
      var prev = V23A.fitting;
      if (opts.raw) V23A.fitting = false;
      var av;
      try {
        var outfit = {};
        if (slot !== 'titulo') outfit[slot] = cosmeticId;
        av = v23aPrepAvatar(heroId, outfit);
      } finally { V23A.fitting = prev; }
      var groups = v23aPieceGroups(av);
      if (!groups.length && slot !== 'titulo') return '';
      var qa = v23aQA();
      var m = v23aMeasure(av);
      var box = v23aBoxValid(m.fullB) ? m.fullB.clone() : v23aBoxEmpty();
      if (groups.length) {
        for (var i = 0; i < groups.length; i++) {
          var gb = v23aBoxBetween(v23aBoxOf(groups[i], groups[i].parent, null, true), groups[i].parent, av.body);
          if (v23aBoxValid(gb)) box.union(gb);
          else { var gs2 = v23aBoxBetween(v23aBoxOf(groups[i], groups[i].parent), groups[i].parent, av.body); if (v23aBoxValid(gs2)) box.union(gs2); }
        }
      }
      if (slot === 'cabeza' || slot === 'peinado') {
        var hb = v23aBoxValid(m.headAllB) ? m.headAllB.clone() : box.clone();
        var hc = v23aBoxCenter(hb), hsz = v23aBoxSize(hb);
        box = new THREE.Box3(
          new THREE.Vector3(hc.x - Math.max(hsz.x, 0.65), hc.y - Math.max(hsz.y, 0.55), hc.z - 0.6),
          new THREE.Vector3(hc.x + Math.max(hsz.x, 0.65), hc.y + Math.max(hsz.y, 0.6), hc.z + 0.6)
        );
      }
      if (!v23aBoxValid(box)) return '';
      qa.renderer.setSize(size, size, false);
      qa.ctx2d.canvas.width = size; qa.ctx2d.canvas.height = size;
      var world = box.clone().applyMatrix4(av.body.matrixWorld);
      v23aFrameCamera(qa.camera, world, opts.pad || 1.32);
      qa.renderer.render(qa.scene, qa.camera);
      var out = document.createElement('canvas');
      out.width = size; out.height = size;
      var g = out.getContext('2d');
      var grad = g.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, '#0b1020');
      grad.addColorStop(1, '#1a2338');
      g.fillStyle = grad; g.fillRect(0, 0, size, size);
      g.drawImage(qa.canvas, 0, 0, size, size);
      var url = out.toDataURL('image/png');
      qa.renderer.setSize(Q.size, Q.size, false);
      qa.ctx2d.canvas.width = Q.size; qa.ctx2d.canvas.height = Q.size;
      return url;
    } catch (e) {
      V23A.errors.push('shot: ' + (e && e.message ? e.message : e));
      return '';
    }
  }

  /* -----------------------------------------------------------------------
     API pública de QA
     ----------------------------------------------------------------------- */
  function v23aCaseList(opts) {
    opts = opts || {};
    var heroes = opts.heroes || (CAMP.characters || []).map(function (c) { return c.id; });
    var cosmetics = opts.cosmetics || (ALL_COSMETICS || []).map(function (c) { return c.id; });
    var out = [];
    for (var h = 0; h < heroes.length; h++) {
      for (var c = 0; c < cosmetics.length; c++) out.push([heroes[h], cosmetics[c]]);
    }
    return out;
  }

  function v23aMatrix(opts) {
    opts = opts || {};
    var cases = v23aCaseList(opts);
    var from = Math.max(0, Number(opts.from) || 0);
    var to = opts.to == null ? cases.length : Math.min(cases.length, Number(opts.to));
    var out = [];
    for (var i = from; i < to; i++) {
      out.push(v23aAudit(cases[i][0], cases[i][1], { raw: !!opts.raw, minArea: opts.minArea }));
    }
    var pass = 0, bySlot = {};
    for (var j = 0; j < out.length; j++) {
      var r = out[j];
      bySlot[r.slot] = bySlot[r.slot] || { total: 0, pass: 0, fail: 0 };
      bySlot[r.slot].total++;
      if (r.status === 'PASS') { pass++; bySlot[r.slot].pass++; } else bySlot[r.slot].fail++;
    }
    return { from: from, to: to, total: cases.length, cases: out, summary: { total: out.length, pass: pass, fail: out.length - pass, bySlot: bySlot } };
  }

  function v23aApi() {
    var api = {
      __part: 'part11-v23-anchors',
      version: V23A.version,
      ready: false,
      reason: '',
      fitting: true,
      anchors: function (heroId) {
        try {
          var av = Q.avatars[heroId] || (function () { var a = buildHeroAvatar(heroId); v23aResetPose(a); return a; })();
          return v23aAnchors(av);
        } catch (e) { return { error: String(e && e.message ? e.message : e) }; }
      },
      anchorTable: function () {
        var out = {};
        var list = (CAMP.characters || []);
        for (var i = 0; i < list.length; i++) out[list[i].id] = api.anchors(list[i].id);
        return out;
      },
      cosmeticIds: function () { return (ALL_COSMETICS || []).map(function (c) { return c.id; }); },
      heroIds: function () { return (CAMP.characters || []).map(function (c) { return c.id; }); },
      slotOf: function (id) { var c = COSMETIC_BY_ID[id]; return c ? c.category : ''; },
      fitOf: function (heroId, cosmeticId) {
        try {
          var av = v23aPrepAvatar(heroId, (function () { var c = COSMETIC_BY_ID[cosmeticId]; var o = {}; if (c && c.category !== 'titulo') o[c.category] = cosmeticId; return o; })());
          var g = v23aPieceGroups(av)[0];
          return g && g.userData ? { fit: g.userData.v23Fit || null, animOffset: g.userData.v23AnimOffset || null } : null;
        } catch (e) { return { error: String(e && e.message ? e.message : e) }; }
      },
      audit: function (heroId, cosmeticId, opts) { return v23aAudit(heroId, cosmeticId, opts); },
      matrix: function (opts) { return v23aMatrix(opts); },
      matrixAsync: function (opts) {
        opts = opts || {};
        var cases = v23aCaseList(opts);
        var chunk = Math.max(1, Number(opts.chunk) || 35);
        var out = [], idx = 0;
        return new Promise(function (resolve) {
          function step() {
            var end = Math.min(cases.length, idx + chunk);
            for (; idx < end; idx++) out.push(v23aAudit(cases[idx][0], cases[idx][1], { raw: !!opts.raw, minArea: opts.minArea }));
            if (idx < cases.length) { setTimeout(step, 0); return; }
            var pass = 0;
            out.forEach(function (r) { if (r.status === 'PASS') pass++; });
            resolve({ total: out.length, pass: pass, fail: out.length - pass, cases: out });
          }
          setTimeout(step, 0);
        });
      },
      shot: function (heroId, cosmeticId, opts) { return v23aShot(heroId, cosmeticId, opts || {}); },
      shots: function (heroId, ids, opts) {
        var out = {};
        (ids || []).forEach(function (id) { var s = v23aShot(heroId, id, opts || {}); if (s) out[id] = s; });
        return out;
      },
      visorInfo: function () {
        try {
          var p = (typeof wardrobe !== 'undefined' && wardrobe) ? wardrobe.preview : null;
          var av = p && p.avatar;
          return {
            screen: typeof screen === 'string' ? screen : '',
            previewMode: (typeof V22 !== 'undefined' && V22) ? V22.previewMode : '',
            hero: av ? av.id : null,
            groups: av && av.cosmetics ? av.cosmetics.groups.length : 0,
            slots: av && av.cosmetics ? JSON.parse(JSON.stringify(av.cosmetics.slots || {})) : {},
            title: av && av.cosmetics ? av.cosmetics.title || null : null,
            equipped: (typeof state !== 'undefined' && state && state.collection) ? JSON.parse(JSON.stringify(state.collection.equipped || {})) : null
          };
        } catch (e) { return { error: String(e && e.message ? e.message : e) }; }
      },
      stateSnapshot: function () {
        try {
          return {
            selected: state.collection.selectedCharacterId,
            ownedCosmetics: state.collection.ownedCosmeticIds.length,
            ownedHeroes: state.collection.ownedCharacterIds.slice(),
            equipped: JSON.parse(JSON.stringify(state.collection.equipped || {})),
            titles: (CAMP.characters || []).reduce(function (acc, ch) { acc[ch.id] = typeof titleText === 'function' ? titleText(ch.id) : null; return acc; }, {})
          };
        } catch (e) { return { error: String(e && e.message ? e.message : e) }; }
      },
      heroSwitchCheck: function () {
        var before = api.stateSnapshot();
        var rows = [];
        var eqBefore = before.equipped ? JSON.stringify(before.equipped) : '';
        try {
          (CAMP.characters || []).forEach(function (ch) {
            var outfit = typeof getCharacterOutfit === 'function' ? getCharacterOutfit(ch.id) : {};
            var av = v23aPrepAvatar(ch.id, outfit);
            rows.push({
              hero: ch.id,
              outfit: outfit,
              groups: av.cosmetics ? av.cosmetics.groups.length : 0,
              slots: av.cosmetics ? Object.keys(av.cosmetics.slots || {}).length : 0,
              title: av.cosmetics ? av.cosmetics.title || null : null
            });
          });
        } catch (e) {
          return { ok: false, error: String(e && e.message ? e.message : e), rows: rows };
        }
        var after = api.stateSnapshot();
        var eqAfter = after.equipped ? JSON.stringify(after.equipped) : '';
        return { ok: eqBefore === eqAfter && before.selected === after.selected, savedUnchanged: eqBefore === eqAfter, rows: rows, before: before, after: after };
      },
      stats: function () {
        return {
          ready: V23A.ready, reason: V23A.reason, fitted: V23A.fitted,
          errors: V23A.errors.slice(0, 12), errorCount: V23A.errors.length,
          qaReady: !!Q.renderer, avatars: Object.keys(Q.avatars).length
        };
      },
      errors: function () { return V23A.errors.slice(); },
      setFitting: function (on) { V23A.fitting = !!on; api.fitting = !!on; return V23A.fitting; },
      clear: function () { V23A.errors.length = 0; }
    };
    return api;
  }

  /* -----------------------------------------------------------------------
     Arranque
     ----------------------------------------------------------------------- */
  function v23aBoot() {
    try {
      var api = v23aApi();
      if (typeof V23 !== 'undefined' && V23 && V23.flags) V23.flags.anchorsReady = true;
      V23A.ready = v23aInstall();
      api.ready = V23A.ready;
      api.reason = V23A.ready ? '' : V23A.reason;
      window.__v23Anchors = api;
      window.__v23Anchors.fitting = V23A.fitting;
      /* Reconstruye el héroe visible para que el HUB use las anclas nuevas.
         boot() ya se ejecutó antes de cargar este módulo. */
      if (V23A.ready) {
        try { if (typeof rebuildHeroAvatar === 'function') rebuildHeroAvatar(); } catch (e) { V23A.errors.push('rebuild: ' + (e && e.message ? e.message : e)); }
        try { if (typeof wardrobe !== 'undefined' && wardrobe && wardrobe.preview && wardrobe.preview.avatar) { wardrobe.preview.lastKey = ''; if (typeof updateWardrobeAvatar === 'function') updateWardrobeAvatar(); } } catch (e2) {}
      }
      V23A.ready = V23A.ready && true;
    } catch (e) {
      V23A.ready = false;
      V23A.reason = String(e && e.message ? e.message : e);
      V23A.errors.push('boot: ' + V23A.reason);
      window.__v23Anchors = window.__v23Anchors || {};
      window.__v23Anchors.__part = 'part11-v23-anchors';
      window.__v23Anchors.ready = false;
      window.__v23Anchors.reason = V23A.reason;
      window.__v23Anchors.errors = function () { return V23A.errors.slice(); };
    }
  }

  v23aBoot();
})();
