/* SERUMS Map Explorer — utils (utils) */
/* © 2026 ZARCONT — Todos los derechos reservados · Licencia: LICENSE (en esta carpeta y en la raíz del repositorio) */
'use strict';
window.norm = function norm(s) {
  return String(s == null ? '' : s).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
};
window.esc = function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
};
window.fmtNum = function fmtNum(n) { return Number(n || 0).toLocaleString('es-PE'); };
window.debounce = function debounce(fn, ms) {
  var t = null;
  return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms || 250); };
};
window.GD_ORDER = { 'GD-1': 1, 'GD-2': 2, 'GD-3': 3, 'GD-4': 4, 'GD-5': 5 };
window.DIFICULTAD_COLORS = { 'GD-1': '#2e9e5b', 'GD-2': '#b7a100', 'GD-3': '#ef7d00', 'GD-4': '#df2531', 'GD-5': '#7a0e16' };
window.INSTITUCION_COLORS = {
  'GOBIERNO REGIONAL': '#df2531', 'ESSALUD': '#0e63b6', 'MINSA': '#0e9f5d',
  'MINEDU': '#7b1fa2', 'SANIDAD DE LA POLICIA NACIONAL DEL PERU': '#1a237e',
  'SANIDAD DEL EJERCITO DEL PERU': '#4e342e', 'SANIDAD DE LA MARINA DE GUERRA DEL PERU': '#00695c',
  'SANIDAD DE LA FUERZA AEREA DEL PERU': '#0277bd'
};
window.institucionColor = function (inst) {
  if (window.INSTITUCION_COLORS[inst]) return window.INSTITUCION_COLORS[inst];
  var h = 0, s = String(inst || '?');
  for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return 'hsl(' + h + ',62%,42%)';
};
window.validCoords = function (lat, lon) {
  if (lat == null || lon == null || lat === '' || lon === '') return false;
  var la = Number(lat), lo = Number(lon);
  if (!isFinite(la) || !isFinite(lo)) return false;
  return la >= -20 && la <= 2 && lo >= -85 && lo <= -60;
};
window.toast = function toast(msg, ms, action) {
  var el = document.getElementById('toast');
  el.innerHTML = window.esc(msg);
  if (action && action.label && typeof action.fn === 'function') {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'tbtn'; b.textContent = action.label;
    b.onclick = function () { el.style.display = 'none'; action.fn(); };
    el.appendChild(b);
  }
  el.style.display = 'flex';
  clearTimeout(el._t); el._t = setTimeout(function () { el.style.display = 'none'; }, ms || 3200);
};
window.download = function download(name, content, mime) {
  var blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
};
window.mapsLink = function (lat, lon, label) {
  return 'https://www.google.com/maps/search/?api=1&query=' + lat + ',' + lon;
};
window.dirsLink = function (lat, lon) {
  return 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lon;
};
