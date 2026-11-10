# QA — resumen (Fases 0–4)

Generado por `tools/qa/run-qa.mjs` el 2026-11-10T15:12:09.912Z.

| Bloque | Estado | Duración | Evidencia |
|---|---|---:|---|
| Contraste de tokens | PASA | 0.0 s | `tools/qa/salida/contraste.json` |
| Peso de carga y derivados bajo demanda | PASA | 14.0 s | `tools/qa/salida/peso.json` |
| Peso de apps y coste de H4 | PASA | 13.9 s | `tools/qa/salida/peso-apps.json` |
| Auditoría axe-core | PASA | 149.0 s | `tools/qa/salida/axe.json` |
| Capturas y métricas | PASA | 302.4 s | `tools/qa/salida/capturas.json` |

## Comandos

```powershell
node tools/qa/contraste.mjs
node tools/qa/peso.mjs
node tools/qa/peso-apps.mjs
node tools/qa/axe-audit.mjs
node tools/qa/capturas.mjs
node tools/qa/run-qa.mjs
```

## Evidencias

- `tools/qa/salida/contraste.json` y `contraste.md`: ratios por token y tema.
- `tools/qa/salida/peso.json` y `peso.md`: carga inicial antes/después y derivados bajo demanda.
- `tools/qa/salida/peso-apps.json` y `peso-apps.md`: Dashboard/Flashcards/HUB antes/después, core y primera área (Fase 4).
- `tools/qa/salida/axe.json` y `axe.md`: matriz axe por ruta, estado, tema y viewport.
- `tools/qa/salida/capturas.json` y `capturas.md`: capturas y métricas.
- `tools/qa/salida/capturas/*.png`: imágenes de los seis viewports en ambos temas.

---

© 2026 ZARCONT — Evidencia interna de QA.
