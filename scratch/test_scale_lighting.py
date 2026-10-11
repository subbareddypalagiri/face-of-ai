import bpy
import bmesh
import os
import math
import mathutils

test_cases = [
    ("electronics_phone", "scratch/benchmark/blends/electronics_phone.blend"),
    ("transport_airplane", "scratch/benchmark/blends/transport_airplane.blend"),
    ("architecture_house", "scratch/benchmark/blends/architecture_house.blend")
]

out_dir = os.path.abspath("scratch/test_scale_renders")
os.makedirs(out_dir, exist_ok=True)

for case_id, blend_path in test_cases:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(blend_path))
    
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT' if hasattr(bpy.types, 'RenderSettings') and 'BLENDER_EEVEE_NEXT' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE'
    if hasattr(scene.view_settings, 'view_transform'):
        scene.view_settings.view_transform = 'AgX'
    if hasattr(scene.view_settings, 'look'):
        try: scene.view_settings.look = 'AgX - High Contrast'
        except: pass
        
    # Remove existing benchmark cameras and lights
    for o in list(bpy.data.objects):
        if o.type in ['LIGHT', 'CAMERA'] or o.name in ['Studio_Ground', 'Cam_Target']:
            bpy.data.objects.remove(o, do_unlink=True)
            
    # Calculate subject bounding box
    mesh_objs = [o for o in bpy.data.objects if o.type == 'MESH']
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
    
    # 1. World Neutral Studio Environment
    if not scene.world:
        scene.world = bpy.data.worlds.new("Studio_World")
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0.045, 0.048, 0.055, 1.0)
        bg.inputs['Strength'].default_value = 0.85
        
    # 2. Scale-Aware Studio Ground
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
    
    # 3. Scale-Aware Photometric Studio Lights
    # Key Light
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
    
    # Fill Light
    bpy.ops.object.light_add(
        type='AREA',
        location=(center[0] - key_dist * 0.8, center[1] - key_dist * 0.4, center[2] + key_dist * 0.5)
    )
    fill_l = bpy.context.active_object
    fill_l.name = "Fill_Light"
    fill_l.data.energy = key_energy * 0.35
    fill_l.data.size = key_size * 1.2
    fill_l.data.color = (0.92, 0.95, 1.0)
    
    # Rim Light
    bpy.ops.object.light_add(
        type='AREA',
        location=(center[0] - key_dist * 0.5, center[1] + key_dist * 0.9, center[2] + key_dist * 0.9)
    )
    rim_l = bpy.context.active_object
    rim_l.name = "Rim_Light"
    rim_l.data.energy = key_energy * 0.60
    rim_l.data.size = key_size * 0.8
    rim_l.data.color = (0.95, 0.98, 1.0)
    
    # Track lights to center
    target = bpy.data.objects.new("Cam_Target", None)
    target.location = tuple(center)
    scene.collection.objects.link(target)
    
    for l in [key_l, fill_l, rim_l]:
        trk = l.constraints.new('TRACK_TO')
        trk.target = target
        trk.track_axis = 'TRACK_NEGATIVE_Z'
        trk.up_axis = 'UP_Y'
        
    # 4. Scale-Aware Camera Framing
    cam_data = bpy.data.cameras.new("Benchmark_Cam")
    cam_data.lens = 50.0 if diag > 0.5 else 75.0  # Macro lens for tiny items
    cam_obj = bpy.data.objects.new("Benchmark_Cam_Obj", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    
    cam_dist = max(0.28, diag * 1.85)
    cam_obj.location = (
        center[0] + cam_dist * 0.72,
        center[1] - cam_dist * 0.72,
        center[2] + cam_dist * 0.45
    )
    
    trk = cam_obj.constraints.new('TRACK_TO')
    trk.target = target
    trk.track_axis = 'TRACK_NEGATIVE_Z'
    trk.up_axis = 'UP_Y'
    
    bpy.context.view_layer.update()
    
    # Render
    render_path = os.path.join(out_dir, f"{case_id}_scale_test.png")
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.render.filepath = render_path
    bpy.ops.render.render(write_still=True)
    print(f"Rendered {case_id} -> {render_path}")

print("Scale test complete!")
