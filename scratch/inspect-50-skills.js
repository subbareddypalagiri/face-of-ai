// scratch/inspect-50-skills.js
const fs = require('fs');
const path = require('path');
const os = require('os');

const regPath = path.join(os.homedir(), '.venar', 'registry.json');
const reg = JSON.parse(fs.readFileSync(regPath, 'utf8'));

console.log('=== VENAR 50 SKILLS MATRIX ===');
console.log('Total Skills:', reg.skills.length);
reg.skills.forEach((s, i) => {
  console.log(`${i + 1}. [${s.category || 'SKILL'}] ${s.name} (Rank #${s.rank || i + 1}) - ${s.desc || ''}`);
});
