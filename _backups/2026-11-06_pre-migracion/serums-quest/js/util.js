/* SERUMS QUEST - utilidades compartidas */
(function () {
  "use strict";

  function clone(value) {
    if (value === undefined || value === null) return value;
    if (window.structuredClone) {
      try { return window.structuredClone(value); } catch (e) {}
    }
    return JSON.parse(JSON.stringify(value));
  }

  function safeParse(raw, fallback) {
    try {
      var value = JSON.parse(raw);
      return value == null ? fallback : value;
    } catch (e) { return fallback; }
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Number(value) || 0));
  }

  function safeInt(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : (fallback || 0);
  }

  function plural(n, one, many) {
    return Number(n) === 1 ? one : (many || one + "s");
  }

  function percent(part, total) {
    if (!total) return 0;
    return Math.round((Number(part) / Number(total)) * 1000) / 10;
  }

  function formatNumber(value) {
    var n = Math.round(Number(value) || 0);
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  function dateKey(date) {
    var d = date ? new Date(date) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function isoWeekKey(date) {
    var d = date ? new Date(date) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    var target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var day = target.getDay() || 7;
    target.setDate(target.getDate() + 4 - day);
    var yearStart = new Date(target.getFullYear(), 0, 1);
    var week = Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
    return target.getFullYear() + "-W" + pad(week);
  }

  function nowISO(date) {
    return (date ? new Date(date) : new Date()).toISOString();
  }

  function parseDate(value) {
    if (!value) return null;
    var d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  function minutesBetween(a, b) {
    var start = parseDate(a), end = parseDate(b);
    if (!start || !end) return 0;
    return Math.abs(end - start) / 60000;
  }

  function hoursBetween(a, b) {
    return minutesBetween(a, b) / 60;
  }

  function daysBetween(a, b) {
    return minutesBetween(a, b) / 1440;
  }

  function addMinutes(date, minutes) {
    var d = new Date(date || Date.now());
    d.setMinutes(d.getMinutes() + Number(minutes || 0));
    return d;
  }

  function addDays(date, days) {
    var d = new Date(date || Date.now());
    d.setDate(d.getDate() + Number(days || 0));
    return d;
  }

  function formatRelative(value) {
    var d = parseDate(value);
    if (!d) return "Sin registro";
    var diff = Date.now() - d.getTime();
    if (diff >= 0 && diff < 45000) return "Ahora";
    if (diff < 0) {
      var ahead = Math.abs(diff);
      if (ahead < 45000) return "Ahora";
      if (ahead < 3600000) return "En " + Math.max(1, Math.round(ahead / 60000)) + " min";
      if (ahead < 86400000) return "En " + Math.ceil(ahead / 3600000) + " h";
      return "En " + Math.ceil(ahead / 86400000) + " días";
    }
    if (diff < 3600000) return "Hace " + Math.max(1, Math.round(diff / 60000)) + " min";
    var today = new Date();
    if (dateKey(d) === dateKey(today)) {
      return "Hoy, " + d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
    }
    var yesterday = addDays(today, -1);
    if (dateKey(d) === dateKey(yesterday)) return "Ayer";
    var days = Math.floor(diff / 86400000);
    if (days < 7) return "Hace " + days + " días";
    return d.toLocaleDateString("es-PE", { day: "numeric", month: "short" });
  }

  function formatDate(value, withTime) {
    var d = parseDate(value);
    if (!d) return "";
    return d.toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" }) +
      (withTime ? " · " + d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : "");
  }

  function formatDuration(ms) {
    var total = Math.max(0, Math.round(Number(ms) / 1000));
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    if (h) return h + ":" + pad(m) + ":" + pad(s);
    return m + ":" + pad(s);
  }

  function formatMinutes(ms) {
    var total = Math.max(0, Math.round(Number(ms) / 60000));
    if (total < 1) return "menos de 1 min";
    if (total < 60) return total + " min";
    return Math.floor(total / 60) + " h " + (total % 60) + " min";
  }

  function formatDue(value) {
    var d = parseDate(value);
    if (!d) return "Sin programar";
    var diff = d.getTime() - Date.now();
    if (diff <= 0) return "Disponible ahora";
    if (diff < 3600000) return "En " + Math.max(1, Math.ceil(diff / 60000)) + " min";
    if (diff < 86400000) return "En " + Math.ceil(diff / 3600000) + " h";
    return "En " + Math.ceil(diff / 86400000) + " días";
  }

  function hashString(value) {
    var str = String(value == null ? "" : value);
    var h1 = 0x811c9dc5;
    var h2 = 0x9e3779b9;
    for (var i = 0; i < str.length; i += 1) {
      var c = str.charCodeAt(i);
      h1 ^= c;
      h1 = Math.imul(h1, 0x01000193) >>> 0;
      h2 = (Math.imul(h2 ^ c, 0x85ebca6b) + i) >>> 0;
    }
    return h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0");
  }

  function seededRandom(seed) {
    var a = parseInt(hashString(seed).slice(0, 8), 16) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(list, seed) {
    var arr = (list || []).slice();
    var rand = typeof seed === "function" ? seed : seededRandom(seed || "quest");
    for (var i = arr.length - 1; i > 0; i -= 1) {
      var j = Math.floor(rand() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function uniqueBy(list, keyFn) {
    var seen = {};
    var out = [];
    (list || []).forEach(function (item) {
      var key = keyFn ? keyFn(item) : item;
      if (seen[key]) return;
      seen[key] = true;
      out.push(item);
    });
    return out;
  }

  function uid(prefix) {
    var rand = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, "0");
    return (prefix || "q") + "_" + Date.now().toString(36) + "_" + rand;
  }

  function sortBy(list, keyFn, desc) {
    return (list || []).slice().sort(function (a, b) {
      var av = keyFn(a), bv = keyFn(b);
      if (av === bv) return 0;
      if (desc) return av < bv ? 1 : -1;
      return av > bv ? 1 : -1;
    });
  }

  function debounce(fn, wait) {
    var timer = 0;
    return function () {
      var args = arguments, ctx = this;
      window.clearTimeout(timer);
      timer = window.setTimeout(function () { fn.apply(ctx, args); }, wait || 160);
    };
  }

  function scrollTop(smooth) {
    try {
      window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
    } catch (e) { window.scrollTo(0, 0); }
  }

  function focusElement(element) {
    if (!element || typeof element.focus !== "function") return;
    try { element.focus({ preventScroll: true }); } catch (e) { element.focus(); }
  }

  function prefersReducedMotion() {
    try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  }

  function downloadText(filename, text, mime) {
    var blob = new Blob([text], { type: mime || "application/json;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 300);
  }

  function readFileText(file) {
    return new Promise(function (resolve, reject) {
      if (!file) { reject(new Error("No se seleccionó un archivo.")); return; }
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || "")); };
      reader.onerror = function () { reject(reader.error || new Error("No se pudo leer el archivo.")); };
      reader.readAsText(file, "utf-8");
    });
  }

  function toTitleCase(value) {
    return String(value || "").replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  window.QuestUtil = {
    clone: clone,
    safeParse: safeParse,
    escapeHTML: escapeHTML,
    esc: escapeHTML,
    clamp: clamp,
    safeInt: safeInt,
    plural: plural,
    percent: percent,
    formatNumber: formatNumber,
    pad: pad,
    dateKey: dateKey,
    isoWeekKey: isoWeekKey,
    nowISO: nowISO,
    parseDate: parseDate,
    minutesBetween: minutesBetween,
    hoursBetween: hoursBetween,
    daysBetween: daysBetween,
    addMinutes: addMinutes,
    addDays: addDays,
    formatRelative: formatRelative,
    formatDate: formatDate,
    formatDuration: formatDuration,
    formatMinutes: formatMinutes,
    formatDue: formatDue,
    hashString: hashString,
    seededRandom: seededRandom,
    shuffle: shuffle,
    uniqueBy: uniqueBy,
    uid: uid,
    sortBy: sortBy,
    debounce: debounce,
    scrollTop: scrollTop,
    focusElement: focusElement,
    prefersReducedMotion: prefersReducedMotion,
    downloadText: downloadText,
    readFileText: readFileText,
    toTitleCase: toTitleCase
  };
})();
