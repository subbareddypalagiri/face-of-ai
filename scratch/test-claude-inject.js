// scratch/test-claude-inject.js
const desktopAutomator = require('../desktop-automator');

async function testInject() {
  console.log('Activating Chrome / Claude...');
  await desktopAutomator.activateWindow('chrome');
  await new Promise(r => setTimeout(r, 600));

  const directive = `Use your skill-creator skill to create and register a new persistent skill named "unin-meta-architect".

Skill Specification:
- Name: unin-meta-architect
- Description: SOTA FAANG-tier 3D Web Architect and Creative Developer. Activated for all luxury 3D portfolios, procedural Three.js graphics, raymarching/SDF shaders, and premium UI.
- Guidelines:
  1. Procedural GLSL Raymarching & Signed Distance Functions (SDF) in Three.js ShaderMaterial.
  2. Cinematic Camera Flythrough: THREE.CatmullRomCurve3 with smooth lerp damping along scroll.
  3. Holographic 3D Card Tilt with dynamic specular glare following mouse offset.
  4. OKLCH Luxury Palettes: Deep obsidian slate (oklch(0.12 0.02 260)), champagne/mint glow accents, zero generic AI color palettes.
  5. Production Rigor: Zero placeholders, complete standalone implementations, responsive layouts, 60fps performance budget.

Please run skill-creator now and confirm when unin-meta-architect is saved and available in your environment.`;

  console.log('Injecting directive into Claude active chat...');
  // In an active conversation, input is at bottom (~92% of screen height)
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

  // Click active chat input bar at bottom center
  const clickX = Math.round(screenW * 0.50);
  const clickY = Math.round(screenH * 0.93);

  console.log(`Clicking input box at [${clickX}, ${clickY}]...`);
  desktopAutomator.safeWriteClipboard(directive);
  await desktopAutomator.mouseClickAt(clickX, clickY);
  await new Promise(r => setTimeout(r, 300));
  await desktopAutomator.sendKeys('^v');
  await new Promise(r => setTimeout(r, 400));
  await desktopAutomator.sendKeys('{ENTER}');

  console.log('✅ Injected skill-creator command into Claude!');
}

testInject().catch(console.error);
