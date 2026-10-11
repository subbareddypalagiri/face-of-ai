const { BlenderAstraEngine } = require('../src/main/tools/blenderAstraEngine');

async function testAnim() {
  const engine = new BlenderAstraEngine();

  console.log("--- 1. Testing playAvatarAnimation('idle') ---");
  const idleRes = await engine.playAvatarAnimation('idle');
  console.log("Idle Result:", idleRes);

  console.log("--- 2. Testing playAvatarAnimation('wave') ---");
  const waveRes = await engine.playAvatarAnimation('wave');
  console.log("Wave Result:", waveRes);
}

testAnim().catch(console.error);
