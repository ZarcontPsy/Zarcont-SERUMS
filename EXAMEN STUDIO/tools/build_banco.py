#!/usr/bin/env python3
"""
Construye el banco oficial de Banqueo a partir de los PDFs SERUMS.

- Extrae texto por coordenadas (no depende del nombre del archivo).
- Detecta la profesión, el año y la convocatoria desde el contenido.
- Asocia cada resaltado amarillo vectorial a la alternativa correspondiente.
- Conserva página, rectángulo de evidencia y texto extraído original.
- Genera una auditoría por documento y detecta duplicados sin eliminarlos.
- Copia los PDFs originales intactos a EXAMEN STUDIO/documentos/.

Uso:
    python tools/build_banco.py --source "C:\\ruta\\pdfs"

Salida:
    datos/banco-oficial.js
    datos/auditoria-oficial.json
    documentos/*.pdf
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
import unicodedata
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import fitz  # PyMuPDF


# ---------------------------------------------------------------------------
# Catálogo configurable. Para incorporar una profesión nueva basta agregarla
# aquí: la app y la importación usan este mismo catálogo.
# ---------------------------------------------------------------------------
PROFESSIONS = [
    {"id": "medicina", "name": "Medicina Humana", "short": "Medicina", "group": "Ciencias de la salud", "icon": "stethoscope", "aliases": ["MEDICINA", "MEDICINA HUMANA"]},
    {"id": "enfermeria", "name": "Enfermería", "short": "Enfermería", "group": "Ciencias de la salud", "icon": "heart", "aliases": ["ENFERMERIA"]},
    {"id": "obstetricia", "name": "Obstetricia", "short": "Obstetricia", "group": "Ciencias de la salud", "icon": "mother", "aliases": ["OBSTETRICIA"]},
    {"id": "odontologia", "name": "Odontología", "short": "Odontología", "group": "Ciencias de la salud", "icon": "tooth", "aliases": ["ODONTOLOGIA"]},
    {"id": "psicologia", "name": "Psicología", "short": "Psicología", "group": "Ciencias de la salud", "icon": "brain", "aliases": ["PSICOLOGIA"]},
    {"id": "farmacia", "name": "Farmacia y Bioquímica", "short": "Farmacia", "group": "Ciencias de la salud", "icon": "flask", "aliases": ["QUIMICO FARMACEUTICO", "FARMACIA Y BIOQUIMICA", "FARMACIA"]},
    {"id": "nutricion", "name": "Nutrición", "short": "Nutrición", "group": "Ciencias de la salud", "icon": "leaf", "aliases": ["NUTRICION"]},
    {"id": "biologia", "name": "Biología", "short": "Biología", "group": "Ciencias de la salud", "icon": "dna", "aliases": ["BIOLOGIA"]},
    {"id": "trabajo-social", "name": "Trabajo Social", "short": "Trabajo Social", "group": "Ciencias de la salud", "icon": "people", "aliases": ["TRABAJO SOCIAL"]},
    {"id": "veterinaria", "name": "Medicina Veterinaria", "short": "Veterinaria", "group": "Ciencias de la salud", "icon": "paw", "aliases": ["MEDICINA VETERINARIA", "VETERINARIA"]},
    {"id": "ingenieria-sanitaria", "name": "Ingeniería Sanitaria", "short": "Ingeniería Sanitaria", "group": "Ciencias de la salud", "icon": "water", "aliases": ["INGENIERIA SANITARIA"]},
    {"id": "tm-laboratorio", "name": "Laboratorio Clínico y Anatomía Patológica", "short": "Laboratorio clínico", "group": "Tecnología Médica", "icon": "microscope", "aliases": ["TM-LABORATORIO C.", "TM DE LABORATORIO CLINICO Y ANATOMIA PATOLOGICA", "LABORATORIO", "LABORATORIO CLINICO", "TM-LABORATORIO CLINICO"]},
    {"id": "tm-radiologia", "name": "Radiología", "short": "Radiología", "group": "Tecnología Médica", "icon": "scan", "aliases": ["TM-RADIOLOGIA", "TM EN RADIOLOGIA", "RADIOLOGIA"]},
    {"id": "tm-optometria", "name": "Optometría", "short": "Optometría", "group": "Tecnología Médica", "icon": "eye", "aliases": ["TM-OPTOMETRIA", "TM EN OPTOMETRIA", "OPTOMETRIA"]},
    {"id": "tm-terapia-fisica", "name": "Terapia Física y Rehabilitación", "short": "Terapia física", "group": "Tecnología Médica", "icon": "activity", "aliases": ["TM-TERAPIA FISICA", "TM EN TERAPIA FISICA Y REHABILITACION", "TERAPIA FISICA", "TERAPIA FISICA Y REHABILITACION"]},
    {"id": "tm-terapia-lenguaje", "name": "Terapia del Lenguaje", "short": "Terapia del lenguaje", "group": "Tecnología Médica", "icon": "speech", "aliases": ["TM-TERAPIA LENGUAJE", "TM EN TERAPIA DEL LENGUAJE", "TERAPIA DEL LENGUAJE", "TERAPIA DE LENGUAJE"]},
    {"id": "tm-terapia-ocupacional", "name": "Terapia Ocupacional", "short": "Terapia ocupacional", "group": "Tecnología Médica", "icon": "hand", "aliases": ["TM-TERAPIA OCUPACIONAL", "TM EN TERAPIA OCUPACIONAL", "TERAPIA OCUPACIONAL"]},
]

MONTHS = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5, "junio": 6,
    "julio": 7, "agosto": 8, "setiembre": 9, "septiembre": 9, "octubre": 10,
    "noviembre": 11, "diciembre": 12,
}

CYCLES = {
    "7084225": {"year": 2025, "convocatoria": "I", "label": "2025-I"},
    "8053031": {"year": 2026, "convocatoria": "I", "label": "2026-I"},
    "8489155": {"year": 2026, "convocatoria": "II", "label": "2026-II"},
}

ASCII_RE = re.compile(r"[^A-Z0-9]+")


def ascii_key(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "")
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    value = value.upper().replace("°", " ").replace("º", " ")
    return ASCII_RE.sub(" ", value).strip()


def line_text(line) -> str:
    return "".join(span.get("text", "") for span in line.get("spans", [])).strip()


def page_lines(page, page_number: int):
    """Devuelve líneas del cuerpo, sin encabezado, pie ni fecha."""
    lines = []
    for block in page.get_text("dict").get("blocks", []):
        if block.get("type") != 0:
            continue
        for raw_line in block.get("lines", []):
            text = line_text(raw_line)
            if not text:
                continue
            x0, y0, x1, y1 = raw_line.get("bbox", (0, 0, 0, 0))
            if y1 < 55 or y0 > 800:
                continue
            if re.match(r"^(P.gina\s+\d+\s+de\s+\d+|Evaluaci.n para el Servicio|SERUMS 2026)", text):
                continue
            if y0 > 700 and re.match(r"^\d{1,2}\s+de\s+[a-z]+\s+(?:de\s+)?\d{4}$", text, re.I):
                continue
            lines.append({
                "t": text,
                "x0": x0, "y0": y0, "x1": x1, "y1": y1,
                "page": page_number,
            })
    return lines


def yellow_shapes(page):
    shapes = []
    for drawing in page.get_drawings():
        fill = drawing.get("fill")
        if not fill:
            continue
        # Amarillo del resaltado SERUMS y variantes claras.
        if fill[0] > 0.78 and fill[1] > 0.72 and fill[2] < 0.55:
            rect = drawing.get("rect")
            if rect and rect[1] < 800:
                shapes.append(tuple(rect))
    return shapes


def group_rows(lines):
    lines = sorted(lines, key=lambda item: (item["y0"], item["x0"]))
    rows = []
    for line in lines:
        if rows and abs(rows[-1]["y0"] - line["y0"]) <= 2.5:
            rows[-1]["items"].append(line)
        else:
            rows.append({"y0": line["y0"], "items": [line]})
    for row in rows:
        row["items"].sort(key=lambda item: item["x0"])
    return rows


def extract_questions(pdf_path: Path):
    doc = fitz.open(pdf_path)
    questions = []
    incidental = []
    artifacts = []
    page_stats = []
    q_re = re.compile(r"^(\d{1,3})\s*[.)]\s*(\S.*)$")
    opt_re = re.compile(r"^([A-F])\s*[.)]\s*(.*)$")

    for page_index, page in enumerate(doc):
        page_number = page_index + 1
        lines = page_lines(page, page_number)
        rows = group_rows(lines)
        shapes = yellow_shapes(page)
        current = None
        page_questions = []

        for row in rows:
            new_question = None
            for item in row["items"]:
                match = q_re.match(item["t"])
                if match and item["x0"] < 100:
                    number = int(match.group(1))
                    if current is None or number == current["number"] + 1:
                        new_question = item
                        break
            if new_question:
                match = q_re.match(new_question["t"])
                current = {
                    "number": int(match.group(1)),
                    "page": page_number,
                    "statement_lines": [new_question],
                    "options": {},
                }
                page_questions.append(current)
                remaining = [item for item in row["items"] if item is not new_question]
            else:
                if current is None:
                    continue
                remaining = row["items"]

            for item in remaining:
                option_match = opt_re.match(item["t"])
                if option_match:
                    letter = option_match.group(1)
                    current["options"][letter] = {
                        "letter": letter,
                        "text_lines": [item],
                        "x0": item["x0"], "y0": item["y0"],
                        "x1": item["x1"], "y1": item["y1"],
                    }
                    continue
                column = "L" if item["x0"] < 300 else "R"
                candidates = [
                    option for option in current["options"].values()
                    if (option["x0"] < 300) == (column == "L")
                    and option["y0"] <= item["y0"] + 1
                ]
                if candidates:
                    option = max(candidates, key=lambda value: value["y0"])
                    option["text_lines"].append(item)
                    option["x1"] = max(option["x1"], item["x1"])
                    option["y1"] = max(option["y1"], item["y1"])
                elif not current["options"]:
                    current["statement_lines"].append(item)
                else:
                    # Última línea de una alternativa sin marca: conservarla
                    # en la alternativa más cercana, no en el enunciado.
                    option = max(current["options"].values(), key=lambda value: value["y0"])
                    option["text_lines"].append(item)
                    option["x1"] = max(option["x1"], item["x1"])
                    option["y1"] = max(option["y1"], item["y1"])

        matched_shapes = set()
        for question in page_questions:
            evidence = None
            correct_letters = []
            for option in question["options"].values():
                for shape_index, rect in enumerate(shapes):
                    rx0, ry0, rx1, ry1 = rect
                    vertical = max(0, min(ry1, option["y1"] + 3) - max(ry0, option["y0"] - 3))
                    horizontal = max(0, min(rx1, option["x1"]) - max(rx0, option["x0"]))
                    if vertical > max(3, (option["y1"] - option["y0"]) * 0.5) and horizontal > max(8, (option["x1"] - option["x0"]) * 0.35):
                        correct_letters.append(option["letter"])
                        evidence = rect
                        matched_shapes.add(shape_index)
                        break

            # Limpiar alternativas creadas por artefactos de maquetación.
            def option_body(option):
                parts = [line["t"] for line in option["text_lines"]]
                if parts:
                    parts[0] = re.sub(r"^[A-F]\s*[.)]\s*", "", parts[0])
                return " ".join(parts).replace("  ", " ").strip()

            empty_letters = [letter for letter, option in question["options"].items()
                             if not option_body(option)]
            for letter in empty_letters:
                del question["options"][letter]
                artifacts.append({
                    "question": question["number"],
                    "page": page_number,
                    "type": "alternativa_vacia",
                    "detail": f"Se descartó la marca {letter} sin contenido.",
                })

            ordered = []
            for letter in "ABCDEF":
                option = question["options"].get(letter)
                if not option:
                    continue
                text = option_body(option)
                raw = "\n".join(line["t"] for line in option["text_lines"]).strip()
                ordered.append({
                    "letter": letter,
                    "text": text,
                    "raw": raw,
                    "hl": letter in set(correct_letters),
                })

            statement_lines = [line["t"] for line in question["statement_lines"]]
            if statement_lines:
                statement_lines[0] = re.sub(r"^\d{1,3}\s*[.)]\s*", "", statement_lines[0])
            statement = " ".join(statement_lines).replace("  ", " ").strip()
            raw_statement = "\n".join(line["t"] for line in question["statement_lines"]).strip()
            correct = sorted(set(correct_letters))
            question["ordered_options"] = ordered
            question["statement"] = statement
            question["raw_statement"] = raw_statement
            question["correct"] = correct
            question["evidence"] = evidence

        # Resaltados que no coinciden con una alternativa: se registran como
        # observaciones, nunca como respuestas confirmadas.
        for shape_index, rect in enumerate(shapes):
            if shape_index in matched_shapes:
                continue
            rx0, ry0, rx1, ry1 = rect
            hit_lines = []
            for line in lines:
                vertical = max(0, min(ry1, line["y1"] + 3) - max(ry0, line["y0"] - 3))
                horizontal = max(0, min(rx1, line["x1"]) - max(rx0, line["x0"]))
                if vertical > 4 and horizontal > 8:
                    hit_lines.append(line)
            nearby = []
            for question in page_questions:
                question_lines = question["statement_lines"] + [
                    line for option in question["options"].values() for line in option["text_lines"]
                ]
                for line in hit_lines:
                    if any(line is candidate for candidate in question_lines):
                        nearby.append((question["number"], line["t"]))
                        break
            incidental.append({
                "page": page_number,
                "rect": [round(value, 1) for value in rect],
                "questions": sorted(set(number for number, _ in nearby)),
                "snippet": hit_lines[0]["t"][:160] if hit_lines else "",
            })

        page_stats.append({
            "page": page_number,
            "lines": len(lines),
            "questions": len(page_questions),
            "highlights": len(shapes),
            "textCharacters": sum(len(line["t"]) for line in lines),
        })

        questions.extend(page_questions)

    return doc, questions, incidental, artifacts, page_stats


def first_page_meta(doc):
    page = doc[0]
    header_left, header_right, date_text = [], [], ""
    for block in page.get_text("dict").get("blocks", []):
        if block.get("type") != 0:
            continue
        for raw_line in block.get("lines", []):
            text = line_text(raw_line)
            if not text:
                continue
            x0, y0, x1, y1 = raw_line.get("bbox", (0, 0, 0, 0))
            if y1 < 55:
                if x0 > 300:
                    header_right.append(text)
                else:
                    header_left.append(text)
            if re.match(r"^\d{1,2}\s+de\s+[a-záéíóú]+\s+(?:de\s+)?\d{4}$", text, re.I):
                date_text = text
    return " ".join(header_left).strip(), " ".join(header_right).strip(), date_text


def choose_profession(header_right: str):
    key = ascii_key(header_right)
    # Primero coincidencia exacta, luego la coincidencia más larga.
    for profession in PROFESSIONS:
        for alias in profession["aliases"]:
            if ascii_key(alias) == key:
                return profession
    best = None
    for profession in PROFESSIONS:
        for alias in profession["aliases"]:
            alias_key = ascii_key(alias)
            if alias_key and alias_key in key:
                if best is None or len(alias_key) > best[0]:
                    best = (len(alias_key), profession)
    return best[1] if best else None


def choose_cycle(prefix: str, header_right: str, header_left: str, date_text: str):
    cycle = dict(CYCLES.get(prefix, {"year": None, "convocatoria": "", "label": ""}))
    if cycle["year"] is None:
        match = re.search(r"SERUMS\s+(20\d{2})\s*-\s*(I{1,2})", header_left, re.I)
        if match:
            cycle.update(year=int(match.group(1)), convocatoria=match.group(2), label=f"{match.group(1)}-{match.group(2)}")
    if not cycle["convocatoria"]:
        conv = re.search(r"-\s*(I{1,2})\s*$", header_right)
        if conv:
            cycle["convocatoria"] = conv.group(1)
    if cycle["year"] is None and date_text:
        year = re.search(r"(20\d{2})", date_text)
        if year:
            cycle["year"] = int(year.group(1))
    if not cycle["convocatoria"]:
        match = re.search(r"SERUMS\s+(20\d{2})\s*-\s*(I{1,2})", header_left, re.I)
        if match:
            cycle["convocatoria"] = match.group(2)
    if cycle["year"] and cycle["convocatoria"]:
        cycle["label"] = f"{cycle['year']}-{cycle['convocatoria']}"
    return cycle


def normalise_question_for_duplicates(statement: str, options) -> str:
    # Compara enunciado + alternativas. Si cambia una alternativa no se
    # considera el mismo registro, aunque el enunciado se repita.
    option_keys = sorted(ascii_key(option["text"]) for option in options if option["text"])
    return ascii_key(statement)[:300] + "||" + "|".join(option_keys)[:500]


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def format_date(date_text: str, cycle: dict) -> str:
    match = re.search(r"(\d{1,2})\s+de\s+([a-záéíóú]+)\s+(?:de\s+)?(20\d{2})", date_text, re.I)
    if match:
        day, month_name, year = match.groups()
        month = MONTHS.get(ascii_key(month_name).lower())
        if month:
            return f"{int(day):02d}/{month:02d}/{year}"
    return cycle.get("label", "")


def build(source: Path, out_dir: Path):
    pdf_files = sorted([
        path for path in source.glob("*.pdf")
        if re.match(r"^(7084225|8053031|8489155)-", path.name, re.I)
    ])
    if not pdf_files:
        raise SystemExit("No se encontraron PDFs SERUMS en la carpeta indicada.")

    docs_dir = out_dir / "documentos"
    data_dir = out_dir / "datos"
    docs_dir.mkdir(parents=True, exist_ok=True)
    data_dir.mkdir(parents=True, exist_ok=True)

    exams = []
    questions_out = {}
    audits = []
    profession_counts = defaultdict(int)
    duplicates = defaultdict(list)

    for pdf_path in pdf_files:
        prefix = pdf_path.name.split("-", 1)[0]
        doc, questions, incidental, artifacts, page_stats = extract_questions(pdf_path)
        header_left, header_right, date_text = first_page_meta(doc)
        profession = choose_profession(header_right) or choose_profession(f"{header_left} {header_right}")
        if profession is None:
            raise SystemExit(f"No se pudo clasificar la profesión de {pdf_path.name}: {header_right!r}")
        cycle = choose_cycle(prefix, header_right, header_left, date_text)
        if not cycle.get("year") or not cycle.get("convocatoria"):
            raise SystemExit(f"No se pudo determinar el ciclo de {pdf_path.name}")

        exam_id = f"{cycle['label'].lower()}-{profession['id']}"
        title = f"{profession['name']} · SERUMS {cycle['label']}"
        questions_valid = []
        missing_answers = []
        for question in questions:
            ordered = question["ordered_options"]
            correct = question["correct"]
            if len(correct) != 1:
                missing_answers.append({"number": question["number"], "page": question["page"], "correct": correct})
            if len(ordered) < 2:
                artifacts.append({"question": question["number"], "page": question["page"], "type": "alternativas_incompletas", "detail": f"Solo {len(ordered)} alternativas."})
            options = [
                {"id": option["letter"], "text": option["text"], "raw": option["raw"], "hl": option["hl"]}
                for option in ordered
            ]
            q = {
                "id": f"{exam_id}-q{question['number']:03d}",
                "n": question["number"],
                "p": question["page"],
                "s": question["statement"],
                "r": question["raw_statement"],
                "o": options,
                "c": correct[0] if len(correct) == 1 else "",
                "ev": [round(value, 1) for value in question["evidence"]] if question["evidence"] else None,
                "st": "valid" if len(correct) == 1 and len(ordered) >= 2 else "pending",
                "cf": "alta" if len(correct) == 1 and len(ordered) >= 4 else "media",
                "rv": 0,
            }
            questions_out.setdefault(exam_id, []).append(q)
            questions_valid.append(q)
            duplicates[normalise_question_for_duplicates(question["statement"], ordered)].append((exam_id, question["number"]))

        # Completar duplicados después de procesar todos los documentos.
        copy_path = docs_dir / pdf_path.name
        if not copy_path.exists() or copy_path.stat().st_size != pdf_path.stat().st_size:
            shutil.copy2(pdf_path, copy_path)

        incident_list = []
        for item in incidental:
            incident_list.append({
                "type": "resaltado_incidental",
                "severity": "info",
                "page": item["page"],
                "questions": item["questions"],
                "rect": item["rect"],
                "snippet": item["snippet"],
                "detail": "Resaltado amarillo sobre el enunciado; no se usó como respuesta.",
            })
        for item in artifacts:
            if item.get("page"):
                incident_list.append({
                    "type": item["type"],
                    "severity": "info",
                    "page": item["page"],
                    "questions": [item["question"]],
                    "detail": item["detail"],
                })
        if missing_answers:
            incident_list.append({
                "type": "respuesta_ambigua",
                "severity": "alta",
                "page": None,
                "questions": [item["number"] for item in missing_answers],
                "detail": f"{len(missing_answers)} preguntas sin una única respuesta resaltada.",
            })

        verified = sum(1 for q in questions_valid if q["st"] == "valid" and q["c"])
        pages_with_text = sum(1 for page in page_stats if page["textCharacters"] > 0)
        coverage = round(verified / len(questions_valid) * 100, 2) if questions_valid else 0
        audit_status = "validado" if coverage == 100 and not missing_answers else "revision"
        exam = {
            "id": exam_id,
            "professionId": profession["id"],
            "title": title,
            "cycle": cycle["label"],
            "year": cycle["year"],
            "convocatoria": cycle["convocatoria"],
            "date": format_date(date_text, cycle),
            "pages": len(doc),
            "questions": len(questions_valid),
            "validQuestions": verified,
            "answers": sum(1 for q in questions_valid if q["c"]),
            "file": pdf_path.name,
            "filePath": f"documentos/{pdf_path.name}",
            "fileHash": sha256_file(pdf_path),
            "fileBytes": pdf_path.stat().st_size,
            "sourcePrefix": prefix,
            "header": header_right,
            "audit": {
                "status": audit_status,
                "coverage": coverage,
                "pagesProcessed": len(doc),
                "pagesWithText": pages_with_text,
                "pagesWithoutText": len(doc) - pages_with_text,
                "questionsDetected": len(questions_valid),
                "questionsVerified": verified,
                "answersIdentified": sum(1 for q in questions_valid if q["c"]),
                "incidents": len(incident_list),
                "incidentalHighlights": len(incidental),
                "artifacts": len(artifacts),
                "duplicateQuestions": 0,
                "duplicateGroups": 0,
                "reviewed": 0,
                "reviewRequired": len(missing_answers),
                "generatedAt": datetime.now(timezone.utc).isoformat(),
            },
        }
        audits.append({"examId": exam_id, "file": pdf_path.name, "header": header_right, "cycle": cycle, "pages": len(doc), "questions": len(questions_valid), "verified": verified, "incidents": incident_list, "pageStats": page_stats})
        exams.append(exam)
        profession_counts[profession["id"]] += 1
        print(f"{pdf_path.name:42} {cycle['label']:6} {profession['id']:20} q={len(questions_valid):3} ok={verified:3} inc={len(incident_list)}")

    # Duplicados entre archivos, sin eliminarlos.
    duplicate_groups = 0
    duplicate_questions = 0
    for key, locations in duplicates.items():
        if not key or len(locations) < 2:
            continue
        duplicate_groups += 1
        duplicate_questions += len(locations)
        for exam_id, number in locations:
            for q in questions_out[exam_id]:
                if q["n"] == number:
                    q["dg"] = hashlib.sha1(key.encode("utf-8")).hexdigest()[:10]
                    q["dc"] = len(locations)
                    break
    for audit in audits:
        exam = next(item for item in exams if item["id"] == audit["examId"])
        exam["audit"]["duplicateQuestions"] = sum(1 for q in questions_out[audit["examId"]] if q.get("dc", 0) > 1)
        exam["audit"]["duplicateGroups"] = len({q.get("dg") for q in questions_out[audit["examId"]] if q.get("dg")})
    for exam in exams:
        exam["audit"]["duplicateQuestions"] = sum(1 for q in questions_out[exam["id"]] if q.get("dc", 0) > 1)
        exam["audit"]["duplicateGroups"] = len({q.get("dg") for q in questions_out[exam["id"]] if q.get("dg")})

    catalog = []
    for profession in PROFESSIONS:
        count = profession_counts.get(profession["id"], 0)
        catalog.append({
            **{key: value for key, value in profession.items() if key != "aliases"},
            "aliases": profession["aliases"],
            "examCount": count,
        })

    payload = {
        "version": "1.0.0",
        "schema": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": "PDFs oficiales SERUMS aportados por el usuario",
        "totals": {
            "professions": len([p for p in catalog if p["examCount"]]),
            "exams": len(exams),
            "questions": sum(len(items) for items in questions_out.values()),
            "validAnswers": sum(1 for items in questions_out.values() for q in items if q["c"]),
            "duplicateGroups": duplicate_groups,
            "duplicateQuestions": duplicate_questions,
        },
        "professions": catalog,
        "exams": exams,
        "questions": questions_out,
        "audits": audits,
    }

    js = "/* Banco oficial SERUMS · generado por tools/build_banco.py · ZARCONT */\n"
    js += "window.BANCO_OFICIAL=" + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (data_dir / "banco-oficial.js").write_text(js, encoding="utf-8")
    (data_dir / "auditoria-oficial.json").write_text(json.dumps({"audits": audits, "totals": payload["totals"]}, ensure_ascii=False, indent=2), encoding="utf-8")

    print("\nResumen")
    print(f"  Profesiones: {payload['totals']['professions']}")
    print(f"  Exámenes:    {payload['totals']['exams']}")
    print(f"  Preguntas:   {payload['totals']['questions']}")
    print(f"  Respuestas:  {payload['totals']['validAnswers']}")
    print(f"  Duplicados:  {duplicate_questions} preguntas en {duplicate_groups} grupos")
    print(f"  Salida:      {data_dir / 'banco-oficial.js'}")
    print(f"  Documentos:  {docs_dir}")


def main():
    parser = argparse.ArgumentParser(description="Genera el banco oficial de Banqueo desde PDFs SERUMS.")
    parser.add_argument("--source", default=str(Path.home() / "Downloads"), help="Carpeta con los PDFs originales.")
    parser.add_argument("--out", default=str(Path(__file__).resolve().parent.parent), help="Carpeta raíz de Examen Studio.")
    args = parser.parse_args()
    build(Path(args.source), Path(args.out))


if __name__ == "__main__":
    main()
