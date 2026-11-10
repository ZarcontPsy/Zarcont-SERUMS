/* © 2026 ZARCONT — Study Dashboard · Navegación (biblioteca de componentes, Fase 0)
   Núcleo compartido: utilidades, capas, foco y bloqueo de scroll.
   No modifica la app ni registra rutas. */
(function () {
  "use strict";

  var SN = window.StudyNav = window.StudyNav || {};
  var uidCounter = 0;

  function escapeHTML(value) {
    if (window.StudyUI && typeof window.StudyUI.escapeHTML === "function") {
      return window.StudyUI.escapeHTML(value);
    }
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function icon(name, size, cls) {
    if (window.StudyUI && typeof window.StudyUI.icon === "function") {
      return window.StudyUI.icon(name, size, cls);
    }
    return "";
  }

  function uid(prefix) {
    uidCounter += 1;
    return (prefix || "navx") + "-" + uidCounter.toString(36);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value) || 0));
  }

  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var args = arguments;
      var self = this;
      window.clearTimeout(timer);
      timer = window.setTimeout(function () { fn.apply(self, args); }, wait == null ? 120 : wait);
    };
  }

  function prefersReducedMotion() {
    try {
      return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch (e) { return false; }
  }

  function coarsePointer() {
    try {
      return !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
    } catch (e) { return false; }
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function focusSilently(element) {
    if (!element || typeof element.focus !== "function") return false;
    try {
      element.focus({ preventScroll: true });
      return true;
    } catch (e) {
      try { element.focus(); return true; } catch (err) { return false; }
    }
  }

  function focusables(container) {
    if (!container) return [];
    var selector = [
      "a[href]", "button:not([disabled])", "input:not([disabled])",
      "select:not([disabled])", "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])"
    ].join(",");
    return Array.prototype.slice.call(container.querySelectorAll(selector)).filter(function (el) {
      if (el.getAttribute("aria-hidden") === "true") return false;
      var style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return false;
      return el.getClientRects().length > 0;
    });
  }

  function trapFocus(event, container) {
    if (!container || event.key !== "Tab") return;
    var items = focusables(container);
    if (!items.length) {
      event.preventDefault();
      return;
    }
    var first = items[0];
    var last = items[items.length - 1];
    var active = document.activeElement;
    if (!container.contains(active)) {
      event.preventDefault();
      focusSilently(event.shiftKey ? last : first);
      return;
    }
    if (event.shiftKey && active === first) {
      event.preventDefault();
      focusSilently(last);
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      focusSilently(first);
    }
  }

  function announce(text) {
    var live = document.getElementById("live");
    if (!live) {
      live = document.createElement("div");
      live.id = "navx-live";
      live.className = "s-sr-only";
      live.setAttribute("aria-live", "polite");
      live.setAttribute("aria-atomic", "true");
      document.body.appendChild(live);
    }
    live.textContent = "";
    window.setTimeout(function () { live.textContent = text; }, 30);
  }

  function positionPopover(anchor, popover, options) {
    var opts = options || {};
    if (!anchor || !popover) return { placement: "none" };
    if (window.matchMedia && window.matchMedia("(max-width: 620px)").matches) {
      popover.style.removeProperty("top");
      popover.style.removeProperty("left");
      popover.style.removeProperty("width");
      return { placement: "sheet" };
    }
    var margin = opts.margin == null ? 10 : opts.margin;
    var gap = opts.gap == null ? 8 : opts.gap;
    var anchorRect = anchor.getBoundingClientRect();
    var popRect = popover.getBoundingClientRect();
    var viewportW = document.documentElement.clientWidth;
    var viewportH = window.innerHeight;
    var width = Math.min(popRect.width || 320, viewportW - margin * 2);
    var left = anchorRect.left + anchorRect.width / 2 - width / 2;
    left = clamp(left, margin, Math.max(margin, viewportW - width - margin));
    var spaceBelow = viewportH - anchorRect.bottom - gap - margin;
    var spaceAbove = anchorRect.top - gap - margin;
    var placement = "bottom";
    var top;
    if (spaceBelow < Math.min(popRect.height || 160, 160) && spaceAbove > spaceBelow) {
      placement = "top";
      top = anchorRect.top - (popRect.height || 160) - gap;
    } else {
      top = anchorRect.bottom + gap;
    }
    top = clamp(top, margin, Math.max(margin, viewportH - (popRect.height || 160) - margin));
    popover.style.width = width + "px";
    popover.style.left = Math.round(left) + "px";
    popover.style.top = Math.round(top) + "px";
    popover.dataset.placement = placement;
    return { placement: placement, left: left, top: top, width: width };
  }

  function createPortal(className) {
    var portal = document.createElement("div");
    portal.className = "navx-portal" + (className ? " " + className : "");
    document.body.appendChild(portal);
    return portal;
  }

  /* Capas: solo una capa interactiva (paleta, hoja, glosario) puede estar
     abierta a la vez. Cada capa registra su propia función de cierre. */
  var topLayer = null;
  var layers = {
    open: function (id, close) {
      if (topLayer && topLayer.id !== id) {
        var previous = topLayer;
        topLayer = null;
        try { previous.close("replaced"); } catch (e) {}
      }
      topLayer = { id: id, close: typeof close === "function" ? close : function () {} };
      return function () { layers.close(id, "manual"); };
    },
    close: function (id, reason) {
      if (!topLayer || topLayer.id !== id) return false;
      var current = topLayer;
      topLayer = null;
      if (reason !== "replaced") {
        try { current.close(reason || "manual"); } catch (e) {}
      }
      return true;
    },
    isTop: function (id) { return !!topLayer && topLayer.id === id; },
    closeAll: function (reason) {
      if (!topLayer) return;
      var current = topLayer;
      topLayer = null;
      try { current.close(reason || "closeAll"); } catch (e) {}
    },
    current: function () { return topLayer ? topLayer.id : null; }
  };

  /* Bloqueo de scroll con contador: la última capa en cerrar restaura. */
  var lockCount = 0;
  var lockPrevious = null;
  function lockScroll() {
    lockCount += 1;
    if (lockCount > 1) return;
    var html = document.documentElement;
    var body = document.body;
    var scrollbar = Math.max(0, window.innerWidth - html.clientWidth);
    lockPrevious = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPaddingRight: body.style.paddingRight
    };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = scrollbar + "px";
  }
  function unlockScroll() {
    if (lockCount === 0) return;
    lockCount -= 1;
    if (lockCount > 0 || !lockPrevious) return;
    document.documentElement.style.overflow = lockPrevious.htmlOverflow || "";
    document.body.style.overflow = lockPrevious.bodyOverflow || "";
    document.body.style.paddingRight = lockPrevious.bodyPaddingRight || "";
    lockPrevious = null;
  }

  /* Fondo inerte para diálogos modales. Devuelve la restauración. */
  function inertOutside(target, options) {
    var opts = options || {};
    var supported = "inert" in HTMLElement.prototype;
    var changed = [];
    Array.prototype.slice.call(document.body.children).forEach(function (el) {
      if (el === target || el.tagName === "SCRIPT" || el.tagName === "STYLE") return;
      if (opts.keep && opts.keep.indexOf(el) !== -1) return;
      if (el.id === "live" || el.getAttribute("aria-live")) return;
      if (el.classList && el.classList.contains("s-toast-stack")) return;
      if (!el.hasAttribute("inert") && el.getAttribute("aria-hidden") !== "true") {
        changed.push({ el: el, inert: el.inert, ariaHidden: el.getAttribute("aria-hidden") });
        if (supported) el.inert = true;
        else el.setAttribute("aria-hidden", "true");
      }
    });
    return function restore() {
      changed.forEach(function (item) {
        if (supported) item.el.inert = item.inert;
        if (item.ariaHidden == null) item.el.removeAttribute("aria-hidden");
        else item.el.setAttribute("aria-hidden", item.ariaHidden);
      });
      changed = [];
    };
  }

  function scrollToElement(element, options) {
    if (!element) return;
    var opts = options || {};
    var top = element.getBoundingClientRect().top + window.scrollY - (opts.offset == null ? 84 : opts.offset);
    var behavior = opts.smooth && !prefersReducedMotion() ? "smooth" : "auto";
    try {
      window.scrollTo({ top: Math.max(0, top), behavior: behavior });
    } catch (e) {
      window.scrollTo(0, Math.max(0, top));
    }
  }

  function isVisible(element) {
    if (!element) return false;
    var rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
  }

  SN.version = "0.1.0";
  SN.escape = escapeHTML;
  SN.icon = icon;
  SN.util = {
    uid: uid,
    clamp: clamp,
    debounce: debounce,
    prefersReducedMotion: prefersReducedMotion,
    coarsePointer: coarsePointer,
    escapeRegExp: escapeRegExp,
    focus: focusSilently,
    focusables: focusables,
    trapFocus: trapFocus,
    announce: announce,
    positionPopover: positionPopover,
    createPortal: createPortal,
    lockScroll: lockScroll,
    unlockScroll: unlockScroll,
    inertOutside: inertOutside,
    scrollToElement: scrollToElement,
    isVisible: isVisible
  };
  SN.layers = layers;

  /* Compatibilidad mínima con el mapa de atajos del router cuando exista.
     En Fase 0 no se registra nada: la app no carga este archivo. */
  SN.bindShortcut = function (spec) {
    if (window.StudyApp && window.StudyApp.shortcuts && typeof window.StudyApp.shortcuts.register === "function") {
      return window.StudyApp.shortcuts.register(spec);
    }
    return null;
  };
})();
