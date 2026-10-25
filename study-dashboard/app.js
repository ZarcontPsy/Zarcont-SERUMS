/* Study Dashboard — interfaz de organización, lectura y progreso */
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

  var state = {
    route: { name: "home" },
    libraryQuery: "",
    libraryFilter: "all",
    libraryArea: "",
    libraryCategory: "",
    currentSheetId: null,
    readStarted: 0,
    scrollRatio: 0,
    forceScrollY: null,
    initialSheet: "",
    fromFlashcards: false,
    fromDeck: "",
    entrySheetId: "",
    pendingNotice: "",
    restoring: false,
    restoreRatio: 0,
    restoreTimer: null,
    suppressScrollRestore: false,
    /* Estado de interfaz de la sesión: qué temas están desplegados. */
    openTopics: {}
  };

  var MODE_KEY = "study-dashboard-mode";

  function mode() {
    try {
      var m = localStorage.getItem(MODE_KEY);
      return m === "full" ? "full" : "quick";
    } catch (e) { return "quick"; }
  }
  function setMode(value) {
    try { localStorage.setItem(MODE_KEY, value === "full" ? "full" : "quick"); } catch (e) {}
  }
  function sheetHref(id) { return "#/ficha/" + encodeURIComponent(id); }
  function cleanQueryTo(hash) {
    try {
      var u = new URL(location.href);
      u.search = "";
      u.hash = hash || "";
      history.replaceState(null, "", u.pathname + u.search + u.hash);
    } catch (e) {
      if (hash) location.hash = hash;
    }
  }
  function flashcardsHref(deckId, fmode, sheetId) {
    try {
      var u = new URL("../study-flashcards/index.html", location.href);
      if (deckId) u.searchParams.set("deck", deckId);
      if (fmode) u.searchParams.set("mode", fmode);
      if (sheetId) u.searchParams.set("sheet", sheetId);
      u.searchParams.set("from", "dashboard");
      return u.href;
    } catch (e) { return "../study-flashcards/index.html"; }
  }
  function parseRoute() {
    var raw = location.hash.replace(/^#\/?/, "");
    if (!raw) return { name: "home" };
    var parts = raw.split("/").filter(Boolean).map(function (p) {
      try { return decodeURIComponent(p); } catch (e) { return p; }
    });
    if (parts[0] === "ficha" && parts[1]) return { name: "sheet", sheetId: parts[1] };
    if (parts[0] === "biblioteca") return { name: "library", areaId: parts[1] || "", categoryId: parts[2] || "" };
    if (parts[0] === "progreso") return { name: "progress" };
    return { name: "notfound" };
  }
  function isArea(id) {
    return !!(id && TAX ? TAX.canonicalAreaId(id) : C && C.areas.some(function (a) { return a.id === id; }));
  }
  function topicTitle(id) {
    var t = Store.getTopic(id);
    return t ? t.title : "";
  }
  function primaryAreas() {
    return TAX && TAX.primaryAreas().length ? TAX.primaryAreas() : C.areas;
  }
  function primaryArea(id) {
    if (!id) return null;
    if (TAX) {
      var canonical = TAX.canonicalAreaId(id);
      return canonical ? TAX.area(canonical) : null;
    }
    return Store.getArea(id);
  }
  function categoriesOf(areaId) {
    return TAX ? TAX.categoriesForArea(areaId) : [];
  }
  function categoryOf(id) {
    return TAX ? TAX.category(id) : null;
  }
  function categoryOfSheet(sheet) {
    return sheet && TAX ? TAX.categoryForSheet(sheet) : null;
  }
  function primaryAreaForSheet(sheet) {
    if (!sheet) return null;
    return primaryArea(sheet.primaryAreaId || sheet.areaId);
  }
  function primaryAreaForTopic(topic) {
    if (!topic) return null;
    return primaryArea(topic.primaryAreaId || topic.areaId);
  }
  function sheetsOfArea(areaId) {
    return C.sheets.filter(function (s) { return (s.primaryAreaId || s.areaId) === areaId; });
  }
  function sheetsOfCategory(categoryId) {
    return C.sheets.filter(function (s) { return s.categoryId === categoryId; });
  }
  function categoryStats(categoryId) {
    var sheets = sheetsOfCategory(categoryId);
    var completed = 0, viewed = 0;
    var topicIds = {};
    var official = 0;
    sheets.forEach(function (s) {
      var st = Store.getSheetState(s.id);
      if (st && st.completedAt) completed += 1;
      if (st && st.viewedAt) viewed += 1;
      var topic = Store.getTopic(s.topicId);
      if (topic && topic.isContainer) official += 1;
      else if (s.topicId) topicIds[s.topicId] = true;
    });
    return {
      sheets: sheets.length,
      topics: Object.keys(topicIds).length,
      official: official,
      completed: completed,
      viewed: viewed,
      percent: sheets.length ? Math.round((completed / sheets.length) * 100) : 0
    };
  }
  function categoryMeta(st) {
    if (st.topics && st.official) return st.topics + " " + plural(st.topics, "tema", "temas") + " + " + st.official + " " + plural(st.official, "ficha oficial", "fichas oficiales") + " · " + st.sheets + " " + plural(st.sheets, "ficha", "fichas");
    if (st.official && !st.topics) return st.official + " " + plural(st.official, "ficha oficial", "fichas oficiales") + " · " + st.sheets + " " + plural(st.sheets, "ficha", "fichas");
    return st.topics + " " + plural(st.topics, "tema", "temas") + " · " + st.sheets + " " + plural(st.sheets, "ficha", "fichas");
  }
  function plural(n, one, many) { return UI.plural(n, one, many); }

  function showError(message) {
    boot.hidden = true;
    root.hidden = false;
    root.innerHTML = [
      '<section class="dash-error">',
      UI.emptyState({
        icon: "alert",
        title: "No se pudo cargar el dashboard",
        text: message || "Revisa que los archivos de contenido estén disponibles y vuelve a intentarlo.",
        actions: '<button class="s-btn" type="button" data-action="retry">' + icon("rotate", 16) + ' Volver a intentar</button>' +
          '<a class="s-btn s-btn--ghost" href="../index.html">Ir al HUB</a>'
      }),
      "</section>"
    ].join("");
  }

  function showEmptyContent() {
    boot.hidden = true;
    root.hidden = false;
    root.innerHTML = UI.emptyState({
      icon: "book",
      title: "Todavía no hay fichas disponibles",
      text: "El temario compartido no tiene contenido para mostrar. Puedes volver al HUB o abrir Study Flashcards para revisar si hay mazos disponibles.",
      actions: '<a class="s-btn" href="../study-flashcards/index.html">Abrir Study Flashcards</a><a class="s-btn s-btn--ghost" href="../index.html">Volver al HUB</a>'
    });
  }

  function mountStaticIcons() {
    qsa("[data-icon]").forEach(function (el) {
      var size = Number(el.getAttribute("data-size")) || 18;
      el.innerHTML = icon(el.getAttribute("data-icon"), size);
    });
  }

  function setActiveNav() {
    qsa(".s-navlink").forEach(function (a) {
      var r = a.getAttribute("data-route");
      var active = r === state.route.name ||
        (r === "library" && state.route.name === "sheet");
      if (active) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  function announce(text) {
    if (!live) return;
    live.textContent = "";
    window.setTimeout(function () { live.textContent = text; }, 40);
  }

  function flushReading() {
    if (!state.currentSheetId || !state.readStarted) return;
    var seconds = Math.round((Date.now() - state.readStarted) / 1000);
    state.readStarted = Date.now();
    if (seconds >= 3) Store.recordSheetTime(state.currentSheetId, seconds);
    saveScroll();
  }
  function scrollMax() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }
  function cancelScrollRestore() {
    state.restoring = false;
    state.restoreRatio = 0;
    if (state.restoreTimer) {
      window.clearTimeout(state.restoreTimer);
      state.restoreTimer = null;
    }
  }
  function applyScrollRatio(ratio) {
    var max = scrollMax();
    if (max <= 120) return;
    scrollToInstant(Math.round(Math.max(0, Math.min(1, ratio)) * max));
  }
  /* base.css define scroll-behavior:smooth; la navegación y la restauración
     deben ser inmediatas para no guardar posiciones intermedias. */
  function scrollToInstant(top) {
    var el = document.documentElement;
    var previous = el.style.scrollBehavior;
    el.style.scrollBehavior = "auto";
    window.scrollTo(0, Math.max(0, top));
    if (previous) el.style.scrollBehavior = previous;
    else el.style.removeProperty("scroll-behavior");
  }
  /* Restaura la lectura cuando el layout ya está estable (doble rAF, fuentes y
     un margen de seguridad). Mientras dura, no se guarda la posición provisional. */
  function restoreScroll(ratio) {
    cancelScrollRestore();
    state.restoring = true;
    state.restoreRatio = Math.max(0, Math.min(1, Number(ratio) || 0));
    var reposition = function () {
      if (!state.restoring) return;
      applyScrollRatio(state.restoreRatio);
    };
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        reposition();
        if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === "function") {
          document.fonts.ready.then(reposition, function () {});
        }
      });
    });
    state.restoreTimer = window.setTimeout(function () {
      if (!state.restoring) return;
      reposition();
      state.restoring = false;
      state.restoreRatio = 0;
      state.restoreTimer = null;
    }, 900);
  }
  function saveScroll() {
    if (!state.currentSheetId || state.restoring) return;
    var max = scrollMax();
    if (max <= 120) return;
    var ratio = Math.max(0, Math.min(1, window.scrollY / max));
    var st = Store.getSheetState(state.currentSheetId);
    if (!st || Math.abs((st.scroll || 0) - ratio) > 0.025) {
      state.scrollRatio = ratio;
      Store.setSheetScroll(state.currentSheetId, ratio);
    }
  }
  function recordScrollOnly() {
    if (!state.currentSheetId) return;
    if (state.restoring) {
      /* Un desplazamiento real del usuario cancela la restauración en curso. */
      var expected = Math.round(state.restoreRatio * scrollMax());
      if (Math.abs(window.scrollY - expected) > 24) cancelScrollRestore();
      else return;
    }
    var max = scrollMax();
    if (max <= 120) return;
    state.scrollRatio = Math.max(0, Math.min(1, window.scrollY / max));
  }

  function renderRoute(opts) {
    opts = opts || {};
    cancelScrollRestore();
    var route = parseRoute();
    if (state.currentSheetId && !(route.name === "sheet" && route.sheetId === state.currentSheetId)) {
      flushReading();
      state.currentSheetId = null;
    }
    state.route = route;
    setActiveNav();

    var y = opts.scrollY != null ? opts.scrollY : 0;
    var resumeSheet = opts.resumeSheet || null;
    var resumeRatio = null;

    if (route.name === "home") {
      document.title = "Study Dashboard · SERUMS";
      root.innerHTML = renderHome();
    } else if (route.name === "library") {
      var canonicalArea = route.areaId ? (TAX ? TAX.canonicalAreaId(route.areaId) : route.areaId) : "";
      var routeCategory = route.categoryId ? categoryOf(route.categoryId) : null;
      if (route.areaId && !canonicalArea) {
        document.title = "Área no encontrada · Study Dashboard";
        root.innerHTML = renderNotFound("Esa área no existe", "Puede que el enlace esté incompleto o que el contenido haya cambiado. Las cinco áreas oficiales siguen disponibles.");
      } else if (routeCategory && routeCategory.areaId !== canonicalArea) {
        document.title = "Categoría no encontrada · Study Dashboard";
        root.innerHTML = renderNotFound("Esa categoría no pertenece al área", "El enlace mezcla un área y una categoría distintas. Vuelve a la biblioteca para elegir una ruta válida.");
      } else {
        if (canonicalArea && canonicalArea !== route.areaId) {
          var canonicalHash = "#/biblioteca/" + canonicalArea + (route.categoryId ? "/" + route.categoryId : "");
          try { history.replaceState(null, "", canonicalHash); } catch (e) { location.hash = canonicalHash; }
          route.areaId = canonicalArea;
          state.route = route;
        }
        state.libraryArea = canonicalArea;
        state.libraryCategory = routeCategory ? routeCategory.id : "";
        var libraryArea = primaryArea(state.libraryArea);
        var libraryCategory = categoryOf(state.libraryCategory);
        document.title = (libraryCategory ? libraryCategory.title : libraryArea ? libraryArea.title : "Biblioteca") + " · Study Dashboard";
        root.innerHTML = renderLibrary();
        updateLibraryResults();
      }
    } else if (route.name === "sheet") {
      var sheet = Store.getSheet(route.sheetId);
      if (!sheet) {
        document.title = "Ficha no encontrada · Study Dashboard";
        root.innerHTML = renderNotFound("Esta ficha no está disponible", "Puede que el enlace no corresponda a una ficha del temario actual. Estas son algunas alternativas para continuar.");
      } else {
        document.title = sheet.title + " · Study Dashboard";
        var isNew = state.currentSheetId !== sheet.id;
        if (isNew) {
          state.currentSheetId = sheet.id;
          Store.recordSheetView(sheet.id, sheet.topicId);
          state.scrollRatio = (Store.getSheetState(sheet.id) || {}).scroll || 0;
          state.readStarted = Date.now();
        }
        var restore = resumeSheet === sheet.id ||
          (opts.restoreScroll && opts.scrollY == null && isNew && state.scrollRatio > 0.02);
        root.innerHTML = renderSheet(sheet, restore);
        if (restore) resumeRatio = state.scrollRatio;
      }
    } else if (route.name === "progress") {
      document.title = "Mi progreso · Study Dashboard";
      root.innerHTML = renderProgress();
    } else {
      document.title = "Página no encontrada · Study Dashboard";
      root.innerHTML = renderNotFound("No encontramos esta página", "El enlace puede estar incompleto. Vuelve al panel o explora la biblioteca.");
    }

    boot.hidden = true;
    root.hidden = false;
    if (state.forceScrollY != null) {
      y = state.forceScrollY;
      state.forceScrollY = null;
    }
    if (resumeRatio != null) {
      restoreScroll(resumeRatio);
    } else {
      window.requestAnimationFrame(function () {
        if (state.restoring) return;
        scrollToInstant(y);
      });
    }
    if (opts.focus) {
      var h = root.querySelector("h1");
      if (h) {
        h.setAttribute("tabindex", "-1");
        h.focus({ preventScroll: true });
      } else {
        main.focus({ preventScroll: true });
      }
    }
  }

  function rerenderPreserve() {
    state.forceScrollY = window.scrollY;
    renderRoute({ scrollY: window.scrollY });
  }

  /* ------------------------------------------------------------------ */
  /* Panel                                                               */
  /* ------------------------------------------------------------------ */

  function compileAreaStats(areaId) {
    var sheets = sheetsOfArea(areaId);
    var completed = 0, viewed = 0, moduleIds = {};
    sheets.forEach(function (s) {
      var st = Store.getSheetState(s.id);
      if (st && st.completedAt) completed += 1;
      if (st && st.viewedAt) viewed += 1;
      moduleIds[s.topicId] = true;
    });
    var categories = categoriesOf(areaId);
    var modules = Object.keys(moduleIds).length;
    return {
      categories: categories.length,
      modules: modules,
      topics: modules,
      sheets: sheets.length,
      completed: completed,
      viewed: viewed,
      percent: sheets.length ? Math.round((completed / sheets.length) * 100) : 0
    };
  }

  function categoryChips(areaId, limit) {
    var cats = categoriesOf(areaId);
    var shown = typeof limit === "number" ? cats.slice(0, limit) : cats;
    var html = shown.map(function (cat) {
      return '<span class="area-cat">' + esc(cat.short) + '</span>';
    }).join("");
    if (typeof limit === "number" && cats.length > limit) {
      html += '<span class="area-cat is-more">+' + (cats.length - limit) + '</span>';
    }
    return html;
  }

  function areaCard(area) {
    var a = compileAreaStats(area.id);
    var source = Store.getSource((area.sourceIds || [])[0]);
    return '<a class="area-card" href="#/biblioteca/' + esc(area.id) + '" data-nav style="--area:' + esc(area.accent) + '">' +
      '<span class="area-icon">' + icon(area.icon || "book", 19) + '</span>' +
      '<span class="area-kicker">' + esc(source ? source.short : "Temario oficial") + ' · ' + a.categories + ' categorías</span>' +
      '<h3>' + esc(area.title) + '</h3>' +
      '<p>' + esc(area.description) + '</p>' +
      '<span class="area-cats">' + categoryChips(area.id, 3) + '</span>' +
      '<span class="area-meta">' + a.modules + ' módulos · ' + a.sheets + ' fichas</span>' +
      UI.progressBar(a.percent, "Progreso de " + area.title) +
      '<span class="area-foot"><span>' + (a.completed ? a.completed + " de " + a.sheets + " completadas" : "Sin empezar") + '</span>' + icon("arrow", 15) + '</span>' +
      '</a>';
  }

  function categoryCard(category, area) {
    var st = categoryStats(category.id);
    return '<a class="category-card" href="#/biblioteca/' + esc(area.id) + '/' + esc(category.id) + '" data-nav style="--area:' + esc(area.accent) + '">' +
      '<span class="category-card-kicker">' + esc(category.short) + '</span>' +
      '<h3>' + esc(category.title) + '</h3>' +
      '<p>' + esc(category.description) + '</p>' +
      '<span class="category-card-meta">' + esc(categoryMeta(st)) + '</span>' +
      UI.progressBar(st.percent, "Progreso de " + category.title) +
      '<span class="category-card-foot"><span>' + (st.completed ? st.completed + " de " + st.sheets + " completadas" : "Sin empezar") + '</span>' + icon("arrow", 13) + '</span>' +
      '</a>';
  }

  function goalCard(stats) {
    var goal = stats.goal || 2;
    var done = stats.today.sheetsCompleted || 0;
    var pct = Math.min(100, Math.round((done / goal) * 100));
    return '<section class="dash-goal" aria-labelledby="goal-title">' +
      '<div class="dash-goal-head">' +
        '<div><span class="s-kicker"><span class="dot"></span>Objetivo de hoy</span><h2 id="goal-title">' + done + ' de ' + goal + ' fichas</h2></div>' +
        '<span class="goal-ring" style="--p:' + pct + '"><span>' + pct + '%</span></span>' +
      '</div>' +
      UI.progressBar(pct, "Objetivo diario") +
      '<p class="s-small s-soft">' + (done >= goal ? "Objetivo cumplido. Puedes seguir leyendo o practicar." : "Un paso corto también cuenta. Elige una ficha y empieza.") + '</p>' +
      '<div class="goal-controls">' +
        '<button class="s-iconbtn goal-step" type="button" data-action="goal-step" data-step="-1" aria-label="Bajar el objetivo diario">−</button>' +
        '<span class="s-small"><b>' + goal + '</b> fichas / día</span>' +
        '<button class="s-iconbtn goal-step" type="button" data-action="goal-step" data-step="1" aria-label="Subir el objetivo diario">+</button>' +
      '</div>' +
      '<div class="goal-today"><span>' + stats.today.sheetsViewed + ' vistas hoy</span><span>' + stats.today.cardReviews + ' tarjetas repasadas</span></div>' +
      '</section>';
  }

  function recCard(rec) {
    var isFlash = rec.kind === "flashcards";
    var href = isFlash ? flashcardsHref(rec.deckId, rec.mode, "") : sheetHref(rec.sheetId);
    var iconName = isFlash ? (rec.mode === "errors" ? "alert" : "cards") : "book";
    var kind = isFlash ? (rec.mode === "errors" ? "Refuerzo" : "Práctica activa") : "Lectura";
    return '<a class="rec-card" href="' + esc(href) + '">' +
      '<span class="rec-icon">' + icon(iconName, 19) + '</span>' +
      '<span class="rec-copy"><span class="rec-kind">' + esc(kind) + '</span>' +
      '<h3>' + esc(rec.title) + '</h3>' +
      '<p>' + esc(rec.text) + '</p>' +
      '<span class="rec-action">' + esc(rec.action) + ' ' + icon("arrow", 14) + '</span></span>' +
      '</a>';
  }

  function renderHome() {
    var st = Store.getDashboardStats();
    var recs = Store.getRecommendations();
    var last = st.lastSheet;
    var lastSheet = last && last.sheetId ? Store.getSheet(last.sheetId) : null;
    var lastTopic = lastSheet ? Store.getTopic(lastSheet.topicId) : null;
    var resumeHref = lastSheet ? sheetHref(lastSheet.id) : "#/biblioteca";
    var resumeTitle = lastSheet ? lastSheet.title : "Elige tu primera ficha";
    var resumeText = lastSheet
      ? (last.context || (lastTopic ? lastTopic.title : "Continúa tu recorrido")) + " · " + UI.formatRelative(last.at)
      : "No hay actividad previa. La biblioteca está organizada por áreas y temas para que empieces por donde necesites.";
    var resumeAction = lastSheet ? "Retomar lectura" : "Explorar el temario";
    var lastArea = lastSheet ? primaryAreaForSheet(lastSheet) : null;
    var lastCategory = lastSheet ? categoryOfSheet(lastSheet) : null;
    var heroKicker = st.hasActivity ? "Continúa donde lo dejaste" : "Temario oficial SERUMS 2026-II";
    var heroTitle = st.hasActivity ? "Aprender también es volver." : "Cinco áreas. Un mapa claro.";
    var heroText = st.hasActivity
      ? "Tu progreso se construye ficha a ficha. Retoma la lectura, revisa tus pendientes y convierte lo aprendido en práctica."
      : "Las cinco áreas oficiales de Psicología organizan " + st.totalTopics + " módulos y " + st.totalSheets + " fichas. Entra por el área que necesitas y avanza por sus categorías.";

    var areas = primaryAreas().map(areaCard).join("");
    var today = st.today;
    var streakText = st.streak > 0 ? st.streak + (st.streak === 1 ? " día" : " días") : "—";

    return [
      '<section class="dash-hero">',
        '<div class="hero-copy">',
          '<span class="s-kicker"><span class="dot"></span>' + esc(heroKicker) + '</span>',
          '<h1>' + esc(heroTitle) + '</h1>',
          '<p>' + esc(heroText) + '</p>',
          '<div class="hero-actions">',
            '<a class="s-btn s-btn--lg" href="' + esc(resumeHref) + '"' + (lastSheet ? ' data-nav' : '') + '>' + icon(lastSheet ? "book" : "compass", 17) + ' ' + esc(resumeAction) + '</a>',
            '<a class="s-btn s-btn--ghost s-btn--lg" href="' + esc(flashcardsHref("", "free", "")) + '">' + icon("cards", 16) + ' Abrir flashcards</a>',
          '</div>',
          '<div class="hero-stats">',
            '<div><b>' + st.completedSheets + '</b><span>de ' + st.totalSheets + ' fichas</span></div>',
            '<div><b>' + st.reviewedCards + '</b><span>tarjetas revisadas</span></div>',
            '<div><b>' + esc(streakText) + '</b><span>racha de estudio</span></div>',
          '</div>',
        '</div>',
        '<div class="hero-aside">',
          '<div class="hero-orb" style="--p:' + st.percent + '" aria-label="' + st.percent + '% del temario completado">',
            '<div class="hero-orb-inner"><b>' + st.percent + '%</b><span>del temario</span></div>',
          '</div>',
          '<div class="hero-aside-note">' + icon("layers", 15) + '<span>' + st.startedTopics + ' de ' + st.totalTopics + ' temas iniciados</span></div>',
          '<div class="hero-aside-line"></div>',
          '<div class="hero-aside-note">' + icon("target", 15) + '<span>' + (today.sheetsViewed ? today.sheetsViewed + ' fichas vistas hoy' : 'Sin lecturas hoy') + '</span></div>',
        '</div>',
      '</section>',

      '<section class="dash-section dash-areas">',
        '<div class="dash-section-head">',
          '<div><span class="s-kicker"><span class="dot"></span>5 áreas oficiales</span><h2>El temario, en cinco áreas.</h2></div>',
          '<span class="s-small s-muted">20 categorías · ' + st.totalTopics + ' módulos · ' + st.totalSheets + ' fichas</span>',
        '</div>',
        '<div class="area-grid">' + areas + '</div>',
      '</section>',

      '<section class="dash-resume-grid">',
        '<a class="resume-card" href="' + esc(resumeHref) + '"' + (lastSheet ? ' data-nav' : '') + '>',
          '<span class="resume-label">' + icon(lastSheet ? "play" : "spark", 14) + (lastSheet ? " Último punto de trabajo" : " Empieza aquí") + '</span>',
          '<h2>' + esc(resumeTitle) + '</h2>',
          '<p>' + esc(resumeText) + '</p>',
          '<span class="resume-cta">' + esc(resumeAction) + ' ' + icon("arrow", 15) + '</span>',
          lastSheet ? '<span class="resume-area" style="--area:' + esc((lastArea || {}).accent || "var(--accent)") + '">' + esc(lastArea ? (lastCategory ? lastCategory.short : lastArea.short) : "") + '</span>' : "",
        '</a>',
        goalCard(st),
      '</section>',

      '<section class="dash-section">',
        '<div class="dash-section-head">',
          '<div><span class="s-kicker"><span class="dot"></span>Ruta de hoy</span><h2>Recomendaciones</h2></div>',
          '<a class="dash-textlink" href="#/biblioteca" data-nav>Ver biblioteca ' + icon("arrow", 14) + '</a>',
        '</div>',
        '<div class="rec-grid">' + recs.map(recCard).join("") + '</div>',
      '</section>',

      '<section class="dash-quote">',
        '<span class="dash-quote-mark">' + icon("quote", 22) + '</span>',
        '<p>Estudiar no es acumular páginas. Es poder explicar, aplicar y volver a lo que todavía no está firme.</p>',
        '<span class="s-small s-muted">Una nota para tu proceso</span>',
      '</section>'
    ].join("");
  }

  /* ------------------------------------------------------------------ */
  /* Biblioteca                                                          */
  /* ------------------------------------------------------------------ */

  function renderLibrary() {
    var area = state.libraryArea ? primaryArea(state.libraryArea) : null;
    var cat = state.libraryCategory ? categoryOf(state.libraryCategory) : null;
    var filters = [
      ["all", "Todas"], ["progress", "En curso"], ["completed", "Completadas"], ["favorites", "Favoritas"]
    ];
    var filterHTML = filters.map(function (f) {
      return '<button type="button" data-action="library-filter" data-filter="' + f[0] + '" aria-pressed="' + (state.libraryFilter === f[0]) + '">' + f[1] + '</button>';
    }).join("");
    var kicker = cat ? (area ? area.title : "Categoría") : area ? "Área oficial · " + categoriesOf(area.id).length + " categorías" : "Temario oficial SERUMS 2026-II";
    var title = cat ? cat.title : area ? area.title : "Las cinco áreas del temario";
    var description = cat ? cat.description : area ? area.description :
      "Las cinco áreas oficiales de Psicología organizan 20 categorías, " + C.topics.length + " módulos y " + C.sheets.length + " fichas. Entra por un área, recorre sus categorías y abre la ficha que necesites.";
    var context = "";
    if (cat && area) {
      context = '<div class="library-context"><a href="#/biblioteca/' + esc(area.id) + '" data-nav class="s-chip s-chip--accent">' + icon("grid", 12) + esc(area.short) + '</a>' +
        '<a href="#/biblioteca/' + esc(area.id) + '" data-nav class="dash-textlink">Todas las categorías ' + icon("arrowLeft", 12) + '</a>' +
        '<a href="#/biblioteca" data-nav class="dash-textlink">Biblioteca completa ' + icon("close", 12) + '</a></div>';
    } else if (area) {
      context = '<div class="library-context"><span class="s-chip s-chip--accent">' + icon("layers", 12) + categoriesOf(area.id).length + ' categorías</span>' +
        '<a href="#/biblioteca" data-nav class="dash-textlink">Ver las cinco áreas ' + icon("close", 12) + '</a></div>';
    }
    return [
      '<section class="library-head">',
        '<span class="s-kicker"><span class="dot"></span>' + esc(kicker) + '</span>',
        '<h1>' + esc(title) + '</h1>',
        '<p>' + esc(description) + '</p>',
        '<div class="library-tools">',
          '<label class="search-field" for="library-search">' + icon("search", 17) +
            '<input id="library-search" type="search" autocomplete="off" placeholder="Buscar tema, ficha o concepto" value="' + esc(state.libraryQuery) + '">' +
            '<span class="s-kbd search-kbd">/</span>' +
          '</label>',
          '<div class="s-seg library-filters" role="group" aria-label="Filtrar temas">' + filterHTML + '</div>',
        '</div>',
        context,
      '</section>',
      '<div id="library-summary" class="library-summary" aria-live="polite"></div>',
      '<div id="library-results"></div>'
    ].join("");
  }

  function scopeSheets() {
    var sheets = C.sheets;
    if (state.libraryArea) {
      sheets = sheets.filter(function (s) { return (s.primaryAreaId || s.areaId) === state.libraryArea; });
    }
    if (state.libraryCategory) {
      sheets = sheets.filter(function (s) { return s.categoryId === state.libraryCategory; });
    }
    return sheets;
  }

  function sheetSearchText(sheet) {
    return [sheet.title, sheet.summary, (sheet.keyConcepts || []).join(" "), sheet.kicker || ""].join(" ").toLowerCase();
  }

  function topicSearchText(topic) {
    var area = primaryAreaForTopic(topic);
    var cat = categoryOf(topic.categoryId);
    return [topic.title, topic.summary, (topic.keywords || []).join(" "), area ? area.title : "", cat ? cat.title : ""].join(" ").toLowerCase();
  }

  function passesLibraryFilter(sheet) {
    var st = Store.getSheetState(sheet.id);
    if (state.libraryFilter === "progress") return !!(st && st.viewedAt && !st.completedAt);
    if (state.libraryFilter === "completed") return !!(st && st.completedAt);
    if (state.libraryFilter === "favorites") return !!(st && st.favorite);
    return true;
  }

  function filteredGroups() {
    var q = state.libraryQuery.trim().toLowerCase();
    var scoped = scopeSheets();
    var buckets = {};
    scoped.forEach(function (sheet) {
      (buckets[sheet.topicId] = buckets[sheet.topicId] || []).push(sheet);
    });
    var groups = [];
    primaryAreas().forEach(function (area) {
      categoriesOf(area.id).forEach(function (cat) {
        C.topics.forEach(function (topic) {
          if (topic.isContainer) return;
          var all = (buckets[topic.id] || []).filter(function (s) { return s.categoryId === cat.id; });
          if (!all.length) return;
          var matching = all;
          if (q) {
            var topicHit = topicSearchText(topic).indexOf(q) !== -1;
            var sheetHits = all.filter(function (s) { return sheetSearchText(s).indexOf(q) !== -1; });
            if (!topicHit && !sheetHits.length) return;
            matching = topicHit && !sheetHits.length ? all : sheetHits;
          }
          if (state.libraryFilter !== "all") {
            matching = matching.filter(passesLibraryFilter);
            if (!matching.length) return;
          }
          groups.push({ area: area, category: cat, topic: topic, sheets: matching });
        });

        var containerSheets = scoped.filter(function (s) {
          if (s.categoryId !== cat.id) return false;
          var t = Store.getTopic(s.topicId);
          return !!(t && t.isContainer);
        });
        if (containerSheets.length) {
          var matchingLoose = containerSheets;
          if (q) {
            matchingLoose = containerSheets.filter(function (s) { return sheetSearchText(s).indexOf(q) !== -1; });
            if (!matchingLoose.length) return;
          }
          if (state.libraryFilter !== "all") {
            matchingLoose = matchingLoose.filter(passesLibraryFilter);
            if (!matchingLoose.length) return;
          }
          groups.push({ area: area, category: cat, topic: null, sheets: matchingLoose });
        }
      });
    });
    return groups;
  }

  function sheetRow(sheet) {
    var st = Store.getSheetState(sheet.id);
    var done = !!(st && st.completedAt);
    var fav = !!(st && st.favorite);
    var seen = !!(st && st.viewedAt);
    return '<a class="sheet-row" href="' + sheetHref(sheet.id) + '" data-nav>' +
      '<span class="sheet-state ' + (done ? "is-done" : seen ? "is-seen" : "") + '" aria-hidden="true">' + (done ? icon("check", 12) : "") + '</span>' +
      '<span class="sheet-row-copy"><span class="sheet-row-title">' + esc(sheet.title) + '</span><span class="sheet-row-summary">' + esc(sheet.summary) + '</span></span>' +
      '<span class="sheet-row-meta">' +
        (fav ? '<span class="sheet-fav" aria-label="Favorita">' + icon("heart", 13) + '</span>' : "") +
        '<span class="s-chip">' + (sheet.minutes || 6) + ' min</span>' +
        icon("chevronRight", 15) +
      '</span>' +
      '</a>';
  }

  function topicBlock(topic, area, sheets, category, openByDefault) {
    if (!sheets || !sheets.length) return "";
    var viewed = 0, completed = 0;
    sheets.forEach(function (s) {
      var st = Store.getSheetState(s.id);
      if (st && st.viewedAt) viewed += 1;
      if (st && st.completedAt) completed += 1;
    });
    var status = completed === sheets.length ? "Completada" : (viewed > 0 ? "En curso" : "Sin empezar");
    return '<details class="topic-block" ' + (openByDefault ? "open" : "") + ' data-topic="' + esc(topic.id) + '" data-category="' + esc(category ? category.id : "") + '">' +
      '<summary class="topic-summary">' +
        '<span class="topic-marker" style="--area:' + esc(area.accent) + '">' + icon(area.icon || "book", 16) + '</span>' +
        '<span class="topic-copy"><span class="topic-kicker">' + esc(category ? category.short : area.short) + ' · ' + sheets.length + ' ' + plural(sheets.length, "ficha", "fichas") + '</span>' +
          '<span class="topic-title">' + esc(topic.title) + '</span>' +
          '<span class="topic-summary-text">' + esc(topic.summary) + '</span>' +
        '</span>' +
        '<span class="topic-progress">' +
          '<span class="topic-status ' + (completed === sheets.length ? "is-complete" : viewed ? "is-progress" : "") + '">' + status + '</span>' +
          '<span class="topic-count">' + completed + '/' + sheets.length + '</span>' +
          '<span class="topic-chevron">' + icon("chevronDown", 16) + '</span>' +
        '</span>' +
      '</summary>' +
      '<div class="topic-sheets">' + sheets.map(sheetRow).join("") + '</div>' +
      '</details>';
  }

  function categorySection(area, category, groups, openFirst) {
    var st = categoryStats(category.id);
    var body = groups.map(function (g, i) {
      if (g.topic && !g.topic.isContainer) {
        var anyViewed = g.sheets.some(function (s) { var st = Store.getSheetState(s.id); return !!(st && st.viewedAt); });
        var openDefault = (openFirst && i === 0) || anyViewed;
        var open = Object.prototype.hasOwnProperty.call(state.openTopics, g.topic.id)
          ? state.openTopics[g.topic.id]
          : openDefault;
        return topicBlock(g.topic, area, g.sheets, category, open);
      }
      return '<div class="topic-sheets topic-sheets--loose"><div class="loose-label">' + icon("book", 12) + ' Fichas oficiales del temario</div>' + g.sheets.map(sheetRow).join("") + '</div>';
    }).join("");
    return '<section class="library-category" id="category-' + esc(category.id) + '">' +
      '<div class="library-category-head" style="--area:' + esc(area.accent) + '">' +
        '<div><span class="s-kicker"><span class="dot"></span>' + esc(category.short) + '</span><h2>' + esc(category.title) + '</h2><p>' + esc(category.description) + '</p></div>' +
        '<span class="library-area-meta">' + esc(categoryMeta(st)) + '</span>' +
      '</div>' +
      '<div class="topic-list">' + body + '</div>' +
      '</section>';
  }

  function renderCategoryGroups(groups) {
    var html = [];
    var seen = {};
    groups.forEach(function (g) {
      var key = g.area.id + "|" + g.category.id;
      if (seen[key]) {
        seen[key].groups.push(g);
      } else {
        var bucket = { area: g.area, category: g.category, groups: [g] };
        seen[key] = bucket;
        html.push(bucket);
      }
    });
    return html.map(function (bucket) {
      return categorySection(bucket.area, bucket.category, bucket.groups, false);
    }).join("");
  }

  function renderAreaIndex(area) {
    var as = compileAreaStats(area.id);
    var cats = categoriesOf(area.id);
    return '<section class="library-area" id="area-' + esc(area.id) + '">' +
      '<div class="library-area-head" style="--area:' + esc(area.accent) + '">' +
        '<span class="library-area-icon">' + icon(area.icon || "book", 18) + '</span>' +
        '<div><h2>' + esc(area.title) + '</h2><p>' + esc(area.description) + '</p></div>' +
        '<span class="library-area-meta">' + as.categories + ' categorías · ' + as.modules + ' módulos · ' + as.sheets + ' fichas</span>' +
      '</div>' +
      '<div class="category-grid">' + cats.map(function (cat) { return categoryCard(cat, area); }).join("") + '</div>' +
      '</section>';
  }

  function emptyLibrary() {
    var hasFilters = state.libraryQuery || state.libraryArea || state.libraryCategory || state.libraryFilter !== "all";
    return UI.emptyState({
      icon: "search",
      title: hasFilters ? "No hay coincidencias" : "La biblioteca está vacía",
      text: hasFilters ? "Prueba con otra palabra o quita los filtros para ver todo el temario." : "Todavía no hay temas disponibles para mostrar.",
      actions: hasFilters ? '<button class="s-btn" type="button" data-action="clear-library">Limpiar filtros</button>' : '<a class="s-btn" href="#/" data-nav>Volver al panel</a>'
    });
  }

  function updateLibraryResults() {
    var summary = qs("#library-summary");
    var results = qs("#library-results");
    if (!summary || !results) return;
    var groups = filteredGroups();
    var sheetCount = groups.reduce(function (n, g) { return n + g.sheets.length; }, 0);
    var topicIds = {}, catIds = {}, areaIds = {};
    groups.forEach(function (g) {
      if (g.topic && !g.topic.isContainer) topicIds[g.topic.id] = true;
      catIds[g.category.id] = true;
      areaIds[g.area.id] = true;
    });
    var topicCount = Object.keys(topicIds).length;
    if (groups.some(function (g) { return !g.topic; })) topicCount += 1;
    var catCount = Object.keys(catIds).length;
    summary.innerHTML = '<span><b>' + topicCount + '</b> ' + plural(topicCount, "módulo", "módulos") + ' · <b>' + sheetCount + '</b> ' + plural(sheetCount, "ficha", "fichas") + '</span>' +
      '<span class="s-small s-muted">' + catCount + ' ' + plural(catCount, "categoría", "categorías") + ' · ' + Object.keys(areaIds).length + ' ' + plural(Object.keys(areaIds).length, "área", "áreas") +
      (state.libraryQuery ? ' · Buscando “' + esc(state.libraryQuery) + '”' : '') + '</span>';
    qsa(".library-filters button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-filter") === state.libraryFilter));
    });
    var browsing = !state.libraryQuery && state.libraryFilter === "all";
    if (browsing && !state.libraryCategory && !state.libraryArea) {
      results.innerHTML = primaryAreas().map(renderAreaIndex).join("");
      return;
    }
    if (browsing && state.libraryArea && !state.libraryCategory) {
      var area = primaryArea(state.libraryArea);
      results.innerHTML = area ? renderAreaIndex(area) : emptyLibrary();
      return;
    }
    if (!groups.length) {
      results.innerHTML = emptyLibrary();
      return;
    }
    results.innerHTML = renderCategoryGroups(groups);
  }

  /* ------------------------------------------------------------------ */
  /* Lector de ficha                                                     */
  /* ------------------------------------------------------------------ */

  function tableHTML(table) {
    if (!table) return "";
    return '<div class="reader-table-wrap"><table class="reader-table"><thead><tr>' +
      table.headers.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join("") +
      '</tr></thead><tbody>' + table.rows.map(function (row) {
        return '<tr>' + row.map(function (cell, i) {
          return i === 0 ? '<th scope="row">' + esc(cell) + '</th>' : '<td>' + esc(cell) + '</td>';
        }).join("") + '</tr>';
      }).join("") + '</tbody></table></div>';
  }

  function sectionHTML(section, index) {
    var body = (section.body || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join("");
    var bullets = section.bullets && section.bullets.length
      ? '<ul class="reader-list">' + section.bullets.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join("") + '</ul>'
      : "";
    var callout = section.callout
      ? '<div class="reader-callout ' + (section.callout.tone === "warn" ? "is-warn" : "") + '">' +
          '<span class="reader-callout-icon">' + icon(section.callout.tone === "warn" ? "alert" : "info", 16) + '</span>' +
          '<div><b>' + esc(section.callout.title) + '</b><p>' + esc(section.callout.text) + '</p></div>' +
        '</div>'
      : "";
    return '<section class="reader-section" id="section-' + index + '">' +
      '<div class="reader-section-head"><h2>' + esc(section.title) + '</h2>' +
        '<span class="section-depth ' + (section.depth === "full" ? "is-full" : "") + '">' + (section.depth === "full" ? "Ampliación" : "Esencial") + '</span>' +
      '</div>' + body + bullets + tableHTML(section.table) + callout + '</section>';
  }

  function renderSheet(sheet, restoring) {
    var topic = Store.getTopic(sheet.topicId);
    var area = primaryAreaForSheet(sheet);
    var category = categoryOfSheet(sheet);
    var st = Store.getSheetState(sheet.id) || {};
    var done = !!st.completedAt;
    var fav = !!st.favorite;
    var m = mode();
    var allSheets = C.sheets;
    var idx = allSheets.findIndex(function (s) { return s.id === sheet.id; });
    var prev = idx > 0 ? allSheets[idx - 1] : null;
    var next = idx >= 0 && idx < allSheets.length - 1 ? allSheets[idx + 1] : null;
    var p = topic ? Store.getTopicProgress(topic.id) : null;
    var topicDeck = topic ? Store.getDeckStats(topic.id) : null;
    var deck = Store.getDeckStats(sheet.id);
    var sections = m === "quick" ? sheet.sections.filter(function (s) { return s.depth === "core"; }) : sheet.sections;
    var extra = sheet.sections.length - sections.length;
    var source = sheet.sourceRefs && sheet.sourceRefs.length ? Store.getSource(sheet.sourceRefs[0].sourceId) : null;
    var fromFlash = state.fromFlashcards && state.entrySheetId === sheet.id;
    var categoryHref = area && category ? "#/biblioteca/" + area.id + "/" + category.id : "#/biblioteca";
    var backHref = fromFlash && topic ? flashcardsHref(state.fromDeck || sheet.id, "free", sheet.id) : categoryHref;
    var backLabel = fromFlash ? "Volver a flashcards" : "Categoría";
    var practiceHref = flashcardsHref(sheet.id, "free", sheet.id);

    var sources = sheet.sourceRefs && sheet.sourceRefs.length ? sheet.sourceRefs.map(function (ref) {
      var src = Store.getSource(ref.sourceId);
      if (!src) return "";
      var pages = (ref.pages || []).join(", ");
      var href = src.file + (ref.pages && ref.pages.length ? "#page=" + ref.pages[0] : "");
      return '<a class="reader-source-row" href="' + esc(href) + '" target="_blank" rel="noopener" title="Abrir ' + esc(src.title) + ' en el PDF original">' +
        '<span class="reader-source-badge">' + esc(src.short) + '</span>' +
        '<span class="reader-source-copy"><b>' + esc(src.title) + '</b><p>' + esc(src.provenance) + (pages ? ' · p. ' + esc(pages) : '') + '</p></span>' +
        '<span class="reader-source-open" aria-hidden="true">' + icon("external", 14) + '</span></a>';
    }).join("") : '<p class="s-small s-muted">Esta ficha no tiene una referencia documental asociada.</p>';

    return [
      '<article class="reader">',
        '<div class="reader-topbar">',
          '<a class="reader-back" href="' + esc(backHref) + '"' + (fromFlash ? "" : ' data-nav') + '>' + icon("arrowLeft", 16) + ' ' + esc(backLabel) + '</a>',
          '<div class="reader-tools">',
            '<div class="s-seg" role="group" aria-label="Modo de lectura">',
              '<button type="button" data-action="reader-mode" data-mode="quick" aria-pressed="' + (m === "quick") + '">Rápido</button>',
              '<button type="button" data-action="reader-mode" data-mode="full" aria-pressed="' + (m === "full") + '">Completo</button>',
            '</div>',
            '<button class="s-btn s-btn--ghost s-btn--sm" type="button" data-action="toggle-favorite" aria-pressed="' + fav + '">' + icon("heart", 14) + ' <span class="reader-tool-text">' + (fav ? "Guardada" : "Guardar") + '</span></button>',
            '<button class="s-btn ' + (done ? "s-btn--soft" : "") + ' s-btn--sm" type="button" data-action="toggle-complete" aria-pressed="' + done + '">' + icon(done ? "checkCircle" : "check", 14) + ' <span class="reader-tool-text">' + (done ? "Completada" : "Marcar completada") + '</span></button>',
          '</div>',
        '</div>',

        '<header class="reader-head">',
          '<div class="reader-breadcrumb"><span>' + esc(area ? area.title : "") + '</span>' + icon("chevronRight", 12) + '<span>' + esc(category ? category.title : "") + '</span>' + icon("chevronRight", 12) + '<span>' + esc(topic ? topic.title : "") + '</span>' + (fromFlash ? '<span class="s-chip s-chip--accent">Desde flashcards</span>' : "") + '</div>',
          '<h1>' + esc(sheet.title) + '</h1>',
          '<p class="reader-summary">' + esc(sheet.summary) + '</p>',
          '<div class="reader-meta">',
            '<span class="s-chip">' + icon("clock", 13) + (sheet.minutes || 6) + ' min</span>',
            '<span class="s-chip">' + icon("layers", 13) + esc(sheet.level || "Base") + '</span>',
            '<span class="s-chip">' + icon("book", 13) + 'Ficha ' + (idx + 1) + ' de ' + allSheets.length + '</span>',
            '<span class="s-chip ' + (done ? "s-chip--green" : "") + '">' + icon(done ? "checkCircle" : "eye", 13) + (done ? "Completada" : st.viewedAt ? "Leída" : "Nueva") + '</span>',
          '</div>',
        '</header>',

        '<div class="reader-layout">',
          '<div class="reader-main">',
            '<section class="reader-concepts">',
              '<span class="s-kicker"><span class="dot"></span>Conceptos clave</span>',
              '<div class="concept-grid">' + (sheet.keyConcepts || []).map(function (c, i) {
                return '<div class="concept-item"><span>' + String(i + 1).padStart(2, "0") + '</span><p>' + esc(c) + '</p></div>';
              }).join("") + '</div>',
            '</section>',

            '<div class="reader-sections">' + sections.map(sectionHTML).join("") + '</div>',

            m === "quick" && extra > 0 ? '<div class="quick-note">' + icon("layers", 17) + '<p>Estás en modo rápido. Hay ' + extra + ' ' + plural(extra, "sección", "secciones") + ' de ampliación.</p><button class="s-btn s-btn--ghost s-btn--sm" type="button" data-action="reader-mode" data-mode="full">Leer completo</button></div>' : "",

            '<section class="reader-practice">',
              '<span class="reader-practice-icon">' + icon("cards", 23) + '</span>',
              '<div class="reader-practice-copy"><span class="s-kicker">Recuperación activa</span><h2>Practica esta ficha</h2><p>' + (deck.total ? deck.total + ' tarjetas de esta ficha te esperan en Study Flashcards. La ficha queda abierta para volver cuando la necesites.' : 'Esta ficha todavía no tiene tarjetas asociadas.') + '</p>' +
                '<div class="reader-meta">' +
                  '<span class="s-chip">' + icon("cards", 13) + deck.total + ' total</span>' +
                  '<span class="s-chip">' + icon("rotate", 13) + (deck.due + deck.newCards) + ' pendientes</span>' +
                  '<span class="s-chip">' + icon("checkCircle", 13) + deck.mastered + ' dominadas</span>' +
                  '<span class="s-chip">' + icon("alert", 13) + deck.errors + ' errores</span>' +
                '</div></div>',
              deck.total ? '<a class="s-btn" href="' + esc(practiceHref) + '">' + icon("play", 15) + ' Practicar con flashcards</a>' : '<a class="s-btn s-btn--ghost" href="../study-flashcards/index.html">Ver mazos</a>',
            '</section>',

            '<section class="reader-refs">',
              '<div class="s-kicker"><span class="dot"></span>Fuentes de esta ficha</div>',
              sources,
            '</section>',

            '<nav class="reader-pager" aria-label="Otras fichas">',
              prev ? '<a class="pager-card pager-prev" href="' + sheetHref(prev.id) + '" data-nav><span>' + icon("arrowLeft", 14) + ' Anterior</span><b>' + esc(prev.title) + '</b></a>' : '<span></span>',
              next ? '<a class="pager-card pager-next" href="' + sheetHref(next.id) + '" data-nav><span>Siguiente ' + icon("arrow", 14) + '</span><b>' + esc(next.title) + '</b></a>' : '<span></span>',
            '</nav>',
          '</div>',

          '<aside class="reader-rail" aria-label="Contexto de la ficha">',
            '<div class="rail-card rail-progress">',
              '<span class="s-kicker">Tu avance</span>',
              '<div class="rail-progress-number"><b>' + (p ? p.completed + "/" + p.total : "—") + '</b><span>fichas completadas</span></div>',
              UI.progressBar(p ? p.percent : 0, "Progreso del tema"),
              '<button class="s-btn ' + (done ? "s-btn--soft" : "s-btn--ghost") + ' s-btn--block s-btn--sm" type="button" data-action="toggle-complete">' + icon(done ? "checkCircle" : "check", 15) + (done ? "Completada" : "Marcar completada") + '</button>',
              '<p class="s-xs s-muted">Tu progreso se guarda en este navegador.</p>',
            '</div>',
            topic ? '<div class="rail-card">' +
              '<span class="s-kicker">' + (category ? esc(category.short) : "Tema") + '</span><h3>' + esc(topic.title) + '</h3><p class="s-small s-soft">' + esc(topic.summary) + '</p>' +
              '<div class="rail-topic-meta"><span>' + icon("book", 13) + (p ? p.total : 0) + ' fichas</span><span>' + icon("cards", 13) + (topicDeck ? topicDeck.total : 0) + ' tarjetas</span></div>' +
              '<a class="s-link s-small" href="' + esc(categoryHref) + '" data-nav>Ver la categoría completa</a>' +
            '</div>' : "",
            '<div class="rail-card">',
              '<span class="s-kicker">Tipo de contenido</span>',
              '<p class="s-small s-soft">' + esc(sheet.level || "Base") + ' · ' + (sheet.sections.length) + ' ' + plural(sheet.sections.length, "sección", "secciones") + ' · ' + (m === "quick" ? "lectura rápida" : "lectura completa") + '</p>',
              source ? '<p class="s-xs s-muted">Fuente principal: ' + esc(source.kind) + '. Consulta el PDF para verificar el texto original.</p>' : "",
              '<p class="s-xs s-muted">' + esc(C.meta.disclaimer) + '</p>',
            '</div>',
          '</aside>',
        '</div>',
      '</article>'
    ].join("");
  }

  /* ------------------------------------------------------------------ */
  /* Progreso                                                            */
  /* ------------------------------------------------------------------ */

  function activityDays(count) {
    var out = [];
    var today = new Date();
    today.setHours(12, 0, 0, 0);
    for (var i = count - 1; i >= 0; i--) {
      var d = new Date(today);
      d.setDate(d.getDate() - i);
      var key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      var a = (Store.getState().activity || {})[key] || {};
      out.push({
        date: d, key: key,
        value: (a.sheetViews || 0) + (a.sheetCompletions || 0) + (a.cardReviews || 0),
        views: a.sheetViews || 0,
        completions: a.sheetCompletions || 0,
        reviews: a.cardReviews || 0,
        seconds: a.seconds || 0
      });
    }
    return out;
  }

  function historyItem(h) {
    var topic = h.topicId ? Store.getTopic(h.topicId) : null;
    var isSession = h.type === "session";
    var isComplete = h.type === "sheet-complete";
    var href = isSession
      ? flashcardsHref(h.topicId, "free", "")
      : (h.id ? sheetHref(h.id) : "#/biblioteca");
    var iconName = isSession ? "cards" : isComplete ? "checkCircle" : "book";
    return '<a class="history-row" href="' + esc(href) + '"' + (isSession ? "" : ' data-nav') + '>' +
      '<span class="history-icon ' + (isSession ? "is-cards" : isComplete ? "is-done" : "") + '">' + icon(iconName, 15) + '</span>' +
      '<span class="history-copy"><b>' + esc(h.title) + '</b><span>' + esc(topic ? topic.title : (isSession ? "Sesión de flashcards" : "Ficha de estudio")) + '</span></span>' +
      '<span class="history-time">' + esc(UI.formatRelative(h.at)) + '</span>' +
      '</a>';
  }

  function favoriteRows() {
    var favs = [];
    Object.keys(Store.getState().sheets || {}).forEach(function (id) {
      var st = Store.getState().sheets[id];
      var sh = Store.getSheet(id);
      if (st && st.favorite && sh) favs.push({ sheet: sh, state: st });
    });
    if (!favs.length) {
      return UI.emptyState({
        icon: "heart",
        title: "Todavía no guardaste fichas",
        text: "Usa el botón Guardar en cualquier ficha para tenerla a mano aquí.",
        actions: '<a class="s-btn s-btn--sm" href="#/biblioteca" data-nav>Explorar biblioteca</a>'
      });
    }
    return '<div class="favorites-list">' + favs.map(function (f) {
      var st = f.state;
      return '<a class="favorite-row" href="' + sheetHref(f.sheet.id) + '" data-nav>' +
        '<span class="favorite-icon">' + icon("heart", 14) + '</span>' +
        '<span><b>' + esc(f.sheet.title) + '</b><small>' + esc(topicTitle(f.sheet.topicId)) + ' · ' + (st.completedAt ? "Completada" : "Guardada") + '</small></span>' +
        icon("chevronRight", 14) + '</a>';
    }).join("") + '</div>';
  }

  function renderProgress() {
    var st = Store.getDashboardStats();
    var days = activityDays(14);
    var max = Math.max.apply(null, days.map(function (d) { return d.value; }).concat([1]));
    var periodTotal = days.reduce(function (n, d) { return n + d.value; }, 0);
    var activeDays = days.filter(function (d) { return d.value > 0; }).length;
    var seconds = Object.keys(Store.getState().activity || {}).reduce(function (n, k) {
      return n + ((Store.getState().activity[k] || {}).seconds || 0);
    }, 0);
    var minutes = Math.round(seconds / 60);
    var history = Store.getHistory(12);
    var goal = st.goal || 2;
    var todayPct = Math.min(100, Math.round(((st.today.sheetsCompleted || 0) / goal) * 100));
    var areaRows = primaryAreas().map(function (a) {
      var as = compileAreaStats(a.id);
      return '<a class="progress-area-row" href="#/biblioteca/' + esc(a.id) + '" data-nav style="--area:' + esc(a.accent) + '">' +
        '<span class="progress-area-dot"></span><span class="s-grow"><b>' + esc(a.title) + '</b><small>' + as.completed + ' de ' + as.sheets + ' fichas · ' + as.categories + ' categorías</small></span>' +
        '<span class="progress-area-num">' + as.percent + '%</span>' + icon("chevronRight", 14) + '</a>';
    }).join("");

    return [
      '<section class="progress-head">',
        '<span class="s-kicker"><span class="dot"></span>Tu recorrido</span>',
        '<h1>Progreso que puedes ver.</h1>',
        '<p>Solo cuenta lo que hiciste: fichas abiertas, fichas completadas y tarjetas repasadas. Sin métricas inventadas.</p>',
      '</section>',

      '<section class="progress-stats">',
        '<div class="progress-stat"><span class="s-stat"><b>' + st.completedSheets + '</b><span>fichas completadas</span></span><small>de ' + st.totalSheets + ' del temario</small></div>',
        '<div class="progress-stat"><span class="s-stat"><b>' + st.reviewedCards + '</b><span>tarjetas revisadas</span></span><small>' + st.masteredCards + ' ya dominadas</small></div>',
        '<div class="progress-stat"><span class="s-stat"><b>' + st.streak + '</b><span>días de racha</span></span><small>' + (periodTotal ? periodTotal + ' acciones en 14 días' : 'Empieza cuando quieras') + '</small></div>',
        '<div class="progress-stat"><span class="s-stat"><b>' + minutes + '</b><span>minutos de lectura</span></span><small>Tiempo activo registrado</small></div>',
      '</section>',

      '<div class="progress-grid">',
        '<section class="progress-panel activity-panel">',
          '<div class="progress-panel-head"><div><span class="s-kicker">Últimos 14 días</span><h2>Actividad de estudio</h2></div><span class="s-chip">' + activeDays + ' ' + plural(activeDays, "día activo", "días activos") + '</span></div>',
          '<div class="activity-chart" role="img" aria-label="Actividad de los últimos 14 días: ' + periodTotal + ' acciones en total">',
            days.map(function (d) {
              var h = d.value ? Math.max(8, Math.round((d.value / max) * 100)) : 2;
              return '<div class="activity-col" title="' + esc(d.date.toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" })) + ': ' + d.value + ' acciones">' +
                '<span class="activity-bar ' + (d.value ? "has-value" : "") + '" style="height:' + h + '%"></span>' +
                '<span class="activity-label">' + d.date.getDate() + '</span></div>';
            }).join("") +
          '</div>',
          '<div class="activity-legend"><span><i></i> Fichas y tarjetas</span><span>' + periodTotal + ' acciones en el periodo</span></div>',
        '</section>',

        '<section class="progress-panel goal-panel">',
          '<div class="progress-panel-head"><div><span class="s-kicker">Constancia</span><h2>Objetivo diario</h2></div><span class="goal-ring goal-ring--small" style="--p:' + todayPct + '"><span>' + todayPct + '%</span></span></div>',
          '<p class="goal-line"><b>' + (st.today.sheetsCompleted || 0) + '</b> de <b>' + goal + '</b> fichas completadas hoy</p>',
          UI.progressBar(todayPct, "Objetivo diario"),
          '<div class="goal-controls">',
            '<button class="s-iconbtn" type="button" data-action="goal-step" data-step="-1" aria-label="Bajar objetivo">−</button>',
            '<button class="s-iconbtn" type="button" data-action="goal-step" data-step="1" aria-label="Subir objetivo">+</button>',
            '<span class="s-small s-muted">Ajusta el objetivo a tu ritmo.</span>',
          '</div>',
          '<div class="goal-mini-stats"><span><b>' + st.today.sheetsViewed + '</b><small>vistas hoy</small></span><span><b>' + st.today.cardReviews + '</b><small>tarjetas hoy</small></span><span><b>' + st.favorites + '</b><small>favoritas</small></span></div>',
        '</section>',

        '<section class="progress-panel history-panel">',
          '<div class="progress-panel-head"><div><span class="s-kicker">Reciente</span><h2>Historial</h2></div><a class="dash-textlink" href="#/biblioteca" data-nav>Biblioteca ' + icon("arrow", 13) + '</a></div>',
          history.length ? '<div class="history-list">' + history.map(historyItem).join("") + '</div>' : UI.emptyState({
            icon: "clock",
            title: "Tu historial empieza con una ficha",
            text: "Cuando leas o completes una ficha, aparecerá aquí para que puedas retomarla.",
            actions: '<a class="s-btn s-btn--sm" href="#/biblioteca" data-nav>Elegir una ficha</a>'
          }),
        '</section>',

        '<section class="progress-panel favorites-panel">',
          '<div class="progress-panel-head"><div><span class="s-kicker">A mano</span><h2>Favoritas</h2></div></div>',
          favoriteRows(),
        '</section>',

        '<section class="progress-panel areas-panel">',
          '<div class="progress-panel-head"><div><span class="s-kicker">5 áreas · 20 categorías</span><h2>Avance por área</h2></div></div>',
          '<div class="progress-areas">' + areaRows + '</div>',
        '</section>',

        '<section class="progress-panel storage-panel">',
          '<span class="storage-icon">' + icon("loop", 18) + '</span>',
          '<div><h3>Progreso compartido</h3><p class="s-small s-soft">El avance se guarda en este navegador y Study Flashcards lo lee desde el mismo almacenamiento. Para compartirlo entre aplicaciones, ábrelas desde el mismo origen HTTP.</p><p class="s-xs s-muted">Modo de guardado: ' + (Store.getMode() === "indexeddb" ? "almacenamiento local del navegador" : "respaldo local") + '.</p></div>',
          '<a class="s-link s-small" href="../study-flashcards/index.html">Abrir flashcards</a>',
        '</section>',
      '</div>'
    ].join("");
  }

  function renderNotFound(title, text) {
    var alternatives = C.sheets.slice(0, 3).map(function (s) {
      return '<a class="s-btn s-btn--ghost s-btn--sm" href="' + sheetHref(s.id) + '" data-nav>' + esc(s.title) + '</a>';
    }).join("");
    return '<section class="notfound-wrap">' + UI.emptyState({
      icon: "compass",
      title: title,
      text: text,
      actions: '<a class="s-btn" href="#/" data-nav>Volver al panel</a><a class="s-btn s-btn--ghost" href="#/biblioteca" data-nav>Ver biblioteca</a>' + alternatives
    }) + '</section>';
  }

  /* ------------------------------------------------------------------ */
  /* Eventos y arranque                                                  */
  /* ------------------------------------------------------------------ */

  function onDocumentClick(e) {
    var nav = e.target.closest("a[data-nav]");
    if (nav) {
      var href = nav.getAttribute("href") || "";
      if (href && href.charAt(0) === "#" && href === location.hash) {
        e.preventDefault();
        renderRoute({ focus: false });
      } else {
        /* El paginador anterior/siguiente abre la ficha desde el principio. */
        state.suppressScrollRestore = !!nav.closest(".reader-pager");
      }
      return;
    }
    var actionEl = e.target.closest("[data-action]");
    if (!actionEl) return;
    var action = actionEl.getAttribute("data-action");
    if (action === "retry") {
      location.reload();
    } else if (action === "library-filter") {
      state.libraryFilter = actionEl.getAttribute("data-filter") || "all";
      updateLibraryResults();
    } else if (action === "clear-library") {
      state.libraryQuery = "";
      state.libraryFilter = "all";
      if (state.libraryArea || state.libraryCategory) {
        location.hash = "#/biblioteca";
      } else {
        var input = qs("#library-search");
        if (input) input.value = "";
        updateLibraryResults();
      }
    } else if (action === "goal-step") {
      var step = Number(actionEl.getAttribute("data-step")) || 0;
      var st = Store.getDashboardStats();
      var next = Math.max(1, Math.min(20, (st.goal || 2) + step));
      Store.setDailyGoal(next);
      UI.toast("Objetivo diario: " + next + " " + plural(next, "ficha", "fichas"));
      rerenderPreserve();
    } else if (action === "reader-mode") {
      var nextMode = actionEl.getAttribute("data-mode");
      if (nextMode === mode()) return;
      setMode(nextMode);
      rerenderPreserve();
    } else if (action === "toggle-favorite") {
      if (!state.route || state.route.name !== "sheet") return;
      var sheet = Store.getSheet(state.route.sheetId);
      if (!sheet) return;
      var fav = Store.toggleFavorite(sheet.id);
      UI.toast(fav ? "Ficha guardada en favoritas" : "Ficha quitada de favoritas");
      rerenderPreserve();
    } else if (action === "toggle-complete") {
      if (!state.route || state.route.name !== "sheet") return;
      var s = Store.getSheet(state.route.sheetId);
      if (!s) return;
      var active = Store.toggleSheetComplete(s.id);
      UI.toast(active ? "Ficha marcada como completada" : "Ficha marcada como pendiente");
      rerenderPreserve();
    }
  }

  function onInput(e) {
    if (e.target && e.target.id === "library-search") {
      state.libraryQuery = e.target.value;
      updateLibraryResults();
    }
  }

  function onKeydown(e) {
    if (e.key === "/" && state.route.name === "library" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      var input = qs("#library-search");
      if (input && document.activeElement !== input) {
        e.preventDefault();
        input.focus();
        input.select();
      }
    }
  }

  function initQuery() {
    var qSheet = UI.getQuery("sheet");
    var qFrom = UI.getQuery("from");
    if (qSheet && Store.getSheet(qSheet)) {
      state.initialSheet = qSheet;
      state.entrySheetId = qSheet;
      state.fromFlashcards = qFrom === "flashcards";
      state.fromDeck = UI.getQuery("deck");
      cleanQueryTo("#/ficha/" + encodeURIComponent(qSheet));
      return true;
    }
    if (qSheet) {
      /* Enlace guardado de una ficha que ya no existe: la portada es el punto
         de entrada correcto. Se limpia la query para no repetir el aviso ni
         dejar una ruta antigua en el historial. */
      state.initialSheet = "";
      state.entrySheetId = "";
      state.fromFlashcards = false;
      state.fromDeck = "";
      state.pendingNotice = "La ficha guardada ya no está disponible; abre la biblioteca para elegir otra.";
      cleanQueryTo("#/");
      return false;
    }
    if (!location.hash) {
      cleanQueryTo("#/");
    }
    return false;
  }

  async function bootApp() {
    if (!C || !Array.isArray(C.sheets)) {
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
      showError("No se pudo inicializar el almacenamiento local. Puedes seguir leyendo, pero el progreso podría no guardarse.");
    }
    if (!C.sheets.length) {
      showEmptyContent();
      return;
    }
    var resume = initQuery();
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("input", onInput);
    document.addEventListener("keydown", onKeydown);
    /* El evento toggle de <details> no burbujea: se captura en el documento para
       conservar qué temas están desplegados durante la sesión (estado de interfaz). */
    document.addEventListener("toggle", function (e) {
      var block = e.target;
      if (!block || !block.classList || !block.classList.contains("topic-block")) return;
      var topicId = block.getAttribute("data-topic");
      if (topicId) state.openTopics[topicId] = !!block.open;
    }, true);
    window.addEventListener("hashchange", function () {
      var restore = !state.suppressScrollRestore;
      state.suppressScrollRestore = false;
      renderRoute({ focus: true, restoreScroll: restore });
    });
    window.addEventListener("scroll", recordScrollOnly, { passive: true });
    window.addEventListener("wheel", function () { if (state.restoring) cancelScrollRestore(); }, { passive: true });
    window.addEventListener("touchstart", function () { if (state.restoring) cancelScrollRestore(); }, { passive: true });
    window.addEventListener("pagehide", function () {
      flushReading();
      saveScroll();
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) flushReading();
      else {
        if (state.currentSheetId) state.readStarted = Date.now();
        renderRoute({ focus: false, scrollY: window.scrollY });
      }
    });
    window.setInterval(flushReading, 30000);
    renderRoute({ resumeSheet: resume ? state.initialSheet : null, restoreScroll: true, focus: false });
    if (resume) announce("Ficha restaurada desde tu último punto.");
    if (state.pendingNotice) {
      announce(state.pendingNotice);
      UI.toast(state.pendingNotice);
      state.pendingNotice = "";
    }
  }

  bootApp();
})();
