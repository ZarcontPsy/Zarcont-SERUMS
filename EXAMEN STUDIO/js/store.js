/* Banqueo · capa de datos local
   © 2026 ZARCONT — Licencia propietaria (ver LICENSE)
   Une el banco oficial precargado con los exámenes importados por el usuario.
   Los PDFs oficiales viven en /documentos. Los importados se conservan como
   Blob/ArrayBuffer en IndexedDB para no alterar el archivo original. */
(function () {
  "use strict";

  const OFFICIAL = window.BANCO_OFICIAL || { exams: [], professions: [], questions: {}, audits: [] };
  const DB_NAME = "examenstudio";
  const DB_VERSION = 2;
  const STORES = ["exams", "questions", "keys", "attempts", "audits", "issues", "files", "imports"];
  const REVIEW_KEY = "banqueo-review-v1";
  const ISSUE_KEY = "banqueo-issues-v1";
  const PROF_KEY = "banqueo-profession-v1";

  let db = null;
  let dbError = null;
  const fileUrls = new Map();

  const state = {
    ready: false,
    dbReady: false,
    professions: [],
    exams: [],
    questions: [],
    byId: new Map(),
    byExam: new Map(),
    attempts: [],
    issues: [],
    imports: [],
    audits: new Map(),
    review: {},
    issueResolved: {},
    dupMap: new Map(),
    dupIndex: new Map(),
    stats: { exams: 0, questions: 0, reviewed: 0, pending: 0, duplicates: 0, professions: 0 },
  };

  const safeParse = (value) => {
    try { return JSON.parse(value); } catch { return null; }
  };

  function loadReview() {
    state.review = safeParse(localStorage.getItem(REVIEW_KEY)) || {};
    state.issueResolved = safeParse(localStorage.getItem(ISSUE_KEY)) || {};
  }

  function saveReview() {
    try { localStorage.setItem(REVIEW_KEY, JSON.stringify(state.review)); } catch {}
  }

  function saveIssueState() {
    try { localStorage.setItem(ISSUE_KEY, JSON.stringify(state.issueResolved)); } catch {}
  }

  function openDB() {
    if (!("indexedDB" in window)) return Promise.reject(new Error("IndexedDB no disponible"));
    return new Promise((resolve, reject) => {
      let settled = false;
      let request;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        try { request?.result?.close(); } catch {}
        reject(new Error("IndexedDB no respondió a tiempo. El banco funciona, pero el progreso no se guardará en este navegador."));
      }, 3500);
      const fail = (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error || new Error("No se pudo abrir IndexedDB"));
      };
      try {
        request = indexedDB.open(DB_NAME, DB_VERSION);
      } catch (error) {
        fail(error);
        return;
      }
      request.onupgradeneeded = () => {
        const database = request.result;
        STORES.forEach((name) => {
          if (!database.objectStoreNames.contains(name)) {
            database.createObjectStore(name, { keyPath: "id" });
          }
        });
      };
      request.onsuccess = () => {
        clearTimeout(timer);
        if (settled) { try { request.result.close(); } catch {} return; }
        settled = true;
        db = request.result;
        resolve(db);
      };
      request.onerror = () => fail(request.error);
      request.onblocked = () => fail(new Error("IndexedDB está bloqueado por otra pestaña de Examen Studio."));
    });
  }

  function requestValue(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function tx(store, mode, work) {
    if (!db) return Promise.reject(new Error("IndexedDB no disponible"));
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(store, mode);
      const objectStore = transaction.objectStore(store);
      let result;
      try { result = work(objectStore); } catch (error) { reject(error); return; }
      transaction.oncomplete = () => resolve(result && result.result !== undefined ? result.result : result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error("Transacción cancelada"));
    });
  }

  const dbAll = (store) => db ? requestValue(db.transaction(store, "readonly").objectStore(store).getAll()) : Promise.resolve([]);
  const dbGet = (store, id) => db ? requestValue(db.transaction(store, "readonly").objectStore(store).get(id)) : Promise.resolve(null);
  const dbPut = (store, value) => tx(store, "readwrite", (objectStore) => objectStore.put(value));
  const dbDelete = (store, id) => tx(store, "readwrite", (objectStore) => objectStore.delete(id));

  function dbBatch(operations) {
    if (!db) return Promise.reject(new Error("IndexedDB no disponible"));
    return new Promise((resolve, reject) => {
      const names = [...new Set(operations.map((operation) => operation.store))];
      const transaction = db.transaction(names, "readwrite");
      try {
        operations.forEach((operation) => {
          const objectStore = transaction.objectStore(operation.store);
          if (operation.type === "put") objectStore.put(operation.value);
          else if (operation.type === "delete") objectStore.delete(operation.id);
        });
      } catch (error) { reject(error); return; }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error("Transacción cancelada"));
    });
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
  }

  function dupKey(question) {
    const statement = normalizeText(question.s || question.statement).slice(0, 300);
    const options = (question.o || question.options || [])
      .map((option) => normalizeText(option.text || option.t))
      .filter(Boolean).sort().join("|").slice(0, 500);
    return statement + "||" + options;
  }

  function shortHash(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function buildDuplicateIndex() {
    state.dupMap = new Map();
    state.dupIndex = new Map();
    state.questions.forEach((question) => {
      const key = dupKey(question);
      question._dupKey = key;
      if (!key || key.length < 8) return;
      if (!state.dupMap.has(key)) state.dupMap.set(key, []);
      state.dupMap.get(key).push(question);
    });
    state.dupMap.forEach((items, key) => {
      const id = shortHash(key);
      state.dupIndex.set(id, items);
      if (items.length > 1) {
        items.forEach((question) => {
          question.dg = id;
          question.dc = items.length;
        });
      }
    });
  }

  function hydrateOfficial() {
    const professionMap = new Map();
    OFFICIAL.professions.forEach((profession) => {
      professionMap.set(profession.id, { ...profession, examIds: [] });
    });
    const examMap = new Map();
    OFFICIAL.exams.forEach((exam) => {
      const hydratedExam = {
        ...exam,
        official: true,
        imported: false,
        audit: { ...(exam.audit || {}) },
        questions: [],
      };
      examMap.set(exam.id, hydratedExam);
      state.exams.push(hydratedExam);
      state.byExam.set(exam.id, hydratedExam.questions);
      state.audits.set(exam.id, { examId: exam.id, ...(OFFICIAL.audits || []).find((audit) => audit.examId === exam.id) });
      const profession = professionMap.get(exam.professionId);
      if (profession) profession.examIds.push(exam.id);
      (OFFICIAL.questions[exam.id] || []).forEach((question) => {
        const hydratedQuestion = {
          ...question,
          examId: exam.id,
          professionId: exam.professionId,
          cycle: exam.cycle,
          year: exam.year,
          date: exam.date,
          file: exam.file,
          filePath: exam.filePath,
          official: true,
          imported: false,
          statement: question.s,
          options: question.o,
          correct: question.c,
          num: question.n,
          page: question.p,
          rawText: question.r,
          ev: question.ev || null,
          status: question.st || "valid",
          confidence: question.cf || "alta",
          reviewed: 0,
        };
        hydratedExam.questions.push(hydratedQuestion);
        state.questions.push(hydratedQuestion);
        state.byId.set(hydratedQuestion.id, hydratedQuestion);
      });
    });
    state.professions = [...professionMap.values()];
    (OFFICIAL.audits || []).forEach((audit) => {
      (audit.incidents || []).forEach((incident, index) => {
        const exam = examMap.get(audit.examId);
        state.issues.push({
          id: `official-${audit.examId}-${index + 1}`,
          examId: audit.examId,
          professionId: exam ? exam.professionId : null,
          official: true,
          status: incident.severity === "alta" ? "abierto" : "informativo",
          ...incident,
          page: incident.page || null,
        });
      });
    });
  }

  function normalizeDbQuestion(raw, exam, keyMap) {
    const options = (raw.options || raw.o || []).map((option, index) => ({
      id: option.id || String.fromCharCode(65 + index),
      text: option.text ?? option.t ?? "",
      raw: option.raw || option.mk || "",
      hl: Boolean(option.hl),
    }));
    const key = keyMap.get(raw.id);
    const correct = raw.c || (Array.isArray(key) ? (key.length === 1 ? key[0] : "") : "");
    const status = raw.status || raw.st || (correct && options.length >= 2 ? "valid" : "pending");
    return {
      ...raw,
      n: raw.num ?? raw.n ?? 0,
      p: raw.page ?? raw.p ?? 1,
      s: raw.statement ?? raw.s ?? "",
      r: raw.raw ?? raw.r ?? "",
      o: options,
      c: correct,
      ev: raw.ev || null,
      st: status,
      status,
      cf: raw.conf ?? raw.cf ?? (status === "valid" ? "alta" : "baja"),
      confidence: raw.conf ?? raw.cf ?? (status === "valid" ? "alta" : "baja"),
      rv: raw.rv ? 1 : 0,
      examId: exam.id,
      professionId: exam.professionId,
      cycle: exam.cycle,
      year: exam.year,
      date: exam.date,
      file: exam.file || exam.originalFilename || "",
      filePath: exam.filePath || "",
      official: false,
      imported: true,
      statement: raw.statement ?? raw.s ?? "",
      options,
      correct,
      num: raw.num ?? raw.n ?? 0,
      page: raw.page ?? raw.p ?? 1,
      rawText: raw.raw ?? raw.r ?? "",
      reviewed: raw.rv ? 1 : 0,
    };
  }

  async function hydrateImported() {
    if (!db) return;
    const [exams, questions, keys, attempts, audits, issues, imports] = await Promise.all([
      dbAll("exams"), dbAll("questions"), dbAll("keys"), dbAll("attempts"),
      dbAll("audits"), dbAll("issues"), dbAll("imports"),
    ]);
    const keyMap = new Map(keys.map((key) => [key.id, key.correct]));
    const auditMap = new Map(audits.map((audit) => [audit.examId, audit]));
    const importedExams = exams.filter((exam) => !exam.demo && !String(exam.id).startsWith("demo-"));
    importedExams.forEach((exam) => {
      if (state.byId.has(exam.id)) return;
      const hydratedExam = {
        ...exam,
        official: false,
        imported: true,
        audit: auditMap.get(exam.id) || exam.audit || { status: "revision", coverage: 0, incidents: 0 },
        questions: [],
      };
      state.exams.push(hydratedExam);
      state.byExam.set(exam.id, hydratedExam.questions);
      if (hydratedExam.audit) state.audits.set(exam.id, { examId: exam.id, ...hydratedExam.audit });
    });
    questions.forEach((raw) => {
      const exam = state.exams.find((item) => item.id === raw.examId);
      if (!exam || !exam.imported) return;
      const question = normalizeDbQuestion(raw, exam, keyMap);
      exam.questions.push(question);
      state.questions.push(question);
      state.byId.set(question.id, question);
    });
    state.exams.forEach((exam) => {
      if (exam.imported) {
        exam.questions.sort((a, b) => (a.n || 0) - (b.n || 0));
      }
    });
    state.attempts = attempts.sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
    state.imports = imports.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    state.imports.forEach((record) => {
      if (record.status === "processing") record.status = "interrupted";
    });
    issues.forEach((issue) => {
      state.issues.push({ ...issue, official: false, status: issue.status || "abierto" });
    });
  }

  function computeStats() {
    const reviewed = state.questions.filter((question) => isReviewed(question)).length;
    const pending = state.questions.filter((question) => question.status !== "valid" || !question.correct).length;
    const duplicateGroups = [...state.dupMap.values()].filter((items) => items.length > 1).length;
    state.stats = {
      exams: state.exams.length,
      questions: state.questions.length,
      reviewed,
      pending,
      duplicates: duplicateGroups,
      professions: state.professions.filter((profession) => examList(profession.id).length).length,
    };
  }

  async function init() {
    loadReview();
    hydrateOfficial();
    buildDuplicateIndex();
    try {
      await openDB();
      state.dbReady = true;
      await hydrateImported();
    } catch (error) {
      dbError = error;
      state.dbReady = false;
    }
    buildDuplicateIndex();
    computeStats();
    state.ready = true;
    return state;
  }

  function isReviewed(question) {
    if (!question) return false;
    if (question.imported && question.rv) return true;
    return Number(state.review[question.id]?.r) === 1;
  }

  function reviewInfo(question) {
    const local = state.review[question.id] || {};
    return {
      reviewed: isReviewed(question),
      flagged: Boolean(local.flag),
      note: local.flag || "",
      timestamp: local.ts || 0,
    };
  }

  function markReviewed(questionId, reviewed) {
    const question = state.byId.get(questionId);
    if (!question) return;
    state.review[questionId] = { ...(state.review[questionId] || {}), r: reviewed ? 1 : 0, ts: Date.now() };
    if (question.imported) {
      question.rv = reviewed ? 1 : 0;
      question.reviewed = question.rv;
      if (db) dbPut("questions", serializeQuestion(question)).catch(() => {});
    }
    saveReview();
    computeStats();
  }

  function flagQuestion(questionId, note) {
    const clean = String(note || "").trim();
    state.review[questionId] = { ...(state.review[questionId] || {}), flag: clean, ts: Date.now() };
    if (!clean) delete state.review[questionId].flag;
    saveReview();
  }

  async function setCorrectAnswer(questionId, letter) {
    const question = state.byId.get(questionId);
    if (!question) throw new Error("La pregunta no existe.");
    if (question.official) throw new Error("La clave oficial no se edita desde aquí. Registra una incidencia.");
    const normalized = String(letter || "").toUpperCase();
    if (!question.o.some((option) => option.id === normalized)) throw new Error("La alternativa indicada no existe.");
    question.c = normalized;
    question.correct = normalized;
    question.o.forEach((option) => { option.hl = option.id === normalized; });
    question.st = "valid";
    question.status = "valid";
    question.cf = "manual";
    question.confidence = "manual";
    if (db) await dbPut("questions", serializeQuestion(question));
    const exam = examById(question.examId);
    if (exam) {
      const questions = exam.questions || [];
      const valid = questions.filter((item) => item.st === "valid" && item.c).length;
      const answers = questions.filter((item) => item.c).length;
      exam.audit = {
        ...(exam.audit || {}),
        questionsVerified: valid,
        answersIdentified: answers,
        reviewRequired: questions.length - valid,
        coverage: questions.length ? (valid / questions.length) * 100 : 0,
        status: valid === questions.length && answers === questions.length ? "validado" : "revision",
        reviewedAt: new Date().toISOString(),
        reviewedManually: true,
      };
      if (db) await dbPut("audits", { id: exam.id, examId: exam.id, ...exam.audit });
    }
    computeStats();
    return question;
  }

  function serializeQuestion(question) {
    return {
      id: question.id,
      examId: question.examId,
      num: question.num,
      page: question.page,
      statement: question.statement,
      raw: question.rawText || "",
      options: question.options,
      status: question.status,
      conf: question.confidence,
      c: question.correct,
      ev: question.ev,
      rv: question.rv || 0,
    };
  }

  function professionById(id) {
    return state.professions.find((profession) => profession.id === id) || null;
  }

  function examById(id) {
    return state.exams.find((exam) => exam.id === id) || null;
  }

  function examList(professionId) {
    return state.exams
      .filter((exam) => !professionId || exam.professionId === professionId)
      .sort((a, b) => (b.year - a.year) || String(b.convocatoria).localeCompare(String(a.convocatoria)) || a.title.localeCompare(b.title));
  }

  function questionsFor(examId) {
    return state.byExam.get(examId) || [];
  }

  function professionStats(professionId) {
    const exams = examList(professionId);
    const questions = exams.flatMap((exam) => exam.questions);
    const reviewed = questions.filter(isReviewed).length;
    const pending = questions.filter((question) => question.status !== "valid" || !question.correct).length;
    const incidents = exams.reduce((total, exam) => total + (exam.audit?.incidents || 0), 0);
    const coverage = exams.length
      ? exams.reduce((total, exam) => total + Number(exam.audit?.coverage || 0), 0) / exams.length
      : 0;
    return {
      exams: exams.length,
      questions: questions.length,
      reviewed,
      pending,
      incidents,
      coverage,
      reviewPct: questions.length ? (reviewed / questions.length) * 100 : 0,
    };
  }

  function examStats(exam) {
    if (!exam) return { questions: 0, reviewed: 0, pending: 0, flags: 0, duplicates: 0, reviewPct: 0, incidents: 0 };
    const questions = exam.questions || [];
    const reviewed = questions.filter(isReviewed).length;
    const pending = questions.filter((question) => question.status !== "valid" || !question.correct).length;
    const flags = questions.filter((question) => reviewInfo(question).flagged).length;
    const duplicates = questions.filter((question) => (question.dc || 0) > 1).length;
    return {
      questions: questions.length,
      reviewed,
      pending,
      flags,
      duplicates,
      reviewPct: questions.length ? (reviewed / questions.length) * 100 : 0,
      incidents: exam.audit?.incidents || 0,
      coverage: exam.audit?.coverage || 0,
    };
  }

  function filterQuestions(options = {}) {
    const { professionId, examId, query = "", filter = "all", cycle = "" } = options;
    const search = normalizeText(query);
    let items = state.questions;
    if (professionId) items = items.filter((question) => question.professionId === professionId);
    if (examId) items = items.filter((question) => question.examId === examId);
    if (cycle) items = items.filter((question) => question.cycle === cycle);
    if (search) {
      items = items.filter((question) => {
        const haystack = normalizeText([
          question.s, question.num, question.cycle,
          ...(question.options || []).map((option) => option.text),
        ].join(" "));
        return search.split(" ").every((word) => haystack.includes(word));
      });
    }
    if (filter === "valid") items = items.filter((question) => question.status === "valid" && question.correct);
    else if (filter === "pending") items = items.filter((question) => question.status !== "valid" || !question.correct);
    else if (filter === "reviewed") items = items.filter(isReviewed);
    else if (filter === "unreviewed") items = items.filter((question) => !isReviewed(question));
    else if (filter === "flagged") items = items.filter((question) => reviewInfo(question).flagged);
    else if (filter === "duplicates") items = items.filter((question) => (question.dc || 0) > 1);
    else if (filter === "incidents") items = items.filter((question) => question.status !== "valid" || reviewInfo(question).flagged);
    return items;
  }

  function duplicatesFor(question) {
    if (!question || !question.dg) return [];
    return (state.dupIndex.get(question.dg) || []).filter((item) => item.id !== question.id);
  }

  function issuesForExam(examId) {
    return state.issues.filter((issue) => issue.examId === examId);
  }

  function issueIsResolved(issue) {
    return Boolean(state.issueResolved[issue.id]);
  }

  function resolveIssue(issueId, resolved = true) {
    state.issueResolved[issueId] = Boolean(resolved);
    if (!resolved) delete state.issueResolved[issueId];
    saveIssueState();
  }

  function unresolvedIssueCount(examId) {
    return state.issues.filter((issue) => (!examId || issue.examId === examId) && !issueIsResolved(issue) && issue.severity === "alta").length;
  }

  function openIssueCount(examId) {
    return state.issues.filter((issue) => (!examId || issue.examId === examId) && !issueIsResolved(issue)).length;
  }

  function hasHash(hash) {
    return state.exams.some((exam) => exam.fileHash === hash);
  }

  async function saveFile(name, buffer, type, hash) {
    const id = `file-${hash.slice(0, 20)}`;
    const existing = db ? await dbGet("files", id) : null;
    if (existing) return id;
    const record = { id, name, type: type || "application/pdf", hash, size: buffer.byteLength, buffer, createdAt: Date.now() };
    if (db) await dbPut("files", record);
    return id;
  }

  async function getFile(fileId) {
    if (!fileId || !db) return null;
    return dbGet("files", fileId);
  }

  async function fileUrl(fileId) {
    if (fileUrls.has(fileId)) return fileUrls.get(fileId);
    const record = await getFile(fileId);
    if (!record) return null;
    const blob = new Blob([record.buffer], { type: record.type || "application/pdf" });
    const url = URL.createObjectURL(blob);
    fileUrls.set(fileId, url);
    return url;
  }

  function openOriginal(question) {
    if (!question) return;
    if (question.filePath) {
      const suffix = question.page ? `#page=${question.page}` : "";
      window.open(question.filePath + suffix, "_blank", "noopener");
      return;
    }
    const exam = examById(question.examId);
    if (!exam?.fileId) return false;
    return fileUrl(exam.fileId).then((url) => {
      if (!url) return false;
      window.open(url + (question.page ? `#page=${question.page}` : ""), "_blank", "noopener");
      return true;
    });
  }

  async function createImportRecord(file, hash, fileId) {
    const record = {
      id: `import-${hash.slice(0, 16)}`,
      fileId,
      name: file.name,
      size: file.size,
      hash,
      status: "processing",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      message: "Procesando…",
    };
    state.imports.unshift(record);
    if (db) await dbPut("imports", record);
    return record;
  }

  async function updateImport(recordId, patch) {
    const record = state.imports.find((item) => item.id === recordId);
    if (!record) return null;
    Object.assign(record, patch, { updatedAt: Date.now() });
    if (db) {
      const serializable = { ...record };
      delete serializable.buffer;
      await dbPut("imports", serializable);
    }
    return record;
  }

  async function discardImport(recordId) {
    const record = state.imports.find((item) => item.id === recordId);
    state.imports = state.imports.filter((item) => item.id !== recordId);
    if (record && db) {
      await dbDelete("imports", recordId);
      if (record.fileId) {
        const uses = state.exams.some((exam) => exam.fileId === record.fileId);
        if (!uses) await dbDelete("files", record.fileId);
      }
    }
  }

  function uniqueExamId(base) {
    if (!state.exams.some((exam) => exam.id === base)) return base;
    let index = 2;
    while (state.exams.some((exam) => exam.id === `${base}-${index}`)) index += 1;
    return `${base}-${index}`;
  }

  function analysisToExam(analysis, meta, fileId) {
    const classification = analysis.classification || {};
    const professionId = meta.professionId || classification.professionId;
    const profession = professionById(professionId);
    if (!profession) throw new Error("Selecciona una profesión válida.");
    const year = Number(meta.year || classification.year);
    const convocatoria = String(meta.convocatoria || classification.convocatoria || "").trim();
    if (!year || !convocatoria) throw new Error("Indica el año y la convocatoria.");
    const cycle = `${year}-${convocatoria}`;
    const baseId = `import-${year}-${convocatoria.toLowerCase()}-${professionId}-${analysis.hash.slice(0, 8)}`;
    const examId = uniqueExamId(baseId);
    const title = String(meta.title || `${profession.name} · SERUMS ${cycle} · Importado`).trim();
    const questions = (analysis.questions || []).map((question, index) => ({
      id: `${examId}-q${String(index + 1).padStart(3, "0")}`,
      n: question.n || index + 1,
      p: question.p || 1,
      s: question.s || "",
      r: question.r || "",
      o: (question.o || []).map((option) => ({
        id: option.id,
        text: option.text,
        raw: option.raw || "",
        hl: Boolean(option.hl),
      })),
      c: question.c || "",
      ev: question.ev || null,
      st: question.st || (question.c ? "valid" : "pending"),
      status: question.status || question.st || (question.c ? "valid" : "pending"),
      cf: question.cf || (question.c ? "alta" : "baja"),
      rv: 0,
      examId,
      professionId,
      cycle,
      year,
      date: classification.date || "",
      file: analysis.name,
      filePath: "",
      official: false,
      imported: true,
      statement: question.s || "",
      options: [],
      correct: question.c || "",
      num: question.n || index + 1,
      page: question.p || 1,
      rawText: question.r || "",
      reviewed: 0,
    }));
    questions.forEach((question) => { question.options = question.o; question.statement = question.s; question.correct = question.c; question.num = question.n; question.page = question.p; question.rawText = question.r; });
    const validQuestions = questions.filter((question) => question.st === "valid" && question.correct);
    const answers = questions.filter((question) => question.correct);
    const audit = {
      ...(analysis.audit || {}),
      status: validQuestions.length === questions.length && answers.length === questions.length ? "validado" : "revision",
      coverage: questions.length ? (validQuestions.length / questions.length) * 100 : 0,
      pagesProcessed: analysis.pages || 0,
      pagesWithText: analysis.pagesWithText || 0,
      pagesWithoutText: analysis.pagesWithoutText || 0,
      questionsDetected: questions.length,
      questionsVerified: validQuestions.length,
      answersIdentified: answers.length,
      incidents: (analysis.issues || []).length,
      reviewRequired: questions.length - validQuestions.length,
      reviewed: 0,
      duplicateQuestions: 0,
      duplicateGroups: 0,
      generatedAt: new Date().toISOString(),
      source: "importado en el navegador",
    };
    const exam = {
      id: examId,
      professionId,
      title,
      cycle,
      year,
      convocatoria,
      date: classification.date || "",
      pages: analysis.pages || 0,
      questions: questions.length,
      validQuestions: validQuestions.length,
      answers: answers.length,
      file: analysis.name,
      filePath: "",
      fileId,
      fileHash: analysis.hash,
      fileBytes: analysis.bytes,
      sourcePrefix: "importado",
      header: classification.header || "",
      official: false,
      imported: true,
      createdAt: Date.now(),
      audit,
    };
    const issues = (analysis.issues || []).map((issue, index) => ({
      id: `import-${examId}-${index + 1}`,
      examId,
      professionId,
      official: false,
      status: issue.severity === "alta" ? "abierto" : "informativo",
      ...issue,
    }));
    return { exam, questions, audit, issues };
  }

  async function saveAnalysis(recordId, analysis, meta) {
    const record = state.imports.find((item) => item.id === recordId);
    const fileId = record?.fileId || analysis.fileId;
    const { exam, questions, audit, issues } = analysisToExam(analysis, meta, fileId);
    // Guardar primero el registro del examen y después actualizar el estado en memoria.
    if (db) {
      const operations = [
        { store: "exams", type: "put", value: { ...exam, questions: undefined } },
        ...questions.map((question) => ({ store: "questions", type: "put", value: serializeQuestion(question) })),
        { store: "audits", type: "put", value: { id: exam.id, examId: exam.id, ...audit } },
        ...issues.map((issue) => ({ store: "issues", type: "put", value: issue })),
      ];
      if (recordId) operations.push({
        store: "imports", type: "put",
        value: { ...record, status: "saved", analysis: null, examId: exam.id, message: "Guardado en el banco", updatedAt: Date.now() },
      });
      await dbBatch(operations);
    }
    exam.questions = questions;
    state.exams.push(exam);
    state.byExam.set(exam.id, questions);
    state.audits.set(exam.id, { examId: exam.id, ...audit });
    questions.forEach((question) => {
      state.questions.push(question);
      state.byId.set(question.id, question);
    });
    issues.forEach((issue) => state.issues.push(issue));
    if (record) {
      record.status = "saved";
      record.examId = exam.id;
      record.analysis = null;
      record.message = "Guardado en el banco";
      record.updatedAt = Date.now();
    }
    buildDuplicateIndex();
    computeStats();
    return exam;
  }

  async function deleteExam(examId) {
    const exam = examById(examId);
    if (!exam || exam.official) throw new Error("Los exámenes oficiales no se eliminan.");
    const questions = questionsFor(examId);
    if (db) {
      const operations = [
        { store: "exams", type: "delete", id: examId },
        { store: "audits", type: "delete", id: examId },
        ...questions.map((question) => ({ store: "questions", type: "delete", id: question.id })),
        ...state.issues.filter((issue) => issue.examId === examId).map((issue) => ({ store: "issues", type: "delete", id: issue.id })),
      ];
      await dbBatch(operations);
    }
    state.exams = state.exams.filter((item) => item.id !== examId);
    state.questions = state.questions.filter((question) => question.examId !== examId);
    state.byExam.delete(examId);
    state.audits.delete(examId);
    state.issues = state.issues.filter((issue) => issue.examId !== examId);
    questions.forEach((question) => state.byId.delete(question.id));
    buildDuplicateIndex();
    computeStats();
  }

  async function saveAttempt(attempt) {
    const existingIndex = state.attempts.findIndex((item) => item.id === attempt.id);
    if (existingIndex >= 0) state.attempts[existingIndex] = attempt;
    else state.attempts.unshift(attempt);
    if (db) await dbPut("attempts", attempt);
  }

  async function deleteAttempt(attemptId) {
    state.attempts = state.attempts.filter((attempt) => attempt.id !== attemptId);
    if (db) await dbDelete("attempts", attemptId);
  }

  function attemptsFor(examId) {
    return state.attempts
      .filter((attempt) => (!examId || attempt.examId === examId))
      .sort((a, b) => (b.doneAt || b.startedAt || 0) - (a.doneAt || a.startedAt || 0));
  }

  function attemptById(id) {
    return state.attempts.find((attempt) => attempt.id === id) || null;
  }

  function lastProfession() {
    try {
      const saved = localStorage.getItem(PROF_KEY);
      if (saved && professionById(saved)) return saved;
    } catch {}
    return state.professions.find((profession) => examList(profession.id).length)?.id || state.professions[0]?.id || "medicina";
  }

  function rememberProfession(professionId) {
    try { localStorage.setItem(PROF_KEY, professionId); } catch {}
  }

  function exportedBackup() {
    return {
      app: "Banqueo",
      version: 1,
      exportedAt: new Date().toISOString(),
      exams: state.exams.filter((exam) => exam.imported).map((exam) => ({ ...exam, questions: undefined })),
      questions: state.questions.filter((question) => question.imported).map(serializeQuestion),
      attempts: state.attempts,
      review: state.review,
      issueResolved: state.issueResolved,
      imports: state.imports.map((record) => ({ ...record, analysis: undefined })),
    };
  }

  window.BanqueoStore = {
    state,
    init,
    professionById,
    examById,
    examList,
    questionsFor,
    professionStats,
    examStats,
    filterQuestions,
    duplicatesFor,
    isReviewed,
    reviewInfo,
    markReviewed,
    flagQuestion,
    setCorrectAnswer,
    computeStats,
    issuesForExam,
    issueIsResolved,
    resolveIssue,
    unresolvedIssueCount,
    openIssueCount,
    hasHash,
    saveFile,
    getFile,
    fileUrl,
    openOriginal,
    createImportRecord,
    updateImport,
    discardImport,
    saveAnalysis,
    deleteExam,
    saveAttempt,
    deleteAttempt,
    attemptsFor,
    attemptById,
    lastProfession,
    rememberProfession,
    exportedBackup,
    get dbError() { return dbError; },
    get dbReady() { return state.dbReady; },
    normalizeText,
  };
})();
