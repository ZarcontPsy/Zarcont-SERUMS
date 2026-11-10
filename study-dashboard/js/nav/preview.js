/* © 2026 ZARCONT — Estudio interno del previsualizador de navegación.
   Solo se carga desde docs/preview-nav.html. No forma parte del producto. */
(function () {
  "use strict";

  var C = window.STUDY_CONTENT;
  var UI = window.StudyUI;
  var Store = window.StudyStore;
  var T = window.StudyTaxonomy;
  var SN = window.StudyNav;
  var esc = UI.escapeHTML;

  var state = {
    sheetId: "",
    sections: null,
    sources: null,
    glossaryView: null,
    panel: null,
    palette: null,
    provider: null,
    glossary: null
  };
  var TERMS = [
    { term: "atención primaria de salud", display: "Atención primaria de salud" },
    { term: "longitudinalidad", display: "Longitudinalidad" },
    { term: "integralidad", display: "Integralidad" },
    { term: "coordinación", display: "Coordinación" }
  ];

  function $(selector) { return document.querySelector(selector); }

  function announce(text) {
    var live = $("#navp-live");
    if (!live) return;
    live.textContent = "";
    window.setTimeout(function () { live.textContent = text; }, 30);
  }

  function appHref(hash) {
    return "../index.html" + (hash || "");
  }

  function sheetById(id) {
    if (Store && typeof Store.getSheet === "function") {
      var fromStore = Store.getSheet(id);
      if (fromStore) return fromStore;
    }
    return (C.sheets || []).filter(function (sheet) { return sheet.id === id; })[0] || null;
  }

  function areaOf(sheet) {
    return T && sheet ? T.areaForSheet(sheet) : null;
  }

  function categoryOf(sheet) {
    return T && sheet ? T.categoryForSheet(sheet) : null;
  }

  function sourceResolver(id) {
    return (C.sources || []).filter(function (source) { return source.id === id; })[0] || null;
  }

  function tableHTML(table, sectionTitle) {
    if (!table || !Array.isArray(table.headers)) return "";
    var headers = table.headers.map(function (header) { return "<th>" + esc(header) + "</th>"; }).join("");
    var rows = (table.rows || []).map(function (row) {
      return "<tr>" + (row || []).map(function (cell, index) {
        return index === 0 ? "<th scope=\"row\">" + esc(cell) + "</th>" : "<td>" + esc(cell) + "</td>";
      }).join("") + "</tr>";
    }).join("");
    return '<div class="navp-table-wrap" tabindex="0" role="region" aria-label="Tabla de ' + esc(sectionTitle || "la sección") + '"><table class="navp-table"><thead><tr>' + headers + "</tr></thead><tbody>" + rows + "</tbody></table></div>";
  }

  function sectionHTML(section, index) {
    var id = "section-" + index;
    var depth = section.depth === "full" ? "full" : "core";
    var body = (section.body || []).map(function (paragraph) { return "<p>" + esc(paragraph) + "</p>"; }).join("");
    var bullets = (section.bullets && section.bullets.length)
      ? "<ul>" + section.bullets.map(function (bullet) { return "<li>" + esc(bullet) + "</li>"; }).join("") + "</ul>"
      : "";
    var callout = section.callout
      ? '<aside class="navp-callout' + (section.callout.tone === "warn" ? " is-warn" : "") + '"><b>' + esc(section.callout.title || "Aviso") + "</b><p>" + esc(section.callout.text || "") + "</p></aside>"
      : "";
    return '<section class="navp-reader-section" id="' + esc(id) + '" data-navx-section>' +
      '<div class="navp-reader-section-head"><span class="navp-section-index" aria-hidden="true">' + String(index + 1).padStart(2, "0") + '</span><div><h2>' + esc(section.title || "Sección " + (index + 1)) + '</h2>' +
        '<span class="section-depth' + (depth === "full" ? " is-full" : "") + '">' + (depth === "full" ? "Ampliación" : "Esencial") + "</span>" +
      "</div></div>" + body + bullets + tableHTML(section.table, section.title) + callout + "</section>";
  }

  function renderArticle(sheet) {
    var area = areaOf(sheet);
    var category = categoryOf(sheet);
    var topic = Store && sheet.topicId ? Store.getTopic(sheet.topicId) : null;
    var concepts = (sheet.keyConcepts || []).map(function (concept, index) {
      return '<div class="navp-concept"><span aria-hidden="true">' + String(index + 1).padStart(2, "0") + "</span><p>" + esc(concept) + "</p></div>";
    }).join("");
    var sections = (sheet.sections || []).map(sectionHTML).join("");
    $("#navp-article").innerHTML =
      '<div class="navp-reader-head">' +
        '<div class="navp-breadcrumb">' + [area && area.title, category && category.title, topic && topic.title].filter(Boolean).map(function (item, index) {
          return (index ? '<span aria-hidden="true">/</span>' : "") + "<span>" + esc(item) + "</span>";
        }).join("") + "</div>" +
        '<h1 id="navp-reader-title">' + esc(sheet.title) + "</h1>" +
        '<p class="navp-reader-summary">' + esc(sheet.summary) + "</p>" +
        '<div class="navp-reader-meta">' +
          '<span class="s-chip">' + SN.icon("clock", 13) + (sheet.minutes || 6) + " min</span>" +
          '<span class="s-chip">' + SN.icon("layers", 13) + esc(sheet.level || "Base") + "</span>" +
          '<span class="s-chip">' + SN.icon("book", 13) + (sheet.sections || []).length + " secciones</span>" +
          '<span class="s-chip s-chip--accent">Ficha real del temario</span>' +
        "</div>" +
      "</div>" +
      '<section class="navp-concepts" aria-labelledby="navp-concepts-title"><span class="s-kicker"><span class="dot"></span><span id="navp-concepts-title">Conceptos clave</span></span><div class="navp-concept-grid">' + concepts + "</div></section>" +
      '<div class="navp-sections" data-navp-reader-sections>' + sections + "</div>";

    $("#navp-open-app").href = appHref("#/ficha/" + encodeURIComponent(sheet.id));
    $("#navp-open-app").setAttribute("aria-label", "Abrir " + sheet.title + " en la app real");
    $("#navp-sheet-select").value = sheet.id;
    $("#navp-sheet-meta").textContent = (area ? area.title : "Área") + " · " + (category ? category.title : "Categoría") + " · " + (sheet.sections || []).length + " secciones reales";
  }

  function mountReader(sheet) {
    if (state.sections) state.sections.destroy();
    if (state.sources) state.sources.destroy();
    if (state.glossaryView) state.glossaryView.destroy();

    renderArticle(sheet);
    var article = $("#navp-article");
    state.sections = SN.sections.create({
      mount: "#navp-sections",
      root: article,
      selector: ".navp-reader-section",
      headingSelector: "h2",
      offset: 24,
      mobileBreakpoint: 900
    });
    state.sources = SN.sources.create({
      mount: "#navp-sources",
      sheet: sheet,
      resolveSource: sourceResolver,
      baseHref: new URL("../index.html", window.location.href).href,
      wideMin: 1180
    });
    state.glossaryView = SN.glossary.enhance({
      root: article,
      glossary: state.glossary,
      scopeSelector: ".navp-reader-section",
      oncePerSection: true,
      onOpenSheet: function (sheetId) { openSheet(sheetId, { source: "glosario", focus: true }); }
    });
  }

  function openSheet(id, options) {
    var opts = options || {};
    var sheet = sheetById(id);
    if (!sheet) {
      UI.toast("La ficha de muestra no está disponible", "warn");
      return false;
    }
    state.sheetId = sheet.id;
    try {
      var url = new URL(window.location.href);
      url.searchParams.set("sheet", sheet.id);
      history.replaceState(null, "", url.pathname + url.search);
    } catch (e) {}
    mountReader(sheet);
    if (opts.focus) {
      var reader = $("#lector");
      if (reader) reader.scrollIntoView({ behavior: UI.reducedMotion() ? "auto" : "smooth", block: "start" });
      window.setTimeout(function () {
        var title = $("#navp-reader-title");
        if (title) {
          title.setAttribute("tabindex", "-1");
          title.focus({ preventScroll: true });
        }
      }, 60);
    }
    announce("Ficha de muestra: " + sheet.title);
    return true;
  }

  function populateSheetSelect() {
    var select = $("#navp-sheet-select");
    if (!select) return;
    var areas = T && T.primaryAreas ? T.primaryAreas() : [];
    var byArea = {};
    C.sheets.forEach(function (sheet) {
      var areaId = sheet.primaryAreaId || sheet.areaId;
      (byArea[areaId] = byArea[areaId] || []).push(sheet);
    });
    var html = "";
    areas.forEach(function (area) {
      var list = (byArea[area.id] || []).slice().sort(function (a, b) { return a.title.localeCompare(b.title, "es"); });
      if (!list.length) return;
      html += '<optgroup label="' + esc(area.title) + '">';
      list.forEach(function (sheet) {
        html += '<option value="' + esc(sheet.id) + '">' + esc(sheet.title) + "</option>";
      });
      html += "</optgroup>";
    });
    select.innerHTML = html;
  }

  function renderGlossaryList() {
    var mount = $("#navp-glossary-list");
    if (!mount) return;
    if (!state.glossary || !state.glossary.terms.length) {
      mount.innerHTML = '<p class="navp-note">No se encontraron definiciones literales para los términos de muestra.</p>';
      return;
    }
    mount.innerHTML = state.glossary.terms.map(function (entry) {
      return '<article class="navp-gloss-item">' +
        '<span class="s-kicker"><span class="dot"></span>Definición literal del temario</span>' +
        "<h3>" + esc(entry.display) + "</h3>" +
        "<blockquote>" + esc(entry.definition) + "</blockquote>" +
        '<p class="navp-source-line">Fuente: <a href="' + esc(appHref("#/ficha/" + encodeURIComponent(entry.sheetId))) + '" target="_blank" rel="noopener">' + esc(entry.sheetTitle) + "</a>" +
        (entry.sectionTitle ? " · " + esc(entry.sectionTitle) : "") + "</p>" +
        "</article>";
    }).join("");
  }

  function previewNavigate(href, meta) {
    if (!href) return;
    if (href.indexOf("#/ficha/") === 0) {
      openSheet(decodeURIComponent(href.slice("#/ficha/".length)), { focus: true });
      return;
    }
    if (window.StudyApp && typeof window.StudyApp.navigate === "function") {
      window.StudyApp.navigate(href);
      return;
    }
    var link = document.createElement("a");
    link.href = appHref(href);
    link.target = "_blank";
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    UI.toast("Vista abierta en la app real");
    if (meta && meta.source === "palette") announce("Vista abierta en la app real.");
  }

  function setupSearch() {
    var mount = $("#navp-search");
    if (!mount) return;
    state.provider = SN.search.createIndexProvider({
      content: C,
      taxonomy: T,
      chunkSize: 18
    });
    state.panel = SN.search.createPanel({
      mount: mount,
      content: C,
      taxonomy: T,
      provider: state.provider,
      hrefFor: function (id) { return "#/ficha/" + encodeURIComponent(id); },
      onOpenSheet: function (id) { openSheet(id, { source: "busqueda", focus: true }); }
    });

    Array.prototype.slice.call(document.querySelectorAll("[data-navp-query]")).forEach(function (button) {
      button.addEventListener("click", function () {
        var query = button.getAttribute("data-navp-query") || "";
        state.panel.setQuery(query, { focus: true });
        $("#busqueda").scrollIntoView({ behavior: UI.reducedMotion() ? "auto" : "smooth", block: "start" });
      });
    });
    Array.prototype.slice.call(document.querySelectorAll("[data-navp-state]")).forEach(function (button) {
      button.addEventListener("click", function () {
        var value = button.getAttribute("data-navp-state") || "";
        if (value === "normal") {
          state.panel.setDebugState(null);
          state.panel.setQuery("", { focus: true });
          return;
        }
        state.panel.setDebugState(value);
      });
    });
  }

  function setupPalette() {
    var button = $("#navp-palette-open");
    state.palette = SN.palette.create({
      provider: state.provider,
      content: C,
      taxonomy: T,
      bindShortcut: true,
      onOpenSheet: function (id) { openSheet(id, { source: "paleta", focus: true }); },
      onNavigate: previewNavigate
    });
    if (button) button.addEventListener("click", function () { state.palette.open(button); });
  }

  function boot() {
    UI.initTheme();
    /* Material interno: el scroll suave global de base.css haría que las
       comprobaciones automáticas reinicien el desplazamiento en cada intento.
       Los componentes conservan su propio desplazamiento suave al navegar. */
    document.documentElement.style.scrollBehavior = "auto";
    populateSheetSelect();
    state.glossary = SN.glossary.fromContent(C, { terms: TERMS });
    renderGlossaryList();
    setupSearch();
    setupPalette();

    var params = new URLSearchParams(window.location.search);
    var requested = params.get("sheet");
    var initial = sheetById(requested) ? requested : "sheet-aps-01";
    if (!sheetById(initial)) initial = C.sheets[0] && C.sheets[0].id;
    openSheet(initial, { focus: false });

    var select = $("#navp-sheet-select");
    if (select) select.addEventListener("change", function () { openSheet(select.value, { focus: false }); });

    var versionText = C.version + " · " + C.sheets.length + " fichas · " + C.sources.length + " fuentes";
    var version = $("#navp-content-version");
    if (version) version.textContent = versionText;
    var footerVersion = $("#navp-content-version-footer");
    if (footerVersion) footerVersion.textContent = "temario " + versionText;

    if (Store) {
      Store.init().catch(function () { /* el preview sigue sin progreso */ });
    }

    window.__navPreview = {
      provider: state.provider,
      panel: state.panel,
      palette: state.palette,
      openSheet: openSheet,
      getSheetId: function () { return state.sheetId; },
      getSections: function () { return state.sections; },
      getSources: function () { return state.sources; },
      getGlossary: function () { return state.glossary; },
      getState: function () { return state.provider ? state.provider.getState() : null; }
    };
  }

  if (!C || !UI || !Store || !T || !SN || !SN.search || !SN.sections || !SN.palette || !SN.glossary || !SN.sources) {
    var main = $("#navp-main");
    if (main) main.innerHTML = '<div class="navp-fatal"><h1>No se pudo cargar el previsualizador</h1><p>Revisa que study-data, study-shared y js/nav estén disponibles en el mismo servidor HTTP.</p></div>';
    return;
  }

  boot();
})();
