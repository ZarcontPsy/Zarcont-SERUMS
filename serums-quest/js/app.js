/* SERUMS QUEST - aplicación
   © 2026 ZARCONT. Interfaz, rutas y acciones. Sin frameworks ni servicios remotos. */
(function () {
  "use strict";

  var C = window.QUEST_CONFIG;
  var U = window.QuestUtil;
  var P = window.QuestProgression;
  var Store = window.QuestStore;
  var Content = window.QuestContent;
  var Engine = window.QuestEngine;
  var Icons = window.QuestIcons;
  var esc = U.escapeHTML;

  var store = null;
  var state = null;
  var route = { name: "home", id: "" };
  var ui = {
    errorFilter: "pending",
    achievementFilter: "all",
    rankingTab: "sessions",
    timedSeconds: 300,
    lastRenderedQuestion: "",
    lastRouteKey: "",
    timerBusy: false
  };
  var booted = false;
  var timerHandle = 0;
  var toastTimer = 0;

  var MODE_LABEL = {
    mission: "Misión",
    boss: "Jefe final",
    daily: "Desafío diario",
    survival: "Supervivencia",
    timed: "Contrarreloj",
    recovery: "Recuperación",
    simulacro: "Simulacro"
  };
  var MODE_ICON = {
    mission: "flag",
    boss: "shield",
    daily: "calendar",
    survival: "heart",
    timed: "timer",
    recovery: "rotate",
    simulacro: "swords"
  };
  var MODE_COLOR = {
    mission: "var(--blue)",
    boss: "var(--violet)",
    daily: "var(--amber)",
    survival: "var(--red)",
    timed: "var(--cyan)",
    recovery: "var(--green)",
    simulacro: "var(--violet)"
  };
  var MODE_TO_ENGINE = {
    diario: "daily",
    supervivencia: "survival",
    contrarreloj: "timed",
    recuperacion: "recovery",
    simulacro: "simulacro"
  };

  function icon(name, size, cls) { return Icons.svg(name, size, cls); }
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function statValue(part, total) { return U.percent(part, total); }
  function plural(n, one, many) { return U.plural(n, one, many); }

  function progressBar(value, label, extraClass) {
    var v = Math.max(0, Math.min(100, Number(value) || 0));
    return '<div class="q-progress ' + (extraClass || "") + '" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(v) + '" aria-label="' + esc(label || "Progreso") + '"><span style="width:' + v + '%"></span></div>';
  }

  function levelRing(percent, level, size, extra) {
    var s = size || 72;
    var r = (s / 2) - 6;
    var circumference = 2 * Math.PI * r;
    var offset = circumference * (1 - Math.max(0, Math.min(100, percent || 0)) / 100);
    return '<div class="q-level-ring" style="width:' + s + 'px;height:' + s + 'px">' +
      '<svg viewBox="0 0 ' + s + ' ' + s + '" aria-hidden="true">' +
      '<circle class="track" cx="' + (s / 2) + '" cy="' + (s / 2) + '" r="' + r + '"></circle>' +
      '<circle class="fill" cx="' + (s / 2) + '" cy="' + (s / 2) + '" r="' + r + '" stroke-dasharray="' + circumference.toFixed(1) + '" stroke-dashoffset="' + offset.toFixed(1) + '"></circle>' +
      '</svg><b>' + level + '</b>' + (extra === false ? "" : '<small>NIVEL</small>') + "</div>";
  }

  function scoreRing(percent, label, tone) {
    var r = 46;
    var circumference = 2 * Math.PI * r;
    var offset = circumference * (1 - Math.max(0, Math.min(100, percent || 0)) / 100);
    return '<div class="q-score-ring">' +
      '<svg viewBox="0 0 110 110" aria-hidden="true">' +
      '<circle class="track" cx="55" cy="55" r="' + r + '"></circle>' +
      '<circle class="fill" cx="55" cy="55" r="' + r + '" stroke-dasharray="' + circumference.toFixed(1) + '" stroke-dashoffset="' + offset.toFixed(1) + '" style="stroke:' + (tone || "var(--green)") + '"></circle>' +
      '</svg><b>' + Math.round(percent || 0) + '%<small>' + esc(label || "precisión") + "</small></b></div>";
  }

  function avatar(name) {
    var clean = String(name || "S").trim();
    var parts = clean.split(/\s+/).filter(Boolean);
    var initials = (parts[0] ? parts[0].charAt(0) : "S") + (parts[1] ? parts[1].charAt(0) : "");
    return '<span class="q-avatar" aria-hidden="true">' + esc(initials.toUpperCase()) + "</span>";
  }

  function areaChip(areaId, extra) {
    var meta = C.areaMeta[areaId];
    if (!meta) return '<span class="q-chip">Banco general</span>';
    return '<span class="q-chip ' + (extra || "") + '" style="color:' + meta.accent + '"><span class="q-area-dot" style="--area:' + meta.accent + '"></span>' + esc(meta.short) + "</span>";
  }

  function confidenceChip(confidence) {
    if (confidence === "alta") return '<span class="q-chip q-chip--green">Afinidad alta</span>';
    if (confidence === "media") return '<span class="q-chip q-chip--blue">Afinidad media</span>';
    if (confidence === "baja") return '<span class="q-chip q-chip--amber">Afinidad baja</span>';
    return '<span class="q-chip">Banco general</span>';
  }

  function tierChip(tier) {
    var t = C.tiers[tier] || C.tiers.desarrollo;
    var cls = tier === "dominio" ? "q-chip--violet" : (tier === "repaso" ? "q-chip--green" : (tier === "especializacion" ? "q-chip--amber" : "q-chip--blue"));
    return '<span class="q-chip ' + cls + '">' + esc(t.label) + "</span>";
  }

  function sourceLink(question, label) {
    if (!question || !question.sourceUrl) return "";
    return '<a class="q-textlink" href="' + esc(question.sourceUrl) + '" target="_blank" rel="noopener">' + icon("external", 13) + "<span>" + esc(label || ("PDF oficial · p. " + question.page)) + "</span></a>";
  }

  function sheetLink(sheetId, label, questionId) {
    if (!sheetId) return "";
    return '<a class="q-textlink" href="' + esc(Content.studyHref(sheetId)) + '" target="_blank" rel="noopener" data-study-sheet="' + esc(sheetId) + '" data-question-id="' + esc(questionId || "") + '">' + icon("book", 13) + "<span>" + esc(label || "Abrir ficha en Study Dashboard") + "</span></a>";
  }

  function statsOf() { return P.stats(state, Content.catalog); }
  function levelOf() { return P.levelFromXp(state.xp); }
  function rankOf() { return P.rankFor(statsOf()); }

  function projectedDailyStreak() {
    var today = U.dateKey(new Date());
    var yesterday = U.dateKey(U.addDays(new Date(), -1));
    var current = Number(state.daily.streak) || 0;
    if (!state.daily.lastCompletedDate) return current;
    if (state.daily.lastCompletedDate === today) return current;
    if (state.daily.lastCompletedDate === yesterday) return current + 1;
    return 1;
  }

  /* ------------------------------------------------------------------ */
  /* Inicio                                                             */
  /* ------------------------------------------------------------------ */
  function areaSummary(areaId) {
    var area = state.academic.byArea[areaId] || {};
    var reliable = Number(area.reliableAnswered) || 0;
    var answered = reliable > 0 ? reliable : (Number(area.answered) || 0);
    var correct = reliable > 0 ? (Number(area.reliableCorrect) || 0) : (Number(area.correct) || 0);
    var accuracy = answered ? correct / answered : 0;
    var routeInfo = Content.getAreaRoute(areaId);
    var total = routeInfo ? routeInfo.missions.length : 0;
    var done = routeInfo ? routeInfo.missions.filter(function (m) { return Content.missionCompletion(state, m); }).length : 0;
    return {
      answered: answered,
      reliable: reliable,
      correct: correct,
      accuracy: accuracy,
      total: total,
      done: done,
      percent: total ? Math.round((done / total) * 100) : 0
    };
  }

  function renderHome() {
    var stats = statsOf();
    var level = levelOf();
    var rank = rankOf();
    var nextRank = P.nextRank(stats);
    var reco = Content.nextRecommendedAction(state);
    var active = state.activeSession;
    var sessions = state.sessions.slice(0, 3);
    var recentUnlocked = C.achievements.filter(function (d) { return state.achievements[d.id] && state.achievements[d.id].unlockedAt; }).slice(-3);

    var areaRows = C.areas.map(function (areaId) {
      var meta = C.areaMeta[areaId];
      var s = areaSummary(areaId);
      var sub = s.total ? s.done + "/" + s.total + " misiones" : "Sin misiones disponibles";
      if (s.answered) sub += " · " + Math.round(s.accuracy * 100) + "% precisión";
      return '<a class="q-area-row" href="#/mapa" style="--area:' + meta.accent + '">' +
        '<span class="q-area-dot"></span>' +
        '<span><b>' + esc(meta.short) + "</b><small>" + esc(sub) + "</small></span>" +
        progressBar(s.percent, "Progreso de " + meta.short) +
        '<span class="q-area-pct">' + s.percent + "%</span></a>";
    }).join("");

    var dailyChip = Content.dailyAvailable(state) ? '<span class="q-chip q-chip--amber"><span class="q-life" style="width:5px;height:5px"></span>Disponible hoy</span>' : '<span class="q-chip">Completado hoy</span>';
    var recoIcon = reco.kind === "daily" ? "calendar" : (reco.kind === "resume" ? "play" : (reco.kind === "recovery" ? "rotate" : (reco.kind === "mission" ? "flag" : "map")));
    var recoMeta = "";
    if (reco.kind === "mission" || reco.kind === "resume") {
      recoMeta = active ? '<span class="q-chip q-chip--blue">' + esc(active.title) + "</span>" : "";
    } else if (reco.kind === "daily") {
      recoMeta = dailyChip + '<span class="q-chip q-chip--blue">' + C.modes.diario.questionCount + " preguntas</span>" + '<span class="q-chip q-chip--green">+' + C.xp.completion.daily + " XP</span>";
    } else if (reco.kind === "recovery") {
      recoMeta = '<span class="q-chip q-chip--amber">' + esc(reco.text) + "</span>";
    }

    var modes = [
      { id: "supervivencia", label: "Supervivencia", text: "3 oportunidades · 10 preguntas", color: "var(--red)", icon: "shield" },
      { id: "contrarreloj", label: "Contrarreloj", text: "Precisión bajo tiempo", color: "var(--cyan)", icon: "timer" },
      { id: "recuperacion", label: "Recuperación", text: Content.recoveryStats(state).due + " por recuperar", color: "var(--green)", icon: "rotate" },
      { id: "simulacro", label: "Simulacro", text: state.stage >= 4 ? "20 preguntas · 15 min" : "Se abre en Dominio", color: "var(--violet)", icon: "swords" }
    ].map(function (m) {
      var locked = m.id === "simulacro" && state.stage < 4;
      return '<a class="q-mode-card" href="#/modo/' + m.id + '" style="--mode-color:' + m.color + '">' +
        "<span>" + icon(m.icon, 19) + "<b>" + esc(m.label) + "</b><span>" + esc(m.text) + "</span></span>" +
        '<span class="q-mode-arrow">' + (locked ? "Bloqueado" : "Abrir") + icon(locked ? "lock" : "chevronRight", 13) + "</span></a>";
    }).join("");

    var recent = sessions.length ? '<div class="q-session-list">' + sessions.map(sessionRow).join("") + "</div>" : '<div class="q-empty"><div class="q-empty-icon">' + icon("list", 22) + '</div><h2>Tu historial empieza aquí</h2><p>Completa una misión o un desafío para ver resultados reales.</p><div class="q-empty-actions"><a class="q-btn q-btn--soft q-btn--sm" href="#/mapa">Ver el mapa</a></div></div>';

    var heroTitle = stats.answered
      ? "Cada respuesta afina tu <em>criterio</em>."
      : "Aprender también es <em>avanzar</em>.";
    var heroSub = stats.answered
      ? "Tu etapa actual es " + C.stages[state.stage].name + ". La dificultad se ajusta con evidencia, no con una sola respuesta."
      : "Misiones basadas en preguntas oficiales de Psicología. Sin atajos: la XP se gana demostrando lo que sabes.";

    return '<div class="q-page">' +
      '<div class="q-home-head"><div><span class="q-kicker"><span class="dot"></span>Tu recorrido · ' + esc(C.stages[state.stage].name) + "</span><h1>" + heroTitle + "</h1><p>" + esc(heroSub) + "</p></div>" +
      '<a class="q-btn q-btn--soft q-btn--sm" href="#/perfil">' + icon("user", 15) + " Ver perfil</a></div>" +

      '<div class="q-home-grid">' +
        '<section class="q-panel q-player-card" aria-label="Tu progreso">' +
          '<div class="q-player-top"><div class="q-player-id">' + avatar(state.profile.name) + '<div><h2>' + esc(state.profile.name) + '</h2><p>' + esc(rank.name) + " · " + esc(rank.description) + "</p></div></div>" +
          '<span class="q-chip q-chip--violet">' + icon("flame", 12) + " " + (state.daily.streak || 0) + " " + plural(state.daily.streak || 0, "día", "días") + "</span></div>" +
          '<div class="q-level-box">' + levelRing(level.percent, level.level, 72) +
            '<div class="q-level-info"><div class="q-row"><span>' + (level.maxed ? "Nivel máximo alcanzado" : level.intoLevel + " / " + level.needed + " XP este nivel") + '</span><b>' + state.xp + " XP</b></div>" +
            progressBar(level.percent, "Progreso al nivel " + (level.level + 1)) +
            '<div class="q-rankline">' + icon("award", 13) + "<span>Rango: <b>" + esc(rank.name) + "</b>" + (nextRank ? " · siguiente: " + esc(nextRank.name) : " · rango máximo") + "</span></div></div>" +
          "</div>" +
          '<div class="q-player-stats">' +
            '<div class="q-stat"><b>' + stats.answered + "</b><span>Respondidas</span></div>" +
            '<div class="q-stat"><b>' + Math.round(stats.accuracy * 100) + "%</b><span>Precisión</span></div>" +
            '<div class="q-stat"><b>' + stats.mastered + "</b><span>Dominadas</span></div>" +
          "</div>" +
        "</section>" +

        '<section class="q-panel q-reco-card q-panel--violet" aria-label="Siguiente paso">' +
          '<div class="q-reco-label"><span class="q-kicker"><span class="dot"></span>' + (active ? "Sesión en curso" : "Recomendado para ti") + '</span><span class="q-reco-icon">' + icon(recoIcon, 20) + "</span></div>" +
          "<h2>" + esc(reco.title) + "</h2><p>" + esc(reco.text) + "</p>" +
          '<div class="q-reco-meta">' + recoMeta + "</div>" +
          '<div class="q-reco-actions"><a class="q-btn ' + (reco.kind === "daily" ? "q-btn--violet" : "") + '" href="' + esc(reco.href) + '">' + icon(active ? "play" : "arrowRight", 15) + " " + esc(reco.action) + "</a>" +
          '<a class="q-btn q-btn--ghost q-btn--sm" href="#/mapa">Explorar el mapa</a></div>' +
          '<p class="q-reco-note">' + icon("info", 13) + "<span>La recomendación usa tus errores, tu etapa y el contenido pendiente. No hay datos de otros usuarios.</span></p>" +
        "</section>" +
      "</div>" +

      '<div class="q-section-grid">' +
        '<section class="q-panel q-panel--pad"><div class="q-section-head"><div><span class="q-kicker">Cinco rutas</span><h2>Tu temario, en áreas.</h2><p>Las cinco áreas oficiales de Psicología organizan las misiones.</p></div><a class="q-textlink" href="#/mapa">Abrir mapa ' + icon("arrowRight", 13) + '</a></div><div class="q-area-preview" style="margin-top:10px">' + areaRows + "</div></section>" +
        '<section class="q-panel q-panel--pad"><div class="q-section-head"><div><span class="q-kicker">Otros modos</span><h2>Elige tu exigencia.</h2><p>Modos con reglas y recompensas transparentes.</p></div></div><div class="q-mode-grid q-mode-grid--2" style="margin-top:10px">' + modes + "</div></section>" +
      "</div>" +

      '<div class="q-section"><div class="q-section-head"><div><span class="q-kicker">Actividad</span><h2>Últimas sesiones.</h2></div>' + (state.sessions.length ? '<a class="q-textlink" href="#/registro">Ver registro ' + icon("arrowRight", 13) + "</a>" : "") + "</div>" + recent + "</div>" +

      (recentUnlocked.length ? '<div class="q-section"><div class="q-section-head"><div><span class="q-kicker">Logros recientes</span><h2>Lo que ya construiste.</h2></div><a class="q-textlink" href="#/logros">Ver todos ' + icon("arrowRight", 13) + '</a></div><div class="q-achievement-grid">' + recentUnlocked.map(achievementCard).join("") + "</div></div>" : "") +
    "</div>";
  }

  function sessionRow(session) {
    if (!session) return "";
    var r = session.result || {};
    var title = session.title || MODE_LABEL[session.mode] || "Sesión";
    var modeIcon = MODE_ICON[session.mode] || "flag";
    var href = r ? "#/resultado/" + encodeURIComponent(session.id) : "#/";
    var status = r.abandoned ? "Abandonada" : (r.pass ? "Superada" : "No superada");
    return '<a class="q-session-row" href="' + esc(href) + '">' +
      '<span class="q-session-icon">' + icon(modeIcon, 13) + "</span>" +
      "<span><b>" + esc(title) + "</b><small>" + esc(U.formatRelative(session.endedAt || session.startedAt)) + " · " + esc(MODE_LABEL[session.mode] || "Sesión") + " · " + esc(status) + "</small></span>" +
      '<span class="q-session-score">' + (r.total ? r.correct + "/" + r.total : "—") + "</span>" +
      '<span class="q-session-acc">' + (r.accuracy != null ? Math.round(r.accuracy * 100) + "%" : "—") + "</span>" +
      '<span class="q-session-xp q-xs">' + (r.xpEarned != null ? "+" + r.xpEarned + " XP" : "") + "</span></a>";
  }

  /* ------------------------------------------------------------------ */
  /* Mapa                                                               */
  /* ------------------------------------------------------------------ */
  function renderMap() {
    var stage = C.stages[state.stage];
    var req = P.nextStageRequirements(state, Content.catalog);
    var stagePct = req.complete ? 100 : (req.items.length ? Math.round((req.items.filter(function (i) { return i.met; }).length / req.items.length) * 100) : 0);
    var lanes = C.areas.map(function (areaId) {
      var meta = C.areaMeta[areaId];
      var routeData = Content.getAreaRoute(areaId);
      var s = areaSummary(areaId);
      if (!routeData || !routeData.missions.length) {
        return '<div class="q-lane"><div class="q-lane-head"><div class="q-lane-title"><span class="q-area-dot" style="--area:' + meta.accent + '"></span><b>' + esc(meta.short) + '</b></div><small>Sin misiones disponibles</small></div><div class="q-lane-empty">No hay contenido suficiente para construir una ruta en esta área.</div></div>';
      }
      var nodes = routeData.missions.map(function (mission) {
        var u = Content.missionUnlocked(state, mission);
        var complete = Content.missionCompletion(state, mission);
        var cls = complete ? "is-complete" : (u.unlocked ? "is-available" : "is-locked");
        var status = complete ? "Completada" : (u.unlocked ? "Disponible" : "Bloqueada");
        return '<a class="q-node ' + cls + '" href="#/mision/' + encodeURIComponent(mission.id) + '" style="--accent:' + meta.accent + '" aria-label="' + esc(mission.title + ", " + status) + '">' +
          '<div class="q-node-top"><span class="q-node-index">' + mission.index + "</span>" + (complete ? '<span class="q-chip q-chip--green">' + icon("check", 11) + " Hecha</span>" : (u.unlocked ? '<span class="q-chip q-chip--blue">Disponible</span>' : '<span class="q-chip">' + icon("lock", 11) + " Bloqueada</span>")) + "</div>" +
          "<div><b>" + esc(mission.title) + "</b><small>" + esc(mission.subtitle) + " · " + mission.questionCount + " preguntas</small></div>" +
          '<div class="q-node-foot"><span>' + esc(mission.tierLabel) + " · " + mission.rewards.xp + " XP</span>" + (complete ? icon("checkCircle", 12) : (u.unlocked ? icon("chevronRight", 12) : icon("lock", 12))) + "</div></a>";
      }).join("");
      if (routeData.boss) {
        var bu = Content.missionUnlocked(state, routeData.boss);
        var bcomplete = Content.missionCompletion(state, routeData.boss);
        var bcls = bcomplete ? "is-complete" : (bu.unlocked ? "is-available" : "is-locked");
        nodes += '<a class="q-node is-boss ' + bcls + '" href="#/mision/' + encodeURIComponent(routeData.boss.id) + '" style="--accent:var(--violet)" aria-label="' + esc(routeData.boss.title + ", " + (bcomplete ? "superado" : bu.unlocked ? "disponible" : "bloqueado")) + '">' +
          '<div class="q-node-top"><span class="q-node-index">' + icon("crown", 12) + "</span>" + (bcomplete ? '<span class="q-chip q-chip--green">Superado</span>' : (bu.unlocked ? '<span class="q-chip q-chip--violet">Jefe</span>' : '<span class="q-chip">' + icon("lock", 11) + " Bloqueado</span>")) + "</div>" +
          "<div><b>" + esc(routeData.boss.title) + "</b><small>Jefe final · " + routeData.boss.questionCount + " preguntas</small></div>" +
          '<div class="q-node-foot"><span>Dominio · ' + routeData.boss.rewards.xp + " XP</span>" + (bcomplete ? icon("checkCircle", 12) : icon(bu.unlocked ? "chevronRight" : "lock", 12)) + "</div></a>";
      }
      return '<div class="q-lane"><div class="q-lane-head"><div class="q-lane-title"><span class="q-area-dot" style="--area:' + meta.accent + '"></span><b>' + esc(meta.short) + "</b></div><small>" + s.done + "/" + s.total + " misiones · " + (s.answered ? Math.round(s.accuracy * 100) + "% precisión" : "sin evidencia") + "</small>" + progressBar(s.percent, "Ruta " + meta.short) + '</div><div class="q-lane-track">' + nodes + "</div></div>";
    }).join("");

    var stageText = state.stage >= 4
      ? "Has alcanzado Dominio. Los simulacros y jefes miden retención e integración."
      : "Se necesitan " + C.stageRules.downgradeWindow + " respuestas recientes para valorar un descenso, nunca un error aislado.";
    return '<div class="q-page">' +
      '<div class="q-panel q-stage-banner"><div><span class="q-kicker"><span class="dot" style="background:' + stage.color + '"></span>Etapa adaptativa</span><h1>' + esc(stage.name) + '</h1><p>' + esc(stage.description) + " " + esc(stageText) + "</p>" +
      '<div class="q-detail-tags"><span class="q-chip">' + esc(stage.criteria) + "</span><span class=\"q-chip q-chip--blue\">" + (state.stage >= 4 ? "Etapa máxima" : "Siguiente: " + esc(C.stages[state.stage + 1].name)) + "</span></div></div>" +
      '<div class="q-stage-side"><div class="q-stage-badge"><b>' + state.stage + '/4</b><span>etapa</span></div><div style="min-width:160px"><div class="q-progress-head"><span>Progreso de criterios</span><b>' + stagePct + '%</b></div>' + progressBar(stagePct, "Progreso a la siguiente etapa", "q-progress--thin") + '<small>' + (req.complete ? "Criterios cumplidos. La etapa se actualiza al cerrar una sesión." : req.items.map(function (i) { return esc(i.label) + ": " + i.have + "/" + i.need + (i.suffix || ""); }).join(" · ")) + "</small></div></div></div>" +
      '<div class="q-section"><div class="q-section-head"><div><span class="q-kicker">Rutas de área</span><h2>Cinco caminos, una progresión.</h2><p>Cada nodo indica su dificultad, su recompensa y sus requisitos reales.</p></div><span class="q-chip">' + Content.catalog.missionList.length + " misiones · " + Content.catalog.bossList.length + " jefes</span></div><div class=\"q-map\">" + lanes + "</div>" +
      '<p class="q-xs q-muted">La agrupación por área es una afinidad temática derivada del temario de Study. No es una etiqueta oficial del examen. Las preguntas y claves provienen del banco oficial de Examen Studio.</p></div>' +
    "</div>";
  }

  /* ------------------------------------------------------------------ */
  /* Detalle de misión                                                  */
  /* ------------------------------------------------------------------ */
  function renderMission(id) {
    var mission = Content.getMission(id);
    if (!mission) return renderNotFound("Esa misión no existe", "Puede que el enlace esté incompleto o que el mapa haya cambiado. Vuelve al mapa para elegir una ruta.");
    var unlocked = Content.missionUnlocked(state, mission);
    var completed = Content.missionCompletion(state, mission);
    var record = state.missions[mission.id] || {};
    var meta = C.areaMeta[mission.areaId] || { accent: "var(--blue)", short: "Área" };
    var active = state.activeSession;
    var sourceExams = [];
    var sourceSeen = {};
    mission.questionIds.forEach(function (qid) {
      var q = Content.getQuestion(qid);
      if (q && !sourceSeen[q.examId]) { sourceSeen[q.examId] = true; sourceExams.push(q.examTitle); }
    });
    var startDisabled = !unlocked.unlocked || !!active;
    var startLabel = active ? "Sesión en curso" : (completed ? "Repetir misión" : (mission.kind === "boss" ? "Afrontar jefe" : "Comenzar misión"));
    var requirements = unlocked.requirements.length ? '<div class="q-req-list">' + unlocked.requirements.map(function (r) {
      return '<div class="q-req ' + (r.met ? "is-met" : "") + '"><span class="q-req-icon">' + icon(r.met ? "check" : "lock", 11) + "</span><span>" + esc(r.label) + (r.need > 1 ? " · " + r.have + "/" + r.need : "") + "</span></div>";
    }).join("") + "</div>" : "";

    return '<div class="q-page">' +
      '<div class="q-crumbs"><a href="#/mapa">Mapa</a>' + icon("chevronRight", 12) + "<span>" + esc(meta.short) + "</span>" + icon("chevronRight", 12) + "<span>" + esc(mission.title) + "</span></div>" +
      '<div class="q-detail">' +
        '<div class="q-detail-main">' +
          '<section class="q-detail-hero q-panel" style="--accent:' + meta.accent + '"><span class="q-kicker" style="color:' + meta.accent + '"><span class="dot" style="background:' + meta.accent + '"></span>' + (mission.kind === "boss" ? "Jefe final" : "Misión de área") + "</span><h1>" + esc(mission.title) + "</h1><p>" + esc(mission.description) + "</p>" +
          '<div class="q-detail-tags">' + areaChip(mission.areaId) + '<span class="q-chip">' + esc(mission.subtitle) + "</span>" + tierChip(mission.tier) + '<span class="q-chip">' + mission.questionCount + " preguntas</span>" + (completed ? '<span class="q-chip q-chip--green">' + icon("checkCircle", 12) + " Completada</span>" : "") + "</div>" +
          '<div class="q-mission-stats"><div><b>' + mission.estimatedMinutes + '</b><span>min aprox.</span></div><div><b>' + (mission.kind === "boss" ? "20–50" : mission.rewards.questionXp) + '</b><span>XP por acierto</span></div><div><b>' + (completed ? Math.round((record.bestAccuracy || 0) * 100) + "%" : "—") + '</b><span>mejor precisión</span></div></div></section>' +
          '<section class="q-panel q-panel--pad"><div class="q-section-head"><div><span class="q-kicker">Cómo funciona</span><h2>Reglas de esta sesión.</h2></div></div>' +
            '<div class="q-grid q-grid--2" style="margin-top:12px"><div><b class="q-small">Dificultad</b><p class="q-small q-muted" style="margin-top:4px">' + esc(C.tiers[mission.tier].hint) + '</p></div><div><b class="q-small">Retroalimentación</b><p class="q-small q-muted" style="margin-top:4px">' + (mission.kind === "boss" ? "Diferida: no verás la clave hasta los resultados." : (state.settings.instantFeedback ? "Inmediata después de cada respuesta, con enlace a la fuente." : "Diferida por tu preferencia: verás la clave al final de la sesión.")) + '</p></div><div><b class="q-small">Puntuación</b><p class="q-small q-muted" style="margin-top:4px">La XP depende de la dificultad y del historial de la pregunta. Las repeticiones recientes pueden no dar XP.</p></div><div><b class="q-small">Contenido</b><p class="q-small q-muted" style="margin-top:4px">' + mission.questionCount + " preguntas oficiales de Psicología con clave verificada. " + (sourceExams.length ? "Fuente: " + esc(sourceExams.join(", ")) + "." : "") + '</p></div></div>' +
            '<div class="q-detail-note" style="margin-top:16px"><b>Sin explicaciones inventadas.</b> El banco oficial no incluye comentario editorial por pregunta. Verás la clave, el PDF y, si está disponible, una ficha de Study para reforzar el tema.</div>' +
          "</section>" +
          '<section class="q-panel q-panel--pad"><div class="q-section-head"><div><span class="q-kicker">Trazabilidad</span><h2>Preguntas que cuentan.</h2><p>Solo se usan preguntas con estado validado y clave dentro de las alternativas.</p></div></div><div class="q-source-links">' + sourceExams.map(function (title) {
            var q = Content.getQuestion(mission.questionIds[0]);
            return '<span class="q-row q-small q-muted">' + icon("book", 14) + esc(title) + '</span>';
          }).join("") + sourceLink(Content.getQuestion(mission.questionIds[0]), "Abrir ejemplo de PDF oficial") + "</div>" +
          '<p class="q-xs q-muted" style="margin-top:12px">Al finalizar, cada respuesta conserva su fuente, página y clave. Las preguntas sin respuesta verificada quedan excluidas de la puntuación competitiva.</p></section>' +
        "</div>" +
        '<aside class="q-detail-aside">' +
          `<section class="q-panel q-panel--pad q-panel--glow"><span class="q-kicker">Recompensas anunciadas</span><div class="q-reward-list"><div class="q-reward-line"><span>${icon("spark", 14)}XP por acierto</span><b>${mission.kind === "boss" ? "20–50" : mission.rewards.questionXp} XP</b></div><div class="q-reward-line"><span>${icon("award", 14)}Finalización</span><b>+${mission.rewards.xp} XP</b></div><div class="q-reward-line"><span>${icon("coins", 14)}Monedas</span><b>+${mission.rewards.coins}</b></div></div>` +
          '<div class="q-detail-note" style="margin-top:14px">La recompensa de finalización se registra una sola vez por ' + (mission.kind === "boss" ? "jefe" : "misión") + '. Repetir no vuelve a otorgarla. Las preguntas pueden dar XP reducida.</div>' +
          (requirements ? '<div style="margin-top:16px"><span class="q-kicker">Requisitos</span>' + requirements + "</div>" : "") +
          '<div style="margin-top:16px">' + (active ? '<a class="q-btn q-btn--block" href="#/jugar">' + icon("play", 15) + " Ir a la sesión</a>" : (startDisabled ? '<button class="q-btn q-btn--block" type="button" disabled>' + icon("lock", 15) + " Bloqueada</button>" : '<button class="q-btn q-btn--block q-btn--lg" type="button" data-action="start-mission" data-mission="' + esc(mission.id) + '">' + icon("play", 15) + " " + esc(startLabel) + "</button>")) + "</div>" +
          '<p class="q-xs q-muted" style="margin-top:10px">' + (completed ? "Ya completada. El mejor resultado se conserva." : (unlocked.unlocked ? "Todos los requisitos están cumplidos." : "Cumple los requisitos para desbloquearla.")) + "</p></section>" +
          `<section class="q-panel q-panel--pad"><span class="q-kicker">Sesión</span><div class="q-reward-list"><div class="q-reward-line"><span>Preguntas</span><b>${mission.questionCount}</b></div><div class="q-reward-line"><span>Duración estimada</span><b>${mission.estimatedMinutes} min</b></div><div class="q-reward-line"><span>Dificultad</span><b>${esc(mission.tierLabel)}</b></div><div class="q-reward-line"><span>Feedback</span><b>${mission.kind === "boss" || !state.settings.instantFeedback ? "Al final" : "Inmediato"}</b></div></div><a class="q-btn q-btn--ghost q-btn--block q-btn--sm" style="margin-top:12px" href="#/mapa">Volver al mapa</a></section>` +
        "</aside>" +
      "</div></div>";
  }

  /* ------------------------------------------------------------------ */
  /* Modos                                                              */
  /* ------------------------------------------------------------------ */
  function renderMode(id) {
    var supported = ["diario", "supervivencia", "contrarreloj", "recuperacion", "simulacro"];
    if (supported.indexOf(id) === -1) return renderNotFound("Ese modo no está disponible", "Las misiones y los jefes se abren desde el mapa. Vuelve al inicio para elegir un modo disponible.");
    var def = C.modes[id];
    if (!def) return renderNotFound("Ese modo no existe", "Vuelve al inicio para elegir un modo disponible.");
    var stats = statsOf();
    var content = "";
    var start = "";
    var aside = "";
    if (id === "diario") {
      var available = Content.dailyAvailable(state);
      var challenge = Content.dailyChallenge(state);
      var streak = projectedDailyStreak();
      content = '<section class="q-panel q-panel--pad"><div class="q-section-head"><div><span class="q-kicker">Hoy</span><h2>' + (available ? "Tu desafío diario está listo." : "Ya cerraste el desafío de hoy.") + "</h2><p>" + esc(def.description) + "</p></div></div>" +
        '<div class="q-mission-stats" style="grid-template-columns:repeat(4,1fr)"><div><b>' + (available ? challenge.questionCount : 0) + '</b><span>preguntas</span></div><div><b>+' + C.xp.completion.daily + '</b><span>XP al cerrar</span></div><div><b>+' + C.coins.completion.daily + '</b><span>monedas</span></div><div><b>' + streak + '</b><span>racha actual</span></div></div>' +
        '<div class="q-detail-note" style="margin-top:16px">' + (available ? "Incluye repaso, una pregunta de mayor exigencia y recuperación de conocimientos anteriores. Se puede completar una vez por día." : "Vuelve mañana para mantener la racha. El siguiente desafío se genera con la fecha local de este navegador.") + "</div></section>";
      start = available
        ? '<button class="q-btn q-btn--block q-btn--lg" type="button" data-action="start-mode" data-mode="diario">' + icon("play", 15) + " Empezar desafío</button>"
        : '<button class="q-btn q-btn--block" type="button" disabled>' + icon("checkCircle", 15) + " Completado hoy</button>";
      aside = '<section class="q-panel q-panel--pad"><span class="q-kicker">Recompensas</span><div class="q-reward-list"><div class="q-reward-line"><span>' + icon("spark", 14) + "Finalización</span><b>+" + C.xp.completion.daily + " XP</b></div><div class=\"q-reward-line\"><span>" + icon("coins", 14) + "Monedas</span><b>+" + C.coins.completion.daily + "</b></div><div class=\"q-reward-line\"><span>" + icon("flame", 14) + "Racha</span><b>" + streak + " " + plural(streak, "día", "días") + '</b></div></div><p class="q-xs q-muted" style="margin-top:12px">La racha se actualiza al completar el desafío. Fallar no quita XP ni conocimientos.</p></section>';
    } else if (id === "supervivencia") {
      content = '<section class="q-panel q-panel--pad"><div class="q-section-head"><div><span class="q-kicker">Reglas</span><h2>Tres oportunidades. Una sola vida por intento.</h2><p>' + esc(def.description) + "</p></div></div>" +
        '<div class="q-grid q-grid--3" style="margin-top:14px"><div class="q-stat"><b>3</b><span>oportunidades</span></div><div class="q-stat"><b>' + def.questionCount + '</b><span>preguntas</span></div><div class="q-stat"><b>' + def.secondsPerQuestion + 's</b><span>por pregunta</span></div></div>' +
        '<div class="q-detail-note" style="margin-top:16px"><b>Penalización anunciada:</b> cada respuesta incorrecta o tiempo agotado consume una oportunidad. Si se agotan antes de terminar, pierdes la recompensa de finalización. No hay XP negativa ni pérdida de progreso académico.</div></section>';
      start = '<button class="q-btn q-btn--block q-btn--lg" type="button" data-action="start-mode" data-mode="supervivencia">' + icon("shield", 15) + " Aceptar y empezar</button>";
      aside = '<section class="q-panel q-panel--pad"><span class="q-kicker">Recompensas</span><div class="q-reward-list"><div class="q-reward-line"><span>' + icon("spark", 14) + "Finalización</span><b>+" + C.xp.completion.survival + " XP</b></div><div class=\"q-reward-line\"><span>" + icon("coins", 14) + "Monedas</span><b>+" + C.coins.completion.survival + "</b></div><div class=\"q-reward-line\"><span>" + icon("spark", 14) + 'Por acierto</span><b>10–50 XP</b></div></div><p class=\"q-xs q-muted\" style=\"margin-top:12px\">La recompensa de finalización se otorga una vez por día. Las preguntas mantienen sus reglas anti-repetición.</p></section>';
    } else if (id === "contrarreloj") {
      var seconds = ui.timedSeconds;
      var count = C.modes.contrarreloj.questionCountByDuration[seconds] || C.modes.contrarreloj.questionCount;
      content = '<section class="q-panel q-panel--pad"><div class="q-section-head"><div><span class="q-kicker">Reglas</span><h2>Precisión bajo tiempo.</h2><p>' + esc(def.description) + "</p></div></div>" +
        '<div class="q-detail-tags" style="margin-top:12px"><span class="q-chip">' + count + ' preguntas</span><span class="q-chip">' + Math.round(seconds / 60) + " min</span><span class=\"q-chip q-chip--green\">70% del total para recompensa</span></div>" +
        '<div class="q-detail-note" style="margin-top:16px">La velocidad no compensa una respuesta incorrecta: no hay bonificación por responder rápido. La recompensa de finalización exige 70% de aciertos sobre el total y al menos ' + C.modes.contrarreloj.minAnswered + " respuestas. Las preguntas omitidas cuentan como no acertadas.</div>" +
        '<div style="margin-top:16px"><span class="q-kicker">Duración</span><div class="q-filter-tabs" style="margin-top:8px">' + C.modes.contrarreloj.durations.map(function (sec) {
          return '<button class="q-filter-tab ' + (sec === seconds ? "is-active" : "") + '" type="button" data-action="select-duration" data-seconds="' + sec + '">' + Math.round(sec / 60) + " min · " + (C.modes.contrarreloj.questionCountByDuration[sec] || 12) + " preguntas</button>";
        }).join("") + "</div></div></section>";
      start = '<button class="q-btn q-btn--block q-btn--lg" type="button" data-action="start-mode" data-mode="contrarreloj" data-seconds="' + seconds + '">' + icon("timer", 15) + " Empezar contrarreloj</button>";
      aside = '<section class="q-panel q-panel--pad"><span class="q-kicker">Recompensas</span><div class="q-reward-list"><div class="q-reward-line"><span>' + icon("spark", 14) + "Finalización</span><b>+" + C.xp.completion.timed + " XP</b></div><div class=\"q-reward-line\"><span>" + icon("coins", 14) + "Monedas</span><b>+" + C.coins.completion.timed + "</b></div><div class=\"q-reward-line\"><span>" + icon("timer", 14) + "Tiempo</span><b>" + Math.round(seconds / 60) + ' min</b></div></div><p class=\"q-xs q-muted\" style=\"margin-top:12px\">Una vez por día para la recompensa de finalización. No se premia responder rápido y mal.</p></section>';
    } else if (id === "recuperacion") {
      var rstats = Content.recoveryStats(state);
      content = '<section class="q-panel q-panel--pad"><div class="q-section-head"><div><span class="q-kicker">Repaso espaciado</span><h2>' + (rstats.due ? rstats.due + " " + plural(rstats.due, "pregunta lista", "preguntas listas") : "Nada pendiente por ahora.") + "</h2><p>" + esc(def.description) + "</p></div></div>" +
        '<div class="q-mission-stats" style="grid-template-columns:repeat(4,1fr)"><div><b>' + rstats.due + '</b><span>listas</span></div><div><b>' + rstats.pending + '</b><span>pendientes</span></div><div><b>' + rstats.recovered + '</b><span>recuperadas</span></div><div><b>' + rstats.mastered + '</b><span>con 2 aciertos</span></div></div>' +
        '<div class="q-detail-note" style="margin-top:16px">Una respuesta correcta registra la recuperación, pero no marca una ficha como dominada. El dominio se estima con respuestas correctas en evaluaciones posteriores y con el intervalo de repaso.</div></section>';
      start = rstats.due
        ? '<button class="q-btn q-btn--block q-btn--lg" type="button" data-action="start-mode" data-mode="recuperacion">' + icon("rotate", 15) + " Recuperar ahora</button>"
        : '<a class="q-btn q-btn--block" href="#/errores">' + icon("list", 15) + " Ver historial de errores</a>";
      aside = '<section class="q-panel q-panel--pad"><span class="q-kicker">Recompensas</span><div class="q-reward-list"><div class="q-reward-line"><span>' + icon("spark", 14) + "Finalización</span><b>+" + C.xp.completion.recovery + " XP</b></div><div class=\"q-reward-line\"><span>" + icon("coins", 14) + "Monedas</span><b>+" + C.coins.completion.recovery + "</b></div><div class=\"q-reward-line\"><span>" + icon("rotate", 14) + 'Por acierto</span><b>XP de repaso</b></div></div><p class="q-xs q-muted" style="margin-top:12px">El repaso de recuperación tiene recompensa de finalización una vez por día. Los aciertos espaciados siguen registrando dominio.</p></section>';
    } else if (id === "simulacro") {
      var locked = state.stage < C.modes.simulacro.minStage;
      content = '<section class="q-panel q-panel--pad"><div class="q-section-head"><div><span class="q-kicker">Dominio</span><h2>' + (locked ? "El simulacro se abre en la etapa Dominio." : "Veinte preguntas. Quince minutos.") + "</h2><p>" + esc(def.description) + "</p></div></div>" +
        '<div class="q-mission-stats" style="grid-template-columns:repeat(4,1fr)"><div><b>' + def.questionCount + '</b><span>preguntas</span></div><div><b>' + Math.round(def.seconds / 60) + '</b><span>minutos</span></div><div><b>70%</b><span>del total</span></div><div><b>' + state.stage + '/4</b><span>etapa</span></div></div>' +
        '<div class="q-detail-note" style="margin-top:16px">' + (locked ? "Necesitas alcanzar la etapa Dominio con evidencia sostenida. La etapa no sube por una sola respuesta." : "Sin feedback hasta el final. La recompensa exige 70% de aciertos sobre el total; las preguntas omitidas no suman.") + "</div></section>";
      start = locked
        ? '<button class="q-btn q-btn--block" type="button" disabled>' + icon("lock", 15) + " Bloqueado hasta Dominio</button>"
        : '<button class="q-btn q-btn--block q-btn--lg" type="button" data-action="start-mode" data-mode="simulacro">' + icon("swords", 15) + " Empezar simulacro</button>";
      aside = '<section class="q-panel q-panel--pad"><span class="q-kicker">Recompensas</span><div class="q-reward-list"><div class="q-reward-line"><span>' + icon("spark", 14) + "Finalización</span><b>+" + C.xp.completion.simulacro + " XP</b></div><div class=\"q-reward-line\"><span>" + icon("coins", 14) + "Monedas</span><b>+" + C.coins.completion.simulacro + "</b></div><div class=\"q-reward-line\"><span>" + icon("spark", 14) + 'Por acierto</span><b>50 XP</b></div></div><p class=\"q-xs q-muted\" style=\"margin-top:12px\">Una vez por día para la recompensa de finalización. El resultado prioriza precisión y cobertura.</p></section>';
    }
    return `<div class="q-page">
      <div class="q-crumbs"><a href="#/">Inicio</a>${icon("chevronRight", 12)}<span>${esc(def.label)}</span></div>
      <div class="q-detail"><div class="q-detail-main">${content}</div>
      <aside class="q-detail-aside">
        <section class="q-panel q-panel--pad q-panel--glow">
          <span class="q-kicker">Comenzar</span>
          <div style="margin-top:14px">${start}</div>
          <p class="q-xs q-muted" style="margin-top:10px">Puedes abandonar una sesión; las respuestas ya registradas se conservan y pierdes la recompensa de finalización anunciada.</p>
          <a class="q-btn q-btn--ghost q-btn--block q-btn--sm" style="margin-top:10px" href="#/">Volver al inicio</a>
        </section>
        ${aside}
      </aside></div></div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Juego                                                              */
  /* ------------------------------------------------------------------ */
  function renderPlay() {
    var session = Engine.getActive(state);
    if (!session) {
      return '<div class="q-page"><div class="q-empty"><div class="q-empty-icon">' + icon("play", 22) + '</div><h2>No hay una sesión activa</h2><p>Elige una misión, un desafío diario o un modo para empezar. Tu progreso anterior está guardado.</p><div class="q-empty-actions"><a class="q-btn q-btn--sm" href="#/mapa">Ver misiones</a><a class="q-btn q-btn--soft q-btn--sm" href="#/">Inicio</a></div></div></div>';
    }
    var valid = Engine.validateActive(state);
    if (!valid.ok) {
      return '<div class="q-page"><div class="q-panel q-panel--pad"><span class="q-kicker">Contenido actualizado</span><h1 style="margin-top:8px">La sesión no puede continuar.</h1><p class="q-muted" style="margin-top:8px">Algunas preguntas ya no están disponibles en el banco oficial. No se otorgará recompensa de finalización.</p><div class="q-data-actions"><button class="q-btn q-btn--danger" type="button" data-action="abandon">Cerrar sesión guardada</button><a class="q-btn q-btn--soft" href="#/">Volver al inicio</a></div></div></div>';
    }
    var item = Engine.currentItem(session);
    var question = item ? Content.getQuestion(item.questionId) : null;
    if (!item || !question) {
      return '<div class="q-page"><div class="q-empty"><div class="q-empty-icon">' + icon("alert", 22) + '</div><h2>La pregunta actual no está disponible</h2><p>Cierra la sesión para volver a empezar. No se otorgará recompensa de finalización.</p><div class="q-empty-actions"><button class="q-btn q-btn--danger q-btn--sm" type="button" data-action="abandon">Cerrar sesión</button></div></div></div>';
    }
    var entry = session.answers[item.questionId] || null;
    var total = session.questions.length;
    var index = session.cursor;
    var answeredCount = session.answerOrder.length;
    var timer = timerMarkup(session);
    var lives = session.mode === "survival" ? '<span class="q-lives" aria-label="' + session.lives + ' oportunidades restantes">' + Array.from({ length: session.maxLives }).map(function (_, i) { return '<span class="q-life ' + (i >= session.lives ? "is-lost" : "") + '"></span>'; }).join("") + "</span>" : "";

    var progress = session.questions.map(function (_, i) {
      var qid = session.questions[i].questionId;
      var done = !!session.answers[qid];
      var cls = done ? "is-done" : (i === index ? "is-current" : "");
      return '<span class="' + cls + '" aria-hidden="true"><i></i></span>';
    }).join("");

    var options = question.options.map(function (opt, i) {
      var isEntry = entry && !entry.omitted && entry.chosen === opt.id;
      var isCorrect = entry && session.feedback === "inmediata" && opt.id === question.answer;
      var isWrong = entry && session.feedback === "inmediata" && isEntry && !entry.correct;
      var cls = "";
      if (entry) {
        if (session.feedback === "inmediata") {
          if (isCorrect) cls = "is-correct";
          else if (isWrong) cls = "is-wrong";
          else if (!entry.omitted) cls = "is-muted";
        } else if (isEntry) cls = "is-selected";
      }
      var mark = "";
      if (isCorrect) mark = icon("check", 17);
      else if (isWrong) mark = icon("close", 17);
      return '<button class="q-option ' + cls + '" type="button" data-action="answer" data-letter="' + esc(opt.id) + '" data-question="' + esc(question.id) + '"' + (entry ? " disabled" : "") + ' aria-pressed="' + (isEntry ? "true" : "false") + '">' +
        '<span class="q-option-letter">' + esc(opt.id) + '</span><span class="q-option-text">' + esc(opt.text) + '</span><span class="q-option-mark">' + mark + "</span></button>";
    }).join("");

    var feedback = entry ? renderFeedback(session, question, item, entry) : "";
    var canSkip = !entry && (session.mode === "survival" || session.mode === "timed" || session.mode === "simulacro" || session.mode === "boss");
    var nextLabel = entry ? (index >= total - 1 || (session.mode === "survival" && session.lives <= 0) ? "Ver resultados" : "Siguiente pregunta") : "Elige una alternativa";
    var nextAction = entry ? '<button class="q-btn q-btn--lg" type="button" data-action="next" data-autofocus="1">' + esc(nextLabel) + " " + icon("arrowRight", 15) + "</button>" : '<button class="q-btn q-btn--lg" type="button" disabled>' + esc(nextLabel) + "</button>";
    var skip = canSkip ? '<button class="q-btn q-btn--ghost q-btn--sm" type="button" data-action="skip">Omitir</button>' : "";

    return '<div class="q-game">' +
      '<div class="q-gamebar"><div class="q-gamebar-left"><button class="q-iconbtn" type="button" data-action="abandon" aria-label="Abandonar sesión">' + icon("close", 17) + '</button><div class="q-gamebar-title"><b>' + esc(session.title) + "</b><span>" + esc(MODE_LABEL[session.mode] || "Sesión") + " · " + esc(C.stages[session.stage] ? C.stages[session.stage].name : "") + " · pregunta " + (index + 1) + " de " + total + "</span></div></div>" +
      '<div class="q-gamebar-right"><span class="q-chip">' + icon(MODE_ICON[session.mode] || "flag", 12) + esc(MODE_LABEL[session.mode] || "Sesión") + "</span>" + lives + timer + "</div></div>" +
      '<div class="q-game-progress" aria-hidden="true">' + progress + "</div>" +
      '<div class="q-game-body">' +
        '<div class="q-qmeta"><div class="q-qmeta-left">' + areaChip(question.areaId) + tierChip(item.tier) + (session.feedback === "diferida" ? '<span class="q-chip q-chip--violet">Sin feedback hasta el final</span>' : '<span class="q-chip q-chip--green">Feedback inmediato</span>') + '</div><span class="q-xs q-muted">' + answeredCount + (answeredCount === 1 ? " registrada" : " registradas") + " · " + (total - answeredCount) + " restantes</span></div>" +
        '<section class="q-panel q-question-card" aria-labelledby="q-stem"><h1 id="q-stem" tabindex="-1"' + (!entry ? ' data-autofocus="1"' : "") + '>' + esc(question.stem) + '</h1><div class="q-question-source">' + icon("book", 12) + "<span>" + esc(Content.sourceLabel(question)) + " · clave verificada</span></div><div class=\"q-options\">" + options + "</div>" +
        '<div class="q-row q-between" style="margin-top:14px"><span class="q-xs q-muted">' + icon("info", 12) + " Atajos: A–D o 1–4" + (entry ? " · Enter para continuar" : "") + "</span><span class=\"q-xs q-muted\">" + esc(item.reason || "") + "</span></div>" +
        feedback + "</section>" +
      "</div>" +
      '<div class="q-game-footer"><div class="q-game-footer-info">' + (entry ? (entry.omitted ? "Pregunta omitida · sin XP" : "Respuesta registrada · +" + entry.xp + " XP") : "La sesión se guarda después de cada respuesta") + '</div><div class="q-game-footer-actions">' + skip + nextAction + "</div></div>" +
    "</div>";
  }

  function timerMarkup(session) {
    if (session.timerMode === "none") return "";
    return '<span class="q-timer" data-timer data-session-id="' + esc(session.id) + '">' + icon("timer", 14) + "<span data-timer-text>--:--</span></span>";
  }

  function renderFeedback(session, question, item, entry) {
    var immediate = session.feedback === "inmediata";
    if (!immediate) {
      return '<div class="q-feedback" role="status"><div class="q-feedback-head"><span class="q-feedback-icon">' + icon(entry.omitted ? "clock" : "check", 16) + '</span><div><b>' + (entry.omitted ? "Sin respuesta" : "Respuesta registrada") + '</b><span>' + (entry.omitted ? "No se registró una alternativa." : "La corrección se mostrará al final de la sesión.") + '</span></div></div><div class="q-deferred-note">' + icon("eyeOff", 15) + "<span>No se revela la clave durante un jefe o una prueba cronometrada.</span></div></div>";
    }
    var correct = !!entry.correct && !entry.omitted;
    var recommendation = entry.recommendation;
    if (!recommendation && !correct) {
      var rec = Content.recommendationFor(question);
      recommendation = {
        sheetId: rec.sheet ? rec.sheet.id : "",
        label: rec.label,
        href: rec.href
      };
    }
    var title = entry.omitted ? "Sin respuesta" : (correct ? "Respuesta correcta" : "Respuesta incorrecta");
    var sub = entry.omitted ? "El tiempo terminó o decidiste omitir." : (correct ? "La clave coincide con el PDF oficial." : "Revisa la clave y la ficha sugerida.");
    var answerLine = "Clave oficial: <b>" + esc(question.answer) + " · " + esc(question.answerText) + "</b>";
    if (entry.chosen && !entry.omitted) {
      var chosen = question.options.filter(function (o) { return o.id === entry.chosen; })[0];
      answerLine += "<br>Tu respuesta: <b>" + esc(entry.chosen) + " · " + esc(chosen ? chosen.text : "") + "</b>";
    }
    var reward = "";
    if (correct) {
      reward = '<div class="q-row q-wrap" style="margin-top:10px"><span class="q-xp-pop">' + icon("spark", 13) + " +" + entry.xp + " XP</span>" + (entry.coins ? '<span class="q-chip q-chip--amber">' + icon("coins", 12) + " +" + entry.coins + "</span>" : "") + '<span class="q-xs q-muted">' + esc(entry.rewardReason) + "</span></div>";
    } else if (entry.rewardReason) {
      reward = '<p class="q-xs q-muted" style="margin-top:8px">' + esc(entry.rewardReason) + "</p>";
    }
    var linkSheet = recommendation && recommendation.sheetId ? sheetLink(recommendation.sheetId, "Abrir ficha: " + (Content.getSheet(recommendation.sheetId) ? Content.getSheet(recommendation.sheetId).title : recommendation.label), question.id) : "";
    var note = correct
      ? "La clave está verificada en el PDF oficial. El banco no añade una explicación editorial por pregunta."
      : "La ficha sugerida es apoyo de estudio: abrirla no marca dominio. La recuperación se registra al volver a responder correctamente en una sesión posterior.";
    return '<div class="q-feedback ' + (correct ? "is-correct" : "is-wrong") + '" role="status"><div class="q-feedback-head"><span class="q-feedback-icon">' + icon(correct ? "check" : (entry.omitted ? "clock" : "close"), 16) + '</span><div><b>' + esc(title) + "</b><span>" + esc(sub) + "</span></div></div>" +
      '<div class="q-feedback-answer">' + answerLine + "</div>" + reward +
      '<div class="q-feedback-actions">' + linkSheet + sourceLink(question, "Ver PDF · página " + question.page) + "</div>" +
      '<div class="q-feedback-note">' + esc(note) + "</div></div>";
  }

  /* ------------------------------------------------------------------ */
  /* Resultados                                                         */
  /* ------------------------------------------------------------------ */
  function renderResult(id) {
    var session = Engine.sessionById(state, id);
    if (!session || !session.result) {
      return renderNotFound("Ese resultado no está disponible", "La sesión no existe en este navegador o todavía no terminó. Vuelve al inicio para continuar.");
    }
    var r = session.result;
    var pass = !!r.pass;
    var title = r.abandoned ? "Sesión abandonada" : (pass ? "Objetivo alcanzado" : (session.mode === "mission" ? "Misión incompleta" : "Objetivo no alcanzado"));
    if (session.mode === "daily" && pass) title = "Desafío diario completado";
    if (session.mode === "boss" && pass) title = "Jefe superado";
    if (session.mode === "survival" && pass) title = "Supervivencia completada";
    if (session.mode === "recovery" && pass) title = "Recuperación completada";
    if (session.mode === "timed" && pass) title = "Contrarreloj superado";
    var areaRows = C.areas.map(function (areaId) {
      var a = r.areaBreakdown[areaId];
      if (!a || !a.answered) return "";
      var meta = C.areaMeta[areaId];
      var pct = a.answered ? Math.round((a.correct / a.answered) * 100) : 0;
      return '<div class="q-mastery-row q-mastery-row--compact"><span class="q-row">' + '<span class="q-area-dot" style="--area:' + meta.accent + '"></span><b>' + esc(meta.short) + "</b></span>" + progressBar(pct, "Precisión " + meta.short, pct >= 70 ? "q-progress--green" : "q-progress--amber") + '<small>' + a.correct + "/" + a.answered + "</small></div>";
    }).join("");

    var review = (session.answerOrder || []).map(function (qid, i) {
      var entry = session.answers[qid];
      var q = Content.getQuestion(qid);
      if (!entry || !q) return "";
      var cls = entry.omitted ? "is-omitted" : (entry.correct ? "is-correct" : "is-wrong");
      var statusIcon = entry.omitted ? "clock" : (entry.correct ? "check" : "close");
      var chosen = entry.chosen ? (q.options.filter(function (o) { return o.id === entry.chosen; })[0] || null) : null;
      return '<details class="q-review-item ' + cls + '"><summary><span class="q-review-status">' + icon(statusIcon, 12) + "</span><b>" + (i + 1) + ". " + esc(q.stem) + "</b>" + (entry.xp ? '<span class="q-chip q-chip--blue">+' + entry.xp + " XP</span>" : "") + "</summary><div class=\"q-review-body\"><p><b>Pregunta:</b> " + esc(q.stem) + "</p><p><b>Clave:</b> " + esc(q.answer) + " · " + esc(q.answerText) + "</p>" + (entry.chosen ? "<p><b>Tu respuesta:</b> " + esc(entry.chosen) + (chosen ? " · " + esc(chosen.text) : "") + "</p>" : "<p><b>Sin respuesta registrada.</b></p>") + "<p><b>Fuente:</b> " + esc(Content.sourceLabel(q)) + "</p><div class=\"q-review-links\">" + sourceLink(q, "Ver PDF") + (entry.recommendation && entry.recommendation.sheetId ? sheetLink(entry.recommendation.sheetId, "Reforzar con ficha", q.id) : "") + "</div></div></details>";
    }).join("");
    var recs = (r.recommendations || []).map(function (rec) {
      var sheet = Content.getSheet(rec.sheetId);
      if (!sheet) return "";
      return '<div class="q-result-line"><span>' + icon("book", 13) + " " + esc(sheet.title) + "</span>" + sheetLink(sheet.id, "Abrir ficha", "") + "</div>";
    }).join("");
    var achievements = (r.achievements || []).map(function (a) {
      return '<span class="q-chip q-chip--violet">' + icon("award", 12) + " " + esc(a.name) + " +" + a.xp + " XP</span>";
    }).join("");
    var completionNote = r.completion && r.completion.reason ? r.completion.reason : "";
    var breakdown = '<div class="q-result-list"><div class="q-result-line"><span>Preguntas correctas</span><b>' + r.correct + "</b></div><div class=\"q-result-line\"><span>Incorrectas</span><b>" + r.wrong + "</b></div><div class=\"q-result-line\"><span>Sin respuesta / omitidas</span><b>" + r.omitted + "</b></div><div class=\"q-result-line\"><span>Respondidas</span><b>" + r.answered + " / " + r.total + "</b></div><div class=\"q-result-line is-total\"><span>Puntuación de sesión</span><b>" + r.score + " pts</b></div></div>";
    var rewardLines = '<div class="q-result-list"><div class="q-result-line"><span>XP por respuestas</span><b>+' + r.questionXp + "</b></div><div class=\"q-result-line\"><span>XP por finalización</span><b>+" + r.completionXp + "</b></div>" + (r.achievementXp ? '<div class="q-result-line"><span>XP por logros</span><b>+' + r.achievementXp + "</b></div>" : "") + (r.weekly && r.weekly.xp ? '<div class="q-result-line"><span>Bono semanal</span><b>+' + r.weekly.xp + "</b></div>" : "") + '<div class="q-result-line is-total"><span>XP total</span><b>+' + r.xpEarned + "</b></div><div class=\"q-result-line\"><span>Monedas</span><b>+" + r.coinsEarned + "</b></div></div>";
    var stageChange = r.stageChange ? '<div class="q-detail-note" style="margin-top:12px;background:var(--violet-soft);border-color:color-mix(in srgb,var(--violet) 24%,transparent)"><b>Etapa ' + (r.stageChange.to > r.stageChange.from ? "ascendida" : "ajustada") + ".</b> " + esc(r.stageChange.reason) + "</div>" : "";
    return '<div class="q-page">' +
      '<div class="q-panel q-result-hero ' + (pass ? "" : "is-fail") + '"><div class="q-result-top"><div><span class="q-kicker">' + esc(MODE_LABEL[session.mode] || "Sesión") + " · " + esc(U.formatDate(session.endedAt, true)) + "</span><h1>" + esc(title) + "</h1><p>" + esc(session.title) + " · " + esc(r.completionLabel) + "</p><div class=\"q-detail-tags\" style=\"margin-top:14px\"><span class=\"q-chip " + (pass ? "q-chip--green" : "q-chip--amber") + "\">" + (pass ? "Objetivo cumplido" : "Sin recompensa de finalización") + "</span>" + (r.abandoned ? '<span class="q-chip q-chip--red">Abandonada</span>' : "") + (r.rankUp ? '<span class="q-chip q-chip--violet">Nuevo rango: ' + esc(r.rankAfter) + "</span>" : (r.rankDown ? '<span class="q-chip q-chip--amber">Rango ajustado: ' + esc(r.rankAfter) + "</span>" : "")) + "</div></div>" +
      '<div class="q-result-score">' + scoreRing(r.accuracy * 100, "precisión", pass ? "var(--green)" : "var(--red)") + '<div><div class="q-result-stat" style="padding:12px 14px"><b>' + r.score + '</b><span>puntos de sesión</span></div><div class="q-xs q-muted" style="margin-top:7px">' + r.correct + " de " + r.total + " preguntas correctas</div></div></div></div>" +
      '<div class="q-result-stats"><div class="q-result-stat"><b>' + r.correct + '</b><span>correctas</span></div><div class="q-result-stat"><b>' + r.wrong + '</b><span>incorrectas</span></div><div class="q-result-stat"><b>' + r.omitted + '</b><span>sin respuesta</span></div><div class="q-result-stat"><b>' + U.formatDuration(r.totalTimeMs) + '</b><span>tiempo</span></div></div></div>' +

      '<div class="q-result-grid"><section class="q-panel q-panel--pad"><span class="q-kicker">Recompensas registradas</span>' + rewardLines + '<p class="q-xs q-muted" style="margin-top:10px">' + esc(completionNote) + '</p><div class="q-data-actions">' + (session.mode === "mission" || session.mode === "boss" ? '<button class="q-btn q-btn--soft q-btn--sm" type="button" data-action="retry" data-mission="' + esc(session.missionId) + '">' + icon("rotate", 14) + " Repetir</button>" : "") + '<a class="q-btn q-btn--ghost q-btn--sm" href="#/mapa">Volver al mapa</a><a class="q-btn q-btn--ghost q-btn--sm" href="#/">Inicio</a></div></section>' +
      '<section class="q-panel q-panel--pad"><span class="q-kicker">Progreso</span>' + breakdown + stageChange + (achievements ? '<div style="margin-top:12px"><span class="q-kicker">Logros desbloqueados</span><div class="q-detail-tags" style="margin-top:8px">' + achievements + "</div></div>" : "") + '<div class="q-result-list" style="margin-top:12px"><div class="q-result-line"><span>Nivel</span><b>' + r.levelBefore + " → " + r.levelAfter + '</b></div><div class="q-result-line"><span>Rango</span><b>' + esc(r.rankBefore || "—") + " → " + esc(r.rankAfter || "—") + '</b></div>' + (r.dailyStreak != null ? '<div class="q-result-line"><span>Racha diaria</span><b>' + r.dailyStreak + " " + plural(r.dailyStreak, "día", "días") + '</b></div>' : "") + '</div></section></div>' +

      (areaRows ? '<section class="q-panel q-panel--pad"><div class="q-section-head"><div><span class="q-kicker">Desempeño por área</span><h2>Dónde acertaste.</h2></div></div><div class="q-area-mastery" style="margin-top:12px">' + areaRows + "</div></section>" : "") +
      (recs ? '<section class="q-panel q-panel--pad"><div class="q-section-head"><div><span class="q-kicker">Siguiente estudio</span><h2>Fichas para reforzar.</h2><p>Abrirlas no marca dominio; la recuperación se registra al responder.</p></div></div><div class="q-result-list">' + recs + "</div></section>" : "") +
      '<section class="q-panel q-panel--pad"><div class="q-section-head"><div><span class="q-kicker">Revisión</span><h2>Respuestas registradas.</h2><p>La puntuación se calculó solo con estas respuestas.</p></div></div><div class="q-review">' + (review || '<p class="q-small q-muted">No se registraron respuestas en esta sesión.</p>') + "</div></section>" +
      '<p class="q-xs q-muted">Contenido: banco oficial de Examen Studio y temario Study. Las claves provienen de los PDFs originales; no se inventaron explicaciones ni referencias.</p>' +
    "</div>";
  }

  /* ------------------------------------------------------------------ */
  /* Errores                                                            */
  /* ------------------------------------------------------------------ */
  function renderErrors() {
    var stats = Content.recoveryStats(state);
    var now = new Date();
    var errors = Object.keys(state.errors).map(function (id) { return state.errors[id]; }).filter(function (err) {
      return err && Content.getQuestion(err.questionId);
    }).sort(function (a, b) {
      var ad = a.nextReviewAt && new Date(a.nextReviewAt).getTime() <= now.getTime();
      var bd = b.nextReviewAt && new Date(b.nextReviewAt).getTime() <= now.getTime();
      if (ad !== bd) return ad ? -1 : 1;
      return String(b.lastAt || "").localeCompare(String(a.lastAt || ""));
    });
    var filtered = errors.filter(function (e) {
      if (ui.errorFilter === "due") return !e.nextReviewAt || new Date(e.nextReviewAt).getTime() <= now.getTime();
      if (ui.errorFilter === "pending") return !e.recoveredAt;
      if (ui.errorFilter === "recovered") return !!e.recoveredAt;
      return true;
    });
    var tabs = [
      { id: "due", label: "Listas · " + stats.due },
      { id: "pending", label: "Pendientes · " + stats.pending },
      { id: "recovered", label: "Recuperadas · " + stats.recovered },
      { id: "all", label: "Todas · " + stats.total }
    ].map(function (t) {
      return '<button class="q-filter-tab ' + (ui.errorFilter === t.id ? "is-active" : "") + '" type="button" data-action="errors-filter" data-filter="' + t.id + '" aria-pressed="' + (ui.errorFilter === t.id) + '">' + esc(t.label) + "</button>";
    }).join("");
    var list = filtered.map(function (err) {
      var q = Content.getQuestion(err.questionId);
      var qstats = state.questions[q.id] || {};
      var due = !err.nextReviewAt || new Date(err.nextReviewAt).getTime() <= now.getTime();
      var status = due ? '<span class="q-chip q-chip--amber">Lista para repasar</span>' : (err.recoveredAt ? '<span class="q-chip q-chip--green">Recuperada</span>' : '<span class="q-chip q-chip--blue">Programada</span>');
      var sheet = err.sheetId ? Content.getSheet(err.sheetId) : null;
      var recHref = Content.studyHref(sheet ? sheet.id : "", err.areaId);
      return '<article class="q-error-item"><div><h3>' + esc(q.stem) + "</h3><div class=\"q-error-meta\">" + areaChip(err.areaId) + confidenceChip(err.confidence) + status + (err.studyOpenedAt ? '<span class="q-chip q-chip--blue">Ficha abierta</span>' : "") + '<span class="q-xs q-muted">' + (err.count || 1) + " " + plural(err.count || 1, "fallo", "fallos") + " · " + (qstats.attempts || 0) + " " + plural(qstats.attempts || 0, "intento", "intentos") + " · " + (qstats.correct || 0) + " " + plural(qstats.correct || 0, "acierto", "aciertos") + "</span><span class=\"q-xs q-muted\">Próximo: " + esc(U.formatDue(err.nextReviewAt)) + "</span></div></div>" +
        '<div class="q-error-actions"><a class="q-btn q-btn--soft q-btn--sm" href="' + esc(recHref) + '" target="_blank" rel="noopener" data-study-sheet="' + esc(sheet ? sheet.id : "") + '" data-question-id="' + esc(q.id) + '">' + icon("book", 13) + " " + (sheet ? "Abrir ficha" : "Abrir Study") + "</a>" + sourceLink(q, "PDF") + "</div></article>";
    }).join("");
    return '<div class="q-page">' +
      '<div class="q-section-head"><div><span class="q-kicker">Recuperación</span><h1 style="font-size:clamp(28px,4vw,44px)">Volver a mirar lo que falló.</h1><p>Repaso espaciado con evidencia. Abrir una ficha no marca dominio.</p></div>' + (stats.due ? '<button class="q-btn q-btn--lg" type="button" data-action="start-mode" data-mode="recuperacion">' + icon("rotate", 15) + " Recuperar " + stats.due + "</button>" : "") + "</div>" +
      '<div class="q-grid q-grid--4">' + '<div class="q-stat"><b>' + stats.due + "</b><span>listas ahora</span></div>" + '<div class="q-stat"><b>' + stats.pending + "</b><span>pendientes</span></div>" + '<div class="q-stat"><b>' + stats.recovered + "</b><span>recuperadas</span></div>" + '<div class="q-stat"><b>' + stats.mastered + "</b><span>2 aciertos espaciados</span></div></div>" +
      '<div class="q-panel q-panel--pad"><div class="q-section-head"><div><span class="q-kicker">Historial</span><h2>Preguntas falladas.</h2><p>Los errores vuelven tras un intervalo; un acierto no borra el historial.</p></div><div class="q-filter-tabs">' + tabs + "</div></div>" +
      (list ? '<div class="q-error-list" style="margin-top:14px">' + list + "</div>" : '<div class="q-empty" style="margin-top:14px"><div class="q-empty-icon">' + icon("checkCircle", 22) + '</div><h2>Nada en este filtro</h2><p>Cuando falles una pregunta aparecerá aquí con su próxima revisión.</p><div class="q-empty-actions"><a class="q-btn q-btn--soft q-btn--sm" href="#/mapa">Seguir con misiones</a></div></div>') +
      "</div>" +
      '<p class="q-xs q-muted">La primera revisión se habilita 20 minutos después del fallo. Los aciertos posteriores espacian la revisión 1, 3, 7, 14 y 30 días. Las fichas se recomiendan por afinidad temática.</p>' +
    "</div>";
  }

  /* ------------------------------------------------------------------ */
  /* Perfil                                                             */
  /* ------------------------------------------------------------------ */
  function renderProfile() {
    var stats = statsOf();
    var level = levelOf();
    var rank = rankOf();
    var rp = P.rankProgress(stats);
    var areaRows = C.areas.map(function (areaId) {
      var meta = C.areaMeta[areaId];
      var a = state.academic.byArea[areaId] || {};
      var reliable = Number(a.reliableAnswered) || 0;
      var answered = reliable > 0 ? reliable : (Number(a.answered) || 0);
      var correct = reliable > 0 ? (Number(a.reliableCorrect) || 0) : (Number(a.correct) || 0);
      var pct = answered ? Math.round((correct / answered) * 100) : 0;
      return '<div class="q-mastery-row"><span class="q-row"><span class="q-area-dot" style="--area:' + meta.accent + '"></span><b>' + esc(meta.short) + "</b></span>" + progressBar(pct, "Precisión en " + meta.short, pct >= 70 ? "q-progress--green" : "q-progress--amber") + '<small>' + (answered ? pct + "%" : "—") + '</small><small>' + (answered ? answered + " " + plural(answered, "respuesta fiable", "respuestas fiables") : "Sin evidencia") + "</small></div>";
    }).join("");
    var rankSteps = C.ranks.map(function (r) {
      var done = stats.xp >= r.xp && stats.answered >= r.answered && stats.accuracy >= r.accuracy &&
        stats.mastered >= r.mastered && stats.areasCorrect >= r.areas && stats.bosses >= r.bosses;
      var current = rank.id === r.id;
      return '<div class="q-rank-step ' + (current ? "is-current" : (done ? "is-done" : "")) + '"><span class="q-rank-dot"></span><b>' + esc(r.name) + "</b><small>" + r.xp + " XP" + (r.accuracy ? " · " + Math.round(r.accuracy * 100) + "%" : "") + "</small></div>";
    }).join("");
    var missing = rp.missing.map(function (m) { return esc(m.label) + " " + m.have + "/" + m.need + (m.suffix || ""); }).join(" · ");
    var recent = state.sessions.slice(0, 6).map(sessionRow).join("");
    var recentAch = C.achievements.filter(function (d) { return state.achievements[d.id] && state.achievements[d.id].unlockedAt; }).slice(-4).map(achievementCard).join("");
    return '<div class="q-page">' +
      '<div class="q-panel q-profile-hero"><div class="q-profile-id">' + avatar(state.profile.name) + '<div><span class="q-kicker">Perfil local</span><h1>' + esc(state.profile.name) + "</h1><p>" + esc(rank.name) + " · " + esc(rank.description) + "</p></div></div><div class=\"q-profile-xp\"><div class=\"q-progress-head\"><span>Nivel " + level.level + "</span><b>" + state.xp + " XP</b></div><b>" + (level.maxed ? "Máximo" : level.intoLevel + " / " + level.needed) + '</b><span class="q-xs q-muted">' + (level.maxed ? "Nivel máximo alcanzado" : "para el nivel " + (level.level + 1)) + "</span>" + progressBar(level.percent, "Progreso de nivel") + "</div></div>" +
      '<div class="q-profile-grid">' + '<div class="q-stat"><b>' + stats.answered + "</b><span>respondidas</span></div>" + '<div class="q-stat"><b>' + Math.round(stats.accuracy * 100) + "%</b><span>precisión</span></div>" + '<div class="q-stat"><b>' + stats.mastered + "</b><span>dominadas</span></div>" + '<div class="q-stat"><b>' + stats.missions + "</b><span>misiones</span></div>" + '<div class="q-stat"><b>' + stats.bosses + "</b><span>jefes</span></div>" + '<div class="q-stat"><b>' + stats.recoveries + "</b><span>recuperadas</span></div></div>" +
      `<div class="q-section-grid"><section class="q-panel q-panel--pad"><div class="q-section-head"><div><span class="q-kicker">Rango</span><h2>${esc(rank.name)}</h2><p>${rp.next ? "Siguiente: " + esc(rp.next.name) + " · " + rp.percent + "% de criterios cumplidos." : "Rango máximo alcanzado."}</p></div><span class="q-chip q-chip--violet">${icon("award", 12)} ${state.coins} monedas</span></div><div class="q-rank-ladder" style="margin-top:12px">${rankSteps}</div>` + (rp.next ? '<p class="q-xs q-muted" style="margin-top:10px">Falta: ' + missing + '</p>' : "") + `</section>` +
      '<section class="q-panel q-panel--pad"><div class="q-section-head"><div><span class="q-kicker">Precisión por área</span><h2>Dónde tienes evidencia.</h2><p>Se prioriza la evidencia de afinidad alta o media. Sin evidencia no se inventa un porcentaje.</p></div></div><div class="q-area-mastery" style="margin-top:12px">' + areaRows + "</div></section></div>" +
      '<div class="q-section-grid"><section class="q-panel q-panel--pad"><div class="q-section-head"><div><span class="q-kicker">Actividad</span><h2>Últimas sesiones.</h2></div><a class="q-textlink" href="#/registro">Ver registro ' + icon("arrowRight", 13) + "</a></div>" + (recent ? '<div class="q-session-list" style="margin-top:12px">' + recent + "</div>" : '<p class="q-small q-muted" style="margin-top:12px">Aún no hay sesiones completadas.</p>') + "</section>" +
      '<section class="q-panel q-panel--pad"><div class="q-section-head"><div><span class="q-kicker">Logros</span><h2>Tu constancia.</h2></div><a class="q-textlink" href="#/logros">Ver todos ' + icon("arrowRight", 13) + "</a></div>" + (recentAch ? '<div class="q-achievement-grid q-achievement-grid--2" style="margin-top:12px">' + recentAch + "</div>" : '<p class="q-small q-muted" style="margin-top:12px">Todavía no hay logros desbloqueados.</p>') + "</section></div>" +
      '<div class="q-panel q-panel--pad"><div class="q-section-head"><div><span class="q-kicker">Identidad local</span><h2>Ajustes del perfil.</h2><p>Este perfil vive en este navegador. No hay cuentas ni clasificación mundial.</p></div><a class="q-btn q-btn--soft q-btn--sm" href="#/ajustes">' + icon("settings", 14) + " Editar perfil y datos</a></div></div>" +
    "</div>";
  }

  /* ------------------------------------------------------------------ */
  /* Logros                                                             */
  /* ------------------------------------------------------------------ */
  function achievementCard(def) {
    var unlocked = state.achievements[def.id] && state.achievements[def.id].unlockedAt;
    var progress = P.achievementProgress(def, statsOf());
    return '<article class="q-achievement ' + (unlocked ? "is-unlocked" : "") + '"><div class="q-achievement-icon">' + icon(def.icon || "award", 19) + "</div><div><h3>" + esc(def.name) + "</h3><p>" + esc(def.description) + "</p></div><div class=\"q-achievement-foot\">" + progressBar(unlocked ? 100 : progress.percent, "Progreso de " + def.name, unlocked ? "q-progress--green" : "") + '<div class="q-row"><span>' + (unlocked ? "Desbloqueado · " + esc(U.formatDate(state.achievements[def.id].unlockedAt)) : progress.display) + '</span><span class="q-xs">+' + def.xp + " XP" + (def.coins ? " · +" + def.coins : "") + "</span></div></div></article>";
  }

  function renderAchievements() {
    var stats = statsOf();
    var unlocked = C.achievements.filter(function (d) { return state.achievements[d.id] && state.achievements[d.id].unlockedAt; }).length;
    var filtered = C.achievements.filter(function (d) {
      var isUnlocked = !!(state.achievements[d.id] && state.achievements[d.id].unlockedAt);
      if (ui.achievementFilter === "unlocked") return isUnlocked;
      if (ui.achievementFilter === "locked") return !isUnlocked;
      return true;
    });
    var tabs = [
      { id: "all", label: "Todos · " + C.achievements.length },
      { id: "unlocked", label: "Desbloqueados · " + unlocked },
      { id: "locked", label: "Pendientes · " + (C.achievements.length - unlocked) }
    ].map(function (t) {
      return '<button class="q-filter-tab ' + (ui.achievementFilter === t.id ? "is-active" : "") + '" type="button" data-action="achievements-filter" data-filter="' + t.id + '" aria-pressed="' + (ui.achievementFilter === t.id) + '">' + esc(t.label) + "</button>";
    }).join("");
    return `<div class="q-page"><div class="q-section-head"><div><span class="q-kicker">Logros verificables</span><h1 style="font-size:clamp(28px,4vw,44px)">Hitos, no adornos.</h1><p>Cada logro se calcula con respuestas, misiones o rachas registradas en este navegador.</p></div><span class="q-chip q-chip--violet">${icon("award", 12)} ${unlocked} / ${C.achievements.length}</span></div><div class="q-filter-tabs">${tabs}</div><div class="q-achievement-grid">${filtered.map(achievementCard).join("")}</div></div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Registro local                                                     */
  /* ------------------------------------------------------------------ */
  function renderRanking() {
    var stats = statsOf();
    var sessions = state.sessions.filter(function (s) {
      return s.result && s.result.status === "finished" && s.result.pass && s.result.answered >= 3;
    });
    var sorted = sessions.slice().sort(function (a, b) {
      var as = a.result.score + a.result.accuracy * 100;
      var bs = b.result.score + b.result.accuracy * 100;
      if (bs !== as) return bs - as;
      return String(b.endedAt).localeCompare(String(a.endedAt));
    });
    var precision = sessions.filter(function (s) { return s.result.answered >= 5; }).sort(function (a, b) {
      if (b.result.accuracy !== a.result.accuracy) return b.result.accuracy - a.result.accuracy;
      return b.result.score - a.result.score;
    });
    var tabs = [
      { id: "sessions", label: "Sesiones" },
      { id: "precision", label: "Precisión" },
      { id: "areas", label: "Áreas" }
    ].map(function (t) {
      return '<button class="q-filter-tab ' + (ui.rankingTab === t.id ? "is-active" : "") + '" type="button" data-action="ranking-tab" data-tab="' + t.id + '" aria-pressed="' + (ui.rankingTab === t.id) + '">' + esc(t.label) + "</button>";
    }).join("");
    var body = "";
    if (ui.rankingTab === "areas") {
      body = '<div class="q-panel q-panel--pad"><div class="q-area-mastery">' + C.areas.map(function (areaId) {
        var meta = C.areaMeta[areaId];
        var a = state.academic.byArea[areaId] || {};
        var reliable = Number(a.reliableAnswered) || 0;
        var answered = reliable > 0 ? reliable : (Number(a.answered) || 0);
        var correct = reliable > 0 ? (Number(a.reliableCorrect) || 0) : (Number(a.correct) || 0);
        var pct = answered ? Math.round((correct / answered) * 100) : 0;
        return '<div class="q-mastery-row"><span class="q-row"><span class="q-area-dot" style="--area:' + meta.accent + '"></span><b>' + esc(meta.short) + "</b></span>" + progressBar(pct, "Precisión " + meta.short) + '<small>' + (answered ? pct + "%" : "—") + '</small><small>' + (answered ? answered + " respuestas" : "Sin evidencia") + "</small></div>";
      }).join("") + '</div><p class="q-xs q-muted" style="margin-top:12px">Solo se muestra la precisión de preguntas con afinidad alta o media. Es una señal de estudio, no una nota oficial.</p></div>';
    } else {
      var list = (ui.rankingTab === "precision" ? precision : sorted).slice(0, 20);
      body = list.length ? '<div class="q-session-list">' + list.map(function (s, i) {
        var r = s.result;
        return '<a class="q-session-row" href="#/resultado/' + encodeURIComponent(s.id) + '" style="grid-template-columns:30px minmax(0,1fr) 58px 56px 66px"><span class="q-session-icon" style="font-weight:700;color:' + (i < 3 ? "var(--amber)" : "var(--muted)") + '">' + (i + 1) + "</span><span><b>" + esc(s.title) + "</b><small>" + esc(U.formatDate(s.endedAt)) + " · " + esc(MODE_LABEL[s.mode] || "") + "</small></span><span class=\"q-session-score\">" + r.score + "</span><span class=\"q-session-acc\">" + Math.round(r.accuracy * 100) + "%</span><span class=\"q-session-xp q-xs\">+" + r.xpEarned + " XP</span></a>";
      }).join("") + "</div>" : '<div class="q-empty"><div class="q-empty-icon">' + icon("chart", 22) + '</div><h2>Sin sesiones para este registro</h2><p>Completa una sesión con respuestas para aparecer en tu registro local.</p><div class="q-empty-actions"><a class="q-btn q-btn--soft q-btn--sm" href="#/mapa">Empezar una misión</a></div></div>';
    }
    var records = '<div class="q-record-grid"><div class="q-record"><span>Mejor puntuación</span><b>' + (sorted[0] ? sorted[0].result.score : 0) + '</b></div><div class="q-record"><span>Mejor precisión</span><b>' + (precision[0] ? Math.round(precision[0].result.accuracy * 100) + "%" : "—") + '</b></div><div class="q-record"><span>XP acumulada</span><b>' + stats.xp + '</b></div><div class="q-record"><span>Misiones completadas</span><b>' + stats.missions + '</b></div><div class="q-record"><span>Racha máxima</span><b>' + (state.daily.bestStreak || 0) + " " + plural(state.daily.bestStreak || 0, "día", "días") + '</b></div><div class="q-record"><span>Preguntas dominadas</span><b>' + stats.mastered + "</b></div></div>";
    return '<div class="q-page"><div class="q-section-head"><div><span class="q-kicker">Registro local</span><h1 style="font-size:clamp(28px,4vw,44px)">Tu propia referencia.</h1><p>Sin usuarios simulados ni clasificación mundial. Solo resultados registrados en este navegador.</p></div><span class="q-chip">' + sessions.length + " sesiones válidas</span></div><div class=\"q-local-note\">" + icon("info", 15) + "<span>Este registro compara tus propias sesiones. No mezcla XP acumulada con competencia: la precisión y el dominio se muestran por separado.</span></div>" + records + '<div class="q-section"><div class="q-section-head"><div><span class="q-kicker">Historial</span><h2>Sesiones y precisión.</h2></div><div class="q-filter-tabs">' + tabs + "</div></div>" + body + "</div></div>";
  }

  /* ------------------------------------------------------------------ */
  /* Ajustes                                                            */
  /* ------------------------------------------------------------------ */
  function renderSettings() {
    var report = Content.contentReport();
    var status = Content.status || {};
    var storageMode = store.getMode();
    var conf = status.confidence || {};
    var sourceLinks = `<div class="q-source-links"><a href="../EXAMEN STUDIO/Examen Studio.html" target="_blank" rel="noopener">${icon("external", 13)}Examen Studio · banco oficial</a><a href="../study-dashboard/index.html" target="_blank" rel="noopener">${icon("external", 13)}Study Dashboard · fichas y temario</a><a href="../EXAMEN STUDIO/datos/banco-oficial.js" target="_blank" rel="noopener">${icon("book", 13)}Datos del banco (solo lectura)</a></div>`;
    return `<div class="q-page">
      <div class="q-section-head"><div><span class="q-kicker">Configuración</span><h1 style="font-size:clamp(28px,4vw,44px)">Control y transparencia.</h1><p>Tu progreso vive en este navegador. Puedes exportarlo, importarlo o archivarlo sin tocar otras aplicaciones.</p></div><span class="q-chip">${esc(C.build)}</span></div>
      <div class="q-settings-grid">
        <section class="q-panel q-settings-section"><h2>Perfil</h2><p>Nombre visible en este navegador.</p>
          <div style="margin-top:12px"><label class="q-xs q-muted" for="profile-name">Nombre</label><div class="q-row" style="margin-top:5px"><input class="q-input" id="profile-name" maxlength="40" value="${esc(state.profile.name)}"><button class="q-btn q-btn--sm" type="button" data-action="save-name">Guardar</button></div></div>
          <div class="q-setting-row"><div><b>Monedas acumuladas</b><small>Se reinician solo si reinicias el progreso. Límite de ganancia diaria: ${C.coins.dailyCap}.</small></div><b>${state.coins}</b></div>
        </section>
        <section class="q-panel q-settings-section"><h2>Experiencia</h2><p>Preferencias de la interfaz.</p>
          <div class="q-setting-row"><div><b>Tema</b><small>Oscuro por defecto; el tema claro mantiene la misma jerarquía.</small></div><button class="q-switch ${state.settings.theme === "light" ? "is-on" : ""}" type="button" data-action="toggle-setting" data-setting="theme" aria-label="Usar tema claro" aria-pressed="${state.settings.theme === "light"}"></button></div>
          <div class="q-setting-row"><div><b>Reducir movimiento</b><small>Anula animaciones sin quitar funciones.</small></div><button class="q-switch ${state.settings.reducedMotion ? "is-on" : ""}" type="button" data-action="toggle-setting" data-setting="reducedMotion" aria-label="Reducir movimiento" aria-pressed="${!!state.settings.reducedMotion}"></button></div>
          <div class="q-setting-row"><div><b>Feedback inmediato en misiones</b><small>Si lo desactivas, la clave se muestra al final. Los jefes y el contrarreloj siempre difieren el feedback.</small></div><button class="q-switch ${state.settings.instantFeedback ? "is-on" : ""}" type="button" data-action="toggle-setting" data-setting="instantFeedback" aria-label="Feedback inmediato en misiones" aria-pressed="${!!state.settings.instantFeedback}"></button></div>
        </section>
        <section class="q-panel q-settings-section"><h2>Datos</h2><p>Exporta un JSON legible, impórtalo en otro navegador o archiva el estado actual.</p>
          <div class="q-data-actions"><button class="q-btn q-btn--soft q-btn--sm" type="button" data-action="export">${icon("download", 14)} Exportar progreso</button><button class="q-btn q-btn--soft q-btn--sm" type="button" data-action="import-trigger">${icon("upload", 14)} Importar</button><button class="q-btn q-btn--danger q-btn--sm" type="button" data-action="reset">${icon("trash", 14)} Reiniciar QUEST</button></div>
          <p class="q-xs q-muted" style="margin-top:10px">Al reiniciar se guarda una copia en el archivo local de este navegador. No se borran Study Dashboard, Study Flashcards, Examen Studio ni Plazas.</p>
          <div class="q-setting-row"><div><b>Almacenamiento</b><small>${storageMode === "local" ? "LocalStorage disponible; escritura con diario de recuperación y respaldo." : "Modo memoria: este navegador bloquea el almacenamiento persistente. El progreso se perderá al recargar."}</small></div><span class="q-chip ${storageMode === "local" ? "q-chip--green" : "q-chip--red"}">${storageMode === "local" ? "Persistente" : "Temporal"}</span></div>
        </section>
        <section class="q-panel q-settings-section"><h2>Contenido y fuentes</h2><p>Integridad del banco y de la capa de afinidad.</p>
          <div class="q-integrity">
            <div class="q-integrity-line"><span>Preguntas de Psicología válidas</span><b>${report.questions}</b></div>
            <div class="q-integrity-line"><span>Preguntas excluidas sin clave verificable</span><b>${status.invalid || 0}</b></div>
            <div class="q-integrity-line"><span>Afinidad alta / media / baja</span><b>${conf.alta || 0} / ${conf.media || 0} / ${conf.baja || 0}</b></div>
            <div class="q-integrity-line"><span>Sin área asignada (no puntúan)</span><b>${conf["sin clasificar"] || 0}</b></div>
            <div class="q-integrity-line"><span>Misiones / jefes construidos</span><b>${report.missions} / ${report.bosses}</b></div>
            <div class="q-integrity-line"><span>Mapa</span><b>${esc(report.mapVersion || "—")}</b></div>
            <div class="q-integrity-line"><span>Correcciones editoriales</span><b>${report.manualOverrides || 0}</b></div>
          </div>
          ${report.contentWarnings && report.contentWarnings.length ? '<div class="q-detail-note" style="margin-top:10px">' + report.contentWarnings.map(function (w) { return esc(w); }).join("<br>") + '</div>' : ""}
          <div class="q-data-actions"><button class="q-btn q-btn--soft q-btn--sm" type="button" data-action="verify-content">${icon("refresh", 14)} Verificar ahora</button></div>
          ${sourceLinks}
          <p class="q-xs q-muted" style="margin-top:10px">La afinidad temática es una capa editorial determinista. No modifica el banco original ni sustituye la clasificación oficial.</p>
        </section>
        <section class="q-panel q-settings-section"><h2>Acerca de</h2><p>SERUMS QUEST · ${esc(C.build)}</p>
          <div class="q-integrity">
            <div class="q-integrity-line"><span>Versión</span><b>${esc(C.version)}</b></div>
            <div class="q-integrity-line"><span>Esquema de datos</span><b>${C.schemaVersion}</b></div>
            <div class="q-integrity-line"><span>Banco oficial</span><b>${esc(status.bankVersion || "—")}</b></div>
            <div class="q-integrity-line"><span>Temario Study</span><b>${esc(status.studyVersion || "—")}</b></div>
            <div class="q-integrity-line"><span>Backend remoto</span><b>Ninguno</b></div>
            <div class="q-integrity-line"><span>Tipografía</span><b>Google Fonts (CDN)</b></div>
          </div>
          <p class="q-xs q-muted" style="margin-top:10px">Contenido de Examen Studio y Study Dashboard, usado por referencia. Las claves no se inventaron. Las fichas son apoyo de estudio, no una explicación oficial de cada pregunta.</p>
        </section>
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Estados auxiliares                                                 */
  /* ------------------------------------------------------------------ */
  function renderNotFound(title, text) {
    return '<div class="q-page"><div class="q-empty"><div class="q-empty-icon">' + icon("question", 22) + "</div><h2>" + esc(title) + "</h2><p>" + esc(text) + '</p><div class="q-empty-actions"><a class="q-btn q-btn--sm" href="#/">Volver al inicio</a><a class="q-btn q-btn--soft q-btn--sm" href="#/mapa">Ver el mapa</a></div></div></div>';
  }

  function renderFatal(message, recover) {
    var view = qs("#view");
    var boot = qs("#q-boot");
    document.body.classList.add("is-fatal");
    if (boot) boot.hidden = true;
    if (view) {
      view.hidden = false;
      view.innerHTML = '<div class="q-page"><div class="q-fatal"><span class="q-kicker" style="color:var(--red)">No se pudo iniciar</span><h1>' + (recover ? "El progreso guardado no se pudo leer." : "Falta contenido verificable.") + '</h1><p>' + esc(message || "No se pudieron cargar los datos compartidos de Examen Studio o Study.") + "</p><ul><li>Abre SERUMS QUEST desde la carpeta del HUB, no desde una copia aislada.</li><li>Comprueba que existan <b>EXAMEN STUDIO/datos/banco-oficial.js</b>, <b>study-data/temario.js</b> y <b>serums-quest/data/quest-map.js</b>.</li><li>El HUB y las demás aplicaciones no fueron modificados.</li></ul><div class=\"q-data-actions\">" + (recover ? '<button class="q-btn q-btn--danger q-btn--sm" type="button" data-recover-quest>Archivar el estado dañado y crear un perfil nuevo</button>' : "") + '<a class="q-btn q-btn--sm" href="../index.html">Volver al HUB</a><a class="q-btn q-btn--soft q-btn--sm" href="tests/tests.html">Abrir pruebas</a></div></div></div>';
    }
  }

  /* ------------------------------------------------------------------ */
  /* Router y render                                                    */
  /* ------------------------------------------------------------------ */
  function parseRoute() {
    var raw = String(location.hash || "").replace(/^#\/?/, "");
    var parts = raw.split("/").filter(Boolean).map(function (p) {
      try { return decodeURIComponent(p); } catch (e) { return p; }
    });
    if (!parts.length) return { name: "home", id: "" };
    var head = parts[0];
    if (head === "mapa") return { name: "map", id: "" };
    if (head === "errores") return { name: "errors", id: "" };
    if (head === "perfil") return { name: "profile", id: "" };
    if (head === "logros") return { name: "achievements", id: "" };
    if (head === "registro") return { name: "ranking", id: "" };
    if (head === "ajustes") return { name: "settings", id: "" };
    if (head === "jugar") return { name: "play", id: "" };
    if (head === "mision" && parts[1]) return { name: "mission", id: parts[1] };
    if (head === "modo" && parts[1]) return { name: "mode", id: parts[1] };
    if (head === "resultado" && parts[1]) return { name: "result", id: parts[1] };
    return { name: "notfound", id: "" };
  }

  function routeKey(r) { return r.name + ":" + (r.id || ""); }

  function render() {
    if (!booted) return;
    var next = parseRoute();
    if (next.name === "play" && !state.activeSession) next = { name: "home", id: "" };
    if (next.name === "result" && (!Engine.sessionById(state, next.id) || !Engine.sessionById(state, next.id).result)) next = { name: "notfound", id: "" };
    route = next;
    var key = routeKey(route);
    var changedRoute = key !== ui.lastRouteKey;
    var view = qs("#view");
    var boot = qs("#q-boot");
    if (!view) return;
    var html = "";
    try {
      if (route.name === "home") html = renderHome();
      else if (route.name === "map") html = renderMap();
      else if (route.name === "mission") html = renderMission(route.id);
      else if (route.name === "mode") html = renderMode(route.id);
      else if (route.name === "play") html = renderPlay();
      else if (route.name === "result") html = renderResult(route.id);
      else if (route.name === "errors") html = renderErrors();
      else if (route.name === "profile") html = renderProfile();
      else if (route.name === "achievements") html = renderAchievements();
      else if (route.name === "ranking") html = renderRanking();
      else if (route.name === "settings") html = renderSettings();
      else html = renderNotFound("Esta ruta no existe", "El enlace no corresponde a una pantalla de SERUMS QUEST.");
    } catch (error) {
      html = '<div class="q-page"><div class="q-fatal"><h1>No se pudo mostrar esta pantalla.</h1><p>' + esc(error && error.message || error) + '</p><div class="q-data-actions"><a class="q-btn q-btn--sm" href="#/">Volver al inicio</a></div></div></div>';
      if (window.console) console.error("SERUMS QUEST render", error);
    }
    view.innerHTML = html;
    view.hidden = false;
    if (boot) boot.hidden = true;
    document.body.classList.toggle("is-playing", route.name === "play");
    syncChrome();
    document.title = pageTitle();
    if (changedRoute) {
      ui.lastRouteKey = key;
      window.scrollTo({ top: 0, behavior: "auto" });
      var heading = view.querySelector("h1");
      if (heading) { heading.setAttribute("tabindex", "-1"); U.focusElement(heading); }
      else U.focusElement(qs("#main"));
    } else {
      var auto = view.querySelector("[data-autofocus]");
      if (auto) U.focusElement(auto);
      var qid = route.name === "play" && state.activeSession ? (Engine.currentItem(state.activeSession) || {}).questionId : "";
      if (qid && qid !== ui.lastRenderedQuestion) {
        window.scrollTo({ top: 0, behavior: "auto" });
        ui.lastRenderedQuestion = qid;
      }
    }
    if (route.name === "play" && state.activeSession) {
      var item = Engine.currentItem(state.activeSession);
      if (item) ui.lastRenderedQuestion = item.questionId;
    }
    tickTimer();
  }

  function pageTitle() {
    if (route.name === "home") return "SERUMS QUEST · Aprendizaje gamificado";
    if (route.name === "map") return "Mapa de misiones · SERUMS QUEST";
    if (route.name === "play") return "Sesión · SERUMS QUEST";
    if (route.name === "mission") { var m = Content.getMission(route.id); return (m ? m.title : "Misión") + " · SERUMS QUEST"; }
    if (route.name === "mode") return (C.modes[route.id] ? C.modes[route.id].label : "Modo") + " · SERUMS QUEST";
    if (route.name === "result") return "Resultado · SERUMS QUEST";
    if (route.name === "errors") return "Recuperación · SERUMS QUEST";
    if (route.name === "profile") return "Perfil · SERUMS QUEST";
    if (route.name === "achievements") return "Logros · SERUMS QUEST";
    if (route.name === "ranking") return "Registro local · SERUMS QUEST";
    if (route.name === "settings") return "Ajustes · SERUMS QUEST";
    return "SERUMS QUEST";
  }

  /* ------------------------------------------------------------------ */
  /* Barra superior                                                     */
  /* ------------------------------------------------------------------ */
  function syncChrome() {
    var stats = statsOf();
    var level = levelOf();
    var rank = rankOf();
    var activeNav = "";
    if (route.name === "home") activeNav = "home";
    else if (route.name === "map" || route.name === "mission" || route.name === "mode") activeNav = "map";
    else if (route.name === "errors") activeNav = "errors";
    else if (route.name === "profile") activeNav = "profile";
    else if (route.name === "achievements") activeNav = "achievements";
    else if (route.name === "ranking") activeNav = "ranking";
    else if (route.name === "settings") activeNav = "settings";
    qsa(".q-navlink[data-nav]").forEach(function (link) {
      if (link.getAttribute("data-route") === activeNav) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    var due = Content.recoveryStats(state).due;
    var badge = qs("[data-errors-badge]");
    if (badge) {
      badge.hidden = due <= 0;
      badge.textContent = due;
    }
    var stageName = qs("[data-stage-name]");
    if (stageName) stageName.textContent = C.stages[state.stage].name;
    var levelPill = qs("[data-level-pill]");
    if (levelPill) {
      levelPill.querySelector("b").textContent = "Nv " + level.level;
      var xp = levelPill.querySelector("[data-level-xp]");
      if (xp) xp.textContent = state.xp + " XP";
    }
    var coins = qs("[data-coins-pill] b");
    if (coins) coins.textContent = state.coins;
    var resume = qs("[data-resume-slot]");
    if (resume) resume.hidden = !state.activeSession;
    var themeBtn = qs("[data-theme-toggle]");
    if (themeBtn) {
      var light = state.settings.theme === "light";
      themeBtn.innerHTML = icon(light ? "moon" : "sun", 17);
      themeBtn.setAttribute("aria-label", light ? "Usar tema oscuro" : "Usar tema claro");
      themeBtn.title = light ? "Tema oscuro" : "Tema claro";
    }
    document.documentElement.setAttribute("data-theme", state.settings.theme === "light" ? "light" : "dark");
    document.documentElement.classList.toggle("reduce-motion", !!state.settings.reducedMotion);
    var meta = qs('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", state.settings.theme === "light" ? "#F2F0EA" : "#08090D");
  }

  /* ------------------------------------------------------------------ */
  /* Acciones                                                           */
  /* ------------------------------------------------------------------ */
  function commit(mutator) {
    try {
      var res = store.commit(mutator);
      state = res.state;
      syncChrome();
      return res;
    } catch (error) {
      toast(error.message || "No se pudo guardar el progreso.", "error");
      return null;
    }
  }

  function startSession(descriptor, confirmation) {
    if (state.activeSession) {
      toast("Ya hay una sesión en curso. Continúala o abandónala.", "warn");
      location.hash = "#/jugar";
      return;
    }
    var go = function () {
      var res = commit(function (draft, ctx) {
        return Engine.startSession(draft, descriptor, ctx.now);
      });
      if (!res) return;
      toast("Sesión iniciada. Tus respuestas se guardarán al instante.", "success");
      location.hash = "#/jugar";
      render();
    };
    if (confirmation) {
      openDialog({
        title: confirmation.title,
        text: confirmation.text,
        confirmLabel: confirmation.confirmLabel || "Empezar",
        tone: confirmation.tone || "",
        onConfirm: go
      });
    } else go();
  }

  function answerAction(letter) {
    var session = state.activeSession;
    if (!session) return;
    var item = Engine.currentItem(session);
    if (!item || session.answers[item.questionId]) return;
    var res = commit(function (draft, ctx) {
      return Engine.answer(draft, session.id, letter, ctx.now);
    });
    if (!res) return;
    if (res.result && res.result.expired) {
      if (res.result.questionExpired) {
        commit(function (draft, ctx) {
          return Engine.omitCurrent(draft, session.id, "Tiempo agotado: sin respuesta.", ctx.now);
        });
        render();
        return;
      }
      var fin = commit(function (draft, ctx) {
        return Engine.finish(draft, session.id, "time", ctx.now);
      });
      if (fin) { location.hash = "#/resultado/" + encodeURIComponent(fin.result.id); return; }
    }
    render();
  }

  function nextAction() {
    var session = state.activeSession;
    if (!session) return;
    var res = commit(function (draft, ctx) {
      return Engine.advance(draft, session.id, ctx.now);
    });
    if (!res) return;
    if (res.result && res.result.finished) {
      location.hash = "#/resultado/" + encodeURIComponent(res.result.session.id);
      return;
    }
    render();
  }

  function skipAction() {
    var session = state.activeSession;
    if (!session) return;
    var doSkip = function () {
      var res = commit(function (draft, ctx) {
        return Engine.omitCurrent(draft, session.id, "Pregunta omitida por decisión.", ctx.now);
      });
      if (res) render();
    };
    if (session.mode === "survival") {
      openDialog({
        title: "Omitir consume una oportunidad",
        text: "En Supervivencia, una pregunta omitida también consume una de tus oportunidades. No hay XP negativa, pero puedes perder la recompensa de finalización.",
        confirmLabel: "Omitir y continuar",
        tone: "danger",
        onConfirm: doSkip
      });
    } else doSkip();
  }

  function abandonAction() {
    var session = state.activeSession;
    if (!session) { location.hash = "#/"; return; }
    openDialog({
      title: "¿Abandonar la sesión?",
      text: "Las respuestas ya registradas se conservan, pero perderás la recompensa de finalización anunciada. No se restan XP ni monedas.",
      confirmLabel: "Abandonar",
      tone: "danger",
      onConfirm: function () {
        var res = commit(function (draft, ctx) {
          return Engine.abandon(draft, session.id, ctx.now);
        });
        if (res) {
          toast("Sesión cerrada. Puedes revisar el resultado.", "warn");
          location.hash = "#/resultado/" + encodeURIComponent(res.result.id);
        }
      }
    });
  }

  function openDialog(opts) {
    var d = qs("#q-dialog");
    if (!d) return;
    if (typeof d.showModal !== "function") {
      if (window.confirm((opts.title || "") + "\n\n" + (opts.text || ""))) opts.onConfirm && opts.onConfirm();
      return;
    }
    if (d.open) d.close();
    d.setAttribute("aria-label", opts.title || "Confirmar");
    d.innerHTML = '<h2>' + esc(opts.title || "Confirmar") + "</h2><p>" + esc(opts.text || "") + '</p><div class="q-dialog-actions"><button class="q-btn q-btn--ghost q-btn--sm" type="button" data-dialog-cancel>' + esc(opts.cancelLabel || "Cancelar") + '</button><button class="q-btn ' + (opts.tone === "danger" ? "q-btn--danger" : "") + ' q-btn--sm" type="button" data-dialog-confirm>' + esc(opts.confirmLabel || "Confirmar") + "</button></div>";
    var cancel = d.querySelector("[data-dialog-cancel]");
    var confirm = d.querySelector("[data-dialog-confirm]");
    if (cancel) cancel.addEventListener("click", function () { d.close(); });
    if (confirm) confirm.addEventListener("click", function () {
      d.close();
      if (typeof opts.onConfirm === "function") {
        try { opts.onConfirm(); } catch (e) { toast(e.message || "No se pudo completar la acción.", "error"); }
      }
    });
    d.showModal();
    if (cancel) U.focusElement(cancel);
  }

  function toast(message, tone) {
    var stack = qs("#q-toast-stack");
    if (!stack) return;
    var el = document.createElement("div");
    el.className = "q-toast " + (tone ? "is-" + tone : "");
    el.setAttribute("role", "status");
    el.innerHTML = '<span class="q-toast-dot"></span><span>' + esc(message) + "</span>";
    stack.innerHTML = "";
    stack.appendChild(el);
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      el.classList.add("is-out");
      window.setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 240);
    }, 3400);
  }

  /* ------------------------------------------------------------------ */
  /* Eventos                                                            */
  /* ------------------------------------------------------------------ */
  function handleClick(event) {
    var study = event.target.closest("[data-study-sheet]");
    if (study) recordStudyOpen(study.getAttribute("data-question-id"), study.getAttribute("data-study-sheet"));
    var target = event.target.closest("[data-action]");
    if (!target) return;
    var action = target.getAttribute("data-action");
    if (action === "answer") { event.preventDefault(); answerAction(target.getAttribute("data-letter")); return; }
    if (action === "next") { event.preventDefault(); nextAction(); return; }
    if (action === "skip") { event.preventDefault(); skipAction(); return; }
    if (action === "abandon") { event.preventDefault(); abandonAction(); return; }
    if (action === "start-mission") {
      var mid = target.getAttribute("data-mission");
      var mission = Content.getMission(mid);
      if (!mission) return;
      var confirmation = null;
      if (mission.kind === "boss") {
        confirmation = {
          title: "Afrontar al jefe final",
          text: "Tendrás " + mission.questionCount + " preguntas y 90 segundos por pregunta. No verás la clave hasta el final. Necesitas 70% del total para superarlo y obtener la recompensa de finalización.",
          confirmLabel: "Afrontar",
          tone: "danger"
        };
      }
      startSession({ mode: mission.kind === "boss" ? "boss" : "mission", missionId: mission.id }, confirmation);
      return;
    }
    if (action === "start-mode") {
      var mode = target.getAttribute("data-mode");
      var descriptor = { mode: MODE_TO_ENGINE[mode] || mode };
      var confirmation = null;
      if (mode === "supervivencia") {
        confirmation = {
          title: "Aceptar Supervivencia",
          text: "Tres oportunidades. Cada error o tiempo agotado consume una. Si se agotan antes de terminar, pierdes la recompensa de finalización anunciada. No hay XP negativa.",
          confirmLabel: "Aceptar y empezar",
          tone: "danger"
        };
      } else if (mode === "contrarreloj") {
        var seconds = Number(target.getAttribute("data-seconds")) || ui.timedSeconds;
        descriptor.seconds = seconds;
        var count = C.modes.contrarreloj.questionCountByDuration[seconds] || C.modes.contrarreloj.questionCount;
        confirmation = {
          title: "Empezar Contrarreloj",
          text: "Tendrás " + Math.round(seconds / 60) + " minutos para " + count + " preguntas. La recompensa exige 70% de aciertos sobre el total. Responder rápido y mal no compensa.",
          confirmLabel: "Empezar"
        };
      } else if (mode === "simulacro") {
        confirmation = {
          title: "Empezar Simulacro",
          text: "20 preguntas, 15 minutos, sin feedback hasta el final. La recompensa exige 70% de aciertos sobre el total.",
          confirmLabel: "Empezar simulacro"
        };
      }
      startSession(descriptor, confirmation);
      return;
    }
    if (action === "retry") {
      var rm = target.getAttribute("data-mission");
      var m = Content.getMission(rm);
      if (m) startSession({ mode: m.kind === "boss" ? "boss" : "mission", missionId: m.id });
      return;
    }
    if (action === "select-duration") { ui.timedSeconds = Number(target.getAttribute("data-seconds")) || 300; render(); return; }
    if (action === "errors-filter") { ui.errorFilter = target.getAttribute("data-filter") || "due"; render(); return; }
    if (action === "achievements-filter") { ui.achievementFilter = target.getAttribute("data-filter") || "all"; render(); return; }
    if (action === "ranking-tab") { ui.rankingTab = target.getAttribute("data-tab") || "sessions"; render(); return; }
    if (action === "toggle-setting") { toggleSetting(target.getAttribute("data-setting")); return; }
    if (action === "save-name") { saveName(); return; }
    if (action === "export") { exportProgress(); return; }
    if (action === "import-trigger") { var input = qs("#import-file"); if (input) input.click(); return; }
    if (action === "reset") { resetProgress(); return; }
    if (action === "verify-content") { verifyContent(); return; }
  }

  function handleKeydown(event) {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    var dialog = qs("#q-dialog");
    if (dialog && dialog.open) return;
    var tag = (event.target && event.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select" || event.target.isContentEditable) return;
    if (route.name === "play") {
      var session = state.activeSession;
      if (!session) return;
      var item = Engine.currentItem(session);
      if (!item) return;
      var entry = session.answers[item.questionId];
      if (!entry) {
        var key = event.key.toLowerCase();
        var letter = "";
        if (/^[a-e]$/.test(key)) letter = key.toUpperCase();
        else if (/^[1-5]$/.test(key)) letter = String.fromCharCode(64 + Number(key));
        if (letter) {
          event.preventDefault();
          answerAction(letter);
          return;
        }
      } else if (event.key === "Enter") {
        event.preventDefault();
        nextAction();
        return;
      }
      if (event.key === "Escape") { event.preventDefault(); abandonAction(); return; }
    }
  }

  function toggleSetting(key) {
    if (!key) return;
    var res = commit(function (draft) {
      if (key === "theme") draft.settings.theme = draft.settings.theme === "light" ? "dark" : "light";
      else if (key === "reducedMotion") draft.settings.reducedMotion = !draft.settings.reducedMotion;
      else if (key === "instantFeedback") draft.settings.instantFeedback = !draft.settings.instantFeedback;
      return draft.settings[key];
    });
    if (!res) return;
    applySettings();
    render();
    toast(key === "theme" ? "Tema actualizado." : "Preferencia actualizada.", "success");
  }

  function saveName() {
    var input = qs("#profile-name");
    if (!input) return;
    var name = String(input.value || "").trim();
    if (name.length < 2) { toast("El nombre debe tener al menos 2 caracteres.", "warn"); return; }
    var res = commit(function (draft) { draft.profile.name = name.slice(0, 40); });
    if (res) { toast("Nombre actualizado.", "success"); render(); }
  }

  function recordStudyOpen(questionId, sheetId) {
    if (!questionId || !state.errors[questionId]) return;
    try {
      store.commit(function (draft) {
        var err = draft.errors[questionId];
        if (!err) return;
        err.studyOpenedAt = U.nowISO(new Date());
        err.studySheetId = sheetId || err.sheetId || "";
      });
      state = store.getState();
    } catch (e) { /* el enlace debe abrir igualmente */ }
  }

  function exportProgress() {
    try {
      var text = store.exportState();
      U.downloadText("serums-quest-progreso-" + U.dateKey(new Date()) + ".json", text);
      toast("Progreso exportado.", "success");
    } catch (e) { toast(e.message || "No se pudo exportar.", "error"); }
  }

  function importProgressFile(file) {
    if (!file) return;
    U.readFileText(file).then(function (text) {
      var summary = "";
      try {
        var parsed = JSON.parse(text);
        var imported = parsed && parsed.state ? parsed.state : parsed;
        var normalized = Store.normalize(imported, new Date());
        summary = normalized.profile.name + " · " + normalized.xp + " XP · " + normalized.coins + " monedas · " + normalized.sessions.length + " sesiones.";
      } catch (e) {
        toast("El archivo no contiene un progreso válido de SERUMS QUEST.", "error");
        return;
      }
      openDialog({
        title: "Importar progreso",
        text: "Se reemplazará el progreso actual por: " + summary + " Antes se guardará una copia del estado actual. Esta acción no afecta a Study, Examen Studio ni Plazas.",
        confirmLabel: "Importar",
        tone: "danger",
        onConfirm: function () {
          try {
            var imported = store.importPayload(text);
            state = imported;
            applySettings();
            render();
            toast("Progreso importado.", "success");
          } catch (e) { toast(e.message || "No se pudo importar.", "error"); }
        }
      });
    }).catch(function (e) { toast(e.message || "No se pudo leer el archivo.", "error"); });
  }

  function resetProgress() {
    openDialog({
      title: "Reiniciar SERUMS QUEST",
      text: "Se archivará una copia del progreso actual y se creará un perfil nuevo. No se borran Study Dashboard, Study Flashcards, Examen Studio ni Plazas. Esta acción no se puede deshacer desde la interfaz, pero la copia queda en el almacenamiento local.",
      confirmLabel: "Reiniciar QUEST",
      tone: "danger",
      onConfirm: function () {
        try {
          var fresh = store.reset();
          state = fresh;
          applySettings();
          location.hash = "#/";
          render();
          toast("Progreso de QUEST reiniciado. Se guardó un archivo de respaldo.", "warn");
        } catch (e) { toast(e.message || "No se pudo reiniciar.", "error"); }
      }
    });
  }

  function verifyContent() {
    try {
      Content.build();
      render();
      var report = Content.contentReport();
      toast("Contenido verificado: " + report.questions + " preguntas válidas, " + report.missions + " misiones.", "success");
    } catch (e) { toast(e.message || "La verificación falló.", "error"); }
  }

  function applySettings() {
    if (!state) return;
    document.documentElement.setAttribute("data-theme", state.settings.theme === "light" ? "light" : "dark");
    document.documentElement.classList.toggle("reduce-motion", !!state.settings.reducedMotion);
    try { localStorage.setItem("serumsquest:theme", state.settings.theme === "light" ? "light" : "dark"); } catch (e) {}
    syncChrome();
  }

  /* ------------------------------------------------------------------ */
  /* Temporizadores                                                     */
  /* ------------------------------------------------------------------ */
  function tickTimer() {
    if (!booted || route.name !== "play" || !state.activeSession) return;
    var session = state.activeSession;
    var timer = qs("[data-timer]");
    if (timer) {
      var current = Engine.currentItem(session);
      var entry = current ? session.answers[current.questionId] : null;
      var text = qs("[data-timer-text]", timer);
      var ms = null;
      if (session.endsAt) ms = Engine.timedRemaining(session);
      else if (session.questionEndsAt && !entry) ms = Engine.questionRemaining(session);
      if (ms === null) {
        timer.hidden = true;
      } else {
        timer.hidden = false;
        if (text) text.textContent = U.formatDuration(ms);
        timer.classList.toggle("is-urgent", ms <= (session.endsAt ? 30000 : 10000));
      }
    }
    if (ui.timerBusy) return;
    if (Engine.timedExpired(state)) {
      ui.timerBusy = true;
      var sid = session.id;
      var fin = commit(function (draft, ctx) { return Engine.finish(draft, sid, "time", ctx.now); });
      ui.timerBusy = false;
      if (fin) location.hash = "#/resultado/" + encodeURIComponent(fin.result.id);
      return;
    }
    if (Engine.questionExpired(state)) {
      var cur = Engine.currentItem(session);
      if (cur && !session.answers[cur.questionId]) {
        ui.timerBusy = true;
        var id = session.id;
        var res = commit(function (draft, ctx) {
          return Engine.omitCurrent(draft, id, "Tiempo agotado: sin respuesta.", ctx.now);
        });
        ui.timerBusy = false;
        if (res) render();
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Arranque                                                           */
  /* ------------------------------------------------------------------ */
  function boot() {
    try {
      Content.build();
    } catch (error) {
      renderFatal(error.message || error);
      return;
    }
    store = Store.get();
    store.init();
    state = store.getState();
    if (store.isBlocked()) {
      applySettings();
      renderFatal(store.getLastError() && store.getLastError().message ? store.getLastError().message : "El progreso guardado está dañado.", true);
      var recoverButton = qs("[data-recover-quest]");
      if (recoverButton) {
        recoverButton.addEventListener("click", function () {
          try {
            store.recoverCorrupt();
            window.location.reload();
          } catch (e) {
            window.alert(e.message || "No se pudo recuperar el perfil.");
          }
        });
      }
      return;
    }
    applySettings();
    qsa("[data-icon]").forEach(function (el) {
      var name = el.getAttribute("data-icon");
      if (!name) return;
      el.innerHTML = icon(name, Number(el.getAttribute("data-size")) || 16);
    });
    booted = true;
    if (!location.hash) {
      try { history.replaceState(null, "", "#/"); } catch (e) { location.hash = "#/"; }
    }
    store.subscribe(function (payload) {
      state = payload.state;
      if (payload.source === "external" && route.name !== "play") {
        syncChrome();
        render();
      } else {
        syncChrome();
      }
    });
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeydown);
    window.addEventListener("hashchange", function () { render(); });
    window.addEventListener("pageshow", function () { syncChrome(); tickTimer(); });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) { syncChrome(); tickTimer(); }
    });
    var importInput = qs("#import-file");
    if (importInput) importInput.addEventListener("change", function () {
      var file = importInput.files && importInput.files[0];
      importProgressFile(file);
      importInput.value = "";
    });
    render();
    window.clearInterval(timerHandle);
    timerHandle = window.setInterval(tickTimer, 500);
    syncChrome();
    if (state.meta && state.meta.recoveredFromCorrupt) {
      toast("El progreso se recuperó desde el respaldo local. Revisa tus últimas sesiones.", "warn");
    }
    // Si el usuario recarga durante una sesión, la barra superior ofrece continuar.
    if (state.activeSession && route.name !== "play") {
      toast("Tienes una sesión guardada. Puedes continuarla desde la barra superior.", "warn");
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
