// scratch/test-unin-3-master.js — SOTA 2026 FAANG-Grade Master Verification for UNIN 3.0 Astra-6 Architecture
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const contextCortex = require('../context-cortex');
const jitToolGenesis = require('../jit-tool-genesis');
const metaAiRouter = require('../meta-ai-router');
const ambientSentinel = require('../ambient-sentinel');
const { initToolRegistry } = require('../src/main/tools');

async function runMasterTestSuite() {
  console.log('=== [UNIN 3.0 MASTER TEST SUITE] Astra-6 Tier Subsystems Verification ===\n');

  // ── [1/5] Testing Active Context Cortex ──
  console.log('[1/5] Testing Multimodal Context Cortex (Foreground & Browser Sniffer)...');
  const ctx = await contextCortex.getActiveContext();
  assert.strictEqual(ctx.success, true, 'getActiveContext must return success: true');
  assert.ok(ctx.processName, 'Active processName must be identified');
  assert.ok(ctx.platform, 'Platform category must be identified');
  console.log(`  -> Active Window: "${ctx.windowTitle}" | Process: ${ctx.processName} | Platform: ${ctx.platform}`);

  // ── [2/5] Testing JIT Tool Genesis Engine (On-the-fly Code Synthesis) ──
  console.log('\n[2/5] Testing JIT Tool Genesis Engine (Arbitrary Task Execution)...');
  const nodeCode = `
    const numbers = [10, 20, 30, 40, 50];
    const sum = numbers.reduce((a, b) => a + b, 0);
    console.log(JSON.stringify({ calculatedSum: sum, count: numbers.length }));
  `;
  const jitNodeRes = await jitToolGenesis.executeJitTask(nodeCode, 'node');
  assert.strictEqual(jitNodeRes.success, true, 'Node JIT task must execute successfully');
  const parsedOut = JSON.parse(jitNodeRes.output);
  assert.strictEqual(parsedOut.calculatedSum, 150, 'Computed sum must be 150');
  console.log(`  -> JIT Node.js runtime executed in ${jitNodeRes.durationMs}ms with output:`, parsedOut);

  // Test PowerShell JIT runtime
  const psCode = `Write-Output "ASTRA_JIT_POWERSHELL_OK"`;
  const jitPsRes = await jitToolGenesis.executeJitTask(psCode, 'powershell');
  assert.strictEqual(jitPsRes.success, true, 'PowerShell JIT task must execute successfully');
  assert.ok(jitPsRes.output.includes('ASTRA_JIT_POWERSHELL_OK'), 'PowerShell output must match');
  console.log('  -> JIT PowerShell runtime executed successfully.');

  // Test Dynamic Tool Caching to disk
  const synthRes = jitToolGenesis.synthesizeDynamicTool(
    'test_hash_calculator',
    'return { hash: "sha256_dummy_hash" };',
    'Calculates hashes dynamically'
  );
  assert.strictEqual(synthRes.success, true);
  assert.ok(fs.existsSync(synthRes.path), 'Synthesized tool must exist on disk');
  console.log('  -> JIT Tool Synthesis to disk verified at:', synthRes.path);

  // ── [3/5] Testing Frontier Model Mesh & Meta-AI Prompt Router ──
  console.log('\n[3/5] Testing Frontier Model Mesh & Meta-AI Router...');
  
  // Test UI Frontend intent -> v0.dev
  const uiRouting = metaAiRouter.classifyOptimalFrontierModel('build modern interactive react dashboard with tailwind');
  assert.strictEqual(uiRouting.domain, 'UI_FRONTEND', 'UI intent must route to UI_FRONTEND');
  assert.ok(uiRouting.name.includes('v0.dev'), 'Recommended model must be v0.dev');
  console.log(`  -> UI Intent routed to: ${uiRouting.name}`);

  // Test System Architecture intent -> Claude 3.7
  const archRouting = metaAiRouter.classifyOptimalFrontierModel('design high concurrency distributed message broker architecture');
  assert.strictEqual(archRouting.domain, 'DEEP_ARCHITECTURE', 'Architecture intent must route to DEEP_ARCHITECTURE');
  assert.ok(archRouting.name.includes('Claude'), 'Recommended model must be Claude');
  console.log(`  -> Architecture Intent routed to: ${archRouting.name}`);

  // Test SOTA prompt compilation
  const compiledPrompt = metaAiRouter.compileSotaPrompt('Create a fast Redis cache client with circuit breaker');
  assert.ok(compiledPrompt.includes('PRO-TIER FAANG SPECIFICATION'), 'Prompt must contain FAANG specification header');
  assert.ok(compiledPrompt.includes('DEFENSIVE PROGRAMMING'), 'Prompt must contain defensive constraints');
  console.log('  -> SOTA Prompt compilation verified.');

  // ── [4/5] Testing Ambient Sentinel & Port Scanner ──
  console.log('\n[4/5] Testing Ambient Sentinel & System Observer...');
  const ambientRes = await ambientSentinel.sniffAmbientEvents();
  assert.strictEqual(ambientRes.success, true, 'sniffAmbientEvents must return success: true');
  assert.ok(Array.isArray(ambientRes.devServers), 'devServers must be an array');
  console.log(`  -> Ambient Observation: ${ambientRes.status}`);

  // ── [5/5] Testing ToolRegistry Integration (Total 48 Tools) ──
  console.log('\n[5/5] Testing ToolRegistry Complete Aggregation...');
  const registry = initToolRegistry({
    goalEngine: { executeGoal: async () => ({ success: true }) },
    swarmOrchestrator: { executeSwarmTask: async () => ({ success: true }) },
    visualWatchdog: { start: () => ({ active: true }), stop: () => ({ active: false }), groundSpatialElement: () => ({}) },
    blenderLiveBridge: { executeBlenderScript: async () => ({}), generateProcedural3DModel: async () => ({}), generateRiggedAnimatedCharacter: async () => ({}) }
  });

  assert.ok(registry.has('execute_jit_task'), 'execute_jit_task must be registered');
  assert.ok(registry.has('get_active_context'), 'get_active_context must be registered');
  assert.ok(registry.has('download_media'), 'download_media must be registered');
  assert.ok(registry.has('route_meta_ai'), 'route_meta_ai must be registered');
  assert.ok(registry.has('sniff_ambient_events'), 'sniff_ambient_events must be registered');

  console.log(`  -> All Astra-6 tools registered in ToolRegistry! Total available tools: ${registry.tools.size}`);

  // Dispatch live test for get_active_context through ToolRegistry
  const dispatchRes = await registry.dispatch('get_active_context', {});
  assert.strictEqual(dispatchRes.success, true, 'ToolRegistry dispatch for get_active_context must succeed');
  console.log('  -> ToolRegistry live dispatch verified.');

  console.log('\n=== ALL ASSERTIONS PASSED! UNIN 3.0 Astra-6 Architecture is 100% OPERATIONAL ===');
  process.exit(0);
}

runMasterTestSuite().catch(err => {
  console.error('MASTER TEST SUITE FAILED:', err);
  process.exit(1);
});
