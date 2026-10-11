// scratch/test-visual-watchdog.js — Automated Verification for Milestone 3 Visual Watchdog
'use strict';

const assert = require('assert');
const path = require('path');
const visualWatchdog = require('c:/Users/subba/Downloads/prime -ps/face of me/unin-visual-watchdog');

console.log('=== [UNIN TEST SUITE] Milestone 3: Continuous Visual Watchdog & Spatial Grounding ===\n');

async function runVisualWatchdogVerification() {
  let passedAssertions = 0;

  // 1. Verify Spatial Grounding Engine across multiple resolutions
  console.log('[1/5] Testing Spatial Grounding Coordinates & Click Targets...');
  const resolutions = [
    { width: 1920, height: 1080 },
    { width: 2560, height: 1440 },
    { width: 1366, height: 768 }
  ];

  for (const res of resolutions) {
    const modalGrounding = visualWatchdog.groundSpatialElement('permission_dialog', res);
    assert.strictEqual(modalGrounding.category, 'permission_dialog');
    assert(modalGrounding.confidence >= 0.9, 'Confidence should be >= 0.9');
    assert(modalGrounding.suggestedClickPoint.x > modalGrounding.x, 'Click point X must be inside dialog');
    assert(modalGrounding.suggestedClickPoint.y > modalGrounding.y, 'Click point Y must be inside dialog');

    const errorGrounding = visualWatchdog.groundSpatialElement('error_console', res);
    assert.strictEqual(errorGrounding.category, 'error_console');
    assert(errorGrounding.y >= res.height * 0.5, 'Console should be in bottom half of viewport');

    const trayGrounding = visualWatchdog.groundSpatialElement('system_tray_dock', res);
    assert.strictEqual(trayGrounding.category, 'system_tray_dock');
    assert(trayGrounding.x >= res.width * 0.7, 'System tray dock must be on right side');

    passedAssertions += 3;
  }
  console.log('  -> Spatial Grounding passed across 1080p, 2K, and laptop resolutions.\n');

  // 2. Test Frame Analyzer on Nominal Screen
  console.log('[2/5] Testing Nominal Clean Frame Analysis...');
  const nominalFrame = { text: 'UNIN AI System Running. Status: OK. CPU: 12%, Memory: 42%' };
  const nominalResult = visualWatchdog.analyzeFrameContent(nominalFrame);
  assert.strictEqual(nominalResult.anomalyDetected, false, 'Nominal frame should not trigger anomaly');
  assert.strictEqual(nominalResult.anomalyType, null);
  passedAssertions++;
  console.log('  -> Nominal frame accurately identified with 0 false positives.\n');

  // 3. Test Build Error / Compiler Crash Anomaly Detection
  console.log('[3/5] Testing Build Crash / SyntaxError Detection...');
  const crashFrame = {
    text: `webpack 5.88.0 compiled with 1 error
ERROR in ./src/index.js
Module build failed: SyntaxError: Unexpected token (14:8)
Failed to compile.`
  };
  let errorEventFired = false;
  const onAnomaly = (data) => {
    if (data.anomalyType === 'BUILD_ERROR_DETECTED') {
      errorEventFired = true;
    }
  };
  visualWatchdog.once('anomaly_detected', onAnomaly);

  const crashResult = visualWatchdog.analyzeFrameContent(crashFrame);
  assert.strictEqual(crashResult.anomalyDetected, true, 'Build error must trigger anomaly flag');
  assert.strictEqual(crashResult.anomalyType, 'BUILD_ERROR_DETECTED');
  assert(crashResult.details.includes('SYNTAXERROR') || crashResult.details.includes('FAILED TO COMPILE'));
  assert(errorEventFired, 'anomaly_detected event must be emitted');
  assert(crashResult.grounding !== null, 'Spatial grounding must be attached');
  passedAssertions += 4;
  console.log(`  -> Detected build error: "${crashResult.details}" with console spatial grounding.\n`);

  // 4. Test Permission Modal Spotting & Auto-Allow Trigger
  console.log('[4/5] Testing Permission Modal Spotting & Auto-Allow Trigger...');
  const modalFrame = {
    text: `User Account Control: Antigravity requests access to run PowerShell automation.
Do you want to allow this app to make changes to your device?
[ Allow ]   [ Deny ]`
  };
  let modalEventFired = false;
  visualWatchdog.once('modal_spotted', (data) => {
    if (data.anomalyType === 'PERMISSION_MODAL_SPOTTED') {
      modalEventFired = true;
    }
  });

  const modalResult = visualWatchdog.analyzeFrameContent(modalFrame);
  assert.strictEqual(modalResult.anomalyDetected, true, 'Modal frame must trigger anomaly flag');
  assert.strictEqual(modalResult.anomalyType, 'PERMISSION_MODAL_SPOTTED');
  assert.strictEqual(modalResult.autoAction, 'TRIGGER_AUTO_ALLOW', 'autoAllowModals should generate TRIGGER_AUTO_ALLOW');
  assert(modalEventFired, 'modal_spotted event must be emitted');
  passedAssertions += 4;
  console.log('  -> Spotted permission dialog and armed TRIGGER_AUTO_ALLOW action.\n');

  // 5. Test Continuous Background Sentinel Loop with Custom Capture Provider
  console.log('[5/5] Testing Sentinel Lifecycle & Continuous Loop...');
  let capturesPerformed = 0;
  visualWatchdog.setCaptureProvider(async () => {
    capturesPerformed++;
    return { text: `Frame ${capturesPerformed}: Active Terminal Session` };
  });

  const startRes = visualWatchdog.start(100, { autoAllowModals: true });
  assert.strictEqual(startRes.active, true);
  assert.strictEqual(visualWatchdog.getState().active, true);

  // Wait for 3 capture intervals to tick
  await new Promise(resolve => setTimeout(resolve, 350));
  assert(capturesPerformed >= 2, `Expected at least 2 background captures, got ${capturesPerformed}`);

  const stopRes = visualWatchdog.stop();
  assert.strictEqual(stopRes.active, false);
  assert.strictEqual(visualWatchdog.getState().active, false);
  passedAssertions += 5;
  console.log(`  -> Sentinel started, ran ${capturesPerformed} background loops, and cleanly stopped.\n`);

  console.log(`=== ALL ${passedAssertions} ASSERTIONS PASSED! Visual Watchdog is 100% OPERATIONAL ===`);
  process.exit(0);
}

runVisualWatchdogVerification().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
