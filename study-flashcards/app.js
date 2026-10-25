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
    currentDeck: null,
    currentDeckType: "",
    notice: "",
    /* Biblioteca: filtros, grupos abiertos y contexto de regreso. */
    library: { filter: "todas", area: "", q: "", open: [] },
    librarySaved: { hash: "#/", scroll: 0 },
    restoreScroll: 0
  };

  function deckHref(id) { return "#/mazo/" + encodeURIComponent(id); }  function libraryHash(lib) {
    var parts = [];
    if (lib.filter && lib.filter !== "todas") parts.push("estado=" + encodeURIComponent(lib.filter));
    if (lib.area) parts.push("area=" + encodeURIComponent(lib.area));
    if (lib.q) parts.push("q=" + encodeURIComponent(lib.q));
    if (lib.open && lib.open.length) parts.push("abiertas=" + lib.open.map(encodeURIComponent).join(","));
    return "#/" + (parts.length ? "?" + parts.join("&") : "");
  }
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
  function replaceHash(hash) {
    try { history.replaceState(null, "", location.pathname + location.search + hash); } catch (e) { location.hash = hash; }
  }
  function parseRoute() {
    var raw = location.hash.replace(/^#\/?/, "");
    var search = "";
    var split = raw.indexOf("?");
    if (split >= 0) {
      search = raw.slice(split + 1);
      raw = raw.slice(0, split);
    }
    if (!raw) return { name: "decks", library: parseLibraryParams(search) };
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

  function previousCard() {
    var s = Store.getFlashSession();
    if (!s || s.index <= 0) return;
    Store.updateFlashSession({ index: s.index - 1 });
    state.selected = null;
    state.revealed = false;
    renderRoute({ scrollY: window.scrollY, focus: false });
    announce("Tarjeta anterior.");
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
    suppressToggle = true;

    if (route.name === "decks") {
      state.library = route.library || parseLibraryParams("");
      document.title = "Biblioteca de mazos · Study Flashcards";
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
    if (state.restoreScroll) {
      y = state.restoreScroll;
      state.restoreScroll = 0;
    }
    requestAnimationFrame(function () {
      window.scrollTo(0, Math.max(0, y));
      suppressToggle = false;
    });
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
    var errors = Store.getErrorCards();
    var dueIds = {};
    Store.getDueCards().forEach(function (c) { dueIds[c.id] = true; });
    var extraErrors = errors.filter(function (c) { return !dueIds[c.id]; }).length;
    return {
      total: st.totalCards,
      reviewed: st.reviewedCards,
      mastered: st.masteredCards,
      due: st.dueCards,
      newCards: st.newCards,
      errors: errors.length,
      pending: st.newCards + st.dueCards + extraErrors,
      accuracy: overallAccuracy(),
      percent: st.totalCards ? Math.round((st.masteredCards / st.totalCards) * 100) : 0
    };
  }

  var LIB_FILTERS = [
    { id: "todas", label: "Todas" },
    { id: "pendientes", label: "Pendientes", hint: "Con tarjetas nuevas o que ya toca repasar" },
    { id: "curso", label: "En curso", hint: "Empezados y todavía sin dominar del todo" },
    { id: "completadas", label: "Completadas", hint: "Todas sus tarjetas dominadas" }
  ];

  function validFilter(id) {
    return LIB_FILTERS.some(function (f) { return f.id === id; });
  }
  function parseLibraryParams(search) {
    var params = {};
    try { params = Object.fromEntries(new URLSearchParams(search || "")); } catch (e) { params = {}; }
    var areaId = String(params.area || "");
    var exists = primaryAreas().some(function (a) { return a.id === areaId; });
    return {
      filter: validFilter(params.estado) ? params.estado : "todas",
      area: exists ? areaId : "",
      q: String(params.q || "").slice(0, 80),
      open: String(params.abiertas || "").split(",").filter(Boolean)
    };
  }
  function normText(value) {
    try { return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
    catch (e) { return String(value || "").toLowerCase(); }
  }
  function miniBar(pct, label) {
    var v = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
    return '<span class="mini-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + v + '" aria-label="' + esc(label || "Progreso") + '"><span style="width:' + v + '%"></span></span>';
  }
  function pluralDecks(n) { return n + ' ' + plural(n, "mazo", "mazos"); }
  function pluralCards(n) { return n + ' ' + plural(n, "tarjeta", "tarjetas"); }

  /* Tarjetas que aún requieren trabajo: nuevas, vencidas y errores que el
     repaso espaciado todavía no trae de vuelta. */
  function pendingCount(deckId, stats) {
    var base = stats.newCards + stats.due;
    if (!stats.errors) return base;
    var dueIds = {};
    Store.getDueCards(deckId).forEach(function (c) { dueIds[c.id] = true; });
    var extra = 0;
    Store.getErrorCards(deckId).forEach(function (c) {
      if (!dueIds[c.id]) extra += 1;
    });
    return base + extra;
  }

  /* Un mazo con su estado real, calculado una vez por render. */
  function deckModel(sheet) {
    var topic = Store.getTopic(sheet.topicId);
    var area = topic ? areaForTopic(topic) : null;
    var category = categoryForSheet(sheet);
    var stats = Store.getDeckStats(sheet.id);
    var active = Store.getFlashSession(sheet.id);
    var pending = pendingCount(sheet.id, stats);
    var completed = stats.total > 0 && stats.mastered >= stats.total;
    var lastAt = stats.lastReviewAt ? Date.parse(stats.lastReviewAt) : 0;
    if (!lastAt || isNaN(lastAt)) lastAt = 0;
    return {
      sheet: sheet, topic: topic, area: area, category: category, stats: stats,
      active: active, pending: pending, completed: completed, lastAt: lastAt,
      last: lastAt ? UI.formatRelative(stats.lastReviewAt) : "Sin practicar",
      inCourse: (stats.reviewed > 0 || !!active) && !completed,
      hay: normText([sheet.title, sheet.summary, topic && topic.title,
        category && category.title, category && category.short, area && area.title].join(" "))
    };
  }
  function areaTotals(models) {
    var t = { cards: 0, reviewed: 0, mastered: 0, pending: 0, errors: 0, lastAt: 0 };
    models.forEach(function (m) {
      t.cards += m.stats.total;
      t.reviewed += m.stats.reviewed;
      t.mastered += m.stats.mastered;
      t.pending += m.pending;
      t.errors += m.stats.errors;
      if (m.lastAt > t.lastAt) t.lastAt = m.lastAt;
    });
    t.percent = t.cards ? Math.round((t.mastered / t.cards) * 100) : 0;
    t.last = t.lastAt ? UI.formatRelative(new Date(t.lastAt).toISOString()) : "Sin practicar";
    return t;
  }

  /* Los modelos se recalculan solo cuando cambia el estado guardado: filtrar,
     buscar o plegar grupos no vuelve a recorrer las 630 tarjetas. */
  var modelCache = { key: "", models: null };
  function libraryModels() {
    var st = Store.getState() || {};
    var session = st.flashSession || {};
    var key = [st.updatedAt || "", session.id || "", session.updatedAt || "",
      session.index, C.sheets.length, C.cards.length].join("|");
    if (modelCache.key === key && modelCache.models) return modelCache.models;
    var models = C.sheets.filter(function (s) { return cardsFor(s.id).length > 0; }).map(deckModel);
    modelCache = { key: key, models: models };
    return models;
  }
  function computeLibrary() {
    var lib = state.library;
    var models = libraryModels();
    var qn = normText(lib.q);
    var filtering = lib.filter !== "todas" || !!lib.q || !!lib.area;
    var base = models.filter(function (m) {
      if (lib.area && (!m.area || m.area.id !== lib.area)) return false;
      if (qn && m.hay.indexOf(qn) < 0) return false;
      return true;
    });
    var counts = { todas: base.length, pendientes: 0, curso: 0, completadas: 0 };
    base.forEach(function (m) {
      if (m.pending > 0) counts.pendientes += 1;
      if (m.stats.reviewed > 0 && !m.completed) counts.curso += 1;
      if (m.completed) counts.completadas += 1;
    });
    var shown = base.filter(function (m) {
      if (lib.filter === "pendientes") return m.pending > 0;
      if (lib.filter === "curso") return m.stats.reviewed > 0 && !m.completed;
      if (lib.filter === "completadas") return m.completed;
      return true;
    });
    var areas = primaryAreas().map(function (area) {
      var inArea = models.filter(function (m) { return m.area && m.area.id === area.id; });
      var visible = shown.filter(function (m) { return m.area && m.area.id === area.id; });
      var categories = categoriesOf(area.id).map(function (category) {
        var all = inArea.filter(function (m) { return m.sheet.categoryId === category.id; });
        var decks = visible.filter(function (m) { return m.sheet.categoryId === category.id; });
        return { category: category, total: all.length, decks: decks };
      }).filter(function (entry) { return entry.decks.length; });
      return {
        area: area, total: inArea.length, decks: visible,
        categories: categories,
        /* Con filtros activos el resumen del área describe lo que se ve. */
        stats: areaTotals(filtering ? visible : inArea)
      };
    }).filter(function (group) {
      return group.total > 0 && (!filtering || group.decks.length > 0);
    });
    return {
      all: models, areas: areas, counts: counts, shown: shown.length,
      cards: shown.reduce(function (n, m) { return n + m.stats.total; }, 0),
      pending: shown.reduce(function (n, m) { return n + m.pending; }, 0),
      totalCards: models.reduce(function (n, m) { return n + m.stats.total; }, 0),
      filtered: filtering
    };
  }

  /* ------------------------------------------------------------------ */
  /* Biblioteca: hero compacto, filtros y progreso                       */
  /* ------------------------------------------------------------------ */

  function renderLibraryHero(totals, active, model) {
    var pending = totals.pending;
    var accuracy = totals.accuracy ? totals.accuracy + "%" : "—";
    var startDeck = null;
    var models = model ? model.all : [];
    models.some(function (m) { if (m.pending > 0) { startDeck = m; return true; } return false; });
    if (!startDeck) startDeck = models[0] || null;
    var primary = active
      ? '<a class="s-btn" href="#/sesion" data-nav>' + icon("play", 16) + ' Continuar sesión</a>'
      : '<a class="s-btn" href="' + (startDeck ? deckHref(startDeck.sheet.id) : "#/") + '" data-nav' + (startDeck ? ' title="Empezar por ' + esc(startDeck.sheet.title) + '"' : '') + '>' + icon("play", 16) + ' Empezar a practicar</a>';
    var sessionLine = "";
    if (active) {
      var activeDeck = deckInfo(active.deckId);
      sessionLine = '<p class="lib-session-line">' + icon("play", 12) +
        ' <span>Sesión en curso · ' + esc(modeMeta(active.mode).short) + ' · ' + esc(activeDeck.kind === "missing" ? "mazo guardado" : activeDeck.title) +
        ' · tarjeta ' + (active.index + 1) + ' de ' + active.queue.length + '</span></p>';
    }
    return '<section class="lib-hero">' +
      '<div class="lib-hero-copy">' +
        '<span class="s-kicker"><span class="dot"></span>Biblioteca de estudio</span>' +
        '<h1>Recupera <em>lo que sabes.</em></h1>' +
        '<p class="lib-hero-line">' + pluralCards(totals.total) + ' · ' +
          totals.reviewed + ' ' + plural(totals.reviewed, "revisada", "revisadas") + ' · ' +
          totals.mastered + ' ' + plural(totals.mastered, "dominada", "dominadas") + ' · ' +
          pending + ' ' + plural(pending, "pendiente", "pendientes") + ' · ' + accuracy + ' de acierto</p>' +
        '<div class="lib-hero-meter">' + miniBar(totals.percent, "Dominio global de los mazos") + '<span>' + totals.percent + '% de dominio global</span></div>' +
        '<div class="lib-hero-actions">' + primary +
          '<a class="s-btn s-btn--ghost" href="../study-dashboard/index.html">' + icon("book", 16) + ' Consultar temario</a>' +
        '</div>' +
        sessionLine +
      '</div>' +
      '<div class="lib-hero-visual" aria-hidden="true">' +
        '<div class="card-stack">' +
          '<div class="stack-card stack-card-back"><span>03</span><p>APLICAR</p></div>' +
          '<div class="stack-card stack-card-mid"><span>02</span><p>EXPLICAR</p></div>' +
          '<div class="stack-card stack-card-front"><span class="stack-tag">CONCEPTO</span><p>¿Por qué la APS no es una atención de segunda categoría?</p><span class="stack-line"></span><span class="stack-line short"></span><span class="stack-mark">' + icon("brain", 20) + '</span></div>' +
        '</div>' +
        '<span class="hero-visual-note">' + icon("loop", 13) + ' recordar · aplicar · volver</span>' +
      '</div>' +
      '</section>';
  }

  function libraryCountText(model) {
    if (!model.shown) return "Ningún mazo coincide con los filtros activos.";
    var text = pluralDecks(model.shown) + ' · ' + pluralCards(model.cards) + ' · ' + model.pending + ' ' + plural(model.pending, "pendiente", "pendientes");
    if (model.filtered) {
      if (model.areas.length > 1) text += ' · ' + model.areas.length + ' ' + plural(model.areas.length, "área", "áreas");
      text += ' · filtros activos';
      var anyOpen = model.areas.some(function (g) { return state.library.open.indexOf(g.area.id) >= 0; });
      if (!anyOpen) text += ' · abre un área para ver los resultados';
    }
    return text;
  }

  function renderLibraryTools(model) {
    var lib = state.library;
    var stateButtons = LIB_FILTERS.map(function (f) {
      return '<button type="button" data-state="' + f.id + '" aria-pressed="' + (lib.filter === f.id) + '"' +
        (f.hint ? ' title="' + esc(f.hint) + '"' : '') + '>' + esc(f.label) + '<b>' + model.counts[f.id] + '</b></button>';
    }).join("");
    var areaOptions = '<option value="">Todas las áreas</option>' + primaryAreas().map(function (a) {
      return '<option value="' + esc(a.id) + '"' + (lib.area === a.id ? " selected" : "") + '>' + esc(a.title) + '</option>';
    }).join("");
    var anyOpen = model.areas.some(function (g) { return lib.open.indexOf(g.area.id) >= 0; });
    return '<section class="lib-tools" aria-label="Buscar y filtrar mazos">' +
      '<label class="lib-search" for="lib-search">' + icon("search", 15) +
        '<span class="s-sr-only">Buscar mazo</span>' +
        '<input id="lib-search" type="search" placeholder="Buscar mazo, tema o categoría" value="' + esc(lib.q) + '" autocomplete="off" enterkeyhint="search" maxlength="80" aria-describedby="library-count">' +
      '</label>' +
      '<div class="s-seg lib-seg" role="group" aria-label="Filtrar por estado">' + stateButtons + '</div>' +
      '<label class="lib-select">' + icon("filter", 14) + '<span class="s-sr-only">Filtrar por área</span><select id="lib-area">' + areaOptions + '</select></label>' +
      '<button class="lib-expand" type="button" data-action="' + (anyOpen ? "collapse-all" : "expand-all") + '" aria-expanded="' + anyOpen + '">' +
        icon(anyOpen ? "chevronDown" : "layers", 14) + (anyOpen ? ' Contraer áreas' : ' Expandir áreas') + '</button>' +
      '</section>' +
      '<p class="lib-count" id="library-count" aria-live="polite">' + esc(libraryCountText(model)) + '</p>';
  }

  function libraryEmpty() {
    var active = state.library.filter !== "todas" || !!state.library.q || !!state.library.area;
    return UI.emptyState({
      icon: "search",
      title: state.library.q ? "Ningún mazo coincide con «" + state.library.q + "»" : "Ningún mazo en este filtro",
      text: "Prueba con otra palabra, cambia el área o vuelve a ver todos los mazos. Las tarjetas y el progreso no cambian.",
      actions: active ? '<button class="s-btn" type="button" data-action="clear-filters">Limpiar filtros</button>' : ""
    });
  }

  function deckRowHTML(m) {
    var href = deckHref(m.sheet.id);
    var title = m.sheet.title;
    var category = m.category ? m.category.title : (m.area ? m.area.title : "");
    var chip = m.active
      ? '<span class="s-chip s-chip--accent">' + icon("play", 10) + 'En curso</span>'
      : (m.completed ? '<span class="s-chip s-chip--green">' + icon("checkCircle", 10) + 'Dominada</span>' : "");
    var errorBadge = m.stats.errors
      ? '<span class="deck-row-error">' + icon("alert", 11) + m.stats.errors + ' con error</span>' : "";
    var primary = m.active
      ? '<a class="s-btn s-btn--sm deck-row-cta" href="#/sesion" data-nav>' + icon("play", 12) + ' Continuar</a>'
      : '<a class="s-btn s-btn--ghost s-btn--sm deck-row-cta" href="' + href + '" data-nav>Abrir</a>';
    return '<li class="deck-row" data-deck="' + esc(m.sheet.id) + '" style="--area:' + esc(m.area ? m.area.accent : "var(--accent)") + '">' +
      '<a class="deck-row-link" href="' + href + '" data-nav aria-label="' +
        esc(title + ". " + category + ". " + pluralCards(m.stats.total) + ", " + m.stats.percent + " % de dominio, " + m.pending + " pendientes. " + m.last) + '">' +
        '<span class="deck-row-title">' + esc(title) + '</span>' +
        '<span class="deck-row-meta">' +
          '<span><b>' + m.stats.total + '</b> ' + plural(m.stats.total, "tarjeta", "tarjetas") + '</span>' +
          '<span><b>' + m.stats.percent + '%</b> dominio</span>' +
          '<span><b>' + m.pending + '</b> ' + plural(m.pending, "pendiente", "pendientes") + '</span>' +
          '<span class="deck-row-last">' + esc(m.last) + '</span>' +
          errorBadge +
        '</span>' +
      '</a>' +
      '<span class="deck-row-state">' + chip + '</span>' +
      '<span class="deck-row-actions">' + primary + rowMenuHTML(m) + '</span>' +
      '</li>';
  }

  function rowMenuHTML(m) {
    var id = esc(m.sheet.id);
    var items = [];
    if (m.pending > 0) items.push('<button type="button" data-action="start-session" data-mode="quick" data-deck="' + id + '">' + icon("rotate", 13) + '<span>Repaso rápido</span></button>');
    if (m.stats.errors) items.push('<button type="button" data-action="start-session" data-mode="errors" data-deck="' + id + '">' + icon("alert", 13) + '<span>Errores · ' + m.stats.errors + '</span></button>');
    items.push('<button type="button" data-action="start-session" data-mode="exam" data-deck="' + id + '"' + (m.stats.total ? "" : " disabled") + '>' + icon("target", 13) + '<span>Examen</span></button>');
    items.push('<button type="button" data-action="start-session" data-mode="free" data-deck="' + id + '">' + icon("cards", 13) + '<span>Estudio libre</span></button>');
    items.push('<a href="' + esc(dashboardHref(m.sheet.id, m.sheet.id)) + '">' + icon("book", 13) + '<span>Ficha resumen</span></a>');
    return '<details class="row-menu"><summary aria-label="Más acciones para ' + esc(m.sheet.title) + '" title="Más acciones">' + icon("menu", 14) + '</summary>' +
      '<div class="row-menu-panel">' + items.join("") + '</div></details>';
  }

  function areaDescriptionHTML(area) {
    var source = Store.getSource((area.sourceIds || [])[0]);
    return '<p class="lib-area-desc">' + esc(area.description || "") +
      (source ? ' <a class="lib-area-source" href="' + esc(source.file) + '" target="_blank" rel="noopener" title="' + esc(source.title) + '">' +
        icon("external", 11) + '<span>' + esc(source.short) + '</span></a>' : "") +
      '</p>';
  }

  function areaCategoriesHTML(group) {
    return areaDescriptionHTML(group.area) + group.categories.map(function (entry) {
      var count = entry.decks.length < entry.total
        ? entry.decks.length + ' de ' + pluralDecks(entry.total)
        : pluralDecks(entry.total);
      return '<div class="lib-cat">' +
        '<div class="lib-cat-head"><h3>' + esc(entry.category.title) + '</h3><span>' + count + '</span></div>' +
        '<ul class="lib-deck-list">' + entry.decks.map(deckRowHTML).join("") + '</ul>' +
        '</div>';
    }).join("");
  }

  function areaGroupHTML(group) {
    var area = group.area;
    var st = group.stats;
    var open = state.library.open.indexOf(area.id) >= 0;
    var filtering = state.library.filter !== "todas" || !!state.library.q || !!state.library.area;
    var deckText = filtering
      ? group.decks.length + ' de ' + pluralDecks(group.total)
      : pluralDecks(group.total);
    return '<details class="lib-area"' + (open ? " open" : "") + ' data-area-id="' + esc(area.id) + '" style="--area:' + esc(area.accent) + '">' +
      '<summary class="lib-area-sum">' +
        '<span class="lib-area-icon">' + icon(area.icon || "cards", 18) + '</span>' +
        '<span class="lib-area-copy"><b>' + esc(area.title) + '</b>' +
          '<small>' + group.categories.length + ' ' + plural(group.categories.length, "categoría", "categorías") +
          ' · ' + deckText + ' · ' + pluralCards(st.cards) + '</small></span>' +
        '<span class="lib-area-stats">' +
          '<span><b>' + st.percent + '%</b> dominio</span>' +
          '<span><b>' + st.pending + '</b> ' + plural(st.pending, "pendiente", "pendientes") + '</span>' +
          '<span class="lib-area-last">' + esc(st.last) + '</span>' +
        '</span>' +
        '<span class="lib-area-bar">' + miniBar(st.percent, "Dominio de " + area.title) + '</span>' +
        '<span class="lib-area-caret">' + icon("chevronDown", 16) + '</span>' +
      '</summary>' +
      /* El contenido de un grupo cerrado se genera al abrirlo: menos DOM y
         menos trabajo de cálculo en la portada. */
      '<div class="lib-area-body" data-area-body="' + esc(area.id) + '">' + (open ? areaCategoriesHTML(group) : "") + '</div>' +
      '</details>';
  }

  function libraryBodyHTML(model) {
    if (!model.shown) return libraryEmpty();
    return '<div class="lib-areas">' + model.areas.map(areaGroupHTML).join("") + '</div>';
  }

  function libHelpHTML() {
    return '<details class="lib-help">' +
      '<summary>' + icon("compass", 15) + '<span>Cuatro formas de practicar</span>' + icon("chevronDown", 14) + '</summary>' +
      '<p class="lib-help-intro">Practica con tarjetas que te obligan a recordar, aplicar y explicar. El repaso se adapta a lo que dominas y a lo que todavía necesita otra vuelta.</p>' +
      '<div class="lib-help-grid">' + Object.keys(MODES).map(function (key) {
        var m = MODES[key];
        return '<div class="lib-help-item"><span class="mode-icon">' + icon(m.icon, 17) + '</span>' +
          '<div><b>' + esc(m.label) + '</b><p>' + esc(m.description) + '</p></div></div>';
      }).join("") + '</div>' +
      '<p class="lib-help-note">' + icon("info", 13) + ' Las tarjetas nuevas no cuentan como error. Solo verás en «Errores» lo que hayas fallado de verdad. Sin rachas inventadas: solo tu actividad.</p>' +
      '</details>';
  }

  function renderDecks() {
    var totals = deckTotals();
    var active = Store.getFlashSession();
    if (!totals.total) return showEmptyContent();
    var model = computeLibrary();
    return [
      renderLibraryHero(totals, active, model),
      '<section class="lib-library" aria-labelledby="lib-title">',
        '<div class="lib-library-head"><div><span class="s-kicker"><span class="dot"></span>Mazos por área</span><h2 id="lib-title">Tu temario, en tarjetas</h2></div>' +
          '<span class="s-small s-muted">' + pluralDecks(model.all.length) + ' · ' + pluralCards(model.totalCards) + '</span></div>',
        renderLibraryTools(model),
        '<div id="library-body">' + libraryBodyHTML(model) + '</div>',
      '</section>',
      libHelpHTML(),
      '<section class="flash-quote">',
        '<span>' + icon("brain", 20) + '</span>',
        '<p>La sensación de haber leído no es lo mismo que poder recordarlo. Volver a intentarlo es parte del método.</p>',
      '</section>'
    ].join("");
  }

  function refreshLibraryBody(model) {
    suppressToggle = true;
    var body = qs("#library-body");
    if (body) body.innerHTML = libraryBodyHTML(model);
    var count = qs("#library-count");
    if (count) count.textContent = libraryCountText(model);
    var expand = qs(".lib-expand");
    if (expand) {
      var anyOpen = model.areas.some(function (g) { return state.library.open.indexOf(g.area.id) >= 0; });
      expand.setAttribute("data-action", anyOpen ? "collapse-all" : "expand-all");
      expand.setAttribute("aria-expanded", String(anyOpen));
      expand.innerHTML = icon(anyOpen ? "chevronDown" : "layers", 14) + (anyOpen ? ' Contraer áreas' : ' Expandir áreas');
    }
    qsa(".lib-seg [data-state]").forEach(function (btn) {
      var id = btn.getAttribute("data-state");
      btn.setAttribute("aria-pressed", String(state.library.filter === id));
      var badge = btn.querySelector("b");
      if (badge) badge.textContent = model.counts[id];
    });
    var select = qs("#lib-area");
    if (select) select.value = state.library.area;
    setTimeout(function () { suppressToggle = false; }, 0);
  }

  var AUTO_OPEN_LIMIT = 48;

  function applyLibrary(patch, opts) {
    if (state.route.name !== "decks") return;
    Object.assign(state.library, patch || {});
    var model = computeLibrary();
    var active = state.library.filter !== "todas" || !!state.library.q;
    if (opts && opts.autoOpen && active) {
      var matched = model.areas.filter(function (g) { return g.decks.length; }).map(function (g) { return g.area.id; });
      /* Conserva solo grupos con coincidencias y evita abrir 200 filas de golpe:
         con muchas coincidencias el resumen por área sigue siendo la guía. */
      state.library.open = state.library.open.filter(function (id) { return matched.indexOf(id) >= 0; });
      if (model.shown <= AUTO_OPEN_LIMIT) state.library.open = matched;
      else if (!state.library.open.length) state.library.open = matched.slice(0, 1);
    }
    refreshLibraryBody(model);
    replaceHash(libraryHash(state.library));
  }

  function clearLibrary() {
    var input = qs("#lib-search");
    if (input) input.value = "";
    state.library.filter = "todas";
    state.library.area = "";
    state.library.q = "";
    state.library.open = [];
    var model = computeLibrary();
    refreshLibraryBody(model);
    replaceHash("#/");
    if (input) input.focus();
  }

  function toggleAllAreas() {
    var model = computeLibrary();
    var anyOpen = model.areas.some(function (g) {
      return state.library.open.indexOf(g.area.id) >= 0;
    });
    state.library.open = anyOpen ? [] : model.areas.map(function (g) { return g.area.id; });
    refreshLibraryBody(model);
    replaceHash(libraryHash(state.library));
  }

  function closeRowMenus(except) {
    qsa("details.row-menu[open]").forEach(function (el) {
      if (el !== except) el.removeAttribute("open");
    });
  }

  function goLibrary() {
    var target = state.librarySaved.hash || "#/";
    state.restoreScroll = state.librarySaved.scroll || 0;
    if (location.hash === target) renderRoute({ scrollY: state.restoreScroll });
    else location.hash = target;
  }

  /* ------------------------------------------------------------------ */
  /* Vista de mazo                                                       */
  /* ------------------------------------------------------------------ */

  function modeButton(modeKey, deckId, primary) {
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
    return '<button class="mode-btn' + (primary ? " is-primary" : "") + (disabled ? " is-disabled" : "") + '" type="button" data-action="start-session" data-mode="' + modeKey + '" data-deck="' + esc(deckId) + '"' + (disabled ? ' disabled aria-disabled="true"' : '') + '>' +
      icon(m.icon, 17) +
      '<span class="mode-btn-copy"><b>' + esc(m.label) + '</b><small>' + (note || count + ' ' + plural(count, "tarjeta", "tarjetas")) + '</small></span>' +
      '</button>';
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
    var backHref = state.librarySaved.hash || libraryHash(state.library);
    var sessions = (Store.getState().sessions || []).filter(function (s) { return s.deckId === deck.id; }).slice(0, 3);
    var crumb = '<div class="deck-breadcrumb"><span class="deck-area-dot"></span><span>' + esc(area ? area.title : "") + '</span>' + icon("chevronRight", 12) +
      (category ? '<span>' + esc(category.title) + '</span>' + icon("chevronRight", 12) : '') +
      '<span>' + (deck.kind === "sheet" ? "Ficha" : "Mazo") + '</span></div>';
    var fichaHref = esc(sheet ? dashboardHref(sheet.id, deck.id) : "../study-dashboard/index.html");
    var backLink = '<div class="deck-topline">' +
      '<a class="flash-back" href="' + esc(backHref) + '" data-nav data-restore-library>' + icon("arrowLeft", 15) + ' Biblioteca</a>' +
      '<span class="deck-topline-actions">' +
        (active ? '<a class="s-btn s-btn--sm" href="#/sesion" data-nav>' + icon("play", 13) + ' Continuar sesión</a>' : '') +
        '<a class="s-btn s-btn--ghost s-btn--sm" href="' + fichaHref + '">' + icon("book", 14) + ' Ficha resumen</a>' +
      '</span></div>';
    var pending = pendingCount(deck.id, stats);

    if (!cards.length) {
      return '<div class="deck-view">' + backLink +
        '<section class="deck-head"><span class="s-kicker">' + esc(category ? category.short : area ? area.short : "") + '</span><h1>' + esc(deck.title) + '</h1><p>' + esc(deck.summary) + '</p></section>' +
        UI.emptyState({
          icon: "cards", title: "Este mazo todavía no tiene tarjetas",
          text: "La ficha resumen sí puede estar disponible. Consulta el temario o elige otro mazo para practicar.",
          actions: '<a class="s-btn" href="' + fichaHref + '">Consultar ficha resumen</a>' +
            '<a class="s-btn s-btn--ghost" href="' + esc(backHref) + '" data-nav data-restore-library>Elegir otro mazo</a>'
        }) + '</div>';
    }

    return [
      '<div class="deck-view">',
        backLink,
        '<header class="deck-head" style="--area:' + esc(area ? area.accent : "var(--accent)") + '">',
          crumb,
          '<h1>' + esc(deck.title) + '</h1>',
          '<p>' + esc(deck.summary) + '</p>',
          '<div class="deck-facts">',
            '<span><b>' + stats.total + '</b> ' + plural(stats.total, "tarjeta", "tarjetas") + '</span>',
            '<span><b>' + stats.reviewed + '</b> de ' + stats.total + ' revisadas</span>',
            '<span><b>' + stats.mastered + '</b> ' + plural(stats.mastered, "dominada", "dominadas") + '</span>',
            '<span><b>' + pending + '</b> ' + plural(pending, "pendiente", "pendientes") + '</span>',
            stats.errors ? '<span class="deck-fact-error"><b>' + stats.errors + '</b> con error</span>' : '',
            '<span class="deck-last">' + (stats.lastReviewAt ? 'Última práctica: ' + esc(UI.formatRelative(stats.lastReviewAt)) : 'Sin practicar todavía') + '</span>',
          '</div>',
          '<div class="deck-meter">' + miniBar(stats.percent, "Dominio de " + deck.title) + '<span>' + stats.percent + '% de dominio</span></div>',
          active ? '<p class="deck-live">' + icon("play", 12) + ' Sesión en curso · ' + esc(modeMeta(active.mode).short) + ' · tarjeta ' + (active.index + 1) + ' de ' + active.queue.length + '</p>' : '',
          '<div class="deck-modes">' + ["free", "quick", "exam", "errors"].map(function (m) {
            return modeButton(m, deck.id, !active && m === "free");
          }).join("") + '</div>',
        '</header>',

        '<section class="flash-section deck-cards-section">',
          '<div class="flash-section-head"><div><span class="s-kicker"><span class="dot"></span>Contenido</span><h2>Tarjetas del mazo</h2></div><span class="s-small s-muted">' + stats.newCards + ' ' + plural(stats.newCards, "nueva", "nuevas") + ' · ' + stats.reviewed + ' ' + plural(stats.reviewed, "revisada", "revisadas") + ' · ' + stats.mastered + ' ' + plural(stats.mastered, "dominada", "dominadas") + '</span></div>',
          '<div class="flash-card-list">' + cards.map(cardListRow).join("") + '</div>',
        '</section>',

        sessions.length ? '<section class="flash-section"><div class="flash-section-head"><div><span class="s-kicker"><span class="dot"></span>Reciente</span><h2>Últimas sesiones</h2></div><a class="s-link s-small" href="#/historial" data-nav>Ver historial</a></div><div class="session-mini-list">' + sessions.map(sessionMiniRow).join("") + '</div></section>' : '',

        '<p class="deck-note">' + icon("info", 14) + ' Las tarjetas nuevas no cuentan como error. Solo verás en «Errores» lo que hayas fallado de verdad.</p>',
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
      '<div class="session-header-left">' +
        '<a class="flash-back" href="' + deckHref(s.deckId) + '" data-nav>' + icon("arrowLeft", 15) + ' Volver al mazo</a>' +
        '<a class="session-library" href="#/" data-nav data-restore-library title="Volver a la biblioteca de mazos">' + icon("layers", 13) + ' Biblioteca</a>' +
      '</div>' +
      '<div class="session-header-meta"><span class="s-chip s-chip--accent">' + icon(m.icon, 12) + esc(m.label) + '</span><span class="session-deck-name">' + esc(deck.title) + '</span></div>' +
      '<button class="s-btn s-btn--ghost s-btn--sm" type="button" data-action="end-session">Terminar</button>' +
      '</div>' +
      '<div class="session-progress"><div class="session-progress-copy"><span>Tarjeta ' + (s.index + 1) + ' de ' + total + '</span>' +
        (s.mode === "exam" ? '<span>' + Object.keys(s.answers).length + ' respondidas</span>' : '<span>' + s.correct + ' correctas · ' + s.wrong + ' por reforzar</span>') +
      '</div>' + UI.progressBar(pct, "Avance de la sesión") + '</div>';
  }

  function prevButton(s) {
    if (!s || s.index <= 0) return "";
    return '<button class="s-btn s-btn--ghost s-btn--sm" type="button" data-action="prev" title="Tarjeta anterior (←)">' + icon("arrowLeft", 14) + ' Anterior</button>';
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
          '<p class="key-hint">' + icon("info", 13) + ' Intenta recordarlo antes de revelar. También puedes pulsar Espacio.</p></div>' +
          (s.index > 0 ? '<div class="session-actions session-actions--muted">' + prevButton(s) + '</div>' : '')
        );
      }
      var answerBlock = '<div class="answer-block"><span class="answer-label">Respuesta</span><p>' + esc(card.answer) + '</p>' +
        (card.explanation ? '<div class="answer-explanation"><b>Por qué importa</b><p>' + esc(card.explanation) + '</p></div>' : '') +
        sourceChips + fichaLink + '</div>';
      if (checked) {
        return cardShell(s, card, answerBlock + '<div class="session-actions">' + prevButton(s) + '<button class="s-btn" type="button" data-action="next">' + esc(nextLabel) + ' ' + icon("arrow", 15) + '</button></div>');
      }
      return cardShell(s, card, answerBlock + '<p class="rating-prompt">¿Cómo te fue al recordarlo?</p>' + ratingButtons() + '<div class="session-actions session-actions--muted">' + prevButton(s) + fichaLink + '</div>');
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
      actions = '<div class="session-actions">' + prevButton(s) + '<button id="session-primary" class="s-btn" type="button" data-action="exam-next"' + (selected == null ? " disabled" : "") + '>' + esc(nextLabel) + ' ' + icon("arrow", 15) + '</button></div>';
    } else if (checked) {
      actions = '<div class="session-actions">' + prevButton(s) + '<button class="s-btn" type="button" data-action="next">' + esc(nextLabel) + ' ' + icon("arrow", 15) + '</button>' + fichaLink + '</div>';
    } else {
      actions = '<div class="session-actions">' + prevButton(s) + '<button id="session-primary" class="s-btn" type="button" data-action="check"' + (selected == null ? " disabled" : "") + '>' + icon("check", 15) + ' Comprobar</button><span class="key-hint">' + icon("info", 13) + ' Selecciona una opción para comprobar.</span></div>';
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
        '<div class="summary-topline">' +
          (deck.kind === "missing" ? '' : '<a class="flash-back" href="' + deckHref(deck.id) + '" data-nav>' + icon("arrowLeft", 15) + ' Volver al mazo</a>') +
          '<a class="summary-library" href="#/" data-nav data-restore-library>' + icon("layers", 13) + ' Biblioteca</a>' +
        '</div>',
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

  var suppressToggle = false;
  var applySearch = UI.debounce(function () {
    var input = qs("#lib-search");
    if (!input) return;
    applyLibrary({ q: input.value.trim().slice(0, 80) }, { autoOpen: true });
  }, 180);

  function onLibraryInput(e) {
    if (state.route.name !== "decks") return;
    if (!e.target || e.target.id !== "lib-search") return;
    applySearch();
  }

  function onLibraryChange(e) {
    if (state.route.name !== "decks") return;
    if (!e.target || e.target.id !== "lib-area") return;
    applyLibrary({ area: e.target.value }, { autoOpen: true });
  }

  function onLibraryToggle(e) {
    var el = e.target;
    if (!el || !el.classList || suppressToggle) return;
    if (el.classList.contains("row-menu")) {
      if (el.open) {
        closeRowMenus(el);
        /* Si no cabe bajo la fila, el panel se abre hacia arriba. */
        el.classList.remove("is-up");
        var panel = el.querySelector(".row-menu-panel");
        if (panel && panel.getBoundingClientRect().bottom > window.innerHeight - 8) {
          el.classList.add("is-up");
        }
      }
      return;
    }
    if (!el.classList.contains("lib-area")) return;
    var id = el.getAttribute("data-area-id");
    if (!id) return;
    var list = state.library.open.slice();
    var at = list.indexOf(id);
    if (el.open && at < 0) list.push(id);
    else if (!el.open && at >= 0) list.splice(at, 1);
    state.library.open = list;
    if (el.open) {
      var body = el.querySelector("[data-area-body]");
      if (body && !body.innerHTML.trim()) {
        var model = computeLibrary();
        var group = model.areas.filter(function (g) { return g.area.id === id; })[0];
        body.innerHTML = group ? areaCategoriesHTML(group) : libraryEmpty();
      }
    }
    if (state.route.name === "decks") replaceHash(libraryHash(state.library));
    var expand = qs(".lib-expand");
    if (expand) {
      var anyOpen = qsa("details.lib-area[open]").length > 0;
      expand.setAttribute("data-action", anyOpen ? "collapse-all" : "expand-all");
      expand.setAttribute("aria-expanded", String(anyOpen));
      expand.innerHTML = icon(anyOpen ? "chevronDown" : "layers", 14) + (anyOpen ? ' Contraer áreas' : ' Expandir áreas');
    }
  }

  function onDocumentClick(e) {
    if (!e.target.closest(".row-menu")) closeRowMenus();
    var nav = e.target.closest("a[data-nav]");
    if (nav) {
      if (nav.hasAttribute("data-restore-library") && !(e.ctrlKey || e.metaKey || e.shiftKey)) {
        e.preventDefault();
        closeRowMenus();
        goLibrary();
        return;
      }
      var href = nav.getAttribute("href") || "";
      if (href && href.charAt(0) === "#" && href === location.hash) {
        e.preventDefault();
        renderRoute({ focus: false });
      }
      return;
    }
    var stateButton = e.target.closest("[data-state]");
    if (stateButton && state.route.name === "decks") {
      e.preventDefault();
      applyLibrary({ filter: stateButton.getAttribute("data-state") }, { autoOpen: true });
      return;
    }
    var el = e.target.closest("[data-action]");
    if (!el) return;
    var action = el.getAttribute("data-action");
    if (action === "expand-all" || action === "collapse-all") {
      toggleAllAreas();
    } else if (action === "clear-filters") {
      clearLibrary();
    } else if (action === "retry") {
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
    } else if (action === "prev") {
      previousCard();
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
    var inField = !!e.target.closest("input, textarea, select");
    if (state.route.name === "decks") {
      if (e.key === "/" && !inField) {
        e.preventDefault();
        var search = qs("#lib-search");
        if (search) search.focus();
        return;
      }
      if (e.key === "Escape") {
        closeRowMenus();
        var input = qs("#lib-search");
        if (input && input === document.activeElement) {
          if (input.value) {
            input.value = "";
            applyLibrary({ q: "" }, { autoOpen: true });
          } else input.blur();
        }
        return;
      }
      return;
    }
    if (state.route.name !== "session") return;
    if (inField) return;
    var s = currentSession();
    var card = currentCard(s);
    if (!s || !card) return;
    var key = e.key;

    if (key === "ArrowLeft") {
      if (s.index > 0) {
        e.preventDefault();
        previousCard();
      }
      return;
    }
    if (key === "ArrowRight") {
      if (answerFor(s, card.id)) {
        e.preventDefault();
        advanceSession();
      }
      return;
    }

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

  /* Retira solo los parámetros de entrada ya consumidos: el resto del
     contexto legítimo (por ejemplo, un origen compartido) se conserva. */
  function cleanEntryQuery() {
    try {
      var u = new URL(location.href);
      ["deck", "mode", "resume", "sheet", "from"].forEach(function (key) {
        u.searchParams.delete(key);
      });
      var rest = u.searchParams.toString();
      history.replaceState(null, "", u.pathname + (rest ? "?" + rest : "") + u.hash);
    } catch (e) { UI.cleanQuery(); }
  }

  function readEntry() {
    var deck = UI.getQuery("deck");
    var mode = UI.getQuery("mode");
    var resume = UI.getQuery("resume");
    var sheet = UI.getQuery("sheet");
    var origin = readOrigin();
    if (sheet) state.returnSheet = sheet;
    else if (origin) state.returnSheet = origin.sheet || "";
    if (deck || sheet) rememberOrigin(sheet || state.returnSheet, deck || (origin && origin.deck) || "");
    cleanEntryQuery();
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
    var entryExists = entry.deck && (Store.getSheet(entry.deck) || Store.getTopic(entry.deck));
    var entryDeck = entryExists ? deckInfo(entry.deck) : (entry.deck ? { kind: "missing" } : null);
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
      replaceHash("#/");
      state.notice = "El mazo guardado ya no está disponible; elige otro en la biblioteca.";
    } else if (!initialHash || initialHash === "#") {
      replaceHash("#/");
    }

    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("input", onLibraryInput);
    document.addEventListener("change", onLibraryChange);
    document.addEventListener("toggle", onLibraryToggle, true);
    window.addEventListener("hashchange", function () {
      if (state.route.name === "decks") {
        state.librarySaved = { hash: libraryHash(state.library), scroll: window.scrollY };
      }
      renderRoute({ focus: true });
    });
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
