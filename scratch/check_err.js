const { sendBridgeRPC } = require('../src/main/tools/blenderAstraEngine');

async function check() {
  const code = `
import bpy
bpy.context.scene.unin_ai_prompt = "red neon glow"
bpy.ops.unin.execute_ai_prompt()
`;
  const res = await sendBridgeRPC('execute_bpy', { code, autoCapture: false });
  console.log("SUCCESS:", res.success);
  console.log("ERROR:", JSON.stringify(res.error, null, 2));
}

check().catch(console.error);
