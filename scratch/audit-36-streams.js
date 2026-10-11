// scratch/audit-36-streams.js — Deep Verification & Audit of all 36 Digital Computing Streams
'use strict';

const { UNIVERSAL_36_STREAMS, UniversalStreamOrchestrator } = require('../src/main/tools/universalStreamOrchestrator');
const { initToolRegistry } = require('../src/main/tools');

async function audit() {
  console.log('================================================================');
  console.log('       UNIN UNIVERSAL 36-STREAM ARCHITECTURE AUDIT & VERIFICATION');
  console.log('================================================================\n');

  const registry = initToolRegistry({});
  const orchestrator = new UniversalStreamOrchestrator({});

  const streamKeys = Object.keys(UNIVERSAL_36_STREAMS);
  console.log(`[1] Total Streams Registered in Matrix: ${streamKeys.length} / 36`);

  const passed = [];
  const warnings = [];

  for (let i = 0; i < streamKeys.length; i++) {
    const key = streamKeys[i];
    const stream = UNIVERSAL_36_STREAMS[key];
    const streamNum = (i + 1).toString().padStart(2, '0');

    // Test resolution with first keyword
    const testKeyword = stream.keywords[0];
    const match = orchestrator.resolveUserIntentToStream(testKeyword);
    const resolvedCorrectly = match && match.matched && match.stream.id === stream.id;

    // Test execution handler
    let execResult = null;
    let execSuccess = false;
    try {
      execResult = await orchestrator.executeAutonomousStreamTask(stream.id, `Test prompt for ${testKeyword}`);
      execSuccess = execResult && execResult.success !== false;
    } catch (err) {
      execResult = { error: err.message };
    }

    if (resolvedCorrectly && execSuccess) {
      console.log(`[PASS] Stream ${streamNum}: [${stream.domain}] -> ${stream.name}`);
      console.log(`       Action: ${stream.actionType} | Output: "${execResult.message || 'OK'}"`);
      passed.push(key);
    } else {
      console.log(`[WARN] Stream ${streamNum}: [${stream.domain}] -> ${stream.name}`);
      console.log(`       Resolved: ${resolvedCorrectly} (Matched: ${match?.stream?.id || 'none'}), Executed: ${execSuccess}`);
      warnings.push({ key, resolvedCorrectly, execSuccess, execResult });
    }
  }

  console.log('\n================================================================');
  console.log(`AUDIT SUMMARY: ${passed.length} / 36 STREAMS FULLY OPERATIONAL (${warnings.length} warnings)`);
  console.log('================================================================');
}

audit();
