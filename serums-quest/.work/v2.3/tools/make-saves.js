'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..', '..');
const full = JSON.parse(fs.readFileSync(path.join(root, '.work', 'v2', 'qa', 'save-full.json'), 'utf8'));
function settings(extra) {
  return Object.assign({}, full.settings, {
    sound: false, ambient: false, muted: false, volume: 0.7, reducedMotion: false,
    extraTime: false, effectsQuality: 'alto', qualityChosen: true, hide3dFrames: false,
    textScale: 'normal', highContrast: false, tutorialSeen: true, backupReminder: false,
    feedbackMode: 'end', onlyOriginalBank: false
  }, extra || {});
}
function write(name, save) {
  fs.mkdirSync(path.join(root, '.work', 'v2.3', 'qa'), { recursive: true });
  fs.writeFileSync(path.join(root, '.work', 'v2.3', 'qa', name), JSON.stringify(save, null, 2));
  console.log(name, 'owned', save.collection.ownedCosmeticIds.length, 'coins', save.coins, 'tutorialSeen', save.settings.tutorialSeen);
}
const allOwned = JSON.parse(JSON.stringify(full));
allOwned.settings = settings();
allOwned.coins = 5000;
write('save-v23-all.json', allOwned);

const mixed = JSON.parse(JSON.stringify(full));
mixed.settings = settings();
mixed.coins = 5000;
mixed.collection.ownedCosmeticIds = full.collection.ownedCosmeticIds.filter((id, i) => i % 2 === 0);
write('save-v23-mixed.json', mixed);

const tutorial = JSON.parse(JSON.stringify(full));
tutorial.settings = settings({ tutorialSeen: false, backupReminder: false });
tutorial.coins = 5000;
write('save-v23-tutorial.json', tutorial);
