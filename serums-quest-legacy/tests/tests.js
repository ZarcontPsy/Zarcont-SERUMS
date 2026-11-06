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
  var Chars = window.QuestCharacters;
  var Art = window.QuestCharacterArt;
  var Scenes = window.QuestScenes;
  var Audio = window.QuestAudio;
  var Collection = window.QuestCollection;
  var Reactions = window.QuestReactions;
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
  function throws(fn, fragment) {
    try {
      fn();
    } catch (error) {
      if (fragment && String(error.message).toLowerCase().indexOf(fragment.toLowerCase()) === -1) {
        throw new Error("El error no menciona «" + fragment + "»: " + error.message);
      }
      return error;
    }
    throw new Error("Se esperaba un error y no se produjo.");
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
  /* Sistema RPG: catálogo, colección, economía y presentación           */
  /* ------------------------------------------------------------------ */
  test("Catálogo de personajes: 10 originales, completos y con precio centralizado", function () {
    equal(Chars.characters.length, 10, "El catálogo debe tener diez personajes");
    var seen = {};
    Chars.characters.forEach(function (character) {
      assert(character.id && !seen[character.id], "Id duplicado o vacío: " + character.id);
      seen[character.id] = true;
      assert(character.name && character.title && character.description, "Ficha incompleta: " + character.id);
      assert(character.personalityMeta && character.personalityMeta.id, "Personalidad ausente: " + character.id);
      assert(character.rarityMeta && character.rarityMeta.label, "Rareza inválida: " + character.id);
      assert(character.attributes && Object.keys(character.attributes).length === 5, "Atributos incompletos: " + character.id);
      assert(character.slots.length >= 8, "Ranuras insuficientes: " + character.id);
      assert(character.slotIds.indexOf("accesorios") !== -1 && character.slotIds.indexOf("extras") !== -1, "Faltan ranuras de accesorio: " + character.id);
      assert(character.slotIds.length === (character.id === "amaru" || character.id === "kian" || character.id === "zenon" ? 8 : 9), "Número de ranuras inesperado: " + character.id);
      assert(character.supportedCosmetics.length > 0, "Sin cosméticos compatibles: " + character.id);
      assert(character.unlockRequirements && character.unlockRequirements.kind, "Sin requisito de desbloqueo: " + character.id);
      ["idle", "correct", "streak", "wrong", "defeat", "victory", "levelup", "unlock"].forEach(function (stateName) {
        assert(character.availableAnimations.indexOf(stateName) !== -1, character.id + " no declara " + stateName);
      });
      equal(character.price, C.rpg.prices.characters[character.id], "Precio no centralizado: " + character.id);
      if (character.forSale) {
        var band = C.rpg.priceBands.personaje[character.rarity];
        assert(band, "Sin banda de precio para " + character.rarity);
        assert(character.price >= band[0] && character.price <= band[1], "Precio fuera de banda: " + character.id + " = " + character.price);
      }
    });
    equal(Chars.starterId, "ilan");
    equal(Chars.byId("ilan").price, 0);
    equal(Chars.byId("ilan").access.kind, "starter");
  });

  test("Catálogo cosmético: categorías, compatibilidad y arte para cada objeto", function () {
    assert(Chars.cosmetics.length >= 25, "Se esperaban al menos 25 cosméticos");
    var categories = C.rpg.slots.map(function (slot) { return slot.id; });
    var ids = {};
    var perCategory = {};
    Chars.cosmetics.forEach(function (cosmetic) {
      assert(!ids[cosmetic.id], "Id cosmético duplicado: " + cosmetic.id);
      ids[cosmetic.id] = true;
      assert(categories.indexOf(cosmetic.category) !== -1, "Categoría inválida: " + cosmetic.id);
      assert(cosmetic.description, "Descripción ausente: " + cosmetic.id);
      assert(cosmetic.compatibleCharacterIds.length > 0, "Sin personajes compatibles: " + cosmetic.id);
      cosmetic.compatibleCharacterIds.forEach(function (characterId) {
        assert(Chars.byId(characterId), "Personaje inexistente en compatibilidad: " + characterId);
      });
      equal(cosmetic.price, C.rpg.prices.cosmetics[cosmetic.id], "Precio cosmético no centralizado: " + cosmetic.id);
      assert(Art.hasArt(cosmetic.id), "Sin capa de arte: " + cosmetic.id);
      perCategory[cosmetic.category] = (perCategory[cosmetic.category] || 0) + 1;
    });
    Object.keys(perCategory).forEach(function (category) {
      assert(perCategory[category] >= 2, "Categoría con menos de dos objetos: " + category);
    });
    var kian = Chars.byId("kian");
    assert(kian.slotIds.indexOf("peinado") === -1, "Kian no debe tener ranura de peinado");
    assert(Chars.isCompatible("ilan", "c-cabeza-diadema"), "Ilan debe admitir la diadema");
    assert(!Chars.isCompatible("ilan", "c-cabeza-casco"), "Ilan no debe admitir el casco");
    assert(!Chars.isCompatible("kian", "c-peinado-coleta"), "Kian no admite peinados");
  });

  test("Estado inicial: personaje inicial, cero monedas y preferencias seguras", function () {
    var state = Store.defaultState(NOW);
    equal(state.collection.ownedCharacterIds.length, 1);
    equal(state.collection.ownedCharacterIds[0], "ilan");
    equal(state.collection.selectedCharacterId, "ilan");
    equal(Object.keys(state.collection.equipped).length, 0);
    equal(state.collection.ownedCosmeticIds.length, 0);
    equal(state.coins, 0, "El estado nuevo no debe regalar monedas");
    equal(state.economy.transactions.length, 0);
    equal(state.economy.lifetimeSpent, 0);
    equal(state.presentation.animationPreferences.idle, true);
    equal(state.presentation.visualPreferences.rarityFrames, true);
    assert(Collection.validate(state).length === 0, "El estado por defecto debe ser válido");
  });

  test("Compra de personaje: descuenta una vez, registra y no repite", function () {
    var store = makeStore("buy-character");
    commit(store, function (draft) { draft.coins = 2000; });
    var bought = commit(store, function (draft, ctx) { return Collection.purchaseCharacter(draft, "mara", U.nowISO(ctx.now)); });
    equal(bought.price, 480);
    equal(stateOf(store).coins, 1520);
    assert(Collection.ownsCharacter(stateOf(store), "mara"), "Mara debe estar en la colección");
    equal(stateOf(store).economy.transactions.length, 1);
    equal(stateOf(store).economy.transactions[0].balanceAfter, 1520);
    equal(stateOf(store).economy.lifetimeSpent, 480);
    throws(function () {
      store.commit(function (draft, ctx) { return Collection.purchaseCharacter(draft, "mara", U.nowISO(ctx.now)); });
    }, "Ya posees");
    equal(stateOf(store).coins, 1520, "La compra rechazada no debe descontar");
    equal(stateOf(store).economy.transactions.length, 1, "La compra rechazada no debe registrarse");
  });

  test("Saldo insuficiente: no hay saldo negativo ni colección alterada", function () {
    var store = makeStore("no-funds");
    commit(store, function (draft) { draft.coins = 100; });
    throws(function () {
      store.commit(function (draft, ctx) { return Collection.purchaseCharacter(draft, "ona", U.nowISO(ctx.now)); });
    }, "faltan");
    equal(stateOf(store).coins, 100);
    assert(!Collection.ownsCharacter(stateOf(store), "ona"), "No debe concederse el personaje sin saldo");
    equal(stateOf(store).economy.transactions.length, 0);
  });

  test("Compra y equipamiento persisten después de recargar", function () {
    var storage = Store.makeMemoryStorage();
    var prefix = "test:rpg-persist:" + Math.random().toString(16).slice(2) + ":";
    var options = { storage: storage, prefix: prefix, now: function () { return new Date(NOW); }, autoSnapshot: false };
    var first = Store.create(options);
    first.init();
    first.commit(function (draft) { draft.coins = 5000; });
    first.commit(function (draft, ctx) { return Collection.purchaseCharacter(draft, "teo", U.nowISO(ctx.now)); });
    first.commit(function (draft, ctx) { return Collection.purchaseCosmetic(draft, "c-torso-bata", U.nowISO(ctx.now)); });
    first.commit(function (draft, ctx) { return Collection.equipCosmetic(draft, "teo", "c-torso-bata"); });
    first.commit(function (draft) { return Collection.selectCharacter(draft, "teo"); });
    var coinsBefore = first.getState().coins;
    var second = Store.create(options);
    second.init();
    var reloaded = second.getState();
    assert(Collection.ownsCharacter(reloaded, "teo"), "La compra debe persistir");
    equal(reloaded.collection.selectedCharacterId, "teo");
    equal(Collection.equippedMap(reloaded, "teo").torso, "c-torso-bata");
    equal(reloaded.coins, coinsBefore);
    equal(reloaded.economy.transactions.length, 2);
    equal(second.getSnapshot().selectedCharacterName, "Teo Alcázar");
  });

  test("El equipamiento se guarda por personaje y se recupera al volver", function () {
    var store = makeStore("per-character");
    commit(store, function (draft) { draft.coins = 9000; });
    commit(store, function (draft, ctx) { Collection.purchaseCharacter(draft, "mara", U.nowISO(ctx.now)); });
    commit(store, function (draft, ctx) { Collection.purchaseCosmetic(draft, "c-cabeza-diadema", U.nowISO(ctx.now)); });
    commit(store, function (draft, ctx) { Collection.purchaseCosmetic(draft, "c-peinado-coleta", U.nowISO(ctx.now)); });
    commit(store, function (draft, ctx) { Collection.equipCosmetic(draft, "ilan", "c-cabeza-diadema"); });
    commit(store, function (draft, ctx) { Collection.equipCosmetic(draft, "mara", "c-peinado-coleta"); });
    commit(store, function (draft) { Collection.selectCharacter(draft, "mara"); });
    equal(Collection.equippedMap(stateOf(store), "ilan").cabeza, "c-cabeza-diadema");
    equal(Collection.equippedMap(stateOf(store), "mara").peinado, "c-peinado-coleta");
    commit(store, function (draft) { Collection.selectCharacter(draft, "ilan"); });
    equal(Collection.equippedMap(stateOf(store), "ilan").cabeza, "c-cabeza-diadema");
    equal(stateOf(store).collection.ownedCosmeticIds.length, 2, "Cambiar de personaje no elimina cosméticos");
  });

  test("Cosméticos incompatibles y ranuras inexistentes se rechazan", function () {
    var store = makeStore("compat");
    commit(store, function (draft) { draft.coins = 12000; });
    commit(store, function (draft, ctx) { Collection.purchaseCosmetic(draft, "c-cabeza-casco", U.nowISO(ctx.now)); });
    throws(function () {
      store.commit(function (draft) { return Collection.equipCosmetic(draft, "ilan", "c-cabeza-casco"); });
    }, "no es compatible");
    commit(store, function (draft) { draft.collection.ownedCharacterIds.push("kian"); });
    commit(store, function (draft, ctx) { Collection.purchaseCosmetic(draft, "c-peinado-coleta", U.nowISO(ctx.now)); });
    throws(function () {
      store.commit(function (draft) { return Collection.equipCosmetic(draft, "kian", "c-peinado-coleta"); });
    }, "no tiene ranura");
    equal(Object.keys(Collection.equippedMap(stateOf(store), "ilan")).length, 0);
  });

  test("Personaje legendario bloqueado por nivel, comprable al cumplirlo", function () {
    var store = makeStore("legend");
    commit(store, function (draft) { draft.coins = 9000; });
    var locked = Collection.characterStatus(stateOf(store), Chars.byId("zenon"));
    equal(locked.status, "locked");
    assert(!locked.canPurchase, "Zenón no debe comprarse sin nivel 8");
    throws(function () {
      store.commit(function (draft, ctx) { return Collection.purchaseCharacter(draft, "zenon", U.nowISO(ctx.now)); });
    }, "requisitos");
    commit(store, function (draft) { draft.xp = P.totalXpForLevel(8); });
    var available = Collection.characterStatus(stateOf(store), Chars.byId("zenon"));
    assert(available.canPurchase, "Con nivel 8 y saldo debe poder comprarse");
    var bought = commit(store, function (draft, ctx) { return Collection.purchaseCharacter(draft, "zenon", U.nowISO(ctx.now)); });
    equal(bought.price, 5400);
    assert(Collection.ownsCharacter(stateOf(store), "zenon"));
  });

  test("Amaru se desbloquea por recorrido y no se compra con monedas", function () {
    var store = makeStore("reward-character");
    equal(Collection.characterStatus(stateOf(store), Chars.byId("amaru")).status, "locked");
    throws(function () {
      store.commit(function (draft, ctx) { return Collection.purchaseCharacter(draft, "amaru", U.nowISO(ctx.now)); });
    });
    commit(store, function (draft, ctx) {
      for (var i = 1; i <= 5; i += 1) {
        draft.missions["mission-sp-" + i] = { id: "mission-sp-" + i, kind: "mission", areaId: "area-psi-salud-publica", attempts: 1, completedAt: U.nowISO(ctx.now) };
      }
      return Collection.syncUnlocks(draft, U.nowISO(ctx.now));
    });
    assert(Collection.ownsCharacter(stateOf(store), "amaru"), "Amaru debe desbloquearse con 5 misiones");
    equal(stateOf(store).coins, 0, "La recompensa de personaje no otorga ni cobra monedas");
    equal(stateOf(store).collection.unlockedBy.amaru.method, "reward");
  });

  test("Filtros de personajes: estados exclusivos, rareza y orden", function () {
    var store = makeStore("filters");
    var state = stateOf(store);
    var all = Collection.filterCharacters(state, { filter: "all" });
    equal(all.length, 10);
    equal(Collection.filterCharacters(state, { filter: "owned" }).length, 1);
    equal(Collection.filterCharacters(state, { filter: "buy" }).length, 7, "Siete personajes comprables al inicio");
    var locked = Collection.filterCharacters(state, { filter: "locked" });
    equal(locked.length, 2);
    var lockedIds = locked.map(function (row) { return row.character.id; }).sort();
    equal(lockedIds.join(","), "amaru,zenon");
    var legendary = Collection.filterCharacters(state, { filter: "all", rarity: "legendario" });
    equal(legendary.length, 1);
    equal(legendary[0].character.id, "zenon");
    var cheapest = Collection.filterCharacters(state, { filter: "buy", sort: "priceAsc" });
    equal(cheapest[0].character.id, "mara", "Mara debe ser el personaje comprable más barato");
    commit(store, function (draft, ctx) { draft.coins = 900; Collection.purchaseCharacter(draft, "mara", U.nowISO(ctx.now)); });
    equal(Collection.filterCharacters(stateOf(store), { filter: "owned" }).length, 2);
    equal(Collection.filterCharacters(stateOf(store), { filter: "buy" }).length, 6);
  });

  test("Migración de esquema conserva progreso académico y crea colección", function () {
    var storage = Store.makeMemoryStorage();
    var prefix = "test:rpg-migrate:" + Math.random().toString(16).slice(2) + ":";
    var legacy = {
      schemaVersion: 1,
      appVersion: "1.0.0",
      revision: 4,
      profile: { id: "local-x", name: "Legado", createdAt: "2026-01-01T00:00:00.000Z" },
      xp: 777,
      coins: 321,
      stage: 3,
      academic: { answered: 40, correct: 31, wrong: 9, totalTimeMs: 90000, sessions: 6, byArea: {}, recent: [] },
      questions: { q1: { attempts: 2, correct: 1, mastery: 2 } },
      errors: { q1: { questionId: "q1", count: 1, recoveredAt: null } },
      sessions: [{ id: "s1", mode: "mission", title: "Sesión antigua", endedAt: "2026-01-02T00:00:00.000Z" }],
      missions: { "mission-sp-1": { id: "mission-sp-1", kind: "mission", completedAt: "2026-01-02T00:00:00.000Z" } },
      daily: { streak: 2, bestStreak: 3, totalCompleted: 2 },
      rewards: { "mission:mission-sp-1:completion": { at: "2026-01-02T00:00:00.000Z", xp: 30, coins: 8 } }
    };
    storage.setItem(prefix + C.storage.stateKey, JSON.stringify(legacy));
    var store = Store.create({ storage: storage, prefix: prefix, now: function () { return new Date(NOW); }, autoSnapshot: false });
    store.init();
    var migrated = store.getState();
    equal(migrated.schemaVersion, C.schemaVersion);
    equal(migrated.xp, 777);
    equal(migrated.coins, 321);
    equal(migrated.academic.answered, 40);
    equal(migrated.missions["mission-sp-1"].completedAt, "2026-01-02T00:00:00.000Z");
    equal(migrated.errors.q1.count, 1);
    equal(migrated.sessions.length, 1);
    equal(migrated.collection.ownedCharacterIds[0], "ilan");
    equal(migrated.collection.selectedCharacterId, "ilan");
    equal(migrated.economy.transactions.length, 0);
    assert(migrated.meta.migratedFrom === "1", "Debe registrar la migración desde el esquema 1");
    equal(migrated.profile.name, "Legado");
  });

  test("Normalización descarta equipamiento no poseído o incompatible", function () {
    var raw = Store.defaultState(NOW);
    raw.collection.ownedCharacterIds = ["ilan", "mara"];
    raw.collection.ownedCosmeticIds = ["c-torso-manto", "c-cabeza-casco"];
    raw.collection.equipped = {
      ilan: { torso: "c-torso-manto", cabeza: "c-cabeza-casco", piernas: "c-piernas-ruta" },
      mara: { torso: "c-torso-abrigo" }
    };
    var normalized = Store.normalize(raw, NOW);
    equal(Object.keys(normalized.collection.equipped).length, 0, "Todo el equipamiento inválido debe descartarse");
    equal(normalized.collection.ownedCosmeticIds.length, 2, "Los objetos comprados se conservan aunque no se puedan equipar");
  });

  test("Reacciones: repertorios por personalidad, sin repetición inmediata", function () {
    var events = ["correct", "streak", "wrong", "defeat", "victory", "levelup", "idle"];
    events.forEach(function (event) {
      var byPersonality = {};
      Chars.characters.forEach(function (character) {
        var pool = Reactions.allMessagesFor(character.id)[event];
        assert(pool && pool.length >= 2, "Repertorio insuficiente: " + character.id + " / " + event);
        pool.forEach(function (line) {
          assert(line && line.length > 8, "Mensaje vacío o demasiado corto");
        });
        var message = Reactions.message(character.id, event, 0).text;
        assert(message, "Mensaje vacío para " + character.id);
        if (byPersonality[character.personality]) {
          equal(message, byPersonality[character.personality], "Los personajes de una misma personalidad deben compartir repertorio");
        } else {
          byPersonality[character.personality] = message;
        }
      });
      var distinct = {};
      Object.keys(byPersonality).forEach(function (personality) { distinct[byPersonality[personality]] = personality; });
      assert(Object.keys(distinct).length >= 5, "Cada personalidad debe tener mensajes propios en " + event);
    });
    ["ilan", "mara", "noa", "teo", "lia", "kian", "amaru", "ona", "iris", "zenon"].forEach(function (id) {
      var first = Reactions.message(id, "correct", 0).text;
      var second = Reactions.message(id, "correct", 1).text;
      assert(first !== second, "La rotación no debe repetir el mismo mensaje consecutivo: " + id);
    });
    var personalities = {};
    var homeLines = {};
    Chars.characters.forEach(function (character) {
      personalities[character.personality] = (personalities[character.personality] || 0) + 1;
      var home = Reactions.homeMessage(character.id).text;
      assert(!homeLines[home], "Frase de inicio duplicada: " + home);
      homeLines[home] = true;
    });
    assert(Object.keys(personalities).length >= 5, "Debe haber al menos cinco personalidades distintas");
    var unlockLines = {};
    Chars.characters.forEach(function (character) {
      var line = Reactions.unlockMessage(character.id);
      assert(!unlockLines[line], "Mensaje de desbloqueo duplicado: " + line);
      unlockLines[line] = true;
    });
  });

  test("Arte: retratos originales, estados y capas cosméticas reales", function () {
    Chars.characters.forEach(function (character) {
      var svg = Art.portrait(character.id, {}, { state: "idle" });
      includes(svg, "<svg", "Retrato sin SVG: " + character.id);
      includes(svg, 'data-part="figure"');
      includes(svg, 'data-part="head"');
      includes(svg, "q-mouth--neutral");
      includes(svg, character.name);
      var victory = Art.portrait(character.id, {}, { state: "victory" });
      includes(victory, 'data-state="victory"');
      assert(Art.artSpec(character.id), "Sin ficha de arte: " + character.id);
    });
    var equipped = Art.portrait("ilan", { "cabeza": "c-cabeza-diadema", "accesorios": "c-accesorios-gafas" });
    includes(equipped, "9FC4FF", "La diadema equipada debe dibujarse");
    includes(equipped, "C9D4E5", "Las gafas equipadas deben dibujarse");
    var incompatible = Art.portrait("ilan", { "cabeza": "c-cabeza-casco" });
    assert(incompatible.indexOf("5C6F86") === -1, "Un cosmético incompatible no debe dibujarse");
    Chars.cosmetics.forEach(function (cosmetic) {
      var preview = Art.mannequin(cosmetic.id);
      includes(preview, "q-ca--preview", "Vista previa ausente: " + cosmetic.id);
    });
  });

  test("Economía: compras nunca generan monedas y el snapshot informa la colección", function () {
    var store = makeStore("economy");
    commit(store, function (draft) { draft.coins = 1000; });
    var before = stateOf(store).coins;
    commit(store, function (draft, ctx) { Collection.purchaseCosmetic(draft, "c-peinado-coleta", U.nowISO(ctx.now)); });
    assert(stateOf(store).coins < before, "La compra debe descontar monedas");
    assert(stateOf(store).coins >= 0, "El saldo nunca debe ser negativo");
    var snapshot = store.getSnapshot();
    equal(snapshot.coins, stateOf(store).coins);
    equal(snapshot.selectedCharacterId, "ilan");
    equal(snapshot.charactersOwned, 1);
    equal(snapshot.charactersTotal, 10);
    equal(snapshot.cosmeticsOwned, 1);
    equal(typeof snapshot.selectedCharacterRarity, "string");
  });

  test("Accesorio principal y adicional coexisten en el atuendo", function () {
    var store = makeStore("two-accessories");
    commit(store, function (draft) { draft.coins = 3000; });
    commit(store, function (draft, ctx) { Collection.purchaseCosmetic(draft, "c-accesorios-gafas", U.nowISO(ctx.now)); });
    commit(store, function (draft, ctx) { Collection.purchaseCosmetic(draft, "c-accesorios-bolso", U.nowISO(ctx.now)); });
    commit(store, function (draft) { Collection.equipCosmetic(draft, "ilan", "c-accesorios-gafas"); });
    commit(store, function (draft) { Collection.equipCosmetic(draft, "ilan", "c-accesorios-bolso"); });
    var equipped = Collection.equippedMap(stateOf(store), "ilan");
    equal(equipped.accesorios, "c-accesorios-gafas");
    equal(equipped.extras, "c-accesorios-bolso");
    commit(store, function (draft) { Collection.unequipCosmetic(draft, "ilan", "extras"); });
    equal(Collection.equippedMap(stateOf(store), "ilan").accesorios, "c-accesorios-gafas", "Quitar el adicional no debe quitar el principal");
  });

  test("Preferencias de presentación persisten y no alteran el progreso", function () {
    var storage = Store.makeMemoryStorage();
    var prefix = "test:presentation:" + Math.random().toString(16).slice(2) + ":";
    var opts = { storage: storage, prefix: prefix, now: function () { return new Date(NOW); }, autoSnapshot: false };
    var first = Store.create(opts);
    first.init();
    first.commit(function (draft) {
      draft.presentation.animationPreferences.reactions = false;
      draft.presentation.visualPreferences.particles = false;
      draft.xp = 120;
    });
    var second = Store.create(opts);
    second.init();
    equal(second.getState().presentation.animationPreferences.reactions, false);
    equal(second.getState().presentation.visualPreferences.particles, false);
    equal(second.getState().xp, 120);
    equal(second.getState().presentation.animationPreferences.idle, true);
  });

  test("La interfaz declara rutas y acciones reales para la capa RPG", async function () {
    var app = await (await fetch("../index.html")).text();
    var appJs = await (await fetch("../js/app.js")).text();
    var css = await (await fetch("../styles-rpg.css")).text();
    var gameCss = await (await fetch("../styles-game.css")).text();
    includes(app, 'href="#/personajes"');
    includes(app, 'href="#/tienda"');
    includes(app, 'href="#/inventario"');
    includes(app, "styles-rpg.css");
    includes(app, "styles-game.css");
    includes(app, "js/characters.js");
    includes(app, "js/collection.js");
    includes(app, "js/scenes.js");
    includes(app, "js/audio.js");
    equal((app.match(/class="q-navlink/g) || []).length, 5, "La navegación principal debe tener cinco secciones");
    equal((app.match(/class="q-bottomlink/g) || []).length, 5, "La navegación inferior debe tener cinco secciones");
    includes(app, 'data-route="progress"');
    includes(appJs, "function renderEquipment");
    includes(appJs, "audioSettingsMarkup");
    ["buy-character", "select-character", "equip-cosmetic", "save-outfit", "char-prev", "custom-equip", "custom-slot", "custom-clear", "toggle-audio", "test-audio"].forEach(function (actionName) {
      includes(appJs, 'action === "' + actionName + '"', "Falta la acción " + actionName);
    });
    includes(css, "q-rarity--legendario");
    includes(css, ".q-char[data-state=\"victory\"]");
    includes(css, ".q-companion");
    includes(css, "@media (max-width: 680px)");
    includes(gameCss, ".q-hero-stage");
    includes(gameCss, ".q-heroes-stage");
    includes(gameCss, ".q-equip-slots");
    includes(gameCss, ".q-bottomnav");
    includes(gameCss, ".q-scene-svg");
    includes(gameCss, ".q-audio-settings");
  });

  test("Toda acción de interfaz declarada tiene un controlador real", async function () {
    var appJs = await (await fetch("../js/app.js")).text();
    var used = {};
    var handled = {};
    var actionRe = /data-action=\\?"([a-z0-9-]+)/g;
    var handlerRe = /action === "([a-z0-9-]+)"/g;
    var match;
    while ((match = actionRe.exec(appJs))) used[match[1]] = true;
    while ((match = handlerRe.exec(appJs))) handled[match[1]] = true;
    var missing = Object.keys(used).filter(function (name) { return !handled[name]; });
    assert(Object.keys(used).length >= 42, "Se esperaban al menos 42 acciones declaradas");
    assert(missing.length === 0, "Acciones sin controlador: " + missing.join(", "));
  });

  test("El motor entrega el personaje de recompensa al cerrar la quinta misión", function () {
    var store = makeStore("engine-unlock");
    commit(store, function (draft, ctx) {
      ["mission-sp-2", "mission-ci-1", "mission-et-1", "mission-in-1"].forEach(function (id) {
        draft.missions[id] = { id: id, kind: "mission", areaId: "area-psi-etica", attempts: 1, completedAt: U.nowISO(ctx.now), bestScore: 100, bestAccuracy: 1 };
      });
    });
    var session = play(store, { mode: "mission", missionId: "mission-sp-1" });
    assert(Collection.ownsCharacter(stateOf(store), "amaru"), "Amaru debe entregarse al cerrar la quinta misión");
    assert(session.result && session.result.charactersUnlocked.some(function (entry) { return entry.id === "amaru"; }), "El resultado debe anunciar el personaje desbloqueado");
    equal(stateOf(store).collection.unlockedBy.amaru.method, "reward");
  });

  test("Cada área tiene un escenario original y utilizable", function () {
    assert(Scenes && Scenes.areas.length === 5, "Deben existir cinco escenarios de área");
    C.areas.forEach(function (areaId) {
      var html = Scenes.scene(areaId, { variant: "home" });
      includes(html, 'data-scene="' + areaId + '"');
      includes(html, "<svg");
      includes(html, "q-scene-grade");
      assert(html.indexOf("http://") === -1 && html.indexOf("https://") === -1, "La escena no debe depender de URLs externas");
      assert(html.indexOf("q-scene-mote") !== -1, "La escena debe incluir partículas ambientales");
    });
    var character = Chars.byId("noa");
    var scene = Scenes.forCharacter(character, { variant: "select" });
    includes(scene, 'data-scene="' + character.areaAffinity + '"');
  });

  test("Audio original: preajustes, silencio, volúmenes y sin autoplay", function () {
    assert(Audio, "Falta el módulo de audio");
    ["click", "select", "confirm", "buy", "equip", "correct", "error", "streak", "victory", "defeat", "levelup", "unlock"].forEach(function (name) {
      assert(Audio.sounds.indexOf(name) !== -1, "Falta el sonido " + name);
    });
    var prefs = Audio.getPreferences();
    equal(prefs.muted, false);
    equal(prefs.music, false);
    assert(prefs.sfxVolume >= 0 && prefs.sfxVolume <= 1, "Volumen de efectos inválido");
    var applied = Audio.setPreferences({ muted: true, sfxVolume: 2, musicVolume: -1, music: false });
    equal(applied.muted, true);
    equal(applied.sfxVolume, 1);
    equal(applied.musicVolume, 0);
    equal(Audio.play("click"), false, "Silenciado no debe reproducir");
    Audio.setPreferences({ muted: false, sfxVolume: 0.5, musicVolume: 0.2, music: false });
    equal(Audio.play("click"), false, "Sin interacción previa no debe crear/activar el contexto");
    assert(Audio.isUnlocked() === false, "El audio no debe desbloquearse sin gesto");
  });

  test("El arte se cachea y cambia con el estado y el equipamiento", function () {
    var first = Art.portrait("ilan", {}, { state: "idle" });
    var second = Art.portrait("ilan", {}, { state: "idle" });
    equal(first, second, "El mismo retrato debe reutilizar la caché");
    var victory = Art.portrait("ilan", {}, { state: "victory" });
    assert(first !== victory, "Los estados deben generar variantes distintas");
    var equipped = Art.portrait("ilan", { "cabeza": "c-cabeza-diadema" }, { state: "idle" });
    assert(first !== equipped, "El equipamiento debe cambiar el retrato");
    includes(equipped, "9FC4FF");
  });

  test("Las preferencias de audio se guardan en el estado", function () {
    var storage = Store.makeMemoryStorage();
    var prefix = "test:audio-prefs:" + Math.random().toString(16).slice(2) + ":";
    var opts = { storage: storage, prefix: prefix, now: function () { return new Date(NOW); }, autoSnapshot: false };
    var first = Store.create(opts);
    first.init();
    first.commit(function (draft) {
      draft.presentation.audioPreferences.muted = true;
      draft.presentation.audioPreferences.music = true;
      draft.presentation.audioPreferences.sfxVolume = 0.3;
      draft.presentation.audioPreferences.musicVolume = 0.7;
    });
    var second = Store.create(opts);
    second.init();
    var audio = second.getState().presentation.audioPreferences;
    equal(audio.muted, true);
    equal(audio.music, true);
    equal(audio.sfxVolume, 0.3);
    equal(audio.musicVolume, 0.7);
    var defaults = Store.defaultState(NOW).presentation.audioPreferences;
    equal(defaults.music, false, "La música debe estar desactivada por defecto");
    equal(defaults.muted, false);
    var invalid = Collection.normalizePresentation({ audioPreferences: { sfxVolume: "no-numero", musicVolume: 9 } });
    equal(invalid.audioPreferences.sfxVolume, 0.55, "Un volumen inválido debe caer al valor por defecto");
    equal(invalid.audioPreferences.musicVolume, 1, "Un volumen fuera de rango debe recortarse");
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
