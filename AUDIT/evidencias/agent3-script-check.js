
/* © 2026 ZARCONT — SERUMS HUB · Identificador: ZARCONT-SRH-2.3.0 · Licencia propietaria (ver LICENSE) */
(function(){
  "use strict";

  /* ==================================================================
     CONFIGURACIÓN — rutas base de las aplicaciones.
     Cada tarjeta conserva su href real; si Study tiene un último punto,
     se reemplaza por el enlace de reanudación.
     ================================================================== */
  const CONFIG = {
    apps: {
      banqueo:   "./EXAMEN STUDIO/Examen Studio.html?v=2.1.5",
      plazas:    "./serums map/serums-map-explorer/index.html",
      dashboard: "./study-dashboard/index.html",
      flashcards:"./study-flashcards/index.html",
      quest:     "./serums-quest/index.html"
    },
    duracionTransicion: 650,
    abrirEnNuevaPestana: false,
    version: "2.3.0",
    build: "ZARCONT-SRH-2.3.0"
  };
  const SNAPSHOT_KEY = "studyhub:snapshot:v1";
  const QUEST_SNAPSHOT_KEY = "serumsquest:snapshot:v1";
  /* ================================================================== */

  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stage = document.getElementById("stage");
  const cards = Array.from(document.querySelectorAll(".app-card[data-app]"));
  const order = cards.map(function(c){ return c.getAttribute("data-app"); });
  const carousel = document.getElementById("carousel");
  const carouselBar = document.getElementById("carouselBar");
  const tbNow = document.getElementById("tbNow");
  const tbPos = document.getElementById("tbPos");
  const barThumb = document.getElementById("barThumb");
  const barTitle = document.getElementById("barTitle");
  const barSub = document.getElementById("barSub");
  const openCurrent = document.getElementById("openCurrent");
  const dots = document.getElementById("dots");
  const carouselLive = document.getElementById("carouselLive");
  const prevTop = document.getElementById("prevTop");
  const nextTop = document.getElementById("nextTop");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const btnFs = document.getElementById("btnFs");
  const btnHelp = document.getElementById("btnHelp");
  const helpModal = document.getElementById("helpModal");
  const helpScrim = document.getElementById("helpScrim");
  const helpClose = document.getElementById("helpClose");
  const btnAbout = document.getElementById("btnAbout");
  const aboutModal = document.getElementById("aboutModal");
  const aboutScrim = document.getElementById("aboutScrim");
  const aboutClose = document.getElementById("aboutClose");
  const overlay = document.getElementById("overlay");
  const overlayIcon = document.getElementById("overlayIcon");
  const overlayName = document.getElementById("overlayName");
  let activeIndex = 0;
  let suppressClick = false;
  let swipeStart = null;
  let launchTimer = 0;

  const ICONS = {
    banqueo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="2.5" width="8" height="4" rx="1.2"/><path d="M16 4.5h2a2 2 0 0 1 2 2V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2h2"/><path d="m9.5 13.5 1.8 1.8 3.7-3.8"/></svg>',
    plazas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/><path d="M8 7h8M8 11h6"/></svg>',
    flashcards: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7" width="14" height="14" rx="2"/><path d="M7 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2"/><path d="M7 12h6M7 16h4"/></svg>',
    quest: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V8l5-4 6 5 5-3v12l-5 3-6-5-5 4Z"/><path d="M9 4v12M15 9v12"/><circle cx="19" cy="4" r="2"/></svg>'
  };
  function icon(id){ return ICONS[id] || ""; }

  const APPS = {
    banqueo:   { name: "BANQUEO",          tagline: "Banco de exámenes",       color: "#E33A45", icon: icon("banqueo") },
    plazas:    { name: "PLAZAS SERUMS",    tagline: "Explorador territorial",  color: "#F08A5D", icon: icon("plazas") },
    dashboard: { name: "STUDY DASHBOARD",  tagline: "Lectura y progreso",      color: "#E2B15B", icon: icon("dashboard") },
    flashcards:{ name: "STUDY FLASHCARDS", tagline: "Recuperación activa",     color: "#8FD3B0", icon: icon("flashcards") },
    quest:     { name: "SERUMS QUEST",     tagline: "Aprendizaje gamificado",  color: "#7A9CFF", icon: icon("quest") }
  };

  /* ==================================================================
     Progreso real de Study (snapshot escrito por StudyStore)
     ================================================================== */
  function readSnapshot(){
    try {
      const raw = localStorage.getItem(SNAPSHOT_KEY);
      if (!raw) return null;
      const snap = JSON.parse(raw);
      return snap && typeof snap === "object" ? snap : null;
    } catch (err){ return null; }
  }

  function readQuestSnapshot(){
    try {
      const raw = localStorage.getItem(QUEST_SNAPSHOT_KEY);
      if (!raw) return null;
      const snap = JSON.parse(raw);
      return snap && typeof snap === "object" ? snap : null;
    } catch (err){ return null; }
  }

  function dashboardHref(snap){
    const last = snap && snap.dashboard ? snap.dashboard.last : null;
    if (last && last.sheetId){
      return "./study-dashboard/index.html?sheet=" + encodeURIComponent(last.sheetId);
    }
    return CONFIG.apps.dashboard;
  }
  function flashcardsHref(snap){
    const last = snap && snap.flashcards ? snap.flashcards.last : null;
    if (last && last.deckId){
      return "./study-flashcards/index.html?deck=" + encodeURIComponent(last.deckId) + "&resume=1";
    }
    return CONFIG.apps.flashcards;
  }

  function setProgress(kind, opts){
    const card = document.querySelector('[data-study-card="' + kind + '"]');
    if (!card) return;
    const box = card.querySelector('[data-progress="' + kind + '"]');
    const value = box.querySelector("[data-progress-value]");
    const bar = box.querySelector("[data-progress-bar]");
    const note = box.querySelector("[data-progress-note]");
    const last = card.querySelector('[data-last="' + kind + '"]');
    const lastText = last.querySelector("[data-last-text]");

    const has = opts && opts.has;
    const known = opts && opts.known;
    box.classList.toggle("is-empty", !has);
    value.textContent = known ? opts.value : "—";
    bar.style.width = known ? Math.max(0, Math.min(100, opts.percent)) + "%" : "0%";
    note.textContent = has ? opts.note : "Sin actividad registrada todavía";

    if (has && opts.lastTitle){
      last.hidden = false;
      lastText.textContent = opts.lastTitle;
      lastText.title = opts.lastTitle;
    } else {
      last.hidden = true;
      lastText.textContent = "";
      lastText.removeAttribute("title");
    }

    const link = card;
    link.setAttribute("href", opts.href || CONFIG.apps[kind]);
  }

  function activeId(){
    return order[activeIndex] || order[0] || "banqueo";
  }
  function syncBarSub(){
    if (!barSub) return;
    const id = activeId();
    let sub = APPS[id] ? APPS[id].tagline : "";
    if (id === "dashboard" || id === "flashcards" || id === "quest"){
      const box = document.querySelector('[data-study-card="' + id + '"] [data-progress="' + id + '"]');
      const note = box && box.querySelector("[data-progress-note]");
      if (box && !box.classList.contains("is-empty") && note && note.textContent) sub = note.textContent;
    }
    barSub.textContent = sub;
  }

  function applySnapshot(snap){
    const cardsById = {};
    cards.forEach(function(card){ cardsById[card.getAttribute("data-app")] = card; });
    const dashboardCard = cardsById.dashboard;
    const flashCard = cardsById.flashcards;
    if (dashboardCard) dashboardCard.setAttribute("href", dashboardHref(snap));
    if (flashCard) flashCard.setAttribute("href", flashcardsHref(snap));

    const d = snap && snap.dashboard ? snap.dashboard : null;
    if (d) {
      const has = !!(d.completedSheets || d.viewedSheets || d.startedTopics);
      const total = Number(d.totalSheets) || 0;
      const done = Number(d.completedSheets) || 0;
      const percent = total ? Math.round((done / total) * 100) : (Number(d.percent) || 0);
      const started = Number(d.startedTopics) || 0;
      setProgress("dashboard", {
        has: has,
        known: total > 0,
        value: total ? done + "/" + total : "—",
        percent: percent,
        note: has
          ? started + " tema" + (started === 1 ? "" : "s") + " iniciado" + (started === 1 ? "" : "s") + (Number(d.streak) ? " · " + d.streak + " día" + (Number(d.streak) === 1 ? "" : "s") + " de racha" : "")
          : "",
        lastTitle: d.last && d.last.title ? d.last.title : "",
        href: dashboardHref(snap)
      });
    }

    const f = snap && snap.flashcards ? snap.flashcards : null;
    if (f) {
      const has = !!(Number(f.reviewedCards) > 0 || Number(f.todayReviews) > 0);
      const total = Number(f.totalCards) || 0;
      const reviewed = Number(f.reviewedCards) || 0;
      const percent = total ? Math.round((reviewed / total) * 100) : 0;
      setProgress("flashcards", {
        has: has,
        known: total > 0,
        value: total ? reviewed + "/" + total : "—",
        percent: percent,
        note: has
          ? (Number(f.masteredCards) || 0) + " dominadas · " + (Number(f.dueCards) || 0) + " por repasar"
          : "",
        lastTitle: f.last && f.last.title ? f.last.title : "",
        href: flashcardsHref(snap)
      });
    }
    syncBarSub();
  }

  function applyQuestSnapshot(){
    const snap = readQuestSnapshot();
    if (!snap) {
      setProgress("quest", {
        has: false,
        known: false,
        value: "—",
        percent: 0,
        note: "Sin actividad registrada todavía",
        lastTitle: "",
        href: CONFIG.apps.quest
      });
      syncBarSub();
      return;
    }
    const has = !!snap.hasActivity;
    setProgress("quest", {
      has: has,
      known: true,
      value: "Nv " + (Number(snap.level) || 1),
      percent: Number(snap.levelPercent) || 0,
      note: has
        ? (snap.rank || "Bachiller") + " · " + (Number(snap.xp) || 0) + " XP · " + (Number(snap.answered) || 0) + " respuestas"
        : "Sin actividad registrada todavía",
      lastTitle: snap.lastSession && snap.lastSession.title ? snap.lastSession.title : "",
      href: CONFIG.apps.quest
    });
    syncBarSub();
  }

  function refreshStudyCards(){
    applySnapshot(readSnapshot());
    applyQuestSnapshot();
  }

  /* Relleno del panel «Acerca de» */
  document.getElementById("aboutVersion").textContent = "v" + CONFIG.version;
  document.getElementById("aboutBuild").textContent = CONFIG.build;

  /* ==================================================================
     Aparición y actualización
     ================================================================== */
  function start(){
    let done = false;
    function mark(){
      if (done) return;
      done = true;
      document.body.classList.add("ready");
    }
    requestAnimationFrame(function(){ requestAnimationFrame(mark); });
    window.setTimeout(mark, 350);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  refreshStudyCards();
  window.addEventListener("storage", function(e){
    if (e.key === SNAPSHOT_KEY || e.key === QUEST_SNAPSHOT_KEY) refreshStudyCards();
  });
  window.addEventListener("pageshow", refreshStudyCards);
  document.addEventListener("visibilitychange", function(){
    if (!document.hidden) refreshStudyCards();
  });

  /* ==================================================================
     Carrusel: selección, navegación y estado visual
     ================================================================== */
  function buildNav(){
    dots.innerHTML = cards.map(function(card, i){
      const app = APPS[order[i]];
      return '<button class="dot" type="button" data-index="' + i + '" aria-label="Ver ' + app.name + ', ' + (i + 1) + ' de ' + cards.length + '" aria-current="false"></button>';
    }).join("");
  }

  function setActive(index, opts){
    opts = opts || {};
    const n = cards.length;
    index = ((index % n) + n) % n;
    const changed = index !== activeIndex;
    activeIndex = index;

    cards.forEach(function(card, i){
      const delta = (i - activeIndex + n) % n;
      const active = delta === 0;
      card.classList.toggle("is-active", active);
      card.classList.toggle("is-right", delta === 1);
      card.classList.toggle("is-left", delta === n - 1);
      card.classList.toggle("is-hidden", delta >= 2 && delta !== n - 1);
      card.tabIndex = active ? 0 : -1;
      card.setAttribute("aria-current", active ? "true" : "false");
      const app = APPS[order[i]];
      if (app){
        card.setAttribute(
          "aria-label",
          (active ? "Abrir " : "Seleccionar ") + app.name + ", " + (i + 1) + " de " + n + ". " + app.tagline + "."
        );
      }
    });

    const app = APPS[activeId()];
    if (app){
      if (tbNow) tbNow.textContent = app.name;
      if (tbPos) tbPos.textContent = (activeIndex + 1) + " / " + n;
      if (barTitle) barTitle.textContent = app.name;
      if (barThumb) barThumb.innerHTML = app.icon;
      if (carouselBar) carouselBar.style.setProperty("--bar", app.color);
      if (openCurrent) openCurrent.setAttribute("aria-label", "Abrir " + app.name);
      syncBarSub();
    }

    if (dots){
      Array.prototype.forEach.call(dots.children, function(dot, i){
        const on = i === activeIndex;
        dot.classList.toggle("is-active", on);
        dot.setAttribute("aria-current", on ? "true" : "false");
      });
    }

    if (opts.focus && cards[activeIndex]) cards[activeIndex].focus({ preventScroll: true });
    if (changed && opts.announce !== false && carouselLive){
      carouselLive.textContent = app.name + ", " + (activeIndex + 1) + " de " + n + ". " + app.tagline + ".";
    }
  }

  function move(delta, opts){
    opts = opts || {};
    const focus = opts.focus === undefined ? cards.indexOf(document.activeElement) !== -1 : opts.focus;
    setActive(activeIndex + delta, { focus: focus, announce: opts.announce !== false });
  }

  buildNav();
  setActive(0, { announce: false, focus: false });

  if (prevTop) prevTop.addEventListener("click", function(){ move(-1, { focus: false }); });
  if (nextTop) nextTop.addEventListener("click", function(){ move(1, { focus: false }); });
  if (prevBtn) prevBtn.addEventListener("click", function(){ move(-1, { focus: false }); });
  if (nextBtn) nextBtn.addEventListener("click", function(){ move(1, { focus: false }); });
  if (openCurrent) openCurrent.addEventListener("click", function(){ launch(cards[activeIndex]); });
  if (dots) dots.addEventListener("click", function(e){
    const dot = e.target.closest("[data-index]");
    if (!dot) return;
    setActive(Number(dot.getAttribute("data-index")), { focus: false });
  });

  /* ==================================================================
     Tarjetas: abrir con transición
     ================================================================== */
  let navigating = false;
  function launch(card){
    if (navigating) return;
    const id = card.getAttribute("data-app");
    const app = APPS[id];
    const url = card.getAttribute("href");
    if (!app || !url) return;
    if (/^(https?:|file:)/.test(url) && url.indexOf(location.origin) !== 0 && /^https?:/.test(url)) {
      window.location.assign(url);
      return;
    }
    navigating = true;
    try {
      const color = app.color;
      overlay.style.setProperty("--launch", color);
      overlayIcon.innerHTML = app.icon;
      overlayName.textContent = app.name;
      document.body.classList.add("launching");
      overlay.setAttribute("aria-hidden", "false");

      const go = function(){
        if (CONFIG.abrirEnNuevaPestana) window.open(url, "_blank", "noopener");
        else window.location.assign(url);
      };

      if (REDUCED){
        overlay.classList.add("animating", "show");
        window.setTimeout(go, 80);
        return;
      }

      const r = card.getBoundingClientRect();
      overlay.style.clipPath =
        "inset(" + Math.round(r.top) + "px " +
        Math.round(window.innerWidth - r.right) + "px " +
        Math.round(window.innerHeight - r.bottom) + "px " +
        Math.round(r.left) + "px round 28px)";
      overlay.classList.add("animating", "show");
      void overlay.offsetHeight;
      const expand = function(){ overlay.style.clipPath = "inset(0px 0px 0px 0px round 0px)"; };
      requestAnimationFrame(expand);
      window.setTimeout(expand, 60);
      window.setTimeout(go, CONFIG.duracionTransicion + 90);
    } catch (err) {
      window.location.assign(url);
    }
  }

  cards.forEach(function(card, index){
    card.addEventListener("click", function(e){
      if (suppressClick){
        e.preventDefault();
        suppressClick = false;
        return;
      }
      if (!card.classList.contains("is-active")){
        e.preventDefault();
        setActive(index, { focus: true });
        return;
      }
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (card.getAttribute("target") === "_blank") return;
      e.preventDefault();
      launch(card);
    });
    card.addEventListener("keydown", function(e){
      if ((e.key === " " || e.key === "Spacebar") && card.classList.contains("is-active")){
        e.preventDefault();
        launch(card);
      }
    });
  });

  /* Gesto táctil / arrastre horizontal. touch-action: pan-y deja libre el
     scroll vertical; solo se captura el gesto cuando el eje dominante es X. */
  if (carousel){
    carousel.addEventListener("pointerdown", function(e){
      if (!e.isPrimary) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      swipeStart = { x: e.clientX, y: e.clientY, id: e.pointerId, horizontal: false };
    });
    carousel.addEventListener("pointermove", function(e){
      if (!swipeStart || e.pointerId !== swipeStart.id) return;
      const dx = e.clientX - swipeStart.x;
      const dy = e.clientY - swipeStart.y;
      if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy) * 1.35){
        swipeStart.horizontal = true;
        suppressClick = true;
      }
    });
    carousel.addEventListener("pointerup", function(e){
      if (!swipeStart || e.pointerId !== swipeStart.id) return;
      const dx = e.clientX - swipeStart.x;
      const dy = e.clientY - swipeStart.y;
      swipeStart = null;
      if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.3){
        move(dx < 0 ? 1 : -1, { focus: false });
        window.setTimeout(function(){ suppressClick = false; }, 420);
      } else {
        window.setTimeout(function(){ suppressClick = false; }, 0);
      }
    });
    carousel.addEventListener("pointercancel", function(){ swipeStart = null; suppressClick = false; });
    carousel.addEventListener("dragstart", function(e){ e.preventDefault(); });
  }

  /* ==================================================================
     Teclado
     ================================================================== */
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape"){ if (openModalEl) closeModal(); return; }
    if (openModalEl){
      if (e.key === "Tab"){
        var focusables = Array.prototype.slice.call(
          openModalEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        ).filter(function(el){ return !el.disabled && el.offsetParent !== null; });
        if (!focusables.length) return;
        var first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
        else if (!openModalEl.contains(document.activeElement)){ e.preventDefault(); first.focus(); }
      }
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^[1-5]$/.test(e.key)){
      const index = Number(e.key) - 1;
      const card = cards[index];
      if (!card) return;
      e.preventDefault();
      if (launchTimer) window.clearTimeout(launchTimer);
      if (index === activeIndex){
        launch(card);
      } else {
        setActive(index, { focus: false });
        launchTimer = window.setTimeout(function(){
          launchTimer = 0;
          launch(cards[index]);
        }, REDUCED ? 0 : 280);
      }
      return;
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowRight"){
      e.preventDefault();
      move(e.key === "ArrowLeft" ? -1 : 1, {
        focus: cards.indexOf(document.activeElement) !== -1
      });
    }
  });

  /* ==================================================================
     Modales (atajos y «Acerca de»)
     ================================================================== */
  let openModalEl = null, lastFocus = null, openTrigger = null;
  function openModal(modal, scrim, closeBtn, trigger){
    if (openModalEl) closeModal();
    openModalEl = modal;
    lastFocus = document.activeElement;
    openTrigger = trigger;
    scrim.classList.add("open"); scrim.setAttribute("aria-hidden", "false");
    modal.classList.add("open"); modal.setAttribute("aria-hidden", "false");
    const topbar = document.querySelector(".topbar");
    [stage, topbar].forEach(function(region){ if (region) region.inert = true; });
    closeBtn.focus();
  }
  function closeModal(){
    if (!openModalEl) return;
    const scrim = (openModalEl === helpModal) ? helpScrim : aboutScrim;
    openModalEl.classList.remove("open"); openModalEl.setAttribute("aria-hidden", "true");
    scrim.classList.remove("open"); scrim.setAttribute("aria-hidden", "true");
    const topbar = document.querySelector(".topbar");
    [stage, topbar].forEach(function(region){ if (region) region.inert = false; });
    openModalEl = null;
    const back = (lastFocus && lastFocus !== document.body && typeof lastFocus.focus === "function") ? lastFocus : (openTrigger || btnHelp);
    back.focus();
  }
  btnHelp.addEventListener("click", function(){ openModal(helpModal, helpScrim, helpClose, btnHelp); });
  btnAbout.addEventListener("click", function(){ openModal(aboutModal, aboutScrim, aboutClose, btnAbout); });
  helpClose.addEventListener("click", closeModal);
  aboutClose.addEventListener("click", closeModal);
  helpScrim.addEventListener("click", closeModal);
  aboutScrim.addEventListener("click", closeModal);

  /* ==================================================================
     Pantalla completa (API nativa; el CSS solo refleja el estado real)
     ================================================================== */
  const fsLive = document.getElementById("fsLive");
  function syncFsState(){
    const on = !!document.fullscreenElement;
    document.documentElement.classList.toggle("is-fs", on);
    const label = on ? "Salir de pantalla completa" : "Pantalla completa";
    btnFs.setAttribute("aria-label", label);
    btnFs.setAttribute("aria-pressed", on ? "true" : "false");
    btnFs.setAttribute("title", label);
    btnFs.dataset.tip = label;
  }
  function fsFailed(){
    syncFsState();
    if (fsLive) fsLive.textContent = "No se pudo cambiar el modo de pantalla completa.";
  }
  if (!document.fullscreenEnabled){
    btnFs.hidden = true;
  } else {
    btnFs.addEventListener("click", function(){
      try {
        const action = document.fullscreenElement
          ? document.exitFullscreen()
          : document.documentElement.requestFullscreen();
        if (action && typeof action.catch === "function") action.catch(fsFailed);
      } catch (err) {
        fsFailed();
      }
    });
    document.addEventListener("fullscreenchange", function(){
      syncFsState();
      if (fsLive) fsLive.textContent = document.fullscreenElement
        ? "Pantalla completa activada."
        : "Pantalla completa desactivada.";
    });
    document.addEventListener("fullscreenerror", fsFailed);
  }

  /* Restaurar la interfaz si el usuario vuelve con «Atrás» */
  window.addEventListener("pageshow", function(){
    navigating = false;
    document.body.classList.remove("launching");
    overlay.classList.remove("animating", "show");
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.clipPath = "";
    syncFsState();
  });
})();
