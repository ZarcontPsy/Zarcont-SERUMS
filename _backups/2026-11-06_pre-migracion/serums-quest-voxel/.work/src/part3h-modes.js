/* =========================================================================
   BLOQUE 1 — MODOS DE JUEGO
   Reglas tomadas de la app original; sin tocar progreso de campaña.
   Checkpoint: Diario, Supervivencia, Contrarreloj y Simulacro.
   ========================================================================= */
var MODE_DEFS = {
  daily: {
    id: 'daily', label: 'Desafío diario', short: 'Diario',
    description: 'Seis preguntas mezcladas una vez al día. Incluye repaso y una pregunta de mayor exigencia.',
    count: 6, pass: 0.6, rewardXp: 40, rewardCoins: 10
  },
  survival: {
    id: 'survival', label: 'Supervivencia', short: 'Supervivencia',
    description: 'Diez preguntas, tres oportunidades y 45 segundos por pregunta. Dificultad creciente.',
    count: 10, hearts: 3, questionSeconds: 45, rewardXp: 40, rewardCoins: 10
  },
  timed: {
    id: 'timed', label: 'Contrarreloj', short: 'Contrarreloj',
    description: 'Precisión bajo tiempo. Sin retroalimentación hasta el final. La velocidad no compensa un fallo.',
    durations: [180, 300, 480], questionByDuration: { 180: 8, 300: 12, 480: 18 },
    defaultSeconds: 300, minAnswered: 8, pass: 0.7, rewardXp: 25, rewardCoins: 6
  },
  simulacro: {
    id: 'simulacro', label: 'Simulacro', short: 'Simulacro',
    description: 'Veinte preguntas y 15 minutos desde Dominio. Sin pistas; el informe se ve al final.',
    count: 20, seconds: 900, minAnswered: 10, pass: 0.7, minStage: 4,
    rewardXp: 70, rewardCoins: 20
  }
};
function modeArrayQuestions() { return Object.keys(CAMP.questions).map(function (id) { return CAMP.questions[id]; }).filter(function (q) { return q && q.options && q.answer; }); }
function modeSeedRandom(seed) {
  var h = 2166136261;
  String(seed).split('').forEach(function (ch) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); });
  return function () {
    h += 0x6D2B79F5;
    var t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function modeShuffle(list, seed) {
  var out = list.slice(), rand = modeSeedRandom(seed);
  for (var i = out.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)); var t = out[i]; out[i] = out[j]; out[j] = t; }
  return out;
}
function modeSelectByStage(list, count, stage, seed) {
  if (!list.length || !count) return [];
  var sorted = list.slice().sort(function (a, b) { return a.complexity === b.complexity ? a.id.localeCompare(b.id) : a.complexity - b.complexity; });
  var band = Math.max(0, Math.min(3, (Number(stage) || 1) - 1));
  var sliceSize = Math.max(count * 2, Math.ceil(sorted.length * 0.35));
  var start = Math.min(Math.max(0, sorted.length - sliceSize), Math.floor(sorted.length * (band / 4)));
  var pool = sorted.slice(start, start + sliceSize);
  if (pool.length < count) pool = sorted;
  return modeShuffle(pool, seed).slice(0, count);
}
function modeDailyQuestions() {
  var date = dateKey();
  var seed = (state.profile.createdAt || state.profile.name || 'local') + ':' + date;
  var all = modeArrayQuestions();
  var selected = [], seen = {};
  function take(q) { if (!q || seen[q.id] || selected.length >= 6) return false; seen[q.id] = true; selected.push(q); return true; }
  var hard = all.slice().sort(function (a, b) { return (b.complexity || 0) - (a.complexity || 0); })[0];
  take(hard);
  var clinical = all.filter(function (q) { return q.areaId === 'area-psi-cuidado-integral' && !seen[q.id]; }).sort(function (a, b) { return (b.complexity || 0) - (a.complexity || 0); })[0];
  take(clinical);
  var due = dueErrors()[0];
  if (due) take(QUESTION_BY_ID[due.questionId]);
  var areaOrder = modeShuffle(CAMP.areas, seed + ':areas');
  areaOrder.forEach(function (a) {
    if (selected.length >= 6) return;
    var pool = all.filter(function (q) { return q.areaId === a.id && !seen[q.id]; });
    if (pool.length) take(pool[Math.floor(modeSeedRandom(seed + a.id)() * pool.length)]);
  });
  var rest = modeShuffle(all.filter(function (q) { return !seen[q.id] && q.areaId; }), seed + ':rest');
  while (selected.length < 6 && rest.length) take(rest.shift());
  return modeShuffle(selected, seed + ':order').slice(0, 6);
}
function modeTiersFor(mode, questions) {
  return questions.map(function (q, i) {
    if (mode === 'simulacro') return 'dominio';
    if (mode === 'daily') return 'desarrollo';
    if (mode === 'survival') return i < 3 ? 'iniciacion' : (i < 7 ? 'desarrollo' : (state.stage >= 3 ? 'dominio' : 'especializacion'));
    var st = Math.max(1, Math.min(4, Number(state.stage) || 1));
    return ['iniciacion', 'desarrollo', 'especializacion', 'dominio'][st - 1];
  });
}
function modeBuildQuestions(mode, seconds) {
  if (mode === 'daily') return modeDailyQuestions();
  var count = mode === 'survival' ? MODE_DEFS.survival.count : (mode === 'timed' ? MODE_DEFS.timed.questionByDuration[seconds] || MODE_DEFS.timed.questionByDuration[300] : MODE_DEFS.simulacro.count);
  var stage = mode === 'simulacro' ? 4 : (Number(state.stage) || 1);
  var qs = modeSelectByStage(modeArrayQuestions(), count, stage, mode + ':' + dateKey() + ':' + (seconds || '') + ':' + nowISO());
  if (mode === 'survival') qs = qs.sort(function (a, b) { return (a.complexity || 0) - (b.complexity || 0); });
  return qs;
}
function modeDailyAvailable() { return state.modeStats.dailyDate !== dateKey(); }
function modeSimulacroAvailable() { return Number(state.stage) >= 4; }
function modeClaimKey(mode) { return mode + ':' + dateKey(); }
function modeAlreadyClaimed(mode) { return !!state.modeStats.claims[modeClaimKey(mode)]; }
function modeReward(mode) { var d = MODE_DEFS[mode]; return { xp: d.rewardXp, coins: d.rewardCoins }; }
function modeTitle(mode, seconds) {
  if (mode === 'daily') return 'Desafío diario';
  if (mode === 'survival') return 'Supervivencia';
  if (mode === 'timed') return 'Contrarreloj · ' + Math.round((seconds || 300) / 60) + ' min';
  return 'Simulacro · 15 min';
}
function modeAreaBreakdown(session) {
  var out = {};
  CAMP.areas.forEach(function (a) { out[a.id] = { answered: 0, correct: 0, total: 0 }; });
  session.questions.forEach(function (id) { var q = QUESTION_BY_ID[id]; if (q && out[q.areaId]) out[q.areaId].total += 1; });
  session.orders.forEach(function (id) {
    var e = session.answers[id]; var q = QUESTION_BY_ID[id];
    if (!e || !q || !out[q.areaId]) return;
    out[q.areaId].answered += 1;
    if (e.correct) out[q.areaId].correct += 1;
  });
  return out;
}
function modePassInfo(session, result) {
  var answered = result.answered, accuracy = result.accuracy, total = session.questions.length;
  if (session.mode === 'daily') {
    var p = answered >= total && accuracy >= MODE_DEFS.daily.pass;
    return { pass: p, label: p ? 'Desafío diario completado.' : 'El desafío diario exige responder todo y al menos 60 % de aciertos.' };
  }
  if (session.mode === 'survival') {
    var alive = Number(session.hearts) > 0;
    var p2 = alive && result.answered + result.omitted >= total;
    return { pass: p2, label: p2 ? 'Supervivencia completada.' : 'Sin oportunidades restantes: no hay recompensa de finalización.' };
  }
  var cover = total ? result.correct / total : 0;
  var min = session.mode === 'timed' ? MODE_DEFS.timed.minAnswered : MODE_DEFS.simulacro.minAnswered;
  var p3 = cover >= (session.mode === 'timed' ? MODE_DEFS.timed.pass : MODE_DEFS.simulacro.pass) && answered >= min;
  return { pass: p3, label: p3 ? (session.mode === 'timed' ? 'Contrarreloj superado.' : 'Simulacro superado.') : 'La recompensa exige precisión sobre el total y respuestas suficientes.' };
}
function modeCompletionReward(session, result) {
  if (!result.pass) return { xp: 0, coins: 0, reason: result.label, duplicate: false, claimed: false };
  if (modeAlreadyClaimed(session.mode)) return { xp: 0, coins: 0, reason: 'La recompensa de este modo ya fue registrada hoy.', duplicate: true, claimed: false };
  var r = modeReward(session.mode);
  var applied = applyXpCoins(r.xp, r.coins);
  state.modeStats.claims[modeClaimKey(session.mode)] = { xp: applied.coins != null ? r.xp : r.xp, coins: r.coins, at: nowISO() };
  return { xp: r.xp, coins: applied.coinsAdded == null ? r.coins : applied.coinsAdded, reason: 'Cierre de ' + session.title + '.', duplicate: false, claimed: true };
}
function modeTimerRemaining(session) {
  if (!session) return null;
  if (session.timerMode === 'session' && session.endsAt) return Math.max(0, Math.ceil((new Date(session.endsAt).getTime() - Date.now()) / 1000));
  if (session.timerMode === 'question' && session.questionEndsAt) return Math.max(0, Math.ceil((new Date(session.questionEndsAt).getTime() - Date.now()) / 1000));
  return null;
}
function startMode(mode, options) {
  if (session) { toast('Termina la sesión actual antes de iniciar otra.', 'warn'); return; }
  if (!MODE_DEFS[mode]) return;
  if (mode === 'daily' && !modeDailyAvailable()) { toast('El desafío diario de hoy ya fue completado. Vuelve mañana.', 'warn', 4300); return; }
  if (mode === 'simulacro' && !modeSimulacroAvailable()) { toast('El Simulacro se abre en la etapa Dominio (etapa 4).', 'warn', 4300); return; }
  var seconds = Number(options && options.seconds) || MODE_DEFS.timed.defaultSeconds;
  if (mode === 'timed' && MODE_DEFS.timed.durations.indexOf(seconds) === -1) seconds = MODE_DEFS.timed.defaultSeconds;
  var qs = modeBuildQuestions(mode, seconds);
  if (!qs.length) { toast('No hay preguntas disponibles para este modo.', 'warn'); return; }
  var tiers = modeTiersFor(mode, qs);
  var questionTiers = {};
  qs.forEach(function (q, i) { questionTiers[q.id] = tiers[i]; });
  var effectiveSeconds = mode === 'timed' ? Math.round(seconds * (state.settings.extraTime ? 1.25 : 1)) : (mode === 'simulacro' ? MODE_DEFS.simulacro.seconds : 0);
  var at = nowISO();
  session = {
    id: uid('mode'),
    mode: mode,
    missionId: null,
    areaId: qs[0].areaId,
    title: modeTitle(mode, seconds),
    subtitle: MODE_DEFS[mode].description,
    questions: qs.map(function (q) { return q.id; }),
    questionTiers: questionTiers,
    cursor: 0, answers: {}, orders: [],
    hearts: mode === 'survival' ? MODE_DEFS.survival.hearts : 3,
    finiteHearts: mode === 'survival',
    deferred: mode === 'simulacro',
    timerMode: mode === 'survival' ? 'question' : (mode === 'timed' || mode === 'simulacro' ? 'session' : 'none'),
    seconds: effectiveSeconds,
    startedAt: at,
    questionStartedAt: Date.now(),
    questionEndsAt: mode === 'survival' ? new Date(Date.now() + MODE_DEFS.survival.questionSeconds * 1000).toISOString() : null,
    endsAt: (mode === 'timed' || mode === 'simulacro') ? new Date(Date.now() + effectiveSeconds * 1000).toISOString() : null,
    questionXp: 0, questionCoins: 0,
    levelBefore: currentLevel(), coinsBefore: state.coins,
    launchSource: 'modes', modeSeconds: seconds, finishing: false
  };
  lastFeedback = null;
  lastResult = null;
  beginDuelStage(qs[0].areaId);
  setScreen('duel');
  initAudio();
  sfxSelect();
}
function armModeQuestionTimer() {
  if (!session || session.mode !== 'survival') return;
  session.questionStartedAt = Date.now();
  session.questionEndsAt = new Date(Date.now() + MODE_DEFS.survival.questionSeconds * 1000).toISOString();
  session.timeoutHandled = false;
}
function modeTimeoutCurrent() {
  if (!session || session.finishing) return;
  if (session.timerMode === 'session') {
    finishSession('time');
    return;
  }
  if (session.timerMode !== 'question' || session.answers[session.questions[session.cursor]] || session.timeoutHandled) return;
  var q = currentQuestion();
  if (!q) return;
  session.timeoutHandled = true;
  var applied = applyQuestionResult(q.id, null, MODE_DEFS.survival.questionSeconds * 1000, session);
  if (!applied) return;
  var answerOption = q.options.filter(function (o) { return o.id === q.answer; })[0];
  session.answers[q.id] = { questionId: q.id, chosen: null, chosenText: '', correct: false, omitted: true, timeExpired: true, at: nowISO(), answer: q.answer, answerText: answerOption ? answerOption.text : '', xp: 0, coins: 0, reason: 'Sin respuesta dentro del tiempo.' };
  session.orders.push(q.id);
  session.hearts = Math.max(0, session.hearts - 1);
  lastFeedback = { correct: false, chosen: null, answer: q.answer, answerText: answerOption ? answerOption.text : '', xp: 0, coins: 0, reason: 'Sin respuesta dentro del tiempo.', timeout: true, shownAt: performance.now() };
  guardianAttackVisual();
  triggerHeroHurt();
  persist();
  renderScreen();
}
function updateModeClock() {
  if (!session || screen !== 'duel') return;
  var el = document.querySelector('[data-mode-timer]');
  var remaining = modeTimerRemaining(session);
  if (el) {
    if (remaining == null) { el.classList.add('hidden'); }
    else {
      el.classList.remove('hidden');
      var m = Math.floor(remaining / 60), s = remaining % 60;
      el.innerHTML = '<b>' + m + ':' + String(s).padStart(2, '0') + '</b><small>' + (session.timerMode === 'session' ? 'restante' : 'pregunta') + '</small>';
      el.classList.toggle('is-low', remaining <= 10);
    }
  }
  if (remaining != null && remaining <= 0) modeTimeoutCurrent();
}
function modesScreenHTML() {
  var char = selectedCharacter(), look = selectedLook();
  var dailyDone = !modeDailyAvailable();
  var simLocked = !modeSimulacroAvailable();
  var timedSecs = [180, 300, 480];
  var hist = (state.modeStats.simulacroHistory || []).slice(0, 4);
  return '<div class="overlay"><div class="overlayShell modesShell">' +
    '<div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot"></span>Modos del observatorio</span><h1>Elige cómo <em>poner a prueba tu criterio.</em></h1><p>Los modos usan el mismo banco de preguntas y el mismo repaso espaciado. No completan misiones ni sustituyen el avance de la campaña.</p></div><div class="sheetHeadSide"><button type="button" class="sheetClose" data-action="close-sheet" aria-label="Cerrar modos">' + icon('close', 17) + '</button></div></div>' +
    '<div class="modesHeroBar"><img src="' + renderHeroPortrait(char.id, 92) + '" alt="" /><div><small>' + esc(look.klass) + ' en ruta</small><b>' + esc(char.name) + '</b><span>' + (titleText(char.id) ? '«' + esc(titleText(char.id)) + '»' : 'Sin título equipado') + '</span></div><span class="chip">Nv ' + levelAt(state.xp).level + '</span><span class="chip">' + icon('coin', 11) + ' ' + formatNumber(state.coins) + '</span></div>' +
    '<div class="modesGrid">' +
      '<article class="modeCard modeCard--daily"><div class="modeCardTop"><span class="modeGlyph">' + icon('sun', 20) + '</span><span class="chip">Una vez al día</span></div><h2>Desafío diario</h2><p>' + esc(MODE_DEFS.daily.description) + '</p><ul><li>6 preguntas mezcladas de las 5 áreas</li><li>Primer intento completado queda registrado hoy</li><li>Cuenta para tu racha de estudio</li><li>Recompensa: +40 XP · +10 ◇ (una vez al día, dentro del tope)</li></ul><div class="modeMeta"><span>' + (dailyDone ? 'Completado hoy' : 'Disponible ahora') + '</span><span>Racha: ' + (state.daily.streak || 0) + ((Number(state.daily.streak) || 0) === 1 ? ' día' : ' días') + '</span></div><button type="button" class="btn btn--primary btn--block" data-action="start-mode" data-mode="daily" ' + (dailyDone ? 'disabled' : '') + '>' + (dailyDone ? 'Vuelve mañana' : 'Empezar desafío') + '</button></article>' +
      '<article class="modeCard modeCard--survival"><div class="modeCardTop"><span class="modeGlyph">' + icon('shield', 20) + '</span><span class="chip">3 oportunidades</span></div><h2>Supervivencia</h2><p>' + esc(MODE_DEFS.survival.description) + '</p><ul><li>10 preguntas, dificultad creciente</li><li>45 s por pregunta y 3 vidas</li><li>Récord personal: ' + (state.modeStats.survivalBest || 0) + ' aciertos</li><li>Recompensa: +40 XP · +10 ◇ si terminas con vida</li></ul><div class="modeMeta"><span>' + (state.modeStats.survivalWins || 0) + ' supervivencias</span><span>Sin pérdida de monedas</span></div><button type="button" class="btn btn--primary btn--block" data-action="start-mode" data-mode="survival">Empezar Supervivencia</button></article>' +
      '<article class="modeCard modeCard--timed"><div class="modeCardTop"><span class="modeGlyph">' + icon('clock', 20) + '</span><span class="chip">Contra el reloj</span></div><h2>Contrarreloj</h2><p>' + esc(MODE_DEFS.timed.description) + '</p><ul><li>Elige 3, 5 u 8 minutos</li><li>8, 12 o 18 preguntas; clave tras cada respuesta</li><li>70 % del total y mínimo 8 respuestas</li><li>Recompensa: +25 XP · +6 ◇ si superas</li></ul><div class="modeMeta"><span>' + (state.settings.extraTime ? 'Tiempo ampliado +25 %' : 'Tiempo original') + '</span><span>' + (state.modeStats.timedRuns || 0) + ' sesiones</span></div><div class="timedChoices">' + [180, 300, 480].map(function (s) { return '<button type="button" class="btn btn--ghost btn--sm" data-action="start-mode" data-mode="timed" data-seconds="' + s + '">' + (s / 60) + ' min · ' + MODE_DEFS.timed.questionByDuration[s] + ' preg.</button>'; }).join('') + '</div></article>' +
      '<article class="modeCard modeCard--sim"><div class="modeCardTop"><span class="modeGlyph">' + icon('seal', 20) + '</span><span class="chip">' + (simLocked ? 'Dominio' : '20 preguntas') + '</span></div><h2>Simulacro</h2><p>' + esc(MODE_DEFS.simulacro.description) + '</p><ul><li>20 preguntas y 15 minutos</li><li>Sin retroalimentación hasta el informe final</li><li>Desglose por área y errores al repaso</li><li>Recompensa: +70 XP · +20 ◇ si superas</li></ul>' + (simLocked ? '<div class="modeLock">' + icon('lock', 13) + ' Se abre en etapa Dominio (4). Tu etapa actual: ' + state.stage + '.</div>' : '<div class="modeMeta"><span>' + (state.modeStats.simulacros || 0) + ' simulacros superados</span><span>' + (state.settings.extraTime ? 'Tiempo base' : '15 min') + '</span></div><button type="button" class="btn btn--primary btn--block" data-action="start-mode" data-mode="simulacro">Empezar Simulacro</button>') + (hist.length ? '<div class="modeHistory"><span class="eyebrow noRule">Últimos simulacros</span>' + hist.map(function (h) { return '<div><b>' + esc(h.accuracy + '%') + '</b><span>' + esc(h.date || '') + ' · ' + h.correct + '/' + h.total + '</span></div>'; }).join('') + '</div>' : '') + '</article>' +
    '</div>' +
    '<div class="modeQuickLinks"><button type="button" class="btn btn--ghost btn--sm" data-action="open-practice">' + icon('bookOpen', 12) + ' Práctica libre por área</button><button type="button" class="btn btn--ghost btn--sm" data-action="open-stats">' + icon('chart', 12) + ' Estadísticas de aprendizaje</button></div>' +
    '<div class="atlasFooter"><span>Las recompensas de cierre de cada modo se registran una vez al día. Los errores entran al repaso espaciado. Sin atajos sobre misiones ni desbloqueos de campaña.</span><span>' + icon('shield', 11) + ' Sin pérdida de monedas por fallar.</span></div>' +
  '</div></div>';
}
function openModes() {
  if (screen === 'duel') return;
  sheetReturn = screen === 'title' ? 'title' : (screen === 'pause' ? 'pause' : 'hub');
  setScreen('modes');
  initAudio();
  sfxSelect();
}
