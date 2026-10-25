/* SERUMS QUEST - pruebas ejecutables en navegador
   © 2026 ZARCONT. Sin dependencias externas. */
(function () {
  "use strict";

  var C = window.QUEST_CONFIG;
  var U = window.QuestUtil;
  var P = window.QuestProgression;
  var Store = window.QuestStore;
  var Content = window.QuestContent;
  var Engine = window.QuestEngine;
  var NOW = new Date(2026, 9, 25, 12, 0, 0);
  var tests = [];
  var results = [];

  function test(name, fn) { tests.push({ name: name, fn: fn }); }
  function assert(condition, message) {
    if (!condition) throw new Error(message || "Aserción incumplida.");
  }
  function equal(actual, expected, message) {
    if (actual !== expected) {
      throw new Error((message || "Valor inesperado") + ": recibido " + JSON.stringify(actual) + ", esperado " + JSON.stringify(expected) + ".");
    }
  }
  function includes(text, fragment, message) {
    assert(String(text).indexOf(fragment) !== -1, (message || "No se encontró el fragmento") + ": " + fragment);
  }
  function makeStore(label) {
    var storage = Store.makeMemoryStorage();
    var prefix = "test:" + (label || "case") + ":" + Math.random().toString(16).slice(2) + ":";
    var store = Store.create({
      storage: storage,
      prefix: prefix,
      now: function () { return new Date(NOW); },
      autoSnapshot: false
    });
    store.init();
    return store;
  }
  function stateOf(store) { return store.getState(); }
  function commit(store, fn) { return store.commit(fn).result; }

  function play(store, descriptor, choose) {
    commit(store, function (draft) { return Engine.startSession(draft, descriptor, NOW); });
    var guard = 0;
    var wrongUsed = false;
    while (stateOf(store).activeSession && guard < 40) {
      var session = stateOf(store).activeSession;
      var item = session.questions[session.cursor];
      var question = Content.getQuestion(item.questionId);
      var choice = question.answer;
      if (typeof choose === "function") {
        var custom = choose(question, session, wrongUsed);
        if (custom) {
          choice = custom;
          if (custom !== question.answer) wrongUsed = true;
        }
      }
      commit(store, function (draft) { return Engine.answer(draft, session.id, choice, NOW); });
      var advanced = commit(store, function (draft) { return Engine.advance(draft, session.id, NOW); });
      if (advanced && advanced.finished) break;
      guard += 1;
    }
    return stateOf(store).sessions[0];
  }

  function sessionIds(challenge) {
    return challenge.questions.map(function (q) { return q.questionId; }).join("|");
  }

  /* ------------------------------------------------------------------ */
  /* Reglas de progresión                                               */
  /* ------------------------------------------------------------------ */
  test("Curva de nivel centralizada y reversible", function () {
    equal(P.levelCurve(1), 80);
    equal(P.levelCurve(2), 130);
    equal(P.totalXpForLevel(2), 80);
    equal(P.levelFromXp(0).level, 1);
    equal(P.levelFromXp(80).level, 2);
    equal(P.levelFromXp(210).level, 3);
    equal(P.levelFromXp(210).intoLevel, 0);
    equal(P.levelFromXp(410).level, 4);
  });

  test("Rangos exigen XP, precisión, dominio y áreas", function () {
    var bachiller = P.rankFor({ xp: 0, answered: 0, accuracy: 0, mastered: 0, areas: 0, bosses: 0 });
    equal(bachiller.id, "bachiller");
    var interno = P.rankFor({ xp: 160, answered: 10, accuracy: 0.6, mastered: 0, areas: 1, bosses: 0 });
    equal(interno.id, "interno");
    var serumista = P.rankFor({ xp: 500, answered: 30, accuracy: 0.7, mastered: 10, areas: 3, bosses: 0 });
    equal(serumista.id, "serumista");
    var noArea = P.rankFor({ xp: 500, answered: 30, accuracy: 0.7, mastered: 10, areas: 0, bosses: 0 });
    equal(noArea.id, "bachiller");
    var progreso = P.rankProgress({ xp: 1100, answered: 70, accuracy: 0.8, mastered: 30, areas: 5, bosses: 1 });
    assert(progreso.current && progreso.current.id === "especialista", "El rango actual debe ser Especialista.");
    assert(progreso.next && progreso.next.id === "maestro", "El siguiente rango debe ser Maestro SERUMS.");
    assert(progreso.percent > 0 && progreso.percent < 100, "El progreso de rango debe ser parcial.");
  });

  test("Una respuesta no cambia la etapa; 12 respuestas con 55% sí", function () {
    var base = Store.defaultState(NOW);
    base.academic.answered = 1;
    base.academic.correct = 1;
    base.academic.recent = [{ correct: true, at: U.nowISO(NOW) }];
    equal(P.stageFor(base, Content.catalog).stage, 1);
    base.academic.answered = 12;
    base.academic.correct = 12;
    base.academic.recent = Array.from({ length: 12 }).map(function () { return { correct: true, at: U.nowISO(NOW) }; });
    equal(P.stageFor(base, Content.catalog).stage, 2);
  });

  test("La etapa no baja por un error aislado; sí tras 12 recientes bajo 40%", function () {
    var base = Store.defaultState(NOW);
    base.stage = 2;
    base.academic.answered = 12;
    base.academic.correct = 11;
    base.academic.recent = Array.from({ length: 11 }).map(function () { return { correct: true, at: U.nowISO(NOW) }; });
    base.academic.recent.push({ correct: false, at: U.nowISO(NOW) });
    equal(P.stageFor(base, Content.catalog).stage, 2);
    base.academic.answered = 30;
    base.academic.correct = 15;
    base.academic.recent = Array.from({ length: 12 }).map(function (_, i) { return { correct: i < 3, at: U.nowISO(NOW) }; });
    equal(P.stageFor(base, Content.catalog).stage, 1);
  });

  test("Dominio exige 60 respuestas, 72%, 12 dominadas y 6 misiones", function () {
    var base = Store.defaultState(NOW);
    base.stage = 3;
    base.academic.answered = 60;
    base.academic.correct = 48;
    base.academic.recent = Array.from({ length: 12 }).map(function () { return { correct: true, at: U.nowISO(NOW) }; });
    for (var i = 0; i < 12; i += 1) base.questions["q" + i] = { mastery: 3 };
    for (var j = 0; j < 6; j += 1) base.missions["m" + j] = { kind: "mission", completedAt: U.nowISO(NOW) };
    equal(P.stageFor(base, Content.catalog).stage, 4);
    base.questions = {};
    equal(P.stageFor(base, Content.catalog).stage, 3);
  });

  test("XP por pregunta, recuperación y anti-repetición", function () {
    var first = P.questionReward({ baseXp: 20, prior: null, correct: true, now: NOW });
    equal(first.xp, 20);
    equal(first.coins, 1);
    var wrong = P.questionReward({ baseXp: 20, prior: null, correct: false, now: NOW });
    equal(wrong.xp, 0);
    equal(wrong.coins, 0);
    var priorWrong = { attempts: 1, lastResult: "wrong", firstCorrectAt: null, mastery: 0 };
    equal(P.questionReward({ baseXp: 20, prior: priorWrong, correct: true, now: NOW }).xp, 14);
    var priorRecent = { attempts: 1, lastResult: "correct", lastCorrectAt: new Date(NOW.getTime() - 3600000).toISOString(), mastery: 1 };
    var recent = P.questionReward({ baseXp: 20, prior: priorRecent, correct: true, now: NOW });
    equal(recent.xp, 0);
    assert(recent.suppressed, "La repetición reciente debe quedar suprimida.");
    var priorMastered = { attempts: 3, lastResult: "correct", lastCorrectAt: new Date(NOW.getTime() - 8 * 86400000).toISOString(), mastery: 3 };
    equal(P.questionReward({ baseXp: 20, prior: priorMastered, correct: true, now: NOW }).xp, 2);
  });

  test("El dominio exige aciertos espaciados, no repetición inmediata", function () {
    var prior = { mastery: 1, lastResult: "correct", lastCorrectAt: new Date(NOW.getTime() - 3600000).toISOString() };
    equal(P.questionMastery(prior, true, NOW), 1);
    var spaced = { mastery: 1, lastResult: "correct", lastCorrectAt: new Date(NOW.getTime() - 25 * 3600000).toISOString() };
    equal(P.questionMastery(spaced, true, NOW), 2);
    equal(P.questionMastery({ mastery: 2, lastResult: "wrong" }, true, NOW), 3);
  });

  test("Recompensa idempotente y subida de nivel sin reinicio", function () {
    var state = Store.defaultState(NOW);
    var first = P.applyReward(state, { xp: 80, coins: 5, key: "test:level", source: "prueba" });
    assert(first.applied, "La primera recompensa debe aplicarse.");
    equal(state.xp, 80);
    equal(P.levelFromXp(state.xp).level, 2);
    var second = P.applyReward(state, { xp: 80, coins: 5, key: "test:level", source: "prueba" });
    assert(second.duplicate, "La segunda recompensa debe detectarse como duplicada.");
    equal(state.xp, 80);
    equal(state.coins, 5);
    assert(state.events.some(function (e) { return e.type === "levelUp"; }), "Debe registrar el evento de subida de nivel.");
  });

  test("Recompensa de finalización única por misión", function () {
    var state = Store.defaultState(NOW);
    var first = P.completionReward(state, { mode: "mission", missionId: "mission-sp-1", now: NOW });
    assert(first.xp > 0, "La primera finalización debe tener recompensa.");
    P.applyReward(state, { xp: first.xp, coins: first.coins, key: first.key, source: "finalización", now: NOW });
    var second = P.completionReward(state, { mode: "mission", missionId: "mission-sp-1", now: NOW });
    assert(second.duplicate, "La segunda finalización debe ser duplicada.");
    equal(second.xp, 0);
  });

  test("Programación de repaso espaciado", function () {
    var wrong = P.nextReviewFor(null, false, NOW);
    equal(new Date(wrong.at).getTime(), NOW.getTime() + C.recovery.firstDelayMinutes * 60000);
    var correct = P.nextReviewFor(null, true, NOW);
    equal(new Date(correct.at).getTime(), NOW.getTime() + 86400000);
    var level = P.nextReviewFor({ recoveryLevel: 3 }, true, NOW);
    equal(new Date(level.at).getTime(), NOW.getTime() + 14 * 86400000);
  });

  /* ------------------------------------------------------------------ */
  /* Persistencia                                                       */
  /* ------------------------------------------------------------------ */
  test("Persistencia después de recargar (misma clave)", function () {
    var storage = Store.makeMemoryStorage();
    var prefix = "persist:" + Math.random().toString(16).slice(2) + ":";
    var store1 = Store.create({ storage: storage, prefix: prefix, now: function () { return new Date(NOW); }, autoSnapshot: false });
    store1.init();
    store1.commit(function (draft) { draft.xp = 120; draft.coins = 9; });
    var store2 = Store.create({ storage: storage, prefix: prefix, now: function () { return new Date(NOW); }, autoSnapshot: false });
    store2.init();
    equal(store2.getState().xp, 120);
    equal(store2.getState().coins, 9);
  });

  test("Migración conserva datos y crea respaldo", function () {
    var storage = Store.makeMemoryStorage();
    var prefix = "migrate:" + Math.random().toString(16).slice(2) + ":";
    storage.setItem(prefix + C.storage.stateKey, JSON.stringify({
      schemaVersion: 0,
      xp: 100,
      coins: 7,
      profile: { name: "Migrado" },
      questions: {},
      errors: {},
      sessions: []
    }));
    var store = Store.create({ storage: storage, prefix: prefix, now: function () { return new Date(NOW); }, autoSnapshot: false });
    store.init();
    var state = store.getState();
    equal(state.schemaVersion, C.schemaVersion);
    equal(state.xp, 100);
    equal(state.coins, 7);
    equal(state.profile.name, "Migrado");
    equal(state.meta.migratedFrom, "0");
    assert(storage.getItem(prefix + C.storage.backupKey), "Debe existir un respaldo de la migración.");
  });

  test("Transacción fallida no altera el estado", function () {
    var store = makeStore("rollback");
    var before = store.getState().xp;
    var failed = false;
    try {
      store.commit(function (draft) { draft.xp = -50; });
    } catch (e) { failed = true; }
    assert(failed, "La transacción inválida debe fallar.");
    equal(store.getState().xp, before);
  });

  test("Exportar e importar progreso", function () {
    var store = makeStore("export");
    store.commit(function (draft) { draft.xp = 222; draft.coins = 11; });
    var text = store.exportState();
    var target = makeStore("import");
    target.importPayload(text);
    equal(target.getState().xp, 222);
    equal(target.getState().coins, 11);
  });

  /* ------------------------------------------------------------------ */
  /* Contenido                                                          */
  /* ------------------------------------------------------------------ */
  test("Banco de Psicología íntegro y con claves verificables", function () {
    equal(Content.ready, true);
    equal(Content.questions.length, 300);
    equal(Content.status.invalid, 0);
    equal(Content.exams.length, 3);
    equal(Content.catalog.missionList.length, 13);
    equal(Content.catalog.bossList.length, 5);
    var ids = {};
    Content.questions.forEach(function (q) {
      assert(!ids[q.id], "ID duplicado: " + q.id);
      ids[q.id] = true;
      assert(q.valid, "Pregunta no válida: " + q.id);
      assert(q.options.some(function (o) { return o.id === q.answer; }), "Clave fuera de alternativas: " + q.id);
      assert(q.sourceUrl.indexOf("#page=") !== -1, "Fuente sin página: " + q.id);
      equal(q.hasExplanation, false, "No debe inventarse explicación: " + q.id);
    });
    assert(Content.status.scored >= 200, "Debe haber suficiente contenido puntuable.");
  });

  test("Misiones sin preguntas duplicadas y con contenido válido", function () {
    Content.catalog.all.forEach(function (mission) {
      assert(mission.questionIds.length >= 4, "Misión demasiado corta: " + mission.id);
      equal(new Set(mission.questionIds).size, mission.questionIds.length, "Pregunta repetida en " + mission.id);
      mission.questionIds.forEach(function (id) {
        assert(Content.getQuestion(id), "Pregunta inexistente en misión: " + id);
      });
    });
  });

  test("El mapa no inventa referencias de tema o ficha", function () {
    var study = window.STUDY_CONTENT;
    var topics = new Set((study.topics || []).map(function (t) { return t.id; }));
    var sheets = new Set((study.sheets || []).map(function (s) { return s.id; }));
    Content.questions.forEach(function (q) {
      if (q.topicId) assert(topics.has(q.topicId), "Tema inexistente: " + q.topicId);
      if (q.sheetId) assert(sheets.has(q.sheetId), "Ficha inexistente: " + q.sheetId);
      if (q.areaId) assert(C.areas.indexOf(q.areaId) !== -1, "Área inexistente: " + q.areaId);
    });
  });

  test("Preguntas sin clave verificable quedan excluidas", function () {
    var bank = window.BANCO_OFICIAL;
    var fake = {
      id: "__test_invalid_exam__",
      professionId: "psicologia",
      title: "Prueba de exclusión",
      cycle: "test",
      questions: 1,
      validQuestions: 0,
      filePath: "documentos/test.pdf",
      date: "01/01/2026"
    };
    bank.exams.push(fake);
    bank.questions[fake.id] = [{
      id: "__test_invalid_q__",
      n: 1,
      p: 1,
      s: "Pregunta de prueba sin clave verificable.",
      o: [{ id: "A", text: "Uno" }, { id: "B", text: "Dos" }],
      c: "Z",
      st: "valid",
      cf: "alta"
    }];
    try {
      Content.build();
      assert(!Content.getQuestion("__test_invalid_q__"), "La pregunta inválida no debe entrar al índice.");
      assert(Content.status.invalid >= 1, "Debe registrarse al menos una pregunta inválida.");
    } finally {
      bank.exams = bank.exams.filter(function (e) { return e.id !== fake.id; });
      delete bank.questions[fake.id];
      Content.build();
    }
    equal(Content.questions.length, 300);
  });

  test("Desafío diario determinista, único y bloqueado tras completar", function () {
    var store = makeStore("daily");
    var state = store.getState();
    var a = Content.dailyChallenge(state, "2026-10-25");
    var b = Content.dailyChallenge(state, "2026-10-25");
    var c = Content.dailyChallenge(state, "2026-10-26");
    equal(a.questionCount, 6);
    equal(new Set(a.questions.map(function (q) { return q.questionId; })).size, 6);
    equal(sessionIds(a), sessionIds(b));
    assert(sessionIds(a) !== sessionIds(c), "El desafío debe cambiar con la fecha.");
    assert(Content.dailyAvailable(state, "2026-10-25"), "El desafío debe estar disponible al inicio.");
    var session = play(store, { mode: "daily" });
    assert(session.result.pass, "El desafío diario debe completarse.");
    assert(!Content.dailyAvailable(store.getState(), "2026-10-25"), "El desafío debe quedar bloqueado.");
    var failed = false;
    try {
      commit(store, function (draft) { return Engine.startSession(draft, { mode: "daily" }, NOW); });
    } catch (e) { failed = true; }
    assert(failed, "No debe poder iniciarse dos veces el desafío diario.");
  });

  /* ------------------------------------------------------------------ */
  /* Motor y resultados                                                 */
  /* ------------------------------------------------------------------ */
  test("Misión: desbloqueos y resultados reflejan respuestas", function () {
    var store = makeStore("mission");
    var initial = store.getState();
    assert(Content.missionUnlocked(initial, Content.getMission("mission-sp-1")).unlocked, "La misión 1 debe estar disponible.");
    assert(!Content.missionUnlocked(initial, Content.getMission("mission-sp-2")).unlocked, "La misión 2 debe estar bloqueada.");
    var session = play(store, { mode: "mission", missionId: "mission-sp-1" }, function (question, current, wrongUsed) {
      return wrongUsed ? question.answer : (question.answer === "A" ? "B" : "A");
    });
    assert(session.result, "Debe existir resultado.");
    equal(session.result.total, 5);
    equal(session.result.correct + session.result.wrong + session.result.omitted, 5);
    equal(session.result.correct, 4);
    equal(session.result.wrong, 1);
    equal(Math.round(session.result.accuracy * 100), 80);
    assert(session.result.completion.applied, "La misión completada debe tener recompensa de finalización.");
    equal(store.getState().missions["mission-sp-1"].completedAt != null, true);
  });

  test("La preferencia de feedback inmediato afecta a las misiones", function () {
    var store = makeStore("feedback");
    store.commit(function (draft) { draft.settings.instantFeedback = false; });
    var session = commit(store, function (draft) { return Engine.startSession(draft, { mode: "mission", missionId: "mission-sp-1" }, NOW); });
    equal(session.feedback, "diferida");
    commit(store, function (draft) { return Engine.abandon(draft, session.id, NOW); });
  });

  test("Repetir misión no duplica finalización y reduce la XP", function () {
    var store = makeStore("repeat");
    var first = play(store, { mode: "mission", missionId: "mission-sp-1" });
    var second = play(store, { mode: "mission", missionId: "mission-sp-1" });
    assert(first.result.completion.applied, "La primera debe aplicar finalización.");
    assert(second.result.completion.duplicate, "La segunda debe detectar la finalización duplicada.");
    equal(second.result.completionXp, 0);
    equal(second.result.questionXp, 0);
    assert(store.getState().xp >= first.result.xpEarned, "La XP acumulada no debe disminuir al repetir.");
  });

  test("Penalización de Supervivencia sin XP negativa", function () {
    var store = makeStore("survival");
    commit(store, function (draft) { return Engine.startSession(draft, { mode: "survival" }, NOW); });
    var session = store.getState().activeSession;
    var item = session.questions[session.cursor];
    var q = Content.getQuestion(item.questionId);
    var wrong = q.options.filter(function (o) { return o.id !== q.answer; })[0].id;
    var answered = commit(store, function (draft) { return Engine.answer(draft, session.id, wrong, NOW); });
    equal(answered.outcome.correct, false);
    equal(store.getState().activeSession.lives, C.modes.supervivencia.lives - 1);
    assert(store.getState().xp >= 0, "La XP nunca debe ser negativa.");
    var abandoned = commit(store, function (draft) { return Engine.abandon(draft, session.id, NOW); });
    assert(abandoned.result.abandoned, "La sesión debe marcarse abandonada.");
    equal(abandoned.result.completionXp, 0);
    assert(store.getState().xp >= 0, "Abandonar no debe restar XP.");
  });

  test("Recuperación registra el acierto y programa el siguiente repaso", function () {
    var store = makeStore("recovery");
    var qid = "2026-i-psicologia-q059";
    store.commit(function (draft) {
      draft.errors[qid] = {
        questionId: qid,
        areaId: "area-psi-investigacion",
        topicId: "topic-psi-in-2",
        sheetId: "sheet-psi-in-2-1",
        confidence: "alta",
        firstAt: new Date(NOW.getTime() - 3600000).toISOString(),
        lastAt: new Date(NOW.getTime() - 3600000).toISOString(),
        count: 1,
        recoveryLevel: 0,
        recoveredAt: null,
        nextReviewAt: new Date(NOW.getTime() - 60000).toISOString()
      };
    });
    var session = play(store, { mode: "recovery" });
    assert(session.result.completion.applied, "La recuperación completada debe tener recompensa.");
    var error = store.getState().errors[qid];
    assert(error.recoveredAt, "El error debe quedar marcado como recuperado.");
    assert(new Date(error.nextReviewAt).getTime() > NOW.getTime(), "El siguiente repaso debe quedar en el futuro.");
    assert(store.getState().questions[qid].mastery >= 1, "El dominio debe incrementarse con el acierto.");
  });

  test("Una misión con 0% no se marca superada ni desbloquea", function () {
    var store = makeStore("zero");
    var session = play(store, { mode: "mission", missionId: "mission-sp-1" }, function (question) {
      return question.options.filter(function (o) { return o.id !== question.answer; })[0].id;
    });
    assert(session.result.pass === false, "0% no debe superar la misión.");
    equal(session.result.completionXp, 0);
    assert(!store.getState().missions["mission-sp-1"].completedAt, "La misión no debe quedar completada.");
  });

  test("El ledger conserva recompensas permanentes al podar respuestas", function () {
    var state = Store.defaultState(NOW);
    P.applyReward(state, { xp: 1, coins: 0, key: "mission:test:completion", source: "prueba", now: NOW });
    for (var i = 0; i < 4100; i += 1) {
      P.applyReward(state, { xp: 1, coins: 0, key: "answer:test:" + i, source: "prueba", now: NOW });
    }
    assert(state.rewards["mission:test:completion"], "La recompensa permanente no debe podarse.");
    state.missions["mission-test"] = { completedAt: U.nowISO(NOW) };
    var duplicate = P.completionReward(state, { mode: "mission", missionId: "mission-test", now: NOW });
    assert(duplicate.duplicate, "La misión ya completada debe bloquear la recompensa.");
  });

  test("Un estado dañado se bloquea, se archiva y puede recuperarse", function () {
    var storage = Store.makeMemoryStorage();
    var prefix = "corrupt:" + Math.random().toString(16).slice(2) + ":";
    storage.setItem(prefix + C.storage.stateKey, "{esto no es json");
    var store = Store.create({ storage: storage, prefix: prefix, now: function () { return new Date(NOW); }, autoSnapshot: false });
    store.init();
    assert(store.isBlocked(), "El estado dañado debe bloquear la escritura.");
    var archives = [];
    for (var i = 0; i < storage.length; i += 1) {
      var key = storage.key(i);
      if (key && key.indexOf(prefix + C.storage.archivePrefix) === 0) archives.push(key);
    }
    assert(archives.length > 0, "Debe archivarse el estado dañado.");
    var failed = false;
    try { store.commit(function (draft) { draft.xp = 1; }); } catch (e) { failed = true; }
    assert(failed, "No se debe escribir sobre un estado bloqueado.");
    store.recoverCorrupt();
    assert(!store.isBlocked(), "La recuperación debe desbloquear el almacén.");
    store.commit(function (draft) { draft.xp = 5; });
    equal(store.getState().xp, 5);
  });

  test("Un esquema futuro no se sobrescribe silenciosamente", function () {
    var storage = Store.makeMemoryStorage();
    var prefix = "future:" + Math.random().toString(16).slice(2) + ":";
    var future = { schemaVersion: 99, xp: 50, profile: { name: "Futuro" } };
    storage.setItem(prefix + C.storage.stateKey, JSON.stringify(future));
    var store = Store.create({ storage: storage, prefix: prefix, now: function () { return new Date(NOW); }, autoSnapshot: false });
    store.init();
    assert(store.isBlocked(), "Un esquema futuro debe bloquear la escritura.");
    assert(storage.getItem(prefix + C.storage.stateKey).indexOf('"schemaVersion":99') !== -1, "El estado futuro no debe sobrescribirse.");
  });

  test("La importación elimina etiquetas peligrosas de campos de estado", function () {
    var store = makeStore("sanitize");
    store.importPayload(JSON.stringify({
      app: C.appName,
      state: {
        schemaVersion: 1,
        xp: 10,
        profile: { name: "<img src=x onerror=alert(1)>" },
        sessions: [{ id: "s1", title: "<b>título</b>", result: { score: "<script>alert(1)</script>" } }]
      }
    }));
    var imported = store.getState();
    assert(imported.profile.name.indexOf("<") === -1 && imported.profile.name.indexOf(">") === -1, "El nombre debe quedar sin etiquetas.");
    assert(imported.sessions[0].title.indexOf("<") === -1, "El título de sesión debe quedar sin etiquetas.");
  });

  test("El temporizador por pregunta rechaza respuestas tardías", function () {
    var store = makeStore("late");
    var session = commit(store, function (draft) { return Engine.startSession(draft, { mode: "survival" }, NOW); });
    store.commit(function (draft) {
      draft.activeSession.questionEndsAt = new Date(NOW.getTime() - 1000).toISOString();
    });
    var question = Content.getQuestion(session.questions[0].questionId);
    var late = commit(store, function (draft) { return Engine.answer(draft, session.id, question.answer, NOW); });
    assert(late.expired && late.questionExpired, "La respuesta tardía debe rechazarse.");
    equal(store.getState().activeSession.answers[question.id], undefined);
  });

  test("Nivel máximo no promete un nivel 51", function () {
    var max = P.levelFromXp(P.totalXpForLevel(C.levels.maxLevel));
    equal(max.level, C.levels.maxLevel);
    equal(max.maxed, true);
    equal(max.needed, 0);
    equal(max.percent, 100);
  });

  test("formatRelative distingue pasado y futuro", function () {
    var past = U.formatRelative(new Date(Date.now() - 2 * 86400000).toISOString());
    var future = U.formatRelative(new Date(Date.now() + 7200000).toISOString());
    assert(past.indexOf("Hace") === 0, "El pasado debe mostrarse como Hace.");
    assert(future.indexOf("En") === 0, "El futuro debe mostrarse como En.");
  });

  test("Contrarreloj no premia una cobertura insuficiente", function () {
    var store = makeStore("timed");
    commit(store, function (draft) { return Engine.startSession(draft, { mode: "timed", seconds: 180 }, NOW); });
    var session = store.getState().activeSession;
    var item = session.questions[session.cursor];
    var q = Content.getQuestion(item.questionId);
    commit(store, function (draft) { return Engine.answer(draft, session.id, q.answer, NOW); });
    var finished = commit(store, function (draft) { return Engine.finish(draft, session.id, "time", NOW); });
    assert(finished.result.pass === false, "Con 1 de 8 respuestas no debe superarse.");
    equal(finished.result.completionXp, 0);
    assert(finished.result.xpEarned >= 0, "La XP no debe ser negativa.");
  });

  test("El resultado no inventa respuestas no registradas", function () {
    var store = makeStore("recorded");
    var session = play(store, { mode: "mission", missionId: "mission-sp-1" });
    equal(session.answerOrder.length, session.questions.length);
    equal(Object.keys(session.answers).length, session.questions.length);
    session.answerOrder.forEach(function (id) {
      assert(session.answers[id], "Falta la respuesta registrada: " + id);
      assert(session.answers[id].at, "La respuesta no tiene fecha: " + id);
    });
  });

  /* ------------------------------------------------------------------ */
  /* Integración estática y presentación                               */
  /* ------------------------------------------------------------------ */
  test("El launcher incluye la quinta aplicación y el enlace real", async function () {
    var res = await fetch("../../index.html");
    var html = await res.text();
    includes(html, 'data-app="quest"');
    includes(html, 'href="./serums-quest/index.html"');
    includes(html, "05 / 05");
    includes(html, "QUEST_SNAPSHOT_KEY");
    includes(html, "1 / 5");
  });

  test("La aplicación declara viewport y reglas responsive", async function () {
    var app = await (await fetch("../index.html")).text();
    var css = await (await fetch("../styles.css")).text();
    includes(app, 'name="viewport"');
    includes(css, "@media (max-width: 680px)");
    includes(css, "prefers-reduced-motion");
    includes(css, ".q-game");
  });

  /* ------------------------------------------------------------------ */
  /* Ejecución                                                          */
  /* ------------------------------------------------------------------ */
  function render() {
    var passed = results.filter(function (r) { return r.ok; }).length;
    var failed = results.length - passed;
    var summary = document.getElementById("summary");
    summary.innerHTML = '<span class="pill ' + (failed ? "bad" : "ok") + '"><b>' + passed + "</b> superadas</span>" +
      '<span class="pill ' + (failed ? "bad" : "ok") + '"><b>' + failed + "</b> fallidas</span>" +
      '<span class="pill"><b>' + results.length + "</b> pruebas</span>" +
      '<span class="pill">' + new Date().toLocaleTimeString("es-PE") + "</span>";
    document.getElementById("list").innerHTML = results.map(function (r) {
      return '<div class="test ' + (r.ok ? "pass" : "fail") + '"><span class="dot"></span><div><b>' + escapeHTML(r.name) + "</b><small>" + (r.ok ? "Correcta" : "Fallida") + "</small>" + (r.error ? "<pre>" + escapeHTML(r.error) + "</pre>" : "") + "</div></div>";
    }).join("");
    window.__QUEST_TESTS__ = { passed: passed, failed: failed, total: results.length, results: results };
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  async function run() {
    try {
      Content.build();
    } catch (error) {
      results.push({ name: "Contenido base", ok: false, error: error.message || String(error) });
      render();
      return;
    }
    for (var i = 0; i < tests.length; i += 1) {
      var item = tests[i];
      try {
        await item.fn();
        results.push({ name: item.name, ok: true });
      } catch (error) {
        results.push({ name: item.name, ok: false, error: error && error.stack ? error.stack.split("\n").slice(0, 4).join("\n") : String(error) });
      }
      render();
    }
    render();
  }

  run();
})();
