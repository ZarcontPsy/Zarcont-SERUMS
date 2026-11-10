/* SERUMS STUDY — Puente de herramientas de consulta (Fase 3)
   Glosario, datos y trampas comparten carga perezosa de derivados, búsqueda sin
   acentos, filtros por área y metadatos de ficha. No descarga nada al arrancar:
   cada vista llama a load(kind) desde su mount.

   Contrato: study-dashboard/docs/CONTRATOS-FASE3.md §3
   © 2026 ZARCONT */
(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var cache = {};
  var loading = {};
  var errors = {};
  var SOURCE_LABELS = { callout: "Aviso", bullet: "Distinción", paragraph: "Glosario" };
  var SOURCE_ORDER = ["callout", "bullet"];

  function content() { return root.STUDY_CONTENT || null; }
  function store() { return root.StudyStore || null; }
  function isObject(v) { return !!v && typeof v === "object" && !Array.isArray(v); }
  function norm(value) {
    var text = String(value == null ? "" : value);
    try { text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch (e) {}
    return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
  }
  function tokens(value) {
    var n = norm(value);
    return n ? n.split(" ") : [];
  }
  function esc(value) {
    if (root.StudyUI && typeof root.StudyUI.escapeHTML === "function") {
      return root.StudyUI.escapeHTML(value);
    }
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function icon(name, size) {
    return root.StudyUI && typeof root.StudyUI.icon === "function"
      ? root.StudyUI.icon(name, size || 15) : "";
  }
  function plural(n, one, many) {
    return Number(n) === 1 ? one : (many || one + "s");
  }
  function clip(value, max) {
    var text = String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    return text.length > max ? text.slice(0, max - 1).replace(/[\s,;:.-]+$/, "") + "…" : text;
  }
  function sheetFor(sheetId) {
    var c = content();
    if (!c) return null;
    if (c.sheetById && c.sheetById[sheetId]) return c.sheetById[sheetId];
    var list = Array.isArray(c.sheets) ? c.sheets : [];
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].id === sheetId) return list[i];
    }
    return null;
  }
  function areaForSheet(sheetId) {
    var sheet = sheetFor(sheetId);
    var c = content();
    var areaId = sheet ? (sheet.primaryAreaId || sheet.areaId || "sin-area") : "sin-area";
    var area = c && c.primaryAreaById ? c.primaryAreaById[areaId] : null;
    return {
      id: areaId,
      title: area ? area.title : "Sin área",
      short: area ? (area.short || area.title) : "Sin área"
    };
  }
  function categoryForSheet(sheetId) {
    var sheet = sheetFor(sheetId);
    var c = content();
    var catId = sheet ? sheet.categoryId : null;
    var cat = c && c.categoryById ? c.categoryById[catId] : null;
    return { id: catId || "sin-categoria", title: cat ? cat.title : "Sin categoría" };
  }
  function areaOptions() {
    var c = content();
    var list = c && Array.isArray(c.primaryAreas) ? c.primaryAreas.slice() : [];
    return list.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  }
  function annotate(kind, entry) {
    if (!entry || typeof entry !== "object") return null;
    var sheet = sheetFor(entry.sheetId);
    var area = areaForSheet(entry.sheetId);
    var category = categoryForSheet(entry.sheetId);
    var text = "";
    if (kind === "glossary") text = [entry.term, entry.definition, entry.sectionTitle].join(" ");
    else if (kind === "facts") text = [entry.term, entry.detail, entry.sectionTitle, (entry.headers || []).join(" ")].join(" ");
    else text = [entry.title, entry.text, entry.sectionTitle].join(" ");
    return {
      raw: entry,
      id: entry.id,
      kind: kind,
      sheetId: entry.sheetId,
      sheetTitle: sheet ? sheet.title : entry.sheetId,
      sheet: sheet,
      areaId: area.id,
      areaTitle: area.title,
      areaShort: area.short,
      categoryId: category.id,
      categoryTitle: category.title,
      sectionIndex: entry.sectionIndex,
      sectionTitle: entry.sectionTitle || "",
      term: entry.term || entry.title || "",
      definition: entry.definition || "",
      detail: entry.detail || "",
      text: entry.text || "",
      title: entry.title || "",
      headers: Array.isArray(entry.headers) ? entry.headers : [],
      source: entry.source || "",
      sourceLabel: SOURCE_LABELS[entry.source] || "Referencia",
      tone: entry.tone || "",
      severity: entry.severity || "",
      searchText: norm(text)
    };
  }
  function load(kind) {
    var key = String(kind || "");
    if (["glossary", "facts", "warnings"].indexOf(key) === -1) {
      return Promise.reject(new Error("Derivado no compatible: " + key));
    }
    if (cache[key]) return Promise.resolve(cache[key]);
    if (loading[key]) return loading[key];
    if (!root.StudyDerived || typeof root.StudyDerived.load !== "function") {
      return Promise.reject(new Error("El cargador de índices no está disponible."));
    }
    delete errors[key];
    loading[key] = root.StudyDerived.load(key).then(function (data) {
      var entries = data && Array.isArray(data.entries) ? data.entries : [];
      cache[key] = entries.map(function (entry) { return annotate(key, entry); }).filter(Boolean);
      delete loading[key];
      return cache[key];
    }).catch(function (error) {
      delete loading[key];
      errors[key] = error;
      throw error;
    });
    return loading[key];
  }
  function entries(kind) {
    return cache[kind] ? cache[kind].slice() : [];
  }
  function state(kind) {
    if (errors[kind]) return "error";
    if (loading[kind]) return "loading";
    return cache[kind] ? "ready" : "idle";
  }
  function lastError(kind) {
    return errors[kind] || null;
  }
  function filter(list, options) {
    var opts = options || {};
    var q = norm(opts.query);
    var qTokens = tokens(q);
    var areaId = opts.areaId || "";
    var source = opts.source || "";
    var knownOnly = !!opts.knownOnly;
    var pendingOnly = !!opts.pendingOnly;
    var known = (knownOnly || pendingOnly) ? knownSet() : null;
    return (Array.isArray(list) ? list : []).filter(function (item) {
      if (!item) return false;
      if (areaId && item.areaId !== areaId) return false;
      if (source && item.source !== source) return false;
      if (knownOnly && item.kind === "facts" && !known[item.id]) return false;
      if (pendingOnly && item.kind === "facts" && known[item.id]) return false;
      if (!qTokens.length) return true;
      return qTokens.every(function (token) { return item.searchText.indexOf(token) !== -1; });
    });
  }
  function knownSet() {
    var s = store();
    var map = {};
    if (!s || !s.factsKnown || typeof s.factsKnown.listKnown !== "function") return map;
    try {
      (s.factsKnown.listKnown() || []).forEach(function (id) { map[id] = true; });
    } catch (e) {}
    return map;
  }
  function setKnown(factId, known) {
    var s = store();
    if (!s || !s.factsKnown || typeof s.factsKnown.set !== "function") return null;
    return s.factsKnown.set(factId, !!known);
  }
  function sheetHref(sheetId) {
    return "#/ficha/" + encodeURIComponent(sheetId || "");
  }
  function countsByArea(list) {
    var out = {};
    (Array.isArray(list) ? list : []).forEach(function (item) {
      if (!item) return;
      if (!out[item.areaId]) out[item.areaId] = { areaId: item.areaId, count: 0 };
      out[item.areaId].count += 1;
    });
    return out;
  }
  function sourceOptions(list) {
    var seen = {};
    (Array.isArray(list) ? list : []).forEach(function (item) {
      if (item && item.source) seen[item.source] = true;
    });
    return Object.keys(seen).sort(function (a, b) {
      return (SOURCE_ORDER.indexOf(a) + 1 || 99) - (SOURCE_ORDER.indexOf(b) + 1 || 99);
    });
  }

  root.StudyReference = {
    version: VERSION,
    load: load,
    entries: entries,
    state: state,
    lastError: lastError,
    filter: filter,
    areaOptions: areaOptions,
    areaForSheet: areaForSheet,
    categoryForSheet: categoryForSheet,
    sheetFor: sheetFor,
    sheetHref: sheetHref,
    knownSet: knownSet,
    setKnown: setKnown,
    countsByArea: countsByArea,
    sourceOptions: sourceOptions,
    sourceLabel: function (source) { return SOURCE_LABELS[source] || "Referencia"; },
    normalize: norm,
    tokens: tokens,
    escape: esc,
    icon: icon,
    plural: plural,
    clip: clip
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
