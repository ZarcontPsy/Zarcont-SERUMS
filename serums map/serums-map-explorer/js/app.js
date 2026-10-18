/* SERUMS Map Explorer — app (estado, navegación, dataset, vistas, arranque)
   v2: navegación por rail, panel lateral con pestañas, tema claro/oscuro,
   favoritos, comparador, centro de notificaciones y subvistas. */
/* © 2026 ZARCONT — Todos los derechos reservados · Licencia: LICENSE (en esta carpeta y en la raíz del repositorio) */
'use strict';
window.App = (function () {
  var DEMO_KEY = 'AIzaSyC7lmgW183evYiAW-pFNai1DKDSPeYt-Gc';
  var SUB = { stats: 'subStats', datos: 'subDatos', geo: 'subGeo', favoritos: 'subFav', comparador: 'subCmp', config: 'subConfig', adjudicacion: 'subAdj' };
  var S = {
    plazas: [], filters: null, sort: { key: 'departamento', dir: 'asc' }, page: 1,
    selectedId: null, colorMode: 'institucion', view: 'map', sideTab: 'filters',
    source: 'oficial 2026-I', showNoCoord: true, theme: 'dark',
    quick: 'todas', stateTab: 'fav'
  };
  window.Filters.bind(S);
  S.filters = window.Filters.blank();
  var _filteredCache = null;

  /* ---------- helpers de datos ---------- */
  function apiKey() { return window.Store.get('gmaps_key', DEMO_KEY); }
  function allPlazas() { return S.plazas; }
  function byId(id) { return S.plazas[id]; }
  function filtered() {
    if (!_filteredCache) _filteredCache = window.Filters.applyAll();
    return _filteredCache;
  }
  function listForResults() {
    var l = filtered();
    return S.showNoCoord ? l : l.filter(function (p) { return p.lat != null; });
  }
  function favKey(p) { return (p.codigo || '') + '|' + (p.profesion || ''); }

  /* ---------- favoritos / comparador ---------- */
  function favs() { return window.Store.get('favoritos', []); }
  function isFav(p) { return favs().indexOf(favKey(p)) >= 0; }
  function toggleFav(p) {
    var a = favs(), k = favKey(p), i = a.indexOf(k);
    if (i >= 0) a.splice(i, 1); else a.push(k);
    window.Store.set('favoritos', a);
    notify(i >= 0 ? 'Quitado de favoritos: ' + p.establecimiento : 'Añadido a favoritos: ' + p.establecimiento, 'ok');
    window.toast(i >= 0 ? 'Quitada de favoritos' : '★ Añadida a favoritos', 4000,
      i >= 0 ? { label: 'Deshacer', fn: function () { toggleFav(p); } } : null);
    afterStateChange();
  }
  function cmp() { return window.Store.get('comparador', []); }
  function isCmp(p) { return cmp().indexOf(favKey(p)) >= 0; }
  function toggleCmp(p) {
    var a = cmp(), k = favKey(p), i = a.indexOf(k);
    if (i >= 0) a.splice(i, 1);
    else { if (a.length >= 6) { window.toast('Máximo 6 plazas en el comparador.'); return; } a.push(k); }
    window.Store.set('comparador', a); renderCmpBadge();
    if (S.view === 'comparador') renderComparador();
    notify(i >= 0 ? 'Quitado del comparador' : 'Añadido al comparador: ' + p.establecimiento, 'ok');
  }

  /* ---------- adjudicación manual (marca del usuario, independiente de favoritos) ----------
     Se guarda en localStorage (serums_adjudicadas) como { "<codigo>|<PROFESION>": {ts} }.
     Es una marca local del usuario y NO sustituye ni modifica la adjudicación oficial
     (window.SERUMS_ADJUDICADOS), que se muestra aparte en cada plaza. */
  function adjs() { var m = window.Store.get('adjudicadas', {}); return (m && typeof m === 'object') ? m : {}; }
  function isAdj(p) { return !!adjs()[favKey(p)]; }
  function adjInfo(p) { return adjs()[favKey(p)] || null; }
  function adjCount() { return Object.keys(adjs()).length; }
  function setAdj(p, on, meta) {
    var m = adjs(), k = favKey(p);
    if (on) {
      /* el estado se relee justo antes de grabar: evita adjudicar dos veces la
         misma plaza desde dos pestañas del mismo navegador */
      if (m[k]) { window.toast('Esta plaza ya está adjudicada por ti (estado sincronizado).'); afterStateChange(); return; }
      m[k] = { ts: (meta && meta.fecha) || Date.now(), etiqueta: 'marcada por el usuario' };
      if (meta && meta.persona) m[k].persona = meta.persona;
      if (meta && meta.obs) m[k].obs = meta.obs;
    } else {
      if (!m[k]) return;
      delete m[k];
    }
    window.Store.set('adjudicadas', m);
    afterStateChange();
    if (on) {
      notify('Plaza marcada como adjudicada por ti: ' + p.establecimiento, 'ok');
      window.toast('Marcada como adjudicada (marca tuya)', 6000, { label: 'Deshacer', fn: function () { setAdj(p, false); } });
    } else {
      notify('Marca de adjudicación retirada: ' + p.establecimiento);
      window.toast('Marca de adjudicación retirada.', 4000, { label: 'Rehacer', fn: function () { setAdj(p, true); } });
    }
  }
  function adjConfirmOn() { return window.Store.get('adj_confirm', true) !== false; }
  function setAdjConfirm(v) { window.Store.set('adj_confirm', !!v); }
  /* ---------- bloqueo de plaza (marca local; evita que pueda ser elegida) ---------- */
  function bloqs() { var m = window.Store.get('bloqueadas', {}); return (m && typeof m === 'object') ? m : {}; }
  function isBloq(p) { return !!bloqs()[favKey(p)]; }
  function bloqCount() { return Object.keys(bloqs()).length; }
  function setBloq(p, on) {
    var m = bloqs(), k = favKey(p);
    if (on) { if (m[k]) return; m[k] = { ts: Date.now() }; }
    else { if (!m[k]) return; delete m[k]; }
    window.Store.set('bloqueadas', m);
  }
  /* Confirmación breve antes de adjudicar (evita marcas accidentales). */
  function toggleAdj(p, ev) {
    if (isAdj(p)) {
      /* revertir una adjudicación siempre pide confirmación explícita */
      askConfirm({
        title: '¿Retirar la marca de adjudicación?',
        html: '<div class="mini"><b>' + window.esc(p.establecimiento) + '</b> · ' + window.esc(p.profesion) + '</div>' +
          '<div class="note">Se retirará tu marca y su registro (persona, fecha, observaciones). La plaza volverá a estar disponible. La adjudicación oficial del listado 2026-I no se altera.</div>',
        ok: 'Sí, retirar la adjudicación',
        onOk: function () { setAdj(p, false); }
      });
      return;
    }
    if (isBloq(p)) {
      askConfirm({
        title: 'La plaza está bloqueada',
        html: '<div class="mini"><b>' + window.esc(p.establecimiento) + '</b> está 🚫 bloqueada.</div>' +
          '<div class="note">Para adjudicarla se retirará primero el bloqueo, y quedará adjudicada. ¿Continuar?</div>',
        ok: 'Sí, desbloquear y adjudicar',
        remember: true,
        onOk: function () { setBloq(p, false); setAdj(p, true); }
      });
      return;
    }
    if (!adjConfirmOn()) { setAdj(p, true); return; }
    askConfirm({
      title: '¿Marcar como adjudicada?',
      html: '<div class="mini">Vas a marcar <b>' + window.esc(p.establecimiento) + '</b> · ' + window.esc(p.profesion) +
        '<br>Código RENIPRESS ' + window.esc(p.codigo) + '</div>' +
        '<div class="note">Es una marca tuya para tu seguimiento; no altera la adjudicación oficial del listado 2026-I.</div>',
      ok: 'Sí, marcar como adjudicada',
      remember: true,
      onOk: function () { setAdj(p, true); }
    });
  }
  /* Cambios de estado (favorito / adjudicada / bloqueada): refrescan tarjetas, contadores y marcadores. */
  function afterStateChange() {
    renderFavBadge(); renderQuick(); renderTallies(); renderChips();
    if (S.view === 'map' || S.view === 'results') { window.Results.render(); window.MapView.updateIcons(); }
    if (S.view === 'favoritos') renderFavoritos();
    if (S.view === 'adjudicacion' && window.AdjCenter) window.AdjCenter.render();
    if (window.AdjCenter) window.AdjCenter.badge();
    if (S.selectedId != null) refreshSelectionCard();
    refreshDetail();
  }
  /* ---------- confirmación breve reutilizable ---------- */
  var _confirmCb = null;
  function askConfirm(o) {
    o = o || {};
    _confirmCb = o.onOk || null;
    var body = document.getElementById('confirmBody');
    var id = 'cfr' + Date.now();
    body.innerHTML = (o.html || '') +
      (o.remember ? '<label class="check mini" style="margin-top:10px;display:inline-flex"><input type="checkbox" id="' + id + '"> No volver a pedir confirmación</label>' : '');
    document.getElementById('confirmTitle').textContent = o.title || 'Confirmar';
    document.getElementById('confirmOk').textContent = o.ok || 'Confirmar';
    var modal = document.getElementById('confirmModal');
    modal.classList.add('open');
    var chk = document.getElementById(id);
    if (chk) chk.onchange = function () { setAdjConfirm(!chk.checked); if (chk.checked) window.toast('No se volverá a pedir confirmación al adjudicar.'); };
    document.getElementById('confirmOk').focus();
  }
  function closeConfirm() { document.getElementById('confirmModal').classList.remove('open'); _confirmCb = null; }
  function acceptConfirm() {
    var cb = _confirmCb; closeConfirm();
    if (typeof cb === 'function') cb();
  }
  function plazasByKeys(keys) {
    var map = {};
    S.plazas.forEach(function (p) { map[favKey(p)] = p; });
    return keys.map(function (k) { return map[k] || null; });
  }
  function renderFavBadge() { document.getElementById('favBadge').textContent = favs().length; }
  function renderCmpBadge() { document.getElementById('cmpBadge').textContent = cmp().length; }

  /* ---------- notificaciones ---------- */
  function notify(msg, kind) {
    var a = window.Store.get('notifs', []);
    a.unshift({ msg: msg, kind: kind || 'info', at: new Date().toISOString() });
    window.Store.set('notifs', a.slice(0, 40)); renderNotifs();
  }
  function renderNotifs() {
    var a = window.Store.get('notifs', []);
    document.getElementById('notifBadge').textContent = a.length;
    document.getElementById('notifBody').innerHTML = a.length ? a.map(function (n) {
      return '<div class="notif ' + (n.kind === 'err' ? 'err' : n.kind === 'ok' ? 'ok' : '') + '">' +
        window.esc(n.msg) + '<br><time>' + new Date(n.at).toLocaleString('es-PE') + '</time></div>';
    }).join('') : '<div class="empty">Sin notificaciones.</div>';
  }

  /* ---------- tema ---------- */
  function applyTheme() {
    S.theme = window.Store.get('theme', 'dark');
    document.documentElement.setAttribute('data-theme', S.theme);
    var b = document.getElementById('btnTheme');
    if (b) { b.textContent = S.theme === 'dark' ? '☀' : '🌙'; b.title = S.theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'; }
  }
  function toggleTheme() {
    S.theme = S.theme === 'dark' ? 'light' : 'dark';
    window.Store.set('theme', S.theme); applyTheme();
    notify('Tema ' + (S.theme === 'dark' ? 'oscuro' : 'claro') + ' activado');
  }

  /* ---------- refresco ---------- */
  function refresh(rebuildOptions) {
    _filteredCache = null; S.page = 1;
    window.Results.render();
    if (rebuildOptions !== false) renderFilterOptions();
    renderChips(); renderGeoMini(); renderTallies(); renderQuick();
    window.MapView.render(filtered());
    if (S.view === 'stats') window.Stats.render();
    if (S.view === 'geo') window.GeoPanel.render();
    if (S.view === 'datos') renderDatos();
  }
  function renderTallies() {
    var list = filtered();
    var ubic = list.filter(function (p) { return p.lat != null; }).length;
    var vac = list.reduce(function (s, p) { return s + (p.n_plazas || 1); }, 0);
    var fav = list.filter(isFav).length;
    var adj = list.filter(isAdj).length;
    var blo = list.filter(isBloq).length;
    var disp = list.filter(function (p) { return !isAdj(p) && !isBloq(p); }).length;
    document.getElementById('recPill').innerHTML = '<b>' + window.fmtNum(list.length) + '</b> plazas';
    document.getElementById('geoPill').innerHTML = '<b>' + window.fmtNum(ubic) + '</b> ubicadas · ' + window.fmtNum(list.length - ubic) + ' pend.';
    document.getElementById('counterBar').innerHTML =
      '<span>🔎 <b>' + window.fmtNum(list.length) + '</b> plazas encontradas</span>' +
      '<span class="sep"></span><span>📍 <b>' + window.fmtNum(ubic) + '</b> ubicadas en el mapa</span>' +
      '<span class="sep"></span><span>⏳ <b>' + window.fmtNum(list.length - ubic) + '</b> pendientes de geolocalización</span>' +
      '<span class="sep"></span><span>💼 <b>' + window.fmtNum(vac) + '</b> vacantes</span>' +
      '<span class="sep"></span><span>★ <b>' + window.fmtNum(fav) + '</b> favoritas</span>' +
      '<span class="sep"></span><span>✅ <b>' + window.fmtNum(adj) + '</b> adjudicadas (mías)</span>' +
      '<span class="sep"></span><span>🚫 <b>' + window.fmtNum(blo) + '</b> bloqueadas</span>' +
      '<span class="sep"></span><span>🟢 <b>' + window.fmtNum(disp) + '</b> disponibles</span>';
  }
  /* ---------- filtros rápidos por estado (contadores en tiempo real) ---------- */
  function quickCounts() {
    var base = window.Filters.applyAll({ ignoreQuick: true });
    var fav = 0, adj = 0, blo = 0;
    base.forEach(function (p) { if (isFav(p)) fav++; if (isAdj(p)) adj++; if (isBloq(p)) blo++; });
    var disp = base.filter(function (p) { return !isAdj(p) && !isBloq(p); }).length;
    return { total: base.length, favoritas: fav, adjudicadas: adj, bloqueadas: blo, disponibles: disp };
  }
  function renderQuick() {
    var el = document.getElementById('quickSeg'); if (!el) return;
    var c = quickCounts();
    var opts = [
      { k: 'todas', t: 'Todas', n: c.total, h: 'Sin filtro de estado' },
      { k: 'favoritas', t: '★ Favoritas', n: c.favoritas, h: 'Plazas que marcaste con estrella' },
      { k: 'adjudicadas', t: '✅ Adjudicadas', n: c.adjudicadas, h: 'Plazas que marcaste como adjudicadas (marca tuya)' },
      { k: 'bloqueadas', t: '🚫 Bloqueadas', n: c.bloqueadas, h: 'Plazas que bloqueaste: no pueden seleccionarse' },
      { k: 'disponibles', t: '🟢 Disponibles', n: c.disponibles, h: 'Plazas sin tu marca de adjudicación y sin bloqueo' }
    ];
    el.innerHTML = opts.map(function (o) {
      return '<button type="button" class="qbtn' + (S.quick === o.k ? ' on' : '') + '" data-quick="' + o.k + '" title="' + window.esc(o.h) + '"' +
        ' aria-pressed="' + (S.quick === o.k) + '">' + window.esc(o.t) + ' <b>' + window.fmtNum(o.n) + '</b></button>';
    }).join('');
    Array.prototype.forEach.call(el.querySelectorAll('[data-quick]'), function (b) {
      b.onclick = function () { setQuick(b.getAttribute('data-quick')); };
    });
  }
  function setQuick(k) {
    S.quick = k || 'todas';
    refresh(false);
    if (S.quick !== 'todas') window.toast('Filtro rápido: ' + (S.quick === 'favoritas' ? 'solo favoritas' : S.quick === 'adjudicadas' ? 'solo adjudicadas (mías)' : 'solo disponibles') + '.');
  }

  /* ---------- dataset ---------- */
  function adjKeyOf(p) {
    var cod = String(p.codigo == null ? '' : p.codigo).trim();
    var prof = String(p.profesion == null ? '' : p.profesion)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toUpperCase().replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
    return cod + '|' + prof;
  }
  function adjOf(p) {
    var A = window.SERUMS_ADJUDICADOS || {};
    return A[adjKeyOf(p)] || [];
  }
  window.serumsAdj = adjOf;
  function geoPunto(codigo) {
    var gp = window.SERUMS_GEO_PUNTOS || {};
    return gp[String(codigo == null ? '' : codigo)] || null;
  }
  function applyGeoPunto(p) {
    var g = geoPunto(p.codigo);
    if (g && window.validCoords(g.lat, g.lon)) {
      p.lat = g.lat; p.lon = g.lon;
      p.geo_metodo = g.metodo || 'Punto verificado';
      p.geo_precision = g.precision || 'Geolocalización de establecimiento';
      p.geo_fuente = g.fuente || ''; p.geo_estado = 'ubicada';
      return true;
    }
    return false;
  }
  function adapt(arr) {
    return arr.map(function (r, i) {
      var lat = (typeof r[16] === 'number') ? r[16] : null;
      var lon = (typeof r[17] === 'number') ? r[17] : null;
      var ok = window.validCoords(lat, lon);
      var p = { id: i, oferente: r[0], profesion: r[1], sede: r[2], n_plazas: r[3] || 1, diresa: r[4],
        institucion: r[5], departamento: r[6], provincia: r[7], distrito: r[8], dificultad: r[9] || 'Sin información',
        codigo: r[10], establecimiento: r[11], categoria: r[12], presupuesto: r[13], zaf: r[14], ze: r[15],
        lat: ok ? lat : null, lon: ok ? lon : null,
        geo_precision: ok ? 'Exacta verificada' : 'Pendiente',
        geo_metodo: ok ? 'Cruce RENIPRESS verificado' : 'Pendiente',
        geo_fuente: '', geo_estado: ok ? 'ubicada' : 'pendiente',
        direccion: r[18] || '', ubigeo: r[19] || '' };
      if (!ok) applyGeoPunto(p);
      p.adjudicados = adjOf(p);
      return p;
    });
  }
  function applyOverrides() {
    var ov = window.Store.get('overrides', {});
    S.plazas.forEach(function (p) {
      var o = ov[p.codigo + '|' + p.profesion] || ov[String(p.id)];
      if (o && window.validCoords(o.lat, o.lon)) {
        p.lat = o.lat; p.lon = o.lon; p.geo_metodo = o.metodo || 'Corrección manual';
        p.geo_precision = o.precision || 'Geolocalización de establecimiento'; p.geo_estado = 'ubicada';
      }
    });
  }
  function setData(rows, source) {
    S.plazas = rows; S.source = source;
    S.filters = window.Filters.blank(); window.Filters.bind(S); S.selectedId = null; S.page = 1;
    applyOverrides();
    var ubic = rows.filter(function (p) { return p.lat != null; }).length;
    document.getElementById('datasetBadge').textContent =
      window.fmtNum(rows.length) + ' registros · ' + window.fmtNum(ubic) + ' con coordenadas · ' + source;
    refresh();
    renderDatos();
  }
  function loadOfficial() {
    if (!window.SERUMS_DATA || !window.SERUMS_DATA.length) {
      document.getElementById('datasetBadge').textContent = 'Sin datos: usa Importar';
      window.MapView.showError('<div><b>Sin dataset.</b><br>Usa 📥 Importar para cargar un Excel.</div>');
      return;
    }
    setData(adapt(window.SERUMS_DATA), 'oficial 2026-I');
  }
  function restoreOfficial() { loadOfficial(); window.toast('Dataset oficial 2026-I restaurado.'); notify('Dataset oficial 2026-I restaurado', 'ok'); }
  function renipressLookup() {
    var m = {};
    S.plazas.forEach(function (p) { if (p.lat != null && !m[p.codigo]) m[p.codigo] = { lat: p.lat, lon: p.lon }; });
    return m;
  }
  function loadImported(rows, fileName, report) {
    var look = renipressLookup(), ok = 0;
    var mapped = rows.map(function (r, i) {
      var p = { id: 0, oferente: r.oferente, profesion: (r.profesion || '').toUpperCase(), sede: r.sede || 'SEDE CENTRAL',
        n_plazas: r.n_plazas || 1, diresa: r.diresa, institucion: r.institucion, departamento: (r.departamento || '').toUpperCase(),
        provincia: (r.provincia || '').toUpperCase(), distrito: (r.distrito || '').toUpperCase(),
        dificultad: r.dificultad || 'Sin información', codigo: r.codigo, establecimiento: r.establecimiento,
        categoria: (r.categoria || '').toUpperCase(), presupuesto: (r.presupuesto || '').toUpperCase(), zaf: r.zaf || 'NO', ze: r.ze || 'NO',
        lat: null, lon: null, geo_precision: 'Pendiente', geo_metodo: 'Pendiente', geo_estado: 'pendiente', geo_fuente: '',
        direccion: '', ubigeo: '', _raw: r };
      if (window.validCoords(r.lat, r.lon)) { p.lat = r.lat; p.lon = r.lon; p.geo_precision = 'Exacta verificada'; p.geo_metodo = 'Coordenadas del archivo'; p.geo_estado = 'ubicada'; ok++; }
      else if (look[p.codigo]) { p.lat = look[p.codigo].lat; p.lon = look[p.codigo].lon; p.geo_precision = 'Exacta verificada'; p.geo_metodo = 'Cruce RENIPRESS verificado'; p.geo_estado = 'ubicada'; ok++; }
      else if (applyGeoPunto(p)) ok++;
      p.adjudicados = adjOf(p);
      return p;
    });
    mapped.forEach(function (p, i) { p.id = i; });
    setData(mapped, fileName || 'importado');
    window.Store.saveDataset(mapped);
    window.toast('Cargadas ' + window.fmtNum(mapped.length) + ' plazas · ' + window.fmtNum(ok) + ' ubicadas · ' +
      window.fmtNum(mapped.length - ok) + ' pendientes.');
    notify('Importadas ' + window.fmtNum(mapped.length) + ' plazas desde ' + (fileName || 'archivo') + ' · ' + window.fmtNum(ok) + ' ubicadas', 'ok');
  }
  function applyGeocode(id, g) {
    var p = byId(id); if (!p) return;
    p.lat = g.lat; p.lon = g.lon; p.geo_metodo = g.metodo; p.geo_precision = g.precision; p.geo_estado = 'ubicada';
    var ov = window.Store.get('overrides', {});
    ov[p.codigo + '|' + p.profesion] = { lat: g.lat, lon: g.lon, metodo: g.metodo, precision: g.precision, fecha: g.fecha };
    window.Store.set('overrides', ov);
    _filteredCache = null;
  }

  /* ---------- filtros UI ---------- */
  function checkList(elId, options, selected, group) {
    var el = document.getElementById(elId);
    el.innerHTML = options.map(function (o) {
      return '<label class="check"><input type="checkbox" data-g="' + group + '" value="' + window.esc(o.v) + '"' +
        (selected.indexOf(o.v) >= 0 ? ' checked' : '') + '><span>' + window.esc(o.v) + '</span><span class="n">' + window.fmtNum(o.n) + '</span></label>';
    }).join('') || '<div class="mini">Sin opciones.</div>';
    Array.prototype.forEach.call(el.querySelectorAll('input'), function (cb) {
      cb.onchange = function () {
        var f = S.filters, arr = f[group], v = cb.value;
        if (cb.checked && arr.indexOf(v) < 0) arr.push(v);
        if (!cb.checked) f[group] = arr.filter(function (x) { return x !== v; });
        onGeoChange(group); refresh(group !== 'regiones');
      };
    });
  }
  function onGeoChange(group) {
    var f = S.filters;
    if (group === 'regiones') {
      var provs = window.Filters.distinct(window.Filters.baseExcept('geo').filter(function (p) {
        return !f.regiones.length || f.regiones.indexOf(p.departamento) >= 0;
      }), 'provincia').map(function (o) { return o.v; });
      if (f.provincia && provs.indexOf(f.provincia) < 0) { f.provincia = ''; f.distrito = ''; }
    }
  }
  function renderFilterOptions() {
    var F = window.Filters, f = S.filters;
    checkList('fProfesion', F.distinct(F.baseExcept('prof'), 'profesion'), f.profesiones, 'profesiones');
    checkList('fInstitucion', F.distinct(F.baseExcept('inst'), 'institucion'), f.instituciones, 'instituciones');
    var difs = F.distinct(F.baseExcept('dif'), 'dificultad');
    difs.sort(function (a, b) { return (window.GD_ORDER[a.v] || 99) - (window.GD_ORDER[b.v] || 99); });
    checkList('fDificultad', difs, f.dificultades, 'dificultades');
    checkList('fRegion', F.distinct(F.baseExcept('geo'), 'departamento'), f.regiones, 'regiones');
    checkList('fCategoria', F.distinct(F.baseExcept('cat'), 'categoria'), f.categorias, 'categorias');
    checkList('fPresupuesto', F.distinct(F.baseExcept('pre'), 'presupuesto'), f.presupuestos, 'presupuestos');
    var base = F.baseExcept('geo').filter(function (p) { return !f.regiones.length || f.regiones.indexOf(p.departamento) >= 0; });
    var provs = F.distinct(base, 'provincia');
    var sp = document.getElementById('selProvincia'), curP = f.provincia;
    sp.innerHTML = '<option value="">Todas (' + provs.length + ')</option>' + provs.map(function (o) {
      return '<option' + (curP === o.v ? ' selected' : '') + '>' + window.esc(o.v) + ' (' + o.n + ')</option>';
    }).join('');
    var base2 = base.filter(function (p) { return !curP || p.provincia === curP; });
    var dists = F.distinct(base2, 'distrito');
    var sd = document.getElementById('selDistrito'), curD = f.distrito;
    sd.innerHTML = '<option value="">Todos (' + dists.length + ')</option>' + dists.slice(0, 600).map(function (o) {
      return '<option' + (curD === o.v ? ' selected' : '') + '>' + window.esc(o.v) + ' (' + o.n + ')</option>';
    }).join('');
  }
  function renderChips() {
    var el = document.getElementById('activeChips');
    var c = window.Filters.chips();
    document.getElementById('activeCount').textContent = c.length ? c.length + ' filtro(s) activo(s)' : 'Sin filtros activos';
    el.innerHTML = c.map(function (x, i) {
      return '<span class="chip">' + window.esc(x.t) + '<button type="button" data-c="' + i + '" aria-label="Quitar filtro">✕</button></span>';
    }).join('');
    Array.prototype.forEach.call(el.querySelectorAll('button'), function (b) {
      b.onclick = function () {
        var x = c[Number(b.getAttribute('data-c'))];
        window.Filters.removeChip(x.g, x.v);
        if (x.g === 'regiones' || x.g === 'provincia') {
          var f = S.filters;
          var okP = window.Filters.distinct(window.Filters.baseExcept('geo').filter(function (p) {
            return !f.regiones.length || f.regiones.indexOf(p.departamento) >= 0;
          }), 'provincia').map(function (o) { return o.v; });
          if (f.provincia && okP.indexOf(f.provincia) < 0) { f.provincia = ''; f.distrito = ''; }
        }
        syncControls(); refresh();
      };
    });
  }
  function renderGeoMini() {
    var list = filtered(), ubic = list.filter(function (p) { return p.lat != null; }).length;
    document.getElementById('geoMini').innerHTML =
      '✅ Exactas verificadas: <b>' + window.fmtNum(list.filter(function (p) { return p.geo_precision === 'Exacta verificada'; }).length) + '</b> · ' +
      '⏳ Pendientes: <b>' + window.fmtNum(list.length - ubic) + '</b>';
  }
  function syncControls() {
    var f = S.filters;
    document.getElementById('filterSearch').value = f.search;
    document.getElementById('fZaf').value = f.zaf; document.getElementById('fZe').value = f.ze;
    document.getElementById('fGeo').value = f.geo;
    document.getElementById('selProvincia').value = f.provincia; document.getElementById('selDistrito').value = f.distrito;
    document.getElementById('sortKey').value = S.sort.key;
    document.getElementById('sortDir').textContent = S.sort.dir === 'asc' ? '↑' : '↓';
    document.getElementById('selColorAttr').value = S.colorMode;
  }
  function toggleFilter(group, v) {
    var arr = S.filters[group], i = arr.indexOf(v);
    if (i < 0) arr.push(v); else arr.splice(i, 1);
    go('map', true); refresh(); syncControls();
  }

  /* ---------- selección y ficha ---------- */
  function estadoTags(p) {
    var t = '';
    if (isFav(p)) t += '<span class="tag favtag" title="Favorita (marca tuya, guardada en este navegador)">★ Favorita</span>';
    if (isAdj(p)) t += '<span class="tag adjtag" title="Adjudicada por ti (marca local)">✅ Adjudicada por ti</span>';
    if (isBloq(p)) t += '<span class="tag bloqtag" title="Bloqueada: no puede ser seleccionada mientras siga bloqueada">🚫 Bloqueada</span>';
    return t;
  }
  function renderSelectionCard(p) {
    var card = document.getElementById('selectedCard');
    card.innerHTML = '<div class="rowbtns" style="justify-content:flex-end"><button class="btn sm" id="selX" title="Cerrar">✕</button></div>' +
      '<h3 style="margin:0' + (isAdj(p) ? ';text-decoration:line-through' : '') + '">' + window.esc(p.establecimiento) + '</h3>' +
      '<div class="mini"><b>' + window.esc(p.codigo) + '</b> · ' + window.esc(p.profesion) + ' · ' + window.esc(p.institucion) + '</div>' +
      '<div class="mini">📍 ' + window.esc([p.distrito, p.provincia, p.departamento].filter(Boolean).join(' · ')) + '</div>' +
      window.Adj.line(p) +
      '<div class="tags"><span class="tag dif" style="background:' + (window.DIFICULTAD_COLORS[p.dificultad] || '#888') + '">' + window.esc(p.dificultad) + '</span>' +
      '<span class="tag">' + window.esc(p.categoria || '') + '</span>' +
      '<span class="tag ' + (p.lat != null ? 'ok' : 'warn') + '">' + window.esc(p.geo_precision || '') + '</span>' + estadoTags(p) + '</div>' +
      '<div class="rowbtns" style="margin-top:10px"><button class="btn sm primary" id="selDetail">👁 Ver ficha completa</button>' +
      '<button class="btn sm' + (isFav(p) ? ' on' : '') + '" id="selFav" title="Favorito">★</button>' +
      '<button class="btn sm' + (isAdj(p) ? ' on' : '') + '" id="selAdj" title="' + (isAdj(p) ? 'Retirar marca de adjudicación' : 'Marcar como adjudicada') + '">✅</button>' +
      '<a class="btn sm" target="_blank" rel="noopener" href="' + window.mapsLink(p.lat, p.lon) + '">🗺 Google Maps</a></div>';
    card.classList.add('open');
    card.classList.toggle('adjstate', isAdj(p));
    document.getElementById('selX').onclick = function () { card.classList.remove('open'); };
    document.getElementById('selDetail').onclick = function () { openDetail(p.id); };
    document.getElementById('selFav').onclick = function () { toggleFav(p); };
    document.getElementById('selAdj').onclick = function () { toggleAdj(p); };
  }
  function refreshSelectionCard() {
    var p = byId(S.selectedId);
    if (!p || p.lat == null) return;
    var card = document.getElementById('selectedCard');
    if (card && card.classList.contains('open')) renderSelectionCard(p);
  }
  function selectPlaza(id, opts) {
    opts = opts || {};
    S.selectedId = id;
    var p = byId(id); if (!p) return;
    window.Results.render();
    if (p.lat != null) {
      window.MapView.focus(p);
      renderSelectionCard(p);
    } else if (opts.detail) openDetail(id);
    else window.toast('Plaza pendiente de geolocalización: sin coordenadas.');
    if (opts.center && p.lat == null) openDetail(id);
  }
  function openDetail(id) {
    var p = byId(id); if (!p) return;
    document.getElementById('detailTitle').textContent = p.establecimiento;
    document.getElementById('detailBody').innerHTML = window.Results.detailHtml(p);
    document.getElementById('detailModal').classList.add('open');
    wireDetailButtons(p);
  }
  /* botones de estado dentro de la ficha (favorita / adjudicada / bloqueada) */
  function wireDetailButtons(p) {
    Array.prototype.forEach.call(document.querySelectorAll('#detailBody [data-det]'), function (b) {
      b.onclick = function () {
        var det = b.getAttribute('data-det');
        if (det === 'fav') toggleFav(p);
        else if (det === 'bloq') { if (window.AdjCenter) window.AdjCenter.toggleBloq(p); return; }
        else toggleAdj(p);
      };
    });
    var bc = document.getElementById('btnCorrect');
    if (bc) bc.onclick = function () { correctionForm(p); };
  }
  function refreshDetail() {
    var dm = document.getElementById('detailModal');
    if (!dm || !dm.classList.contains('open')) return;
    var p = byId(S.selectedId); if (!p) return;
    document.getElementById('detailBody').innerHTML = window.Results.detailHtml(p);
    wireDetailButtons(p);
  }
  function correctionForm(p) {
    var box = document.getElementById('correctBox');
    box.innerHTML = '<div class="note">Corrige la ubicación. Se guarda en este navegador y prevalece sobre el cruce automático.</div>' +
      '<div class="maprow"><span>Latitud</span><input type="number" step="any" id="cLat" value="' + (p.lat == null ? '' : p.lat) + '"></div>' +
      '<div class="maprow"><span>Longitud</span><input type="number" step="any" id="cLon" value="' + (p.lon == null ? '' : p.lon) + '"></div>' +
      '<div class="maprow"><span>Precisión</span><select id="cPrec"><option>Exacta verificada</option><option>Geolocalización de establecimiento</option><option>Aproximada</option><option>Pendiente</option></select></div>' +
      '<div class="rowbtns"><button class="btn sm primary" id="cSave">💾 Guardar</button></div>';
    document.getElementById('cPrec').value = p.geo_precision || 'Aproximada';
    document.getElementById('cSave').onclick = function () {
      var la = parseFloat(document.getElementById('cLat').value), lo = parseFloat(document.getElementById('cLon').value);
      if (!window.validCoords(la, lo)) { window.toast('Coordenadas inválidas para el Perú.'); return; }
      var prec = document.getElementById('cPrec').value;
      var ov = window.Store.get('overrides', {});
      ov[p.codigo + '|' + p.profesion] = { lat: la, lon: lo, metodo: 'Corrección manual', precision: prec, fecha: new Date().toISOString() };
      window.Store.set('overrides', ov);
      applyOverrides(); refresh(false);
      window.toast('Ubicación guardada.');
      notify('Ubicación corregida manualmente: ' + p.establecimiento, 'ok');
      document.getElementById('detailModal').classList.remove('open');
    };
  }

  /* ---------- vistas / navegación ---------- */
  function setSideTab(tab) {
    S.sideTab = tab;
    Array.prototype.forEach.call(document.querySelectorAll('#sideTabs [data-tab]'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-tab') === tab);
    });
    document.getElementById('sideFilters').style.display = tab === 'filters' ? 'block' : 'none';
    document.getElementById('sideResults').style.display = tab === 'results' ? 'block' : 'none';
    if (tab === 'filters') renderFilterOptions();
  }
  function setView(nav) {
    S.view = nav;
    Array.prototype.forEach.call(document.querySelectorAll('#rail [data-nav]'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-nav') === nav);
    });
    Object.keys(SUB).forEach(function (k) {
      document.getElementById(SUB[k]).classList.toggle('open', nav === k);
    });
    var onMap = (nav === 'map' || nav === 'results');
    document.getElementById('mapView').style.display = onMap ? 'block' : 'none';
    document.getElementById('counterBar').style.display = onMap ? 'flex' : 'none';
    if (onMap) { window.MapView.resize(); /* relee estados tuyos (favoritas/adjudicadas/bloqueadas) al volver */ if (window.MapView.isReady()) window.MapView.updateIcons(); }
    document.getElementById('work').classList.toggle('noside', !onMap);
    if (nav === 'map') setSideTab('filters');
    else if (nav === 'results') setSideTab('results');
    if (nav === 'stats') window.Stats.render();
    if (nav === 'datos') renderDatos();
    if (nav === 'geo') window.GeoPanel.render();
    if (nav === 'favoritos') renderFavoritos();
    if (nav === 'comparador') renderComparador();
    if (nav === 'adjudicacion' && window.AdjCenter) window.AdjCenter.render();
    if (nav === 'config') renderConfig();
    /* en móvil, cerramos la hoja lateral al cambiar de sección */
    if (window.innerWidth <= 920) document.getElementById('side').classList.remove('open');
  }
  function go(nav, keepSide) { setView(nav); if (!keepSide) window.scrollTo(0, 0); }

  /* ---------- export ---------- */
  function doExport(kind) {
    try {
      var list = filtered();
      var stamp = new Date().toISOString().slice(0, 10);
      if (kind === 'xlsx') {
        var buf = window.Exporter.toXLSX(list);
        window.download('serums_2026I_filtrado_' + stamp + '.xlsx', new Blob([buf], { type: 'application/octet-stream' }));
      } else if (kind === 'coords') {
        window.download('serums_2026I_coordenadas_' + stamp + '.csv', window.Exporter.toCoordsCSV(list), 'text/csv;charset=utf-8');
      } else {
        window.download('serums_2026I_filtrado_' + stamp + '.csv', window.Exporter.toCSV(list), 'text/csv;charset=utf-8');
      }
      var act = window.Filters.chips().map(function (c) { return c.t; }).join(', ') || 'sin filtros';
      document.getElementById('exportSummary').innerHTML =
        '<div class="statgrid"><div class="stat"><b>' + window.fmtNum(list.length) + '</b><span>Registros exportados</span></div>' +
        '<div class="stat"><b>' + window.fmtNum(list.filter(function (p) { return p.lat != null; }).length) + '</b><span>Con coordenadas</span></div></div>' +
        '<div class="mini" style="margin-top:10px"><b>Filtros aplicados:</b> ' + window.esc(act) + '<br><b>Orden:</b> ' + window.esc(S.sort.key + ' ' + S.sort.dir) +
        '<br><b>Fuente:</b> ' + window.esc(S.source) + ' · valores originales preservados.</div>';
      document.getElementById('exportModal').classList.add('open');
      notify('Exportación ' + kind.toUpperCase() + ': ' + window.fmtNum(list.length) + ' registros', 'ok');
    } catch (e) { window.toast('Exportación fallida: ' + e.message); notify('Exportación fallida: ' + e.message, 'err'); }
  }

  /* ---------- subvista: Datos importados ---------- */
  function renderDatos() {
    var el = document.getElementById('datosBody'); if (!el) return;
    var all = allPlazas(), ubic = all.filter(function (p) { return p.lat != null; }).length;
    var est = all.filter(function (p) { return p.establecimiento; });
    el.innerHTML =
      '<div class="statgrid">' +
      '<div class="stat hero"><b>' + window.fmtNum(all.length) + '</b><span>Registros</span></div>' +
      '<div class="stat"><b>' + window.fmtNum(ubic) + '</b><span>Con coordenadas</span></div>' +
      '<div class="stat"><b>' + window.fmtNum(all.length - ubic) + '</b><span>Pendientes</span></div>' +
      '<div class="stat"><b>' + window.fmtNum(new Set(est.map(function (p) { return p.establecimiento; })).size) + '</b><span>Establecimientos</span></div>' +
      '<div class="stat"><b>' + window.fmtNum(all.reduce(function (s, p) { return s + (p.n_plazas || 1); }, 0)) + '</b><span>Vacantes</span></div></div>' +
      '<div class="card"><h3>Conjunto activo</h3><div class="mini"><b>Fuente:</b> ' + window.esc(S.source) + '<br><b>Columnas normalizadas:</b> ' +
        window.ExcelParser.FIELDS.map(function (f) { return window.esc(f.label); }).join(' · ') + '</div>' +
        '<div class="note" style="margin-top:10px">El archivo oficial no incluye <b>modalidad SERUMS, tipo de plaza ni remuneración</b>. La aplicación no inventa esos valores.</div>' +
        '<div class="rowbtns" style="margin-top:12px"><button class="btn primary" id="btnDatosImport">📥 Importar Excel</button>' +
        '<button class="btn" id="btnDatosRestore">↩ Restaurar dataset oficial 2026-I</button>' +
        '<button class="btn" id="btnDatosPend">⬇ Exportar pendientes (CSV)</button></div></div>';
    document.getElementById('btnDatosImport').onclick = function () { window.ImportWiz.open(); };
    document.getElementById('btnDatosRestore').onclick = restoreOfficial;
    document.getElementById('btnDatosPend').onclick = exportPendientes;
  }
  function exportPendientes() {
    var pend = allPlazas().filter(function (p) { return p.lat == null; });
    var stamp = new Date().toISOString().slice(0, 10);
    window.download('serums_pendientes_geolocalizacion_' + stamp + '.csv', window.Exporter.toCSV(pend), 'text/csv;charset=utf-8');
    window.toast(window.fmtNum(pend.length) + ' pendientes exportados.');
    notify('Exportados ' + window.fmtNum(pend.length) + ' registros pendientes de geolocalización', 'ok');
  }

  /* ---------- subvista: Favoritos y adjudicadas ---------- */
  function stateKeys(which) {
    if (which === 'adj') return Object.keys(adjs());
    return favs();
  }
  function renderFavoritos() {
    var el = document.getElementById('favBody'), tabs = document.getElementById('favTabs');
    if (!el) return;
    var nFav = favs().length, nAdj = adjCount();
    if (tabs) {
      tabs.innerHTML =
        '<button type="button" class="ftab' + (S.stateTab === 'fav' ? ' on' : '') + '" data-stab="fav" role="tab" aria-selected="' + (S.stateTab === 'fav') + '">★ Favoritas <b>' + window.fmtNum(nFav) + '</b></button>' +
        '<button type="button" class="ftab' + (S.stateTab === 'adj' ? ' on' : '') + '" data-stab="adj" role="tab" aria-selected="' + (S.stateTab === 'adj') + '">✅ Adjudicadas (mías) <b>' + window.fmtNum(nAdj) + '</b></button>';
      Array.prototype.forEach.call(tabs.querySelectorAll('[data-stab]'), function (b) {
        b.onclick = function () { S.stateTab = b.getAttribute('data-stab'); renderFavoritos(); };
      });
    }
    var which = S.stateTab === 'adj' ? 'adj' : 'fav';
    var keys = stateKeys(which);
    var arr = plazasByKeys(keys);
    var vacio = which === 'adj'
      ? 'Sin plazas marcadas como adjudicadas.<br><span class="mini">Usa ✅ en las tarjetas o en el emergente del mapa para marcar una plaza como adjudicada.</span>'
      : 'Sin favoritos.<br><span class="mini">Usa ★ en las tarjetas de resultados para guardar plazas.</span>';
    el.innerHTML = arr.length ? arr.map(function (p) {
      if (!p) return '<div class="resitem"><div class="mini">Plaza no presente en el conjunto de datos actual.</div></div>';
      return window.Results.card(p);
    }).join('') : '<div class="empty">' + vacio + '</div>';
    var btn = document.getElementById('btnFavClear');
    if (btn) btn.textContent = which === 'adj' ? '🗑 Quitar todas las adjudicadas (' + window.fmtNum(nAdj) + ')' : '🗑 Vaciar favoritos (' + window.fmtNum(nFav) + ')';
  }
  function clearStateTab() {
    if (S.stateTab === 'adj') {
      window.Store.set('adjudicadas', {}); afterStateChange(); renderFavoritos();
      window.toast('Marcas de adjudicación eliminadas.'); notify('Marcas de adjudicación eliminadas');
    } else {
      window.Store.set('favoritos', []); afterStateChange(); renderFavoritos();
      window.toast('Favoritos vaciados.'); notify('Favoritos vaciados');
    }
  }
  function goStateMap() {
    var which = S.stateTab === 'adj' ? 'adjudicadas' : 'favoritas';
    var n = stateKeys(S.stateTab === 'adj' ? 'adj' : 'fav').length;
    if (!n) { window.toast('No hay plazas en esta pestaña todavía.'); return; }
    S.quick = which;
    go('map');
    refresh(false);
    window.toast(n + (S.stateTab === 'adj' ? ' plazas adjudicadas (mías)' : ' favoritas') + ' en el mapa. Usa 🎯 en cada tarjeta para centrar.');
  }

  /* ---------- subvista: Comparador ---------- */
  var CMP_FIELDS = [
    ['establecimiento', 'Establecimiento'], ['codigo', 'Código'], ['profesion', 'Profesión'],
    ['institucion', 'Institución'], ['oferente', 'Oferente'],
    ['departamento', 'Región'], ['provincia', 'Provincia'], ['distrito', 'Distrito'],
    ['dificultad', 'Dificultad'], ['categoria', 'Categoría'], ['presupuesto', 'Presupuesto'],
    ['n_plazas', 'Vacantes'], ['zaf', 'ZAF'], ['ze', 'ZE (VRAEM)'],
    ['geo_precision', 'Calidad de geolocalización']
  ];
  function renderComparador() {
    var el = document.getElementById('cmpBody'); if (!el) return;
    var arr = plazasByKeys(cmp()).filter(Boolean);
    if (!arr.length) { el.innerHTML = '<div class="empty">Sin plazas en el comparador.<br><span class="mini">Usa ⚖ en las tarjetas de resultados.</span></div>'; return; }
    var head = '<tr><th>Campo</th>' + arr.map(function (p) { return '<th>' + window.esc(p.establecimiento) + '</th>'; }).join('') + '</tr>';
    var rows = CMP_FIELDS.map(function (f) {
      return '<tr><th>' + f[1] + '</th>' + arr.map(function (p) {
        var v = p[f[0]];
        if (f[0] === 'n_plazas') v = window.fmtNum(v || 1);
        return '<td>' + window.esc(v == null || v === '' ? '—' : v) + '</td>';
      }).join('') + '</tr>';
    }).join('');
    var actions = '<tr><th>Acciones</th>' + arr.map(function (p) {
      return '<td><button class="btn sm" data-cmp-go="' + p.id + '">🎯 Mapa</button> ' +
        '<button class="btn sm" data-cmp-del="' + window.esc(favKey(p)) + '">✕</button></td>';
    }).join('') + '</tr>';
    el.innerHTML = '<div style="overflow:auto"><table class="cmp">' + head + rows + actions + '</table></div>';
    el.querySelectorAll('[data-cmp-go]').forEach(function (b) {
      b.onclick = function () { go('map'); selectPlaza(Number(b.getAttribute('data-cmp-go')), { center: true }); };
    });
    el.querySelectorAll('[data-cmp-del]').forEach(function (b) {
      b.onclick = function () {
        var a = cmp(), k = b.getAttribute('data-cmp-del');
        a = a.filter(function (x) { return x !== k; }); window.Store.set('comparador', a);
        renderCmpBadge(); renderComparador();
      };
    });
  }

  /* ---------- subvista: Configuración ---------- */
  function renderConfig() {
    var el = document.getElementById('cfgBody'); if (!el) return;
    el.innerHTML =
      '<div class="card"><h3>Clave de Google Maps</h3>' +
        '<div class="mini">Maps JavaScript API (mapa) y Geocoding API (geolocalización opcional). Se guarda solo en este navegador.</div>' +
        '<input type="text" id="cfgKeyInput" placeholder="AIza…" value="' + window.esc(apiKey() === DEMO_KEY ? '' : apiKey()) + '" style="margin-top:8px">' +
        '<div class="note">Clave de demostración incluida con cuota limitada. Crea la tuya en <b>Google Cloud Console → APIs y servicios</b>, habilita <b>Maps JavaScript API</b> y <b>Geocoding API</b>, y restringe por sitio web y por API.</div>' +
        '<div class="rowbtns" style="margin-top:12px"><button class="btn primary" id="cfgKeySave">Guardar y recargar mapa</button>' +
        '<button class="btn" id="cfgKeyDemo">Usar clave de demostración</button></div>' +
        '<div class="mini" id="cfgKeyMsg" style="margin-top:8px"></div></div>' +
      '<div class="card"><h3>Apariencia</h3><div class="rowbtns">' +
        '<button class="btn" id="cfgTheme">' + (S.theme === 'dark' ? '☀ Usar tema claro' : '🌙 Usar tema oscuro') + '</button></div></div>' +
      '<div class="card"><h3>Datos y almacenamiento local</h3><div class="mini">Favoritos, plazas adjudicadas (tus marcas), comparador, correcciones de ubicación y dataset importado se guardan en este navegador. No se sincronizan entre dispositivos.</div>' +
        '<label class="check mini" style="margin-top:10px;display:inline-flex"><input type="checkbox" id="cfgAdjConfirm"' + (adjConfirmOn() ? ' checked' : '') + '> Pedir confirmación antes de marcar una plaza como adjudicada</label>' +
        '<div class="rowbtns" style="margin-top:12px"><button class="btn" id="cfgResetFav">Vaciar favoritos (' + favs().length + ')</button>' +
        '<button class="btn" id="cfgResetAdj">Vaciar adjudicadas (' + adjCount() + ')</button>' +
        '<button class="btn" id="cfgResetCmp">Vaciar comparador (' + cmp().length + ')</button>' +
        '<button class="btn" id="cfgResetOv">Borrar correcciones de ubicación</button>' +
        '<button class="btn" id="cfgResetAll">Restablecer preferencias</button></div></div>' +
      '<div class="card"><h3>Acerca de</h3><div class="mini"><b>SERUMS Map Explorer</b> — exploración de plazas SERUMS del Perú.<br>' +
        'Datos oficiales 2026-I: ' + window.fmtNum(allPlazas().length) + ' plazas · coordenadas verificadas por cruce RENIPRESS (código de establecimiento).<br>' +
        'No se inventan coordenadas, remuneraciones ni atributos ausentes en el archivo.<br>' +
        '<b>© 2026 ZARCONT</b> — Todos los derechos reservados (licencia propietaria; ver LICENSE).</div></div>';
    document.getElementById('cfgKeySave').onclick = function () {
      var v = document.getElementById('cfgKeyInput').value.trim();
      if (!v) { window.toast('Ingresa una clave válida.'); return; }
      window.Store.set('gmaps_key', v);
      document.getElementById('cfgKeyMsg').textContent = 'Clave guardada. Recargando mapa…';
      var e = document.getElementById('mapError'); e.innerHTML = ''; e.style.display = 'none';
      window.MapView.load(v); notify('Clave de Google Maps actualizada', 'ok');
    };
    document.getElementById('cfgKeyDemo').onclick = function () {
      window.Store.set('gmaps_key', DEMO_KEY);
      document.getElementById('cfgKeyInput').value = '';
      document.getElementById('cfgKeyMsg').textContent = 'Usando clave de demostración.';
      var e = document.getElementById('mapError'); e.innerHTML = ''; e.style.display = 'none';
      window.MapView.load(DEMO_KEY);
    };
    document.getElementById('cfgTheme').onclick = function () { toggleTheme(); renderConfig(); };
    document.getElementById('cfgAdjConfirm').onchange = function (e) {
      setAdjConfirm(e.target.checked);
      window.toast(e.target.checked ? 'Se pedirá confirmación al adjudicar.' : 'No se pedirá confirmación al adjudicar.');
    };
    document.getElementById('cfgResetFav').onclick = function () { window.Store.set('favoritos', []); afterStateChange(); renderConfig(); window.toast('Favoritos vaciados.'); };
    document.getElementById('cfgResetAdj').onclick = function () { window.Store.set('adjudicadas', {}); afterStateChange(); renderConfig(); window.toast('Marcas de adjudicación eliminadas.'); };
    document.getElementById('cfgResetCmp').onclick = function () { window.Store.set('comparador', []); renderCmpBadge(); renderConfig(); window.toast('Comparador vaciado.'); };
    document.getElementById('cfgResetOv').onclick = function () { window.Store.set('overrides', {}); applyOverrides(); refresh(); window.toast('Correcciones borradas.'); };
    document.getElementById('cfgResetAll').onclick = function () {
      ['favoritos', 'adjudicadas', 'comparador', 'overrides', 'notifs', 'geocache'].forEach(function (k) { window.Store.set(k, undefined); });
      window.toast('Preferencias restablecidas.'); location.reload();
    };
  }

  /* ---------- conexión del mapa ---------- */
  function onMapReady() { window.MapView.render(filtered()); }
  function setMapStyle(v) { window.MapView.setMapType(v); }
  function mapFit() { window.MapView.fit(filtered()); }
  function mapPeru() { window.MapView.fit([]); }

  /* ---------- arranque ---------- */
  function init() {
    applyTheme();
    window.Store.open().then(function () { window.Store.loadDataset().then(function (saved) { if (saved && saved.length) setData(saved, 'guardado local'); }); });
    loadOfficial();
    renderFavBadge(); renderCmpBadge(); renderNotifs();

    /* navegación */
    Array.prototype.forEach.call(document.querySelectorAll('[data-nav]'), function (b) {
      b.onclick = function () { go(b.getAttribute('data-nav')); };
    });
    document.getElementById('brandHome').onclick = function () { go('map'); };
    Array.prototype.forEach.call(document.querySelectorAll('#sideTabs [data-tab]'), function (b) {
      b.onclick = function () { setSideTab(b.getAttribute('data-tab')); };
    });
    document.getElementById('btnSide').onclick = function () {
      var w = document.getElementById('work');
      w.classList.toggle('noside');
      this.textContent = w.classList.contains('noside') ? '⇤' : '⇥';
    };

    /* búsqueda y filtros */
    var deb = window.debounce(function () { S.filters.search = document.getElementById('filterSearch').value; refresh(false); }, 300);
    document.getElementById('filterSearch').addEventListener('input', deb);
    document.getElementById('selProvincia').onchange = function (e) { S.filters.provincia = e.target.value; S.filters.distrito = ''; refresh(); syncControls(); };
    document.getElementById('selDistrito').onchange = function (e) { S.filters.distrito = e.target.value; refresh(false); };
    document.getElementById('fZaf').onchange = function (e) { S.filters.zaf = e.target.value; refresh(false); };
    document.getElementById('fZe').onchange = function (e) { S.filters.ze = e.target.value; refresh(false); };
    document.getElementById('fGeo').onchange = function (e) { S.filters.geo = e.target.value; refresh(false); };
    document.getElementById('btnClear').onclick = function () { S.filters = window.Filters.blank(); window.Filters.bind(S); S.quick = 'todas'; syncControls(); refresh(); window.toast('Filtros limpios.'); };

    /* resultados */
    document.getElementById('sortKey').onchange = function (e) { S.sort.key = e.target.value; _filteredCache = null; window.Results.render(); };
    document.getElementById('sortDir').onclick = function () { S.sort.dir = S.sort.dir === 'asc' ? 'desc' : 'asc'; syncControls(); _filteredCache = null; window.Results.render(); };
    document.getElementById('btnPrev').onclick = function () { if (S.page > 1) { S.page--; window.Results.render(); } };
    document.getElementById('btnNext').onclick = function () { S.page++; window.Results.render(); };
    ['resultsList', 'favBody'].forEach(function (id) {
      document.getElementById(id).addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]'); if (!b) return;
        e.stopPropagation();
        var pid = Number(b.getAttribute('data-id')), p = byId(pid);
        var act = b.getAttribute('data-act');
        if (act === 'expand') { var it = b.closest('.resitem'); if (it) it.classList.toggle('exp'); return; }
        if (act === 'center') { selectPlaza(pid, { center: true }); return; }
        if (act === 'detail') { openDetail(pid); return; }
        if (act === 'fav' && p) { toggleFav(p); if (S.view !== 'favoritos') window.Results.render(); else renderFavoritos(); return; }
        if (act === 'adj' && p) { toggleAdj(p); return; }
        if (act === 'cmp' && p) { toggleCmp(p); if (S.view === 'map' || S.view === 'results') window.Results.render(); return; }
      });
    });
    document.getElementById('resultsList').addEventListener('click', function (e) {
      if (e.target.closest('[data-act]')) return;
      var item = e.target.closest('.resitem'); if (item) selectPlaza(Number(item.getAttribute('data-id')), { center: true });
    });

    /* controles del mapa */
    document.getElementById('selMapType').onchange = function (e) { setMapStyle(e.target.value); };
    document.getElementById('selColorAttr').onchange = function (e) { S.colorMode = e.target.value; window.MapView.render(filtered()); };
    document.getElementById('btnFit').onclick = mapFit;
    document.getElementById('btnPeru').onclick = mapPeru;
    document.getElementById('chkCluster').onchange = function () { window.MapView.render(filtered()); };
    document.getElementById('chkAutoFit').onchange = function () { window.MapView.render(filtered()); };
    document.getElementById('chkNoCoord').onchange = function (e) {
      S.showNoCoord = e.target.checked; window.Results.render();
      window.toast(S.showNoCoord ? 'Mostrando también plazas sin coordenadas.' : 'Ocultando plazas sin coordenadas del listado.');
    };

    /* exportación */
    var em = document.getElementById('exportMenu');
    document.getElementById('btnExport').onclick = function (e) { e.stopPropagation(); em.classList.toggle('open'); this.setAttribute('aria-expanded', em.classList.contains('open')); };
    document.addEventListener('click', function () { em.classList.remove('open'); });
    Array.prototype.forEach.call(em.querySelectorAll('[data-exp]'), function (b) { b.onclick = function () { doExport(b.getAttribute('data-exp')); }; });
    document.getElementById('exportClose').onclick = function () { document.getElementById('exportModal').classList.remove('open'); };

    /* importación */
    document.getElementById('btnImport').onclick = function () { window.ImportWiz.open(); };
    document.getElementById('impClose').onclick = window.ImportWiz.close;
    document.getElementById('impBack').onclick = window.ImportWiz.back;
    document.getElementById('impNext').onclick = window.ImportWiz.next;

    /* ficha y correcciones */
    document.getElementById('detailClose').onclick = function () { document.getElementById('detailModal').classList.remove('open'); };

    /* clave API */
    document.getElementById('btnKey').onclick = function () {
      document.getElementById('keyInput').value = apiKey() === DEMO_KEY ? '' : apiKey();
      document.getElementById('keyModal').classList.add('open');
    };
    document.getElementById('keyClose').onclick = function () { document.getElementById('keyModal').classList.remove('open'); };
    document.getElementById('keySave').onclick = function () {
      var v = document.getElementById('keyInput').value.trim();
      if (!v) { window.toast('Ingresa una clave válida.'); return; }
      window.Store.set('gmaps_key', v);
      document.getElementById('keyModal').classList.remove('open');
      var e = document.getElementById('mapError'); e.innerHTML = ''; e.style.display = 'none';
      window.MapView.load(v); window.toast('Clave guardada. Recargando mapa…');
      notify('Clave de Google Maps actualizada', 'ok');
    };

    /* tema y notificaciones */
    document.getElementById('btnTheme').onclick = toggleTheme;
    document.getElementById('btnNotif').onclick = function () { document.getElementById('notifDrawer').classList.toggle('open'); };
    document.getElementById('notifClose').onclick = function () { document.getElementById('notifDrawer').classList.remove('open'); };
    document.getElementById('notifClear').onclick = function () { window.Store.set('notifs', []); renderNotifs(); };

    /* geolocalización */
    document.getElementById('btnGeocodeBatch').onclick = async function () {
      var pend = allPlazas().filter(function (p) { return p.lat == null; }).slice(0, 60);
      if (!pend.length) { window.toast('No hay pendientes.'); return; }
      if (!apiKey()) { window.toast('Configura primero la API key (🔑).'); return; }
      window.App._geoStop = false;
      document.getElementById('geoLog').textContent = 'Geocodificando 0/' + pend.length + '… (con pausa anti-cuota)';
      notify('Iniciando geocodificación de ' + pend.length + ' plazas');
      try {
        var r = await window.Geocoder.batch(pend, function (i, n, ok2, fail) {
          document.getElementById('geoLog').textContent = 'Geocodificando ' + i + '/' + n + '… ✓' + ok2 + ' ✗' + fail;
        });
        window.Store.saveDataset(S.plazas);
        refresh(false); window.GeoPanel.render();
        document.getElementById('geoLog').textContent = 'Listo: ' + r.ok + ' ubicadas, ' + r.fail + ' siguen pendientes. Caché guardada.';
        notify('Geocodificación finalizada: ' + r.ok + ' ubicadas, ' + r.fail + ' pendientes', 'ok');
      } catch (e) {
        document.getElementById('geoLog').textContent = 'Error: ' + e.message + ' (¿Geocoding API habilitada y con facturación?)';
        notify('Error de geocodificación: ' + e.message, 'err');
      }
    };
    document.getElementById('btnGeoExport').onclick = exportPendientes;

    /* favoritos / adjudicadas / comparador */
    document.getElementById('btnFavClear').onclick = clearStateTab;
    document.getElementById('btnFavMap').onclick = goStateMap;
    document.getElementById('btnCmpClear').onclick = function () { window.Store.set('comparador', []); renderCmpBadge(); renderComparador(); };
    document.getElementById('btnCmpMap').onclick = function () { go('map'); window.toast('Selecciona una plaza del comparador para ubicarla.'); };

    /* confirmación breve (adjudicación) */
    document.getElementById('confirmOk').onclick = acceptConfirm;
    document.getElementById('confirmCancel').onclick = closeConfirm;
    document.getElementById('confirmModal').addEventListener('click', function (e) { if (e.target === this) closeConfirm(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeConfirm(); });

    /* cajones móvil */
    function drawer(id) { document.getElementById(id).classList.toggle('open'); }
    document.getElementById('fabF').onclick = function () { setSideTab('filters'); drawer('side'); };
    document.getElementById('fabR').onclick = function () { setSideTab('results'); drawer('side'); };

    /* mapa */
    window.MapView.load(apiKey());
    if (apiKey() === DEMO_KEY) {
      document.getElementById('apiBadge').textContent = 'Maps: clave demo';
      document.getElementById('apiBadge').title = 'Clave de demostración con usos limitados. Usa 🔑 para poner la tuya.';
    }
    setSideTab('filters');
    setView('map');
    syncControls();
    notify('Dataset ' + S.source + ' cargado: ' + window.fmtNum(allPlazas().length) + ' plazas');
  }

  return { S: S, init: init, apiKey: apiKey, allPlazas: allPlazas, byId: byId, filtered: filtered, listForResults: listForResults,
    refresh: refresh, toggleFilter: toggleFilter, selectPlaza: selectPlaza, onMapReady: onMapReady, openDetail: openDetail,
    loadImported: loadImported, restoreOfficial: restoreOfficial, applyGeocode: applyGeocode, go: go,
    notify: notify, isFav: isFav, toggleFav: toggleFav, isCmp: isCmp, toggleCmp: toggleCmp, favKey: favKey,
    isAdj: isAdj, toggleAdj: toggleAdj, setAdj: setAdj, adjInfo: adjInfo, adjCount: adjCount, adjs: adjs,
    isBloq: isBloq, setBloq: setBloq, bloqCount: bloqCount, stateChanged: afterStateChange, adjConfirmOn: adjConfirmOn, setAdjConfirm: setAdjConfirm, askConfirm: askConfirm, setQuick: setQuick,
    quickCounts: quickCounts, renderQuick: renderQuick, renderFavoritos: renderFavoritos, clearStateTab: clearStateTab,
    _geoStop: false, DEMO_KEY: DEMO_KEY };
})();
document.addEventListener('DOMContentLoaded', window.App.init);
