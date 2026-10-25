# Informe de QA — SERUMS QUEST

**Fecha:** 2026-10-25  
**Entorno:** navegador Chromium del entorno OpenCode, servidor local `python -m http.server 8765`, Windows.  
**Build:** `ZARCONT-SQ-1.0.0` · mapa `1.0.2` · esquema `1`.

## 1. Resultado ejecutivo

- **36/36 pruebas automatizadas superadas** (`serums-quest/tests/tests.html`, ejecutadas en navegador).
- **Lighthouse:** Accesibilidad **1.00**, Best Practices **1.00**, SEO **1.00**, sin fallos.
- **Responsive:** comprobado en viewports reales de **390, 768 y 1280 px** con `tests/responsive.html`; sin desbordamiento horizontal.
- **Integración:** quinta tarjeta del HUB, apertura con tecla `5`, snapshot de nivel/XP, enlace real a Study Dashboard.
- **Persistencia:** recuperación de sesión tras recargar, migración de esquema, respaldo, bloqueo y recuperación de estado dañado.
- **Contenido:** 300 preguntas válidas de Psicología; 232 puntuables; 13 misiones; 5 jefes; 0 referencias de tema/ficha inválidas.

## 2. Pruebas automatizadas

Archivo: `serums-quest/tests/tests.js` (36 pruebas). Resultado de la última ejecución:

```
36 superadas · 0 fallidas
```

Cobertura:

| Área | Pruebas |
| --- | --- |
| Curva de nivel, rangos, etapas y dominio espaciado | 7 |
| XP, anti-repetición, ledger y finalización única | 4 |
| Persistencia, migración, transacciones, import/export y estado dañado | 7 |
| Contenido, misiones, referencias y exclusión de claves inválidas | 5 |
| Desafío diario, misión 0 %, recuperación, temporizador, contrarreloj | 7 |
| Resultados, respuestas registradas, feedback y nivel máximo | 4 |
| Launcher, viewport y CSS responsive | 2 |

Entre las comprobaciones concretas:

- Una respuesta correcta no cambia la etapa; 12 respuestas con 55 % sí.
- Un error aislado no baja la etapa; 12 respuestas recientes bajo 40 % sí.
- La repetición dentro de 6 h no da XP; la pregunta dominada exige 7 días.
- El dominio no sube por repetir de inmediato.
- Repetir una misión no duplica la finalización.
- El ledger conserva recompensas permanentes al podar respuestas.
- Una misión con 0 % no se marca superada ni desbloquea la siguiente.
- Una respuesta después del tiempo por pregunta se rechaza.
- Un estado corrupto se bloquea, se archiva y se recupera sin sobrescritura silenciosa.
- Un esquema futuro no se sobrescribe.
- La importación elimina etiquetas peligrosas de los campos de estado.
- Las preguntas sin clave verificable quedan fuera del índice.

## 3. Integración con el HUB

Comprobado manualmente en `http://127.0.0.1:8765/index.html`:

- 5 tarjetas en el carrusel; la quinta es SERUMS QUEST.
- Indicador `1 / 5` y badge `05 / 05`.
- Atajo `5` abre la aplicación.
- La tarjeta lee `serumsquest:snapshot:v1` y muestra nivel, rango, XP y última sesión.
- La tarjeta sin actividad muestra `Nv 1` y “Sin actividad registrada todavía”.
- El dock, los puntos y la barra inferior incluyen la quinta aplicación.
- El modal de atajos muestra `1–5`.
- “Acerca de” y versión del HUB actualizados a `2.3.0`.

## 4. Integración con Study Dashboard

- Se abrió una ficha desde el feedback de una pregunta fallada.
- URL real: `../study-dashboard/index.html?sheet=sheet-psi-sp-1-1&from=quest`.
- Study Dashboard abrió la ficha correcta y el título correspondiente.
- SERUMS QUEST registró `studyOpenedAt` y `studySheetId` en el error.
- Abrir la ficha no marcó dominio; la recuperación solo se registra al responder correctamente después.

## 5. Persistencia

- Sesión de Supervivencia recargada: se recuperaron cursor, vidas, respuestas y omisiones.
- Migración `schemaVersion 0 → 1`: conservó XP, monedas y perfil, y creó respaldo.
- Estado dañado sin respaldo: la app mostró pantalla de recuperación, mantuvo el texto corrupto y ofreció archivarlo; no lo sobrescribió.
- Estado dañado con respaldo: recuperó el respaldo, archivó el estado corrupto y avisó mediante toast.
- Reinicio: archivó el estado anterior y creó un perfil limpio.
- Exportación/importación: conserva XP y monedas; la importación valida la forma y sanea cadenas.

## 6. Contenido

| Comprobación | Resultado |
| --- | ---: |
| Preguntas de Psicología | 300 |
| Claves válidas dentro de alternativas | 300 |
| Preguntas inválidas | 0 |
| Afinidad alta | 164 |
| Afinidad media | 68 |
| Puntuables | 232 |
| Afinidad baja (excluida de modos puntuables) | 40 |
| Sin área asignada (excluida) | 28 |
| Misiones | 13 |
| Jefes | 5 |
| Correcciones editoriales explícitas | 10 |
| Referencias de tema/ficha inválidas | 0 |
| PDFs faltantes | 0 |

## 7. Responsive y accesibilidad

- `tests/responsive.html` con iframe real:
  - 390 px: una columna, nav con scroll horizontal, appbar con wrap, sin desbordamiento.
  - 768 px: una columna de contenido, nav con scroll, sin desbordamiento.
  - 1280 px: dos columnas, nav visible, sin desbordamiento.
- Lighthouse de la app: Accesibilidad 1.00.
- Foco visible, skip link, diálogos nativos, `aria-current`, `aria-pressed`, `aria-label`, `role="status"` en feedback, progreso con `role="progressbar"`.
- El feedback diferido y el feedback inmediato se anuncian; las preguntas largas se pueden leer completas en la revisión de resultados.
- Reducción de movimiento respetada por CSS y por preferencia de la app.

## 8. Problemas pendientes y límites

### Terminado

- Las diez pantallas obligatorias.
- Las seis modalidades (misiones, supervivencia, contrarreloj, recuperación, jefes y diario) y simulacro.
- Progresión, anti-farm, ledger, rangos, etapas, logros y monedas.
- Integración real con banco, Study Dashboard y HUB.
- Persistencia versionada, migración, respaldo y recuperación de estado dañado.
- Suite de 36 pruebas y comprobación responsive.

### Parcial / con límites documentados

- **Afinidad temática:** es heurística y editorial. Se corrigieron 10 casos evidentes; pueden existir ambigüedades. Las preguntas de baja confianza no puntúan.
- **Clasificación local:** solo hay un perfil por navegador. No se simula una clasificación mundial.
- **Explicaciones:** el banco no las incluye; se muestra la clave, el PDF y una ficha de apoyo, sin inventar texto.
- **Archivos de archivo/reinicio:** se guardan en localStorage, pero no hay pantalla para restaurarlos automáticamente.
- **Concurrencia:** el almacén detecta cambios externos y bloquea estados dañados, pero no está diseñado para dos pestañas jugando a la vez.

### Pendiente / fuera de alcance

- Cuentas remotas, sincronización multiusuario y clasificación mundial.
- Revisión humana exhaustiva de las 300 preguntas.
- Restauración de archivos históricos desde la interfaz.
- Motor de audio o animaciones 3D (no se consideraron necesarios).

## 9. Cómo reproducir

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

- App: `http://127.0.0.1:8765/serums-quest/index.html`
- Pruebas: `http://127.0.0.1:8765/serums-quest/tests/tests.html`
- Responsive: `http://127.0.0.1:8765/serums-quest/tests/responsive.html`
- HUB: `http://127.0.0.1:8765/index.html`

Los resultados de la suite se exponen en `window.__QUEST_TESTS__`.
