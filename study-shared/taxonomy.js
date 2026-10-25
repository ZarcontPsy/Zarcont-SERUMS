/* SERUMS STUDY — taxonomía de las cinco áreas oficiales
   Capa de presentación y navegación. No crea, elimina ni renombra fichas,
   tarjetas, temas o áreas. Añade categoryId/primaryAreaId/legacyAreaId para
   agrupar el contenido existente bajo el temario oficial de Psicología. */
(function () {
  "use strict";

  var VERSION = "1.0.0";

  var PRIMARY_IDS = [
    "area-psi-salud-publica",
    "area-psi-cuidado-integral",
    "area-psi-etica",
    "area-psi-investigacion",
    "area-psi-gestion"
  ];

  var CATEGORIES = [
    {
      id: "cat-sp-metodos", areaId: "area-psi-salud-publica", order: 1,
      title: "Métodos y análisis de salud pública", short: "Métodos",
      description: "Fundamentos, epidemiología, medición, causalidad, demografía, vigilancia y análisis de situación."
    },
    {
      id: "cat-sp-comunidad", areaId: "area-psi-salud-publica", order: 2,
      title: "Salud comunitaria y determinantes ambientales", short: "Comunidad y ambiente",
      description: "Determinantes sociales y ambientales, territorio, participación, información y gestión local."
    },
    {
      id: "cat-sp-promocion", areaId: "area-psi-salud-publica", order: 3,
      title: "Promoción de la salud y prevención del daño", short: "Promoción y prevención",
      description: "Promoción, educación para la salud, bioseguridad y gestión del riesgo en emergencias."
    },
    {
      id: "cat-ci-aps", areaId: "area-psi-cuidado-integral", order: 1,
      title: "Atención primaria y modelo de cuidado", short: "APS y MCI",
      description: "APS, atributos, Modelo de Cuidado Integral, familia, comunidad, territorio y redes."
    },
    {
      id: "cat-ci-clinica", areaId: "area-psi-cuidado-integral", order: 2,
      title: "Evaluación y clínica psicológica", short: "Evaluación y clínica",
      description: "Evaluación, entrevista, observación, psicoterapias, rapport y aspectos legales."
    },
    {
      id: "cat-ci-mental", areaId: "area-psi-cuidado-integral", order: 3,
      title: "Salud mental, consumo y violencias", short: "Salud mental",
      description: "Depresión, consumo de alcohol, psicosis, violencia, duelo y continuidad de cuidados."
    },
    {
      id: "cat-ci-curso", areaId: "area-psi-cuidado-integral", order: 4,
      title: "Gestación, infancia y adolescencia", short: "Curso de vida temprano",
      description: "Salud materna, neonatal, niñez, lactancia, nutrición infantil y adolescencia."
    },
    {
      id: "cat-ci-adulto", areaId: "area-psi-cuidado-integral", order: 5,
      title: "Adultez, vejez, crónicas y nutrición", short: "Adultez y crónicas",
      description: "Paquete adulto y adulto mayor, enfermedades no transmisibles, anemia, climaterio y nutrición."
    },
    {
      id: "cat-ci-prevencion", areaId: "area-psi-cuidado-integral", order: 6,
      title: "Prevención y detección temprana", short: "Prevención",
      description: "Cáncer, tuberculosis, vacunación y salud bucal en la persona y la comunidad."
    },
    {
      id: "cat-ci-its", areaId: "area-psi-cuidado-integral", order: 7,
      title: "ITS, VIH, hepatitis y transmisión vertical", short: "ITS y VIH",
      description: "Consejería, prevención combinada, tratamiento y prevención de la transmisión maternoinfantil."
    },
    {
      id: "cat-ci-iaas", areaId: "area-psi-cuidado-integral", order: 8,
      title: "Seguridad del paciente e IAAS", short: "Seguridad e IAAS",
      description: "Higiene de manos, vigilancia y prevención de infecciones asociadas a la atención de salud."
    },
    {
      id: "cat-et-etica", areaId: "area-psi-etica", order: 1,
      title: "Ética y bioética", short: "Ética y bioética",
      description: "Función pública, trato digno, confidencialidad, deontología y derechos de las personas usuarias."
    },
    {
      id: "cat-et-intercultural", areaId: "area-psi-etica", order: 2,
      title: "Atención intercultural en salud", short: "Interculturalidad",
      description: "Diálogo intercultural, diversidad, pertinencia cultural, parto vertical, medicina tradicional y estigma."
    },
    {
      id: "cat-in-conceptos", areaId: "area-psi-investigacion", order: 1,
      title: "Conceptos y clasificación", short: "Conceptos",
      description: "Fundamentos, enfoques y tipos de investigación en salud."
    },
    {
      id: "cat-in-metodologia", areaId: "area-psi-investigacion", order: 2,
      title: "Metodología", short: "Metodología",
      description: "Instrumentos, validez, procesamiento y análisis de datos."
    },
    {
      id: "cat-in-ejecucion", areaId: "area-psi-investigacion", order: 3,
      title: "Ejecución y comunicación", short: "Ejecución",
      description: "Publicación de resultados y aspectos éticos de la investigación."
    },
    {
      id: "cat-ge-planificacion", areaId: "area-psi-gestion", order: 1,
      title: "Planificación y presupuesto", short: "Planificación",
      description: "Planeamiento estratégico, análisis institucional, PEI, POI y presupuesto."
    },
    {
      id: "cat-ge-organizacion", areaId: "area-psi-gestion", order: 2,
      title: "Organización de los servicios", short: "Organización",
      description: "ROF, MOP, categorías, cartera, referencia, historia clínica, RIS y telesalud."
    },
    {
      id: "cat-ge-administracion", areaId: "area-psi-gestion", order: 3,
      title: "Administración de los servicios", short: "Administración",
      description: "Recursos humanos, inventario, alianzas, liderazgo y trabajo colaborativo."
    },
    {
      id: "cat-ge-calidad", areaId: "area-psi-gestion", order: 4,
      title: "Sistema de gestión de la calidad", short: "Calidad",
      description: "Mejora continua, seguridad del paciente, clima y cultura organizacional."
    }
  ];

  var LEGACY_AREA_CATEGORY = {
    "area-aps": "cat-ci-aps",
    "area-mci": "cat-ci-aps",
    "area-mental": "cat-ci-mental",
    "area-depresion": "cat-ci-mental",
    "area-audit": "cat-ci-mental",
    "area-violencia": "cat-ci-mental",
    "area-perinatal": "cat-ci-mental",
    "area-materna": "cat-ci-curso",
    "area-materno-neonatal": "cat-ci-curso",
    "area-adolescencia-vih": "cat-ci-curso",
    "area-nutricion": "cat-ci-curso",
    "area-adulto": "cat-ci-adulto",
    "area-cronicas": "cat-ci-adulto",
    "area-itsvih": "cat-ci-its",
    "area-hepatitis": "cat-ci-its",
    "area-seguridad-paciente": "cat-ci-iaas",
    "area-promocion": "cat-sp-promocion",
    "area-ambiental": "cat-sp-comunidad"
  };

  var TOPIC_OVERRIDES = {
    "topic-nutricion-adultos-evaluacion": "cat-ci-adulto",
    "topic-nutricion-adultos-intervencion": "cat-ci-adulto",
    "topic-raras": "cat-ci-adulto",
    "topic-nino-expuesto": "cat-ci-its",
    "topic-sifilis": "cat-ci-its",
    "topic-vih-navv": "cat-ci-its"
  };

  var OFFICIAL_TOPIC_CATEGORY = {
    "topic-psi-sp-1": "cat-sp-metodos",
    "topic-psi-sp-2": "cat-sp-comunidad",
    "topic-psi-sp-3": "cat-sp-promocion",
    "topic-psi-ci-1": "cat-ci-clinica",
    "topic-psi-ci-2": null,
    "topic-psi-et-1": "cat-et-etica",
    "topic-psi-et-2": "cat-et-intercultural",
    "topic-psi-in-1": "cat-in-conceptos",
    "topic-psi-in-2": "cat-in-metodologia",
    "topic-psi-in-3": "cat-in-ejecucion",
    "topic-psi-ge-1": "cat-ge-planificacion",
    "topic-psi-ge-2": "cat-ge-organizacion",
    "topic-psi-ge-3": "cat-ge-administracion",
    "topic-psi-ge-4": "cat-ge-calidad"
  };

  /* El módulo oficial CI-2 es un contenedor de 21 ítems. Cada ficha se ubica
     en la categoría que le corresponde sin crear fichas ni temas nuevos. */
  var CONTAINER_SHEET_CATEGORY = {
    "sheet-psi-ci-2-1": "cat-ci-aps",
    "sheet-psi-ci-2-2": "cat-ci-aps",
    "sheet-psi-ci-2-3": "cat-ci-curso",
    "sheet-psi-ci-2-4": "cat-ci-curso",
    "sheet-psi-ci-2-5": "cat-ci-curso",
    "sheet-psi-ci-2-6": "cat-ci-curso",
    "sheet-psi-ci-2-7": "cat-ci-adulto",
    "sheet-psi-ci-2-8": "cat-ci-adulto",
    "sheet-psi-ci-2-8b": "cat-ci-adulto",
    "sheet-psi-ci-2-9": "cat-ci-prevencion",
    "sheet-psi-ci-2-10": "cat-ci-prevencion",
    "sheet-psi-ci-2-11": "cat-ci-prevencion",
    "sheet-psi-ci-2-12": "cat-ci-adulto",
    "sheet-psi-ci-2-13": "cat-ci-its",
    "sheet-psi-ci-2-14": "cat-ci-its",
    "sheet-psi-ci-2-15": "cat-ci-its",
    "sheet-psi-ci-2-16": "cat-ci-adulto",
    "sheet-psi-ci-2-17": "cat-ci-adulto",
    "sheet-psi-ci-2-18": "cat-ci-adulto",
    "sheet-psi-ci-2-19": "cat-ci-iaas",
    "sheet-psi-ci-2-20": "cat-ci-adulto",
    "sheet-psi-ci-2-21": "cat-ci-prevencion"
  };

  var applied = false;
  var contentRef = null;

  function content() {
    return contentRef || window.STUDY_CONTENT || null;
  }
  function byId(list) {
    var map = {};
    (list || []).forEach(function (item) { if (item && item.id) map[item.id] = item; });
    return map;
  }
  function primaryAreas() {
    var c = content();
    return (c && c.primaryAreas) || [];
  }
  function legacyAreas() {
    var c = content();
    return (c && c.legacyAreas) || [];
  }
  function allCategories() {
    var c = content();
    return (c && c.categories) || [];
  }
  function category(id) {
    var c = content();
    return c && c.categoryById ? c.categoryById[id] || null : null;
  }
  function area(id) {
    var c = content();
    if (!c) return null;
    return (c.primaryAreaById && c.primaryAreaById[id]) ||
      (c.primaryAreas || []).filter(function (a) { return a.id === id; })[0] ||
      (c.legacyAreaById && c.legacyAreaById[id]) ||
      (c.areas || []).filter(function (a) { return a.id === id; })[0] || null;
  }
  function categoriesForArea(areaId) {
    return allCategories().filter(function (cat) { return cat.areaId === areaId; })
      .sort(function (a, b) { return a.order - b.order; });
  }
  function canonicalAreaId(id) {
    if (!id) return "";
    var c = content();
    if (c && (c.primaryAreaById || {})[id]) return id;
    var cat = category(LEGACY_AREA_CATEGORY[id]);
    if (cat) return cat.areaId;
    return "";
  }
  function legacyArea(id) {
    var c = content();
    return c && c.legacyAreaById ? c.legacyAreaById[id] || null : null;
  }
  function categoryForTopic(topicId) {
    var c = content();
    var topic = c && (c.topicById || {})[topicId];
    return topic ? category(topic.categoryId) : null;
  }
  function categoryForSheet(sheetOrId) {
    var c = content();
    var sheet = typeof sheetOrId === "string"
      ? (c && (c.sheetById || {})[sheetOrId]) : sheetOrId;
    return sheet ? category(sheet.categoryId) : null;
  }
  function areaForSheet(sheetOrId) {
    var cat = categoryForSheet(sheetOrId);
    return cat ? area(cat.areaId) : null;
  }
  function sheetsForCategory(categoryId) {
    var c = content();
    return c ? (c.sheets || []).filter(function (s) { return s.categoryId === categoryId; }) : [];
  }
  function topicsForCategory(categoryId) {
    var c = content();
    return c ? (c.topics || []).filter(function (t) {
      return t.categoryId === categoryId && !t.isContainer;
    }) : [];
  }
  function isContainerTopic(topicOrId) {
    var c = content();
    var topic = typeof topicOrId === "string"
      ? (c && (c.topicById || {})[topicOrId]) : topicOrId;
    return !!(topic && topic.isContainer);
  }

  function apply(content) {
    if (!content || applied) return content;
    contentRef = content;

    var areaMap = byId(content.areas);
    var topicMap = byId(content.topics);
    var sheetMap = byId(content.sheets);
    var issues = [];

    var primary = PRIMARY_IDS.map(function (id) {
      var item = areaMap[id];
      if (!item) issues.push("Área oficial ausente: " + id);
      return item;
    }).filter(Boolean);
    var primaryIds = byId(primary);
    var legacy = (content.areas || []).filter(function (a) { return !primaryIds[a.id]; });

    var categories = CATEGORIES.map(function (cat) {
      return {
        id: cat.id, areaId: cat.areaId, order: cat.order,
        title: cat.title, short: cat.short, description: cat.description
      };
    });
    var catMap = byId(categories);

    categories.forEach(function (cat) {
      if (!primaryIds[cat.areaId]) issues.push("Categoría sin área primaria: " + cat.id);
    });

    content.primaryAreas = primary;
    content.legacyAreas = legacy;
    content.primaryAreaById = primaryIds;
    content.legacyAreaById = byId(legacy);
    content.categories = categories;
    content.categoryById = catMap;
    content.areaAliases = {};

    primary.forEach(function (a) {
      a.isPrimary = true;
    });
    legacy.forEach(function (a) {
      var catId = LEGACY_AREA_CATEGORY[a.id];
      var cat = catMap[catId];
      a.isPrimary = false;
      a.categoryId = catId || null;
      a.primaryAreaId = cat ? cat.areaId : null;
      if (!cat) issues.push("Área heredada sin categoría: " + a.id);
    });

    (content.topics || []).forEach(function (topic) {
      var isContainer = topic.id === "topic-psi-ci-2";
      var catId = TOPIC_OVERRIDES[topic.id] ||
        (OFFICIAL_TOPIC_CATEGORY.hasOwnProperty(topic.id) ? OFFICIAL_TOPIC_CATEGORY[topic.id] : null) ||
        (LEGACY_AREA_CATEGORY[topic.areaId] || null);
      var cat = catMap[catId] || null;
      topic.categoryId = isContainer ? null : catId;
      topic.isContainer = isContainer;
      topic.primaryAreaId = cat ? cat.areaId : (areaMap[topic.areaId] || {}).primaryAreaId || topic.areaId;
      topic.legacyAreaId = LEGACY_AREA_CATEGORY[topic.areaId] ? topic.areaId : null;
      if (!isContainer && !cat) issues.push("Tema sin categoría: " + topic.id);
    });

    (content.sheets || []).forEach(function (sheet) {
      var topic = topicMap[sheet.topicId];
      var catId = CONTAINER_SHEET_CATEGORY[sheet.id] ||
        (topic && topic.categoryId) ||
        (LEGACY_AREA_CATEGORY[sheet.areaId] || null);
      var cat = catMap[catId] || null;
      sheet.categoryId = catId;
      sheet.primaryAreaId = cat ? cat.areaId : (topic && topic.primaryAreaId) || sheet.areaId;
      sheet.legacyAreaId = (topic && topic.legacyAreaId) || (LEGACY_AREA_CATEGORY[sheet.areaId] ? sheet.areaId : null);
      if (!cat) issues.push("Ficha sin categoría: " + sheet.id);
    });

    content.topicById = byId(content.topics);
    content.sheetById = sheetMap;

    var sheetCounts = {};
    var topicCounts = {};
    var entryCounts = {};
    categories.forEach(function (cat) {
      sheetCounts[cat.id] = (content.sheets || []).filter(function (s) { return s.categoryId === cat.id; }).length;
      var topics = (content.topics || []).filter(function (t) {
        return t.categoryId === cat.id && !t.isContainer;
      }).length;
      var loose = (content.sheets || []).filter(function (s) {
        var t = content.topicById[s.topicId];
        return s.categoryId === cat.id && t && t.isContainer;
      }).length;
      topicCounts[cat.id] = topics;
      entryCounts[cat.id] = topics + loose;
    });

    var unclassified = (content.sheets || []).filter(function (s) {
      return !s.categoryId || !catMap[s.categoryId];
    }).map(function (s) { return s.id; });
    var areaTotals = {};
    primary.forEach(function (a) {
      areaTotals[a.id] = (content.sheets || []).filter(function (s) {
        return s.primaryAreaId === a.id;
      }).length;
    });
    var totalAssigned = Object.keys(areaTotals).reduce(function (n, id) { return n + areaTotals[id]; }, 0);
    if (totalAssigned !== (content.sheets || []).length) {
      issues.push("Fichas asignadas " + totalAssigned + " de " + (content.sheets || []).length);
    }

    content.taxonomy = {
      version: VERSION,
      primaryAreas: primary.length,
      legacyAreas: legacy.length,
      categories: categories.length,
      topics: (content.topics || []).length,
      sheets: (content.sheets || []).length,
      cards: (content.cards || []).length,
      categorySheetCounts: sheetCounts,
      categoryTopicCounts: topicCounts,
      categoryEntryCounts: entryCounts,
      moduleEntries: Object.keys(entryCounts).reduce(function (n, id) { return n + entryCounts[id]; }, 0),
      areaSheetTotals: areaTotals,
      unclassifiedSheets: unclassified,
      issues: issues
    };

    content.areaAliases = {};
    legacy.forEach(function (a) {
      if (a.primaryAreaId) content.areaAliases[a.id] = a.primaryAreaId;
    });

    if (issues.length && window.console) {
      window.console.warn("StudyTaxonomy:", issues);
    }
    applied = true;
    return content;
  }

  window.StudyTaxonomy = {
    version: VERSION,
    apply: apply,
    primaryAreas: primaryAreas,
    legacyAreas: legacyAreas,
    areas: function () { var c = content(); return c ? c.areas : []; },
    categories: allCategories,
    category: category,
    area: area,
    canonicalAreaId: canonicalAreaId,
    legacyArea: legacyArea,
    categoriesForArea: categoriesForArea,
    categoryForTopic: categoryForTopic,
    categoryForSheet: categoryForSheet,
    areaForSheet: areaForSheet,
    sheetsForCategory: sheetsForCategory,
    topicsForCategory: topicsForCategory,
    isContainerTopic: isContainerTopic,
    isPrimaryArea: function (id) { var c = content(); return !!(c && (c.primaryAreaById || {})[id]); },
    report: function () { var c = content(); return c ? c.taxonomy : null; }
  };

  if (window.STUDY_CONTENT) window.StudyTaxonomy.apply(window.STUDY_CONTENT);
})();
