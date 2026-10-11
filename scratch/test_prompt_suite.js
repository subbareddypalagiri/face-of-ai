const { sendBridgeRPC } = require('../src/main/tools/blenderAstraEngine');

async function testPrompts() {
  const prompts = ["red neon glow", "portrait camera frame", "wave chey"];
  for (const p of prompts) {
    const code = `
import bpy
bpy.context.scene.unin_ai_prompt = "${p}"
bpy.ops.unin.execute_ai_prompt()
status = bpy.context.scene.unin_ai_status
print(f"PROMPT '{p}' => STATUS: {status}")
`;
    const res = await sendBridgeRPC('execute_bpy', { code, autoCapture: false });
    console.log(`Ran "${p}":`, res.success);
  }
}

testPrompts().catch(console.error);
