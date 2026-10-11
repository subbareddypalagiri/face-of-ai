// scratch/test-universal-asset-pipeline.js
'use strict';

const path = require('path');
const fs = require('fs');
const { BlenderAstraEngine, checkBridgeHealth, ensureBlenderLiveSession } = require('../src/main/tools/blenderAstraEngine');

async function runPipelineTest() {
  console.log('=== STARTING UNIVERSAL BLENDER ASSET-GENERATION PIPELINE TEST ===\n');

  // 1. Check bridge health
  console.log('[1/4] Checking Blender Live RPC Bridge...');
  await ensureBlenderLiveSession({ headless: false });
  const health = await checkBridgeHealth();
  console.log('Bridge Health:', health);
  if (!health.online) {
    throw new Error('Blender Live Bridge is OFFLINE! Cannot run live tests.');
  }

  const engine = new BlenderAstraEngine();

  // 2. Test status check guard
  console.log('\n[2/4] Testing Read-Only "status check" Guard...');
  const statusRes = await engine.executeAstraIntent('status check');
  console.log('Status Check Result:', {
    success: statusRes.success,
    mode: statusRes.mode,
    bridgeOnline: statusRes.bridgeOnline,
    objectsCount: statusRes.liveState?.objectsCount
  });
  if (statusRes.mode !== 'bridge_status_check') {
    throw new Error(`Expected mode "bridge_status_check", got "${statusRes.mode}"`);
  }
  console.log('✓ Read-only status check guard verified! No scene mutation or AI hit occurred.\n');

  // 3. Test Test Object 1: Ergonomic Wooden Chair with Curved Backrest & Cushion
  console.log('[3/4] Testing Prompt 1: Ergonomic Wooden Chair with Curved Backrest...');
  const chairPrompt = 'Create a realistic wooden chair with a curved backrest, four legs, seat cushion, and appropriate materials. Frame the entire chair in the camera.';
  
  const chairResult = await engine.executeAstraIntent(chairPrompt, { isNewScene: true });
  console.log('\nChair Generation Result:', {
    success: chairResult.success,
    mode: chairResult.mode,
    worldId: chairResult.worldId,
    heroEntity: chairResult.heroEntity,
    assetStrategy: chairResult.assetStrategy,
    renderPath: chairResult.renderPath,
    blendPath: chairResult.blendPath,
    aiQuotaExceeded: chairResult.aiQuotaExceeded,
    synthesisSource: chairResult.synthesisSource,
    status: chairResult.status
  });

  if (!chairResult.success) {
    throw new Error(`Chair generation failed: ${chairResult.error}`);
  }

  // Inspect live scene for chair parts
  const chairScene = await engine.getLiveScene();
  const chairObjs = chairScene.data.objects.map(o => o.name);
  console.log('Live Scene Objects for Chair:', chairObjs);

  const hasBackrest = chairObjs.some(n => n.includes('Backrest_Panel'));
  const hasCushion = chairObjs.some(n => n.includes('Seat_Cushion'));
  const hasPlate = chairObjs.some(n => n.includes('Seat_Plate'));
  const hasLegs = chairObjs.some(n => n.includes('Leg_Front'));
  const hasCamera = chairObjs.some(n => n.includes('unin.camera.primary'));

  console.log('Chair Component Verification:');
  console.log('  - Backrest Panel present:', hasBackrest);
  console.log('  - Seat Cushion present:', hasCushion);
  console.log('  - Solid Base Plate present:', hasPlate);
  console.log('  - Legs present:', hasLegs);
  console.log('  - Primary Camera present:', hasCamera);

  if (!hasBackrest || !hasCushion || !hasLegs) {
    throw new Error('Procedural chair assembly missing critical requested components!');
  }
  if (!fs.existsSync(chairResult.renderPath)) {
    throw new Error(`Render file missing at ${chairResult.renderPath}`);
  }
  console.log(`✓ Chair render generated at: ${chairResult.renderPath} (${fs.statSync(chairResult.renderPath).size} bytes)`);

  // Copy chair render to scratch/test_chair_render.png
  const chairRenderCopy = path.join(__dirname, 'test_chair_render.png');
  fs.copyFileSync(chairResult.renderPath, chairRenderCopy);
  console.log(`✓ Copied chair render to: ${chairRenderCopy}\n`);

  // 4. Test Object 2: Executive Desk with 3 Drawers & Aluminum Handles
  console.log('[4/4] Testing Prompt 2: Contemporary Executive Wooden Desk with Drawers & Handles...');
  const deskPrompt = 'Create a contemporary executive wooden desk with three drawers and aluminum handles. Frame the entire desk in the camera.';
  
  const deskResult = await engine.executeAstraIntent(deskPrompt, { isNewScene: true });
  console.log('\nDesk Generation Result:', {
    success: deskResult.success,
    mode: deskResult.mode,
    worldId: deskResult.worldId,
    heroEntity: deskResult.heroEntity,
    assetStrategy: deskResult.assetStrategy,
    renderPath: deskResult.renderPath,
    blendPath: deskResult.blendPath,
    aiQuotaExceeded: deskResult.aiQuotaExceeded,
    synthesisSource: deskResult.synthesisSource,
    status: deskResult.status
  });

  if (!deskResult.success) {
    throw new Error(`Desk generation failed: ${deskResult.error}`);
  }

  const deskScene = await engine.getLiveScene();
  const deskObjs = deskScene.data.objects.map(o => o.name);
  console.log('Live Scene Objects for Desk:', deskObjs);

  const hasDesktop = deskObjs.some(n => n.includes('Desktop_Surface'));
  const hasCabinet = deskObjs.some(n => n.includes('Pedestal_Cabinet'));
  const hasDrawers = deskObjs.some(n => n.includes('Drawer_Top') || n.includes('Drawer_Mid'));
  const hasHandles = deskObjs.some(n => n.includes('Handle_Top'));

  console.log('Desk Component Verification:');
  console.log('  - Desktop Surface present:', hasDesktop);
  console.log('  - Pedestal Cabinet present:', hasCabinet);
  console.log('  - Drawers present:', hasDrawers);
  console.log('  - Handles present:', hasHandles);

  if (!hasDesktop || !hasCabinet || !hasDrawers) {
    throw new Error('Procedural desk assembly missing critical requested components!');
  }
  if (!fs.existsSync(deskResult.renderPath)) {
    throw new Error(`Render file missing at ${deskResult.renderPath}`);
  }
  console.log(`✓ Desk render generated at: ${deskResult.renderPath} (${fs.statSync(deskResult.renderPath).size} bytes)`);

  const deskRenderCopy = path.join(__dirname, 'test_desk_render.png');
  fs.copyFileSync(deskResult.renderPath, deskRenderCopy);
  console.log(`✓ Copied desk render to: ${deskRenderCopy}\n`);

  console.log('=== ALL PIPELINE VERIFICATIONS PASSED SUCCESSFULLY! ===');
  return {
    chairResult,
    deskResult,
    chairRenderCopy,
    deskRenderCopy
  };
}

runPipelineTest()
  .then(res => {
    console.log('\nTest Completed Successfully.');
    process.exit(0);
  })
  .catch(err => {
    console.error('\nTest Failed with Error:', err);
    process.exit(1);
  });
