# © 2026 ZARCONT — Todos los derechos reservados · Licencia: LICENSE (raíz del repositorio)
# Comprueba que los JS de la app se pueden parsear (sintaxis) con pyjsparser.
import pathlib, re, sys
sys.stdout.reconfigure(encoding="utf-8")
import pyjsparser

ROOT = pathlib.Path(__file__).resolve().parent.parent
fallos = 0
for p in sorted((ROOT / "js").glob("*.js")):
    src = p.read_text(encoding="utf-8")
    # pyjsparser es ES5: neutralizamos async/await (usados en la geocodificación) solo para validar sintaxis
    src = re.sub(r"\basync\s+(?=function|\()", "", src).replace("await ", "")
    try:
        pyjsparser.parse(src)
        print("OK  ", p.name)
    except Exception as e:
        fallos += 1
        print("FALLO", p.name, "->", e)
print()
print("fallos:", fallos)
sys.exit(1 if fallos else 0)
