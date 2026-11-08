module.exports = {
  "checkedAt": "2026-11-06T12:46:20.863Z",
  "datasetVersion": "2.5.0",
  "checks": {
    "jsonValid": true,
    "isArray": true,
    "uniqueIds": true,
    "fourOptions": true,
    "answerPresent": true,
    "explanationPresent": true,
    "areaValid": true,
    "requiredFields": true,
    "answerDistribution": {
      "A": 223,
      "B": 198,
      "C": 210,
      "D": 209
    },
    "provenance": {
      "flashcardsClosed": 420,
      "flashcardsConcept": 210,
      "dashboard": 210
    },
    "provenanceOk": true,
    "noDuplicatesVsCampaign": true,
    "noDuplicatesInternal": true,
    "maxSimilarityVsCampaign": 0.333,
    "originalExplanationsCount": 111,
    "originalExplanationsOk": true,
    "sampleRows": 37,
    "sampleAllOk": true
  },
  "errors": [],
  "warnings": [],
  "provenanceProblems": [],
  "nearDuplicates": [],
  "internalDuplicates": [],
  "originalExplanationsProblems": [],
  "summary": {
    "total": 840,
    "bySource": {
      "flashcards": 630,
      "dashboard": 210
    },
    "byOrigin": {
      "tarjeta-multiple": 210,
      "tarjeta-application": 210,
      "tarjeta-concepto-convertida": 210,
      "ficha": 210
    },
    "byArea": {
      "area-psi-salud-publica": 172,
      "area-psi-cuidado-integral": 540,
      "area-psi-etica": 36,
      "area-psi-investigacion": 28,
      "area-psi-gestion": 64
    },
    "byAreaAndSource": {
      "area-psi-salud-publica": {
        "flashcards": 129,
        "dashboard": 43
      },
      "area-psi-cuidado-integral": {
        "flashcards": 405,
        "dashboard": 135
      },
      "area-psi-etica": {
        "flashcards": 27,
        "dashboard": 9
      },
      "area-psi-investigacion": {
        "flashcards": 21,
        "dashboard": 7
      },
      "area-psi-gestion": {
        "flashcards": 48,
        "dashboard": 16
      }
    },
    "generated": 420,
    "explanationGenerated": 210,
    "byDifficulty": {
      "media": 512,
      "alta": 248,
      "base": 80
    },
    "withSourceRefs": 840,
    "withFlashcardId": 630,
    "withSheetId": 840
  },
  "sample": [
    {
      "id": "2025-i-psicologia-q008",
      "fuente": "campaña (111 originales)",
      "clave": "Opción D: interna / externa.",
      "comprobacion": "key-sample.json (fase previa): clave y texto idénticos; reverificado contra campaign.json",
      "ok": true
    },
    {
      "id": "2025-i-psicologia-q013",
      "fuente": "campaña (111 originales)",
      "clave": "Opción D: Natural",
      "comprobacion": "key-sample.json (fase previa): clave y texto idénticos; reverificado contra campaign.json",
      "ok": true
    },
    {
      "id": "2025-i-psicologia-q025",
      "fuente": "campaña (111 originales)",
      "clave": "Opción D: promoción - prevención",
      "comprobacion": "key-sample.json (fase previa): clave y texto idénticos; reverificado contra campaign.json",
      "ok": true
    },
    {
      "id": "2025-i-psicologia-q033",
      "fuente": "campaña (111 originales)",
      "clave": "Opción A: Recuperación, rehabilitación y promoción de su salud mental",
      "comprobacion": "key-sample.json (fase previa): clave y texto idénticos; reverificado contra campaign.json",
      "ok": true
    },
    {
      "id": "2025-i-psicologia-q041",
      "fuente": "campaña (111 originales)",
      "clave": "Opción B: visión",
      "comprobacion": "key-sample.json (fase previa): clave y texto idénticos; reverificado contra campaign.json",
      "ok": true
    },
    {
      "id": "2025-i-psicologia-q054",
      "fuente": "campaña (111 originales)",
      "clave": "Opción D: el rapport",
      "comprobacion": "key-sample.json (fase previa): clave y texto idénticos; reverificado contra campaign.json",
      "ok": true
    },
    {
      "id": "2025-i-psicologia-q067",
      "fuente": "campaña (111 originales)",
      "clave": "Opción D: El acceso a los servicios de salud",
      "comprobacion": "key-sample.json (fase previa): clave y texto idénticos; reverificado contra campaign.json",
      "ok": true
    },
    {
      "id": "2025-i-psicologia-q086",
      "fuente": "campaña (111 originales)",
      "clave": "Opción C: Probidad - idoneidad - profesionalismo",
      "comprobacion": "key-sample.json (fase previa): clave y texto idénticos; reverificado contra campaign.json",
      "ok": true
    },
    {
      "id": "2025-i-psicologia-q094",
      "fuente": "campaña (111 originales)",
      "clave": "Opción D: Ficha familiar",
      "comprobacion": "key-sample.json (fase previa): clave y texto idénticos; reverificado contra campaign.json",
      "ok": true
    },
    {
      "id": "2025-i-psicologia-q097",
      "fuente": "campaña (111 originales)",
      "clave": "Opción D: Sobrecorrección",
      "comprobacion": "key-sample.json (fase previa): clave y texto idénticos; reverificado contra campaign.json",
      "ok": true
    },
    {
      "id": "v2-fc-card-agente-01-2",
      "fuente": "flashcards · multiple (card-agente-01-2)",
      "clave": "Educador sanitario.",
      "comprobacion": "options[correctIndex=0] de la tarjeta = opción A",
      "ok": true
    },
    {
      "id": "v2-fc-card-psi-sp-2-6-2",
      "fuente": "flashcards · multiple (card-psi-sp-2-6-2)",
      "clave": "Perder la continuidad del cuidado y diluir la responsabilidad",
      "comprobacion": "options[correctIndex=0] de la tarjeta = opción A",
      "ok": true
    },
    {
      "id": "v2-fc-card-psi-sp-2-10-3",
      "fuente": "flashcards · application (card-psi-sp-2-10-3)",
      "clave": "Retirar las bolsas al alcanzar las tres cuartas partes y prohibir la compactación manual.",
      "comprobacion": "options[correctIndex=1] de la tarjeta = opción B",
      "ok": true
    },
    {
      "id": "v2-fc-card-audit-06-2",
      "fuente": "flashcards · multiple (card-audit-06-2)",
      "clave": "Porque puede desencadenar un síndrome de abstinencia que requiere manejo médico.",
      "comprobacion": "options[correctIndex=3] de la tarjeta = opción D",
      "ok": true
    },
    {
      "id": "v2-fc-card-materna-04-2",
      "fuente": "flashcards · multiple (card-materna-04-2)",
      "clave": "Hemorragia obstétrica",
      "comprobacion": "options[correctIndex=3] de la tarjeta = opción D",
      "ok": true
    },
    {
      "id": "v2-fc-card-psi-ci-1-1a-2",
      "fuente": "flashcards · multiple (card-psi-ci-1-1a-2)",
      "clave": "Recuperar entrevista y observación, contrastar la evidencia y reformular la conclusión con sus límites.",
      "comprobacion": "options[correctIndex=0] de la tarjeta = opción A",
      "ok": true
    },
    {
      "id": "v2-fc-card-vih-03-2",
      "fuente": "flashcards · multiple (card-vih-03-2)",
      "clave": "TDF/3TC/DTG una tableta al día.",
      "comprobacion": "options[correctIndex=0] de la tarjeta = opción A",
      "ok": true
    },
    {
      "id": "v2-fc-card-depresion-04-3",
      "fuente": "flashcards · application (card-depresion-04-3)",
      "clave": "Valorar el riesgo de forma urgente y activar la ruta de seguridad y derivación.",
      "comprobacion": "options[correctIndex=3] de la tarjeta = opción D",
      "ok": true
    },
    {
      "id": "v2-fc-card-mci-03-3",
      "fuente": "flashcards · application (card-mci-03-3)",
      "clave": "Coordinar una casa de espera materna o un alojamiento cercano al establecimiento con capacidad resolutiva.",
      "comprobacion": "options[correctIndex=2] de la tarjeta = opción C",
      "ok": true
    },
    {
      "id": "v2-fc-card-psi-ci-1-4b-3",
      "fuente": "flashcards · application (card-psi-ci-1-4b-3)",
      "clave": "Explorar ideación, plan, medios y protección, reducir el acceso a medios y coordinar atención urgente con acompañamiento.",
      "comprobacion": "options[correctIndex=3] de la tarjeta = opción D",
      "ok": true
    },
    {
      "id": "v2-fc-card-violencia-03-3",
      "fuente": "flashcards · application (card-violencia-03-3)",
      "clave": "Buscar un momento a solas, con una excusa clínica, y preguntar en privado.",
      "comprobacion": "options[correctIndex=3] de la tarjeta = opción D",
      "ok": true
    },
    {
      "id": "v2-fc-card-psi-in-2-2-3",
      "fuente": "flashcards · application (card-psi-in-2-2-3)",
      "clave": "Se estima alrededor de 26 % menos riesgo y el intervalo no incluye el valor nulo, aunque deben valorarse relevancia y sesgos",
      "comprobacion": "options[correctIndex=3] de la tarjeta = opción D",
      "ok": true
    },
    {
      "id": "v2-fc-card-agente-01-1",
      "fuente": "flashcards · concept (card-agente-01-1)",
      "clave": "Es una persona elegida o reconocida por su comunidad que realiza acciones voluntarias de promoción y prevención en coordinación con el personal de salud y otras instituciones.",
      "comprobacion": "fragmento exacto al inicio de card.answer (293 → 175 caracteres)",
      "ok": true
    },
    {
      "id": "v2-fc-card-psi-sp-2-1-1",
      "fuente": "flashcards · concept (card-psi-sp-2-1-1)",
      "clave": "Porque actúa después de la estratificación social, sobre la exposición y sobre las consecuencias de enfermar.",
      "comprobacion": "fragmento exacto al inicio de card.answer (295 → 109 caracteres)",
      "ok": true
    },
    {
      "id": "v2-fc-card-adulto-08-1",
      "fuente": "flashcards · concept (card-adulto-08-1)",
      "clave": "El priorizado se brinda en establecimientos I-1 e I-2 según capacidad resolutiva; el completo, en I-3 e I-4 y niveles II y III.",
      "comprobacion": "fragmento exacto al inicio de card.answer (127 → 127 caracteres)",
      "ok": true
    },
    {
      "id": "v2-fc-card-higiene-manos-01-1",
      "fuente": "flashcards · concept (card-higiene-manos-01-1)",
      "clave": "Dos momentos se realizan antes del riesgo (antes del contacto con el paciente y antes de una tarea limpia o aséptica) y tres después (tras el riesgo de exposición a fluidos, tras el contacto con el paciente y tras el contacto con su entorno).",
      "comprobacion": "fragmento exacto al inicio de card.answer (339 → 242 caracteres)",
      "ok": true
    },
    {
      "id": "v2-fc-card-mci-05-1",
      "fuente": "flashcards · concept (card-mci-05-1)",
      "clave": "Porque la familia es a la vez destinataria de intervenciones y el espacio donde ocurre gran parte del cuidado cotidiano.",
      "comprobacion": "fragmento exacto al inicio de card.answer (272 → 120 caracteres)",
      "ok": true
    },
    {
      "id": "v2-fc-card-perinatal-03-1",
      "fuente": "flashcards · concept (card-perinatal-03-1)",
      "clave": "Es un pilar del tratamiento, especialmente en casos leves o moderados. La TCC y la psicoterapia interpersonal abordan pensamientos, conductas, duelo, rol materno y relaciones.",
      "comprobacion": "fragmento exacto al inicio de card.answer (175 → 175 caracteres)",
      "ok": true
    },
    {
      "id": "v2-fc-card-psi-ci-2-5-1",
      "fuente": "flashcards · concept (card-psi-ci-2-5-1)",
      "clave": "Implica reconocer su capacidad creciente de decisión y acompañarlo con información comprensible y participación informada.",
      "comprobacion": "fragmento exacto al inicio de card.answer (290 → 122 caracteres)",
      "ok": true
    },
    {
      "id": "v2-fc-card-psi-et-2-2-1",
      "fuente": "flashcards · concept (card-psi-et-2-2-1)",
      "clave": "La diversidad cultural describe la existencia de distintas expresiones, lenguas, prácticas y perspectivas culturales; es un hecho de pluralidad y no garantiza por sí mismo relaciones equitativas.",
      "comprobacion": "fragmento exacto al inicio de card.answer (496 → 195 caracteres)",
      "ok": true
    },
    {
      "id": "v2-dash-sheet-agente-01",
      "fuente": "dashboard · sheet-agente-01",
      "clave": "La capacitación inicial, la continua y la recalificación sostienen su labor.",
      "comprobacion": "keyConcept exacto de la ficha sheet-agente-01 (4 keyConcepts)",
      "ok": true
    },
    {
      "id": "v2-dash-sheet-psi-sp-2-13",
      "fuente": "dashboard · sheet-psi-sp-2-13",
      "clave": "Acceso efectivo: disponibilidad, accesibilidad, aceptabilidad, calidad y protección financiera.",
      "comprobacion": "keyConcept exacto de la ficha sheet-psi-sp-2-13 (9 keyConcepts)",
      "ok": true
    },
    {
      "id": "v2-dash-sheet-audit-04",
      "fuente": "dashboard · sheet-audit-04",
      "clave": "Zona II: consejo simple y materiales educativos.",
      "comprobacion": "keyConcept exacto de la ficha sheet-audit-04 (4 keyConcepts)",
      "ok": true
    },
    {
      "id": "v2-dash-sheet-lactancia-01",
      "fuente": "dashboard · sheet-lactancia-01",
      "clave": "El aseo y otras atenciones se postergan para no interrumpir el apego.",
      "comprobacion": "keyConcept exacto de la ficha sheet-lactancia-01 (4 keyConcepts)",
      "ok": true
    },
    {
      "id": "v2-dash-sheet-nutricion-adultos-04",
      "fuente": "dashboard · sheet-nutricion-adultos-04",
      "clave": "En delgadez se descarta enfermedad asociada y se busca recuperar el rango normal de IMC.",
      "comprobacion": "keyConcept exacto de la ficha sheet-nutricion-adultos-04 (4 keyConcepts)",
      "ok": true
    },
    {
      "id": "v2-dash-sheet-psi-ci-2-19",
      "fuente": "dashboard · sheet-psi-ci-2-19",
      "clave": "Cadena de infección: agente, reservorio, puerta de salida, transmisión, puerta de entrada y huésped susceptible.",
      "comprobacion": "keyConcept exacto de la ficha sheet-psi-ci-2-19 (8 keyConcepts)",
      "ok": true
    },
    {
      "id": "v2-dash-sheet-psi-et-1-3",
      "fuente": "dashboard · sheet-psi-et-1-3",
      "clave": "Consentimiento informado: proceso de información, comprensión y decisión libre, no un formulario firmado.",
      "comprobacion": "keyConcept exacto de la ficha sheet-psi-et-1-3 (7 keyConcepts)",
      "ok": true
    }
  ]
};
