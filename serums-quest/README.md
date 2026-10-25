# SERUMS QUEST

Aplicación estática de aprendizaje gamificado integrada como quinta tarjeta del **SERUMS HUB**. Reutiliza por referencia el banco oficial de Psicología de **Examen Studio** y el temario de **Study Dashboard**, sin copiar ni modificar esos datos.

- **Build:** `ZARCONT-SQ-1.0.0`
- **Esquema de datos:** `1`
- **Mapa de contenido:** `1.0.2`
- **Contenido fuente:** banco `1.0.0` (3 exámenes de Psicología, 300 preguntas) y temario Study `2.5.0`.

## Abrir

Desde el HUB:

1. Abre `index.html` en la raíz del repositorio.
2. Selecciona la quinta tarjeta **SERUMS QUEST** o pulsa `5`.
3. Pulsa **Abrir**.

También puedes abrir directamente `serums-quest/index.html`. La aplicación funciona sin compilación y sin backend.

Para servir el repositorio completo por HTTP (recomendado para pruebas y para que los PDFs y enlaces relativos se comporten igual que en el HUB):

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Abre `http://127.0.0.1:8765/index.html`.

## Funcionalidades implementadas

- Inicio con desafío recomendado, nivel, rango, racha, progreso por área y accesos a modos.
- Mapa de misiones con cinco rutas de área, nodos bloqueados/desbloqueados, jefes finales y requisitos visibles.
- Detalle de misión con reglas, recompensas, requisitos, trazabilidad y advertencia de contenido sin explicación editorial.
- Juego con feedback inmediato o diferido, teclado `A–D`/`1–4`, cronómetro, vidas, progreso y guardado tras cada respuesta.
- Resultados calculados solo con respuestas registradas: aciertos, errores, omisiones, precisión, cobertura, XP, monedas, logros, nivel, rango, etapa y fichas recomendadas.
- Recuperación de errores con repaso espaciado, historial y enlace real a la ficha de Study Dashboard.
- Perfil con XP, nivel, rango, precisión por área, dominio, racha, sesiones y logros.
- Logros verificables con progreso real y recompensa única.
- Registro local de sesiones superadas; sin usuarios simulados ni clasificación mundial.
- Ajustes: nombre, tema, reducción de movimiento, feedback, exportación/importación, reinicio con archivo de respaldo, verificación de contenido y diagnóstico.
- Migración de esquema, diario de escritura, respaldo y recuperación de estado dañado.

## Modos

| Modo | Regla principal | Recompensa de finalización |
| --- | --- | --- |
| Misiones | 5–6 preguntas, feedback inmediato, avance por área | 30 XP + 8 monedas, una vez por misión |
| Supervivencia | 10 preguntas, 3 oportunidades, 45 s por pregunta | 40 XP + 10 monedas, una vez al día |
| Contrarreloj | 3/5/8 min, 8/12/18 preguntas, precisión sobre total | 25 XP + 6 monedas si se supera |
| Recuperación | Errores programados, repaso espaciado | 30 XP + 5 monedas, una vez al día |
| Jefes finales | 8 preguntas, 90 s por pregunta, feedback diferido | 80 XP + 25 monedas, una vez por jefe |
| Desafío diario | 6 preguntas: repaso, exigencia y recuperación | 40 XP + 10 monedas, una vez al día |
| Simulacro | 20 preguntas, 15 min, etapa Dominio | 70 XP + 20 monedas, una vez al día |

Las misiones, el diario y la recuperación exigen un mínimo de precisión para considerarse superados: 60 %, 60 % y 50 % respectivamente. Las respuestas ya registradas conservan su XP de pregunta aunque la sesión no se supere.

## Arquitectura

```
serums-quest/
  index.html                 Shell y carga de contenido compartido
  styles.css                 Sistema visual responsive
  js/config.js               Reglas centralizadas: XP, monedas, niveles, rangos, etapas, logros, modos
  js/util.js                 Fechas, hash determinista, escape, formato, descarga/lectura
  js/icons.js                Iconografía SVG local
  js/progression.js          Funciones puras de progresión, recompensas, etapas y logros
  js/store.js                Persistencia versionada, diario, respaldo, migraciones y bloqueo seguro
  js/content.js              Adaptador de BANCO_OFICIAL + STUDY_CONTENT + mapa de afinidad
  js/engine.js               Motor de sesiones, respuestas, recuperación y resultados
  js/app.js                  Router, pantallas, interacciones y accesibilidad
  data/quest-map.js          Mapa derivado de IDs → área/tema/ficha/confianza (sin copiar preguntas)
  tools/build_content_map.py Generador reproducible del mapa
  tests/tests.html           Suite ejecutable en navegador
  tests/tests.js             36 pruebas de reglas, persistencia, contenido y motor
  tests/responsive.html      Comprobación real de viewports 390/768/1280
  docs/                      Reglas, integración de contenido e informe QA
```

### Contrato de datos

`BANCO_OFICIAL` (global de Examen Studio) se consume sin modificarlo. Cada pregunta conserva:

- `id`, `examId`, `n`, `p` (página), `s` (enunciado), `o` (alternativas), `c` (clave), `st` (estado).
- URL al PDF original y página.
- `areaId`, `topicId`, `sheetId` y `confidence` desde `quest-map.js`.

`STUDY_CONTENT` (global de Study) se consume sin modificarlo. Las fichas se abren mediante
`../study-dashboard/index.html?sheet=<id>&from=quest`; abrir una ficha **no** marca dominio.

### Persistencia

- Estado principal: `serumsquest:state:v1`.
- Respaldo: `serumsquest:backup:v1`.
- Diario de escritura: `serumsquest:journal:v1`.
- Snapshot para el HUB: `serumsquest:snapshot:v1`.
- Archivos de recuperación/importación/reinicio: `serumsquest:archive:*`.
- Tema previo al arranque: `serumsquest:theme`.

No se leen ni escriben las claves de Study, Examen Studio o Plazas. El estado se escribe como un único documento con diario y respaldo. Si el documento está dañado y no hay respaldo, la app bloquea la escritura, archiva el contenido y muestra una pantalla de recuperación; nunca lo sobrescribe en silencio.

## Contenido

- 300 preguntas de Psicología con clave validada (3 exámenes).
- 232 preguntas puntuables con afinidad alta o media.
- 40 de afinidad baja y 28 sin área asignada: se conservan en el mapa, pero **no** entran en misiones ni modos puntuables.
- 13 misiones y 5 jefes.
- 10 correcciones editoriales explícitas en `MANUAL_OVERRIDES` del generador.
- El mapa no contiene enunciados, alternativas ni claves; solo IDs y metadatos derivados.

La afinidad es una capa editorial determinista, **no** una clasificación oficial del examen ni una nota académica. Los detalles están en `docs/CONTENT-INTEGRATION.md`.

## Pruebas

Abre `serums-quest/tests/tests.html` por HTTP. La suite muestra el resultado y expone `window.__QUEST_TESTS__`.

```powershell
python -m http.server 8765 --bind 127.0.0.1
# http://127.0.0.1:8765/serums-quest/tests/tests.html
```

Cobertura actual: 36 pruebas, incluyendo XP, niveles, rangos, etapas, anti-repetición, ledger, misiones al 0 %, recuperación, temporizador, persistencia, migración, estado dañado, esquema futuro, importación saneada, contenido y launcher.

Comprobación responsive: `serums-quest/tests/responsive.html`.

## Limitaciones conocidas

- La clasificación es local y de un solo perfil; no hay cuentas ni clasificación mundial.
- El registro competitivo solo incluye sesiones superadas con al menos 3 respuestas.
- El banco no contiene explicaciones editoriales por pregunta; la app muestra la clave y enlaza el PDF y una ficha de apoyo. No inventa explicaciones.
- La afinidad temática puede equivocarse en casos ambiguos; se marca como afinidad y las preguntas de baja confianza quedan fuera de la puntuación.
- Las fuentes tipográficas se cargan desde Google Fonts (CDN). No hay backend ni telemetría.
- La app está pensada para una pestaña activa. El almacén detecta cambios externos y bloquea escrituras sobre estados dañados, pero no implementa colaboración multiusuario.
- Abrir con `file://` puede tener límites de almacenamiento distintos según el navegador. Para probar la persistencia compartida con Study y Examen Studio, usa el servidor HTTP local.
- Los archivos de archivo/reinicio se conservan en localStorage; no hay una pantalla para restaurarlos automáticamente.

## Licencia

© 2026 ZARCONT. Licencia propietaria del repositorio. Los contenidos y PDFs de terceros conservan su procedencia y licencias originales.
