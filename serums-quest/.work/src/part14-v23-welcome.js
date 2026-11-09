/* =========================================================================
   V2.3 · FASE 1B · AGENTE 1 + AGENTE 3 · BIENVENIDA Y TUTORIAL CINEMATOGRÁFICOS
   -------------------------------------------------------------------------
   La bienvenida conserva exactamente las mismas acciones que V2.3 Fase 1
   (continuar, mapa, arena, modos, inventario, tienda, bitácora, importar,
   ajustes, sonido y ayuda), pero cambia la composición: la escena 3D compartida
   ocupa la zona de héroes y el texto vive en una zona propia con escala fluida.

   El tutorial es un overlay propio, fuera de #screen, que nunca usa
   setScreen('tutorial') ni renderScreen() al avanzar: se actualizan textos,
   constelación de progreso y botones del mismo nodo. Cada paso pide a la
   escena compartida (part16) una mini-escena 3D; la cámara se desliza sin
   remontar canvas, renderer ni escena.
   ========================================================================= */

var V23W = {
  version: 'a4-welcome-1b',
  titlePaints: 0,
  titleNode: null,
  tutorialNode: null,
  lastFocus: null,
  routeOpenCount: 0,
  stepPaints: 0
};

/* -------------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------------- */
function v23wStorageAllowsSave() {
  try { return typeof storageEnabled === 'boolean' ? storageEnabled : true; } catch (e) { return true; }
}
function v23wPlural(n, one, many) {
  try { return plural(n, one, many); } catch (e) { return Number(n) === 1 ? one : many; }
}
function v23wSfx() {
  try { if (typeof sfxSelect === 'function') sfxSelect(); } catch (e) {}
}
function v23wPortrait(id, size) {
  try { return renderHeroPortrait(id, size) || ''; } catch (e) { return ''; }
}
function v23wShortArea(area) {
  if (!area) return '';
  var first = String(area.short || '').split(' ')[0];
  return first || String(area.short || '');
}
function v23wVersionLabel() {
  return 'V2.3 · Fase 2';
}
function v23wReduced() {
  try { return !!(state && state.settings && state.settings.reducedMotion); } catch (e) { return false; }
}

/* Tres figuras: el héroe equipado al frente y dos acompañantes de la
   colección (o del elenco si aún no hay más héroes). */
function v23wRoster() {
  var heroId = (state && state.collection && state.collection.selectedCharacterId) || 'ilan';
  var owned = [];
  try {
    owned = (state.collection.ownedCharacterIds || []).filter(function (id) {
      return id !== heroId && CHARACTER_BY_ID[id];
    });
  } catch (e) { owned = []; }
  var pool = owned.slice();
  try {
    CAMP.characters.forEach(function (c) {
      if (c.id !== heroId && pool.indexOf(c.id) === -1) pool.push(c.id);
    });
  } catch (e) {}
  return { hero: heroId, mates: pool.slice(0, 2) };
}

/* -------------------------------------------------------------------------
   BIENVENIDA · estructura
   ------------------------------------------------------------------------- */
function v23wNavBtn(action, iconName, label) {
  return '<button type="button" class="v23wNavBtn" data-action="' + action + '" aria-label="' + esc(label) + '" title="' + esc(label) + '">' +
    icon(iconName, 15) + '<span>' + esc(label) + '</span></button>';
}
function v23wToolBtn(action, iconName, label, extra) {
  return '<button type="button" class="v23wTool" data-action="' + action + '" aria-label="' + esc(label) + '" title="' + esc(label) + '"' + (extra || '') + '>' +
    icon(iconName, 16) + '</button>';
}
function v23wStatsHTML() {
  var lv = levelAt(state.xp);
  var rank = currentRank();
  var due = dueCount();
  var out = '';
  out += '<span class="v23wStat"><b>Nv ' + lv.level + '</b><span>' + esc(rank.name) + '</span></span>';
  out += '<span class="v23wStat">' + icon('checkCircle', 12) + '<b>' + totalMissionsDone() + '</b><span>/18 nodos</span></span>';
  out += '<span class="v23wStat' + (due ? ' is-due' : '') + '">' + icon('rotate', 12) + '<b>' + due + '</b><span>' + v23wPlural(due, 'repaso', 'repasos') + '</span></span>';
  if (state.importedAt) {
    out += '<span class="v23wStat is-teal">' + icon('upload', 12) + '<span>Partida importada</span></span>';
  }
  if (pausedDuel && session) {
    out += '<span class="v23wStat is-gold">' + icon('pause', 12) + '<span>Duelo en pausa</span></span>';
  }
  return out;
}
function v23wRouterLabel(area) {
  var long = v23wShortArea(area);
  var short = long.length > 9 ? long.slice(0, 6).replace(/\s+$/, '') + '.' : long;
  return { long: long, short: short };
}
function v23wRoutesHTML() {
  try {
    return CAMP.areas.map(function (area) {
      var ap = areaProgress(area.id);
      var pct = Math.round(ap.pct * 100);
      var label = v23wRouterLabel(area);
      return '<button type="button" class="v23wRoute" style="--route:' + area.accent + '" data-action="v23w-route" data-area="' + esc(area.id) + '" title="' + esc(area.short) + ' · ' + ap.done + '/' + ap.total + ' nodos" aria-label="Abrir el mapa de ' + esc(area.short) + '">' +
        '<span class="v23wRouteTop"><b><span class="v23wRouteLong">' + esc(label.long) + '</span><span class="v23wRouteShort">' + esc(label.short) + '</span></b></span>' +
        '<span class="v23wRouteMeta"><span class="v23wRouteBar"><i style="width:' + pct + '%"></i></span><small>' + ap.done + '/' + ap.total + '</small></span>' +
      '</button>';
    }).join('');
  } catch (e) { return ''; }
}
function v23wFallbackHTML(roster) {
  var heroSrc = v23wPortrait(roster.hero, 520);
  var mateASrc = roster.mates[0] ? v23wPortrait(roster.mates[0], 320) : '';
  var mateBSrc = roster.mates[1] ? v23wPortrait(roster.mates[1], 320) : '';
  return '<div class="v23bFallback" aria-hidden="true">' +
    (mateASrc ? '<img src="' + mateASrc + '" alt="" draggable="false" />' : '') +
    '<img src="' + heroSrc + '" alt="" draggable="false" />' +
    (mateBSrc ? '<img src="' + mateBSrc + '" alt="" draggable="false" />' : '') +
  '</div>';
}
function v23wTitleHTML() {
  var roster = v23wRoster();
  var hero = CHARACTER_BY_ID[roster.hero] || (CAMP.characters && CAMP.characters[0]);
  var look = selectedLook();
  var progress = hasProgress();
  var paused = !!(pausedDuel && session);
  var ctaLabel = paused ? 'Reanudar duelo' : (progress ? 'Continuar' : 'Comenzar');
  var ctaHint = paused ? 'El guardián espera' : (progress ? 'Volver al observatorio' : 'Entrar al observatorio');
  var fallback = v23wFallbackHTML(roster);
  var stage =
    '<section class="v23wStage is-fallback" data-v23b-zone="welcome" data-v23b-hero="' + esc(roster.hero) + '" data-v23b-mates="' + esc(roster.mates.join(',')) + '" aria-label="Tu grupo en el observatorio" style="--hero-accent:' + look.accent + '">' +
      fallback +
      '<div class="v23wStageFrame" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' +
      '<div class="v23wStageLive" aria-hidden="true"><span></span>Escena del observatorio</div>' +
      '<div class="v23wHeroTag">' +
        '<span class="v23wHeroTagRune" aria-hidden="true">◈</span>' +
        '<span><b>' + esc(hero ? hero.name : 'Tu guía') + '</b><small>' + esc(look.klass) + ' · ' + esc(look.weapon) + '</small></span>' +
      '</div>' +
    '</section>';
  var copy =
    '<section class="v23wCopy">' +
      '<p class="v23wPrelude"><span class="v23wPreludeLine" aria-hidden="true"></span>Observatorio de las cinco rutas</p>' +
      '<h1 class="v23wLogo"><span>SERUMS</span><span>QUEST</span></h1>' +
      '<p class="v23wGenre"><span>Aventura RPG</span><i aria-hidden="true"></i><span>Preparación SERUMS</span><i aria-hidden="true"></i><span>Psicología</span></p>' +
      '<p class="v23wLead"><span>Cinco islas y diez voces: responde en cada ruta y convierte cada error en repaso.</span><span class="v23wLeadExtra"> El observatorio guarda tu avance, tus monedas y tu errorario en este navegador.</span></p>' +
      '<div class="v23wActions">' +
        '<button type="button" class="btn btn--primary btn--lg v23wCta" data-action="menu-continue">' +
          '<span class="v23wCtaIcon">' + icon('play', 17) + '</span>' +
          '<span class="v23wCtaText"><b>' + ctaLabel + '</b><small>' + ctaHint + '</small></span>' +
          icon('chevronRight', 16) +
        '</button>' +
        '<button type="button" class="btn btn--ghost btn--lg v23wCta2" data-action="open-tutorial">' +
          icon('compass', 17) + '<span><b>Cómo jugar</b><small>5 pasos en 1 minuto</small></span>' +
        '</button>' +
      '</div>' +
      '<div class="v23wStats">' + v23wStatsHTML() + '</div>' +
      '<p class="v23wFootnote">' + icon('shield', 11) + ' Guardado local · sin cuentas · sin conexión</p>' +
    '</section>';
  return '<div class="titleScreen v23w v23w--cinema" data-v23w-title="1">' +
    '<div class="v23wBg" aria-hidden="true"></div>' +
    '<div class="v23bScrim" aria-hidden="true"></div>' +
    '<div class="v23wShell">' +
      '<header class="v23wTop">' +
        '<div class="v23wBrand">' +
          '<span class="v23wBrandMark" aria-hidden="true">◈</span>' +
          '<span class="v23wBrandText"><b>SERUMS QUEST</b><small>Observatorio de las cinco rutas</small></span>' +
        '</div>' +
        '<div class="v23wTopMeta">' +
          '<nav class="v23wNav" aria-label="Accesos del observatorio">' +
            v23wNavBtn('open-map', 'map', 'Mapa') +
            v23wNavBtn('enter-arena', 'compass', 'Arena') +
            v23wNavBtn('open-modes', 'seal', 'Modos') +
            v23wNavBtn('open-wardrobe', 'layers', 'Inventario') +
            v23wNavBtn('open-shop', 'bag', 'Tienda') +
            v23wNavBtn('open-journal', 'book', 'Bitácora') +
            v23wNavBtn('open-import', 'upload', 'Importar') +
          '</nav>' +
          '<span class="v23wVersion">' + esc(v23wVersionLabel()) + '</span>' +
        '</div>' +
      '</header>' +
      '<main class="v23wMain">' + stage + copy + '</main>' +
      '<footer class="v23wFoot">' +
        '<div class="v23wDock">' +
          '<span class="v23wDockLabel" aria-hidden="true">Atrio</span>' +
          v23wToolBtn('toggle-sound', state.settings.sound ? 'sound' : 'soundOff', 'Sonido') +
          v23wToolBtn('open-settings', 'settings', 'Ajustes') +
          v23wToolBtn('open-help', 'bookOpen', 'Ayuda y cómo jugar') +
        '</div>' +
        '<div class="v23wRoutes" role="group" aria-label="Las cinco rutas">' + v23wRoutesHTML() + '</div>' +
      '</footer>' +
    '</div>' +
  '</div>';
}
function titleScreenHTML() { return v23wTitleHTML(); }

/* -------------------------------------------------------------------------
   TUTORIAL · contenido de los cinco pasos
   ------------------------------------------------------------------------- */
function v23wSlides() {
  return [
    {
      kicker: 'MOVIMIENTO',
      title: 'MUÉVETE POR EL ATRIO',
      support: 'WASD o flechas para caminar. E interactúa. En táctil, joystick y botón.',
      note: 'Los mandos táctiles aparecen solos en pantallas pequeñas.',
      accent: '#69d3c1'
    },
    {
      kicker: 'DUELO',
      title: 'DUELA CON CRITERIO',
      support: 'Lee la pregunta, elige una opción y cuida tus corazones.',
      note: 'La precisión importa más que la velocidad.',
      accent: '#f3b562'
    },
    {
      kicker: 'REPASO',
      title: 'REVISA Y RECUERDA',
      support: 'Cada fallo vuelve a tu errorario con una cita de repaso.',
      note: 'Aciertos y fallos actualizan el intervalo sin inventar dominio.',
      accent: '#c49bff'
    },
    {
      kicker: 'MAPA',
      title: 'ABRE CINCO RUTAS',
      support: 'Completa misiones y despierta los nodos del orrery.',
      note: 'Cada guardián cierra su isla; las recompensas se registran una vez.',
      accent: '#b8d46a'
    },
    {
      kicker: 'TIENDA',
      title: 'VISTE TU LEYENDA',
      support: 'Gana monedas y equipa cosméticos por héroe. Solo estética.',
      note: 'No cambian preguntas, claves ni recompensas.',
      accent: '#e4c07a'
    }
  ];
}
function v23wConstHTML() {
  var slides = v23wSlides();
  var positions = [[8, 62], [29, 36], [50, 54], [71, 26], [92, 44]];
  var lines = '';
  for (var i = 0; i < positions.length - 1; i += 1) {
    lines += '<line x1="' + positions[i][0] + '" y1="' + positions[i][1] + '" x2="' + positions[i + 1][0] + '" y2="' + positions[i + 1][1] + '" data-seg="' + i + '" />';
  }
  var stars = '';
  for (var s = 0; s < slides.length; s += 1) {
    stars += '<button type="button" class="v23tutStar" data-action="tutorial-goto" data-step="' + s + '" ' +
      'aria-label="Ir al paso ' + (s + 1) + ' de 5: ' + esc(slides[s].kicker) + '" title="' + esc(slides[s].kicker) + '">' +
      '<i aria-hidden="true">✦</i><span>' + (s + 1) + '</span></button>';
  }
  return '<div class="v23tutConst" role="group" aria-label="Progreso del tutorial">' +
    '<svg class="v23tutConstSvg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' + lines + '</svg>' +
    '<div class="v23tutConstStars">' + stars + '</div>' +
  '</div>';
}
function v23wTutorialShellHTML() {
  return '<div class="v23tutScrim" aria-hidden="true"></div>' +
    '<div class="v23tutLayout" data-v23tut-layout="1">' +
      '<div class="v23tutScene" aria-hidden="true">' +
        '<div class="v23tutStage" data-v23b-zone="tutorial"></div>' +
        '<span class="v23tutSceneIndex" id="v23TutIndex">01</span>' +
        '<span class="v23tutSceneRule"></span>' +
        '<span class="v23tutSceneHint" id="v23TutSceneHint">MOVIMIENTO</span>' +
      '</div>' +
      '<section class="v23tutPanel" role="dialog" aria-modal="true" aria-labelledby="v23TutTitle" tabindex="-1">' +
        '<header class="v23tutHead">' +
          '<span class="v23tutPill"><b id="v23TutStepNo">PASO 1 DE 5</b><i aria-hidden="true"></i><span id="v23TutKicker">MOVIMIENTO</span></span>' +
          '<button type="button" class="v23tutClose" data-action="tutorial-close" aria-label="Cerrar el tutorial">' + icon('close', 18) + '</button>' +
        '</header>' +
        '<div class="v23tutCopy" aria-live="polite" aria-atomic="true">' +
          '<h2 id="v23TutTitle">MUÉVETE POR EL ATRIO</h2>' +
          '<p class="v23tutSupport" id="v23TutSupport">WASD o flechas para caminar. E interactúa. En táctil, joystick y botón.</p>' +
        '</div>' +
        v23wConstHTML() +
        '<footer class="v23tutFoot">' +
          '<button type="button" class="v23tutPrimary" data-action="tutorial-next">' +
            '<span id="v23TutNextLabel">Continuar</span>' + icon('chevronRight', 17) +
          '</button>' +
          '<button type="button" class="v23tutSkip" data-action="tutorial-skip">Saltar</button>' +
        '</footer>' +
        '<div class="v23tutAux">' +
          '<button type="button" class="v23tutBack" data-action="tutorial-prev">' + icon('chevronLeft', 14) + '<span>Atrás</span></button>' +
          '<span class="v23tutKeys" aria-hidden="true"><b>Enter</b> siguiente<i>·</i><b>← →</b> pasos<i>·</i><b>Esc</b> cerrar</span>' +
        '</div>' +
        '<p class="v23tutFootNote">' + icon('info', 11) + ' Puedes repetir este tutorial desde Ayuda y desde Ajustes.</p>' +
      '</section>' +
    '</div>';
}
function v23wEnsureTutorial() {
  if (V23W.tutorialNode && document.body.contains(V23W.tutorialNode)) return V23W.tutorialNode;
  var el = document.createElement('div');
  el.id = 'v23Tutorial';
  el.className = 'v23tut v23tut--cinema';
  el.hidden = true;
  el.innerHTML = v23wTutorialShellHTML();
  document.body.appendChild(el);
  V23W.tutorialNode = el;
  if (typeof V23 !== 'undefined' && V23.tutorial) V23.tutorial.overlay = el;
  return el;
}
function v23wTutorialNode() {
  return V23W.tutorialNode || (typeof V23 !== 'undefined' ? V23.tutorial.overlay : null);
}
function v23wSetText(id, text) {
  var el = document.getElementById(id);
  if (el) el.textContent = text;
}
function v23wRenderTutorial(animate) {
  var el = v23wTutorialNode();
  if (!el) return;
  var slides = v23wSlides();
  var total = slides.length;
  var i = Math.max(0, Math.min(total - 1, Number(V23.tutorial.step) || 0));
  V23.tutorial.step = i;
  V23.tutorial.total = total;
  tutorialSlide = i;
  V23W.stepPaints += 1;
  var s = slides[i];
  el.setAttribute('data-step', String(i + 1));
  el.style.setProperty('--step-accent', s.accent);
  var title = el.querySelector('#v23TutTitle');
  var support = el.querySelector('#v23TutSupport');
  var copy = el.querySelector('.v23tutCopy');
  if (copy) {
    copy.classList.remove('is-in');
    /* Reinicia la animación de entrada del texto sin remontar el overlay. */
    void copy.offsetWidth;
    if (animate !== false) copy.classList.add('is-in');
  }
  if (title) title.textContent = s.title;
  if (support) support.textContent = s.support;
  v23wSetText('v23TutStepNo', 'PASO ' + (i + 1) + ' DE ' + total);
  v23wSetText('v23TutKicker', s.kicker);
  v23wSetText('v23TutSceneHint', s.kicker);
  v23wSetText('v23TutIndex', (i < 9 ? '0' : '') + (i + 1));
  var progressText = el.querySelector('.v23tutProgressText');
  if (progressText) progressText.textContent = 'Paso ' + (i + 1) + ' de ' + total;
  Array.prototype.forEach.call(el.querySelectorAll('.v23tutStar'), function (star) {
    var dotStep = Number(star.getAttribute('data-step'));
    star.classList.toggle('is-active', dotStep === i);
    star.classList.toggle('is-done', dotStep < i);
    if (dotStep === i) star.setAttribute('aria-current', 'step'); else star.removeAttribute('aria-current');
    star.setAttribute('aria-label', 'Ir al paso ' + (dotStep + 1) + ' de ' + total + ': ' + slides[dotStep].kicker);
  });
  Array.prototype.forEach.call(el.querySelectorAll('.v23tutConstSvg line'), function (line, idx) {
    line.classList.toggle('is-lit', idx < i);
  });
  var prev = el.querySelector('[data-action="tutorial-prev"]');
  if (prev) {
    prev.disabled = i === 0;
    prev.setAttribute('aria-disabled', i === 0 ? 'true' : 'false');
    prev.style.visibility = i === 0 ? 'hidden' : '';
  }
  var next = el.querySelector('[data-action="tutorial-next"]');
  var label = el.querySelector('#v23TutNextLabel');
  if (label) label.textContent = (i === total - 1) ? 'Terminar' : 'Continuar';
  if (next) next.setAttribute('aria-label', (i === total - 1) ? 'Terminar el tutorial' : 'Ir al paso ' + (i + 2) + ' de ' + total);
  var skip = el.querySelector('.v23tutSkip');
  if (skip) skip.textContent = (i === total - 1) ? 'Terminar sin recorrer' : 'Saltar';
  el.classList.toggle('is-last', i === total - 1);
  try {
    window.dispatchEvent(new CustomEvent('v23b:tutorial-step', { detail: { step: i, animate: animate !== false } }));
  } catch (e) {}
}
function v23wReturnForTutorial() {
  if (screen === 'help' || screen === 'settings' || screen === 'title' || screen === 'hub' || screen === 'pause') return screen;
  return 'title';
}
function openTutorial(returnScreen) {
  var el = v23wEnsureTutorial();
  V23.tutorial.active = true;
  V23.tutorial.seenThisSession = true;
  V23.tutorial.returnScreen = returnScreen || v23wReturnForTutorial();
  V23.tutorial.step = 0;
  V23.tutorial.total = v23wSlides().length;
  V23W.lastFocus = document.activeElement;
  v23wRenderTutorial(false);
  el.hidden = false;
  el.classList.add('is-open');
  document.body.classList.add('v23tutOpen');
  try { initAudio(); } catch (e) {}
  v23wSfx();
  try {
    window.dispatchEvent(new CustomEvent('v23b:tutorial-opened', { detail: { step: 0 } }));
  } catch (e) {}
  window.setTimeout(function () {
    try {
      var panel = el.querySelector('.v23tutPanel');
      if (panel && typeof panel.focus === 'function') panel.focus({ preventScroll: true });
    } catch (e) {}
  }, 40);
}
function closeTutorial() {
  var el = v23wTutorialNode();
  V23.tutorial.active = false;
  V23.tutorial.seenThisSession = true;
  state.settings.tutorialSeen = true;
  if (v23wStorageAllowsSave() && !recoveryLock) {
    try { saveSettings(); persist(); } catch (e) {}
  }
  if (el) {
    el.classList.remove('is-open');
    el.hidden = true;
  }
  document.body.classList.remove('v23tutOpen');
  try {
    window.dispatchEvent(new CustomEvent('v23b:tutorial-closed'));
  } catch (e) {}
  var focusTarget = V23W.lastFocus;
  V23W.lastFocus = null;
  window.setTimeout(function () {
    try {
      if (focusTarget && document.body.contains(focusTarget) && typeof focusTarget.focus === 'function') focusTarget.focus({ preventScroll: true });
      else {
        var cta = document.querySelector('.v23wCta');
        if (cta) cta.focus({ preventScroll: true });
      }
    } catch (e) {}
  }, 50);
  try { maybeShowBackupPrompt(); } catch (e) {}
}
function v23wTutorialGo(index, animate) {
  var total = v23wSlides().length;
  var next = Math.max(0, Math.min(total - 1, Number(index) || 0));
  if (next === V23.tutorial.step && !animate) return;
  V23.tutorial.step = next;
  v23wRenderTutorial(animate !== false);
  v23wSfx();
}
function v23wTutorialStep(delta) {
  v23wTutorialGo((Number(V23.tutorial.step) || 0) + (Number(delta) || 0), true);
}
function maybeShowTutorial() {
  if (!state || !state.settings) return;
  if (state.settings.tutorialSeen) return;
  if (recoveryInfo && recoveryInfo.corrupt) return;
  if (!FINAL_RELEASE && RULES && RULES.devSkipTutorial) return;
  if (V23.tutorial.active) return;
  openTutorial('title');
}

/* -------------------------------------------------------------------------
   AYUDA · misma pantalla base + acceso directo al tutorial
   ------------------------------------------------------------------------- */
function v23wHelpHTML() {
  return '<div class="overlay"><div class="overlayShell helpShell v23HelpShell">' +
    '<div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot"></span>Ayuda del observatorio</span><h1>Todo lo que necesitas, <em>sin prisa.</em></h1><p>Controles, repaso, modos y cosméticos. Nada de esta pantalla cambia tu progreso.</p></div><div class="sheetHeadSide"><button type="button" class="sheetClose" data-action="close-help" aria-label="Cerrar ayuda">' + icon('close', 17) + '</button></div></div>' +
    '<section class="panel v23HelpTutorial"><div><span class="eyebrow noRule">Primer recorrido</span><h3>¿Quieres repasar cómo se juega?</h3><p>Cinco escenas breves: movimiento, duelo, repaso, mapa y tienda. Puedes saltarlo y volver a verlo cuando quieras.</p></div><button type="button" class="btn btn--primary" data-action="open-tutorial">' + icon('compass', 15) + ' Cómo jugar · 5 pasos</button></section>' +
    '<div class="helpGrid">' +
      '<section class="panel"><h3>Controles</h3><div class="helpControlList">' + HELP_CONTROLS.map(function (r) { return '<div><kbd>' + esc(r[0]) + '</kbd><span>' + esc(r[1]) + '</span></div>'; }).join('') + '</div><p class="settingsHelp">En móvil: joystick para moverte y botones del HUD para mapa, pausa y acciones. En horizontal la interfaz tiene más espacio; si el dispositivo está en vertical, se pide girarlo.</p></section>' +
      '<section class="panel"><h3>Repaso espaciado</h3><p>Un fallo no se borra: entra en tu errorario. La primera cita es a los 20 minutos; después, 1, 3, 7, 14 y 30 días. Un acierto actualiza el intervalo sin inventar dominio.</p><p>Desde Repaso puedes marcar preguntas como difíciles o favoritas. Las marcas no cambian la puntuación.</p></section>' +
      '<section class="panel"><h3>Modos</h3><p><b>Diario</b> se abre una vez al día. <b>Supervivencia</b> usa tres oportunidades. <b>Contrarreloj</b> mide precisión bajo tiempo. <b>Simulacro</b> guarda la clave hasta el final. <b>Práctica libre</b> no tiene corazones ni reloj.</p></section>' +
      '<section class="panel"><h3>Cosméticos</h3><p>Los cosméticos se consiguen con monedas, logros, misiones y progreso de colección. No cambian preguntas, claves ni recompensas. Puedes equiparlos por héroe en Inventario.</p></section>' +
    '</div>' +
    '<div class="atlasFooter"><span>' + settingsVersionLine() + ' · sin conexión y sin cuentas</span><button type="button" class="btn btn--ghost btn--sm" data-action="close-help">Volver ' + icon('chevronRight', 11) + '</button></div>' +
  '</div></div>';
}
function helpScreenHTML() { return v23wHelpHTML(); }

var v23wHelpReturn = 'title';
function openHelp() {
  v23wHelpReturn = (screen === 'title' || screen === 'hub' || screen === 'pause' || screen === 'settings') ? screen : 'hub';
  setScreen('help');
  v23wSfx();
}
function closeHelp() {
  var target = v23wHelpReturn || 'title';
  v23wHelpReturn = 'title';
  if (target === 'title') { enterTitle(); return; }
  if (target === 'pause') { setScreen('pause'); return; }
  if (target === 'settings') { setScreen('settings'); return; }
  enterHub();
}

/* -------------------------------------------------------------------------
   ACCIONES Y TECLADO
   ------------------------------------------------------------------------- */
function v23wOpenRoute(areaId) {
  if (!areaId || !AREA_BY_ID[areaId]) return;
  V23W.routeOpenCount += 1;
  try { initAudio(); } catch (e) {}
  try {
    openMap();
    if (typeof mapJumpToArea === 'function') {
      window.setTimeout(function () { try { mapJumpToArea(areaId); } catch (e) {} }, 40);
    }
  } catch (e) {
    try { openJournal(areaId); } catch (e2) {}
  }
}
function v23wOnClickCapture(event) {
  var target = event.target && event.target.closest ? event.target.closest('[data-action]') : null;
  if (!target) return;
  var action = target.getAttribute('data-action');
  if (action === 'open-tutorial') {
    event.preventDefault();
    event.stopImmediatePropagation();
    openTutorial(v23wReturnForTutorial());
    return;
  }
  if (action === 'v23w-route') {
    event.preventDefault();
    event.stopImmediatePropagation();
    v23wOpenRoute(target.getAttribute('data-area'));
    return;
  }
  if (action === 'tutorial-next' || action === 'tutorial-prev' || action === 'tutorial-skip' || action === 'tutorial-close' || action === 'tutorial-goto') {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!V23.tutorial.active) return;
    var total = v23wSlides().length;
    if (action === 'tutorial-next') {
      if (V23.tutorial.step >= total - 1) closeTutorial();
      else v23wTutorialStep(1);
    } else if (action === 'tutorial-prev') {
      if (V23.tutorial.step > 0) v23wTutorialStep(-1);
    } else if (action === 'tutorial-goto') {
      v23wTutorialGo(Number(target.getAttribute('data-step')) || 0, true);
    } else {
      closeTutorial();
    }
    return;
  }
}
document.addEventListener('click', v23wOnClickCapture, true);

window.addEventListener('keydown', function (event) {
  if (!V23.tutorial.active) return;
  var el = v23wTutorialNode();
  if (!el) return;
  var onControl = event.target && event.target.closest ? !!event.target.closest('button, [href], input, select, textarea') : false;
  if (event.code === 'Escape') {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeTutorial();
    return;
  }
  if (event.code === 'ArrowRight') {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (V23.tutorial.step < v23wSlides().length - 1) v23wTutorialStep(1);
    return;
  }
  if (event.code === 'ArrowLeft') {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (V23.tutorial.step > 0) v23wTutorialStep(-1);
    return;
  }
  if (event.code === 'Enter' || event.code === 'NumpadEnter') {
    /* Si el foco ya está en un botón, deja que su activación nativa decida:
       así Enter no avanza dos veces. */
    if (onControl) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (V23.tutorial.step >= v23wSlides().length - 1) closeTutorial();
    else v23wTutorialStep(1);
    return;
  }
  if (event.code === 'Tab') {
    var focusables = Array.prototype.filter.call(el.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'), function (n) {
      return n.offsetParent !== null && getComputedStyle(n).visibility !== 'hidden';
    });
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
}, true);

/* -------------------------------------------------------------------------
   CARGA · guard defensivo + repintado único de la bienvenida
   ------------------------------------------------------------------------- */
function v23wMarkFallback() {
  var stage = document.querySelector('.v23wStage');
  if (!stage) return;
  var ready = false;
  try { ready = !!(window.__v23b && window.__v23b.ready && window.__v23b.ready()); } catch (e) {}
  stage.classList.toggle('is-fallback', !ready);
}
function v23wPaintTitle() {
  if (!EL || !EL.screen) return false;
  if (screen !== 'title') return false;
  EL.screen.innerHTML = v23wTitleHTML();
  V23W.titlePaints += 1;
  V23W.titleNode = EL.screen.querySelector('.titleScreen');
  v23wMarkFallback();
  try {
    V23.flags.welcomeMounted = !!V23W.titleNode;
    V23.welcome = { paints: V23W.titlePaints, node: V23W.titleNode };
  } catch (e) {}
  try { window.dispatchEvent(new CustomEvent('v23b:title-painted')); } catch (e) {}
  return true;
}
function v23wBoot() {
  /* Si el navegador bloquea localStorage no existe un guardado corrupto. */
  try {
    if (!v23wStorageAllowsSave() && recoveryInfo && recoveryInfo.corrupt) {
      recoveryInfo.corrupt = false;
      recoveryInfo.raw = null;
      recoveryLock = false;
      if (screen === 'recovery') {
        try { enterTitle(); } catch (e) {}
      }
    }
  } catch (e) {}
  try {
    V23.tutorial.total = v23wSlides().length;
    if (typeof V23.tutorial.step !== 'number') V23.tutorial.step = 0;
  } catch (e) {}
  if (screen === 'title') {
    try { v23wPaintTitle(); } catch (e) {
      try { console.warn('V23 bienvenida: no se pudo repintar el título.', e); } catch (e2) {}
    }
  }
}
v23wBoot();

window.addEventListener('v23b:ready', function () {
  v23wMarkFallback();
  try { V23W.titleNode = document.querySelector('.titleScreen.v23w'); } catch (e) {}
});

/* Hook de QA (no afecta al juego). */
try {
  window.__v23welcome = {
    version: V23W.version,
    storageAllowed: v23wStorageAllowsSave,
    titlePaints: function () { return V23W.titlePaints; },
    titleNode: function () { return V23W.titleNode || document.querySelector('.titleScreen'); },
    tutorialNode: function () { return v23wTutorialNode(); },
    tutorialState: function () {
      return {
        active: !!V23.tutorial.active,
        step: Number(V23.tutorial.step) || 0,
        total: v23wSlides().length,
        seenThisSession: !!V23.tutorial.seenThisSession,
        returnScreen: V23.tutorial.returnScreen,
        stepPaints: V23W.stepPaints
      };
    },
    slides: function () { return v23wSlides().map(function (s) { return s.title; }); },
    open: function (ret) { openTutorial(ret); },
    close: function () { closeTutorial(); },
    stepTo: function (i) { v23wTutorialGo(i, true); },
    openRoute: v23wOpenRoute,
    routeOpens: function () { return V23W.routeOpenCount; },
    cinema: function () {
      try {
        return window.__v23b ? {
          ready: window.__v23b.ready(),
          mode: window.__v23b.mode(),
          step: window.__v23b.step(),
          canvas: !!window.__v23b.canvas(),
          zone: window.__v23b.zone()
        } : null;
      } catch (e) { return null; }
    },
    recovery: function () {
      return {
        storageEnabled: v23wStorageAllowsSave(),
        corrupt: !!(typeof recoveryInfo !== 'undefined' && recoveryInfo && recoveryInfo.corrupt),
        lock: !!(typeof recoveryLock !== 'undefined' && recoveryLock)
      };
    }
  };
} catch (e) {}
