# NOTICE.md — Componentes de terceros y datos

© 2026 ZARCONT (proyecto `LAUNCHER SERUMS`). Este documento acredita los componentes de
terceros utilizados y sus licencias. **No se reclama autoría sobre los componentes
listados aquí**; sus titulares conservan todos los derechos.

## Bibliotecas y fuentes (cargadas por CDN)

| Componente | Uso en el proyecto | Licencia / condiciones |
|---|---|---|
| pdf.js 3.11.174 (cdnjs) | Lectura de PDFs en Examen Studio | Apache License 2.0 |
| SheetJS Community Edition 0.20.3 (cdn.sheetjs.com) | Importar/exportar Excel en el mapa | Apache License 2.0 |
| @googlemaps/markerclusterer (unpkg) | Agrupación de marcadores | Apache License 2.0 |
| Google Maps Platform (Maps JavaScript API / Geocoding API) | Mapa base y geocodificación | Servicio de Google sujeto a sus Términos de Servicio; requiere clave propia |
| Google Fonts: Inter, Sora, Zen Dots, Michroma, Open Sans | Tipografías de las interfaces | SIL Open Font License 1.1 |
| MOKOTO (Drizy Studio) | Tipografía de títulos **referenciada** | Fuente comercial (gratuita solo para uso personal); **no se distribuye** con el proyecto (ver `fonts/README.txt`) |

## Dependencias de desarrollo (no incluidas en la distribución estática)

React, Vite, TypeScript, Tailwind CSS, Recharts y el resto de dependencias declaradas en
`package.json` (MIT / Apache-2.0) se usan solo como base de desarrollo: la aplicación
funciona sin compilación, abriendo `index.html`.

## Utilidades de prueba (Python)

Los scripts de `tests/` pueden usar utilidades de terceros (p. ej. `pyjsparser`, MIT)
únicamente durante las pruebas; no forman parte del producto distribuido.

## Datos

Los conjuntos de plazas y adjudicaciones derivan de documentos y listados públicos
oficiales de MINSA (oferta de plazas remuneradas SERUMS 2026-I, listado RENIPRESS,
listado de adjudicados y resultados finales). Se muestran tal como figuran en las
fuentes: no se estiman ni inventan valores. El proyecto no reclama exclusividad sobre
esos datos.

## Notas operativas

- La aplicación del mapa incluye una **clave de demostración de Google Maps** con cuota
  limitada, documentada por el propio proyecto. Recomendación: sustituirla por una clave
  propia restringida por referrer y por API; no usarla en producción.
- Los avisos de autoría del proyecto (`© 2026 ZARCONT` en encabezados de código,
  metadatos e interfaces) deben conservarse en cualquier copia autorizada.
