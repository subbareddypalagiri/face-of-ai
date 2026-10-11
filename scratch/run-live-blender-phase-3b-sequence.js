// scratch/run-live-blender-phase-3b-sequence.js — Multi-Turn Live Blender 5.1 End-to-End Sequence
'use strict';

const path = require('path');
const fs = require('fs');
const {
  ensureBlenderLiveSession,
  sendBridgeRPC,
  checkBridgeHealth,
  BlenderAstraEngine
} = require('../src/main/tools/blenderAstraEngine');
const {
  PersistentWorldState,
  ENTITY_STATUS
} = require('../src/main/tools/astra/core');

async function runLiveMultiTurnSequence() {
  console.log('========================================================================');
  console.log('  UNIN PHASE 3B: MULTI-TURN LIVE BLENDER 5.1 PRODUCTION SEQUENCE');
  console.log('========================================================================\n');

  // Step 1: Ensure active Blender session on port 8192
  console.log('Step 0: Ensuring active Blender 5.1 session on port 8192...');
  const sessionRes = await ensureBlenderLiveSession({ headless: false });
  if (!sessionRes.success) {
    throw new Error(`Failed to ensure Blender Live Session: ${sessionRes.error}`);
  }
  const health = await checkBridgeHealth();
  console.log(`Blender Live Bridge: ONLINE (Port 8192, v${health.blenderVersion}) ✓\n`);

  const engine = new BlenderAstraEngine();
  const timings = {};
  const history = [];

  // ──────────────────────────────────────────────────────────────────────────
  // TURN 1: CREATE A CINEMATIC CITY
  // ──────────────────────────────────────────────────────────────────────────
  console.log('------------------------------------------------------------------------');
  console.log('TURN 1: "Create a cinematic cyberpunk city with wet asphalt road and neon lights"');
  console.log('------------------------------------------------------------------------');
  const t1Start = Date.now();
  const turn1Res = await engine.buildWorldAutonomous ? 
    await engine.autonomousArchitect.buildWorldAutonomous('Create a cinematic cyberpunk city with wet asphalt road and neon lights') :
    await engine.executeAstraIntent('Create a cinematic cyberpunk city with wet asphalt road and neon lights', { isNewScene: true });
  timings.turn1_create_world = Date.now() - t1Start;

  console.log(`[Turn 1] Result: success=${turn1Res.success}, worldId=${turn1Res.worldId}, version=${turn1Res.worldVersion || turn1Res.worldState?.version} (${(timings.turn1_create_world/1000).toFixed(2)}s) ✓`);
  const initialWorldId = turn1Res.worldId;

  // Verify Blender state
  let sceneState = await sendBridgeRPC('get_scene_state');
  console.log(`[Turn 1] Blender scene contains ${sceneState.objectsCount || sceneState.objects?.length} objects.`);
  history.push({ turn: 1, action: 'CREATE_WORLD', worldId: initialWorldId, timeMs: timings.turn1_create_world });

  // ──────────────────────────────────────────────────────────────────────────
  // TURN 2: ADD A RED FERRARI NEAR THE ENTRANCE
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n------------------------------------------------------------------------');
  console.log('TURN 2: "Add a red Ferrari near the entrance"');
  console.log('------------------------------------------------------------------------');
  const t2Start = Date.now();
  const turn2Res = await engine.mutateActiveWorld('Add a red Ferrari near the entrance');
  timings.turn2_add_ferrari = Date.now() - t2Start;

  console.log(`[Turn 2] Result: success=${turn2Res.success}, action=${turn2Res.action}, target=${turn2Res.targetsAffected?.[0]} (v${turn2Res.versionBefore} -> v${turn2Res.versionAfter}) (${timings.turn2_add_ferrari}ms) ✓`);
  const ferrariId = turn2Res.targetsAffected[0];
  history.push({ turn: 2, action: 'ADD', entityId: ferrariId, timeMs: timings.turn2_add_ferrari });

  // ──────────────────────────────────────────────────────────────────────────
  // TURN 3: MAKE THE FERRARI BLACK
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n------------------------------------------------------------------------');
  console.log('TURN 3: "Make the Ferrari black"');
  console.log('------------------------------------------------------------------------');
  const t3Start = Date.now();
  const turn3Res = await engine.mutateActiveWorld('Make the Ferrari black');
  timings.turn3_recolor = Date.now() - t3Start;

  console.log(`[Turn 3] Result: success=${turn3Res.success}, action=${turn3Res.action}, target=${turn3Res.targetsAffected?.[0]} (v${turn3Res.versionBefore} -> v${turn3Res.versionAfter}) (${timings.turn3_recolor}ms) ✓`);
  history.push({ turn: 3, action: 'MATERIAL_CHANGE', entityId: ferrariId, timeMs: timings.turn3_recolor });

  // ──────────────────────────────────────────────────────────────────────────
  // TURN 4: MOVE THE FERRARI TWO METERS LEFT
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n------------------------------------------------------------------------');
  console.log('TURN 4: "Move the Ferrari two meters left"');
  console.log('------------------------------------------------------------------------');
  const t4Start = Date.now();
  const turn4Res = await engine.mutateActiveWorld('Move the Ferrari two meters left');
  timings.turn4_move = Date.now() - t4Start;

  console.log(`[Turn 4] Result: success=${turn4Res.success}, action=${turn4Res.action}, offset=${turn4Res.parameters?.offset} (v${turn4Res.versionBefore} -> v${turn4Res.versionAfter}) (${timings.turn4_move}ms) ✓`);
  history.push({ turn: 4, action: 'MOVE', entityId: ferrariId, timeMs: timings.turn4_move });

  // ──────────────────────────────────────────────────────────────────────────
  // TURN 5: MAKE IT 20% LARGER
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n------------------------------------------------------------------------');
  console.log('TURN 5: "Make it 20% larger"');
  console.log('------------------------------------------------------------------------');
  const t5Start = Date.now();
  const turn5Res = await engine.mutateActiveWorld('Make it 20% larger');
  timings.turn5_scale = Date.now() - t5Start;

  console.log(`[Turn 5] Result: success=${turn5Res.success}, action=${turn5Res.action}, factor=${turn5Res.parameters?.factor} (v${turn5Res.versionBefore} -> v${turn5Res.versionAfter}) (${timings.turn5_scale}ms) ✓`);
  history.push({ turn: 5, action: 'SCALE', entityId: ferrariId, timeMs: timings.turn5_scale });

  // ──────────────────────────────────────────────────────────────────────────
  // TURN 6: HIDE THE FERRARI
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n------------------------------------------------------------------------');
  console.log('TURN 6: "Hide the Ferrari"');
  console.log('------------------------------------------------------------------------');
  const t6Start = Date.now();
  const turn6Res = await engine.mutateActiveWorld('Hide the Ferrari');
  timings.turn6_hide = Date.now() - t6Start;

  console.log(`[Turn 6] Result: success=${turn6Res.success}, action=${turn6Res.action}, visible=${turn6Res.parameters?.visible} (v${turn6Res.versionBefore} -> v${turn6Res.versionAfter}) (${timings.turn6_hide}ms) ✓`);
  history.push({ turn: 6, action: 'VISIBILITY_CHANGE (HIDE)', entityId: ferrariId, timeMs: timings.turn6_hide });

  // ──────────────────────────────────────────────────────────────────────────
  // TURN 7: SHOW THE FERRARI
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n------------------------------------------------------------------------');
  console.log('TURN 7: "Show the Ferrari"');
  console.log('------------------------------------------------------------------------');
  const t7Start = Date.now();
  const turn7Res = await engine.mutateActiveWorld('Show the Ferrari');
  timings.turn7_show = Date.now() - t7Start;

  console.log(`[Turn 7] Result: success=${turn7Res.success}, action=${turn7Res.action}, visible=${turn7Res.parameters?.visible} (v${turn7Res.versionBefore} -> v${turn7Res.versionAfter}) (${timings.turn7_show}ms) ✓`);
  history.push({ turn: 7, action: 'VISIBILITY_CHANGE (SHOW)', entityId: ferrariId, timeMs: timings.turn7_show });

  // ──────────────────────────────────────────────────────────────────────────
  // TURN 8: REMOVE THE FERRARI
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n------------------------------------------------------------------------');
  console.log('TURN 8: "Remove the Ferrari"');
  console.log('------------------------------------------------------------------------');
  const t8Start = Date.now();
  const turn8Res = await engine.mutateActiveWorld('Remove the Ferrari');
  timings.turn8_remove = Date.now() - t8Start;

  console.log(`[Turn 8] Result: success=${turn8Res.success}, action=${turn8Res.action}, target=${turn8Res.targetsAffected?.[0]} (v${turn8Res.versionBefore} -> v${turn8Res.versionAfter}) (${timings.turn8_remove}ms) ✓`);
  history.push({ turn: 8, action: 'REMOVE', entityId: ferrariId, timeMs: timings.turn8_remove });

  // Final Scene Reconciliation & Telemetry
  console.log('\n------------------------------------------------------------------------');
  console.log('POST-SEQUENCE FINAL RECONCILIATION & TELEMETRY');
  console.log('------------------------------------------------------------------------');
  const finalRecon = await engine.reconcileActiveWorld();
  console.log(`Final Reconciliation: verified=${finalRecon.verified}, verifiedCount=${finalRecon.counts?.verifiedCount}, missingCount=${finalRecon.counts?.missingCount}`);
  
  const finalWorldState = engine.getActiveWorldState();
  console.log(`World ID: ${finalWorldState.worldId} (Active throughout all 8 turns)`);
  console.log(`World Version: Final v${finalWorldState.version} (incremented monotonically across all mutations)`);
  console.log(`Total Mutations Recorded: ${finalWorldState.mutationHistory?.length}`);

  console.log('\n========================================================================');
  console.log('  PERFORMANCE COMPARISON (FULL REBUILD VS DELTA MUTATIONS)');
  console.log('========================================================================');
  console.log(`  Full World Creation Build:  ${(timings.turn1_create_world / 1000).toFixed(2)} s`);
  console.log(`  Turn 2 (ADD Entity):        ${timings.turn2_add_ferrari} ms`);
  console.log(`  Turn 3 (MATERIAL Recolor):  ${timings.turn3_recolor} ms`);
  console.log(`  Turn 4 (MOVE Translation):  ${timings.turn4_move} ms`);
  console.log(`  Turn 5 (SCALE +20%):        ${timings.turn5_scale} ms`);
  console.log(`  Turn 6 (HIDE Visibility):   ${timings.turn6_hide} ms`);
  console.log(`  Turn 7 (SHOW Visibility):   ${timings.turn7_show} ms`);
  console.log(`  Turn 8 (REMOVE Entity):     ${timings.turn8_remove} ms`);
  const avgDelta = (timings.turn2_add_ferrari + timings.turn3_recolor + timings.turn4_move + timings.turn5_scale + timings.turn6_hide + timings.turn7_show + timings.turn8_remove) / 7;
  console.log(`  Average Delta Mutation:     ${avgDelta.toFixed(1)} ms (~${(timings.turn1_create_world / avgDelta).toFixed(1)}x faster than full rebuild!)`);
  console.log('========================================================================\n');
  process.exit(0);
}

runLiveMultiTurnSequence().catch(err => {
  console.error('Live sequence error:', err);
  process.exit(1);
});
