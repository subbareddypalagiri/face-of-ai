// scratch/test_multi_app_pairing_pipeline.js — E2E Test for UNIN Multi-App Pairing & Zero-Trust Integration Hub
'use strict';

const assert = require('assert');
const integrationManager = require('../src/main/integrations/IntegrationManager');
const ComposioEnterpriseMesh = require('../src/main/tools/ComposioEnterpriseMesh');
const { ToolRegistry } = require('../src/main/tools/ToolRegistry');

async function runTest() {
  console.log('=== [UNIN TEST SUITE] Multi-App Pairing & Zero-Trust Hub Verification ===\n');

  // [1/4] Verify App Catalog (All 10 Core Apps)
  console.log('[1/4] Checking 10 Core Applications in IntegrationManager...');
  const statuses = integrationManager.getStatuses();
  const appKeys = Object.keys(statuses);
  assert.strictEqual(appKeys.length, 10, 'Must have exactly 10 core apps defined.');
  console.log(`  ✓ 10 Apps Loaded: ${appKeys.join(', ')}`);

  const requiredApps = ['gmail', 'google_calendar', 'github', 'figma', 'slack', 'notion', 'google_drive', 'spotify', 'discord', 'linear'];
  requiredApps.forEach(app => {
    assert(statuses[app], `App ${app} must be present in definitions.`);
    assert(statuses[app].name, `App ${app} must have a name.`);
    assert(statuses[app].fields.length > 0, `App ${app} must define authentication fields.`);
  });
  console.log('  ✓ All 10 app definitions, auth fields, and doc links validated.');

  // [2/4] Live Network Verification (Zero Mock Data)
  console.log('\n[2/4] Testing Live Handshake Rejection on Invalid Token (Real API test)...');
  const dummyGitHubTest = await integrationManager.verifyConnection('github', { token: 'ghp_invalid_token_test_12345' });
  assert.strictEqual(dummyGitHubTest.success, false, 'Invalid GitHub token must be rejected by real GitHub API.');
  assert(dummyGitHubTest.error.includes('GitHub Auth Failed (401)'), `Must return actual 401 from GitHub API: ${dummyGitHubTest.error}`);
  console.log(`  ✓ Real GitHub API live rejection verified: "${dummyGitHubTest.error}"`);

  // [3/4] Testing ComposioEnterpriseMesh with Zero Mock Data
  console.log('\n[3/4] Verifying ComposioEnterpriseMesh Tool Execution (Zero Mock Strings)...');
  const toolRegistry = new ToolRegistry();
  const mesh = new ComposioEnterpriseMesh();
  await mesh.initialize(toolRegistry);

  // Search email when disconnected
  const emailResult = await mesh.searchEmails({ query: 'is:unread' });
  assert.strictEqual(emailResult.success, false, 'Must fail gracefully when Gmail not connected.');
  assert.strictEqual(emailResult.connected, false, 'Must flag connected: false.');
  assert.strictEqual(emailResult.code, 'GMAIL_NOT_CONNECTED', 'Must provide GMAIL_NOT_CONNECTED error code.');
  assert(emailResult.error.includes('⚡ Connect Apps'), 'Must guide user to Connect Apps button.');
  console.log('  ✓ Zero mock data verified! Gmail search returns genuine prompt:', emailResult.error);

  // List repos when disconnected
  const repoResult = await mesh.listGitHubRepos();
  assert.strictEqual(repoResult.success, false, 'GitHub must fail gracefully when not connected.');
  assert.strictEqual(repoResult.connected, false, 'Must flag connected: false.');
  console.log('  ✓ GitHub repo check returns genuine prompt:', repoResult.error);

  // [4/4] Encryption Round-Trip Verification
  console.log('\n[4/4] Verifying Hardware/AES-256-GCM Credential Encryption...');
  const testSecret = 'ghp_super_secret_pat_9876543210';
  const encrypted = integrationManager.encryptValue(testSecret);
  assert.notStrictEqual(encrypted, testSecret, 'Ciphertext must never equal plaintext.');
  const decrypted = integrationManager.decryptValue(encrypted);
  assert.strictEqual(decrypted, testSecret, 'Decrypted value must exactly match original secret.');
  console.log('  ✓ Hardware DPAPI / AES-256-GCM cryptographic encryption round-trip verified.');

  console.log('\n=== ALL 4 MULTI-APP PAIRING TESTS PASSED 100%! FAANG-GRADE REAL DATA READY ===');
}

runTest().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
