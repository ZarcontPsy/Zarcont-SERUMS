/* SERUMS Map Explorer — MapView (Google Maps) */
/* © 2026 ZARCONT — Todos los derechos reservados · Licencia: LICENSE (en esta carpeta y en la raíz del repositorio) */
'use strict';
window.MapView = (function () {
  var map = null, markers = [], cluster = null, info = null, ready = false, loadError = '';
  var PERU = { lat: -9.19, lng: -75.015 };
  var GEO_COLORS = { 'Exacta verificada': '#0e9f5d', 'Geolocalización de establecimiento': '#4b93e0', 'Aproximada': '#ef7d00', 'Pendiente': '#8a8f99' };

  function colorOf(p) {
    var mode = window.App.S.colorMode;
    if (mode === 'dificultad') return window.DIFICULTAD_COLORS[p.dificultad] || '#888';
    if (mode === 'geo') return GEO_COLORS[p.geo_precision] || '#888';
    return window.institucionColor(p.institucion);
  }
  function icon(p, selected) {
    var r = selected ? 13 : 9;
    var color = colorOf(p);
    var fav = window.App.isFav(p), adj = window.App.isAdj(p), bloq = window.App.isBloq(p);
    var pad = 5, w = (r + pad) * 2, c = r + pad;
    var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='" + w + "' height='" + w + "'>";
    if (fav) svg += "<circle cx='" + c + "' cy='" + c + "' r='" + (r + 2.6) + "' fill='none' stroke='#f5b301' stroke-width='2.6'/>";
    svg += "<circle cx='" + c + "' cy='" + c + "' r='" + r + "' fill='" + color + "' fill-opacity='" + (adj || bloq ? '0.35' : '1') +
      "' stroke='" + (selected ? '#111' : '#fff') + "' stroke-width='" + (selected ? 3 : 2.5) + "'/>";
    /* adjudicada por el usuario: atenuada con check · bloqueada: barrera horizontal */
    if (adj) {
      svg += "<path d='M " + (c - r * 0.45) + " " + c + " l " + (r * 0.33) + " " + (r * 0.38) + " l " + (r * 0.72) + " " + (-r * 0.72) +
        "' fill='none' stroke='#fff' stroke-width='" + Math.max(2, r * 0.3) + "' stroke-linecap='round' stroke-linejoin='round'/>";
    }
    if (bloq) {
      svg += "<path d='M " + (c - r * 0.55) + " " + c + " h " + (r * 1.1) +
        "' stroke='" + (selected ? '#111' : '#41454d') + "' stroke-width='" + Math.max(2.5, r * 0.36) + "' stroke-linecap='round'/>";
    }
    svg += "</svg>";
    return { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      anchor: (window.google && google.maps) ? new google.maps.Point(c, c) : undefined };
  }
  function showError(html) {
    var el = document.getElementById('mapError');
    if (!el) return;
    el.innerHTML = html; el.style.display = 'grid';
    var ab = document.getElementById('apiBadge'); if (ab) ab.textContent = 'Maps: error';
    if (window.App && window.App.notify) window.App.notify('Google Maps no se pudo cargar. Revisa la clave en Configuración (⚙) o 🔑.', 'err');
  }
  window.initSerumsMap = function () {
    try {
      map = new google.maps.Map(document.getElementById('map'), {
        center: PERU, zoom: 6, mapTypeId: 'roadmap',
        mapTypeControl: false, streetViewControl: false, fullscreenControl: true
      });
      info = new google.maps.InfoWindow();
      ready = true;
      var sel = document.getElementById('selMapType'); if (sel) map.setMapTypeId(sel.value);
      var ab = document.getElementById('apiBadge'); if (ab) ab.textContent = 'Maps: OK';
      window.App.onMapReady();
      setTimeout(function () { resize(); }, 350);
    } catch (e) { showError('<div style="max-width:520px"><b>No se pudo iniciar Google Maps.</b><br>' + window.esc(e.message) + '</div>'); }
  };
  function load(key) {
    if (window.google && window.google.maps && ready) { window.App.onMapReady(); return; }
    ready = false;
    var old = document.getElementById('gmapsScript'); if (old) old.remove();
    window._gmapsAuthFail = function () {
      showError('<div style="max-width:520px"><b>⚠ Google Maps no se pudo cargar.</b><br>' +
        'Causa probable: clave inválida, sin facturación o sin <b>Maps JavaScript API</b> habilitada.<br><br>' +
        '1) Ve a <b>Google Cloud Console → APIs y servicios → Biblioteca</b> y habilita <b>Maps JavaScript API</b> (y <b>Geocoding API</b> si geocodificas).<br>' +
        '2) En <b>Credenciales</b>, restringe la clave por <b>sitios web (HTTP referrers)</b> y por API.<br>' +
        '3) Abre <b>⚙ Configuración</b> o <b>🔑</b> e ingresa una clave válida.<br><br>' +
        'Los filtros, el listado, las estadísticas y la exportación siguen funcionando sin el mapa.</div>');
    };
    var s = document.createElement('script');
    s.id = 'gmapsScript';
    s.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(key) + '&callback=initSerumsMap&language=es&region=pe';
    s.async = true; s.defer = true;
    s.onerror = function () { window._gmapsAuthFail(); };
    window.gm_authFailure = window._gmapsAuthFail;
    document.head.appendChild(s);
    setTimeout(function () { if (!ready && document.getElementById('mapError') && !document.getElementById('mapError').innerHTML) window._gmapsAuthFail(); }, 15000);
  }
  function setMapType(v) { if (ready && map) { try { map.setMapTypeId(v); } catch (e) {} } }
  function resize() { if (ready && map) { try { google.maps.event.trigger(map, 'resize'); } catch (e) {} } }
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', function () { resize(); });
  }
  function clear() {
    if (cluster) { try { cluster.clearMarkers(); } catch (e) {} cluster = null; }
    markers.forEach(function (m) { m.setMap(null); }); markers = [];
  }
  function render(list) {
    if (!ready || !map) return;
    clear();
    var ubic = (list || []).filter(function (p) { return p.lat != null && window.validCoords(p.lat, p.lon); });
    var useCluster = document.getElementById('chkCluster').checked;
    var hasLib = !!(window.markerClusterer && window.markerClusterer.MarkerClusterer);
    var cap = (!useCluster || !hasLib) ? 2500 : ubic.length;
    if (ubic.length > cap) {
      window.toast('Hay ' + window.fmtNum(ubic.length) + ' plazas ubicadas: se muestran las primeras ' + window.fmtNum(cap) + '. Filtra o activa el clustering.');
    }
    var sel = window.App.S.selectedId;
    ubic.slice(0, cap).forEach(function (p) {
      var m = new google.maps.Marker({
        position: { lat: p.lat, lng: p.lon }, map: (!useCluster || !hasLib) ? map : null,
        title: p.establecimiento + ' · ' + p.profesion, icon: icon(p, p.id === sel)
      });
      m._pid = p.id;
      m.addListener('click', function () { window.App.selectPlaza(p.id, { center: false }); });
      markers.push(m);
    });
    if (useCluster && hasLib) {
      try {
        cluster = new window.markerClusterer.MarkerClusterer({ map: map, markers: markers });
      } catch (e) { markers.forEach(function (m) { m.setMap(map); }); }
    }
    if (document.getElementById('chkAutoFit').checked) fit(list);
    drawLegend();
  }
  function fit(list) {
    if (!ready || !map) return;
    var pts = (list || window.App.filtered()).filter(function (p) { return p.lat != null; });
    if (!pts.length) { map.setCenter(PERU); map.setZoom(6); return; }
    var b = new google.maps.LatLngBounds();
    pts.forEach(function (p) { b.extend({ lat: p.lat, lng: p.lon }); });
    map.fitBounds(b, 40);
  }
  function focus(p) {
    if (!ready || !map || p.lat == null) return;
    map.setCenter({ lat: p.lat, lng: p.lon }); map.setZoom(Math.max(map.getZoom() || 6, 13));
    markers.forEach(function (m) { var q = window.App.byId(m._pid); m.setIcon(icon(q, m._pid === p.id)); });
  }
  /* Actualiza solo los iconos (favoritos / adjudicadas) sin reconstruir los marcadores. */
  function updateIcons() {
    if (!ready || !map) return;
    var sel = window.App.S.selectedId;
    markers.forEach(function (m) {
      var p = window.App.byId(m._pid); if (!p) return;
      m.setIcon(icon(p, m._pid === sel));
    });
    drawLegend();
  }
  function drawLegend() {
    var el = document.getElementById('legend'); if (!el) return;
    var mode = window.App.S.colorMode, rows = '', title = 'institución';
    if (mode === 'dificultad') {
      title = 'dificultad';
      var present = {};
      window.App.filtered().forEach(function (p) { present[p.dificultad] = (present[p.dificultad] || 0) + 1; });
      ['GD-1', 'GD-2', 'GD-3', 'GD-4', 'GD-5'].forEach(function (g) {
        if (!present[g]) return;
        rows += '<div class="li"><span class="dot" style="background:' + window.DIFICULTAD_COLORS[g] + '"></span>' + g + ' (' + window.fmtNum(present[g]) + ')</div>';
      });
      if (present['Sin información']) rows += '<div class="li"><span class="dot" style="background:#888"></span>Sin información (' + window.fmtNum(present['Sin información']) + ')</div>';
    } else if (mode === 'geo') {
      title = 'geolocalización';
      var g = { 'Exacta verificada': 0, 'Geolocalización de establecimiento': 0, 'Aproximada': 0, 'Pendiente': 0 };
      window.App.allPlazas().forEach(function (p) { var k = p.lat == null ? 'Pendiente' : (p.geo_precision || 'Pendiente'); if (g[k] == null) g[k] = 0; g[k]++; });
      Object.keys(g).forEach(function (k) {
        if (!g[k]) return;
        rows += '<div class="li"><span class="dot" style="background:' + (GEO_COLORS[k] || '#888') + '"></span>' + window.esc(k) + ' (' + window.fmtNum(g[k]) + ')</div>';
      });
    } else {
      window.Filters.distinct(window.App.allPlazas(), 'institucion').slice(0, 8).forEach(function (o) {
        rows += '<div class="li"><span class="dot" style="background:' + window.institucionColor(o.v) + '"></span>' +
          window.esc(o.v.length > 26 ? o.v.slice(0, 25) + '…' : o.v) + ' (' + window.fmtNum(o.n) + ')</div>';
      });
    }
    /* marcas del usuario (independientes del atributo de color) */
    var nf = window.App.allPlazas().filter(function (p) { return window.App.isFav(p); }).length;
    var na = window.App.allPlazas().filter(function (p) { return window.App.isAdj(p); }).length;
    var nb = window.App.allPlazas().filter(function (p) { return window.App.isBloq(p); }).length;
    rows += '<div class="li" style="margin-top:7px;padding-top:6px;border-top:1px dashed var(--border)">' +
      '<span class="dot" style="background:transparent;border:2.5px solid #f5b301;box-sizing:border-box"></span>★ Favorita (' + window.fmtNum(nf) + ')</div>' +
      '<div class="li"><span class="dot" style="background:#8a8f99;opacity:.45"></span>✅ Adjudicada por ti (' + window.fmtNum(na) + ')</div>' +
      '<div class="li"><span class="dot" style="background:#8a8f99;opacity:.45"></span>🚫 Bloqueada por ti (' + window.fmtNum(nb) + ')</div>';
    el.innerHTML = '<b>Leyenda · ' + title + '</b>' + rows;
  }
  return { load: load, render: render, fit: fit, focus: focus, drawLegend: drawLegend, setMapType: setMapType, resize: resize,
    updateIcons: updateIcons, _icon: icon, _markers: function () { return markers.length; },
    isReady: function () { return ready; }, showError: showError };
})();
