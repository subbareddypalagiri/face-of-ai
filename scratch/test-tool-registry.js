// scratch/test-tool-registry.js — Automated Verification for Pluggable ToolRegistry
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { initToolRegistry, toolRegistry } = require('../src/main/tools');

console.log('=== [UNIN TEST SUITE] ToolRegistry Architecture Verification ===\n');

async function runToolRegistryVerification() {
  const workspaceRoot = path.resolve(__dirname, '..');

  // 1. Mock minimal dependencies for automation & astra tools
  const mockDeps = {
    workspaceRoot,
    desktopAutomator: {
      launchUniversalApp: async (app) => ({ success: true, app }),
      activateWindow: async (target) => ({ success: true, target }),
      sendWhatsAppMessage: async (contact, msg) => ({ success: true, contact, msg }),
      clickAllowDialog: async () => ({ success: true, clicked: true }),
      typeVisually: async (text) => ({ success: true, length: text.length }),
      typeIntoWindow: async (app, text) => ({ success: true, app, text }),
      mouseClickAt: async (x, y) => ({ success: true, x, y }),
      sendKeys: async (keys) => ({ success: true, keys }),
      scheduleTask: () => ({ success: true, taskId: 'test_123' }),
      getScheduledTasks: () => ({ success: true, tasks: [] }),
      cancelScheduledTask: (id) => ({ success: true, cancelled: id }),
      automateAntigravity: async (p) => ({ success: true, prompt: p }),
      manageAntigravityWorkspace: async (a, p) => ({ success: true, action: a, project: p }),
      automateAntigravityWithSkills: async (p) => ({ success: true, skills: [] })
    },
    browserAgent: {
      executeAction: async (act, params) => ({ success: true, action: act, params })
    },
    skillHunter: {
      discoverBestSkillsAndMCPs: async (q) => ({ success: true, skills: [] }),
      autonomousSkillPipeline: async (q, d) => ({ success: true, prompt: q })
    },
    nativeUiaBridge: {
      setElementValue: async () => ({ success: true }),
      invokeElement: async () => ({ success: true })
    },
    memoryCore: {
      saveContact: (n, p, notes) => ({ success: true, contact: { name: n, phone: p } }),
      listContacts: () => []
    },
    goalEngine: {
      executeGoal: async (g) => ({ success: true, goal: g, statusMessage: 'Goal completed' })
    },
    swarmOrchestrator: {
      executeSwarmTask: async (t) => ({ success: true, task: t, consensusAchieved: true })
    },
    visualWatchdog: {
      start: () => ({ success: true, active: true }),
      stop: () => ({ success: true, active: false }),
      groundSpatialElement: (c) => ({ category: c, x: 100, y: 100 })
    },
    blenderLiveBridge: {
      executeBlenderScript: async () => ({ success: true }),
      generateProcedural3DModel: async () => ({ success: true }),
      generateRiggedAnimatedCharacter: async () => ({ success: true })
    }
  };

  initToolRegistry(mockDeps);

  // [1/5] Verify Registration Count
  console.log(`[1/5] Verifying tool registrations... Registered: ${toolRegistry.tools.size}`);
  assert(toolRegistry.tools.size >= 24, `Expected at least 24 tools, got ${toolRegistry.tools.size}`);
  console.log('  -> Tool catalog validated.\n');

  // [2/5] Test System Tools (run_terminal_command, read_file, write_file)
  console.log('[2/5] Testing System Tools execution...');
  const termRes = await toolRegistry.dispatch('run_terminal_command', { command: 'node -v' });
  assert.strictEqual(termRes.success, true, 'run_terminal_command should succeed');
  assert(termRes.stdout.startsWith('v'), `stdout should contain node version, got: ${termRes.stdout}`);
  assert(termRes.durationMs !== undefined, 'durationMs must be tracked');

  const pkgRes = await toolRegistry.dispatch('read_file', { filePath: 'package.json' });
  assert.strictEqual(pkgRes.success, true);
  assert(pkgRes.totalLines > 5);

  const testFilePath = path.join(workspaceRoot, 'scratch', 'test_registry_write.txt');
  const writeRes = await toolRegistry.dispatch('write_file', { filePath: testFilePath, content: 'UNIN Tier-1 Registry Test' });
  assert.strictEqual(writeRes.success, true);
  assert(fs.existsSync(testFilePath));
  fs.unlinkSync(testFilePath);

  const sysStats = await toolRegistry.dispatch('get_system_stats', {});
  assert.strictEqual(sysStats.success, true);
  assert(sysStats.cpuCores > 0);
  console.log('  -> System tools passed with 100% assertions.\n');

  // [3/5] Test Automation & Astra Tools
  console.log('[3/5] Testing Automation & Astra Tools dispatch...');
  const appRes = await toolRegistry.dispatch('open_app', { appName: 'notepad' });
  assert.strictEqual(appRes.success, true);

  const goalRes = await toolRegistry.dispatch('execute_autonomous_goal', { goal: 'build express server' });
  assert.strictEqual(goalRes.success, true);

  const swarmRes = await toolRegistry.dispatch('execute_swarm_task', { task: 'build auth token' });
  assert.strictEqual(swarmRes.success, true);

  const wdRes = await toolRegistry.dispatch('start_visual_watchdog', { intervalMs: 4000 });
  assert.strictEqual(wdRes.success, true);
  console.log('  -> Automation & Astra dispatches verified.\n');

  // [4/5] Test Parameter Validation & Error Handling
  console.log('[4/5] Testing validation & unknown tool rejection...');
  const invalidTerm = await toolRegistry.dispatch('run_terminal_command', {});
  assert.strictEqual(invalidTerm.success, false);
  assert(invalidTerm.error.includes('required'));

  const unknownRes = await toolRegistry.dispatch('non_existent_tool_12345', {});
  assert.strictEqual(unknownRes.success, false);
  assert(unknownRes.error.includes('not registered'));
  console.log('  -> Error envelopes and parameter validations verified.\n');

  // [5/5] Test Telemetry Events
  console.log('[5/5] Testing Event Telemetry...');
  let eventFired = false;
  toolRegistry.once('tool_completed', (e) => {
    if (e.name === 'get_workspace_info') eventFired = true;
  });
  await toolRegistry.dispatch('get_workspace_info', {});
  assert.strictEqual(eventFired, true, 'tool_completed event must fire');
  console.log('  -> Telemetry verified.\n');

  console.log('=== ALL ASSERTIONS PASSED! ToolRegistry is Production Ready ===');
  process.exit(0);
}

runToolRegistryVerification().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
