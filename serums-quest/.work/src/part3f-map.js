/* =========================================================================
   FASE 4 — MAPA 3D DE AVANCE
   ========================================================================= */
var MAP_ISLANDS = [
  { id: 'area-psi-salud-publica', x: -5.4, z: 1.05, angle: -1.3, order: 1 },
  { id: 'area-psi-cuidado-integral', x: 0.0, z: -5.7, angle: 0, order: 2 },
  { id: 'area-psi-etica', x: 5.4, z: 1.05, angle: 1.3, order: 3 },
  { id: 'area-psi-investigacion', x: 3.35, z: 4.65, angle: 2.4, order: 4 },
  { id: 'area-psi-gestion', x: -3.35, z: 4.65, angle: -2.4, order: 5 }
];
var MAP_STATE_META = {
  locked: { label: 'Bloqueado', color: '#65708A', icon: 'lock' },
  available: { label: 'Disponible', color: '#7AA2FF', icon: 'play' },
  completed: { label: 'Completado', color: '#69D3C1', icon: 'check' },
  mastered: { label: 'Dominado', color: '#E4C07A', icon: 'award' }
};
var mapState = {
  active: false, prepared: false, renderer: null, canvas: null, scene: null, camera: null,
  root: null, nodes: {}, gates: {}, paths: [], nodeMeshes: [],
  selectedId: null, selectedAreaId: null,
  yaw: -0.1, pitch: 0.6, dist: 34, target: new THREE.Vector3(0, 0.2, 0),
  goalYaw: -0.1, goalPitch: 0.6, goalDist: 34, goalTarget: new THREE.Vector3(0, 0.2, 0),
  dragging: false, moved: 0, lastX: 0, lastY: 0, pointers: {}, pinch: 0,
  lastStates: {}, lastGateOpen: {}, builtAt: 0, animationStart: 0, animFreeze: null,
  hoverId: null
};
function mapMissionState(m) {
  var rec = state.missions[m.id];
  if (rec && rec.completedAt) return Number(rec.bestAccuracy) >= 0.8 ? 'mastered' : 'completed';
  return missionUnlockInfo(m).unlocked ? 'available' : 'locked';
}
function mapStateLabel(s) { return (MAP_STATE_META[s] || MAP_STATE_META.locked).label; }
function mapStateColor(s) { return (MAP_STATE_META[s] || MAP_STATE_META.locked).color; }
function mapReviewInfo(m) {
  var due = 0, later = 0;
  var qids = m.questionIds || [];
  Object.keys(state.errors).forEach(function (id) {
    var e = state.errors[id];
    if (!e || !QUESTION_BY_ID[e.questionId] || qids.indexOf(e.questionId) === -1) return;
    var at = parseDate(e.nextReviewAt);
    if (!at || at.getTime() <= Date.now()) due += 1; else later += 1;
  });
  return { due: due, later: later, total: due + later };
}
function mapAreaStats(areaId) {
  var list = areaMissions(areaId);
  var missions = list.filter(function (m) { return m.kind === 'mission'; });
  var bosses = list.filter(function (m) { return m.kind === 'boss'; });
  var completed = list.filter(function (m) { return missionCompleted(m.id); }).length;
  var mastered = list.filter(function (m) { return mapMissionState(m) === 'mastered'; }).length;
  var bossesDone = bosses.filter(function (m) { return missionCompleted(m.id); }).length;
  var masterCount = missions.filter(function (m) { return mapMissionState(m) === 'mastered'; }).length;
  return {
    completed: completed, mastered: mastered, total: list.length,
    missionsDone: missions.filter(function (m) { return missionCompleted(m.id); }).length,
    missionsMastered: masterCount, missionsTotal: missions.length,
    bossesDone: bossesDone, bossesTotal: bosses.length
  };
}
function mapGlobalStats() {
  var missions = CAMP.missions.filter(function (m) { return m.kind === 'mission'; });
  var bosses = CAMP.missions.filter(function (m) { return m.kind === 'boss'; });
  return {
    missionsDone: missions.filter(function (m) { return missionCompleted(m.id); }).length,
    missionsMastered: missions.filter(function (m) { return mapMissionState(m) === 'mastered'; }).length,
    missionsTotal: missions.length,
    bossesDone: bosses.filter(function (m) { return missionCompleted(m.id); }).length,
    bossesTotal: bosses.length
  };
}
function mapDueNodeForArea(areaId) {
  var best = null;
  areaMissions(areaId).forEach(function (m) {
    var r = mapReviewInfo(m);
    if (r.due && (!best || r.due > best.due)) best = { mission: m, due: r.due };
  });
  return best;
}
function mapRecommended() {
  var due = dueErrors().length;
  if (due) {
    var best = null;
    CAMP.areas.forEach(function (area) {
      var found = mapDueNodeForArea(area.id);
      if (found && (!best || found.due > best.due)) best = found;
    });
    return { kind: 'review', count: due, mission: best ? best.mission : null, areaId: best ? best.mission.areaId : null };
  }
  var avail = availableMissions();
  var mission = avail[0] || null;
  if (!mission) {
    var all = CAMP.missions.filter(function (m) { return missionUnlockInfo(m).unlocked && !missionCompleted(m.id); });
    mission = all[0] || null;
  }
  return mission ? { kind: 'mission', mission: mission } : { kind: 'done' };
}
function mapNodePrimaryNodeForArea(areaId) {
  var rec = mapRecommended();
  if (rec.mission && rec.mission.areaId === areaId) return rec.mission.id;
  var list = areaMissions(areaId);
  var first = list.filter(function (m) { return mapMissionState(m) === 'available'; })[0] || list[0];
  return first ? first.id : null;
}
function mapPossibleCosmetics(m) {
  var out = [];
  function add(id) { var c = COSMETIC_BY_ID[id]; if (c && !cosmeticOwned(id)) out.push(c); }
  var areaId = m.areaId;
  if (m.kind === 'boss') {
    var bossMap = { 'boss-sp': ['x-trofeo-salud', 'x-arma-destello', 'x-dominio-salud-oro'], 'boss-ci': ['x-trofeo-cuidado', 'x-arma-marea', 'x-dominio-cuidado-oro'], 'boss-et': ['x-trofeo-etica', 'x-arma-sello', 'x-dominio-etica-oro'], 'boss-in': ['x-trofeo-investigacion', 'x-arma-prisma', 'x-dominio-investigacion-oro'], 'boss-ge': ['x-trofeo-gestion', 'x-arma-orbita', 'x-dominio-gestion-oro'] };
    (bossMap[m.id] || []).forEach(add);
  } else {
    var areaHats = { 'area-psi-salud-publica': 'x-dominio-salud', 'area-psi-cuidado-integral': 'x-dominio-cuidado', 'area-psi-etica': 'x-dominio-etica', 'area-psi-investigacion': 'x-dominio-investigacion', 'area-psi-gestion': 'x-dominio-gestion' };
    if (areaHats[areaId]) add(areaHats[areaId]);
  }
  return out.slice(0, 3);
}
function mapNodeDetailHTML(node) {
  if (!node) return '<div class="mapEmpty"><span class="iconWrap">' + icon('map', 22) + '</span><h3>Elige un nodo del mapa</h3><p>Cada faro es una parada de la ruta. Toca un nodo para ver su estado, tu mejor marca y qué recompensa espera.</p></div>';
  var m = node.mission;
  var st = mapMissionState(m);
  var meta = MAP_STATE_META[st];
  var rec = state.missions[m.id] || {};
  var req = missionUnlockInfo(m);
  var review = mapReviewInfo(m);
  var area = AREA_BY_ID[m.areaId];
  var rewards = m.rewards || {};
  var cosmetics = mapPossibleCosmetics(m);
  var reqHtml = '';
  if (req.requirements && req.requirements.length) {
    reqHtml = '<div class="mapReqBlock"><span class="eyebrow noRule">' + (st === 'locked' ? 'Para abrir este nodo' : 'Requisitos') + '</span>' +
      req.requirements.map(function (r) { return '<div class="mapReq ' + (r.met ? 'is-met' : '') + '">' + icon(r.met ? 'check' : 'lock', 11) + '<span>' + esc(r.label) + (r.need > 1 ? ' · ' + r.have + '/' + r.need : '') + '</span></div>'; }).join('') + '</div>';
  }
  var reviewHtml = review.total ? '<div class="mapReviewNotice">' + icon('rotate', 12) + '<span>' + review.due + ' repaso' + (review.due === 1 ? '' : 's') + ' vencido' + (review.due === 1 ? '' : 's') + ' · ' + review.later + ' programado' + (review.later === 1 ? '' : 's') + '</span></div>' : '';
  var action = '';
  if (st === 'locked') {
    action = '<button type="button" class="btn btn--block" disabled>' + icon('lock', 14) + ' Aún no disponible</button><p class="tiny dim" style="margin-top:6px">Abre los requisitos de arriba para saber qué falta. Sin prisa: puedes volver cuando quieras.</p>';
  } else {
    action = '<button type="button" class="btn ' + (st === 'available' ? 'btn--primary' : 'btn--ghost') + ' btn--block" data-action="map-start" data-mission="' + esc(m.id) + '">' + icon(st === 'completed' || st === 'mastered' ? 'rotate' : 'play', 14) + ' ' + (st === 'completed' || st === 'mastered' ? 'Volver a esta ruta' : (m.kind === 'boss' ? 'Abrir la puerta del jefe' : 'Entrar al duelo')) + '</button>' +
      (review.due ? '<button type="button" class="btn btn--gold btn--block" data-action="open-review">' + icon('rotate', 13) + ' Repasar lo pendiente</button>' : '');
  }
  var cosmeticsLine = cosmetics.length ? cosmetics.map(function (c) { return esc(c.name); }).join(' · ') : 'Sin cosméticos pendientes en este hito';
  return '<div class="mapDetailTop"><span class="mapStateChip" style="--state-color:' + meta.color + '">' + icon(meta.icon, 11) + ' ' + meta.label + '</span><span class="chip">' + esc(area.short) + '</span><span class="chip">' + (m.kind === 'boss' ? 'Puerta de jefe' : 'Misión') + '</span></div>' +
    '<h2>' + esc(m.title) + '</h2><p class="mapDetailSub">' + esc(m.subtitle || '') + '</p>' +
    '<div class="mapMetrics"><div><b>' + (rec.completedAt ? formatPct(Number(rec.bestAccuracy) || 0) : '—') + '</b><span>mejor precisión</span></div><div><b>' + (Number(rec.attempts) || 0) + '</b><span>intentos</span></div><div><b>' + esc(m.tierLabel || '—') + '</b><span>tramo</span></div></div>' +
    '<div class="mapRewardLine"><span>' + icon('spark', 12) + ' Recompensa de cierre</span><b>+' + formatNumber(rewards.xp || 0) + ' XP · +' + formatNumber(rewards.coins || 0) + ' ◇</b></div>' +
    '<div class="mapCosmeticLine"><span>' + icon('award', 12) + ' Cosmético posible</span><b>' + esc(cosmeticsLine) + '</b></div>' +
    (m.kind === 'boss' ? '<div class="mapBossLine"><span class="bossGlyph">' + (AREA_GLYPHS[m.areaId] || '✦') + '</span><span>' + (st === 'locked' ? 'La puerta está sellada. Se abre al cumplir los requisitos.' : st === 'completed' || st === 'mastered' ? 'La puerta ya está abierta. El guardián recuerda tu paso.' : 'La puerta está abierta. El guardián espera.') + '</span></div>' : '') +
    reqHtml + reviewHtml +
    '<div class="mapDetailActions">' + action + '</div>';
}

/* -------------------------------------------------------------------------
   Escena 3D
   ------------------------------------------------------------------------- */
function mapAreaColor(areaId) { return (AREA_BY_ID[areaId] || {}).accent || '#7aa2ff'; }
function mapLabelSprite(text, colorHex, scale, width) {
  var c = document.createElement('canvas'); c.width = width || 512; c.height = 128;
  var ctx = c.getContext('2d');
  ctx.font = '700 38px "Bahnschrift", "Segoe UI", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = colorHex || '#f2f0ea';
  ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 14;
  ctx.fillText(String(text).slice(0, 26), c.width / 2, c.height / 2);
  var tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
  sp.scale.set(scale * 3.6, scale, 1);
  return sp;
}
function ensureMapRenderer() {
  if (mapState.renderer) return;
  var canvas = document.createElement('canvas');
  canvas.className = 'mapCanvas';
  canvas.setAttribute('aria-label', 'Mapa 3D de las cinco rutas');
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#05070d', 0.015);
  var camera = new THREE.PerspectiveCamera(34, window.innerWidth / Math.max(1, window.innerHeight), 0.1, 120);
  scene.add(new THREE.HemisphereLight('#d5e0ff', '#2e263a', 2.7));
  var key = new THREE.DirectionalLight('#ffe2c4', 2.2); key.position.set(-8, 14, 8); scene.add(key);
  var rim = new THREE.DirectionalLight('#7aa2ff', 1.25); rim.position.set(9, 6, -8); scene.add(rim);
  var root = new THREE.Group(); scene.add(root);
  mapState.renderer = renderer; mapState.canvas = canvas; mapState.scene = scene; mapState.camera = camera; mapState.root = root;
  canvas.addEventListener('pointerdown', mapPointerDown);
  canvas.addEventListener('pointermove', mapPointerMove);
  canvas.addEventListener('pointerup', mapPointerUp);
  canvas.addEventListener('pointercancel', mapPointerUp);
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    mapState.goalDist = clamp(mapState.goalDist + e.deltaY * 0.018, 7.5, 29);
  }, { passive: false });
}
function mapClearRoot() {
  if (!mapState.root) return;
  while (mapState.root.children.length) {
    var child = mapState.root.children[0];
    mapState.root.remove(child);
    disposeObject(child);
  }
  mapState.nodes = {}; mapState.gates = {}; mapState.paths = []; mapState.nodeMeshes = [];
}
function mapBuildStars() {
  var geom = new THREE.BufferGeometry();
  var pts = [];
  for (var i = 0; i < qCount(180); i++) pts.push((Math.random() - .5) * 60, 2 + Math.random() * 28, (Math.random() - .5) * 60);
  geom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  var stars = new THREE.Points(geom, new THREE.PointsMaterial({ color: '#b7c6e6', size: 0.045, transparent: true, opacity: 0.6, depthWrite: false }));
  mapState.root.add(stars);
}
function mapBuildHub() {
  var g = new THREE.Group();
  var base = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.55, .3, 8), new THREE.MeshStandardMaterial({ color: '#1b2434', roughness: .75 }));
  base.position.y = -.05; g.add(base);
  var ring = new THREE.Mesh(new THREE.TorusGeometry(1.55, .045, 6, 44), new THREE.MeshBasicMaterial({ color: color('#e4c07a'), transparent: true, opacity: .65 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = .15; g.add(ring);
  var core = new THREE.Mesh(new THREE.OctahedronGeometry(.3, 0), new THREE.MeshStandardMaterial({ color: '#e4c07a', emissive: '#6e4a16', emissiveIntensity: .8, roughness: .3 }));
  core.position.y = .72; g.add(core);
  var glow = makeGlowSprite('#e4c07a', 1.8, .22); glow.position.y = .72; g.add(glow);
  var label = mapLabelSprite('OBSERVATORIO', '#e4c07a', .3, 512);
  label.position.set(0, 1.9, 0); g.add(label);
  mapState.root.add(g);
}
function mapBuildBridge(area, landing) {
  var colorHex = mapAreaColor(area.id);
  var start = new THREE.Vector3(0, .05, 0);
  var end = landing.clone();
  var mid = start.clone().add(end).multiplyScalar(.5);
  var len = start.distanceTo(end);
  var yaw = Math.atan2(end.x - start.x, end.z - start.z);
  var deck = new THREE.Mesh(new THREE.BoxGeometry(.6, .08, len), new THREE.MeshStandardMaterial({ color: '#1a2638', roughness: .8, transparent: true, opacity: .8 }));
  deck.position.copy(mid); deck.rotation.y = yaw; mapState.root.add(deck);
  var strip = new THREE.Mesh(new THREE.BoxGeometry(.12, .025, len), new THREE.MeshBasicMaterial({ color: color(colorHex), transparent: true, opacity: .5, depthWrite: false }));
  strip.position.copy(mid).add(new THREE.Vector3(0, .06, 0)); strip.rotation.y = yaw; mapState.root.add(strip);
}
function mapBuildIsland(area, islandCfg) {
  var group = new THREE.Group();
  group.position.set(islandCfg.x, 0, islandCfg.z);
  var accent = area.accent;
  var top = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.5, .35, 7), new THREE.MeshStandardMaterial({ color: '#202a3a', roughness: .72, metalness: .1 }));
  top.position.y = -.05; group.add(top);
  var rock = new THREE.Mesh(new THREE.CylinderGeometry(2.3, .55, 2.7, 7), new THREE.MeshStandardMaterial({ color: '#111825', roughness: 1 }));
  rock.position.y = -1.4; group.add(rock);
  var topGlow = new THREE.Mesh(new THREE.CylinderGeometry(2.58, 2.58, .02, 7), new THREE.MeshBasicMaterial({ color: color(accent), transparent: true, opacity: .09, depthWrite: false }));
  topGlow.position.y = .14; group.add(topGlow);
  var rim = new THREE.Mesh(new THREE.TorusGeometry(2.52, .045, 6, 48), new THREE.MeshBasicMaterial({ color: color(accent), transparent: true, opacity: .75 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = .17; group.add(rim);
  var stats = mapAreaStats(area.id);
  var pct = stats.total ? stats.mastered / stats.total : 0;
  var dimArc = new THREE.Mesh(new THREE.RingGeometry(2.25, 2.35, 54, 1), new THREE.MeshBasicMaterial({ color: color(accent), transparent: true, opacity: .12, side: THREE.DoubleSide, depthWrite: false }));
  dimArc.rotation.x = -Math.PI / 2; dimArc.position.y = .22; group.add(dimArc);
  if (pct > 0.001) {
    var arc = new THREE.Mesh(new THREE.RingGeometry(2.25, 2.35, 64, 1, Math.PI / 2, Math.PI * 2 * pct), new THREE.MeshBasicMaterial({ color: color(accent), transparent: true, opacity: .88, side: THREE.DoubleSide, depthWrite: false }));
    arc.rotation.x = -Math.PI / 2; arc.position.y = .225; group.add(arc);
  }
  var name = mapLabelSprite(area.short.toUpperCase(), accent, .35, 512);
  name.position.set(0, 1.28, -2.45); group.add(name);
  var order = mapLabelSprite('RUTA ' + (['I', 'II', 'III', 'IV', 'V'][islandCfg.order - 1]), 'rgba(220,230,248,.7)', .18, 512);
  order.position.set(0, .72, -2.43); group.add(order);
  // Nodos
  var list = areaMissions(area.id);
  var missions = list.filter(function (m) { return m.kind === 'mission'; });
  var boss = list.filter(function (m) { return m.kind === 'boss'; })[0];
  var n = missions.length;
  var points = [];
  var landingLocal = new THREE.Vector3(0, .18, -2.2);
  points.push(landingLocal);
  missions.forEach(function (m, i) {
    var z = n <= 2 ? -1.25 + i * 1.15 : -1.42 + i * (2.55 / Math.max(1, n - 1));
    var x = Math.sin(i * 1.75 + islandCfg.order) * .55;
    points.push(new THREE.Vector3(x, .3, z));
  });
  var bossPoint = new THREE.Vector3(0, .3, 1.55);
  points.push(bossPoint);
  var globalLanding = group.position.clone().add(landingLocal);
  mapBuildBridge(area, globalLanding);
  var previous = points[0];
  var missionIndex = 0;
  missions.forEach(function (m, i) {
    var p = points[i + 1];
    var st = mapMissionState(m);
    var node = mapCreateNode(group, p, m, st, accent);
    node.areaId = area.id;
    mapState.nodes[m.id] = node;
    mapCreatePath(previous, p, area.id, st !== 'locked', m.id);
    previous = p;
  });
  if (boss) {
    var gate = mapCreateBossGate(group, new THREE.Vector3(0, .22, 2.08), boss, area);
    mapState.gates[area.id] = gate;
    var bossNode = mapCreateNode(group, bossPoint, boss, mapMissionState(boss), accent, true);
    bossNode.areaId = area.id;
    mapState.nodes[boss.id] = bossNode;
    mapCreatePath(previous, bossPoint, area.id, mapMissionState(boss) !== 'locked', boss.id);
  }
  mapState.root.add(group);
  V2.call('assets', 'decorateMapIsland', area, group, islandCfg);
}
function mapCreateNode(parent, localPos, mission, stateKey, accent, boss) {
  var g = new THREE.Group(); g.position.copy(localPos);
  var meta = MAP_STATE_META[stateKey];
  var base = new THREE.Mesh(new THREE.CylinderGeometry(boss ? .38 : .27, boss ? .44 : .32, .08, 16), new THREE.MeshStandardMaterial({ color: stateKey === 'locked' ? '#273041' : '#2c3a52', roughness: .65 }));
  g.add(base);
  var ring = new THREE.Mesh(new THREE.TorusGeometry(boss ? .43 : .31, .022, 6, 32), new THREE.MeshBasicMaterial({ color: color(meta.color), transparent: true, opacity: stateKey === 'locked' ? .25 : .9 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = .06; g.add(ring);
  var glyph = null;
  if (stateKey === 'locked') {
    glyph = new THREE.Mesh(new THREE.BoxGeometry(.12, .16, .12), new THREE.MeshStandardMaterial({ color: '#54607a', roughness: .8 }));
    glyph.position.y = .18;
  } else if (stateKey === 'available') {
    glyph = new THREE.Mesh(new THREE.OctahedronGeometry(.15, 0), new THREE.MeshStandardMaterial({ color: color(accent), emissive: color(accent), emissiveIntensity: .8, roughness: .25 }));
    glyph.position.y = .34;
    var glow = makeGlowSprite(accent, .8, .34); glow.position.y = .34; g.add(glow);
  } else if (stateKey === 'mastered') {
    glyph = new THREE.Mesh(new THREE.OctahedronGeometry(.16, 0), new THREE.MeshStandardMaterial({ color: '#f4d795', emissive: '#8d5b1b', emissiveIntensity: .8, roughness: .2 }));
    glyph.position.y = .4;
    var crown = new THREE.Mesh(new THREE.TorusGeometry(.22, .025, 4, 20), new THREE.MeshBasicMaterial({ color: color('#e4c07a'), transparent: true, opacity: .8 }));
    crown.rotation.x = Math.PI / 2; crown.position.y = .58; g.add(crown);
    addCosmeticGlow(g, '#e4c07a', 1.05, 0, .38, 0, .2);
  } else {
    glyph = new THREE.Mesh(new THREE.BoxGeometry(.16, .2, .16), new THREE.MeshStandardMaterial({ color: '#b9d9d1', emissive: '#264e47', emissiveIntensity: .4 }));
    glyph.position.y = .3;
    glyph.rotation.y = Math.PI / 4;
  }
  if (glyph) { glyph.castShadow = true; g.add(glyph); }
  var label = mapLabelSprite((boss ? 'JEFE ' : '') + (mission.index || ''), stateKey === 'locked' ? 'rgba(170,181,204,.55)' : meta.color, boss ? .22 : .17, 256);
  label.position.set(0, boss ? .95 : .7, 0); g.add(label);
  var hit = new THREE.Mesh(new THREE.SphereGeometry(boss ? .5 : .4, 8, 6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  hit.position.y = .25; hit.userData.mapNodeId = mission.id; g.add(hit);
  var review = mapReviewInfo(mission);
  var marker = null;
  if (review.total) {
    marker = makeGlowSprite(review.due ? '#f3b562' : '#7aa2ff', .48, .72);
    marker.position.set(.24, .28, .1);
    g.add(marker);
  }
  var selectRing = new THREE.Mesh(new THREE.TorusGeometry(boss ? .62 : .48, .022, 5, 32), new THREE.MeshBasicMaterial({ color: color('#f2f0ea'), transparent: true, opacity: .7, depthWrite: false }));
  selectRing.rotation.x = Math.PI / 2; selectRing.position.y = .08; selectRing.visible = false; g.add(selectRing);
  var recommendRing = new THREE.Mesh(new THREE.TorusGeometry(boss ? .7 : .55, .018, 5, 36), new THREE.MeshBasicMaterial({ color: color('#e4c07a'), transparent: true, opacity: .7, depthWrite: false }));
  recommendRing.rotation.x = Math.PI / 2; recommendRing.position.y = .09; recommendRing.visible = false; g.add(recommendRing);
  parent.add(g);
  var node = { id: mission.id, mission: mission, group: g, hit: hit, base: base, ring: ring, glyph: glyph, state: stateKey, review: review, marker: marker, selectRing: selectRing, recommendRing: recommendRing, phase: Math.random() * 6 };
  mapState.nodeMeshes.push(hit);
  return node;
}
function mapCreatePath(from, to, areaId, lit, targetId) {
  var colorHex = mapAreaColor(areaId);
  var dx = to.x - from.x, dz = to.z - from.z;
  var len = Math.sqrt(dx * dx + dz * dz);
  var count = Math.max(2, Math.ceil(len / .28));
  var g = new THREE.Group();
  var mats = [];
  for (var i = 0; i <= count; i++) {
    var t = i / count;
    var mat = new THREE.MeshBasicMaterial({ color: color(colorHex), transparent: true, opacity: lit ? .55 : .07, depthWrite: false, blending: THREE.AdditiveBlending });
    var bead = new THREE.Mesh(new THREE.SphereGeometry(lit ? .032 : .022, 5, 4), mat);
    bead.position.set(from.x + dx * t, .23 + Math.sin(t * Math.PI) * .06, from.z + dz * t);
    g.add(bead); mats.push(mat);
  }
  mapState.root.add(g);
  var path = { group: g, mats: mats, lit: lit, targetId: targetId, areaId: areaId, phase: Math.random() * 6, animStart: performance.now() };
  mapState.paths.push(path);
  return path;
}
function mapCreateBossGate(parent, pos, boss, area) {
  var g = new THREE.Group(); g.position.copy(pos);
  var accent = area.accent;
  var pillarMat = new THREE.MeshStandardMaterial({ color: '#283345', roughness: .7 });
  [-.62, .62].forEach(function (x) {
    var p = new THREE.Mesh(new THREE.BoxGeometry(.22, 1.35, .22), pillarMat);
    p.position.set(x, .67, 0); g.add(p);
    var cap = new THREE.Mesh(new THREE.BoxGeometry(.3, .12, .3), new THREE.MeshStandardMaterial({ color: '#3c4d61' }));
    cap.position.set(x, 1.38, 0); g.add(cap);
  });
  var arch = new THREE.Mesh(new THREE.BoxGeometry(1.5, .18, .23), new THREE.MeshStandardMaterial({ color: '#3d4d61' }));
  arch.position.y = 1.47; g.add(arch);
  var doorMat = new THREE.MeshStandardMaterial({ color: '#151d2a', emissive: color(accent), emissiveIntensity: .08, roughness: .8 });
  var leftDoor = new THREE.Mesh(new THREE.BoxGeometry(.58, 1.2, .08), doorMat); leftDoor.position.set(-.3, .68, .02);
  var rightDoor = new THREE.Mesh(new THREE.BoxGeometry(.58, 1.2, .08), doorMat); rightDoor.position.set(.3, .68, .02);
  g.add(leftDoor, rightDoor);
  var seal = new THREE.Mesh(new THREE.OctahedronGeometry(.13, 0), new THREE.MeshBasicMaterial({ color: color(accent), transparent: true, opacity: .8 }));
  seal.position.y = 1.16; seal.position.z = .12; g.add(seal);
  var label = mapLabelSprite('PUERTA DEL JEFE', accent, .16, 512); label.position.set(0, 1.9, 0); g.add(label);
  var state = mapMissionState(boss);
  var open = state !== 'locked';
  var previously = mapState.lastGateOpen[area.id];
  var startOpen = previously == null ? (open ? 1 : 0) : (previously ? 1 : 0);
  var gate = { group: g, mission: boss, areaId: area.id, target: open ? 1 : 0, current: startOpen, leftDoor: leftDoor, rightDoor: rightDoor, seal: seal, accent: accent, animated: false };
  mapState.lastGateOpen[area.id] = open;
  if (open && previously === false) gate.animated = true;
  parent.add(g);
  return gate;
}
function mapBuildScene() {
  ensureMapRenderer();
  mapClearRoot();
  mapState.prepared = true;
  mapBuildStars();
  mapBuildHub();
  mapState.lastGateOpen = mapState.lastGateOpen || {};
  MAP_ISLANDS.forEach(function (cfg) {
    var area = AREA_BY_ID[cfg.id];
    if (area) mapBuildIsland(area, cfg);
  });
  mapState.animationStart = performance.now();
  applyMapSelectionVisuals();
  mapUpdateCameraInstant();
}
function mapUpdateCameraInstant() {
  var p = mapState;
  p.camera.position.set(p.target.x + Math.sin(p.goalYaw) * Math.cos(p.goalPitch) * p.goalDist, p.target.y + Math.sin(p.goalPitch) * p.goalDist, p.target.z + Math.cos(p.goalYaw) * Math.cos(p.goalPitch) * p.goalDist);
  p.camera.lookAt(p.target);
}
function mapJumpToArea(areaId) {
  var cfg = MAP_ISLANDS.filter(function (i) { return i.id === areaId; })[0];
  if (!cfg) return;
  mapState.selectedAreaId = areaId;
  if (!mapState.selectedId || !mapState.nodes[mapState.selectedId] || mapState.nodes[mapState.selectedId].areaId !== areaId) {
    mapState.selectedId = mapNodePrimaryNodeForArea(areaId);
  }
  mapState.goalTarget.set(cfg.x, .55, cfg.z);
  mapState.goalYaw = Math.atan2(cfg.x, cfg.z) + .9;
  mapState.goalPitch = .52;
  mapState.goalDist = 22.5;
  applyMapSelectionVisuals();
  renderScreen();
  sfxClick();
}
function mapFocusGate(areaId) {
  var cfg = MAP_ISLANDS.filter(function (i) { return i.id === areaId; })[0];
  if (!cfg) return;
  mapState.goalTarget.set(cfg.x, .9, cfg.z + 2.05);
  mapState.goalYaw = Math.atan2(cfg.x, cfg.z) + Math.PI;
  mapState.goalPitch = .34;
  mapState.goalDist = 12.4;
}
function mapFullView() {
  mapState.selectedAreaId = null;
  mapState.goalTarget.set(0, .2, 0);
  mapState.goalYaw = -.1;
  mapState.goalPitch = .6;
  mapState.goalDist = 34;
  renderScreen();
  sfxClick();
}
function updateMapScene(dt, time) {
  if (!mapState.active || !mapState.prepared) return;
  mapState.yaw = lerp(mapState.yaw, mapState.goalYaw, Math.min(1, dt * 4.2));
  mapState.pitch = lerp(mapState.pitch, mapState.goalPitch, Math.min(1, dt * 4.2));
  mapState.dist = lerp(mapState.dist, mapState.goalDist, Math.min(1, dt * 4.2));
  mapState.target.lerp(mapState.goalTarget, Math.min(1, dt * 4.2));
  var c = mapState.camera;
  c.position.set(mapState.target.x + Math.sin(mapState.yaw) * Math.cos(mapState.pitch) * mapState.dist, mapState.target.y + Math.sin(mapState.pitch) * mapState.dist, mapState.target.z + Math.cos(mapState.yaw) * Math.cos(mapState.pitch) * mapState.dist);
  c.lookAt(mapState.target);
  var animT = mapState.animFreeze == null ? Math.min(1, (performance.now() - mapState.animationStart) / 1100) : mapState.animFreeze;
  Object.keys(mapState.nodes).forEach(function (id) {
    var n = mapState.nodes[id];
    if (!n || !n.glyph) return;
    var baseY = n.glyph.userData.mapBaseY == null ? n.glyph.position.y : n.glyph.userData.mapBaseY;
    n.glyph.userData.mapBaseY = baseY;
    n.glyph.position.y = baseY + Math.sin(time * 1.7 + n.phase) * .035;
    n.glyph.rotation.y += dt * (n.state === 'available' ? .65 : .18);
    if (n.marker) n.marker.scale.setScalar((n.review.due ? .58 : .45) + Math.sin(time * 2.4 + n.phase) * .04);
    if (n.recommendRing) n.recommendRing.rotation.z = time * .25;
  });
  mapState.paths.forEach(function (p) {
    if (!p.lit) return;
    var ramp = mapState.animFreeze == null ? Math.min(1, (performance.now() - p.animStart) / 1050) : mapState.animFreeze;
    p.mats.forEach(function (mat) { mat.opacity = ramp * (.34 + Math.sin(time * 2 + p.phase) * .12); });
  });
  Object.keys(mapState.gates).forEach(function (areaId) {
    var g = mapState.gates[areaId];
    if (!g) return;
    if (mapState.animFreeze != null) {
      g.current = g.target ? mapState.animFreeze : 0;
    } else if (g.animated && animT < 1) {
      g.current = animT;
    } else {
      g.current += (g.target - g.current) * Math.min(1, dt * 3.5);
    }
    g.leftDoor.position.x = -.3 - g.current * .46;
    g.rightDoor.position.x = .3 + g.current * .46;
    g.leftDoor.material.emissiveIntensity = .08 + g.current * .5;
    g.rightDoor.material.emissiveIntensity = .08 + g.current * .5;
    g.seal.position.y = 1.16 + (g.current > .9 ? Math.sin(time * 2) * .03 : 0);
    g.seal.material.opacity = .35 + g.current * .55;
  });
  mapState.renderer.render(mapState.scene, mapState.camera);
}
function mapPointerDown(e) {
  mapState.dragging = true; mapState.moved = 0; mapState.lastX = e.clientX; mapState.lastY = e.clientY;
  mapState.pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
  if (Object.keys(mapState.pointers).length === 2) {
    var ids = Object.keys(mapState.pointers);
    var a = mapState.pointers[ids[0]], b = mapState.pointers[ids[1]];
    mapState.pinch = Math.hypot(a.x - b.x, a.y - b.y);
  }
  try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
}
function mapPointerMove(e) {
  if (!mapState.dragging) return;
  mapState.moved += Math.abs(e.clientX - mapState.lastX) + Math.abs(e.clientY - mapState.lastY);
  if (Object.keys(mapState.pointers).length === 2) {
    mapState.pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(mapState.pointers);
    var a = mapState.pointers[ids[0]], b = mapState.pointers[ids[1]];
    var d = Math.hypot(a.x - b.x, a.y - b.y);
    if (mapState.pinch) mapState.goalDist = clamp(mapState.goalDist - (d - mapState.pinch) * .04, 7.5, 29);
    mapState.pinch = d;
    return;
  }
  mapState.goalYaw -= (e.clientX - mapState.lastX) * .006;
  mapState.goalPitch = clamp(mapState.goalPitch + (e.clientY - mapState.lastY) * .004, .18, 1.1);
  mapState.lastX = e.clientX; mapState.lastY = e.clientY;
}
function mapPointerUp(e) {
  var wasDragging = mapState.dragging;
  delete mapState.pointers[e.pointerId];
  if (Object.keys(mapState.pointers).length < 2) mapState.pinch = 0;
  mapState.dragging = Object.keys(mapState.pointers).length > 0;
  if (!wasDragging || mapState.moved > 8) return;
  var rect = mapState.canvas.getBoundingClientRect();
  var mouse = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
  var ray = new THREE.Raycaster(); ray.setFromCamera(mouse, mapState.camera);
  var hits = ray.intersectObjects(mapState.nodeMeshes, false);
  if (hits && hits.length) selectMapNode(hits[0].object.userData.mapNodeId);
}
function selectMapNode(id) {
  var node = mapState.nodes[id];
  if (!node) return;
  mapState.selectedId = id;
  mapState.selectedAreaId = node.areaId;
  var cfg = MAP_ISLANDS.filter(function (i) { return i.id === node.areaId; })[0];
  if (cfg) {
    mapState.goalTarget.set(cfg.x, .55, cfg.z);
    mapState.goalYaw = Math.atan2(cfg.x, cfg.z) + .9;
    mapState.goalPitch = .52;
    mapState.goalDist = 22.5;
  }
  applyMapSelectionVisuals();
  renderScreen();
  mountMapCanvas();
  sfxClick();
}

/* -------------------------------------------------------------------------
   UI del mapa
   ------------------------------------------------------------------------- */
function mapAreaRingHTML(area, stats) {
  var pct = stats.total ? stats.mastered / stats.total : 0;
  var deg = Math.round(pct * 360);
  return '<div class="mapAreaRing" style="--accent:' + area.accent + ';background:conic-gradient(' + area.accent + ' ' + deg + 'deg, rgba(255,255,255,.09) 0deg)"><span>' + Math.round(pct * 100) + '<small>%</small></span></div>';
}
function mapAreaCardsHTML() {
  return CAMP.areas.map(function (area) {
    var stats = mapAreaStats(area.id);
    return '<button type="button" class="mapAreaCard ' + (mapState.selectedAreaId === area.id ? 'is-active' : '') + '" data-action="map-area" data-area="' + esc(area.id) + '" style="--accent:' + area.accent + '">' +
      mapAreaRingHTML(area, stats) +
      '<span class="mapAreaCopy"><b>' + esc(area.short) + '</b><small>' + stats.mastered + '/' + stats.total + ' dominados · ' + stats.bossesDone + '/' + stats.bossesTotal + ' jefe</small></span>' +
    '</button>';
  }).join('');
}
function mapStateLegendHTML() {
  return '<span class="mapLegendTitle">Nodos</span>' + ['locked', 'available', 'completed', 'mastered'].map(function (s) {
    var m = MAP_STATE_META[s];
    return '<span class="mapLegendItem"><i style="background:' + m.color + '"></i>' + m.label + '</span>';
  }).join('');
}
function mapRecommendationHTML(rec) {
  if (!rec) return '';
  if (rec.kind === 'review') {
    var where = rec.mission ? (AREA_BY_ID[rec.mission.areaId] || {}).short : 'tus rutas';
    return '<div class="mapRecommendCard mapRecommendCard--review"><span class="mapRecIcon">' + icon('rotate', 16) + '</span><div><span class="eyebrow noRule">Siguiente paso recomendado</span><b>Repaso vencido · ' + rec.count + ' pregunta' + (rec.count === 1 ? '' : 's') + '</b><p>Antes de abrir otro nodo, una mirada breve a lo que pidió volver en ' + esc(where) + '.</p></div><button type="button" class="btn btn--gold btn--sm" data-action="open-review">Repasar ahora ' + icon('chevronRight', 11) + '</button></div>';
  }
  if (rec.kind === 'mission') {
    var m = rec.mission;
    var area = AREA_BY_ID[m.areaId] || {};
    return '<div class="mapRecommendCard" style="--accent:' + (area.accent || '#e4c07a') + '"><span class="mapRecIcon">' + icon(m.kind === 'boss' ? 'shield' : 'play', 16) + '</span><div><span class="eyebrow noRule">Siguiente paso recomendado</span><b>' + esc(m.title) + '</b><p>' + esc(area.short) + ' · ' + esc(m.tierLabel) + ' · +' + formatNumber((m.rewards || {}).xp || 0) + ' XP · +' + formatNumber((m.rewards || {}).coins || 0) + ' ◇</p></div><button type="button" class="btn btn--primary btn--sm" data-action="map-start" data-mission="' + esc(m.id) + '">Abrir ' + (m.kind === 'boss' ? 'la puerta' : 'la ruta') + ' ' + icon('chevronRight', 11) + '</button></div>';
  }
  return '<div class="mapRecommendCard mapRecommendCard--done"><span class="mapRecIcon">' + icon('check', 16) + '</span><div><span class="eyebrow noRule">Siguiente paso recomendado</span><b>Las cinco rutas están abiertas.</b><p>Puedes repasar tus errores, subir el dominio de un nodo o completar lo que quede.</p></div><button type="button" class="btn btn--ghost btn--sm" data-action="open-review">Repasar errores</button></div>';
}
function mapGalleryHTML() {
  var images = [];
  ensureMapRenderer();
  mapBuildScene();
  var oldW = window.innerWidth, oldH = window.innerHeight;
  mapState.renderer.setSize(480, 300, false);
  var cam = new THREE.PerspectiveCamera(34, 480 / 300, .1, 120);
  MAP_ISLANDS.forEach(function (cfg) {
    var area = AREA_BY_ID[cfg.id];
    var target = new THREE.Vector3(cfg.x, .55, cfg.z);
    var yaw = Math.atan2(cfg.x, cfg.z) + .9;
    var pitch = .52, dist = 13.6;
    cam.position.set(target.x + Math.sin(yaw) * Math.cos(pitch) * dist, target.y + Math.sin(pitch) * dist, target.z + Math.cos(yaw) * Math.cos(pitch) * dist);
    cam.lookAt(target);
    mapState.renderer.render(mapState.scene, cam);
    images.push({ area: area, src: mapState.canvas.toDataURL('image/jpeg', .86) });
  });
  mapState.renderer.setSize(oldW, oldH, false);
  return '<div class="overlay"><div class="overlayShell"><div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot"></span>Fase 4 · las cinco islas</span><h1>Cinco rutas, <em>una mirada.</em></h1><p>Captura directa de cada isla flotante desde el mapa 3D. El mapa completo y las fichas están en las otras capturas del checkpoint.</p></div><div class="sheetHeadSide"><span class="chip">5 islas</span><button type="button" class="sheetClose" data-action="close-sheet">' + icon('close', 17) + '</button></div></div><div class="mapGalleryGrid">' + images.map(function (it) { return '<article class="mapGalleryCard" style="--accent:' + it.area.accent + '"><img src="' + it.src + '" alt="' + esc(it.area.short) + '" /><div><span class="chip">' + esc(it.area.short) + '</span><b>' + mapAreaStats(it.area.id).mastered + '/' + mapAreaStats(it.area.id).total + ' dominados</b></div></article>'; }).join('') + '</div></div></div>';
}
function mapScreenHTML() {
  var selected = mapState.selectedId ? mapState.nodes[mapState.selectedId] : null;
  var rec = mapRecommended();
  var stats = mapGlobalStats();
  var title = selected ? selected.mission.title : 'Mapa de las Cinco Rutas';
  var area = selected ? AREA_BY_ID[selected.mission.areaId] : null;
  return '<div class="mapScreen">' +
    '<div id="mapCanvasMount" class="mapCanvasMount"></div>' +
    '<div class="mapTop"><div class="mapBrand"><span class="brandRune">◈</span><div><span>Observatorio de las Cinco Rutas</span><b>Mapa de avance</b></div></div>' +
      '<div class="mapGlobal"><span><b>' + stats.missionsDone + '</b>/' + stats.missionsTotal + ' misiones</span><span><b>' + stats.missionsMastered + '</b>/' + stats.missionsTotal + ' dominadas</span><span><b>' + stats.bossesDone + '</b>/' + stats.bossesTotal + ' jefes</span></div>' +
      '<div class="mapTopActions">' + (pausedDuel && session ? '<button type="button" class="btn btn--gold btn--sm" data-action="resume-suspended-duel">' + icon('play', 12) + ' Reanudar duelo</button>' : '') + '<button type="button" class="btn btn--ghost btn--sm" data-action="map-arena">' + icon('home', 12) + ' Arena</button><button type="button" class="btn btn--ghost btn--sm" data-action="map-full">' + icon('rotate', 12) + ' Mapa completo</button><button type="button" class="btn btn--ghost btn--sm" data-action="map-journal">' + icon('book', 12) + ' Bitácora</button><button type="button" class="sheetClose mapClose" data-action="map-close" aria-label="Cerrar mapa">' + icon('close', 16) + '</button></div></div>' +
    '<aside class="mapAreaRail"><div class="mapRailHead"><span class="eyebrow noRule">Islas</span><small>' + esc(mapState.selectedAreaId ? 'Vista de isla' : 'Vista general') + '</small></div>' + mapAreaCardsHTML() + '<div class="mapLegend">' + mapStateLegendHTML() + '</div><div class="mapRailHint">' + icon('compass', 11) + ' 1–5 islas · 0 mapa completo</div></aside>' +
    '<aside class="mapDetail"><div class="mapDetailScroll">' + mapNodeDetailHTML(selected) + '</div></aside>' +
    '<div class="mapBottom">' + mapRecommendationHTML(rec) + '<div class="mapControlsHint">' + icon('compass', 11) + ' Arrastra para girar · rueda para zoom · toca un faro</div></div>' +
  '</div>';
}
function mountMapCanvas() {
  ensureMapRenderer();
  var mount = document.getElementById('mapCanvasMount');
  if (!mount) return;
  if (mapState.canvas.parentNode !== mount) mount.appendChild(mapState.canvas);
  resizeMapRenderer();
}
function resizeMapRenderer() {
  if (!mapState.renderer) return;
  var w = window.innerWidth, h = window.innerHeight;
  mapState.renderer.setSize(w, h, false);
  if (mapState.camera) { mapState.camera.aspect = w / Math.max(1, h); mapState.camera.updateProjectionMatrix(); }
}
function applyMapSelectionVisuals() {
  var rec = mapRecommended();
  Object.keys(mapState.nodes).forEach(function (id) {
    var n = mapState.nodes[id];
    if (!n) return;
    var selected = mapState.selectedId === id;
    if (n.selectRing) n.selectRing.visible = selected;
    var recommended = rec && rec.mission && rec.mission.id === id;
    if (n.recommendRing) n.recommendRing.visible = !!recommended && !selected;
  });
}
function openMap(nodeId) {
  if (screen === 'duel') return;
  mapReturnScreen = screen === 'title' ? 'title' : (pausedDuel && session ? 'duelPaused' : 'hub');
  mapState.active = true;
  ensureMapRenderer();
  var rec = mapRecommended();
  var chosen = nodeId && MISSION_BY_ID[nodeId] ? nodeId : (rec.mission ? rec.mission.id : (rec.kind === 'review' ? (function () { var b = null; CAMP.missions.forEach(function (m) { var r = mapReviewInfo(m); if (r.due && (!b || r.due > b.due)) b = { id: m.id, due: r.due }; }); return b ? b.id : null; })() : null));
  if (!chosen) chosen = CAMP.missions[0] ? CAMP.missions[0].id : null;
  mapState.selectedId = chosen;
  mapState.selectedAreaId = chosen && MISSION_BY_ID[chosen] ? MISSION_BY_ID[chosen].areaId : null;
  mapBuildScene();
  setScreen('map');
  mountMapCanvas();
  initAudio();
  sfxSelect();
}
function closeMap() {
  mapState.active = false;
  if (pausedDuel && session) { setScreen('title'); return; }
  if (mapReturnScreen === 'title') { mapReturnScreen = 'hub'; enterTitle(); return; }
  enterHub();
}
function launchMissionFromMap(id) {
  var mission = MISSION_BY_ID[id];
  if (!mission || !missionUnlockInfo(mission).unlocked) return;
  mapState.active = false;
  mapLaunchPending = true;
  launchMission(id);
}
var mapLaunchPending = false;
window.addEventListener('resize', function () { if (mapState.renderer) resizeMapRenderer(); });
function mapAfterResult() {
  var missionId = lastResult ? lastResult.missionId : null;
  var wasBoss = lastResult && lastResult.mode === 'boss';
  openMap(missionId);
  if (wasBoss && lastResult && lastResult.pass) {
    toast('La puerta del guardián queda abierta en el mapa.', 'success', 3200);
  } else if (lastResult && lastResult.pass && lastResult.newlyCompleted) {
    toast('El siguiente tramo del mapa se ha encendido.', 'success', 3200);
  }
}
