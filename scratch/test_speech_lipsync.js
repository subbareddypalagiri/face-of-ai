const { sendBridgeRPC } = require('../src/main/tools/blenderAstraEngine');

async function testSpeechLipSync() {
  console.log("--- Testing Real-time Speech Lip-Sync Driver in Blender 5.1 ---");
  
  // 1. Activate Speech Lip-Sync on Suit_Head
  const startSpeechPy = `
import bpy
import math

head = bpy.data.objects.get("Suit_Head")
if head and head.data.shape_keys:
    jaw = head.data.shape_keys.key_blocks.get("jawOpen")
    smile = head.data.shape_keys.key_blocks.get("mouthSmile")
    brow = head.data.shape_keys.key_blocks.get("browUp")
    
    if jaw:
        try:
            jaw.driver_remove('value')
        except Exception:
            pass
        drv_jaw = jaw.driver_add('value').driver
        drv_jaw.type = 'SCRIPTED'
        # Multi-frequency phonetic syllable simulation: natural speech phoneme cadence
        drv_jaw.expression = "0.45 * (sin(frame * 0.4)**2) + 0.28 * (sin(frame * 0.85)**2)"
        
    if smile:
        try:
            smile.driver_remove('value')
        except Exception:
            pass
        drv_smile = smile.driver_add('value').driver
        drv_smile.type = 'SCRIPTED'
        drv_smile.expression = "0.15 + 0.12 * sin(frame * 0.18)"
        
    if brow:
        try:
            brow.driver_remove('value')
        except Exception:
            pass
        drv_brow = brow.driver_add('value').driver
        drv_brow.type = 'SCRIPTED'
        drv_brow.expression = "0.18 * max(0.0, sin(frame * 0.08))"
        
print("SPEECH_LIPSYNC_DRIVERS_ACTIVE")
`;

  const res = await sendBridgeRPC('execute_bpy', { code: startSpeechPy, autoCapture: false });
  console.log("Start Speech Drivers Result:", res.success, res.error);

  // 2. Play Idle_Neutral while speaking
  const playIdlePy = `
import bpy
arm = bpy.data.objects.get("CharacterArmature")
idle = bpy.data.actions.get("CharacterArmature|Idle_Neutral") or bpy.data.actions.get("CharacterArmature|Idle")
if arm and idle:
    if not arm.animation_data:
        arm.animation_data_create()
    arm.animation_data.action = idle
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = 250
    bpy.ops.screen.animation_play()
    print("PLAYING_IDLE_WITH_SPEECH")
`;
  const idleRes = await sendBridgeRPC('execute_bpy', { code: playIdlePy, autoCapture: false });
  console.log("Play Idle Result:", idleRes.success);

  // 3. Render a frame to verify mouth is open in speaking posture
  const renderPy = `
import bpy
bpy.context.scene.frame_set(15)
bpy.context.scene.render.filepath = "C:/Users/subba/Desktop/Astra_Avatar_Speech_LipSync.png"
bpy.ops.render.render(write_still=True)
print("SPEECH_FRAME_RENDERED")
`;
  const rendRes = await sendBridgeRPC('execute_bpy', { code: renderPy, autoCapture: false });
  console.log("Render Result:", rendRes.success);
}

testSpeechLipSync().catch(console.error);
