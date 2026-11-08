// Run once per released update: node scripts/bump-version.cjs
const fs = require('node:fs');
const path = require('node:path');
const file = path.join(__dirname, '..', 'VERSION');
const current = Number(fs.readFileSync(file, 'utf8').trim());
if (!Number.isSafeInteger(current) || current < 1) throw Error('Invalid release version');
fs.writeFileSync(file, `${current + 1}\n`);
console.log(`Release ${current + 1}`);
