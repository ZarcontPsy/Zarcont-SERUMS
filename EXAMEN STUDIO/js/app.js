/* ==========================================================================
   BANQUEO · Examen Studio 2.1
   Interfaz, navegación, banco, revisión, importación y práctica.
   © 2026 ZARCONT — Licencia propietaria (ver LICENSE)
   ========================================================================== */
(function () {
  "use strict";

  const Store = window.BanqueoStore;
  const Parser = window.BanqueoParser;
  const app = document.getElementById("app");
  const topbar = document.getElementById("topbar");
  const foot = document.getElementById("foot");
  const modalRoot = document.getElementById("modal-root");
  const toastWrap = document.getElementById("toasts");

  if (!Store) {
    document.body.innerHTML = '<div style="padding:40px;font-family:system-ui;color:#fff;background:#070708">No se pudo cargar la capa de datos de Banqueo.</div>';
    return;
  }

  /* ------------------------------------------------------------------------
     Iconografía
     ------------------------------------------------------------------------ */
  const ICON_PATHS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    "check-circle": '<path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="m9 11 3 3L22 4"/>',
    check: '<path d="m5 12 4.5 4.5L19 6"/>',
    alert: '<path d="M10.3 3.8 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4c5-3 9 3 14 0v9c-5 3-9-3-14 0"/>',
    play: '<path d="m7 4 13 8-13 8Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    trophy: '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M7 6H4v1a4 4 0 0 0 4 4"/><path d="M17 6h3v1a4 4 0 0 1-4 4"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
    close: '<path d="m6 6 12 12"/><path d="m18 6-12 12"/>',
    "arrow-right": '<path d="M4 12h16"/><path d="m14 6 6 6-6 6"/>',
    "arrow-left": '<path d="M20 12H4"/><path d="m10 18-6-6 6-6"/>',
    "chevron-right": '<path d="m9 5 7 7-7 7"/>',
    "chevron-left": '<path d="m15 5-7 7 7 7"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    external: '<path d="M15 4h5v5"/><path d="M20 4 10 14"/><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>',
    "file-text": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h8"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 6.7"/><path d="M20 4v7h-7"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 15H6L5 6"/><path d="M10 11v5"/><path d="M14 11v5"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    shield: '<path d="M12 2 20 5v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5Z"/><path d="m9 12 2 2 4-5"/>',
    sparkles: '<path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/>',
    pdf: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M7 15h3"/><path d="M7 18h5"/><path d="M14 12h3"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    filter: '<path d="M4 5h16"/><path d="M7 12h10"/><path d="M10 19h4"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>',
    stethoscope: '<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M4 3h4"/><path d="M10 3h4"/><path d="M10 13v2a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="11" r="2"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5 1.1-1.1a5.5 5.5 0 0 0 0-7.8Z"/>',
    mother: '<circle cx="12" cy="5" r="3"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/><circle cx="18" cy="7" r="2"/>',
    tooth: '<path d="M12 5.5C9 2.5 4 3.7 4 8.5c0 3 1.5 4.5 2 7.5.5 3 1 5 2.2 5 1.6 0 1.1-4.2 3.8-4.2s2.2 4.2 3.8 4.2c1.2 0 1.7-2 2.2-5 .5-3 2-4.5 2-7.5 0-4.8-5-6-8-3Z"/>',
    brain: '<path d="M9.5 4a3 3 0 0 0-5.4 1.8A3.2 3.2 0 0 0 3 9.2a3.3 3.3 0 0 0 1.7 5.9A3.2 3.2 0 0 0 9 19.5a3 3 0 0 0 3-2.5V5.8A3 3 0 0 0 9.5 4Z"/><path d="M14.5 4a3 3 0 0 1 5.4 1.8 3.2 3.2 0 0 1 1.1 3.4 3.3 3.3 0 0 1-1.7 5.9 3.2 3.2 0 0 1-4.3 4.4 3 3 0 0 1-3-2.5V5.8A3 3 0 0 1 14.5 4Z"/><path d="M12 3v17"/>',
    flask: '<path d="M9 3h6"/><path d="M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3"/><path d="M7.5 15h9"/>',
    leaf: '<path d="M20 4C12 4 4 7 4 14a6 6 0 0 0 6 6c7 0 10-8 10-16Z"/><path d="M4 20c3-6 7-8 12-10"/>',
    dna: '<path d="M7 3c0 6 10 6 10 12 0 3-2 6-2 6"/><path d="M17 3c0 6-10 6-10 12 0 3 2 6 2 6"/><path d="M8 6h8"/><path d="M8 18h8"/><path d="M9 10h6"/><path d="M9 14h6"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
    paw: '<circle cx="7" cy="7" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="17" cy="7" r="2"/><path d="M8 14a5 5 0 0 1 8 0c1 1.4.4 4-2 4h-4c-2.4 0-3-2.6-2-4Z"/>',
    water: '<path d="M12 2s7 8 7 13a7 7 0 0 1-14 0c0-5 7-13 7-13Z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
    microscope: '<path d="M6 18h12"/><path d="M9 18a4 4 0 0 1 0-8h1"/><path d="m12 10 3-7 3 1-3 7"/><path d="M8 10a5 5 0 0 0 5 5"/><path d="M5 22h14"/>',
    activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    speech: '<path d="M21 12a8 8 0 0 1-8 8H6l-3 2v-6a8 8 0 0 1 8-8h2a8 8 0 0 1 8 4Z"/><path d="M8 11h.01"/><path d="M12 11h.01"/><path d="M16 11h.01"/>',
    hand: '<path d="M8 13V5a1.5 1.5 0 0 1 3 0v6"/><path d="M11 11V4a1.5 1.5 0 0 1 3 0v7"/><path d="M14 11V6a1.5 1.5 0 0 1 3 0v7"/><path d="M17 12V9a1.5 1.5 0 0 1 3 0v5a7 7 0 0 1-7 7h-1a7 7 0 0 1-7-7v-2a1.5 1.5 0 0 1 3 0v1"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.9 19.1 1.4-1.4"/><path d="m17.7 6.3 1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H3V3h12v2"/>',
    "rotate-ccw": '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
    "arrow-up-right": '<path d="M7 17 17 7"/><path d="M7 7h10v10"/>',
    circle: '<circle cx="12" cy="12" r="9"/>',
  };

  function icon(name, extra = "") {
    const path = ICON_PATHS[name] || ICON_PATHS.circle;
    return `<svg class="${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  }

  const PROF_ICON = {
    medicina: "stethoscope",
    enfermeria: "heart",
    obstetricia: "mother",
    odontologia: "tooth",
    psicologia: "brain",
    farmacia: "flask",
    nutricion: "leaf",
    biologia: "dna",
    "trabajo-social": "users",
    veterinaria: "paw",
    "ingenieria-sanitaria": "water",
    "tm-laboratorio": "microscope",
    "tm-radiologia": "scan",
    "tm-optometria": "eye",
    "tm-terapia-fisica": "activity",
    "tm-terapia-lenguaje": "speech",
    "tm-terapia-ocupacional": "hand",
  };

  /* ------------------------------------------------------------------------
     Utilidades
     ------------------------------------------------------------------------ */
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const fmt = (value) => Number(value || 0).toLocaleString("es-PE");
  const pct = (value) => `${Math.round(Number(value || 0))}%`;
  const ISSUE_LABELS = {
    resaltado_incidental: "Resaltado incidental",
    alternativa_vacia: "Alternativa vacía",
    alternativas_incompletas: "Alternativas incompletas",
    respuesta_ambigua: "Respuesta ambigua",
    respuesta_no_identificada: "Respuesta no identificada",
    profesion_no_determinada: "Profesión no determinada",
    ciclo_no_determinado: "Ciclo no determinado",
    pagina_sin_texto: "Página sin texto",
    ocr_aplicado: "OCR aplicado",
    ocr_error: "Error de OCR",
    preguntas_omitidas: "Preguntas omitidas",
    salto_numeracion: "Salto de numeración",
  };
  const issueLabel = (type) => ISSUE_LABELS[type] || String(type || "Observación").replace(/_/g, " ");
  const plural = (count, singular, pluralValue) => `${fmt(count)} ${count === 1 ? singular : pluralValue || `${singular}s`}`;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const now = () => Date.now();
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `att-${Date.now()}-${Math.random().toString(16).slice(2)}`);

  let floatingTip = null;
  let floatingTipTarget = null;

  function ensureFloatingTip() {
    if (!floatingTip) {
      floatingTip = document.createElement("div");
      floatingTip.className = "tip-pop";
      floatingTip.id = "floating-tip";
      floatingTip.setAttribute("role", "tooltip");
      document.body.appendChild(floatingTip);
    }
    return floatingTip;
  }

  function hideFloatingTip() {
    floatingTipTarget = null;
    if (floatingTip) floatingTip.classList.remove("is-visible");
  }

  function positionFloatingTip(target) {
    const tip = ensureFloatingTip();
    const rect = target.getBoundingClientRect();
    const gap = 7;
    tip.style.maxWidth = `${Math.min(340, window.innerWidth - 24)}px`;
    tip.classList.add("is-visible");
    const box = tip.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - box.width / 2;
    left = clamp(left, 12, Math.max(12, window.innerWidth - box.width - 12));
    let top = rect.bottom + gap;
    if (top + box.height > window.innerHeight - 12) top = rect.top - box.height - gap;
    if (top < 12) top = 12;
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
  }

  function showFloatingTip(target) {
    if (!target?.isConnected) return;
    const text = String(target.dataset.tip || "").trim();
    if (!text) return;
    const tip = ensureFloatingTip();
    floatingTipTarget = target;
    tip.textContent = text;
    positionFloatingTip(target);
  }

  function clock(seconds) {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const rest = total % 60;
    return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}` : `${minutes}:${String(rest).padStart(2, "0")}`;
  }

  function shortDate(value) {
    if (!value) return "";
    const date = typeof value === "number" ? new Date(value) : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
  }

  function dateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function bytes(value) {
    const size = Number(value || 0);
    if (size < 1024) return `${size} B`;
    if (size < 1048576) return `${(size / 1024).toFixed(0)} KB`;
    return `${(size / 1048576).toFixed(1)} MB`;
  }

  function hashShort(value) {
    return String(value || "").slice(0, 10).toUpperCase();
  }

  function localGet(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  function localSet(key, value) {
    try { localStorage.setItem(key, value); } catch {}
  }

  /* Estado efímero de la sesión de práctica (no es progreso permanente):
     permite retomar el intento tras un refresco en la misma pestaña. */
  const ACTIVE_ATTEMPT_KEY = "banqueo-active-attempt-v1";
  function sessionGet(key) {
    try { return sessionStorage.getItem(key) || ""; } catch { return ""; }
  }
  function sessionSet(key, value) {
    try { if (value) sessionStorage.setItem(key, value); else sessionStorage.removeItem(key); } catch {}
  }

  function numberPref(key, fallback, { min = 0, max = 999 } = {}) {
    const raw = Number(localGet(key));
    if (!Number.isFinite(raw) || raw < min || raw > max) return fallback;
    return raw;
  }
  function boolPref(key, fallback) {
    const raw = localGet(key);
    if (raw === "1") return true;
    if (raw === "0") return false;
    return fallback;
  }

  function normalize(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
  }

  function debounce(fn, delay = 180) {
    let handle = null;
    return (...args) => {
      clearTimeout(handle);
      handle = setTimeout(() => fn(...args), delay);
    };
  }

  function toast(message, type = "") {
    if (!toastWrap) return;
    const element = document.createElement("div");
    element.className = `toast ${type}`.trim();
    const iconName = type === "ok" ? "check-circle" : type === "warn" ? "alert" : "info";
    element.innerHTML = `${icon(iconName)}<span>${esc(message)}</span>`;
    toastWrap.append(element);
    setTimeout(() => {
      element.style.opacity = "0";
      element.style.transform = "translateY(6px)";
      setTimeout(() => element.remove(), 180);
    }, 3800);
  }

  /* ------------------------------------------------------------------------
     Tema y diálogos
     ------------------------------------------------------------------------ */
  function applyTheme(theme) {
    const value = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = value;
    localSet("banqueo-theme-v1", value);
    localSet("es-theme", value);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", value === "light" ? "#f1efe9" : "#070708");
  }

  function toggleTheme() {
    applyTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
    renderShell();
  }

  function setModalBackgroundInert(on) {
    ["app", "topbar", "foot"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.inert = on;
    });
  }

  function closeModal() {
    if (modalRoot) modalRoot.innerHTML = "";
    document.removeEventListener("keydown", modalKeys);
    setModalBackgroundInert(false);
    syncMobileDetail();
    if (modalLastFocus) {
      try { modalLastFocus.focus(); } catch {}
      modalLastFocus = null;
    }
  }

  let modalLastFocus = null;
  function modalKeys(event) {
    if (event.key === "Escape") {
      const cancel = modalRoot?.querySelector("[data-modal-cancel]");
      if (cancel) cancel.click();
      else closeModal();
    }
    if (event.key === "Tab" && modalRoot) {
      const focusables = [...modalRoot.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((element) => !element.disabled && element.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }

  function openModal(html, { onMount, onClose } = {}) {
    modalLastFocus = document.activeElement;
    modalRoot.innerHTML = `<div class="modal-backdrop" data-modal-backdrop><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
    const dialog = modalRoot.querySelector('[role="dialog"]');
    const heading = modalRoot.querySelector("h2");
    if (dialog && heading) {
      if (!heading.id) heading.id = `modal-title-${Date.now()}`;
      dialog.setAttribute("aria-labelledby", heading.id);
    }
    setModalBackgroundInert(true);
    const backdrop = modalRoot.querySelector("[data-modal-backdrop]");
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) {
        const cancel = modalRoot.querySelector("[data-modal-cancel]");
        if (cancel) cancel.click();
      }
    });
    document.addEventListener("keydown", modalKeys);
    const close = () => { closeModal(); if (onClose) onClose(); };
    modalRoot.querySelectorAll("[data-modal-cancel]").forEach((button) => button.addEventListener("click", close));
    if (onMount) onMount(modalRoot, close);
    setTimeout(() => {
      const target = modalRoot.querySelector("[data-modal-focus]") || modalRoot.querySelector("button, input, select, textarea");
      if (target) target.focus();
    }, 30);
    return { close, root: modalRoot };
  }

  function confirmDialog(title, message, confirmLabel = "Confirmar", { danger = false } = {}) {
    return new Promise((resolve) => {
      let settled = false;
      openModal(`
        <div class="modal-head"><div><h2>${esc(title)}</h2><p>${esc(message)}</p></div></div>
        <div class="modal-actions">
          <button class="btn" data-modal-cancel>Cancelar</button>
          <button class="btn ${danger ? "btn-danger" : "btn-primary"}" data-confirm>${esc(confirmLabel)}</button>
        </div>`, {
        onMount(root, close) {
          const finish = (value) => {
            if (settled) return;
            settled = true;
            close();
            resolve(value);
          };
          root.querySelector("[data-confirm]").addEventListener("click", () => finish(true));
          root.querySelector("[data-modal-cancel]").addEventListener("click", () => finish(false), { once: true });
        },
        onClose() {
          if (!settled) { settled = true; resolve(false); }
        },
      });
    });
  }

  function flagDialog(question) {
    const current = Store.reviewInfo(question).note || "";
    return new Promise((resolve) => {
      let settled = false;
      openModal(`
        <div class="modal-head"><div><h2>Registrar incidencia</h2><p>Pregunta ${question.num} · ${esc(Store.examById(question.examId)?.title || "")}</p></div></div>
        <div class="modal-body">
          <p>La incidencia queda asociada a la pregunta y al documento. No modifica la clave.</p>
          <label class="field"><span>Nota de revisión</span><textarea data-flag-note placeholder="Ej.: el resaltado no cubre toda la alternativa, revisar en el PDF.">${esc(current)}</textarea></label>
        </div>
        <div class="modal-actions">
          <button class="btn" data-modal-cancel>Cancelar</button>
          <button class="btn btn-soft" data-clear>Quitar marca</button>
          <button class="btn btn-primary" data-save>Guardar incidencia</button>
        </div>`, {
        onMount(root, close) {
          const finish = (value) => {
            if (settled) return;
            settled = true;
            close();
            resolve(value);
          };
          root.querySelector("[data-flag-note]").setAttribute("data-modal-focus", "");
          root.querySelector("[data-save]").addEventListener("click", () => {
            const note = root.querySelector("[data-flag-note]").value.trim() || "Revisar esta pregunta.";
            finish(note);
          });
          root.querySelector("[data-clear]").addEventListener("click", () => finish(""));
          root.querySelector("[data-modal-cancel]").addEventListener("click", () => finish(null), { once: true });
        },
        onClose() {
          if (!settled) { settled = true; resolve(null); }
        },
      });
    });
  }

  function infoDialog() {
    openModal(`
      <div class="modal-head"><div><h2>Cómo se construyó Banqueo</h2><p>Trazabilidad antes que apariencia.</p></div></div>
      <div class="modal-body">
        <p><b>51 PDFs reales</b> de SERUMS (2025-I, 2026-I y 2026-II), 17 profesiones y <b>5.100 preguntas</b>. Se procesaron todas las páginas de cada documento.</p>
        <p>La profesión y la convocatoria se clasificaron por el <b>contenido del encabezado</b>, no por el nombre del archivo. Cada pregunta conserva el documento y la página de origen.</p>
        <p>Las claves se detectaron por el <b>resaltado amarillo renderizado</b>. Cuando el resaltado no era único, la pregunta queda pendiente de revisión. No se inventaron respuestas.</p>
        <p>La revisión humana empieza en <b>0%</b>. La cobertura del 100% es estructural: significa que cada pregunta tiene una clave identificada, no que una persona haya validado las 5.100.</p>
        <p>Los PDFs importados se guardan intactos en IndexedDB. El OCR solo se activa para páginas sin texto seleccionable y sus resultados se envían a revisión.</p>
      </div>
      <div class="modal-actions"><button class="btn btn-primary" data-modal-cancel>Entendido</button></div>`);
  }

  /* ------------------------------------------------------------------------
     Estado de la aplicación y rutas
     ------------------------------------------------------------------------ */
  const APP = {
    route: { name: "hub", professionId: null, examId: null, section: null, attemptId: null, tab: null },
    hubQuery: "",
    bank: { professionId: null, examId: null, query: "", filter: "all", cycle: "", selectedId: null, detailOpen: false, focusDetail: false, pendingSelect: null },
    review: { tab: "exams", query: "", filter: "all", examId: null, selectedId: null, detailOpen: false, focusDetail: false, correctEditor: false, obsAll: false, examQuery: "" },
    imports: { selectedId: null, ocr: true, processing: false, scratch: [] },
    practice: { setup: { examId: null, count: 25, shuffle: true, mode: "practice", minutes: 0, name: "" }, session: null, result: null },
    prog: { tab: "history", examId: "" },
    lastViewKey: null,
    preserveScroll: false,
  };

  function parseRoute() {
    const raw = String(location.hash || "#hub").replace(/^#\/?/, "");
    const parts = raw.split("/").filter(Boolean).map((part) => decodeURIComponent(part));
    const name = parts[0] || "hub";
    if (name === "bank") return { name, professionId: parts[1] || null, examId: parts[2] || null };
    if (name === "review") return { name, examId: parts[1] || null, tab: parts[2] || null };
    if (name === "practice") {
      const mode = ["setup", "session", "result"].includes(parts[1] || "") ? (parts[1] || "setup") : "setup";
      return {
        name,
        section: mode,
        attemptId: mode === "result" ? (parts[2] || null) : null,
        examId: mode === "setup" ? (parts[1] || null) : null,
      };
    }
    if (name === "prog") return { name, tab: parts[1] || "history" };
    if (name === "import") return { name };
    return { name: "hub", professionId: parts[1] || null };
  }

  function go(hash) {
    if (location.hash === hash) return;
    location.hash = hash;
  }

  function activeProfession() {
    const id = APP.route.professionId || APP.bank.professionId || Store.lastProfession();
    return Store.professionById(id) || Store.state.professions.find((profession) => Store.examList(profession.id).length) || Store.state.professions[0];
  }

  function navActive(name) {
    if (name === "practice") return "";
    if (name === "prog") return APP.route.name === "prog" ? "prog" : "";
    if (name === "review") return APP.route.name === "review" ? "review" : "";
    return APP.route.name === name ? name : "";
  }

  function renderShell() {
    if (!topbar || !foot) return;
    const issueCount = Store.openIssueCount();
    topbar.innerHTML = `
      <a class="brand" href="#hub" aria-label="Banqueo, inicio">
        <span class="brand-mark" aria-hidden="true"></span>
        <span class="brand-copy"><b>BANQUEO</b><small>Examen Studio</small></span>
      </a>
      <nav class="nav" aria-label="Navegación principal">
        <a href="#hub" ${navActive("hub") ? 'aria-current="page"' : ""}>${icon("grid")} Banqueo</a>
        <a href="#bank/${esc(encodeURIComponent(Store.lastProfession()))}" ${navActive("bank") ? 'aria-current="page"' : ""}>${icon("book")} Banco</a>
        <a href="#import" ${navActive("import") ? 'aria-current="page"' : ""}>${icon("upload")} Importar</a>
        <a href="#review" ${navActive("review") ? 'aria-current="page"' : ""}>${icon("check-circle")} Revisión${issueCount ? `<span class="nav-count">${issueCount}</span>` : ""}</a>
        <a href="#prog/history" ${navActive("prog") ? 'aria-current="page"' : ""}>${icon("trophy")} Progreso</a>
      </nav>
      <div class="top-actions">
        <span class="top-chrome" data-chrome-mount></span>
        <button class="icon-btn" type="button" data-act="info" aria-label="Cómo se procesó el banco" title="Cómo se procesó">${icon("info")}</button>
        <button class="icon-btn theme-toggle" type="button" data-act="theme" aria-label="Cambiar tema" title="Cambiar tema">${icon("sun", "sun")}${icon("moon", "moon")}</button>
      </div>`;
    foot.innerHTML = `
      <span>${Store.dbReady ? `<span class="status-dot ok"></span> Procesamiento local · ${fmt(Store.state.stats.exams)} exámenes · ${fmt(Store.state.stats.questions)} preguntas` : `<span class="status-dot warn"></span> Sin persistencia local: el progreso no se conservará al recargar`}</span>
      <span>© 2026 ZARCONT · PDFs originales preservados · <button class="text-link" type="button" data-act="info">Cómo se procesó</button></span>`;
    mountChrome();
  }

  /* Controles comunes del ecosistema (Agente 7). Si el módulo aún no está
     cargado, la app sigue funcionando sin ellos: nunca se pinta un botón muerto. */
  function mountChrome() {
    if (!topbar) return;
    const host = topbar.querySelector("[data-chrome-mount]");
    if (!host) return;
    const chrome = window.SerumsChrome;
    if (!chrome || typeof chrome.mount !== "function") return;
    try {
      chrome.mount(host, {
        hubHref: "../index.html",
        homeHref: "#hub",
        buttonClass: "icon-btn",
        fullscreen: true,
        order: ["home", "hub", "fullscreen"],
      });
    } catch (error) {
      if (window.console) console.warn("SerumsChrome: no se pudieron montar los controles comunes.", error);
    }
  }

  function routeViewKey(route = APP.route) {
    if (!route) return "";
    if (route.name === "hub") return "hub";
    if (route.name === "bank") return `bank:${route.examId || "all"}`;
    if (route.name === "review") return `review:${route.examId || "all"}`;
    if (route.name === "practice") return `practice:${route.section || "setup"}:${route.attemptId || route.examId || ""}`;
    if (route.name === "prog") return `prog:${route.tab || "history"}`;
    return route.name;
  }

  function scrollWindowTo(top) {
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, Math.max(0, top));
    root.style.scrollBehavior = previous;
  }

  function replaceApp(html, { keepScroll = true } = {}) {
    hideFloatingTip();
    const top = window.scrollY;
    app.innerHTML = html;
    if (keepScroll) scrollWindowTo(top);
    else scrollWindowTo(0);
  }

  function render(options = {}) {
    if (!APP.route) return;
    hideFloatingTip();
    const key = routeViewKey();
    const keepScroll = Boolean(options.keepScroll || APP.preserveScroll || APP.lastViewKey === key);
    const top = window.scrollY;
    if (APP.route.name === "hub") app.innerHTML = hubView();
    else if (APP.route.name === "bank") app.innerHTML = bankView();
    else if (APP.route.name === "review") app.innerHTML = APP.review.examId ? reviewExamView() : reviewView();
    else if (APP.route.name === "import") app.innerHTML = importView();
    else if (APP.route.name === "practice") app.innerHTML = practiceView();
    else if (APP.route.name === "prog") app.innerHTML = progView();
    else app.innerHTML = hubView();
    scrollWindowTo(keepScroll ? top : 0);
    APP.lastViewKey = key;
    APP.preserveScroll = false;
    afterRender();
  }

  function refresh(options = {}) {
    if (options.keepScroll) APP.preserveScroll = true;
    render();
  }

  function onRoute() {
    const route = parseRoute();
    const wasPractice = APP.practice.session && !(route.name === "practice" && route.section === "session");
    if (wasPractice) {
      /* El guardado diferido se descartaba al vaciar la sesión; aquí se guarda
         el intento de inmediato para no perder la última respuesta marcada. */
      persistSession(APP.practice.session);
      APP.practice.session = null;
      clearPracticeTimer();
    }
    const previous = APP.route;
    APP.route = route;
    if (route.name === "hub") {
      if (route.professionId) Store.rememberProfession(route.professionId);
    }
    if (route.name === "bank") {
      const pid = route.professionId || Store.lastProfession();
      const professionChanged = APP.bank.professionId !== pid;
      const examChanged = APP.bank.examId !== (route.examId || null);
      if (previous.name !== "bank") {
        APP.bank.selectedId = null;
        APP.bank.detailOpen = false;
      }
      APP.bank.professionId = pid;
      APP.bank.examId = route.examId || null;
      if (professionChanged) {
        APP.bank.query = "";
        APP.bank.filter = "all";
        APP.bank.cycle = "";
        APP.bank.selectedId = null;
        APP.bank.detailOpen = false;
      } else if (examChanged) {
        APP.bank.selectedId = APP.bank.pendingSelect || null;
        APP.bank.detailOpen = Boolean(APP.bank.pendingSelect);
        APP.bank.cycle = "";
      }
      if (APP.bank.pendingSelect) {
        APP.bank.selectedId = APP.bank.pendingSelect;
        APP.bank.detailOpen = true;
        APP.bank.pendingSelect = null;
      }
      Store.rememberProfession(pid);
    }
    if (route.name === "review") {
      APP.review.examId = route.examId || null;
      if (!route.examId) {
        APP.review.selectedId = null;
        APP.review.detailOpen = false;
        APP.review.query = "";
        APP.review.filter = "all";
      } else if (previous.name !== "review" || previous.examId !== route.examId) {
        APP.review.selectedId = APP.review.pendingSelect || null;
        APP.review.detailOpen = false;
        APP.review.filter = "all";
        APP.review.query = "";
      }
      if (APP.review.pendingSelect) {
        APP.review.selectedId = APP.review.pendingSelect;
        APP.review.detailOpen = true;
        APP.review.query = "";
        APP.review.filter = "all";
        APP.review.pendingSelect = null;
      }
    }
    if (route.name === "practice") {
      if (route.section === "result" && route.attemptId) {
        APP.practice.result = Store.attemptById(route.attemptId);
      }
      if (route.section === "setup" && route.examId) {
        APP.practice.setup.examId = route.examId;
      }
      if (route.section === "session" && !APP.practice.session) {
        /* Refresco o reentrada directa a la sesión: se recupera el intento en
           curso marcado en esta pestaña, con sus respuestas ya guardadas. */
        const activeId = sessionGet(ACTIVE_ATTEMPT_KEY);
        const attempt = activeId ? Store.attemptById(activeId) : null;
        if (attempt && attempt.status === "prog" && (attempt.order || []).length) {
          APP.practice.session = sessionFromAttempt(attempt);
        } else if (activeId) {
          sessionSet(ACTIVE_ATTEMPT_KEY, "");
        }
      }
    }
    if (route.name === "prog" && route.tab) APP.prog.tab = route.tab;
    renderShell();
    render();
  }

  function afterRender() {
    if (APP.route.name === "import") setupDropZone();
    if (APP.route.name === "practice" && APP.route.section === "session" && APP.practice.session) startPracticeTimer();
    else clearPracticeTimer();
    syncMobileDetail();
  }

  /* ------------------------------------------------------------------------
     Componentes compartidos
     ------------------------------------------------------------------------ */
  function professionIcon(profession, size = "") {
    const name = PROF_ICON[profession?.id] || profession?.icon || "book";
    return `<span class="prof-icon ${size}">${icon(name)}</span>`;
  }

  function examIssueTip(exam) {
    if (!exam) return "";
    const issues = Store.issuesForExam(exam.id);
    if (!issues.length) return "";
    const parts = issues.slice(0, 4).map((issue) => {
      const detail = String(issue.detail || issue.snippet || "").replace(/\s+/g, " ").trim();
      const where = issue.page ? `página ${issue.page}` : "";
      return [issueLabel(issue.type), where, detail].filter(Boolean).join(" · ");
    });
    if (issues.length > 4) parts.push(`y ${issues.length - 4} más`);
    return `${plural(issues.length, "observación", "observaciones")}: ${parts.join(" · ")}`;
  }

  function statusPill(exam) {
    if (!exam) return "";
    if (exam.imported) return `<span class="pill info"><span class="status-dot info"></span>Importado</span>`;
    const incidents = exam.audit?.incidents || 0;
    if (incidents) {
      const tip = examIssueTip(exam) || "Observaciones documentales detectadas durante el análisis. Abre Revisión para ver el detalle.";
      return `<span class="pill warn" data-tip="${esc(tip)}" aria-label="${esc(tip)}" tabindex="0"><span class="status-dot warn"></span>${plural(incidents, "observación", "observaciones")}</span>`;
    }
    if (exam.audit?.status === "revision") return `<span class="pill bad"><span class="status-dot bad"></span>Revisión</span>`;
    return `<span class="pill ok"><span class="status-dot ok"></span>Estructura validada</span>`;
  }

  function questionPills(question) {
    const review = Store.reviewInfo(question);
    const pills = [];
    if (question.status !== "valid" || !question.correct) pills.push('<span class="pill bad">Sin clave</span>');
    if (review.reviewed) pills.push('<span class="pill ok">Revisada</span>');
    if (review.flagged) pills.push('<span class="pill warn">Incidencia</span>');
    if ((question.dc || 0) > 1) pills.push('<span class="pill info">Duplicada</span>');
    if (question.confidence === "manual") pills.push('<span class="pill info">Clave manual</span>');
    return pills.join("");
  }

  function reviewTrack(value) {
    return `<div class="review-track"><i style="width:${clamp(value, 0, 100)}%"></i></div>`;
  }

  function emptyState(iconName, title, text, action = "") {
    return `<div class="empty"><div class="empty-icon">${icon(iconName)}</div><b>${esc(title)}</b><p>${esc(text)}</p>${action ? `<div style="margin-top:16px">${action}</div>` : ""}</div>`;
  }

  function examForQuestion(question) {
    return Store.examById(question?.examId);
  }

  function questionExamLabel(question) {
    const exam = examForQuestion(question);
    if (!exam) return "Examen";
    return `${exam.professionId === "medicina" ? "Medicina" : Store.professionById(exam.professionId)?.short || exam.professionId} · ${exam.cycle}`;
  }

  function professionName(id) {
    return Store.professionById(id)?.name || id || "Sin clasificar";
  }

  function examQuestionCount(exam) {
    if (!exam) return 0;
    if (Array.isArray(exam.questions)) return exam.questions.length;
    return Number(exam.questionCount || exam.questions || 0);
  }

  function googleCycle(cycle) {
    return String(cycle || "").replace("-", " · ");
  }

  /* ------------------------------------------------------------------------
     Hub
     ------------------------------------------------------------------------ */
  function visibleProfessions() {
    const search = normalize(APP.hubQuery);
    return Store.state.professions
      .filter((profession) => Store.examList(profession.id).length)
      .filter((profession) => !search || normalize(`${profession.name} ${profession.short} ${profession.group}`).includes(search))
      .sort((a, b) => {
        const group = String(a.group || "").localeCompare(String(b.group || ""), "es");
        return group || a.name.localeCompare(b.name, "es");
      });
  }

  function catalogHTML(professions) {
    if (!professions.length) return `<div class="cat-empty">No hay profesiones que coincidan con “${esc(APP.hubQuery)}”.</div>`;
    const groups = [...new Set(professions.map((profession) => profession.group || "Profesiones"))];
    return groups.map((group) => {
      const items = professions.filter((profession) => (profession.group || "Profesiones") === group);
      return `<div class="cat-group"><div class="cat-label">${esc(group)}</div>${items.map((profession) => {
        const active = activeProfession()?.id === profession.id;
        const stats = Store.professionStats(profession.id);
        return `<button class="cat-row ${active ? "is-active" : ""}" type="button" data-act="pick-prof" data-id="${esc(profession.id)}" aria-pressed="${active}">
          <span class="cat-icon">${icon(PROF_ICON[profession.id] || "book")}</span>
          <span class="cat-main"><span class="cat-name">${esc(profession.short || profession.name)}</span><span class="cat-meta">${plural(stats.questions, "pregunta")} · ${esc(profession.group || "")}</span></span>
          <span class="cat-count">${stats.exams}</span>
        </button>`;
      }).join("")}</div>`;
    }).join("");
  }

  function examRowHTML(exam) {
    const stats = Store.examStats(exam);
    const incidents = exam.audit?.incidents || 0;
    const examTitle = exam.imported ? exam.title : "Evaluación nacional SERUMS";
    const sourcePrefix = exam.sourcePrefix && exam.sourcePrefix !== "importado" ? ` · ${esc(exam.sourcePrefix)}` : "";
    const pdfLabel = exam.file ? esc(exam.file) : "PDF original";
    return `<article class="exam-row">
      <div class="cycle-badge"><b>${esc(exam.cycle)}</b><span>${esc(exam.date || (exam.imported ? "Importado" : "SERUMS"))}</span></div>
      <div class="exam-main">
        <div class="exam-title">${esc(examTitle)} ${statusPill(exam)}</div>
        <div class="exam-meta">
          <span>${plural(examQuestionCount(exam), "pregunta")}</span>
          <span>${plural(exam.pages, "página")}</span>
          <span>${plural(exam.answers, "clave")}</span>
          <span>${bytes(exam.fileBytes)}</span>
          ${incidents ? `<span class="warn" data-tip="${esc(examIssueTip(exam))}">${plural(incidents, "observación", "observaciones")}</span>` : ""}
          ${stats.flags ? `<span class="warn">${plural(stats.flags, "marcada", "marcadas")}</span>` : ""}
        </div>
      </div>
      <div class="exam-actions">
        <a class="btn btn-primary btn-sm" href="#bank/${esc(encodeURIComponent(exam.professionId))}/${esc(encodeURIComponent(exam.id))}">Abrir banco ${icon("arrow-right")}</a>
        <button class="btn btn-sm" type="button" data-act="practice-exam" data-exam="${esc(exam.id)}">${icon("play")} Practicar</button>
        <button class="icon-btn" type="button" data-act="open-exam-pdf" data-exam="${esc(exam.id)}" aria-label="Ver PDF original: ${esc(pdfLabel)}" title="${esc(pdfLabel)}">${icon("file")}</button>
      </div>
    </article>`;
  }

  function professionDetailHTML(profession) {
    if (!profession) return emptyState("book", "Sin profesión", "Selecciona una profesión del catálogo.");
    const exams = Store.examList(profession.id);
    const stats = Store.professionStats(profession.id);
    const coverage = stats.coverage || 0;
    return `
      <div class="prof-head">
        ${professionIcon(profession)}
        <div class="prof-title">
          <div class="eyebrow">${esc(profession.group || "Profesión")}</div>
          <h1>${esc(profession.name)}</h1>
          <p>${plural(exams.length, "convocatoria", "convocatorias")} · ${plural(stats.questions, "pregunta")} · ${plural(stats.exams, "documento", "documentos")}</p>
        </div>
        <a class="btn btn-soft" href="#import" data-nav>${icon("upload")} Importar PDFs</a>
      </div>
      <div class="prof-stats">
        <div class="prof-stat"><b>${fmt(exams.length)}</b><span>Exámenes</span></div>
        <div class="prof-stat"><b>${fmt(stats.questions)}</b><span>Preguntas</span></div>
        <div class="prof-stat"><b>${fmt(stats.questions - stats.pending)}</b><span>Con clave</span></div>
        <div class="prof-stat"><b>${pct(stats.reviewPct)}</b><span>Revisión</span></div>
      </div>
      <div class="prof-body">
        <div class="prof-section-head"><h2>Convocatorias</h2><span>${exams.length ? "Más reciente primero" : "Sin documentos"}</span></div>
        ${exams.length ? `<div class="exam-list">${exams.map(examRowHTML).join("")}</div>` : emptyState("upload", "Aún no hay exámenes", "Importa un PDF para crear el primer examen de esta profesión.", `<a class="btn btn-primary" href="#import">Importar PDF</a>`)}
        <div class="coverage">
          ${icon("check-circle")}
          <span><b>${pct(coverage)} de cobertura documental.</b> ${stats.pending ? `${plural(stats.pending, "pregunta")} sin clave requieren revisión.` : "Todas las preguntas tienen una clave identificada."} ${stats.incidents ? `${plural(stats.incidents, "observación", "observaciones")} documentales pendientes.` : ""}</span>
        </div>
        <div class="review-line">${reviewTrack(stats.reviewPct)}<span>${fmt(stats.reviewed)} de ${fmt(stats.questions)} revisadas por una persona</span></div>
      </div>`;
  }

  function hubView() {
    const active = activeProfession();
    const professions = visibleProfessions();
    const stats = Store.state.stats;
    const totalAnswers = Store.state.exams.reduce((total, exam) => total + (exam.answers || 0), 0);
    const coverage = Store.state.exams.length
      ? Store.state.exams.reduce((total, exam) => total + Number(exam.audit?.coverage || 0), 0) / Store.state.exams.length
      : 0;
    const examsWithObservations = Store.state.exams.filter((exam) => (exam.audit?.incidents || 0) > 0).length;
    return `<div class="page">
      <section class="hub-hero">
        <div class="hero-copy">
          <div class="hero-kicker"><span class="eyebrow">Banco SERUMS</span><span class="red-dot"></span><span class="small muted">Trazable al PDF original</span></div>
          <h1>Tu profesión.<br><span>Tu banco.</span></h1>
          <p class="lead">51 exámenes oficiales, clasificados por contenido y por convocatoria. Entra directo a las preguntas, revisa la clave en su página original o entrena con el examen completo.</p>
          <div class="hero-actions">
            <a class="btn btn-primary btn-lg" href="#bank/${esc(encodeURIComponent(active?.id || Store.lastProfession()))}">${icon("book")} Explorar el banco</a>
            <a class="btn btn-lg" href="#import">${icon("upload")} Importar PDFs</a>
            <a class="btn btn-ghost btn-lg" href="#review">${icon("check-circle")} Revisar</a>
          </div>
        </div>
        <div class="hero-side">
          <div class="metric-strip" aria-label="Cobertura del banco">
            <div class="metric"><b>${fmt(stats.exams)}</b><span>Exámenes</span></div>
            <div class="metric"><b>${fmt(stats.questions)}</b><span>Preguntas</span></div>
            <div class="metric"><b>${pct(coverage)}</b><span>Cobertura</span></div>
            <div class="metric"><b>${fmt(stats.professions)}</b><span>Profesiones</span></div>
          </div>
          <div class="hero-note">${icon("shield")} PDFs originales preservados. Claves identificadas por resaltado, nunca inventadas.</div>
        </div>
      </section>
      <section class="hub-grid" aria-label="Profesiones y exámenes">
        <aside class="catalog glass">
          <div class="panel-head"><h2>Profesiones</h2><span class="panel-count">${professions.length} visibles</span></div>
          <div class="search">${icon("search")}<input type="search" data-hub-search value="${esc(APP.hubQuery)}" placeholder="Buscar profesión…" aria-label="Buscar profesión"></div>
          <div class="cat-scroll" id="cat-list">${catalogHTML(professions)}</div>
        </aside>
        <section class="prof-panel glass" id="prof-detail">${professionDetailHTML(active)}</section>
      </section>
      <div class="small muted" style="display:flex;gap:14px;flex-wrap:wrap;margin-top:16px;padding:0 4px">
        <span>${fmt(totalAnswers)} claves identificadas</span>
        <span>${examsWithObservations} documentos con observaciones</span>
        <span>${fmt(stats.reviewed)} preguntas revisadas por una persona</span>
      </div>
    </div>`;
  }

  function updateHubCatalog() {
    const list = document.getElementById("cat-list");
    if (list) list.innerHTML = catalogHTML(visibleProfessions());
    const count = document.querySelector(".catalog .panel-count");
    if (count) count.textContent = `${visibleProfessions().length} visibles`;
  }

  /* ------------------------------------------------------------------------
     Banco de preguntas
     ------------------------------------------------------------------------ */
  const isDesktop = () => window.matchMedia("(min-width: 941px)").matches;
  const isMobileDetail = () => window.matchMedia("(max-width: 940px)").matches;
  const DETAIL_FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function detailFocusables(root) {
    return [...root.querySelectorAll(DETAIL_FOCUSABLE)].filter((el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden");
  }

  function setSheetBackgroundInert(on) {
    ["topbar", "foot"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.inert = on;
    });
    document.querySelectorAll(".qlist-panel, .bank-head, .bank-toolbar, .review-head, .review-toolbar, .review-tabs").forEach((el) => {
      el.inert = on;
    });
  }

  function syncMobileDetail() {
    const route = APP.route && APP.route.name;
    const state = route === "bank" ? APP.bank : route === "review" ? APP.review : null;
    const panel = document.querySelector(".qdetail-panel");
    const active = Boolean(state && state.detailOpen && isMobileDetail() && panel && !modalRoot.innerHTML);
    if (!active) {
      setSheetBackgroundInert(false);
      if (panel) {
        panel.removeAttribute("role");
        panel.removeAttribute("aria-modal");
        panel.removeAttribute("tabindex");
        panel.removeAttribute("aria-label");
      }
      return;
    }
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("tabindex", "-1");
    panel.setAttribute("aria-label", route === "bank" ? "Detalle de la pregunta" : "Revisión de la pregunta");
    setSheetBackgroundInert(true);
    if (state.focusDetail) {
      state.focusDetail = false;
      const close = panel.querySelector(".mobile-close");
      if (close) setTimeout(() => { try { close.focus(); } catch {} }, 30);
    }
  }

  function focusDetailRow(route, id) {
    if (!id) return;
    const act = route === "review" ? "review-select" : "bank-select";
    const row = [...document.querySelectorAll(`[data-act="${act}"]`)].find((el) => el.dataset.id === id);
    if (row) {
      try { row.focus(); } catch {}
    }
  }

  function closeRouteDetail() {
    const route = APP.route && APP.route.name;
    if (route === "bank" && APP.bank.detailOpen) {
      const id = APP.bank.selectedId;
      APP.bank.detailOpen = false;
      APP.bank.focusDetail = false;
      refreshBank();
      if (isMobileDetail()) setTimeout(() => focusDetailRow("bank", id), 0);
      return;
    }
    if (route === "review" && APP.review.detailOpen) {
      const id = APP.review.selectedId;
      APP.review.detailOpen = false;
      APP.review.focusDetail = false;
      refreshReview();
      if (isMobileDetail()) setTimeout(() => focusDetailRow("review", id), 0);
    }
  }

  function trapSheetFocus(event) {
    const panel = document.querySelector(".qdetail-panel");
    if (!panel) return;
    const list = detailFocusables(panel);
    if (!list.length) { event.preventDefault(); panel.focus(); return; }
    const first = list[0];
    const last = list[list.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !panel.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  }

  function bankProfession() {
    return Store.professionById(APP.bank.professionId) || activeProfession();
  }

  function bankExam() {
    return APP.bank.examId ? Store.examById(APP.bank.examId) : null;
  }

  function cycleOptions(professionId) {
    return [...new Set(Store.examList(professionId).map((exam) => exam.cycle))]
      .sort((a, b) => String(b).localeCompare(String(a)));
  }

  function sortQuestions(items) {
    return [...items].sort((a, b) => {
      const year = (b.year || 0) - (a.year || 0);
      if (year) return year;
      const cycle = String(b.convocatoria || "").localeCompare(String(a.convocatoria || ""));
      if (cycle) return cycle;
      return (a.num || 0) - (b.num || 0);
    });
  }

  function bankItemsWithCurrentFilters() {
    const items = Store.filterQuestions({
      professionId: APP.bank.professionId,
      examId: APP.bank.examId,
      query: APP.bank.query,
      filter: APP.bank.filter,
      cycle: APP.bank.cycle,
    });
    return APP.bank.examId ? items : sortQuestions(items);
  }

  function bankCounts() {
    const base = { professionId: APP.bank.professionId, examId: APP.bank.examId, query: "", cycle: APP.bank.cycle };
    return {
      all: Store.filterQuestions({ ...base, filter: "all" }).length,
      valid: Store.filterQuestions({ ...base, filter: "valid" }).length,
      unreviewed: Store.filterQuestions({ ...base, filter: "unreviewed" }).length,
      reviewed: Store.filterQuestions({ ...base, filter: "reviewed" }).length,
      incidents: Store.filterQuestions({ ...base, filter: "incidents" }).length,
      duplicates: Store.filterQuestions({ ...base, filter: "duplicates" }).length,
    };
  }

  function questionListHTML(items, selected, mode = "bank") {
    if (!items.length) return emptyState("search", "Sin preguntas", "Prueba con otro término, convocatoria o filtro.");
    const visible = items.slice(0, 350);
    return `<div class="qlist-head"><b>${plural(items.length, "pregunta")}</b><span>${items.length > visible.length ? `Mostrando ${visible.length}` : "Ordenadas por convocatoria"}</span></div>
      <div class="qlist" role="list">
        ${visible.map((question) => {
          const review = Store.reviewInfo(question);
          return `<button class="qrow ${selected?.id === question.id ? "is-active" : ""}" type="button" role="listitem" data-act="${mode}-select" data-id="${esc(question.id)}">
            <span class="qrow-num">${question.num}</span>
            <span class="qrow-body">
              <span class="qrow-title">${esc(question.statement)}</span>
              <span class="qrow-meta"><span>${esc(question.cycle)}</span><span>p. ${question.page}</span>${question.dc > 1 ? "<span>duplicada</span>" : ""}</span>
            </span>
            <span class="qrow-marks">
              ${review.reviewed ? '<i class="mini-mark ok" title="Revisada"></i>' : ""}
              ${review.flagged ? '<i class="mini-mark warn" title="Con incidencia"></i>' : ""}
              ${question.status !== "valid" || !question.correct ? '<i class="mini-mark bad" title="Sin clave"></i>' : ""}
              ${question.dc > 1 ? '<i class="mini-mark dup" title="Duplicada"></i>' : ""}
            </span>
          </button>`;
        }).join("")}
      </div>`;
  }

  function answerListHTML(question, { mode = "bank", selected = "", showCorrect = true } = {}) {
    const correct = question.correct || question.c || "";
    return `<div class="answers" role="list" aria-label="Alternativas">
      ${(question.o || question.options || []).map((option) => {
        const isCorrect = showCorrect && correct === option.id;
        const isSelected = selected === option.id;
        return `<div class="answer ${isCorrect ? "is-correct" : ""} ${isSelected ? "is-selected" : ""}" role="listitem">
          <span class="answer-letter">${esc(option.id)}</span>
          <span class="answer-text">${esc(option.text)}</span>
          <span class="answer-check">${isCorrect ? icon("check") : isSelected ? icon("circle") : ""}</span>
        </div>`;
      }).join("")}
    </div>`;
  }

  function evidenceHTML(question) {
    const correct = question.correct || question.c || "";
    if (!correct) {
      return `<div class="evidence"><span class="status-dot bad"></span><span><b>Sin clave identificada.</b> ${question.imported ? "Asigna una clave desde Revisión." : "Registra una incidencia para revisar el PDF."}</span></div>`;
    }
    if (question.ev) {
      return `<div class="evidence"><span class="swatch"></span><span><b>Clave ${esc(correct)}.</b> Detectada por resaltado amarillo en la página ${question.evPage || question.page}.</span><button class="text-link" type="button" data-act="open-pdf" data-id="${esc(question.id)}">Ver PDF original ${icon("external")}</button></div>`;
    }
    return `<div class="evidence"><span class="status-dot info"></span><span><b>Clave ${esc(correct)}.</b> ${question.imported ? "Clave asignada en revisión manual." : "Clave registrada en el documento."}</span><button class="text-link" type="button" data-act="open-pdf" data-id="${esc(question.id)}">Ver PDF original ${icon("external")}</button></div>`;
  }

  function duplicateNoteHTML(question) {
    const duplicates = Store.duplicatesFor(question);
    if (!duplicates.length) return "";
    return `<div class="dupe-note"><b>${plural(duplicates.length + 1, "registro coincide", "registros coinciden")} por enunciado y alternativas.</b> No se eliminó ninguna copia.
      <div class="dupe-list">${duplicates.slice(0, 8).map((item) => `<button type="button" data-act="bank-jump" data-id="${esc(item.id)}">${esc(item.cycle)} · ${esc(Store.professionById(item.professionId)?.short || item.professionId)} · #${item.num}</button>`).join("")}${duplicates.length > 8 ? `<span class="small muted">+${duplicates.length - 8}</span>` : ""}</div></div>`;
  }

  function correctEditorHTML(question) {
    return `<div class="correct-editor">
      <b>Corregir clave de esta pregunta importada</b>
      <span class="small muted">La clave se guarda en el banco y la pregunta pasa a revisada estructuralmente. El PDF original no se modifica.</span>
      <div class="letters">${question.o.map((option) => `<button type="button" class="${question.correct === option.id ? "is-active" : ""}" data-act="review-set-key" data-id="${esc(question.id)}" data-letter="${esc(option.id)}">${esc(option.id)}</button>`).join("")}</div>
    </div>`;
  }

  function questionDetailHTML(question, { mode = "bank", items = [], position = null } = {}) {
    if (!question) return emptyState("book", "Selecciona una pregunta", "Elige una pregunta del listado para ver el enunciado, las alternativas y su trazabilidad.");
    const exam = examForQuestion(question);
    const review = Store.reviewInfo(question);
    const correct = question.correct || question.c || "";
    const index = items.findIndex((item) => item.id === question.id);
    const prevId = index > 0 ? items[index - 1].id : null;
    const nextId = index >= 0 && index < items.length - 1 ? items[index + 1].id : null;
    const closeAct = mode === "review" ? "review-close" : "bank-close";
    const prevAct = mode === "review" ? "review-prev" : "bank-prev";
    const nextAct = mode === "review" ? "review-next" : "bank-next";
    const reviewAct = mode === "review" ? "review-confirm" : "bank-review";
    const flagAct = mode === "review" ? "review-flag" : "bank-flag";
    return `<div class="qdetail-scroll">
      <div class="qdetail-head">
        <div>
          <h2>Pregunta ${question.num}</h2>
          <div class="meta"><span>${esc(Store.professionById(question.professionId)?.name || "")}</span><span>${esc(question.cycle)}</span><span>página ${question.page}</span><span>${esc(exam?.file || "")}</span></div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end">
          ${questionPills(question)}
          <button class="icon-btn mobile-close" type="button" data-act="${closeAct}" aria-label="Cerrar detalle">${icon("close")}</button>
        </div>
      </div>
      <div class="qdetail-body">
        <div class="qstatement">${esc(question.statement)}</div>
        ${answerListHTML(question, { mode, showCorrect: true })}
        ${evidenceHTML(question)}
        <div class="qmeta-grid">
          <div><b>Examen</b>${esc(exam?.title || question.cycle)}</div>
          <div><b>Convocatoria</b>${esc(question.cycle)} · ${esc(exam?.date || "")}</div>
          <div><b>Documento</b>${esc(exam?.file || "Sin archivo")} ${exam?.official ? "" : "· importado"}</div>
          <div><b>Huella del PDF</b><span class="mono">${esc(hashShort(exam?.fileHash || "")) || "—"}</span></div>
        </div>
        ${duplicateNoteHTML(question)}
        ${mode === "review" && question.imported && APP.review.correctEditor ? correctEditorHTML(question) : ""}
        <details class="raw-box"><summary>Ver texto original extraído</summary><pre>${esc(question.r || question.rawText || question.statement)}</pre></details>
      </div>
    </div>
    <div class="qdetail-actions">
      <button class="btn btn-sm" type="button" data-act="${prevAct}" ${prevId ? "" : "disabled"}>${icon("chevron-left")} Anterior</button>
      <button class="btn btn-sm" type="button" data-act="${nextAct}" ${nextId ? "" : "disabled"}>Siguiente ${icon("chevron-right")}</button>
      <span class="spacer"></span>
      <button class="btn btn-sm ${review.reviewed ? "btn-soft" : ""}" type="button" data-act="${reviewAct}" data-id="${esc(question.id)}">${icon("check")} ${review.reviewed ? "Revisada" : "Marcar revisada"}</button>
      <button class="btn btn-sm ${review.flagged ? "btn-danger" : ""}" type="button" data-act="${flagAct}" data-id="${esc(question.id)}">${icon("flag")} ${review.flagged ? "Con incidencia" : "Incidencia"}</button>
      ${mode === "review" && question.imported ? `<button class="btn btn-sm" type="button" data-act="review-correct" data-id="${esc(question.id)}">${icon("refresh")} Corregir clave</button>` : ""}
      <button class="btn btn-sm" type="button" data-act="open-pdf" data-id="${esc(question.id)}">${icon("file")} PDF</button>
    </div>`;
  }

  function bankView() {
    const profession = bankProfession();
    if (!profession) return emptyState("book", "Sin profesión", "Selecciona una profesión desde Banqueo.");
    const exams = Store.examList(profession.id);
    if (!exams.length) return `<div class="page"><div class="page-head"><div><div class="breadcrumb"><a href="#hub">Banqueo</a>${icon("chevron-right")}<span>${esc(profession.name)}</span></div><h1>Banco de preguntas</h1></div></div>${emptyState("upload", "Sin exámenes", "Importa un PDF para empezar a construir este banco.", `<a class="btn btn-primary" href="#import">Importar PDF</a>`)}</div>`;
    const exam = bankExam();
    if (APP.bank.examId && !exam) { APP.bank.examId = null; }
    const items = bankItemsWithCurrentFilters();
    const counts = bankCounts();
    let selected = items.find((question) => question.id === APP.bank.selectedId) || null;
    if (!selected && items.length && (isDesktop() || APP.bank.detailOpen)) {
      selected = items[0];
      APP.bank.selectedId = selected.id;
    }
    const detailOpen = Boolean(APP.bank.detailOpen || isDesktop());
    const chips = [
      ["all", "Todas", counts.all],
      ["valid", "Validadas", counts.valid],
      ["unreviewed", "Sin revisar", counts.unreviewed],
      ["reviewed", "Revisadas", counts.reviewed],
      ["incidents", "Incidencias", counts.incidents],
      ["duplicates", "Duplicadas", counts.duplicates],
    ];
    const cycles = cycleOptions(profession.id);
    const selectedExamId = APP.bank.examId || "";
    const practiceId = selectedExamId || exams[0].id;
    return `<div class="page">
      <div class="page-head">
        <div>
          <div class="breadcrumb"><a href="#hub">Banqueo</a>${icon("chevron-right")}<a href="#hub/${esc(encodeURIComponent(profession.id))}">${esc(profession.name)}</a>${icon("chevron-right")}<span>${exam ? esc(exam.cycle) : "Todos los exámenes"}</span></div>
          <h1>Banco de preguntas</h1>
          <p class="lead">${exam ? `${esc(exam.title)} · ${plural(examQuestionCount(exam), "pregunta")} · ${plural(exam.pages, "página")}` : `${plural(exams.length, "convocatoria", "convocatorias")} · ${plural(items.length, "pregunta")} disponibles con la búsqueda actual`}</p>
        </div>
        <div class="page-head-actions">
          <a class="btn" href="#review/${exam ? esc(encodeURIComponent(exam.id)) : ""}">${icon("check-circle")} Revisar</a>
          <a class="btn btn-primary" href="#practice/${esc(encodeURIComponent(practiceId))}">${icon("play")} Practicar</a>
        </div>
      </div>
      <div class="bank-toolbar glass">
        <select data-bank-exam aria-label="Filtrar por examen">
          <option value="">Todos los exámenes (${exams.length})</option>
          ${exams.map((item) => `<option value="${esc(item.id)}" ${selectedExamId === item.id ? "selected" : ""}>${esc(item.cycle)} · ${item.imported ? "Importado" : "Oficial"}${item.audit?.incidents ? ` · ${item.audit.incidents} obs.` : ""}</option>`).join("")}
        </select>
        <div class="search">${icon("search")}<input type="search" data-bank-search value="${esc(APP.bank.query)}" placeholder="Buscar por enunciado o alternativa…" aria-label="Buscar preguntas"></div>
        ${exam ? `<div class="pill dark" style="justify-self:stretch;justify-content:center;min-height:38px">${esc(exam.cycle)}</div>` : `<select data-bank-cycle aria-label="Filtrar por convocatoria"><option value="">Todas las convocatorias</option>${cycles.map((cycle) => `<option value="${esc(cycle)}" ${APP.bank.cycle === cycle ? "selected" : ""}>${esc(cycle)}</option>`).join("")}</select>`}
        <div class="chips" role="group" aria-label="Filtros de preguntas">
          ${chips.map(([value, label, count]) => `<button class="chip ${APP.bank.filter === value ? "is-active" : ""}" type="button" data-act="bank-filter" data-filter="${value}">${label}<span class="n">${fmt(count)}</span></button>`).join("")}
        </div>
      </div>
      <div class="bank-meta-line"><span><b>${fmt(items.length)}</b> preguntas en el resultado · ${fmt(counts.reviewed)} revisadas · ${fmt(counts.duplicates)} duplicadas</span><span>${exam ? `Documento: ${esc(exam.file)}` : "Todas las convocatorias de la profesión"}</span></div>
      <div class="bank-grid ${detailOpen ? "detail-open" : ""}">
        <section class="qlist-panel glass" aria-label="Listado de preguntas">${questionListHTML(items, selected, "bank")}</section>
        <section class="qdetail-panel glass" aria-label="Detalle de la pregunta">${questionDetailHTML(selected, { mode: "bank", items })}</section>
      </div>
    </div>`;
  }

  function refreshBank() {
    if (APP.route.name !== "bank") return;
    replaceApp(bankView());
    const detail = document.querySelector(".qdetail-scroll");
    if (detail) detail.scrollTop = 0;
    syncMobileDetail();
  }

  async function openPdf(question) {
    if (!question) return;
    try {
      const result = await Store.openOriginal(question);
      if (result === false) toast("El PDF original no está disponible en este dispositivo.", "warn");
    } catch {
      toast("No se pudo abrir el PDF original.", "warn");
    }
  }

  async function openExamPdf(exam) {
    if (!exam) return;
    try {
      const result = await Store.openOriginal({ examId: exam.id, filePath: exam.filePath, page: 1 });
      if (result === false) toast("El PDF original no está disponible en este dispositivo.", "warn");
    } catch {
      toast("No se pudo abrir el PDF original.", "warn");
    }
  }

  /* ------------------------------------------------------------------------
     Revisión y auditoría
     ------------------------------------------------------------------------ */
  function reviewStats() {
    const questions = Store.state.questions;
    const reviewed = questions.filter((question) => Store.isReviewed(question)).length;
    const structural = questions.filter((question) => question.status !== "valid" || !question.correct).length;
    const flagged = questions.filter((question) => Store.reviewInfo(question).flagged).length;
    const exceptions = Store.state.imports.filter((record) => ["exception", "error", "interrupted"].includes(record.status));
    return {
      reviewed,
      structural,
      flagged,
      observations: Store.openIssueCount(),
      observationsTotal: Store.state.issues.length,
      exceptions: exceptions.length,
      exams: Store.state.exams.length,
      pct: questions.length ? (reviewed / questions.length) * 100 : 0,
    };
  }

  function auditRowHTML(exam) {
    const stats = Store.examStats(exam);
    return `<div class="audit-row">
      <div class="cycle-badge"><b>${esc(exam.cycle)}</b><span>${esc(exam.date || "")}</span></div>
      <div class="audit-main">
        <b>${esc(Store.professionById(exam.professionId)?.name || exam.professionId)} · ${exam.imported ? "Importado" : "Oficial"}</b>
        <span>${plural(stats.questions, "pregunta")} · ${pct(stats.coverage)} cobertura · ${stats.incidents ? plural(stats.incidents, "observación", "observaciones") : "sin observaciones"} · ${stats.flags ? plural(stats.flags, "marcada", "marcadas") : "sin marcas"}</span>
        <div class="audit-progress">${reviewTrack(stats.reviewPct)}<span>${fmt(stats.reviewed)}/${fmt(stats.questions)} revisadas</span></div>
      </div>
      <a class="btn" href="#review/${esc(encodeURIComponent(exam.id))}">${icon("check-circle")} Revisar</a>
    </div>`;
  }

  function reviewExamListHTML() {
    const search = normalize(APP.review.examQuery);
    const exams = [...Store.state.exams]
      .filter((exam) => !search || normalize(`${exam.title} ${professionName(exam.professionId)} ${exam.cycle}`).includes(search))
      .sort((a, b) => String(professionName(a.professionId)).localeCompare(String(professionName(b.professionId)), "es") || (b.year - a.year));
    if (!exams.length) return emptyState("search", "Sin exámenes", "No hay exámenes que coincidan con la búsqueda.");
    return `<div class="review-list">${exams.map(auditRowHTML).join("")}</div>`;
  }

  function reviewView() {
    const stats = reviewStats();
    const tabs = [
      ["exams", "Exámenes", Store.state.exams.length],
      ["queue", "Cola de preguntas", stats.structural + stats.flagged],
      ["observations", "Observaciones", stats.observations],
      ["exceptions", "Excepciones", stats.exceptions],
    ];
    const tab = APP.review.tab || "exams";
    let body = "";
    if (tab === "exams") {
      body = `<div class="bank-toolbar review-toolbar review-list-toolbar glass" style="margin-bottom:12px">
        <div class="search">${icon("search")}<input type="search" data-review-exam-search value="${esc(APP.review.examQuery)}" placeholder="Buscar examen o profesión…" aria-label="Buscar examen"></div>
        <span class="small muted">${Store.state.exams.length} exámenes · ${fmt(stats.reviewed)} preguntas revisadas</span>
      </div>${reviewExamListHTML()}`;
    } else if (tab === "queue") {
      const problems = Store.state.questions.filter((question) => question.status !== "valid" || !question.correct || Store.reviewInfo(question).flagged);
      body = problems.length
        ? `<div class="review-list">${problems.slice(0, 250).map((question) => {
          const review = Store.reviewInfo(question);
          return `<div class="audit-row">
            <div class="cycle-badge"><b>#${question.num}</b><span>${esc(question.cycle)}</span></div>
            <div class="audit-main"><b>${esc(Store.professionById(question.professionId)?.short || question.professionId)} · ${esc(Store.examById(question.examId)?.file || "")}</b><span>${esc(question.statement).slice(0, 180)}${question.statement.length > 180 ? "…" : ""}</span><div class="audit-progress">${question.status !== "valid" ? '<span class="pill bad">Sin clave</span>' : ""}${review.flagged ? '<span class="pill warn">Incidencia marcada</span>' : ""}<span>p. ${question.page}</span></div></div>
            <button class="btn" type="button" data-act="review-question" data-id="${esc(question.id)}">Abrir</button>
          </div>`;
        }).join("")}</div>${problems.length > 250 ? `<p class="small muted" style="padding:12px">Mostrando 250 de ${problems.length}.</p>` : ""}`
        : emptyState("check-circle", "Sin incidencias estructurales", "Todas las preguntas del banco tienen una clave única. Las marcas humanas y las observaciones documentales aparecen en las otras pestañas.");
    } else if (tab === "observations") {
      let issues = [...Store.state.issues].sort((a, b) => String(a.examId).localeCompare(String(b.examId)) || (a.page || 0) - (b.page || 0));
      if (!APP.review.obsAll) issues = issues.filter((issue) => !Store.issueIsResolved(issue));
      body = `<div class="review-list">
        <div class="audit-row"><div></div><div class="audit-main"><b>Observaciones documentales</b><span>Resaltados incidentales y artefactos de maquetación. No se usaron como respuestas.</span></div><button class="btn btn-sm" type="button" data-act="review-obs-toggle">${APP.review.obsAll ? "Ver pendientes" : "Ver todas"}</button></div>
        ${issues.length ? issues.map((issue) => {
          const exam = Store.examById(issue.examId);
          const resolved = Store.issueIsResolved(issue);
          return `<div class="observation">
            <span class="status-dot ${resolved ? "ok" : issue.severity === "alta" ? "bad" : "warn"}"></span>
            <div><b>${esc(Store.professionById(issue.professionId)?.short || issue.examId)} · ${esc(issueLabel(issue.type))}</b><p>${esc(issue.detail || issue.snippet || "Observación documental.")}</p>${issue.snippet ? `<p class="mono">“${esc(issue.snippet)}”</p>` : ""}<div class="issue-meta">${exam ? `${esc(exam.file)} · ` : ""}página ${issue.page || "-"} ${issue.questions?.length ? `· pregunta ${issue.questions.join(", ")}` : ""} ${resolved ? "· resuelta" : ""}</div></div>
            <div class="act">${issue.page ? `<button class="btn btn-sm" type="button" data-act="obs-open-pdf" data-exam="${esc(issue.examId)}" data-page="${issue.page}">${icon("file")} PDF</button>` : ""}<button class="btn btn-sm ${resolved ? "" : "btn-soft"}" type="button" data-act="${resolved ? "obs-reopen" : "obs-resolve"}" data-id="${esc(issue.id)}">${resolved ? "Reabrir" : "Resolver"}</button></div>
          </div>`;
        }).join("") : emptyState("check-circle", "Sin observaciones pendientes", "Todas las observaciones documentales están marcadas como resueltas.")}</div>`;
    } else {
      const exceptions = Store.state.imports.filter((record) => ["exception", "error", "interrupted"].includes(record.status));
      const importedPending = Store.state.exams.filter((exam) => exam.imported && exam.audit?.status !== "validado");
      body = `${exceptions.length ? exceptions.map(exceptionCardHTML).join("") : emptyState("check-circle", "Sin excepciones", "No hay archivos pendientes de clasificación o reintento.")}
        ${importedPending.length ? `<div style="margin-top:18px"><div class="prof-section-head"><h2>Exámenes importados con revisión pendiente</h2><span>${importedPending.length}</span></div><div class="review-list">${importedPending.map(auditRowHTML).join("")}</div></div>` : ""}`;
    }
    return `<div class="page">
      <div class="page-head"><div><div class="breadcrumb"><a href="#hub">Banqueo</a>${icon("chevron-right")}<span>Revisión</span></div><h1>Revisión y auditoría</h1><p class="lead">Cada pregunta conserva su documento y página. La validación estructural no sustituye la revisión humana.</p></div><div class="page-head-actions"><button class="btn" type="button" data-act="info">${icon("info")} Cómo se procesó</button></div></div>
      <div class="review-stats">
        <div class="review-stat"><b>${fmt(stats.reviewed)}</b><span>Preguntas revisadas</span></div>
        <div class="review-stat"><b>${fmt(stats.structural)}</b><span>Sin clave</span></div>
        <div class="review-stat"><b>${fmt(stats.observations)}</b><span>Observaciones abiertas</span></div>
        <div class="review-stat"><b>${pct(stats.pct)}</b><span>Avance de revisión</span></div>
      </div>
      <div class="review-tabs" role="tablist">
        ${tabs.map(([value, label, count]) => `<button class="review-tab ${tab === value ? "is-active" : ""}" type="button" role="tab" aria-selected="${tab === value}" data-act="review-tab" data-tab="${value}">${label}<span class="n">${fmt(count)}</span></button>`).join("")}
      </div>
      ${body}
    </div>`;
  }

  function exceptionCardHTML(record) {
    const analysis = record.analysis || {};
    const classification = analysis.classification || {};
    const professionId = classification.professionId || classification.suggestedProfessionId || "";
    const year = classification.year || "";
    const convocatoria = classification.convocatoria || "";
    const title = record.title || analysis.suggestedTitle || record.name.replace(/\.pdf$/i, "");
    const canReview = Boolean(analysis && analysis.questions);
    return `<div class="exception-card" style="margin-bottom:8px">
      <h3>${esc(record.name)}</h3>
      <p>${esc(record.status === "interrupted" ? "El análisis se interrumpió. Puedes reintentarlo desde el archivo original." : record.message || "Este PDF necesita una decisión manual antes de entrar al banco.")}</p>
      ${canReview ? `<div class="exception-form">
        <label><span>Profesión</span><select data-exc-prof="${esc(record.id)}">${Store.state.professions.map((profession) => `<option value="${esc(profession.id)}" ${profession.id === professionId ? "selected" : ""}>${esc(profession.name)}</option>`).join("")}</select></label>
        <label><span>Año</span><input type="number" min="2000" max="2100" value="${esc(year)}" data-exc-year="${esc(record.id)}"></label>
        <label><span>Convocatoria</span><input value="${esc(convocatoria)}" placeholder="I / II" data-exc-conv="${esc(record.id)}"></label>
        <button class="btn btn-primary" type="button" data-act="exception-save" data-id="${esc(record.id)}">Asignar y guardar</button>
      </div>` : `<div class="exception-form"><button class="btn" type="button" data-act="exception-retry" data-id="${esc(record.id)}">${icon("refresh")} Reintentar análisis</button><a class="btn btn-ghost" href="#import">Ver importación</a></div>`}
    </div>`;
  }

  function reviewExamItems() {
    const items = Store.filterQuestions({
      examId: APP.review.examId,
      query: APP.review.query,
      filter: APP.review.filter,
    });
    return [...items].sort((a, b) => (a.num || 0) - (b.num || 0));
  }

  function reviewExamView() {
    const exam = Store.examById(APP.review.examId);
    if (!exam) return `<div class="page">${emptyState("alert", "Examen no encontrado", "El examen ya no existe en este banco.", `<a class="btn btn-primary" href="#review">Volver a revisión</a>`)}</div>`;
    const items = reviewExamItems();
    let selected = items.find((question) => question.id === APP.review.selectedId) || null;
    if (!selected && items.length && (isDesktop() || APP.review.detailOpen)) {
      selected = items[0];
      APP.review.selectedId = selected.id;
    }
    const stats = Store.examStats(exam);
    const detailOpen = Boolean(APP.review.detailOpen || isDesktop());
    const issues = Store.issuesForExam(exam.id);
    const openIssues = issues.filter((issue) => !Store.issueIsResolved(issue)).length;
    const filters = [
      ["all", "Todas"],
      ["unreviewed", "Sin revisar"],
      ["reviewed", "Revisadas"],
      ["incidents", "Incidencias"],
      ["duplicates", "Duplicadas"],
    ];
    return `<div class="page">
      <div class="review-exam-head">
        <div>
          <div class="breadcrumb"><a href="#hub">Banqueo</a>${icon("chevron-right")}<a href="#review">Revisión</a>${icon("chevron-right")}<span>${esc(exam.cycle)}</span></div>
          <h1>${esc(Store.professionById(exam.professionId)?.name || exam.professionId)}</h1>
          <p>${esc(exam.title)} · ${plural(examQuestionCount(exam), "pregunta")} · ${plural(exam.pages, "página")} · ${esc(exam.file)}</p>
          <div class="review-summary">${statusPill(exam)}<span class="pill">${pct(stats.coverage)} cobertura</span><span class="pill">${fmt(stats.reviewed)}/${fmt(stats.questions)} revisadas</span>${openIssues ? `<span class="pill warn" data-tip="${esc(examIssueTip(exam))}" aria-label="${esc(examIssueTip(exam))}" tabindex="0">${plural(openIssues, "observación abierta", "observaciones abiertas")}</span>` : ""}${stats.flags ? `<span class="pill warn">${plural(stats.flags, "marcada", "marcadas")}</span>` : ""}</div>
        </div>
        <div class="page-head-actions"><a class="btn" href="#review">${icon("arrow-left")} Volver</a><button class="btn" type="button" data-act="open-exam-pdf" data-exam="${esc(exam.id)}">${icon("file")} PDF original</button></div>
      </div>
      <div class="bank-toolbar review-toolbar glass">
        <div class="search">${icon("search")}<input type="search" data-review-search value="${esc(APP.review.query)}" placeholder="Buscar en este examen…" aria-label="Buscar en el examen"></div>
        <div class="chips" role="group" aria-label="Filtros de revisión">${filters.map(([value, label]) => `<button class="chip ${APP.review.filter === value ? "is-active" : ""}" type="button" data-act="review-filter" data-filter="${value}">${label}</button>`).join("")}</div>
        <div class="pill dark" style="justify-self:end">${fmt(items.length)} preguntas</div>
      </div>
      <div class="bank-meta-line"><span><b>${fmt(stats.reviewed)}</b> de ${fmt(stats.questions)} revisadas · ${fmt(stats.structural ?? stats.pending)} sin clave</span><span>${stats.incidents ? `${plural(stats.incidents, "observación documental", "observaciones documentales")} · no bloquean la práctica` : "Sin observaciones documentales"}</span></div>
      <div class="bank-grid ${detailOpen ? "detail-open" : ""}">
        <section class="qlist-panel glass" aria-label="Preguntas del examen">${questionListHTML(items, selected, "review")}</section>
        <section class="qdetail-panel glass" aria-label="Revisión de la pregunta">${questionDetailHTML(selected, { mode: "review", items })}</section>
      </div>
    </div>`;
  }

  function refreshReview() {
    if (APP.route.name !== "review") return;
    replaceApp(APP.review.examId ? reviewExamView() : reviewView());
    const detail = document.querySelector(".qdetail-scroll");
    if (detail) detail.scrollTop = 0;
    syncMobileDetail();
  }

  async function openIssuePdf(issue) {
    const exam = Store.examById(issue.examId);
    if (!exam) return;
    try {
      const result = await Store.openOriginal({ examId: exam.id, filePath: exam.filePath, page: issue.page || 1 });
      if (result === false) toast("El PDF original no está disponible.", "warn");
    } catch {
      toast("No se pudo abrir el PDF original.", "warn");
    }
  }

  /* ------------------------------------------------------------------------
     Importación de PDFs
     ------------------------------------------------------------------------ */
  function scratchRecords() {
    return APP.imports.scratch || [];
  }

  function allImportRecords() {
    return [...Store.state.imports, ...scratchRecords()];
  }

  function importStatusLabel(record) {
    const labels = {
      processing: ["Procesando", "info"],
      ready: ["Listo para revisar", "ok"],
      exception: ["Excepción", "bad"],
      error: ["Error", "bad"],
      interrupted: ["Interrumpido", "warn"],
      saved: ["Guardado", "ok"],
      duplicate: ["Duplicado", "warn"],
    };
    return labels[record.status] || ["Pendiente", ""];
  }

  function queueItemHTML(record) {
    const [label, tone] = importStatusLabel(record);
    const analysis = record.analysis || {};
    const classification = analysis.classification || {};
    const cycle = classification.cycle || "";
    const profession = Store.professionById(classification.professionId)?.short || classification.suggestedProfessionName || "Sin clasificar";
    const progress = record.status === "processing" ? clamp(record.progress || 0, 0, 100) : 0;
    const selected = APP.imports.selectedId === record.id;
    const actions = [];
    if (record.analysis && record.status !== "saved") actions.push(`<button class="btn btn-sm" type="button" data-act="import-select" data-id="${esc(record.id)}">Revisar</button>`);
    if (record.status === "saved" && record.examId) actions.push(`<a class="btn btn-sm" href="#bank/${esc(encodeURIComponent(Store.examById(record.examId)?.professionId || ""))}/${esc(encodeURIComponent(record.examId))}">Abrir</a>`);
    if (["error", "interrupted"].includes(record.status)) actions.push(`<button class="btn btn-sm" type="button" data-act="import-retry" data-id="${esc(record.id)}">${icon("refresh")} Reintentar</button>`);
    return `<div class="queue-item ${selected ? "is-selected" : ""}" data-import-id="${esc(record.id)}">
      <span class="file-ico">${icon(record.status === "duplicate" ? "copy" : "pdf")}</span>
      <div class="queue-main">
        <b title="${esc(record.name)}">${esc(record.name)}</b>
        <span>${bytes(record.size)} · ${analysis.pages ? plural(analysis.pages, "página") : ""} ${cycle ? `· ${esc(cycle)}` : ""} ${analysis.questions ? `· ${plural(analysis.questions.length, "pregunta")}` : ""} · ${esc(profession)}</span>
        ${record.status === "processing" ? `<div class="progressbar"><i style="--p:${progress / 100}"></i></div>` : ""}
        <span class="queue-message">${esc(record.message || "")}</span>
      </div>
      <div class="queue-status"><span class="pill ${tone}"><span class="status-dot ${tone}"></span>${label}</span>${actions.join("")}</div>
    </div>`;
  }

  function importIssuesHTML(record) {
    const analysis = record.analysis || {};
    const issues = (analysis.issues || []).slice(0, 18);
    if (!issues.length) return `<div class="small muted" style="padding:8px 0">Sin observaciones automáticas.</div>`;
    return `<div class="issue-list">${issues.map((issue) => `<div class="issue">
      <span class="status-dot ${issue.severity === "alta" ? "bad" : issue.severity === "media" ? "warn" : "info"}"></span>
      <div><b>${esc(issueLabel(issue.type))}</b> ${esc(issue.detail || "")}<span class="issue-meta">${issue.page ? `Página ${issue.page}` : ""} ${issue.snippet ? `· “${esc(issue.snippet).slice(0, 120)}”` : ""}</span></div>
      ${issue.page ? `<button class="btn btn-sm" type="button" data-act="import-open-page" data-id="${esc(record.id)}" data-page="${issue.page}">PDF</button>` : ""}
    </div>`).join("")}</div>`;
  }

  function importReviewHTML(record) {
    if (!record) return "";
    const analysis = record.analysis || {};
    const classification = analysis.classification || {};
    const saved = record.status === "saved";
    if (saved) {
      const exam = Store.examById(record.examId);
      return `<section class="review-import glass" id="import-review">
        <div class="review-import-head"><div><h2>${esc(record.name)}</h2><p>Documento original conservado · ${bytes(record.size)} · hash ${esc(hashShort(record.hash))}</p></div><span class="pill ok"><span class="status-dot ok"></span>Guardado</span></div>
        <div class="coverage">${icon("check-circle")}<span><b>Este PDF ya forma parte del banco.</b> ${exam ? `${esc(Store.professionById(exam.professionId)?.name || exam.professionId)} · ${esc(exam.cycle)} · ${plural(examQuestionCount(exam), "pregunta")}` : ""}</span></div>
        <div class="review-actions" style="margin-top:14px"><span class="spacer"></span><button class="btn btn-ghost" type="button" data-act="import-discard" data-id="${esc(record.id)}">${icon("trash")} Quitar registro</button>${exam ? `<a class="btn btn-primary" href="#bank/${esc(encodeURIComponent(exam.professionId))}/${esc(encodeURIComponent(exam.id))}">Abrir en el banco ${icon("arrow-right")}</a>` : ""}</div>
      </section>`;
    }
    if (!record.analysis) {
      return `<section class="review-import glass" id="import-review">
        <div class="review-import-head"><div><h2>${esc(record.name)}</h2><p>${esc(record.message || "Esperando análisis.")}</p></div><span class="pill ${importStatusLabel(record)[1]}">${importStatusLabel(record)[0]}</span></div>
        ${record.status === "processing" ? `<div class="empty"><div class="spinner"></div><b>Procesando el PDF</b><p>Se están leyendo todas las páginas y detectando los resaltados. Esto puede tardar unos segundos.</p><div class="progressbar" style="width:min(420px,100%);margin-top:14px"><i style="--p:${clamp(record.progress || 0, 0, 100) / 100}"></i></div></div>` : `<div class="empty"><div class="empty-icon">${icon("alert")}</div><b>No hay un análisis disponible</b><p>${esc(record.message || "Reintenta la lectura del archivo original.")}</p><button class="btn btn-primary" type="button" data-act="import-retry" data-id="${esc(record.id)}">${icon("refresh")} Reintentar</button></div>`}
      </section>`;
    }
    const professionId = classification.professionId || classification.suggestedProfessionId || "";
    const profession = Store.professionById(professionId);
    const title = record.title || analysis.suggestedTitle || `${profession?.name || "Examen"} · SERUMS ${classification.cycle || ""}`;
    const audit = analysis.audit || {};
    const pending = (analysis.questions || []).filter((question) => question.st !== "valid" || !question.c);
    const ready = audit.status === "validado" && pending.length === 0;
    return `<section class="review-import glass" id="import-review">
      <div class="review-import-head">
        <div><h2>${esc(record.name)}</h2><p>${plural(analysis.pages || 0, "página")} · ${bytes(record.size)} · hash ${esc(hashShort(analysis.hash || record.hash))} · ${saved ? "guardado en el banco" : "listo para revisar"}</p></div>
        <span class="pill ${ready ? "ok" : "warn"}"><span class="status-dot ${ready ? "ok" : "warn"}"></span>${ready ? "Validación estructural completa" : "Requiere revisión"}</span>
      </div>
      <div class="classification">
        <div><span>Profesión detectada</span><b>${esc(profession?.name || classification.professionName || classification.suggestedProfessionName || "No determinada")}</b></div>
        <div><span>Ciclo detectado</span><b>${esc(classification.cycle || "No determinado")}</b></div>
        <div><span>Confianza</span><b>${esc(classification.confidence || "baja")}${classification.professionId ? " · contenido" : " · requiere decisión"}</b></div>
      </div>
      <div class="import-fields">
        <label class="field"><span>Profesión</span><select data-import-field="profession">${Store.state.professions.map((item) => `<option value="${esc(item.id)}" ${item.id === professionId ? "selected" : ""}>${esc(item.name)}</option>`).join("")}</select></label>
        <label class="field"><span>Año</span><input type="number" min="2000" max="2100" data-import-field="year" value="${esc(classification.year || "")}"></label>
        <label class="field"><span>Convocatoria</span><input data-import-field="convocatoria" value="${esc(classification.convocatoria || "")}" placeholder="I / II"></label>
      </div>
      <label class="field"><span>Título del examen</span><input data-import-field="title" value="${esc(title)}"></label>
      <div class="audit-stats" style="margin-top:14px">
        <div class="audit-stat"><b>${fmt(audit.pagesProcessed || analysis.pages)}</b><span>Páginas</span></div>
        <div class="audit-stat"><b>${fmt(audit.questionsDetected || analysis.questions.length)}</b><span>Preguntas</span></div>
        <div class="audit-stat"><b>${fmt(audit.answersIdentified || 0)}</b><span>Claves</span></div>
        <div class="audit-stat"><b>${fmt(audit.reviewRequired || pending.length)}</b><span>Por revisar</span></div>
      </div>
      ${importIssuesHTML(record)}
      ${pending.length ? `<div class="pending-preview"><div class="prof-section-head"><h2>Preguntas que necesitan revisión</h2><span>${pending.length}</span></div>${pending.slice(0, 8).map((question) => `<div class="pending-row"><span><b>#${question.n}</b> ${esc(question.s).slice(0, 150)}${question.s.length > 150 ? "…" : ""}</span><span>p. ${question.p} · ${question.c ? `clave ${esc(question.c)}` : "sin clave"}</span></div>`).join("")}${pending.length > 8 ? `<span class="small muted">+${pending.length - 8} más en la revisión del examen.</span>` : ""}</div>` : ""}
      <div class="review-actions">
        <button class="btn btn-ghost" type="button" data-act="import-discard" data-id="${esc(record.id)}">${icon("trash")} Descartar</button>
        <span class="spacer"></span>
        <button class="btn" type="button" data-act="import-retry" data-id="${esc(record.id)}">${icon("refresh")} Reanalizar</button>
        ${saved ? `<a class="btn btn-primary" href="#bank/${esc(encodeURIComponent(Store.examById(record.examId)?.professionId || professionId))}/${esc(encodeURIComponent(record.examId || ""))}">Abrir en el banco ${icon("arrow-right")}</a>` : `<button class="btn btn-primary" type="button" data-act="import-save" data-id="${esc(record.id)}">${icon("check")} Guardar en el banco</button>`}
      </div>
    </section>`;
  }

  function importView() {
    const records = allImportRecords();
    const selected = records.find((record) => record.id === APP.imports.selectedId) || records.find((record) => record.analysis) || records[0] || null;
    if (selected && !APP.imports.selectedId) APP.imports.selectedId = selected.id;
    const pending = records.filter((record) => ["processing", "ready", "exception", "error", "interrupted"].includes(record.status)).length;
    const imported = Store.state.exams.filter((exam) => exam.imported).length;
    return `<div class="page">
      <div class="page-head"><div><div class="breadcrumb"><a href="#hub">Banqueo</a>${icon("chevron-right")}<span>Importar</span></div><h1>Importar exámenes</h1><p class="lead">Procesa PDFs nuevos, clasifícalos por contenido y envíalos a revisión antes de usarlos. Los originales se conservan intactos.</p></div><div class="page-head-actions"><button class="btn" type="button" data-act="info">${icon("info")} Cómo se procesó</button><a class="btn" href="#review">${icon("check-circle")} Revisión</a></div></div>
      <div class="import-grid">
        <div>
          <div class="drop" id="import-drop">
            <div>
              <div class="drop-icon">${icon("upload")}</div>
              <h2>Arrastra los PDFs aquí</h2>
              <p>Se procesan en tu dispositivo. Se leen todas las páginas, se reconstruyen las preguntas y se buscan los resaltados amarillos. Nada se envía a un servidor.</p>
              <div class="drop-actions"><button class="btn btn-primary" type="button" data-act="import-pick">${icon("folder")} Seleccionar PDFs</button><span class="pill">PDF · máx. ${Parser?.MAXMB || 60} MB</span></div>
              <label class="check-row" style="justify-content:center;margin-top:16px"><input type="checkbox" data-import-ocr ${APP.imports.ocr ? "checked" : ""}> Aplicar OCR solo a páginas sin texto <span class="muted">(más lento)</span></label>
              <input type="file" data-import-input multiple accept="application/pdf,.pdf" hidden>
            </div>
          </div>
          <div class="queue-panel glass">
            <div class="queue-head"><h2>Cola de importación</h2><span>${records.length ? `${records.length} archivos · ${pending} pendientes` : "Sin archivos todavía"}</span></div>
            <div class="queue" id="import-queue">${records.length ? records.map(queueItemHTML).join("") : `<div class="small muted" style="padding:10px 2px">Los archivos que importes aparecerán aquí con su clasificación y estado.</div>`}</div>
          </div>
        </div>
        <aside class="import-side">
          <div class="import-tip glass"><h3>Qué se conserva</h3><p>El PDF original completo, el hash, el número de página y la evidencia de cada clave. Los duplicados se señalan, no se borran.</p></div>
          <div class="import-tip glass"><h3>Qué se revisa</h3><p>Si el resaltado no es único, si faltan alternativas, si el encabezado no identifica la profesión o si una página necesita OCR, el archivo no se declara completo.</p></div>
          <div class="import-tip glass"><h3>Estado actual</h3><p>${fmt(Store.state.stats.exams)} exámenes (${fmt(imported)} importados) · ${fmt(pending)} trabajos pendientes · ${fmt(Store.state.stats.reviewed)} preguntas revisadas.</p></div>
        </aside>
      </div>
      ${selected ? importReviewHTML(selected) : ""}
    </div>`;
  }

  function cleanupAnalysis(analysis) {
    return {
      ...analysis,
      questions: (analysis.questions || []).map((question) => {
        const clean = { ...question };
        delete clean.statementLines;
        return clean;
      }),
    };
  }

  function updateImportProgressDOM(record) {
    const item = document.querySelector(`[data-import-id="${record.id}"]`);
    if (!item) return;
    const bar = item.querySelector(".progressbar i");
    if (bar) bar.style.setProperty("--p", clamp(record.progress || 0, 0, 100) / 100);
    const message = item.querySelector(".queue-message");
    if (message) message.textContent = record.message || "";
  }

  function refreshImport() {
    if (APP.route.name !== "import") return;
    replaceApp(importView());
    setupDropZone();
  }

  async function analyzeImportRecord(record, buffer) {
    record.status = "processing";
    record.message = "Procesando el PDF…";
    record.progress = 0;
    await Store.updateImport(record.id, { status: "processing", message: record.message, progress: 0, analysis: null });
    refreshImport();
    try {
      if (!Parser) throw new Error("El motor de PDF no está disponible. Comprueba la conexión e inténtalo de nuevo.");
      const analysis = await Parser.analyzeBuffer(buffer, record.name, { ocr: APP.imports.ocr }, (progress) => {
        if (progress.stage === "ocr") {
          record.progress = Math.max(record.progress || 0, Math.round((progress.progress || 0) * 100));
          record.message = progress.message || "Aplicando OCR…";
        } else if (progress.page) {
          record.progress = Math.round((progress.page / progress.total) * 100);
          record.message = progress.message || `Analizando página ${progress.page}…`;
        }
        updateImportProgressDOM(record);
      });
      const cleaned = cleanupAnalysis(analysis);
      const complete = cleaned.classification.professionId && cleaned.classification.year && cleaned.classification.convocatoria;
      const status = complete ? "ready" : "exception";
      const message = complete ? "Listo para revisar y guardar." : "Clasificación incompleta: selecciona profesión, año y convocatoria.";
      await Store.updateImport(record.id, { status, message, analysis: cleaned, progress: 100, title: cleaned.suggestedTitle });
      APP.imports.selectedId = record.id;
      refreshImport();
      toast(complete ? "PDF analizado. Revisa la clasificación antes de guardar." : "PDF analizado, pero necesita clasificación manual.", complete ? "ok" : "warn");
      return cleaned;
    } catch (error) {
      await Store.updateImport(record.id, { status: "error", message: error.message || "No se pudo procesar el PDF.", progress: 0 });
      refreshImport();
      toast(error.message || "No se pudo procesar el PDF.", "warn");
      return null;
    }
  }

  async function processPdfFiles(fileList) {
    const files = [...fileList].filter((file) => file && (/pdf$/i.test(file.name) || file.type === "application/pdf"));
    if (!files.length) { toast("Selecciona uno o más archivos PDF.", "warn"); return; }
    if (!Parser) { toast("El motor de PDF no está disponible. Comprueba la conexión.", "warn"); return; }
    APP.imports.processing = true;
    try {
      for (const file of files) {
        if (file.size > (Parser.MAXMB || 60) * 1048576) { toast(`${file.name} supera el límite de tamaño.`, "warn"); continue; }
        try {
          const buffer = await file.arrayBuffer();
          const hash = await Parser.sha256(buffer);
          const duplicateExam = Store.state.exams.find((exam) => exam.fileHash === hash);
          if (duplicateExam) {
            APP.imports.scratch.unshift({ id: `duplicate-${hash.slice(0, 12)}`, name: file.name, size: file.size, status: "duplicate", message: "Este PDF ya está en el banco. No se duplicó.", createdAt: Date.now() });
            refreshImport();
            toast(`${file.name}: ya existe en el banco.`, "warn");
            continue;
          }
          const queued = Store.state.imports.find((record) => record.hash === hash && record.status !== "saved");
          if (queued) {
            APP.imports.selectedId = queued.id;
            if (["error", "interrupted"].includes(queued.status)) {
              toast(`${file.name}: se reintenta el análisis pendiente.`, "ok");
              await analyzeImportRecord(queued, buffer);
            } else {
              refreshImport();
              toast(`${file.name}: ya está en la cola de importación.`, "warn");
            }
            continue;
          }
          const fileId = await Store.saveFile(file.name, buffer, file.type, hash);
          const record = await Store.createImportRecord(file, hash, fileId);
          APP.imports.selectedId = record.id;
          await analyzeImportRecord(record, buffer);
        } catch (error) {
          toast(`${file.name}: ${error.message || "no se pudo leer"}`, "warn");
        }
      }
    } finally {
      APP.imports.processing = false;
      refreshImport();
    }
  }

  async function retryImportRecord(recordId) {
    const record = Store.state.imports.find((item) => item.id === recordId);
    if (!record) return;
    if (!record.fileId) { toast("No se conserva el archivo original para reintentar.", "warn"); return; }
    const file = await Store.getFile(record.fileId);
    if (!file?.buffer) { toast("No se encontró el PDF original en el almacenamiento local.", "warn"); return; }
    await analyzeImportRecord(record, file.buffer);
  }

  async function saveImportRecord(recordId) {
    const record = Store.state.imports.find((item) => item.id === recordId);
    if (!record?.analysis) { toast("Este archivo no tiene un análisis para guardar.", "warn"); return; }
    const root = document.getElementById("import-review");
    const professionId = root?.querySelector('[data-import-field="profession"]')?.value;
    const year = Number(root?.querySelector('[data-import-field="year"]')?.value || 0);
    const convocatoria = String(root?.querySelector('[data-import-field="convocatoria"]')?.value || "").trim();
    const title = root?.querySelector('[data-import-field="title"]')?.value?.trim();
    if (!professionId) { toast("Selecciona una profesión antes de guardar.", "warn"); return; }
    if (!year || year < 2000 || year > 2100) { toast("Indica un año válido.", "warn"); return; }
    if (!convocatoria) { toast("Indica la convocatoria (por ejemplo, I o II).", "warn"); return; }
    try {
      const exam = await Store.saveAnalysis(record.id, record.analysis, { professionId, year, convocatoria, title });
      Store.rememberProfession(professionId);
      APP.bank.professionId = professionId;
      APP.bank.examId = exam.id;
      APP.bank.selectedId = null;
      APP.bank.detailOpen = false;
      toast(`Examen guardado: ${exam.title}`, "ok");
      location.hash = `#bank/${encodeURIComponent(professionId)}/${encodeURIComponent(exam.id)}`;
    } catch (error) {
      toast(error.message || "No se pudo guardar el examen.", "warn");
    }
  }

  async function saveExceptionRecord(recordId) {
    const record = Store.state.imports.find((item) => item.id === recordId);
    if (!record?.analysis) { toast("No hay un análisis para asignar.", "warn"); return; }
    const professionId = document.querySelector(`[data-exc-prof="${recordId}"]`)?.value;
    const year = Number(document.querySelector(`[data-exc-year="${recordId}"]`)?.value || 0);
    const convocatoria = String(document.querySelector(`[data-exc-conv="${recordId}"]`)?.value || "").trim();
    if (!professionId || !year || !convocatoria) { toast("Completa profesión, año y convocatoria.", "warn"); return; }
    const title = `${Store.professionById(professionId)?.name || "Examen"} · SERUMS ${year}-${convocatoria} · Importado`;
    try {
      const exam = await Store.saveAnalysis(record.id, record.analysis, { professionId, year, convocatoria, title });
      Store.rememberProfession(professionId);
      toast("Excepción resuelta y examen guardado.", "ok");
      location.hash = `#bank/${encodeURIComponent(professionId)}/${encodeURIComponent(exam.id)}`;
    } catch (error) {
      toast(error.message || "No se pudo guardar la excepción.", "warn");
    }
  }

  async function openImportPage(record, page) {
    if (!record?.fileId) return;
    const url = await Store.fileUrl(record.fileId);
    if (!url) { toast("No se encontró el PDF original.", "warn"); return; }
    window.open(url + (page ? `#page=${page}` : ""), "_blank", "noopener");
  }

  function setupDropZone() {
    const drop = document.getElementById("import-drop");
    if (!drop || drop.dataset.ready) return;
    drop.dataset.ready = "1";
    ["dragenter", "dragover"].forEach((eventName) => drop.addEventListener(eventName, (event) => { event.preventDefault(); drop.classList.add("is-over"); }));
    ["dragleave", "drop"].forEach((eventName) => drop.addEventListener(eventName, (event) => { event.preventDefault(); drop.classList.remove("is-over"); }));
    drop.addEventListener("drop", (event) => {
      if (event.dataTransfer?.files?.length) processPdfFiles(event.dataTransfer.files);
    });
  }

  /* ------------------------------------------------------------------------
     Práctica
     ------------------------------------------------------------------------ */
  let practiceTimer = null;
  let practiceSaveTimer = null;

  function allExamsForSelect() {
    return Store.state.professions
      .map((profession) => ({ profession, exams: Store.examList(profession.id) }))
      .filter((group) => group.exams.length);
  }

  function practiceSelectedExam() {
    const all = Store.examList();
    const selected = APP.practice.setup.examId ? Store.examById(APP.practice.setup.examId) : null;
    return selected || all[0] || null;
  }

  function validQuestionsFor(exam) {
    return (exam?.questions || []).filter((question) => question.status === "valid" && question.correct);
  }

  function practiceView() {
    if (APP.route.section === "result") return practiceResultView();
    if (APP.route.section === "session") {
      if (APP.practice.session) return practiceSessionView();
      return practiceSetupHTML("No hay una práctica en curso. Elige un examen para empezar.");
    }
    return practiceSetupHTML();
  }

  function practiceSetupHTML(notice = "") {
    const exam = practiceSelectedExam();
    const groups = allExamsForSelect();
    const available = validQuestionsFor(exam).length;
    const resumes = Store.state.attempts.filter((attempt) => attempt.status === "prog" && (!exam || attempt.examId === exam.id));
    return `<div class="page"><div class="setup-wrap">
      <div class="page-head"><div><div class="breadcrumb"><a href="#hub">Banqueo</a>${icon("chevron-right")}<a href="#bank/${esc(encodeURIComponent(exam?.professionId || Store.lastProfession()))}">Banco</a>${icon("chevron-right")}<span>Práctica</span></div><h1>Practicar</h1><p class="lead">Entrena con una selección de preguntas validadas. Al terminar verás el detalle y podrás guardar el intento en tu progreso local.</p></div></div>
      ${notice ? `<div class="coverage" style="margin:0 0 14px">${icon("info")}<span>${esc(notice)}</span></div>` : ""}
      <div class="setup-card glass">
        <div class="setup-head">${professionIcon(Store.professionById(exam?.professionId) || activeProfession())}<div><h1>${esc(exam ? Store.professionById(exam.professionId)?.name || exam.title : "Elige un examen")}</h1><p>${exam ? `${esc(exam.cycle)} · ${plural(available, "pregunta disponible")} · ${esc(exam.file)}` : "Selecciona un examen del banco."}</p></div></div>
        <div class="setup-form">
          <label class="field"><span>Examen <span class="hint">51 documentos oficiales + importados</span></span><select data-practice-exam>${groups.map(({ profession, exams }) => `<optgroup label="${esc(profession.name)}">${exams.map((item) => `<option value="${esc(item.id)}" ${exam?.id === item.id ? "selected" : ""}>${esc(item.cycle)} · ${item.imported ? "Importado" : "Oficial"} · ${validQuestionsFor(item).length} preguntas</option>`).join("")}</optgroup>`).join("")}</select></label>
          <div class="form-grid">
            <label class="field"><span>Cantidad de preguntas</span><select data-practice-count>${[10, 25, 50, 100].map((count) => `<option value="${count}" ${Number(APP.practice.setup.count) === count ? "selected" : ""}>${count} preguntas</option>`).join("")}</select><span class="hint">Hay ${available} disponibles en este examen.</span></label>
            <label class="field"><span>Tiempo</span><select data-practice-minutes>${[0, 30, 60, 90].map((minutes) => `<option value="${minutes}" ${Number(APP.practice.setup.minutes) === minutes ? "selected" : ""}>${minutes ? `${minutes} minutos` : "Sin límite"}</option>`).join("")}</select></label>
          </div>
          <div class="mode-choice">
            <label class="mode-option"><input type="radio" name="practice-mode" value="practice" ${APP.practice.setup.mode !== "eval" ? "checked" : ""}><b>Práctica guiada</b><span>Muestra si acertaste al responder.</span></label>
            <label class="mode-option"><input type="radio" name="practice-mode" value="eval" ${APP.practice.setup.mode === "eval" ? "checked" : ""}><b>Simulacro</b><span>Oculta la clave hasta el final.</span></label>
          </div>
          <div class="form-grid">
            <label class="field"><span>Tu nombre <span class="hint">opcional, para el ranking local</span></span><input data-practice-name value="${esc(APP.practice.setup.name)}" placeholder="Invitado" maxlength="40"></label>
            <label class="check-row" style="align-self:end;min-height:40px"><input type="checkbox" data-practice-shuffle ${APP.practice.setup.shuffle ? "checked" : ""}> Mezclar el orden de las preguntas</label>
          </div>
          ${resumes.length ? `<div class="resume-list"><span class="small muted">Intentos en curso</span>${resumes.slice(0, 3).map((attempt) => `<div class="resume-row"><span><b>${esc(attempt.name || "Invitado")}</b> · ${esc(Store.examById(attempt.examId)?.cycle || "")} · ${Object.keys(attempt.answers || {}).length}/${attempt.count || "—"} respondidas</span><button class="btn btn-sm" type="button" data-act="practice-resume" data-id="${esc(attempt.id)}">Continuar</button></div>`).join("")}</div>` : ""}
          <div class="setup-actions"><button class="btn btn-primary btn-lg" type="button" data-act="practice-start" ${available ? "" : "disabled"}>${icon("play")} Comenzar práctica</button><a class="btn btn-ghost btn-lg" href="#bank/${esc(encodeURIComponent(exam?.professionId || Store.lastProfession()))}/${esc(encodeURIComponent(exam?.id || ""))}">Explorar antes</a></div>
        </div>
      </div>
    </div></div>`;
  }

  function practiceSessionView() {
    const session = APP.practice.session;
    if (!session) return practiceSetupHTML();
    const exam = Store.examById(session.examId);
    const question = Store.state.byId.get(session.order[session.index]) || Store.state.byId.get(session.order[0]);
    if (!question) return practiceSetupHTML("No se encontraron las preguntas de este intento.");
    const selected = session.answers[question.id] || "";
    const feedback = session.mode === "practice" && Boolean(selected);
    const correct = question.correct || question.c || "";
    const elapsed = Math.max(0, Math.round((Date.now() - session.startedAt) / 1000));
    const remaining = session.minutes > 0 ? session.minutes * 60 - elapsed : elapsed;
    const marked = Boolean(session.marks?.[question.id]);
    const answeredCount = Object.keys(session.answers || {}).length;
    return `<div class="page"><div class="practice-shell">
      <div class="practice-top glass">
        <button class="btn btn-sm btn-ghost" type="button" data-act="practice-exit">${icon("arrow-left")} Salir</button>
        <div class="pt-title"><b>${esc(Store.professionById(exam?.professionId)?.name || exam?.title || "Práctica")}</b><span>${esc(exam?.cycle || "")} · ${esc(session.name || "Invitado")} · ${session.mode === "eval" ? "Simulacro" : "Práctica guiada"} · ${session.count} preguntas</span></div>
        <span class="timer ${session.minutes > 0 && remaining < 120 ? "is-low" : ""}" id="practice-timer">${icon("clock")} ${clock(session.minutes > 0 ? remaining : elapsed)}</span>
        <button class="btn btn-sm" type="button" data-act="practice-finish">Terminar</button>
      </div>
      <div class="practice-progress"><i style="--p:${(session.index + 1) / session.count}"></i></div>
      <div class="practice-card glass">
        <div class="practice-kicker"><span>Pregunta ${session.index + 1} de ${session.count} · ${plural(answeredCount, "respondida", "respondidas")}</span>${marked ? `<span class="marked">${icon("flag")} Marcada para revisar</span>` : `<span>${esc(question.cycle)} · p. ${question.page}</span>`}</div>
        <div class="practice-question">${esc(question.statement)}</div>
        <div class="practice-options">
          ${question.o.map((option) => {
            const isSelected = selected === option.id;
            const showCorrect = feedback && correct === option.id;
            const showWrong = feedback && isSelected && correct !== option.id;
            return `<button class="option ${isSelected ? "is-selected" : ""} ${showCorrect ? "is-correct" : ""} ${showWrong ? "is-wrong" : ""}" type="button" data-act="practice-answer" data-letter="${esc(option.id)}">
              <b>${esc(option.id)}</b><span>${esc(option.text)}</span>
            </button>`;
          }).join("")}
        </div>
        ${feedback ? `<div class="evidence"><span class="status-dot ${selected === correct ? "ok" : "bad"}"></span><span><b>${selected === correct ? "Correcto." : `La clave es ${esc(correct)}.`}</b> ${question.ev ? `Resaltado amarillo en la página ${question.evPage || question.page}.` : "Clave registrada en el banco."}</span><button class="text-link" type="button" data-act="open-pdf" data-id="${esc(question.id)}">Ver PDF ${icon("external")}</button></div>` : ""}
        <div class="practice-foot">
          <button class="btn btn-sm" type="button" data-act="practice-prev" ${session.index === 0 ? "disabled" : ""}>${icon("chevron-left")} Anterior</button>
          <button class="btn btn-sm ${marked ? "btn-soft" : ""}" type="button" data-act="practice-mark">${icon("flag")} ${marked ? "Marcada" : "Marcar"}</button>
          <span class="spacer"></span>
          ${session.index >= session.count - 1
            ? `<button class="btn btn-primary" type="button" data-act="practice-finish">Ver resultados ${icon("check")}</button>`
            : `<button class="btn btn-primary" type="button" data-act="practice-next">Siguiente ${icon("chevron-right")}</button>`}
        </div>
      </div>
      <div class="palette glass" aria-label="Mapa de preguntas">
        ${session.order.map((id, index) => {
          const item = Store.state.byId.get(id);
          const answered = Boolean(session.answers[id]);
          const isMarked = Boolean(session.marks?.[id]);
          const resultClass = feedback && answered ? (session.answers[id] === (item?.correct || item?.c) ? "is-correct" : "is-wrong") : "";
          return `<button class="${index === session.index ? "is-current" : ""} ${answered ? "is-answered" : ""} ${isMarked ? "is-marked" : ""} ${resultClass}" type="button" data-act="practice-go" data-index="${index}" aria-label="Ir a la pregunta ${index + 1}">${index + 1}</button>`;
        }).join("")}
      </div>
    </div></div>`;
  }

  function refreshPractice() {
    if (APP.route.name !== "practice") return;
    replaceApp(practiceView());
    afterRender();
  }

  function shuffleArray(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const random = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[random]] = [copy[random], copy[index]];
    }
    return copy;
  }

  async function startPractice() {
    const exam = practiceSelectedExam();
    if (!exam) { toast("Selecciona un examen.", "warn"); return; }
    const available = validQuestionsFor(exam);
    if (!available.length) { toast("Este examen no tiene preguntas validadas para practicar.", "warn"); return; }
    const count = Math.min(Number(APP.practice.setup.count) || 25, available.length);
    const ordered = APP.practice.setup.shuffle ? shuffleArray(available) : available;
    const order = ordered.slice(0, count).map((question) => question.id);
    const session = {
      id: `attempt-${uid()}`,
      examId: exam.id,
      name: String(APP.practice.setup.name || "Invitado").trim().slice(0, 40) || "Invitado",
      startedAt: Date.now(),
      order,
      answers: {},
      marks: {},
      index: 0,
      count,
      mode: APP.practice.setup.mode === "eval" ? "eval" : "practice",
      minutes: Number(APP.practice.setup.minutes) || 0,
      feedback: APP.practice.setup.mode !== "eval",
      status: "prog",
    };
    APP.practice.session = session;
    sessionSet(ACTIVE_ATTEMPT_KEY, session.id);
    go("#practice/session");
    Store.saveAttempt({ ...session }).catch(() => {
      toast("La sesión funciona, pero no se pudo guardar el progreso local.", "warn");
    });
  }

  function persistSession(session) {
    if (!session || session.status !== "prog") return;
    clearTimeout(practiceSaveTimer);
    practiceSaveTimer = null;
    Store.saveAttempt({ ...session, savedAt: Date.now() }).catch(() => {});
  }

  function sessionFromAttempt(attempt) {
    if (!attempt) return null;
    const order = Array.isArray(attempt.order) ? attempt.order.slice() : [];
    return {
      id: attempt.id,
      examId: attempt.examId,
      name: attempt.name || "Invitado",
      startedAt: attempt.startedAt || Date.now(),
      order,
      answers: { ...(attempt.answers || {}) },
      marks: { ...(attempt.marks || {}) },
      index: clamp(attempt.index || 0, 0, Math.max(0, order.length - 1)),
      count: Math.max(1, attempt.count || order.length || 1),
      mode: attempt.mode || "practice",
      minutes: attempt.minutes || 0,
      feedback: (attempt.mode || "practice") !== "eval",
      status: "prog",
    };
  }

  function saveSessionProgress() {
    const session = APP.practice.session;
    if (!session || session.status !== "prog") return;
    clearTimeout(practiceSaveTimer);
    practiceSaveTimer = setTimeout(() => {
      if (!session || session.status !== "prog" || APP.practice.session !== session) return;
      Store.saveAttempt({ ...session, savedAt: Date.now() }).catch(() => {});
    }, 200);
  }

  function startPracticeTimer() {
    clearPracticeTimer();
    const session = APP.practice.session;
    if (!session) return;
    practiceTimer = setInterval(() => {
      if (!APP.practice.session) { clearPracticeTimer(); return; }
      const current = APP.practice.session;
      const elapsed = Math.max(0, Math.round((Date.now() - current.startedAt) / 1000));
      const timer = document.getElementById("practice-timer");
      if (timer) {
        const remaining = current.minutes > 0 ? current.minutes * 60 - elapsed : elapsed;
        timer.innerHTML = `${icon("clock")} ${clock(current.minutes > 0 ? remaining : elapsed)}`;
        timer.classList.toggle("is-low", current.minutes > 0 && remaining < 120);
      }
      if (current.minutes > 0 && elapsed >= current.minutes * 60) finishPractice(true);
    }, 1000);
  }

  function clearPracticeTimer() {
    if (practiceTimer) clearInterval(practiceTimer);
    practiceTimer = null;
  }

  function selectPracticeAnswer(letter) {
    const session = APP.practice.session;
    if (!session) return;
    const id = session.order[session.index];
    session.answers[id] = String(letter).toUpperCase();
    saveSessionProgress();
    refreshPractice();
  }

  function togglePracticeMark() {
    const session = APP.practice.session;
    if (!session) return;
    const id = session.order[session.index];
    session.marks = session.marks || {};
    if (session.marks[id]) delete session.marks[id];
    else session.marks[id] = true;
    saveSessionProgress();
    refreshPractice();
  }

  function goPractice(index) {
    const session = APP.practice.session;
    if (!session) return;
    session.index = clamp(index, 0, session.count - 1);
    saveSessionProgress();
    refreshPractice();
  }

  async function finishPractice(force = false) {
    const session = APP.practice.session;
    if (!session || session.finishing) return;
    session.finishing = true;
    const unanswered = session.count - Object.keys(session.answers || {}).length;
    if (!force && unanswered > 0) {
      const accepted = await confirmDialog("Terminar práctica", `Quedan ${unanswered} preguntas sin responder. ¿Quieres entregar el intento igualmente?`, "Entregar");
      if (!accepted) { session.finishing = false; return; }
    }
    clearPracticeTimer();
    clearTimeout(practiceSaveTimer);
    practiceSaveTimer = null;
    const details = session.order.map((id) => {
      const question = Store.state.byId.get(id);
      const selected = session.answers[id] || "";
      const correct = question?.correct || question?.c || "";
      return {
        id,
        n: question?.num,
        page: question?.page,
        statement: question?.statement || "",
        options: (question?.o || []).map((option) => ({ id: option.id, text: option.text })),
        selected,
        correct,
        ok: Boolean(selected && selected === correct),
      };
    });
    const score = details.filter((detail) => detail.ok).length;
    const answered = details.filter((detail) => detail.selected).length;
    const seconds = Math.max(1, Math.round((Date.now() - session.startedAt) / 1000));
    const attempt = {
      ...session,
      status: "done",
      doneAt: Date.now(),
      seconds,
      details,
      score,
      max: details.length,
      answered,
      blank: details.length - answered,
      pct: details.length ? (score / details.length) * 100 : 0,
      nota: details.length ? Math.round((score / details.length) * 200) / 10 : 0,
    };
    delete attempt.finishing;
    APP.practice.session = null;
    sessionSet(ACTIVE_ATTEMPT_KEY, "");
    APP.practice.result = attempt;
    location.hash = `#practice/result/${encodeURIComponent(attempt.id)}`;
    toast("Intento guardado en tu progreso local.", "ok");
    Store.saveAttempt(attempt).catch(() => {
      toast("El intento se calculó, pero no se pudo guardar en el progreso local.", "warn");
    });
  }

  async function resumeAttempt(attemptId) {
    const attempt = Store.attemptById(attemptId);
    if (!attempt) { toast("No se encontró el intento.", "warn"); return; }
    if (attempt.status !== "prog") { toast("Ese intento ya fue entregado.", "warn"); return; }
    APP.practice.session = sessionFromAttempt(attempt);
    sessionSet(ACTIVE_ATTEMPT_KEY, attempt.id);
    go("#practice/session");
  }

  function attemptOptionText(detail, letter) {
    const option = (detail.options || []).find((item) => item.id === letter);
    return option && option.text ? ` · ${String(option.text).slice(0, 170)}` : "";
  }

  function practiceResultView() {
    const attempt = APP.practice.result && APP.practice.result.id === APP.route.attemptId
      ? APP.practice.result
      : Store.attemptById(APP.route.attemptId);
    if (!attempt) return `<div class="page"><div class="result-wrap">${emptyState("history", "Intento no encontrado", "Puede que se haya borrado del almacenamiento local.", `<a class="btn btn-primary" href="#prog/history">Ver historial</a>`)}</div></div>`;
    if (attempt.status === "prog") {
      return `<div class="page"><div class="result-wrap">${emptyState("clock", "Intento en curso", "Este intento todavía no se ha entregado.", `<button class="btn btn-primary" type="button" data-act="practice-resume" data-id="${esc(attempt.id)}">Continuar</button>`)}</div></div>`;
    }
    const exam = Store.examById(attempt.examId);
    const details = attempt.details || [];
    const score = Number(attempt.score || 0);
    const max = Number(attempt.max || details.length || 0);
    const percentage = max ? (score / max) * 100 : 0;
    const correctDetails = details.filter((detail) => detail.ok);
    const wrongDetails = details.filter((detail) => detail.selected && !detail.ok);
    const blankDetails = details.filter((detail) => !detail.selected);
    return `<div class="page"><div class="result-wrap">
      <div class="result-hero glass">
        <div class="score-ring" style="--p:${percentage}"><div><span>${Math.round(percentage)}%</span><small>${score}/${max}</small></div></div>
        <div class="result-copy"><div class="eyebrow">Resultado de la práctica</div><h1>${percentage >= 70 ? "Buen trabajo." : percentage >= 50 ? "Vas por buen camino." : "Hay margen para mejorar."}</h1><p>${esc(exam?.title || "Examen")} · ${esc(attempt.name || "Invitado")} · ${esc(shortDate(attempt.doneAt))}</p>
          <div class="result-metrics"><div class="result-metric"><b>${score}</b><span>Correctas</span></div><div class="result-metric"><b>${wrongDetails.length}</b><span>Incorrectas</span></div><div class="result-metric"><b>${blankDetails.length}</b><span>En blanco</span></div><div class="result-metric"><b>${clock(attempt.seconds || 0)}</b><span>Tiempo</span></div></div>
          <div class="result-actions"><button class="btn btn-primary" type="button" data-act="practice-retry" data-exam="${esc(attempt.examId)}">${icon("refresh")} Repetir</button><a class="btn" href="#bank/${esc(encodeURIComponent(exam?.professionId || ""))}/${esc(encodeURIComponent(attempt.examId))}">${icon("book")} Ver banco</a><a class="btn btn-ghost" href="#prog/history">${icon("history")} Historial</a></div>
        </div>
      </div>
      <div class="prof-section-head" style="margin-top:22px"><h2>Revisión del intento</h2><span>${correctDetails.length} correctas · ${wrongDetails.length} incorrectas · ${blankDetails.length} en blanco</span></div>
      <div class="result-list">
        ${details.map((detail, index) => `<div class="result-item glass"><div class="top"><b>${index + 1} · ${detail.ok ? "Correcta" : detail.selected ? "Incorrecta" : "En blanco"}</b><span class="pill ${detail.ok ? "ok" : detail.selected ? "bad" : ""}">${detail.ok ? icon("check") : detail.selected ? icon("close") : "-"} ${detail.ok ? "Clave " + esc(detail.correct) : detail.selected ? "Elegiste " + esc(detail.selected) : "Sin responder"}</span></div><div class="q">${esc(detail.statement)}</div><div class="answers-mini"><div class="${detail.ok ? "is-correct" : detail.selected ? "is-wrong" : "is-neutral"}">Clave ${esc(detail.correct)}${esc(attemptOptionText(detail, detail.correct))}</div>${!detail.ok && detail.selected ? `<div>Tu respuesta ${esc(detail.selected)}${esc(attemptOptionText(detail, detail.selected))}</div>` : ""}</div></div>`).join("") || `<div class="small muted">Este intento no guardó el detalle de las respuestas.</div>`}
      </div>
    </div></div>`;
  }

  /* ------------------------------------------------------------------------
     Progreso, historial y ranking
     ------------------------------------------------------------------------ */
  function attemptPercentage(attempt) {
    if (Number.isFinite(Number(attempt.pct))) return Number(attempt.pct);
    const max = Number(attempt.max || 0);
    return max ? (Number(attempt.score || 0) / max) * 100 : 0;
  }

  function progView() {
    const attempts = [...Store.state.attempts].sort((a, b) => (b.doneAt || b.startedAt || 0) - (a.doneAt || a.startedAt || 0));
    const done = attempts.filter((attempt) => attempt.status === "done");
    const inProgress = attempts.filter((attempt) => attempt.status === "prog");
    const best = done.length ? Math.max(...done.map((attempt) => attemptPercentage(attempt))) : 0;
    const average = done.length ? done.reduce((total, attempt) => total + attemptPercentage(attempt), 0) / done.length : 0;
    const tab = APP.prog.tab || "history";
    const chartAttempts = done.slice(0, 14).reverse();
    const rankingExam = APP.prog.examId
      ? Store.examById(APP.prog.examId)
      : Store.state.exams.find((exam) => done.some((attempt) => attempt.examId === exam.id)) || Store.state.exams[0];
    const rankingAttempts = done.filter((attempt) => attempt.examId === rankingExam?.id);
    const ranking = new Map();
    rankingAttempts.forEach((attempt) => {
      const name = attempt.name || "Invitado";
      if (!ranking.has(name)) ranking.set(name, { name, attempts: [], best: 0, last: 0 });
      const entry = ranking.get(name);
      entry.attempts.push(attempt);
      entry.best = Math.max(entry.best, attemptPercentage(attempt));
      entry.last = Math.max(entry.last, attempt.doneAt || 0);
    });
    const rankingRows = [...ranking.values()].sort((a, b) => b.best - a.best || b.last - a.last);
    return `<div class="page">
      <div class="page-head"><div><div class="breadcrumb"><a href="#hub">Banqueo</a>${icon("chevron-right")}<span>Progreso</span></div><h1>Tu progreso</h1><p class="lead">Los intentos, las preguntas revisadas y el ranking se guardan solo en este dispositivo.</p></div><div class="page-head-actions"><a class="btn btn-primary" href="#practice">${icon("play")} Nueva práctica</a></div></div>
      <div class="review-stats">
        <div class="review-stat"><b>${fmt(done.length)}</b><span>${done.length === 1 ? "Intento entregado" : "Intentos entregados"}</span></div>
        <div class="review-stat"><b>${Math.round(best)}%</b><span>Mejor resultado</span></div>
        <div class="review-stat"><b>${Math.round(average)}%</b><span>Promedio</span></div>
        <div class="review-stat"><b>${fmt(Store.state.stats.reviewed)}</b><span>Preguntas revisadas</span></div>
      </div>
      <div class="tabs" role="tablist"><button class="tab ${tab === "history" ? "is-active" : ""}" type="button" role="tab" data-act="prog-tab" data-tab="history">Historial</button><button class="tab ${tab === "ranking" ? "is-active" : ""}" type="button" role="tab" data-act="prog-tab" data-tab="ranking">Ranking local</button></div>
      ${tab === "history" ? `<div class="prog-grid">
        <section class="chart-panel glass"><div class="chart-head"><h2>Últimos resultados</h2><span>${done.length ? "Porcentaje de acierto" : "Sin datos"}</span></div><div class="chart" aria-label="Gráfico de resultados">${chartAttempts.length ? chartAttempts.map((attempt) => `<i style="height:${Math.max(3, attemptPercentage(attempt))}%" title="${esc(attempt.name || "Invitado")} · ${Math.round(attemptPercentage(attempt))}% · ${esc(shortDate(attempt.doneAt))}"></i>`).join("") : `<div class="empty" style="padding:20px 0;width:100%"><p>Aún no hay intentos.</p></div>`}</div></section>
        <section class="chart-panel glass"><div class="chart-head"><h2>Pendientes</h2><span>${inProgress.length ? `${inProgress.length} en curso` : "Al día"}</span></div>${inProgress.length ? `<div class="resume-list">${inProgress.slice(0, 5).map((attempt) => `<div class="resume-row"><span><b>${esc(attempt.name || "Invitado")}</b><br><span class="muted">${esc(Store.examById(attempt.examId)?.cycle || "")} · ${Object.keys(attempt.answers || {}).length}/${attempt.count || "—"}</span></span><button class="btn btn-sm" type="button" data-act="practice-resume" data-id="${esc(attempt.id)}">Continuar</button></div>`).join("")}</div>` : `<p class="small muted" style="margin-top:12px">Cuando empieces una práctica y salgas sin entregar, aparecerá aquí para continuarla.</p>`}<div class="coverage" style="margin-top:14px">${icon("database")}<span><b>${plural(Store.state.attempts.length, "intento guardado", "intentos guardados")}</b> en IndexedDB.</span></div></section>
      </div>
      <div class="prof-section-head" style="margin-top:22px"><h2>Historial de intentos</h2><span>${done.length ? "Más reciente primero" : ""}</span></div>
      <div class="history-list">${done.length ? done.map(historyRowHTML).join("") : emptyState("history", "Todavía no hay intentos", "Realiza una práctica para ver tu resultado y comparar tu avance.", `<a class="btn btn-primary" href="#practice">Comenzar práctica</a>`)}</div>` : `<div class="chart-panel glass"><div class="chart-head"><h2>Ranking por examen</h2><span>Mejor resultado por participante</span></div><div class="rank-toolbar"><select data-prog-exam aria-label="Elegir examen para el ranking">${Store.state.exams.map((exam) => `<option value="${esc(exam.id)}" ${rankingExam?.id === exam.id ? "selected" : ""}>${esc(Store.professionById(exam.professionId)?.short || exam.professionId)} · ${esc(exam.cycle)}${exam.imported ? " · Importado" : ""}</option>`).join("")}</select><span class="small muted">${plural(rankingAttempts.length, "intento")}</span></div>${rankingRows.length ? `<table class="ranking-table"><thead><tr><th>#</th><th>Participante</th><th>Mejor</th><th>Intentos</th><th>Último</th></tr></thead><tbody>${rankingRows.map((entry, index) => `<tr><td class="pos ${index < 3 ? "top" : ""}">${String(index + 1).padStart(2, "0")}</td><td><b>${esc(entry.name)}</b></td><td>${Math.round(entry.best)}%</td><td>${entry.attempts.length}</td><td class="muted">${esc(shortDate(entry.last))}</td></tr>`).join("")}</tbody></table>` : emptyState("trophy", "Sin resultados para este examen", "Cuando haya intentos entregados aparecerán aquí agrupados por participante.")}</div>`}
    </div>`;
  }

  function historyRowHTML(attempt) {
    const exam = Store.examById(attempt.examId);
    const percentage = attemptPercentage(attempt);
    return `<div class="attempt-row">
      <span class="attempt-score">${Math.round(percentage)}%</span>
      <span class="attempt-main"><b>${esc(exam?.title || "Examen")}</b><span>${esc(attempt.name || "Invitado")} · ${esc(shortDate(attempt.doneAt))} · ${attempt.score}/${attempt.max} correctas</span></span>
      <span class="attempt-meta">${clock(attempt.seconds || 0)}<br>${esc(exam?.cycle || "")}</span>
      <button class="btn btn-sm" type="button" data-act="open-attempt" data-id="${esc(attempt.id)}">Ver resultado</button>
    </div>`;
  }

  /* ------------------------------------------------------------------------
     Eventos
     ------------------------------------------------------------------------ */
  const debouncedBankRefresh = debounce(() => refreshBankPreserveSearch(), 120);
  const debouncedReviewRefresh = debounce(() => refreshReviewPreserveSearch(), 120);

  function refreshBankPreserveSearch() {
    if (APP.route.name !== "bank") return;
    const active = document.activeElement;
    const searchActive = active?.matches("[data-bank-search]");
    const caret = searchActive ? active.selectionStart : null;
    replaceApp(bankView());
    if (searchActive) {
      const input = document.querySelector("[data-bank-search]");
      if (input) { input.focus(); try { input.setSelectionRange(caret, caret); } catch {} }
    }
    syncMobileDetail();
  }

  function refreshReviewPreserveSearch() {
    if (APP.route.name !== "review") return;
    const active = document.activeElement;
    const searchActive = active?.matches("[data-review-search]");
    const caret = searchActive ? active.selectionStart : null;
    replaceApp(APP.review.examId ? reviewExamView() : reviewView());
    if (searchActive) {
      const input = document.querySelector("[data-review-search]");
      if (input) { input.focus(); try { input.setSelectionRange(caret, caret); } catch {} }
    }
    syncMobileDetail();
  }

  async function handleClick(event) {
    const target = event.target.closest("[data-act]");
    if (!target) return;
    const action = target.dataset.act;
    const id = target.dataset.id;
    if (action === "theme") { toggleTheme(); return; }
    if (action === "info") { infoDialog(); return; }
    if (action === "pick-prof") { go(`#hub/${encodeURIComponent(target.dataset.id)}`); return; }
    if (action === "practice-exam") { go(`#practice/${encodeURIComponent(target.dataset.exam)}`); return; }
    if (action === "open-exam-pdf") { const exam = Store.examById(target.dataset.exam); await openExamPdf(exam); return; }
    if (action === "open-pdf") { const question = Store.state.byId.get(target.dataset.id); await openPdf(question); return; }
    if (action === "bank-filter") { APP.bank.filter = target.dataset.filter || "all"; APP.bank.selectedId = null; APP.bank.detailOpen = false; APP.bank.focusDetail = false; refreshBank(); return; }
    if (action === "bank-select") { APP.bank.selectedId = target.dataset.id; APP.bank.detailOpen = true; APP.bank.focusDetail = true; refreshBank(); return; }
    if (action === "bank-close") { closeRouteDetail(); return; }
    if (action === "bank-review") { Store.markReviewed(id, !Store.isReviewed(Store.state.byId.get(id))); refreshBank(); return; }
    if (action === "bank-flag") { const question = Store.state.byId.get(id); const note = await flagDialog(question); if (note !== null) { Store.flagQuestion(id, note); refreshBank(); } return; }
    if (action === "bank-prev" || action === "bank-next") {
      const items = bankItemsWithCurrentFilters();
      const index = items.findIndex((question) => question.id === APP.bank.selectedId);
      const next = action === "bank-next" ? Math.min(items.length - 1, index + 1) : Math.max(0, index - 1);
      if (items[next]) { APP.bank.selectedId = items[next].id; APP.bank.detailOpen = true; refreshBank(); }
      return;
    }
    if (action === "bank-jump") {
      const question = Store.state.byId.get(id);
      if (!question) return;
      APP.bank.pendingSelect = question.id;
      const hash = `#bank/${encodeURIComponent(question.professionId)}/${encodeURIComponent(question.examId)}`;
      if (location.hash === hash) { APP.bank.selectedId = question.id; APP.bank.detailOpen = true; refreshBank(); }
      else go(hash);
      return;
    }
    if (action === "review-tab") { APP.review.tab = target.dataset.tab; replaceApp(reviewView()); return; }
    if (action === "review-select") { APP.review.selectedId = target.dataset.id; APP.review.detailOpen = true; APP.review.focusDetail = true; refreshReview(); return; }
    if (action === "review-close") { closeRouteDetail(); return; }
    if (action === "review-confirm") { Store.markReviewed(id, !Store.isReviewed(Store.state.byId.get(id))); refreshReview(); return; }
    if (action === "review-flag") { const question = Store.state.byId.get(id); const note = await flagDialog(question); if (note !== null) { Store.flagQuestion(id, note); refreshReview(); } return; }
    if (action === "review-correct") { APP.review.correctEditor = true; refreshReview(); return; }
    if (action === "review-set-key") {
      try { await Store.setCorrectAnswer(id, target.dataset.letter); APP.review.correctEditor = false; refreshReview(); toast("Clave corregida y guardada.", "ok"); }
      catch (error) { toast(error.message || "No se pudo corregir la clave.", "warn"); }
      return;
    }
    if (action === "review-prev" || action === "review-next") {
      const items = reviewExamItems();
      const index = items.findIndex((question) => question.id === APP.review.selectedId);
      const next = action === "review-next" ? Math.min(items.length - 1, index + 1) : Math.max(0, index - 1);
      if (items[next]) { APP.review.selectedId = items[next].id; APP.review.detailOpen = true; APP.review.correctEditor = false; refreshReview(); }
      return;
    }
    if (action === "review-filter") { APP.review.filter = target.dataset.filter || "all"; APP.review.selectedId = null; APP.review.correctEditor = false; refreshReview(); return; }
    if (action === "review-question") {
      const question = Store.state.byId.get(id);
      if (!question) return;
      const hash = `#review/${encodeURIComponent(question.examId)}`;
      if (location.hash === hash) {
        APP.review.pendingSelect = null;
        APP.review.selectedId = question.id;
        APP.review.detailOpen = true;
        APP.review.correctEditor = false;
        refreshReview();
      } else {
        APP.review.pendingSelect = question.id;
        go(hash);
      }
      return;
    }
    if (action === "review-obs-toggle") { APP.review.obsAll = !APP.review.obsAll; replaceApp(reviewView()); return; }
    if (action === "obs-resolve" || action === "obs-reopen") { Store.resolveIssue(id, action === "obs-resolve"); renderShell(); replaceApp(reviewView()); toast(action === "obs-resolve" ? "Observación resuelta." : "Observación reabierta.", "ok"); return; }
    if (action === "obs-open-pdf") { const issue = Store.state.issues.find((item) => item.examId === target.dataset.exam && String(item.page) === String(target.dataset.page)); if (issue) await openIssuePdf(issue); return; }
    if (action === "exception-save") { await saveExceptionRecord(id); return; }
    if (action === "exception-retry") { await retryImportRecord(id); return; }
    if (action === "import-pick") { document.querySelector("[data-import-input]")?.click(); return; }
    if (action === "import-select") { APP.imports.selectedId = id; refreshImport(); return; }
    if (action === "import-retry") { await retryImportRecord(id); return; }
    if (action === "import-save") { await saveImportRecord(id); return; }
    if (action === "import-discard") {
      const accepted = await confirmDialog("Descartar importación", "Se quitará este archivo de la cola. El PDF original se elimina del almacenamiento si ningún examen lo usa.", "Descartar", { danger: true });
      if (accepted) { await Store.discardImport(id); APP.imports.selectedId = null; refreshImport(); toast("Importación descartada."); }
      return;
    }
    if (action === "import-open-page") { const record = Store.state.imports.find((item) => item.id === id); await openImportPage(record, Number(target.dataset.page || 1)); return; }
    if (action === "practice-start") { await startPractice(); return; }
    if (action === "practice-answer") { selectPracticeAnswer(target.dataset.letter); return; }
    if (action === "practice-mark") { togglePracticeMark(); return; }
    if (action === "practice-next") { goPractice(APP.practice.session.index + 1); return; }
    if (action === "practice-prev") { goPractice(APP.practice.session.index - 1); return; }
    if (action === "practice-go") { goPractice(Number(target.dataset.index)); return; }
    if (action === "practice-finish") { await finishPractice(false); return; }
    if (action === "practice-exit") {
      const accepted = await confirmDialog("Salir de la práctica", "El intento quedará guardado en curso para que puedas continuarlo desde Progreso.", "Salir");
      if (accepted) {
        const session = APP.practice.session;
        clearTimeout(practiceSaveTimer);
        practiceSaveTimer = null;
        if (session) await Store.saveAttempt({ ...session, savedAt: Date.now() });
        const examId = session?.examId;
        APP.practice.session = null;
        sessionSet(ACTIVE_ATTEMPT_KEY, "");
        clearPracticeTimer();
        go(`#practice/${encodeURIComponent(examId || "")}`);
      }
      return;
    }
    if (action === "practice-resume") { await resumeAttempt(id); return; }
    if (action === "practice-retry") { const examId = target.dataset.exam; APP.practice.session = null; sessionSet(ACTIVE_ATTEMPT_KEY, ""); go(`#practice/${encodeURIComponent(examId)}`); return; }
    if (action === "prog-tab") { APP.prog.tab = target.dataset.tab; replaceApp(progView()); return; }
    if (action === "open-attempt") { go(`#practice/result/${encodeURIComponent(id)}`); return; }
  }

  function handleInput(event) {
    const target = event.target;
    if (target.matches("[data-hub-search]")) {
      APP.hubQuery = target.value;
      updateHubCatalog();
      return;
    }
    if (target.matches("[data-bank-search]")) {
      APP.bank.query = target.value;
      APP.bank.selectedId = null;
      debouncedBankRefresh();
      return;
    }
    if (target.matches("[data-review-search]")) {
      APP.review.query = target.value;
      APP.review.selectedId = null;
      debouncedReviewRefresh();
      return;
    }
    if (target.matches("[data-review-exam-search]")) {
      APP.review.examQuery = target.value;
      const container = document.querySelector(".review-list");
      if (container) container.outerHTML = reviewExamListHTML();
      return;
    }
    if (target.matches("[data-practice-name]")) {
      APP.practice.setup.name = target.value;
      localSet("banqueo-name", String(target.value || "").trim().slice(0, 40));
      return;
    }
    if (target.matches("[data-practice-count]")) {
      APP.practice.setup.count = Number(target.value) || 25;
      localSet("banqueo-practice-count", String(APP.practice.setup.count));
      return;
    }
    if (target.matches("[data-practice-minutes]")) {
      APP.practice.setup.minutes = Number(target.value) || 0;
      localSet("banqueo-practice-minutes", String(APP.practice.setup.minutes));
      return;
    }
  }

  function handleChange(event) {
    const target = event.target;
    if (target.matches("[data-bank-exam]")) {
      const examId = target.value;
      APP.bank.examId = examId || null;
      APP.bank.selectedId = null;
      APP.bank.detailOpen = false;
      APP.bank.cycle = "";
      const hash = examId ? `#bank/${encodeURIComponent(APP.bank.professionId)}/${encodeURIComponent(examId)}` : `#bank/${encodeURIComponent(APP.bank.professionId)}`;
      go(hash);
      return;
    }
    if (target.matches("[data-bank-cycle]")) {
      APP.bank.cycle = target.value;
      APP.bank.selectedId = null;
      refreshBank();
      return;
    }
    if (target.matches("[data-practice-exam]")) {
      APP.practice.setup.examId = target.value;
      go(`#practice/${encodeURIComponent(target.value)}`);
      return;
    }
    if (target.matches("[data-practice-shuffle]")) {
      APP.practice.setup.shuffle = target.checked;
      localSet("banqueo-practice-shuffle", target.checked ? "1" : "0");
      return;
    }
    if (target.matches('input[name="practice-mode"]')) {
      APP.practice.setup.mode = target.value;
      localSet("banqueo-practice-mode", target.value === "eval" ? "eval" : "practice");
      return;
    }
    if (target.matches("[data-import-ocr]")) {
      APP.imports.ocr = target.checked;
      return;
    }
    if (target.matches("[data-import-input]")) {
      if (target.files?.length) processPdfFiles(target.files);
      target.value = "";
      return;
    }
    if (target.matches("[data-prog-exam]")) {
      APP.prog.examId = target.value;
      replaceApp(progView());
      return;
    }
  }

  function handleKey(event) {
    const routeName = APP.route && APP.route.name;
    const mobileDetailOpen = !modalRoot?.innerHTML && isMobileDetail() && (
      (routeName === "bank" && APP.bank.detailOpen) ||
      (routeName === "review" && APP.review.detailOpen)
    );
    if (mobileDetailOpen) {
      if (event.key === "Escape") { event.preventDefault(); closeRouteDetail(); return; }
      if (event.key === "Tab") { trapSheetFocus(event); return; }
      return;
    }
    if (event.key === "Escape" && !modalRoot?.innerHTML) {
      if (routeName === "bank" && APP.bank.detailOpen) { closeRouteDetail(); return; }
      if (routeName === "review" && APP.review.detailOpen) { closeRouteDetail(); return; }
    }
    const typing = event.target.matches("input, textarea, select");
    if (typing) return;
    if (event.key === "/" && APP.route.name === "bank") {
      const input = document.querySelector("[data-bank-search]");
      if (input) { event.preventDefault(); input.focus(); }
      return;
    }
    if (APP.route.name === "practice" && APP.route.section === "session" && APP.practice.session) {
      const session = APP.practice.session;
      const letter = /^[a-d1-4]$/i.test(event.key) ? event.key.toUpperCase().replace("1", "A").replace("2", "B").replace("3", "C").replace("4", "D") : "";
      if (letter) { event.preventDefault(); selectPracticeAnswer(letter); return; }
      if (event.key === "ArrowRight") { event.preventDefault(); goPractice(session.index + 1); return; }
      if (event.key === "ArrowLeft") { event.preventDefault(); goPractice(session.index - 1); return; }
      if (event.key.toLowerCase() === "m") { event.preventDefault(); togglePracticeMark(); return; }
      if (event.key === "Enter") { event.preventDefault(); goPractice(session.index + 1); }
    }
  }

  let detailResizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(detailResizeTimer);
    detailResizeTimer = setTimeout(syncMobileDetail, 120);
  });
  window.addEventListener("hashchange", onRoute);
  document.addEventListener("click", handleClick);
  document.addEventListener("input", handleInput);
  document.addEventListener("change", handleChange);
  document.addEventListener("keydown", handleKey);
  document.addEventListener("mouseover", (event) => {
    const target = event.target.closest?.("[data-tip]");
    if (target) showFloatingTip(target);
  });
  document.addEventListener("mouseout", (event) => {
    const target = event.target.closest?.("[data-tip]");
    if (target && target === floatingTipTarget && !target.contains(event.relatedTarget)) hideFloatingTip();
  });
  document.addEventListener("focusin", (event) => {
    const target = event.target.closest?.("[data-tip]");
    if (target) showFloatingTip(target);
  });
  document.addEventListener("focusout", (event) => {
    if (event.target === floatingTipTarget) hideFloatingTip();
  });
  window.addEventListener("scroll", hideFloatingTip, true);
  window.addEventListener("resize", hideFloatingTip);
  window.addEventListener("blur", hideFloatingTip);
  window.addEventListener("beforeunload", (event) => {
    if (APP.practice.session) {
      /* Marcador + guardado inmediato: el temporizador diferido no llega a
         ejecutarse durante la descarga de la página. */
      sessionSet(ACTIVE_ATTEMPT_KEY, APP.practice.session.id);
      persistSession(APP.practice.session);
      event.preventDefault();
      event.returnValue = "";
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && APP.practice.session) {
      sessionSet(ACTIVE_ATTEMPT_KEY, APP.practice.session.id);
      persistSession(APP.practice.session);
    }
  });

  /* ------------------------------------------------------------------------
     Arranque
     ------------------------------------------------------------------------ */
  async function boot() {
    applyTheme(localGet("banqueo-theme-v1") || localGet("es-theme") || "dark");
    try {
      await Store.init();
    } catch (error) {
      app.innerHTML = `<div class="page">${emptyState("alert", "No se pudo iniciar Banqueo", error.message || "Error inesperado al cargar el banco.")}</div>`;
      document.getElementById("boot")?.remove();
      return;
    }
    if (!location.hash) history.replaceState(null, "", "#hub");
    APP.practice.setup.examId = APP.practice.setup.examId || Store.examList()[0]?.id || null;
    APP.practice.setup.name = localGet("banqueo-name") || "";
    APP.practice.setup.count = numberPref("banqueo-practice-count", APP.practice.setup.count, { min: 1, max: 200 });
    APP.practice.setup.minutes = numberPref("banqueo-practice-minutes", APP.practice.setup.minutes, { min: 0, max: 240 });
    APP.practice.setup.shuffle = boolPref("banqueo-practice-shuffle", APP.practice.setup.shuffle);
    APP.practice.setup.mode = localGet("banqueo-practice-mode") === "eval" ? "eval" : "practice";
    document.getElementById("boot")?.remove();
    onRoute();
    document.documentElement.dataset.ready = "1";
    window.__BANQUEO_READY__ = true;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
