# -*- coding: utf-8 -*-
"""Genera la matriz de cobertura y el informe de auditoria de Study.

Uso:
    python study-data/tools/build_coverage.py

Lee study-data/audit/merged.json y escribe:
- study-data/audit/cobertura-fuentes.csv
- study-data/audit/matriz-pdf-tema-ficha-tarjeta.csv
- study-data/audit/COBERTURA.md
"""
import csv
import io
import json
import os
from collections import defaultdict

import pymupdf

ROOT = "study-data/audit"
PARTIAL = {
    "src-ley-violencia",
    "src-violencia-sexual",
    "src-vih",
    "src-hepatitis-b",
    "src-hepatitis-c",
    "src-modelo-abordaje",
    "src-municipios",
    "src-escuelas",
    "src-agente",
    "src-parto",
    "src-neonatal",
    "src-climaterio",
    "src-vih-navv",
}
NO_DUPLICATE = {"src-nutricion-ninos-anterior"}
PARTIAL_NOTES = {
    "src-ley-violencia": "Marco legal y medidas de proteccion; faltan desarrollos procedimentales y articulacion con otros servicios.",
    "src-violencia-sexual": "Atencion inmediata y profilaxis; faltan seguimiento longitudinal, salud mental y ruta legal detallada.",
    "src-vih": "Diagnostico, TAR y monitoreo; faltan coinfecciones, falla terapeutica y poblaciones especiales.",
    "src-hepatitis-b": "Prevencion, diagnostico y tratamiento; faltan escenarios especiales y seguimiento de contactos.",
    "src-hepatitis-c": "Tamizaje, diagnostico y tratamiento; faltan grupos especiales y manejo de reinfeccion.",
    "src-modelo-abordaje": "Sujetos, escenarios, ejes y programas; los siete anexos tematicos no se desarrollan ficha por ficha.",
    "src-municipios": "Definicion, fases y evaluacion; faltan actores, lineas de accion y herramientas de gestion.",
    "src-escuelas": "Concepto, lineas y organizacion; faltan instrumentos de diagnostico y evaluacion escolar.",
    "src-agente": "Roles, capacitacion y sostenibilidad; faltan instrumentos de supervision y registro.",
    "src-parto": "Atencion respetuosa, fases y practicas clave; no se detallan las 56 recomendaciones una por una.",
    "src-neonatal": "Atencion inmediata, alojamiento y signos de alarma; faltan UCIN, prematurez y referencia.",
    "src-climaterio": "Diagnostico, MRS y terapia hormonal; faltan manejo no hormonal y seguimiento a largo plazo.",
    "src-vih-navv": "Equipo, diagnostico, TAR y adherencia; faltan infecciones oportunistas, TB y revelacion del diagnostico.",
}


def main():
    content = json.load(io.open(os.path.join(ROOT, "merged.json"), encoding="utf-8"))
    sheets_by_source = defaultdict(list)
    cards_by_sheet = defaultdict(list)
    for sheet in content["sheets"]:
        for source_id in {ref["sourceId"] for ref in sheet.get("sourceRefs", [])}:
            sheets_by_source[source_id].append(sheet)
    for card in content["cards"]:
        cards_by_sheet[card["sheetId"]].append(card)

    page_counts = {}
    for source in content["sources"]:
        path = os.path.normpath(os.path.join("study-data", source["file"].replace("../study-data/", "")))
        document = pymupdf.open(path)
        page_counts[source["id"]] = document.page_count
        document.close()

    rows = []
    for source in content["sources"]:
        sheets = sheets_by_source[source["id"]]
        cards = [card for sheet in sheets for card in cards_by_sheet[sheet["id"]]]
        pages = {
            page
            for sheet in sheets
            for ref in sheet.get("sourceRefs", [])
            if ref["sourceId"] == source["id"]
            for page in ref["pages"]
        }
        total_pages = page_counts[source["id"]]
        if source["id"] in NO_DUPLICATE:
            status = "Acto normativo, sin duplicacion"
        elif source["id"] in PARTIAL:
            status = "Cobertura parcial"
        else:
            status = "Tematica principal cubierta"
        rows.append({
            "source_id": source["id"],
            "short": source["short"],
            "file": os.path.basename(source["file"]),
            "pages": total_pages,
            "topics": len({sheet["topicId"] for sheet in sheets}),
            "sheets": len(sheets),
            "cards": len(cards),
            "cited_pages": len(pages),
            "page_coverage_pct": round(100 * len(pages) / total_pages, 1) if total_pages else 0.0,
            "status": status,
            "notes": PARTIAL_NOTES.get(source["id"], ""),
        })

    with io.open(os.path.join(ROOT, "cobertura-fuentes.csv"), "w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    topic_by_id = {topic["id"]: topic for topic in content["topics"]}
    area_by_id = {area["id"]: area for area in content["areas"]}
    source_by_sheet = {}
    for sheet in content["sheets"]:
        for ref in sheet.get("sourceRefs", []):
            source_by_sheet.setdefault(sheet["id"], [])
            if ref["sourceId"] not in source_by_sheet[sheet["id"]]:
                source_by_sheet[sheet["id"]].append(ref["sourceId"])

    with io.open(os.path.join(ROOT, "matriz-pdf-tema-ficha-tarjeta.csv"), "w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow([
            "source_id", "pdf", "area", "topic_id", "topic", "sheet_id", "sheet",
            "card_concept", "card_multiple", "card_application", "pages",
        ])
        for source in content["sources"]:
            for sheet in sheets_by_source[source["id"]]:
                cards = {card["type"]: card["id"] for card in cards_by_sheet[sheet["id"]]}
                pages = sorted({
                    page
                    for ref in sheet.get("sourceRefs", [])
                    if ref["sourceId"] == source["id"]
                    for page in ref["pages"]
                })
                topic = topic_by_id[sheet["topicId"]]
                writer.writerow([
                    source["id"], os.path.basename(source["file"]), area_by_id[topic["areaId"]]["title"],
                    topic["id"], topic["title"], sheet["id"], sheet["title"],
                    cards.get("concept", ""), cards.get("multiple", ""), cards.get("application", ""),
                    ", ".join(str(page) for page in pages),
                ])

    total_sources = len(content["sources"])
    total_areas = len(content["areas"])
    total_topics = len(content["topics"])
    total_sheets = len(content["sheets"])
    total_cards = len(content["cards"])
    complete = sum(1 for row in rows if row["status"] == "Tematica principal cubierta")
    partial = sum(1 for row in rows if row["status"] == "Cobertura parcial")
    nodup = sum(1 for row in rows if row["status"] == "Acto normativo, sin duplicacion")
    avg_coverage = sum(row["page_coverage_pct"] for row in rows) / total_sources
    total_cited = sum(row["cited_pages"] for row in rows)
    total_pages = sum(row["pages"] for row in rows)

    lines = []
    lines.append("# Cobertura del temario Study")
    lines.append("")
    lines.append("Generado desde `study-data/audit/merged.json` y los PDF de `study-data/fuentes/`.")
    lines.append("")
    lines.append("## Resumen")
    lines.append("")
    lines.append("| Metrica | Valor |")
    lines.append("| --- | ---: |")
    lines.append("| PDF en fuentes | %d |" % total_sources)
    lines.append("| Areas | %d |" % total_areas)
    lines.append("| Temas | %d |" % total_topics)
    lines.append("| Fichas | %d |" % total_sheets)
    lines.append("| Tarjetas | %d |" % total_cards)
    lines.append("| Tarjetas por tipo | %d concepto, %d multiple, %d aplicacion |" % (
        sum(1 for card in content["cards"] if card["type"] == "concept"),
        sum(1 for card in content["cards"] if card["type"] == "multiple"),
        sum(1 for card in content["cards"] if card["type"] == "application"),
    ))
    lines.append("| Fuentes con tematica principal cubierta | %d |" % complete)
    lines.append("| Fuentes con cobertura parcial | %d |" % partial)
    lines.append("| Actos normativos sin duplicacion | %d |" % nodup)
    lines.append("| Paginas citadas (unicas por fuente) | %d de %d |" % (total_cited, total_pages))
    lines.append("| Cobertura de paginas promedio | %.1f%% |" % avg_coverage)
    lines.append("")
    lines.append("La cobertura de paginas es una medida de profundidad documental, no de completitud tematica. "
                 "Una guia larga puede tener sus temas principales cubiertos con pocas paginas si estas concentran "
                 "las recomendaciones; a la inversa, citar muchas paginas no garantiza haber agotado los subtemas.")
    lines.append("")
    lines.append("## Matriz por fuente")
    lines.append("")
    lines.append("| Fuente | PDF | Pag. | Temas | Fichas | Tarjetas | Pag. citadas | Cobertura | Estado |")
    lines.append("| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |")
    for row in rows:
        lines.append("| %s | %s | %d | %d | %d | %d | %d | %.1f%% | %s |" % (
            row["short"], row["file"], row["pages"], row["topics"], row["sheets"],
            row["cards"], row["cited_pages"], row["page_coverage_pct"], row["status"],
        ))
    lines.append("")
    lines.append("## Subtemas pendientes por fuente")
    lines.append("")
    for row in rows:
        if row["notes"]:
            lines.append("- **%s** (`%s`): %s" % (row["short"], row["source_id"], row["notes"]))
    lines.append("")
    lines.append("## Notas de lectura")
    lines.append("")
    lines.append("- Las fuentes escaneadas se trabajaron con OCR acotado y digests; la verificacion de paginas es estructural y, "
                 "en esos casos, depende de la calidad del OCR.")
    lines.append("- La guia 2024 de nutricion infantil es el acto resolutivo que aprueba la guia 2025; no se duplicaron fichas.")
    lines.append("- No se declara cobertura tematica del 100%: 13 fuentes tienen subtemas pendientes y varias guias largas "
                 "se cubrieron en sus temas principales, no en todos sus anexos.")
    lines.append("")
    replacements = {
        "Metrica": "Métrica", "Areas": "Áreas", "multiple": "múltiple",
        "aplicacion": "aplicación", "unicas": "únicas",
        "tematica": "temática", "Tematica": "Temática",
        "paginas": "páginas", "Paginas": "Páginas", "duplicacion": "duplicación",
        "proteccion": "protección", "articulacion": "articulación", "Atencion": "Atención",
        "Diagnostico": "Diagnóstico", "diagnostico": "diagnóstico", "terapeutica": "terapéutica",
        "Prevencion": "Prevención", "definicion": "definición", "evaluacion": "evaluación",
        "lineas": "líneas", "accion": "acción", "gestion": "gestión", "capacitacion": "capacitación",
        "supervision": "supervisión", "practicas": "prácticas", "revelacion": "revelación",
        "guia": "guía", "Guia": "Guía", "nutricion": "nutrición", "verificacion": "verificación",
        "referencias": "referencias", "analisis": "análisis",
    }
    report = "\n".join(lines) + "\n"
    for source, target in replacements.items():
        report = report.replace(source, target)
    with io.open(os.path.join(ROOT, "COBERTURA.md"), "w", encoding="utf-8", newline="\n") as handle:
        handle.write(report)

    print("Fuentes:", total_sources, "areas:", total_areas, "temas:", total_topics,
          "fichas:", total_sheets, "tarjetas:", total_cards)
    print("Cobertura promedio de paginas: %.1f%%" % avg_coverage)
    print("Escrito:", os.path.join(ROOT, "COBERTURA.md"))


if __name__ == "__main__":
    main()
