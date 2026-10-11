// scratch/run-live-blender-phase-3cd-sequence.js — Live Blender Multi-Turn Verification for Phase 3C & 3D
'use strict';

const path = require('path');
const fs = require('fs');
const { BlenderAstraEngine, ensureBlenderLiveSession, checkBridgeHealth } = require('../src/main/tools/blenderAstraEngine');
const logger = require('../src/shared/Logger');

async function runLiveVisualSequence() {
  console.log('========================================================================');
  console.log('  UNIN PHASE 3C + 3D: LIVE BLENDER VISUAL INTELLIGENCE VERIFICATION');
  console.log('========================================================================\n');

  console.log('Ensuring active Blender 5.1 session on port 8192...');
  const sessionRes = await ensureBlenderLiveSession({ headless: false });
  if (!sessionRes.success) {
    throw new Error(`Failed to ensure Blender Live Session: ${sessionRes.error}`);
  }
  const health = await checkBridgeHealth();
  console.log(`Blender Live Bridge: ONLINE (Port 8192, Blender v${health.blenderVersion}) ✓\n`);

  const engine = new BlenderAstraEngine();

  const timings = {};

  // ────────────────────────────────────────────────────────────────────────────
  // TURN 1: BUILD LIVING WORLD WITH VISUAL PRODUCTION RIG
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n------------------------------------------------------------------------');
  console.log('TURN 1: BUILD LIVING WORLD WITH VISUAL PRODUCTION RIG');
  console.log('Prompt: "Create a photorealistic Harley Davidson motorcycle on a wet Indian street at night with rain, puddles, reflections, traffic lights, atmospheric fog and cinematic camera composition"');
  console.log('------------------------------------------------------------------------');
  const t1_start = Date.now();
  const buildRes = await engine.executeAstraIntent(
    'Create a photorealistic Harley Davidson motorcycle on a wet Indian street at night with rain, puddles, reflections, traffic lights, atmospheric fog and cinematic camera composition'
  );
  timings.turn1_build = Date.now() - t1_start;

  console.log(`Turn 1 Result: success=${buildRes.success}, worldId=${buildRes.worldId}, version=${buildRes.worldVersion}`);
  console.log(`Render Output: ${buildRes.renderPath} (exists: ${fs.existsSync(buildRes.renderPath)})`);
  if (buildRes.visualPlan) {
    console.log(`Visual Plan Style: "${buildRes.visualPlan.visualIntent?.style}", Strategy: "${buildRes.visualPlan.lighting?.strategy}", Lens: ${buildRes.visualPlan.camera?.focalLength}mm`);
  }
  if (buildRes.visualEvaluation) {
    console.log(`Vision Quality: Score=${buildRes.visualEvaluation.qualityScore.toFixed(1)}/10, Status=${buildRes.visualEvaluation.overallStatus}, Defects=${buildRes.visualEvaluation.defects?.length}`);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // TURN 2: PHASE 3C — DIRECT SCENE VISUALS (LUXURY STUDIO COMMERCIAL)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n------------------------------------------------------------------------');
  console.log('TURN 2: PHASE 3C — DIRECT SCENE VISUALS (LUXURY STUDIO COMMERCIAL)');
  console.log('Prompt: "Make this a luxury commercial shot with long-lens compression and clean reflections"');
  console.log('------------------------------------------------------------------------');
  const t2_start = Date.now();
  const directRes = await engine.directActiveWorld(
    'Make this a luxury commercial shot with long-lens compression and clean reflections'
  );
  timings.turn2_direct = Date.now() - t2_start;

  console.log(`Turn 2 Result: success=${directRes.success}, worldId=${directRes.worldId}, version=${directRes.version}`);
  console.log(`New Strategy: ${directRes.visualPlan?.lighting?.strategy}, Lens: ${directRes.visualPlan?.camera?.focalLength}mm, Composition: ${directRes.visualPlan?.camera?.composition}`);

  // ────────────────────────────────────────────────────────────────────────────
  // TURN 3: PHASE 3D — MULTIMODAL VISION EVALUATION
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n------------------------------------------------------------------------');
  console.log('TURN 3: PHASE 3D — MULTIMODAL VISION QUALITY EVALUATION');
  console.log('Prompt: "Evaluate luxury commercial aesthetics and lighting balance"');
  console.log('------------------------------------------------------------------------');
  const t3_start = Date.now();
  const evalRes = await engine.evaluateVisualQuality(
    'Luxury commercial motorcycle advertisement in clean studio lighting'
  );
  timings.turn3_eval = Date.now() - t3_start;

  console.log(`Turn 3 Result: Overall Status=${evalRes.overallStatus}`);
  console.log(`Quality Score: ${evalRes.qualityScore?.toFixed(1)}/10 (Threshold: ${evalRes.minScoreThreshold}/10)`);
  console.log(`Confidence: ${(evalRes.confidence * 100).toFixed(1)}%`);
  console.log(`Defects Count: ${evalRes.defects?.length} (Critical: ${evalRes.criticalCount}, High: ${evalRes.highCount})`);
  console.log(`Summary: ${evalRes.critiqueSummary}`);

  // ────────────────────────────────────────────────────────────────────────────
  // TURN 4: PHASE 3C+3D — MULTI-TURN DIRECTION & SURGICAL CORRECTION
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n------------------------------------------------------------------------');
  console.log('TURN 4: PHASE 3C+3D — MULTI-TURN DIRECTION & SURGICAL CORRECTION');
  console.log('Prompt: "Make the scene darker and move the motorcycle slightly closer to the road"');
  console.log('------------------------------------------------------------------------');
  const t4_start = Date.now();
  const mutateRes = await engine.mutateActiveWorld(
    'Move the motorcycle slightly closer to the road'
  );
  timings.turn4_mutate = Date.now() - t4_start;

  console.log(`Turn 4 Delta Result: success=${mutateRes.success}, action=${mutateRes.action}`);

  const t4b_start = Date.now();
  const loopRes = await engine.runVisualCorrectionLoop(
    'Moody dark atmospheric road shot with sharp motorcycle focus',
    { profile: 'STANDARD' }
  );
  timings.turn4_loop = Date.now() - t4b_start;

  console.log(`Turn 4 Correction Loop Result: success=${loopRes.success}, status=${loopRes.status}, iterations=${loopRes.iterations}, finalScore=${loopRes.finalScore?.toFixed(1)}/10`);

  // Final telemetry and performance report
  console.log('\n========================================================================');
  console.log('  PHASE 3C + 3D LIVE PERFORMANCE & LATENCY TELEMETRY');
  console.log('========================================================================');
  console.log(`  Full World Build & Visual Rig: ${(timings.turn1_build / 1000).toFixed(2)} s`);
  console.log(`  Visual Direction Dispatch:     ${timings.turn2_direct} ms`);
  console.log(`  Multimodal Vision Evaluation:   ${timings.turn3_eval} ms`);
  console.log(`  Delta World Mutation:          ${timings.turn4_mutate} ms`);
  console.log(`  Closed-Loop Correction Loop:   ${timings.turn4_loop} ms`);
  console.log('========================================================================\n');

  process.exit(0);
}

runLiveVisualSequence().catch(err => {
  console.error('Live visual sequence error:', err);
  process.exit(1);
});
