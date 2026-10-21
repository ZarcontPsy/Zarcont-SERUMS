from pathlib import Path
import json

sources = [
    {"id": "src-hepatitis-b", "title": "Norma Técnica de Salud N.° 146-MINSA/2018/DGIESP para la Prevención, Diagnóstico y Tratamiento de la Hepatitis Viral B en el Perú", "short": "Hepatitis B", "authors": "Ministerio de Salud del Perú", "kind": "Norma técnica", "provenance": "Norma técnica del Ministerio de Salud del Perú (NTS N.° 146-MINSA/2018/DGIESP).", "file": "../study-data/fuentes/nt-prevencion-hepatitis-b.pdf"},
    {"id": "src-hepatitis-c", "title": "Norma Técnica de Salud N.° 145-MINSA/2018/DGIESP para la Prevención, Diagnóstico y Tratamiento de la Hepatitis Viral C en el Perú", "short": "Hepatitis C", "authors": "Ministerio de Salud del Perú", "kind": "Norma técnica", "provenance": "Norma técnica del Ministerio de Salud del Perú (NTS N.° 145-MINSA/2018/DGIESP).", "file": "../study-data/fuentes/nt-prevencion-hepatitis-c.pdf"},
]
areas = [{"id": "area-hepatitis", "title": "Hepatitis virales", "short": "Hepatitis", "description": "Prevención, diagnóstico, tratamiento y seguimiento de la hepatitis B y C.", "accent": "#B6C77A", "icon": "drop", "sourceIds": ["src-hepatitis-b", "src-hepatitis-c"]}]
topics = [
    {"id": "topic-hepatitis-b", "title": "Hepatitis B", "areaId": "area-hepatitis", "summary": "Transmisión, vacunación, diagnóstico, tratamiento y seguimiento de la infección crónica.", "keywords": ["HBsAg", "vacuna", "tenofovir", "cirrosis", "HBeAg"], "sourceIds": ["src-hepatitis-b"]},
    {"id": "topic-hepatitis-c", "title": "Hepatitis C", "areaId": "area-hepatitis", "summary": "Tamizaje, confirmación con ARN, fibrosis, antivirales pangenotípicos y curación.", "keywords": ["Anti-VHC", "ARN", "APRI", "sofosbuvir", "RVS"], "sourceIds": ["src-hepatitis-c"]},
]

def sec(title, body=None, bullets=None, table=None, callout=None, depth="core"):
    x = {"title": title}
    if body: x["body"] = body if isinstance(body, list) else [body]
    if bullets: x["bullets"] = bullets
    if table: x["table"] = {"headers": table[0], "rows": table[1]}
    if callout: x["callout"] = callout
    x["depth"] = depth
    return x

def S(id, title, kicker, minutes, level, summary, key, secs, refs, area, topic):
    return {"id": id, "title": title, "kicker": kicker, "minutes": minutes, "level": level, "summary": summary, "keyConcepts": key, "sections": secs, "sourceRefs": [{"sourceId": s, "pages": p} for s, p in refs], "areaId": area, "topicId": topic}

def C(id, topic, sheet, typ, prompt, answer=None, options=None, correct=None, explanation="", tags=None, refs=None):
    x = {"id": id, "topicId": topic, "sheetId": sheet, "type": typ, "prompt": prompt}
    if answer is not None: x["answer"] = answer
    if options is not None: x["options"] = options
    if correct is not None: x["correctIndex"] = correct
    x["explanation"] = explanation
    x["sourceRefs"] = [{"sourceId": s, "pages": p} for s, p in (refs or [])]
    x["tags"] = tags or []
    return x

sheets, cards = [], []

# HEP B 01
sid, tid = "sheet-hepatitis-01", "topic-hepatitis-b"
sheets.append(S(sid, "Prevenir y detectar la hepatitis B", "Hepatitis B · Prevención", 8, "Base",
    "La hepatitis B se previene con vacunación y se detecta con HBsAg. La infección crónica se define por la persistencia del antígeno de superficie por más de seis meses.",
    ["El HBsAg positivo por más de 6 meses define infección crónica.",
     "La primera dosis de vacuna se aplica al recién nacido dentro de las primeras 12 horas.",
     "Se tamiza a gestantes, contactos, donantes y personas con factores de riesgo.",
     "La atención es gratuita y cubierta por el PEAS."],
    [sec("Transmisión y prevención", ["El virus se transmite por sangre, semen, secreciones vaginales y de madre a hijo durante el parto. La vacunación, los preservativos, la seguridad de las inyecciones y el tamizaje de donantes reducen la transmisión.",
        "El esquema completo tiene tres dosis y no se reinicia si hay retraso."],
        bullets=["Vacunar al recién nacido dentro de las 12 horas.", "Completar las tres dosis.", "Tamizar a gestantes y ofrecer prevención de transmisión maternoinfantil.", "Tamizar a contactos y personas con factores de riesgo.", "Evitar compartir agujas o material punzocortante."]),
     sec("Diagnóstico", ["El tamizaje inicial es HBsAg. Si es reactivo se solicita anti-HBc IgM, anti-HBc total, HBeAg, anti-HBe y ADN viral para definir fase y tratamiento.",
        "La infección aguda se confirma con anti-HBc IgM positivo; la crónica, con HBsAg persistente por más de seis meses."]),
     sec("Quién debe evaluarse", bullets=["Gestantes y sus parejas.", "Donantes de sangre, órganos y tejidos.", "Personas con VIH, hepatitis C, tuberculosis o enfermedad renal crónica.", "Contactos domiciliarios y sexuales.", "Personas con transfusiones, hemodiálisis, drogas inyectables o privación de libertad."],
        callout={"title": "Prevenir es tratar", "text": "La vacuna y la primera dosis del recién nacido son las intervenciones con mayor impacto para evitar la transmisión vertical.", "tone": "info"})],
    [("src-hepatitis-b", [15, 16, 17, 18, 21, 37])], "area-hepatitis", tid))
cards += [
    C("card-hepatitis-01-1", tid, sid, "concept", "¿Cómo se define la infección crónica por hepatitis B?", "Por HBsAg persistente por más de seis meses, o por anti-HBc IgM negativo + HBsAg positivo + anti-HBc total positivo.", "La persistencia del HBsAg distingue la infección crónica de la aguda.", ["Hepatitis B", "HBsAg"], [("src-hepatitis-b", [15])]),
    C("card-hepatitis-01-2", tid, sid, "multiple", "¿Cuándo debe recibir el recién nacido la primera dosis de vacuna contra hepatitis B?", ["Antes de las 12 horas de vida.", "A los 2 meses.", "A los 6 meses.", "Solo si la madre es HBsAg positiva."], 0, "La primera dosis se aplica dentro de las primeras 12 horas; luego se completa el esquema de tres dosis.", ["Hepatitis B", "vacuna"], [("src-hepatitis-b", [37])]),
    C("card-hepatitis-01-3", tid, sid, "application", "Una gestante tiene HBsAg positivo. ¿Qué corresponde además de evaluar su carga viral?", ["No hacer nada hasta el parto.", "Coordinar la prevención de transmisión maternoinfantil y asegurar vacuna e inmunoglobulina al recién nacido según indicación.", "Suspender la lactancia.", "Vacunar solo a la madre."], 1, "La prevención incluye evaluar la carga viral, tratar si está indicado y asegurar vacuna e inmunoglobulina al recién nacido.", ["Hepatitis B", "gestante"], [("src-hepatitis-b", [37, 38])]),
]

# HEP B 02
sid, tid = "sheet-hepatitis-02", "topic-hepatitis-b"
sheets.append(S(sid, "Tratamiento y seguimiento de la hepatitis B crónica", "Hepatitis B · Tratamiento", 10, "Avanzado",
    "El tratamiento se indica según cirrosis, carga viral, ALT, HBeAg y edad. El tenofovir es de primera línea; el entecavir se prefiere cuando hay riesgo renal.",
    ["Toda persona con cirrosis y carga viral detectable debe tratarse.", "Sin cirrosis: carga viral >2000 UI/ml y ALT elevada o persistentemente anormal.", "También se trata a personas ≥30 años, HBeAg positivo, carga viral >2000 y ALT normal.", "El seguimiento incluye ALT, carga viral, HBeAg, fibrosis y vigilancia de hepatocarcinoma."],
    [sec("Cuándo iniciar tratamiento", table=[["Escenario", "Criterio"], [["Cirrosis", "Carga viral detectable; tratar siempre."], ["Sin cirrosis, ALT elevada", "Carga viral >2000 UI/ml y ALT ≥2 veces el límite superior o persistentemente anormal."], ["Sin cirrosis, ALT normal", "Edad ≥30 años, HBeAg positivo y carga viral >2000 UI/ml."], ["Riesgo especial", "Antecedente familiar de hepatocarcinoma o cirrosis, manifestaciones extrahepáticas, reactivación o inmunosupresión."]]]),
     sec("Esquemas y monitoreo", ["El tenofovir es el antiviral de primera línea. En riesgo renal o contraindicación se prefiere entecavir. El tratamiento es prolongado y no se suspende sin evaluación especializada.",
        "Se monitorizan ALT, carga viral, HBeAg, función renal y fibrosis. En cirrosis se vigila hepatocarcinoma cada seis meses."]),
     sec("Situaciones especiales", bullets=["Coinfección VIH: incluir TDF y 3TC o FTC.", "Coinfección VHC: evaluar interacciones y reactivación.", "Embarazo: evaluar carga viral y tratamiento para reducir transmisión vertical.", "Inmunosupresión: valorar profilaxis o tratamiento.", "No suspender bruscamente: puede causar reactivación."],
        callout={"title": "No basta con mirar la ALT", "text": "Una ALT normal no descarta enfermedad avanzada. La carga viral, el HBeAg, la edad y la fibrosis completan la decisión.", "tone": "warn"})],
    [("src-hepatitis-b", [23, 24, 31, 32, 33, 34, 35, 36])], "area-hepatitis", tid))
cards += [
    C("card-hepatitis-02-1", tid, sid, "concept", "¿Qué personas con hepatitis B crónica deben recibir tratamiento?", "Cirrosis con carga viral detectable; sin cirrosis, carga viral >2000 UI/ml y ALT elevada; y personas ≥30 años con HBeAg positivo, carga viral >2000 y ALT normal, entre otros criterios de riesgo.", "La decisión integra cirrosis, carga viral, ALT, HBeAg, edad y riesgo de hepatocarcinoma.", ["Hepatitis B", "tratamiento"], [("src-hepatitis-b", [31, 32])]),
    C("card-hepatitis-02-2", tid, sid, "multiple", "¿Cuál es el antiviral de primera línea para la hepatitis B crónica?", ["Entecavir.", "Tenofovir.", "Sofosbuvir.", "Aciclovir."], 1, "El tenofovir es de primera línea; el entecavir se prefiere cuando hay riesgo renal o contraindicación.", ["Hepatitis B", "tenofovir"], [("src-hepatitis-b", [32])]),
    C("card-hepatitis-02-3", tid, sid, "application", "Un paciente con cirrosis por hepatitis B tiene carga viral detectable y ALT normal. ¿Debe tratarse?", ["No, porque la ALT es normal.", "Sí, la cirrosis con carga viral detectable es criterio de tratamiento.", "Solo si tiene HBeAg positivo.", "Solo si presenta ascitis."], 1, "La cirrosis con replicación viral es indicación de tratamiento independientemente de la ALT.", ["Hepatitis B", "cirrosis"], [("src-hepatitis-b", [31])]),
]

# HEP C 01
sid, tid = "sheet-hepatitis-03", "topic-hepatitis-c"
sheets.append(S(sid, "Tamizaje y diagnóstico de la hepatitis C", "Hepatitis C · Diagnóstico", 9, "Avanzado",
    "El tamizaje es anti-VHC; el diagnóstico de infección activa requiere ARN detectable. La fibrosis se evalúa con APRI o elastografía.",
    ["Anti-VHC reactivo exige ARN del VHC.", "Anti-VHC positivo + ARN detectable = infección activa; ARN indetectable = resuelta o falso positivo.", "APRI >2 o elastografía >12 kPa sugieren cirrosis.", "Toda persona con infección confirmada debe acceder a tratamiento."],
    [sec("Del tamizaje al diagnóstico", ["Se tamiza a poblaciones de riesgo, donantes, personas con VIH o hepatitis B, hemodializados, usuarios de drogas, personas privadas de libertad y con antecedentes de transfusiones o procedimientos invasivos.",
        "Una prueba rápida o ELISA anti-VHC reactiva no confirma infección activa: se requiere ARN del VHC."],
        table=[["Anti-VHC", "ARN VHC", "Interpretación"], [["Positivo", "Detectable", "Infección por VHC."], ["Positivo", "Indetectable", "Hepatitis C resuelta o falso positivo."], ["Negativo", "No aplica", "Sin evidencia de infección; repetir si hay sospecha."]]]),
     sec("Evaluación de fibrosis", ["Se usan APRI y elastografía. APRI <0,5 sugiere ausencia de fibrosis significativa; 0,5–1,5 es dudosa; >1,5–2 significativa; >2 cirrosis. Elastografía <7 kPa ausencia; 7–9,4 moderada; 9,4–12 significativa; >12 cirrosis."]),
     sec("Antes de tratar", bullets=["Serología de VIH y hepatitis B.", "Hemograma, plaquetas, bilirrubinas, albúmina y función renal.", "Descarte de tuberculosis activa y embarazo.", "Evaluación de interacciones y alcohol.", "Consentimiento informado."],
        callout={"title": "No tratar sin confirmar", "text": "El anti-VHC positivo puede reflejar infección resuelta. La carga viral de ARN confirma la infección activa.", "tone": "info"})],
    [("src-hepatitis-c", [16, 17, 18, 19, 20])], "area-hepatitis", tid))
cards += [
    C("card-hepatitis-03-1", tid, sid, "concept", "¿Cómo se confirma una infección activa por hepatitis C?", "Con anti-VHC reactivo y ARN del VHC detectable. Si el ARN es indetectable, se considera infección resuelta o falso positivo.", "El anti-VHC es tamizaje; el ARN confirma replicación activa.", ["Hepatitis C", "diagnóstico"], [("src-hepatitis-c", [17])]),
    C("card-hepatitis-03-2", tid, sid, "multiple", "¿Qué prueba no invasiva se recomienda para evaluar fibrosis hepática?", ["Biopsia hepática de entrada.", "APRI o elastografía de transición.", "Radiografía de tórax.", "Solo ALT."], 1, "La norma recomienda APRI y elastografía como pruebas no invasivas para evaluar fibrosis.", ["Hepatitis C", "fibrosis"], [("src-hepatitis-c", [18, 19])]),
    C("card-hepatitis-03-3", tid, sid, "application", "Un paciente tiene anti-VHC positivo y ARN indetectable. ¿Qué significa?", ["Infección activa que requiere tratamiento inmediato.", "Infección resuelta o falso positivo; no hay replicación activa.", "Cirrosis descompensada.", "Debe iniciar sofosbuvir igualmente."], 1, "Anti-VHC positivo con ARN indetectable indica infección resuelta o falso positivo.", ["Hepatitis C", "ARN"], [("src-hepatitis-c", [17])]),
]

# HEP C 02
sid, tid = "sheet-hepatitis-04", "topic-hepatitis-c"
sheets.append(S(sid, "Tratamiento pangenotípico y curación", "Hepatitis C · Tratamiento", 10, "Avanzado",
    "El tratamiento es pangenotípico y cura en más del 90% de los casos. La cura se define por ARN indetectable 12 semanas después de terminar el tratamiento.",
    ["Primera elección: sofosbuvir/velpatasvir 400/100 mg, una tableta al día por 12 semanas.", "Alternativa: sofosbuvir/daclatasvir 400/60 mg por 12 semanas.", "En cirrosis compensada, sofosbuvir/velpatasvir se extiende a 24 semanas.", "En enfermedad renal crónica 4–5 se usa glecaprevir/pibrentasvir."],
    [sec("Esquemas", table=[["Situación", "Esquema"], [["Sin cirrosis o cirrosis compensada", "Sofosbuvir/velpatasvir 400/100 mg, 1 tableta/día por 12 semanas."], ["Alternativa", "Sofosbuvir/daclatasvir 400/60 mg, 1 tableta/día por 12 semanas."], ["Cirrosis compensada", "Sofosbuvir/velpatasvir por 24 semanas."], ["Enfermedad renal crónica 4–5", "Glecaprevir/pibrentasvir 100/40 mg, 3 tabletas/día por 8 semanas; 12 semanas si hay cirrosis."]]]),
     sec("Curación y seguimiento", ["La cura se define por ARN indetectable a las 12 semanas de finalizado el tratamiento. Se controla al inicio y a las 12 semanas postratamiento.",
        "El seguimiento clínico es mensual durante el tratamiento. En cirrosis se mantiene vigilancia de hepatocarcinoma cada seis meses."]),
     sec("Situaciones especiales", bullets=["Coinfección VIH/VHC: tratar la hepatitis C sin interrumpir el TAR.", "Coinfección VHB/VHC: riesgo de reactivación; monitorizar.", "Embarazo: evitar procedimientos invasivos en el tercer trimestre; el tipo de parto no modifica la transmisión; la lactancia no es fuente de infección.", "Niños de madres con VHC: anti-VHC a los 18 meses; si es positivo, confirmar con carga viral.", "Fracaso: reevaluar adherencia e interacciones; retratamiento con comité de expertos."],
        callout={"title": "Curación no es inmunidad", "text": "La curación no protege contra una nueva infección. Se mantienen prevención, tamizaje y seguimiento.", "tone": "info"})],
    [("src-hepatitis-c", [20, 21, 22, 23])], "area-hepatitis", tid))
cards += [
    C("card-hepatitis-04-1", tid, sid, "concept", "¿Cuál es el esquema pangenotípico de primera elección para hepatitis C?", "Sofosbuvir/velpatasvir 400/100 mg, una tableta al día por 12 semanas; en cirrosis compensada se extiende a 24 semanas.", "La alternativa es sofosbuvir/daclatasvir 400/60 mg por 12 semanas.", ["Hepatitis C", "sofosbuvir"], [("src-hepatitis-c", [20])]),
    C("card-hepatitis-04-2", tid, sid, "multiple", "¿Cómo se define la curación de la hepatitis C?", ["ARN indetectable al inicio del tratamiento.", "ARN indetectable 12 semanas después de terminar el tratamiento.", "ALT normal en cualquier momento.", "Ausencia de síntomas."], 1, "La cura se define por respuesta viral sostenida: ARN indetectable 12 semanas después de finalizar el tratamiento.", ["Hepatitis C", "curación"], [("src-hepatitis-c", [21])]),
    C("card-hepatitis-04-3", tid, sid, "application", "Una paciente con hepatitis C y enfermedad renal crónica grado 5 necesita tratamiento. ¿Qué esquema es de elección?", ["Sofosbuvir/velpatasvir.", "Glecaprevir/pibrentasvir, 3 tabletas al día por 8 semanas.", "Sofosbuvir/daclatasvir.", "Interferón."], 1, "En enfermedad renal crónica 4–5 se prefiere glecaprevir/pibrentasvir; la duración se ajusta a 12 semanas si hay cirrosis.", ["Hepatitis C", "renal"], [("src-hepatitis-c", [20, 21])]),
]

out = {"sources": sources, "areas": areas, "topics": topics, "sheets": sheets, "cards": cards}
Path("study-data/_add-04.json").write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("written", len(sheets), len(cards))
