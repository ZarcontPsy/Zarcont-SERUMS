# AUTORIA.md — Registro central de autoría y versiones

**Titular y marca:** ZARCONT
**Repositorio:** `LAUNCHER SERUMS` (lanzador + cinco aplicaciones)
**Licencia:** propietaria — © 2026 ZARCONT, todos los derechos reservados (ver `LICENSE`)
**Última revisión de este registro:** 2026-11-10

---

## 1. Componentes del repositorio

| Componente | Ruta | Versión | Autoría | Origen |
|---|---|---|---|---|
| SERUMS HUB (lanzador) | `index.html` | 2.3.0 | ZARCONT | Desarrollo original; carrusel coverflow de cinco accesos, progreso real y navegación por flechas, puntos, swipe y teclado. Revisión 2026-10-25: dock retirado, responsive móvil/tablet/escritorio y pantalla completa; las tarjetas abren la portada de cada app. |
| BANQUEO · Examen Studio | `EXAMEN STUDIO/` | 2.1.1 | ZARCONT | Desarrollo original. Interfaz, banco, revisión, importación, práctica, historial y ranking local. Revisión 2026-10-25: controles de Inicio/HUB/pantalla completa y recuperación del intento al refrescar. |
| Dataset del banco | `EXAMEN STUDIO/datos/banco-oficial.js` | 2.1.1 | ZARCONT (compilación) | Generado por `tools/build_banco.py` a partir de 51 PDFs de evaluaciones SERUMS. Sin cambios en esta revisión. |
| PDFs originales | `EXAMEN STUDIO/documentos/` | — | Documentos públicos de origen | Copias intactas de los 51 PDFs aportados; no se modifican. |
| Auditoría documental | `EXAMEN STUDIO/datos/auditoria-oficial.json` | 2.1.1 | ZARCONT (compilación) | Generada por el mismo script; cobertura, páginas, claves e incidencias por documento. |
| SERUMS Map Explorer — PLAZAS SERUMS | `serums map/serums-map-explorer/` | 2.0.0 | ZARCONT | Desarrollo original; datos derivados de fuentes públicas (ver §3). Revisión 2026-10-25: controles de HUB/pantalla completa, ficha con foco y `Esc`, favoritos/adjudicadas persistentes y refresco localizado. |
| Study Dashboard | `study-dashboard/` | 2.3.0 | ZARCONT | Desarrollo original. Temario, lector rápido/completo, favoritos, objetivos, progreso e historial. Revisión 2026-11-10 (Fases 1 y 2 de «Estudio activo»): lectura activa con subrayados, notas, dudas, pausa de recuerdo, modo recordar, confianza y tarjetas propias; búsqueda en el cuerpo, índice, paleta y relacionadas; Ruta de hoy completa, editor de plan, mapa de dominio, repaso espaciado de fichas y herramientas de última hora (relámpago, hoja, glosario, datos y trampas); navegación secundaria «Más». |
| Study Flashcards | `study-flashcards/` | 2.1.0 | ZARCONT | Desarrollo original. Mazos, estudio libre, repaso, examen, errores, programación e historial. Revisión 2026-11-09: solo tokens de caché para consumir el store v2; sin cambios de lógica. Revisión 2026-11-10: tokens de caché de Fase 1 y regresión FLASH-01…09. |
| SERUMS QUEST | `serums-quest/` | 1.2.0 | ZARCONT | RPG educativo: Game Home cinematográfico, personajes coleccionables, cosméticos, estudio de equipamiento, tienda, escenarios SVG, audio sintetizado opcional, reacciones, misiones, XP, rangos, logros y recuperación de errores. Reutiliza el banco y el temario por referencia. Revisión 2026-10-25: cambio de personaje localizado y topbar responsive con controles comunes. |
| Capa compartida de Study | `study-shared/` | 2.3.0 | ZARCONT | Tokens, iconos, almacén, sincronización entre pestañas y utilidades comunes. Revisión 2026-11-10: store v2 con filtro por área, evento de recuerdo, fusión rápida, `plan.areaPriority` y resolución correcta de la raíz común en `urls.appUrl`; tokens semánticos y de subrayado accesibles, navegación móvil «Más» y utilidades de foco. |
| Lectura activa y navegación | `study-dashboard/js/active/`, `study-dashboard/js/nav/`, `study-dashboard/js/plan/` | 1.0.0 | ZARCONT | Módulos clásicos de integración, sin dependencias: subrayado/nota/recuerdo/confianza/dudas, búsqueda/índice/paleta/relacionadas y Ruta de hoy inicial. Se cargan con la app, nunca bajo un build. |
| Planificación Fase 2 | `study-dashboard/js/plan/plan.runtime.js`, `plan.ruta.js`, `plan.editor.js`, `plan.mastery.js`, `plan.review.js`, CSS `plan-*.css` | 1.0.0 | ZARCONT | Runtime compartido y cuatro vistas de planificación: ruta completa + resumen semanal, editor de plan y prioridad por área, mapa de dominio y repaso espaciado con primera programación. El motor se carga solo al abrir una vista. |
| Herramientas de última hora | `study-dashboard/js/nav/reference.js`, `glossary.integration.js`, `facts.integration.js`, `traps.integration.js`, `js/plan/plan.relampago.js`, `plan.lastday.js` y CSS `glossary/facts/traps/plan-relampago/plan-lastday` | 1.0.0 | ZARCONT | Glosario, datos, trampas, repaso relámpago y hoja imprimible; los derivados se cargan solo al abrir cada herramienta y `factsKnown` guarda el progreso de datos. |
| Contenido derivado de Study | `study-data/derived/` | 1.0.0 | ZARCONT (compilación) | Generado por `tools/build-derived.js` desde el temario: búsqueda sin acentos, glosario, datos, avisos y relacionadas con referencia a ficha y sección. Se carga bajo demanda. |
| Controles compartidos | `serums-chrome.js`, `serums-chrome.css` | 1.0.0 | ZARCONT | Inicio de la app, regreso al HUB y pantalla completa nativa; se montan en el topbar existente. |
| Arnés de pruebas | `tests/e2e/`, `tools/qa/` | — | ZARCONT | Matriz E2E con Node 24 + Chrome DevTools Protocol y utilidades de contraste/axe/capturas, sin dependencias en la app; no forma parte del producto distribuido. |
| Temario compartido | `study-data/temario.js` | 2.5.0 | ZARCONT (síntesis) | 5 áreas oficiales, 20 categorías, 85 temas + 22 fichas oficiales, 210 fichas y 630 flashcards con IDs estables. Fase 4: núcleo sin secciones + cinco chunks por área, con el archivo canónico intacto. |
| Fuentes documentales de Study | `study-data/fuentes/` | — | MINSA, OMS y artículo académico | Copias de los cinco PDFs aportados; no se modifican (ver §3). |
| Sistema de diseño | `DESIGN-SYSTEM.md` | 2.3 | ZARCONT | Documento interno del proyecto. |
| Datos de plazas | `datos/datos_plazas.js`, `datos/datos_adjudicados.js` | — | ZARCONT (compilación) | Generados por scripts propios a partir de las fuentes públicas de §3. |

## 2. Identificadores técnicos

- SERUMS HUB: `ZARCONT-SRH-2.3.0` (visible en «Acerca de»).
- SERUMS QUEST: `ZARCONT-SQ-1.2.0`, mapa de contenido `1.0.2`, esquema de datos `2`,
  catálogo RPG `1.2.0` (10 personajes, 33 cosméticos, 9 ranuras).
- BANQUEO: `Examen Studio 2.1.1`; scripts y estilos locales versionados con `?v=2.1.6`
  (caché de esta revisión) para evitar cachés antiguas.
- Study: contenido `2.5.0` (5 áreas oficiales, 20 categorías, 85 temas + 22 fichas oficiales, 210 fichas y 630 tarjetas);
  aplicaciones `Study Dashboard` y `Study Flashcards`, sin prefijos de convocatoria ni años en nombres,
  encabezados o textos de interfaz. Tokens de caché de esta revisión: Study Dashboard `2.3.0`,
  Study Flashcards `2.3.0` para los assets compartidos, QUEST `1.2.1` y Plazas `2.0.1`;
  los datos y el temario conservan sus versiones.
- Encabezado de autoría: cada archivo propio incluye una línea `© 2026 ZARCONT`.
- Metadatos: `<meta name="author" content="ZARCONT">` en las interfaces.
- Persistencia local de BANQUEO: IndexedDB `examenstudio` versión 2
  (`attempts`, `review`, `imports`, `files`, `audits`, `issues`, `questions`, `exams`).
  La revisión, el tema y las preferencias de práctica usan `localStorage`
  (`banqueo-theme-v1`, `banqueo-name`, `banqueo-practice-*`); el marcador del intento activo
  para recuperar la vista tras un refresco usa `sessionStorage` (`banqueo-active-attempt-v1`).
  El intento y sus respuestas siguen guardados en IndexedDB `attempts`.
- Persistencia compartida de Study: IndexedDB `study-serums` versión 1,
  respaldo `study-state-v1` (esquema de estado **2**) y snapshot `studyhub:snapshot:v1` en
  `localStorage`. El esquema 2 es aditivo: mantiene `sheets`/`cards` de Flashcards y añade
  anotaciones, dudas, confianza, repaso de fichas, recuerdo, tarjetas propias, plan, resumen
  semanal y hechos conocidos con tombstones. Las copias de seguridad previas a operaciones
  destructivas usan `study-backup-preclear-v1` y `study-backup-preimport-v1`; el recordatorio
  usa `study-backup-meta-v1`. El tema visual usa `study-theme` y el modo de lectura
  `study-dashboard-mode`. No reutiliza ni modifica las claves de BANQUEO ni de PLAZAS SERUMS.
- Contenido derivado de Study: `study-data/derived/{manifest,search,glossary,facts,warnings,related,report}.json`,
  generado de forma determinista y cargado solo bajo demanda mediante `StudyDerived`; no se
  descarga al arrancar.
- Persistencia de SERUMS QUEST: `localStorage` con estado versionado
  `serumsquest:state:v1` (esquema 2: incluye `collection`, `economy` y `presentation`),
  respaldo `serumsquest:backup:v1`, diario `serumsquest:journal:v1`,
  snapshot para el HUB `serumsquest:snapshot:v1` y archivos `serumsquest:archive:*`.
  No escribe en las claves de Study, Examen Studio ni Plazas.

## 3. Procedencia de datos y terceros

- Los 51 PDFs de evaluaciones SERUMS (2025-I, 2026-I y 2026-II) fueron aportados al
  proyecto como documentos públicos de origen. El proyecto no reclama autoría sobre
  ellos; conserva copias intactas y enlaza cada pregunta a su documento y página.
- El dataset se compiló con **PyMuPDF** (extracción offline) y un script propio.
  Los resaltados amarillos de los PDFs son rellenos vectoriales, no anotaciones PDF;
  el script los detecta por geometría y color. No se inventaron claves.
- Cobertura actual: **51 exámenes · 17 profesiones · 5.100 preguntas · 5.100 claves
  identificadas**. Once profesiones generales y seis áreas de Tecnología Médica.
  Hay 2.695 registros duplicados en 580 grupos; se detectan y muestran, no se eliminan.
- **Revisión humana: 0 preguntas.** La cobertura del 100% significa que cada pregunta
  tiene una clave identificada automáticamente, no que haya sido revisada por una
  persona. La interfaz muestra `reviewed = 0` y no declara lo contrario.
- Los conjuntos de plazas provienen de documentos y listados públicos oficiales (MINSA):
  oferta de plazas remuneradas SERUMS, listado RENIPRESS, listado de adjudicados y
  resultados finales. El proyecto no reclama autoría sobre ellos.
- El temario de Study se sintetizó a partir de cinco PDFs aportados: el artículo
  académico sobre atributos de la APS, el documento técnico MCI, el manual AUDIT de la
  OMS, la norma técnica de salud materna y la guía técnica de continuidad de cuidados
  en salud mental comunitaria. Las fichas son una **síntesis de estudio**: no sustituyen
  la norma vigente ni el juicio clínico. Cada referencia enlaza al documento y página.
- Clasificación editorial aplicada: MCI, salud materna y continuidad de trastornos
  mentales se identifican como documentos técnicos o normas MINSA; AUDIT como manual de
  referencia de la OMS; el artículo de APS como revisión académica, **no** como norma
  MINSA. No se inventaron claves, estadísticas, fuentes ni contenido «oficial».
- SERUMS QUEST consume el banco de Psicología de Examen Studio y el temario de Study por
  referencia. `serums-quest/data/quest-map.js` solo contiene IDs y una afinidad temática
  editorial; no copia enunciados, alternativas ni claves. Las preguntas con afinidad baja
  o sin área no se usan en misiones ni modos puntuables.
- **SERUMS QUEST no integra assets visuales ni sonoros de terceros.** Los 10 personajes,
  las 33 capas cosméticas, los 5 escenarios, los iconos y los 17 efectos de audio son
  originales creados en código (SVG/WebAudio). Se evaluaron cuatro repositorios visuales y
  varios packs CC0 de audio y se rechazaron por estilo, licencia o trazabilidad. La
  auditoría, las URLs y los límites están en `serums-quest/docs/ASSETS.md`; la política
  general, en `NOTICE.md`.
- Dataset de Study: 5 áreas oficiales, 20 categorías, 85 temas + 22 fichas oficiales, 210 fichas y 630 flashcards
  (tres por ficha: conceptual, opción múltiple y aplicación), con IDs únicos para áreas,
  temas, subtemas, fichas, tarjetas, referencias y fuentes.
- Librerías, fuentes tipográficas y servicios de terceros: ver `NOTICE.md`.
  - PDF.js 3.11.174 (CDN de cdnjs) para leer PDFs al importar.
  - Tesseract.js 5.1.1 (CDN de jsDelivr), solo si se activa OCR.
  - Google Fonts: Inter y Zen Dots.
  Las licencias de terceros prevalecen para dichos componentes.

## 4. Funciones y límites de esta revisión (2026-10-20)

### Incluido

- HUB con carrusel coverflow y cinco accesos diferenciados: BANQUEO, PLAZAS SERUMS,
  Study Dashboard, Study Flashcards y SERUMS QUEST. La tarjeta central abre la portada de la
  aplicación; las laterales se seleccionan con clic, flechas, puntos, swipe o teclado. Muestra
  progreso real y último punto de Study; la reanudación se ofrece dentro de cada app y en las
  rutas directas, y el hub se actualiza entre pestañas.
- Study Dashboard: panel, biblioteca, búsqueda y filtros, lector rápido/completo, fichas,
  conceptos, procedimientos, tablas, favoritos, objetivos, progreso, historial y recomendaciones.
- Study Flashcards: mazos jerárquicos, tarjetas conceptuales/de opción múltiple/aplicación,
  estudio libre, repaso rápido, examen, errores, dominio, programación, historial y respuestas explicadas.
- SERUMS QUEST: cinco rutas de área, misiones, jefes, desafío diario, supervivencia,
  contrarreloj, recuperación espaciada, XP, niveles, rangos, monedas, logros, resultados
  verificables, registro local y ajustes. Integra el banco de Psicología y las fichas de
  Study por referencia; no copia ni modifica las fuentes.
  - Build 1.2.0: navegación de cinco secciones con barra inferior móvil; Game Home con
    escenario; arena de héroes; estudio de equipamiento con borrador y guardado; tienda;
    escenarios SVG por área; 17 efectos y pad ambiental sintetizados; preferencias de audio;
    presentación cinematográfica de desbloqueo; caché de arte y pausa fuera de pantalla.
  - Arte vectorial original **provisional** (no encargado); cada personaje conserva
    `assetReferences.upgradePath` para sustituirlo por ilustración final.
- Navegación cruzada Dashboard ↔ Flashcards con conservación de tema, mazo, ficha y sesión;
  estados informativos con alternativas cuando el destino no tiene contenido.
- Persistencia compartida por mismo origen HTTP y sincronización entre pestañas; las
  estadísticas se calculan solo con actividad real. Cada aplicación conserva su interfaz.
- Banco real por profesión y convocatoria, con búsqueda, filtros, duplicadas e incidencias.
- Detalle de pregunta con alternativas, clave, evidencia y enlace al PDF original en su página.
- Revisión con cola, observaciones, auditoría y estados; no se autodeclara revisión humana.
- Importación local de PDFs: análisis de todas las páginas, clasificación por contenido,
  detección de resaltados vectoriales, auditoría y guardado explícito.
- Práctica con configuración, cronómetro, feedback, entrega, resultado, historial y ranking.
- Persistencia local tolerante a fallos: si IndexedDB no responde, la app sigue sin
  persistencia y lo indica en el pie.

### Límites conocidos

- La importación requiere conexión para cargar PDF.js desde el CDN. El banco oficial,
  la revisión y la práctica funcionan con los archivos locales.
- El OCR depende de Tesseract.js y de poder rasterizar la página; si no es posible,
  la importación marca la incidencia y no inventa texto ni claves.
- La detección automática de claves puede fallar en PDFs con resaltados sobre el
  enunciado, más de una alternativa resaltada o maquetaciones atípicas. Esos casos se
  envían a revisión; la clave nunca se completa por suposición.
- La app no es multiusuario ni sincroniza entre dispositivos: el progreso vive en el
  navegador. Borrar los datos del sitio elimina intentos, revisión e importaciones.
- El contenido de Study es una síntesis editable sujeta a verificación en la fuente
  original; no es una publicación oficial ni reemplaza protocolos, normas o decisiones
  clínicas. La interfaz no muestra años ni números de convocatoria.
- El progreso compartido de Study requiere servir el HUB y las dos aplicaciones desde el
  mismo origen HTTP. Abrir los archivos con `file://` puede aislar el almacenamiento y
  romper la reanudación; la app no presenta ese estado como si hubiera progreso.
- Si IndexedDB no está disponible, Study usa `localStorage` como respaldo. La
  sincronización entre pestañas fusiona tarjetas, sesiones, actividad, historial y último
  punto para reducir sobrescrituras; no sustituye una cuenta ni un servidor.
- No se afirma ninguna protección anticopia. El manifiesto de integridad permite
  detectar cambios, no impedir copias.

## 5. Integridad verificable

```bash
python verificar_integridad.py            # verifica
python verificar_integridad.py --generar  # regenera el manifiesto
```

`INTEGRITY.sha256` cubre los archivos propios del repositorio. **Exclusiones
deliberadas:** los JSON crudos de entrada en `serums map/` (datos fuente sin procesar),
carpetas `__pycache__/`, `node_modules/`, `.git/` y el propio manifiesto.

El manifiesto permite **detectar** modificaciones accidentales o no autorizadas; **no
impide la copia** del código: ninguna medida del lado del cliente puede impedirlo. Su
valor es probatorio y de mantenimiento, no anticopia.

## 6. Recomendaciones de protección (no implementadas en esta revisión)

1. Mantener el proyecto en un **repositorio privado** con historial de cambios.
2. Restringir las claves de Google Maps por referrer y por API; no usar la clave de
   demostración en producción (la propia app lo advierte).
3. En distribución pública: conservar avisos, `AUTORIA.md` y el manifiesto; valorar
   minificar sin eliminar los metadatos de autoría.
4. Si se explota comercialmente, registrar la marca «ZARCONT» ante la autoridad
   competente y formalizar licencias por escrito.

## 7. Revisión de auditoría — 2026-10-25

Intervención sobre el proyecto existente (sin reconstrucción, sin borrar datos y sin alterar
el contenido académico ni los IDs). Detalle e evidencias en `AUDIT/` e
`INFORME-AUDITORIA-ECOSISTEMA.md`.

### Cambios funcionales

- **HUB:** retirado el dock lateral y sus restos (CSS/JS/markup). Las cinco tarjetas del hub
  abren la portada de cada aplicación (sin `?sheet=`/`?deck=&resume=1` inyectados); el último
  punto se sigue mostrando y la reanudación vive dentro de cada app y en las rutas directas.
  Responsive verificado de 320×568 a 1440×900, orientación y ventanas bajas; pantalla completa
  nativa visible también en móvil.
- **Controles comunes:** `serums-chrome.js`/`.css` añaden Inicio, Volver al HUB y pantalla
  completa en el topbar existente de las cinco apps, con foco, etiquetas, `aria-pressed`,
  contraste y áreas táctiles. No se creó una barra nueva.
- **Study Dashboard:** restauración estable de la posición de lectura, deep links obsoletos
  tolerantes (portada + aviso), temas desplegados persistentes durante la sesión y referencias
  enlazadas al PDF original.
- **Study Flashcards:** biblioteca jerárquica (áreas plegables, filas de mazo, búsqueda y
  filtros) en lugar de 210 tarjetas siempre desplegadas; navegación interna sin recarga,
  conservación de filtros/contexto y URL de mazo compartible. Contenido, IDs y progreso intactos.
- **SERUMS QUEST:** cambio de personaje localizado (sin reconstruir `#view`), sin residuos del
  personaje anterior, con transición breve y respeto a movimiento reducido; topbar responsive.
- **Banqueo / Examen Studio:** controles comunes, preferencias de práctica persistentes,
  recuperación del intento al refrescar y guardado inmediato al salir de la sesión.
- **Plaza SERUMS:** ficha/clave/exportación con `role="dialog"`, foco y `Esc`; refresco
  localizado de favoritos/adjudicadas; badge de adjudicación al arrancar; cierre del panel móvil
  al seleccionar una plaza.
- **Persistencia:** correcciones en los cuatro almacenes (Study, QUEST, Examen Studio y Plazas)
  sin renombrar claves ni borrar datos; se conservan `study-state-v1`, `studyhub:snapshot:v1`,
  `serumsquest:*`, IndexedDB `study-serums`/`examenstudio`/`serumsdb` y `serums_*`.

### Verificación

- Arnés E2E `tests/e2e/` (Node + CDP, sin dependencias): navegación, persistencia con refresco y
  cierre real de Chrome, responsive, pantalla completa y regresión de contenido (210 fichas,
  630 tarjetas, 51 exámenes/5.100 preguntas, 7.323 plazas, 10 personajes).
- Resultados y limitaciones concretas (Google Maps sin red/clave, `file://` como origen distinto,
  bfcache no activado en headless, fullscreen en iOS) se registran en el informe final y en
  `AUDIT/QA.md`. No se declara ninguna prueba no ejecutada como superada.

### Versiones y caché

Las versiones semánticas de las apps se mantienen; los cambios se sirven con tokens `?v=`
actualizados en los HTML de entrada para evitar cachés antiguas. `INTEGRITY.sha256` se regenera
al cierre de esta revisión. No se modificaron `study-data/`, los PDF, los JSON de plazas, el
banco oficial ni los documentos de terceros.

## 8. Revisión 2.3.0 — Fase 0 de «Estudio activo» (2026-11-09)

Intervención aditiva sobre Study Dashboard, su capa compartida y la documentación, sin cambiar
el temario, los IDs, los PDF ni las cajas de repaso de Study Flashcards. Detalle completo en
`study-dashboard/docs/`, `study-dashboard/informe/fase0/`, `tools/qa/salida/` y
`AUDIT/evidencias/phase0-final-stable/`.

### Incluido

- **Cimientos:** `StudyApp.registerModule`, bus de eventos y registro de atajos; rutas de módulo
  con montaje, error boundary y scroll por ruta; versión 2.3.0 sincronizada y `meta author`.
- **Estado seguro:** esquema v2 aditivo, migración probada con un fixture v1 real, tombstones,
  `resetAt`, exportar/importar JSON versionado, borrado con doble confirmación, copias previas y
  recordatorio de respaldo cada 7 días. La API antigua y el snapshot del HUB no cambian.
- **Contenido derivado:** generador sin dependencias y siete índices JSON (búsqueda en el cuerpo,
  glosario, datos, avisos, relacionadas y reporte de validación) con carga bajo demanda.
- **Lectura y navegación preparadas:** biblioteca de componentes, con previsualizadores internos,
  para subrayados, notas, pausa de recuerdo, confianza, búsqueda, índice, paleta, glosario y
  panel de fuentes.
- **Planificación:** modelo puro documentado y probado (ruta de hoy, plan por examen, dominio,
  repaso de fichas y resumen semanal), sin integrar aún en la UI.
- **Diseño y accesibilidad:** tokens semánticos y de subrayado para ambos temas verificados por
  script; appbar móvil reducida a cinco controles con panel «Más»; objetivos táctiles de 44 px;
  foco y tablas accesibles. Correcciones H1, H2, H3, H5, H6, H7, H8, H9, H11, H12, H13, H14,
  H15, H16, H19 y H20.

### Verificación

- E2E `DASH-01…17` y `FLASH-01…09` → 26/26 PASS.
- 15 pruebas del store v2 y 84 del modelo de plan.
- Contraste con 0 fallos requeridos, 24 auditorías axe sin violaciones y 24 capturas en ambos
  temas y viewports.
- Chrome headless en Windows; no sustituye lector de pantalla ni móvil real.

## 9. Revisión 2.3.0 — Fase 1 de «Estudio activo» (2026-11-10)

Integración pública sobre la Fase 0, sin cambiar el temario, los IDs, los PDF ni las cajas de
repaso de Study Flashcards. Detalle en `study-dashboard/informe/fase1/`, `docs/`,
`tools/qa/salida/` y `AUDIT/evidencias/phase1-release/`.

### Incluido

- **Lectura activa:** subrayados con cuatro marcas y nota, reanclaje con cita/prefijo/sufijo/
  sección/párrafo, huérfanos recuperables, tarjetas propias, panel local y `#/subrayados`,
  pausa de recuerdo configurable 1/2/3 con tarjetas reales, modo recordar, confianza editable y
  bandeja `#/dudas` con contador en el Panel. Preferencias en `study-active-prefs-v1` (fuera del
  estado exportado). No se tocan `cards` ni `flashSession`.
- **Navegación:** búsqueda en el cuerpo sin acentos, ranking título > conceptos > cuerpo,
  fragmento escapado, filtro por área, índice con scrollspy, paleta Ctrl+K/⌘K y fichas
  relacionadas con motivo textual o estructural aprobado. El índice de búsqueda se pide solo al
  enfocar el campo; `related.json` solo al abrir una ficha.
- **Ruta de hoy inicial:** bloque reutilizable en el Panel con siguiente/pendientes, dudas
  abiertas, repasos y tarjetas vencidas, tiempo estimado declarado y estados vacío/al día/
  presupuesto cero/error. No crea ni edita el plan; no carga `plan-model.js` al arrancar.
- **Store v2:** filtro `annotations.list({areaId})`, evento `recall:changed` por DOM y bus,
  optimización de la fusión entre pestañas y pruebas de volumen. Se conservan la API antigua, la
  clave `study-state-v1` y la IndexedDB `study-serums` v1.
- **Caché y HUD:** `?v=2.3.0` en las dos apps; `initModule` corregido para ejecutar `init`,
  `palette:open` con foco visible al cerrar y montajes accesibles.
- **Accesibilidad:** 0 violaciones axe en 66 auditorías, contraste AA en los estados nuevos,
  objetivos de 44 px, teclado real, roles de hoja/diálogo y movimiento reducido.

### Verificación

- E2E `DASH-01…30` + `FLASH-01…09` → **39/39 PASS** (`phase1-release`).
- Store v2 → **25/25**; modelo de plan → **99/99**.
- axe-core → **66 auditorías, 0 violaciones**, 9 estados abiertos, 530 nodos incompletos
  remedidos a mano.
- Contraste de tokens → 100 comprobaciones, 0 requeridas fallan.
- Capturas → **110 PNG**, 6 viewports, 12 estados, 0 overflow y 0 controles <44 px.
- Carga inicial → 3.436,2 KB / 28 peticiones; el equivalente sin assets de Fase 1 es 2.901 KB;
  delta observado +535,3 KB. Los derivados siguen fuera del arranque: búsqueda solo al enfocar y
  relacionadas solo al abrir ficha.

### Pendiente conocido

- **H4:** la división del temario inicial no se aborda todavía para no romper Study Flashcards.
  El aumento de carga de Fase 1 es código de funciones y estilos, no índices derivados.
- Revisión humana con NVDA/VoiceOver y hardware iOS/Android pendiente.
- Fase 3 no iniciada: `#/relampago`, `#/ultimo-dia`, `#/glosario`, `#/datos` y `#/trampas` siguen reservadas.


## 10. Revisión 2.3.0 — Fase 2 de «Estudio activo» (2026-11-10)

Planificación integrada sobre la Fase 1, sin cambiar el temario, los IDs, los PDF ni las
cajas de Study Flashcards. Detalle en `study-dashboard/informe/fase2/`, `docs/CONTRATOS-FASE2.md`,
`tools/qa/salida/` y `AUDIT/evidencias/agente6-fase2-final3/`.

### Incluido

- **Runtime y carga perezosa:** `plan.runtime.js` une store, contenido y modelo; `plan-model.js`
  se inyecta solo al abrir `#/ruta`, `#/plan`, `#/dominio` o `#/repaso`.
- **Ruta de hoy completa:** presupuesto, estado del plan, ítems con motivo/minutos/acción,
  bloqueo mínimo, señales abiertas y resumen semanal persistido sin duplicar la semana.
- **Editor de plan:** fecha de examen, minutos/día (0 explícito), días/semana y prioridad por
  las cinco áreas oficiales; vista previa con el modelo, validación, guardado parcial y borrado
  confirmado sin tocar el progreso.
- **Mapa de dominio:** áreas, categorías, puntaje, banda textual, cobertura de señales/fichas,
  señales ausentes y punto más flojo; el vacío se declara, no se convierte en cero.
- **Repaso espaciado:** repasos por vencimiento, autoevaluación que reprograma con
  `nextSheetReview` + `sheetReview.save`, y sección productiva para programar la primera
  revisión de fichas completadas con confianza.
- **Navegación:** Más → Planificación (4 enlaces), entradas en la paleta y «Ver ruta completa»
  en el Panel. La appbar móvil sigue con cinco controles.
- **Store:** `plan.areaPriority` compatible con v1/v2; `urls.appUrl` resuelve la raíz común.

### Verificación

- E2E `DASH-01…38` + `FLASH-01…09` → **47/47 PASS**, `stable:true`.
- Modelo/integración de planificación → **118/118**; store v2 → **29/29**.
- axe → **100 auditorías, 0 violaciones**, 12 estados; 782 nodos de contraste remedidos.
- Capturas → **176 PNG**, 6 viewports, 15 estados, 0 overflow.
- Carga inicial → **3.727 KB / 37 peticiones**; Fase 1: 3.441,6 KB; Fase 0: 2.903,5 KB.
  Delta de Fase 2: **+285,4 KB**. `plan-model.js`: 0 peticiones al arrancar, 1 al abrir
  `#/ruta` (110 ms).

### Pendiente conocido

- **H4:** el temario inicial sigue sin dividirse; la carga crece por código de producto, no por
  índices derivados (que siguen bajo demanda).
- Revisión humana con NVDA/VoiceOver y hardware iOS/Android pendiente.
- Fase 4 no iniciada.


## 11. Revisión 2.3.0 — Fase 3 de «Estudio activo» (2026-11-10)

Última hora integrada sobre las fases anteriores, sin cambiar el temario, los IDs, los PDF ni
las cajas de Study Flashcards. Detalle en `study-dashboard/informe/fase3/`,
`docs/CONTRATOS-FASE3.md`, `tools/qa/salida/` y `AUDIT/evidencias/phase3-release2/`.

### Incluido

- **Glosario:** 57 definiciones explícitas, búsqueda sin acentos, área, enlace a ficha y estados
  de carga/error/vacío.
- **Datos para memorizar:** 261 datos de tabla, filtros, progreso global y `factsKnown`
  persistente, sin tocar Flashcards.
- **Trampas frecuentes:** 451 avisos/distinciones, fuente, área, búsqueda, paginación y enlace
  a la ficha.
- **Repaso relámpago:** ronda de 10 preguntas reales, revelar, calificar, puntuación y reinicio;
  sin escribir estado.
- **Hoja de último día:** tres bloques por área, fecha de examen, impresión A4 y enlace a
  `#/plan`.
- **Navegación:** Más → Última hora, 15 entradas de paleta y franja «Antes del examen» en
  `#/ruta`; appbar móvil intacta.
- **Carga:** `StudyReference` solo descarga `glossary/facts/warnings` al abrir la herramienta.

### Verificación

- E2E `DASH-01…44` + `FLASH-01…09` → **53/53 PASS**, `stable:true`.
- Planificación y store → **118/118** y **29/29**.
- axe → **120 auditorías, 0 violaciones**, 12 estados; contraste de tokens 100/0 requeridas.
- Capturas → **258 PNG**, 6 viewports, 18 estados, 0 overflow.
- Carga inicial → **3.953,1 KB / 48 peticiones**; delta de Fase 3 **+222,3 KB**; 0 derivados al
  arrancar y 1 request de cada JSON solo en su ruta.

### Pendiente conocido

- **H4:** el temario inicial sigue sin dividirse; el crecimiento es código/CSS de producto.
- El glosario enlaza a la ficha, no a `#section-N`; el router actual no soporta anclas de sección.
- Revisión humana con NVDA/VoiceOver y hardware iOS/Android pendiente.
- Fase 4 no iniciada.


## 12. Revisión 2.3.0 — Fase 4 de «Estudio activo» (2026-11-10)

H4 y el cierre editorial H17/H18. Detalle en `informe/fase4/`, `docs/CONTRATOS-FASE4.md`,
`docs/INFORME-EDITORIAL-H17-H18.md`, `tools/qa/salida/` y `AUDIT/evidencias/agente6-fase4-final3/`.

### Incluido

- **H4 — núcleo y secciones:** `study-data/temario-core.js` (842.784 B) conserva metadatos y
  630 tarjetas sin secciones; cinco chunks por área (1.215.363 B) se cargan al abrir una ficha.
  `content-loader.js` expone `ensureSheet/loadArea/needs`, cachea por área y reintenta.
- **Dashboard:** estado de carga accesible, error con Reintentar, cancelación de respuestas
  tardías y una sola petición por área; el lector se monta completo al llegar las secciones.
- **Study Flashcards:** sigue cargando cards y metadatos del core, sin chunks ni loader.
- **HUB:** misma clave `studyhub:snapshot:v1`, sin peticiones a `study-data/`.
- **H17:** 85 temas + 22 fichas oficiales · 210 fichas; sin «86 módulos» visible.
- **H18:** 46/48 fuentes citadas en fichas; las dos estructurales quedan documentadas sin
  inventar citas.

### Verificación

- E2E DASH-01…48 + FLASH-01…09 + HUB + F4 → **74/74 PASS**, `stable:true`.
- Datos → **36/36**; el generador reproduce core/chunks y `temario.js` conserva su hash.
- axe → **128 auditorías, 0 violaciones**, 0 pendientes; contraste en página 1.042/0.
- Capturas → **290 PNG**, 22 estados, 6 viewports, 0 problemas.
- Peso inicial → Dashboard **3.959,6 → 2.263,3 KB (−42,8 %)**; Flashcards
  **2.832,3 → 1.128,3 KB (−60,2 %)**; HUB 11 KB sin cambios; core+loader 830,9 KB;
  primera área 524,3 KB.

### Pendiente conocido

- El core conserva las 630 tarjetas (830,9 KB); dividirlas queda para otra revisión.
- La primera ficha del área II carga 524,3 KB; no se precargan áreas para conservar la ventaja.
- Revisión humana con NVDA/VoiceOver, iOS/Android físico y red real pendiente.
- Fase 5 no iniciada.

---

© 2026 ZARCONT — Documento interno del proyecto.
