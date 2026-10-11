# scratch/test_ferrari_real_asset_scene_v2.py
# Perfection-Tuned Hollywood Master Cinema Render for Ferrari
import bpy
import math
import mathutils
import os

print("[PERFECTION V2] Polishing Rosso Corsa Shaders, Wet Reflections & Cinematic Lighting...")

# 1. Clean reset
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# 2. Color Management & Engine
scene.render.engine = 'BLENDER_EEVEE'
scene.view_settings.view_transform = 'AgX'
try:
    scene.view_settings.look = 'AgX - High Contrast'
except Exception:
    pass

# 3. Midnight World Atmosphere
scene.world = bpy.data.worlds.new("Midnight_Circuit_World")
scene.world.use_nodes = True
w_nodes = scene.world.node_tree.nodes
w_links = scene.world.node_tree.links
w_nodes.clear()

w_out = w_nodes.new('ShaderNodeOutputWorld')
w_bg = w_nodes.new('ShaderNodeBackground')
w_bg.inputs['Color'].default_value = (0.004, 0.006, 0.014, 1.0)
w_bg.inputs['Strength'].default_value = 0.45
w_links.new(w_bg.outputs['Background'], w_out.inputs['Surface'])

# Volumetric Mist
w_vol = w_nodes.new('ShaderNodeVolumeScatter')
w_vol.inputs['Density'].default_value = 0.0012
w_vol.inputs['Anisotropy'].default_value = 0.75
w_vol.inputs['Color'].default_value = (0.75, 0.85, 1.0, 1.0)
w_links.new(w_vol.outputs['Volume'], w_out.inputs['Volume'])

# 4. Wet Racing Track with Reflective Puddles (45m x 45m)
bpy.ops.mesh.primitive_plane_add(size=45.0, location=(0, 0, 0))
track = bpy.context.view_layer.objects.active
track.name = "Wet_Racing_Track"

mat_track = bpy.data.materials.new(name="PBR_Wet_Asphalt_Track")
mat_track.use_nodes = True
t_nodes = mat_track.node_tree.nodes
t_links = mat_track.node_tree.links
t_nodes.clear()

t_out = t_nodes.new('ShaderNodeOutputMaterial')
t_bsdf = t_nodes.new('ShaderNodeBsdfPrincipled')
t_bsdf.inputs['Base Color'].default_value = (0.016, 0.016, 0.018, 1.0)
t_bsdf.inputs['Metallic'].default_value = 0.12

t_noise = t_nodes.new('ShaderNodeTexNoise')
t_noise.inputs['Scale'].default_value = 18.0
t_noise.inputs['Detail'].default_value = 6.0
t_ramp = t_nodes.new('ShaderNodeValToRGB')
t_ramp.color_ramp.elements[0].position = 0.35
t_ramp.color_ramp.elements[0].color = (0.005, 0.005, 0.005, 1.0) # Mirror puddle reflection
t_ramp.color_ramp.elements[1].position = 0.65
t_ramp.color_ramp.elements[1].color = (0.42, 0.42, 0.42, 1.0) # Wet tarmac

t_links.new(t_noise.outputs['Fac'], t_ramp.inputs['Fac'])
t_links.new(t_ramp.outputs['Color'], t_bsdf.inputs['Roughness'])
t_links.new(t_bsdf.outputs['BSDF'], t_out.inputs['Surface'])
track.data.materials.append(mat_track)

# Alternating Apex Racing Kerbs
for k_side in [-1, 1]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(k_side * 5.6, 0, 0.015))
    kerb = bpy.context.view_layer.objects.active
    kerb.name = f"Apex_Kerb_{k_side}"
    kerb.scale = (0.6, 24.0, 0.02)
    bpy.ops.object.transform_apply(scale=True)
    
    mat_kerb = bpy.data.materials.new(name=f"Racing_Kerb_Mat_{k_side}")
    mat_kerb.use_nodes = True
    k_bsdf = mat_kerb.node_tree.nodes.get("Principled BSDF")
    if k_bsdf:
        k_bsdf.inputs['Base Color'].default_value = (0.82, 0.04, 0.05, 1.0) if k_side < 0 else (0.90, 0.90, 0.90, 1.0)
        k_bsdf.inputs['Roughness'].default_value = 0.35
    kerb.data.materials.append(mat_kerb)

# 5. Ingest High-Poly Ferrari Asset
ferrari_glb_path = os.path.abspath("ferrari.glb").replace("\\", "/")
bpy.ops.import_scene.gltf(filepath=ferrari_glb_path)

# Group under Master Empty
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
ferrari_master = bpy.context.view_layer.objects.active
ferrari_master.name = "Ferrari_SF90_Master"

for obj in bpy.context.scene.objects:
    if obj.name != "Wet_Racing_Track" and not obj.name.startswith("Apex_Kerb") and obj != ferrari_master and obj.parent is None:
        obj.parent = ferrari_master

# Center Ferrari
ferrari_master.location = (0, 0, 0)
ferrari_master.rotation_euler = (0, 0, 0)

# 6. Apply Hollywood Master PBR Shaders
for mat in bpy.data.materials:
    if not mat.use_nodes or not mat.node_tree:
        continue
    m_name = mat.name.lower()
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if not bsdf:
        continue
        
    # A. Body Paint: Deep Rosso Corsa Multi-Layer Clearcoat
    if 'body' in m_name or 'main' in m_name:
        bsdf.inputs['Base Color'].default_value = (0.72, 0.005, 0.010, 1.0) # Deep Italian Racing Red
        bsdf.inputs['Metallic'].default_value = 0.15
        bsdf.inputs['Roughness'].default_value = 0.10
        if 'Coat Weight' in bsdf.inputs:
            bsdf.inputs['Coat Weight'].default_value = 1.0
            if 'Coat Roughness' in bsdf.inputs:
                bsdf.inputs['Coat Roughness'].default_value = 0.02
        elif 'Clearcoat' in bsdf.inputs:
            bsdf.inputs['Clearcoat'].default_value = 1.0
            if 'Clearcoat Roughness' in bsdf.inputs:
                bsdf.inputs['Clearcoat Roughness'].default_value = 0.02

    # B. Carbon Fiber Splitters & Trim
    elif 'carbon' in m_name:
        bsdf.inputs['Base Color'].default_value = (0.018, 0.018, 0.022, 1.0)
        bsdf.inputs['Metallic'].default_value = 0.88
        bsdf.inputs['Roughness'].default_value = 0.22

    # C. Glass (Windshield & Windows)
    elif 'glass' in m_name:
        bsdf.inputs['Base Color'].default_value = (0.010, 0.015, 0.025, 1.0)
        bsdf.inputs['Roughness'].default_value = 0.015
        bsdf.inputs['IOR'].default_value = 1.52
        if 'Transmission Weight' in bsdf.inputs:
            bsdf.inputs['Transmission Weight'].default_value = 0.94
        elif 'Transmission' in bsdf.inputs:
            bsdf.inputs['Transmission'].default_value = 0.94

    # D. Tires
    elif 'tire' in m_name or 'rubber' in m_name:
        bsdf.inputs['Base Color'].default_value = (0.018, 0.018, 0.018, 1.0)
        bsdf.inputs['Roughness'].default_value = 0.62

    # E. Star Alloy Rims
    elif 'rim' in m_name or 'wheel' in m_name or 'metal_gray' in m_name:
        bsdf.inputs['Base Color'].default_value = (0.65, 0.68, 0.72, 1.0)
        bsdf.inputs['Metallic'].default_value = 0.98
        bsdf.inputs['Roughness'].default_value = 0.10

    # F. Mirror Chrome (Cavallino Badge & Exhaust)
    elif 'chrome' in m_name:
        bsdf.inputs['Base Color'].default_value = (0.95, 0.95, 0.95, 1.0)
        bsdf.inputs['Metallic'].default_value = 1.0
        bsdf.inputs['Roughness'].default_value = 0.04

    # G. Brembo Calipers & Scuderia Shield (Giallo Modena)
    elif 'yellow' in m_name or 'ferrari_yellow' in m_name or 'brake' in m_name:
        bsdf.inputs['Base Color'].default_value = (0.98, 0.82, 0.02, 1.0)
        bsdf.inputs['Metallic'].default_value = 0.35
        bsdf.inputs['Roughness'].default_value = 0.16

    # H. LED Taillights (Crimson Glow)
    elif 'taillight' in m_name or 'lights_red' in m_name:
        bsdf.inputs['Base Color'].default_value = (1.0, 0.015, 0.025, 1.0)
        if 'Emission Color' in bsdf.inputs:
            bsdf.inputs['Emission Color'].default_value = (1.0, 0.015, 0.025, 1.0)
            bsdf.inputs['Emission Strength'].default_value = 35.0

    # I. Headlights & LEDs (Xenon Cool White)
    elif 'light' in m_name or 'led' in m_name or 'projector' in m_name:
        bsdf.inputs['Base Color'].default_value = (0.92, 0.96, 1.0, 1.0)
        if 'Emission Color' in bsdf.inputs:
            bsdf.inputs['Emission Color'].default_value = (0.80, 0.92, 1.0, 1.0)
            bsdf.inputs['Emission Strength'].default_value = 35.0

    # J. Interior Leather & Trim
    elif 'leather' in m_name or 'interior' in m_name or 'carpet' in m_name or 'plastic_gray' in m_name:
        bsdf.inputs['Base Color'].default_value = (0.035, 0.035, 0.040, 1.0)
        bsdf.inputs['Roughness'].default_value = 0.45

# 7. Cinematic Motivated Lighting Rig
# A. Xenon Forward Projection Spotlights
for hx in [-0.75, 0.75]:
    beam_data = bpy.data.lights.new(name=f"Xenon_Projector_Beam_{hx}", type='SPOT')
    beam_data.energy = 4200.0
    beam_data.spot_size = math.radians(65)
    beam_data.spot_blend = 0.35
    beam_data.color = (0.82, 0.92, 1.0)
    beam_obj = bpy.data.objects.new(name=f"Xenon_Spot_{hx}", object_data=beam_data)
    beam_obj.location = (hx, 2.2, 0.60)
    beam_obj.rotation_euler = (math.radians(-78), 0, 0)
    bpy.context.collection.objects.link(beam_obj)
    beam_obj.parent = ferrari_master

# B. Rear Crimson Taillight Ground Bounce Light
tl_bounce_data = bpy.data.lights.new(name="Rear_Taillight_Ground_Bounce", type='POINT')
tl_bounce_data.energy = 850.0
tl_bounce_data.color = (1.0, 0.02, 0.04)
tl_bounce_data.shadow_soft_size = 0.8
tl_bounce = bpy.data.objects.new("Rear_Bounce_Light", tl_bounce_data)
tl_bounce.location = (0, -2.6, 0.40)
bpy.context.collection.objects.link(tl_bounce)
tl_bounce.parent = ferrari_master

# C. Hollywood Master Studio Key Light (Cool Moonlight Key)
key_data = bpy.data.lights.new(name="Midnight_Moonlight_Key", type='AREA')
key_data.energy = 2400.0
key_data.size = 8.0
key_data.color = (0.95, 0.97, 1.0)
key_obj = bpy.data.objects.new("Midnight_Moonlight_Key", key_data)
key_obj.location = (-5.5, 4.2, 5.8)
key_obj.rotation_euler = (math.radians(-46), math.radians(-26), math.radians(30))
bpy.context.collection.objects.link(key_obj)

# D. Cyan Rim Kicker Light (Edge specular along red paint curve)
rim_data = bpy.data.lights.new(name="Midnight_Cyan_Rim", type='SPOT')
rim_data.energy = 3800.0
rim_data.spot_size = math.radians(52)
rim_data.color = (0.28, 0.72, 1.0)
rim_obj = bpy.data.objects.new("Midnight_Cyan_Rim", rim_data)
rim_obj.location = (5.5, -4.5, 5.5)
rim_obj.rotation_euler = (math.radians(48), math.radians(22), math.radians(-125))
bpy.context.collection.objects.link(rim_obj)

# E. Front Warm Fill Light (Gives Rosso Corsa rich deep radiance)
front_fill_data = bpy.data.lights.new(name="Front_Hero_Fill", type='AREA')
front_fill_data.energy = 1400.0
front_fill_data.size = 5.0
front_fill_data.color = (1.0, 0.94, 0.90)
front_fill = bpy.data.objects.new("Front_Hero_Fill", front_fill_data)
front_fill.location = (-2.8, 5.5, 2.5)
front_fill.rotation_euler = (math.radians(-32), math.radians(18), 0)
bpy.context.collection.objects.link(front_fill)

# 8. Tire Spray Smoke / Mist
mat_tire_smoke = bpy.data.materials.new(name="Atmospheric_Tire_Mist")
mat_tire_smoke.use_nodes = True
sm_bsdf = mat_tire_smoke.node_tree.nodes.get("Principled BSDF")
if sm_bsdf:
    sm_bsdf.inputs['Base Color'].default_value = (0.75, 0.82, 0.90, 1.0)
    sm_bsdf.inputs['Roughness'].default_value = 0.95
    if 'Transmission Weight' in sm_bsdf.inputs:
        sm_bsdf.inputs['Transmission Weight'].default_value = 0.80
    elif 'Transmission' in sm_bsdf.inputs:
        sm_bsdf.inputs['Transmission'].default_value = 0.80

for sx in [-1.02, 1.02]:
    bpy.ops.mesh.primitive_plane_add(size=1.5, location=(sx, -2.55, 0.26), rotation=(math.radians(35), 0, math.radians(12 if sx < 0 else -12)))
    smoke_mesh = bpy.context.view_layer.objects.active
    smoke_mesh.name = f"Tire_Spray_Mist_{sx}"
    smoke_mesh.data.materials.append(mat_tire_smoke)
    smoke_mesh.parent = ferrari_master

# 9. Low 3/4 Front Hero Cinema Camera (65mm Prime Lens, Anamorphic Bokeh)
cam_data = bpy.data.cameras.new("Hero_Ferrari_Camera")
cam_data.lens = 65.0
cam_data.sensor_width = 36.0
cam_data.dof.use_dof = True

cam_obj = bpy.data.objects.new("Camera", cam_data)
bpy.context.collection.objects.link(cam_obj)

# Front-Left 3/4 Low Hero Camera Angle
cam_obj.location = (-4.6, 5.0, 1.30)

# Target Track-To Constraint on Ferrari Front Hood
cam_target = bpy.data.objects.new("Cam_Target", None)
cam_target.location = (-0.10, 0.50, 0.52)
bpy.context.collection.objects.link(cam_target)

trk_con = cam_obj.constraints.new(type='TRACK_TO')
trk_con.target = cam_target
trk_con.track_axis = 'TRACK_NEGATIVE_Z'
trk_con.up_axis = 'UP_Y'

cam_dist = (cam_obj.location - cam_target.location).length
cam_data.dof.focus_distance = cam_dist
cam_data.dof.aperture_fstop = 3.2

scene.camera = cam_obj

# 10. Force MATERIAL Shading in Viewport
if hasattr(bpy.context, 'window_manager') and bpy.context.window_manager:
    for win in bpy.context.window_manager.windows:
        if hasattr(win, 'screen') and win.screen:
            for area in win.screen.areas:
                if area.type == 'VIEW_3D':
                    for space in area.spaces:
                        if space.type == 'VIEW_3D':
                            space.shading.type = 'MATERIAL'
                            space.shading.use_scene_lights = True
                            space.shading.use_scene_world = True

# 11. Save .blend file & render high-res image
workspace_dir = r"c:\Users\subba\Downloads\prime -ps\face of me"
blend_path = os.path.join(workspace_dir, "unin_cinematic_scene.blend")
render_path = os.path.join(workspace_dir, "unin_cinematic_render.png")

bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print(f"[SUCCESS] Saved master scene: {blend_path}")

scene.render.filepath = render_path
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
bpy.ops.render.render(write_still=True)
print(f"[SUCCESS] Rendered 1080p snapshot: {render_path}")
