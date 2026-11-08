/* =========================================================================
   SERUMS QUEST · V2.1 · AGENTE 6 — rendimiento del atrio y banco original
   Este archivo se carga después de part5-assets y part6-world (build-game.js)
   y antes de part4-flow, que es quien llama a frame()/boot().

   Contenido:
   - Sombras: fija renderer.shadowMap.type = THREE.PCFShadowMap al arrancar y
     lo reafirma en cada frame. three.js r187 ya sustituye PCFSoftShadowMap por
     PCFShadowMap al primer render de sombras y avisa por consola; fijarlo antes
     evita los avisos sin cambiar el resultado visible.
   - Atrio: culling/recorte en runtime SOLO sobre las raíces decorativas que
     publica part5-assets en v2aHub.roots (props fusionados, vegetación
     instanciada, esbirros y polvo). Nunca toca cofres, guías, fragmentos,
     estaciones ni sombras del error (viven en v2wWorldRoot, de part6-world).
     Con todas las misiones completadas la densidad baja: menos vegetación,
     menos polvo, sin esbirros y props visibles solo cerca del héroe.
   - Banco original: toggle de ajustes, questionAllowed(q)/filterQuestions(list)
     y stats(). V2.feedback (Agente 3) y los modos (Agente 0) pueden usar el
     filtro; aquí solo se decide y se expone.

   API: V2.perf = { boot, settingsHTML, mountSettings, questionAllowed,
   filterQuestions, update, stats, applyShadow, shadowStats, onlyOriginalBank,
   setOnlyOriginalBank, bankStats, refresh, restore, cullState }.

   ES5 (var/function), defensivo si falta THREE, hubGroup, estado o DOM.
   ========================================================================= */

/* -------------------------------------------------------------------------
   Puente con el núcleo V2
   ------------------------------------------------------------------------- */
function v2pCore() {
  try {
    if (typeof V2 !== 'undefined' && V2) return V2;
  } catch (e) {}
  try { return window.__SERUMS_V2__ || null; } catch (e2) { return null; }
}
function v2pSoft(error) {
  var core = v2pCore();
  try { if (core && core.softError) core.softError('perf', error); } catch (e) {}
}
function v2pEmit(type, payload) {
  var core = v2pCore();
  try { if (core && core.emit) core.emit(type, payload || null); } catch (e) {}
}
function v2pIsFunction(value) {
  return typeof value === 'function';
}
function v2pQuality() {
  var q = 'medio';
  try {
    var core = v2pCore();
    if (core && core.quality) q = core.quality();
  } catch (e) {}
  if (q !== 'bajo' && q !== 'medio' && q !== 'alto') q = 'medio';
  return q;
}
function v2pReducedMotion() {
  try {
    var core = v2pCore();
    if (core && core.reducedMotion) return !!core.reducedMotion();
  } catch (e) {}
  try {
    if (typeof state !== 'undefined' && state && state.settings && state.settings.reducedMotion) return true;
  } catch (e2) {}
  try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e3) { return false; }
}
function v2pEsc(value) {
  try { if (v2pIsFunction(esc)) return esc(value); } catch (e) {}
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function v2pToast(message, kind, ms) {
  try {
    if (v2pIsFunction(toast)) { toast(message, kind || 'success', ms || 2600); return true; }
  } catch (e) {}
  return false;
}
function v2pClamp(value, min, max) {
  var n = Number(value);
  if (!isFinite(n)) n = min;
  return Math.max(min, Math.min(max, n));
}

var V2P_VERSION = '2.1.0-perf';
var V2P_TICK_MS = 160;

/* -------------------------------------------------------------------------
   Sombras: PCFShadowMap (evita "PCFSoftShadowMap has been removed" en r187)
   En three 0.187 la constante PCFSoftShadowMap sigue exportada (valor 2),
   pero WebGLShadowMap.render la detecta, avisa y la sustituye por
   PCFShadowMap (valor 1). Fijarla antes del primer render deja el mismo
   resultado y elimina el aviso por completo.
   ------------------------------------------------------------------------- */
var V2P_SHADOW_FALLBACK = 1;
var v2pShadowState = { fixes: 0, appliedAt: 0, lastType: null, loadedType: null };
function v2pThree() {
  try { return (typeof THREE !== 'undefined' && THREE) ? THREE : null; } catch (e) { return null; }
}
function v2pMainRenderer() {
  try { return (typeof renderer !== 'undefined' && renderer) ? renderer : null; } catch (e) { return null; }
}
function v2pPcfType() {
  var T = v2pThree();
  if (T && T.PCFShadowMap != null) return T.PCFShadowMap;
  return V2P_SHADOW_FALLBACK;
}
function v2pShadowName(type) {
  var T = v2pThree();
  if (T) {
    if (type === T.PCFShadowMap) return 'PCFShadowMap';
    if (type === T.PCFSoftShadowMap) return 'PCFSoftShadowMap (retirada)';
    if (type === T.BasicShadowMap) return 'BasicShadowMap';
    if (type === T.VSMShadowMap) return 'VSMShadowMap';
  }
  return 'tipo ' + type;
}
function v2pApplyShadow(force) {
  var r = v2pMainRenderer();
  if (!r || !r.shadowMap) return false;
  var target = v2pPcfType();
  var current = r.shadowMap.type;
  if (v2pShadowState.loadedType == null) v2pShadowState.loadedType = current;
  var changed = false;
  if (current !== target || force) {
    r.shadowMap.type = target;
    changed = true;
  }
  if (changed) {
    v2pShadowState.fixes += 1;
    v2pShadowState.lastType = current;
    v2pShadowState.appliedAt = Date.now();
    v2pEmit('perf:shadow', { from: current, to: target, name: v2pShadowName(target) });
  }
  /* Los retratos usan su propio renderer con sombras apagadas; se unifica el
     tipo por si algún día se activan. */
  try {
    if (typeof portraitRenderer !== 'undefined' && portraitRenderer && portraitRenderer.shadowMap &&
        portraitRenderer.shadowMap.type !== target) {
      portraitRenderer.shadowMap.type = target;
    }
  } catch (e) {}
  return changed;
}
function v2pShadowStats() {
  var r = v2pMainRenderer();
  var out = {
    available: false,
    applied: false,
    type: null,
    name: 'sin renderer',
    enabled: false,
    warningFree: false,
    legacyType: false,
    mapSize: 0,
    bias: null,
    normalBias: null,
    fixes: v2pShadowState.fixes,
    source: 'part9-perf'
  };
  if (!r || !r.shadowMap) return out;
  out.available = true;
  out.applied = true;
  out.type = r.shadowMap.type;
  out.name = v2pShadowName(out.type);
  out.enabled = !!r.shadowMap.enabled;
  out.warningFree = out.type === v2pPcfType();
  out.legacyType = !!v2pThree() && out.type === v2pThree().PCFSoftShadowMap;
  try {
    if (typeof moonLight !== 'undefined' && moonLight && moonLight.shadow) {
      var sh = moonLight.shadow;
      out.mapSize = (sh.mapSize && sh.mapSize.x) ? sh.mapSize.x : 0;
      out.bias = typeof sh.bias === 'number' ? sh.bias : null;
      out.normalBias = typeof sh.normalBias === 'number' ? sh.normalBias : null;
    }
  } catch (e) {}
  return out;
}

/* -------------------------------------------------------------------------
   Progreso (para bajar la densidad del atrio al completar las misiones)
   ------------------------------------------------------------------------- */
var v2pProgressCache = { ready: false, at: 0, completed: {}, all: false, done: 0, total: 0, areas: 0 };
function v2pMissionsFor(areaId) {
  if (!areaId) return [];
  try {
    if (v2pIsFunction(areaMissions)) {
      var list = areaMissions(areaId);
      if (list && list.length) return list;
    }
  } catch (e) {}
  var out = [];
  try {
    if (typeof CAMP !== 'undefined' && CAMP && CAMP.missions) {
      for (var i = 0; i < CAMP.missions.length; i++) {
        if (CAMP.missions[i] && CAMP.missions[i].areaId === areaId) out.push(CAMP.missions[i]);
      }
    }
  } catch (e2) {}
  return out;
}
function v2pMissionDone(mission) {
  if (!mission || !mission.id) return false;
  try { if (v2pIsFunction(missionCompleted)) return !!missionCompleted(mission.id); } catch (e) {}
  try {
    if (typeof state !== 'undefined' && state && state.missions && state.missions[mission.id]) {
      return !!state.missions[mission.id].completedAt;
    }
  } catch (e2) {}
  return false;
}
function v2pProgress(force) {
  var now = Date.now();
  if (!force && v2pProgressCache.ready && now - v2pProgressCache.at < 1500) return v2pProgressCache;
  var completed = {};
  var all = false;
  var done = 0;
  var total = 0;
  var areas = 0;
  var list = [];
  try {
    if (typeof CAMP !== 'undefined' && CAMP && CAMP.areas && CAMP.areas.length) list = CAMP.areas;
  } catch (e) {}
  for (var i = 0; i < list.length; i++) {
    var area = list[i];
    if (!area || !area.id) continue;
    areas += 1;
    var missions = v2pMissionsFor(area.id);
    var areaDone = 0;
    for (var j = 0; j < missions.length; j++) {
      if (v2pMissionDone(missions[j])) areaDone += 1;
    }
    total += missions.length;
    done += areaDone;
    completed[area.id] = missions.length > 0 && areaDone >= missions.length;
  }
  all = areas > 0 && done >= total && total > 0;
  /* Respaldo si no hay catálogo de campaña disponible. */
  if (!areas) {
    try {
      var core = v2pCore();
      var world = core && core.world;
      var stats = world && v2pIsFunction(world.stats) ? world.stats() : null;
      if (stats && stats.guides && stats.guides.total) {
        all = stats.guides.completed >= stats.guides.total;
      }
    } catch (e2) {}
  }
  v2pProgressCache = { ready: true, at: now, completed: completed, all: all, done: done, total: total, areas: areas };
  return v2pProgressCache;
}
function v2pCompletedAreaList(progress) {
  var out = [];
  try {
    var ids = Object.keys(progress.completed || {});
    for (var i = 0; i < ids.length; i++) if (progress.completed[ids[i]]) out.push(ids[i]);
  } catch (e) {}
  return out;
}

/* -------------------------------------------------------------------------
   Culling del atrio (solo raíces decorativas de part5-assets)
   ------------------------------------------------------------------------- */
var V2P_TUNING = {
  bajo: { radius: 6.2, veg: 0.50, dust: 0.40, minionRadius: 4.8, minions: false },
  medio: { radius: 8.2, veg: 0.78, dust: 0.70, minionRadius: 6.4, minions: true },
  alto: { radius: 11.0, veg: 1.00, dust: 1.00, minionRadius: 9.2, minions: true }
};
var V2P_DONE = { radius: 0.80, veg: 0.58, dust: 0.55 };
var V2P_KINDS = [
  ['v2-hub-props-', 'props'],
  ['v2-hub-veg-', 'veg'],
  ['v2-minion-', 'minion'],
  ['v2-hub-dust', 'dust']
];
var v2pCull = {
  hooked: false,
  originalUpdate: null,
  settingsEvents: false,
  lastTick: 0,
  lastTime: -1,
  rootsRef: null,
  rootsLen: -1,
  firstRoot: null,
  targets: [],
  hubVisible: false,
  hero: null,
  radius: 0,
  quality: 'medio',
  allComplete: false,
  completed: {},
  hidden: 0,
  visible: 0,
  drawsTotal: 0,
  drawsVisible: 0,
  drawsSaved: 0,
  instancesTotal: 0,
  instancesDrawn: 0,
  dustTotal: 0,
  dustDrawn: 0,
  verticesTotal: 0,
  verticesDrawn: 0,
  restoredAt: 0
};
function v2pHubRoots() {
  try {
    if (typeof v2aHub !== 'undefined' && v2aHub && v2aHub.roots) return v2aHub.roots;
  } catch (e) {}
  return null;
}
function v2pClassify(root) {
  var name = (root && root.name) ? String(root.name) : '';
  for (var i = 0; i < V2P_KINDS.length; i++) {
    if (name.indexOf(V2P_KINDS[i][0]) === 0) {
      var kind = V2P_KINDS[i][1];
      var areaId = null;
      if (kind !== 'dust') areaId = name.slice(V2P_KINDS[i][0].length) || null;
      return { kind: kind, areaId: areaId };
    }
  }
  return null;
}
function v2pCountDrawables(root) {
  var n = 0;
  try {
    if (root && root.traverse) {
      root.traverse(function (node) {
        if (!node) return;
        if (node.isMesh || node.isInstancedMesh || node.isPoints || node.isSprite || node.isLine) n += 1;
      });
    }
  } catch (e) {}
  return n;
}
function v2pBaseCount(root) {
  try {
    if (root.isInstancedMesh) return Math.max(0, Math.floor(Number(root.count) || 0));
    if (root.isPoints && root.geometry && root.geometry.getAttribute) {
      var attr = root.geometry.getAttribute('position');
      if (attr && attr.count) return Math.max(0, Math.floor(Number(attr.count) || 0));
    }
  } catch (e) {}
  return 0;
}
function v2pVertexPerInstance(root) {
  try {
    if (root && root.geometry && root.geometry.getAttribute) {
      var attr = root.geometry.getAttribute('position');
      if (attr && attr.count) return Math.max(0, Math.floor(Number(attr.count) || 0));
    }
  } catch (e) {}
  return 0;
}
function v2pVertexCount(root) {
  var total = 0;
  try {
    if (root && root.isInstancedMesh) {
      return v2pVertexPerInstance(root) * Math.max(0, Math.floor(Number(root.count) || 0));
    }
    if (root && root.traverse) {
      root.traverse(function (node) {
        if (!node || !node.geometry || !node.geometry.getAttribute) return;
        var attr = node.geometry.getAttribute('position');
        if (attr && attr.count) total += Math.max(0, Math.floor(Number(attr.count) || 0));
      });
    }
  } catch (e) {}
  return total;
}
function v2pMatrixApply(elements, x, y, z, out) {
  if (!elements) return false;
  out.x = elements[0] * x + elements[4] * y + elements[8] * z + elements[12];
  out.y = elements[1] * x + elements[5] * y + elements[9] * z + elements[13];
  out.z = elements[2] * x + elements[6] * y + elements[10] * z + elements[14];
  return true;
}
function v2pCenter(root) {
  var sx = 0, sz = 0, n = 0;
  var out = { x: 0, y: 0, z: 0 };
  try {
    if (root && root.updateMatrixWorld) root.updateMatrixWorld(true);
  } catch (e0) {}
  try {
    if (root && root.isInstancedMesh) {
      var arr = root.instanceMatrix && root.instanceMatrix.array ? root.instanceMatrix.array : null;
      var count = Math.max(0, Math.floor(Number(root.count) || 0));
      if (arr) {
        for (var i = 0; i < count; i++) {
          var o = i * 16;
          sx += Number(arr[o + 12]) || 0;
          sz += Number(arr[o + 14]) || 0;
          n += 1;
        }
      }
    } else if (root && root.traverse) {
      root.traverse(function (node) {
        if (!node || !node.geometry) return;
        var geo = node.geometry;
        if (!geo.boundingSphere && geo.computeBoundingSphere) {
          try { geo.computeBoundingSphere(); } catch (e1) {}
        }
        var bs = geo.boundingSphere;
        if (!bs || !bs.center) return;
        var world = node.matrixWorld;
        if (!v2pMatrixApply(world && world.elements, bs.center.x, bs.center.y, bs.center.z, out)) return;
        sx += out.x;
        sz += out.z;
        n += 1;
      });
    }
  } catch (e2) {}
  if (!n) {
    try {
      if (root && root.position) return { x: Number(root.position.x) || 0, z: Number(root.position.z) || 0 };
    } catch (e3) {}
    return { x: 0, z: 0 };
  }
  return { x: sx / n, z: sz / n };
}
function v2pRefreshTargets(roots) {
  var list = [];
  var drawsTotal = 0;
  var instTotal = 0;
  var dustTotal = 0;
  var vertsTotal = 0;
  var length = roots ? roots.length : 0;
  for (var i = 0; i < length; i++) {
    var root = roots[i];
    if (!root) continue;
    var meta = v2pClassify(root);
    if (!meta) continue;
    /* Blindaje: solo decoración marcada por part5-assets. */
    if (root.userData && root.userData.v2aDecorative === false) continue;
    var center = v2pCenter(root);
    /* La cuenta original se guarda en la raíz: un refresco posterior no debe
       confundir el recorte ya aplicado con la densidad de part5-assets. */
    var base = 0;
    if (root.userData && root.userData.v2pBaseCount != null) {
      base = Math.max(0, Math.floor(Number(root.userData.v2pBaseCount) || 0));
    } else {
      base = v2pBaseCount(root);
      if (root.userData && (root.isInstancedMesh || root.isPoints)) root.userData.v2pBaseCount = base;
    }
    var target = {
      root: root,
      kind: meta.kind,
      areaId: meta.areaId,
      cx: center.x,
      cz: center.z,
      baseCount: base,
      drawn: 0,
      drawCount: v2pCountDrawables(root),
      vertexCount: v2pVertexCount(root),
      instanceVerts: (meta.kind === 'veg' || meta.kind === 'dust') ? v2pVertexPerInstance(root) : 0,
      shown: false
    };
    if (target.kind === 'veg' || target.kind === 'dust') target.drawn = target.baseCount;
    if (target.kind === 'veg') instTotal += target.baseCount;
    if (target.kind === 'dust') dustTotal += target.baseCount;
    drawsTotal += target.drawCount;
    vertsTotal += target.vertexCount;
    list.push(target);
  }
  v2pCull.targets = list;
  v2pCull.rootsRef = roots;
  v2pCull.rootsLen = length;
  v2pCull.firstRoot = length ? roots[0] : null;
  v2pCull.drawsTotal = drawsTotal;
  v2pCull.instancesTotal = instTotal;
  v2pCull.dustTotal = dustTotal;
  v2pCull.verticesTotal = vertsTotal;
  return list.length;
}
function v2pHubVisible() {
  try {
    if (typeof hubGroup !== 'undefined' && hubGroup && hubGroup.visible === false) return false;
  } catch (e) {}
  try {
    if (typeof screen !== 'undefined' && screen && screen !== 'hub') return false;
  } catch (e2) {}
  return true;
}
function v2pHeroPosition() {
  try {
    if (typeof hubHero !== 'undefined' && hubHero) {
      var x = Number(hubHero.x);
      var z = Number(hubHero.z);
      if (isFinite(x) && isFinite(z)) return { x: x, z: z };
    }
  } catch (e) {}
  return null;
}
function v2pHysteresis(target, distanceSq, radius) {
  if (!(radius > 0)) return false;
  var exit = radius * 1.16;
  if (target.shown) {
    if (distanceSq > exit * exit) target.shown = false;
  } else if (distanceSq < radius * radius) {
    target.shown = true;
  }
  return target.shown;
}
function v2pRestoreAll() {
  var targets = v2pCull.targets;
  for (var i = 0; i < targets.length; i++) {
    var t = targets[i];
    if (!t || !t.root) continue;
    if (t.root.visible !== true) t.root.visible = true;
    if (t.kind === 'veg' && t.baseCount > 0 && t.drawn !== t.baseCount) {
      try { t.root.count = t.baseCount; t.drawn = t.baseCount; } catch (e) {}
    } else if (t.kind === 'dust' && t.baseCount > 0 && t.drawn !== t.baseCount) {
      try {
        if (t.root.geometry && t.root.geometry.setDrawRange) t.root.geometry.setDrawRange(0, t.baseCount);
        t.drawn = t.baseCount;
      } catch (e2) {}
    }
    /* Al volver al atrio se reevalúa desde cero: lo lejano se oculta en el
       primer tick sin dejar un estado intermedio visible. */
    t.shown = false;
  }
  v2pCull.hidden = 0;
  v2pCull.visible = targets.length;
  v2pCull.drawsVisible = v2pCull.drawsTotal;
  v2pCull.drawsSaved = 0;
  v2pCull.instancesDrawn = v2pCull.instancesTotal;
  v2pCull.dustDrawn = v2pCull.dustTotal;
  v2pCull.verticesDrawn = v2pCull.verticesTotal;
  v2pCull.hero = null;
  v2pCull.hubVisible = false;
  v2pCull.completed = {};
  v2pCull.restoredAt = Date.now();
}
function v2pTick(now) {
  var roots = v2pHubRoots();
  if (!roots || !roots.length) {
    if (v2pCull.targets.length) {
      v2pCull.targets = [];
      v2pCull.drawsTotal = 0;
      v2pCull.drawsVisible = 0;
      v2pCull.drawsSaved = 0;
      v2pCull.instancesTotal = 0;
      v2pCull.dustTotal = 0;
      v2pCull.verticesTotal = 0;
      v2pCull.verticesDrawn = 0;
    }
    v2pCull.rootsRef = roots || null;
    v2pCull.rootsLen = roots ? roots.length : 0;
    v2pCull.firstRoot = null;
    return;
  }
  if (roots !== v2pCull.rootsRef || roots.length !== v2pCull.rootsLen || (roots[0] || null) !== v2pCull.firstRoot) {
    v2pRefreshTargets(roots);
  }
  var targets = v2pCull.targets;
  if (!targets.length) return;
  if (!v2pHubVisible()) { v2pRestoreAll(); return; }
  var hero = v2pHeroPosition();
  if (!hero) { v2pRestoreAll(); return; }
  var quality = v2pQuality();
  var cfg = V2P_TUNING[quality] || V2P_TUNING.medio;
  var progress = v2pProgress(false);
  var allDone = !!progress.all;
  var radius = cfg.radius * (allDone ? V2P_DONE.radius : 1) * (v2pReducedMotion() ? 1.12 : 1);
  var vegScale = cfg.veg * (allDone ? V2P_DONE.veg : 1);
  var dustScale = cfg.dust * (allDone ? V2P_DONE.dust : 1);
  var hidden = 0, visible = 0, drawsVisible = 0, instDrawn = 0, dustDrawn = 0, vertsDrawn = 0;
  for (var i = 0; i < targets.length; i++) {
    var t = targets[i];
    if (!t.root) continue;
    var areaDone = !!(t.areaId && progress.completed[t.areaId]);
    var dx = t.cx - hero.x;
    var dz = t.cz - hero.z;
    var distanceSq = dx * dx + dz * dz;
    var shown = true;
    if (t.kind === 'props') {
      shown = v2pHysteresis(t, distanceSq, radius * (areaDone ? 0.92 : 1));
    } else if (t.kind === 'veg') {
      shown = v2pHysteresis(t, distanceSq, radius + 1.4);
    } else if (t.kind === 'minion') {
      /* Los esbirros son decorativos: con el atrio restaurado (todas las
         misiones) se ocultan del todo; si no, solo cerca del héroe. */
      shown = !!cfg.minions && !allDone && !areaDone &&
        v2pHysteresis(t, distanceSq, cfg.minionRadius);
    } else if (t.kind === 'dust') {
      shown = dustScale > 0.02;
    }
    if (t.root.visible !== shown) t.root.visible = shown;
    if (shown) { visible += 1; drawsVisible += t.drawCount; } else { hidden += 1; }
    if (t.kind === 'veg' && t.baseCount > 0) {
      var factor = vegScale * (areaDone ? 0.7 : 1);
      var vegCount = Math.round(t.baseCount * factor);
      if (vegCount < 1) vegCount = 1;
      if (vegCount > t.baseCount) vegCount = t.baseCount;
      if (t.drawn !== vegCount) {
        try { t.root.count = vegCount; t.drawn = vegCount; } catch (e1) {}
      }
      if (shown) {
        instDrawn += vegCount;
        vertsDrawn += t.instanceVerts * vegCount;
      }
    } else if (t.kind === 'dust' && t.baseCount > 0) {
      var dustCount = Math.round(t.baseCount * dustScale);
      if (dustCount < 0) dustCount = 0;
      if (dustCount > t.baseCount) dustCount = t.baseCount;
      if (t.drawn !== dustCount) {
        t.drawn = dustCount;
        try {
          if (t.root.geometry && t.root.geometry.setDrawRange) t.root.geometry.setDrawRange(0, dustCount);
        } catch (e2) {}
      }
      dustDrawn += dustCount;
      if (shown) vertsDrawn += dustCount;
    } else if (shown) {
      vertsDrawn += t.vertexCount;
    }
  }
  v2pCull.hidden = hidden;
  v2pCull.visible = visible;
  v2pCull.drawsVisible = drawsVisible;
  v2pCull.drawsSaved = Math.max(0, v2pCull.drawsTotal - drawsVisible);
  v2pCull.instancesDrawn = instDrawn;
  v2pCull.dustDrawn = dustDrawn;
  v2pCull.verticesDrawn = vertsDrawn;
  v2pCull.radius = radius;
  v2pCull.quality = quality;
  v2pCull.allComplete = allDone;
  v2pCull.completed = progress.completed;
  v2pCull.hero = { x: hero.x, z: hero.z };
  v2pCull.hubVisible = true;
  v2pCull.lastTick = now;
}
function v2pUpdate(dt, time) {
  var t = Number(time);
  if (isFinite(t) && t > 0 && t === v2pCull.lastTime) return;
  if (isFinite(t) && t > 0) v2pCull.lastTime = t;
  v2pApplyShadow();
  var now = Date.now();
  if (now - v2pCull.lastTick < V2P_TICK_MS) return;
  try { v2pTick(now); } catch (e) { v2pSoft(e); }
}

/* -------------------------------------------------------------------------
   Enganche al bucle: V2.call('world','update') de part4-flow ya existe y
   corre antes de placeCamera/render. Se envuelve una sola vez; si el Agente 0
   añade V2.call('perf','update'), el sello de tiempo evita trabajo doble.
   ------------------------------------------------------------------------- */
function v2pInstallHooks() {
  if (v2pCull.hooked) return true;
  var world = null;
  try { if (typeof V2 !== 'undefined' && V2 && V2.world) world = V2.world; } catch (e) {}
  if (!world || !v2pIsFunction(world.update)) return false;
  var original = world.update;
  world.update = function (dt, time) {
    try { v2pUpdate(dt, time); } catch (e) { v2pSoft(e); }
    return original.apply(this, arguments);
  };
  v2pCull.originalUpdate = original;
  v2pCull.hooked = true;
  v2pEmit('perf:hooks', { world: true });
  return true;
}
function v2pScheduleHookRetries() {
  try {
    if (typeof window === 'undefined' || !window.setTimeout) return;
    window.setTimeout(function () { v2pInstallHooks(); }, 0);
    window.setTimeout(function () { v2pInstallHooks(); }, 700);
    window.setTimeout(function () { v2pInstallHooks(); }, 2600);
  } catch (e) {}
}
/* part4-flow llama a V2.call('perf','boot') después de V2.world.boot. */
function v2pBoot() {
  try {
    v2pApplyShadow();
    v2pInstallHooks();
    v2pInstallSettingsEvents();
    v2pSyncSettingsUI();
    return true;
  } catch (error) {
    v2pSoft(error);
    return false;
  }
}

/* -------------------------------------------------------------------------
   Banco original
   ------------------------------------------------------------------------- */
var V2P_BANK_CACHE = { at: 0, counts: null };
function v2pOnlyOriginal() {
  try {
    if (typeof state !== 'undefined' && state && state.settings) return !!state.settings.onlyOriginalBank;
  } catch (e) {}
  return false;
}
function v2pQuestionAllowed(question) {
  if (!question) return false;
  if (!v2pOnlyOriginal()) return true;
  return question.source === 'campaign';
}
function v2pFilterQuestions(list) {
  var out = [];
  if (!list || typeof list.length !== 'number') return out;
  for (var i = 0; i < list.length; i++) {
    if (v2pQuestionAllowed(list[i])) out.push(list[i]);
  }
  return out;
}
function v2pQuestionPool() {
  var src = null;
  try {
    if (typeof CAMP !== 'undefined' && CAMP && CAMP.questions) src = CAMP.questions;
  } catch (e) {}
  if (!src) {
    try { if (typeof QUESTION_BY_ID !== 'undefined' && QUESTION_BY_ID) src = QUESTION_BY_ID; } catch (e2) {}
  }
  return src;
}
function v2pCountQuestions(force) {
  var now = Date.now();
  if (!force && V2P_BANK_CACHE.counts && now - V2P_BANK_CACHE.at < 2500) return V2P_BANK_CACHE.counts;
  var counts = { total: 0, campaign: 0, dashboard: 0, flashcards: 0, other: 0, generated: 0 };
  var src = v2pQuestionPool();
  if (src) {
    var ids = Object.keys(src);
    for (var i = 0; i < ids.length; i++) {
      var q = src[ids[i]];
      if (!q) continue;
      counts.total += 1;
      var source = q.source ? String(q.source) : '';
      if (source === 'campaign') counts.campaign += 1;
      else if (source === 'dashboard') counts.dashboard += 1;
      else if (source === 'flashcards') counts.flashcards += 1;
      else counts.other += 1;
      if (q.generated) counts.generated += 1;
    }
  }
  v2pBankCountQuestionFinish(counts);
  V2P_BANK_CACHE = { at: now, counts: counts };
  return counts;
}
function v2pBankCountQuestionFinish(counts) {
  counts.allowed = v2pOnlyOriginal() ? counts.campaign : counts.total;
  counts.filtered = v2pOnlyOriginal() ? Math.max(0, counts.total - counts.campaign) : 0;
}
function v2pBankStats() {
  var counts = v2pCountQuestions(false);
  v2pBankCountQuestionFinish(counts);
  return {
    onlyOriginalBank: v2pOnlyOriginal(),
    rule: "source === 'campaign'",
    total: counts.total,
    campaign: counts.campaign,
    dashboard: counts.dashboard,
    flashcards: counts.flashcards,
    other: counts.other,
    generated: counts.generated,
    allowed: counts.allowed,
    filtered: counts.filtered
  };
}

/* -------------------------------------------------------------------------
   Ajustes: toggle «Usar solo preguntas del banco original»
   ------------------------------------------------------------------------- */
function v2pCullLabel() {
  var targets = v2pCull.targets;
  if (!targets.length) return 'sin datos';
  if (!v2pCull.hubVisible) return targets.length + ' props · en pausa';
  return v2pCull.visible + '/' + targets.length + ' props';
}
function v2pSettingsHTML() {
  try {
    var only = v2pOnlyOriginal();
    var bank = v2pCountQuestions(false);
    v2pBankCountQuestionFinish(bank);
    var shadow = v2pShadowStats();
    var cull = v2pCull;
    var chip = function (key, label, value, extra) {
      return '<span class="v2-perf-chip' + (extra || '') + '"><em>' + v2pEsc(label) + '</em><b data-v2-perf-count="' +
        v2pEsc(key) + '">' + v2pEsc(value) + '</b></span>';
    };
    var chips = chip('campaign', 'Campaña', bank.campaign) +
      chip('dashboard', 'Dashboard', bank.dashboard) +
      chip('flashcards', 'Flashcards', bank.flashcards) +
      (bank.other ? chip('other', 'Otras', bank.other) : '') +
      '<span class="v2-perf-chip v2-perf-chip--on"><em>Activas</em><b data-v2-perf-count="allowed">' + (only ? bank.campaign : bank.total) + '</b></span>';
    var drawSaved = cull.drawsSaved || 0;
    return '<section class="panel settingsPanel settingsPanel--wide v2-perf-settings" data-v2-perf-settings>' +
      '<span class="eyebrow noRule">Rendimiento y banco</span>' +
      '<h3>Atrio ligero, banco original</h3>' +
      '<p class="settingsHelp">La decoración del atrio se recorta por distancia y calidad; con todas las misiones completadas se vuelve más discreta. Cofres, guías, fragmentos, estaciones y sombras del error se conservan siempre.</p>' +
      '<div class="settingsRow v2-perf-toggleRow">' +
        '<div><b>Usar solo preguntas del banco original</b><small>Excluye las fichas de Study Dashboard y las tarjetas de Study Flashcards. Se aplica a la próxima sesión; una sesión en curso conserva sus preguntas.</small></div>' +
        '<button type="button" class="toggle ' + (only ? 'is-on' : '') + '" data-action="v2-perf-original-bank" aria-label="Alternar solo preguntas del banco original" aria-pressed="' + (only ? 'true' : 'false') + '"></button>' +
      '</div>' +
      '<div class="v2-perf-bankGrid" data-v2-perf-bank>' + chips + '</div>' +
      '<div class="v2-perf-grid">' +
        '<div><span>Preguntas activas</span><b data-v2-perf-active>' + (only ? bank.campaign : bank.total) + '</b></div>' +
        '<div><span>Sombras</span><b data-v2-perf-shadow>' + v2pEsc(shadow.name) + '</b></div>' +
        '<div><span>Atrio</span><b data-v2-perf-cull>' + v2pEsc(v2pCullLabel()) + '</b></div>' +
        '<div><span>Dibujos ahorrados</span><b data-v2-perf-draws>' + drawSaved + '</b></div>' +
      '</div>' +
      '<div class="settingsActions v2-perf-actions"><button type="button" class="btn btn--ghost btn--sm" data-action="v2-perf-bank-audit">Revisar banco</button></div>' +
      '<p class="settingsHelp v2-perf-note">El filtro y el recorte no alteran XP, monedas, recompensas ni el contenido de las preguntas.</p>' +
    '</section>';
  } catch (error) {
    v2pSoft(error);
    return '';
  }
}
function v2pSetOnlyOriginal(value) {
  var next = !!value;
  var changed = false;
  try {
    if (typeof state !== 'undefined' && state && state.settings) {
      changed = !!state.settings.onlyOriginalBank !== next;
      state.settings.onlyOriginalBank = next;
    }
  } catch (e) { v2pSoft(e); }
  try { if (v2pIsFunction(saveSettings)) saveSettings(); } catch (e2) {}
  try { if (v2pIsFunction(persist)) persist(); } catch (e3) {}
  V2P_BANK_CACHE.at = 0;
  v2pSyncSettingsUI();
  v2pEmit('perf:onlyOriginalBank', { enabled: next });
  if (changed) {
    v2pToast(next
      ? 'Solo banco original: campaña de Psicología.'
      : 'Banco completo: vuelven fichas y tarjetas.', 'success', 2600);
  }
  return next;
}
function v2pAuditBank() {
  var bank = v2pBankStats();
  var message = 'Banco: ' + bank.total + ' preguntas · campaña ' + bank.campaign +
    ' · dashboard ' + bank.dashboard + ' · flashcards ' + bank.flashcards +
    '. Activas ahora: ' + bank.allowed + '.';
  v2pToast(message, 'info', 4400);
  v2pEmit('perf:bankAudit', bank);
  return bank;
}
function v2pSyncSettingsUI() {
  if (typeof document === 'undefined' || !document.querySelector) return;
  var root = null;
  try { root = document.querySelector('[data-v2-perf-settings]'); } catch (e) {}
  if (!root) return;
  var only = v2pOnlyOriginal();
  var button = null;
  try { button = root.querySelector('[data-action="v2-perf-original-bank"]'); } catch (e2) {}
  if (button) {
    try {
      if (button.classList) button.classList.toggle('is-on', only);
      if (button.setAttribute) button.setAttribute('aria-pressed', only ? 'true' : 'false');
    } catch (e3) {}
  }
  var bank = v2pCountQuestions(false);
  v2pBankCountQuestionFinish(bank);
  var values = {
    campaign: bank.campaign,
    dashboard: bank.dashboard,
    flashcards: bank.flashcards,
    other: bank.other,
    allowed: only ? bank.campaign : bank.total
  };
  var keys = Object.keys(values);
  for (var i = 0; i < keys.length; i++) {
    var el = null;
    try { el = root.querySelector('[data-v2-perf-count="' + keys[i] + '"]'); } catch (e4) {}
    if (el) el.textContent = String(values[keys[i]]);
  }
  var activeEl = null;
  try { activeEl = root.querySelector('[data-v2-perf-active]'); } catch (e5) {}
  if (activeEl) activeEl.textContent = String(only ? bank.campaign : bank.total);
  var shadowEl = null;
  try { shadowEl = root.querySelector('[data-v2-perf-shadow]'); } catch (e6) {}
  if (shadowEl) shadowEl.textContent = v2pShadowStats().name;
  var cullEl = null;
  try { cullEl = root.querySelector('[data-v2-perf-cull]'); } catch (e7) {}
  if (cullEl) cullEl.textContent = v2pCullLabel();
  var drawsEl = null;
  try { drawsEl = root.querySelector('[data-v2-perf-draws]'); } catch (e8) {}
  if (drawsEl) drawsEl.textContent = String(v2pCull.drawsSaved || 0);
}
function v2pOnSettingsClick(event) {
  var el = event && event.target ? event.target : null;
  if (!el) return;
  var actionEl = null;
  try { actionEl = el.closest ? el.closest('[data-action]') : null; } catch (e) {}
  if (!actionEl) return;
  var action = actionEl.getAttribute ? actionEl.getAttribute('data-action') : '';
  if (action === 'v2-perf-original-bank') {
    try { event.preventDefault(); } catch (e2) {}
    try { event.stopPropagation(); } catch (e3) {}
    v2pSetOnlyOriginal(!v2pOnlyOriginal());
  } else if (action === 'v2-perf-bank-audit') {
    try { event.preventDefault(); } catch (e4) {}
    try { event.stopPropagation(); } catch (e5) {}
    v2pAuditBank();
  }
}
function v2pInstallSettingsEvents() {
  if (v2pCull.settingsEvents) return true;
  if (typeof document === 'undefined' || !document.addEventListener) return false;
  document.addEventListener('click', v2pOnSettingsClick, true);
  v2pCull.settingsEvents = true;
  return true;
}
function v2pMountSettings() {
  try {
    v2pInstallHooks();
    v2pInstallSettingsEvents();
    v2pSyncSettingsUI();
    return true;
  } catch (error) {
    v2pSoft(error);
    return false;
  }
}

/* -------------------------------------------------------------------------
   Estadísticas públicas (QA / Agente 0)
   ------------------------------------------------------------------------- */
function v2pStats() {
  var progress = v2pProgress(false);
  var shadow = v2pShadowStats();
  var bank = v2pBankStats();
  var targets = v2pCull.targets;
  var pct = v2pCull.drawsTotal > 0 ? Math.round((v2pCull.drawsSaved / v2pCull.drawsTotal) * 100) : 0;
  var vertexSaved = Math.max(0, v2pCull.verticesTotal - v2pCull.verticesDrawn);
  var vertexPct = v2pCull.verticesTotal > 0 ? Math.round((vertexSaved / v2pCull.verticesTotal) * 100) : 0;
  return {
    version: V2P_VERSION,
    quality: v2pQuality(),
    reducedMotion: v2pReducedMotion(),
    shadow: shadow,
    bank: bank,
    culling: {
      installed: true,
      hooks: !!v2pCull.hooked,
      quality: v2pCull.quality,
      hubVisible: !!v2pCull.hubVisible,
      allMissionsComplete: !!progress.all,
      missionTotals: { done: progress.done, total: progress.total, areas: progress.areas },
      completedAreas: v2pCompletedAreaList(progress),
      hero: v2pCull.hero,
      cullRadius: Math.round((v2pCull.radius || 0) * 100) / 100,
      targets: targets.length,
      visible: v2pCull.visible,
      hidden: v2pCull.hidden,
      drawCallsTotal: v2pCull.drawsTotal,
      drawCallsVisible: v2pCull.drawsVisible,
      drawCallsSaved: v2pCull.drawsSaved,
      savedPercent: pct,
      vegetation: { total: v2pCull.instancesTotal, drawn: v2pCull.instancesDrawn },
      dust: { total: v2pCull.dustTotal, drawn: v2pCull.dustDrawn },
      vertices: {
        total: v2pCull.verticesTotal,
        drawn: v2pCull.verticesDrawn,
        saved: vertexSaved,
        savedPercent: vertexPct
      },
      lastTick: v2pCull.lastTick
    },
    settings: {
      onlyOriginalBank: v2pOnlyOriginal(),
      effectsQuality: v2pQuality(),
      reducedMotion: v2pReducedMotion()
    },
    errors: (function () {
      try {
        var core = v2pCore();
        return core && core._errors ? core._errors.slice(-6) : [];
      } catch (e) { return []; }
    })()
  };
}

/* -------------------------------------------------------------------------
   API pública
   ------------------------------------------------------------------------- */
var v2pModule = {
  version: V2P_VERSION,
  boot: v2pBoot,
  settingsHTML: v2pSettingsHTML,
  mountSettings: v2pMountSettings,
  questionAllowed: v2pQuestionAllowed,
  filterQuestions: v2pFilterQuestions,
  update: v2pUpdate,
  stats: v2pStats,
  applyShadow: v2pApplyShadow,
  shadowStats: v2pShadowStats,
  onlyOriginalBank: v2pOnlyOriginal,
  setOnlyOriginalBank: v2pSetOnlyOriginal,
  bankStats: v2pBankStats,
  refresh: function () {
    var roots = v2pHubRoots();
    if (roots && roots.length) return v2pRefreshTargets(roots);
    v2pCull.targets = [];
    return 0;
  },
  restore: v2pRestoreAll,
  cullState: function () { return v2pCull; }
};
try {
  if (typeof V2 !== 'undefined' && V2) {
    if (typeof V2.register === 'function') V2.register('perf', v2pModule);
    else V2.perf = v2pModule;
  }
} catch (e) { v2pSoft(e); }

/* Al arrancar: tipo de sombra antes del primer render y enganche al bucle. */
try { v2pApplyShadow(); } catch (e0) {}
try { v2pInstallHooks(); } catch (e1) {}
v2pScheduleHookRetries();
try {
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('load', function () { try { v2pInstallHooks(); v2pApplyShadow(); } catch (e) {} });
  }
} catch (e2) {}
