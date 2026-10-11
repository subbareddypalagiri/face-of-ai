const { BlenderAstraEngine } = require('../src/main/tools/blenderAstraEngine');

async function testSuite() {
  const engine = new BlenderAstraEngine();

  const queries = ['punch', 'walk', 'run', 'sword', 'cheyyi oopu', 'fight chey'];
  for (const q of queries) {
    const res = await engine.playAvatarAnimation(q);
    console.log(`Query "${q}" => Matched: "${res.animation?.name || res.animation?.id}" (Builtin: ${res.animation?.builtin || 'mocap'})`);
  }
}

testSuite().catch(console.error);
