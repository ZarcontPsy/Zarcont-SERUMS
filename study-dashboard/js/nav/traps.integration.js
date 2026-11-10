/* SERUMS STUDY — Trampas frecuentes (#/trampas, Fase 3)
   Módulo `traps`: lista consultable de avisos (`callout`) y distinciones
   (`bullet`) extraídos del temario. El derivado warnings.json se pide SOLO en
   mount; al arrancar no se descarga nada.

   Reglas del módulo:
   · Usa StudyReference (§3 del contrato) para carga perezosa, anotación de
     área/ficha, búsqueda sin acentos, filtros y escape. No duplica el cargador.
   · No inventa avisos ni duplica entradas: solo pinta lo que devuelve el
     derivado, deduplicado por `id` y ordenado por área/ficha/sección.
   · Estado de carga, error con reintento, vacío y foco conservado. El foco de
     los filtros no se pierde porque solo se vuelve a pintar la lista; al pulsar
     «Mostrar otros 40» se añaden elementos sin retirar el botón.
   · Límite inicial de 40 resultados; cada pulsación añade otros 40.
   · Todo el HTML se escapa; el CSS vive en css/traps.css bajo .ref-page--traps.

   Contrato: study-dashboard/docs/CONTRATOS-FASE3.md §4.3
   Uso:
     navegador  <script src="js/nav/reference.js"></script>
                <script src="js/nav/traps.integration.js"></script>
                -> window.StudyTraps (se registra solo)
     Node       require("./traps.integration.js")
                -> global.StudyTraps (helpers puros, sin DOM)

   © 2026 ZARCONT */
(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var MODULE_ID = "traps";
  var VIEW = "trampas";
  var ROUTE_PATH = "trampas";
  var TITLE = "Trampas frecuentes";
  var TITLE_ID = "ref-trampas-title";
  var INITIAL_LIMIT = 40;
  var PAGE_SIZE = 40;
  var SEVERITY_LABELS = {
    warning: "Advertencia",
    caution: "Precaución"
  };
  var SOURCE_FALLBACK = {
    callout: "Aviso",
    bullet: "Distinción",
    text: "Referencia"
  };

  var page = {
    ctx: null,
    section: null,
    bodyEl: null,
    countEl: null,
    loadingEl: null,
    errorEl: null,
    contentEl: null,
    listHost: null,
    searchEl: null,
    areaEl: null,
    sourceEl: null,
    entries: null,
    filtered: null,
    query: "",
    areaId: "",
    source: "",
    limit: INITIAL_LIMIT,
    token: 0,
    offs: []
  };

  /* ------------------------------------------------------------------ */
  /* Accesos al host y utilidades                                        */
  /* ------------------------------------------------------------------ */

  function reference() {
    return root && root.StudyReference ? root.StudyReference : null;
  }
  function documentRoot() {
    return root && root.document ? root.document : null;
  }
  function hasDom() {
    return !!documentRoot();
  }
  function contentOf(ctx) {
    var scope = ctx || page.ctx;
    if (scope && scope.content && Array.isArray(scope.content.sheets)) return scope.content;
    return root && root.STUDY_CONTENT ? root.STUDY_CONTENT : null;
  }
  function esc(value) {
    var R = reference();
    if (R && typeof R.escape === "function") return R.escape(value);
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  function icon(name, size) {
    var R = reference();
    return R && typeof R.icon === "function" ? R.icon(name, size || 15) : "";
  }
  function plural(n, one, many) {
    var R = reference();
    if (R && typeof R.plural === "function") return R.plural(n, one, many);
    return Number(n) === 1 ? one : (many || one + "s");
  }
  function clip(value, max) {
    var text = String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    if (text.length <= max) return text;
    return text.slice(0, Math.max(0, max - 1)).replace(/[\s,;:.-]+$/, "") + "…";
  }
  function sheetHref(sheetId) {
    var R = reference();
    if (R && typeof R.sheetHref === "function") return R.sheetHref(sheetId);
    return "#/ficha/" + encodeURIComponent(sheetId || "");
  }
  function focusEl(el) {
    if (!el || typeof el.focus !== "function") return;
    try { el.focus({ preventScroll: true }); } catch (error) {
      try { el.focus(); } catch (error2) { /* sin foco disponible */ }
    }
  }
  function listen(target, type, handler) {
    target.addEventListener(type, handler);
    return function () { target.removeEventListener(type, handler); };
  }

  /* ------------------------------------------------------------------ */
  /* Orden estable: área oficial, ficha del temario, sección, id         */
  /* ------------------------------------------------------------------ */

  function rankOf(map, id) {
    return Object.prototype.hasOwnProperty.call(map, id) ? map[id] : 9999;
  }
  function numberOrZero(value) {
    var n = Number(value);
    return isFinite(n) ? n : 0;
  }
  function compareIds(a, b) {
    var sa = String(a == null ? "" : a);
    var sb = String(b == null ? "" : b);
    var na = parseInt(sa.replace(/\D+/g, ""), 10);
    var nb = parseInt(sb.replace(/\D+/g, ""), 10);
    if (isFinite(na) && isFinite(nb) && na !== nb) return na - nb;
    return sa < sb ? -1 : (sa > sb ? 1 : 0);
  }

  /* Puro y exportado para pruebas. `content` puede ser STUDY_CONTENT o el
     contexto de la app; si falta, se ordena por sheetId como respaldo. */
  function sortEntries(list, content) {
    var items = Array.isArray(list) ? list.slice() : [];
    var areaRank = {};
    var sheetRank = {};
    var R = reference();
    var areas = [];
    if (R && typeof R.areaOptions === "function") {
      try { areas = R.areaOptions() || []; } catch (error) { areas = []; }
    }
    if (!areas.length && content && Array.isArray(content.primaryAreas)) {
      areas = content.primaryAreas;
    }
    areas.forEach(function (area, index) {
      if (area && area.id) areaRank[area.id] = index;
    });
    var sheets = content && Array.isArray(content.sheets) ? content.sheets : [];
    sheets.forEach(function (sheet, index) {
      if (sheet && sheet.id) sheetRank[sheet.id] = index;
    });
    return items.sort(function (a, b) {
      if (!a || !b) return a ? -1 : (b ? 1 : 0);
      var areaA = rankOf(areaRank, a.areaId);
      var areaB = rankOf(areaRank, b.areaId);
      if (areaA !== areaB) return areaA - areaB;
      var sheetA = rankOf(sheetRank, a.sheetId);
      var sheetB = rankOf(sheetRank, b.sheetId);
      if (sheetA !== sheetB) return sheetA - sheetB;
      if (sheetA === 9999) {
        var bySheet = String(a.sheetId || "").localeCompare(String(b.sheetId || ""));
        if (bySheet) return bySheet;
      }
      var sectionA = numberOrZero(a.sectionIndex);
      var sectionB = numberOrZero(b.sectionIndex);
      if (sectionA !== sectionB) return sectionA - sectionB;
      return compareIds(a.id, b.id);
    });
  }

  function prepareEntries(list, content) {
    var seen = {};
    var out = [];
    (Array.isArray(list) ? list : []).forEach(function (entry) {
      if (!entry || entry.id === undefined || entry.id === null || entry.id === "") return;
      var id = String(entry.id);
      if (seen[id]) return;
      seen[id] = true;
      out.push(entry);
    });
    return sortEntries(out, content);
  }

  function countLabel(shown, total, filtered) {
    if (!total) return "Sin resultados";
    if (shown >= total) {
      return total + " " + plural(total, "resultado", "resultados") + (filtered ? " coincidentes" : "");
    }
    return "Mostrando " + shown + " de " + total + " " + plural(total, "resultado", "resultados");
  }

  /* ------------------------------------------------------------------ */
  /* HTML de la vista                                                   */
  /* ------------------------------------------------------------------ */

  function shellHTML() {
    return '<section class="ref-page ref-page--traps ref-traps" data-ref-view="' + VIEW + '" aria-labelledby="' + TITLE_ID + '">' +
      '<header class="ref-traps-head">' +
        '<a class="ref-traps-back" href="#/" data-nav>' + icon("arrowLeft", 14) + '<span>Panel</span></a>' +
        '<span class="ref-traps-kicker"><span class="ref-traps-dot" aria-hidden="true"></span>Herramientas</span>' +
        '<h1 class="ref-traps-title" id="' + TITLE_ID + '">' + TITLE + '</h1>' +
        '<p class="ref-traps-lede">Avisos y distinciones que el temario marca para no confundir. Filtra por área o fuente y abre la ficha exacta para revisar el contexto.</p>' +
        '<p class="ref-traps-count" data-ref-count data-state="loading" role="status" aria-live="polite" aria-atomic="true">Cargando avisos…</p>' +
      '</header>' +
      '<div class="ref-traps-body" data-ref-body aria-busy="true">' +
        '<div class="ref-traps-loading" data-ref-loading role="status">' +
          '<span class="ref-traps-loading-text">Cargando avisos y distinciones…</span>' +
          '<span class="ref-traps-skeleton" aria-hidden="true"><i></i><i></i><i></i></span>' +
        '</div>' +
        '<div class="ref-traps-error" data-ref-error role="alert" hidden></div>' +
        '<div class="ref-traps-content" data-ref-content hidden></div>' +
      '</div>' +
      '</section>';
  }

  function render(ctx) {
    page.ctx = ctx || null;
    return shellHTML();
  }

  function areaOptionsHTML() {
    var R = reference();
    var areas = [];
    if (R && typeof R.areaOptions === "function") {
      try { areas = R.areaOptions() || []; } catch (error) { areas = []; }
    }
    var html = '<option value="">Todas las áreas</option>';
    areas.forEach(function (area) {
      if (!area || !area.id) return;
      html += '<option value="' + esc(area.id) + '">' + esc(area.title || area.short || area.id) + '</option>';
    });
    return html;
  }

  function contentHTML() {
    return '<div class="ref-traps-toolbar" role="group" aria-label="Filtrar avisos y distinciones">' +
      '<div class="ref-traps-search">' +
        '<span class="ref-traps-search-icon" aria-hidden="true">' + icon("search", 17) + '</span>' +
        '<label class="s-sr-only" for="ref-traps-search">Buscar avisos y distinciones</label>' +
        '<input class="ref-traps-search-input" id="ref-traps-search" type="search" data-ref-search autocomplete="off" spellcheck="false" placeholder="Buscar por título, texto o sección">' +
      '</div>' +
      '<label class="ref-traps-select">' +
        '<span class="ref-traps-select-label">Área</span>' +
        '<select class="ref-traps-select-input" data-ref-area>' + areaOptionsHTML() + '</select>' +
        '<span class="ref-traps-select-icon" aria-hidden="true">' + icon("chevronDown", 13) + '</span>' +
      '</label>' +
      '<label class="ref-traps-select">' +
        '<span class="ref-traps-select-label">Fuente</span>' +
        '<select class="ref-traps-select-input" data-ref-source>' +
          '<option value="todos">Todos</option>' +
          '<option value="callout">Aviso</option>' +
          '<option value="bullet">Distinción</option>' +
        '</select>' +
        '<span class="ref-traps-select-icon" aria-hidden="true">' + icon("chevronDown", 13) + '</span>' +
      '</label>' +
      '</div>' +
      '<div class="ref-traps-list-head">' +
        '<h2 class="ref-traps-list-title">Avisos y distinciones</h2>' +
        '<span class="ref-traps-list-note">Ordenados por área, ficha y sección</span>' +
      '</div>' +
      '<div class="ref-traps-list-host" data-ref-list-host></div>';
  }

  function errorHTML(error) {
    var detail = error && error.message ? clip(error.message, 180) : "";
    return '<div class="ref-traps-error-box">' +
      '<span class="ref-traps-error-icon" aria-hidden="true">' + icon("alert", 20) + '</span>' +
      '<div class="ref-traps-error-copy">' +
        '<p class="ref-traps-error-title">No se pudieron cargar los avisos</p>' +
        '<p class="ref-traps-error-text">Revisa que el derivado de avisos esté disponible y vuelve a intentarlo.</p>' +
        (detail ? '<p class="ref-traps-error-detail">' + esc(detail) + '</p>' : "") +
        '<div class="ref-traps-error-actions">' +
          '<button class="s-btn s-btn--sm ref-traps-retry" type="button" data-ref-action="retry">' + icon("rotate", 15) + ' Volver a intentar</button>' +
          '<a class="s-btn s-btn--ghost s-btn--sm ref-traps-error-back" href="#/" data-nav>Volver al panel</a>' +
        '</div>' +
      '</div>' +
      '</div>';
  }

  function emptyHTML() {
    var query = page.query.trim();
    var detail = query
      ? 'No hay avisos ni distinciones que coincidan con «' + esc(query) + '».'
      : 'No hay avisos ni distinciones con los filtros elegidos.';
    return '<div class="ref-traps-empty" data-ref-empty>' +
      '<span class="ref-traps-empty-icon" aria-hidden="true">' + icon("search", 20) + '</span>' +
      '<h2 class="ref-traps-empty-title">Sin resultados</h2>' +
      '<p class="ref-traps-empty-text">' + detail + ' Prueba con otra palabra, cambia el área o quita el filtro de fuente.</p>' +
      '<div class="ref-traps-empty-actions">' +
        '<button class="s-btn s-btn--ghost s-btn--sm ref-traps-clear" type="button" data-ref-action="clear">' + icon("rotate", 15) + ' Limpiar búsqueda y filtros</button>' +
      '</div>' +
      '</div>';
  }

  function sourceLabel(source) {
    if (source === "callout") return "Aviso";
    if (source === "bullet") return "Distinción";
    var R = reference();
    if (R && typeof R.sourceLabel === "function") return R.sourceLabel(source);
    return SOURCE_FALLBACK[source] || "Referencia";
  }

  function itemHTML(entry) {
    var title = entry.title || entry.term || "";
    var text = entry.text || entry.definition || entry.detail || "";
    var source = entry.source || "";
    var tone = entry.tone || "";
    var severity = entry.severity || "";
    var severityText = SEVERITY_LABELS[severity] || "";
    var sheetTitle = entry.sheetTitle || entry.sheetId || "";
    var sectionTitle = entry.sectionTitle || "";
    var href = entry.sheetId ? sheetHref(entry.sheetId) : "";
    var where = [];
    if (sheetTitle) {
      where.push('<span class="ref-trap-sheet">' + icon("book", 12) + '<span>Ficha: ' + esc(sheetTitle) + '</span></span>');
    }
    if (sectionTitle) {
      where.push('<span class="ref-trap-section">Sección: ' + esc(sectionTitle) + '</span>');
    }
    var whereHTML = where.length
      ? '<p class="ref-trap-where">' + where.join('<span class="ref-trap-sep" aria-hidden="true">·</span>') + '</p>'
      : "";
    var linkLabel = "Abrir ficha" + (sheetTitle ? ": " + sheetTitle : "");
    var linkHTML = href
      ? '<a class="ref-trap-link" href="' + esc(href) + '" data-nav data-ref-action="goto" aria-label="' + esc(linkLabel) + '">Abrir ficha ' + icon("arrow", 14) + '</a>'
      : "";
    return '<li class="ref-trap-item" data-warning-id="' + esc(entry.id) + '"' +
        ' data-source="' + esc(source) + '" data-tone="' + esc(tone) + '" data-severity="' + esc(severity) + '"' +
        ' data-area-id="' + esc(entry.areaId || "") + '" data-sheet-id="' + esc(entry.sheetId || "") + '">' +
      '<div class="ref-trap-body">' +
        '<div class="ref-trap-badges">' +
          '<span class="ref-trap-source" data-source="' + esc(source) + '">' + esc(sourceLabel(source)) + '</span>' +
          (severityText ? '<span class="ref-trap-severity" data-severity="' + esc(severity) + '">' + esc(severityText) + '</span>' : "") +
          (tone === "info" ? '<span class="ref-trap-tone" data-tone="info">Informativo</span>' : "") +
        '</div>' +
        (title ? '<h3 class="ref-trap-title">' + esc(title) + '</h3>' : "") +
        (text ? '<p class="ref-trap-text">' + esc(text) + '</p>' : "") +
        '<div class="ref-trap-foot">' + whereHTML + linkHTML + '</div>' +
      '</div>' +
      '</li>';
  }

  function moreLabel(count) {
    return count === 1 ? "Mostrar 1 resultado más" : "Mostrar otros " + count;
  }

  function remainingNote(count) {
    return count === 1 ? "Queda 1 resultado" : "Quedan " + count + " resultados";
  }

  function moreHTML(total, shown) {
    var remaining = Math.max(0, total - shown);
    if (remaining <= 0) return "";
    var next = Math.min(PAGE_SIZE, remaining);
    return '<div class="ref-traps-more" data-ref-more-host>' +
      '<button class="s-btn s-btn--ghost ref-traps-more-btn" type="button" data-ref-action="more" aria-controls="ref-traps-list">' +
        icon("chevronDown", 15) + ' ' + moreLabel(next) +
      '</button>' +
      '<span class="ref-traps-more-note">' + remainingNote(remaining) + '</span>' +
      '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* Estado: carga, error, contenido y lista                             */
  /* ------------------------------------------------------------------ */

  function setCount(text, state) {
    if (!page.countEl) return;
    page.countEl.textContent = text;
    page.countEl.setAttribute("data-state", state || "ready");
  }

  function setBusy(value) {
    if (!page.bodyEl) return;
    page.bodyEl.setAttribute("aria-busy", value ? "true" : "false");
  }

  function bindEvents() {
    unbindEvents();
    if (!page.section) return;
    page.offs.push(listen(page.section, "input", onInput));
    page.offs.push(listen(page.section, "change", onChange));
    page.offs.push(listen(page.section, "click", onClick));
  }
  function unbindEvents() {
    (page.offs || []).forEach(function (off) {
      try { off(); } catch (error) { /* listener ya retirado */ }
    });
    page.offs = [];
  }

  function showLoading() {
    setBusy(true);
    if (page.loadingEl) page.loadingEl.hidden = false;
    if (page.errorEl) {
      page.errorEl.hidden = true;
      page.errorEl.innerHTML = "";
    }
    if (page.contentEl) {
      page.contentEl.hidden = true;
      page.contentEl.innerHTML = "";
    }
    page.listHost = null;
    page.searchEl = null;
    page.areaEl = null;
    page.sourceEl = null;
    setCount("Cargando avisos…", "loading");
  }

  function showError(error, opts) {
    setBusy(false);
    if (page.loadingEl) page.loadingEl.hidden = true;
    if (page.contentEl) {
      page.contentEl.hidden = true;
      page.contentEl.innerHTML = "";
    }
    if (page.errorEl) {
      page.errorEl.hidden = false;
      page.errorEl.innerHTML = errorHTML(error);
    }
    page.listHost = null;
    page.searchEl = null;
    page.areaEl = null;
    page.sourceEl = null;
    setCount("No se pudieron cargar los avisos", "error");
    if (opts && opts.focusError && page.errorEl) {
      focusEl(page.errorEl.querySelector('[data-ref-action="retry"]'));
    }
  }

  function syncControls() {
    if (page.searchEl) page.searchEl.value = page.query;
    if (page.areaEl) {
      page.areaEl.value = page.areaId;
      if (page.areaEl.value !== page.areaId) page.areaId = "";
    }
    if (page.sourceEl) page.sourceEl.value = page.source || "todos";
  }

  function renderReady(opts) {
    setBusy(false);
    if (page.loadingEl) page.loadingEl.hidden = true;
    if (page.errorEl) {
      page.errorEl.hidden = true;
      page.errorEl.innerHTML = "";
    }
    if (!page.contentEl) return;
    page.contentEl.hidden = false;
    page.contentEl.innerHTML = contentHTML();
    page.listHost = page.contentEl.querySelector("[data-ref-list-host]");
    page.searchEl = page.contentEl.querySelector("[data-ref-search]");
    page.areaEl = page.contentEl.querySelector("[data-ref-area]");
    page.sourceEl = page.contentEl.querySelector("[data-ref-source]");
    syncControls();
    page.limit = INITIAL_LIMIT;
    renderList();
    if (opts && opts.focusAfter) focusEl(page.searchEl);
  }

  function loadWarnings(opts) {
    opts = opts || {};
    page.token += 1;
    var token = page.token;
    showLoading();
    var R = reference();
    if (!R || typeof R.load !== "function") {
      showError(new Error("El puente StudyReference no está disponible."), opts);
      return;
    }
    var promise;
    try {
      promise = R.load("warnings");
    } catch (error) {
      showError(error, opts);
      return;
    }
    Promise.resolve(promise).then(function (entries) {
      if (token !== page.token || !page.section) return;
      page.entries = prepareEntries(entries, contentOf(page.ctx));
      renderReady(opts);
    }).catch(function (error) {
      if (token !== page.token || !page.section) return;
      showError(error, opts);
    });
  }

  function filteredEntries() {
    var R = reference();
    if (!R || typeof R.filter !== "function") return [];
    return R.filter(page.entries || [], {
      query: page.query,
      areaId: page.areaId,
      source: page.source
    });
  }

  function hasFilters() {
    return !!(page.query.trim() || page.areaId || page.source);
  }

  function updateCount() {
    var total = page.filtered ? page.filtered.length : 0;
    var shown = Math.min(page.limit, total);
    setCount(countLabel(shown, total, hasFilters()), total ? "ready" : "empty");
  }

  function renderList() {
    if (!page.listHost) return;
    page.filtered = filteredEntries();
    var total = page.filtered.length;
    var shown = Math.min(page.limit, total);
    if (!total) {
      page.listHost.innerHTML = emptyHTML();
      updateCount();
      return;
    }
    page.listHost.innerHTML = '<ol class="ref-trap-list" id="ref-traps-list" aria-label="Avisos y distinciones">' +
      page.filtered.slice(0, shown).map(itemHTML).join("") +
      '</ol>' +
      moreHTML(total, shown);
    updateCount();
  }

  function refreshMore(total) {
    if (!page.listHost) return;
    var host = page.listHost.querySelector("[data-ref-more-host]");
    if (!host) return;
    var remaining = Math.max(0, total - page.limit);
    if (remaining <= 0) {
      host.parentNode && host.parentNode.removeChild(host);
      return;
    }
    var button = host.querySelector('[data-ref-action="more"]');
    if (button) {
      button.innerHTML = icon("chevronDown", 15) + ' ' + moreLabel(Math.min(PAGE_SIZE, remaining));
    }
    var note = host.querySelector(".ref-traps-more-note");
    if (note) note.textContent = remainingNote(remaining);
  }

  function extendList() {
    if (!page.filtered || !page.listHost) return;
    var total = page.filtered.length;
    var previous = Math.min(page.limit, total);
    if (previous >= total) return;
    page.limit = Math.min(total, previous + PAGE_SIZE);
    var list = page.listHost.querySelector(".ref-trap-list");
    if (!list) return;
    list.insertAdjacentHTML("beforeend", page.filtered.slice(previous, page.limit).map(itemHTML).join(""));
    refreshMore(total);
    updateCount();
    var nextButton = page.listHost.querySelector('[data-ref-action="more"]');
    if (page.limit >= total) {
      /* El botón desaparece: el foco pasa al primer resultado recién añadido. */
      var nodes = list.querySelectorAll(".ref-trap-item");
      var firstNew = nodes[previous];
      var link = firstNew ? firstNew.querySelector('[data-ref-action="goto"]') : null;
      if (link) focusEl(link);
    } else if (nextButton) {
      /* Algunos navegadores no enfocan el botón al pulsarlo con puntero. */
      focusEl(nextButton);
    }
  }

  function clearFilters() {
    page.query = "";
    page.areaId = "";
    page.source = "";
    page.limit = INITIAL_LIMIT;
    syncControls();
    renderList();
    focusEl(page.searchEl);
  }

  /* ------------------------------------------------------------------ */
  /* Eventos delegados                                                   */
  /* ------------------------------------------------------------------ */

  function onInput(event) {
    var target = event.target;
    if (!target || !target.hasAttribute || !target.hasAttribute("data-ref-search")) return;
    if (!page.contentEl || page.contentEl.hidden) return;
    page.query = target.value || "";
    page.limit = INITIAL_LIMIT;
    renderList();
  }

  function onChange(event) {
    var target = event.target;
    if (!target || !target.hasAttribute) return;
    if (!page.contentEl || page.contentEl.hidden) return;
    if (target.hasAttribute("data-ref-area")) {
      page.areaId = target.value || "";
    } else if (target.hasAttribute("data-ref-source")) {
      page.source = target.value === "todos" ? "" : (target.value || "");
    } else {
      return;
    }
    page.limit = INITIAL_LIMIT;
    renderList();
  }

  function actionTarget(event) {
    var el = event.target;
    while (el && el !== page.section) {
      if (el.getAttribute && el.getAttribute("data-ref-action")) return el;
      el = el.parentNode;
    }
    return null;
  }

  function onClick(event) {
    var actionEl = actionTarget(event);
    if (!actionEl) return;
    var action = actionEl.getAttribute("data-ref-action");
    if (action === "more") {
      event.preventDefault();
      extendList();
    } else if (action === "retry") {
      event.preventDefault();
      loadWarnings({ focusAfter: true, focusError: true });
    } else if (action === "clear") {
      event.preventDefault();
      clearFilters();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Montaje y desmontaje                                                */
  /* ------------------------------------------------------------------ */

  function mount(ctx) {
    page.ctx = ctx || page.ctx;
    var doc = documentRoot();
    if (!doc) return;
    var scope = ctx && ctx.root && ctx.root.querySelector ? ctx.root : doc;
    var section = scope.querySelector('section[data-ref-view="' + VIEW + '"]');
    if (!section) section = doc.querySelector('section[data-ref-view="' + VIEW + '"]');
    if (!section) return;
    page.section = section;
    page.bodyEl = section.querySelector("[data-ref-body]");
    page.countEl = section.querySelector("[data-ref-count]");
    page.loadingEl = section.querySelector("[data-ref-loading]");
    page.errorEl = section.querySelector("[data-ref-error]");
    page.contentEl = section.querySelector("[data-ref-content]");
    bindEvents();
    var R = reference();
    if (R && typeof R.state === "function" && R.state("warnings") === "ready") {
      page.entries = prepareEntries(R.entries("warnings"), contentOf(ctx));
      renderReady(null);
      return;
    }
    loadWarnings({ fromMount: true });
  }

  function unmount() {
    page.token += 1;
    unbindEvents();
    page.ctx = null;
    page.section = null;
    page.bodyEl = null;
    page.countEl = null;
    page.loadingEl = null;
    page.errorEl = null;
    page.contentEl = null;
    page.listHost = null;
    page.searchEl = null;
    page.areaEl = null;
    page.sourceEl = null;
    page.entries = null;
    page.filtered = null;
    page.query = "";
    page.areaId = "";
    page.source = "";
    page.limit = INITIAL_LIMIT;
  }

  /* ------------------------------------------------------------------ */
  /* Registro                                                            */
  /* ------------------------------------------------------------------ */

  var api = {
    version: VERSION,
    moduleId: MODULE_ID,
    view: VIEW,
    routePath: ROUTE_PATH,
    title: TITLE,
    titleId: TITLE_ID,
    initialLimit: INITIAL_LIMIT,
    pageSize: PAGE_SIZE,
    render: render,
    mount: mount,
    unmount: unmount,
    sortEntries: sortEntries,
    prepareEntries: prepareEntries,
    countLabel: countLabel,
    __registered: false,
    __page: page,
    register: function register(scope) {
      if (api.__registered) return false;
      var host = scope || root;
      if (!host || !host.StudyApp || typeof host.StudyApp.registerModule !== "function") return false;
      var module;
      try {
        module = host.StudyApp.registerModule({
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
      } catch (error) {
        if (root && root.console && typeof root.console.error === "function") {
          root.console.error("StudyTraps: no se pudo registrar el módulo.", error);
        }
        return false;
      }
      if (!module) return false;
      api.__registered = true;
      return true;
    }
  };

  root.StudyTraps = api;

  /* En el navegador, StudyApp debería existir cuando este script se carga
     después de app.js. Si aún no está, se reintenta durante ~2 s sin bloquear
     ni descargar datos. */
  if (hasDom()) {
    if (!api.register(root)) {
      var attempts = 0;
      (function waitForApp() {
        if (api.__registered || attempts >= 40) return;
        attempts += 1;
        if (api.register(root)) return;
        root.setTimeout(waitForApp, 50);
      })();
    }
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
