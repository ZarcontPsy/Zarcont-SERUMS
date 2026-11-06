/* SERUMS QUEST — OBSERVATORIO DE LAS CINCO RUTAS
   Fase 2 · héroes y guardianes. Generado desde src/campaign.json y .work/src.
   Checkpoint: reglas de colección, 10 siluetas con arma, 5 guardianes, VFX y cámara.
   No editar a mano: cambia las fuentes y ejecuta .work/build-game.js. */
var CAMPAIGN_DATA = {"meta":{"source":"SERUMS QUEST 1.2.0","generatedAt":"2026-11-06T02:26:11.211Z","questionCount":111,"missionCount":13,"bossCount":5,"areaCount":5,"note":"Preguntas oficiales de Psicología empaquetadas para la campaña. Sin PDFs ni fichas externas.","cosmeticCount":69,"originalCosmeticCount":33,"extraCosmeticCount":36},"areas":[{"id":"area-psi-salud-publica","short":"Salud pública","title":"Área I · Salud pública","accent":"#69D3C1","blurb":"Métodos, comunidad, promoción y determinantes.","icon":"globe","missions":["mission-sp-1","mission-sp-2","mission-sp-3"],"boss":"boss-sp"},{"id":"area-psi-cuidado-integral","short":"Cuidado integral","title":"Área II · Cuidado integral","accent":"#7AA2FF","blurb":"Clínica, curso de vida y salud mental.","icon":"heart","missions":["mission-ci-1","mission-ci-2","mission-ci-3"],"boss":"boss-ci"},{"id":"area-psi-etica","short":"Ética e interculturalidad","title":"Área III · Ética e interculturalidad","accent":"#C49BFF","blurb":"Dignidad, confidencialidad y pertinencia cultural.","icon":"scale","missions":["mission-et-1","mission-et-2"],"boss":"boss-et"},{"id":"area-psi-investigacion","short":"Investigación","title":"Área IV · Investigación","accent":"#B8D46A","blurb":"Método, validez, evidencia y comunicación.","icon":"flask","missions":["mission-in-1","mission-in-2"],"boss":"boss-in"},{"id":"area-psi-gestion","short":"Gestión de servicios","title":"Área V · Gestión de servicios","accent":"#F3B562","blurb":"Planificación, organización, calidad y equipos.","icon":"layers","missions":["mission-ge-1","mission-ge-2","mission-ge-3"],"boss":"boss-ge"}],"missions":[{"id":"mission-sp-1","kind":"mission","areaId":"area-psi-salud-publica","areaShort":"Salud pública","areaTitle":"Área I · Salud pública","accent":"#69D3C1","index":1,"title":"Ronda comunitaria","subtitle":"Territorio, promoción y prevención","description":"Empieza por los determinantes, la participación y las acciones que sostienen la salud de una comunidad.","tier":"iniciacion","tierLabel":"Iniciación","feedback":"inmediata","questionIds":["2026-i-psicologia-q056","2026-ii-psicologia-q059","2025-i-psicologia-q009","2025-i-psicologia-q025","2026-i-psicologia-q065"],"questionCount":5,"estimatedMinutes":6,"rewards":{"xp":30,"coins":8,"questionXp":10},"unlock":{"missions":[],"level":1,"stage":1}},{"id":"mission-sp-2","kind":"mission","areaId":"area-psi-salud-publica","areaShort":"Salud pública","areaTitle":"Área I · Salud pública","accent":"#69D3C1","index":2,"title":"Foco epidemiológico","subtitle":"Medición, vigilancia y respuesta","description":"Lee indicadores, reconoce brotes y decide qué vigilar cuando la evidencia cambia.","tier":"desarrollo","tierLabel":"Desarrollo","feedback":"inmediata","questionIds":["2025-i-psicologia-q013","2026-i-psicologia-q069","2026-i-psicologia-q089","2026-i-psicologia-q026","2026-i-psicologia-q091","2026-ii-psicologia-q040"],"questionCount":6,"estimatedMinutes":7,"rewards":{"xp":30,"coins":8,"questionXp":20},"unlock":{"missions":["mission-sp-1"],"level":2,"stage":2}},{"id":"mission-sp-3","kind":"mission","areaId":"area-psi-salud-publica","areaShort":"Salud pública","areaTitle":"Área I · Salud pública","accent":"#69D3C1","index":3,"title":"Territorio y decisión","subtitle":"ASIS, priorización y prevención","description":"Integra el análisis de situación con decisiones de prevención y respuesta.","tier":"especializacion","tierLabel":"Especialización","feedback":"inmediata","questionIds":["2025-i-psicologia-q042","2025-i-psicologia-q037","2026-i-psicologia-q072","2025-i-psicologia-q094","2026-ii-psicologia-q053","2025-i-psicologia-q018"],"questionCount":6,"estimatedMinutes":7,"rewards":{"xp":30,"coins":8,"questionXp":35},"unlock":{"missions":["mission-sp-2"],"level":3,"stage":3}},{"id":"boss-sp","kind":"boss","areaId":"area-psi-salud-publica","areaShort":"Salud pública","areaTitle":"Área I · Salud pública","accent":"#69D3C1","index":4,"title":"Custodio de la salud pública","subtitle":"Jefe final · Salud pública","description":"Un desafío integrador sobre métodos, comunidad, promoción y respuesta sanitaria.","tier":"dominio","tierLabel":"Dominio","feedback":"diferida","questionIds":["2026-i-psicologia-q086","2026-ii-psicologia-q055","2026-i-psicologia-q040","2026-i-psicologia-q048","2026-i-psicologia-q077","2026-ii-psicologia-q069","2025-i-psicologia-q087","2026-ii-psicologia-q063"],"questionCount":8,"estimatedMinutes":14,"rewards":{"xp":80,"coins":25,"questionXp":50},"unlock":{"missions":["mission-sp-1","mission-sp-2"],"level":4,"stage":3}},{"id":"mission-ci-1","kind":"mission","areaId":"area-psi-cuidado-integral","areaShort":"Cuidado integral","areaTitle":"Área II · Cuidado integral","accent":"#7AA2FF","index":1,"title":"Primera escucha","subtitle":"Entrevista, evaluación y vínculo","description":"Practica la observación, la entrevista y el razonamiento clínico desde el primer contacto.","tier":"iniciacion","tierLabel":"Iniciación","feedback":"inmediata","questionIds":["2026-i-psicologia-q082","2026-ii-psicologia-q075","2026-i-psicologia-q028","2025-i-psicologia-q093","2026-i-psicologia-q076"],"questionCount":5,"estimatedMinutes":6,"rewards":{"xp":30,"coins":8,"questionXp":10},"unlock":{"missions":[],"level":1,"stage":1}},{"id":"mission-ci-2","kind":"mission","areaId":"area-psi-cuidado-integral","areaShort":"Cuidado integral","areaTitle":"Área II · Cuidado integral","accent":"#7AA2FF","index":2,"title":"Clínica en contexto","subtitle":"Salud mental y curso de vida","description":"Distingue conceptos cercanos y aplica criterios a personas, familias y comunidades.","tier":"desarrollo","tierLabel":"Desarrollo","feedback":"inmediata","questionIds":["2025-i-psicologia-q097","2026-ii-psicologia-q042","2026-ii-psicologia-q023","2026-ii-psicologia-q016","2026-ii-psicologia-q020","2026-i-psicologia-q034"],"questionCount":6,"estimatedMinutes":7,"rewards":{"xp":30,"coins":8,"questionXp":20},"unlock":{"missions":["mission-ci-1"],"level":2,"stage":2}},{"id":"mission-ci-3","kind":"mission","areaId":"area-psi-cuidado-integral","areaShort":"Cuidado integral","areaTitle":"Área II · Cuidado integral","accent":"#7AA2FF","index":3,"title":"Continuidad del cuidado","subtitle":"Casos, seguimiento y redes","description":"Integra hallazgos, decisiones y continuidad en situaciones de mayor complejidad.","tier":"especializacion","tierLabel":"Especialización","feedback":"inmediata","questionIds":["2026-i-psicologia-q063","2026-i-psicologia-q100","2026-i-psicologia-q005","2026-i-psicologia-q073","2026-ii-psicologia-q051","2026-i-psicologia-q075"],"questionCount":6,"estimatedMinutes":7,"rewards":{"xp":30,"coins":8,"questionXp":35},"unlock":{"missions":["mission-ci-2"],"level":3,"stage":3}},{"id":"boss-ci","kind":"boss","areaId":"area-psi-cuidado-integral","areaShort":"Cuidado integral","areaTitle":"Área II · Cuidado integral","accent":"#7AA2FF","index":4,"title":"Custodio del cuidado integral","subtitle":"Jefe final · Cuidado integral","description":"Un caso integrador de evaluación, salud mental y curso de vida.","tier":"dominio","tierLabel":"Dominio","feedback":"diferida","questionIds":["2025-i-psicologia-q033","2026-ii-psicologia-q064","2026-i-psicologia-q011","2025-i-psicologia-q054","2026-i-psicologia-q018","2026-i-psicologia-q023","2026-i-psicologia-q030","2026-ii-psicologia-q030"],"questionCount":8,"estimatedMinutes":14,"rewards":{"xp":80,"coins":25,"questionXp":50},"unlock":{"missions":["mission-ci-1","mission-ci-2"],"level":4,"stage":3}},{"id":"mission-et-1","kind":"mission","areaId":"area-psi-etica","areaShort":"Ética e interculturalidad","areaTitle":"Área III · Ética e interculturalidad","accent":"#C49BFF","index":1,"title":"Fronteras de la confianza","subtitle":"Confidencialidad, consentimiento y derechos","description":"Decide con criterios deontológicos cuando la confianza y la dignidad están en juego.","tier":"iniciacion","tierLabel":"Iniciación","feedback":"inmediata","questionIds":["2026-ii-psicologia-q035","2025-i-psicologia-q036","2025-i-psicologia-q026","2025-i-psicologia-q086","2026-ii-psicologia-q012"],"questionCount":5,"estimatedMinutes":6,"rewards":{"xp":30,"coins":8,"questionXp":10},"unlock":{"missions":[],"level":1,"stage":1}},{"id":"mission-et-2","kind":"mission","areaId":"area-psi-etica","areaShort":"Ética e interculturalidad","areaTitle":"Área III · Ética e interculturalidad","accent":"#C49BFF","index":2,"title":"Diálogo intercultural","subtitle":"Pertinencia, diversidad y trato digno","description":"Reconoce barreras culturales y construye atención culturalmente pertinente.","tier":"desarrollo","tierLabel":"Desarrollo","feedback":"inmediata","questionIds":["2025-i-psicologia-q012","2026-i-psicologia-q007","2026-ii-psicologia-q077","2025-i-psicologia-q076","2026-i-psicologia-q014"],"questionCount":5,"estimatedMinutes":6,"rewards":{"xp":30,"coins":8,"questionXp":20},"unlock":{"missions":["mission-et-1"],"level":2,"stage":2}},{"id":"boss-et","kind":"boss","areaId":"area-psi-etica","areaShort":"Ética e interculturalidad","areaTitle":"Área III · Ética e interculturalidad","accent":"#C49BFF","index":3,"title":"Custodio de la ética","subtitle":"Jefe final · Ética e interculturalidad","description":"Un desafío sobre dignidad, derechos, confidencialidad e interculturalidad.","tier":"dominio","tierLabel":"Dominio","feedback":"diferida","questionIds":["2026-i-psicologia-q041","2026-ii-psicologia-q017","2026-i-psicologia-q097","2025-i-psicologia-q067","2026-ii-psicologia-q082","2026-i-psicologia-q066","2026-ii-psicologia-q099","2026-ii-psicologia-q081"],"questionCount":8,"estimatedMinutes":14,"rewards":{"xp":80,"coins":25,"questionXp":50},"unlock":{"missions":["mission-et-1","mission-et-2"],"level":4,"stage":3}},{"id":"mission-in-1","kind":"mission","areaId":"area-psi-investigacion","areaShort":"Investigación","areaTitle":"Área IV · Investigación","accent":"#B8D46A","index":1,"title":"Del dato a la decisión","subtitle":"Enfoques, diseños y preguntas","description":"Distingue formas de investigar y elige el diseño que responde a la pregunta.","tier":"iniciacion","tierLabel":"Iniciación","feedback":"inmediata","questionIds":["2026-ii-psicologia-q085","2025-i-psicologia-q024","2026-i-psicologia-q029","2026-ii-psicologia-q049","2026-i-psicologia-q036"],"questionCount":5,"estimatedMinutes":6,"rewards":{"xp":30,"coins":8,"questionXp":10},"unlock":{"missions":[],"level":1,"stage":1}},{"id":"mission-in-2","kind":"mission","areaId":"area-psi-investigacion","areaShort":"Investigación","areaTitle":"Área IV · Investigación","accent":"#B8D46A","index":2,"title":"Método y validez","subtitle":"Instrumentos, sesgos y comunicación","description":"Evalúa validez, confiabilidad y límites de la evidencia antes de concluir.","tier":"desarrollo","tierLabel":"Desarrollo","feedback":"inmediata","questionIds":["2026-ii-psicologia-q021","2026-ii-psicologia-q028","2026-ii-psicologia-q043","2026-i-psicologia-q092","2026-i-psicologia-q009"],"questionCount":5,"estimatedMinutes":6,"rewards":{"xp":30,"coins":8,"questionXp":20},"unlock":{"missions":["mission-in-1"],"level":2,"stage":2}},{"id":"boss-in","kind":"boss","areaId":"area-psi-investigacion","areaShort":"Investigación","areaTitle":"Área IV · Investigación","accent":"#B8D46A","index":3,"title":"Custodio de la evidencia","subtitle":"Jefe final · Investigación","description":"Un desafío integrador sobre método, validez y ética de la investigación.","tier":"dominio","tierLabel":"Dominio","feedback":"diferida","questionIds":["2026-i-psicologia-q037","2026-ii-psicologia-q054","2025-i-psicologia-q055","2026-ii-psicologia-q026","2026-i-psicologia-q050","2026-i-psicologia-q010","2026-i-psicologia-q059","2026-i-psicologia-q002"],"questionCount":8,"estimatedMinutes":14,"rewards":{"xp":80,"coins":25,"questionXp":50},"unlock":{"missions":["mission-in-1","mission-in-2"],"level":4,"stage":3}},{"id":"mission-ge-1","kind":"mission","areaId":"area-psi-gestion","areaShort":"Gestión de servicios","areaTitle":"Área V · Gestión de servicios","accent":"#F3B562","index":1,"title":"La salud como sistema","subtitle":"Planificación, organización y redes","description":"Ubica los servicios en su marco de planificación, organización y referencia.","tier":"iniciacion","tierLabel":"Iniciación","feedback":"inmediata","questionIds":["2026-ii-psicologia-q046","2026-i-psicologia-q093","2026-i-psicologia-q094","2026-i-psicologia-q055","2026-i-psicologia-q099"],"questionCount":5,"estimatedMinutes":6,"rewards":{"xp":30,"coins":8,"questionXp":10},"unlock":{"missions":[],"level":1,"stage":1}},{"id":"mission-ge-2","kind":"mission","areaId":"area-psi-gestion","areaShort":"Gestión de servicios","areaTitle":"Área V · Gestión de servicios","accent":"#F3B562","index":2,"title":"Calidad que sostiene","subtitle":"Calidad, seguridad y clima","description":"Relaciona mejora continua, seguridad del paciente y cultura organizacional.","tier":"desarrollo","tierLabel":"Desarrollo","feedback":"inmediata","questionIds":["2025-i-psicologia-q070","2026-ii-psicologia-q083","2025-i-psicologia-q060","2025-i-psicologia-q095","2026-ii-psicologia-q092","2026-i-psicologia-q042"],"questionCount":6,"estimatedMinutes":7,"rewards":{"xp":30,"coins":8,"questionXp":20},"unlock":{"missions":["mission-ge-1"],"level":2,"stage":2}},{"id":"mission-ge-3","kind":"mission","areaId":"area-psi-gestion","areaShort":"Gestión de servicios","areaTitle":"Área V · Gestión de servicios","accent":"#F3B562","index":3,"title":"Equipos y recursos","subtitle":"Personas, alianzas y abastecimiento","description":"Integra recursos humanos, coordinación y sostenibilidad de los servicios.","tier":"especializacion","tierLabel":"Especialización","feedback":"inmediata","questionIds":["2025-i-psicologia-q008","2026-i-psicologia-q016","2025-i-psicologia-q032","2026-i-psicologia-q031","2026-ii-psicologia-q060","2025-i-psicologia-q096"],"questionCount":6,"estimatedMinutes":7,"rewards":{"xp":30,"coins":8,"questionXp":35},"unlock":{"missions":["mission-ge-2"],"level":3,"stage":3}},{"id":"boss-ge","kind":"boss","areaId":"area-psi-gestion","areaShort":"Gestión de servicios","areaTitle":"Área V · Gestión de servicios","accent":"#F3B562","index":4,"title":"Custodio de la gestión","subtitle":"Jefe final · Gestión de servicios","description":"Un desafío integrador sobre planificación, organización, calidad y equipos.","tier":"dominio","tierLabel":"Dominio","feedback":"diferida","questionIds":["2026-ii-psicologia-q003","2026-ii-psicologia-q045","2026-ii-psicologia-q047","2025-i-psicologia-q041","2026-i-psicologia-q081","2026-i-psicologia-q032","2025-i-psicologia-q045","2026-ii-psicologia-q036"],"questionCount":8,"estimatedMinutes":14,"rewards":{"xp":80,"coins":25,"questionXp":50},"unlock":{"missions":["mission-ge-1","mission-ge-2"],"level":4,"stage":3}}],"questions":{"2026-i-psicologia-q056":{"id":"2026-i-psicologia-q056","areaId":"area-psi-salud-publica","stem":"¿Cuál es un factor cuya presencia excesiva o su ausencia relativa es esencial para la ocurrencia de la enfermedad?","options":[{"id":"A","text":"Reservorio"},{"id":"B","text":"Agente"},{"id":"C","text":"Transmisión"},{"id":"D","text":"Huésped"}],"answer":"B","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":6,"complexity":15,"confidence":"media"},"2026-ii-psicologia-q059":{"id":"2026-ii-psicologia-q059","areaId":"area-psi-salud-publica","stem":"La ...... es el estudio de la distribución y determinantes de la enfermedad en la población humana. Es la ciencia básica y práctica fundamental de la salud pública.","options":[{"id":"A","text":"causalidad"},{"id":"B","text":"demografía"},{"id":"C","text":"estadística"},{"id":"D","text":"epidemiología"}],"answer":"D","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":6,"complexity":20,"confidence":"alta"},"2025-i-psicologia-q009":{"id":"2025-i-psicologia-q009","areaId":"area-psi-salud-publica","stem":"¿Cuáles son las pruebas rápidas de elección para el tamizaje en los servicios de atención prenatal, salas de parto, emergencias obstétricas y puerperio?","options":[{"id":"A","text":"ELISA"},{"id":"B","text":"Pruebas rápidas (PR)"},{"id":"C","text":"Inmunoensayo en línea"},{"id":"D","text":"Pruebas rápidas duales (PRD)"}],"answer":"D","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":2,"complexity":21,"confidence":"alta"},"2025-i-psicologia-q025":{"id":"2025-i-psicologia-q025","areaId":"area-psi-salud-publica","stem":"Una de las actividades de la vigilancia en salud ocupacional es implementar la ...... y …… del factor de riesgo, que incluyan actividades de educación.","options":[{"id":"A","text":"estrategia - eliminación"},{"id":"B","text":"identificación - ejecución"},{"id":"C","text":"Intervención – eje"},{"id":"D","text":"promoción - prevención"}],"answer":"D","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":4,"complexity":21,"confidence":"alta"},"2026-i-psicologia-q065":{"id":"2026-i-psicologia-q065","areaId":"area-psi-salud-publica","stem":"En una comunidad donde no tiene agua segura, saneamiento básico y muy frecuentes lluvias por el cambio climático, la población esta expuestas a:","options":[{"id":"A","text":"Contaminación ambiental"},{"id":"B","text":"Riesgo físico y químico"},{"id":"C","text":"Pobreza y salubridad"},{"id":"D","text":"Riesgo ambiental"}],"answer":"D","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":7,"complexity":21,"confidence":"media"},"2025-i-psicologia-q013":{"id":"2025-i-psicologia-q013","areaId":"area-psi-salud-publica","stem":"El terremoto de Rusia de 8.2, generó una alerta de tsunami en todo el litoral peruano; ante ello, las autoridades tomaron medidas preventivas de alerta. ¿Qué tipo de amenaza es dicho suceso?","options":[{"id":"A","text":"Mixto"},{"id":"B","text":"Híbrido"},{"id":"C","text":"Antropogénico"},{"id":"D","text":"Natural"}],"answer":"D","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":2,"complexity":22,"confidence":"media"},"2026-i-psicologia-q069":{"id":"2026-i-psicologia-q069","areaId":"area-psi-salud-publica","stem":"La higiene de manos, lactancia materna, inmunizaciones, pautas de crianza, entre otras; realizadas por el personal de la salud, son denominadas acciones de:","options":[{"id":"A","text":"Protección comunitaria"},{"id":"B","text":"Intervención inmediata"},{"id":"C","text":"Bioseguridad materno infantil"},{"id":"D","text":"Promoción de la salud"}],"answer":"D","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":7,"complexity":22,"confidence":"media"},"2026-i-psicologia-q089":{"id":"2026-i-psicologia-q089","areaId":"area-psi-salud-publica","stem":"Las bolsas de recolección de residuos sólidos se deben diferenciar por colores: residuos biocontaminados:......, residuos químicos:...... y residuos comunes:...","options":[{"id":"A","text":"rojo / negro / amarillo."},{"id":"B","text":"negro / amarillo / rojo."},{"id":"C","text":"amarillo / rojo / negro."},{"id":"D","text":"rojo / amarillo / negro."}],"answer":"D","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":9,"complexity":22,"confidence":"alta"},"2026-i-psicologia-q026":{"id":"2026-i-psicologia-q026","areaId":"area-psi-salud-publica","stem":"La búsqueda intencionada y sistemática de casos de dislipidemia y obesidad infantil en las historias clínicas y archivos estadísticos del centro de salud. ¿A qué tipo de vigilancia corresponde?","options":[{"id":"A","text":"Centinela"},{"id":"B","text":"Pasiva"},{"id":"C","text":"Retrospectiva"},{"id":"D","text":"Activa"}],"answer":"B","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":3,"complexity":23,"confidence":"alta"},"2026-i-psicologia-q091":{"id":"2026-i-psicologia-q091","areaId":"area-psi-salud-publica","stem":"En una comunidad campesina altoandina se está presentando alto índice de enfermedades infecciosas. ¿Qué actividad de promoción de la salud se implementaría de inmediato?","options":[{"id":"A","text":"Lavado de manos"},{"id":"B","text":"Campaña de vacunación"},{"id":"C","text":"Calzado de guantes"},{"id":"D","text":"Cuidado del agua"}],"answer":"A","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":9,"complexity":23,"confidence":"alta"},"2026-ii-psicologia-q040":{"id":"2026-ii-psicologia-q040","areaId":"area-psi-salud-publica","stem":"El psicólogo de un establecimiento de salud, para obtener indicadores de consumo de drogas utiliza como indicador los tamizajes positivos. ¿A qué medición corresponde?","options":[{"id":"A","text":"Información de datos"},{"id":"B","text":"Ecológicas o ambientales"},{"id":"C","text":"Globales generales"},{"id":"D","text":"Consolidadas de salud"}],"answer":"D","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":4,"complexity":23,"confidence":"alta"},"2025-i-psicologia-q042":{"id":"2025-i-psicologia-q042","areaId":"area-psi-salud-publica","stem":"En el EESS el personal adquiere una reacción adversa a la presencia de un agente infeccioso que le produce una infección ocupacional, estamos hablando de:","options":[{"id":"A","text":"Reacción de estrés laboral"},{"id":"B","text":"Enfermedad infecciosa"},{"id":"C","text":"Infección asociada a la atención de salud"},{"id":"D","text":"Enfermedad ocupacional"}],"answer":"C","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":6,"complexity":24,"confidence":"media"},"2025-i-psicologia-q037":{"id":"2025-i-psicologia-q037","areaId":"area-psi-salud-publica","stem":"¿A qué fase del plan de salud local se articulan los planes operativos anuales de la municipalidad, de la Red de Salud y de la DIRESA?","options":[{"id":"A","text":"Planeamiento estratégico participativo de salud"},{"id":"B","text":"Programación de salud local"},{"id":"C","text":"Evaluación de las necesidades de la localidad"},{"id":"D","text":"Seguimiento de los resultados de la ejecución"}],"answer":"B","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":5,"complexity":25,"confidence":"alta"},"2026-i-psicologia-q072":{"id":"2026-i-psicologia-q072","areaId":"area-psi-salud-publica","stem":"La farmacovigilancia es una actividad de la ...... que se encarga de evaluar la efectividad del medicamento y dispone un sistema rápido de alerta a…","options":[{"id":"A","text":"salud pública / reacciones adversas."},{"id":"B","text":"epidemiología / farmacovigilancia."},{"id":"C","text":"vigilancia / reacciones adversas."},{"id":"D","text":"salud pública / vigilancia epidemiológica."}],"answer":"A","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":7,"complexity":25,"confidence":"alta"},"2025-i-psicologia-q094":{"id":"2025-i-psicologia-q094","areaId":"area-psi-salud-publica","stem":"Psicólogo que, al visitar su sector sanitario asignado, se da cuenta que han llegado nuevas familias a vivir de manera temporal, por motivos laborales. ¿Qué documento debe llenar al realizar la primera visita?","options":[{"id":"A","text":"Historia clínica"},{"id":"B","text":"Hoja de atención"},{"id":"C","text":"Censo"},{"id":"D","text":"Ficha familiar"}],"answer":"D","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":12,"complexity":26,"confidence":"alta"},"2026-ii-psicologia-q053":{"id":"2026-ii-psicologia-q053","areaId":"area-psi-salud-publica","stem":"¿Qué tipo de prevención consiste en realizar actividades sanitarias que buscan atenuar o evitar consecuencias de las intervenciones clínicas innecesarias o excesivas por parte del prestador de los servicios de salud?","options":[{"id":"A","text":"Terciaria"},{"id":"B","text":"Primaria"},{"id":"C","text":"Secundaria"},{"id":"D","text":"Cuaternaria"}],"answer":"D","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":6,"complexity":26,"confidence":"alta"},"2025-i-psicologia-q018":{"id":"2025-i-psicologia-q018","areaId":"area-psi-salud-publica","stem":"El equipo de psicología del EE.SS. realiza campaña de salud mental en las instituciones educativas de la comunidad de su jurisdicción. ¿Qué actividad de prioridad en salud pública está realizando?","options":[{"id":"A","text":"Defensa de la salud"},{"id":"B","text":"Restauración de la salud"},{"id":"C","text":"Promoción de la salud"},{"id":"D","text":"Cuidado de la salud"}],"answer":"C","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":3,"complexity":27,"confidence":"alta"},"2026-i-psicologia-q086":{"id":"2026-i-psicologia-q086","areaId":"area-psi-salud-publica","stem":"El personal de salud del primer nivel de atención realiza la capacitación a las personas y comunidad para que tengan el control de su salud, la mantengan y la mejoren. Son acciones que corresponde a:","options":[{"id":"A","text":"Participación comunitaria"},{"id":"B","text":"Promoción de la salud"},{"id":"C","text":"Familias saludables"},{"id":"D","text":"Entornos saludables"}],"answer":"B","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":9,"complexity":27,"confidence":"media"},"2026-ii-psicologia-q055":{"id":"2026-ii-psicologia-q055","areaId":"area-psi-salud-publica","stem":"El psicólogo, durante la articulación con los agentes comunitarios toma conocimiento de casos de violencia en la comunidad y desarrolla en el local comunal un taller interactivo de comunicación saludable con la participación…","options":[{"id":"A","text":"comunitaria."},{"id":"B","text":"municipal."},{"id":"C","text":"de familias."},{"id":"D","text":"del CEM."}],"answer":"A","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":6,"complexity":27,"confidence":"alta"},"2026-i-psicologia-q040":{"id":"2026-i-psicologia-q040","areaId":"area-psi-salud-publica","stem":"En una comunidad se reportan dos o más casos de una misma enfermedad y están relacionados entre sí, el personal de salud según criterio epidemiológico identifica que es:","options":[{"id":"A","text":"Brote"},{"id":"B","text":"Endemia"},{"id":"C","text":"Pandemia"},{"id":"D","text":"Epidemia"}],"answer":"A","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":4,"complexity":28,"confidence":"media"},"2026-i-psicologia-q048":{"id":"2026-i-psicologia-q048","areaId":"area-psi-salud-publica","stem":"Los pobladores de San Miguel participaron activamente con el personal de salud y las autoridades, logrando una política pública articulada de salud para la comunidad. Son acciones y resultados de:","options":[{"id":"A","text":"Municipio saludable"},{"id":"B","text":"Trabajo político de la comunidad"},{"id":"C","text":"Familias saludables"},{"id":"D","text":"Trabajo intersectorial en salud"}],"answer":"D","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":5,"complexity":28,"confidence":"media"},"2026-i-psicologia-q077":{"id":"2026-i-psicologia-q077","areaId":"area-psi-salud-publica","stem":"Ud. es jefe de un establecimiento I-4 en la región norte del país y los boletines informativos de epidemiología indican un aumento de casos de melanomas por exposición a rayos UV en el último año. ¿A qué tipo de casos corresponden?","options":[{"id":"A","text":"Prevalentes"},{"id":"B","text":"Probables"},{"id":"C","text":"Reincidentes"},{"id":"D","text":"Incidentes"}],"answer":"D","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":8,"complexity":28,"confidence":"media"},"2026-ii-psicologia-q069":{"id":"2026-ii-psicologia-q069","areaId":"area-psi-salud-publica","stem":"¿Cómo se denomina al proceso de enseñanza/aprendizaje mediante el uso de las TIC, efectuado por un personal especializado con competencias necesarias para ampliar conocimiento, habilidades y actitudes del personal de salud?","options":[{"id":"A","text":"Telemonitoreo"},{"id":"B","text":"Teleconsulta"},{"id":"C","text":"Teleinterconsulta"},{"id":"D","text":"Telecapacitación"}],"answer":"D","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":7,"complexity":28,"confidence":"media"},"2025-i-psicologia-q087":{"id":"2025-i-psicologia-q087","areaId":"area-psi-salud-publica","stem":"La acción social deberá favorecer la maduración colectiva a través de la toma de conciencia de los problemas y la participación de la comunidad en el proceso de mejoramiento de la situación. Es un principio de la:","options":[{"id":"A","text":"Determinante social"},{"id":"B","text":"Participación comunitaria"},{"id":"C","text":"Sectorización comunitaria"},{"id":"D","text":"Determinante ambiental"}],"answer":"B","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":11,"complexity":29,"confidence":"alta"},"2026-ii-psicologia-q063":{"id":"2026-ii-psicologia-q063","areaId":"area-psi-salud-publica","stem":"Para garantizar el acceso a la atención primaria de salud, desde el enfoque de salud pública en la gestión farmacéutica se debe promover herramientas de gestión de almacén; adquisiciones oportunas y ...","options":[{"id":"A","text":"acceso a la electricidad."},{"id":"B","text":"mejora de servicios de agua."},{"id":"C","text":"gestión de residuos sólidos."},{"id":"D","text":"uso racional de medicamentos."}],"answer":"D","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":7,"complexity":29,"confidence":"alta"},"2026-i-psicologia-q082":{"id":"2026-i-psicologia-q082","areaId":"area-psi-cuidado-integral","stem":"La empatía y el ...... son factores básicos que determinan la calidad de la interacción en la entrevista psicológica.","options":[{"id":"A","text":"enganche terapéutico"},{"id":"B","text":"entusiasmo"},{"id":"C","text":"rapport"},{"id":"D","text":"primer contacto"}],"answer":"C","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":8,"complexity":15,"confidence":"alta"},"2026-ii-psicologia-q075":{"id":"2026-ii-psicologia-q075","areaId":"area-psi-cuidado-integral","stem":"¿Cuál de los siguientes factores se asocia con mayor riesgo para desarrollar diabetes mellitus tipo 2?","options":[{"id":"A","text":"Control glucémico"},{"id":"B","text":"Consumo de alcohol"},{"id":"C","text":"Adherencia a la dieta"},{"id":"D","text":"Actividad física"}],"answer":"B","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":8,"complexity":16,"confidence":"alta"},"2026-i-psicologia-q028":{"id":"2026-i-psicologia-q028","areaId":"area-psi-cuidado-integral","stem":"Como parte de las intervenciones …… y psicoterapéuticas en gestantes, las visitas domiciliarias se realizan para evaluar el cuidado de la salud mental.","options":[{"id":"A","text":"comunitarias"},{"id":"B","text":"contextuales"},{"id":"C","text":"psicosociales"},{"id":"D","text":"sistémicas"}],"answer":"C","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":3,"complexity":19,"confidence":"media"},"2025-i-psicologia-q093":{"id":"2025-i-psicologia-q093","areaId":"area-psi-cuidado-integral","stem":"La atención primaria tiene como principio garantizar la cobertura y accesibilidad en salud con equidad a:","options":[{"id":"A","text":"Toda la población de escasos recursos"},{"id":"B","text":"Sólo a los individuos de la comunidad rural"},{"id":"C","text":"Todos los individuos y familias de la comunidad"},{"id":"D","text":"Sólo a los individuos de pandemia COVID"}],"answer":"C","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":12,"complexity":22,"confidence":"media"},"2026-i-psicologia-q076":{"id":"2026-i-psicologia-q076","areaId":"area-psi-cuidado-integral","stem":"Dentro de los aspectos legales en la atención de salud mental, el CEM, la Comisaría, la DEMUNA, el OMAPED, el CONADIS, entre otros; están dentro de las Redes comunitarias de salud mental ...","options":[{"id":"A","text":"terciarias."},{"id":"B","text":"cuaternarias."},{"id":"C","text":"primarias."},{"id":"D","text":"secundarias."}],"answer":"A","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":8,"complexity":23,"confidence":"alta"},"2025-i-psicologia-q097":{"id":"2025-i-psicologia-q097","areaId":"area-psi-cuidado-integral","stem":"¿Cómo se llama la técnica de la terapia cognitivo conductual que penaliza por llevar a cabo una conducta o acción desadaptativa y cuyos componentes son: restitución y práctica positiva?","options":[{"id":"A","text":"Coste de respuesta"},{"id":"B","text":"Castigo negativo"},{"id":"C","text":"Castigo positivo"},{"id":"D","text":"Sobrecorrección"}],"answer":"D","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":12,"complexity":24,"confidence":"media"},"2026-ii-psicologia-q042":{"id":"2026-ii-psicologia-q042","areaId":"area-psi-cuidado-integral","stem":"En el establecimiento de salud, la prevención combinada en poblaciones de alto riesgo de adquirir VIH: HSH, MT, TS y parejas serodiscordantes. Consiste en paquetes de intervención:","options":[{"id":"A","text":"Farmacológico y control"},{"id":"B","text":"Conductual y biomédicas"},{"id":"C","text":"Laboratorio y médico"},{"id":"D","text":"En atención y seguimiento"}],"answer":"B","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":5,"complexity":25,"confidence":"media"},"2026-ii-psicologia-q023":{"id":"2026-ii-psicologia-q023","areaId":"area-psi-cuidado-integral","stem":"En las estrategias de intervención, la vigilancia de factores de riesgo frente a la exposición de metales pesados y otras sustancias químicas, se desarrolla a través de vigilancia:","options":[{"id":"A","text":"Médica y laboratorial"},{"id":"B","text":"Intercultural y tradicional"},{"id":"C","text":"Sanitaria y epidemiológica"},{"id":"D","text":"Especializada e integral"}],"answer":"C","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":3,"complexity":26,"confidence":"alta"},"2026-ii-psicologia-q016":{"id":"2026-ii-psicologia-q016","areaId":"area-psi-cuidado-integral","stem":"En el centro de salud, el psicólogo realiza talleres para estimular de manera oportuna a las niñas/niños y favorecer el desarrollo psicomotriz cumpliendo con los lineamientos de la …… de salud en el cuidado…","options":[{"id":"A","text":"prevención / del niño."},{"id":"B","text":"promoción / infantil."},{"id":"C","text":"competencia / del niño."},{"id":"D","text":"intervención / infantil."}],"answer":"B","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":2,"complexity":28,"confidence":"alta"},"2026-ii-psicologia-q020":{"id":"2026-ii-psicologia-q020","areaId":"area-psi-cuidado-integral","stem":"Es muy importante que la consejería en lactancia materna se inicie desde el embarazo, por lo que las gestantes a partir de las …… semanas conocen la importancia y manejo de la lactancia materna y de esta forma incrementan su propia confianza y seguridad.","options":[{"id":"A","text":"32"},{"id":"B","text":"28"},{"id":"C","text":"24"},{"id":"D","text":"20"}],"answer":"A","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":2,"complexity":28,"confidence":"alta"},"2026-i-psicologia-q034":{"id":"2026-i-psicologia-q034","areaId":"area-psi-cuidado-integral","stem":"En el centro de salud se establece que los ambientes se encuentren adecuados y acondicionados para un lactario como parte de los cuidados …… en el periodo prenatal; que comprende la etapa preconcepcional, antes, durante y después del embarazo.","options":[{"id":"A","text":"locales"},{"id":"B","text":"comunitarios"},{"id":"C","text":"individuales"},{"id":"D","text":"familiares"}],"answer":"B","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":4,"complexity":29,"confidence":"alta"},"2026-i-psicologia-q063":{"id":"2026-i-psicologia-q063","areaId":"area-psi-cuidado-integral","stem":"Los profesionales de salud fueron vacunados y se le brindo consejería post vacunación sobre los posibles efectos adversos de la vacuna contra el dengue. ¿Cuánto tiempo de reposo y observación debe tener una persona después de haberse vacunado?","options":[{"id":"A","text":"10 minutos"},{"id":"B","text":"20 minutos"},{"id":"C","text":"30 minutos"},{"id":"D","text":"15 minutos"}],"answer":"C","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":7,"complexity":29,"confidence":"media"},"2026-i-psicologia-q100":{"id":"2026-i-psicologia-q100","areaId":"area-psi-cuidado-integral","stem":"El modelo del cuidado integral por curso de vida acoge atributos de la atención primaria; cuando incluye intervenciones individuales basadas en evidencia, incluyendo intervenciones familiares y comunitarios. ¿A que componente corresponde?","options":[{"id":"A","text":"Financiamiento"},{"id":"B","text":"Gestión"},{"id":"C","text":"Organización"},{"id":"D","text":"Prestación"}],"answer":"D","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":10,"complexity":29,"confidence":"alta"},"2026-i-psicologia-q005":{"id":"2026-i-psicologia-q005","areaId":"area-psi-cuidado-integral","stem":"El conjunto de procedimientos asistenciales a través del cual se asegura la continuidad de la atención de las necesidades de salud de los usuarios, transfiriéndolo del establecimiento de menor a mayor capacidad resolutiva, corresponde a:","options":[{"id":"A","text":"Contrarreferencia"},{"id":"B","text":"Atención compartida"},{"id":"C","text":"Referencia"},{"id":"D","text":"Atención primaria"}],"answer":"C","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":1,"complexity":30,"confidence":"media"},"2026-i-psicologia-q073":{"id":"2026-i-psicologia-q073","areaId":"area-psi-cuidado-integral","stem":"Las actividades que buscan la atención del problema de salud mental y físico de la persona usuaria y su cuidador, que se orientan a disminuir su sintomatología para mejorar su calidad de vida dentro de la continuidad de cuidados, pertenecen al componente:","options":[{"id":"A","text":"Psicosocial"},{"id":"B","text":"De gestión"},{"id":"C","text":"Emocional"},{"id":"D","text":"Clínico"}],"answer":"D","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":8,"complexity":30,"confidence":"alta"},"2026-ii-psicologia-q051":{"id":"2026-ii-psicologia-q051","areaId":"area-psi-cuidado-integral","stem":"La prevención combinada comprende el enfoque integral del VIH a partir de la administración simultánea de intervenciones estratégicas biomédicas, estructurales y conductuales; ésta última hace referencia a:","options":[{"id":"A","text":"Vacunación contra la hepatitis B"},{"id":"B","text":"Consejería pre test y de reducción de riesgos"},{"id":"C","text":"Acceso a preservativos y lubricantes"},{"id":"D","text":"Manejo de ITS (sindrómico y etiológico)"}],"answer":"B","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":5,"complexity":32,"confidence":"alta"},"2026-i-psicologia-q075":{"id":"2026-i-psicologia-q075","areaId":"area-psi-cuidado-integral","stem":"En el paquete de cuidado integral del adolescente, la consejería en salud mental es un factor ...","options":[{"id":"A","text":"psicológico."},{"id":"B","text":"protector."},{"id":"C","text":"biológico."},{"id":"D","text":"de riesgo."}],"answer":"B","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":8,"complexity":33,"confidence":"alta"},"2025-i-psicologia-q033":{"id":"2025-i-psicologia-q033","areaId":"area-psi-cuidado-integral","stem":"Los pacientes con problemas de salud mental como: alcoholismo, farmacodependencia, trastornos psiquiátricos y violencia familiar que es responsabilidad primaria de la familia y del estado; tienen derecho a:","options":[{"id":"A","text":"Recuperación, rehabilitación y promoción de su salud mental"},{"id":"B","text":"Orientación, consejería y tratamiento"},{"id":"C","text":"Promoción de su salud mental, consejería y tratamiento"},{"id":"D","text":"Rehabilitación, consejería y tratamiento"}],"answer":"A","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":5,"complexity":34,"confidence":"media"},"2026-ii-psicologia-q064":{"id":"2026-ii-psicologia-q064","areaId":"area-psi-cuidado-integral","stem":"¿Cómo se le denomina al conjunto ordenado de procedimientos asistenciales y administrativos, en el cual se asegura la continuidad de la atención del usuario, enviando desde la comunidad o IPRESS a otro de mayor capacidad resolutiva de manera oportuna?","options":[{"id":"A","text":"Admisión integral en salud"},{"id":"B","text":"Aseguramiento universal en salud"},{"id":"C","text":"Catálogo de procedimientos médicos y sanitarios"},{"id":"D","text":"Sistema de referencia y contrarreferencia"}],"answer":"D","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":7,"complexity":37,"confidence":"media"},"2026-i-psicologia-q011":{"id":"2026-i-psicologia-q011","areaId":"area-psi-cuidado-integral","stem":"¿Cuál es la relación de alianza psicólogo - paciente, que establece una colaboración, compenetración en el proceso de la atención psicológica?","options":[{"id":"A","text":"Exceso de curiosidad"},{"id":"B","text":"Empatía"},{"id":"C","text":"Romper el hielo"},{"id":"D","text":"Rapport"}],"answer":"D","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":2,"complexity":38,"confidence":"alta"},"2025-i-psicologia-q054":{"id":"2025-i-psicologia-q054","areaId":"area-psi-cuidado-integral","stem":"Convertir la entrevista diagnóstica en una larga lista de preguntas de diagnóstico, hace que la entrevista se vuelva mecánica y disminuya …… con el paciente.","options":[{"id":"A","text":"la conversación"},{"id":"B","text":"la continuidad"},{"id":"C","text":"el tema principal"},{"id":"D","text":"el rapport"}],"answer":"D","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":7,"complexity":40,"confidence":"alta"},"2026-i-psicologia-q018":{"id":"2026-i-psicologia-q018","areaId":"area-psi-cuidado-integral","stem":"Dentro del paquete integral de salud del adulto mujer. ¿Qué atenciones preventivas se realizan?","options":[{"id":"A","text":"Identificación de síndrome de maltrato"},{"id":"B","text":"Atención de violencia familiar"},{"id":"C","text":"Tratamiento de algún daño prevalente"},{"id":"D","text":"Despistaje de Sífilis, VIH/SIDA, cáncer de cérvix"}],"answer":"D","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":2,"complexity":40,"confidence":"alta"},"2026-i-psicologia-q023":{"id":"2026-i-psicologia-q023","areaId":"area-psi-cuidado-integral","stem":"La evaluación continua del recién nacido hospitalizado cuya madre tuvo ITU o ITS antes del parto, corresponde a una vigilancia epidemiológica de las IAAS de tipo ...","options":[{"id":"A","text":"pasiva."},{"id":"B","text":"selectiva."},{"id":"C","text":"activa."},{"id":"D","text":"focalizada."}],"answer":"B","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":3,"complexity":40,"confidence":"media"},"2026-i-psicologia-q030":{"id":"2026-i-psicologia-q030","areaId":"area-psi-cuidado-integral","stem":"En un establecimiento de salud de primer nivel, se presenta a consulta un niño de 2 años, la madre indica que llora toda la noche y no responde a estímulos. ¿Qué tamizaje se debe realizar?","options":[{"id":"A","text":"SQR18"},{"id":"B","text":"NNA"},{"id":"C","text":"MCHAT-R"},{"id":"D","text":"PHQ-9"}],"answer":"C","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":3,"complexity":42,"confidence":"media"},"2026-ii-psicologia-q030":{"id":"2026-ii-psicologia-q030","areaId":"area-psi-cuidado-integral","stem":"Madre de niño diagnosticado con anemia, solicita se lo refiera para ser atendido por nutricionista, para mejorar su esquema de alimentación. ¿A qué nivel de atención pertenece dicho profesional?","options":[{"id":"A","text":"I-2"},{"id":"B","text":"I-3"},{"id":"C","text":"I-4"},{"id":"D","text":"I-1"}],"answer":"C","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":3,"complexity":42,"confidence":"alta"},"2026-ii-psicologia-q035":{"id":"2026-ii-psicologia-q035","areaId":"area-psi-etica","stem":"El derecho del usuario en salud a contar con una segunda opinión médica. ¿A qué derecho corresponde?","options":[{"id":"A","text":"Consentimiento informado"},{"id":"B","text":"Acceso a servicios de salud"},{"id":"C","text":"Atención y recuperación en salud"},{"id":"D","text":"Acceso de información"}],"answer":"B","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":4,"complexity":17,"confidence":"media"},"2025-i-psicologia-q036":{"id":"2025-i-psicologia-q036","areaId":"area-psi-etica","stem":"Las costumbres, las preferencias, los gustos, los vestidos, formas y estilos de arte, creencias, tabúes y prohibiciones; son manifestaciones de:","options":[{"id":"A","text":"Patrones culturales"},{"id":"B","text":"Deontología profesional"},{"id":"C","text":"Medicina tradicional"},{"id":"D","text":"Interculturalidad"}],"answer":"A","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":5,"complexity":20,"confidence":"media"},"2025-i-psicologia-q026":{"id":"2025-i-psicologia-q026","areaId":"area-psi-etica","stem":"El código de ética de la función pública prescribe ocho principios: respeto, probidad, eficiencia, idoneidad, ……, lealtad y obediencia, justicia y equidad, así como lealtad al estado de derecho.","options":[{"id":"A","text":"compromiso"},{"id":"B","text":"puntualidad"},{"id":"C","text":"progreso"},{"id":"D","text":"veracidad"}],"answer":"D","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":4,"complexity":23,"confidence":"alta"},"2025-i-psicologia-q086":{"id":"2025-i-psicologia-q086","areaId":"area-psi-etica","stem":"Los aspectos legales en la atención de salud mental contenidos en el código de ética del Colegio de Psicólogos del Perú, tienen los siguientes principios:","options":[{"id":"A","text":"Deber - responsabilidad - idoneidad"},{"id":"B","text":"Rol - profesionalismo - justicia"},{"id":"C","text":"Probidad - idoneidad - profesionalismo"},{"id":"D","text":"Libertad - justicia - probidad"}],"answer":"C","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":11,"complexity":25,"confidence":"alta"},"2026-ii-psicologia-q012":{"id":"2026-ii-psicologia-q012","areaId":"area-psi-etica","stem":"¿Cómo se le define a la situación en la que todas las personas puedan ejercer sus derechos, aprovechar sus habilidades y tomar ventaja de las oportunidades que se encuentran en su medio?","options":[{"id":"A","text":"Identidad cultural"},{"id":"B","text":"Inclusión social"},{"id":"C","text":"Programa social"},{"id":"D","text":"Salud intercultural"}],"answer":"B","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":2,"complexity":25,"confidence":"media"},"2025-i-psicologia-q012":{"id":"2025-i-psicologia-q012","areaId":"area-psi-etica","stem":"En muchos casos este mundo puede y tiene caminos de diálogo con la ciencia moderna, como en la implementación de servicios de salud con pertinencia intercultural para la atención del parto los cuales incorporan, por ejemplo, el …… o el uso de plantas medicinales.","options":[{"id":"A","text":"internamiento"},{"id":"B","text":"parto vertical"},{"id":"C","text":"parto convencional"},{"id":"D","text":"aborto"}],"answer":"B","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":2,"complexity":32,"confidence":"alta"},"2026-i-psicologia-q007":{"id":"2026-i-psicologia-q007","areaId":"area-psi-etica","stem":"Paciente migrante gestante quechua hablante, tiene derecho a …… para parto vertical.","options":[{"id":"A","text":"acompañamiento de familia"},{"id":"B","text":"traductor de idioma original"},{"id":"C","text":"presencia solo de pareja"},{"id":"D","text":"servicios de salud con adecuación cultural"}],"answer":"D","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":1,"complexity":36,"confidence":"alta"},"2026-ii-psicologia-q077":{"id":"2026-ii-psicologia-q077","areaId":"area-psi-etica","stem":"De acuerdo a la norma técnica para la promoción del parto vertical con enfoque intercultural. ¿Qué aspecto debe tener en cuenta el profesional de salud?","options":[{"id":"A","text":"Contacto piel a piel de la madre con el recién nacido"},{"id":"B","text":"Seguimiento de la gestante y promoción del parto"},{"id":"C","text":"El acceso a la población alto andina y amazónica"},{"id":"D","text":"Control del post parto en el establecimiento de salud"}],"answer":"C","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":8,"complexity":37,"confidence":"alta"},"2025-i-psicologia-q076":{"id":"2025-i-psicologia-q076","areaId":"area-psi-etica","stem":"El código de ética del psicólogo, en el capítulo del tratamiento de los usuarios. El psicólogo debe rechazar toda orden o disposición que obliguen a contravenir las normas de la ética y …… profesional.","options":[{"id":"A","text":"compromiso"},{"id":"B","text":"función"},{"id":"C","text":"deontología"},{"id":"D","text":"competencia"}],"answer":"C","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":10,"complexity":44,"confidence":"alta"},"2026-i-psicologia-q014":{"id":"2026-i-psicologia-q014","areaId":"area-psi-etica","stem":"En el establecimiento de salud al paciente adulto se le brinda el consentimiento informado, donde se le explica en forma clara los procedimientos que se le realizará. ¿Qué aspectos éticos se está respetando?","options":[{"id":"A","text":"Justicia"},{"id":"B","text":"Beneficencia"},{"id":"C","text":"Autonomía"},{"id":"D","text":"Maleficencia"}],"answer":"C","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":2,"complexity":45,"confidence":"alta"},"2026-i-psicologia-q041":{"id":"2026-i-psicologia-q041","areaId":"area-psi-etica","stem":"Los valores de la equidad y la solidaridad social, y el derecho de todo ser humano a gozar del grado máximo de salud que se pueda lograr sin distinción de raza, religión, ideología política, condición económica y social; forman parte de un sistema sanitario basado en la atención...","options":[{"id":"A","text":"complementaria de salud."},{"id":"B","text":"integrada de salud."},{"id":"C","text":"primaria de salud."},{"id":"D","text":"secundaria de salud."}],"answer":"C","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":4,"complexity":46,"confidence":"media"},"2026-ii-psicologia-q017":{"id":"2026-ii-psicologia-q017","areaId":"area-psi-etica","stem":"¿Cómo se le denomina a la metodología que está orientada a facilitar el acuerdo y la articulación entre los representantes del sistema de salud biomédico y de la medicina tradicional; permitiendo un aprendizaje mutuo y abordaje de los determinantes socioculturales de la salud?","options":[{"id":"A","text":"Medicina popular"},{"id":"B","text":"Promoción de la interculturalidad"},{"id":"C","text":"Salud intercultural"},{"id":"D","text":"Diálogo intercultural en salud"}],"answer":"D","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":2,"complexity":47,"confidence":"alta"},"2026-i-psicologia-q097":{"id":"2026-i-psicologia-q097","areaId":"area-psi-etica","stem":"Paciente de 25 años esperando su atención en el centro de salud; el personal lo llama por su apellido y le menciona “Ud. debe alimentarse mejor por su TBC” frente a los usuarios que se encuentran en la sala de espera. ¿Qué derecho del paciente se está vulnerando?","options":[{"id":"A","text":"Privacidad"},{"id":"B","text":"Confidencialidad"},{"id":"C","text":"Autonomía"},{"id":"D","text":"Transparencia"}],"answer":"B","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":10,"complexity":51,"confidence":"media"},"2025-i-psicologia-q067":{"id":"2025-i-psicologia-q067","areaId":"area-psi-etica","stem":"En una provincia del Perú, se atendió el parto a mujer de 30 años, la psicóloga que atiende, consulta a la paciente si desea que la placenta se les entregue a los familiares. De acuerdo al enfoque intercultural en salud. ¿Qué permite mejorar?","options":[{"id":"A","text":"Medicina tradicional"},{"id":"B","text":"Su recuperación"},{"id":"C","text":"El acceso a centros comunales"},{"id":"D","text":"El acceso a los servicios de salud"}],"answer":"D","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":9,"complexity":60,"confidence":"alta"},"2026-ii-psicologia-q082":{"id":"2026-ii-psicologia-q082","areaId":"area-psi-etica","stem":"Paciente con claros signos de violencia de género, referido al CSMC y el personal de salud le informa de manera clara y precisa que va a ser atendida por Medicina, Enfermería, Psicología y Psiquiatría, así como recibirá todos los procedimientos correspondientes a su caso; para lo cual es necesario solicitar:","options":[{"id":"A","text":"Carta de pertinencia cultural"},{"id":"B","text":"Consentimiento informado"},{"id":"C","text":"Decreto legal"},{"id":"D","text":"Carta informativa"}],"answer":"B","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":9,"complexity":69,"confidence":"alta"},"2026-i-psicologia-q066":{"id":"2026-i-psicologia-q066","areaId":"area-psi-etica","stem":"Varón de 36 años, al ingresar a su consulta médica siente que es discriminado por el profesional médico, por ser código blanco, quien le atiende con una gran indiferencia y poca comunicación. Esta acción es cuestionada por el paciente. Para que él usuario no se sienta afectado se debe ...","options":[{"id":"A","text":"aceptar la condición del paciente."},{"id":"B","text":"brindar un trato digno y humanizado."},{"id":"C","text":"indicar donde debe tomar asiento."},{"id":"D","text":"disimular el rechazo al paciente."}],"answer":"B","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":7,"complexity":70,"confidence":"media"},"2026-ii-psicologia-q099":{"id":"2026-ii-psicologia-q099","areaId":"area-psi-etica","stem":"Adolescente de 14 años llega acompañada de su madre, la que manifiesta: “Todos los días, mi hija llega del colegio con dolores de cabeza, con ganas de llorar y se pone a dormir toda la tarde; la hemos llevado a la curandera y ha dicho que es mal de ojo y siempre tenemos que pasarle el huevo para que no siga así; desde que ha tenido una discusión con su compañera está así”. El psicólogo considera incluir dentro del plan de tratamiento dicha acción mientras trabaja con pensamientos y habilidades sociales. Esto es un ejemplo de:","options":[{"id":"A","text":"Diálogo intercultural"},{"id":"B","text":"Medicina alternativa"},{"id":"C","text":"Medicina tradicional"},{"id":"D","text":"Interculturalidad en salud"}],"answer":"D","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":10,"complexity":70,"confidence":"alta"},"2026-ii-psicologia-q081":{"id":"2026-ii-psicologia-q081","areaId":"area-psi-etica","stem":"Dentro de los principios ético-médicos pragmáticos. Informar ampliamente al paciente o sus representantes, la evolución del padecimiento, de acuerdo con la historia natural de la enfermedad, riesgos y posibles beneficios, para que el paciente pueda determinar en consecuencia. ¿Qué principio se aplica?","options":[{"id":"A","text":"Autonomía"},{"id":"B","text":"Confidencialidad"},{"id":"C","text":"Humanitarismo"},{"id":"D","text":"Veracidad"}],"answer":"A","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":9,"complexity":74,"confidence":"alta"},"2026-ii-psicologia-q085":{"id":"2026-ii-psicologia-q085","areaId":"area-psi-investigacion","stem":"El “consentimiento informado” es el primer indicador de mayor atención en la …… de investigación.","options":[{"id":"A","text":"discusión"},{"id":"B","text":"ética"},{"id":"C","text":"metodología"},{"id":"D","text":"interculturalidad"}],"answer":"B","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":9,"complexity":13,"confidence":"alta"},"2025-i-psicologia-q024":{"id":"2025-i-psicologia-q024","areaId":"area-psi-investigacion","stem":"La investigación …… hace uso de test estandarizados con buena validez y confiabilidad, así como contrasta sus hipótesis.","options":[{"id":"A","text":"cuantitativa"},{"id":"B","text":"mixta"},{"id":"C","text":"cualitativa"},{"id":"D","text":"correlacional"}],"answer":"A","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":4,"complexity":15,"confidence":"alta"},"2026-i-psicologia-q029":{"id":"2026-i-psicologia-q029","areaId":"area-psi-investigacion","stem":"¿Cuál de las siguientes características no es considerada para la validación de un cuestionario, como herramienta de recolección de datos?","options":[{"id":"A","text":"Aplicabilidad"},{"id":"B","text":"Fiabilidad"},{"id":"C","text":"Viabilidad"},{"id":"D","text":"Consistencia interna"}],"answer":"A","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":3,"complexity":18,"confidence":"alta"},"2026-ii-psicologia-q049":{"id":"2026-ii-psicologia-q049","areaId":"area-psi-investigacion","stem":"En una investigación en donde se pretende comparar la eficacia de dos tratamientos para niños con anemia perniciosa, estamos hablando del tipo de investigación…","options":[{"id":"A","text":"descriptiva."},{"id":"B","text":"prospectiva."},{"id":"C","text":"analítica."},{"id":"D","text":"predictiva."}],"answer":"C","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":5,"complexity":20,"confidence":"alta"},"2026-i-psicologia-q036":{"id":"2026-i-psicologia-q036","areaId":"area-psi-investigacion","stem":"Para realizar un trabajo de investigación y obtener información de las exposiciones anteriores y actuales. ¿Qué tipo de recolección de datos se debe realizar?","options":[{"id":"A","text":"Informante indirecto"},{"id":"B","text":"Entrevista"},{"id":"C","text":"Observación familiar"},{"id":"D","text":"Observación"}],"answer":"B","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":4,"complexity":21,"confidence":"alta"},"2026-ii-psicologia-q021":{"id":"2026-ii-psicologia-q021","areaId":"area-psi-investigacion","stem":"¿Qué tipo de muestreo es aquel en el cual el investigador, en el momento de la selección muestral, solo selecciona unidades muestrales basado en su punto de vista?","options":[{"id":"A","text":"Aleatorio simple"},{"id":"B","text":"Por conglomerados"},{"id":"C","text":"Sistemático"},{"id":"D","text":"No probabilístico"}],"answer":"D","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":3,"complexity":21,"confidence":"media"},"2026-ii-psicologia-q028":{"id":"2026-ii-psicologia-q028","areaId":"area-psi-investigacion","stem":"En el informe de investigación, la parte que contiene de manera suscinta toda la información de la investigación realizada y tiene un límite de palabras, se denomina:","options":[{"id":"A","text":"Conclusiones"},{"id":"B","text":"Discusión"},{"id":"C","text":"Introducción"},{"id":"D","text":"Resumen"}],"answer":"D","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":3,"complexity":21,"confidence":"media"},"2026-ii-psicologia-q043":{"id":"2026-ii-psicologia-q043","areaId":"area-psi-investigacion","stem":"En la muestra de una investigación, se desea determinar la prevalencia de un problema de salud para identificar su utilidad, ventaja y desventaja; se trata de un estudio:","options":[{"id":"A","text":"Analítico"},{"id":"B","text":"Descriptivo"},{"id":"C","text":"Experimental"},{"id":"D","text":"Predictivo"}],"answer":"B","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":5,"complexity":21,"confidence":"alta"},"2026-i-psicologia-q092":{"id":"2026-i-psicologia-q092","areaId":"area-psi-investigacion","stem":"El análisis de los datos depende al menos de los siguientes factores: el nivel de medición de las variables, el diseño de investigación utilizado y el ...","options":[{"id":"A","text":"tipo de hipótesis formulada."},{"id":"B","text":"diseño de los objetivos."},{"id":"C","text":"estadístico utilizado."},{"id":"D","text":"resultado hallado."}],"answer":"A","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":9,"complexity":22,"confidence":"alta"},"2026-i-psicologia-q009":{"id":"2026-i-psicologia-q009","areaId":"area-psi-investigacion","stem":"Al realizar un trabajo de investigación sobre higiene bucal, el investigador brinda los cepillos dentales a unos y a otros que ellos mismos se los compren. ¿Qué principio ético básico está siendo vulnerado?","options":[{"id":"A","text":"Respeto"},{"id":"B","text":"Maleficencia"},{"id":"C","text":"Justicia"},{"id":"D","text":"Autonomía"}],"answer":"C","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":1,"complexity":25,"confidence":"alta"},"2026-i-psicologia-q037":{"id":"2026-i-psicologia-q037","areaId":"area-psi-investigacion","stem":"¿Cuál es una de las fases más importantes de una investigación, en la que se determina cómo analizar los datos y qué herramientas de análisis estadístico son adecuadas para este propósito?","options":[{"id":"A","text":"Análisis de datos"},{"id":"B","text":"Discusión"},{"id":"C","text":"Introducción a la investigación"},{"id":"D","text":"Resultados"}],"answer":"A","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":4,"complexity":25,"confidence":"alta"},"2026-ii-psicologia-q054":{"id":"2026-ii-psicologia-q054","areaId":"area-psi-investigacion","stem":"En una investigación a los pobladores de un caserío se analizan las expresiones brindadas para ser ensambladas, reagrupadas o repartidas en expresiones que reflejen la realidad estudiada. Es una investigación…","options":[{"id":"A","text":"cuantitativa."},{"id":"B","text":"mixta."},{"id":"C","text":"cualitativa."},{"id":"D","text":"experiencial."}],"answer":"C","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":6,"complexity":26,"confidence":"media"},"2025-i-psicologia-q055":{"id":"2025-i-psicologia-q055","areaId":"area-psi-investigacion","stem":"Mientras que la investigación …… explica una mayor comprensión de un fenómeno a través de la recolección intensiva de datos narrativos, la investigación …… predice y/o controla un fenómeno a través de la recolección de datos numéricos.","options":[{"id":"A","text":"cualitativa - cuantitativa"},{"id":"B","text":"correlacional - cuantitativa"},{"id":"C","text":"cualitativa - correlacional"},{"id":"D","text":"cuantitativa - cualitativa"}],"answer":"A","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":7,"complexity":32,"confidence":"alta"},"2026-ii-psicologia-q026":{"id":"2026-ii-psicologia-q026","areaId":"area-psi-investigacion","stem":"En el CS se ha determinado un problema de investigación para lo cual se ha desarrollado un cuestionario estructurado para ser aplicado al estudio de niños con anemia para determinar la cantidad de casos y tipos de anemia. ¿Qué es el cuestionario estructurado?","options":[{"id":"A","text":"Prueba de normalidad"},{"id":"B","text":"Propiedades psicométricas"},{"id":"C","text":"Instrumento de recolección de datos"},{"id":"D","text":"Métodos de confiabilidad"}],"answer":"C","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":3,"complexity":35,"confidence":"alta"},"2026-i-psicologia-q050":{"id":"2026-i-psicologia-q050","areaId":"area-psi-investigacion","stem":"Mujer de 46 años, con tamizaje falso positivo en cáncer de mama, requiere más mamografías para determinar su estudio, las investigaciones demuestran que con instrumentos específicos se han encontrado:","options":[{"id":"A","text":"Sosiego y silencio"},{"id":"B","text":"Ansiedad y estrés"},{"id":"C","text":"Afonía y tranquilidad"},{"id":"D","text":"Angustia y euforia"}],"answer":"B","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":5,"complexity":46,"confidence":"media"},"2026-i-psicologia-q010":{"id":"2026-i-psicologia-q010","areaId":"area-psi-investigacion","stem":"Para estimar el cálculo del número de individuos necesario para realizar un estudio de investigación transversal, es imprescindible conocer la variabilidad del parámetro que se desea estimar basado en datos propios, de otras investigaciones o de un estudio piloto a través de la varianza. ¿Cuál es el enfoque del estudio?","options":[{"id":"A","text":"Cualitativo"},{"id":"B","text":"Cuantitativo"},{"id":"C","text":"Mixto"},{"id":"D","text":"Prospectivo"}],"answer":"B","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":1,"complexity":47,"confidence":"alta"},"2026-i-psicologia-q059":{"id":"2026-i-psicologia-q059","areaId":"area-psi-investigacion","stem":"En estudios clínicos y epidemiológicos, la medición de variables que incluyan la perspectiva del paciente con referencia a resultados relacionados a su calidad de vida. ¿Cuáles son los instrumentos de recolección de datos más indicados?","options":[{"id":"A","text":"Registros y documentos ya existentes"},{"id":"B","text":"Entrevistas y cuestionarios"},{"id":"C","text":"Observación directa e indirecta"},{"id":"D","text":"Registro por el paciente y familiar"}],"answer":"B","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":6,"complexity":54,"confidence":"alta"},"2026-i-psicologia-q002":{"id":"2026-i-psicologia-q002","areaId":"area-psi-investigacion","stem":"El Serumista que forma parte del equipo multidisciplinario en una investigación, debe priorizar el cuidado de los alcances de la investigación, el cuidado de los participantes y el cuidado de la vida, utilizando debidamente el consentimiento informado, los instrumentos y protocolos según el tipo de investigación, con atención del respeto por la diversidad, las culturas, y la humanización en su actuación. Esto hace referencia a:","options":[{"id":"A","text":"Respeto de estándares en la investigación"},{"id":"B","text":"Prohibición del plagio en la investigación"},{"id":"C","text":"Responsabilidad científica y presentación de resultados"},{"id":"D","text":"Investigación y respeto de normas y principios"}],"answer":"A","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":1,"complexity":64,"confidence":"alta"},"2026-ii-psicologia-q046":{"id":"2026-ii-psicologia-q046","areaId":"area-psi-gestion","stem":"La programación del Plan Operativo Institucional, le corresponde a:","options":[{"id":"A","text":"Establecimiento de salud"},{"id":"B","text":"Zona sanitaria"},{"id":"C","text":"Unidad ejecutora"},{"id":"D","text":"Área sanitaria"}],"answer":"C","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":5,"complexity":11,"confidence":"alta"},"2026-i-psicologia-q093":{"id":"2026-i-psicologia-q093","areaId":"area-psi-gestion","stem":"Para garantizar el adecuado desempeño de los recursos humanos de su establecimiento de salud. ¿Qué se debe considerar?","options":[{"id":"A","text":"Virtudes"},{"id":"B","text":"Competencias"},{"id":"C","text":"Valores"},{"id":"D","text":"Caracteres"}],"answer":"B","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":9,"complexity":15,"confidence":"alta"},"2026-i-psicologia-q094":{"id":"2026-i-psicologia-q094","areaId":"area-psi-gestion","stem":"¿Con qué se determina el número de la historia clínica de una persona de nacionalidad peruana?","options":[{"id":"A","text":"Pasaporte"},{"id":"B","text":"Según número de ingreso"},{"id":"C","text":"Carnet de extranjería"},{"id":"D","text":"Documento Nacional de Identidad"}],"answer":"D","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":9,"complexity":15,"confidence":"alta"},"2026-i-psicologia-q055":{"id":"2026-i-psicologia-q055","areaId":"area-psi-gestion","stem":"¿Cuál es la herramienta de gestión considerada como la razón de ser de una entidad y está estrechamente alineada con los objetivos?","options":[{"id":"A","text":"FODA"},{"id":"B","text":"Política de calidad"},{"id":"C","text":"Misión"},{"id":"D","text":"Visión"}],"answer":"C","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":6,"complexity":17,"confidence":"media"},"2026-i-psicologia-q099":{"id":"2026-i-psicologia-q099","areaId":"area-psi-gestion","stem":"¿A qué se hace referencia cuando se habla del conjunto de creencias, costumbres y valores de una organización?","options":[{"id":"A","text":"Organización laboral"},{"id":"B","text":"Clima organizacional"},{"id":"C","text":"Sistema de salud"},{"id":"D","text":"Cultura organizacional"}],"answer":"D","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":10,"complexity":17,"confidence":"alta"},"2025-i-psicologia-q070":{"id":"2025-i-psicologia-q070","areaId":"area-psi-gestion","stem":"En un establecimiento de salud, los valores, prácticas compartidas, líderes, normas y comunicación; son elementos de…","options":[{"id":"A","text":"clima organizacional."},{"id":"B","text":"directiva organizacional."},{"id":"C","text":"visión organizacional."},{"id":"D","text":"la cultura organizacional."}],"answer":"D","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":9,"complexity":18,"confidence":"media"},"2026-ii-psicologia-q083":{"id":"2026-ii-psicologia-q083","areaId":"area-psi-gestion","stem":"En una unidad ejecutora. ¿Qué oficina se encarga de coordinar, ejecutar y diseñar los programas de fortalecimiento de capacidades del capital humano?","options":[{"id":"A","text":"Organización y racionalización"},{"id":"B","text":"Planeamiento estratégico"},{"id":"C","text":"Desarrollo institucional"},{"id":"D","text":"Recursos humanos"}],"answer":"D","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":9,"complexity":22,"confidence":"alta"},"2025-i-psicologia-q060":{"id":"2025-i-psicologia-q060","areaId":"area-psi-gestion","stem":"En el marco del ciclo de planeamiento estratégico la fase ...... es la encargada del diseño de objetivos y acciones estratégicas sectoriales en consistencia, alineamiento y coherencia con la definición de objetivos.","options":[{"id":"A","text":"3"},{"id":"B","text":"1"},{"id":"C","text":"4"},{"id":"D","text":"2"}],"answer":"A","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":8,"complexity":23,"confidence":"alta"},"2025-i-psicologia-q095":{"id":"2025-i-psicologia-q095","areaId":"area-psi-gestion","stem":"Psicóloga apoya en el inventario de farmacia en el establecimiento de salud y se observa que hay dos medicamentos vencidos. ¿Qué debe hacer?","options":[{"id":"A","text":"Considerar en el stock"},{"id":"B","text":"Sustituir el medicamento inmediatamente"},{"id":"C","text":"Eliminar inmediatamente"},{"id":"D","text":"Informar al responsable para su baja respectiva"}],"answer":"D","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":12,"complexity":23,"confidence":"media"},"2026-ii-psicologia-q092":{"id":"2026-ii-psicologia-q092","areaId":"area-psi-gestion","stem":"¿Qué es lo que se debe solicitar y consignar en la historia clínica antes de la atención a un menor de edad para garantizar la admisión integral en salud?","options":[{"id":"A","text":"Boleta de pago en caja"},{"id":"B","text":"Datos del padre o apoderado"},{"id":"C","text":"Financiamiento de la prestación"},{"id":"D","text":"Motivo de consulta"}],"answer":"B","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":10,"complexity":23,"confidence":"alta"},"2026-i-psicologia-q042":{"id":"2026-i-psicologia-q042","areaId":"area-psi-gestion","stem":"El CS desea que todos sus trabajadores tengan valores fundamentales inviolables para conducirse y responder al entorno así como la imagen sugerente de su futuro como organización. Es definición de ...","options":[{"id":"A","text":"planeamiento."},{"id":"B","text":"valores."},{"id":"C","text":"misión."},{"id":"D","text":"visión."}],"answer":"D","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":5,"complexity":24,"confidence":"media"},"2025-i-psicologia-q008":{"id":"2025-i-psicologia-q008","areaId":"area-psi-gestion","stem":"En la gestión de calidad, la auditoría …… lo realiza el propio establecimiento, mientras cuando lo hace una instancia superior, sea otra IPRESS o comité especial, se denomina auditoría…","options":[{"id":"A","text":"externa / dirimente."},{"id":"B","text":"propia / general."},{"id":"C","text":"simple / especializada."},{"id":"D","text":"interna / externa."}],"answer":"D","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":2,"complexity":25,"confidence":"alta"},"2026-i-psicologia-q016":{"id":"2026-i-psicologia-q016","areaId":"area-psi-gestion","stem":"Cuando un equipo de trabajo se reúne para mejorar la calidad de sus actividades asistenciales, genera su misión, visión y valores que deben ser compartidos por todos; se está generando una:","options":[{"id":"A","text":"Cultura organizacional"},{"id":"B","text":"Calidad de servicios"},{"id":"C","text":"Mejora continua"},{"id":"D","text":"Capacidad resolutiva"}],"answer":"A","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":2,"complexity":25,"confidence":"alta"},"2025-i-psicologia-q032":{"id":"2025-i-psicologia-q032","areaId":"area-psi-gestion","stem":"Al psicólogo se le solicita trabajar el clima organizacional del establecimiento de salud. La adecuación de la encuesta, así como la preparación técnica de la medición del clima organizacional, forman parte de la fase de…","options":[{"id":"A","text":"evaluación."},{"id":"B","text":"seguimiento."},{"id":"C","text":"planificación."},{"id":"D","text":"intervención."}],"answer":"C","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":4,"complexity":27,"confidence":"alta"},"2026-i-psicologia-q031":{"id":"2026-i-psicologia-q031","areaId":"area-psi-gestion","stem":"En el contexto de la administración de los servicios de salud, la ausencia de trabajo colaborativo contribuye a explicar que en una localidad exista…","options":[{"id":"A","text":"disponibilidad de servicios de salud esenciales."},{"id":"B","text":"duplicidad de recursos tecnológicos y humanos."},{"id":"C","text":"liderazgo de los servicios de salud."},{"id":"D","text":"mejora de la calidad de los servicios de salud."}],"answer":"B","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":3,"complexity":27,"confidence":"alta"},"2026-ii-psicologia-q060":{"id":"2026-ii-psicologia-q060","areaId":"area-psi-gestion","stem":"¿En qué documento de gestión se hacen los cambios en la programación de las metas físicas, incorporación o inactivación de actividades operativas por cambios en el entorno, cumplimiento de nuevas disposiciones emitidas por el ejecutivo o legislativo?","options":[{"id":"A","text":"ASIS"},{"id":"B","text":"POI"},{"id":"C","text":"PSL"},{"id":"D","text":"PEI"}],"answer":"B","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":6,"complexity":28,"confidence":"media"},"2025-i-psicologia-q096":{"id":"2025-i-psicologia-q096","areaId":"area-psi-gestion","stem":"El MOF es un documento normativo, que describe funciones …… a nivel de cargo o puesto de trabajo desarrolladas a partir de la estructura orgánica y funciones generales establecidas en el reglamento de organización y funciones de cada institución.","options":[{"id":"A","text":"compuestas"},{"id":"B","text":"específicas"},{"id":"C","text":"integradas"},{"id":"D","text":"flexibles"}],"answer":"B","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":12,"complexity":29,"confidence":"media"},"2026-ii-psicologia-q003":{"id":"2026-ii-psicologia-q003","areaId":"area-psi-gestion","stem":"La auditoría de calidad de atención en salud, está diseñada principalmente para proteger los …… de los usuarios en salud, estableciendo mecanismos y plazos concretos para responder oportunamente a la organización, sociedad y profesionales de la salud.","options":[{"id":"A","text":"deberes"},{"id":"B","text":"servicios"},{"id":"C","text":"intereses"},{"id":"D","text":"derechos"}],"answer":"D","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":1,"complexity":29,"confidence":"alta"},"2026-ii-psicologia-q045":{"id":"2026-ii-psicologia-q045","areaId":"area-psi-gestion","stem":"El equipo de gestión, va a actualizar los documentos de gestión de su establecimiento de salud. Para poder elaborar su …… institucional, debe de responder las preguntas: ¿Qué quiero?, ¿A quién dirigirme?, ¿Para qué estoy?, ¿A dónde quiero ir?, ¿Cómo quiero ir?, ¿Cuándo?","options":[{"id":"A","text":"visión"},{"id":"B","text":"valor"},{"id":"C","text":"misión"},{"id":"D","text":"objetivo"}],"answer":"A","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":5,"complexity":29,"confidence":"media"},"2026-ii-psicologia-q047":{"id":"2026-ii-psicologia-q047","areaId":"area-psi-gestion","stem":"¿En qué etapa de la auditoría de la calidad de la atención en salud se encuentra el acordar con los involucrados un plan de implementación de las recomendaciones, precisando objetivos, metas, plazos y responsabilidades?","options":[{"id":"A","text":"Planeamiento"},{"id":"B","text":"Elaboración del informe final"},{"id":"C","text":"Autoevaluación"},{"id":"D","text":"Seguimiento de las recomendaciones"}],"answer":"D","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":5,"complexity":29,"confidence":"media"},"2025-i-psicologia-q041":{"id":"2025-i-psicologia-q041","areaId":"area-psi-gestion","stem":"En el 2026 el Centro de Salud \"Chosica\" será líder en la atención primaria en salud con calidad, calidez, equidad y eficiencia, logrando usuarios internos y externos satisfechos para conseguir estilos de vida saludables. Esto constituye la ...... de la institución.","options":[{"id":"A","text":"meta"},{"id":"B","text":"visión"},{"id":"C","text":"estrategia"},{"id":"D","text":"misión"}],"answer":"B","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":6,"complexity":30,"confidence":"alta"},"2026-i-psicologia-q081":{"id":"2026-i-psicologia-q081","areaId":"area-psi-gestion","stem":"Un personal de salud al ingresar a trabajar a un establecimiento de salud, el sistema administrativo de gestión de recursos humanos debe promover la gestión de relaciones humanas y sociales a través de procesos de:","options":[{"id":"A","text":"Evaluación del desempeño"},{"id":"B","text":"Seguridad y salud en el trabajo"},{"id":"C","text":"Administración de compensaciones"},{"id":"D","text":"Inducción en el puesto laboral"}],"answer":"B","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":8,"complexity":31,"confidence":"alta"},"2026-i-psicologia-q032":{"id":"2026-i-psicologia-q032","areaId":"area-psi-gestion","stem":"El jefe del establecimiento de salud nivel I-2 ha identificado que existe necesidad de otro personal técnico para las visitas domiciliarias, porque no se logran las metas programadas. ¿En qué instrumento de gestión se debe programar este recurso?","options":[{"id":"A","text":"Plan operativo"},{"id":"B","text":"Plan de salud local"},{"id":"C","text":"Presupuesto por resultados"},{"id":"D","text":"Plan estratégico"}],"answer":"A","examTitle":"Psicología · SERUMS 2026-I","cycle":"2026-I","page":4,"complexity":32,"confidence":"media"},"2025-i-psicologia-q045":{"id":"2025-i-psicologia-q045","areaId":"area-psi-gestion","stem":"La realización de las asistencias técnicas, supervisión y capacitación para la mejora de las intervenciones clínicas en los establecimientos de salud no especializados en temas de salud mental; es una de las actividades de:","options":[{"id":"A","text":"Instituto nacional de salud mental"},{"id":"B","text":"Coordinación de salud mental de la DIRESA"},{"id":"C","text":"Coordinación de salud mental de la RIS"},{"id":"D","text":"Centro de salud mental comunitario"}],"answer":"D","examTitle":"Psicología · SERUMS 2025-I","cycle":"2025-I","page":6,"complexity":34,"confidence":"alta"},"2026-ii-psicologia-q036":{"id":"2026-ii-psicologia-q036","areaId":"area-psi-gestion","stem":"Según modelo de las Redes Integradas de Salud. En los establecimientos de salud que cuentan con el Equipo Multidisciplinario en Salud: médico, enfermera, obstetra y técnico en enfermería. ¿Cuál es el rol de éste?","options":[{"id":"A","text":"Vinculantes"},{"id":"B","text":"Área sanitaria"},{"id":"C","text":"Puerta de entrada"},{"id":"D","text":"Zona sanitaria"}],"answer":"C","examTitle":"Psicología · SERUMS 2026-II","cycle":"2026-II","page":4,"complexity":34,"confidence":"alta"}},"characters":[{"id":"ilan","name":"Ilan Vega","title":"Brújula del Alba","personality":"estratega","rarity":"inicial","rarityLabel":"Inicial","price":0,"areaAffinity":"area-psi-salud-publica","access":{"kind":"starter","label":"Personaje inicial","description":"Disponible desde el primer arranque."},"quote":"Una buena respuesta empieza por saber qué se está preguntando.","description":"Antes de responder, Ilan dibuja el problema. Su cuaderno es un tablero: rutas, descartes y una sola decisión por línea.","attributes":{"enfoque":74,"perseverancia":66,"curiosidad":71,"estrategia":88,"adaptabilidad":76},"signature":{"prop":"Cuaderno de rutas","gesture":"Traza una línea en el aire antes de decidir."},"slots":["cabeza","peinado","torso","piernas","accesorios","extras","amuletos","efectos","marcos"]},{"id":"mara","name":"Mara Solís","title":"Exploradora de Territorio","personality":"exploradora","rarity":"comun","rarityLabel":"Común","price":480,"areaAffinity":"area-psi-salud-publica","access":{"kind":"purchase","label":"En la tienda","description":"Se compra con las monedas ganadas en sesiones."},"quote":"Si no conocés el territorio, el dato te queda corto.","description":"Mara llega primero al barrio, pregunta antes de suponer y vuelve con el mapa corregido. Para ella, cada error es una calle nueva.","attributes":{"enfoque":62,"perseverancia":70,"curiosidad":92,"estrategia":68,"adaptabilidad":85},"signature":{"prop":"Mapa de campo","gesture":"Despliega el mapa y señala una ruta nueva."},"slots":["cabeza","peinado","torso","piernas","accesorios","extras","amuletos","efectos","marcos"]},{"id":"noa","name":"Noa Iturbe","title":"Ojo de la Evidencia","personality":"investigadora","rarity":"poco_comun","rarityLabel":"Poco común","price":950,"areaAffinity":"area-psi-investigacion","access":{"kind":"purchase","label":"En la tienda","description":"Se compra con las monedas ganadas en sesiones."},"quote":"La evidencia también se lee por sus ausencias.","description":"Noa no discute una conclusión sin mirar el diseño que la sostiene. Anota fuentes, fechas y, sobre todo, lo que falta.","attributes":{"enfoque":90,"perseverancia":74,"curiosidad":84,"estrategia":76,"adaptabilidad":60},"signature":{"prop":"Tableta de evidencia","gesture":"Amplía un dato y lo subraya con el lápiz."},"slots":["cabeza","peinado","torso","piernas","accesorios","extras","amuletos","efectos","marcos"]},{"id":"teo","name":"Teo Alcázar","title":"Mentor de la Escucha","personality":"mentor","rarity":"poco_comun","rarityLabel":"Poco común","price":1100,"areaAffinity":"area-psi-cuidado-integral","access":{"kind":"purchase","label":"En la tienda","description":"Se compra con las monedas ganadas en sesiones."},"quote":"Escuchar bien ya es parte del tratamiento.","description":"Teo escucha el caso completo antes de hablar. No regala respuestas: devuelve preguntas que ordenan el pensamiento.","attributes":{"enfoque":82,"perseverancia":80,"curiosidad":72,"estrategia":70,"adaptabilidad":78},"signature":{"prop":"Libro de escucha","gesture":"Cierra el libro y asiente despacio."},"slots":["cabeza","peinado","torso","piernas","accesorios","extras","amuletos","efectos","marcos"]},{"id":"lia","name":"Lía Márquez","title":"Chispa del Criterio","personality":"prodigio","rarity":"raro","rarityLabel":"Raro","price":1750,"areaAffinity":"area-psi-etica","access":{"kind":"purchase","label":"En la tienda","description":"Se compra con las monedas ganadas en sesiones."},"quote":"Rápido no sirve si el criterio va detrás.","description":"Lía compite contra su último intento. Lee rápido, elige rápido y revisa dos veces cuando la apuesta es alta.","attributes":{"enfoque":88,"perseverancia":68,"curiosidad":70,"estrategia":80,"adaptabilidad":88},"signature":{"prop":"Cronómetro","gesture":"Detiene el cronómetro y levanta el pulgar."},"slots":["cabeza","peinado","torso","piernas","accesorios","extras","amuletos","efectos","marcos"]},{"id":"kian","name":"Kian Ferro","title":"Guardián del Método","personality":"guardian","rarity":"raro","rarityLabel":"Raro","price":1950,"areaAffinity":"area-psi-investigacion","access":{"kind":"purchase","label":"En la tienda","description":"Se compra con las monedas ganadas en sesiones."},"quote":"El método aguanta lo que el entusiasmo olvida.","description":"Kian sostiene el procedimiento cuando el atajo tienta. Su rutina es simple: registrar, verificar y repetir sin ruido.","attributes":{"enfoque":92,"perseverancia":94,"curiosidad":58,"estrategia":80,"adaptabilidad":55},"signature":{"prop":"Sello de método","gesture":"Estampa el sello y cruza los brazos."},"slots":["cabeza","torso","piernas","accesorios","extras","amuletos","efectos","marcos"]},{"id":"amaru","name":"Amaru Cielo","title":"Vigía de la Ruta","personality":"exploradora","rarity":"raro","rarityLabel":"Raro","price":0,"areaAffinity":"area-psi-salud-publica","access":{"kind":"reward","label":"Recompensa de recorrido","missions":5,"description":"Se desbloquea al completar 5 misiones. No se compra con monedas."},"quote":"El camino se comparte o no se aprende.","description":"Amaru camina con una linterna y un mapa cosido al poncho. Marca los desvíos para que nadie vuelva a perderse.","attributes":{"enfoque":70,"perseverancia":84,"curiosidad":88,"estrategia":72,"adaptabilidad":90},"signature":{"prop":"Linterna de ruta","gesture":"Levanta la linterna y barre el horizonte."},"slots":["peinado","torso","piernas","accesorios","extras","amuletos","efectos","marcos"]},{"id":"ona","name":"Ona Beltrán","title":"Arquitecta del Sistema","personality":"estratega","rarity":"epico","rarityLabel":"Épico","price":3200,"areaAffinity":"area-psi-gestion","access":{"kind":"purchase","label":"En la tienda","description":"Se compra con las monedas ganadas en sesiones."},"quote":"Un sistema bien pensado cuida a quien lo usa.","description":"Ona piensa en redes, turnos y recursos. Su mesa de trabajo parece una ciudad vista desde arriba y siempre tiene un plano abierto.","attributes":{"enfoque":86,"perseverancia":82,"curiosidad":68,"estrategia":96,"adaptabilidad":74},"signature":{"prop":"Plano de sistemas","gesture":"Extiende el plano y traza una línea de conexión."},"slots":["cabeza","peinado","torso","piernas","accesorios","extras","amuletos","efectos","marcos"]},{"id":"iris","name":"Iris Calderón","title":"Custodia de la Confianza","personality":"guardian","rarity":"epico","rarityLabel":"Épico","price":3600,"areaAffinity":"area-psi-etica","access":{"kind":"purchase","label":"En la tienda","description":"Se compra con las monedas ganadas en sesiones."},"quote":"La confianza no se negocia: se protege.","description":"Iris camina despacio y escucha de pie. Allí donde una decisión puede romper la confianza, ella levanta la luz antes de hablar.","attributes":{"enfoque":84,"perseverancia":90,"curiosidad":70,"estrategia":82,"adaptabilidad":66},"signature":{"prop":"Farol de cuidado","gesture":"Eleva el farol y lo cubre con la mano libre."},"slots":["cabeza","peinado","torso","piernas","accesorios","extras","amuletos","efectos","marcos"]},{"id":"zenon","name":"Zenón Atlas","title":"Cronista del Dominio","personality":"mentor","rarity":"legendario","rarityLabel":"Legendario","price":5400,"areaAffinity":"area-psi-investigacion","access":{"kind":"purchase","label":"Colección legendaria","level":8,"description":"Requiere nivel 8 y 5.400 monedas. Se compra una sola vez."},"quote":"El dominio es recordar por qué, no solo cuál.","description":"Zenón ha visto pasar generaciones de exámenes. No memoriza: conecta un caso con cien preguntas anteriores y recuerda por qué importaba.","attributes":{"enfoque":94,"perseverancia":88,"curiosidad":86,"estrategia":94,"adaptabilidad":80},"signature":{"prop":"Bastón de archivo","gesture":"Golpea el suelo y abre los anillos del archivo."},"slots":["cabeza","torso","piernas","accesorios","extras","amuletos","efectos","marcos"]}],"cosmetics":[{"id":"c-cabeza-diadema","name":"Diadema de circuitos","description":"Una cinta conductora con tres nodos que se encienden al ritmo del pensamiento.","category":"cabeza","rarity":"raro","rarityLabel":"Raro","price":330,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-cabeza-casco","name":"Casco de vigía","description":"Media armadura de campaña con visera corta. Protege la atención de las distracciones.","category":"cabeza","rarity":"epico","rarityLabel":"Épico","price":560,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-cabeza-gorro","name":"Gorro de campaña","description":"Tela gastada en el borde y una pequeña insignia de ruta en el centro.","category":"cabeza","rarity":"comun","rarityLabel":"Común","price":90,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-cabeza-corona","name":"Corona de constelaciones","description":"Cinco puntas y una órbita mínima. Reservada a quien ya recorrió el mapa completo.","category":"cabeza","rarity":"legendario","rarityLabel":"Legendario","price":900,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":{"kind":"level","level":10,"label":"Alcanza el nivel 10"},"isExtra":false},{"id":"c-cabeza-auriculares","name":"Auriculares de foco","description":"Cancelan el ruido del pasillo y dejan pasar solo la voz del caso.","category":"cabeza","rarity":"poco_comun","rarityLabel":"Poco común","price":220,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-peinado-coleta","name":"Coleta de cometa","description":"Un mechón alto que se mueve como estela cuando el personaje celebra.","category":"peinado","rarity":"comun","rarityLabel":"Común","price":100,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-peinado-rizos","name":"Rizos de tinta","description":"Volumen irregular y una sombra azulada que recuerda a las notas manuscritas.","category":"peinado","rarity":"poco_comun","rarityLabel":"Poco común","price":180,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-peinado-mecha","name":"Mecha violeta","description":"Una franja de color reservada para los hitos que no se repiten.","category":"peinado","rarity":"raro","rarityLabel":"Raro","price":340,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-peinado-mono","name":"Moño de archivo","description":"Recogido y firme. Nada que se interponga entre la mirada y el dato.","category":"peinado","rarity":"comun","rarityLabel":"Común","price":110,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-torso-abrigo","name":"Abrigo de guardia","description":"Solapas anchas y forro azul. Un uniforme para las sesiones que exigen aguante.","category":"torso","rarity":"raro","rarityLabel":"Raro","price":380,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-torso-bata","name":"Bata de evidencia","description":"Bolsillos para fichas, un lápiz siempre a mano y el cuello impecable.","category":"torso","rarity":"poco_comun","rarityLabel":"Poco común","price":240,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-torso-manto","name":"Manto de constelaciones","description":"Tela profunda con puntos de luz bordados a mano. Se mueve como si tuviera su propio cielo.","category":"torso","rarity":"epico","rarityLabel":"Épico","price":620,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-torso-chaleco","name":"Chaleco de misiones","description":"Ligero, con bolsillos medidos y una cinta reflectante que no molesta al leer.","category":"torso","rarity":"comun","rarityLabel":"Común","price":130,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-torso-poncho","name":"Poncho de viaje","description":"Tejido denso con guardas geométricas originales y un borde que aguanta el polvo del camino.","category":"torso","rarity":"raro","rarityLabel":"Raro","price":360,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-piernas-ruta","name":"Perneras de ruta","description":"Correas cruzadas y una placa que registra cada tramo recorrido.","category":"piernas","rarity":"comun","rarityLabel":"Común","price":95,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-piernas-falda","name":"Falda de mapas","description":"Pliegues que esconden trazos de rutas antiguas. Elegante, práctica y un poco rebelde.","category":"piernas","rarity":"poco_comun","rarityLabel":"Poco común","price":190,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-piernas-grebas","name":"Grebas de método","description":"Placas ligeras para quien no piensa moverse del procedimiento.","category":"piernas","rarity":"raro","rarityLabel":"Raro","price":350,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-accesorios-gafas","name":"Gafas de precisión","description":"Dos lentes finas que convierten una página densa en una línea legible.","category":"accesorios","rarity":"poco_comun","rarityLabel":"Poco común","price":210,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-accesorios-brujula","name":"Brújula de muñeca","description":"Un pequeño instrumento de latón que siempre apunta hacia la siguiente decisión.","category":"accesorios","rarity":"comun","rarityLabel":"Común","price":85,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-accesorios-bolso","name":"Bolso de campo","description":"Cuero gastado, dos compartimentos y una libreta que asoma por la solapa.","category":"extras","rarity":"comun","rarityLabel":"Común","price":120,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-accesorios-pluma","name":"Pluma de archivo","description":"Una pluma de metal que no escribe tinta: escribe marcas en el margen de la memoria.","category":"extras","rarity":"raro","rarityLabel":"Raro","price":320,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-amuleto-enfoque","name":"Amuleto de enfoque","description":"Un prisma que concentra la luz sobre una sola idea. No hace la pregunta más fácil.","category":"amuletos","rarity":"raro","rarityLabel":"Raro","price":300,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-amuleto-sello","name":"Sello del método","description":"Un sello de bronce con la marca del procedimiento verificado.","category":"amuletos","rarity":"epico","rarityLabel":"Épico","price":540,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-amuleto-nudo","name":"Nudo de la memoria","description":"Un nudo de cordón que se aprieta cada vez que algo vuelve a aparecer en el repaso.","category":"amuletos","rarity":"poco_comun","rarityLabel":"Poco común","price":170,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-amuleto-criterio","name":"Reliquia del criterio","description":"Una pieza reservada para quien sostiene 80% de precisión con evidencia suficiente.","category":"amuletos","rarity":"epico","rarityLabel":"Épico","price":600,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":{"kind":"achievement","achievementId":"precision-80","label":"Desbloquea el logro «Criterio»"},"isExtra":false},{"id":"c-efecto-aura","name":"Aura de alba","description":"Un halo cálido que aparece detrás del personaje y se apaga cuando la sesión termina.","category":"efectos","rarity":"raro","rarityLabel":"Raro","price":330,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-efecto-chispas","name":"Chispas de racha","description":"Pequeñas chispas que solo se encienden cuando la racha avanza.","category":"efectos","rarity":"poco_comun","rarityLabel":"Poco común","price":200,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-efecto-bruma","name":"Bruma de estudio","description":"Una neblina baja y silenciosa que da profundidad al retrato sin tapar la lectura.","category":"efectos","rarity":"comun","rarityLabel":"Común","price":90,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-efecto-constelacion","name":"Constelación de logros","description":"Cuatro estrellas unidas por una línea tenue. Aparece al completar una semana de racha.","category":"efectos","rarity":"legendario","rarityLabel":"Legendario","price":950,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":{"kind":"achievement","achievementId":"racha-7","label":"Desbloquea el logro «Semana completa»"},"isExtra":false},{"id":"c-marco-bronce","name":"Marco de bronce","description":"Esquinas reforzadas y una línea simple. El primer marco de una colección.","category":"marcos","rarity":"comun","rarityLabel":"Común","price":140,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-marco-platino","name":"Marco de platino","description":"Filo frío y geometría precisa para una vitrina que ya tiene historia.","category":"marcos","rarity":"raro","rarityLabel":"Raro","price":400,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-marco-vacio","name":"Marco del vacío","description":"Un borde que parece recortado en la oscuridad y deja escapar un filo violeta.","category":"marcos","rarity":"epico","rarityLabel":"Épico","price":650,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":null,"isExtra":false},{"id":"c-marco-constelacion","name":"Marco de constelación","description":"Un marco de vitrina mayor: se obtiene al completar cinco misiones.","category":"marcos","rarity":"legendario","rarityLabel":"Legendario","price":1000,"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"unlockRequirements":{"kind":"achievement","achievementId":"cinco-misiones","label":"Desbloquea el logro «Cartógrafo»"},"isExtra":false},{"id":"x-estela-racha","name":"Estela de racha","description":"Una cinta de luz que se alarga con los días de constancia. Nada se pierde si un día se descansa.","category":"estela","rarity":"epico","price":0,"unlockRequirements":{"kind":"streak","target":7,"tiers":[14,30],"metric":"bestStreak"},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-luciernaga-observatorio","name":"Luciérnaga del observatorio","description":"Una chispa viva que crece con la constancia. Empieza rara y se vuelve legendaria al llegar a 60 días.","category":"mascota","rarity":"raro","tierRarities":["raro","raro","legendario"],"price":0,"unlockRequirements":{"kind":"streak","target":7,"tiers":[21,60],"metric":"bestStreak"},"stageLabels":["Chispa","Faro","Constelación"],"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-aura-amanecer","name":"Aura del amanecer","description":"Un halo cálido que rodea al héroe al empezar una nueva jornada de estudio.","category":"efectos","rarity":"epico","price":0,"unlockRequirements":{"kind":"streak","target":14,"metric":"bestStreak"},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-capa-errorario","name":"Capa del Errorario","description":"Una capa tejida con cada error que se convirtió en una respuesta recuperada.","category":"torso","rarity":"epico","price":0,"unlockRequirements":{"kind":"recoveries","target":10},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-reloj-arena","name":"Reloj de arena flotante","description":"Un pequeño reloj de arena que recuerda las preguntas repasadas dentro de su ventana programada.","category":"extras","rarity":"raro","price":0,"unlockRequirements":{"kind":"onTimeReviewSessions","target":10},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-cuaderno-orbital","name":"Cuaderno orbital","description":"Un cuaderno que gira alrededor del héroe después de practicar errores antes de su cita.","category":"extras","rarity":"raro","price":0,"unlockRequirements":{"kind":"earlyReviewSessions","target":5},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-dominio-salud","name":"Tocado de maestría · Salud pública","description":"Laurel de comunidad y salud pública para quien sostiene el criterio en toda la ruta.","category":"cabeza","rarity":"epico","price":0,"unlockRequirements":{"kind":"areaMastery","areaId":"area-psi-salud-publica","accuracy":0.8},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-dominio-cuidado","name":"Tocado de maestría · Cuidado integral","description":"Una corona de escucha y continuidad para quien completa la ruta del cuidado.","category":"cabeza","rarity":"epico","price":0,"unlockRequirements":{"kind":"areaMastery","areaId":"area-psi-cuidado-integral","accuracy":0.8},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-dominio-etica","name":"Tocado de maestría · Ética e interculturalidad","description":"Un aro de dignidad y confianza para quien sostiene el criterio ético.","category":"cabeza","rarity":"epico","price":0,"unlockRequirements":{"kind":"areaMastery","areaId":"area-psi-etica","accuracy":0.8},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-dominio-investigacion","name":"Tocado de maestría · Investigación","description":"Un prisma de evidencia para quien distingue método, límite y conclusión.","category":"cabeza","rarity":"epico","price":0,"unlockRequirements":{"kind":"areaMastery","areaId":"area-psi-investigacion","accuracy":0.8},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-dominio-gestion","name":"Tocado de maestría · Gestión de servicios","description":"Un engranaje de planificación para quien sostiene sistemas y equipos.","category":"cabeza","rarity":"epico","price":0,"unlockRequirements":{"kind":"areaMastery","areaId":"area-psi-gestion","accuracy":0.8},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-dominio-salud-oro","name":"Tocado dorado · Salud pública","description":"La versión áurea del dominio de Salud pública, reservada para un jefe con 90 % o más.","category":"cabeza","rarity":"legendario","price":0,"unlockRequirements":{"kind":"areaMasteryGold","areaId":"area-psi-salud-publica","bossId":"boss-sp","bossAccuracy":0.9},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-dominio-cuidado-oro","name":"Tocado dorado · Cuidado integral","description":"La versión áurea del dominio del cuidado, con el guardián superado al 90 % o más.","category":"cabeza","rarity":"legendario","price":0,"unlockRequirements":{"kind":"areaMasteryGold","areaId":"area-psi-cuidado-integral","bossId":"boss-ci","bossAccuracy":0.9},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-dominio-etica-oro","name":"Tocado dorado · Ética e interculturalidad","description":"La versión áurea del dominio ético, con el guardián superado al 90 % o más.","category":"cabeza","rarity":"legendario","price":0,"unlockRequirements":{"kind":"areaMasteryGold","areaId":"area-psi-etica","bossId":"boss-et","bossAccuracy":0.9},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-dominio-investigacion-oro","name":"Tocado dorado · Investigación","description":"La versión áurea de la evidencia, con el guardián superado al 90 % o más.","category":"cabeza","rarity":"legendario","price":0,"unlockRequirements":{"kind":"areaMasteryGold","areaId":"area-psi-investigacion","bossId":"boss-in","bossAccuracy":0.9},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-dominio-gestion-oro","name":"Tocado dorado · Gestión de servicios","description":"La versión áurea del sistema, con el guardián superado al 90 % o más.","category":"cabeza","rarity":"legendario","price":0,"unlockRequirements":{"kind":"areaMasteryGold","areaId":"area-psi-gestion","bossId":"boss-ge","bossAccuracy":0.9},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-trofeo-salud","name":"Trofeo del Territorio","description":"Una semilla de luz flotante que recuerda al Custodio del Territorio.","category":"extras","rarity":"raro","price":0,"unlockRequirements":{"kind":"bossDefeated","bossId":"boss-sp"},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-trofeo-cuidado","name":"Trofeo del Cuidado","description":"Un faro minúsculo que flota junto al héroe tras vencer al Custodio del Cuidado.","category":"extras","rarity":"raro","price":0,"unlockRequirements":{"kind":"bossDefeated","bossId":"boss-ci"},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-trofeo-etica","name":"Trofeo de la Confianza","description":"Un espejo de bolsillo que refleja al Custodio de la Confianza.","category":"extras","rarity":"raro","price":0,"unlockRequirements":{"kind":"bossDefeated","bossId":"boss-et"},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-trofeo-investigacion","name":"Trofeo de la Evidencia","description":"Un prisma de luz que recuerda al Custodio de la Evidencia.","category":"extras","rarity":"raro","price":0,"unlockRequirements":{"kind":"bossDefeated","bossId":"boss-in"},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-trofeo-gestion","name":"Trofeo del Sistema","description":"Un pequeño engranaje flotante del Custodio del Sistema.","category":"extras","rarity":"raro","price":0,"unlockRequirements":{"kind":"bossDefeated","bossId":"boss-ge"},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-arma-destello","name":"Destello del Territorio","description":"Partículas de salud pública que recorren el arma y se disipan sin herir.","category":"efectos","rarity":"epico","price":0,"unlockRequirements":{"kind":"bossMastery","bossId":"boss-sp","accuracy":0.8},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-arma-marea","name":"Marea del Cuidado","description":"Una marea de luz azul alrededor del arma, con el ritmo de la escucha.","category":"efectos","rarity":"epico","price":0,"unlockRequirements":{"kind":"bossMastery","bossId":"boss-ci","accuracy":0.8},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-arma-sello","name":"Sello de la Confianza","description":"Un sello violeta de luz que se dibuja junto a la empuñadura.","category":"efectos","rarity":"epico","price":0,"unlockRequirements":{"kind":"bossMastery","bossId":"boss-et","accuracy":0.8},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-arma-prisma","name":"Prisma de la Evidencia","description":"Destellos de evidencia que ordenan el aire alrededor del arma.","category":"efectos","rarity":"epico","price":0,"unlockRequirements":{"kind":"bossMastery","bossId":"boss-in","accuracy":0.8},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-arma-orbita","name":"Órbita del Sistema","description":"Pequeñas piezas doradas que orbitan el arma como un sistema en equilibrio.","category":"efectos","rarity":"epico","price":0,"unlockRequirements":{"kind":"bossMastery","bossId":"boss-ge","accuracy":0.8},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-buho-cometa","name":"Búho cometa","description":"Un búho de luz que crece con el nivel global y deja una estela de plumas estelares.","category":"mascota","rarity":"epico","price":0,"unlockRequirements":{"kind":"level","target":5,"tiers":[15,30]},"stageLabels":["Polluelo","Cometa","Cósmico"],"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-zorro-tinta","name":"Zorro de tinta","description":"Un zorro de tinta que deja huellas de luz y colecciona accesorios con los logros.","category":"mascota","rarity":"epico","price":0,"unlockRequirements":{"kind":"achievements","target":3,"tiers":[8,13]},"stageLabels":["Tinta","Cartógrafo","Archivista"],"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-titulo-primer-paso","name":"Primer paso","description":"Título para el primer criterio ejercitado.","category":"titulo","rarity":"comun","price":0,"unlockRequirements":{"kind":"achievement","achievementId":"primer-paso"},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-titulo-en-ruta","name":"En ruta","description":"Título para quien completa su primera misión.","category":"titulo","rarity":"raro","price":0,"unlockRequirements":{"kind":"achievement","achievementId":"primera-mision"},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-titulo-cartografo","name":"Cartógrafo","description":"Título para quien ha abierto cinco nodos de la campaña.","category":"titulo","rarity":"raro","price":0,"unlockRequirements":{"kind":"achievement","achievementId":"cinco-misiones"},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-titulo-criterio","name":"Criterio","description":"Título para la precisión sostenida del 80 % con evidencia suficiente.","category":"titulo","rarity":"epico","price":0,"unlockRequirements":{"kind":"achievement","achievementId":"precision-80"},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-titulo-primer-custodio","name":"Primer custodio","description":"Título para quien vence a su primer guardián.","category":"titulo","rarity":"epico","price":0,"unlockRequirements":{"kind":"achievement","achievementId":"primer-jefe"},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-titulo-semana-completa","name":"Semana completa","description":"Título para los días de constancia que sostienen una semana de estudio.","category":"titulo","rarity":"epico","price":0,"unlockRequirements":{"kind":"achievement","achievementId":"racha-7"},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-titulo-circulo-cerrado","name":"Círculo cerrado","description":"Título para quien recupera diez errores con repaso real.","category":"titulo","rarity":"epico","price":0,"unlockRequirements":{"kind":"achievement","achievementId":"diez-recuperaciones"},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false},{"id":"x-titulo-maestro","name":"Maestro SERUMS","description":"Título mayor para quien alcanza el rango Maestro SERUMS.","category":"titulo","rarity":"legendario","price":0,"unlockRequirements":{"kind":"rank","rankId":"maestro"},"compatibleCharacterIds":["ilan","mara","noa","teo","lia","kian","amaru","ona","iris","zenon"],"isExtra":true,"shopAvailable":false}],"cosmeticCategories":[{"id":"cabeza","label":"Cabeza"},{"id":"peinado","label":"Peinado"},{"id":"torso","label":"Torso"},{"id":"piernas","label":"Piernas"},{"id":"accesorios","label":"Accesorio principal"},{"id":"extras","label":"Accesorio adicional"},{"id":"amuletos","label":"Amuleto"},{"id":"efectos","label":"Efecto"},{"id":"marcos","label":"Marco"},{"id":"mascota","label":"Mascota"},{"id":"estela","label":"Estela"},{"id":"titulo","label":"Título"}],"achievements":[{"id":"primer-paso","name":"Primer paso","description":"Responde tu primera pregunta.","xp":20,"coins":5,"metric":"answered","target":1},{"id":"primera-mision","name":"En ruta","description":"Completa tu primera misión.","xp":30,"coins":10,"metric":"missions","target":1},{"id":"cinco-misiones","name":"Cartógrafo","description":"Completa cinco misiones.","xp":60,"coins":20,"metric":"missions","target":5},{"id":"primer-jefe","name":"Primer custodio","description":"Supera un jefe final.","xp":80,"coins":30,"metric":"bosses","target":1},{"id":"diez-aciertos","name":"Pulso firme","description":"Acumula diez respuestas correctas.","xp":25,"coins":5,"metric":"correct","target":10},{"id":"precision-80","name":"Criterio","description":"Alcanza 80% de precisión con al menos 20 respuestas.","xp":50,"coins":15,"metric":"accuracy","target":0.8},{"id":"racha-3","name":"Tres días","description":"Mantén una racha de 3 días en el desafío diario.","xp":40,"coins":10,"metric":"dailyStreak","target":3},{"id":"racha-7","name":"Semana completa","description":"Mantén una racha de 7 días en el desafío diario.","xp":80,"coins":25,"metric":"dailyStreak","target":7},{"id":"primera-recuperacion","name":"Volver a mirar","description":"Recupera una pregunta fallada.","xp":35,"coins":10,"metric":"recoveries","target":1},{"id":"diez-recuperaciones","name":"Círculo cerrado","description":"Recupera diez preguntas falladas.","xp":60,"coins":20,"metric":"recoveries","target":10},{"id":"cinco-areas","name":"Mirada completa","description":"Acierta al menos una pregunta en las cinco áreas.","xp":50,"coins":15,"metric":"areasCorrect","target":5},{"id":"area-completa","name":"Ruta cerrada","description":"Completa todas las misiones de un área.","xp":45,"coins":15,"metric":"areasCompleted","target":1},{"id":"nivel-5","name":"Nivel cinco","description":"Alcanza el nivel 5.","xp":50,"coins":15,"metric":"level","target":5},{"id":"cien-monedas","name":"Tesoro de estudio","description":"Acumula 100 monedas.","xp":30,"coins":0,"metric":"coins","target":100},{"id":"superviviente","name":"Superviviente","description":"Completa una sesión de Supervivencia.","xp":40,"coins":10,"metric":"survivalWins","target":1},{"id":"precision-tiempo","name":"Precisión cronometrada","description":"Acierta 10 o más con 85% en Contrarreloj.","xp":55,"coins":15,"metric":"timedAce","target":1},{"id":"cien-preguntas","name":"Cien preguntas","description":"Responde cien preguntas oficiales.","xp":70,"coins":20,"metric":"answered","target":100},{"id":"diez-dominadas","name":"Diez dominadas","description":"Domina diez preguntas con respuestas espaciadas.","xp":50,"coins":15,"metric":"mastered","target":10}],"rules":{"levelBase":80,"levelLinear":40,"levelQuadratic":10,"maxLevel":50,"passMission":0.6,"passBoss":0.7,"recovery":{"firstDelayMinutes":20,"intervalsDays":[1,3,7,14,30],"masteredAfterRecoveries":2,"maxQuestionsPerSession":8},"xp":{"question":{"iniciacion":10,"desarrollo":20,"especializacion":35,"dominio":50,"repaso":20},"completion":{"mission":30,"daily":40,"boss":80,"survival":40,"timed":25,"recovery":30,"simulacro":70},"weeklyStreak":60},"coins":{"firstCorrect":1,"completion":{"mission":8,"daily":10,"boss":25,"survival":10,"timed":6,"recovery":5,"simulacro":20},"weeklyStreak":20,"dailyCap":120},"stages":{"1":{"id":1,"name":"Iniciación","short":"Iniciación","color":"#7AA2FF","description":"Preguntas accesibles, feedback inmediato y recompensas generosas.","criteria":"Empieza aquí. La etapa cambia con evidencia, no con una sola respuesta."},"2":{"id":2,"name":"Desarrollo","short":"Desarrollo","color":"#69D3C1","description":"Distractores plausibles, combinación de conceptos y errores recuperados.","criteria":"12+ respuestas y 55% de precisión."},"3":{"id":3,"name":"Especialización","short":"Especialización","color":"#C49BFF","description":"Aplicación, distinción entre conceptos similares y pruebas de consistencia.","criteria":"30+ respuestas, 65% de precisión y 5 preguntas dominadas."},"4":{"id":4,"name":"Dominio","short":"Dominio","color":"#F3B562","description":"Desafíos integradores, simulacros y evaluación de retención.","criteria":"60+ respuestas, 72% de precisión, 12 dominadas y 6 misiones."}},"stageRules":{"minAnswersForStage2":12,"minAccuracyStage2":0.55,"minAnswersForStage3":30,"minAccuracyStage3":0.65,"minMasteredStage3":5,"minAnswersForStage4":60,"minAccuracyStage4":0.72,"minMasteredStage4":12,"minMissionsStage4":6,"downgradeWindow":12,"downgradeAccuracy":0.4},"ranks":[{"id":"bachiller","name":"Bachiller","short":"Bachiller","xp":0,"answered":0,"accuracy":0,"mastered":0,"areas":0,"bosses":0,"color":"#AEB6C8","description":"El primer paso: aprender a mirar antes de responder."},{"id":"interno","name":"Interno","short":"Interno","xp":150,"answered":10,"accuracy":0.55,"mastered":0,"areas":1,"bosses":0,"color":"#7AA2FF","description":"Ya sostienes un ritmo de práctica y una precisión inicial."},{"id":"serumista","name":"Serumista","short":"Serumista","xp":450,"answered":30,"accuracy":0.65,"mastered":8,"areas":3,"bosses":0,"color":"#69D3C1","description":"Integras áreas distintas y recuperas lo que falla."},{"id":"especialista","name":"Especialista","short":"Especialista","xp":1100,"answered":70,"accuracy":0.75,"mastered":25,"areas":5,"bosses":1,"color":"#C49BFF","description":"Precisión sostenida, dominio amplio y jefes superados."},{"id":"maestro","name":"Maestro SERUMS","short":"Maestro","xp":2400,"answered":120,"accuracy":0.82,"mastered":50,"areas":5,"bosses":3,"color":"#F3B562","description":"Criterio, constancia y dominio demostrado en todo el temario."}]}};
var STYLE_CSS = ":root {\n  --bg: #05070d;\n  --panel: rgba(12, 17, 28, 0.84);\n  --panel-2: rgba(18, 24, 39, 0.92);\n  --panel-3: rgba(25, 33, 52, 0.75);\n  --line: rgba(190, 208, 245, 0.14);\n  --line-strong: rgba(190, 208, 245, 0.28);\n  --ink: #f1f3f8;\n  --muted: #a7b2c9;\n  --dim: #6f7c97;\n  --blue: #7aa2ff;\n  --teal: #69d3c1;\n  --violet: #c49bff;\n  --lime: #b8d46a;\n  --amber: #f3b562;\n  --rose: #ff8b9d;\n  --gold: #e4c07a;\n  --shadow: 0 28px 80px rgba(0, 0, 0, 0.5);\n  --font-body: \"Segoe UI\", \"Avenir Next\", system-ui, -apple-system, sans-serif;\n  --font-display: \"Bahnschrift\", \"Arial Narrow\", \"Trebuchet MS\", sans-serif;\n  --font-serif: \"Palatino Linotype\", \"Book Antiqua\", Georgia, serif;\n}\n\n* { box-sizing: border-box; }\nhtml, body { margin: 0; height: 100%; overflow: hidden; background: var(--bg); }\nbody { color: var(--ink); font-family: var(--font-body); -webkit-font-smoothing: antialiased; }\nbutton, input, textarea { font: inherit; color: inherit; }\nbutton { cursor: pointer; }\nbutton:disabled { cursor: not-allowed; }\n::selection { background: rgba(122, 162, 255, 0.35); }\n:focus-visible { outline: 2px solid var(--teal); outline-offset: 3px; }\n\n#game { display: block; width: 100vw; height: 100vh; touch-action: none; outline: none; background: radial-gradient(ellipse at 70% 35%, #17213d 0%, #080b15 46%, #04060b 100%); }\n#ui { position: fixed; inset: 0; z-index: 2; pointer-events: none; }\n.hidden { display: none !important; }\n\n.eyebrow {\n  display: inline-flex;\n  align-items: center;\n  gap: 8px;\n  margin: 0;\n  color: var(--muted);\n  font-size: 10px;\n  font-weight: 800;\n  letter-spacing: 0.21em;\n  line-height: 1.2;\n  text-transform: uppercase;\n}\n.eyebrow::before {\n  content: \"\";\n  width: 18px;\n  height: 1px;\n  background: currentColor;\n  opacity: 0.55;\n  flex: none;\n}\n.eyebrow.noRule::before { display: none; }\n.kickerDot { width: 7px; height: 7px; border-radius: 50%; background: var(--teal); box-shadow: 0 0 12px var(--teal); flex: none; }\n.muted { color: var(--muted); }\n.dim { color: var(--dim); }\n.small { font-size: 12px; }\n.tiny { font-size: 10px; }\n.nowrap { white-space: nowrap; }\n.mono { font-variant-numeric: tabular-nums; }\n\n/* ---------- Buttons and controls ---------- */\n.btn {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  gap: 9px;\n  min-height: 42px;\n  padding: 10px 17px;\n  border: 1px solid var(--line-strong);\n  border-radius: 12px;\n  background: linear-gradient(180deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.015));\n  color: var(--ink);\n  font-size: 13px;\n  font-weight: 700;\n  letter-spacing: 0.015em;\n  line-height: 1.1;\n  text-decoration: none;\n  transition: border-color 160ms ease, background 160ms ease, transform 160ms ease, box-shadow 160ms ease;\n}\n.btn:hover { border-color: rgba(215, 228, 255, 0.48); background: rgba(255, 255, 255, 0.085); }\n.btn:active { transform: translateY(1px); }\n.btn svg { flex: none; }\n.btn--primary {\n  border-color: rgba(139, 169, 255, 0.55);\n  background: linear-gradient(135deg, #789dff 0%, #9a82ff 52%, #bd87ff 100%);\n  color: #081022;\n  box-shadow: 0 8px 24px rgba(111, 133, 255, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.4);\n}\n.btn--primary:hover { background: linear-gradient(135deg, #87a9ff, #a58cff 52%, #c695ff); box-shadow: 0 10px 30px rgba(111, 133, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.45); }\n.btn--gold {\n  border-color: rgba(228, 192, 122, 0.6);\n  background: linear-gradient(135deg, #e8c887, #c7964b);\n  color: #1b1408;\n  box-shadow: 0 8px 24px rgba(199, 150, 75, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.34);\n}\n.btn--gold:hover { background: linear-gradient(135deg, #f1d396, #d4a65c); }\n.btn--ghost { border-color: var(--line); background: rgba(7, 11, 20, 0.3); color: var(--muted); }\n.btn--ghost:hover { color: var(--ink); border-color: var(--line-strong); background: rgba(255, 255, 255, 0.06); }\n.btn--quiet { border-color: transparent; background: transparent; color: var(--muted); padding-inline: 8px; }\n.btn--quiet:hover { background: rgba(255, 255, 255, 0.05); color: var(--ink); border-color: transparent; }\n.btn--danger { border-color: rgba(255, 139, 157, 0.35); color: #ffc1ca; background: rgba(95, 28, 41, 0.22); }\n.btn--danger:hover { border-color: rgba(255, 139, 157, 0.6); background: rgba(139, 40, 57, 0.28); }\n.btn--sm { min-height: 32px; padding: 7px 11px; font-size: 11.5px; border-radius: 9px; }\n.btn--lg { min-height: 52px; padding: 14px 22px; font-size: 14.5px; border-radius: 14px; }\n.btn--block { width: 100%; }\n.btn:disabled { opacity: 0.42; filter: grayscale(0.4); }\n\n.iconBtn {\n  width: 38px;\n  height: 38px;\n  display: inline-grid;\n  place-items: center;\n  padding: 0;\n  border-radius: 11px;\n  border: 1px solid var(--line);\n  background: rgba(8, 12, 22, 0.5);\n  color: var(--muted);\n  position: relative;\n  transition: color 140ms ease, border-color 140ms ease, background 140ms ease;\n}\n.iconBtn:hover { color: var(--ink); border-color: var(--line-strong); background: rgba(255, 255, 255, 0.075); }\n.iconBtn .badgeDot { position: absolute; top: -4px; right: -4px; min-width: 16px; height: 16px; border-radius: 99px; padding: 0 4px; display: grid; place-items: center; background: var(--amber); color: #1a1206; font-size: 9px; font-weight: 900; }\n\n.bar { position: relative; width: 100%; height: 4px; overflow: hidden; border-radius: 99px; background: rgba(255, 255, 255, 0.08); }\n.bar > i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--teal), var(--blue), var(--violet)); transition: width 300ms ease; }\n.bar--gold > i { background: linear-gradient(90deg, #b68b4d, var(--gold)); }\n\n/* ---------- HUD ---------- */\n.hud {\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  z-index: 20;\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  padding: 14px 18px;\n  pointer-events: none;\n  background: linear-gradient(180deg, rgba(4, 7, 13, 0.88) 0%, rgba(4, 7, 13, 0.45) 62%, transparent 100%);\n}\n.hud > * { pointer-events: auto; }\n.brand {\n  display: flex;\n  align-items: center;\n  gap: 11px;\n  padding: 7px 13px 7px 8px;\n  border: 1px solid var(--line);\n  border-radius: 14px;\n  background: linear-gradient(135deg, rgba(18, 25, 42, 0.88), rgba(8, 12, 20, 0.72));\n  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.2);\n  flex: none;\n}\n.brandRune {\n  width: 34px;\n  height: 34px;\n  display: grid;\n  place-items: center;\n  border-radius: 10px;\n  border: 1px solid rgba(122, 162, 255, 0.3);\n  background: radial-gradient(circle at 30% 20%, rgba(196, 155, 255, 0.33), rgba(122, 162, 255, 0.1) 50%, rgba(7, 11, 20, 0.8));\n  color: #cfe0ff;\n  font-family: var(--font-serif);\n  font-size: 20px;\n  box-shadow: inset 0 0 18px rgba(122, 162, 255, 0.13);\n}\n.brandWords { display: flex; flex-direction: column; }\n.brandWords b { font-family: var(--font-display); font-size: 14px; letter-spacing: 0.18em; line-height: 1; }\n.brandWords span { margin-top: 4px; color: var(--dim); font-size: 8px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; }\n.heroChip {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  min-width: 230px;\n  padding: 6px 12px 6px 6px;\n  border: 1px solid var(--line);\n  border-radius: 14px;\n  background: linear-gradient(135deg, rgba(18, 25, 42, 0.84), rgba(8, 12, 20, 0.62));\n  pointer-events: auto;\n  cursor: pointer;\n}\n.heroChip:hover { border-color: var(--line-strong); background: linear-gradient(135deg, rgba(24, 33, 53, 0.9), rgba(9, 14, 24, 0.78)); }\n.heroAvatar {\n  width: 38px;\n  height: 38px;\n  flex: none;\n  border-radius: 10px;\n  overflow: hidden;\n  border: 1px solid rgba(255, 255, 255, 0.16);\n  background: radial-gradient(circle at 50% 35%, rgba(122, 162, 255, 0.25), rgba(7, 10, 18, 0.95));\n}\n.heroAvatar img { width: 100%; height: 100%; object-fit: cover; display: block; }\n.heroChipCopy { min-width: 0; flex: 1; }\n.heroChipName { display: flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.heroChipName small { color: var(--dim); font-size: 9px; font-weight: 700; letter-spacing: 0.06em; }\n.heroChipMeta { display: flex; align-items: center; gap: 7px; margin-top: 4px; color: var(--muted); font-size: 9.5px; letter-spacing: 0.02em; }\n.heroChipMeta .xp { width: 66px; height: 3px; }\n.hudCenter { position: absolute; left: 50%; top: 20px; transform: translateX(-50%); text-align: center; pointer-events: none; }\n.hudCenter span { display: block; color: var(--dim); font-size: 8px; font-weight: 800; letter-spacing: 0.24em; text-transform: uppercase; }\n.hudCenter b { display: block; margin-top: 5px; font-family: var(--font-serif); font-size: 15px; font-weight: 500; color: #e9e7df; }\n.hudActions { margin-left: auto; display: flex; align-items: center; gap: 7px; }\n.hudResource {\n  display: inline-flex;\n  align-items: center;\n  gap: 7px;\n  min-height: 38px;\n  padding: 0 12px;\n  border: 1px solid var(--line);\n  border-radius: 11px;\n  background: rgba(8, 12, 22, 0.58);\n  color: var(--muted);\n  font-size: 11px;\n  font-weight: 800;\n  font-variant-numeric: tabular-nums;\n}\n.hudResource svg { color: var(--gold); }\n.hudLabel { display: inline-flex; align-items: center; gap: 6px; min-height: 38px; padding: 0 11px; border-radius: 11px; color: var(--muted); font-size: 10px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; border: 1px solid transparent; background: transparent; }\n.hudLabel:hover { color: var(--ink); border-color: var(--line); background: rgba(255, 255, 255, 0.05); }\n.hudLabel svg { color: var(--blue); }\n\n.tracker {\n  position: fixed;\n  z-index: 18;\n  top: 82px;\n  right: 18px;\n  width: 272px;\n  pointer-events: auto;\n  border: 1px solid var(--line);\n  border-radius: 16px;\n  background: linear-gradient(150deg, rgba(16, 23, 38, 0.9), rgba(8, 12, 22, 0.78));\n  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.26);\n  overflow: hidden;\n}\n.tracker::before { content: \"\"; display: block; height: 2px; background: linear-gradient(90deg, var(--teal), var(--blue), transparent); }\n.trackerBody { padding: 13px 14px 13px; }\n.tracker h3 { margin: 7px 0 4px; font-family: var(--font-serif); font-size: 18px; font-weight: 500; line-height: 1.15; letter-spacing: -0.01em; }\n.tracker p { margin: 0 0 11px; color: var(--muted); font-size: 10.5px; line-height: 1.45; }\n.trackerFoot { display: flex; align-items: center; gap: 8px; justify-content: space-between; }\n.trackerFoot .bar { flex: 1; height: 3px; }\n.trackerFoot small { color: var(--dim); font-size: 9px; font-weight: 700; }\n.tracker .dueTag { color: var(--amber); }\n.trackerAction { width: 100%; margin-top: 10px; }\n.tracker .miniLink { border: 0; padding: 0; background: none; color: var(--blue); font-size: 10px; font-weight: 800; letter-spacing: 0.03em; }\n\n.prompt {\n  position: fixed;\n  z-index: 22;\n  left: 50%;\n  bottom: 28px;\n  transform: translateX(-50%);\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  max-width: min(92vw, 540px);\n  padding: 9px 15px 9px 10px;\n  border: 1px solid rgba(228, 192, 122, 0.32);\n  border-radius: 999px;\n  background: rgba(8, 12, 20, 0.82);\n  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.36);\n  backdrop-filter: blur(9px);\n  color: var(--muted);\n  font-size: 11px;\n  font-weight: 600;\n  letter-spacing: 0.02em;\n  pointer-events: auto;\n  transition: opacity 160ms ease, transform 160ms ease;\n}\n.prompt kbd {\n  display: grid;\n  place-items: center;\n  width: 25px;\n  height: 25px;\n  border: 1px solid rgba(228, 192, 122, 0.55);\n  border-radius: 7px;\n  background: rgba(228, 192, 122, 0.11);\n  color: var(--gold);\n  font-family: var(--font-body);\n  font-size: 10px;\n  font-weight: 900;\n  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.4);\n}\n.prompt b { color: var(--ink); font-weight: 800; }\n.hintRow { position: fixed; z-index: 17; left: 20px; bottom: 18px; display: flex; align-items: center; gap: 14px; color: rgba(178, 190, 213, 0.64); font-size: 9.5px; letter-spacing: 0.04em; text-shadow: 0 1px 6px #000; }\n.hintRow span { display: inline-flex; align-items: center; gap: 4px; }\n.hintRow kbd { display: inline-grid; place-items: center; min-width: 17px; height: 17px; padding: 0 4px; border: 1px solid rgba(255, 255, 255, 0.18); border-radius: 4px; background: rgba(0, 0, 0, 0.32); color: #d0d8e8; font-family: var(--font-body); font-size: 8px; font-weight: 800; }\n\n/* ---------- Title ---------- */\n.titleScreen {\n  position: fixed;\n  inset: 0;\n  z-index: 40;\n  pointer-events: auto;\n  overflow: auto;\n  background:\n    radial-gradient(ellipse at 74% 42%, rgba(122, 162, 255, 0.1), transparent 34%),\n    linear-gradient(90deg, rgba(4, 6, 12, 0.97) 0%, rgba(4, 6, 12, 0.9) 34%, rgba(4, 6, 12, 0.48) 64%, rgba(4, 6, 12, 0.5) 100%),\n    linear-gradient(0deg, rgba(4, 6, 12, 0.94) 0%, transparent 48%);\n}\n.titleScreen::after {\n  content: \"\";\n  position: fixed;\n  inset: 0;\n  pointer-events: none;\n  background: radial-gradient(ellipse at center, transparent 42%, rgba(2, 4, 9, 0.55) 100%);\n}\n.titleInner {\n  position: relative;\n  z-index: 1;\n  min-height: 100%;\n  width: min(1400px, 100%);\n  margin: 0 auto;\n  padding: clamp(20px, 3.2vw, 44px) clamp(20px, 5.2vw, 84px) 28px;\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n  gap: 30px;\n}\n.titleTop { display: flex; align-items: center; justify-content: space-between; gap: 18px; }\n.titleBrand { display: flex; align-items: center; gap: 13px; }\n.titleBrandMark { width: 38px; height: 38px; border-radius: 10px; border: 1px solid rgba(228, 192, 122, 0.5); background: radial-gradient(circle at 32% 24%, rgba(228, 192, 122, 0.22), rgba(6, 10, 17, 0.86)); display: grid; place-items: center; color: var(--gold); font-family: var(--font-serif); font-size: 21px; box-shadow: 0 0 28px rgba(228, 192, 122, 0.08); }\n.titleBrandText b { display: block; font-family: var(--font-display); font-size: 13px; letter-spacing: 0.24em; }\n.titleBrandText span { display: block; margin-top: 4px; color: var(--dim); font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase; }\n.titleVersion { color: var(--dim); font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; font-weight: 700; }\n.titleMain { display: grid; grid-template-columns: minmax(0, 590px) minmax(260px, 1fr); align-items: center; gap: 18px; flex: 1; padding: 10px 0 12px; }\n.titleCopy { align-self: center; max-width: 600px; }\n.titlePrelude { display: flex; align-items: center; gap: 13px; margin-bottom: 20px; color: #d5dae6; font-size: 10px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; }\n.titlePrelude .line { width: 42px; height: 1px; background: linear-gradient(90deg, var(--gold), transparent); }\n.gameTitle { margin: 0; font-family: var(--font-display); font-size: clamp(59px, 10.5vw, 136px); font-weight: 800; letter-spacing: 0.035em; line-height: 0.76; text-transform: uppercase; text-shadow: 0 8px 50px rgba(0, 0, 0, 0.45); }\n.gameTitle .lineOne { color: #f4f1e8; }\n.gameTitle .lineTwo { display: block; color: transparent; -webkit-text-stroke: 1px rgba(228, 192, 122, 0.8); margin-left: 0.055em; }\n.titleQuestion { margin: 16px 0 0; font-family: var(--font-serif); font-size: clamp(23px, 3vw, 38px); font-weight: 400; line-height: 1.1; color: #e7e1d1; letter-spacing: -0.02em; }\n.titleQuestion em { color: var(--gold); font-style: normal; }\n.titleLead { max-width: 470px; margin: 13px 0 0; color: var(--muted); font-size: 12.5px; line-height: 1.65; }\n.titleActions { display: flex; align-items: center; flex-wrap: wrap; gap: 9px; margin-top: 23px; }\n.titleActions .btn--primary { min-width: 215px; justify-content: space-between; }\n.titleSecondary { margin-top: 14px; display: flex; align-items: center; flex-wrap: wrap; gap: 7px; }\n.titleStats { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 24px; }\n.pill { display: inline-flex; align-items: center; gap: 6px; padding: 7px 10px; border-radius: 999px; border: 1px solid var(--line); background: rgba(8, 12, 20, 0.4); color: var(--muted); font-size: 9.5px; font-weight: 700; letter-spacing: 0.03em; }\n.pill b { color: var(--ink); font-weight: 800; }\n.pill--gold { border-color: rgba(228, 192, 122, 0.28); color: #e7cf9f; background: rgba(96, 68, 24, 0.13); }\n.pill--teal { border-color: rgba(105, 211, 193, 0.24); color: #b6efe3; background: rgba(30, 92, 80, 0.14); }\n.pill--due { border-color: rgba(243, 181, 98, 0.35); color: #f4cf9f; }\n.titleHeroStage { position: relative; align-self: stretch; min-height: 380px; display: flex; align-items: center; justify-content: center; isolation: isolate; }\n.titleHeroStage::before { content: \"\"; position: absolute; inset: 4% 4%; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 48% 48% 44% 44%; background: radial-gradient(ellipse at 50% 58%, color-mix(in srgb, var(--hero-accent) 17%, transparent), transparent 62%); box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.32); transform: rotate(-2deg); z-index: -1; }\n.titleHeroHalo { position: absolute; width: 76%; aspect-ratio: 1; border-radius: 50%; border: 1px solid color-mix(in srgb, var(--hero-accent) 28%, transparent); box-shadow: 0 0 90px color-mix(in srgb, var(--hero-accent) 10%, transparent), inset 0 0 55px color-mix(in srgb, var(--hero-accent) 6%, transparent); opacity: 0.8; }\n.titleHeroHalo::before, .titleHeroHalo::after { content: \"\"; position: absolute; border-radius: 50%; border: 1px solid rgba(228, 192, 122, 0.16); }\n.titleHeroHalo::before { inset: 12%; border-style: dashed; }\n.titleHeroHalo::after { inset: 35%; border-color: color-mix(in srgb, var(--hero-accent) 28%, transparent); }\n.titleHeroOrbit { position: absolute; width: 48%; height: 1px; background: linear-gradient(90deg, transparent, rgba(228, 192, 122, 0.5), transparent); transform: rotate(-18deg); top: 28%; }\n.titleHeroOrbit::after { content: \"\"; position: absolute; right: 9%; top: -3px; width: 7px; height: 7px; border-radius: 50%; background: var(--hero-accent); box-shadow: 0 0 12px var(--hero-accent); }\n.titleHeroImg { position: relative; z-index: 2; display: block; height: clamp(310px, 55vh, 500px); width: auto; max-width: 100%; object-fit: contain; filter: drop-shadow(0 24px 28px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 24px color-mix(in srgb, var(--hero-accent) 10%, transparent)); transform: translateY(-2%); }\n.titleHeroPlaque { position: absolute; z-index: 4; left: 50%; bottom: 7px; transform: translateX(-50%); width: min(275px, 92%); padding: 11px 13px; border: 1px solid rgba(255, 255, 255, 0.13); border-top-color: color-mix(in srgb, var(--hero-accent) 50%, transparent); border-radius: 8px; background: linear-gradient(160deg, rgba(9, 14, 24, 0.9), rgba(6, 9, 16, 0.8)); backdrop-filter: blur(8px); box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3); }\n.titleHeroPlaque b { display: block; margin-top: 5px; font-family: var(--font-serif); font-size: 20px; font-weight: 500; line-height: 1; }\n.titleHeroPlaque small { display: block; margin-top: 4px; color: var(--dim); font-size: 8px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }\n.titleHeroPlaque p { margin: 7px 0 0; color: var(--muted); font-family: var(--font-serif); font-size: 10.5px; font-style: italic; line-height: 1.35; }\n.titleAside { align-self: end; justify-self: end; width: min(260px, 100%); padding: 15px 16px; border: 1px solid var(--line); border-left-color: rgba(228, 192, 122, 0.45); background: linear-gradient(145deg, rgba(13, 18, 30, 0.64), rgba(7, 10, 17, 0.3)); backdrop-filter: blur(6px); }\n.titleAside h4 { margin: 7px 0 6px; font-family: var(--font-serif); font-size: 16px; font-weight: 500; color: #ece5d4; }\n.titleAside p { margin: 0; color: var(--muted); font-size: 10.5px; line-height: 1.55; }\n.titleAside .asideRule { height: 1px; margin: 12px 0 10px; background: linear-gradient(90deg, var(--line-strong), transparent); }\n.titleFooter { display: flex; align-items: center; justify-content: space-between; gap: 15px; padding-top: 15px; border-top: 1px solid rgba(255, 255, 255, 0.08); color: var(--dim); font-size: 9px; letter-spacing: 0.08em; }\n.titleFooter span { display: inline-flex; align-items: center; gap: 7px; }\n.titleFooter kbd { padding: 3px 5px; border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 4px; font-size: 8px; }\n\n/* ---------- Shared overlays ---------- */\n.overlay {\n  position: fixed;\n  inset: 0;\n  z-index: 35;\n  overflow: auto;\n  pointer-events: auto;\n  padding: clamp(14px, 2.4vw, 30px) clamp(14px, 4vw, 54px) 28px;\n  background:\n    radial-gradient(ellipse at 80% 15%, rgba(122, 162, 255, 0.055), transparent 40%),\n    radial-gradient(ellipse at 20% 90%, rgba(196, 155, 255, 0.04), transparent 45%),\n    rgba(3, 5, 10, 0.82);\n  backdrop-filter: blur(10px);\n  animation: overlayIn 200ms ease both;\n}\n.overlayShell { width: min(1260px, 100%); margin: 0 auto; }\n.sheetHead { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; }\n.sheetHead h1 { margin: 8px 0 0; font-family: var(--font-serif); font-size: clamp(27px, 3.4vw, 43px); font-weight: 400; line-height: 1.04; letter-spacing: -0.025em; }\n.sheetHead h1 em { color: var(--gold); font-style: normal; }\n.sheetHead p { max-width: 700px; margin: 8px 0 0; color: var(--muted); font-size: 11.5px; line-height: 1.55; }\n.sheetHeadSide { display: flex; align-items: center; gap: 9px; flex: none; padding-top: 4px; }\n.sheetClose { width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--line); background: rgba(10, 14, 24, 0.7); color: var(--muted); display: grid; place-items: center; }\n.sheetClose:hover { color: var(--ink); border-color: var(--line-strong); background: rgba(255, 255, 255, 0.07); }\n.panel { border: 1px solid var(--line); border-radius: 16px; background: linear-gradient(150deg, rgba(17, 23, 37, 0.9), rgba(8, 12, 21, 0.82)); box-shadow: var(--shadow); }\n.panel--pad { padding: 18px; }\n.panel--soft { background: rgba(11, 16, 27, 0.66); box-shadow: none; }\n.sectionDivider { height: 1px; margin: 16px 0; background: linear-gradient(90deg, var(--line), transparent); }\n.chip { display: inline-flex; align-items: center; gap: 5px; min-height: 22px; padding: 4px 8px; border: 1px solid var(--line); border-radius: 6px; background: rgba(255, 255, 255, 0.035); color: var(--muted); font-size: 9px; font-weight: 700; letter-spacing: 0.035em; white-space: nowrap; }\n.chip--accent { border-color: rgba(105, 211, 193, 0.3); color: #b5f0e4; background: rgba(45, 118, 100, 0.15); }\n.chip--gold { border-color: rgba(228, 192, 122, 0.3); color: var(--gold); background: rgba(113, 78, 26, 0.13); }\n.chip--rose { border-color: rgba(255, 139, 157, 0.3); color: #ffbac4; background: rgba(113, 33, 48, 0.14); }\n.chip--completed { border-color: rgba(105, 211, 193, 0.28); color: #a9e6d8; background: rgba(34, 98, 81, 0.15); }\n.emptyState { padding: 38px 22px; text-align: center; border: 1px dashed var(--line-strong); border-radius: 16px; background: rgba(8, 12, 20, 0.45); }\n.emptyState h3 { margin: 10px 0 5px; font-family: var(--font-serif); font-size: 22px; font-weight: 500; }\n.emptyState p { max-width: 480px; margin: 0 auto; color: var(--muted); font-size: 11.5px; line-height: 1.6; }\n.notice { padding: 11px 13px; border: 1px solid rgba(243, 181, 98, 0.24); border-radius: 10px; background: rgba(105, 67, 20, 0.12); color: #e8c899; font-size: 10.5px; line-height: 1.55; }\n.notice b { color: #ffe0ac; }\n.statRow { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }\n.stat { padding: 11px 12px; border: 1px solid var(--line); border-radius: 11px; background: rgba(255, 255, 255, 0.025); }\n.stat b { display: block; font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--ink); line-height: 1; }\n.stat span { display: block; margin-top: 5px; color: var(--dim); font-size: 8.5px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; }\n.stat--accent b { color: var(--teal); }\n.stat--gold b { color: var(--gold); }\n\n/* ---------- Atlas / journal ---------- */\n.atlasGrid { display: grid; grid-template-columns: 196px minmax(280px, 1fr) 316px; gap: 13px; align-items: start; }\n.areaList { display: flex; flex-direction: column; gap: 6px; }\n.areaTab { width: 100%; padding: 11px 11px 10px 13px; text-align: left; border: 1px solid var(--line); border-left: 2px solid transparent; border-radius: 10px; background: rgba(10, 15, 25, 0.7); color: var(--muted); transition: background 150ms ease, border-color 150ms ease, color 150ms ease; }\n.areaTab:hover { background: rgba(255, 255, 255, 0.055); color: var(--ink); }\n.areaTab.is-active { background: linear-gradient(90deg, color-mix(in srgb, var(--area) 13%, transparent), rgba(8, 12, 20, 0.6)); border-color: color-mix(in srgb, var(--area) 33%, transparent); border-left-color: var(--area); color: var(--ink); }\n.areaTabTop { display: flex; align-items: center; gap: 7px; }\n.areaTabDot { width: 6px; height: 6px; border-radius: 50%; background: var(--area); box-shadow: 0 0 8px color-mix(in srgb, var(--area) 70%, transparent); flex: none; }\n.areaTab b { display: block; font-size: 11px; font-weight: 800; line-height: 1.25; }\n.areaTab small { display: block; margin-top: 5px; color: var(--dim); font-size: 8.5px; font-weight: 700; letter-spacing: 0.04em; }\n.areaTab .miniBar { height: 2px; margin-top: 8px; background: rgba(255, 255, 255, 0.08); border-radius: 99px; overflow: hidden; }\n.areaTab .miniBar i { display: block; height: 100%; background: var(--area); border-radius: inherit; }\n.areaOverview { margin-top: 8px; padding: 11px; border: 1px solid var(--line); border-radius: 10px; background: rgba(8, 12, 20, 0.4); }\n.areaOverview span { display: block; color: var(--dim); font-size: 8px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }\n.areaOverview b { display: block; margin-top: 4px; font-family: var(--font-serif); font-size: 14px; font-weight: 500; color: #dfe3ec; }\n.areaOverview small { display: block; margin-top: 4px; color: var(--muted); font-size: 9px; line-height: 1.4; }\n.routePanel { padding: 15px; }\n.routeHead { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 13px; }\n.routeHead h2 { margin: 5px 0 0; font-family: var(--font-serif); font-size: 22px; font-weight: 500; line-height: 1.05; }\n.routeHead .progressLine { width: 95px; margin-top: 8px; }\n.routePath { position: relative; display: flex; flex-direction: column; gap: 7px; }\n.routePath::before { content: \"\"; position: absolute; top: 20px; bottom: 20px; left: 20px; width: 1px; background: linear-gradient(var(--line-strong), var(--line), transparent); }\n.nodeRow { position: relative; display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 10px 10px 8px; text-align: left; border: 1px solid var(--line); border-radius: 10px; background: rgba(8, 12, 20, 0.6); color: var(--ink); transition: border-color 150ms ease, background 150ms ease, transform 150ms ease; }\n.nodeRow:hover { border-color: var(--line-strong); background: rgba(255, 255, 255, 0.05); transform: translateX(2px); }\n.nodeRow.is-active { border-color: color-mix(in srgb, var(--area) 56%, transparent); background: linear-gradient(90deg, color-mix(in srgb, var(--area) 11%, transparent), rgba(8, 12, 20, 0.74)); }\n.nodeRow.is-locked { color: var(--dim); }\n.nodeRow.is-completed .nodeIndex { border-color: rgba(105, 211, 193, 0.5); color: var(--teal); background: rgba(39, 106, 90, 0.16); }\n.nodeRow.is-boss { border-color: rgba(228, 192, 122, 0.22); }\n.nodeRow.is-boss .nodeIndex { border-color: rgba(228, 192, 122, 0.44); color: var(--gold); }\n.nodeIndex { position: relative; z-index: 1; width: 25px; height: 25px; flex: none; display: grid; place-items: center; border: 1px solid var(--line-strong); border-radius: 50%; background: #0b111c; color: var(--muted); font-size: 9px; font-weight: 900; }\n.nodeCopy { flex: 1; min-width: 0; }\n.nodeCopy b { display: block; font-size: 11px; font-weight: 800; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.nodeCopy small { display: block; margin-top: 3px; color: var(--dim); font-size: 8.5px; line-height: 1.35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.nodeSide { display: flex; align-items: center; gap: 5px; flex: none; }\n.nodeSide .chip { min-height: 18px; padding: 3px 5px; font-size: 7.5px; }\n.nodeLock { color: var(--dim); }\n.nodeChev { color: var(--dim); }\n.detailPanel { position: sticky; top: 0; padding: 16px; }\n.detailAccent { width: 34px; height: 2px; margin-bottom: 10px; background: var(--accent); box-shadow: 0 0 10px var(--accent); }\n.detailPanel h2 { margin: 6px 0 5px; font-family: var(--font-serif); font-size: 24px; font-weight: 500; line-height: 1.06; letter-spacing: -0.02em; }\n.detailPanel .subtitle { margin: 0; color: var(--muted); font-size: 10.5px; line-height: 1.45; }\n.detailTags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }\n.detailDesc { margin: 12px 0 0; color: var(--muted); font-size: 10.5px; line-height: 1.55; }\n.rewardList { display: flex; flex-direction: column; gap: 7px; margin-top: 13px; }\n.rewardLine { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-top: 7px; border-top: 1px solid rgba(255, 255, 255, 0.07); color: var(--muted); font-size: 9.5px; }\n.rewardLine b { color: var(--ink); font-weight: 800; font-size: 10.5px; }\n.reqList { display: flex; flex-direction: column; gap: 5px; margin-top: 10px; }\n.req { display: flex; align-items: flex-start; gap: 6px; color: var(--dim); font-size: 9px; line-height: 1.35; }\n.req.is-met { color: #b8e3d8; }\n.req svg { flex: none; margin-top: 1px; }\n.detailActions { display: flex; flex-direction: column; gap: 7px; margin-top: 14px; }\n.detailFootnote { margin: 9px 0 0; color: var(--dim); font-size: 8.5px; line-height: 1.45; }\n.atlasFooter { display: flex; justify-content: space-between; gap: 12px; margin-top: 15px; padding-top: 12px; border-top: 1px solid var(--line); color: var(--dim); font-size: 9px; line-height: 1.5; }\n\n/* ---------- Duel ---------- */\n.duelTop {\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  z-index: 25;\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  padding: 13px 18px;\n  pointer-events: none;\n  background: linear-gradient(180deg, rgba(3, 5, 10, 0.84), transparent);\n}\n.duelTop > * { pointer-events: auto; }\n.duelChip { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border: 1px solid var(--line); border-radius: 12px; background: rgba(8, 12, 21, 0.78); backdrop-filter: blur(7px); }\n.duelChip .areaGlyph { width: 24px; height: 24px; border-radius: 7px; display: grid; place-items: center; color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent); font-size: 12px; }\n.duelChip small { display: block; color: var(--dim); font-size: 8px; font-weight: 800; letter-spacing: 0.13em; text-transform: uppercase; }\n.duelChip b { display: block; margin-top: 2px; font-family: var(--font-serif); font-size: 13px; font-weight: 500; }\n.duelHearts { margin-left: auto; display: flex; align-items: center; gap: 10px; }\n.heartRow { display: flex; gap: 4px; color: var(--rose); filter: drop-shadow(0 0 7px rgba(255, 139, 157, 0.3)); }\n.heartRow svg { transition: opacity 220ms ease, transform 220ms ease; }\n.heartRow svg.is-empty { opacity: 0.22; transform: scale(0.9); }\n.duelProgress { display: flex; align-items: center; gap: 8px; min-width: 120px; }\n.qDots { display: flex; gap: 4px; }\n.qDot { width: 15px; height: 3px; border-radius: 99px; background: rgba(255, 255, 255, 0.13); }\n.qDot.is-done { background: var(--teal); }\n.qDot.is-current { background: var(--blue); box-shadow: 0 0 7px var(--blue); }\n.duelTop .btn { background: rgba(8, 12, 21, 0.72); }\n.duelPanelWrap { position: fixed; left: 0; right: 0; bottom: 0; z-index: 36; display: flex; justify-content: center; padding: 0 clamp(10px, 3vw, 30px) clamp(10px, 2.1vh, 22px); pointer-events: none; }\n.duelPanel {\n  pointer-events: auto;\n  width: min(1080px, 100%);\n  border: 1px solid rgba(172, 196, 240, 0.22);\n  border-radius: 18px;\n  background:\n    linear-gradient(180deg, rgba(20, 27, 44, 0.96), rgba(8, 12, 20, 0.97)),\n    radial-gradient(ellipse at 50% 0%, rgba(122, 162, 255, 0.07), transparent 60%);\n  box-shadow: 0 -12px 70px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.08);\n  overflow: hidden;\n  animation: duelIn 280ms cubic-bezier(0.2, 0.75, 0.25, 1) both;\n}\n.duelPanel::before { content: \"\"; position: absolute; top: 0; left: 15%; right: 15%; height: 1px; background: linear-gradient(90deg, transparent, var(--accent), transparent); opacity: 0.8; }\n.duelPanelHead { display: flex; align-items: center; gap: 10px; padding: 12px 18px 0; }\n.duelPanelHead .qCategory { color: var(--accent); font-size: 8.5px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; }\n.duelPanelHead .qSource { margin-left: auto; color: var(--dim); font-size: 8px; white-space: nowrap; }\n.duelPanelBody { padding: 8px 18px 14px; }\n.questionText { margin: 0; color: #f0f2f9; font-family: var(--font-serif); font-size: clamp(15px, 1.9vw, 20px); font-weight: 400; line-height: 1.35; letter-spacing: -0.005em; max-height: 96px; overflow: auto; padding-right: 6px; }\n.answers { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-top: 12px; }\n.answerBtn {\n  display: flex;\n  align-items: flex-start;\n  gap: 9px;\n  width: 100%;\n  min-height: 43px;\n  padding: 8px 10px;\n  text-align: left;\n  border: 1px solid var(--line);\n  border-radius: 10px;\n  background: rgba(255, 255, 255, 0.035);\n  color: #dbe2ef;\n  font-size: 10.5px;\n  line-height: 1.35;\n  transition: background 130ms ease, border-color 130ms ease, transform 130ms ease;\n}\n.answerBtn:hover:not(:disabled) { background: rgba(122, 162, 255, 0.1); border-color: rgba(122, 162, 255, 0.45); transform: translateY(-1px); }\n.answerKey { flex: none; display: grid; place-items: center; width: 20px; height: 20px; border: 1px solid var(--line-strong); border-radius: 5px; color: var(--muted); font-size: 9px; font-weight: 900; }\n.answerBtn.is-selected { border-color: rgba(122, 162, 255, 0.7); background: rgba(71, 102, 186, 0.2); }\n.answerBtn.is-correct { border-color: rgba(105, 211, 193, 0.62); background: rgba(38, 121, 104, 0.19); color: #d2f7ef; }\n.answerBtn.is-correct .answerKey { border-color: rgba(105, 211, 193, 0.6); color: var(--teal); background: rgba(105, 211, 193, 0.12); }\n.answerBtn.is-wrong { border-color: rgba(255, 139, 157, 0.58); background: rgba(119, 36, 50, 0.2); color: #ffd8de; }\n.answerBtn.is-wrong .answerKey { border-color: rgba(255, 139, 157, 0.55); color: var(--rose); background: rgba(255, 139, 157, 0.1); }\n.answerBtn.is-muted { opacity: 0.42; }\n.answerBtn:disabled { cursor: default; }\n.duelFoot { display: flex; align-items: center; gap: 12px; margin-top: 9px; min-height: 19px; }\n.duelFoot .hint { color: var(--dim); font-size: 8.5px; letter-spacing: 0.03em; }\n.duelFoot .hint kbd { margin: 0 2px; padding: 2px 4px; border: 1px solid var(--line); border-radius: 3px; background: rgba(255, 255, 255, 0.04); font-size: 7.5px; }\n.feedbackStrip { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 10px; border-radius: 9px; border: 1px solid var(--line); background: rgba(255, 255, 255, 0.035); font-size: 10px; }\n.feedbackStrip.is-correct { border-color: rgba(105, 211, 193, 0.26); background: rgba(34, 102, 86, 0.12); color: #bdece2; }\n.feedbackStrip.is-wrong { border-color: rgba(255, 139, 157, 0.25); background: rgba(104, 31, 43, 0.13); color: #ffc2cb; }\n.feedbackIcon { width: 23px; height: 23px; flex: none; display: grid; place-items: center; border-radius: 50%; border: 1px solid currentColor; }\n.feedbackText { flex: 1; line-height: 1.45; }\n.feedbackText b { color: var(--ink); }\n.feedbackText span { display: block; margin-top: 1px; color: var(--muted); font-size: 8.5px; }\n.nextBtn { flex: none; min-height: 30px; padding: 6px 10px; font-size: 10px; }\n.duelStatus { position: fixed; left: 18px; top: 74px; z-index: 25; color: var(--muted); font-size: 10px; letter-spacing: 0.05em; text-shadow: 0 1px 5px #000; }\n.hitFlash { position: fixed; inset: 0; z-index: 50; pointer-events: none; opacity: 0; background: radial-gradient(ellipse at center, transparent 45%, rgba(255, 58, 82, 0.35) 100%); }\n.hitFlash.is-on { animation: hitFlash 440ms ease-out; }\n.attackFlash { position: fixed; inset: 0; z-index: 49; pointer-events: none; opacity: 0; background: radial-gradient(ellipse at 50% 48%, rgba(140, 210, 255, 0.22), transparent 62%); }\n.attackFlash.is-on { animation: attackFlash 400ms ease-out; }\n.ambientRune { position: fixed; z-index: 5; left: 50%; top: 50%; width: 40vmin; height: 40vmin; margin: -20vmin; border: 1px solid rgba(228, 192, 122, 0.09); border-radius: 50%; pointer-events: none; opacity: 0.45; box-shadow: 0 0 100px rgba(228, 192, 122, 0.03); }\n\n/* ---------- Result ---------- */\n.resultScreen { position: fixed; inset: 0; z-index: 60; pointer-events: auto; overflow: hidden; display: flex; align-items: flex-start; justify-content: center; padding: clamp(8px, 2.4vw, 28px); background: radial-gradient(ellipse at 50% 30%, rgba(23, 35, 61, 0.6), rgba(3, 5, 10, 0.94) 55%); animation: overlayIn 260ms ease both; }\n.resultCard { position: relative; width: min(940px, 100%); max-height: calc(100vh - clamp(16px, 4.8vw, 56px)); display: flex; flex-direction: column; border: 1px solid var(--line-strong); border-radius: 20px; overflow: hidden; background: linear-gradient(155deg, rgba(21, 28, 45, 0.96), rgba(7, 11, 19, 0.98)); box-shadow: 0 40px 120px rgba(0, 0, 0, 0.6); }\n.resultCard::before { content: \"\"; display: block; height: 2px; background: linear-gradient(90deg, transparent, var(--accent, var(--teal)), transparent); }\n.resultHead { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 22px 26px 16px; flex: none; min-height: 0; }\n.resultHead h1 { margin: 8px 0 0; font-family: var(--font-serif); font-size: clamp(30px, 4.6vw, 54px); font-weight: 400; line-height: 0.98; letter-spacing: -0.035em; }\n.resultHead h1 em { font-style: normal; color: var(--accent, var(--teal)); }\n.resultSeal { flex: none; width: 106px; height: 106px; border-radius: 50%; display: grid; place-items: center; position: relative; border: 1px solid color-mix(in srgb, var(--accent, var(--teal)) 34%, transparent); background: radial-gradient(circle, color-mix(in srgb, var(--accent, var(--teal)) 11%, transparent), transparent 70%); }\n.resultSeal::before { content: \"\"; position: absolute; inset: 7px; border: 1px dashed color-mix(in srgb, var(--accent, var(--teal)) 30%, transparent); border-radius: 50%; animation: slowSpin 22s linear infinite; }\n.resultSeal b { font-family: var(--font-serif); font-size: 30px; font-weight: 400; color: var(--ink); }\n.resultSeal small { font-size: 7px; font-weight: 800; letter-spacing: 0.17em; text-transform: uppercase; color: var(--muted); }\n.resultBody { display: grid; grid-template-columns: 1.08fr 0.92fr; gap: 24px; padding: 0 26px 22px; min-height: 0; overflow: auto; flex: 1; }\n.resultReasons { border-top: 1px solid var(--line); padding-top: 13px; color: var(--muted); font-size: 10.5px; line-height: 1.55; }\n.resultReasons strong { color: var(--ink); font-weight: 700; }\n.resultStats { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-top: 12px; }\n.resultStat { padding: 11px; border: 1px solid var(--line); border-radius: 10px; background: rgba(255, 255, 255, 0.03); }\n.resultStat b { display: block; font-size: 23px; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }\n.resultStat span { display: block; margin-top: 4px; color: var(--dim); font-size: 8px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }\n.resultStat--gold b { color: var(--gold); }\n.resultStat--teal b { color: var(--teal); }\n.resultAside { border-left: 1px solid var(--line); padding-left: 22px; }\n.resultAside h3 { margin: 0 0 8px; color: var(--muted); font-size: 8.5px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; }\n.rewardRows { display: flex; flex-direction: column; gap: 7px; }\n.rewardRow { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-bottom: 7px; border-bottom: 1px solid rgba(255, 255, 255, 0.07); color: var(--muted); font-size: 10px; }\n.rewardRow b { color: var(--ink); font-weight: 800; font-size: 12px; font-variant-numeric: tabular-nums; }\n.resultNext { margin-top: 14px; padding: 11px; border: 1px solid var(--line); border-radius: 10px; background: rgba(10, 15, 25, 0.5); }\n.resultNext p { margin: 4px 0 0; color: var(--dim); font-size: 9px; line-height: 1.45; }\n.resultNext b { color: var(--muted); font-size: 10px; }\n.resultFoot { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 14px 26px 18px; border-top: 1px solid var(--line); flex: none; background: rgba(8, 12, 20, 0.55); }\n.resultFoot .footMeta { color: var(--dim); font-size: 8.5px; letter-spacing: 0.04em; }\n.resultFoot .actions { display: flex; gap: 7px; flex-wrap: wrap; justify-content: flex-end; }\n.answerReview { margin-top: 9px; max-height: 88px; overflow: auto; }\n.answerReviewRow { display: flex; gap: 7px; align-items: flex-start; padding: 4px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.045); color: var(--muted); font-size: 8.5px; line-height: 1.35; }\n.answerReviewRow svg { flex: none; margin-top: 1px; }\n.answerReviewRow b { color: var(--ink); font-weight: 600; }\n\n/* ---------- Heroes ---------- */\n.heroToolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 13px; }\n.heroToolbar .chip { min-height: 25px; padding: 5px 9px; }\n.heroGrid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }\n.heroCard { position: relative; padding: 0; border: 1px solid var(--line); border-radius: 13px; overflow: hidden; text-align: left; background: rgba(9, 14, 24, 0.7); transition: border-color 150ms ease, transform 150ms ease, background 150ms ease; }\n.heroCard:hover { border-color: var(--line-strong); transform: translateY(-2px); background: rgba(18, 25, 40, 0.85); }\n.heroCard.is-active { border-color: color-mix(in srgb, var(--hero-accent) 65%, transparent); box-shadow: 0 0 0 1px color-mix(in srgb, var(--hero-accent) 25%, transparent), 0 12px 30px rgba(0, 0, 0, 0.25); }\n.heroCard.is-locked { opacity: 0.86; }\n.heroCard.is-locked:hover { border-color: color-mix(in srgb, var(--hero-accent) 40%, var(--line)); }\n.heroPortrait { position: relative; display: block; aspect-ratio: 1 / 1; background: radial-gradient(ellipse at 50% 75%, color-mix(in srgb, var(--hero-accent) 22%, transparent), transparent 68%), linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(0, 0, 0, 0.2)); overflow: hidden; }\n.heroPortrait::after { content: \"\"; position: absolute; inset: 0; background: linear-gradient(0deg, rgba(5, 8, 14, 0.88), transparent 42%); }\n.heroPortrait img { width: 100%; height: 100%; object-fit: contain; display: block; transform: scale(1.15) translateY(2%); filter: drop-shadow(0 15px 12px rgba(0, 0, 0, 0.45)); }\n.heroCard.is-locked .heroPortrait img { filter: grayscale(0.36) brightness(0.8); }\n.heroCard.is-locked .heroPortrait::before { content: \"\"; position: absolute; inset: 0; z-index: 1; background: linear-gradient(180deg, rgba(4, 7, 12, 0.15), rgba(4, 7, 12, 0.35)); }\n.heroCardTop { position: absolute; top: 8px; left: 8px; right: 8px; display: flex; justify-content: space-between; gap: 4px; z-index: 1; }\n.heroCardTop .chip { backdrop-filter: blur(4px); background: rgba(8, 12, 20, 0.66); }\n.heroCardInfo { display: block; padding: 9px 10px 10px; position: relative; z-index: 1; margin-top: -20px; }\n.heroCardInfo > b { display: block; font-family: var(--font-serif); font-size: 16px; font-weight: 500; line-height: 1.05; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.heroCardInfo > small { display: block; margin-top: 4px; color: var(--dim); font-size: 8.5px; font-weight: 700; letter-spacing: 0.035em; }\n.heroCardCta { display: flex; align-items: center; justify-content: space-between; gap: 5px; margin-top: 7px; padding-top: 6px; border-top: 1px solid rgba(255, 255, 255, 0.08); color: var(--dim); font-size: 7.8px; font-weight: 700; letter-spacing: 0.01em; }\n.heroCardCta span { display: inline-flex; align-items: center; gap: 4px; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.heroCardCta b { color: var(--gold); font-size: 9px; font-weight: 800; white-space: nowrap; }\n.heroCardCta svg { color: var(--gold); flex: none; }\n.heroCardActiveTag { position: absolute; left: 50%; bottom: 70px; z-index: 2; transform: translateX(-50%); white-space: nowrap; }\n.ownedMark { display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; border-radius: 50%; background: var(--teal); color: #071018; font-size: 8px; font-weight: 900; }\n.heroNote { margin-top: 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }\n.heroNote p { margin: 0; color: var(--dim); font-size: 9.5px; line-height: 1.5; }\n\n/* ---------- Recruit ---------- */\n.recruitGrid { display: grid; grid-template-columns: minmax(280px, 0.86fr) minmax(0, 1.14fr); gap: 14px; align-items: stretch; }\n.recruitPortrait { position: relative; min-height: 420px; display: flex; align-items: center; justify-content: center; padding: 20px; border: 1px solid var(--line); border-radius: 18px; overflow: hidden; background: radial-gradient(ellipse at 50% 68%, color-mix(in srgb, var(--hero-accent) 22%, transparent), transparent 60%), linear-gradient(160deg, rgba(16, 23, 38, 0.94), rgba(7, 11, 19, 0.95)); }\n.recruitPortrait::before { content: \"\"; position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.35)); }\n.recruitHalo { position: absolute; width: 74%; aspect-ratio: 1; border-radius: 50%; border: 1px solid color-mix(in srgb, var(--hero-accent) 28%, transparent); box-shadow: inset 0 0 60px color-mix(in srgb, var(--hero-accent) 8%, transparent); }\n.recruitHalo::before { content: \"\"; position: absolute; inset: 13%; border: 1px dashed rgba(228, 192, 122, 0.18); border-radius: 50%; animation: slowSpin 30s linear infinite; }\n.recruitPortrait img { position: relative; z-index: 2; display: block; width: 100%; max-width: 430px; max-height: min(56vh, 500px); object-fit: contain; filter: drop-shadow(0 22px 25px rgba(0, 0, 0, 0.5)); }\n.recruitQuote { position: absolute; z-index: 3; left: 16px; right: 16px; bottom: 14px; padding: 10px 12px; border: 1px solid var(--line); border-left-color: var(--hero-accent); border-radius: 7px; background: rgba(6, 10, 17, 0.84); color: var(--muted); font-family: var(--font-serif); font-size: 11px; font-style: italic; line-height: 1.4; }\n.recruitBody { padding: 20px; overflow: auto; }\n.recruitBody h2 { margin: 12px 0 2px; font-family: var(--font-serif); font-size: clamp(30px, 4vw, 43px); font-weight: 400; line-height: 0.98; letter-spacing: -0.03em; }\n.recruitSubtitle { margin: 0; color: var(--muted); font-size: 10px; letter-spacing: 0.04em; }\n.recruitBody .detailDesc { margin-top: 10px; }\n.recruitAttrs { display: flex; flex-direction: column; gap: 6px; margin-top: 14px; }\n.recruitAttr { display: grid; grid-template-columns: 76px minmax(0, 1fr) 24px; align-items: center; gap: 8px; color: var(--dim); font-size: 8.5px; font-weight: 700; letter-spacing: 0.03em; }\n.recruitAttr .bar { height: 3px; }\n.recruitAttr b { color: var(--muted); text-align: right; font-size: 9px; font-variant-numeric: tabular-nums; }\n.recruitBalance { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 12px; padding: 9px 10px; border: 1px solid var(--line); border-radius: 7px; color: var(--muted); font-size: 9.5px; }\n.recruitBalance span { display: inline-flex; align-items: center; gap: 5px; }\n.recruitBalance b { color: var(--gold); font-size: 12px; }\n.recruitActions { display: flex; flex-direction: column; gap: 5px; margin-top: 12px; }\n\n/* ---------- Review ---------- */\n.reviewTop { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 13px; }\n.reviewBody { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 13px; align-items: start; }\n.reviewList { padding: 14px; }\n.reviewListHead { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }\n.reviewListHead h2 { margin: 0; font-family: var(--font-serif); font-size: 20px; font-weight: 500; }\n.errorRow { display: flex; align-items: flex-start; gap: 10px; padding: 10px; border-top: 1px solid rgba(255, 255, 255, 0.07); }\n.errorRow:first-of-type { border-top: 0; }\n.errorStatus { width: 8px; height: 8px; margin-top: 4px; flex: none; border-radius: 50%; background: var(--dim); }\n.errorStatus.is-due { background: var(--amber); box-shadow: 0 0 9px rgba(243, 181, 98, 0.6); }\n.errorStatus.is-recovered { background: var(--teal); }\n.errorCopy { flex: 1; min-width: 0; }\n.errorCopy b { display: block; font-size: 10.5px; line-height: 1.35; font-weight: 600; color: #dfe5ef; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }\n.errorCopy small { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 4px; color: var(--dim); font-size: 8px; }\n.errorCopy small span { display: inline-flex; align-items: center; gap: 3px; }\n.errorSide { flex: none; text-align: right; }\n.errorSide .chip { min-height: 19px; padding: 3px 6px; font-size: 7.5px; }\n.reviewSide { padding: 16px; }\n.reviewSide h3 { margin: 6px 0 8px; font-family: var(--font-serif); font-size: 21px; font-weight: 500; }\n.reviewSide p { margin: 0 0 13px; color: var(--muted); font-size: 10px; line-height: 1.55; }\n.reviewRule { display: flex; gap: 8px; padding: 8px 0; border-top: 1px solid rgba(255, 255, 255, 0.07); color: var(--dim); font-size: 9px; line-height: 1.4; }\n.reviewRule b { color: var(--muted); font-weight: 700; }\n.reviewActions { display: flex; flex-direction: column; gap: 7px; margin-top: 13px; }\n.reviewEmpty { padding: 30px 18px; text-align: center; color: var(--muted); font-size: 11px; line-height: 1.5; }\n\n/* ---------- Import ---------- */\n.importGrid { display: grid; grid-template-columns: 1.02fr 0.98fr; gap: 13px; align-items: start; }\n.importCard { padding: 18px; }\n.importCard h2 { margin: 6px 0 6px; font-family: var(--font-serif); font-size: 25px; font-weight: 500; }\n.importCard p { margin: 0; color: var(--muted); font-size: 10.5px; line-height: 1.6; }\n.dropZone { display: grid; place-items: center; min-height: 144px; margin-top: 13px; padding: 18px; text-align: center; border: 1px dashed var(--line-strong); border-radius: 12px; background: rgba(255, 255, 255, 0.025); color: var(--muted); font-size: 10.5px; line-height: 1.5; transition: border-color 140ms ease, background 140ms ease; }\n.dropZone:hover { border-color: var(--teal); background: rgba(105, 211, 193, 0.04); }\n.dropZone svg { color: var(--teal); margin-bottom: 6px; }\n.dropZone b { color: var(--ink); font-weight: 700; }\n.importOr { display: flex; align-items: center; gap: 9px; margin: 13px 0; color: var(--dim); font-size: 8px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; }\n.importOr::before, .importOr::after { content: \"\"; flex: 1; height: 1px; background: var(--line); }\n.inputArea { width: 100%; min-height: 92px; padding: 10px; resize: vertical; border: 1px solid var(--line); border-radius: 10px; background: rgba(4, 8, 14, 0.8); color: var(--muted); font-family: ui-monospace, \"Cascadia Mono\", Consolas, monospace; font-size: 9px; line-height: 1.45; }\n.inputArea:focus { outline: none; border-color: rgba(122, 162, 255, 0.5); }\n.importActions { display: flex; align-items: center; gap: 7px; margin-top: 10px; }\n.importGuide { display: flex; flex-direction: column; gap: 10px; }\n.importStep { display: flex; gap: 9px; color: var(--muted); font-size: 10px; line-height: 1.55; }\n.importStepNum { flex: none; width: 20px; height: 20px; display: grid; place-items: center; border: 1px solid var(--line-strong); border-radius: 50%; color: var(--gold); font-size: 8px; font-weight: 800; }\n.importStep b { color: var(--ink); font-weight: 700; }\n.importPreview { margin-top: 13px; padding: 13px; border: 1px solid rgba(105, 211, 193, 0.25); border-radius: 11px; background: rgba(28, 82, 70, 0.1); }\n.importPreview h3 { margin: 0 0 7px; color: #b6eadd; font-size: 11px; font-weight: 800; }\n.importPreview .previewName { font-family: var(--font-serif); font-size: 20px; color: var(--ink); margin-bottom: 8px; }\n.previewGrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }\n.previewGrid div { display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 6px 8px; border-radius: 6px; background: rgba(255, 255, 255, 0.035); color: var(--muted); font-size: 8.5px; }\n.previewGrid b { color: var(--ink); font-size: 10px; }\n.importWarning { margin-top: 9px; color: var(--dim); font-size: 8.5px; line-height: 1.45; }\n\n/* ---------- Settings / pause ---------- */\n.pauseGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 13px; align-items: start; }\n.pauseMain { padding: 22px; }\n.pauseMain h1 { margin: 8px 0 7px; font-family: var(--font-serif); font-size: clamp(32px, 4.2vw, 49px); font-weight: 400; line-height: 1; letter-spacing: -0.03em; }\n.pauseMain p { margin: 0 0 17px; color: var(--muted); font-size: 11px; line-height: 1.55; }\n.pauseActions { display: flex; flex-direction: column; gap: 7px; }\n.pauseSide { display: flex; flex-direction: column; gap: 13px; }\n.pauseStats { padding: 15px; }\n.pauseStats h3 { margin: 5px 0 10px; font-family: var(--font-serif); font-size: 20px; font-weight: 500; }\n.settingsRow { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 0; border-top: 1px solid rgba(255, 255, 255, 0.07); }\n.settingsRow:first-of-type { border-top: 0; }\n.settingsRow b { display: block; color: var(--ink); font-size: 10.5px; font-weight: 700; }\n.settingsRow small { display: block; margin-top: 3px; color: var(--dim); font-size: 8.5px; line-height: 1.4; max-width: 370px; }\n.toggle { position: relative; width: 38px; height: 21px; flex: none; border: 1px solid var(--line-strong); border-radius: 99px; background: rgba(255, 255, 255, 0.06); padding: 0; }\n.toggle::after { content: \"\"; position: absolute; top: 3px; left: 3px; width: 13px; height: 13px; border-radius: 50%; background: var(--muted); transition: transform 160ms ease, background 160ms ease; }\n.toggle.is-on { background: rgba(105, 211, 193, 0.18); border-color: rgba(105, 211, 193, 0.45); }\n.toggle.is-on::after { transform: translateX(17px); background: var(--teal); box-shadow: 0 0 8px rgba(105, 211, 193, 0.6); }\n.settingsActions { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 13px; }\n.profileMeta { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }\n.profileMeta .heroAvatar { width: 54px; height: 54px; border-radius: 13px; }\n.profileMeta b { display: block; font-family: var(--font-serif); font-size: 21px; font-weight: 500; }\n.profileMeta small { display: block; margin-top: 3px; color: var(--dim); font-size: 8.5px; }\n.progressRows { display: flex; flex-direction: column; gap: 8px; }\n.progressRow { display: grid; grid-template-columns: 1fr auto; gap: 4px 10px; align-items: center; font-size: 9px; color: var(--muted); }\n.progressRow .bar { grid-column: 1 / -1; height: 3px; }\n.progressRow b { color: var(--ink); font-size: 9px; font-weight: 700; }\n\n/* ---------- Toasts and dialog ---------- */\n.toastStack { position: fixed; z-index: 90; right: 16px; bottom: 16px; display: flex; flex-direction: column; gap: 7px; width: min(340px, calc(100vw - 32px)); pointer-events: none; }\n.toast { display: flex; align-items: flex-start; gap: 9px; padding: 10px 12px; border: 1px solid var(--line-strong); border-radius: 10px; background: rgba(10, 15, 25, 0.96); box-shadow: 0 16px 45px rgba(0, 0, 0, 0.4); color: var(--muted); font-size: 10.5px; line-height: 1.45; animation: toastIn 220ms ease both; }\n.toast svg { flex: none; margin-top: 1px; }\n.toast.is-success { border-color: rgba(105, 211, 193, 0.32); color: #d3f2eb; }\n.toast.is-success svg { color: var(--teal); }\n.toast.is-warn { border-color: rgba(243, 181, 98, 0.32); color: #f0d6b1; }\n.toast.is-warn svg { color: var(--amber); }\n.toast.is-error { border-color: rgba(255, 139, 157, 0.34); color: #ffd2d9; }\n.toast.is-error svg { color: var(--rose); }\n\n.fadeLayer { position: fixed; inset: 0; z-index: 70; background: #04060a; opacity: 0; pointer-events: none; transition: opacity 420ms ease; }\n.fadeLayer.is-on { opacity: 1; pointer-events: auto; }\n\n.loadingShell { position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; background: radial-gradient(ellipse at 60% 40%, #14203a, #05070d 60%); color: var(--muted); text-align: center; }\n.loadingShell b { display: block; margin-top: 14px; font-family: var(--font-serif); font-size: 24px; font-weight: 400; color: var(--ink); }\n.loadingShell small { display: block; max-width: 300px; margin-top: 7px; font-size: 10px; line-height: 1.5; }\n.loadingRune { width: 48px; height: 48px; margin: 0 auto; border: 1px solid rgba(228, 192, 122, 0.35); border-radius: 50%; position: relative; animation: slowSpin 8s linear infinite; }\n.loadingRune::before, .loadingRune::after { content: \"\"; position: absolute; inset: 9px; border: 1px solid rgba(122, 162, 255, 0.35); border-radius: 50%; }\n.loadingRune::after { inset: 18px; border-color: rgba(105, 211, 193, 0.5); }\n\n/* ---------- Touch ---------- */\n.touchControls { display: none; position: fixed; z-index: 24; left: 16px; bottom: 16px; pointer-events: auto; }\n.touchPad { display: grid; grid-template-columns: repeat(3, 38px); grid-template-rows: repeat(3, 38px); gap: 4px; }\n.touchDir { display: grid; place-items: center; border: 1px solid var(--line-strong); border-radius: 9px; background: rgba(8, 12, 20, 0.68); color: var(--muted); backdrop-filter: blur(5px); touch-action: none; }\n.touchDir:active { background: rgba(122, 162, 255, 0.2); color: var(--ink); }\n.touchUp { grid-column: 2; grid-row: 1; }\n.touchLeft { grid-column: 1; grid-row: 2; }\n.touchRight { grid-column: 3; grid-row: 2; }\n.touchDown { grid-column: 2; grid-row: 3; }\n.touchAction { position: fixed; right: 18px; bottom: 22px; z-index: 24; display: grid; place-items: center; width: 54px; height: 54px; border: 1px solid rgba(228, 192, 122, 0.4); border-radius: 50%; background: rgba(25, 21, 11, 0.68); color: var(--gold); font-size: 20px; backdrop-filter: blur(5px); pointer-events: auto; }\n.touchAction span { font-size: 8px; font-weight: 800; letter-spacing: 0.1em; }\n@media (pointer: coarse) {\n  .touchControls, .touchAction { display: flex; }\n  .hintRow { display: none; }\n}\n\n/* ---------- Responsive ---------- */\n@media (max-width: 1120px) {\n  .hudCenter { display: none; }\n  .heroGrid { grid-template-columns: repeat(4, minmax(0, 1fr)); }\n  .atlasGrid { grid-template-columns: 178px minmax(260px, 1fr) 286px; }\n  .titleMain { grid-template-columns: minmax(0, 1.18fr) minmax(220px, 0.82fr); gap: 6px; }\n  .titleCopy { max-width: 560px; }\n  .titleHeroImg { height: clamp(270px, 48vh, 390px); }\n  .titleHeroPlaque { width: min(230px, 94%); padding: 9px 10px; }\n  .titleHeroPlaque p { display: none; }\n}\n@media (max-height: 620px) and (min-width: 900px) {\n  .heroGrid { grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 7px; }\n  .heroPortrait { aspect-ratio: 1.14 / 1; }\n  .heroCardInfo { padding: 6px 7px 7px; margin-top: -17px; }\n  .heroCardInfo b { font-size: 14px; }\n  .heroCardInfo small { font-size: 7.5px; }\n  .heroCardTop { top: 6px; left: 6px; right: 6px; }\n  .heroCardTop .chip { font-size: 7px; padding: 3px 4px; min-height: 17px; }\n  .heroToolbar { margin-bottom: 8px; }\n  .sheetHead p { display: none; }\n  .heroNote p { display: none; }\n  .overlay { padding: 8px 16px 10px; }\n  .sheetHead { margin-bottom: 9px; }\n  .sheetHead h1 { font-size: 28px; }\n  .sheetHead .eyebrow { font-size: 8px; }\n}\n@media (max-width: 900px) {\n  .titleHeroStage { display: none; }\n  .hud { padding: 10px 11px; gap: 7px; }\n  .brand { padding-right: 9px; }\n  .brandWords span { display: none; }\n  .heroChip { min-width: 0; width: 184px; }\n  .hudLabel span { display: none; }\n  .tracker { top: 72px; right: 11px; width: 238px; }\n  .titleMain { grid-template-columns: 1fr; align-items: start; gap: 22px; }\n  .titleAside { display: none; }\n  .titleCopy { max-width: 680px; }\n  .gameTitle { font-size: clamp(55px, 14vw, 110px); }\n  .titleLead { max-width: 500px; }\n  .atlasGrid { grid-template-columns: 165px minmax(0, 1fr); }\n  .detailPanel { grid-column: 1 / -1; position: static; }\n  .heroGrid { grid-template-columns: repeat(3, minmax(0, 1fr)); }\n  .resultBody { grid-template-columns: 1fr; gap: 13px; }\n  .resultAside { border-left: 0; border-top: 1px solid var(--line); padding-left: 0; padding-top: 14px; }\n  .reviewBody { grid-template-columns: 1fr; }\n  .importGrid { grid-template-columns: 1fr; }\n  .pauseGrid { grid-template-columns: 1fr; }\n  .reviewTop { grid-template-columns: repeat(2, 1fr); }\n}\n@media (max-width: 670px) {\n  .brandWords { display: none; }\n  .brandRune { width: 30px; height: 30px; font-size: 17px; }\n  .heroChip { width: 156px; }\n  .heroChipMeta .xp { display: none; }\n  .hudResource { padding: 0 8px; }\n  .hudActions .hudLabel { display: none; }\n  .hudActions .iconBtn { width: 34px; height: 34px; }\n  .tracker { display: none; }\n  .titleInner { padding: 16px 16px 20px; }\n  .titleTop .titleVersion { display: none; }\n  .titleMain { padding-top: 0; }\n  .titleQuestion { font-size: 25px; }\n  .titleActions .btn--primary { width: 100%; }\n  .titleFooter { align-items: flex-start; flex-direction: column; gap: 8px; }\n  .atlasGrid { grid-template-columns: 1fr; }\n  .areaList { display: grid; grid-template-columns: repeat(2, 1fr); }\n  .areaOverview { display: none; }\n  .sheetHead { margin-bottom: 12px; }\n  .sheetHead p { display: none; }\n  .heroGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n  .answers { grid-template-columns: 1fr; }\n  .duelPanel { max-height: 61vh; overflow: auto; }\n  .duelPanelBody { padding: 7px 12px 12px; }\n  .duelPanelHead { padding: 10px 12px 0; }\n  .questionText { max-height: 74px; font-size: 14px; }\n  .duelHearts { gap: 5px; }\n  .duelChip { max-width: 190px; }\n  .duelChip b { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n  .duelProgress { display: none; }\n  .resultHead { padding: 15px; }\n  .resultSeal { width: 80px; height: 80px; }\n  .resultBody { padding: 0 15px 15px; }\n  .resultFoot { flex-direction: column; align-items: stretch; padding: 11px 15px 15px; }\n  .resultFoot .actions { justify-content: stretch; }\n  .resultFoot .actions .btn { flex: 1; }\n  .statRow { grid-template-columns: repeat(2, 1fr); }\n  .pauseMain { padding: 16px; }\n  .pauseMain h1 { font-size: 34px; }\n  .levelUp { display: none; }\n}\n@media (max-height: 600px) {\n  .titleHeroImg { height: 286px; }\n  .titleHeroStage { min-height: 300px; }\n  .titleHeroPlaque { bottom: 0; }\n  .titleLead { display: none; }\n  .titleStats { margin-top: 12px; }\n  .recruitGrid { grid-template-columns: minmax(240px, 0.8fr) minmax(0, 1.2fr); gap: 10px; }\n  .recruitPortrait { min-height: 300px; padding: 10px; border-radius: 13px; }\n  .recruitPortrait img { max-height: 42vh; }\n  .recruitQuote { left: 10px; right: 10px; bottom: 8px; padding: 7px 9px; font-size: 9px; }\n  .recruitBody { padding: 13px 15px; border-radius: 13px; }\n  .recruitBody h2 { font-size: 30px; margin-top: 7px; }\n  .recruitSubtitle { font-size: 9px; }\n  .recruitBody .detailDesc { font-size: 9.5px; line-height: 1.45; margin-top: 6px; }\n  .recruitAttrs { gap: 3px; margin-top: 8px; }\n  .recruitAttr { font-size: 7.5px; grid-template-columns: 68px minmax(0, 1fr) 22px; }\n  .recruitBody .sectionDivider { margin: 9px 0; }\n  .recruitBody .reqList { margin-top: 4px; gap: 3px; }\n  .recruitBody .req { font-size: 8.5px; }\n  .recruitBalance { margin-top: 8px; padding: 6px 8px; font-size: 8.5px; }\n  .recruitActions { margin-top: 8px; }\n  .recruitActions .btn { min-height: 34px; font-size: 11px; }\n  .recruitBody .detailFootnote { font-size: 7.5px; line-height: 1.35; margin-top: 5px; }\n  .resultScreen { padding: 6px clamp(8px, 2.4vw, 20px); }\n  .resultCard { max-height: calc(100vh - 12px); }\n  .resultHead { padding: 11px 16px 8px; gap: 12px; }\n  .resultHead h1 { font-size: 31px; margin-top: 5px; }\n  .resultHead p { margin-top: 5px !important; font-size: 9.5px; }\n  .resultSeal { width: 74px; height: 74px; }\n  .resultSeal b { font-size: 23px; }\n  .resultSeal small { font-size: 6px; }\n  .resultBody { grid-template-columns: 1.12fr 0.88fr; gap: 13px; padding: 0 16px 10px; }\n  .resultStats { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 5px; margin-top: 0; }\n  .resultStat { padding: 7px 8px; }\n  .resultStat b { font-size: 18px; }\n  .resultStat span { font-size: 7px; }\n  .resultReasons { margin-top: 8px; padding-top: 8px; font-size: 9.5px; }\n  .resultNext { margin-top: 6px; padding: 7px 9px; }\n  .resultNext b { font-size: 9.5px; }\n  .resultNext p { font-size: 8px; margin-top: 2px; }\n  .resultAside { padding-left: 13px; }\n  .resultAside h3 { margin-bottom: 4px; font-size: 7.5px; }\n  .rewardRows { gap: 4px; }\n  .rewardRow { padding-bottom: 4px; font-size: 9px; }\n  .rewardRow b { font-size: 10px; }\n  .answerReview { max-height: 46px; margin-top: 5px; }\n  .answerReviewRow { font-size: 8px; padding: 3px 0; }\n  .resultAside .resultNext:last-child { display: none; }\n  .resultFoot { padding: 8px 16px 10px; }\n  .resultFoot .footMeta { font-size: 7.5px; }\n  .resultFoot .btn { min-height: 32px; padding: 7px 11px; font-size: 10.5px; }\n  .hud { padding-top: 8px; padding-bottom: 8px; }\n  .brand { padding-block: 4px; }\n  .heroAvatar { width: 32px; height: 32px; }\n  .tracker { top: 66px; }\n  .titleInner { padding-top: 14px; padding-bottom: 14px; gap: 14px; }\n  .titleCopy { padding-top: 0; }\n  .titlePrelude { margin-bottom: 12px; }\n  .titleLead { margin-top: 8px; }\n  .titleActions { margin-top: 15px; }\n  .titleStats { margin-top: 14px; }\n  .titleAside { padding: 11px 13px; }\n  .sheetHead { margin-bottom: 13px; }\n  .sheetHead h1 { font-size: 29px; }\n  .nodeRow { padding-block: 7px; }\n  .duelPanelBody { padding-bottom: 9px; }\n  .questionText { max-height: 61px; font-size: 15px; }\n  .answers { margin-top: 7px; gap: 5px; }\n  .answerBtn { min-height: 35px; padding: 6px 8px; font-size: 9.5px; }\n  .duelPanelHead { padding-top: 8px; }\n  .duelTop { padding: 8px 10px; }\n  .duelTop .iconBtn { width: 32px; height: 32px; }\n  .resultCard { width: min(940px, calc(100vw - 24px)); }\n  .resultHead { padding-top: 14px; padding-bottom: 10px; }\n  .resultBody { padding-bottom: 14px; }\n  .resultFoot { padding-top: 10px; padding-bottom: 12px; }\n}\n\n/* ---------- Motion ---------- */\n@keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }\n@keyframes duelIn { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }\n@keyframes toastIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }\n@keyframes hitFlash { 0% { opacity: 0; } 18% { opacity: 1; } 100% { opacity: 0; } }\n@keyframes attackFlash { 0% { opacity: 0; } 20% { opacity: 1; } 100% { opacity: 0; } }\n@keyframes slowSpin { to { transform: rotate(360deg); } }\n@keyframes floatIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }\n.floatIn { animation: floatIn 420ms ease both; }\n\n@media (prefers-reduced-motion: reduce) {\n  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }\n}\n\n/* =========================================================================\n   FASE 3 · cosméticos, inventario, tienda y galerías de aprobación\n   ========================================================================= */\n.heroChipTitle {\n  display: block;\n  max-width: 150px;\n  overflow: hidden;\n  color: var(--gold);\n  font-family: var(--font-serif);\n  font-size: 10px;\n  line-height: 1.2;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.heroCardTitle {\n  display: block;\n  overflow: hidden;\n  margin: -2px 0 3px;\n  color: var(--gold);\n  font-family: var(--font-serif);\n  font-size: 10px;\n  font-style: normal;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.profileTitle {\n  display: block;\n  margin-top: 3px;\n  color: var(--gold);\n  font-family: var(--font-serif);\n  font-size: 10px;\n  font-style: normal;\n}\n.resultCosmetic {\n  margin-top: 10px;\n  padding: 10px 12px;\n  border: 1px solid rgba(228, 192, 122, 0.22);\n  border-radius: 10px;\n  background: rgba(228, 192, 122, 0.055);\n}\n.resultCosmetic b { display: block; margin: 4px 0 3px; color: var(--gold); font-size: 12px; }\n.resultCosmetic p { margin: 0 0 7px; color: var(--muted); font-size: 9.5px; line-height: 1.45; }\n.resultCosmetic .bar { height: 3px; }\n.resultNext--cosmetic { border-color: rgba(196, 155, 255, 0.24); background: rgba(196, 155, 255, 0.055); }\n.resultNext--cosmetic b { color: var(--violet); }\n\n.settingsRow--stack { display: grid; gap: 7px; align-items: stretch; }\n.qualityOptions { display: flex; gap: 4px; }\n.qualityBtn {\n  flex: 1;\n  min-height: 26px;\n  border: 1px solid var(--line);\n  border-radius: 7px;\n  background: rgba(255, 255, 255, 0.035);\n  color: var(--muted);\n  font-size: 9px;\n  font-weight: 700;\n  letter-spacing: 0.05em;\n}\n.qualityBtn.is-active { border-color: rgba(105, 211, 193, 0.5); background: rgba(105, 211, 193, 0.14); color: var(--teal); }\n.selectMini {\n  min-height: 31px;\n  max-width: 100%;\n  border: 1px solid var(--line);\n  border-radius: 8px;\n  background: #101725;\n  color: var(--ink);\n  padding: 5px 8px;\n  font-size: 10px;\n}\n.selectMini.wide { width: 100%; }\n.rarityDot {\n  width: 6px;\n  height: 6px;\n  flex: none;\n  border-radius: 50%;\n}\n\n/* ---------- Estudio de equipamiento ---------- */\n.wardrobeShell { max-width: 1260px; }\n.wardrobeHeroBar {\n  display: flex;\n  align-items: center;\n  gap: 9px;\n  margin-bottom: 10px;\n  min-width: 0;\n}\n.miniHeroTabs { display: flex; gap: 5px; overflow-x: auto; scrollbar-width: thin; flex: 1; padding: 2px; }\n.miniHeroTab {\n  flex: none;\n  min-height: 26px;\n  padding: 4px 9px;\n  border: 1px solid var(--line);\n  border-radius: 7px;\n  background: rgba(255, 255, 255, 0.025);\n  color: var(--dim);\n  font-size: 9.5px;\n  font-weight: 700;\n}\n.miniHeroTab:hover { color: var(--ink); border-color: var(--line-strong); }\n.miniHeroTab.is-active { border-color: rgba(105, 211, 193, 0.48); background: rgba(105, 211, 193, 0.1); color: var(--teal); }\n.wardrobeTitle { flex: none; color: var(--dim); font-size: 9px; }\n.wardrobeTitle b { color: var(--gold); font-family: var(--font-serif); font-size: 11px; font-weight: 400; }\n.wardrobeGrid {\n  display: grid;\n  grid-template-columns: 166px minmax(240px, .82fr) minmax(300px, 1.18fr);\n  gap: 10px;\n  align-items: stretch;\n}\n.wardrobeSlots, .wardrobeStage, .wardrobeItems { min-width: 0; padding: 11px; }\n.wardrobeSlots { display: flex; flex-direction: column; }\n.slotList { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; margin-top: 7px; }\n.slotTab {\n  display: flex;\n  min-width: 0;\n  min-height: 28px;\n  align-items: center;\n  justify-content: space-between;\n  gap: 3px;\n  padding: 4px 5px;\n  border: 1px solid transparent;\n  border-radius: 6px;\n  background: transparent;\n  color: var(--dim);\n  font-size: 8.5px;\n  text-align: left;\n}\n.slotTab span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.slotTab small { flex: none; color: var(--dim); font-size: 7px; }\n.slotTab:hover { background: rgba(255, 255, 255, 0.045); color: var(--ink); }\n.slotTab.is-active { border-color: rgba(196, 155, 255, 0.38); background: rgba(196, 155, 255, 0.11); color: var(--violet); }\n.slotTab.is-active small { color: var(--violet); }\n.wardrobeMeta { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 5px; align-items: baseline; }\n.wardrobeMeta b { color: var(--ink); font-size: 9.5px; text-align: right; }\n.wardrobeStage { display: flex; flex-direction: column; }\n.previewMount {\n  position: relative;\n  flex: 1;\n  min-height: 265px;\n  overflow: hidden;\n  border: 1px solid var(--line);\n  border-radius: 12px;\n  background: radial-gradient(ellipse at 50% 38%, rgba(100, 124, 198, 0.16), rgba(4, 7, 13, 0.76) 70%);\n}\n.previewMount canvas { position: absolute; inset: 0; }\n.previewHint {\n  position: absolute;\n  bottom: 8px;\n  left: 9px;\n  z-index: 2;\n  color: var(--dim);\n  font-size: 8px;\n  letter-spacing: 0.08em;\n  text-transform: uppercase;\n}\n.previewCorner {\n  position: absolute;\n  top: 9px;\n  left: 10px;\n  z-index: 2;\n  color: var(--ink);\n  font-family: var(--font-serif);\n  font-size: 15px;\n  line-height: 1.1;\n  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.65);\n}\n.previewCorner small { color: var(--muted); font-family: var(--font-body); font-size: 8px; letter-spacing: 0.1em; text-transform: uppercase; }\n.compareStrip {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 6px;\n  margin-top: 7px;\n  padding: 6px 8px;\n  border: 1px solid var(--line);\n  border-radius: 8px;\n  color: var(--dim);\n  font-size: 8px;\n  line-height: 1.3;\n}\n.compareStrip b { color: var(--ink); font-size: 8.5px; }\n.compareStrip > svg { color: var(--gold); flex: none; }\n.wardrobeActions { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 7px; }\n.wardrobeActions .btn { flex: 1; min-width: 96px; }\n.wardrobeItems { display: flex; flex-direction: column; min-height: 0; }\n.wardrobeItemsHead { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }\n.wardrobeItemsHead h2 { margin: 2px 0 0; font-family: var(--font-serif); font-size: 20px; font-weight: 400; }\n.wardrobeFilter { max-width: 138px; }\n.cosmeticList {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  margin-top: 8px;\n  max-height: 156px;\n  overflow: auto;\n  scrollbar-width: thin;\n  padding-right: 2px;\n}\n.cosmeticItem {\n  position: relative;\n  display: flex;\n  width: 100%;\n  min-height: 33px;\n  align-items: center;\n  gap: 6px;\n  padding: 5px 6px 5px 8px;\n  border: 1px solid var(--line);\n  border-radius: 7px;\n  background: rgba(255, 255, 255, 0.025);\n  text-align: left;\n  overflow: hidden;\n}\n.cosmeticItem:hover { border-color: var(--line-strong); background: rgba(255, 255, 255, 0.05); }\n.cosmeticItem.is-selected { border-color: var(--rarity-color, var(--violet)); background: color-mix(in srgb, var(--rarity-color, var(--violet)) 12%, transparent); }\n.cosmeticItem.is-locked { opacity: .58; }\n.rarityBar { position: absolute; left: 0; top: 5px; bottom: 5px; width: 2px; border-radius: 2px; background: var(--rarity-color, var(--muted)); }\n.cosmeticItemCopy { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 1px; }\n.cosmeticItemCopy b { overflow: hidden; color: var(--ink); font-size: 9.5px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }\n.cosmeticItemCopy small { overflow: hidden; color: var(--dim); font-size: 7.5px; text-overflow: ellipsis; white-space: nowrap; }\n.cosmeticItem .chip { flex: none; min-height: 18px; padding: 2px 5px; font-size: 7px; }\n.itemPrice { flex: none; color: var(--gold); font-size: 9px; }\n.cosmeticDetail {\n  min-height: 0;\n  margin-top: 8px;\n  padding-top: 8px;\n  border-top: 1px solid var(--line);\n  overflow: auto;\n  scrollbar-width: thin;\n}\n.cosmeticDetailHead { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }\n.cosmeticDetail h3 { margin: 5px 0 2px; font-family: var(--font-serif); font-size: 20px; font-weight: 400; line-height: 1.1; }\n.cosmeticDesc { margin: 3px 0 5px; color: var(--muted); font-size: 9px; line-height: 1.45; }\n.cosmeticProgress { display: grid; gap: 2px; padding: 6px 8px; border: 1px solid var(--line); border-radius: 8px; background: rgba(255, 255, 255, 0.025); font-size: 8.5px; }\n.cosmeticProgress span { color: var(--dim); font-size: 7.5px; letter-spacing: .08em; text-transform: uppercase; }\n.cosmeticProgress b { color: var(--ink); font-size: 9px; }\n.cosmeticProgress small { color: var(--gold); font-size: 8px; }\n.cosmeticDetail .bar { margin-top: 5px; height: 3px; }\n.cosmeticActions { display: flex; flex-direction: column; gap: 5px; margin-top: 7px; }\n.cosmeticActions .btn { min-height: 31px; font-size: 10px; }\n.cosmeticActions .notice { font-size: 8.5px; padding: 7px 8px; }\n.wardrobeEmpty { padding: 12px 6px; color: var(--dim); font-size: 9px; line-height: 1.5; }\n.wardrobeEmpty h3 { margin: 5px 0 3px; color: var(--ink); font-family: var(--font-serif); font-size: 20px; font-weight: 400; }\n.wardrobeEmpty p { margin: 4px 0 0; }\n.atlasFooter { font-size: 8px; }\n\n/* ---------- Tienda ---------- */\n.shopLayout { display: grid; grid-template-columns: 174px minmax(310px, 1fr) minmax(270px, .82fr); gap: 10px; align-items: stretch; }\n.shopRail, .shopList, .shopDetail { padding: 11px; min-width: 0; }\n.shopRail { display: flex; flex-direction: column; }\n.shopNote { border-top: 1px solid var(--line); padding-top: 8px; color: var(--dim); font-size: 8.5px; line-height: 1.5; }\n.shopNote b { display: block; margin-bottom: 3px; color: var(--muted); font-size: 9px; }\n.shopNote p { margin: 0 0 8px; }\n.shopList { display: flex; flex-direction: column; min-height: 0; }\n.shopListHead { display: flex; align-items: center; justify-content: space-between; gap: 8px; }\n.shopListHead h2 { margin: 0; font-family: var(--font-serif); font-size: 23px; font-weight: 400; }\n.shopGrid { max-height: 405px; }\n.shopDetail { overflow: auto; scrollbar-width: thin; }\n.shopRequirement { display: flex; justify-content: space-between; gap: 6px; padding: 4px 0; border-bottom: 1px solid var(--line); color: var(--dim); font-size: 8.5px; }\n.shopRequirement b { color: var(--ink); font-size: 8.5px; text-align: right; }\n.buyConfirm { margin-top: 7px; padding: 8px; border: 1px solid rgba(228, 192, 122, .36); border-radius: 8px; background: rgba(228, 192, 122, .08); }\n.buyConfirm b { display: block; color: var(--gold); font-size: 9.5px; }\n.buyConfirm p { margin: 4px 0 6px; color: var(--muted); font-size: 8.5px; line-height: 1.4; }\n.buyConfirm > div { display: flex; gap: 5px; }\n.buyConfirm .btn { flex: 1; }\n\n/* ---------- Galerías de QA ---------- */\n.showcaseGrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }\n.showcaseCard { overflow: hidden; border: 1px solid var(--line); border-radius: 14px; background: radial-gradient(ellipse at 50% 30%, color-mix(in srgb, var(--hero-accent) 18%, transparent), rgba(9, 13, 22, .9) 70%); }\n.showcaseCard img { display: block; width: 100%; aspect-ratio: 1; object-fit: contain; }\n.showcaseCard > div { padding: 9px 10px 11px; border-top: 1px solid var(--line); }\n.showcaseCard h3 { margin: 5px 0 2px; font-family: var(--font-serif); font-size: 22px; font-weight: 400; }\n.showcaseCard p { margin: 0; color: var(--dim); font-size: 9px; }\n.slotGalleryGrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }\n.slotCapture { display: flex; align-items: center; gap: 7px; min-height: 118px; padding: 6px; border: 1px solid var(--line); border-radius: 10px; background: rgba(13, 18, 29, .86); }\n.slotCaptureImg { flex: none; width: 94px; height: 94px; display: grid; place-items: center; border-radius: 8px; background: radial-gradient(ellipse, rgba(122, 162, 255, .14), transparent 68%); }\n.slotCaptureImg img { width: 94px; height: 94px; object-fit: contain; }\n.slotCaptureCopy { min-width: 0; display: flex; flex-direction: column; gap: 4px; }\n.slotCaptureCopy .chip { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.slotCaptureCopy b { color: var(--ink); font-family: var(--font-serif); font-size: 15px; font-weight: 400; line-height: 1.1; }\n\n@media (max-height: 650px) {\n  .wardrobeGrid { grid-template-columns: 158px minmax(230px, .8fr) minmax(280px, 1.2fr); }\n  .previewMount { min-height: 228px; }\n  .cosmeticList { max-height: 125px; }\n  .shopGrid { max-height: 330px; }\n  .sheetHead { margin-bottom: 12px; }\n  .sheetHead h1 { font-size: 29px; }\n  .sheetHead p { font-size: 10px; margin-top: 5px; }\n}\n@media (max-width: 880px) {\n  .wardrobeGrid, .shopLayout { grid-template-columns: 1fr; }\n  .wardrobeSlots { order: 2; }\n  .wardrobeStage { order: 1; }\n  .wardrobeItems { order: 3; }\n  .slotList { grid-template-columns: repeat(3, 1fr); }\n  .previewMount { min-height: 300px; }\n  .showcaseGrid, .slotGalleryGrid { grid-template-columns: repeat(2, 1fr); }\n  .shopRail { order: 2; }\n  .shopList { order: 1; }\n  .shopDetail { order: 3; }\n}\n";
(function () {
'use strict';
/* =========================================================================
   SERUMS QUEST — OBSERVATORIO DE LAS CINCO RUTAS
   Fase 2 · héroes, guardianes y animación voxel
   ========================================================================= */
var GAME = window.GAME || {};
var RULES = GAME.rules || {};
var CAMP = window.__SERUMS_CAMPAIGN__ || CAMPAIGN_DATA;
var EL = {};
var APP_VERSION = RULES.version || 'Fase 2';
var SAVE_KEY = 'serumsquest:voxel:state:v1';
var BACKUP_KEY = 'serumsquest:voxel:preimport:v1';
var SETTINGS_KEY = 'serumsquest:voxel:settings:v1';

document.documentElement.lang = 'es';
document.title = GAME.title || 'SERUMS QUEST: Observatorio de las Cinco Rutas';

(function injectStyles() {
  var style = document.createElement('style');
  style.id = 'serums-voxel-styles';
  style.textContent = STYLE_CSS;
  document.head.appendChild(style);
})();

var AREA_BY_ID = {};
var MISSION_BY_ID = {};
var QUESTION_BY_ID = {};
var CHARACTER_BY_ID = {};
var COSMETIC_BY_ID = {};
var ACHIEVEMENT_BY_ID = {};
CAMP.areas.forEach(function (a) { AREA_BY_ID[a.id] = a; });
CAMP.missions.forEach(function (m) { MISSION_BY_ID[m.id] = m; });
Object.keys(CAMP.questions).forEach(function (id) { QUESTION_BY_ID[id] = CAMP.questions[id]; });
CAMP.characters.forEach(function (c) { CHARACTER_BY_ID[c.id] = c; });
CAMP.cosmetics.forEach(function (c) { COSMETIC_BY_ID[c.id] = c; });
CAMP.achievements.forEach(function (a) { ACHIEVEMENT_BY_ID[a.id] = a; });

var AREA_GLYPHS = {
  'area-psi-salud-publica': '✦',
  'area-psi-cuidado-integral': '♡',
  'area-psi-etica': '⚖',
  'area-psi-investigacion': '◇',
  'area-psi-gestion': '▦'
};

var HERO_LOOKS = {
  ilan: {
    slot: 'personaje_ilan', klass: 'Táctico', weapon: 'Brújula de rutas',
    accent: '#7AA2FF', skin: '#C98C63', skinShade: '#AE7350', hair: '#2B1D15',
    outfit: '#273D70', outfit2: '#36558F', trim: '#E4C07A', leg: '#1B2B50',
    style: 'coat', hairStyle: 'side', extra: 'headband', prop: 'compass',
    body: { h: 1.04, w: 0.95, head: 1.0, shoulder: 0.98, leg: 1.0 },
    anim: { idle: 1.75, gait: 9.2, attack: 'slash', lean: 0.05 },
    silhouette: 'long coat, shoulder drape, high collar',
    closeupArm: { x: -0.52, z: -0.26 }
  },
  mara: {
    slot: 'personaje_mara', klass: 'Rastreadora', weapon: 'Bastón mapamundi',
    accent: '#69D3C1', skin: '#A97148', skinShade: '#8C5B3A', hair: '#392419',
    outfit: '#55734A', outfit2: '#C7A65F', trim: '#EFD79F', leg: '#3B4E37',
    style: 'poncho', hairStyle: 'ponytail', extra: 'brim', prop: 'mapStaff',
    body: { h: 0.93, w: 1.07, head: 1.04, shoulder: 1.04, leg: 0.9 },
    anim: { idle: 1.45, gait: 10.4, attack: 'staff', lean: 0.08 },
    silhouette: 'wide brim hat, round poncho, backpack',
    closeupArm: { x: -0.36, z: -0.18 }
  },
  noa: {
    slot: 'personaje_noa', klass: 'Analista', weapon: 'Lente prismática',
    accent: '#8DB7FF', skin: '#E1B08A', skinShade: '#C69472', hair: '#1D2532',
    outfit: '#DDE2E9', outfit2: '#7B8FAF', trim: '#7AA2FF', leg: '#38445C',
    style: 'coat', hairStyle: 'bob', extra: 'glasses', prop: 'lens',
    body: { h: 1.08, w: 0.86, head: 0.97, shoulder: 0.84, leg: 1.06 },
    anim: { idle: 1.6, gait: 8.3, attack: 'cast', lean: 0.04 },
    silhouette: 'tall lab coat, bob, round lens',
    closeupArm: { x: -0.62, z: -0.22 }
  },
  teo: {
    slot: 'personaje_teo', klass: 'Mentor', weapon: 'Báculo de escucha',
    accent: '#C49BFF', skin: '#82563E', skinShade: '#684330', hair: '#D8D3C9',
    outfit: '#493A5D', outfit2: '#74608C', trim: '#C49BFF', leg: '#332944',
    style: 'robe', hairStyle: 'bunBeard', extra: 'bun', prop: 'bookStaff',
    body: { h: 1.01, w: 1.08, head: 1.02, shoulder: 1.03, leg: 0.97 },
    anim: { idle: 1.35, gait: 8.6, attack: 'staff', lean: 0.06 },
    silhouette: 'broad mantled robe, beard, book staff',
    closeupArm: { x: -0.34, z: -0.14 }
  },
  lia: {
    slot: 'personaje_lia', klass: 'Duelista', weapon: 'Cronómetro de chispa',
    accent: '#F3B562', skin: '#C88C6A', skinShade: '#AD7557', hair: '#ED6A46',
    outfit: '#71334B', outfit2: '#A44553', trim: '#F3B562', leg: '#3D2030',
    style: 'jacket', hairStyle: 'highPony', extra: 'earring', prop: 'watch',
    body: { h: 0.98, w: 0.9, head: 0.99, shoulder: 0.92, leg: 1.02 },
    anim: { idle: 2.05, gait: 11.0, attack: 'slash', lean: 0.1 },
    silhouette: 'high ponytail, asymmetric jacket, scarf tail',
    closeupArm: { x: -1.08, z: -0.42 }
  },
  kian: {
    slot: 'personaje_kian', klass: 'Guardián', weapon: 'Martillo-sello',
    accent: '#AEB6C8', skin: '#6A452D', skinShade: '#523421', hair: '#261A14',
    outfit: '#3B4654', outfit2: '#8493A8', trim: '#BFC9D8', leg: '#2A333E',
    style: 'armor', hairStyle: 'bald', extra: 'shoulder', prop: 'hammer',
    body: { h: 0.96, w: 1.18, head: 1.04, shoulder: 1.18, leg: 0.94 },
    anim: { idle: 1.15, gait: 7.8, attack: 'hammer', lean: 0.07 },
    silhouette: 'broadest shoulders, bald seal brow, gauntlets',
    closeupArm: { x: -0.48, z: -0.22 }
  },
  amaru: {
    slot: 'personaje_amaru', klass: 'Vigía', weapon: 'Linterna de ruta',
    accent: '#69D3C1', skin: '#9B6644', skinShade: '#7E5136', hair: '#2B1B15',
    outfit: '#3D6A61', outfit2: '#C49A50', trim: '#E6C88C', leg: '#2D4D47',
    style: 'poncho', hairStyle: 'short', extra: 'hood', prop: 'lantern',
    body: { h: 0.94, w: 1.04, head: 1.06, shoulder: 1.0, leg: 0.92 },
    anim: { idle: 1.55, gait: 10.0, attack: 'lantern', lean: 0.08 },
    silhouette: 'deep hood, shoulder cape, lantern pole',
    closeupArm: { x: -0.5, z: -0.2 }
  },
  ona: {
    slot: 'personaje_ona', klass: 'Arquitecta', weapon: 'Compás de planos',
    accent: '#7AA2FF', skin: '#D6A27D', skinShade: '#BC8765', hair: '#4A2B5C',
    outfit: '#293B67', outfit2: '#4D669A', trim: '#9BC0FF', leg: '#1E2C4C',
    style: 'architect', hairStyle: 'bun', extra: 'collar', prop: 'compassTool',
    body: { h: 1.08, w: 0.91, head: 0.96, shoulder: 0.96, leg: 1.07 },
    anim: { idle: 1.5, gait: 8.6, attack: 'cast', lean: 0.03 },
    silhouette: 'tall collar, bun, floating drafting frame',
    closeupArm: { x: -0.66, z: -0.28 }
  },
  iris: {
    slot: 'personaje_iris', klass: 'Protectora', weapon: 'Farol de custodia',
    accent: '#C49BFF', skin: '#7B4B36', skinShade: '#633A29', hair: '#ECE8E0',
    outfit: '#3B2D54', outfit2: '#655081', trim: '#E7D6B4', leg: '#2A203D',
    style: 'cloak', hairStyle: 'long', extra: 'halo', prop: 'farol',
    body: { h: 1.04, w: 0.95, head: 0.99, shoulder: 0.94, leg: 1.0 },
    anim: { idle: 1.3, gait: 8.5, attack: 'lantern', lean: 0.04 },
    silhouette: 'long cloak, white hair, halo and lantern',
    closeupArm: { x: -0.4, z: -0.18 }
  },
  zenon: {
    slot: 'personaje_zenon', klass: 'Cronista', weapon: 'Bastón de crónica',
    accent: '#E4C07A', skin: '#8C6148', skinShade: '#735039', hair: '#E4DED1',
    outfit: '#5B4425', outfit2: '#8A6A3A', trim: '#E4C07A', leg: '#3E2E1B',
    style: 'archivist', hairStyle: 'longBeard', extra: 'cowl', prop: 'archiveStaff',
    body: { h: 1.01, w: 1.06, head: 1.04, shoulder: 1.08, leg: 0.95 },
    anim: { idle: 1.2, gait: 7.6, attack: 'staff', lean: 0.11 },
    silhouette: 'hunched archivist, wide cowl, long beard, scroll rack',
    closeupArm: { x: -0.32, z: -0.12 }
  }
};

var HERO_SLOTS = {
  personaje_ilan: 'ilan',
  personaje_mara: 'mara',
  personaje_noa: 'noa',
  personaje_teo: 'teo',
  personaje_lia: 'lia',
  personaje_kian: 'kian',
  personaje_amaru: 'amaru',
  personaje_ona: 'ona',
  personaje_iris: 'iris',
  personaje_zenon: 'zenon'
};

var COSMETIC_SLOT_LABELS = {};
CAMP.cosmeticCategories.forEach(function (s) { COSMETIC_SLOT_LABELS[s.id] = s.label; });

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value) || 0)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function pad2(value) { return String(value).padStart(2, '0'); }
function formatNumber(value) { return String(Math.round(Number(value) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function formatPct(value, digits) { return (Number(value) * 100).toFixed(digits == null ? 0 : digits).replace('.0', '') + '%'; }
function plural(n, one, many) { return Number(n) === 1 ? one : (many || one + 's'); }
function nowISO(now) { return (now ? new Date(now) : new Date()).toISOString(); }
function dateKey(now) {
  var d = now ? new Date(now) : new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}
function addMinutes(iso, minutes) { return new Date(new Date(iso).getTime() + Number(minutes || 0) * 60000).toISOString(); }
function addDays(iso, days) { return new Date(new Date(iso).getTime() + Number(days || 0) * 86400000).toISOString(); }
function parseDate(value) {
  if (!value) return null;
  var d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}
function timeAgo(iso) {
  var d = parseDate(iso);
  if (!d) return '';
  var s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 60) return 'hace un momento';
  if (s < 3600) return 'hace ' + Math.floor(s / 60) + ' min';
  if (s < 86400) return 'hace ' + Math.floor(s / 3600) + ' h';
  return 'hace ' + Math.floor(s / 86400) + ' d';
}
function timeUntil(iso) {
  var d = parseDate(iso);
  if (!d) return 'sin programar';
  var ms = d.getTime() - Date.now();
  if (ms <= 0) return 'ahora';
  var mins = Math.ceil(ms / 60000);
  if (mins < 60) return 'en ' + mins + ' min';
  var hours = Math.ceil(mins / 60);
  if (hours < 24) return 'en ' + hours + ' h';
  var days = Math.ceil(hours / 24);
  return 'en ' + days + ' ' + plural(days, 'día', 'días');
}
function shortDate(iso) {
  var d = parseDate(iso);
  if (!d) return '—';
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}
function uid(prefix) { return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7); }

var ICON_PATHS = {
  spark: '<path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/>',
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.7-4 3.1-6 7-6s6.3 2 7 6"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M14.6 9.2c-.6-.7-1.5-1-2.6-1-1.5 0-2.5.7-2.5 1.9 0 1.1.8 1.5 2.6 1.9 1.9.4 2.8.9 2.8 2.1 0 1.2-1.1 2-2.9 2-1.2 0-2.2-.4-2.9-1.2M12 6.6v10.8"/>',
  heart: '<path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9z"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  check: '<path d="M5 12.5l4 4L19 6.5"/>',
  checkCircle: '<circle cx="12" cy="12" r="8.5"/><path d="M8 12.2l2.6 2.6L16.5 9"/>',
  chevronRight: '<path d="M9 5l7 7-7 7"/>',
  chevronLeft: '<path d="M15 5l-7 7 7 7"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  book: '<path d="M4 5.5c3-1 5.5-.4 8 1.3v13c-2.5-1.7-5-2.3-8-1.3v-13z"/><path d="M20 5.5c-3-1-5.5-.4-8 1.3v13c2.5-1.7 5-2.3 8-1.3v-13z"/>',
  rotate: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.1M12 19.1v2.1M21.2 12h-2.1M4.9 12H2.8M18.5 5.5l-1.5 1.5M7 17l-1.5 1.5M18.5 18.5L17 17M7 7L5.5 5.5"/>',
  play: '<path d="M8 5l11 7-11 7V5z"/>',
  pause: '<rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/>',
  sound: '<path d="M4 10v4h4l5 4V6l-5 4H4z"/><path d="M16 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/>',
  soundOff: '<path d="M4 10v4h4l5 4V6l-5 4H4z"/><path d="M16 10l5 5M21 10l-5 5"/>',
  alert: '<path d="M12 4l9 16H3L12 4z"/><path d="M12 9v5M12 17.2v.1"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 13v4M8 20h8M10 17h4"/>',
  arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  arrowDown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  flame: '<path d="M13 3c1 4 4.5 5.2 4.5 9A5.5 5.5 0 0 1 12 17.5 5.5 5.5 0 0 1 6.5 12c0-2 .9-3.5 2.3-4.8.2 1.6.8 2.5 1.8 2.7-.2-2.6 1-5.4 2.4-6.9z"/>',
  shield: '<path d="M12 3l7 3v5c0 4.4-2.8 7.8-7 10-4.2-2.2-7-5.6-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.7"/>',
  compass: '<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z"/>',
  seal: '<path d="M6 3h12v6a6 6 0 0 1-12 0V3z"/><path d="M9 14v7l3-2 3 2v-7"/>',
  feather: '<path d="M20 4C12 4 6 8 5 16l-2 4M5 16c5 1 11-2 13-9"/><path d="M8 13l4 4"/>',
  scroll: '<path d="M7 3h11v15a3 3 0 0 1-3 3H7a3 3 0 0 1 0-6h11"/><path d="M7 3a3 3 0 0 0 0 6"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5M3 16l9 5 9-5"/>',
  bag: '<path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  square: '<rect x="4" y="4" width="16" height="16" rx="3"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.1"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5"/>'
};

function icon(name, size) {
  var s = size || 16;
  return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON_PATHS[name] || ICON_PATHS.spark) + '</svg>';
}
function heartSvg(filled) {
  return '<svg width="17" height="17" viewBox="0 0 24 24" fill="' + (filled ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.7" aria-hidden="true">' + ICON_PATHS.heart + '</svg>';
}

/* -------------------------------------------------------------------------
   Persistencia
   ------------------------------------------------------------------------- */
function baseAreaStats() {
  var out = {};
  CAMP.areas.forEach(function (a) {
    out[a.id] = { answered: 0, correct: 0, wrong: 0, reliableAnswered: 0, reliableCorrect: 0, reliableWrong: 0 };
  });
  return out;
}
function defaultState() {
  var at = nowISO();
  return {
    schema: 1,
    appVersion: APP_VERSION,
    createdAt: at,
    updatedAt: at,
    profile: { name: 'Serumista', createdAt: at },
    xp: 0,
    coins: 0,
    stage: 1,
    academic: { answered: 0, correct: 0, wrong: 0, totalTimeMs: 0, sessions: 0, byArea: baseAreaStats(), recent: [] },
    questions: {},
    errors: {},
    missions: {},
    achievements: {},
    collection: {
      ownedCharacterIds: ['ilan'],
      ownedCosmeticIds: [],
      selectedCharacterId: 'ilan',
      equipped: {}
    },
    daily: { lastCompletedDate: null, streak: 0, bestStreak: 0, totalCompleted: 0, graceWeek: null },
    reviews: { lastCompletedDate: null, completed: 0, onTimeSessions: 0, earlySessions: 0 },
    settings: { sound: true, ambient: true, reducedMotion: false, effectsQuality: 'medio', hide3dFrames: false },
    importedFrom: null,
    importedAt: null,
    events: []
  };
}

var storageEnabled = true;
try {
  var testKey = 'serumsquest:voxel:test';
  window.localStorage.setItem(testKey, '1');
  window.localStorage.removeItem(testKey);
} catch (e) { storageEnabled = false; }

function numberField(value, fallback) {
  var n = Number(value);
  return isFinite(n) && n >= 0 ? Math.trunc(n) : (fallback || 0);
}
function objField(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function normalizeState(raw) {
  var base = defaultState();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  var out = Object.assign({}, base, raw);
  out.profile = Object.assign({}, base.profile, objField(raw.profile));
  out.profile.name = String(out.profile.name || 'Serumista').slice(0, 40);
  out.xp = numberField(raw.xp, 0);
  out.coins = numberField(raw.coins, 0);
  out.stage = clamp(numberField(raw.stage, 1), 1, 4);
  out.academic = Object.assign({}, base.academic, objField(raw.academic));
  out.academic.answered = numberField(out.academic.answered, 0);
  out.academic.correct = Math.min(out.academic.answered, numberField(out.academic.correct, 0));
  out.academic.wrong = numberField(out.academic.wrong, 0);
  out.academic.byArea = baseAreaStats();
  var rawAreas = objField(raw.academic && raw.academic.byArea);
  CAMP.areas.forEach(function (a) {
    var x = objField(rawAreas[a.id]);
    out.academic.byArea[a.id] = {
      answered: numberField(x.answered, 0),
      correct: numberField(x.correct, 0),
      wrong: numberField(x.wrong, 0),
      reliableAnswered: numberField(x.reliableAnswered, 0),
      reliableCorrect: numberField(x.reliableCorrect, 0),
      reliableWrong: numberField(x.reliableWrong, 0)
    };
  });
  out.academic.recent = Array.isArray(out.academic.recent) ? out.academic.recent.slice(-80) : [];
  out.questions = objField(raw.questions);
  out.errors = {};
  var rawErrors = objField(raw.errors);
  Object.keys(rawErrors).forEach(function (id) {
    if (QUESTION_BY_ID[id]) out.errors[id] = Object.assign({}, rawErrors[id], { questionId: id });
  });
  out.missions = {};
  var rawMissions = objField(raw.missions);
  Object.keys(rawMissions).forEach(function (id) {
    if (MISSION_BY_ID[id]) out.missions[id] = rawMissions[id];
  });
  out.achievements = {};
  var rawAch = objField(raw.achievements);
  Object.keys(rawAch).forEach(function (id) {
    if (ACHIEVEMENT_BY_ID[id]) out.achievements[id] = rawAch[id];
  });
  out.collection = Object.assign({}, base.collection, objField(raw.collection));
  var ownedChars = Array.isArray(raw.collection && raw.collection.ownedCharacterIds) ? raw.collection.ownedCharacterIds.filter(function (id) { return CHARACTER_BY_ID[id]; }) : [];
  if (ownedChars.indexOf('ilan') === -1) ownedChars.unshift('ilan');
  out.collection.ownedCharacterIds = Array.from(new Set(ownedChars));
  out.collection.ownedCosmeticIds = Array.isArray(raw.collection && raw.collection.ownedCosmeticIds) ? Array.from(new Set(raw.collection.ownedCosmeticIds.filter(function (id) { return COSMETIC_BY_ID[id]; }))) : [];
  out.collection.selectedCharacterId = CHARACTER_BY_ID[out.collection.selectedCharacterId] && out.collection.ownedCharacterIds.indexOf(out.collection.selectedCharacterId) !== -1 ? out.collection.selectedCharacterId : out.collection.ownedCharacterIds[0];
  out.collection.equipped = objField(raw.collection && raw.collection.equipped);
  out.daily = Object.assign({}, base.daily, objField(raw.daily));
  out.reviews = Object.assign({}, base.reviews, objField(raw.reviews));
  out.settings = Object.assign({}, base.settings, objField(raw.settings));
  out.events = Array.isArray(raw.events) ? raw.events.slice(-100) : [];
  out.importedFrom = raw.importedFrom || null;
  out.importedAt = raw.importedAt || null;
  out.updatedAt = raw.updatedAt || base.updatedAt;
  out.createdAt = raw.createdAt || base.createdAt;
  return out;
}

function loadState() {
  try {
    var raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState();
    var parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch (e) {
    console.warn('No se pudo cargar el guardado local.', e);
    return defaultState();
  }
}
var state = loadState();
function persist() {
  state.updatedAt = nowISO();
  try { window.localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { storageEnabled = false; }
}
function backupCurrentState(reason) {
  try {
    window.localStorage.setItem(BACKUP_KEY, JSON.stringify({
      at: nowISO(),
      reason: reason || 'manual',
      state: state
    }));
    return true;
  } catch (e) { return false; }
}
function loadSettings() {
  try { var raw = window.localStorage.getItem(SETTINGS_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}
function saveSettings() {
  try { window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); } catch (e) {}
}

/* -------------------------------------------------------------------------
   Progresión
   ------------------------------------------------------------------------- */
var LV = CAMP.rules.levels || { base: 80, linear: 40, quadratic: 10, maxLevel: 50 };
function levelCurve(level) {
  var l = Math.max(1, Math.floor(Number(level) || 1));
  return LV.base + LV.linear * (l - 1) + LV.quadratic * Math.pow(l - 1, 2);
}
function levelAt(xp) {
  var xpValue = Math.max(0, Number(xp) || 0);
  var level = 1;
  var remaining = xpValue;
  while (level < LV.maxLevel && remaining >= levelCurve(level)) {
    remaining -= levelCurve(level);
    level += 1;
  }
  if (level >= LV.maxLevel) return { level: level, into: 0, needed: 0, percent: 100, total: xpValue, maxed: true };
  var needed = levelCurve(level);
  return { level: level, into: remaining, needed: needed, percent: Math.round((remaining / needed) * 1000) / 10, total: xpValue, maxed: false };
}
function currentLevel() { return levelAt(state.xp).level; }
function currentMissionStats() {
  var missions = 0, bosses = 0;
  Object.keys(state.missions).forEach(function (id) {
    var m = state.missions[id];
    if (!m || !m.completedAt) return;
    if (MISSION_BY_ID[id] && MISSION_BY_ID[id].kind === 'boss') bosses += 1; else missions += 1;
  });
  return { missions: missions, bosses: bosses };
}
function masteredCount() {
  return Object.keys(state.questions).filter(function (id) {
    return QUESTION_BY_ID[id] && Number(state.questions[id].mastery) >= 3;
  }).length;
}
function areasCorrectCount() {
  var n = 0;
  CAMP.areas.forEach(function (a) {
    if (state.academic.byArea[a.id] && state.academic.byArea[a.id].reliableCorrect > 0) n += 1;
  });
  return n;
}
function overallAccuracy() {
  return state.academic.answered ? state.academic.correct / state.academic.answered : 0;
}
function currentRank() {
  var ranks = CAMP.rules.ranks.slice().sort(function (a, b) { return a.xp - b.xp; });
  var ms = currentMissionStats();
  var stats = {
    xp: state.xp,
    answered: state.academic.answered,
    accuracy: overallAccuracy(),
    mastered: masteredCount(),
    areas: areasCorrectCount(),
    bosses: ms.bosses
  };
  var chosen = ranks[0];
  ranks.forEach(function (r) {
    if (stats.xp >= r.xp && stats.answered >= r.answered && stats.accuracy >= r.accuracy && stats.mastered >= r.mastered && stats.areas >= r.areas && stats.bosses >= r.bosses) chosen = r;
  });
  return chosen;
}
function nextRank() {
  var ranks = CAMP.rules.ranks.slice().sort(function (a, b) { return a.xp - b.xp; });
  var current = currentRank();
  var idx = ranks.findIndex(function (r) { return r.id === current.id; });
  return ranks[idx + 1] || null;
}
function stageInfo() {
  return CAMP.rules.stages[String(state.stage)] || CAMP.rules.stages['1'];
}
function stageRequirements() {
  var rules = CAMP.rules.stageRules;
  var stats = {
    answered: state.academic.answered,
    accuracy: overallAccuracy(),
    mastered: masteredCount(),
    missions: currentMissionStats().missions
  };
  var target = Math.min(4, state.stage + 1);
  if (state.stage >= 4) return { target: 4, complete: true, items: [], stats: stats };
  var items = [];
  if (target === 2) {
    items = [
      { label: 'Respuestas', have: stats.answered, need: rules.minAnswersForStage2, met: stats.answered >= rules.minAnswersForStage2 },
      { label: 'Precisión', have: Math.round(stats.accuracy * 100), need: Math.round(rules.minAccuracyStage2 * 100), suffix: '%', met: stats.accuracy >= rules.minAccuracyStage2 }
    ];
  } else if (target === 3) {
    items = [
      { label: 'Respuestas', have: stats.answered, need: rules.minAnswersForStage3, met: stats.answered >= rules.minAnswersForStage3 },
      { label: 'Precisión', have: Math.round(stats.accuracy * 100), need: Math.round(rules.minAccuracyStage3 * 100), suffix: '%', met: stats.accuracy >= rules.minAccuracyStage3 },
      { label: 'Dominadas', have: stats.mastered, need: rules.minMasteredStage3, met: stats.mastered >= rules.minMasteredStage3 }
    ];
  } else {
    items = [
      { label: 'Respuestas', have: stats.answered, need: rules.minAnswersForStage4, met: stats.answered >= rules.minAnswersForStage4 },
      { label: 'Precisión', have: Math.round(stats.accuracy * 100), need: Math.round(rules.minAccuracyStage4 * 100), suffix: '%', met: stats.accuracy >= rules.minAccuracyStage4 },
      { label: 'Dominadas', have: stats.mastered, need: rules.minMasteredStage4, met: stats.mastered >= rules.minMasteredStage4 },
      { label: 'Misiones', have: stats.missions, need: rules.minMissionsStage4, met: stats.missions >= rules.minMissionsStage4 }
    ];
  }
  return { target: target, complete: items.every(function (i) { return i.met; }), items: items, stats: stats };
}
function evaluateStage() {
  var req = stageRequirements();
  if (req.complete && state.stage < 4) {
    var from = state.stage;
    state.stage = req.target;
    return { from: from, to: state.stage };
  }
  return null;
}
function missionCompleted(id) { return !!(state.missions[id] && state.missions[id].completedAt); }
function missionUnlockInfo(mission) {
  if (!mission) return { unlocked: false, requirements: [] };
  if (missionCompleted(mission.id)) return { unlocked: true, completed: true, requirements: [] };
  var unlock = mission.unlock || { missions: [], level: 1, stage: 1 };
  var level = currentLevel();
  var reqs = [];
  (unlock.missions || []).forEach(function (id) {
    var prev = MISSION_BY_ID[id];
    if (!prev) return;
    reqs.push({ key: 'pre:' + id, label: 'Completar «' + prev.title + '»', have: missionCompleted(id) ? 1 : 0, need: 1, met: missionCompleted(id) });
  });
  if (unlock.level > 1) reqs.push({ key: 'level', label: 'Nivel ' + unlock.level, have: level, need: unlock.level, met: level >= unlock.level });
  if (unlock.stage > 1) reqs.push({ key: 'stage', label: 'Etapa ' + (CAMP.rules.stages[String(unlock.stage)] || {}).name, have: state.stage, need: unlock.stage, met: state.stage >= unlock.stage });
  return { unlocked: reqs.every(function (r) { return r.met; }), completed: false, requirements: reqs };
}
function availableMissions() {
  var list = CAMP.missions.filter(function (m) { return missionUnlockInfo(m).unlocked && !missionCompleted(m.id); });
  sortMissions(list);
  return list;
}
function sortMissions(list) {
  list.sort(function (a, b) {
    if (a.kind !== b.kind) return a.kind === 'boss' ? 1 : -1;
    var ai = CAMP.areas.findIndex(function (x) { return x.id === a.areaId; });
    var bi = CAMP.areas.findIndex(function (x) { return x.id === b.areaId; });
    if (ai !== bi) return ai - bi;
    return a.index - b.index;
  });
  return list;
}
function nextRecommended() {
  var avail = availableMissions();
  if (avail.length) return avail[0];
  var all = CAMP.missions.filter(function (m) { return missionUnlockInfo(m).unlocked; });
  sortMissions(all);
  return all[0] || null;
}
function areaMissions(areaId) {
  return CAMP.missions.filter(function (m) { return m.areaId === areaId; }).sort(function (a, b) {
    if (a.kind !== b.kind) return a.kind === 'boss' ? 1 : -1;
    return a.index - b.index;
  });
}
function areaProgress(areaId) {
  var list = areaMissions(areaId);
  var done = list.filter(function (m) { return missionCompleted(m.id); }).length;
  return { done: done, total: list.length, pct: list.length ? done / list.length : 0 };
}

var RECOVERY_DAYS = (CAMP.rules.recovery && CAMP.rules.recovery.intervalsDays) || [1, 3, 7, 14, 30];
var FIRST_REVIEW_MINUTES = (CAMP.rules.recovery && CAMP.rules.recovery.firstDelayMinutes) || RULES.firstReviewMinutes || 20;
function baseXpForQuestion(question, session) {
  if (!session) return 20;
  if (session.mode === 'boss') {
    var idx = session.cursor;
    return idx < 2 ? 20 : (idx < 5 ? 35 : 50);
  }
  if (session.mode === 'review') return 20;
  var mission = MISSION_BY_ID[session.missionId];
  return mission ? mission.rewards.questionXp : 20;
}
function rewardMultiplier(prior, correct) {
  if (!prior) return { multiplier: 1, reason: 'Primera respuesta correcta.' };
  if (!correct) return { multiplier: 0, reason: 'Respuesta incorrecta: no se otorga XP ni monedas.' };
  if (prior.lastResult === 'wrong') return { multiplier: 0.7, reason: 'Recuperación de una pregunta fallada.' };
  if (prior.lastResult === 'correct') {
    var last = parseDate(prior.lastCorrectAt || prior.lastAttemptAt);
    var hours = last ? (Date.now() - last.getTime()) / 3600000 : 9999;
    if (hours < 6) return { multiplier: 0, reason: 'Repetición dentro de las primeras 6 horas: sin XP.', suppressed: true };
    if (Number(prior.mastery) >= 3) {
      if (hours < 24 * 7) return { multiplier: 0, reason: 'Pregunta dominada: el repaso aún no cumple 7 días.', suppressed: true };
      return { multiplier: 0.1, reason: 'Repaso espaciado de una pregunta dominada.' };
    }
    if (hours < 24) return { multiplier: 0.25, reason: 'Segunda práctica del día: recompensa reducida.' };
    return { multiplier: 0.4, reason: 'Repaso posterior: recompensa parcial.' };
  }
  return { multiplier: 1, reason: 'Primera respuesta correcta.' };
}
function ensureDailyCounters() {
  if (!state.counters || state.counters.date !== dateKey()) {
    state.counters = { date: dateKey(), coins: 0, xp: 0, sessions: 0 };
  }
  return state.counters;
}
function applyXpCoins(xp, coins) {
  var before = currentLevel();
  var counters = ensureDailyCounters();
  var coinCap = 120;
  var requested = Math.max(0, Math.round(Number(coins) || 0));
  var allowedCoins = Math.max(0, Math.min(requested, coinCap - (Number(counters.coins) || 0)));
  state.xp = Math.max(0, state.xp + Math.max(0, Math.round(Number(xp) || 0)));
  state.coins = Math.max(0, state.coins + allowedCoins);
  counters.coins = (Number(counters.coins) || 0) + allowedCoins;
  counters.xp = (Number(counters.xp) || 0) + Math.max(0, Math.round(Number(xp) || 0));
  return { before: before, after: currentLevel(), coinsAdded: allowedCoins, coinCap: coinCap, capReached: requested > allowedCoins };
}
function applyQuestionResult(questionId, chosen, durationMs, session) {
  var q = QUESTION_BY_ID[questionId];
  if (!q) return null;
  var prior = state.questions[questionId] || null;
  var correct = chosen === q.answer;
  var at = nowISO();
  var base = baseXpForQuestion(q, session);
  var mult = rewardMultiplier(prior, correct);
  var xp = correct && !mult.suppressed ? Math.max(1, Math.round(base * mult.multiplier)) : 0;
  var coins = correct && !mult.suppressed && (!prior || !prior.firstCorrectAt) ? 1 : 0;
  if (correct && xp) applyXpCoins(xp, coins);
  var mastery = Math.max(0, Math.min(5, Number(prior && prior.mastery) || 0));
  if (!correct) mastery = Math.max(0, mastery - 1);
  else if (!(prior && prior.lastResult === 'correct' && prior.lastCorrectAt && (Date.now() - (parseDate(prior.lastCorrectAt) || new Date(0)).getTime()) < 86400000)) mastery = Math.min(5, mastery + 1);
  state.questions[questionId] = {
    attempts: (prior && prior.attempts || 0) + 1,
    correct: (prior && prior.correct || 0) + (correct ? 1 : 0),
    wrong: (prior && prior.wrong || 0) + (correct ? 0 : 1),
    mastery: mastery,
    streak: correct ? ((prior && prior.streak) || 0) + 1 : 0,
    bestStreak: Math.max((prior && prior.bestStreak) || 0, correct ? ((prior && prior.streak) || 0) + 1 : 0),
    lastResult: correct ? 'correct' : 'wrong',
    lastAttemptAt: at,
    lastCorrectAt: correct ? at : (prior && prior.lastCorrectAt) || null,
    firstCorrectAt: (prior && prior.firstCorrectAt) || (correct ? at : null),
    recoveryLevel: correct ? Math.max(Number(prior && prior.recoveryLevel) || 0, nextErrorLevel(questionId, true)) : 0,
    nextReviewAt: correct ? nextReviewDate(questionId, at, true) : addMinutes(at, FIRST_REVIEW_MINUTES),
    areaId: q.areaId,
    confidence: q.confidence,
    lastSessionId: session ? session.id : null
  };
  var error = state.errors[questionId];
  if (correct) {
    if (error) {
      var lv = Math.min(RECOVERY_DAYS.length - 1, Math.max(0, Number(error.recoveryLevel) || 0));
      error.recoveryLevel = lv + 1;
      error.recoveredAt = error.recoveredAt || at;
      error.lastCorrectAt = at;
      error.nextReviewAt = addDays(at, RECOVERY_DAYS[lv]);
      error.confidence = q.confidence;
    }
  } else {
    if (!error) {
      error = {
        questionId: questionId,
        areaId: q.areaId,
        confidence: q.confidence,
        firstAt: at,
        lastAt: at,
        count: 0,
        recoveryLevel: 0,
        recoveredAt: null,
        nextReviewAt: null
      };
      state.errors[questionId] = error;
    }
    error.count = (Number(error.count) || 0) + 1;
    error.lastAt = at;
    error.lastWrongAt = at;
    error.recoveryLevel = 0;
    error.recoveredAt = null;
    error.nextReviewAt = addMinutes(at, FIRST_REVIEW_MINUTES);
    error.confidence = q.confidence;
  }
  state.academic.answered += 1;
  if (correct) state.academic.correct += 1; else state.academic.wrong += 1;
  state.academic.totalTimeMs += Math.max(0, Math.min(1800000, Number(durationMs) || 0));
  var area = state.academic.byArea[q.areaId];
  if (area) {
    area.answered += 1;
    if (correct) area.correct += 1; else area.wrong += 1;
    if (q.confidence === 'alta' || q.confidence === 'media') {
      area.reliableAnswered += 1;
      if (correct) area.reliableCorrect += 1; else area.reliableWrong += 1;
    }
  }
  state.academic.recent.push({ at: at, correct: correct, areaId: q.areaId, confidence: q.confidence, mode: session ? session.mode : 'practice' });
  state.academic.recent = state.academic.recent.slice(-80);
  return { correct: correct, xp: xp, coins: coins, reason: mult.reason, mastery: mastery, suppressed: !!mult.suppressed, answer: q.answer };
}
function nextErrorLevel(questionId, correct) {
  var err = state.errors[questionId];
  return err ? Math.min(RECOVERY_DAYS.length - 1, Math.max(0, Number(err.recoveryLevel) || 0)) : 0;
}
function nextReviewDate(questionId, iso, correct) {
  var err = state.errors[questionId];
  var level = err ? Math.min(RECOVERY_DAYS.length - 1, Math.max(0, Number(err.recoveryLevel) || 0)) : 0;
  return addDays(iso, RECOVERY_DAYS[level]);
}
function dueErrors(now) {
  var t = (now ? new Date(now) : new Date()).getTime();
  return Object.keys(state.errors).map(function (id) { return state.errors[id]; }).filter(function (e) {
    if (!e || !QUESTION_BY_ID[e.questionId]) return false;
    var due = parseDate(e.nextReviewAt);
    return !due || due.getTime() <= t;
  }).sort(function (a, b) {
    if (!!a.recoveredAt !== !!b.recoveredAt) return a.recoveredAt ? 1 : -1;
    return String(a.nextReviewAt || '').localeCompare(String(b.nextReviewAt || ''));
  });
}
function errorStats() {
  var pending = 0, due = 0, recovered = 0, mastered = 0;
  Object.keys(state.errors).forEach(function (id) {
    var e = state.errors[id];
    if (!e) return;
    if (e.recoveredAt) recovered += 1; else pending += 1;
    if (Number(e.recoveryLevel) >= 2) mastered += 1;
    var at = parseDate(e.nextReviewAt);
    if ((!at || at.getTime() <= Date.now()) && QUESTION_BY_ID[e.questionId]) due += 1;
  });
  return { pending: pending, due: due, recovered: recovered, mastered: mastered, total: pending + recovered };
}
function sessionResult(session, reason) {
  var entries = session.orders.map(function (id) { return session.answers[id]; }).filter(Boolean);
  var answered = entries.filter(function (e) { return !e.omitted; }).length;
  var correct = entries.filter(function (e) { return e.correct; }).length;
  var wrong = entries.filter(function (e) { return !e.correct && !e.omitted; }).length;
  var omitted = session.questions.length - entries.length + entries.filter(function (e) { return e.omitted; }).length;
  var accuracy = answered ? correct / answered : 0;
  var allAnswered = answered >= session.questions.length;
  var pass = false;
  var label = 'La ruta exige completar la sesión.';
  if (reason === 'abandoned') label = 'Ruta abandonada: tus respuestas quedan guardadas, pero no hay recompensa de cierre.';
  else if (reason === 'hearts') label = 'Tus corazones se agotaron. La ruta queda abierta para volver a intentarlo.';
  else if (session.mode === 'mission') {
    pass = allAnswered && accuracy >= (RULES.missionPass || 0.6);
    label = pass ? 'Misión superada: la ruta queda registrada.' : 'La misión exige responder todo y al menos ' + Math.round((RULES.missionPass || 0.6) * 100) + '% de aciertos.';
  } else if (session.mode === 'boss') {
    var coverage = session.questions.length ? correct / session.questions.length : 0;
    pass = allAnswered && coverage >= (RULES.bossPass || 0.7);
    label = pass ? 'Jefe superado: el sello de la ruta es tuyo.' : 'El jefe exige al menos ' + Math.round((RULES.bossPass || 0.7) * 100) + '% de aciertos sobre el total.';
  } else if (session.mode === 'review') {
    pass = answered >= Math.min(3, session.questions.length) && accuracy >= (RULES.reviewPass || 0.5) && reason !== 'hearts';
    label = pass ? 'Repaso completado: la memoria vuelve a ordenarse.' : 'El repaso exige al menos ' + Math.min(3, session.questions.length) + ' respuestas y ' + Math.round((RULES.reviewPass || 0.5) * 100) + '% de aciertos.';
  }
  if (reason === 'hearts') pass = false;
  return { answered: answered, correct: correct, wrong: wrong, omitted: omitted, accuracy: accuracy, allAnswered: allAnswered, pass: pass, label: label, total: session.questions.length };
}
function calcCompletionReward(session, result) {
  if (!result.pass) return { xp: 0, coins: 0, reason: result.label, duplicate: false };
  if (session.mode === 'mission' || session.mode === 'boss') {
    var wasCompleted = missionCompleted(session.missionId);
    if (wasCompleted) return { xp: 0, coins: 0, reason: 'Esta ruta ya estaba completada; no repite la recompensa de cierre.', duplicate: true };
    var m = MISSION_BY_ID[session.missionId];
    var xp = m.kind === 'boss' ? 80 : 30;
    var coins = m.kind === 'boss' ? 25 : 8;
    applyXpCoins(xp, coins);
    return { xp: xp, coins: coins, reason: 'Recompensa de cierre de ruta.', duplicate: false };
  }
  if (session.mode === 'review') {
    if (state.reviews.lastCompletedDate === dateKey()) return { xp: 0, coins: 0, reason: 'El bono diario de repaso ya fue registrado.', duplicate: true };
    state.reviews.lastCompletedDate = dateKey();
    state.reviews.completed += 1;
    applyXpCoins(30, 5);
    return { xp: 30, coins: 5, reason: 'Bono diario de repaso.', duplicate: false };
  }
  return { xp: 0, coins: 0, reason: 'Sin recompensa de cierre.' };
}
function achievementMetrics() {
  var ms = currentMissionStats();
  var areasWithCorrect = 0, completedAreas = 0;
  CAMP.areas.forEach(function (a) {
    if (state.academic.byArea[a.id] && state.academic.byArea[a.id].reliableCorrect > 0) areasWithCorrect += 1;
    var route = areaMissions(a.id).filter(function (m) { return m.kind === 'mission'; });
    if (route.length && route.every(function (m) { return missionCompleted(m.id); })) completedAreas += 1;
  });
  return {
    answered: state.academic.answered,
    correct: state.academic.correct,
    accuracy: overallAccuracy(),
    missions: ms.missions,
    bosses: ms.bosses,
    mastered: masteredCount(),
    level: currentLevel(),
    coins: state.coins,
    areasCorrect: areasWithCorrect,
    areasCompleted: completedAreas,
    recoveries: Object.keys(state.errors).filter(function (id) { return state.errors[id].recoveredAt; }).length,
    dailyStreak: Math.max(state.daily.streak || 0, state.daily.bestStreak || 0),
    survivalWins: 0,
    timedAce: 0
  };
}
function checkAchievements() {
  var metrics = achievementMetrics();
  var unlocked = [];
  CAMP.achievements.forEach(function (def) {
    if (state.achievements[def.id] && state.achievements[def.id].unlockedAt) return;
    var have = Number(metrics[def.metric]) || 0;
    if (def.metric === 'accuracy' && metrics.answered < 20) have = 0;
    if (have >= Number(def.target)) {
      state.achievements[def.id] = { unlockedAt: nowISO(), xp: def.xp, coins: def.coins };
      applyXpCoins(def.xp, def.coins);
      unlocked.push(def);
    }
  });
  return unlocked;
}
function syncCharacters() {
  var ms = currentMissionStats();
  var unlocked = [];
  CAMP.characters.forEach(function (char) {
    if (!char || state.collection.ownedCharacterIds.indexOf(char.id) !== -1) return;
    var access = char.access || {};
    if (access.kind === 'reward' && Number(access.missions || 0) > 0 && ms.missions >= Number(access.missions)) {
      state.collection.ownedCharacterIds.push(char.id);
      unlocked.push(char);
    }
  });
  return unlocked;
}
function heroRequirementState(char) {
  var owned = state.collection.ownedCharacterIds.indexOf(char.id) !== -1;
  var access = char.access || {};
  var ms = currentMissionStats();
  var lv = currentLevel();
  var levelNeed = Number(access.level || 0);
  var missionNeed = Number(access.missions || 0);
  var price = Number(char.price) || 0;
  if (owned) return { owned: true, canRecruit: false, kind: access.kind, price: price, char: char };
  if (access.kind === 'reward') {
    return {
      owned: false,
      kind: 'reward',
      price: 0,
      canRecruit: ms.missions >= missionNeed,
      missionsNeed: missionNeed,
      missionsHave: ms.missions,
      reason: ms.missions >= missionNeed ? 'La recompensa ya está lista.' : 'Completa ' + missionNeed + ' misiones (' + ms.missions + '/' + missionNeed + ').'
    };
  }
  var levelMet = !levelNeed || lv >= levelNeed;
  var coinsMet = state.coins >= price;
  var reason = '';
  if (!levelMet) reason = 'Alcanza el nivel ' + levelNeed + ' (nivel actual ' + lv + ').';
  else if (!coinsMet) reason = 'Te faltan ' + formatNumber(price - state.coins) + ' monedas.';
  else reason = 'Puedes reclamar a este héroe.';
  return {
    owned: false,
    kind: 'purchase',
    price: price,
    canRecruit: levelMet && coinsMet,
    levelNeed: levelNeed,
    levelHave: lv,
    levelMet: levelMet,
    coinsMet: coinsMet,
    missionsNeed: missionNeed,
    missionsHave: ms.missions,
    reason: reason
  };
}
function purchaseHero(heroId) {
  var char = CHARACTER_BY_ID[heroId];
  if (!char) return { ok: false, reason: 'Héroe desconocido.' };
  if (state.collection.ownedCharacterIds.indexOf(heroId) !== -1) return { ok: false, reason: 'Ya forma parte de tu colección.' };
  var req = heroRequirementState(char);
  if (!req.canRecruit) return { ok: false, reason: req.reason };
  if (req.kind === 'reward') {
    state.collection.ownedCharacterIds.push(heroId);
    persist();
    return { ok: true, free: true, char: char };
  }
  if (state.coins < req.price) return { ok: false, reason: 'No tienes monedas suficientes.' };
  state.coins -= req.price;
  state.collection.ownedCharacterIds.push(heroId);
  state.collection.unlockedBy = state.collection.unlockedBy || {};
  state.collection.unlockedBy[heroId] = { method: 'purchase', at: nowISO(), price: req.price };
  persist();
  return { ok: true, free: false, char: char, price: req.price };
}

/* -------------------------------------------------------------------------
   Importación del SERUMS QUEST original (esquema 2)
   ------------------------------------------------------------------------- */
function parseLegacyProgress(text) {
  if (!text || !String(text).trim()) throw new Error('El portapapeles o el archivo están vacíos.');
  var parsed;
  try { parsed = JSON.parse(String(text).trim()); } catch (e) { throw new Error('Ese archivo no contiene JSON válido.'); }
  if (parsed && parsed.app && parsed.app !== 'SERUMS QUEST') throw new Error('El archivo pertenece a otra aplicación, no a SERUMS QUEST.');
  var raw = parsed && parsed.state ? parsed.state : parsed;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('No encuentro un progreso reconocible dentro del archivo.');
  if (!parsed.state && raw.schemaVersion == null && !raw.profile && raw.xp == null) throw new Error('El archivo no parece una partida guardada de SERUMS QUEST.');
  var out = defaultState();
  out.profile.name = String((raw.profile && raw.profile.name) || 'Serumista').slice(0, 40);
  out.xp = numberField(raw.xp, 0);
  out.coins = numberField(raw.coins, 0);
  out.stage = clamp(numberField(raw.stage, 1), 1, 4);
  out.createdAt = raw.createdAt || out.createdAt;
  out.academic.answered = numberField(raw.academic && raw.academic.answered, 0);
  out.academic.correct = Math.min(out.academic.answered, numberField(raw.academic && raw.academic.correct, 0));
  out.academic.wrong = numberField(raw.academic && raw.academic.wrong, 0);
  out.academic.totalTimeMs = numberField(raw.academic && raw.academic.totalTimeMs, 0);
  out.academic.sessions = numberField(raw.academic && raw.academic.sessions, 0);
  var byArea = objField(raw.academic && raw.academic.byArea);
  CAMP.areas.forEach(function (a) {
    var src = objField(byArea[a.id]);
    out.academic.byArea[a.id] = {
      answered: numberField(src.answered, 0),
      correct: numberField(src.correct, 0),
      wrong: numberField(src.wrong, 0),
      reliableAnswered: numberField(src.reliableAnswered, 0),
      reliableCorrect: numberField(src.reliableCorrect, 0),
      reliableWrong: numberField(src.reliableWrong, 0)
    };
  });
  out.academic.recent = Array.isArray(raw.academic && raw.academic.recent) ? raw.academic.recent.slice(-80) : [];
  var rawQuestions = objField(raw.questions);
  Object.keys(rawQuestions).forEach(function (id) {
    if (QUESTION_BY_ID[id]) out.questions[id] = rawQuestions[id];
  });
  var rawErrors = objField(raw.errors);
  Object.keys(rawErrors).forEach(function (id) {
    if (QUESTION_BY_ID[id]) out.errors[id] = Object.assign({}, rawErrors[id], { questionId: id });
  });
  var rawMissions = objField(raw.missions);
  Object.keys(rawMissions).forEach(function (id) {
    if (MISSION_BY_ID[id]) out.missions[id] = rawMissions[id];
  });
  var rawAchievements = objField(raw.achievements);
  Object.keys(rawAchievements).forEach(function (id) {
    if (ACHIEVEMENT_BY_ID[id]) out.achievements[id] = rawAchievements[id];
  });
  var coll = objField(raw.collection);
  var ownedCharacters = Array.isArray(coll.ownedCharacterIds) ? coll.ownedCharacterIds.filter(function (id) { return CHARACTER_BY_ID[id]; }) : ['ilan'];
  if (ownedCharacters.indexOf('ilan') === -1) ownedCharacters.unshift('ilan');
  out.collection.ownedCharacterIds = Array.from(new Set(ownedCharacters));
  out.collection.ownedCosmeticIds = Array.isArray(coll.ownedCosmeticIds) ? Array.from(new Set(coll.ownedCosmeticIds.filter(function (id) { return COSMETIC_BY_ID[id]; }))) : [];
  out.collection.selectedCharacterId = CHARACTER_BY_ID[coll.selectedCharacterId] && out.collection.ownedCharacterIds.indexOf(coll.selectedCharacterId) !== -1 ? coll.selectedCharacterId : out.collection.ownedCharacterIds[0];
  out.collection.equipped = {};
  var rawEquipped = objField(coll.equipped);
  Object.keys(rawEquipped).forEach(function (charId) {
    if (out.collection.ownedCharacterIds.indexOf(charId) === -1) return;
    var outfit = objField(rawEquipped[charId]);
    var clean = {};
    Object.keys(outfit).forEach(function (slot) {
      if (COSMETIC_BY_ID[outfit[slot]] && out.collection.ownedCosmeticIds.indexOf(outfit[slot]) !== -1) clean[slot] = outfit[slot];
    });
    if (Object.keys(clean).length) out.collection.equipped[charId] = clean;
  });
  out.daily = Object.assign({}, out.daily, objField(raw.daily));
  out.importedFrom = 'SERUMS QUEST ' + (raw.appVersion || '1.2.x');
  out.importedAt = nowISO();
  var difficulty = [];
  var unresolvedErrors = Object.keys(rawErrors).length - Object.keys(out.errors).length;
  var unresolvedMissions = Object.keys(rawMissions).length - Object.keys(out.missions).length;
  if (unresolvedErrors > 0) difficulty.push(unresolvedErrors + ' ' + plural(unresolvedErrors, 'error de una pregunta que no está', 'errores de preguntas que no están') + ' en la campaña actual');
  if (unresolvedMissions > 0) difficulty.push(unresolvedMissions + ' ' + plural(unresolvedMissions, 'misión o modo fuera', 'misiones o modos fuera') + ' de la campaña');
  return {
    state: out,
    summary: {
      name: out.profile.name,
      xp: out.xp,
      coins: out.coins,
      level: levelAt(out.xp).level,
      rank: currentRankName(out),
      ownedCharacters: out.collection.ownedCharacterIds.length,
      ownedCosmetics: out.collection.ownedCosmeticIds.length,
      achievements: Object.keys(out.achievements).length,
      missions: Object.keys(out.missions).filter(function (id) { return out.missions[id] && out.missions[id].completedAt; }).length,
      errors: Object.keys(out.errors).length,
      stage: out.stage,
      difficulties: difficulty,
      missingCosmetics: Array.isArray(coll.ownedCosmeticIds) ? coll.ownedCosmeticIds.filter(function (id) { return !COSMETIC_BY_ID[id]; }).length : 0
    }
  };
}
function currentRankName(snapshot) {
  var ranks = CAMP.rules.ranks.slice().sort(function (a, b) { return a.xp - b.xp; });
  var ms = { missions: 0, bosses: 0 };
  Object.keys(snapshot.missions || {}).forEach(function (id) {
    var m = snapshot.missions[id];
    if (!m || !m.completedAt) return;
    if (MISSION_BY_ID[id] && MISSION_BY_ID[id].kind === 'boss') ms.bosses += 1; else ms.missions += 1;
  });
  var answered = snapshot.academic.answered || 0;
  var accuracy = answered ? (snapshot.academic.correct || 0) / answered : 0;
  var mastered = Object.keys(snapshot.questions || {}).filter(function (id) { return Number((snapshot.questions[id] || {}).mastery) >= 3; }).length;
  var areas = CAMP.areas.filter(function (a) { return snapshot.academic.byArea && snapshot.academic.byArea[a.id] && snapshot.academic.byArea[a.id].reliableCorrect > 0; }).length;
  var chosen = ranks[0];
  ranks.forEach(function (r) {
    if ((snapshot.xp || 0) >= r.xp && answered >= r.answered && accuracy >= r.accuracy && mastered >= r.mastered && areas >= r.areas && ms.bosses >= r.bosses) chosen = r;
  });
  return chosen.name;
}
function applyLegacyImport(candidate) {
  backupCurrentState('previous-state');
  state = candidate;
  state.updatedAt = nowISO();
  persist();
  saveSettings();
}

function findLegacyLocalState() {
  var keys = ['serumsquest:state:v1', 'serumsquest:backup:v1', 'serumsquest:journal:v1'];
  for (var i = 0; i < keys.length; i++) {
    try {
      var raw = window.localStorage.getItem(keys[i]);
      if (!raw) continue;
      var parsed = JSON.parse(raw);
      var text = JSON.stringify(parsed.state || parsed.value || parsed);
      if (text && text.length > 20) return { key: keys[i], text: text };
    } catch (e) {}
  }
  return null;
}

/* -------------------------------------------------------------------------
   Utilidades de juego
   ------------------------------------------------------------------------- */
function totalMissionPractice() {
  return Object.keys(state.questions).length;
}
function nextDueLabel() {
  var due = dueErrors();
  if (!due.length) return null;
  return due.length + ' ' + plural(due.length, 'pregunta', 'preguntas') + ' por repasar';
}
function areaName(id) { return AREA_BY_ID[id] ? AREA_BY_ID[id].short : 'Ruta'; }
function heroName(id) {
  if (CHARACTER_BY_ID[id]) return CHARACTER_BY_ID[id].name;
  return 'Ilan Vega';
}
function selectedCharacter() {
  return CHARACTER_BY_ID[state.collection.selectedCharacterId] || CAMP.characters[0];
}
function selectedLook() {
  return HERO_LOOKS[state.collection.selectedCharacterId] || HERO_LOOKS.ilan;
}
function missionConditionLabel(m) {
  if (missionCompleted(m.id)) return 'Completada';
  var u = missionUnlockInfo(m);
  if (u.unlocked) return 'Disponible';
  return 'Bloqueada';
}
function cosmeticCountOwned() { return state.collection.ownedCosmeticIds.length; }
function activeMissionQuestionStats(session) {
  if (!session) return [];
  return session.questions.map(function (qid, index) {
    return { index: index, answered: !!session.answers[qid], current: index === session.cursor };
  });
}
function validateLegacySummary(summary) { return summary && summary.name ? summary : null; }

/* -------------------------------------------------------------------------
   Sonido sintetizado
   ------------------------------------------------------------------------- */
var audioCtx = null;
var ambientNodes = null;
function initAudio() {
  if (!state.settings.sound) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (state.settings.ambient) startAmbient();
  } catch (e) { audioCtx = null; }
}
function tone(freq, duration, type, volume, slideTo) {
  if (!audioCtx || !state.settings.sound) return;
  try {
    var now = audioCtx.currentTime;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    gain.gain.setValueAtTime(Math.max(0.0001, volume || 0.04), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  } catch (e) {}
}
function chord(freqs, duration, volume) {
  freqs.forEach(function (f, i) {
    window.setTimeout(function () { tone(f, duration, 'triangle', volume || 0.03); }, i * 70);
  });
}
function startAmbient() {
  if (ambientNodes || !audioCtx || !state.settings.sound || !state.settings.ambient) return;
  try {
    var master = audioCtx.createGain();
    master.gain.value = 0.018;
    master.connect(audioCtx.destination);
    var filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    filter.Q.value = 0.6;
    filter.connect(master);
    var freqs = [55, 82.41, 110, 164.81];
    var nodes = freqs.map(function (f, idx) {
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = idx % 2 ? 'sine' : 'triangle';
      osc.frequency.value = f;
      gain.gain.value = idx === 0 ? 0.5 : 0.17;
      osc.connect(gain).connect(filter);
      osc.start();
      return { osc: osc, gain: gain };
    });
    ambientNodes = { master: master, nodes: nodes, filter: filter };
  } catch (e) {}
}
function stopAmbient() {
  if (!ambientNodes) return;
  try {
    ambientNodes.nodes.forEach(function (n) { try { n.osc.stop(); } catch (e) {} });
    ambientNodes.master.disconnect();
  } catch (e) {}
  ambientNodes = null;
}
function sfxClick() { tone(740, 0.05, 'triangle', 0.025); }
function sfxSelect() { tone(520, 0.08, 'sine', 0.03, 680); }
function sfxAttack() { tone(190, 0.18, 'sawtooth', 0.035, 86); tone(370, 0.1, 'triangle', 0.022, 720); }
function sfxHit() { tone(120, 0.22, 'square', 0.03, 62); }
function sfxCorrect() { chord([523.25, 659.25, 783.99], 0.22, 0.026); }
function sfxWrong() { tone(145, 0.28, 'sawtooth', 0.03, 92); }
function sfxVictory() { chord([392, 523.25, 659.25, 783.99], 0.5, 0.028); }
function sfxDefeat() { chord([196, 164.81, 130.81], 0.55, 0.026); }
function setSoundEnabled(enabled) {
  state.settings.sound = !!enabled;
  if (state.settings.sound) {
    initAudio();
    startAmbient();
    sfxSelect();
  } else {
    stopAmbient();
  }
  saveSettings();
  persist();
}
function setAmbientEnabled(enabled) {
  state.settings.ambient = !!enabled;
  if (state.settings.ambient && state.settings.sound) { initAudio(); startAmbient(); }
  else stopAmbient();
  saveSettings();
  persist();
}

/* -------------------------------------------------------------------------
   Runtime UI base
   ------------------------------------------------------------------------- */
var screen = 'boot';
var view = 'hub';
var selectedAreaId = CAMP.areas[0].id;
var selectedMissionId = null;
var session = null;
var lastFeedback = null;
var lastResult = null;
var importPreview = null;
var importText = '';
var toastTimer = 0;
var loadingHidden = false;
var touchInput = { x: 0, z: 0 };
var virtualKeys = {};
var lastFrameTime = performance.now();
var fps = 60;
var nowMs = 0;
var victoryAt = 0;

EL.root = document.getElementById('ui') || (function () {
  var n = document.createElement('div');
  n.id = 'ui';
  document.body.appendChild(n);
  return n;
})();
EL.root.innerHTML = '<div id="loading" class="loadingShell"><div><div class="loadingRune"></div><b>Abriendo el observatorio</b><small>Las cinco rutas esperan. Cargando la campaña y los modelos voxel.</small></div></div>' +
  '<header id="hud" class="hud hidden"></header>' +
  '<div id="tracker" class="tracker hidden"></div>' +
  '<div id="prompt" class="prompt hidden"><kbd>E</kbd><span></span></div>' +
  '<div id="hintRow" class="hintRow hidden"><span><kbd>WASD</kbd> mover</span><span><kbd>E</kbd> interactuar</span><span><kbd>M</kbd> bitácora</span><span><kbd>R</kbd> repaso</span><span><kbd>Esc</kbd> pausa</span></div>' +
  '<div id="screen" class="screenRoot"></div>' +
  '<div id="touchControls" class="touchControls"><div class="touchPad"><button class="touchDir touchUp" data-touch-dir="up" aria-label="Avanzar">' + icon('arrowUp', 17) + '</button><button class="touchDir touchLeft" data-touch-dir="left" aria-label="Izquierda">' + icon('arrowLeft', 17) + '</button><button class="touchDir touchRight" data-touch-dir="right" aria-label="Derecha">' + icon('arrowRight', 17) + '</button><button class="touchDir touchDown" data-touch-dir="down" aria-label="Retroceder">' + icon('arrowDown', 17) + '</button></div></div>' +
  '<button id="touchAction" class="touchAction hidden" type="button" aria-label="Interactuar">' + icon('spark', 20) + '<span>E</span></button>' +
  '<div id="toastStack" class="toastStack"></div>' +
  '<div id="hitFlash" class="hitFlash"></div>' +
  '<div id="attackFlash" class="attackFlash"></div>' +
  '<div id="fadeLayer" class="fadeLayer"></div>';
EL.hud = document.getElementById('hud');
EL.tracker = document.getElementById('tracker');
EL.prompt = document.getElementById('prompt');
EL.hintRow = document.getElementById('hintRow');
EL.screen = document.getElementById('screen');
EL.touchControls = document.getElementById('touchControls');
EL.touchAction = document.getElementById('touchAction');
EL.toastStack = document.getElementById('toastStack');
EL.hitFlash = document.getElementById('hitFlash');
EL.attackFlash = document.getElementById('attackFlash');
EL.fadeLayer = document.getElementById('fadeLayer');

function toast(message, tone, duration) {
  if (!EL.toastStack) return;
  var node = document.createElement('div');
  node.className = 'toast ' + (tone ? 'is-' + tone : '');
  node.innerHTML = icon(tone === 'error' ? 'alert' : (tone === 'warn' ? 'info' : 'checkCircle'), 15) + '<div>' + esc(message) + '</div>';
  EL.toastStack.appendChild(node);
  window.setTimeout(function () {
    node.style.opacity = '0';
    node.style.transform = 'translateY(7px)';
    node.style.transition = 'opacity 180ms ease, transform 180ms ease';
    window.setTimeout(function () { node.remove(); }, 220);
  }, duration || 3600);
}
function setLoading(show) {
  var el = document.getElementById('loading');
  if (!el) return;
  if (show) { el.classList.remove('hidden'); loadingHidden = false; }
  else { el.classList.add('hidden'); loadingHidden = true; }
}
function flashHit() {
  EL.hitFlash.classList.remove('is-on');
  void EL.hitFlash.offsetWidth;
  EL.hitFlash.classList.add('is-on');
}
function flashAttack() {
  EL.attackFlash.classList.remove('is-on');
  void EL.attackFlash.offsetWidth;
  EL.attackFlash.classList.add('is-on');
}

/* =========================================================================
   MUNDO VOXEL — observatorio, héroes, guardianes y arena de duelo
   ========================================================================= */
var THREE = window.THREE;
var canvas = document.getElementById('game');
var parentWindow = window.parent && window.parent !== window ? window.parent : null;
function post(message) {
  if (!parentWindow) return;
  message.source = 'dsh-game-studio';
  try { parentWindow.postMessage(message, '*'); } catch (e) {}
}
function reportError(text) { post({ type: 'error', message: String(text).slice(0, 300) }); }
window.addEventListener('error', function (event) { reportError(event.message || event.error || 'error'); });
window.addEventListener('unhandledrejection', function (event) {
  var reason = event.reason;
  reportError((reason && reason.message) || reason || 'unhandled rejection');
});

var renderer = null;
try {
  if (!THREE) throw new Error('no se encontró el runtime de three.js');
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
} catch (error) {
  renderer = null;
  var fail = document.createElement('div');
  fail.className = 'loadingShell';
  fail.innerHTML = '<div><div class="loadingRune"></div><b>El observatorio necesita WebGL</b><small>No se pudo iniciar el render 3D. Prueba con otro navegador o activa la aceleración por hardware.</small></div>';
  document.body.appendChild(fail);
  reportError('WebGL no disponible: ' + (error && error.message || error));
}
if (renderer) {
  canvas.addEventListener('webglcontextlost', function (event) { event.preventDefault(); reportError('El contexto WebGL se perdió.'); });
}

var scene = new THREE.Scene();
scene.fog = new THREE.Fog(RULES.palette ? RULES.palette.fog : '#090e1a', 28, 78);
var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 500);
var clock = 0;
var ARENA_POS = new THREE.Vector3(160, 0, -64);
var HUB_RADIUS = Number(RULES.worldRadius) || 9.2;
var BOX = new THREE.BoxGeometry(1, 1, 1);
var dummy = new THREE.Object3D();
var palette = RULES.palette || {};

function color(hex) { return new THREE.Color(hex); }
function mulberry32(seed) {
  var a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
var rng = mulberry32(Number(RULES.seed) || 41);

function radialTexture(stops, size) {
  var c = document.createElement('canvas');
  c.width = c.height = size || 128;
  var g = c.getContext('2d');
  var grad = g.createRadialGradient(c.width / 2, c.height / 2, 0, c.width / 2, c.height / 2, c.width / 2);
  stops.forEach(function (s) { grad.addColorStop(s[0], s[1]); });
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  var tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
var GLOW_TEX = radialTexture([[0, 'rgba(255,255,255,1)'], [0.24, 'rgba(255,240,206,0.6)'], [1, 'rgba(255,255,255,0)']]);
var SOFT_GLOW = radialTexture([[0, 'rgba(255,255,255,0.6)'], [0.45, 'rgba(255,255,255,0.15)'], [1, 'rgba(255,255,255,0)']], 64);
var BLOB_TEX = radialTexture([[0, 'rgba(0,0,0,0.5)'], [0.55, 'rgba(0,0,0,0.24)'], [1, 'rgba(0,0,0,0)']], 64);

function makeGlowSprite(hex, scale, opacity) {
  var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: GLOW_TEX,
    color: color(hex),
    transparent: true,
    opacity: opacity == null ? 0.6 : opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false
  }));
  sprite.scale.set(scale || 4, scale || 4, 1);
  return sprite;
}
function makeBlob(radius) {
  var mesh = new THREE.Mesh(new THREE.PlaneGeometry(radius, radius), new THREE.MeshBasicMaterial({ map: BLOB_TEX, transparent: true, opacity: 0.7, depthWrite: false }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.015;
  mesh.renderOrder = 2;
  return mesh;
}

/** Merges a list of boxes into one vertex-coloured mesh per material kind.
 *  Box format: [x, y, z, width, height, depth, colour, glow] */
function mergedVoxels(boxes) {
  var groups = [[], []];
  for (var i = 0; i < boxes.length; i++) groups[boxes[i][7] ? 1 : 0].push(boxes[i]);
  var out = new THREE.Group();
  for (var p = 0; p < 2; p++) {
    if (!groups[p].length) continue;
    var positions = [], normals = [], colors = [], indices = [];
    for (var b = 0; b < groups[p].length; b++) {
      var box = groups[p][b];
      var geo = new THREE.BoxGeometry(box[3], box[4], box[5]);
      geo.translate(box[0], box[1], box[2]);
      var pos = geo.attributes.position, nor = geo.attributes.normal, base = positions.length / 3;
      var tint = color(box[6]);
      for (var v = 0; v < pos.count; v++) {
        positions.push(pos.getX(v), pos.getY(v), pos.getZ(v));
        normals.push(nor.getX(v), nor.getY(v), nor.getZ(v));
        colors.push(tint.r, tint.g, tint.b);
      }
      var index = geo.index.array;
      for (var k = 0; k < index.length; k++) indices.push(base + index[k]);
      geo.dispose();
    }
    var merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    merged.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    merged.setIndex(indices);
    merged.computeBoundingSphere();
    var material = p === 0
      ? new THREE.MeshLambertMaterial({ vertexColors: true })
      : new THREE.MeshBasicMaterial({ vertexColors: true });
    var mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = p === 0;
    mesh.receiveShadow = p === 0;
    out.add(mesh);
  }
  return out;
}

function addVoxel(parent, boxes) {
  var model = mergedVoxels(boxes);
  parent.add(model);
  return model;
}

function addLabelSprite(text, subtext, accent, scale) {
  var c = document.createElement('canvas');
  c.width = 640; c.height = 188;
  var g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = 'rgba(5,8,14,0.70)';
  roundedRect(g, 40, 26, 560, 124, 16);
  g.fill();
  g.strokeStyle = accent;
  g.globalAlpha = 0.55;
  g.lineWidth = 2;
  roundedRect(g, 40, 26, 560, 124, 16);
  g.stroke();
  g.globalAlpha = 1;
  g.fillStyle = accent;
  g.fillRect(c.width / 2 - 50, 26, 100, 2);
  g.font = '800 34px "Bahnschrift","Segoe UI",sans-serif';
  g.fillStyle = '#f1f3f8';
  g.fillText(String(text).toUpperCase().slice(0, 28), c.width / 2, 78);
  g.font = '700 20px "Segoe UI",sans-serif';
  g.fillStyle = 'rgba(194,205,225,0.9)';
  g.fillText(String(subtext || '').toUpperCase().slice(0, 38), c.width / 2, 116);
  var tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  var sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, fog: false }));
  var s = scale || 3.4;
  sprite.scale.set(s, s * 0.294, 1);
  sprite.renderOrder = 20;
  return sprite;
}
function roundedRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/* -------------------------------------------------------------------------
   Héroe voxel modular
   ------------------------------------------------------------------------- */
function heroLook(id) { return HERO_LOOKS[id] || HERO_LOOKS.ilan; }
function addPartBoxes(part, boxes) {
  var mesh = mergedVoxels(boxes);
  part.add(mesh);
  return mesh;
}
function makeHead(look, id) {
  var pivot = new THREE.Group();
  pivot.position.set(0, 1.68, 0);
  pivot.userData.baseHatGroups = [];
  var headColor = look.skin;
  var boxes = [
    [0, 0.06, 0, 0.20, 0.12, 0.18, look.skinShade],
    [0, 0.30, 0, 0.49, 0.48, 0.44, headColor],
    [0, 0.30, 0.225, 0.31, 0.32, 0.015, look.skin],
    [-0.255, 0.30, 0.0, 0.04, 0.16, 0.14, look.skinShade],
    [0.255, 0.30, 0.0, 0.04, 0.16, 0.14, look.skinShade],
    [-0.105, 0.34, 0.232, 0.075, 0.075, 0.015, '#1b2028'],
    [0.105, 0.34, 0.232, 0.075, 0.075, 0.015, '#1b2028'],
    [-0.105, 0.352, 0.24, 0.026, 0.026, 0.006, look.accent, true],
    [0.105, 0.352, 0.24, 0.026, 0.026, 0.006, look.accent, true],
    [0, 0.255, 0.246, 0.06, 0.12, 0.02, look.skinShade],
    [0, 0.17, 0.243, 0.14, 0.045, 0.012, '#613b35']
  ];
  addPartBoxes(pivot, boxes);
  var ext = [];
  var hair = look.hair;
  var hs = look.hairStyle;
  if (hs === 'side') {
    ext.push([0, 0.58, -0.02, 0.52, 0.16, 0.48, hair]);
    ext.push([-0.23, 0.47, -0.06, 0.08, 0.28, 0.38, hair]);
    ext.push([0.16, 0.54, 0.23, 0.16, 0.10, 0.08, hair]);
    ext.push([0, 0.29, -0.24, 0.52, 0.4, 0.10, hair]);
  } else if (hs === 'bob') {
    ext.push([0, 0.56, -0.01, 0.55, 0.18, 0.50, hair]);
    ext.push([-0.24, 0.38, -0.02, 0.08, 0.38, 0.46, hair]);
    ext.push([0.24, 0.38, -0.02, 0.08, 0.38, 0.46, hair]);
    ext.push([0, 0.25, -0.25, 0.50, 0.55, 0.10, hair]);
    ext.push([-0.16, 0.51, 0.23, 0.22, 0.09, 0.08, hair]);
  } else if (hs === 'ponytail') {
    ext.push([0, 0.58, -0.01, 0.53, 0.15, 0.48, hair]);
    ext.push([-0.23, 0.46, -0.04, 0.08, 0.28, 0.4, hair]);
    ext.push([0.2, 0.35, -0.31, 0.18, 0.5, 0.15, hair]);
    ext.push([0.23, 0.05, -0.36, 0.14, 0.26, 0.12, hair]);
  } else if (hs === 'highPony') {
    ext.push([0, 0.59, -0.04, 0.50, 0.13, 0.44, hair]);
    ext.push([-0.19, 0.65, -0.1, 0.16, 0.2, 0.18, hair]);
    ext.push([0.12, 0.72, -0.18, 0.13, 0.42, 0.12, hair]);
    ext.push([0.18, 0.97, -0.23, 0.12, 0.32, 0.1, hair]);
    ext.push([-0.23, 0.38, -0.03, 0.07, 0.25, 0.36, hair]);
  } else if (hs === 'bun') {
    ext.push([0, 0.57, -0.02, 0.52, 0.16, 0.46, hair]);
    ext.push([0, 0.8, -0.16, 0.27, 0.24, 0.27, hair]);
    ext.push([-0.23, 0.44, -0.02, 0.07, 0.28, 0.4, hair]);
    ext.push([0.20, 0.48, 0.23, 0.11, 0.22, 0.07, hair]);
  } else if (hs === 'short') {
    ext.push([0, 0.56, -0.01, 0.53, 0.16, 0.47, hair]);
    ext.push([-0.23, 0.45, -0.02, 0.07, 0.22, 0.4, hair]);
    ext.push([0.23, 0.45, -0.02, 0.07, 0.22, 0.4, hair]);
  } else if (hs === 'bald') {
    ext.push([-0.19, 0.48, 0.23, 0.16, 0.07, 0.03, look.skinShade]);
    ext.push([0.05, 0.50, 0.235, 0.09, 0.04, 0.02, look.skinShade]);
  } else if (hs === 'bunBeard') {
    ext.push([0, 0.58, -0.01, 0.53, 0.16, 0.47, hair]);
    ext.push([-0.23, 0.45, -0.02, 0.08, 0.28, 0.42, hair]);
    ext.push([0.23, 0.45, -0.02, 0.08, 0.28, 0.42, hair]);
    ext.push([0, 0.82, -0.13, 0.26, 0.23, 0.26, hair]);
    ext.push([0, 0.1, 0.26, 0.35, 0.27, 0.12, hair]);
    ext.push([0, -0.03, 0.22, 0.25, 0.18, 0.09, hair]);
  } else if (hs === 'long') {
    ext.push([0, 0.58, -0.02, 0.54, 0.16, 0.48, hair]);
    ext.push([-0.25, 0.32, -0.02, 0.1, 0.55, 0.46, hair]);
    ext.push([0.25, 0.32, -0.02, 0.1, 0.55, 0.46, hair]);
    ext.push([0, 0.1, -0.28, 0.5, 0.7, 0.11, hair]);
    ext.push([-0.18, 0.53, 0.23, 0.18, 0.08, 0.08, hair]);
  } else if (hs === 'longBeard') {
    ext.push([0, 0.6, -0.02, 0.55, 0.14, 0.5, hair]);
    ext.push([-0.25, 0.37, -0.03, 0.08, 0.4, 0.44, hair]);
    ext.push([0.25, 0.37, -0.03, 0.08, 0.4, 0.44, hair]);
    ext.push([0, 0.62, 0.22, 0.36, 0.08, 0.06, hair]);
    ext.push([0, 0.04, 0.255, 0.4, 0.4, 0.13, hair]);
    ext.push([0, -0.23, 0.22, 0.27, 0.25, 0.09, hair]);
  }
  if (look.extra === 'headband') {
    ext.push([0, 0.49, 0.23, 0.51, 0.055, 0.04, look.trim, true]);
    ext.push([0.21, 0.49, 0.18, 0.08, 0.075, 0.11, look.accent, true]);
  }
  if (look.extra === 'brim') {
    var brim = new THREE.Group();
    addPartBoxes(brim, [
      [0, 0.61, 0.0, 0.82, 0.075, 0.76, look.outfit2],
      [0, 0.69, 0.0, 0.45, 0.18, 0.4, look.outfit],
      [0, 0.61, 0.38, 0.63, 0.05, 0.03, look.trim],
      [0, 0.55, 0.27, 0.22, 0.08, 0.02, look.accent, true]
    ]);
    pivot.add(brim);
    pivot.userData.baseHatGroups.push(brim);
  }
  if (look.extra === 'glasses') {
    ext.push([-0.11, 0.34, 0.255, 0.16, 0.11, 0.035, '#26344b']);
    ext.push([0.11, 0.34, 0.255, 0.16, 0.11, 0.035, '#26344b']);
    ext.push([0, 0.34, 0.26, 0.09, 0.025, 0.02, look.trim]);
    ext.push([-0.11, 0.34, 0.266, 0.1, 0.055, 0.01, look.accent, true]);
    ext.push([0.11, 0.34, 0.266, 0.1, 0.055, 0.01, look.accent, true]);
  }
  if (look.extra === 'earring') {
    ext.push([0.26, 0.22, 0.05, 0.04, 0.12, 0.04, look.trim, true]);
  }
  if (look.extra === 'hood') {
    var hood = new THREE.Group();
    addPartBoxes(hood, [
      [0, 0.42, -0.07, 0.65, 0.35, 0.58, look.outfit],
      [-0.31, 0.34, 0.0, 0.09, 0.5, 0.45, look.outfit],
      [0.31, 0.34, 0.0, 0.09, 0.5, 0.45, look.outfit],
      [0, 0.62, -0.03, 0.56, 0.13, 0.52, look.outfit2],
      [0, 0.42, 0.21, 0.3, 0.26, 0.04, look.accent, true]
    ]);
    pivot.add(hood);
    pivot.userData.baseHatGroups.push(hood);
  }
  if (look.extra === 'cowl') {
    var cowl = new THREE.Group();
    addPartBoxes(cowl, [
      [0, 0.48, -0.06, 0.67, 0.3, 0.57, look.outfit],
      [-0.3, 0.35, 0.03, 0.11, 0.48, 0.43, look.outfit2],
      [0.3, 0.35, 0.03, 0.11, 0.48, 0.43, look.outfit2],
      [0, 0.66, -0.14, 0.32, 0.17, 0.2, look.outfit],
      [0, 0.48, 0.24, 0.24, 0.07, 0.04, look.trim, true]
    ]);
    pivot.add(cowl);
    pivot.userData.baseHatGroups.push(cowl);
  }
  if (look.extra === 'halo') {
    var haloMat = new THREE.MeshBasicMaterial({ color: color(look.trim) });
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.018, 4, 20), haloMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.77;
    pivot.add(ring);
  }
  /* Accesorios de identidad: no son color, son silueta. */
  if (id === 'ilan') {
    ext.push([-0.26, 0.49, 0.2, 0.16, 0.04, 0.02, look.trim, true]);
    ext.push([0.27, 0.27, 0.08, 0.03, 0.08, 0.03, look.trim]);
  } else if (id === 'mara') {
    ext.push([0.27, 0.79, 0.02, 0.055, 0.32, 0.03, '#e6c07a']);
    ext.push([0.28, 0.93, 0.01, 0.04, 0.18, 0.02, look.accent, true]);
    ext.push([0, 0.54, 0.255, 0.34, 0.075, 0.025, '#ddba70']);
  } else if (id === 'noa') {
    ext.push([0.24, 0.43, -0.05, 0.035, 0.28, 0.035, '#d9b65b']);
    ext.push([0.255, 0.57, -0.05, 0.065, 0.055, 0.045, look.accent, true]);
    ext.push([-0.21, 0.39, -0.2, 0.06, 0.16, 0.06, look.outfit2]);
  } else if (id === 'teo') {
    ext.push([0, 0.61, 0.18, 0.42, 0.035, 0.04, look.trim, true]);
    ext.push([0, 0.58, 0.22, 0.055, 0.055, 0.03, '#f2e8ff', true]);
    ext.push([0.25, 0.24, 0.08, 0.035, 0.09, 0.035, look.outfit2]);
  } else if (id === 'lia') {
    ext.push([0, 0.56, 0.235, 0.35, 0.035, 0.015, look.trim]);
    ext.push([-0.24, 0.46, 0.08, 0.04, 0.16, 0.06, look.outfit2]);
    ext.push([0.26, 0.21, 0.05, 0.045, 0.14, 0.045, look.trim, true]);
  } else if (id === 'kian') {
    ext.push([0, 0.51, 0.225, 0.43, 0.09, 0.055, '#8f9daa']);
    ext.push([0, 0.455, 0.257, 0.16, 0.11, 0.018, look.accent, true]);
    ext.push([-0.29, 0.38, 0.06, 0.06, 0.08, 0.06, look.trim]);
  } else if (id === 'amaru') {
    ext.push([-0.18, 0.51, 0.225, 0.105, 0.085, 0.04, '#19241e']);
    ext.push([0.18, 0.51, 0.225, 0.105, 0.085, 0.04, '#19241e']);
    ext.push([-0.18, 0.51, 0.248, 0.065, 0.055, 0.012, look.accent, true]);
    ext.push([0.18, 0.51, 0.248, 0.065, 0.055, 0.012, look.accent, true]);
    ext.push([0.32, 0.58, 0.02, 0.05, 0.22, 0.04, '#d6b774']);
  } else if (id === 'ona') {
    ext.push([-0.18, 0.35, 0.258, 0.17, 0.12, 0.025, '#121d31']);
    ext.push([-0.18, 0.35, 0.275, 0.1, 0.065, 0.014, look.accent, true]);
    ext.push([0.25, 0.38, 0.06, 0.045, 0.17, 0.055, look.trim]);
    ext.push([0, 0.78, 0.02, 0.05, 0.18, 0.05, look.trim]);
  } else if (id === 'iris') {
    ext.push([0, 0.59, 0.235, 0.4, 0.03, 0.018, look.trim, true]);
    ext.push([-0.26, 0.28, 0.08, 0.035, 0.22, 0.06, '#ddd2bd']);
    ext.push([0.26, 0.28, 0.08, 0.035, 0.22, 0.06, '#ddd2bd']);
    ext.push([0, 0.83, 0.02, 0.12, 0.035, 0.03, look.trim, true]);
  } else if (id === 'zenon') {
    ext.push([-0.12, 0.35, 0.25, 0.11, 0.09, 0.028, '#2a2013']);
    ext.push([-0.12, 0.35, 0.268, 0.07, 0.05, 0.012, look.accent, true]);
    ext.push([0.25, 0.24, 0.055, 0.04, 0.11, 0.04, '#d4b36a']);
    ext.push([0, 0.62, 0.18, 0.38, 0.03, 0.035, look.trim]);
  }
  if (ext.length) addPartBoxes(pivot, ext);
  return pivot;
}
function makeHairTail(id, look) {
  var g = new THREE.Group();
  if (id === 'mara') {
    g.position.set(0.02, 0.37, -0.28);
    addPartBoxes(g, [
      [0, -0.13, 0, 0.15, 0.25, 0.12, look.hair],
      [0.02, -0.38, -0.02, 0.12, 0.3, 0.1, look.hair],
      [0.04, -0.58, -0.03, 0.08, 0.18, 0.08, look.hair]
    ]);
    return g;
  }
  if (id === 'lia') {
    g.position.set(0.16, 0.83, -0.22);
    addPartBoxes(g, [
      [0, -0.18, 0, 0.14, 0.3, 0.13, look.hair],
      [0.03, -0.46, -0.02, 0.12, 0.32, 0.1, look.hair],
      [0.05, -0.73, -0.02, 0.09, 0.26, 0.08, look.hair],
      [0, -0.31, 0.075, 0.17, 0.07, 0.03, look.trim, true]
    ]);
    return g;
  }
  if (id === 'iris') {
    g.position.set(0, 0.57, -0.22);
    addPartBoxes(g, [
      [0, -0.18, 0, 0.46, 0.42, 0.14, look.hair],
      [-0.21, -0.48, 0.01, 0.13, 0.4, 0.1, look.hair],
      [0.21, -0.48, 0.01, 0.13, 0.4, 0.1, look.hair],
      [0, -0.72, 0, 0.34, 0.36, 0.1, look.hair],
      [0, -0.91, 0, 0.2, 0.22, 0.06, look.hair]
    ]);
    return g;
  }
  if (id === 'zenon') {
    g.position.set(0, 0.12, 0.26);
    addPartBoxes(g, [
      [0, -0.16, 0, 0.28, 0.3, 0.1, look.hair],
      [0, -0.38, -0.02, 0.19, 0.24, 0.08, look.hair],
      [0, -0.54, -0.025, 0.1, 0.14, 0.06, look.hair]
    ]);
    return g;
  }
  if (id === 'teo') {
    g.position.set(0, 0.12, 0.25);
    addPartBoxes(g, [
      [0, -0.12, 0, 0.2, 0.18, 0.07, look.hair],
      [0, -0.24, -0.01, 0.12, 0.12, 0.05, look.hair]
    ]);
    return g;
  }
  return null;
}
function makeCapeGroup(id, look) {
  var g = new THREE.Group();
  if (id === 'ilan') {
    g.position.set(0, 1.58, -0.26);
    addPartBoxes(g, [
      [-0.22, -0.42, 0, 0.32, 0.76, 0.075, look.outfit2],
      [-0.22, -0.8, 0.005, 0.28, 0.08, 0.065, look.trim],
      [0.2, -0.27, 0, 0.27, 0.5, 0.065, look.outfit],
      [0.2, -0.52, 0.005, 0.24, 0.06, 0.055, look.trim]
    ]);
    return g;
  }
  if (id === 'noa') {
    g.position.set(0, 1.52, -0.25);
    addPartBoxes(g, [
      [-0.18, -0.46, 0, 0.28, 0.88, 0.065, look.outfit],
      [0.18, -0.46, 0, 0.28, 0.88, 0.065, look.outfit],
      [-0.18, -0.91, 0, 0.26, 0.06, 0.055, look.outfit2],
      [0.18, -0.91, 0, 0.26, 0.06, 0.055, look.outfit2],
      [0.18, -0.52, 0.04, 0.13, 0.12, 0.03, look.trim]
    ]);
    return g;
  }
  if (id === 'lia') {
    g.position.set(-0.15, 1.56, -0.24);
    addPartBoxes(g, [
      [0, -0.28, 0, 0.24, 0.48, 0.065, look.outfit2],
      [0.07, -0.58, 0.005, 0.16, 0.3, 0.055, look.trim],
      [0.1, -0.74, 0.005, 0.09, 0.16, 0.04, look.accent, true]
    ]);
    return g;
  }
  if (id === 'kian') {
    g.position.set(0, 1.6, -0.28);
    addPartBoxes(g, [
      [0, -0.28, 0, 0.98, 0.56, 0.08, look.outfit2],
      [0, -0.55, 0, 0.9, 0.06, 0.065, look.trim],
      [-0.52, -0.16, 0.02, 0.1, 0.3, 0.12, look.outfit]
    ]);
    return g;
  }
  if (id === 'amaru') {
    g.position.set(0, 1.54, -0.27);
    addPartBoxes(g, [
      [0, -0.42, 0, 0.94, 0.88, 0.07, look.outfit2],
      [-0.42, -0.34, 0.01, 0.12, 0.6, 0.075, look.outfit],
      [0.42, -0.34, 0.01, 0.12, 0.6, 0.075, look.outfit],
      [0, -0.72, 0.01, 0.68, 0.07, 0.06, look.trim],
      [0, -0.5, 0.045, 0.2, 0.08, 0.03, look.trim, true]
    ]);
    return g;
  }
  if (id === 'ona') {
    g.position.set(0, 1.6, -0.26);
    addPartBoxes(g, [
      [-0.2, -0.46, 0, 0.3, 0.92, 0.07, look.outfit2],
      [0.2, -0.46, 0, 0.3, 0.92, 0.07, look.outfit2],
      [-0.2, -0.91, 0.005, 0.26, 0.06, 0.06, look.trim],
      [0.2, -0.91, 0.005, 0.26, 0.06, 0.06, look.trim],
      [0.34, -0.3, 0.02, 0.12, 0.08, 0.03, look.accent, true]
    ]);
    return g;
  }
  if (id === 'iris') {
    g.position.set(0, 1.6, -0.28);
    addPartBoxes(g, [
      [-0.32, -0.58, 0, 0.34, 1.02, 0.075, look.outfit],
      [0.32, -0.58, 0, 0.34, 1.02, 0.075, look.outfit],
      [0, -0.82, 0.01, 0.32, 0.56, 0.075, look.outfit2],
      [-0.32, -1.08, 0.005, 0.3, 0.06, 0.06, look.trim],
      [0.32, -1.08, 0.005, 0.3, 0.06, 0.06, look.trim],
      [0, -1.12, 0.005, 0.28, 0.04, 0.05, look.accent, true]
    ]);
    return g;
  }
  if (id === 'zenon') {
    g.position.set(0, 1.6, -0.28);
    addPartBoxes(g, [
      [0, -0.52, 0, 1.0, 0.92, 0.075, look.outfit],
      [0, -0.48, 0.02, 0.86, 0.1, 0.07, look.outfit2],
      [-0.4, -0.8, 0.01, 0.22, 0.4, 0.065, look.outfit2],
      [0.4, -0.8, 0.01, 0.22, 0.4, 0.065, look.outfit2],
      [0, -0.97, 0.005, 0.72, 0.055, 0.06, look.trim]
    ]);
    return g;
  }
  if (id === 'mara') {
    g.position.set(0, 1.56, -0.27);
    addPartBoxes(g, [
      [0, -0.42, 0, 0.88, 0.62, 0.075, look.outfit2],
      [0, -0.62, 0.005, 0.92, 0.06, 0.06, look.trim],
      [0, -0.36, 0.04, 0.3, 0.08, 0.03, look.accent, true]
    ]);
    return g;
  }
  return null;
}
function makeIdentityDetails(id, look, torso, body, head) {
  var t = [], b = [];
  var out = { cape: null, hairTail: null, floaters: null };
  if (id === 'ilan') {
    t.push([0, 0.72, 0.01, 0.48, 0.18, 0.33, look.outfit2]);
    t.push([0, 0.79, 0.17, 0.18, 0.14, 0.04, look.trim]);
    t.push([-0.22, 0.42, 0.215, 0.16, 0.2, 0.02, look.outfit2]);
    t.push([0.24, 0.36, 0.214, 0.1, 0.12, 0.02, look.trim]);
    b.push([0.34, 0.88, 0.05, 0.24, 0.2, 0.16, '#6a5135']);
  } else if (id === 'mara') {
    t.push([0, 0.71, 0.02, 0.66, 0.16, 0.42, '#d8b76f']);
    t.push([0.2, 0.59, 0.22, 0.12, 0.23, 0.03, '#d8b76f']);
    t.push([0, 0.18, 0, 0.78, 0.1, 0.46, '#5e4431']);
    t.push([-0.24, 0.18, 0.23, 0.13, 0.09, 0.03, look.trim]);
    b.push([0, 1.26, -0.34, 0.5, 0.56, 0.23, '#5b402c']);
    b.push([0, 1.47, -0.46, 0.44, 0.15, 0.12, '#d2b276']);
    b.push([0, 1.62, -0.37, 0.88, 0.14, 0.14, '#c7a66c']);
    b.push([-0.44, 1.62, -0.37, 0.07, 0.16, 0.16, '#7a613d']);
    b.push([0.44, 1.62, -0.37, 0.07, 0.16, 0.16, '#7a613d']);
    b.push([-0.3, 0.93, 0.13, 0.2, 0.22, 0.17, '#72563a']);
  } else if (id === 'noa') {
    t.push([0, 0.74, 0.01, 0.42, 0.2, 0.3, look.outfit]);
    t.push([0, 0.78, 0.16, 0.16, 0.12, 0.03, look.outfit2]);
    t.push([0.22, 0.38, 0.212, 0.14, 0.13, 0.026, look.outfit2]);
    t.push([0.22, 0.42, 0.227, 0.09, 0.025, 0.012, look.trim, true]);
    t.push([-0.2, 0.5, 0.215, 0.07, 0.32, 0.02, '#c4ced9']);
    b.push([0.27, 0.93, -0.31, 0.12, 0.55, 0.12, '#7b8faf']);
    b.push([0.32, 0.78, 0.03, 0.24, 0.1, 0.18, '#7b8faf']);
  } else if (id === 'teo') {
    t.push([0, 0.63, 0, 1.02, 0.24, 0.48, look.outfit2]);
    t.push([0, 0.66, 0.25, 0.32, 0.05, 0.03, look.trim, true]);
    t.push([-0.24, 0.31, 0.215, 0.07, 0.07, 0.025, '#d2c7e2']);
    t.push([0.22, 0.31, 0.215, 0.07, 0.07, 0.025, '#d2c7e2']);
    t.push([0, 0.21, 0.22, 0.06, 0.06, 0.025, look.accent, true]);
    b.push([-0.38, 0.82, 0.03, 0.16, 0.26, 0.21, '#6b547e']);
    b.push([0.38, 0.82, 0.03, 0.16, 0.26, 0.21, '#6b547e']);
    b.push([0.3, 1.04, 0.02, 0.22, 0.18, 0.12, '#8e693a']);
  } else if (id === 'lia') {
    t.push([-0.34, 0.56, 0, 0.32, 0.15, 0.36, look.outfit2]);
    t.push([-0.37, 0.5, 0.03, 0.26, 0.06, 0.28, look.trim]);
    t.push([0.22, 0.24, 0.215, 0.15, 0.09, 0.02, look.trim]);
    t.push([0, 0.73, 0.18, 0.18, 0.04, 0.025, look.accent, true]);
    b.push([0.3, 0.94, 0.08, 0.2, 0.18, 0.15, '#4a2432']);
    b.push([0.32, 0.82, -0.18, 0.13, 0.4, 0.08, look.outfit2]);
  } else if (id === 'kian') {
    t.push([-0.42, 0.6, 0, 0.3, 0.2, 0.38, look.outfit2]);
    t.push([0.42, 0.6, 0, 0.3, 0.2, 0.38, look.outfit2]);
    t.push([0, 0.39, 0.226, 0.68, 0.44, 0.075, look.outfit2]);
    t.push([0, 0.42, 0.27, 0.16, 0.16, 0.026, look.accent, true]);
    t.push([0, 0.18, 0, 0.84, 0.13, 0.48, '#1d262f']);
    b.push([-0.4, 0.42, 0.02, 0.2, 0.33, 0.23, '#303d49']);
    b.push([0.4, 0.42, 0.02, 0.2, 0.33, 0.23, '#303d49']);
  } else if (id === 'amaru') {
    t.push([0, 0.68, 0.02, 0.64, 0.15, 0.41, look.outfit2]);
    t.push([0, 0.37, 0.22, 0.38, 0.04, 0.02, look.trim]);
    t.push([0.22, 0.36, 0.217, 0.09, 0.09, 0.02, look.accent, true]);
    b.push([0.3, 0.92, 0.04, 0.22, 0.22, 0.15, '#654d32']);
    b.push([0.3, 0.78, -0.18, 0.12, 0.3, 0.1, '#70553a']);
    b.push([-0.34, 0.78, -0.12, 0.13, 0.25, 0.12, '#d2b174']);
  } else if (id === 'ona') {
    t.push([-0.36, 0.64, 0, 0.16, 0.22, 0.33, look.trim]);
    t.push([0.36, 0.64, 0, 0.16, 0.22, 0.33, look.trim]);
    t.push([0, 0.72, 0, 0.7, 0.08, 0.44, look.outfit]);
    t.push([-0.24, 0.32, 0.22, 0.24, 0.12, 0.025, look.outfit2]);
    t.push([0.06, 0.32, 0.235, 0.11, 0.04, 0.012, look.accent, true]);
    b.push([0, 1.24, -0.32, 0.52, 0.16, 0.18, look.outfit2]);
    b.push([-0.17, 1.27, -0.43, 0.45, 0.08, 0.08, '#8db7ff', true]);
    b.push([0, 1.05, -0.31, 0.12, 0.3, 0.12, look.trim]);
    var holo = new THREE.Group();
    holo.position.set(0.48, 1.58, 0.08);
    addPartBoxes(holo, [
      [0, 0.2, 0, 0.26, 0.18, 0.015, look.accent, true],
      [0, 0.2, 0.015, 0.2, 0.12, 0.008, '#d9ecff', true],
      [0, -0.05, 0, 0.18, 0.14, 0.012, '#8db7ff', true],
      [0, -0.22, 0, 0.25, 0.1, 0.012, look.trim, true]
    ]);
    out.floaters = holo;
  } else if (id === 'iris') {
    t.push([0, 0.64, 0.02, 0.88, 0.2, 0.46, look.outfit2]);
    t.push([0, 0.67, 0.25, 0.32, 0.05, 0.03, look.trim, true]);
    t.push([0, 0.28, 0.216, 0.26, 0.3, 0.022, look.outfit2]);
    t.push([0, 0.29, 0.228, 0.12, 0.12, 0.012, look.accent, true]);
    b.push([-0.37, 0.95, 0.02, 0.15, 0.25, 0.2, '#5c4779']);
    b.push([0.37, 0.95, 0.02, 0.15, 0.25, 0.2, '#5c4779']);
    b.push([0, 0.42, -0.22, 0.18, 0.18, 0.14, '#e7d6b4']);
  } else if (id === 'zenon') {
    t.push([0, 0.64, 0, 1.03, 0.3, 0.49, look.outfit2]);
    t.push([0, 0.58, 0.24, 0.38, 0.07, 0.03, look.trim, true]);
    t.push([-0.27, 0.29, 0.22, 0.08, 0.1, 0.03, '#d4b36a']);
    t.push([0.26, 0.29, 0.22, 0.08, 0.1, 0.03, '#d4b36a']);
    b.push([0, 1.08, -0.34, 0.62, 0.24, 0.16, '#4b3520']);
    b.push([-0.18, 1.35, -0.42, 0.12, 0.38, 0.12, '#d0b173']);
    b.push([0.18, 1.35, -0.42, 0.12, 0.38, 0.12, '#d0b173']);
    var pages = new THREE.Group();
    pages.position.set(-0.48, 1.72, 0.02);
    addPartBoxes(pages, [
      [0, 0, 0, 0.3, 0.39, 0.025, '#e9dfc5', true],
      [-0.05, -0.24, 0.02, 0.2, 0.1, 0.02, look.trim, true],
      [0.3, -0.12, 0.02, 0.16, 0.22, 0.02, look.accent, true]
    ]);
    out.floaters = pages;
  }
  if (t.length) addPartBoxes(torso, t);
  if (b.length) addPartBoxes(body, b);
  var cape = makeCapeGroup(id, look);
  if (cape) {
    body.add(cape);
    out.cape = cape;
  }
  var tail = makeHairTail(id, look);
  if (tail) {
    head.add(tail);
    out.hairTail = tail;
  }
  if (out.floaters) {
    out.floaters.userData.baseY = out.floaters.position.y;
    body.add(out.floaters);
  }
  return out;
}
function makeArm(look, side, id) {
  var pivot = new THREE.Group();
  var bulk = look.style === 'armor' ? 1.22 : (look.style === 'robe' || look.style === 'cloak' || look.style === 'archivist' ? 1.06 : 1);
  pivot.position.set(side * 0.47 * look.body.shoulder, 1.53, 0);
  var sleeve = look.style === 'robe' || look.style === 'cloak' || look.style === 'archivist' ? look.outfit2 : look.outfit;
  var boxes = [
    [0, -0.26, 0, 0.2 * bulk, 0.53, 0.22 * bulk, sleeve],
    [0, -0.56, 0.02, 0.19 * bulk, 0.19, 0.21 * bulk, look.outfit],
    [0, -0.72, 0.055, 0.19, 0.17, 0.23, look.skin]
  ];
  if (id === 'teo' || id === 'iris' || id === 'zenon') {
    boxes.push([0, -0.4, 0.03, 0.23 * bulk, 0.26, 0.25 * bulk, sleeve]);
    boxes.push([0, -0.61, 0.04, 0.22, 0.06, 0.225, look.trim]);
  }
  if (id === 'kian') {
    boxes.push([side * 0.07, -0.02, 0, 0.38, 0.2, 0.35, look.outfit2]);
    boxes.push([side * 0.1, -0.09, 0.03, 0.32, 0.07, 0.3, look.trim]);
    boxes.push([0, -0.6, 0.03, 0.25, 0.19, 0.27, '#667382']);
    boxes.push([0, -0.72, 0.06, 0.26, 0.18, 0.26, '#4b5866']);
  } else if (id === 'lia') {
    boxes.push([side * 0.02, -0.01, 0, 0.29, 0.15, 0.28, look.outfit2]);
    boxes.push([0, -0.73, 0.065, 0.2, 0.18, 0.24, '#41232e']);
    boxes.push([0, -0.6, 0.04, 0.21, 0.04, 0.23, look.trim]);
  } else if (id === 'noa') {
    boxes.push([0, -0.72, 0.065, 0.2, 0.18, 0.24, look.outfit2]);
    boxes.push([0, -0.58, 0.04, 0.21, 0.035, 0.23, look.trim]);
  } else if (id === 'amaru') {
    boxes.push([0, -0.58, 0.04, 0.23, 0.05, 0.24, look.trim]);
  } else if (id === 'ona') {
    boxes.push([0, -0.72, 0.065, 0.2, 0.18, 0.24, '#1c2c4b']);
    boxes.push([0, -0.58, 0.04, 0.21, 0.035, 0.23, look.accent, true]);
  } else if (id === 'iris' || id === 'zenon') {
    boxes.push([0, -0.72, 0.065, 0.21, 0.18, 0.24, look.outfit]);
  } else if (id === 'ilan') {
    boxes.push([0, -0.72, 0.065, 0.2, 0.18, 0.24, '#253b5d']);
    boxes.push([0, -0.58, 0.04, 0.21, 0.035, 0.23, look.trim]);
  }
  addPartBoxes(pivot, boxes);
  return pivot;
}
function makeLeg(look, side, id) {
  var pivot = new THREE.Group();
  pivot.position.set(side * 0.19, 0.93, 0);
  var legBulk = look.style === 'armor' ? 1.15 : 1;
  var boxes = [
    [0, -0.25, 0, 0.25 * legBulk, 0.5, 0.27 * legBulk, look.leg],
    [0, -0.59, 0.015, 0.23 * legBulk, 0.22, 0.26 * legBulk, look.outfit],
    [0, -0.82, 0.06, 0.28, 0.17, 0.37, '#171c26'],
    [0, -0.79, 0.16, 0.24, 0.06, 0.22, look.trim]
  ];
  if (id === 'kian') {
    boxes.push([0, -0.39, 0.04, 0.3, 0.15, 0.3, '#667382']);
    boxes.push([0, -0.86, 0.07, 0.31, 0.2, 0.42, '#343e49']);
    boxes.push([0, -0.73, 0.08, 0.29, 0.04, 0.38, look.trim]);
  } else if (id === 'ona' || id === 'noa') {
    boxes.push([0, -0.69, 0.07, 0.27, 0.42, 0.33, id === 'noa' ? '#e3e7ec' : '#1f2c48']);
    boxes.push([0, -0.59, 0.04, 0.25, 0.035, 0.28, look.trim]);
  } else if (id === 'mara' || id === 'amaru') {
    boxes.push([0, -0.12, 0.06, 0.27, 0.15, 0.29, look.outfit2]);
    boxes.push([0, -0.57, 0.03, 0.25, 0.04, 0.27, look.trim]);
  } else if (id === 'iris' || id === 'zenon') {
    boxes.push([0, -0.34, 0.02, 0.27, 0.36, 0.3, look.outfit]);
    boxes.push([0, -0.17, 0.02, 0.27, 0.04, 0.3, look.trim]);
  } else if (id === 'lia') {
    boxes.push([0, -0.49, 0.03, 0.26, 0.24, 0.28, look.outfit2]);
    boxes.push([0, -0.56, 0.04, 0.255, 0.035, 0.27, look.trim]);
  }
  addPartBoxes(pivot, boxes);
  return pivot;
}

function buildWeapon(prop, look) {
  var g = new THREE.Group();
  var accent = look.accent;
  var wood = '#6f5135';
  var brass = '#d9b674';
  var dark = '#2b2c35';
  var boxes = [];
  if (prop === 'compass') {
    boxes = [
      [0, 0.03, 0, 0.07, 0.25, 0.07, dark],
      [0, 0.26, 0, 0.38, 0.38, 0.08, brass],
      [0, 0.26, 0.047, 0.24, 0.24, 0.012, '#0e1826'],
      [0, 0.26, 0.058, 0.04, 0.2, 0.018, accent, true],
      [-0.1, 0.26, 0.06, 0.09, 0.04, 0.016, '#f3dfb0', true],
      [0.1, 0.26, 0.06, 0.09, 0.04, 0.016, '#f3dfb0', true]
    ];
  } else if (prop === 'mapStaff') {
    boxes = [
      [0, 0.55, 0, 0.065, 1.9, 0.065, wood],
      [0, 1.48, 0, 0.41, 0.12, 0.12, brass],
      [0, 1.12, 0, 0.32, 0.62, 0.09, '#cfb27b'],
      [0, 1.12, 0.052, 0.24, 0.48, 0.012, look.outfit2],
      [0.14, 1.54, 0, 0.06, 0.16, 0.06, accent, true]
    ];
  } else if (prop === 'lens') {
    boxes = [
      [0, -0.15, 0, 0.055, 0.34, 0.055, dark],
      [0, 0.24, 0, 0.06, 0.18, 0.06, brass],
      [0, 0.47, 0, 0.42, 0.06, 0.06, brass],
      [0, 0.24, 0.12, 0.46, 0.46, 0.05, accent, true],
      [0, 0.24, 0.15, 0.3, 0.3, 0.02, '#d8f6ff', true]
    ];
  } else if (prop === 'bookStaff') {
    boxes = [
      [0, 0.4, 0, 0.065, 1.55, 0.065, wood],
      [0, 1.13, 0, 0.28, 0.06, 0.06, brass],
      [0, 1.32, 0, 0.36, 0.32, 0.12, look.outfit2],
      [0, 1.32, 0.07, 0.28, 0.24, 0.03, look.trim],
      [-0.14, 1.32, 0.085, 0.03, 0.24, 0.02, brass],
      [0.14, 1.32, 0.085, 0.03, 0.24, 0.02, brass],
      [0, 1.05, 0, 0.2, 0.14, 0.08, '#c6b8dc', true]
    ];
  } else if (prop === 'watch') {
    boxes = [
      [0, 0.2, 0, 0.31, 0.31, 0.11, brass],
      [0, 0.2, 0.064, 0.24, 0.24, 0.025, '#f0e2b8'],
      [0, 0.2, 0.078, 0.19, 0.19, 0.012, '#d8c89f'],
      [0, 0.27, 0.086, 0.017, 0.08, 0.014, '#4b3820'],
      [0.08, 0.19, 0.086, 0.06, 0.015, 0.014, '#4b3820'],
      [0, 0.39, 0, 0.06, 0.1, 0.05, brass],
      [0, -0.02, 0, 0.06, 0.16, 0.045, accent, true],
      [-0.08, -0.13, 0, 0.08, 0.08, 0.055, '#e8c57a'],
      [0.06, -0.22, 0, 0.1, 0.06, 0.045, accent, true],
      [0.2, -0.08, 0, 0.06, 0.2, 0.035, look.trim, true]
    ];
  } else if (prop === 'hammer') {
    boxes = [
      [0, 0.28, 0, 0.08, 1.05, 0.08, wood],
      [0, 0.83, 0, 0.52, 0.38, 0.35, look.outfit2],
      [0, 0.83, 0.18, 0.34, 0.24, 0.035, look.trim],
      [0, 0.83, -0.18, 0.34, 0.24, 0.035, look.trim],
      [0, 0.38, 0, 0.2, 0.08, 0.1, brass],
      [0, 0.9, 0.2, 0.12, 0.12, 0.02, accent, true]
    ];
  } else if (prop === 'lantern') {
    boxes = [
      [0, 0.18, 0, 0.055, 1.05, 0.055, wood],
      [0, 0.72, 0, 0.35, 0.06, 0.35, brass],
      [0, 0.48, 0, 0.28, 0.3, 0.28, '#6b5130'],
      [0, 0.48, 0, 0.19, 0.23, 0.19, accent, true],
      [0, 0.28, 0, 0.36, 0.06, 0.36, brass],
      [0, 0.9, 0, 0.12, 0.3, 0.12, brass],
      [0, 1.03, 0.055, 0.15, 0.04, 0.03, accent, true]
    ];
  } else if (prop === 'compassTool') {
    boxes = [
      [0, 0.2, 0, 0.06, 0.8, 0.06, brass],
      [-0.09, 0.0, 0, 0.06, 0.42, 0.06, look.outfit2],
      [0.2, 0.0, 0, 0.06, 0.42, 0.06, look.outfit2],
      [-0.22, -0.2, 0, 0.15, 0.05, 0.07, look.trim],
      [0.22, -0.2, 0, 0.15, 0.05, 0.07, look.trim],
      [0, 0.62, 0, 0.44, 0.05, 0.05, accent, true],
      [0, 0.52, 0, 0.05, 0.23, 0.05, look.trim],
      [0.2, 0.35, 0, 0.22, 0.19, 0.025, accent, true],
      [0.2, 0.35, 0.018, 0.14, 0.12, 0.012, '#e1eeff', true]
    ];
  } else if (prop === 'farol') {
    boxes = [
      [0, 0.42, 0, 0.06, 1.52, 0.06, brass],
      [-0.2, 0.98, 0, 0.06, 0.32, 0.06, brass],
      [0.2, 0.98, 0, 0.06, 0.32, 0.06, brass],
      [0, 1.0, 0, 0.3, 0.4, 0.3, '#e7d6b4'],
      [0, 1.0, 0.02, 0.23, 0.31, 0.26, accent, true],
      [0, 1.23, 0, 0.4, 0.06, 0.4, brass],
      [0, 1.32, 0, 0.12, 0.14, 0.12, brass],
      [0, 0.45, 0, 0.18, 0.08, 0.18, look.trim, true]
    ];
  } else {
    boxes = [
      [0, 0.35, 0, 0.065, 1.7, 0.065, wood],
      [0, 1.1, 0, 0.3, 0.08, 0.3, brass],
      [0, 1.28, 0, 0.36, 0.36, 0.08, brass],
      [0, 1.28, 0.06, 0.24, 0.24, 0.03, '#121b2a'],
      [0, 1.28, 0.076, 0.15, 0.15, 0.02, accent, true],
      [0, 1.43, 0.02, 0.12, 0.12, 0.08, look.trim, true],
      [0, 0.32, 0, 0.16, 0.05, 0.16, look.trim]
    ];
  }
  addPartBoxes(g, boxes);
  if (prop === 'farol' || prop === 'lantern') {
    var gl = makeGlowSprite(accent, 1.6, 0.55);
    gl.position.set(0, prop === 'farol' ? 1.0 : 0.48, 0);
    g.add(gl);
  }
  if (prop === 'archiveStaff' || prop === 'bookStaff') {
    var gl2 = makeGlowSprite(accent, 0.8, 0.5);
    gl2.position.set(0, 1.3, 0);
    g.add(gl2);
  }
  return g;
}

function buildHeroAvatar(id) {
  var look = heroLook(id);
  var root = new THREE.Group();
  var body = new THREE.Group();
  root.add(body);
  var leftLeg = makeLeg(look, -1, id);
  var rightLeg = makeLeg(look, 1, id);
  body.add(leftLeg, rightLeg);
  var torsoBoxes = [
    [0, 0.33, 0, 0.72, 0.66, 0.39, look.outfit],
    [0, 0.58, 0, 0.58, 0.18, 0.34, look.outfit2],
    [0, 0.20, 0.205, 0.38, 0.36, 0.025, look.outfit2],
    [0, 0.16, 0, 0.74, 0.13, 0.42, '#202738'],
    [0, 0.16, 0.215, 0.17, 0.08, 0.03, look.trim],
    [0.17, 0.71, 0, 0.16, 0.10, 0.35, look.trim],
    [-0.17, 0.71, 0, 0.16, 0.10, 0.35, look.trim],
    [0, 0.69, -0.16, 0.46, 0.08, 0.16, look.accent, true]
  ];
  if (look.style === 'coat') {
    torsoBoxes.push([-0.2, -0.02, -0.2, 0.3, 0.5, 0.1, look.outfit2]);
    torsoBoxes.push([0.2, -0.02, -0.2, 0.3, 0.5, 0.1, look.outfit2]);
    torsoBoxes.push([0, 0.25, 0, 0.6, 0.1, 0.43, look.trim]);
    torsoBoxes.push([-0.37, 0.07, 0, 0.07, 0.34, 0.36, look.outfit2]);
    torsoBoxes.push([0.37, 0.07, 0, 0.07, 0.34, 0.36, look.outfit2]);
  } else if (look.style === 'poncho') {
    torsoBoxes.push([0, 0.32, 0, 0.88, 0.6, 0.47, look.outfit2]);
    torsoBoxes.push([0, 0.48, 0.02, 0.94, 0.12, 0.49, look.trim]);
    torsoBoxes.push([-0.26, 0.03, -0.24, 0.3, 0.38, 0.1, look.outfit2]);
    torsoBoxes.push([0.26, 0.03, -0.24, 0.3, 0.38, 0.1, look.outfit2]);
    torsoBoxes.push([0, 0.3, 0.24, 0.24, 0.2, 0.025, look.accent, true]);
  } else if (look.style === 'robe') {
    torsoBoxes.push([0, -0.02, 0, 0.68, 0.52, 0.43, look.outfit]);
    torsoBoxes.push([0, 0.24, 0, 0.8, 0.1, 0.45, look.trim]);
    torsoBoxes.push([0, 0.44, 0.2, 0.16, 0.2, 0.02, look.accent, true]);
    torsoBoxes.push([-0.34, 0.15, 0, 0.08, 0.34, 0.36, look.outfit2]);
    torsoBoxes.push([0.34, 0.15, 0, 0.08, 0.34, 0.36, look.outfit2]);
  } else if (look.style === 'jacket') {
    torsoBoxes.push([-0.22, 0.52, 0.21, 0.2, 0.18, 0.02, look.trim]);
    torsoBoxes.push([0.22, 0.52, 0.21, 0.2, 0.18, 0.02, look.trim]);
    torsoBoxes.push([0, 0.39, 0.215, 0.13, 0.27, 0.025, look.outfit2]);
    torsoBoxes.push([-0.22, 0.03, -0.21, 0.26, 0.42, 0.08, look.outfit2]);
    torsoBoxes.push([0.22, 0.03, -0.21, 0.26, 0.42, 0.08, look.outfit2]);
    torsoBoxes.push([0, 0.71, 0.22, 0.18, 0.05, 0.02, look.accent, true]);
  } else if (look.style === 'armor') {
    torsoBoxes.push([0, 0.37, 0.22, 0.62, 0.4, 0.08, look.outfit2]);
    torsoBoxes.push([0, 0.5, 0.27, 0.17, 0.17, 0.02, look.accent, true]);
    torsoBoxes.push([-0.4, 0.56, 0, 0.23, 0.17, 0.34, look.outfit2]);
    torsoBoxes.push([0.4, 0.56, 0, 0.23, 0.17, 0.34, look.outfit2]);
    torsoBoxes.push([0, 0.11, 0, 0.8, 0.12, 0.49, look.leg]);
    torsoBoxes.push([0, 0.74, 0, 0.74, 0.08, 0.45, look.trim]);
  } else if (look.style === 'cloak') {
    torsoBoxes.push([0, 0.23, -0.28, 0.78, 1.0, 0.1, look.outfit2]);
    torsoBoxes.push([-0.36, 0.42, -0.19, 0.25, 0.64, 0.11, look.outfit]);
    torsoBoxes.push([0.36, 0.42, -0.19, 0.25, 0.64, 0.11, look.outfit]);
    torsoBoxes.push([0, 0.63, 0.21, 0.34, 0.07, 0.02, look.trim]);
    torsoBoxes.push([0, 0.35, 0.205, 0.16, 0.34, 0.02, look.accent, true]);
  } else if (look.style === 'architect') {
    torsoBoxes.push([0, 0.34, 0, 0.8, 0.64, 0.44, look.outfit2]);
    torsoBoxes.push([0, 0.56, 0, 0.8, 0.12, 0.45, look.outfit]);
    torsoBoxes.push([-0.37, 0.68, 0, 0.13, 0.22, 0.35, look.trim]);
    torsoBoxes.push([0.37, 0.68, 0, 0.13, 0.22, 0.35, look.trim]);
    torsoBoxes.push([0, 0.28, 0.23, 0.24, 0.1, 0.02, look.accent, true]);
    torsoBoxes.push([0, 0.08, 0, 0.7, 0.18, 0.42, look.outfit]);
  } else if (look.style === 'archivist') {
    torsoBoxes.push([0, 0.31, 0, 0.78, 0.68, 0.43, look.outfit]);
    torsoBoxes.push([0, 0.34, 0.24, 0.64, 0.38, 0.05, '#4b3520']);
    torsoBoxes.push([0, 0.56, 0.26, 0.17, 0.2, 0.02, look.trim, true]);
    torsoBoxes.push([0, 0.05, -0.22, 0.74, 0.48, 0.1, look.outfit2]);
    torsoBoxes.push([0, 0.26, 0, 0.8, 0.08, 0.44, look.trim]);
    torsoBoxes.push([-0.38, 0.58, 0, 0.15, 0.12, 0.36, look.leg]);
    torsoBoxes.push([0.38, 0.58, 0, 0.15, 0.12, 0.36, look.leg]);
  } else {
    torsoBoxes.push([0, 0.16, 0, 0.76, 0.12, 0.42, look.trim]);
  }
  var torso = new THREE.Group();
  torso.position.y = 1.0;
  addPartBoxes(torso, torsoBoxes);
  body.add(torso);
  var head = makeHead(look, id);
  head.scale.setScalar(look.body.head || 1);
  body.add(head);
  var leftArm = makeArm(look, -1, id);
  var rightArm = makeArm(look, 1, id);
  body.add(leftArm, rightArm);
  var identity = makeIdentityDetails(id, look, torso, body, head);
  var weapon = buildWeapon(look.prop, look);
  weapon.position.set(0, -0.72, 0.08);
  weapon.rotation.set(0.02, 0, -0.055);
  rightArm.add(weapon);
  if (look.extra === 'halo') {
    var orb = makeGlowSprite(look.accent, 0.75, 0.42);
    orb.position.set(0, 2.5, 0);
    body.add(orb);
  }
  root.scale.set(look.body.w || 1, look.body.h || 1, look.body.w || 1);
  var avatar = {
    id: id,
    look: look,
    root: root,
    body: body,
    torso: torso,
    head: head,
    leftArm: leftArm,
    rightArm: rightArm,
    leftLeg: leftLeg,
    rightLeg: rightLeg,
    weapon: weapon,
    cape: identity.cape,
    hairTail: identity.hairTail,
    floaters: identity.floaters,
    attackTimer: 0,
    hurtTimer: 0,
    celebrateTimer: 0,
    attackStyle: (look.anim && look.anim.attack) || 'slash',
    idleT: rng() * 10,
    facing: Math.PI,
    currentMotion: 0,
    stateTag: 'idle'
  };
  root.userData.avatar = avatar;
  return avatar;
}

function disposeObject(obj) {
  if (!obj) return;
  obj.traverse(function (node) {
    if (node.geometry) node.geometry.dispose();
    if (node.material) {
      if (Array.isArray(node.material)) node.material.forEach(function (m) { m.dispose(); });
      else node.material.dispose();
    }
  });
  if (obj.parent) obj.parent.remove(obj);
}

/* -------------------------------------------------------------------------
   Guardián de ruta
   ------------------------------------------------------------------------- */
var GUARDIAN_DATA = {
  'area-psi-salud-publica': { name: 'Custodio del Territorio', type: 'tree', height: 3.5, color: '#69D3C1' },
  'area-psi-cuidado-integral': { name: 'Custodio del Cuidado', type: 'heart', height: 3.4, color: '#7AA2FF' },
  'area-psi-etica': { name: 'Custodio de la Confianza', type: 'mirror', height: 3.5, color: '#C49BFF' },
  'area-psi-investigacion': { name: 'Custodio de la Evidencia', type: 'prism', height: 3.3, color: '#B8D46A' },
  'area-psi-gestion': { name: 'Custodio del Sistema', type: 'tower', height: 3.6, color: '#F3B562' }
};
function makeWardShield(hex, radius) {
  var mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius || 1.7, 1),
    new THREE.MeshBasicMaterial({ color: color(hex), wireframe: true, transparent: true, opacity: 0.075, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  mesh.position.y = 2.0;
  mesh.userData.ward = true;
  return mesh;
}
function buildGuardian(areaId) {
  var area = AREA_BY_ID[areaId] || CAMP.areas[0];
  var info = GUARDIAN_DATA[area.id] || GUARDIAN_DATA['area-psi-salud-publica'];
  var accent = info.color || area.accent;
  var root = new THREE.Group();
  var body = new THREE.Group();
  root.add(body);
  var animated = { shards: [], rings: [], hands: [], trays: [], pages: [], gears: [], core: null };
  var eye = null;
  var mid = '#2b3446';
  var dark = '#151b27';
  var glowBox = accent;
  if (info.type === 'tree') {
    body.position.y = 0.35;
    addPartBoxes(body, [
      [0, 1.2, 0, 0.82, 2.35, 0.68, '#4b3a29'],
      [0, 1.3, 0.35, 0.6, 1.65, 0.06, '#2d3d31'],
      [0, 0.32, 0.02, 1.25, 0.28, 0.72, '#3a2e22'],
      [-0.52, 0.16, 0.2, 0.35, 0.2, 0.4, '#3d3226'],
      [0.52, 0.16, -0.1, 0.35, 0.2, 0.4, '#3d3226'],
      [0, 1.33, 0.38, 0.22, 0.54, 0.04, accent, true],
      [-0.47, 1.75, 0.4, 0.12, 0.2, 0.03, accent, true],
      [0.47, 1.75, 0.4, 0.12, 0.2, 0.03, accent, true],
      [0, 2.0, 0.4, 0.62, 0.1, 0.06, '#d7b778']
    ]);
    var branchLeft = new THREE.Group();
    branchLeft.position.set(-0.25, 2.02, 0);
    addPartBoxes(branchLeft, [
      [-0.53, 0.22, 0, 1.02, 0.2, 0.26, '#4d3b29'],
      [-0.92, 0.45, 0, 0.22, 0.62, 0.22, '#4d3b29'],
      [-1.15, 0.74, 0, 0.58, 0.3, 0.28, '#31624f'],
      [-1.32, 0.94, 0.02, 0.26, 0.2, 0.2, accent, true]
    ]);
    var branchRight = new THREE.Group();
    branchRight.position.set(0.25, 2.02, 0);
    addPartBoxes(branchRight, [
      [0.53, 0.29, 0, 1.02, 0.2, 0.26, '#4d3b29'],
      [0.94, 0.56, 0, 0.22, 0.6, 0.22, '#4d3b29'],
      [1.12, 0.84, 0, 0.52, 0.28, 0.28, '#356b56'],
      [1.3, 1.0, 0.02, 0.23, 0.18, 0.2, accent, true]
    ]);
    branchLeft.userData.baseY = branchLeft.position.y;
    branchRight.userData.baseY = branchRight.position.y;
    body.add(branchLeft, branchRight);
    animated.hands.push(branchLeft, branchRight);
    for (var ti = 0; ti < 6; ti++) {
      var leaf = new THREE.Group();
      addPartBoxes(leaf, [
        [0, 0, 0, 0.32, 0.2, 0.26, ti % 2 ? '#3d7962' : '#4b8a69'],
        [0, 0.1, 0.11, 0.16, 0.06, 0.02, accent, true]
      ]);
      leaf.position.set(-0.85 + (ti % 3) * 0.85, 2.7 + Math.floor(ti / 3) * 0.38, 0.18 + (ti % 2) * 0.12);
      body.add(leaf);
      animated.shards.push({ group: leaf, baseY: leaf.position.y, baseX: leaf.position.x, angle: ti * 1.7, speed: 0.4 + ti * 0.06 });
    }
    eye = makeGlowSprite(accent, 1.8, 0.7);
    body.add(eye);
    eye.position.set(0, 1.38, 0.42);
  } else if (info.type === 'heart') {
    body.position.y = 2.05;
    addPartBoxes(body, [
      [-0.38, 0.18, 0, 0.66, 0.7, 0.5, '#33466d'],
      [0.38, 0.18, 0, 0.66, 0.7, 0.5, '#33466d'],
      [0, -0.18, 0.02, 0.9, 0.58, 0.5, '#3b4d73'],
      [0, -0.6, 0.04, 0.5, 0.4, 0.4, '#2b3a59'],
      [0, 0.2, 0.28, 0.78, 0.52, 0.06, '#1c2b46'],
      [0, 0.24, 0.31, 0.42, 0.36, 0.02, accent, true],
      [0, 0.22, 0.32, 0.18, 0.48, 0.02, '#dff8ff', true],
      [-0.56, -0.06, 0.03, 0.08, 0.55, 0.32, '#7aa2ff'],
      [0.56, -0.06, 0.03, 0.08, 0.55, 0.32, '#7aa2ff'],
      [0, -0.42, 0.25, 0.36, 0.06, 0.03, accent, true],
      [0, -0.55, 0, 0.2, 0.16, 0.2, glowBox, true]
    ]);
    eye = makeGlowSprite(accent, 1.2, 0.8);
    eye.position.set(0, 0.1, 0.38);
    body.add(eye);
    var handL = new THREE.Group();
    handL.position.set(-1.12, 0.3, 0.15);
    addPartBoxes(handL, [
      [0, 0, 0, 0.55, 0.24, 0.38, '#2b3446'],
      [-0.2, -0.1, 0, 0.18, 0.38, 0.24, '#283247'],
      [0, 0.03, 0.22, 0.3, 0.06, 0.03, accent, true]
    ]);
    var handR = new THREE.Group();
    handR.position.set(1.12, 0.3, 0.15);
    addPartBoxes(handR, [
      [0, 0, 0, 0.55, 0.24, 0.38, '#2b3446'],
      [0.2, -0.1, 0, 0.18, 0.38, 0.24, '#283247'],
      [0, 0.03, 0.22, 0.3, 0.06, 0.03, accent, true]
    ]);
    handL.userData.baseY = handL.position.y;
    handR.userData.baseY = handR.position.y;
    body.add(handL, handR);
    animated.hands.push(handL, handR);
    var halo = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.028, 4, 40), new THREE.MeshBasicMaterial({ color: color(accent), transparent: true, opacity: 0.6 }));
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.85;
    body.add(halo);
    animated.rings.push({ mesh: halo, speed: 0.18, axis: 'z' });
    animated.core = eye;
  } else if (info.type === 'mirror') {
    body.position.y = 1.55;
    addPartBoxes(body, [
      [0, 0.1, 0, 0.78, 1.45, 0.55, dark],
      [0, 0.78, 0, 0.9, 0.82, 0.62, '#2b3042'],
      [0, 0.82, 0.34, 0.68, 0.6, 0.06, '#0e1220'],
      [0, 0.82, 0.38, 0.58, 0.5, 0.03, accent, true],
      [-0.47, 0.4, 0, 0.09, 0.44, 0.09, accent, true],
      [0.47, 0.4, 0, 0.09, 0.44, 0.09, accent, true],
      [0, -0.6, 0.03, 0.5, 0.4, 0.34, mid],
      [0, -0.42, 0.05, 0.26, 0.09, 0.03, '#e7d6b4']
    ]);
    eye = makeGlowSprite(accent, 2.1, 0.58);
    eye.position.set(0, 0.83, 0.45);
    body.add(eye);
    var beam = new THREE.Group();
    beam.position.y = 0.05;
    addPartBoxes(beam, [
      [-1.1, 0, 0, 2.2, 0.09, 0.11, '#a78b63'],
      [0, 0.04, 0, 0.2, 0.16, 0.18, accent, true]
    ]);
    body.add(beam);
    [-1.08, 1.08].forEach(function (x) {
      var tray = new THREE.Group();
      tray.position.set(x, -0.05, 0);
      addPartBoxes(tray, [
        [0, -0.36, 0, 0.04, 0.7, 0.04, '#b79b69'],
        [0, -0.72, 0, 0.44, 0.06, 0.1, '#b79b69'],
        [0, -0.58, 0, 0.25, 0.2, 0.22, '#efd6ad'],
        [0, -0.6, 0.12, 0.12, 0.1, 0.02, accent, true]
      ]);
      body.add(tray);
      animated.trays.push({ group: tray, baseY: tray.position.y, phase: x > 0 ? Math.PI : 0 });
    });
    animated.rings.push({ mesh: beam, speed: 0.15, axis: 'y' });
  } else if (info.type === 'prism') {
    body.position.y = 2.15;
    var crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.02, 0), new THREE.MeshLambertMaterial({ color: color('#425b2b'), emissive: color(accent), emissiveIntensity: 0.28, flatShading: true }));
    crystal.scale.set(0.9, 1.3, 0.9);
    body.add(crystal);
    addPartBoxes(body, [
      [0, 0.12, 0, 0.56, 0.34, 0.12, '#0d1410'],
      [0, 0.12, 0.12, 0.24, 0.16, 0.02, accent, true],
      [0, 0.66, 0, 0.13, 0.22, 0.13, accent, true],
      [-0.82, -0.18, 0, 0.2, 0.2, 0.2, '#506b35'],
      [0.84, -0.1, 0, 0.2, 0.2, 0.2, '#506b35']
    ]);
    eye = makeGlowSprite(accent, 1.8, 0.7);
    eye.position.set(0, 0.13, 0.35);
    body.add(eye);
    var ringA = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.025, 4, 36), new THREE.MeshBasicMaterial({ color: color(accent), transparent: true, opacity: 0.5 }));
    ringA.rotation.x = 1.1;
    ringA.position.y = 0.1;
    var ringB = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.02, 4, 30), new THREE.MeshBasicMaterial({ color: color('#e7f4bd'), transparent: true, opacity: 0.33 }));
    ringB.rotation.x = 0.4;
    ringB.rotation.z = 1.2;
    body.add(ringA, ringB);
    animated.rings.push({ mesh: ringA, speed: 0.22, axis: 'y' }, { mesh: ringB, speed: -0.17, axis: 'z' });
    for (var pl = 0; pl < 5; pl++) {
      var lens = new THREE.Group();
      addPartBoxes(lens, [
        [0, 0, 0, 0.34, 0.06, 0.22, '#445b30'],
        [0, 0.02, 0.08, 0.2, 0.02, 0.16, accent, true]
      ]);
      lens.position.set((pl % 2 ? 1 : -1) * (1.55 + (pl % 3) * 0.22), -0.4 + pl * 0.32, -0.25 + (pl % 2) * 0.42);
      body.add(lens);
      animated.shards.push({ group: lens, baseY: lens.position.y, baseX: lens.position.x, angle: pl * 1.2, speed: 0.3 + pl * 0.05 });
    }
    animated.core = crystal;
  } else {
    body.position.y = 0.08;
    addPartBoxes(body, [
      [0, 0.38, 0, 1.95, 0.5, 1.5, '#353a42'],
      [0, 0.74, 0, 1.62, 0.28, 1.2, '#4c4030'],
      [-0.72, 1.55, 0, 0.24, 1.5, 0.24, '#4b4438'],
      [0.72, 1.55, 0, 0.24, 1.5, 0.24, '#4b4438'],
      [0, 1.43, 0, 1.2, 0.32, 0.92, '#5e4931'],
      [0, 2.2, 0, 1.5, 0.24, 1.05, '#383c45'],
      [0, 2.42, 0, 0.78, 0.3, 0.64, '#6d5231'],
      [0, 2.72, 0, 0.35, 0.4, 0.32, accent, true],
      [-0.31, 2.38, 0.34, 0.22, 0.08, 0.02, accent, true],
      [0.31, 2.38, 0.34, 0.22, 0.08, 0.02, accent, true]
    ]);
    var gear = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.08, 6, 16), new THREE.MeshLambertMaterial({ color: color('#b48b54') }));
    gear.rotation.x = Math.PI / 2;
    gear.position.set(0, 1.56, 0.6);
    body.add(gear);
    animated.gears.push({ mesh: gear, speed: 0.7 });
    var gear2 = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.055, 6, 12), new THREE.MeshLambertMaterial({ color: color(accent) }));
    gear2.rotation.x = Math.PI / 2;
    gear2.position.set(0.58, 1.85, 0.42);
    body.add(gear2);
    animated.gears.push({ mesh: gear2, speed: -1.0 });
    eye = makeGlowSprite(accent, 1.8, 0.7);
    eye.position.set(0, 2.7, 0.24);
    body.add(eye);
    for (var pg = 0; pg < 3; pg++) {
      var pane = new THREE.Group();
      addPartBoxes(pane, [
        [0, 0, 0, 0.44, 0.26, 0.02, accent, true],
        [0, 0, 0.026, 0.34, 0.17, 0.008, '#f6e7c8', true],
        [0, 0.16, 0.03, 0.2, 0.03, 0.01, '#f6e7c8', true]
      ]);
      pane.position.set(-1.15 + pg * 1.15, 2.75 + (pg % 2) * 0.34, -0.3 + (pg % 2) * 0.32);
      body.add(pane);
      animated.pages.push({ group: pane, baseY: pane.position.y, baseX: pane.position.x, phase: pg * 2.1 });
    }
    animated.core = eye;
  }
  var eyeHeight = info.type === 'tree' ? 1.75 : info.type === 'heart' ? 2.15 : info.type === 'mirror' ? 2.36 : info.type === 'prism' ? 2.28 : 2.78;
  if (eye) eye.position.x = eye.position.x;
  var ward = makeWardShield(accent, info.type === 'heart' ? 1.55 : 1.8);
  ward.position.y = eyeHeight;
  root.add(ward);
  var underGlow = makeGlowSprite(accent, info.type === 'tower' ? 4.8 : 4.2, 0.2);
  underGlow.position.y = 0.2;
  root.add(underGlow);
  var light = new THREE.PointLight(accent, 1.25, 9, 2);
  light.position.set(0, eyeHeight, 0.6);
  root.add(light);
  var shadow = makeBlob(info.type === 'tower' ? 2.7 : 2.2);
  root.add(shadow);
  var nameLabel = addLabelSprite(info.name, 'Guardián · ' + area.short, accent, 3.35);
  nameLabel.position.y = info.height + 0.7;
  root.add(nameLabel);
  var guardian = {
    root: root,
    body: body,
    shards: animated.shards,
    hands: animated.hands,
    trays: animated.trays,
    rings: animated.rings,
    gears: animated.gears,
    pages: animated.pages,
    core: animated.core,
    eye: eye,
    ward: ward,
    shieldPulse: 0,
    name: info.name,
    type: info.type,
    accent: accent,
    glow: underGlow,
    light: light,
    label: nameLabel,
    height: info.height,
    baseBodyY: body.position.y,
    hoverSeed: rng() * 7,
    hurtTimer: 0,
    attackTimer: 0,
    phase: rng() * 6
  };
  root.userData.guardian = guardian;
  return guardian;
}

/* -------------------------------------------------------------------------
   Escena del observatorio
   ------------------------------------------------------------------------- */
var sceneRoot = new THREE.Group();
var hubGroup = new THREE.Group();
var arenaGroup = new THREE.Group();
scene.add(sceneRoot);
sceneRoot.add(hubGroup, arenaGroup);
arenaGroup.visible = false;

var ambient = new THREE.HemisphereLight('#93a6e8', '#201625', 1.0);
scene.add(ambient);
var moonLight = new THREE.DirectionalLight('#f5d6ae', 2.1);
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(1024, 1024);
moonLight.shadow.camera.left = -13;
moonLight.shadow.camera.right = 13;
moonLight.shadow.camera.top = 13;
moonLight.shadow.camera.bottom = -13;
moonLight.shadow.camera.near = 1;
moonLight.shadow.camera.far = 60;
moonLight.shadow.bias = -0.001;
scene.add(moonLight, moonLight.target);
var rimLight = new THREE.DirectionalLight('#7899ff', 0.85);
rimLight.position.set(-8, 6, -8);
scene.add(rimLight);

// Noche: estrellas y luna.
var starGeo = new THREE.BufferGeometry();
var starPos = [], starColors = [];
var starPalette = ['#e7e9ff', '#aebdff', '#f3d8b0', '#9fefe0'];
for (var si = 0; si < 620; si++) {
  var theta = rng() * Math.PI * 2;
  var phi = 0.06 + rng() * 1.2;
  var radius = 140 + rng() * 70;
  starPos.push(Math.cos(theta) * Math.cos(phi) * radius, Math.sin(phi) * radius * 0.72, Math.sin(theta) * Math.cos(phi) * radius);
  var sc = color(starPalette[Math.floor(rng() * starPalette.length)]);
  starColors.push(sc.r, sc.g, sc.b);
}
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
starGeo.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
var starField = new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 1.4, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.9, fog: false, depthWrite: false }));
scene.add(starField);
var moon = new THREE.Sprite(new THREE.SpriteMaterial({
  map: radialTexture([[0, '#fffcef'], [0.4, '#fff3cd'], [0.48, 'rgba(255,240,195,0.28)'], [1, 'rgba(255,240,195,0)']]),
  transparent: true, depthWrite: false, fog: false
}));
moon.scale.set(24, 24, 1);
scene.add(moon);

function buildFloor(group, radius, center, accentColor, borderHex) {
  var count = 0;
  var N = Math.ceil(radius * 2 + 2);
  for (var gx = -N; gx <= N; gx++) {
    for (var gz = -N; gz <= N; gz++) {
      var x = gx + 0.5, z = gz + 0.5;
      if (x * x + z * z <= (radius + 0.3) * (radius + 0.3)) count++;
    }
  }
  var tiles = new THREE.InstancedMesh(BOX, new THREE.MeshLambertMaterial(), Math.max(1, count));
  tiles.count = 0;
  tiles.receiveShadow = true;
  tiles.castShadow = false;
  var tint = new THREE.Color();
  var border = new THREE.InstancedMesh(BOX, new THREE.MeshLambertMaterial(), Math.max(1, 220));
  border.count = 0;
  border.receiveShadow = true;
  for (var gx2 = -N; gx2 <= N; gx2++) {
    for (var gz2 = -N; gz2 <= N; gz2++) {
      var px = gx2 + 0.5, pz = gz2 + 0.5;
      var d = Math.sqrt(px * px + pz * pz);
      if (d > radius + 0.3) continue;
      var shade = 0.88 + rng() * 0.22;
      var ring = Math.floor(d * 1.2);
      if (d > radius - 0.8) tint.set('#544634').multiplyScalar(shade);
      else if (ring % 4 === 0 && d > radius - 2.2) tint.set('#383d48').multiplyScalar(shade);
      else tint.set(palette.stone || '#263048').multiplyScalar(shade);
      addBlock(tiles, px, -0.12, pz, 0.97, 0.22, 0.97, tint);
      if (d > radius - 0.7 && d < radius + 0.3) {
        var edgeTint = new THREE.Color(borderHex || palette.gold || '#e4c07a').multiplyScalar(0.38 + rng() * 0.16);
        addBlock(border, px, 0.03, pz, 0.82, 0.12, 0.82, edgeTint, gx2, gz2);
      }
    }
  }
  tiles.instanceMatrix.needsUpdate = true;
  border.instanceMatrix.needsUpdate = true;
  group.add(tiles, border);
  var base = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.45, radius + 0.1, 1.0, 32), new THREE.MeshLambertMaterial({ color: color('#11151f') }));
  base.position.y = -0.7;
  base.receiveShadow = true;
  group.add(base);
  var under = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.92, radius * 0.75, 2.6, 32), new THREE.MeshLambertMaterial({ color: color('#0b0e17') }));
  under.position.y = -1.7;
  group.add(under);
  var rim = new THREE.Mesh(new THREE.TorusGeometry(radius + 0.18, 0.055, 4, 64), new THREE.MeshBasicMaterial({ color: color(accentColor || palette.gold), transparent: true, opacity: 0.45 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.06;
  group.add(rim);
  return { tiles: tiles, border: border, base: base, rim: rim };
}
function addBlock(mesh, x, y, z, sx, sy, sz, tint) {
  dummy.position.set(x, y, z);
  dummy.rotation.set(0, 0, 0);
  dummy.scale.set(sx, sy, sz);
  dummy.updateMatrix();
  mesh.setMatrixAt(mesh.count, dummy.matrix);
  mesh.setColorAt(mesh.count, tint);
  mesh.count++;
}

var hubFloor = buildFloor(hubGroup, HUB_RADIUS, new THREE.Vector3(0, 0, 0), palette.gold);

/* Pisos y caminos de luz hacia las cinco rutas */
var GATE_ANGLES = [202, 274, 346, 58, 130].map(function (deg) { return deg * Math.PI / 180; });
var gateGroups = [];
CAMP.areas.forEach(function (area, index) {
  var angle = GATE_ANGLES[index];
  var gx = Math.cos(angle) * 7.1;
  var gz = Math.sin(angle) * 7.1;
  var gate = new THREE.Group();
  gate.position.set(gx, 0, gz);
  gate.rotation.y = Math.atan2(-gx, -gz);
  var stone = '#2a3040';
  var stone2 = '#3d4351';
  var accent = area.accent;
  var arch = mergedVoxels([
    [0, 0.1, 0, 3.0, 0.22, 1.1, '#171d28'],
    [-1.22, 1.55, 0, 0.35, 2.9, 0.45, stone],
    [1.22, 1.55, 0, 0.35, 2.9, 0.45, stone],
    [-1.22, 2.98, 0, 0.55, 0.3, 0.62, stone2],
    [1.22, 2.98, 0, 0.55, 0.3, 0.62, stone2],
    [0, 3.06, 0, 2.8, 0.42, 0.58, stone],
    [0, 3.3, 0, 1.2, 0.16, 0.44, accent, true],
    [-0.85, 0.35, 0.3, 0.16, 0.34, 0.16, accent, true],
    [0.85, 0.35, 0.3, 0.16, 0.34, 0.16, accent, true],
    [0, 1.35, 0.38, 0.42, 1.9, 0.06, accent, true],
    [-0.30, 1.9, 0.32, 0.22, 0.22, 0.1, '#e8e5d9', true],
    [0.30, 1.9, 0.32, 0.22, 0.22, 0.1, '#e8e5d9', true],
    [0, 1.04, 0.32, 0.72, 0.3, 0.1, lookDoorPanel(area), false],
    [0, 0.4, 0.34, 1.5, 0.2, 0.25, '#1a202b']
  ]);
  gate.add(arch);
  var glow = makeGlowSprite(accent, 4.8, 0.22);
  glow.position.set(0, 1.8, -0.15);
  gate.add(glow);
  var beacon = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshBasicMaterial({ color: color(accent) }));
  beacon.position.y = 3.55;
  gate.add(beacon);
  var label = addLabelSprite(area.short, index + 1 + '/4 rutas · ' + area.blurb.split('.')[0], accent, 3.15);
  label.position.y = 4.15;
  gate.add(label);
  var light = new THREE.PointLight(accent, 0.8, 6, 2);
  light.position.set(0, 2.2, 0.4);
  gate.add(light);
  var hit = new THREE.Mesh(new THREE.BoxGeometry(3.0, 4.0, 2.2), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  hit.position.set(0, 1.8, 0.4);
  hit.userData.gateArea = area.id;
  gate.add(hit);
  hubGroup.add(gate);
  gateGroups.push({ area: area, group: gate, label: label, beacon: beacon, glow: glow, light: light, angle: angle, position: new THREE.Vector3(gx, 0, gz), hit: hit, index: index });

  // camino
  var path = new THREE.Group();
  var steps = 6;
  for (var s = 1; s <= steps; s++) {
    var t = s / (steps + 1);
    var px = Math.cos(angle) * (2.6 + t * 3.6);
    var pz = Math.sin(angle) * (2.6 + t * 3.6);
    var block = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.035, 0.18), new THREE.MeshBasicMaterial({ color: color(accent), transparent: true, opacity: 0.22 + s * 0.035 }));
    block.position.set(px, 0.02, pz);
    block.rotation.y = -angle;
    path.add(block);
  }
  hubGroup.add(path);
});
function lookDoorPanel(area) {
  return area.id === 'area-psi-salud-publica' ? '#1d4f45' : area.id === 'area-psi-cuidado-integral' ? '#263560' : area.id === 'area-psi-etica' ? '#432a5b' : area.id === 'area-psi-investigacion' ? '#41502a' : '#5c3e22';
}

/* Dais central y orrery */
var dais = new THREE.Group();
dais.position.y = 0.08;
dais.add((function () {
  var m = mergedVoxels([
    [0, 0.0, 0, 5.0, 0.25, 5.0, '#1a202b'],
    [0, 0.26, 0, 4.3, 0.2, 4.3, '#252b38'],
    [0.15, 0.44, -0.1, 3.0, 0.18, 3.0, '#343844'],
    [0, 0.54, 0, 2.0, 0.16, 2.0, '#47443a']
  ]);
  return m;
})());
var goldRuneMat = new THREE.MeshBasicMaterial({ color: color(palette.gold || '#e4c07a'), transparent: true, opacity: 0.75 });
var daisRing = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.025, 4, 32), goldRuneMat);
daisRing.rotation.x = Math.PI / 2;
daisRing.position.y = 0.7;
dais.add(daisRing);
var orrery = new THREE.Group();
orrery.position.y = 0.58;
var orreryBase = mergedVoxels([
  [0, 0.18, 0, 0.8, 0.36, 0.8, '#30323a'],
  [0, 0.5, 0, 0.4, 0.3, 0.4, palette.gold || '#e4c07a'],
  [0, 0.9, 0, 0.12, 0.9, 0.12, '#6b5b3f']
]);
orrery.add(orreryBase);
var orreryRings = [];
for (var ri = 0; ri < 3; ri++) {
  var ring = new THREE.Mesh(new THREE.TorusGeometry(1.05 + ri * 0.2, 0.035, 4, 28), new THREE.MeshBasicMaterial({ color: color(palette.gold || '#e4c07a'), transparent: true, opacity: 0.6 - ri * 0.1 }));
  ring.rotation.x = Math.PI / 2 + (ri - 1) * 0.35;
  ring.rotation.z = ri * 0.7;
  ring.position.y = 1.4 + ri * 0.18;
  orrery.add(ring);
  orreryRings.push({ mesh: ring, speed: 0.12 + ri * 0.05, tilt: (ri - 1) * 0.3 });
}
var orbitStones = [];
CAMP.areas.forEach(function (area, i) {
  var stone = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.26), new THREE.MeshBasicMaterial({ color: color(area.accent) }));
  stone.position.y = 1.55;
  orrery.add(stone);
  orbitStones.push({ mesh: stone, angle: i / CAMP.areas.length * Math.PI * 2, radius: 1.35, speed: 0.16 + i * 0.012 });
});
var orreryLight = new THREE.PointLight(palette.gold || '#e4c07a', 1.0, 6, 2);
orreryLight.position.y = 1.6;
orrery.add(orreryLight);
var orreryGlow = makeGlowSprite(palette.gold || '#e4c07a', 4.4, 0.2);
orreryGlow.position.y = 1.4;
orrery.add(orreryGlow);
dais.add(orrery);
hubGroup.add(dais);

/* Islas lejanas, materia suspendida y vegetación de cristal */
function buildDistantIsland(x, y, z, size, colorHex) {
  var g = new THREE.Group();
  g.position.set(x, y, z);
  var boxes = [
    [0, 0, 0, size, 0.5, size * 0.8, '#252b35'],
    [size * 0.25, 0.5, 0, size * 0.45, 1.7, size * 0.3, '#39414d'],
    [size * 0.25, 1.4, 0, size * 0.54, 0.2, size * 0.4, '#55574d'],
    [-size * 0.3, -0.55, 0, size * 0.7, 0.35, size * 0.5, '#181d25'],
    [size * 0.25, 1.7, 0, 0.26, 1.2, 0.26, colorHex, true]
  ];
  g.add(mergedVoxels(boxes));
  var crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), new THREE.MeshLambertMaterial({ color: color(colorHex), emissive: color(colorHex), emissiveIntensity: 0.4 }));
  crystal.position.set(-size * 0.2, 1.0, 0.1);
  g.add(crystal);
  var glow = makeGlowSprite(colorHex, 2.2, 0.2);
  glow.position.y = 1.1;
  g.add(glow);
  hubGroup.add(g);
  return g;
}
buildDistantIsland(-17, -1, -24, 7, palette.teal || '#69d3c1');
buildDistantIsland(19, 1, -29, 8.5, palette.blue || '#7aa2ff');
buildDistantIsland(-24, 2, 12, 5.5, palette.violet || '#c49bff');
buildDistantIsland(24, -2, 13, 6.5, palette.amber || '#f3b562');
var drifter = buildDistantIsland(4, 5, -33, 4.4, palette.gold || '#e4c07a');
drifter.scale.setScalar(0.8);

var hubParticles = [];
var particleGeo = new THREE.BufferGeometry();
var particleCount = 76;
var pPositions = new Float32Array(particleCount * 3);
for (var pi = 0; pi < particleCount; pi++) {
  var rr = 3 + rng() * 7.8;
  var aa = rng() * Math.PI * 2;
  var yy = 0.4 + rng() * 4.2;
  pPositions[pi * 3] = Math.cos(aa) * rr;
  pPositions[pi * 3 + 1] = yy;
  pPositions[pi * 3 + 2] = Math.sin(aa) * rr;
  hubParticles.push({ x: pPositions[pi * 3], y: yy, z: pPositions[pi * 3 + 2], speed: 0.1 + rng() * 0.25, phase: rng() * 10 });
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
var dust = new THREE.Points(particleGeo, new THREE.PointsMaterial({ size: 0.075, color: color('#f4dca8'), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
hubGroup.add(dust);
var hubGlow = makeGlowSprite('#809eff', 28, 0.08);
hubGlow.position.set(0, 1.5, -1);
hubGroup.add(hubGlow);

/* Aro ambiente bajo el observatorio */
var abyssRing = new THREE.Mesh(new THREE.TorusGeometry(10.2, 0.06, 4, 64), new THREE.MeshBasicMaterial({ color: color(palette.blue), transparent: true, opacity: 0.25 }));
abyssRing.rotation.x = Math.PI / 2;
abyssRing.position.y = -0.3;
hubGroup.add(abyssRing);

/* -------------------------------------------------------------------------
   Arena de duelo
   ------------------------------------------------------------------------- */
var arenaFloor = buildFloor(arenaGroup, 6.3, ARENA_POS, palette.violet, '#5c526a');
arenaGroup.position.copy(ARENA_POS);
var arenaDais = new THREE.Group();
arenaDais.position.y = 0.07;
arenaDais.add(mergedVoxels([
  [0, 0, 0, 5.8, 0.2, 5.8, '#151a24'],
  [0, 0.19, 0, 4.4, 0.13, 4.4, '#202632'],
  [0, 0.31, 0, 2.8, 0.08, 2.8, '#323642']
]));
var arenaRuneMat = new THREE.MeshBasicMaterial({ color: color(palette.violet), transparent: true, opacity: 0.7 });
var arenaRune = new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.025, 4, 32), arenaRuneMat);
arenaRune.rotation.x = Math.PI / 2;
arenaRune.position.y = 0.39;
arenaDais.add(arenaRune);
var arenaRune2 = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.018, 4, 40), arenaRuneMat.clone());
arenaRune2.rotation.x = Math.PI / 2;
arenaRune2.position.y = 0.15;
arenaDais.add(arenaRune2);
arenaGroup.add(arenaDais);
var arenaPillars = [];
for (var ap = 0; ap < 6; ap++) {
  var aa2 = ap / 6 * Math.PI * 2;
  var px2 = Math.cos(aa2) * 5.15, pz2 = Math.sin(aa2) * 5.15;
  var pillar = new THREE.Group();
  pillar.position.set(px2, 0, pz2);
  var h2 = ap % 2 ? 2.1 : 2.8;
  pillar.add(mergedVoxels([
    [0, 0.1, 0, 0.9, 0.2, 0.9, '#171c26'],
    [0, h2 / 2, 0, 0.32, h2, 0.32, '#2a3040'],
    [0, h2 + 0.15, 0, 0.55, 0.2, 0.55, '#3a3e49'],
    [0, h2 + 0.3, 0, 0.18, 0.16, 0.18, palette.violet, true]
  ]));
  arenaGroup.add(pillar);
  arenaPillars.push({ group: pillar, phase: ap * 1.2 });
}
var arenaGlow = makeGlowSprite(palette.violet, 14, 0.11);
arenaGlow.position.set(0, 2.2, -4.8);
arenaGroup.add(arenaGlow);
var arenaBackRing = new THREE.Mesh(new THREE.TorusGeometry(4.5, 0.035, 4, 48), new THREE.MeshBasicMaterial({ color: color(palette.violet), transparent: true, opacity: 0.22 }));
arenaBackRing.position.set(0, 3.4, -5.8);
arenaGroup.add(arenaBackRing);
var arenaLight = new THREE.PointLight(palette.violet, 1.1, 12, 2);
arenaLight.position.set(0, 4.5, 0);
arenaGroup.add(arenaLight);
var arenaKey = new THREE.PointLight('#ffe4c2', 1.45, 12, 2);
arenaKey.position.set(0, 5.0, 4.4);
arenaGroup.add(arenaKey);
var guardian = null;
var dueling = false;

/* Sombra del héroe */
var heroShadow = makeBlob(1.9);
hubGroup.add(heroShadow);
var heroAvatar = null;
var heroHolder = new THREE.Group();
hubGroup.add(heroHolder);
var avatarRenderTarget = null;
var arenaHeroShadow = makeBlob(1.9);
arenaHeroShadow.visible = false;
arenaGroup.add(arenaHeroShadow);

function rebuildHeroAvatar() {
  if (heroAvatar) {
    disposeObject(heroAvatar.root);
    heroAvatar = null;
  }
  heroAvatar = buildHeroAvatar(state.collection.selectedCharacterId);
  if (typeof applyOutfitToAvatar === 'function') applyOutfitToAvatar(heroAvatar, state.collection.selectedCharacterId);
  heroHolder.add(heroAvatar.root);
  heroHolder.position.set(hubHero.x, 0, hubHero.z);
  heroAvatar.root.rotation.y = hubHero.facing;
  syncHudPortrait();
}

/* -------------------------------------------------------------------------
   Movimiento / interacción
   ------------------------------------------------------------------------- */
var hubHero = { x: 0, z: 3.3, facing: Math.PI, vx: 0, vz: 0, moving: false };
var currentInteract = null;
var selectedGate = -1;
var cameraFocus = new THREE.Vector3(0, 0, 3.3);
var cameraTarget = new THREE.Vector3(0, 1.5, 3.3);
var titleTime = 0;
var cameraShake = 0;
var cameraMode = 'title';
var duelCamIntro = 0;

function walkableAt(x, z) {
  var d = Math.hypot(x, z);
  if (d > HUB_RADIUS - 0.25) return false;
  if (d < 1.9) {
    // el dais central es accesible; solo el pedestal bloquea
    if (Math.hypot(x, z) < 1.05) return false;
  }
  return true;
}
function updateHub(dt) {
  if (screen !== 'hub') { hubHero.moving = false; return; }
  var input = readInput();
  var dx = input.x, dz = input.z;
  var mag = Math.hypot(dx, dz);
  if (mag > 0) { dx /= mag; dz /= mag; }
  var speed = Number(RULES.heroSpeed) || 4.5;
  hubHero.vx = lerp(hubHero.vx, dx * speed, Math.min(1, dt * 12));
  hubHero.vz = lerp(hubHero.vz, dz * speed, Math.min(1, dt * 12));
  if (mag > 0) {
    hubHero.facing = lerpAngle(hubHero.facing, Math.atan2(dx, dz), Math.min(1, dt * 11));
  }
  var nx = hubHero.x + hubHero.vx * dt;
  var nz = hubHero.z + hubHero.vz * dt;
  var moved = false;
  if (walkableAt(nx, hubHero.z)) { hubHero.x = nx; moved = true; }
  if (walkableAt(hubHero.x, nz)) { hubHero.z = nz; moved = true; }
  hubHero.moving = moved && (Math.abs(hubHero.vx) + Math.abs(hubHero.vz) > 0.35);
  if (hubHero.moving && Math.random() < dt * 5) {
    // paso discreto y muy suave
    // tone(130 + Math.random() * 20, 0.025, 'triangle', 0.003);
  }
  updateInteract();
}
function lerpAngle(a, b, t) {
  var diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}
function readInput() {
  var x = 0, z = 0;
  if (screen === 'hub') {
    if (keys['ArrowLeft'] || keys['KeyA']) x -= 1;
    if (keys['ArrowRight'] || keys['KeyD']) x += 1;
    if (keys['ArrowUp'] || keys['KeyW']) z -= 1;
    if (keys['ArrowDown'] || keys['KeyS']) z += 1;
  }
  x += touchInput.x;
  z += touchInput.z;
  return { x: clamp(x, -1, 1), z: clamp(z, -1, 1) };
}
function updateInteract() {
  currentInteract = null;
  selectedGate = -1;
  var best = null;
  gateGroups.forEach(function (g, i) {
    var d = Math.hypot(hubHero.x - g.position.x, hubHero.z - g.position.z);
    if (d < 1.85) {
      if (!best || d < best.dist) { best = { type: 'gate', gate: g, dist: d }; selectedGate = i; }
    }
  });
  var dCenter = Math.hypot(hubHero.x, hubHero.z);
  if (dCenter < 2.45 && (!best || dCenter < best.dist)) best = { type: 'oracle', dist: dCenter };
  currentInteract = best;
  if (screen === 'hub') {
    if (best) {
      EL.prompt.classList.remove('hidden');
      EL.prompt.querySelector('span').innerHTML = best.type === 'oracle'
        ? '<b>Consultar la bitácora</b> · cinco rutas'
        : 'Abrir ruta de <b>' + esc(best.gate.area.short) + '</b>';
      EL.touchAction.classList.remove('hidden');
    } else {
      EL.prompt.classList.add('hidden');
      EL.touchAction.classList.add('hidden');
    }
    syncGateHighlights();
  } else {
    EL.prompt.classList.add('hidden');
  }
}
function syncGateHighlights() {
  gateGroups.forEach(function (g, i) {
    var active = selectedGate === i;
    g.label.material.opacity = active ? 1 : 0.82;
    g.glow.material.opacity = active ? 0.4 : 0.18;
    g.light.intensity = active ? 1.4 : 0.65;
  });
}
function activateInteract() {
  if (screen !== 'hub') return;
  if (!currentInteract) {
    // En el centro del observatorio sin objetivo: abre la bitácora como acceso rápido.
    openJournal(selectedAreaId);
    return;
  }
  if (currentInteract.type === 'oracle') openJournal(selectedAreaId);
  else openJournal(currentInteract.gate.area.id);
}

/* -------------------------------------------------------------------------
   Animación del héroe y de la escena
   ------------------------------------------------------------------------- */
function animateHero(dt, time) {
  if (!heroAvatar) return;
  var av = heroAvatar;
  var running = screen === 'hub' && hubHero.moving;
  var speedNorm = clamp(Math.hypot(hubHero.vx, hubHero.vz) / (Number(RULES.heroSpeed) || 4.5), 0, 1);
  var data = av.look.anim || { idle: 1.6, gait: 9, lean: 0.05 };
  av.idleT += dt * (running ? data.gait : data.idle);
  av.attackTimer = Math.max(0, av.attackTimer - dt);
  av.hurtTimer = Math.max(0, av.hurtTimer - dt);
  av.celebrateTimer = Math.max(0, av.celebrateTimer - dt);
  var t = av.idleT;
  var breath = Math.sin(t) * 0.018;
  var sway = Math.sin(t * 0.57 + av.look.body.head * 2.1);
  var legSwing = running ? Math.sin(t) * 0.66 : 0;
  var armSwing = running ? Math.sin(t) * 0.54 : 0;
  var stance = av.look.anim && av.look.anim.attack === 'hammer' ? 0.17 : 0.045;
  av.body.position.y = running ? Math.abs(Math.sin(t)) * 0.075 : breath * 0.9;
  av.body.position.x = 0;
  av.body.position.z = running ? 0.035 : 0;
  av.body.rotation.x = running ? data.lean * speedNorm : 0;
  av.body.rotation.y = running ? Math.sin(t) * 0.018 : sway * 0.018;
  av.body.rotation.z = running ? Math.sin(t) * 0.018 : sway * 0.012;
  av.torso.rotation.x = (av.look.id === 'zenon' || av.look.id === 'teo') ? 0.055 : 0;
  av.torso.rotation.y = 0;
  av.torso.rotation.z = running ? -Math.sin(t) * 0.025 : 0;
  av.head.rotation.x = (av.look.id === 'zenon' ? 0.06 : 0) + (running ? 0.03 : 0);
  av.head.rotation.y = running ? Math.sin(t) * 0.03 : Math.sin(t * 0.23) * 0.055;
  av.head.rotation.z = running ? Math.sin(t) * 0.025 : Math.sin(t * 0.35) * 0.018;
  av.leftLeg.rotation.x = legSwing;
  av.rightLeg.rotation.x = -legSwing;
  av.leftLeg.rotation.z = running ? 0.01 : 0;
  av.rightLeg.rotation.z = running ? -0.01 : 0;
  av.leftArm.rotation.x = -armSwing * 0.72 - (running ? 0.1 : 0);
  av.rightArm.rotation.x = armSwing * 0.72 - (running ? 0.08 : 0);
  av.leftArm.rotation.z = stance + (running ? 0 : Math.sin(t * 0.7) * 0.015);
  av.rightArm.rotation.z = -stance - (running ? 0 : Math.sin(t * 0.7) * 0.015);
  av.rightArm.rotation.y = 0;
  /* Posturas de reposo propias: el cuerpo también cuenta la identidad. */
  if (!running) {
    if (av.look.id === 'kian') { av.leftArm.rotation.x -= 0.2; av.rightArm.rotation.x -= 0.12; av.leftArm.rotation.z += 0.14; av.rightArm.rotation.z -= 0.14; }
    else if (av.look.id === 'teo' || av.look.id === 'zenon') { av.leftArm.rotation.x -= 0.16; av.head.rotation.x += 0.03; }
    else if (av.look.id === 'lia') { av.body.position.y += Math.sin(t * 1.2) * 0.012; av.head.rotation.z += 0.025 * Math.sin(t * 0.8); }
    else if (av.look.id === 'ilan') { av.leftArm.rotation.z -= 0.1; av.leftArm.rotation.x -= 0.08; }
    else if (av.look.id === 'mara') { av.rightArm.rotation.x += 0.06; }
    else if (av.look.id === 'noa') { av.head.rotation.y += 0.04 * Math.sin(t * 0.4); av.leftArm.rotation.x -= 0.12; }
    else if (av.look.id === 'amaru') { av.head.rotation.y += 0.08 * Math.sin(t * 0.28); }
    else if (av.look.id === 'ona') { av.head.rotation.z -= 0.025; av.rightArm.rotation.x += 0.06; }
    else if (av.look.id === 'iris') { av.leftArm.rotation.x -= 0.1; av.rightArm.rotation.x -= 0.08; }
  }
  if (av.hurtTimer > 0) {
    var h = av.hurtTimer / 0.52;
    av.body.rotation.z = Math.sin((1 - h) * 28) * 0.13 * h;
    av.body.rotation.x = -0.1 * h;
    av.body.position.x = Math.sin((1 - h) * 24) * 0.075 * h;
    av.body.position.z = -0.08 * h;
    av.head.rotation.z = -0.13 * h;
    av.leftArm.rotation.x = -0.5 * h;
    av.rightArm.rotation.x = 0.3 * h;
    av.leftArm.rotation.z = 0.35 * h;
    av.rightArm.rotation.z = -0.2 * h;
  }
  if (av.attackTimer > 0) {
    var a = 1 - av.attackTimer / 0.6;
    var arc = Math.sin(Math.min(1, a * 1.12) * Math.PI);
    var lunge = Math.sin(Math.min(1, a * 1.3) * Math.PI);
    if (av.attackStyle === 'hammer') {
      av.rightArm.rotation.x = -2.55 * arc;
      av.leftArm.rotation.x = -1.4 * arc;
      av.rightArm.rotation.z = -0.15 + 0.1 * arc;
      av.torso.rotation.y = -0.18 * arc;
      av.body.position.z = 0.18 * lunge;
      av.body.position.y = breath + Math.max(0, Math.sin(a * Math.PI)) * 0.1;
    } else if (av.attackStyle === 'staff') {
      av.rightArm.rotation.x = -1.9 * arc;
      av.leftArm.rotation.x = -1.15 * arc;
      av.rightArm.rotation.z = -0.35 + 0.2 * arc;
      av.leftArm.rotation.z = 0.38;
      av.torso.rotation.y = -0.25 * arc;
      av.body.rotation.y = -0.08 * arc;
      av.body.position.z = 0.12 * lunge;
    } else if (av.attackStyle === 'lantern') {
      av.rightArm.rotation.x = -2.3 * arc;
      av.leftArm.rotation.x = -0.55 * arc;
      av.rightArm.rotation.z = -0.22 + 0.25 * arc;
      av.head.rotation.x = 0.05 * arc;
      av.torso.rotation.y = -0.16 * arc;
    } else if (av.attackStyle === 'cast') {
      av.rightArm.rotation.x = -2.05 * arc;
      av.leftArm.rotation.x = -0.8 * arc;
      av.rightArm.rotation.z = -0.48 * arc;
      av.leftArm.rotation.z = 0.36 * arc;
      av.torso.rotation.y = -0.36 * arc;
      av.body.position.y = breath + arc * 0.07;
    } else {
      av.rightArm.rotation.x = -2.15 * arc;
      av.rightArm.rotation.z = -0.55 * arc;
      av.torso.rotation.y = -0.4 * arc;
      av.body.rotation.y = -0.16 * arc;
      av.body.position.z = 0.16 * lunge;
      av.leftArm.rotation.x = 0.5 * arc;
      av.leftArm.rotation.z = 0.25 * arc;
    }
  }
  if (av.celebrateTimer > 0) {
    var c = av.celebrateTimer / 2.5;
    av.body.position.y = Math.abs(Math.sin((1 - c) * Math.PI * 3)) * 0.34;
    av.leftArm.rotation.x = -2.35;
    av.rightArm.rotation.x = -2.35;
    av.leftArm.rotation.z = 0.65;
    av.rightArm.rotation.z = -0.65;
    av.head.rotation.y = Math.sin((1 - c) * 16) * 0.1;
  }
  if (av.cape) {
    av.cape.rotation.x = -0.035 - (running ? speedNorm * 0.2 : 0) - (av.attackTimer > 0 ? 0.12 : 0) + Math.sin(time * 2 + av.idleT * 0.2) * 0.025;
    av.cape.rotation.z = Math.sin(time * 1.3 + av.idleT * 0.3) * 0.022;
  }
  if (av.hairTail) {
    av.hairTail.rotation.x = -0.03 - (running ? speedNorm * 0.18 : 0) - (av.attackTimer > 0 ? 0.06 : 0) + Math.sin(time * 2.4 + av.idleT * 0.2) * 0.035;
    av.hairTail.rotation.z = Math.sin(time * 1.8) * 0.025;
  }
  if (av.floaters) {
    av.floaters.rotation.y = time * 0.5;
    av.floaters.position.y = (av.floaters.userData.baseY || 0) + Math.sin(time * 1.4) * 0.025;
  }
  if (typeof animateAvatarCosmetics === 'function') animateAvatarCosmetics(av, dt, time, running, speedNorm);
  av.currentMotion = running ? speedNorm : 0;
}
function triggerHeroAttack() {
  if (!heroAvatar) return;
  heroAvatar.attackTimer = 0.6;
  heroAvatar.stateTag = 'attack';
  sfxAttack();
  flashAttack();
  spawnSlashArc(heroAvatar.look.accent);
  var start = arenaWorld(duelPositions.hero).add(new THREE.Vector3(0.25, 1.4, 0.25));
  var targetY = guardian ? guardian.height * 0.54 : 1.8;
  var end = arenaWorld(duelPositions.guardian).add(new THREE.Vector3(0, targetY, 0));
  spawnLightProjectile(start, end, heroAvatar.look.accent, function () { impactGuardian(heroAvatar ? heroAvatar.look.accent : '#9ec6ff'); });
}
function triggerHeroHurt() {
  if (!heroAvatar) return;
  heroAvatar.hurtTimer = 0.52;
  heroAvatar.stateTag = 'hurt';
  pulseHeroShield(heroAvatar.look.accent);
  flashHit();
  cameraShake = Math.max(cameraShake, 0.22);
  spawnPulse(arenaWorld(duelPositions.hero).add(new THREE.Vector3(0, 1.25, 0)), heroAvatar.look.accent, 1.4);
  sfxHit();
}
function triggerHeroCelebrate() {
  if (!heroAvatar) return;
  heroAvatar.celebrateTimer = 2.5;
  heroAvatar.stateTag = 'celebrate';
}
function animateGuardian(dt, time) {
  if (!guardian) return;
  var g = guardian;
  g.hurtTimer = Math.max(0, g.hurtTimer - dt);
  g.attackTimer = Math.max(0, g.attackTimer - dt);
  g.shieldPulse = Math.max(0, (g.shieldPulse || 0) - dt * 1.9);
  var hoverAmount = g.type === 'tower' || g.type === 'tree' ? 0.025 : 0.11;
  var hover = Math.sin(time * 1.05 + g.hoverSeed) * hoverAmount;
  g.body.position.y = g.baseBodyY + hover;
  g.body.position.x = g.hurtTimer > 0 ? Math.sin((1 - g.hurtTimer / 0.46) * 22) * 0.07 : 0;
  g.body.position.z = g.attackTimer > 0 ? Math.sin((1 - g.attackTimer / 0.45) * Math.PI) * 0.16 : 0;
  g.body.rotation.y = Math.sin(time * 0.35 + g.phase) * (g.type === 'mirror' ? 0.04 : 0.1);
  g.body.rotation.z = g.hurtTimer > 0 ? Math.sin((1 - g.hurtTimer / 0.46) * 26) * 0.11 : 0;
  g.body.rotation.x = g.attackTimer > 0 ? -0.03 : 0;
  if (g.eye) g.eye.material.opacity = 0.46 + Math.sin(time * 2.2 + g.phase) * 0.12 + (g.attackTimer > 0 ? 0.3 : 0);
  g.shards.forEach(function (s) {
    s.group.rotation.y = time * s.speed + s.angle;
    s.group.position.y = s.baseY + Math.sin(time * 0.9 + s.angle) * 0.1;
    if (s.baseX != null) s.group.position.x = s.baseX + Math.sin(time * 0.55 + s.angle) * 0.08;
  });
  g.hands.forEach(function (hand, i) {
    hand.rotation.z = Math.sin(time * 1.2 + i * Math.PI) * 0.055;
    if (hand.userData.baseY != null) hand.position.y = hand.userData.baseY + Math.sin(time * 1.4 + i) * 0.028;
  });
  g.trays.forEach(function (tray) {
    tray.group.position.y = tray.baseY + Math.sin(time * 1.05 + tray.phase) * 0.055;
    tray.group.rotation.z = Math.sin(time * 0.7 + tray.phase) * 0.035;
  });
  g.rings.forEach(function (item) {
    item.mesh.rotation[item.axis || 'y'] += dt * item.speed;
  });
  g.gears.forEach(function (item) {
    item.mesh.rotation.z += dt * item.speed;
  });
  if (g.type === 'prism' && g.core) {
    g.core.rotation.y += dt * 0.38;
    g.core.rotation.z = Math.sin(time * 0.5) * 0.16;
  }
  g.pages.forEach(function (page) {
    page.group.position.y = page.baseY + Math.sin(time * 1.2 + page.phase) * 0.11;
    page.group.rotation.y = Math.sin(time * 0.7 + page.phase) * 0.25;
    page.group.position.x = page.baseX + Math.cos(time * 0.45 + page.phase) * 0.07;
  });
  if (g.glow) g.glow.material.opacity = 0.16 + Math.sin(time * 1.3 + g.phase) * 0.035;
  if (g.light) g.light.intensity = 1.05 + Math.sin(time * 1.7 + g.phase) * 0.22 + (g.attackTimer > 0 ? 0.5 : 0);
  if (g.ward) {
    g.ward.material.opacity = 0.035 + g.shieldPulse * 0.3;
    g.ward.scale.setScalar(1 + g.shieldPulse * 0.1);
    g.ward.rotation.y += dt * (0.18 + g.shieldPulse * 0.6);
    g.ward.rotation.x += dt * 0.07;
    g.ward.visible = g.root.visible;
  }
  if (g.label) {
    g.label.position.y = g.height + 0.7 + Math.sin(time * 0.7 + g.phase) * 0.03;
  }
}

/* Partículas de impacto */
var sparkPool = [];
var sparkLayer = new THREE.Group();
scene.add(sparkLayer);
for (var s = 0; s < 36; s++) {
  var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: color('#ffe2a8'), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  sp.scale.set(0.15, 0.15, 1);
  sparkLayer.add(sp);
  sparkPool.push({ sprite: sp, life: 0, max: 0.7, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 });
}
function spawnSparksAt(point, hex, count) {
  var used = 0;
  sparkPool.forEach(function (p) {
    if (p.life > 0 || used >= count) return;
    p.life = p.max = 0.4 + Math.random() * 0.55;
    p.x = point.x + (Math.random() - 0.5) * 0.8;
    p.y = point.y + Math.random() * 1.2;
    p.z = point.z + (Math.random() - 0.5) * 0.8;
    p.vx = (Math.random() - 0.5) * 2.4;
    p.vy = 0.7 + Math.random() * 2.2;
    p.vz = (Math.random() - 0.5) * 2.4;
    p.sprite.material.color.set(hex);
    p.sprite.material.opacity = 1;
    p.sprite.position.set(p.x, p.y, p.z);
    p.sprite.scale.set(0.22 + Math.random() * 0.22, 0.22 + Math.random() * 0.22, 1);
    used++;
  });
}
function updateSparks(dt) {
  sparkPool.forEach(function (p) {
    if (p.life <= 0) return;
    p.life -= dt;
    p.vy -= 5.2 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    var a = Math.max(0, p.life / p.max);
    p.sprite.position.set(p.x, p.y, p.z);
    p.sprite.material.opacity = a;
    p.sprite.scale.setScalar(0.1 + a * 0.36);
    if (p.life <= 0) p.sprite.material.opacity = 0;
  });
}

/* Rayo de ataque del guardián */
var bolt = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
  new THREE.LineBasicMaterial({ color: color(palette.violet), transparent: true, opacity: 0, blending: THREE.AdditiveBlending })
);
bolt.visible = false;
scene.add(bolt);
var boltTimer = 0;
function guardianAttackVisual() {
  if (!guardian) return;
  var from = arenaWorld(duelPositions.guardian).add(new THREE.Vector3(0, 2.2, 0));
  var to = arenaWorld(duelPositions.hero).add(new THREE.Vector3(0, 1.4, 0));
  var pts = [];
  for (var i = 0; i < 6; i++) {
    var t = i / 5;
    pts.push(new THREE.Vector3(
      lerp(from.x, to.x, t) + (i > 0 && i < 5 ? (Math.random() - 0.5) * 0.6 : 0),
      lerp(from.y, to.y, t) + (i > 0 && i < 5 ? (Math.random() - 0.5) * 0.6 : 0),
      lerp(from.z, to.z, t) + (i > 0 && i < 5 ? (Math.random() - 0.5) * 0.3 : 0)
    ));
  }
  bolt.geometry.dispose();
  bolt.geometry = new THREE.BufferGeometry().setFromPoints(pts);
  bolt.material.color.set(guardian.accent);
  bolt.visible = true;
  bolt.material.opacity = 0.85;
  boltTimer = 0.26;
  guardian.attackTimer = 0.45;
}
function updateBolt(dt) {
  if (boltTimer > 0) {
    boltTimer -= dt;
    bolt.material.opacity = Math.max(0, boltTimer / 0.26) * 0.9;
    if (boltTimer <= 0) bolt.visible = false;
  }
}

/* -------------------------------------------------------------------------
   Cámara
   ------------------------------------------------------------------------- */
var duelPositions = {
  hero: new THREE.Vector3(-2.45, 0, -0.35),
  guardian: new THREE.Vector3(2.45, 0, -0.45)
};
function arenaWorld(local) {
  return local.clone().add(new THREE.Vector3(ARENA_POS.x, 0, ARENA_POS.z));
}

/* -------------------------------------------------------------------------
   Efectos de duelo: luz, proyectiles y escudos
   ------------------------------------------------------------------------- */
var heroShield = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.3, 1),
  new THREE.MeshBasicMaterial({ color: color('#7aa2ff'), wireframe: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })
);
heroShield.position.copy(duelPositions.hero);
heroShield.position.y = 1.25;
arenaGroup.add(heroShield);
var heroShieldPulse = 0;
var projectileEffects = [];
var arcEffects = [];
var pulseEffects = [];

function pulseHeroShield(hex) {
  heroShield.material.color.set(hex || '#9ebdff');
  heroShieldPulse = 1;
}
function spawnLightProjectile(from, to, hex, onArrive) {
  var group = new THREE.Group();
  var core = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), new THREE.MeshBasicMaterial({ color: color(hex) }));
  var glow = makeGlowSprite(hex, 1.4, 0.75);
  group.add(core, glow);
  group.position.copy(from);
  scene.add(group);
  projectileEffects.push({ group: group, from: from.clone(), to: to.clone(), t: 0, duration: 0.34, onArrive: onArrive || null, color: hex });
}
function spawnSlashArc(hex) {
  var geo = new THREE.RingGeometry(0.76, 1.12, 24, 1, 0.2, 1.5);
  var mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: color(hex), transparent: true, opacity: 0.56, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  var p = arenaWorld(duelPositions.hero);
  mesh.position.set(p.x + 0.26, 1.45, p.z + 0.34);
  mesh.quaternion.copy(camera.quaternion);
  mesh.rotateZ(-0.6);
  scene.add(mesh);
  arcEffects.push({ mesh: mesh, life: 0.26, max: 0.26, spin: 1.7 });
}
function spawnPulse(point, hex, scale) {
  var sprite = makeGlowSprite(hex, (scale || 1.2) * 0.5, 0.95);
  sprite.position.copy(point);
  scene.add(sprite);
  pulseEffects.push({ sprite: sprite, life: 0.5, max: 0.5, size: scale || 1.2 });
}
function impactGuardian(hex) {
  if (!guardian) return;
  var p = arenaWorld(duelPositions.guardian);
  guardian.shieldPulse = 0.9;
  guardian.hurtTimer = 0.46;
  cameraShake = Math.max(cameraShake, 0.16);
  spawnSparksAt(p.clone().add(new THREE.Vector3(0, guardian.height * 0.58, 0)), hex, 18);
  spawnPulse(p.clone().add(new THREE.Vector3(0, guardian.height * 0.55, 0)), hex, 2.1);
  tone(820, 0.14, 'triangle', 0.025, 1140);
}
function clearCombatEffects() {
  projectileEffects.forEach(function (e) {
    scene.remove(e.group);
    disposeObject(e.group);
  });
  projectileEffects = [];
  arcEffects.forEach(function (e) {
    scene.remove(e.mesh);
    if (e.mesh.geometry) e.mesh.geometry.dispose();
    if (e.mesh.material) e.mesh.material.dispose();
  });
  arcEffects = [];
  pulseEffects.forEach(function (e) {
    scene.remove(e.sprite);
    if (e.sprite.material) e.sprite.material.dispose();
  });
  pulseEffects = [];
  heroShieldPulse = 0;
  heroShield.material.opacity = 0;
  bolt.visible = false;
  boltTimer = 0;
}
function updateCombatEffects(dt) {
  for (var i = projectileEffects.length - 1; i >= 0; i--) {
    var e = projectileEffects[i];
    e.t += dt / e.duration;
    var t = Math.min(1, e.t);
    var ease = t * t * (3 - 2 * t);
    e.group.position.lerpVectors(e.from, e.to, ease);
    e.group.position.y += Math.sin(t * Math.PI) * 0.55;
    e.group.rotation.x += dt * 8;
    e.group.rotation.y += dt * 11;
    if (t >= 1) {
      if (e.onArrive) e.onArrive();
      scene.remove(e.group);
      disposeObject(e.group);
      projectileEffects.splice(i, 1);
    }
  }
  for (var a = arcEffects.length - 1; a >= 0; a--) {
    var arc = arcEffects[a];
    arc.life -= dt;
    var at = Math.max(0, arc.life / arc.max);
    arc.mesh.material.opacity = at * 0.52;
    arc.mesh.scale.setScalar(1 + (1 - at) * 0.6);
    arc.mesh.rotateZ(dt * arc.spin);
    if (arc.life <= 0) {
      scene.remove(arc.mesh);
      arc.mesh.geometry.dispose();
      arc.mesh.material.dispose();
      arcEffects.splice(a, 1);
    }
  }
  for (var p = pulseEffects.length - 1; p >= 0; p--) {
    var pulse = pulseEffects[p];
    pulse.life -= dt;
    var pt = Math.max(0, pulse.life / pulse.max);
    pulse.sprite.material.opacity = pt * 0.8;
    pulse.sprite.scale.setScalar(pulse.size * (0.5 + (1 - pt) * 1.5));
    if (pulse.life <= 0) {
      scene.remove(pulse.sprite);
      pulse.sprite.material.dispose();
      pulseEffects.splice(p, 1);
    }
  }
  heroShieldPulse = Math.max(0, heroShieldPulse - dt * 1.8);
  if (arenaGroup.visible) {
    heroShield.visible = heroShieldPulse > 0.01;
    heroShield.material.opacity = 0.05 + heroShieldPulse * 0.5;
    heroShield.scale.setScalar(1 + heroShieldPulse * 0.18);
    heroShield.rotation.y += dt * 0.8;
    heroShield.rotation.x += dt * 0.3;
  } else {
    heroShield.visible = false;
  }
  updateBolt(dt);
}
function configureMissionStage(areaId) {
  var area = AREA_BY_ID[areaId] || CAMP.areas[0];
  arenaRuneMat.color.set(area.accent);
  arenaRune2.material.color.set(area.accent);
  arenaLight.color.set(area.accent);
  arenaGlow.material.color.set(area.accent);
  arenaBackRing.material.color.set(area.accent);
  return area;
}
function beginDuelStage(areaId) {
  clearCombatEffects();
  var area = configureMissionStage(areaId);
  if (guardian) { disposeObject(guardian.root); guardian = null; }
  guardian = buildGuardian(area.id);
  guardian.root.position.copy(duelPositions.guardian);
  /* Tres cuartos hacia la cámara: se ve la máscara del guardián, no su perfil. */
  guardian.root.rotation.y = -0.58;
  arenaGroup.add(guardian.root);
  arenaGroup.visible = true;
  hubGroup.visible = false;
  if (heroAvatar) {
    heroHolder.remove(heroAvatar.root);
    arenaGroup.add(heroAvatar.root);
    heroAvatar.root.position.copy(duelPositions.hero);
    heroAvatar.root.rotation.y = Math.atan2(duelPositions.guardian.x - duelPositions.hero.x, duelPositions.guardian.z - duelPositions.hero.z);
    heroShield.material.color.set(heroAvatar.look.accent);
  }
  heroShield.position.set(duelPositions.hero.x, 1.25, duelPositions.hero.z);
  heroShield.visible = false;
  heroShieldPulse = 0;
  arenaHeroShadow.visible = true;
  arenaHeroShadow.position.copy(duelPositions.hero);
  arenaHeroShadow.position.y = 0.015;
  duelCamIntro = 0;
  cameraMode = 'duel';
  view = 'duel';
}
function endDuelStage() {
  clearCombatEffects();
  if (guardian) { disposeObject(guardian.root); guardian = null; }
  arenaGroup.visible = false;
  hubGroup.visible = true;
  if (heroAvatar) {
    arenaGroup.remove(heroAvatar.root);
    heroHolder.add(heroAvatar.root);
    heroAvatar.root.position.set(0, 0, 0);
    heroAvatar.root.rotation.y = hubHero.facing;
  }
  arenaHeroShadow.visible = false;
  heroShield.visible = false;
  cameraMode = 'hub';
  view = 'hub';
  cameraShake = 0;
  bolt.visible = false;
}
function placeCamera(dt, time) {
  if (!renderer) return;
  if (cameraMode === 'title') {
    titleTime += dt;
    var drift = Math.sin(titleTime * 0.055) * 0.35;
    var wanted = new THREE.Vector3(hubHero.x - 7.6 + drift, 5.1 + Math.sin(titleTime * 0.2) * 0.18, hubHero.z + 10.6);
    camera.position.lerp(wanted, Math.min(1, dt * 2.0));
    camera.lookAt(hubHero.x - 2.8, 1.45, hubHero.z - 1.0);
    scene.fog.near = 24; scene.fog.far = 70;
  } else if (cameraMode === 'duel') {
    var dx = ARENA_POS.x, dz = ARENA_POS.z;
    var shake = cameraShake > 0 ? cameraShake * 0.5 : 0;
    cameraShake = Math.max(0, cameraShake - dt);
    duelCamIntro = Math.min(1, duelCamIntro + dt * 0.54);
    var introEase = 1 - Math.pow(1 - duelCamIntro, 3);
    var camDist = lerp(14.2, 9.85, introEase);
    var camHeight = lerp(7.8, 5.65, introEase);
    var wanted2 = new THREE.Vector3(dx + 0.7 + (Math.random() - 0.5) * shake, camHeight + (Math.random() - 0.5) * shake, dz + camDist);
    camera.position.lerp(wanted2, Math.min(1, dt * 2.5));
    camera.lookAt(dx, lerp(2.45, 1.8, introEase), dz - 0.35);
    scene.fog.near = 18; scene.fog.far = 58;
  } else {
    var hx = hubHero.x, hz = hubHero.z;
    var wanted3 = new THREE.Vector3(hx + 0.2, 12.2, hz + 14.0);
    camera.position.lerp(wanted3, Math.min(1, dt * 3.6));
    camera.lookAt(hx, 1.1, hz - 2.0);
    scene.fog.near = 20; scene.fog.far = 64;
  }
  var focus = cameraMode === 'duel' ? ARENA_POS : (cameraMode === 'title' ? new THREE.Vector3(0, 0, 0) : new THREE.Vector3(hubHero.x, 0, hubHero.z));
  moonLight.position.set(focus.x - 8, 17, focus.z + 11);
  moonLight.target.position.set(focus.x, 0, focus.z);
  rimLight.position.set(focus.x - 10, 7, focus.z - 8);
  rimLight.target.position.set(focus.x, 0, focus.z);
  starField.position.set(camera.position.x * 0.5, camera.position.y * 0.1, camera.position.z * 0.5);
  moon.position.set(camera.position.x - 45, 44, camera.position.z - 100);
  hubGlow.position.set(0, 1.4, 0);
}
function resizeRenderer() {
  if (!renderer) return;
  var width = window.innerWidth || 1, height = window.innerHeight || 1;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resizeRenderer);
resizeRenderer();

/* -------------------------------------------------------------------------
   Retratos generados desde los mismos modelos
   ========================================================================= */
var portraitRenderer = null;
var portraitCache = {};
function ensurePortraitRenderer() {
  if (portraitRenderer) return portraitRenderer;
  var c = document.createElement('canvas');
  portraitRenderer = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true, preserveDrawingBuffer: true });
  portraitRenderer.setPixelRatio(1);
  portraitRenderer.setClearColor(0x000000, 0);
  portraitRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  portraitRenderer.toneMappingExposure = 1.15;
  portraitRenderer.outputColorSpace = THREE.SRGBColorSpace;
  return portraitRenderer;
}
function renderHeroPortrait(id, size, outfitOverride) {
  var s = size || 320;
  var explicit = outfitOverride !== undefined;
  var outfit = explicit ? (outfitOverride || {}) : (typeof getCharacterOutfit === 'function' ? getCharacterOutfit(id) : {});
  var outfitKey = Object.keys(outfit).sort().map(function (k) { return k + '=' + outfit[k]; }).join(',');
  var cacheKey = id + ':' + s + ':' + outfitKey;
  if (portraitCache[cacheKey]) return portraitCache[cacheKey];
  var r = ensurePortraitRenderer();
  r.setSize(s, s, false);
  var stage = new THREE.Scene();
  stage.add(new THREE.HemisphereLight('#b6c6ff', '#30222c', 1.9));
  var key = new THREE.DirectionalLight('#ffe2c4', 2.3);
  key.position.set(-3, 6, 5);
  stage.add(key);
  var fill = new THREE.DirectionalLight('#7ba6ff', 1.1);
  fill.position.set(4, 3, -3);
  stage.add(fill);
  var avatar = buildHeroAvatar(id);
  if (typeof applyOutfitToAvatar === 'function') applyOutfitToAvatar(avatar, id, outfit);
  var look = heroLook(id);
  /* Pose de presentación: el arma se separa de la silueta y queda visible en la mano. */
  avatar.root.rotation.y = -0.46;
  avatar.body.rotation.y = -0.04;
  avatar.head.rotation.y = 0.16;
  avatar.head.rotation.z = -0.012;
  avatar.rightArm.rotation.x = -0.18;
  avatar.rightArm.rotation.z = 0.94;
  avatar.rightArm.rotation.y = -0.05;
  avatar.weapon.rotation.z = -0.88;
  avatar.weapon.rotation.x = 0.06;
  avatar.weapon.position.z = 0.12;
  avatar.leftArm.rotation.x = -0.12;
  avatar.leftArm.rotation.z = -0.16;
  avatar.leftLeg.rotation.x = 0.04;
  avatar.rightLeg.rotation.x = -0.05;
  if (id === 'lia') {
    avatar.rightArm.rotation.x = -0.06;
    avatar.rightArm.rotation.z = 1.15;
    avatar.weapon.scale.setScalar(1.16);
  } else if (id === 'ona') {
    avatar.rightArm.rotation.z = 1.06;
    avatar.weapon.scale.setScalar(1.08);
  } else if (id === 'mara' || id === 'teo' || id === 'zenon' || id === 'iris') {
    avatar.rightArm.rotation.z = 0.82;
    avatar.weapon.rotation.z = -0.78;
  } else if (id === 'kian') {
    avatar.rightArm.rotation.x = 0.08;
    avatar.rightArm.rotation.z = 1.12;
    avatar.weapon.rotation.z = -1.04;
  }
  if (avatar.cape) avatar.cape.rotation.x = -0.06;
  if (avatar.hairTail) avatar.hairTail.rotation.x = 0.04;
  stage.add(avatar.root);
  var ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.018, 4, 40), new THREE.MeshBasicMaterial({ color: color(look.accent), transparent: true, opacity: 0.5 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.03;
  ring.scale.set(1.1, 1.1, 1);
  stage.add(ring);
  var glow = makeGlowSprite(look.accent, 3.6, 0.12);
  glow.position.y = 1.4;
  stage.add(glow);
  var box = new THREE.Box3().setFromObject(avatar.root);
  var center = box.getCenter(new THREE.Vector3());
  var extent = box.getSize(new THREE.Vector3());
  var cam = new THREE.PerspectiveCamera(25, 1, 0.1, 100);
  var dist = Math.max(extent.y / (2 * Math.tan(12.5 * Math.PI / 180)), extent.x * 1.35) * 1.12;
  cam.position.set(center.x + dist * 0.3, center.y + extent.y * 0.1, center.z + dist * 1.02);
  cam.lookAt(center.x, center.y - extent.y * 0.01, center.z);
  r.render(stage, cam);
  var data = r.domElement.toDataURL('image/png');
  portraitCache[cacheKey] = data;
  disposeObject(avatar.root);
  ring.geometry.dispose();
  ring.material.dispose();
  return data;
}
function renderSlots(size) {
  var out = {};
  var px = size || 256;
  Object.keys(HERO_SLOTS).forEach(function (slot) {
    var heroId = HERO_SLOTS[slot];
    if (GAME.slots && GAME.slots[slot] && GAME.slots[slot].custom && GAME.assets && GAME.assets[slot]) return;
    try { out[slot] = renderHeroPortrait(heroId, px); } catch (e) { reportError('retrato ' + heroId + ': ' + (e.message || e)); }
  });
  return out;
}
window.__renderSlots = renderSlots;

/* -------------------------------------------------------------------------
   Estado del motor de UI que depende del 3D
   ------------------------------------------------------------------------- */
function rebuildWorldSelection() {
  if (!heroAvatar) return;
  var id = state.collection.selectedCharacterId;
  if (heroAvatar.id !== id) {
    var root = heroAvatar.root;
    var isInArena = root.parent === arenaGroup;
    disposeObject(root);
    heroAvatar = buildHeroAvatar(id);
    if (typeof applyOutfitToAvatar === 'function') applyOutfitToAvatar(heroAvatar, id);
    if (isInArena) {
      arenaGroup.add(heroAvatar.root);
      heroAvatar.root.position.copy(duelPositions.hero);
      heroAvatar.root.rotation.y = Math.atan2(duelPositions.guardian.x - duelPositions.hero.x, duelPositions.guardian.z - duelPositions.hero.z);
    } else {
      heroHolder.add(heroAvatar.root);
      heroAvatar.root.position.set(hubHero.x, 0, hubHero.z);
      heroAvatar.root.rotation.y = hubHero.facing;
    }
    syncHudPortrait();
  }
}

/* =========================================================================
   INTERFAZ — HUD, título, bitácora, héroes, repaso, importación y pausa
   ========================================================================= */
var sheetReturn = 'hub';
var pauseReturn = 'hub';
var recruitHeroId = null;
var resetArmedUntil = 0;
var abandonArmedUntil = 0;
var importError = '';
var portraitQueue = [];
var portraitTimer = null;

function hasProgress() {
  return state.xp > 0 || state.coins > 0 || Object.keys(state.missions).length > 0 || Object.keys(state.questions).length > 0 || !!state.importedAt;
}
function totalMissionsDone() {
  return Object.keys(state.missions).filter(function (id) { return state.missions[id] && state.missions[id].completedAt; }).length;
}
function recommendedSubtitle(m) {
  if (!m) return '';
  return m.subtitle + ' · ' + m.questionCount + ' preguntas · ' + m.tierLabel;
}
function dueCount() { return dueErrors().length; }
function formatXP(value) { return formatNumber(value) + ' XP'; }
function missionTypeLabel(m) { return m.kind === 'boss' ? 'Jefe de ruta' : 'Misión de ruta'; }
function equippedSummary() {
  return Object.keys(state.collection.equipped || {}).reduce(function (n, id) {
    return n + Object.keys(state.collection.equipped[id] || {}).length;
  }, 0);
}

function mountHud() {
  EL.hud.innerHTML = '' +
    '<button type="button" class="brand" data-action="open-pause" aria-label="Abrir pausa y menú">' +
      '<span class="brandRune">◈</span>' +
      '<span class="brandWords"><b>SERUMS</b><span>Observatorio</span></span>' +
    '</button>' +
    '<button type="button" class="heroChip" data-action="open-heroes" aria-label="Cambiar de héroe">' +
      '<span class="heroAvatar"><img data-hud-portrait alt="" /></span>' +
      '<span class="heroChipCopy"><span class="heroChipName"><b data-hud-hero>Ilan Vega</b><small data-hud-level>Nv 1</small></span>' +
        '<span class="heroChipMeta"><span data-hud-rank>Bachiller</span><span class="bar xp"><i data-hud-xp></i></span><em data-hud-xpnum>0 XP</em></span>' +
        '<span class="heroChipTitle" data-hud-title></span>' +
      '</span>' +
    '</button>' +
    '<div class="hudCenter"><span id="hudEyebrow">Observatorio de las Cinco Rutas</span><b id="hudLocation">Atrio de las rutas</b></div>' +
    '<div class="hudActions">' +
      '<span class="hudResource" title="Monedas de estudio">' + icon('coin', 14) + '<b data-hud-coins>0</b></span>' +
      '<button type="button" class="iconBtn" data-action="open-review" aria-label="Repaso de errores" title="Repaso de errores">' + icon('rotate', 17) + '<span class="badgeDot hidden" data-hud-due>0</span></button>' +
      '<button type="button" class="hudLabel" data-action="open-journal">' + icon('map', 15) + '<span>Bitácora</span></button>' +
      '<button type="button" class="iconBtn" data-action="open-wardrobe" aria-label="Inventario de cosméticos" title="Inventario">' + icon('layers', 17) + '</button>' +
      '<button type="button" class="iconBtn" data-action="open-shop" aria-label="Tienda de cosméticos" title="Tienda">' + icon('bag', 17) + '</button>' +
      '<button type="button" class="iconBtn" data-action="open-heroes" aria-label="Héroes" title="Héroes">' + icon('user', 17) + '</button>' +
      '<button type="button" class="iconBtn" data-action="toggle-sound" aria-label="Sonido" title="Sonido" data-hud-sound>' + icon('sound', 17) + '</button>' +
      '<button type="button" class="iconBtn" data-action="open-pause" aria-label="Pausa" title="Pausa">' + icon('pause', 17) + '</button>' +
    '</div>';
}

function syncHudPortrait() {
  if (!EL.hud || !EL.hud.querySelector) return;
  var img = EL.hud.querySelector('[data-hud-portrait]');
  if (!img) return;
  var id = state.collection.selectedCharacterId;
  if (screen === 'title' || screen === 'boot') return;
  var generated = renderHeroPortrait(id, 200);
  if (generated) img.src = generated;
  var frameColor = typeof frameColorFor === 'function' ? frameColorFor(id) : '';
  var holder = img.parentElement;
  if (holder) holder.style.boxShadow = frameColor ? '0 0 0 2px ' + frameColor + ', 0 0 18px ' + frameColor + '66' : '';
}
function syncHUD() {
  if (!EL.hud) return;
  var visible = screen === 'hub';
  EL.hud.classList.toggle('hidden', !visible);
  EL.hintRow.classList.toggle('hidden', !visible);
  EL.tracker.classList.toggle('hidden', !visible);
  EL.touchControls.classList.toggle('hidden', !visible);
  EL.touchAction.classList.toggle('hidden', !visible || !currentInteract);
  if (!visible) { EL.prompt.classList.add('hidden'); return; }
  var char = selectedCharacter();
  var level = levelAt(state.xp);
  var rank = currentRank();
  var heroEl = EL.hud.querySelector('[data-hud-hero]');
  if (heroEl) heroEl.textContent = char.name;
  var levelEl = EL.hud.querySelector('[data-hud-level]');
  if (levelEl) levelEl.textContent = 'Nv ' + level.level;
  var rankEl = EL.hud.querySelector('[data-hud-rank]');
  if (rankEl) rankEl.textContent = rank.name;
  var titleEl = EL.hud.querySelector('[data-hud-title]');
  if (titleEl) {
    var title = typeof titleText === 'function' ? titleText(char.id) : '';
    titleEl.textContent = title ? '«' + title + '»' : '';
    titleEl.classList.toggle('hidden', !title);
  }
  var xpEl = EL.hud.querySelector('[data-hud-xp]');
  if (xpEl) xpEl.style.width = level.percent + '%';
  var xpNum = EL.hud.querySelector('[data-hud-xpnum]');
  if (xpNum) xpNum.textContent = level.maxed ? 'Nivel máximo' : formatXP(state.xp);
  var coinsEl = EL.hud.querySelector('[data-hud-coins]');
  if (coinsEl) coinsEl.textContent = formatNumber(state.coins);
  var due = dueCount();
  var badge = EL.hud.querySelector('[data-hud-due]');
  if (badge) { badge.textContent = due > 9 ? '9+' : String(due); badge.classList.toggle('hidden', due <= 0); }
  var soundBtn = EL.hud.querySelector('[data-hud-sound]');
  if (soundBtn) soundBtn.innerHTML = icon(state.settings.sound ? 'sound' : 'soundOff', 17);
  var locationEl = document.getElementById('hudLocation');
  if (locationEl) locationEl.textContent = currentInteract && currentInteract.type === 'gate' ? currentInteract.gate.area.short : (currentInteract && currentInteract.type === 'oracle' ? 'Atrio de las rutas' : 'Observatorio');
  syncHudPortrait();
  syncTracker();
  if (currentInteract) EL.touchAction.classList.remove('hidden');
}
function syncTracker() {
  if (!EL.tracker) return;
  var due = dueErrors();
  var rec = nextRecommended();
  var body = '';
  if (due.length) {
    body += '<span class="eyebrow"><span class="kickerDot" style="background:var(--amber);box-shadow:0 0 12px var(--amber)"></span>Memoria en espera</span>' +
      '<h3>Tu repaso está listo.</h3>' +
      '<p>' + due.length + ' ' + plural(due.length, 'pregunta vuelve', 'preguntas vuelven') + ' hoy. Un repaso breve consolida lo que falló.</p>' +
      '<button type="button" class="btn btn--gold btn--sm btn--block" data-action="open-review">' + icon('rotate', 14) + ' Repasar ' + due.length + '</button>';
  } else if (rec) {
    var ap = areaProgress(rec.areaId);
    body += '<span class="eyebrow"><span class="kickerDot"></span>Ruta recomendada</span>' +
      '<h3>' + esc(rec.title) + '</h3>' +
      '<p>' + esc(rec.areaShort) + ' · ' + rec.questionCount + ' preguntas · ' + esc(rec.tierLabel) + '</p>' +
      '<div class="trackerFoot"><div class="bar"><i style="width:' + Math.round(ap.pct * 100) + '%;background:' + rec.accent + '"></i></div><small>' + ap.done + '/' + ap.total + ' de la ruta</small></div>' +
      '<button type="button" class="btn btn--primary btn--sm btn--block trackerAction" data-action="open-mission" data-area="' + esc(rec.areaId) + '" data-mission="' + esc(rec.id) + '">' + icon('play', 13) + ' Abrir ' + (rec.kind === 'boss' ? 'el jefe' : 'la misión') + '</button>';
  } else {
    body += '<span class="eyebrow"><span class="kickerDot" style="background:var(--teal);box-shadow:0 0 12px var(--teal)"></span>Campaña completada</span>' +
      '<h3>Las cinco rutas están selladas.</h3>' +
      '<p>Puedes repasar errores, subir el dominio de las preguntas o recorrer de nuevo una ruta.</p>' +
      '<button type="button" class="btn btn--sm btn--block" data-action="open-journal">' + icon('book', 14) + ' Abrir bitácora</button>';
  }
  if (totalMissionsDone() > 0) {
    body += '<div class="sectionDivider" style="margin:10px 0"></div>' +
      '<div class="trackerFoot"><small>' + totalMissionsDone() + '/18 nodos completados</small><small class="dueTag">' + plural(due.length, 'repaso', 'repasos') + ' · ' + formatPct(state.academic.answered ? overallAccuracy() : 0) + ' precisión</small></div>';
  }
  EL.tracker.innerHTML = '<div class="trackerBody">' + body + '</div>';
}

/* -------------------------------------------------------------------------
   TÍTULO
   ------------------------------------------------------------------------- */
function titleScreenHTML() {
  var char = selectedCharacter();
  var look = selectedLook();
  var lv = levelAt(state.xp);
  var rank = currentRank();
  var due = dueCount();
  var rec = nextRecommended();
  var progress = hasProgress();
  var asideTitle = due > 0 ? 'La memoria primero' : (rec ? rec.title : 'Todas las rutas abiertas');
  var asideText = due > 0
    ? 'Hay ' + due + ' ' + plural(due, 'pregunta esperando', 'preguntas esperando') + ' su próximo repaso. El observatorio conserva cada error para convertirlo en criterio.'
    : (rec ? rec.areaShort + ' · ' + rec.subtitle + '. Tu siguiente paso ya está marcado en la bitácora.' : 'Has recorrido las cinco islas. El atlas queda abierto para repetir, repasar y cuidar lo aprendido.');
  var importedPill = state.importedAt ? '<span class="pill pill--teal">' + icon('upload', 12) + ' Partida importada</span>' : '';
  return '<div class="titleScreen" data-action="enter-game">' +
    '<div class="titleInner">' +
      '<div class="titleTop">' +
        '<div class="titleBrand"><span class="titleBrandMark">✧</span><span class="titleBrandText"><b>SERUMS QUEST</b><span>Observatorio de las cinco rutas</span></span></div>' +
        '<div style="display:flex;align-items:center;gap:8px"><span class="titleVersion">' + esc(APP_VERSION) + '</span><button type="button" class="iconBtn" data-action="toggle-sound" title="Sonido" aria-label="Sonido">' + icon(state.settings.sound ? 'sound' : 'soundOff', 16) + '</button></div>' +
      '</div>' +
      '<div class="titleMain">' +
        '<div class="titleCopy">' +
          '<div class="titlePrelude"><span class="line"></span>Un RPG de criterio y memoria</div>' +
          '<h1 class="gameTitle"><span class="lineOne">SERUMS</span><span class="lineTwo">QUEST</span></h1>' +
          '<p class="titleQuestion">Cinco islas. Diez voces.<br /><em>Una sola forma de avanzar.</em></p>' +
          '<p class="titleLead">Recorre el observatorio, entra en cada ruta y afronta los guardianes respondiendo las preguntas que sostienen tu criterio. Las respuestas abren caminos; los errores vuelven cuando toca recordarlos.</p>' +
          '<div class="titleActions">' +
            '<button type="button" class="btn btn--primary btn--lg" data-action="enter-game">' + icon('play', 16) + (progress ? ' Continuar en el observatorio' : ' Entrar al observatorio') + icon('chevronRight', 15) + '</button>' +
            '<button type="button" class="btn btn--ghost btn--lg" data-action="open-import">' + icon('upload', 16) + ' Importar mi partida</button>' +
          '</div>' +
          '<div class="titleStats">' +
            '<span class="pill"><span style="color:var(--teal)">◈</span> Nv <b>' + lv.level + '</b></span>' +
            '<span class="pill"><span style="color:var(--violet)">✦</span> <b>' + esc(rank.name) + '</b></span>' +
            '<span class="pill">' + icon('checkCircle', 11) + ' <b>' + totalMissionsDone() + '</b>/18 nodos</span>' +
            '<span class="pill ' + (due ? 'pill--due' : '') + '">' + icon('rotate', 11) + ' <b>' + due + '</b> ' + plural(due, 'repaso pendiente', 'repasos pendientes') + '</span>' +
            importedPill +
          '</div>' +
        '</div>' +
        '<div class="titleHeroStage" style="--hero-accent:' + look.accent + '">' +
          '<div class="titleHeroHalo"></div>' +
          '<div class="titleHeroOrbit"></div>' +
          '<img class="titleHeroImg" src="' + renderHeroPortrait(char.id, 460) + '" alt="' + esc(char.name) + ' en el observatorio" />' +
          '<div class="titleHeroPlaque">' +
            '<span class="eyebrow noRule" style="color:' + look.accent + '">Tu guía en esta ruta</span>' +
            '<b>' + esc(char.name) + '</b>' +
            '<small>' + esc(look.klass) + ' · ' + esc(look.weapon) + '</small>' +
            '<p>“' + esc(char.quote) + '”</p>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="titleFooter"><span><kbd>ENTER</kbd> abrir el observatorio <span style="opacity:.45">·</span> <kbd>M</kbd> bitácora <kbd>R</kbd> repaso</span><span>Progreso guardado en este navegador · sin conexión</span></div>' +
    '</div>' +
  '</div>';
}

/* -------------------------------------------------------------------------
   BITÁCORA
   ------------------------------------------------------------------------- */
function selectedMissionForArea() {
  var list = areaMissions(selectedAreaId);
  if (!selectedMissionId || !list.some(function (m) { return m.id === selectedMissionId; })) {
    var first = list.find(function (m) { return missionUnlockInfo(m).unlocked && !missionCompleted(m.id); }) || list[0];
    selectedMissionId = first ? first.id : null;
  }
  return MISSION_BY_ID[selectedMissionId] || null;
}
function journalScreenHTML() {
  var area = AREA_BY_ID[selectedAreaId] || CAMP.areas[0];
  var ap = areaProgress(area.id);
  var missions = areaMissions(area.id);
  var selected = selectedMissionForArea();
  var level = currentLevel();
  var areaTabs = CAMP.areas.map(function (a) {
    var p = areaProgress(a.id);
    return '<button type="button" class="areaTab ' + (a.id === area.id ? 'is-active' : '') + '" style="--area:' + a.accent + '" data-action="select-area" data-area="' + esc(a.id) + '">' +
      '<span class="areaTabTop"><span class="areaTabDot"></span><b>' + esc(a.short) + '</b></span>' +
      '<small>' + p.done + '/' + p.total + ' nodos</small>' +
      '<span class="miniBar"><i style="width:' + Math.round(p.pct * 100) + '%"></i></span>' +
    '</button>';
  }).join('');
  var nodes = missions.map(function (m) {
    var u = missionUnlockInfo(m);
    var done = missionCompleted(m.id);
    var cls = 'nodeRow ' + (done ? 'is-completed ' : '') + (!u.unlocked ? 'is-locked ' : '') + (m.id === (selected && selected.id) ? 'is-active ' : '') + (m.kind === 'boss' ? 'is-boss' : '');
    var status = done ? '<span class="chip chip--completed">Hecha</span>' : (u.unlocked ? '<span class="chip chip--accent">Disponible</span>' : '<span class="chip">Bloqueada</span>');
    return '<button type="button" class="' + cls.trim() + '" style="--area:' + m.accent + '" data-action="select-mission" data-mission="' + esc(m.id) + '">' +
      '<span class="nodeIndex">' + (m.kind === 'boss' ? '♛' : m.index) + '</span>' +
      '<span class="nodeCopy"><b>' + esc(m.title) + '</b><small>' + esc(m.subtitle) + ' · ' + m.questionCount + ' preguntas</small></span>' +
      '<span class="nodeSide">' + status + (u.unlocked ? '<span class="nodeChev">' + icon('chevronRight', 12) + '</span>' : '<span class="nodeLock">' + icon('lock', 11) + '</span>') + '</span>' +
    '</button>';
  }).join('');
  var detail = '';
  if (selected) {
    var u = missionUnlockInfo(selected);
    var done = missionCompleted(selected.id);
    var record = state.missions[selected.id] || {};
    var reqs = u.requirements.map(function (r) {
      return '<div class="req ' + (r.met ? 'is-met' : '') + '">' + icon(r.met ? 'check' : 'lock', 11) + '<span>' + esc(r.label) + (r.need > 1 ? ' · ' + r.have + '/' + r.need : '') + '</span></div>';
    }).join('');
    var startLabel = done ? 'Repetir ' + (selected.kind === 'boss' ? 'jefe' : 'ruta') : (selected.kind === 'boss' ? 'Afrontar al guardián' : 'Comenzar la ruta');
    var cta = u.unlocked
      ? '<button type="button" class="btn ' + (done ? 'btn--ghost' : 'btn--primary') + ' btn--block" data-action="start-mission" data-mission="' + esc(selected.id) + '">' + icon('play', 15) + ' ' + esc(startLabel) + '</button>'
      : '<button type="button" class="btn btn--block" disabled>' + icon('lock', 14) + ' Aún bloqueada</button>';
    var unlockNote = u.unlocked
      ? (done ? 'Ya completada. Puedes repetirla; la recompensa de cierre no se duplica.' : 'Todos los requisitos están cumplidos.')
      : 'Completa los requisitos para abrir este nodo.';
    detail = '<div class="detailAccent" style="--accent:' + selected.accent + '"></div>' +
      '<span class="eyebrow noRule" style="color:' + selected.accent + '">' + (selected.kind === 'boss' ? 'Guardián de la ruta' : 'Nodo ' + selected.index + ' · ' + esc(area.short)) + '</span>' +
      '<h2>' + esc(selected.title) + '</h2>' +
      '<p class="subtitle">' + esc(selected.subtitle) + '</p>' +
      '<div class="detailTags"><span class="chip">' + esc(selected.tierLabel) + '</span><span class="chip">' + selected.questionCount + ' preguntas</span>' + (done ? '<span class="chip chip--completed">' + icon('check', 10) + ' Completada</span>' : '') + (selected.feedback === 'diferida' ? '<span class="chip chip--gold">Clave al final</span>' : '') + '</div>' +
      '<p class="detailDesc">' + esc(selected.description) + '</p>' +
      '<div class="rewardList">' +
        '<div class="rewardLine"><span>' + icon('spark', 13) + ' Por acierto</span><b>' + (selected.kind === 'boss' ? '20–50' : selected.rewards.questionXp) + ' XP</b></div>' +
        '<div class="rewardLine"><span>' + icon('award', 13) + ' Cierre de ruta</span><b>+' + selected.rewards.xp + ' XP</b></div>' +
        '<div class="rewardLine"><span>' + icon('coin', 13) + ' Monedas de cierre</span><b>+' + selected.rewards.coins + '</b></div>' +
        (done ? '<div class="rewardLine"><span>' + icon('chart', 13) + ' Mejor precisión</span><b>' + Math.round((record.bestAccuracy || 0) * 100) + '%</b></div>' : '') +
      '</div>' +
      (reqs ? '<div class="reqList">' + reqs + '</div>' : '') +
      '<div class="detailActions">' + cta + '<button type="button" class="btn btn--ghost btn--sm btn--block" data-action="open-review">' + icon('rotate', 13) + ' Revisar errores' + (dueCount() ? ' (' + dueCount() + ')' : '') + '</button></div>' +
      '<p class="detailFootnote">' + esc(unlockNote) + '</p>';
  } else {
    detail = '<div class="emptyState"><div>' + icon('map', 28) + '</div><h3>Ruta sin nodos activos</h3><p>Esta isla todavía no tiene misiones jugables.</p></div>';
  }
  var completeAreas = CAMP.areas.filter(function (a) { return areaProgress(a.id).pct >= 1; }).length;
  return '<div class="overlay"><div class="overlayShell">' +
    '<div class="sheetHead">' +
      '<div><span class="eyebrow"><span class="kickerDot"></span>Bitácora de campaña</span><h1>Las cinco rutas, <em>un paso a la vez.</em></h1><p>18 nodos, cinco guardianes y una memoria que se construye respondiendo. Elige una isla y lee lo que exige su siguiente tramo.</p></div>' +
      '<div class="sheetHeadSide"><span class="chip">Etapa ' + state.stage + '/4 · ' + esc(stageInfo().name) + '</span><span class="chip">' + completeAreas + '/5 islas completas</span><button type="button" class="sheetClose" data-action="close-sheet" aria-label="Volver al observatorio">' + icon('close', 17) + '</button></div>' +
    '</div>' +
    '<div class="atlasGrid">' +
      '<aside><div class="areaList">' + areaTabs + '</div>' +
        '<div class="areaOverview"><span>Alcance del atlas</span><b>' + totalMissionsDone() + ' de 18 nodos</b><small>' + dueCount() + ' ' + plural(dueCount(), 'repaso pendiente', 'repasos pendientes') + ' · ' + Math.round(overallAccuracy() * 100) + '% de precisión global.</small></div>' +
      '</aside>' +
      '<section class="panel routePanel">' +
        '<div class="routeHead"><div><span class="eyebrow noRule" style="color:' + area.accent + '">Ruta ' + (CAMP.areas.findIndex(function (a) { return a.id === area.id; }) + 1) + ' · ' + esc(area.short) + '</span><h2>' + esc(area.title.replace(/^Área [IV]+ · /, '')) + '</h2><p class="small muted" style="margin:5px 0 0">' + esc(area.blurb) + '</p></div><div><div class="bar progressLine"><i style="width:' + Math.round(ap.pct * 100) + '%;background:' + area.accent + '"></i></div><small class="tiny dim" style="display:block;text-align:right;margin-top:5px">' + ap.done + '/' + ap.total + '</small></div></div>' +
        '<div class="routePath">' + nodes + '</div>' +
      '</section>' +
      '<aside class="panel detailPanel">' + detail + '</aside>' +
    '</div>' +
    '<div class="atlasFooter"><span>La afinidad por área es una guía editorial. Las preguntas y claves provienen del banco oficial de Psicología.</span><span>' + icon('info', 11) + ' Las recompensas de cierre se registran una sola vez.</span></div>' +
  '</div></div>';
}

/* -------------------------------------------------------------------------
   HÉROES
   ------------------------------------------------------------------------- */
function heroCardHTML(char) {
  var look = HERO_LOOKS[char.id];
  var owned = state.collection.ownedCharacterIds.indexOf(char.id) !== -1;
  var active = state.collection.selectedCharacterId === char.id;
  var req = heroRequirementState(char);
  var img = renderHeroPortrait(char.id, 300);
  var title = typeof titleText === 'function' ? titleText(char.id) : '';
  var frameColor = typeof frameColorFor === 'function' ? frameColorFor(char.id) : '';
  var action = owned ? 'data-action="select-hero" data-hero="' + esc(char.id) + '"' : 'data-action="open-recruit" data-hero="' + esc(char.id) + '"';
  var access = !owned
    ? '<span class="chip ' + (req.kind === 'reward' ? 'chip--gold' : '') + '">' + (req.kind === 'reward' ? icon('award', 9) + ' ' + (req.missionsHave || 0) + '/' + req.missionsNeed + ' misiones' : icon('lock', 9) + ' ' + (req.canRecruit ? 'Reclutar' : 'Bloqueado')) + '</span>'
    : (active ? '<span class="chip chip--accent">En ruta</span>' : '<span class="chip chip--completed">' + icon('check', 9) + ' En colección</span>');
  var cta = '';
  if (!owned) {
    if (req.kind === 'reward') {
      cta = '<span class="heroCardCta"><span>' + icon('award', 10) + ' Recompensa de recorrido</span><b>' + req.missionsHave + '/' + req.missionsNeed + '</b></span>';
    } else {
      cta = '<span class="heroCardCta"><span>' + icon('coin', 10) + ' Reclutar con monedas</span><b>◇ ' + formatNumber(req.price) + '</b></span>';
    }
  }
  return '<button type="button" class="heroCard ' + (active ? 'is-active ' : '') + (owned ? '' : 'is-locked') + '" style="--hero-accent:' + look.accent + '" ' + action + '>' +
    '<span class="heroCardTop"><span class="chip">' + esc(char.rarityLabel) + '</span>' + access + '</span>' +
    '<span class="heroPortrait"' + (frameColor ? ' style="box-shadow:0 0 0 1px ' + frameColor + ',0 0 22px ' + frameColor + '55"' : '') + '><img src="' + img + '" alt="Retrato de ' + esc(char.name) + '" /></span>' +
    '<span class="heroCardInfo"><b>' + esc(char.name) + '</b><small>' + esc(look.klass) + ' · ' + esc(look.weapon) + '</small>' + (title ? '<em class="heroCardTitle">«' + esc(title) + '»</em>' : '') + cta + '</span>' +
  '</button>';
}
function heroesScreenHTML() {
  var char = selectedCharacter();
  var look = selectedLook();
  var owned = state.collection.ownedCharacterIds.length;
  return '<div class="overlay"><div class="overlayShell">' +
    '<div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot"></span>Elenco del observatorio</span><h1>Diez formas de mirar <em>un mismo caso.</em></h1><p>Inspecciona tu colección y elige quién camina contigo. La selección se guarda al instante y se refleja en el mundo 3D.</p></div>' +
      '<div class="sheetHeadSide"><span class="chip">' + owned + '/10 héroes</span><span class="chip">' + countOwnedCosmetics() + '/' + countAllCosmetics() + ' cosméticos</span><button type="button" class="sheetClose" data-action="close-sheet" aria-label="Cerrar">' + icon('close', 17) + '</button></div>' +
    '</div>' +
    '<div class="heroToolbar"><span class="chip chip--accent"><span class="ownedMark">✓</span> ' + esc(char.name) + ' en ruta</span><span class="chip">' + esc(look.klass) + '</span><span class="chip">' + esc(look.weapon) + '</span>' + (equippedSummary() ? '<span class="chip">' + equippedSummary() + ' piezas equipadas</span>' : '') + '</div>' +
    '<div class="heroGrid">' + CAMP.characters.map(heroCardHTML).join('') + '</div>' +
    '<div class="heroNote"><p>Los héroes solo cambian la voz, la silueta y la lectura de cada ruta. Ninguno altera preguntas, claves ni recompensas. Toca un héroe bloqueado para consultar su reclutamiento original.</p><button type="button" class="btn btn--ghost btn--sm" data-action="close-sheet">Volver al atrio ' + icon('chevronRight', 12) + '</button></div>' +
    '<div class="atlasFooter"><span>Fase 2 · reglas originales de colección: Ilan inicial, Amaru por 5 misiones, Zenón en nivel 8 y el resto con monedas.</span><span>' + icon('spark', 11) + ' Modelos voxel generados en código.</span></div>' +
  '</div></div>';
}

/* -------------------------------------------------------------------------
   RECLUTAMIENTO DE HÉROES
   ------------------------------------------------------------------------- */
function recruitScreenHTML() {
  var char = CHARACTER_BY_ID[recruitHeroId];
  if (!char) return '';
  var look = HERO_LOOKS[char.id];
  var req = heroRequirementState(char);
  var lv = currentLevel();
  var owned = req.owned;
  var isReward = req.kind === 'reward';
  var can = !owned && req.canRecruit;
  var requirementRows = '';
  if (isReward) {
    requirementRows = '<div class="req ' + (req.canRecruit ? 'is-met' : '') + '">' + icon(req.canRecruit ? 'check' : 'lock', 12) + '<span>Completar ' + req.missionsNeed + ' misiones · ' + req.missionsHave + '/' + req.missionsNeed + '</span></div>';
  } else {
    if (req.levelNeed) requirementRows += '<div class="req ' + (req.levelMet ? 'is-met' : '') + '">' + icon(req.levelMet ? 'check' : 'lock', 12) + '<span>Nivel ' + req.levelNeed + ' · actual ' + lv + '</span></div>';
    requirementRows += '<div class="req ' + (req.coinsMet ? 'is-met' : '') + '">' + icon(req.coinsMet ? 'check' : 'lock', 12) + '<span>' + formatNumber(req.price) + ' monedas · tienes ' + formatNumber(state.coins) + '</span></div>';
  }
  var primary = '';
  if (owned) {
    primary = '<div class="notice"><b>Ya forma parte de tu colección.</b> Puedes cerrar esta ficha y elegirlo desde la arena.</div>';
  } else if (can) {
    primary = '<button type="button" class="btn ' + (isReward ? 'btn--gold' : 'btn--primary') + ' btn--lg btn--block" data-action="recruit-confirm">' + icon(isReward ? 'award' : 'spark', 16) + (isReward ? ' Reclamar héroe' : ' Reclutar por ' + formatNumber(req.price) + ' monedas') + '</button>' +
      '<p class="tiny dim" style="margin-top:7px">' + (isReward ? 'Esta recompensa no cuesta monedas.' : 'Se descontarán de tu saldo actual: ' + formatNumber(state.coins) + ' monedas. Sin dinero real.') + '</p>';
  } else {
    primary = '<button type="button" class="btn btn--block btn--lg" disabled>' + icon('lock', 16) + ' Reclutamiento bloqueado</button><p class="tiny dim" style="margin-top:7px">' + esc(req.reason) + '</p>';
  }
  var attrs = char.attributes || {};
  var attrRows = Object.keys(attrs).slice(0, 5).map(function (key) {
    return '<div class="recruitAttr"><span>' + esc(key.charAt(0).toUpperCase() + key.slice(1)) + '</span><span class="bar"><i style="width:' + Number(attrs[key]) + '%;background:' + look.accent + '"></i></span><b>' + Number(attrs[key]) + '</b></div>';
  }).join('');
  return '<div class="overlay"><div class="overlayShell" style="max-width:1080px">' +
    '<div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot" style="background:' + look.accent + ';box-shadow:0 0 12px ' + look.accent + '"></span>Ecos de la colección</span><h1>Un nuevo rostro <em>para el observatorio.</em></h1><p>Las reglas de la app original se conservan: Ilan es inicial, Amaru se gana con misiones, Zenón exige nivel 8 y los demás se reclutan con monedas de estudio.</p></div>' +
      '<div class="sheetHeadSide"><span class="chip">' + state.collection.ownedCharacterIds.length + '/10 en colección</span><button type="button" class="sheetClose" data-action="close-sheet" aria-label="Cerrar">' + icon('close', 17) + '</button></div>' +
    '</div>' +
    '<div class="recruitGrid">' +
      '<section class="recruitPortrait" style="--hero-accent:' + look.accent + '">' +
        '<div class="recruitHalo"></div>' +
        '<img src="' + renderHeroPortrait(char.id, 540) + '" alt="' + esc(char.name) + '" />' +
        '<div class="recruitQuote">“' + esc(char.quote) + '”</div>' +
      '</section>' +
      '<section class="panel recruitBody">' +
        '<div class="detailTags"><span class="chip">' + esc(char.rarityLabel) + '</span><span class="chip">' + esc(look.klass) + '</span><span class="chip">' + esc(look.weapon) + '</span></div>' +
        '<h2>' + esc(char.name) + '</h2><p class="recruitSubtitle">' + esc(char.title) + ' · ' + esc(areaName(char.areaAffinity)) + '</p>' +
        '<p class="detailDesc">' + esc(char.description) + '</p>' +
        '<div class="recruitAttrs">' + attrRows + '</div>' +
        '<div class="sectionDivider"></div>' +
        '<span class="eyebrow noRule">Requisitos originales</span>' +
        '<div class="reqList">' + requirementRows + '</div>' +
        '<div class="recruitBalance"><span>Tu saldo</span><b>◇ ' + formatNumber(state.coins) + '</b></div>' +
        '<div class="recruitActions">' + primary + '<button type="button" class="btn btn--quiet btn--block btn--sm" data-action="close-sheet">Volver a los héroes</button></div>' +
        '<p class="detailFootnote">La compra se registra en tu guardado local. Los héroes no alteran preguntas, claves ni recompensas de ruta.</p>' +
      '</section>' +
    '</div>' +
  '</div></div>';
}

/* -------------------------------------------------------------------------
   REPASO
   ------------------------------------------------------------------------- */
function reviewScreenHTML() {
  var stats = errorStats();
  var due = dueErrors();
  var errors = Object.keys(state.errors).map(function (id) { return state.errors[id]; }).filter(function (e) { return e && QUESTION_BY_ID[e.questionId]; });
  errors.sort(function (a, b) {
    var ad = parseDate(a.nextReviewAt), bd = parseDate(b.nextReviewAt);
    var at = ad ? ad.getTime() : 0, bt = bd ? bd.getTime() : 0;
    if (!!a.recoveredAt !== !!b.recoveredAt) return a.recoveredAt ? 1 : -1;
    return at - bt;
  });
  var rows = errors.map(function (e) {
    var q = QUESTION_BY_ID[e.questionId];
    var isDue = !e.nextReviewAt || (parseDate(e.nextReviewAt) && parseDate(e.nextReviewAt).getTime() <= Date.now());
    var status = e.recoveredAt ? 'Recuperada' : (isDue ? 'Toca repasar' : 'Programada');
    var statusCls = e.recoveredAt ? 'chip chip--completed' : (isDue ? 'chip chip--gold' : 'chip');
    return '<div class="errorRow">' +
      '<span class="errorStatus ' + (e.recoveredAt ? 'is-recovered' : (isDue ? 'is-due' : '')) + '"></span>' +
      '<div class="errorCopy"><b>' + esc(q.stem.slice(0, 170)) + (q.stem.length > 170 ? '…' : '') + '</b>' +
        '<small><span>' + icon('compass', 10) + ' ' + esc(areaName(q.areaId)) + '</span><span>' + icon('rotate', 10) + ' ' + (e.count || 0) + ' ' + plural(e.count || 0, 'fallo', 'fallos') + '</span><span>' + icon('clock', 10) + ' ' + (e.recoveredAt ? 'recuperada ' + timeAgo(e.lastCorrectAt) : timeUntil(e.nextReviewAt)) + '</span></small>' +
      '</div>' +
      '<div class="errorSide"><span class="' + statusCls + '">' + status + '</span></div>' +
    '</div>';
  }).join('');
  var body = errors.length
    ? '<div class="panel reviewList"><div class="reviewListHead"><h2>Tu errorario</h2><span class="chip">' + errors.length + ' preguntas</span></div>' + rows + '</div>'
    : '<div class="emptyState"><div style="color:var(--muted)">' + icon('checkCircle', 28) + '</div><h3>Tu errorario está vacío.</h3><p>Cuando una respuesta falle, aparecerá aquí con su fecha de repaso. No se borra: se convierte en una cita contigo.</p></div>';
  var canEarly = errors.length > 0;
  return '<div class="overlay"><div class="overlayShell">' +
    '<div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot" style="background:var(--amber);box-shadow:0 0 12px var(--amber)"></span>Repetición espaciada</span><h1>Volver a mirar <em>también es avanzar.</em></h1><p>Cada fallo entra en un calendario de repaso. La primera cita es a los 20 minutos; después, 1, 3, 7, 14 y 30 días. Recuperar una pregunta no inventa dominio: lo demuestra.</p></div>' +
      '<div class="sheetHeadSide"><span class="chip chip--gold">' + stats.due + ' por repasar</span><button type="button" class="sheetClose" data-action="close-sheet" aria-label="Cerrar">' + icon('close', 17) + '</button></div>' +
    '</div>' +
    '<div class="reviewTop"><div class="stat"><b>' + stats.pending + '</b><span>pendientes</span></div><div class="stat stat--gold"><b>' + stats.due + '</b><span>listas ahora</span></div><div class="stat stat--accent"><b>' + stats.recovered + '</b><span>recuperadas</span></div><div class="stat"><b>' + stats.mastered + '</b><span>con 2 repasos</span></div></div>' +
    '<div class="reviewBody"><div>' + body + '</div>' +
      '<aside class="panel reviewSide"><span class="eyebrow noRule">Sesión de repaso</span><h3>' + (due.length ? due.length + ' ' + plural(due.length, 'pregunta lista', 'preguntas listas') : 'Nada toca todavía') + '</h3><p>Un repaso es una sesión breve de hasta ' + (RULES.reviewPerSession || 8) + ' preguntas. Responder bien actualiza su próximo intervalo; responder mal vuelve a empezar la cuenta sin borrar tu XP anterior.</p>' +
        '<div class="reviewRule"><b>' + icon('clock', 13) + '</b><span>Primera revisión: 20 minutos después del fallo.<br />Aciertos posteriores: 1, 3, 7, 14 y 30 días.</span></div>' +
        '<div class="reviewRule"><b>' + icon('spark', 13) + '</b><span>La práctica correcta y espaciada sí eleva el dominio. Repetir de inmediato no lo acelera.</span></div>' +
        '<div class="reviewActions">' +
          '<button type="button" class="btn btn--gold btn--block" data-action="start-review" data-mode="due" ' + (due.length ? '' : 'disabled') + '>' + icon('rotate', 14) + ' Repasar lo que toca' + (due.length ? ' (' + due.length + ')' : '') + '</button>' +
          '<button type="button" class="btn btn--ghost btn--block btn--sm" data-action="start-review" data-mode="early" ' + (canEarly ? '' : 'disabled') + '>Repaso anticipado ' + icon('chevronRight', 12) + '</button>' +
          '<button type="button" class="btn btn--quiet btn--block btn--sm" data-action="close-sheet">Volver al observatorio</button>' +
        '</div>' +
        '<p class="tiny dim" style="margin-top:10px">El repaso anticipado sirve para practicar, pero el intervalo de cada pregunta se recalcula al responder. Solo se puede cobrar el bono diario una vez.</p>' +
      '</aside>' +
    '</div>' +
  '</div></div>';
}

/* -------------------------------------------------------------------------
   IMPORTACIÓN
   ------------------------------------------------------------------------- */
function importPreviewHTML() {
  if (!importPreview) return '';
  var s = importPreview.summary;
  var difficulties = s.difficulties && s.difficulties.length
    ? '<div class="notice" style="margin-top:9px"><b>Nota de migración.</b> ' + esc(s.difficulties.join('; ')) + ' no se incluyen porque no forman parte de la campaña autónoma.</div>'
    : '';
  return '<div class="importPreview"><h3>' + icon('checkCircle', 14) + ' Partida reconocida</h3>' +
    '<div class="previewName">' + esc(s.name) + '</div>' +
    '<div class="previewGrid">' +
      '<div><span>Nivel</span><b>' + s.level + '</b></div>' +
      '<div><span>Rango</span><b>' + esc(s.rank) + '</b></div>' +
      '<div><span>XP</span><b>' + formatNumber(s.xp) + '</b></div>' +
      '<div><span>Monedas</span><b>' + formatNumber(s.coins) + '</b></div>' +
      '<div><span>Héroes</span><b>' + s.ownedCharacters + '</b></div>' +
      '<div><span>Cosméticos</span><b>' + s.ownedCosmetics + '</b></div>' +
      '<div><span>Logros</span><b>' + s.achievements + '</b></div>' +
      '<div><span>Nodos</span><b>' + s.missions + '</b></div>' +
      '<div><span>Errores</span><b>' + s.errors + '</b></div>' +
      '<div><span>Etapa</span><b>' + s.stage + '/4</b></div>' +
    '</div>' + difficulties +
    '<div style="display:flex;gap:7px;margin-top:10px;flex-wrap:wrap"><button type="button" class="btn btn--primary btn--sm" data-action="import-confirm">' + icon('upload', 13) + ' Importar esta partida</button><button type="button" class="btn btn--ghost btn--sm" data-action="import-clear">Cancelar vista previa</button></div>' +
  '</div>';
}
function importScreenHTML() {
  var local = findLegacyLocalState();
  return '<div class="overlay"><div class="overlayShell" style="max-width:1080px">' +
    '<div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot" style="background:var(--teal);box-shadow:0 0 12px var(--teal)"></span>Continuidad de tu historia</span><h1>Trae tu partida <em>al observatorio.</em></h1><p>Importa el JSON que exportaste desde SERUMS QUEST. Se conservan nivel, XP, monedas, misiones, errores, logros, personajes y cosméticos; el archivo original no se modifica.</p></div>' +
      '<div class="sheetHeadSide"><button type="button" class="sheetClose" data-action="close-sheet" aria-label="Cerrar">' + icon('close', 17) + '</button></div>' +
    '</div>' +
    '<div class="importGrid">' +
      '<section class="panel importCard"><span class="eyebrow noRule">Tu progreso anterior</span><h2>Un archivo, cinco rutas.</h2><p>En la versión 1.2 abre <b>Ajustes → Exportar progreso</b>. Guarda el archivo y tráelo aquí.</p>' +
        '<input type="file" id="legacyFile" accept="application/json,.json" hidden />' +
        '<button type="button" class="dropZone" data-action="legacy-file" style="width:100%;cursor:pointer">' +
          '<span>' + icon('upload', 28) + '<br /><b>Elegir archivo JSON</b><br />o arrástralo sobre esta zona</span>' +
        '</button>' +
        (local ? '<div class="notice" style="margin-top:10px"><b>Hay una partida local compatible.</b> Encontramos datos de SERUMS QUEST guardados en este navegador.<br /><button type="button" class="btn btn--gold btn--sm" style="margin-top:8px" data-action="legacy-local">Usar partida local</button></div>' : '') +
        '<div class="importOr">o pega el contenido</div>' +
        '<textarea class="inputArea" id="legacyText" placeholder="{ &quot;app&quot;: &quot;SERUMS QUEST&quot;, ... }">' + esc(importText) + '</textarea>' +
        '<div class="importActions"><button type="button" class="btn btn--soft btn--sm" data-action="legacy-analyze">' + icon('eye', 13) + ' Analizar JSON</button><button type="button" class="btn btn--quiet btn--sm" data-action="legacy-clear">Limpiar</button></div>' +
        (importError ? '<div class="notice" style="margin-top:9px;border-color:rgba(255,139,157,.3);color:#ffd3da"><b>No se pudo leer.</b> ' + esc(importError) + '</div>' : '') +
        importPreviewHTML() +
      '</section>' +
      '<aside class="panel importCard importGuide"><span class="eyebrow noRule">Qué viaja contigo</span><h2>Tu historia, no tu interfaz.</h2>' +
        '<div class="importStep"><span class="importStepNum">1</span><div><b>Se importa:</b> nivel, XP, monedas, etapa, precisión, misiones completadas, preguntas falladas, logros, colección de héroes y cosméticos, equipamiento compatible.</div></div>' +
        '<div class="importStep"><span class="importStepNum">2</span><div><b>Se adapta:</b> las preguntas que pertenecen a las 18 misiones jugables. El resto se conserva en tu instalación anterior, no se inventa aquí.</div></div>' +
        '<div class="importStep"><span class="importStepNum">3</span><div><b>Se mantiene:</b> tu archivo original y tu guardado actual (se conserva una copia previa antes de reemplazar).</div></div>' +
        '<div class="notice" style="margin-top:13px"><b>Sin prisa.</b> Importar no borra la copia original de SERUMS QUEST. Puedes volver a exportar y repetir cuando quieras.</div>' +
        '<div class="importWarning">El guardado nuevo vive en este navegador. Si pruebas el HTML final en otro navegador, vuelve a importar el mismo archivo.</div>' +
      '</aside>' +
    '</div>' +
    '<div class="atlasFooter"><span>Compatible con el esquema 2 de SERUMS QUEST 1.2.</span><span>' + icon('shield', 11) + ' Importación local; sin servidores.</span></div>' +
  '</div></div>';
}

/* -------------------------------------------------------------------------
   PAUSA Y AJUSTES
   ------------------------------------------------------------------------- */
function pauseScreenHTML() {
  var inDuel = pauseReturn === 'duel' && !!session;
  var char = selectedCharacter();
  var lv = levelAt(state.xp);
  var due = dueCount();
  var pauseTitle = inDuel ? 'El tiempo se detiene.' : 'Una pausa en el observatorio.';
  var mainActions = inDuel
    ? '<button type="button" class="btn btn--primary btn--block" data-action="close-pause">' + icon('play', 15) + ' Reanudar el duelo</button>' +
      '<button type="button" class="btn btn--ghost btn--block" data-action="close-pause">' + icon('book', 14) + ' Volver al duelo</button>' +
      '<button type="button" class="btn btn--danger btn--block" data-action="abandon-duel">' + icon('close', 14) + ' Abandonar la ruta</button>'
    : '<button type="button" class="btn btn--primary btn--block" data-action="close-pause">' + icon('play', 15) + ' Continuar</button>' +
      '<button type="button" class="btn btn--ghost btn--block" data-action="open-journal">' + icon('map', 14) + ' Abrir bitácora de rutas</button>' +
      '<button type="button" class="btn btn--ghost btn--block" data-action="open-heroes">' + icon('user', 14) + ' Elegir héroe</button>' +
      '<button type="button" class="btn btn--ghost btn--block" data-action="open-wardrobe">' + icon('layers', 14) + ' Inventario y atuendo</button>' +
      '<button type="button" class="btn btn--ghost btn--block" data-action="open-shop">' + icon('bag', 14) + ' Tienda de ecos</button>' +
      '<button type="button" class="btn btn--ghost btn--block" data-action="open-review">' + icon('rotate', 14) + ' Repaso de errores' + (due ? ' · ' + due : '') + '</button>' +
      '<button type="button" class="btn btn--ghost btn--block" data-action="open-import">' + icon('upload', 14) + ' Importar una partida</button>' +
      '<button type="button" class="btn btn--quiet btn--block btn--sm" data-action="exit-title">Salir al título</button>';
  return '<div class="overlay"><div class="overlayShell" style="max-width:980px">' +
    '<div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot"></span>Pausa</span><h1>' + esc(pauseTitle) + '</h1><p>' + (inDuel ? 'Nada avanza mientras estás aquí. Al volver retomarás exactamente la pregunta pendiente.' : 'Tu progreso ya está guardado. Revisa una ruta, cambia de voz o vuelve al atrio.') + '</p></div><div class="sheetHeadSide"><button type="button" class="sheetClose" data-action="close-pause" aria-label="Cerrar pausa">' + icon('close', 17) + '</button></div></div>' +
    '<div class="pauseGrid">' +
      '<section class="panel pauseMain"><span class="eyebrow noRule">Decisiones disponibles</span><h1>' + (inDuel ? 'Respira. La pregunta espera.' : 'El observatorio sigue aquí.') + '</h1><p>' + (inDuel ? 'El guardián conserva tu avance y tus corazones.' : 'Tu nivel, tus monedas y tus rutas están escritos en la bitácora local.') + '</p><div class="pauseActions">' + mainActions + '</div></section>' +
      '<aside class="pauseSide">' +
        '<section class="panel pauseStats"><div class="profileMeta"><span class="heroAvatar"' + (frameColorFor(char.id) ? ' style="box-shadow:0 0 0 2px ' + frameColorFor(char.id) + ',0 0 18px ' + frameColorFor(char.id) + '66"' : '') + '><img src="' + renderHeroPortrait(char.id, 180) + '" alt="" /></span><div><b>' + esc(char.name) + '</b><small>' + esc(lookClass(char.id)) + ' · ' + esc(lookWeapon(char.id)) + '</small>' + (titleText(char.id) ? '<em class="profileTitle">«' + esc(titleText(char.id)) + '»</em>' : '') + '</div></div>' +
          '<div class="statRow" style="grid-template-columns:repeat(2,1fr)"><div class="stat"><b>' + lv.level + '</b><span>nivel</span></div><div class="stat stat--gold"><b>' + formatNumber(state.coins) + '</b><span>monedas</span></div><div class="stat stat--accent"><b>' + totalMissionsDone() + '</b><span>nodos</span></div><div class="stat"><b>' + due + '</b><span>repasos</span></div></div>' +
          '<div class="sectionDivider"></div><div class="progressRows">' +
            '<div class="progressRow"><span>Progreso de nivel</span><b>' + lv.into + '/' + lv.needed + ' XP</b><span class="bar"><i style="width:' + lv.percent + '%"></i></span></div>' +
            '<div class="progressRow"><span>Etapa ' + state.stage + ' · ' + esc(stageInfo().name) + '</span><b>' + esc(stageInfo().criteria) + '</b></div>' +
          '</div></section>' +
        '<section class="panel pauseStats"><span class="eyebrow noRule">Ajustes y memoria</span><h3>Audio y datos</h3>' +
          '<div class="settingsRow"><div><b>Efectos de sonido</b><small>Respuestas, impactos y transiciones.</small></div><button type="button" class="toggle ' + (state.settings.sound ? 'is-on' : '') + '" data-action="toggle-sound" aria-label="Alternar sonido" aria-pressed="' + state.settings.sound + '"></button></div>' +
          '<div class="settingsRow"><div><b>Ambiente del observatorio</b><small>Pad sintetizado de baja intensidad.</small></div><button type="button" class="toggle ' + (state.settings.ambient ? 'is-on' : '') + '" data-action="toggle-ambient" aria-label="Alternar ambiente" aria-pressed="' + state.settings.ambient + '"></button></div>' +
          '<div class="settingsRow settingsRow--stack"><div><b>Calidad de efectos</b><small>Menos partículas = más fluidez en equipos modestos.</small></div><div class="qualityOptions">' +
            ['bajo', 'medio', 'alto'].map(function (q) { return '<button type="button" class="qualityBtn ' + (state.settings.effectsQuality === q ? 'is-active' : '') + '" data-action="set-effects-quality" data-quality="' + q + '">' + (q === 'bajo' ? 'Baja' : q === 'alto' ? 'Alta' : 'Media') + '</button>'; }).join('') +
          '</div></div>' +
          '<div class="settingsRow"><div><b>Marcos holográficos 3D</b><small>Oculta los aros que flotan detrás del héroe; el marco del retrato se conserva.</small></div><button type="button" class="toggle ' + (!state.settings.hide3dFrames ? 'is-on' : '') + '" data-action="toggle-3d-frames" aria-label="Alternar marcos holográficos" aria-pressed="' + (!state.settings.hide3dFrames) + '"></button></div>' +
          '<div class="settingsActions"><button type="button" class="btn btn--ghost btn--sm" data-action="export-save">' + icon('download', 13) + ' Exportar partida</button><button type="button" class="btn btn--ghost btn--sm" data-action="open-import">' + icon('upload', 13) + ' Importar</button></div>' +
          '<div class="settingsRow" style="margin-top:4px"><div><b>Reiniciar progreso</b><small>Guarda una copia de seguridad antes de vaciar el observatorio.</small></div><button type="button" class="btn btn--danger btn--sm" data-action="reset-progress" data-armed="' + (Date.now() < resetArmedUntil ? 'true' : 'false') + '">' + (Date.now() < resetArmedUntil ? 'Confirmar reinicio' : 'Reiniciar') + '</button></div>' +
          '<p class="tiny dim" style="margin:6px 0 0">Progreso local · guardado en este navegador · ' + esc(APP_VERSION) + '</p>' +
          (abandonArmedUntil > Date.now() ? '<div class="notice" style="margin-top:9px"><b>¿Abandonar la ruta?</b> Pulsa de nuevo el botón rojo en los próximos segundos. Las respuestas dadas se conservan, pero no habrá recompensa de cierre.</div>' : '') +
        '</section>' +
      '</aside>' +
    '</div>' +
  '</div></div>';
}
function lookClass(id) { return (HERO_LOOKS[id] || HERO_LOOKS.ilan).klass; }
function lookWeapon(id) { return (HERO_LOOKS[id] || HERO_LOOKS.ilan).weapon; }

/* -------------------------------------------------------------------------
   DUELO
   ------------------------------------------------------------------------- */
function currentQuestion() {
  if (!session) return null;
  var qid = session.questions[session.cursor];
  return qid ? QUESTION_BY_ID[qid] : null;
}
function duelScreenHTML() {
  if (!session) return '';
  var q = currentQuestion();
  if (!q) return '';
  var area = AREA_BY_ID[session.areaId] || CAMP.areas[0];
  var feedback = lastFeedback;
  var boss = session.mode === 'boss';
  var guardianName = guardian ? guardian.name : 'Guardián de la ruta';
  var optionHtml = q.options.map(function (o) {
    var cls = 'answerBtn';
    if (feedback) {
      cls += ' is-muted';
      if (feedback.chosen === o.id) cls += feedback.correct ? ' is-correct' : ' is-wrong';
      if (!boss && o.id === q.answer) cls += ' is-correct';
    }
    return '<button type="button" class="' + cls + '" data-action="answer" data-letter="' + esc(o.id) + '" ' + (feedback ? 'disabled' : '') + '>' +
      '<span class="answerKey">' + esc(o.id) + '</span><span>' + esc(o.text) + '</span>' +
    '</button>';
  }).join('');
  var dots = session.questions.map(function (_, idx) {
    var cls = 'qDot';
    if (session.answers[session.questions[idx]]) cls += ' is-done';
    if (idx === session.cursor) cls += ' is-current';
    return '<span class="' + cls + '"></span>';
  }).join('');
  var hearts = '';
  for (var i = 0; i < (RULES.duelHearts || 3); i++) hearts += heartSvg(i < session.hearts);
  var foot = '';
  if (!feedback) {
    foot = '<div class="duelFoot"><span class="hint"><kbd>A</kbd><kbd>B</kbd><kbd>C</kbd><kbd>D</kbd> responder · <kbd>Esc</kbd> pausa</span><span class="hint" style="margin-left:auto">' + (boss ? 'La clave se revela al final' : 'El golpe depende de tu criterio') + '</span></div>';
  } else {
    var nextLabel = (session.hearts <= 0 || session.cursor >= session.questions.length - 1) ? 'Ver resultado' : 'Siguiente pregunta';
    var feedbackText = feedback.correct
      ? '<b>' + (session.mode === 'review' ? 'Memoria recuperada.' : 'Impacto certero.') + '</b><span>' + (feedback.xp ? '+' + feedback.xp + ' XP' : (feedback.suppressed ? esc(feedback.reason) : 'Respuesta registrada')) + (feedback.coins ? ' · +' + feedback.coins + ' moneda' : '') + (boss ? ' · La clave queda sellada hasta el cierre.' : ' · Clave: ' + esc(feedback.answer) + '. ' + esc(feedback.answerText)) + '</span>'
      : '<b>El guardián encontró una grieta.</b><span>' + (boss ? 'Respuesta sellada. La clave se verá en el informe final.' : 'La respuesta correcta era ' + esc(feedback.answer) + ': ' + esc(feedback.answerText)) + ' · Fallo programado para repaso en ' + (RULES.firstReviewMinutes || 20) + ' min.</span>';
    foot = '<div class="duelFoot"><div class="feedbackStrip ' + (feedback.correct ? 'is-correct' : 'is-wrong') + '">' +
      '<span class="feedbackIcon">' + icon(feedback.correct ? 'check' : 'close', 13) + '</span>' +
      '<span class="feedbackText">' + feedbackText + '</span>' +
      '<button type="button" class="btn btn--primary nextBtn" data-action="next-question">' + esc(nextLabel) + ' ' + icon('chevronRight', 12) + '</button>' +
    '</div></div>';
  }
  return '<div class="duelTop">' +
    '<div class="duelChip" style="--accent:' + area.accent + '"><span class="areaGlyph">' + (AREA_GLYPHS[area.id] || '✦') + '</span><div><small>' + (session.mode === 'review' ? 'Repaso espaciado' : esc(area.short) + ' · ' + esc(guardianName)) + ' · ' + (session.cursor + 1) + '/' + session.questions.length + '</small><b>' + esc(session.title) + '</b></div></div>' +
    '<div class="duelHearts"><span class="hudResource duelCoins" title="Monedas">' + icon('coin', 12) + '<b>' + formatNumber(state.coins) + '</b></span><div class="heartRow">' + hearts + '</div><div class="duelProgress"><div class="qDots">' + dots + '</div></div><button type="button" class="iconBtn" data-action="open-pause" title="Pausa">' + icon('pause', 16) + '</button></div>' +
  '</div>' +
  '<div class="duelStatus">' + esc(guardianName) + ' · ' + (session.mode === 'review' ? 'Memoria en repaso' : session.mode === 'boss' ? 'Duelo de dominio' : 'Duelo de criterio') + ' · Pregunta ' + (session.cursor + 1) + ' de ' + session.questions.length + '</div>' +
  '<div class="duelPanelWrap"><section class="duelPanel" style="--accent:' + area.accent + '">' +
    '<div class="duelPanelHead"><span class="qCategory">' + (session.mode === 'review' ? 'Repaso · ' + esc(area.short) : esc(session.title) + ' · ' + esc(area.short)) + '</span><span class="qSource">' + esc(q.examTitle || 'Psicología · SERUMS') + (q.page ? ' · p. ' + q.page : '') + '</span></div>' +
    '<div class="duelPanelBody"><p class="questionText">' + esc(q.stem) + '</p>' +
      '<div class="answers">' + optionHtml + '</div>' + foot +
    '</div>' +
  '</section></div>';
}

/* -------------------------------------------------------------------------
   RESULTADO
   ------------------------------------------------------------------------- */
function resultScreenHTML() {
  var r = lastResult;
  if (!r) return '';
  var accent = r.pass ? 'var(--teal)' : 'var(--rose)';
  var area = AREA_BY_ID[r.areaId] || CAMP.areas[0];
  var sealValue = Math.round(r.accuracy * 100) + '%';
  var heading = r.mode === 'review' ? (r.pass ? 'La memoria vuelve a estar contigo.' : 'El repaso deja una tarea abierta.') : (r.pass ? 'La ruta queda sellada.' : 'El guardián aún guarda este tramo.');
  var eyebrow = r.mode === 'review' ? 'Repaso espaciado' : (r.mode === 'boss' ? 'Duelo de dominio' : 'Duelo de criterio');
  var answers = r.entries.map(function (e) {
    var q = QUESTION_BY_ID[e.questionId];
    if (!q) return '';
    return '<div class="answerReviewRow">' + icon(e.correct ? 'checkCircle' : 'close', 11) + '<span><b>' + (e.correct ? 'Correcta' : 'Fallada') + '.</b> ' + esc(q.answer + '. ' + e.answerText) + '</span></div>';
  }).join('');
  var rewards = '';
  if (r.questionXp) rewards += '<div class="rewardRow"><span>Respuestas acertadas</span><b>+' + r.questionXp + ' XP</b></div>';
  if (r.completion && r.completion.xp) rewards += '<div class="rewardRow"><span>Cierre de ruta</span><b>+' + r.completion.xp + ' XP</b></div>';
  if (r.achievements && r.achievements.length) rewards += '<div class="rewardRow"><span>Logros desbloqueados</span><b>+' + r.achievements.reduce(function (n, a) { return n + (a.xp || 0); }, 0) + ' XP</b></div>';
  if (r.questionCoins) rewards += '<div class="rewardRow"><span>Monedas por acierto</span><b>+' + r.questionCoins + '</b></div>';
  if (r.completion && r.completion.coins) rewards += '<div class="rewardRow"><span>Monedas de cierre</span><b>+' + r.completion.coins + '</b></div>';
  if (r.achievements && r.achievements.length) {
    var achievementCoins = r.achievements.reduce(function (n, a) { return n + (Number(a.coins) || 0); }, 0);
    if (achievementCoins) rewards += '<div class="rewardRow"><span>Monedas por logros</span><b>+' + achievementCoins + '</b></div>';
    rewards += '<div class="rewardRow"><span>Logros</span><b>' + r.achievements.map(function (a) { return esc(a.name); }).join(' · ') + '</b></div>';
  }
  if (!rewards) rewards = '<div class="rewardRow"><span>Sin recompensas de cierre</span><b>—</b></div>';
  var levelLine = r.levelAfter > r.levelBefore ? 'Nivel ' + r.levelBefore + ' → ' + r.levelAfter : 'Nivel ' + r.levelAfter;
  var stageLine = r.stageChange ? '<div class="notice" style="margin-top:9px"><b>Etapa ' + r.stageChange.from + ' → ' + r.stageChange.to + '.</b> La evidencia reciente movió tu umbral adaptativo.</div>' : '';
  var nextCosmeticLine = typeof nextCosmeticHint === 'function' ? nextCosmeticHint() : null;
  var nextCosmeticCard = nextCosmeticLine ? '<div class="resultCosmetic"><span class="eyebrow noRule">Próximo cosmético</span><b>' + esc(nextCosmeticLine.cosmetic.name) + '</b><p>' + esc(nextCosmeticLine.text) + '</p><div class="bar"><i style="width:' + Math.round((nextCosmeticLine.pct || 0) * 100) + '%;background:' + cosmeticRarityColor(nextCosmeticLine.cosmetic) + '"></i></div></div>' : '';
  var newCosmeticCard = (r.newCosmetics && r.newCosmetics.length) ? '<div class="resultNext resultNext--cosmetic"><b>Cosméticos nuevos: ' + esc(r.newCosmetics.map(function (c) { return c.name; }).join(' · ')) + '</b><p>Ya están en tu inventario y muestran cómo se consiguen.</p></div>' : '';
  var due = dueErrors().length;
  var scheduledLine = r.errorsScheduled ? r.errorsScheduled + ' ' + plural(r.errorsScheduled, 'fallo quedó programado', 'fallos quedaron programados') + ' para volver a mirarlos en ' + (RULES.firstReviewMinutes || 20) + ' minutos. ' : '';
  var nextLine = scheduledLine + (due ? due + ' ' + plural(due, 'pregunta está lista', 'preguntas están listas') + ' para repaso.' : 'No hay repasos pendientes por ahora.');
  var actions = '';
  if (r.mode === 'mission' || r.mode === 'boss') {
    actions += '<button type="button" class="btn ' + (r.pass ? 'btn--primary' : 'btn--ghost') + '" data-action="result-continue">' + icon('map', 14) + ' Volver al observatorio</button>';
    actions += '<button type="button" class="btn btn--ghost" data-action="result-replay">' + icon('rotate', 14) + ' ' + (r.pass ? 'Repetir ruta' : 'Reintentar') + '</button>';
    if (due) actions += '<button type="button" class="btn btn--ghost" data-action="open-review">' + icon('book', 14) + ' Ver repaso</button>';
  } else {
    actions += '<button type="button" class="btn btn--primary" data-action="result-continue">' + icon('map', 14) + ' Volver al observatorio</button>';
    if (due) actions += '<button type="button" class="btn btn--ghost" data-action="open-review">' + icon('rotate', 14) + ' Ver repasos</button>';
  }
  return '<div class="resultScreen"><section class="resultCard" style="--accent:' + accent + '">' +
    '<div class="resultHead"><div><span class="eyebrow noRule" style="color:' + accent + '">' + eyebrow + ' · ' + esc(area.short) + '</span><h1>' + esc(heading) + '</h1>' +
      '<p class="small muted" style="margin:8px 0 0;max-width:580px">' + esc(r.title) + ' · ' + r.correct + ' de ' + r.total + ' respuestas correctas. ' + esc(r.reasonLabel || '') + '</p></div>' +
      '<div class="resultSeal"><b>' + sealValue + '</b><small>precisión</small></div>' +
    '</div>' +
    '<div class="resultBody"><div>' +
      '<div class="resultStats"><div class="resultStat resultStat--teal"><b>' + r.correct + '</b><span>aciertos</span></div><div class="resultStat"><b>' + r.wrong + '</b><span>fallos</span></div><div class="resultStat"><b>' + r.questionXp + '</b><span>XP de respuestas</span></div><div class="resultStat resultStat--gold"><b>' + r.coinsEarned + '</b><span>monedas</span></div></div>' +
      '<div class="resultReasons" style="margin-top:12px"><strong>' + (r.pass ? 'Ruta superada.' : 'Sesión cerrada sin recompensa de ruta.') + '</strong> ' + esc(r.reason) + '</div>' +
      '<div class="resultNext"><b>' + levelLine + ' · ' + esc(r.rankAfter || '') + '</b><p>' + nextLine + '</p></div>' +
      stageLine +
      newCosmeticCard +
      (r.achievements && r.achievements.length ? '<div class="resultNext"><b>Logros nuevos</b><p>' + esc(r.achievements.map(function (a) { return a.name; }).join(' · ')) + '</p></div>' : '') +
      (r.unlockedCharacters && r.unlockedCharacters.length ? '<div class="resultNext"><b>Nuevo héroe: ' + esc(r.unlockedCharacters.map(function (c) { return c.name; }).join(', ')) + '</b><p>Ya puedes elegirlo en el observatorio.</p></div>' : '') +
      '<div class="answerReview">' + answers + '</div>' +
    '</div>' +
    '<aside class="resultAside"><h3>Recompensas de la ruta</h3><div class="rewardRows">' + rewards + '</div>' +
      '<div class="resultNext"><b>Bitácora actualizada</b><p>' + (r.newlyCompleted ? 'Este nodo queda marcado como completado.' : (r.mode === 'review' ? 'Los intervalos de repaso se recalcularon.' : (r.pass ? 'La ruta ya estaba completada; conservas tu mejor marca.' : 'La ruta sigue abierta; este intento no registrará cierre.'))) + '</p></div>' +
      '<div class="resultNext"><b>Próxima memoria</b><p>' + (r.errorsScheduled ? r.errorsScheduled + ' ' + plural(r.errorsScheduled, 'fallo vuelve', 'fallos vuelven') + ' en ' + (RULES.firstReviewMinutes || 20) + ' min.' : 'Sin citas nuevas pendientes.') + (due ? ' ' + due + ' ' + plural(due, 'pregunta espera', 'preguntas esperan') + ' ahora.' : '') + '</p></div>' +
      nextCosmeticCard +
      (r.capReached ? '<div class="resultNext"><b>Tope diario alcanzado</b><p>Las monedas de hoy ya tienen su límite. Tu progreso y el de los cosméticos sigue contando sin prisa.</p></div>' : '') +
    '</aside></div>' +
    '<div class="resultFoot"><span class="footMeta">' + icon('shield', 11) + ' Las respuestas ya quedaron guardadas en este navegador.</span><div class="actions">' + actions + '</div></div>' +
  '</section></div>';
}

/* -------------------------------------------------------------------------
   Render raíz
   ------------------------------------------------------------------------- */
function setScreen(next) {
  screen = next;
  if (next !== 'hub') EL.prompt.classList.add('hidden');
  syncHUD();
  renderScreen();
}
function renderScreen() {
  if (!EL.screen) return;
  if (screen === 'boot') return;
  if (screen === 'title') {
    EL.screen.innerHTML = titleScreenHTML();
    return;
  }
  if (screen === 'hub') { EL.screen.innerHTML = ''; return; }
  if (screen === 'journal') { EL.screen.innerHTML = journalScreenHTML(); return; }
  if (screen === 'heroes') { EL.screen.innerHTML = heroesScreenHTML(); return; }
  if (screen === 'recruit') { EL.screen.innerHTML = recruitScreenHTML(); return; }
  if (screen === 'review') { EL.screen.innerHTML = reviewScreenHTML(); return; }
  if (screen === 'import') { EL.screen.innerHTML = importScreenHTML(); bindImportFile(); return; }
  if (screen === 'pause') { EL.screen.innerHTML = pauseScreenHTML(); return; }
  if (screen === 'wardrobe') {
    EL.screen.innerHTML = wardrobeScreenHTML();
    mountWardrobePreview();
    return;
  }
  if (screen === 'shop') { EL.screen.innerHTML = shopScreenHTML(); return; }
  if (screen === 'showcase') { EL.screen.innerHTML = showcaseScreenHTML(); return; }
  if (screen === 'slotGallery') { EL.screen.innerHTML = slotGalleryHTML(); return; }
  if (screen === 'duel') { EL.screen.innerHTML = duelScreenHTML(); return; }
  if (screen === 'result') { EL.screen.innerHTML = resultScreenHTML(); return; }
}

/* =========================================================================
   COSMÉTICOS — catálogo final, progreso, propiedad, equipamiento y tienda
   ========================================================================= */
var ALL_COSMETICS = CAMP.cosmetics.slice();
var COSMETIC_SLOT_ORDER = CAMP.cosmeticCategories.map(function (s) { return s.id; });
var COSMETIC_SLOT_LOOKUP = {};
CAMP.cosmeticCategories.forEach(function (s) { COSMETIC_SLOT_LOOKUP[s.id] = s; });
var EXTRA_SLOTS = ['mascota', 'estela', 'titulo'];
var ALL_HERO_IDS = CAMP.characters.map(function (c) { return c.id; });
var RARITY_UI = {
  inicial: { label: 'Inicial', color: '#B8C1D0', glow: '#8B98AF', order: 0 },
  comun: { label: 'Común', color: '#AEB6C8', glow: '#78859A', order: 1 },
  poco_comun: { label: 'Poco común', color: '#78D5A5', glow: '#42B386', order: 2 },
  raro: { label: 'Raro', color: '#7AA2FF', glow: '#4F79E8', order: 3 },
  epico: { label: 'Épico', color: '#C49BFF', glow: '#965DE1', order: 4 },
  legendario: { label: 'Legendario', color: '#F3C978', glow: '#E5A742', order: 5 }
};
var RARITY_ORDER = Object.keys(RARITY_UI).sort(function (a, b) { return RARITY_UI[a].order - RARITY_UI[b].order; });
function rarityUI(key) { return RARITY_UI[key] || RARITY_UI.comun; }
function isExtraCosmetic(c) { return !!(c && c.isExtra); }
function cosmeticOwned(id) { return state.collection.ownedCosmeticIds.indexOf(id) !== -1; }
function cosmeticById(id) { return COSMETIC_BY_ID[id] || null; }
function cosmeticSlotLabel(id) { return COSMETIC_SLOT_LOOKUP[id] ? COSMETIC_SLOT_LOOKUP[id].label : id; }
function cosmeticsInSlot(slot) {
  return ALL_COSMETICS.filter(function (c) { return c.category === slot; });
}
function ownedCosmetics() { return state.collection.ownedCosmeticIds.slice(); }
function countOwnedCosmetics() { return state.collection.ownedCosmeticIds.length; }
function countAllCosmetics() { return ALL_COSMETICS.length; }

/* -------------------------------------------------------------------------
   Métricas de progreso
   ------------------------------------------------------------------------- */
function currentStreakForCosmetics() {
  return Math.max(Number(state.daily.streak) || 0, Number(state.daily.bestStreak) || 0);
}
function recoveredQuestionCount() {
  return Object.keys(state.errors).filter(function (id) {
    return state.errors[id] && state.errors[id].recoveredAt && QUESTION_BY_ID[id];
  }).length;
}
function achievementsOwnedCount() {
  return Object.keys(state.achievements).filter(function (id) { return ACHIEVEMENT_BY_ID[id]; }).length;
}
function areaRegularMissions(areaId) {
  return CAMP.missions.filter(function (m) { return m.areaId === areaId && m.kind === 'mission'; });
}
function areaMasteredCount(areaId, threshold) {
  var list = areaRegularMissions(areaId);
  var best = Number(threshold) || 0.8;
  return list.filter(function (m) {
    var rec = state.missions[m.id];
    return rec && rec.completedAt && Number(rec.bestAccuracy) >= best;
  }).length;
}
function totalRegularMissions(areaId) { return areaRegularMissions(areaId).length; }
function bossRecord(bossId) { return state.missions[bossId] || null; }
function bossCompleted(bossId) {
  var rec = bossRecord(bossId);
  return !!(rec && rec.completedAt);
}
function bossBestAccuracy(bossId) {
  var rec = bossRecord(bossId);
  return rec ? Math.max(0, Number(rec.bestAccuracy) || 0) : 0;
}
function isoWeekKey(date) {
  var d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  var week1 = new Date(d.getFullYear(), 0, 4);
  return d.getFullYear() + '-W' + String(1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)).padStart(2, '0');
}
function recordLearningDay(now) {
  var at = now ? new Date(now) : new Date();
  var today = dateKey(at);
  var previous = state.daily.lastCompletedDate;
  var previousStreak = Number(state.daily.streak) || 0;
  var grace = false;
  if (!previous) state.daily.streak = 1;
  else if (previous === today) return { changed: false, grace: false, streak: state.daily.streak };
  else {
    var prevDate = new Date(previous + 'T00:00:00');
    var diff = Math.round((new Date(today + 'T00:00:00').getTime() - prevDate.getTime()) / 86400000);
    if (diff <= 0) return { changed: false, grace: false, streak: state.daily.streak };
    if (diff === 1) state.daily.streak = previousStreak + 1;
    else if (diff === 2) {
      var week = isoWeekKey(at);
      if (state.daily.graceWeek !== week) {
        state.daily.graceWeek = week;
        grace = true;
        state.daily.streak = previousStreak + 1;
      } else {
        state.daily.streak = 1;
      }
    } else {
      state.daily.streak = 1;
    }
  }
  state.daily.lastCompletedDate = today;
  state.daily.totalCompleted = (Number(state.daily.totalCompleted) || 0) + 1;
  state.daily.bestStreak = Math.max(Number(state.daily.bestStreak) || 0, Number(state.daily.streak) || 0);
  return { changed: true, grace: grace, streak: state.daily.streak, best: state.daily.bestStreak };
}
function achievementMetricFor(id) {
  var def = ACHIEVEMENT_BY_ID[id];
  if (!def) return 0;
  var metrics = achievementMetrics();
  var have = Number(metrics[def.metric]) || 0;
  if (def.metric === 'accuracy' && metrics.answered < 20) have = 0;
  return Math.min(Number(def.target) || 0, Math.max(0, have));
}
function achievementUnlockedFor(id) { return !!(state.achievements[id] && state.achievements[id].unlockedAt); }

/* -------------------------------------------------------------------------
   Requisitos de cada cosmético
   ------------------------------------------------------------------------- */
function originalUnlockInfo(c) {
  var req = c.unlockRequirements || null;
  var level = currentLevel();
  var coins = state.coins;
  var levelNeed = req && req.kind === 'level' ? Number(req.level) || 0 : 0;
  var achievementId = req && req.kind === 'achievement' ? req.achievementId : null;
  var achievementDef = achievementId ? ACHIEVEMENT_BY_ID[achievementId] : null;
  var achievementOk = !achievementId || achievementUnlockedFor(achievementId);
  var levelOk = !levelNeed || level >= levelNeed;
  var price = Number(c.price) || 0;
  var coinsOk = coins >= price;
  var canBuy = levelOk && achievementOk && coinsOk;
  var requirementText = '';
  if (levelNeed) requirementText = 'Nivel ' + levelNeed + ' + ◇' + formatNumber(price);
  else if (achievementDef) requirementText = 'Logro «' + achievementDef.name + '» + ◇' + formatNumber(price);
  else requirementText = 'Tienda · ◇' + formatNumber(price);
  var conditionsTotal = (levelNeed ? 1 : 0) + (achievementId ? 1 : 0) + (price ? 1 : 0);
  var conditionsMet = (levelNeed ? (levelOk ? 1 : 0) : 0) + (achievementId ? (achievementOk ? 1 : 0) : 0) + (price ? (coinsOk ? 1 : 0) : 0);
  return {
    kind: 'shop',
    canUnlock: canBuy,
    canBuy: canBuy,
    price: price,
    levelNeed: levelNeed,
    levelOk: levelOk,
    achievementId: achievementId,
    achievementOk: achievementOk,
    coinsOk: coinsOk,
    requirementText: requirementText,
    pct: conditionsTotal ? conditionsMet / conditionsTotal : 1,
    owned: cosmeticOwned(c.id)
  };
}
function extraRequirementInfo(c) {
  var req = c.unlockRequirements || {};
  var kind = req.kind;
  var current = 0, target = 1, label = '', unit = '', can = false;
  var ext = {};
  if (kind === 'streak') {
    current = currentStreakForCosmetics();
    target = Number(req.target) || 7;
    label = 'días de constancia';
    can = current >= target;
  } else if (kind === 'recoveries') {
    current = recoveredQuestionCount();
    target = Number(req.target) || 10;
    label = 'errores recuperados';
    can = current >= target;
  } else if (kind === 'onTimeReviewSessions') {
    current = Number(state.reviews.onTimeSessions) || 0;
    target = Number(req.target) || 10;
    label = 'repasos en su ventana programada';
    can = current >= target;
  } else if (kind === 'earlyReviewSessions') {
    current = Number(state.reviews.earlySessions) || 0;
    target = Number(req.target) || 5;
    label = 'repasos anticipados';
    can = current >= target;
  } else if (kind === 'areaMastery') {
    var total = totalRegularMissions(req.areaId);
    current = areaMasteredCount(req.areaId, req.accuracy || 0.8);
    target = total;
    label = 'misiones al ' + Math.round((Number(req.accuracy) || 0.8) * 100) + ' %';
    can = total > 0 && current >= total;
    ext.areaId = req.areaId;
    ext.total = total;
  } else if (kind === 'areaMasteryGold') {
    var baseMap = {
      'area-psi-salud-publica': 'x-dominio-salud',
      'area-psi-cuidado-integral': 'x-dominio-cuidado',
      'area-psi-etica': 'x-dominio-etica',
      'area-psi-investigacion': 'x-dominio-investigacion',
      'area-psi-gestion': 'x-dominio-gestion'
    };
    var baseId = baseMap[req.areaId];
    var baseOwned = baseId ? cosmeticOwned(baseId) : false;
    var accuracy = bossBestAccuracy(req.bossId);
    current = Math.round(accuracy * 100);
    target = Math.round((Number(req.bossAccuracy) || 0.9) * 100);
    label = 'precisión en el jefe';
    can = baseOwned && bossCompleted(req.bossId) && accuracy >= (Number(req.bossAccuracy) || 0.9);
    ext.baseOwned = baseOwned;
    ext.bossId = req.bossId;
    ext.baseId = baseId;
    if (!baseOwned) label = 'primero consigue su tocado de maestría';
  } else if (kind === 'bossDefeated') {
    current = bossCompleted(req.bossId) ? 1 : 0;
    target = 1;
    label = 'guardían derrotado';
    can = !!current;
    ext.bossId = req.bossId;
  } else if (kind === 'bossMastery') {
    current = Math.round(bossBestAccuracy(req.bossId) * 100);
    target = Math.round((Number(req.accuracy) || 0.8) * 100);
    label = 'en el jefe';
    can = bossCompleted(req.bossId) && bossBestAccuracy(req.bossId) >= (Number(req.accuracy) || 0.8);
    ext.bossId = req.bossId;
  } else if (kind === 'level') {
    current = currentLevel();
    target = Number(req.target) || 5;
    label = 'nivel global';
    can = current >= target;
  } else if (kind === 'achievements') {
    current = achievementsOwnedCount();
    target = Number(req.target) || 3;
    label = 'logros';
    can = current >= target;
  } else if (kind === 'achievement') {
    current = achievementMetricFor(req.achievementId);
    var def = ACHIEVEMENT_BY_ID[req.achievementId];
    target = def ? Number(def.target) || 1 : 1;
    label = def ? 'logro «' + def.name + '»' : 'logro';
    can = achievementUnlockedFor(req.achievementId);
  } else if (kind === 'rank') {
    current = currentRank().id === req.rankId ? 1 : 0;
    target = 1;
    label = 'rango «' + (CAMP.rules.ranks.find(function (r) { return r.id === req.rankId; }) || {}).name + '»';
    can = current >= 1;
  }
  var nextTier = null;
  if (Array.isArray(req.tiers)) {
    for (var i = 0; i < req.tiers.length; i++) {
      if (Number(req.tiers[i]) > current) { nextTier = Number(req.tiers[i]); break; }
    }
  }
  var requirementText = '';
  if (kind === 'streak') requirementText = 'Mejor racha de constancia: ' + target + ' días';
  else if (kind === 'recoveries') requirementText = 'Recupera ' + target + ' preguntas falladas';
  else if (kind === 'onTimeReviewSessions') requirementText = 'Completa ' + target + ' repasos en su ventana programada';
  else if (kind === 'earlyReviewSessions') requirementText = 'Completa ' + target + ' repasos anticipados';
  else if (kind === 'areaMastery') requirementText = 'Completa todas las misiones del área con ≥' + Math.round((Number(req.accuracy) || 0.8) * 100) + ' %';
  else if (kind === 'areaMasteryGold') requirementText = 'Consigue el tocado base y supera al jefe con ≥' + Math.round((Number(req.bossAccuracy) || 0.9) * 100) + ' %';
  else if (kind === 'bossDefeated') requirementText = 'Derrota al guardián del área';
  else if (kind === 'bossMastery') requirementText = 'Derrota al guardián con ≥' + Math.round((Number(req.accuracy) || 0.8) * 100) + ' %';
  else if (kind === 'level') requirementText = 'Nivel global ' + target;
  else if (kind === 'achievements') requirementText = 'Consigue ' + target + ' logros de aprendizaje';
  else if (kind === 'achievement') requirementText = 'Logro «' + ((ACHIEVEMENT_BY_ID[req.achievementId] || {}).name || req.achievementId) + '»';
  else if (kind === 'rank') requirementText = 'Alcanza el rango «' + ((CAMP.rules.ranks.find(function (r) { return r.id === req.rankId; }) || {}).name || req.rankId) + '»';
  var pct = target > 0 ? Math.min(1, current / target) : 1;
  return {
    kind: kind,
    canUnlock: can,
    requirementText: requirementText,
    pct: pct,
    current: current,
    target: target,
    label: label,
    nextTier: nextTier,
    extra: ext,
    owned: cosmeticOwned(c.id)
  };
}
function cosmeticRequirementInfo(c) {
  if (!c) return null;
  if (isExtraCosmetic(c)) return extraRequirementInfo(c);
  return originalUnlockInfo(c);
}
function cosmeticStage(c) {
  if (!c || !c.unlockRequirements || !Array.isArray(c.unlockRequirements.tiers)) return 1;
  var req = c.unlockRequirements;
  var reqInfo = extraRequirementInfo(c);
  var current = reqInfo ? Number(reqInfo.current) || 0 : 0;
  var stage = 1;
  req.tiers.forEach(function (tier) { if (current >= Number(tier)) stage += 1; });
  return Math.min(req.tiers.length + 1, stage);
}
function cosmeticRarityKey(c) {
  if (!c) return 'comun';
  if (Array.isArray(c.tierRarities)) {
    var stage = cosmeticStage(c) - 1;
    return c.tierRarities[Math.min(c.tierRarities.length - 1, Math.max(0, stage))] || c.rarity;
  }
  return c.rarity || 'comun';
}
function cosmeticRarityLabel(c) { return rarityUI(cosmeticRarityKey(c)).label; }
function cosmeticRarityColor(c) { return rarityUI(cosmeticRarityKey(c)).color; }
function cosmeticStageLabel(c) {
  if (!Array.isArray(c.stageLabels) || cosmeticStage(c) <= 1) return '';
  var stage = cosmeticStage(c);
  return 'Etapa ' + stage + ' · ' + c.stageLabels[Math.min(c.stageLabels.length - 1, stage - 1)];
}
function cosmeticProgressText(c) {
  var info = cosmeticRequirementInfo(c);
  if (!info) return '';
  if (cosmeticOwned(c.id)) {
    if (Array.isArray(c.stageLabels)) {
      var next = info.nextTier;
      return next ? 'Etapa ' + cosmeticStage(c) + ' de ' + (c.unlockRequirements.tiers.length + 1) + ' · siguiente a ' + next : 'Etapa final alcanzada';
    }
    return 'Poseído';
  }
  if (info.kind === 'shop') {
    if (info.levelNeed && !info.levelOk) return 'Nivel ' + info.levelNeed + ' · actual ' + currentLevel();
    if (info.achievementId && !info.achievementOk) {
      var def = ACHIEVEMENT_BY_ID[info.achievementId];
      return 'Logro «' + (def ? def.name : info.achievementId) + '» pendiente';
    }
    if (!info.coinsOk) return 'Te faltan ◇' + formatNumber((Number(c.price) || 0) - state.coins);
    return 'Disponible en la tienda';
  }
  if (info.nextTier) return info.label + ': ' + info.current + '/' + info.target + ' · siguiente ' + info.nextTier;
  return info.label + ': ' + info.current + '/' + info.target;
}
function nextCosmeticHint() {
  var candidates = [];
  ALL_COSMETICS.forEach(function (c) {
    if (cosmeticOwned(c.id)) return;
    var info = cosmeticRequirementInfo(c);
    if (!info) return;
    if (info.kind === 'shop') {
      // Para la tienda se sugiere cuando ya se cumplen los requisitos de nivel/logro.
      if (!info.levelOk || !info.achievementOk) return;
      var coinsRemaining = Math.max(0, (Number(c.price) || 0) - state.coins);
      if (coinsRemaining > 0) {
        candidates.push({
          cosmetic: c,
          priority: isExtraCosmetic(c) ? 1 : 0,
          pct: (Number(c.price) || 1) ? Math.min(1, state.coins / Number(c.price)) : 1,
          text: 'Te ' + (coinsRemaining === 1 ? 'falta' : 'faltan') + ' ◇' + formatNumber(coinsRemaining) + ' para «' + c.name + '».'
        });
      } else {
        candidates.push({ cosmetic: c, priority: 0, pct: 1, text: '«' + c.name + '» ya está disponible en la tienda.' });
      }
      return;
    }
    var remaining = Math.max(0, Number(info.target) - Number(info.current));
    if (remaining <= 0) return;
    var unit = '';
    if (info.kind === 'streak') unit = remaining === 1 ? 'día de constancia' : 'días de constancia';
    else if (info.kind === 'recoveries') unit = remaining === 1 ? 'error recuperado' : 'errores recuperados';
    else if (info.kind === 'onTimeReviewSessions') unit = remaining === 1 ? 'repaso en fecha' : 'repasos en fecha';
    else if (info.kind === 'earlyReviewSessions') unit = remaining === 1 ? 'repaso anticipado' : 'repasos anticipados';
    else if (info.kind === 'areaMastery') unit = remaining === 1 ? 'misión al ' + Math.round((info.extra && info.target ? (info.extra.accuracy || 80) : 80)) + ' %' : 'misiones al ' + Math.round(80) + ' %';
    else if (info.kind === 'level') unit = remaining === 1 ? 'nivel' : 'niveles';
    else if (info.kind === 'achievements') unit = remaining === 1 ? 'logro' : 'logros';
    else unit = 'paso';
    var text;
    if (info.kind === 'areaMastery') {
      var area = AREA_BY_ID[info.extra.areaId];
      text = 'Te ' + (remaining === 1 ? 'falta' : 'faltan') + ' ' + remaining + ' ' + (remaining === 1 ? 'misión al 80 %' : 'misiones al 80 %') + ' en ' + (area ? area.short : 'la ruta') + ' para «' + c.name + '».';
    } else if (info.kind === 'areaMasteryGold') {
      text = 'Te ' + (remaining === 1 ? 'falta' : 'faltan') + ' ' + remaining + ' punto' + (remaining === 1 ? '' : 's') + ' de precisión en el jefe para «' + c.name + '».';
    } else if (info.kind === 'bossDefeated') {
      text = 'Te falta derrotar al guardián para «' + c.name + '».';
    } else if (info.kind === 'bossMastery') {
      text = 'Te ' + (remaining === 1 ? 'falta' : 'faltan') + ' ' + remaining + ' punto' + (remaining === 1 ? '' : 's') + ' de precisión en el jefe para «' + c.name + '».';
    } else if (info.kind === 'achievement' || info.kind === 'rank') {
      text = 'Te falta el logro «' + info.label.replace('logro «', '').replace('»', '') + '» para «' + c.name + '».';
    } else {
      text = 'Te ' + (remaining === 1 ? 'falta' : 'faltan') + ' ' + remaining + ' ' + unit + ' para «' + c.name + '».';
    }
    candidates.push({ cosmetic: c, priority: isExtraCosmetic(c) ? 1 : 0, pct: info.pct, text: text });
  });
  candidates.sort(function (a, b) {
    if (b.priority !== a.priority) return b.priority - a.priority;
    if (b.pct !== a.pct) return b.pct - a.pct;
    return a.cosmetic.name.localeCompare(b.cosmetic.name);
  });
  return candidates[0] || null;
}

/* -------------------------------------------------------------------------
   Desbloqueo automático de extras
   ------------------------------------------------------------------------- */
function unlockProgressCosmetics() {
  var unlocked = [];
  var passes = 0;
  while (passes < 2) {
    ALL_COSMETICS.forEach(function (c) {
      if (!isExtraCosmetic(c) || cosmeticOwned(c.id)) return;
      var info = extraRequirementInfo(c);
      if (info && info.canUnlock) {
        state.collection.ownedCosmeticIds.push(c.id);
        unlocked.push(c);
      }
    });
    passes += 1;
  }
  return unlocked;
}

/* -------------------------------------------------------------------------
   Equipamiento
   ------------------------------------------------------------------------- */
function sanitizeOutfit(characterId, raw) {
  var out = {};
  var source = raw && typeof raw === 'object' ? raw : {};
  COSMETIC_SLOT_ORDER.forEach(function (slot) {
    var id = source[slot];
    var c = id ? COSMETIC_BY_ID[id] : null;
    if (c && c.category === slot && cosmeticOwned(c.id)) out[slot] = c.id;
  });
  return out;
}
function getCharacterOutfit(characterId) {
  var all = state.collection.equipped || {};
  return sanitizeOutfit(characterId || state.collection.selectedCharacterId, all[characterId || state.collection.selectedCharacterId]);
}
function healEquippedOutfits() {
  var raw = state.collection.equipped && typeof state.collection.equipped === 'object' ? state.collection.equipped : {};
  var out = {};
  Object.keys(raw).forEach(function (characterId) {
    if (!CHARACTER_BY_ID[characterId]) return;
    var clean = sanitizeOutfit(characterId, raw[characterId]);
    if (Object.keys(clean).length) out[characterId] = clean;
  });
  state.collection.equipped = out;
  if (state.collection.ownedCharacterIds.indexOf(state.collection.selectedCharacterId) === -1) state.collection.selectedCharacterId = state.collection.ownedCharacterIds[0];
  if (state.collection.ownedCosmeticIds.filter(function (id) { return COSMETIC_BY_ID[id]; }).length !== state.collection.ownedCosmeticIds.length) {
    state.collection.ownedCosmeticIds = state.collection.ownedCosmeticIds.filter(function (id) { return !!COSMETIC_BY_ID[id]; });
  }
}
function setCharacterOutfit(characterId, outfit) {
  var clean = sanitizeOutfit(characterId, outfit);
  state.collection.equipped = state.collection.equipped && typeof state.collection.equipped === 'object' ? state.collection.equipped : {};
  if (Object.keys(clean).length) state.collection.equipped[characterId] = clean;
  else delete state.collection.equipped[characterId];
  persist();
  if (characterId === state.collection.selectedCharacterId && heroAvatar && typeof applyOutfitToAvatar === 'function') {
    applyOutfitToAvatar(heroAvatar, characterId);
  }
  syncHUD();
}
function equippedTitle(characterId) {
  var outfit = getCharacterOutfit(characterId);
  var title = outfit.titulo ? COSMETIC_BY_ID[outfit.titulo] : null;
  return title || null;
}
function titleText(characterId) {
  var t = equippedTitle(characterId);
  return t ? t.name : '';
}

/* -------------------------------------------------------------------------
   Tienda de los 33 originales
   ------------------------------------------------------------------------- */
function shopCosmetics() {
  return ALL_COSMETICS.filter(function (c) { return !isExtraCosmetic(c) && Number(c.price) > 0; });
}
function buyCosmetic(id) {
  var c = COSMETIC_BY_ID[id];
  if (!c) return { ok: false, reason: 'Ese cosmético no existe.' };
  if (isExtraCosmetic(c)) return { ok: false, reason: 'Este cosmético no se compra: se gana jugando.' };
  if (cosmeticOwned(id)) return { ok: false, reason: 'Ya posees este cosmético.' };
  var info = originalUnlockInfo(c);
  if (info.levelNeed && !info.levelOk) return { ok: false, reason: 'Alcanza el nivel ' + info.levelNeed + ' primero.' };
  if (info.achievementId && !info.achievementOk) return { ok: false, reason: 'Primero consigue el logro «' + ((ACHIEVEMENT_BY_ID[info.achievementId] || {}).name || info.achievementId) + '».' };
  if (state.coins < info.price) return { ok: false, reason: 'Te faltan ◇' + formatNumber(info.price - state.coins) + '.' };
  state.coins -= info.price;
  state.collection.ownedCosmeticIds.push(id);
  state.economy = state.economy && typeof state.economy === 'object' ? state.economy : { transactions: [], lifetimeSpent: 0 };
  state.economy.transactions = Array.isArray(state.economy.transactions) ? state.economy.transactions : [];
  state.economy.transactions.unshift({ type: 'cosmetic', id: id, name: c.name, price: info.price, at: nowISO(), balanceAfter: state.coins });
  state.economy.transactions = state.economy.transactions.slice(0, 200);
  state.economy.lifetimeSpent = (Number(state.economy.lifetimeSpent) || 0) + info.price;
  persist();
  return { ok: true, cosmetic: c, price: info.price };
}
function refreshAllPortraits() {
  // Las claves de caché incluyen el atuendo; no es necesario vaciar.
  syncHudPortrait();
}

/* -------------------------------------------------------------------------
   Indicador de racha y avisos neutros
   ------------------------------------------------------------------------- */
function learningStreakText() {
  var streak = Number(state.daily.streak) || 0;
  var best = Number(state.daily.bestStreak) || 0;
  if (!best) return 'Aún sin días de constancia';
  return 'Racha de constancia: ' + streak + (streak === 1 ? ' día' : ' días') + ' · mejor: ' + best;
}
function dailyCoinCapReached() {
  return !!(state.counters && state.counters.date === dateKey() && Number(state.counters.coins) >= 120);
}

/* =========================================================================
   COSMÉTICOS — modelos voxel modulares, acople y animación
   ========================================================================= */
var CLEAN_COLOR = {
  bronze: '#b9874f', silver: '#d9e2ef', gold: '#e4c07a', ink: '#243040',
  teal: '#69d3c1', blue: '#7aa2ff', violet: '#c49bff', lime: '#b8d46a',
  amber: '#f3b562', rose: '#ff8b9d', bone: '#f2f0ea', dark: '#141a25'
};
function effectQualityFactor() {
  var q = state.settings.effectsQuality || 'medio';
  return q === 'bajo' ? 0.38 : (q === 'alto' ? 1.18 : 0.72);
}
function qCount(base) {
  return Math.max(1, Math.round(base * effectQualityFactor()));
}
function addCosmeticGlow(parent, color, scale, x, y, z, opacity) {
  var s = makeGlowSprite(color, scale, opacity == null ? 0.22 : opacity);
  s.position.set(x || 0, y || 0, z || 0);
  parent.add(s);
  return s;
}
function decorateRarity(group, c, y) {
  var key = cosmeticRarityKey(c);
  var rank = rarityUI(key).order;
  if (rank < 3) return;
  var qf = effectQualityFactor();
  var col = rarityUI(key).color;
  addCosmeticGlow(group, col, 0.42 + rank * 0.12, 0, y == null ? 0.15 : y, 0.02, rank >= 5 ? 0.4 : 0.25);
  if (rank >= 4 && qf > 0.5) {
    var b = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.035), new THREE.MeshBasicMaterial({ color: color(col), transparent: true, opacity: 0.8 }));
    b.position.set(0.18, (y == null ? 0.15 : y) + 0.16, 0.02);
    group.add(b);
  }
}
function addAnim(anim, spec) { anim.push(spec); }
function buildBoxGroup(boxes) { return mergedVoxels(boxes); }
function buildHeadPiece(c, qf) {
  var g = new THREE.Group();
  var id = c.id;
  var boxes = [];
  if (id === 'c-cabeza-diadema') {
    boxes = [
      [0, 0.49, 0.04, 0.56, 0.065, 0.12, '#b68ad9'],
      [0, 0.49, 0.22, 0.36, 0.05, 0.035, '#e7d6ff', true],
      [-0.25, 0.49, 0.08, 0.08, 0.09, 0.1, '#7aa2ff', true],
      [0.25, 0.49, 0.08, 0.08, 0.09, 0.1, '#69d3c1', true],
      [0, 0.55, 0.04, 0.08, 0.06, 0.08, CLEAN_COLOR.gold, true]
    ];
  } else if (id === 'c-cabeza-casco') {
    boxes = [
      [0, 0.49, -0.01, 0.64, 0.38, 0.56, '#445064'],
      [-0.29, 0.33, 0.02, 0.17, 0.35, 0.42, '#313a48'],
      [0.29, 0.33, 0.02, 0.17, 0.35, 0.42, '#313a48'],
      [0, 0.41, 0.24, 0.48, 0.15, 0.08, '#161d29'],
      [0, 0.44, 0.31, 0.34, 0.055, 0.02, '#7aa2ff', true],
      [0, 0.66, -0.03, 0.22, 0.08, 0.18, CLEAN_COLOR.silver]
    ];
  } else if (id === 'c-cabeza-gorro') {
    boxes = [
      [0, 0.55, 0, 0.56, 0.18, 0.48, '#5d754d'],
      [0, 0.63, 0.03, 0.35, 0.12, 0.34, '#455b39'],
      [0, 0.53, 0.25, 0.45, 0.055, 0.16, '#384b30'],
      [0, 0.48, 0.06, 0.57, 0.045, 0.5, '#c8a969'],
      [0.16, 0.62, 0.22, 0.08, 0.06, 0.02, CLEAN_COLOR.teal, true]
    ];
  } else if (id === 'c-cabeza-corona') {
    boxes = [
      [0, 0.65, 0.0, 0.54, 0.11, 0.34, '#55422c'],
      [0, 0.65, 0.17, 0.36, 0.055, 0.02, CLEAN_COLOR.gold, true],
      [-0.25, 0.78, 0, 0.09, 0.28, 0.09, CLEAN_COLOR.gold],
      [0.25, 0.78, 0, 0.09, 0.28, 0.09, CLEAN_COLOR.gold],
      [0, 0.88, 0, 0.09, 0.36, 0.09, CLEAN_COLOR.gold, true],
      [-0.13, 0.82, 0, 0.06, 0.15, 0.06, '#f1d596', true],
      [0.13, 0.82, 0, 0.06, 0.15, 0.06, '#f1d596', true]
    ];
    addAnim(g.userData.anim = [], { type: 'orbit-stars', color: CLEAN_COLOR.gold, radius: 0.55, count: qCount(3) });
  } else if (id === 'c-cabeza-auriculares') {
    boxes = [
      [0, 0.63, 0.0, 0.58, 0.07, 0.08, '#26344b'],
      [-0.29, 0.43, 0.0, 0.13, 0.23, 0.26, '#1b2638'],
      [0.29, 0.43, 0.0, 0.13, 0.23, 0.26, '#1b2638'],
      [-0.29, 0.43, 0.14, 0.08, 0.18, 0.03, CLEAN_COLOR.blue, true],
      [0.29, 0.43, 0.14, 0.08, 0.18, 0.03, CLEAN_COLOR.blue, true],
      [0, 0.51, 0.22, 0.3, 0.035, 0.02, CLEAN_COLOR.teal, true]
    ];
  } else if (id.indexOf('x-dominio-') === 0) {
    var gold = /-oro$/.test(id);
    var areaColor = id.indexOf('salud') !== -1 ? CLEAN_COLOR.teal : id.indexOf('cuidado') !== -1 ? CLEAN_COLOR.blue : id.indexOf('etica') !== -1 ? CLEAN_COLOR.violet : id.indexOf('investigacion') !== -1 ? CLEAN_COLOR.lime : CLEAN_COLOR.amber;
    var band = gold ? CLEAN_COLOR.gold : '#746b59';
    var gem = gold ? '#fff0bf' : areaColor;
    boxes = [
      [0, 0.64, 0.0, 0.56, 0.12, 0.36, band],
      [0, 0.67, 0.2, 0.34, 0.045, 0.03, gem, true],
      [-0.2, 0.74, 0, 0.06, 0.22, 0.06, gold ? CLEAN_COLOR.gold : areaColor],
      [0.2, 0.74, 0, 0.06, 0.22, 0.06, gold ? CLEAN_COLOR.gold : areaColor],
      [0, 0.9, 0.03, 0.12, 0.25, 0.12, gem, true],
      [-0.1, 0.78, 0.05, 0.05, 0.05, 0.05, CLEAN_COLOR.bone, true],
      [0.1, 0.78, 0.05, 0.05, 0.05, 0.05, CLEAN_COLOR.bone, true]
    ];
    addAnim(g.userData.anim = [], { type: 'orbit-stars', color: gem, radius: 0.5, count: qCount(gold ? 4 : 2) });
  } else {
    boxes = [
      [0, 0.57, 0, 0.52, 0.12, 0.4, CLEAN_COLOR.violet],
      [0, 0.6, 0.2, 0.3, 0.04, 0.02, CLEAN_COLOR.gold, true]
    ];
  }
  addPartBoxes(g, boxes);
  decorateRarity(g, c, 0.6);
  return g;
}
function buildHairPiece(c, qf) {
  var g = new THREE.Group();
  var id = c.id;
  var boxes = [];
  if (id === 'c-peinado-coleta') {
    boxes = [
      [0, 0.56, -0.02, 0.53, 0.16, 0.47, '#633d27'],
      [-0.22, 0.42, -0.1, 0.09, 0.42, 0.23, '#633d27'],
      [0.23, 0.3, -0.29, 0.15, 0.58, 0.13, '#633d27'],
      [0.27, 0.01, -0.35, 0.12, 0.26, 0.1, '#633d27'],
      [0.25, 0.44, -0.29, 0.18, 0.07, 0.15, CLEAN_COLOR.gold, true],
      [0.28, 0.4, -0.31, 0.12, 0.12, 0.03, CLEAN_COLOR.teal, true]
    ];
    addAnim(g.userData.anim = [], { type: 'hair-tail', phase: 0.3 });
  } else if (id === 'c-peinado-rizos') {
    boxes = [
      [0, 0.58, -0.01, 0.54, 0.17, 0.48, '#241c2b'],
      [-0.26, 0.38, -0.02, 0.11, 0.36, 0.34, '#241c2b'],
      [0.26, 0.38, -0.02, 0.11, 0.36, 0.34, '#241c2b'],
      [-0.27, 0.24, 0.08, 0.13, 0.16, 0.2, '#35283d'],
      [0.27, 0.23, 0.08, 0.13, 0.16, 0.2, '#35283d'],
      [0, 0.2, -0.25, 0.42, 0.28, 0.1, '#241c2b']
    ];
  } else if (id === 'c-peinado-mecha') {
    boxes = [
      [0, 0.58, -0.01, 0.54, 0.16, 0.48, '#2a1e17'],
      [-0.23, 0.4, -0.03, 0.09, 0.4, 0.32, '#2a1e17'],
      [0.26, 0.3, -0.1, 0.16, 0.58, 0.14, '#a36cff'],
      [0.24, 0.56, 0.24, 0.14, 0.08, 0.07, '#d8c2ff', true],
      [0, 0.67, 0.02, 0.2, 0.07, 0.3, '#2a1e17']
    ];
    addAnim(g.userData.anim = [], { type: 'hair-tail', phase: 1.6 });
  } else if (id === 'c-peinado-mono') {
    boxes = [
      [0, 0.58, -0.01, 0.53, 0.16, 0.47, '#4a2a20'],
      [0, 0.79, -0.12, 0.3, 0.26, 0.28, '#4a2a20'],
      [0, 0.8, -0.12, 0.18, 0.17, 0.18, '#6c4031'],
      [-0.23, 0.44, -0.02, 0.08, 0.28, 0.36, '#4a2a20'],
      [0, 0.81, 0.02, 0.06, 0.05, 0.16, CLEAN_COLOR.gold, true]
    ];
  }
  addPartBoxes(g, boxes);
  decorateRarity(g, c, 0.55);
  return g;
}
function buildTorsoPiece(c, qf) {
  var g = new THREE.Group();
  var id = c.id;
  var boxes = [];
  if (id === 'c-torso-abrigo') {
    boxes = [
      [0, 0.4, 0.22, 0.82, 0.62, 0.06, '#5b3b33'],
      [0, 0.62, 0.12, 0.92, 0.15, 0.4, '#3b2828'],
      [0, 0.35, 0.0, 0.88, 0.12, 0.48, '#31201f'],
      [-0.24, -0.1, -0.2, 0.3, 0.65, 0.1, '#4a302b'],
      [0.24, -0.1, -0.2, 0.3, 0.65, 0.1, '#4a302b'],
      [0, 0.18, 0.23, 0.55, 0.07, 0.03, CLEAN_COLOR.gold],
      [-0.35, 0.54, 0.0, 0.18, 0.18, 0.36, '#3a2625']
    ];
  } else if (id === 'c-torso-bata') {
    boxes = [
      [0, 0.4, 0.23, 0.78, 0.66, 0.05, '#e4e8ee'],
      [-0.18, -0.2, -0.18, 0.3, 0.7, 0.09, '#e4e8ee'],
      [0.18, -0.2, -0.18, 0.3, 0.7, 0.09, '#e4e8ee'],
      [0, 0.68, 0.06, 0.82, 0.12, 0.36, '#d9e2ef'],
      [-0.22, 0.36, 0.27, 0.18, 0.15, 0.04, '#aebac9'],
      [0.22, 0.3, 0.27, 0.12, 0.18, 0.02, CLEAN_COLOR.blue, true],
      [0, 0.18, 0.26, 0.52, 0.06, 0.02, CLEAN_COLOR.blue]
    ];
  } else if (id === 'c-torso-manto') {
    boxes = [
      [0, 0.45, -0.26, 0.95, 0.9, 0.08, '#1e2944'],
      [0, 0.7, 0.06, 0.96, 0.15, 0.44, '#151d31'],
      [0, 0.63, 0.25, 0.25, 0.07, 0.04, CLEAN_COLOR.gold, true],
      [-0.4, 0.48, 0.05, 0.2, 0.48, 0.12, '#2c3c64'],
      [0.4, 0.48, 0.05, 0.2, 0.48, 0.12, '#2c3c64'],
      [0, 0.15, -0.31, 0.5, 0.07, 0.04, CLEAN_COLOR.violet, true]
    ];
    addAnim(g.userData.anim = [], { type: 'stars', color: CLEAN_COLOR.violet, radius: 0.8, count: qCount(5) });
  } else if (id === 'c-torso-chaleco') {
    boxes = [
      [0, 0.4, 0.235, 0.74, 0.56, 0.05, '#61724a'],
      [-0.3, 0.35, 0.02, 0.21, 0.62, 0.45, '#4c5e3d'],
      [0.3, 0.35, 0.02, 0.21, 0.62, 0.45, '#4c5e3d'],
      [-0.2, 0.35, 0.27, 0.16, 0.14, 0.03, '#a68856'],
      [0.18, 0.3, 0.27, 0.16, 0.14, 0.03, '#a68856'],
      [0, 0.16, 0.26, 0.52, 0.06, 0.025, CLEAN_COLOR.gold]
    ];
  } else if (id === 'c-torso-poncho') {
    boxes = [
      [0, 0.5, 0.02, 0.98, 0.25, 0.58, '#477066'],
      [0, 0.35, 0.02, 1.04, 0.24, 0.6, '#5b4d34'],
      [0, 0.13, 0.02, 0.9, 0.5, 0.56, '#3f6059'],
      [0, 0.54, 0.3, 0.48, 0.06, 0.05, CLEAN_COLOR.gold, true],
      [0, 0.34, 0.3, 0.3, 0.22, 0.03, CLEAN_COLOR.teal, true],
      [-0.42, 0.2, 0.02, 0.2, 0.2, 0.4, '#6b593d'],
      [0.42, 0.2, 0.02, 0.2, 0.2, 0.4, '#6b593d']
    ];
  } else if (id === 'x-capa-errorario') {
    boxes = [
      [0, 0.47, -0.27, 0.98, 1.0, 0.08, '#20293a'],
      [0, 0.72, 0.04, 0.96, 0.16, 0.44, '#161d2c'],
      [-0.4, 0.25, -0.32, 0.12, 0.7, 0.05, '#2b3b52'],
      [0.4, 0.25, -0.32, 0.12, 0.7, 0.05, '#2b3b52'],
      [0, 0.4, -0.33, 0.55, 0.08, 0.025, CLEAN_COLOR.rose, true],
      [0, 0.12, -0.33, 0.34, 0.05, 0.025, CLEAN_COLOR.teal, true],
      [0, 0.26, -0.33, 0.2, 0.05, 0.025, CLEAN_COLOR.violet, true]
    ];
    addAnim(g.userData.anim = [], { type: 'runes', color: CLEAN_COLOR.rose, radius: 0.65, count: qCount(4) });
  } else {
    boxes = [
      [0, 0.38, 0.23, 0.8, 0.58, 0.05, CLEAN_COLOR.blue],
      [0, 0.58, 0.25, 0.5, 0.12, 0.06, CLEAN_COLOR.gold]
    ];
  }
  addPartBoxes(g, boxes);
  decorateRarity(g, c, 0.5);
  return g;
}
function buildLegPair(c, qf, avatar) {
  var id = c.id;
  if (id === 'c-piernas-falda') {
    var g = new THREE.Group();
    addPartBoxes(g, [
      [0, 0.83, 0, 0.92, 0.1, 0.58, '#4d3b2b'],
      [0, 0.56, 0, 0.78, 0.5, 0.5, '#5a4632'],
      [-0.32, 0.35, 0.03, 0.25, 0.34, 0.38, '#5a4632'],
      [0.32, 0.35, 0.03, 0.25, 0.34, 0.38, '#5a4632'],
      [0, 0.74, 0.28, 0.66, 0.06, 0.03, CLEAN_COLOR.gold, true],
      [0, 0.45, 0.28, 0.22, 0.2, 0.03, '#c6a05c']
    ]);
    addAnim(g.userData.anim = [], { type: 'cloth', phase: 0.4 });
    var native = new THREE.Group(); native.add(g); decorateRarity(g, c, 0.6); return [{ parent: avatar.body, group: g }];
  }
  var boxes = id === 'c-piernas-grebas' ? [
    [-0.1, 0.55, 0.0, 0.34, 0.18, 0.35, '#75808e'],
    [0, 0.32, 0.06, 0.29, 0.45, 0.34, '#aeb6c8'],
    [0, 0.08, 0.08, 0.3, 0.16, 0.4, '#4a5563'],
    [0, 0.23, 0.25, 0.15, 0.08, 0.02, CLEAN_COLOR.blue, true]
  ] : [
    [-0.02, 0.58, 0.02, 0.3, 0.2, 0.3, '#574431'],
    [0.03, 0.42, 0.06, 0.25, 0.12, 0.26, '#8a6746'],
    [0, 0.27, 0.05, 0.28, 0.2, 0.28, '#3d5162'],
    [0, 0.29, 0.22, 0.14, 0.06, 0.03, CLEAN_COLOR.teal, true]
  ];
  var out = [];
  [-1, 1].forEach(function (side) {
    var g = new THREE.Group();
    addPartBoxes(g, boxes.map(function (b) { return b.slice(); }));
    decorateRarity(g, c, 0.4);
    out.push({ parent: side < 0 ? avatar.leftLeg : avatar.rightLeg, group: g });
  });
  return out;
}
function buildHeadAccessory(c, qf) {
  var g = new THREE.Group();
  if (c.id === 'c-accesorios-gafas') {
    addPartBoxes(g, [
      [-0.11, 0.34, 0.255, 0.17, 0.12, 0.035, '#26344b'],
      [0.11, 0.34, 0.255, 0.17, 0.12, 0.035, '#26344b'],
      [-0.11, 0.34, 0.275, 0.11, 0.065, 0.012, CLEAN_COLOR.blue, true],
      [0.11, 0.34, 0.275, 0.11, 0.065, 0.012, CLEAN_COLOR.blue, true],
      [0, 0.34, 0.267, 0.09, 0.027, 0.015, CLEAN_COLOR.gold],
      [-0.24, 0.34, 0.2, 0.03, 0.035, 0.08, '#26344b']
    ]);
  }
  decorateRarity(g, c, 0.34);
  return g;
}
function buildAmulet(c, qf) {
  var g = new THREE.Group();
  var id = c.id;
  if (id === 'c-amuleto-enfoque') {
    addPartBoxes(g, [
      [0, 0.58, 0.235, 0.3, 0.025, 0.02, CLEAN_COLOR.gold],
      [0, 0.5, 0.255, 0.08, 0.12, 0.04, '#d8af67'],
      [0, 0.42, 0.26, 0.17, 0.17, 0.04, CLEAN_COLOR.teal, true],
      [0, 0.42, 0.285, 0.08, 0.08, 0.02, '#dffcf4', true]
    ]);
  } else if (id === 'c-amuleto-sello') {
    addPartBoxes(g, [
      [0, 0.57, 0.235, 0.3, 0.025, 0.02, CLEAN_COLOR.gold],
      [0, 0.47, 0.255, 0.2, 0.2, 0.05, '#6e7787'],
      [0, 0.47, 0.285, 0.09, 0.09, 0.02, CLEAN_COLOR.gold, true],
      [-0.08, 0.47, 0.3, 0.025, 0.12, 0.012, '#f4e6c2']
    ]);
  } else if (id === 'c-amuleto-nudo') {
    addPartBoxes(g, [
      [0, 0.57, 0.235, 0.3, 0.025, 0.02, '#b59663'],
      [-0.08, 0.44, 0.255, 0.2, 0.11, 0.04, '#b4a09d'],
      [0.06, 0.34, 0.255, 0.14, 0.2, 0.04, '#8f7d84'],
      [0, 0.42, 0.285, 0.08, 0.07, 0.018, CLEAN_COLOR.rose, true]
    ]);
  } else {
    addPartBoxes(g, [
      [0, 0.57, 0.235, 0.3, 0.025, 0.02, CLEAN_COLOR.gold],
      [0, 0.42, 0.255, 0.18, 0.27, 0.06, '#2b2945'],
      [0, 0.44, 0.29, 0.1, 0.16, 0.02, CLEAN_COLOR.violet, true],
      [0.09, 0.52, 0.29, 0.06, 0.06, 0.02, '#f1e6ff', true]
    ]);
  }
  decorateRarity(g, c, 0.45);
  return g;
}
function buildHipExtra(c, qf, avatar) {
  var g = new THREE.Group();
  if (c.id === 'c-accesorios-bolso') {
    addPartBoxes(g, [
      [0.43, 0.84, 0.07, 0.35, 0.3, 0.19, '#604a32'],
      [0.43, 0.9, 0.18, 0.28, 0.11, 0.04, '#c59d62'],
      [0.43, 1.03, 0.06, 0.08, 0.28, 0.04, '#443322']
    ]);
  } else if (c.id === 'c-accesorios-pluma') {
    addPartBoxes(g, [
      [-0.4, 1.34, -0.02, 0.07, 0.58, 0.07, '#e2d9ca'],
      [-0.44, 1.58, 0.02, 0.14, 0.38, 0.05, '#9d7ac4'],
      [-0.4, 1.35, 0.02, 0.1, 0.08, 0.06, CLEAN_COLOR.gold, true],
      [-0.38, 1.18, 0.03, 0.18, 0.16, 0.08, '#3c2d4f']
    ]);
  } else if (c.id === 'x-reloj-arena') {
    g.position.set(-0.7, 1.48, -0.05);
    addPartBoxes(g, [
      [-0.18, 0, 0, 0.36, 0.08, 0.3, '#b98d58'],
      [0.18, 0, 0, 0.36, 0.08, 0.3, '#b98d58'],
      [0, 0.01, 0, 0.03, 0.36, 0.03, '#d5c39a', true],
      [0, -0.01, 0, 0.26, 0.22, 0.045, CLEAN_COLOR.teal, true]
    ]);
    addAnim(g.userData.anim = [], { type: 'float', baseY: 1.48, phase: 1.1, amplitude: 0.12, rotate: 0.35 });
  } else if (c.id === 'x-cuaderno-orbital') {
    g.position.set(-0.72, 1.52, -0.1);
    addPartBoxes(g, [
      [0, 0, 0, 0.4, 0.5, 0.07, '#232d42'],
      [0, 0.05, 0.05, 0.32, 0.4, 0.025, '#dce7f2'],
      [-0.2, 0, 0, 0.04, 0.52, 0.08, CLEAN_COLOR.gold],
      [0.2, 0, 0, 0.04, 0.52, 0.08, CLEAN_COLOR.gold],
      [0, 0.08, 0.08, 0.12, 0.05, 0.015, CLEAN_COLOR.blue, true]
    ]);
    addAnim(g.userData.anim = [], { type: 'orbit', radius: 0.55, speed: 0.45, baseY: 1.52, phase: 0.2 });
  } else if (c.id.indexOf('x-trofeo-') === 0) {
    var trophyColor = c.id.indexOf('salud') !== -1 ? CLEAN_COLOR.teal : c.id.indexOf('cuidado') !== -1 ? CLEAN_COLOR.blue : c.id.indexOf('etica') !== -1 ? CLEAN_COLOR.violet : c.id.indexOf('investigacion') !== -1 ? CLEAN_COLOR.lime : CLEAN_COLOR.amber;
    g.position.set(0.75, 1.65, -0.35);
    var kind = c.id.indexOf('salud') !== -1 ? 'seed' : c.id.indexOf('cuidado') !== -1 ? 'lantern' : c.id.indexOf('etica') !== -1 ? 'mirror' : c.id.indexOf('investigacion') !== -1 ? 'prism' : 'gear';
    if (kind === 'seed') addPartBoxes(g, [[0, 0, 0, 0.22, 0.26, 0.18, trophyColor], [0, 0.2, 0, 0.08, 0.18, 0.08, '#e5fff9', true]]);
    else if (kind === 'lantern') addPartBoxes(g, [[0, 0, 0, 0.22, 0.12, 0.22, CLEAN_COLOR.gold], [0, 0.16, 0, 0.3, 0.24, 0.3, '#2d3850'], [0, 0.18, 0, 0.16, 0.12, 0.16, trophyColor, true]]);
    else if (kind === 'mirror') addPartBoxes(g, [[0, 0, 0, 0.24, 0.36, 0.08, '#332b42'], [0, 0.04, 0.05, 0.16, 0.24, 0.02, trophyColor, true]]);
    else if (kind === 'prism') addPartBoxes(g, [[0, 0, 0, 0.26, 0.34, 0.12, trophyColor], [0, 0.1, 0.07, 0.14, 0.16, 0.02, '#f5f7d9', true]]);
    else addPartBoxes(g, [[0, 0, 0, 0.3, 0.08, 0.3, CLEAN_COLOR.gold], [0, 0.12, 0, 0.14, 0.14, 0.14, trophyColor, true]]);
    addAnim(g.userData.anim = [], { type: 'orbit', radius: 0.16, speed: 0.7, baseY: 1.65, phase: 1.3 });
  }
  decorateRarity(g, c, 0.35);
  return g;
}
function buildAmuletHolder(c, qf) { return buildAmulet(c, qf); }
function buildLegExtra() { return null; }

/* -------------------------------------------------------------------------
   Efectos, marcos, mascotas y estelas
   ------------------------------------------------------------------------- */
function buildEffectPiece(c, qf, avatar) {
  var g = new THREE.Group();
  var id = c.id;
  var colors = {
    'c-efecto-aura': '#e4c07a', 'c-efecto-chispas': '#f3b562', 'c-efecto-bruma': '#7aa2ff',
    'c-efecto-constelacion': '#c49bff', 'x-aura-amanecer': '#f3b562'
  };
  var colorHex = colors[id] || CLEAN_COLOR.blue;
  if (id.indexOf('x-arma-') === 0) {
    var areaColors = { 'x-arma-destello': CLEAN_COLOR.teal, 'x-arma-marea': CLEAN_COLOR.blue, 'x-arma-sello': CLEAN_COLOR.violet, 'x-arma-prisma': CLEAN_COLOR.lime, 'x-arma-orbita': CLEAN_COLOR.amber };
    var wc = areaColors[id] || CLEAN_COLOR.gold;
    var n = qCount(5);
    for (var wi = 0; wi < n; wi++) {
      var p = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: color(wc), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
      p.scale.setScalar(0.12 + (wi % 3) * 0.05);
      p.position.set((wi % 2 ? 0.16 : -0.16), 0.35 + wi * 0.16, 0.09);
      g.add(p);
    }
    addAnim(g.userData.anim = [], { type: 'weapon-motes', color: wc, count: n });
    return g;
  }
  if (id === 'c-efecto-aura' || id === 'x-aura-amanecer') {
    var aura = makeGlowSprite(colorHex, id === 'x-aura-amanecer' ? 2.8 : 2.2, 0.2);
    aura.position.y = 1.1;
    g.add(aura);
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.018, 4, 28), new THREE.MeshBasicMaterial({ color: color(colorHex), transparent: true, opacity: 0.38 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.04;
    g.add(ring);
    addAnim(g.userData.anim = [], { type: 'aura', color: colorHex, ring: ring, baseY: 1.1 });
  } else if (id === 'c-efecto-chispas') {
    var count = qCount(8);
    for (var i = 0; i < count; i++) {
      var sp = makeGlowSprite(colorHex, 0.17, 0.7);
      sp.position.set((Math.random() - 0.5) * 1.3, 0.5 + Math.random() * 1.8, (Math.random() - 0.5) * 0.8);
      g.add(sp);
    }
    addAnim(g.userData.anim = [], { type: 'sparks', color: colorHex, count: count });
  } else if (id === 'c-efecto-bruma') {
    var mistCount = qCount(7);
    for (var mi = 0; mi < mistCount; mi++) {
      var mist = new THREE.Sprite(new THREE.SpriteMaterial({ map: SOFT_GLOW, color: color(colorHex), transparent: true, opacity: 0.12, depthWrite: false }));
      mist.scale.set(1.6 + (mi % 2) * 0.5, 0.7, 1);
      mist.position.set(-1.0 + (mi % 4) * 0.65, 0.15 + Math.floor(mi / 4) * 0.1, -0.2 + (mi % 3) * 0.25);
      g.add(mist);
    }
    addAnim(g.userData.anim = [], { type: 'mist', color: colorHex });
  } else if (id === 'c-efecto-constelacion') {
    var stars = qCount(9);
    for (var si = 0; si < stars; si++) {
      var star = makeGlowSprite(CLEAN_COLOR.gold, 0.3, 0.55);
      star.position.set((Math.random() - 0.5) * 1.9, 0.5 + Math.random() * 2.1, -0.1 + (Math.random() - 0.5) * 0.7);
      g.add(star);
    }
    addAnim(g.userData.anim = [], { type: 'constellation', color: CLEAN_COLOR.gold, count: stars });
  }
  return g;
}
function buildFramePiece(c, qf, avatar) {
  var g = new THREE.Group();
  var id = c.id;
  var colorHex = id === 'c-marco-bronce' ? '#b9874f' : id === 'c-marco-platino' ? '#d9e2ef' : id === 'c-marco-vacio' ? '#a57ad8' : '#e4c07a';
  var w = 1.38, h = 2.55, t = 0.065;
  var mat = new THREE.MeshBasicMaterial({ color: color(colorHex), transparent: true, opacity: 0.48, depthWrite: false, blending: THREE.AdditiveBlending });
  var frame = new THREE.Group();
  var top = new THREE.Mesh(new THREE.BoxGeometry(w, t, t), mat);
  top.position.y = h / 2;
  var bottom = top.clone(); bottom.position.y = -h / 2;
  var left = new THREE.Mesh(new THREE.BoxGeometry(t, h, t), mat); left.position.x = -w / 2;
  var right = left.clone(); right.position.x = w / 2;
  frame.add(top, bottom, left, right);
  frame.position.set(0, 1.35, -0.68);
  g.add(frame);
  var glow = makeGlowSprite(colorHex, 2.6, 0.13);
  glow.position.set(0, 1.35, -0.72);
  g.add(glow);
  if (id === 'c-marco-constelacion') {
    for (var i = 0; i < qCount(6); i++) {
      var st = makeGlowSprite(CLEAN_COLOR.gold, 0.24, 0.65);
      st.position.set((Math.random() - 0.5) * 1.7, 0.2 + Math.random() * 2.3, -0.62);
      g.add(st);
    }
  } else if (id === 'c-marco-vacio') {
    var voidGlow = makeGlowSprite(CLEAN_COLOR.violet, 3.0, 0.16);
    voidGlow.position.set(0, 1.4, -0.7);
    g.add(voidGlow);
  }
  addAnim(g.userData.anim = [], { type: 'frame', baseY: 1.35, color: colorHex });
  return g;
}
function buildPetPiece(c, qf, avatar) {
  var g = new THREE.Group();
  var id = c.id;
  var stage = cosmeticStage(c);
  var petColor = id === 'x-luciernaga-observatorio' ? CLEAN_COLOR.teal : id === 'x-buho-cometa' ? '#6b8fc9' : '#b56a42';
  g.position.set(-0.92, 1.35, -0.12);
  if (id === 'x-luciernaga-observatorio') {
    var size = 0.16 + stage * 0.05;
    addPartBoxes(g, [
      [0, 0, 0, size, size * 1.2, size, '#21362f'],
      [0, 0.02, 0.05, size * 0.6, size * 0.6, 0.04, CLEAN_COLOR.teal, true],
      [-size, 0.04, 0, size, 0.05, 0.16, '#d9fff7'],
      [size, 0.04, 0, size, 0.05, 0.16, '#d9fff7']
    ]);
    if (stage >= 2) addPartBoxes(g, [[0, -0.18, 0, 0.1, 0.1, 0.1, CLEAN_COLOR.gold, true]]);
    if (stage >= 3) {
      var halo = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.012, 4, 20), new THREE.MeshBasicMaterial({ color: color(CLEAN_COLOR.gold), transparent: true, opacity: 0.7 }));
      halo.rotation.x = Math.PI / 2; halo.position.y = 0.18; g.add(halo);
    }
    addAnim(g.userData.anim = [], { type: 'pet', baseY: 1.35, phase: 0.2, orbit: 0.2, speed: 0.7, glowColor: petColor });
  } else if (id === 'x-buho-cometa') {
    var scale = 1 + (stage - 1) * 0.12;
    addPartBoxes(g, [
      [-0.13, 0, 0, 0.26, 0.3, 0.22, '#364b6c'],
      [0, 0.1, 0.02, 0.34, 0.3, 0.27, '#587cad'],
      [-0.13, 0.3, 0, 0.1, 0.08, 0.1, '#2a3a53'],
      [0.13, 0.3, 0, 0.1, 0.08, 0.1, '#2a3a53'],
      [-0.09, 0.16, 0.26, 0.04, 0.04, 0.02, '#fff5d0', true],
      [0.09, 0.16, 0.26, 0.04, 0.04, 0.02, '#fff5d0', true],
      [-0.23, 0.0, 0, 0.1, 0.26, 0.18, '#455e83'],
      [0.23, 0.0, 0, 0.1, 0.26, 0.18, '#455e83']
    ]);
    g.scale.setScalar(scale);
    addAnim(g.userData.anim = [], { type: 'pet', baseY: 1.35, phase: 1.4, orbit: 0.23, speed: 0.55, glowColor: petColor });
  } else {
    addPartBoxes(g, [
      [-0.12, 0, 0, 0.28, 0.22, 0.22, '#8b4f36'],
      [0, 0.13, 0.02, 0.32, 0.27, 0.26, '#b56a42'],
      [-0.12, 0.31, 0, 0.09, 0.15, 0.09, '#6a3828'],
      [0.12, 0.31, 0, 0.09, 0.15, 0.09, '#6a3828'],
      [-0.06, 0.2, 0.15, 0.04, 0.04, 0.02, '#f1d995', true],
      [0.06, 0.2, 0.15, 0.04, 0.04, 0.02, '#f1d995', true],
      [-0.26, 0.0, -0.04, 0.16, 0.12, 0.34, '#7d452f'],
      [0.04, 0.02, -0.22, 0.11, 0.09, 0.3, '#b56a42']
    ]);
    if (stage >= 2) addPartBoxes(g, [[0, 0.05, 0.15, 0.22, 0.06, 0.05, CLEAN_COLOR.gold]]);
    if (stage >= 3) addPartBoxes(g, [[-0.13, 0.2, 0.18, 0.06, 0.13, 0.04, CLEAN_COLOR.rose, true]]);
    addAnim(g.userData.anim = [], { type: 'pet', baseY: 1.35, phase: 2.2, orbit: 0.27, speed: 0.5, glowColor: petColor });
  }
  return g;
}
function buildTrailPiece(c, qf, avatar) {
  var g = new THREE.Group();
  g.position.set(0, 0.3, 0);
  var stage = cosmeticStage(c);
  var count = qCount(5 + stage * 2);
  var colorHex = stage >= 3 ? CLEAN_COLOR.gold : stage >= 2 ? CLEAN_COLOR.violet : CLEAN_COLOR.teal;
  for (var i = 0; i < count; i++) {
    var sp = makeGlowSprite(colorHex, 0.28 + (i % 3) * 0.08, 0.48);
    sp.position.set(-0.28 + (i % 4) * 0.18, 0.05 + (i % 2) * 0.08, -0.3 - i * 0.08);
    g.add(sp);
  }
  addAnim(g.userData.anim = [], { type: 'trail', color: colorHex, stage: stage });
  return g;
}

/* -------------------------------------------------------------------------
   Acople al héroe, conflictos y limpieza
   ------------------------------------------------------------------------- */
function chooseAnchorForCosmetic(c, avatar) {
  if (c.category === 'cabeza' || c.category === 'peinado') return avatar.head;
  if (c.category === 'torso') return avatar.torso;
  if (c.category === 'amuletos') return avatar.torso;
  if (c.category === 'accesorios') {
    if (c.id === 'c-accesorios-gafas') return avatar.head;
    if (c.id === 'c-accesorios-brujula') return avatar.leftArm;
    return avatar.body;
  }
  if (c.category === 'extras') return avatar.body;
  if (c.category === 'efectos') {
    if (c.id.indexOf('x-arma-') === 0) return avatar.weapon;
    return avatar.root;
  }
  if (c.category === 'marcos') return avatar.root;
  if (c.category === 'mascota') return avatar.root;
  if (c.category === 'estela') return avatar.root;
  return avatar.body;
}
function addPieceGroup(avatar, parent, group, c, animList, slot) {
  parent.add(group);
  avatar.cosmetics.groups.push(group);
  group.userData.cosmeticId = c.id;
  group.userData.slot = slot;
  if (group.userData.anim) {
    group.userData.anim.forEach(function (spec) {
      spec.group = group;
      animList.push(spec);
    });
  }
  return group;
}
function clearAvatarCosmetics(avatar) {
  if (!avatar) return;
  if (avatar.cosmetics && avatar.cosmetics.groups) {
    var disposedMaterials = [];
    avatar.cosmetics.groups.forEach(function (group) {
      if (group.parent) group.parent.remove(group);
      group.traverse(function (node) {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
          if (disposedMaterials.indexOf(node.material) === -1) {
            disposedMaterials.push(node.material);
            node.material.dispose();
          }
        }
      });
    });
  }
  avatar.cosmetics = { groups: [], animated: [], slots: {}, title: null, frame: null };
  if (avatar.head && avatar.head.userData && avatar.head.userData.baseHatGroups) {
    avatar.head.userData.baseHatGroups.forEach(function (g) { g.visible = true; });
  }
  if (avatar.hairTail) avatar.hairTail.visible = true;
}
function applyOutfitToAvatar(avatar, characterId, outfitOverride) {
  if (!avatar) return;
  clearAvatarCosmetics(avatar);
  var outfit = outfitOverride !== undefined ? (outfitOverride || {}) : getCharacterOutfit(characterId);
  var hasHeadOrHair = !!(outfit.cabeza || outfit.peinado);
  if (hasHeadOrHair && avatar.head && avatar.head.userData && avatar.head.userData.baseHatGroups) {
    avatar.head.userData.baseHatGroups.forEach(function (g) { g.visible = false; });
  }
  if (outfit.peinado && avatar.hairTail) avatar.hairTail.visible = false;
  var animated = [];
  var qf = effectQualityFactor();
  COSMETIC_SLOT_ORDER.forEach(function (slot) {
    var id = outfit[slot];
    if (!id) return;
    var c = COSMETIC_BY_ID[id];
    if (!c) return;
    var stage = cosmeticStage(c);
    var group = null;
    if (slot === 'cabeza') group = buildHeadPiece(c, qf);
    else if (slot === 'peinado') group = buildHairPiece(c, qf);
    else if (slot === 'torso') group = buildTorsoPiece(c, qf);
    else if (slot === 'accesorios') group = (c.id === 'c-accesorios-gafas' ? buildHeadAccessory(c, qf) : c.id === 'c-accesorios-brujula' ? buildWristCompass(c, qf) : buildHipExtra(c, qf, avatar));
    else if (slot === 'extras') group = buildHipExtra(c, qf, avatar);
    else if (slot === 'amuletos') group = buildAmulet(c, qf);
    else if (slot === 'efectos') group = buildEffectPiece(c, qf, avatar);
    else if (slot === 'marcos') {
      if (state.settings.hide3dFrames) return;
      group = buildFramePiece(c, qf, avatar);
      avatar.cosmetics.frame = group;
    } else if (slot === 'mascota') group = buildPetPiece(c, qf, avatar);
    else if (slot === 'estela') group = buildTrailPiece(c, qf, avatar);
    if (group) {
      var parent = chooseAnchorForCosmetic(c, avatar);
      if (slot === 'extras') parent = avatar.body;
      addPieceGroup(avatar, parent, group, c, animated, slot);
      avatar.cosmetics.slots[slot] = c.id;
    }
  });
  var pants = outfit.piernas ? COSMETIC_BY_ID[outfit.piernas] : null;
  if (pants) {
    var pieces = buildLegPair(pants, qf, avatar);
    if (Array.isArray(pieces)) {
      pieces.forEach(function (p) {
        addPieceGroup(avatar, p.parent, p.group, pants, animated, 'piernas');
      });
      avatar.cosmetics.slots.piernas = pants.id;
    }
  }
  avatar.cosmetics.animated = animated;
  if (outfit.titulo) avatar.cosmetics.title = outfit.titulo;
}
function buildWristCompass(c, qf) {
  var g = new THREE.Group();
  addPartBoxes(g, [
    [0, -0.58, 0.05, 0.3, 0.08, 0.28, '#574631'],
    [0.01, -0.56, 0.2, 0.16, 0.2, 0.04, CLEAN_COLOR.gold],
    [0.01, -0.56, 0.23, 0.1, 0.1, 0.02, '#d9fbff', true],
    [0, -0.56, 0.24, 0.02, 0.13, 0.012, CLEAN_COLOR.rose, true]
  ]);
  decorateRarity(g, c, 0.1);
  return g;
}
function animateAvatarCosmetics(av, dt, time, running, speedNorm) {
  if (!av || !av.cosmetics) return;
  var qf = effectQualityFactor();
  av.cosmetics.animated.forEach(function (a) {
    var g = a.group;
    if (!g) return;
    if (a.type === 'orbit-stars' || a.type === 'stars' || a.type === 'constellation') {
      g.rotation.y = time * 0.25;
      g.position.y = Math.sin(time * 1.4 + (a.phase || 0)) * 0.03;
    } else if (a.type === 'aura') {
      if (a.ring) a.ring.scale.setScalar(1 + Math.sin(time * 1.4) * 0.08);
      g.position.y = Math.sin(time * 0.8) * 0.02;
    } else if (a.type === 'sparks' || a.type === 'mist') {
      g.rotation.y = time * (a.type === 'sparks' ? 0.4 : 0.12);
    } else if (a.type === 'float') {
      g.position.y = (a.baseY || g.position.y) + Math.sin(time * 1.2 + a.phase) * (a.amplitude || 0.1);
      if (a.rotate) g.rotation.y += dt * a.rotate;
    } else if (a.type === 'orbit') {
      var radius = a.radius || 0.5;
      var baseY = a.baseY || 1.5;
      g.position.set(-0.45 + Math.cos(time * (a.speed || 0.45) + (a.phase || 0)) * radius, baseY + Math.sin(time * 1.3 + a.phase) * 0.07, -0.2 + Math.sin(time * (a.speed || 0.45) + (a.phase || 0)) * radius * 0.4);
    } else if (a.type === 'hair-tail') {
      g.rotation.x = -0.05 - (running ? speedNorm * 0.12 : 0) + Math.sin(time * 2.2 + a.phase) * 0.05;
      g.rotation.z = Math.sin(time * 1.6 + a.phase) * 0.035;
    } else if (a.type === 'cloth') {
      g.rotation.x = Math.sin(time * 1.4 + a.phase) * 0.025 - (running ? 0.04 : 0);
    } else if (a.type === 'runes') {
      g.rotation.y = time * 0.12;
    } else if (a.type === 'frame') {
      g.position.y = (a.baseY || 1.35) + Math.sin(time * 0.8) * 0.02;
      g.rotation.y = Math.sin(time * 0.35) * 0.08;
    } else if (a.type === 'pet') {
      var baseY = a.baseY || 1.35;
      var orbit = a.orbit || 0.2;
      g.position.set(-0.9 + Math.cos(time * (a.speed || 0.6) + (a.phase || 0)) * orbit, baseY + Math.sin(time * 2 + a.phase) * 0.12, -0.05 + Math.sin(time * (a.speed || 0.6) + (a.phase || 0)) * orbit * 0.45);
      g.rotation.y = Math.cos(time * 0.8 + a.phase) * 0.2;
      g.rotation.z = Math.sin(time * 2.2 + a.phase) * 0.04;
    } else if (a.type === 'weapon-motes') {
      g.rotation.y = time * 0.9;
    } else if (a.type === 'trail') {
      g.rotation.y = Math.sin(time * 0.5) * 0.05;
      g.position.y = 0.28 + Math.sin(time * 1.5) * 0.025;
    }
  });
}

/* -------------------------------------------------------------------------
   Utilidades de marcos 2D y títulos
   ------------------------------------------------------------------------- */
function equippedFrameFor(characterId) {
  var outfit = getCharacterOutfit(characterId);
  return outfit.marcos ? COSMETIC_BY_ID[outfit.marcos] : null;
}
function frameColorFor(characterId) {
  var c = equippedFrameFor(characterId);
  if (!c) return '';
  if (c.id === 'c-marco-bronce') return '#b9874f';
  if (c.id === 'c-marco-platino') return '#d9e2ef';
  if (c.id === 'c-marco-vacio') return '#c49bff';
  return '#e4c07a';
}

/* =========================================================================
   COSMÉTICOS — inventario/equipador, tienda, ajustes y galerías de QA
   ========================================================================= */
var wardrobe = {
  active: false,
  characterId: null,
  slot: 'cabeza',
  rarity: 'todas',
  draft: {},
  saved: {},
  selectedId: null,
  compareSaved: false,
  preview: null,
  rotation: -0.35,
  dragging: false,
  lastX: 0,
  previewDirty: true,
  raf: 0
};
var shop = {
  active: false,
  slot: 'todas',
  rarity: 'todas',
  selectedId: null,
  confirmId: null
};

function cosmeticsOwnedCountLabel() { return countOwnedCosmetics() + '/' + countAllCosmetics(); }
function raritySelectHTML(selected, action) {
  return '<select class="selectMini" data-' + action + '>' + ['todas'].concat(RARITY_ORDER).map(function (r) {
    var label = r === 'todas' ? 'Todas las rarezas' : rarityUI(r).label;
    return '<option value="' + r + '" ' + (selected === r ? 'selected' : '') + '>' + label + '</option>';
  }).join('') + '</select>';
}
function slotTabsHTML(active, action, counts) {
  return COSMETIC_SLOT_ORDER.map(function (slot) {
    var meta = COSMETIC_SLOT_LOOKUP[slot];
    var count = counts ? counts[slot] : 0;
    return '<button type="button" class="slotTab ' + (active === slot ? 'is-active' : '') + '" data-action="' + action + '" data-slot="' + esc(slot) + '">' +
      '<span>' + esc(meta ? meta.label : slot) + '</span><small>' + count + '</small></button>';
  }).join('');
}
function slotCounts() {
  var counts = {};
  COSMETIC_SLOT_ORDER.forEach(function (slot) { counts[slot] = cosmeticsInSlot(slot).length; });
  return counts;
}
function filteredCosmeticsFor(slot, rarity, onlyOwned) {
  return ALL_COSMETICS.filter(function (c) {
    return c.category === slot && (rarity === 'todas' || cosmeticRarityKey(c) === rarity) && (!onlyOwned || cosmeticOwned(c.id));
  });
}
function itemStatus(c, outfit) {
  if (!cosmeticOwned(c.id)) return { label: 'Bloqueado', cls: 'chip' };
  if (outfit && outfit[c.category] === c.id) return { label: 'Equipado', cls: 'chip chip--completed' };
  if (wardrobe.draft[c.category] === c.id) return { label: 'Probando', cls: 'chip chip--accent' };
  return { label: 'Poseído', cls: 'chip' };
}

/* -------------------------------------------------------------------------
   Equipador / inventario
   ------------------------------------------------------------------------- */
function openWardrobe(characterId) {
  if (screen === 'duel') return;
  wardrobe.active = true;
  wardrobe.characterId = characterId || state.collection.selectedCharacterId;
  if (state.collection.ownedCharacterIds.indexOf(wardrobe.characterId) === -1 && state.collection.ownedCharacterIds.length) {
    wardrobe.characterId = state.collection.ownedCharacterIds[0];
  }
  wardrobe.saved = getCharacterOutfit(wardrobe.characterId);
  wardrobe.draft = Object.assign({}, wardrobe.saved);
  wardrobe.slot = 'cabeza';
  wardrobe.rarity = 'todas';
  wardrobe.selectedId = null;
  wardrobe.compareSaved = false;
  sheetReturn = screen === 'pause' ? 'pause' : (screen === 'title' ? 'title' : 'hub');
  setScreen('wardrobe');
  initAudio();
  sfxSelect();
}
function wardrobeCharacterSwitch(id) {
  if (state.collection.ownedCharacterIds.indexOf(id) === -1) return;
  wardrobe.characterId = id;
  wardrobe.saved = getCharacterOutfit(id);
  wardrobe.draft = Object.assign({}, wardrobe.saved);
  wardrobe.selectedId = null;
  wardrobe.compareSaved = false;
  wardrobe.previewDirty = true;
  renderScreen();
  mountWardrobePreview();
}
function wardrobeSetSlot(slot) {
  wardrobe.slot = slot;
  wardrobe.selectedId = null;
  wardrobe.compareSaved = false;
  renderScreen();
  mountWardrobePreview();
}
function wardrobeSetRarity(rarity) {
  wardrobe.rarity = rarity || 'todas';
  renderScreen();
  mountWardrobePreview();
}
function wardrobeSelectItem(id) {
  var c = COSMETIC_BY_ID[id];
  if (!c) return;
  wardrobe.selectedId = id;
  if (cosmeticOwned(id)) {
    if (wardrobe.draft[c.category] === id) delete wardrobe.draft[c.category];
    else wardrobe.draft[c.category] = id;
    wardrobe.previewDirty = true;
    sfxClick();
  } else {
    sfxClick();
  }
  renderScreen();
  mountWardrobePreview();
}
function wardrobeClearSlot(slot) {
  if (wardrobe.draft[slot]) { delete wardrobe.draft[slot]; wardrobe.previewDirty = true; sfxSelect(); renderScreen(); mountWardrobePreview(); }
}
function wardrobeSave() {
  if (!wardrobe.characterId) return;
  if (state.collection.ownedCharacterIds.indexOf(wardrobe.characterId) === -1) return;
  setCharacterOutfit(wardrobe.characterId, wardrobe.draft);
  wardrobe.saved = getCharacterOutfit(wardrobe.characterId);
  wardrobe.draft = Object.assign({}, wardrobe.saved);
  wardrobe.compareSaved = false;
  toast('Atuendo guardado. El héroe ya lo lleva en el observatorio y en los duelos.', 'success', 3800);
  renderScreen();
  mountWardrobePreview();
  sfxVictory();
}
function wardrobeDiscard() {
  wardrobe.draft = Object.assign({}, wardrobe.saved);
  wardrobe.selectedId = null;
  wardrobe.compareSaved = false;
  wardrobe.previewDirty = true;
  renderScreen();
  mountWardrobePreview();
  sfxClick();
}
function wardrobeDirty() {
  return Object.keys(wardrobe.saved).sort().some(function (k) { return wardrobe.saved[k] !== wardrobe.draft[k]; }) ||
    Object.keys(wardrobe.draft).sort().some(function (k) { return wardrobe.saved[k] !== wardrobe.draft[k]; });
}
function frameBadge(c) {
  var meta = rarityUI(cosmeticRarityKey(c));
  return '<span class="rarityDot" style="background:' + meta.color + ';box-shadow:0 0 8px ' + meta.color + '"></span>';
}
function cosmeticCardHTML(c, outfit, mode) {
  var status = mode === 'specific' ? (cosmeticOwned(c.id) ? (wardrobe.saved[c.category] === c.id ? 'Equipado' : 'Poseído') : 'Bloqueado') : itemStatus(c, outfit);
  var selected = mode === 'specific' ? wardrobe.selectedId === c.id : shop.selectedId === c.id;
  var rarity = rarityUI(cosmeticRarityKey(c));
  var statusCls = status.cls || 'chip';
  var priceText = !cosmeticOwned(c.id) && Number(c.price) > 0 ? '<span class="itemPrice">◇' + formatNumber(c.price) + '</span>' : '';
  return '<button type="button" class="cosmeticItem ' + (selected ? 'is-selected ' : '') + (cosmeticOwned(c.id) ? 'is-owned ' : 'is-locked') + '" style="--rarity-color:' + rarity.color + '" data-action="' + (mode === 'specific' ? 'wardrobe-item' : 'shop-item') + '" data-id="' + esc(c.id) + '">' +
    '<span class="rarityBar"></span>' + frameBadge(c) +
    '<span class="cosmeticItemCopy"><b>' + esc(c.name) + '</b><small>' + esc(rarity.label) + ' · ' + esc(cosmeticSlotLabel(c.category)) + '</small></span>' +
    priceText + '<span class="chip ' + (cosmeticOwned(c.id) ? statusCls : '') + '">' + esc(status.label || (cosmeticOwned(c.id) ? 'Poseído' : 'Bloqueado')) + '</span>' +
  '</button>';
}
function cosmeticDetailHTML(c, mode) {
  if (!c) return '<div class="wardrobeEmpty"><span class="eyebrow noRule">Selecciona una pieza</span><h3>Previsualiza antes de equipar.</h3><p>Elige una ranura y una pieza de la lista. La vista 3D se actualizará al instante.</p></div>';
  var rarity = rarityUI(cosmeticRarityKey(c));
  var owned = cosmeticOwned(c.id);
  var req = cosmeticRequirementInfo(c);
  var status = mode === 'specific' ? (owned ? (wardrobe.draft[c.category] === c.id ? 'Probando' : 'Poseído') : 'Bloqueado') : (owned ? 'Poseído' : 'Bloqueado');
  var progress = cosmeticProgressText(c);
  var nextStage = Array.isArray(c.stageLabels) && owned ? cosmeticStageLabel(c) : '';
  var titleExtra = c.category === 'titulo' ? '<p class="tiny dim">Los títulos se muestran junto al nombre; no son una pieza 3D.</p>' : '';
  var actions = '';
  if (mode === 'specific') {
    if (owned) {
      actions = '<button type="button" class="btn btn--primary btn--sm btn--block" data-action="wardrobe-item" data-id="' + esc(c.id) + '">' + (wardrobe.draft[c.category] === c.id ? 'Quitar del borrador' : 'Probar esta pieza') + '</button>';
    } else {
      actions = '<div class="notice">' + esc(req.requirementText) + '<br /><b>Progreso:</b> ' + esc(progress) + '</div><button type="button" class="btn btn--ghost btn--sm btn--block" data-action="open-shop">Ir a la tienda</button>';
    }
    if (wardrobe.draft[c.category] && wardrobe.draft[c.category] !== c.id) actions += '<button type="button" class="btn btn--quiet btn--sm btn--block" data-action="wardrobe-clear" data-slot="' + esc(c.category) + '">Quitar la pieza actual de la ranura</button>';
  } else {
    if (owned) actions = '<div class="notice"><b>Ya está en tu colección.</b> Puedes equiparlo desde el inventario.</div>';
    else {
      var can = req && req.canBuy;
      actions = '<div class="shopRequirement"><span>Requisito</span><b>' + esc(req ? req.requirementText : '') + '</b></div>' +
        '<div class="shopRequirement"><span>Tu saldo</span><b>◇' + formatNumber(state.coins) + '</b></div>' +
        (req && req.levelNeed && !req.levelOk ? '<div class="notice">' + icon('lock', 12) + ' Necesitas nivel ' + req.levelNeed + '.</div>' : '') +
        (req && req.achievementId && !req.achievementOk ? '<div class="notice">' + icon('lock', 12) + ' Primero consigue el logro correspondiente.</div>' : '') +
        '<button type="button" class="btn ' + (can ? 'btn--primary' : '') + ' btn--block" data-action="shop-buy" data-id="' + esc(c.id) + '" ' + (can ? '' : 'disabled') + '>' + icon('coin', 14) + (can ? ' Comprar por ◇' + formatNumber(c.price) : ' Compra bloqueada') + '</button>' +
        (shop.confirmId === c.id ? '<div class="buyConfirm"><b>Confirmar compra</b><p>' + esc(c.name) + ' · ◇' + formatNumber(c.price) + ' · saldo después: ◇' + formatNumber(Math.max(0, state.coins - c.price)) + '</p><div><button type="button" class="btn btn--gold btn--sm" data-action="shop-confirm" data-id="' + esc(c.id) + '">Confirmar</button><button type="button" class="btn btn--ghost btn--sm" data-action="shop-cancel-buy">Cancelar</button></div></div>' : '');
    }
  }
  return '<div class="cosmeticDetailHead">' + frameBadge(c) + '<span class="chip" style="color:' + rarity.color + ';border-color:' + rarity.color + '">' + esc(rarity.label) + '</span><span class="chip">' + esc(cosmeticSlotLabel(c.category)) + '</span><span class="chip">' + esc(status) + '</span></div>' +
    '<h3>' + esc(c.name) + '</h3><p class="cosmeticDesc">' + esc(c.description || '') + '</p>' + titleExtra +
    '<div class="cosmeticProgress"><span>' + esc(cosmeticOwned(c.id) ? 'Progreso' : 'Cómo conseguirlo') + '</span><b>' + esc(progress) + '</b>' +
    (nextStage ? '<small>' + esc(nextStage) + '</small>' : '') + '</div>' +
    (req && req.nextTier ? '<div class="bar"><i style="width:' + Math.round(req.pct * 100) + '%;background:' + rarity.color + '"></i></div>' : '') +
    '<div class="cosmeticActions">' + actions + '</div>';
}
function wardrobeScreenHTML() {
  var characterId = wardrobe.characterId || state.collection.selectedCharacterId;
  var char = CHARACTER_BY_ID[characterId] || CAMP.characters[0];
  var look = HERO_LOOKS[char.id];
  var outfitView = wardrobe.compareSaved ? wardrobe.saved : wardrobe.draft;
  var selected = wardrobe.selectedId ? COSMETIC_BY_ID[wardrobe.selectedId] : null;
  var allInSlot = filteredCosmeticsFor(wardrobe.slot, wardrobe.rarity, false);
  var ownedInSlot = filteredCosmeticsFor(wardrobe.slot, wardrobe.rarity, true);
  var slotCounts = {};
  COSMETIC_SLOT_ORDER.forEach(function (s) { slotCounts[s] = cosmeticsInSlot(s).filter(function (c) { return cosmeticOwned(c.id); }).length + '/' + cosmeticsInSlot(s).length; });
  var heroTabs = state.collection.ownedCharacterIds.map(function (id) {
    var c = CHARACTER_BY_ID[id]; if (!c) return '';
    return '<button type="button" class="miniHeroTab ' + (id === characterId ? 'is-active' : '') + '" data-action="wardrobe-hero" data-hero="' + esc(id) + '">' + esc(c.name.split(' ')[0]) + '</button>';
  }).join('');
  var items = allInSlot.length ? allInSlot.map(function (c) { return cosmeticCardHTML(c, wardrobe.saved, 'specific'); }).join('') : '<div class="wardrobeEmpty"><p>No hay piezas para este filtro.</p></div>';
  var currentSaved = Object.keys(wardrobe.saved).length;
  var currentDraft = Object.keys(wardrobe.draft).length;
  var title = titleText(char.id);
  return '<div class="overlay"><div class="overlayShell wardrobeShell">' +
    '<div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot" style="background:' + look.accent + '"></span>Estudio de equipamiento</span><h1>El atuendo <em>se prueba antes de salir.</em></h1><p>Gira el héroe, compara y guarda. Solo se equipan piezas que ya posees; los cosméticos bloqueados muestran su requisito y tu progreso.</p></div>' +
      '<div class="sheetHeadSide"><span class="chip">' + cosmeticsOwnedCountLabel() + ' cosméticos</span><span class="chip">' + state.collection.ownedCharacterIds.length + '/10 héroes</span><button type="button" class="sheetClose" data-action="close-sheet" aria-label="Cerrar">' + icon('close', 17) + '</button></div>' +
    '</div>' +
    '<div class="wardrobeHeroBar"><span class="eyebrow noRule">Héroe</span><div class="miniHeroTabs">' + heroTabs + '</div><span class="wardrobeTitle">Título: <b>' + esc(title || 'sin título') + '</b></span></div>' +
    '<div class="wardrobeGrid">' +
      '<aside class="panel wardrobeSlots"><span class="eyebrow noRule">Ranuras · una pieza activa</span><div class="slotList">' + slotTabsHTML(wardrobe.slot, 'wardrobe-slot', slotCounts) + '</div><div class="sectionDivider"></div><div class="wardrobeMeta"><span class="tiny dim">Atuendo guardado</span><b>' + currentSaved + ' piezas</b><span class="tiny dim">Borrador</span><b>' + currentDraft + ' piezas</b></div></aside>' +
      '<section class="wardrobeStage"><div class="previewMount" id="wardrobePreviewMount"><div class="previewHint">Arrastra para girar</div><div class="previewCorner" style="--accent:' + look.accent + '">' + esc(char.name) + '<br /><small>' + esc(look.klass) + '</small></div></div>' +
        '<div class="compareStrip"><span><b>Ahora</b><br />' + (currentSaved ? currentSaved + ' piezas' : 'sin cosméticos') + '</span>' + icon('arrowRight', 14) + '<span><b>Borrador</b><br />' + (currentDraft ? currentDraft + ' piezas' : 'sin cosméticos') + '</span></div>' +
        '<div class="wardrobeActions"><button type="button" class="btn btn--ghost btn--sm" data-action="wardrobe-compare">' + (wardrobe.compareSaved ? icon('layers', 13) + ' Ver borrador' : icon('eye', 13) + ' Ver atuendo actual') + '</button><button type="button" class="btn btn--quiet btn--sm" data-action="wardrobe-discard" ' + (wardrobeDirty() ? '' : 'disabled') + '>Descartar</button><button type="button" class="btn btn--primary btn--sm" data-action="wardrobe-save" ' + (wardrobeDirty() ? '' : 'disabled') + '>' + icon('check', 13) + ' Guardar atuendo</button></div>' +
      '</section>' +
      '<section class="panel wardrobeItems"><div class="wardrobeItemsHead"><div><span class="eyebrow noRule">' + esc(cosmeticSlotLabel(wardrobe.slot)) + '</span><h2>' + allInSlot.length + ' piezas</h2></div><div class="wardrobeFilter">' + raritySelectHTML(wardrobe.rarity, 'wardrobe-rarity-select') + '</div></div>' +
        '<div class="cosmeticList">' + items + '</div>' +
        '<div class="cosmeticDetail">' + cosmeticDetailHTML(selected, 'specific') + '</div>' +
      '</section>' +
    '</div>' +
    '<div class="atlasFooter"><span>El borrador no se guarda hasta pulsar «Guardar atuendo». La vista 3D respeta las capas base y las anclas de identidad de cada héroe.</span><span>' + icon('spark', 11) + ' Arrastra el héroe para girarlo.</span></div>' +
  '</div></div>';
}

/* -------------------------------------------------------------------------
   Tienda
   ------------------------------------------------------------------------- */
function shopFiltered() {
  return shopCosmetics().filter(function (c) {
    return (shop.slot === 'todas' || c.category === shop.slot) && (shop.rarity === 'todas' || cosmeticRarityKey(c) === shop.rarity);
  });
}
function shopScreenHTML() {
  var list = shopFiltered();
  var selected = shop.selectedId ? COSMETIC_BY_ID[shop.selectedId] : null;
  var cats = ['todas'].concat(COSMETIC_SLOT_ORDER.filter(function (s) { return s !== 'titulo'; })).map(function (s) {
    return '<option value="' + esc(s) + '" ' + (shop.slot === s ? 'selected' : '') + '>' + esc(s === 'todas' ? 'Todas las ranuras' : cosmeticSlotLabel(s)) + '</option>';
  }).join('');
  var ownedCount = shopCosmetics().filter(function (c) { return cosmeticOwned(c.id); }).length;
  return '<div class="overlay"><div class="overlayShell">' +
    '<div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot" style="background:var(--gold);box-shadow:0 0 12px var(--gold)"></span>Tienda de ecos</span><h1>Objetos que ya existían <em>en tu colección.</em></h1><p>Los 33 cosméticos originales conservan su precio y sus requisitos. La compra se confirma con tu saldo y no se puede repetir.</p></div>' +
      '<div class="sheetHeadSide"><span class="chip chip--gold">' + icon('coin', 12) + ' ◇' + formatNumber(state.coins) + '</span><span class="chip">' + ownedCount + '/33 originales</span><button type="button" class="sheetClose" data-action="close-sheet" aria-label="Cerrar">' + icon('close', 17) + '</button></div>' +
    '</div>' +
    '<div class="shopLayout">' +
      '<aside class="panel shopRail"><span class="eyebrow noRule">Filtrar</span><select class="selectMini wide" data-shop-slot>' + cats + '</select><div style="margin-top:8px">' + raritySelectHTML(shop.rarity, 'shop-rarity-select') + '</div><div class="sectionDivider"></div><div class="shopNote"><b>Monedas de estudio</b><p>Se ganan respondiendo y cerrando rutas. Tope de ◇120 al día; ya ganadas no se pierden.</p></div><button type="button" class="btn btn--ghost btn--sm btn--block" data-action="open-wardrobe">Ir al inventario ' + icon('chevronRight', 11) + '</button></aside>' +
      '<section class="panel shopList"><div class="shopListHead"><h2>Catálogo original</h2><span class="chip">' + list.length + ' resultados</span></div><div class="cosmeticList shopGrid">' + (list.map(function (c) { return cosmeticCardHTML(c, getCharacterOutfit(state.collection.selectedCharacterId), 'shop'); }).join('') || '<div class="wardrobeEmpty"><p>No hay cosméticos con ese filtro.</p></div>') + '</div></section>' +
      '<aside class="panel shopDetail">' + cosmeticDetailHTML(selected, 'shop') + '</aside>' +
    '</div>' +
    '<div class="atlasFooter"><span>Los extras de constancia, repaso, dominio, jefes, mascotas y títulos no se venden: se ganan jugando.</span><span>' + icon('shield', 11) + ' Sin dinero real.</span></div>' +
  '</div></div>';
}
function shopSelect(id) { shop.selectedId = id; shop.confirmId = null; renderScreen(); sfxClick(); }
function shopAskBuy(id) { shop.selectedId = id; shop.confirmId = id; renderScreen(); sfxClick(); }
function shopConfirmBuy(id) {
  var result = buyCosmetic(id);
  if (!result.ok) { toast(result.reason, 'warn', 4500); renderScreen(); return; }
  shop.confirmId = null;
  toast('«' + result.cosmetic.name + '» comprado por ◇' + formatNumber(result.price) + '. Ya está en tu colección.', 'success', 4300);
  renderScreen();
  syncHUD();
  refreshAllPortraits();
  sfxVictory();
}
function shopCancelBuy() { shop.confirmId = null; renderScreen(); }

/* -------------------------------------------------------------------------
   Previsualización 3D del atuendo
   ------------------------------------------------------------------------- */
function ensureWardrobePreview() {
  if (wardrobe.preview) return wardrobe.preview;
  var canvas = document.createElement('canvas');
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(420, 420, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  var scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#c0cdff', '#302434', 2.0));
  var key = new THREE.DirectionalLight('#ffe3c8', 2.4);
  key.position.set(-3, 6, 5); scene.add(key);
  var rim = new THREE.DirectionalLight('#7ba6ff', 1.5);
  rim.position.set(4, 4, -3); scene.add(rim);
  var camera = new THREE.PerspectiveCamera(26, 1, 0.1, 80);
  var root = new THREE.Group(); scene.add(root);
  var ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.018, 4, 40), new THREE.MeshBasicMaterial({ color: color('#7AA2FF'), transparent: true, opacity: 0.45 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.03; root.add(ring);
  var glow = makeGlowSprite('#7AA2FF', 3.4, 0.1); glow.position.y = 1.3; scene.add(glow);
  wardrobe.preview = { canvas: canvas, renderer: renderer, scene: scene, camera: camera, root: root, avatar: null, ring: ring, glow: glow, lastKey: '' };
  canvas.addEventListener('pointerdown', function (event) { wardrobe.dragging = true; wardrobe.lastX = event.clientX; try { canvas.setPointerCapture(event.pointerId); } catch (e) {} });
  canvas.addEventListener('pointermove', function (event) {
    if (!wardrobe.dragging) return;
    wardrobe.rotation += (event.clientX - wardrobe.lastX) * 0.012;
    wardrobe.lastX = event.clientX;
  });
  canvas.addEventListener('pointerup', function () { wardrobe.dragging = false; });
  canvas.addEventListener('pointercancel', function () { wardrobe.dragging = false; });
  return wardrobe.preview;
}
function mountWardrobePreview() {
  var mount = document.getElementById('wardrobePreviewMount');
  if (!mount) return;
  var p = ensureWardrobePreview();
  mount.insertBefore(p.canvas, mount.firstChild);
  p.canvas.style.width = '100%';
  p.canvas.style.height = '100%';
  p.canvas.style.display = 'block';
  updateWardrobeAvatar();
}
function updateWardrobeAvatar() {
  var p = wardrobe.preview;
  if (!p || !wardrobe.characterId) return;
  var outfit = wardrobe.compareSaved ? wardrobe.saved : wardrobe.draft;
  var key = wardrobe.characterId + ':' + Object.keys(outfit).sort().map(function (k) { return k + '=' + outfit[k]; }).join(',');
  if (p.lastKey === key) return;
  if (p.avatar) { p.root.remove(p.avatar.root); disposeObject(p.avatar.root); p.avatar = null; }
  var avatar = buildHeroAvatar(wardrobe.characterId);
  applyOutfitToAvatar(avatar, wardrobe.characterId, outfit);
  p.root.add(avatar.root);
  p.avatar = avatar;
  p.lastKey = key;
  var look = heroLook(wardrobe.characterId);
  p.ring.material.color.set(look.accent);
  p.glow.material.color.set(look.accent);
  var box = new THREE.Box3().setFromObject(avatar.root);
  var center = box.getCenter(new THREE.Vector3());
  var extent = box.getSize(new THREE.Vector3());
  var dist = Math.max(extent.y / (2 * Math.tan(13 * Math.PI / 180)), extent.x * 1.35) * 1.02;
  p.camera.position.set(center.x + dist * 0.34, center.y + extent.y * 0.1, center.z + dist * 1.04);
  p.camera.lookAt(center.x, center.y - 0.02 * extent.y, center.z);
}
function updateWardrobePreview(dt, time) {
  if (screen !== 'wardrobe' || !wardrobe.preview || !wardrobe.preview.avatar) return;
  var p = wardrobe.preview;
  var av = p.avatar;
  av.root.rotation.y = wardrobe.rotation;
  av.body.position.y = Math.sin(time * 1.4) * 0.012;
  av.head.rotation.y = Math.sin(time * 0.55) * 0.025 + 0.1;
  av.leftArm.rotation.z = 0.04 + Math.sin(time * 0.8) * 0.012;
  av.rightArm.rotation.z = -0.04 - Math.sin(time * 0.8) * 0.012;
  animateAvatarCosmetics(av, dt, time, false, 0);
  if (p.ring) p.ring.rotation.z = time * 0.08;
  p.renderer.render(p.scene, p.camera);
}

/* -------------------------------------------------------------------------
   Galerías de aprobación (QA)
   ------------------------------------------------------------------------- */
var SHOWCASE_OUTFITS = {
  kian: { cabeza: 'c-cabeza-casco', torso: 'c-torso-manto', piernas: 'c-piernas-grebas', extras: 'x-trofeo-gestion', mascota: 'x-buho-cometa', marcos: 'c-marco-constelacion', titulo: 'x-titulo-en-ruta' },
  noa: { cabeza: 'c-cabeza-auriculares', torso: 'c-torso-bata', piernas: 'c-piernas-falda', accesorios: 'c-accesorios-gafas', extras: 'x-cuaderno-orbital', efectos: 'x-arma-prisma', estela: 'x-estela-racha', titulo: 'x-titulo-criterio' },
  lia: { cabeza: 'c-cabeza-corona', peinado: 'c-peinado-coleta', torso: 'c-torso-poncho', piernas: 'c-piernas-ruta', accesorios: 'c-accesorios-brujula', mascota: 'x-zorro-tinta', marcos: 'c-marco-platino', titulo: 'x-titulo-cartografo' },
  zenon: { cabeza: 'x-dominio-etica-oro', peinado: 'c-peinado-mono', torso: 'x-capa-errorario', piernas: 'c-piernas-grebas', amuletos: 'c-amuleto-criterio', efectos: 'x-aura-amanecer', pet: null, mascota: 'x-luciernaga-observatorio', marcos: 'c-marco-constelacion', titulo: 'x-titulo-maestro' }
};
function showcaseScreenHTML() {
  var ids = ['kian', 'noa', 'lia', 'zenon'];
  var cards = ids.map(function (id) {
    var c = CHARACTER_BY_ID[id];
    var img = renderHeroPortrait(id, 520, SHOWCASE_OUTFITS[id]);
    return '<article class="showcaseCard" style="--hero-accent:' + HERO_LOOKS[id].accent + '"><img src="' + img + '" alt="' + esc(c.name) + ' con cosméticos" /><div><span class="chip">' + esc(HERO_LOOKS[id].klass) + '</span><h3>' + esc(c.name) + '</h3><p>' + esc(c.title) + '</p></div></article>';
  }).join('');
  return '<div class="overlay"><div class="overlayShell"><div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot"></span>Aprobación de Fase 3</span><h1>Cuatro siluetas, <em>un mismo sistema de acople.</em></h1><p>Kian, Noa, Lía y Zenón con cosméticos de varias ranuras. Armas y anclas de identidad conservadas.</p></div><div class="sheetHeadSide"><button type="button" class="sheetClose" data-action="close-sheet">' + icon('close', 17) + '</button></div></div><div class="showcaseGrid">' + cards + '</div></div></div>';
}
function slotGalleryItems() {
  return [
    ['cabeza', 'ilan', { cabeza: 'c-cabeza-corona' }],
    ['peinado', 'mara', { peinado: 'c-peinado-coleta' }],
    ['torso', 'teo', { torso: 'c-torso-manto' }],
    ['piernas', 'lia', { piernas: 'c-piernas-grebas' }],
    ['accesorios', 'noa', { accesorios: 'c-accesorios-gafas' }],
    ['extras', 'zenon', { extras: 'x-reloj-arena' }],
    ['amuletos', 'iris', { amuletos: 'c-amuleto-criterio' }],
    ['efectos', 'ona', { efectos: 'c-efecto-constelacion' }],
    ['marcos', 'kian', { marcos: 'c-marco-constelacion' }],
    ['mascota', 'amaru', { mascota: 'x-buho-cometa' }],
    ['estela', 'mara', { estela: 'x-estela-racha' }],
    ['titulo', 'zenon', { titulo: 'x-titulo-maestro' }]
  ];
}
function slotGalleryHTML() {
  var cards = slotGalleryItems().map(function (cell, index) {
    var slot = cell[0], hero = cell[1], outfit = cell[2];
    var img = renderHeroPortrait(hero, 320, outfit);
    var c = COSMETIC_BY_ID[outfit[slot]];
    return '<article class="slotCapture"><div class="slotCaptureImg"><img src="' + img + '" alt="' + esc(cosmeticSlotLabel(slot)) + '" /></div><div class="slotCaptureCopy"><span class="chip">' + (index + 1) + ' · ' + esc(cosmeticSlotLabel(slot)) + '</span><b>' + esc(c ? c.name : slot) + '</b></div></article>';
  }).join('');
  return '<div class="overlay"><div class="overlayShell"><div class="sheetHead"><div><span class="eyebrow"><span class="kickerDot"></span>Fase 3 · 12 ranuras</span><h1>Una pieza equipada <em>en cada ranura.</em></h1><p>Las 9 ranuras originales y las 3 nuevas. Los títulos se muestran junto al nombre.</p></div><div class="sheetHeadSide"><button type="button" class="sheetClose" data-action="close-sheet">' + icon('close', 17) + '</button></div></div><div class="slotGalleryGrid">' + cards + '</div></div></div>';
}

/* -------------------------------------------------------------------------
   Ajustes de calidad
   ------------------------------------------------------------------------- */
function setEffectsQuality(level) {
  if (['bajo', 'medio', 'alto'].indexOf(level) === -1) return;
  state.settings.effectsQuality = level;
  saveSettings();
  persist();
  if (heroAvatar) { applyOutfitToAvatar(heroAvatar, state.collection.selectedCharacterId); }
  if (wardrobe.preview && wardrobe.preview.avatar) { wardrobe.preview.lastKey = ''; updateWardrobeAvatar(); }
  toast('Calidad de efectos: ' + (level === 'bajo' ? 'baja' : level === 'alto' ? 'alta' : 'media') + '.', 'success', 2200);
  renderScreen();
}
function toggle3dFrames() {
  state.settings.hide3dFrames = !state.settings.hide3dFrames;
  saveSettings();
  persist();
  if (heroAvatar) applyOutfitToAvatar(heroAvatar, state.collection.selectedCharacterId);
  if (wardrobe.preview && wardrobe.preview.avatar) { wardrobe.preview.lastKey = ''; updateWardrobeAvatar(); }
  toast(state.settings.hide3dFrames ? 'Marcos holográficos 3D ocultos.' : 'Marcos holográficos 3D visibles.', 'success', 2600);
  renderScreen();
}

document.addEventListener('change', function (event) {
  var t = event.target;
  if (!t || !t.matches) return;
  if (t.matches('[data-wardrobe-rarity-select]')) { wardrobeSetRarity(t.value); return; }
  if (t.matches('[data-shop-slot]')) { shop.slot = t.value; shop.selectedId = null; renderScreen(); return; }
  if (t.matches('[data-shop-rarity-select]')) { shop.rarity = t.value; shop.selectedId = null; renderScreen(); return; }
});

/* =========================================================================
   FLUJO DE JUEGO — campaña, duelos, repaso, importación y bucle principal
   ========================================================================= */
var lastPhasePosted = '';
var autoLastAction = 0;

function enterGame() {
  initAudio();
  gateGroups.forEach(function (g) { g.label.visible = true; });
  sfxSelect();
  if (hasProgress()) sfxClick();
  if (state.importedAt && !state._importToastShown) {
    state._importToastShown = true;
    toast('Partida importada. Tus rutas y tu colección están en el observatorio.', 'success', 4200);
  }
  enterHub();
}
function enterHub() {
  if (session) {
    // No se abandona una sesión por accidente desde una pantalla de menú.
    if (screen === 'pause' && pauseReturn === 'duel') { setScreen('duel'); return; }
  }
  if (arenaGroup.visible) endDuelStage();
  lastResult = null;
  lastFeedback = null;
  session = null;
  sheetReturn = 'hub';
  cameraMode = 'hub';
  view = 'hub';
  setScreen('hub');
  updateInteract();
}
function enterTitle() {
  if (arenaGroup.visible) endDuelStage();
  gateGroups.forEach(function (g) { g.label.visible = false; });
  session = null;
  lastFeedback = null;
  lastResult = null;
  sheetReturn = 'hub';
  cameraMode = 'title';
  view = 'hub';
  setScreen('title');
  sfxSelect();
}
function closeSheet() {
  if (sheetReturn === 'title') {
    sheetReturn = 'hub';
    enterTitle();
    return;
  }
  if (sheetReturn === 'pause') {
    sheetReturn = 'hub';
    setScreen('pause');
    return;
  }
  if (sheetReturn === 'result' && lastResult) {
    sheetReturn = 'hub';
    setScreen('result');
    return;
  }
  if (sheetReturn === 'heroes') {
    sheetReturn = 'hub';
    openHeroes();
    return;
  }
  enterHub();
}
function openJournal(areaId, missionId) {
  if (screen === 'duel') return;
  sheetReturn = screen === 'title' ? 'title' : (screen === 'pause' ? 'pause' : 'hub');
  if (areaId && AREA_BY_ID[areaId]) selectedAreaId = areaId;
  if (missionId && MISSION_BY_ID[missionId]) selectedMissionId = missionId;
  setScreen('journal');
  sfxSelect();
}
function openHeroes() {
  if (screen === 'duel') return;
  sheetReturn = screen === 'title' ? 'title' : (screen === 'pause' ? 'pause' : 'hub');
  setScreen('heroes');
  sfxSelect();
}
function openRecruit(heroId) {
  var char = CHARACTER_BY_ID[heroId];
  if (!char) return;
  if (state.collection.ownedCharacterIds.indexOf(heroId) !== -1) {
    selectHero(heroId);
    return;
  }
  recruitHeroId = heroId;
  sheetReturn = 'heroes';
  setScreen('recruit');
  sfxSelect();
}
function confirmRecruit() {
  var id = recruitHeroId;
  if (!id) return;
  var result = purchaseHero(id);
  if (!result.ok) {
    toast(result.reason || 'No se pudo reclutar al héroe.', 'error');
    renderScreen();
    return;
  }
  recruitHeroId = null;
  sheetReturn = 'hub';
  syncHUD();
  setScreen('heroes');
  toast(result.char.name + ' se une al observatorio' + (result.free ? ' como recompensa de recorrido.' : ' por ' + formatNumber(result.price) + ' monedas.'), 'success', 4200);
  sfxVictory();
}
function openReview() {
  if (screen === 'duel') return;
  sheetReturn = screen === 'title' ? 'title' : (screen === 'pause' ? 'pause' : (screen === 'result' ? 'result' : 'hub'));
  setScreen('review');
  sfxSelect();
}
function openImport() {
  if (screen === 'duel') return;
  sheetReturn = screen === 'title' ? 'title' : (screen === 'pause' ? 'pause' : 'hub');
  importError = '';
  importPreview = null;
  importText = '';
  setScreen('import');
  initAudio();
}
function openPause() {
  if (screen === 'pause' || screen === 'result') return;
  pauseReturn = screen === 'duel' ? 'duel' : 'hub';
  sheetReturn = 'hub';
  setScreen('pause');
  sfxSelect();
}
function openShop() {
  if (screen === 'duel') return;
  sheetReturn = screen === 'pause' ? 'pause' : 'hub';
  shop.active = true;
  setScreen('shop');
  sfxSelect();
}
function closePause() {
  if (pauseReturn === 'duel' && session) {
    setScreen('duel');
  } else {
    pauseReturn = 'hub';
    enterHub();
  }
}
function selectArea(areaId) {
  if (!AREA_BY_ID[areaId]) return;
  selectedAreaId = areaId;
  selectedMissionId = null;
  selectedMissionForArea();
  renderScreen();
  sfxClick();
}
function selectMission(missionId) {
  if (!MISSION_BY_ID[missionId]) return;
  selectedMissionId = missionId;
  selectedAreaId = MISSION_BY_ID[missionId].areaId;
  renderScreen();
  sfxClick();
}
function selectHero(heroId) {
  if (state.collection.ownedCharacterIds.indexOf(heroId) === -1) return;
  if (state.collection.selectedCharacterId === heroId) return;
  state.collection.selectedCharacterId = heroId;
  persist();
  rebuildWorldSelection();
  if (screen === 'heroes') renderScreen();
  syncHUD();
  sfxSelect();
  toast(heroName(heroId) + ' toma el relevo en el observatorio.', 'success');
}
function launchMission(missionId) {
  if (session) { toast('Ya hay un duelo en curso.', 'warn'); return; }
  var mission = MISSION_BY_ID[missionId];
  if (!mission) { toast('Esa ruta no está en la campaña actual.', 'error'); return; }
  var info = missionUnlockInfo(mission);
  if (!info.unlocked) {
    toast('Aún faltan requisitos para abrir esta ruta.', 'warn');
    return;
  }
  var qids = mission.questionIds.filter(function (id) { return !!QUESTION_BY_ID[id]; });
  if (!qids.length) { toast('Esta ruta no tiene preguntas disponibles.', 'error'); return; }
  session = {
    id: uid('duel'),
    mode: mission.kind === 'boss' ? 'boss' : 'mission',
    missionId: mission.id,
    areaId: mission.areaId,
    title: mission.title,
    subtitle: mission.subtitle,
    questions: qids,
    cursor: 0,
    answers: {},
    orders: [],
    hearts: Number(RULES.duelHearts) || Number(RULES.hearts) || 3,
    startedAt: nowISO(),
    questionStartedAt: Date.now(),
    questionXp: 0,
    questionCoins: 0,
    levelBefore: currentLevel(),
    finishing: false
  };
  lastFeedback = null;
  lastResult = null;
  beginDuelStage(mission.areaId);
  setScreen('duel');
  initAudio();
  sfxSelect();
}
function launchReview(mode) {
  if (session) { toast('Termina el duelo actual antes de iniciar otro repaso.', 'warn'); return; }
  var candidates;
  if (mode === 'early') {
    candidates = Object.keys(state.errors).map(function (id) { return state.errors[id]; })
      .filter(function (e) { return e && QUESTION_BY_ID[e.questionId]; })
      .sort(function (a, b) {
        var ad = parseDate(a.nextReviewAt), bd = parseDate(b.nextReviewAt);
        return (ad ? ad.getTime() : 0) - (bd ? bd.getTime() : 0);
      });
  } else {
    candidates = dueErrors();
  }
  var unique = [], seen = {};
  candidates.forEach(function (e) {
    if (seen[e.questionId] || unique.length >= (Number(RULES.reviewPerSession) || 8)) return;
    seen[e.questionId] = true;
    unique.push(e.questionId);
  });
  if (!unique.length) { toast('Todavía no hay preguntas listas para repaso. Un fallo se programa a los 20 minutos.', 'warn', 4300); return; }
  var firstQ = QUESTION_BY_ID[unique[0]];
  session = {
    id: uid('review'),
    mode: 'review',
    reviewKind: mode,
    reviewOnTime: mode === 'due' && unique.every(function (id) {
      var e = state.errors[id];
      var due = e ? parseDate(e.nextReviewAt) : null;
      return !due || (Date.now() >= due.getTime() && Date.now() - due.getTime() <= 86400000);
    }),
    missionId: null,
    areaId: firstQ.areaId,
    title: 'Repaso de errores',
    subtitle: mode === 'early' ? 'Práctica anticipada de tu errorario' : 'Preguntas que ya toca volver a mirar',
    questions: unique,
    cursor: 0,
    answers: {},
    orders: [],
    hearts: Number(RULES.duelHearts) || Number(RULES.hearts) || 3,
    startedAt: nowISO(),
    questionStartedAt: Date.now(),
    questionXp: 0,
    questionCoins: 0,
    levelBefore: currentLevel(),
    finishing: false
  };
  lastFeedback = null;
  lastResult = null;
  beginDuelStage(firstQ.areaId);
  setScreen('duel');
  initAudio();
  sfxSelect();
}
function answerCurrent(letter) {
  if (screen !== 'duel' || !session || session.finishing || lastFeedback) return;
  var q = currentQuestion();
  if (!q) return;
  var chosen = String(letter || '').toUpperCase();
  if (!q.options.some(function (o) { return o.id === chosen; })) return;
  var duration = Math.max(0, Date.now() - session.questionStartedAt);
  var applied = applyQuestionResult(q.id, chosen, duration, session);
  if (!applied) return;
  var chosenOption = q.options.filter(function (o) { return o.id === chosen; })[0];
  var answerOption = q.options.filter(function (o) { return o.id === q.answer; })[0];
  session.answers[q.id] = {
    questionId: q.id,
    chosen: chosen,
    chosenText: chosenOption ? chosenOption.text : '',
    correct: applied.correct,
    omitted: false,
    at: nowISO(),
    answer: q.answer,
    answerText: answerOption ? answerOption.text : '',
    xp: applied.xp,
    coins: applied.coins,
    reason: applied.reason
  };
  session.orders.push(q.id);
  session.questionXp += applied.xp;
  session.questionCoins += applied.coins;
  if (!applied.correct) session.hearts = Math.max(0, session.hearts - 1);
  lastFeedback = {
    correct: applied.correct,
    chosen: chosen,
    answer: q.answer,
    answerText: answerOption ? answerOption.text : '',
    xp: applied.xp,
    coins: applied.coins,
    reason: applied.reason,
    suppressed: applied.suppressed,
    shownAt: performance.now()
  };
  if (applied.correct) {
    triggerHeroAttack();
    window.setTimeout(function () { sfxCorrect(); }, 150);
  } else {
    guardianAttackVisual();
    triggerHeroHurt();
    window.setTimeout(function () { sfxWrong(); }, 110);
  }
  persist();
  renderScreen();
}
function nextQuestion() {
  if (screen !== 'duel' || !session || !lastFeedback || session.finishing) return;
  if (session.hearts <= 0) { finishSession('hearts'); return; }
  if (session.cursor >= session.questions.length - 1) { finishSession('completed'); return; }
  session.cursor += 1;
  session.questionStartedAt = Date.now();
  lastFeedback = null;
  sfxSelect();
  renderScreen();
}
function finishSession(reason) {
  if (!session || session.finishing) return;
  session.finishing = true;
  var finishedSession = session;
  var result = sessionResult(finishedSession, reason);
  var completion = { xp: 0, coins: 0, reason: result.label, duplicate: false };
  if (result.pass) completion = calcCompletionReward(finishedSession, result);
  var newlyCompleted = false;
  var wasCompleted = false;
  var at = nowISO();
  if (finishedSession.mode === 'mission' || finishedSession.mode === 'boss') {
    var prior = state.missions[finishedSession.missionId] || {
      id: finishedSession.missionId,
      kind: finishedSession.mode === 'boss' ? 'boss' : 'mission',
      areaId: finishedSession.areaId,
      attempts: 0,
      completedAt: null,
      bestScore: 0,
      bestAccuracy: 0
    };
    wasCompleted = !!prior.completedAt;
    prior.attempts = (Number(prior.attempts) || 0) + 1;
    prior.lastAt = at;
    prior.lastScore = result.correct * 100;
    prior.lastAccuracy = result.accuracy;
    prior.bestScore = Math.max(Number(prior.bestScore) || 0, result.correct * 100);
    prior.bestAccuracy = Math.max(Number(prior.bestAccuracy) || 0, result.accuracy);
    if (result.pass && !prior.completedAt) { prior.completedAt = at; newlyCompleted = true; }
    if (result.pass) prior.passedAt = at;
    state.missions[finishedSession.missionId] = prior;
  }
  state.academic.sessions = (Number(state.academic.sessions) || 0) + 1;
  if (finishedSession.mode === 'review') {
    state.reviews.completed = (Number(state.reviews.completed) || 0) + 1;
    state.reviews.lastCompletedDate = dateKey();
    if (finishedSession.reviewKind === 'early') state.reviews.earlySessions = (Number(state.reviews.earlySessions) || 0) + 1;
    else if (finishedSession.reviewOnTime) state.reviews.onTimeSessions = (Number(state.reviews.onTimeSessions) || 0) + 1;
  }
  var streakResult = recordLearningDay(at);
  var stageChange = evaluateStage();
  var achievements = checkAchievements();
  var unlockedCharacters = syncCharacters();
  var newCosmetics = unlockProgressCosmetics();
  var levelAfter = currentLevel();
  var entries = finishedSession.orders.map(function (id) { return finishedSession.answers[id]; }).filter(Boolean);
  var achievementXp = achievements.reduce(function (n, a) { return n + (Number(a.xp) || 0); }, 0);
  var achievementCoins = achievements.reduce(function (n, a) { return n + (Number(a.coins) || 0); }, 0);
  var dueAfter = dueErrors().length;
  lastResult = {
    mode: finishedSession.mode,
    missionId: finishedSession.missionId,
    areaId: finishedSession.areaId,
    title: finishedSession.title,
    subtitle: finishedSession.subtitle,
    pass: !!result.pass,
    reason: result.label,
    correct: result.correct,
    wrong: result.wrong,
    omitted: result.omitted,
    answered: result.answered,
    total: result.total,
    accuracy: result.accuracy,
    score: result.correct * 100,
    questionXp: finishedSession.questionXp,
    questionCoins: finishedSession.questionCoins,
    completion: completion,
    achievements: achievements,
    unlockedCharacters: unlockedCharacters,
    newCosmetics: newCosmetics,
    streakResult: streakResult,
    stageChange: stageChange,
    capReached: dailyCoinCapReached(),
    newlyCompleted: newlyCompleted,
    wasCompleted: wasCompleted,
    heartsRemaining: finishedSession.hearts,
    levelBefore: finishedSession.levelBefore,
    levelAfter: levelAfter,
    rankAfter: currentRank().name,
    entries: entries,
    dueAfter: dueAfter,
    errorsScheduled: entries.filter(function (e) { return !e.correct; }).length,
    finishedAt: at
  };
  lastResult.xpEarned = lastResult.questionXp + (completion.xp || 0) + achievementXp;
  lastResult.coinsEarned = lastResult.questionCoins + (completion.coins || 0) + achievementCoins;
  state.academic.lastResultAt = at;
  state.activeSession = null;
  session = null;
  lastFeedback = null;
  persist();
  if (lastResult.pass) {
    triggerHeroCelebrate();
    if (guardian) {
      spawnSparksAt(arenaWorld(duelPositions.guardian).add(new THREE.Vector3(0, 1.8, 0)), guardian.accent, 22);
      guardian.root.visible = false;
    }
    window.setTimeout(function () { sfxVictory(); }, 140);
  } else {
    if (guardian) {
      guardian.root.visible = false;
      spawnSparksAt(arenaWorld(duelPositions.hero).add(new THREE.Vector3(0, 1.4, 0)), '#ff8b9d', 10);
    }
    window.setTimeout(function () { sfxDefeat(); }, 140);
  }
  setScreen('result');
}
function resultContinue() {
  if (!lastResult) { enterHub(); return; }
  lastResult = null;
  if (arenaGroup.visible) endDuelStage();
  enterHub();
}
function resultReplay() {
  if (!lastResult || !lastResult.missionId) return;
  var id = lastResult.missionId;
  lastResult = null;
  lastFeedback = null;
  launchMission(id);
}
function exitToTitle() {
  if (session) { toast('Cierra el duelo antes de volver al título.', 'warn'); return; }
  enterTitle();
}
function toggleSound() {
  setSoundEnabled(!state.settings.sound);
  if (screen === 'title' || screen === 'pause') renderScreen();
  syncHUD();
  toast(state.settings.sound ? 'Sonido activado.' : 'Sonido silenciado.', state.settings.sound ? 'success' : 'warn', 2200);
}
function toggleAmbient() {
  setAmbientEnabled(!state.settings.ambient);
  if (screen === 'pause') renderScreen();
  toast(state.settings.ambient ? 'Ambiente activado.' : 'Ambiente desactivado.', state.settings.ambient ? 'success' : 'warn', 2200);
}
function analyzeImport(text) {
  importText = String(text || '');
  try {
    var parsed = parseLegacyProgress(importText);
    importPreview = parsed;
    importError = '';
    sfxSelect();
  } catch (e) {
    importPreview = null;
    importError = e && e.message ? e.message : 'No se pudo interpretar la partida.';
    toast(importError, 'error', 5000);
  }
  if (screen === 'import') {
    renderScreen();
    window.setTimeout(function () {
      var target = EL.screen.querySelector('.importPreview') || EL.screen.querySelector('.notice');
      if (target && target.scrollIntoView) target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 60);
  }
}
function confirmImport() {
  if (!importPreview) return;
  var destination = sheetReturn;
  var summary = importPreview.summary;
  applyLegacyImport(importPreview.state);
  importPreview = null;
  importError = '';
  importText = '';
  session = null;
  lastFeedback = null;
  lastResult = null;
  if (arenaGroup.visible) endDuelStage();
  var rewardUnlocks = syncCharacters();
  healEquippedOutfits();
  var importedCosmetics = unlockProgressCosmetics();
  if (rewardUnlocks.length || importedCosmetics.length) persist();
  rebuildHeroAvatar();
  syncHudPortrait();
  if (destination === 'title') enterTitle(); else enterHub();
  toast('Partida importada: ' + summary.name + ' · nivel ' + summary.level + ' · ' + summary.ownedCosmetics + ' cosméticos.', 'success', 5000);
  if (rewardUnlocks.length) {
    window.setTimeout(function () {
      toast(rewardUnlocks.map(function (c) { return c.name; }).join(', ') + ' se unió por tus misiones completadas.', 'success', 5000);
    }, 1200);
  }
  if (importedCosmetics.length) {
    window.setTimeout(function () {
      toast('Desbloqueaste ' + importedCosmetics.length + ' cosmético' + (importedCosmetics.length === 1 ? '' : 's') + ' extra' + (importedCosmetics.length === 1 ? '' : 's') + ' con tu progreso importado.', 'success', 5000);
    }, 2200);
  }
}
function clearImportPreview() {
  importPreview = null;
  importError = '';
  renderScreen();
}
function exportSave() {
  try {
    var payload = JSON.stringify({
      app: 'SERUMS QUEST VOXEL',
      version: APP_VERSION,
      exportedAt: nowISO(),
      state: state
    }, null, 2);
    var blob = new Blob([payload], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'serums-quest-observatorio-' + dateKey() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('Partida exportada como JSON.', 'success');
  } catch (e) {
    toast('No se pudo descargar la partida en este navegador.', 'error');
  }
}
function resetProgress() {
  if (Date.now() > resetArmedUntil) {
    resetArmedUntil = Date.now() + 5000;
    renderScreen();
    toast('Pulsa de nuevo «Confirmar reinicio» para vaciar el observatorio.', 'warn', 4200);
    return;
  }
  resetArmedUntil = 0;
  backupCurrentState('reset');
  if (arenaGroup.visible) endDuelStage();
  session = null;
  lastFeedback = null;
  lastResult = null;
  state = defaultState();
  state.profile.name = 'Serumista';
  persist();
  rebuildHeroAvatar();
  enterTitle();
  toast('Progreso reiniciado. Se conservó una copia previa en este navegador.', 'warn', 4500);
}
function abandonDuel() {
  if (!session) { closePause(); return; }
  if (Date.now() > abandonArmedUntil) {
    abandonArmedUntil = Date.now() + 5000;
    renderScreen();
    toast('Pulsa de nuevo «Abandonar la ruta» para confirmar. Las respuestas dadas se conservan.', 'warn', 4500);
    return;
  }
  abandonArmedUntil = 0;
  finishSession('abandoned');
}

/* -------------------------------------------------------------------------
   Acciones de interfaz
   ------------------------------------------------------------------------- */
function onClick(event) {
  var target = event.target.closest ? event.target.closest('[data-action]') : null;
  if (!target) return;
  var action = target.getAttribute('data-action');
  if (action !== 'answer' && action !== 'next-question') initAudio();
  switch (action) {
    case 'enter-game': event.preventDefault(); if (screen === 'title') enterGame(); break;
    case 'open-import': event.preventDefault(); openImport(); break;
    case 'close-sheet': event.preventDefault(); closeSheet(); break;
    case 'open-journal': event.preventDefault(); openJournal(selectedAreaId); break;
    case 'open-heroes': event.preventDefault(); openHeroes(); break;
    case 'open-wardrobe': event.preventDefault(); openWardrobe(); break;
    case 'open-shop': event.preventDefault(); openShop(); break;
    case 'wardrobe-hero': event.preventDefault(); wardrobeCharacterSwitch(target.getAttribute('data-hero')); break;
    case 'wardrobe-slot': event.preventDefault(); wardrobeSetSlot(target.getAttribute('data-slot')); break;
    case 'wardrobe-item': event.preventDefault(); wardrobeSelectItem(target.getAttribute('data-id')); break;
    case 'wardrobe-clear': event.preventDefault(); wardrobeClearSlot(target.getAttribute('data-slot')); break;
    case 'wardrobe-compare': event.preventDefault(); wardrobe.compareSaved = !wardrobe.compareSaved; renderScreen(); mountWardrobePreview(); sfxClick(); break;
    case 'wardrobe-save': event.preventDefault(); wardrobeSave(); break;
    case 'wardrobe-discard': event.preventDefault(); wardrobeDiscard(); break;
    case 'shop-item': event.preventDefault(); shopSelect(target.getAttribute('data-id')); break;
    case 'shop-buy': event.preventDefault(); shopAskBuy(target.getAttribute('data-id')); break;
    case 'shop-confirm': event.preventDefault(); shopConfirmBuy(target.getAttribute('data-id')); break;
    case 'shop-cancel-buy': event.preventDefault(); shopCancelBuy(); break;
    case 'set-effects-quality': event.preventDefault(); setEffectsQuality(target.getAttribute('data-quality')); break;
    case 'toggle-3d-frames': event.preventDefault(); toggle3dFrames(); break;
    case 'open-review': event.preventDefault(); openReview(); break;
    case 'open-pause': event.preventDefault(); openPause(); break;
    case 'close-pause': event.preventDefault(); closePause(); break;
    case 'open-mission':
      event.preventDefault();
      openJournal(target.getAttribute('data-area'), target.getAttribute('data-mission'));
      break;
    case 'select-area': event.preventDefault(); selectArea(target.getAttribute('data-area')); break;
    case 'select-mission': event.preventDefault(); selectMission(target.getAttribute('data-mission')); break;
    case 'start-mission': event.preventDefault(); launchMission(target.getAttribute('data-mission')); break;
    case 'select-hero': event.preventDefault(); selectHero(target.getAttribute('data-hero')); break;
    case 'open-recruit': event.preventDefault(); openRecruit(target.getAttribute('data-hero')); break;
    case 'recruit-confirm': event.preventDefault(); confirmRecruit(); break;
    case 'start-review': event.preventDefault(); launchReview(target.getAttribute('data-mode') || 'due'); break;
    case 'answer': event.preventDefault(); answerCurrent(target.getAttribute('data-letter')); break;
    case 'next-question': event.preventDefault(); nextQuestion(); break;
    case 'result-continue': event.preventDefault(); resultContinue(); break;
    case 'result-replay': event.preventDefault(); resultReplay(); break;
    case 'enter-title':
    case 'exit-title': event.preventDefault(); exitToTitle(); break;
    case 'toggle-sound': event.preventDefault(); toggleSound(); break;
    case 'toggle-ambient': event.preventDefault(); toggleAmbient(); break;
    case 'legacy-file': event.preventDefault(); { var fi = document.getElementById('legacyFile'); if (fi) fi.click(); } break;
    case 'legacy-analyze':
      event.preventDefault();
      { var ta = document.getElementById('legacyText'); analyzeImport(ta ? ta.value : importText); }
      break;
    case 'legacy-local':
      event.preventDefault();
      { var found = findLegacyLocalState(); if (found) analyzeImport(found.text); else { importError = 'No encontramos una partida antigua en este navegador.'; renderScreen(); } }
      break;
    case 'legacy-clear':
      event.preventDefault();
      importText = '';
      importPreview = null;
      importError = '';
      renderScreen();
      break;
    case 'import-confirm': event.preventDefault(); confirmImport(); break;
    case 'import-clear': event.preventDefault(); clearImportPreview(); break;
    case 'export-save': event.preventDefault(); exportSave(); break;
    case 'reset-progress': event.preventDefault(); resetProgress(); break;
    case 'abandon-duel': event.preventDefault(); abandonDuel(); break;
    case 'close-import': event.preventDefault(); closeSheet(); break;
  }
}
document.addEventListener('click', onClick);

function isTypingTarget(target) {
  return !!(target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable));
}
var keys = {};
var KEYMAP = {
  ArrowUp: 'ArrowUp', KeyW: 'KeyW',
  ArrowDown: 'ArrowDown', KeyS: 'KeyS',
  ArrowLeft: 'ArrowLeft', KeyA: 'KeyA',
  ArrowRight: 'ArrowRight', KeyD: 'KeyD'
};
window.addEventListener('keydown', function (event) {
  if (isTypingTarget(event.target)) return;
  if (event.code in KEYMAP) {
    keys[event.code] = true;
    if (screen === 'hub' || screen === 'duel') event.preventDefault();
    return;
  }
  if (screen === 'title') {
    if (event.code === 'Enter' || event.code === 'NumpadEnter' || event.code === 'Space') {
      event.preventDefault();
      enterGame();
    }
    return;
  }
  if (screen === 'hub') {
    if (event.code === 'KeyE' || event.code === 'Enter' || event.code === 'Space') { event.preventDefault(); activateInteract(); return; }
    if (event.code === 'KeyM' || event.code === 'Tab') { if (event.code === 'Tab') return; event.preventDefault(); openJournal(selectedAreaId); return; }
    if (event.code === 'KeyR') { event.preventDefault(); openReview(); return; }
    if (event.code === 'KeyH' || event.code === 'KeyC') { event.preventDefault(); openHeroes(); return; }
    if (event.code === 'KeyI') { event.preventDefault(); openWardrobe(); return; }
    if (event.code === 'Escape' || event.code === 'KeyP') { event.preventDefault(); openPause(); return; }
    return;
  }
  if (screen === 'duel') {
    if (event.code === 'Escape' || event.code === 'KeyP') { event.preventDefault(); openPause(); return; }
    if (lastFeedback) {
      if (event.code === 'Enter' || event.code === 'NumpadEnter' || event.code === 'Space') { event.preventDefault(); nextQuestion(); }
      return;
    }
    var letter = null;
    if (/^Digit[1-4]$/.test(event.code)) letter = ['A', 'B', 'C', 'D'][Number(event.code.slice(5)) - 1];
    if (event.code === 'KeyA') letter = 'A';
    if (event.code === 'KeyB') letter = 'B';
    if (event.code === 'KeyC') letter = 'C';
    if (event.code === 'KeyD') letter = 'D';
    if (letter) { event.preventDefault(); answerCurrent(letter); }
    return;
  }
  if (event.code === 'Escape') {
    if (screen === 'pause') { event.preventDefault(); closePause(); return; }
    if (screen === 'result') return;
    if (screen === 'title') return;
    if (screen === 'import' || screen === 'journal' || screen === 'heroes' || screen === 'review' || screen === 'wardrobe' || screen === 'shop' || screen === 'showcase' || screen === 'slotGallery') {
      event.preventDefault();
      closeSheet();
    }
  }
  if (screen === 'pause' && (event.code === 'KeyM' || event.code === 'KeyH' || event.code === 'KeyR')) {
    event.preventDefault();
    if (event.code === 'KeyM') openJournal(selectedAreaId);
    else if (event.code === 'KeyH') openHeroes();
    else openReview();
  }
});
window.addEventListener('keyup', function (event) {
  if (event.code in KEYMAP) keys[event.code] = false;
});
window.addEventListener('blur', function () {
  keys = {};
  touchInput.x = 0;
  touchInput.z = 0;
  Object.keys(touchHeld).forEach(function (id) { delete touchHeld[id]; });
});

var touchHeld = {};
function syncTouchInput() {
  var x = 0, z = 0;
  Object.keys(touchHeld).forEach(function (id) {
    var dir = touchHeld[id];
    if (dir === 'left') x -= 1;
    if (dir === 'right') x += 1;
    if (dir === 'up') z -= 1;
    if (dir === 'down') z += 1;
  });
  touchInput.x = clamp(x, -1, 1);
  touchInput.z = clamp(z, -1, 1);
}
document.querySelectorAll('[data-touch-dir]').forEach(function (button) {
  button.addEventListener('pointerdown', function (event) {
    event.preventDefault();
    var id = event.pointerId;
    touchHeld[id] = button.getAttribute('data-touch-dir');
    syncTouchInput();
    try { button.setPointerCapture(event.pointerId); } catch (e) {}
    initAudio();
  });
  function endTouch(event) {
    delete touchHeld[event.pointerId];
    syncTouchInput();
  }
  button.addEventListener('pointerup', endTouch);
  button.addEventListener('pointercancel', endTouch);
  button.addEventListener('pointerleave', endTouch);
});
if (EL.touchAction) {
  EL.touchAction.addEventListener('click', function (event) {
    event.preventDefault();
    activateInteract();
  });
}

/* -------------------------------------------------------------------------
   Importador: arrastrar y soltar
   ------------------------------------------------------------------------- */
function bindImportFile() {
  var input = document.getElementById('legacyFile');
  if (!input) return;
  input.addEventListener('change', function () {
    var file = input.files && input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () { analyzeImport(String(reader.result || '')); };
    reader.onerror = function () { importError = 'No se pudo leer el archivo elegido.'; renderScreen(); };
    reader.readAsText(file);
    input.value = '';
  });
  var drop = EL.screen.querySelector('.dropZone');
  if (drop) {
    ['dragenter', 'dragover'].forEach(function (type) {
      drop.addEventListener(type, function (event) { event.preventDefault(); drop.style.borderColor = 'var(--teal)'; });
    });
    drop.addEventListener('dragleave', function () { drop.style.borderColor = ''; });
    drop.addEventListener('drop', function (event) {
      event.preventDefault();
      drop.style.borderColor = '';
      var file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () { analyzeImport(String(reader.result || '')); };
      reader.onerror = function () { importError = 'No se pudo leer el archivo elegido.'; renderScreen(); };
      reader.readAsText(file);
    });
  }
}

/* -------------------------------------------------------------------------
   Cámara y partículas: estado por frame
   ------------------------------------------------------------------------- */
function updateSceneMotion(dt, time) {
  if (!renderer) return;
  if (orrery) {
    orrery.rotation.y = time * 0.045;
    orreryRings.forEach(function (r, i) {
      r.mesh.rotation.z = time * r.speed + i * 0.6;
      r.mesh.rotation.x = Math.PI / 2 + Math.sin(time * 0.22 + i) * 0.18 + r.tilt;
    });
    orbitStones.forEach(function (s) {
      var a = s.angle + time * s.speed;
      s.mesh.position.set(Math.cos(a) * s.radius, 1.5 + Math.sin(time * 0.7 + s.angle) * 0.18, Math.sin(a) * s.radius);
      s.mesh.rotation.y = time * 0.6;
    });
    daisRing.rotation.z = time * 0.06;
  }
  if (starField) starField.rotation.y = time * 0.0018;
  gateGroups.forEach(function (g, i) {
    g.beacon.position.y = 3.55 + Math.sin(time * 1.1 + i) * 0.09;
    g.beacon.rotation.y = time * 0.8 + i;
    g.glow.material.opacity = 0.16 + Math.sin(time * 0.9 + i) * 0.035 + (selectedGate === i ? 0.12 : 0);
    g.label.position.y = 4.15 + Math.sin(time * 0.6 + i) * 0.025;
  });
  if (dust && dust.geometry) {
    var attr = dust.geometry.attributes.position;
    for (var i = 0; i < hubParticles.length; i++) {
      var p = hubParticles[i];
      attr.setXYZ(i, p.x + Math.sin(time * 0.16 + p.phase) * 0.7, p.y + Math.sin(time * 0.27 + p.phase) * 0.45, p.z + Math.cos(time * 0.13 + p.phase) * 0.7);
    }
    attr.needsUpdate = true;
  }
  if (arenaRune) arenaRune.rotation.z = time * 0.08;
  if (arenaRune2) arenaRune2.rotation.z = -time * 0.045;
  if (arenaBackRing) arenaBackRing.rotation.z = Math.sin(time * 0.12) * 0.5;
  arenaPillars.forEach(function (p, i) {
    p.group.position.y = Math.sin(time * 0.55 + p.phase) * 0.035;
  });
  if (guardian && arenaGroup.visible) {
    guardian.root.visible = guardian.root.visible;
  }
  // sombra y holder en el atrio
  if (!arenaGroup.visible) {
    heroHolder.position.set(hubHero.x, 0, hubHero.z);
    if (heroAvatar) {
      heroAvatar.root.rotation.y = hubHero.facing;
      heroAvatar.root.position.set(0, 0, 0);
    }
    heroShadow.position.set(hubHero.x, 0.015, hubHero.z);
  } else if (heroAvatar) {
    if (heroAvatar.root.parent === arenaGroup) {
      heroAvatar.root.position.copy(duelPositions.hero);
      arenaHeroShadow.position.set(duelPositions.hero.x, 0.015, duelPositions.hero.z);
    }
  }
}
function overallPhase() {
  if (screen === 'boot' || screen === 'title') return 'title';
  if (screen === 'result' && lastResult) return lastResult.pass ? 'won' : 'lost';
  return 'playing';
}
function postPhase() {
  var next = overallPhase();
  if (next === lastPhasePosted) return;
  lastPhasePosted = next;
  var score = screen === 'result' && lastResult ? lastResult.score : (session ? session.orders.filter(function (id) { return session.answers[id] && session.answers[id].correct; }).length * 100 : 0);
  post({ type: 'state', phase: next, score: score });
}

/* -------------------------------------------------------------------------
   BUCLE
   ------------------------------------------------------------------------- */
var lastFrameAt = performance.now();
function frame(now) {
  var dt = Math.min(0.05, Math.max(0, (now - lastFrameAt) / 1000));
  lastFrameAt = now;
  if (dt > 0) fps = lerp(fps, 1 / dt, 0.06);
  nowMs = now;
  try {
    if (screen === 'hub') updateHub(dt);
    animateHero(dt, now / 1000);
    animateGuardian(dt, now / 1000);
    updateSparks(dt);
    updateCombatEffects(dt);
    updateSceneMotion(dt, now / 1000);
    placeCamera(dt, now / 1000);
    if (renderer) renderer.render(scene, camera);
    updateWardrobePreview(dt, now / 1000);
  } catch (error) {
    reportError(error && error.message || error);
    if (screen !== 'boot') console.error(error);
  }
  postPhase();
  requestAnimationFrame(frame);
}

/* -------------------------------------------------------------------------
   API del Game Studio / playtest
   ------------------------------------------------------------------------- */
function heroWorldPosition() {
  if (arenaGroup.visible) {
    return new THREE.Vector3(ARENA_POS.x + duelPositions.hero.x, 0, ARENA_POS.z + duelPositions.hero.z);
  }
  return new THREE.Vector3(hubHero.x, 0, hubHero.z);
}
function heroOnScreen() {
  if (!renderer) return false;
  var p = heroWorldPosition();
  var v = new THREE.Vector3(p.x, 1.2, p.z).project(camera);
  return Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1 && v.z < 1;
}
window.__gameState = function () {
  var p = heroWorldPosition();
  var gpos = guardian && arenaGroup.visible
    ? [{ x: Math.round((ARENA_POS.x + duelPositions.guardian.x) * 100) / 100, y: Math.round((ARENA_POS.z + duelPositions.guardian.z) * 100) / 100 }]
    : [];
  var correctCount = session ? session.orders.filter(function (id) { return session.answers[id] && session.answers[id].correct; }).length : 0;
  return {
    phase: overallPhase(),
    paused: screen === 'pause',
    screen: screen,
    mode: session ? session.mode : (lastResult ? lastResult.mode : 'hub'),
    score: lastResult ? lastResult.score : correctCount * 100,
    best: Math.max.apply(null, [0].concat(CAMP.missions.map(function (m) { return (state.missions[m.id] && Number(state.missions[m.id].bestScore)) || 0; }))),
    hearts: session ? session.hearts : (lastResult && typeof lastResult.heartsRemaining === 'number' ? lastResult.heartsRemaining : (Number(RULES.duelHearts) || 3)),
    fps: Math.round(fps),
    time: session ? Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000) : 0,
    hero: { x: Math.round(p.x * 100) / 100, y: Math.round(p.z * 100) / 100 },
    pickups: [],
    enemies: gpos,
    world: { w: 28, h: 28, radius: HUB_RADIUS },
    heroOnScreen: heroOnScreen(),
    level: currentLevel(),
    xp: state.xp,
    coins: state.coins,
    stage: state.stage,
    missionsCompleted: totalMissionsDone(),
    dueReviews: dueCount(),
    selectedCharacterId: state.collection.selectedCharacterId,
    activeMissionId: session ? session.missionId : (lastResult ? lastResult.missionId : null),
    questionIndex: session ? session.cursor : null,
    questionTotal: session ? session.questions.length : null,
    feedbackOpen: !!lastFeedback,
    lastResultPass: lastResult ? !!lastResult.pass : null,
    renderer: renderer ? 'webgl' : 'none'
  };
};
window.__autoplay = function () {
  if (RULES.devHeroSweep) return;
  if (RULES.devScreen && RULES.devAfterScreen !== 'reviewSession') return;
  var now = performance.now();
  if (screen === 'title') {
    if (now - autoLastAction < 250) return;
    autoLastAction = now;
    enterGame();
    return;
  }
  if (screen === 'hub') {
    if (now - autoLastAction < 180) return;
    var rec = nextRecommended();
    if (rec) {
      autoLastAction = now;
      openJournal(rec.areaId, rec.id);
      return;
    }
    if (dueCount()) {
      autoLastAction = now;
      openReview();
      return;
    }
    autoLastAction = now;
    openJournal(selectedAreaId);
    return;
  }
  if (screen === 'journal') {
    if (now - autoLastAction < 160) return;
    var mission = selectedMissionForArea();
    if (mission && missionUnlockInfo(mission).unlocked) {
      autoLastAction = now;
      launchMission(mission.id);
    }
    return;
  }
  if (screen === 'duel' && session) {
    if (lastFeedback) {
      if (now - lastFeedback.shownAt > 620) {
        autoLastAction = now;
        nextQuestion();
      }
      return;
    }
    if (now - autoLastAction < 150) return;
    var q = currentQuestion();
    if (q) {
      autoLastAction = now;
      var autoplayChoice = q.answer;
      if (RULES.devMistake && !session.devMistakeUsed) {
        session.devMistakeUsed = true;
        var wrongOption = q.options.filter(function (o) { return o.id !== q.answer; })[0];
        if (wrongOption) autoplayChoice = wrongOption.id;
      }
      answerCurrent(autoplayChoice);
    }
    return;
  }
  if (screen === 'review') {
    if (now - autoLastAction < 250) return;
    autoLastAction = now;
    launchReview('due');
  }
};

/* -------------------------------------------------------------------------
   Arranque
   ------------------------------------------------------------------------- */
function primePortrait() {
  try {
    renderHeroPortrait(state.collection.selectedCharacterId, 200);
    syncHudPortrait();
  } catch (e) {
    reportError('retrato inicial: ' + (e.message || e));
  }
}
function sendRenders(delay) {
  window.setTimeout(function () {
    try { post({ type: 'renders', renders: renderSlots(256) }); } catch (e) { reportError('renders: ' + (e.message || e)); }
  }, delay || 900);
}
function boot() {
  var bootUnlocks = syncCharacters();
  healEquippedOutfits();
  var bootCosmetics = unlockProgressCosmetics();
  if (bootUnlocks.length || bootCosmetics.length) persist();
  mountHud();
  rebuildHeroAvatar();
  enterTitle();
  setLoading(false);
  initAudio();
  requestAnimationFrame(frame);
  window.setTimeout(primePortrait, 320);
  sendRenders(450);
  window.setTimeout(function () { sendRenders(1); }, 2000);
  if (bootUnlocks.length) {
    window.setTimeout(function () {
      toast(bootUnlocks.map(function (c) { return c.name; }).join(', ') + ' se unió al observatorio por tus misiones completadas.', 'success', 5000);
    }, 1200);
  }
  if (RULES.devHeroSweep) {
    state.collection.ownedCharacterIds = CAMP.characters.map(function (c) { return c.id; });
    CAMP.characters.forEach(function (c) { try { renderHeroPortrait(c.id, 200); } catch (e) {} });
    var sweepIndex = 0;
    window.setTimeout(function () {
      cameraMode = 'hub';
      view = 'hub';
      setScreen('hub');
      var sweep = function () {
        sweepIndex = (sweepIndex + 1) % CAMP.characters.length;
        state.collection.selectedCharacterId = CAMP.characters[sweepIndex].id;
        rebuildHeroAvatar();
        syncHUD();
      };
      window.setInterval(sweep, 1100);
    }, 700);
  }
  if (RULES.devScreen) {
    window.setTimeout(function () {
      try {
        var target = RULES.devScreen;
        if (target === 'journal') openJournal(selectedAreaId);
        else if (target === 'heroes') openHeroes();
        else if (target === 'review') openReview();
        else if (target === 'import') openImport();
        else if (target === 'pause') openPause();
        else if (target === 'mission') {
          var devMission = null;
          if (RULES.devArea) {
            devMission = areaMissions(RULES.devArea).filter(function (m) { return missionUnlockInfo(m).unlocked; })[0] || null;
          }
          if (!devMission) devMission = nextRecommended();
          if (devMission) launchMission(devMission.id);
        }
        if (target === 'import' && RULES.devImportB64) {
          analyzeImport(decodeURIComponent(escape(window.atob(RULES.devImportB64))));
          if (RULES.devApplyImport) {
            confirmImport();
            if (RULES.devAfterScreen === 'heroes') openHeroes();
            else if (RULES.devAfterScreen === 'review') openReview();
            else if (RULES.devAfterScreen === 'journal') openJournal(selectedAreaId);
            else if (RULES.devAfterScreen === 'reviewSession') {
              openReview();
              window.setTimeout(function () { launchReview('due'); }, 220);
            }
          }
        }
        if (RULES.devRecruit && CHARACTER_BY_ID[RULES.devRecruit] && state.collection.ownedCharacterIds.indexOf(RULES.devRecruit) === -1) {
          openHeroes();
          openRecruit(RULES.devRecruit);
          if (RULES.devRecruitConfirm) confirmRecruit();
        }
      } catch (e) { reportError('devScreen: ' + (e.message || e)); }
    }, 650);
  }
  if (!storageEnabled) {
    window.setTimeout(function () { toast('El navegador bloquea el guardado local. El progreso durará hasta cerrar la pestaña.', 'warn', 7000); }, 1200);
  }
  if (state.importedAt && !state.importToastShown) {
    window.setTimeout(function () { toast('Partida importada disponible. Entra para continuar tu ruta.', 'success', 5000); }, 900);
  }
}
setTimeout(function () {
  var loading = document.getElementById('loading');
  if (loading) loading.classList.add('hidden');
}, 200);
boot();

})();
