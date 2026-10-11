'use strict';
const os = require('os');
const path = require('path');
const fs = require('fs');

function testPrompt() {
  const regPath = path.join(os.homedir(), '.venar', 'registry.json');
  if (!fs.existsSync(regPath)) {
    console.log('Registry not found');
    return;
  }
  const reg = JSON.parse(fs.readFileSync(regPath, 'utf8'));
  const clean = 'Oka 3D portfolio website build chey';
  const targetModel = 'Claude 3.7 Sonnet';

  const query = clean.toLowerCase();
  const qWords = query.split(/\s+/).filter(w => w.length > 2);
  const scored = reg.skills.map(s => {
    let score = 0;
    const text = ((s.name || '') + ' ' + (s.desc || '') + ' ' + (s.category || '') + ' ' + (s.prompt || '')).toLowerCase();
    for (const w of qWords) {
      if (text.includes(w)) score += 5;
    }
    if (query.includes('3d') && text.includes('3d')) score += 12;
    if (query.includes('website') && (text.includes('web') || text.includes('ui') || text.includes('design'))) score += 10;
    if (query.includes('portfolio') && (text.includes('portfolio') || text.includes('spatial') || text.includes('ui/ux'))) score += 10;
    return { skill: s, score };
  });

  const matchedSkills = scored.filter(i => i.score > 0).sort((a,b) => b.score - a.score).slice(0, 3).map(i => i.skill);
  const skillDirectives = matchedSkills.map(s => {
    return `### [ACTIVATED VENAR SKILL: ${s.name.toUpperCase()} (Rank #${s.rank})]\n${s.prompt || s.desc}`;
  }).join('\n\n');

  const compiled = `[2026 FAANG PRODUCTION SPECIFICATION FOR ${targetModel.toUpperCase()}]
USER OBJECTIVE: "${clean}"
TARGET WORKSPACE: ${targetModel}

================================================================================
ENGINEERING & ARCHITECTURAL BLUEPRINT (Synthesized from VENAR 50-Skills Matrix)
================================================================================
${skillDirectives}

================================================================================
CRITICAL PRODUCTION DIRECTIVES:
1. ZERO PLACEHOLDERS: Implement all components, logic, and shaders completely. No "TODOs", "// implement here", or ellipses.
2. PRODUCTION EXCELLENCE: Complete, executable code with defensive error boundaries, fluid responsiveness, and high-performance WebGL.
3. DESIGN RIGOR: Dark-mode luxury palette, silky smooth micro-interactions, and accessible typography.
Begin generation immediately with full implementation:`;

  console.log(compiled);
}

testPrompt();
