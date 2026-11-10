/* © 2026 ZARCONT — Study Dashboard · Fuentes PDF de la ficha
   ≥1180 px: acordeón lateral dentro del contexto de la ficha.
   <1180 px: enlaces directos al PDF en pestaña nueva. */
(function () {
  "use strict";

  var SN = window.StudyNav;
  if (!SN) throw new Error("StudyNav: carga core.js antes de sources.js");
  var U = SN.util;

  function pagesLabel(pages) {
    var list = (pages || []).filter(function (page) { return page != null && page !== ""; });
    if (!list.length) return "Páginas no indicadas";
    return (list.length === 1 ? "p. " : "pp. ") + list.join(", ");
  }

  function sourceHref(source, options) {
    if (!source || !source.file) return "";
    if (typeof options.hrefForSource === "function") return options.hrefForSource(source);
    try {
      return new URL(source.file, options.baseHref || window.location.href).href;
    } catch (e) {
      return source.file;
    }
  }

  function resolveEntries(sheet, options) {
    var refs = sheet && Array.isArray(sheet.sourceRefs) ? sheet.sourceRefs : [];
    var resolve = typeof options.resolveSource === "function"
      ? options.resolveSource
      : function (id) {
        if (window.StudyStore && typeof window.StudyStore.getSource === "function") return window.StudyStore.getSource(id);
        var content = options.content || window.STUDY_CONTENT;
        return content && (content.sources || []).filter(function (source) { return source.id === id; })[0] || null;
      };
    var seen = {};
    return refs.map(function (ref) {
      if (!ref || !ref.sourceId) return null;
      var source = resolve(ref.sourceId);
      if (!source) return null;
      if (seen[source.id]) return null;
      seen[source.id] = true;
      var pages = Array.isArray(ref.pages) ? ref.pages.slice() : [];
      var href = sourceHref(source, options);
      if (pages.length && href) href += "#page=" + encodeURIComponent(pages[0]);
      return {
        source: source,
        pages: pages,
        href: href
      };
    }).filter(Boolean);
  }

  function create(options) {
    var opts = options || {};
    var mount = typeof opts.mount === "string" ? document.querySelector(opts.mount) : opts.mount;
    if (!mount) throw new Error("StudyNav.sources.create: falta el contenedor.");
    var baseId = U.uid("navx-sources");
    var titleId = baseId + "-title";
    var panelId = baseId + "-panel";
    var wideMin = Number(opts.wideMin) || 1180;
    var media = window.matchMedia("(min-width: " + wideMin + "px)");
    var sheet = opts.sheet || null;
    var entries = [];
    var open = false;
    var destroyed = false;

    function esc(value) { return SN.escape(value); }
    function isWide() { return media.matches; }

    function sourceItemHTML(entry) {
      var source = entry.source;
      var provenance = source.provenance || source.authors || "Procedencia no indicada";
      return '<li class="navx-source-item">' +
        '<a class="navx-source-link" href="' + esc(entry.href) + '" target="_blank" rel="noopener">' +
          '<span class="navx-source-badge">' + esc(source.short || "PDF") + '</span>' +
          '<span class="navx-source-copy">' +
            '<span class="navx-source-title">' + esc(source.title || "Documento de referencia") + '</span>' +
            '<span class="navx-source-provenance">' + esc(provenance) + '</span>' +
            '<span class="navx-source-pages">' + esc(pagesLabel(entry.pages)) + '</span>' +
          '</span>' +
          '<span class="navx-source-open" aria-hidden="true">' + SN.icon("external", 14) + '</span>' +
        '</a>' +
      '</li>';
    }

    function emptyHTML(message, detail) {
      return '<div class="navx-sources-empty">' +
        '<span class="navx-sources-empty-icon" aria-hidden="true">' + SN.icon("info", 18) + '</span>' +
        '<div><b>' + esc(message) + '</b><p>' + esc(detail) + '</p></div>' +
      '</div>';
    }

    function render() {
      if (destroyed) return;
      entries = resolveEntries(sheet, opts);
      var pages = entries.reduce(function (total, entry) { return total + entry.pages.length; }, 0);
      var hasSources = entries.length > 0;
      var head = '<div class="navx-sources-head">' +
        '<div><span class="navx-kicker">Contexto documental</span><h2 class="navx-sources-title" id="' + esc(titleId) + '">Fuentes</h2></div>' +
        (hasSources ? '<span class="navx-sources-count">' + entries.length + ' ' + (entries.length === 1 ? "documento" : "documentos") + (pages ? " · " + pages + " " + (pages === 1 ? "página" : "páginas") : "") + '</span>' : "") +
        '</div>';

      var html = '<section class="navx-sources" aria-labelledby="' + esc(titleId) + '">' + head;
      if (!hasSources) {
        html += (sheet && sheet.sourceRefs && sheet.sourceRefs.length)
          ? emptyHTML("Las fuentes no están disponibles", "La ficha declara referencias, pero sus datos no se encontraron en el catálogo.")
          : emptyHTML("Sin referencia documental", "Esta ficha no tiene una fuente PDF asociada en el temario.");
        html += '</section>';
        mount.innerHTML = html;
        mount.hidden = false;
        return;
      }

      if (isWide()) {
        html += '<button class="navx-sources-toggle" type="button" aria-expanded="' + (open ? "true" : "false") + '" aria-controls="' + esc(panelId) + '">' +
            '<span class="navx-sources-toggle-copy"><b>' + (open ? "Ocultar fuentes" : "Ver fuentes y páginas") + '</b>' +
              '<span>Sin perder el contexto de la ficha</span></span>' +
            '<span class="navx-sources-toggle-icon" aria-hidden="true">' + SN.icon("chevronDown", 15) + '</span>' +
          '</button>' +
          '<div class="navx-sources-panel" id="' + esc(panelId) + '"' + (open ? "" : " hidden") + '>' +
            '<div class="navx-sources-panel-head">' +
              '<h3>Fuentes de esta ficha</h3>' +
              '<button class="navx-icon-button" type="button" aria-label="Cerrar panel de fuentes" data-navx-sources-close>' + SN.icon("close", 15) + '</button>' +
            '</div>' +
            '<ol class="navx-sources-list">' + entries.map(sourceItemHTML).join("") + '</ol>' +
          '</div>';
      } else {
        html += '<p class="navx-sources-intro">Cada documento se abre en una pestaña nueva.</p>' +
          '<ol class="navx-sources-list">' + entries.map(sourceItemHTML).join("") + '</ol>';
      }
      html += '</section>';
      mount.innerHTML = html;
      mount.hidden = false;
      bind();
    }

    function bind() {
      var root = mount.querySelector(".navx-sources");
      if (!root) return;
      var toggle = root.querySelector(".navx-sources-toggle");
      var panel = root.querySelector(".navx-sources-panel");
      var closeButton = root.querySelector("[data-navx-sources-close]");
      if (!toggle || !panel) return;

      toggle.addEventListener("click", function () {
        if (open) closePanel(true);
        else openPanel();
      });
      if (closeButton) closeButton.addEventListener("click", function () { closePanel(true); });
      root.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && open && root.contains(document.activeElement)) {
          event.preventDefault();
          closePanel(true);
        }
      });
    }

    var pointerListener = null;
    function openPanel() {
      if (!isWide() || open || destroyed) return;
      var root = mount.querySelector(".navx-sources");
      var toggle = root && root.querySelector(".navx-sources-toggle");
      var panel = root && root.querySelector(".navx-sources-panel");
      var closeButton = root && root.querySelector("[data-navx-sources-close]");
      if (!toggle || !panel) return;
      open = true;
      panel.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      var text = toggle.querySelector(".navx-sources-toggle-copy b");
      if (text) text.textContent = "Ocultar fuentes";
      if (closeButton) U.focus(closeButton);
      pointerListener = function (event) {
        if (!root.contains(event.target)) closePanel(false);
      };
      document.addEventListener("pointerdown", pointerListener, true);
    }

    function closePanel(restoreFocus) {
      if (!open) return;
      var root = mount.querySelector(".navx-sources");
      var toggle = root && root.querySelector(".navx-sources-toggle");
      var panel = root && root.querySelector(".navx-sources-panel");
      open = false;
      if (panel) panel.hidden = true;
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
        var text = toggle.querySelector(".navx-sources-toggle-copy b");
        if (text) text.textContent = "Ver fuentes y páginas";
        if (restoreFocus) U.focus(toggle);
      }
      if (pointerListener) {
        document.removeEventListener("pointerdown", pointerListener, true);
        pointerListener = null;
      }
    }

    function onMediaChange() {
      if (open) closePanel(false);
      render();
    }

    if (typeof media.addEventListener === "function") media.addEventListener("change", onMediaChange);
    else if (typeof media.addListener === "function") media.addListener(onMediaChange);

    render();

    return {
      refresh: function (nextSheet) {
        if (nextSheet) sheet = nextSheet;
        if (open) closePanel(false);
        render();
      },
      open: openPanel,
      close: function () { closePanel(true); },
      isOpen: function () { return open; },
      getEntries: function () { return entries.slice(); },
      destroy: function () {
        destroyed = true;
        if (open) closePanel(false);
        if (typeof media.removeEventListener === "function") media.removeEventListener("change", onMediaChange);
        else if (typeof media.removeListener === "function") media.removeListener(onMediaChange);
        mount.innerHTML = "";
        mount.hidden = true;
      }
    };
  }

  SN.sources = {
    create: create,
    pagesLabel: pagesLabel,
    sourceHref: sourceHref
  };
})();
