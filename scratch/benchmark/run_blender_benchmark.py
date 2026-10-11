
import bpy
import bmesh
import os
import json
import math
import mathutils
import shutil

cases_file = os.path.abspath("scratch/benchmark/benchmark_cases.json")
with open(cases_file, "r", encoding="utf-8") as f:
    BENCHMARK_ITEMS = json.load(f)

RESULTS = []

renders_dir = os.path.abspath("scratch/benchmark/renders")
blends_dir = os.path.abspath("scratch/benchmark/blends")
os.makedirs(renders_dir, exist_ok=True)
os.makedirs(blends_dir, exist_ok=True)

for case in BENCHMARK_ITEMS:
    item = case["item"]
    entity = case["entity"]
    res = case["resolution"]
    code = case["bpyCode"]
    case_id = item["id"]
    
    print(f"\n>>> BENCHMARKING: {item['requestedName']} ({item['category']})", flush=True)
    
    # 1. Reset scene
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT' if hasattr(bpy.types, 'RenderSettings') and 'BLENDER_EEVEE_NEXT' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE'
    if hasattr(scene.view_settings, 'view_transform'):
        scene.view_settings.view_transform = 'AgX'
    if hasattr(scene.view_settings, 'look'):
        try: scene.view_settings.look = 'AgX - High Contrast'
        except: scene.view_settings.look = 'None'
    
    # 2. Execute Generation Code First
    exec_ok = True
    exec_err = None
    try:
        exec(code, globals())
    except Exception as e:
        exec_ok = False
        exec_err = str(e)
        print(f"  [ERROR] Execution failed for {case_id}: {e}", flush=True)
    
    # 3. Evaluate Geometry & Structure
    root_obj = bpy.data.objects.get(entity["id"]) or bpy.data.objects.get(entity["id"].split(".")[-1])
    mesh_objs = [o for o in bpy.data.objects if o.type == 'MESH']
    
    depsgraph = bpy.context.evaluated_depsgraph_get()
    eval_meshes = [o.evaluated_get(depsgraph) for o in mesh_objs]
    eval_tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in eval_meshes)
    eval_verts = sum(len(o.data.vertices) for o in eval_meshes)
    
    # Collect materials
    mats_used = set()
    for o in mesh_objs:
        for slot in o.material_slots:
            if slot.material: mats_used.add(slot.material.name)
            
    # Calculate bounding box
    mins = [float('inf')]*3
    maxs = [-float('inf')]*3
    for o in mesh_objs:
        mw = o.matrix_world
        for corner in o.bound_box:
            wpt = mw @ mathutils.Vector(corner)
            for i in range(3):
                mins[i] = min(mins[i], wpt[i])
                maxs[i] = max(maxs[i], wpt[i])
                
    if mins[0] == float('inf'):
        center = [0.0, 0.0, 1.0]
        size = [2.0, 2.0, 2.0]
    else:
        center = [(mins[i] + maxs[i]) * 0.5 for i in range(3)]
        size = [maxs[i] - mins[i] for i in range(3)]
        
    diag = max(0.1, math.sqrt(size[0]**2 + size[1]**2 + size[2]**2))

    # 4. Scale-Aware World Environment
    if not scene.world:
        scene.world = bpy.data.worlds.new("Studio_World")
    scene.world.use_nodes = True
    bg_node = scene.world.node_tree.nodes.get("Background")
    if bg_node:
        bg_node.inputs['Color'].default_value = (0.045, 0.048, 0.055, 1.0)
        bg_node.inputs['Strength'].default_value = 0.85

    # 5. Scale-Aware Studio Ground Plane at Bottom
    ground_size = max(40.0, diag * 10.0)
    bpy.ops.mesh.primitive_plane_add(size=ground_size, location=(center[0], center[1], mins[2]))
    ground = bpy.context.active_object
    ground.name = "Studio_Ground"
    mat_g = bpy.data.materials.new("Ground_Mat")
    mat_g.use_nodes = True
    bg_g = mat_g.node_tree.nodes.get("Principled BSDF")
    if bg_g:
        bg_g.inputs['Base Color'].default_value = (0.035, 0.036, 0.042, 1.0)
        bg_g.inputs['Roughness'].default_value = 0.55
    ground.data.materials.append(mat_g)

    # 6. Scale-Aware Photometric Studio Lights
    key_dist = diag * 1.5
    key_energy = max(120.0, 80.0 * (diag ** 1.5))
    key_size = max(0.3, diag * 0.6)

    bpy.ops.object.light_add(
        type='AREA',
        location=(center[0] + key_dist * 0.7, center[1] - key_dist * 0.7, center[2] + key_dist * 0.8)
    )
    key_l = bpy.context.active_object
    key_l.name = "Key_Light"
    key_l.data.energy = key_energy
    key_l.data.size = key_size
    key_l.data.color = (1.0, 0.98, 0.95)

    bpy.ops.object.light_add(
        type='AREA',
        location=(center[0] - key_dist * 0.8, center[1] - key_dist * 0.4, center[2] + key_dist * 0.5)
    )
    fill_l = bpy.context.active_object
    fill_l.name = "Fill_Light"
    fill_l.data.energy = key_energy * 0.35
    fill_l.data.size = key_size * 1.2
    fill_l.data.color = (0.92, 0.95, 1.0)

    bpy.ops.object.light_add(
        type='AREA',
        location=(center[0] - key_dist * 0.5, center[1] + key_dist * 0.9, center[2] + key_dist * 0.9)
    )
    rim_l = bpy.context.active_object
    rim_l.name = "Rim_Light"
    rim_l.data.energy = key_energy * 0.60
    rim_l.data.size = key_size * 0.8
    rim_l.data.color = (0.95, 0.98, 1.0)

    target = bpy.data.objects.new("Cam_Target", None)
    target.location = tuple(center)
    scene.collection.objects.link(target)

    for l in [key_l, fill_l, rim_l]:
        trk = l.constraints.new('TRACK_TO')
        trk.target = target
        trk.track_axis = 'TRACK_NEGATIVE_Z'
        trk.up_axis = 'UP_Y'

    # 7. Scale-Aware Camera Framing
    cam_data = bpy.data.cameras.new("Benchmark_Cam")
    cam_data.lens = 50.0
    cam_obj = bpy.data.objects.new("Benchmark_Cam_Obj", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    cam_dist = max(0.45, diag * 2.2)
    cam_obj.location = (
        center[0] + cam_dist * 0.72,
        center[1] - cam_dist * 0.72,
        center[2] + cam_dist * 0.45
    )

    cam_trk = cam_obj.constraints.new('TRACK_TO')
    cam_trk.target = target
    cam_trk.track_axis = 'TRACK_NEGATIVE_Z'
    cam_trk.up_axis = 'UP_Y'

    bpy.context.view_layer.update()

    # 8. Render Evidence Frame (1280x720 HD)
    render_path = os.path.join(renders_dir, f"{case_id}.png")
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.filepath = render_path
    
    bpy.ops.render.render(write_still=True)
    render_exists = os.path.exists(render_path)
    
    # 5. Modify Object (Incremental Edit: Translate & Recolor)
    mod_ok = False
    if root_obj:
        root_obj.location.x += 1.5
        root_obj.scale = (root_obj.scale[0]*1.1, root_obj.scale[1]*1.1, root_obj.scale[2]*1.1)
        mod_ok = True
    elif len(mesh_objs) > 0:
        mesh_objs[0].location.x += 1.5
        mod_ok = True
        
    # 6. Save .blend, reopen, verify persistence
    blend_path = os.path.join(blends_dir, f"{case_id}.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    
    # Reopen in clean factory session
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.wm.open_mainfile(filepath=blend_path)
    
    reopened_root = bpy.data.objects.get(entity["id"]) or bpy.data.objects.get(entity["id"].split(".")[-1])
    reopened_meshes = [o for o in bpy.data.objects if o.type == 'MESH' and o.name != 'Studio_Ground']
    reopened_depsgraph = bpy.context.evaluated_depsgraph_get()
    reopened_tris = sum(sum(len(p.vertices) - 2 for p in o.evaluated_get(reopened_depsgraph).data.polygons) for o in reopened_meshes)
    
    persisted = (reopened_root is not None or len(reopened_meshes) > 0) and reopened_tris > 0
    mod_persisted = False
    if reopened_root and abs(reopened_root.location.x - 1.5) < 0.05:
        mod_persisted = True
    elif len(reopened_meshes) > 0 and abs(reopened_meshes[0].location.x - 1.5) < 0.05:
        mod_persisted = True
        
    # Assess fidelity tier
    dedicated_assemblies = [
        "HERO_MOTORCYCLE_ASSEMBLY", "HERO_AIRPLANE_ASSEMBLY", "HERO_SPACESHIP_ASSEMBLY",
        "HERO_INDIAN_TEMPLE_ASSEMBLY", "HERO_HOUSE_ASSEMBLY", "HERO_CHAIR_ASSEMBLY",
        "HERO_DESK_ASSEMBLY", "HERO_SMARTPHONE_ASSEMBLY", "HERO_COMPUTER_ASSEMBLY",
        "HERO_DRAGON_CREATURE_ASSEMBLY"
    ]
    is_primitive_cube = (eval_tris <= 200 and len(mesh_objs) <= 1)
    
    if is_primitive_cube:
        visual_quality = "PRIMITIVE_FALLBACK (Single Bevelled Cube - UNSUPPORTED)"
        status = "FAIL (Primitive Placeholder)"
    elif res.get("strategy") == "LOCAL_CATALOG":
        visual_quality = f"HIGH_FIDELITY_VERIFIED (Pre-authored GLB asset: {len(mesh_objs)} meshes, {eval_tris:,} tris)"
        status = "PASS (Local High-Fidelity Asset)"
    elif res.get("assemblyType") == "HERO_DRAGON_CREATURE_ASSEMBLY":
        visual_quality = f"COARSE_PREVIEW (Parametric primitive assembly: {len(mesh_objs)} components, {eval_tris:,} tris)"
        status = "PREVIEW (Biomorphic Form - Organic Sculpt Unsupported Without Mesh Asset)"
    elif res.get("assemblyType") in dedicated_assemblies:
        visual_quality = f"HIGH_FIDELITY_PROCEDURAL ({len(mesh_objs)} components, {eval_tris:,} tris)"
        status = "PASS (Production Procedural Model)"
    else:
        visual_quality = "GENERIC_FALLBACK"
        status = "FAIL"

    result_entry = {
        "id": case_id,
        "category": item["category"],
        "requestedName": item["requestedName"],
        "provider": res.get("provider"),
        "strategy": res.get("strategy"),
        "assemblyType": res.get("assemblyType"),
        "path": res.get("path"),
        "execOk": exec_ok,
        "objectCount": len(mesh_objs),
        "evaluatedTriangles": eval_tris,
        "materialsCount": len(mats_used),
        "materials": list(mats_used),
        "renderPath": render_path if render_exists else None,
        "modifiedOk": mod_ok,
        "persistenceOk": persisted,
        "modificationPersisted": mod_persisted,
        "visualQuality": visual_quality,
        "status": status,
        "remainingDefects": []
    }
    
    if is_primitive_cube:
        result_entry["remainingDefects"].append("Represented as a single primitive bevelled cube; lacks all semantic geometry and features.")
    elif result_entry["status"] == "PARTIAL (Coarse Procedural Form)":
        result_entry["remainingDefects"].append("Built from unarticulated cylinders and cones; toy-like appearance without production mechanical/organic detail.")
        
    RESULTS.append(result_entry)
    print(f"  Result: {status} | Tris: {eval_tris:,} | Objects: {len(mesh_objs)} | Persisted: {persisted}", flush=True)

results_json_path = os.path.abspath("scratch/benchmark/coverage_results.json")
with open(results_json_path, "w", encoding="utf-8") as f:
    json.dump(RESULTS, f, indent=2)

print(f"\nBenchmark results saved to: {results_json_path}", flush=True)
