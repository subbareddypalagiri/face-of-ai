const { sendBridgeRPC } = require('../src/main/tools/blenderAstraEngine');

async function main() {
  const code = `
import bpy
import json

head = bpy.data.objects.get("Suit_Head")
jaw = head.data.shape_keys.key_blocks.get("jawOpen") if head and head.data.shape_keys else None

val = jaw.value if jaw else None
drivers = [d.data_path for d in head.data.shape_keys.animation_data.drivers] if head and head.data.shape_keys and head.data.shape_keys.animation_data else []

# Check displaced vertices in jawOpen
diffs = []
if jaw:
    basis = head.data.shape_keys.key_blocks.get("Basis")
    for i in range(len(jaw.data)):
        b_co = basis.data[i].co
        j_co = jaw.data[i].co
        d = (j_co - b_co).length
        if d > 0.00001:
            diffs.append((i, d))

res = {
    "jaw_value": val,
    "drivers": drivers,
    "displaced_verts_count": len(diffs)
}

with open("C:/Users/subba/Desktop/jaw_diag.json", "w") as f:
    json.dump(res, f, indent=2)
`;
  const r = await sendBridgeRPC('execute_bpy', { code, autoCapture: false });
  console.log("Diag result:", r.success);
}

main().catch(console.error);
