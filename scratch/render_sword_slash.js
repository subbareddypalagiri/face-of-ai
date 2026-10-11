const { sendBridgeRPC } = require('../src/main/tools/blenderAstraEngine');

async function renderSwordSlash() {
  const code = `
import bpy
bpy.context.scene.frame_set(25)
bpy.context.scene.render.filepath = "C:/Users/subba/Desktop/Blender_InApp_Copilot_SwordSlash.png"
bpy.ops.render.render(write_still=True)
`;
  const res = await sendBridgeRPC('execute_bpy', { code, autoCapture: false });
  console.log("Render Result:", res.success);
}

renderSwordSlash().catch(console.error);
