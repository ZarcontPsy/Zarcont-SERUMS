# CONTRATOS · Fase 4 (Estudio activo) — Carga inicial y cierre editorial

**Estado:** contrato de la Fase 4 aprobada por el usuario.  
**Fecha:** 2026-11-10  
**Base:** Fase 3 (`informe/fase3/`), auditoría H4/H17/H18.

## 1. Objetivo

Cerrar H4 (carga inicial del temario) sin pérdida de datos ni regresiones, y cerrar editorialmente H17/H18 sin inventar contenido:

1. El Dashboard y Study Flashcards dejan de descargar el temario completo al arrancar.
2. Las secciones de lectura se cargan por área bajo demanda, con loading/error/reintento.
3. El progreso, las notas, los subrayados, el plan y el snapshot `studyhub:snapshot:v1` no cambian.
4. H17 corrige el conteo editorial (85 temas + 22 fichas oficiales, no 86 módulos).
5. H18 documenta las dos fuentes declaradas que no citan fichas; no se añaden citas ni contenido.

## 2. Arquitectura H4

La fuente canónica sigue siendo `study-data/temario.js` (usada por generadores, pruebas y herramientas internas). La app usa una versión dividida generada:

| Archivo | Contenido |
|---|---|
| `study-data/temario-core.js` | `window.STUDY_CONTENT` con meta, sources, areas, topics, sheets **sin `sections`** y cards. |
| `study-data/sections/<primaryAreaId>.js` | `window.STUDY_SECTIONS[primaryAreaId] = { sheetId: [sections] }`, cinco archivos por área oficial. |
| `study-data/content-loader.js` | `StudyContent.ensureSheet(sheetId)`, `StudyContent.loadArea(areaId)`, `needs(sheet)`, caché por área y error recuperable. |
| `tools/build-content-split.js` | Genera core, chunks y `study-data/content-split.json` desde el temario canónico + taxonomía. |

Reglas:

- `temario-core.js` debe conservar **todos** los metadatos de las 210 fichas, 630 tarjetas, 48 fuentes, áreas y temas. Solo se elimina `sections` de cada ficha.
- Los cinco chunks agrupan por `sheet.primaryAreaId` después de `StudyTaxonomy.apply`; cubren las 210 fichas sin duplicados y sin perder secciones.
- El generador debe ser determinista y comprobar tamaño, conteo y cobertura.
- `content-loader.js` no hace fetch al cargarse. `ensureSheet` decide el área y descarga solo su chunk.
- Ficha ya cargada: no repite request; área ya cargada: no repite request.
- Fallo de chunk: error visible, botón Reintentar; el reintento debe funcionar.
- La app debe mostrar skeleton/estado de carga al abrir una ficha no cargada y no un lector vacío.
- Las rutas que no leen secciones (Panel, Biblioteca, Progreso, Plan, Glosario, Datos, Trampas, Relámpago, Último día) no deben cargar chunks.
- Study Flashcards carga `temario-core.js` (necesita cards y metadatos), no `content-loader.js` ni chunks.
- El HUB no carga temario ni cambia; el snapshot sigue en la misma clave y formato.
- `study-data/temario.js` no se borra ni se modifica: sigue siendo la fuente para `tools/build-derived.js`, pruebas y scripts.

## 3. Integración de la app

### 3.1 Dashboard

- `index.html` carga `temario-core.js` y `content-loader.js` en lugar de `temario.js`; el resto del orden shared se conserva.
- `app.js` maneja la ruta de ficha con secciones ausentes:
  - registra la vista una sola vez;
  - pinta un estado de carga accesible;
  - llama `StudyContent.ensureSheet`;
  - si la ruta sigue siendo la misma, renderiza el lector normal;
  - si falla, muestra error con `Reintentar`;
  - cancela/ignora respuestas de una ficha anterior.
- El lector, la pausa, el índice, la barra de selección y la búsqueda no deben montarse hasta que las secciones existan.
- La navegación entre fichas ya cargadas debe ser inmediata.

### 3.2 Study Flashcards

- `index.html` carga `temario-core.js` y conserva cards/metadatos. No necesita chunks.
- La biblioteca, los mazos, las sesiones y las estadísticas deben seguir con 630 tarjetas y los mismos IDs.
- No se toca la lógica de Flashcards; solo la fuente de contenido.

### 3.3 HUB

- No se modifica la clave `studyhub:snapshot:v1`, su formato ni el snapshot escrito por el store.
- Verificar lectura del HUB después del cambio, sin pérdida ni recarga de temario.

## 4. H17 · Conteo editorial

- El temario tiene 86 temas declarados, de los cuales **1 es contenedor**; el texto visible debe decir **85 temas + 22 fichas oficiales** (o la formulación equivalente acordada en la auditoría).
- Las 210 fichas totales se mantienen; las 22 oficiales se identifican por su tema contenedor, no por un recuento inventado.
- Ajustar:
  - `StudyStore.getDashboardStats().totalTopics` para contar solo temas no contenedores.
  - El copy del hero, la descripción de biblioteca y el aside que usan “módulos/86”.
  - Cualquier prueba que fijara el 86 como texto visible.
- No cambiar los datos del temario para “cuadrar” el número.

## 5. H18 · Fuentes sin citar

- Las 48 fuentes declaradas y las 46 referenciadas por fichas se documentan.
- Las dos no referenciadas son:
  - `src-nutricion-ninos-anterior`: acto normativo de aprobación de la guía anterior; no aporta temas distintos.
  - `src-psico-temario`: temario oficial de Psicología SERUMS 2026-II; define temas y subtemas, no desarrolla contenido.
- No se añaden citas a fichas ni se inventa relación clínica. Se documenta su papel como fuentes de catálogo/estructura y se actualiza el informe/observación editorial.
- H18 queda **documentado**, no maquillado como cita.

## 6. Pruebas y aceptación

- **Datos:** generador reproducible; core + 5 chunks cubren 210 fichas/630 cards; ninguna sección perdida; `study-data/temario.js` intacto.
- **Cero pérdida:** importar un estado v2 anterior y comprobar progreso, subrayados, notas, plan, dudas, tarjetas y `studyhub:snapshot:v1`; no se modifica el esquema.
- **E2E:** DASH-01…44 y FLASH-01…09 verdes; HUB lee el snapshot; ficha directa con chunk bloqueado muestra loading y error/reintento; chunk liberado recupera el lector; no hay requests de chunks en rutas que no leen.
- **Peso:** medir Dashboard, Flashcards y HUB antes/después; el arranque no pide secciones; documentar delta.
- **Accesibilidad:** axe 0 violaciones en los estados nuevos; loading/error con `role=status`/`alert`, foco y Reintentar.
- **Rendimiento:** primera ficha pide solo el chunk de su área; no se descarga el temario completo; sin parpadeo ni lector vacío.
- No se inicia una fase posterior.

## 7. Propiedad

| Archivo | Propietario |
|---|---|
| `tools/build-content-split.js`, `study-data/temario-core.js`, `study-data/sections/*`, `study-data/content-split.json`, `study-data/content-loader.js`, tests de datos | Agente 2 |
| `study-dashboard/app.js`, `study-dashboard/index.html`, `study-flashcards/index.html`, `study-dashboard/styles.css`, docs/informe/versión | Coordinador |
| `study-dashboard/js/nav|active|plan` (solo verificación; no cambios esperados) | sus dueños / Coordinador |
| `tests/e2e/*`, `tools/qa/*` | Agente 6 |
| H17/H18 análisis y documentación editorial | Agente 8 |

---

© 2026 ZARCONT — Documento interno del proyecto.
