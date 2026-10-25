/* SERUMS QUEST - adaptador de contenido verificado
   Lee el banco oficial de Examen Studio y el temario de Study sin copiar ni
   modificar sus datos. El mapa de afinidad temática es una capa derivada y
   explícitamente marcada; no sustituye la clasificación oficial del temario. */
(function () {
  "use strict";

  var C = window.QUEST_CONFIG;
  var U = window.QuestUtil;
  var P = window.QuestProgression;

  var AREA_SUFFIX = {
    "area-psi-salud-publica": "sp",
    "area-psi-cuidado-integral": "ci",
    "area-psi-etica": "et",
    "area-psi-investigacion": "in",
    "area-psi-gestion": "ge"
  };

  var ROUTE_COPY = {
    "area-psi-salud-publica": {
      missions: [
        { title: "Ronda comunitaria", subtitle: "Territorio, promoción y prevención", description: "Empieza por los determinantes, la participación y las acciones que sostienen la salud de una comunidad." },
        { title: "Foco epidemiológico", subtitle: "Medición, vigilancia y respuesta", description: "Lee indicadores, reconoce brotes y decide qué vigilar cuando la evidencia cambia." },
        { title: "Territorio y decisión", subtitle: "ASIS, priorización y prevención", description: "Integra el análisis de situación con decisiones de prevención y respuesta." }
      ],
      boss: { title: "Custodio de la salud pública", description: "Un desafío integrador sobre métodos, comunidad, promoción y respuesta sanitaria." }
    },
    "area-psi-cuidado-integral": {
      missions: [
        { title: "Primera escucha", subtitle: "Entrevista, evaluación y vínculo", description: "Practica la observación, la entrevista y el razonamiento clínico desde el primer contacto." },
        { title: "Clínica en contexto", subtitle: "Salud mental y curso de vida", description: "Distingue conceptos cercanos y aplica criterios a personas, familias y comunidades." },
        { title: "Continuidad del cuidado", subtitle: "Casos, seguimiento y redes", description: "Integra hallazgos, decisiones y continuidad en situaciones de mayor complejidad." }
      ],
      boss: { title: "Custodio del cuidado integral", description: "Un caso integrador de evaluación, salud mental y curso de vida." }
    },
    "area-psi-etica": {
      missions: [
        { title: "Fronteras de la confianza", subtitle: "Confidencialidad, consentimiento y derechos", description: "Decide con criterios deontológicos cuando la confianza y la dignidad están en juego." },
        { title: "Diálogo intercultural", subtitle: "Pertinencia, diversidad y trato digno", description: "Reconoce barreras culturales y construye atención culturalmente pertinente." }
      ],
      boss: { title: "Custodio de la ética", description: "Un desafío sobre dignidad, derechos, confidencialidad e interculturalidad." }
    },
    "area-psi-investigacion": {
      missions: [
        { title: "Del dato a la decisión", subtitle: "Enfoques, diseños y preguntas", description: "Distingue formas de investigar y elige el diseño que responde a la pregunta." },
        { title: "Método y validez", subtitle: "Instrumentos, sesgos y comunicación", description: "Evalúa validez, confiabilidad y límites de la evidencia antes de concluir." }
      ],
      boss: { title: "Custodio de la evidencia", description: "Un desafío integrador sobre método, validez y ética de la investigación." }
    },
    "area-psi-gestion": {
      missions: [
        { title: "La salud como sistema", subtitle: "Planificación, organización y redes", description: "Ubica los servicios en su marco de planificación, organización y referencia." },
        { title: "Calidad que sostiene", subtitle: "Calidad, seguridad y clima", description: "Relaciona mejora continua, seguridad del paciente y cultura organizacional." },
        { title: "Equipos y recursos", subtitle: "Personas, alianzas y abastecimiento", description: "Integra recursos humanos, coordinación y sostenibilidad de los servicios." }
      ],
      boss: { title: "Custodio de la gestión", description: "Un desafío integrador sobre planificación, organización, calidad y equipos." }
    }
  };

  var index = {
    ready: false,
    error: null,
    questions: [],
    byId: {},
    exams: [],
    mapByQuestion: {},
    sheets: {},
    topics: {},
    sources: {},
    catalog: null,
    status: null
  };

  function normalizeText(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function encodePath(path) {
    return String(path || "").split("/").map(function (part) {
      return encodeURIComponent(part);
    }).join("/");
  }

  function pdfHref(question) {
    if (!question || !question.filePath) return "";
    return "../EXAMEN STUDIO/" + encodePath(question.filePath) + "#page=" + encodeURIComponent(question.page);
  }

  function studyHref(sheetId, areaId) {
    if (sheetId) {
      return "../study-dashboard/index.html?sheet=" + encodeURIComponent(sheetId) + "&from=quest";
    }
    if (areaId) {
      return "../study-dashboard/index.html#/biblioteca/" + encodeURIComponent(areaId);
    }
    return "../study-dashboard/index.html";
  }

  function validOption(question, letter) {
    return (question.o || []).some(function (o) { return o && o.id === letter && normalizeText(o.text); });
  }

  function buildStatus() {
    var bank = window.BANCO_OFICIAL;
    var study = window.STUDY_CONTENT;
    var map = window.QUEST_CONTENT_MAP;
    var mapMeta = map && map.meta ? map.meta : {};
    var status = {
      ok: true,
      bankVersion: bank && bank.version || "",
      bankSchema: bank && bank.schema || null,
      studyVersion: study && study.version || "",
      taxonomyVersion: window.StudyTaxonomy ? window.StudyTaxonomy.version : "",
      mapVersion: mapMeta.version || (map && map.version) || "",
      mapGeneratedAt: mapMeta.generatedAt || "",
      mapHash: mapMeta.source && mapMeta.source.bancoHash || "",
      manualOverrides: mapMeta.manualOverrides || 0,
      psychologyExams: 0,
      valid: 0,
      invalid: 0,
      invalidReasons: {},
      mapped: 0,
      unclassified: 0,
      confidence: { alta: 0, media: 0, baja: 0, "sin clasificar": 0 },
      areaCounts: {},
      scoredByArea: {},
      scored: 0,
      errors: [],
      contentWarnings: []
    };
    C.areas.forEach(function (id) { status.areaCounts[id] = 0; status.scoredByArea[id] = 0; });
    if (!bank || !bank.exams || !bank.questions) {
      status.ok = false;
      status.errors.push("No se encontró el banco oficial de Examen Studio.");
    }
    if (!study || !Array.isArray(study.sheets)) {
      status.ok = false;
      status.errors.push("No se encontró el temario compartido de Study.");
    }
    if (!map || !map.questions) {
      status.ok = false;
      status.errors.push("No se encontró el mapa de afinidad temática de SERUMS QUEST.");
    }
    if (mapMeta.source) {
      if (mapMeta.source.bancoVersion && bank && bank.version && mapMeta.source.bancoVersion !== bank.version) {
        status.contentWarnings.push("El mapa se generó con otra versión del banco oficial.");
      }
      if (mapMeta.source.temarioVersion && study && study.version && mapMeta.source.temarioVersion !== study.version) {
        status.contentWarnings.push("El mapa se generó con otra versión del temario de Study.");
      }
    }
    return { status: status, bank: bank, study: study, map: map };
  }

  function build() {
    var built = buildStatus();
    var status = built.status;
    var bank = built.bank;
    var study = built.study;
    var map = built.map || { questions: {} };
    index.status = status;
    if (!status.ok) {
      index.error = status.errors.join(" ");
      throw new Error(index.error);
    }

    if (window.StudyTaxonomy && typeof window.StudyTaxonomy.apply === "function") {
      try { window.StudyTaxonomy.apply(study); } catch (e) {
        status.contentWarnings.push("La taxonomía de Study no se pudo aplicar: " + e.message);
      }
    }

    (study.sheets || []).forEach(function (sheet) { index.sheets[sheet.id] = sheet; });
    (study.topics || []).forEach(function (topic) { index.topics[topic.id] = topic; });
    (study.sources || []).forEach(function (source) { index.sources[source.id] = source; });

    var seen = {};
    var questions = [];
    var exams = [];
    (bank.exams || []).forEach(function (exam) {
      if (!exam || exam.professionId !== "psicologia") return;
      status.psychologyExams += 1;
      exams.push({
        id: exam.id,
        title: exam.title,
        cycle: exam.cycle,
        date: exam.date,
        filePath: exam.filePath,
        validQuestions: exam.validQuestions,
        questions: exam.questions
      });
      (bank.questions[exam.id] || []).forEach(function (q) {
        var reasons = [];
        if (!q || !q.id) reasons.push("sin id");
        if (seen[q.id]) reasons.push("id duplicado");
        if (!q || q.st !== "valid") reasons.push("sin estado validado");
        if (!q || !q.c || !validOption(q, q.c)) reasons.push("sin clave verificable");
        if (!q || !normalizeText(q.s)) reasons.push("sin enunciado");
        if (!q || !Array.isArray(q.o) || q.o.length < 2) reasons.push("sin alternativas");
        if (reasons.length) {
          status.invalid += 1;
          reasons.forEach(function (r) { status.invalidReasons[r] = (status.invalidReasons[r] || 0) + 1; });
          return;
        }
        seen[q.id] = true;
        var entry = map.questions[q.id] || null;
        var areaId = entry && C.areas.indexOf(entry.areaId) !== -1 ? entry.areaId : "";
        var confidence = entry && entry.confidence ? entry.confidence : "sin clasificar";
        var options = (q.o || []).map(function (o) {
          return { id: o.id, text: normalizeText(o.text) };
        });
        var answer = options.filter(function (o) { return o.id === q.c; })[0] || null;
        var question = {
          id: q.id,
          n: Number(q.n) || 0,
          examId: exam.id,
          examTitle: exam.title,
          cycle: exam.cycle,
          examDate: exam.date,
          page: Number(q.p) || 1,
          stem: normalizeText(q.s),
          options: options,
          answer: q.c,
          answerText: answer ? answer.text : "",
          filePath: exam.filePath,
          sourceUrl: "",
          areaId: areaId,
          areaShort: areaId ? C.areaMeta[areaId].short : "Banco general",
          areaAccent: areaId ? C.areaMeta[areaId].accent : "#AEB6C8",
          topicId: entry && entry.topicId || "",
          sheetId: entry && entry.sheetId || "",
          confidence: confidence,
          affinity: entry && Number(entry.affinity) || 0,
          complexity: entry && Number(entry.complexity) || 50,
          clinical: !!(entry && entry.clinical),
          valid: true,
          hasExplanation: false
        };
        question.sourceUrl = pdfHref(question);
        questions.push(question);
        status.valid += 1;
        if (entry) status.mapped += 1;
        else status.unclassified += 1;
        status.confidence[confidence] = (status.confidence[confidence] || 0) + 1;
        if (areaId) status.areaCounts[areaId] += 1;
        if (isScored(question)) {
          status.scored += 1;
          status.scoredByArea[areaId] += 1;
        }
      });
    });

    if (!questions.length) {
      status.ok = false;
      status.errors.push("No hay preguntas de Psicología con clave verificable.");
    }

    status.unclassified = status.confidence["sin clasificar"] || 0;
    index.questions = questions;
    index.exams = exams;
    index.byId = {};
    questions.forEach(function (q) { index.byId[q.id] = q; });
    index.mapByQuestion = map.questions || {};

    // El mapa no debe referenciar preguntas inexistentes.
    Object.keys(map.questions || {}).forEach(function (id) {
      if (!index.byId[id]) {
        status.contentWarnings.push("El mapa referencia una pregunta inexistente: " + id);
      }
    });

    index.catalog = buildCatalog(index.questions, index.byId);
    status.missions = index.catalog.missionList.length;
    status.bosses = index.catalog.bossList.length;
    status.areasWithContent = C.areas.filter(function (id) { return status.areaCounts[id] > 0; }).length;
    status.ok = status.ok && questions.length > 0;
    index.ready = status.ok;
    index.error = status.ok ? null : status.errors.join(" ");
    if (!status.ok) throw new Error(index.error || "No hay contenido puntuable disponible.");
    return index;
  }

  function missionUnlock(mission) {
    return mission.unlock || { missions: [], level: 1, stage: 1 };
  }

  function isScored(question) {
    return !!(question && question.areaId && (question.confidence === "alta" || question.confidence === "media"));
  }

  function scoredPool() {
    return index.questions.filter(isScored);
  }

  function buildCatalog(questions, byId) {
    var routes = {};
    var missionList = [];
    var bossList = [];
    C.areas.forEach(function (areaId) {
      var pool = questions.filter(function (q) { return isScored(q) && q.areaId === areaId; })
        .slice()
        .sort(function (a, b) {
          if (a.complexity === b.complexity) return a.id.localeCompare(b.id);
          return a.complexity - b.complexity;
        });
      var n = pool.length;
      var count = n >= C.missionPlan.minQuestionsForThreeMissions ? 3 : (n >= C.missionPlan.minQuestionsForTwoMissions ? 2 : 1);
      var sizes = count === 3 ? C.missionPlan.sizes.threeMissions.slice() : (count === 2 ? C.missionPlan.sizes.twoMissions.slice() : C.missionPlan.sizes.oneMission.slice());
      var used = 0;
      sizes.forEach(function (s) { used += s; });
      var bossSize = Math.min(C.missionPlan.sizes.boss, Math.max(0, n - used));
      if (bossSize < 4 && n >= 10) {
        bossSize = 4;
        while (used + bossSize > n && sizes.length) {
          var last = sizes.length - 1;
          if (sizes[last] > 4) { sizes[last] -= 1; used -= 1; } else break;
        }
      }
      var copy = ROUTE_COPY[areaId];
      var cursor = 0;
      var missions = [];
      var suffix = AREA_SUFFIX[areaId];
      for (var i = 0; i < sizes.length; i += 1) {
        var ids = pool.slice(cursor, cursor + sizes[i]).map(function (q) { return q.id; });
        cursor += sizes[i];
        if (ids.length < 4) continue;
        var idx = missions.length + 1;
        var meta = C.areaMeta[areaId];
        var copyItem = copy && copy.missions[i] ? copy.missions[i] : { title: meta.short + " · Misión " + idx, subtitle: meta.blurb, description: meta.blurb };
        var tier = idx === 1 ? "iniciacion" : (idx === 2 ? "desarrollo" : "especializacion");
        var unlock = idx === 1
          ? { missions: [], level: 1, stage: 1 }
          : (idx === 2
            ? { missions: ["mission-" + suffix + "-1"], level: C.missionPlan.secondMissionLevel, stage: 2 }
            : { missions: ["mission-" + suffix + "-2"], level: C.missionPlan.thirdMissionLevel, stage: 3 });
        var mission = {
          id: "mission-" + suffix + "-" + idx,
          kind: "mission",
          areaId: areaId,
          areaShort: meta.short,
          areaTitle: meta.title,
          accent: meta.accent,
          index: idx,
          title: copyItem.title,
          subtitle: copyItem.subtitle,
          description: copyItem.description,
          stage: idx,
          tier: tier,
          tierLabel: C.tiers[tier].label,
          questionIds: ids,
          questionCount: ids.length,
          estimatedMinutes: Math.max(3, Math.round(ids.length * 1.2)),
          feedback: "inmediata",
          rewards: { xp: C.xp.completion.mission, coins: C.coins.completion.mission, questionXp: C.xp.question[tier] },
          unlock: unlock
        };
        missions.push(mission);
        missionList.push(mission);
      }
      var bossCopy = copy && copy.boss ? copy.boss : { title: "Custodio de " + C.areaMeta[areaId].short, description: C.areaMeta[areaId].blurb };
      var bossIds = pool.slice(cursor, cursor + bossSize).map(function (q) { return q.id; });
      var boss = null;
      if (bossIds.length >= 4) {
        boss = {
          id: "boss-" + suffix,
          kind: "boss",
          areaId: areaId,
          areaShort: C.areaMeta[areaId].short,
          areaTitle: C.areaMeta[areaId].title,
          accent: C.areaMeta[areaId].accent,
          index: missions.length + 1,
          title: bossCopy.title,
          subtitle: "Jefe final · " + C.areaMeta[areaId].short,
          description: bossCopy.description,
          stage: 4,
          tier: "dominio",
          tierLabel: C.stages[4].name,
          questionIds: bossIds,
          questionCount: bossIds.length,
          estimatedMinutes: Math.max(6, Math.round(bossIds.length * 1.8)),
          feedback: "diferida",
          rewards: { xp: C.xp.completion.boss, coins: C.coins.completion.boss, questionXp: C.xp.question.dominio },
          unlock: {
            missions: missions.slice(0, C.missionPlan.bossUnlockMissions).map(function (m) { return m.id; }),
            level: C.missionPlan.bossLevel,
            stage: C.missionPlan.bossStage
          }
        };
        bossList.push(boss);
        missionList.push(boss);
      }
      routes[areaId] = {
        areaId: areaId,
        meta: C.areaMeta[areaId],
        totalQuestions: n,
        missions: missions,
        boss: boss,
        usedQuestions: cursor + bossIds.length,
        availableQuestions: n
      };
    });
    var missionById = {};
    missionList.forEach(function (m) { missionById[m.id] = m; });
    return {
      routes: routes,
      missionList: missionList.filter(function (m) { return m.kind === "mission"; }),
      bossList: bossList,
      all: missionList,
      byId: missionById,
      generatedAt: U.nowISO(),
      source: "banco-oficial:psicologia"
    };
  }

  function getQuestion(id) { return index.byId[id] || null; }
  function getSheet(id) { return index.sheets[id] || null; }
  function getTopic(id) { return index.topics[id] || null; }
  function getSource(id) { return index.sources[id] || null; }
  function getMission(id) { return index.catalog && index.catalog.byId[id] || null; }
  function getAreaRoute(areaId) { return index.catalog && index.catalog.routes[areaId] || null; }

  function sheetForQuestion(question) {
    if (!question) return null;
    var sheet = question.sheetId ? getSheet(question.sheetId) : null;
    if (sheet) return sheet;
    if (question.topicId) {
      var candidate = (window.STUDY_CONTENT.sheets || []).filter(function (s) { return s.topicId === question.topicId; })[0];
      if (candidate) return candidate;
    }
    if (question.areaId) {
      return (window.STUDY_CONTENT.sheets || []).filter(function (s) {
        return (s.primaryAreaId || s.areaId) === question.areaId;
      })[0] || null;
    }
    return null;
  }

  function recommendationFor(question) {
    var sheet = sheetForQuestion(question);
    var topic = sheet ? getTopic(sheet.topicId) : (question.topicId ? getTopic(question.topicId) : null);
    return {
      sheet: sheet,
      topic: topic,
      areaId: question.areaId,
      href: studyHref(sheet && sheet.id, question.areaId),
      label: sheet ? sheet.title : (question.areaId ? C.areaMeta[question.areaId].short : "Study Dashboard")
    };
  }

  function sourceLabel(question) {
    if (!question) return "";
    return "Psicología · SERUMS " + (question.cycle || "") + " · p. " + question.page;
  }

  function missionCompletion(state, mission) {
    return !!(state.missions && state.missions[mission.id] && state.missions[mission.id].completedAt);
  }

  function missionUnlocked(state, mission) {
    if (!mission) return { unlocked: false, requirements: [], reason: "Misión no disponible." };
    if (missionCompletion(state, mission)) {
      return { unlocked: true, requirements: [], reason: "Completada. Puedes repetirla con recompensas reducidas." };
    }
    var unlock = missionUnlock(mission);
    var level = P.levelFromXp(state.xp).level;
    var requirements = [];
    (unlock.missions || []).forEach(function (id) {
      var prev = getMission(id);
      if (!prev) return;
      requirements.push({
        label: "Completar «" + prev.title + "»",
        have: missionCompletion(state, prev) ? 1 : 0,
        need: 1,
        met: missionCompletion(state, prev)
      });
    });
    if (unlock.level > 1) {
      requirements.push({ label: "Nivel " + unlock.level, have: level, need: unlock.level, met: level >= unlock.level });
    }
    if (unlock.stage > 1) {
      requirements.push({ label: "Etapa " + C.stages[unlock.stage].name, have: state.stage, need: unlock.stage, met: state.stage >= unlock.stage });
    }
    var unlocked = requirements.every(function (r) { return r.met; });
    return {
      unlocked: unlocked,
      requirements: requirements,
      reason: unlocked ? "Disponible." : "Aún faltan requisitos."
    };
  }

  function nextMission(state) {
    var all = index.catalog ? index.catalog.all : [];
    var candidates = all.filter(function (m) {
      if (missionCompletion(state, m)) return false;
      return missionUnlocked(state, m).unlocked;
    }).sort(function (a, b) {
      if (a.kind !== b.kind) return a.kind === "boss" ? 1 : -1;
      if (a.stage !== b.stage) return a.stage - b.stage;
      return C.areas.indexOf(a.areaId) - C.areas.indexOf(b.areaId);
    });
    return candidates[0] || null;
  }

  function bestCompletedMission(state) {
    var all = index.catalog ? index.catalog.all : [];
    return all.filter(function (m) { return missionCompletion(state, m); })
      .sort(function (a, b) {
        var am = state.missions[a.id], bm = state.missions[b.id];
        return String(bm.completedAt || "").localeCompare(String(am.completedAt || ""));
      })[0] || null;
  }

  function dailySeed(state, date) {
    return (state.profile && state.profile.id || "local") + ":" + date;
  }

  function dailyChallenge(state, date) {
    var today = date || U.dateKey(new Date());
    var seed = dailySeed(state, today);
    var rand = U.seededRandom(seed);
    var all = scoredPool();
    var selected = [];
    var selectedIds = {};
    function take(question, tier, reason) {
      if (!question || selectedIds[question.id] || selected.length >= C.modes.diario.questionCount) return false;
      selectedIds[question.id] = true;
      selected.push({ questionId: question.id, tier: tier, reason: reason });
      return true;
    }
    var byComplexity = all.slice().sort(function (a, b) { return b.complexity - a.complexity; });
    var hardPool = byComplexity.filter(function (q) { return q.areaId; });
    var hard = hardPool[Math.floor(rand() * Math.min(18, hardPool.length))];
    if (hard) take(hard, "especializacion", "Pregunta de mayor exigencia del día");
    var clinicalPool = all.filter(function (q) { return q.clinical && q.areaId && !selectedIds[q.id]; });
    if (clinicalPool.length) take(clinicalPool[Math.floor(rand() * clinicalPool.length)], "desarrollo", "Aplicación clínica");
    var due = recoveryDue(state, new Date());
    if (due.length) take(getQuestion(due[0].questionId), "repaso", "Recuperación espaciada");
    var areaOrder = U.shuffle(C.areas, seed + ":areas");
    areaOrder.forEach(function (areaId) {
      if (selected.length >= C.modes.diario.questionCount) return;
      var pool = all.filter(function (q) { return q.areaId === areaId && !selectedIds[q.id]; });
      if (!pool.length) return;
      var pick = pool[Math.floor(rand() * pool.length)];
      take(pick, "desarrollo", "Repaso de " + C.areaMeta[areaId].short);
    });
    var rest = all.filter(function (q) { return q.areaId && !selectedIds[q.id]; });
    var shuffled = U.shuffle(rest, seed + ":rest");
    while (selected.length < C.modes.diario.questionCount && shuffled.length) {
      take(shuffled.shift(), "desarrollo", "Repaso variado");
    }
    var ordered = U.shuffle(selected, seed + ":order");
    return {
      date: today,
      seed: seed,
      title: "Desafío diario · " + today,
      description: "Repaso, una pregunta exigente y recuperación de conocimientos anteriores.",
      questions: ordered,
      questionCount: ordered.length
    };
  }

  function dailyAvailable(state, date) {
    return (state.daily && state.daily.lastCompletedDate) !== (date || U.dateKey(new Date()));
  }

  function recoveryDue(state, now) {
    var today = now || new Date();
    var errors = state.errors || {};
    return Object.keys(errors).map(function (id) { return errors[id]; })
      .filter(function (err) {
        var question = err && index.byId[err.questionId];
        if (!question || !isScored(question)) return false;
        var due = U.parseDate(err.nextReviewAt);
        return !due || due.getTime() <= new Date(today).getTime();
      })
      .sort(function (a, b) {
        if (!!a.recoveredAt !== !!b.recoveredAt) return a.recoveredAt ? 1 : -1;
        return String(a.nextReviewAt || "").localeCompare(String(b.nextReviewAt || ""));
      })
      .map(function (err) {
        var error = Object.assign({}, err);
        error.question = index.byId[err.questionId];
        return error;
      });
  }

  function recoveryStats(state, now) {
    var errors = state.errors || {};
    var pending = 0, due = 0, recovered = 0, mastered = 0;
    Object.keys(errors).forEach(function (id) {
      var e = errors[id];
      if (!e) return;
      if (e.recoveredAt) recovered += 1; else pending += 1;
      if (Number(e.recoveryLevel) >= C.recovery.masteredAfterRecoveries) mastered += 1;
      var at = U.parseDate(e.nextReviewAt);
      if ((!at || at.getTime() <= new Date(now || new Date()).getTime()) && index.byId[e.questionId]) due += 1;
    });
    return { pending: pending, due: due, recovered: recovered, mastered: mastered, total: pending + recovered };
  }

  function stageTier(stage) {
    var s = Math.max(1, Math.min(4, Number(stage) || 1));
    return ["iniciacion", "desarrollo", "especializacion", "dominio"][s - 1];
  }

  function selectByStage(list, count, stage, seed) {
    if (!list.length || !count) return [];
    var sorted = list.slice().sort(function (a, b) {
      if (a.complexity === b.complexity) return a.id.localeCompare(b.id);
      return a.complexity - b.complexity;
    });
    var band = Math.max(0, Math.min(3, (Number(stage) || 1) - 1));
    var sliceSize = Math.max(count * 2, Math.ceil(sorted.length * 0.35));
    var start = Math.min(Math.max(0, sorted.length - sliceSize), Math.floor(sorted.length * (band / 4)));
    var pool = sorted.slice(start, start + sliceSize);
    if (pool.length < count) pool = sorted;
    return U.shuffle(pool, seed).slice(0, count);
  }

  function buildQuestionSequence(state, descriptor, now) {
    var mode = descriptor.mode;
    var date = U.dateKey(now || new Date());
    var seed = descriptor.seed || U.uid("session");
    if (mode === "mission" || mode === "boss") {
      var mission = getMission(descriptor.missionId);
      if (!mission) return [];
      return mission.questionIds.map(function (id, index) {
        if (mission.kind === "boss") {
          var tier = index < 2 ? "desarrollo" : (index < 5 ? "especializacion" : "dominio");
          return { questionId: id, tier: tier };
        }
        return { questionId: id, tier: mission.tier };
      });
    }
    if (mode === "recovery") {
      var due = recoveryDue(state, now);
      return due.slice(0, C.modes.recuperacion.maxQuestions).map(function (e) {
        return { questionId: e.questionId, tier: "repaso" };
      });
    }
    if (mode === "daily") {
      return dailyChallenge(state, date).questions;
    }
    if (mode === "survival") {
      var pool = scoredPool();
      var selected = selectByStage(pool, C.modes.supervivencia.questionCount, state.stage, seed + ":survival");
      return selected.map(function (q, i) {
        var tier = i < 3 ? "iniciacion" : (i < 7 ? "desarrollo" : (state.stage >= 3 ? "dominio" : "especializacion"));
        return { questionId: q.id, tier: tier };
      });
    }
    if (mode === "timed" || mode === "simulacro") {
      var count = mode === "timed"
        ? (C.modes.contrarreloj.questionCountByDuration[descriptor.seconds] || C.modes.contrarreloj.questionCount)
        : C.modes.simulacro.questionCount;
      var pool2 = scoredPool();
      var selected2 = selectByStage(pool2, count, mode === "simulacro" ? 4 : state.stage, seed + ":" + mode);
      var tier2 = mode === "simulacro" ? "dominio" : stageTier(state.stage);
      return selected2.map(function (q) { return { questionId: q.id, tier: tier2 }; });
    }
    return [];
  }

  function nextRecommendedAction(state) {
    if (state.activeSession) {
      return {
        kind: "resume",
        title: "Sesión en curso",
        text: "Retoma la sesión guardada. Tus respuestas ya están registradas.",
        href: "#/jugar",
        action: "Continuar"
      };
    }
    if (dailyAvailable(state)) {
      return {
        kind: "daily",
        title: "Desafío diario",
        text: "Seis preguntas breves: repaso, exigencia y recuperación. Una vez al día.",
        href: "#/modo/diario",
        action: "Empezar"
      };
    }
    var due = recoveryStats(state).due;
    if (due > 0) {
      return {
        kind: "recovery",
        title: "Recuperar " + due + " " + U.plural(due, "pregunta", "preguntas"),
        text: "Hay errores que ya toca volver a mirar. La recuperación se registra con la siguiente respuesta.",
        href: "#/errores",
        action: "Revisar errores"
      };
    }
    var mission = nextMission(state);
    if (mission) {
      return {
        kind: "mission",
        title: mission.title,
        text: mission.subtitle + " · " + mission.questionCount + " preguntas · " + mission.tierLabel,
        href: "#/mision/" + encodeURIComponent(mission.id),
        action: mission.kind === "boss" ? "Afrontar jefe" : "Abrir misión"
      };
    }
    return {
      kind: "practice",
      title: "Simulacro o práctica",
      text: "Las rutas están completas. Puedes repetir una misión o entrenar en Supervivencia.",
      href: "#/mapa",
      action: "Ver el mapa"
    };
  }

  function contentReport() {
    var status = index.status || {};
    return {
      ok: !!index.ready,
      error: index.error,
      status: status,
      questions: index.questions.length,
      scored: status.scored || 0,
      exams: index.exams.length,
      sheets: Object.keys(index.sheets).length,
      topics: Object.keys(index.topics).length,
      sources: Object.keys(index.sources).length,
      missions: index.catalog ? index.catalog.missionList.length : 0,
      bosses: index.catalog ? index.catalog.bossList.length : 0,
      generatedAt: status.mapGeneratedAt || "",
      mapVersion: status.mapVersion || "",
      manualOverrides: status.manualOverrides || 0,
      contentWarnings: status.contentWarnings || []
    };
  }

  window.QuestContent = {
    build: build,
    get index() { return index; },
    get ready() { return index.ready; },
    get error() { return index.error; },
    get status() { return index.status; },
    get catalog() { return index.catalog; },
    get questions() { return index.questions; },
    get exams() { return index.exams; },
    getQuestion: getQuestion,
    getSheet: getSheet,
    getTopic: getTopic,
    getSource: getSource,
    getMission: getMission,
    getAreaRoute: getAreaRoute,
    missionUnlocked: missionUnlocked,
    missionCompletion: missionCompletion,
    nextMission: nextMission,
    bestCompletedMission: bestCompletedMission,
    recommendationFor: recommendationFor,
    sheetForQuestion: sheetForQuestion,
    studyHref: studyHref,
    sourceLabel: sourceLabel,
    pdfHref: pdfHref,
    dailyChallenge: dailyChallenge,
    dailyAvailable: dailyAvailable,
    recoveryDue: recoveryDue,
    recoveryStats: recoveryStats,
    stageTier: stageTier,
    buildQuestionSequence: buildQuestionSequence,
    nextRecommendedAction: nextRecommendedAction,
    contentReport: contentReport,
    areas: C.areas,
    routeCopy: ROUTE_COPY
  };
})();
