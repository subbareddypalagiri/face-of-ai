const { sendBridgeRPC } = require('../src/main/tools/blenderAstraEngine');

async function testPanelOps() {
  console.log("=== Testing FAANG-Grade In-Blender N-Panel Operators ===");

  // 1. Test Quick Mocap Wave button
  const op1 = `
import bpy
bpy.ops.unin.quick_mocap(action_name="wave")
print("STATUS 1:", bpy.context.scene.unin_ai_status)
`;
  const r1 = await sendBridgeRPC('execute_bpy', { code: op1, autoCapture: false });
  console.log("1. Wave Button Result:", r1.success);

  // 2. Test Quick Color Gold button
  const op2 = `
import bpy
bpy.ops.unin.quick_color(color_preset="gold")
print("STATUS 2:", bpy.context.scene.unin_ai_status)
`;
  const r2 = await sendBridgeRPC('execute_bpy', { code: op2, autoCapture: false });
  console.log("2. Gold Color Button Result:", r2.success);

  // 3. Test Portrait Camera Frame button
  const op3 = `
import bpy
bpy.ops.unin.frame_camera(mode="portrait")
print("STATUS 3:", bpy.context.scene.unin_ai_status)
`;
  const r3 = await sendBridgeRPC('execute_bpy', { code: op3, autoCapture: false });
  console.log("3. Portrait 70mm Camera Result:", r3.success);

  // 4. Test Natural Language Prompt Execution inside Blender
  const op4 = `
import bpy
bpy.context.scene.unin_ai_prompt = "katana slash and cyan glow"
bpy.ops.unin.execute_ai_prompt()
print("STATUS 4:", bpy.context.scene.unin_ai_status)
`;
  const r4 = await sendBridgeRPC('execute_bpy', { code: op4, autoCapture: false });
  console.log("4. Natural Language Input Result:", r4.success);

  // 5. Query scene state to confirm status
  const codeCheck = `
import bpy
import json
res = {
    "prompt": bpy.context.scene.unin_ai_prompt,
    "status": bpy.context.scene.unin_ai_status,
    "action": bpy.data.objects["CharacterArmature"].animation_data.action.name
}
with open("C:/Users/subba/Desktop/npanel_final_audit.json", "w") as f:
    json.dump(res, f, indent=2)
`;
  await sendBridgeRPC('execute_bpy', { code: codeCheck, autoCapture: false });
}

testPanelOps().catch(console.error);
