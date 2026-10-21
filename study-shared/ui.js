/* SERUMS STUDY — utilidades de interfaz compartidas */
(function () {
  "use strict";
  var THEME_KEY = "study-theme";
  var toastTimer = null;

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function icon(name, size, cls) {
    return window.StudyIcons ? window.StudyIcons.svg(name, size, cls) : "";
  }
  function plural(n, one, many) { return Number(n) === 1 ? one : (many || one + "s"); }
  function formatRelative(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    var diff = Date.now() - d.getTime();
    if (diff < 60 * 1000) return "Ahora";
    if (diff < 60 * 60 * 1000) return "Hace " + Math.floor(diff / 60000) + " min";
    var today = new Date();
    var sameDay = d.toDateString() === today.toDateString();
    if (sameDay) return "Hoy, " + d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
    var y = new Date(); y.setDate(y.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return "Ayer";
    var days = Math.floor(diff / 86400000);
    if (days < 7) return "Hace " + days + " días";
    if (days < 30) return "Hace " + Math.floor(days / 7) + " sem";
    return d.toLocaleDateString("es-PE", { day: "numeric", month: "short" });
  }
  function formatDateShort(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("es-PE", { day: "numeric", month: "short" });
  }
  function dueLabel(iso) {
    if (!iso) return "Nueva";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "Nueva";
    var diff = d.getTime() - Date.now();
    if (diff <= 0) return "Hoy";
    var days = Math.ceil(diff / 86400000);
    if (days <= 1) return "Mañana";
    if (days < 7) return "En " + days + " días";
    if (days < 30) return "En " + Math.ceil(days / 7) + " sem";
    return "En " + Math.ceil(days / 30) + " meses";
  }
  function minutesLabel(min) { return (min || 6) + " min de lectura"; }
  function progressBar(value, label) {
    var v = Math.max(0, Math.min(100, Number(value) || 0));
    return '<div class="s-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + v + '" aria-label="' + escapeHTML(label || "Progreso") + '"><span style="width:' + v + '%"></span></div>';
  }
  function sourceChips(refs) {
    if (!refs || !refs.length) return "";
    return refs.map(function (ref) {
      var src = window.StudyStore ? window.StudyStore.getSource(ref.sourceId) : null;
      if (!src) return "";
      var page = ref.pages && ref.pages.length ? ref.pages[0] : null;
      var href = src.file + (page ? "#page=" + page : "");
      var label = src.short + (ref.pages && ref.pages.length ? " · p. " + ref.pages.join(", ") : "");
      return '<a class="s-source" href="' + escapeHTML(href) + '" target="_blank" rel="noopener" title="' + escapeHTML(src.title) + '">' +
        icon("external", 13) + '<span>' + escapeHTML(label) + '</span></a>';
    }).join("");
  }
  function emptyState(opts) {
    var o = opts || {};
    return '<div class="s-empty">' +
      '<span class="s-empty-icon">' + icon(o.icon || "info", 24) + '</span>' +
      '<h2>' + escapeHTML(o.title || "Nada por aquí todavía") + '</h2>' +
      '<p>' + escapeHTML(o.text || "Cuando haya actividad, aparecerá en este espacio.") + '</p>' +
      (o.actions ? '<div class="s-empty-actions">' + o.actions + '</div>' : "") +
      '</div>';
  }
  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait || 180);
    };
  }
  function toast(message, tone) {
    var host = qs(".s-toast-stack");
    if (!host) {
      host = document.createElement("div");
      host.className = "s-toast-stack";
      document.body.appendChild(host);
    }
    host.innerHTML = "";
    var el = document.createElement("div");
    el.className = "s-toast" + (tone ? " is-" + tone : "");
    el.setAttribute("role", "status");
    el.innerHTML = '<span class="s-toast-dot"></span><span>' + escapeHTML(message) + '</span>';
    host.appendChild(el);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.add("is-out");
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 220);
    }, 3200);
  }
  function getTheme() {
    try {
      var t = localStorage.getItem(THEME_KEY);
      return t === "light" ? "light" : "dark";
    } catch (e) { return "dark"; }
  }
  function applyTheme(theme) {
    var t = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    var meta = qs('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "light" ? "#F3F0E8" : "#0B0B0D");
    qsa("[data-theme-toggle]").forEach(function (btn) {
      btn.innerHTML = icon(t === "light" ? "moon" : "sun", 18);
      btn.setAttribute("aria-label", t === "light" ? "Usar tema oscuro" : "Usar tema claro");
      btn.setAttribute("title", t === "light" ? "Tema oscuro" : "Tema claro");
    });
  }
  function toggleTheme() { applyTheme(getTheme() === "light" ? "dark" : "light"); }
  function initTheme() {
    applyTheme(getTheme());
    qsa("[data-theme-toggle]").forEach(function (btn) {
      btn.addEventListener("click", toggleTheme);
    });
  }
  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function scrollTop(smooth) {
    window.scrollTo({ top: 0, behavior: smooth && !reducedMotion() ? "smooth" : "auto" });
  }
  function getQuery(name) {
    try { return new URLSearchParams(window.location.search).get(name) || ""; } catch (e) { return ""; }
  }
  function cleanQuery() {
    try {
      var u = new URL(window.location.href);
      u.search = "";
      history.replaceState({}, "", u.pathname + u.hash);
    } catch (e) {}
  }

  window.StudyUI = {
    qs: qs, qsa: qsa, escapeHTML: escapeHTML, icon: icon, plural: plural,
    formatRelative: formatRelative, formatDateShort: formatDateShort, dueLabel: dueLabel,
    minutesLabel: minutesLabel, progressBar: progressBar, sourceChips: sourceChips,
    emptyState: emptyState, debounce: debounce, toast: toast,
    getTheme: getTheme, applyTheme: applyTheme, toggleTheme: toggleTheme, initTheme: initTheme,
    reducedMotion: reducedMotion, scrollTop: scrollTop, getQuery: getQuery, cleanQuery: cleanQuery
  };
})();
