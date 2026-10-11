import bpy

scene = bpy.context.scene
depsgraph = bpy.context.evaluated_depsgraph_get()

print("=== GEOMETRY AUDIT START ===")

total_scene_raw_tris = 0
total_scene_eval_tris = 0

hero_raw_tris = 0
hero_eval_tris = 0

for obj in scene.objects:
    if obj.type == 'MESH':
        raw_polys = len(obj.data.polygons)
        raw_tris = sum(len(p.vertices) - 2 for p in obj.data.polygons)
        total_scene_raw_tris += raw_tris
        
        eval_obj = obj.evaluated_get(depsgraph)
        eval_mesh = eval_obj.to_mesh()
        eval_tris = len(eval_mesh.loop_triangles) if len(eval_mesh.loop_triangles) > 0 else sum(len(p.vertices) - 2 for p in eval_mesh.polygons)
        total_scene_eval_tris += eval_tris
        
        is_hero = 'hero_motorcycle' in obj.name or obj.get('unin_id', '').startswith('hero_motorcycle')
        if is_hero:
            hero_raw_tris += raw_tris
            hero_eval_tris += eval_tris
            mods = [f"{m.name}({m.type})" for m in obj.modifiers]
            print(f"HERO_PART: {obj.name:36} | Raw Tris: {raw_tris:6} | Eval Tris: {eval_tris:6} | Modifiers: {mods}")
        eval_obj.to_mesh_clear()

print(f"TOTAL_HERO_RAW_TRIS: {hero_raw_tris}")
print(f"TOTAL_HERO_EVAL_TRIS: {hero_eval_tris}")
print(f"TOTAL_SCENE_RAW_TRIS: {total_scene_raw_tris}")
print(f"TOTAL_SCENE_EVAL_TRIS: {total_scene_eval_tris}")
print("=== GEOMETRY AUDIT END ===")
