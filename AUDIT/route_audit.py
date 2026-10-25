#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# © 2026 ZARCONT — AUDIT/route_audit.py · Auditoría de rutas locales (Agente 1)
#
# Uso:
#   C:\Python313\python.exe AUDIT\route_audit.py
#   C:\Python313\python.exe AUDIT\route_audit.py --json AUDIT\evidencias\agent1-route-audit.json
#   C:\Python313\python.exe AUDIT\route_audit.py --legacy      # incluye nombres obsoletos
#
# Qué comprueba:
#   1. Recorre el repositorio y analiza todos los .html/.htm (omite .git, node_modules,
#      __pycache__) extrayendo los atributos href/src locales.
#   2. Ignora la query (?v=...) y el fragmento (#...), decodifica %XX y comprueba que el
#      destino exista con la MISMA capitalización (crítico si el sitio se publique en un
#      servidor sensible a mayúsculas, p. ej. Linux).
#   3. Un enlace a un directorio se resuelve a su index.html.
#   4. Los esquemas externos (http, https, data:, mailto:, javascript:, blob:, about:,
#      file:) no se contrastan con el disco; se contabilizan aparte.
#   5. Código de salida: 0 solo si no hay destinos faltantes ni errores de capitalización;
#      1 si los hay; 2 ante un error de uso. Los avisos (nombres obsoletos, query, etc.)
#      no alteran el código de salida: se informan para revisión humana.
#
# Sin dependencias: solo biblioteca estándar (Python 3.13).

from __future__ import annotations

import argparse
import datetime
import json
import os
import re
import sys
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SKIP_DIRS = {".git", "node_modules", "__pycache__", ".venv", "venv"}

EXTERNAL_SCHEMES = {
    "http", "https", "mailto", "tel", "javascript", "data", "blob", "about",
    "ftp", "ftps", "ws", "wss", "file", "chrome", "edge", "whatsapp", "sms",
}

# Nombres de páginas o carpetas que ya no existen en este repositorio. Se buscan como
# texto en código y documentación para detectar enlaces a versiones antiguas.
LEGACY_PATTERNS = [
    # Nombres de entrada antiguos que nunca existieron con ese nombre.
    (r"dashboard\.html", "entrada antigua 'dashboard.html' (la real es study-dashboard/index.html)"),
    (r"flashcards\.html", "entrada antigua 'flashcards.html' (la real es study-flashcards/index.html)"),
    (r"study[-_]board", "nombre antiguo 'study-board' (la app es study-dashboard)"),
    (r"study[-_]flashcards\.html?", "entrada antigua 'study-flashcards.html' (la real es study-flashcards/index.html)"),
    (r"serums[-_]map\.html", "entrada antigua 'serums-map.html' (la real es serums map/serums-map-explorer/index.html)"),
    (r"examen[-_ ]?studio\.html", "entrada antigua en minúsculas (la real es 'EXAMEN STUDIO/Examen Studio.html')"),
    (r"\bplaza[-_a-z0-9]*\.html\b", "página de plaza suelta (Plazas no expone fichas por URL)"),
    (r"/old/", "carpeta 'old/'"),
    (r"\bold[-_](?:app|index|page)", "recurso 'old-*'"),
    (r"/v1/", "carpeta versionada '/v1/'"),
    (r"_v1\.html\b", "página versionada '*_v1.html'"),
    (r"\.\./\.\./index\.html\?sheet", "enlace de reanudación con ruta relativa profunda"),
]

LEGACY_EXTENSIONS = {".html", ".htm", ".js", ".css", ".json", ".md", ".py", ".txt"}
LEGACY_SKIP_PREFIXES = ("AUDIT/",)  # el propio informe cita los nombres antiguos


class LinkCollector(HTMLParser):
    """Extrae (atributo, valor, línea) de los atributos href/src de un HTML."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[tuple[str, str, int]] = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in ("href", "src") and value is not None:
                self.links.append((name, value.strip(), self.getpos()[0]))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)


def iter_html_files(root: str):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS)
        for name in sorted(filenames):
            if name.lower().endswith((".html", ".htm")):
                yield os.path.join(dirpath, name)


def rel(path: str) -> str:
    try:
        return os.path.relpath(path, REPO_ROOT).replace(os.sep, "/")
    except ValueError:
        return path.replace(os.sep, "/")


def resolve_exact_case(abs_target: str) -> tuple[str, str]:
    """Comprueba existencia distinguiendo mayúsculas.

    Devuelve (estado, destino_real) con estado en {"ok", "missing", "case", "outside"}.
    """
    try:
        rel_path = os.path.relpath(abs_target, REPO_ROOT)
    except ValueError:
        return "outside", abs_target
    parts = [p for p in rel_path.replace("\\", "/").split("/") if p not in ("", ".")]
    cur = REPO_ROOT
    for comp in parts:
        if comp == "..":
            parent = os.path.dirname(cur)
            if parent == cur:
                return "outside", abs_target
            cur = parent
            continue
        try:
            entries = os.listdir(cur)
        except OSError:
            return "missing", abs_target
        if comp in entries:
            cur = os.path.join(cur, comp)
            continue
        folded = [e for e in entries if e.lower() == comp.lower()]
        if folded:
            return "case", os.path.join(cur, folded[0])
        return "missing", abs_target
    if os.path.isdir(cur):
        try:
            entries = os.listdir(cur)
        except OSError:
            return "missing", cur
        if "index.html" in entries:
            return "ok", os.path.join(cur, "index.html")
        folded = [e for e in entries if e.lower() == "index.html"]
        if folded:
            return "case", os.path.join(cur, folded[0])
        return "missing", cur
    if os.path.isfile(cur):
        return "ok", cur
    return "missing", abs_target


def classify(raw: str) -> str:
    """Clasifica un valor de href/src: external | fragment | empty | local."""
    value = raw.strip()
    if not value or value == "#":
        return "empty"
    if value.startswith("#"):
        return "fragment"
    scheme = urlsplit(value).scheme.lower()
    if scheme in EXTERNAL_SCHEMES:
        return "external"
    if scheme and scheme not in ("", None):
        # Un esquema desconocido (p. ej. "c:" de una ruta Windows) se trata como local.
        if len(scheme) == 1 and value[1:3] in (":\\", ":/"):
            return "local"
        return "external"
    return "local"


def local_target(html_path: str, raw: str) -> tuple[str, str]:
    """Devuelve (ruta_absoluta_sin_query_ni_hash, query) para un enlace local."""
    split = urlsplit(raw.strip())
    path = split.path
    query = split.query
    path = unquote(path)
    if path.startswith("/"):
        base = REPO_ROOT
        path = path.lstrip("/")
    else:
        base = os.path.dirname(html_path)
    if not path:
        return os.path.normpath(html_path), query
    return os.path.normpath(os.path.join(base, path)), query


def scan_links(html_files: list[str]) -> tuple[list[dict], dict]:
    records: list[dict] = []
    totals = {
        "html_files": len(html_files),
        "links_total": 0,
        "local": 0,
        "external": 0,
        "fragment": 0,
        "empty": 0,
        "ok": 0,
        "missing": 0,
        "case": 0,
        "outside": 0,
        "with_query": 0,
    }
    for html_path in html_files:
        try:
            with open(html_path, "r", encoding="utf-8", errors="replace") as handle:
                text = handle.read()
        except OSError as err:  # pragma: no cover - defensivo
            records.append({
                "file": rel(html_path), "line": 0, "attr": "", "raw": "",
                "status": "missing", "resolved": str(err), "query": "",
            })
            totals["missing"] += 1
            continue
        parser = LinkCollector()
        try:
            parser.feed(text)
            parser.close()
        except Exception:  # pragma: no cover - HTML muy roto
            pass
        for attr, value, line in parser.links:
            totals["links_total"] += 1
            kind = classify(value)
            if kind in ("external", "fragment", "empty"):
                totals[kind] += 1
                continue
            totals["local"] += 1
            target, query = local_target(html_path, value)
            if query:
                totals["with_query"] += 1
            status, resolved = resolve_exact_case(target)
            totals[status] = totals.get(status, 0) + 1
            records.append({
                "file": rel(html_path),
                "line": line,
                "attr": attr,
                "raw": value,
                "status": status,
                "resolved": rel(resolved),
                "query": query,
            })
    return records, totals


def scan_legacy() -> list[dict]:
    hits: list[dict] = []
    compiled = [(re.compile(pattern), note) for pattern, note in LEGACY_PATTERNS]
    for dirpath, dirnames, filenames in os.walk(REPO_ROOT):
        dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS)
        for name in sorted(filenames):
            ext = os.path.splitext(name)[1].lower()
            if ext not in LEGACY_EXTENSIONS:
                continue
            path = os.path.join(dirpath, name)
            rel_path = rel(path)
            if rel_path.startswith(LEGACY_SKIP_PREFIXES):
                continue
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as handle:
                    for number, line in enumerate(handle, 1):
                        for regex, note in compiled:
                            if regex.search(line):
                                hits.append({
                                    "file": rel_path,
                                    "line": number,
                                    "pattern": regex.pattern,
                                    "note": note,
                                    "text": line.strip()[:200],
                                })
            except OSError:
                continue
    return hits


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(
        description="Audita los enlaces locales (href/src) de todos los HTML del repositorio."
    )
    parser.add_argument("--json", metavar="RUTA", help="Escribe el informe JSON en RUTA.")
    parser.add_argument("--legacy", action="store_true", help="Escanea nombres de páginas obsoletas.")
    parser.add_argument("--quiet", action="store_true", help="Solo errores y resumen final.")
    args = parser.parse_args(argv)

    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:  # pragma: no cover
        pass

    html_files = list(iter_html_files(REPO_ROOT))
    records, totals = scan_links(html_files)
    missing = [r for r in records if r["status"] == "missing"]
    case_hits = [r for r in records if r["status"] == "case"]
    outside = [r for r in records if r["status"] == "outside"]
    legacy = scan_legacy() if args.legacy else []

    if not args.quiet:
        print("SERUMS · auditoría de rutas locales (href/src de HTML)")
        print("Repositorio:", REPO_ROOT)
        print("Generado:", datetime.datetime.now().isoformat(timespec="seconds"))
        print()
        print(f"HTML analizados: {totals['html_files']}")
        print(f"Atributos href/src: {totals['links_total']}")
        print(f"  locales comprobados: {totals['local']}")
        print(f"  externos omitidos:   {totals['external']}")
        print(f"  fragmentos (#...):   {totals['fragment']}")
        print(f"  vacíos:              {totals['empty']}")
        print(f"  con query (?v=...):  {totals['with_query']}")
        print()

    if missing:
        print(f"DESTINOS FALTANTES ({len(missing)}):")
        for item in missing:
            print(f"  {item['file']}:{item['line']}  {item['attr']}=\"{item['raw']}\""
                  f"  ->  {item['resolved']}")
        print()

    if case_hits:
        print(f"CAPITALIZACIÓN DISTINTA ({len(case_hits)}):")
        for item in case_hits:
            print(f"  {item['file']}:{item['line']}  {item['attr']}=\"{item['raw']}\""
                  f"  ->  {item['resolved']}")
        print()

    if outside:
        print(f"FUERA DEL REPOSITORIO ({len(outside)}):")
        for item in outside:
            print(f"  {item['file']}:{item['line']}  {item['attr']}=\"{item['raw']}\"")
        print()

    if args.legacy:
        if legacy:
            print(f"NOMBRES OBSOLETOS / SOSPECHOSOS ({len(legacy)}):")
            for item in legacy:
                print(f"  {item['file']}:{item['line']}  [{item['note']}]")
                print(f"      {item['text']}")
            print()
        else:
            print("NOMBRES OBSOLETOS: ninguno (0 coincidencias).")
            print()

    failed = bool(missing or case_hits)
    print("RESULTADO:", "FALLOS" if failed else "OK — todos los destinos locales existen con la capitalización exacta")
    print(f"  faltantes={len(missing)}  capitalización={len(case_hits)}  fuera={len(outside)}")

    if args.json:
        payload = {
            "generated_at": datetime.datetime.now().isoformat(timespec="seconds"),
            "repo_root": REPO_ROOT,
            "totals": totals,
            "result": "fail" if failed else "ok",
            "missing": missing,
            "case_mismatch": case_hits,
            "outside": outside,
            "links": records,
            "legacy": legacy,
        }
        out_path = args.json
        if not os.path.isabs(out_path):
            out_path = os.path.join(REPO_ROOT, out_path)
        os.makedirs(os.path.dirname(out_path) or REPO_ROOT, exist_ok=True)
        with open(out_path, "w", encoding="utf-8", newline="\n") as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        if not args.quiet:
            print("Informe JSON:", rel(out_path))

    return 1 if failed else 0


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv[1:]))
    except KeyboardInterrupt:  # pragma: no cover
        sys.exit(2)
