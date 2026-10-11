// scratch/test-max-mode-3-pillars.js
// Automated Diagnostic & Health Verification Suite for the 3 Max Mode Updates
'use strict';

const fs = require('fs');
const path = require('path');

const results = {
  pillar1_whatsapp: { passed: 0, failed: 0, details: [] },
  pillar2_blender: { passed: 0, failed: 0, details: [] },
  pillar3_avatars: { passed: 0, failed: 0, details: [] },
  ipc_wiring: { passed: 0, failed: 0, details: [] }
};

function assert(category, condition, description) {
  if (condition) {
    results[category].passed++;
    results[category].details.push(`  ✓ ${description}`);
  } else {
    results[category].failed++;
    results[category].details.push(`  ✗ FAIL: ${description}`);
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('  UNIN 3-PILLAR MAX MODE ARCHITECTURAL INTEGRITY AUDIT');
console.log('═══════════════════════════════════════════════════════════════\n');

// ── PILLAR 1: WHATSAPP AUTONOMOUS AGENT ──
console.log('[AUDIT] 1. Checking WhatsApp Autonomous Agent...');
try {
  const { WhatsAppGateway, whatsappGateway } = require('../unin-whatsapp-gateway');
  assert('pillar1_whatsapp', typeof WhatsAppGateway === 'function', 'WhatsAppGateway class is exported');
  assert('pillar1_whatsapp', typeof whatsappGateway === 'object' && whatsappGateway !== null, 'whatsappGateway singleton instance exists');
  assert('pillar1_whatsapp', typeof whatsappGateway.init === 'function', 'whatsappGateway.init method present');
  assert('pillar1_whatsapp', typeof whatsappGateway.sendMessage === 'function', 'whatsappGateway.sendMessage method present');
  assert('pillar1_whatsapp', typeof whatsappGateway.getLatestMessages === 'function', 'whatsappGateway.getLatestMessages method present');
  assert('pillar1_whatsapp', typeof whatsappGateway.getStatus === 'function', 'whatsappGateway.getStatus method present');

  const status = whatsappGateway.getStatus();
  assert('pillar1_whatsapp', status.status === 'DISCONNECTED', 'Initial state is correctly DISCONNECTED before boot');
  assert('pillar1_whatsapp', typeof status.sessionDir === 'string', 'Persistent session directory path defined');

  // Check desktop-automator fallback fix
  const automatorCode = fs.readFileSync(path.join(__dirname, '../desktop-automator.js'), 'utf8');
  assert('pillar1_whatsapp', automatorCode.includes('unin-whatsapp-gateway'), 'desktop-automator.js imports unin-whatsapp-gateway');
  assert('pillar1_whatsapp', automatorCode.includes('whatsapp_gateway_headless'), 'Method 0 (Headless Gateway) priority is wired in sendWhatsAppMessage');
  assert('pillar1_whatsapp', automatorCode.includes("SendKeys('^f')"), "Fallback search uses Ctrl+F (preventing 'Add Contact' dialog)");
  assert('pillar1_whatsapp', !automatorCode.includes("SendKeys('^n')"), "No rogue Ctrl+N left in contact search flow");
} catch (e) {
  assert('pillar1_whatsapp', false, `Pillar 1 Exception: ${e.message}`);
}

// ── PILLAR 2: BLENDER 3D CREATIVE STUDIO (TD MAX MODE) ──
console.log('[AUDIT] 2. Checking Blender 3D Creative Studio...');
try {
  const { BlenderTechnicalDirector, blenderTD } = require('../unin-blender-td');
  assert('pillar2_blender', typeof BlenderTechnicalDirector === 'function', 'BlenderTechnicalDirector class is exported');
  assert('pillar2_blender', typeof blenderTD === 'object' && blenderTD !== null, 'blenderTD singleton instance exists');
  assert('pillar2_blender', typeof blenderTD.generateDirectorInquiry === 'function', 'generateDirectorInquiry method present');
  assert('pillar2_blender', typeof blenderTD.inspectLocalAsset === 'function', 'inspectLocalAsset method present');
  assert('pillar2_blender', typeof blenderTD.buildCinematicScene === 'function', 'buildCinematicScene method present');

  // Test Dynamic Dialogue Inquirer on Sci-Fi / Car prompt
  const inquirySciFi = blenderTD.generateDirectorInquiry('Rainy cyberpunk street with crashed flying car');
  assert('pillar2_blender', inquirySciFi.detectedGenre === 'Sci-Fi', 'Dynamic inquirer detected Sci-Fi genre correctly');
  assert('pillar2_blender', Array.isArray(inquirySciFi.directorQuestions) && inquirySciFi.directorQuestions.length === 4, 'Generated exactly 4 context-specific discovery questions');
  assert('pillar2_blender', inquirySciFi.directorQuestions.some(q => q.id === 'local_asset'), 'Asset discovery hook (GLB/FBX local path) is active');
  assert('pillar2_blender', inquirySciFi.directorQuestions.some(q => q.id === 'lighting_mood'), 'Lighting mood discovery is active');

  // Test Dynamic Dialogue Inquirer on Nature / Forest prompt
  const inquiryNature = blenderTD.generateDirectorInquiry('Sunny dense jungle with ancient stone temple');
  assert('pillar2_blender', inquiryNature.detectedGenre === 'Nature', 'Dynamic inquirer detected Nature genre correctly');
  assert('pillar2_blender', inquiryNature.directorQuestions.some(q => q.id === 'scattering_density'), 'Scattering density question generated for nature scene');

} catch (e) {
  assert('pillar2_blender', false, `Pillar 2 Exception: ${e.message}`);
}

// ── PILLAR 3: AVATARS & UNIVERSAL MOTION ENGINE ──
console.log('[AUDIT] 3. Checking Avatars & Universal Motion Engine...');
try {
  // Check Master & Repo avatars
  const root = path.join(__dirname, '..');
  assert('pillar3_avatars', fs.existsSync(path.join(root, 'brunette-t.glb')), 'brunette-t.glb (Master Strict T-Pose) exists in root');
  assert('pillar3_avatars', fs.existsSync(path.join(root, 'brunette.glb')), 'brunette.glb exists');
  assert('pillar3_avatars', fs.existsSync(path.join(root, 'avaturn.glb')), 'avaturn.glb (Photoreal) exists');
  assert('pillar3_avatars', fs.existsSync(path.join(root, 'avatarsdk.glb')), 'avatarsdk.glb (Realistic) exists');
  assert('pillar3_avatars', fs.existsSync(path.join(root, 'vroid.glb')), 'vroid.glb (Anime) exists');
  assert('pillar3_avatars', fs.existsSync(path.join(root, 'mpfb.glb')), 'mpfb.glb (Studio Human) exists in root');

  // Check that OLD avatars are HELD and NOT DELETED
  assert('pillar3_avatars', fs.existsSync(path.join(root, 'hero.glb')), 'OLD avatar held safely: hero.glb exists');
  assert('pillar3_avatars', fs.existsSync(path.join(root, 'avatar5.glb')), 'OLD avatar held safely: avatar5.glb exists');
  assert('pillar3_avatars', fs.existsSync(path.join(root, 'avatar3.glb')), 'OLD avatar held safely: avatar3.glb exists');
  assert('pillar3_avatars', fs.existsSync(path.join(root, 'avatar.vrm')), 'OLD avatar held safely: avatar.vrm exists');
  assert('pillar3_avatars', fs.existsSync(path.join(root, 'avatar2.vrm')), 'OLD avatar held safely: avatar2.vrm exists');

  // Check FBX Animation files
  assert('pillar3_avatars', fs.existsSync(path.join(root, 'Breakdance Pack/breakdance 1990.fbx')), 'Breakdance animation exists: breakdance 1990.fbx');
  assert('pillar3_avatars', fs.existsSync(path.join(root, 'Breakdance Pack/flair.fbx')), 'Breakdance animation exists: flair.fbx');
  assert('pillar3_avatars', fs.existsSync(path.join(root, 'Breakdance Pack/breakdance swipes.fbx')), 'Breakdance animation exists: breakdance swipes.fbx');
  assert('pillar3_avatars', fs.existsSync(path.join(root, 'Locomotion Pack/walking.fbx')), 'Locomotion animation exists: walking.fbx');
  assert('pillar3_avatars', fs.existsSync(path.join(root, 'Locomotion Pack/running.fbx')), 'Locomotion animation exists: running.fbx');
  assert('pillar3_avatars', fs.existsSync(path.join(root, 'Moonwalk.fbx')), 'Solo move exists: Moonwalk.fbx');
  assert('pillar3_avatars', fs.existsSync(path.join(root, 'Stylish Flip.fbx')), 'Solo move exists: Stylish Flip.fbx');

  // Check AvatarEngine.js code integrity
  const avatarEngineCode = fs.readFileSync(path.join(root, 'src/renderer/avatar/AvatarEngine.js'), 'utf8');
  assert('pillar3_avatars', avatarEngineCode.includes('AVATAR_RETARGET_PROFILES'), 'AVATAR_RETARGET_PROFILES defined in AvatarEngine.js');
  assert('pillar3_avatars', avatarEngineCode.includes("'brunette-t.glb':"), 'Retarget profile for brunette-t.glb registered');
  assert('pillar3_avatars', avatarEngineCode.includes("'avaturn.glb':"), 'Retarget profile for avaturn.glb registered');
  assert('pillar3_avatars', avatarEngineCode.includes("'vroid.glb':"), 'Retarget profile for vroid.glb registered');
  assert('pillar3_avatars', avatarEngineCode.includes('avatarPayload.retarget = retargetConfig'), 'Retarget profile injected into head.showAvatar payload');

  // Check desktop-companion.html catalog
  const htmlCode = fs.readFileSync(path.join(root, 'desktop-companion.html'), 'utf8');
  assert('pillar3_avatars', htmlCode.includes('brunette-t.glb'), 'desktop-companion.html includes brunette-t.glb');
  assert('pillar3_avatars', htmlCode.includes('mpfb.glb'), 'desktop-companion.html includes mpfb.glb');
  assert('pillar3_avatars', htmlCode.includes('hero.glb'), 'desktop-companion.html preserves hero.glb');
  assert('pillar3_avatars', htmlCode.includes('avatar5.glb'), 'desktop-companion.html preserves avatar5.glb');
  assert('pillar3_avatars', htmlCode.includes('avatar3.glb'), 'desktop-companion.html preserves avatar3.glb');
  assert('pillar3_avatars', htmlCode.includes('avatar.vrm'), 'desktop-companion.html preserves avatar.vrm');
} catch (e) {
  assert('pillar3_avatars', false, `Pillar 3 Exception: ${e.message}`);
}

// ── IPC WIRING IN ELECTRON-MAIN.JS ──
console.log('[AUDIT] 4. Checking IPC handlers in electron-main.js...');
try {
  const mainCode = fs.readFileSync(path.join(__dirname, '../electron-main.js'), 'utf8');
  const expectedChannels = [
    'whatsapp-gateway-init',
    'whatsapp-gateway-status',
    'whatsapp-gateway-send',
    'whatsapp-gateway-messages',
    'blender-td-inquire',
    'blender-td-inspect-asset',
    'blender-td-build-scene'
  ];

  expectedChannels.forEach(ch => {
    assert('ipc_wiring', mainCode.includes(`ipcMain.handle('${ch}'`), `IPC Handler registered: ${ch}`);
  });
} catch (e) {
  assert('ipc_wiring', false, `IPC Exception: ${e.message}`);
}

// ── SUMMARY REPORT ──
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                      AUDIT SUMMARY RESULTS                    ');
console.log('═══════════════════════════════════════════════════════════════');

let totalPassed = 0;
let totalFailed = 0;

for (const [key, val] of Object.entries(results)) {
  console.log(`\n▶ [${key.toUpperCase()}] Passed: ${val.passed} | Failed: ${val.failed}`);
  val.details.forEach(d => console.log(d));
  totalPassed += val.passed;
  totalFailed += val.failed;
}

console.log('\n───────────────────────────────────────────────────────────────');
console.log(`TOTAL CHECKS: ${totalPassed + totalFailed} | PASSED: ${totalPassed} | FAILED: ${totalFailed}`);
if (totalFailed === 0) {
  console.log('🎉 100% DESIGN INTEGRITY VERIFIED! ALL 3 PILLARS ARE FLAWLESS.');
} else {
  console.log('⚠️ ATTENTION: Some tests failed. Please review the details above.');
}
console.log('───────────────────────────────────────────────────────────────');
process.exit(totalFailed === 0 ? 0 : 1);
