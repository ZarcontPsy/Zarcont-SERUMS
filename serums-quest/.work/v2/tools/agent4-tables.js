/* Agent 4 - genera las tablas del informe de contenido. */
"use strict";

const fs = require("fs");
const path = require("path");
const { ROOT, loadContent } = require("./agent4-load.js");

const content = loadContent();
const OFFICIAL = [
  "area-psi-salud-publica",
  "area-psi-cuidado-integral",
  "area-psi-etica",
  "area-psi-investigacion",
  "area-psi-gestion"
];
const catById = content.categoryById;
const areaTitle = {};
content.areas.forEach((a) => { areaTitle[a.id] = a.short || a.title; });

/* Áreas heredadas -> categoría -> área oficial */
const legacyRows = [];
content.legacyAreas.forEach((a) => {
  const sheetCount = content.sheets.filter((s) => s.legacyAreaId === a.id).length;
  legacyRows.push({
    legacy: a.id,
    short: a.short,
    categoryId: a.categoryId,
    category: a.categoryId ? catById[a.categoryId].title : "(sin categoría)",
    area: a.primaryAreaId,
    areaShort: areaTitle[a.primaryAreaId],
    sheets: sheetCount
  });
});

const catRows = content.categories.map((c) => ({
  id: c.id,
  title: c.title,
  area: c.areaId,
  areaShort: areaTitle[c.areaId],
  sheets: content.sheets.filter((s) => s.categoryId === c.id).length,
  topics: content.topics.filter((t) => t.categoryId === c.id && !t.isContainer).length
}));

const areaRows = OFFICIAL.map((id) => {
  const area = content.areas.find((a) => a.id === id);
  const sheets = content.sheets.filter((s) => s.primaryAreaId === id);
  const cardCount = content.cards.filter((c) => {
    const s = content.sheetById[c.sheetId];
    return s && s.primaryAreaId === id;
  }).length;
  return {
    id,
    short: area.short,
    categories: content.categories.filter((c) => c.areaId === id).length,
    topics: content.topics.filter((t) => t.primaryAreaId === id && !t.isContainer).length,
    sheets: sheets.length,
    cards: cardCount
  };
});

const sourcesByKind = {};
content.sources.forEach((s) => { sourcesByKind[s.kind] = (sourcesByKind[s.kind] || 0) + 1; });

const out = {
  stats: {
    sources: content.sources.length,
    areas: content.areas.length,
    legacyAreas: content.legacyAreas.length,
    primaryAreas: content.primaryAreas.length,
    topics: content.topics.length,
    categories: content.categories.length,
    sheets: content.sheets.length,
    cards: content.cards.length,
    cardsByType: content.cards.reduce((m, c) => { m[c.type] = (m[c.type] || 0) + 1; return m; }, {}),
    sourcesByKind
  },
  legacyRows,
  catRows,
  areaRows
};

console.log(JSON.stringify(out, null, 2));
