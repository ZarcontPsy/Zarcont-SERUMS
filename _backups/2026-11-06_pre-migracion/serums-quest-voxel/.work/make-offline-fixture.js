const fs = require('fs');
const campaign = JSON.parse(fs.readFileSync('src/campaign.json', 'utf8'));
const mission = campaign.missions.find((m) => m.id === 'mission-sp-1');
const errors = {};
mission.questionIds.slice(0, 3).forEach((id, i) => {
  errors[id] = {
    questionId: id,
    areaId: mission.areaId,
    attempts: 1,
    recoveryLevel: 0,
    lastResult: 'wrong',
    nextReviewAt: '2026-11-05T15:0' + i + ':00.000Z',
    firstWrongAt: '2026-11-01T10:00:00.000Z'
  };
});
const state = {
  schemaVersion: 2,
  profile: { name: 'Offline QA' },
  xp: 1640,
  coins: 2510,
  stage: 3,
  academic: { answered: 42, correct: 33, wrong: 9, byArea: {} },
  collection: {
    ownedCharacterIds: ['ilan', 'mara'],
    ownedCosmeticIds: ['c-cabeza-gorro', 'c-cabeza-diadema'],
    selectedCharacterId: 'ilan',
    equipped: { ilan: { cabeza: 'c-cabeza-gorro' } }
  },
  daily: { lastCompletedDate: '2026-11-05', streak: 8, bestStreak: 8, totalCompleted: 8 },
  errors
};
fs.writeFileSync('.work/offline-fixture.json', JSON.stringify({ app: 'SERUMS QUEST', state }, null, 2));
console.log('fixture written', Object.keys(errors).length);
