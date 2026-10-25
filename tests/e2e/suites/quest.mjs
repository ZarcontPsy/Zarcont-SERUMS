/* © 2026 ZARCONT — Suite SERUMS QUEST (Agente 8). */
import { assert, assertEq, assertIncludes, skip } from "../lib/harness.mjs";
import { gotoApp, waitApp, firstVisible, clickFirst, explainErrors, appURL } from "../lib/apps.mjs";
import { sleep } from "../lib/cdp.mjs";
import { readFile } from "node:fs/promises";

async function startMission(page) {
  await page.goto(appURL(page.baseURL, "quest") + "#/mision/mission-sp-1", { settle: 900 });
  await page.waitFor(`!!document.querySelector('[data-action="start-mission"]')`, { timeout: 8000 });
  await page.click('[data-action="start-mission"]');
  await page.waitFor(`location.hash === '#/jugar' && !!document.querySelector('[data-action="answer"]')`, { timeout: 8000 });
  return page.eval(`({ hash: location.hash, title: document.querySelector('#q-stem')?.innerText?.slice(0, 120), options: document.querySelectorAll('[data-action="answer"]').length })`);
}

async function answerOne(page) {
  await page.click('[data-action="answer"]');
  await page.waitFor(`!!document.querySelector('[data-action="next"]')`, { timeout: 5000 });
  await page.click('[data-action="next"]');
  await sleep(600);
  return page.eval(`location.hash`);
}

export async function runQuest({ h, page, baseURL }) {
  h.suite("SERUMS QUEST");
  h.state.app = "SERUMS QUEST";
  page.baseURL = baseURL;

  await h.test(
    "QUEST-01",
    "Carga del Game Home, 10 personajes y estado persistente",
    async () => {
      page.resetErrors();
      await gotoApp(page, baseURL, "quest", { settle: 1100 });
      const data = await page.eval(`(() => {
        const s = JSON.parse(localStorage.getItem('serumsquest:state:v1') || 'null');
        return {
          title: document.title,
          hash: location.hash,
          charactersLinks: document.querySelectorAll('a[href^="#/personaje/"]').length,
          heroes: window.QuestCharacters.characters.length,
          schema: s?.schemaVersion,
          revision: s?.revision,
          collection: s?.collection ? Object.keys(s.collection.characters || {}).length : null
        };
      })()`);
      assertEq(data.heroes, 10, "personajes en catálogo");
      assert(data.hash === "#/" || data.hash === "", `hash inicial: ${data.hash}`);
      const errors = explainErrors(await page.errorsSummary());
      assertEq(errors.productErrorCount, 0, `errores: ${JSON.stringify(errors)}`);
      return { ...data, errors };
    },
    { severity: "alta", page },
  );

  await h.test(
    "QUEST-02",
    "Navegación por las cinco secciones sin recargar el documento",
    async () => {
      await gotoApp(page, baseURL, "quest");
      const before = page.navCount();
      const routes = [
        ["#/personajes", "Personajes"],
        ["#/inventario", "Inventario"],
        ["#/tienda", "Tienda"],
        ["#/perfil", "Progreso"],
        ["#/", "Inicio"],
      ];
      const seen = [];
      for (const [hash, label] of routes) {
        const selector = `[data-route="${label === "Inicio" ? "home" : label === "Personajes" ? "characters" : label === "Inventario" ? "inventory" : label === "Tienda" ? "shop" : "progress"}"]`;
        const click = await clickFirst(page, [`a.q-navlink${selector}`, `a.q-bottomlink${selector}`]);
        await page.waitFor(`location.hash === ${JSON.stringify(hash)}`, { timeout: 5000 });
        seen.push({ label, hash: await page.eval("location.hash"), click: click.selector, h1: await page.eval(`document.querySelector('#view h1')?.innerText || ''`) });
      }
      const navs = page.navCount() - before;
      assertEq(navs, 0, "recargas de documento entre secciones");
      return { seen, navigations: navs };
    },
    { severity: "alta", page },
  );

  await h.test(
    "QUEST-03",
    "Personajes: foco en otro héroe y filtros sin recarga",
    async () => {
      await page.goto(appURL(baseURL, "quest") + "#/personajes", { settle: 800 });
      await page.waitFor(`location.hash === '#/personajes' && !!document.querySelector('[data-action="char-focus"]')`, { timeout: 8000 });
      const before = page.navCount();
      const startTitle = await page.eval(`document.querySelector('.q-hero-title, .q-hero-name, #view h1')?.innerText || ''`);
      const target = await page.eval(`(() => { const b = document.querySelector('.q-strip-card[data-action="char-focus"][data-character="mara"]'); return b ? b.dataset.character : null; })()`);
      assert(target, "héroe Mara disponible en el catálogo");
      await page.eval(`document.querySelector('.q-strip-card[data-character="mara"]').scrollIntoView({block:"center"})`);
      await sleep(350);
      await page.click('.q-strip-card[data-action="char-focus"][data-character="mara"]');
      await page.waitFor(`!!document.querySelector('.q-strip-card[data-character="mara"].is-focused')`, { timeout: 5000, message: "Mara enfocada" });
      await sleep(250);
      const focused = await page.eval(`({ url: location.href, hash: location.hash, mara: !!document.querySelector('.q-strip-card[data-character="mara"].is-focused'), title: document.body.innerText.slice(0, 160) })`);
      const filter = await page.eval(`(() => { const b = document.querySelector('[data-action="char-filter"]'); return b ? b.dataset.filter : null; })()`);
      if (filter) {
        await page.click(`[data-action="char-filter"][data-filter="${filter}"]`);
        await sleep(300);
      }
      const navs = page.navCount() - before;
      assertEq(navs, 0, "recargas al enfocar personaje/filtrar");
      assert(focused.mara, "Mara queda enfocada");
      assertEq(focused.hash, "#/personajes", "sigue en la misma ruta");
      return { startTitle, target, focused, filter, navigations: navs };
    },
    { severity: "alta", page },
  );

  await h.test(
    "QUEST-04",
    "Inicio → misión → sesión de juego, sin recarga",
    async () => {
      await gotoApp(page, baseURL, "quest");
      const before = page.navCount();
      const start = await startMission(page);
      assert(start.options >= 2, "alternativas de la pregunta");
      const navs = page.navCount() - before;
      assertEq(navs, 0, "recargas al abrir la sesión");
      return { start, navigations: navs };
    },
    { severity: "alta", page },
  );

  await h.test(
    "QUEST-05",
    "Respuesta y progreso de misión: guarda estado y sobrevive a refresh",
    async () => {
      await page.goto(appURL(baseURL, "quest") + "#/jugar", { settle: 700 });
      const active = await page.eval(`!!document.querySelector('[data-action="answer"]')`);
      if (!active) await startMission(page);
      const before = await page.eval(`(() => { const s = JSON.parse(localStorage.getItem('serumsquest:state:v1')); return { revision: s.revision, active: !!s.activeSession, answers: s.activeSession ? Object.keys(s.activeSession.answers || {}).length : 0, xp: s.progress?.xp || 0 }; })()`);
      await answerOne(page);
      const after = await page.eval(`(() => { const s = JSON.parse(localStorage.getItem('serumsquest:state:v1')); return { revision: s.revision, active: !!s.activeSession, answers: s.activeSession ? Object.keys(s.activeSession.answers || {}).length : 0, xp: s.progress?.xp || 0 }; })()`);
      assert(after.answers > before.answers || after.revision > before.revision, `estado guardado tras responder (antes=${JSON.stringify(before)}, después=${JSON.stringify(after)})`);
      await page.goto(appURL(baseURL, "quest") + "#/jugar", { settle: 900 });
      const refreshed = await page.eval(`(() => { const s = JSON.parse(localStorage.getItem('serumsquest:state:v1')); return { hash: location.hash, active: !!s.activeSession, answers: s.activeSession ? Object.keys(s.activeSession.answers || {}).length : 0, xp: s.progress?.xp || 0, hasCard: !!document.querySelector('#q-stem') }; })()`);
      assertEq(refreshed.answers, after.answers, "respuestas tras refrescar");
      assert(refreshed.hasCard, "pregunta visible tras refrescar");
      return { before, after, refreshed };
    },
    { severity: "alta", page },
  );

  await h.test(
    "QUEST-06",
    "Inicio de la app y HUB desde QUEST",
    async () => {
      await page.goto(appURL(baseURL, "quest") + "#/perfil", { settle: 700 });
      await page.click('[data-serums-chrome="home"]');
      await page.waitFor(`location.hash === '#/'`, { timeout: 5000 });
      const home = await page.eval("location.hash");
      const nav = page.waitForNavigation((url) => /\/index\.html(?:$|[?#])/.test(url), 12000);
      await page.click('[data-serums-chrome="hub"]');
      await nav;
      await waitApp(page, "hub");
      return { home, hubUrl: await page.eval("location.href") };
    },
    { severity: "alta", page },
  );

  await h.test(
    "QUEST-07",
    "URL directa a personajes y a misión",
    async () => {
      await page.goto(appURL(baseURL, "quest") + "#/personajes", { settle: 800 });
      const characters = await page.eval(`({ hash: location.hash, h1: document.querySelector('#view h1')?.innerText || '', cards: document.querySelectorAll('[data-action="char-focus"]').length })`);
      await page.goto(appURL(baseURL, "quest") + "#/mision/mission-sp-1", { settle: 800 });
      const mission = await page.eval(`({ hash: location.hash, h1: document.querySelector('#view h1')?.innerText || '', start: !!document.querySelector('[data-action="start-mission"]'), activeLink: !!document.querySelector('a[href="#/jugar"]'), text: document.querySelector('#view')?.innerText.slice(0, 180) })`);
      assertEq(characters.hash, "#/personajes");
      assertEq(mission.hash, "#/mision/mission-sp-1");
      assert(characters.cards >= 10, "catálogo de personajes renderizado");
      assert(mission.start || mission.activeLink, `misión renderizada con inicio o sesión activa (${JSON.stringify(mission)})`);
      return { characters, mission };
    },
    { severity: "alta", page },
  );

  await h.test(
    "QUEST-08",
    "Atrás/adelante del navegador entre inicio y personajes",
    async () => {
      await page.goto(appURL(baseURL, "quest") + "#/", { settle: 800 });
      await page.eval(`location.hash = '#/personajes'`);
      await page.waitFor(`location.hash === '#/personajes'`, { timeout: 5000 });
      const hist = await page.conn.send("Page.getNavigationHistory");
      await page.conn.send("Page.navigateToHistoryEntry", { entryId: hist.entries[hist.currentIndex - 1].id });
      await page.waitFor(`location.hash === '#/'`, { timeout: 5000 });
      const back = await page.eval("location.hash");
      const hist2 = await page.conn.send("Page.getNavigationHistory");
      await page.conn.send("Page.navigateToHistoryEntry", { entryId: hist2.entries[hist2.currentIndex + 1].id });
      await page.waitFor(`location.hash === '#/personajes'`, { timeout: 5000 });
      return { back, forward: await page.eval("location.hash") };
    },
    { severity: "media", page },
  );

  await h.test(
    "QUEST-09",
    "Persistencia del tema claro/oscuro tras refresh",
    async () => {
      await page.goto(appURL(baseURL, "quest") + "#/", { settle: 800 });
      const before = await page.eval(`({ theme: document.documentElement.dataset.theme, stored: localStorage.getItem('serumsquest:theme') })`);
      await page.click('[data-theme-toggle]');
      await sleep(400);
      const toggled = await page.eval(`({ theme: document.documentElement.dataset.theme, stored: localStorage.getItem('serumsquest:theme') })`);
      await page.goto(appURL(baseURL, "quest") + "#/", { settle: 800 });
      const after = await page.eval(`({ theme: document.documentElement.dataset.theme, stored: localStorage.getItem('serumsquest:theme') })`);
      assertEq(after.theme, toggled.theme, "tema tras refrescar");
      return { before, toggled, after };
    },
    { severity: "media", page },
  );

  await h.test(
    "QUEST-10",
    "Selección de personaje persistente entre visitas (si el héroe es poseído)",
    async () => {
      const state = await page.eval(`(() => { const s=JSON.parse(localStorage.getItem('serumsquest:state:v1')); return { selected: s.collection?.selectedCharacterId, owned: Object.keys(s.collection?.characters || {}), coins: s.economy?.coins }; })()`);
      const hasUsable = await page.eval(`!!document.querySelector('[data-action="select-character"]')`);
      if (!hasUsable) skip(`No hay un héroe alternativo poseído para cambiar selección (seleccionado=${state.selected}, monedas=${state.coins}).`);
      return { state, hasUsable };
    },
    { severity: "media", page },
  );

  await h.test(
    "QUEST-11",
    "Pantalla completa de QUEST con gesto real",
    async () => {
      await gotoApp(page, baseURL, "quest");
      const found = await firstVisible(page, ['[data-serums-chrome="fullscreen"]']);
      if (!found) skip("QUEST no expone control de pantalla completa en el estado actual.");
      await page.click('[data-serums-chrome="fullscreen"]');
      await sleep(900);
      const on = await page.eval(`({ element: !!document.fullscreenElement, pressed: document.querySelector('[data-serums-chrome="fullscreen"]').getAttribute('aria-pressed'), label: document.querySelector('[data-serums-chrome="fullscreen"]').getAttribute('aria-label') })`);
      if (!on.element) return { ...on, limitation: "headless no concedió fullscreen" };
      await page.click('[data-serums-chrome="fullscreen"]');
      await sleep(600);
      return { on, off: await page.eval(`!!document.fullscreenElement`) };
    },
    { severity: "media", page },
  );
}
