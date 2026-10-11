const { sendBridgeRPC } = require('../src/main/tools/blenderAstraEngine');

async function main() {
  const code = `
import bpy
import json

head = bpy.data.objects.get("Suit_Head")
keys = [kb.name for kb in head.data.shape_keys.key_blocks] if head and head.data.shape_keys else []
print("CURRENT_LIVE_KEYS:", keys)

# Check active actions
actions = [a.name for a in bpy.data.actions]
print("ACTIONS:", actions)

# Check armatures
arm = None
for o in bpy.context.scene.objects:
    if o.type == 'ARMATURE':
        arm = o
        break

status = {
    "has_head": head is not None,
    "shape_keys": keys,
    "actions": actions,
    "active_action": arm.animation_data.action.name if arm and arm.animation_data and arm.animation_data.action else None
}

with open("C:/Users/subba/Desktop/live_avatar_status.json", "w") as f:
    json.dump(status, f, indent=2)
`;

  const res = await sendBridgeRPC('execute_bpy', { code, autoCapture: false });
  console.log("EXECUTE RESULT:", res.success, res.error);
}

main().catch(console.error);
