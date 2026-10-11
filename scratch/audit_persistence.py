# scratch/audit_persistence.py — Test persistence by reopening .blend file
import bpy

scene = bpy.context.scene

report = {
    "file_read_success": True,
    "objects_count": len(scene.objects),
    "tagged_entity_count": sum(1 for o in scene.objects if o.get("unin_id")),
    "modifiers_survived": [],
    "materials_survived": [m.name for m in bpy.data.materials if not m.name.startswith("Dots")],
    "vfx_emitter_survived": "unin.vfx.rain_emitter" in scene.objects,
    "animation_survived": bool(scene.camera and scene.camera.animation_data and scene.camera.animation_data.action)
}

for o in scene.objects:
    for m in o.modifiers:
        report["modifiers_survived"].append(f"{o.name}:{m.name}({m.type})")

print("=== PERSISTENCE AUDIT START ===")
import json
print(json.dumps(report, indent=2))
print("=== PERSISTENCE AUDIT END ===")
