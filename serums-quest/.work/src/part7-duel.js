/* =========================================================================
   SERUMS QUEST · V2.1 · PARTE 7 — DUELO ADAPTATIVO (Agente 4)
   -------------------------------------------------------------------------
   Objetivo: que la pregunta y las alternativas nunca tapen a los personajes
   ni la animación de golpe, en móvil, tablet y escritorio.

   Qué hace:
   - Acopla el panel del duelo: abajo en vertical (máx. ~40 % de alto) y
     al costado derecho en horizontal (máx. ~38-40 % de ancho).
   - Reserva la zona máxima que el panel puede ocupar y encuadra la cámara
     (setViewOffset + zoom de proyección) dentro del área libre restante.
   - Contrae el panel a una barra mínima durante el golpe (~650 ms).
   - Respeta env(safe-area-inset-*) mediante una sonda de padding.
   - Recalcula en resize/orientación, sin allocations por frame.

   API pública (contrato de .work/v21/OWNERSHIP.md):
     V2.duel = {
       mount(), unmount(), onAttack(correct), afterCamera(dt, time),
       onDuelStart(areaId), onDuelEnd(), isActive(),
       // extras de inspección para QA (no los usa el juego):
       metrics(), refresh()
     }

   No reemplaza duelScreenHTML: mejora el DOM existente, añade una barra de
   ataque y clases en <body>. No toca part2-world, part3-ui ni part4-flow.
   ========================================================================= */
(function () {
  'use strict';

  var V2 = window.__SERUMS_V2__;
  if (!V2) return;

  /* ---- Constantes de diseño ------------------------------------------- */
  var ATTACK_MS = 650;          /* cubre los 600 ms del golpe del héroe y 450 ms del guardián */
  var RESERVE_RATIO = 0.40;     /* zona que el panel puede ocupar como máximo */
  var MIN_FREE_W = 150;         /* área libre mínima para no degenerar la cámara */
  var MIN_FREE_H = 130;
  var ZOOM_MIN = 0.30;
  var ZOOM_MAX = 1.90;
  var PANEL_MIN_H = 48;         /* altura de la barra de ataque */
  var LAYOUT_AFTER_ATTACK_MS = 260;

  var BODY_CLASSES = [
    'v2d-duel', 'v2d-portrait', 'v2d-landscape', 'v2d-dock-bottom', 'v2d-dock-side',
    'v2d-compact', 'v2d-tiny', 'v2d-large', 'v2d-short', 'v2d-touch', 'v2d-attacking',
    'v2d-feedback-open', 'v2d-hints-only', 'v2d-q-scroll'
  ];

  /* ---- Estado (una sola instancia; sin allocations por frame) --------- */
  var v2d = {
    active: false,
    mounted: false,
    ready: false,
    wrap: null,
    panel: null,
    bar: null,
    probe: null,
    W: 0,
    H: 0,
    safeTop: 0,
    safeRight: 0,
    safeBottom: 0,
    safeLeft: 0,
    topHud: 0,
    dock: 'bottom',
    compact: false,
    tiny: false,
    large: false,
    short: false,
    touch: false,
    free: { x: 0, y: 0, w: 0, h: 0 },
    panelW: 0,
    panelH: 0,
    appliedZoom: 1,
    appliedOx: 0,
    appliedOy: 0,
    baseW: 0,
    baseH: 0,
    fitZoom: 1,
    targetX: 0,
    targetY: 0,
    zoom: 1,
    zoomReady: false,
    tanFov: Math.tan(42 * Math.PI / 360),
    fovCached: 42,
    origZoom: 1,
    origZoomSaved: false,
    projDirty: false,
    pts: null,
    arenaX: 0,
    arenaZ: 0,
    attackUntil: 0,
    attackPending: false,
    attacking: false,
    attackCorrect: false,
    measureRaf: 0,
    layoutTimer: 0,
    resizeTimer: 0,
    listeners: false,
    areaId: '',
    errors: 0
  };

  /* ---- Utilidades ----------------------------------------------------- */
  function v2dError(scope, error) {
    if (v2d.errors >= 6) return;
    v2d.errors += 1;
    try {
      if (V2.softError) V2.softError('duel.' + scope, error);
      else if (window.console && console.warn) console.warn('[V2 duel:' + scope + ']', error);
    } catch (ignore) {}
  }
  function v2dNow() {
    try {
      if (V2.now) return V2.now();
    } catch (e) {}
    try {
      if (window.performance && performance.now) return performance.now();
    } catch (e2) {}
    return Date.now();
  }
  function v2dClamp(value, min, max) {
    var n = Number(value);
    if (!isFinite(n)) n = min;
    return Math.max(min, Math.min(max, n));
  }
  function v2dNum(value) {
    var n = parseFloat(value);
    return isFinite(n) ? n : 0;
  }
  function v2dBody() {
    return document.body || null;
  }
  function v2dSetClass(name, on) {
    var body = v2dBody();
    if (!body || !body.classList) return;
    if (on) body.classList.add(name);
    else body.classList.remove(name);
  }
  function v2dIsVisible(el) {
    if (!el) return false;
    try {
      var cs = window.getComputedStyle(el);
      if (!cs || cs.display === 'none' || cs.visibility === 'hidden') return false;
      var rect = el.getBoundingClientRect();
      return rect.width > 1 && rect.height > 1;
    } catch (e) {
      return false;
    }
  }
  function v2dGetCamera() {
    try {
      if (typeof camera !== 'undefined' && camera) return camera;
    } catch (e) {}
    try { return window.camera || null; } catch (e2) { return null; }
  }
  function v2dViewport() {
    var docEl = document.documentElement;
    var w = Number(window.innerWidth) || (docEl && docEl.clientWidth) || 1;
    var h = Number(window.innerHeight) || (docEl && docEl.clientHeight) || 1;
    return { w: Math.max(1, w), h: Math.max(1, h) };
  }

  /* ---- Sonda de safe-area (notch) ------------------------------------- */
  function v2dEnsureProbe() {
    if (v2d.probe && v2d.probe.isConnected) return v2d.probe;
    var body = v2dBody();
    if (!body) return null;
    var probe = document.createElement('div');
    probe.className = 'v2d-safe-probe';
    probe.setAttribute('aria-hidden', 'true');
    body.appendChild(probe);
    v2d.probe = probe;
    return probe;
  }
  function v2dReadSafe() {
    var probe = v2dEnsureProbe();
    if (!probe || !window.getComputedStyle) {
      v2d.safeTop = v2d.safeRight = v2d.safeBottom = v2d.safeLeft = 0;
      return;
    }
    try {
      var cs = window.getComputedStyle(probe);
      v2d.safeTop = Math.max(0, v2dNum(cs.paddingTop));
      v2d.safeRight = Math.max(0, v2dNum(cs.paddingRight));
      v2d.safeBottom = Math.max(0, v2dNum(cs.paddingBottom));
      v2d.safeLeft = Math.max(0, v2dNum(cs.paddingLeft));
    } catch (error) {
      v2d.safeTop = v2d.safeRight = v2d.safeBottom = v2d.safeLeft = 0;
    }
  }

  /* ---- Clasificación de layout --------------------------------------- */
  function v2dPickDock(W, H) {
    var landscape = W > H * 1.02;
    /* En apaisado, hoja lateral siempre que quepa una columna legible. El
       acople inferior se reserva para retrato (donde no hay ancho lateral).
       Esto evita que un móvil apaisado de ~828×295 gaste el 40 % del alto en
       un panel inferior que solo deja ver dos alternativas. */
    if (!landscape) return 'bottom';
    return W >= 520 && H >= 220 ? 'side' : 'bottom';
  }
  function v2dClassify(W, H, dock) {
    v2d.dock = dock;
    v2d.short = H < 520;
    v2d.touch = (function () {
      try { return !!V2.isTouch(); } catch (e) { return false; }
    })();
    if (dock === 'side') {
      v2d.compact = W < 1000 || H < 520;
      v2d.tiny = W < 760 || H < 380;
      v2d.large = W >= 1180 && H >= 700;
    } else {
      v2d.compact = W < 560 || H < 640;
      v2d.tiny = W < 350 || H < 430;
      v2d.large = false;
    }
  }

  /* ---- Layout ---------------------------------------------------------
     Reserva la huella máxima del panel y calcula el área libre real.
     La zona reservada no depende del contenido de cada pregunta, así la
     cámara no "baila" al cambiar de pregunta ni al abrir el feedback. */
  function v2dLayout() {
    try {
      if (!v2d.panel || !v2d.wrap || !v2d.panel.isConnected || !v2d.wrap.isConnected) return false;
      var body = v2dBody();
      if (!body) return false;

      var viewport = v2dViewport();
      var W = viewport.w;
      var H = viewport.h;
      var dock = v2dPickDock(W, H);
      v2dClassify(W, H, dock);
      v2dReadSafe();

      /* Clases de modo (nombres propios, no pisan body.text-large, etc.). */
      v2dSetClass('v2d-duel', true);
      v2dSetClass('v2d-portrait', dock === 'bottom');
      v2dSetClass('v2d-landscape', dock === 'side');
      v2dSetClass('v2d-dock-bottom', dock === 'bottom');
      v2dSetClass('v2d-dock-side', dock === 'side');
      v2dSetClass('v2d-compact', v2d.compact);
      v2dSetClass('v2d-tiny', v2d.tiny);
      v2dSetClass('v2d-large', v2d.large);
      v2dSetClass('v2d-short', v2d.short);
      v2dSetClass('v2d-touch', v2d.touch);

      /* Barra superior y HUD extra: el área libre empieza debajo de todo HUD. */
      var top = v2d.safeTop;
      var topBar = document.querySelector('.duelTop');
      if (topBar) {
        var barRect = topBar.getBoundingClientRect();
        if (barRect && barRect.bottom > top) top = barRect.bottom;
      }
      var extra = document.querySelector('.duelHudExtra');
      if (v2dIsVisible(extra)) {
        var extraRect = extra.getBoundingClientRect();
        if (extraRect && extraRect.bottom > top) top = extraRect.bottom;
      }
      v2d.topHud = Math.ceil(top + 6);
      v2d.wrap.style.setProperty('--v2d-top-hud', v2d.topHud + 'px');

      var bottomPad = Math.max(8, v2d.safeBottom) + 2;
      var maxPanelH = dock === 'side'
        ? Math.max(PANEL_MIN_H, Math.round(H - v2d.topHud - bottomPad - 6))
        : Math.round(H * RESERVE_RATIO);

      if (dock === 'side') {
        v2d.wrap.style.removeProperty('--v2d-panel-max-h');
      } else {
        v2d.wrap.style.setProperty('--v2d-panel-max-h', maxPanelH + 'px');
      }
      var fullSide = dock === 'side' && v2d.short;
      if (!v2d.attacking) {
        /* En lateral bajo (móvil apaisado) la hoja ocupa toda la altura
           disponible para que quepan las 4 alternativas. En el resto, la
           hoja se ajusta al contenido y se acopla abajo-derecha. */
        v2d.wrap.style.removeProperty('--v2d-panel-h');
        var natural = 0;
        if (fullSide) {
          natural = maxPanelH;
        } else {
          try { natural = v2d.panel.offsetHeight || 0; } catch (e) {}
          if (!natural) natural = Math.round(maxPanelH * 0.72);
          if (natural > maxPanelH) natural = maxPanelH;
        }
        v2d.wrap.style.setProperty('--v2d-panel-h', Math.max(PANEL_MIN_H, Math.round(natural)) + 'px');
      }

      /* Medidas reales del panel (para CSS, métricas y QA). */
      var wrapRect = null;
      var panelRect = null;
      try { wrapRect = v2d.wrap.getBoundingClientRect(); } catch (e) {}
      try { panelRect = v2d.panel.getBoundingClientRect(); } catch (e) {}
      if (panelRect) {
        v2d.panelW = Math.round(panelRect.width);
        v2d.panelH = Math.round(panelRect.height);
      }
      if (!wrapRect) wrapRect = { left: W, top: H, right: W, bottom: H, width: 0, height: 0 };

      /* Área libre: pantalla menos la zona reservada del panel. */
      var freeLeft = Math.max(0, v2d.safeLeft) + 8;
      var freeTop = v2d.topHud;
      var freeW;
      var freeH;
      if (dock === 'side') {
        var freeRight = wrapRect.left - 12;
        freeW = Math.max(MIN_FREE_W, freeRight - freeLeft);
        freeH = Math.max(MIN_FREE_H, H - bottomPad - 8 - freeTop);
      } else {
        var horizontalRight = W - Math.max(0, v2d.safeRight) - 8;
        freeW = Math.max(MIN_FREE_W, horizontalRight - freeLeft);
        /* La zona reservada incluye el 40 % del alto + padding + separación:
           el panel nunca puede invadir el área donde se encuadra el duelo. */
        var reserveBottom = H - (maxPanelH + bottomPad + 8);
        freeH = Math.max(MIN_FREE_H, reserveBottom - freeTop);
      }

      var oldW = v2d.free.w;
      var oldH = v2d.free.h;
      var hadLayout = v2d.ready;

      v2d.W = W;
      v2d.H = H;
      v2d.free.x = freeLeft;
      v2d.free.y = freeTop;
      v2d.free.w = freeW;
      v2d.free.h = freeH;
      v2d.ready = true;

      /* Reencuadre inmediato si cambió mucho el área (orientación/resize);
         entre preguntas la zona reservada es igual y no hay salto. */
      if (!hadLayout || Math.abs(freeW - oldW) > Math.max(24, oldW * 0.12) ||
          Math.abs(freeH - oldH) > Math.max(24, oldH * 0.12)) {
        v2d.zoomReady = false;
      }
      v2dUpdateScrollFlag();
      return true;
    } catch (error) {
      v2dError('layout', error);
      return false;
    }
  }

  /* ---- Puntos a encuadrar (héroe + guardián) --------------------------
     Caja envolvente conservadora en el mundo; se proyecta con la cámara
     actual. Se calcula una vez por duelo, sin allocations por frame. */
  function v2dEnsurePoints() {
    if (v2d.pts) return v2d.pts;
    try {
      if (typeof ARENA_POS === 'undefined' || !ARENA_POS) return null;
      if (typeof duelPositions === 'undefined' || !duelPositions) return null;
      var hero = duelPositions.hero;
      var guardian = duelPositions.guardian;
      if (!hero || !guardian) return null;
      var ax = Number(ARENA_POS.x) || 0;
      var az = Number(ARENA_POS.z) || 0;
      var x0 = ax + Math.min(hero.x, guardian.x) - 0.90;
      var x1 = ax + Math.max(hero.x, guardian.x) + 0.90;
      var y0 = 0.03;
      var y1 = 3.90;                 /* el guardián más alto mide 3.6 + corona */
      var z0 = az - 1.05;
      var z1 = az + 0.30;
      var xs = [x0, x1];
      var ys = [y0, y1];
      var zs = [z0, z1];
      var pts = new Array(24);
      var k = 0;
      for (var xi = 0; xi < 2; xi++) {
        for (var yi = 0; yi < 2; yi++) {
          for (var zi = 0; zi < 2; zi++) {
            pts[k++] = xs[xi];
            pts[k++] = ys[yi];
            pts[k++] = zs[zi];
          }
        }
      }
      v2d.arenaX = ax;
      v2d.arenaZ = az;
      v2d.pts = pts;
      return pts;
    } catch (error) {
      v2dError('points', error);
      return null;
    }
  }

  function v2dRestoreProjection(cam) {
    if (!cam) return;
    try {
      if (v2d.projDirty && cam.clearViewOffset) {
        cam.clearViewOffset();
        cam.zoom = v2d.origZoomSaved ? v2d.origZoom : 1;
        if (cam.updateProjectionMatrix) cam.updateProjectionMatrix();
      }
    } catch (error) {
      v2dError('restore', error);
    }
    v2d.projDirty = false;
    v2d.appliedZoom = 1;
    v2d.appliedOx = 0;
    v2d.appliedOy = 0;
  }

  /* ---- Encuadre de cámara ---------------------------------------------
     Proyecta la caja del duelo con la cámara "neutra" (sin offset, zoom 1),
     calcula el zoom que la encaja en el área libre y aplica setViewOffset
     para centrarla. placeCamera sigue mandando en posición y orientación. */
  function v2dApplyCamera(dt) {
    try {
      if (!v2d.active || !v2d.ready) return;
      var cam = v2dGetCamera();
      if (!cam || !cam.matrixWorldInverse || !cam.matrixWorldInverse.elements || !cam.setViewOffset) return;
      if (typeof cameraMode !== 'undefined' && cameraMode !== 'duel') {
        v2dRestoreProjection(cam);
        return;
      }

      var W = v2d.W;
      var H = v2d.H;
      if (!(W > 0) || !(H > 0)) return;

      if (!v2d.origZoomSaved) {
        v2d.origZoom = (typeof cam.zoom === 'number' && isFinite(cam.zoom)) ? cam.zoom : 1;
        v2d.origZoomSaved = true;
      }

      var aspect = W / H;
      if (Math.abs((Number(cam.aspect) || 0) - aspect) > 0.002) {
        cam.aspect = aspect;
        if (cam.updateProjectionMatrix) cam.updateProjectionMatrix();
      }

      if (cam.updateMatrixWorld) cam.updateMatrixWorld();
      var e = cam.matrixWorldInverse.elements;
      if (!e || e.length < 16) return;

      var pts = v2dEnsurePoints();
      if (!pts) return;

      /* Mientras la cámara viaja del atrio al duelo (los primeros frames),
         no encuadrar: la proyección neutra evita saltos y pop de zoom. */
      try {
        if (typeof ARENA_POS !== 'undefined' && ARENA_POS && cam.position) {
          var ddx = cam.position.x - ARENA_POS.x;
          var ddy = cam.position.y - 1.8;
          var ddz = cam.position.z - ARENA_POS.z;
          if (ddx * ddx + ddy * ddy + ddz * ddz > 45 * 45) {
            v2dRestoreProjection(cam);
            return;
          }
        }
      } catch (e) {}

      var fov = Number(cam.fov) || 42;
      if (fov !== v2d.fovCached) {
        v2d.fovCached = fov;
        v2d.tanFov = Math.tan(fov * Math.PI / 360);
      }
      var tanV = v2d.tanFov;
      var aspectCam = Number(cam.aspect) || aspect;
      if (!(tanV > 0)) return;

      var minPx = Infinity, maxPx = -Infinity, minPy = Infinity, maxPy = -Infinity;
      var behind = false;
      for (var i = 0; i < 24; i += 3) {
        var x = pts[i], y = pts[i + 1], z = pts[i + 2];
        var vx = e[0] * x + e[4] * y + e[8] * z + e[12];
        var vy = e[1] * x + e[5] * y + e[9] * z + e[13];
        var vz = e[2] * x + e[6] * y + e[10] * z + e[14];
        if (vz > -0.8 || !isFinite(vx) || !isFinite(vy)) { behind = true; break; }
        var inv = 1 / (-vz);
        var px = (vx * inv / (tanV * aspectCam) * 0.5 + 0.5) * W;
        var py = (0.5 - vy * inv / tanV * 0.5) * H;
        if (!isFinite(px) || !isFinite(py)) { behind = true; break; }
        if (px < minPx) minPx = px;
        if (px > maxPx) maxPx = px;
        if (py < minPy) minPy = py;
        if (py > maxPy) maxPy = py;
      }
      if (behind) {
        /* Durante la transición título/hub→duelo la cámara aún puede estar
           lejos: no encuadrar hasta tener el duelo delante. */
        v2dRestoreProjection(cam);
        return;
      }

      var baseW = maxPx - minPx;
      var baseH = maxPy - minPy;
      if (!(baseW > 4) || !(baseH > 4)) return;

      var free = v2d.free;
      var marginX = Math.max(10, free.w * 0.055);
      var marginY = Math.max(10, free.h * 0.070);
      var desiredW = Math.max(40, free.w - marginX * 2);
      var desiredH = Math.max(40, free.h - marginY * 2);
      var fit = Math.min(desiredW / baseW, desiredH / baseH);
      fit = v2dClamp(fit, ZOOM_MIN, ZOOM_MAX);

      if (!v2d.zoomReady) {
        v2d.zoom = fit;
        v2d.zoomReady = true;
      } else {
        var k = Math.min(1, Math.max(0, Number(dt) || 0) * 5);
        v2d.zoom += (fit - v2d.zoom) * k;
      }
      var z = v2dClamp(v2d.zoom, ZOOM_MIN, ZOOM_MAX);

      var baseCx = (minPx + maxPx) * 0.5;
      var baseCy = (minPy + maxPy) * 0.5;
      var targetX = free.x + free.w * 0.5;
      var targetY = free.y + free.h * (v2d.dock === 'side' ? 0.50 : 0.46);

      /* La proyección neutra tiene el centro de la vista en (W/2, H/2);
         al escalar por zoom el centro se desplaza alrededor de ese punto. */
      var centerX = W * 0.5 + (baseCx - W * 0.5) * z;
      var centerY = H * 0.5 + (baseCy - H * 0.5) * z;
      var ox = centerX - targetX;
      var oy = centerY - targetY;
      if (!isFinite(ox) || !isFinite(oy)) return;

      var view = cam.view;
      var needsUpdate = !view || !view.enabled ||
        Math.abs((Number(view.offsetX) || 0) - ox) > 0.35 ||
        Math.abs((Number(view.offsetY) || 0) - oy) > 0.35 ||
        Math.abs((Number(cam.zoom) || 1) - z) > 0.0004;
      if (needsUpdate) {
        cam.zoom = z;
        cam.setViewOffset(W, H, ox, oy, W, H);
        if (cam.updateProjectionMatrix) cam.updateProjectionMatrix();
        v2d.projDirty = true;
      }

      v2d.zoom = z;
      v2d.appliedZoom = z;
      v2d.appliedOx = ox;
      v2d.appliedOy = oy;
      v2d.baseW = baseW;
      v2d.baseH = baseH;
      v2d.fitZoom = fit;
      v2d.targetX = targetX;
      v2d.targetY = targetY;
    } catch (error) {
      v2dError('camera', error);
    }
  }

  /* ---- Barra de ataque ------------------------------------------------ */
  function v2dEnsureBar() {
    if (v2d.bar && v2d.bar.parentNode === v2d.panel) return v2d.bar;
    if (!v2d.panel) return null;
    var bar = document.createElement('div');
    bar.className = 'v2d-duel-bar';
    bar.setAttribute('role', 'status');
    bar.setAttribute('aria-live', 'polite');
    bar.setAttribute('aria-atomic', 'true');
    var dot = document.createElement('i');
    dot.className = 'v2d-duel-barDot';
    dot.setAttribute('aria-hidden', 'true');
    var text = document.createElement('span');
    text.textContent = 'Resolviendo el golpe…';
    bar.appendChild(dot);
    bar.appendChild(text);
    v2d.panel.appendChild(bar);
    v2d.bar = bar;
    return bar;
  }

  /* ---- Feedback dentro del panel ------------------------------------- */
  function v2dClassifyPanel() {
    if (!v2d.panel) return;
    var feedback = null;
    var foot = null;
    try {
      feedback = v2d.panel.querySelector('.feedbackStrip');
      foot = v2d.panel.querySelector('.duelFoot');
    } catch (e) {}
    v2dSetClass('v2d-feedback-open', !!feedback);
    var hintsOnly = false;
    if (foot) {
      var hasButton = false;
      try { hasButton = !!foot.querySelector('button'); } catch (e) {}
      hintsOnly = !feedback && !hasButton;
    }
    v2dSetClass('v2d-hints-only', hintsOnly);
    v2dUpdateScrollFlag();
  }
  function v2dUpdateScrollFlag() {
    if (!v2d.panel) return;
    var scrollable = false;
    try {
      var q = v2d.panel.querySelector('.questionText');
      scrollable = !!(q && q.scrollHeight > q.clientHeight + 2);
    } catch (e) {}
    v2dSetClass('v2d-q-scroll', scrollable);
  }

  /* ---- Ataque ---------------------------------------------------------
     La contracción se aplica después de medir el panel expandido, en el
     mismo tick del mount. Así el panel queda reducido desde el primer frame
     del golpe (la transición CSS de 130 ms termina antes de que el impacto
     recorra la arena). */
  function v2dScheduleLayout(delay) {
    if (v2d.layoutTimer) {
      try { window.clearTimeout(v2d.layoutTimer); } catch (e) {}
    }
    v2d.layoutTimer = window.setTimeout(function () {
      v2d.layoutTimer = 0;
      if (v2d.active) v2dLayout();
    }, delay == null ? 60 : delay);
  }

  /* ---- Listeners ------------------------------------------------------ */
  function v2dOnResize() {
    if (!v2d.active) return;
    v2dLayout();
    if (v2d.resizeTimer) {
      try { window.clearTimeout(v2d.resizeTimer); } catch (e) {}
    }
    v2d.resizeTimer = window.setTimeout(function () {
      v2d.resizeTimer = 0;
      if (v2d.active) v2dLayout();
    }, 140);
  }
  function v2dInstallListeners() {
    if (v2d.listeners) return;
    v2d.listeners = true;
    try {
      window.addEventListener('resize', v2dOnResize, { passive: true });
      window.addEventListener('orientationchange', v2dOnResize, { passive: true });
      if (window.visualViewport && window.visualViewport.addEventListener) {
        window.visualViewport.addEventListener('resize', v2dOnResize, { passive: true });
      }
    } catch (error) {
      v2dError('listeners', error);
    }
  }
  function v2dRemoveListeners() {
    if (!v2d.listeners) return;
    v2d.listeners = false;
    try {
      window.removeEventListener('resize', v2dOnResize);
      window.removeEventListener('orientationchange', v2dOnResize);
      if (window.visualViewport && window.visualViewport.removeEventListener) {
        window.visualViewport.removeEventListener('resize', v2dOnResize);
      }
    } catch (error) {
      v2dError('listeners.unmount', error);
    }
    if (v2d.resizeTimer) {
      try { window.clearTimeout(v2d.resizeTimer); } catch (e) {}
      v2d.resizeTimer = 0;
    }
  }

  /* ---- mount / unmount ------------------------------------------------ */
  function v2dMount() {
    try {
      if (!document.body) return;
      v2d.active = true;
      v2d.mounted = true;
      v2d.wrap = document.querySelector('.duelPanelWrap');
      v2d.panel = v2d.wrap ? v2d.wrap.querySelector('.duelPanel') : null;
      if (!v2d.panel) {
        v2d.active = false;
        return;
      }
      if (v2d.wrap.classList) v2d.wrap.classList.add('v2d-duel-wrap');
      if (v2d.panel.classList) v2d.panel.classList.add('v2d-duel-panel');

      v2dEnsureProbe();
      v2dEnsureBar();
      v2dClassifyPanel();
      v2dInstallListeners();

      var t = v2dNow();
      var startContraction = false;
      if (v2d.attackPending) {
        v2d.attackPending = false;
        if (!v2d.attackUntil || v2d.attackUntil < t + 80) v2d.attackUntil = t + ATTACK_MS;
        v2d.attacking = false;
        v2dSetClass('v2d-attacking', false);
        startContraction = true;
      } else if (v2d.attackUntil && t < v2d.attackUntil) {
        /* Re-render de la misma pregunta durante el golpe: mantener la
           contracción ya aplicada hasta que expire. */
      } else {
        v2d.attackUntil = 0;
        if (v2d.attacking) {
          v2d.attacking = false;
          v2dSetClass('v2d-attacking', false);
        }
      }

      v2dLayout();
      if (startContraction) {
        v2d.attacking = true;
        v2dSetClass('v2d-attacking', true);
      }

      /* Una segunda medida tras el primer paint corrige diferencias de
         fuentes/zoom del navegador; no se ejecuta durante la contracción. */
      if (v2d.measureRaf) {
        try { window.cancelAnimationFrame(v2d.measureRaf); } catch (e) {}
      }
      v2d.measureRaf = window.requestAnimationFrame(function () {
        v2d.measureRaf = 0;
        if (!v2d.active || v2d.attacking) return;
        v2dLayout();
      });
    } catch (error) {
      v2dError('mount', error);
      v2d.active = false;
    }
  }

  function v2dUnmount() {
    try {
      v2d.active = false;
      v2d.mounted = false;
      v2d.ready = false;
      v2d.attackPending = false;
      v2d.attackUntil = 0;
      v2d.attacking = false;
      v2d.attackCorrect = false;
      if (v2d.measureRaf) {
        try { window.cancelAnimationFrame(v2d.measureRaf); } catch (e) {}
        v2d.measureRaf = 0;
      }
      if (v2d.layoutTimer) {
        try { window.clearTimeout(v2d.layoutTimer); } catch (e) {}
        v2d.layoutTimer = 0;
      }
      v2dRemoveListeners();
      v2dSetClass('v2d-attacking', false);
      v2dSetClass('v2d-feedback-open', false);
      v2dSetClass('v2d-hints-only', false);
      for (var i = 0; i < BODY_CLASSES.length; i++) v2dSetClass(BODY_CLASSES[i], false);
      if (v2d.bar && v2d.bar.parentNode) {
        try { v2d.bar.parentNode.removeChild(v2d.bar); } catch (e) {}
      }
      v2d.bar = null;
      if (v2d.wrap) {
        try {
          v2d.wrap.style.removeProperty('--v2d-top-hud');
          v2d.wrap.style.removeProperty('--v2d-panel-h');
          v2d.wrap.style.removeProperty('--v2d-panel-max-h');
        } catch (e) {}
        if (v2d.wrap.classList) {
          v2d.wrap.classList.remove('v2d-duel-wrap');
        }
      }
      if (v2d.panel && v2d.panel.classList) v2d.panel.classList.remove('v2d-duel-panel');
      if (v2d.probe && v2d.probe.parentNode) {
        try { v2d.probe.parentNode.removeChild(v2d.probe); } catch (e) {}
      }
      v2d.probe = null;
      var cam = v2dGetCamera();
      v2dRestoreProjection(cam);
      v2d.origZoomSaved = false;
      v2d.wrap = null;
      v2d.panel = null;
      v2d.pts = null;
      v2d.free.x = v2d.free.y = v2d.free.w = v2d.free.h = 0;
      v2d.W = 0;
      v2d.H = 0;
      v2d.topHud = 0;
      v2d.zoom = 1;
      v2d.zoomReady = false;
      v2d.baseW = 0;
      v2d.baseH = 0;
      v2d.panelW = 0;
      v2d.panelH = 0;
      v2d.errors = 0;
      v2d.areaId = '';
    } catch (error) {
      v2dError('unmount', error);
    }
  }

  /* ---- API pública ---------------------------------------------------- */
  function v2dMetrics() {
    var out = {
      version: '2.1.0-agent4',
      active: !!v2d.active,
      ready: !!v2d.ready,
      dock: v2d.dock,
      viewport: { w: v2d.W, h: v2d.H },
      safe: { top: v2d.safeTop, right: v2d.safeRight, bottom: v2d.safeBottom, left: v2d.safeLeft },
      topHud: v2d.topHud,
      classes: { compact: v2d.compact, tiny: v2d.tiny, large: v2d.large, short: v2d.short, touch: v2d.touch },
      panel: null,
      free: { x: v2d.free.x, y: v2d.free.y, w: v2d.free.w, h: v2d.free.h },
      camera: {
        zoom: v2d.appliedZoom,
        fitZoom: v2d.fitZoom,
        offsetX: v2d.appliedOx,
        offsetY: v2d.appliedOy,
        baseW: v2d.baseW,
        baseH: v2d.baseH,
        targetX: v2d.targetX,
        targetY: v2d.targetY,
        dirty: v2d.projDirty
      },
      attack: {
        active: v2d.attacking,
        pending: v2d.attackPending,
        remainingMs: v2d.attackUntil ? Math.max(0, Math.round(v2d.attackUntil - v2dNow())) : 0
      },
      reserve: {
        ratio: RESERVE_RATIO,
        heightPx: Math.round(v2d.H * RESERVE_RATIO)
      }
    };
    try {
      if (v2d.panel) {
        var rect = v2d.panel.getBoundingClientRect();
        out.panel = {
          w: Math.round(rect.width),
          h: Math.round(rect.height),
          hPct: v2d.H ? Math.round(rect.height / v2d.H * 1000) / 10 : 0,
          wPct: v2d.W ? Math.round(rect.width / v2d.W * 1000) / 10 : 0,
          overflow: v2d.panel.scrollHeight > v2d.panel.clientHeight + 1
        };
      }
    } catch (e) {}
    return out;
  }

  var api = {
    mount: v2dMount,
    unmount: v2dUnmount,
    onAttack: function (correct) {
      if (!v2d.active || !v2d.panel) return;
      v2d.attackCorrect = !!correct;
      /* La contracción empieza en el mismo tick del ataque: el panel ya está
         medido y el área reservada no depende de su altura, así que aplicar
         la clase aquí no mueve la cámara. Antes se esperaba al siguiente
         mount (la pregunta siguiente) y el golpe quedaba sin contracción. */
      v2d.attackPending = false;
      v2d.attackUntil = v2dNow() + ATTACK_MS;
      v2d.attacking = true;
      v2dSetClass('v2d-attacking', true);
    },
    afterCamera: function (dt, time) {
      if (!v2d.active) return;
      var viewport = v2dViewport();
      if (viewport.w !== v2d.W || viewport.h !== v2d.H) v2dLayout();
      if (!v2d.panel || !v2d.panel.isConnected) {
        v2dUnmount();
        return;
      }
      if (v2d.attacking && v2d.attackUntil && v2dNow() >= v2d.attackUntil) {
        v2d.attacking = false;
        v2d.attackUntil = 0;
        v2dSetClass('v2d-attacking', false);
        v2dScheduleLayout(LAYOUT_AFTER_ATTACK_MS);
      }
      v2dApplyCamera(dt);
    },
    onDuelStart: function (areaId) {
      v2d.areaId = areaId ? String(areaId) : '';
      v2d.attackUntil = 0;
      v2d.attackPending = false;
      v2d.attacking = false;
      v2d.pts = null;
      v2d.zoomReady = false;
      v2dSetClass('v2d-attacking', false);
    },
    onDuelEnd: function () {
      v2dUnmount();
    },
    isActive: function () {
      return !!v2d.active;
    },
    metrics: v2dMetrics,
    refresh: function () {
      if (!v2d.active) return false;
      return v2dLayout();
    }
  };

  try {
    if (typeof V2.register === 'function') V2.register('duel', api);
    else V2.duel = api;
  } catch (error) {
    v2dError('register', error);
  }
})();
