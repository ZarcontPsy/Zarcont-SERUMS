#!/usr/bin/env python3
# © 2026 ZARCONT — Verificador de integridad del repositorio (SERUMS HUB)
"""Verifica (o regenera) el manifiesto SHA-256 de los archivos propios del repositorio.

Uso:
    python verificar_integridad.py              # verifica contra INTEGRITY.sha256
    python verificar_integridad.py --generar    # regenera el manifiesto

Exclusiones deliberadas: JSON crudos de entrada en "serums map/", carpetas
__pycache__/, node_modules, .git y el propio manifiesto. Ver AUTORIA.md (§5).
"""
import hashlib
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
RAIZ = pathlib.Path(__file__).resolve().parent
MANIFIESTO = RAIZ / "INTEGRITY.sha256"
DIRS_EXCLUIDOS = {"__pycache__", "node_modules", ".git"}


def sha256(ruta: pathlib.Path) -> str:
    h = hashlib.sha256()
    with ruta.open("rb") as f:
        for bloque in iter(lambda: f.read(1 << 20), b""):
            h.update(bloque)
    return h.hexdigest()


def incluido(ruta: pathlib.Path) -> bool:
    rel = ruta.relative_to(RAIZ)
    if any(parte in DIRS_EXCLUIDOS for parte in rel.parts[:-1]):
        return False
    # Datos fuente en crudo (entradas del proceso, no código distribuido)
    if rel.parent == pathlib.Path("serums map") and rel.suffix.lower() == ".json":
        return False
    return True


def generar() -> int:
    lineas = []
    for ruta in sorted(RAIZ.rglob("*")):
        if ruta.is_dir() or ruta == MANIFIESTO or not incluido(ruta):
            continue
        rel = ruta.relative_to(RAIZ).as_posix()
        lineas.append(f"{sha256(ruta)}  {rel}")
    with MANIFIESTO.open("w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lineas) + "\n")
    print(f"Manifiesto regenerado: {len(lineas)} archivos.")
    return 0


def verificar() -> int:
    if not MANIFIESTO.exists():
        print("No existe INTEGRITY.sha256 (usa --generar).")
        return 1
    ok, modificados, faltantes = 0, [], []
    for linea in MANIFIESTO.read_text(encoding="utf-8").splitlines():
        linea = linea.strip()
        if not linea or linea.startswith("#"):
            continue
        partes = linea.split("  ", 1)
        if len(partes) != 2:
            continue
        esperado, rel = partes
        ruta = RAIZ / rel
        if not ruta.exists():
            faltantes.append(rel)
        elif sha256(ruta) == esperado:
            ok += 1
        else:
            modificados.append(rel)
    print(f"Verificados: {ok} | modificados: {len(modificados)} | faltantes: {len(faltantes)}")
    for rel in modificados:
        print(f"  MODIFICADO: {rel}")
    for rel in faltantes:
        print(f"  FALTANTE:   {rel}")
    if modificados or faltantes:
        print("Integridad con diferencias. Si los cambios son legítimos, regenera con --generar.")
        return 1
    print("Integridad correcta: ningún archivo difiere del manifiesto.")
    return 0


def main() -> int:
    return generar() if "--generar" in sys.argv[1:] else verificar()


if __name__ == "__main__":
    raise SystemExit(main())
