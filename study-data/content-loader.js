/* © 2026 ZARCONT — carga perezosa de secciones (H4)
 *
 * La app carga `temario-core.js` (metadatos y tarjetas, sin secciones) y este
 * archivo. Al pedir una ficha se descarga solo el chunk de su área primaria.
 * No hace ninguna petición al cargarse.
 *
 * API:
 *   StudyContent.ensureSheet(sheetId) -> Promise<Sheet>
 *   StudyContent.loadArea(areaId)     -> Promise<mapa sheetId -> secciones>
 *   StudyContent.needs(sheet)         -> boolean, sin requests
 *   StudyContent.state()              -> estado de caché/carga/errores
 */
(function () {
  "use strict";

  var VERSION = "1.0.0";
  var SECTION_DIR = "sections/";
  var loaderScript = typeof document !== "undefined" ? document.currentScript : null;
  var base = "";
  var cache = {};
  var promises = {};
  var errors = {};
  var attempts = {};

  function content() { return window.STUDY_CONTENT || null; }
  function scriptMap() { return window.STUDY_SECTIONS || null; }
  function contentVersion() {
    var c = content();
    return c && c.version ? String(c.version) : "0";
  }
  function sectionsBase() {
    if (base) return base;
    var resolved = "";
    try {
      if (loaderScript && loaderScript.src) {
        resolved = new URL(SECTION_DIR, loaderScript.src).href;
      }
    } catch (e) {}
    if (!resolved) {
      try {
        resolved = new URL("../study-data/" + SECTION_DIR, window.location.href).href;
      } catch (e) {
        resolved = "study-data/" + SECTION_DIR;
      }
    }
    base = resolved;
    return base;
  }
  function sheetById(sheetId) {
    var c = content();
    if (!c || !Array.isArray(c.sheets)) return null;
    if (c.sheetById && c.sheetById[sheetId]) return c.sheetById[sheetId];
    for (var i = 0; i < c.sheets.length; i += 1) {
      if (c.sheets[i] && c.sheets[i].id === sheetId) return c.sheets[i];
    }
    return null;
  }
  function primaryArea(sheet) {
    if (!sheet) return "";
    if (sheet.primaryAreaId) return sheet.primaryAreaId;
    var tax = window.StudyTaxonomy;
    if (tax && typeof tax.areaForSheet === "function") {
      try {
        var area = tax.areaForSheet(sheet);
        if (area && area.id) return area.id;
      } catch (e) {}
    }
    return sheet.areaId || "";
  }
  function areaSheets(areaId) {
    var c = content();
    if (!c || !Array.isArray(c.sheets)) return [];
    return c.sheets.filter(function (sheet) { return primaryArea(sheet) === areaId; });
  }
  function hasSections(sheet) {
    return !!(sheet && Array.isArray(sheet.sections));
  }
  function chunkFor(areaId) {
    var map = scriptMap();
    return map && map[areaId] && typeof map[areaId] === "object" ? map[areaId] : null;
  }
  function hydrate(areaId) {
    var map = chunkFor(areaId);
    var sheets = areaSheets(areaId);
    if (!map || !sheets.length) return false;
    for (var i = 0; i < sheets.length; i += 1) {
      if (!Array.isArray(map[sheets[i].id])) return false;
    }
    sheets.forEach(function (sheet) { sheet.sections = map[sheet.id]; });
    cache[areaId] = map;
    delete errors[areaId];
    return true;
  }
  function scriptUrl(areaId, attempt) {
    var url = sectionsBase() + encodeURIComponent(areaId) + ".js?v=" + encodeURIComponent(contentVersion());
    return attempt > 0 ? url + "&retry=" + attempt : url;
  }
  function inject(areaId) {
    var attempt = attempts[areaId] || 0;
    attempts[areaId] = attempt + 1;
    return new Promise(function (resolve, reject) {
      var script;
      var settled = false;
      function finish(error) {
        if (settled) return;
        settled = true;
        if (script) {
          script.onload = null;
          script.onerror = null;
        }
        if (error) {
          if (script && script.parentNode) script.parentNode.removeChild(script);
          reject(error);
          return;
        }
        resolve();
      }
      try {
        script = document.createElement("script");
        script.async = true;
        script.src = scriptUrl(areaId, attempt);
        script.onload = function () { finish(null); };
        script.onerror = function () {
          finish(new Error("No se pudo cargar el contenido de " + areaId + "."));
        };
        (document.head || document.documentElement).appendChild(script);
      } catch (error) {
        finish(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  function needs(sheetOrId) {
    var sheet = typeof sheetOrId === "string" ? sheetById(sheetOrId) : sheetOrId;
    if (!sheet) return false;
    if (hasSections(sheet)) return false;
    var area = primaryArea(sheet);
    if (!area) return true;
    if (cache[area]) return false;
    var map = chunkFor(area);
    return !(map && Array.isArray(map[sheet.id]));
  }

  function loadArea(areaId) {
    var area = typeof areaId === "string" ? areaId.trim() : "";
    if (!area) return Promise.reject(new Error("Falta el área que se quiere cargar."));
    if (!areaSheets(area).length) {
      return Promise.reject(new Error("El área no existe o no tiene fichas: " + area + "."));
    }
    if (cache[area]) return Promise.resolve(cache[area]);
    if (promises[area]) return promises[area];
    if (hydrate(area)) return Promise.resolve(cache[area]);

    var promise = inject(area).then(function () {
      if (!hydrate(area)) {
        throw new Error("El contenido del área " + area + " llegó incompleto.");
      }
      return cache[area];
    });
    promises[area] = promise;
    function settle() {
      if (promises[area] === promise) delete promises[area];
    }
    promise.then(settle, function (error) {
      errors[area] = error;
      settle();
    });
    return promise;
  }

  function ensureSheet(sheetId) {
    var sheet = sheetById(sheetId);
    if (!sheet) return Promise.reject(new Error("Ficha no encontrada: " + sheetId + "."));
    if (hasSections(sheet)) return Promise.resolve(sheet);
    var area = primaryArea(sheet);
    if (!area) return Promise.reject(new Error("La ficha " + sheetId + " no tiene área primaria."));
    var map = chunkFor(area);
    if (map && Array.isArray(map[sheet.id])) {
      sheet.sections = map[sheet.id];
      return Promise.resolve(sheet);
    }
    if (cache[area]) {
      return Promise.reject(new Error("El área " + area + " no contiene la ficha " + sheetId + "."));
    }
    return loadArea(area).then(function () {
      var loaded = chunkFor(area);
      if (!loaded || !Array.isArray(loaded[sheet.id])) {
        throw new Error("El área " + area + " no contiene la ficha " + sheetId + ".");
      }
      sheet.sections = loaded[sheet.id];
      return sheet;
    });
  }

  function state() {
    return {
      version: VERSION,
      contentVersion: contentVersion(),
      loadedAreas: Object.keys(cache).sort(),
      loadingAreas: Object.keys(promises).filter(function (area) {
        return !!promises[area];
      }).sort(),
      errorAreas: Object.keys(errors).filter(function (area) {
        return !!errors[area];
      }).sort()
    };
  }
  function errorFor(areaId) {
    return errors[areaId] || null;
  }
  function loaded(areaId) {
    return !!cache[areaId];
  }
  function reset() {
    cache = {};
    promises = {};
    errors = {};
    attempts = {};
  }

  window.StudyContent = {
    version: VERSION,
    ensureSheet: ensureSheet,
    loadArea: loadArea,
    needs: needs,
    state: state,
    error: errorFor,
    loaded: loaded,
    base: sectionsBase,
    contentVersion: contentVersion,
    reset: reset
  };
})();
