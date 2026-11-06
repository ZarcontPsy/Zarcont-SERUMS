# Integración de contenido

## 1. Principio

SERUMS QUEST no crea una segunda base de preguntas. Lee las fuentes originales del ecosistema y conserva sus identificadores:

- `EXAMEN STUDIO/datos/banco-oficial.js` → `window.BANCO_OFICIAL`.
- `study-data/temario.js` → `window.STUDY_CONTENT`.
- `study-shared/taxonomy.js` → taxonomía de Study (solo lectura).

Los archivos originales no se modifican. El único archivo derivado es `serums-quest/data/quest-map.js`, generado por `tools/build_content_map.py`.

## 2. Formato real del banco

Cada examen de Psicología contiene 100 preguntas. Cada pregunta conserva, entre otros:

```json
{
  "id": "2026-i-psicologia-q059",
  "n": 59,
  "p": 6,
  "s": "Enunciado...",
  "o": [{ "id": "A", "text": "..." }],
  "c": "B",
  "st": "valid",
  "cf": "alta"
}
```

El adaptador `js/content.js` valida:

- `st === "valid"`.
- Existencia de `c`.
- Que la clave esté entre las alternativas.
- Enunciado no vacío.
- Al menos dos alternativas.
- ID no duplicado.

Si una pregunta no cumple, se excluye y se cuenta en el diagnóstico de integridad. Actualmente: **300 válidas, 0 inválidas**.

## 3. Mapa de afinidad

`quest-map.js` contiene solo IDs y metadatos derivados:

```json
{
  "areaId": "area-psi-salud-publica",
  "topicId": "topic-psi-sp-1",
  "sheetId": "sheet-psi-sp-1-8",
  "confidence": "alta",
  "affinity": 16.4,
  "margin": 10.8,
  "complexity": 23,
  "clinical": false,
  "examId": "2025-i-psicologia",
  "number": 55,
  "page": 3
}
```

No contiene enunciados, opciones, claves ni explicaciones.

### Método

El generador puntúa el enunciado y las opciones con términos y frases del temario oficial de Psicología:

- Keywords de los temas oficiales.
- Títulos de temas y fichas.
- Resúmenes y conceptos clave de las fichas.
- Anclas editoriales por área (por ejemplo, “parto vertical” → Ética, “terapia cognitivo conductual” → Cuidado integral).
- Penalización de términos presentes en cuatro o cinco áreas.

La confianza se asigna por puntuación y margen:

- **Alta:** puntuación ≥ 12, margen ≥ 4 y tema ≥ 4.
- **Media:** puntuación ≥ 6 y margen ≥ 2.
- **Baja:** asignada pero con evidencia insuficiente.
- **Sin clasificar:** sin área; queda fuera de la puntuación.

Solo **alta + media** alimentan misiones y modos puntuables. Actualmente:

| Concepto | Cantidad |
| --- | ---: |
| Preguntas totales de Psicología | 300 |
| Afinidad alta | 164 |
| Afinidad media | 68 |
| Puntuables (alta + media) | 232 |
| Afinidad baja (no puntúan) | 40 |
| Sin área asignada (no puntúan) | 28 |
| Correcciones editoriales explícitas | 10 |
| Misiones | 13 |
| Jefes | 5 |

### Correcciones editoriales

`MANUAL_OVERRIDES` en el generador corrige casos evidentes que el léxico aislado confunde. Cada corrección tiene un motivo documentado en el propio código y se marca con `manual: true` en el mapa. No se inventan preguntas, claves ni fuentes.

## 4. Relación con Study Dashboard

Cada error conserva:

- `areaId`, `topicId`, `sheetId`.
- Pregunta, examen, página y URL del PDF.
- Historial de intentos y próxima revisión.

La ficha se abre con:

```
../study-dashboard/index.html?sheet=<sheetId>&from=quest
```

Study Dashboard interpreta `?sheet=` y abre la ficha. El clic registra `studyOpenedAt` en el error, pero **no** se usa para marcar dominio. El dominio de la pregunta se estima con respuestas correctas espaciadas.

## 5. Explicaciones y fuentes

El banco oficial no incluye una explicación editorial por pregunta. Por eso la app:

- Muestra la clave verificada y la alternativa correcta.
- Enlaza el PDF original en su página.
- Recomienda una ficha de Study por afinidad temática.
- Declara explícitamente que no inventa explicaciones ni referencias.

La ficha recomendada es apoyo de estudio; no se presenta como la explicación oficial de la pregunta.

## 6. Regenerar el mapa

```powershell
python serums-quest/tools/build_content_map.py
```

El generador imprime el número de preguntas, la distribución por área y la confianza. Después de regenerar:

1. Actualiza el hash/versión si cambió el contenido.
2. Ejecuta `serums-quest/tests/tests.html`.
3. Regenera `INTEGRITY.sha256` desde la raíz.

## 7. Limitaciones

- La afinidad es una heurística editorial, no una clasificación oficial del examen.
- Algunos casos ambiguos pueden quedar en un área cercana; por eso se muestra “afinidad” y se excluye la baja confianza.
- El mapa no sustituye la revisión humana del banco.
- Los datos originales pueden cambiar; el generador y la app validan IDs y versiones, pero la clasificación debe revisarse si se añaden preguntas.
