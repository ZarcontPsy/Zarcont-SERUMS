/* SERUMS QUEST - configuración central de juego
   © 2026 ZARCONT. Una sola fuente para XP, monedas, niveles, etapas,
   rangos, logros y límites anti-acumulación. */
(function () {
  "use strict";

  var AREA_IDS = [
    "area-psi-salud-publica",
    "area-psi-cuidado-integral",
    "area-psi-etica",
    "area-psi-investigacion",
    "area-psi-gestion"
  ];

  var AREA_META = {
    "area-psi-salud-publica": {
      short: "Salud pública",
      title: "Área I · Salud pública",
      accent: "#69D3C1",
      icon: "globe",
      blurb: "Métodos, comunidad, promoción y determinantes."
    },
    "area-psi-cuidado-integral": {
      short: "Cuidado integral",
      title: "Área II · Cuidado integral",
      accent: "#7AA2FF",
      icon: "heart",
      blurb: "Clínica, curso de vida y salud mental."
    },
    "area-psi-etica": {
      short: "Ética e interculturalidad",
      title: "Área III · Ética e interculturalidad",
      accent: "#C49BFF",
      icon: "scale",
      blurb: "Dignidad, confidencialidad y pertinencia cultural."
    },
    "area-psi-investigacion": {
      short: "Investigación",
      title: "Área IV · Investigación",
      accent: "#B8D46A",
      icon: "flask",
      blurb: "Método, validez, evidencia y comunicación."
    },
    "area-psi-gestion": {
      short: "Gestión de servicios",
      title: "Área V · Gestión de servicios",
      accent: "#F3B562",
      icon: "layers",
      blurb: "Planificación, organización, calidad y equipos."
    }
  };

  var TIERS = {
    iniciacion: {
      label: "Iniciación",
      short: "Fácil",
      baseXp: 10,
      feedback: "inmediata",
      hint: "Preguntas accesibles, explicación inmediata y sin presión de tiempo."
    },
    desarrollo: {
      label: "Desarrollo",
      short: "Intermedia",
      baseXp: 20,
      feedback: "inmediata",
      hint: "Distractores plausibles y recuperación de errores anteriores."
    },
    especializacion: {
      label: "Especialización",
      short: "Difícil",
      baseXp: 35,
      feedback: "inmediata",
      hint: "Aplicación, distinción entre conceptos similares y precisión."
    },
    dominio: {
      label: "Dominio",
      short: "Caso clínico",
      baseXp: 50,
      feedback: "diferida",
      hint: "Integración de contenidos, sin ayudas durante la prueba."
    },
    repaso: {
      label: "Repaso",
      short: "Repaso",
      baseXp: 20,
      feedback: "inmediata",
      hint: "Recuperación espaciada de preguntas falladas."
    }
  };

  var CONFIG = {
    version: "1.0.0",
    build: "ZARCONT-SQ-1.0.0",
    schemaVersion: 1,
    appName: "SERUMS QUEST",
    appSubtitle: "Aprender también es avanzar",
    storage: {
      stateKey: "serumsquest:state:v1",
      backupKey: "serumsquest:backup:v1",
      journalKey: "serumsquest:journal:v1",
      snapshotKey: "serumsquest:snapshot:v1",
      archivePrefix: "serumsquest:archive:",
      testPrefix: "serumsquest:test:"
    },
    areas: AREA_IDS,
    areaMeta: AREA_META,
    tiers: TIERS,
    xp: {
      question: {
        iniciacion: 10,
        desarrollo: 20,
        especializacion: 35,
        dominio: 50,
        repaso: 20
      },
      completion: {
        mission: 30,
        daily: 40,
        boss: 80,
        survival: 40,
        timed: 25,
        recovery: 30,
        simulacro: 70
      },
      weeklyStreak: 60
    },
    coins: {
      firstCorrect: 1,
      completion: {
        mission: 8,
        daily: 10,
        boss: 25,
        survival: 10,
        timed: 6,
        recovery: 5,
        simulacro: 20
      },
      weeklyStreak: 20,
      dailyCap: 120
    },
    antiFarm: {
      repeatCooldownHours: 6,
      repeatWithin24h: 0.25,
      repeatAfter24h: 0.4,
      masteredMultiplier: 0.1,
      masteredCooldownDays: 7,
      recoveryMultiplier: 0.7,
      maxCoinAwardsPerSession: 12
    },
    levels: {
      base: 80,
      linear: 40,
      quadratic: 10,
      maxLevel: 50
    },
    ranks: [
      {
        id: "bachiller",
        name: "Bachiller",
        short: "Bachiller",
        xp: 0,
        answered: 0,
        accuracy: 0,
        mastered: 0,
        areas: 0,
        bosses: 0,
        color: "#AEB6C8",
        description: "El primer paso: aprender a mirar antes de responder."
      },
      {
        id: "interno",
        name: "Interno",
        short: "Interno",
        xp: 150,
        answered: 10,
        accuracy: 0.55,
        mastered: 0,
        areas: 1,
        bosses: 0,
        color: "#7AA2FF",
        description: "Ya sostienes un ritmo de práctica y una precisión inicial."
      },
      {
        id: "serumista",
        name: "Serumista",
        short: "Serumista",
        xp: 450,
        answered: 30,
        accuracy: 0.65,
        mastered: 8,
        areas: 3,
        bosses: 0,
        color: "#69D3C1",
        description: "Integras áreas distintas y recuperas lo que falla."
      },
      {
        id: "especialista",
        name: "Especialista",
        short: "Especialista",
        xp: 1100,
        answered: 70,
        accuracy: 0.75,
        mastered: 25,
        areas: 5,
        bosses: 1,
        color: "#C49BFF",
        description: "Precisión sostenida, dominio amplio y jefes superados."
      },
      {
        id: "maestro",
        name: "Maestro SERUMS",
        short: "Maestro",
        xp: 2400,
        answered: 120,
        accuracy: 0.82,
        mastered: 50,
        areas: 5,
        bosses: 3,
        color: "#F3B562",
        description: "Criterio, constancia y dominio demostrado en todo el temario."
      }
    ],
    stages: {
      1: {
        id: 1,
        name: "Iniciación",
        short: "Iniciación",
        color: "#7AA2FF",
        description: "Preguntas accesibles, feedback inmediato y recompensas generosas.",
        criteria: "Empieza aquí. La etapa cambia con evidencia, no con una sola respuesta."
      },
      2: {
        id: 2,
        name: "Desarrollo",
        short: "Desarrollo",
        color: "#69D3C1",
        description: "Distractores plausibles, combinación de conceptos y errores recuperados.",
        criteria: "12+ respuestas y 55% de precisión."
      },
      3: {
        id: 3,
        name: "Especialización",
        short: "Especialización",
        color: "#C49BFF",
        description: "Aplicación, distinción entre conceptos similares y pruebas de consistencia.",
        criteria: "30+ respuestas, 65% de precisión y 5 preguntas dominadas."
      },
      4: {
        id: 4,
        name: "Dominio",
        short: "Dominio",
        color: "#F3B562",
        description: "Desafíos integradores, simulacros y evaluación de retención.",
        criteria: "60+ respuestas, 72% de precisión, 12 dominadas y 6 misiones."
      }
    },
    stageRules: {
      minAnswersForStage2: 12,
      minAccuracyStage2: 0.55,
      minAnswersForStage3: 30,
      minAccuracyStage3: 0.65,
      minMasteredStage3: 5,
      minAnswersForStage4: 60,
      minAccuracyStage4: 0.72,
      minMasteredStage4: 12,
      minMissionsStage4: 6,
      downgradeWindow: 12,
      downgradeAccuracy: 0.4
    },
    recovery: {
      firstDelayMinutes: 20,
      intervalsDays: [1, 3, 7, 14, 30],
      masteredAfterRecoveries: 2,
      maxQuestionsPerSession: 8
    },
    pass: {
      mission: 0.6,
      daily: 0.6,
      recovery: 0.5
    },
    modes: {
      misiones: {
        id: "misiones",
        label: "Misiones",
        short: "Misiones",
        description: "Avanza por las cinco áreas en sesiones cortas con feedback inmediato.",
        modeLabel: "Misión"
      },
      supervivencia: {
        id: "supervivencia",
        label: "Supervivencia",
        short: "Supervivencia",
        description: "Tres oportunidades, dificultad creciente y una recompensa anunciada.",
        questionCount: 10,
        lives: 3,
        secondsPerQuestion: 45,
        completionXp: 40
      },
      contrarreloj: {
        id: "contrarreloj",
        label: "Contrarreloj",
        short: "Contrarreloj",
        description: "Precisión bajo tiempo. La velocidad no compensa una respuesta incorrecta.",
        questionCount: 12,
        durations: [180, 300, 480],
        questionCountByDuration: { 180: 8, 300: 12, 480: 18 },
        defaultSeconds: 300,
        passAccuracy: 0.7,
        minAnswered: 8,
        completionXp: 25
      },
      recuperacion: {
        id: "recuperacion",
        label: "Recuperación",
        short: "Recuperación",
        description: "Vuelve sobre lo fallado con repaso espaciado y evidencia de recuperación.",
        maxQuestions: 8
      },
      jefes: {
        id: "jefes",
        label: "Jefes finales",
        short: "Jefes",
        description: "Pruebas integradoras de cada área. Sin feedback hasta el final.",
        questionCount: 8,
        secondsPerQuestion: 90,
        passAccuracy: 0.7
      },
      diario: {
        id: "diario",
        label: "Desafío diario",
        short: "Diario",
        description: "Una sesión breve cada día: repaso, una pregunta exigente y recuperación.",
        questionCount: 6
      },
      simulacro: {
        id: "simulacro",
        label: "Simulacro",
        short: "Simulacro",
        description: "Veinte preguntas cronometradas de todas las áreas. Se abre en Dominio.",
        questionCount: 20,
        seconds: 900,
        passAccuracy: 0.7,
        minStage: 4
      }
    },
    missionPlan: {
      sizes: {
        threeMissions: [5, 6, 6],
        twoMissions: [5, 5],
        oneMission: [5],
        boss: 8
      },
      minQuestionsForThreeMissions: 30,
      minQuestionsForTwoMissions: 14,
      missionXp: {
        1: 30,
        2: 30,
        3: 30
      },
      bossXp: 80,
      bossesRequired: 0,
      bossUnlockMissions: 2,
      bossLevel: 4,
      bossStage: 3,
      secondMissionLevel: 2,
      thirdMissionLevel: 3
    },
    achievements: [
      {
        id: "primer-paso",
        name: "Primer paso",
        description: "Responde tu primera pregunta.",
        icon: "spark",
        xp: 20,
        coins: 5,
        metric: "answered",
        target: 1
      },
      {
        id: "primera-mision",
        name: "En ruta",
        description: "Completa tu primera misión.",
        icon: "flag",
        xp: 30,
        coins: 10,
        metric: "missions",
        target: 1
      },
      {
        id: "cinco-misiones",
        name: "Cartógrafo",
        description: "Completa cinco misiones.",
        icon: "map",
        xp: 60,
        coins: 20,
        metric: "missions",
        target: 5
      },
      {
        id: "primer-jefe",
        name: "Primer custodio",
        description: "Supera un jefe final.",
        icon: "shield",
        xp: 80,
        coins: 30,
        metric: "bosses",
        target: 1
      },
      {
        id: "diez-aciertos",
        name: "Pulso firme",
        description: "Acumula diez respuestas correctas.",
        icon: "target",
        xp: 25,
        coins: 5,
        metric: "correct",
        target: 10
      },
      {
        id: "precision-80",
        name: "Criterio",
        description: "Alcanza 80% de precisión con al menos 20 respuestas.",
        icon: "chart",
        xp: 50,
        coins: 15,
        metric: "accuracy",
        target: 0.8,
        minAnswered: 20
      },
      {
        id: "racha-3",
        name: "Tres días",
        description: "Mantén una racha de 3 días en el desafío diario.",
        icon: "flame",
        xp: 40,
        coins: 10,
        metric: "dailyStreak",
        target: 3
      },
      {
        id: "racha-7",
        name: "Semana completa",
        description: "Mantén una racha de 7 días en el desafío diario.",
        icon: "calendar",
        xp: 80,
        coins: 25,
        metric: "dailyStreak",
        target: 7
      },
      {
        id: "primera-recuperacion",
        name: "Volver a mirar",
        description: "Recupera una pregunta fallada.",
        icon: "rotate",
        xp: 35,
        coins: 10,
        metric: "recoveries",
        target: 1
      },
      {
        id: "diez-recuperaciones",
        name: "Círculo cerrado",
        description: "Recupera diez preguntas falladas.",
        icon: "loop",
        xp: 60,
        coins: 20,
        metric: "recoveries",
        target: 10
      },
      {
        id: "cinco-areas",
        name: "Mirada completa",
        description: "Acierta al menos una pregunta en las cinco áreas.",
        icon: "compass",
        xp: 50,
        coins: 15,
        metric: "areasCorrect",
        target: 5
      },
      {
        id: "area-completa",
        name: "Ruta cerrada",
        description: "Completa todas las misiones de un área.",
        icon: "route",
        xp: 45,
        coins: 15,
        metric: "areasCompleted",
        target: 1
      },
      {
        id: "nivel-5",
        name: "Nivel cinco",
        description: "Alcanza el nivel 5.",
        icon: "arrowUp",
        xp: 50,
        coins: 15,
        metric: "level",
        target: 5
      },
      {
        id: "cien-monedas",
        name: "Tesoro de estudio",
        description: "Acumula 100 monedas.",
        icon: "coins",
        xp: 30,
        coins: 0,
        metric: "coins",
        target: 100
      },
      {
        id: "superviviente",
        name: "Superviviente",
        description: "Completa una sesión de Supervivencia.",
        icon: "shield",
        xp: 40,
        coins: 10,
        metric: "survivalWins",
        target: 1
      },
      {
        id: "precision-tiempo",
        name: "Precisión cronometrada",
        description: "Acierta 10 o más con 85% en Contrarreloj.",
        icon: "timer",
        xp: 55,
        coins: 15,
        metric: "timedAce",
        target: 1
      },
      {
        id: "cien-preguntas",
        name: "Cien preguntas",
        description: "Responde cien preguntas oficiales.",
        icon: "book",
        xp: 70,
        coins: 20,
        metric: "answered",
        target: 100
      },
      {
        id: "diez-dominadas",
        name: "Diez dominadas",
        description: "Domina diez preguntas con respuestas espaciadas.",
        icon: "checkCircle",
        xp: 50,
        coins: 15,
        metric: "mastered",
        target: 10
      }
    ],
    navigation: [
      { route: "home", label: "Inicio", icon: "home" },
      { route: "map", label: "Mapa", icon: "map" },
      { route: "errors", label: "Errores", icon: "rotate" },
      { route: "profile", label: "Perfil", icon: "user" },
      { route: "achievements", label: "Logros", icon: "award" },
      { route: "ranking", label: "Registro", icon: "chart" },
      { route: "settings", label: "Ajustes", icon: "settings" }
    ],
    labels: {
      xp: "XP",
      coins: "monedas",
      streak: "racha",
      accuracy: "precisión",
      mastery: "dominio",
      question: "pregunta",
      questions: "preguntas"
    }
  };

  window.QUEST_CONFIG = CONFIG;
})();
