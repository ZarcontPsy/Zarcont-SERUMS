/* SERUMS Map Explorer — services: store, excelParser, geocoding, export */
/* © 2026 ZARCONT — Todos los derechos reservados · Licencia: LICENSE (en esta carpeta y en la raíz del repositorio) */
'use strict';

/* ---------- Store: prefs + overrides + geocache (localStorage) + dataset (IndexedDB) ---------- */
window.Store = (function () {
  var LS = { get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
             set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  var idb = null;
  function openDb() {
    return new Promise(function (res) {
      try {
        var r = indexedDB.open('serumsdb', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
        r.onsuccess = function () { idb = r.result; res(true); };
        r.onerror = function () { res(false); };
      } catch (e) { res(false); }
    });
  }
  function idbSet(k, v) {
    return new Promise(function (res) {
      if (!idb) return res(false);
      try {
        var t = idb.transaction('kv', 'readwrite'), s = t.objectStore('kv');
        s.put({ k: k, v: v, at: Date.now() }); t.oncomplete = function () { res(true); }; t.onerror = function () { res(false); };
      } catch (e) { res(false); }
    });
  }
  function idbGet(k) {
    return new Promise(function (res) {
      if (!idb) return res(null);
      try {
        var t = idb.transaction('kv', 'readonly'), q = t.objectStore('kv').get(k);
        q.onsuccess = function () { res(q.result ? q.result.v : null); }; q.onerror = function () { res(null); };
      } catch (e) { res(null); }
    });
  }
  return {
    open: openDb, saveDataset: function (rows) { return idbSet('dataset', rows); }, loadDataset: function () { return idbGet('dataset'); },
    get: function (k, d) { return LS.get('serums_' + k, d); }, set: function (k, v) { LS.set('serums_' + k, v); }
  };
})();

/* ---------- excelParser ---------- */
window.ExcelParser = (function () {
  var FIELDS = [
    { key: 'oferente', label: 'Institución ofertante', aliases: ['institucion ofertante', 'oferente', 'institucionofertante'] },
    { key: 'profesion', label: 'Profesión', aliases: ['profesion', 'carrera', 'especialidad'] },
    { key: 'sede', label: 'Sede de adjudicación', aliases: ['sede de adjudicacion', 'sede adjudicacion', 'sede'] },
    { key: 'n_plazas', label: 'N° plazas', aliases: ['n plazas', 'n° plazas', 'num plazas', 'nro plazas', 'vacantes', 'nro de plazas'] },
    { key: 'diresa', label: 'DIRESA / GERESA / DIRIS', aliases: ['diresa', 'geresa', 'diris', 'diresa geresa diris'] },
    { key: 'institucion', label: 'Institución', aliases: ['institucion', 'entidad'] },
    { key: 'departamento', label: 'Departamento / región', aliases: ['departamento', 'region', 'dpto', 'depart'] },
    { key: 'provincia', label: 'Provincia', aliases: ['provincia'] },
    { key: 'distrito', label: 'Distrito', aliases: ['distrito'] },
    { key: 'dificultad', label: 'Grado de dificultad', aliases: ['grado de dificultad', 'dificultad', 'grado', 'gd'] },
    { key: 'codigo', label: 'Código RENIPRESS', aliases: ['codigo renipress', 'codigo', 'renipress', 'codigo unico', 'codigo ippress'] },
    { key: 'establecimiento', label: 'Nombre de establecimiento', aliases: ['nombre de establecimiento', 'establecimiento', 'nombre establecimiento', 'establecimiento de salud', 'nombre', 'eess'] },
    { key: 'categoria', label: 'Categoría', aliases: ['categoria'] },
    { key: 'presupuesto', label: 'Presupuesto', aliases: ['presupuesto'] },
    { key: 'zaf', label: 'ZAF', aliases: ['zaf'] },
    { key: 'ze', label: 'ZE', aliases: ['ze'] },
    { key: 'lat', label: 'Latitud (si existe)', aliases: ['lat', 'latitud', 'norte', 'coordenada y', 'y'] },
    { key: 'lon', label: 'Longitud (si existe)', aliases: ['lon', 'lng', 'longitud', 'este', 'coordenada x', 'x'] }
  ];
  function scoreRow(cells) {
    var s = 0;
    for (var i = 0; i < cells.length; i++) {
      var c = window.norm(cells[i]);
      if (!c) continue;
      for (var f = 0; f < FIELDS.length; f++) {
        var al = FIELDS[f].aliases;
        for (var a = 0; a < al.length; a++) { if (c === al[a] || c.indexOf(al[a]) === 0) { s += 2; break; } }
      }
    }
    return s;
  }
  function detectHeaderRow(aoa) {
    var best = 0, bestScore = -1;
    for (var r = 0; r < Math.min(15, aoa.length); r++) {
      var sc = scoreRow(aoa[r] || []);
      if (sc > bestScore) { bestScore = sc; best = r; }
    }
    return { row: best, score: bestScore };
  }
  function autoMap(headers) {
    var map = {};
    FIELDS.forEach(function (f) {
      var found = -1;
      for (var i = 0; i < headers.length; i++) {
        var h = window.norm(headers[i]);
        for (var a = 0; a < f.aliases.length; a++) {
          if (h === f.aliases[a] || h.indexOf(f.aliases[a]) !== -1 || f.aliases[a].indexOf(h) !== -1) { found = i; break; }
        }
        if (found !== -1) break;
      }
      map[f.key] = found;
    });
    return map;
  }
  function cellStr(v) { return String(v == null ? '' : v).replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(); }
  function normalizeRow(arr, map, rownum) {
    function g(k) { var i = map[k]; return i == null || i < 0 ? '' : cellStr(arr[i]); }
    var n = parseInt(g('n_plazas'), 10);
    var dif = g('dificultad').toUpperCase().replace(/[\s_]+/g, '-');
    if (/^G\.?D\.?\s*-?\s*([1-5])$/.test(dif)) dif = 'GD-' + dif.replace(/^G\.?D\.?\s*-?\s*/, '');
    if (/^[1-5]$/.test(dif)) dif = 'GD-' + dif;
    var lat = parseFloat(String(g('lat')).replace(',', '.')), lon = parseFloat(String(g('lon')).replace(',', '.'));
    return {
      oferente: g('oferente'), profesion: g('profesion').toUpperCase(), sede: g('sede') || 'SEDE CENTRAL',
      n_plazas: isFinite(n) && n > 0 ? n : 1, diresa: g('diresa'), institucion: g('institucion'),
      departamento: g('departamento').toUpperCase(), provincia: g('provincia').toUpperCase(), distrito: g('distrito').toUpperCase(),
      dificultad: dif, codigo: g('codigo').replace(/\D/g, '').padStart(8, '0').slice(-8) || g('codigo'),
      establecimiento: g('establecimiento'), categoria: g('categoria').toUpperCase(), presupuesto: g('presupuesto').toUpperCase(),
      zaf: g('zaf').toUpperCase().indexOf('SI') === 0 ? 'SI' : 'NO', ze: g('ze').toUpperCase().indexOf('SI') === 0 ? 'SI' : 'NO',
      lat: isFinite(lat) ? lat : null, lon: isFinite(lon) ? lon : null, _row: rownum
    };
  }
  function validateRows(rows) {
    var seen = {}, dups = [], incomplete = [], errors = [];
    rows.forEach(function (p, i) {
      var k = (p.codigo || '') + '|' + (p.profesion || '');
      seen[k] = (seen[k] || 0) + 1;
      if (!p.codigo || !p.establecimiento || !p.departamento) incomplete.push(i);
      if (p.dificultad && !window.GD_ORDER[p.dificultad]) errors.push({ i: i, msg: 'Grado inválido: ' + p.dificultad });
      if ((p.lat != null || p.lon != null) && !window.validCoords(p.lat, p.lon)) errors.push({ i: i, msg: 'Coordenadas fuera del Perú' });
    });
    Object.keys(seen).forEach(function (k) { if (seen[k] > 1) dups.push(k + ' ×' + seen[k]); });
    return { incomplete: incomplete, dups: dups, errors: errors };
  }
  return { FIELDS: FIELDS, detectHeaderRow: detectHeaderRow, autoMap: autoMap, normalizeRow: normalizeRow, validateRows: validateRows, cellStr: cellStr };
})();

/* ---------- geocoding ---------- */
window.Geocoder = (function () {
  function key() { return (window.App && window.App.apiKey()) || ''; }
  function cache() { return window.Store.get('geocache', {}); }
  function saveCache(c) { window.Store.set('geocache', c); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function query(p, level) {
    var e = p.establecimiento + ' ', d = p.distrito + ', ', pr = p.provincia + ', ', dep = p.departamento + ', Peru';
    if (level === 0) return e + d + pr + dep;
    if (level === 1) return d + pr + dep;
    return pr + dep;
  }
  async function request(addr, attempt) {
    var k = key();
    if (!k) throw new Error('Sin API key');
    var url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURIComponent(addr) + '&key=' + encodeURIComponent(k) + '&region=pe&language=es';
    var r = await fetch(url); var j = await r.json();
    if (j.status === 'OVER_QUERY_LIMIT' && (attempt || 0) < 4) { await sleep(1500 * ((attempt || 0) + 1)); return request(addr, (attempt || 0) + 1); }
    if (j.status !== 'OK' || !j.results.length) { var e = new Error(j.status || 'Sin resultados'); e.code = j.status; throw e; }
    return j.results[0];
  }
  function precisionOf(res, level) {
    var loc = res.geometry && res.geometry.location_type;
    if (level === 0 && (loc === 'ROOFTOP' || loc === 'RANGE_INTERPOLATED')) return { metodo: 'Geolocalización de establecimiento', precision: 'Geolocalización de establecimiento' };
    return { metodo: 'Centro de ' + (level === 1 ? 'distrito' : 'provincia') + ' (aprox.)', precision: 'Aproximada' };
  }
  async function geocodePlaza(p) {
    var c = cache(), ck = 'g:' + window.norm(p.establecimiento + '|' + p.distrito + '|' + p.provincia + '|' + p.departamento);
    if (c[ck]) return c[ck];
    var lastErr = null;
    for (var lv = 0; lv <= 2; lv++) {
      try {
        var res = await request(query(p, lv));
        var pr = precisionOf(res, lv);
        var out = { lat: res.geometry.location.lat, lon: res.geometry.location.lng, metodo: pr.metodo, precision: pr.precision, estado: 'ubicada', fecha: new Date().toISOString(), fuente: res.formatted_address };
        if (!window.validCoords(out.lat, out.lon)) throw new Error('Fuera del Perú');
        c[ck] = out; saveCache(c); await sleep(220); return out;
      } catch (e) { lastErr = e; if (e.code === 'REQUEST_DENIED') throw e; await sleep(250); }
    }
    throw lastErr || new Error('Sin resultados');
  }
  async function batch(list, onStep) {
    var ok = 0, fail = 0;
    for (var i = 0; i < list.length; i++) {
      if (window.App && window.App._geoStop) break;
      try { var g = await geocodePlaza(list[i]); window.App.applyGeocode(list[i].id, g); ok++; }
      catch (e) { fail++; if (e && e.code === 'REQUEST_DENIED') throw e; }
      if (onStep) onStep(i + 1, list.length, ok, fail);
    }
    return { ok: ok, fail: fail };
  }
  return { geocodePlaza: geocodePlaza, batch: batch, getCache: cache };
})();

/* ---------- export ---------- */
window.Exporter = (function () {
  var HEADERS = ['INSTITUCION OFERTANTE', 'PROFESION', 'SEDE DE ADJUDICACION', 'N° PLAZAS', 'DIRESA/GERESA/DIRIS', 'INSTITUCION', 'DEPARTAMENTO', 'PROVINCIA', 'DISTRITO', 'GRADO DE DIFICULTAD', 'CODIGO RENIPRESS', 'NOMBRE DE ESTABLECIMIENTO', 'CATEGORIA', 'PRESUPUESTO', 'ZAF', 'ZE', 'LATITUD', 'LONGITUD', 'PRECISION GEO', 'METODO GEO'];
  function rowOf(p) {
    return [p.oferente, p.profesion, p.sede, p.n_plazas, p.diresa, p.institucion, p.departamento, p.provincia, p.distrito, p.dificultad, p.codigo, p.establecimiento, p.categoria, p.presupuesto, p.zaf, p.ze,
      p.lat == null ? '' : p.lat, p.lon == null ? '' : p.lon, p.geo_precision || '', p.geo_metodo || ''];
  }
  function csv(rows, onlyCoords) {
    var H = onlyCoords ? ['CODIGO RENIPRESS', 'ESTABLECIMIENTO', 'DEPARTAMENTO', 'PROVINCIA', 'DISTRITO', 'LATITUD', 'LONGITUD', 'PRECISION'] : HEADERS;
    var lines = [H.join(';')];
    rows.forEach(function (p) {
      var r = onlyCoords ? [p.codigo, p.establecimiento, p.departamento, p.provincia, p.distrito, p.lat == null ? '' : p.lat, p.lon == null ? '' : p.lon, p.geo_precision || ''] : rowOf(p);
      lines.push(r.map(function (v) { v = String(v == null ? '' : v); return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(';'));
    });
    return '﻿' + lines.join('\r\n');
  }
  return {
    toCSV: function (rows) { return csv(rows, false); },
    toCoordsCSV: function (rows) { return csv(rows.filter(function (p) { return p.lat != null; }), true); },
    toXLSX: function (rows) {
      if (!window.XLSX) throw new Error('Librería Excel (SheetJS) no cargada: revisa tu conexión.');
      var data = [HEADERS].concat(rows.map(rowOf));
      var ws = window.XLSX.utils.aoa_to_sheet(data); var wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, 'Plazas SERUMS');
      return window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    }
  };
})();
