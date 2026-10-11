// scratch/build-50-skills-package.js
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

function buildFull50SkillsPackage() {
  console.log('📦 Building Complete 50-Skills Anthropic Package & MCP Matrix...');

  const outputDir = path.join(process.cwd(), 'output');
  const skillSuiteDir = path.join(outputDir, 'unin-skill-suite');
  const referencesDir = path.join(skillSuiteDir, 'references');
  const zipPath = path.join(outputDir, 'unin-skills.zip');

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  if (!fs.existsSync(skillSuiteDir)) fs.mkdirSync(skillSuiteDir, { recursive: true });
  if (!fs.existsSync(referencesDir)) fs.mkdirSync(referencesDir, { recursive: true });

  // Load 50 skills from ~/.venar/registry.json
  const regPath = path.join(os.homedir(), '.venar', 'registry.json');
  if (!fs.existsSync(regPath)) {
    throw new Error('~/.venar/registry.json not found!');
  }

  const reg = JSON.parse(fs.readFileSync(regPath, 'utf8'));
  const skills = reg.skills || [];
  console.log(`Loaded ${skills.length} skills from VENAR registry.`);

  // 1. Generate individual reference files for each of the 50 skills
  const skillIndexEntries = [];
  const allSkillsMarkdown = [];

  skills.forEach((s, idx) => {
    const rankNum = s.rank || (idx + 1);
    const safeSlug = s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const fileName = `skill-${String(rankNum).padStart(2, '0')}-${safeSlug}.md`;
    const filePath = path.join(referencesDir, fileName);

    const skillContent = `# [RANK #${rankNum}] ${s.name.toUpperCase()}
- **Category**: ${s.category || 'General Engineering'}
- **Creator**: ${s.creator || 'VENAR Frontier Core'}
- **Summary**: ${s.desc || ''}

## TECHNICAL DIRECTIVES & IMPLEMENTATION RULES:
${s.prompt || s.desc || 'Implement production-grade standard without shortcuts.'}
`;

    fs.writeFileSync(filePath, skillContent, 'utf8');

    skillIndexEntries.push(`| #${rankNum} | **${s.name}** | \`${s.category}\` | ${s.desc} | [\`${fileName}\`](references/${fileName}) |`);
    allSkillsMarkdown.push(skillContent);
  });

  // 2. Generate Combined 50-Skills Master Matrix
  const combinedPath = path.join(referencesDir, 'venar-50-skills-matrix.md');
  fs.writeFileSync(combinedPath, `# VENAR COMPLETE 50-SKILLS MASTER MATRIX\n\n` + allSkillsMarkdown.join('\n\n---\n\n'), 'utf8');

  // 3. Generate standard reference docs
  const fluidTypo = `# Fluid Typography & Responsive Math
1. Formula: clamp(MIN_REM, PREFERRED_VW, MAX_REM)
2. Display Heading: clamp(2.5rem, 5vw + 1rem, 5rem);
3. Subheading: clamp(1.25rem, 2.5vw + 0.5rem, 2rem);
4. Body text: clamp(1rem, 1vw + 0.5rem, 1.125rem);
5. Line-height: clamp(1.1, 1.2, 1.3) for headings; 1.6 for body text.
`;
  const oklchPalettes = `# Luxury OKLCH Color Palettes
1. Background: oklch(0.12 0.02 260) — Deep luxury obsidian slate
2. Surface Card: oklch(0.18 0.03 260 / 0.6) with backdrop-blur-xl
3. Accent Primary: oklch(0.75 0.18 160) — Electric Emerald / Mint Glow
4. Accent Secondary: oklch(0.7 0.22 280) — Cyber Violet Iris
5. Text Primary: oklch(0.98 0.01 260) — Pure stark white
6. Border: oklch(1 0 0 / 0.1) — Crisp 1px glassmorphic hair-line
`;
  const proceduralShaders = `# Procedural 3D & WebGL Raymarching
1. Never load 50MB external GLTF models when procedural shaders can render at 0MB.
2. Signed Distance Functions (SDF):
   float sdSphere(vec3 p, float s) { return length(p) - s; }
   float sdBox(vec3 p, vec3 b) { vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0); }
   float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0); return mix(b, a, h) - k*h*(1.0-h); }
3. Normal Reconstruction via Tetrahedron:
   vec3 calcNormal(vec3 p) {
     const float h = 0.0005;
     const vec2 k = vec2(1, -1);
     return normalize(k.xyy*map(p + k.xyy*h) + k.yyx*map(p + k.yyx*h) + k.yxy*map(p + k.yxy*h) + k.xxx*map(p + k.xxx*h));
   }
4. Rim Lighting & Ambient Occlusion: pow(1.0 - max(dot(normal, -rayDir), 0.0), 3.0)
`;
  const antiPatterns = `# Anti-Patterns & Critical Pitfalls
1. NEVER use generic primary blue (#007bff) or harsh pure black (#000000).
2. NEVER leave missing image placeholders. Use procedural SVG or WebGL canvases.
3. NEVER block the UI thread with synchronous calculations.
4. NEVER omit mobile responsiveness; always build mobile-first with CSS Grid.
`;

  fs.writeFileSync(path.join(referencesDir, 'fluid-typography.md'), fluidTypo, 'utf8');
  fs.writeFileSync(path.join(referencesDir, 'oklch-palettes.md'), oklchPalettes, 'utf8');
  fs.writeFileSync(path.join(referencesDir, 'procedural-shaders.md'), proceduralShaders, 'utf8');
  fs.writeFileSync(path.join(referencesDir, 'anti-patterns.md'), antiPatterns, 'utf8');

  // 4. Generate Master SKILL.md
  const skillMdContent = `---
name: unin-meta-architect
description: SOTA 2026 FAANG-Grade Web & 3D Meta-Architect. Powered by the complete VENAR 50-Skills Matrix (Raymarching, SDF, Three.js Particles, Awwwards Spatial UI, WebGPU, OKLCH Luxury Palettes, Fluid Typography, Dynamic Physics). Connects natively to the UNIN Remote MCP Connector to fetch live specifications and submit operational code artifacts.
---
# UNIN SOTA 2026 META-ARCHITECT PLAYBOOK (COMPLETE 50-SKILLS MATRIX)

You are operating as a Principal FAANG Systems Architect orchestrated by UNIN.
You have direct access to the world-class VENAR 50-Skills Matrix across 3D Graphics, Physics, Design Systems, Audio, and Performance.

## 1. DYNAMIC SKILL & SPECIFICATION ACQUISITION
Before generating code, ALWAYS call the UNIN Connector tools:
1. \`get_task_spec()\`: Fetches exact user intent, target aesthetic tokens, and live requirements.
2. \`get_dynamic_skill({ domain: "..." })\` or \`get_venar_skill({ rankOrName: "..." })\`: Retrieves uncompressed mathematical formulas and directives for any of the 50 skills.

## 2. ARTIFACT SUBMISSION (Zero Chat Dropping)
Do NOT dump code directly into the chat stream as raw unformatted text.
When your code is ready, package all files (HTML, CSS, JS, Three.js shaders, etc.) and call the UNIN tool:
\`submit_artifact({ files: [{ path: "index.html", content: "..." }, { path: "style.css", content: "..." }] })\`

UNIN will immediately receive your files on the host machine, run automated syntax verification, start the local live preview, and launch the site at \`http://localhost:5173\`.

## 3. VENAR 50-SKILLS MATRIX REGISTRY

| Rank | Skill Name | Category | Description | Reference |
| :--- | :--- | :--- | :--- | :--- |
${skillIndexEntries.join('\n')}

## 4. CORE REFERENCES
- Complete 50-Skills Matrix: \`references/venar-50-skills-matrix.md\`
- Fluid Typography & Scales: \`references/fluid-typography.md\`
- OKLCH Luxury Palettes: \`references/oklch-palettes.md\`
- Procedural 3D & WebGL Shaders: \`references/procedural-shaders.md\`
- Anti-Patterns & Critical Pitfalls: \`references/anti-patterns.md\`

Skill Version: unin-design@2.5.0 (Full 50-Skills Matrix)
`;

  fs.writeFileSync(path.join(skillSuiteDir, 'SKILL.md'), skillMdContent, 'utf8');

  // 5. Compress into output/unin-skills.zip
  console.log('Compressing into output/unin-skills.zip via PowerShell Compress-Archive...');
  execSync(`powershell.exe -NoProfile -Command "Compress-Archive -Path '${skillSuiteDir}\\*' -DestinationPath '${zipPath}' -Force"`);

  const stats = fs.statSync(zipPath);
  console.log(`✅ Success! Created ${zipPath} (${Math.round(stats.size / 1024)} KB) with all 50 skills!`);

  return {
    success: true,
    skillCount: skills.length,
    zipPath,
    zipSizeKb: Math.round(stats.size / 1024)
  };
}

const result = buildFull50SkillsPackage();
console.log(JSON.stringify(result, null, 2));
