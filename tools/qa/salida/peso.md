# Peso de carga inicial y derivados bajo demanda

Generado por `tools/qa/peso.mjs` el 2026-11-10T15:04:11.012Z.

## Método

1. Medición real de la portada `#/` con Chrome headless, caché desactivada y servidor local: `transferSize` de `performance.getEntriesByType("resource")` para el mismo origen.
2. Línea base de Fase 2: se bloquean por CDP los assets que añade la Fase 3 (`js/nav/reference.js`, vistas `glossary|facts|traps`, `plan.relampago|lastday.js` y sus cinco CSS).
3. Línea base de Fase 1: además se bloquean los assets de la Fase 2 (`css/plan-ruta|editor|mastery|review.css`, `js/plan/plan.runtime|ruta|editor|mastery|review.js`).
4. Línea base de Fase 0: además se bloquean los assets de la Fase 1 (`css/active.css`, `css/nav.css`, `css/plan.css`, `js/active/*`, `js/nav/*`, `js/plan/today.integration.js`, `js/data/derived-loader.js`).
5. La búsqueda, las relacionadas, `plan-model.js` y los tres derivados de Fase 3 se comprueban con `performance`: no aparecen antes de la acción/ruta que los necesita.

## Resultado

| Medición | Transferencia | Peticiones | Derivados |
|---|---:|---:|---:|
| Fase 3 actual (portada) | **2263.3 KB** | 49 | 0 |
| Sin assets de Fase 3 (equivale a Fase 2) | **2041 KB** | 38 | — |
| Sin assets de Fase 2 ni 3 (equivale a Fase 1) | **1752.8 KB** | 29 | — |
| Sin assets de Fase 1, 2 ni 3 (equivale a Fase 0) | **1213.7 KB** | 14 | 0 |
| Delta de la Fase 3 | **222.3 KB** | 11 | — |
| Delta de la Fase 2 | **288.2 KB** | 9 | — |
| Delta de la Fase 1 | **539.1 KB** | 15 | — |

- `search.json` al enfocar la búsqueda: **1** petición(es), listo en 131 ms.
- `related.json` en la portada/biblioteca: **0** · al abrir ficha con relaciones: **1**.
- `plan-model.js`: **0** peticiones al arrancar · **1** al abrir `#/ruta` (listo en 121 ms).
- `glossary.json` / `facts.json` / `warnings.json`: **0** al arrancar · **1** en `#/glosario` · **1** en `#/datos` · **1** en `#/trampas` (acumuladas por vista: glosario → datos → trampas).
- Resultado: **OK**

## Archivos de la Fase 1, Fase 2 y Fase 3

| Archivo | Tamaño |
|---|---:|
| `study-dashboard/css/active.css` | 74.1 KB |
| `study-dashboard/css/nav.css` | 37.4 KB |
| `study-dashboard/css/plan.css` | 11.9 KB |
| `study-dashboard/js/active/active.icons.js` | 2.8 KB |
| `study-dashboard/js/active/active.core.js` | 5.4 KB |
| `study-dashboard/js/active/active.components.js` | 50.2 KB |
| `study-dashboard/js/active/active.behavior.js` | 10 KB |
| `study-dashboard/js/active/active.integration.js` | 145.7 KB |
| `study-dashboard/js/nav/core.js` | 10.5 KB |
| `study-dashboard/js/nav/search.js` | 60.5 KB |
| `study-dashboard/js/nav/sections.js` | 16.7 KB |
| `study-dashboard/js/nav/palette.js` | 26.2 KB |
| `study-dashboard/js/nav/nav.integration.js` | 28.9 KB |
| `study-dashboard/js/plan/today.integration.js` | 50 KB |
| `study-dashboard/js/data/derived-loader.js` | 4.3 KB |
| `study-dashboard/js/plan/plan.runtime.js` | 9.8 KB |
| `study-dashboard/js/plan/plan.ruta.js` | 46.3 KB |
| `study-dashboard/js/plan/plan.editor.js` | 63.9 KB |
| `study-dashboard/js/plan/plan.mastery.js` | 36.8 KB |
| `study-dashboard/js/plan/plan.review.js` | 47 KB |
| `study-dashboard/css/plan-ruta.css` | 17.8 KB |
| `study-dashboard/css/plan-editor.css` | 25.7 KB |
| `study-dashboard/css/plan-mastery.css` | 19.8 KB |
| `study-dashboard/css/plan-review.css` | 18.4 KB |
| `study-dashboard/js/nav/reference.js` | 8.4 KB |
| `study-dashboard/js/nav/glossary.integration.js` | 25.5 KB |
| `study-dashboard/js/nav/facts.integration.js` | 37.7 KB |
| `study-dashboard/js/nav/traps.integration.js` | 28.1 KB |
| `study-dashboard/js/plan/plan.relampago.js` | 25.8 KB |
| `study-dashboard/js/plan/plan.lastday.js` | 23.6 KB |
| `study-dashboard/css/glossary.css` | 12.7 KB |
| `study-dashboard/css/facts.css` | 18.1 KB |
| `study-dashboard/css/traps.css` | 17.5 KB |
| `study-dashboard/css/plan-relampago.css` | 9.7 KB |
| `study-dashboard/css/plan-lastday.css` | 12 KB |
| `study-dashboard/styles.css` | 52.5 KB |
| `study-shared/base.css` | 21.5 KB |

## Peticiones de la portada (Fase 3)

| Recurso | Transferencia | Decodificado | ms |
|---|---:|---:|---:|
| `/study-shared/base.css?v=2.3.0` | 21.8 KB | 21.5 KB | 7 |
| `/study-dashboard/styles.css?v=2.3.0` | 52.8 KB | 52.5 KB | 7 |
| `/study-dashboard/css/data.css?v=2.3.0` | 19.8 KB | 19.5 KB | 13 |
| `/study-dashboard/css/active.css?v=2.3.0` | 74.4 KB | 74.1 KB | 18 |
| `/study-dashboard/css/plan.css?v=2.3.0` | 12.2 KB | 11.9 KB | 16 |
| `/study-dashboard/css/nav.css?v=2.3.0` | 37.7 KB | 37.4 KB | 15 |
| `/study-dashboard/css/plan-ruta.css?v=2.3.0` | 18.1 KB | 17.8 KB | 16 |
| `/study-dashboard/css/plan-editor.css?v=2.3.0` | 26 KB | 25.7 KB | 25 |
| `/study-dashboard/css/plan-mastery.css?v=2.3.0` | 20.1 KB | 19.8 KB | 24 |
| `/study-dashboard/css/glossary.css?v=2.3.0` | 13 KB | 12.7 KB | 25 |
| `/study-dashboard/css/plan-review.css?v=2.3.0` | 18.7 KB | 18.4 KB | 26 |
| `/study-dashboard/css/traps.css?v=2.3.0` | 17.8 KB | 17.5 KB | 26 |
| `/study-dashboard/css/facts.css?v=2.3.0` | 18.4 KB | 18.1 KB | 26 |
| `/study-dashboard/css/plan-lastday.css?v=2.3.0` | 12.2 KB | 12 KB | 36 |
| `/study-dashboard/css/plan-relampago.css?v=2.3.0` | 10 KB | 9.7 KB | 37 |
| `/serums-chrome.css?v=1.0.0` | 3.4 KB | 3.1 KB | 37 |
| `/serums-mobile.css?v=1.0.0` | 11 KB | 10.7 KB | 38 |
| `/study-shared/taxonomy.js?v=2.3.0` | 17.2 KB | 17 KB | 36 |
| `/study-data/temario-core.js?v=2.5.0` | 823.3 KB | 823 KB | 57 |
| `/study-shared/icons.js?v=2.3.0` | 5.6 KB | 5.3 KB | 46 |
| `/study-shared/ui.js?v=2.3.0` | 7.1 KB | 6.8 KB | 47 |
| `/study-data/content-loader.js?v=2.5.0` | 7.6 KB | 7.3 KB | 47 |
| `/study-shared/store.js?v=2.3.0` | 97.9 KB | 97.6 KB | 48 |
| `/serums-chrome.js?v=1.0.0` | 12.5 KB | 12.2 KB | 46 |
| `/study-dashboard/app.js?v=2.3.0` | 91.6 KB | 91.3 KB | 56 |
| `/study-dashboard/js/data/derived-loader.js?v=2.3.0` | 4.6 KB | 4.3 KB | 54 |
| `/study-dashboard/js/active/active.icons.js?v=2.3.0` | 3.1 KB | 2.8 KB | 55 |
| `/study-dashboard/js/data/backup.js?v=2.3.0` | 42 KB | 41.7 KB | 56 |
| `/study-dashboard/js/active/active.core.js?v=2.3.0` | 5.7 KB | 5.4 KB | 55 |
| `/study-dashboard/js/active/active.components.js?v=2.3.0` | 50.5 KB | 50.2 KB | 67 |
| `/study-dashboard/js/active/active.behavior.js?v=2.3.0` | 10.3 KB | 10 KB | 68 |
| `/study-dashboard/js/nav/core.js?v=2.3.0` | 10.8 KB | 10.5 KB | 68 |
| `/study-dashboard/js/nav/search.js?v=2.3.0` | 60.8 KB | 60.5 KB | 69 |
| `/study-dashboard/js/active/active.integration.js?v=2.3.0` | 146 KB | 145.7 KB | 77 |
| `/study-dashboard/js/nav/sections.js?v=2.3.0` | 16.9 KB | 16.7 KB | 69 |
| `/study-dashboard/js/nav/palette.js?v=2.3.0` | 26.5 KB | 26.2 KB | 80 |
| `/study-dashboard/js/nav/nav.integration.js?v=2.3.0` | 29.2 KB | 28.9 KB | 82 |
| `/study-dashboard/js/nav/reference.js?v=2.3.0` | 8.7 KB | 8.4 KB | 82 |
| `/study-dashboard/js/nav/glossary.integration.js?v=2.3.0` | 25.8 KB | 25.5 KB | 81 |
| `/study-dashboard/js/nav/facts.integration.js?v=2.3.0` | 38 KB | 37.7 KB | 80 |
| `/study-dashboard/js/nav/traps.integration.js?v=2.3.0` | 28.4 KB | 28.1 KB | 88 |
| `/study-dashboard/js/plan/plan.runtime.js?v=2.3.0` | 10.1 KB | 9.8 KB | 90 |
| `/study-dashboard/js/plan/plan.ruta.js?v=2.3.0` | 46.6 KB | 46.3 KB | 92 |
| `/study-dashboard/js/plan/plan.editor.js?v=2.3.0` | 64.2 KB | 63.9 KB | 91 |
| `/study-dashboard/js/plan/plan.mastery.js?v=2.3.0` | 37.1 KB | 36.8 KB | 91 |
| `/study-dashboard/js/plan/plan.review.js?v=2.3.0` | 47.3 KB | 47 KB | 91 |
| `/study-dashboard/js/plan/plan.relampago.js?v=2.3.0` | 26.1 KB | 25.8 KB | 98 |
| `/study-dashboard/js/plan/plan.lastday.js?v=2.3.0` | 23.9 KB | 23.6 KB | 98 |
| `/study-dashboard/js/plan/today.integration.js?v=2.3.0` | 50.3 KB | 50 KB | 98 |

---

© 2026 ZARCONT — Evidencia interna de QA.
