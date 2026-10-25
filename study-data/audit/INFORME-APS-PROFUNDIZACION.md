# Informe — Profundización APS en Study Dashboard de Psicología

**Fecha:** 24 de octubre de 2026  
**Versión:** 2.5.0  
**Línea base de esta iteración:** copia de `temario.js` v2.4.0 (24/10/2026).  
**Alcance:** contenidos de Atención Primaria de Salud (APS) y fichas directamente relacionadas de Psicología.

## 1. Auditoría y mapa

- **5 áreas**, **14 subáreas** y **90 ítems únicos** del PDF oficial verificados con inspección visual y extracción por bloques.
- **92 fichas** de Psicología; **630 tarjetas** en todo el temario; **276** de Psicología.
- **55 fichas APS o directamente relacionadas** examinadas.
- **30 fichas** modificadas en esta iteración APS.
- **37 fichas APS** modificadas desde `HEAD` (v2.3.0), porque varias ya habían sido ampliadas en la reorganización previa.
- **0 fichas APS nuevas**; **0 fichas eliminadas**.
- **49 fichas modificadas en total** desde `HEAD`, incluidas las no APS de la reorganización anterior.

La matriz de 90 ítems sigue disponible en `MAPA-MAESTRO-PSICOLOGIA.csv` y `MAPA-MAESTRO-PSICOLOGIA.md`.

## 2. Cambios principales

### Núcleo APS

- **CI 2.1** quedó en **4.392 palabras y 19 secciones**: Alma-Ata (ocho elementos), Astaná (cuatro compromisos), APS selectiva/Bellagio-GOBI, Montevideo 2005, APS renovada, PCAT y validación peruana, historia peruana, MAIS/MAIS-BFC/MCI, RIS, determinantes, rol del psicólogo, prevención, cronología, preguntas y casos.
- **CI 2.2** quedó en **2.593 palabras y 16 secciones**: curso de vida, antecedentes normativos, principios/enfoques, cuatro componentes, etapas, familia, APOC, RIS, gestión/financiamiento, funciones del psicólogo y caso.
- Se corrigió que **MAIS (2003) y MAIS-BFC (2011) no están vigentes**: el MAIS fue dejado sin efecto por la RM 464-2011 y el MAIS-BFC fue derogado por la RM 030-2020. El MCI es el modelo vigente; las NTS operativas siguen vigentes.

### Salud pública y comunidad

- **SP 1.6:** se corrigió la clasificación de la restricción de plaguicidas (primaria), la capacitación docente (secundaria) y el tamizaje (secundaria); la prevención primordial queda para condiciones estructurales.
- **SP 1.12:** ASIS local con equipo de gestión de la RIS, gobierno local, HIS/REUNIS/ENDES/ENAHO/INEI y criterios de priorización unificados.
- **SP 2.1:** tabla determinante estructural → sector competente y medición de brechas.
- **SP 2.3:** se separó el **espectro IAP2** (cinco niveles) de la **escalera de Arnstein** (ocho peldaños) y se añadió vigilancia ciudadana.
- **SP 2.4:** se reemplazaron los criterios por los cinco del MCI: población, cobertura, accesibilidad geográfica, densidad y circunscripción política; SISFAC y mapeo geosanitario.
- **SP 2.5:** APOC en dos fases y rol del agente comunitario.
- **SP 2.6:** tipología de la PPS 2017: informativa, cooperación, coordinación, integración y salud en todas las políticas.
- **SP 2.7:** gobierno del plan local, Comité Local de Salud, articulación al plan de desarrollo y al POI, acuerdos de gestión.
- **SP 2.8:** SISFAC, HIS, REUNIS/ENDES/ENAHO/INEI, RENHICE y población nominalizada como denominador.
- **SP 2.13:** cinco dimensiones de acceso y cascada de Tanahashi con pérdida entre niveles.
- **SP 3.1:** tríada de Ottawa (abogar, mediar, habilitar), Shanghái 2016 y separación entre promoción y APS/Astaná.
- **SP 3.2:** mercadeo social y aprendizaje social, además de IEC.
- **SP 3.4:** comunicación de riesgo y reconstrucción.

### Cuidado integral, salud mental y ética

- **CI 1.2:** definición de cuidados de salud mental y diferenciación primer nivel/CSMC/hospital/emergencia.
- **CI 1.4:** violencia con detección, seguridad y ruta intersectorial.
- **CI 1.6:** Ley 30947, DS 007-2020, internamiento (12 h/72 h), hospitalización con soporte 24 h y revisión a los 30 días, Ley 32575 y límites del psicólogo.
- **CI 2.3–2.8:** aplicación en APS y continuidad por etapa.
- **ET 2.1:** consentimiento intercultural.
- **ET 2.3:** las cuatro dimensiones oficiales de la DA 261, sin duplicar listas.
- **ET 2.5:** se retiró la NTS 121, que regula parto vertical y no medicina tradicional.

### Gestión y organización

- **GE 2.2:** se corrigió la lectura de I-4/III-1: farmacia es UPSS, internamiento es Sub UPSS; III-1 añade hemodiálisis y otros servicios, no UCI (ya en II-2).
- **GE 2.4:** vías de cuidado integral y referencia/contrarreferencia como componente, no como circuito completo.
- **GE 2.6:** RIS iniciadoras, Director y cinco equipos de gestión en el primer nivel de mayor capacidad, apertura y continuidad.
- **GE 2.3/2.7:** cartera y telesalud alineadas con APS.

## 3. Fuentes consultadas

### PDF locales procesados

- `psicologia-temario-serums-2026-ii.pdf`.
- `psi-salud-publica.pdf`, `psi-cuidado-integral.pdf`, `psi-etica-interculturalidad.pdf`, `psi-investigacion.pdf`, `psi-gestion-servicios.pdf`.
- `modelo-cuidado-integral-curso-vida.pdf`.
- `politica-promocion-salud.pdf`.
- `carta-ottawa-promocion-salud.pdf`.
- `atencion-primaria-salud.pdf`.
- `abordaje-promocion-salud.pdf`.

### Fuentes oficiales

- OMS: Alma-Ata (12/09/1978), Ottawa (21/11/1986), Yakarta (21-25/07/1997), informe mundial 2008, Astaná (25-26/10/2018).
- ONU: Agenda 2030 (25/09/2015).
- OPS: Declaración de Montevideo (29/09/2005).
- MINSA: RM 729-2003-SA/DM (MAIS); RM 464-2011/MINSA (MAIS-BFC); RM 030-2020/MINSA (MCI); RM 220-2021/MINSA (Manual MCI); RM 366-2017/MINSA (promoción); RM 546-2011/MINSA (NTS 021); RM 625-2026/MINSA (NTS 249); RM 251-2024/MINSA y RM 429-2024/MINSA (NTS 213).
- Perú: Ley 26842, Ley 29344, Ley 29889, Ley 30885, Ley 30947, Ley 32575; DS 019-2024-SA; DS 007-2020-SA; DS 011-2025-SA.
- CONCYTEC: Código Nacional de Integridad Científica (RP 028-2024-CONCYTEC-P).
- PCAT: Cuba-Fuentes et al., Acta Med Peru 2024;41(4):270-277.
- Tanahashi (1978), Arnstein (1969), IAP2.

## 4. Correcciones y discrepancias

- **DS 155** es una **Directiva Sanitaria**, no un Decreto Supremo; se corrigió y se retiró donde su ámbito no correspondía.
- **ET 2.3:** se eliminó la lista duplicada de dimensiones y se dejó la de la DA 261.
- **SP 1.6:** se corrigieron los niveles de prevención del caso.
- **SP 2.7:** se unificaron los criterios de priorización con SP 1.12.
- **SP 2.13:** se pasó de “cuatro” a “cinco” dimensiones.
- **SP 2.3:** se corrigió la atribución Arnstein/IAP2.
- **GE 2.2:** se corrigieron farmacia/Sub UPSS y III-1.
- **CI 1.6:** se corrigió “hospitalización 24 h” por “soporte 24 h y revisión a los 30 días”.
- **CI 2.1:** Montevideo se fecha el 29/09/2005; se retiró el vínculo no documentado Tejada–Ley 26842.
- **GE 2.6:** se retiró la afirmación no verificada de que la asignación “no restringe el acceso”.

**Limitación de tarjetas:** la explicación de `card-psi-ge-2-2-2` dice “Farmacia e Internamiento como Sub UPSS”. Farmacia es UPSS y solo el internamiento es Sub UPSS. Las 630 tarjetas no se modificaron por la restricción del encargo; el cuerpo de la ficha ya distingue ambos conceptos. Es una inconsistencia pendiente en la tarjeta, no en la ficha.

## 5. Pruebas

- `validate_curriculum.py`: **0 errores, 0 advertencias**; 48 fuentes, 23 áreas, 86 temas, 210 fichas, 630 tarjetas; 105/105/105/105 en `correctIndex`.
- Navegador: **184/184** combinaciones ficha × modo rápido/completo; 0 errores de consola; 0 fallos de red.
- Flashcards: 210 mazos, 630 tarjetas, versión 2.5.0.
- Comparación con `HEAD`: **630/630 tarjetas idénticas**; 0 fichas no psicológicas modificadas.
- `git diff --check`: OK.
- `verificar_integridad.py`: manifiesto regenerado y verificado.

## 6. Agentes

Se usaron **6 agentes** en esta iteración: cinco especialistas APS (fundamentos/historia; modelos peruanos/RIS; comunidad/territorio; promoción/interculturalidad; salud mental/roles) y un auditor independiente final. Trabajaron en paralelo, sin editar archivos; la integración y las correcciones se centralizaron. No se simularon agentes ni verificaciones.

## 7. Límites

- **37 ítems** del mapa general siguen “mapeados” sin revisión exhaustiva de profundidad; **8 parciales** y **1 con limitación** de tarjetas.
- La tarjeta de GE 2.2 mencionada arriba no se corrigió para preservar las 630 tarjetas.
- Algunas referencias externas (Tanahashi, IAP2, Arnstein) se añadieron a la sección de fuentes, pero no están en los PDF locales.
- La verificación normativa es documental; no sustituye la revisión del portal oficial ni la interpretación jurídica.
- No se modificaron los PDF, `study-shared/*`, el código de las apps, las 630 tarjetas ni el progreso compartido.

## 8. Archivos

- `study-data/temario.js` (v2.5.0).
- `study-dashboard/index.html` y `study-flashcards/index.html` (caché 2.5.0).
- `study-data/audit/COBERTURA-PSICOLOGIA.md`.
- `study-data/audit/MAPA-MAESTRO-PSICOLOGIA.csv` y `.md`.
- `study-data/audit/INFORME-REORGANIZACION.md`.
- `study-data/audit/INFORME-APS-PROFUNDIZACION.md`.
- `INTEGRITY.sha256`.
