/* SERUMS Map Explorer — filters (hooks/useFilters + usePlazas) */
/* © 2026 ZARCONT — Todos los derechos reservados · Licencia: LICENSE (en esta carpeta y en la raíz del repositorio) */
'use strict';
window.Filters = (function () {
  var S = null; // referencia al estado global App.S
  function bind(state) { S = state; }
  function blank() {
    return { profesiones: [], instituciones: [], dificultades: [], regiones: [], provincia: '', distrito: '',
      categorias: [], presupuestos: [], zaf: '', ze: '', geo: '', search: '' };
  }
  function distinct(rows, key) {
    var m = {}, out = [];
    rows.forEach(function (r) { var v = r[key] || 'Sin información'; if (!m[v]) { m[v] = 0; out.push(v); } m[v]++; });
    return out.sort().map(function (v) { return { v: v, n: m[v] }; });
  }
  /* Filtro rápido por estado (marca del usuario): todas | favoritas | adjudicadas | bloqueadas | disponibles */
  function quickPass(p) {
    var q = (S && S.quick) || 'todas';
    if (q === 'favoritas') return window.App.isFav(p);
    if (q === 'adjudicadas') return window.App.isAdj(p);
    if (q === 'bloqueadas') return window.App.isBloq(p);
    /* disponible = todavía puede ser elegida: sin tu adjudicación Y sin bloqueo */
    if (q === 'disponibles') return !window.App.isAdj(p) && !window.App.isBloq(p);
    return true;
  }
  /* Opciones disponibles según los demás filtros (sin el propio grupo) */
  function baseExcept(group) {
    return window.App.allPlazas().filter(function (p) {
      if (!quickPass(p)) return false;
      var f = S.filters;
      if (group !== 'prof' && f.profesiones.length && f.profesiones.indexOf(p.profesion) < 0) return false;
      if (group !== 'inst' && f.instituciones.length && f.instituciones.indexOf(p.institucion) < 0) return false;
      if (group !== 'dif' && f.dificultades.length && f.dificultades.indexOf(p.dificultad || 'Sin información') < 0) return false;
      if (group !== 'geo' && f.regiones.length && f.regiones.indexOf(p.departamento) < 0) return false;
      if (f.provincia && p.provincia !== f.provincia) return false;
      if (f.distrito && p.distrito !== f.distrito) return false;
      if (group !== 'cat' && f.categorias.length && f.categorias.indexOf(p.categoria || 'Sin información') < 0) return false;
      if (group !== 'pre' && f.presupuestos.length && f.presupuestos.indexOf(p.presupuesto || 'Sin información') < 0) return false;
      if (f.zaf && p.zaf !== f.zaf) return false;
      if (f.ze && p.ze !== f.ze) return false;
      if (f.geo === 'ubicada' && p.lat == null) return false;
      if (f.geo === 'pendiente' && p.lat != null) return false;
      if (f.search) {
        var q = window.norm(f.search);
        var hay = window.norm([p.establecimiento, p.codigo, p.distrito, p.provincia, p.departamento].join(' '));
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }
  function applyAll(opts) {
    var f = S.filters, ignoraRapido = opts && opts.ignoreQuick;
    var out = window.App.allPlazas().filter(function (p) {
      if (!ignoraRapido && !quickPass(p)) return false;
      if (f.profesiones.length && f.profesiones.indexOf(p.profesion) < 0) return false;
      if (f.instituciones.length && f.instituciones.indexOf(p.institucion) < 0) return false;
      if (f.dificultades.length && f.dificultades.indexOf(p.dificultad || 'Sin información') < 0) return false;
      if (f.regiones.length && f.regiones.indexOf(p.departamento) < 0) return false;
      if (f.provincia && p.provincia !== f.provincia) return false;
      if (f.distrito && p.distrito !== f.distrito) return false;
      if (f.categorias.length && f.categorias.indexOf(p.categoria || 'Sin información') < 0) return false;
      if (f.presupuestos.length && f.presupuestos.indexOf(p.presupuesto || 'Sin información') < 0) return false;
      if (f.zaf && p.zaf !== f.zaf) return false;
      if (f.ze && p.ze !== f.ze) return false;
      if (f.geo === 'ubicada' && p.lat == null) return false;
      if (f.geo === 'pendiente' && p.lat != null) return false;
      if (f.search) {
        var q = window.norm(f.search);
        var hay = window.norm([p.establecimiento, p.codigo, p.distrito, p.provincia, p.departamento].join(' '));
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
    /* orden */
    var k = S.sort.key, dir = S.sort.dir === 'desc' ? -1 : 1;
    out.sort(function (a, b) {
      if (k === 'dificultad') { var da = window.GD_ORDER[a.dificultad] || 99, db = window.GD_ORDER[b.dificultad] || 99; return (da - db) * dir; }
      if (k === 'n_plazas') { return ((a.n_plazas || 1) - (b.n_plazas || 1)) * dir; }
      var va = a[k] || '', vb = b[k] || '';
      return String(va).localeCompare(String(vb), 'es') * dir;
    });
    return out;
  }
  function chips() {
    var f = S.filters, c = [];
    if (S.quick && S.quick !== 'todas') {
      c.push({ g: 'quick', v: S.quick, t: S.quick === 'favoritas' ? '★ Favoritas' : S.quick === 'adjudicadas' ? '✓ Adjudicadas (mías)' : S.quick === 'bloqueadas' ? '✕ Bloqueadas' : '● Disponibles' });
    }
    f.profesiones.forEach(function (v) { c.push({ g: 'profesiones', v: v, t: v }); });
    f.instituciones.forEach(function (v) { c.push({ g: 'instituciones', v: v, t: v }); });
    f.dificultades.forEach(function (v) { c.push({ g: 'dificultades', v: v, t: v }); });
    f.regiones.forEach(function (v) { c.push({ g: 'regiones', v: v, t: '🏔 ' + v }); });
    if (f.provincia) c.push({ g: 'provincia', v: f.provincia, t: f.provincia });
    if (f.distrito) c.push({ g: 'distrito', v: f.distrito, t: f.distrito });
    f.categorias.forEach(function (v) { c.push({ g: 'categorias', v: v, t: 'Cat. ' + v }); });
    f.presupuestos.forEach(function (v) { c.push({ g: 'presupuestos', v: v, t: v }); });
    if (f.zaf) c.push({ g: 'zaf', v: f.zaf, t: 'ZAF: ' + f.zaf });
    if (f.ze) c.push({ g: 'ze', v: f.ze, t: 'ZE: ' + f.ze });
    if (f.geo) c.push({ g: 'geo', v: f.geo, t: f.geo === 'ubicada' ? 'Ubicadas' : 'Pendientes' });
    if (f.search) c.push({ g: 'search', v: f.search, t: '“' + f.search + '”' });
    return c;
  }
  function removeChip(g, v) {
    var f = S.filters;
    if (g === 'quick') { S.quick = 'todas'; }
    else if (g === 'provincia') { f.provincia = ''; f.distrito = ''; }
    else if (g === 'distrito') f.distrito = '';
    else if (g === 'zaf' || g === 'ze' || g === 'geo' || g === 'search') f[g] = '';
    else f[g] = f[g].filter(function (x) { return x !== v; });
  }
  return { bind: bind, blank: blank, distinct: distinct, baseExcept: baseExcept, applyAll: applyAll, chips: chips, removeChip: removeChip };
})();
