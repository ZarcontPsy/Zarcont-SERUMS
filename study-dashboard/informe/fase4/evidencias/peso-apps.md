# Peso de apps y coste de H4 (Fase 4)

Generado por `tools/qa/peso-apps.mjs` el 2026-11-10T15:04:24.795Z.

## Método

1. Medición real de cada portada con Chrome headless, servidor local, caché desactivada y `transferSize` de `performance.getEntriesByType("resource")` mismo origen.
2. Línea base: se bloquean por CDP todos los assets de contenido (`*study-data/temario.js*`, `*study-data/temario-core.js*`, `*study-data/content-loader.js*`, `*study-data/sections/*`) y se mide el resto de la app.
3. A esa base se le suma la descarga real de `temario.js` (2527.3 KB) para reconstruir el arranque de Fase 3, que cargaba el temario completo en una sola petición.
4. La primera área se mide abriendo una ficha directa: debe pedir solo `study-data/sections/<área>.js`; una segunda ficha de la misma área no repite la petición.

## Resultado

| App | Antes (Fase 3, reconstruido) | Después (Fase 4) | Delta | Peticiones antes → después |
|---|---:|---:|---:|---:|
| Study Dashboard | **3959.6 KB** | **2263.3 KB** | -1696.3 KB (-42.8%) | 48 → 49 |
| Study Flashcards | **2832.3 KB** | **1128.3 KB** | -1703.9 KB (-60.2%) | 11 → 11 |
| HUB | 11 KB | 11 KB | 0 KB | 1 → 1 |

## Coste de H4

- Core + loader al arrancar: **830.9 KB** (843084 B + 7797 B), con 210 fichas y 630 tarjetas de metadatos.
- Primera área: **524.3 KB** en **963 ms** desde el arranque de la navegación (lector listo); 2 secciones de `area-psi-cuidado-integral`; 1 petición(es).
- Segunda ficha de la misma área: 1 petición(es) de chunk (no repite).
- `temario.js` completo que ya no se descarga al arrancar: **2527.3 KB**.

## Verificación

| Comprobación | Resultado |
|---|---|
| `dashboardCoreLoaded` | OK |
| `dashboardLoaderLoaded` | OK |
| `dashboardNoFullTemario` | OK |
| `dashboardNoChunks` | OK |
| `flashcardsCoreLoaded` | OK |
| `flashcardsNoLoader` | OK |
| `flashcardsNoFullTemario` | OK |
| `flashcardsNoChunks` | OK |
| `hubNoStudyData` | OK |
| `hubBlockedSameRequests` | OK |
| `firstAreaOneChunk` | OK |
| `firstAreaNoFullTemario` | OK |
| `sameAreaNoRepeat` | OK |

- Resultado global: **OK** — Carga inicial sin el temario completo; core y primera área medidos.

## Peticiones del arranque (Dashboard)

| Recurso | Transferencia | Decodificado | ms |
|---|---:|---:|---:|
| `/study-shared/base.css?v=2.3.0` | 21.8 KB | 21.5 KB | 7 |
| `/study-dashboard/styles.css?v=2.3.0` | 52.8 KB | 52.5 KB | 11 |
| `/study-dashboard/css/data.css?v=2.3.0` | 19.8 KB | 19.5 KB | 11 |
| `/study-dashboard/css/active.css?v=2.3.0` | 74.4 KB | 74.1 KB | 18 |
| `/study-dashboard/css/nav.css?v=2.3.0` | 37.7 KB | 37.4 KB | 17 |
| `/study-dashboard/css/plan.css?v=2.3.0` | 12.2 KB | 11.9 KB | 24 |
| `/study-dashboard/css/plan-ruta.css?v=2.3.0` | 18.1 KB | 17.8 KB | 24 |
| `/study-dashboard/css/plan-editor.css?v=2.3.0` | 26 KB | 25.7 KB | 24 |
| `/study-dashboard/css/plan-mastery.css?v=2.3.0` | 20.1 KB | 19.8 KB | 25 |
| `/study-dashboard/css/plan-review.css?v=2.3.0` | 18.7 KB | 18.4 KB | 25 |
| `/study-dashboard/css/glossary.css?v=2.3.0` | 13 KB | 12.7 KB | 25 |
| `/study-dashboard/css/facts.css?v=2.3.0` | 18.4 KB | 18.1 KB | 38 |
| `/study-dashboard/css/traps.css?v=2.3.0` | 17.8 KB | 17.5 KB | 38 |
| `/study-dashboard/css/plan-relampago.css?v=2.3.0` | 10 KB | 9.7 KB | 39 |
| `/study-dashboard/css/plan-lastday.css?v=2.3.0` | 12.2 KB | 12 KB | 39 |
| `/serums-chrome.css?v=1.0.0` | 3.4 KB | 3.1 KB | 39 |
| `/serums-mobile.css?v=1.0.0` | 11 KB | 10.7 KB | 39 |
| `/study-data/temario-core.js?v=2.5.0` | 823.3 KB | 823 KB | 72 |
| `/study-shared/taxonomy.js?v=2.3.0` | 17.2 KB | 17 KB | 48 |
| `/study-shared/icons.js?v=2.3.0` | 5.6 KB | 5.3 KB | 47 |
| `/study-shared/ui.js?v=2.3.0` | 7.1 KB | 6.8 KB | 47 |
| `/study-shared/store.js?v=2.3.0` | 97.9 KB | 97.6 KB | 49 |
| `/study-data/content-loader.js?v=2.5.0` | 7.6 KB | 7.3 KB | 47 |
| `/serums-chrome.js?v=1.0.0` | 12.5 KB | 12.2 KB | 58 |
| `/study-dashboard/app.js?v=2.3.0` | 91.6 KB | 91.3 KB | 60 |
| `/study-dashboard/js/data/backup.js?v=2.3.0` | 42 KB | 41.7 KB | 58 |
| `/study-dashboard/js/data/derived-loader.js?v=2.3.0` | 4.6 KB | 4.3 KB | 59 |
| `/study-dashboard/js/active/active.icons.js?v=2.3.0` | 3.1 KB | 2.8 KB | 58 |
| `/study-dashboard/js/active/active.core.js?v=2.3.0` | 5.7 KB | 5.4 KB | 68 |
| `/study-dashboard/js/active/active.components.js?v=2.3.0` | 50.5 KB | 50.2 KB | 69 |
| `/study-dashboard/js/active/active.behavior.js?v=2.3.0` | 10.3 KB | 10 KB | 69 |
| `/study-dashboard/js/active/active.integration.js?v=2.3.0` | 146 KB | 145.7 KB | 76 |
| `/study-dashboard/js/nav/core.js?v=2.3.0` | 10.8 KB | 10.5 KB | 69 |
| `/study-dashboard/js/nav/search.js?v=2.3.0` | 60.8 KB | 60.5 KB | 81 |
| `/study-dashboard/js/nav/sections.js?v=2.3.0` | 16.9 KB | 16.7 KB | 81 |
| `/study-dashboard/js/nav/palette.js?v=2.3.0` | 26.5 KB | 26.2 KB | 83 |
| `/study-dashboard/js/nav/nav.integration.js?v=2.3.0` | 29.2 KB | 28.9 KB | 82 |
| `/study-dashboard/js/nav/reference.js?v=2.3.0` | 8.7 KB | 8.4 KB | 81 |
| `/study-dashboard/js/nav/glossary.integration.js?v=2.3.0` | 25.8 KB | 25.5 KB | 83 |
| `/study-dashboard/js/nav/facts.integration.js?v=2.3.0` | 38 KB | 37.7 KB | 93 |
| `/study-dashboard/js/nav/traps.integration.js?v=2.3.0` | 28.4 KB | 28.1 KB | 94 |
| `/study-dashboard/js/plan/plan.runtime.js?v=2.3.0` | 10.1 KB | 9.8 KB | 96 |
| `/study-dashboard/js/plan/plan.ruta.js?v=2.3.0` | 46.6 KB | 46.3 KB | 95 |
| `/study-dashboard/js/plan/plan.mastery.js?v=2.3.0` | 37.1 KB | 36.8 KB | 95 |
| `/study-dashboard/js/plan/plan.editor.js?v=2.3.0` | 64.2 KB | 63.9 KB | 94 |
| `/study-dashboard/js/plan/plan.review.js?v=2.3.0` | 47.3 KB | 47 KB | 106 |
| `/study-dashboard/js/plan/plan.relampago.js?v=2.3.0` | 26.1 KB | 25.8 KB | 106 |
| `/study-dashboard/js/plan/plan.lastday.js?v=2.3.0` | 23.9 KB | 23.6 KB | 106 |
| `/study-dashboard/js/plan/today.integration.js?v=2.3.0` | 50.3 KB | 50 KB | 106 |

## Archivos de contenido

| Archivo | Tamaño |
|---|---:|
| `study-data/sections/area-psi-salud-publica.js` | 335.8 KB |
| `study-data/sections/area-psi-cuidado-integral.js` | 524 KB |
| `study-data/sections/area-psi-etica.js` | 99 KB |
| `study-data/sections/area-psi-investigacion.js` | 68.6 KB |
| `study-data/sections/area-psi-gestion.js` | 159.5 KB |
| `study-data/temario-core.js` | 823 KB |
| `study-data/temario.js` | 2527 KB |
| `study-data/content-loader.js` | 7.3 KB |

---

© 2026 ZARCONT — Evidencia interna de QA.
