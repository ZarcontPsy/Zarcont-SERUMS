/* =========================================================================
   V2.3 · FASE 1 · AGENTE 2 · VISOR Y ESCENARIO DE PRUEBA
   -------------------------------------------------------------------------
   Propiedad exclusiva del Agente 2. Se carga después del sistema de encaje.
   Sustituye el visor V2.2 (v22FramePreview, updateWardrobeAvatar,
   mountWardrobePreview, v22MountShopPreview, updateWardrobePreview y
   v22UpdateShopPreview) manteniendo esos nombres y los mounts existentes.

   Decisiones simples (documentadas en REPORTE.md):
   - Un único renderer propio, vivo durante toda la sesión. Cambiar pieza,
     héroe o tamaño reutiliza el mismo contexto y el mismo canvas.
   - Encuadre calculado con Box3 del avatar completo + la caja de la pieza y
     la FOV/aspecto reales del canvas; nunca se recorta la pieza.
   - En la tienda se previsualiza la pieza seleccionada aunque sea poseída
     (antes solo se probaban las no compradas). No toca shop.selectedId,
     wardrobe.draft ni el guardado.
   - El selector de héroes usa V23.preview.heroId y reconstruye solo el
     avatar del visor. No cambia el héroe equipado ni persiste nada.
   - Los efectos/marcos se refuerzan en el visor (aditivo visible,
     toneMapped=false, renderOrder, sin depthWrite) sin tocar sus builders
     compartidos ni las miniaturas.
   ========================================================================= */

var V23Visor = {
  version: '2.3.1-a2',
  engine: null,
  active: false,
  mode: '',
  mountId: '',
  mountEl: null,
  heroId: null,
  category: '',
  pieceId: null,
  pieceOverride: null,
  lastKey: '',
  zoom: 1,
  rotation: -0.3,
  autoFrame: true,
  needFit: false,
  dragging: false,
  lastX: 0,
  frames: 0,
  fps: 0,
  lastFrameAt: 0,
  cameraInfo: null,
  canvasId: 'v23-vis-1',
  measureCache: null,
  generatedAt: Date.now()
};

/* -------------------------------------------------------------------------
   Utilidades propias (prefijo v23v para no colisionar con otros agentes)
   ------------------------------------------------------------------------- */
function v23vById(id) { return document.getElementById(id); }
function v23vQ(sel, root) { try { return (root || document).querySelector(sel); } catch (e) { return null; } }
function v23vQA(sel, root) { try { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); } catch (e) { return []; } }
function v23vClamp(n, lo, hi) { n = Number(n); if (!isFinite(n)) n = lo; return Math.max(lo, Math.min(hi, n)); }
function v23vClone(o) { var out = {}; Object.keys(o || {}).forEach(function (k) { out[k] = o[k]; }); return out; }
function v23vHeroName(id) { var c = CHARACTER_BY_ID[id]; return c ? c.name : String(id || ''); }
function v23vLook(id) { return HERO_LOOKS[id] || HERO_LOOKS.ilan; }
function v23vRarity(c) { return c ? rarityUI(cosmeticRarityKey(c)) : rarityUI('comun'); }
function v23vSlotLabel(category) { return category ? cosmeticSlotLabel(category) : 'Sin ranura'; }
function v23vReducedMotion() {
  if (v23IsReducedMotion()) return true;
  try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
}
function v23vIsBust(category) {
  if (category === 'cabeza' || category === 'peinado') return true;
  if (category === 'accesorios' && V23Visor.pieceId === 'c-accesorios-gafas') return true;
  return false;
}
function v23vIsHalf(category) {
  if (category === 'torso' || category === 'amuletos' || category === 'accesorios') return true;
  if (category === 'extras') return true;
  return false;
}
function v23vIsFull(category) {
  if (category === 'piernas' || category === 'efectos' || category === 'estela' || category === 'marcos' || category === 'mascota') return true;
  if (category === 'titulo' || !category) return true;
  return false;
}
function v23vNaturalHero(mode) {
  var id = '';
  if (mode === 'wardrobe' && wardrobe && wardrobe.characterId) id = wardrobe.characterId;
  if (!id && state && state.collection) id = state.collection.selectedCharacterId;
  if (!CHARACTER_BY_ID[id]) id = CAMP.characters.length ? CAMP.characters[0].id : 'ilan';
  return id;
}
function v23vHeroList() {
  return CAMP.characters.map(function (c) { return { id: c.id, name: c.name }; });
}
function v23vSceneSelection(mode) {
  if (V23Visor.pieceOverride) {
    var forced = COSMETIC_BY_ID[V23Visor.pieceOverride];
    if (forced) return forced;
  }
  if (mode === 'shop') return shop.selectedId ? COSMETIC_BY_ID[shop.selectedId] : null;
  if (mode === 'wardrobe') return wardrobe.selectedId ? COSMETIC_BY_ID[wardrobe.selectedId] : null;
  return null;
}
function v23vPreviewOutfit(heroId, mode, piece) {
  var outfit = {};
  if (mode === 'wardrobe' && heroId === wardrobe.characterId) {
    outfit = v23vClone(wardrobe.compareSaved ? wardrobe.saved : wardrobe.draft);
  } else {
    outfit = v23vClone(getCharacterOutfit(heroId));
  }
  if (V23Visor.pieceOverride && COSMETIC_BY_ID[V23Visor.pieceOverride]) {
    var forced = COSMETIC_BY_ID[V23Visor.pieceOverride];
    outfit[forced.category] = forced.id;
    return outfit;
  }
  if (mode === 'shop') {
    if (piece && !V22.shopCompare) outfit[piece.category] = piece.id;
  } else if (mode === 'wardrobe' && piece && heroId !== wardrobe.characterId) {
    if (cosmeticOwned(piece.id)) outfit[piece.category] = piece.id;
  }
  return outfit;
}

/* -------------------------------------------------------------------------
   Motor 3D del visor: se crea una vez y se reutiliza siempre
   ------------------------------------------------------------------------- */
function v23vFloor() {
  var group = new THREE.Group();
  group.name = 'v23-floor';
  var accent = '#7AA2FF';
  var disc = new THREE.Mesh(
    new THREE.CircleGeometry(1.34, 48),
    new THREE.MeshBasicMaterial({ color: color(accent), transparent: true, opacity: 0.14, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.012;
  disc.renderOrder = 2;
  group.add(disc);
  var glowMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.7, 3.7),
    new THREE.MeshBasicMaterial({ map: GLOW_TEX, color: color('#7AA2FF'), transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
  );
  glowMesh.rotation.x = -Math.PI / 2;
  glowMesh.position.y = 0.016;
  glowMesh.renderOrder = 1;
  group.add(glowMesh);
  var ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.02, 0.012, 4, 48),
    new THREE.MeshBasicMaterial({ color: color('#7AA2FF'), transparent: true, opacity: 0.62, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.026;
  ring.renderOrder = 3;
  group.add(ring);
  var ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(1.38, 0.007, 4, 48),
    new THREE.MeshBasicMaterial({ color: color('#7AA2FF'), transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  ring2.rotation.x = Math.PI / 2;
  ring2.position.y = 0.03;
  ring2.renderOrder = 3;
  group.add(ring2);
  // Sombra de contacto muy tenue: apoya la figura sin oscurecer la pieza.
  var blob = makeBlob(1.7);
  blob.position.y = 0.018;
  blob.material.opacity = 0.42;
  blob.renderOrder = 0;
  group.add(blob);
  group.visible = false;
  return { group: group, disc: disc, glow: glowMesh, ring: ring, ring2: ring2, blob: blob };
}

function v23vEnsureEngine() {
  var v = V23Visor;
  if (v.engine) return v.engine;
  var canvas = document.createElement('canvas');
  canvas.className = 'v23VisorCanvas';
  canvas.setAttribute('data-v23-canvas-id', v.canvasId);
  var renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
  } catch (e) { renderer = null; }
  if (!renderer) {
    v.engine = { error: 'webgl', canvas: canvas, avatar: null };
    return v.engine;
  }
  var pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(560, 420, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  var scene = new THREE.Scene();
  var hemi = new THREE.HemisphereLight('#c8d5ff', '#241d32', 1.45);
  scene.add(hemi);
  var key = new THREE.DirectionalLight('#ffe5ca', 2.55);
  key.position.set(-3, 6, 5);
  scene.add(key);
  var fill = new THREE.DirectionalLight('#7ba6ff', 1.25);
  fill.position.set(4, 3.4, 3);
  scene.add(fill);
  var rim = new THREE.DirectionalLight('#7AA2FF', 1.3);
  rim.position.set(0.8, 4.2, -4.6);
  scene.add(rim);
  var bottom = new THREE.DirectionalLight('#b9a6ff', 0.55);
  bottom.position.set(-2, -1.5, 3.2);
  scene.add(bottom);

  var root = new THREE.Group();
  root.name = 'v23-avatar-root';
  scene.add(root);

  var floor = v23vFloor();
  scene.add(floor.group);

  var camera = new THREE.PerspectiveCamera(26, 4 / 3, 0.08, 80);
  var engine = {
    canvas: canvas,
    renderer: renderer,
    scene: scene,
    camera: camera,
    root: root,
    floor: floor,
    lights: { hemi: hemi, key: key, fill: fill, rim: rim, bottom: bottom },
    avatar: null,
    stage: null,
    mount: null,
    hud: null,
    resizeObserver: null,
    error: null,
    canvasId: v.canvasId,
    lastKey: '',
    ring: null,
    glow: null
  };
  v.engine = engine;
  try { wardrobe.preview = engine; } catch (e) {}
  return engine;
}

/* -------------------------------------------------------------------------
   DOM: escenario limpio + franja de controles fuera del canvas
   ------------------------------------------------------------------------- */
function v23vHeroOptionsHTML() {
  return v23vHeroList().map(function (h) {
    return '<option value="' + v23Escape(h.id) + '">' + v23Escape(h.name) + '</option>';
  }).join('');
}

function v23vBuildMountDom(mount) {
  mount.classList.add('v23VisorMount');
  mount.innerHTML =
    '<div class="v23VisorLayout">' +
      '<div class="v23VisorStage" data-v23-stage="1" aria-label="Vista previa 3D del héroe con la pieza seleccionada"></div>' +
      '<div class="v23VisorHud">' +
        '<div class="v23VisorHudRow v23VisorHudRow--top">' +
          '<span class="v23VisorLive"><span class="v23VisorLiveDot" aria-hidden="true"></span>Prueba en vivo</span>' +
          '<label class="v23VisorHeroField"><span class="v23VisorHeroLabel">Héroe</span>' +
            '<select class="v23VisorHeroSelect" data-v23-hero-select aria-label="Héroe de prueba">' + v23vHeroOptionsHTML() + '</select>' +
          '</label>' +
        '</div>' +
        '<div class="v23VisorHudRow v23VisorHudRow--meta">' +
          '<span class="v23VisorChip v23VisorChip--rarity" data-v23-rarity-chip>Común</span>' +
          '<span class="v23VisorChip v23VisorChip--slot" data-v23-slot-chip>Sin ranura</span>' +
          '<span class="v23VisorPieceName" data-v23-piece-name>Selecciona una pieza</span>' +
          '<span class="v23VisorZoomGroup" role="group" aria-label="Zoom del visor">' +
            '<button type="button" class="v23VisorZoomBtn" data-v23-zoom="out" aria-label="Alejar" title="Alejar">−</button>' +
            '<span class="v23VisorZoomValue" data-v23-zoom-value>1.0×</span>' +
            '<button type="button" class="v23VisorZoomBtn" data-v23-zoom="in" aria-label="Acercar" title="Acercar">+</button>' +
            '<button type="button" class="v23VisorZoomBtn v23VisorResetBtn" data-v23-reset="1" aria-label="Restablecer encuadre y zoom" title="Restablecer encuadre y zoom"><span class="v23VisorResetIcon" aria-hidden="true">↺</span><span class="v23VisorResetLabel">Restablecer</span></button>' +
          '</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  mount.setAttribute('data-v23-visor', '1');
}

function v23vMountVisor(mountId, mode) {
  var v = V23Visor;
  var mount = v23vById(mountId);
  if (!mount) return false;
  var engine = v23vEnsureEngine();
  if (!engine || engine.error) return false;
  var modeChanged = v.mode !== mode;
  if (modeChanged || !v.heroId || !CHARACTER_BY_ID[v.heroId]) {
    v.heroId = v23vNaturalHero(mode);
    V23.preview.heroId = v.heroId;
    v.pieceOverride = null;
  }
  v.mode = mode;
  v.mountId = mountId;
  v.mountEl = mount;
  v.active = true;
  if (modeChanged) {
    v.zoom = 1;
    V23.preview.zoom = 1;
    v.rotation = -0.3;
  }
  V23.preview.source = mode;
  V23.preview.autoFrame = true;
  V23.flags.visorReady = true;
  if (!v23vQ('.v23VisorLayout', mount)) v23vBuildMountDom(mount);
  mount.classList.add('v23VisorMount');
  var stage = v23vQ('.v23VisorStage', mount);
  var hud = v23vQ('.v23VisorHud', mount);
  if (engine.canvas.parentNode !== stage) stage.appendChild(engine.canvas);
  engine.stage = stage;
  engine.mount = mount;
  if (!engine.hud || engine.hud.mount !== mount || !engine.hud.heroSelect || !engine.hud.heroSelect.isConnected) {
    engine.hud = {
      mount: mount,
      heroSelect: v23vQ('[data-v23-hero-select]', mount),
      rarityChip: v23vQ('[data-v23-rarity-chip]', mount),
      slotChip: v23vQ('[data-v23-slot-chip]', mount),
      pieceName: v23vQ('[data-v23-piece-name]', mount),
      zoomValue: v23vQ('[data-v23-zoom-value]', mount)
    };
  }
  engine.canvas.style.width = '100%';
  engine.canvas.style.height = '100%';
  engine.canvas.style.display = 'block';
  if (engine.resizeObserver) { try { engine.resizeObserver.disconnect(); } catch (e) {} }
  if (typeof ResizeObserver !== 'undefined') {
    try {
      engine.resizeObserver = new ResizeObserver(function () { v23vResize(); });
      engine.resizeObserver.observe(stage);
    } catch (e) { engine.resizeObserver = null; }
  }
  v23vResize();
  v23vRefreshVisor(true);
  window.setTimeout(v23vResize, 40);
  return true;
}

/* -------------------------------------------------------------------------
   Aspecto de escena por rareza + héroe
   ------------------------------------------------------------------------- */
function v23vApplySceneLook(piece, heroId) {
  var engine = V23Visor.engine;
  if (!engine || !engine.stage) return;
  var rarity = v23vRarity(piece);
  var look = v23vLook(heroId);
  var rareColor = rarity.color || '#7AA2FF';
  var accent = (look && look.accent) || '#7AA2FF';
  var mount = engine.mount || V23Visor.mountEl;
  var stage = engine.stage;
  stage.style.setProperty('--v23-rare', rareColor);
  stage.style.setProperty('--v23-accent', accent);
  stage.setAttribute('data-v23-rarity', cosmeticRarityKey(piece || { rarity: 'comun' }));
  if (mount) {
    mount.setAttribute('data-v23-rarity', cosmeticRarityKey(piece || { rarity: 'comun' }));
    mount.style.setProperty('--v23-rare', rareColor);
    mount.style.setProperty('--v23-accent', accent);
  }
  try {
    engine.lights.rim.color.set(rareColor);
    engine.floor.disc.material.color.set(accent);
    engine.floor.glow.material.color.set(rareColor);
    engine.floor.ring.material.color.set(rareColor);
    engine.floor.ring2.material.color.set(accent);
    engine.floor.blob.material.opacity = 0.42;
  } catch (e) {}
}

/* -------------------------------------------------------------------------
   Refuerzo local de efectos y marcos (solo el avatar del visor)
   ------------------------------------------------------------------------- */
function v23vFindBigSprite(group) {
  var best = null;
  group.traverse(function (node) {
    if (node.isSprite && (!best || node.scale.x > best.scale.x)) best = node;
  });
  return best;
}
function v23vTuneSprite(node, opts) {
  var m = node.material;
  node.frustumCulled = false;
  if (!m) return;
  m.depthWrite = false;
  m.toneMapped = false;
  if (opts && opts.depthTest != null) m.depthTest = !!opts.depthTest;
  if (opts && opts.blending) m.blending = opts.blending;
  if (opts && opts.opacity != null) m.opacity = opts.opacity;
  if (opts && opts.order != null) node.renderOrder = opts.order;
  m.needsUpdate = true;
}

function v23vIsRarityGlow(group, node) {
  var last = group.children[group.children.length - 1];
  return last === node && node.isSprite && Math.abs(node.position.y - 0.35) < 0.03 && node.scale.x > 0.45;
}

function v23vTuneCosmetics(avatar) {
  if (!avatar || !avatar.cosmetics || !avatar.cosmetics.groups) return;
  avatar.cosmetics.groups.forEach(function (group) {
    var slot = group.userData && group.userData.slot;
    var id = group.userData && group.userData.cosmeticId;
    group.frustumCulled = false;
    group.traverse(function (node) {
      node.frustumCulled = false;
      if (!node.material) return;
      if (node.isSprite) {
        v23vTuneSprite(node, { depthTest: true });
      } else if (node.isMesh && node.material.transparent) {
        node.material.toneMapped = false;
      }
    });

    if (slot === 'efectos') {
      var big = v23vFindBigSprite(group);
      var isAura = id === 'c-efecto-aura' || id === 'x-aura-amanecer';
      if (isAura) {
        var auraColor = (group.userData && group.userData.cosmeticId === 'x-aura-amanecer') ? '#f3b562' : '#e4c07a';
        if (big) {
          var grow = id === 'x-aura-amanecer' ? 1.08 : 1.18;
          big.scale.set(big.scale.x * grow, big.scale.y * grow, 1);
          v23vTuneSprite(big, { depthTest: true, opacity: 0.56, order: 12 });
          big.position.y = 1.18;
        }
        var halo = makeGlowSprite(auraColor, id === 'x-aura-amanecer' ? 3.2 : 2.9, 0.3);
        halo.position.set(0, 1.24, -0.46);
        v23vTuneSprite(halo, { depthTest: true, opacity: 0.32, order: 8 });
        group.add(halo);
        group.traverse(function (node) {
          if (node.isMesh && node.geometry && node.geometry.type === 'TorusGeometry') {
            node.material.blending = THREE.AdditiveBlending;
            node.material.transparent = true;
            node.material.opacity = 0.88;
            node.material.depthWrite = false;
            node.material.toneMapped = false;
            node.renderOrder = 14;
            node.frustumCulled = false;
          }
        });
      } else if (id === 'c-efecto-chispas') {
        group.traverse(function (node) {
          if (!node.isSprite || v23vIsRarityGlow(group, node)) return;
          node.scale.set(node.scale.x * 1.15, node.scale.y * 1.15, 1);
          v23vTuneSprite(node, { depthTest: false, opacity: Math.max(0.78, node.material.opacity), order: 24 });
        });
      } else if (id === 'c-efecto-bruma') {
        group.position.y += 0.07;
        group.traverse(function (node) {
          if (!node.isSprite) return;
          node.scale.set(node.scale.x * 1.05, node.scale.y, 1);
          v23vTuneSprite(node, { depthTest: false, blending: THREE.AdditiveBlending, opacity: 0.4, order: 22 });
        });
      } else if (id === 'c-efecto-constelacion') {
        group.traverse(function (node) {
          if (node.isSprite) {
            if (v23vIsRarityGlow(group, node)) return;
            node.scale.set(node.scale.x * 1.05, node.scale.y * 1.05, 1);
            v23vTuneSprite(node, { depthTest: true, opacity: 0.8, order: 26 });
          } else if (node.isMesh) {
            node.frustumCulled = false;
            if (node.material) node.material.toneMapped = false;
          }
        });
      } else {
        group.traverse(function (node) {
          if (!node.isSprite) return;
          v23vTuneSprite(node, { depthTest: false, opacity: Math.max(0.7, node.material.opacity), order: 24 });
        });
      }
    } else if (slot === 'marcos') {
      var frameColor = id === 'c-marco-bronce' ? '#c9975c' : id === 'c-marco-platino' ? '#e6eefc' : id === 'c-marco-vacio' ? '#b48cf0' : '#e4c07a';
      var ownGlow = v23vFindBigSprite(group);
      if (ownGlow) {
        ownGlow.scale.set(ownGlow.scale.x * 0.94, ownGlow.scale.y * 0.94, 1);
        v23vTuneSprite(ownGlow, { depthTest: true, opacity: 0.32, order: 10 });
      }
      var frameHalo = makeGlowSprite(frameColor, id === 'c-marco-vacio' ? 2.4 : 2.2, 0.3);
      frameHalo.position.set(0, 1.38, -0.92);
      v23vTuneSprite(frameHalo, { depthTest: true, opacity: 0.3, order: 7 });
      group.add(frameHalo);
      group.traverse(function (node) {
        if (node.isSprite) {
          if (node === ownGlow || node === frameHalo) return;
          node.scale.set(node.scale.x * 1.28, node.scale.y * 1.28, 1);
          v23vTuneSprite(node, { depthTest: true, opacity: 0.95, order: 36 });
        } else if (node.isMesh) {
          node.frustumCulled = false;
          if (node.material && node.material.transparent) {
            node.material.transparent = true;
            node.material.opacity = 0.86;
            node.material.depthTest = false;
            node.material.depthWrite = false;
            node.material.toneMapped = false;
            node.material.needsUpdate = true;
          }
          node.renderOrder = 34;
        }
      });
      // El marco se construye centrado en y=1.35, pero su animación de V2.2
      // volvía a sumar baseY=1.35 al grupo: flotaba por encima del héroe y
      // quedaba fuera de encuadre. En el visor lo dejamos en su origen real.
      if (avatar.cosmetics && avatar.cosmetics.animated) {
        avatar.cosmetics.animated.forEach(function (a) {
          if (a.group === group && a.type === 'frame') a.baseY = 0.0001;
        });
      }
      group.position.y = 0.0001;
    } else if (slot === 'estela') {
      group.traverse(function (node) {
        if (node.isSprite) {
          node.scale.set(node.scale.x * 1.3, node.scale.y * 1.3, 1);
          v23vTuneSprite(node, { depthTest: false, opacity: Math.max(0.8, node.material.opacity), order: 22 });
        } else if (node.isMesh && node.material && node.material.transparent) {
          node.material.depthTest = false;
          node.material.depthWrite = false;
          node.material.toneMapped = false;
          node.material.opacity = Math.max(0.75, node.material.opacity);
          node.renderOrder = 23;
          node.frustumCulled = false;
        }
      });
    }
  });
}

/* -------------------------------------------------------------------------
   Avatar y encuadre
   ------------------------------------------------------------------------- */
function v23vResetPose(av) {
  if (!av) return;
  av.body.position.y = 0;
  av.head.rotation.y = 0.1;
  av.leftArm.rotation.z = 0.04;
  av.rightArm.rotation.z = -0.04;
}
function v23vBuildAvatar(heroId, outfit) {
  var avatar = buildHeroAvatar(heroId);
  applyOutfitToAvatar(avatar, heroId, outfit);
  avatar.root.rotation.y = V23Visor.rotation;
  v23vTuneCosmetics(avatar);
  v23vResetPose(avatar);
  animateAvatarCosmetics(avatar, 0, 0.6, false, 0);
  return avatar;
}
function v23vDisposeAvatar(av) {
  if (!av || !av.root) return;
  try { if (av.root.parent) av.root.parent.remove(av.root); } catch (e) {}
  try {
    av.root.traverse(function (node) {
      if (node.geometry && node.geometry !== undefined && !node.isSprite) {
        try { node.geometry.dispose(); } catch (e) {}
      }
      if (node.material) {
        try {
          if (Array.isArray(node.material)) node.material.forEach(function (m) { m.dispose(); });
          else node.material.dispose();
        } catch (e) {}
      }
    });
  } catch (e) {}
}
function v23vPieceBox(avatar, category) {
  if (!avatar || !avatar.cosmetics || !avatar.cosmetics.groups) return null;
  var solidFocus = category === 'efectos' || category === 'estela' || category === 'mascota';
  var box = null;
  avatar.cosmetics.groups.forEach(function (group) {
    if (!group.userData || group.userData.slot !== category) return;
    var b = solidFocus ? v23vMeshBox(group) : new THREE.Box3().setFromObject(group);
    if (b && !b.isEmpty()) box = box ? box.union(b) : b;
  });
  return box;
}
function v23vMeshBox(group) {
  if (!group) return null;
  var box = null;
  group.updateMatrixWorld(true);
  group.traverseVisible(function (node) {
    if (!node.isMesh || !node.geometry) return;
    var b = new THREE.Box3().setFromObject(node);
    if (b.isEmpty()) return;
    box = box ? box.union(b) : b;
  });
  return box;
}
function v23vFitBoxes(avatar, category) {
  var boxes = [];
  var minY = v23vIsBust(category) ? 1.5 : (v23vIsHalf(category) ? 0.62 : -Infinity);
  /* En efectos/estela/mascota la cámara encuadra la geometría sólida de la
     pieza, no los sprites aditivos de brillo: así el héroe conserva al menos
     el 60 % del alto y la firma se sigue leyendo. */
  var solidFocus = category === 'efectos' || category === 'estela' || category === 'mascota';
  avatar.root.updateMatrixWorld(true);
  avatar.root.traverseVisible(function (node) {
    if (!node.isMesh && !node.isSprite) return;
    if (solidFocus && node.isSprite) return;
    var b = new THREE.Box3().setFromObject(node);
    if (b.isEmpty()) return;
    if (isFinite(minY)) {
      if (b.max.y <= minY + 0.001) return;
      b.min.y = Math.max(b.min.y, minY);
    }
    boxes.push(b);
  });
  // La pieza seleccionada entra siempre completa (geometría sólida en efectos).
  avatar.cosmetics.groups.forEach(function (group) {
    if (!group.userData || group.userData.slot !== category) return;
    var b = solidFocus ? v23vMeshBox(group) : new THREE.Box3().setFromObject(group);
    if (b && !b.isEmpty()) boxes.push(b);
  });
  if (v23vIsFull(category)) {
    boxes.push(new THREE.Box3(new THREE.Vector3(-0.35, -0.03, -0.35), new THREE.Vector3(0.35, 0.02, 0.35)));
  }
  return boxes;
}
function v23vFitCamera() {
  var engine = V23Visor.engine;
  var v = V23Visor;
  if (!engine || !engine.avatar) return;
  var av = engine.avatar;
  av.root.rotation.y = v.rotation;
  engine.root.updateMatrixWorld(true);
  var full = new THREE.Box3().setFromObject(av.root);
  if (full.isEmpty()) return;
  var category = v.category;
  var pieceBox = v23vPieceBox(av, category);
  var boxes = v23vFitBoxes(av, category);
  if (!boxes.length) boxes = [full.clone()];
  var focus = boxes[0].clone();
  boxes.forEach(function (b) { focus.union(b); });
  if (v23vIsFull(category)) focus.min.y = Math.min(focus.min.y, 0);
  var center = focus.getCenter(new THREE.Vector3());
  var size = focus.getSize(new THREE.Vector3());
  var dir = new THREE.Vector3(0.24, 0.11, 1).normalize();
  var right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize();
  var up = new THREE.Vector3().crossVectors(dir, right).normalize();
  var halfW = 0, halfH = 0, dMax = -Infinity, dMin = Infinity;
  var pad = v23vIsBust(category) ? 1.12 : (v23vIsHalf(category) ? 1.16 : 1.2);
  var tanV = Math.tan((engine.camera.fov * Math.PI / 180) / 2);
  var tanH = tanV * Math.max(0.2, engine.camera.aspect);
  var dist = 0;
  var p = new THREE.Vector3();
  boxes.forEach(function (box) {
    for (var xi = 0; xi < 2; xi++) {
      for (var yi = 0; yi < 2; yi++) {
        for (var zi = 0; zi < 2; zi++) {
          p.set(xi ? box.max.x : box.min.x, yi ? box.max.y : box.min.y, zi ? box.max.z : box.min.z).sub(center);
          var r = p.dot(right), u = p.dot(up), dr = p.dot(dir);
          if (Math.abs(r) > halfW) halfW = Math.abs(r);
          if (Math.abs(u) > halfH) halfH = Math.abs(u);
          if (dr > dMax) dMax = dr;
          if (dr < dMin) dMin = dr;
          var need = dr + Math.max(Math.abs(r) * pad / tanH, Math.abs(u) * pad / tanV);
          if (need > dist) dist = need;
        }
      }
    }
  });
  dist = Math.max(dist, 1.4);
  var zoom = v23vClamp(v.zoom, 0.55, 2.6);
  dist = Math.max(dist / zoom, dMax + 0.35);
  var camPos = center.clone().addScaledVector(dir, dist);
  engine.camera.position.copy(camPos);
  engine.camera.lookAt(center);
  engine.camera.near = Math.max(0.05, Math.min(dist * 0.4, dist - (dMax - dMin) - 0.45));
  engine.camera.far = dist + Math.max(20, size.length() * 3);
  engine.camera.updateProjectionMatrix();
  engine.floor.group.visible = v23vIsFull(category);
  if (engine.floor.group.visible) {
    var ground = Math.min(0.01, full.min.y + 0.004);
    engine.floor.group.position.y = ground;
  }
  v.cameraInfo = {
    distance: Math.round(dist * 1000) / 1000,
    target: [center.x, center.y, center.z].map(function (n) { return Math.round(n * 1000) / 1000; }),
    fov: engine.camera.fov,
    aspect: Math.round(engine.camera.aspect * 1000) / 1000,
    fit: {
      halfW: Math.round(halfW * 1000) / 1000,
      halfH: Math.round(halfH * 1000) / 1000,
      dMax: Math.round(dMax * 1000) / 1000,
      dMin: Math.round(dMin * 1000) / 1000,
      pad: pad
    },
    focus: { min: [focus.min.x, focus.min.y, focus.min.z].map(function (n) { return Math.round(n * 100) / 100; }), max: [focus.max.x, focus.max.y, focus.max.z].map(function (n) { return Math.round(n * 100) / 100; }) },
    box: { min: [full.min.x, full.min.y, full.min.z].map(function (n) { return Math.round(n * 100) / 100; }), max: [full.max.x, full.max.y, full.max.z].map(function (n) { return Math.round(n * 100) / 100; }) }
  };
}

/* -------------------------------------------------------------------------
   Refresco del visor
   ------------------------------------------------------------------------- */
function v23vRefreshVisor(force) {
  var v = V23Visor;
  var engine = v.engine;
  if (!v.active || !engine || engine.error || !engine.stage) return;
  var mode = v.mode;
  var heroId = v.heroId && CHARACTER_BY_ID[v.heroId] ? v.heroId : v23vNaturalHero(mode);
  var piece = v23vSceneSelection(mode);
  var category = piece ? piece.category : (mode === 'wardrobe' && wardrobe ? wardrobe.slot : '');
  var outfit = v23vPreviewOutfit(heroId, mode, piece);
  var quality = v23Quality();
  var key = heroId + '|' + mode + '|' + category + '|' + (v.pieceOverride || '') + '|' +
    Object.keys(outfit).sort().map(function (k) { return k + '=' + outfit[k]; }).join(',') + '|' +
    quality + '|' + (v23vReducedMotion() ? 1 : 0);
  if (!force && key === v.lastKey && engine.avatar) {
    v23vSyncHud(piece, heroId, category);
    return;
  }
  var oldCategory = v.category;
  var changed = !engine.avatar || engine.avatar.id !== heroId;
  if (changed) {
    if (engine.avatar) v23vDisposeAvatar(engine.avatar);
    engine.avatar = v23vBuildAvatar(heroId, outfit);
    engine.root.add(engine.avatar.root);
  } else {
    applyOutfitToAvatar(engine.avatar, heroId, outfit);
    engine.avatar.root.rotation.y = v.rotation;
    v23vTuneCosmetics(engine.avatar);
    v23vResetPose(engine.avatar);
    animateAvatarCosmetics(engine.avatar, 0, 0.6, false, 0);
  }
  if (oldCategory !== category || changed) {
    v.rotation = category === 'marcos' ? -0.08 : -0.3;
    engine.avatar.root.rotation.y = v.rotation;
  }
  v.category = category;
  v.pieceId = piece ? piece.id : null;
  v.heroId = heroId;
  V23.preview.heroId = heroId;
  V23.preview.zoom = v.zoom;
  v.lastKey = key;
  v23vApplySceneLook(piece, heroId);
  v23vSyncHud(piece, heroId, category);
  v23vFitCamera();
  v23vRender();
}

function v23vSyncHud(piece, heroId, category) {
  var v = V23Visor;
  var engine = v.engine;
  var hud = engine && engine.hud;
  if (!hud) return;
  if (hud.heroSelect && hud.heroSelect.value !== heroId) hud.heroSelect.value = heroId;
  var rarity = v23vRarity(piece);
  if (hud.rarityChip) {
    hud.rarityChip.textContent = piece ? rarity.label : 'Sin rareza';
    hud.rarityChip.style.setProperty('--v23-chip', rarity.color || '#7AA2FF');
  }
  if (hud.slotChip) {
    hud.slotChip.textContent = piece ? v23vSlotLabel(category) : (category ? v23vSlotLabel(category) : 'Sin ranura');
    hud.slotChip.style.setProperty('--v23-chip', (v23vLook(heroId) && v23vLook(heroId).accent) || '#7AA2FF');
  }
  if (hud.pieceName) {
    hud.pieceName.textContent = piece ? piece.name : (v.mode === 'wardrobe' ? 'Atuendo del héroe' : 'Selecciona una pieza del catálogo');
    hud.pieceName.title = hud.pieceName.textContent;
  }
  if (hud.zoomValue) hud.zoomValue.textContent = v.zoom.toFixed(1) + '×';
  var mount = engine.mount;
  if (mount) {
    mount.setAttribute('data-v23-hero', heroId);
    mount.setAttribute('data-v23-category', category || '');
  }
}

function v23vRender() {
  var engine = V23Visor.engine;
  if (!engine || !engine.avatar) return;
  engine.renderer.render(engine.scene, engine.camera);
  V23Visor.frames += 1;
}

function v23vSetZoom(value) {
  var v = V23Visor;
  v.zoom = v23vClamp(value, 0.55, 2.6);
  V23.preview.zoom = v.zoom;
  v23vFitCamera();
  v23vSyncHud(v23vSceneSelection(v.mode), v.heroId, v.category);
  v23vRender();
}
function v23vResetView() {
  var v = V23Visor;
  v.zoom = 1;
  V23.preview.zoom = 1;
  v.rotation = v.category === 'marcos' ? -0.08 : -0.3;
  if (v.engine && v.engine.avatar) v.engine.avatar.root.rotation.y = v.rotation;
  v23vFitCamera();
  v23vSyncHud(v23vSceneSelection(v.mode), v.heroId, v.category);
  v23vRender();
}
function v23vSetHero(heroId) {
  if (!CHARACTER_BY_ID[heroId]) return false;
  var v = V23Visor;
  v.heroId = heroId;
  V23.preview.heroId = heroId;
  v23vRefreshVisor(true);
  return true;
}
function v23vSetPiece(id) {
  if (id && !COSMETIC_BY_ID[id]) return false;
  V23Visor.pieceOverride = id || null;
  v23vRefreshVisor(true);
  return true;
}

/* -------------------------------------------------------------------------
   Arranque / montaje compatible con el catálogo V2.2 y el Agente 3
   ------------------------------------------------------------------------- */
function ensureWardrobePreview() {
  var engine = v23vEnsureEngine();
  try { wardrobe.preview = engine; } catch (e) {}
  return engine;
}
function mountWardrobePreview() {
  if (screen !== 'wardrobe') return;
  v23vMountVisor('wardrobePreviewMount', 'wardrobe');
}
function v22MountShopPreview() {
  v23vMountVisor('shopPreviewMount', 'shop');
}
function updateWardrobeAvatar() {
  var v = V23Visor;
  if (v.active && v.engine && v.engine.stage && v.engine.stage.isConnected) {
    v23vRefreshVisor(!v.engine.avatar);
    return;
  }
  if (screen === 'shop') v23vMountVisor('shopPreviewMount', 'shop');
  else if (screen === 'wardrobe') v23vMountVisor('wardrobePreviewMount', 'wardrobe');
}
function v22UpdateShopPreview() {
  V23Visor.pieceOverride = null;
  V23.preview.source = 'shop';
  if (screen !== 'shop') return;
  if (V23Visor.active && V23Visor.mountId === 'shopPreviewMount' && V23Visor.engine && V23Visor.engine.stage && V23Visor.engine.stage.isConnected) {
    v23vRefreshVisor(false);
  } else {
    v23vMountVisor('shopPreviewMount', 'shop');
  }
}
function v22FramePreview(avatar, category) {
  var v = V23Visor;
  if (avatar && v.engine && v.engine.avatar === avatar) {
    if (category) v.category = category;
    v23vFitCamera();
  }
}

/* Compatibilidad: el bucle principal llama a updateWardrobePreview(dt, time). */
function updateWardrobePreview(dt, time) {
  var v = V23Visor;
  var engine = v.engine;
  if (!v.active || !engine || !engine.avatar || engine.error) return;
  if (screen !== 'shop' && screen !== 'wardrobe') return;
  if (!engine.stage || !engine.stage.isConnected) return;
  var av = engine.avatar;
  if (v.needFit) { v23vFitCamera(); v.needFit = false; }
  var reduced = v23vReducedMotion();
  av.root.rotation.y = v.rotation;
  if (!reduced) {
    av.body.position.y = Math.sin(time * 1.4) * 0.012;
    av.head.rotation.y = Math.sin(time * 0.55) * 0.025 + 0.1;
    av.leftArm.rotation.z = 0.04 + Math.sin(time * 0.8) * 0.012;
    av.rightArm.rotation.z = -0.04 - Math.sin(time * 0.8) * 0.012;
    animateAvatarCosmetics(av, dt, time, false, 0);
  } else {
    av.body.position.y = 0;
    av.head.rotation.y = 0.1;
    av.leftArm.rotation.z = 0.04;
    av.rightArm.rotation.z = -0.04;
  }
  engine.renderer.render(engine.scene, engine.camera);
  v.frames += 1;
  var now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  if (v.lastFrameAt) {
    var delta = now - v.lastFrameAt;
    if (delta > 0.5) {
      var inst = 1000 / delta;
      v.fps = v.fps ? (v.fps * 0.9 + inst * 0.1) : inst;
    }
  }
  v.lastFrameAt = now;
}

/* -------------------------------------------------------------------------
   Redimensionado
   ------------------------------------------------------------------------- */
function v23vResize() {
  var v = V23Visor;
  var engine = v.engine;
  if (!engine || engine.error || !engine.stage) return;
  var w = engine.stage.clientWidth;
  var h = engine.stage.clientHeight;
  if (w < 2 || h < 2) return;
  var pr = Math.min(window.devicePixelRatio || 1, 1.5);
  try {
    engine.renderer.setPixelRatio(pr);
    engine.renderer.setSize(w, h, false);
  } catch (e) { return; }
  engine.camera.aspect = w / h;
  engine.camera.updateProjectionMatrix();
  v23vFitCamera();
  v23vRender();
}

/* -------------------------------------------------------------------------
   Interacción: arrastre, rueda, zoom, héroe
   ------------------------------------------------------------------------- */
document.addEventListener('pointerdown', function (event) {
  if (!V23Visor.active) return;
  var target = event.target && event.target.closest ? event.target.closest('.v23VisorStage') : null;
  if (!target) return;
  V23Visor.dragging = true;
  V23Visor.lastX = event.clientX;
  try { target.setPointerCapture(event.pointerId); } catch (e) {}
  target.classList.add('is-dragging');
  event.preventDefault();
});
document.addEventListener('pointermove', function (event) {
  if (!V23Visor.dragging) return;
  var dx = event.clientX - V23Visor.lastX;
  V23Visor.lastX = event.clientX;
  if (!dx) return;
  V23Visor.rotation += dx * 0.012;
  V23Visor.needFit = true;
  if (V23Visor.engine && V23Visor.engine.avatar) {
    V23Visor.engine.avatar.root.rotation.y = V23Visor.rotation;
    v23vRender();
  }
});
function v23vEndDrag() {
  if (!V23Visor.dragging) return;
  V23Visor.dragging = false;
  var stage = V23Visor.engine && V23Visor.engine.stage;
  if (stage) stage.classList.remove('is-dragging');
  V23Visor.needFit = true;
}
document.addEventListener('pointerup', v23vEndDrag);
document.addEventListener('pointercancel', v23vEndDrag);
document.addEventListener('wheel', function (event) {
  if (!V23Visor.active) return;
  var target = event.target && event.target.closest ? event.target.closest('.v23VisorStage') : null;
  if (!target) return;
  event.preventDefault();
  var factor = event.deltaY > 0 ? 0.92 : 1.08;
  v23vSetZoom(V23Visor.zoom * factor);
}, { passive: false });
document.addEventListener('click', function (event) {
  var target = event.target && event.target.closest ? event.target.closest('[data-v23-zoom], [data-v23-reset]') : null;
  if (!target) return;
  event.preventDefault();
  if (target.hasAttribute('data-v23-reset')) { v23vResetView(); return; }
  var dir = target.getAttribute('data-v23-zoom');
  v23vSetZoom(V23Visor.zoom * (dir === 'in' ? 1.12 : dir === 'out' ? 0.89 : 1));
});
document.addEventListener('change', function (event) {
  var target = event.target;
  if (!target || !target.matches || !target.matches('[data-v23-hero-select]')) return;
  v23vSetHero(target.value);
});
window.addEventListener('resize', v23vResize, { passive: true });
window.addEventListener('orientationchange', function () { window.setTimeout(v23vResize, 160); });

/* -------------------------------------------------------------------------
   API de QA  ·  window.__v23Visor
   ------------------------------------------------------------------------- */
function v23vProjectBox(box) {
  var engine = V23Visor.engine;
  if (!engine || !box || box.isEmpty()) return null;
  var camera = engine.camera;
  var corners = [];
  for (var xi = 0; xi < 2; xi++) {
    for (var yi = 0; yi < 2; yi++) {
      for (var zi = 0; zi < 2; zi++) {
        corners.push(new THREE.Vector3(xi ? box.max.x : box.min.x, yi ? box.max.y : box.min.y, zi ? box.max.z : box.min.z).project(camera));
      }
    }
  }
  var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  corners.forEach(function (p) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });
  var w = (maxX - minX) / 2;
  var h = (maxY - minY) / 2;
  return {
    x: Math.round(((minX + 1) / 2) * 1000) / 1000,
    y: Math.round(((1 - maxY) / 2) * 1000) / 1000,
    w: Math.round(w * 1000) / 1000,
    h: Math.round(h * 1000) / 1000,
    coverage: Math.round(Math.max(0, Math.min(1, w * h)) * 10000) / 10000,
    inside: minX >= -1.001 && maxX <= 1.001 && minY >= -1.001 && maxY <= 1.001
  };
}
function v23vInfo() {
  var v = V23Visor;
  var engine = v.engine;
  var piece = v23vSceneSelection(v.mode);
  var category = v.category;
  var avatar = engine && engine.avatar;
  var pieceBox = avatar && category ? v23vPieceBox(avatar, category) : null;
  var projected = pieceBox ? v23vProjectBox(pieceBox) : null;
  var canvas = engine && engine.canvas;
  var stage = engine && engine.stage;
  var effectVisible = !!(projected && projected.inside && projected.coverage > 0.0015);
  var heroBox = avatar && avatar.body ? new THREE.Box3().setFromObject(avatar.body) : null;
  var heroProjected = heroBox ? v23vProjectBox(heroBox) : null;
  return {
    version: v.version,
    screen: typeof screen !== 'undefined' ? screen : '',
    mode: v.mode,
    mounted: !!(engine && engine.stage && engine.stage.isConnected && engine.canvas && engine.canvas.parentNode === engine.stage),
    mountId: v.mountId,
    canvasId: v.canvasId,
    canvasIdentity: canvas ? canvas.getAttribute('data-v23-canvas-id') : null,
    rendererAlive: !!(engine && engine.renderer),
    canvas: canvas ? {
      bufferW: canvas.width,
      bufferH: canvas.height,
      cssW: stage ? Math.round(stage.clientWidth) : 0,
      cssH: stage ? Math.round(stage.clientHeight) : 0
    } : null,
    heroId: v.heroId,
    heroName: v23vHeroName(v.heroId),
    heroes: v23vHeroList(),
    category: category,
    slotLabel: v23vSlotLabel(category),
    pieceId: piece ? piece.id : null,
    pieceName: piece ? piece.name : null,
    rarity: piece ? cosmeticRarityKey(piece) : null,
    zoom: v.zoom,
    rotation: v.rotation,
    autoFrame: v.autoFrame,
    camera: v.cameraInfo,
    hero: {
      height: heroProjected ? heroProjected.h : null,
      projected: heroProjected
    },
    effect: {
      visible: effectVisible,
      projected: projected,
      measured: v.measureCache
    },
    fps: Math.round(v.fps),
    frames: v.frames,
    error: engine ? engine.error : 'no-engine'
  };
}
function v23vReadPixels(renderer) {
  var gl = renderer.getContext();
  var w = gl.drawingBufferWidth;
  var h = gl.drawingBufferHeight;
  var buf = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  return { buf: buf, w: w, h: h };
}
function v23vMeasure() {
  var v = V23Visor;
  var engine = v.engine;
  if (!engine || !engine.avatar) return { visible: false, reason: 'sin-visor' };
  var groups = [];
  engine.avatar.cosmetics.groups.forEach(function (g) {
    if (g.userData && g.userData.slot === v.category) groups.push(g);
  });
  if (!groups.length) return { visible: false, reason: 'sin-pieza', pixels: 0, coverage: 0 };
  var wasVisible = groups.map(function (g) { return g.visible; });
  try {
    groups.forEach(function (g) { g.visible = false; });
    v23vRender();
    var off = v23vReadPixels(engine.renderer);
    groups.forEach(function (g) { g.visible = true; });
    v23vRender();
    var on = v23vReadPixels(engine.renderer);
    var pixels = 0, total = 0, sum = 0, maxDelta = 0;
    var minX = on.w, minY = on.h, maxX = -1, maxY = -1;
    for (var i = 0; i < on.buf.length; i += 4) {
      var dr = Math.abs(on.buf[i] - off.buf[i]);
      var dg = Math.abs(on.buf[i + 1] - off.buf[i + 1]);
      var db = Math.abs(on.buf[i + 2] - off.buf[i + 2]);
      var d = dr + dg + db;
      if (d > 24) {
        pixels += 1;
        sum += d;
        if (d > maxDelta) maxDelta = d;
        var idx = i / 4;
        var px = idx % on.w;
        var py = Math.floor(idx / on.w);
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }
      total += 1;
    }
    var out = {
      visible: pixels > 40,
      pixels: pixels,
      coverage: Math.round((pixels / Math.max(1, total)) * 1000000) / 1000000,
      avgDelta: pixels ? Math.round((sum / pixels) * 10) / 10 : 0,
      maxDelta: maxDelta,
      w: on.w,
      h: on.h,
      bbox: pixels ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 } : null
    };
    v.measureCache = out;
    return out;
  } finally {
    groups.forEach(function (g, idx) { g.visible = wasVisible[idx]; });
    v23vRender();
  }
}
function v23vCatalog() {
  var wanted = ['efectos', 'marcos', 'estela', 'mascota', 'piernas', 'torso', 'cabeza', 'peinado', 'accesorios', 'amuletos', 'extras'];
  var out = {};
  wanted.forEach(function (category) {
    out[category] = ALL_COSMETICS.filter(function (c) { return c.category === category; }).map(function (c) {
      return { id: c.id, name: c.name, rarity: cosmeticRarityKey(c), owned: cosmeticOwned(c.id) };
    });
  });
  return out;
}
function v23vInstallQaApi() {
  window.__v23Visor = {
    version: V23Visor.version,
    openShop: function () {
      try { if (typeof openShop === 'function') openShop(); } catch (e) {}
      return v23vInfo();
    },
    openWardrobe: function (heroId) {
      try { if (typeof openWardrobe === 'function') openWardrobe(heroId); } catch (e) {}
      return v23vInfo();
    },
    close: function () {
      try { if (typeof closeSheet === 'function') closeSheet(); } catch (e) {}
      return v23vInfo();
    },
    select: function (id) { v23vSetPiece(id); return v23vInfo(); },
    clearSelect: function () { v23vSetPiece(null); return v23vInfo(); },
    hero: function (id) { v23vSetHero(id); return v23vInfo(); },
    heroes: function () { return v23vHeroList(); },
    zoom: function (value) { v23vSetZoom(value); return v23vInfo(); },
    reset: function () { v23vResetView(); return v23vInfo(); },
    refresh: function () { v23vRefreshVisor(true); return v23vInfo(); },
    info: function () { return v23vInfo(); },
    measure: function () { var m = v23vMeasure(); return { measure: m, info: v23vInfo() }; },
    catalog: function () { return v23vCatalog(); },
    fps: function () { return Math.round(V23Visor.fps * 10) / 10; },
    quality: function (q) {
      if (q !== 'bajo' && q !== 'medio' && q !== 'alto') return false;
      try { state.settings.effectsQuality = q; } catch (e) { return false; }
      v23vRefreshVisor(true);
      return true;
    },
    reducedMotion: function (on) {
      try {
        state.settings.reducedMotion = !!on;
        document.body.classList.toggle('reduced-motion', !!on);
      } catch (e) { return false; }
      v23vRefreshVisor(true);
      return true;
    },
    hideFrames: function (on) {
      try { state.settings.hide3dFrames = !!on; } catch (e) { return false; }
      v23vRefreshVisor(true);
      return true;
    },
    element: function () {
      var e = V23Visor.engine;
      return {
        canvasId: V23Visor.canvasId,
        stage: e && e.stage ? e.stage.className : null,
        mount: V23Visor.mountId
      };
    },
    tree: function () {
      var e = V23Visor.engine;
      if (!e || !e.avatar) return [];
      var list = [];
      e.avatar.cosmetics.groups.forEach(function (g) {
        g.traverse(function (n) {
          var b = new THREE.Box3().setFromObject(n);
          list.push({
            slot: g.userData.slot,
            id: g.userData.cosmeticId,
            type: n.type,
            name: n.name || '',
            worldY: Math.round(n.getWorldPosition(new THREE.Vector3()).y * 100) / 100,
            scale: n.scale.toArray().map(function (x) { return Math.round(x * 100) / 100; }),
            boxMin: b.min.toArray().map(function (x) { return Math.round(x * 100) / 100; }),
            boxMax: b.max.toArray().map(function (x) { return Math.round(x * 100) / 100; }),
            geo: n.geometry ? n.geometry.type : null
          });
        });
      });
      return list;
    }
  };
}

/* -------------------------------------------------------------------------
   Inicialización
   ------------------------------------------------------------------------- */
V23.flags.visorReady = true;
V23.preview.zoom = 1;
v23vInstallQaApi();
try {
  // El canvas debe mantener la identidad entre montajes y cambios de pieza.
  V23.preview.visorCanvasId = V23Visor.canvasId;
} catch (e) {}
