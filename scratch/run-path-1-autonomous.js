// scratch/run-path-1-autonomous.js
const desktopAutomator = require('../desktop-automator');

async function executePath1() {
  console.log('🚀 [Path 1] UNIN Autonomous Skill-Creator Registration Engine Starting...');

  // 1. Activate Chrome / Claude window
  console.log('Step 1: Focusing Chrome window...');
  await desktopAutomator.activateWindow('chrome');
  await new Promise(r => setTimeout(r, 800));

  // 2. Resolve Screen Dimensions
  const psScript = `
    Add-Type -AssemblyName System.Windows.Forms
    $w = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width
    $h = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height
    Write-Output "$w,$h"
  `;
  const screenRes = await desktopAutomator.runPowerShell(psScript);
  let screenW = 1280, screenH = 800;
  if (screenRes.stdout) {
    const parts = screenRes.stdout.trim().split(',');
    screenW = parseInt(parts[0], 10) || 1280;
    screenH = parseInt(parts[1], 10) || 800;
  }

  // 3. Construct Complete Production Skill-Creator Directive
  const fullSkillDirective = `Read your skill-creator skill now and use it to create and register a permanent custom skill named "unin-meta-architect".

Here is the exact Skill definition to generate:

---
name: unin-meta-architect
description: SOTA FAANG-Grade 3D Web Architect and Creative Developer. Activated for all luxury 3D portfolios, procedural Three.js graphics, raymarching/SDF shaders, dynamic camera flythroughs, holographic card tilts, and OKLCH UI.
---

# UNIN SOTA 2026 Meta-Architect Playbook

## 1. PROCEDURAL 3D & GLSL SHADERS (Rank #1)
- Never load heavy 50MB GLTF models when procedural shaders can render at 0MB.
- Use Signed Distance Functions (SDF) in Three.js ShaderMaterial or raw WebGL.
- Normal reconstruction via tetrahedron:
  vec3 calcNormal(vec3 p) {
    const float h = 0.0005;
    const vec2 k = vec2(1, -1);
    return normalize(k.xyy*map(p + k.xyy*h) + k.yyx*map(p + k.yyx*h) + k.yxy*map(p + k.yxy*h) + k.xxx*map(p + k.xxx*h));
  }
- Rim lighting & ambient occlusion: pow(1.0 - max(dot(normal, -rayDir), 0.0), 3.0).

## 2. CINEMATIC CAMERA FLYTHROUGH (Rank #2)
- Build Apple-style product reveal flythroughs:
  1. Construct a THREE.CatmullRomCurve3 path with control points around the 3D model.
  2. Sample camera position at curve.getPointAt(scrollProgress) and camera.lookAt(target).
  3. Smooth out camera movement with damping (camera.position.lerp) to avoid jarring scroll jumps.

## 3. 3D CARD TILT & HOLOGRAPHIC SHEEN (Rank #3)
- Calculate mouse offset relative to card center (-0.5 to 0.5).
- Apply CSS transform: perspective(1000px) rotateY(...) rotateX(...).
- Overlay an absolute glare layer with background: radial-gradient(...) following the exact mouse position.

## 4. LUXURY OKLCH DESIGN TOKENS
- Background: oklch(0.12 0.02 260) — Deep luxury obsidian slate
- Card Surface: oklch(0.18 0.03 260 / 0.6) with backdrop-blur-xl
- Accent: oklch(0.75 0.18 160) — Electric Mint Glow / Champagne
- Text: oklch(0.98 0.01 260) — Crisp stark white

Execute skill-creator now, compile these files, and confirm when "unin-meta-architect" is registered in your available skills.`;

  // 4. Target active chat input bar at bottom center
  const clickX = Math.round(screenW * 0.50);
  const clickY = Math.round(screenH * 0.93);

  console.log(`Step 2: Clicking input box at [${clickX}, ${clickY}]...`);
  desktopAutomator.safeWriteClipboard(fullSkillDirective);
  await desktopAutomator.mouseClickAt(clickX, clickY);
  await new Promise(r => setTimeout(r, 400));

  console.log('Step 3: Pasting full skill specification...');
  await desktopAutomator.sendKeys('^v');
  await new Promise(r => setTimeout(r, 500));

  console.log('Step 4: Submitting via Enter...');
  await desktopAutomator.sendKeys('{ENTER}');

  console.log('🎉 [Path 1] Success! Autonomous Skill-Creator instruction dispatched to Claude.');
}

executePath1().catch(err => {
  console.error('❌ Error executing Path 1:', err);
  process.exit(1);
});
