# © 2026 ZARCONT — Todos los derechos reservados · Licencia: LICENSE (raíz del repositorio)
# Parseo del PDF de resultados finales (compartido por los scripts de pruebas).
#
# El PDF trae una celda por línea y varias celdas se parten en dos líneas
# ('TM - LABORATORIO ' + 'CLINICO', 'LIMA REGION' + '(HUACHO)'). Además hay filas sin
# número de orden (guion) en las que la columna NOTA trae un estado de texto
# ('NO SE PRESENTÓ Y/O NO RINDIÓ EVALUACIÓN') en lugar de una nota.
#
# La profesión se usa como ancla (es un valor de una lista cerrada) y a partir de ahí
# se reconstruyen nombre, región y nota/estado.
#
# Devuelve {(nombre_normalizado, profesion_normalizada): [(region, nota, estado), ...]}
#   nota:  float o None
#   estado: '' cuando hay nota, o el texto oficial de estado
import re
import unicodedata
from collections import defaultdict

PROFS = ["MEDICINA", "ENFERMERIA", "PSICOLOGIA", "OBSTETRICIA", "ODONTOLOGIA", "NUTRICION",
         "QUIMICO FARMACEUTICO", "TM - LABORATORIO CLINICO", "BIOLOGIA", "TRABAJO SOCIAL",
         "TM - TERAPIA FISICA", "MEDICINA VETERINARIA", "TM - RADIOLOGIA", "INGENIERIA SANITARIA",
         "TM - TERAPIA LENGUAJE", "TM - TERAPIA OCUPACIONAL", "TM - OPTOMETRIA"]

RE_IDX = re.compile(r"^\d{1,4}$")
# La nota siempre trae decimales (15.80, 8.4): exigirlos evita confundirla con el N° de orden.
RE_NOTA = re.compile(r"^\d{1,2}[.,]\d{1,2}$")
RE_REGION = re.compile(r"^[A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ ]{2,}$")
RE_PAREN = re.compile(r"^\([A-ZÁÉÍÓÚÑÜ ]+\)$")

# Valores que puede traer la columna NOTA en lugar de una calificación.
ESTADOS = {
    "no se presento y/o no rindio evaluacion": "no_se_presento",
    "ficha optica invalida": "ficha_invalida",
    "-": "sin_nota",
}


def es_estado(txt):
    """¿El texto es un valor de estado en vez de una nota?"""
    return norm(txt) in ESTADOS


def norm(s):
    s = str(s or "").lower()
    s = "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    s = re.sub(r"[_\-]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def norm_prof(s):
    return norm(s).upper()


PROFS_KEYS = {norm_prof(p): p for p in PROFS}


def tokens(nombre):
    """Conjunto de palabras significativas del nombre (para comparaciones tolerantes)."""
    return frozenset(t for t in norm(nombre).split() if t)


def parse_pdf(path, devolver_lineas=False):
    """Lee el PDF y devuelve (registros, filas_leídas[, líneas])."""
    import pymupdf

    doc = pymupdf.open(path)
    lineas = []
    for pno in range(doc.page_count):
        lineas.extend(doc[pno].get_text("text").splitlines())
    doc.close()
    lineas = [re.sub(r"\s+", " ", ln).strip() for ln in lineas]

    regs = defaultdict(list)
    i, leidas, estados = 0, 0, defaultdict(int)
    while i < len(lineas) - 4:
        if not (RE_IDX.match(lineas[i]) or lineas[i] == "-"):
            i += 1
            continue
        # 1) ancla: la profesión (1 o 2 líneas) dentro de las 4 siguientes
        ancla = None
        for ini in range(1, 5):
            for fin in range(ini + 1, min(ini + 4, 8)):
                cand = PROFS_KEYS.get(norm_prof(" ".join(lineas[i + ini:i + fin])))
                if cand:
                    ancla = (ini, fin, cand)
                    break
            if ancla:
                break
        if not ancla:
            i += 1
            continue
        ini, fin, prof = ancla
        nombre = " ".join(lineas[i + 1:i + ini]).strip()
        if not nombre:
            i += 1
            continue
        # 2) región (1 o 2 líneas: 'LIMA REGION' + '(HUACHO)'), sin colarse los estados
        j, partes = i + fin, []
        while (j < len(lineas) and len(partes) < 3
               and (RE_REGION.match(lineas[j]) or RE_PAREN.match(lineas[j]))
               and not RE_NOTA.match(lineas[j]) and not es_estado(lineas[j])):
            partes.append(lineas[j])
            j += 1
        if not partes:
            i += 1
            continue
        region = " ".join(partes)
        # 3) nota o estado
        nota, estado = None, ""
        if j < len(lineas) and RE_NOTA.match(lineas[j]):
            nota = float(lineas[j].replace(",", "."))
        elif j < len(lineas) and es_estado(lineas[j]):
            estado = lineas[j]
        if nota is None and not estado:
            i += 1
            continue
        regs[(norm(nombre), norm(prof))].append((region, nota, estado))
        estados[estado or "·con nota"] += 1
        leidas += 1
        i = j + 1

    if devolver_lineas:
        return regs, leidas, lineas
    return regs, leidas
