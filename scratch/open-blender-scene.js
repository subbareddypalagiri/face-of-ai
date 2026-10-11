// scratch/open-blender-scene.js
// 1-Click interactive manual test for Blender 5.1
const { blenderTD } = require('../unin-blender-td');
const path = require('path');

async function main() {
  console.log('========================================================');
  console.log('   UNIN BLENDER 5.1 INTERACTIVE MANUAL TEST LAUNCHER    ');
  console.log('========================================================\n');

  const blendFile = path.join(__dirname, '../unin_cinematic_scene.blend');
  console.log(`Target Scene: "${blendFile}"`);

  console.log('Launching visible interactive Blender 5.1 GUI window...');
  const res = blenderTD.openBlenderGUI(blendFile);

  if (res.success) {
    console.log('\n🎉 SUCCESS! Blender 5.1 application has been launched on your desktop.');
    console.log('You can now interact with the 3D viewport, cameras, lights, and shaders directly!');
  } else {
    console.error('Failed to launch Blender:', res.error);
  }
}

main().catch(console.error);
