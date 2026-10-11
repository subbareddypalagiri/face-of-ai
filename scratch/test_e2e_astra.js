const { BlenderAstraEngine, checkBridgeHealth } = require('../src/main/tools/blenderAstraEngine');
const { UniversalStreamOrchestrator } = require('../src/main/tools/universalStreamOrchestrator');

async function testE2E() {
  console.log("=== UNIN ASTRA 3D DIGITAL HUMAN & 500+ ANIMATION ENGINE E2E AUDIT ===");

  // 1. Health check
  const health = await checkBridgeHealth();
  console.log("1. Live Bridge Health:", health.online ? "ONLINE (Port 8192) ✓" : "OFFLINE ✗", health.info?.server);

  // 2. Stream Orchestrator Animation Intent Routing
  const orch = new UniversalStreamOrchestrator();
  console.log("\n2. Testing Universal Stream Orchestrator Intent Routing:");
  
  const wavePrompt = "buddy hero wave chey live blender lo";
  console.log(`Prompt: "${wavePrompt}"`);
  const match1 = orch.resolveUserIntentToStream(wavePrompt);
  console.log("Matched Stream:", match1.stream?.name, `(Confidence: ${match1.confidence}%)`);
  if (match1.stream) {
    const res1 = await orch.executeAutonomousStreamTask(match1.stream.id, wavePrompt);
    console.log("Wave Stream Result:", res1.success, "Mode:", res1.mode, "Message:", res1.message);
  }

  const punchPrompt = "hero punch action cheyyi";
  console.log(`\nPrompt: "${punchPrompt}"`);
  const match2 = orch.resolveUserIntentToStream(punchPrompt);
  console.log("Matched Stream:", match2.stream?.name, `(Confidence: ${match2.confidence}%)`);
  if (match2.stream) {
    const res2 = await orch.executeAutonomousStreamTask(match2.stream.id, punchPrompt);
    console.log("Punch Stream Result:", res2.success, "Mode:", res2.mode, "Message:", res2.message);
  }

  // 3. Speech Lip-Sync State Switching
  const engine = new BlenderAstraEngine();
  console.log("\n3. Testing Speech Lip-Sync Activation:");
  const speechStart = await engine.startSpeechLipSync();
  console.log("Start Speech Lip-Sync Result:", speechStart.success);

  const speechStop = await engine.stopSpeechLipSync();
  console.log("Stop Speech Lip-Sync Result:", speechStop.success);

  // 4. Return to healthy Idle Neutral pose
  console.log("\n4. Resetting to Neutral Standing Idle:");
  const idleRes = await engine.playAvatarAnimation('idle');
  console.log("Idle Result:", idleRes.success, "Animation:", idleRes.animation?.name);

  console.log("\n=== ALL E2E VERIFICATIONS COMPLETE ===");
}

testE2E().catch(console.error);
