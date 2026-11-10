# Informe QA · Fase 3 — Última hora

**Fecha:** 2026-11-10 · America/Lima  
**Producto:** Study Dashboard 2.3.0  
**Contrato:** `docs/CONTRATOS-FASE3.md`  
**Estado:** Fase 3 cerrada. No se inició la Fase 4.

## 1. Resultados

| Bloque | Resultado |
|---|---|
| E2E `DASH-01…44` + `FLASH-01…09` | **53/53 PASS · 0 FAIL · 0 SKIP · stable:true** |
| axe-core | **120 auditorías · 0 violaciones · 0 pendientes · 12 estados** |
| Contraste de tokens | **100 comprobaciones · 0 requeridas fallan** |
| Capturas y métricas | **258 PNG · 6 viewports · 18 estados · 0 problemas** |
| Peso inicial | **3.953,1 KB / 48 peticiones**; Fase 2 3.730,8 KB; **delta +222,3 KB** |
| Datos derivados | **0 al arrancar**; glosario/datos/trampas 1 petición cada uno solo en su ruta |
| Cards / Flashcards | Sin cambios en las cinco herramientas |

Evidencia E2E: `AUDIT/evidencias/phase3-release2/run-quick.json` y `run-meta.json` (corrida estable, sin cambios de archivo).

## 2. Qué se comprobó

- **DASH-39:** `glossary.json` solo en `#/glosario`; búsqueda sin acentos, área, 57 términos y enlace a ficha.
- **DASH-40:** `facts.json` solo en `#/datos`; filtro de pendientes, marcar/desmarcar, `aria-pressed`, progreso global, persistencia y `cards`/`flashSession` intactos.
- **DASH-41:** `warnings.json` solo en `#/trampas`; Aviso/Distinción, área, búsqueda, 40→80 y contador.
- **DASH-42:** tres derivados al abrir relámpago; ronda real de 10, revelar, calificar, puntuación, reinicio, sin escritura en store.
- **DASH-43:** tres derivados al abrir la hoja; tres bloques, área, fecha del plan, print, enlace a `#/plan` sin crear plan.
- **DASH-44:** Más→Última hora, Ctrl+K con 15 vistas, franja «Antes del examen», cinco rutas en 6 viewports, 0 overflow y 44 px en coarse.
- La regresión `DASH-01…38` y `FLASH-01…09` sigue verde; no se relajó ninguna aserción.

## 3. Accesibilidad y diseño

- axe: 0 violaciones y 0 pendientes en las 120 auditorías; el único incompleto conocido de la paleta/Más es el `aria-valid-attr-value` documentado y revisado a mano.
- Contraste: 100 comprobaciones, 0 requeridas fallan; los 8 avisos son decorativos y se mantienen.
- Capturas: 6 viewports, ambos temas, 18 estados; 0 desbordes y 0 controles bajo 44 px en puntero grueso.
- Foco visible, `aria-live`, `aria-busy`, estados loading/error/vacío y escape de datos verificados en las cinco vistas.

## 4. Límites y riesgos

- El glosario enlaza a la ficha, no a `#section-N`; el router actual no admite anclas de sección.
- `warnings.json` tiene 12 entradas `source:"text"`; se muestran como «Referencia» en «Todos» y no se añadió una cuarta opción de filtro fuera del contrato.
- La hoja usa selectores globales solo dentro de `@media print` para ocultar appbar/footer; documentado.
- H4 sigue abierto: no se divide el temario inicial; el aumento de carga es código/CSS de producto.
- Revisión humana pendiente: NVDA/VoiceOver e iOS/Android reales.

## 5. Evidencias

```
AUDIT/evidencias/phase3-release2/
  run-quick.json         53/53, stable:true
  run-meta.json
tools/qa/salida/
  axe.json / .md         120 auditorías, 0 violaciones
  contraste.json / .md   100 comprobaciones, 0 requeridas fallan
  peso.json / .md        3 953,1 KB vs 3 730,8 KB; +222,3 KB
  capturas.json / .md    258 capturas, 0 problemas
  capturas/*.png
  resumen.json / .md     4/4 bloques
```

© 2026 ZARCONT — Documento interno del proyecto.
