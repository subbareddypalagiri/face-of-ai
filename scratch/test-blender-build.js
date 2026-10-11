const { blenderTD } = require('../unin-blender-td');
const path = require('path');

async function testBlender() {
  console.log('Testing Blender 5.1 buildCinematicScene...');
  const renderPath = path.join(__dirname, 'test_render.png');
  const res = await blenderTD.buildCinematicScene({
    sceneType: 'cyberpunk_street',
    lightingPreset: 'CYBERPUNK_NEON',
    cameraOptics: { focalLength: 35, fStop: 1.8, enableDoF: true },
    renderPngPath: renderPath
  });

  console.log('Build result:', res.success ? 'SUCCESS' : 'FAILED');
  if (res.error) console.error('Error:', res.error);
  if (res.stdout) console.log('Output preview:', res.stdout.slice(-300));
}

testBlender().catch(console.error);
