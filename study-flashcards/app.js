/* Study Flashcards — sesiones, mazos y recuperación activa */
(function () {
  "use strict";

  var C = window.STUDY_CONTENT;
  var UI = window.StudyUI;
  var Store = window.StudyStore;
  var TAX = window.StudyTaxonomy;
  var esc = UI.escapeHTML;
  var icon = UI.icon;
  var qs = UI.qs;
  var qsa = UI.qsa;

  var root = qs("#view-root");
  var boot = qs("#boot");
  var live = qs("#live");
  var main = qs("#main");
  var ORIGIN_KEY = "study-flash-origin-v1";

  var MODES = {
    free: {
      label: "Estudio libre", short: "Libre", icon: "cards",
      description: "Recorre el mazo completo a tu ritmo, sin límite de tarjetas."
    },
    quick: {
      label: "Repaso rápido", short: "Repaso", icon: "rotate",
      description: "Tarjetas nuevas y las que ya toca volver a ver, en una sesión corta."
    },
    exam: {
      label: "Examen", short: "Examen", icon: "target",
      description: "Solo opción múltiple y aplicación. El resultado y las explicaciones aparecen al final."
    },
    errors: {
      label: "Errores", short: "Errores", icon: "alert",
      description: "Vuelve únicamente a las tarjetas que fallaste o que necesitan refuerzo."
    }
  };
  var TYPE_LABEL = { concept: "Concepto", multiple: "Opción múltiple", application: "Aplicación" };
  var RATINGS = [
    { id: "again", label: "Otra vez", hint: "Volver a intentarlo", cls: "is-again" },
    { id: "hard", label: "Difícil", hint: "Me costó recordarlo", cls: "is-hard" },
    { id: "good", label: "Bien", hint: "Lo recordé", cls: "is-good" },
    { id: "easy", label: "Fácil", hint: "Lo domino", cls: "is-easy" }
  ];

  var state = {
    route: { name: "decks" },
    summary: null,
    selected: null,
    revealed: false,
    returnSheet: "",
    fromDashboard: false,
    borrowedDeck: "",
    currentDeck: null,
    currentDeckType: "",
    notice: ""
  };

  function sheetHref() { return ""; }
  function deckHref(id) { return "#/mazo/" + encodeURIComponent(id); }
  function dashboardHref(sheetId, deckId) {
    try {
      var u = new URL("../study-dashboard/index.html", location.href);
      if (sheetId) u.searchParams.set("sheet", sheetId);
      u.searchParams.set("from", "flashcards");
      if (deckId) u.searchParams.set("deck", deckId);
      return u.href;
    } catch (e) { return "../study-dashboard/index.html"; }
  }
  function readOrigin() {
    try {
      var raw = sessionStorage.getItem(ORIGIN_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      return o && typeof o === "object" ? o : null;
    } catch (e) { return null; }
  }
  function rememberOrigin(sheet, deck) {
    try { sessionStorage.setItem(ORIGIN_KEY, JSON.stringify({ sheet: sheet || "", deck: deck || "" })); } catch (e) {}
  }
  function cleanHash() {
    try { history.replaceState(null, "", location.pathname + (location.hash || "#/")); } catch (e) {}
  }
  function replaceHash(hash) {
    try { history.replaceState(null, "", location.pathname + hash); } catch (e) { location.hash = hash; }
  }
  function parseRoute() {
    var raw = location.hash.replace(/^#\/?/, "");
    if (!raw) return { name: "decks" };
    var parts = raw.split("/").filter(Boolean).map(function (p) {
      try { return decodeURIComponent(p); } catch (e) { return p; }
    });
    if (parts[0] === "mazo" && parts[1]) return { name: "deck", deckId: parts[1] };
    if (parts[0] === "sesion") return { name: "session" };
    if (parts[0] === "resumen") return { name: "summary" };
    if (parts[0] === "historial") return { name: "history" };
    return { name: "notfound" };
  }
  function plural(n, one, many) { return UI.plural(n, one, many); }
  function primaryAreas() {
    return TAX && TAX.primaryAreas().length ? TAX.primaryAreas() : C.areas;
  }
  function categoriesOf(areaId) {
    return TAX ? TAX.categoriesForArea(areaId) : [];
  }
  function areaForTopic(topic) {
    if (!topic) return null;
    return TAX ? TAX.area(topic.primaryAreaId || topic.areaId) : Store.getArea(topic.areaId);
  }
  function categoryForSheet(sheet) {
    return sheet && TAX ? TAX.categoryForSheet(sheet) : null;
  }
  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function announce(text) {
    if (!live) return;
    live.textContent = "";
    setTimeout(function () { live.textContent = text; }, 40);
  }
  function modeMeta(id) { return MODES[id] || MODES.free; }
  function deckInfo(deckId) {
    var sheet = Store.getSheet(deckId);
    if (sheet) {
      return { kind: "sheet", id: sheet.id, title: sheet.title, summary: sheet.summary, sheet: sheet, topic: Store.getTopic(sheet.topicId) };
    }
    var topic = Store.getTopic(deckId);
    if (topic) {
      return { kind: "topic", id: topic.id, title: topic.title, summary: topic.summary, sheet: null, topic: topic };
    }
    console.warn("StudyFlashcards: mazo no encontrado", deckId);
    return { kind: "missing", id: deckId, title: "Mazo", summary: "", sheet: null, topic: null };
  }
  function cardsFor(deckId) {
    var deck = deckInfo(deckId);
    if (deck.kind === "sheet") return C.cards.filter(function (c) { return c.sheetId === deckId; });
    if (deck.kind === "topic") return C.cards.filter(function (c) { return c.topicId === deckId; });
    return [];
  }
  function currentSession() { return Store.getFlashSession(); }
  function currentCard(session) {
    if (!session || !session.queue) return null;
    return Store.getCard(session.queue[session.index]);
  }
  function answerFor(session, cardId) {
    return session && session.answers ? session.answers[cardId] || null : null;
  }
  function accuracyFor(cardId) {
    var st = Store.getCardState(cardId);
    if (!st || (!st.correct && !st.wrong)) return null;
    return Math.round((st.correct / (st.correct + st.wrong)) * 100);
  }
  function overallAccuracy() {
    var cards = Store.getState().cards || {};
    var c = 0, w = 0;
    Object.keys(cards).forEach(function (id) {
      c += cards[id].correct || 0;
      w += cards[id].wrong || 0;
    });
    return c + w ? Math.round((c / (c + w)) * 100) : 0;
  }
  function firstSheetFor(topicId) {
    var sheets = C.sheets.filter(function (s) { return s.topicId === topicId; });
    return sheets[0] || null;
  }
  function originSheetFor(topicId) {
    if (state.returnSheet) {
      var sh = Store.getSheet(state.returnSheet);
      if (sh && sh.topicId === topicId) return sh;
    }
    return firstSheetFor(topicId);
  }
  function statusOf(cardId) {
    var st = Store.getCardState(cardId);
    if (!st || !st.reviews) return { label: "Nueva", cls: "is-new", due: "Sin revisar" };
    if (st.lastResult === "again" || st.lapses > 0) return { label: "Con error", cls: "is-error", due: UI.dueLabel(st.dueAt) };
    if ((st.box || 0) >= 4) return { label: "Dominada", cls: "is-mastered", due: UI.dueLabel(st.dueAt) };
    if (Store.getDueCards().some(function (c) { return c.id === cardId; })) return { label: "Para repasar", cls: "is-due", due: "Hoy" };
    return { label: "Programada", cls: "is-scheduled", due: UI.dueLabel(st.dueAt) };
  }

  /* ------------------------------------------------------------------ */
  /* Construcción de sesiones                                            */
  /* ------------------------------------------------------------------ */

  function buildQueue(mode, deckId) {
    var cards = cardsFor(deckId);
    if (mode === "free") return cards;
    if (mode === "quick") return Store.getDueCards(deckId).slice(0, 20);
    if (mode === "exam") return shuffle(cards.filter(function (c) { return c.type === "multiple" || c.type === "application"; })).slice(0, 20);
    if (mode === "errors") return Store.getErrorCards(deckId);
    return [];
  }

  function createSession(mode, deckId, opts) {
    opts = opts || {};
    var built = buildQueue(mode, deckId);
    if (!built.length) {
      if (!opts.silent) {
        var reason = mode === "quick" ? "No hay tarjetas pendientes en este mazo." :
          mode === "errors" ? "Todavía no hay errores registrados en este mazo." :
          mode === "exam" ? "Este mazo no tiene tarjetas de examen." : "Este mazo no tiene tarjetas.";
        UI.toast(reason);
      }
      return null;
    }
    var session = Store.startSession(mode, deckId, built.map(function (c) { return c.id; }));
    if (!session) {
      if (!opts.silent) UI.toast("Ese mazo no está disponible.");
      return null;
    }
    state.summary = null;
    state.selected = null;
    state.revealed = false;
    if (!opts.silent) {
      if (location.hash === "#/sesion") renderRoute({ scrollY: 0 });
      else location.hash = "#/sesion";
    }
    return session;
  }

  function startSession(mode, deckId) {
    var deck = deckInfo(deckId);
    if (deck.kind === "missing") { UI.toast("Ese mazo no está disponible."); return; }
    var active = Store.getFlashSession();
    if (active && active.deckId === deckId) {
      /* La sesión anterior ya guardó sus respuestas y su programación. */
      UI.toast("Nueva sesión en este mazo.");
    }
    createSession(mode, deckId);
  }

  function advanceSession() {
    var s = Store.getFlashSession();
    if (!s) { location.hash = "#/"; return; }
    var next = s.index + 1;
    if (next >= s.queue.length) {
      finishCurrentSession();
      return;
    }
    Store.updateFlashSession({ index: next });
    state.selected = null;
    state.revealed = false;
    renderRoute({ scrollY: 0 });
  }

  function finishCurrentSession() {
    var s = Store.getFlashSession();
    if (!s) return;
    state.summary = Store.finishSession();
    state.selected = null;
    state.revealed = false;
    if (!state.summary) {
      UI.toast("Sesión cerrada sin respuestas. No se guardó en el historial.");
      if (s.deckId) location.hash = "#/mazo/" + encodeURIComponent(s.deckId);
      else location.hash = "#/";
      return;
    }
    document.title = "Resumen de la sesión · Study Flashcards";
    if (location.hash === "#/resumen") renderRoute({ scrollY: 0 });
    else location.hash = "#/resumen";
  }

  /* ------------------------------------------------------------------ */
  /* Arranque y routing                                                  */
  /* ------------------------------------------------------------------ */

  function showError(message) {
    boot.hidden = true;
    root.hidden = false;
    root.innerHTML = '<section class="flash-error">' + UI.emptyState({
      icon: "alert",
      title: "No se pudo cargar Study Flashcards",
      text: message || "Revisa que los archivos compartidos estén disponibles y vuelve a intentarlo.",
      actions: '<button class="s-btn" type="button" data-action="retry">' + icon("rotate", 16) + ' Volver a intentar</button><a class="s-btn s-btn--ghost" href="../index.html">Ir al HUB</a>'
    }) + '</section>';
  }
  function showEmptyContent() {
    boot.hidden = true;
    root.hidden = false;
    root.innerHTML = UI.emptyState({
      icon: "cards",
      title: "Todavía no hay tarjetas disponibles",
      text: "El temario compartido no tiene mazos para practicar. Puedes volver al HUB o abrir Study Dashboard para revisar las fichas.",
      actions: '<a class="s-btn" href="../study-dashboard/index.html">Abrir Study Dashboard</a><a class="s-btn s-btn--ghost" href="../index.html">Volver al HUB</a>'
    });
  }
  function mountStaticIcons() {
    qsa("[data-icon]").forEach(function (el) {
      el.innerHTML = icon(el.getAttribute("data-icon"), Number(el.getAttribute("data-size")) || 18);
    });
  }
  function setActiveNav() {
    var route = state.route;
    qsa(".s-navlink").forEach(function (a) {
      var r = a.getAttribute("data-route");
      var active = r === route.name ||
        (r === "decks" && route.name === "deck") ||
        (r === "session" && (route.name === "session" || route.name === "summary"));
      if (active) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    var navSession = qs("#nav-session");
    if (navSession) navSession.hidden = !Store.getFlashSession();
  }

  function renderRoute(opts) {
    opts = opts || {};
    var route = parseRoute();
    var previous = state.route;
    state.route = route;
    if (route.name !== "session" && previous.name !== "session") state.revealed = false;
    if (route.name !== "session") state.revealed = false;
    setActiveNav();
    state.currentDeck = null;
    state.currentDeckType = "";

    if (route.name === "decks") {
      document.title = "Study Flashcards · SERUMS";
      root.innerHTML = renderDecks();
    } else if (route.name === "deck") {
      var deck = deckInfo(route.deckId);
      state.currentDeck = deck;
      state.currentDeckType = deck.kind;
      if (deck.kind === "missing") {
        document.title = "Mazo no encontrado · Study Flashcards";
        root.innerHTML = renderNotFound("Este mazo no está disponible", "El enlace puede estar incompleto o el contenido puede haber cambiado. Prueba con otro mazo.");
      } else {
        document.title = deck.title + " · Study Flashcards";
        root.innerHTML = renderDeck(deck);
      }
    } else if (route.name === "session") {
      var session = currentSession();
      var sessionDeck = session ? deckInfo(session.deckId) : null;
      state.currentDeck = sessionDeck;
      state.currentDeckType = sessionDeck ? sessionDeck.kind : "";
      document.title = "Sesión · Study Flashcards";
      root.innerHTML = renderSession();
    } else if (route.name === "summary") {
      var summaryDeck = state.summary ? deckInfo(state.summary.deckId) : null;
      state.currentDeck = summaryDeck;
      state.currentDeckType = summaryDeck ? summaryDeck.kind : "";
      document.title = "Resumen de la sesión · Study Flashcards";
      root.innerHTML = renderSummary();
    } else if (route.name === "history") {
      document.title = "Historial · Study Flashcards";
      root.innerHTML = renderHistory();
    } else {
      document.title = "Página no encontrada · Study Flashcards";
      root.innerHTML = renderNotFound("No encontramos esta página", "El enlace puede estar incompleto. Vuelve a los mazos o revisa tu historial.");
    }

    boot.hidden = true;
    root.hidden = false;
    var y = opts.scrollY != null ? opts.scrollY : 0;
    requestAnimationFrame(function () { window.scrollTo(0, Math.max(0, y)); });
    if (opts.focus) {
      var h = root.querySelector("h1");
      if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
      else main.focus({ preventScroll: true });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Mazos: inicio                                                       */
  /* ------------------------------------------------------------------ */

  function deckTotals() {
    var st = Store.getDashboardStats();
    var cards = Store.getState().cards || {};
    var errors = Store.getErrorCards();
    return {
      total: st.totalCards,
      reviewed: st.reviewedCards,
      mastered: st.masteredCards,
      due: st.dueCards,
      newCards: st.newCards,
      errors: errors.length,
      accuracy: overallAccuracy()
    };
  }

  function modeExplainer() {
    return '<div class="mode-grid">' + Object.keys(MODES).map(function (key, i) {
      var m = MODES[key];
      return '<div class="mode-card">' +
        '<span class="mode-number">0' + (i + 1) + '</span>' +
        '<span class="mode-icon">' + icon(m.icon, 19) + '</span>' +
        '<h3>' + esc(m.label) + '</h3><p>' + esc(m.description) + '</p></div>';
    }).join("") + '</div>';
  }

  function activeSessionBanner(session) {
    if (!session) return "";
    var deck = state.currentDeck && state.currentDeck.id === session.deckId ? state.currentDeck : deckInfo(session.deckId);
    var m = modeMeta(session.mode);
    var done = session.index;
    var total = session.queue.length;
    var pct = total ? Math.round((done / total) * 100) : 0;
    return '<a class="active-session" href="#/sesion" data-nav>' +
      '<span class="active-session-icon">' + icon("play", 18) + '</span>' +
      '<span class="active-session-copy"><span class="s-kicker">Sesión en curso · ' + esc(m.short) + '</span>' +
        '<b>' + esc(deck.title) + '</b>' +
        '<small>' + (done + 1) + ' de ' + total + ' · continúa donde quedaste</small>' +
        UI.progressBar(pct, "Avance de la sesión") +
      '</span>' +
      '<span class="s-btn s-btn--sm">Continuar ' + icon("arrow", 14) + '</span>' +
      '</a>';
  }

  function deckCard(sheet) {
    var topic = Store.getTopic(sheet.topicId);
    var area = topic ? areaForTopic(topic) : null;
    var category = categoryForSheet(sheet);
    var stats = Store.getDeckStats(sheet.id);
    var active = Store.getFlashSession(sheet.id);
    var last = stats.lastReviewAt ? UI.formatRelative(stats.lastReviewAt) : "Sin practicar";
    return '<article class="deck-card" style="--area:' + esc(area ? area.accent : "var(--accent)") + '">' +
      '<a class="deck-card-head" href="' + deckHref(sheet.id) + '" data-nav>' +
        '<span class="deck-card-top"><span class="deck-area-label">' + esc(category ? category.short : area ? area.short : "") + '</span>' +
          (active ? '<span class="s-chip s-chip--accent">' + icon("play", 11) + 'En curso</span>' : '') +
        '</span>' +
        '<h3>' + esc(sheet.title) + '</h3>' +
        '<p>' + esc(sheet.summary) + '</p>' +
      '</a>' +
      '<div class="deck-progress">' +
        '<span class="deck-progress-copy"><b>' + stats.percent + '%</b><small>dominio</small></span>' +
        UI.progressBar(stats.percent, "Dominio de " + sheet.title) +
      '</div>' +
      '<div class="deck-stats">' +
        '<span><b>' + stats.total + '</b><small>tarjetas</small></span>' +
        '<span><b>' + stats.newCards + '</b><small>nuevas</small></span>' +
        '<span><b>' + stats.due + '</b><small>por repasar</small></span>' +
        '<span><b>' + stats.errors + '</b><small>con error</small></span>' +
      '</div>' +
      '<div class="deck-card-foot">' +
        '<span class="deck-last">' + esc(last) + '</span>' +
        '<span class="deck-actions"><a href="' + deckHref(sheet.id) + '" data-nav class="s-btn s-btn--ghost s-btn--sm">Abrir</a>' +
        '<button class="s-btn s-btn--sm" type="button" data-action="start-session" data-mode="quick" data-deck="' + esc(sheet.id) + '">' + icon("rotate", 13) + ' Repasar</button></span>' +
      '</div>' +
      '</article>';
  }

  function categoryDeckBlock(category, sheets) {
    if (!sheets.length) return "";
    return '<div class="deck-category">' +
      '<div class="deck-category-head"><span class="s-kicker">' + esc(category.short) + '</span><h3>' + esc(category.title) + '</h3><span class="s-small s-muted">' + sheets.length + ' ' + plural(sheets.length, "mazo", "mazos") + '</span></div>' +
      '<div class="deck-grid">' + sheets.map(deckCard).join("") + '</div>' +
      '</div>';
  }

  function renderDecks() {
    var totals = deckTotals();
    var active = Store.getFlashSession();
    var sheets = C.sheets.filter(function (s) { return cardsFor(s.id).length > 0; });
    var areasHTML = primaryAreas().map(function (area) {
      var areaSheets = sheets.filter(function (s) {
        var topic = Store.getTopic(s.topicId);
        return topic && (topic.primaryAreaId || topic.areaId) === area.id;
      });
      if (!areaSheets.length) return "";
      var source = Store.getSource((area.sourceIds || [])[0]);
      var categoriesHTML = categoriesOf(area.id).map(function (category) {
        return categoryDeckBlock(category, areaSheets.filter(function (s) { return s.categoryId === category.id; }));
      }).join("");
      return '<section class="deck-area" style="--area:' + esc(area.accent) + '">' +
        '<div class="deck-area-head">' +
          '<span class="deck-area-icon">' + icon(area.icon || "cards", 18) + '</span>' +
          '<div><h2>' + esc(area.title) + '</h2><p>' + esc(area.description) + '</p></div>' +
          '<span class="deck-area-meta">' + areaSheets.length + ' ' + plural(areaSheets.length, "mazo", "mazos") + (source ? ' · ' + esc(source.short) : '') + '</span>' +
        '</div>' +
        categoriesHTML +
        '</section>';
    }).join("");

    if (!totals.total) return showEmptyContent();

    return [
      '<section class="flash-hero">',
        '<div class="flash-hero-copy">',
          '<span class="s-kicker"><span class="dot"></span>Recuperación activa</span>',
          '<h1>Recupera<br><em>lo que sabes.</em></h1>',
          '<p>Practica con tarjetas que te obligan a recordar, aplicar y explicar. El repaso se adapta a lo que dominas y a lo que todavía necesita otra vuelta.</p>',
          '<div class="flash-hero-actions">',
            '<a class="s-btn s-btn--lg" href="' + (active ? "#/sesion" : (C.sheets[0] ? deckHref(C.sheets[0].id) : "#/")) + '" data-nav>' + icon("play", 16) + ' ' + (active ? "Continuar sesión" : "Empezar a practicar") + '</a>',
            '<a class="s-btn s-btn--ghost s-btn--lg" href="../study-dashboard/index.html">' + icon("book", 16) + ' Consultar temario</a>',
          '</div>',
          '<div class="flash-stats">',
            '<div><b>' + totals.reviewed + '</b><span>revisadas</span></div>',
            '<div><b>' + totals.mastered + '</b><span>dominadas</span></div>',
            '<div><b>' + totals.due + '</b><span>por repasar</span></div>',
            '<div><b>' + (totals.accuracy || "—") + (totals.accuracy ? "%" : "") + '</b><span>acierto real</span></div>',
          '</div>',
        '</div>',
        '<div class="flash-hero-visual" aria-hidden="true">',
          '<div class="card-stack">',
            '<div class="stack-card stack-card-back"><span>03</span><p>APLICAR</p></div>',
            '<div class="stack-card stack-card-mid"><span>02</span><p>EXPLICAR</p></div>',
            '<div class="stack-card stack-card-front"><span class="stack-tag">CONCEPTO</span><p>¿Por qué la APS no es una atención de segunda categoría?</p><span class="stack-line"></span><span class="stack-line short"></span><span class="stack-mark">' + icon("brain", 22) + '</span></div>',
          '</div>',
          '<span class="hero-visual-note">' + icon("loop", 14) + ' recordar · aplicar · volver</span>',
        '</div>',
      '</section>',
      active ? activeSessionBanner(active) : "",
      '<section class="flash-section">',
        '<div class="flash-section-head"><div><span class="s-kicker"><span class="dot"></span>Cuatro formas</span><h2>Elige cómo practicar</h2></div><span class="s-small s-muted">Sin rachas inventadas. Solo tu actividad.</span></div>',
        modeExplainer(),
      '</section>',
      '<section class="flash-section">',
        '<div class="flash-section-head"><div><span class="s-kicker"><span class="dot"></span>Mazos por área</span><h2>Tu temario, en tarjetas</h2></div><span class="s-small s-muted">' + sheets.length + ' mazos · ' + totals.total + ' tarjetas</span></div>',
        areasHTML,
      '</section>',
      '<section class="flash-quote">',
        '<span>' + icon("brain", 22) + '</span>',
        '<p>La sensación de haber leído no es lo mismo que poder recordarlo. Volver a intentarlo es parte del método.</p>',
      '</section>'
    ].join("");
  }

  /* ------------------------------------------------------------------ */
  /* Vista de mazo                                                       */
  /* ------------------------------------------------------------------ */

  function modeAction(modeKey, deckId) {
    var m = MODES[modeKey];
    var cards = cardsFor(deckId);
    var stats = Store.getDeckStats(deckId);
    var count = 0;
    var disabled = false;
    var note = "";
    if (modeKey === "free") count = stats.total;
    else if (modeKey === "quick") { count = Math.min(20, stats.due + stats.newCards); if (!count) { disabled = true; note = "Nada pendiente"; } }
    else if (modeKey === "exam") { count = Math.min(20, cards.filter(function (c) { return c.type !== "concept"; }).length); if (!count) { disabled = true; note = "Sin tarjetas de examen"; } }
    else if (modeKey === "errors") { count = stats.errors; if (!count) { disabled = true; note = "Sin errores"; } }
    return '<button class="mode-action ' + (disabled ? "is-disabled" : "") + '" type="button" data-action="start-session" data-mode="' + modeKey + '" data-deck="' + esc(deckId) + '"' + (disabled ? ' disabled aria-disabled="true"' : '') + '>' +
      '<span class="mode-action-icon">' + icon(m.icon, 19) + '</span>' +
      '<span class="mode-action-copy"><b>' + esc(m.label) + '</b><small>' + (note || count + ' ' + plural(count, "tarjeta", "tarjetas")) + '</small></span>' +
      icon("arrow", 15) + '</button>';
  }

  function cardListRow(card) {
    var status = statusOf(card.id);
    var st = Store.getCardState(card.id);
    var sheet = Store.getSheet(card.sheetId);
    return '<div class="flash-card-row">' +
      '<span class="flash-card-type">' + icon(card.type === "concept" ? "brain" : card.type === "application" ? "target" : "list", 15) + '</span>' +
      '<span class="flash-card-copy"><b>' + esc(card.prompt) + '</b><small>' + esc(TYPE_LABEL[card.type] || "Tarjeta") + ' · ' + (st ? st.reviews + ' ' + plural(st.reviews, "repaso", "repasos") : 'sin repasos') + ' · ' + esc(status.due) + '</small></span>' +
      '<span class="card-status ' + status.cls + '">' + esc(status.label) + '</span>' +
      (sheet ? '<a class="card-sheet-link" href="' + esc(dashboardHref(sheet.id, sheet.id)) + '" title="Consultar ficha resumen">' + icon("book", 14) + '<span>Ficha</span></a>' : '') +
      '</div>';
  }

  function renderDeck(deck) {
    var area = deck.topic ? areaForTopic(deck.topic) : null;
    var category = deck.kind === "sheet" && deck.sheet ? categoryForSheet(deck.sheet) :
      (deck.topic && TAX ? TAX.categoryForTopic(deck.topic.id) : null);
    var stats = Store.getDeckStats(deck.id);
    var cards = cardsFor(deck.id);
    var active = Store.getFlashSession(deck.id);
    var sheet = deck.kind === "sheet" ? deck.sheet : (deck.topic ? originSheetFor(deck.topic.id) : null);
    var backHref = "#/";
    var backLabel = "Todos los mazos";
    if (state.fromDashboard) {
      backHref = sheet ? dashboardHref(sheet.id, deck.id) : "../study-dashboard/index.html";
      backLabel = sheet ? "Volver a la ficha" : "Volver al dashboard";
    }
    var sessions = (Store.getState().sessions || []).filter(function (s) { return s.deckId === deck.id; }).slice(0, 3);
    var crumb = '<div class="deck-breadcrumb"><span class="deck-area-dot"></span><span>' + esc(area ? area.title : "") + '</span>' + icon("chevronRight", 12) +
      (category ? '<span>' + esc(category.title) + '</span>' + icon("chevronRight", 12) : '') +
      '<span>' + (deck.kind === "sheet" ? "Ficha" : "Mazo") + '</span></div>';

    if (!cards.length) {
      return '<div class="deck-view">' +
        '<a class="flash-back" href="' + esc(backHref) + '"' + (state.fromDashboard ? "" : ' data-nav') + '>' + icon("arrowLeft", 15) + ' ' + esc(backLabel) + '</a>' +
        '<section class="deck-head"><span class="s-kicker">' + esc(category ? category.short : area ? area.short : "") + '</span><h1>' + esc(deck.title) + '</h1><p>' + esc(deck.summary) + '</p></section>' +
        UI.emptyState({
          icon: "cards", title: "Este mazo todavía no tiene tarjetas",
          text: "La ficha resumen sí puede estar disponible. Consulta el temario o elige otro mazo para practicar.",
          actions: '<a class="s-btn" href="' + esc(sheet ? dashboardHref(sheet.id, deck.id) : "../study-dashboard/index.html") + '">Consultar ficha resumen</a><a class="s-btn s-btn--ghost" href="#/" data-nav>Elegir otro mazo</a>'
        }) + '</div>';
    }

    return [
      '<div class="deck-view">',
        '<a class="flash-back" href="' + esc(backHref) + '"' + (state.fromDashboard ? "" : ' data-nav') + '>' + icon("arrowLeft", 15) + ' ' + esc(backLabel) + '</a>',
        '<section class="deck-head" style="--area:' + esc(area ? area.accent : "var(--accent)") + '">',
          crumb,
          '<h1>' + esc(deck.title) + '</h1>',
          '<p>' + esc(deck.summary) + '</p>',
          '<div class="deck-head-meta">',
            '<span class="s-chip">' + icon("cards", 13) + stats.total + ' tarjetas</span>',
            '<span class="s-chip">' + icon("checkCircle", 13) + stats.mastered + ' dominadas</span>',
            '<span class="s-chip">' + icon("rotate", 13) + stats.due + ' por repasar</span>',
            '<span class="s-chip">' + icon("alert", 13) + stats.errors + ' con error</span>',
          '</div>',
          '<div class="deck-head-actions">',
            '<a class="s-btn s-btn--ghost" href="' + esc(sheet ? dashboardHref(sheet.id, deck.id) : "../study-dashboard/index.html") + '">' + icon("book", 15) + ' Consultar ficha resumen</a>',
            active ? '<a class="s-btn" href="#/sesion" data-nav>' + icon("play", 14) + ' Continuar sesión</a>' : '',
          '</div>',
        '</section>',

        active ? activeSessionBanner(active) : "",

        '<section class="deck-dashboard">',
          '<div class="deck-progress-panel">',
            '<div class="deck-progress-ring" style="--p:' + stats.percent + '"><div><b>' + stats.percent + '%</b><span>dominio</span></div></div>',
            '<div class="deck-progress-copy"><span class="s-kicker">Estado del mazo</span><h2>' + stats.reviewed + ' de ' + stats.total + ' revisadas</h2><p class="s-small s-soft">' + (stats.lastReviewAt ? "Última práctica: " + esc(UI.formatRelative(stats.lastReviewAt)) : "Todavía no practicaste este mazo.") + '</p>' +
              UI.progressBar(stats.percent, "Dominio de " + deck.title) +
              '<div class="deck-progress-legend"><span><b>' + stats.newCards + '</b> nuevas</span><span><b>' + stats.reviewed + '</b> revisadas</span><span><b>' + stats.mastered + '</b> dominadas</span></div>' +
            '</div>',
          '</div>',
          '<div class="mode-actions">' + ["free", "quick", "exam", "errors"].map(function (m) { return modeAction(m, deck.id); }).join("") + '</div>',
        '</section>',

        '<section class="flash-section deck-cards-section">',
          '<div class="flash-section-head"><div><span class="s-kicker"><span class="dot"></span>Contenido</span><h2>Tarjetas del mazo</h2></div><span class="s-small s-muted">' + cards.length + ' ' + plural(cards.length, "tarjeta", "tarjetas") + '</span></div>',
          '<div class="flash-card-list">' + cards.map(cardListRow).join("") + '</div>',
        '</section>',

        sessions.length ? '<section class="flash-section"><div class="flash-section-head"><div><span class="s-kicker"><span class="dot"></span>Reciente</span><h2>Últimas sesiones</h2></div><a class="s-link s-small" href="#/historial" data-nav>Ver historial</a></div><div class="session-mini-list">' + sessions.map(sessionMiniRow).join("") + '</div></section>' : '',

        '<div class="deck-note">' + icon("info", 15) + '<p>Las tarjetas nuevas no cuentan como error. Solo verás en «Errores» lo que hayas fallado de verdad.</p></div>',
      '</div>'
    ].join("");
  }

  function sessionMiniRow(s) {
    var m = modeMeta(s.mode);
    var deck = deckInfo(s.deckId);
    return '<button class="session-mini" type="button" data-action="view-session" data-session="' + esc(s.id) + '">' +
      '<span class="session-mini-icon">' + icon(m.icon, 15) + '</span>' +
      '<span class="session-mini-copy"><b>' + esc(deck.title) + '</b><small>' + esc(m.label) + ' · ' + esc(UI.formatRelative(s.endedAt)) + '</small></span>' +
      '<span class="session-mini-score">' + s.correct + '/' + s.total + '</span>' + icon("chevronRight", 13) + '</button>';
  }

  /* ------------------------------------------------------------------ */
  /* Sesión                                                              */
  /* ------------------------------------------------------------------ */

  function sessionHeader(s) {
    var deck = state.currentDeck && state.currentDeck.id === s.deckId ? state.currentDeck : deckInfo(s.deckId);
    var m = modeMeta(s.mode);
    var total = s.queue.length;
    var pct = total ? Math.round((s.index / total) * 100) : 0;
    return '<div class="session-header">' +
      '<a class="flash-back" href="' + deckHref(s.deckId) + '" data-nav>' + icon("arrowLeft", 15) + ' Salir al mazo</a>' +
      '<div class="session-header-meta"><span class="s-chip s-chip--accent">' + icon(m.icon, 12) + esc(m.label) + '</span><span class="session-deck-name">' + esc(deck.title) + '</span></div>' +
      '<button class="s-btn s-btn--ghost s-btn--sm" type="button" data-action="end-session">Terminar</button>' +
      '</div>' +
      '<div class="session-progress"><div class="session-progress-copy"><span>Tarjeta ' + (s.index + 1) + ' de ' + total + '</span>' +
        (s.mode === "exam" ? '<span>' + Object.keys(s.answers).length + ' respondidas</span>' : '<span>' + s.correct + ' correctas · ' + s.wrong + ' por reforzar</span>') +
      '</div>' + UI.progressBar(pct, "Avance de la sesión") + '</div>';
  }

  function cardShell(s, card, inner) {
    var m = modeMeta(s.mode);
    var topic = Store.getTopic(card.topicId);
    return '<article class="session-card" aria-labelledby="flash-prompt">' +
      '<div class="session-card-top"><span class="card-type-badge ' + (card.type === "concept" ? "is-concept" : card.type === "application" ? "is-application" : "is-multiple") + '">' + icon(card.type === "concept" ? "brain" : card.type === "application" ? "target" : "list", 13) + esc(TYPE_LABEL[card.type]) + '</span>' +
        '<span class="session-card-position">' + esc(topic ? topic.title : "") + ' · ' + (s.index + 1) + '/' + s.queue.length + '</span></div>' +
      '<h1 id="flash-prompt" class="flash-prompt">' + esc(card.prompt) + '</h1>' +
      (s.mode === "exam" ? '<p class="exam-note">' + icon("info", 14) + ' En modo examen no verás la respuesta hasta el final.</p>' : '') +
      inner + '</article>';
  }

  function ratingButtons() {
    return '<div class="rating-grid" role="group" aria-label="¿Cómo te fue?">' + RATINGS.map(function (r, i) {
      return '<button class="rating-btn ' + r.cls + '" type="button" data-action="rate" data-rating="' + r.id + '">' +
        '<span class="rating-key">' + (i + 1) + '</span><b>' + r.label + '</b><small>' + r.hint + '</small></button>';
    }).join("") + '</div>';
  }

  function stageHTML() {
    var s = currentSession();
    if (!s) return "";
    var card = currentCard(s);
    if (!card) return "";
    var ans = answerFor(s, card.id);
    var checked = !!ans;
    var selected = checked ? ans.selected : state.selected;
    var isExam = s.mode === "exam";
    var isConcept = card.type === "concept";
    var sheet = Store.getSheet(card.sheetId);
    var sourceChips = card.sourceRefs && card.sourceRefs.length ? '<div class="session-sources">' + UI.sourceChips(card.sourceRefs) + '</div>' : "";
    var fichaLink = sheet ? '<a class="session-ficha-link" href="' + esc(dashboardHref(sheet.id, s.deckId)) + '">' + icon("book", 14) + ' Consultar ficha resumen</a>' : "";
    var nextLabel = s.index + 1 >= s.queue.length ? "Ver resumen" : "Siguiente tarjeta";

    if (isConcept) {
      var revealed = state.revealed || checked;
      if (!revealed) {
        return cardShell(s, card,
          '<div class="reveal-zone"><button class="s-btn s-btn--lg" type="button" data-action="reveal">' + icon("eye", 17) + ' Mostrar respuesta</button>' +
          '<p class="key-hint">' + icon("info", 13) + ' Intenta recordarlo antes de revelar. También puedes pulsar Espacio.</p></div>'
        );
      }
      var answerBlock = '<div class="answer-block"><span class="answer-label">Respuesta</span><p>' + esc(card.answer) + '</p>' +
        (card.explanation ? '<div class="answer-explanation"><b>Por qué importa</b><p>' + esc(card.explanation) + '</p></div>' : '') +
        sourceChips + fichaLink + '</div>';
      if (checked) {
        return cardShell(s, card, answerBlock + '<div class="session-actions"><button class="s-btn" type="button" data-action="next">' + esc(nextLabel) + ' ' + icon("arrow", 15) + '</button></div>');
      }
      return cardShell(s, card, answerBlock + '<p class="rating-prompt">¿Cómo te fue al recordarlo?</p>' + ratingButtons() + '<div class="session-actions session-actions--muted">' + fichaLink + '</div>');
    }

    var optionsHTML = '<div class="option-list" role="group" aria-label="Opciones de respuesta">' + (card.options || []).map(function (opt, i) {
      var cls = "";
      if (selected === i) cls += " is-selected";
      if (checked && !isExam) {
        if (i === card.correctIndex) cls += " is-correct";
        if (i === selected && i !== card.correctIndex) cls += " is-wrong";
      }
      return '<button class="flash-option' + cls + '" type="button" data-action="select-option" data-index="' + i + '" aria-pressed="' + (selected === i) + '"' + (checked ? " disabled" : "") + '>' +
        '<span class="option-letter">' + String.fromCharCode(65 + i) + '</span><span>' + esc(opt) + '</span>' +
        (checked && !isExam && i === card.correctIndex ? icon("checkCircle", 17) : "") +
        (checked && !isExam && i === selected && i !== card.correctIndex ? icon("xCircle", 17) : "") +
        '</button>';
    }).join("") + '</div>';

    var feedback = "";
    if (checked && !isExam) {
      feedback = '<div class="flash-feedback ' + (ans.correct ? "is-correct" : "is-wrong") + '" role="status">' +
        '<span class="feedback-icon">' + icon(ans.correct ? "checkCircle" : "xCircle", 19) + '</span>' +
        '<div><b>' + (ans.correct ? "Correcto" : "Todavía no") + '</b><p>' + esc(card.explanation || "") + '</p>' + sourceChips + '</div></div>';
    }
    var actions;
    if (isExam) {
      actions = '<div class="session-actions"><button id="session-primary" class="s-btn" type="button" data-action="exam-next"' + (selected == null ? " disabled" : "") + '>' + esc(nextLabel) + ' ' + icon("arrow", 15) + '</button></div>';
    } else if (checked) {
      actions = '<div class="session-actions"><button class="s-btn" type="button" data-action="next">' + esc(nextLabel) + ' ' + icon("arrow", 15) + '</button>' + fichaLink + '</div>';
    } else {
      actions = '<div class="session-actions"><button id="session-primary" class="s-btn" type="button" data-action="check"' + (selected == null ? " disabled" : "") + '>' + icon("check", 15) + ' Comprobar</button><span class="key-hint">' + icon("info", 13) + ' Selecciona una opción para comprobar.</span></div>';
    }
    return cardShell(s, card, optionsHTML + feedback + actions);
  }

  function renderSession() {
    var s = currentSession();
    if (!s) {
      return '<div class="session-empty">' + UI.emptyState({
        icon: "cards", title: "No hay una sesión activa",
        text: "Elige un mazo y empieza cuando quieras. Las sesiones se guardan para que puedas retomarlas.",
        actions: '<a class="s-btn" href="#/" data-nav>Ver mazos</a><a class="s-btn s-btn--ghost" href="#/historial" data-nav>Historial</a>'
      }) + '</div>';
    }
    if (!currentCard(s)) {
      return '<div class="session-empty">' + UI.emptyState({
        icon: "checkCircle", title: "La sesión está completa",
        text: "Ya respondiste todas las tarjetas de esta sesión.",
        actions: '<button class="s-btn" type="button" data-action="end-session">Ver resumen</button><a class="s-btn s-btn--ghost" href="#/" data-nav>Volver a mazos</a>'
      }) + '</div>';
    }
    return '<div class="session-view">' + sessionHeader(s) + '<div id="session-stage">' + stageHTML() + '</div>' +
      '<div class="session-foot-note">' + icon("info", 13) + ' Tu respuesta se guarda al comprobar o al pasar a la siguiente tarjeta.</div></div>';
  }

  function refreshStage() {
    var stage = qs("#session-stage");
    if (!stage) return;
    stage.innerHTML = stageHTML();
  }

  function refreshSessionHeader() {
    var s = currentSession();
    if (!s) return;
    var header = qs(".session-header");
    var progress = qs(".session-progress");
    if (header) header.outerHTML = sessionHeader(s);
    else if (progress) progress.outerHTML = sessionHeader(s);
  }

  /* ------------------------------------------------------------------ */
  /* Resumen                                                             */
  /* ------------------------------------------------------------------ */

  function reviewRow(card, ans) {
    var isConcept = card.type === "concept";
    var selectedText = ans && ans.selected != null && card.options ? card.options[ans.selected] : null;
    var correctText = isConcept ? card.answer : (card.options ? card.options[card.correctIndex] : "");
    var sheet = Store.getSheet(card.sheetId);
    return '<div class="review-card">' +
      '<div class="review-card-head"><span class="card-type-badge">' + icon(isConcept ? "brain" : card.type === "application" ? "target" : "list", 12) + esc(TYPE_LABEL[card.type]) + '</span>' +
      '<span class="review-result ' + (ans && ans.correct ? "is-correct" : "is-wrong") + '">' + (ans && ans.correct ? icon("check", 12) + " Correcta" : icon("close", 12) + " Para reforzar") + '</span></div>' +
      '<h3>' + esc(card.prompt) + '</h3>' +
      (selectedText ? '<div class="review-line"><span>Tu respuesta</span><p>' + esc(selectedText) + '</p></div>' : "") +
      '<div class="review-line review-line--correct"><span>Respuesta correcta</span><p>' + esc(correctText) + '</p></div>' +
      (card.explanation ? '<p class="review-explanation">' + esc(card.explanation) + '</p>' : '') +
      '<div class="review-foot">' + (card.sourceRefs ? UI.sourceChips(card.sourceRefs) : "") + (sheet ? '<a class="s-link s-small" href="' + esc(dashboardHref(sheet.id, card.topicId)) + '">Ver ficha</a>' : "") + '</div>' +
      '</div>';
  }

  function renderSummary() {
    var s = state.summary || (Store.getState().sessions || [])[0] || null;
    if (!s) {
      return '<div class="summary-empty">' + UI.emptyState({
        icon: "chart", title: "Todavía no hay un resumen",
        text: "Completa una sesión de flashcards para ver tu resultado, las respuestas y las tarjetas que conviene reforzar.",
        actions: '<a class="s-btn" href="#/" data-nav>Elegir un mazo</a><a class="s-btn s-btn--ghost" href="#/historial" data-nav>Ver historial</a>'
      }) + '</div>';
    }
    var deck = state.currentDeck && state.currentDeck.id === s.deckId ? state.currentDeck : deckInfo(s.deckId);
    var topic = deck.topic;
    var m = modeMeta(s.mode);
    var answers = s.answers || {};
    var cardIds = s.cardIds || [];
    var wrongIds = cardIds.filter(function (id) { return answers[id] && !answers[id].correct; });
    var allCards = cardIds.map(function (id) { return Store.getCard(id); }).filter(Boolean);
    var wrongCards = wrongIds.map(function (id) { return Store.getCard(id); }).filter(Boolean);
    var reviewCards = s.mode === "exam" ? allCards : wrongCards;
    var score = s.total ? s.correct + "/" + s.total : "—";
    var area = topic ? Store.getArea(topic.areaId) : null;
    var nextSheet = deck.kind === "sheet" ? deck.sheet : (topic ? originSheetFor(topic.id) : null);
    var reviewOpen = s.mode === "exam" || reviewCards.length <= 4;

    return [
      '<div class="summary-view">',
        '<a class="flash-back" href="' + (deck.kind === "missing" ? "#/" : deckHref(deck.id)) + '" data-nav>' + icon("arrowLeft", 15) + ' Volver al mazo</a>',
        '<section class="summary-hero" style="--area:' + esc(area ? area.accent : "var(--accent)") + '">',
          '<div class="summary-score"><span class="summary-score-label">' + (s.mode === "exam" ? "Resultado del examen" : "Sesión completada") + '</span><b>' + esc(score) + '</b><span>' + s.accuracy + '% de acierto</span></div>',
          '<div class="summary-copy"><span class="s-kicker">' + icon(m.icon, 13) + ' ' + esc(m.label) + '</span><h1>' + (s.correct === s.total && s.total ? "Buen trabajo." : "Sigue afinando.") + '</h1><p>' + esc(deck.kind === "missing" ? "Sesión de estudio" : deck.title) + ' · ' + esc(UI.formatRelative(s.endedAt)) + '</p>' +
            '<div class="summary-stats"><span><b>' + s.correct + '</b><small>correctas</small></span><span><b>' + s.wrong + '</b><small>por reforzar</small></span><span><b>' + s.total + '</b><small>respondidas</small></span></div>' +
          '</div>',
        '</section>',

        '<div class="summary-actions">',
          '<button class="s-btn" type="button" data-action="start-session" data-mode="free" data-deck="' + esc(s.deckId) + '">' + icon("rotate", 15) + ' Repetir el mazo</button>',
          wrongCards.length ? '<button class="s-btn s-btn--ghost" type="button" data-action="start-session" data-mode="errors" data-deck="' + esc(s.deckId) + '">' + icon("alert", 15) + ' Repasar errores</button>' : "",
          '<a class="s-btn s-btn--ghost" href="' + (nextSheet ? esc(dashboardHref(nextSheet.id, s.deckId)) : "../study-dashboard/index.html") + '">' + icon("book", 15) + ' Consultar ficha</a>',
          '<a class="s-btn s-btn--ghost" href="#/historial" data-nav>Historial</a>',
        '</div>',

        reviewCards.length ? '<section class="summary-review"><div class="flash-section-head"><div><span class="s-kicker"><span class="dot"></span>' + (s.mode === "exam" ? "Revisión" : "Refuerzo") + '</span><h2>' + (s.mode === "exam" ? "Todas las respuestas" : "Lo que conviene volver a ver") + '</h2></div><span class="s-small s-muted">' + reviewCards.length + ' ' + plural(reviewCards.length, "tarjeta", "tarjetas") + '</span></div>' +
          '<details class="review-block"' + (reviewOpen ? " open" : "") + '><summary>' + (s.mode === "exam" ? "Abrir revisión del examen" : "Abrir explicaciones") + ' ' + icon("chevronDown", 15) + '</summary><div class="review-list">' +
          reviewCards.map(function (card) { return reviewRow(card, answers[card.id]); }).join("") + '</div></details></section>' :
          '<div class="summary-clean">' + icon("checkCircle", 20) + '<p>No quedaron errores en esta sesión. Puedes repetir el mazo o probar el modo examen.</p></div>',

        '<div class="summary-note">' + icon("info", 14) + '<p>El resultado de esta sesión ya actualizó tu programación de repaso. La próxima vez, las tarjetas volverán cuando toque.</p></div>',
      '</div>'
    ].join("");
  }

  /* ------------------------------------------------------------------ */
  /* Historial                                                           */
  /* ------------------------------------------------------------------ */

  function renderHistory() {
    var sessions = Store.getState().sessions || [];
    var st = Store.getDashboardStats();
    var errors = Store.getErrorCards();
    var cards = Store.getState().cards || {};
    var todayKey = new Date().toISOString().slice(0, 10);
    var dueToday = 0, next7 = 0, later = 0;
    C.cards.forEach(function (c) {
      var cs = cards[c.id];
      if (!cs || !cs.reviews) return;
      if (Store.getDueCards().some(function (d) { return d.id === c.id; })) dueToday += 1;
      else if (cs.dueAt) {
        var diff = new Date(cs.dueAt).getTime() - Date.now();
        if (diff <= 7 * 86400000) next7 += 1;
        else later += 1;
      }
    });
    var avg = sessions.length ? Math.round(sessions.reduce(function (n, s) { return n + (s.accuracy || 0); }, 0) / sessions.length) : 0;
    var errByDeck = {};
    errors.forEach(function (c) {
      var deckId = c.sheetId && Store.getSheet(c.sheetId) ? c.sheetId : c.topicId;
      errByDeck[deckId] = (errByDeck[deckId] || 0) + 1;
    });
    var errRows = Object.keys(errByDeck).map(function (id) {
      var deck = deckInfo(id);
      return deck.kind === "missing" ? "" : '<a class="error-deck-row" href="' + deckHref(id) + '" data-nav><span>' + esc(deck.title) + '</span><b>' + errByDeck[id] + '</b>' + icon("chevronRight", 13) + '</a>';
    }).join("");

    return [
      '<section class="history-head"><span class="s-kicker"><span class="dot"></span>Tu práctica</span><h1>Historial y programación.</h1><p>Las sesiones que completaste y el estado real de tus tarjetas. Sin estadísticas decorativas.</p></section>',
      '<section class="history-stats">',
        '<div><span class="s-stat"><b>' + sessions.length + '</b><span>sesiones</span></span><small>completadas</small></div>',
        '<div><span class="s-stat"><b>' + (sessions.length ? avg + "%" : "—") + '</b><span>acierto medio</span></span><small>' + st.reviewedCards + ' tarjetas revisadas</small></div>',
        '<div><span class="s-stat"><b>' + st.masteredCards + '</b><span>dominadas</span></span><small>de ' + st.totalCards + ' tarjetas</small></div>',
        '<div><span class="s-stat"><b>' + errors.length + '</b><span>con error</span></span><small>para volver a practicar</small></div>',
      '</section>',

      '<div class="history-grid">',
        '<section class="history-panel schedule-panel">',
          '<div class="flash-section-head"><div><span class="s-kicker">Repaso espaciado</span><h2>Programación</h2></div><span class="s-chip">' + dueToday + ' para hoy</span></div>',
          '<div class="schedule-grid">',
            '<div><b>' + dueToday + '</b><span>para hoy</span><small>incluye vencidas</small></div>',
            '<div><b>' + next7 + '</b><span>próximos 7 días</span><small>programadas</small></div>',
            '<div><b>' + later + '</b><span>más adelante</span><small>en tu calendario</small></div>',
            '<div><b>' + st.newCards + '</b><span>nuevas</span><small>sin revisar</small></div>',
          '</div>',
          '<p class="schedule-note">' + icon("loop", 14) + ' Las tarjetas vuelven según tu respuesta: antes si fallas, más tarde si dominas.</p>',
        '</section>',
        '<section class="history-panel errors-panel">',
          '<div class="flash-section-head"><div><span class="s-kicker">Refuerzo</span><h2>Errores por mazo</h2></div></div>',
          errRows ? '<div class="error-deck-list">' + errRows + '</div>' : '<p class="s-small s-muted">Todavía no hay errores registrados. Cuando falles una tarjeta, aparecerá aquí.</p>',
        '</section>',
        '<section class="history-panel sessions-panel">',
          '<div class="flash-section-head"><div><span class="s-kicker">Registro</span><h2>Sesiones completadas</h2></div><a class="s-link s-small" href="#/" data-nav>Nuevo mazo</a></div>',
          sessions.length ? '<div class="session-history-list">' + sessions.map(function (s) {
            var deck = deckInfo(s.deckId);
            var m = modeMeta(s.mode);
            return '<button class="history-session" type="button" data-action="view-session" data-session="' + esc(s.id) + '">' +
              '<span class="history-session-icon">' + icon(m.icon, 16) + '</span>' +
              '<span class="history-session-copy"><b>' + esc(deck.title) + '</b><small>' + esc(m.label) + ' · ' + s.correct + ' de ' + s.total + ' · ' + esc(UI.formatRelative(s.endedAt)) + '</small></span>' +
              '<span class="history-session-score">' + s.accuracy + '%</span>' + icon("chevronRight", 13) + '</button>';
          }).join("") + '</div>' : UI.emptyState({
            icon: "clock", title: "Todavía no completaste sesiones",
            text: "Elige un mazo y haz una primera ronda. Al terminar verás aquí tu resultado y tu programación.",
            actions: '<a class="s-btn" href="#/" data-nav>Elegir un mazo</a>'
          }),
        '</section>',
      '</div>',

      '<div class="history-note">' + icon("info", 14) + '<p>El progreso se guarda en este navegador y se comparte con Study Dashboard desde el mismo almacenamiento.</p></div>'
    ].join("");
  }

  /* ------------------------------------------------------------------ */
  /* Estados no encontrados                                              */
  /* ------------------------------------------------------------------ */

  function renderNotFound(title, text) {
    var alternatives = C.sheets.slice(0, 3).map(function (s) {
      return '<a class="s-btn s-btn--ghost s-btn--sm" href="' + deckHref(s.id) + '" data-nav>' + esc(s.title) + '</a>';
    }).join("");
    return '<section class="flash-notfound">' + UI.emptyState({
      icon: "compass", title: title, text: text,
      actions: '<a class="s-btn" href="#/" data-nav>Ver todos los mazos</a><a class="s-btn s-btn--ghost" href="#/historial" data-nav>Historial</a>' + alternatives
    }) + '</section>';
  }

  /* ------------------------------------------------------------------ */
  /* Eventos                                                             */
  /* ------------------------------------------------------------------ */

  function onDocumentClick(e) {
    var nav = e.target.closest("a[data-nav]");
    if (nav) {
      var href = nav.getAttribute("href") || "";
      if (href && href.charAt(0) === "#" && href === location.hash) {
        e.preventDefault();
        renderRoute({ focus: false });
      }
      return;
    }
    var el = e.target.closest("[data-action]");
    if (!el) return;
    var action = el.getAttribute("data-action");
    if (action === "retry") {
      location.reload();
    } else if (action === "start-session") {
      startSession(el.getAttribute("data-mode"), el.getAttribute("data-deck"));
    } else if (action === "select-option") {
      var idx = Number(el.getAttribute("data-index"));
      var s = currentSession();
      var card = currentCard(s);
      if (!s || !card || answerFor(s, card.id)) return;
      state.selected = idx;
      qsa(".flash-option").forEach(function (b) {
        var i = Number(b.getAttribute("data-index"));
        b.classList.toggle("is-selected", i === idx);
        b.setAttribute("aria-pressed", String(i === idx));
      });
      var primary = qs("#session-primary");
      if (primary) primary.disabled = false;
    } else if (action === "reveal") {
      state.revealed = true;
      refreshStage();
      announce("Respuesta visible.");
    } else if (action === "check") {
      checkAnswer();
    } else if (action === "exam-next") {
      examAnswer();
    } else if (action === "next") {
      advanceSession();
    } else if (action === "rate") {
      var rating = el.getAttribute("data-rating");
      var rs = currentSession();
      var rc = currentCard(rs);
      if (!rs || !rc) return;
      Store.recordSessionAnswer(rc.id, { correct: rating !== "again", rating: rating, selected: null });
      announce(rating === "again" ? "Marcada para volver a intentarlo." : "Respuesta registrada.");
      advanceSession();
    } else if (action === "end-session") {
      finishCurrentSession();
    } else if (action === "view-session") {
      var id = el.getAttribute("data-session");
      var found = (Store.getState().sessions || []).filter(function (s) { return s.id === id; })[0];
      if (found) {
        state.summary = found;
        if (location.hash === "#/resumen") renderRoute({ scrollY: 0 });
        else location.hash = "#/resumen";
      }
    }
  }

  function checkAnswer() {
    var s = currentSession();
    var card = currentCard(s);
    if (!s || !card || card.type === "concept") return;
    if (answerFor(s, card.id)) return;
    if (state.selected == null) return;
    var correct = state.selected === card.correctIndex;
    Store.recordSessionAnswer(card.id, {
      correct: correct, rating: correct ? "good" : "again", selected: state.selected
    });
    announce(correct ? "Correcto." : "Incorrecto. Revisa la explicación.");
    renderRoute({ scrollY: window.scrollY });
  }

  function examAnswer() {
    var s = currentSession();
    var card = currentCard(s);
    if (!s || !card) return;
    if (s.mode !== "exam") { checkAnswer(); return; }
    if (answerFor(s, card.id)) { advanceSession(); return; }
    if (state.selected == null) return;
    var correct = state.selected === card.correctIndex;
    Store.recordSessionAnswer(card.id, {
      correct: correct, rating: correct ? "good" : "again", selected: state.selected
    });
    advanceSession();
  }

  function onKeydown(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest("input, textarea, select")) return;
    if (state.route.name !== "session") return;
    var s = currentSession();
    var card = currentCard(s);
    if (!s || !card) return;
    var key = e.key;

    if (card.type === "concept") {
      var revealed = state.revealed;
      if (!revealed && (key === " " || key === "Enter")) {
        e.preventDefault();
        state.revealed = true;
        refreshStage();
        return;
      }
      if (revealed && /^[1-4]$/.test(key)) {
        e.preventDefault();
        var r = RATINGS[Number(key) - 1];
        if (r) {
          Store.recordSessionAnswer(card.id, { correct: r.id !== "again", rating: r.id, selected: null });
          advanceSession();
        }
      }
      return;
    }

    if (/^[1-9]$/.test(key)) {
      var idx = Number(key) - 1;
      if (card.options && idx < card.options.length && !answerFor(s, card.id)) {
        e.preventDefault();
        state.selected = idx;
        qsa(".flash-option").forEach(function (b) {
          var i = Number(b.getAttribute("data-index"));
          b.classList.toggle("is-selected", i === idx);
          b.setAttribute("aria-pressed", String(i === idx));
        });
        var primary = qs("#session-primary");
        if (primary) primary.disabled = false;
      }
    } else if (key === "Enter") {
      if (answerFor(s, card.id)) {
        e.preventDefault();
        advanceSession();
      } else if (state.selected != null) {
        e.preventDefault();
        if (s.mode === "exam") examAnswer();
        else checkAnswer();
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Arranque                                                            */
  /* ------------------------------------------------------------------ */

  function readEntry() {
    var deck = UI.getQuery("deck");
    var mode = UI.getQuery("mode");
    var resume = UI.getQuery("resume");
    var sheet = UI.getQuery("sheet");
    var from = UI.getQuery("from");
    if (sheet) {
      state.returnSheet = sheet;
      state.fromDashboard = from === "dashboard";
      rememberOrigin(sheet, deck);
    } else {
      var origin = readOrigin();
      if (origin) {
        state.returnSheet = origin.sheet || "";
        if (origin.deck && !deck) state.borrowedDeck = origin.deck;
      }
      if (from === "dashboard") state.fromDashboard = true;
    }
    if (deck && mode) rememberOrigin(sheet || state.returnSheet, deck);
    UI.cleanQuery();
    return { deck: deck, mode: mode, resume: resume };
  }

  async function bootApp() {
    if (!C || !Array.isArray(C.cards)) {
      showError("No se encontró el contenido compartido del temario.");
      return;
    }
    if (!Store || !UI) {
      showError("No se pudieron cargar los módulos compartidos de Study.");
      return;
    }
    mountStaticIcons();
    UI.initTheme();
    try {
      await Store.init();
    } catch (e) {
      showError("No se pudo inicializar el almacenamiento local. La práctica podría no guardarse.");
      return;
    }
    if (!C.cards.length) { showEmptyContent(); return; }

    var entry = readEntry();
    var initialHash = location.hash;
    var entryDeck = entry.deck ? deckInfo(entry.deck) : null;
    if (entry.deck && entryDeck.kind !== "missing") {
      var wantsSession = entry.mode && MODES[entry.mode];
      if (wantsSession || entry.resume === "1") {
        var active = Store.getFlashSession(entry.deck);
        if (active) {
          replaceHash("#/sesion");
        } else if (wantsSession) {
          var created = createSession(entry.mode, entry.deck, { silent: true });
          if (created) replaceHash("#/sesion");
          else {
            replaceHash(deckHref(entry.deck));
            state.notice = entry.mode === "errors" ? "No hay errores registrados en este mazo." : "No hay tarjetas pendientes en este mazo.";
          }
        } else {
          replaceHash(deckHref(entry.deck));
        }
      } else {
        replaceHash(deckHref(entry.deck));
      }
    } else if (entry.deck) {
      replaceHash(deckHref(entry.deck));
    } else if (!initialHash || initialHash === "#") {
      replaceHash("#/");
    }

    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onKeydown);
    window.addEventListener("hashchange", function () { renderRoute({ focus: true }); });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && Store.isReady()) renderRoute({ scrollY: window.scrollY });
    });
    renderRoute({ focus: false });
    if (state.notice) {
      UI.toast(state.notice);
      state.notice = "";
    }
  }

  bootApp();
})();
