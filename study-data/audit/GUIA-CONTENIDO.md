# Guía para ampliar el temario de Study

Esta guía describe el formato exacto que debe tener el JSON de ampliación. El objetivo es
incorporar temas y subtemas de las fuentes PDF que todavía no están representadas en
`study-data/temario.js`. No se debe modificar ningún otro archivo.

## Reglas de contenido

1. Leer la fuente PDF real. No inventar cifras, definiciones, plazos, dosis ni normas.
2. Citar siempre páginas del archivo PDF (1-based), no el número impreso en la página.
3. Cada ficha es una síntesis de estudio, no una copia literal extensa. Debe ser fiel a la
   fuente y cubrir los conceptos esenciales del tema.
4. No duplicar fichas ya existentes en `study-data/temario.js` ni en `_add-01..04.json`.
   Cuando un documento sea una versión anterior o un anexo de otro ya cubierto, indícalo
   en `notes` y no repitas el mismo contenido.
5. Español neutro, claro y directo. Sin anglicismos innecesarios. Sin afirmar que el
   material es normativa oficial si la fuente es una guía, artículo o manual.
6. Cada ficha debe tener 3 secciones con contenido real (párrafos, viñetas o tabla).
   Al menos una sección debe ser `core` (lectura rápida).
7. Cada ficha genera exactamente 3 tarjetas: `concept`, `multiple`, `application`.
   Las de opción múltiple y aplicación deben tener 4 opciones y una sola respuesta correcta.
8. Las explicaciones deben justificar la respuesta, no repetirla solamente.
9. No usar las claves `pendiente` ni `categoriaLegacy` (son legado y no deben propagarse).
10. Validar el JSON antes de terminar. Todos los IDs deben ser únicos y todas las
    referencias de página deben existir en el PDF.

## Estructura del archivo

```json
{
  "sources": [
    {
      "id": "src-ejemplo",
      "title": "Título completo de la fuente",
      "short": "Etiqueta corta",
      "authors": "Autor o institución",
      "kind": "Norma técnica | Guía de práctica clínica | Documento técnico | Manual | Artículo",
      "provenance": "Descripción breve y verificable de la procedencia.",
      "file": "../study-data/fuentes/archivo.pdf"
    }
  ],
  "areas": [
    {
      "id": "area-ejemplo",
      "title": "Nombre del área",
      "short": "Etiqueta",
      "description": "Una o dos frases sobre el área.",
      "accent": "#A9C7A4",
      "icon": "compass",
      "sourceIds": ["src-ejemplo"]
    }
  ],
  "topics": [
    {
      "id": "topic-ejemplo-1",
      "areaId": "area-ejemplo",
      "title": "Tema",
      "summary": "Síntesis de una o dos frases.",
      "sourceIds": ["src-ejemplo"],
      "keywords": ["palabra", "palabra", "palabra"]
    }
  ],
  "sheets": [
    {
      "id": "sheet-ejemplo-01",
      "topicId": "topic-ejemplo-1",
      "areaId": "area-ejemplo",
      "title": "Título de la ficha",
      "kicker": "Área · Subtema",
      "minutes": 7,
      "level": "Base | Intermedio | Avanzado",
      "summary": "Idea central en dos o tres frases.",
      "keyConcepts": [
        "Concepto esencial uno.",
        "Concepto esencial dos.",
        "Concepto esencial tres.",
        "Concepto esencial cuatro."
      ],
      "sections": [
        {
          "title": "Título de la sección",
          "depth": "core",
          "body": [
            "Párrafo con el contenido principal.",
            "Segundo párrafo con matices o ejemplos."
          ]
        },
        {
          "title": "Otra sección",
          "depth": "core",
          "bullets": [
            "Punto clave uno.",
            "Punto clave dos.",
            "Punto clave tres."
          ]
        },
        {
          "title": "Aplicación o tabla",
          "depth": "full",
          "table": {
            "headers": ["Columna A", "Columna B"],
            "rows": [["Dato A", "Dato B"], ["Dato C", "Dato D"]]
          },
          "callout": {
            "tone": "info",
            "title": "Idea para retener",
            "text": "Mensaje breve."
          }
        }
      ],
      "sourceRefs": [
        { "sourceId": "src-ejemplo", "pages": [12, 13, 14] }
      ]
    }
  ],
  "cards": [
    {
      "id": "card-ejemplo-01-1",
      "topicId": "topic-ejemplo-1",
      "sheetId": "sheet-ejemplo-01",
      "type": "concept",
      "prompt": "¿Pregunta conceptual?",
      "answer": "Respuesta completa en dos a cuatro frases.",
      "explanation": "Por qué es así y qué conviene retener.",
      "sourceRefs": [{ "sourceId": "src-ejemplo", "pages": [12] }],
      "tags": ["tema", "concepto"]
    },
    {
      "id": "card-ejemplo-01-2",
      "topicId": "topic-ejemplo-1",
      "sheetId": "sheet-ejemplo-01",
      "type": "multiple",
      "prompt": "¿Pregunta de opción múltiple?",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctIndex": 2,
      "explanation": "La opción C es correcta porque...",
      "sourceRefs": [{ "sourceId": "src-ejemplo", "pages": [13] }],
      "tags": ["tema", "opción múltiple"]
    },
    {
      "id": "card-ejemplo-01-3",
      "topicId": "topic-ejemplo-1",
      "sheetId": "sheet-ejemplo-01",
      "type": "application",
      "prompt": "Caso breve. ¿Qué conducta corresponde?",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctIndex": 1,
      "explanation": "En este caso corresponde B porque...",
      "sourceRefs": [{ "sourceId": "src-ejemplo", "pages": [14] }],
      "tags": ["tema", "aplicación"]
    }
  ]
}
```

## Convenciones de IDs

- Fuente: `src-<slug>`.
- Área: `area-<slug>`.
- Tema: `topic-<slug>-<n>`.
- Ficha: `sheet-<slug>-<nn>`.
- Tarjeta: `card-<slug>-<nn>-<n>`.

Usa slugs cortos en minúsculas, sin tildes ni espacios. No reutilices IDs de otro lote.
Cada ficha debe pertenecer a un solo tema y cada tarjeta debe apuntar a la ficha y al tema
correctos.

## Verificación mínima antes de entregar

Ejecuta un script que compruebe:

- JSON válido y listas no vacías.
- IDs únicos dentro de cada lista y referencias existentes.
- `sourceRefs[].pages` dentro del rango de páginas del PDF.
- cada ficha con al menos 2 secciones y 3 conceptos clave.
- cada ficha con exactamente 3 tarjetas, una de cada tipo.
- cada tarjeta de opción múltiple/aplicación con 4 opciones y `correctIndex` entre 0 y 3.
- ninguna pregunta duplicada.

Entrega solo el archivo JSON indicado. No edites `temario.js`, `app.js`, `styles.css` ni
ningún otro archivo del proyecto.
