/* © 2026 ZARCONT — Study Dashboard · cargador de derivados bajo demanda
   No se carga en index.html: el Coordinador lo incluye y la app lo usa solo cuando
   la búsqueda o una vista concreta necesitan search/glossary/facts/warnings/related.
   Nada se descarga al arrancar. */
(function () {
  "use strict";

  var FILES = ["search", "glossary", "facts", "warnings", "related", "manifest", "report"];
  var cache = {};
  var promises = {};
  var errors = {};
  var baseUrl = "";
  var lastError = null;
  /* currentScript solo existe durante la ejecución inicial: se captura ahora. */
  var initialScript = document.currentScript;

  function scriptBase() {
    try {
      if (initialScript && initialScript.src) {
        return new URL("../../../study-data/derived/", initialScript.src).href;
      }
    } catch (e) {}
    return "";
  }
  function pageBase() {
    try {
      return new URL("../study-data/derived/", window.location.href).href;
    } catch (e) {
      return "study-data/derived/";
    }
  }
  function resolveBase() {
    if (baseUrl) return baseUrl;
    baseUrl = scriptBase() || pageBase();
    return baseUrl;
  }
  function isName(name) {
    return typeof name === "string" && /^[a-z][a-z0-9-]{1,30}$/.test(name);
  }
  function stateFor(name) {
    if (name && errors[name]) return "error";
    if (name && promises[name]) {
      if (cache[name]) return "ready";
      if (promises[name]._state) return promises[name]._state;
      return "loading";
    }
    if (name) return cache[name] ? "ready" : "idle";
    var names = Object.keys(promises).concat(Object.keys(errors));
    if (!names.length) return "idle";
    if (Object.keys(errors).length) return "error";
    if (names.some(function (key) { return promises[key] && promises[key]._state === "loading"; })) return "loading";
    if (Object.keys(cache).length) return "ready";
    return "idle";
  }
  function markPromise(promise, state) {
    try { promise._state = state; } catch (e) {}
    return promise;
  }

  function load(name) {
    if (!isName(name)) {
      lastError = new Error("Nombre de derivado no válido: " + String(name));
      return Promise.reject(lastError);
    }
    if (cache[name]) return Promise.resolve(cache[name]);
    if (promises[name]) return promises[name];
    delete errors[name];
    if (typeof fetch !== "function") {
      lastError = new Error("Este navegador no admite fetch; los derivados no se pueden cargar.");
      var rejected = markPromise(Promise.reject(lastError), "error");
      promises[name] = rejected;
      return rejected;
    }
    var url = resolveBase() + name + ".json";
    var promise = fetch(url, { credentials: "same-origin", cache: "no-cache" })
      .then(function (response) {
        if (!response.ok) throw new Error("No se pudo cargar " + name + ".json (HTTP " + response.status + ").");
        return response.json();
      })
      .then(function (data) {
        if (!data || typeof data !== "object" || Array.isArray(data)) {
          throw new Error(name + ".json no contiene un objeto válido.");
        }
        var format = data.format ? String(data.format) : "";
        if (format && format.indexOf("serums-study-") !== 0) {
          throw new Error(name + ".json tiene un formato desconocido.");
        }
        cache[name] = data;
        markPromise(promise, "ready");
        return data;
      })
      .catch(function (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        errors[name] = lastError;
        markPromise(promise, "error");
        /* No se cachea el fallo: una recarga o un reintento puede recuperarlo. */
        delete promises[name];
        throw lastError;
      });
    markPromise(promise, "loading");
    promises[name] = promise;
    return promise;
  }

  function get(name) {
    return cache[name] || null;
  }
  function reset(name) {
    if (name) {
      delete cache[name];
      delete promises[name];
      delete errors[name];
      return;
    }
    cache = {};
    promises = {};
    errors = {};
    lastError = null;
  }
  function fragment(entry) {
    if (!entry) return "";
    return entry.f || entry.t || "";
  }

  window.StudyDerived = {
    FILES: FILES.slice(),
    load: load,
    get: get,
    state: stateFor,
    fragment: fragment,
    reset: reset,
    base: resolveBase,
    lastError: function () { return lastError; }
  };
})();
