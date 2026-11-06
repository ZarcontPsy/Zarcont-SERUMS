/* =========================================================================
   FLUJO DE JUEGO — campaña, duelos, repaso, importación y bucle principal
   ========================================================================= */
var lastPhasePosted = '';
var autoLastAction = 0;
var mapAutoplayFrozen = false;
var settingsReturn = 'title';
var mapReturnScreen = 'hub';

function enterGame() {
  if (pausedDuel && session) { resumeSuspendedDuel(); return; }
  initAudio();
  gateGroups.forEach(function (g) { g.label.visible = true; });
  sfxSelect();
  if (hasProgress()) sfxClick();
  if (state.importedAt && !state._importToastShown) {
    state._importToastShown = true;
    toast('Partida importada. Tus rutas y tu colección están en el observatorio.', 'success', 4200);
  }
  enterHub();
}
function enterHub() {
  if (pausedDuel && session) {
    cameraMode = 'title';
    setScreen('title');
    return;
  }
  if (session) {
    // No se abandona una sesión por accidente desde una pantalla de menú.
    if (screen === 'pause' && pauseReturn === 'duel') { setScreen('duel'); return; }
  }
  if (arenaGroup.visible) endDuelStage();
  lastResult = null;
  lastFeedback = null;
  session = null;
  sheetReturn = 'hub';
  cameraMode = 'hub';
  view = 'hub';
  setScreen('hub');
  updateInteract();
}
function enterTitle() {
  if (pausedDuel && session) {
    cameraMode = 'title';
    view = 'hub';
    setScreen('title');
    return;
  }
  if (arenaGroup.visible) endDuelStage();
  gateGroups.forEach(function (g) { g.label.visible = false; });
  session = null;
  lastFeedback = null;
  lastResult = null;
  sheetReturn = 'hub';
  cameraMode = 'title';
  view = 'hub';
  setScreen('title');
  sfxSelect();
}
function resumeSuspendedDuel() {
  if (!pausedDuel || !session) return;
  pausedDuel = false;
  cameraMode = 'duel';
  setScreen('duel');
  sfxSelect();
}
function suspendDuelToMap() {
  if (!session) { openMap(); return; }
  pausedDuel = true;
  pauseReturn = 'duel';
  openMap();
}
function suspendDuelToMenu() {
  if (!session) { enterTitle(); return; }
  pausedDuel = true;
  pauseReturn = 'duel';
  cameraMode = 'title';
  setScreen('title');
  sfxSelect();
}
function menuContinue() {
  if (pausedDuel && session) { resumeSuspendedDuel(); return; }
  enterGame();
}
function openSettings() {
  if (screen === 'duel') return;
  settingsReturn = screen === 'pause' ? 'pause' : (screen === 'title' ? 'title' : 'hub');
  setScreen('settings');
  sfxSelect();
}
function closeSettings() {
  var target = settingsReturn || 'title';
  settingsReturn = 'title';
  if (target === 'pause') { setScreen('pause'); return; }
  if (target === 'title') { enterTitle(); return; }
  enterHub();
}
function closeSheet() {
  if (sheetReturn === 'title') {
    sheetReturn = 'hub';
    enterTitle();
    return;
  }
  if (sheetReturn === 'pause') {
    sheetReturn = 'hub';
    setScreen('pause');
    return;
  }
  if (sheetReturn === 'result' && lastResult) {
    sheetReturn = 'hub';
    setScreen('result');
    return;
  }
  if (sheetReturn === 'heroes') {
    sheetReturn = 'hub';
    openHeroes();
    return;
  }
  enterHub();
}
function openJournal(areaId, missionId) {
  if (screen === 'duel') return;
  sheetReturn = screen === 'title' ? 'title' : (screen === 'pause' ? 'pause' : 'hub');
  if (areaId && AREA_BY_ID[areaId]) selectedAreaId = areaId;
  if (missionId && MISSION_BY_ID[missionId]) selectedMissionId = missionId;
  setScreen('journal');
  sfxSelect();
}
function openHeroes() {
  if (screen === 'duel') return;
  sheetReturn = screen === 'title' ? 'title' : (screen === 'pause' ? 'pause' : 'hub');
  setScreen('heroes');
  sfxSelect();
}
function openRecruit(heroId) {
  var char = CHARACTER_BY_ID[heroId];
  if (!char) return;
  if (state.collection.ownedCharacterIds.indexOf(heroId) !== -1) {
    selectHero(heroId);
    return;
  }
  recruitHeroId = heroId;
  sheetReturn = 'heroes';
  setScreen('recruit');
  sfxSelect();
}
function confirmRecruit() {
  var id = recruitHeroId;
  if (!id) return;
  var result = purchaseHero(id);
  if (!result.ok) {
    toast(result.reason || 'No se pudo reclutar al héroe.', 'error');
    renderScreen();
    return;
  }
  recruitHeroId = null;
  sheetReturn = 'hub';
  syncHUD();
  setScreen('heroes');
  toast(result.char.name + ' se une al observatorio' + (result.free ? ' como recompensa de recorrido.' : ' por ' + formatNumber(result.price) + ' monedas.'), 'success', 4200);
  sfxVictory();
}
function openReview() {
  if (screen === 'duel') return;
  sheetReturn = screen === 'title' ? 'title' : (screen === 'pause' ? 'pause' : (screen === 'result' ? 'result' : 'hub'));
  setScreen('review');
  sfxSelect();
}
function openImport() {
  if (screen === 'duel') return;
  sheetReturn = screen === 'title' ? 'title' : (screen === 'pause' ? 'pause' : 'hub');
  importError = '';
  importPreview = null;
  importText = '';
  setScreen('import');
  initAudio();
}
function openPause() {
  if (screen === 'pause' || screen === 'result') return;
  pauseReturn = screen === 'duel' ? 'duel' : 'hub';
  sheetReturn = 'hub';
  setScreen('pause');
  sfxSelect();
}
function openShop() {
  if (screen === 'duel') return;
  sheetReturn = screen === 'pause' ? 'pause' : (screen === 'title' ? 'title' : 'hub');
  shop.active = true;
  setScreen('shop');
  sfxSelect();
}
function closePause() {
  if (pauseReturn === 'duel' && session) {
    setScreen('duel');
  } else {
    pauseReturn = 'hub';
    enterHub();
  }
}
function selectArea(areaId) {
  if (!AREA_BY_ID[areaId]) return;
  selectedAreaId = areaId;
  selectedMissionId = null;
  selectedMissionForArea();
  renderScreen();
  sfxClick();
}
function selectMission(missionId) {
  if (!MISSION_BY_ID[missionId]) return;
  selectedMissionId = missionId;
  selectedAreaId = MISSION_BY_ID[missionId].areaId;
  renderScreen();
  sfxClick();
}
function selectHero(heroId) {
  if (state.collection.ownedCharacterIds.indexOf(heroId) === -1) return;
  if (state.collection.selectedCharacterId === heroId) return;
  state.collection.selectedCharacterId = heroId;
  persist();
  rebuildWorldSelection();
  if (screen === 'heroes') renderScreen();
  syncHUD();
  sfxSelect();
  toast(heroName(heroId) + ' toma el relevo en el observatorio.', 'success');
}
function launchMission(missionId) {
  if (session) { toast('Ya hay un duelo en curso.', 'warn'); return; }
  var mission = MISSION_BY_ID[missionId];
  if (!mission) { toast('Esa ruta no está en la campaña actual.', 'error'); return; }
  var info = missionUnlockInfo(mission);
  if (!info.unlocked) {
    toast('Aún faltan requisitos para abrir esta ruta.', 'warn');
    return;
  }
  var qids = mission.questionIds.filter(function (id) { return !!QUESTION_BY_ID[id]; });
  if (!qids.length) { toast('Esta ruta no tiene preguntas disponibles.', 'error'); return; }
  var launchSource = mapLaunchPending ? 'map' : 'hub';
  mapLaunchPending = false;
  session = {
    id: uid('duel'),
    launchSource: launchSource,
    mode: mission.kind === 'boss' ? 'boss' : 'mission',
    missionId: mission.id,
    areaId: mission.areaId,
    title: mission.title,
    subtitle: mission.subtitle,
    questions: qids,
    cursor: 0,
    answers: {},
    orders: [],
    hearts: Number(RULES.duelHearts) || Number(RULES.hearts) || 3,
    startedAt: nowISO(),
    questionStartedAt: Date.now(),
    questionXp: 0,
    questionCoins: 0,
    levelBefore: currentLevel(),
    coinsBefore: state.coins,
    finishing: false
  };
  lastFeedback = null;
  lastResult = null;
  beginDuelStage(mission.areaId);
  setScreen('duel');
  initAudio();
  sfxSelect();
}
function launchReview(mode) {
  if (session) { toast('Termina el duelo actual antes de iniciar otro repaso.', 'warn'); return; }
  var candidates;
  if (mode === 'early') {
    candidates = Object.keys(state.errors).map(function (id) { return state.errors[id]; })
      .filter(function (e) { return e && QUESTION_BY_ID[e.questionId]; })
      .sort(function (a, b) {
        var ad = parseDate(a.nextReviewAt), bd = parseDate(b.nextReviewAt);
        return (ad ? ad.getTime() : 0) - (bd ? bd.getTime() : 0);
      });
  } else {
    candidates = dueErrors();
  }
  var unique = [], seen = {};
  candidates.forEach(function (e) {
    if (seen[e.questionId] || unique.length >= (Number(RULES.reviewPerSession) || 8)) return;
    seen[e.questionId] = true;
    unique.push(e.questionId);
  });
  if (!unique.length) { toast('Todavía no hay preguntas listas para repaso. Un fallo se programa a los 20 minutos.', 'warn', 4300); return; }
  var firstQ = QUESTION_BY_ID[unique[0]];
  session = {
    id: uid('review'),
    mode: 'review',
    reviewKind: mode,
    reviewOnTime: mode === 'due' && unique.every(function (id) {
      var e = state.errors[id];
      var due = e ? parseDate(e.nextReviewAt) : null;
      return !due || (Date.now() >= due.getTime() && Date.now() - due.getTime() <= 86400000);
    }),
    missionId: null,
    areaId: firstQ.areaId,
    title: 'Repaso de errores',
    subtitle: mode === 'early' ? 'Práctica anticipada de tu errorario' : 'Preguntas que ya toca volver a mirar',
    questions: unique,
    cursor: 0,
    answers: {},
    orders: [],
    hearts: Number(RULES.duelHearts) || Number(RULES.hearts) || 3,
    startedAt: nowISO(),
    questionStartedAt: Date.now(),
    questionXp: 0,
    questionCoins: 0,
    levelBefore: currentLevel(),
    coinsBefore: state.coins,
    finishing: false
  };
  lastFeedback = null;
  lastResult = null;
  beginDuelStage(firstQ.areaId);
  setScreen('duel');
  initAudio();
  sfxSelect();
}
function answerCurrent(letter) {
  if (screen !== 'duel' || !session || session.finishing || lastFeedback) return;
  var q = currentQuestion();
  if (!q) return;
  var chosen = String(letter || '').toUpperCase();
  if (!q.options.some(function (o) { return o.id === chosen; })) return;
  var duration = Math.max(0, Date.now() - session.questionStartedAt);
  var applied = applyQuestionResult(q.id, chosen, duration, session);
  if (!applied) return;
  var chosenOption = q.options.filter(function (o) { return o.id === chosen; })[0];
  var answerOption = q.options.filter(function (o) { return o.id === q.answer; })[0];
  session.answers[q.id] = {
    questionId: q.id,
    chosen: chosen,
    chosenText: chosenOption ? chosenOption.text : '',
    correct: applied.correct,
    omitted: false,
    at: nowISO(),
    answer: q.answer,
    answerText: answerOption ? answerOption.text : '',
    xp: applied.xp,
    coins: applied.coins,
    reason: applied.reason
  };
  session.orders.push(q.id);
  session.questionXp += applied.xp;
  session.questionCoins += applied.coins;
  if (!applied.correct && (session.mode === 'mission' || session.mode === 'boss' || session.mode === 'review' || session.mode === 'survival')) session.hearts = Math.max(0, session.hearts - 1);
  lastFeedback = {
    correct: applied.correct,
    chosen: chosen,
    answer: q.answer,
    answerText: answerOption ? answerOption.text : '',
    xp: applied.xp,
    coins: applied.coins,
    reason: applied.reason,
    suppressed: applied.suppressed,
    deferred: !!session.deferred,
    shownAt: performance.now()
  };
  if (session.deferred) {
    // La corrección no se revela hasta el informe final.
    lastFeedback.deferred = true;
  } else if (applied.correct) {
    triggerHeroAttack();
    window.setTimeout(function () { sfxCorrect(); }, 150);
  } else {
    guardianAttackVisual();
    triggerHeroHurt();
    window.setTimeout(function () { sfxWrong(); }, 110);
  }
  persist();
  renderScreen();
}
function nextQuestion() {
  if (screen !== 'duel' || !session || !lastFeedback || session.finishing) return;
  if (session.hearts <= 0 && (session.mode === 'survival' || session.mode === 'mission' || session.mode === 'boss' || session.mode === 'review')) { finishSession('hearts'); return; }
  if (session.cursor >= session.questions.length - 1) { finishSession('completed'); return; }
  session.cursor += 1;
  session.questionStartedAt = Date.now();
  if (session.mode === 'survival') armModeQuestionTimer();
  lastFeedback = null;
  sfxSelect();
  renderScreen();
}
function finishSession(reason) {
  if (!session || session.finishing) return;
  session.finishing = true;
  var finishedSession = session;
  var result = sessionResult(finishedSession, reason);
  var completion = { xp: 0, coins: 0, reason: result.label, duplicate: false };
  if (result.pass) completion = calcCompletionReward(finishedSession, result);
  var newlyCompleted = false;
  var wasCompleted = false;
  var at = nowISO();
  if (finishedSession.mode === 'mission' || finishedSession.mode === 'boss') {
    var prior = state.missions[finishedSession.missionId] || {
      id: finishedSession.missionId,
      kind: finishedSession.mode === 'boss' ? 'boss' : 'mission',
      areaId: finishedSession.areaId,
      attempts: 0,
      completedAt: null,
      bestScore: 0,
      bestAccuracy: 0
    };
    wasCompleted = !!prior.completedAt;
    prior.attempts = (Number(prior.attempts) || 0) + 1;
    prior.lastAt = at;
    prior.lastScore = result.correct * 100;
    prior.lastAccuracy = result.accuracy;
    prior.bestScore = Math.max(Number(prior.bestScore) || 0, result.correct * 100);
    prior.bestAccuracy = Math.max(Number(prior.bestAccuracy) || 0, result.accuracy);
    if (result.pass && !prior.completedAt) { prior.completedAt = at; newlyCompleted = true; }
    if (result.pass) prior.passedAt = at;
    state.missions[finishedSession.missionId] = prior;
  }
  state.academic.sessions = (Number(state.academic.sessions) || 0) + 1;
  if (finishedSession.mode === 'daily' || finishedSession.mode === 'survival' || finishedSession.mode === 'timed' || finishedSession.mode === 'simulacro') {
    var ms = state.modeStats;
    if (finishedSession.mode === 'daily') {
      ms.dailyDate = dateKey();
      if (result.pass) ms.dailyWins = (Number(ms.dailyWins) || 0) + 1;
    } else if (finishedSession.mode === 'survival') {
      ms.survivalBest = Math.max(Number(ms.survivalBest) || 0, result.correct);
      if (result.pass) ms.survivalWins = (Number(ms.survivalWins) || 0) + 1;
    } else if (finishedSession.mode === 'timed') {
      ms.timedRuns = (Number(ms.timedRuns) || 0) + 1;
      ms.timedBest = Math.max(Number(ms.timedBest) || 0, result.accuracy);
      if (result.correct >= 10 && result.accuracy >= 0.85) ms.timedAce = (Number(ms.timedAce) || 0) + 1;
    } else if (finishedSession.mode === 'simulacro') {
      if (result.pass) ms.simulacros = (Number(ms.simulacros) || 0) + 1;
      var breakdown = modeAreaBreakdown(finishedSession);
      ms.simulacroHistory = (Array.isArray(ms.simulacroHistory) ? ms.simulacroHistory : []);
      ms.simulacroHistory.unshift({ date: dateKey(), accuracy: Math.round(result.accuracy * 100), correct: result.correct, total: result.total, passed: result.pass, areas: breakdown });
      ms.simulacroHistory = ms.simulacroHistory.slice(0, 30);
    }
  }
  if (finishedSession.mode === 'review') {
    state.reviews.completed = (Number(state.reviews.completed) || 0) + 1;
    state.reviews.lastCompletedDate = dateKey();
    if (finishedSession.reviewKind === 'early') state.reviews.earlySessions = (Number(state.reviews.earlySessions) || 0) + 1;
    else if (finishedSession.reviewOnTime) state.reviews.onTimeSessions = (Number(state.reviews.onTimeSessions) || 0) + 1;
  }
  var streakResult = recordLearningDay(at);
  var stageChange = evaluateStage();
  var achievements = checkAchievements();
  if (achievements.length) window.setTimeout(function () { sfxAchievement(); }, 260);
  var unlockedCharacters = syncCharacters();
  var newCosmetics = unlockProgressCosmetics();
  var levelAfter = currentLevel();
  var entries = finishedSession.orders.map(function (id) { return finishedSession.answers[id]; }).filter(Boolean);
  var modeAreas = (finishedSession.mode === 'daily' || finishedSession.mode === 'survival' || finishedSession.mode === 'timed' || finishedSession.mode === 'simulacro' || finishedSession.mode === 'practice') ? modeAreaBreakdown(finishedSession) : null;
  var achievementXp = achievements.reduce(function (n, a) { return n + (Number(a.xp) || 0); }, 0);
  var achievementCoins = achievements.reduce(function (n, a) { return n + (Number(a.coins) || 0); }, 0);
  var dueAfter = dueErrors().length;
  lastResult = {
    mode: finishedSession.mode,
    missionId: finishedSession.missionId,
    launchSource: finishedSession.launchSource || 'hub',
    areaId: finishedSession.areaId,
    title: finishedSession.title,
    subtitle: finishedSession.subtitle,
    pass: !!result.pass,
    reason: result.label,
    correct: result.correct,
    wrong: result.wrong,
    omitted: result.omitted,
    answered: result.answered,
    total: result.total,
    accuracy: result.accuracy,
    score: result.correct * 100,
    questionXp: finishedSession.questionXp,
    questionCoins: finishedSession.questionCoins,
    completion: completion,
    achievements: achievements,
    unlockedCharacters: unlockedCharacters,
    newCosmetics: newCosmetics,
    streakResult: streakResult,
    stageChange: stageChange,
    capReached: dailyCoinCapReached(),
    newlyCompleted: newlyCompleted,
    wasCompleted: wasCompleted,
    heartsRemaining: finishedSession.hearts,
    levelBefore: finishedSession.levelBefore,
    levelAfter: levelAfter,
    rankAfter: currentRank().name,
    entries: entries,
    dueAfter: dueAfter,
    errorsScheduled: entries.filter(function (e) { return !e.correct; }).length,
    modeAreas: modeAreas,
    modeSeconds: finishedSession.modeSeconds || null,
    survivalBest: state.modeStats.survivalBest,
    timedBest: state.modeStats.timedBest,
    simulacroHistory: state.modeStats.simulacroHistory,
    isMode: ['daily', 'survival', 'timed', 'simulacro', 'practice'].indexOf(finishedSession.mode) !== -1,
    finishedAt: at
  };
  lastResult.xpEarned = lastResult.questionXp + (completion.xp || 0) + achievementXp;
  lastResult.coinsEarned = Math.max(0, state.coins - (Number(finishedSession.coinsBefore) || 0));
  state.academic.lastResultAt = at;
  state.activeSession = null;
  session = null;
  pausedDuel = false;
  lastFeedback = null;
  persist();
  if (lastResult.pass) {
    triggerHeroCelebrate();
    if (guardian) {
      spawnSparksAt(arenaWorld(duelPositions.guardian).add(new THREE.Vector3(0, 1.8, 0)), guardian.accent, 22);
      guardian.root.visible = false;
    }
    window.setTimeout(function () { sfxVictory(); }, 140);
  } else {
    if (guardian) {
      guardian.root.visible = false;
      spawnSparksAt(arenaWorld(duelPositions.hero).add(new THREE.Vector3(0, 1.4, 0)), '#ff8b9d', 10);
    }
    window.setTimeout(function () { sfxDefeat(); }, 140);
  }
  setScreen('result');
}
function resultContinue() {
  if (!lastResult) { enterHub(); return; }
  var fromModes = !!lastResult.isMode;
  var fromMap = lastResult.launchSource === 'map';
  var missionId = lastResult.missionId;
  var passed = !!lastResult.pass;
  var newlyCompleted = !!lastResult.newlyCompleted;
  lastResult = null;
  if (arenaGroup.visible) endDuelStage();
  if (fromModes) { openModes(); return; }
  if (fromMap) {
    openMap(missionId);
    if (passed) toast(newlyCompleted ? 'El siguiente tramo del mapa se ha encendido.' : 'El guardián queda atrás. La puerta sigue abierta.', 'success', 3200);
    return;
  }
  enterHub();
}
function resultReplay() {
  if (!lastResult) return;
  if (lastResult.isMode) {
    var mode = lastResult.mode;
    var secs = lastResult.modeSeconds;
    var practiceArea = lastResult.areaId;
    lastResult = null;
    lastFeedback = null;
    if (mode === 'daily' && !modeDailyAvailable()) { toast('El desafío diario de hoy ya fue completado.', 'warn', 3500); openModes(); return; }
    if (mode === 'practice') { startPractice(practiceArea); return; }
    startMode(mode, { seconds: secs });
    return;
  }
  if (!lastResult.missionId) return;
  var id = lastResult.missionId;
  var fromMap = lastResult.launchSource === 'map';
  lastResult = null;
  lastFeedback = null;
  mapLaunchPending = fromMap;
  launchMission(id);
}
function exitToTitle() {
  if (session) { toast('Cierra el duelo antes de volver al título.', 'warn'); return; }
  enterTitle();
}
function toggleSound() {
  setSoundEnabled(!state.settings.sound);
  if (screen === 'title' || screen === 'pause' || screen === 'settings') renderScreen();
  syncHUD();
  toast(state.settings.sound ? 'Sonido activado.' : 'Sonido silenciado.', state.settings.sound ? 'success' : 'warn', 2200);
}
function toggleAmbient() {
  setAmbientEnabled(!state.settings.ambient);
  if (screen === 'pause' || screen === 'settings') renderScreen();
  toast(state.settings.ambient ? 'Ambiente activado.' : 'Ambiente desactivado.', state.settings.ambient ? 'success' : 'warn', 2200);
}
function toggleMuted() {
  setMuted(!state.settings.muted);
  if (screen === 'pause' || screen === 'settings' || screen === 'title') renderScreen();
  toast(state.settings.muted ? 'Silencio total activado.' : 'Silencio total desactivado.', state.settings.muted ? 'warn' : 'success', 2200);
}
function analyzeImport(text) {
  importText = String(text || '');
  try {
    var parsed = parseLegacyProgress(importText);
    importPreview = parsed;
    importError = '';
    sfxSelect();
  } catch (e) {
    importPreview = null;
    importError = e && e.message ? e.message : 'No se pudo interpretar la partida.';
    toast(importError, 'error', 5000);
  }
  if (screen === 'import') {
    renderScreen();
    window.setTimeout(function () {
      var target = EL.screen.querySelector('.importPreview') || EL.screen.querySelector('.notice');
      if (target && target.scrollIntoView) target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 60);
  }
}
function confirmImport() {
  if (!importPreview) return;
  var destination = sheetReturn;
  var summary = importPreview.summary;
  if (recoveryInfo.corrupt && recoveryInfo.raw) {
    try { window.localStorage.setItem(CORRUPT_KEY, recoveryInfo.raw); } catch (e) {}
  }
  recoveryLock = false;
  recoveryInfo.corrupt = false;
  applyLegacyImport(importPreview.state);
  importPreview = null;
  importError = '';
  importText = '';
  session = null;
  lastFeedback = null;
  lastResult = null;
  if (arenaGroup.visible) endDuelStage();
  pausedDuel = false;
  var rewardUnlocks = syncCharacters();
  healEquippedOutfits();
  var importedCosmetics = unlockProgressCosmetics();
  if (rewardUnlocks.length || importedCosmetics.length) persist();
  rebuildHeroAvatar();
  syncHudPortrait();
  if (destination === 'title') enterTitle(); else enterHub();
  toast('Partida importada: ' + summary.name + ' · nivel ' + summary.level + ' · ' + summary.ownedCosmetics + ' cosméticos.', 'success', 5000);
  if (rewardUnlocks.length) {
    window.setTimeout(function () {
      toast(rewardUnlocks.map(function (c) { return c.name; }).join(', ') + ' se unió por tus misiones completadas.', 'success', 5000);
    }, 1200);
  }
  if (importedCosmetics.length) {
    window.setTimeout(function () {
      toast('Desbloqueaste ' + importedCosmetics.length + ' cosmético' + (importedCosmetics.length === 1 ? '' : 's') + ' extra' + (importedCosmetics.length === 1 ? '' : 's') + ' con tu progreso importado.', 'success', 5000);
    }, 2200);
  }
}
function clearImportPreview() {
  importPreview = null;
  importError = '';
  renderScreen();
}
function exportSave() {
  try {
    state.backup = state.backup || { lastExportedAt: null, lastPromptAt: null };
    state.backup.lastExportedAt = nowISO();
    var payload = JSON.stringify({
      app: 'SERUMS QUEST VOXEL',
      saveSchema: SAVE_SCHEMA_VERSION,
      version: APP_VERSION,
      buildDate: BUILD_DATE,
      exportedAt: nowISO(),
      state: state
    }, null, 2);
    var blob = new Blob([payload], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'serums-quest-observatorio-' + dateKey() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    persist();
    hideBackupPrompt();
    toast('Partida exportada como respaldo JSON.', 'success');
  } catch (e) {
    toast('No se pudo descargar la partida en este navegador.', 'error');
  }
}
function resetProgress() {
  if (Date.now() > resetArmedUntil) {
    resetArmedUntil = Date.now() + 5000;
    renderScreen();
    toast('Pulsa de nuevo «Confirmar reinicio» para vaciar el observatorio.', 'warn', 4200);
    return;
  }
  resetArmedUntil = 0;
  backupCurrentState('reset');
  if (arenaGroup.visible) endDuelStage();
  session = null;
  lastFeedback = null;
  lastResult = null;
  state = defaultState();
  state.profile.name = 'Serumista';
  persist();
  rebuildHeroAvatar();
  enterTitle();
  toast('Progreso reiniciado. Se conservó una copia previa en este navegador.', 'warn', 4500);
}
function abandonDuel() {
  if (!session) { closePause(); return; }
  if (Date.now() > abandonArmedUntil) {
    abandonArmedUntil = Date.now() + 5000;
    renderScreen();
    toast('Pulsa de nuevo «Abandonar la ruta» para confirmar. Las respuestas dadas se conservan.', 'warn', 4500);
    return;
  }
  abandonArmedUntil = 0;
  pausedDuel = false;
  finishSession('abandoned');
}

/* -------------------------------------------------------------------------
   Acciones de interfaz
   ------------------------------------------------------------------------- */
function onClick(event) {
  var target = event.target.closest ? event.target.closest('[data-action]') : null;
  if (!target) return;
  var action = target.getAttribute('data-action');
  if (action !== 'answer' && action !== 'next-question') initAudio();
  switch (action) {
    case 'enter-game': event.preventDefault(); if (screen === 'title') enterGame(); break;
    case 'menu-continue': event.preventDefault(); menuContinue(); break;
    case 'enter-arena': event.preventDefault(); if (pausedDuel && session) resumeSuspendedDuel(); else enterGame(); break;
    case 'suspend-duel-map': event.preventDefault(); suspendDuelToMap(); break;
    case 'suspend-duel-menu': event.preventDefault(); suspendDuelToMenu(); break;
    case 'resume-suspended-duel': event.preventDefault(); resumeSuspendedDuel(); break;
    case 'open-settings': event.preventDefault(); openSettings(); break;
    case 'close-settings': event.preventDefault(); closeSettings(); break;
    case 'toggle-reduced-motion': event.preventDefault(); setReducedMotion(!state.settings.reducedMotion); renderScreen(); break;
    case 'toggle-extra-time': event.preventDefault(); setExtraTime(!state.settings.extraTime); renderScreen(); break;
    case 'open-import': event.preventDefault(); openImport(); break;
    case 'close-sheet': event.preventDefault(); closeSheet(); break;
    case 'open-map': event.preventDefault(); openMap(); break;
    case 'open-modes': event.preventDefault(); openModes(); break;
    case 'open-stats': event.preventDefault(); openStats(); break;
    case 'open-help': event.preventDefault(); openHelp(); break;
    case 'close-help': event.preventDefault(); closeHelp(); break;
    case 'open-credits': event.preventDefault(); openCredits(); break;
    case 'close-credits': event.preventDefault(); closeCredits(); break;
    case 'open-tutorial': event.preventDefault(); openTutorial('settings'); break;
    case 'tutorial-next': event.preventDefault(); if (tutorialSlide >= 4) closeTutorial(); else { tutorialSlide += 1; renderScreen(); } break;
    case 'tutorial-prev': event.preventDefault(); tutorialSlide = Math.max(0, tutorialSlide - 1); renderScreen(); break;
    case 'tutorial-skip': event.preventDefault(); closeTutorial(); break;
    case 'set-text-scale': event.preventDefault(); setTextScale(target.getAttribute('data-scale')); break;
    case 'toggle-contrast': event.preventDefault(); setHighContrast(!state.settings.highContrast); break;
    case 'toggle-backup-reminder': event.preventDefault(); toggleBackupReminder(); break;
    case 'save-local-backup': event.preventDefault(); saveLocalBackup(); break;
    case 'backup-later': event.preventDefault(); dismissBackupPrompt(false); break;
    case 'backup-off': event.preventDefault(); dismissBackupPrompt(true); break;
    case 'recovery-backup': event.preventDefault(); recoverLocalBackup(); break;
    case 'recovery-download': event.preventDefault(); downloadCorruptData(); break;
    case 'recovery-reset': event.preventDefault(); resetAfterCorruption(); break;
    case 'close-stats': event.preventDefault(); closeStats(); break;
    case 'open-practice': event.preventDefault(); openPracticePicker(); break;
    case 'close-practice': event.preventDefault(); closePracticePicker(); break;
    case 'start-practice': event.preventDefault(); startPractice(target.getAttribute('data-area')); break;
    case 'toggle-question-tag': event.preventDefault(); toggleQuestionTag(target.getAttribute('data-question'), target.getAttribute('data-tag')); break;
    case 'start-mode': event.preventDefault(); startMode(target.getAttribute('data-mode'), { seconds: Number(target.getAttribute('data-seconds')) || undefined }); break;
    case 'map-close':
    case 'map-arena': event.preventDefault(); mapState.active = false; enterHub(); break;
    case 'map-full': event.preventDefault(); mapFullView(); break;
    case 'map-area': event.preventDefault(); mapJumpToArea(target.getAttribute('data-area')); break;
    case 'map-journal': event.preventDefault(); mapState.active = false; openJournal(selectedAreaId); break;
    case 'map-start': event.preventDefault(); launchMissionFromMap(target.getAttribute('data-mission')); break;
    case 'open-journal': event.preventDefault(); openJournal(selectedAreaId); break;
    case 'open-heroes': event.preventDefault(); openHeroes(); break;
    case 'open-wardrobe': event.preventDefault(); openWardrobe(); break;
    case 'open-shop': event.preventDefault(); openShop(); break;
    case 'wardrobe-hero': event.preventDefault(); wardrobeCharacterSwitch(target.getAttribute('data-hero')); break;
    case 'wardrobe-slot': event.preventDefault(); wardrobeSetSlot(target.getAttribute('data-slot')); break;
    case 'wardrobe-item': event.preventDefault(); wardrobeSelectItem(target.getAttribute('data-id')); break;
    case 'wardrobe-clear': event.preventDefault(); wardrobeClearSlot(target.getAttribute('data-slot')); break;
    case 'wardrobe-compare': event.preventDefault(); wardrobe.compareSaved = !wardrobe.compareSaved; renderScreen(); mountWardrobePreview(); sfxClick(); break;
    case 'wardrobe-save': event.preventDefault(); wardrobeSave(); break;
    case 'wardrobe-discard': event.preventDefault(); wardrobeDiscard(); break;
    case 'shop-item': event.preventDefault(); shopSelect(target.getAttribute('data-id')); break;
    case 'shop-buy': event.preventDefault(); shopAskBuy(target.getAttribute('data-id')); break;
    case 'shop-confirm': event.preventDefault(); shopConfirmBuy(target.getAttribute('data-id')); break;
    case 'shop-cancel-buy': event.preventDefault(); shopCancelBuy(); break;
    case 'set-effects-quality': event.preventDefault(); setEffectsQuality(target.getAttribute('data-quality')); break;
    case 'toggle-3d-frames': event.preventDefault(); toggle3dFrames(); break;
    case 'open-review': event.preventDefault(); openReview(); break;
    case 'open-pause': event.preventDefault(); openPause(); break;
    case 'close-pause': event.preventDefault(); closePause(); break;
    case 'open-mission':
      event.preventDefault();
      openJournal(target.getAttribute('data-area'), target.getAttribute('data-mission'));
      break;
    case 'select-area': event.preventDefault(); selectArea(target.getAttribute('data-area')); break;
    case 'select-mission': event.preventDefault(); selectMission(target.getAttribute('data-mission')); break;
    case 'start-mission': event.preventDefault(); launchMission(target.getAttribute('data-mission')); break;
    case 'select-hero': event.preventDefault(); selectHero(target.getAttribute('data-hero')); break;
    case 'open-recruit': event.preventDefault(); openRecruit(target.getAttribute('data-hero')); break;
    case 'recruit-confirm': event.preventDefault(); confirmRecruit(); break;
    case 'start-review': event.preventDefault(); launchReview(target.getAttribute('data-mode') || 'due'); break;
    case 'answer': event.preventDefault(); answerCurrent(target.getAttribute('data-letter')); break;
    case 'next-question': event.preventDefault(); nextQuestion(); break;
    case 'result-continue': event.preventDefault(); resultContinue(); break;
    case 'result-replay': event.preventDefault(); resultReplay(); break;
    case 'enter-title':
    case 'exit-title': event.preventDefault(); exitToTitle(); break;
    case 'toggle-sound': event.preventDefault(); toggleSound(); break;
    case 'toggle-ambient': event.preventDefault(); toggleAmbient(); break;
    case 'toggle-muted': event.preventDefault(); toggleMuted(); break;
    case 'legacy-file': event.preventDefault(); { var fi = document.getElementById('legacyFile'); if (fi) fi.click(); } break;
    case 'legacy-analyze':
      event.preventDefault();
      { var ta = document.getElementById('legacyText'); analyzeImport(ta ? ta.value : importText); }
      break;
    case 'legacy-local':
      event.preventDefault();
      { var found = findLegacyLocalState(); if (found) analyzeImport(found.text); else { importError = 'No encontramos una partida antigua en este navegador.'; renderScreen(); } }
      break;
    case 'legacy-clear':
      event.preventDefault();
      importText = '';
      importPreview = null;
      importError = '';
      renderScreen();
      break;
    case 'import-confirm': event.preventDefault(); confirmImport(); break;
    case 'import-clear': event.preventDefault(); clearImportPreview(); break;
    case 'export-save': event.preventDefault(); exportSave(); break;
    case 'reset-progress': event.preventDefault(); resetProgress(); break;
    case 'abandon-duel': event.preventDefault(); abandonDuel(); break;
    case 'close-import': event.preventDefault(); closeSheet(); break;
  }
}
document.addEventListener('click', onClick);
document.addEventListener('input', function (event) {
  var t = event.target;
  if (!t || !t.matches || !t.matches('[data-volume]')) return;
  var value = clamp(Number(t.value) / 100, 0, 1);
  setVolume(value);
  var label = document.querySelector('[data-volume-label]');
  if (label) label.textContent = Math.round(value * 100) + '%';
});

function isTypingTarget(target) {
  return !!(target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable));
}
var keys = {};
var KEYMAP = {
  ArrowUp: 'ArrowUp', KeyW: 'KeyW',
  ArrowDown: 'ArrowDown', KeyS: 'KeyS',
  ArrowLeft: 'ArrowLeft', KeyA: 'KeyA',
  ArrowRight: 'ArrowRight', KeyD: 'KeyD'
};
window.addEventListener('keydown', function (event) {
  if (isTypingTarget(event.target)) return;
  if (event.code in KEYMAP) {
    keys[event.code] = true;
    if (screen === 'hub' || screen === 'duel') event.preventDefault();
    return;
  }
  if (screen === 'title') {
    if (event.code === 'Enter' || event.code === 'NumpadEnter' || event.code === 'Space') {
      event.preventDefault();
      enterGame();
    }
    return;
  }
  if (screen === 'map') {
    if (event.code === 'Escape' || event.code === 'KeyM') { event.preventDefault(); mapState.active = false; enterHub(); return; }
    if (event.code === 'KeyJ') { event.preventDefault(); mapState.active = false; openJournal(selectedAreaId); return; }
    if (event.code === 'Digit0' || event.code === 'Numpad0') { event.preventDefault(); mapFullView(); return; }
    if (/^Digit[1-5]$/.test(event.code)) {
      var idx = Number(event.code.slice(5)) - 1;
      if (CAMP.areas[idx]) { event.preventDefault(); mapJumpToArea(CAMP.areas[idx].id); }
      return;
    }
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') { mapState.goalYaw += 0.13; event.preventDefault(); return; }
    if (event.code === 'ArrowRight' || event.code === 'KeyD') { mapState.goalYaw -= 0.13; event.preventDefault(); return; }
    if (event.code === 'ArrowUp' || event.code === 'KeyW') { mapState.goalPitch = clamp(mapState.goalPitch - 0.06, .18, 1.1); event.preventDefault(); return; }
    if (event.code === 'ArrowDown' || event.code === 'KeyS') { mapState.goalPitch = clamp(mapState.goalPitch + 0.06, .18, 1.1); event.preventDefault(); return; }
    if (event.code === 'Equal' || event.code === 'NumpadAdd') { mapState.goalDist = clamp(mapState.goalDist - 1, 7.5, 29); event.preventDefault(); return; }
    if (event.code === 'Minus' || event.code === 'NumpadSubtract') { mapState.goalDist = clamp(mapState.goalDist + 1, 7.5, 29); event.preventDefault(); return; }
    if ((event.code === 'Enter' || event.code === 'NumpadEnter') && mapState.selectedId && !RULES.devNoAutoplay) {
      event.preventDefault();
      var selected = mapState.nodes[mapState.selectedId];
      if (selected && mapMissionState(selected.mission) !== 'locked') launchMissionFromMap(selected.mission.id);
    }
    return;
  }
  if (screen === 'hub') {
    if (event.code === 'KeyE' || event.code === 'Enter' || event.code === 'Space') { event.preventDefault(); activateInteract(); return; }
    if (event.code === 'KeyM' || event.code === 'Tab') { if (event.code === 'Tab') return; event.preventDefault(); openMap(); return; }
    if (event.code === 'KeyG') { event.preventDefault(); openModes(); return; }
    if (event.code === 'KeyJ') { event.preventDefault(); openJournal(selectedAreaId); return; }
    if (event.code === 'KeyR') { event.preventDefault(); openReview(); return; }
    if (event.code === 'KeyH' || event.code === 'KeyC') { event.preventDefault(); openHeroes(); return; }
    if (event.code === 'KeyI') { event.preventDefault(); openWardrobe(); return; }
    if (event.code === 'Escape' || event.code === 'KeyP') { event.preventDefault(); openPause(); return; }
    return;
  }
  if (screen === 'duel') {
    if (event.code === 'Escape' || event.code === 'KeyP') { event.preventDefault(); openPause(); return; }
    if (lastFeedback) {
      if (event.code === 'Enter' || event.code === 'NumpadEnter' || event.code === 'Space') { event.preventDefault(); nextQuestion(); }
      return;
    }
    var letter = null;
    if (/^Digit[1-4]$/.test(event.code)) letter = ['A', 'B', 'C', 'D'][Number(event.code.slice(5)) - 1];
    if (event.code === 'KeyA') letter = 'A';
    if (event.code === 'KeyB') letter = 'B';
    if (event.code === 'KeyC') letter = 'C';
    if (event.code === 'KeyD') letter = 'D';
    if (letter) { event.preventDefault(); answerCurrent(letter); }
    return;
  }
  if (event.code === 'Escape') {
    if (screen === 'pause') { event.preventDefault(); closePause(); return; }
    if (screen === 'result') return;
    if (screen === 'title') return;
    if (screen === 'settings') { event.preventDefault(); closeSettings(); return; }
    if (screen === 'tutorial') { event.preventDefault(); closeTutorial(); return; }
    if (screen === 'help') { event.preventDefault(); closeHelp(); return; }
    if (screen === 'credits') { event.preventDefault(); closeCredits(); return; }
    if (screen === 'stats') { event.preventDefault(); closeStats(); return; }
    if (screen === 'practicePicker') { event.preventDefault(); closePracticePicker(); return; }
    if (screen === 'modes') { event.preventDefault(); closeSheet(); return; }
    if (screen === 'import' || screen === 'journal' || screen === 'heroes' || screen === 'review' || screen === 'wardrobe' || screen === 'shop' || screen === 'showcase' || screen === 'slotGallery') {
      event.preventDefault();
      closeSheet();
    }
  }
  if (screen === 'pause' && (event.code === 'KeyM' || event.code === 'KeyJ' || event.code === 'KeyH' || event.code === 'KeyR')) {
    event.preventDefault();
    if (event.code === 'KeyM') openMap();
    else if (event.code === 'KeyJ') openJournal(selectedAreaId);
    else if (event.code === 'KeyH') openHeroes();
    else openReview();
  }
});
window.addEventListener('keyup', function (event) {
  if (event.code in KEYMAP) keys[event.code] = false;
});
window.addEventListener('blur', function () {
  keys = {};
  touchInput.x = 0;
  touchInput.z = 0;
  Object.keys(touchHeld).forEach(function (id) { delete touchHeld[id]; });
});

var touchHeld = {};
function syncTouchInput() {
  var x = 0, z = 0;
  Object.keys(touchHeld).forEach(function (id) {
    var dir = touchHeld[id];
    if (dir === 'left') x -= 1;
    if (dir === 'right') x += 1;
    if (dir === 'up') z -= 1;
    if (dir === 'down') z += 1;
  });
  touchInput.x = clamp(x, -1, 1);
  touchInput.z = clamp(z, -1, 1);
}
document.querySelectorAll('[data-touch-dir]').forEach(function (button) {
  button.addEventListener('pointerdown', function (event) {
    event.preventDefault();
    var id = event.pointerId;
    touchHeld[id] = button.getAttribute('data-touch-dir');
    syncTouchInput();
    try { button.setPointerCapture(event.pointerId); } catch (e) {}
    initAudio();
  });
  function endTouch(event) {
    delete touchHeld[event.pointerId];
    syncTouchInput();
  }
  button.addEventListener('pointerup', endTouch);
  button.addEventListener('pointercancel', endTouch);
  button.addEventListener('pointerleave', endTouch);
});
if (EL.touchAction) {
  EL.touchAction.addEventListener('click', function (event) {
    event.preventDefault();
    activateInteract();
  });
}
var joystickBase = document.getElementById('joystickBase');
var joystickThumb = document.getElementById('joystickThumb');
var joystickPointer = null;
function updateJoystick(event) {
  if (!joystickBase || !joystickThumb) return;
  var rect = joystickBase.getBoundingClientRect();
  var cx = rect.left + rect.width / 2;
  var cy = rect.top + rect.height / 2;
  var radius = rect.width * 0.33;
  var dx = event.clientX - cx, dy = event.clientY - cy;
  var len = Math.sqrt(dx * dx + dy * dy) || 1;
  var cap = Math.min(1, radius / len);
  dx *= cap; dy *= cap;
  touchInput.x = dx / radius;
  touchInput.z = dy / radius;
  joystickThumb.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
}
if (joystickBase) {
  joystickBase.addEventListener('pointerdown', function (event) {
    event.preventDefault();
    joystickPointer = event.pointerId;
    try { joystickBase.setPointerCapture(event.pointerId); } catch (e) {}
    updateJoystick(event);
    initAudio();
  });
  joystickBase.addEventListener('pointermove', function (event) {
    if (event.pointerId !== joystickPointer) return;
    event.preventDefault();
    updateJoystick(event);
  });
  function endJoystick(event) {
    if (event.pointerId !== joystickPointer) return;
    joystickPointer = null;
    touchInput.x = 0; touchInput.z = 0;
    if (joystickThumb) joystickThumb.style.transform = '';
  }
  joystickBase.addEventListener('pointerup', endJoystick);
  joystickBase.addEventListener('pointercancel', endJoystick);
  joystickBase.addEventListener('lostpointercapture', endJoystick);
}

/* -------------------------------------------------------------------------
   Importador: arrastrar y soltar
   ------------------------------------------------------------------------- */
function bindImportFile() {
  var input = document.getElementById('legacyFile');
  if (!input) return;
  input.addEventListener('change', function () {
    var file = input.files && input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () { analyzeImport(String(reader.result || '')); };
    reader.onerror = function () { importError = 'No se pudo leer el archivo elegido.'; renderScreen(); };
    reader.readAsText(file);
    input.value = '';
  });
  var drop = EL.screen.querySelector('.dropZone');
  if (drop) {
    ['dragenter', 'dragover'].forEach(function (type) {
      drop.addEventListener(type, function (event) { event.preventDefault(); drop.style.borderColor = 'var(--teal)'; });
    });
    drop.addEventListener('dragleave', function () { drop.style.borderColor = ''; });
    drop.addEventListener('drop', function (event) {
      event.preventDefault();
      drop.style.borderColor = '';
      var file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () { analyzeImport(String(reader.result || '')); };
      reader.onerror = function () { importError = 'No se pudo leer el archivo elegido.'; renderScreen(); };
      reader.readAsText(file);
    });
  }
}

/* -------------------------------------------------------------------------
   Cámara y partículas: estado por frame
   ------------------------------------------------------------------------- */
function updateSceneMotion(dt, time) {
  if (!renderer) return;
  if (orrery) {
    orrery.rotation.y = time * 0.045;
    orreryRings.forEach(function (r, i) {
      r.mesh.rotation.z = time * r.speed + i * 0.6;
      r.mesh.rotation.x = Math.PI / 2 + Math.sin(time * 0.22 + i) * 0.18 + r.tilt;
    });
    orbitStones.forEach(function (s) {
      var a = s.angle + time * s.speed;
      s.mesh.position.set(Math.cos(a) * s.radius, 1.5 + Math.sin(time * 0.7 + s.angle) * 0.18, Math.sin(a) * s.radius);
      s.mesh.rotation.y = time * 0.6;
    });
    daisRing.rotation.z = time * 0.06;
  }
  if (starField) starField.rotation.y = time * 0.0018;
  gateGroups.forEach(function (g, i) {
    g.beacon.position.y = 3.55 + Math.sin(time * 1.1 + i) * 0.09;
    g.beacon.rotation.y = time * 0.8 + i;
    g.glow.material.opacity = 0.16 + Math.sin(time * 0.9 + i) * 0.035 + (selectedGate === i ? 0.12 : 0);
    g.label.position.y = 4.15 + Math.sin(time * 0.6 + i) * 0.025;
  });
  if (dust && dust.geometry) {
    var attr = dust.geometry.attributes.position;
    for (var i = 0; i < hubParticles.length; i++) {
      var p = hubParticles[i];
      attr.setXYZ(i, p.x + Math.sin(time * 0.16 + p.phase) * 0.7, p.y + Math.sin(time * 0.27 + p.phase) * 0.45, p.z + Math.cos(time * 0.13 + p.phase) * 0.7);
    }
    attr.needsUpdate = true;
  }
  if (arenaRune) arenaRune.rotation.z = time * 0.08;
  if (arenaRune2) arenaRune2.rotation.z = -time * 0.045;
  if (arenaBackRing) arenaBackRing.rotation.z = Math.sin(time * 0.12) * 0.5;
  arenaPillars.forEach(function (p, i) {
    p.group.position.y = Math.sin(time * 0.55 + p.phase) * 0.035;
  });
  if (guardian && arenaGroup.visible) {
    guardian.root.visible = guardian.root.visible;
  }
  // sombra y holder en el atrio
  if (!arenaGroup.visible) {
    heroHolder.position.set(hubHero.x, 0, hubHero.z);
    if (heroAvatar) {
      heroAvatar.root.rotation.y = hubHero.facing;
      heroAvatar.root.position.set(0, 0, 0);
    }
    heroShadow.position.set(hubHero.x, 0.015, hubHero.z);
  } else if (heroAvatar) {
    if (heroAvatar.root.parent === arenaGroup) {
      heroAvatar.root.position.copy(duelPositions.hero);
      arenaHeroShadow.position.set(duelPositions.hero.x, 0.015, duelPositions.hero.z);
    }
  }
}
function overallPhase() {
  if (screen === 'boot' || screen === 'title') return 'title';
  if (screen === 'result' && lastResult) return lastResult.pass ? 'won' : 'lost';
  return 'playing';
}
function postPhase() {
  var next = overallPhase();
  if (next === lastPhasePosted) return;
  lastPhasePosted = next;
  var score = screen === 'result' && lastResult ? lastResult.score : (session ? session.orders.filter(function (id) { return session.answers[id] && session.answers[id].correct; }).length * 100 : 0);
  post({ type: 'state', phase: next, score: score });
}

/* -------------------------------------------------------------------------
   BUCLE
   ------------------------------------------------------------------------- */
var lastFrameAt = performance.now();
function frame(now) {
  var dt = Math.min(0.05, Math.max(0, (now - lastFrameAt) / 1000));
  lastFrameAt = now;
  if (dt > 0) fps = lerp(fps, 1 / dt, 0.06);
  nowMs = now;
  try {
    if (screen === 'map') {
      updateMapScene(dt, now / 1000);
    } else {
      if (screen === 'hub') updateHub(dt);
      animateHero(dt, now / 1000);
      animateGuardian(dt, now / 1000);
      updateSparks(dt);
      updateCombatEffects(dt);
      updateSceneMotion(dt, now / 1000);
      placeCamera(dt, now / 1000);
      if (renderer) renderer.render(scene, camera);
      updateWardrobePreview(dt, now / 1000);
      updateModeClock();
    }
  } catch (error) {
    reportError(error && error.message || error);
    if (screen !== 'boot') console.error(error);
  }
  postPhase();
  requestAnimationFrame(frame);
}

/* -------------------------------------------------------------------------
   API del Game Studio / playtest
   ------------------------------------------------------------------------- */
function heroWorldPosition() {
  if (arenaGroup.visible) {
    return new THREE.Vector3(ARENA_POS.x + duelPositions.hero.x, 0, ARENA_POS.z + duelPositions.hero.z);
  }
  return new THREE.Vector3(hubHero.x, 0, hubHero.z);
}
function heroOnScreen() {
  if (!renderer) return false;
  var p = heroWorldPosition();
  var v = new THREE.Vector3(p.x, 1.2, p.z).project(camera);
  return Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1 && v.z < 1;
}
window.__gameState = function () {
  var p = heroWorldPosition();
  var gpos = guardian && arenaGroup.visible
    ? [{ x: Math.round((ARENA_POS.x + duelPositions.guardian.x) * 100) / 100, y: Math.round((ARENA_POS.z + duelPositions.guardian.z) * 100) / 100 }]
    : [];
  var correctCount = session ? session.orders.filter(function (id) { return session.answers[id] && session.answers[id].correct; }).length : 0;
  return {
    phase: overallPhase(),
    paused: screen === 'pause',
    screen: screen,
    mode: session ? session.mode : (lastResult ? lastResult.mode : 'hub'),
    score: lastResult ? lastResult.score : correctCount * 100,
    best: Math.max.apply(null, [0].concat(CAMP.missions.map(function (m) { return (state.missions[m.id] && Number(state.missions[m.id].bestScore)) || 0; }))),
    hearts: session ? session.hearts : (lastResult && typeof lastResult.heartsRemaining === 'number' ? lastResult.heartsRemaining : (Number(RULES.duelHearts) || 3)),
    fps: Math.round(fps),
    time: session ? Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000) : 0,
    hero: { x: Math.round(p.x * 100) / 100, y: Math.round(p.z * 100) / 100 },
    pickups: [],
    enemies: gpos,
    world: { w: 28, h: 28, radius: HUB_RADIUS },
    heroOnScreen: heroOnScreen(),
    level: currentLevel(),
    xp: state.xp,
    coins: state.coins,
    stage: state.stage,
    missionsCompleted: totalMissionsDone(),
    dueReviews: dueCount(),
    selectedCharacterId: state.collection.selectedCharacterId,
    activeMissionId: session ? session.missionId : (lastResult ? lastResult.missionId : null),
    questionIndex: session ? session.cursor : null,
    questionTotal: session ? session.questions.length : null,
    feedbackOpen: !!lastFeedback,
    lastResultPass: lastResult ? !!lastResult.pass : null,
    renderer: renderer ? 'webgl' : 'none'
  };
};
window.__autoplay = function () {
  if (RULES.devHeroSweep || RULES.devNoAutoplay) return;
  var mapAutoplayFlow = RULES.devScreen === 'map' || (RULES.devScreen === 'import' && RULES.devAfterScreen === 'map');
  if (RULES.devScreen && !mapAutoplayFlow && RULES.devAfterScreen !== 'reviewSession') return;
  if (RULES.devStartMode && screen !== 'duel' && screen !== 'result') return;
  if (mapAutoplayFlow && screen === 'map' && !mapState.active) return;
  var now = performance.now();
  if (screen === 'map') {
    if (mapAutoplayFrozen) return;
    if (now - autoLastAction < 700) return;
    autoLastAction = now;
    var mapRec = mapRecommended();
    if (mapRec.kind === 'review') openReview();
    else if (mapRec.kind === 'mission') launchMissionFromMap(mapRec.mission.id);
    return;
  }
  if (screen === 'result' && lastResult && lastResult.launchSource === 'map') {
    if (now - autoLastAction > 900) {
      autoLastAction = now;
      if (RULES.devStopAfterMap) mapAutoplayFrozen = true;
      resultContinue();
    }
    return;
  }
  if (screen === 'title') {
    if (now - autoLastAction < 250) return;
    autoLastAction = now;
    enterGame();
    return;
  }
  if (screen === 'hub') {
    if (now - autoLastAction < 180) return;
    var rec = nextRecommended();
    if (rec) {
      autoLastAction = now;
      openJournal(rec.areaId, rec.id);
      return;
    }
    if (dueCount()) {
      autoLastAction = now;
      openReview();
      return;
    }
    autoLastAction = now;
    openJournal(selectedAreaId);
    return;
  }
  if (screen === 'journal') {
    if (now - autoLastAction < 160) return;
    var mission = selectedMissionForArea();
    if (mission && missionUnlockInfo(mission).unlocked) {
      autoLastAction = now;
      launchMission(mission.id);
    }
    return;
  }
  if (screen === 'duel' && session) {
    if (lastFeedback) {
      if (now - lastFeedback.shownAt > 620) {
        autoLastAction = now;
        nextQuestion();
      }
      return;
    }
    if (now - autoLastAction < 150) return;
    var q = currentQuestion();
    if (q) {
      autoLastAction = now;
      var autoplayChoice = q.answer;
      if (RULES.devMistake && !session.devMistakeUsed) {
        session.devMistakeUsed = true;
        var wrongOption = q.options.filter(function (o) { return o.id !== q.answer; })[0];
        if (wrongOption) autoplayChoice = wrongOption.id;
      }
      answerCurrent(autoplayChoice);
    }
    return;
  }
  if (screen === 'review') {
    if (now - autoLastAction < 250) return;
    autoLastAction = now;
    launchReview('due');
  }
};

/* -------------------------------------------------------------------------
   Arranque
   ------------------------------------------------------------------------- */
function primePortrait() {
  try {
    renderHeroPortrait(state.collection.selectedCharacterId, 200);
    syncHudPortrait();
  } catch (e) {
    reportError('retrato inicial: ' + (e.message || e));
  }
}
function sendRenders(delay) {
  window.setTimeout(function () {
    try { post({ type: 'renders', renders: renderSlots(256) }); } catch (e) { reportError('renders: ' + (e.message || e)); }
  }, delay || 900);
}
function boot() {
  applyMotionSetting();
  if (RULES.devQuality && ['bajo', 'medio', 'alto'].indexOf(RULES.devQuality) !== -1) state.settings.effectsQuality = RULES.devQuality;
  var bootUnlocks = syncCharacters();
  if (RULES.devOwnAllCosmetics || RULES.devOutfitPreset) {
    state.collection.ownedCosmeticIds = ALL_COSMETICS.map(function (c) { return c.id; });
    state.collection.ownedCharacterIds = ALL_HERO_IDS.slice();
    var presetHero = RULES.devOutfitPreset && RULES.devOutfitPreset !== 'full' ? RULES.devOutfitPreset : null;
    if (presetHero && SHOWCASE_OUTFITS[presetHero]) {
      state.collection.selectedCharacterId = presetHero;
      state.collection.equipped[presetHero] = Object.assign({}, SHOWCASE_OUTFITS[presetHero]);
      delete state.collection.equipped[presetHero].pet;
    } else if (RULES.devOutfitPreset === 'full') {
      state.collection.selectedCharacterId = 'noa';
      state.collection.equipped.noa = {
        cabeza: 'x-dominio-cuidado-oro', peinado: 'c-peinado-rizos', torso: 'c-torso-manto',
        piernas: 'c-piernas-grebas', accesorios: 'c-accesorios-gafas', extras: 'x-cuaderno-orbital',
        amuletos: 'c-amuleto-criterio', efectos: 'c-efecto-constelacion', marcos: 'c-marco-constelacion',
        mascota: 'x-buho-cometa', estela: 'x-estela-racha', titulo: 'x-titulo-maestro'
      };
    }
  }
  healEquippedOutfits();
  var bootCosmetics = unlockProgressCosmetics();
  if (bootUnlocks.length || bootCosmetics.length) persist();
  mountHud();
  rebuildHeroAvatar();
  enterTitle();
  setLoading(false);
  initAudio();
  var savedSettings = loadSettings();
  if (savedSettings) state.settings = Object.assign({}, state.settings, savedSettings);
  applyAccessibilitySettings();
  requestAnimationFrame(frame);
  window.setTimeout(primePortrait, 320);
  sendRenders(450);
  window.setTimeout(function () { sendRenders(1); }, 2000);
  if (bootUnlocks.length) {
    window.setTimeout(function () {
      toast(bootUnlocks.map(function (c) { return c.name; }).join(', ') + ' se unió al observatorio por tus misiones completadas.', 'success', 5000);
    }, 1200);
  }
  if (!FINAL_RELEASE && RULES.devHeroSweep) {
    state.collection.ownedCharacterIds = CAMP.characters.map(function (c) { return c.id; });
    CAMP.characters.forEach(function (c) { try { renderHeroPortrait(c.id, 200); } catch (e) {} });
    var sweepIndex = 0;
    window.setTimeout(function () {
      cameraMode = 'hub';
      view = 'hub';
      setScreen('hub');
      var sweep = function () {
        sweepIndex = (sweepIndex + 1) % CAMP.characters.length;
        state.collection.selectedCharacterId = CAMP.characters[sweepIndex].id;
        rebuildHeroAvatar();
        syncHUD();
      };
      window.setInterval(sweep, 1100);
    }, 700);
  }
  window.setTimeout(runWhenBoot, 160);
  if (!FINAL_RELEASE && RULES.devScreen) {
    window.setTimeout(function () {
      try {
        var target = RULES.devScreen;
        if (target === 'journal') openJournal(selectedAreaId);
        else if (target === 'heroes') openHeroes();
        else if (target === 'review') openReview();
        else if (target === 'import') openImport();
        else if (target === 'pause') openPause();
        else if (target === 'hub') { enterHub(); }
        else if (target === 'map') {
          openMap(RULES.devMapNode || null);
          if (RULES.devMapArea) window.setTimeout(function () { mapJumpToArea(RULES.devMapArea); }, 80);
          if (RULES.devMapNode) window.setTimeout(function () { selectMapNode(RULES.devMapNode); }, 120);
          if (RULES.devMapStart) launchMissionFromMap(RULES.devMapStart);
        }
        else if (target === 'wardrobe') {
          openWardrobe();
          if (RULES.devWardrobeSlot) wardrobeSetSlot(RULES.devWardrobeSlot);
          if (RULES.devWardrobeItem) wardrobeSelectItem(RULES.devWardrobeItem);
          if (RULES.devWardrobeSave) wardrobeSave();
        }
        else if (target === 'shop') {
          openShop();
          if (RULES.devShopBuy) {
            shopSelect(RULES.devShopBuy);
            shopAskBuy(RULES.devShopBuy);
            if (RULES.devConfirmPurchase) {
              window.setTimeout(function () { shopConfirmBuy(RULES.devShopBuy); }, 360);
            }
          }
        }
        else if (target === 'showcase') { sheetReturn = 'hub'; setScreen('showcase'); }
        else if (target === 'slotGallery') { sheetReturn = 'hub'; setScreen('slotGallery'); }
        else if (target === 'mission') {
          var devMission = null;
          if (RULES.devArea) {
            devMission = areaMissions(RULES.devArea).filter(function (m) { return missionUnlockInfo(m).unlocked; })[0] || null;
          }
          if (!devMission) devMission = nextRecommended();
          if (devMission) launchMission(devMission.id);
        }
        if (target === 'import' && RULES.devImportB64) {
          analyzeImport(decodeURIComponent(escape(window.atob(RULES.devImportB64))));
          if (RULES.devApplyImport) {
            confirmImport();
            if (RULES.devAfterScreen === 'heroes') openHeroes();
            else if (RULES.devAfterScreen === 'review') openReview();
            else if (RULES.devAfterScreen === 'journal') openJournal(selectedAreaId);
            else if (RULES.devAfterScreen === 'wardrobe') { openWardrobe(); if (RULES.devSlot) wardrobeSetSlot(RULES.devSlot); }
            else if (RULES.devAfterScreen === 'map') {
              openMap();
              if (RULES.devMapArea) window.setTimeout(function () { mapJumpToArea(RULES.devMapArea); }, 80);
              if (RULES.devMapNode) window.setTimeout(function () { selectMapNode(RULES.devMapNode); }, 120);
              if (RULES.devMapAnimFreeze != null) {
                window.setTimeout(function () {
                  mapState.animFreeze = clamp(Number(RULES.devMapAnimFreeze), 0, 1);
                  if (RULES.devMapFocusGate) mapFocusGate(RULES.devMapFocusGate);
                  else if (RULES.devMapArea) mapJumpToArea(RULES.devMapArea);
                }, 150);
              }
              if (RULES.devMapStart) launchMissionFromMap(RULES.devMapStart);
            }
            else if (RULES.devAfterScreen === 'mapGallery') setScreen('mapGallery');
            else if (RULES.devAfterScreen === 'shop') {
              openShop();
              if (RULES.devShopBuy) {
                shopSelect(RULES.devShopBuy);
                shopAskBuy(RULES.devShopBuy);
                if (RULES.devConfirmPurchase) window.setTimeout(function () { shopConfirmBuy(RULES.devShopBuy); }, 360);
              }
            }
            else if (RULES.devAfterScreen === 'reviewSession') {
              openReview();
              window.setTimeout(function () { launchReview('due'); }, 220);
            }
          }
        }
        if (RULES.devRecruit && CHARACTER_BY_ID[RULES.devRecruit] && state.collection.ownedCharacterIds.indexOf(RULES.devRecruit) === -1) {
          openHeroes();
          openRecruit(RULES.devRecruit);
          if (RULES.devRecruitConfirm) confirmRecruit();
        }
      } catch (e) { reportError('devScreen: ' + (e.message || e)); }
    }, 650);
  }
  if (!FINAL_RELEASE && RULES.devStage4) {
    state.stage = 4;
    persist();
  }
  if (!FINAL_RELEASE && RULES.devOpenModes) {
    window.setTimeout(function () { openModes(); }, 700);
  }
  if (!FINAL_RELEASE && RULES.devOpenStats) {
    window.setTimeout(function () { openStats(); }, 700);
  }
  if (!FINAL_RELEASE && RULES.devPracticeArea) {
    window.setTimeout(function () { startPractice(RULES.devPracticeArea); }, 900);
  }
  if (!FINAL_RELEASE && RULES.devStartMode) {
    window.setTimeout(function () {
      try { startMode(RULES.devStartMode, { seconds: Number(RULES.devModeSeconds) || undefined }); }
      catch (e) { reportError('devStartMode: ' + (e.message || e)); }
    }, 900);
  }
  if (!storageEnabled) {
    window.setTimeout(function () { toast('El navegador bloquea el guardado local. El progreso durará hasta cerrar la pestaña.', 'warn', 7000); }, 1200);
  }
  if (state.importedAt && !state.importToastShown) {
    window.setTimeout(function () { toast('Partida importada disponible. Entra para continuar tu ruta.', 'success', 5000); }, 900);
  }
}
setTimeout(function () {
  var loading = document.getElementById('loading');
  if (loading) loading.classList.add('hidden');
}, 200);
boot();
