# Reglas de SERUMS QUEST

Este documento describe las reglas implementadas en `js/config.js`, `js/progression.js` y `js/engine.js`. Los valores se leen de una configuración central; no se duplican en los componentes de interfaz.

## 1. XP

### XP por pregunta correcta

| Dificultad de la sesión | XP base |
| --- | ---: |
| Iniciación | 10 |
| Desarrollo | 20 |
| Especialización | 35 |
| Dominio (simulacro) | 50 |
| Jefe final | 20 / 35 / 50 según bloque |
| Repaso | 20 |

La XP de una pregunta se multiplica por el factor anti-repetición. Una respuesta incorrecta u omitida no resta XP.

### XP de finalización

| Resultado | XP |
| --- | ---: |
| Misión superada | 30 |
| Desafío diario superado | 40 |
| Jefe superado | 80 |
| Supervivencia completada | 40 |
| Contrarreloj superado | 25 |
| Recuperación superada | 30 |
| Simulacro superado | 70 |
| Bono semanal de racha | 60 |

## 2. Anti-acumulación

Cada pregunta conserva su historial. Al responder correctamente:

| Situación | Multiplicador de XP |
| --- | ---: |
| Primera respuesta correcta | 1.00 |
| Acierto tras un fallo | 0.70 |
| Repetición dentro de las primeras 6 h | 0.00 |
| Repetición entre 6 y 24 h | 0.25 |
| Repetición después de 24 h | 0.40 |
| Pregunta dominada, antes de 7 días | 0.00 |
| Pregunta dominada, después de 7 días | 0.10 |

- La moneda por acierto se otorga **una sola vez por pregunta** (`firstCorrectAt`).
- El ledger de recompensas usa claves idempotentes: `answer:<sesión>:<pregunta>`, `mission:<id>:completion`, `daily:<fecha>:completion`, etc.
- Las recompensas permanentes no se eliminan al podar las claves de respuestas antiguas.
- Las recompensas de finalización de misión/jefe/diario se comprueban también contra el registro de la misión o la fecha, no solo contra el ledger.
- Las monedas tienen un límite diario de 120; los logros son recompensas únicas y no se repiten.
- El dominio (`mastery`) solo aumenta con aciertos espaciados al menos 24 h. Repetir de inmediato no convierte una pregunta en dominada.
- La XP nunca es negativa. Abandonar conserva la XP ya registrada y pierde solo la recompensa de finalización anunciada.

## 3. Niveles

La XP total se conserva siempre; subir de nivel no reinicia el progreso.

```
xpParaSubir(nivel) = 80 + 40 × (nivel − 1) + 10 × (nivel − 1)²
```

Nivel 1 → 2: 80 XP. Nivel 2 → 3: 130 XP. Nivel 3 → 4: 200 XP. El nivel máximo es 50 y no muestra un “nivel 51”.

## 4. Rangos

Los rangos se calculan con XP, respuestas, precisión, preguntas dominadas, áreas con evidencia fiable y jefes superados.

| Rango | XP | Respuestas | Precisión | Dominadas | Áreas | Jefes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Bachiller | 0 | 0 | 0 | 0 | 0 | 0 |
| Interno | 150 | 10 | 55 % | 0 | 1 | 0 |
| Serumista | 450 | 30 | 65 % | 8 | 3 | 0 |
| Especialista | 1100 | 70 | 75 % | 25 | 5 | 1 |
| Maestro SERUMS | 2400 | 120 | 82 % | 50 | 5 | 3 |

La precisión se calcula sobre respuestas registradas (no sobre preguntas omitidas). Un rango puede ajustarse si la precisión global baja; la interfaz distingue “Nuevo rango” de “Rango ajustado”.

## 5. Etapas adaptativas

| Etapa | Criterios de ascenso |
| --- | --- |
| 1 · Iniciación | Inicio |
| 2 · Desarrollo | 12 respuestas evaluadas y 55 % de precisión |
| 3 · Especialización | 30 respuestas, 65 % de precisión y 5 dominadas |
| 4 · Dominio | 60 respuestas, 72 % de precisión, 12 dominadas y 6 misiones |

- La etapa no sube por una sola respuesta correcta.
- Un error aislado no baja la etapa.
- El descenso solo se evalúa con al menos 12 respuestas recientes y una precisión reciente inferior al 40 %; baja como máximo una etapa.
- Los criterios se comparan con la precisión real, no con el porcentaje redondeado que se muestra.
- La etapa se actualiza al cerrar una sesión.

## 6. Misiones y desbloqueos

- Cada área tiene 2 o 3 misiones y un jefe.
- Misión 1: disponible.
- Misión 2: misión 1 completada, nivel 2 y etapa 2.
- Misión 3: misión 2 completada, nivel 3 y etapa 3.
- Jefe: dos misiones completadas, nivel 4 y etapa 3.
- Una misión se considera superada con todas las preguntas respondidas y al menos 60 % de aciertos.
- El jefe exige 70 % de aciertos sobre el total; el feedback se difiere hasta los resultados.

## 7. Modos y penalizaciones

### Supervivencia

- 10 preguntas, 3 oportunidades, 45 s por pregunta.
- Cada error o tiempo agotado consume una oportunidad.
- Si se agotan antes de terminar, no hay recompensa de finalización. La XP de las respuestas correctas ya registradas se conserva.

### Contrarreloj

- 3 min / 8 preguntas, 5 min / 12 preguntas u 8 min / 18 preguntas.
- La recompensa exige 70 % de aciertos sobre el total y al menos 8 respuestas.
- No hay bonificación por velocidad. Omitir no suma.
- El temporizador total se comprueba al responder y en el bucle de la interfaz.

### Recuperación

- Solo preguntas falladas y programadas.
- Primera revisión: 20 min después del fallo.
- Aciertos posteriores: 1, 3, 7, 14 y 30 días.
- Un acierto registra `recoveredAt`, pero no marca una ficha como dominada.
- La recompensa de finalización exige al menos 3 respuestas y 50 % de aciertos; se otorga una vez al día.

### Desafío diario

- 6 preguntas deterministas por perfil y fecha: repaso, una pregunta de mayor exigencia, aplicación clínica y recuperación si hay errores disponibles.
- Se bloquea al completarlo. Una racha se actualiza al superarlo; un fallo no resta XP ni conocimientos.
- Bono semanal: 60 XP + 20 monedas al alcanzar 7 días, una vez por semana ISO.

### Jefes y simulacro

- Jefe: 8 preguntas, 90 s por pregunta, feedback diferido, 70 % del total.
- Simulacro: 20 preguntas, 15 min, feedback diferido, 70 % del total; se abre en etapa Dominio.

## 8. Registro y resultados

- `score = aciertos × 100`.
- `accuracy = aciertos / respuestas registradas`.
- La cobertura de una prueba cronometrada se mide como `aciertos / total` para evitar premiar omitir.
- Las preguntas sin respuesta no se inventan: aparecen como omitidas o sin responder.
- Las fichas sugeridas se basan en la afinidad temática de la pregunta; abrirlas no altera el dominio.

## 9. Ledger y transacciones

- Cada recompensa lleva clave, fecha, fuente, sesión y montos.
- Las claves permanentes (misión, jefe, diario, semanal, logro) se conservan; solo se podan las claves `answer:*` antiguas.
- El estado se escribe en un único documento con diario y respaldo.
- Si la escritura falla, la transacción no se aplica al estado en memoria.
- Un estado dañado o de una versión futura bloquea la escritura, se archiva y se ofrece recuperación; no se sobrescribe silenciosamente.

## 10. Colección, personajes y cosméticos

La colección usa el mismo documento persistente y la misma moneda. No hay una segunda economía ni pagos con dinero real.

### 10.1 Personajes

| id | Rareza | Precio | Desbloqueo |
| --- | --- | ---: | --- |
| Ilan Vega | Inicial | 0 | Disponible desde el primer arranque |
| Mara Solís | Común | 480 | Compra |
| Noa Iturbe | Poco común | 950 | Compra |
| Teo Alcázar | Poco común | 1.100 | Compra |
| Lía Márquez | Raro | 1.750 | Compra |
| Kian Ferro | Raro | 1.950 | Compra |
| Amaru Cielo | Raro | 0 | 5 misiones completadas (recompensa, no compra) |
| Ona Beltrán | Épico | 3.200 | Compra |
| Iris Calderón | Épico | 3.600 | Compra |
| Zenón Atlas | Legendario | 5.400 | Nivel 8 + compra |

- Solo el personaje inicial está disponible desde el principio.
- El requisito se evalúa con XP/nivel, misiones completadas o logros reales.
- Amaru se entrega al cerrar una sesión cuando el contador de misiones completadas llega a 5; no cuesta monedas.
- Los personajes no otorgan XP, monedas, precisión ni facilidad adicional. Sus atributos y ventajas son descriptivos y de presentación.

### 10.2 Cosméticos

- Categorías: cabeza, peinado, torso, piernas, accesorio principal, accesorio adicional, amuleto, efecto y marco.
- Cada objeto declara personajes compatibles y una ranura. Un objeto incompatible no se puede equipar.
- Kian y Zenón no tienen ranura de peinado; Amaru no tiene ranura de cabeza.
- Los objetos de logro no se compran con monedas; muestran su requisito y progreso.
- El equipamiento se guarda por personaje. Cambiar de personaje no elimina objetos del inventario.
- Se conserva un atuendo anterior por personaje para restaurarlo desde la personalización.

### 10.3 Precios y bandas

| Rareza | Personajes | Cosméticos |
| --- | --- | --- |
| Común | 400–800 | 60–140 |
| Poco común | 900–1.500 | 150–260 |
| Raro | 1.600–2.400 | 280–420 |
| Épico | 2.800–4.000 | 480–680 |
| Legendario | 5.000–7.000 | 750–1.000 |

Los precios exactos están en `QUEST_CONFIG.rpg.prices`. Una prueba comprueba que cada precio coincida con la configuración y su banda. El catálogo no declara precios propios.

### 10.4 Reglas de compra

1. El objeto debe existir y no estar en la colección.
2. El requisito de desbloqueo debe estar cumplido.
3. El saldo debe alcanzar el precio.
4. El descuento y la concesión ocurren en el mismo `commit`; si algo falla, no se aplica nada.
5. La transacción se registra con objeto, precio y saldo resultante.
6. Está prohibido el saldo negativo y la doble compra.
7. Abrir la tienda o navegar por ella no otorga monedas.

### 10.5 Migración

El esquema 2 añade `collection`, `economy` y `presentation`. La migración desde el esquema 1 conserva XP, monedas, preguntas, errores, misiones, logros, sesiones y perfil; crea la colección con Ilan y no reinicia la economía.

### 10.6 Presentación y reacciones

- Estados: `idle`, `correct`, `streak`, `wrong`, `defeat`, `victory`, `levelup`, `unlock`.
- Las reacciones no interrumpen la pregunta ni bloquean el botón de continuar.
- Los mensajes varían según la personalidad del personaje y rotan para no repetirse de inmediato.
- `prefers-reduced-motion` y las preferencias de presentación desactivan animaciones sin quitar funciones.
- El estudio de equipamiento (`#/inventario/:id`, alias `#/personalizar/:id`) guarda un atuendo por personaje; probar un objeto no lo compra ni lo equipa hasta guardar. No concede ventajas académicas.
- Los escenarios son decorativos: no contienen pistas, respuestas ni información necesaria para responder.
- El audio es opcional: no se reproduce antes de un gesto, no altera XP/monedas y la música empieza desactivada.
- Los detalles técnicos están en `docs/RPG-SYSTEM.md`; la procedencia de assets, en `docs/ASSETS.md`.
