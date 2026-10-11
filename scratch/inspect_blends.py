import bpy
import os
import json

blend_files = [
    "scratch/benchmark/blends/furniture_chair.blend",
    "scratch/benchmark/blends/electronics_phone.blend",
    "scratch/benchmark/blends/architecture_house.blend",
    "scratch/benchmark/blends/transport_airplane.blend",
    "scratch/benchmark/blends/creatures_dragon.blend"
]

summary = {}

for bf in blend_files:
    abspath = os.path.abspath(bf)
    if not os.path.exists(abspath):
        summary[bf] = {"error": "File not found"}
        continue
    
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.wm.open_mainfile(filepath=abspath)
    
    objs = []
    for o in bpy.data.objects:
        custom_props = {k: str(v) for k, v in o.items() if not k.startswith('_')}
        mats = [s.material.name for s in o.material_slots if s.material]
        objs.append({
            "name": o.name,
            "type": o.type,
            "location": [round(x, 3) for x in list(o.location)],
            "parent": o.parent.name if o.parent else None,
            "custom_props": custom_props,
            "materials": mats
        })
    
    materials_info = []
    for m in bpy.data.materials:
        bsdf_color = None
        roughness = None
        metallic = None
        if m.use_nodes and m.node_tree:
            bsdf = m.node_tree.nodes.get('Principled BSDF')
            if bsdf:
                if 'Base Color' in bsdf.inputs:
                    bsdf_color = [round(x, 3) for x in list(bsdf.inputs['Base Color'].default_value)]
                if 'Roughness' in bsdf.inputs:
                    roughness = round(bsdf.inputs['Roughness'].default_value, 3)
                if 'Metallic' in bsdf.inputs:
                    metallic = round(bsdf.inputs['Metallic'].default_value, 3)
        materials_info.append({
            "name": m.name,
            "base_color": bsdf_color,
            "roughness": roughness,
            "metallic": metallic
        })
        
    summary[os.path.basename(bf)] = {
        "object_count": len(bpy.data.objects),
        "objects": objs,
        "materials": materials_info
    }

out_path = os.path.abspath("scratch/inspect_blends.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(summary, f, indent=2)

print(f"Inspection written to {out_path}")
