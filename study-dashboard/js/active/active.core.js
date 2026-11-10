/* Study Dashboard — Lectura activa · núcleo de la biblioteca
   © 2026 ZARCONT
   Utilidades puras, catálogo de marcas y de escalas. Sin DOM, sin estado,
   sin almacenamiento: la biblioteca visual solo recibe datos y devuelve HTML. */
(function (global) {
  "use strict";

  var A = global.StudyActive = global.StudyActive || {};

  /* ------------------------------------------------------------------ */
  /* Utilidades                                                          */
  /* ------------------------------------------------------------------ */

  var idCounter = 0;

  function str(value) {
    return value == null ? "" : String(value);
  }

  /* Todo texto pasa por StudyUI.escapeHTML (CONTRATOS §3). */
  function esc(value) {
    var ui = global.StudyUI;
    if (ui && typeof ui.escapeHTML === "function") return ui.escapeHTML(value);
    return str(value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function num(value, fallback) {
    var n = Number(value);
    return isFinite(n) ? n : fallback;
  }

  function oneOf(value, allowed, fallback) {
    return allowed.indexOf(value) >= 0 ? value : fallback;
  }

  function uid(prefix) {
    idCounter += 1;
    return (prefix || "ac") + "-" + idCounter;
  }

  /* Identificador estable: la integración debe pasar opts.id para poder
     parchear el DOM sin re-renderizar los campos de texto. */
  function idOf(opts, prefix) {
    return opts && opts.id ? String(opts.id) : uid(prefix);
  }

  function normalize(text) {
    return str(text).toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ").trim();
  }

  function excerpt(text, max) {
    var clean = str(text).replace(/\s+/g, " ").trim();
    var limit = num(max, 120);
    if (clean.length <= limit) return clean;
    var cut = clean.slice(0, limit + 1);
    var lastSpace = cut.lastIndexOf(" ");
    if (lastSpace > limit * 0.6) cut = cut.slice(0, lastSpace);
    return cut.replace(/[\s,;:.]+$/, "") + "…";
  }

  function relative(iso) {
    var ui = global.StudyUI;
    if (ui && typeof ui.formatRelative === "function") return ui.formatRelative(iso);
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    var diff = Date.now() - d.getTime();
    if (diff < 60 * 1000) return "Ahora";
    if (diff < 60 * 60 * 1000) return "Hace " + Math.floor(diff / 60000) + " min";
    var days = Math.floor(diff / 86400000);
    if (days < 1) return "Hoy";
    if (days === 1) return "Ayer";
    if (days < 7) return "Hace " + days + " días";
    return d.toLocaleDateString("es-PE", { day: "numeric", month: "short" });
  }

  function absDate(iso) {
    var d = new Date(iso);
    if (!iso || isNaN(d.getTime())) return "";
    return d.toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" }) +
      ", " + d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  }

  /* ------------------------------------------------------------------ */
  /* Marcas de lectura                                                   */
  /* ------------------------------------------------------------------ */

  /* Etiqueta + icono + color: el subrayado nunca depende solo del color
     (CONTRATOS §7). Los tokens --mark-* llegan del Agente 6; los valores
     de respaldo viven en css/active.css bajo .ac. */
  var MARKS = [
    { key: "important", label: "Importante", icon: "flag", order: 1,
      hint: "Lo que no puede faltar" },
    { key: "understand", label: "Entender", icon: "brain", order: 2,
      hint: "La idea que quieres comprender" },
    { key: "review", label: "Repasar", icon: "rotate", order: 3,
      hint: "Para volver antes del repaso" },
    { key: "doubt", label: "Duda", icon: "alert", order: 4,
      hint: "Pendiente de aclarar" }
  ];

  var RATINGS = [
    { key: "again", label: "No lo sabía", icon: "xCircle", tone: "bad" },
    { key: "hard", label: "Más o menos", icon: "circleHalf", tone: "warn" },
    { key: "good", label: "Lo sabía", icon: "checkCircle", tone: "ok" }
  ];

  var CONFIDENCE = [
    { key: "solid", label: "Lo domino", icon: "checkCircle", tone: "ok",
      hint: "Puedo explicarlo y aplicarlo" },
    { key: "partial", label: "Más o menos", icon: "circleHalf", tone: "warn",
      hint: "Lo entiendo, pero no del todo" },
    { key: "weak", label: "No lo entendí", icon: "xCircle", tone: "bad",
      hint: "Necesito volver a la ficha" }
  ];

  function findIn(list, key) {
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].key === key) return list[i];
    }
    return null;
  }

  A.util = {
    str: str, esc: esc, num: num, oneOf: oneOf, uid: uid, idOf: idOf,
    normalize: normalize, excerpt: excerpt, relative: relative, absDate: absDate
  };

  A.marks = {
    list: function () { return MARKS.slice(); },
    has: function (key) { return !!findIn(MARKS, key); },
    get: function (key) { return findIn(MARKS, key) || MARKS[0]; },
    label: function (key) { return (findIn(MARKS, key) || MARKS[0]).label; },
    icon: function (key) { return (findIn(MARKS, key) || MARKS[0]).icon; }
  };

  A.ratings = {
    list: function () { return RATINGS.slice(); },
    get: function (key) { return findIn(RATINGS, key); }
  };

  A.confidence = {
    list: function () { return CONFIDENCE.slice(); },
    get: function (key) { return findIn(CONFIDENCE, key); },
    has: function (key) { return !!findIn(CONFIDENCE, key); }
  };
})(window);
