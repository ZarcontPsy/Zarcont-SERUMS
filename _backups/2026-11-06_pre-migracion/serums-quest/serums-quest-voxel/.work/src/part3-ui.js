/* =========================================================================
   INTERFAZ — HUD, título, bitácora, héroes, repaso, importación y pausa
   ========================================================================= */
var sheetReturn = 'hub';
var pauseReturn = 'hub';
var recruitHeroId = null;
var resetArmedUntil = 0;
var abandonArmedUntil = 0;
var importError = '';
var portraitQueue = [];
var portraitTimer = null;

function hasProgress() {
  return state.xp > 0 || state.coins > 0 || Object.keys(state.missions).length > 0 || Object.keys(state.questions).length > 0 || !!state.importedAt;
}
function totalMissionsDone() {
  return Object.keys(state.missions).filter(function (id) { return state.missions[id] && state.missions[id].completedAt; }).length;
}
function recommendedSubtitle(m) {
  if (!m) return '';
  return m.subtitle + ' · ' + m.questionCount + ' preguntas · ' + m.tierLabel;
}
function dueCount() { return dueErrors().length; }
function formatXP(value) { return formatNumber(value) + ' XP'; }
function missionTypeLabel(m) { return m.kind === 'boss' ? 'Jefe de ruta' : 'Misión de ruta'; }
function equippedSummary() {
  return Object.keys(state.collection.equipped || {}).reduce(function (n, id) {
    return n + Object.keys(state.collection.equipped[id] || {}).length;
  }, 0);
}

function mountHud() {
  EL.hud.innerHTML = '' +
    '<button type="button" class="brand" data-action="open-pause" aria-label="Abrir pausa y menú">' +
      '<span class="brandRune">◈</span>' +
      '<span class="brandWords"><b>SERUMS</b><span>Observatorio</span></span>' +
    '</button>' +
    '<button type="button" class="heroChip" data-action="open-heroes" aria-label="Cambiar de héroe">' +
      '<span class="heroAvatar"><img data-hud-portrait alt="" /></span>' +
      '<span class="heroChipCopy"><span class="heroChipName"><b data-hud-hero>Ilan Vega</b><small data-hud-level>Nv 1</small></span>' +
        '<span class="heroChipMeta"><span data-hud-rank>Bachiller</span><span class="bar xp"><i data-hud-xp></i></span><em data-hud-xpnum>0 XP</em></span>' +
        '<span class="heroChipTitle" data-hud-title></span>' +
      '</span>' +
    '</button>' +
    '<div class="hudCenter"><span id="hudEyebrow">Observatorio de las Cinco Rutas</span><b id="hudLocation">Atrio de las rutas</b></div>' +
    '<div class="hudActions">' +
      '<span class="hudResource" title="Monedas de estudio">' + icon('coin', 14) + '<b data-hud-coins>0</b></span>' +
      '<button type="button" class="iconBtn" data-action="open-review" aria-label="Repaso de errores" title="Repaso de errores">' + icon('rotate', 17) + '<span class="badgeDot hidden" data-hud-due>0</span></button>' +
      '<button type="button" class="hudLabel" data-action="open-map">' + icon('map', 15) + '<span>Mapa</span></button>' +
      '<button type="button" class="iconBtn" data-action="open-journal" aria-label="Bitácora de misiones" title="Bitácora">' + icon('book', 17) + '</button>' +
      '<button type="button" class="iconBtn" data-action="open-wardrobe" aria-label="Inventario de cosméticos" title="Inventario">' + icon('layers', 17) + '</button>' +
      '<button type="button" class="iconBtn" data-action="open-shop" aria-label="Tienda de cosméticos" title="Tienda">' + icon('bag', 17) + '</button>' +
      '<button type="button" class="iconBtn" data-action="open-heroes" aria-label="Héroes" title="Héroes">' + icon('user', 17) + '</button>' +
      '<button type="button" class="iconBtn" data-action="toggle-sound" aria-label="Sonido" title="Sonido" data-hud-sound>' + icon('sound', 17) + '</button>' +
      '<button type="button" class="iconBtn" data-action="open-pause" aria-label="Pausa" title="Pausa">' + icon('pause', 17) + '</button>' +
    '</div>';
}

function syncHudPortrait() {
  if (!EL.hud || !EL.hud.querySelector) return;
  var img = EL.hud.querySelector('[data-hud-portrait]');
  if (!img) return;
  var id = state.collection.selectedCharacterId;
  if (screen === 'title' || screen === 'boot') return;
  var generated = renderHeroPortrait(id, 200);
  if (generated) img.src = generated;
  var frameColor = typeof frameColorFor === 'function' ? frameColorFor(id) : '';
  var holder = img.parentElement;
  if (holder) holder.style.boxShadow = frameColor ? '0 0 0 2px ' + frameColor + ', 0 0 18px ' + frameColor + '66' : '';
}
function syncHUD() {
  if (!EL.hud) return;
  var visible = screen === 'hub';
  EL.hud.classList.toggle('hidden', !visible);
  EL.hintRow.classList.toggle('hidden', !visible);
  EL.tracker.classList.toggle('hidden', !visible);
  EL.touchControls.classList.toggle('hidden', !visible);
  EL.touchAction.classList.toggle('hidden', !visible || !currentInteract);
  if (!visible) { EL.prompt.classList.add('hidden'); return; }
  var char = selectedCharacter();
  var level = levelAt(state.xp);
  var rank = currentRank();
  var heroEl = EL.hud.querySelector('[data-hud-hero]');
  if (heroEl) heroEl.textContent = char.name;
  var levelEl = EL.hud.querySelector('[data-hud-level]');
  if (levelEl) levelEl.textContent = 'Nv ' + level.level;
  var rankEl = EL.hud.querySelector('[data-hud-rank]');
  if (rankEl) rankEl.textContent = rank.name;
  var titleEl = EL.hud.querySelector('[data-hud-title]');
  if (titleEl) {
    var title = typeof titleText === 'function' ? titleText(char.id) : '';
    titleEl.textContent = title ? '«' + title + '»' : '';
    titleEl.classList.toggle('hidden', !title);
  }
  var xpEl = EL.hud.querySelector('[data-hud-xp]');
  if (xpEl) xpEl.style.width = level.percent + '%';
  var xpNum = EL.hud.querySelector('[data-hud-xpnum]');
  if (xpNum) xpNum.textContent = level.maxed ? 'Nivel máximo' : formatXP(state.xp);
  var coinsEl = EL.hud.querySelector('[data-hud-coins]');
  if (coinsEl) coinsEl.textContent = formatNumber(state.coins);
  var due = dueCount();
  var badge = EL.hud.querySelector('[data-hud-due]');
  if (badge) { badge.textContent = due > 9 ? '9+' : String(due); badge.classList.toggle('hidden', due <= 0); }
  var soundBtn = EL.hud.querySelector('[data-hud-sound]');
  if (soundBtn) soundBtn.innerHTML = icon(state.settings.sound ? 'sound' : 'soundOff', 17);
  var locationEl = document.getElementById('hudLocation');
  if (locationEl) locationEl.textContent = currentInteract && currentInteract.type === 'gate' ? currentInteract.gate.area.short : (currentInteract && currentInteract.type === 'oracle' ? 'Atrio de las rutas' : 'Observatorio');
  syncHudPortrait();
  syncTracker();
  if (currentInteract) EL.touchAction.classList.remove('hidden');
}
function syncTracker() {
  if (!EL.tracker) return;
  var due = dueErrors();
  var rec = nextRecommended();
  var body = '';
  if (due.length) {
    body += '<span class="eyebrow"><span class="kickerDot" style="background:var(--amber);box-shadow:0 0 12px var(--amber)"></span>Memoria en espera</span>' +
      '<h3>Tu repaso está listo.</h3>' +
      '<p>' + due.length + ' ' + plural(due.length, 'pregunta vuelve', 'preguntas vuelven') + ' hoy. Un repaso breve consolida lo que falló.</p>' +
      '<button type="button" class="btn btn--gold btn--sm btn--block" data-action="open-review">' + icon('rotate', 14) + ' Repasar ' + due.length + '</button>';
  } else if (rec) {
    var ap = areaProgress(rec.areaId);
    body += '<span class="eyebrow"><span class="kickerDot"></span>Ruta recomendada</span>' +
      '<h3>' + esc(rec.title) + '</h3>' +
      '<p>' + esc(rec.areaShort) + ' · ' + rec.questionCount + ' preguntas · ' + esc(rec.tierLabel) + '</p>' +
      '<div class="trackerFoot"><div class="bar"><i style="width:' + Math.round(ap.pct * 100) + '%;background:' + rec.accent + '"></i></div><small>' + ap.done + '/' + ap.total + ' de la ruta</small></div>' +
      '<button type="button" class="btn btn--primary btn--sm btn--block trackerAction" data-action="open-mission" data-area="' + esc(rec.areaId) + '" data-mission="' + esc(rec.id) + '">' + icon('play', 13) + ' Abrir ' + (rec.kind === 'boss' ? 'el jefe' : 'la misión') + '</button>';
  } else {
    body += '<span class="eyebrow"><span class="kickerDot" style="background:var(--teal);box-shadow:0 0 12px var(--teal)"></span>Campaña completada</span>' +
      '<h3>Las cinco rutas están selladas.</h3>' +
      '<p>Puedes repasar errores, subir el dominio de las preguntas o recorrer de nuevo una ruta.</p>' +
      '<button type="button" class="btn btn--sm btn--block" data-action="open-journal">' + icon('book', 14) + ' Abrir bitácora</button>';
  }
  if (totalMissionsDone() > 0) {
    body += '<div class="sectionDivider" style="margin:10px 0"></div>' +
      '<div class="trackerFoot"><small>' + totalMissionsDone() + '/18 nodos completados</small><small class="dueTag">' + plural(due.length, 'repaso', 'repasos') + ' · ' + formatPct(state.academic.answered ? overallAccuracy() : 0) + ' precisión</small></div>';
  }
  EL.tracker.innerHTML = '<div class="trackerBody">' + body + '</div>';
}

/* -------------------------------------------------------------------------
   TÍTULO
   ------------------------------------------------------------------------- */
function titleScreenHTML() {
  var char = selectedCharacter();
  var look = selectedLook();
  var lv = levelAt(state.xp);
  var rank = currentRank();
  var due = dueCount();
  var rec = nextRecommended();
  var progress = hasProgress();
  var asideTitle = due > 0 ? 'La memoria primero' : (rec ? rec.title : 'Todas las rutas abiertas');
  var asideText = due > 0
    ? 'Hay ' + due + ' ' + plural(due, 'pregunta esperando', 'preguntas esperando') + ' su próximo repaso. El observatorio conserva cada error para convertirlo en criterio.'
    : (rec ? rec.areaShort + ' · ' + rec.subtitle + '. Tu siguiente paso ya está marcado en la bitácora.' : 'Has recorrido las cinco islas. El atlas queda abierto para repetir, repasar y cuidar lo aprendido.');
  var importedPill = state.importedAt ? '<span class="pill pill--teal">' + icon('upload', 12) + ' Partida importada</span>' : '';
  return '<div class="titleScreen" data-action="enter-game">' +
    '<div class="titleInner">' +
      '<div class="titleTop">' +
        '<div class="titleBrand"><span class="titleBrandMark">✧</span><span class="titleBrandText"><b>SERUMS QUEST</b><span>Observatorio de las cinco rutas</span></span></div>' +
        '<div style="display:flex;align-items:center;gap:8px"><span class="titleVersion">' + esc(APP_VERSION) + '</span><button type="button" class="iconBtn" data-action="toggle-sound" title="Sonido" aria-label="Sonido">' + icon(state.settings.sound ? 'sound' : 'soundOff', 16) + '</button></div>' +
      '</div>' +
      '<div class="titleMain">' +
        '<div class="titleCopy">' +
          '<div class="titlePrelude"><span class="line"></span>Un RPG de criterio y memoria</div>' +
          '<h1 class="gameTitle"><span class="lineOne">SERUMS</span><span class="lineTwo">QUEST</span></h1>' +
          '<p class="titleQuestion">Cinco islas. Diez voces.<br /><em>Una sola forma de avanzar.</em></p>' +
          '<p class="titleLead">Recorre el observatorio, entra en cada ruta y afronta los guardianes respondiendo las preguntas que sostienen tu criterio. Las respuestas abren caminos; los errores vuelven cuando toca recordarlos.</p>' +
          '<div class="titleActions">' +
            '<button type="button" class="btn btn--primary btn--lg" data-action="menu-continue">' + icon('play', 16) + (pausedDuel && session ? ' Reanudar duelo en pausa' : (progress ? ' Continuar en el observatorio' : ' Entrar al observatorio')) + icon('chevronRight', 15) + '</button>' +
          '</div>' +
          '<div class="titleMenu">' +
            '<button type="button" class="titleMenuBtn" data-action="open-map">' + icon('map', 16) + '<span>Mapa</span><small>Avanza por las islas</small></button>' +
            '<button type="button" class="titleMenuBtn" data-action="enter-arena">' + icon('compass', 16) + '<span>Arena</span><small>El atrio 3D</small></button>' +
            '<button type="button" class="titleMenuBtn" data-action="open-modes">' + icon('seal', 16) + '<span>Modos</span><small>Diario, retos y simulacro</small></button>' +
            '<button type="button" class="titleMenuBtn" data-action="open-wardrobe">' + icon('layers', 16) + '<span>Inventario</span><small>Atuendo y cosméticos</small></button>' +
            '<button type="button" class="titleMenuBtn" data-action="open-shop">' + icon('bag', 16) + '<span>Tienda</span><small>Ecos y colección</small></button>' +
            '<button type="button" class="titleMenuBtn" data-action="open-journal">' + icon('book', 16) + '<span>Bitácora</span><small>Rutas y logros</small></button>' +
            '<button type="button" class="titleMenuBtn" data-action="open-settings">' + icon('settings', 16) + '<span>Ajustes</span><small>Audio y accesibilidad</small></button>' +
            '<button type="button" class="titleMenuBtn" data-action="open-import">' + icon('upload', 16) + '<span>Importar</span><small>Tu partida antigua</small></button>' +
          '</div>' +
          '<div class="titleStats">' +
            '<span class="pill"><span style="color:var(--teal)">◈</span> Nv <b>' + lv.level + '</b></span>' +
            '<span class="pill"><span style="color:var(--violet)">✦</span> <b>' + esc(rank.name) + '</b></span>' +
            '<span class="pill">' + icon('checkCircle', 11) + ' <b>' + totalMissionsDone() + '</b>/18 nodos</span>' +
            '<span class="pill ' + (due ? 'pill--due' : '') + '">' + icon('rotate', 11) + ' <b>' + due + '</b> ' + plural(due, 'repaso pendiente', 'repasos pendientes') + '</span>' +
            (pausedDuel && session ? '<span class="pill pill--teal">' + icon('pause', 11) + ' Duelo en pausa</span>' : '') +
            importedPill +
          '</div>' +
        '</div>' +
        '<div class="titleHeroStage" style="--hero-accent:' + look.accent + '">' +
          '<div class="titleHeroHalo"></div>' +
          '<div class="titleHeroOrbit"></div>' +
          '<img class="titleHeroImg" src="' + renderHeroPortrait(char.id, 460) + '" alt="' + esc(char.name) + ' en el observatorio" />' +
          '<div class="titleHeroPlaque">' +
            '<span class="eyebrow noRule" style="color:' + look.accent + '">Tu guía en esta ruta</span>' +
            '<b>' + esc(char.name) + '</b>' +
            '<small>' + esc(look.klass) + ' · ' + esc(look.weapon) + '</small>' +
            '<p>“' + esc(char.quote) + '”</p>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="titleFooter"><span><kbd>ENTER</kbd> continuar <span style="opacity:.45">·</span> <kbd>M</kbd> mapa <kbd>J</kbd> bitácora <kbd>R</kbd> repaso</span><span>Progreso guardado en este navegador · sin conexión</span></div>' +
    '</div>' +
  '</div>';
}

/* -------------------------------------------------------------------------
   BITÁCORA
   ------------------------------------------------------------------------- */
function selectedMissionForArea() {
  var list = areaMissions(selectedAreaId);
  if (!selectedMissionId || !list.some(function (m) { return m.id === selectedMissionId; })) {
    var first = list.find(function (m) { return missionUnlockInfo(m).unlocked && !missionCompleted(m.id); }) || list[0];
    selectedMissionId = first ? first.id : null;
  }
  return MISSION_BY_ID[selectedMissionId] || null;
}
function journalScreenHTML() {
  var area = AREA_BY_ID[selectedAreaId] || CAMP.areas[0];
  var ap = areaProgress(area.id);
  var missions = areaMissions(area.id);
  var selected = selectedMissionForArea();
  var level = currentLevel();
  var areaTabs = CAMP.areas.map(function (a) {
    var p = areaProgress(a.id);
    return '<button type="button" class="areaTab ' + (a.id === area.id ? 'is-active' : '') + '" style="--area:' + a.accent + '" data-action="select-area" data-area="' + esc(a.id) + '">' +
      '<span class="areaTabTop"><span class="areaTabDot"></span><b>' + esc(a.short) + '</b></span>' +
      '<small>' + p.done + '/' + p.total + ' nodos</small>' +
      '<span class="miniBar"><i style="width:' + Math.round(p.pct * 100) + '%"></i></span>' +
    '</button>';
  }).join('');
  var nodes = missions.map(function (m) {
    var u = missionUnlockInfo(m);
    var done = missionCompleted(m.id);
    var cls = 'nodeRow ' + (done ? 'is-completed ' : '') + (!u.unlocked ? 'is-locked ' : '') + (m.id === (selected && selected.id) ? 'is-active ' : '') + (m.kind === 'boss' ? 'is-boss' : '');
    var status = done ? '<span class="chip chip--completed">Hecha</span>' : (u.unlocked ? '<span class="chip chip--accent">Disponible</span>' : '<span class="chip">Bloqueada</span>');
    return '<button type="button" class="' + cls.trim() + '" style="--area:' + m.accent + '" data-action="select-mission" data-mission="' + esc(m.id) + '">' +
      '<span class="nodeIndex">' + (m.kind === 'boss' ? '♛' : m.index) + '</span>' +
      '<span class="nodeCopy"><b>' + esc(m.title) + '</b><small>' + esc(m.subtitle) + ' · ' + m.questionCount + ' preguntas</small></span>' +
      '<span class="nodeSide">' + status + (u.unlocked ? '<span class="nodeChev">' + icon('chevronRight', 12) + '</span>' : '<span class="nodeLock">' + icon('lock', 11) + '</span>') + '</span>' +
    '</button>';
  }).join('');
  var detail = '';
  if (selected) {
    var u = missionUnlockInfo(selected);
    var done = missionCompleted(selected.id);
    var record = state.missions[selected.id] || {};
    var reqs = u.requirements.map(function (r) {
      return '<div class="req ' + (r.met ? 'is-met' : '') + '">' + icon(r.met ? 'check' : 'lock', 11) + '<span>' + esc(r.label) + (r.need > 1 ? ' · ' + r.have + '/' + r.need : '') + '</span></div>';
    }).join('');
    var startLabel = done ? 'Repetir ' + (selected.kind === 'boss' ? 'jefe' : 'ruta') : (selected.kind === 'boss' ? 'Afrontar al guardián' : 'Comenzar la ruta');
    var cta = u.unlocked
      ? '<button type="button" class="btn ' + (done ? 'btn--ghost' : 'btn--primary') + ' btn--block" data-action="start-mission" data-mission="' + esc(selected.id) + '">' + icon('play', 15) + ' ' + esc(startLabel) + '</button>'
      : '<button type="button" class="btn btn--block" disabled>' + icon('lock', 14) + ' Aún bloqueada</button>';
    var unlockNote = u.unlocked
      ? (done ? 'Ya completada. Puedes repetirla; la recompensa de cierre no se duplica.' : 'Todos los requisitos están cumplidos.')
      : 'Completa los requisitos para abrir este nodo.';
    detail = '<div class="detailAccent" style="--accent:' + selected.accent + '"></div>' +
      '<span class="eyebrow noRule" style="color:' + selected.accent + '">' + (selected.kind === 'boss' ? 'Guardián de la ruta' : 'Nodo ' + selected.index + ' · ' + esc(area.short)) + '</span>' +
      '<h2>' + esc(selected.title) + '</h2>' +
      '<p class="subtitle">' + esc(selected.subtitle) + '</p>' +
      '<div class="detailTags"><span class="chip">' + esc(selected.tierLabel) + '</span><span class="chip">' + selected.questionCount + ' preguntas</span>' + (done ? '<span class="chip chip--completed">' + icon('check', 10) + ' Completada</span>' : '') + (selected.feedback === 'diferida' ? '<span class="chip chip--gold">Clave al final</span>' : '') + '</div>' +
      '<p class="detailDesc">' + esc(selected.description) + '</p>' +
      '<div class="rewardList">' +
        '<div class="rewardLine"><span>' + icon('spark', 13) + ' Por acierto</span><b>' + (selected.kind === 'boss' ? '20–50' : selected.rewards.questionXp) + ' XP</b></div>' +
        '<div class="rewardLine"><span>' + icon('award', 13) + ' Cierre de ruta</span><b>+' + selected.rewards.xp + ' XP</b></div>' +
        '<div class="rewardLine"><span>' + icon('coin', 13) + ' Monedas de cierre</span><b>+' + selected.rewards.coins + '</b></div>' +
        (done ? '<div class="rewardLine"><span>' + icon('chart', 13) + ' Mejor precisión</span><b>' + Math.round((record.bestAccuracy || 0) * 100) + '%</b></div>' : '') +
      '</div>' +
      (reqs ? '<div class="reqList">' + reqs + '</div>' : '') +
      '<div class="detailActions">' + cta + '<button type="button" class="btn btn--ghost btn--sm btn--block" data-action="open-review">' + icon('rotate', 13) + ' Revisar errores' + (dueCount() ? ' (' + dueCount() + ')' : '') + '</button></div>' +
      '<p class="detailFootnote">' + esc(unlockNote) + '</p>';
  } else {
    detail = '<div class="emptyState"><div>' + icon('map', 28) + '</div><h3>Ruta sin nodos activos</h3><p>Esta isla todavía no tiene misiones jugables.</p></div>';
  }
  var completeAreas = CAMP.areas.filter(function (a) { return areaProgress(a.id).pct >= 1; }).length;
  return '<div class="overlay"><div class="overlayShell">' +
    '<div class="sheetHead">' +
      '<div><span class="eyebrow"><span class="kickerDot"></span>Bitácora de campaña</span><h1>Las cinco rutas, <em>un paso a la vez.</em></h1><p>18 nodos, cinco guardianes y una memoria que se construye respondiendo. Elige una isla y lee lo que exige su siguiente tramo.</p></div>' +
      '<div class="sheetHeadSide"><span class="chip">Etapa ' + state.stage + '/4 · ' + esc(stageInfo().name) + '</span><span class="chip">' + completeAreas + '/5 islas completas</span><button type="button" class="sheetClose" data-action="close-sheet" aria-label="Volver al observatorio">' + icon('close', 17) + '</button></div>' +
    '</div>' +
    '<div class="atlasGrid">' +
      '<aside><div class="areaList">' + areaTabs + '</div>' +
        '<div class="areaOverview"><span>Alcance del atlas</span><b>' + totalMissionsDone() + ' de 18 nodos</b><small>' + dueCount() + ' ' + plural(dueCount(), 'repaso pendiente', 'repasos pendientes') + ' · ' + Math.round(overallAccuracy() * 100) + '% de precisión global.</small></div>' +
      '</aside>' +
      '<section class="panel routePanel">' +
        '<div class="routeHead"><div><span class="eyebrow noRule" style="color:' + area.accent + '">Ruta ' + (CAMP.areas.findIndex(function (a) { return a.id === area.id; }) + 1) + ' · ' + esc(area.short) + '</span><h2>' + esc(area.title.replace(/^Área [IV]+ · /, '')) + '</h2><p class="small muted" style="margin:5px 0 0">' + esc(area.blurb) + '</p></div><div><div class="bar progressLine"><i style="width:' + Math.round(ap.pct * 100) + '%;background:' + area.accent + '"></i></div><small class="tiny dim" style="display:block;text-align:right;margin-top:5px">' + ap.done + '/' + ap.total + '</small></div></div>' +
        '<div class="routePath">' + nodes + '</div>' +
      '</section>' +
      '<aside class="panel detailPanel">' + detail + '</aside>' +
    '</div>' +
    '<div class="atlasFooter"><span>La afinidad por área es una guía editorial. Las preguntas y claves provienen del banco oficial de Psicología.</span><span>' + icon('info', 11) + ' Las recompensas de cierre se registran una sola vez.</span></div>' +
  '</div></div>';
}

/* -------------------------------------------------------------------------
   HÉROES
   ------------------------------------------------------------------------- */
function heroCardHTML(char) {
  var look = HERO_LOOKS[char.id];
  var owned = state.collection.ownedCharacterIds.indexOf(char.id) !== -1;
  var active = state.collection.selectedCharacterId === char.id;
  var req = heroRequirementState(char);
  var img = renderHeroPortrait(char.id, 300);
  var title = typeof titleText === 'function' ? titleText(char.id) : '';
  var frameColor = typeof frameColorFor === 'function' ? frameColorFor(char.id) : '';
  var action = owned ? 'data-action="select-hero" data-hero="' + esc(char.id) + '"' : 'data-action="open-recruit" data-hero="' + esc(char.id) + '"';
  var access = !owned
    ? '<span class="chip ' + (req.kind === 'reward' ? 'chip--gold' : '') + '">' + (req.kind === 'reward' ? icon('award', 9) + ' ' + (req.missionsHave || 0) + '/' + req.missionsNeed + ' misiones' : icon('lock', 9) + ' ' + (req.canRecruit ? 'Reclutar' : 'Bloqueado')) + '</span>'
    : (active ? '<span class="chip chip--accent">En ruta</span>' : '<span class="chip chip--completed">' + icon('check', 9) + ' En colección</span>');
  var cta = '';
  if (!owned) {
    if (req.kind === 'reward') {
      cta = '<span class="heroCardCta"><span>' + icon('award', 10) + ' Recompensa de recorrido</span><b>' + req.missionsHave + '/' + req.missionsNeed + '</b></span>';
    } else {
      cta = '<span class="heroCardCta"><span>' + icon('coin', 10) + ' Reclutar con monedas</span><b>◇ ' + formatNumber(req.price) + '</b></span>';
    }
  }
  return '<button type="button" class="heroCard ' + (active ? 'is-active ' : '') + (owned ? '' : 'is-locked') + '" style="--hero-accent:' + look.accent + '" ' + action + '>' +
    '<span class="heroCardTop"><span class="chip">' + esc(char.rarityLabel) + '</span>' + access + '</span>' +
    '<span class="heroPortrait"' + (frameColor ? ' style="box-shadow:0 0 0 1px ' + frameColor + ',0 0 22px ' + frameColor + '55"' : '') + '><img src="' + img + '" alt="Retrato de ' + esc(char.name) + '" /></span>' +
    '<span class="heroCardInfo"><b>' + esc(char.name) + '</b><small>' + esc(look.klass) + ' · ' + esc(look.weapon) + '</small>' + (title ? '<em class="heroCardTitle">«' + esc(title) + '»</em>' : '') + cta + '</span>' +
  '</button>';
}
function heroesScreenHTML() {
  var char = selectedCharacter();
  var look = selectedLook();
  var owned = state.collection.ownedCharacterIds.length;
  return '<div class="overlay"><div class="overlayShell">' +
    '<div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot"></span>Elenco del observatorio</span><h1>Diez formas de mirar <em>un mismo caso.</em></h1><p>Inspecciona tu colección y elige quién camina contigo. La selección se guarda al instante y se refleja en el mundo 3D.</p></div>' +
      '<div class="sheetHeadSide"><span class="chip">' + owned + '/10 héroes</span><span class="chip">' + countOwnedCosmetics() + '/' + countAllCosmetics() + ' cosméticos</span><button type="button" class="sheetClose" data-action="close-sheet" aria-label="Cerrar">' + icon('close', 17) + '</button></div>' +
    '</div>' +
    '<div class="heroToolbar"><span class="chip chip--accent"><span class="ownedMark">✓</span> ' + esc(char.name) + ' en ruta</span><span class="chip">' + esc(look.klass) + '</span><span class="chip">' + esc(look.weapon) + '</span>' + (equippedSummary() ? '<span class="chip">' + equippedSummary() + ' piezas equipadas</span>' : '') + '</div>' +
    '<div class="heroGrid">' + CAMP.characters.map(heroCardHTML).join('') + '</div>' +
    '<div class="heroNote"><p>Los héroes solo cambian la voz, la silueta y la lectura de cada ruta. Ninguno altera preguntas, claves ni recompensas. Toca un héroe bloqueado para consultar su reclutamiento original.</p><button type="button" class="btn btn--ghost btn--sm" data-action="close-sheet">Volver al atrio ' + icon('chevronRight', 12) + '</button></div>' +
    '<div class="atlasFooter"><span>Fase 2 · reglas originales de colección: Ilan inicial, Amaru por 5 misiones, Zenón en nivel 8 y el resto con monedas.</span><span>' + icon('spark', 11) + ' Modelos voxel generados en código.</span></div>' +
  '</div></div>';
}

/* -------------------------------------------------------------------------
   RECLUTAMIENTO DE HÉROES
   ------------------------------------------------------------------------- */
function recruitScreenHTML() {
  var char = CHARACTER_BY_ID[recruitHeroId];
  if (!char) return '';
  var look = HERO_LOOKS[char.id];
  var req = heroRequirementState(char);
  var lv = currentLevel();
  var owned = req.owned;
  var isReward = req.kind === 'reward';
  var can = !owned && req.canRecruit;
  var requirementRows = '';
  if (isReward) {
    requirementRows = '<div class="req ' + (req.canRecruit ? 'is-met' : '') + '">' + icon(req.canRecruit ? 'check' : 'lock', 12) + '<span>Completar ' + req.missionsNeed + ' misiones · ' + req.missionsHave + '/' + req.missionsNeed + '</span></div>';
  } else {
    if (req.levelNeed) requirementRows += '<div class="req ' + (req.levelMet ? 'is-met' : '') + '">' + icon(req.levelMet ? 'check' : 'lock', 12) + '<span>Nivel ' + req.levelNeed + ' · actual ' + lv + '</span></div>';
    requirementRows += '<div class="req ' + (req.coinsMet ? 'is-met' : '') + '">' + icon(req.coinsMet ? 'check' : 'lock', 12) + '<span>' + formatNumber(req.price) + ' monedas · tienes ' + formatNumber(state.coins) + '</span></div>';
  }
  var primary = '';
  if (owned) {
    primary = '<div class="notice"><b>Ya forma parte de tu colección.</b> Puedes cerrar esta ficha y elegirlo desde la arena.</div>';
  } else if (can) {
    primary = '<button type="button" class="btn ' + (isReward ? 'btn--gold' : 'btn--primary') + ' btn--lg btn--block" data-action="recruit-confirm">' + icon(isReward ? 'award' : 'spark', 16) + (isReward ? ' Reclamar héroe' : ' Reclutar por ' + formatNumber(req.price) + ' monedas') + '</button>' +
      '<p class="tiny dim" style="margin-top:7px">' + (isReward ? 'Esta recompensa no cuesta monedas.' : 'Se descontarán de tu saldo actual: ' + formatNumber(state.coins) + ' monedas. Sin dinero real.') + '</p>';
  } else {
    primary = '<button type="button" class="btn btn--block btn--lg" disabled>' + icon('lock', 16) + ' Reclutamiento bloqueado</button><p class="tiny dim" style="margin-top:7px">' + esc(req.reason) + '</p>';
  }
  var attrs = char.attributes || {};
  var attrRows = Object.keys(attrs).slice(0, 5).map(function (key) {
    return '<div class="recruitAttr"><span>' + esc(key.charAt(0).toUpperCase() + key.slice(1)) + '</span><span class="bar"><i style="width:' + Number(attrs[key]) + '%;background:' + look.accent + '"></i></span><b>' + Number(attrs[key]) + '</b></div>';
  }).join('');
  return '<div class="overlay"><div class="overlayShell" style="max-width:1080px">' +
    '<div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot" style="background:' + look.accent + ';box-shadow:0 0 12px ' + look.accent + '"></span>Ecos de la colección</span><h1>Un nuevo rostro <em>para el observatorio.</em></h1><p>Las reglas de la app original se conservan: Ilan es inicial, Amaru se gana con misiones, Zenón exige nivel 8 y los demás se reclutan con monedas de estudio.</p></div>' +
      '<div class="sheetHeadSide"><span class="chip">' + state.collection.ownedCharacterIds.length + '/10 en colección</span><button type="button" class="sheetClose" data-action="close-sheet" aria-label="Cerrar">' + icon('close', 17) + '</button></div>' +
    '</div>' +
    '<div class="recruitGrid">' +
      '<section class="recruitPortrait" style="--hero-accent:' + look.accent + '">' +
        '<div class="recruitHalo"></div>' +
        '<img src="' + renderHeroPortrait(char.id, 540) + '" alt="' + esc(char.name) + '" />' +
        '<div class="recruitQuote">“' + esc(char.quote) + '”</div>' +
      '</section>' +
      '<section class="panel recruitBody">' +
        '<div class="detailTags"><span class="chip">' + esc(char.rarityLabel) + '</span><span class="chip">' + esc(look.klass) + '</span><span class="chip">' + esc(look.weapon) + '</span></div>' +
        '<h2>' + esc(char.name) + '</h2><p class="recruitSubtitle">' + esc(char.title) + ' · ' + esc(areaName(char.areaAffinity)) + '</p>' +
        '<p class="detailDesc">' + esc(char.description) + '</p>' +
        '<div class="recruitAttrs">' + attrRows + '</div>' +
        '<div class="sectionDivider"></div>' +
        '<span class="eyebrow noRule">Requisitos originales</span>' +
        '<div class="reqList">' + requirementRows + '</div>' +
        '<div class="recruitBalance"><span>Tu saldo</span><b>◇ ' + formatNumber(state.coins) + '</b></div>' +
        '<div class="recruitActions">' + primary + '<button type="button" class="btn btn--quiet btn--block btn--sm" data-action="close-sheet">Volver a los héroes</button></div>' +
        '<p class="detailFootnote">La compra se registra en tu guardado local. Los héroes no alteran preguntas, claves ni recompensas de ruta.</p>' +
      '</section>' +
    '</div>' +
  '</div></div>';
}

/* -------------------------------------------------------------------------
   REPASO
   ------------------------------------------------------------------------- */
function reviewScreenHTML() {
  var stats = errorStats();
  var due = dueErrors();
  var errors = Object.keys(state.errors).map(function (id) { return state.errors[id]; }).filter(function (e) { return e && QUESTION_BY_ID[e.questionId]; });
  errors.sort(function (a, b) {
    var ad = parseDate(a.nextReviewAt), bd = parseDate(b.nextReviewAt);
    var at = ad ? ad.getTime() : 0, bt = bd ? bd.getTime() : 0;
    if (!!a.recoveredAt !== !!b.recoveredAt) return a.recoveredAt ? 1 : -1;
    return at - bt;
  });
  var rows = errors.map(function (e) {
    var q = QUESTION_BY_ID[e.questionId];
    var isDue = !e.nextReviewAt || (parseDate(e.nextReviewAt) && parseDate(e.nextReviewAt).getTime() <= Date.now());
    var status = e.recoveredAt ? 'Recuperada' : (isDue ? 'Toca repasar' : 'Programada');
    var statusCls = e.recoveredAt ? 'chip chip--completed' : (isDue ? 'chip chip--gold' : 'chip');
    return '<div class="errorRow">' +
      '<span class="errorStatus ' + (e.recoveredAt ? 'is-recovered' : (isDue ? 'is-due' : '')) + '"></span>' +
      '<div class="errorCopy"><b>' + esc(q.stem.slice(0, 170)) + (q.stem.length > 170 ? '…' : '') + '</b>' +
        '<small><span>' + icon('compass', 10) + ' ' + esc(areaName(q.areaId)) + '</span><span>' + icon('rotate', 10) + ' ' + (e.count || 0) + ' ' + plural(e.count || 0, 'fallo', 'fallos') + '</span><span>' + icon('clock', 10) + ' ' + (e.recoveredAt ? 'recuperada ' + timeAgo(e.lastCorrectAt) : timeUntil(e.nextReviewAt)) + '</span></small>' +
      '</div>' +
      '<div class="errorSide"><span class="' + statusCls + '">' + status + '</span>' + (typeof tagButtonsHTML === 'function' ? tagButtonsHTML(q.id, true) : '') + '</div>' +
    '</div>';
  }).join('');
  var body = errors.length
    ? '<div class="panel reviewList"><div class="reviewListHead"><h2>Tu errorario</h2><span class="chip">' + errors.length + ' preguntas</span></div>' + rows + '</div>'
    : '<div class="emptyState"><div style="color:var(--muted)">' + icon('checkCircle', 28) + '</div><h3>Tu errorario está vacío.</h3><p>Cuando una respuesta falle, aparecerá aquí con su fecha de repaso. No se borra: se convierte en una cita contigo.</p></div>';
  var canEarly = errors.length > 0;
  return '<div class="overlay"><div class="overlayShell">' +
    '<div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot" style="background:var(--amber);box-shadow:0 0 12px var(--amber)"></span>Repetición espaciada</span><h1>Volver a mirar <em>también es avanzar.</em></h1><p>Cada fallo entra en un calendario de repaso. La primera cita es a los 20 minutos; después, 1, 3, 7, 14 y 30 días. Recuperar una pregunta no inventa dominio: lo demuestra.</p></div>' +
      '<div class="sheetHeadSide"><span class="chip chip--gold">' + stats.due + ' por repasar</span><button type="button" class="sheetClose" data-action="close-sheet" aria-label="Cerrar">' + icon('close', 17) + '</button></div>' +
    '</div>' +
    '<div class="reviewTop"><div class="stat"><b>' + stats.pending + '</b><span>pendientes</span></div><div class="stat stat--gold"><b>' + stats.due + '</b><span>listas ahora</span></div><div class="stat stat--accent"><b>' + stats.recovered + '</b><span>recuperadas</span></div><div class="stat"><b>' + stats.mastered + '</b><span>con 2 repasos</span></div></div>' +
    '<div class="reviewBody"><div>' + (typeof reviewTagsHTML === 'function' ? reviewTagsHTML() : '') + body + '</div>' +
      '<aside class="panel reviewSide"><span class="eyebrow noRule">Sesión de repaso</span><h3>' + (due.length ? due.length + ' ' + plural(due.length, 'pregunta lista', 'preguntas listas') : 'Nada toca todavía') + '</h3><p>Un repaso es una sesión breve de hasta ' + (RULES.reviewPerSession || 8) + ' preguntas. Responder bien actualiza su próximo intervalo; responder mal vuelve a empezar la cuenta sin borrar tu XP anterior.</p>' +
        '<div class="reviewRule"><b>' + icon('clock', 13) + '</b><span>Primera revisión: 20 minutos después del fallo.<br />Aciertos posteriores: 1, 3, 7, 14 y 30 días.</span></div>' +
        '<div class="reviewRule"><b>' + icon('spark', 13) + '</b><span>La práctica correcta y espaciada sí eleva el dominio. Repetir de inmediato no lo acelera.</span></div>' +
        '<div class="reviewActions">' +
          '<button type="button" class="btn btn--gold btn--block" data-action="start-review" data-mode="due" ' + (due.length ? '' : 'disabled') + '>' + icon('rotate', 14) + ' Repasar lo que toca' + (due.length ? ' (' + due.length + ')' : '') + '</button>' +
          '<button type="button" class="btn btn--ghost btn--block btn--sm" data-action="start-review" data-mode="early" ' + (canEarly ? '' : 'disabled') + '>Repaso anticipado ' + icon('chevronRight', 12) + '</button>' +
          '<button type="button" class="btn btn--quiet btn--block btn--sm" data-action="close-sheet">Volver al observatorio</button>' +
        '</div>' +
        '<p class="tiny dim" style="margin-top:10px">El repaso anticipado sirve para practicar, pero el intervalo de cada pregunta se recalcula al responder. Solo se puede cobrar el bono diario una vez.</p>' +
      '</aside>' +
    '</div>' +
  '</div></div>';
}

/* -------------------------------------------------------------------------
   IMPORTACIÓN
   ------------------------------------------------------------------------- */
function importPreviewHTML() {
  if (!importPreview) return '';
  var s = importPreview.summary;
  var difficulties = s.difficulties && s.difficulties.length
    ? '<div class="notice" style="margin-top:9px"><b>Nota de migración.</b> ' + esc(s.difficulties.join('; ')) + ' no se incluyen porque no forman parte de la campaña autónoma.</div>'
    : '';
  return '<div class="importPreview"><h3>' + icon('checkCircle', 14) + ' Partida reconocida</h3>' +
    '<div class="previewName">' + esc(s.name) + '</div>' +
    '<div class="previewGrid">' +
      '<div><span>Nivel</span><b>' + s.level + '</b></div>' +
      '<div><span>Rango</span><b>' + esc(s.rank) + '</b></div>' +
      '<div><span>XP</span><b>' + formatNumber(s.xp) + '</b></div>' +
      '<div><span>Monedas</span><b>' + formatNumber(s.coins) + '</b></div>' +
      '<div><span>Héroes</span><b>' + s.ownedCharacters + '</b></div>' +
      '<div><span>Cosméticos</span><b>' + s.ownedCosmetics + '</b></div>' +
      '<div><span>Logros</span><b>' + s.achievements + '</b></div>' +
      '<div><span>Nodos</span><b>' + s.missions + '</b></div>' +
      '<div><span>Errores</span><b>' + s.errors + '</b></div>' +
      '<div><span>Etapa</span><b>' + s.stage + '/4</b></div>' +
    '</div>' + difficulties +
    '<div style="display:flex;gap:7px;margin-top:10px;flex-wrap:wrap"><button type="button" class="btn btn--primary btn--sm" data-action="import-confirm">' + icon('upload', 13) + ' Importar esta partida</button><button type="button" class="btn btn--ghost btn--sm" data-action="import-clear">Cancelar vista previa</button></div>' +
  '</div>';
}
function importScreenHTML() {
  var local = findLegacyLocalState();
  return '<div class="overlay"><div class="overlayShell" style="max-width:1080px">' +
    '<div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot" style="background:var(--teal);box-shadow:0 0 12px var(--teal)"></span>Continuidad de tu historia</span><h1>Trae tu partida <em>al observatorio.</em></h1><p>Importa la partida antigua de SERUMS QUEST o un respaldo JSON nuevo de esta versión. Verás una vista previa antes de reemplazar; el archivo original no se modifica.</p></div>' +
      '<div class="sheetHeadSide"><button type="button" class="sheetClose" data-action="close-sheet" aria-label="Cerrar">' + icon('close', 17) + '</button></div>' +
    '</div>' +
    '<div class="importGrid">' +
      '<section class="panel importCard"><span class="eyebrow noRule">Tu progreso anterior</span><h2>Un archivo, cinco rutas.</h2><p>En la versión 1.2 abre <b>Ajustes → Exportar progreso</b>. Guarda el archivo y tráelo aquí.</p>' +
        '<input type="file" id="legacyFile" accept="application/json,.json" hidden />' +
        '<button type="button" class="dropZone" data-action="legacy-file" style="width:100%;cursor:pointer">' +
          '<span>' + icon('upload', 28) + '<br /><b>Elegir archivo JSON</b><br />o arrástralo sobre esta zona</span>' +
        '</button>' +
        (local ? '<div class="notice" style="margin-top:10px"><b>Hay una partida local compatible.</b> Encontramos datos de SERUMS QUEST guardados en este navegador.<br /><button type="button" class="btn btn--gold btn--sm" style="margin-top:8px" data-action="legacy-local">Usar partida local</button></div>' : '') +
        '<div class="importOr">o pega el contenido</div>' +
        '<textarea class="inputArea" id="legacyText" placeholder="{ &quot;app&quot;: &quot;SERUMS QUEST&quot;, ... }">' + esc(importText) + '</textarea>' +
        '<div class="importActions"><button type="button" class="btn btn--soft btn--sm" data-action="legacy-analyze">' + icon('eye', 13) + ' Analizar JSON</button><button type="button" class="btn btn--quiet btn--sm" data-action="legacy-clear">Limpiar</button></div>' +
        (importError ? '<div class="notice" style="margin-top:9px;border-color:rgba(255,139,157,.3);color:#ffd3da"><b>No se pudo leer.</b> ' + esc(importError) + '</div>' : '') +
        importPreviewHTML() +
      '</section>' +
      '<aside class="panel importCard importGuide"><span class="eyebrow noRule">Qué viaja contigo</span><h2>Tu historia, no tu interfaz.</h2>' +
        '<div class="importStep"><span class="importStepNum">1</span><div><b>Se importa:</b> nivel, XP, monedas, etapa, precisión, misiones completadas, preguntas falladas, logros, colección de héroes y cosméticos, equipamiento compatible.</div></div>' +
        '<div class="importStep"><span class="importStepNum">2</span><div><b>Se adapta:</b> las preguntas que pertenecen a las 18 misiones jugables. El resto se conserva en tu instalación anterior, no se inventa aquí.</div></div>' +
        '<div class="importStep"><span class="importStepNum">3</span><div><b>Se mantiene:</b> tu archivo original y tu guardado actual (se conserva una copia previa antes de reemplazar).</div></div>' +
        '<div class="notice" style="margin-top:13px"><b>Sin prisa.</b> Importar no borra la copia original de SERUMS QUEST. Puedes volver a exportar y repetir cuando quieras.</div>' +
        '<div class="importWarning">El guardado nuevo vive en este navegador. Si pruebas el HTML final en otro navegador, vuelve a importar el mismo archivo.</div>' +
      '</aside>' +
    '</div>' +
    '<div class="atlasFooter"><span>Compatible con SERUMS QUEST 1.2 y con respaldos del observatorio (esquema 2).</span><span>' + icon('shield', 11) + ' Importación local; sin servidores.</span></div>' +
  '</div></div>';
}

/* -------------------------------------------------------------------------
   PAUSA Y AJUSTES
   ------------------------------------------------------------------------- */
function pauseScreenHTML() {
  var inDuel = pauseReturn === 'duel' && !!session;
  var char = selectedCharacter();
  var lv = levelAt(state.xp);
  var due = dueCount();
  var pauseTitle = inDuel ? 'El tiempo se detiene.' : 'Una pausa en el observatorio.';
  var mainActions = inDuel
    ? '<button type="button" class="btn btn--primary btn--block" data-action="close-pause">' + icon('play', 15) + ' Reanudar el duelo</button>' +
      '<button type="button" class="btn btn--ghost btn--block" data-action="suspend-duel-map">' + icon('map', 14) + ' Volver al mapa</button>' +
      '<button type="button" class="btn btn--ghost btn--block" data-action="suspend-duel-menu">' + icon('home', 14) + ' Salir al menú</button>' +
      '<button type="button" class="btn btn--ghost btn--block" data-action="open-settings">' + icon('settings', 14) + ' Ajustes</button>' +
      '<button type="button" class="btn btn--danger btn--block" data-action="abandon-duel">' + icon('close', 14) + ' Abandonar la ruta</button>'
    : '<button type="button" class="btn btn--primary btn--block" data-action="close-pause">' + icon('play', 15) + ' Continuar</button>' +
      '<button type="button" class="btn btn--ghost btn--block" data-action="open-modes">' + icon('seal', 14) + ' Modos de juego</button>' +
      '<button type="button" class="btn btn--ghost btn--block" data-action="open-stats">' + icon('chart', 14) + ' Estadísticas</button>' +
      '<button type="button" class="btn btn--ghost btn--block" data-action="open-map">' + icon('map', 14) + ' Abrir mapa de avance</button>' +
      '<button type="button" class="btn btn--ghost btn--block" data-action="open-journal">' + icon('book', 14) + ' Abrir bitácora de rutas</button>' +
      '<button type="button" class="btn btn--ghost btn--block" data-action="open-heroes">' + icon('user', 14) + ' Elegir héroe</button>' +
      '<button type="button" class="btn btn--ghost btn--block" data-action="open-wardrobe">' + icon('layers', 14) + ' Inventario y atuendo</button>' +
      '<button type="button" class="btn btn--ghost btn--block" data-action="open-shop">' + icon('bag', 14) + ' Tienda de ecos</button>' +
      '<button type="button" class="btn btn--ghost btn--block" data-action="open-review">' + icon('rotate', 14) + ' Repaso de errores' + (due ? ' · ' + due : '') + '</button>' +
      '<button type="button" class="btn btn--ghost btn--block" data-action="open-settings">' + icon('settings', 14) + ' Ajustes de audio y accesibilidad</button>' +
      '<button type="button" class="btn btn--ghost btn--block" data-action="open-import">' + icon('upload', 14) + ' Importar una partida</button>' +
      '<button type="button" class="btn btn--quiet btn--block btn--sm" data-action="exit-title">Salir al menú</button>';
  return '<div class="overlay"><div class="overlayShell" style="max-width:980px">' +
    '<div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot"></span>Pausa</span><h1>' + esc(pauseTitle) + '</h1><p>' + (inDuel ? 'Nada avanza mientras estás aquí. Al volver retomarás exactamente la pregunta pendiente.' : 'Tu progreso ya está guardado. Revisa una ruta, cambia de voz o vuelve al atrio.') + '</p></div><div class="sheetHeadSide"><button type="button" class="sheetClose" data-action="close-pause" aria-label="Cerrar pausa">' + icon('close', 17) + '</button></div></div>' +
    '<div class="pauseGrid">' +
      '<section class="panel pauseMain"><span class="eyebrow noRule">Decisiones disponibles</span><h1>' + (inDuel ? 'Respira. La pregunta espera.' : 'El observatorio sigue aquí.') + '</h1><p>' + (inDuel ? 'El guardián conserva tu avance y tus corazones.' : 'Tu nivel, tus monedas y tus rutas están escritos en la bitácora local.') + '</p><div class="pauseActions">' + mainActions + '</div></section>' +
      '<aside class="pauseSide">' +
        '<section class="panel pauseStats"><div class="profileMeta"><span class="heroAvatar"' + (frameColorFor(char.id) ? ' style="box-shadow:0 0 0 2px ' + frameColorFor(char.id) + ',0 0 18px ' + frameColorFor(char.id) + '66"' : '') + '><img src="' + renderHeroPortrait(char.id, 180) + '" alt="" /></span><div><b>' + esc(char.name) + '</b><small>' + esc(lookClass(char.id)) + ' · ' + esc(lookWeapon(char.id)) + '</small>' + (titleText(char.id) ? '<em class="profileTitle">«' + esc(titleText(char.id)) + '»</em>' : '') + '</div></div>' +
          '<div class="statRow" style="grid-template-columns:repeat(2,1fr)"><div class="stat"><b>' + lv.level + '</b><span>nivel</span></div><div class="stat stat--gold"><b>' + formatNumber(state.coins) + '</b><span>monedas</span></div><div class="stat stat--accent"><b>' + totalMissionsDone() + '</b><span>nodos</span></div><div class="stat"><b>' + due + '</b><span>repasos</span></div></div>' +
          '<div class="sectionDivider"></div><div class="progressRows">' +
            '<div class="progressRow"><span>Progreso de nivel</span><b>' + lv.into + '/' + lv.needed + ' XP</b><span class="bar"><i style="width:' + lv.percent + '%"></i></span></div>' +
            '<div class="progressRow"><span>Etapa ' + state.stage + ' · ' + esc(stageInfo().name) + '</span><b>' + esc(stageInfo().criteria) + '</b></div>' +
          '</div></section>' +
        '<section class="panel pauseStats"><span class="eyebrow noRule">Ajustes y memoria</span><h3>Audio y datos</h3>' +
          '<div class="settingsRow"><div><b>Efectos de sonido</b><small>Respuestas, impactos y transiciones.</small></div><button type="button" class="toggle ' + (state.settings.sound ? 'is-on' : '') + '" data-action="toggle-sound" aria-label="Alternar sonido" aria-pressed="' + state.settings.sound + '"></button></div>' +
          '<div class="settingsRow"><div><b>Ambiente del observatorio</b><small>Pad sintetizado de baja intensidad.</small></div><button type="button" class="toggle ' + (state.settings.ambient ? 'is-on' : '') + '" data-action="toggle-ambient" aria-label="Alternar ambiente" aria-pressed="' + state.settings.ambient + '"></button></div>' +
          '<div class="settingsRow"><div><b>Silencio total</b><small>Silencia efectos y ambiente.</small></div><button type="button" class="toggle ' + (state.settings.muted ? 'is-on' : '') + '" data-action="toggle-muted" aria-label="Alternar silencio" aria-pressed="' + state.settings.muted + '"></button></div>' +
          '<label class="volumeRow"><span><b>Volumen</b><small>Efectos y ambiente.</small></span><input type="range" min="0" max="100" value="' + Math.round((state.settings.volume == null ? 0.7 : state.settings.volume) * 100) + '" data-volume aria-label="Volumen" /><em data-volume-label>' + Math.round((state.settings.volume == null ? 0.7 : state.settings.volume) * 100) + '%</em></label>' +
          '<div class="settingsRow"><div><b>Reducir movimiento</b><small>Desactiva animaciones decorativas.</small></div><button type="button" class="toggle ' + (state.settings.reducedMotion ? 'is-on' : '') + '" data-action="toggle-reduced-motion" aria-label="Alternar movimiento reducido" aria-pressed="' + state.settings.reducedMotion + '"></button></div>' +
          '<div class="settingsRow"><div><b>Tiempo extra en Contrarreloj</b><small>+25 % en el límite de sesión.</small></div><button type="button" class="toggle ' + (state.settings.extraTime ? 'is-on' : '') + '" data-action="toggle-extra-time" aria-label="Alternar tiempo extra" aria-pressed="' + state.settings.extraTime + '"></button></div>' +
        '<div class="settingsRow settingsRow--stack"><div><b>Calidad de efectos</b><small>Más resolución y partículas = más carga. La calidad baja ayuda en táctiles o sin aceleración.</small></div><div class="qualityOptions">' + ['bajo', 'medio', 'alto'].map(function (q) { return '<button type="button" class="qualityBtn ' + (state.settings.effectsQuality === q ? 'is-active' : '') + '" data-action="set-effects-quality" data-quality="' + q + '">' + (q === 'bajo' ? 'Baja' : q === 'alto' ? 'Alta' : 'Media') + '</button>'; }).join('') + '</div></div>' +
        qualityHelpHTML() +
        '<div class="settingsRow"><div><b>Tamaño del texto</b><small>Amplía la lectura de preguntas, paneles y ayudas.</small></div><div class="qualityOptions"><button type="button" class="qualityBtn ' + (state.settings.textScale !== 'grande' ? 'is-active' : '') + '" data-action="set-text-scale" data-scale="normal">Normal</button><button type="button" class="qualityBtn ' + (state.settings.textScale === 'grande' ? 'is-active' : '') + '" data-action="set-text-scale" data-scale="grande">Grande</button></div></div>' +
        '<div class="settingsRow"><div><b>Alto contraste</b><small>Refuerza texto secundario, bordes y separación de paneles.</small></div><button type="button" class="toggle ' + (state.settings.highContrast ? 'is-on' : '') + '" data-action="toggle-contrast" aria-label="Alternar alto contraste" aria-pressed="' + state.settings.highContrast + '"></button></div>' +
        '<div class="settingsRow"><div><b>Recordatorio semanal de respaldo</b><small>Un aviso neutral si llevas días sin exportar. Puedes silenciarlo.</small></div><button type="button" class="toggle ' + (state.settings.backupReminder ? 'is-on' : '') + '" data-action="toggle-backup-reminder" aria-label="Alternar recordatorio de respaldo" aria-pressed="' + state.settings.backupReminder + '"></button></div>' +

          '</div></div>' +
          '<div class="settingsRow"><div><b>Marcos holográficos 3D</b><small>Oculta los aros que flotan detrás del héroe; el marco del retrato se conserva.</small></div><button type="button" class="toggle ' + (!state.settings.hide3dFrames ? 'is-on' : '') + '" data-action="toggle-3d-frames" aria-label="Alternar marcos holográficos" aria-pressed="' + (!state.settings.hide3dFrames) + '"></button></div>' +
          '<div class="settingsActions"><button type="button" class="btn btn--ghost btn--sm" data-action="export-save">' + icon('download', 13) + ' Exportar partida</button><button type="button" class="btn btn--ghost btn--sm" data-action="open-import">' + icon('upload', 13) + ' Importar</button><button type="button" class="btn btn--ghost btn--sm" data-action="open-settings">' + icon('settings', 13) + ' Ajustes completos</button></div>' +
          '<div class="settingsRow" style="margin-top:4px"><div><b>Reiniciar progreso</b><small>Guarda una copia de seguridad antes de vaciar el observatorio.</small></div><button type="button" class="btn btn--danger btn--sm" data-action="reset-progress" data-armed="' + (Date.now() < resetArmedUntil ? 'true' : 'false') + '">' + (Date.now() < resetArmedUntil ? 'Confirmar reinicio' : 'Reiniciar') + '</button></div>' +
          '<p class="tiny dim" style="margin:6px 0 0">Progreso local · guardado en este navegador · ' + esc(APP_VERSION) + '</p>' +
          (abandonArmedUntil > Date.now() ? '<div class="notice" style="margin-top:9px"><b>¿Abandonar la ruta?</b> Pulsa de nuevo el botón rojo en los próximos segundos. Las respuestas dadas se conservan, pero no habrá recompensa de cierre.</div>' : '') +
        '</section>' +
      '</aside>' +
    '</div>' +
  '</div></div>';
}
function lookClass(id) { return (HERO_LOOKS[id] || HERO_LOOKS.ilan).klass; }
function lookWeapon(id) { return (HERO_LOOKS[id] || HERO_LOOKS.ilan).weapon; }

function settingsScreenHTML() {
  var volume = Math.round((state.settings.volume == null ? 0.7 : state.settings.volume) * 100);
  var quality = state.settings.effectsQuality || 'medio';
  return '<div class="overlay"><div class="overlayShell settingsShell">' +
    '<div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot"></span>Ajustes del observatorio</span><h1>Que la ruta <em>se adapte a ti.</em></h1><p>Audio, efectos y accesibilidad. Nada de esto altera preguntas, claves ni recompensas.</p></div><div class="sheetHeadSide"><button type="button" class="sheetClose" data-action="close-settings" aria-label="Cerrar ajustes">' + icon('close', 17) + '</button></div></div>' +
    '<div class="settingsPanelGrid">' +
      '<section class="panel settingsPanel"><span class="eyebrow noRule">Audio</span><h3>Sonido y ambiente</h3>' +
        '<div class="settingsRow"><div><b>Efectos de sonido</b><small>Respuestas, impactos y transiciones.</small></div><button type="button" class="toggle ' + (state.settings.sound ? 'is-on' : '') + '" data-action="toggle-sound" aria-label="Alternar sonido" aria-pressed="' + state.settings.sound + '"></button></div>' +
        '<div class="settingsRow"><div><b>Ambiente del observatorio</b><small>Pad sintetizado de baja intensidad.</small></div><button type="button" class="toggle ' + (state.settings.ambient ? 'is-on' : '') + '" data-action="toggle-ambient" aria-label="Alternar ambiente" aria-pressed="' + state.settings.ambient + '"></button></div>' +
        '<div class="settingsRow"><div><b>Silencio total</b><small>Silencia efectos y ambiente sin perder tus preferencias.</small></div><button type="button" class="toggle ' + (state.settings.muted ? 'is-on' : '') + '" data-action="toggle-muted" aria-label="Alternar silencio" aria-pressed="' + state.settings.muted + '"></button></div>' +
        '<p class="settingsHelp">El audio empieza apagado. Actívalo aquí o con el icono de sonido; el volumen se guarda para la próxima sesión.</p>' +
        '<label class="volumeRow"><span><b>Volumen</b><small>Se aplica a efectos y ambiente.</small></span><input type="range" min="0" max="100" value="' + volume + '" data-volume aria-label="Volumen" /><em data-volume-label>' + volume + '%</em></label>' +
        '<div class="settingsActions"><button type="button" class="btn btn--ghost btn--sm" data-action="export-save">' + icon('download', 13) + ' Exportar partida</button><button type="button" class="btn btn--ghost btn--sm" data-action="open-import">' + icon('upload', 13) + ' Importar</button></div>' +
      '</section>' +
      '<section class="panel settingsPanel"><span class="eyebrow noRule">Accesibilidad</span><h3>Movimiento y lectura</h3>' +
        '<div class="settingsRow"><div><b>Reducir movimiento</b><small>Desactiva animaciones y transiciones decorativas.</small></div><button type="button" class="toggle ' + (state.settings.reducedMotion ? 'is-on' : '') + '" data-action="toggle-reduced-motion" aria-label="Alternar movimiento reducido" aria-pressed="' + state.settings.reducedMotion + '"></button></div>' +
        '<div class="settingsRow"><div><b>Tiempo extra en Contrarreloj</b><small>Amplía un 25 % el límite de la sesión. No cambia las preguntas ni el porcentaje de aprobación.</small></div><button type="button" class="toggle ' + (state.settings.extraTime ? 'is-on' : '') + '" data-action="toggle-extra-time" aria-label="Alternar tiempo extra" aria-pressed="' + state.settings.extraTime + '"></button></div>' +
        '<div class="settingsRow settingsRow--stack"><div><b>Calidad de efectos</b><small>Menos partículas = más fluidez en equipos modestos.</small></div><div class="qualityOptions">' + ['bajo', 'medio', 'alto'].map(function (q) { return '<button type="button" class="qualityBtn ' + (quality === q ? 'is-active' : '') + '" data-action="set-effects-quality" data-quality="' + q + '">' + (q === 'bajo' ? 'Baja' : q === 'alto' ? 'Alta' : 'Media') + '</button>'; }).join('') + '</div></div>' +
        qualityHelpHTML() +
        '<div class="settingsRow"><div><b>Tamaño del texto</b><small>Amplía la lectura de preguntas, paneles y ayudas.</small></div><div class="qualityOptions"><button type="button" class="qualityBtn ' + (state.settings.textScale !== 'grande' ? 'is-active' : '') + '" data-action="set-text-scale" data-scale="normal">Normal</button><button type="button" class="qualityBtn ' + (state.settings.textScale === 'grande' ? 'is-active' : '') + '" data-action="set-text-scale" data-scale="grande">Grande</button></div></div>' +
        '<div class="settingsRow"><div><b>Alto contraste</b><small>Refuerza texto secundario, bordes y separación de paneles.</small></div><button type="button" class="toggle ' + (state.settings.highContrast ? 'is-on' : '') + '" data-action="toggle-contrast" aria-label="Alternar alto contraste" aria-pressed="' + state.settings.highContrast + '"></button></div>' +
        '<div class="settingsRow"><div><b>Recordatorio semanal de respaldo</b><small>Un aviso neutral si llevas días sin exportar. Puedes silenciarlo.</small></div><button type="button" class="toggle ' + (state.settings.backupReminder ? 'is-on' : '') + '" data-action="toggle-backup-reminder" aria-label="Alternar recordatorio de respaldo" aria-pressed="' + state.settings.backupReminder + '"></button></div>' +
        '<div class="settingsRow"><div><b>Marcos holográficos 3D</b><small>Oculta los aros flotantes; el marco del retrato se conserva.</small></div><button type="button" class="toggle ' + (!state.settings.hide3dFrames ? 'is-on' : '') + '" data-action="toggle-3d-frames" aria-label="Alternar marcos holográficos" aria-pressed="' + (!state.settings.hide3dFrames) + '"></button></div>' +
        '<p class="settingsHelp">Contraste alto, foco visible y controles por teclado. En móvil, arrastra y usa los botones táctiles. Los colores de rareza no son la única señal: cada estado lleva texto.</p>' +
      '</section>' +
      '<section class="panel settingsPanel settingsPanel--wide"><span class="eyebrow noRule">Datos</span><h3>Progreso local</h3>' + (storageEnabled ? '' : '<div class="notice notice--danger"><b>Almacenamiento bloqueado.</b> Este navegador no permite guardar. Exporta un respaldo antes de cerrar; el progreso de esta sesión no persistirá.</div>') + '<p class="settingsHelp">Tu partida vive solo en este navegador. Exporta un respaldo nuevo (JSON con vista previa al importar) o importa la partida antigua. También puedes guardar una copia local para recuperación.</p><div class="settingsActions"><button type="button" class="btn btn--primary btn--sm" data-action="export-save">' + icon('download', 13) + ' Exportar partida</button><button type="button" class="btn btn--ghost btn--sm" data-action="open-import">' + icon('upload', 13) + ' Importar partida</button><button type="button" class="btn btn--ghost btn--sm" data-action="save-local-backup">' + icon('shield', 13) + ' Guardar copia local</button><button type="button" class="btn btn--danger btn--sm" data-action="reset-progress" data-armed="' + (Date.now() < resetArmedUntil ? 'true' : 'false') + '">' + (Date.now() < resetArmedUntil ? 'Confirmar reinicio' : 'Reiniciar progreso') + '</button></div><div class="settingsActions" style="margin-top:7px"><button type="button" class="btn btn--ghost btn--sm" data-action="open-help">' + icon('bookOpen', 13) + ' Ayuda</button><button type="button" class="btn btn--ghost btn--sm" data-action="open-tutorial">' + icon('compass', 13) + ' Repetir tutorial</button><button type="button" class="btn btn--ghost btn--sm" data-action="open-credits">' + icon('seal', 13) + ' Créditos y licencias</button></div></section>' +
    '</div>' +
    '<div class="settingsFoot"><span>' + settingsVersionLine() + ' · sin conexión y sin cuentas</span><button type="button" class="btn btn--ghost btn--sm" data-action="close-settings">Volver ' + icon('chevronRight', 11) + '</button></div>' +
  '</div></div>';
}

/* -------------------------------------------------------------------------
   DUELO
   ------------------------------------------------------------------------- */
function currentQuestion() {
  if (!session) return null;
  var qid = session.questions[session.cursor];
  return qid ? QUESTION_BY_ID[qid] : null;
}
function duelScreenHTML() {
  if (!session) return '';
  var q = currentQuestion();
  if (!q) return '';
  var area = AREA_BY_ID[session.areaId] || CAMP.areas[0];
  var feedback = lastFeedback;
  var boss = session.mode === 'boss';
  var isMode = ['daily', 'survival', 'timed', 'simulacro', 'practice'].indexOf(session.mode) !== -1;
  var deferred = !!(feedback && feedback.deferred);
  var modeLabel = session.mode === 'daily' ? 'Desafío diario' : session.mode === 'survival' ? 'Supervivencia' : session.mode === 'timed' ? 'Contrarreloj' : session.mode === 'simulacro' ? 'Simulacro' : session.mode === 'practice' ? 'Práctica libre' : '';
  var guardianName = isMode ? 'Observatorio de las Cinco Rutas' : (guardian ? guardian.name : 'Guardián de la ruta');
  var showHearts = !isMode || session.mode === 'survival';
  var optionHtml = q.options.map(function (o) {
    var cls = 'answerBtn';
    if (feedback) {
      cls += ' is-muted';
      if (!deferred) {
        if (feedback.chosen === o.id) cls += feedback.correct ? ' is-correct' : ' is-wrong';
        if (!boss && o.id === q.answer) cls += ' is-correct';
      }
    }
    return '<button type="button" class="' + cls + '" data-action="answer" data-letter="' + esc(o.id) + '" ' + (feedback ? 'disabled' : '') + '>' +
      '<span class="answerKey">' + esc(o.id) + '</span><span>' + esc(o.text) + '</span>' +
    '</button>';
  }).join('');
  var dots = session.questions.map(function (_, idx) {
    var cls = 'qDot';
    if (session.answers[session.questions[idx]]) cls += ' is-done';
    if (idx === session.cursor) cls += ' is-current';
    return '<span class="' + cls + '"></span>';
  }).join('');
  var hearts = '';
  for (var i = 0; i < (session.mode === 'survival' ? 3 : (RULES.duelHearts || 3)); i++) hearts += heartSvg(i < session.hearts);
  var answeredNow = Object.keys(session.answers).length;
  var correctNow = Object.keys(session.answers).filter(function (id) { return session.answers[id] && session.answers[id].correct; }).length;
  var accuracyNow = answeredNow ? Math.round(correctNow / answeredNow * 100) : 0;
  var hudHero = selectedCharacter();
  var hudTitle = typeof titleText === 'function' ? titleText(hudHero.id) : '';
  var hudLevel = levelAt(state.xp);
  var foot = '';
  if (!feedback) {
    foot = '<div class="duelFoot"><span class="hint"><kbd>A</kbd><kbd>B</kbd><kbd>C</kbd><kbd>D</kbd> responder · <kbd>Esc</kbd> pausa</span><span class="hint" style="margin-left:auto">' + (session.deferred ? 'La clave se verá al final' : 'El golpe depende de tu criterio') + '</span></div>';
  } else {
    var nextLabel = ((session.finiteHearts && session.hearts <= 0) || session.cursor >= session.questions.length - 1) ? 'Ver resultado' : 'Siguiente pregunta';
    var feedbackText;
    var explanation = q.explanation ? ' · ' + esc(q.explanation) : '';
    if (deferred) {
      feedbackText = '<b>Respuesta registrada.</b><span>La corrección y la clave se verán en el informe final.</span>';
    } else if (feedback.timeout) {
      feedbackText = '<b>Tiempo agotado.</b><span>La pregunta quedó programada para repaso. La respuesta correcta era ' + esc(feedback.answer) + ': ' + esc(feedback.answerText) + explanation + '.</span>';
    } else {
      feedbackText = feedback.correct
        ? '<b>' + (session.mode === 'review' ? 'Memoria recuperada.' : 'Impacto certero.') + '</b><span>' + (feedback.xp ? '+' + feedback.xp + ' XP' : (feedback.suppressed ? esc(feedback.reason) : 'Respuesta registrada')) + (feedback.coins ? ' · +' + feedback.coins + ' moneda' : '') + (boss ? ' · La clave queda sellada hasta el cierre.' : ' · Clave: ' + esc(feedback.answer) + '. ' + esc(feedback.answerText)) + explanation + '</span>'
        : '<b>El guardián encontró una grieta.</b><span>' + (boss ? 'Respuesta sellada. La clave se verá en el informe final.' : 'La respuesta correcta era ' + esc(feedback.answer) + ': ' + esc(feedback.answerText)) + explanation + ' · Fallo programado para repaso en ' + (RULES.firstReviewMinutes || 20) + ' min.</span>';
    }
    foot = '<div class="duelFoot"><div class="feedbackStrip ' + (deferred ? 'is-deferred' : (feedback.correct ? 'is-correct' : 'is-wrong')) + '">' +
      '<span class="feedbackIcon">' + icon(deferred ? 'eye' : (feedback.correct ? 'check' : 'close'), 13) + '</span>' +
      '<span class="feedbackText">' + feedbackText + '</span>' +
      '<button type="button" class="btn btn--primary nextBtn" data-action="next-question">' + esc(nextLabel) + ' ' + icon('chevronRight', 12) + '</button>' +
    '</div></div>';
  }
  return '<div class="duelTop">' +
    '<div class="duelChip" style="--accent:' + area.accent + '"><span class="areaGlyph">' + (AREA_GLYPHS[area.id] || '✦') + '</span><div><small>' + (isMode ? esc(modeLabel) : (session.mode === 'review' ? 'Repaso espaciado' : esc(area.short) + ' · ' + esc(guardianName))) + ' · ' + (session.cursor + 1) + '/' + session.questions.length + '</small><b>' + esc(session.title) + '</b></div></div>' +
    '<div class="duelHearts"><span class="hudResource duelCoins" title="Monedas">' + icon('coin', 12) + '<b>' + formatNumber(state.coins) + '</b></span>' +
      (session.timerMode !== 'none' ? '<span class="modeTimer" data-mode-timer><b>--:--</b><small>' + (session.timerMode === 'session' ? 'restante' : 'pregunta') + '</small></span>' : '') +
      (showHearts ? '<div class="heartRow">' + hearts + '</div>' : '') +
      '<div class="duelProgress"><div class="qDots">' + dots + '</div></div><button type="button" class="iconBtn" data-action="open-pause" title="Pausa">' + icon('pause', 16) + '</button></div>' +
  '</div>' +
  '<div class="duelHudExtra"><span>' + icon('user', 11) + ' <b>' + esc(hudHero.name) + '</b>' + (hudTitle ? ' «' + esc(hudTitle) + '»' : '') + '</span><span>Nv <b>' + hudLevel.level + '</b> · ' + formatXP(state.xp) + '</span><span>Precisión del duelo <b>' + (answeredNow ? accuracyNow + '%' : '—') + '</b></span><span>' + icon('coin', 10) + ' <b>' + formatNumber(state.coins) + '</b></span></div>' +
  '<div class="duelStatus">' + esc(guardianName) + ' · ' + (isMode ? esc(modeLabel) : (session.mode === 'review' ? 'Memoria en repaso' : session.mode === 'boss' ? 'Duelo de dominio' : 'Duelo de criterio')) + ' · Pregunta ' + (session.cursor + 1) + ' de ' + session.questions.length + '</div>' +
  '<div class="duelPanelWrap"><section class="duelPanel" style="--accent:' + area.accent + '">' +
    '<div class="duelPanelHead"><span class="qCategory">' + (session.mode === 'review' ? 'Repaso · ' + esc(area.short) : session.mode === 'practice' ? esc(session.title) : esc(session.title) + ' · ' + esc(area.short)) + '</span>' + tagButtonsHTML(q.id, true) + '<span class="qSource">' + esc(q.examTitle || 'Psicología · SERUMS') + (q.page ? ' · p. ' + q.page : '') + '</span></div>' +
    '<div class="duelPanelBody"><p class="questionText">' + esc(q.stem) + '</p>' +
      '<div class="answers">' + optionHtml + '</div>' + foot +
    '</div>' +
  '</section></div>';
}

/* -------------------------------------------------------------------------
   RESULTADO
   ------------------------------------------------------------------------- */
function resultScreenHTML() {
  var r = lastResult;
  if (!r) return '';
  var accent = r.pass ? 'var(--teal)' : 'var(--rose)';
  var area = AREA_BY_ID[r.areaId] || CAMP.areas[0];
  var sealValue = Math.round(r.accuracy * 100) + '%';
  var modeHeading = r.mode === 'daily' ? (r.pass ? 'Desafío diario completado.' : 'Desafío diario registrado.') : r.mode === 'survival' ? (r.pass ? 'Supervivencia completada.' : 'La supervivencia termina aquí.') : r.mode === 'timed' ? (r.pass ? 'Contrarreloj superado.' : 'El reloj cerró la sesión.') : r.mode === 'simulacro' ? (r.pass ? 'Informe del simulacro.' : 'Simulacro registrado.') : r.mode === 'practice' ? 'Práctica libre completada.' : '';
  var heading = r.isMode ? modeHeading : (r.mode === 'review' ? (r.pass ? 'La memoria vuelve a estar contigo.' : 'El repaso deja una tarea abierta.') : (r.pass ? 'La ruta queda sellada.' : 'El guardián aún guarda este tramo.'));
  var modeLabels = { daily: 'Diario', survival: 'Supervivencia', timed: 'Contrarreloj', simulacro: 'Simulacro', practice: 'Práctica libre' };
  var eyebrow = r.isMode ? 'Modo · ' + modeLabels[r.mode] : (r.mode === 'review' ? 'Repaso espaciado' : (r.mode === 'boss' ? 'Duelo de dominio' : 'Duelo de criterio'));
  var answers = r.entries.map(function (e) {
    var q = QUESTION_BY_ID[e.questionId];
    if (!q) return '';
    return '<div class="answerReviewRow">' + icon(e.correct ? 'checkCircle' : 'close', 11) + '<span><b>' + (e.correct ? 'Correcta' : 'Fallada') + '.</b> Clave ' + esc(q.answer + ': ' + e.answerText) + (q.explanation ? ' · ' + esc(q.explanation) : '') + '</span></div>';
  }).join('');
  var rewards = '';
  if (r.questionXp) rewards += '<div class="rewardRow"><span>Respuestas acertadas</span><b>+' + r.questionXp + ' XP</b></div>';
  if (r.completion && r.completion.xp) rewards += '<div class="rewardRow"><span>' + (r.isMode ? 'Cierre del modo' : 'Cierre de ruta') + '</span><b>+' + r.completion.xp + ' XP</b></div>';
  if (r.achievements && r.achievements.length) rewards += '<div class="rewardRow"><span>Logros desbloqueados</span><b>+' + r.achievements.reduce(function (n, a) { return n + (a.xp || 0); }, 0) + ' XP</b></div>';
  if (r.questionCoins) rewards += '<div class="rewardRow"><span>Monedas por acierto</span><b>+' + r.questionCoins + '</b></div>';
  if (r.completion && r.completion.coins) rewards += '<div class="rewardRow"><span>Monedas de cierre</span><b>+' + r.completion.coins + '</b></div>';
  if (r.achievements && r.achievements.length) {
    var achievementCoins = r.achievements.reduce(function (n, a) { return n + (Number(a.coins) || 0); }, 0);
    if (achievementCoins) rewards += '<div class="rewardRow"><span>Monedas por logros</span><b>+' + achievementCoins + '</b></div>';
    rewards += '<div class="rewardRow"><span>Logros</span><b>' + r.achievements.map(function (a) { return esc(a.name); }).join(' · ') + '</b></div>';
  }
  if (!rewards) rewards = '<div class="rewardRow"><span>Sin recompensas de cierre</span><b>—</b></div>';
  var levelLine = r.levelAfter > r.levelBefore ? 'Nivel ' + r.levelBefore + ' → ' + r.levelAfter : 'Nivel ' + r.levelAfter;
  var stageLine = r.stageChange ? '<div class="notice" style="margin-top:9px"><b>Etapa ' + r.stageChange.from + ' → ' + r.stageChange.to + '.</b> La evidencia reciente movió tu umbral adaptativo.</div>' : '';
  var nextCosmeticLine = typeof nextCosmeticHint === 'function' ? nextCosmeticHint() : null;
  var nextCosmeticCard = nextCosmeticLine ? '<div class="resultCosmetic"><span class="eyebrow noRule">Próximo cosmético</span><b>' + esc(nextCosmeticLine.cosmetic.name) + '</b><p>' + esc(nextCosmeticLine.text) + '</p><div class="bar"><i style="width:' + Math.round((nextCosmeticLine.pct || 0) * 100) + '%;background:' + cosmeticRarityColor(nextCosmeticLine.cosmetic) + '"></i></div></div>' : '';
  var newCosmeticCard = (r.newCosmetics && r.newCosmetics.length) ? '<div class="resultNext resultNext--cosmetic"><b>Cosméticos nuevos: ' + esc(r.newCosmetics.map(function (c) { return c.name; }).join(' · ')) + '</b><p>Ya están en tu inventario y muestran cómo se consiguen.</p></div>' : '';
  var due = dueErrors().length;
  var scheduledLine = r.errorsScheduled ? r.errorsScheduled + ' ' + plural(r.errorsScheduled, 'fallo quedó programado', 'fallos quedaron programados') + ' para volver a mirarlos en ' + (RULES.firstReviewMinutes || 20) + ' minutos. ' : '';
  var nextLine = scheduledLine + (due ? due + ' ' + plural(due, 'pregunta está lista', 'preguntas están listas') + ' para repaso.' : 'No hay repasos pendientes por ahora.');
  var actions = '';
  if (r.isMode) {
    actions += '<button type="button" class="btn ' + (r.pass ? 'btn--primary' : 'btn--ghost') + '" data-action="result-continue">' + icon('seal', 14) + ' Volver a Modos</button>';
    if (r.mode !== 'daily') actions += '<button type="button" class="btn btn--ghost" data-action="result-replay">' + icon('rotate', 14) + ' Repetir modo</button>';
    if (due) actions += '<button type="button" class="btn btn--ghost" data-action="open-review">' + icon('rotate', 14) + ' Ver repasos</button>';
  } else if (r.mode === 'mission' || r.mode === 'boss') {
    actions += '<button type="button" class="btn ' + (r.pass ? 'btn--primary' : 'btn--ghost') + '" data-action="result-continue">' + icon('map', 14) + ' Volver al observatorio</button>';
    actions += '<button type="button" class="btn btn--ghost" data-action="result-replay">' + icon('rotate', 14) + ' ' + (r.pass ? 'Repetir ruta' : 'Reintentar') + '</button>';
    if (due) actions += '<button type="button" class="btn btn--ghost" data-action="open-review">' + icon('book', 14) + ' Ver repaso</button>';
  } else {
    actions += '<button type="button" class="btn btn--primary" data-action="result-continue">' + icon('map', 14) + ' Volver al observatorio</button>';
    if (due) actions += '<button type="button" class="btn btn--ghost" data-action="open-review">' + icon('rotate', 14) + ' Ver repasos</button>';
  }
  var modeBreakdown = '';
  if (r.isMode && r.modeAreas) {
    modeBreakdown = '<div class="resultNext"><b>Desglose por área</b><div class="modeAreaResults">' + CAMP.areas.map(function (a) {
      var row = r.modeAreas[a.id] || { correct: 0, answered: 0, total: 0 };
      var pct = row.answered ? Math.round(row.correct / row.answered * 100) : 0;
      return '<div><span style="color:' + a.accent + '">' + esc(a.short) + '</span><b>' + row.correct + '/' + (row.answered || 0) + '</b><em>' + pct + '%</em></div>';
    }).join('') + '</div>' + (r.mode === 'simulacro' && r.simulacroHistory && r.simulacroHistory.length ? '<p class="tiny dim">Historial: ' + r.simulacroHistory.length + ' simulacro' + (r.simulacroHistory.length === 1 ? '' : 's') + ' guardado' + (r.simulacroHistory.length === 1 ? '' : 's') + '.</p>' : '') + '</div>';
  }
  var modeRecord = '';
  if (r.isMode) {
    var recordLine = r.mode === 'survival' ? 'Récord de aciertos en Supervivencia: ' + r.survivalBest : r.mode === 'timed' ? 'Mejor precisión en Contrarreloj: ' + Math.round((r.timedBest || 0) * 100) + '%' : r.mode === 'simulacro' ? 'Simulacros superados: ' + (state.modeStats.simulacros || 0) : r.mode === 'practice' ? 'Práctica sin presión' : 'Racha de estudio: ' + (state.daily.streak || 0) + ((Number(state.daily.streak) || 0) === 1 ? ' día' : ' días');
    modeRecord = '<div class="resultNext"><b>' + esc(recordLine) + '</b><p>' + (r.mode === 'survival' ? 'Tus vidas y respuestas quedan guardadas en el informe.' : r.mode === 'timed' ? 'La velocidad no compensa una respuesta incorrecta.' : r.mode === 'simulacro' ? 'El detalle por área está arriba; los fallos ya están programados para repaso.' : 'El diario ya quedó cerrado por hoy.') + '</p></div>';
  }
  return '<div class="resultScreen"><section class="resultCard" style="--accent:' + accent + '">' +
    '<div class="resultHead"><div><span class="eyebrow noRule" style="color:' + accent + '">' + eyebrow + (r.isMode ? '' : ' · ' + esc(area.short)) + '</span><h1>' + esc(heading) + '</h1>' +
      '<p class="small muted" style="margin:8px 0 0;max-width:580px">' + esc(r.title) + ' · ' + r.correct + ' de ' + r.total + ' respuestas correctas. ' + esc(r.reasonLabel || '') + '</p></div>' +
      '<div class="resultSeal"><b>' + sealValue + '</b><small>precisión</small></div>' +
    '</div>' +
    '<div class="resultBody"><div>' +
      '<div class="resultStats"><div class="resultStat resultStat--teal"><b>' + r.correct + '</b><span>aciertos</span></div><div class="resultStat"><b>' + r.wrong + '</b><span>fallos</span></div><div class="resultStat"><b>' + r.questionXp + '</b><span>XP de respuestas</span></div><div class="resultStat resultStat--gold"><b>' + r.coinsEarned + '</b><span>monedas</span></div></div>' +
      '<div class="resultReasons" style="margin-top:12px"><strong>' + (r.pass ? (r.isMode ? 'Modo superado.' : 'Ruta superada.') : (r.isMode ? 'Sin recompensa de cierre en este intento.' : 'Sesión cerrada sin recompensa de ruta.')) + '</strong> ' + esc(r.reason) + '</div>' +
      '<div class="resultNext"><b>' + levelLine + ' · ' + esc(r.rankAfter || '') + '</b><p>' + nextLine + '</p></div>' +
      modeBreakdown + modeRecord +
      stageLine +
      newCosmeticCard +
      nextCosmeticCard +
      (r.achievements && r.achievements.length ? '<div class="resultNext"><b>Logros nuevos</b><p>' + esc(r.achievements.map(function (a) { return a.name; }).join(' · ')) + '</p></div>' : '') +
      (r.unlockedCharacters && r.unlockedCharacters.length ? '<div class="resultNext"><b>Nuevo héroe: ' + esc(r.unlockedCharacters.map(function (c) { return c.name; }).join(', ')) + '</b><p>Ya puedes elegirlo en el observatorio.</p></div>' : '') +
      '<div class="answerReview">' + answers + '</div>' +
    '</div>' +
    '<aside class="resultAside"><h3>' + (r.isMode ? 'Recompensas del modo' : 'Recompensas de la ruta') + '</h3><div class="rewardRows">' + rewards + '</div>' +
      '<div class="resultNext"><b>' + (r.isMode ? 'Registro del modo' : 'Bitácora actualizada') + '</b><p>' + (r.isMode ? (r.mode === 'simulacro' ? 'El informe y el desglose por área quedaron guardados.' : (r.mode === 'daily' ? 'El diario ya quedó cerrado por hoy y cuenta para tu racha.' : 'El intento quedó registrado; puedes repetir el modo sin penalización de monedas.')) : (r.newlyCompleted ? 'Este nodo queda marcado como completado.' : (r.mode === 'review' ? 'Los intervalos de repaso se recalcularon.' : (r.pass ? 'La ruta ya estaba completada; conservas tu mejor marca.' : 'La ruta sigue abierta; este intento no registrará cierre.')))) + '</p></div>' +
      '<div class="resultNext"><b>Próxima memoria</b><p>' + (r.errorsScheduled ? r.errorsScheduled + ' ' + plural(r.errorsScheduled, 'fallo vuelve', 'fallos vuelven') + ' en ' + (RULES.firstReviewMinutes || 20) + ' min.' : 'Sin citas nuevas pendientes.') + (due ? ' ' + due + ' ' + plural(due, 'pregunta espera', 'preguntas esperan') + ' ahora.' : '') + '</p></div>' +
      (r.capReached ? '<div class="resultNext"><b>Tope diario alcanzado</b><p>Las monedas de hoy ya tienen su límite. Tu progreso y el de los cosméticos sigue contando sin prisa.</p></div>' : '') +
    '</aside></div>' +
    '<div class="resultFoot"><span class="footMeta">' + icon('shield', 11) + ' Las respuestas ya quedaron guardadas en este navegador.</span><div class="actions">' + actions + '</div></div>' +
  '</section></div>';
}

/* -------------------------------------------------------------------------
   Render raíz
   ------------------------------------------------------------------------- */
function setScreen(next) {
  screen = next;
  if (next !== 'hub') EL.prompt.classList.add('hidden');
  syncHUD();
  renderScreen();
}
function renderScreen() {
  if (!EL.screen) return;
  if (screen === 'boot') return;
  if (screen === 'title') {
    EL.screen.innerHTML = titleScreenHTML();
    return;
  }
  if (screen === 'hub') { EL.screen.innerHTML = ''; return; }
  if (screen === 'journal') { EL.screen.innerHTML = journalScreenHTML(); return; }
  if (screen === 'heroes') { EL.screen.innerHTML = heroesScreenHTML(); return; }
  if (screen === 'recruit') { EL.screen.innerHTML = recruitScreenHTML(); return; }
  if (screen === 'review') { EL.screen.innerHTML = reviewScreenHTML(); return; }
  if (screen === 'import') { EL.screen.innerHTML = importScreenHTML(); bindImportFile(); return; }
  if (screen === 'pause') { EL.screen.innerHTML = pauseScreenHTML(); return; }
  if (screen === 'settings') { EL.screen.innerHTML = settingsScreenHTML(); return; }
  if (screen === 'modes') { EL.screen.innerHTML = modesScreenHTML(); return; }
  if (screen === 'stats') { EL.screen.innerHTML = statsScreenHTML(); return; }
  if (screen === 'practicePicker') { EL.screen.innerHTML = practicePickerHTML(); return; }
  if (screen === 'tutorial') { EL.screen.innerHTML = tutorialScreenHTML(); return; }
  if (screen === 'help') { EL.screen.innerHTML = helpScreenHTML(); return; }
  if (screen === 'credits') { EL.screen.innerHTML = creditsScreenHTML(); return; }
  if (screen === 'recovery') { EL.screen.innerHTML = recoveryScreenHTML(); return; }
  if (screen === 'wardrobe') {
    EL.screen.innerHTML = wardrobeScreenHTML();
    mountWardrobePreview();
    return;
  }
  if (screen === 'shop') { EL.screen.innerHTML = shopScreenHTML(); return; }
  if (screen === 'showcase') { EL.screen.innerHTML = showcaseScreenHTML(); return; }
  if (screen === 'slotGallery') { EL.screen.innerHTML = slotGalleryHTML(); return; }
  if (screen === 'map') { EL.screen.innerHTML = mapScreenHTML(); mountMapCanvas(); return; }
  if (screen === 'mapGallery') { EL.screen.innerHTML = mapGalleryHTML(); return; }
  if (screen === 'duel') { EL.screen.innerHTML = duelScreenHTML(); return; }
  if (screen === 'result') { EL.screen.innerHTML = resultScreenHTML(); return; }
}
