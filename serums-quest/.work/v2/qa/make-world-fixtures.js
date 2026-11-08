'use strict';
const fs = require('fs');
const path = require('path');
const base = JSON.parse(fs.readFileSync(path.join(__dirname, 'save-full.json'), 'utf8'));
const questions = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'questions-v2.json'), 'utf8'));
const list = Array.isArray(questions) ? questions : questions.questions;
const now = new Date();
const past = new Date(now.getTime() - 3600000).toISOString();
function clone() { return JSON.parse(JSON.stringify(base)); }

const empty = clone();
empty.v2 = { world: { chests: {}, guides: {}, fragments: {}, stations: {}, visited: {} } };
fs.writeFileSync(path.join(__dirname, 'save-world-empty.json'), JSON.stringify(empty, null, 2));

const due = clone();
due.v2 = { world: { chests: {}, guides: {}, fragments: {}, stations: {}, visited: {} } };
due.errors = {};
list.filter((q) => q.areaId === 'area-psi-salud-publica').slice(0, 3).forEach((q) => {
  due.errors[q.id] = {
    questionId: q.id,
    areaId: q.areaId,
    confidence: q.confidence,
    firstAt: past,
    lastAt: past,
    lastWrongAt: past,
    count: 1,
    recoveryLevel: 0,
    recoveredAt: null,
    nextReviewAt: past
  };
});
due.academic.byArea = due.academic.byArea || {};
fs.writeFileSync(path.join(__dirname, 'save-world-due.json'), JSON.stringify(due, null, 2));

const mastery = clone();
mastery.v2 = { world: { chests: {}, guides: {}, fragments: {}, stations: {}, visited: {} } };
mastery.questions = {};
list.filter((q) => q.areaId === 'area-psi-etica').forEach((q) => {
  mastery.questions[q.id] = { attempts: 4, correct: 4, wrong: 0, mastery: 4, streak: 4, bestStreak: 4, lastResult: 'correct', lastAttemptAt: past, lastCorrectAt: past, firstCorrectAt: past, recoveryLevel: 0, nextReviewAt: past, areaId: q.areaId, confidence: q.confidence };
});
fs.writeFileSync(path.join(__dirname, 'save-world-mastery.json'), JSON.stringify(mastery, null, 2));

console.log('due', Object.keys(due.errors).length, 'mastery', Object.keys(mastery.questions).length);
