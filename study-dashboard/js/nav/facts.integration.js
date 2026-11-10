/* SERUMS STUDY — Datos para memorizar (#/datos, Fase 3)
   Módulo `facts`: lista consultable de los datos de tabla del temario, con
   búsqueda sin acentos, filtro por área y marca de «conocido» persistente.

   Reglas del módulo:
   · `StudyReference.load("facts")` se llama SOLO en mount; al arrancar no se
     descarga ningún derivado.
   · La única escritura de estado es `StudyStore.factsKnown` a través de
     `StudyReference.setKnown`; no se tocan `cards` ni `flashSession`.
   · El progreso es global (conocidos sobre todos los datos), nunca sobre el
     resultado del filtro.
   · Marcar/desmarcar conserva el foco, anuncia el cambio y no reinicia los
     filtros. Con «Solo pendientes», el dato marcado sale de la lista y el foco
     pasa al siguiente control disponible.
   · Si `StudyStore.factsKnown` no existe, el control se desactiva y se explica.
   · Todo el HTML dinámico se escapa. El CSS vive en css/facts.css bajo `.ref-*`
     de esta página.

   Contrato: study-dashboard/docs/CONTRATOS-FASE3.md §4.2 y CONTRATOS.md §5
   Uso:
     navegador  <script src="js/nav/reference.js"></script>
                <script src="js/nav/facts.integration.js"></script>
                -> window.StudyFacts (se registra solo)
     Node       require("./facts.integration.js")  (HTML y utilidades puras)

   © 2026 ZARCONT */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root);
  } else {
    root.StudyFacts = factory(root);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var MODULE_ID = "facts";
  var ROUTE_PATH = "datos";
  var VIEW = "datos";
  var TITLE = "Datos para memorizar";
  var TITLE_ID = "ref-datos-title";
  var KNOWN_NOTE_ID = "ref-facts-known-note";

  var page = {
    ctx: null,
    section: null,
    nodes: null,
    phase: "idle",
    entries: [],
    filtered: [],
    areas: [],
    query: "",
    areaId: "",
    pendingOnly: false,
    knownMap: {},
    knownAvailable: false,
    retryFocus: false,
    token: 0,
    announceTimer: 0
  };

  /* ------------------------------------------------------------------ */
  /* Host: StudyReference, StudyStore y utilidades                      */
  /* ------------------------------------------------------------------ */

  function doc() {
    return root && root.document ? root.document : null;
  }
  function reference() {
    return root && root.StudyReference ? root.StudyReference : null;
  }
  function store() {
    return root && root.StudyStore ? root.StudyStore : null;
  }
  function hasDom() {
    return !!doc();
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
    if (R && typeof R.icon === "function") return R.icon(name, size || 15);
    if (root && root.StudyUI && typeof root.StudyUI.icon === "function") {
      return root.StudyUI.icon(name, size || 15);
    }
    return "";
  }
  function plural(n, one, many) {
    var R = reference();
    if (R && typeof R.plural === "function") return R.plural(n, one, many);
    return Number(n) === 1 ? one : (many || one + "s");
  }
  function clean(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }
  function clip(value, max) {
    var R = reference();
    if (R && typeof R.clip === "function") return R.clip(value, max);
    var text = clean(value);
    return text.length > max ? text.slice(0, Math.max(0, max - 1)).replace(/[\s,;:.-]+$/, "") + "…" : text;
  }
  function entryId(entry) {
    return entry && entry.id != null ? clean(entry.id) : "";
  }

  /* `factsKnown` es la única fuente de verdad del progreso. Se comprueba la
     pareja set/listKnown para no ofrecer un control que no puede persistir. */
  function knownApi() {
    var s = store();
    if (!s || !s.factsKnown) return null;
    if (typeof s.factsKnown.set !== "function") return null;
    if (typeof s.factsKnown.listKnown !== "function") return null;
    return s.factsKnown;
  }
  function knownAvailable() {
    return !!knownApi();
  }
  function knownMap() {
    var R = reference();
    if (!R || typeof R.knownSet !== "function") return {};
    try { return R.knownSet() || {}; } catch (error) { return {}; }
  }

  function findEntry(factId) {
    for (var i = 0; i < page.entries.length; i += 1) {
      if (entryId(page.entries[i]) === factId) return page.entries[i];
    }
    return null;
  }

  function areaChoices(entries) {
    var byArea = {};
    (Array.isArray(entries) ? entries : []).forEach(function (entry) {
      if (!entry) return;
      var areaId = clean(entry.areaId) || "sin-area";
      if (!byArea[areaId]) {
        byArea[areaId] = {
          id: areaId,
          title: clean(entry.areaTitle) || "Sin área",
          short: clean(entry.areaShort) || clean(entry.areaTitle) || "Sin área",
          count: 0
        };
      }
      byArea[areaId].count += 1;
    });

    var order = [];
    var R = reference();
    if (R && typeof R.areaOptions === "function") {
      try {
        (R.areaOptions() || []).forEach(function (area) {
          if (area && area.id) order.push(String(area.id));
        });
      } catch (error) { /* se ordena por nombre */ }
    }

    return Object.keys(byArea).map(function (id) {
      return byArea[id];
    }).sort(function (a, b) {
      var ai = order.indexOf(a.id);
      var bi = order.indexOf(b.id);
      if (ai === -1) ai = 999;
      if (bi === -1) bi = 999;
      if (ai !== bi) return ai - bi;
      return a.short.localeCompare(b.short, "es");
    });
  }

  /* Un encabezado de tabla aporta cuando hay al menos dos columnas distintas:
     con una sola, el término y el detalle ya se explican solos. */
  function usefulHeaders(entry) {
    var headers = [];
    if (entry && Array.isArray(entry.headers)) {
      entry.headers.forEach(function (header) {
        var text = clean(header);
        if (text && headers.indexOf(text) === -1) headers.push(text);
      });
    }
    return headers.length >= 2 ? headers.slice(0, 4) : [];
  }

  function sheetHref(sheetId) {
    var R = reference();
    if (R && typeof R.sheetHref === "function") return R.sheetHref(sheetId);
    return "#/ficha/" + encodeURIComponent(sheetId || "");
  }

  /* ------------------------------------------------------------------ */
  /* HTML                                                               */
  /* ------------------------------------------------------------------ */

  function progressHTML() {
    return '<div class="ref-facts-progress" aria-live="polite" aria-atomic="true">' +
      '<div class="ref-facts-progress-head">' +
        '<span class="ref-facts-progress-label">Progreso</span>' +
        '<p class="ref-facts-progress-copy">' +
          '<strong data-ref-known-count>0</strong> de <span data-ref-total-count>0</span> datos conocidos ' +
          '<span class="ref-facts-progress-pct" data-ref-progress-pct>0 %</span>' +
        '</p>' +
      '</div>' +
      '<div class="ref-facts-progress-track" data-ref-progress role="progressbar" ' +
        'aria-label="Datos conocidos" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0" ' +
        'aria-valuetext="Cargando datos">' +
        '<span class="ref-facts-progress-fill"></span>' +
      '</div>' +
    '</div>';
  }

  function shellHTML() {
    return '<section class="ref-page ref-page--facts ref-facts" data-ref-view="' + VIEW + '" data-ref-state="loading" ' +
      'aria-labelledby="' + TITLE_ID + '">' +
      '<header class="ref-facts-hero">' +
        '<a class="ref-facts-back" href="#/" data-nav>' + icon("arrowLeft", 14) + '<span>Panel</span></a>' +
        '<span class="ref-facts-kicker"><span class="ref-facts-dot" aria-hidden="true"></span>Herramientas</span>' +
        '<h1 class="ref-facts-title" id="' + TITLE_ID + '">' + esc(TITLE) + '</h1>' +
        '<p class="ref-facts-lede">Cifras, cortes, dosis y referencias que conviene tener a mano. ' +
          'Marca como conocido lo que ya domines; el progreso se guarda en este navegador.</p>' +
        progressHTML() +
      '</header>' +
      '<div class="ref-facts-body" data-ref-body aria-busy="true">' +
        '<div class="ref-facts-toolbar" role="search" aria-label="Buscar y filtrar datos">' +
          '<label class="ref-facts-search" for="ref-facts-search-input">' +
            icon("search", 16) +
            '<span class="s-sr-only">Buscar datos</span>' +
            '<input class="ref-facts-search-input" id="ref-facts-search-input" type="search" ' +
              'data-ref-search placeholder="Buscar por término, detalle o tabla…" ' +
              'autocomplete="off" spellcheck="false" disabled>' +
          '</label>' +
          '<label class="ref-facts-area" for="ref-facts-area-select">' +
            '<span class="ref-facts-area-label">Área</span>' +
            '<select class="ref-facts-area-select" id="ref-facts-area-select" data-ref-area disabled>' +
              '<option value="">Todas las áreas</option>' +
            '</select>' +
          '</label>' +
          '<button class="ref-facts-pending" type="button" data-ref-filter="pending" ' +
            'aria-pressed="false" disabled>' + icon("filter", 15) + '<span>Solo pendientes</span></button>' +
          '<p class="ref-facts-count" data-ref-count>Cargando…</p>' +
        '</div>' +
        '<p class="ref-facts-note" id="' + KNOWN_NOTE_ID + '" data-ref-known-note hidden>' +
          icon("alert", 15) +
          '<span>Este navegador no expone el progreso de datos, así que no se pueden marcar como conocidos. ' +
          'Puedes seguir consultando la lista.</span>' +
        '</p>' +
        '<div class="ref-facts-loading" data-ref-loading role="status">' +
          '<span class="ref-facts-loading-text">Cargando los datos del temario…</span>' +
          '<span class="ref-facts-skeleton" aria-hidden="true"><i></i><i></i><i></i></span>' +
        '</div>' +
        '<div class="ref-facts-error" data-ref-error role="alert" hidden></div>' +
        '<div class="ref-facts-empty" data-ref-empty hidden></div>' +
        '<ul class="ref-fact-list" data-ref-list aria-label="Datos para memorizar" hidden></ul>' +
        '<p class="s-sr-only" data-ref-live role="status" aria-live="polite" aria-atomic="true"></p>' +
      '</div>' +
    '</section>';
  }

  function metaHTML(entry) {
    var parts = [];
    if (entry && entry.sheetId) {
      var title = clean(entry.sheetTitle) || clean(entry.sheetId) || "Ficha";
      parts.push('<a class="ref-fact-sheet" href="' + esc(sheetHref(entry.sheetId)) + '" data-nav ' +
        'aria-label="' + esc("Abrir ficha: " + title) + '">' +
        icon("book", 13) + '<span>' + esc(title) + '</span></a>');
    }
    if (entry && clean(entry.sectionTitle)) {
      parts.push('<span class="ref-fact-section">' + esc(clean(entry.sectionTitle)) + '</span>');
    }
    if (!parts.length) return "";
    return '<p class="ref-fact-meta">' +
      parts.join('<span class="ref-fact-dot" aria-hidden="true"></span>') +
      '</p>';
  }

  function itemHTML(entry) {
    var id = entryId(entry);
    if (!id) return "";
    var known = page.knownMap[id] === true;
    var available = page.knownAvailable === true;
    var term = clean(entry.term) || "Dato sin término";
    var detail = clean(entry.detail);
    var headers = usefulHeaders(entry);
    var pressed = known ? "true" : "false";
    var buttonAttrs = ' type="button" data-ref-action="known" aria-pressed="' + pressed + '" ' +
      'aria-label="' + esc("Conocido: " + term) + '"';
    if (!available) {
      buttonAttrs += ' disabled aria-describedby="' + KNOWN_NOTE_ID + '"';
    }
    var headersHTML = "";
    if (headers.length) {
      headersHTML = '<p class="ref-fact-headers">' +
        '<span class="ref-fact-label">Tabla</span>' +
        '<span class="ref-fact-headers-list">' + headers.map(function (header) {
          return '<span class="ref-fact-header">' + esc(header) + '</span>';
        }).join('<span class="ref-fact-header-sep" aria-hidden="true"> · </span>') + '</span>' +
      '</p>';
    }
    return '<li class="ref-fact-item" data-fact-id="' + esc(id) + '" ' +
      'data-fact-area="' + esc(clean(entry.areaId)) + '" data-ref-known="' + pressed + '">' +
      '<div class="ref-fact-head">' +
        '<h2 class="ref-fact-term">' + esc(term) + '</h2>' +
        '<button class="ref-fact-known"' + buttonAttrs + '>' +
          icon("check", 14) + '<span>Conocido</span>' +
        '</button>' +
      '</div>' +
      (detail ? '<p class="ref-fact-detail">' + esc(detail) + '</p>' : "") +
      headersHTML +
      metaHTML(entry) +
    '</li>';
  }

  function emptyHTML(kind) {
    if (kind === "none") {
      return '<span class="ref-facts-empty-icon" aria-hidden="true">' + icon("list", 20) + '</span>' +
        '<div class="ref-facts-empty-copy">' +
          '<h2 class="ref-facts-empty-title">Todavía no hay datos</h2>' +
          '<p class="ref-facts-empty-text">El temario no incluye filas de datos para memorizar. ' +
          'Cuando las haya, aparecerán aquí.</p>' +
        '</div>';
    }
    return '<span class="ref-facts-empty-icon" aria-hidden="true">' + icon("filter", 20) + '</span>' +
      '<div class="ref-facts-empty-copy">' +
        '<h2 class="ref-facts-empty-title">Ningún dato coincide</h2>' +
        '<p class="ref-facts-empty-text">Prueba con otro término, cambia el área o desactiva ' +
        '«Solo pendientes».</p>' +
        '<div class="ref-facts-empty-actions">' +
          '<button class="s-btn s-btn--ghost s-btn--sm" type="button" data-ref-action="clear">' +
          'Borrar filtros</button>' +
        '</div>' +
      '</div>';
  }

  function errorHTML(error) {
    var detail = error && error.message ? clip(error.message, 180) : "";
    return '<div class="ref-facts-error-inner">' +
      '<span class="ref-facts-error-icon" aria-hidden="true">' + icon("alert", 20) + '</span>' +
      '<div class="ref-facts-error-copy">' +
        '<h2 class="ref-facts-error-title">No pude cargar los datos</h2>' +
        '<p class="ref-facts-error-text">Revisa la conexión y vuelve a intentarlo. ' +
        'No muestro datos inventados.</p>' +
        (detail ? '<p class="ref-facts-error-detail">' + esc(detail) + '</p>' : "") +
        '<div class="ref-facts-error-actions">' +
          '<button class="s-btn s-btn--sm" type="button" data-ref-action="retry">' +
          icon("rotate", 15) + ' Volver a intentar</button>' +
          '<a class="s-btn s-btn--ghost s-btn--sm" href="#/" data-nav>Volver al panel</a>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* Nodos y estado de la página                                        */
  /* ------------------------------------------------------------------ */

  function findSection(ctx) {
    var container = ctx && ctx.root ? ctx.root : doc();
    if (!container || typeof container.querySelector !== "function") return null;
    return container.querySelector('[data-ref-view="' + VIEW + '"]');
  }
  function q(selector) {
    if (!page.section || typeof page.section.querySelector !== "function") return null;
    return page.section.querySelector(selector);
  }
  function qa(selector) {
    if (!page.section || typeof page.section.querySelectorAll !== "function") return [];
    return Array.prototype.slice.call(page.section.querySelectorAll(selector));
  }
  function cacheNodes() {
    page.nodes = {
      body: q("[data-ref-body]"),
      search: q("[data-ref-search]"),
      area: q("[data-ref-area]"),
      pending: q('[data-ref-filter="pending"]'),
      count: q("[data-ref-count]"),
      note: q("[data-ref-known-note]"),
      loading: q("[data-ref-loading]"),
      error: q("[data-ref-error]"),
      empty: q("[data-ref-empty]"),
      list: q("[data-ref-list]"),
      live: q("[data-ref-live]"),
      progress: q("[data-ref-progress]"),
      knownCount: q("[data-ref-known-count]"),
      totalCount: q("[data-ref-total-count]"),
      pct: q("[data-ref-progress-pct]"),
      fill: q(".ref-facts-progress-fill")
    };
  }
  function setState(state) {
    if (!page.section) return;
    page.section.setAttribute("data-ref-state", state);
  }
  function setBusy(busy) {
    if (page.nodes && page.nodes.body) {
      page.nodes.body.setAttribute("aria-busy", busy ? "true" : "false");
    }
  }
  function focusElement(element) {
    if (!element || typeof element.focus !== "function") return;
    try { element.focus({ preventScroll: true }); }
    catch (error) {
      try { element.focus(); } catch (error2) { /* sin foco */ }
    }
  }
  function announce(message) {
    /* Se usa la región global de la app (igual que el resto de la Fase 3);
       la región local queda como respaldo si el módulo se carga suelto. */
    if (root && root.StudyApp && typeof root.StudyApp.announce === "function") {
      try {
        root.StudyApp.announce(message);
        return;
      } catch (error) { /* se intenta la región local */ }
    }
    if (!page.nodes && page.ctx && typeof page.ctx.announce === "function") {
      try {
        page.ctx.announce(message);
        return;
      } catch (error) { /* se intenta la región local */ }
    }
    var live = page.nodes ? page.nodes.live : null;
    if (!live) return;
    if (page.announceTimer) root.clearTimeout(page.announceTimer);
    live.textContent = "";
    page.announceTimer = root.setTimeout(function () {
      page.announceTimer = 0;
      if (live.isConnected !== false) live.textContent = String(message || "");
    }, 30);
  }

  function setControlsEnabled(enabled) {
    var nodes = page.nodes;
    if (!nodes) return;
    if (nodes.search) nodes.search.disabled = !enabled;
    if (nodes.area) nodes.area.disabled = !enabled || !page.areas.length;
    if (nodes.pending) nodes.pending.disabled = !enabled || !page.knownAvailable;
  }

  function populateAreas() {
    var select = page.nodes ? page.nodes.area : null;
    if (!select) return;
    page.areas = areaChoices(page.entries);
    var html = '<option value="">Todas las áreas</option>';
    page.areas.forEach(function (area) {
      html += '<option value="' + esc(area.id) + '">' +
        esc(area.short) + ' · ' + area.count +
        '</option>';
    });
    select.innerHTML = html;
    var valid = page.areas.some(function (area) { return area.id === page.areaId; });
    if (!valid) page.areaId = "";
    try { select.value = page.areaId; } catch (error) { /* sin selección */ }
    select.disabled = !page.areas.length;
  }

  function updateKnownSupport() {
    var available = knownAvailable();
    var wasAvailable = page.knownAvailable;
    page.knownAvailable = available;
    if (!page.section) return;
    page.section.setAttribute("data-ref-known-support", available ? "available" : "unavailable");
    var nodes = page.nodes || {};
    if (nodes.note) nodes.note.hidden = available;
    if (nodes.pending) {
      if (!available) {
        page.pendingOnly = false;
        nodes.pending.setAttribute("aria-pressed", "false");
        nodes.pending.setAttribute("aria-describedby", KNOWN_NOTE_ID);
      } else if (nodes.pending.getAttribute("aria-describedby") === KNOWN_NOTE_ID) {
        nodes.pending.removeAttribute("aria-describedby");
      }
      nodes.pending.disabled = page.phase !== "ready" || !available;
    }
    if (wasAvailable !== available && page.phase === "ready") syncButtons();
  }

  function syncButtons() {
    page.knownMap = knownMap();
    qa(".ref-fact-item").forEach(function (item) {
      var id = item.getAttribute("data-fact-id") || "";
      var known = page.knownMap[id] === true;
      item.setAttribute("data-ref-known", known ? "true" : "false");
      var button = item.querySelector('[data-ref-action="known"]');
      if (!button) return;
      button.setAttribute("aria-pressed", known ? "true" : "false");
      button.disabled = !page.knownAvailable;
      if (!page.knownAvailable) button.setAttribute("aria-describedby", KNOWN_NOTE_ID);
      else if (button.getAttribute("aria-describedby") === KNOWN_NOTE_ID) {
        button.removeAttribute("aria-describedby");
      }
    });
  }

  function updateItem(item, known) {
    if (!item) return;
    item.setAttribute("data-ref-known", known ? "true" : "false");
    var button = item.querySelector('[data-ref-action="known"]');
    if (!button) return;
    button.setAttribute("aria-pressed", known ? "true" : "false");
    button.disabled = !page.knownAvailable;
    if (!page.knownAvailable) button.setAttribute("aria-describedby", KNOWN_NOTE_ID);
    else if (button.getAttribute("aria-describedby") === KNOWN_NOTE_ID) {
      button.removeAttribute("aria-describedby");
    }
  }

  function countKnown() {
    return page.entries.reduce(function (total, entry) {
      return total + (page.knownMap[entryId(entry)] === true ? 1 : 0);
    }, 0);
  }

  function updateProgress() {
    var nodes = page.nodes;
    if (!nodes || !nodes.progress) return;
    var total = page.entries.length;
    var ready = page.phase === "ready";
    if (!ready) {
      if (nodes.knownCount) nodes.knownCount.textContent = "—";
      if (nodes.totalCount) nodes.totalCount.textContent = page.phase === "error" ? "—" : "0";
      if (nodes.pct) nodes.pct.textContent = page.phase === "error" ? "sin datos" : "cargando";
      nodes.progress.setAttribute("aria-valuemax", "0");
      nodes.progress.setAttribute("aria-valuenow", "0");
      nodes.progress.setAttribute("aria-valuetext", page.phase === "error" ? "Progreso no disponible" : "Cargando datos");
      if (nodes.fill) {
        nodes.fill.style.setProperty("--ref-facts-progress", "0");
        nodes.fill.style.opacity = "0";
      }
      if (page.section) page.section.removeAttribute("data-ref-complete");
      return;
    }
    if (!page.knownAvailable) {
      if (nodes.knownCount) nodes.knownCount.textContent = "—";
      if (nodes.totalCount) nodes.totalCount.textContent = String(total);
      if (nodes.pct) nodes.pct.textContent = "sin progreso";
      nodes.progress.setAttribute("aria-valuemax", String(total));
      nodes.progress.setAttribute("aria-valuenow", "0");
      nodes.progress.setAttribute("aria-valuetext", "Progreso de datos no disponible");
      if (nodes.fill) {
        nodes.fill.style.setProperty("--ref-facts-progress", "0");
        nodes.fill.style.opacity = "0";
      }
      if (page.section) page.section.removeAttribute("data-ref-complete");
      return;
    }
    page.knownMap = knownMap();
    var known = countKnown();
    var pct = total ? Math.round((known / total) * 100) : 0;
    if (nodes.knownCount) nodes.knownCount.textContent = String(known);
    if (nodes.totalCount) nodes.totalCount.textContent = String(total);
    if (nodes.pct) nodes.pct.textContent = total ? pct + " %" : "0 %";
    nodes.progress.setAttribute("aria-valuemax", String(total));
    nodes.progress.setAttribute("aria-valuenow", String(known));
    nodes.progress.setAttribute("aria-valuetext", total
      ? known + " de " + total + " datos conocidos (" + pct + " %)"
      : "Sin datos");
    if (nodes.fill) {
      nodes.fill.style.setProperty("--ref-facts-progress", total ? (known / total).toFixed(4) : "0");
      nodes.fill.style.opacity = known > 0 ? "1" : "0";
    }
    if (page.section) {
      if (total > 0 && known === total) page.section.setAttribute("data-ref-complete", "true");
      else page.section.removeAttribute("data-ref-complete");
    }
  }

  function updateCount(filteredCount) {
    var count = page.nodes ? page.nodes.count : null;
    if (!count) return;
    if (page.phase === "loading") {
      count.textContent = "Cargando…";
      return;
    }
    if (page.phase === "error") {
      count.textContent = "Sin datos";
      return;
    }
    var total = page.entries.length;
    if (!total) {
      count.textContent = "Sin datos";
      return;
    }
    var shown = typeof filteredCount === "number" ? filteredCount : total;
    if (shown === total) count.textContent = total + " " + plural(total, "dato", "datos");
    else count.textContent = shown + " de " + total + " " + plural(total, "dato", "datos");
  }

  function renderResults() {
    if (page.phase !== "ready") return;
    var nodes = page.nodes;
    var R = reference();
    if (!nodes || !nodes.list) return;
    if (!R || typeof R.filter !== "function") {
      showError(new Error("El puente de consulta no expone el filtro de datos."));
      return;
    }
    var filtered;
    try {
      filtered = R.filter(page.entries, {
        query: page.query,
        areaId: page.areaId,
        pendingOnly: page.pendingOnly
      });
      /* Compatibilidad: si una versión anterior del puente ignora
         `pendingOnly`, se aplica aquí el complemento con `knownSet()`. Con la
         versión actual no cambia nada porque ya vienen excluidos. */
      if (page.pendingOnly) {
        var knownIds = knownMap();
        filtered = (Array.isArray(filtered) ? filtered : []).filter(function (entry) {
          return knownIds[entryId(entry)] !== true;
        });
      }
    } catch (error) {
      showError(error);
      return;
    }
    if (!Array.isArray(filtered)) filtered = [];
    page.filtered = filtered;
    page.knownMap = knownMap();
    nodes.list.innerHTML = filtered.map(itemHTML).join("");

    var total = page.entries.length;
    if (!total) {
      nodes.list.hidden = true;
      if (nodes.empty) {
        nodes.empty.innerHTML = emptyHTML("none");
        nodes.empty.hidden = false;
      }
      setState("empty");
    } else if (!filtered.length) {
      nodes.list.hidden = true;
      if (nodes.empty) {
        nodes.empty.innerHTML = emptyHTML("filtered");
        nodes.empty.hidden = false;
      }
      setState("empty");
    } else {
      if (nodes.empty) {
        nodes.empty.hidden = true;
        nodes.empty.innerHTML = "";
      }
      nodes.list.hidden = false;
      setState("ready");
    }
    updateCount(filtered.length);
  }

  /* ------------------------------------------------------------------ */
  /* Carga perezosa y estados                                           */
  /* ------------------------------------------------------------------ */

  function showLoading() {
    page.phase = "loading";
    page.entries = [];
    page.filtered = [];
    page.knownMap = {};
    var nodes = page.nodes || {};
    setState("loading");
    setBusy(true);
    setControlsEnabled(false);
    if (nodes.loading) nodes.loading.hidden = false;
    if (nodes.error) {
      nodes.error.hidden = true;
      nodes.error.innerHTML = "";
    }
    if (nodes.empty) {
      nodes.empty.hidden = true;
      nodes.empty.innerHTML = "";
    }
    if (nodes.list) {
      nodes.list.hidden = true;
      nodes.list.innerHTML = "";
    }
    if (nodes.note) nodes.note.hidden = true;
    updateCount(0);
    updateProgress();
  }

  function showError(error) {
    page.phase = "error";
    var nodes = page.nodes || {};
    setState("error");
    setBusy(false);
    setControlsEnabled(false);
    page.entries = [];
    page.filtered = [];
    if (nodes.loading) nodes.loading.hidden = true;
    if (nodes.list) {
      nodes.list.hidden = true;
      nodes.list.innerHTML = "";
    }
    if (nodes.empty) {
      nodes.empty.hidden = true;
      nodes.empty.innerHTML = "";
    }
    if (nodes.note) nodes.note.hidden = true;
    if (nodes.error) {
      nodes.error.innerHTML = errorHTML(error);
      nodes.error.hidden = false;
      var retry = nodes.error.querySelector('[data-ref-action="retry"]');
      if (retry) focusElement(retry);
    }
    updateCount(0);
    updateProgress();
  }

  function loadFacts() {
    page.token += 1;
    var token = page.token;
    showLoading();
    var R = reference();
    if (!R || typeof R.load !== "function") {
      showError(new Error("El puente de consulta (StudyReference) no está cargado."));
      return;
    }
    var promise;
    try {
      promise = R.load("facts");
    } catch (error) {
      promise = Promise.reject(error);
    }
    Promise.resolve(promise).then(function (list) {
      if (token !== page.token || !page.section) return;
      var entries = Array.isArray(list) ? list.filter(function (entry) {
        return !!entry && !!entryId(entry);
      }) : [];
      page.entries = entries;
      page.phase = "ready";
      populateAreas();
      updateKnownSupport();
      setBusy(false);
      setControlsEnabled(true);
      if (page.nodes && page.nodes.loading) page.nodes.loading.hidden = true;
      if (page.nodes && page.nodes.error) {
        page.nodes.error.hidden = true;
        page.nodes.error.innerHTML = "";
      }
      renderResults();
      updateProgress();
      if (page.retryFocus) {
        page.retryFocus = false;
        focusElement(page.nodes ? page.nodes.search : null);
        announce("Datos cargados.");
      }
    }).catch(function (error) {
      if (token !== page.token || !page.section) return;
      page.retryFocus = false;
      showError(error);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Eventos                                                            */
  /* ------------------------------------------------------------------ */

  function onInput(event) {
    var target = event && event.target;
    if (!target || !target.matches || !target.matches("[data-ref-search]")) return;
    page.query = target.value || "";
    renderResults();
  }

  function onChange(event) {
    var target = event && event.target;
    if (!target || !target.matches || !target.matches("[data-ref-area]")) return;
    page.areaId = target.value || "";
    renderResults();
  }

  function togglePending() {
    if (page.phase !== "ready" || !page.knownAvailable) return;
    page.pendingOnly = !page.pendingOnly;
    if (page.nodes && page.nodes.pending) {
      page.nodes.pending.setAttribute("aria-pressed", page.pendingOnly ? "true" : "false");
    }
    renderResults();
  }

  function clearFilters() {
    page.query = "";
    page.areaId = "";
    page.pendingOnly = false;
    if (page.nodes) {
      if (page.nodes.search) page.nodes.search.value = "";
      if (page.nodes.area) page.nodes.area.value = "";
      if (page.nodes.pending) page.nodes.pending.setAttribute("aria-pressed", "false");
    }
    renderResults();
    if (page.nodes) focusElement(page.nodes.search);
    announce("Filtros borrados.");
  }

  function handleKnown(button) {
    if (!page.section || !button) return;
    if (!knownAvailable()) {
      updateKnownSupport();
      announce("El progreso de datos no está disponible en este navegador.");
      return;
    }
    var item = button.closest ? button.closest(".ref-fact-item") : null;
    if (!item) return;
    var factId = item.getAttribute("data-fact-id") || "";
    var entry = findEntry(factId);
    if (!entry) return;
    var wasKnown = button.getAttribute("aria-pressed") === "true";
    var nextKnown = !wasKnown;
    var R = reference();
    var record = null;
    try {
      record = R && typeof R.setKnown === "function" ? R.setKnown(factId, nextKnown) : null;
    } catch (error) {
      record = null;
    }
    if (!record) {
      page.knownAvailable = knownAvailable();
      updateKnownSupport();
      if (page.phase === "ready") syncButtons();
      announce(page.knownAvailable
        ? "No se pudo guardar el cambio de ese dato."
        : "No se pudo guardar el cambio: el progreso de datos no está disponible.");
      return;
    }
    var known = record && record.known !== undefined ? record.known === true : nextKnown;
    page.knownMap = knownMap();
    var term = clean(entry.term) || "Dato";
    if (page.pendingOnly && known) {
      var buttons = qa('[data-ref-action="known"]');
      var index = buttons.indexOf(button);
      renderResults();
      var after = qa('[data-ref-action="known"]');
      var target = after.length ? after[Math.min(Math.max(index, 0), after.length - 1)] : null;
      focusElement(target || (page.nodes ? page.nodes.search : null));
    } else {
      updateItem(item, known);
    }
    updateProgress();
    var knownCount = countKnown();
    var total = page.entries.length;
    var message = (known ? "Marcado como conocido: " : "Marcado como pendiente: ") + term + ".";
    if (total) {
      message += " " + knownCount + " de " + total + " conocidos; quedan " +
        Math.max(0, total - knownCount) + ".";
    }
    announce(message);
  }

  function onClick(event) {
    var target = event && event.target;
    if (!target || !page.section || !page.section.contains(target)) return;
    var action = target.closest ? target.closest("[data-ref-action]") : null;
    if (action) {
      var name = action.getAttribute("data-ref-action");
      if (name === "retry") {
        event.preventDefault();
        page.retryFocus = true;
        loadFacts();
        return;
      }
      if (name === "known") {
        event.preventDefault();
        handleKnown(action);
        return;
      }
      if (name === "clear") {
        event.preventDefault();
        clearFilters();
        return;
      }
    }
    var pending = target.closest ? target.closest('[data-ref-filter="pending"]') : null;
    if (pending && page.section.contains(pending)) {
      event.preventDefault();
      togglePending();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Ciclo de vida                                                      */
  /* ------------------------------------------------------------------ */

  function bindListeners() {
    if (!page.section) return;
    page.section.addEventListener("input", onInput);
    page.section.addEventListener("change", onChange);
    page.section.addEventListener("click", onClick);
  }
  function unbindListeners() {
    if (!page.section) return;
    page.section.removeEventListener("input", onInput);
    page.section.removeEventListener("change", onChange);
    page.section.removeEventListener("click", onClick);
  }

  function render(ctx) {
    page.token += 1;
    page.ctx = ctx || null;
    page.section = null;
    page.nodes = null;
    page.phase = "idle";
    page.entries = [];
    page.filtered = [];
    page.areas = [];
    page.query = "";
    page.areaId = "";
    page.pendingOnly = false;
    page.knownMap = {};
    page.knownAvailable = knownAvailable();
    page.retryFocus = false;
    return shellHTML();
  }

  function mount(ctx) {
    page.ctx = ctx || page.ctx;
    var section = findSection(ctx);
    if (!section) return;
    unbindListeners();
    page.section = section;
    cacheNodes();
    bindListeners();
    page.knownAvailable = knownAvailable();
    updateKnownSupport();
    loadFacts();
  }

  function unmount() {
    page.token += 1;
    if (page.announceTimer) {
      root.clearTimeout(page.announceTimer);
      page.announceTimer = 0;
    }
    unbindListeners();
    page.ctx = null;
    page.section = null;
    page.nodes = null;
    page.phase = "idle";
    page.entries = [];
    page.filtered = [];
    page.areas = [];
    page.query = "";
    page.areaId = "";
    page.pendingOnly = false;
    page.knownMap = {};
    page.knownAvailable = knownAvailable();
    page.retryFocus = false;
  }

  /* ------------------------------------------------------------------ */
  /* Registro                                                           */
  /* ------------------------------------------------------------------ */

  /* Si el módulo se registra con la app ya arrancada y #/datos se pintó como
     404, se fuerza un único refresh para que el router use esta ruta. */
  function syncRegisteredRoute() {
    if (!hasDom() || !root.setTimeout) return;
    root.setTimeout(function () {
      var app = root.StudyApp;
      if (!app || typeof app.getRoute !== "function") return;
      var container = doc().getElementById("view-root");
      /* Si la app aún no ha pintado nada, el boot usará el módulo recién
         registrado y no hay nada que corregir. */
      if (!container || container.hidden) return;
      if (container.querySelector('[data-ref-view="' + VIEW + '"]')) return;
      var route;
      try { route = app.getRoute(); } catch (error) { return; }
      var hashPath = "";
      try {
        hashPath = String(root.location.hash || "").replace(/^#\/?/, "").split("/")[0] || "";
      } catch (error) { hashPath = ""; }
      if ((!route || route.name !== ROUTE_PATH) && hashPath !== ROUTE_PATH) return;
      try {
        if (route && route.name === ROUTE_PATH && typeof app.refresh === "function") {
          app.refresh({ scrollY: root.scrollY || 0, focus: false });
        } else if (typeof app.navigate === "function") {
          app.navigate("#/" + ROUTE_PATH);
        }
      } catch (error) { /* sin recuperación */ }
    }, 80);
  }

  var api = {
    version: VERSION,
    moduleId: MODULE_ID,
    view: VIEW,
    routePath: ROUTE_PATH,
    title: TITLE,
    titleId: TITLE_ID,
    render: render,
    mount: mount,
    unmount: unmount,
    shellHTML: shellHTML,
    itemHTML: itemHTML,
    areaChoices: areaChoices,
    usefulHeaders: usefulHeaders,
    __registered: false,
    __page: page,
    register: function register(scope) {
      if (api.__registered) return false;
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

  if (hasDom()) {
    if (!api.register(root)) {
      var attempts = 0;
      (function waitForApp() {
        if (api.__registered || attempts > 60) return;
        attempts += 1;
        if (api.register(root)) {
          syncRegisteredRoute();
          return;
        }
        root.setTimeout(waitForApp, 100);
      })();
    } else {
      syncRegisteredRoute();
    }
  }

  return api;
});
