# scratch/render_studio_chopper.py
import bpy
import bmesh
import math
import mathutils
import os
import sys

# Add script directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from build_high_fidelity_chopper import build_chopper_motorcycle, create_pbr_material

def setup_studio_and_render(output_path="scratch/test_chopper_render_v3.png"):
    scene = bpy.context.scene
    
    # Clear existing scene
    for obj in list(scene.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat, do_unlink=True)
        
    # Build Motorcycle at origin
    mc_root = build_chopper_motorcycle(
        entity_id="unin.entity.vehicle.chopper_motorcycle",
        base_loc=(0.0, 0.0, 0.0),
        paint_color=(0.58, 0.010, 0.020, 1.0) # Deep Candy Crimson Blood Red
    )
    
    # 1. Seamless Studio Cyclorama (Smooth curved studio backdrop)
    cyc_mesh = bpy.data.meshes.new("Studio_Cyc_Mesh")
    bm_cyc = bmesh.new()
    
    # Large smooth floor extending far behind and curving gently upward
    cyc_stations = [
        {"y": 8.0,  "z": 0.0},
        {"y": 0.0,  "z": 0.0},
        {"y": -3.5, "z": 0.0},
        {"y": -5.5, "z": 0.4},
        {"y": -7.2, "z": 1.6},
        {"y": -8.8, "z": 3.8},
        {"y": -9.8, "z": 6.5}
    ]
    w_cyc = 10.0
    cyc_rings = []
    for st in cyc_stations:
        v_l = bm_cyc.verts.new((-w_cyc, st["y"], st["z"]))
        v_r = bm_cyc.verts.new((w_cyc, st["y"], st["z"]))
        cyc_rings.append((v_l, v_r))
        
    for i in range(len(cyc_rings) - 1):
        r1 = cyc_rings[i]
        r2 = cyc_rings[i + 1]
        f = bm_cyc.faces.new((r1[0], r1[1], r2[1], r2[0]))
        f.smooth = True
        
    bm_cyc.to_mesh(cyc_mesh)
    bm_cyc.free()
    
    cyc_mesh.polygons.foreach_set('use_smooth', [True] * len(cyc_mesh.polygons))
    cyc_obj = bpy.data.objects.new("Studio_Cyc_Floor", cyc_mesh)
    scene.collection.objects.link(cyc_obj)
    
    # Dark graphite automotive showroom floor (matte reflection, clear contact shadows)
    mat_floor = create_pbr_material("Studio_Cyc_Material", (0.040, 0.042, 0.046, 1.0), metallic=0.15, roughness=0.45, specular=0.35)
    cyc_obj.data.materials.append(mat_floor)
    sub_cyc = cyc_obj.modifiers.new("Subsurf", 'SUBSURF')
    sub_cyc.levels = 2
    
    # 2. Balanced 4-Point Automotive Studio Lighting
    target = mathutils.Vector((0.0, 0.06, 0.55))
    
    # Softbox Key Light (Overhead-Right-Front, soft warm highlight along tank crest)
    bpy.ops.object.light_add(type='AREA', location=(2.8, 2.4, 2.7))
    key_light = bpy.context.view_layer.objects.active
    key_light.name = "Key_Light_Softbox"
    key_light.data.energy = 1350.0
    key_light.data.size = 3.4
    key_light.data.size_y = 2.0
    key_light.data.color = (1.0, 0.98, 0.95)
    diff_key = target - key_light.location
    key_light.rotation_euler = mathutils.Vector((0, 0, -1)).rotation_difference(diff_key.normalized()).to_euler()

    # Softbox Fill Light (Opposite side, soft cool fill)
    bpy.ops.object.light_add(type='AREA', location=(-3.2, 0.8, 2.0))
    fill_light = bpy.context.view_layer.objects.active
    fill_light.name = "Fill_Light_Softbox"
    fill_light.data.energy = 420.0
    fill_light.data.size = 3.8
    fill_light.data.size_y = 2.6
    fill_light.data.color = (0.90, 0.94, 1.0)
    diff_fill = target - fill_light.location
    fill_light.rotation_euler = mathutils.Vector((0, 0, -1)).rotation_difference(diff_fill.normalized()).to_euler()

    # Rim / Kicker Light (High behind motorcycle, catching exhaust pipes, rear wheel, handlebars)
    bpy.ops.object.light_add(type='AREA', location=(-1.8, -3.2, 2.6))
    rim_light = bpy.context.view_layer.objects.active
    rim_light.name = "Rim_Kicker_Light"
    rim_light.data.energy = 1900.0
    rim_light.data.size = 4.2
    rim_light.data.size_y = 1.2
    rim_light.data.color = (0.96, 0.98, 1.0)
    diff_rim = target - rim_light.location
    rim_light.rotation_euler = mathutils.Vector((0, 0, -1)).rotation_difference(diff_rim.normalized()).to_euler()
    
    # Overhead Length Strip Light
    bpy.ops.object.light_add(type='AREA', location=(0.2, 0.1, 3.5))
    top_light = bpy.context.view_layer.objects.active
    top_light.name = "Overhead_Strip_Light"
    top_light.data.energy = 750.0
    top_light.data.size = 1.2
    top_light.data.size_y = 4.0
    top_light.data.color = (1.0, 1.0, 1.0)
    top_light.rotation_euler = (math.radians(180), 0, 0)
    
    # Front Wheel Accent Light (Fills front rim and spokes)
    bpy.ops.object.light_add(type='AREA', location=(2.0, 1.9, 0.6))
    wheel_light = bpy.context.view_layer.objects.active
    wheel_light.name = "Front_Wheel_Accent"
    wheel_light.data.energy = 280.0
    wheel_light.data.size = 1.4
    wheel_light.data.color = (1.0, 0.98, 0.95)
    diff_wl = mathutils.Vector((0.0, 0.95, 0.36)) - wheel_light.location
    wheel_light.rotation_euler = mathutils.Vector((0, 0, -1)).rotation_difference(diff_wl.normalized()).to_euler()

    # 3. Ambient World (Neutral dark studio background)
    scene.world.use_nodes = True
    bg_node = scene.world.node_tree.nodes.get('Background')
    if bg_node:
        bg_node.inputs['Color'].default_value = (0.020, 0.022, 0.026, 1.0)
        bg_node.inputs['Strength'].default_value = 0.4

    # 4. Professional Three-Quarter Front Automotive Cinema Camera
    cam_data = bpy.data.cameras.new("Cinema_Camera")
    cam_data.lens = 52.0  # 52mm cinema prime
    cam_data.sensor_width = 36.0
    cam_obj = bpy.data.objects.new("unin.camera.primary", cam_data)
    cam_obj["unin_id"] = "unin.camera.primary"
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    
    # Distance ~4.3m, comfortable safe margin, perfectly framed
    cam_pos = mathutils.Vector((3.45, 2.55, 0.95))
    cam_obj.location = cam_pos
    
    # Precision Track To target at motorcycle visual center
    track_empty = bpy.data.objects.new("Camera_Look_Target", None)
    track_empty.location = target
    scene.collection.objects.link(track_empty)
    
    tt = cam_obj.constraints.new('TRACK_TO')
    tt.target = track_empty
    tt.track_axis = 'TRACK_NEGATIVE_Z'
    tt.up_axis = 'UP_Y'
    
    # 5. Render Settings
    scene.render.engine = 'BLENDER_EEVEE_NEXT' if hasattr(bpy.types, 'RenderSettings') and 'BLENDER_EEVEE_NEXT' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE'
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100
    scene.render.filepath = os.path.abspath(output_path)
    
    # AgX Color Management
    if hasattr(scene.view_settings, 'view_transform'):
        scene.view_settings.view_transform = 'AgX'
    if hasattr(scene.view_settings, 'look'):
        try:
            scene.view_settings.look = 'AgX - High Contrast'
        except Exception:
            scene.view_settings.look = 'None'
            
    print(f"Rendering 1080p frame to: {output_path}...")
    bpy.ops.render.render(write_still=True)
    print("Render complete!")

if __name__ == "__main__":
    setup_studio_and_render()
