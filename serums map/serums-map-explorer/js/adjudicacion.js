/* SERUMS Map Explorer — Centro de adjudicación
   Módulo de gestión del dock (sin mapa): KPIs, gráficos, listado filtrable,
   registro de adjudicaciones (persona / fecha / observaciones), bloqueos,
   historial y compartir estados (JSON). Reutiliza App (datos reales) y Store.
   Estados separados: ★ favorita · ✅ adjudicación propia · 🚫 bloqueo. */
/* © 2026 ZARCONT — Todos los derechos reservados · Licencia: LICENSE (en esta carpeta y en la raíz del repositorio) */
'use strict';
window.AdjCenter = (function () {
  var S = { filtro: 'todas', q: '', prof: '', sort: 'est', page: 1, selId: null };
  var PER = 12, wired = false;

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
          window.toast('Adjudicación revertida y plaza bloqueada.', 6000, { label: 'Deshacer', fn: function () { setBloq(p, false); window.App.setAdj(p, true); window.App.stateChanged(); } });
          window.App.notify('Revertida y bloqueada: ' + p.establecimiento);
        }
      });
      return;
    }
    setBloq(p, true);
    window.App.stateChanged();
    window.toast('Plaza bloqueada: no puede ser seleccionada mientras siga bloqueada.', 6000, { label: 'Deshacer', fn: function () { setBloq(p, false); window.App.stateChanged(); } });
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
    cierraSug();
    var per = document.getElementById('adjPersona');
    if (per && !per.disabled && !per.value) per.value = window.Store.get('adj_persona', '') || '';
    selPlazaInfo();
    if (window.innerWidth <= 780) {
      setTimeout(function () {
        var ins = document.getElementById('adjInspector');
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (ins && ins.scrollIntoView) ins.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      }, 40);
    }
  }

  function current() { return S.selId == null ? null : window.App.byId(S.selId); }

  function focusPersona() {
    var f = document.getElementById('adjPersona');
    if (f && !f.disabled) {
      f.focus();
      f.classList.add('need');
      setTimeout(function () { f.classList.remove('need'); }, 1600);
    }
  }
  function cierraSug() {
    var r = document.getElementById('adjSug');
    if (r) { r.classList.remove('open'); r.innerHTML = ''; }
  }

  /* tarjeta de la plaza elegida dentro de la ficha (avisos de duplicado/bloqueo) */
  function selPlazaInfo() {
    var box = document.getElementById('adjSelCard');
    var empty = document.getElementById('adjEmpty');
    var body = document.getElementById('adjFormBody');
    if (!box) return;
    var p = current();
    var ins = document.getElementById('adjInspector');
    if (ins) ins.classList.toggle('has-sel', !!p);
    if (!p) {
      S.selId = null;
      if (empty) empty.hidden = false;
      if (body) body.hidden = true;
      box.innerHTML = '';
      return;
    }
    if (empty) empty.hidden = true;
    if (body) body.hidden = false;
    var adj = window.App.isAdj(p), blo = window.App.isBloq(p), fav = window.App.isFav(p), info = window.App.adjInfo(p);
    var tag = adj ? '<span class="tag ok">✓ Adjudicada por ti</span>'
      : blo ? '<span class="tag warn">✕ Bloqueada</span>'
      : '<span class="tag">● Disponible</span>';
    var loc = window.esc([p.distrito, p.provincia, p.departamento].filter(Boolean).join(' · ')) +
      (p.lat == null ? ' · pendiente de geolocalización' : '');
    var official = window.Adj.line(p);
    if (!official) official = '<div class="mini adjmini">Sin registro en el listado oficial 2026-I.</div>';
    var record = '';
    if (adj) {
      record = '<div class="adjrecord">' +
        '<div class="adjrecordhead"><b>Tu registro</b><span class="mini">' + fmtDT(info && info.ts) + '</span></div>' +
        '<div class="mini">Persona: <b>' + (info && info.persona ? window.esc(info.persona) : 'sin nombre registrado') + '</b>' +
        (info && info.obs ? ' · ' + window.esc(info.obs) : '') + '</div>' +
        '<button type="button" class="btn sm" data-arev="' + p.id + '">Revertir adjudicación</button></div>';
    } else if (blo) {
      record = '<div class="note adjnote">Esta plaza está bloqueada. Al registrar la adjudicación se retirará el bloqueo (se pedirá una confirmación).</div>';
    }
    box.innerHTML =
      '<div class="adjinsp-head"><div class="adjinsp-title">' + tag +
        '<h2>' + window.esc(p.establecimiento) + '</h2>' +
        '<div class="mini">' + window.esc(p.profesion) + ' · código ' + window.esc(p.codigo) + '</div>' +
      '</div></div>' +
      '<div class="mini adjloc">' + loc + '</div>' +
      '<div class="adjofficial">' + official + '</div>' + record;
    var g = document.getElementById('adjGuardar');
    if (g) {
      g.disabled = adj;
      g.textContent = adj ? 'Ya adjudicada' : (blo ? 'Desbloquear y adjudicar' : 'Registrar adjudicación');
    }
    var f = document.getElementById('adjFav');
    if (f) {
      f.classList.toggle('on', fav);
      f.innerHTML = '<span aria-hidden="true">' + (fav ? '★' : '☆') + '</span> Favorita';
      f.setAttribute('aria-pressed', String(fav));
    }
    var b = document.getElementById('adjBloq');
    if (b) {
      b.classList.toggle('on', blo);
      b.innerHTML = '<span aria-hidden="true">✕</span> ' + (blo ? 'Desbloquear' : 'Bloquear');
      b.setAttribute('aria-pressed', String(blo));
    }
    var pe = document.getElementById('adjPersona');
    if (pe) {
      pe.disabled = adj;
      if (adj && info && info.persona) pe.value = info.persona;
      else if (!pe.value) pe.value = window.Store.get('adj_persona', '') || '';
    }
    var rev = box.querySelector('[data-arev]');
    if (rev) rev.onclick = function () { revertir(p); };
    var rows = document.querySelectorAll('#adjList .adjrowcard[data-select]');
    Array.prototype.forEach.call(rows, function (r) {
      r.classList.toggle('sel', Number(r.getAttribute('data-select')) === p.id);
    });
  }

  /* ---------- registro: guardar en un paso ---------- */
  function registrar() {
    var p = current();
    var msg = document.getElementById('adjMsg');
    function fail(t) {
      if (msg) msg.innerHTML = '<span class="adjfail">' + window.esc(t) + '</span>';
      window.toast(t);
    }
    if (!p) { fail('Selecciona una plaza del listado para empezar.'); return; }
    var pe = document.getElementById('adjPersona');
    var persona = String(pe ? pe.value : '').trim();
    if (persona.length < 2) { focusPersona(); fail('Indica el nombre de la persona que adjudica la plaza.'); return; }
    if (window.App.isAdj(p)) {
      fail('Esta plaza ya está adjudicada por ti. Revierte la marca para registrarla de nuevo.');
      selPlazaInfo();
      return;
    }
    var obs = String((document.getElementById('adjObs') || {}).value || '').trim();
    var fv = String((document.getElementById('adjFecha') || {}).value || '').trim();
    var fecha = fv ? new Date(fv).getTime() : Date.now();
    if (!fecha || isNaN(fecha)) fecha = Date.now();
    var blo = window.App.isBloq(p);
    function guardar() {
      window.App.setAdj(p, true, { persona: persona, obs: obs, fecha: fecha });
      if (window.App.isAdj(p)) {
        window.Store.set('adj_persona', persona);
        if (msg) msg.innerHTML = '<span class="adjok">✓ Registrada. El nombre queda listo para la siguiente plaza.</span>';
        var ob = document.getElementById('adjObs'); if (ob) ob.value = '';
        var fe = document.getElementById('adjFecha'); if (fe) fe.value = localDT();
        selPlazaInfo();
      } else {
        fail('No se pudo registrar: la plaza cambió de estado (¿otra pestaña?). Revisa e reintenta.');
      }
    }
    if (blo) {
      window.App.askConfirm({
        title: 'La plaza está bloqueada',
        html: '<div class="mini"><b>' + window.esc(p.establecimiento) + '</b> · ' + window.esc(p.profesion) + '</div>' +
          '<div class="note">Se retirará el bloqueo y se guardará la adjudicación con el nombre indicado.</div>',
        ok: 'Sí, desbloquear y adjudicar',
        onOk: function () {
          setBloq(p, false);
          window.App.stateChanged();
          guardar();
        }
      });
      return;
    }
    guardar();
  }

  function quickAdj(p) {
    if (!p) return;
    if (window.App.isAdj(p)) { elegirPlaza(p); return; }
    if (window.App.isBloq(p)) {
      elegirPlaza(p);
      window.toast('La plaza está bloqueada; desbloquéala desde la ficha para adjudicarla.');
      return;
    }
    var pe = document.getElementById('adjPersona');
    var persona = String(pe && !pe.disabled ? pe.value : '').trim() ||
      String(window.Store.get('adj_persona', '') || '').trim();
    if (!persona) {
      elegirPlaza(p);
      focusPersona();
      window.toast('Escribe el nombre de la persona y pulsa Registrar adjudicación.');
      return;
    }
    window.App.setAdj(p, true, { persona: persona, fecha: Date.now() });
    if (window.App.isAdj(p)) {
      window.Store.set('adj_persona', persona);
      elegirPlaza(p);
    }
  }

  function limpiarForm(mantenerPersona) {
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
      { k: 'disponibles', t: '● Disponibles', n: c.disponibles },
      { k: 'adjudicadas', t: '✓ Adjudicadas', n: c.adjudicadas },
      { k: 'bloqueadas', t: '✕ Bloqueadas', n: c.bloqueadas },
      { k: 'favoritas', t: '★ Favoritas', n: c.favoritas }
    ];
    el.innerHTML = opts.map(function (o) {
      return '<button type="button" class="qbtn' + (S.filtro === o.k ? ' on' : '') + '" data-af="' + o.k + '" aria-pressed="' + (S.filtro === o.k) + '">' +
        o.t + ' <b>' + window.fmtNum(o.n) + '</b></button>';
    }).join('');
  }

  function tagEstado(p) {
    if (window.App.isBloq(p)) return '<span class="tag warn" title="Bloqueada: no puede ser seleccionada mientras siga bloqueada">✕ Bloqueada</span>';
    if (window.App.isAdj(p)) return '<span class="tag ok" title="Adjudicada por ti">✓ Adjudicada</span>';
    return '<span class="tag" title="Todavía puede ser elegida">● Disponible</span>';
  }

  function renderList() {
    var el = document.getElementById('adjList'); if (!el) return;
    var arr = listaFiltrada();
    var total = arr.length;
    var paginas = Math.max(1, Math.ceil(total / PER));
    if (S.page > paginas) S.page = paginas;
    var ini = (S.page - 1) * PER;
    var pag = arr.slice(ini, ini + PER);
    var cnt = document.getElementById('adjListCount');
    if (cnt) cnt.innerHTML = window.fmtNum(total) + ' plaza' + (total === 1 ? '' : 's');
    el.innerHTML = total ? pag.map(rowHtml).join('')
      : '<div class="empty">Sin plazas con este filtro.<br><span class="mini">Cambia el filtro o la búsqueda. ' +
        (S.filtro === 'bloqueadas' ? 'Bloquea una plaza desde su ficha para verla aquí.' : 'Selecciona una plaza para adjudicarla o guardarla en favoritas.') + '</span></div>';
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
    var loc = window.esc([p.distrito, p.provincia, p.departamento].filter(Boolean).join(' · ')) +
      (p.lat == null ? ' · pendiente de geolocalización' : '');
    var rec = '';
    if (adj) {
      rec = '<div class="mini adjrec">Registrada por <b>' + (info && info.persona ? window.esc(info.persona) : 'sin nombre') + '</b>' +
        (info && info.ts ? ' · ' + fmtDT(info.ts) : '') + '</div>';
    }
    var official = window.Adj.line(p);
    var primary = adj
      ? '<button type="button" class="btn sm" data-a="select" data-id="' + p.id + '">Ver registro</button>'
      : '<button type="button" class="btn sm primary" data-a="quickadj" data-id="' + p.id + '" title="Adjudicar con el nombre actual o abrir la ficha">Adjudicar</button>';
    return '<article class="adjrowcard' + (adj ? ' is-adj' : '') + (blo ? ' is-bloq' : '') + (S.selId === p.id ? ' sel' : '') + '" data-select="' + p.id + '">' +
      '<div class="adjrowtop">' +
        '<button type="button" class="adjrowopen" data-select="' + p.id + '" aria-label="Abrir ficha de ' + window.esc(p.establecimiento) + '">' +
          '<b>' + window.esc(p.establecimiento) + '</b>' +
          '<span class="mini">' + window.esc(p.profesion) + ' · código ' + window.esc(p.codigo) + '</span>' +
        '</button>' + tagEstado(p) +
      '</div>' +
      '<div class="mini adjloc">' + loc + '</div>' +
      rec + official +
      '<div class="adjrowbottom"><span class="mini">' + window.fmtNum(p.n_plazas || 1) + ' vacante' + ((p.n_plazas || 1) === 1 ? '' : 's') + '</span>' +
        '<div class="acts">' + primary +
          '<button type="button" class="btn sm' + (fav ? ' on' : '') + '" data-a="fav" data-id="' + p.id + '" title="' + (fav ? 'Quitar de favoritos' : 'Marcar como favorita') + '" aria-label="' + (fav ? 'Quitar de favoritos' : 'Marcar como favorita') + '" aria-pressed="' + fav + '">' + (fav ? '★' : '☆') + '</button>' +
          '<button type="button" class="btn sm' + (blo ? ' on' : '') + '" data-a="bloq" data-id="' + p.id + '" title="' + (blo ? 'Desbloquear' : 'Bloquear') + '" aria-label="' + (blo ? 'Desbloquear' : 'Bloquear') + '" aria-pressed="' + blo + '">✕</button>' +
        '</div>' +
      '</div>' +
    '</article>';
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
      '<button type="button" class="btn sm" id="adjCsv">Descargar CSV</button>' +
      '<button type="button" class="btn sm" id="adjJson">Exportar JSON</button>' +
      '<label class="btn sm" style="cursor:pointer">Importar JSON<input type="file" id="adjJsonIn" accept=".json,application/json" style="display:none"></label>' +
      (regs.length || nBloq ? '<button type="button" class="btn sm" id="adjVaciar">Vaciar adjudicadas y bloqueadas</button>' : '') + '</div>';
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
            '<td><button type="button" class="btn sm" data-bloq-del="' + p.id + '" title="Desbloquear (pide confirmación)">Desbloquear</button></td></tr>';
        }).join('') + '</table>' + (nBloq > 12 ? '<div class="mini">…y ' + (nBloq - 12) + ' más (que se ven con el filtro de bloqueadas).</div>' : '');
    }
    html += regs.length ? '<table class="dt" style="margin-top:10px"><tr><th>Fecha y hora</th><th>Plaza</th><th>Persona</th><th>Observaciones</th><th></th></tr>' +
      regs.slice(0, 30).map(function (r) {
        return '<tr><td>' + fmtDT(r.ts) + '</td>' +
          '<td>' + window.esc(r.p.establecimiento) + '<div class="mini">' + window.esc(r.p.profesion) + ' · ' + window.esc(r.p.codigo) + '</div></td>' +
          '<td>' + window.esc(r.persona) + '</td><td>' + window.esc(r.obs || '—') + '</td>' +
          '<td><button type="button" class="btn sm" data-rev="' + r.p.id + '" title="Revertir adjudicación (pide confirmación)">Revertir</button></td></tr>';
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
            '<div class="note">Las favoritas no se tocan. Si quieres respaldo, usa antes Exportar JSON en el registro.</div>',
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
        html: '<div class="mini"><b>' + window.esc(f.name) + '</b><br>' + ((d.favoritas || []).length) + ' favoritas · ' + Object.keys(d.adjudicadas || {}).length +
              ' adjudicadas · ' + Object.keys(d.bloqueadas || {}).length + ' bloqueadas.</div>' +
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
    el.innerHTML = 'Gestiona tus marcas locales: disponible · ★ favorita · ✓ adjudicada · ✕ bloqueada. ' +
      'Recuerda: no hay servidor integrado de sincronización; se guardan <b>solo en este navegador</b> y se sincronizan entre sus pestañas. ' +
      'No modifican la adjudicación oficial 2026-I; para compartirlas, usa Exportar JSON en el registro.';
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
      if (b) {
        var p = window.App.byId(Number(b.getAttribute('data-id')));
        var a = b.getAttribute('data-a');
        if (!p) return;
        if (a === 'fav') { window.App.toggleFav(p); selPlazaInfo(); }
        else if (a === 'bloq') toggleBloq(p);
        else if (a === 'quickadj') quickAdj(p);
        else if (a === 'select') elegirPlaza(p);
        else if (a === 'detail') window.App.openDetail(p.id);
        return;
      }
      var row = e.target.closest ? e.target.closest('[data-select]') : null;
      if (!row) return;
      var rp = window.App.byId(Number(row.getAttribute('data-select')));
      if (rp) elegirPlaza(rp);
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
    elegirPlaza(p);
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
    selPlazaInfo();
  }

  /* la ficha se construye una vez (conserva lo escrito entre refrescos) */
  function renderForm() {
    var el = document.getElementById('adjForm'); if (!el || el.hasAttribute('data-ready')) return;
    el.setAttribute('data-ready', '1');
    el.innerHTML =
      '<div id="adjEmpty" class="adjempty">' +
        '<div class="adjempty-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M9 8h6M9 12h6M9 16h4"/></svg></div>' +
        '<b>Elige una plaza para empezar</b>' +
        '<p class="mini">Haz clic en una tarjeta de la izquierda o usa el buscador. La ficha y el registro aparecen aquí, sin pasos largos.</p>' +
        '<div class="adjflow"><span>1 · Elige</span><span>2 · Nombre</span><span>3 · Registra</span></div>' +
      '</div>' +
      '<div id="adjFormBody" class="adjformbody" hidden>' +
        '<div id="adjSelCard"></div>' +
        '<label class="adjfield" for="adjPersona"><span>A nombre de <b>*</b></span>' +
          '<input type="text" id="adjPersona" placeholder="Ej: María Quispe — IPRESS / comisión SERUMS" autocomplete="off"></label>' +
        '<div class="adjactions">' +
          '<button type="button" class="btn primary" id="adjGuardar">Registrar adjudicación</button>' +
          '<button type="button" class="btn" id="adjFav" aria-pressed="false"><span aria-hidden="true">☆</span> Favorita</button>' +
          '<button type="button" class="btn" id="adjBloq" aria-pressed="false"><span aria-hidden="true">✕</span> Bloquear</button>' +
          '<button type="button" class="btn" id="adjDetail">Ficha completa</button>' +
          '<button type="button" class="btn" id="adjClose">Cerrar</button>' +
        '</div>' +
        '<details class="acc adjmore"><summary>Fecha, hora y notas (opcional)</summary>' +
          '<div class="frow"><span>Fecha y hora del registro</span><input type="datetime-local" id="adjFecha" value="' + localDT() + '"></div>' +
          '<div class="frow"><span>Observaciones</span><textarea id="adjObs" rows="2" placeholder="Acta, resolución, nota de la sesión…"></textarea></div>' +
        '</details>' +
        '<div id="adjMsg" class="adjmsg" role="status" aria-live="polite"></div>' +
        '<div class="mini adjfine">Tu marca es local y no altera la adjudicación oficial. Se guarda al instante y puedes deshacerla o revertirla.</div>' +
      '</div>';
    document.getElementById('adjGuardar').onclick = registrar;
    document.getElementById('adjFav').onclick = function () { var p = current(); if (!p) return; window.App.toggleFav(p); selPlazaInfo(); };
    document.getElementById('adjBloq').onclick = function () { var p = current(); if (!p) return; toggleBloq(p); };
    document.getElementById('adjDetail').onclick = function () { var p = current(); if (p) window.App.openDetail(p.id); };
    document.getElementById('adjClose').onclick = function () { limpiarForm(true); };
    var pe = document.getElementById('adjPersona');
    if (pe) pe.value = window.Store.get('adj_persona', '') || '';
  }

  return { render: render, badge: badge, toggleBloq: toggleBloq, counts: counts };
})();
