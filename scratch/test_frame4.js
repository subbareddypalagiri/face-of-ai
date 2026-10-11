const { sendBridgeRPC } = require('../src/main/tools/blenderAstraEngine');

async function main() {
  const code = `
import bpy
bpy.context.scene.frame_set(4)
head = bpy.data.objects.get("Suit_Head")
jaw_val = head.data.shape_keys.key_blocks["jawOpen"].value if head and head.data.shape_keys else 0
print("FRAME_4_JAW_VAL:", jaw_val)
bpy.context.scene.render.filepath = "C:/Users/subba/Desktop/Astra_Avatar_Speech_Frame4.png"
bpy.ops.render.render(write_still=True)
`;
  const res = await sendBridgeRPC('execute_bpy', { code, autoCapture: false });
  console.log("Render Result:", res.success, res.error);
}

main().catch(console.error);
