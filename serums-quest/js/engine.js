/* SERUMS QUEST - motor de sesiones, respuestas y resultados
   Cada respuesta se registra en el mismo documento persistente que el perfil.
   Los resultados se calculan exclusivamente con respuestas registradas. */
(function () {
  "use strict";

  var C = window.QUEST_CONFIG;
  var U = window.QuestUtil;
  var P = window.QuestProgression;
  var Content = window.QuestContent;

  function mathMax(a, b) { return Math.max(a, b); }

  function levelOf(state) { return P.levelFromXp(state.xp).level; }

  function rankOf(state) {
    return P.rankFor(P.stats(state, Content.catalog));
  }

  function currentItem(session) {
    if (!session || !session.questions) return null;
    return session.questions[session.cursor] || null;
  }

  function current(state) {
    var session = state.activeSession;
    var item = currentItem(session);
    if (!item) return null;
    return { session: session, item: item, question: Content.getQuestion(item.questionId) };
  }

  function getActive(state) { return state.activeSession || null; }

  function validateActive(state) {
    var session = getActive(state);
    if (!session) return { ok: true, missing: [] };
    var missing = [];
    (session.questions || []).forEach(function (item) {
      if (!Content.getQuestion(item.questionId)) missing.push(item.questionId);
    });
    return { ok: missing.length === 0, missing: missing, session: session };
  }

  function sessionTitle(descriptor, mission, daily) {
    if (descriptor.mode === "mission" || descriptor.mode === "boss") return mission ? mission.title : "Misión";
    if (descriptor.mode === "daily") return daily ? "Desafío diario" : "Desafío diario";
    if (descriptor.mode === "recovery") return "Recuperación de errores";
    if (descriptor.mode === "survival") return "Supervivencia";
    if (descriptor.mode === "timed") return "Contrarreloj · " + Math.round((descriptor.seconds || C.modes.contrarreloj.defaultSeconds) / 60) + " min";
    if (descriptor.mode === "simulacro") return "Simulacro final";
    return "Sesión";
  }

  function startSession(state, descriptor, now) {
    var at = now ? new Date(now) : new Date();
    if (state.activeSession) throw new Error("Ya hay una sesión en curso. Termínala o abandónala antes de empezar otra.");
    var mode = descriptor && descriptor.mode;
    if (!mode) throw new Error("No se indicó el modo de la sesión.");
    var mission = null;
    var daily = null;
    var seconds = 0;
    var timeLimitMs = 0;
    var timerMode = "none";
    var questions = [];

    if (mode === "mission" || mode === "boss") {
      mission = Content.getMission(descriptor.missionId);
      if (!mission) throw new Error("La misión solicitada no existe.");
      if (mode === "mission" && mission.kind !== "mission") throw new Error("El identificador no corresponde a una misión.");
      if (mode === "boss" && mission.kind !== "boss") throw new Error("El identificador no corresponde a un jefe.");
      var unlocked = Content.missionUnlocked(state, mission);
      if (!unlocked.unlocked) throw new Error("La misión aún está bloqueada: " + unlocked.requirements.filter(function (r) { return !r.met; }).map(function (r) { return r.label; }).join(", "));
      questions = Content.buildQuestionSequence(state, { mode: mode, missionId: mission.id }, at);
      if (mode === "boss") {
        seconds = C.modes.jefes.secondsPerQuestion;
        timerMode = "question";
      }
    } else if (mode === "daily") {
      if (!Content.dailyAvailable(state, U.dateKey(at))) throw new Error("El desafío diario de hoy ya fue completado.");
      daily = Content.dailyChallenge(state, U.dateKey(at));
      questions = daily.questions;
    } else if (mode === "recovery") {
      var due = Content.recoveryDue(state, at);
      if (!due.length) throw new Error("No hay preguntas falladas que estén listas para recuperar.");
      questions = Content.buildQuestionSequence(state, { mode: "recovery" }, at);
    } else if (mode === "survival") {
      questions = Content.buildQuestionSequence(state, { mode: "survival", seed: descriptor.seed || U.uid("survival") }, at);
      seconds = C.modes.supervivencia.secondsPerQuestion;
      timerMode = "question";
    } else if (mode === "timed") {
      var allowed = C.modes.contrarreloj.durations;
      var chosenSeconds = Number(descriptor.seconds) || C.modes.contrarreloj.defaultSeconds;
      if (allowed.indexOf(chosenSeconds) === -1) throw new Error("Duración de contrarreloj no permitida.");
      seconds = chosenSeconds;
      timeLimitMs = seconds * 1000;
      timerMode = "session";
      questions = Content.buildQuestionSequence(state, { mode: "timed", seconds: seconds, seed: descriptor.seed || U.uid("timed") }, at);
    } else if (mode === "simulacro") {
      if ((Number(state.stage) || 1) < C.modes.simulacro.minStage) throw new Error("El simulacro se desbloquea en la etapa Dominio.");
      seconds = C.modes.simulacro.seconds;
      timeLimitMs = seconds * 1000;
      timerMode = "session";
      questions = Content.buildQuestionSequence(state, { mode: "simulacro", seed: descriptor.seed || U.uid("simulacro") }, at);
    } else {
      throw new Error("Modo de juego no reconocido.");
    }

    if (!questions.length) throw new Error("No hay preguntas disponibles para esta sesión.");

    var isTimed = mode === "timed" || mode === "simulacro";
    var feedback = (mission && mission.kind === "boss") || isTimed ? "diferida" : "inmediata";
    if (mode === "mission" && state.settings && state.settings.instantFeedback === false) feedback = "diferida";
    var atISO = U.nowISO(at);
    var session = {
      id: U.uid("session"),
      mode: mode,
      missionId: mission ? mission.id : null,
      areaId: mission ? mission.areaId : "",
      title: sessionTitle(descriptor, mission, daily),
      subtitle: mission ? mission.subtitle : (daily ? daily.description : C.modes[mode] ? C.modes[mode].description : ""),
      tier: mission ? mission.tier : (mode === "recovery" ? "repaso" : Content.stageTier(state.stage)),
      stage: Number(state.stage) || 1,
      questions: questions.map(function (item) { return { questionId: item.questionId, tier: item.tier || "desarrollo", reason: item.reason || "" }; }),
      cursor: 0,
      answers: {},
      answerOrder: [],
      omitted: [],
      startedAt: atISO,
      updatedAt: atISO,
      endedAt: null,
      status: "active",
      timerMode: timerMode,
      seconds: seconds || 0,
      timeLimitMs: timeLimitMs,
      endsAt: timeLimitMs ? new Date(at.getTime() + timeLimitMs).toISOString() : null,
      questionStartedAt: atISO,
      questionEndsAt: timerMode === "question" ? new Date(at.getTime() + seconds * 1000).toISOString() : null,
      lives: mode === "survival" ? C.modes.supervivencia.lives : 0,
      maxLives: mode === "survival" ? C.modes.supervivencia.lives : 0,
      feedback: feedback,
      levelAtStart: levelOf(state),
      rankAtStart: rankOf(state).name,
      coinsFromQuestions: 0,
      xpFromQuestions: 0,
      completedDailyDate: daily ? daily.date : null,
      descriptor: {
        seconds: seconds || 0
      },
      result: null
    };
    state.activeSession = session;
    return session;
  }

  function recordCorrectError(state, question, correct, atISO, prior) {
    var error = state.errors[question.id];
    if (correct) {
      if (!error) return;
      var level = Math.min(C.recovery.intervalsDays.length - 1, Math.max(0, Number(error.recoveryLevel) || 0));
      error.recoveryLevel = level + 1;
      error.lastCorrectAt = atISO;
      if (!error.recoveredAt) error.recoveredAt = atISO;
      error.nextReviewAt = U.addDays(atISO, C.recovery.intervalsDays[level]).toISOString();
      error.confidence = question.confidence;
      return;
    }
    if (!error) {
      error = {
        questionId: question.id,
        areaId: question.areaId,
        topicId: question.topicId,
        sheetId: question.sheetId,
        confidence: question.confidence,
        firstAt: atISO,
        lastAt: atISO,
        count: 0,
        recoveryLevel: 0,
        recoveredAt: null,
        nextReviewAt: null
      };
      state.errors[question.id] = error;
    }
    error.count = (Number(error.count) || 0) + 1;
    error.lastAt = atISO;
    error.recoveryLevel = 0;
    error.recoveredAt = null;
    error.confidence = question.confidence;
    error.areaId = question.areaId;
    error.topicId = question.topicId;
    error.sheetId = question.sheetId;
    error.nextReviewAt = U.addMinutes(atISO, C.recovery.firstDelayMinutes).toISOString();
  }

  function updateQuestionStats(state, question, correct, atISO, prior, sessionId) {
    var previous = prior || {};
    var priorLevel = Number(previous.recoveryLevel) || 0;
    var review = P.nextReviewFor(previous, correct, atISO);
    var next = {
      attempts: (Number(previous.attempts) || 0) + 1,
      correct: (Number(previous.correct) || 0) + (correct ? 1 : 0),
      wrong: (Number(previous.wrong) || 0) + (correct ? 0 : 1),
      mastery: P.questionMastery(previous, correct, atISO),
      streak: correct ? (Number(previous.streak) || 0) + 1 : 0,
      bestStreak: Math.max(Number(previous.bestStreak) || 0, correct ? (Number(previous.streak) || 0) + 1 : 0),
      lastResult: correct ? "correct" : "wrong",
      lastAttemptAt: atISO,
      lastCorrectAt: correct ? atISO : (previous.lastCorrectAt || null),
      firstCorrectAt: previous.firstCorrectAt || (correct ? atISO : null),
      nextReviewAt: review.at,
      recoveryLevel: correct ? Math.max(priorLevel, review.level) : 0,
      areaId: question.areaId,
      topicId: question.topicId,
      sheetId: question.sheetId,
      confidence: question.confidence,
      lastSessionId: sessionId
    };
    state.questions[question.id] = next;
    return next;
  }

  function updateAcademic(state, question, correct, atISO, durationMs, mode) {
    var academic = state.academic;
    academic.answered += 1;
    if (correct) academic.correct += 1; else academic.wrong += 1;
    academic.totalTimeMs += Math.max(0, Math.min(30 * 60 * 1000, Number(durationMs) || 0));
    if (question.areaId) {
      var area = academic.byArea[question.areaId];
      if (!area) {
        area = { answered: 0, correct: 0, wrong: 0, reliableAnswered: 0, reliableCorrect: 0, reliableWrong: 0 };
        academic.byArea[question.areaId] = area;
      }
      area.answered += 1;
      if (correct) area.correct += 1; else area.wrong += 1;
      if (question.confidence === "alta" || question.confidence === "media") {
        area.reliableAnswered += 1;
        if (correct) area.reliableCorrect += 1; else area.reliableWrong += 1;
      }
    }
    academic.recent = academic.recent || [];
    academic.recent.push({
      at: atISO,
      correct: !!correct,
      areaId: question.areaId,
      confidence: question.confidence,
      mode: mode
    });
    academic.recent = academic.recent.slice(-60);
  }

  function answer(state, sessionId, chosen, now) {
    var at = now ? new Date(now) : new Date();
    var atISO = U.nowISO(at);
    var session = state.activeSession;
    if (!session || session.id !== sessionId) throw new Error("La sesión ya no está activa.");
    if (session.status !== "active") throw new Error("La sesión ya terminó.");
    if (session.endsAt && at.getTime() >= new Date(session.endsAt).getTime()) {
      return { expired: true, session: session };
    }
    var item = currentItem(session);
    if (!item) throw new Error("No hay una pregunta activa.");
    if (session.answers[item.questionId]) throw new Error("La pregunta ya fue respondida.");
    if (session.questionEndsAt && at.getTime() >= new Date(session.questionEndsAt).getTime()) {
      return { expired: true, questionExpired: true, session: session };
    }
    var question = Content.getQuestion(item.questionId);
    if (!question) throw new Error("La pregunta ya no está disponible en el contenido.");
    var correct = chosen === question.answer;
    var prior = state.questions[question.id] || null;
    var started = U.parseDate(session.questionStartedAt);
    var durationMs = started ? Math.max(0, at - started) : 0;
    var reward = P.questionReward({
      baseXp: C.xp.question[item.tier] || C.xp.question.desarrollo,
      prior: prior,
      correct: correct,
      now: at,
      tier: item.tier
    });
    var applied = { xp: 0, coins: 0, applied: false, duplicate: false };
    if (correct) {
      if (session.coinsFromQuestions >= C.antiFarm.maxCoinAwardsPerSession) reward.coins = 0;
      applied = P.applyReward(state, {
        xp: reward.xp,
        coins: reward.coins,
        key: "answer:" + session.id + ":" + question.id,
        source: "respuesta:" + question.id,
        sessionId: session.id,
        now: at
      });
      session.coinsFromQuestions += applied.coins;
      session.xpFromQuestions += applied.xp;
    }
    updateQuestionStats(state, question, correct, atISO, prior, session.id);
    recordCorrectError(state, question, correct, atISO, prior);
    updateAcademic(state, question, correct, atISO, durationMs, session.mode);
    var recommendation = correct ? null : Content.recommendationFor(question);
    var entry = {
      questionId: question.id,
      chosen: chosen || null,
      correct: !!correct,
      omitted: false,
      at: atISO,
      durationMs: durationMs,
      tier: item.tier,
      xp: correct ? applied.xp : 0,
      coins: correct ? applied.coins : 0,
      rewardReason: correct ? reward.reason : "Respuesta incorrecta: no se otorga XP ni monedas.",
      recommendation: recommendation ? {
        sheetId: recommendation.sheet ? recommendation.sheet.id : "",
        topicId: recommendation.topic ? recommendation.topic.id : "",
        areaId: recommendation.areaId,
        label: recommendation.label,
        href: recommendation.href
      } : null
    };
    session.answers[question.id] = entry;
    session.answerOrder.push(question.id);
    session.updatedAt = atISO;
    if (session.mode === "survival" && !correct) {
      session.lives = Math.max(0, (Number(session.lives) || 0) - 1);
    }
    return {
      expired: false,
      session: session,
      question: question,
      outcome: {
        correct: correct,
        chosen: chosen,
        answer: question.answer,
        answerText: question.answerText,
        reward: {
          xp: entry.xp,
          coins: entry.coins,
          reason: entry.rewardReason,
          suppressed: reward.suppressed
        },
        recommendation: recommendation,
        lives: session.lives,
        timeout: false
      }
    };
  }

  function omitCurrent(state, sessionId, reason, now) {
    var at = now ? new Date(now) : new Date();
    var atISO = U.nowISO(at);
    var session = state.activeSession;
    if (!session || session.id !== sessionId) throw new Error("La sesión ya no está activa.");
    var item = currentItem(session);
    if (!item) throw new Error("No hay una pregunta activa.");
    if (session.answers[item.questionId] || session.omitted.indexOf(item.questionId) !== -1) {
      throw new Error("La pregunta ya fue registrada.");
    }
    var started = U.parseDate(session.questionStartedAt);
    var durationMs = started ? Math.max(0, at - started) : 0;
    session.omitted.push(item.questionId);
    session.answerOrder.push(item.questionId);
    session.updatedAt = atISO;
    var entry = {
      questionId: item.questionId,
      chosen: null,
      correct: false,
      omitted: true,
      at: atISO,
      durationMs: durationMs,
      tier: item.tier,
      xp: 0,
      coins: 0,
      rewardReason: reason || "Sin respuesta dentro del tiempo.",
      recommendation: null
    };
    session.answers[item.questionId] = entry;
    if (session.mode === "survival") session.lives = Math.max(0, (Number(session.lives) || 0) - 1);
    return { session: session, entry: entry };
  }

  function advance(state, sessionId, now) {
    var at = now ? new Date(now) : new Date();
    var session = state.activeSession;
    if (!session || session.id !== sessionId) throw new Error("La sesión ya no está activa.");
    var item = currentItem(session);
    if (!item) throw new Error("No hay una pregunta activa.");
    if (!session.answers[item.questionId]) throw new Error("Debes responder u omitir antes de continuar.");
    if (session.mode === "survival" && session.lives <= 0) {
      return { finished: true, session: finish(state, sessionId, "lives", at) };
    }
    if (session.endsAt && at.getTime() >= new Date(session.endsAt).getTime()) {
      return { finished: true, session: finish(state, sessionId, "time", at) };
    }
    if (session.cursor >= session.questions.length - 1) {
      return { finished: true, session: finish(state, sessionId, "completed", at) };
    }
    session.cursor += 1;
    session.questionStartedAt = U.nowISO(at);
    session.questionEndsAt = session.timerMode === "question"
      ? new Date(at.getTime() + session.seconds * 1000).toISOString()
      : null;
    session.updatedAt = U.nowISO(at);
    return { finished: false, session: session };
  }

  function summaryOf(session) {
    var total = session.questions.length;
    var entries = session.answerOrder.map(function (id) { return session.answers[id]; }).filter(Boolean);
    var omitted = entries.filter(function (e) { return e.omitted; }).length;
    var unanswered = total - entries.length;
    var answered = entries.filter(function (e) { return !e.omitted; }).length;
    var correct = entries.filter(function (e) { return e.correct && !e.omitted; }).length;
    var wrong = answered - correct;
    var accuracy = answered ? correct / answered : 0;
    var areaBreakdown = {};
    entries.forEach(function (e) {
      var q = Content.getQuestion(e.questionId);
      if (!q || !q.areaId) return;
      var a = areaBreakdown[q.areaId] || (areaBreakdown[q.areaId] = { answered: 0, correct: 0 });
      if (!e.omitted) {
        a.answered += 1;
        if (e.correct) a.correct += 1;
      }
    });
    return {
      total: total,
      answered: answered,
      correct: correct,
      wrong: wrong,
      omitted: omitted + unanswered,
      omittedRecorded: omitted,
      unanswered: unanswered,
      accuracy: accuracy,
      score: correct * 100,
      allAttempted: entries.length >= total,
      allAnswered: answered >= total,
      timeMs: Math.max(0, new Date(session.updatedAt || Date.now()) - new Date(session.startedAt)),
      areaBreakdown: areaBreakdown
    };
  }

  function completionEligibility(session, summary, reason) {
    if (reason === "abandoned") return { eligible: false, pass: false, label: "Sesión abandonada: se pierde la recompensa de finalización anunciada." };
    if (session.mode === "mission") {
      var missionPass = summary.allAnswered && summary.accuracy >= C.pass.mission;
      return { eligible: missionPass, pass: missionPass, label: missionPass ? "Misión superada." : "La misión exige responder todo y al menos " + Math.round(C.pass.mission * 100) + "% de aciertos." };
    }
    if (session.mode === "boss") {
      var bossCoverage = summary.total ? summary.correct / summary.total : 0;
      var bossPass = summary.allAttempted && bossCoverage >= C.modes.jefes.passAccuracy;
      return { eligible: bossPass, pass: bossPass, label: bossPass ? "Jefe superado." : "No se alcanzó el 70% del total requerido para superar al jefe." };
    }
    if (session.mode === "daily") {
      var dailyPass = summary.allAnswered && summary.accuracy >= C.pass.daily;
      return { eligible: dailyPass, pass: dailyPass, label: dailyPass ? "Desafío diario completado." : "El desafío diario exige responder todo y al menos " + Math.round(C.pass.daily * 100) + "% de aciertos." };
    }
    if (session.mode === "survival") {
      var alive = (Number(session.lives) || 0) > 0;
      var pass = alive && summary.allAttempted;
      return { eligible: pass, pass: pass, label: pass ? "Supervivencia completada." : "Sin oportunidades restantes: no hay recompensa de finalización." };
    }
    if (session.mode === "recovery") {
      var enough = summary.answered >= Math.min(3, summary.total) && summary.accuracy >= C.pass.recovery;
      return { eligible: enough, pass: enough, label: enough ? "Repaso de recuperación completado." : "El repaso exige al menos tres respuestas y " + Math.round(C.pass.recovery * 100) + "% de aciertos." };
    }
    if (session.mode === "timed" || session.mode === "simulacro") {
      var modeKey = session.mode === "timed" ? "contrarreloj" : "simulacro";
      var coverage = summary.total ? summary.correct / summary.total : 0;
      var pass2 = coverage >= C.modes[modeKey].passAccuracy &&
        summary.answered >= (session.mode === "timed" ? C.modes.contrarreloj.minAnswered : 10);
      return { eligible: pass2, pass: pass2, label: pass2 ? "Precisión suficiente para la recompensa de finalización." : "La recompensa exige precisión sobre el total y respuestas suficientes, no solo velocidad." };
    }
    return { eligible: false, pass: false, label: "Sin recompensa de finalización." };
  }

  function finish(state, sessionId, reason, now) {
    var at = now ? new Date(now) : new Date();
    var atISO = U.nowISO(at);
    var session = state.activeSession;
    if (!session || session.id !== sessionId) throw new Error("La sesión ya no está activa.");
    if (session.status !== "active") return session;
    session.updatedAt = atISO;
    var summary = summaryOf(session);
    var eligibility = completionEligibility(session, summary, reason);
    var questionXp = 0, questionCoins = 0;
    session.answerOrder.forEach(function (id) {
      var e = session.answers[id];
      if (!e) return;
      questionXp += Number(e.xp) || 0;
      questionCoins += Number(e.coins) || 0;
    });
    var completion = { xp: 0, coins: 0, reason: eligibility.label, key: "", applied: false, duplicate: false };
    if (eligibility.eligible) {
      var cr = P.completionReward(state, {
        mode: session.mode === "boss" ? "boss" : session.mode === "mission" ? "mission" : session.mode,
        missionId: session.missionId,
        now: at
      });
      if (cr.xp || cr.coins) {
        var applied = P.applyReward(state, {
          xp: cr.xp,
          coins: cr.coins,
          key: cr.key,
          source: "finalización:" + session.mode + ":" + (session.missionId || session.completedDailyDate || U.dateKey(at)),
          sessionId: session.id,
          now: at
        });
        completion = {
          xp: applied.xp,
          coins: applied.coins,
          reason: applied.applied ? cr.reason : (applied.duplicate ? "La recompensa ya estaba registrada." : cr.reason),
          key: cr.key,
          applied: applied.applied,
          duplicate: applied.duplicate
        };
      } else {
        completion = {
          xp: 0,
          coins: 0,
          reason: cr.reason,
          key: cr.key,
          applied: false,
          duplicate: !!cr.duplicate
        };
      }
    }
    var weekly = null;
    if (session.mode === "daily" && eligibility.eligible) {
      var streakResult = P.updateDailyStreak(state, at);
      if (streakResult.weekly) {
        var weeklyApplied = P.applyReward(state, {
          xp: streakResult.weekly.xp,
          coins: streakResult.weekly.coins,
          key: streakResult.weekly.key,
          source: "racha semanal",
          sessionId: session.id,
          now: at
        });
        weekly = {
          xp: weeklyApplied.xp,
          coins: weeklyApplied.coins,
          reason: streakResult.weekly.reason,
          streak: streakResult.streak
        };
      }
      state.daily.totalCompleted = (Number(state.daily.totalCompleted) || 0) + 1;
    }
    if (session.mode === "mission" || session.mode === "boss") {
      var record = state.missions[session.missionId] || {
        id: session.missionId,
        kind: session.mode === "boss" ? "boss" : "mission",
        areaId: session.areaId,
        attempts: 0,
        completedAt: null,
        bestScore: 0,
        bestAccuracy: 0,
        lastAt: null
      };
      record.attempts += 1;
      record.lastAt = atISO;
      record.lastScore = summary.score;
      record.lastAccuracy = summary.accuracy;
      record.bestScore = Math.max(Number(record.bestScore) || 0, summary.score);
      record.bestAccuracy = Math.max(Number(record.bestAccuracy) || 0, summary.accuracy);
      if (eligibility.pass && !record.completedAt) record.completedAt = atISO;
      if (eligibility.pass) record.passedAt = atISO;
      state.missions[session.missionId] = record;
    }
    if (session.mode === "survival" && eligibility.pass) state.modeStats.survivalWins += 1;
    if (session.mode === "timed" && summary.correct >= 10 && summary.accuracy >= 0.85) state.modeStats.timedAce += 1;
    if (session.mode === "simulacro" && eligibility.pass) state.modeStats.simulacros += 1;
    state.academic.sessions = (Number(state.academic.sessions) || 0) + 1;
    state.counters.sessions = (Number(state.counters.sessions) || 0) + 1;
    state.counters.date = state.counters.date || U.dateKey(at);

    var stageResult = P.stageFor({
      xp: state.xp,
      stage: state.stage,
      academic: state.academic,
      questions: state.questions,
      errors: state.errors,
      missions: state.missions,
      daily: state.daily,
      modeStats: state.modeStats
    }, Content.catalog);
    var stageChange = null;
    if (stageResult.changed) {
      state.stage = stageResult.stage;
      stageChange = { from: stageResult.previous, to: stageResult.stage, reason: stageResult.reason };
      state.events = state.events || [];
      state.events.push({
        id: U.uid("evt"),
        type: stageResult.stage > stageResult.previous ? "stageUp" : "stageDown",
        at: atISO,
        data: stageChange
      });
      state.events = state.events.slice(-200);
    }

    var unlocked = P.unlockAchievements(state, Content.catalog);
    var achievementXp = 0, achievementCoins = 0;
    unlocked.forEach(function (a) {
      achievementXp += Number(a.reward.xp) || 0;
      achievementCoins += Number(a.reward.coins) || 0;
    });
    var levelAfter = levelOf(state);
    var rankAfter = rankOf(state);
    var recommendations = [];
    var recSeen = {};
    session.answerOrder.forEach(function (id) {
      var e = session.answers[id];
      if (!e || e.correct || !e.recommendation || !e.recommendation.sheetId) return;
      if (recSeen[e.recommendation.sheetId]) return;
      recSeen[e.recommendation.sheetId] = true;
      recommendations.push(e.recommendation);
    });
    var result = {
      id: U.uid("result"),
      sessionId: session.id,
      status: reason === "abandoned" ? "abandoned" : "finished",
      reason: reason || "completed",
      pass: !!eligibility.pass,
      completionLabel: eligibility.label,
      score: summary.score,
      correct: summary.correct,
      wrong: summary.wrong,
      omitted: summary.omitted,
      answered: summary.answered,
      total: summary.total,
      accuracy: summary.accuracy,
      totalTimeMs: summary.timeMs,
      questionXp: questionXp,
      questionCoins: questionCoins,
      completionXp: completion.xp,
      completionCoins: completion.coins,
      completion: completion,
      weekly: weekly,
      achievementXp: achievementXp,
      achievementCoins: achievementCoins,
      xpEarned: questionXp + completion.xp + achievementXp + (weekly ? weekly.xp : 0),
      coinsEarned: questionCoins + completion.coins + achievementCoins + (weekly ? weekly.coins : 0),
      achievements: unlocked.map(function (a) {
        return { id: a.def.id, name: a.def.name, xp: a.reward.xp, coins: a.reward.coins };
      }),
      stageChange: stageChange,
      levelBefore: session.levelAtStart || 1,
      levelAfter: levelAfter,
      rankBefore: session.rankAtStart || "",
      rankAfter: rankAfter.name,
      rankUp: C.ranks.findIndex(function (r) { return r.name === rankAfter.name; }) > C.ranks.findIndex(function (r) { return r.name === session.rankAtStart; }),
      rankDown: C.ranks.findIndex(function (r) { return r.name === rankAfter.name; }) < C.ranks.findIndex(function (r) { return r.name === session.rankAtStart; }),
      recommendations: recommendations,
      areaBreakdown: summary.areaBreakdown,
      dailyStreak: session.mode === "daily" ? (Number(state.daily.streak) || 0) : null,
      endedAt: atISO,
      abandoned: reason === "abandoned"
    };
    session.status = reason === "abandoned" ? "abandoned" : "finished";
    session.endedAt = atISO;
    session.updatedAt = atISO;
    session.result = result;
    session.summary = summary;
    state.sessions.unshift(session);
    state.sessions = state.sessions.slice(0, 250);
    state.activeSession = null;
    return session;
  }

  function abandon(state, sessionId, now) {
    return finish(state, sessionId, "abandoned", now);
  }

  function sessionById(state, id) {
    if (state.activeSession && state.activeSession.id === id) return state.activeSession;
    return (state.sessions || []).filter(function (s) { return s.id === id; })[0] || null;
  }

  function latestSession(state) {
    return state.sessions && state.sessions.length ? state.sessions[0] : null;
  }

  function bestSessions(state) {
    return (state.sessions || []).filter(function (s) {
      return s.result && s.result.status === "finished" && s.result.pass && s.result.answered >= 3;
    }).slice().sort(function (a, b) {
      var as = a.result.score + a.result.accuracy * 100;
      var bs = b.result.score + b.result.accuracy * 100;
      if (bs !== as) return bs - as;
      return String(b.endedAt).localeCompare(String(a.endedAt));
    });
  }

  function timedRemaining(session, now) {
    if (!session || !session.endsAt) return null;
    return Math.max(0, new Date(session.endsAt).getTime() - (now ? new Date(now) : new Date()).getTime());
  }

  function questionRemaining(session, now) {
    if (!session || !session.questionEndsAt) return null;
    return Math.max(0, new Date(session.questionEndsAt).getTime() - (now ? new Date(now) : new Date()).getTime());
  }

  function timedExpired(state, now) {
    var s = state.activeSession;
    return !!(s && s.endsAt && (now ? new Date(now) : new Date()).getTime() >= new Date(s.endsAt).getTime());
  }

  function questionExpired(state, now) {
    var s = state.activeSession;
    return !!(s && s.questionEndsAt && (now ? new Date(now) : new Date()).getTime() >= new Date(s.questionEndsAt).getTime());
  }

  function answerEntry(state, questionId) {
    var s = state.activeSession;
    return s && s.answers ? s.answers[questionId] || null : null;
  }

  window.QuestEngine = {
    startSession: startSession,
    answer: answer,
    omitCurrent: omitCurrent,
    advance: advance,
    finish: finish,
    abandon: abandon,
    current: current,
    currentItem: currentItem,
    getActive: getActive,
    validateActive: validateActive,
    summaryOf: summaryOf,
    completionEligibility: completionEligibility,
    sessionById: sessionById,
    latestSession: latestSession,
    bestSessions: bestSessions,
    timedRemaining: timedRemaining,
    questionRemaining: questionRemaining,
    timedExpired: timedExpired,
    questionExpired: questionExpired,
    answerEntry: answerEntry,
    mathMax: mathMax
  };
})();
