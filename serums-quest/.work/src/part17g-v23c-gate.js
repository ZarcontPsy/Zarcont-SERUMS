/* =========================================================================
   V2.3 · FASE 2 · PUERTA DE CALIDAD (AGENTE 1 / QA)
   -------------------------------------------------------------------------
   Mide la pieza real: silueta frontal y lateral, caja envolvente, componentes,
   extremos del perfil, formas, tonos, emisión y animación. También compara las
   máscaras de los efectos para exigir firmas distintas.
   ========================================================================= */
var V23CG = window.__v23cGate = window.__v23cGate || {};
V23CG.version = 'f2-gate-1';
V23CG.size = 256;
V23CG.renderer = null;
V23CG.scene = null;
V23CG.camera = null;
V23CG._white = null;
V23CG._last = null;

function v23cGateDummy() {
  var root = new THREE.Group();
  var body = new THREE.Group();
  var torso = new THREE.Group(); torso.position.y = 1.0;
  var head = new THREE.Group(); head.position.y = 1.7;
  var leftArm = new THREE.Group(); leftArm.position.set(-0.4, 1.4, 0);
  var rightArm = new THREE.Group(); rightArm.position.set(0.4, 1.4, 0);
  var leftLeg = new THREE.Group(); leftLeg.position.set(-0.18, 0.82, 0);
  var rightLeg = new THREE.Group(); rightLeg.position.set(0.18, 0.82, 0);
  var weapon = new THREE.Group();
  rightArm.add(weapon);
  body.add(torso, head, leftArm, rightArm, leftLeg, rightLeg);
  root.add(body);
  return { root: root, body: body, torso: torso, head: head, leftArm: leftArm, rightArm: rightArm, leftLeg: leftLeg, rightLeg: rightLeg, weapon: weapon };
}
function v23cGateEnsure() {
  if (V23CG.renderer) return V23CG.renderer;
  var canvas = document.createElement('canvas');
  canvas.width = V23CG.size; canvas.height = V23CG.size;
  var r = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1);
  r.setSize(V23CG.size, V23CG.size, false);
  r.setClearColor(0x000000, 0);
  r.toneMapping = THREE.NoToneMapping;
  V23CG.renderer = r;
  V23CG.scene = new THREE.Scene();
  V23CG.camera = new THREE.PerspectiveCamera(30, 1, 0.05, 80);
  V23CG._white = new THREE.MeshBasicMaterial({ color: 0xffffff });
  return r;
}
function v23cGateBuild(id) {
  var c = null;
  try { c = COSMETIC_BY_ID[id]; } catch (e) { return null; }
  if (!c) return null;
  var av = v23cGateDummy();
  var qf = 0.72;
  var custom = window.V23C && V23C.pieces ? V23C.pieces[id] : null;
  var groups = [];
  try {
    if (custom) {
      var out = custom(c, qf, av, c.category);
      if (Array.isArray(out)) out.forEach(function (p) { if (p && p.group) groups.push(p.group); });
      else if (out) groups.push(out);
    } else if (c.category === 'cabeza') groups.push(buildHeadPiece(c, qf));
    else if (c.category === 'peinado') groups.push(buildHairPiece(c, qf));
    else if (c.category === 'torso') groups.push(buildTorsoPiece(c, qf));
    else if (c.category === 'piernas') {
      var legs = buildLegPair(c, qf, av);
      if (Array.isArray(legs)) legs.forEach(function (p) { if (p && p.group) groups.push(p.group); });
    } else if (c.category === 'accesorios') {
      groups.push(c.id === 'c-accesorios-gafas' ? buildHeadAccessory(c, qf) : c.id === 'c-accesorios-brujula' ? buildWristCompass(c, qf) : buildHipExtra(c, qf, av));
    } else if (c.category === 'extras') groups.push(buildHipExtra(c, qf, av));
    else if (c.category === 'amuletos') { var am = buildAmulet(c, qf); am.scale.setScalar(1.32); groups.push(am); }
    else if (c.category === 'efectos') groups.push(buildEffectPiece(c, qf, av));
    else if (c.category === 'marcos') groups.push(buildFramePiece(c, qf, av));
    else if (c.category === 'mascota') groups.push(buildPetPiece(c, qf, av));
    else if (c.category === 'estela') groups.push(buildTrailPiece(c, qf, av));
  } catch (e) {
    return { error: String(e && e.message || e), c: c, groups: [] };
  }
  groups = groups.filter(Boolean);
  if (!groups.length) return { error: 'sin-grupo', c: c, groups: [] };
  return { c: c, groups: groups };
}
function v23cGateMeshInfo(groups) {
  var forms = {}, tones = {}, emissive = 0, meshes = 0, sprites = 0, anims = [];
  var bbox = null;
  groups.forEach(function (g) {
    g.updateMatrixWorld(true);
    g.traverse(function (n) {
      if (n.isSprite) sprites += 1;
      if (n.isMesh && n.geometry) {
        meshes += 1;
        var fam = n.geometry.type || 'BufferGeometry';
        if (fam === 'BufferGeometry') fam = 'VoxelMerged';
        forms[fam] = 1;
        if (n.geometry.boundingBox === null) n.geometry.computeBoundingBox();
        if (n.geometry.attributes && n.geometry.attributes.position) {
          var b = new THREE.Box3().setFromObject(n);
          if (!b.isEmpty()) bbox = bbox ? bbox.union(b) : b;
        }
        if (n.material) {
          if (n.material.color) tones[n.material.color.getHexString()] = 1;
          if (n.material.emissive && (n.material.emissive.r + n.material.emissive.g + n.material.emissive.b) > 0.02) emissive += 1;
        }
      }
      if (n.userData && n.userData.anim) {
        n.userData.anim.forEach(function (a) { anims.push(a.type || '?'); });
      }
    });
  });
  return { forms: Object.keys(forms), tones: Object.keys(tones), emissive: emissive, meshes: meshes, sprites: sprites, anims: anims, bbox: bbox };
}
function v23cGateMask(groups, view) {
  var r = v23cGateEnsure();
  var scene = V23CG.scene;
  while (scene.children.length) scene.remove(scene.children[0]);
  var holder = new THREE.Group();
  groups.forEach(function (g) {
    var clone = g.clone(true);
    clone.traverse(function (n) {
      if (n.isSprite || n.isPoints || n.isLine) n.visible = false;
      else if (n.isMesh) n.material = V23CG._white;
    });
    holder.add(clone);
  });
  scene.add(holder);
  scene.overrideMaterial = V23CG._white;
  var box = new THREE.Box3().setFromObject(holder);
  if (box.isEmpty()) box.set(new THREE.Vector3(-0.5, -0.5, -0.5), new THREE.Vector3(0.5, 0.5, 0.5));
  var center = box.getCenter(new THREE.Vector3());
  var size = box.getSize(new THREE.Vector3());
  var dir = view === 'side' ? new THREE.Vector3(-1, 0.14, 0.18).normalize() : new THREE.Vector3(0.16, 0.10, 1).normalize();
  var dist = Math.max(1.2, Math.max(size.x, size.y, 0.4) * 1.25 / Math.tan(15 * Math.PI / 180));
  var cam = V23CG.camera;
  cam.position.copy(center).addScaledVector(dir, dist);
  cam.lookAt(center);
  cam.near = Math.max(0.02, dist * 0.1);
  cam.far = dist + 20;
  cam.updateProjectionMatrix();
  r.setRenderTarget(null);
  r.setViewport(0, 0, V23CG.size, V23CG.size);
  r.setScissorTest(false);
  r.clear();
  r.render(scene, cam);
  scene.overrideMaterial = null;
  var gl = r.getContext();
  var w = V23CG.size, h = V23CG.size;
  var buf = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  var mask = new Uint8Array(w * h);
  var minX = w, minY = h, maxX = -1, maxY = -1, area = 0;
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      var i = ((h - 1 - y) * w + x) * 4;
      var a = buf[i + 3];
      if (a > 24) {
        mask[y * w + x] = 1;
        area += 1;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) { minX = 0; minY = 0; maxX = w - 1; maxY = h - 1; }
  var bw = maxX - minX + 1, bh = maxY - minY + 1;
  var comps = v23cGateComponents(mask, w, h, 12);
  var extrema = v23cGateProfileExtrema(mask, w, h, minX, maxX, minY, maxY);
  return {
    mask: mask, w: w, h: h, area: area, bbox: { x: minX, y: minY, w: bw, h: bh },
    boxiness: bw > 0 && bh > 0 ? area / (bw * bh) : 1,
    aspect: bw > 0 ? bh / bw : 0,
    components: comps, extrema: extrema,
    dataUrl: v23cGateMaskDataUrl(mask, w, h)
  };
}
function v23cGateMaskDataUrl(mask, w, h) {
  var c = document.createElement('canvas'); c.width = w; c.height = h;
  var ctx = c.getContext('2d');
  var img = ctx.createImageData(w, h);
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      var i = (y * w + x) * 4;
      var on = mask[y * w + x];
      img.data[i] = on ? 245 : 6;
      img.data[i + 1] = on ? 243 : 9;
      img.data[i + 2] = on ? 235 : 16;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
}
function v23cGateComponents(mask, w, h, minPixels) {
  var seen = new Uint8Array(w * h), count = 0;
  var stack = [];
  for (var i = 0; i < mask.length; i++) {
    if (!mask[i] || seen[i]) continue;
    var n = 0;
    stack.length = 0; stack.push(i); seen[i] = 1;
    while (stack.length) {
      var p = stack.pop(); n += 1;
      var x = p % w, y = Math.floor(p / w);
      var nb = [p - 1, p + 1, p - w, p + w];
      for (var k = 0; k < 4; k++) {
        var q = nb[k];
        if (q < 0 || q >= mask.length) continue;
        var qx = q % w, qy = Math.floor(q / w);
        if (Math.abs(qx - x) + Math.abs(qy - y) !== 1) continue;
        if (mask[q] && !seen[q]) { seen[q] = 1; stack.push(q); }
      }
    }
    if (n >= minPixels) count += 1;
  }
  return count;
}
function v23cGateProfileExtrema(mask, w, h, minX, maxX, minY, maxY) {
  var widths = [];
  for (var y = minY; y <= maxY; y++) {
    var a = -1, b = -1;
    for (var x = minX; x <= maxX; x++) {
      if (mask[y * w + x]) { if (a < 0) a = x; b = x; }
    }
    widths.push(a < 0 ? 0 : b - a + 1);
  }
  var sm = [];
  for (var i = 0; i < widths.length; i++) {
    var s = 0, n = 0;
    for (var k = -1; k <= 1; k++) { var idx = i + k; if (idx >= 0 && idx < widths.length) { s += widths[idx]; n += 1; } }
    sm.push(s / n);
  }
  var extrema = 0;
  var trend = 0;
  for (var j = 1; j < sm.length; j++) {
    var d = sm[j] - sm[j - 1];
    var t = Math.abs(d) < 1.5 ? 0 : (d > 0 ? 1 : -1);
    if (t !== 0 && trend !== 0 && t !== trend) extrema += 1;
    if (t !== 0) trend = t;
  }
  return extrema;
}
function v23cGateRarity(c) { try { return cosmeticRarityKey(c); } catch (e) { return c && c.rarity || 'comun'; } }
function v23cGateVerdict(metrics, rarity, id) {
  var common = rarity === 'comun';
  var uncommon = rarity === 'poco_comun';
  var rare = rarity === 'raro';
  var epic = rarity === 'epico';
  var legend = rarity === 'legendario';
  var needsSignal = rare || epic || legend;
  var need = {
    boxiness: 0.90,
    forms: 3,
    tones: 4,
    defects: 0,
    animated: legend ? 2 : epic ? 1 : 0,
    emissive: 0,
    signal: needsSignal ? 1 : 0
  };
  var reasons = [];
  if (metrics.boxiness > need.boxiness) reasons.push('boxiness ' + metrics.boxiness.toFixed(3));
  if (metrics.forms.length < need.forms) reasons.push('formas ' + metrics.forms.length + '/' + need.forms);
  if (metrics.tones.length < need.tones) reasons.push('tonos ' + metrics.tones.length + '/' + need.tones);
  if (metrics.anims.length < need.animated) reasons.push('anim ' + metrics.anims.length + '/' + need.animated);
  if (needsSignal && (metrics.emissive + metrics.anims.length) < 1) reasons.push('sin emisión ni animación');
  if (legend) {
    var hasOrbit = metrics.anims.some(function (t) { return /orbit|particle|twinkle|constellation/i.test(t); });
    if (!hasOrbit) reasons.push('legendario sin órbita/partículas');
  }
  return { pass: reasons.length === 0, reasons: reasons, need: need };
}
V23CG.piece = function (id) {
  var built = v23cGateBuild(id);
  if (!built || built.error || !built.groups.length) return { id: id, error: built ? built.error : 'no-existe' };
  var info = v23cGateMeshInfo(built.groups);
  var front = v23cGateMask(built.groups, 'front');
  var side = v23cGateMask(built.groups, 'side');
  var metrics = {
    id: id, category: built.c.category, rarity: v23cGateRarity(built.c),
    forms: info.forms, tones: info.tones, emissive: info.emissive, meshes: info.meshes, sprites: info.sprites,
    anims: info.anims,
    boxiness: front.boxiness,
    boxinessFront: front.boxiness, boxinessSide: side.boxiness,
    components: front.components, extrema: front.extrema,
    aspect: front.aspect,
    fronts: front, sides: side
  };
  metrics.verdict = v23cGateVerdict(metrics, metrics.rarity, id);
  metrics.silhouette = front.dataUrl;
  metrics.silhouetteSide = side.dataUrl;
  V23CG._last = metrics;
  return metrics;
};
V23CG.all = function () {
  var out = [];
  try {
    ALL_COSMETICS.forEach(function (c) {
      if (c.category === 'titulo') return;
      try { out.push(V23CG.piece(c.id)); } catch (e) { out.push({ id: c.id, error: String(e && e.message || e) }); }
    });
  } catch (e) {}
  return out;
};
function v23cGateCrop(mask, w, h) {
  var minX = w, minY = h, maxX = -1, maxY = -1;
  for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
    if (!mask[y * w + x]) continue;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}
function v23cGateNormalizedMask(maskInfo, size) {
  var c = document.createElement('canvas'); c.width = size; c.height = size;
  var ctx = c.getContext('2d');
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, size, size);
  var src = document.createElement('canvas'); src.width = maskInfo.w; src.height = maskInfo.h;
  var sctx = src.getContext('2d');
  var img = sctx.createImageData(maskInfo.w, maskInfo.h);
  for (var i = 0; i < maskInfo.mask.length; i++) {
    var on = maskInfo.mask[i];
    img.data[i * 4] = on ? 255 : 0;
    img.data[i * 4 + 1] = on ? 255 : 0;
    img.data[i * 4 + 2] = on ? 255 : 0;
    img.data[i * 4 + 3] = 255;
  }
  sctx.putImageData(img, 0, 0);
  var box = v23cGateCrop(maskInfo.mask, maskInfo.w, maskInfo.h);
  if (!box) return ctx.getImageData(0, 0, size, size).data;
  var scale = Math.min((size * 0.86) / box.w, (size * 0.86) / box.h);
  var dw = Math.max(1, Math.round(box.w * scale)), dh = Math.max(1, Math.round(box.h * scale));
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, box.x, box.y, box.w, box.h, Math.round((size - dw) / 2), Math.round((size - dh) / 2), dw, dh);
  return ctx.getImageData(0, 0, size, size).data;
}
V23CG.compareEffects = function (ids, size) {
  var list = ids && ids.length ? ids : ALL_COSMETICS.filter(function (c) { return c.category === 'efectos'; }).map(function (c) { return c.id; });
  var n = size || 128;
  var masks = {};
  var errors = [];
  var areas = {};
  list.forEach(function (id) {
    var built = v23cGateBuild(id);
    if (!built || !built.groups.length) { errors.push(id + ':sin-grupo'); return; }
    var m = v23cGateMask(built.groups, 'front');
    areas[id] = m.area;
    if (m.area < 80) errors.push(id + ':sin-geometria-solida');
    masks[id] = v23cGateNormalizedMask(m, n);
  });
  var rows = [];
  var min = { pair: null, value: 1 };
  for (var i = 0; i < list.length; i++) {
    for (var j = i + 1; j < list.length; j++) {
      var a = masks[list[i]], b = masks[list[j]];
      if (!a || !b) continue;
      var inter = 0, uni = 0;
      for (var k = 0; k < a.length; k += 4) {
        var pa = a[k] > 120, pb = b[k] > 120;
        if (pa && pb) inter += 1;
        if (pa || pb) uni += 1;
      }
      var iou = uni ? inter / uni : 0;
      var diff = Math.round((1 - iou) * 1000) / 1000;
      rows.push({ a: list[i], b: list[j], iou: Math.round(iou * 1000) / 1000, difference: diff });
      if (diff < min.value) min = { pair: [list[i], list[j]], value: diff };
    }
  }
  var aura = ['c-efecto-aura', 'x-aura-amanecer', 'c-efecto-bruma', 'c-efecto-constelacion'];
  var auraPairs = rows.filter(function (r) { return aura.indexOf(r.a) >= 0 && aura.indexOf(r.b) >= 0; });
  var auraMin = auraPairs.reduce(function (m, r) { return !m || r.difference < m.difference ? r : m; }, null);
  return { size: n, ids: list, rows: rows, min: min, auraMin: auraMin, errors: errors, areas: areas, pass: errors.length === 0 && min.value >= 0.35 && auraMin && auraMin.difference >= 0.45 };
};
V23CG.renderPiece = function (id, view) {
  var built = v23cGateBuild(id);
  if (!built || !built.groups.length) return '';
  return v23cGateMask(built.groups, view || 'front').dataUrl;
};
console.log('[V2.3C] puerta de calidad lista');
