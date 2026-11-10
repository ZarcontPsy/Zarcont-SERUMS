/* © 2026 ZARCONT — Study Dashboard · Paleta de comandos (Ctrl+K)
   Combobox accesible: fichas, áreas, categorías, vistas y acciones reales.
   Fase 0 entregó el componente; nav.integration.js lo conecta a la app en Fase 1
   y lo abre con lazyIndex para no descargar el índice al abrir. */
(function () {
  "use strict";

  var SN = window.StudyNav;
  if (!SN) throw new Error("StudyNav: carga core.js antes de palette.js");
  if (!SN.search) throw new Error("StudyNav: carga search.js antes de palette.js");
  var U = SN.util;

  function includesQuery(haystack, query) {
    if (!query) return true;
    return SN.search.normalize(haystack).indexOf(query) !== -1;
  }

  function startsWithQuery(text, query) {
    if (!query) return false;
    return SN.search.normalize(text).indexOf(query) === 0;
  }

  function filterItems(items, query) {
    var filtered = (items || []).filter(function (item) {
      if (!query) return true;
      var text = [item.label, item.hint, item.keywords].filter(Boolean).join(" ");
      return includesQuery(text, query);
    });
    if (!query) return filtered;
    filtered.sort(function (a, b) {
      var sa = startsWithQuery(a.label, query) ? 0 : 1;
      var sb = startsWithQuery(b.label, query) ? 0 : 1;
      return sa - sb || a.label.localeCompare(b.label, "es");
    });
    return filtered;
  }

  function downloadBackup() {
    var Store = window.StudyStore;
    if (!Store) return false;
    var payload;
    if (typeof Store.exportProgress === "function") {
      payload = Store.exportProgress();
    } else if (typeof Store.getState === "function") {
      var currentState = Store.getState();
      if (!currentState) return false;
      payload = {
        format: "serums-study-progress",
        schema: 1,
        app: "study-dashboard",
        appVersion: "2.3.0",
        contentVersion: window.STUDY_CONTENT ? window.STUDY_CONTENT.version : "",
        exportedAt: new Date().toISOString(),
        state: currentState,
        note: "Respaldo generado desde la paleta de navegación (Fase 0)."
      };
    } else {
      return false;
    }
    try {
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = "respaldo-estudio-" + new Date().toISOString().slice(0, 10) + ".json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      return true;
    } catch (e) {
      return false;
    }
  }

  function defaultViews() {
    return [
      { id: "panel", kind: "view", label: "Panel", hint: "Vista general y continuar", icon: "grid", href: "#/", keywords: "inicio portada panel" },
      { id: "biblioteca", kind: "view", label: "Biblioteca", hint: "Áreas, categorías y fichas", icon: "book", href: "#/biblioteca", keywords: "temario areas categorias biblioteca" },
      { id: "progreso", kind: "view", label: "Progreso", hint: "Actividad, historial y favoritas", icon: "chart", href: "#/progreso", keywords: "avance estadisticas progreso" }
    ];
  }

  function defaultActions() {
    var actions = [];
    if (window.StudyUI && typeof window.StudyUI.toggleTheme === "function") {
      var light = typeof window.StudyUI.getTheme === "function" && window.StudyUI.getTheme() === "light";
      actions.push({
        id: "theme",
        kind: "action",
        label: light ? "Usar tema oscuro" : "Usar tema claro",
        hint: "Cambia la apariencia de la app",
        icon: light ? "moon" : "sun",
        keywords: "tema apariencia claro oscuro",
        run: function () {
          window.StudyUI.toggleTheme();
          if (window.StudyUI.toast) window.StudyUI.toast(light ? "Tema oscuro activado" : "Tema claro activado");
        }
      });
    }
    if (window.StudyStore) {
      actions.push({
        id: "backup",
        kind: "action",
        label: "Exportar respaldo",
        hint: "Descarga tu progreso en JSON",
        icon: "external",
        keywords: "respaldo backup exportar json datos",
        run: function () {
          var ok = downloadBackup();
          if (window.StudyUI && window.StudyUI.toast) {
            window.StudyUI.toast(ok ? "Respaldo exportado" : "No se pudo exportar el respaldo", ok ? "" : "warn");
          }
        }
      });
    }
    return actions;
  }

  function create(options) {
    var opts = options || {};
    var content = opts.content || window.STUDY_CONTENT;
    var taxonomy = opts.taxonomy || window.StudyTaxonomy || null;
    var provider = opts.provider;
    if (!provider && SN.search) {
      provider = SN.search.createIndexProvider({ content: content, taxonomy: taxonomy, chunkSize: 18 });
    }
    if (!provider && typeof opts.getProvider === "function") provider = opts.getProvider();
    var baseId = U.uid("navx-palette");
    var titleId = baseId + "-title";
    var listId = baseId + "-listbox";
    var statusId = baseId + "-status";
    var layerId = baseId + "-layer";
    var portal = null;
    var layer = null;
    var input = null;
    var listbox = null;
    var statusEl = null;
    var panel = null;
    var closeButton = null;
    var isOpen = false;
    var opener = null;
    var restoreInert = null;
    var scrollLocked = false;
    var items = [];
    var groups = [];
    var activeIndex = 0;
    var activeKey = "";
    var lastRenderQuery = "";
    var renderTimer = null;
    var destroyed = false;
    var unsubscribe = null;
    var query = "";

    function esc(value) { return SN.escape(value); }

    function actionList() {
      return typeof opts.actions === "function" ? opts.actions() : (opts.actions || defaultActions());
    }
    function viewList() {
      return typeof opts.views === "function" ? opts.views() : (opts.views || defaultViews());
    }

    function areaItems(queryText) {
      if (!taxonomy || typeof taxonomy.primaryAreas !== "function") return [];
      return filterItems(taxonomy.primaryAreas().map(function (area) {
        var cats = typeof taxonomy.categoriesForArea === "function" ? taxonomy.categoriesForArea(area.id) : [];
        return {
          id: "area:" + area.id,
          kind: "area",
          label: area.title,
          hint: area.short + " · " + cats.length + " categorías",
          icon: area.icon || "layers",
          href: "#/biblioteca/" + area.id,
          keywords: area.description
        };
      }), queryText).slice(0, 6);
    }

    function categoryItems(queryText) {
      if (!queryText || !taxonomy || typeof taxonomy.categories !== "function") return [];
      return filterItems(taxonomy.categories().map(function (cat) {
        var area = typeof taxonomy.area === "function" ? taxonomy.area(cat.areaId) : null;
        return {
          id: "category:" + cat.id,
          kind: "category",
          label: cat.title,
          hint: area ? area.title : cat.short,
          icon: "layers",
          href: "#/biblioteca/" + cat.areaId + "/" + cat.id,
          keywords: cat.description + " " + cat.short
        };
      }), queryText).slice(0, 5);
    }

    function sheetGroup(queryText) {
      if (!queryText) {
        var totalSheets = content && content.sheets ? content.sheets.length : 0;
        return {
          id: "sheets",
          label: "Fichas",
          status: "hint",
          hint: "Escribe para buscar en las " + totalSheets + " fichas del temario. La búsqueda ignora tildes.",
          items: []
        };
      }
      if (!provider) {
        return { id: "sheets", label: "Fichas", status: "error", hint: "El índice de búsqueda no está disponible.", items: [] };
      }
      var state = provider.getState();
      if (state.state === "loading") {
        return { id: "sheets", label: "Fichas", status: "loading", hint: "Indexando " + (state.progress && state.progress.total ? state.progress.done + " de " + state.progress.total : "el temario") + "…", items: [] };
      }
      if (state.state === "error") {
        return { id: "sheets", label: "Fichas", status: "error", hint: "No se pudo preparar el índice de búsqueda.", items: [] };
      }
      if (state.state !== "ready") {
        return { id: "sheets", label: "Fichas", status: "loading", hint: "Preparando el índice…", items: [] };
      }
      var result;
      try {
        result = SN.search.searchIndex(state.index, queryText, { limit: 8 });
      } catch (e) {
        return { id: "sheets", label: "Fichas", status: "error", hint: "No se pudo consultar el índice.", items: [] };
      }
      var list = result.results.map(function (item) {
        return {
          id: "sheet:" + item.id,
          kind: "sheet",
          label: item.title,
          hint: (item.path || []).join(" · "),
          icon: "book",
          href: item.href,
          sheetId: item.id,
          keywords: "",
          matches: item.matches
        };
      });
      return {
        id: "sheets",
        label: "Fichas",
        status: list.length ? "ok" : "empty",
        hint: list.length ? "" : "Sin coincidencias en las fichas.",
        items: list,
        total: result.total
      };
    }

    function buildGroups() {
      var queryText = SN.search.normalize(query).trim();
      var q = queryText.replace(/[^\p{L}\p{N}\s]+/gu, " ").replace(/\s+/g, " ").trim();
      var result = [];
      if (!q) {
        result.push({ id: "views", label: "Vistas", status: "ok", items: filterItems(viewList(), "") });
        result.push({ id: "actions", label: "Acciones", status: "ok", items: filterItems(actionList(), "") });
        result.push({ id: "areas", label: "Áreas", status: "ok", items: areaItems("") });
        return result;
      }
      result.push(sheetGroup(q));
      result.push({ id: "areas", label: "Áreas", status: "ok", items: areaItems(q) });
      result.push({ id: "categories", label: "Categorías", status: "ok", items: categoryItems(q) });
      result.push({ id: "views", label: "Vistas", status: "ok", items: filterItems(viewList(), q).slice(0, 4) });
      result.push({ id: "actions", label: "Acciones", status: "ok", items: filterItems(actionList(), q).slice(0, 4) });
      return result.filter(function (group) {
        return group.items.length > 0 || group.status === "loading" || group.status === "error" || group.status === "hint";
      });
    }

    function highlight(text) {
      return SN.search.highlightText(text, query ? SN.search.tokenize(query) : []);
    }

    function groupCount(group) {
      if (group.status === "loading" || group.status === "hint") return "";
      if (group.total != null) return String(group.total);
      return String(group.items.length);
    }

    function groupHTML(group) {
      var groupId = baseId + "-group-" + group.id;
      var html = '<div class="navx-palette-group" role="group" aria-labelledby="' + esc(groupId) + '" data-navx-palette-group="' + esc(group.id) + '">';
      html += '<div class="navx-palette-group-head"><span class="navx-palette-group-label" id="' + esc(groupId) + '">' + esc(group.label) + '</span>';
      var count = groupCount(group);
      if (count) html += '<span class="navx-palette-group-count">' + esc(count) + '</span>';
      html += '</div>';
      if (group.status === "loading") {
        html += '<div class="navx-palette-note" role="status"><span class="navx-spinner" aria-hidden="true"></span>' + esc(group.hint || "Preparando…") + '</div>';
      } else if (group.status === "error") {
        html += '<div class="navx-palette-note navx-palette-note--error" role="status">' + esc(group.hint || "No disponible.") +
          ' <button class="navx-inline-button" type="button" data-navx-palette-retry>Reintentar</button></div>';
      } else if (group.status === "hint") {
        html += '<div class="navx-palette-note" role="note">' + esc(group.hint) + '</div>';
      } else if (!group.items.length) {
        html += '<div class="navx-palette-note" role="note">' + esc(group.hint || "Sin coincidencias.") + '</div>';
      } else {
        group.items.forEach(function (item) {
          var index = items.length;
          items.push(item);
          var optionId = baseId + "-option-" + index;
          item.optionId = optionId;
          item.index = index;
          html += '<div class="navx-palette-option" id="' + esc(optionId) + '" role="option" aria-selected="false" data-navx-palette-index="' + index + '" data-navx-palette-kind="' + esc(item.kind) + '">' +
            '<span class="navx-palette-option-icon" aria-hidden="true">' + SN.icon(item.icon || "compass", 16) + '</span>' +
            '<span class="navx-palette-option-copy">' +
              '<span class="navx-palette-option-label">' + highlight(item.label) + '</span>' +
              (item.hint ? '<span class="navx-palette-option-hint">' + esc(item.hint) + '</span>' : "") +
            '</span>' +
            '<span class="navx-palette-option-action" aria-hidden="true">' + (item.kind === "sheet" ? "Abrir" : item.href ? "Ir" : "Ejecutar") + ' ' + SN.icon("arrow", 13) + '</span>' +
            '</div>';
        });
      }
      html += '</div>';
      return html;
    }

    function render() {
      if (!isOpen || destroyed || !listbox) return;
      groups = buildGroups();
      var currentKey = activeKey;
      items = [];
      listbox.innerHTML = groups.map(groupHTML).join("");
      var hasGroupContent = groups.some(function (group) {
        return group.status === "loading" || group.status === "error" || group.status === "hint" || group.items.length > 0;
      });
      if (!items.length) {
        if (!hasGroupContent) {
          listbox.innerHTML = '<div class="navx-palette-empty" role="status">No encontramos fichas, áreas ni acciones para “' + esc(query) + '”.</div>';
        }
        activeIndex = -1;
        activeKey = "";
        input.removeAttribute("aria-activedescendant");
      } else {
        var nextIndex = 0;
        var normalizedQuery = SN.search.normalize(query).trim();
        var queryChanged = normalizedQuery !== lastRenderQuery;
        lastRenderQuery = normalizedQuery;
        var preferred = items.filter(function (item) {
          return SN.search.normalize(item.label).trim() === normalizedQuery;
        })[0];
        if (!preferred && normalizedQuery) {
          preferred = items.filter(function (item) {
            return SN.search.normalize(item.label).trim().indexOf(normalizedQuery) === 0;
          })[0];
        }
        if (currentKey && !queryChanged) {
          var found = items.filter(function (item) { return item.kind + ":" + item.id.replace(/^\w+:/, "") === currentKey; })[0];
          if (found) preferred = found;
        }
        if (preferred) nextIndex = preferred.index;
        activeIndex = nextIndex;
        setActive(activeIndex, false);
      }
      var totalOptions = items.length;
      var loading = groups.some(function (group) { return group.status === "loading"; });
      var message = loading
        ? "Preparando el índice de búsqueda."
        : totalOptions + " " + (totalOptions === 1 ? "opción" : "opciones") + " disponibles.";
      if (statusEl) statusEl.textContent = message;
    }

    function setActive(index, scroll) {
      if (!items.length) {
        activeIndex = -1;
        input.removeAttribute("aria-activedescendant");
        return;
      }
      activeIndex = Math.max(0, Math.min(items.length - 1, index));
      var active = items[activeIndex];
      if (!active) return;
      activeKey = active.kind + ":" + active.id.replace(/^\w+:/, "");
      Array.prototype.slice.call(listbox.querySelectorAll("[role='option']")).forEach(function (option) {
        var isActive = Number(option.getAttribute("data-navx-palette-index")) === activeIndex;
        option.setAttribute("aria-selected", isActive ? "true" : "false");
        option.classList.toggle("is-active", isActive);
      });
      input.setAttribute("aria-activedescendant", active.optionId);
      if (scroll) {
        var option = document.getElementById(active.optionId);
        if (option) option.scrollIntoView({ block: "nearest" });
      }
    }

    function scheduleRender() {
      if (renderTimer) window.clearTimeout(renderTimer);
      renderTimer = window.setTimeout(function () { renderTimer = null; render(); }, 40);
    }

    function ensureIndex() {
      if (!provider) return;
      var state = provider.getState();
      if (state.state === "idle") {
        provider.ensure().catch(function () { render(); });
      }
    }

    function runItem(item) {
      if (!item) return;
      if (item.kind === "sheet") {
        close({ restoreFocus: false });
        if (typeof opts.onOpenSheet === "function") opts.onOpenSheet(item.sheetId, item);
        else navigate("#/ficha/" + encodeURIComponent(item.sheetId), { sheetId: item.sheetId, source: "palette" });
        return;
      }
      if (typeof item.run === "function") {
        close({ restoreFocus: true });
        window.setTimeout(function () { item.run(); }, 10);
        return;
      }
      if (item.href) {
        close({ restoreFocus: true });
        window.setTimeout(function () { navigate(item.href, { source: "palette" }); }, 10);
      }
    }

    function navigate(href, meta) {
      if (typeof opts.onNavigate === "function") {
        opts.onNavigate(href, meta || {});
        return;
      }
      if (window.StudyApp && typeof window.StudyApp.navigate === "function") {
        window.StudyApp.navigate(href);
      } else if (href && href.charAt(0) === "#") {
        window.location.hash = href;
      }
    }

    function focusOpener() {
      /* Si el disparador quedó oculto (por ejemplo, el panel Más se cerró),
         el foco vuelve al contenido principal en lugar de perderse. */
      if (opener && opener.isConnected && typeof opener.focus === "function" && opener.getClientRects().length) {
        U.focus(opener);
        if (document.activeElement === opener) return;
      }
      var main = document.getElementById("main") || document.querySelector("main");
      if (main) U.focus(main);
    }

    function open(trigger) {
      if (destroyed) return;
      ensureDOM();
      if (isOpen) {
        if (input) input.focus();
        return;
      }
      opener = trigger || document.activeElement;
      isOpen = true;
      query = "";
      input.value = "";
      layer.hidden = false;
      layer.setAttribute("data-state", "open");
      panel.setAttribute("aria-modal", "true");
      input.setAttribute("aria-expanded", "true");
      restoreInert = U.inertOutside(portal);
      U.lockScroll();
      scrollLocked = true;
      document.addEventListener("keydown", onDocumentEscape, true);
      SN.layers.open(layerId, function (reason) {
        close({ restoreFocus: reason !== "replaced", fromLayer: true });
      });
      /* En la app el índice derivado es pesado: se pide al escribir la primera
         consulta, no al abrir la paleta. El previsualizador conserva la carga
         inmediata si no se pasa lazyIndex. */
      if (!opts.lazyIndex) ensureIndex();
      render();
      window.setTimeout(function () {
        if (!isOpen) return;
        if (input) input.focus();
      }, 30);
    }

    function close(options) {
      var o = options || {};
      if (!isOpen) return;
      isOpen = false;
      if (layer) {
        layer.hidden = true;
        layer.setAttribute("data-state", "closed");
      }
      if (input) input.setAttribute("aria-expanded", "false");
      document.removeEventListener("keydown", onDocumentEscape, true);
      if (restoreInert) { restoreInert(); restoreInert = null; }
      if (scrollLocked) { U.unlockScroll(); scrollLocked = false; }
      if (!o.fromLayer && SN.layers.isTop(layerId)) SN.layers.close(layerId, "ui");
      if (o.restoreFocus) focusOpener();
    }

    function ensureDOM() {
      if (layer) return;
      portal = U.createPortal("navx-palette-portal");
      portal.innerHTML =
        '<div class="navx-palette-layer" id="' + esc(layerId) + '" data-state="closed" hidden>' +
          '<div class="navx-palette-backdrop" data-navx-palette-dismiss></div>' +
          '<div class="navx-palette-panel" role="dialog" aria-modal="true" aria-labelledby="' + esc(titleId) + '">' +
            '<h2 class="s-sr-only" id="' + esc(titleId) + '">Buscar en Study Dashboard</h2>' +
            '<div class="navx-palette-searchbar">' +
              '<span class="navx-palette-search-icon" aria-hidden="true">' + SN.icon("search", 19) + '</span>' +
              '<input class="navx-palette-input" id="' + esc(baseId) + '-input" type="text" role="combobox" aria-expanded="false" aria-haspopup="listbox" aria-autocomplete="list" aria-controls="' + esc(listId) + '" aria-labelledby="' + esc(titleId) + '" autocomplete="off" spellcheck="false" placeholder="Buscar fichas, áreas, vistas o acciones">' +
              '<button class="navx-palette-close navx-icon-button" type="button" aria-label="Cerrar la paleta de comandos" data-navx-palette-dismiss>' + SN.icon("close", 17) + '</button>' +
            '</div>' +
            '<div class="navx-palette-results" id="' + esc(listId) + '" role="listbox" aria-labelledby="' + esc(titleId) + '"></div>' +
            '<div class="navx-palette-footer" aria-hidden="true">' +
              '<span><kbd>↑</kbd><kbd>↓</kbd> Navegar</span>' +
              '<span><kbd>↵</kbd> Abrir</span>' +
              '<span><kbd>Esc</kbd> Cerrar</span>' +
              '<span class="navx-palette-shortcut"><kbd>Ctrl</kbd><kbd>K</kbd></span>' +
            '</div>' +
            '<p class="s-sr-only" id="' + esc(statusId) + '" role="status" aria-live="polite"></p>' +
          '</div>' +
        '</div>';
      layer = portal.querySelector(".navx-palette-layer");
      panel = portal.querySelector(".navx-palette-panel");
      input = portal.querySelector(".navx-palette-input");
      listbox = portal.querySelector(".navx-palette-results");
      statusEl = portal.querySelector("#" + statusId);
      closeButton = portal.querySelector(".navx-palette-close");

      layer.addEventListener("click", function (event) {
        if (event.target.closest("[data-navx-palette-dismiss]")) {
          event.preventDefault();
          close({ restoreFocus: true });
          return;
        }
        var optionEl = event.target.closest("[data-navx-palette-index]");
        if (optionEl) {
          event.preventDefault();
          runItem(items[Number(optionEl.getAttribute("data-navx-palette-index"))]);
          return;
        }
        var retry = event.target.closest("[data-navx-palette-retry]");
        if (retry) {
          event.preventDefault();
          if (provider) {
            provider.reset();
            provider.ensure().catch(function () { render(); });
          }
          render();
        }
      });
      listbox.addEventListener("mousemove", function (event) {
        var option = event.target.closest("[data-navx-palette-index]");
        if (!option) return;
        var index = Number(option.getAttribute("data-navx-palette-index"));
        if (index !== activeIndex) setActive(index, false);
      });
      input.addEventListener("input", function () {
        query = input.value;
        scheduleRender();
        if (provider && provider.getState().state === "idle") ensureIndex();
      });
      input.addEventListener("keydown", onInputKeydown);
      panel.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          close({ restoreFocus: true });
        } else if (event.key === "Tab") {
          U.trapFocus(event, panel);
        }
      });
    }

    function onInputKeydown(event) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive(activeIndex + 1, true);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive(activeIndex - 1, true);
      } else if (event.key === "Home") {
        event.preventDefault();
        setActive(0, true);
      } else if (event.key === "End") {
        event.preventDefault();
        setActive(items.length - 1, true);
      } else if (event.key === "Enter") {
        if (activeIndex >= 0 && items[activeIndex]) {
          event.preventDefault();
          runItem(items[activeIndex]);
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close({ restoreFocus: true });
      } else if (event.key === "Tab") {
        if (panel) U.trapFocus(event, panel);
      }
    }

    function onGlobalKeydown(event) {
      var key = String(event.key || "").toLowerCase();
      var isK = key === "k" || event.code === "KeyK";
      if ((event.ctrlKey || event.metaKey) && !event.altKey && isK) {
        event.preventDefault();
        if (isOpen) close({ restoreFocus: true });
        else open();
      }
    }

    function onDocumentEscape(event) {
      if (!isOpen || event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      close({ restoreFocus: true });
    }

    if (provider && typeof provider.subscribe === "function") {
      unsubscribe = provider.subscribe(function () {
        if (isOpen) render();
      });
    }
    if (opts.bindShortcut) {
      /* El atajo se registra una sola vez; en producción conviene hacerlo con
         StudyApp.shortcuts y llamar a palette.open(trigger). */
      document.addEventListener("keydown", onGlobalKeydown);
    }

    var api = {
      open: open,
      close: function () { close({ restoreFocus: true }); },
      isOpen: function () { return isOpen; },
      refresh: function () { if (isOpen) render(); },
      focus: function () { if (input) input.focus(); },
      getQuery: function () { return query; },
      getItems: function () { return items.slice(); },
      getActive: function () { return items[activeIndex] || null; },
      navigate: navigate,
      destroy: function () {
        destroyed = true;
        if (renderTimer) window.clearTimeout(renderTimer);
        if (unsubscribe) unsubscribe();
        document.removeEventListener("keydown", onGlobalKeydown);
        document.removeEventListener("keydown", onDocumentEscape, true);
        if (isOpen) close({ restoreFocus: false, fromLayer: true });
        if (SN.layers.isTop(layerId)) SN.layers.close(layerId, "destroy");
        if (portal && portal.parentNode) portal.parentNode.removeChild(portal);
        portal = null;
        layer = null;
      }
    };
    return api;
  }

  SN.palette = {
    create: create,
    downloadBackup: downloadBackup
  };
})();
