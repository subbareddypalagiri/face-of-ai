// scratch/verify-all-3-pillars-max-mode.js
'use strict';

const fs = require('fs');
const path = require('path');
const { blenderTD } = require('../unin-blender-td');
const { whatsappGateway } = require('../unin-whatsapp-gateway');

async function verifyAll() {
  console.log('====================================================');
  console.log('   UNIN MAX MODE 3-PILLARS RIGOROUS AUDIT & VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // PILLAR 1: BLENDER TECHNICAL DIRECTOR & PRO UI
  // ----------------------------------------------------
  console.log('--- PILLAR 1: Blender 3D Creative Studio (Technical Director) ---');
  
  // Test 1.1: Dynamic Inquirer on multiple diverse prompts
  const inquiryCyber = await blenderTD.generateDirectorInquiry('Rainy Tokyo cyberpunk alley with neon ramen shop');
  assert(inquiryCyber && inquiryCyber.detectedGenre === 'Cyberpunk / Neo-Tokyo', 'Cyberpunk genre detected accurately');
  assert(inquiryCyber.directorQuestions.length === 4, 'Cyberpunk returns 4 structured questions (1 Asset + 3 Cinematography)');
  assert(inquiryCyber.directorQuestions[0].type === 'filepath_or_procedural', 'Q1 is local asset discovery with file browse hook');
  assert(inquiryCyber.directorQuestions[1].question.includes('Rainy Tokyo'), 'Q2 incorporates prompt noun ("Rainy Tokyo")');

  const inquiryCar = await blenderTD.generateDirectorInquiry('Porsche 911 GT3 RS on wet Nurburgring racing track');
  assert(inquiryCar && inquiryCar.detectedGenre === 'Automotive / Supercar', 'Automotive genre detected accurately');
  assert(inquiryCar.directorQuestions[1].question.includes('Porsche 911'), 'Automotive Q2 incorporates prompt subject ("Porsche 911")');

  const inquiryNature = await blenderTD.generateDirectorInquiry('Deep Amazon rainforest with flowing misty waterfall');
  assert(inquiryNature && inquiryNature.detectedGenre === 'Nature & Ecosystem', 'Nature genre detected accurately');

  // Test 1.2: Native file picker IPC wiring
  const electronMain = fs.readFileSync(path.join(__dirname, '../electron-main.js'), 'utf8');
  assert(electronMain.includes("ipcMain.handle('blender-td-pick-file'"), 'electron-main.js implements blender-td-pick-file with dialog.showOpenDialog');
  assert(electronMain.includes("dialog"), 'electron-main.js imports dialog from electron');

  const preloadJs = fs.readFileSync(path.join(__dirname, '../preload.js'), 'utf8');
  assert(preloadJs.includes("blenderTDPickFile") && preloadJs.includes("'blender-td-pick-file'"), 'preload.js exposes blenderTDPickFile to renderer');

  // Test 1.3: Pro UI Architect styling in unin-companion.css
  const companionCss = fs.readFileSync(path.join(__dirname, '../src/renderer/styles/unin-companion.css'), 'utf8');
  assert(companionCss.includes('#blenderDirectorCard'), 'unin-companion.css styles #blenderDirectorCard with glassmorphism');
  assert(companionCss.includes('#btnDirectorBuildScene'), 'unin-companion.css styles #btnDirectorBuildScene with high-contrast gradient & text-shadow');
  assert(companionCss.includes('.dir-opt-pill'), 'unin-companion.css styles .dir-opt-pill and .dir-opt-pill.active');
  assert(companionCss.includes('#btnBrowseLocalAsset'), 'unin-companion.css styles #btnBrowseLocalAsset button');
  assert(companionCss.includes('backdrop-filter: blur(40px)'), 'unin-companion.css applies 40px glassmorphism blur');

  // Test 1.4: desktop-companion.html Director Card wiring
  const companionHtml = fs.readFileSync(path.join(__dirname, '../desktop-companion.html'), 'utf8');
  assert(companionHtml.includes('btnBrowseLocalAsset'), 'desktop-companion.html includes Native Browse button');
  assert(companionHtml.includes('dirAssetInspectBadge'), 'desktop-companion.html includes live asset inspection badge');
  assert(companionHtml.includes('blenderTDPickFile'), 'desktop-companion.html invokes blenderTDPickFile on click');
  assert(companionHtml.includes('blenderTDInspectAsset'), 'desktop-companion.html inspects chosen asset via blenderTDInspectAsset');

  // ----------------------------------------------------
  // PILLAR 2: 3D AVATAR & MOTION STUDIO
  // ----------------------------------------------------
  console.log('\n--- PILLAR 2: 3D Avatar & Universal Motion Engine ---');
  
  // Test 2.1: Avatar GLBs exist
  assert(fs.existsSync(path.join(__dirname, '../brunette-t.glb')), 'Strict T-Pose Master (brunette-t.glb) exists');
  assert(fs.existsSync(path.join(__dirname, '../brunette.glb')), 'Brunette Host (brunette.glb) exists');
  assert(fs.existsSync(path.join(__dirname, '../hero.glb')), 'Hero Suit Agent (hero.glb) exists');
  assert(fs.existsSync(path.join(__dirname, '../avatar5.glb')), 'Astra Heroine (avatar5.glb) exists');

  // Test 2.2: Mixamo FBX motion packs exist
  assert(fs.existsSync(path.join(__dirname, '../Breakdance Pack/breakdance 1990.fbx')), 'Breakdance Pack/breakdance 1990.fbx exists');
  assert(fs.existsSync(path.join(__dirname, '../Locomotion Pack/walking.fbx')), 'Locomotion Pack/walking.fbx exists');
  assert(fs.existsSync(path.join(__dirname, '../Moonwalk.fbx')), 'Moonwalk.fbx exists');
  assert(fs.existsSync(path.join(__dirname, '../Stylish Flip.fbx')), 'Stylish Flip.fbx exists');

  // Test 2.3: AvatarEngine encodeURI and T-pose retarget profile
  const avatarEngineJs = fs.readFileSync(path.join(__dirname, '../src/renderer/avatar/AvatarEngine.js'), 'utf8');
  assert(avatarEngineJs.includes("encodeURI(mapped.file)"), 'AvatarEngine uses encodeURI to fetch animation files with spaces');
  assert(avatarEngineJs.includes("'brunette-t.glb'"), 'AvatarEngine includes brunette-t.glb retarget profile');
  assert(avatarEngineJs.includes("scaleToHipsLevel: 1.037"), 'AvatarEngine locks hip height to 1.037 ground baseline');

  // Test 2.4: Motion buttons in UI dock
  assert(companionHtml.includes("label: 'Breakdance 🕺'"), 'Dock includes Breakdance button');
  assert(companionHtml.includes("label: 'Moonwalk 🕺'"), 'Dock includes Moonwalk button');
  assert(companionHtml.includes("label: 'Flip 🤸'"), 'Dock includes Flip button');
  assert(companionHtml.includes("label: 'Walk 🚶'"), 'Dock includes Walk button');

  // ----------------------------------------------------
  // PILLAR 3: WHATSAPP AUTONOMOUS GATEWAY (MAX MODE)
  // ----------------------------------------------------
  console.log('\n--- PILLAR 3: WhatsApp Autonomous Gateway (Max Mode) ---');

  // Test 3.1: Gateway headless session & overlay dismissal
  const waGatewayJs = fs.readFileSync(path.join(__dirname, '../unin-whatsapp-gateway.js'), 'utf8');
  assert(waGatewayJs.includes('_dismissOverlays'), 'unin-whatsapp-gateway.js includes _dismissOverlays to clear modal backdrops');
  assert(waGatewayJs.includes('unin_whatsapp_session'), 'unin-whatsapp-gateway.js uses persistent session folder');
  assert(waGatewayJs.includes('span[title="${cleanInput}" i]'), 'unin-whatsapp-gateway.js checks recent chats directly');

  // Test 3.2: Universal Stream Orchestrator intent extraction
  const orchestratorJs = fs.readFileSync(path.join(__dirname, '../src/main/tools/universalStreamOrchestrator.js'), 'utf8');
  assert(orchestratorJs.includes('quoteMatch'), 'universalStreamOrchestrator extracts quoted messages');
  assert(orchestratorJs.includes('teluguMatch'), 'universalStreamOrchestrator extracts Telugu patterns ("Nikki ki whatsapp message...")');
  assert(orchestratorJs.includes('toMatch'), 'universalStreamOrchestrator extracts English ("to Nikki")');

  // Test 3.3: Zero Screen Hijacking in desktopAutomator
  const automatorJs = fs.readFileSync(path.join(__dirname, '../desktop-automator.js'), 'utf8');
  assert(automatorJs.includes('whatsapp_gateway_headless'), 'desktop-automator routes through whatsappGateway headless');
  assert(automatorJs.includes('!options.forceDesktopApp'), 'desktop-automator guards against popping desktop app');

  // Test 3.4: WhatsApp button in dock next to Blender
  assert(companionHtml.includes('btnWhatsAppModal'), 'desktop-companion.html has btnWhatsAppModal');
  assert(companionHtml.includes('btnBlenderStudio'), 'desktop-companion.html has btnBlenderStudio');
  assert(companionHtml.includes('whatsAppModal'), 'desktop-companion.html has whatsAppModal with QR code & status view');

  console.log('\n====================================================');
  console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

verifyAll().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
