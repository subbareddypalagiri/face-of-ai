const { sendBridgeRPC } = require('../src/main/tools/blenderAstraEngine');

async function testOp() {
  const code = `
import bpy

# Set AI prompt
bpy.context.scene.unin_ai_prompt = "hero punch action"
# Call operator
bpy.ops.unin.execute_ai_prompt()

status = bpy.context.scene.unin_ai_status
print("STATUS_AFTER_EXECUTE:", status)

arm = bpy.data.objects.get("CharacterArmature")
act = arm.animation_data.action.name if arm and arm.animation_data and arm.animation_data.action else None
print("ACTIVE_ACTION_AFTER_EXECUTE:", act)

with open("C:/Users/subba/Desktop/op_test.txt", "w") as f:
    f.write(f"Status: {status}\\nAction: {act}\\n")
`;

  const res = await sendBridgeRPC('execute_bpy', { code, autoCapture: false });
  console.log("EXEC OP RESULT:", res.success, res.error);
}

testOp().catch(console.error);
