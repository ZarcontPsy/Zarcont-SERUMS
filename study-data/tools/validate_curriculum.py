# -*- coding: utf-8 -*-
"""Validador del temario compartido de Study.

Uso:
    python study-data/tools/validate_curriculum.py study-data/audit/merged.json

Comprueba estructura, referencias, paginas, fichas/tarjetas y duplicados.
No modifica archivos.
"""
import collections
import json
import os
import re
import sys
import unicodedata

import pymupdf


def norm(text):
    value = unicodedata.normalize("NFKD", text.lower())
    return re.sub(r"[^a-z0-9 ]", "", value.encode("ascii", "ignore").decode())


def main(path):
    with open(path, encoding="utf-8") as handle:
        content = json.load(handle)

    issues = []
    warnings = []
    keys = ["sources", "areas", "topics", "sheets", "cards"]
    ids = {key: {item["id"] for item in content.get(key, [])} for key in keys}

    duplicates = {
        key: [item for item, count in collections.Counter(
            entry["id"] for entry in content.get(key, [])
        ).items() if count > 1]
        for key in keys
    }
    for key, values in duplicates.items():
        if values:
            issues.append("IDs duplicados en %s: %s" % (key, values))

    pages = {}
    for source in content["sources"]:
        relative = source.get("file", "").replace("../study-data/", "")
        pdf_path = os.path.normpath(os.path.join("study-data", relative))
        if not os.path.exists(pdf_path):
            issues.append("Archivo faltante para %s: %s" % (source["id"], pdf_path))
            continue
        document = pymupdf.open(pdf_path)
        pages[source["id"]] = document.page_count
        document.close()

    for area in content["areas"]:
        for source_id in area.get("sourceIds", []):
            if source_id not in ids["sources"]:
                issues.append("Area %s referencia fuente inexistente %s" % (area["id"], source_id))
        if not any(topic["areaId"] == area["id"] for topic in content["topics"]):
            warnings.append("Area sin temas: %s" % area["id"])

    for topic in content["topics"]:
        if topic["areaId"] not in ids["areas"]:
            issues.append("Tema %s referencia area inexistente" % topic["id"])
        for source_id in topic.get("sourceIds", []):
            if source_id not in ids["sources"]:
                issues.append("Tema %s referencia fuente inexistente %s" % (topic["id"], source_id))
        if not any(sheet["topicId"] == topic["id"] for sheet in content["sheets"]):
            issues.append("Tema sin fichas: %s" % topic["id"])
        if not any(card["topicId"] == topic["id"] for card in content["cards"]):
            issues.append("Tema sin tarjetas: %s" % topic["id"])

    for sheet in content["sheets"]:
        if sheet["topicId"] not in ids["topics"]:
            issues.append("Ficha %s referencia tema inexistente" % sheet["id"])
        if sheet["areaId"] not in ids["areas"]:
            issues.append("Ficha %s referencia area inexistente" % sheet["id"])
        if not sheet.get("sourceRefs"):
            issues.append("Ficha %s sin referencias" % sheet["id"])
        for reference in sheet.get("sourceRefs", []):
            source_id = reference.get("sourceId")
            if source_id not in ids["sources"]:
                issues.append("Ficha %s referencia fuente inexistente %s" % (sheet["id"], source_id))
                continue
            for page in reference.get("pages", []):
                if not isinstance(page, int) or not 1 <= page <= pages.get(source_id, 0):
                    issues.append("Ficha %s pagina fuera de rango: %s p%s" % (sheet["id"], source_id, page))
        if len(sheet.get("sections", [])) < 2:
            issues.append("Ficha %s tiene menos de 2 secciones" % sheet["id"])
        if len(sheet.get("keyConcepts", [])) < 3:
            warnings.append("Ficha %s tiene menos de 3 conceptos clave" % sheet["id"])
        if sheet["topicId"] in ids["topics"]:
            topic = next(item for item in content["topics"] if item["id"] == sheet["topicId"])
            if topic["areaId"] != sheet["areaId"]:
                issues.append("Ficha %s no coincide con el area de su tema" % sheet["id"])
        for section in sheet.get("sections", []):
            if not section.get("title"):
                issues.append("Ficha %s tiene una seccion sin titulo" % sheet["id"])
            if not (section.get("body") or section.get("bullets") or section.get("table") or section.get("callout")):
                issues.append("Ficha %s tiene una seccion vacia: %s" % (sheet["id"], section.get("title")))
            if section.get("depth") not in ("core", "full", "", None):
                warnings.append("Ficha %s tiene profundidad desconocida: %s" % (sheet["id"], section.get("depth")))

    cards_by_sheet = collections.Counter(card["sheetId"] for card in content["cards"])
    for sheet in content["sheets"]:
        if cards_by_sheet[sheet["id"]] != 3:
            issues.append("Ficha %s tiene %s tarjetas (se esperan 3)" % (sheet["id"], cards_by_sheet[sheet["id"]]))
        sheet_cards = [card for card in content["cards"] if card["sheetId"] == sheet["id"]]
        types = collections.Counter(card["type"] for card in sheet_cards)
        if set(types) != {"concept", "multiple", "application"} or any(count != 1 for count in types.values()):
            issues.append("Ficha %s no tiene una tarjeta de cada tipo: %s" % (sheet["id"], dict(types)))

    for card in content["cards"]:
        if card["topicId"] not in ids["topics"]:
            issues.append("Tarjeta %s referencia tema inexistente" % card["id"])
        if card["sheetId"] not in ids["sheets"]:
            issues.append("Tarjeta %s referencia ficha inexistente" % card["id"])
        if not card.get("prompt"):
            issues.append("Tarjeta %s sin pregunta" % card["id"])
        if len(card.get("explanation", "")) < 20:
            warnings.append("Tarjeta %s con explicacion muy corta" % card["id"])
        if card.get("type") == "concept":
            if not card.get("answer"):
                issues.append("Tarjeta conceptual %s sin respuesta" % card["id"])
        elif card.get("type") in ("multiple", "application"):
            options = card.get("options", [])
            if len(options) != 4:
                issues.append("Tarjeta %s tiene %s opciones (se esperan 4)" % (card["id"], len(options)))
            if len(set(options)) != len(options):
                issues.append("Tarjeta %s tiene opciones duplicadas" % card["id"])
            correct = card.get("correctIndex")
            if not isinstance(correct, int) or not 0 <= correct < len(options):
                issues.append("Tarjeta %s tiene correctIndex invalido" % card["id"])
        else:
            issues.append("Tarjeta %s tiene tipo desconocido %s" % (card["id"], card.get("type")))
        for reference in card.get("sourceRefs", []):
            source_id = reference.get("sourceId")
            if source_id not in ids["sources"]:
                issues.append("Tarjeta %s referencia fuente inexistente %s" % (card["id"], source_id))
                continue
            for page in reference.get("pages", []):
                if not isinstance(page, int) or not 1 <= page <= pages.get(source_id, 0):
                    issues.append("Tarjeta %s pagina fuera de rango: %s p%s" % (card["id"], source_id, page))
        if card["sheetId"] in ids["sheets"]:
            sheet = next(item for item in content["sheets"] if item["id"] == card["sheetId"])
            if sheet["topicId"] != card["topicId"]:
                issues.append("Tarjeta %s no coincide con el tema de su ficha" % card["id"])

    prompts = collections.defaultdict(list)
    for card in content["cards"]:
        prompts[norm(card["prompt"])].append(card["id"])
    for prompt, card_ids in prompts.items():
        if prompt and len(card_ids) > 1:
            warnings.append("Pregunta duplicada: %s" % ", ".join(card_ids))

    legacy = [
        item["id"] for key in ("sheets", "cards", "topics", "areas", "sources")
        for item in content.get(key, [])
        if "pendiente" in item or "categoriaLegacy" in item
    ]
    if legacy:
        issues.append("Campos legados presentes: %s" % legacy)

    print("Conteos:", {key: len(content.get(key, [])) for key in keys})
    print("Tipos de tarjeta:", dict(collections.Counter(card["type"] for card in content["cards"])))
    print("Distribucion correctIndex:", dict(collections.Counter(
        card.get("correctIndex") for card in content["cards"]
        if card["type"] in ("multiple", "application")
    )))
    print("Errores:", len(issues))
    for issue in issues:
        print("  ERROR:", issue)
    print("Advertencias:", len(warnings))
    for warning in warnings[:80]:
        print("  AVISO:", warning)
    return 1 if issues else 0


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "study-data/audit/merged.json"
    raise SystemExit(main(target))
