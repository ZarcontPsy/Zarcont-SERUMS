/* Study Dashboard — Lectura activa · capa de interacción
   © 2026 ZARCONT
   Solo DOM: delega acciones, mide selecciones, coloca la barra y gestiona el
   foco. No guarda nada ni conoce el store: la integración conecta los
   callbacks con StudyStore y con el bus de StudyApp. */
(function (global) {
  "use strict";

  var A = global.StudyActive = global.StudyActive || {};

  var FOCUSABLE = [
    'a[href]:not([aria-disabled="true"]):not([tabindex="-1"])',
    'button:not([disabled]):not([aria-disabled="true"]):not([tabindex="-1"])',
    'input:not([disabled]):not([type="hidden"])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(",");

  function focusable(root) {
    if (!root) return [];
    return Array.prototype.slice.call(root.querySelectorAll(FOCUSABLE)).filter(function (el) {
      if (el.hasAttribute("hidden")) return false;
      if (el.getAttribute("aria-hidden") === "true") return false;
      var style = global.getComputedStyle ? global.getComputedStyle(el) : null;
      if (style && (style.display === "none" || style.visibility === "hidden")) return false;
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
    });
  }

  function focusFirst(root) {
    var items = focusable(root);
    var target = items.length ? items[0] : root;
    if (target && typeof target.focus === "function") {
      try { target.focus({ preventScroll: true }); } catch (err) { target.focus(); }
    }
    return target;
  }

  /* Foco contenido en una hoja/popover. Devuelve release(); con
     release(true) el foco vuelve al disparador. */
  function trap(root) {
    var previous = global.document.activeElement;
    var active = true;
    function onKey(e) {
      if (e.key !== "Tab") return;
      var items = focusable(root);
      if (!items.length) { e.preventDefault(); return; }
      var first = items[0];
      var last = items[items.length - 1];
      var current = global.document.activeElement;
      if (!root.contains(current)) {
        e.preventDefault();
        first.focus();
        return;
      }
      if (e.shiftKey && current === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    }
    root.addEventListener("keydown", onKey);
    return {
      release: function (restore) {
        if (!active) return;
        active = false;
        root.removeEventListener("keydown", onKey);
        if (restore && previous && typeof previous.focus === "function" && global.document.contains(previous)) {
          try { previous.focus({ preventScroll: true }); } catch (err) { previous.focus(); }
        }
      }
    };
  }

  /* Delegación de acciones declarativas.
     handlers = {
       click: { "selection:color": fn(el, event, extra) },
       input: { note: fn(el, event) },
       change: { scope: fn(el, event) },
       keydown: fn(event, actionEl)      // opcional, para atajos del componente
     } */
  function bind(root, handlers) {
    if (!root) return function () {};
    var map = handlers || {};
    var clickMap = map.click || {};
    var inputMap = map.input || {};
    var changeMap = map.change || {};

    function activation(target) {
      var el = target && target.closest ? target.closest("[data-ac-action]") : null;
      return el && root.contains(el) ? el : null;
    }
    function inputTarget(target) {
      var el = target && target.closest ? target.closest("[data-ac-input]") : null;
      return el && root.contains(el) ? el : null;
    }
    function onClick(e) {
      var el = activation(e.target);
      if (!el) return;
      var action = el.getAttribute("data-ac-action");
      var fn = clickMap[action];
      if (!fn) return;
      if (el.tagName === "A" && /^#/.test(el.getAttribute("href") || "")) e.preventDefault();
      fn(el, e, data(el));
    }
    function onInput(e) {
      var el = inputTarget(e.target);
      if (!el) return;
      var fn = inputMap[el.getAttribute("data-ac-input")];
      if (fn) fn(el, e);
    }
    function onChange(e) {
      var el = inputTarget(e.target);
      if (!el) return;
      var fn = changeMap[el.getAttribute("data-ac-input")];
      if (fn) fn(el, e);
    }
    function onKey(e) {
      if (typeof map.keydown !== "function") return;
      map.keydown(e, activation(e.target), inputTarget(e.target));
    }

    root.addEventListener("click", onClick);
    root.addEventListener("input", onInput);
    root.addEventListener("change", onChange);
    root.addEventListener("keydown", onKey);
    return function unbind() {
      root.removeEventListener("click", onClick);
      root.removeEventListener("input", onInput);
      root.removeEventListener("change", onChange);
      root.removeEventListener("keydown", onKey);
    };
  }

  function data(el) {
    var out = {};
    if (!el) return out;
    var target = el.closest("[data-ac-id]") || el;
    var id = target.getAttribute("data-ac-id");
    if (id) out.id = id;
    ["color", "value", "index", "rating", "sheet"].forEach(function (key) {
      var v = el.getAttribute("data-" + key);
      if (v != null) out[key] = v;
    });
    out.annotationId = el.getAttribute("data-ac-id") || id || "";
    return out;
  }

  /* Texto seleccionado dentro de un contenedor. Devuelve null si la selección
     está vacía, es muy corta o vive fuera del contenedor. */
  function readSelection(container) {
    var sel = global.getSelection ? global.getSelection() : null;
    if (!sel || !sel.rangeCount || sel.isCollapsed) return null;
    var range = sel.getRangeAt(0);
    var node = range.commonAncestorContainer;
    var el = node && node.nodeType === 1 ? node : node && node.parentElement;
    if (container && el && !container.contains(el)) return null;
    var text = sel.toString().replace(/\s+/g, " ").trim();
    if (text.length < 2) return null;
    var rect = range.getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) return null;
    return {
      text: text.length > 1200 ? text.slice(0, 1199) + "…" : text,
      rect: rect
    };
  }

  function clearSelection() {
    var sel = global.getSelection ? global.getSelection() : null;
    if (sel && sel.removeAllRanges) sel.removeAllRanges();
  }

  /* Coloca la barra flotante sobre la selección, con vuelta abajo si no hay
     espacio y un margen de seguridad a los lados. */
  function positionBar(bar, anchor, layer) {
    if (!bar || !anchor) return null;
    var box = bar.getBoundingClientRect();
    var layerBox = layer ? layer.getBoundingClientRect() : { left: 0, top: 0, width: global.innerWidth, height: global.innerHeight };
    var gap = 10;
    var bw = box.width || 330;
    var bh = box.height || 190;
    var ax = anchor.left - layerBox.left;
    var ay = anchor.top - layerBox.top;
    var aw = anchor.width || 0;
    var ah = anchor.height || 0;
    var minLeft = 10;
    var maxLeft = Math.max(minLeft, layerBox.width - bw - 10);
    var left = Math.max(minLeft, Math.min(ax + aw / 2 - bw / 2, maxLeft));
    var placement = "above";
    var top = ay - bh - gap;
    if (top < 10) {
      placement = "below";
      top = ay + ah + gap;
    }
    if (top + bh > layerBox.height - 10) {
      top = Math.max(10, Math.min(ay - bh - gap, layerBox.height - bh - 10));
      placement = top < ay ? "above" : placement;
    }
    bar.style.left = Math.round(left) + "px";
    bar.style.top = Math.round(top) + "px";
    bar.setAttribute("data-placement", placement);
    var tail = Math.round(ax + aw / 2 - left);
    bar.style.setProperty("--ac-tail", Math.max(24, Math.min(bw - 24, tail)) + "px");
    return { placement: placement, left: left, top: top };
  }

  /* Navegación con flechas para grupo de radios (confianza y frecuencia).
     El componente ya marca tabindex: aquí se añade el comportamiento esperado
     de role="radiogroup": flechas mueven el foco y eligen. */
  function radioKeys(root, onPick) {
    function onKey(e) {
      if (!/^(ArrowRight|ArrowDown|ArrowLeft|ArrowUp|Home|End)$/.test(e.key)) return;
      var group = e.target && e.target.closest ? e.target.closest('[role="radiogroup"]') : null;
      if (!group) return;
      if (root !== global.document && root.contains && !root.contains(group)) return;
      var items = Array.prototype.slice.call(group.querySelectorAll('[role="radio"]:not([disabled])'));
      if (!items.length) return;
      var index = items.indexOf(e.target);
      if (index === -1) return;
      e.preventDefault();
      var next = index;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (index + 1) % items.length;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (index - 1 + items.length) % items.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = items.length - 1;
      var target = items[next];
      target.focus();
      if (typeof onPick === "function") onPick(target, group);
      else target.click();
    }
    root.addEventListener("keydown", onKey);
    return function () { root.removeEventListener("keydown", onKey); };
  }

  function announce(sink, text) {
    if (!sink) return;
    sink.textContent = "";
    global.setTimeout(function () { sink.textContent = text; }, 30);
  }

  function coarsePointer() {
    return !!(global.matchMedia && global.matchMedia("(pointer: coarse)").matches);
  }

  function reducedMotion() {
    return !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var args = arguments;
      var ctx = this;
      global.clearTimeout(timer);
      timer = global.setTimeout(function () { fn.apply(ctx, args); }, wait || 160);
    };
  }

  A.behavior = {
    focusable: focusable,
    focusFirst: focusFirst,
    trap: trap,
    bind: bind,
    data: data,
    readSelection: readSelection,
    clearSelection: clearSelection,
    positionBar: positionBar,
    announce: announce,
    radioKeys: radioKeys,
    coarsePointer: coarsePointer,
    reducedMotion: reducedMotion,
    debounce: debounce
  };
})(window);
