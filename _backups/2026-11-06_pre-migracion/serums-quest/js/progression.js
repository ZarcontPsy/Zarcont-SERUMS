/* SERUMS QUEST - reglas deterministas de progresión y recompensas
   Todas las funciones son puras salvo unlockAchievements, que recibe un
   borrador de estado y aplica recompensas mediante el mismo registro idempotente. */
(function () {
  "use strict";

  var C = window.QUEST_CONFIG;
  var U = window.QuestUtil;
  var AREAS = C.areas;

  function levelCurve(level) {
    var l = Math.max(1, Math.floor(Number(level) || 1));
    return C.levels.base + C.levels.linear * (l - 1) + C.levels.quadratic * Math.pow(l - 1, 2);
  }

  function levelFromXp(totalXp) {
    var xp = Math.max(0, Number(totalXp) || 0);
    var level = 1;
    var remaining = xp;
    var guard = 0;
    while (level < C.levels.maxLevel && remaining >= levelCurve(level) && guard < 1000) {
      remaining -= levelCurve(level);
      level += 1;
      guard += 1;
    }
    if (level >= C.levels.maxLevel) {
      return {
        level: C.levels.maxLevel,
        intoLevel: 0,
        needed: 0,
        toNext: 0,
        percent: 100,
        totalXp: xp,
        levelStartXp: xp,
        maxed: true
      };
    }
    var needed = levelCurve(level);
    return {
      level: level,
      intoLevel: remaining,
      needed: needed,
      toNext: Math.max(0, needed - remaining),
      percent: needed ? Math.min(100, Math.round((remaining / needed) * 1000) / 10) : 100,
      totalXp: xp,
      levelStartXp: xp - remaining,
      maxed: false
    };
  }

  function totalXpForLevel(level) {
    var target = Math.max(1, Math.floor(Number(level) || 1));
    var total = 0;
    for (var l = 1; l < target; l += 1) total += levelCurve(l);
    return total;
  }

  function rankFor(stats) {
    var s = stats || {};
    var chosen = C.ranks[0];
    C.ranks.forEach(function (rank) {
      if (Number(s.xp) >= rank.xp &&
          Number(s.answered) >= rank.answered &&
          Number(s.accuracy) >= rank.accuracy &&
          Number(s.mastered) >= rank.mastered &&
          Number(s.areas) >= rank.areas &&
          Number(s.bosses) >= rank.bosses) {
        chosen = rank;
      }
    });
    return chosen;
  }

  function nextRank(stats) {
    var current = rankFor(stats);
    var index = C.ranks.findIndex(function (r) { return r.id === current.id; });
    return C.ranks[index + 1] || null;
  }

  function rankProgress(stats) {
    var current = rankFor(stats);
    var next = nextRank(stats);
    if (!next) return { current: current, next: null, percent: 100, missing: [] };
    var checks = [
      { label: "XP", have: Number(stats.xp) || 0, need: next.xp, met: Number(stats.xp) >= next.xp },
      { label: "Respuestas", have: Number(stats.answered) || 0, need: next.answered, met: Number(stats.answered) >= next.answered },
      { label: "Precisión", have: Math.round((Number(stats.accuracy) || 0) * 100), need: Math.round(next.accuracy * 100), suffix: "%", met: Number(stats.accuracy) >= next.accuracy },
      { label: "Dominadas", have: Number(stats.mastered) || 0, need: next.mastered, met: Number(stats.mastered) >= next.mastered },
      { label: "Áreas", have: Number(stats.areas) || 0, need: next.areas, met: Number(stats.areas) >= next.areas },
      { label: "Jefes", have: Number(stats.bosses) || 0, need: next.bosses, met: Number(stats.bosses) >= next.bosses }
    ].filter(function (c) { return c.need > 0; });
    var met = checks.filter(function (c) { return c.met; }).length;
    return {
      current: current,
      next: next,
      percent: checks.length ? Math.round((met / checks.length) * 100) : 100,
      missing: checks.filter(function (c) { return !c.met; })
    };
  }

  function recentAccuracy(state, windowSize) {
    var recent = (state.academic && state.academic.recent) || [];
    var size = windowSize || C.stageRules.downgradeWindow;
    var slice = recent.slice(-size);
    if (!slice.length) return { count: 0, accuracy: 0 };
    var correct = slice.filter(function (r) { return r.correct; }).length;
    return { count: slice.length, accuracy: correct / slice.length };
  }

  function baseStats(state, catalog) {
    var a = (state && state.academic) || {};
    var answered = Number(a.answered) || 0;
    var correct = Number(a.correct) || 0;
    var accuracy = answered ? correct / answered : 0;
    var questions = (state && state.questions) || {};
    var mastered = Object.keys(questions).filter(function (id) {
      return Number(questions[id].mastery) >= 3;
    }).length;
    var areasCorrect = 0;
    AREAS.forEach(function (areaId) {
      var stat = a.byArea && a.byArea[areaId];
      if (stat && Number(stat.reliableCorrect) > 0) areasCorrect += 1;
    });
    var errors = (state && state.errors) || {};
    var recoveries = Object.keys(errors).filter(function (id) {
      return !!errors[id].recoveredAt;
    }).length;
    var missions = state && state.missions ? state.missions : {};
    var missionsCompleted = 0, bosses = 0;
    Object.keys(missions).forEach(function (id) {
      var m = missions[id];
      if (!m || !m.completedAt) return;
      if (m.kind === "boss") bosses += 1;
      else missionsCompleted += 1;
    });
    var areasCompleted = 0;
    if (catalog) {
      AREAS.forEach(function (areaId) {
        var route = catalog.areaRoutes && catalog.areaRoutes[areaId];
        if (!route) return;
        var required = (route.missions || []).filter(function (m) { return m.kind !== "boss"; });
        var done = required.length > 0 && required.every(function (m) {
          return missions[m.id] && missions[m.id].completedAt;
        });
        if (done) areasCompleted += 1;
      });
    }
    var daily = (state && state.daily) || {};
    var level = levelFromXp((state && state.xp) || 0).level;
    var mode = (state && state.modeStats) || {};
    var recent = recentAccuracy(state);
    return {
      xp: Number(state && state.xp) || 0,
      coins: Number(state && state.coins) || 0,
      answered: answered,
      correct: correct,
      wrong: Number(a.wrong) || 0,
      accuracy: accuracy,
      mastered: mastered,
      areasCorrect: areasCorrect,
      areas: areasCorrect,
      areasCompleted: areasCompleted,
      recoveries: recoveries,
      missions: missionsCompleted,
      bosses: bosses,
      dailyStreak: Number(daily.streak) || 0,
      bestDailyStreak: Number(daily.bestStreak) || 0,
      level: level,
      survivalWins: Number(mode.survivalWins) || 0,
      timedAce: Number(mode.timedAce) || 0,
      recentCount: recent.count,
      recentAccuracy: recent.accuracy
    };
  }

  function stageFor(state, catalog) {
    var stats = baseStats(state, catalog);
    var previous = Math.max(1, Math.min(4, Number(state.stage) || 1));
    var rules = C.stageRules;
    var stage = previous;
    var reason = "Sin cambio: aún no hay evidencia suficiente.";
    if (previous < 2 && stats.answered >= rules.minAnswersForStage2 && stats.accuracy >= rules.minAccuracyStage2) {
      stage = 2;
      reason = "12 respuestas evaluadas con al menos 55% de precisión.";
    } else if (previous === 2 && stats.answered >= rules.minAnswersForStage3 && stats.accuracy >= rules.minAccuracyStage3 && stats.mastered >= rules.minMasteredStage3) {
      stage = 3;
      reason = "30 respuestas, 65% de precisión y 5 preguntas dominadas.";
    } else if (previous === 3 && stats.answered >= rules.minAnswersForStage4 && stats.accuracy >= rules.minAccuracyStage4 && stats.mastered >= rules.minMasteredStage4 && stats.missions >= rules.minMissionsStage4) {
      stage = 4;
      reason = "60 respuestas, 72% de precisión, 12 dominadas y 6 misiones.";
    } else if (previous > 1 && stats.recentCount >= rules.downgradeWindow && stats.recentAccuracy < rules.downgradeAccuracy) {
      stage = previous - 1;
      reason = "Descenso de una etapa tras 12 respuestas recientes por debajo de 40%. No se baja por un error aislado.";
    }
    return {
      stage: stage,
      previous: previous,
      changed: stage !== previous,
      reason: reason,
      stats: stats
    };
  }

  function nextStageRequirements(state, catalog) {
    var stats = baseStats(state, catalog);
    var stage = Number(state.stage) || 1;
    var rules = C.stageRules;
    if (stage >= 4) return { stage: 4, complete: true, items: [] };
    var target = stage + 1;
    var items = [];
    function addItem(label, have, need, suffix, met) {
      items.push({ label: label, have: have, need: need, suffix: suffix || "", met: met === undefined ? have >= need : met });
    }
    if (target === 2) {
      addItem("Respuestas evaluadas", stats.answered, rules.minAnswersForStage2);
      addItem("Precisión global", Math.round(stats.accuracy * 100), Math.round(rules.minAccuracyStage2 * 100), "%", stats.accuracy >= rules.minAccuracyStage2);
    } else if (target === 3) {
      addItem("Respuestas evaluadas", stats.answered, rules.minAnswersForStage3);
      addItem("Precisión global", Math.round(stats.accuracy * 100), Math.round(rules.minAccuracyStage3 * 100), "%", stats.accuracy >= rules.minAccuracyStage3);
      addItem("Preguntas dominadas", stats.mastered, rules.minMasteredStage3);
    } else if (target === 4) {
      addItem("Respuestas evaluadas", stats.answered, rules.minAnswersForStage4);
      addItem("Precisión global", Math.round(stats.accuracy * 100), Math.round(rules.minAccuracyStage4 * 100), "%", stats.accuracy >= rules.minAccuracyStage4);
      addItem("Preguntas dominadas", stats.mastered, rules.minMasteredStage4);
      addItem("Misiones completadas", stats.missions, rules.minMissionsStage4);
    }
    var complete = items.every(function (i) { return i.met; });
    return { stage: stage, target: target, complete: complete, items: items, stats: stats };
  }

  function questionReward(options) {
    var opts = options || {};
    var base = Math.max(0, Number(opts.baseXp) || 0);
    var prior = opts.prior || null;
    var now = opts.now ? new Date(opts.now) : new Date();
    var multiplier = 1;
    var reason = "Primera respuesta correcta.";
    var suppressed = false;
    if (prior && Number(prior.attempts) > 0) {
      if (prior.lastResult === "wrong") {
        multiplier = C.antiFarm.recoveryMultiplier;
        reason = "Recuperación de una pregunta fallada.";
      } else if (prior.lastResult === "correct") {
        var last = U.parseDate(prior.lastCorrectAt || prior.lastAttemptAt);
        var hours = last ? (now - last) / 3600000 : 9999;
        var mastery = Number(prior.mastery) || 0;
        if (hours < C.antiFarm.repeatCooldownHours) {
          multiplier = 0;
          suppressed = true;
          reason = "Repetición dentro de las primeras " + C.antiFarm.repeatCooldownHours + " horas: sin XP para evitar acumulación artificial.";
        } else if (mastery >= 3) {
          if (hours < C.antiFarm.masteredCooldownDays * 24) {
            multiplier = 0;
            suppressed = true;
            reason = "Pregunta dominada: el repaso aún no cumple el intervalo de " + C.antiFarm.masteredCooldownDays + " días.";
          } else {
            multiplier = C.antiFarm.masteredMultiplier;
            reason = "Repaso espaciado de una pregunta dominada: recompensa reducida.";
          }
        } else if (hours < 24) {
          multiplier = C.antiFarm.repeatWithin24h;
          reason = "Segunda práctica del día: recompensa reducida.";
        } else {
          multiplier = C.antiFarm.repeatAfter24h;
          reason = "Repaso posterior: recompensa parcial.";
        }
      }
    }
    var xp = multiplier > 0 ? Math.max(1, Math.round(base * multiplier)) : 0;
    var firstCorrect = !prior || !prior.firstCorrectAt;
    var coins = firstCorrect && !suppressed ? C.coins.firstCorrect : 0;
    return {
      xp: opts.correct ? xp : 0,
      coins: opts.correct ? coins : 0,
      multiplier: multiplier,
      baseXp: base,
      suppressed: suppressed,
      reason: opts.correct ? reason : "Respuesta incorrecta: no se otorga XP ni monedas.",
      firstCorrect: !!firstCorrect
    };
  }

  function hasLedger(state, key) {
    return !!(state && state.rewards && key && state.rewards[key]);
  }

  function resetDailyCounters(state, now) {
    var key = U.dateKey(now || new Date());
    if (!state.counters || state.counters.date !== key) {
      state.counters = { date: key, coins: 0, xp: 0, sessions: 0 };
    }
    return state.counters;
  }

  function applyReward(state, reward) {
    var r = reward || {};
    var xp = Math.max(0, U.safeInt(r.xp, 0));
    var coins = Math.max(0, U.safeInt(r.coins, 0));
    var key = String(r.key || "");
    if (key && hasLedger(state, key)) {
      return { applied: false, duplicate: true, xp: 0, coins: 0, key: key, beforeLevel: levelFromXp(state.xp).level, afterLevel: levelFromXp(state.xp).level };
    }
    var beforeLevel = levelFromXp(state.xp).level;
    var counters = resetDailyCounters(state, r.now || new Date());
    if (coins > 0 && !r.ignoreCoinCap) {
      var remaining = Math.max(0, C.coins.dailyCap - counters.coins);
      coins = Math.min(coins, remaining);
    }
    state.xp = Math.max(0, U.safeInt(state.xp, 0) + xp);
    state.coins = Math.max(0, U.safeInt(state.coins, 0) + coins);
    counters.xp += xp;
    counters.coins += coins;
    if (key) {
      state.rewards[key] = {
        at: U.nowISO(r.now || new Date()),
        xp: xp,
        coins: coins,
        source: r.source || "recompensa",
        sessionId: r.sessionId || null
      };
      var answerKeys = Object.keys(state.rewards).filter(function (rewardKey) {
        return rewardKey.indexOf("answer:") === 0;
      });
      if (answerKeys.length > 4000) {
        answerKeys.slice(0, answerKeys.length - 4000).forEach(function (oldKey) { delete state.rewards[oldKey]; });
      }
    }
    var afterLevel = levelFromXp(state.xp).level;
    if (afterLevel > beforeLevel) {
      state.events = state.events || [];
      state.events.push({
        id: U.uid("evt"),
        type: "levelUp",
        at: U.nowISO(r.now || new Date()),
        data: { from: beforeLevel, to: afterLevel }
      });
      state.events = state.events.slice(-200);
    }
    return {
      applied: xp > 0 || coins > 0,
      duplicate: false,
      xp: xp,
      coins: coins,
      key: key,
      beforeLevel: beforeLevel,
      afterLevel: afterLevel,
      levelUp: afterLevel > beforeLevel
    };
  }

  function completionReward(state, options) {
    var opts = options || {};
    var mode = opts.mode;
    var now = opts.now || new Date();
    var key = "";
    var amountXp = 0;
    var amountCoins = 0;
    var eligible = opts.eligible !== false;
    if (mode === "mission") {
      key = "mission:" + opts.missionId + ":completion";
      amountXp = C.xp.completion.mission;
      amountCoins = C.coins.completion.mission;
    } else if (mode === "boss") {
      key = "boss:" + opts.missionId + ":completion";
      amountXp = C.xp.completion.boss;
      amountCoins = C.coins.completion.boss;
    } else if (mode === "daily") {
      key = "daily:" + U.dateKey(now) + ":completion";
      amountXp = C.xp.completion.daily;
      amountCoins = C.coins.completion.daily;
    } else if (mode === "survival") {
      key = "survival:" + U.dateKey(now) + ":completion";
      amountXp = C.xp.completion.survival;
      amountCoins = C.coins.completion.survival;
    } else if (mode === "timed") {
      key = "timed:" + U.dateKey(now) + ":completion";
      amountXp = C.xp.completion.timed;
      amountCoins = C.coins.completion.timed;
    } else if (mode === "recovery") {
      key = "recovery:" + U.dateKey(now) + ":completion";
      amountXp = C.xp.completion.recovery;
      amountCoins = C.coins.completion.recovery;
    } else if (mode === "simulacro") {
      key = "simulacro:" + U.dateKey(now) + ":completion";
      amountXp = C.xp.completion.simulacro;
      amountCoins = C.coins.completion.simulacro;
    }
    if (!eligible || !key) {
      return { xp: 0, coins: 0, key: key, reason: "La recompensa de finalización no corresponde en este resultado.", eligible: false };
    }
    if ((mode === "mission" || mode === "boss") && state.missions && state.missions[opts.missionId] && state.missions[opts.missionId].completedAt) {
      return { xp: 0, coins: 0, key: key, reason: "Esta misión ya fue completada; la recompensa de finalización no se repite.", duplicate: true, eligible: true };
    }
    if (mode === "daily" && state.daily && state.daily.lastCompletedDate === U.dateKey(now)) {
      return { xp: 0, coins: 0, key: key, reason: "El desafío diario de hoy ya fue completado.", duplicate: true, eligible: true };
    }
    if (hasLedger(state, key)) {
      return { xp: 0, coins: 0, key: key, reason: "Recompensa de finalización ya registrada para este desafío.", duplicate: true, eligible: true };
    }
    return { xp: amountXp, coins: amountCoins, key: key, reason: "Recompensa de finalización anunciada.", eligible: true };
  }

  function updateDailyStreak(state, now) {
    var today = U.dateKey(now || new Date());
    var daily = state.daily || {};
    if (daily.lastCompletedDate === today) {
      return { changed: false, streak: Number(daily.streak) || 0, weekly: null };
    }
    var yesterday = U.dateKey(U.addDays(now || new Date(), -1));
    var previous = daily.lastCompletedDate;
    var streak = previous === yesterday ? (Number(daily.streak) || 0) + 1 : 1;
    daily.streak = streak;
    daily.bestStreak = Math.max(Number(daily.bestStreak) || 0, streak);
    daily.lastCompletedDate = today;
    daily.lastDate = today;
    state.daily = daily;
    var weekly = null;
    if (streak >= 7) {
      var weekKey = U.isoWeekKey(now || new Date());
      var rewardKey = "weekly:" + weekKey + ":bonus";
      if (!hasLedger(state, rewardKey)) {
        weekly = {
          xp: C.xp.weeklyStreak,
          coins: C.coins.weeklyStreak,
          key: rewardKey,
          reason: "Bono semanal por 7 días de continuidad."
        };
      }
    }
    return { changed: true, streak: streak, weekly: weekly, previous: previous };
  }

  function achievementValue(def, stats) {
    var metric = def.metric;
    if (metric === "timedAce") return stats.timedAce;
    if (metric === "accuracy") return stats.answered >= (def.minAnswered || 0) ? stats.accuracy : 0;
    if (metric === "level") return stats.level;
    if (metric === "coins") return stats.coins;
    if (metric === "areasCorrect") return stats.areasCorrect;
    if (metric === "areasCompleted") return stats.areasCompleted;
    if (metric === "survivalWins") return stats.survivalWins;
    return Number(stats[metric]) || 0;
  }

  function achievementProgress(def, stats) {
    var have = achievementValue(def, stats);
    var target = Number(def.target) || 1;
    var percent = target ? Math.min(100, Math.round((have / target) * 1000) / 10) : 0;
    return {
      def: def,
      have: have,
      target: target,
      percent: percent,
      met: have >= target,
      display: def.metric === "accuracy"
        ? Math.round(have * 100) + "% / " + Math.round(target * 100) + "%"
        : (Number(have) || 0) + " / " + target
    };
  }

  function unlockAchievements(state, catalog) {
    var stats = baseStats(state, catalog);
    var unlocked = [];
    state.achievements = state.achievements || {};
    C.achievements.forEach(function (def) {
      if (state.achievements[def.id] && state.achievements[def.id].unlockedAt) return;
      var progress = achievementProgress(def, stats);
      if (!progress.met) return;
      var reward = applyReward(state, {
        xp: def.xp,
        coins: def.coins,
        key: "achievement:" + def.id,
        source: "logro: " + def.name,
        ignoreCoinCap: true
      });
      state.achievements[def.id] = {
        unlockedAt: U.nowISO(),
        xp: reward.xp,
        coins: reward.coins
      };
      unlocked.push({ def: def, reward: reward });
    });
    return unlocked;
  }

  function questionMastery(prior, correct, now) {
    var mastery = Math.max(0, Math.min(5, Number(prior && prior.mastery) || 0));
    if (!correct) return Math.max(0, mastery - 1);
    // El dominio exige aciertos espaciados: repetir de inmediato no lo aumenta.
    if (prior && prior.lastResult === "correct" && prior.lastCorrectAt && now) {
      var last = U.parseDate(prior.lastCorrectAt);
      var at = U.parseDate(now);
      if (last && at && (at - last) / 3600000 < 24) return mastery;
    }
    return Math.min(5, mastery + 1);
  }

  function nextReviewFor(prior, correct, now) {
    var date = now ? new Date(now) : new Date();
    if (!correct) {
      return {
        at: U.addMinutes(date, C.recovery.firstDelayMinutes).toISOString(),
        level: 0
      };
    }
    var level = Math.min(
      C.recovery.intervalsDays.length - 1,
      Math.max(0, Number(prior && prior.recoveryLevel) || 0)
    );
    var days = C.recovery.intervalsDays[level];
    return {
      at: U.addDays(date, days).toISOString(),
      level: Math.min(C.recovery.intervalsDays.length - 1, level + 1)
    };
  }

  window.QuestProgression = {
    levelCurve: levelCurve,
    levelFromXp: levelFromXp,
    totalXpForLevel: totalXpForLevel,
    rankFor: rankFor,
    nextRank: nextRank,
    rankProgress: rankProgress,
    recentAccuracy: recentAccuracy,
    stats: baseStats,
    stageFor: stageFor,
    nextStageRequirements: nextStageRequirements,
    questionReward: questionReward,
    completionReward: completionReward,
    applyReward: applyReward,
    hasLedger: hasLedger,
    updateDailyStreak: updateDailyStreak,
    achievementProgress: achievementProgress,
    achievementValue: achievementValue,
    unlockAchievements: unlockAchievements,
    questionMastery: questionMastery,
    nextReviewFor: nextReviewFor,
    resetDailyCounters: resetDailyCounters
  };
})();
