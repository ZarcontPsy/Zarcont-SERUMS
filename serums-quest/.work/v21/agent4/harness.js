/* Harness del Agente 4 — carga el part7-duel.js real con una cámara three.js
   real y un DOM de duelo representativo. Dibuja en 2D el encuadre calculado
   para que las capturas muestren panel + cámara sin necesidad de WebGL. */
(function () {
  'use strict';

  var H = window.__H = window.__H || {};
  var screenEl = document.getElementById('screen');
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  var last = performance.now();
  var loopFrames = 0;

  /* ---------- Markup de duelo (fiel a duelScreenHTML) ---------- */
  var ICONS = {
    coin: '<svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 4.6v6.8M6.2 6.3h2.9a1.2 1.2 0 0 1 0 2.4H6.8a1.2 1.2 0 0 0 0 2.4h3" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
    pause: '<svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><rect x="4" y="3" width="2.6" height="10" rx="1" fill="currentColor"/><rect x="9.4" y="3" width="2.6" height="10" rx="1" fill="currentColor"/></svg>',
    user: '<svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="5" r="2.6" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M3.4 13c.5-2.6 2.3-4 4.6-4s4.1 1.4 4.6 4" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
    flag: '<svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2v12M4 3h7l-1.6 2.4L11 8H4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
    star: '<svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true"><path d="m8 2 1.7 3.7 4 .5-3 2.8.8 4-3.5-2-3.5 2 .8-4-3-2.8 4-.5Z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>',
    chevron: '<svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  function heart(empty) {
    return '<svg width="15" height="13" viewBox="0 0 18 16" aria-hidden="true" class="' + (empty ? 'is-empty' : '') + '"><path d="M9 14S2 9.7 2 5.5A3.5 3.5 0 0 1 9 3a3.5 3.5 0 0 1 7 2.5C16 9.7 9 14 9 14Z" fill="' + (empty ? 'none' : 'currentColor') + '" stroke="currentColor" stroke-width="1.2"/></svg>';
  }

  var STEMS = {
    short: 'La participación comunitaria en salud pública se define principalmente como:',
    long: 'En el marco de los determinantes sociales de la salud, un equipo de atención primaria identifica que un barrio periurbano presenta una alta prevalencia de infecciones respiratorias. Antes de diseñar una intervención, el equipo necesita priorizar el factor que más contribuye a la inequidad observada. ¿Cuál de las siguientes acciones corresponde mejor a un enfoque de determinantes sociales?',
    max: 'En el marco de los determinantes sociales de la salud, un equipo de atención primaria identifica que un barrio periurbano presenta una alta prevalencia de infecciones respiratorias, baja cobertura de vacunación y dificultades de acceso al agua potable. El equipo dispone de recursos limitados y debe decidir cómo iniciar una intervención intersectorial con el municipio, la escuela y las organizaciones vecinales. Antes de diseñar el plan, necesita priorizar el factor que más contribuye a la inequidad observada y justificar la decisión con evidencia local. ¿Cuál de las siguientes acciones corresponde mejor a un enfoque de determinantes sociales y participación comunitaria?'
  };
  /* Longitudes reales del banco: mediana 16, p90 34, máximo 59 caracteres. */
  var OPTIONS = [
    'Aplicar una campaña masiva sin consultar a la comunidad.',
    'Coordinar con la escuela y las organizaciones vecinales.',
    'Derivar todos los casos al hospital de referencia.',
    'Esperar el plan del municipio antes de intervenir.'
  ];
  /* Estrés: opciones más largas que cualquier opción real del banco. */
  var LONG_OPTIONS = [
    'Aplicar una campaña masiva de vacunación sin consultar a la comunidad ni a las organizaciones del barrio.',
    'Coordinar con la escuela y las organizaciones vecinales para mejorar el acceso al agua y la ventilación de las viviendas.',
    'Derivar todos los casos al hospital de referencia y cerrar el puesto de salud del barrio durante el invierno.',
    'Esperar a que el municipio presente un plan antes de intervenir y documentar la situación mientras tanto.'
  ];

  function answersMarkup(list) {
    var html = '';
    for (var i = 0; i < list.length; i++) {
      html += '<button type="button" class="answerBtn" data-action="answer" data-letter="' + 'ABCD'[i] + '">' +
        '<span class="answerKey">' + 'ABCD'[i] + '</span><span>' + list[i] + '</span></button>';
    }
    return html;
  }
  function hintsMarkup() {
    return '<div class="duelFoot">' +
      '<span class="hint"><kbd>A</kbd><kbd>B</kbd><kbd>C</kbd><kbd>D</kbd> responder · <kbd>Esc</kbd> pausa</span>' +
      '<span class="hint" style="margin-left:auto">El golpe depende de tu criterio</span>' +
    '</div>';
  }
  function feedbackMarkup() {
    return '<div class="duelFoot"><div class="feedbackStrip is-correct">' +
      '<span class="feedbackIcon">' + ICONS.star + '</span>' +
      '<span class="feedbackText"><b>Impacto certero.</b><span>+12 XP · +1 moneda · Clave: B. La coordinación intersectorial con la escuela y las organizaciones vecinales aborda el acceso al agua y la ventilación, dos determinantes sociales estructurales. La campaña masiva sin consulta no modifica el entorno y la derivación únicamente traslada la carga al hospital.</span></span>' +
      '<button type="button" class="btn btn--primary nextBtn" data-action="next-question">Siguiente pregunta ' + ICONS.chevron + '</button>' +
    '</div></div>';
  }

  function duelMarkup(opts) {
    opts = opts || {};
    var variant = opts.variant || 'question'; // question | feedback | emptyFoot
    var stem = STEMS[opts.stem || 'long'];
    var options = opts.longOptions ? LONG_OPTIONS : OPTIONS;
    var foot = variant === 'feedback' ? feedbackMarkup() : (variant === 'emptyFoot' ? '' : hintsMarkup());
    var dots = '';
    for (var i = 0; i < 10; i++) dots += '<span class="qDot ' + (i < 2 ? 'is-done' : '') + (i === 2 ? ' is-current' : '') + '"></span>';
    return '<div class="duelTop">' +
        '<div class="duelChip" style="--accent:#7aa2ff"><span class="areaGlyph">✦</span><div><small>Ruta del Territorio · Custodio del Territorio · 3/10</small><b>Salud pública y determinantes sociales</b></div></div>' +
        '<div class="duelHearts"><span class="hudResource duelCoins" title="Monedas">' + ICONS.coin + '<b>1 240</b></span>' +
          '<span class="modeTimer" data-mode-timer><b>12:34</b><small>restante</small></span>' +
          '<div class="heartRow">' + heart(false) + heart(false) + heart(true) + '</div>' +
          '<div class="duelProgress"><div class="qDots">' + dots + '</div></div>' +
          '<button type="button" class="iconBtn" data-action="open-pause" title="Pausa">' + ICONS.pause + '</button></div>' +
      '</div>' +
      '<div class="duelHudExtra"><span>' + ICONS.user + ' <b>Ilan Vega</b> «Cartógrafo»</span><span>Nv <b>24</b> · 12 480 XP</span><span>Precisión del duelo <b>78%</b></span><span>' + ICONS.coin + ' <b>1 240</b></span></div>' +
      '<div class="duelStatus">Custodio del Territorio · Duelo de criterio · Pregunta 3 de 10</div>' +
      '<div class="duelPanelWrap"><section class="duelPanel" style="--accent:#7aa2ff">' +
        '<div class="duelPanelHead"><span class="qCategory">Salud pública y determinantes sociales · Territorio</span>' +
          '<span class="chip chip--generated" title="Pregunta pedagógica generada desde una ficha del dashboard">Generada · ficha</span>' +
          '<span class="tagButtons tagButtons--compact"><button type="button" class="tagBtn" title="Marcar como difícil">' + ICONS.flag + ' Difícil</button><button type="button" class="tagBtn" title="Marcar como favorita">' + ICONS.star + ' Favorita</button></span>' +
          '<span class="qSource">Psicología · SERUMS 2024-I · p. 42</span></div>' +
        '<div class="duelPanelBody"><p class="questionText">' + stem + '</p>' +
          '<div class="answers">' + answersMarkup(options) + '</div>' + foot +
        '</div>' +
      '</section></div>';
  }

  /* ---------- Montaje / medición ---------- */
  function mount(markup) {
    screenEl.innerHTML = markup;
    cameraMode = 'duel';
    if (V2.duel && V2.duel.mount) V2.duel.mount();
  }
  function replace(markup) {
    /* Igual que renderScreen('duel') tras answerCurrent. */
    screenEl.innerHTML = markup;
    if (V2.duel && V2.duel.mount) V2.duel.mount();
  }

  function project(x, y, z) {
    var v = new THREE.Vector3(x, y, z);
    v.project(camera);
    return {
      x: (v.x * 0.5 + 0.5) * window.innerWidth,
      y: (0.5 - v.y * 0.5) * window.innerHeight,
      z: v.z
    };
  }

  function pairBox() {
    var ax = ARENA_POS.x, az = ARENA_POS.z;
    var x0 = ax + Math.min(duelPositions.hero.x, duelPositions.guardian.x) - 0.90;
    var x1 = ax + Math.max(duelPositions.hero.x, duelPositions.guardian.x) + 0.90;
    var y0 = 0.03, y1 = 3.90, z0 = az - 1.05, z1 = az + 0.30;
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    var xs = [x0, x1], ys = [y0, y1], zs = [z0, z1];
    for (var i = 0; i < 2; i++) {
      for (var j = 0; j < 2; j++) {
        for (var k = 0; k < 2; k++) {
          var p = project(xs[i], ys[j], zs[k]);
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        }
      }
    }
    return { minX: minX, maxX: maxX, minY: minY, maxY: maxY };
  }

  function characterBox(x, z, height) {
    var feet = project(x, 0.04, z);
    var head = project(x, height, z);
    var left = project(x - 0.42, height * 0.55, z);
    var right = project(x + 0.42, height * 0.55, z);
    return {
      feet: feet, head: head,
      minX: Math.min(left.x, right.x),
      maxX: Math.max(left.x, right.x),
      top: Math.min(head.y, feet.y),
      bottom: Math.max(head.y, feet.y)
    };
  }

  function measure() {
    var m = (V2.duel && V2.duel.metrics) ? V2.duel.metrics() : null;
    var box = pairBox();
    var hero = characterBox(ARENA_POS.x + duelPositions.hero.x, ARENA_POS.z + duelPositions.hero.z, 2.05);
    var guardian = characterBox(ARENA_POS.x + duelPositions.guardian.x, ARENA_POS.z + duelPositions.guardian.z, 3.6);
    var free = m ? m.free : { x: 0, y: 0, w: 0, h: 0 };
    var panelRect = null;
    var panelEl = document.querySelector('.duelPanel');
    if (panelEl) panelRect = panelEl.getBoundingClientRect();
    var answerEls = document.querySelectorAll('.answerBtn');
    var bodyEl = document.querySelector('.duelPanelBody');
    var allAnswersVisible = answerEls.length > 0;
    var bodyRect = bodyEl ? bodyEl.getBoundingClientRect() : null;
    var answerRects = [];
    for (var ai = 0; ai < answerEls.length; ai++) {
      var ar = answerEls[ai].getBoundingClientRect();
      answerRects.push({ top: Math.round(ar.top), bottom: Math.round(ar.bottom), h: Math.round(ar.height) });
      if (!bodyRect || ar.top < bodyRect.top - 1 || ar.bottom > bodyRect.bottom + 1) allAnswersVisible = false;
    }
    return {
      ok: !!(m && m.active),
      metrics: m,
      bodyClass: document.body.className,
      coarse: !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches),
      rotateDisplay: (function () {
        var el = document.getElementById('rotatePrompt');
        return el ? window.getComputedStyle(el).display : null;
      })(),
      viewport: { w: window.innerWidth, h: window.innerHeight },
      panel: panelRect ? {
        left: Math.round(panelRect.left), top: Math.round(panelRect.top),
        right: Math.round(panelRect.right), bottom: Math.round(panelRect.bottom),
        w: Math.round(panelRect.width), h: Math.round(panelRect.height),
        hPct: Math.round(panelRect.height / window.innerHeight * 1000) / 10,
        wPct: Math.round(panelRect.width / window.innerWidth * 1000) / 10,
        areaPct: Math.round(panelRect.width * panelRect.height / (window.innerWidth * window.innerHeight) * 1000) / 10
      } : null,
      pair: {
        minX: Math.round(box.minX), maxX: Math.round(box.maxX),
        minY: Math.round(box.minY), maxY: Math.round(box.maxY),
        w: Math.round(box.maxX - box.minX), h: Math.round(box.maxY - box.minY),
        fitsX: box.minX >= free.x - 0.6 && box.maxX <= free.x + free.w + 0.6,
        fitsY: box.minY >= free.y - 0.6 && box.maxY <= free.y + free.h + 0.6,
        marginLeft: Math.round(box.minX - free.x),
        marginRight: Math.round(free.x + free.w - box.maxX),
        marginTop: Math.round(box.minY - free.y),
        marginBottom: Math.round(free.y + free.h - box.maxY)
      },
      answers: {
        count: answerEls.length,
        allVisible: allAnswersVisible,
        bodyScrollTop: bodyEl ? bodyEl.scrollTop : null,
        bodyScrollH: bodyEl ? bodyEl.scrollHeight : null,
        bodyClientH: bodyEl ? bodyEl.clientHeight : null,
        rects: answerRects
      },
      characters: {
        hero: {
          x: Math.round((hero.minX + hero.maxX) / 2),
          top: Math.round(hero.top), bottom: Math.round(hero.bottom),
          height: Math.round(hero.bottom - hero.top),
          inside: hero.minX >= free.x - 1 && hero.maxX <= free.x + free.w + 1 && hero.top >= free.y - 1
        },
        guardian: {
          x: Math.round((guardian.minX + guardian.maxX) / 2),
          top: Math.round(guardian.top), bottom: Math.round(guardian.bottom),
          height: Math.round(guardian.bottom - guardian.top),
          inside: guardian.minX >= free.x - 1 && guardian.maxX <= free.x + free.w + 1 && guardian.top >= free.y - 1
        }
      }
    };
  }

  /* ---------- Escena 2D de depuración ---------- */
  function resizeCanvas() {
    var w = window.innerWidth, h = window.innerHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawCapsule(x, z, height, color, label) {
    var feet = project(x, 0.04, z);
    var head = project(x, height, z);
    var left = project(x - 0.44, height * 0.55, z);
    var right = project(x + 0.44, height * 0.55, z);
    var width = Math.max(6, Math.abs(right.x - left.x));
    var top = Math.min(head.y, feet.y);
    var bottom = Math.max(head.y, feet.y);
    var cx = (feet.x + head.x) / 2;
    var g = ctx.createRadialGradient(cx, (top + bottom) / 2, 2, cx, (top + bottom) / 2, Math.max(18, width));
    g.addColorStop(0, color + 'cc');
    g.addColorStop(0.55, color + '44');
    g.addColorStop(1, color + '00');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, (top + bottom) / 2, Math.max(18, width * 0.95), Math.max(18, (bottom - top) * 0.55), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.82;
    var r = Math.min(width / 2, 26);
    var x0 = cx - width / 2;
    var y0 = top + r;
    var y1 = bottom - r;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.arcTo(x0, top, x0 + r, top, r);
    ctx.lineTo(x0 + width - r, top);
    ctx.arcTo(x0 + width, top, x0 + width, y0, r);
    ctx.lineTo(x0 + width, y1);
    ctx.arcTo(x0 + width, bottom, x0 + width - r, bottom, r);
    ctx.lineTo(x0 + r, bottom);
    ctx.arcTo(x0, bottom, x0, y1, r);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f2f0ea';
    ctx.font = '600 9px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, top - 8);
  }

  function drawDebug() {
    resizeCanvas();
    var W = window.innerWidth, H = window.innerHeight;
    ctx.clearRect(0, 0, W, H);

    /* Arena proyectada. */
    var pts = [];
    for (var i = 0; i <= 32; i++) {
      var a = i / 32 * Math.PI * 2;
      pts.push(project(ARENA_POS.x + Math.cos(a) * 6.3, 0.02, ARENA_POS.z + Math.sin(a) * 6.3));
    }
    ctx.beginPath();
    for (var p = 0; p < pts.length; p++) {
      if (p === 0) ctx.moveTo(pts[p].x, pts[p].y);
      else ctx.lineTo(pts[p].x, pts[p].y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(122,162,255,0.055)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(122,162,255,0.22)';
    ctx.lineWidth = 1;
    ctx.stroke();

    drawCapsule(ARENA_POS.x + duelPositions.hero.x, ARENA_POS.z + duelPositions.hero.z, 2.05, '#7aa2ff', 'HÉROE');
    drawCapsule(ARENA_POS.x + duelPositions.guardian.x, ARENA_POS.z + duelPositions.guardian.z, 3.6, '#c49bff', 'GUARDIÁN');

    var m = V2.duel.metrics();
    if (m && m.ready) {
      var f = m.free;
      /* Área libre. */
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(105,211,193,0.55)';
      ctx.strokeRect(f.x + 0.5, f.y + 0.5, f.w - 1, f.h - 1);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(105,211,193,0.75)';
      ctx.font = '600 8px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('ÁREA LIBRE', f.x + 7, f.y + 12);
      /* Límite de la zona reservada al panel. */
      if (m.dock === 'bottom') {
        ctx.setLineDash([3, 5]);
        ctx.strokeStyle = 'rgba(243,181,98,0.55)';
        ctx.beginPath();
        ctx.moveTo(0, f.y + f.h + 0.5);
        ctx.lineTo(W, f.y + f.h + 0.5);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(243,181,98,0.8)';
        ctx.fillText('RESERVA PANEL 40%', 8, f.y + f.h - 6);
      } else {
        ctx.setLineDash([3, 5]);
        ctx.strokeStyle = 'rgba(243,181,98,0.55)';
        ctx.beginPath();
        ctx.moveTo(f.x + f.w + 0.5, f.y);
        ctx.lineTo(f.x + f.w + 0.5, f.y + f.h);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      /* Punto de mira. */
      if (m.camera.targetX && m.camera.targetY) {
        ctx.strokeStyle = 'rgba(255,139,157,0.8)';
        ctx.beginPath();
        ctx.moveTo(m.camera.targetX - 7, m.camera.targetY);
        ctx.lineTo(m.camera.targetX + 7, m.camera.targetY);
        ctx.moveTo(m.camera.targetX, m.camera.targetY - 7);
        ctx.lineTo(m.camera.targetX, m.camera.targetY + 7);
        ctx.stroke();
      }
    }
  }

  /* ---------- Bucle ---------- */
  function frame(now) {
    var dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    try {
      placeCameraLikeGame(dt);
      if (V2.duel && V2.duel.afterCamera) V2.duel.afterCamera(dt, now / 1000);
      drawDebug();
      loopFrames++;
    } catch (error) {
      console.error('[harness]', error);
    }
    window.requestAnimationFrame(frame);
  }

  /* ---------- API para el runner CDP ---------- */
  H.prepare = function () {
    setFinalDuelCamera();
    mount(duelMarkup({ variant: 'question', stem: 'long' }));
    return new Promise(function (resolve) {
      window.setTimeout(function () { resolve(measure()); }, 550);
    });
  };
  H.setStem = function (stemKey) {
    mount(duelMarkup({ variant: 'question', stem: stemKey }));
    return new Promise(function (resolve) {
      window.setTimeout(function () { resolve(measure()); }, 400);
    });
  };
  H.setLongOptions = function () {
    mount(duelMarkup({ variant: 'question', stem: 'long', longOptions: true }));
    return new Promise(function (resolve) {
      window.setTimeout(function () { resolve(measure()); }, 400);
    });
  };
  H.measure = measure;
  H.beginAttack = function () {
    var before = measure();
    if (V2.duel) V2.duel.onAttack(true);
    replace(duelMarkup({ variant: 'feedback', stem: 'long' }));
    return before;
  };
  H.attackDuring = function (ms) {
    return new Promise(function (resolve) {
      window.setTimeout(function () { resolve(measure()); }, ms || 260);
    });
  };
  H.attackAfter = function () {
    return new Promise(function (resolve) {
      window.setTimeout(function () { resolve(measure()); }, 620);
    });
  };
  H.nextQuestion = function () {
    mount(duelMarkup({ variant: 'question', stem: 'max' }));
    return new Promise(function (resolve) {
      window.setTimeout(function () { resolve(measure()); }, 500);
    });
  };
  H.safeArea = function (top, right, bottom, left) {
    var id = '__safeOverride';
    var style = document.getElementById(id);
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      document.head.appendChild(style);
    }
    var t = Math.max(0, Number(top) || 0);
    var r = Math.max(0, Number(right) || 0);
    var b = Math.max(0, Number(bottom) || 0);
    var l = Math.max(0, Number(left) || 0);
    style.textContent =
      '.v2d-safe-probe{padding:' + t + 'px ' + r + 'px ' + b + 'px ' + l + 'px !important}' +
      'body.v2d-duel .duelTop{padding-top:max(13px,' + (t + 6) + 'px);padding-right:max(18px,' + (r + 12) + 'px);padding-left:max(18px,' + (l + 12) + 'px)}' +
      'body.v2d-duel.v2d-compact .duelTop{padding-top:max(8px,' + (t + 4) + 'px);padding-right:max(10px,' + (r + 8) + 'px);padding-left:max(10px,' + (l + 8) + 'px)}' +
      'body.v2d-duel.v2d-dock-bottom .duelPanelWrap{padding-right:max(8px,' + r + 'px);padding-bottom:calc(max(8px,' + b + 'px) + 2px);padding-left:max(8px,' + l + 'px)}' +
      'body.v2d-duel.v2d-dock-side .duelPanelWrap{padding-right:max(8px,' + r + 'px);padding-bottom:calc(max(8px,' + b + 'px) + 2px)}';
    if (V2.duel && V2.duel.refresh) V2.duel.refresh();
    return measure();
  };
  H.clearSafeArea = function () {
    var style = document.getElementById('__safeOverride');
    if (style) style.parentNode.removeChild(style);
    if (V2.duel && V2.duel.refresh) V2.duel.refresh();
    return measure();
  };
  H.unmountTest = function () {
    var before = {
      active: V2.duel.isActive(),
      zoom: camera.zoom,
      view: !!(camera.view && camera.view.enabled),
      body: document.body.className,
      panelH: document.querySelector('.duelPanel') ? Math.round(document.querySelector('.duelPanel').getBoundingClientRect().height) : null
    };
    V2.duel.unmount();
    var after = {
      active: V2.duel.isActive(),
      zoom: camera.zoom,
      view: !!(camera.view && camera.view.enabled),
      body: document.body.className,
      panelH: document.querySelector('.duelPanel') ? Math.round(document.querySelector('.duelPanel').getBoundingClientRect().height) : null
    };
    V2.duel.mount();
    return new Promise(function (resolve) {
      window.setTimeout(function () {
        var remounted = measure();
        resolve({ before: before, after: after, remounted: remounted });
      }, 450);
    });
  };
  H.intro = function () {
    window.duelCamIntro = 0;
    camera.position.set(ARENA_POS.x + 0.7, 12.2, ARENA_POS.z + 14);
    camera.lookAt(ARENA_POS.x, 2.45, ARENA_POS.z - 0.35);
    camera.updateMatrixWorld();
    mount(duelMarkup({ variant: 'question', stem: 'long' }));
    return new Promise(function (resolve) {
      window.setTimeout(function () { resolve(measure()); }, 900);
    });
  };
  H.title = function () {
    return document.title;
  };
  H.loopFrames = function () { return loopFrames; };
  H.markup = duelMarkup;

  window.requestAnimationFrame(frame);
})();
