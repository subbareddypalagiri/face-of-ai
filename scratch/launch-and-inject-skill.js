// scratch/launch-and-inject-skill.js
const { execSync } = require('child_process');
const desktopAutomator = require('../desktop-automator');

async function launchAndInject() {
  console.log('🌐 Step 1: Launching Claude.ai directly in foreground browser...');
  // Launch / bring Claude to front via Windows shell
  desktopAutomator.runPowerShell(`Start-Process 'https://claude.ai/new'`);
  
  // Wait for Chrome window to render and mount
  console.log('⏳ Waiting 3.5s for Claude.ai to mount in foreground...');
  await new Promise(r => setTimeout(r, 3500));

  // Directive to register unin-meta-architect via skill-creator
  const directive = `Read your skill-creator skill now and use it to create and register a permanent custom skill named "unin-meta-architect".

Here is the exact Skill definition:

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

  console.log('📋 Copying skill directive to clipboard...');
  desktopAutomator.safeWriteClipboard(directive);

  console.log('🎯 Grounding and clicking input textarea...');
  // In https://claude.ai/new, prompt box is centered vertically (~52%) or bottom (~85%)
  // We click center-bottom, paste, and submit
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

  // Click prompt box (Y = 0.52 for new chat, or 0.88 for active)
  const clickX = Math.round(screenW * 0.50);
  const clickY = Math.round(screenH * 0.52);

  await desktopAutomator.mouseClickAt(clickX, clickY);
  await new Promise(r => setTimeout(r, 400));
  await desktopAutomator.sendKeys('^v');
  await new Promise(r => setTimeout(r, 500));
  await desktopAutomator.sendKeys('{ENTER}');

  console.log('✅ Injected and submitted skill-creator directive to Claude.ai/new!');
}

launchAndInject().catch(console.error);
