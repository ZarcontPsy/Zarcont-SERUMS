# Informe de auditoría integral — Ecosistema SERUMS

**Repositorio:** `C:\Users\USARIO\Documents\ZARCONT SERUMS` · **Fecha:** 2026-10-25
**Alcance:** HUB + BANQUEO/Examen Studio + PLAZAS SERUMS/Serums Map + Study Dashboard +
Study Flashcards + SERUMS QUEST + capa compartida (`study-shared`, `study-data`).
**Naturaleza:** intervención sobre el proyecto existente, sin reconstrucción, sin borrar datos y
sin alterar contenido académico, IDs, claves ni reglas de negocio.

---

## A. Equipo ejecutado

Se usaron **9 roles**: 1 coordinador (agente principal) y **8 subagentes especializados reales**,
lanzados simultáneamente. El entorno no expone nueve procesos concurrentes independientes; el
coordinador ejecuta su propio trabajo mientras los 8 subagentes corren en paralelo, y la
coordinación se hizo por mensajes, traspasos y propiedad estricta de archivos
(`AUDIT/COORDINATION.md`).

| Rol | Identificador | Función | Concurrencia |
|---|---|---|---|
| **Agente 0** | Coordinador (agente principal) | Arquitectura, reparto, integración, documentación, verificación independiente y parches de cierre | Trabajo simultáneo con los 8 |
| Agente 1 | `ab8d5134-4e2b-450f-8f49-bbb5eee0d322` | Rutas, enlaces e integraciones | Paralelo desde el inicio |
| Agente 2 | `a021b7ea-4d72-43aa-9378-2e5549214bd2` | Persistencia, estado y ciclo de vida | Paralelo desde el inicio |
| Agente 3 | `5f7cb5ba-7b2d-4330-bcdf-91c144f7cb7d` | HUB, responsive y navegación continua | Paralelo desde el inicio |
| Agente 4 | `a33cd971-ce04-4147-8a3e-005fa1e56c8f` | SERUMS QUEST y cambio de personaje | Paralelo desde el inicio |
| Agente 5 | `05b6739f-bbe2-4ce0-8887-ecf8444ac925` | Study Flashcards y simplificación visual | Paralelo desde el inicio |
| Agente 6 | `5a8dcb00-a2ab-404a-8e7e-9f3de05c4fb8` | Study Dashboard, Plaza SERUMS, Banqueo y Examen Studio | Paralelo desde el inicio |
| Agente 7 | `1e30ce65-4ea3-476a-89b4-e7ad2e314eb0` | Controles compartidos, pantalla completa y accesibilidad | Paralelo desde el inicio |
| Agente 8 | `bab4d300-d970-45c1-bfa7-c1911265e4eb` | QA, regresión y validación integral | Paralelo desde el inicio |

**Traspasos reales entre agentes:** Agente 1 → Agente 6 (Banqueo sin HUB), Agente 1 → Agente 5
(`?deck=` obsoleto), Agente 2 → Agente 6 (acordeones del Dashboard y recuperación del intento),
Agente 3 → Agente 1 (liberación del HUB para D1), Agente 7 ↔ Agente 4 (topbar de QUEST),
Agente 7 → Agente 6 (compresión de botones en Plazas). Todos los traspasos están en
`AUDIT/agent-1..7-*.md` y `AUDIT/PERSISTENCIA.md`.

**Limitación de concurrencia:** los subagentes no comparten memoria; la coordinación fue explícita
por mensajes y por archivos de traspaso. No se afirma que los 8 hayan editado al mismo tiempo cada
archivo compartido: los archivos compartidos se asignaron a un solo dueño y los cambios cruzados se
pidieron por mensaje.

---

## B. Diagnóstico

Los síntomas descritos por el usuario tenían causas concretas, no una sola causa genérica:

1. **El HUB reescribía el destino de Study en tiempo de ejecución.** Los cinco `href` estáticos
   eran correctos, pero `dashboardHref()`/`flashcardsHref()` inyectaban `?sheet=<última ficha>` y
   `?deck=<último mazo>&resume=1` desde `studyhub:snapshot:v1`. Eso abría una ficha o una sesión
   en lugar de la portada; con un id obsoleto, la app mostraba «Esta ficha no está disponible» o
   «Mazo no encontrado». Era la causa real del síntoma «páginas antiguas».
2. **No existían páginas antiguas ni enlaces rotos.** El auditor recorrió 16 HTML y 168 enlaces
   locales: 0 destinos faltantes, 0 errores de capitalización, 0 referencias a nombres de
   versiones anteriores de las aplicaciones.
3. **Study Flashcards no tenía biblioteca.** Renderizaba siempre hero + 4 tarjetas de modo + 210
   tarjetas de mazo completas (4 métricas y 2 CTA cada una). El documento medía **100.893 px a
   360 px**, con 642 controles interactivos y sin búsqueda, filtros, grupos ni jerarquía.
4. **El cambio de personaje de QUEST reconstruía la vista completa.** `select-character` llamaba a
   `render()`, que reemplazaba `#view.innerHTML`, recreaba 13 retratos y escenas, reiniciaba
   animaciones, perdía el foco y desplazaba el scroll. No era una recarga de documento, pero se
   percibía como volver a cargar el juego.
5. **Pérdidas de estado reales:** el scroll de lectura del Dashboard se restauraba antes del layout
   final y se sobrescribía con ~9 %; el «último mazo» de Flashcards se guardaba como *tema* y el
   enlace de reanudación abría otro mazo sin sesión; el diario de QUEST podía pisar un estado más
   reciente; dos pestañas de Banqueo se pisaban la revisión; un JSON dañado de Banqueo se archivaba
   en silencio; Plazas guardaba la cadena `"undefined"` al restablecer preferencias.
6. **El HUB se recortaba en móvil y horizontal.** A 320×568 y 360×640 la página medía 686 px (barra
   y puntos bajo el pliegue); a 844×390 medía 669 px; `#btnFs` estaba oculto a ≤600 px. El dock
   lateral duplicaba estado y era redundante.
7. **Faltaban controles consistentes.** Banqueo y Plazas no tenían regreso al HUB; QUEST solo en el
   pie; la pantalla completa existía únicamente en el HUB. En Study, la regla
   `.s-navlink span{display:none}` ocultaba **icono y etiqueta** de Panel/Biblioteca/Progreso a
   ≤900 px: la navegación móvil era invisible aunque clicable.
8. **Accesibilidad y responsive puntuales:** botones de Plazas comprimidos a 19–31 px; topbar de
   QUEST sin tema visible; ficha/clave/exportación de Plazas sin `role="dialog"`, foco ni `Esc`;
   temas desplegados del Dashboard se cerraban al volver de otra pestaña.

---

## C. Rutas corregidas

| Punto | Antes | Ahora | Verificación |
|---|---|---|---|
| Tarjeta Study Dashboard del HUB | En ejecución: `./study-dashboard/index.html?sheet=<última ficha>` | `./study-dashboard/index.html` (portada), sin query | `AUDIT/evidencias/agent1-nav-tests-postparche.json` H5.2/H5.3; sonda `coordinator-d1.mjs` |
| Tarjeta Study Flashcards del HUB | En ejecución: `./study-flashcards/index.html?deck=<último mazo>&resume=1` | `./study-flashcards/index.html` (biblioteca), sin query | Ídem |
| Dashboard con `?sheet=<id obsoleto>` | `#/ficha/<id>` → «Esta ficha no está disponible» | `#/` + aviso «La ficha guardada ya no está disponible…», sin bucle | H2.12; Agente 6 44/44 |
| Flashcards con `?deck=<id obsoleto>` | `#/mazo/<id>` → «Mazo no encontrado» | `#/` + aviso «El mazo guardado ya no está disponible…» | H3.8; Agente 5 |
| Tarjeta Banqueo del HUB | `Examen Studio.html?v=2.1.5` | `Examen Studio.html?v=2.1.6` (caché de la revisión) | `index.html` y `EXAMEN STUDIO/Examen Studio.html` |
| Rutas individuales | `#/ficha/<id>`, `?sheet=<id>`, `#/mazo/<id>`, `?deck=<id>&resume=1`, `?deck&mode=…`, `#/sesion`, `#/resumen`, `#/historial` | **Se conservan** y limpian la query tras consumirla | H2.4/H2.11/H3.2/H3.7; Agente 5 §7.3 |
| Filtros de biblioteca | No existían | `#/?estado=…&area=…&q=…&abiertas=…` compartible y restaurable | Agente 5 §7.2/7.3 |
| QUEST | `#/personajes`, `#/mapa`, `#/mision/<id>`, `#/inventario/<id>`, `#/resultado/<id>`… | Se conservan; navegación interna por hash sin recarga | Agente 1 H4.6 |
| Banqueo | `#hub`, `#bank/…`, `#review/…`, `#practice/result/…` | Se conservan; `Inicio` → `#hub`, `HUB` → `../index.html` | Agente 6 |
| Plazas | No había deep link de ficha (panel en memoria) | No se inventó una ruta nueva; se documenta como limitación | Agente 1 H-6 |

**Resultado del auditor:** `python AUDIT/route_audit.py --legacy` → EXIT 0 · 16 HTML · 168 enlaces
locales · faltantes 0 · capitalización 0 · obsoletos 0. El arnés de navegación real pasó de
**37/39 a 39/39** tras aplicar D1.

**Decisión de diseño (D1):** el HUB abre la portada; la reanudación del último punto vive dentro de
cada app («Retomar lectura», «Continuar sesión») y en las rutas directas. El HUB sigue mostrando el
texto del último punto y el progreso real, sin inyectar query en la tarjeta.

---

## D. Persistencia y estado

La tabla completa, con las 10 pruebas de ciclo de vida por app, está en
`AUDIT/PERSISTENCIA.md`; el resumen por agente, en `AUDIT/agent-2-persistencia.md`.
Clasificación aplicada: **persistente**, **restaurable en sesión**, **temporal** o **reiniciables**.

| Aplicación | Estado | Antes (observado) | Esperado / clasificación | Corrección | Prueba |
|---|---|---|---|---|---|
| Study Dashboard | Posición de lectura | Refrescar al 60 % dejaba ~9 % y sobrescribía el 60 % guardado | Persistente | Restauración con doble rAF + `fonts.ready` + 900 ms, `scrollHeight` final, scroll instantáneo y bloqueo de guardado durante la restauración; el paginador abre desde arriba | 0.6000 guardado → 0.6000 restaurado; `agent2-dash-scroll-despues.json`; Agente 6 |
| Study Dashboard | Temas desplegados | Se cerraban al cambiar de pestaña y volver | Restaurable en sesión | `state.openTopics[topicId]` + listener `toggle` en captura | 2 temas abiertos sobreviven a `visibilitychange`; Agente 6 |
| Study Dashboard | `?sheet=` obsoleto | Página de error y ruta antigua en la URL | Reiniciable con aviso | Limpia query, `#/` + aviso, sin bucle | H2.12 |
| Study Dashboard | Filtros de biblioteca | En memoria; se conservan al ir y volver a una ficha | Restaurable en sesión | Sin cambio de formato; al refrescar se reinician (documentado) | Pruebas de biblioteca Agente 6 |
| Study Flashcards | Sesión en curso | Persistía en `study-state-v1` | Persistente | Se conserva; el `deckId` del último punto ahora es el mazo de la sesión (no el tema) | Refresco/cierre real; H3.7; Agente 2 |
| Study Flashcards | Último mazo / enlace de reanudación | Guardaba `card.topicId`; el HUB abría otro mazo sin sesión | Persistente | `rememberDeckContext()` usa el mazo de la sesión y `resume=1`; sin sesión conserva el formato antiguo | `?deck=sheet-aps-01&resume=1` → `#/sesion`; `agent2-despues-store.json` |
| Study Flashcards | Biblioteca: filtros, grupos, scroll | No existían; al volver se perdía el contexto | Restaurable en sesión | Hash `#/?estado&area&q&abiertas` + `librarySaved` + restaurar scroll | 500/400 px restaurados; Agente 5 |
| Study Flashcards | `?deck=` obsoleto | Pantalla «Mazo no encontrado» | Reiniciable con aviso | `#/` + aviso, sin bucle | H3.8 |
| SERUMS QUEST | Personaje activo y progreso | Persistían, pero cambiarlos reconstruía toda la vista | Persistente; interfaz restaurable | Cambio localizado sin `render()`; `syncChrome` reutiliza retrato | 150/150; recarga, pestaña y HUB; Agente 4 |
| SERUMS QUEST | Diario de recuperación | Un diario viejo podía consolidarse sobre uno más reciente | Persistente (gana el más reciente) | Compara `revision`/`updatedAt` y descarta diarios antiguos | rev1 no pisa rev6; rev11 sí consolida; Agente 2 |
| SERUMS QUEST | Sesión activa | Persistía; UI de sesión se reconstruía al volver | Restaurable en sesión | Se conserva; `Continuar` en la barra; sin cambios de reglas | Refresco, pestaña, HUB; Agente 2/4 |
| Banqueo / Examen Studio | Intento de práctica | El intento quedaba `prog` en IndexedDB, pero refrescar `#practice/session` mostraba «No hay una práctica en curso» | Persistente según reglas | Marcador `sessionStorage["banqueo-active-attempt-v1"]` + `sessionFromAttempt()` + recuperación en `onRoute()` | Misma pregunta, `answers=2`, `index=1`, mismo `attemptId` tras reload; Agente 6 |
| Banqueo / Examen Studio | Última respuesta al salir | El debounce de 200 ms se descartaba al vaciar la sesión | Persistente | `persistSession()` inmediato al abandonar y en `beforeunload`/`visibilitychange` | Respuestas guardadas; Agente 6 |
| Banqueo / Examen Studio | Preferencias de práctica | `banqueo-name` se leía pero nunca se escribía | Persistente | Guarda/restaura nombre, cantidad, minutos, modo y mezclar con validación | Preferencias visibles tras recarga |
| Banqueo / Examen Studio | Revisión entre pestañas / JSON dañado | Dos pestañas se pisaban; JSON corrupto se perdía en silencio | Persistente | Mezcla por id + evento `storage`; archivo `banqueo-review-v1-corrupt-<ISO>` | 5 marcas conservadas; Agente 2 |
| Plaza SERUMS | Favoritos, adjudicadas, tema | Persistían | Persistente | Se conservan; badge de adjudicadas se pinta al arrancar | Recarga: `adjCount=1`; Agente 6 |
| Plaza SERUMS | Filtros y subvista | En memoria; se pierden al refrescar o reentrar desde el HUB | Restaurable en sesión (documentado) | Sin cambio de almacenamiento; actualización localizada y caché invalidada | Quitar favorita dentro del filtro vacía lista/contadores; Agente 6 |
| Plaza SERUMS | Claves basura | `Store.set(k, undefined)` guardaba `"undefined"` | Reiniciable | Elimina la clave; geocaché mezcla con disco | `agent2-despues-store.json` |
| HUB | Selección de tarjeta | En memoria; vuelve a la primera al refrescar | Temporal (no se persiste) | Sin cambio; cambiar de tarjeta no recarga | 0 navegaciones; Agente 3 |
| Estudio (general) | Cierre real del navegador | — | Persistente | — | `Browser.close` + mismo perfil: estado de las 5 apps conservado; Agente 2 |

**Compatibilidad:** no se renombraron claves ni se cambió el formato. Se conservan
`study-serums` (IndexedDB v1), `study-state-v1`, `studyhub:snapshot:v1`, `study-theme`,
`serumsquest:state:v1` (esquema 2), `serumsquest:backup:v1`, `serumsquest:journal:v1`,
`serumsquest:snapshot:v1`, `examenstudio` v2, `banqueo-theme-v1`, `serums_*` y `serumsdb` v1.
No se usó `localStorage.clear()` ni se borró IndexedDB en ningún perfil real.

---

## E. Recargas y rendimiento

| Dónde se recargaba o reconstruía | Qué se hizo | Resultado medido |
|---|---|---|
| HUB al cambiar de cartilla | Ya usaba estado/clases; se confirmó con CDP y se mantuvieron transiciones solo de `transform/opacity` | **0 navegaciones** de marco principal; `performance` navigation count = 1; flechas, puntos, lateral, topbar, teclado y swipe |
| HUB: dock lateral | Eliminado; sin sustituto | 0 referencias `dock` en archivo y DOM |
| Study Dashboard: navegación interna | Rutas por hash, sin recarga; restauración de scroll y temas | **0 recargas** al abrir biblioteca/ficha/panel; 1 navegación inicial por app |
| Study Flashcards: abrir mazo/sesión/filtrar/plegar/volver | Navegación por hash; cuerpo de áreas generado al abrir; contexto guardado | **0 recargas**; 1 por carga; documento inicial **100.893 → 1.560 px** a 360 px (−98,5 %); 642 → 19 controles |
| SERUMS QUEST: cambiar personaje | Parche localizado de paneles, figura, vecinos, chip y retrato; 0 `#view.innerHTML` | 1 reemplazo por cambio → **0**; retratos 13 → 3 o 0; foco conservado; 22,8 → **9,1 ms** (mediana) |
| Banqueo: preguntas/filtros | Rutas y refrescos locales; sin recarga de documento | 0 recargas internas; 1 inicial; intento recuperado |
| Plaza SERUMS: filtros/favoritos | Invalidación de caché de filtrado; refresco localizado | 0 recargas internas; lista/contadores coherentes |
| HUB → aplicación | Se conserva navegación completa | Es el único salto que recarga (esperado: abre otra app) |

**Pruebas:** `Page.frameNavigated` de marco principal + `performance.getEntriesByType("navigation")`
en el arnés CDP de Agente 3/5/6; `tests/e2e/run.mjs` de Agente 8. No se afirma que se eliminaran
todas las recargas: el salto HUB → aplicación sigue siendo una navegación completa por diseño.

---

## F. SERUMS QUEST

- **Cambio de personaje localizado.** `select-character` ya no llama a `render()`: actualiza paneles
  de identidad/detalle, atributos, rareza, indicadores del elenco (`aria-pressed`/`aria-current`),
  chip y retrato del appbar, escenario solo si cambia el área y anuncia por `#q-live`. Se conservan
  scroll, foco y animaciones ajenas.
- **Arena y selección.** `char-focus`, flechas y puntos actualizan solo escenario (si procede),
  figura central, dos vecinos y tira; la selección no reconstruye `#view`.
- **Desbloqueo, resultados y tienda.** Se parchean en sitio; si cambia la ficha, se navega por hash
  (`#/personaje/<id>`) sin recargar el documento.
- **Transiciones.** Breves, sin pantalla vacía ni bloqueo de selección repetida; respetan la
  preferencia de la app y `prefers-reduced-motion` (animación medida ~0 s).
- **Persistencia.** La selección (`collection.selectedCharacterId`), XP, monedas, misiones y sesión
  activa se conservan tras refresco, cambio de pestaña, salida al HUB y reentrada. No se cambiaron
  reglas de puntuación, recompensas ni penalizaciones. Se corrigió el orden del diario de
  recuperación (Agente 2) sin cambiar claves.
- **Sin residuos.** A→B→C→A (Ilan→Mara→Lía→Ilan + Zenón legendario): 0 residuos en paneles activos,
  nombre/título/rareza/atributos correctos, un solo `aria-current`, `aria-pressed` correcto.
- **Topbar y tema.** Tema visible y enfocable a 320/360/390 (antes se ocultaba ≤900); dos filas a
  ≤620 y cinco columnas a ≤380; iconos `sun`/`moon` añadidos (antes el botón caía a un círculo).
- **Bug incidental.** `character-art.js` dejaba texto literal `fabricAccents(a)` y omitía pliegues
  de tela; corregido sin cambiar el catálogo de personajes.
- **Pruebas.** `serums-quest/tests/selection-check.html` **150/150**; `tests.html` **61/61**;
  `ui-check.html` **44/44**; `launcher-check.html` **7/7**; `perf-check.html` **9/9**.

---

## G. Study Flashcards

- **Antes:** hero grande + 4 tarjetas de modo no interactivas + 210 `<article class="deck-card">`
  completas (resumen, 4 métricas, barra, 2 CTA) + panel de progreso duplicado. Documento de
  **100.893 px** a 360 px y **87.962 px** a 390; 642 controles.
- **Ahora:** hero compacto (261–313 px), una línea de progreso, buscador + 4 filtros
  (Todas/Pendientes/En curso/Completadas) + selector de área, cinco áreas como `<details>` con
  cuerpo perezoso y filas densas de mazo (tarjetas, dominio, pendientes, última práctica, error).
  Un CTA (`Abrir`/`Continuar`) y menú «⋯» agrupado (repaso, errores, examen, libre, ficha).
- **Contenido conservado:** 5 áreas, 20 categorías, 210 mazos, 630 tarjetas, títulos, resúmenes,
  descripciones de área con su fuente, los 4 modos con sus textos, progreso, programación,
  historial, referencias, cita e identidad menta/ámbar. No se cambiaron IDs ni contenido académico.
- **Navegación:** biblioteca ↔ mazo ↔ sesión por hash, sin recargar; «Volver a la biblioteca» y
  «Volver al mazo» son distintos de «Volver al HUB»; al regresar se restauran filtros, grupos
  abiertos y scroll (500/400 px medidos). `#/?estado&area&q&abiertas` es compartible.
- **Vista de mazo:** datos en una línea, 4 modos compactos, tarjetas protagonistas, «Biblioteca» y
  «Ficha resumen» separados. **Sesión:** «Anterior» + `←`/`→`, enlace a biblioteca, respuesta y
  feedback sin cajas anidadas. **Resumen:** «Volver al mazo» y «Biblioteca».
- **Rutas y errores:** portada sin query = biblioteca; `?deck=<válido>` = mazo; `?resume=1` =
  sesión/mazo; `?deck=<obsoleto>` = biblioteca + aviso, sin bucle; `?deck&mode=…&sheet=…&from=…`
  conserva el origen. La query se limpia solo tras consumirla (`cleanEntryQuery`).
- **Accesibilidad:** `/` busca, `Escape` limpia/cierra, `Espacio` revela, `1–4` califica,
  `Enter`/`→` avanza, `←` anterior; filtros con `aria-pressed` y contadores, contador `aria-live`,
  barras `role="progressbar"`, foco visible, claro/oscuro y reduced-motion.
- **Métricas:** 360×640 100.893 → **1.560 px**; 390×844 87.962 → **1.568 px**; 768×1024 68.790 →
  **1.353 px**; 1440×900 37.548 → **1.392 px**; sin scroll horizontal en 320/360/390/768/844/1440.
  Filtros 2×2 de 38 px a 320/360/390 sin recorte (`.lib-seg` 290/290, 330/330, 360/360).
- **Limitación conocida (no introducida aquí):** `lapses > 0` mantiene una tarjeta en «Errores»
  aunque se recupere; la UI suma esos errores no vencidos a pendientes para no ocultar mazos. No se
  cambió la programación ni `store.js` por afectar reglas de repaso.

---

## H. HUB y responsive design

- **Dock eliminado por completo:** CSS `.dock/.dock-btn`, animación de entrada, `body.launching`,
  `@supports`, `@media`, markup `#dock`, JS `dock`/`buildNav`/`setActive`/listener. 0 referencias
  en archivo y DOM. No se sustituyó por cuadrícula ni lista: se conservan carrusel, barra inferior,
  puntos, flechas, swipe y teclado. Textos de atajos y «Acerca de» actualizados.
- **Estética conservada:** paleta negro/blanco/rojo, tipografía, radios, arte CSS, composición y
  jerarquía. No se rediseñó el HUB.
- **Mediciones (11 viewports):** 320×568, 360×640, 390×844, 414×896, 768×1024, 1024×768, 1280×800,
  1440×900, 568×320, 844×390 y 1280×720: `scrollWidth == clientWidth`, `scrollHeight == innerHeight`,
  0 recortes de cartilla, 0 elementos fuera de viewport, 0 solapes.
- **Antes/diagnóstico:** 320×568 y 360×640 medían 686 px de alto; 844×390 medía 669 px; `#btnFs`
  oculto a ≤600; arte al 60 % recortaba el cuerpo en alturas cortas.
- **Ahora:** móvil con tarjeta `clamp(360px, 100dvh − 184px − safe-area, 640px)` (320→384,
  360→456), arte 52 % en alturas cortas, barra de 40 px e iconos de 38; móvil horizontal con
  cartilla apaisada (844×390→820×232; 568×320→544×162) sin scroll; safe-area con
  `viewport-fit=cover` y `env()`, probada con insets 47/34 y 47/47/21.
- **Ventanas de escritorio bajas:** regla de cierre del coordinador para **601–720 px de alto**
  (incluye 1366×768 con barras del navegador, 1024×600, 900×600, 640×600): cartilla compacta,
  cita decorativa oculta, barra y puntos visibles; medido `scrollHeight == innerHeight` y capturas
  `coordinator-1280x600.png`, `coordinator-1024x600.png`, `coordinator-640x600.png`.
- **Navegación continua:** `setActive()` no recarga; 0 `Page.frameNavigated` en 5 acciones; cada
  punto i selecciona la cartilla i; swipe horizontal cambia y vertical no; `touch-action: pan-y`,
  umbral 44 px, sin captura en gesto vertical; `aria-current`/`aria-live` y foco.
- **Pantalla completa:** visible en 320/360/390 (38×38), landscape (36×36), `aria-pressed`
  false→true→false, etiqueta «Salir de pantalla completa», `#fsLive` anuncia, `fullscreenerror`
  resetea; `[hidden]` efectivo si no está soportada.
- **Targets:** puntos 40×40 (visual intacto), flechas 38 móvil/34 escritorio, barra 40/38, abrir 40.

---

## I. Pantalla completa y navegación

- **Control compartido** `serums-chrome.js`/`serums-chrome.css` (nuevo, sin dependencias,
  idempotente) monta **Inicio**, **Volver al HUB** y **Pantalla completa** en el topbar existente de
  las cinco apps: Study Dashboard/Flashcards (`s-iconbtn`), QUEST (`q-iconbtn`), Plazas
  (`btn sm icon`, HUB+FS; `#brandHome` es el inicio al mapa), Banqueo (`icon-btn`, montado por
  Agente 6 desde `renderShell()`).
- **Pantalla completa real:** `requestFullscreen`/`exitFullscreen` nativos, sin CSS simulado.
  Probado con gestos reales de ratón (`Input.dispatchMouseEvent`) en las 5 apps: entra
  (`fullscreenElement=HTML`, `aria-pressed=true`, «Salir de pantalla completa»), sale con `Esc`
  (sin listener propio), reentra y sale con botón; `fullscreenerror` deja estado false y anuncia;
  sin `fullscreenEnabled` solo se pintan Inicio/HUB.
- **Distinción de regresos:** Inicio (`#/` o `#hub` según app) ≠ Volver al HUB (`/index.html`) ≠
  Volver al recurso anterior (biblioteca/mazo/mapa). No se usa `history.back()` como único
  mecanismo: 0 usos en producción.
- **Accesibilidad:** etiquetas y `title` únicos, `aria-pressed` solo en pantalla completa, foco
  Inicio→HUB→Pantalla completa→tema, anillo visible, contraste oscuro 9.26–20.03:1 y claro
  6.40–15.81:1, sin formularios, reduced-motion 0 s. En Study se corrigió la navegación móvil
  invisible y se mantienen 3 destinos de 40×40.
- **Limitaciones:** iOS Safari no permite pantalla completa de un elemento arbitrario (solo vídeo);
  en headless la emulación de viewport queda fija aunque `document.fullscreenElement` y
  `aria-pressed` cambian. Se documentan en `AUDIT/agent-7-controles.md`.

---

## J. Pruebas de regresión

**Herramientas:** Chrome 155 headless + CDP (Node 24), perfil temporal, servidor HTTP local.
No se usó el perfil real. Se midieron navegaciones de documento, errores de consola/excepciones,
red, almacenamiento, responsive y fullscreen.

| Prueba | Resultado | Evidencia | Limitaciones |
|---|---|---|---|
| Auditoría estática de rutas (16 HTML, 168 enlaces) | **PASS** · 0 faltantes, 0 mayúsculas, 0 obsoletos | `AUDIT/evidencias/agent1-route-audit.json` | Solo archivos; las rutas hash las cubre el arnés |
| Navegación real (39 pruebas: hub, Study, Banqueo, Plazas, QUEST, URLs directas, snapshots) | **39/39 PASS** tras D1 | `agent1-nav-tests-postparche.json` | Chrome headless; sin Safari/Firefox |
| HUB: dock, responsive 11 viewports, transiciones, fullscreen, modales | **PASS** · 0 navegaciones al cambiar cartilla, 0 overflow | `agent3-after-metrics.json`, `agent3-interactions.json` | Emulación CDP; ventanas >600×<700 se añadieron después con regla del coordinador (medidas aparte) |
| HUB: ventanas bajas 601–720 px (1280×600, 1024×600, 900×600, 768×600, 700×600, 640×600) | **PASS** · `scrollHeight == innerHeight`, barra/puntos visibles | `coordinator-lowwindows.mjs` y capturas `coordinator-*` | Chrome headless |
| Study Dashboard: navegación, 5 áreas, fichas, fuentes, scroll, temas, deep links, responsive | **44/44 PASS** | `AUDIT/agent-6-apps.md`; `agent2-dash-scroll-despues.json` | Sin dispositivos reales; `file://` no probado por el agente |
| Study Flashcards: biblioteca, mazos, sesión, filtros, scroll, teclado, a11y, responsive | **PASS** (métricas y casos en `agent-5-flashcards.md`) | `agent5-*` capturas y mediciones | Sin Safari/Firefox/lectores de pantalla reales |
| SERUMS QUEST: selección, residuos, transiciones, persistencia, topbar, suites | **150/150** selection-check; 61/61, 44/44, 7/7, 9/9 | `serums-quest/tests/selection-check.html`; `agent-4-quest.md` | Chrome headless; sincronización entre pestañas emulada por evento `storage` |
| Banqueo / Examen Studio: hub, banco, práctica, refresco, resultado, historial, fullscreen, responsive | **40/40 PASS** | `agent-6-apps.md` | No se ejercitó importación PDF/OCR (CDN/clave) |
| Plaza SERUMS / Serums Map: mapa, filtros, ficha, favoritos, adjudicadas, accesibilidad, responsive | **44/44 PASS** | `agent-6-apps.md`; `agent2-plazas-antes.json` | Google Maps dependió de la clave demo; se validó fallback sin mapa |
| Persistencia: 10 escenarios × 5 apps, cierre real de Chrome, corrupción | **PASS** en estados persistentes; sin pérdida de claves | `AUDIT/PERSISTENCIA.md`, `agent2-*` | bfcache no activado en headless; cierre forzado no probado |
| Regresión de contenido: 210 fichas, 630 tarjetas, 51 exámenes/5.100 preguntas, 7.323 plazas, 10 personajes | **PASS** · sin cambios de datos/IDs | `AUDIT/data-baseline.sha256`; QA final | Ninguna |
| Controles compartidos y fullscreen en 5 apps | **PASS** · 5/5 fullscreen real, contraste, foco, 40/44 px | `AUDIT/agent-7-controles.md`; `agent7-*` | iOS Safari limitado por plataforma |
| Matriz E2E completa (QA final) | **85 pruebas · 83 PASS · 0 FAIL · 2 SKIP** | `AUDIT/QA.md`; `AUDIT/evidencias/agent8-final/run.json` | Chrome headless; Google Maps sin red/clave. SKIP: HUB-11 (la selección de tarjeta del HUB no se persiste; el requisito no la exige) y QUEST-10 (el perfil de prueba no tenía un héroe alternativo poseído). Los 4 fallos intermedios de la corrida previa fueron supuestos desactualizados del arnés (ruta área→categoría del Dashboard, selector de sesión de Flashcards, clic fuera de viewport en QUEST y favorito ya marcado en Plazas), corregidos y reejecutados; no eran defectos de producto |

---

## K. Archivos modificados

**Producción (cambios de esta intervención):**

| Archivo | Cambios |
|---|---|
| `index.html` | Dock eliminado, responsive 11 viewports + safe-area + horizontal + ventanas bajas (601–720 px), transiciones, fullscreen móvil y sincronización, D1 en `dashboardHref`/`flashcardsHref` y tokens de Banqueo; textos de atajos/Acerca actualizados |
| `serums-chrome.js` (nuevo) | API de Inicio/HUB/pantalla completa, idempotente, sin dependencias |
| `serums-chrome.css` (nuevo) | Estilos/área táctil/foco/reduced-motion de los controles |
| `study-shared/base.css` | Navegación móvil visible (solo se oculta la etiqueta), marca sin copia ≤620, nav 40×40 |
| `study-shared/store.js` | Scroll 0 no borra posición, `last.flashcards` = mazo de la sesión, `pageshow` sincroniza |
| `study-dashboard/index.html` | Controles comunes, tokens `?v=` nuevos |
| `study-dashboard/app.js` | Scroll estable, `?sheet=` tolerante, temas abiertos, fuentes al PDF, `restoreScroll`, `suppressScrollRestore` |
| `study-dashboard/styles.css` | Fuentes del lector como enlaces y foco |
| `study-flashcards/index.html` | Controles comunes, tokens `?v=` nuevos |
| `study-flashcards/app.js` | Biblioteca jerárquica, filtros/URL, sesión, navegación, `?deck=` tolerante, teclado, query limpia |
| `study-flashcards/styles.css` | Nuevo sistema de biblioteca/filas/modos/sesión/resumen; eliminación de contenedores |
| `serums-quest/index.html` | Controles comunes y tokens `?v=1.2.1` |
| `serums-quest/js/app.js` | Cambio de personaje/foco/arena/resultado/tienda localizado; caché de retrato; sin `#view` reconstruido |
| `serums-quest/js/icons.js` | Iconos `sun`/`moon` |
| `serums-quest/js/character-art.js` | Corrección del texto literal `fabricAccents` y pliegues |
| `serums-quest/js/store.js` | Diario de recuperación solo si es más reciente |
| `serums-quest/styles-game.css` | Transición localizada, topbar responsive, tema |
| `serums-quest/tests/selection-check.html` (nuevo) | Arnés de 150 comprobaciones de cambio de personaje |
| `EXAMEN STUDIO/Examen Studio.html` | Controles comunes y tokens `?v=2.1.6` |
| `EXAMEN STUDIO/js/app.js` | Montaje de chrome, recuperación del intento, guardado inmediato, preferencias, responsive 320 |
| `EXAMEN STUDIO/js/store.js` | Revisión entre pestañas, archivo de JSON dañado |
| `EXAMEN STUDIO/styles.css` | `.top-chrome` y ajuste 320 |
| `serums map/serums-map-explorer/index.html` | Controles comunes y tokens `?v=2.0.1` |
| `serums map/serums-map-explorer/js/app.js` | Caché invalidada, badge de adjudicación, diálogos con foco/`Esc`, drawer móvil |
| `serums map/serums-map-explorer/js/services.js` | `undefined` elimina clave; geocaché mezcla |
| `serums map/serums-map-explorer/styles.css` | Topbar móvil 36 px sin compresión, marca oculta ≤380 |
| `AUTORIA.md`, `DESIGN-SYSTEM.md` | Actualizados a la revisión 2026-10-25 |
| `INTEGRITY.sha256` | Regenerado al cierre |

**Pruebas y auditoría (nuevos, no producto):** `tests/e2e/**` (cliente CDP, suites de contenido,
hub, Study, QUEST, Plazas, Banqueo, responsive y persistencia), `tools/route_nav_audit.mjs`,
`AUDIT/**` (informes por agente, evidencias JSON/PNG, matrices y este informe).

**No modificados:** `study-data/temario.js`, `study-data/fuentes/`, `EXAMEN STUDIO/datos/banco-oficial.js`,
`EXAMEN STUDIO/datos/auditoria-oficial.json`, `EXAMEN STUDIO/documentos/`, `serums map/*.json`,
`serums-quest/data/quest-map.js`, `serums-quest/js/characters.js` ni ningún PDF. Los hashes de
`AUDIT/data-baseline.sha256` se verificaron al cierre.

**Nota de estado del repositorio:** al iniciar la sesión el árbol ya contenía cambios sin commit
de SERUMS QUEST 1.2 (app.js, config, engine, util, README, docs, tests y assets nuevos). Se
conservaron y se integraron; el diff de QUEST incluye ese trabajo previo. Lo atribuible a esta
auditoría es el cambio localizado de personaje, iconos, arte, topbar, store y tokens de caché.

---

## L. Pendientes y limitaciones

1. **`lapses` en StudyStore:** un error previo mantiene la tarjeta en «Errores» aunque se recupere
   (`lastResult: good`, `lapses > 0`). No se cambió porque afecta la programación de repaso; la UI
   suma esos errores no vencidos a pendientes para no ocultarlos. Queda documentado para una
   revisión funcional específica.
2. **Filtros de Plaza SERUMS:** se conservan durante la sesión, pero un refresco/reentrada completa
   los reinicia. Se clasificaron como «restaurables en sesión», no persistentes; no se añadió un
   formato nuevo.
3. **Temas abiertos del Dashboard:** se conservan durante la sesión; un refresco total los
   reinicia (estado de interfaz). Filtros de biblioteca del Dashboard: igual.
4. **Google Maps:** en el entorno de pruebas la clave demo agotó cuota; el mapa puede no cargar.
   Se validó el fallback: listado, filtros, estadísticas y exportación siguen operando. No se probó
   geocodificación con facturación ni importación Excel/PDF.
5. **Navegadores/dispositivos:** pruebas en Chrome 155 headless; no Safari, Firefox, iOS/Android
   reales ni lectores de pantalla. iOS Safari no permite fullscreen de un elemento arbitrario.
6. **`file://`:** funciona en Chrome para cargar las apps, pero es otro origen: el progreso no se
   comparte con `http://` y la reanudación entre apps no es fiable. El producto ya requería el
   mismo origen HTTP para Study. Se mantiene documentado.
7. **bfcache:** no se activó en Chrome headless; la defensa `pageshow` está implementada, pero no
   se pudo verificar el comportamiento real de bfcache.
8. **Banqueo:** la vista de revisión por UI no pintaba filas durante la auditoría (archivo en
   edición); Agente 2 probó la misma API que usan los botones. Agente 6 probó 40/40 casos de
   Banqueo/Examen Studio, incluida práctica, resultado e historial.
9. **Plazas:** no existe deep link de ficha (`?plaza=`/hash); el panel es estado en memoria. No se
   inventó una ruta.
10. **Appbar de Study a 320 px:** pasa a dos filas (≈95 px) por la regla ≤340 px; es una decisión
    de controles, la biblioteca no desborda.
11. **Menú de fila de Flashcards:** se abre hacia arriba si no cabe y cierra con `Esc`/clic fuera,
    pero no se reposiciona si se hace scroll con el menú abierto.
12. **Cierre forzado del navegador:** Agente 2 probó cierre ordenado (`Browser.close`), no un
    kill forzado; no se afirma resistencia a pérdida de datos por corte de energía.

---

## M. Veredicto final

**Funcional con limitaciones.**

Justificación: las rutas críticas, la navegación, la persistencia, el HUB responsive, el cambio de
personaje de QUEST, la nueva biblioteca de Flashcards, los controles compartidos y la pantalla
completa fueron **implementados y verificados con pruebas reales** (no solo inspección), con
regresión de contenido y sin pérdida de datos en los escenarios probados. La matriz final de QA
cerró con **83 PASS · 0 FAIL · 2 SKIP** (los dos SKIP son decisiones/estado de prueba, no fallos:
HUB-11 «selección no persistida, no exigida» y QUEST-10 «sin héroe alternativo poseído en el perfil
de prueba»). El ecosistema queda integrado y utilizable en Chrome de escritorio, tablet y móvil
emulados.

No se clasifica como «Correcto y verificado» sin matices porque: (a) no se probó en Safari,
Firefox, dispositivos reales ni lectores de pantalla; (b) iOS no permite fullscreen de un elemento
arbitrario; (c) Google Maps depende de red/clave y en las pruebas agotó la cuota demo (se validó el
fallback); (d) `bfcache`, cierre forzado, importación PDF/Excel y geocodificación con facturación no
se ejercitaron; y (e) quedan estados de interfaz (filtros de Plazas, temas/filtros del Dashboard) que
se reinician con un refresco total, clasificados como restaurables en sesión y documentados. No se
declara superada ninguna prueba que no se haya ejecutado. La matriz de QA sí se considera
**correcta y verificada dentro de Chrome/HTTP** (83 PASS, 0 FAIL, 2 SKIP); el veredicto global se
mantiene en «funcional con limitaciones» por la cobertura de plataformas no ejecutada.

**Resultado global:** el usuario puede desplazarse entre aplicaciones, pestañas, secciones,
personajes, mazos y fichas sin recargas innecesarias; conserva el progreso persistente; vuelve al
HUB o al inicio de cada app con controles distintos; usa pantalla completa nativa; y mantiene el
contenido, los IDs y la identidad visual existentes.

---

### Evidencias principales

- `AUDIT/agent-1-rutas.md` · `AUDIT/ROUTES.md` · `AUDIT/route_audit.py` · `AUDIT/evidencias/agent1-*`
- `AUDIT/agent-2-persistencia.md` · `AUDIT/PERSISTENCIA.md` · `AUDIT/evidencias/agent2-*`
- `AUDIT/agent-3-hub.md` · `AUDIT/evidencias/agent3-*`
- `AUDIT/agent-4-quest.md` · `serums-quest/tests/selection-check.html` · `AUDIT/evidencias/agent4-*`
- `AUDIT/agent-5-flashcards.md` · `AUDIT/evidencias/agent5-*`
- `AUDIT/agent-6-apps.md` · `AUDIT/evidencias/agent6-*`
- `AUDIT/agent-7-controles.md` · `AUDIT/evidencias/agent7-*`
- `AUDIT/QA.md` · `AUDIT/evidencias/agent8-final/run.json` · `tests/e2e/README.md`
- `AUDIT/data-baseline.sha256` · `INTEGRITY.sha256` (regenerado)
