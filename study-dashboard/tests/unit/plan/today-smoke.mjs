/* Verificación visual/técnica del bloque «Ruta de hoy» en la app real.
   Uso manual (no forma parte de la suite unitaria):
     & 'C:\Users\USARIO\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe' study-dashboard/tests/unit/plan/today-smoke.mjs
   Requiere Chrome y Python del arnés de tests/e2e; no los modifica.
   Capturas en %TEMP%\today-route-smoke\*.png y resumen en consola.

   © 2026 ZARCONT */
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { StaticServer } from "../../../../tests/e2e/lib/server.mjs";
import { Chrome, Page, sleep } from "../../../../tests/e2e/lib/cdp.mjs";

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");
const OUT = path.join(os.tmpdir(), "today-route-smoke");
await fs.mkdir(OUT, { recursive: true });

const server = new StaticServer({ root: ROOT, port: 8795, python: "C:\\Python313\\python.exe" });
const chrome = new Chrome({
  chromePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  userDataDir: path.join(await mkdtemp(path.join(os.tmpdir(), "qa-today-")), "p"),
  port: 9395
});

const NOW = "2026-11-09T08:00:00-05:00";
const DAY = 86400000;
const today = new Date(NOW);
const iso = (daysAgo, hour = 10) => new Date(today.getTime() - daysAgo * DAY).toISOString();
const local = (daysAgo, hour = 10) => new Date(today.getTime() - daysAgo * DAY).toISOString().slice(0, 10);

function seededState() {
  const ids = ["sheet-aps-01", "sheet-aps-02", "sheet-aps-03", "sheet-aps-04", "sheet-aps-05", "sheet-aps-06", "sheet-aps-07", "sheet-aps-08", "sheet-aps-09", "sheet-aps-10"];
  const sheets = {};
  ids.forEach((id, index) => {
    sheets[id] = {
      views: 2,
      viewedAt: iso(index + 1),
      readSeconds: 240,
      scroll: 0.4,
      favorite: false
    };
    if (index < 6) sheets[id].completedAt = iso(index);
  });
  const cardReviews = {};
  for (let i = 1; i <= 8; i += 1) {
    cardReviews[`card-seed-${i}`] = {
      box: 1,
      reviews: 1,
      lapses: 0,
      lastResult: "good",
      lastReviewAt: iso(3),
      dueAt: iso(1)
    };
  }
  return {
    version: 2,
    schemaVersion: 2,
    createdAt: iso(30),
    updatedAt: iso(0),
    resetAt: null,
    sheets,
    cards: cardReviews,
    sessions: [],
    activity: { [local(1)]: { sheetViews: 3, sheetCompletions: 2, cardReviews: 8, correct: 6, wrong: 2, seconds: 900 } },
    goals: { dailySheets: 2 },
    history: [],
    last: {
      dashboard: {
        sheetId: "sheet-aps-08",
        title: "Último punto leído",
        context: "Tema de prueba",
        at: iso(1),
        url: ""
      }
    },
    flashSession: null,
    annotations: {
      "ann-seed-1": {
        id: "ann-seed-1",
        sheetId: "sheet-aps-09",
        sectionIndex: 0,
        paragraphIndex: 0,
        color: "important",
        quote: "Una cita real del contenido",
        note: "",
        createdAt: iso(4),
        updatedAt: iso(4),
        deleted: false
      }
    },
    doubts: {
      "doubt-seed-1": {
        id: "doubt-seed-1",
        sheetId: "sheet-aps-09",
        sectionIndex: 0,
        paragraphIndex: 1,
        quote: "¿Cómo se aplica este criterio en la práctica?",
        note: "No me queda claro el criterio de derivación.",
        resolvedAt: null,
        createdAt: iso(2),
        updatedAt: iso(2),
        deleted: false
      }
    },
    sheetConfidence: {
      "sheet-aps-01": {
        id: "sheet-aps-01", sheetId: "sheet-aps-01", value: "partial",
        createdAt: iso(5), updatedAt: iso(5), deleted: false
      }
    },
    sheetReview: {
      "review-sheet-aps-04": {
        id: "review-sheet-aps-04",
        sheetId: "sheet-aps-04",
        dueAt: new Date(today.getTime() - 2 * DAY).toISOString(),
        intervalDays: 4,
        lastReviewedAt: iso(6),
        source: "confidence",
        createdAt: iso(6),
        updatedAt: iso(6),
        deleted: false
      }
    },
    recall: {},
    userCards: {},
    plan: {
      id: "plan",
      examDate: "2027-02-15",
      minutesPerDay: 45,
      daysPerWeek: 6,
      createdAt: iso(20),
      updatedAt: iso(2),
      deleted: false
    },
    weekly: {},
    factsKnown: {}
  };
}

const inspect = () => `(() => {
  const mount = document.querySelector('[data-module-mount="today-route"]');
  const block = mount && mount.querySelector('.plan-today');
  const items = block ? Array.from(block.querySelectorAll('.plan-item')).map((li) => ({
    type: li.dataset.type,
    title: li.querySelector('.plan-item-title')?.innerText,
    kind: li.querySelector('.plan-item-kind')?.innerText,
    reason: li.querySelector('.plan-item-reason')?.innerText,
    href: li.querySelector('.plan-item-link')?.getAttribute('href') || null,
    label: li.querySelector('.plan-item-link')?.getAttribute('aria-label') || null
  })) : [];
  const rect = block ? block.getBoundingClientRect() : null;
  const links = block ? Array.from(block.querySelectorAll('a, button')).map((el) => {
    const r = el.getBoundingClientRect();
    return { text: (el.innerText || el.textContent || '').trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height), href: el.getAttribute('href'), action: el.getAttribute('data-action') };
  }) : [];
  return {
    mount: !!mount,
    state: block ? block.dataset.planState : null,
    h2: block ? block.querySelector('h2')?.innerText : null,
    lede: block ? block.querySelector('.plan-today-lede')?.innerText : null,
    plan: block ? block.querySelector('.plan-today-plan')?.innerText : null,
    meter: block ? block.querySelector('.plan-today-meter')?.innerText : null,
    items,
    support: block ? block.querySelector('.plan-today-support')?.innerText : null,
    formula: block ? block.querySelector('.plan-today-formula')?.innerText : null,
    links,
    pointerCoarse: matchMedia('(pointer: coarse)').matches,
    rect: rect ? { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) } : null,
    docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    sectionOverflow: block ? block.scrollWidth - block.clientWidth : null
  };
})()`;

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot(file);
  return file;
}

try {
  await server.start();
  await chrome.start();
  const conn = await chrome.newTarget("about:blank");
  const page = new Page(conn, { browser: chrome, port: 9395 });
  await page.init();

  /* Semilla: el estado v2 se escribe antes de recargar. */
  await page.viewport(1440, 900);
  await page.goto(`${server.baseURL}/study-dashboard/index.html`, { settle: 1200 });
  await page.eval(`localStorage.setItem('study-state-v1', ${JSON.stringify(JSON.stringify(seededState()))}); localStorage.setItem('study-theme', 'dark'); 'ok'`);
  await page.goto(`${server.baseURL}/study-dashboard/index.html`, { settle: 1500 });

  const wide = await page.eval(inspect());
  console.log("== 1440 oscuro ==");
  console.log(JSON.stringify(wide, null, 2));
  console.log("captura", await shot(page, "panel-1440-oscuro"));

  await page.pressKey("Tab");
  await sleep(150);
  const focusStyle = await page.eval(`(() => {
    const link = document.querySelector('.plan-item-link');
    if (!link) return null;
    link.focus();
    const s = getComputedStyle(link);
    return { outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, outlineColor: s.outlineColor, active: document.activeElement === link };
  })()`);
  console.log("== foco visible ==");
  console.log(JSON.stringify(focusStyle, null, 2));

  /* Ciclo de rutas: el bloque desaparece al salir y vuelve al entrar. */
  await page.eval(`location.hash = '#/biblioteca'; 'ok'`);
  await sleep(800);
  const library = await page.eval(`({
    hash: location.hash,
    mount: !!document.querySelector('[data-module-mount="today-route"]'),
    blocks: document.querySelectorAll('.plan-today').length
  })`);
  console.log("== limpieza fuera de home ==");
  console.log(JSON.stringify(library, null, 2));

  await page.eval(`location.hash = '#/'; 'ok'`);
  await sleep(900);
  const backHome = await page.eval(inspect());
  const backSummary = await page.eval(`(() => ({
    blocks: document.querySelectorAll('.plan-today').length,
    mounts: document.querySelectorAll('[data-module-mount="today-route"]').length,
    state: document.querySelector('.plan-today')?.dataset.planState
  }))()`);
  console.log("== vuelta a home ==");
  console.log(JSON.stringify({ state: backHome.state, items: backHome.items.length, ...backSummary }, null, 2));

  /* Un cambio de store (objetivo diario) re-renderiza el bloque sin duplicarlo. */
  await page.eval(`window.StudyStore.setDailyGoal(3); 'ok'`);
  await sleep(700);
  const afterGoal = await page.eval(`({
    blocks: document.querySelectorAll('.plan-today').length,
    mounts: document.querySelectorAll('[data-module-mount="today-route"]').length,
    state: document.querySelector('.plan-today')?.dataset.planState,
    goal: window.StudyStore.getDashboardStats().goal,
    api: typeof window.StudyPlanToday?.build
  })`);
  console.log("== cambio de store ==");
  console.log(JSON.stringify(afterGoal, null, 2));

  await page.viewport(390, 844, { mobile: true });
  await page.conn.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await sleep(500);
  const phone = await page.eval(inspect());
  console.log("== 390 oscuro (puntero grueso) ==");
  console.log(JSON.stringify({
    state: phone.state,
    h2: phone.h2,
    items: phone.items.length,
    pointerCoarse: phone.pointerCoarse,
    docOverflow: phone.docOverflow,
    sectionOverflow: phone.sectionOverflow,
    minLinkHeight: Math.min(...phone.links.map((link) => link.h)),
    links: phone.links
  }, null, 2));
  console.log("captura", await shot(page, "panel-390-oscuro"));

  await page.viewport(360, 640, { mobile: true });
  await sleep(350);
  const small = await page.eval(inspect());
  console.log("== 360 oscuro (puntero grueso) ==");
  console.log(JSON.stringify({
    state: small.state,
    docOverflow: small.docOverflow,
    sectionOverflow: small.sectionOverflow,
    minLinkHeight: Math.min(...small.links.map((link) => link.h)),
    rect: small.rect
  }, null, 2));
  console.log("captura", await shot(page, "panel-360-oscuro"));

  await page.viewport(390, 844, { mobile: true });
  await sleep(300);
  await page.eval(`localStorage.setItem('study-theme','light'); document.documentElement.dataset.theme='light'; 'ok'`);
  await sleep(400);
  const light = await page.eval(inspect());
  console.log("== 390 claro ==");
  console.log(JSON.stringify({ state: light.state, docOverflow: light.docOverflow, sectionOverflow: light.sectionOverflow }, null, 2));
  console.log("captura", await shot(page, "panel-390-claro"));

  await page.conn.send("Emulation.setTouchEmulationEnabled", { enabled: false });
  await page.viewport(768, 1024);
  await sleep(300);
  const tablet = await page.eval(inspect());
  console.log("== 768 claro ==");
  console.log(JSON.stringify({ state: tablet.state, docOverflow: tablet.docOverflow, sectionOverflow: tablet.sectionOverflow, rect: tablet.rect }, null, 2));
  console.log("captura", await shot(page, "panel-768-claro"));

  await page.viewport(1024, 768);
  await sleep(300);
  const laptop = await page.eval(inspect());
  console.log("== 1024 claro ==");
  console.log(JSON.stringify({ state: laptop.state, docOverflow: laptop.docOverflow, sectionOverflow: laptop.sectionOverflow, rect: laptop.rect }, null, 2));
  console.log("captura", await shot(page, "panel-1024-claro"));

  /* Estado vacío: se reescribe con un resetAt nuevo para descartar el estado
     anterior de IndexedDB (el store elige el reset más reciente). */
  const freshState = seededState();
  const stamp = new Date().toISOString();
  freshState.sheets = {};
  freshState.cards = {};
  freshState.doubts = {};
  freshState.sheetReview = {};
  freshState.annotations = {};
  freshState.sheetConfidence = {};
  freshState.plan = null;
  freshState.activity = {};
  freshState.last = {};
  freshState.resetAt = stamp;
  freshState.updatedAt = stamp;
  await page.eval(`localStorage.setItem('study-state-v1', ${JSON.stringify(JSON.stringify(freshState))}); 'ok'`);
  await page.goto(`${server.baseURL}/study-dashboard/index.html`, { settle: 1500 });
  await page.viewport(1440, 900);
  await sleep(400);
  const fresh = await page.eval(inspect());
  console.log("== estado nuevo (sin actividad) ==");
  console.log(JSON.stringify({ state: fresh.state, h2: fresh.h2, items: fresh.items, support: fresh.support }, null, 2));
  console.log("captura", await shot(page, "panel-1440-sin-actividad"));

  /* Estado al día: mismo estado semilla, pero todo completado y sin señales. */
  const doneState = seededState();
  const content = await page.eval(`window.STUDY_CONTENT.sheets.map((s) => s.id)`);
  const sheets = {};
  content.forEach((id) => {
    sheets[id] = { views: 1, viewedAt: iso(3), completedAt: iso(1), scroll: 1, favorite: false };
  });
  const stamp2 = new Date().toISOString();
  doneState.sheets = sheets;
  doneState.cards = {};
  doneState.doubts = {};
  doneState.sheetReview = {};
  doneState.plan = null;
  doneState.resetAt = stamp2;
  doneState.updatedAt = stamp2;
  await page.eval(`localStorage.setItem('study-state-v1', ${JSON.stringify(JSON.stringify(doneState))}); 'ok'`);
  await page.goto(`${server.baseURL}/study-dashboard/index.html`, { settle: 1500 });
  await sleep(400);
  const alDia = await page.eval(inspect());
  console.log("== estado al día ==");
  console.log(JSON.stringify({ state: alDia.state, h2: alDia.h2, items: alDia.items.length, plan: alDia.plan, support: alDia.support }, null, 2));
  console.log("captura", await shot(page, "panel-1440-al-dia"));

  const errors = await page.errorsSummary();
  console.log("== errores de consola ==");
  console.log(JSON.stringify(errors, null, 2));

  await page.close();
} finally {
  await chrome.stop();
  await server.stop();
}
