/* SERUMS Map Explorer — Centro de adjudicación
   Módulo de gestión del dock (sin mapa): KPIs, gráficos, listado filtrable,
   registro de adjudicaciones (persona / fecha / observaciones), bloqueos,
   historial y compartir estados (JSON). Reutiliza App (datos reales) y Store.
   Estados separados: ★ favorita · ✅ adjudicación propia · 🚫 bloqueo. */
/* © 2026 ZARCONT — Todos los derechos reservados · Licencia: LICENSE (en esta carpeta y en la raíz del repositorio) */
'use strict';
window.AdjCenter = (function () {
  var S = { filtro: 'todas', q: '', prof: '', sort: 'est', page: 1, selId: null };
  var PER = 50, wired = false;

  /* ---------- utilidades ---------- */
  function all() { return window.App.allPlazas(); }
  function keyOf(p) { return window.App.favKey(p); }
  function traer(k) { return window.Store.get(k, null); }

  /* índice clave -> plaza (se reconstruye si cambia el tamaño del dataset) */
  var _idx = null;
  function idx() {
    var a = all();
    if (_idx && _idx.n === a.length) return _idx.m;
    var m = {};
    a.forEach(function (p) { m[keyOf(p)] = p; });
    _idx = { n: a.length, m: m };
    return m;
  }

  /* ---------- bloqueos : store "bloqueadas" -> clave -> {ts} ---------- */
  function setBloq(p, on) { window.App.setBloq(p, on); }

  function toggleBloq(p) {
    if (!p) return;
    if (window.App.isBloq(p)) {
      window.App.askConfirm({
        title: '¿Desbloquear la plaza?',
        html: '<div class="mini"><b>' + window.esc(p.establecimiento) + '</b> · ' + window.esc(p.profesion) +
              '<br>Código RENIPRESS ' + window.esc(p.codigo) + '</div>' +
              '<div class="note">Al desbloquear, la plaza vuelve a estar disponible para seleccionarse.</div>',
        ok: 'Sí, desbloquear',
        onOk: function () {
          setBloq(p, false);
          window.App.stateChanged();
          window.toast('Plaza desbloqueada: vuelve a estar disponible.', 5000, { label: 'Deshacer', fn: function () { setBloq(p, true); window.App.stateChanged(); } });
          window.App.notify('Desbloqueada: ' + p.establecimiento);
        }
      });
      return;
    }
    if (window.App.isAdj(p)) {
      window.App.askConfirm({
        title: 'La plaza ya está adjudicada',
        html: '<div class="mini"><b>' + window.esc(p.establecimiento) + '</b> tiene tu marca de adjudicación.</div>' +
              '<div class="note">Bloquearla <b>revertirá la adjudicación</b> (se retira tu marca y su registro). ¿Continuar?</div>',
        ok: 'Sí, revertir y bloquear',
        onOk: function () {
          window.App.setAdj(p, false);
          setBloq(p, true);
          window.App.stateChanged();
          window.toast('Adjudicación revertida y plaza bloqueada 🚫.', 6000, { label: 'Deshacer', fn: function () { setBloq(p, false); window.App.setAdj(p, true); window.App.stateChanged(); } });
          window.App.notify('Revertida y bloqueada: ' + p.establecimiento);
        }
      });
      return;
    }
    setBloq(p, true);
    window.App.stateChanged();
    window.toast('🚫 Plaza bloqueada: no puede ser seleccionada mientras siga bloqueada.', 6000, { label: 'Deshacer', fn: function () { setBloq(p, false); window.App.stateChanged(); } });
    window.App.notify('Bloqueada: ' + p.establecimiento);
  }

  /* ---------- conteos (sobre todo el conjunto activo) ---------- */
  function counts() {
    var a = 0, b = 0, f = 0, d = 0, vac = 0, est = {};
    all().forEach(function (p) {
      var adj = window.App.isAdj(p), blo = window.App.isBloq(p);
      if (adj) a++;
      if (blo) b++;
      if (window.App.isFav(p)) f++;
      if (!adj && !blo) d++;
      vac += p.n_plazas || 1;
      est[p.establecimiento] = 1;
    });
    return { total: all().length, disponibles: d, adjudicadas: a, bloqueadas: b, favoritas: f, vacantes: vac, est: Object.keys(est).length };
  }

  /* ---------- dashboard: KPIs ---------- */
  function renderKpis() {
    var el = document.getElementById('adjKpis'); if (!el) return;
    var c = counts();
    el.innerHTML =
      stat(c.total, 'Total de plazas', true) +
      stat(c.disponibles, 'Disponibles', 'disp') +
      stat(c.adjudicadas, 'Adjudicadas', 'adj') +
      stat(c.bloqueadas, 'Bloqueadas', 'bloq') +
      stat(c.favoritas, 'Favoritas', 'fav');
  }
  function stat(n, t, cls) {
    return '<div class="stat' + (cls === true ? ' hero' : '') + (cls && cls !== true ? ' st' + cls : '') + '"><b>' + window.fmtNum(n) + '</b><span>' + t + '</span></div>';
  }

  /* ---------- gráficos (dona de estados + barras por profesión) ---------- */
  function renderCharts() {
    var el = document.getElementById('adjDonut'); if (!el) return;
    var c = counts();
    var parts = [
      { t: 'Disponibles', n: c.disponibles, c: '#0e9f5d' },
      { t: 'Adjudicadas', n: c.adjudicadas, c: '#df2531' },
      { t: 'Bloqueadas', n: c.bloqueadas, c: '#41454d' }
    ].filter(function (x) { return x.n > 0; });
    donut(el, parts);
    var nota = document.getElementById('adjDonutNote');
    if (nota && window.SERUMS_ADJUDICADOS_META) {
      var M = window.SERUMS_ADJUDICADOS_META;
      nota.innerHTML = '★ Favoritas no excluyen la disponibilidad; disponible = sin tu adjudicación y sin bloqueo. ' +
        '<b>Adjudicación oficial 2026-I:</b> ' + window.fmtNum(M.total_adjudicados) + ' vacantes · ' +
        window.fmtNum(M.con_nota) + ' con nota publicada (se muestra en cada plaza).';
    }
    /* barras por profesión (adjudicadas propias) */
    var el2 = document.getElementById('adjBars');
    if (!el2) return;
    var m = {}, total = 0;
    all().forEach(function (p) {
      if (!window.App.isAdj(p)) return;
      var v = p.profesion || 'Sin información';
      m[v] = (m[v] || 0) + 1; total++;
    });
    var entries = Object.keys(m).map(function (k) { return { v: k, n: m[k] }; }).sort(function (x, y) { return y.n - x.n; }).slice(0, 8);
    el2.innerHTML = entries.length ? entries.map(function (e) {
      var pc = total ? (e.n / total * 100) : 0;
      return '<div class="barrow"><span>' + window.esc(e.v) + '</span>' +
        '<span class="bar"><i style="width:' + Math.max(1.5, e.n / Math.max.apply(null, entries.map(function (x) { return x.n; })) * 100).toFixed(1) + '%"></i></span>' +
        '<span class="v">' + window.fmtNum(e.n) + ' · ' + pc.toFixed(0) + '%</span></div>';
    }).join('')
      : '<div class="mini">Todavía no has adjudicado ninguna plaza. Usa el formulario de abajo o el botón ✅ de las tarjetas.</div>';
  }
  function donut(el, parts) {
    var total = parts.reduce(function (s, p) { return s + p.n; }, 0) || 1, g = '', off = 25, segs = '';
    parts.forEach(function (p) {
      var frac = p.n / total;
      g += '<circle r="15.9" cx="18" cy="18" fill="none" stroke="' + p.c + '" stroke-width="5" stroke-dasharray="' +
        (frac * 100).toFixed(1) + ' 100" stroke-dashoffset="' + off.toFixed(1) + '"/>';
      off -= frac * 100;
      segs += '<div style="display:flex;gap:8px;align-items:center;margin:4px 0;font-size:12.5px">' +
        '<span class="dot" style="background:' + p.c + '"></span>' + window.esc(p.t) +
        '<b style="margin-left:auto">' + window.fmtNum(p.n) + ' · ' + (frac * 100 < 0.05 ? '&lt;0,1%' : (frac * 100).toFixed(1)) + '%</b></div>';
    });
    el.innerHTML = '<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">' +
      '<svg width="120" height="120" viewBox="0 0 36 36">' + g + '</svg><div style="flex:1;min-width:180px">' + segs + '</div></div>';
  }

  /* fecha/hora local para input datetime-local */
  function localDT(ts) {
    var d = new Date(ts || Date.now());
    d.setSeconds(0, 0);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
  function fmtDT(ts) {
    if (!ts) return '—';
    var d = new Date(ts);
    return d.toLocaleDateString('es-PE') + ' ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  /* ---------- buscador con autocompletado ---------- */
  function sugerencias(txt) {
    var t = window.norm(txt), u = String(txt || '').trim();
    if (t.length < 2) return [];
    var out = [];
    for (var i = 0; i < all().length && out.length < 40; i++) {
      var p = all()[i];
      var e = window.norm(p.establecimiento), pr = window.norm(p.profesion);
      var sc = null;
      if (e.indexOf(t) === 0) sc = 0;
      else if (e.indexOf(t) > 0) sc = 2;
      else if (pr.indexOf(t) === 0) sc = 3;
      else if (/^\d{1,8}$/.test(u) && String(p.codigo || '').indexOf(u) === 0) sc = 0.5;
      else if (window.norm(p.distrito).indexOf(t) === 0) sc = 4;
      if (sc != null) out.push({ p: p, sc: sc });
    }
    out.sort(function (a, b) { return a.sc - b.sc || String(a.p.establecimiento).localeCompare(String(b.p.establecimiento)); });
    var seen = {}, fin = [];
    out.forEach(function (o) {
      var k = o.p.establecimiento + '|' + o.p.profesion;
      if (seen[k]) return; seen[k] = 1; fin.push(o.p);
    });
    return fin.slice(0, 8);
  }

  function muestraSugerencias(r, arr) {
    if (!r) return;
    if (!arr.length) { r.classList.remove('open'); r.innerHTML = ''; return; }
    r.innerHTML = arr.map(function (p) {
      var est = window.App.isAdj(p) ? ' · ✅ adjudicada' : window.App.isBloq(p) ? ' · 🚫 bloqueada' : '';
      return '<button type="button" data-sug="' + p.id + '">' +
        '<b>' + window.esc(p.establecimiento) + '</b>' +
        '<span class="mini">' + window.esc(p.profesion) + ' · ' + window.esc([p.distrito, p.departamento].filter(Boolean).join(', ')) +
        ' · código ' + window.esc(p.codigo) + est + '</span></button>';
    }).join('');
    r.classList.add('open');
    Array.prototype.forEach.call(r.querySelectorAll('[data-sug]'), function (b) {
      b.onclick = function () { elegirPlaza(window.App.byId(Number(b.getAttribute('data-sug')))); };
    });
  }

  function elegirPlaza(p) {
    if (!p) { window.toast('Plaza no encontrada en el conjunto activo.'); return; }
    S.selId = p.id;
    var q = document.getElementById('adjQ');
    if (q) q.value = p.establecimiento + ' (' + p.codigo + ')';
    cierraSug();
    selPlazaInfo();
    var per = document.getElementById('adjPersona');
    if (per) per.focus();
  }
  function cierraSug() {
    var r = document.getElementById('adjSug');
    if (r) { r.classList.remove('open'); r.innerHTML = ''; }
  }

  /* tarjeta de la plaza elegida dentro del formulario (avisos de duplicado/bloqueo) */
  function selPlazaInfo() {
    var box = document.getElementById('adjSelCard'); if (!box) return;
    var p = S.selId == null ? null : window.App.byId(S.selId);
    if (!p) { box.innerHTML = ''; S.selId = null; return; }
    var adj = window.App.isAdj(p), blo = window.App.isBloq(p), info = window.App.adjInfo(p);
    var aviso = '';
    if (adj) {
      aviso = '<div class="note" style="color:var(--warn)">⚠ Esta plaza <b>ya está adjudicada por ti</b>' +
        (info && info.ts ? ' el ' + fmtDT(info.ts) : '') + (info && info.persona ? ' por <b>' + window.esc(info.persona) + '</b>' : '') +
        '. Para volver a registrarla, revierte primero la adjudicación en el listado.</div>';
    } else if (blo) {
      aviso = '<div class="note" style="color:var(--warn)">⚠ Esta plaza está <b>bloqueada</b>. Al registrar la adjudicación se retirará el bloqueo (te pediremos confirmación).</div>';
    }
    box.innerHTML = '<div class="adjitem' + (adj ? ' st-adj' : blo ? ' st-bloq' : '') + '" style="margin:0">' +
      '<div class="h"><b>' + window.esc(p.establecimiento) + '</b>' +
      '<span class="mini">' + window.esc(p.profesion) + ' · código ' + window.esc(p.codigo) + '</span></div>' +
      '<div class="meta">📍 ' + window.esc([p.distrito, p.provincia, p.departamento].filter(Boolean).join(' · ')) + estTagTxt(p) + '</div>' + aviso + '</div>';
  }
  function estTagTxt(p) {
    if (window.App.isAdj(p)) return ' · ✅ Adjudicada por ti';
    if (window.App.isBloq(p)) return ' · 🚫 Bloqueada';
    return ' · 🟢 Disponible';
  }

  /* ---------- registro: guardar ---------- */
  function registrar() {
    var p = S.selId == null ? null : window.App.byId(S.selId);
    var msg = document.getElementById('adjMsg');
    function fail(t) { if (msg) msg.innerHTML = '<span class="mini" style="color:var(--err)">' + window.esc(t) + '</span>'; window.toast(t); }
    if (!p) { fail('Elige primero una plaza del buscador.'); return; }
    var persona = (document.getElementById('adjPersona') || {}).value || '';
    persona = String(persona).trim();
    if (persona.length < 2) {
      document.getElementById('adjPersona').focus();
      fail('Indica el nombre de la persona que adjudica la plaza.');
      return;
    }
    var obs = String((document.getElementById('adjObs') || {}).value || '').trim();
    var fv = String((document.getElementById('adjFecha') || {}).value || '').trim();
    var fecha = fv ? new Date(fv).getTime() : Date.now();
    var yaAdj = window.App.isAdj(p), blo = window.App.isBloq(p);
    if (yaAdj) {
      var ya = window.App.adjInfo(p);
      fail('Duplicado: esta plaza ya está adjudicada por ti' +
        (ya && ya.persona ? ' (por ' + ya.persona + ')' : '') + '. Revierte esa adjudicación en el listado antes de registrar otra.');
      return;
    }
    var html = '<div class="mini"><b>' + window.esc(p.establecimiento) + '</b> · ' + window.esc(p.profesion) + '<br>Código ' + window.esc(p.codigo) +
      ' · 📍 ' + window.esc([p.distrito, p.departamento].filter(Boolean).join(', ')) + '</div>' +
      '<div class="mini" style="margin-top:6px">Persona: <b>' + window.esc(persona) + '</b><br>Fecha y hora: <b>' + fmtDT(fecha) + '</b>' +
      (obs ? '<br>Observaciones: ' + window.esc(obs) : '') + '</div>' +
      (blo ? '<div class="note">La plaza está bloqueada: al registrar se retirará el bloqueo.</div>' : '') +
      '<div class="note">Se guardará en este navegador y se reflejará en el mapa, tarjetas y esta sección.</div>';
    window.App.askConfirm({
      title: '¿Registrar la adjudicación?',
      html: html,
      ok: 'Sí, registrar adjudicación',
      remember: true,
      onOk: function () {
        if (blo) setBloq(p, false);
        window.App.setAdj(p, true, { persona: persona, obs: obs, fecha: fecha });
        if (window.App.isAdj(p)) {
          if (msg) msg.innerHTML = '';
          window.toast('📝 Adjudicación registrada: ' + p.establecimiento + ' — ' + persona, 7000,
            { label: 'Deshacer', fn: function () { window.App.setAdj(p, false); } });
          window.App.notify('Adjudicación registrada: ' + p.establecimiento + ' — ' + persona, 'ok');
          limpiarForm(true);
        } else {
          fail('No se pudo registrar: la plaza cambió de estado (¿otra pestaña?). Revisa la sección y reintenta.');
        }
      }
    });
  }
  function limpiarForm(mantenerPersona) {
    var q = document.getElementById('adjQ'); if (q) q.value = '';
    var pe = document.getElementById('adjPersona');
    if (pe && !mantenerPersona) pe.value = '';
    var fe = document.getElementById('adjFecha'); if (fe) fe.value = localDT();
    var ob = document.getElementById('adjObs'); if (ob) ob.value = '';
    S.selId = null;
    cierraSug(); selPlazaInfo();
    if (msg()) msg().innerHTML = '';
  }
  function msg() { return document.getElementById('adjMsg'); }

  /* ---------- listado con búsqueda + chips + orden + paginación ---------- */
  function listaFiltrada() {
    var q = window.norm(S.q), u = S.q.trim();
    var arr = all().filter(function (p) {
      var adj = window.App.isAdj(p), blo = window.App.isBloq(p);
      if (S.filtro === 'disponibles' && (adj || blo)) return false;
      if (S.filtro === 'adjudicadas' && !adj) return false;
      if (S.filtro === 'bloqueadas' && !blo) return false;
      if (S.filtro === 'favoritas' && !window.App.isFav(p)) return false;
      if (S.prof && (p.profesion || 'Sin información') !== S.prof) return false;
      if (q) {
        var ok = window.norm(p.establecimiento).indexOf(q) >= 0 || window.norm(p.profesion).indexOf(q) >= 0 ||
                 String(p.codigo || '').indexOf(u) >= 0 || window.norm([p.distrito, p.provincia, p.departamento].filter(Boolean).join(' ')).indexOf(q) >= 0;
        if (!ok) return false;
      }
      return true;
    });
    arr.sort(function (a, b) {
      if (S.sort === 'region') return String(a.departamento).localeCompare(String(b.departamento)) || String(a.establecimiento).localeCompare(String(b.establecimiento));
      if (S.sort === 'estado') {
        var wa = (window.App.isBloq(a) ? 2 : window.App.isAdj(a) ? 1 : 0), wb = (window.App.isBloq(b) ? 2 : window.App.isAdj(b) ? 1 : 0);
        return wb - wa || String(a.establecimiento).localeCompare(String(b.establecimiento));
      }
      return String(a.establecimiento).localeCompare(String(b.establecimiento));
    });
    return arr;
  }

  function renderSegs() {
    var el = document.getElementById('adjSegs'); if (!el) return;
    var c = counts();
    var opts = [
      { k: 'todas', t: 'Todas', n: c.total },
      { k: 'disponibles', t: '🟢 Disponibles', n: c.disponibles },
      { k: 'adjudicadas', t: '✅ Adjudicadas', n: c.adjudicadas },
      { k: 'bloqueadas', t: '🚫 Bloqueadas', n: c.bloqueadas },
      { k: 'favoritas', t: '★ Favoritas', n: c.favoritas }
    ];
    el.innerHTML = opts.map(function (o) {
      return '<button type="button" class="qbtn' + (S.filtro === o.k ? ' on' : '') + '" data-af="' + o.k + '" aria-pressed="' + (S.filtro === o.k) + '">' +
        o.t + ' <b>' + window.fmtNum(o.n) + '</b></button>';
    }).join('');
  }

  function tagEstado(p) {
    if (window.App.isBloq(p)) return '<span class="tag st-bloq" title="Bloqueada: no puede ser seleccionada mientras siga bloqueada">🚫 Bloqueada</span>';
    if (window.App.isAdj(p)) return '<span class="tag st-adj" title="Adjudicada por ti">✅ Adjudicada</span>';
    return '<span class="tag st-disp" title="Todavía puede ser elegida">🟢 Disponible</span>';
  }

  function renderList() {
    var el = document.getElementById('adjList'); if (!el) return;
    var arr = listaFiltrada();
    var total = arr.length;
    var paginas = Math.max(1, Math.ceil(total / PER));
    if (S.page > paginas) S.page = paginas;
    var ini = (S.page - 1) * PER;
    var pag = arr.slice(ini, ini + PER);
    el.innerHTML = total ? pag.map(rowHtml).join('')
      : '<div class="empty">Sin plazas con este filtro.<br><span class="mini">Cambia el filtro o la búsqueda. ' +
        (S.filtro === 'bloqueadas' ? 'Bloquea una plaza con 🚫 en el listado «Todas».' : 'Usa ✅ para adjudicar o ★ para guardar favoritas.') + '</span></div>';
    var pg = document.getElementById('adjPager');
    if (pg) pg.innerHTML = '<span class="mini" style="align-self:center">Mostrando ' + (total ? (ini + 1) : 0) + '–' + (ini + pag.length) + ' de <b>' + window.fmtNum(total) + '</b></span>' +
      '<span style="flex:1"></span>' +
      (S.page > 1 ? '<button class="btn sm" data-mp="-1">‹ Anterior</button>' : '') +
      '<span class="mini" style="align-self:center">Página ' + S.page + ' / ' + paginas + '</span>' +
      (S.page < paginas ? '<button class="btn sm" data-mp="1">Siguiente ›</button>' : '');
    if (pg) Array.prototype.forEach.call(pg.querySelectorAll('[data-mp]'), function (b) {
      b.onclick = function () { S.page += Number(b.getAttribute('data-mp')); renderMid(); };
    });
  }

  function rowHtml(p) {
    var adj = window.App.isAdj(p), blo = window.App.isBloq(p), fav = window.App.isFav(p);
    var info = window.App.adjInfo(p);
    var sub = '';
    if (adj) {
      sub = '<div class="meta">✅ Adjudicada por ti' + (info && info.ts ? ' · ' + fmtDT(info.ts) : '') +
        (info && info.persona ? ' · <b>' + window.esc(info.persona) + '</b>' : '') +
        (info && info.obs ? ' · ' + window.esc(info.obs) : '') + '</div>';
    } else if (blo) {
      var ib = (window.Store.get('bloqueadas', {}) || {})[keyOf(p)];
      sub = '<div class="meta">🚫 Bloqueada' + (ib && ib.ts ? ' desde ' + fmtDT(ib.ts) : '') + ': no puede ser seleccionada.</div>';
    }
    return '<div class="adjitem' + (blo ? ' st-bloq' : adj ? ' st-adj' : '') + '">' +
      '<div class="h"><b>' + window.esc(p.establecimiento) + '</b>' +
      '<span class="mini">' + window.esc(p.profesion) + ' · código ' + window.esc(p.codigo) + '</span></div>' +
      '<div class="meta">📍 ' + window.esc([p.distrito, p.provincia, p.departamento].filter(Boolean).join(' · ')) +
      (p.lat == null ? ' · ⏳ pendiente de geolocalización' : '') + '</div>' +
      sub + window.Adj.line(p) +
      '<div class="tags">' + tagEstado(p) + (fav ? '<span class="tag favtag">★ Favorita</span>' : '') + '</div>' +
      '<div class="acts">' +
      '<button type="button" class="btn sm' + (fav ? ' on' : '') + '" data-a="fav" data-id="' + p.id + '" title="' + (fav ? 'Quitar de favoritos' : 'Marcar como favorita') + '" aria-pressed="' + fav + '">★</button>' +
      '<button type="button" class="btn sm' + (adj ? ' on' : '') + '" data-a="adj" data-id="' + p.id + '" title="' + (adj ? 'Revertir adjudicación (pide confirmación)' : 'Adjudicar (pide confirmación)') + '" aria-pressed="' + adj + '">✅</button>' +
      '<button type="button" class="btn sm' + (blo ? ' on' : '') + '" data-a="bloq" data-id="' + p.id + '" title="' + (blo ? 'Desbloquear (pide confirmación)' : 'Bloquear') + '" aria-pressed="' + blo + '">🚫</button>' +
      '<button type="button" class="btn sm" data-a="newreg" data-id="' + p.id + '" title="Abrir el formulario con esta plaza">📝 Registrar</button>' +
      '<button type="button" class="btn sm" data-a="detail" data-id="' + p.id + '" title="Ver ficha completa">👁 Ficha</button>' +
      '</div></div>';
  }

  function renderMid() { renderSegs(); renderList(); }

  /* ---------- historial / registro y control ---------- */
  function registro() {
    var arr = [];
    var marks = window.App.adjs();
    all().forEach(function (p) {
      var info = marks[keyOf(p)];
      if (info) arr.push({ p: p, ts: info.ts, persona: info.persona || '—', obs: info.obs || '', meta: !!info.persona });
    });
    arr.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    return arr;
  }

  function renderHist() {
    var el = document.getElementById('adjHist'); if (!el) return;
    var regs = registro();
    var bloqs = window.Store.get('bloqueadas', {}) || {};
    var nBloq = Object.keys(bloqs).length;
    var html = '<div class="rowbtns" style="flex-wrap:wrap">' +
      '<button type="button" class="btn sm" id="adjCsv">⬇ CSV del registro</button>' +
      '<button type="button" class="btn sm" id="adjJson">⬇ JSON de estados (favoritas + adjudicadas + bloqueadas)</button>' +
      '<label class="btn sm" style="cursor:pointer">⬆ Importar estados JSON<input type="file" id="adjJsonIn" accept=".json,application/json" style="display:none"></label>' +
      (regs.length || nBloq ? '<button type="button" class="btn sm" id="adjVaciar">🗑 Vaciar adjudicadas y bloqueadas</button>' : '') + '</div>';
    html += '<div class="mini" style="margin-top:8px"><b>' + window.fmtNum(regs.length) + '</b> adjudicaciones registradas por ti' +
      (nBloq ? ' · <b>' + window.fmtNum(nBloq) + '</b> bloqueos' : '') + '. El registro vive solo en este navegador.</div>';
    if (nBloq) {
      var arrB = all().filter(function (p) { return window.App.isBloq(p); })
        .sort(function (a, b) { return (bloqs[keyOf(b)] || {}).ts - (bloqs[keyOf(a)] || {}).ts; }).slice(0, 12);
      html += '<table class="dt" style="margin-top:10px"><tr><th>Bloqueadas</th><th>Ubicación</th><th>Desde</th><th></th></tr>' +
        arrB.map(function (p) {
          return '<tr><td>' + window.esc(p.establecimiento) + '<div class="mini">' + window.esc(p.profesion) + ' · ' + window.esc(p.codigo) + '</div></td>' +
            '<td>' + window.esc([p.distrito, p.departamento].filter(Boolean).join(', ')) + '</td>' +
            '<td>' + fmtDT((bloqs[keyOf(p)] || {}).ts) + '</td>' +
            '<td><button type="button" class="btn sm" data-bloq-del="' + p.id + '" title="Desbloquear (pide confirmación)">🔓</button></td></tr>';
        }).join('') + '</table>' + (nBloq > 12 ? '<div class="mini">…y ' + (nBloq - 12) + ' más (que se ven con el filtro 🚫 del listado).</div>' : '');
    }
    html += regs.length ? '<table class="dt" style="margin-top:10px"><tr><th>Fecha y hora</th><th>Plaza</th><th>Persona</th><th>Observaciones</th><th></th></tr>' +
      regs.slice(0, 30).map(function (r) {
        return '<tr><td>' + fmtDT(r.ts) + '</td>' +
          '<td>' + window.esc(r.p.establecimiento) + '<div class="mini">' + window.esc(r.p.profesion) + ' · ' + window.esc(r.p.codigo) + '</div></td>' +
          '<td>' + window.esc(r.persona) + '</td><td>' + window.esc(r.obs || '—') + '</td>' +
          '<td><button type="button" class="btn sm" data-rev="' + r.p.id + '" title="Revertir adjudicación (pide confirmación)">↩</button></td></tr>';
      }).join('') + '</table>' + (regs.length > 30 ? '<div class="mini">…y ' + (regs.length - 30) + ' más.</div>' : '')
      : '<div class="empty" style="margin-top:10px">Sin adjudicaciones registradas todavía.</div>';
    el.innerHTML = html;

    document.getElementById('adjCsv').onclick = exportarCsv;
    document.getElementById('adjJson').onclick = exportarJson;
    document.getElementById('adjJsonIn').onchange = importarJson;
    var borrar = document.getElementById('adjVaciar');
    if (borrar) borrar.onclick = vaciar;
    Array.prototype.forEach.call(el.querySelectorAll('[data-bloq-del]'), function (b) {
      b.onclick = function () { toggleBloq(window.App.byId(Number(b.getAttribute('data-bloq-del')))); };
    });
    Array.prototype.forEach.call(el.querySelectorAll('[data-rev]'), function (b) {
      b.onclick = function () { revertir(window.App.byId(Number(b.getAttribute('data-rev')))); };
    });
  }

  function revertir(p) {
    if (!p || !window.App.isAdj(p)) return;
    window.App.askConfirm({
      title: '¿Revertir la adjudicación?',
      html: '<div class="mini"><b>' + window.esc(p.establecimiento) + '</b> · ' + window.esc(p.profesion) + '</div>' +
            '<div class="note">Se retirará tu marca y el registro (persona/fecha/observación). La plaza volverá a estar disponible. Esta acción debe confirmarse.</div>',
      ok: 'Sí, revertir adjudicación',
      onOk: function () {
        window.App.setAdj(p, false);
        window.toast('Adjudicación revertida: ' + p.establecimiento, 6000, { label: 'Deshacer', fn: function () { window.App.setAdj(p, true); } });
        window.App.notify('Adjudicación revertida: ' + p.establecimiento);
      }
    });
  }

  function vaciar() {
    window.App.askConfirm({
      title: '¿Vaciar estados de seguimiento?',
      html: '<div class="mini">Se quitarán <b>' + window.fmtNum(window.App.adjCount()) + '</b> adjudicaciones y <b>' + window.fmtNum(window.App.bloqCount()) + '</b> bloqueos.</div>' +
            '<div class="note">Las ★ favoritas no se tocan. Acción reversible solo regenerando los estados (usa antes ⬇ JSON si quieres respaldo).</div>',
      ok: 'Sí, vaciar',
      onOk: function () {
        window.Store.set('adjudicadas', {}); window.Store.set('bloqueadas', {});
        window.App.stateChanged();
        window.toast('Estados vaciados.'); window.App.notify('Vacío: adjudicadas y bloqueadas');
      }
    });
  }

  function download(nombre, contenido, tipo) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([contenido], { type: tipo || 'text/plain;charset=utf-8' }));
    a.download = nombre; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 400);
  }

  function exportarCsv() {
    var regs = registro();
    if (!regs.length) { window.toast('Todavía no hay adjudicaciones registradas.'); return; }
    var lin = [['Fecha y hora', 'Establecimiento', 'Profesión', 'Código RENIPRESS', 'Departamento', 'Distrito', 'Persona', 'Observaciones'].join(';')];
    regs.forEach(function (r) {
      lin.push([fmtDT(r.ts), r.p.establecimiento, r.p.profesion, r.p.codigo, r.p.departamento, r.p.distrito, r.persona, r.obs]
        .map(function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }).join(';'));
    });
    var hoy = new Date().toISOString().slice(0, 10);
    download('serums_registro_adjudicaciones_' + hoy + '.csv', '\ufeff' + lin.join('\r\n'), 'text/csv;charset=utf-8');
    window.toast('CSV del registro descargado (' + window.fmtNum(regs.length) + ' filas).');
    window.App.notify('Registro exportado: ' + regs.length + ' adjudicaciones', 'ok');
  }

  function exportarJson() {
    var c = counts();
    var data = {
      app: 'SERUMS Map Explorer — estados de seguimiento',
      generado: new Date().toISOString(),
      fuente: window.App.S.source,
      favoritas: window.Store.get('favoritos', []),
      adjudicadas: window.App.adjs(),
      bloqueadas: window.Store.get('bloqueadas', {})
    };
    var hoy = new Date().toISOString().slice(0, 10);
    download('serums_estados_seguimiento_' + hoy + '.json', JSON.stringify(data, null, 1), 'application/json;charset=utf-8');
    window.toast('Estados exportados (' + window.fmtNum(c.total) + ' plazas en el conjunto).');
    window.App.notify('Estados de seguimiento exportados (JSON)', 'ok');
  }

  function importarJson(ev) {
    var f = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      var d; try { d = JSON.parse(r.result); } catch (e) { window.toast('El archivo no es un JSON válido.'); return; }
      if (!d || (d.favoritas && !d.favoritas.length && !d.adjudicadas && !d.bloqueadas) || (!d.favoritas && !d.adjudicadas && !d.bloqueadas)) {
        window.toast('El archivo no parece un respaldo de estados de esta app.'); return;
      }
      window.App.askConfirm({
        title: '¿Importar estados?',
        html: '<div class="mini"><b>' + window.esc(f.name) + '</b><br>★ ' + ((d.favoritas || []).length) + ' favoritas · ✅ ' + Object.keys(d.adjudicadas || {}).length +
              ' adjudicadas · 🚫 ' + Object.keys(d.bloqueadas || {}).length + ' bloqueadas.</div>' +
              '<div class="note">Se fusiona con lo que ya tienes: si hay conflicto, prevalece la marca más reciente. Los favoritos se unen.</div>',
        ok: 'Sí, importar y fusionar',
        onOk: function () {
          var fav = window.Store.get('favoritos', []);
          (d.favoritas || []).forEach(function (k) { if (fav.indexOf(k) < 0) fav.push(k); });
          window.Store.set('favoritos', fav);
          ['adjudicadas', 'bloqueadas'].forEach(function (k2) {
            var local = window.Store.get(k2, {}) || {}, entra = d[k2] || {};
            Object.keys(entra).forEach(function (k) {
              var actual = local[k];
              if (!actual || ((entra[k].ts || 0) > (actual.ts || 0))) local[k] = entra[k];
            });
            window.Store.set(k2, local);
          });
          window.App.stateChanged();
          renderHist();
          window.toast('Estados importados y fusionados.');
          window.App.notify('Estados importados: ' + f.name, 'ok');
        }
      });
    };
    r.readAsText(f);
  }

  /* ---------- nota de sincronización ---------- */
  function renderSyncNote() {
    var el = document.getElementById('adjSyncNote'); if (!el) return;
    el.innerHTML = 'Supervisa y gestiona tus estados de plaza <b>sin mapa</b>: disponible · ★ favorita · ✅ adjudicada · 🚫 bloqueada. ' +
      'Los estados se guardan <b>solo en este navegador</b>; las demás pestañas del mismo navegador se actualizan al instante. ' +
      'La <b>adjudicación compartida en tiempo real entre equipos no está disponible</b> (no hay servidor integrado): usa ⬇ JSON para compartir estados por archivo.';
  }

  /* ---------- funciones de estado público ---------- */
  function badge() {
    var el = document.getElementById('adjBadge'); if (!el) return;
    el.textContent = String(window.App.adjCount());
  }

  /* ---------- arranque de manejadores (una sola vez) ---------- */
  function wire() {
    if (wired) return;
    wired = true;
    var busq = document.getElementById('adjSearch');
    if (busq) busq.addEventListener('input', window.debounce(function () {
      S.q = busq.value; S.page = 1;
      if (window.App.S.view === 'adjudicacion') renderMid();
    }, 180));
    var prof = document.getElementById('adjProfSel');
    if (prof) prof.onchange = function () { S.prof = prof.value; S.page = 1; renderMid(); };
    var srt = document.getElementById('adjSort');
    if (srt) srt.onchange = function () { S.sort = srt.value; S.page = 1; renderMid(); };

    var segs = document.getElementById('adjSegs');
    if (segs) segs.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-af]') : null;
      if (!b) return;
      S.filtro = b.getAttribute('data-af'); S.page = 1;
      renderSegs(); renderList();
    });
    var lst = document.getElementById('adjList');
    if (lst) lst.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-a]') : null;
      if (!b) return;
      var p = window.App.byId(Number(b.getAttribute('data-id')));
      var a = b.getAttribute('data-a');
      if (!p) return;
      if (a === 'fav') window.App.toggleFav(p);
      else if (a === 'adj') window.App.toggleAdj(p);   // confirmación breve integrada en App
      else if (a === 'bloq') toggleBloq(p);
      else if (a === 'newreg') { abrirFormCon(p); }
      else if (a === 'detail') window.App.openDetail(p.id);
      renderMid();
    });

    /* formulario de registro: se construye y cablea en renderForm (una vez;
       wire() solo atiende elementos estáticos del HTML) */
    var sug = document.getElementById('adjSug');
    if (sug) sug.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        var os = Array.prototype.slice.call(sug.querySelectorAll('[data-sug]'));
        var i = os.indexOf(document.activeElement);
        if (e.key === 'ArrowDown' && i < os.length - 1) { e.preventDefault(); os[i + 1].focus(); }
        if (e.key === 'ArrowUp') { e.preventDefault(); i > 0 ? os[i - 1].focus() : document.getElementById('adjQ').focus(); }
      }
    });
    var vmap = document.getElementById('adjToMap');
    if (vmap) vmap.onclick = function () { window.App.go('map'); };

    /* sincronización entre pestañas del mismo navegador */
    window.addEventListener('storage', function (e) {
      if (!e || !e.key) return;
      var k = String(e.key).replace(/^serums_/, '');
      if (['favoritos', 'adjudicadas', 'bloqueadas'].indexOf(k) < 0) return;
      window.App.stateChanged();
      window.toast('Actualizado desde otra pestaña del navegador (' + k + ').');
    });
  }

  function abrirFormCon(p) {
    var box = document.getElementById('adjRegBox');
    if (box) box.open = true;
    elegirPlaza(p);
    box && box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- render general (se llama al entrar y en cada cambio de estado) ---------- */
  function render() {
    renderForm();   // una sola vez: conserva lo escrito entre refrescos
    wire();         // manejadores una sola vez
    var sel = document.getElementById('adjProfSel');
    if (sel && (!sel.options.length || (_idx && _idx.n !== all().length))) {
      var cur = S.prof;
      var profs = {};
      all().forEach(function (p) { profs[p.profesion || 'Sin información'] = 1; });
      sel.innerHTML = '<option value="">Profesión: todas</option>' +
        Object.keys(profs).sort().map(function (v) {
          return '<option value="' + window.esc(v) + '"' + (cur === v ? ' selected' : '') + '>' + window.esc(v) + '</option>';
        }).join('');
      sel.value = cur;
      if (sel.value !== cur) { sel.value = ''; S.prof = ''; }
    }
    badge();
    renderKpis();
    renderCharts();
    renderMid();
    renderSyncNote();
    renderHist();
  }

  /* el formulario se construye una vez (conserva lo escrito entre refrescos) */
  function renderForm() {
    var el = document.getElementById('adjForm'); if (!el || el.hasAttribute('data-ready')) return;
    el.setAttribute('data-ready', '1');
    el.innerHTML =
      '<div class="mini">Escribe el nombre (o el código) de la plaza y elige una de las <b>' + window.fmtNum(all().length) +
      ' plazas del conjunto activo</b>. Los estados ★ / ✅ / 🚫 se guardan por separado; una plaza favorita no implica adjudicación.</div>' +
      '<div class="sugwrap" style="margin-top:8px"><input type="text" id="adjQ" placeholder="Nombre o código de la plaza…" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="adjSug">' +
      '<div id="adjSug" class="sugbox" role="listbox"></div></div>' +
      '<div id="adjSelCard"></div>' +
      '<div class="frow"><span>Persona que adjudica *</span><input type="text" id="adjPersona" placeholder="Ej: María Quispe — IPRESS / comisión SERUMS"></div>' +
      '<div class="frow"><span>Fecha y hora del registro</span><input type="datetime-local" id="adjFecha" value="' + localDT() + '"></div>' +
      '<div class="frow"><span>Observaciones (opcional)</span><textarea id="adjObs" rows="2" placeholder="Nota de la sesión, acta, resolución N°…"></textarea></div>' +
      '<div class="rowbtns" style="margin-top:8px"><button type="button" class="btn primary" id="adjGuardar">✅ Registrar adjudicación</button>' +
      '<button type="button" class="btn" id="adjLimpiar">Limpiar formulario</button><span id="adjMsg"></span></div>';
    document.getElementById('adjQ').addEventListener('input', function () {
      S.selId = null; selPlazaInfo();
      muestraSugerencias(document.getElementById('adjSug'), sugerencias(this.value));
    });
    document.getElementById('adjQ').addEventListener('keydown', function (e) {
      var r = document.getElementById('adjSug'), opts = r ? r.querySelectorAll('[data-sug]') : [];
      if (e.key === 'ArrowDown' && opts.length) { e.preventDefault(); opts[0].focus(); }
      else if (e.key === 'Escape') { cierraSug(); }
      else if (e.key === 'Enter' && opts.length) { e.preventDefault(); opts[0].click(); }
    });
    document.getElementById('adjQ').addEventListener('blur', function () { setTimeout(cierraSug, 200); });
    document.getElementById('adjGuardar').onclick = registrar;
    document.getElementById('adjLimpiar').onclick = function () { limpiarForm(true); window.toast('Formulario limpio.'); };
  }

  return { render: render, badge: badge, toggleBloq: toggleBloq, counts: counts };
})();
