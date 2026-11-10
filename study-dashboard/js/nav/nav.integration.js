/* © 2026 ZARCONT — Study Dashboard · Integración de navegación (Fase 1)
   Conecta los componentes de js/nav/* con la app: búsqueda en el cuerpo,
   índice de secciones, paleta Ctrl+K y fichas relacionadas. No registra rutas
   nuevas y no descarga índices derivados al arrancar. */
(function () {
  "use strict";

  var StudyApp = window.StudyApp;
  var SN = window.StudyNav;
  var UI = window.StudyUI;
  if (!StudyApp || !SN || !SN.search || !SN.sections || !SN.palette) {
    if (window.console && typeof window.console.error === "function") {
      window.console.error("StudyNav: no se pudo cargar la integración de navegación (faltan StudyApp o componentes).");
    }
    return;
  }

  var esc = UI && typeof UI.escapeHTML === "function"
    ? function (value) { return UI.escapeHTML(value); }
    : SN.escape;
  var icon = SN.icon;
  var uid = SN.util.uid;

  var provider = null;
  var bootstrapped = false;
  var eventsBound = false;
  var activeCtx = null;
  var shortcutOffs = [];
  var eventOffs = [];

  var searchPanel = null;
  var searchHost = null;
  var searchBody = null;
  var searchRoot = null;
  /* La app conservaba libraryQuery/filter en su estado de sesión; al sustituir
     el campo hay que conservar la consulta entre renders y rutas. */
  var searchQuery = "";
  var searchArea = "";

  var sectionsIndex = null;
  var sectionMain = null;
  var mountedSheetId = "";
  var mountedReader = null;

  var relatedMount = null;
  var relatedToken = 0;
  var relatedCache = null;
  var relatedFailed = false;

  var palette = null;

  function contentOf(ctx) {
    return (ctx && ctx.content) || window.STUDY_CONTENT || null;
  }

  function taxonomyOf(ctx) {
    return (ctx && ctx.taxonomy) || window.StudyTaxonomy || null;
  }

  function announce(text) {
    if (activeCtx && typeof activeCtx.announce === "function") activeCtx.announce(text);
    else if (typeof StudyApp.announce === "function") StudyApp.announce(text);
  }

  function navigate(hash) {
    if (activeCtx && activeCtx.app && typeof activeCtx.app.navigate === "function") activeCtx.app.navigate(hash);
    else StudyApp.navigate(hash);
  }

  /* ------------------------------------------------------------------ */
  /* Índice de búsqueda: derivado bajo demanda, con respaldo local       */
  /* ------------------------------------------------------------------ */

  function buildContentFallback(content, taxonomy) {
    return SN.search.buildIndexAsync(content, {
      taxonomy: taxonomy,
      chunkSize: 18,
      source: "content-fallback"
    }).then(function (index) {
      index.derivedFallback = true;
      return index;
    });
  }

  function loadSearchIndex() {
    var content = contentOf(activeCtx);
    var taxonomy = taxonomyOf(activeCtx);
    var derived = window.StudyDerived;
    if (!derived || typeof derived.load !== "function") {
      return buildContentFallback(content, taxonomy);
    }
    return derived.load("search").then(function (data) {
      var index = SN.search.adaptDerivedIndex(data, { content: content, taxonomy: taxonomy });
      index.derivedFallback = false;
      return index;
    }).catch(function (error) {
      /* Estrategia declarada: si el derivado no carga o no encaja con la
         versión del contenido, se indexa el temario una sola vez con
         buildIndexAsync. El error solo se muestra si también falla eso. */
      return buildContentFallback(content, taxonomy).catch(function () {
        throw error || new Error("No se pudo preparar el índice de búsqueda.");
      });
    });
  }

  function createSearchProvider() {
    var search = SN.search.createIndexProvider({
      content: contentOf(activeCtx),
      taxonomy: taxonomyOf(activeCtx),
      chunkSize: 18,
      load: loadSearchIndex
    });
    search.subscribe(function () { syncSearchSurface(); });
    return search;
  }

  /* La app registra los módulos antes de terminar su arranque y su hook init
     no siempre llega; la integración se prepara al cargar el script y de forma
     idempotente en onRoute/onSheetRender. Crear el provider no descarga nada. */
  function bootstrap() {
    if (bootstrapped) return;
    bootstrapped = true;
    provider = createSearchProvider();
    registerPaletteShortcuts();
    bindEvents();
  }

  /* ------------------------------------------------------------------ */
  /* Búsqueda de la biblioteca                                           */
  /* ------------------------------------------------------------------ */

  function libraryNodes() {
    if (!searchRoot) return [];
    return [
      searchRoot.querySelector("#library-summary"),
      searchRoot.querySelector("#library-results"),
      searchRoot.querySelector(".library-filters")
    ].filter(Boolean);
  }

  /* La ocultación es explícita (atributo hidden) además de la clase CSS, para
     que el estado sea inspeccionable y no dependa solo de la hoja de estilos. */
  function setLibraryNodesHidden(hidden) {
    libraryNodes().forEach(function (node) { node.hidden = !!hidden; });
  }

  function syncSearchSurface() {
    if (!searchPanel || !searchBody) return;
    var query = String(searchPanel.getQuery() || "").trim();
    var state = provider ? provider.getState() : { state: "idle" };
    var searching = !!query;
    var show = searching || state.state === "loading" || state.state === "error";
    searchBody.hidden = !show;
    searchBody.classList.toggle("navx-search-results-host--visible", show);
    if (searchRoot) searchRoot.classList.toggle("navx-library-searching", searching);
    if (searchHost) searchHost.classList.toggle("navx-search-host--active", searching);
    setLibraryNodesHidden(searching);
  }

  function openSearchResult(ctx, id, result) {
    if (!id) return;
    var title = result && result.title ? result.title : "la ficha";
    navigate("#/ficha/" + encodeURIComponent(id));
    announce("Abriendo " + title + ".");
  }

  function destroySearch() {
    if (searchPanel) {
      searchQuery = String(searchPanel.getQuery() || "");
      searchArea = String(searchPanel.getArea() || "");
      try { searchPanel.destroy(); } catch (e) {}
      searchPanel = null;
    }
    if (searchRoot) {
      searchRoot.classList.remove("navx-library-searching");
      setLibraryNodesHidden(false);
    }
    if (searchBody) {
      searchBody.hidden = true;
      searchBody.innerHTML = "";
      searchBody.classList.remove("navx-search-results-host", "navx-search-results-host--visible", "navx-search-body");
      searchBody.removeAttribute("data-navx-search-body");
      searchBody.removeAttribute("data-state");
      searchBody.setAttribute("aria-busy", "false");
    }
    if (searchHost) searchHost.classList.remove("navx-search-host", "navx-search-host--active");
    searchPanel = null;
    searchHost = null;
    searchBody = null;
    searchRoot = null;
  }

  function mountSearch(ctx) {
    var host = ctx.root.querySelector('[data-module-mount="library-search"]');
    var body = ctx.root.querySelector("#library-body-results");
    if (!host || !body || !provider || searchPanel) return;

    host.classList.add("navx-search-host");
    body.classList.add("navx-search-results-host");
    searchHost = host;
    searchBody = body;
    searchRoot = ctx.root;
    try {
      searchPanel = SN.search.createPanel({
        mount: host,
        resultsMount: body,
        provider: provider,
        content: ctx.content,
        taxonomy: ctx.taxonomy,
        inputAttributes: { "data-library-search-input": "" },
        onQueryChange: function (query, meta) {
          searchQuery = String(query || "");
          if (meta && meta.areaId != null) searchArea = String(meta.areaId);
          syncSearchSurface();
        },
        hrefFor: function (id) { return "#/ficha/" + encodeURIComponent(id); },
        onOpenSheet: function (id, result) { openSearchResult(ctx, id, result); }
      });
    } catch (error) {
      searchPanel = null;
      destroySearch();
      return;
    }
    /* La consulta y el área sobreviven a un refresh de ruta o a volver de una
       ficha, igual que libraryQuery en el estado de la app. */
    if (searchArea) searchPanel.setArea(searchArea);
    if (searchQuery) searchPanel.setQuery(searchQuery, { focus: false });
    syncSearchSurface();
  }

  /* ------------------------------------------------------------------ */
  /* Índice de secciones del lector                                      */
  /* ------------------------------------------------------------------ */

  function destroySections() {
    if (sectionsIndex) {
      try { sectionsIndex.destroy(); } catch (e) {}
      sectionsIndex = null;
    }
    if (sectionMain) {
      sectionMain.classList.remove("navx-reader-main--indexed");
      sectionMain = null;
    }
  }

  function mountSections(ctx) {
    var mount = ctx.root.querySelector('[data-module-mount="reader-index"]');
    if (!mount) return;
    var reader = ctx.root.querySelector("article.reader") || ctx.root;
    try {
      sectionsIndex = SN.sections.create({
        mount: mount,
        root: reader,
        selector: ".reader-section",
        headingSelector: "h2, h3",
        offset: 84,
        mobileBreakpoint: 900
      });
    } catch (error) {
      sectionsIndex = null;
      return;
    }
    if (sectionsIndex && sectionsIndex.visible) {
      sectionMain = ctx.root.querySelector(".reader-main");
      if (sectionMain) sectionMain.classList.add("navx-reader-main--indexed");
      mount.classList.add("navx-reader-index");
    }
  }

  /* ------------------------------------------------------------------ */
  /* Fichas relacionadas: evidencia primero y respaldo estructural       */
  /* ------------------------------------------------------------------ */

  function loadRelatedData() {
    if (relatedCache) return Promise.resolve(relatedCache);
    if (relatedFailed) return Promise.reject(new Error("Las relaciones no están disponibles."));
    var derived = window.StudyDerived;
    if (!derived || typeof derived.load !== "function") {
      relatedFailed = true;
      return Promise.reject(new Error("No hay cargador de derivados."));
    }
    return derived.load("related").then(function (data) {
      var map = {};
      (Array.isArray(data.entries) ? data.entries : []).forEach(function (entry) {
        if (entry && entry.sheetId) map[entry.sheetId] = entry;
      });
      relatedCache = { map: map, data: data };
      return relatedCache;
    }).catch(function (error) {
      relatedFailed = true;
      throw error;
    });
  }

  function relatedTerms(rel) {
    var terms = [];
    function add(value) {
      var term = String(value == null ? "" : value).trim();
      if (term && terms.indexOf(term) === -1) terms.push(term);
    }
    (rel && Array.isArray(rel.sharedTerms) ? rel.sharedTerms : []).forEach(add);
    if (!terms.length && rel && rel.evidence) {
      add(rel.evidence.source && rel.evidence.source.term);
      add(rel.evidence.target && rel.evidence.target.term);
    }
    return terms;
  }

  function evidenceReason(sheet, rel) {
    var terms = relatedTerms(rel);
    if (!terms.length) return "";
    var shown = terms.slice(0, 2).map(function (term) { return "«" + term + "»"; }).join(" y ");
    var reason = (terms.length > 1 ? "Comparten los términos " : "Comparten el término ") + shown;
    if (terms.length > 2) reason += " y " + (terms.length - 2) + " más";
    var source = rel && rel.evidence && rel.evidence.source;
    var sectionIndex = source ? Number(source.sectionIndex) : NaN;
    if (Number.isFinite(sectionIndex) && sheet.sections && sheet.sections[sectionIndex]) {
      var title = sheet.sections[sectionIndex].title;
      if (title) reason += " en la sección «" + title + "»";
    }
    return reason;
  }

  function targetPath(target, taxonomy) {
    var category = taxonomy && typeof taxonomy.categoryForSheet === "function" ? taxonomy.categoryForSheet(target) : null;
    var area = taxonomy && typeof taxonomy.areaForSheet === "function" ? taxonomy.areaForSheet(target) : null;
    return [
      area ? String(area.short || area.title || "") : "",
      category ? String(category.short || category.title || "") : ""
    ].filter(Boolean).join(" · ");
  }

  function buildRelatedTargets(ctx, cache) {
    var content = contentOf(ctx);
    var taxonomy = taxonomyOf(ctx);
    var sheet = ctx.sheet;
    if (!content || !sheet) return [];
    var targets = [];
    var seen = {};
    seen[sheet.id] = true;

    function push(target, reason, tag) {
      if (!target || !target.id || seen[target.id] || targets.length >= 4) return;
      targets.push({ sheet: target, reason: reason, tag: tag });
      seen[target.id] = true;
    }

    var entry = cache && cache.map ? cache.map[sheet.id] : null;
    (entry && Array.isArray(entry.related) ? entry.related : []).forEach(function (rel) {
      if (!rel || targets.length >= 4) return;
      var target = content.sheetById ? content.sheetById[rel.sheetId] : null;
      if (!target) return;
      var reason = evidenceReason(sheet, rel);
      if (!reason) return;
      push(target, reason, "Evidencia");
    });

    if (targets.length < 4) {
      var topic = content.topicById ? content.topicById[sheet.topicId] : null;
      var topicSheets = (content.sheets || []).filter(function (item) {
        return item.topicId && item.topicId === sheet.topicId;
      });
      if (topicSheets.length > 1) {
        var topicTitle = topic && topic.title ? topic.title : "este tema";
        topicSheets.filter(function (item) {
          return item.id !== sheet.id && !seen[item.id];
        }).slice(0, 3).forEach(function (target) {
          push(target, "Comparten el tema: «" + topicTitle + "»", "Mismo tema");
        });
      } else {
        var category = taxonomy && typeof taxonomy.categoryForSheet === "function"
          ? taxonomy.categoryForSheet(sheet)
          : null;
        var categoryId = category ? category.id : sheet.categoryId;
        var categorySiblings = (content.sheets || []).filter(function (item) {
          return categoryId && item.categoryId === categoryId && item.id !== sheet.id && !seen[item.id];
        });
        var categoryTitle = category && category.title ? category.title : "esta categoría";
        categorySiblings.slice(0, 3).forEach(function (target) {
          push(target, "Comparten la categoría: «" + categoryTitle + "»", "Misma categoría");
        });
      }
    }
    return targets;
  }

  function relatedHTML(ctx, targets) {
    if (!targets.length) return "";
    var titleId = uid("navx-related-title");
    var list = targets.map(function (item, index) {
      var path = targetPath(item.sheet, taxonomyOf(ctx));
      return '<li class="navx-related-item">' +
        '<a class="navx-related-card" href="#/ficha/' + encodeURIComponent(item.sheet.id) + '" data-nav>' +
          '<span class="navx-related-num" aria-hidden="true">' + String(index + 1).padStart(2, "0") + '</span>' +
          '<span class="navx-related-copy">' +
            '<span class="navx-related-meta">' + esc(path || "Ficha del temario") +
              '<span class="navx-related-tag">' + esc(item.tag) + '</span>' +
            '</span>' +
            '<b class="navx-related-title">' + esc(item.sheet.title) + '</b>' +
            '<span class="navx-related-reason">' + esc(item.reason) + '</span>' +
          '</span>' +
          '<span class="navx-related-open" aria-hidden="true">' + icon("arrow", 15) + '</span>' +
        '</a>' +
      '</li>';
    }).join("");
    return '<section class="navx-related" aria-labelledby="' + esc(titleId) + '">' +
      '<div class="navx-related-head">' +
        '<span class="navx-kicker">Sigue leyendo</span>' +
        '<h2 class="navx-related-heading" id="' + esc(titleId) + '">Fichas relacionadas</h2>' +
        '<p class="navx-related-intro">Relaciones tomadas de términos compartidos y, cuando no hay evidencia, del mismo tema o categoría.</p>' +
      '</div>' +
      '<ul class="navx-related-list">' + list + '</ul>' +
    '</section>';
  }

  function renderRelated(ctx, mount, cache) {
    var targets = buildRelatedTargets(ctx, cache);
    mount.innerHTML = relatedHTML(ctx, targets);
  }

  function destroyRelated() {
    relatedToken += 1;
    if (relatedMount) {
      relatedMount.innerHTML = "";
      relatedMount = null;
    }
  }

  function mountRelated(ctx) {
    var mount = ctx.root.querySelector('[data-module-mount="reader-related"]');
    if (!mount) return;
    relatedMount = mount;
    relatedToken += 1;
    var token = relatedToken;
    mount.innerHTML = "";
    loadRelatedData().then(function (cache) {
      if (token !== relatedToken || !mount.isConnected) return;
      renderRelated(ctx, mount, cache);
    }).catch(function () {
      if (token !== relatedToken || !mount.isConnected) return;
      renderRelated(ctx, mount, null);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Ciclo de vida del lector                                            */
  /* ------------------------------------------------------------------ */

  function destroyReader() {
    destroySections();
    destroyRelated();
    mountedSheetId = "";
    mountedReader = null;
  }

  function mountSheet(ctx) {
    if (!ctx || !ctx.isSheet || !ctx.sheet) return;
    if (mountedSheetId === ctx.sheet.id && mountedReader === ctx.root.querySelector("article.reader")) return;
    if (sectionsIndex || relatedMount) {
      destroySections();
      destroyRelated();
    }
    mountedSheetId = ctx.sheet.id;
    mountedReader = ctx.root.querySelector("article.reader");
    mountSections(ctx);
    mountRelated(ctx);
  }

  /* ------------------------------------------------------------------ */
  /* Paleta de comandos (Ctrl+K / ⌘K)                                    */
  /* ------------------------------------------------------------------ */

  function uniquePaletteViews(views) {
    var ids = {};
    var hrefs = {};
    var labels = {};
    return views.filter(function (view) {
      var id = String((view && view.id) || "");
      var href = String((view && view.href) || "");
      var label = String((view && view.label) || "").trim().toLowerCase();
      if (!id || !href || !label) return false;
      if (ids[id] || hrefs[href] || labels[label]) return false;
      ids[id] = true;
      hrefs[href] = true;
      labels[label] = true;
      return true;
    });
  }

  function paletteViews() {
    /* Fase 2: las cuatro rutas de planificación. Si sus módulos aún no están
       registrados, el router muestra su 404 editorial; la entrada y el enlace
       ya son los definitivos y QA valida las rutas al integrarse. */
    return uniquePaletteViews([
      { id: "panel", kind: "view", label: "Panel", hint: "Vista general y continuar", icon: "grid", href: "#/", keywords: "inicio portada panel" },
      { id: "biblioteca", kind: "view", label: "Biblioteca", hint: "Áreas, categorías y fichas", icon: "book", href: "#/biblioteca", keywords: "temario areas categorias biblioteca" },
      { id: "progreso", kind: "view", label: "Progreso", hint: "Actividad, historial y favoritas", icon: "chart", href: "#/progreso", keywords: "avance estadisticas progreso" },
      { id: "ruta", kind: "view", label: "Ruta de hoy", hint: "Qué toca hoy y resumen semanal", icon: "compass", href: "#/ruta", keywords: "ruta hoy planificacion diaria resumen semanal tareas" },
      { id: "plan", kind: "view", label: "Plan de estudio", hint: "Examen, minutos diarios y prioridad por área", icon: "calendar", href: "#/plan", keywords: "plan estudio examen fecha minutos diarios prioridad areas" },
      { id: "dominio", kind: "view", label: "Mapa de dominio", hint: "Fuerzas, huecos y cobertura real", icon: "target", href: "#/dominio", keywords: "dominio mapa mastery areas categorias cobertura" },
      { id: "repaso", kind: "view", label: "Repaso de fichas", hint: "Vencimientos y autoevaluación", icon: "rotate", href: "#/repaso", keywords: "repaso fichas espaciado vencimiento autoevaluacion" },
      { id: "relampago", kind: "view", label: "Repaso relámpago", hint: "Diez preguntas rápidas para activar el recuerdo", icon: "flame", href: "#/relampago", keywords: "relampago repaso rapido preguntas quiz memoria" },
      { id: "ultimo-dia", kind: "view", label: "Hoja de último día", hint: "Datos, glosario y trampas en una hoja imprimible", icon: "calendar", href: "#/ultimo-dia", keywords: "ultimo dia hoja examen resumen imprimir" },
      { id: "glosario", kind: "view", label: "Glosario", hint: "Definiciones literales del temario por área", icon: "book", href: "#/glosario", keywords: "glosario definiciones terminos vocabulario" },
      { id: "datos", kind: "view", label: "Datos para memorizar", hint: "Cifras y datos clave con seguimiento", icon: "list", href: "#/datos", keywords: "datos memorizar cifras numeros hechos" },
      { id: "trampas", kind: "view", label: "Trampas frecuentes", hint: "Distinciones y avisos para no confundir", icon: "alert", href: "#/trampas", keywords: "trampas errores avisos distinciones frecuentes" },
      { id: "subrayados", kind: "view", label: "Mis subrayados", hint: "Marcas y notas de lectura", icon: "bookmark", href: "#/subrayados", keywords: "subrayados marcas notas lectura" },
      { id: "dudas", kind: "view", label: "Dudas", hint: "Bandeja de dudas pendientes", icon: "flag", href: "#/dudas", keywords: "dudas preguntas pendientes bandeja" },
      { id: "respaldo", kind: "view", label: "Respaldo y datos", hint: "Exportar, importar o borrar progreso", icon: "loop", href: "#/respaldo", keywords: "respaldo backup datos exportar importar borrar" }
    ]);
  }

  function paletteActions() {
    var actions = [];
    if (UI && typeof UI.toggleTheme === "function") {
      var light = typeof UI.getTheme === "function" && UI.getTheme() === "light";
      actions.push({
        id: "theme",
        kind: "action",
        label: light ? "Usar tema oscuro" : "Usar tema claro",
        hint: "Cambia la apariencia de la app",
        icon: light ? "moon" : "sun",
        keywords: "tema apariencia claro oscuro",
        run: function () {
          UI.toggleTheme();
          var next = typeof UI.getTheme === "function" && UI.getTheme() === "light" ? "claro" : "oscuro";
          if (UI.toast) UI.toast("Tema " + next + " activado");
          announce("Tema " + next + " activado.");
        }
      });
    }
    actions.push({
      id: "backup-open",
      kind: "action",
      label: "Abrir respaldo y datos",
      hint: "Exportar, importar o borrar progreso",
      icon: "loop",
      href: "#/respaldo",
      keywords: "respaldo backup datos abrir exportar importar borrar"
    });
    if (SN.palette && typeof SN.palette.downloadBackup === "function") {
      actions.push({
        id: "backup-export",
        kind: "action",
        label: "Exportar respaldo",
        hint: "Descarga tu progreso en JSON",
        icon: "external",
        keywords: "respaldo backup exportar json descargar",
        run: function () {
          var ok = SN.palette.downloadBackup();
          if (UI && UI.toast) UI.toast(ok ? "Respaldo exportado" : "No se pudo exportar el respaldo", ok ? "" : "warn");
          announce(ok ? "Respaldo exportado." : "No se pudo exportar el respaldo.");
        }
      });
    }
    return actions;
  }

  function ensurePalette() {
    bootstrap();
    if (palette) return palette;
    palette = SN.palette.create({
      provider: provider,
      content: contentOf(activeCtx),
      taxonomy: taxonomyOf(activeCtx),
      bindShortcut: false,
      lazyIndex: true,
      views: paletteViews(),
      actions: paletteActions,
      onOpenSheet: function (id) {
        navigate("#/ficha/" + encodeURIComponent(id));
        announce("Abriendo ficha.");
      },
      onNavigate: function (href) {
        if (href) navigate(href);
      }
    });
    return palette;
  }

  function canReturnFocus(element) {
    return !!(element && element.isConnected && typeof element.focus === "function" &&
      element.getClientRects().length > 0 && !element.closest("[inert]"));
  }

  function activeElementForReturn() {
    var active = document.activeElement;
    if (active && active !== document.body && active !== document.documentElement && canReturnFocus(active)) {
      return active;
    }
    return document.getElementById("main") || document.body;
  }

  function openPalette(trigger) {
    ensurePalette();
    var opener = trigger || null;
    /* El evento puede entregar el botón interior de Más; ese nodo queda
       oculto al cerrar el panel. Se normaliza al disparador visible de Más o,
       si Más no está visible en este viewport, al contenido principal. */
    if (opener && opener.closest && opener.closest("#dash-more-panel")) {
      opener = document.querySelector('[data-action="more-open"]') || opener;
    }
    if (!canReturnFocus(opener)) opener = null;
    palette.open(opener || activeElementForReturn());
  }

  function togglePalette() {
    ensurePalette();
    if (palette.isOpen()) palette.close();
    else palette.open(activeElementForReturn());
  }

  function registerPaletteShortcuts() {
    if (shortcutOffs.length) return;
    var specs = [
      { id: "navx-palette-ctrl-k", key: "k", ctrlKey: true, metaKey: false, allowInInputs: true, run: togglePalette },
      { id: "navx-palette-meta-k", key: "k", ctrlKey: false, metaKey: true, allowInInputs: true, run: togglePalette }
    ];
    specs.forEach(function (spec) {
      var off = StudyApp.shortcuts.register(spec);
      if (typeof off === "function") shortcutOffs.push(off);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Eventos y arranque                                                  */
  /* ------------------------------------------------------------------ */

  function bindEvents() {
    if (eventsBound) return;
    eventsBound = true;
    eventOffs.push(StudyApp.events.on("palette:open", function (detail) {
      openPalette(detail && detail.trigger ? detail.trigger : null);
    }));
    eventOffs.push(StudyApp.events.on("route:change", function () {
      if (palette && palette.isOpen()) palette.close();
    }));
    eventOffs.push(StudyApp.events.on("sheet:rendered", function (detail) {
      if (!detail || !detail.sheet) return;
      if (mountedSheetId === detail.sheet.id &&
          mountedReader === document.querySelector("#view-root article.reader")) return;
      if (activeCtx && activeCtx.isSheet && activeCtx.sheet && activeCtx.sheet.id === detail.sheet.id) {
        mountSheet(activeCtx);
      }
    }));
    eventOffs.push(StudyApp.events.on("store:change", function () {
      if (palette && palette.isOpen()) palette.refresh();
    }));
  }

  function syncInitialRoute() {
    if (activeCtx) return;
    var root = document.getElementById("view-root");
    var route = typeof StudyApp.getRoute === "function" ? StudyApp.getRoute() : null;
    if (!root || !route) return;
    var store = window.StudyStore;
    var sheet = route.name === "sheet" && route.sheetId && store && typeof store.getSheet === "function"
      ? store.getSheet(route.sheetId)
      : null;
    activeCtx = {
      app: StudyApp,
      store: store,
      ui: UI,
      content: contentOf(null),
      taxonomy: taxonomyOf(null),
      route: route,
      previousRoute: null,
      root: root,
      isSheet: !!sheet,
      sheet: sheet,
      params: route.params || [],
      navigate: StudyApp.navigate,
      refresh: StudyApp.refresh,
      announce: StudyApp.announce
    };
    if (route.name === "library" && root.querySelector('[data-module-mount="library-search"]')) {
      mountSearch(activeCtx);
    } else if (sheet) {
      mountSheet(activeCtx);
    }
  }

  function onRoute(ctx) {
    bootstrap();
    activeCtx = ctx;
    if (palette && palette.isOpen()) palette.close();
    destroySearch();
    destroyReader();
    if (ctx.route && ctx.route.name === "library") {
      mountSearch(ctx);
    }
    /* En #/ficha/:id el montaje llega por onSheetRender, ya con el artículo
       renderizado y los IDs section-N disponibles. */
  }

  function onSheetRender(ctx) {
    bootstrap();
    activeCtx = ctx;
    mountSheet(ctx);
  }

  function init(ctx) {
    activeCtx = ctx || activeCtx;
    bootstrap();
    /* Si el módulo se registra después del primer render, la app no vuelve a
       llamar onRoute por la ruta activa. Se monta aquí lo que corresponda sin
       forzar un refresh ni mover el scroll. */
    if (ctx && ctx.root) {
      if (ctx.route && ctx.route.name === "library" && !searchPanel) mountSearch(ctx);
      else if (ctx.isSheet && ctx.sheet && !mountedSheetId) mountSheet(ctx);
    }
  }

  /* Preparación inmediata: el provider no descarga nada y los atajos deben
     existir aunque el hook init de la app no llegue a ejecutarse. */
  bootstrap();

  var registered = StudyApp.registerModule({
    id: "nav",
    init: init,
    onRoute: onRoute,
    onSheetRender: onSheetRender
  });

  if (!registered) {
    if (window.console && typeof window.console.error === "function") {
      window.console.error("StudyNav: el módulo nav no pudo registrarse.");
    }
    return;
  }

  /* Carrera de arranque: si la app ya pintó la ruta antes de que este script
     se registrara, no habrá onRoute para ella. Se monta lo que se pueda con
     el contexto público de StudyApp; no se fuerza ningún refresh. */
  syncInitialRoute();
})();
