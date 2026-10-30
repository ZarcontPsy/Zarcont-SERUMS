/* SERUMS Map Explorer — panels: Results, Statistics, ImportWizard, GeocodingManager, Detail */
/* © 2026 ZARCONT — Todos los derechos reservados · Licencia: LICENSE (en esta carpeta y en la raíz del repositorio) */
'use strict';

/* ---------- Adjudicación: cruce del listado de adjudicados (XLSX) con las notas (PDF) ---------- */
window.Adj = (function () {
  var ESTADO = {
    ok: '',
    no_se_presento: 'No se presentó y/o no rindió evaluación',
    ficha_invalida: 'Ficha óptica inválida',
    sin_nota: 'Sin nota registrada en el PDF',
    ambigua: 'Registro ambiguo en el PDF (no se muestra ninguna nota)',
    sin_registro: 'Sin registro de nota en el PDF de resultados finales'
  };
  function nota(n) { return n == null ? '' : Number(n).toFixed(2).replace('.', ','); }
  function of(p) {
    var a = (p && p.adjudicados) || [];
    return a.slice().sort(function (x, y) {
      var nx = x[1] == null ? -1 : x[1], ny = y[1] == null ? -1 : y[1];
      return ny - nx;
    });
  }
  function texto(a) { return a[1] != null ? 'Nota ' + nota(a[1]) : (ESTADO[a[3]] || 'Sin nota registrada'); }
  function line(p) {
    var arr = of(p); if (!arr.length) return '';
    var a = arr[0];
    return '<div class="mini adjmini"><b>Adjudicación oficial:</b> ' + window.esc(a[0]) + ' · <b>' + window.esc(texto(a)) + '</b>' +
      (arr.length > 1 ? ' (+' + (arr.length - 1) + ' más)' : '') + '</div>';
  }
  function rows(p) {
    var arr = of(p);
    if (!arr.length) return '<div class="mini">Esta plaza no figura en el listado de adjudicados de la modalidad remunerada.</div>';
    return '<div class="adjlist">' + arr.map(function (a) {
      return '<div class="adjrow"><span class="who">' + window.esc(a[0]) + '</span>' +
        '<span class="adjnota' + (a[1] == null ? ' off' : '') + '">' + window.esc(texto(a)) + '</span>' +
        (a[2] ? '<span class="mini">Evaluación: ' + window.esc(a[2]) + '</span>' : '') + '</div>';
    }).join('') + '</div>';
  }
  function section(p) {
    var arr = of(p);
    return '<details class="acc" open><summary>Adjudicación oficial SERUMS 2026-I' +
      (arr.length ? ' · ' + arr.length + (arr.length > 1 ? ' adjudicados' : ' adjudicado') : '') +
      '</summary>' + rows(p) +
      '<div class="note">Cruce del <b>listado de adjudicados de la modalidad remunerada</b> con los ' +
      '<b>resultados finales de la evaluación</b> (MINSA): la persona se toma del listado y la nota del PDF, ' +
      'emparejando apellidos y nombres + profesión. Si el PDF no registra a la persona se indica expresamente; ' +
      'no se estima ni se inventa ninguna nota. Es independiente de tus marcas locales (★ favorita / ✅ adjudicada).</div></details>';
  }
  return { of: of, line: line, rows: rows, section: section, texto: texto };
})();

/* ---------- Results ---------- */
window.Results = (function () {
  var PAGE = 25;
  function difTag(d) {
    var c = window.DIFICULTAD_COLORS[d] || '#888';
    return '<span class="tag dif" style="background:' + c + '">' + window.esc(d || 'Sin información') + '</span>';
  }
  function card(p) {
    var S = window.App.S;
    var sel = S.selectedId === p.id ? ' sel' : '';
    var fav = window.App.isFav(p), cm = window.App.isCmp(p), adj = window.App.isAdj(p), bloq = window.App.isBloq(p);
    var info = window.App.adjInfo(p);
    return '<div class="resitem' + sel + (fav ? ' fav' : '') + (adj ? ' adj' : '') + (bloq ? ' blk' : '') + '" data-id="' + p.id + '">' +
      '<b class="t">' + window.esc(p.establecimiento) + '</b>' +
      '<div class="mini">' + window.esc(p.profesion) + ' · ' + window.esc(p.institucion) + ' · ' + (p.n_plazas || 1) + ' vac.</div>' +
      '<div class="mini">📍 ' + window.esc([p.distrito, p.provincia, p.departamento].filter(Boolean).join(' · ')) + '</div>' +
      window.Adj.line(p) +
      '<div class="tags">' + difTag(p.dificultad) +
      '<span class="tag">' + window.esc(p.categoria || '—') + '</span>' +
      (p.zaf === 'SI' ? '<span class="tag">ZAF</span>' : '') + (p.ze === 'SI' ? '<span class="tag">ZE</span>' : '') +
      (p.lat != null ? '<span class="tag ok">📍 ubicada</span>' : '<span class="tag warn">⏳ pendiente</span>') +
      (fav ? '<span class="tag favtag" title="Favorita (marca tuya)">★ Favorita</span>' : '') +
      (adj ? '<span class="tag adjtag" title="Adjudicada por ti' + (info && info.ts ? ' el ' + new Date(info.ts).toLocaleDateString('es-PE') : '') + (info && info.persona ? ' · ' + info.persona : '') + '">✅ Adjudicada por ti</span>' : '') +
      (bloq ? '<span class="tag bloqtag" title="Bloqueada: no puede ser seleccionada mientras siga bloqueada">🚫 Bloqueada</span>' : '') +
      '</div><div class="rowbtns" style="margin-top:8px">' +
      '<button class="btn sm" data-act="center" data-id="' + p.id + '" title="Centrar en el mapa">🎯</button>' +
      '<button class="btn sm' + (fav ? ' on' : '') + '" data-act="fav" data-id="' + p.id + '" title="' + (fav ? 'Quitar de favoritos' : 'Marcar como favorita') + '" aria-pressed="' + fav + '">★</button>' +
      '<button class="btn sm' + (adj ? ' on' : '') + '" data-act="adj" data-id="' + p.id + '" title="' + (adj ? 'Retirar la marca de adjudicación' : 'Marcar como adjudicada') + '" aria-pressed="' + adj + '">✅</button>' +
      '<button class="btn sm' + (cm ? ' on' : '') + '" data-act="cmp" data-id="' + p.id + '" title="Añadir al comparador">⚖</button>' +
      '<button class="btn sm" data-act="expand" data-id="' + p.id + '">▾ Detalle</button>' +
      '<button class="btn sm" data-act="detail" data-id="' + p.id + '">👁 Ficha</button></div>' +
      '<div class="more"><dl class="kv">' +
      kv('Código', window.esc(p.codigo)) +
      kv('Modalidad SERUMS', '<span class="mini">No disponible en el archivo</span>') +
      kv('Remuneración', '<span class="mini">No disponible en el archivo</span>') +
      kv('Vacantes', p.n_plazas || 1) +
      kv('Oferente', window.esc(p.oferente || '—')) +
      kv('Sede', window.esc(p.sede || '—')) +
      kv('Categoría', window.esc(p.categoria || '—')) +
      kv('Presupuesto', window.esc(p.presupuesto || '—')) +
      kv('Dirección (RENIPRESS)', window.esc(p.direccion || '—')) +
      kv('Coordenadas', p.lat != null ? p.lat.toFixed(6) + ', ' + p.lon.toFixed(6) : '—') +
      kv('Precisión', window.esc(p.geo_precision || 'Pendiente')) +
      kv('Método', window.esc(p.geo_metodo || '—')) +
      (p.geo_fuente ? kv('Fuente del punto', window.esc(p.geo_fuente)) : '') +
      '</dl><div class="adjblock"><b class="adjtitle">Adjudicación oficial SERUMS 2026-I</b>' + window.Adj.rows(p) + '</div></div></div>';
  }
  function kv(k, v) { return '<dt>' + k + '</dt><dd>' + v + '</dd>'; }
  function render() {
    var S = window.App.S, list = window.App.listForResults();
    var pages = Math.max(1, Math.ceil(list.length / PAGE));
    if (S.page > pages) S.page = pages;
    var slice = list.slice((S.page - 1) * PAGE, S.page * PAGE);
    document.getElementById('resultsList').innerHTML =
      slice.map(card).join('') || '<div class="empty">Sin resultados.<br><span class="mini">Ajusta o limpia los filtros.</span></div>';
    document.getElementById('pageInfo').textContent = 'Pág. ' + S.page + ' de ' + pages;
    var tot = window.App.filtered().length;
    document.getElementById('resCount').innerHTML = window.fmtNum(list.length) + ' resultados' +
      (list.length < tot ? ' <span class="mini">(ocultando sin coordenadas: ' + window.fmtNum(tot - list.length) + ')</span>' : '');
  }
  function detailHtml(p) {
    function r(k, v) { return '<dt>' + k + '</dt><dd>' + v + '</dd>'; }
    var fav = window.App.isFav(p), adj = window.App.isAdj(p), bloq = window.App.isBloq(p), info = window.App.adjInfo(p);
    return '<h3 style="margin:0 0 2px' + (adj ? ';text-decoration:line-through' : '') + '">' + window.esc(p.establecimiento) + '</h3>' +
      '<div class="mini">Código RENIPRESS <b>' + window.esc(p.codigo) + '</b> · ' + window.esc(p.categoria || '') + '</div>' +
      '<div class="stateline">' +
        '<button type="button" class="btn sm' + (fav ? ' on' : '') + '" data-det="fav" data-id="' + p.id + '" aria-pressed="' + fav + '">' + (fav ? '★ Favorita' : '☆ Marcar favorita') + '</button>' +
        '<button type="button" class="btn sm' + (adj ? ' on' : '') + '" data-det="adj" data-id="' + p.id + '" aria-pressed="' + adj + '">' + (adj ? '✅ Adjudicada por ti' : '✅ Marcar como adjudicada') + '</button>' +
        '<button type="button" class="btn sm' + (bloq ? ' on' : '') + '" data-det="bloq" data-id="' + p.id + '" aria-pressed="' + bloq + '" title="' + (bloq ? 'Desbloquear (pide confirmación)' : 'Bloquear: no podrá ser seleccionada') + '">' + (bloq ? '🚫 Desbloquear' : '🚫 Bloquear') + '</button>' +
        '<span class="mini" id="detailStateMsg">' + (adj && info && info.ts ? 'Marcada por ti el ' + new Date(info.ts).toLocaleString('es-PE') +
          (info.persona ? ' · ' + window.esc(info.persona) : '') : 'Sin tu marca de adjudicación') + '</span>' +
      '</div>' +
      '<div class="note" style="margin:0 0 10px">Tus marcas (★ favorita, ✅ adjudicada, 🚫 bloqueada) son locales y no modifican la adjudicación oficial del listado 2026-I, que aparece en la sección <b>Adjudicación oficial</b>.</div>' +
      '<details class="acc" open><summary>Identificación</summary><dl class="kv">' +
      r('Código de plaza', window.esc(p.codigo)) + r('Establecimiento', window.esc(p.establecimiento)) +
      r('Categoría', window.esc(p.categoria || '—')) + r('Oferente', window.esc(p.oferente || '—')) +
      '</dl></details>' +
      window.Adj.section(p) +
      '<details class="acc" open><summary>Ubicación</summary><dl class="kv">' +
      r('Región', window.esc(p.departamento)) + r('Provincia', window.esc(p.provincia)) + r('Distrito', window.esc(p.distrito)) +
      r('Dirección (RENIPRESS)', window.esc(p.direccion || '—')) +
      r('Coordenadas', p.lat != null ? p.lat.toFixed(6) + ', ' + p.lon.toFixed(6) : '—') +
      r('Precisión', window.esc(p.geo_precision || 'Pendiente')) + r('Método', window.esc(p.geo_metodo || '—')) +
      (p.geo_fuente ? r('Fuente del punto', window.esc(p.geo_fuente)) : '') +
      '</dl></details>' +
      '<details class="acc"><summary>Información profesional y de la plaza</summary><dl class="kv">' +
      r('Profesión', window.esc(p.profesion)) + r('Institución', window.esc(p.institucion)) + r('Sede', window.esc(p.sede || '—')) +
      r('Dificultad', window.esc(p.dificultad || 'Sin información')) + r('Vacantes', p.n_plazas || 1) +
      r('ZAF / ZE', window.esc(p.zaf) + ' / ' + window.esc(p.ze)) +
      '</dl></details>' +
      '<details class="acc"><summary>Datos económicos y adicionales</summary><dl class="kv">' +
      r('Presupuesto', window.esc(p.presupuesto || '—')) +
      r('Modalidad SERUMS', 'No disponible en el archivo') + r('Remuneración', 'No disponible en el archivo') +
      r('Ubigeo', window.esc(p.ubigeo || '—')) + r('DIRESA/GERESA', window.esc(p.diresa || '—')) +
      '</dl></details>' +
      '<div class="note">Los campos provienen del archivo y del cruce RENIPRESS; la ficha no añade información oficial que no exista en la fuente.</div>' +
      '<div class="rowbtns" style="margin-top:12px">' +
      (p.lat != null ? '<a class="btn sm" target="_blank" rel="noopener" href="' + window.mapsLink(p.lat, p.lon) + '">🗺 Abrir en Google Maps</a>' +
        '<a class="btn sm" target="_blank" rel="noopener" href="' + window.dirsLink(p.lat, p.lon) + '">🧭 Cómo llegar</a>' +
        '<button class="btn sm" data-copy="' + p.lat + ',' + p.lon + '">📋 Copiar coordenadas</button>' : '') +
      '<button class="btn sm" id="btnCorrect">✏ Revisar / corregir ubicación</button></div>' +
      '<div id="correctBox"></div>';
  }
  return { render: render, detailHtml: detailHtml, card: card, PAGE: PAGE };
})();

/* ---------- Statistics ---------- */
window.Stats = (function () {
  function bars(el, entries, total, color, onClick) {
    var max = Math.max.apply(null, [1].concat(entries.map(function (e) { return e.n; })));
    document.getElementById(el).innerHTML = entries.map(function (e) {
      var pc = total ? (e.n / total * 100) : 0;
      return '<div class="barrow" data-k="' + window.esc(e.v) + '" role="button" tabindex="0"><span>' + window.esc(e.v) + '</span>' +
        '<span class="bar"><i style="width:' + (e.n / max * 100).toFixed(1) + '%;' + (color ? 'background:' + color(e.v) : '') + '"></i></span>' +
        '<span class="v">' + window.fmtNum(e.n) + ' · ' + pc.toFixed(1) + '%</span></div>';
    }).join('') || '<div class="mini">Sin datos.</div>';
    Array.prototype.forEach.call(document.getElementById(el).querySelectorAll('.barrow'), function (b) {
      var k = b.getAttribute('data-k');
      b.onclick = function () { onClick(k); };
      b.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(k); } };
    });
  }
  function countBy(list, key) {
    var m = {};
    list.forEach(function (p) { var v = p[key] || 'Sin información'; m[v] = (m[v] || 0) + 1; });
    return Object.keys(m).map(function (v) { return { v: v, n: m[v] }; }).sort(function (a, b) { return b.n - a.n; });
  }
  function tbl(id, entries, total) {
    document.getElementById(id).innerHTML = '<tr><th>Categoría</th><th>Plazas</th><th>%</th></tr>' +
      entries.map(function (e) {
        return '<tr><td>' + window.esc(e.v) + '</td><td>' + window.fmtNum(e.n) + '</td><td>' + (total ? (e.n / total * 100).toFixed(1) + '%' : '—') + '</td></tr>';
      }).join('');
  }
  function donut(el, parts) {
    var total = parts.reduce(function (s, p) { return s + p.n; }, 0) || 1, a0 = 0, segs = '';
    parts.forEach(function (p) {
      var a1 = a0 + p.n / total * 360;
      segs += '<div style="display:flex;gap:8px;align-items:center;margin:5px 0;font-size:12.5px">' +
        '<span class="dot" style="background:' + p.c + '"></span>' + window.esc(p.t) +
        '<b style="margin-left:auto">' + window.fmtNum(p.n) + ' · ' + (p.n / total * 100).toFixed(1) + '%</b></div>';
      a0 = a1;
    });
    var g = '', off = 25;
    parts.forEach(function (p) {
      var frac = p.n / total;
      g += '<circle r="15.9" cx="18" cy="18" fill="none" stroke="' + p.c + '" stroke-width="5" ' +
        'stroke-dasharray="' + (frac * 100).toFixed(1) + ' 100" stroke-dashoffset="' + off.toFixed(1) + '"/>';
      off -= frac * 100;
    });
    document.getElementById(el).innerHTML = '<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">' +
      '<svg width="130" height="130" viewBox="0 0 36 36" role="img" aria-label="Distribución por calidad de geolocalización">' + g + '</svg>' +
      '<div style="flex:1;min-width:200px">' + segs + '</div></div>';
  }
  function render() {
    var list = window.App.filtered(), total = list.length || 1;
    var all = window.App.allPlazas();
    var vac = list.reduce(function (s, p) { return s + (p.n_plazas || 1); }, 0);
    var ubic = list.filter(function (p) { return p.lat != null; }).length;
    var est = new Set(list.map(function (p) { return p.establecimiento; })).size;
    document.getElementById('statsScope').innerHTML = 'Considerando <b>' + window.fmtNum(list.length) + '</b> de ' +
      window.fmtNum(all.length) + ' plazas' + (window.Filters.chips().length ? ' según los filtros activos.' : ' (sin filtros activos).') +
      ' <button class="btn sm" id="statsToMap">🗺 Ver en el mapa</button>';
    document.getElementById('statsCards').innerHTML =
      '<div class="stat hero"><b>' + window.fmtNum(list.length) + '</b><span>Plazas consideradas</span></div>' +
      '<div class="stat"><b>' + window.fmtNum(est) + '</b><span>Establecimientos</span></div>' +
      '<div class="stat"><b>' + window.fmtNum(vac) + '</b><span>Vacantes</span></div>' +
      '<div class="stat"><b>' + window.fmtNum(ubic) + '</b><span>Geolocalizadas (' + (ubic / total * 100).toFixed(1) + '%)</span></div>' +
      '<div class="stat"><b>' + window.fmtNum(list.length - ubic) + '</b><span>Pendientes</span></div>' +
      '<div class="stat"><b>' + window.fmtNum(list.filter(function (p) { return (p.adjudicados || []).some(function (a) { return a[1] != null; }); }).length) + '</b><span>Con nota de adjudicación</span></div>';
    document.getElementById('statsNote').innerHTML = 'Plazas ≠ vacantes ≠ establecimientos: una plaza puede ofertar varias vacantes y un establecimiento puede tener varias plazas de distintas profesiones. Los adjudicatarios y sus notas provienen del listado de adjudicados y del PDF de resultados finales (MINSA).';
    var btm = document.getElementById('statsToMap'); if (btm) btm.onclick = function () { window.App.go('map'); };
    var byReg = countBy(list, 'departamento'), byProf = countBy(list, 'profesion'),
        byInst = countBy(list, 'institucion'), byDif = countBy(list, 'dificultad'),
        byCat = countBy(list, 'categoria'), byPre = countBy(list, 'presupuesto');
    byDif.sort(function (a, b) { return (window.GD_ORDER[a.v] || 99) - (window.GD_ORDER[b.v] || 99); });
    bars('chartRegion', byReg.slice(0, 15), list.length, null, function (v) { window.App.toggleFilter('regiones', v); });
    bars('chartProf', byProf, list.length, null, function (v) { window.App.toggleFilter('profesiones', v); });
    bars('chartInst', byInst, list.length, window.institucionColor, function (v) { window.App.toggleFilter('instituciones', v); });
    bars('chartDif', byDif, list.length, function (v) { return window.DIFICULTAD_COLORS[v] || '#888'; }, function (v) { window.App.toggleFilter('dificultades', v); });
    donut('chartGeo', [
      { t: 'Exacta verificada (RENIPRESS)', n: list.filter(function (p) { return p.geo_precision === 'Exacta verificada'; }).length, c: '#0e9f5d' },
      { t: 'Geolocalización de establecimiento', n: list.filter(function (p) { return p.geo_precision === 'Geolocalización de establecimiento'; }).length, c: '#4b93e0' },
      { t: 'Aproximada', n: list.filter(function (p) { return p.geo_precision === 'Aproximada'; }).length, c: '#ef7d00' },
      { t: 'Pendiente', n: list.length - ubic, c: '#777B84' }
    ]);
    document.getElementById('chartCat').innerHTML = '<div class="mini">Categoría</div>' +
      byCat.map(function (e) { return '<div class="mini">• ' + window.esc(e.v) + ': <b>' + window.fmtNum(e.n) + '</b> (' + (e.n / total * 100).toFixed(1) + '%)</div>'; }).join('') +
      '<div class="mini" style="margin-top:8px">Presupuesto</div>' +
      byPre.map(function (e) { return '<div class="mini">• ' + window.esc(e.v) + ': <b>' + window.fmtNum(e.n) + '</b> (' + (e.n / total * 100).toFixed(1) + '%)</div>'; }).join('');
    tbl('tblRegion', byReg, list.length);
    tbl('tblProv', countBy(list, 'provincia').slice(0, 20), list.length);
  }
  return { render: render };
})();

/* ---------- Import wizard ---------- */
window.ImportWiz = (function () {
  var st = { step: 1, wb: null, fileName: '', sheets: [], sheet: '', aoa: [], headerRow: 0, headers: [], map: {}, rows: [], report: null, combine: false };
  function open() {
    st.step = 1;
    if (window.App && window.App.openBackdrop) window.App.openBackdrop('importModal', '#impClose');
    else document.getElementById('importModal').classList.add('open');
    draw();
  }
  function close() {
    if (window.App && window.App.closeBackdrop) window.App.closeBackdrop('importModal');
    else document.getElementById('importModal').classList.remove('open');
  }
  function draw() {
    document.querySelectorAll('#importModal .step').forEach(function (s) {
      s.classList.toggle('a', Number(s.getAttribute('data-s')) === st.step);
    });
    var b = document.getElementById('impBody');
    if (st.step === 1) {
      b.innerHTML = '<div class="drop" id="dz"><p><b>Arrastra tu Excel aquí</b></p>' +
        '<p class="mini">o</p><label class="btn primary">Elegir archivo<input type="file" id="impFile" accept=".xlsx,.xls,.csv" hidden></label>' +
        '<p class="mini" id="impMsg">' + window.esc(st.fileName ? 'Archivo: ' + st.fileName : 'Nada se envía a servidores: todo se procesa en tu navegador.') + '</p></div>' +
        (st.sheets.length ? '<div class="mini" style="margin-top:10px">Hojas detectadas:</div><div class="rowbtns">' + st.sheets.map(function (s) {
          return '<button class="btn sm' + (st.sheet === s ? ' on' : '') + '" data-sh="' + window.esc(s) + '">' + window.esc(s) + '</button>';
        }).join('') + '</div><label class="check mini"><input type="checkbox" id="impCombine" ' + (st.combine ? 'checked' : '') + '> Combinar hojas compatibles (misma estructura)</label>' : '');
      wireStep1();
    } else if (st.step === 2) {
      b.innerHTML = '<label class="mini">Fila de encabezados (detectada: ' + (st.headerRow + 1) + ', puntaje ' + st.headerScore + ') ' +
        '<input type="number" id="impHeader" min="1" max="15" value="' + (st.headerRow + 1) + '"></label>' +
        '<div class="mini">Corrige la correspondencia si la detección falla. Columna original → campo normalizado.</div>' +
        window.ExcelParser.FIELDS.map(function (f) {
          return '<div class="maprow"><span><b>' + f.label + '</b></span><select data-map="' + f.key + '"><option value="-1">— ausente —</option>' +
            st.headers.map(function (h, i) { return '<option value="' + i + '"' + (st.map[f.key] === i ? ' selected' : '') + '>' + window.esc(h || ('Col ' + (i + 1))) + '</option>'; }).join('') + '</select></div>';
        }).join('') +
        '<h3 style="margin-top:12px">Vista previa (12 registros)</h3><div style="overflow:auto"><table class="dt"><tr>' +
        ['Oferente', 'Profesión', 'Región', 'Provincia', 'Distrito', 'Dificultad', 'Código', 'Establecimiento'].map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr>' +
        st.rows.slice(0, 12).map(function (p) {
          return '<tr>' + ['oferente', 'profesion', 'departamento', 'provincia', 'distrito', 'dificultad', 'codigo', 'establecimiento'].map(function (k) { return '<td>' + window.esc(p[k]) + '</td>'; }).join('') + '</tr>';
        }).join('') + '</table></div>';
      wireStep2();
    } else if (st.step === 3) {
      var r = st.report;
      b.innerHTML = '<div class="statgrid"><div class="stat"><b>' + window.fmtNum(st.rows.length) + '</b><span>Procesados</span></div>' +
        '<div class="stat"><b>' + window.fmtNum(st.rows.length - r.incomplete.length) + '</b><span>Aceptados</span></div>' +
        '<div class="stat"><b>' + window.fmtNum(r.incomplete.length) + '</b><span>Incompletos</span></div>' +
        '<div class="stat"><b>' + window.fmtNum(r.dups.length) + '</b><span>Duplicados</span></div>' +
        '<div class="stat"><b>' + window.fmtNum(r.errors.length) + '</b><span>Con errores</span></div></div>' +
        (r.dups.length ? '<div class="mini" style="margin-top:10px"><b>Duplicados (código+profesión, se conservan):</b><br>' + r.dups.slice(0, 8).map(window.esc).join('<br>') + '</div>' : '') +
        (r.errors.length ? '<div class="mini" style="margin-top:10px"><b>Errores (muestra):</b><br>' + r.errors.slice(0, 8).map(function (e) { return 'Fila ' + (e.i + 1) + ': ' + window.esc(e.msg); }).join('<br>') + '</div>' : '') +
        '<div class="note">Los incompletos se marcan como <b>pendientes de geolocalización</b>; nada se elimina automáticamente.</div>';
    } else {
      b.innerHTML = '<div class="empty">✅ <b>Dataset cargado: ' + window.fmtNum(st.rows.length) + ' plazas.</b><br><span class="mini">Guardado en este navegador (IndexedDB). Puedes restaurar el oficial 2026-I cuando quieras.</span></div>' +
        '<div class="rowbtns"><button class="btn" id="btnRestore">↩ Restaurar dataset oficial 2026-I</button></div>';
      var rb = document.getElementById('btnRestore'); if (rb) rb.onclick = function () { window.App.restoreOfficial(); close(); };
    }
    document.getElementById('impBack').style.visibility = st.step === 1 ? 'hidden' : 'visible';
    document.getElementById('impNext').textContent = st.step === 3 ? '✓ Confirmar y cargar' : st.step === 4 ? 'Cerrar' : 'Continuar ›';
  }
  function handleFile(f) {
    if (!window.XLSX) { window.toast('Librería Excel no cargada: revisa tu conexión e inténtalo de nuevo.'); return; }
    var rd = new FileReader();
    rd.onload = function (e) {
      try {
        st.wb = window.XLSX.read(e.target.result, { type: 'array' });
        st.fileName = f.name; st.sheets = st.wb.SheetNames; st.sheet = st.sheets[0];
        prepareSheet(); st.step = 1; draw();
      } catch (err) { window.toast('No se pudo leer el archivo: ' + err.message); }
    };
    rd.readAsArrayBuffer(f);
  }
  function sheetToAoa(name) {
    var ws = st.wb.Sheets[name];
    return window.XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });
  }
  function prepareSheet() {
    var names = st.combine ? st.sheets : [st.sheet];
    var first = sheetToAoa(names[0]);
    var det = window.ExcelParser.detectHeaderRow(first);
    st.headerRow = det.row; st.headerScore = det.score;
    st.headers = (first[st.headerRow] || []).map(window.ExcelParser.cellStr);
    st.map = window.ExcelParser.autoMap(st.headers);
    var all = [];
    names.forEach(function (nm) {
      var aoa = nm === names[0] ? first : sheetToAoa(nm);
      if (nm !== names[0]) {
        var d2 = window.ExcelParser.detectHeaderRow(aoa);
        var h2 = (aoa[d2.row] || []).map(window.ExcelParser.cellStr);
        var same = h2.filter(function (h) { return st.headers.indexOf(h) >= 0; }).length;
        if (same < Math.max(3, st.headers.length * 0.5)) return; // incompatible
      }
      for (var r = st.headerRow + 1; r < aoa.length; r++) {
        if (!aoa[r] || !aoa[r].join('').trim()) continue;
        all.push(window.ExcelParser.normalizeRow(aoa[r], st.map, r + 1));
      }
    });
    st.rows = all;
    st.report = window.ExcelParser.validateRows(all);
  }
  function wireStep1() {
    var dz = document.getElementById('dz'), fi = document.getElementById('impFile');
    if (fi) fi.onchange = function () { if (fi.files[0]) handleFile(fi.files[0]); };
    if (dz) {
      ['dragover', 'dragenter'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('ov'); }); });
      ['dragleave', 'drop'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('ov'); }); });
      dz.addEventListener('drop', function (e) { if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });
    }
    Array.prototype.forEach.call(document.querySelectorAll('[data-sh]'), function (btn) {
      btn.onclick = function () { st.sheet = btn.getAttribute('data-sh'); prepareSheet(); draw(); };
    });
    var cb = document.getElementById('impCombine');
    if (cb) cb.onchange = function () { st.combine = cb.checked; prepareSheet(); draw(); };
  }
  function wireStep2() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-map]'), function (sel) {
      sel.onchange = function () {
        st.map[sel.getAttribute('data-map')] = Number(sel.value);
        var aoa = sheetToAoa(st.sheet);
        st.rows = [];
        for (var r = st.headerRow + 1; r < aoa.length; r++) {
          if (!aoa[r] || !aoa[r].join('').trim()) continue;
          st.rows.push(window.ExcelParser.normalizeRow(aoa[r], st.map, r + 1));
        }
        st.report = window.ExcelParser.validateRows(st.rows); draw();
      };
    });
    var h = document.getElementById('impHeader');
    if (h) h.onchange = function () {
      var aoa = sheetToAoa(st.sheet);
      st.headerRow = Math.max(0, Number(h.value) - 1);
      st.headers = (aoa[st.headerRow] || []).map(window.ExcelParser.cellStr);
      st.map = window.ExcelParser.autoMap(st.headers); prepareSheet(); draw();
    };
  }
  function next() {
    if (st.step === 1) {
      if (!st.wb) { window.toast('Primero selecciona un archivo.'); return; }
      prepareSheet(); st.step = 2; draw();
    } else if (st.step === 2) { st.step = 3; draw(); }
    else if (st.step === 3) { window.App.loadImported(st.rows, st.fileName, st.report); st.step = 4; draw(); }
    else close();
  }
  function back() { if (st.step > 1) { st.step--; draw(); } }
  return { open: open, close: close, next: next, back: back };
})();

/* ---------- Geocoding manager (subvista) ---------- */
window.GeoPanel = (function () {
  function render() {
    var all = window.App.allPlazas();
    var ex = all.filter(function (p) { return p.geo_precision === 'Exacta verificada'; }).length;
    var est = all.filter(function (p) { return p.geo_precision === 'Geolocalización de establecimiento'; }).length;
    var ap = all.filter(function (p) { return p.geo_precision === 'Aproximada'; }).length;
    var pe = all.filter(function (p) { return p.lat == null; }).length;
    var el = document.getElementById('geoReport'); if (!el) return;
    el.innerHTML =
      '<div class="stat hero"><b>' + window.fmtNum(all.length) + '</b><span>Registros totales</span></div>' +
      '<div class="stat"><b>' + window.fmtNum(ex) + '</b><span>Exactas verificadas</span></div>' +
      '<div class="stat"><b>' + window.fmtNum(est) + '</b><span>De establecimiento</span></div>' +
      '<div class="stat"><b>' + window.fmtNum(ap) + '</b><span>Aproximadas</span></div>' +
      '<div class="stat"><b>' + window.fmtNum(pe) + '</b><span>Pendientes</span></div>';
    var pend = all.filter(function (p) { return p.lat == null; }).slice(0, 60);
    document.getElementById('geoTable').innerHTML = '<tr><th>Establecimiento</th><th>Ubicación</th><th>Estado</th><th></th></tr>' +
      (pend.length ? pend.map(function (p) {
        return '<tr><td>' + window.esc(p.establecimiento) + ' (' + window.esc(p.codigo) + ')</td><td>' +
          window.esc([p.distrito, p.provincia, p.departamento].filter(Boolean).join(' · ')) + '</td><td>⏳ Pendiente</td>' +
          '<td><button class="btn sm" data-geo="' + p.id + '">Revisar</button></td></tr>';
      }).join('') : '<tr><td colspan="4" class="mini">No hay plazas pendientes de geolocalización.</td></tr>');
    Array.prototype.forEach.call(document.querySelectorAll('[data-geo]'), function (b) {
      b.onclick = function () { window.App.go('map'); window.App.selectPlaza(Number(b.getAttribute('data-geo')), { center: true, detail: true }); };
    });
  }
  function open() { window.App.go('geo'); }
  return { open: open, render: render };
})();

/* ---------- Copiar coordenadas (delegado) ---------- */
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-copy]'); if (!b) return;
  var v = b.getAttribute('data-copy');
  if (navigator.clipboard) navigator.clipboard.writeText(v).then(function () { window.toast('Coordenadas copiadas: ' + v); });
  else window.toast(v);
});
