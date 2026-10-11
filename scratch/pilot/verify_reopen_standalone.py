
import bpy
import json
import sys

# Scene Inspection in Fresh Process
data = {
    "file": bpy.data.filepath,
    "objects_count": len(bpy.context.scene.objects),
    "objects": [],
    "materials_count": len(bpy.data.materials),
    "materials": [m.name for m in bpy.data.materials],
    "unin_ids": []
}

for o in bpy.context.scene.objects:
    uid = o.get("unin_id", None)
    if uid:
        data["unin_ids"].append(uid)
    data["objects"].append({
        "name": o.name,
        "type": o.type,
        "unin_id": uid,
        "location": [round(v, 3) for v in o.location]
    })

# Render Still in Standalone Process
scene = bpy.context.scene
scene.render.filepath = r"C:/Users/subba/Downloads/prime -ps/face of me/scratch/pilot/unin_pilot_scenario_e_reopened.png"
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
if hasattr(scene, 'eevee') and hasattr(scene.eevee, 'taa_render_samples'):
    scene.eevee.taa_render_samples = 16
bpy.ops.render.render(write_still=True)

print("STANDALONE_REOPEN_DATA_START:" + json.dumps(data) + ":STANDALONE_REOPEN_DATA_END")
