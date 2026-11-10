# Informe QA · Fase 4 — H4 y cierre editorial

**Fecha:** 2026-11-10 · America/Lima  
**Producto:** Study Dashboard 2.3.0  
**Contrato:** `study-dashboard/docs/CONTRATOS-FASE4.md`  
**Estado:** Fase 4 cerrada. No se inició la Fase 5.

## 1. Resultado

| Bloque | Resultado |
|---|---|
| Matriz E2E DASH-01…48 + FLASH-01…09 + HUB-01…15 + F4 | **74/74 PASS · 0 FAIL · 0 SKIP · `stable:true`** |
| `tests/data` | **36/36 PASS** |
| axe-core | **128 auditorías · 0 violaciones · 0 pendientes** |
| Contraste medido en página | **1.042 comprobaciones · 0 fallos requeridos · 142 decorativos** |
| Capturas | **290 PNG · 22 estados · 6 viewports · 0 problemas** |
| Peso Dashboard | **3.959,6 → 2.263,3 KB** (−42,8 %) |
| Peso Flashcards | **2.832,3 → 1.128,3 KB** (−60,2 %) |
| HUB | 11 KB, sin `study-data/` |
| Core + loader | 830,9 KB |
| Primera área | 524,3 KB · 963 ms en local |

La matriz final es `AUDIT/evidencias/agente6-fase4-final4/run.json`; `stable:true` y sin cambios de archivo durante la corrida.

## 2. Qué se probó

- **DASH-45:** `temario-core.js` + `content-loader.js`, sin `temario.js`; 210 fichas, 630 cards, 48 fuentes; Panel/Biblioteca/Progreso sin chunks.
- **DASH-46:** ficha directa con chunk retenido y fallido; loading `role=status` + `aria-busy`, error `role=alert`, Reintentar, lector, misma área sin repetir chunk, otra área, cancelación y 0 peticiones del temario completo.
- **DASH-47:** 85 temas + 22 fichas oficiales, sin «86 módulos»; 210 fichas y 630 tarjetas conservadas.
- **DASH-48:** importación de estado v2 y conservación de progreso/subrayados/plan/dudas/tarjetas.
- **F4-FLASH:** Flashcards carga el core con 630 cards y no pide loader/chunks.
- **F4-HUB:** `studyhub:snapshot:v1` intacto, progreso y «Continuar»; HUB no pide `study-data/`.
- Regresión DASH-01…44, FLASH-01…09 y HUB-01…15 completa.
- H17 en Panel, Biblioteca y HUB; H18 documentado sin añadir citas.

## 3. Accesibilidad y capturas

- axe: 128 auditorías, 0 violaciones; el único `reviewRequired` conocido es `aria-valid-attr-value` del botón Más con su diálogo cerrado, ya revisado a mano.
- Estados nuevos `fase4-carga` / `fase4-error` auditados en ambos temas y 1440/390; 6 viewports en capturas.
- H17 comprobado en Panel y Biblioteca en los 6 viewports (16 capturas dedicadas).
- 0 overflow horizontal y 0 controles <44 px en puntero grueso.
- Capturas de carga/error: `ficha-carga-*` y `ficha-error-*` en `tools/qa/salida/capturas/`.

## 4. Datos y cero pérdida

- Core generado: 210/210 fichas, 630 cards, 48 fuentes; 0 secciones en el núcleo.
- Cinco chunks: 210/210 fichas y 1.392/1.392 secciones; 0 duplicados, 0 ausentes, 0 extras.
- `study-data/temario.js` no cambió (`CC9A…C15A`).
- DASH-48: estado v2 importado y conservado; `cards`/`flashSession` sin cambios.
- F4-HUB: clave y formato del snapshot sin cambios.
- H18: 46/48 fuentes con `sourceRefs`; las dos estructurales quedan documentadas y no se añadieron citas.

## 5. Límites

- El core conserva 630 tarjetas (830,9 KB); dividirlas queda para otra revisión.
- La primera ficha del área II carga 524,3 KB; no se precargan áreas para conservar la ventaja.
- Revisión humana con NVDA/VoiceOver, iOS/Android físico y red real pendiente.
- H18 es una observación editorial documentada, no una cita clínica nueva.

## 6. Evidencias

```
AUDIT/evidencias/agente6-fase4-final4/
  run.json              74/74, stable:true
  run-meta.json
tools/qa/salida/
  axe.json              124 auditorías, 0 violaciones
  capturas.json         290 capturas, 0 problemas
  peso-apps.json/md     Dashboard, Flashcards y HUB antes/después
  resumen.json          5/5 bloques
  INFORME-QA-FASE4.md
```

© 2026 ZARCONT — Documento interno del proyecto.
