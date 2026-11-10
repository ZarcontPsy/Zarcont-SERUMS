# CHANGELOG · Study Dashboard

Formato basado en Keep a Changelog. Las fechas usan `America/Lima`.
El detalle de cada entrega y sus pruebas vive en `docs/` e `informe/fase0/` + `informe/fase1/`.

## [2.3.0] · Estudio activo — en desarrollo

### Fase 4 · Carga inicial y cierre editorial (2026-11-10)

#### Añadido
- H4: `study-data/temario-core.js` (metadatos + 630 cards, sin secciones) y cinco chunks por área cargados al abrir una ficha.
- `study-data/content-loader.js`: `ensureSheet/loadArea/needs`, caché por área, query de versión, error recuperable con `&retry=N`.
- `tools/build-content-split.js`: generador determinista, cobertura de 210 fichas / 1.392 secciones y manifiesto `content-split.json`.
- Dashboard: estado de carga accesible, error con Reintentar, cancelación de respuestas tardías y una petición por área.
- H17: Panel/Biblioteca/HUB muestran 85 temas + 22 fichas oficiales · 210 fichas; recomendaciones sin contenedor.
- H18: documentación de las dos fuentes estructurales sin citar (`src-psico-temario`, `src-nutricion-ninos-anterior`).

#### Corregido
- La marca de 86 «módulos» se reemplaza por 85 temas + 22 fichas oficiales en el producto.
- El núcleo y los chunks no alteran IDs, tarjetas, fuentes ni el archivo canónico `temario.js`.

#### Verificación
- E2E DASH-01…48 + FLASH-01…09 + HUB + F4: **74/74 PASS**, `stable:true`.
- Datos: **36/36**; generador reproducible; `temario.js` conserva su hash.
- axe: **128 auditorías · 0 violaciones · 0 pendientes**; contraste 1.042/0.
- Capturas: **290 PNG**, 22 estados, 6 viewports, 0 problemas.
- Carga inicial: Dashboard **3.959,6 → 2.263,3 KB (−42,8 %)**; Flashcards **2.832,3 → 1.128,3 KB (−60,2 %)**; HUB 11 KB sin cambios; core+loader 830,9 KB; primera área 524,3 KB.

#### Notas
- El core conserva 630 tarjetas; dividirlas queda para otra revisión.
- La primera ficha del área II tarda ~0,96 s en local por el chunk de 524,3 KB.
- Fase 5 no iniciada.

### Fase 3 · Última hora (2026-11-10)

#### Añadido
- Rutas `#/relampago`, `#/ultimo-dia`, `#/glosario`, `#/datos` y `#/trampas`, con datos derivados cargados solo al abrir cada herramienta.
- Glosario global: 57 definiciones explícitas, búsqueda sin acentos, filtro por área, enlace a la ficha y estado vacío/error con reintento.
- Datos para memorizar: 261 filas de tabla, búsqueda/área, filtro de pendientes, progreso global y marca `factsKnown` persistente.
- Trampas frecuentes: 451 avisos/distinciones, filtros por área y fuente, paginación 40+40 y enlaces a la ficha.
- Repaso relámpago: ronda de 10 preguntas reales (datos, definiciones y avisos), revelar, calificar, puntuación y reinicio; sin persistencia ni Flashcards.
- Hoja de último día: datos, definiciones y avisos por área, fecha de examen del plan, impresión A4 (`window.print`) y estado sin plan.
- `StudyReference` como puente compartido de carga perezosa, normalización, filtros y `factsKnown`; `#/ruta` incorpora la franja «Antes del examen».
- Navegación: Más → Última hora (5 enlaces), 15 entradas en la paleta y enlaces desde `#/ruta`. Appbar móvil intacta.

#### Corregido
- El filtro de datos pendientes usa `pendingOnly` en el puente compartido.
- Enlaces y accesos de las cinco rutas, incluyendo la ausencia de secciones inexistentes en el glosario.
- Caché de las pruebas QA: las vistas se prueban en documento nuevo para no arrastrar la app anterior.

#### Verificación
- E2E `DASH-01…44` + `FLASH-01…09`: **53/53 PASS**, `stable:true`.
- Planificación y store: **118/118** y **29/29**.
- axe: **120 auditorías · 0 violaciones · 0 pendientes**, 12 estados; contraste de tokens 100 comprobaciones, 0 requeridas fallan.
- Capturas: **258 PNG**, 6 viewports, 18 estados, 0 overflow; 0 controles <44 px en coarse.
- Carga inicial: **3.953,1 KB / 48 peticiones**; Fase 2: 3.730,8 KB; delta de Fase 3: **+222,3 KB**. Cero derivados al arrancar: glosario/datos/trampas se piden solo en su ruta; `plan-model.js` sigue fuera del arranque.

#### Notas
- H4 sigue abierto: el temario inicial no se divide. El crecimiento es código/CSS de las herramientas y no datos derivados.
- El glosario enlaza a la ficha, no a un ancla de sección: el router no admite `#section-N` en el hash de ficha.
- Fase 4 no iniciada.

### Fase 2 · Planificación (2026-11-10)

#### Añadido
- Rutas públicas `#/ruta`, `#/plan`, `#/dominio` y `#/repaso`, con `plan.runtime.js` como puente único al motor. `plan-model.js` se carga **solo** al abrir una de esas vistas; no se solicita en la portada, biblioteca ni ficha.
- `#/ruta`: ruta completa con presupuesto, estado del plan, ítems reales con motivo/minutos/acción, bloqueo mínimo, señales abiertas, enlaces operativos y resumen semanal persistido sin duplicar la semana.
- `#/plan`: editor de fecha de examen, minutos/día (0 explícito), días/semana y prioridad por las cinco áreas oficiales; vista previa con el modelo, validación, guardado parcial, confirmación de borrado y conservación de prioridades importadas.
- `#/dominio`: mapa de dominio por área/categoría con puntaje, banda textual, cobertura de señales y de fichas, señales ausentes y punto más flojo; estado vacío sin ceros falsos.
- `#/repaso`: repasos de ficha por vencimiento, autoevaluación que reprograma con `nextSheetReview` y `sheetReview.save`, y sección productiva para programar la **primera** revisión de fichas completadas con confianza declarada.
- Panel: enlace «Ver ruta completa» en Ruta de hoy; repasos enlazados a `#/repaso`. Más incorpora «Planificación» con cuatro enlaces; la paleta incluye las cuatro vistas. Appbar móvil intacta en cinco controles.
- Store: `plan.areaPriority` compatible con estados v1/v2, guardados parciales, export/import y tombstones; `urls.appUrl` resuelve la raíz común entre apps.
- Pruebas: DASH-31…38, 118 pruebas de planificación, 29 de store; axe 100 auditorías y 176 capturas.

#### Corregido
- `aria-progressbar-name` del medidor de ruta, contraste de ordinales, contraste de prioridad seleccionada del editor y `role="group"` en los grupos de Más.
- `StudyStore.urls.appUrl` ya no genera rutas dentro de la app actual (`/study-dashboard/study-flashcards/…`).
- La tarjeta del plan distingue la sesión planificada de la ruta recortada por topes, en lugar de mostrar dos cifras contradictorias.
- El resumen semanal se guarda también cuando la semana aún no tiene actividad y no se duplica.

#### Verificación
- E2E `DASH-01…38` + `FLASH-01…09`: **47/47 PASS**, `stable:true`.
- Modelo/integración de planificación: **118/118** · Store v2: **29/29**.
- axe: **100 auditorías · 0 violaciones · 0 pendientes · 12 estados**; 782 nodos de contraste remedidos, 0 fallos.
- Capturas: **176 PNG**, 6 viewports, 15 estados, 0 overflow.
- Carga inicial: **3.727 KB / 37 peticiones**; Fase 1: 3.441,6 KB; Fase 0: 2.903,5 KB. Delta Fase 2: **+285,4 KB**. `plan-model.js`: 0 peticiones al arrancar, 1 al abrir `#/ruta` (110 ms).

#### Notas
- H4 sigue abierto: no se divide el temario inicial.
- `#/repaso` no modifica las cajas ni `flashSession` de Study Flashcards.
- Fase 3 no iniciada: relámpago, último día, glosario, datos y trampas siguen reservadas.

### Fase 1 · Lectura activa, búsqueda y Ruta de hoy inicial (2026-11-10)

#### Añadido
- Lectura activa integrada: subrayados con cuatro marcas, nota opcional, reanclaje por cita/prefijo/sufijo/sección/párrafo, huérfanos recuperables y panel local.
- Vistas `#/subrayados` y `#/dudas`; tarjetas propias creadas y editadas desde un subrayado; bandeja de dudas con resolver/reabrir y contador en el Panel.
- Pausa de recuerdo configurable 1/2/3 secciones con tarjetas reales, interruptor persistente, revelar/autoevaluar/saltar, sin tocar las cajas de Flashcards; modo recordar y confianza editable.
- Búsqueda en el cuerpo sin acentos con fragmento resaltado, ranking, filtro por área y carga perezosa del índice; adaptador del derivado real.
- Índice flotante de secciones con scrollspy y hoja móvil; paleta Ctrl+K/⌘K con fichas, vistas y acciones; fichas relacionadas con motivo textual y respaldo estructural aprobado.
- Bloque Ruta de hoy inicial en el Panel: pendientes, dudas, repasos y tarjetas vencidas, tiempo estimado y estados vacío/al día/error, sin crear todavía el plan.
- Preferencias de lectura en `study-active-prefs-v1`; filtro `annotations.list({areaId})`; evento `recall:changed`.
- Pruebas DASH-18…30 y ampliaciones QA de axe, capturas, contraste y peso.

#### Cambiado / corregido
- `initModule` ejecuta de verdad el `init` de cada módulo.
- El botón de párrafo abre la barra de selección (estado `view.selection`); guardar cierra la barra y las tarjetas vinculadas se editan sin duplicar.
- El índice muestra una sola sección activa; la paleta oculta correctamente y devuelve el foco; búsqueda oculta/restaura la biblioteca normal.
- Contraste AA corregido en confianza, profundidad activa del índice y pista activa de la paleta.
- La sección de recomendaciones del Panel usa «Sugerencias» para no duplicar «Ruta de hoy».
- Tokens de caché `?v=2.3.0` sincronizados; Study Flashcards solo cambia caché y mantiene FLASH-01…09 verde.

#### Verificación
- DASH-01…30 + FLASH-01…09: **39/39 PASS**.
- Store v2: **25/25** · Modelo de plan: **99/99**.
- axe: **66 auditorías, 0 violaciones** · Contraste: 0 fallos requeridos.
- Capturas: **110 PNG**, 6 viewports, 12 estados, 0 overflow.
- Carga inicial: 3.436,2 KB, sin derivados al arrancar; +535,3 KB frente al equivalente sin assets de Fase 1.

#### Notas
- H4 sigue abierto: no se divide el temario inicial para no romper el contenido compartido de Flashcards. El aumento de carga es código de funciones/estilos, no índices derivados.
- Revisión humana con NVDA/VoiceOver y hardware móvil pendiente.
- Fase 2 no iniciada: `#/ruta`, `#/plan`, `#/dominio` y `#/repaso` siguen reservadas.

### Fase 0 · Cimientos y correcciones (2026-11-09)

#### Añadido
- Registro público de módulos (`StudyApp.registerModule`), contexto de ruta, bus de eventos y registro de atajos en `app.js`.
- Rutas reservadas para lectura activa, planificación y navegación; envoltorio de módulos con estados de error y montaje.
- API de estado v2 en `study-shared/store.js`: anotaciones, dudas, confianza, repaso de fichas, recuerdo, tarjetas propias, plan, resumen semanal y datos memorizados, con tombstones y migración aditiva desde v1.
- Exportación e importación versionada del progreso, con vista previa, fusión o reemplazo confirmado, copia de seguridad previa y borrado total con doble confirmación. Ruta `#/respaldo`.
- Recordatorio discreto de respaldo cada siete días, solo con actividad real.
- Índices derivados bajo demanda para búsqueda en el cuerpo y futuras referencias; informe de validación del contenido.
- Tokens semánticos y de subrayado para ambos temas, con verificación automática de contraste.
- Navegación secundaria **Más** en móvil: la appbar queda en cinco controles y conserva Flashcards, Inicio, HUB, pantalla completa y tema dentro del panel.
- Biblioteca de componentes y previsualizadores internos de lectura activa y navegación, listos para la Fase 1.

#### Corregido
- H1: colores de éxito y aviso legibles en tema claro.
- H2: nombres accesibles dinámicos en los controles del lector móvil.
- H3: red de seguridad para el progreso local.
- H5: regiones de tabla desplazable enfocables y etiquetadas.
- H6: la biblioteca y Progreso conservan su posición al volver desde una ficha.
- H7: el objetivo diario muestra «Objetivo superado» en lugar de «3 de 2».
- H8: las fichas sin secciones de ampliación ya no muestran un selector de modo inútil.
- H9: el nombre accesible de la marca coincide con el texto visible.
- H11: la rejilla de recomendaciones se adapta cuando hay una sola tarjeta.
- H12: la página de área ya no repite su cabecera en el índice.
- H13: el historial mueve al principio la ficha repetida en vez de duplicarla.
- H14: la pista de atajo `/` desaparece mientras se escribe.
- H15: versión, metadatos de autoría, caché y © sincronizados.
- H19: el error de almacenamiento deja un aviso persistente en vez de ser reemplazado por la vista.

#### Notas
- La carga de contenido compartido no cambia en esta fase: los índices derivados son los únicos recursos nuevos y se descargan bajo demanda.
- H4 (dividir el temario inicial) y H10 (búsqueda en el cuerpo dentro de la interfaz pública) se abordan en fases posteriores; sus cimientos quedan preparados.
- No se modificaron las cajas de repaso de Study Flashcards. Los cambios en Study Flashcards se limitan a versiones de caché y pruebas.

---

© 2026 ZARCONT — Documento interno del proyecto.
