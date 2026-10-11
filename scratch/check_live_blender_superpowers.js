// scratch/check_live_blender_superpowers.js
'use strict';

const { sendBridgeRPC } = require('../src/main/tools/blenderAstraEngine');

async function checkLiveSuperpowers() {
  const code = `
has_phys = hasattr(bpy.ops.unin, 'auto_physics_smooth')
has_mocap = hasattr(bpy.ops.unin, 'video_mocap_retarget')
print("LIVE OPERATORS VERIFIED in BLENDER:", "AutoPhysics:", has_phys, "VideoMocap:", has_mocap)
`;

  const res = await sendBridgeRPC('execute_bpy', { code });
  console.log('Bridge Status:', res.success);

  // Take a real viewport snapshot to verify
  const snap = await sendBridgeRPC('capture_snapshot');
  console.log('Live Viewport Snapshot Verified:', snap.success, 'Size:', snap.data?.fileSizeBytes, 'bytes');
  console.log('Saved to:', snap.data?.snapshotPath);
}

checkLiveSuperpowers().catch(console.error);
