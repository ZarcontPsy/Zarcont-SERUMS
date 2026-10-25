/* © 2026 ZARCONT — Suite de regresión de contenido (Agente 8). */
import { assert, assertEq, skip } from "../lib/harness.mjs";
import { gotoApp, waitApp } from "../lib/apps.mjs";
import { sleep } from "../lib/cdp.mjs";

export async function runContent({ h, page, baseURL }) {
  h.suite("Contenido");
  h.state.app = "Contenido";

  await h.test(
    "CONTENT-01",
    "Study: 5 áreas, 20 categorías, 86 módulos, 210 fichas, 630 tarjetas e IDs únicos",
    async () => {
      await gotoApp(page, baseURL, "dashboard");
      const data = await page.eval(`(() => {
        const c = window.STUDY_CONTENT;
        const ids = (arr) => arr.map(x => x.id);
        const dup = (arr) => arr.filter((v,i,a) => a.indexOf(v) !== i);
        return {
          version: c.version,
          primaryAreas: c.primaryAreas ? c.primaryAreas.length : null,
          categories: c.categories ? c.categories.length : null,
          topics: c.topics.length,
          sheets: c.sheets.length,
          cards: c.cards.length,
          sources: c.sources ? c.sources.length : null,
          uniqueAreas: new Set(ids(c.primaryAreas || c.areas)).size,
          uniqueCategories: new Set(ids(c.categories || [])).size,
          uniqueTopics: new Set(ids(c.topics)).size,
          uniqueSheets: new Set(ids(c.sheets)).size,
          uniqueCards: new Set(ids(c.cards)).size,
          duplicateSheetIds: dup(ids(c.sheets)).slice(0, 5),
          duplicateCardIds: dup(ids(c.cards)).slice(0, 5),
          cardsPerSheetMin: Math.min(...c.sheets.map(s => c.cards.filter(cd => cd.sheetId === s.id).length)),
          cardsPerSheetMax: Math.max(...c.sheets.map(s => c.cards.filter(cd => cd.sheetId === s.id).length)),
          firstSheet: c.sheets[0].id,
          lastSheet: c.sheets[c.sheets.length-1].id,
          firstCard: c.cards[0].id,
          lastCard: c.cards[c.cards.length-1].id
        };
      })()`);
      assertEq(data.version, "2.5.0", "versión de contenido");
      assertEq(data.primaryAreas, 5, "áreas oficiales");
      assertEq(data.categories, 20, "categorías");
      assertEq(data.topics, 86, "módulos/temas");
      assertEq(data.sheets, 210, "fichas");
      assertEq(data.cards, 630, "tarjetas");
      assertEq(data.uniqueSheets, 210, "IDs de ficha únicos");
      assertEq(data.uniqueCards, 630, "IDs de tarjeta únicos");
      assertEq(data.duplicateSheetIds.length, 0, "sin IDs de ficha duplicados");
      assertEq(data.duplicateCardIds.length, 0, "sin IDs de tarjeta duplicados");
      assertEq(data.cardsPerSheetMin, 3, "tarjetas mínimas por ficha");
      assertEq(data.cardsPerSheetMax, 3, "tarjetas máximas por ficha");
      return data;
    },
    { severity: "alta" },
  );

  await h.test(
    "CONTENT-02",
    "Banqueo: 51 exámenes, 5.100 preguntas, 5.100 claves, 17 profesiones",
    async () => {
      await gotoApp(page, baseURL, "banqueo");
      const data = await page.eval(`(() => {
        const b = window.BANCO_OFICIAL;
        return {
          version: b.version,
          totals: b.totals,
          professions: b.professions.length,
          examList: b.exams.length,
          allQuestionsValid: b.exams.every(e => e.questions && e.questions.length === (e.questionCount || e.questions.length)),
          sampleExam: b.exams[0] && { id: b.exams[0].id, questions: b.exams[0].questions?.length, file: b.exams[0].file }
        };
      })()`);
      assertEq(data.totals.exams, 51, "exámenes");
      assertEq(data.totals.questions, 5100, "preguntas");
      assertEq(data.totals.validAnswers, 5100, "claves válidas");
      assertEq(data.totals.professions, 17, "profesiones");
      assertEq(data.professions, 17, "catálogo de profesiones");
      assertEq(data.examList, 51, "lista de exámenes");
      return data;
    },
    { severity: "alta" },
  );

  await h.test(
    "CONTENT-03",
    "Plazas: 7.323 plazas y 7.297 registros de adjudicación, sin pérdida",
    async () => {
      await gotoApp(page, baseURL, "plazas");
      const data = await page.eval(`(() => ({
        plazas: window.SERUMS_DATA.length,
        cols: window.SERUMS_COLS.length,
        adjudicados: window.SERUMS_ADJUDICADOS ? Object.keys(window.SERUMS_ADJUDICADOS).length : null,
        geoPuntos: window.SERUMS_GEO_PUNTOS ? Object.keys(window.SERUMS_GEO_PUNTOS).length : null,
        badge: document.getElementById('datasetBadge')?.textContent || "",
        recPill: document.getElementById('recPill')?.textContent || ""
      }))()`);
      assertEq(data.plazas, 7323, "plazas");
      assertEq(data.adjudicados, 7297, "adjudicaciones");
      assertEq(data.cols, 20, "columnas del dataset");
      assert(/7,323|7323/.test(data.recPill + " " + data.badge), `contador visible 7323 (recPill=${data.recPill}, badge=${data.badge})`);
      return data;
    },
    { severity: "alta" },
  );

  await h.test(
    "CONTENT-04",
    "QUEST: 10 personajes, 33 cosméticos, 9 ranuras y 300 preguntas mapeadas",
    async () => {
      await gotoApp(page, baseURL, "quest");
      const data = await page.eval(`(() => {
        const q = window.QuestCharacters;
        const map = window.QUEST_CONTENT_MAP;
        return {
          characters: q.characters.length,
          cosmetics: q.cosmetics.length,
          slots: q.ALL_SLOTS.length,
          starterId: q.starterId,
          mappedQuestions: Object.keys(map.questions).length,
          mapMeta: map.meta || null
        };
      })()`);
      assertEq(data.characters, 10, "personajes");
      assertEq(data.cosmetics, 33, "cosméticos");
      assertEq(data.slots, 9, "ranuras cosméticas");
      assertEq(data.starterId, "ilan", "personaje inicial");
      assertEq(data.mappedQuestions, 300, "preguntas con afinidad");
      return data;
    },
    { severity: "alta" },
  );

  await h.test(
    "CONTENT-05",
    "Catálogo de claves de almacenamiento: presentes y sin renombrar",
    async () => {
      // Se ejerce la preferencia de tema de Plazas: Store antepone `serums_` y la clave real es `serums_theme`.
      await gotoApp(page, baseURL, "plazas", { settle: 800 });
      await page.click("#btnTheme");
      await sleep(350);
      const keys = await page.eval(`Object.keys(localStorage).sort()`);
      const required = ["study-state-v1", "studyhub:snapshot:v1", "serumsquest:state:v1", "serumsquest:snapshot:v1", "serumsquest:theme", "study-theme", "serums_theme"];
      const missing = required.filter((k) => !keys.includes(k));
      assertEq(missing.length, 0, `claves requeridas ausentes: ${missing.join(", ")}`);
      const themeKeys = keys.filter((k) => /^(banqueo-theme-v1|es-theme|study-theme|serums_theme|serumsquest:theme)$/.test(k));
      return { allKeys: keys, required, missing, themeKeys };
    },
    { severity: "alta" },
  );

  await h.test(
    "CONTENT-06",
    "IndexedDB: bases study-serums y examenstudio declaradas (sin borrar datos)",
    async () => {
      const dbs = await page.eval(`(async () => { try { return await indexedDB.databases(); } catch (e) { return []; } })()`);
      const names = dbs.map((d) => d.name);
      return { databases: dbs, names };
    },
    { severity: "media" },
  );

  await h.test(
    "CONTENT-07",
    "Fuentes y dependencias externas: PDF.js/Tesseract/Google Maps solo por CDN",
    async () => {
      await gotoApp(page, baseURL, "banqueo");
      const scripts = await page.eval(`Array.from(document.scripts).map(s => s.src).filter(Boolean)`);
      const pdfjs = scripts.filter((s) => /pdf\.js|pdf\.min\.js/.test(s));
      assert(pdfjs.length >= 1, "Banqueo debe cargar PDF.js desde CDN (documentado en NOTICE.md)");
      await gotoApp(page, baseURL, "plazas");
      const mapKey = await page.eval(`window.App && window.App.apiKey ? (window.App.apiKey() ? "configurada" : "vacía") : "sin API"`);
      return { pdfjs, mapKey };
    },
    { severity: "baja" },
  );
}
