/* =========================================================================
   BLOQUE 2 — APRENDIZAJE, ETIQUETAS Y ESTADÍSTICAS
   Checkpoint: práctica libre, marcas, estadísticas y audio sintetizado.
   ========================================================================= */
var practiceReturn = 'modes';
var statsReturn = 'modes';

function questionTag(id) {
  return (state.questionTags && state.questionTags[id]) || { difficult: false, favorite: false };
}
function tagButtonsHTML(id, compact) {
  var t = questionTag(id);
  return '<span class="tagButtons' + (compact ? ' tagButtons--compact' : '') + '">' +
    '<button type="button" class="tagBtn ' + (t.difficult ? 'is-on tagBtn--difficult' : '') + '" data-action="toggle-question-tag" data-question="' + esc(id) + '" data-tag="difficult" aria-pressed="' + !!t.difficult + '" title="Marcar como difícil">' + icon('flag', 11) + ' Difícil</button>' +
    '<button type="button" class="tagBtn ' + (t.favorite ? 'is-on tagBtn--favorite' : '') + '" data-action="toggle-question-tag" data-question="' + esc(id) + '" data-tag="favorite" aria-pressed="' + !!t.favorite + '" title="Marcar como favorita">' + icon('star', 11) + ' Favorita</button>' +
  '</span>';
}
function toggleQuestionTag(id, tag) {
  if (!QUESTION_BY_ID[id] || (tag !== 'difficult' && tag !== 'favorite')) return;
  var t = Object.assign({ difficult: false, favorite: false }, questionTag(id));
  t[tag] = !t[tag];
  t.updatedAt = nowISO();
  if (!t.difficult && !t.favorite) delete state.questionTags[id];
  else state.questionTags[id] = t;
  persist();
  if (screen === 'duel' || screen === 'review' || screen === 'stats') renderScreen();
  toast(t[tag] ? (tag === 'difficult' ? 'Marcada como difícil.' : 'Marcada como favorita.') : 'Marca retirada.', 'success', 1800);
}
function taggedQuestionIds(tag) {
  return Object.keys(state.questionTags || {}).filter(function (id) {
    var t = state.questionTags[id] || {};
    return QUESTION_BY_ID[id] && (!tag || t[tag]);
  });
}
function reviewTagsHTML() {
  var difficult = taggedQuestionIds('difficult');
  var favorite = taggedQuestionIds('favorite');
  var all = taggedQuestionIds();
  if (!all.length) {
    return '<div class="panel reviewTagsPanel"><div class="reviewListHead"><h2>Marcadas</h2><span class="chip">0</span></div><p class="settingsHelp">Marca una pregunta como difícil o favorita desde cualquier pregunta o desde este errorario. Aparecerá aquí para volver a ella.</p></div>';
  }
  var rows = all.slice(0, 8).map(function (id) {
    var q = QUESTION_BY_ID[id];
    return '<div class="errorRow markedRow"><div class="errorCopy"><b>' + esc(q.stem.slice(0, 135)) + (q.stem.length > 135 ? '…' : '') + '</b><small><span>' + esc(areaName(q.areaId)) + '</span><span>' + (q.cycle || 'SERUMS') + '</span></small></div>' + tagButtonsHTML(id, true) + '</div>';
  }).join('');
  return '<div class="panel reviewTagsPanel"><div class="reviewListHead"><h2>Marcadas</h2><span class="chip chip--gold">' + difficult.length + ' difíciles</span><span class="chip">' + favorite.length + ' favoritas</span></div>' + rows + (all.length > 8 ? '<p class="tiny dim">y ' + (all.length - 8) + ' más…</p>' : '') + '</div>';
}
function areaAccuracy(a) { var n = Number(a && a.answered) || 0; return n ? Math.round((Number(a.correct) || 0) / n * 100) : null; }
function areaAvgSeconds(a) { var n = Number(a && a.answered) || 0; return n && a.totalTimeMs ? (Number(a.totalTimeMs) / n / 1000) : null; }
function areaTrend(areaId) {
  var arr = (state.academic.recent || []).filter(function (r) { return r && r.areaId === areaId; });
  if (arr.length < 4) return null;
  var mid = Math.floor(arr.length / 2);
  var old = arr.slice(0, mid), recent = arr.slice(mid);
  var oldAcc = old.filter(function (r) { return r.correct; }).length / old.length;
  var newAcc = recent.filter(function (r) { return r.correct; }).length / recent.length;
  return Math.round((newAcc - oldAcc) * 100);
}
function statsRecommendation() {
  var candidates = CAMP.areas.map(function (a) {
    var s = state.academic.byArea[a.id] || {};
    return { area: a, answered: Number(s.answered) || 0, accuracy: areaAccuracy(s) };
  }).filter(function (x) { return x.answered >= 3 && x.accuracy != null; });
  candidates.sort(function (a, b) { return a.accuracy - b.accuracy; });
  return candidates[0] || null;
}
function statsScreenHTML() {
  var total = Number(state.academic.answered) || 0;
  var accuracy = total ? Math.round((Number(state.academic.correct) || 0) / total * 100) : 0;
  var avg = total && state.academic.totalTimeMs ? (state.academic.totalTimeMs / total / 1000) : null;
  var weakest = statsRecommendation();
  var dif = taggedQuestionIds('difficult').length, fav = taggedQuestionIds('favorite').length;
  var errors = Object.keys(state.errors).map(function (id) { return state.errors[id]; }).filter(function (e) { return e && QUESTION_BY_ID[e.questionId]; }).sort(function (a, b) { return (Number(b.count) || 0) - (Number(a.count) || 0); }).slice(0, 5);
  var history = (state.modeStats.simulacroHistory || []).slice(0, 4);
  var areaRows = CAMP.areas.map(function (a) {
    var s = state.academic.byArea[a.id] || {};
    var acc = areaAccuracy(s), avgA = areaAvgSeconds(s), trend = areaTrend(a.id);
    return '<div class="statAreaRow"><span class="statAreaName" style="color:' + a.accent + '">' + esc(a.short) + '</span><span class="statAreaData">' + (s.answered || 0) + ' resp. · ' + (acc == null ? '—' : acc + '%') + ' · ' + (avgA == null ? '—' : avgA.toFixed(1) + ' s') + '</span><span class="statTrend ' + (trend == null ? 'is-empty' : trend > 0 ? 'is-up' : trend < 0 ? 'is-down' : '') + '">' + (trend == null ? 'sin tendencia' : trend > 0 ? '↑ +' + trend + ' pts' : trend < 0 ? '↓ ' + trend + ' pts' : '→ estable') + '</span><button type="button" class="btn btn--quiet btn--sm" data-action="start-practice" data-area="' + a.id + '">Practicar</button></div>';
  }).join('');
  var errorRows = errors.length ? errors.map(function (e) {
    var q = QUESTION_BY_ID[e.questionId];
    return '<div class="statErrorRow"><span><b>' + esc(q.stem.slice(0, 115)) + (q.stem.length > 115 ? '…' : '') + '</b><small>' + esc(areaName(q.areaId)) + ' · ' + (e.count || 0) + ' fallos</small></span></div>';
  }).join('') : '<p class="settingsHelp">Todavía no hay fallos registrados. Los errores aparecerán aquí y en el repaso.</p>';
  var histRows = history.length ? history.map(function (h) {
    return '<div class="statHistoryRow"><b>' + (h.accuracy || 0) + '%</b><span>' + esc(h.date || '') + ' · ' + (h.correct || 0) + '/' + (h.total || 0) + ' · ' + (h.passed ? 'superado' : 'registrado') + '</span></div>';
  }).join('') : '<p class="settingsHelp">Aún no hay simulacros guardados.</p>';
  return '<div class="overlay"><div class="overlayShell statsShell">' +
    '<div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot" style="background:var(--teal)"></span>Aprendizaje en el observatorio</span><h1>Lo que la evidencia <em>ya te está diciendo.</em></h1><p>Una lectura neutral de tu práctica. No es una nota ni una etiqueta: es una pista para elegir el siguiente paso.</p></div><div class="sheetHeadSide"><button type="button" class="btn btn--ghost btn--sm" data-action="open-practice">' + icon('bookOpen', 12) + ' Práctica libre</button><button type="button" class="sheetClose" data-action="close-stats" aria-label="Cerrar estadísticas">' + icon('close', 17) + '</button></div></div>' +
    '<div class="statsTop"><div class="stat"><b>' + total + '</b><span>respuestas</span></div><div class="stat stat--accent"><b>' + accuracy + '%</b><span>precisión global</span></div><div class="stat"><b>' + (avg == null ? '—' : avg.toFixed(1) + ' s') + '</b><span>tiempo medio</span></div><div class="stat stat--gold"><b>' + (state.errors ? Object.keys(state.errors).length : 0) + '</b><span>errores guardados</span></div><div class="stat"><b>' + dif + ' / ' + fav + '</b><span>difíciles / favoritas</span></div></div>' +
    '<div class="statsColumns"><section class="panel"><div class="reviewListHead"><h2>Por área</h2><span class="chip">tendencia reciente</span></div><div class="statAreaTable">' + areaRows + '</div><div class="statsRecommendation"><b>Recomendación neutra</b><p>' + (weakest ? 'Tu área con más margen es <b>' + esc(weakest.area.short) + '</b>. Una práctica breve por área puede dar más información.' : 'Aún no hay suficientes respuestas por área para una recomendación estable. Practica un poco más y vuelve a mirar.') + '</p></div></section>' +
      '<section class="panel"><div class="reviewListHead"><h2>Errores frecuentes</h2><span class="chip">' + errors.length + '</span></div>' + errorRows + '<div class="reviewListHead" style="margin-top:12px"><h2>Simulacros</h2><span class="chip">' + history.length + '</span></div>' + histRows + '</section></div>' +
    '<div class="atlasFooter"><span>La precisión y la tendencia se calculan sobre tus respuestas; las marcas son tuyas y no afectan recompensas.</span><button type="button" class="btn btn--ghost btn--sm" data-action="open-practice">' + icon('bookOpen', 11) + ' Elegir área de práctica</button></div>' +
  '</div></div>';
}
function practicePickerHTML() {
  var cards = CAMP.areas.map(function (a) {
    var s = state.academic.byArea[a.id] || {}, acc = areaAccuracy(s);
    return '<button type="button" class="practiceAreaCard" data-action="start-practice" data-area="' + a.id + '"><span class="practiceAreaIcon" style="color:' + a.accent + '">' + (AREA_GLYPHS[a.id] || '✦') + '</span><b>' + esc(a.short) + '</b><small>' + (s.answered || 0) + ' respuestas · ' + (acc == null ? 'sin datos' : acc + '% de precisión') + '</small><span class="practiceAreaGo">' + icon('chevronRight', 12) + '</span></button>';
  }).join('');
  return '<div class="overlay"><div class="overlayShell practiceShell">' +
    '<div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot" style="background:var(--teal)"></span>Práctica libre</span><h1>Elige un área y <em>respira.</em></h1><p>Sin corazones, sin reloj y sin recompensa de cierre. Cada respuesta alimenta tus estadísticas y los errores siguen entrando al repaso.</p></div><div class="sheetHeadSide"><button type="button" class="sheetClose" data-action="close-practice" aria-label="Cerrar práctica">' + icon('close', 17) + '</button></div></div>' +
    '<div class="practiceGrid">' + cards + '</div>' +
    '<div class="atlasFooter"><span>La práctica libre no completa misiones ni entrega monedas de cierre. Aun así, tus aciertos conservan su XP de pregunta.</span></div>' +
  '</div></div>';
}
function openStats() {
  statsReturn = screen === 'pause' ? 'pause' : (screen === 'modes' ? 'modes' : 'modes');
  setScreen('stats');
  initAudio();
  sfxSelect();
}
function closeStats() {
  if (statsReturn === 'pause') { setScreen('pause'); return; }
  openModes();
}
function openPracticePicker() {
  practiceReturn = screen === 'stats' ? 'stats' : 'modes';
  setScreen('practicePicker');
  initAudio();
  sfxSelect();
}
function closePracticePicker() {
  if (practiceReturn === 'stats') { setScreen('stats'); return; }
  openModes();
}
function practiceQuestions(areaId) {
  var qs = modeArrayQuestions().filter(function (q) { return q.areaId === areaId; });
  qs.sort(function (a, b) {
    var sa = state.questions[a.id] || {}, sb = state.questions[b.id] || {};
    var wa = (Number(sa.wrong) || 0) - (Number(sa.correct) || 0), wb = (Number(sb.wrong) || 0) - (Number(sb.correct) || 0);
    if (wa !== wb) return wb - wa;
    return String(a.id).localeCompare(String(b.id));
  });
  return qs.slice(0, 10);
}
function startPractice(areaId) {
  if (session) { toast('Termina la sesión actual antes de iniciar otra.', 'warn'); return; }
  var area = AREA_BY_ID[areaId];
  if (!area) return;
  var qs = practiceQuestions(areaId);
  if (!qs.length) { toast('No hay preguntas disponibles para esta área.', 'warn'); return; }
  var stageTierName = ['iniciacion', 'desarrollo', 'especializacion', 'dominio'][Math.max(0, Math.min(3, (Number(state.stage) || 1) - 1))];
  var tiers = {};
  qs.forEach(function (q) { tiers[q.id] = stageTierName; });
  session = {
    id: uid('practice'), mode: 'practice', missionId: null, areaId: areaId,
    title: 'Práctica libre · ' + area.short, subtitle: 'Sin corazones ni reloj',
    questions: qs.map(function (q) { return q.id; }), questionTiers: tiers,
    cursor: 0, answers: {}, orders: [], hearts: 3, finiteHearts: false, deferred: false,
    timerMode: 'none', startedAt: nowISO(), questionStartedAt: Date.now(),
    questionXp: 0, questionCoins: 0, levelBefore: currentLevel(), coinsBefore: state.coins,
    launchSource: 'modes', finishing: false
  };
  lastFeedback = null; lastResult = null;
  beginDuelStage(areaId); setScreen('duel'); initAudio(); sfxSelect();
}
