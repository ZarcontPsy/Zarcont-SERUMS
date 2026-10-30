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
  var Chars = window.QuestCharacters;
  var Art = window.QuestCharacterArt;
  var Scenes = window.QuestScenes;
  var Audio = window.QuestAudio;
  var Collection = window.QuestCollection;
  var Reactions = window.QuestReactions;
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
    timerBusy: false,
    charFilter: "all",
    charRarity: "all",
    charSort: "rarity",
    charFocusId: "",
    charPreviewState: "",
    shopTab: "featured",
    shopCategory: "all",
    shopRarity: "all",
    shopSort: "rarity",
    invCategory: "all",
    invOwnership: "all",
    invSort: "rarity",
    invFocusId: "",
    customCharacterId: "",
    customDraft: null,
    customSlot: "cabeza",
    reaction: null,
    reactionCounters: {},
    unlockDialogQueue: [],
    lastResultSoundId: "",
    sceneObserver: null,
    parallaxBound: false
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
    return '<div class="q-progress ' + (extraClass || "") + '" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(v) + '" aria-label="' + esc(label || "Progreso") + '"><span style="--p:' + (v / 100) + '"></span></div>';
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

  /* ------------------------------------------------------------------ */
  /* Capa RPG: utilidades compartidas por las pantallas nuevas          */
  /* ------------------------------------------------------------------ */
  function fmt(value) { return U.formatNumber(value); }
  function coinText(value) { return fmt(value) + " monedas"; }
  function selectedCharacter() { return Collection.selectedCharacter(state); }
  function selectedCharacterId() { return Collection.selectedCharacterId(state); }
  function equippedOf(characterId) { return Collection.equippedMap(state, characterId); }

  /* Cambio de personaje localizado: firma de atuendo, avisos y parches de DOM.
     Ninguna de estas funciones reemplaza #view ni reinicia la sesión. */
  function outfitSignature(equipped) {
    if (!equipped) return "";
    return Object.keys(equipped).sort().map(function (key) { return key + ":" + equipped[key]; }).join(",");
  }

  function motionAllowed() {
    return !(state && (state.settings.reducedMotion || U.prefersReducedMotion()));
  }

  function announce(message) {
    var live = qs("#q-live");
    if (!live) return;
    live.textContent = "";
    window.setTimeout(function () { live.textContent = message; }, 30);
  }

  function flashElement(element, className) {
    if (!element || !motionAllowed()) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    window.setTimeout(function () { element.classList.remove(className); }, 760);
  }

  function replaceInner(selector, html) {
    var host = qs(selector, qs("#view") || document);
    if (!host) return false;
    host.innerHTML = html;
    return true;
  }

  /* ------------------------------------------------------------------ */
  /* Escenarios, audio y navegación de juego                           */
  /* ------------------------------------------------------------------ */
  function sceneFor(character, options) {
    if (!Scenes || !character) return "";
    return Scenes.forCharacter(character, options || {});
  }

  function audioPrefs() {
    return state && state.presentation && state.presentation.audioPreferences
      ? state.presentation.audioPreferences
      : { muted: false, sfxVolume: 0.55, musicVolume: 0.22, music: false };
  }

  function syncAudio() {
    if (!Audio) return;
    var prefs = Audio.setPreferences(audioPrefs());
    var btn = qs("[data-audio-toggle]");
    if (btn) {
      var muted = !!prefs.muted;
      btn.innerHTML = icon(muted ? "volumeOff" : "volume", 17);
      btn.setAttribute("aria-pressed", muted ? "true" : "false");
      btn.setAttribute("aria-label", muted ? "Activar audio" : "Silenciar audio");
      btn.title = muted ? "Audio desactivado" : "Audio activado";
      btn.classList.toggle("is-muted", muted);
    }
  }

  function sfx(name, options) {
    if (!Audio || !name) return;
    Audio.play(name, options || {});
  }

  function setAudioPatch(patch) {
    var res = commit(function (draft) {
      draft.presentation.audioPreferences = Object.assign({}, draft.presentation.audioPreferences, patch);
      return draft.presentation.audioPreferences;
    });
    if (!res) return false;
    applySettings();
    return true;
  }

  function progressSubnav(active) {
    var tabs = [
      { id: "profile", label: "Resumen", href: "#/perfil", icon: "chart" },
      { id: "achievements", label: "Logros", href: "#/logros", icon: "award" },
      { id: "ranking", label: "Registro", href: "#/registro", icon: "chart" },
      { id: "errors", label: "Recuperación", href: "#/errores", icon: "rotate" },
      { id: "settings", label: "Ajustes", href: "#/ajustes", icon: "settings" }
    ];
    return '<nav class="q-subnav" aria-label="Secciones de progreso">' + tabs.map(function (tab) {
      return '<a class="q-subnav-link' + (active === tab.id ? " is-active" : "") + '" href="' + tab.href + '"' + (active === tab.id ? ' aria-current="page"' : "") + ">" + icon(tab.icon, 14) + "<span>" + esc(tab.label) + "</span></a>";
    }).join("") + "</nav>";
  }

  function homeMissionData() {
    var active = state.activeSession;
    var reco = Content.nextRecommendedAction(state);
    if (active) {
      return {
        kind: "resume",
        title: active.title,
        theme: (C.stages[active.stage] ? C.stages[active.stage].name : "Sesión") + " · sesión guardada",
        difficulty: "En curso",
        progress: { percent: Math.round(((active.cursor + 1) / active.questions.length) * 100), label: "Pregunta " + (active.cursor + 1) + " de " + active.questions.length },
        reward: { xp: active.xpFromQuestions || 0, coins: active.coinsFromQuestions || 0, questions: active.questions.length },
        href: "#/jugar",
        action: "Continuar sesión",
        icon: "play"
      };
    }
    var mission = Content.nextMission(state);
    if (mission) {
      var routeInfo = Content.getAreaRoute(mission.areaId);
      var routeDone = routeInfo ? routeInfo.missions.filter(function (m) { return Content.missionCompletion(state, m); }).length : 0;
      var routeTotal = routeInfo ? routeInfo.missions.length : 0;
      return {
        kind: mission.kind === "boss" ? "boss" : "mission",
        mission: mission,
        title: mission.title,
        theme: mission.areaShort + " · " + mission.subtitle,
        difficulty: mission.tierLabel,
        progress: { percent: routeTotal ? Math.round((routeDone / routeTotal) * 100) : 0, label: routeDone + " de " + routeTotal + " misiones del área" },
        reward: { xp: mission.rewards.xp, coins: mission.rewards.coins, questions: mission.questionCount },
        href: "#/mision/" + encodeURIComponent(mission.id),
        action: mission.kind === "boss" ? "Afrontar jefe" : "Comenzar misión",
        icon: mission.kind === "boss" ? "swords" : "flag"
      };
    }
    return {
      kind: reco.kind,
      title: reco.title,
      theme: reco.text,
      difficulty: "Recomendado",
      progress: { percent: 0, label: "Sin misión pendiente" },
      reward: { xp: 0, coins: 0, questions: 0 },
      href: reco.href,
      action: reco.action,
      icon: "spark"
    };
  }

  function equipmentCharacter(characterId) {
    var requested = characterId ? Chars.byId(characterId) : null;
    if (requested && Collection.ownsCharacter(state, requested.id)) return requested;
    return selectedCharacter();
  }

  function rarityStars(item) {
    var order = item && item.rarityMeta ? item.rarityMeta.order : 1;
    var count = Math.max(1, Math.min(5, order));
    var out = "";
    for (var i = 0; i < 5; i += 1) out += '<span class="q-star' + (i < count ? " is-on" : "") + '">' + icon("star", 11) + "</span>";
    return '<span class="q-stars" aria-label="Rareza ' + count + ' de 5">' + out + "</span>";
  }

  function audioSettingsMarkup() {
    var prefs = audioPrefs();
    return '<section class="q-panel q-panel--pad q-audio-settings"><div class="q-section-head"><div><span class="q-kicker">Audio</span><h2>Sonido y ambiente.</h2><p>Efectos sintetizados en el navegador. Nada se reproduce antes de un gesto.</p></div><span class="q-chip ' + (prefs.muted ? "q-chip--red" : "q-chip--green") + '">' + (prefs.muted ? "Silenciado" : "Activo") + "</span></div>" +
      '<div class="q-audio-rows">' +
        '<div class="q-audio-row"><div><b>Silenciar todo</b><small>Desactiva efectos y música. Se conserva el volumen.</small></div><button class="q-switch ' + (prefs.muted ? "is-on" : "") + '" type="button" data-action="toggle-audio" aria-label="Silenciar audio" aria-pressed="' + (!!prefs.muted) + '"></button></div>' +
        '<div class="q-audio-row"><div><b>Volumen de efectos</b><small>Interfaz, aciertos, compras y recompensas.</small></div><input class="q-range" type="range" min="0" max="100" step="5" value="' + Math.round(Number(prefs.sfxVolume) * 100) + '" data-audio-volume="sfxVolume" aria-label="Volumen de efectos"></div>' +
        '<div class="q-audio-row"><div><b>Música ambiental</b><small>Pad generativo muy discreto. Se inicia solo después de interactuar.</small></div><div class="q-row"><input class="q-range" type="range" min="0" max="100" step="5" value="' + Math.round(Number(prefs.musicVolume) * 100) + '" data-audio-volume="musicVolume" aria-label="Volumen de música"><button class="q-switch ' + (prefs.music ? "is-on" : "") + '" type="button" data-action="toggle-pref" data-group="audioPreferences" data-pref="music" aria-label="Música ambiental" aria-pressed="' + (!!prefs.music) + '"></button></div></div>' +
        '<div class="q-audio-actions"><button class="q-btn q-btn--soft q-btn--sm" type="button" data-action="test-audio">' + icon("volume", 14) + " Probar sonido</button><span class=\"q-xs q-muted\">Sin archivos externos: síntesis original en WebAudio.</span></div>" +
      "</div></section>";
  }

  function charArt(characterId, options) {
    var opts = options || {};
    var equipped = opts.outfit || equippedOf(characterId);
    return Art.portrait(characterId, equipped, {
      state: opts.state || "idle",
      hero: !!opts.hero,
      compact: !!opts.compact,
      thumb: !!opts.thumb,
      tag: opts.tag,
      viewBox: opts.viewBox,
      className: opts.className,
      ariaLabel: opts.ariaLabel
    });
  }

  function rarityChip(item) {
    var meta = item.rarityMeta || Chars.rarityMeta(item.rarity);
    return '<span class="q-rarity-chip" style="--rarity-color:' + meta.color + ';--rarity-soft:' + meta.soft + '"><i></i>' + esc(meta.label) + "</span>";
  }

  function priceMarkup(price) {
    if (!price) return '<span class="q-price is-free">Sin coste</span>';
    return '<span class="q-price">' + fmt(price) + icon("coins", 12) + "</span>";
  }

  function requirementMarkup(rows) {
    if (!rows || !rows.length) return "";
    return '<div class="q-req-list">' + rows.map(function (row) {
      var pct = row.need ? Math.min(100, Math.round((row.have / row.need) * 100)) : 100;
      return '<div class="q-req ' + (row.met ? "is-met" : "") + '"><span class="q-req-icon">' + icon(row.met ? "check" : "lock", 11) + "</span><span class=\"q-grow\">" + esc(row.label) + (row.need > 1 ? " · " + row.have + "/" + row.need : "") + "</span><span class=\"q-req-pct\">" + pct + "%</span></div>";
    }).join("") + "</div>";
  }

  function equippedSlotsMarkup(character, equipped) {
    return '<div class="q-slot-grid">' + character.slotIds.map(function (slotId) {
      var meta = Chars.slotMeta(slotId);
      var cosmetic = equipped[slotId] ? Chars.cosmeticById(equipped[slotId]) : null;
      return '<div class="q-slot ' + (cosmetic ? "is-filled" : "") + '"><span class="q-slot-icon">' + icon(meta ? meta.icon : "circle", 14) + '</span><span class="q-slot-copy"><small>' + esc(meta ? meta.label : slotId) + '</small><b>' + (cosmetic ? esc(cosmetic.name) : "Vacío") + "</b></span></div>";
    }).join("") + "</div>";
  }

  function personalityBlock(character) {
    var meta = character.personalityMeta;
    return '<div class="q-personality"><span class="q-personality-mark">' + icon("brain", 16) + '</span><div><span class="q-kicker">Personalidad · ' + esc(meta.label) + "</span><p>" + esc(meta.description) + "</p></div></div>";
  }

  function attributesMarkup(character) {
    return '<div class="q-attributes">' + C.rpg.attributes.map(function (attr) {
      var value = Number(character.attributes[attr.id]) || 0;
      return '<div class="q-attribute" title="' + esc(attr.hint) + '"><span class="q-attribute-label">' + esc(attr.label) + '</span><span class="q-attribute-track"><i style="width:' + value + '%"></i></span><b>' + value + "</b></div>";
    }).join("") + "</div>";
  }

  function reactionFor(event, characterId, questionId) {
    var nonce = (ui.reactionCounters[event] || 0) + 1;
    ui.reactionCounters[event] = nonce;
    var message = Reactions.message(characterId || selectedCharacterId(), event, nonce);
    ui.reaction = {
      event: event,
      animation: message.animation,
      text: message.text,
      questionId: questionId || "",
      at: Date.now()
    };
    return ui.reaction;
  }

  function currentAnswerStreak(session) {
    var streak = 0;
    for (var i = session.answerOrder.length - 1; i >= 0; i -= 1) {
      var entry = session.answers[session.answerOrder[i]];
      if (entry && entry.correct) streak += 1;
      else break;
    }
    return streak;
  }

  function homeReaction() {
    var message = Reactions.homeMessage(selectedCharacterId());
    return { event: "idle", animation: "idle", text: message.text };
  }

  function weeklyProgress() {
    var now = new Date();
    var weekKey = U.isoWeekKey(now);
    var sessions = state.sessions.filter(function (session) {
      return session.endedAt && U.isoWeekKey(U.parseDate(session.endedAt) || now) === weekKey;
    });
    var goal = 5;
    return {
      sessions: sessions.length,
      goal: goal,
      percent: Math.min(100, Math.round((sessions.length / goal) * 100)),
      weekKey: weekKey
    };
  }

  function nextUnlock() {
    var candidates = Chars.characters.filter(function (character) { return !Collection.ownsCharacter(state, character.id); });
    var best = null;
    candidates.forEach(function (character) {
      var status = Collection.characterStatus(state, character);
      var requirements = status.requirements;
      if (!requirements.length) return;
      var ratio = requirements.reduce(function (sum, row) {
        return sum + Math.min(1, row.need ? row.have / row.need : 1);
      }, 0) / requirements.length;
      if (!best || ratio > best.ratio) {
        best = {
          character: character,
          status: status,
          ratio: ratio,
          label: character.name,
          detail: requirements.map(function (row) { return row.label + " · " + row.have + "/" + row.need; }).join(" · "),
          href: "#/personaje/" + encodeURIComponent(character.id)
        };
      }
    });
    if (best) return best;
    var nextRank = P.nextRank(statsOf());
    if (nextRank) {
      return { label: nextRank.name, detail: "Siguiente rango · " + nextRank.xp + " XP", ratio: 0.5, href: "#/perfil" };
    }
    return { label: "Colección completa", detail: "Ya tienes todos los personajes disponibles.", ratio: 1, href: "#/personajes" };
  }

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
    var character = selectedCharacter();
    var equipped = equippedOf(character.id);
    var mission = homeMissionData();
    var week = weeklyProgress();
    var unlock = nextUnlock();
    var recovery = Content.recoveryStats(state);
    var homeLine = Reactions.homeMessage(character.id).text;
    var rp = P.rankProgress(stats);
    var hour = new Date().getHours();
    var greeting = hour < 12 ? "Buenos días" : (hour < 20 ? "Buenas tardes" : "Buenas noches");
    var ownedCount = state.collection.ownedCharacterIds.length;
    var cosmeticCount = state.collection.ownedCosmeticIds.length;
    var recent = state.sessions.slice(0, 3);

    var roster = Chars.characters.map(function (item) {
      var owned = Collection.ownsCharacter(state, item.id);
      var isCurrent = item.id === character.id;
      return '<a class="q-roster-card ' + (owned ? "is-owned" : "is-locked") + (isCurrent ? " is-current" : "") + ' q-rarity--' + item.rarity + '" href="#/personaje/' + encodeURIComponent(item.id) + '" aria-label="' + esc(item.name + (owned ? (isCurrent ? ", en uso" : ", obtenido") : ", bloqueado")) + '">' +
        '<span class="q-roster-art">' + (owned ? charArt(item.id, { tag: "span", viewBox: "62 34 196 300", outfit: item.id === character.id ? equipped : equippedOf(item.id) }) : '<span class="q-roster-lock">' + icon("lock", 16) + "</span>") + "</span>" +
        '<span class="q-roster-copy"><b>' + esc(item.name) + "</b>" + rarityChip(item) + "</span>" +
        (isCurrent ? '<span class="q-roster-current">' + icon("checkCircle", 11) + " En uso</span>" : "") +
        "</a>";
    }).join("");

    var quick = [
      { label: "Héroes", meta: ownedCount + " / " + Chars.characters.length, href: "#/personajes", icon: "users" },
      { label: "Inventario", meta: cosmeticCount + " cosméticos", href: "#/inventario", icon: "layers" },
      { label: "Tienda", meta: "Equipa tu ruta", href: "#/tienda", icon: "bag" },
      { label: "Progreso", meta: "Nv " + level.level + " · " + rank.short, href: "#/perfil", icon: "chart" }
    ].map(function (item) {
      return '<a class="q-hud-link" href="' + item.href + '">' + icon(item.icon, 17) + "<span><b>" + esc(item.label) + "</b><small>" + esc(item.meta) + "</small></span></a>";
    }).join("");

    var modes = [
      { id: "diario", label: "Diario", meta: Content.dailyAvailable(state) ? "Disponible" : "Hecho hoy", icon: "calendar", tone: "amber", locked: false },
      { id: "supervivencia", label: "Supervivencia", meta: "3 vidas", icon: "shield", tone: "red", locked: false },
      { id: "contrarreloj", label: "Contrarreloj", meta: "Bajo tiempo", icon: "timer", tone: "cyan", locked: false },
      { id: "recuperacion", label: "Recuperar", meta: recovery.due + " listas", icon: "rotate", tone: "green", locked: false },
      { id: "simulacro", label: "Simulacro", meta: state.stage >= 4 ? "20 preguntas" : "Dominio", icon: "swords", tone: "violet", locked: state.stage < 4 }
    ].map(function (mode) {
      return '<a class="q-mode-tile q-mode-tile--' + mode.tone + (mode.locked ? " is-locked" : "") + '" href="#/modo/' + mode.id + '">' + icon(mode.icon, 18) + "<span><b>" + esc(mode.label) + "</b><small>" + esc(mode.meta) + "</small></span>" + icon("chevronRight", 13) + "</a>";
    }).join("");

    var recentMarkup = recent.length
      ? '<div class="q-session-list">' + recent.map(sessionRow).join("") + "</div>"
      : '<div class="q-home-empty"><p>Todavía no hay sesiones registradas.</p><a class="q-textlink" href="' + esc(mission.href) + '">Empezar ahora ' + icon("arrowRight", 12) + "</a></div>";

    return '<div class="q-page q-home-game">' +
      '<section class="q-hero-stage q-rarity--' + character.rarity + '" data-parallax aria-labelledby="home-char-name">' +
        sceneFor(character, { variant: "home", accent2: character.rarityMeta.color }) +
        '<div class="q-hero-top">' +
          '<div><span class="q-kicker"><span class="dot"></span>' + esc(greeting) + ", " + esc(state.profile.name) + '</span><div class="q-hero-rankline">' + icon("award", 13) + " " + esc(rank.name) + " · " + esc(C.stages[state.stage].name) + " · " + state.collection.ownedCharacterIds.length + " héroes</div></div>" +
          '<div class="q-hero-topchips"><span class="q-hud-chip">' + icon("flame", 13) + " " + (state.daily.streak || 0) + " días</span><span class=\"q-hud-chip\">" + icon("coins", 13) + " " + fmt(state.coins) + "</span><span class=\"q-hud-chip\">" + icon("spark", 13) + " " + fmt(state.xp) + " XP</span></div>" +
        "</div>" +
        '<div class="q-hero-identity">' +
          '<span class="q-kicker">Tu protagonista</span>' +
          '<h1 id="home-char-name">' + esc(character.name) + "</h1>" +
          '<p class="q-hero-subtitle">' + esc(character.title) + " · " + esc(character.personalityMeta.label) + "</p>" +
          '<div class="q-hero-badges">' + rarityChip(character) + areaChip(character.areaAffinity) + '<span class="q-chip q-chip--blue">Nv. jugador ' + level.level + "</span></div>" +
          '<blockquote class="q-hero-voice"><span class="q-voice-mark">' + icon("spark", 14) + '</span><span>“' + esc(homeLine) + "”</span></blockquote>" +
          '<div class="q-hero-level">' + levelRing(level.percent, level.level, 68) +
            '<div class="q-hero-levelinfo"><div class="q-progress-head"><span>' + (level.maxed ? "Nivel máximo" : level.intoLevel + " / " + level.needed + " XP") + "</span><b>" + fmt(state.xp) + " XP</b></div>" + progressBar(level.percent, "Progreso al nivel " + (level.level + 1), "q-progress--thin") +
            '<div class="q-hero-levelfoot">' + (rp.next ? icon("award", 11) + " Siguiente rango: " + esc(rp.next.name) : icon("crown", 11) + " Rango máximo") + "</div></div>" +
          "</div>" +
          '<div class="q-hero-cta"><a class="q-btn q-btn--lg" href="' + esc(mission.href) + '">' + icon(mission.icon, 16) + " " + esc(mission.action) + '</a><a class="q-btn q-btn--ghost" href="#/personajes">' + icon("users", 15) + " Cambiar héroe</a></div>" +
        "</div>" +
        '<div class="q-hero-figure">' +
          '<span class="q-hero-aura" aria-hidden="true"></span>' +
          charArt(character.id, { hero: true, outfit: equipped }) +
          '<span class="q-hero-pedestal" aria-hidden="true"></span>' +
          '<div class="q-hero-plate">' + rarityStars(character) + '<b>' + esc(character.name) + '</b><small>' + esc(character.signature.prop) + '</small></div>' +
        "</div>" +
        '<aside class="q-hero-rail" aria-label="Accesos rápidos">' + quick + "</aside>" +
        '<div class="q-hero-mission">' +
          '<span class="q-kicker"><span class="dot"></span>' + (state.activeSession ? "Sesión en curso" : "Misión recomendada") + '</span>' +
          "<h2>" + esc(mission.title) + "</h2><p>" + esc(mission.theme) + "</p>" +
          '<div class="q-mission-chips"><span class="q-chip q-chip--violet">' + esc(mission.difficulty) + "</span>" +
            (mission.reward && mission.reward.questions ? '<span class="q-chip">' + icon("flag", 11) + mission.reward.questions + " preguntas</span>" : "") +
            (mission.reward && mission.reward.xp ? '<span class="q-chip q-chip--green">+' + mission.reward.xp + " XP</span>" : "") +
            (mission.reward && mission.reward.coins ? '<span class="q-chip q-chip--amber">+' + mission.reward.coins + " monedas</span>" : "") + "</div>" +
          '<div class="q-mission-progress"><div class="q-progress-head"><span>' + esc(mission.progress.label) + "</span><b>" + mission.progress.percent + "%</b></div>" + progressBar(mission.progress.percent, "Progreso de la misión") + "</div>" +
          '<div class="q-hero-mission-actions"><a class="q-btn" href="' + esc(mission.href) + '">' + icon(mission.icon, 14) + " " + esc(mission.action) + '</a><a class="q-btn q-btn--ghost q-btn--sm" href="#/mapa">Ver mapa</a></div>' +
        "</div>" +
        '<div class="q-hero-next"><span class="q-kicker">Próximo desbloqueo</span><b>' + esc(unlock.label) + "</b><small>" + esc(unlock.detail) + "</small>" + progressBar(Math.round(unlock.ratio * 100), "Progreso del próximo desbloqueo", "q-progress--amber q-progress--thin") + '<a class="q-textlink" href="' + esc(unlock.href) + '">Ver objetivo ' + icon("arrowRight", 11) + "</a></div>" +
      "</section>" +

      '<section class="q-roster" aria-labelledby="roster-title"><div class="q-section-head"><div><span class="q-kicker">Colección · ' + ownedCount + " / " + Chars.characters.length + '</span><h2 id="roster-title">Tu elenco.</h2><p>Cada héroe aporta una voz y una forma de mirar el caso.</p></div><a class="q-textlink" href="#/personajes">Ver catálogo ' + icon("arrowRight", 13) + "</a></div><div class=\"q-roster-track\">" + roster + "</div></section>" +

      '<div class="q-home-bottom">' +
        '<section class="q-home-modes"><div class="q-section-head"><div><span class="q-kicker">Seguir estudiando</span><h2>Otros modos.</h2></div><a class="q-textlink" href="#/mapa">Mapa completo ' + icon("arrowRight", 12) + "</a></div><div class=\"q-mode-row\">" + modes + "</div></section>" +
        '<aside class="q-home-week"><span class="q-kicker">Esta semana</span><div class="q-week-number"><b>' + week.sessions + "</b><span>/ " + week.goal + " sesiones</span></div>" + progressBar(week.percent, "Progreso semanal", "q-progress--green") +
          '<div class="q-week-stats"><div><b>' + stats.missions + "</b><span>misiones</span></div><div><b>" + Math.round(stats.accuracy * 100) + "%</b><span>precisión</span></div><div><b>" + stats.mastered + "</b><span>dominadas</span></div></div>" +
          '<a class="q-textlink" href="#/perfil">Ver progreso completo ' + icon("arrowRight", 11) + "</a></aside>" +
        '<section class="q-home-activity"><div class="q-section-head"><div><span class="q-kicker">Actividad</span><h2>Últimas sesiones.</h2></div>' + (state.sessions.length ? '<a class="q-textlink" href="#/registro">Registro ' + icon("arrowRight", 12) + "</a>" : "") + "</div>" + recentMarkup + "</section>" +
      "</div>" +
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
  /* Personajes: selector, detalle e inspección                         */
  /* ------------------------------------------------------------------ */
  function characterFilters(rows, counts, attributes) {
    var tabs = [
      { id: "all", label: "Todos", count: counts.all },
      { id: "owned", label: "Obtenidos", count: counts.owned },
      { id: "buy", label: "Por comprar", count: counts.buy },
      { id: "locked", label: "Bloqueados", count: counts.locked }
    ].map(function (tab) {
      return '<button class="q-filter-tab ' + (ui.charFilter === tab.id ? "is-active" : "") + '" type="button" data-action="char-filter" data-filter="' + tab.id + '" aria-pressed="' + (ui.charFilter === tab.id) + '">' + esc(tab.label) + " · " + tab.count + "</button>";
    }).join("");
    var rarities = [{ id: "all", label: "Todas" }].concat(Chars.rarityList().map(function (rarity) {
      return { id: rarity.id, label: rarity.label };
    })).map(function (item) {
      return '<button class="q-filter-tab ' + (ui.charRarity === item.id ? "is-active" : "") + '" type="button" data-action="char-rarity" data-rarity="' + item.id + '" aria-pressed="' + (ui.charRarity === item.id) + '">' + esc(item.label) + "</button>";
    }).join("");
    var sorts = [
      { id: "rarity", label: "Rareza" },
      { id: "priceAsc", label: "Precio ↑" },
      { id: "priceDesc", label: "Precio ↓" },
      { id: "name", label: "Nombre" }
    ].map(function (item) {
      return '<button class="q-filter-tab ' + (ui.charSort === item.id ? "is-active" : "") + '" type="button" data-action="char-sort" data-sort="' + item.id + '" aria-pressed="' + (ui.charSort === item.id) + '">' + esc(item.label) + "</button>";
    }).join("");
    return '<div class="q-filter-block"' + (attributes || "") + '><div class="q-filter-row"><span class="q-filter-label">Estado</span><div class="q-filter-tabs">' + tabs + "</div></div>" +
      '<div class="q-filter-row"><span class="q-filter-label">Rareza</span><div class="q-filter-tabs q-filter-tabs--wrap">' + rarities + "</div></div>" +
      '<div class="q-filter-row"><span class="q-filter-label">Orden</span><div class="q-filter-tabs">' + sorts + "</div></div></div>";
  }

  function heroStatusChip(status) {
    if (status.selected) return '<span class="q-chip q-chip--green">' + icon("checkCircle", 12) + " En uso</span>";
    if (status.owned) return '<span class="q-chip q-chip--blue">' + icon("check", 12) + " Obtenido</span>";
    if (status.canPurchase) return '<span class="q-chip q-chip--amber">' + icon("bag", 12) + " En venta</span>";
    if (status.isReward) return '<span class="q-chip">' + icon("lock", 12) + " Recompensa</span>";
    return '<span class="q-chip">' + icon("lock", 12) + " Bloqueado</span>";
  }

  function heroActions(character, status) {
    var canAfford = state.coins >= character.price;
    if (status.owned) {
      return '<div class="q-hero-actions">' +
        (status.selected
          ? '<span class="q-chip q-chip--green q-chip--lg">' + icon("checkCircle", 13) + " Héroe activo</span>"
          : '<button class="q-btn q-btn--lg" type="button" data-action="select-character" data-character="' + esc(character.id) + '">' + icon("check", 15) + " Usar este héroe</button>") +
        '<a class="q-btn q-btn--soft" href="#/inventario/' + encodeURIComponent(character.id) + '">' + icon("sliders", 15) + " Equipar</a>" +
        "</div>";
    }
    if (status.canPurchase) {
      return '<div class="q-hero-actions"><button class="q-btn q-btn--lg" type="button" data-action="buy-character" data-character="' + esc(character.id) + '">' + icon("bag", 15) + " Reclutar por " + fmt(character.price) + " monedas</button></div>" +
        '<p class="q-xs ' + (canAfford ? "q-muted" : "q-warnline") + '">' + (canAfford ? "Saldo actual: " + fmt(state.coins) + " monedas." : "Te faltan " + fmt(character.price - state.coins) + " monedas. Se ganan respondiendo sesiones.") + "</p>";
    }
    if (status.isReward) {
      return '<div class="q-hero-actions"><span class="q-chip q-chip--violet q-chip--lg">' + icon("award", 13) + " Recompensa de recorrido</span></div>" + requirementMarkup(status.requirements);
    }
    return '<div class="q-hero-actions"><span class="q-chip q-chip--lg">' + icon("lock", 13) + " Bloqueado</span></div>" + requirementMarkup(status.requirements);
  }

  function heroEquipmentMini(character, equipped) {
    return '<div class="q-hero-equipment">' + character.slotIds.map(function (slotId) {
      var meta = Chars.slotMeta(slotId);
      var cosmetic = equipped[slotId] ? Chars.cosmeticById(equipped[slotId]) : null;
      return '<div class="q-hero-slot' + (cosmetic ? " is-filled" : "") + '" title="' + esc((meta ? meta.label : slotId) + ": " + (cosmetic ? cosmetic.name : "vacío")) + '">' + icon(meta ? meta.icon : "circle", 13) + "<span>" + (cosmetic ? esc(cosmetic.name) : "—") + "</span></div>";
    }).join("") + "</div>";
  }

  function heroNeighborInner(row) {
    if (!row) return "";
    return '<span class="q-hero-neighbor-art">' + charArt(row.character.id, { tag: "span", viewBox: "66 34 188 340", outfit: row.status.owned ? equippedOf(row.character.id) : {} }) + "</span>" +
      '<span class="q-hero-neighbor-label">' + esc(row.character.name.split(" ")[0]) + "</span>";
  }

  function heroNeighborMarkup(row, side) {
    if (!row) return "";
    return '<button class="q-hero-neighbor is-' + side + '" type="button" data-sel="hero-neighbor-' + side + '" data-action="char-focus" data-character="' + esc(row.character.id) + '" aria-label="' + esc(row.character.name) + '">' +
      heroNeighborInner(row) + "</button>";
  }

  function charactersContext() {
    var all = Collection.filterCharacters(state, { filter: "all" });
    var counts = {
      all: all.length,
      owned: all.filter(function (row) { return row.status.owned; }).length,
      buy: all.filter(function (row) { return row.status.canPurchase; }).length,
      locked: all.filter(function (row) { return !row.status.owned && !row.status.canPurchase; }).length
    };
    var rows = Collection.filterCharacters(state, { filter: ui.charFilter, rarity: ui.charRarity, sort: ui.charSort });
    var focusRow = null;
    rows.some(function (row) {
      if (row.character.id === ui.charFocusId) { focusRow = row; return true; }
      return false;
    });
    if (!focusRow) {
      rows.some(function (row) { if (row.status.selected) { focusRow = row; return true; } return false; });
    }
    if (!focusRow) focusRow = rows[0] || null;
    if (focusRow) ui.charFocusId = focusRow.character.id;

    var focusIndex = 0;
    rows.forEach(function (row, i) { if (focusRow && row.character.id === focusRow.character.id) focusIndex = i; });
    var prevRow = rows.length ? rows[(focusIndex - 1 + rows.length) % rows.length] : null;
    var nextRow = rows.length ? rows[(focusIndex + 1) % rows.length] : null;
    var character = focusRow ? focusRow.character : selectedCharacter();
    var status = focusRow ? focusRow.status : Collection.characterStatus(state, character);
    var compatibleItems = Chars.compatibleWith(character.id);
    var compatibleOwned = compatibleItems.filter(function (item) { return Collection.ownsCosmetic(state, item.id); }).length;
    var compatiblePct = compatibleItems.length ? Math.round((compatibleOwned / compatibleItems.length) * 100) : 0;
    var equipped = status.owned ? equippedOf(character.id) : {};
    var previewState = ui.charPreviewState || "idle";
    var previewLabel = previewState === "victory" ? "Victoria" : previewState === "levelup" ? "Subida de nivel" : previewState === "correct" ? "Acierto" : "Reposo";
    return {
      all: all, counts: counts, rows: rows, focusRow: focusRow, focusIndex: focusIndex,
      prevRow: prevRow, nextRow: nextRow, character: character, status: status,
      compatibleItems: compatibleItems, compatibleOwned: compatibleOwned, compatiblePct: compatiblePct,
      equipped: equipped, previewState: previewState, previewLabel: previewLabel
    };
  }

  function heroesHeadMarkup(ctx) {
    return '<div><span class="q-kicker">Colección · ' + ctx.counts.owned + " / " + ctx.counts.all + '</span><h1 class="q-screen-title">Elige tu héroe.</h1><p>Inspecciona sin cambiar tu selección. Cada héroe tiene una voz, un equipo y una silueta propios.</p></div>' +
      '<div class="q-heroes-head-actions"><span class="q-currency q-currency--coins">' + icon("coins", 14) + "<b>" + fmt(state.coins) + '</b></span><a class="q-btn q-btn--soft q-btn--sm" href="#/tienda">' + icon("bag", 14) + " Tienda</a></div>";
  }

  function stripSummary(ctx) {
    return ctx.counts.owned + " obtenidos · " + ctx.counts.buy + " por reclutar · " + ctx.counts.locked + " bloqueados";
  }

  function heroStripMarkup(ctx) {
    return ctx.rows.map(function (row) {
      var item = row.character;
      var focused = row.character.id === ui.charFocusId;
      var stateText = row.status.selected ? "En uso" : row.status.owned ? "Obtenido" : row.status.canPurchase ? fmt(item.price) + " monedas" : "Bloqueado";
      return '<button class="q-strip-card q-rarity--' + item.rarity + (focused ? " is-focused" : "") + (row.status.selected ? " is-selected" : "") + '" type="button" data-action="char-focus" data-character="' + esc(item.id) + '" aria-pressed="' + (focused ? "true" : "false") + '"' + (row.status.selected ? ' aria-current="true"' : "") + '>' +
        '<span class="q-strip-art">' + charArt(item.id, { tag: "span", viewBox: "72 38 176 300", outfit: row.status.owned ? equippedOf(item.id) : {} }) + "</span>" +
        '<span class="q-strip-copy"><b>' + esc(item.name) + '</b><small>' + esc(item.rarityLabel) + " · " + esc(stateText) + "</small></span>" +
        "</button>";
    }).join("");
  }

  function heroDotsMarkup(ctx) {
    return ctx.rows.map(function (row) {
      return '<button class="q-hero-dot' + (row.character.id === ui.charFocusId ? " is-on" : "") + '" type="button" data-action="char-focus" data-character="' + esc(row.character.id) + '" aria-label="' + esc(row.character.name) + '" aria-current="' + (row.character.id === ui.charFocusId ? "true" : "false") + '"></button>';
    }).join("");
  }

  function heroesFigureMarkup(ctx) {
    return charArt(ctx.character.id, { hero: true, state: ctx.previewState, outfit: ctx.equipped }) +
      '<div class="q-heroes-nameplate">' + rarityStars(ctx.character) + '<b>' + esc(ctx.character.name) + '</b><small>' + esc(ctx.character.title) + "</small></div>" +
      '<span class="q-heroes-state">' + esc(ctx.previewLabel) + "</span>";
  }

  function heroInfoMarkup(ctx) {
    var character = ctx.character;
    var status = ctx.status;
    return '<span class="q-kicker">' + esc(character.personalityMeta.label) + " · " + esc(character.access.label) + "</span>" +
      '<div class="q-heroes-title"><h1 tabindex="-1">' + esc(character.name) + "</h1>" + rarityChip(character) + "</div>" +
      '<p class="q-heroes-subtitle">' + esc(character.title) + "</p>" +
      '<div class="q-heroes-badges">' + areaChip(character.areaAffinity) + heroStatusChip(status) + '<span class="q-chip">' + character.slotIds.length + " ranuras</span></div>" +
      '<p class="q-heroes-desc">' + esc(character.description) + "</p>" +
      '<blockquote class="q-heroes-quote">“' + esc(character.quote) + '”</blockquote>' +
      '<div class="q-heroes-personality"><span>' + icon("brain", 16) + '</span><div><span class="q-kicker">Personalidad</span><p>' + esc(character.personalityMeta.description) + "</p></div></div>" +
      '<div class="q-heroes-affinity"><span class="q-kicker">Afinidad temática</span><b>' + esc(C.areaMeta[character.areaAffinity].short) + "</b><p>" + esc(C.areaMeta[character.areaAffinity].blurb) + '</p><a class="q-textlink" href="#/mapa">Ver ruta ' + icon("arrowRight", 11) + "</a></div>" +
      '<div class="q-heroes-compat"><div class="q-row q-between"><span class="q-kicker">Armario compatible</span><b>' + ctx.compatibleOwned + " / " + ctx.compatibleItems.length + '</b></div>' + progressBar(ctx.compatiblePct, "Cosméticos compatibles obtenidos") + '<p>' + (ctx.compatibleOwned ? "Ya puedes equipar " + ctx.compatibleOwned + " " + plural(ctx.compatibleOwned, "objeto", "objetos") + " en este personaje." : "Aún no tienes objetos compatibles. Visita la tienda o completa logros.") + '</p><a class="q-textlink" href="#/inventario/' + encodeURIComponent(character.id) + '">Abrir equipamiento ' + icon("arrowRight", 11) + "</a></div>" +
      heroActions(character, status);
  }

  function heroDetailMarkup(ctx) {
    var character = ctx.character;
    var status = ctx.status;
    return '<div class="q-heroes-attrs"><span class="q-kicker">Atributos</span>' + attributesMarkup(character) + '<p class="q-xs q-muted">Descriptivos y de presentación. No alteran XP, monedas ni corrección.</p></div>' +
      '<div class="q-heroes-facts"><div><small>Rareza</small><b>' + esc(character.rarityLabel) + "</b></div><div><small>Precio</small><b>" + (character.price ? fmt(character.price) + " monedas" : "Sin coste") + "</b></div><div><small>Compatibles</small><b>" + Chars.compatibleWith(character.id).length + " cosméticos</b></div><div><small>Ventaja</small><b>Presentación</b></div></div>" +
      '<div class="q-heroes-equip"><div class="q-row q-between"><span class="q-kicker">Equipamiento</span><a class="q-textlink" href="#/inventario/' + encodeURIComponent(character.id) + '">' + (status.owned ? "Editar" : "Ver objetos") + "</a></div>" + heroEquipmentMini(character, ctx.equipped) + "</div>" +
      (status.owned ? '<div class="q-heroes-perk"><b>Ventaja de presentación</b><p>' + esc(character.signaturePerk) + "</p></div>" : '<div class="q-heroes-perk"><b>Requisito</b><p>' + esc(status.reason) + "</p></div>" + requirementMarkup(status.requirements)) +
      '<div class="q-heroes-gesture"><span class="q-kicker">Gesto característico</span><p>' + esc(character.signature.gesture) + "</p></div>" +
      '<div class="q-heroes-preview"><span class="q-kicker">Previsualizar animación</span><div class="q-row q-wrap">' +
        ["idle", "correct", "victory", "levelup"].map(function (stateName) {
          var label = stateName === "idle" ? "Reposo" : stateName === "correct" ? "Acierto" : stateName === "victory" ? "Victoria" : "Nivel";
          return '<button class="q-filter-tab' + (ctx.previewState === stateName ? " is-active" : "") + '" type="button" data-action="preview-state" data-state="' + stateName + '">' + label + "</button>";
        }).join("") + "</div></div>";
  }

  function patchHeroStrip(ctx) {
    var strip = qs('[data-sel="hero-strip"]');
    if (!strip) return;
    qsa(".q-strip-card", strip).forEach(function (card) {
      var item = Chars.byId(card.getAttribute("data-character"));
      if (!item) return;
      var status = Collection.characterStatus(state, item);
      var focused = item.id === ui.charFocusId;
      card.classList.toggle("is-focused", focused);
      card.setAttribute("aria-pressed", focused ? "true" : "false");
      card.classList.toggle("is-selected", !!status.selected);
      if (status.selected) card.setAttribute("aria-current", "true");
      else card.removeAttribute("aria-current");
      var stateText = status.selected ? "En uso" : status.owned ? "Obtenido" : status.canPurchase ? fmt(item.price) + " monedas" : "Bloqueado";
      var small = card.querySelector(".q-strip-copy small");
      if (small) small.textContent = item.rarityLabel + " · " + stateText;
    });
  }

  function updateNeighborMarkup(side, row, stage) {
    var button = qs('[data-sel="hero-neighbor-' + side + '"]', stage || qs("#view") || document);
    if (!button) return;
    if (!row) { button.hidden = true; return; }
    button.hidden = false;
    button.setAttribute("data-character", row.character.id);
    button.setAttribute("aria-label", row.character.name);
    button.innerHTML = heroNeighborInner(row);
  }

  function applyCharactersStage(ctx, options) {
    var stage = qs('[data-sel="hero-stage"]');
    if (!stage) return false;
    var scene = stage.querySelector(".q-scene");
    if (stage.getAttribute("data-area") !== ctx.character.areaAffinity) {
      var holder = document.createElement("div");
      holder.innerHTML = sceneFor(ctx.character, { variant: "select", accent2: ctx.character.rarityMeta.color });
      var nextScene = holder.firstElementChild;
      if (scene && scene.parentNode === stage) stage.replaceChild(nextScene, scene);
      else stage.insertBefore(nextScene, stage.firstChild);
      stage.setAttribute("data-area", ctx.character.areaAffinity);
    } else if (scene) {
      scene.style.setProperty("--scene-accent-2", ctx.character.rarityMeta.color);
    }
    stage.className = "q-heroes-stage q-rarity--" + ctx.character.rarity;
    stage.setAttribute("data-character", ctx.character.id);
    var figure = qs('[data-sel="heroes-figure"]', stage);
    if (figure) {
      figure.innerHTML = heroesFigureMarkup(ctx);
      if (!options || options.animate !== false) flashElement(figure, "q-sel-enter");
    }
    updateNeighborMarkup("prev", ctx.prevRow, stage);
    updateNeighborMarkup("next", ctx.nextRow, stage);
    qsa(".q-hero-dot", stage).forEach(function (dot) {
      var on = dot.getAttribute("data-character") === ui.charFocusId;
      dot.classList.toggle("is-on", on);
      dot.setAttribute("aria-current", on ? "true" : "false");
    });
    if (ui.sceneObserver) {
      qsa(".q-char, .q-scene", stage).forEach(function (element) {
        ui.sceneObserver.observe(element);
      });
    }
    return true;
  }

  function applyCharactersPanels(ctx) {
    replaceInner('[data-sel="hero-info"]', heroInfoMarkup(ctx));
    replaceInner('[data-sel="hero-detail"]', heroDetailMarkup(ctx));
    patchHeroStrip(ctx);
    document.title = pageTitle();
    syncChrome();
  }

  function refreshCharactersFocus() {
    if (route.name !== "characters" || !qs('[data-sel="hero-stage"]')) return false;
    var ctx = charactersContext();
    if (!applyCharactersStage(ctx, { animate: true })) return false;
    applyCharactersPanels(ctx);
    return true;
  }

  function refreshCharactersPreview() {
    if (route.name !== "characters") return false;
    var figure = qs('[data-sel="heroes-figure"]');
    if (!figure) return false;
    var ctx = charactersContext();
    figure.innerHTML = heroesFigureMarkup(ctx);
    qsa('[data-sel="hero-detail"] [data-action="preview-state"]').forEach(function (button) {
      button.classList.toggle("is-active", (button.getAttribute("data-state") || "") === (ui.charPreviewState || "idle"));
    });
    syncChrome();
    return true;
  }

  function refreshCharactersSelection() {
    if (route.name !== "characters" || !qs('[data-sel="hero-info"]')) return false;
    var ctx = charactersContext();
    applyCharactersPanels(ctx);
    flashElement(qs("[data-hero-chip]"), "q-sel-pulse");
    var heading = qs('[data-sel="hero-info"] h1');
    if (heading) { heading.setAttribute("tabindex", "-1"); U.focusElement(heading); }
    announce("Ahora juegas con " + ctx.character.name + ", rareza " + ctx.character.rarityLabel + ".");
    return true;
  }

  function refreshCharactersOwnership() {
    if (route.name !== "characters" || !qs('[data-sel="hero-stage"]')) return false;
    var ctx = charactersContext();
    var head = qs('[data-sel="heroes-head"]');
    if (head) head.innerHTML = heroesHeadMarkup(ctx);
    var filters = qs('[data-sel="hero-filters"]');
    if (filters) filters.outerHTML = characterFilters(ctx.rows, ctx.counts, ' data-sel="hero-filters"');
    applyCharactersStage(ctx, { animate: true });
    applyCharactersPanels(ctx);
    var summary = qs('[data-sel="strip-summary"]');
    if (summary) summary.textContent = stripSummary(ctx);
    var heading = qs('[data-sel="hero-info"] h1');
    if (heading) { heading.setAttribute("tabindex", "-1"); U.focusElement(heading); }
    return true;
  }

  function renderCharacters() {
    var ctx = charactersContext();
    return '<div class="q-page q-heroes">' +
      '<div class="q-heroes-head" data-sel="heroes-head">' + heroesHeadMarkup(ctx) + "</div>" +
      characterFilters(ctx.rows, ctx.counts, ' data-sel="hero-filters"') +
      '<div class="q-heroes-arena">' +
        '<aside class="q-heroes-info q-panel" data-sel="hero-info">' + heroInfoMarkup(ctx) + "</aside>" +
        '<div class="q-heroes-stage q-rarity--' + ctx.character.rarity + '" data-sel="hero-stage" data-character="' + esc(ctx.character.id) + '" data-area="' + esc(ctx.character.areaAffinity) + '" data-parallax>' +
          sceneFor(ctx.character, { variant: "select", accent2: ctx.character.rarityMeta.color }) +
          '<button class="q-hero-arrow is-prev" type="button" data-action="char-prev" aria-label="Personaje anterior">' + icon("chevronLeft", 20) + "</button>" +
          '<button class="q-hero-arrow is-next" type="button" data-action="char-next" aria-label="Personaje siguiente">' + icon("chevronRight", 20) + "</button>" +
          heroNeighborMarkup(ctx.prevRow, "prev") + heroNeighborMarkup(ctx.nextRow, "next") +
          '<div class="q-heroes-figure" data-sel="heroes-figure">' + heroesFigureMarkup(ctx) + "</div>" +
          '<div class="q-hero-dots" role="tablist" aria-label="Posición en el catálogo" data-sel="hero-dots">' + heroDotsMarkup(ctx) + "</div>" +
          '<span class="q-heroes-hint">' + icon("chevronLeft", 11) + " Desliza o usa las flechas " + icon("chevronRight", 11) + "</span>" +
        "</div>" +
        '<aside class="q-heroes-detail q-panel" data-sel="hero-detail">' + heroDetailMarkup(ctx) + "</aside>" +
      "</div>" +
      '<div class="q-heroes-strip-wrap"><div class="q-section-head"><div><span class="q-kicker">Catálogo</span><h2>Todo el elenco.</h2></div><span class="q-xs q-muted" data-sel="strip-summary">' + stripSummary(ctx) + '</span></div><div class="q-heroes-strip" data-sel="hero-strip">' + heroStripMarkup(ctx) + "</div></div>" +
    "</div>";
  }

  /* ------------------------------------------------------------------ */
  /* Inventario                                                         */
  /* ------------------------------------------------------------------ */
  function compatibilityReason(character, cosmetic) {
    if (!character || !cosmetic) return "";
    if (character.slotIds.indexOf(cosmetic.category) === -1) {
      var slot = Chars.slotMeta(cosmetic.category);
      return character.name + " no tiene ranura de " + (slot ? slot.label.toLowerCase() : cosmetic.category) + ".";
    }
    if (cosmetic.compatibleCharacterIds.indexOf(character.id) === -1) {
      var names = cosmetic.compatibleCharacterIds.map(function (id) {
        var item = Chars.byId(id);
        return item ? item.name.split(" ")[0] : id;
      });
      return "Diseñado para " + names.join(", ") + ". " + character.name + " no puede equiparlo.";
    }
    return "";
  }

  function equipmentSlotButton(character, draft, slotId) {
    var meta = Chars.slotMeta(slotId);
    var item = draft.equipped[slotId] ? Chars.cosmeticById(draft.equipped[slotId]) : null;
    return '<button class="q-eq-slot q-eq-slot--' + slotId + (ui.customSlot === slotId ? " is-active" : "") + (item ? " is-filled" : "") + '" type="button" data-action="custom-slot" data-slot="' + esc(slotId) + '" aria-pressed="' + (ui.customSlot === slotId ? "true" : "false") + '" aria-label="' + esc((meta ? meta.label : slotId) + ": " + (item ? item.name : "vacío")) + '">' +
      '<span class="q-eq-slot-icon">' + icon(meta ? meta.icon : "circle", 15) + "</span>" +
      '<span class="q-eq-slot-copy"><small>' + esc(meta ? meta.label : slotId) + "</small><b>" + esc(item ? item.name : "Vacío") + "</b></span>" +
      "</button>";
  }

  function equipmentItemCard(row, character, draft) {
    var cosmetic = row.cosmetic;
    var inDraft = draft.equipped[cosmetic.category] === cosmetic.id;
    var focused = ui.invFocusId === cosmetic.id;
    var reason = compatibilityReason(character, cosmetic);
    var classes = ["q-eq-item", "q-rarity--" + cosmetic.rarity];
    if (row.status.owned) classes.push("is-owned");
    if (inDraft) classes.push("is-equipped");
    if (focused) classes.push("is-focused");
    if (reason) classes.push("is-incompatible");
    if (!row.status.owned && !row.status.canPurchase) classes.push("is-locked");
    var stateLine = inDraft
      ? '<span class="q-eq-item-state is-current">' + icon("checkCircle", 11) + " En el atuendo</span>"
      : row.status.owned
        ? '<span class="q-eq-item-state is-owned">' + icon("check", 11) + " En inventario</span>"
        : row.status.canPurchase
          ? '<span class="q-eq-item-state">' + priceMarkup(cosmetic.price) + "</span>"
          : '<span class="q-eq-item-state is-lock">' + icon("lock", 11) + " Por logro</span>";
    return '<button class="' + classes.join(" ") + '" type="button" data-action="inv-focus" data-cosmetic="' + esc(cosmetic.id) + '" aria-pressed="' + (focused ? "true" : "false") + '">' +
      '<span class="q-eq-item-art">' + Art.mannequin(cosmetic.id) + "</span>" +
      '<span class="q-eq-item-copy"><b>' + esc(cosmetic.name) + "</b>" + rarityChip(cosmetic) + stateLine + "</span>" +
      (reason ? '<span class="q-eq-item-lock" title="' + esc(reason) + '">' + icon("lock", 11) + "</span>" : "") +
      "</button>";
  }

  function equipmentItemDetail(row, character, draft) {
    if (!row) {
      return '<div class="q-eq-detail is-empty"><span class="q-empty-icon">' + icon("layers", 20) + "</span><p>Selecciona un objeto para ver su detalle y probarlo en el atuendo.</p></div>";
    }
    var cosmetic = row.cosmetic;
    var status = row.status;
    var inDraft = draft.equipped[cosmetic.category] === cosmetic.id;
    var reason = compatibilityReason(character, cosmetic);
    var actions = "";
    if (status.owned) {
      if (reason) {
        actions = '<span class="q-chip q-chip--red">' + icon("lock", 12) + " Incompatible</span>";
      } else if (inDraft) {
        actions = '<button class="q-btn q-btn--soft q-btn--sm" type="button" data-action="custom-clear">' + icon("close", 14) + " Quitar del atuendo</button>";
      } else {
        actions = '<button class="q-btn q-btn--sm" type="button" data-action="custom-equip" data-cosmetic="' + esc(cosmetic.id) + '">' + icon("check", 14) + " Probar en el atuendo</button>";
      }
    } else if (status.canPurchase) {
      actions = '<button class="q-btn q-btn--sm" type="button" data-action="buy-cosmetic" data-cosmetic="' + esc(cosmetic.id) + '">' + icon("bag", 14) + " " + fmt(cosmetic.price) + " monedas</button>";
    } else {
      actions = '<span class="q-chip">' + icon("lock", 12) + " Se obtiene con un logro</span>";
    }
    return '<div class="q-eq-detail q-rarity--' + cosmetic.rarity + '">' +
      '<div class="q-eq-detail-head"><div class="q-eq-detail-art">' + Art.mannequin(cosmetic.id) + "</div><div><span class=\"q-kicker\">" + esc((Chars.slotMeta(cosmetic.category) || {}).label || cosmetic.category) + "</span><h3>" + esc(cosmetic.name) + "</h3>" + rarityChip(cosmetic) + "</div></div>" +
      '<p class="q-eq-detail-desc">' + esc(cosmetic.description) + "</p>" +
      (reason ? '<p class="q-eq-detail-warn">' + esc(reason) + "</p>" : '<p class="q-eq-detail-ok">' + icon("check", 12) + " Compatible con " + esc(character.name) + "</p>") +
      (status.requirements && status.requirements.length ? requirementMarkup(status.requirements) : "") +
      '<div class="q-eq-detail-actions">' + actions + '<a class="q-textlink" href="#/tienda">Tienda</a></div>' +
    "</div>";
  }

  function renderEquipment(characterId) {
    var character = equipmentCharacter(characterId);
    if (!character) return renderNotFound("Ese personaje no está en tu colección", "Puedes inspeccionarlo, pero el equipamiento se abre al obtenerlo.");
    var draft = currentDraft(character);
    if (ui.invCategory !== "all" && character.slotIds.indexOf(ui.invCategory) === -1) ui.invCategory = "all";
    var rows = Collection.filterCosmetics(state, {
      category: ui.invCategory,
      owned: ui.invOwnership,
      sort: ui.invSort
    });
    var focusRow = null;
    rows.some(function (row) {
      if (row.cosmetic.id === ui.invFocusId) { focusRow = row; return true; }
      return false;
    });
    if (!focusRow) {
      rows.some(function (row) {
        if (row.cosmetic.category === ui.customSlot) { focusRow = row; return true; }
        return false;
      });
    }
    if (!focusRow) focusRow = rows[0] || null;
    if (focusRow) ui.invFocusId = focusRow.cosmetic.id;

    var counts = {
      all: Chars.cosmetics.length,
      owned: state.collection.ownedCosmeticIds.length,
      missing: Chars.cosmetics.length - state.collection.ownedCosmeticIds.length
    };
    var changed = outfitChanged(character, draft);
    var hasPrevious = !!(state.collection.previousOutfits && state.collection.previousOutfits[character.id]);
    var activeMeta = Chars.slotMeta(ui.customSlot);
    var activeItem = draft.equipped[ui.customSlot] ? Chars.cosmeticById(draft.equipped[ui.customSlot]) : null;
    var ownedCompatible = Chars.compatibleWith(character.id).filter(function (item) {
      return Collection.ownsCosmetic(state, item.id);
    }).length;

    var ownershipTabs = [
      { id: "all", label: "Todos", count: counts.all },
      { id: "owned", label: "Obtenidos", count: counts.owned },
      { id: "missing", label: "No obtenidos", count: counts.missing }
    ].map(function (tab) {
      return '<button class="q-filter-tab' + (ui.invOwnership === tab.id ? " is-active" : "") + '" type="button" data-action="inv-ownership" data-filter="' + tab.id + '" aria-pressed="' + (ui.invOwnership === tab.id) + '">' + esc(tab.label) + " · " + tab.count + "</button>";
    }).join("");

    var categories = [{ id: "all", label: "Todas" }].concat(C.rpg.slots).map(function (slot) {
      var active = ui.invCategory === slot.id;
      return '<button class="q-eq-cat' + (active ? " is-active" : "") + '" type="button" data-action="inv-category" data-category="' + slot.id + '" aria-pressed="' + active + '">' + icon(slot.icon || "circle", 13) + "<span>" + esc(slot.label) + "</span></button>";
    }).join("");

    var sorts = [
      { id: "rarity", label: "Rareza" },
      { id: "priceAsc", label: "Precio ↑" },
      { id: "priceDesc", label: "Precio ↓" },
      { id: "name", label: "Nombre" }
    ].map(function (item) {
      return '<button class="q-filter-tab' + (ui.invSort === item.id ? " is-active" : "") + '" type="button" data-action="inv-sort" data-sort="' + item.id + '" aria-pressed="' + (ui.invSort === item.id) + '">' + esc(item.label) + "</button>";
    }).join("");

    var grid = rows.length
      ? rows.map(function (row) { return equipmentItemCard(row, character, draft); }).join("")
      : '<p class="q-empty-inline">No hay objetos con este filtro. Prueba otra categoría o la tienda.</p>';

    var slots = character.slotIds.map(function (slotId) { return equipmentSlotButton(character, draft, slotId); }).join("");
    var equippedNames = Chars.compatibleWith(character.id).filter(function (item) { return draft.equipped[item.category] === item.id; }).map(function (item) { return item.name; });

    return '<div class="q-page q-equipment">' +
      '<div class="q-equip-head"><div><div class="q-crumbs"><a href="#/personajes">Héroes</a>' + icon("chevronRight", 11) + '<a href="#/personaje/' + encodeURIComponent(character.id) + '">' + esc(character.name) + "</a>" + icon("chevronRight", 11) + "<span>Equipamiento</span></div>" +
        '<div class="q-equip-title"><div><span class="q-kicker">Estudio de equipamiento</span><h1 class="q-screen-title">Viste a ' + esc(character.name) + '.</h1><p>Selecciona una ranura, prueba objetos y guarda el conjunto. El personaje activo no cambia.</p></div>' +
        '<div class="q-equip-head-actions"><span class="q-currency q-currency--coins">' + icon("coins", 14) + "<b>" + fmt(state.coins) + '</b></span><a class="q-btn q-btn--soft q-btn--sm" href="#/personaje/' + encodeURIComponent(character.id) + '">' + icon("user", 13) + " Ficha</a></div></div></div></div>" +

      '<div class="q-equip-layout">' +
        '<section class="q-equip-stage q-rarity--' + character.rarity + '" data-parallax aria-label="Vista previa de ' + esc(character.name) + '">' +
          sceneFor(character, { variant: "equipment", accent2: character.rarityMeta.color }) +
          '<div class="q-equip-stage-head"><span class="q-chip">' + rarityChip(character) + "</span><span class=\"q-chip " + (changed ? "q-chip--amber" : "q-chip--green") + '">' + (changed ? "Cambios sin guardar" : "Atuendo guardado") + "</span></div>" +
          '<div class="q-equip-slots">' + slots + "</div>" +
          '<div class="q-equip-figure">' + charArt(character.id, { hero: true, outfit: draft.equipped, state: ui.charPreviewState || "idle" }) +
            '<div class="q-equip-plate">' + rarityStars(character) + "<b>" + esc(character.name) + "</b><small>" + esc(character.title) + "</small></div>" +
          "</div>" +
          '<div class="q-equip-stage-foot"><div><span class="q-kicker">' + esc(activeMeta ? activeMeta.label : "Ranura") + "</span><b>" + esc(activeItem ? activeItem.name : "Sin objeto") + "</b><p>" + esc(activeItem ? activeItem.description : (activeMeta ? CharacterArtHint(activeMeta.id) : "Elige una ranura para empezar.")) + "</p></div>" +
            '<div class="q-row q-wrap q-equip-previewbtns">' + ["idle", "victory", "levelup"].map(function (stateName) {
              var label = stateName === "idle" ? "Reposo" : stateName === "victory" ? "Victoria" : "Nivel";
              return '<button class="q-filter-tab' + ((ui.charPreviewState || "idle") === stateName ? " is-active" : "") + '" type="button" data-action="preview-state" data-state="' + stateName + '">' + label + "</button>";
            }).join("") + "</div></div>" +
        "</section>" +

        '<section class="q-equip-panel q-panel">' +
          '<div class="q-equip-panel-head"><div><span class="q-kicker">Inventario · ' + counts.owned + " / " + counts.all + '</span><h2>Cosméticos.</h2><p>' + ownedCompatible + " compatibles con " + esc(character.name) + "</p></div><a class=\"q-btn q-btn--ghost q-btn--sm\" href=\"#/tienda\">" + icon("bag", 13) + " Tienda</a></div>" +
          '<div class="q-filter-tabs">' + ownershipTabs + "</div>" +
          '<div class="q-eq-cats" role="group" aria-label="Categorías de cosméticos">' + categories + "</div>" +
          '<div class="q-eq-toolbar"><span class="q-filter-label">Orden</span><div class="q-filter-tabs">' + sorts + "</div></div>" +
          '<div class="q-eq-grid">' + grid + "</div>" +
          equipmentItemDetail(focusRow, character, draft) +
        "</section>" +
      "</div>" +

      '<div class="q-equip-savebar">' +
        '<div class="q-equip-saveinfo"><span class="q-chip ' + (changed ? "q-chip--amber" : "q-chip--green") + '">' + (changed ? icon("alert", 12) + " Cambios sin guardar" : icon("checkCircle", 12) + " Atuendo guardado") + "</span><small>" + (equippedNames.length ? esc(equippedNames.join(" · ")) : "Sin cosméticos equipados") + "</small></div>" +
        '<div class="q-equip-saveactions"><button class="q-btn q-btn--ghost q-btn--sm" type="button" data-action="discard-outfit"' + (changed ? "" : " disabled") + ">Descartar</button>" +
          '<button class="q-btn q-btn--ghost q-btn--sm" type="button" data-action="restore-outfit"' + (hasPrevious ? "" : " disabled") + ">" + icon("rotate", 13) + " Restaurar anterior</button>" +
          '<button class="q-btn q-btn--lg" type="button" data-action="save-outfit"' + (changed ? "" : " disabled") + ">" + icon("check", 15) + " Guardar atuendo</button></div>" +
      "</div>" +
    "</div>";
  }

  function renderInventory() {
    return renderEquipment(route.id || "");
  }

  /* ------------------------------------------------------------------ */
  /* Tienda                                                             */
  /* ------------------------------------------------------------------ */
  function shopCharacterAction(character) {
    var status = Collection.characterStatus(state, character);
    if (status.owned) return '<span class="q-chip q-chip--green">' + icon("check", 12) + " Obtenido</span>";
    if (status.canPurchase) return '<button class="q-btn q-btn--sm" type="button" data-action="buy-character" data-character="' + esc(character.id) + '">' + icon("bag", 13) + " " + fmt(character.price) + "</button>";
    return '<span class="q-chip">' + icon("lock", 11) + " Bloqueado</span>";
  }

  function shopCharacterCard(character) {
    var status = Collection.characterStatus(state, character);
    return '<article class="q-shop-card q-rarity--' + character.rarity + '" data-shop-kind="character" data-shop-id="' + esc(character.id) + '"><div class="q-shop-art">' + charArt(character.id, { thumb: true, outfit: status.owned ? equippedOf(character.id) : {} }) + "</div>" +
      '<div class="q-shop-body"><div class="q-row q-between"><b>' + esc(character.name) + "</b>" + rarityChip(character) + "</div><small>" + esc(character.title) + "</small><p>" + esc(character.personalityMeta.label) + " · " + character.slotIds.length + " ranuras</p>" +
      '<div class="q-shop-foot" data-sel="shop-action"><a class="q-textlink" href="#/personaje/' + encodeURIComponent(character.id) + '">Ver ficha</a>' + shopCharacterAction(character) + "</div></div></article>";
  }

  function shopCosmeticAction(cosmetic) {
    var status = Collection.cosmeticStatus(state, cosmetic);
    if (status.owned) return '<span class="q-chip q-chip--green">' + icon("check", 11) + " Obtenido</span>";
    if (status.canPurchase) return '<button class="q-btn q-btn--sm" type="button" data-action="buy-cosmetic" data-cosmetic="' + esc(cosmetic.id) + '">' + icon("bag", 13) + " " + fmt(cosmetic.price) + "</button>";
    return '<span class="q-chip">' + icon("lock", 11) + " Por logro</span>";
  }

  function shopCosmeticCard(cosmetic) {
    return '<article class="q-shop-card q-shop-card--item q-rarity--' + cosmetic.rarity + '" data-shop-kind="cosmetic" data-shop-id="' + esc(cosmetic.id) + '"><div class="q-shop-art q-shop-art--item">' + Art.mannequin(cosmetic.id, { full: true }) + "</div>" +
      '<div class="q-shop-body"><div class="q-row q-between"><b>' + esc(cosmetic.name) + "</b>" + rarityChip(cosmetic) + "</div><small>" + esc((Chars.slotMeta(cosmetic.category) || {}).label || cosmetic.category) + '</small><div class="q-shop-foot" data-sel="shop-action"><a class="q-textlink" href="#/inventario">Inventario</a>' + shopCosmeticAction(cosmetic) + "</div></div></article>";
  }

  function refreshShopOwnership(kind, id) {
    if (route.name !== "shop") return false;
    var view = qs("#view");
    if (!view) return false;
    var role = kind === "cosmetic" ? "cosmetic" : "character";
    var item = role === "character" ? Chars.byId(id) : Chars.cosmeticById(id);
    var card = qs('[data-shop-kind="' + role + '"][data-shop-id="' + id + '"]', view);
    if (card && item) {
      var foot = card.querySelector('[data-sel="shop-action"]');
      if (foot) {
        foot.innerHTML = role === "character"
          ? '<a class="q-textlink" href="#/personaje/' + encodeURIComponent(item.id) + '">Ver ficha</a>' + shopCharacterAction(item)
          : '<a class="q-textlink" href="#/inventario">Inventario</a>' + shopCosmeticAction(item);
      }
    }
    var balance = qs(".q-shop-balance b", view);
    if (balance) balance.innerHTML = icon("coins", 16) + " " + fmt(state.coins);
    var tx = qs('[data-sel="shop-tx-list"]', view);
    if (tx) tx.innerHTML = transactionsMarkup();
    syncChrome();
    var link = card ? card.querySelector("a.q-textlink") : null;
    if (link) U.focusElement(link);
    return true;
  }

  function transactionsMarkup() {
    var txs = state.economy && state.economy.transactions ? state.economy.transactions.slice(0, 6) : [];
    if (!txs.length) return '<p class="q-small q-muted">Todavía no hay compras registradas. Cada compra descuenta monedas una sola vez y queda en este historial.</p>';
    return '<div class="q-tx-list">' + txs.map(function (tx) {
      return '<div class="q-tx"><span class="q-tx-icon">' + icon(tx.kind === "character" ? "users" : "layers", 13) + "</span><span><b>" + esc(tx.name || tx.itemId) + '</b><small>' + esc(tx.kind === "character" ? "Personaje" : "Cosmético") + " · " + esc(U.formatRelative(tx.at)) + "</small></span><span class=\"q-tx-price\">−" + fmt(tx.price) + "</span><span class=\"q-tx-balance\">saldo " + fmt(tx.balanceAfter) + "</span></div>";
    }).join("") + "</div>";
  }

  function renderShop() {
    var featured = Collection.shopFeatured();
    var tabs = [
      { id: "featured", label: "Destacados" },
      { id: "characters", label: "Personajes" },
      { id: "cosmetics", label: "Cosméticos" }
    ].map(function (tab) {
      return '<button class="q-filter-tab ' + (ui.shopTab === tab.id ? "is-active" : "") + '" type="button" data-action="shop-tab" data-tab="' + tab.id + '" aria-pressed="' + (ui.shopTab === tab.id) + '">' + esc(tab.label) + "</button>";
    }).join("");
    var body = "";
    if (ui.shopTab === "featured") {
      body = '<section class="q-shop-section"><div class="q-section-head"><div><span class="q-kicker">Selección de la casa</span><h2>Piezas destacadas.</h2><p>Personajes y cosméticos con presencia propia. Ninguno mejora tu puntuación académica.</p></div></div>' +
        '<div class="q-shop-grid q-shop-grid--featured">' + featured.characters.map(shopCharacterCard).join("") + "</div>" +
        '<div class="q-shop-grid">' + featured.cosmetics.map(shopCosmeticCard).join("") + "</div></section>" +
        '<section class="q-panel q-panel--pad"><div class="q-section-head"><div><span class="q-kicker">Registro de compras</span><h2>Transacciones.</h2><p>El saldo y el historial viven en tu progreso local.</p></div><span class="q-chip">Límite diario de monedas: ' + C.coins.dailyCap + '</span></div><div data-sel="shop-tx-list">' + transactionsMarkup() + "</div></section>";
    } else if (ui.shopTab === "characters") {
      var rows = Collection.filterCharacters(state, { filter: "all", rarity: ui.shopRarity, sort: ui.shopSort });
      var rarities = [{ id: "all", label: "Todas" }].concat(Chars.rarityList().map(function (r) { return { id: r.id, label: r.label }; })).map(function (item) {
        return '<button class="q-filter-tab ' + (ui.shopRarity === item.id ? "is-active" : "") + '" type="button" data-action="shop-rarity" data-rarity="' + item.id + '">' + esc(item.label) + "</button>";
      }).join("");
      body = '<section class="q-shop-section"><div class="q-filter-row"><span class="q-filter-label">Rareza</span><div class="q-filter-tabs q-filter-tabs--wrap">' + rarities + "</div></div>" +
        '<div class="q-shop-grid">' + rows.map(function (row) { return shopCharacterCard(row.character); }).join("") + "</div></section>";
    } else {
      var items = Collection.filterCosmetics(state, { category: ui.shopCategory, sort: ui.shopSort });
      var categories = [{ id: "all", label: "Todas" }].concat(C.rpg.slots).map(function (slot) {
        return '<button class="q-filter-tab ' + (ui.shopCategory === slot.id ? "is-active" : "") + '" type="button" data-action="shop-category" data-category="' + slot.id + '">' + esc(slot.label) + "</button>";
      }).join("");
      body = '<section class="q-shop-section"><div class="q-filter-row"><span class="q-filter-label">Categoría</span><div class="q-filter-tabs q-filter-tabs--wrap">' + categories + "</div></div>" +
        '<div class="q-shop-grid">' + items.map(function (row) { return shopCosmeticCard(row.cosmetic); }).join("") + "</div></section>";
    }
    return '<div class="q-page q-shop">' +
      '<div class="q-section-head"><div><span class="q-kicker">Tienda · moneda virtual</span><h1 class="q-screen-title">Equipa tu ruta.</h1><p>Todo se compra con monedas ganadas en sesiones. Sin dinero real y sin ventajas académicas.</p></div>' +
        '<div class="q-shop-balance" data-sel="shop-balance"><span>Saldo disponible</span><b>' + icon("coins", 16) + " " + fmt(state.coins) + "</b></div></div>" +
      '<div class="q-filter-tabs">' + tabs + "</div>" + body +
      '<p class="q-xs q-muted">Las compras son definitivas: un personaje o cosmético no se puede comprar dos veces. El saldo nunca queda negativo y el historial guarda el saldo resultante.</p>' +
    "</div>";
  }

  /* ------------------------------------------------------------------ */
  /* Personalización por capas                                          */
  /* ------------------------------------------------------------------ */
  function currentDraft(character) {
    if (!ui.customDraft || ui.customDraft.characterId !== character.id) {
      ui.customDraft = { characterId: character.id, equipped: equippedOf(character.id) };
    }
    if (character.slotIds.indexOf(ui.customSlot) === -1) ui.customSlot = character.slotIds[0];
    return ui.customDraft;
  }

  function outfitChanged(character, draft) {
    var current = equippedOf(character.id);
    var keys = {};
    Object.keys(current).forEach(function (key) { keys[key] = true; });
    Object.keys(draft.equipped || {}).forEach(function (key) { keys[key] = true; });
    return Object.keys(keys).some(function (key) { return current[key] !== draft.equipped[key]; });
  }

  function renderCustomize(characterId) {
    return renderEquipment(characterId);
  }

  function CharacterArtHint(slotId) {
    var hints = {
      cabeza: "Cascos, diademas y coronas compatibles con la silueta del personaje.",
      peinado: "Peinados y mechones que se dibujan como capa sobre el cabello base.",
      torso: "Abrigos, batas y mantos que respetan las mangas y el emblema.",
      piernas: "Perneras, faldas y grebas sobre la base del personaje.",
      accesorios: "Gafas, brújulas, bolsos y plumas de la capa frontal.",
      extras: "Segundo accesorio: bolsos, plumas o piezas de apoyo compatibles.",
      amuletos: "Amuletos dibujados sobre el pecho, encima del vestuario.",
      efectos: "Auras y partículas detrás del personaje.",
      marcos: "Marcos de vitrina dibujados en el borde del retrato."
    };
    return hints[slotId] || "Capa cosmética compatible con el personaje.";
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

    var companionCharacter = selectedCharacter();
    var reaction = null;
    if (ui.reaction && ui.reaction.questionId === item.questionId) reaction = ui.reaction;
    if (!reaction && entry) {
      var replayEvent = entry.omitted ? "wrong" : (entry.correct ? "correct" : "wrong");
      var replayMessage = Reactions.message(companionCharacter.id, replayEvent, parseInt(U.hashString(item.questionId).slice(0, 4), 16) || 1);
      reaction = { event: replayEvent, animation: replayMessage.animation, text: replayMessage.text };
    }
    if (!reaction) {
      var idleMessage = Reactions.message(companionCharacter.id, "idle", index + 1);
      reaction = { event: "idle", animation: "idle", text: idleMessage.text };
    }
    var streak = currentAnswerStreak(session);
    var companion = '<div class="q-companion" data-companion data-state="' + esc(reaction.animation) + '">' +
      '<span class="q-companion-portrait">' + charArt(companionCharacter.id, { tag: "span", compact: true, state: reaction.animation }) + "</span>" +
      '<span class="q-companion-copy"><span class="q-companion-name">' + esc(companionCharacter.name) + " · " + esc(companionCharacter.personalityMeta.label) + '</span><span class="q-companion-line" role="status" aria-live="polite">' + esc(reaction.text) + "</span></span>" +
      (streak >= 2 ? '<span class="q-companion-streak">' + icon("flame", 13) + " " + streak + " seguidos</span>" : "") +
      "</div>";

    return '<div class="q-game">' +
      '<div class="q-gamebar"><div class="q-gamebar-left"><button class="q-iconbtn" type="button" data-action="abandon" aria-label="Abandonar sesión">' + icon("close", 17) + '</button><div class="q-gamebar-title"><b>' + esc(session.title) + "</b><span>" + esc(MODE_LABEL[session.mode] || "Sesión") + " · " + esc(C.stages[session.stage] ? C.stages[session.stage].name : "") + " · pregunta " + (index + 1) + " de " + total + "</span></div></div>" +
      '<div class="q-gamebar-right"><span class="q-chip">' + icon(MODE_ICON[session.mode] || "flag", 12) + esc(MODE_LABEL[session.mode] || "Sesión") + "</span>" + lives + timer + "</div></div>" +
      '<div class="q-game-progress" aria-hidden="true">' + progress + "</div>" +
      companion +
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
  function resultCompanionMarkup(character, animation, message, result, pass) {
    return '<section class="q-result-companion q-rarity--' + character.rarity + '" data-sel="result-companion">' +
      '<div class="q-result-companion-art">' + charArt(character.id, { state: animation, outfit: equippedOf(character.id) }) + "</div>" +
      '<div class="q-result-companion-copy"><span class="q-kicker">' + esc(character.name) + " · " + esc(character.personalityMeta.label) + '</span><p class="q-result-voice">“' + esc(message.text) + "”</p>" +
        (result.levelAfter > result.levelBefore ? '<span class="q-levelup-badge">' + icon("arrowUp", 13) + " Nivel " + result.levelBefore + " → " + result.levelAfter + "</span>" : "") +
        '<span class="q-chip">' + (pass ? "Celebración de victoria" : "Acompañamiento tras el resultado") + "</span>" +
      "</div></section>";
  }

  function unlockActionsMarkup(character) {
    if (!character) return "";
    var selected = selectedCharacterId() === character.id;
    return (selected
      ? '<span class="q-chip q-chip--green q-chip--lg">' + icon("checkCircle", 13) + " Héroe activo</span>"
      : '<button class="q-btn q-btn--sm" type="button" data-action="select-character" data-character="' + esc(character.id) + '">' + icon("check", 13) + " Seleccionar</button>") +
      '<a class="q-textlink" href="#/personaje/' + encodeURIComponent(character.id) + '">Ver ficha</a>';
  }

  function refreshResultSelection() {
    if (route.name !== "result") return false;
    var view = qs("#view");
    var session = Engine.sessionById(state, route.id);
    if (!view || !session || !session.result) return false;
    var result = session.result;
    var pass = !!result.pass;
    var character = selectedCharacter();
    var animation = result.levelAfter > result.levelBefore ? "levelup" : (pass ? "victory" : "defeat");
    var message = Reactions.message(character.id, animation, parseInt(U.hashString(session.id).slice(0, 4), 16) || 1);
    var host = qs('[data-sel="result-companion"]', view);
    if (host) {
      var holder = document.createElement("div");
      holder.innerHTML = resultCompanionMarkup(character, animation, message, result, pass);
      var next = holder.firstElementChild;
      host.parentNode.replaceChild(next, host);
      flashElement(next, "q-sel-enter");
      if (ui.sceneObserver) qsa(".q-char, .q-scene", next).forEach(function (element) { ui.sceneObserver.observe(element); });
    }
    var hero = qs(".q-result-hero", view);
    if (hero && hero.getAttribute("data-result-area") !== character.areaAffinity) {
      var oldScene = null;
      Array.prototype.slice.call(hero.children).some(function (child) {
        if (child.classList && child.classList.contains("q-scene")) { oldScene = child; return true; }
        return false;
      });
      var sceneHolder = document.createElement("div");
      sceneHolder.innerHTML = sceneFor(character, { variant: "result", accent2: pass ? C.areaMeta[character.areaAffinity].accent : "#F07178" });
      if (oldScene) hero.replaceChild(sceneHolder.firstElementChild, oldScene);
      else hero.insertBefore(sceneHolder.firstElementChild, hero.firstChild);
      hero.setAttribute("data-result-area", character.areaAffinity);
    }
    qsa("[data-unlock-character]", view).forEach(function (card) {
      var actions = card.querySelector('[data-sel="unlock-actions"]');
      if (actions) actions.innerHTML = unlockActionsMarkup(Chars.byId(card.getAttribute("data-unlock-character")));
    });
    syncChrome();
    announce("Ahora juegas con " + character.name + ", rareza " + character.rarityLabel + ".");
    var selectedCard = qs('[data-unlock-character="' + selectedCharacterId() + '"]', view);
    var link = selectedCard ? selectedCard.querySelector("a.q-textlink") : null;
    if (link) U.focusElement(link);
    return true;
  }

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
    var resultCharacter = selectedCharacter();
    var resultEvent = r.levelAfter > r.levelBefore ? "levelup" : (pass ? "victory" : "defeat");
    var resultAnimation = r.levelAfter > r.levelBefore ? "levelup" : (pass ? "victory" : "defeat");
    var resultMessage = Reactions.message(resultCharacter.id, resultEvent, (parseInt(U.hashString(session.id).slice(0, 4), 16) || 1));
    var unlockedCharacters = (r.charactersUnlocked || []).map(function (entry) { return Chars.byId(entry.id); }).filter(Boolean);
    var unlockedMarkup = unlockedCharacters.length ? '<section class="q-unlock-strip"><div class="q-section-head"><div><span class="q-kicker">Nuevo en tu colección</span><h2>Un personaje se unió a la ruta.</h2><p>La recompensa se registró una sola vez. Puedes seleccionarlo o inspeccionarlo.</p></div></div><div class="q-unlock-grid">' + unlockedCharacters.map(function (character) {
      return '<article class="q-unlock-card q-rarity--' + character.rarity + '" data-unlock-character="' + esc(character.id) + '"><div class="q-unlock-card-art">' + charArt(character.id, { state: "unlock", outfit: {} }) + "</div><div class=\"q-unlock-card-body\">" + rarityChip(character) + "<h3>" + esc(character.name) + "</h3><p>" + esc(character.title) + "</p><p class=\"q-xs q-muted\">“" + esc(Reactions.unlockMessage(character.id)) + "”</p><div class=\"q-row\" data-sel=\"unlock-actions\">" + unlockActionsMarkup(character) + "</div></div></article>";
    }).join("") + "</div></section>" : "";
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
      '<div class="q-panel q-result-hero ' + (pass ? "" : "is-fail") + '" data-result-area="' + esc(resultCharacter.areaAffinity) + '">' + sceneFor(resultCharacter, { variant: "result", accent2: pass ? C.areaMeta[resultCharacter.areaAffinity].accent : "#F07178" }) + '<div class="q-result-top"><div><span class="q-kicker">' + esc(MODE_LABEL[session.mode] || "Sesión") + " · " + esc(U.formatDate(session.endedAt, true)) + "</span><h1>" + esc(title) + "</h1><p>" + esc(session.title) + " · " + esc(r.completionLabel) + "</p><div class=\"q-detail-tags\" style=\"margin-top:14px\"><span class=\"q-chip " + (pass ? "q-chip--green" : "q-chip--amber") + "\">" + (pass ? "Objetivo cumplido" : "Sin recompensa de finalización") + "</span>" + (r.abandoned ? '<span class="q-chip q-chip--red">Abandonada</span>' : "") + (r.rankUp ? '<span class="q-chip q-chip--violet">Nuevo rango: ' + esc(r.rankAfter) + "</span>" : (r.rankDown ? '<span class="q-chip q-chip--amber">Rango ajustado: ' + esc(r.rankAfter) + "</span>" : "")) + "</div></div>" +
      '<div class="q-result-score">' + scoreRing(r.accuracy * 100, "precisión", pass ? "var(--green)" : "var(--red)") + '<div><div class="q-result-stat" style="padding:12px 14px"><b>' + r.score + '</b><span>puntos de sesión</span></div><div class="q-xs q-muted" style="margin-top:7px">' + r.correct + " de " + r.total + " preguntas correctas</div></div></div></div>" +
      '<div class="q-result-stats"><div class="q-result-stat"><b>' + r.correct + '</b><span>correctas</span></div><div class="q-result-stat"><b>' + r.wrong + '</b><span>incorrectas</span></div><div class="q-result-stat"><b>' + r.omitted + '</b><span>sin respuesta</span></div><div class="q-result-stat"><b>' + U.formatDuration(r.totalTimeMs) + '</b><span>tiempo</span></div></div></div>' +

      resultCompanionMarkup(resultCharacter, resultAnimation, resultMessage, r, pass) +

      '<div class="q-result-grid"><section class="q-panel q-panel--pad"><span class="q-kicker">Recompensas registradas</span>' + rewardLines + '<p class="q-xs q-muted" style="margin-top:10px">' + esc(completionNote) + '</p><div class="q-data-actions">' + (session.mode === "mission" || session.mode === "boss" ? '<button class="q-btn q-btn--soft q-btn--sm" type="button" data-action="retry" data-mission="' + esc(session.missionId) + '">' + icon("rotate", 14) + " Repetir</button>" : "") + '<a class="q-btn q-btn--ghost q-btn--sm" href="#/mapa">Volver al mapa</a><a class="q-btn q-btn--ghost q-btn--sm" href="#/">Inicio</a></div></section>' +
      '<section class="q-panel q-panel--pad"><span class="q-kicker">Progreso</span>' + breakdown + stageChange + (achievements ? '<div style="margin-top:12px"><span class="q-kicker">Logros desbloqueados</span><div class="q-detail-tags" style="margin-top:8px">' + achievements + "</div></div>" : "") + '<div class="q-result-list" style="margin-top:12px"><div class="q-result-line"><span>Nivel</span><b>' + r.levelBefore + " → " + r.levelAfter + '</b></div><div class="q-result-line"><span>Rango</span><b>' + esc(r.rankBefore || "—") + " → " + esc(r.rankAfter || "—") + '</b></div>' + (r.dailyStreak != null ? '<div class="q-result-line"><span>Racha diaria</span><b>' + r.dailyStreak + " " + plural(r.dailyStreak, "día", "días") + '</b></div>' : "") + '</div></section></div>' +

      unlockedMarkup +
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
    return '<div class="q-page">' + progressSubnav("errors") +
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
    return '<div class="q-page">' + progressSubnav("profile") +
      '<div class="q-panel q-profile-hero"><div class="q-profile-id">' + avatar(state.profile.name) + '<div><span class="q-kicker">Perfil local</span><h1>' + esc(state.profile.name) + "</h1><p>" + esc(rank.name) + " · " + esc(rank.description) + "</p></div></div><div class=\"q-profile-xp\"><div class=\"q-progress-head\"><span>Nivel " + level.level + "</span><b>" + state.xp + " XP</b></div><b>" + (level.maxed ? "Máximo" : level.intoLevel + " / " + level.needed) + '</b><span class="q-xs q-muted">' + (level.maxed ? "Nivel máximo alcanzado" : "para el nivel " + (level.level + 1)) + "</span>" + progressBar(level.percent, "Progreso de nivel") + "</div></div>" +
      '<div class="q-profile-grid">' + '<div class="q-stat"><b>' + stats.answered + "</b><span>respondidas</span></div>" + '<div class="q-stat"><b>' + Math.round(stats.accuracy * 100) + "%</b><span>precisión</span></div>" + '<div class="q-stat"><b>' + stats.mastered + "</b><span>dominadas</span></div>" + '<div class="q-stat"><b>' + stats.missions + "</b><span>misiones</span></div>" + '<div class="q-stat"><b>' + stats.bosses + "</b><span>jefes</span></div>" + '<div class="q-stat"><b>' + stats.recoveries + "</b><span>recuperadas</span></div>" + '<div class="q-stat"><b>' + state.collection.ownedCharacterIds.length + " / " + Chars.characters.length + "</b><span>personajes</span></div>" + '<div class="q-stat"><b>' + state.collection.ownedCosmeticIds.length + " / " + Chars.cosmetics.length + "</b><span>cosméticos</span></div></div>" +
      `<div class="q-section-grid q-profile-main"><section class="q-panel q-panel--pad"><div class="q-section-head"><div><span class="q-kicker">Rango</span><h2>${esc(rank.name)}</h2><p>${rp.next ? "Siguiente: " + esc(rp.next.name) + " · " + rp.percent + "% de criterios cumplidos." : "Rango máximo alcanzado."}</p></div><span class="q-chip q-chip--violet">${icon("award", 12)} ${state.coins} monedas</span></div><div class="q-rank-ladder" style="margin-top:12px">${rankSteps}</div>` + (rp.next ? '<p class="q-xs q-muted" style="margin-top:10px">Falta: ' + missing + '</p>' : "") + `</section>` +
      '<section class="q-panel q-panel--pad q-profile-character"><div class="q-section-head"><div><span class="q-kicker">Personaje activo</span><h2>' + esc(selectedCharacter().name) + '</h2><p>' + esc(selectedCharacter().title) + " · " + esc(selectedCharacter().personalityMeta.label) + '</p></div>' + rarityChip(selectedCharacter()) + '</div><div class="q-profile-char-body">' + charArt(selectedCharacter().id, { compact: true, outfit: equippedOf(selectedCharacter().id) }) + '<div class="q-row" style="flex-wrap:wrap"><a class="q-btn q-btn--soft q-btn--sm" href="#/personajes">' + icon("users", 13) + ' Catálogo</a><a class="q-btn q-btn--soft q-btn--sm" href="#/inventario">' + icon("layers", 13) + ' Inventario</a><a class="q-btn q-btn--ghost q-btn--sm" href="#/inventario/' + encodeURIComponent(selectedCharacter().id) + '">' + icon("sliders", 13) + ' Personalizar</a></div></div></section></div>' +
      '<section class="q-panel q-panel--pad q-profile-area"><div class="q-section-head"><div><span class="q-kicker">Precisión por área</span><h2>Dónde tienes evidencia.</h2><p>Se prioriza la evidencia de afinidad alta o media. Sin evidencia no se inventa un porcentaje.</p></div></div><div class="q-area-mastery" style="margin-top:12px">' + areaRows + "</div></section>" +
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
    return `<div class="q-page">${progressSubnav("achievements")}<div class="q-section-head"><div><span class="q-kicker">Logros verificables</span><h1 style="font-size:clamp(28px,4vw,44px)">Hitos, no adornos.</h1><p>Cada logro se calcula con respuestas, misiones o rachas registradas en este navegador.</p></div><span class="q-chip q-chip--violet">${icon("award", 12)} ${unlocked} / ${C.achievements.length}</span></div><div class="q-filter-tabs">${tabs}</div><div class="q-achievement-grid">${filtered.map(achievementCard).join("")}</div></div>`;
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
    return '<div class="q-page">' + progressSubnav("ranking") + '<div class="q-section-head"><div><span class="q-kicker">Registro local</span><h1 style="font-size:clamp(28px,4vw,44px)">Tu propia referencia.</h1><p>Sin usuarios simulados ni clasificación mundial. Solo resultados registrados en este navegador.</p></div><span class="q-chip">' + sessions.length + " sesiones válidas</span></div><div class=\"q-local-note\">" + icon("info", 15) + "<span>Este registro compara tus propias sesiones. No mezcla XP acumulada con competencia: la precisión y el dominio se muestran por separado.</span></div>" + records + '<div class="q-section"><div class="q-section-head"><div><span class="q-kicker">Historial</span><h2>Sesiones y precisión.</h2></div><div class="q-filter-tabs">' + tabs + "</div></div>" + body + "</div></div>";
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
      ${progressSubnav("settings")}
      <div class="q-section-head"><div><span class="q-kicker">Configuración</span><h1 style="font-size:clamp(28px,4vw,44px)">Control y transparencia.</h1><p>Tu progreso vive en este navegador. Puedes exportarlo, importarlo o archivarlo sin tocar otras aplicaciones.</p></div><span class="q-chip">${esc(C.build)}</span></div>
      <div class="q-settings-grid">
        ${audioSettingsMarkup()}
        <section class="q-panel q-settings-section"><h2>Perfil</h2><p>Nombre visible en este navegador.</p>
          <div style="margin-top:12px"><label class="q-xs q-muted" for="profile-name">Nombre</label><div class="q-row" style="margin-top:5px"><input class="q-input" id="profile-name" maxlength="40" value="${esc(state.profile.name)}"><button class="q-btn q-btn--sm" type="button" data-action="save-name">Guardar</button></div></div>
          <div class="q-setting-row"><div><b>Monedas acumuladas</b><small>Se reinician solo si reinicias el progreso. Límite de ganancia diaria: ${C.coins.dailyCap}.</small></div><b>${state.coins}</b></div>
        </section>
        <section class="q-panel q-settings-section"><h2>Experiencia</h2><p>Preferencias de la interfaz.</p>
          <div class="q-setting-row"><div><b>Tema</b><small>Oscuro por defecto; el tema claro mantiene la misma jerarquía.</small></div><button class="q-switch ${state.settings.theme === "light" ? "is-on" : ""}" type="button" data-action="toggle-setting" data-setting="theme" aria-label="Usar tema claro" aria-pressed="${state.settings.theme === "light"}"></button></div>
          <div class="q-setting-row"><div><b>Reducir movimiento</b><small>Anula animaciones sin quitar funciones.</small></div><button class="q-switch ${state.settings.reducedMotion ? "is-on" : ""}" type="button" data-action="toggle-setting" data-setting="reducedMotion" aria-label="Reducir movimiento" aria-pressed="${!!state.settings.reducedMotion}"></button></div>
          <div class="q-setting-row"><div><b>Feedback inmediato en misiones</b><small>Si lo desactivas, la clave se muestra al final. Los jefes y el contrarreloj siempre difieren el feedback.</small></div><button class="q-switch ${state.settings.instantFeedback ? "is-on" : ""}" type="button" data-action="toggle-setting" data-setting="instantFeedback" aria-label="Feedback inmediato en misiones" aria-pressed="${!!state.settings.instantFeedback}"></button></div>
          <div class="q-setting-row"><div><b>Animación ambiental</b><small>Respiración y parpadeo del personaje en reposo. No bloquea preguntas.</small></div><button class="q-switch ${state.presentation.animationPreferences.idle ? "is-on" : ""}" type="button" data-action="toggle-pref" data-group="animationPreferences" data-pref="idle" aria-label="Animación ambiental" aria-pressed="${!!state.presentation.animationPreferences.idle}"></button></div>
          <div class="q-setting-row"><div><b>Reacciones del personaje</b><small>Mensajes y gestos ante aciertos, errores, rachas y resultados.</small></div><button class="q-switch ${state.presentation.animationPreferences.reactions ? "is-on" : ""}" type="button" data-action="toggle-pref" data-group="animationPreferences" data-pref="reactions" aria-label="Reacciones del personaje" aria-pressed="${!!state.presentation.animationPreferences.reactions}"></button></div>
          <div class="q-setting-row"><div><b>Marcos de rareza</b><small>Bordes y brillo de vitrina según la rareza. La rareza siempre se escribe con texto.</small></div><button class="q-switch ${state.presentation.visualPreferences.rarityFrames ? "is-on" : ""}" type="button" data-action="toggle-pref" data-group="visualPreferences" data-pref="rarityFrames" aria-label="Marcos de rareza" aria-pressed="${!!state.presentation.visualPreferences.rarityFrames}"></button></div>
          <div class="q-setting-row"><div><b>Partículas y auras</b><small>Efectos cosméticos discretos. Se desactivan al reducir movimiento.</small></div><button class="q-switch ${state.presentation.visualPreferences.particles ? "is-on" : ""}" type="button" data-action="toggle-pref" data-group="visualPreferences" data-pref="particles" aria-label="Partículas y auras" aria-pressed="${!!state.presentation.visualPreferences.particles}"></button></div>
        </section>
        <section class="q-panel q-settings-section"><h2>Colección</h2><p>Personajes y cosméticos de este perfil local.</p>
          <div class="q-setting-row"><div><b>Personaje activo</b><small>${esc(selectedCharacter().name)} · ${esc(selectedCharacter().title)}</small></div><a class="q-btn q-btn--soft q-btn--sm" href="#/personajes">${icon("users", 14)} Cambiar</a></div>
          <div class="q-setting-row"><div><b>Personajes obtenidos</b><small>El personaje inicial siempre está disponible; el resto se compra o se desbloquea.</small></div><b>${state.collection.ownedCharacterIds.length} / ${Chars.characters.length}</b></div>
          <div class="q-setting-row"><div><b>Cosméticos</b><small>Inventario independiente de la tienda, con compatibilidad por personaje.</small></div><b>${state.collection.ownedCosmeticIds.length} / ${Chars.cosmetics.length}</b></div>
          <div class="q-data-actions"><a class="q-btn q-btn--soft q-btn--sm" href="#/inventario">${icon("layers", 14)} Inventario</a><a class="q-btn q-btn--soft q-btn--sm" href="#/tienda">${icon("bag", 14)} Tienda</a><a class="q-btn q-btn--ghost q-btn--sm" href="#/inventario/${encodeURIComponent(selectedCharacter().id)}">${icon("sliders", 14)} Personalizar</a></div>
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
  /* Efectos de escena, visibilidad y audio                             */
  /* ------------------------------------------------------------------ */
  function bindSceneEffects(root) {
    var reduce = state.settings.reducedMotion || U.prefersReducedMotion();
    qsa("[data-parallax]", root).forEach(function (host) {
      if (host.getAttribute("data-parallax-bound") === "1") return;
      host.setAttribute("data-parallax-bound", "1");
      if (reduce || window.matchMedia("(pointer: coarse)").matches) return;
      var raf = 0;
      var scene = qs(".q-scene-svg", host);
      var figure = qs(".q-hero-figure, .q-heroes-figure, .q-equip-figure", host);
      host.addEventListener("pointermove", function (event) {
        if (raf) return;
        raf = window.requestAnimationFrame(function () {
          raf = 0;
          var rect = host.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          var px = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
          var py = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
          if (scene) scene.style.transform = "translate3d(" + (px * 9).toFixed(2) + "px," + (py * 6).toFixed(2) + "px,0) scale(1.03)";
          if (figure) figure.style.transform = "translate3d(" + (px * -7).toFixed(2) + "px," + (py * -4).toFixed(2) + "px,0)";
        });
      });
      host.addEventListener("pointerleave", function () {
        if (scene) scene.style.transform = "";
        if (figure) figure.style.transform = "";
      });
    });
    if (!("IntersectionObserver" in window)) return;
    if (!ui.sceneObserver) {
      ui.sceneObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle("is-offscreen", !entry.isIntersecting);
        });
      }, { rootMargin: "180px" });
    }
    qsa(".q-char, .q-scene", root).forEach(function (el) {
      ui.sceneObserver.observe(el);
    });
  }

  function bindAudioVolumes() {
    document.addEventListener("change", function (event) {
      var input = event.target && event.target.closest ? event.target.closest("[data-audio-volume]") : null;
      if (!input) return;
      var key = input.getAttribute("data-audio-volume");
      if (key !== "sfxVolume" && key !== "musicVolume") return;
      var patch = {};
      patch[key] = Math.max(0, Math.min(1, Number(input.value) / 100));
      setAudioPatch(patch);
      if (key === "sfxVolume") sfx("select", { force: true });
    });
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
    if (head === "perfil" || head === "progreso") return { name: "profile", id: "" };
    if (head === "logros") return { name: "achievements", id: "" };
    if (head === "registro") return { name: "ranking", id: "" };
    if (head === "ajustes") return { name: "settings", id: "" };
    if (head === "jugar") return { name: "play", id: "" };
    if (head === "personajes") return { name: "characters", id: "" };
    if (head === "personaje" && parts[1]) return { name: "characters", id: parts[1] };
    if (head === "inventario") return { name: "inventory", id: parts[1] || "" };
    if (head === "tienda") return { name: "shop", id: "" };
    if (head === "personalizar" && parts[1]) return { name: "customize", id: parts[1] };
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
    if (changedRoute && route.name === "characters") ui.charFocusId = route.id || "";
    var view = qs("#view");
    var boot = qs("#q-boot");
    if (!view) return;
    var html = "";
    try {
      if (route.name === "home") html = renderHome();
      else if (route.name === "map") html = renderMap();
      else if (route.name === "characters") html = renderCharacters();
      else if (route.name === "inventory") html = renderInventory();
      else if (route.name === "shop") html = renderShop();
      else if (route.name === "customize") html = renderCustomize(route.id);
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
    bindSceneEffects(view);
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
    if (route.name === "characters" || route.name === "inventory") {
      var focusedCard = view.querySelector('[data-action="char-focus"][aria-pressed="true"]') || view.querySelector('[data-action="inv-focus"][aria-pressed="true"]');
      var scroller = focusedCard && focusedCard.closest ? focusedCard.closest(".q-heroes-strip, .q-roster-track, .q-eq-grid") : null;
      if (scroller && focusedCard) {
        var left = focusedCard.offsetLeft - scroller.clientWidth / 2 + focusedCard.offsetWidth / 2;
        scroller.scrollLeft = Math.max(0, left);
      }
    }
    tickTimer();
    flushUnlocks();
  }

  function pageTitle() {
    if (route.name === "home") return "SERUMS QUEST · RPG de aprendizaje";
    if (route.name === "map") return "Mapa de misiones · SERUMS QUEST";
    if (route.name === "characters") {
      var focused = ui.charFocusId ? Chars.byId(ui.charFocusId) : null;
      return (focused ? focused.name : "Personajes") + " · SERUMS QUEST";
    }
    if (route.name === "inventory") {
      var invChar = equipmentCharacter(route.id);
      return "Equipamiento de " + (invChar ? invChar.name : "personaje") + " · SERUMS QUEST";
    }
    if (route.name === "shop") return "Tienda · SERUMS QUEST";
    if (route.name === "customize") { var c = Chars.byId(route.id); return "Personalizar " + (c ? c.name : "personaje") + " · SERUMS QUEST"; }
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
    else if (route.name === "characters" || route.name === "customize") activeNav = "characters";
    else if (route.name === "inventory") activeNav = "inventory";
    else if (route.name === "shop") activeNav = "shop";
    else if (route.name === "profile" || route.name === "achievements" || route.name === "ranking" || route.name === "errors" || route.name === "settings") activeNav = "progress";
    qsa(".q-navlink[data-nav], .q-bottomlink[data-nav]").forEach(function (link) {
      if (link.getAttribute("data-route") === activeNav) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    var playing = route.name === "map" || route.name === "mission" || route.name === "mode" || route.name === "play";
    var playBtn = qs("[data-play-btn]");
    if (playBtn) {
      playBtn.classList.toggle("is-active", playing);
      if (playing) playBtn.setAttribute("aria-current", "page");
      else playBtn.removeAttribute("aria-current");
    }
    var due = Content.recoveryStats(state).due;
    var badge = qs("[data-errors-badge]");
    if (badge) {
      badge.hidden = due <= 0;
      badge.textContent = due;
    }
    var character = selectedCharacter();
    var portrait = qs("[data-char-portrait]");
    if (portrait) {
      var portraitKey = character.id + "|" + outfitSignature(equippedOf(character.id)) + "|" + character.rarity;
      if (portrait.getAttribute("data-render-key") !== portraitKey) {
        portrait.innerHTML = charArt(character.id, { tag: "span", viewBox: "88 56 144 168", ariaLabel: character.name });
        portrait.setAttribute("data-render-key", portraitKey);
      }
    }
    var playerName = qs("[data-player-name]");
    if (playerName) playerName.textContent = state.profile.name;
    var levelLine = qs("[data-char-level]");
    if (levelLine) levelLine.textContent = "Nv " + level.level + " · " + rank.short;
    var xpBar = qs("[data-xp-bar]");
    if (xpBar) xpBar.style.transform = "scaleX(" + (Math.max(0, Math.min(100, level.percent || 0)) / 100) + ")";
    var xpNum = qs("[data-xp-num]");
    if (xpNum) xpNum.textContent = fmt(state.xp) + " XP";
    var heroChip = qs("[data-hero-chip]");
    if (heroChip) {
      heroChip.setAttribute("data-character", character.id);
      heroChip.title = character.name + " · " + character.title + " · " + character.rarityLabel;
      heroChip.setAttribute("aria-label", "Personaje seleccionado: " + character.name + ". Cambiar de personaje.");
    }
    var coins = qs("[data-coins-pill] b");
    if (coins) coins.textContent = fmt(state.coins);
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
    syncAudio();
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

  function announceResult(result) {
    if (!result) return;
    if (result.levelAfter > result.levelBefore) {
      window.setTimeout(function () { sfx("levelup"); }, 320);
    } else if (result.abandoned || !result.pass) {
      sfx("defeat");
    } else {
      sfx("victory");
    }
  }

  function answerAction(letter) {
    var session = state.activeSession;
    if (!session) return;
    var item = Engine.currentItem(session);
    if (!item || session.answers[item.questionId]) return;
    var questionId = item.questionId;
    var res = commit(function (draft, ctx) {
      return Engine.answer(draft, session.id, letter, ctx.now);
    });
    if (!res) return;
    if (res.result && res.result.expired) {
      if (res.result.questionExpired) {
        commit(function (draft, ctx) {
          return Engine.omitCurrent(draft, session.id, "Tiempo agotado: sin respuesta.", ctx.now);
        });
        reactionFor("wrong", selectedCharacterId(), questionId);
        sfx("error");
        render();
        return;
      }
      var fin = commit(function (draft, ctx) {
        return Engine.finish(draft, session.id, "time", ctx.now);
      });
      if (fin) {
        queueUnlocks(fin.result && fin.result.charactersUnlocked);
        announceResult(fin.result);
        location.hash = "#/resultado/" + encodeURIComponent(fin.result.id);
        return;
      }
    }
    var outcome = res.result && res.result.outcome;
    if (outcome && state.activeSession) {
      var streak = currentAnswerStreak(state.activeSession);
      var event = outcome.correct ? (streak >= 3 ? "streak" : "correct") : "wrong";
      reactionFor(event, selectedCharacterId(), questionId);
      if (outcome.correct) sfx(streak >= 3 ? "streak" : "correct");
      else sfx("error");
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
      queueUnlocks(res.result.session.result ? res.result.session.result.charactersUnlocked : null);
      announceResult(res.result.session.result);
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
          announceResult(res.result);
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
      else if (typeof opts.onCancel === "function") opts.onCancel();
      return;
    }
    if (d.open) d.close();
    d.className = "q-dialog" + (opts.className ? " " + opts.className : "");
    d.setAttribute("aria-label", opts.title || "Confirmar");
    var body = opts.html ? opts.html : '<p>' + esc(opts.text || "") + "</p>";
    var cancelButton = opts.hideCancel ? "" : '<button class="q-btn q-btn--ghost q-btn--sm" type="button" data-dialog-cancel>' + esc(opts.cancelLabel || "Cancelar") + "</button>";
    var extra = opts.extraHref ? '<a class="q-btn q-btn--ghost q-btn--sm" href="' + esc(opts.extraHref) + '">' + esc(opts.extraLabel || "Ver más") + "</a>" : "";
    d.innerHTML = '<h2>' + esc(opts.title || "Confirmar") + "</h2>" + body +
      '<div class="q-dialog-actions">' + extra + cancelButton + '<button class="q-btn ' + (opts.tone === "danger" ? "q-btn--danger" : "") + ' q-btn--sm" type="button" data-dialog-confirm>' + esc(opts.confirmLabel || "Confirmar") + "</button></div>";
    var cancel = d.querySelector("[data-dialog-cancel]");
    var confirm = d.querySelector("[data-dialog-confirm]");
    if (cancel) cancel.addEventListener("click", function () {
      d.close();
      if (typeof opts.onCancel === "function") opts.onCancel();
    });
    if (confirm) confirm.addEventListener("click", function () {
      d.close();
      if (typeof opts.onConfirm === "function") {
        try { opts.onConfirm(); } catch (e) { toast(e.message || "No se pudo completar la acción.", "error"); }
      } else if (typeof opts.onCancel === "function") opts.onCancel();
    });
    d.showModal();
    if (cancel) U.focusElement(cancel);
  }

  function purchasePreviewMarkup(options) {
    var kind = options.kind;
    var art = kind === "character"
      ? charArt(options.id, { thumb: true, outfit: {} })
      : Art.mannequin(options.id);
    var meta = options.rarityMeta;
    return '<div class="q-dialog-purchase q-rarity--' + options.rarity + '"><div class="q-dialog-purchase-art">' + art + "</div><div class=\"q-dialog-purchase-info\"><span class=\"q-kicker\">" + (kind === "character" ? "Personaje" : "Cosmético") + "</span><h3>" + esc(options.name) + "</h3><p>" + esc(options.description || "") + "</p>" +
      '<div class="q-dialog-tags"><span class="q-rarity-chip" style="--rarity-color:' + meta.color + ';--rarity-soft:' + meta.soft + '"><i></i>' + esc(meta.label) + "</span><span class=\"q-chip\">" + esc(options.category || "Colección") + "</span></div>" +
      '<div class="q-dialog-price"><span>Precio</span><b>' + fmt(options.price) + " " + icon("coins", 13) + '</b></div><div class="q-dialog-balance"><span>Saldo después de la compra</span><b>' + fmt(state.coins - options.price) + " monedas</b></div>" +
      '<p class="q-xs q-muted">La compra se registra una sola vez. No se puede repetir ni deshacer desde la tienda.</p></div></div>';
  }

  function confirmPurchase(kind, id) {
    var isCharacter = kind === "character";
    var item = isCharacter ? Chars.byId(id) : Chars.cosmeticById(id);
    if (!item) return toast("Ese objeto no existe en el catálogo.", "error");
    var status = isCharacter ? Collection.characterStatus(state, item) : Collection.cosmeticStatus(state, item);
    if (status.owned) return toast("Ya posees este objeto. La compra no se repite.", "warn");
    if (!status.canPurchase) {
      openDialog({
        title: isCharacter ? "Personaje bloqueado" : "Objeto bloqueado",
        html: '<p>' + esc(item.name) + " no está disponible para comprar ahora mismo.</p>" + requirementMarkup(status.requirements) +
          '<p class="q-xs q-muted">' + esc(status.reason) + "</p>",
        confirmLabel: "Entendido",
        hideCancel: true
      });
      return;
    }
    if (state.coins < status.price) {
      openDialog({
        title: "Saldo insuficiente",
        html: '<p>Necesitas <b>' + fmt(status.price) + " monedas</b> y tienes <b>" + fmt(state.coins) + "</b>.</p><p>Te faltan <b>" + fmt(status.price - state.coins) + "</b>. Las monedas se ganan respondiendo preguntas y completando sesiones, no abriendo la tienda.</p>",
        confirmLabel: "Entendido",
        hideCancel: true,
        extraHref: "#/mapa",
        extraLabel: "Ir a misiones"
      });
      return;
    }
    var options = {
      kind: kind,
      id: id,
      name: item.name,
      description: isCharacter ? item.description : item.description,
      rarity: item.rarity,
      rarityMeta: item.rarityMeta,
      price: status.price,
      category: isCharacter ? item.personalityMeta.label : (Chars.slotMeta(item.category) || {}).label
    };
    openDialog({
      title: isCharacter ? "Comprar personaje" : "Comprar cosmético",
      html: purchasePreviewMarkup(options),
      confirmLabel: "Comprar por " + fmt(status.price),
      onConfirm: function () {
        var res = commit(function (draft, ctx) {
          return isCharacter ? Collection.purchaseCharacter(draft, id, U.nowISO(ctx.now)) : Collection.purchaseCosmetic(draft, id, U.nowISO(ctx.now));
        });
        if (!res) return;
        sfx("buy");
        toast(isCharacter ? item.name + " se unió a tu colección." : "«" + item.name + "» añadido al inventario.", "success");
        if (isCharacter) showUnlockDialog(item, false);
        else render();
      }
    });
  }

  function showUnlockDialog(character, fromReward) {
    if (!character) return;
    var equipped = equippedOf(character.id);
    window.setTimeout(function () { sfx(fromReward ? "unlock" : "levelup"); }, 240);
    openDialog({
      title: fromReward ? "Personaje desbloqueado" : "Nuevo personaje",
      className: "q-dialog--unlock",
      html: '<div class="q-unlock q-rarity--' + character.rarity + '">' + sceneFor(character, { variant: "unlock", accent2: character.rarityMeta.color }) + '<span class="q-unlock-rays" aria-hidden="true"></span><div class="q-unlock-art">' + charArt(character.id, { state: "unlock", outfit: equipped }) + "</div><div class=\"q-unlock-copy\"><span class=\"q-kicker\">" + (fromReward ? "Recompensa de recorrido" : "Compra confirmada") + "</span><h3>" + esc(character.name) + "</h3><p class=\"q-unlock-title\">" + esc(character.title) + "</p>" + rarityChip(character) + '<p class="q-unlock-line">“' + esc(Reactions.unlockMessage(character.id)) + "”</p>" +
        '<p class="q-xs q-muted">Ya está en tu colección. Puedes seleccionarlo ahora o mantener tu personaje actual.</p></div></div>',
      confirmLabel: "Seleccionar ahora",
      cancelLabel: "Ver después",
      onConfirm: function () {
        var previousId = selectedCharacterId();
        var res = commit(function (draft) { return Collection.selectCharacter(draft, character.id); });
        if (!res) return;
        toast(character.name + " es ahora tu personaje activo.", "success");
        var targetHash = "#/personaje/" + encodeURIComponent(character.id);
        var currentHash = "#/personaje/" + encodeURIComponent(route.id || "");
        var navigates = (route.name === "characters" || route.name === "customize") && targetHash !== currentHash;
        if (navigates) {
          // Navegación interna por hash: el render posterior conserva el documento.
          location.hash = targetHash;
        } else if (route.name === "characters") {
          refreshCharactersOwnership(previousId);
        } else if (route.name === "result") {
          refreshResultSelection(previousId);
        } else if (route.name === "shop") {
          refreshShopOwnership("character", character.id);
        } else {
          render();
        }
        flushUnlocks();
      },
      onCancel: function () {
        if (route.name === "characters") refreshCharactersOwnership(selectedCharacterId());
        else if (route.name === "shop") refreshShopOwnership("character", character.id);
        else syncChrome();
        flushUnlocks();
      }
    });
  }

  function queueUnlocks(list) {
    if (!list || !list.length) return;
    ui.unlockDialogQueue = list.map(function (entry) { return entry.id || entry; }).filter(function (id) { return !!Chars.byId(id); });
  }

  function flushUnlocks() {
    if (!ui.unlockDialogQueue.length) return;
    var dialog = qs("#q-dialog");
    if (dialog && dialog.open) return;
    var id = ui.unlockDialogQueue.shift();
    showUnlockDialog(Chars.byId(id), true);
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
  function moveCharFocus(delta) {
    var rows = Collection.filterCharacters(state, { filter: ui.charFilter, rarity: ui.charRarity, sort: ui.charSort });
    if (!rows.length) return;
    var index = 0;
    rows.forEach(function (row, i) { if (row.character.id === ui.charFocusId) index = i; });
    index = (index + delta + rows.length) % rows.length;
    var nextId = rows[index].character.id;
    if (nextId === ui.charFocusId) return;
    ui.charFocusId = nextId;
    ui.charPreviewState = "";
    if (route.name !== "characters" || !refreshCharactersFocus()) render();
  }

  function uiSound(action) {
    var map = {
      "char-filter": "click", "char-rarity": "click", "char-sort": "click", "char-focus": "select",
      "char-prev": "hover", "char-next": "hover", "select-character": "confirm",
      "inv-focus": "click", "inv-category": "click", "inv-ownership": "click", "inv-sort": "click",
      "custom-slot": "click", "custom-equip": "equip", "custom-clear": "unequip",
      "save-outfit": "confirm", "discard-outfit": "click", "restore-outfit": "select",
      "equip-cosmetic": "equip", "unequip-cosmetic": "unequip", "buy-character": "click", "buy-cosmetic": "click",
      "preview-state": "select", "start-mission": "confirm", "start-mode": "confirm", "retry": "confirm",
      "next": "click", "skip": "click", "abandon": "click", "select-duration": "click",
      "toggle-setting": "toggle", "toggle-pref": "toggle", "toggle-audio": "toggle", "test-audio": "select",
      "save-name": "confirm", "export": "confirm", "import-trigger": "click", "reset": "click",
      "verify-content": "confirm", "shop-tab": "click", "shop-rarity": "click", "shop-category": "click",
      "errors-filter": "click", "achievements-filter": "click", "ranking-tab": "click"
    };
    if (map[action]) sfx(map[action]);
  }

  function handleClick(event) {
    var study = event.target.closest("[data-study-sheet]");
    if (study) recordStudyOpen(study.getAttribute("data-question-id"), study.getAttribute("data-study-sheet"));
    var target = event.target.closest("[data-action]");
    if (!target) return;
    var action = target.getAttribute("data-action");
    if (action !== "answer") uiSound(action);
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
    if (action === "char-filter") {
      ui.charFilter = target.getAttribute("data-filter") || "all";
      ui.charFocusId = "";
      render();
      return;
    }
    if (action === "char-rarity") {
      ui.charRarity = target.getAttribute("data-rarity") || "all";
      ui.charFocusId = "";
      render();
      return;
    }
    if (action === "char-sort") { ui.charSort = target.getAttribute("data-sort") || "rarity"; render(); return; }
    if (action === "char-focus") {
      var nextFocusId = target.getAttribute("data-character") || "";
      if (!nextFocusId || nextFocusId === ui.charFocusId) return;
      ui.charFocusId = nextFocusId;
      ui.charPreviewState = "";
      if (route.name !== "characters" || !refreshCharactersFocus()) render();
      return;
    }
    if (action === "char-prev") { moveCharFocus(-1); return; }
    if (action === "char-next") { moveCharFocus(1); return; }
    if (action === "select-character") {
      var selectId = target.getAttribute("data-character");
      var selectCharacter = Chars.byId(selectId);
      if (!selectCharacter) return;
      var previousSelected = selectedCharacterId();
      if (selectId === previousSelected) {
        toast(selectCharacter.name + " ya es tu personaje activo.", "success");
        return;
      }
      var selectRes = commit(function (draft) { return Collection.selectCharacter(draft, selectId); });
      if (!selectRes) return;
      var applied = false;
      if (route.name === "characters") {
        var focusChanged = ui.charFocusId && ui.charFocusId !== selectId;
        ui.charFocusId = selectId;
        if (focusChanged) {
          applied = refreshCharactersFocus();
          if (applied) {
            flashElement(qs("[data-hero-chip]"), "q-sel-pulse");
            announce("Ahora juegas con " + selectCharacter.name + ", rareza " + selectCharacter.rarityLabel + ".");
          }
        } else {
          applied = refreshCharactersSelection(previousSelected);
        }
      } else if (route.name === "result") {
        applied = refreshResultSelection(previousSelected);
      }
      toast(selectCharacter.name + " es ahora tu personaje activo.", "success");
      if (!applied) render();
      return;
    }
    if (action === "buy-character") { confirmPurchase("character", target.getAttribute("data-character")); return; }
    if (action === "buy-cosmetic") { confirmPurchase("cosmetic", target.getAttribute("data-cosmetic")); return; }
    if (action === "preview-state") {
      var wanted = target.getAttribute("data-state") || "victory";
      ui.charPreviewState = ui.charPreviewState === wanted ? "" : wanted;
      if (route.name === "characters" && refreshCharactersPreview()) return;
      render();
      return;
    }
    if (action === "inv-focus") {
      var focusId = target.getAttribute("data-cosmetic") || "";
      ui.invFocusId = focusId;
      var focusItem = Chars.cosmeticById(focusId);
      if (focusItem && (route.name === "inventory" || route.name === "customize")) {
        var focusCharacter = equipmentCharacter(route.id);
        if (Collection.ownsCosmetic(state, focusId) && focusCharacter && !compatibilityReason(focusCharacter, focusItem)) {
          var focusDraft = currentDraft(focusCharacter);
          focusDraft.equipped[focusItem.category] = focusItem.id;
          ui.customSlot = focusItem.category;
        }
      }
      render();
      return;
    }
    if (action === "inv-ownership") { ui.invOwnership = target.getAttribute("data-filter") || "all"; ui.invFocusId = ""; render(); return; }
    if (action === "inv-category") {
      ui.invCategory = target.getAttribute("data-category") || "all";
      if (ui.invCategory !== "all") ui.customSlot = ui.invCategory;
      ui.invFocusId = "";
      render();
      return;
    }
    if (action === "inv-sort") { ui.invSort = target.getAttribute("data-sort") || "rarity"; render(); return; }
    if (action === "equip-cosmetic") {
      var equipId = target.getAttribute("data-cosmetic");
      var equipRes = commit(function (draft) {
        return Collection.equipCosmetic(draft, selectedCharacterId(), equipId);
      });
      if (equipRes) {
        var equippedItem = Chars.cosmeticById(equipId);
        toast("«" + equippedItem.name + "» equipado en " + selectedCharacter().name + ".", "success");
        render();
      }
      return;
    }
    if (action === "unequip-cosmetic") {
      var slotId = target.getAttribute("data-slot");
      var unequipRes = commit(function (draft) {
        return Collection.unequipCosmetic(draft, selectedCharacterId(), slotId);
      });
      if (unequipRes) { toast("Objeto desequipado.", "success"); render(); }
      return;
    }
    if (action === "shop-tab") { ui.shopTab = target.getAttribute("data-tab") || "featured"; render(); return; }
    if (action === "shop-rarity") { ui.shopRarity = target.getAttribute("data-rarity") || "all"; render(); return; }
    if (action === "shop-category") { ui.shopCategory = target.getAttribute("data-category") || "all"; render(); return; }
    if (action === "custom-slot") {
      ui.customSlot = target.getAttribute("data-slot") || "cabeza";
      ui.invCategory = ui.customSlot;
      ui.invFocusId = "";
      render();
      return;
    }
    if (action === "custom-equip") {
      var customId = target.getAttribute("data-cosmetic");
      var customItem = Chars.cosmeticById(customId);
      var customCharacter = equipmentCharacter(route.id);
      if (customItem && customCharacter) {
        var draft = currentDraft(customCharacter);
        draft.equipped[customItem.category] = customItem.id;
        ui.customSlot = customItem.category;
        render();
      }
      return;
    }
    if (action === "custom-clear") {
      var clearCharacter = equipmentCharacter(route.id);
      if (clearCharacter) {
        var clearDraft = currentDraft(clearCharacter);
        delete clearDraft.equipped[ui.customSlot];
        render();
      }
      return;
    }
    if (action === "save-outfit") {
      var saveCharacter = equipmentCharacter(route.id);
      if (!saveCharacter) return;
      var saveDraft = currentDraft(saveCharacter);
      var saveRes = commit(function (d, ctx) {
        return Collection.setOutfit(d, saveCharacter.id, saveDraft.equipped, U.nowISO(ctx.now));
      });
      if (saveRes) {
        ui.customDraft = null;
        sfx("confirm");
        toast("Atuendo de " + saveCharacter.name + " guardado.", "success");
        render();
      }
      return;
    }
    if (action === "discard-outfit") {
      var discardCharacter = equipmentCharacter(route.id);
      ui.customDraft = null;
      if (discardCharacter) toast("Cambios descartados. Se conserva el atuendo guardado.", "warn");
      render();
      return;
    }
    if (action === "restore-outfit") {
      var restoreCharacter = equipmentCharacter(route.id);
      if (!restoreCharacter) return;
      var restoreRes = commit(function (d, ctx) {
        return Collection.restorePreviousOutfit(d, restoreCharacter.id, U.nowISO(ctx.now));
      });
      if (restoreRes) {
        ui.customDraft = null;
        sfx("select");
        toast("Atuendo anterior restaurado.", "success");
        render();
      }
      return;
    }
    if (action === "toggle-audio") {
      var nextMuted = !audioPrefs().muted;
      if (setAudioPatch({ muted: nextMuted })) {
        if (!nextMuted) { Audio.unlock(); sfx("toggle"); }
        toast(nextMuted ? "Audio silenciado." : "Audio activado.", nextMuted ? "warn" : "success");
      }
      return;
    }
    if (action === "test-audio") {
      Audio.unlock();
      sfx("select", { force: true });
      window.setTimeout(function () { sfx("correct", { force: true }); }, 180);
      toast("Prueba de sonido reproducida.", "success");
      return;
    }
    if (action === "select-duration") { ui.timedSeconds = Number(target.getAttribute("data-seconds")) || 300; render(); return; }
    if (action === "errors-filter") { ui.errorFilter = target.getAttribute("data-filter") || "due"; render(); return; }
    if (action === "achievements-filter") { ui.achievementFilter = target.getAttribute("data-filter") || "all"; render(); return; }
    if (action === "ranking-tab") { ui.rankingTab = target.getAttribute("data-tab") || "sessions"; render(); return; }
    if (action === "toggle-setting") { toggleSetting(target.getAttribute("data-setting")); return; }
    if (action === "toggle-pref") { togglePresentationPref(target.getAttribute("data-group"), target.getAttribute("data-pref")); return; }
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
    if (route.name === "characters" && !event.altKey) {
      if (event.key === "ArrowRight") { event.preventDefault(); moveCharFocus(1); return; }
      if (event.key === "ArrowLeft") { event.preventDefault(); moveCharFocus(-1); return; }
    }
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

  function togglePresentationPref(group, key) {
    if (!group || !key) return;
    if (!state.presentation || !state.presentation[group] || state.presentation[group][key] === undefined) return;
    var res = commit(function (draft) {
      draft.presentation[group][key] = !draft.presentation[group][key];
      return draft.presentation[group][key];
    });
    if (!res) return;
    applySettings();
    render();
    toast("Preferencia de presentación actualizada.", "success");
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
    var prefs = state.presentation || {};
    var animation = prefs.animationPreferences || {};
    var visual = prefs.visualPreferences || {};
    document.documentElement.classList.toggle("q-no-idle", animation.idle === false);
    document.documentElement.classList.toggle("q-no-reactions", animation.reactions === false);
    document.documentElement.classList.toggle("q-no-frames", visual.rarityFrames === false);
    document.documentElement.classList.toggle("q-no-particles", visual.particles === false);
    if (state.settings.reducedMotion) {
      qsa("[data-parallax]").forEach(function (host) {
        var scene = qs(".q-scene-svg", host);
        var figure = qs(".q-hero-figure, .q-heroes-figure, .q-equip-figure", host);
        if (scene) scene.style.transform = "";
        if (figure) figure.style.transform = "";
      });
    }
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
      if (fin) {
        queueUnlocks(fin.result && fin.result.charactersUnlocked);
        announceResult(fin.result);
        location.hash = "#/resultado/" + encodeURIComponent(fin.result.id);
      }
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
    bindAudioVolumes();
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
