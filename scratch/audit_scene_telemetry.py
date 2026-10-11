# scratch/audit_scene_telemetry.py — Deep Diagnostic Audit Script
import bpy
import json
import math

def audit():
    scene = bpy.context.scene
    cam = scene.camera
    
    report = {
        "scene_name": scene.name,
        "render_engine": scene.render.engine,
        "active_camera": cam.name if cam else None,
        "objects_count": len(scene.objects),
        "timeline": {
            "start": scene.frame_start,
            "end": scene.frame_end,
            "current": scene.frame_current,
            "fps": scene.render.fps
        },
        "camera_eval": {},
        "geometry": {},
        "materials": {},
        "vfx_rain": {},
        "physics": {}
    }
    
    # 1. Camera Animation & Trajectory Evaluation
    if cam:
        report["camera_eval"]["name"] = cam.name
        report["camera_eval"]["type"] = cam.type
        report["camera_eval"]["has_anim"] = bool(cam.animation_data and cam.animation_data.action)
        if cam.animation_data and cam.animation_data.action:
            act = cam.animation_data.action
            report["camera_eval"]["action_name"] = act.name
            fcurves_count = len(getattr(act, 'fcurves', []))
            report["camera_eval"]["fcurves_count"] = fcurves_count
            keyframes = []
            for fc in getattr(act, 'fcurves', []):
                for kp in fc.keyframe_points:
                    keyframes.append({
                        "data_path": fc.data_path,
                        "array_index": fc.array_index,
                        "frame": kp.co[0],
                        "value": round(kp.co[1], 4),
                        "interpolation": kp.interpolation
                    })
            report["camera_eval"]["keyframes"] = keyframes
        
        # Evaluate evaluated camera transform across frames
        transforms_by_frame = {}
        for f in [1, 30, 60, 90, 120]:
            scene.frame_set(f)
            # force depsgraph update
            depsgraph = bpy.context.evaluated_depsgraph_get()
            eval_cam = cam.evaluated_get(depsgraph)
            transforms_by_frame[f] = {
                "location": [round(v, 4) for v in eval_cam.location],
                "matrix_world_translation": [round(eval_cam.matrix_world.translation[i], 4) for i in range(3)]
            }
        report["camera_eval"]["frame_transforms"] = transforms_by_frame

    # 2. Geometry & Triangle Counts (Hero vs Scene, Base vs Evaluated after Modifiers)
    depsgraph = bpy.context.evaluated_depsgraph_get()
    
    hero_raw_tris = 0
    hero_eval_tris = 0
    hero_objects = []
    
    scene_raw_tris = 0
    scene_eval_tris = 0
    
    for obj in scene.objects:
        if obj.type == 'MESH':
            # Raw mesh triangles
            raw_polys = len(obj.data.polygons)
            # Estimate raw tris: sum of triangles in polygons
            raw_tris = sum(len(p.vertices) - 2 for p in obj.data.polygons) if obj.data.polygons else 0
            scene_raw_tris += raw_tris
            
            # Evaluated mesh triangles (with subdivision, decimate, etc.)
            eval_obj = obj.evaluated_get(depsgraph)
            eval_mesh = eval_obj.to_mesh()
            eval_tris = len(eval_mesh.loop_triangles) if eval_mesh.loop_triangles else sum(len(p.vertices) - 2 for p in eval_mesh.polygons)
            scene_eval_tris += eval_tris
            eval_obj.to_mesh_clear()
            
            is_hero = 'hero_motorcycle' in obj.name or 'motorcycle' in obj.name.lower() or obj.get('unin_id', '').startswith('hero_motorcycle')
            if is_hero:
                hero_raw_tris += raw_tris
                hero_eval_tris += eval_tris
                hero_objects.append({
                    "name": obj.name,
                    "unin_id": obj.get('unin_id'),
                    "raw_tris": raw_tris,
                    "eval_tris": eval_tris,
                    "modifiers": [{"name": m.name, "type": m.type} for m in obj.modifiers]
                })

    report["geometry"] = {
        "hero_motorcycle": {
            "components_count": len(hero_objects),
            "raw_triangles": hero_raw_tris,
            "evaluated_triangles": hero_eval_tris,
            "components": hero_objects
        },
        "scene_totals": {
            "total_raw_triangles": scene_raw_tris,
            "total_evaluated_triangles": scene_eval_tris,
            "mesh_objects_count": len([o for o in scene.objects if o.type == 'MESH'])
        }
    }

    # 3. Materials, Textures, UVs
    mat_reports = []
    for mat in bpy.data.materials:
        mat_info = {
            "name": mat.name,
            "use_nodes": mat.use_nodes,
            "nodes": [],
            "image_textures": [],
            "has_uv_map": False
        }
        if mat.use_nodes and mat.node_tree:
            for node in mat.node_tree.nodes:
                mat_info["nodes"].append({"name": node.name, "type": node.type})
                if node.type == 'TEX_IMAGE':
                    mat_info["image_textures"].append({
                        "name": node.name,
                        "image": node.image.name if node.image else None,
                        "filepath": node.image.filepath if node.image else None
                    })
        mat_reports.append(mat_info)
    report["materials"] = mat_reports

    # Check UV maps on meshes
    uv_summary = {}
    for obj in scene.objects:
        if obj.type == 'MESH':
            uv_summary[obj.name] = {
                "uv_layers_count": len(obj.data.uv_layers),
                "uv_layer_names": [l.name for l in obj.data.uv_layers]
            }
    report["uv_maps"] = uv_summary

    # 4. VFX Rain System
    rain_obj = scene.objects.get("unin.vfx.rain_emitter")
    if rain_obj:
        report["vfx_rain"]["emitter_found"] = True
        report["vfx_rain"]["dimensions"] = [round(v, 2) for v in rain_obj.dimensions]
        report["vfx_rain"]["location"] = [round(v, 2) for v in rain_obj.location]
        report["vfx_rain"]["particle_systems"] = []
        for ps in rain_obj.particle_systems:
            pset = ps.settings
            report["vfx_rain"]["particle_systems"].append({
                "name": ps.name,
                "count": pset.count,
                "frame_start": pset.frame_start,
                "frame_end": pset.frame_end,
                "render_type": pset.render_type,
                "instance_object": pset.instance_object.name if pset.instance_object else None
            })
    else:
        report["vfx_rain"]["emitter_found"] = False

    # 5. Physics Systems
    physics_objects = []
    for obj in scene.objects:
        if obj.rigid_body:
            physics_objects.append({
                "name": obj.name,
                "type": "RIGID_BODY",
                "body_type": obj.rigid_body.type,
                "mass": obj.rigid_body.mass,
                "collision_shape": obj.rigid_body.collision_shape
            })
        for mod in obj.modifiers:
            if mod.type in ['CLOTH', 'SOFT_BODY', 'FLUID', 'COLLISION']:
                physics_objects.append({
                    "name": obj.name,
                    "type": mod.type,
                    "modifier_name": mod.name
                })
    report["physics"]["objects"] = physics_objects

    print("AUDIT_JSON_START")
    print(json.dumps(report, indent=2))
    print("AUDIT_JSON_END")

if __name__ == '__main__':
    audit()
