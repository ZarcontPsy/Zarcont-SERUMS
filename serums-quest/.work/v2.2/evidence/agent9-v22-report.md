# SERUMS QUEST · V2.2 · QA Agente 9

- Casos: 17 · PASS 17 · FAIL 0
- Incidencias: 0

| Caso | Resultado | Detalle |
| --- | --- | --- |
| T01 · Tienda: cuadrícula de 33 originales, miniaturas y visor 3D | **PASS** | {"cards":33,"thumbs":33,"canvas":true,"detail":"Diadema de circuitos","ids":["c-cabeza-diadema","c-cabeza-casco","c-cabeza-gorro"]} |
| T02 · Tienda: selección incremental sin rehacer pantalla ni perder scroll | **PASS** | {"before":{"render":1,"scroll":90},"after":{"marker":"1","render":1,"scroll":90,"selected":true,"detail":"Casco de vigía","canvas":true}} |
| T03 · Inventario: tarjetas, miniaturas y visor 3D | **PASS** | {"cards":15,"thumbs":15,"canvas":true,"canvasW":374,"canvasH":383,"title":"Previsualiza antes de equipar."} |
| T04 · Inventario: probar pieza sin rehacer pantalla y con visor vivo | **PASS** | {"before":2,"after":{"marker":"1","render":2,"canvas":true,"detail":"Diadema de circuitos"}} |
| T13 · Versión V2.2 visible en la interfaz | **PASS** | {"body":true,"title":"SERUMS QUEST","gameVersion":"V2.2 · Tienda 3D e interfaz"} |
| T14 · Menús: sin desbordes horizontales en 6 pantallas × 5 tamaños | **PASS** | [] |
| T15 · Cambio de cosmético: sin frames vacíos en el visor | **PASS** | {"frames":56,"min":24654,"max":69866,"blanks":0,"detail":"Tocado de maestría · Gestión de servicios"} |
| T05 · Duelo: panel dentro del alto y 4 alternativas en la matriz | **PASS** | [{"size":"1308x662","ok":true,"panel":{"t":415,"b":644,"h":229,"w":472},"visible":4,"scroll":false},{"size":"480x320","ok":true,"panel":{"t":58,"b":287,"h":229,"w":272},"visible":4,"scroll":false},{"size":"640x360","ok":true,"panel":{"t":11 |
| T06 · Resumen: cabecera/pie visibles y lista con scroll propio | **PASS** | {"vw":1308,"vh":662,"card":{"t":0,"b":662,"h":662},"head":{"t":2,"b":89},"foot":{"t":606,"b":661},"title":"El guardián aún guarda este tramo.","buttons":2,"list":{"h":239,"sh":1121,"scroll":true},"scrollbar":"color(srgb 0.331961 0.439412 0. |
| T07 · Atrio: 5 etiquetas de área con desvanecimiento | **PASS** | [{"area":"area-psi-salud-publica","label":true,"opacity":0.82,"scale":2.2210641840645393},{"area":"area-psi-cuidado-integral","label":true,"opacity":0.82,"scale":2.24021023444802},{"area":"area-psi-etica","label":true,"opacity":0.82,"scale" |
| T11 · 61 cosméticos 3D: geometría propia por pieza (8 títulos son texto) | **PASS** | {"total":69,"nonTitle":61,"uniqueGeom":61,"duplicates":[]} |
| T12 · 69 cosméticos acoplados a los 10 héroes (690 montajes) | **PASS** | {"cases":690,"failures":[],"count":0,"heroes":10} |
| T08 · Aviso de guardado: cierre, auto-ocultado e indicador | **PASS** | {"notice1":{"banner":true,"close":true,"indicator":true},"notice2":{"banner":false,"indicator":true}} |
| T09 · Compra: confirmación, descuento y pieza en la colección | **PASS** | {"owns":true,"coins":4910} |
| T10 · FPS en atrio | **PASS** | {"min":75,"avg":75,"samples":16} |
| T17 · FPS en duelo | **PASS** | {"min":75,"avg":75,"samples":16} |
| T16 · Export HTML por file://: arranca, sin red y sin errores | **PASS** | {"booted":true,"screen":"title","title":"SERUMS QUEST","game":false,"hasV22":true,"errorsAdded":0,"nonLocal":0} |

## FPS

{
  "hub": {
    "min": 75,
    "avg": 75,
    "below45": 0
  },
  "duel": {
    "min": 75,
    "avg": 75,
    "below45": 0
  }
}

## Capturas

- `agent7-v21-v22-tienda-1280x720.png`
- `agent7-v21-v22-inventario-1280x720.png`
- `agent7-v21-v22-duelo-1308x662.png`
- `agent7-v21-v22-duelo-480x320.png`
- `agent7-v21-v22-duelo-844x390.png`
- `agent7-v21-v22-resumen-1308x662.png`
- `agent7-v21-v22-resumen-390x844.png`
- `agent7-v21-v22-atrio-1280x720.png`
- `agent7-v21-v22-export-file.png`