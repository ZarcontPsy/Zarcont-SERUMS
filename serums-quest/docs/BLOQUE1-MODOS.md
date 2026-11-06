# Bloque 1 · modos

**Versión de Game Studio:** 54 · `Bloque 1 · modos`  
**Build:** `5e712df7d082`  
**HTML exportado:** `export/serums-quest-bloque1.html`  
**Tamaño:** 1.461.526 bytes (≈ 1,39 MiB)  
**Banco:** 111 preguntas de la campaña, con clave y opciones incrustadas.  
**Muestra de claves cotejada:** 30/30 contra `banco-oficial.js` 1.0.0.

## Reglas aplicadas

| Modo | Regla | Cierre |
| --- | --- | --- |
| Diario | 6 preguntas mezcladas; una vez al día; 60 % de aciertos | 40 XP + 10 monedas, una vez al día |
| Supervivencia | 10 preguntas, 3 oportunidades, 45 s por pregunta, dificultad creciente | 40 XP + 10 monedas si termina con vida; récord personal |
| Contrarreloj | 3/5/8 min y 8/12/18 preguntas; 70 % del total y mínimo 8 respuestas; clave al final | 25 XP + 6 monedas si supera |
| Simulacro | 20 preguntas, 15 min, etapa Dominio; sin pistas; informe por área e historial | 70 XP + 20 monedas si supera |

Las recompensas de cierre se registran una vez al día por modo. Nunca se restan monedas. Los errores pasan por `applyQuestionResult` y entran al repaso espaciado.

## Decisiones y diferencias que debes conocer

1. **Simulacro sin cuotas fijas por área.** La app original selecciona 20 preguntas de etapa Dominio y muestra el reparto por área, pero no impone 4/4/4/4/4. Conservé ese comportamiento. En la corrida de prueba el reparto fue 1/6/6/3/4. Si querías cuotas iguales por área, dímelo y lo cambio.
2. **Diario sin el marcador “clinical”.** El banco actual de 111 preguntas no conserva el campo clínico de la app antigua. Sustituí esa pieza por una pregunta de alta complejidad de Cuidado integral; el resto sigue el criterio de máxima complejidad, error pendiente y cobertura de áreas.
3. **Diario se cierra el mismo día aunque no se alcance el 60 %.** La app antigua consultaba la fecha de último diario superado; el requisito de este bloque era “una vez al día”. Mi implementación marca el día al terminar el intento, para que no pueda repetirse. Si prefieres permitir reintento tras fallar, es un cambio pequeño.
4. **Supervivencia en dificultad creciente explícita.** La selección usa la banda de etapa original; ordené las 10 preguntas por complejidad ascendente para que el crecimiento sea real. La original las barajaba dentro de la banda.
5. **Contrarreloj con tiempo extra accesible.** Añadí en Ajustes “+25 % de tiempo” (3 min → 3:45; 5 → 6:15; 8 → 10:00). No cambia preguntas, aprobación ni recompensas.
6. **Banco completo del juego.** Incrustadas las 111 preguntas que usa esta campaña. El archivo oficial general contiene 5.100 preguntas de todas las carreras; no incrusté las carreras ajenas porque no forman parte de SERUMS QUEST y multiplicarían el HTML. Si querías ese banco completo, dímelo antes de cambiarlo.
7. **Los modos no completan misiones ni desbloquean jefes.** Sí pueden subir XP/nivel y actualizar el dominio, como en la app original; no escriben `state.missions`.
8. **Logros.** Añadí cuatro logros de modo (`Pulso diario`, `Sin red`, `Cabeza fría`, `Ensayo general`). También activé las métricas que hacían utilizables los logros originales de Supervivencia y Contrarreloj.
9. **QA temporal.** Este checkpoint todavía incluye hooks de QA (`devOpenModes`, `devStartMode`, `devStage4`, `devMistake`) para poder capturar y probar. Se retiran en el Bloque 3; no estarán activos en la entrega final.

## Verificación

- Menú de modos con héroe y cosméticos equipados.
- Los cuatro modos: inicio, juego y resultado.
- Diario: `modeStats.dailyDate = 2026-11-06`; botón deshabilitado “Vuelve mañana”; claim `daily:2026-11-06` con 40 XP + 10 monedas.
- Diario con un fallo: 5/6, error programado para repaso; cierre correcto.
- Contrarreloj con tiempo extra: temporizador `3:45` para la sesión de 3 minutos.
- Simulacro: 20/20, informe por área, historial “1 simulacro guardado”.
- Campaña de regresión: victoria de misión, sin errores de consola.
- Claves: 30/30; banco 111.
- HTML: 1.461.526 bytes.
- **FPS de los modos:** mínimo 72, media ≈ 75.
  - Diario 73/75 · Supervivencia 72/75 · Contrarreloj 73/75 · Simulacro 74/75 · Menú 74/75.
  - Campaña de regresión: mínimo 63, media 74.

## Evidencia

- [Menú de modos](bloque1-modos-menu.jpg)
- [Diario bloqueado](bloque1-diario-bloqueado.png)
- [Diario inicio](bloque1-diario-inicio.jpg) · [Diario en juego](bloque1-diario-juego.png) · [Diario resultado](bloque1-diario-resultado.jpg) · [Diario con fallo](bloque1-diario-error.jpg)
- [Supervivencia inicio](bloque1-supervivencia-inicio.jpg) · [Supervivencia en juego](bloque1-supervivencia-juego.jpg) · [Supervivencia resultado](bloque1-supervivencia-resultado.jpg)
- [Contrarreloj inicio](bloque1-contrarreloj-inicio.jpg) · [Contrarreloj en juego](bloque1-contrarreloj-juego.jpg) · [Contrarreloj resultado](bloque1-contrarreloj-resultado.jpg)
- [Simulacro inicio](bloque1-simulacro-inicio.jpg) · [Simulacro en juego](bloque1-simulacro-juego.jpg) · [Simulacro resultado](bloque1-simulacro-resultado.jpg)
- [Muestra de 30 claves](bloque1-claves-30.json)
