/*!
 * serums-chrome.js — controles compartidos del ecosistema SERUMS
 * Inicio de la app · Volver al HUB · Pantalla completa
 * © 2026 ZARCONT — Todos los derechos reservados · Documento interno del proyecto.
 *
 * Script clásico (sin módulos), sin dependencias, idempotente.
 * Se carga antes del JS de cada aplicación:
 *   <script src="../serums-chrome.js"></script>
 *
 * API pública (contrato AUDIT/COORDINATION.md §3):
 *   window.SerumsChrome.mount(container, {
 *     hubHref, homeHref, appName, buttonClass, fullscreen, order
 *   })
 *   window.SerumsChrome.hubHref()            → URL del HUB calculada desde este script
 *   window.SerumsChrome.homeButton()         → primer botón «Inicio» montado (o null)
 *   window.SerumsChrome.requestFullscreen()  → API nativa, nunca CSS simulado
 *   window.SerumsChrome.exitFullscreen()
 *   window.SerumsChrome.isFullscreen()
 *   window.SerumsChrome.sync()               → resincroniza estado/etiquetas
 */
(function (global, doc) {
  "use strict";

  if (global.SerumsChrome && global.SerumsChrome.version) return;

  var VERSION = "1.0.0";
  var DEFAULT_ORDER = ["home", "hub", "fullscreen"];
  var ORDER_KEYS = { home: true, hub: true, fullscreen: true };
  var statusTimer = null;

  /* URL real de este script: permite calcular el HUB desde cualquier profundidad. */
  var SCRIPT_URL = (function () {
    try {
      if (doc.currentScript && doc.currentScript.src) {
        return new URL(doc.currentScript.src, doc.baseURI).href;
      }
    } catch (e) { /* ignora */ }
    try {
      var scripts = doc.getElementsByTagName("script");
      for (var i = scripts.length - 1; i >= 0; i--) {
        if (scripts[i].src && /serums-chrome(\.min)?\.js(?:\?|#|$)/.test(scripts[i].src)) {
          return new URL(scripts[i].src, doc.baseURI).href;
        }
      }
    } catch (e) { /* ignora */ }
    return null;
  })();

  var ICONS = {
    home: '<path d="m3 10.9 9-7.4 9 7.4"/><path d="M5.4 9.2V21h13.2V9.2"/><path d="M9.6 21v-5.9h4.8V21"/>',
    hub: '<path d="M14 4h3.5A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5H14"/><path d="M9 8.2 4.8 12 9 15.8"/><path d="M4.8 12h10.4"/>',
    expand: '<path d="M8.5 3H5.2A2.2 2.2 0 0 0 3 5.2v3.3"/><path d="M15.5 3h3.3A2.2 2.2 0 0 1 21 5.2v3.3"/><path d="M21 15.5v3.3a2.2 2.2 0 0 1-2.2 2.2h-3.3"/><path d="M3 15.5v3.3A2.2 2.2 0 0 0 5.2 21h3.3"/>',
    compress: '<path d="M3 8.5h3.3A2.2 2.2 0 0 0 8.5 6.3V3"/><path d="M21 8.5h-3.3a2.2 2.2 0 0 1-2.2-2.2V3"/><path d="M3 15.5h3.3a2.2 2.2 0 0 1 2.2 2.2V21"/><path d="M21 15.5h-3.3a2.2 2.2 0 0 0-2.2 2.2V21"/>',
    alert: '<path d="M12 3.5 2.8 19.5h18.4L12 3.5Z"/><path d="M12 9.5v4.4M12 17.2h.01"/>'
  };

  function svg(name, size) {
    var s = size || 18;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true" focusable="false">' + (ICONS[name] || ICONS.alert) + "</svg>";
  }

  function toArray(value) {
    if (!value) return [];
    return Array.isArray(value) ? value.slice() : String(value).split(/\s+/);
  }

  function classes(base, extra) {
    var out = toArray(base);
    var add = toArray(extra);
    for (var i = 0; i < add.length; i++) {
      if (add[i] && out.indexOf(add[i]) === -1) out.push(add[i]);
    }
    return out.join(" ");
  }

  function hubHrefDefault() {
    try {
      return new URL("index.html", SCRIPT_URL || doc.baseURI).href;
    } catch (e) {
      return "index.html";
    }
  }

  function deriveAppName() {
    var meta = doc.querySelector('meta[name="application-name"]');
    if (meta && meta.getAttribute("content")) return meta.getAttribute("content").trim();
    var title = (doc.title || "").split(/\s+[·—–|]\s+/)[0].trim();
    return title || "la aplicación";
  }

  function fullscreenElement() {
    return doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement || null;
  }

  function isFullscreen() {
    return !!fullscreenElement();
  }

  function fsEnabled() {
    if (typeof doc.fullscreenEnabled === "boolean") return doc.fullscreenEnabled;
    if (typeof doc.webkitFullscreenEnabled === "boolean") return doc.webkitFullscreenEnabled;
    return !!((doc.documentElement && (
      doc.documentElement.requestFullscreen || doc.documentElement.webkitRequestFullscreen
    )));
  }

  function announce(message) {
    var nodes = doc.querySelectorAll(".serums-chrome-status");
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = message || "";
    if (message) {
      clearTimeout(statusTimer);
      statusTimer = setTimeout(function () {
        var again = doc.querySelectorAll(".serums-chrome-status");
        for (var j = 0; j < again.length; j++) again[j].textContent = "";
      }, 5000);
    }
  }

  function sync() {
    var on = isFullscreen();
    var buttons = doc.querySelectorAll('[data-serums-chrome="fullscreen"]');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var label = on ? "Salir de pantalla completa" : "Pantalla completa";
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
      btn.setAttribute("data-state", on ? "on" : "off");
      if (btn.getAttribute("data-icon-state") !== (on ? "on" : "off")) {
        btn.innerHTML = svg(on ? "compress" : "expand");
        btn.setAttribute("data-icon-state", on ? "on" : "off");
      }
    }
  }

  function requestFullscreen(target) {
    var el = target || doc.documentElement;
    if (!el) return Promise.reject(new Error("Sin elemento para pantalla completa"));
    var fn = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (!fn) {
      announce("Este navegador no permite la pantalla completa.");
      return Promise.reject(new Error("requestFullscreen no disponible"));
    }
    var result;
    try {
      result = fn.call(el, { navigationUI: "hide" });
    } catch (e) {
      // Algunos navegadores antiguos no aceptan opciones.
      try { result = fn.call(el); } catch (e2) {
        announce("No se pudo activar la pantalla completa.");
        return Promise.reject(e2);
      }
    }
    return Promise.resolve(result).catch(function (err) {
      announce("No se pudo activar la pantalla completa.");
      sync();
      throw err;
    });
  }

  function exitFullscreen() {
    var fn = doc.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
    if (!fn) return Promise.reject(new Error("exitFullscreen no disponible"));
    if (!isFullscreen()) return Promise.resolve();
    var result;
    try { result = fn.call(doc); } catch (e) {
      return Promise.reject(e);
    }
    return Promise.resolve(result).catch(function (err) {
      announce("No se pudo salir de pantalla completa.");
      sync();
      throw err;
    });
  }

  function toggleFullscreen() {
    return isFullscreen() ? exitFullscreen() : requestFullscreen();
  }

  function makeButton(kind, opts, appName) {
    var el;
    var cls = classes("serums-chrome-btn", opts.buttonClass);
    if (kind === "home" || kind === "hub") {
      el = doc.createElement("a");
      el.setAttribute("href", kind === "home" ? opts.homeHref : opts.hubHref);
      el.className = cls;
    } else {
      el = doc.createElement("button");
      el.setAttribute("type", "button");
      el.className = cls;
    }
    el.setAttribute("data-serums-chrome", kind);
    if (kind === "home") {
      el.setAttribute("aria-label", "Volver al inicio de " + appName);
      el.setAttribute("title", "Volver al inicio de " + appName);
      el.innerHTML = svg("home");
    } else if (kind === "hub") {
      el.setAttribute("aria-label", "Volver al HUB");
      el.setAttribute("title", "Volver al HUB");
      el.innerHTML = svg("hub");
    } else {
      el.setAttribute("aria-label", "Pantalla completa");
      el.setAttribute("title", "Pantalla completa");
      el.setAttribute("aria-pressed", "false");
      el.setAttribute("data-icon-state", "off");
      el.innerHTML = svg("expand");
      el.addEventListener("click", function () {
        toggleFullscreen().catch(function () { /* el estado ya se anunció */ });
      });
    }
    return el;
  }

  function normalizeOrder(order) {
    var list = Array.isArray(order) && order.length ? order.slice() : DEFAULT_ORDER.slice();
    var seen = {};
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var key = String(list[i] || "").toLowerCase();
      if (ORDER_KEYS[key] && !seen[key]) { seen[key] = true; out.push(key); }
    }
    return out;
  }

  function resolveContainer(container) {
    if (container && container.nodeType === 1) return container;
    if (typeof container === "string" && container) return doc.querySelector(container);
    if (container === null || container === undefined) return doc.querySelector("[data-chrome-mount]");
    return null;
  }

  function mount(container, options) {
    var host = resolveContainer(container);
    if (!host) return null;

    var opts = options || {};
    var appName = opts.appName || deriveAppName();
    var order = normalizeOrder(opts.order);
    var withFullscreen = opts.fullscreen !== false && fsEnabled();
    var hub = opts.hubHref || hubHrefDefault();
    var home = opts.homeHref || "";
    var buttonClass = opts.buttonClass || "";
    var signature = [hub, home, buttonClass, appName, withFullscreen ? "fs" : "nofs", order.join(",")].join("|");

    var previous = host.__serumsChrome;
    if (previous && previous.signature === signature && host.querySelector(".serums-chrome")) {
      previous.api.sync();
      return previous.api;
    }
    if (previous) {
      try { previous.api.destroy(); } catch (e) { /* ignora */ }
    }

    var group = doc.createElement("span");
    group.className = "serums-chrome";
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", "Controles de la aplicación");
    group.setAttribute("data-chrome-mounted", "1");

    var buttons = {};
    for (var i = 0; i < order.length; i++) {
      var key = order[i];
      if (key === "home" && !home) continue;
      if (key === "fullscreen" && !withFullscreen) continue;
      var btn = makeButton(key, { buttonClass: buttonClass, homeHref: home, hubHref: hub }, appName);
      buttons[key] = btn;
      group.appendChild(btn);
    }

    var status = doc.createElement("span");
    status.className = "serums-chrome-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.setAttribute("aria-atomic", "true");
    group.appendChild(status);

    host.appendChild(group);
    sync();

    var api = {
      group: group,
      buttons: buttons,
      sync: sync,
      destroy: function () {
        if (group.parentNode) group.parentNode.removeChild(group);
        if (host.__serumsChrome && host.__serumsChrome.api === api) host.__serumsChrome = null;
      }
    };
    host.__serumsChrome = { signature: signature, api: api };
    return api;
  }

  function homeButton() {
    var direct = doc.querySelector('[data-serums-chrome="home"]');
    if (direct) return direct;
    var mounted = doc.querySelectorAll("[data-chrome-mounted]");
    for (var i = 0; i < mounted.length; i++) {
      var b = mounted[i].querySelector('[data-serums-chrome="home"]');
      if (b) return b;
    }
    return null;
  }

  /* Sincronización global, una sola vez. No se intercepta Esc: lo gestiona el navegador. */
  function bind() {
    if (doc.__serumsChromeBound) return;
    doc.__serumsChromeBound = true;
    doc.addEventListener("fullscreenchange", sync, false);
    doc.addEventListener("fullscreenerror", function () {
      sync();
      announce("No se pudo activar la pantalla completa.");
    }, false);
    if ("onwebkitfullscreenchange" in doc) {
      doc.addEventListener("webkitfullscreenchange", sync, false);
      doc.addEventListener("webkitfullscreenerror", function () {
        sync();
        announce("No se pudo activar la pantalla completa.");
      }, false);
    }
  }
  bind();

  global.SerumsChrome = {
    version: VERSION,
    mount: mount,
    hubHref: hubHrefDefault,
    homeButton: homeButton,
    requestFullscreen: requestFullscreen,
    exitFullscreen: exitFullscreen,
    isFullscreen: isFullscreen,
    sync: sync,
    fullscreenEnabled: fsEnabled
  };
})(window, document);
