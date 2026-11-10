/* © 2026 ZARCONT — Study Dashboard · Índice flotante de secciones
   Rail de escritorio y hoja inferior en móvil, con scrollspy por IntersectionObserver.
   No cambia el hash: nunca interfiere con el router de la app. */
(function () {
  "use strict";

  var SN = window.StudyNav;
  if (!SN) throw new Error("StudyNav: carga core.js antes de sections.js");
  var U = SN.util;

  function cleanText(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function depthOf(section) {
    if (section.depth) return section.depth === "full" ? "full" : "core";
    var badge = section.querySelector ? section.querySelector(".section-depth") : null;
    if (badge && /ampliaci/i.test(badge.textContent || "")) return "full";
    return "core";
  }

  function collect(root, options) {
    var opts = options || {};
    if (!root) return [];
    var selector = opts.selector || ".reader-section, [data-navx-section]";
    var headingSelector = opts.headingSelector || "h2, h3";
    var scope = typeof opts.scope === "string" ? (root.querySelector(opts.scope) || root) : (opts.scope || root);
    return Array.prototype.slice.call(scope.querySelectorAll(selector)).map(function (element, index) {
      var heading = element.querySelector(headingSelector);
      var title = cleanText(element.getAttribute("data-navx-section-title") || (heading && heading.textContent) || "");
      return {
        id: element.id || "navx-section-" + (index + 1),
        title: title || "Sección " + (index + 1),
        depth: depthOf(element),
        element: element
      };
    });
  }

  function normalizeSections(list, options) {
    var opts = options || {};
    return (list || []).map(function (section, index) {
      if (!section) return null;
      var element = section.element || (section.id ? document.getElementById(section.id) : null);
      if (!element) return null;
      return {
        id: section.id || element.id || "navx-section-" + (index + 1),
        title: cleanText(section.title) || "Sección " + (index + 1),
        depth: section.depth === "full" ? "full" : "core",
        element: element,
        heading: section.heading || element.querySelector(opts.headingSelector || "h2, h3")
      };
    }).filter(Boolean);
  }

  function create(options) {
    var opts = options || {};
    var mount = typeof opts.mount === "string" ? document.querySelector(opts.mount) : opts.mount;
    if (!mount) throw new Error("StudyNav.sections.create: falta el contenedor.");
    var collected = opts.sections || collect(opts.root || document, { selector: opts.selector || ".reader-section" });
    var sections = normalizeSections(collected, opts);
    if (!sections.length) {
      mount.hidden = true;
      return {
        visible: false,
        destroy: function () { mount.hidden = false; },
        refresh: function () {},
        open: function () {},
        close: function () {}
      };
    }

    var mobileQuery = window.matchMedia("(max-width: " + (opts.mobileBreakpoint || 900) + "px)");
    var isMobile = function () { return mobileQuery.matches; };
    var id = U.uid("navx-sections");
    var panelId = id + "-panel";
    var headingId = id + "-heading";
    var layerId = id + "-layer";
    var offset = opts.offset == null ? 84 : Number(opts.offset);
    var state = { open: false, active: 0, progress: 0 };
    var destroyed = false;
    var observer = null;
    var rafPending = false;
    var scrollLocked = false;

    function esc(value) { return SN.escape(value); }

    function itemHTML(section, index) {
      var depthLabel = section.depth === "full" ? "Ampliación" : "Esencial";
      var controls = section.element.id ? ' aria-controls="' + esc(section.element.id) + '"' : "";
      return '<li class="navx-sections-item">' +
        '<button class="navx-section-link" type="button" data-navx-section-index="' + index + '"' + controls + '>' +
          '<span class="navx-section-num" aria-hidden="true">' + String(index + 1).padStart(2, "0") + '</span>' +
          '<span class="navx-section-copy">' +
            '<span class="navx-section-title">' + esc(section.title) + '</span>' +
            '<span class="navx-section-depth">' + esc(depthLabel) + '</span>' +
          '</span>' +
          '<span class="navx-section-reading" aria-hidden="true" hidden></span>' +
        '</button>' +
      '</li>';
    }

    var items = sections.map(itemHTML).join("");
    mount.hidden = false;
    mount.innerHTML =
      '<div class="navx-sections" data-navx-sections>' +
        '<div class="navx-sections-capsule">' +
          '<button class="navx-sections-toggle" type="button" aria-expanded="false" aria-label="Abrir índice de secciones: ' + sections.length + ' ' + (sections.length === 1 ? "sección" : "secciones") + '" aria-controls="' + esc(panelId) + '">' +
            '<span class="navx-sections-toggle-icon" aria-hidden="true">' + SN.icon("list", 16) + '</span>' +
            '<span class="navx-sections-toggle-label">Índice</span>' +
            '<span class="navx-sections-toggle-count" aria-hidden="true">' + sections.length + '</span>' +
            '<span class="navx-sections-toggle-chevron" aria-hidden="true">' + SN.icon("chevronDown", 14) + '</span>' +
          '</button>' +
          '<div class="navx-sections-panel" id="' + esc(panelId) + '" role="region" aria-labelledby="' + esc(headingId) + '" hidden>' +
            '<div class="navx-sections-head">' +
              '<div class="navx-sections-heading">' +
                '<span class="navx-kicker">En esta ficha</span>' +
                '<h2 class="navx-sections-title" id="' + esc(headingId) + '">Secciones</h2>' +
              '</div>' +
              '<button class="navx-icon-button navx-sections-close" type="button" aria-label="Cerrar índice de secciones" data-navx-sections-close>' + SN.icon("close", 16) + '</button>' +
            '</div>' +
            '<div class="navx-sections-progress">' +
              '<div class="navx-sections-progress-copy">' +
                '<span data-navx-sections-current>Sección 1 de ' + sections.length + '</span>' +
                '<span data-navx-sections-percent>0%</span>' +
              '</div>' +
              '<div class="navx-progress" role="progressbar" aria-label="Avance de lectura" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span data-navx-sections-bar style="--navx-p:0"></span></div>' +
            '</div>' +
            '<nav class="navx-sections-nav" aria-label="Índice de secciones de la ficha">' +
              '<ol class="navx-sections-list">' + items + '</ol>' +
            '</nav>' +
          '</div>' +
        '</div>' +
        '<div class="navx-sections-scrim" data-navx-sections-scrim hidden></div>' +
      '</div>';

    var root = mount.querySelector("[data-navx-sections]");
    var toggle = root.querySelector(".navx-sections-toggle");
    var panel = root.querySelector(".navx-sections-panel");
    var closeButton = root.querySelector("[data-navx-sections-close]");
    var scrim = root.querySelector("[data-navx-sections-scrim]");
    var currentLabel = root.querySelector("[data-navx-sections-current]");
    var percentLabel = root.querySelector("[data-navx-sections-percent]");
    var progressBar = root.querySelector(".navx-progress");
    var progressFill = root.querySelector("[data-navx-sections-bar]");
    var links = Array.prototype.slice.call(root.querySelectorAll("[data-navx-section-index]"));

    function setPanelRole() {
      if (isMobile()) {
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-modal", "true");
      } else {
        panel.setAttribute("role", "region");
        panel.removeAttribute("aria-modal");
      }
    }

    function syncA11y() {
      toggle.setAttribute("aria-expanded", state.open ? "true" : "false");
      toggle.setAttribute("aria-label", (state.open ? "Cerrar" : "Abrir") + " índice de secciones: " + sections.length + " " + (sections.length === 1 ? "sección" : "secciones"));
      panel.hidden = !state.open;
      scrim.hidden = !(isMobile() && state.open);
      root.classList.toggle("is-open", state.open);
      root.classList.toggle("is-mobile", isMobile());
      setPanelRole();
    }

    function focusHeading(section) {
      var heading = section.heading;
      if (!heading) return;
      var hadTabindex = heading.hasAttribute("tabindex");
      if (!hadTabindex) heading.setAttribute("tabindex", "-1");
      U.focus(heading);
    }

    function updateActive(nextIndex, nextProgress) {
      if (destroyed) return;
      var activeChanged = nextIndex !== state.active;
      state.active = nextIndex;
      state.progress = nextProgress;
      links.forEach(function (link, index) {
        var active = index === state.active;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
        /* La etiqueta solo existe en el DOM para la sección activa; así no
           puede haber dos «Leyendo» simultáneos ni en texto ni en lectores. */
        var reading = link.querySelector(".navx-section-reading");
        if (reading) {
          var label = active ? "Leyendo" : "";
          if (reading.hidden !== !active) reading.hidden = !active;
          if (reading.textContent !== label) reading.textContent = label;
        }
      });
      if (activeChanged && currentLabel) {
        currentLabel.textContent = "Sección " + (state.active + 1) + " de " + sections.length;
      }
      var percent = Math.round(state.progress * 100);
      if (percentLabel) percentLabel.textContent = percent + "%";
      if (progressFill) progressFill.style.setProperty("--navx-p", String(state.progress));
      if (progressBar) progressBar.setAttribute("aria-valuenow", String(percent));
    }

    function computePosition() {
      if (destroyed || !sections.length) return;
      var threshold = window.scrollY + offset + 8;
      var active = 0;
      sections.forEach(function (section, index) {
        var top = section.element.getBoundingClientRect().top + window.scrollY;
        if (top <= threshold) active = index;
      });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        active = sections.length - 1;
      }
      var firstTop = sections[0].element.getBoundingClientRect().top + window.scrollY;
      var lastRect = sections[sections.length - 1].element.getBoundingClientRect();
      var lastBottom = lastRect.bottom + window.scrollY;
      var span = Math.max(1, lastBottom - firstTop);
      var progress = Math.min(1, Math.max(0, (window.scrollY + window.innerHeight * 0.35 - firstTop) / span));
      updateActive(active, progress);
    }

    function requestPosition() {
      if (rafPending) return;
      rafPending = true;
      window.requestAnimationFrame(function () {
        rafPending = false;
        computePosition();
      });
    }

    function applyOpen(next, options) {
      var o = options || {};
      if (destroyed) return;
      if (state.open === next) {
        syncA11y();
        return;
      }
      state.open = next;
      syncA11y();
      if (isMobile()) {
        if (next) {
          if (!scrollLocked) { U.lockScroll(); scrollLocked = true; }
          SN.layers.open(layerId, function (reason) {
            applyOpen(false, { restoreFocus: reason !== "replaced" });
          });
          window.setTimeout(function () {
            if (state.open && closeButton) U.focus(closeButton);
          }, 40);
        } else {
          if (scrollLocked) { U.unlockScroll(); scrollLocked = false; }
          if (SN.layers.isTop(layerId)) SN.layers.close(layerId, "ui");
          if (o.restoreFocus && toggle) U.focus(toggle);
        }
      } else if (o.restoreFocus && toggle) {
        U.focus(toggle);
      }
      if (typeof opts.onOpenChange === "function") opts.onOpenChange(next);
    }

    function requestClose(options) {
      if (!state.open) return;
      if (isMobile() && SN.layers.isTop(layerId)) {
        SN.layers.close(layerId, "ui");
      } else {
        applyOpen(false, options || { restoreFocus: true });
      }
    }

    function toggleOpen() {
      if (state.open) requestClose({ restoreFocus: true });
      else applyOpen(true, { restoreFocus: false });
    }

    function goTo(index, event) {
      if (event) event.preventDefault();
      var section = sections[index];
      if (!section) return;
      var wasMobile = isMobile();
      if (wasMobile && state.open) requestClose({ restoreFocus: false });
      U.scrollToElement(section.element, { offset: offset, smooth: true });
      updateActive(index, state.progress);
      if (section.heading) {
        window.setTimeout(function () {
          if (!destroyed) focusHeading(section);
        }, wasMobile ? 30 : 0);
      }
      if (typeof opts.onSelect === "function") opts.onSelect(index, section);
    }

    function onKeydown(event) {
      if (event.key === "Escape" && state.open) {
        if (isMobile() || root.contains(document.activeElement)) {
          event.preventDefault();
          requestClose({ restoreFocus: true });
        }
        return;
      }
      if (isMobile() && state.open) U.trapFocus(event, panel);
    }

    function onDocumentClick(event) {
      if (!state.open || !isMobile()) return;
      if (!root.contains(event.target)) requestClose({ restoreFocus: true });
    }

    function onClick(event) {
      var target = event.target;
      if (!target || !target.closest) return;
      if (target.closest("[data-navx-sections-close]")) {
        event.preventDefault();
        requestClose({ restoreFocus: true });
        return;
      }
      if (target.closest("[data-navx-sections-scrim]")) {
        requestClose({ restoreFocus: true });
        return;
      }
      if (target.closest(".navx-sections-toggle")) {
        event.preventDefault();
        toggleOpen();
        return;
      }
      var link = target.closest("[data-navx-section-index]");
      if (link) {
        event.preventDefault();
        goTo(Number(link.getAttribute("data-navx-section-index")), event);
      }
    }

    function onMediaChange() {
      setPanelRole();
      if (isMobile()) {
        if (SN.layers.isTop(layerId)) SN.layers.close(layerId, "media");
        if (scrollLocked) { U.unlockScroll(); scrollLocked = false; }
        state.open = false;
        syncA11y();
      } else {
        if (SN.layers.isTop(layerId)) SN.layers.close(layerId, "media");
        if (scrollLocked) { U.unlockScroll(); scrollLocked = false; }
        state.open = true;
        syncA11y();
      }
      requestPosition();
    }

    function setupObserver() {
      if (typeof IntersectionObserver === "function") {
        observer = new IntersectionObserver(function () { requestPosition(); }, {
          root: null,
          rootMargin: "-" + offset + "px 0px -55% 0px",
          threshold: [0, 0.01, 0.25, 0.5, 1]
        });
        sections.forEach(function (section) { observer.observe(section.element); });
      }
      window.addEventListener("scroll", requestPosition, { passive: true });
      window.addEventListener("resize", requestPosition, { passive: true });
    }

    root.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("click", onDocumentClick);
    if (typeof mobileQuery.addEventListener === "function") {
      mobileQuery.addEventListener("change", onMediaChange);
    } else if (typeof mobileQuery.addListener === "function") {
      mobileQuery.addListener(onMediaChange);
    }
    setupObserver();
    state.open = !isMobile();
    syncA11y();
    requestPosition();

    return {
      visible: true,
      root: root,
      sections: sections,
      open: function () { applyOpen(true, { restoreFocus: false }); },
      close: function () { requestClose({ restoreFocus: true }); },
      refresh: function () { requestPosition(); },
      getActive: function () { return state.active; },
      getProgress: function () { return state.progress; },
      destroy: function () {
        destroyed = true;
        if (observer) observer.disconnect();
        window.removeEventListener("scroll", requestPosition);
        window.removeEventListener("resize", requestPosition);
        document.removeEventListener("keydown", onKeydown);
        document.removeEventListener("click", onDocumentClick);
        if (typeof mobileQuery.removeEventListener === "function") mobileQuery.removeEventListener("change", onMediaChange);
        else if (typeof mobileQuery.removeListener === "function") mobileQuery.removeListener(onMediaChange);
        if (scrollLocked) { U.unlockScroll(); scrollLocked = false; }
        if (SN.layers.isTop(layerId)) SN.layers.close(layerId, "destroy");
        mount.innerHTML = "";
        mount.hidden = true;
      }
    };
  }

  SN.sections = {
    collect: collect,
    create: create
  };
})();
