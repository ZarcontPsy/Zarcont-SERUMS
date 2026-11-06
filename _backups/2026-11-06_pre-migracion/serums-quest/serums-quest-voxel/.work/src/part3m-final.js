/* =========================================================================
   BLOQUE 3 — CIERRE: ayuda, tutorial, recuperación y accesibilidad
   ========================================================================= */
var tutorialSlide = 0;
var tutorialReturn = 'title';
var recoveryResetArmed = 0;
var backupBanner = null;
var storageBanner = null;

var HELP_CONTROLS = [
  ['WASD / flechas', 'Moverse por el atrio'],
  ['E / Enter', 'Hablar, entrar o interactuar'],
  ['M', 'Mapa de avance'],
  ['J', 'Bitácora de rutas'],
  ['I', 'Inventario y atuendo'],
  ['R', 'Repaso espaciado'],
  ['G', 'Modos de juego'],
  ['A B C D / 1–4', 'Responder en un duelo'],
  ['Esc', 'Pausa; también cierra paneles'],
  ['Ratón / dedo', 'Girar y acercar el mapa']
];

function settingsVersionLine() {
  return esc(APP_VERSION) + ' · compilado el ' + esc(BUILD_DATE);
}
function applyAccessibilitySettings() {
  if (!document || !document.body) return;
  document.body.classList.toggle('reduced-motion', !!state.settings.reducedMotion);
  document.body.classList.toggle('text-large', state.settings.textScale === 'grande');
  document.body.classList.toggle('high-contrast', !!state.settings.highContrast);
}
function setTextScale(scale) {
  state.settings.textScale = scale === 'grande' ? 'grande' : 'normal';
  applyAccessibilitySettings();
  saveSettings();
  persist();
  renderScreen();
}
function setHighContrast(enabled) {
  state.settings.highContrast = !!enabled;
  applyAccessibilitySettings();
  saveSettings();
  persist();
  renderScreen();
}
function toggleBackupReminder() {
  state.settings.backupReminder = !state.settings.backupReminder;
  if (!state.settings.backupReminder) hideBackupPrompt();
  saveSettings();
  persist();
  renderScreen();
  toast(state.settings.backupReminder ? 'Recordatorio semanal activado.' : 'Recordatorio semanal silenciado.', 'success', 2400);
}
function applyRenderQuality() {
  var q = state.settings.effectsQuality;
  var dpr = window.devicePixelRatio || 1;
  var ratio = q === 'bajo' ? Math.min(1, dpr) : q === 'alto' ? Math.min(2, dpr) : Math.min(1.5, dpr);
  try {
    if (typeof renderer !== 'undefined' && renderer) {
      renderer.setPixelRatio(ratio);
      renderer.shadowMap.enabled = q !== 'bajo';
    }
    if (typeof portraitRenderer !== 'undefined' && portraitRenderer) portraitRenderer.setPixelRatio(1);
  } catch (e) {}
}
function autoDetectQuality() {
  if (state.settings.qualityChosen) return;
  var touch = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || (navigator.maxTouchPoints || 0) > 0;
  var software = false;
  try {
    var gl = typeof renderer !== 'undefined' && renderer ? renderer.getContext() : null;
    var label = gl ? String(gl.getParameter(gl.RENDERER) || '') : '';
    software = /swiftshader|llvmpipe|software|basic render/i.test(label);
  } catch (e) { software = true; }
  state.settings.effectsQuality = (touch || software) ? 'bajo' : 'medio';
  saveSettings();
  applyRenderQuality();
}
function qualityHelpHTML() {
  var q = state.settings.effectsQuality;
  return '<p class="qualityHelp"><b>Baja</b> 1×, sin sombras y menos partículas. <b>Media</b> 1,5×, sombras suaves y equilibrio. <b>Alta</b> 2×, sombras y efectos completos.</p>';
}
function tutorialScreenHTML() {
  var slides = [
    { icon: 'compass', title: 'Muévete sin prisa.', body: 'Usa WASD o las flechas para recorrer el atrio. En móvil, el joystick aparece abajo a la izquierda; los botones de mapa y pausa están en el HUD.' },
    { icon: 'seal', title: 'Elige tu manera de practicar.', body: 'Modos reúne Diario, Supervivencia, Contrarreloj, Simulacro y Práctica libre. Los cuatro primeros tienen recompensa de cierre; la práctica libre no presiona con corazones ni reloj.' },
    { icon: 'rotate', title: 'Volver a mirar también cuenta.', body: 'Los fallos quedan en el errorario. Repaso espaciado te propone volver a ellos; las preguntas que marques como difíciles o favoritas también aparecen en Repaso.' },
    { icon: 'user', title: 'Tu observatorio, tus señales.', body: 'En Inventario y Tienda puedes cambiar el atuendo. En Estadísticas verás qué área necesita más margen. Los cosméticos no cambian las preguntas ni las recompensas.' },
    { icon: 'bookOpen', title: 'Guardar es parte de avanzar.', body: 'El progreso vive en este navegador. Exporta un respaldo desde Ajustes; si algo se daña, no lo borres: ofrece recuperar una copia o importar un archivo. Puedes repetir este tutorial desde Ajustes.' }
  ];
  var s = slides[Math.max(0, Math.min(slides.length - 1, tutorialSlide))];
  return '<div class="overlay"><div class="overlayShell tutorialShell">' +
    '<div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot"></span>Primer recorrido</span><h1>Bienvenido al <em>observatorio.</em></h1><p>Cinco pasos breves. Puedes saltarlo y repetirlo cuando quieras.</p></div><button type="button" class="sheetClose" data-action="tutorial-skip" aria-label="Saltar tutorial">' + icon('close', 17) + '</button></div>' +
    '<div class="tutorialBody"><div class="tutorialIcon">' + icon(s.icon, 34) + '</div><div><span class="eyebrow noRule">Paso ' + (tutorialSlide + 1) + ' de ' + slides.length + '</span><h2>' + esc(s.title) + '</h2><p>' + esc(s.body) + '</p></div></div>' +
    '<div class="tutorialDots">' + slides.map(function (_, i) { return '<span class="' + (i === tutorialSlide ? 'is-active' : '') + '"></span>'; }).join('') + '</div>' +
    '<div class="tutorialActions"><button type="button" class="btn btn--quiet" data-action="tutorial-skip">Saltar por ahora</button><div><button type="button" class="btn btn--ghost" data-action="tutorial-prev" ' + (tutorialSlide === 0 ? 'disabled' : '') + '>Anterior</button><button type="button" class="btn btn--primary" data-action="tutorial-next">' + (tutorialSlide === slides.length - 1 ? 'Terminar' : 'Siguiente') + '</button></div></div>' +
  '</div></div>';
}
function helpScreenHTML() {
  return '<div class="overlay"><div class="overlayShell helpShell">' +
    '<div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot"></span>Ayuda del observatorio</span><h1>Todo lo que necesitas, <em>sin prisa.</em></h1><p>Controles, repaso, modos y cosméticos. Nada de esta pantalla cambia tu progreso.</p></div><div class="sheetHeadSide"><button type="button" class="sheetClose" data-action="close-help" aria-label="Cerrar ayuda">' + icon('close', 17) + '</button></div></div>' +
    '<div class="helpGrid">' +
      '<section class="panel"><h3>Controles</h3><div class="helpControlList">' + HELP_CONTROLS.map(function (r) { return '<div><kbd>' + esc(r[0]) + '</kbd><span>' + esc(r[1]) + '</span></div>'; }).join('') + '</div><p class="settingsHelp">En móvil: joystick para moverte y botones del HUD para mapa, pausa y acciones. En horizontal la interfaz tiene más espacio; si el dispositivo está en vertical, se pide girarlo.</p></section>' +
      '<section class="panel"><h3>Repaso espaciado</h3><p>Un fallo no se borra: entra en tu errorario. La primera cita es a los 20 minutos; después, 1, 3, 7, 14 y 30 días. Un acierto actualiza el intervalo sin inventar dominio.</p><p>Desde Repaso puedes marcar preguntas como difíciles o favoritas. Las marcas no cambian la puntuación.</p></section>' +
      '<section class="panel"><h3>Modos</h3><p><b>Diario</b> se abre una vez al día. <b>Supervivencia</b> usa tres oportunidades. <b>Contrarreloj</b> mide precisión bajo tiempo. <b>Simulacro</b> guarda la clave hasta el final. <b>Práctica libre</b> no tiene corazones ni reloj.</p></section>' +
      '<section class="panel"><h3>Cosméticos</h3><p>Los cosméticos se consiguen con monedas, logros, misiones y progreso de colección. No cambian preguntas, claves ni recompensas. Puedes equiparlos por héroe en Inventario.</p></section>' +
    '</div>' +
    '<div class="atlasFooter"><span>' + settingsVersionLine() + ' · sin conexión y sin cuentas</span><button type="button" class="btn btn--ghost btn--sm" data-action="close-help">Volver ' + icon('chevronRight', 11) + '</button></div>' +
  '</div></div>';
}
function creditsScreenHTML() {
  return '<div class="overlay"><div class="overlayShell helpShell creditsShell">' +
    '<div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot"></span>Créditos y licencias</span><h1>Lo que hace posible <em>esta ruta.</em></h1><p>' + settingsVersionLine() + '</p></div><div class="sheetHeadSide"><button type="button" class="sheetClose" data-action="close-credits" aria-label="Cerrar créditos">' + icon('close', 17) + '</button></div></div>' +
    '<div class="helpGrid creditsGrid">' +
      '<section class="panel"><h3>Three.js</h3><p>Motor 3D del observatorio. Copyright © 2010-2026 three.js authors.</p><pre class="licenseText">MIT License\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.</pre></section>' +
      '<section class="panel"><h3>Proyecto</h3><p>Código, textos, modelos voxel y sonido sintetizado propios de SERUMS QUEST · Observatorio de las Cinco Rutas.</p><p>No hay fuentes, imágenes, audio ni recursos remotos. El ambiente y los efectos se generan en el navegador con WebAudio.</p><p class="settingsHelp">Las preguntas y claves pertenecen a su banco de estudio de origen y se incluyen para uso local de la campaña.</p></section>' +
    '</div>' +
    '<div class="atlasFooter"><span>Licencia MIT de three.js conservada arriba.</span><button type="button" class="btn btn--ghost btn--sm" data-action="close-credits">Volver ' + icon('chevronRight', 11) + '</button></div>' +
  '</div></div>';
}
function recoveryScreenHTML() {
  var backupRaw = null;
  try { backupRaw = window.localStorage.getItem(BACKUP_KEY) || window.localStorage.getItem(PREIMPORT_KEY); } catch (e) {}
  return '<div class="overlay"><div class="overlayShell recoveryShell">' +
    '<div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot" style="background:var(--rose)"></span>Guardado protegido</span><h1>No he borrado <em>tu partida.</em></h1><p>El guardado local no se pudo leer. Puedes recuperar una copia, importar un respaldo o descargar los datos para revisarlos. Nada se sobrescribe hasta que elijas.</p></div></div>' +
    '<div class="recoveryBox"><b>El archivo local está dañado o incompleto.</b><p>Conservo el contenido original en memoria y no lo reemplazo automáticamente. Si tienes un respaldo anterior, este es el momento de usarlo.</p><div class="recoveryActions"><button type="button" class="btn btn--primary" data-action="recovery-backup" ' + (backupRaw ? '' : 'disabled') + '>' + icon('rotate', 14) + ' Recuperar copia local' + (backupRaw ? '' : ' (no hay)') + '</button><button type="button" class="btn btn--ghost" data-action="open-import">' + icon('upload', 14) + ' Importar un respaldo</button><button type="button" class="btn btn--ghost" data-action="recovery-download">' + icon('download', 14) + ' Descargar datos dañados</button></div></div>' +
    '<div class="notice" style="margin-top:10px"><b>Empezar de cero</b> solo debe ser la última opción. Si eliges esta vía, guardaré antes una copia del contenido dañado en este navegador.<div class="recoveryActions" style="margin-top:8px"><button type="button" class="btn btn--danger btn--sm" data-action="recovery-reset">' + (Date.now() < recoveryResetArmed ? 'Confirmar empezar de cero' : 'Empezar de cero') + '</button></div></div>' +
    '<div class="atlasFooter"><span>Si el navegador bloquea el almacenamiento, descarga tus datos y revisa la configuración del sitio.</span></div>' +
  '</div></div>';
}
function openTutorial(returnScreen) {
  tutorialReturn = returnScreen || (screen === 'settings' ? 'settings' : (screen === 'title' ? 'title' : 'hub'));
  tutorialSlide = 0;
  setScreen('tutorial');
  initAudio();
}
function closeTutorial() {
  state.settings.tutorialSeen = true;
  saveSettings();
  persist();
  if (tutorialReturn === 'settings') setScreen('settings'); else enterTitle();
  maybeShowBackupPrompt();
}
function openHelp() { setScreen('help'); sfxSelect(); }
function closeHelp() { setScreen(screen === 'help' ? (state.settings.tutorialSeen ? 'settings' : 'settings') : 'settings'); }
function openCredits() { setScreen('credits'); sfxSelect(); }
function closeCredits() { setScreen('settings'); }
function maybeShowTutorial() {
  if (state.settings.tutorialSeen) return;
  if (recoveryInfo.corrupt || (!FINAL_RELEASE && RULES.devSkipTutorial)) return;
  openTutorial('title');
}
function showStorageWarning() {
  if (storageBanner || storageEnabled) return;
  storageBanner = document.createElement('div');
  storageBanner.className = 'storageBanner';
  storageBanner.innerHTML = icon('alert', 15) + '<span><b>El navegador bloquea el guardado local.</b> El progreso de esta sesión no se conservará al cerrar. Revisa el almacenamiento del sitio o exporta un respaldo ahora.</span><button type="button" class="btn btn--ghost btn--sm" data-action="export-save">Exportar</button>';
  document.body.appendChild(storageBanner);
}
function showBackupBanner() {
  if (backupBanner) { backupBanner.classList.remove('hidden'); return; }
  backupBanner = document.createElement('div');
  backupBanner.id = 'backupBanner';
  backupBanner.className = 'backupBanner';
  backupBanner.innerHTML = icon('download', 15) + '<span><b>Tu observatorio vive en este navegador.</b> Hace tiempo que no guardas una copia. Un respaldo tarda un momento y evita sorpresas.</span><div><button type="button" class="btn btn--primary btn--sm" data-action="export-save">Exportar partida</button><button type="button" class="btn btn--quiet btn--sm" data-action="backup-later">Más tarde</button><button type="button" class="btn btn--quiet btn--sm" data-action="backup-off">No recordar</button></div>';
  document.body.appendChild(backupBanner);
}
function hideBackupPrompt() { if (backupBanner) backupBanner.classList.add('hidden'); }
function dismissBackupPrompt(forever) {
  state.backup = state.backup || { lastExportedAt: null, lastPromptAt: null };
  if (forever) state.settings.backupReminder = false;
  else state.backup.lastPromptAt = nowISO();
  saveSettings();
  persist();
  hideBackupPrompt();
}
function maybeShowBackupPrompt() {
  if (!state.settings.backupReminder || !hasProgress() || recoveryInfo.corrupt) return;
  var now = Date.now();
  var lastExport = parseDate(state.backup && state.backup.lastExportedAt);
  var lastPrompt = parseDate(state.backup && state.backup.lastPromptAt);
  if (lastExport && now - lastExport.getTime() < 7 * 86400000) return;
  if (lastPrompt && now - lastPrompt.getTime() < 7 * 86400000) return;
  window.setTimeout(function () { if (screen === 'title' || screen === 'hub') showBackupBanner(); }, 1100);
}
function downloadCorruptData() {
  try {
    var blob = new Blob([recoveryInfo.raw || ''], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'serums-quest-datos-danados-' + dateKey() + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('Datos dañados descargados. No se modificó el guardado.', 'success', 4000);
  } catch (e) { toast('No se pudieron descargar los datos dañados.', 'error'); }
}
function recoverLocalBackup() {
  var raw = null;
  try { raw = window.localStorage.getItem(BACKUP_KEY) || window.localStorage.getItem(PREIMPORT_KEY); } catch (e) {}
  if (!raw) { toast('No hay una copia local disponible.', 'warn', 4000); return; }
  try {
    var parsed = JSON.parse(raw);
    var candidate = normalizeState(parsed.state || parsed);
    recoveryLock = false;
    recoveryInfo.corrupt = false;
    state = candidate;
    persist();
    saveSettings();
    enterTitle();
    toast('Copia local recuperada. Revisa tu progreso antes de continuar.', 'success', 5000);
  } catch (e) { toast('La copia local tampoco se pudo leer. Puedes importar un archivo o descargar los datos dañados.', 'error', 5000); }
}
function saveLocalBackup() {
  try {
    window.localStorage.setItem(BACKUP_KEY, JSON.stringify({ at: nowISO(), reason: 'manual', state: state }));
    toast('Copia local guardada en este navegador.', 'success', 3500);
  } catch (e) { toast('No se pudo guardar la copia local.', 'error'); }
}
function resetAfterCorruption() {
  if (Date.now() > recoveryResetArmed) {
    recoveryResetArmed = Date.now() + 6000;
    renderScreen();
    toast('Pulsa de nuevo para confirmar. Antes se conservará una copia de los datos dañados.', 'warn', 4500);
    return;
  }
  recoveryResetArmed = 0;
  try { if (recoveryInfo.raw) window.localStorage.setItem(CORRUPT_KEY, recoveryInfo.raw); } catch (e) {}
  recoveryLock = false;
  recoveryInfo.corrupt = false;
  state = defaultState();
  persist();
  saveSettings();
  enterTitle();
  toast('Empezamos de cero. El contenido dañado quedó archivado en este navegador.', 'warn', 5000);
}
function runWhenBoot() {
  applyAccessibilitySettings();
  autoDetectQuality();
  applyRenderQuality();
  showStorageWarning();
  if (recoveryInfo.corrupt) {
    setScreen('recovery');
    return;
  }
  maybeShowTutorial();
  if (!state.settings.tutorialSeen) return;
  maybeShowBackupPrompt();
}
