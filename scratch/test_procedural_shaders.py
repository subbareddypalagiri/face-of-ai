import bpy
import bmesh
import os
import math
import mathutils

out_dir = os.path.abspath("scratch/test_procedural_upgrades")
os.makedirs(out_dir, exist_ok=True)

def setup_studio_world_and_rig(scene, center, size):
    diag = max(0.1, math.sqrt(size[0]**2 + size[1]**2 + size[2]**2))
    
    # 1. Clean existing lights, cameras, ground
    for o in list(bpy.data.objects):
        if o.type in ['LIGHT', 'CAMERA'] or o.name in ['Studio_Ground', 'Cam_Target']:
            bpy.data.objects.remove(o, do_unlink=True)
            
    # 2. Studio World with neutral soft environment radiance
    if not scene.world:
        scene.world = bpy.data.worlds.new("Studio_World")
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0.042, 0.045, 0.052, 1.0)
        bg.inputs['Strength'].default_value = 0.85
        
    # 3. Ground plane
    ground_size = max(50.0, diag * 10.0)
    mins_z = center[2] - size[2]*0.5
    bpy.ops.mesh.primitive_plane_add(size=ground_size, location=(center[0], center[1], mins_z))
    ground = bpy.context.active_object
    ground.name = "Studio_Ground"
    mat_g = bpy.data.materials.new("Ground_Mat")
    mat_g.use_nodes = True
    bsdf_g = mat_g.node_tree.nodes.get("Principled BSDF")
    if bsdf_g:
        bsdf_g.inputs['Base Color'].default_value = (0.030, 0.032, 0.038, 1.0)
        bsdf_g.inputs['Roughness'].default_value = 0.55
    ground.data.materials.append(mat_g)
    
    # 4. Target Empty
    target = bpy.data.objects.new("Cam_Target", None)
    target.location = tuple(center)
    scene.collection.objects.link(target)
    
    # 5. Photometric Area Lights
    key_dist = max(0.8, diag * 1.55)
    key_energy = max(140.0, 75.0 * (diag ** 1.5))
    key_size = max(0.35, diag * 0.65)
    
    # Key Light (Front-Left, High)
    bpy.ops.object.light_add(type='AREA', location=(center[0] + key_dist*0.72, center[1] - key_dist*0.72, center[2] + key_dist*0.85))
    key_l = bpy.context.active_object
    key_l.name = "Key_Light"
    key_l.data.energy = key_energy
    key_l.data.size = key_size
    key_l.data.color = (1.0, 0.98, 0.95)
    trk = key_l.constraints.new('TRACK_TO')
    trk.target = target
    trk.track_axis = 'TRACK_NEGATIVE_Z'
    trk.up_axis = 'UP_Y'
    
    # Fill Light (Front-Right, Softer)
    bpy.ops.object.light_add(type='AREA', location=(center[0] - key_dist*0.82, center[1] - key_dist*0.45, center[2] + key_dist*0.48))
    fill_l = bpy.context.active_object
    fill_l.name = "Fill_Light"
    fill_l.data.energy = key_energy * 0.38
    fill_l.data.size = key_size * 1.3
    fill_l.data.color = (0.92, 0.95, 1.0)
    trk = fill_l.constraints.new('TRACK_TO')
    trk.target = target
    trk.track_axis = 'TRACK_NEGATIVE_Z'
    trk.up_axis = 'UP_Y'
    
    # Rim Light (Back-High, Accent Silhouette)
    bpy.ops.object.light_add(type='AREA', location=(center[0] - key_dist*0.45, center[1] + key_dist*0.95, center[2] + key_dist*0.95))
    rim_l = bpy.context.active_object
    rim_l.name = "Rim_Light"
    rim_l.data.energy = key_energy * 0.65
    rim_l.data.size = key_size * 0.85
    rim_l.data.color = (0.95, 0.98, 1.0)
    trk = rim_l.constraints.new('TRACK_TO')
    trk.target = target
    trk.track_axis = 'TRACK_NEGATIVE_Z'
    trk.up_axis = 'UP_Y'
    
    # 6. Scale-Aware Camera
    cam_data = bpy.data.cameras.new("Benchmark_Cam")
    cam_data.lens = 75.0 if diag < 0.6 else 50.0
    cam_obj = bpy.data.objects.new("Benchmark_Cam_Obj", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    
    cam_dist = max(0.40, diag * 2.15)
    cam_obj.location = (
        center[0] + cam_dist * 0.72,
        center[1] - cam_dist * 0.72,
        center[2] + cam_dist * 0.44
    )
    trk = cam_obj.constraints.new('TRACK_TO')
    trk.target = target
    trk.track_axis = 'TRACK_NEGATIVE_Z'
    trk.up_axis = 'UP_Y'
    
    bpy.context.view_layer.update()
    return cam_obj

# Shader Creation Helpers
def make_procedural_wood(mat_name, base_c1=(0.42, 0.25, 0.12, 1.0), base_c2=(0.28, 0.15, 0.07, 1.0)):
    mat = bpy.data.materials.new(name=mat_name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    
    # Wave Texture for Wood Rings
    tex_wave = nodes.new("ShaderNodeTexWave")
    tex_wave.wave_type = 'BANDS'
    tex_wave.rings_direction = 'Z'
    tex_wave.inputs['Scale'].default_value = 4.5
    tex_wave.inputs['Distortion'].default_value = 2.8
    tex_wave.inputs['Detail'].default_value = 3.0
    
    # Color Ramp for warm tones
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.2
    ramp.color_ramp.elements[0].color = base_c2
    ramp.color_ramp.elements[1].position = 0.8
    ramp.color_ramp.elements[1].color = base_c1
    links.new(tex_wave.outputs['Color'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    
    # Micro bump
    bump = nodes.new("ShaderNodeBump")
    bump.inputs['Strength'].default_value = 0.08
    bump.inputs['Distance'].default_value = 0.02
    links.new(tex_wave.outputs['Color'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    
    bsdf.inputs['Roughness'].default_value = 0.38
    return mat

def make_procedural_leather(mat_name, base_col=(0.02, 0.02, 0.025, 1.0)):
    mat = bpy.data.materials.new(name=mat_name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs['Base Color'].default_value = base_col
    bsdf.inputs['Roughness'].default_value = 0.52
    
    tex_voronoi = nodes.new("ShaderNodeTexVoronoi")
    tex_voronoi.feature = 'F1'
    tex_voronoi.inputs['Scale'].default_value = 65.0
    
    bump = nodes.new("ShaderNodeBump")
    bump.inputs['Strength'].default_value = 0.12
    bump.inputs['Distance'].default_value = 0.005
    links.new(tex_voronoi.outputs['Distance'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    return mat

print("Helper defined")
