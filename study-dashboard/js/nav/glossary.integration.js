/* © 2026 ZARCONT — Study Dashboard · Glosario global (#/glosario, Fase 3)
   Vista de consulta de las definiciones explícitas del temario. Carga el
   derivado `glossary` solo al montar la ruta, busca sin tildes, filtra por área
   y enlaza a la ficha de origen. No descarga nada al arrancar, no modifica el
   lector ni toca Study Flashcards.

   Contrato: study-dashboard/docs/CONTRATOS-FASE3.md §4.1
   Puente compartido: js/nav/reference.js (StudyReference)
   Estilos: css/glossary.css (solo selectores .ref-page--glossary / .ref-glossary*) */
(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var MODULE_ID = "glossary";
  var ROUTE_PATH = "glosario";
  var VIEW = "glosario";
  var TITLE = "Glosario";
  var TITLE_ID = "ref-glosario-title";
  var SEARCH_ID = "ref-glosario-search";
  var AREA_ID = "ref-glosario-area";
  var LIST_ID = "ref-glosario-list";
  var HINT_ID = "ref-glosario-hint";
  var KIND = "glossary";
  var DEBOUNCE_MS = 160;
  var RETRY_LIMIT = 40;
  var RETRY_DELAY = 50;

  var page = {
    ctx: null,
    section: null,
    body: null,
    results: null,
    count: null,
    search: null,
    area: null,
    loading: null,
    error: null,
    errorText: null,
    retryButton: null,
    token: 0,
    timer: 0,
    query: "",
    areaId: "",
    entries: [],
    loaded: false,
    areaOptionsReady: false,
    retryFocus: false
  };

  var collator = null;
  try {
    if (root.Intl && typeof root.Intl.Collator === "function") {
      collator = new root.Intl.Collator("es", { sensitivity: "base", numeric: true });
    }
  } catch (error) {
    collator = null;
  }

  function refApi() {
    var ref = root.StudyReference;
    return ref && typeof ref.load === "function" ? ref : null;
  }

  function uiApi() {
    return root.StudyUI || null;
  }

  function text(value) {
    return value == null ? "" : String(value);
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function esc(value) {
    var ui = uiApi();
    if (ui && typeof ui.escapeHTML === "function") return ui.escapeHTML(value);
    var ref = refApi();
    if (ref && typeof ref.escape === "function") return ref.escape(value);
    return text(value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function icon(name, size) {
    var ui = uiApi();
    if (ui && typeof ui.icon === "function") return ui.icon(name, size || 15);
    var ref = refApi();
    if (ref && typeof ref.icon === "function") return ref.icon(name, size || 15);
    return "";
  }

  function plural(n, one, many) {
    var ui = uiApi();
    if (ui && typeof ui.plural === "function") return ui.plural(n, one, many);
    return Number(n) === 1 ? one : (many || one + "s");
  }

  function announce(message) {
    if (root.StudyApp && typeof root.StudyApp.announce === "function") {
      try { root.StudyApp.announce(message); } catch (error) { /* sin live region */ }
    }
  }

  function focusElement(element) {
    if (!element || typeof element.focus !== "function") return false;
    try {
      element.focus({ preventScroll: true });
      return true;
    } catch (error) {
      try { element.focus(); return true; } catch (fallback) { return false; }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Orden alfabético español                                            */
  /* ------------------------------------------------------------------ */

  function compareText(a, b) {
    var left = text(a);
    var right = text(b);
    if (collator) return collator.compare(left, right);
    return left.localeCompare(right, "es", { sensitivity: "base", numeric: true });
  }

  function compareEntries(a, b) {
    return compareText(a && a.term, b && b.term) ||
      compareText(a && a.sheetTitle, b && b.sheetTitle) ||
      compareText(a && a.sectionTitle, b && b.sectionTitle) ||
      compareText(a && a.id, b && b.id);
  }

  function sortedEntries() {
    return asArray(page.entries).slice().sort(compareEntries);
  }

  function filteredEntries() {
    var ref = refApi();
    if (!ref) return [];
    var source = asArray(page.entries);
    var list = typeof ref.filter === "function"
      ? ref.filter(source, { query: page.query, areaId: page.areaId })
      : source;
    return (Array.isArray(list) ? list : []).slice().sort(compareEntries);
  }

  /* ------------------------------------------------------------------ */
  /* Contador y opciones de área                                        */
  /* ------------------------------------------------------------------ */

  function countLabel(shown) {
    if (!page.loaded) return "Cargando el glosario…";
    var total = asArray(page.entries).length;
    if (!total) return "Sin términos";
    var noun = plural(total, "término", "términos");
    var filters = !!text(page.query).trim() || !!page.areaId;
    if (filters) return shown + " de " + total + " " + noun;
    return total + " " + noun;
  }

  function setCount(value) {
    if (page.count) page.count.textContent = value;
  }

  function areaOptions() {
    var ref = refApi();
    if (!ref || typeof ref.areaOptions !== "function") return [];
    try {
      var list = ref.areaOptions();
      return Array.isArray(list) ? list : [];
    } catch (error) {
      return [];
    }
  }

  function areaTitle(areaId) {
    if (!areaId) return "";
    var list = areaOptions();
    for (var i = 0; i < list.length; i += 1) {
      if (list[i] && list[i].id === areaId) return text(list[i].title || list[i].short);
    }
    return "";
  }

  /* Las opciones se pintan una vez por montaje; cambiar de filtro nunca vuelve
     a construir el <select> ni el <input>, así que el foco no se pierde. */
  function renderAreaOptions() {
    if (!page.area || page.areaOptionsReady) return;
    var list = areaOptions();
    if (!list.length) return;
    var selected = page.areaId;
    var options = ['<option value="">Todas las áreas</option>'];
    list.forEach(function (area) {
      if (!area || !area.id) return;
      var label = text(area.title || area.short);
      options.push(
        '<option value="' + esc(area.id) + '"' + (area.id === selected ? " selected" : "") + ">" +
        esc(label) + "</option>"
      );
    });
    if (options.length === 1) return;
    page.area.innerHTML = options.join("");
    page.areaOptionsReady = true;
    page.area.value = selected;
    if (page.area.value !== selected) {
      page.area.value = "";
      page.areaId = "";
    }
  }

  function syncToolbar() {
    if (page.search) page.search.value = page.query;
    if (page.area) {
      page.area.value = page.areaId;
      if (page.area.value !== page.areaId) {
        page.area.value = "";
        page.areaId = "";
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* HTML de la vista                                                   */
  /* ------------------------------------------------------------------ */

  function shellHTML() {
    return '<section class="ref-page ref-page--glossary ref-glossary" data-ref-view="' + VIEW + '"' +
      ' data-ref-state="loading" aria-labelledby="' + TITLE_ID + '">' +
        '<header class="ref-glossary-head">' +
          '<a class="ref-glossary-back" href="#/" data-nav>' + icon("arrowLeft", 14) + '<span>Panel</span></a>' +
          '<span class="ref-glossary-kicker"><span class="ref-glossary-dot" aria-hidden="true"></span>Herramientas</span>' +
          '<div class="ref-glossary-intro">' +
            '<div class="ref-glossary-intro-copy">' +
              '<h1 class="ref-glossary-title" id="' + TITLE_ID + '">' + esc(TITLE) + '</h1>' +
              '<p class="ref-glossary-lede">Definiciones explícitas del temario, con la ficha y la sección de origen. Busca por término o definición, con o sin tildes, y acota por área.</p>' +
            '</div>' +
            '<p class="ref-glossary-count" data-ref-count role="status" aria-live="polite" aria-atomic="true">Cargando el glosario…</p>' +
          '</div>' +
        '</header>' +
        '<div class="ref-glossary-toolbar" role="search" aria-label="Buscar en el glosario">' +
          '<div class="ref-glossary-field ref-glossary-field--search">' +
            '<label class="ref-glossary-label" for="' + SEARCH_ID + '">Buscar</label>' +
            '<div class="ref-glossary-input-wrap">' +
              '<span class="ref-glossary-search-icon" aria-hidden="true">' + icon("search", 16) + '</span>' +
              '<input class="ref-glossary-input" id="' + SEARCH_ID + '" type="search" data-ref-search' +
                ' autocomplete="off" spellcheck="false" enterkeyhint="search"' +
                ' placeholder="Término o definición" aria-describedby="' + HINT_ID + '"' +
                ' aria-controls="' + LIST_ID + '">' +
            '</div>' +
            '<p class="ref-glossary-hint" id="' + HINT_ID + '">La búsqueda ignora tildes y mayúsculas.</p>' +
          '</div>' +
          '<div class="ref-glossary-field">' +
            '<label class="ref-glossary-label" for="' + AREA_ID + '">Área</label>' +
            '<div class="ref-glossary-select-wrap">' +
              '<select class="ref-glossary-area" id="' + AREA_ID + '" data-ref-area>' +
                '<option value="">Todas las áreas</option>' +
              '</select>' +
              '<span class="ref-glossary-chevron" aria-hidden="true">' + icon("chevronDown", 14) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="ref-glossary-body" data-ref-body aria-busy="true">' +
          '<div class="ref-glossary-loading" data-ref-loading role="status">' +
            '<p class="ref-glossary-loading-text">Cargando el glosario…</p>' +
            '<div class="ref-glossary-skeleton" aria-hidden="true">' +
              '<span class="ref-glossary-skeleton-row"></span>' +
              '<span class="ref-glossary-skeleton-row"></span>' +
              '<span class="ref-glossary-skeleton-row"></span>' +
            '</div>' +
          '</div>' +
          '<div class="ref-glossary-error" data-ref-error role="alert" hidden>' +
            '<span class="ref-glossary-error-icon" aria-hidden="true">' + icon("alert", 20) + '</span>' +
            '<div class="ref-glossary-error-copy">' +
              '<h2 class="ref-glossary-error-title">No se pudo cargar el glosario</h2>' +
              '<p class="ref-glossary-error-text" data-ref-error-text>Comprueba que los datos del temario estén disponibles y vuelve a intentarlo.</p>' +
              '<button class="s-btn s-btn--ghost ref-glossary-retry" type="button" data-ref-action="retry">' +
                icon("rotate", 15) + ' Reintentar</button>' +
            '</div>' +
          '</div>' +
          '<div class="ref-glossary-results" id="' + LIST_ID + '" data-ref-results></div>' +
        '</div>' +
      '</section>';
  }

  function sheetHref(entry) {
    var ref = refApi();
    if (!ref || !entry || !entry.sheetId) return "";
    var sheet = entry.sheet ||
      (typeof ref.sheetFor === "function" ? ref.sheetFor(entry.sheetId) : null);
    if (!sheet) return "";
    if (typeof ref.sheetHref === "function") return ref.sheetHref(entry.sheetId);
    return "#/ficha/" + encodeURIComponent(entry.sheetId);
  }

  function itemHTML(entry) {
    if (!entry) return "";
    var term = text(entry.term);
    var definition = text(entry.definition);
    var category = text(entry.categoryTitle);
    var section = text(entry.sectionTitle);
    var href = sheetHref(entry);
    var sheetTitle = text(entry.sheetTitle) || (entry.sheet && text(entry.sheet.title)) || "Ficha del temario";
    var meta = [];

    if (category) {
      meta.push('<span class="ref-glossary-chip">' + icon("layers", 12) + '<span>' + esc(category) + '</span></span>');
    }
    if (href) {
      meta.push(
        '<a class="ref-glossary-goto" href="' + esc(href) + '" data-nav data-ref-action="goto"' +
          ' aria-label="' + esc("Abrir la ficha «" + sheetTitle + "» (término «" + term + "»)") + '">' +
          icon("book", 13) +
          '<span class="ref-glossary-goto-text">' + esc(sheetTitle) + '</span>' +
          icon("arrow", 12) +
        '</a>'
      );
    } else {
      meta.push(
        '<span class="ref-glossary-goto is-static">' + icon("book", 13) +
          '<span class="ref-glossary-goto-text">Ficha no disponible</span></span>'
      );
    }
    /* La sección se muestra como texto: el router solo enruta #/ficha/:id y no
       existe una URL estable para #section-N. No se inventa un ancla. */
    if (section) {
      meta.push(
        '<span class="ref-glossary-section">' +
          '<span class="ref-glossary-section-label">Sección</span>' +
          '<span class="ref-glossary-section-text">' + esc(section) + '</span>' +
        '</span>'
      );
    }

    return '<li class="ref-glossary-item" data-term-id="' + esc(entry.id) + '" data-area-id="' + esc(entry.areaId) + '">' +
      '<div class="ref-glossary-main">' +
        '<h2 class="ref-glossary-term">' + esc(term) + '</h2>' +
        (definition ? '<p class="ref-glossary-definition">' + esc(definition) + "</p>" : "") +
        (meta.length ? '<div class="ref-glossary-meta">' + meta.join("") + "</div>" : "") +
      "</div>" +
    "</li>";
  }

  function listHTML(entries) {
    return '<ol class="ref-glossary-list" aria-label="Definiciones del glosario">' +
      entries.map(itemHTML).join("") +
      "</ol>";
  }

  function emptyHTML() {
    var query = text(page.query).trim();
    var area = areaTitle(page.areaId);
    var hasFilters = !!query || !!page.areaId;
    var iconName = "search";
    var title = "";
    var body = "";

    if (!asArray(page.entries).length) {
      iconName = "book";
      title = "El glosario no tiene definiciones";
      body = "El índice del temario no devolvió ninguna entrada. Vuelve a intentarlo más tarde o revisa que los datos estén disponibles.";
    } else if (query && area) {
      title = "Sin resultados para «" + query + "» en " + area;
      body = "Ninguna definición de esta área coincide con la búsqueda. Prueba con menos palabras o cambia de área.";
    } else if (query) {
      title = "Sin resultados para «" + query + "»";
      body = "El glosario solo contiene definiciones explícitas del temario. Prueba con otro término: la búsqueda ignora tildes y mayúsculas.";
    } else if (area) {
      iconName = "book";
      title = "Sin definiciones en " + area;
      body = "El glosario no tiene entradas para esta área. Prueba con otra área o limpia los filtros.";
    } else {
      iconName = "book";
      title = "Sin definiciones disponibles";
      body = "El índice del temario está vacío. Vuelve a intentarlo más tarde.";
    }

    var actions = hasFilters
      ? '<button class="s-btn s-btn--ghost ref-glossary-clear" type="button" data-ref-action="clear">' +
          icon("close", 15) + ' Limpiar filtros</button>'
      : '<a class="s-btn" href="#/" data-nav>Volver al panel</a>';

    return '<div class="ref-glossary-empty">' +
      '<span class="ref-glossary-empty-icon" aria-hidden="true">' + icon(iconName, 22) + '</span>' +
      '<h2 class="ref-glossary-empty-title">' + esc(title) + '</h2>' +
      '<p class="ref-glossary-empty-text">' + esc(body) + '</p>' +
      '<div class="ref-glossary-empty-actions">' + actions + '</div>' +
    '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* Pintado de resultados                                              */
  /* ------------------------------------------------------------------ */

  function setState(state) {
    if (page.section) page.section.setAttribute("data-ref-state", state);
    if (page.body) page.body.setAttribute("aria-busy", state === "loading" ? "true" : "false");
  }

  function applyFilters() {
    if (!page.loaded || !page.results) return;
    var shown = filteredEntries();
    if (!shown.length) {
      page.results.innerHTML = emptyHTML();
      setState("empty");
    } else {
      page.results.innerHTML = listHTML(shown);
      setState("ready");
    }
    setCount(countLabel(shown.length));
  }

  function clearFilters(moveFocus) {
    page.query = "";
    page.areaId = "";
    if (page.timer) {
      root.clearTimeout(page.timer);
      page.timer = 0;
    }
    if (page.search) page.search.value = "";
    if (page.area) page.area.value = "";
    applyFilters();
    if (moveFocus && page.search) focusElement(page.search);
  }

  /* ------------------------------------------------------------------ */
  /* Carga del derivado                                                  */
  /* ------------------------------------------------------------------ */

  function showLoading() {
    page.loaded = false;
    if (page.loading) page.loading.hidden = false;
    if (page.error) page.error.hidden = true;
    if (page.results) page.results.innerHTML = "";
    setState("loading");
    setCount("Cargando el glosario…");
  }

  function showError(error, token) {
    if (token != null && token !== page.token) return;
    page.loaded = false;
    if (page.loading) page.loading.hidden = true;
    if (page.results) page.results.innerHTML = "";
    if (page.error) {
      page.error.hidden = false;
      if (page.errorText) {
        page.errorText.textContent = refApi()
          ? "No se pudo cargar el glosario desde el índice del temario. Comprueba que los datos estén disponibles y vuelve a intentarlo."
          : "La herramienta de consulta no está disponible en esta página. Recarga para volver a intentarlo.";
      }
    }
    setState("error");
    setCount("Glosario no disponible");
    announce("No se pudo cargar el glosario.");
    if (root.console && typeof root.console.warn === "function") {
      root.console.warn("Glosario: no se pudo cargar el índice.", error);
    }
    if (page.retryFocus) {
      page.retryFocus = false;
      focusElement(page.retryButton);
    }
  }

  function focusAfterRetry() {
    if (!page.retryFocus) return;
    page.retryFocus = false;
    focusElement(page.search || page.section);
  }

  function accept(entries, token, cached) {
    if (token !== page.token) return;
    var list = Array.isArray(entries) ? entries : [];
    var ref = refApi();
    if (!Array.isArray(entries) && ref && typeof ref.entries === "function") {
      list = ref.entries(KIND) || [];
    }
    page.entries = asArray(list);
    page.loaded = true;
    if (page.loading) page.loading.hidden = true;
    if (page.error) page.error.hidden = true;
    if (!cached) {
      renderAreaOptions();
      applyFilters();
    }
    focusAfterRetry();
  }

  function load(retryFocus) {
    page.token += 1;
    var token = page.token;
    page.retryFocus = !!retryFocus;
    var ref = refApi();
    if (!ref) {
      showError(new Error("StudyReference no está disponible."), token);
      return;
    }

    var cached = false;
    try {
      cached = typeof ref.state === "function" && ref.state(KIND) === "ready";
      if (cached) {
        page.entries = typeof ref.entries === "function" ? asArray(ref.entries(KIND)) : [];
        page.loaded = true;
      }
    } catch (error) {
      cached = false;
    }

    if (cached) {
      if (page.loading) page.loading.hidden = true;
      if (page.error) page.error.hidden = true;
      renderAreaOptions();
      applyFilters();
      focusAfterRetry();
    } else {
      showLoading();
    }

    var promise;
    try {
      promise = ref.load(KIND);
    } catch (error) {
      showError(error, token);
      return;
    }
    if (!promise || typeof promise.then !== "function") {
      accept(page.entries, token, cached);
      return;
    }
    promise.then(function (entries) {
      if (token !== page.token) return;
      accept(entries, token, cached);
    }, function (error) {
      if (token !== page.token) return;
      showError(error, token);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Eventos                                                            */
  /* ------------------------------------------------------------------ */

  function scheduleApply() {
    if (page.timer) root.clearTimeout(page.timer);
    page.timer = root.setTimeout(function () {
      page.timer = 0;
      if (!page.section || !page.section.isConnected) return;
      applyFilters();
    }, DEBOUNCE_MS);
  }

  function onSearchInput() {
    page.query = page.search ? page.search.value : "";
    scheduleApply();
  }

  function onSearchKeydown(event) {
    if (event.key !== "Escape") return;
    if (!page.search || !page.search.value) return;
    event.preventDefault();
    page.search.value = "";
    page.query = "";
    applyFilters();
  }

  function onAreaChange() {
    page.areaId = page.area ? page.area.value : "";
    if (page.timer) {
      root.clearTimeout(page.timer);
      page.timer = 0;
    }
    if (page.search) page.query = page.search.value;
    applyFilters();
  }

  function onClick(event) {
    var target = event.target && event.target.closest
      ? event.target.closest("[data-ref-action]")
      : null;
    if (!target || !page.section || !page.section.contains(target)) return;
    var action = target.getAttribute("data-ref-action");
    if (action === "retry") {
      event.preventDefault();
      load(true);
      return;
    }
    if (action === "clear") {
      event.preventDefault();
      clearFilters(true);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Ciclo de vida de la ruta                                           */
  /* ------------------------------------------------------------------ */

  function findSection(ctx) {
    var host = ctx && ctx.root ? ctx.root : root.document ? root.document.getElementById("view-root") : null;
    if (!host || typeof host.querySelector !== "function") return null;
    if (typeof host.matches === "function" && host.matches('[data-ref-view="' + VIEW + '"]')) return host;
    return host.querySelector('[data-ref-view="' + VIEW + '"]');
  }

  function render(ctx) {
    page.ctx = ctx || null;
    return shellHTML();
  }

  function mount(ctx) {
    var section = findSection(ctx);
    if (!section) return;
    page.ctx = ctx || null;
    page.section = section;
    page.body = section.querySelector("[data-ref-body]");
    page.results = section.querySelector("[data-ref-results]");
    page.count = section.querySelector("[data-ref-count]");
    page.search = section.querySelector("[data-ref-search]");
    page.area = section.querySelector("[data-ref-area]");
    page.loading = section.querySelector("[data-ref-loading]");
    page.error = section.querySelector("[data-ref-error]");
    page.errorText = section.querySelector("[data-ref-error-text]");
    page.retryButton = section.querySelector('[data-ref-action="retry"]');
    page.areaOptionsReady = false;

    section.addEventListener("click", onClick);
    if (page.search) {
      page.search.addEventListener("input", onSearchInput);
      page.search.addEventListener("keydown", onSearchKeydown);
    }
    if (page.area) page.area.addEventListener("change", onAreaChange);

    renderAreaOptions();
    syncToolbar();

    /* La única descarga de la vista: al entrar en la ruta. Al arrancar no se
       pide ningún derivado. */
    load(page.retryFocus);
  }

  function unmount() {
    page.token += 1;
    if (page.timer) {
      root.clearTimeout(page.timer);
      page.timer = 0;
    }
    if (page.section) {
      page.section.removeEventListener("click", onClick);
      if (page.search) {
        page.search.removeEventListener("input", onSearchInput);
        page.search.removeEventListener("keydown", onSearchKeydown);
      }
      if (page.area) page.area.removeEventListener("change", onAreaChange);
    }
    page.ctx = null;
    page.section = null;
    page.body = null;
    page.results = null;
    page.count = null;
    page.search = null;
    page.area = null;
    page.loading = null;
    page.error = null;
    page.errorText = null;
    page.retryButton = null;
    page.loaded = false;
    page.areaOptionsReady = false;
    page.retryFocus = false;
    /* La consulta y el área se conservan en memoria para que volver de una
       ficha no deshaga el contexto de la lista; el scroll lo restaura la app. */
  }

  /* ------------------------------------------------------------------ */
  /* Registro                                                           */
  /* ------------------------------------------------------------------ */

  var api = {
    version: VERSION,
    moduleId: MODULE_ID,
    view: VIEW,
    routePath: ROUTE_PATH,
    titleId: TITLE_ID,
    title: TITLE,
    render: render,
    mount: mount,
    unmount: unmount,
    filteredEntries: filteredEntries,
    sortedEntries: sortedEntries,
    __registered: false,
    __page: page,
    register: function register(scope) {
      if (api.__registered) return true;
      var host = scope || root;
      if (!host || !host.StudyApp || typeof host.StudyApp.registerModule !== "function") return false;
      host.StudyApp.registerModule({
        id: MODULE_ID,
        routes: [{
          path: ROUTE_PATH,
          title: TITLE,
          restoreScroll: true,
          render: render,
          mount: mount,
          unmount: unmount
        }]
      });
      api.__registered = true;
      return true;
    }
  };

  root.StudyGlossary = api;

  /* En el navegador StudyApp existe cuando este script se carga al final de
     index.html; si aún no está, se reintenta durante ~2 s sin bloquear. */
  if (root && root.document) {
    if (!api.register(root)) {
      var attempts = 0;
      (function waitForApp() {
        if (api.__registered || attempts >= RETRY_LIMIT) return;
        attempts += 1;
        if (api.register(root)) return;
        root.setTimeout(waitForApp, RETRY_DELAY);
      })();
    }
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
