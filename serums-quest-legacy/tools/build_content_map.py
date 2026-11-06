#!/usr/bin/env python3
# © 2026 ZARCONT - Generador del mapa de afinidad temática de SERUMS QUEST.
# Lee el banco oficial y el temario de Study sin modificarlos. El mapa contiene
# solo IDs y metadatos derivados; no copia enunciados, opciones ni claves.
import hashlib
import json
import re
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BANCO = ROOT / "EXAMEN STUDIO" / "datos" / "banco-oficial.js"
TEMARIO = ROOT / "study-data" / "temario.js"
OUT = ROOT / "serums-quest" / "data" / "quest-map.js"

AREAS = [
    "area-psi-salud-publica",
    "area-psi-cuidado-integral",
    "area-psi-etica",
    "area-psi-investigacion",
    "area-psi-gestion",
]
AREA_LABEL = {
    "area-psi-salud-publica": "Salud pública",
    "area-psi-cuidado-integral": "Cuidado integral",
    "area-psi-etica": "Ética e interculturalidad",
    "area-psi-investigacion": "Investigación",
    "area-psi-gestion": "Gestión de servicios",
}
AREA_ANCHORS = {
    "area-psi-salud-publica": [
        ("salud publica", 7), ("epidemiologia", 6), ("incidencia", 5), ("prevalencia", 5),
        ("brote", 5), ("epidemia", 5), ("pandemia", 5), ("vigilancia", 5), ("notificacion", 4),
        ("tamizaje", 4), ("cribado", 4), ("determinantes sociales", 6), ("promocion de la salud", 6),
        ("prevencion primaria", 5), ("prevencion secundaria", 5), ("prevencion terciaria", 5),
        ("prevencion cuaternaria", 5), ("historia natural", 5), ("causalidad", 5), ("demografia", 5),
        ("indicador", 3), ("mortalidad", 4), ("morbilidad", 4), ("letalidad", 4), ("letabilidad", 4),
        ("sala situacional", 5), ("asis", 4), ("bioseguridad", 4), ("desastre", 4), ("emergencia", 3),
        ("residuos solidos", 4), ("inocuidad", 4), ("agua segura", 4), ("participacion comunitaria", 5),
        ("sectorizacion", 4), ("ficha familiar", 4), ("promocion", 3), ("prevencion", 2),
        ("vacunacion", 3), ("inmunizacion", 3), ("tuberculosis", 3), ("vih", 3),
        ("analisis situacional", 5), ("sala de situacion", 4), ("intoxicacion", 3),
        ("alerta", 2), ("tsunami", 3), ("terremoto", 3), ("riesgo ambiental", 4),
        ("factor de riesgo", 4), ("ocurrencia de la enfermedad", 6), ("causado la enfermedad", 5),
        ("criterios de causalidad", 7), ("metales pesados", 6), ("sustancias quimicas", 4),
        ("control vectorial", 6), ("vigilancia de factores", 5), ("sector sanitario", 4),
    ],
    "area-psi-cuidado-integral": [
        ("evaluacion psicologica", 7), ("entrevista", 4), ("examen mental", 6), ("observacion", 3),
        ("psicoterapia", 6), ("terapia cognitivo", 6), ("rapport", 5), ("empatia", 3),
        ("depresion", 5), ("ansiedad", 4), ("psicosis", 5), ("esquizofrenia", 5), ("suicidio", 6),
        ("riesgo suicida", 7), ("tea", 3), ("tdah", 4), ("consumo de alcohol", 5), ("drogas", 4),
        ("sustancias", 4), ("duelo", 4), ("violencia", 4), ("estigma", 3), ("discapacidad", 3),
        ("consentimiento informado", 4), ("confidencialidad", 3), ("historia clinica", 2),
        ("paciente", 3), ("consulta", 3), ("acude", 4), ("refiere", 3), ("diagnostico", 4),
        ("tratamiento", 3), ("sintoma", 3), ("sintomas", 3), ("adulto mayor", 4), ("gestante", 4),
        ("embarazo", 4), ("nino", 4), ("nina", 4), ("adolescente", 4), ("lactancia", 4),
        ("anemia", 4), ("desnutricion", 4), ("obesidad", 4), ("diabetes", 4), ("hipertension", 4),
        ("cancer", 4), ("vih", 3), ("tuberculosis", 3), ("violencia sexual", 5),
        ("cuidado integral", 5), ("atencion primaria", 4), ("curso de vida", 4),
        ("bajo peso", 3), ("amenorrea", 4), ("imagen corporal", 4), ("entrevista psicologica", 5),
        ("pruebas psicologicas", 5), ("psicodiagnostico", 5), ("consejeria", 3),
    ],
    "area-psi-etica": [
        ("etica", 7), ("bioetica", 7), ("deontologia", 7), ("confidencialidad", 5),
        ("secreto profesional", 7), ("consentimiento informado", 5), ("autonomia", 4),
        ("dignidad", 5), ("trato digno", 5), ("derechos del usuario", 7), ("derechos de los usuarios", 7),
        ("deberes", 4), ("discriminacion", 5), ("estigma", 4), ("interculturalidad", 7),
        ("intercultural", 6), ("pertinencia cultural", 7), ("diversidad cultural", 6),
        ("parto vertical", 7), ("medicina tradicional", 6), ("cosmovision", 6), ("lengua materna", 5),
        ("pueblos indigenas", 5), ("comunidad indigena", 5), ("barrera cultural", 5),
        ("codigo de etica", 7), ("colegio de psicologos", 6), ("malpraxis", 6), ("iatrogenia", 4),
        ("no discriminacion", 6), ("trato igualitario", 5), ("consentimiento", 3),
        ("privacidad", 4), ("derecho a la salud", 4), ("valores", 2),
    ],
    "area-psi-investigacion": [
        ("investigacion", 6), ("investigacion cualitativa", 7), ("investigacion cuantitativa", 7),
        ("enfoque mixto", 7), ("metodologia", 4), ("hipotesis", 5), ("variable", 4),
        ("muestreo", 5), ("muestra", 3), ("encuesta", 3), ("cuestionario", 3), ("instrumento", 3),
        ("validez", 5), ("confiabilidad", 5), ("consistencia interna", 6), ("alfa de cronbach", 7),
        ("analisis de datos", 6), ("estadistica", 4), ("significancia", 3), ("correlacion", 3),
        ("sesgo", 4), ("sesgo de seleccion", 6), ("ensayo clinico", 5), ("estudio descriptivo", 6),
        ("estudio transversal", 6), ("estudio de cohorte", 6), ("caso control", 6),
        ("publicacion cientifica", 6), ("revision por pares", 6), ("consentimiento informado", 3),
        ("comite de etica", 5), ("recoleccion de datos", 5), ("trabajo de campo", 4),
        ("objetivo general", 3), ("marco teorico", 4), ("operacionalizacion", 5),
        ("investigador", 4), ("datos narrativos", 5), ("metodo cientifico", 5),
        ("principio etico", 4), ("estudio experimental", 6), ("grupo control", 5),
        ("tipo de investigacion", 7), ("diseno de investigacion", 6),
        ("eficacia de dos tratamientos", 5), ("prueba de hipotesis", 5),
    ],
    "area-psi-gestion": [
        ("gestion", 5), ("gestion de servicios", 7), ("planificacion", 4), ("planeamiento", 5),
        ("planeamiento estrategico", 7), ("foda", 7), ("pei", 6), ("poi", 6), ("presupuesto", 5),
        ("plan operativo institucional", 9), ("unidad ejecutora", 7), ("programacion del plan", 6),
        ("rof", 6), ("mop", 6), ("categoria", 3), ("categorizacion", 5),
        ("upss", 7), ("cartera de servicios", 6), ("referencia", 3), ("contrarreferencia", 6),
        ("historia clinica", 4), ("redes integradas", 6), ("telesalud", 6),
        ("recurso humano", 5), ("recursos humanos", 6), ("inventario", 4), ("stock", 4),
        ("abastecimiento", 4), ("alianza", 3), ("liderazgo", 5), ("trabajo en equipo", 4),
        ("calidad", 4), ("mejora continua", 6), ("seguridad del paciente", 5), ("auditoria", 5),
        ("clima organizacional", 7), ("cultura organizacional", 6), ("acreditacion", 5),
        ("supervision", 4), ("monitoreo", 3), ("indicador de gestion", 6),
        ("aseguramiento", 4), ("financiamiento", 4), ("sistema integral de salud", 5),
        ("dano producido en el proceso de la atencion sanitaria", 9), ("evento adverso", 6),
        ("mision institucional", 6), ("vision institucional", 6),
    ],
}

STOP = set("""de la el los las un una unos unas y o u e a en con por para del al se su sus que como mas menos entre sobre durante ante tras sin es son fue ser esta este estas estos lo le les cual cuales cuando donde quien quienes no ni si ya muy todo toda todos todas otro otra otros otras mismo misma mismos mismas cada vez forma parte tipo nivel puede pueden debe deben realizar realiza mediante siguiente siguientes caso casos persona personas paciente pacientes anos ano años mes meses dia dias salud servicio servicios atencion atenciones profesional profesionales establecimiento establecimientos usuario usuarios psicologo psicologos psicologia ministerio minsa peru nacional sistema porcentaje 70 30 2025 2026""".split())

# Correcciones editoriales puntuales para casos donde el léxico aislado confunde
# conceptos. Siguen siendo afinidad de estudio, no una etiqueta oficial del examen.
MANUAL_OVERRIDES = {
    "2026-ii-psicologia-q001": {
        "areaId": "area-psi-cuidado-integral", "topicId": "topic-psi-ci-1", "sheetId": "sheet-psi-ci-1-3",
        "reason": "Terapia cognitivo conductual en un caso clínico."
    },
    "2026-ii-psicologia-q081": {
        "areaId": "area-psi-etica", "topicId": "topic-psi-et-1", "sheetId": "sheet-psi-et-1-1",
        "reason": "Principio de autonomía y consentimiento."
    },
    "2026-ii-psicologia-q099": {
        "areaId": "area-psi-etica", "topicId": "topic-psi-et-2", "sheetId": "sheet-psi-et-2-3",
        "reason": "Interculturalidad en salud y diálogo con la medicina tradicional."
    },
    "2026-i-psicologia-q070": {
        "areaId": "area-psi-cuidado-integral", "topicId": "topic-psi-ci-1", "sheetId": "sheet-psi-ci-1-2",
        "reason": "Atención inmediata y consentimiento tras agresión sexual."
    },
    "2026-ii-psicologia-q066": {
        "areaId": "area-psi-salud-publica", "topicId": "topic-psi-sp-2", "sheetId": "sheet-psi-sp-2-2",
        "reason": "Control vectorial y determinantes ambientales."
    },
    "2025-i-psicologia-q041": {
        "areaId": "area-psi-gestion", "topicId": "topic-psi-ge-1", "sheetId": "sheet-psi-ge-1-2",
        "reason": "Visión institucional y planificación."
    },
    "2025-i-psicologia-q080": {
        "areaId": "area-psi-salud-publica", "topicId": "topic-psi-sp-2", "sheetId": "sheet-psi-sp-2-2",
        "reason": "Agua y saneamiento como determinantes ambientales."
    },
    "2026-i-psicologia-q014": {
        "areaId": "area-psi-etica", "topicId": "topic-psi-et-1", "sheetId": "sheet-psi-et-1-1",
        "reason": "Autonomía y consentimiento informado."
    },
    "2026-ii-psicologia-q096": {
        "areaId": "area-psi-gestion", "topicId": "topic-psi-ge-2", "sheetId": "sheet-psi-ge-2-1",
        "reason": "Organización administrativa y contrataciones del Estado."
    },
    "2026-ii-psicologia-q084": {
        "areaId": "area-psi-salud-publica", "topicId": "topic-psi-sp-1", "sheetId": "sheet-psi-sp-1-8",
        "reason": "Brote y definición de caso epidemiológico."
    },
}


def extract_js_json(path: Path, marker: str):
    text = path.read_text(encoding="utf-8-sig")
    start = text.index(marker)
    brace = text.index("{", start)
    depth = 0
    in_string = False
    escape = False
    end = None
    for pos in range(brace, len(text)):
        char = text[pos]
        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == '"':
                in_string = False
        else:
            if char == '"':
                in_string = True
            elif char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    end = pos + 1
                    break
    if end is None:
        raise RuntimeError("No se pudo delimitar el JSON de " + str(path))
    return json.loads(text[brace:end])


def norm(value: str) -> str:
    value = unicodedata.normalize("NFD", value or "")
    value = "".join(ch for ch in value if unicodedata.category(ch) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def tokens(value: str):
    return [t for t in norm(value).split() if len(t) >= 3 and t not in STOP]


def phrase_in(phrase: str, text: str) -> bool:
    return bool(re.search(r"(?<![a-z0-9])" + re.escape(phrase) + r"(?![a-z0-9])", text))


def term_in(term: str, vocab: set) -> bool:
    if term in vocab:
        return True
    if term + "s" in vocab:
        return True
    if term.endswith("s") and term[:-1] in vocab:
        return True
    if term.endswith("es") and term[:-2] in vocab:
        return True
    return False


def add_doc(terms: dict, phrases: list, text: str, weight: float):
    n = norm(text)
    if not n:
        return
    if " " in n:
        phrases.append((n, weight))
    for token in tokens(text):
        if terms.get(token, 0) < weight:
            terms[token] = weight


def build_docs(estudio):
    area_terms = {a: {} for a in AREAS}
    area_phrases = {a: [] for a in AREAS}
    topic_docs = {}
    sheet_docs = {}
    for area_id in AREAS:
        topics = [t for t in estudio["topics"] if t.get("areaId") == area_id]
        sheets = [s for s in estudio["sheets"] if s.get("areaId") == area_id]
        for topic in topics:
            add_doc(area_terms[area_id], area_phrases[area_id], topic.get("title", ""), 4)
            for kw in topic.get("keywords", []):
                add_doc(area_terms[area_id], area_phrases[area_id], kw, 5)
            terms, phrases = {}, []
            add_doc(terms, phrases, topic.get("title", ""), 5)
            for kw in topic.get("keywords", []):
                add_doc(terms, phrases, kw, 6)
            for sheet in [s for s in sheets if s.get("topicId") == topic["id"]]:
                add_doc(terms, phrases, sheet.get("title", ""), 4)
                add_doc(terms, phrases, sheet.get("summary", ""), 1.5)
                for concept in sheet.get("keyConcepts", []):
                    add_doc(terms, phrases, concept, 2)
                sterms, sphrases = {}, []
                add_doc(sterms, sphrases, sheet.get("title", ""), 6)
                add_doc(sterms, sphrases, sheet.get("summary", ""), 2)
                for concept in sheet.get("keyConcepts", []):
                    add_doc(sterms, sphrases, concept, 3)
                for section in sheet.get("sections", []):
                    add_doc(sterms, sphrases, section.get("title", ""), 1.5)
                    for bullet in section.get("bullets", []):
                        add_doc(sterms, sphrases, bullet, 0.7)
                sheet_docs[sheet["id"]] = {"terms": sterms, "phrases": sphrases, "topicId": topic["id"], "areaId": area_id, "title": sheet.get("title", "")}
            for sheet in sheets:
                if sheet.get("topicId") == topic["id"]:
                    add_doc(area_terms[area_id], area_phrases[area_id], sheet.get("title", ""), 2)
            topic_docs[topic["id"]] = {"terms": terms, "phrases": phrases, "areaId": area_id, "title": topic.get("title", "")}
        for sheet in sheets:
            add_doc(area_terms[area_id], area_phrases[area_id], sheet.get("title", ""), 2)
            if sheet["id"] not in sheet_docs:
                terms, phrases = {}, []
                add_doc(terms, phrases, sheet.get("title", ""), 6)
                add_doc(terms, phrases, sheet.get("summary", ""), 2)
                for concept in sheet.get("keyConcepts", []):
                    add_doc(terms, phrases, concept, 3)
                sheet_docs[sheet["id"]] = {"terms": terms, "phrases": phrases, "topicId": sheet.get("topicId", ""), "areaId": area_id, "title": sheet.get("title", "")}
        for phrase, weight in AREA_ANCHORS[area_id]:
            n = norm(phrase)
            if " " in n:
                area_phrases[area_id].append((n, weight))
            else:
                area_terms[area_id][n] = max(area_terms[area_id].get(n, 0), weight)
    # Reduce términos presentes en muchas áreas: son poco discriminativos.
    for term in set().union(*[set(t.keys()) for t in area_terms.values()]):
        df = sum(1 for area_id in AREAS if term in area_terms[area_id])
        if df >= 4:
            for area_id in AREAS:
                if term in area_terms[area_id]:
                    area_terms[area_id][term] *= 0.35
    return area_terms, area_phrases, topic_docs, sheet_docs


def score_doc(text: str, terms: dict, phrases: list, opt_text: str = ""):
    vocab = set(tokens(text))
    ovocab = set(tokens(opt_text))
    score = 0.0
    for term, weight in terms.items():
        if term_in(term, vocab):
            score += weight
        elif term_in(term, ovocab):
            score += weight * 0.3
    for phrase, weight in phrases:
        if phrase_in(phrase, text):
            score += weight
        elif phrase_in(phrase, opt_text):
            score += weight * 0.2
    return score


def complexity_of(stem: str, options: list, clinical: bool):
    stem_len = len(stem)
    avg_opt = sum(len(o) for o in options) / max(1, len(options))
    score = 0.0
    score += min(35, stem_len / 9.0)
    score += min(20, avg_opt / 4.0)
    if clinical:
        score += 20
    if stem_len > 260:
        score += 10
    if re.search(r"\b(excepto|siguiente|respecto|sin embargo|de acuerdo|segun|segun el|la alternativa|incorrecta)\b", norm(stem)):
        score += 8
    return int(max(0, min(100, round(score))))


def clinical_of(stem: str):
    return bool(re.search(
        r"\b(paciente|varon|mujer|nino|nina|adolescente|gestante|embarazada|adulto mayor|lactante|recien nacido|acude|refiere|consulta|diagnostico|sintoma|sintomas|tratamiento)\b",
        norm(stem)
    ))


def classify(question, area_terms, area_phrases, topic_docs, sheet_docs):
    stem = norm(question.get("s", ""))
    opt_text = norm(" ".join(o.get("text", "") for o in question.get("o", [])))
    scores = {a: score_doc(stem, area_terms[a], area_phrases[a], opt_text) for a in AREAS}
    ordered = sorted(scores.items(), key=lambda item: (-item[1], item[0]))
    top_area, top_score = ordered[0]
    second_score = ordered[1][1] if len(ordered) > 1 else 0
    margin = top_score - second_score
    if top_score < 2.5 or margin < 0.8:
        return {
            "areaId": "", "topicId": "", "sheetId": "", "confidence": "sin clasificar",
            "affinity": round(top_score, 2), "margin": round(margin, 2),
            "areaScore": round(top_score, 2), "topicScore": 0, "sheetScore": 0,
            "clinical": clinical_of(stem), "complexity": complexity_of(stem, [o.get("text", "") for o in question.get("o", [])], clinical_of(stem)),
        }
    # Tema dentro del área.
    topics = [(tid, doc) for tid, doc in topic_docs.items() if doc["areaId"] == top_area]
    topic_scores = sorted(((score_doc(stem, doc["terms"], doc["phrases"], opt_text), tid) for tid, doc in topics), reverse=True)
    topic_score, topic_id = (topic_scores[0] if topic_scores else (0, ""))
    if topic_score <= 0.5:
        topic_id = ""
    # Ficha: primero dentro del tema elegido; si no, en toda el área.
    candidates = [sid for sid, doc in sheet_docs.items() if doc["areaId"] == top_area and (not topic_id or doc["topicId"] == topic_id)]
    if not candidates:
        candidates = [sid for sid, doc in sheet_docs.items() if doc["areaId"] == top_area]
    sheet_scores = sorted(((score_doc(stem, sheet_docs[sid]["terms"], sheet_docs[sid]["phrases"], opt_text), sid) for sid in candidates), reverse=True)
    sheet_score, sheet_id = (sheet_scores[0] if sheet_scores else (0, ""))
    if sheet_score <= 0.4:
        sheet_id = ""
    if top_score >= 12 and margin >= 4 and topic_score >= 4:
        confidence = "alta"
    elif top_score >= 6 and margin >= 2:
        confidence = "media"
    else:
        confidence = "baja"
    clinical = clinical_of(stem)
    return {
        "areaId": top_area,
        "topicId": topic_id,
        "sheetId": sheet_id,
        "confidence": confidence,
        "affinity": round(top_score, 2),
        "margin": round(margin, 2),
        "areaScore": round(top_score, 2),
        "topicScore": round(topic_score, 2),
        "sheetScore": round(sheet_score, 2),
        "clinical": clinical,
        "complexity": complexity_of(stem, [o.get("text", "") for o in question.get("o", [])], clinical),
    }


def main():
    banco = extract_js_json(BANCO, "window.BANCO_OFICIAL")
    estudio = extract_js_json(TEMARIO, "window.STUDY_CONTENT")
    area_terms, area_phrases, topic_docs, sheet_docs = build_docs(estudio)
    questions = {}
    exams = []
    invalid = []
    for exam in banco.get("exams", []):
        if exam.get("professionId") != "psicologia":
            continue
        exams.append({"id": exam["id"], "title": exam["title"], "questionCount": exam.get("questions") or 0})
        for question in banco.get("questions", {}).get(exam["id"], []):
            options = question.get("o", [])
            if question.get("st") != "valid" or not question.get("c"):
                invalid.append({"id": question.get("id"), "reason": "sin clave validada"})
                continue
            if not any(o.get("id") == question.get("c") for o in options):
                invalid.append({"id": question.get("id"), "reason": "clave fuera de las alternativas"})
                continue
            if not (question.get("s") or "").strip():
                invalid.append({"id": question.get("id"), "reason": "sin enunciado"})
                continue
            entry = classify(question, area_terms, area_phrases, topic_docs, sheet_docs)
            override = MANUAL_OVERRIDES.get(question["id"])
            if override:
                entry.update({
                    "areaId": override["areaId"],
                    "topicId": override["topicId"],
                    "sheetId": override["sheetId"],
                    "confidence": "alta",
                    "affinity": max(20.0, entry.get("affinity", 0)),
                    "margin": max(10.0, entry.get("margin", 0)),
                    "manual": True,
                    "overrideReason": override["reason"],
                })
            entry.update({
                "examId": exam["id"],
                "number": question.get("n"),
                "page": question.get("p"),
            })
            questions[question["id"]] = entry
    # Solo cuentan preguntas efectivamente incluidas.
    valid_ids = set(questions)
    for exam in exams:
        for q in banco.get("questions", {}).get(exam["id"], []):
            if q.get("id") not in valid_ids and not any(i["id"] == q.get("id") for i in invalid):
                invalid.append({"id": q.get("id"), "reason": "excluida"})
    counts = {a: 0 for a in AREAS}
    conf = {"alta": 0, "media": 0, "baja": 0, "sin clasificar": 0}
    for entry in questions.values():
        if entry["areaId"]:
            counts[entry["areaId"]] += 1
        conf[entry["confidence"]] += 1
    meta = {
        "version": "1.0.2",
        "schema": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": {
            "banco": "EXAMEN STUDIO/datos/banco-oficial.js",
            "bancoVersion": banco.get("version"),
            "bancoSchema": banco.get("schema"),
            "bancoHash": hashlib.sha256(BANCO.read_bytes()).hexdigest(),
            "temario": "study-data/temario.js",
            "temarioVersion": estudio.get("version"),
            "temarioHash": hashlib.sha256(TEMARIO.read_bytes()).hexdigest(),
        },
        "method": "Afinidad léxico-temática determinista con anclas editoriales. No es una clasificación oficial del examen.",
        "totalPsychologyExams": len(exams),
        "totalQuestions": sum(int(b.get("questionCount") or 0) for b in exams),
        "mappedQuestions": len(questions),
        "invalidQuestions": len(invalid),
        "invalid": invalid,
        "areaCounts": counts,
        "confidence": conf,
        "manualOverrides": len(MANUAL_OVERRIDES),
        "unclassified": conf["sin clasificar"],
        "areas": [{"id": a, "label": AREA_LABEL[a], "questions": counts[a]} for a in AREAS],
    }
    payload = {"meta": meta, "questions": questions}
    text = (
        "/* SERUMS QUEST - mapa de afinidad temática generado por tools/build_content_map.py\n"
        "   Solo IDs y metadatos derivados. No contiene enunciados, alternativas ni claves.\n"
        "   La clasificación es una afinidad editorial, no una etiqueta oficial del examen. */\n"
        "window.QUEST_CONTENT_MAP = " + json.dumps(payload, ensure_ascii=False, indent=2) + ";\n"
    )
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(text, encoding="utf-8", newline="\n")
    print("Mapa escrito:", OUT)
    print("Preguntas mapeadas:", len(questions), "| inválidas:", len(invalid))
    print("Áreas:", {AREA_LABEL[a]: counts[a] for a in AREAS})
    print("Confianza:", conf)
    print("Hash banco:", meta["source"]["bancoHash"][:16])


if __name__ == "__main__":
    main()
