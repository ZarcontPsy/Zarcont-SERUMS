/* Smoke de navegador para #/ruta (Fase 2).
   Uso manual (no forma parte de la suite unitaria):
     & 'C:\Users\USARIO\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe' study-dashboard/tests/unit/plan/ruta-smoke.mjs

   Por qué inyecta los scripts: index.html todavía no carga plan.runtime.js,
   js/plan/plan.ruta.js ni css/plan-ruta.css (los añade el Coordinador). El
   smoke los inyecta como haría la página, prueba la ruta real y deja constancia
   de lo que falta cablear. Requiere Chrome y Python del arnés de tests/e2e.
   Capturas en %TEMP%\plan-ruta-smoke\*.png y resumen en consola.

   © 2026 ZARCONT */
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { StaticServer } from "../../../../tests/e2e/lib/server.mjs";
import { Chrome, Page, sleep } from "../../../../tests/e2e/lib/cdp.mjs";

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");
const OUT = path.join(os.tmpdir(), "plan-ruta-smoke");
await fs.mkdir(OUT, { recursive: true });

const server = new StaticServer({ root: ROOT, port: 8797, python: "C:\\Python313\\python.exe" });
const chrome = new Chrome({
  chromePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  userDataDir: path.join(await mkdtemp(path.join(os.tmpdir(), "qa-ruta-")), "p"),
  port: 9397
});

const NOW = "2026-11-10T08:00:00-05:00";
const DAY = 86400000;
const today = new Date(NOW);
const iso = (daysAgo, hour = 10) => new Date(today.getTime() - daysAgo * DAY).toISOString();
const local = (daysAgo) => new Date(today.getTime() - daysAgo * DAY).toISOString().slice(0, 10);

function seededState() {
  const ids = ["sheet-aps-01", "sheet-aps-02", "sheet-aps-03", "sheet-aps-04", "sheet-aps-05", "sheet-aps-06", "sheet-aps-07", "sheet-aps-08", "sheet-aps-09", "sheet-aps-10"];
  const sheets = {};
  ids.forEach((id, index) => {
    sheets[id] = { views: 2, viewedAt: iso(index + 1), readSeconds: 240, scroll: 0.4, favorite: false };
    if (index < 6) sheets[id].completedAt = iso(index);
  });
  const cards = {};
  for (let i = 1; i <= 8; i += 1) {
    cards[`card-seed-${i}`] = { box: 1, reviews: 1, lapses: 0, lastResult: "good", lastReviewAt: iso(3), dueAt: iso(1) };
  }
  return {
    version: 2,
    schemaVersion: 2,
    createdAt: iso(30),
    updatedAt: iso(0),
    resetAt: null,
    sheets,
    cards,
    sessions: [],
    activity: {
      [local(1)]: { sheetViews: 3, sheetCompletions: 2, cardReviews: 8, correct: 6, wrong: 2, seconds: 900 },
      [local(2)]: { sheetViews: 2, sheetCompletions: 2, cardReviews: 4, correct: 4, wrong: 0, seconds: 600 }
    },
    goals: { dailySheets: 2 },
    history: [],
    last: { dashboard: { sheetId: "sheet-aps-08", title: "Último punto leído", context: "Tema de prueba", at: iso(1), url: "" } },
    flashSession: null,
    annotations: {},
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
      "sheet-aps-01": { id: "sheet-aps-01", sheetId: "sheet-aps-01", value: "partial", createdAt: iso(5), updatedAt: iso(5), deleted: false }
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
      areaPriority: {},
      createdAt: iso(20),
      updatedAt: iso(2),
      deleted: false
    },
    weekly: {},
    factsKnown: {}
  };
}

const INSPECT = `(() => {
  const section = document.querySelector('section[data-plan-view="ruta"]');
  if (!section) return { mounted: false };
  const status = section.querySelector('[data-plan-route-status]');
  const items = Array.from(section.querySelectorAll('.plan-route-item')).map((li) => ({
    type: li.dataset.type,
    sheet: li.dataset.sheetId || null,
    title: li.querySelector('.plan-item-title')?.innerText || null,
    kind: li.querySelector('.plan-item-kind')?.innerText || null,
    reason: li.querySelector('.plan-item-reason')?.innerText || null,
    href: li.querySelector('.plan-item-link')?.getAttribute('href') || null,
    label: li.querySelector('.plan-item-link')?.getAttribute('aria-label') || null
  }));
  const weekly = section.querySelector('[data-plan-weekly]');
  const session = section.querySelector('.plan-ruta-session');
  const links = Array.from(section.querySelectorAll('a, button')).map((el) => {
    const r = el.getBoundingClientRect();
    return { text: (el.innerText || '').trim().slice(0, 36), href: el.getAttribute('href'), w: Math.round(r.width), h: Math.round(r.height) };
  });
  return {
    mounted: true,
    h1: section.querySelector('h1')?.innerText || null,
    h1Count: section.querySelectorAll('h1').length,
    statusText: status?.innerText || null,
    statusAttr: status?.dataset.status || null,
    balance: status?.dataset.balance || null,
    summary: section.querySelector('[data-plan-summary]')?.innerText.slice(0, 220) || null,
    session: session?.innerText || null,
    items,
    weekly: weekly ? {
      status: weekly.dataset.weeklyStatus,
      text: weekly.innerText.slice(0, 420)
    } : null,
    planLink: !!section.querySelector('[data-plan-link="plan"]'),
    signals: !!section.querySelector('[data-plan-signals]'),
    loading: !!section.querySelector('[data-plan-loading]'),
    error: section.querySelector('[data-plan-error]')?.hidden === false,
    links,
    pointerCoarse: matchMedia('(pointer: coarse)').matches,
    docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    sectionOverflow: section.scrollWidth - section.clientWidth
  };
})()`;

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot(file, { fullPage: true });
  return file;
}

async function inject(page) {
  return page.eval(`(async () => {
    const files = [
      { type: "css", src: "css/plan-ruta.css?v=smoke" },
      { type: "js", src: "js/plan/plan.runtime.js?v=smoke" },
      { type: "js", src: "js/plan/plan.ruta.js?v=smoke" }
    ];
    for (const f of files) {
      await new Promise((resolve, reject) => {
        if (f.type === "css") {
          const link = document.createElement("link");
          link.rel = "stylesheet"; link.href = f.src;
          link.onload = resolve; link.onerror = () => reject(new Error("css " + f.src));
          document.head.appendChild(link);
        } else {
          const s = document.createElement("script");
          s.src = f.src; s.async = false;
          s.onload = resolve; s.onerror = () => reject(new Error("js " + f.src));
          document.head.appendChild(s);
        }
      });
    }
    return {
      runtime: typeof window.StudyPlanRuntime,
      view: typeof window.StudyPlanRuta,
      registered: !!(window.StudyPlanRuta && window.StudyPlanRuta.__registered)
    };
  })()`);
}

const modelRequests = () => `performance.getEntriesByType("resource").filter((r) => /plan-model\\.js/.test(r.name)).length`;

try {
  await server.start();
  await chrome.start();
  const conn = await chrome.newTarget("about:blank");
  const page = new Page(conn, { browser: chrome, port: 9397 });
  await page.init();

  await page.viewport(1440, 900);
  await page.goto(`${server.baseURL}/study-dashboard/index.html`, { settle: 1200 });
  await page.eval(`localStorage.setItem('study-state-v1', ${JSON.stringify(JSON.stringify(seededState()))}); localStorage.setItem('study-theme', 'dark'); 'ok'`);
  await page.goto(`${server.baseURL}/study-dashboard/index.html`, { settle: 1500 });

  /* 1. Carga bajo demanda: antes de #/ruta no hay petición del modelo. */
  const injected = await inject(page);
  console.log("== inyección (equivale a lo que falta en index.html) ==");
  console.log(JSON.stringify(injected, null, 2));
  const beforeRoute = await page.eval(modelRequests());
  console.log("plan-model.js pedido antes de #/ruta:", beforeRoute);
  console.log("ruta registrada:", await page.eval(`!!(window.StudyApp && window.StudyApp.getRoute)`));

  /* 2. #/ruta con plan guardado. */
  await page.eval(`location.hash = '#/ruta'; 'ok'`);
  await page.waitFor(`!!document.querySelector('[data-plan-view="ruta"] [data-plan-route-status]')`, { timeout: 15000, message: "ruta" });
  await sleep(700);
  const view = await page.eval(INSPECT);
  console.log("== #/ruta con plan ==");
  console.log(JSON.stringify(view, null, 2));
  console.log("plan-model.js pedido tras abrir #/ruta:", await page.eval(modelRequests()));
  console.log("semanas guardadas:", await page.eval(`window.StudyStore.weekly.list().length`));
  console.log("captura", await shot(page, "ruta-1440-oscuro"));

  /* 3. Clic en «Repaso» desde la ruta (data-nav interno). */
  await page.eval(`document.querySelector('[data-plan-view="ruta"] [data-plan-link="repaso"]').click(); 'ok'`);
  await sleep(500);
  console.log("== clic en Repaso ==", await page.eval(`({ hash: location.hash, ruta: !!document.querySelector('[data-plan-view="ruta"]') })`));

  /* 4. Volver a #/ruta: no se duplica la semana. */
  await page.eval(`location.hash = '#/ruta'; 'ok'`);
  await page.waitFor(`!!document.querySelector('[data-plan-view="ruta"] [data-plan-route-status]')`, { timeout: 15000 });
  await sleep(500);
  console.log("== vuelta a #/ruta ==", await page.eval(`({
    semanas: window.StudyStore.weekly.list().length,
    items: document.querySelectorAll('.plan-route-item').length,
    loading: !!document.querySelector('[data-plan-loading]'),
    estado: document.querySelector('[data-plan-route-status]')?.dataset.status
  })`));

  /* 5. plan:changed: nuevo ritmo y el 30 % de presupuesto. */
  await page.eval(`window.StudyStore.plan.save({ examDate: '2027-03-31', minutesPerDay: 30, daysPerWeek: 5, areaPriority: { 'area-psi-cuidado-integral': 1.5 } }); 'ok'`);
  await sleep(900);
  console.log("== tras plan:changed ==", await page.eval(`({
    estado: document.querySelector('[data-plan-route-status]')?.dataset.status,
    balance: document.querySelector('[data-plan-route-status]')?.dataset.balance,
    ritmo: document.querySelector('[data-plan-summary]')?.innerText.match(/\\d+ min[^\\n]*/)?.[0] || null,
    semanas: window.StudyStore.weekly.list().length,
    items: document.querySelectorAll('.plan-route-item').length
  })`));
  console.log("captura", await shot(page, "ruta-1440-plan-cambiado"));

  /* 6. Sin plan: señales abiertas y CTA. */
  await page.eval(`window.StudyStore.plan.remove(); 'ok'`);
  await sleep(900);
  const noPlan = await page.eval(INSPECT);
  console.log("== sin plan ==");
  console.log(JSON.stringify({
    statusAttr: noPlan.statusAttr,
    balance: noPlan.balance,
    items: noPlan.items.length,
    signals: noPlan.signals,
    planLink: noPlan.planLink,
    weekly: noPlan.weekly && noPlan.weekly.status,
    session: noPlan.session
  }, null, 2));
  console.log("captura", await shot(page, "ruta-1440-sin-plan"));

  /* 7. Vuelta al plan y a #/: el unmount retira la vista. */
  await page.eval(`window.StudyStore.plan.save({ examDate: '2027-02-15', minutesPerDay: 45, daysPerWeek: 6 }); location.hash = '#/'; 'ok'`);
  await sleep(900);
  console.log("== fuera de #/ruta ==", await page.eval(`({
    ruta: !!document.querySelector('[data-plan-view="ruta"]'),
    home: !!document.querySelector('section') && !document.querySelector('[data-plan-view]'),
    semanas: window.StudyStore.weekly.list().length
  })`));

  /* 8. Móvil 390 y 360 (puntero grueso), tema claro. */
  await page.eval(`location.hash = '#/ruta'; 'ok'`);
  await page.waitFor(`!!document.querySelector('[data-plan-view="ruta"] [data-plan-route-status]')`, { timeout: 15000 });
  await page.viewport(390, 844, { mobile: true });
  await page.conn.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await sleep(600);
  let phone = await page.eval(INSPECT);
  console.log("== 390 oscuro ==", JSON.stringify({
    statusAttr: phone.statusAttr,
    docOverflow: phone.docOverflow,
    sectionOverflow: phone.sectionOverflow,
    pointerCoarse: phone.pointerCoarse,
    minTarget: Math.min(...phone.links.map((link) => link.h)),
    items: phone.items.length
  }, null, 2));
  console.log("captura", await shot(page, "ruta-390-oscuro"));

  await page.viewport(360, 640, { mobile: true });
  await sleep(500);
  const small = await page.eval(INSPECT);
  console.log("== 360 oscuro ==", JSON.stringify({
    docOverflow: small.docOverflow,
    sectionOverflow: small.sectionOverflow,
    minTarget: Math.min(...small.links.map((link) => link.h))
  }, null, 2));
  console.log("captura", await shot(page, "ruta-360-oscuro"));

  await page.viewport(390, 844, { mobile: true });
  await page.eval(`localStorage.setItem('study-theme','light'); document.documentElement.dataset.theme='light'; 'ok'`);
  await sleep(500);
  const light = await page.eval(INSPECT);
  console.log("== 390 claro ==", JSON.stringify({ docOverflow: light.docOverflow, sectionOverflow: light.sectionOverflow }, null, 2));
  console.log("captura", await shot(page, "ruta-390-claro"));

  await page.conn.send("Emulation.setTouchEmulationEnabled", { enabled: false });
  await page.viewport(1440, 900);
  await sleep(400);
  console.log("== 1440 claro ==");
  console.log("captura", await shot(page, "ruta-1440-claro"));

  /* 9. Foco visible con teclado y estructura de encabezados. */
  await page.eval(`document.querySelector('[data-plan-view="ruta"] [data-plan-link="plan"]').blur(); 'ok'`);
  for (let i = 0; i < 3; i += 1) {
    await page.pressKey("Tab", { code: "Tab", keyCode: 9 });
    await sleep(120);
  }
  const a11y = await page.eval(`(() => {
    const section = document.querySelector('[data-plan-view="ruta"]');
    const h1 = section.querySelector('h1');
    const active = document.activeElement;
    const style = active ? getComputedStyle(active) : null;
    return {
      labelledBy: section.getAttribute('aria-labelledby') === h1.id,
      h1: h1.innerText,
      focusVisible: active ? active.matches(':focus-visible') : false,
      focusTag: active ? active.tagName + ':' + (active.innerText || '').trim().slice(0, 24) : null,
      focusOutline: style ? style.outlineStyle + ' ' + style.outlineWidth : null,
      headings: Array.from(section.querySelectorAll('h1,h2')).map((h) => h.tagName + ':' + h.innerText.slice(0, 28))
    };
  })()`);
  console.log("== accesibilidad ==");
  console.log(JSON.stringify(a11y, null, 2));

  const errors = await page.errorsSummary();
  console.log("== errores de consola ==");
  console.log(JSON.stringify(errors, null, 2));

  await page.close();
} finally {
  await chrome.stop();
  await server.stop();
}
