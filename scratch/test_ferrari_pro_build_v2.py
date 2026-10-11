# scratch/test_ferrari_pro_build_v2.py
# Refined FAANG-Grade Ferrari SF90 Stradale Procedural Construction
import bpy
import math
import mathutils
import os

print("[TEST V2] Starting Refined Ferrari SF90 Procedural Build...")

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

# 3. Environment & Wet Racing Circuit
scene.world = bpy.data.worlds.new("Midnight_Racing_World")
scene.world.use_nodes = True
w_nodes = scene.world.node_tree.nodes
w_links = scene.world.node_tree.links
w_nodes.clear()

w_out = w_nodes.new('ShaderNodeOutputWorld')
w_bg = w_nodes.new('ShaderNodeBackground')
w_bg.inputs['Color'].default_value = (0.010, 0.014, 0.028, 1.0) # Deep midnight navy sky
w_bg.inputs['Strength'].default_value = 0.45
w_links.new(w_bg.outputs['Background'], w_out.inputs['Surface'])

# Volumetric Fog
w_vol = w_nodes.new('ShaderNodeVolumeScatter')
w_vol.inputs['Density'].default_value = 0.012
w_vol.inputs['Anisotropy'].default_value = 0.70
w_vol.inputs['Color'].default_value = (0.80, 0.88, 1.0, 1.0)
w_links.new(w_vol.outputs['Volume'], w_out.inputs['Volume'])

# 4. Wet Racing Track Ground Plane (45m x 45m)
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
t_bsdf.inputs['Base Color'].default_value = (0.022, 0.022, 0.025, 1.0) # Dark aggregate tarmac
t_bsdf.inputs['Metallic'].default_value = 0.06

t_noise = t_nodes.new('ShaderNodeTexNoise')
t_noise.inputs['Scale'].default_value = 16.0
t_noise.inputs['Detail'].default_value = 6.0
t_ramp = t_nodes.new('ShaderNodeValToRGB')
t_ramp.color_ramp.elements[0].position = 0.36
t_ramp.color_ramp.elements[0].color = (0.02, 0.02, 0.02, 1.0) # Mirror wet puddle
t_ramp.color_ramp.elements[1].position = 0.64
t_ramp.color_ramp.elements[1].color = (0.60, 0.60, 0.60, 1.0) # Rough tarmac

t_links.new(t_noise.outputs['Fac'], t_ramp.inputs['Fac'])
t_links.new(t_ramp.outputs['Color'], t_bsdf.inputs['Roughness'])
t_links.new(t_bsdf.outputs['BSDF'], t_out.inputs['Surface'])
track.data.materials.append(mat_track)

# Alternating Apex Kerbs (Racing Curbing)
for k_side in [-1, 1]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(k_side * 5.5, 0, 0.025))
    kerb = bpy.context.view_layer.objects.active
    kerb.name = f"Apex_Kerb_{k_side}"
    kerb.scale = (0.6, 22.0, 0.025)
    bpy.ops.object.transform_apply(scale=True)
    
    mat_kerb = bpy.data.materials.new(name=f"Racing_Kerb_Mat_{k_side}")
    mat_kerb.use_nodes = True
    k_bsdf = mat_kerb.node_tree.nodes.get("Principled BSDF")
    if k_bsdf:
        k_bsdf.inputs['Base Color'].default_value = (0.85, 0.04, 0.05, 1.0) if k_side < 0 else (0.92, 0.92, 0.92, 1.0)
        k_bsdf.inputs['Roughness'].default_value = 0.35
    kerb.data.materials.append(mat_kerb)

# 5. Master Ferrari SF90 Group Root
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
ferrari_master = bpy.context.view_layer.objects.active
ferrari_master.name = "Ferrari_SF90_Master"

# --- SHADERS SETUP ---
# Rosso Corsa Multi-Layer Metallic Clearcoat Paint
mat_paint = bpy.data.materials.new(name="Ferrari_Rosso_Corsa")
mat_paint.use_nodes = True
p_bsdf = mat_paint.node_tree.nodes.get("Principled BSDF")
if p_bsdf:
    p_bsdf.inputs['Base Color'].default_value = (0.86, 0.012, 0.020, 1.0) # Authentic Ferrari Red
    p_bsdf.inputs['Metallic'].default_value = 0.20 # Metallic flake base
    p_bsdf.inputs['Roughness'].default_value = 0.10 # Micro-smooth base
    if 'Coat Weight' in p_bsdf.inputs:
        p_bsdf.inputs['Coat Weight'].default_value = 1.0
        if 'Coat Roughness' in p_bsdf.inputs:
            p_bsdf.inputs['Coat Roughness'].default_value = 0.02
    elif 'Clearcoat' in p_bsdf.inputs:
        p_bsdf.inputs['Clearcoat'].default_value = 1.0
        if 'Clearcoat Roughness' in p_bsdf.inputs:
            p_bsdf.inputs['Clearcoat Roughness'].default_value = 0.02

# Obsidian Tinted Glass
mat_glass = bpy.data.materials.new(name="Obsidian_Tinted_Glass")
mat_glass.use_nodes = True
g_bsdf = mat_glass.node_tree.nodes.get("Principled BSDF")
if g_bsdf:
    g_bsdf.inputs['Base Color'].default_value = (0.015, 0.022, 0.035, 1.0)
    g_bsdf.inputs['Roughness'].default_value = 0.025
    g_bsdf.inputs['IOR'].default_value = 1.52
    if 'Transmission Weight' in g_bsdf.inputs:
        g_bsdf.inputs['Transmission Weight'].default_value = 0.92
    elif 'Transmission' in g_bsdf.inputs:
        g_bsdf.inputs['Transmission'].default_value = 0.92

# Satin Carbon Fiber
mat_carbon = bpy.data.materials.new(name="PBR_Carbon_Fiber_Weave")
mat_carbon.use_nodes = True
c_bsdf = mat_carbon.node_tree.nodes.get("Principled BSDF")
if c_bsdf:
    c_bsdf.inputs['Base Color'].default_value = (0.025, 0.025, 0.028, 1.0)
    c_bsdf.inputs['Metallic'].default_value = 0.85
    c_bsdf.inputs['Roughness'].default_value = 0.22

# Pirelli Rubber Tire
mat_rubber = bpy.data.materials.new(name="Pirelli_PZero_Rubber")
mat_rubber.use_nodes = True
r_bsdf = mat_rubber.node_tree.nodes.get("Principled BSDF")
if r_bsdf:
    r_bsdf.inputs['Base Color'].default_value = (0.022, 0.022, 0.022, 1.0)
    r_bsdf.inputs['Roughness'].default_value = 0.65

# Brembo Yellow Brake Caliper
mat_caliper = bpy.data.materials.new(name="Giallo_Modena_Caliper")
mat_caliper.use_nodes = True
cal_bsdf = mat_caliper.node_tree.nodes.get("Principled BSDF")
if cal_bsdf:
    cal_bsdf.inputs['Base Color'].default_value = (0.98, 0.82, 0.02, 1.0) # Vibrant Ferrari Yellow
    cal_bsdf.inputs['Metallic'].default_value = 0.35
    cal_bsdf.inputs['Roughness'].default_value = 0.18

# Forged Silver / Gunmetal Alloy Rim
mat_alloy = bpy.data.materials.new(name="Forged_Alloy_Silver")
mat_alloy.use_nodes = True
a_bsdf = mat_alloy.node_tree.nodes.get("Principled BSDF")
if a_bsdf:
    a_bsdf.inputs['Base Color'].default_value = (0.65, 0.68, 0.72, 1.0) # Bright liquid silver
    a_bsdf.inputs['Metallic'].default_value = 0.98
    a_bsdf.inputs['Roughness'].default_value = 0.12

# Carbon Ceramic Brake Disc
mat_disc = bpy.data.materials.new(name="Carbon_Ceramic_Disc")
mat_disc.use_nodes = True
d_bsdf = mat_disc.node_tree.nodes.get("Principled BSDF")
if d_bsdf:
    d_bsdf.inputs['Base Color'].default_value = (0.12, 0.12, 0.13, 1.0)
    d_bsdf.inputs['Metallic'].default_value = 0.90
    d_bsdf.inputs['Roughness'].default_value = 0.25

# 6. Procedural Aerodynamic Ferrari SF90 Stradale Monocoque Body
# Structured quad cross-sections along Y-axis from nose to rear
cross_sections = [
    # (Y, [(X, Z), ...])
    (2.35,  [(0.0, 0.22), (0.35, 0.22), (0.68, 0.24), (0.88, 0.26), (0.88, 0.16), (0.68, 0.14), (0.35, 0.14), (0.0, 0.14)]), # Front Splitter Tip
    (1.95,  [(0.0, 0.44), (0.42, 0.46), (0.82, 0.48), (0.95, 0.42), (0.95, 0.20), (0.75, 0.18), (0.40, 0.16), (0.0, 0.16)]), # Nose & Nostril Inlets
    (1.45,  [(0.0, 0.62), (0.45, 0.66), (0.88, 0.72), (0.98, 0.65), (0.98, 0.22), (0.80, 0.20), (0.45, 0.18), (0.0, 0.18)]), # Front Wheel Arch Peak
    (0.85,  [(0.0, 0.74), (0.42, 0.76), (0.82, 0.72), (0.94, 0.62), (0.94, 0.24), (0.78, 0.22), (0.42, 0.20), (0.0, 0.20)]), # Hood to Windshield Base
    (0.00,  [(0.0, 0.68), (0.38, 0.69), (0.78, 0.64), (0.89, 0.54), (0.89, 0.22), (0.75, 0.20), (0.40, 0.18), (0.0, 0.18)]), # Mid Waistline & Door Scoop
    (-0.85, [(0.0, 0.78), (0.44, 0.82), (0.88, 0.84), (1.02, 0.68), (1.02, 0.24), (0.82, 0.22), (0.44, 0.20), (0.0, 0.20)]), # Rear Side Scoop Air Intake
    (-1.45, [(0.0, 0.82), (0.46, 0.86), (0.92, 0.88), (1.04, 0.74), (1.04, 0.24), (0.85, 0.22), (0.45, 0.20), (0.0, 0.20)]), # Rear Muscular Haunches Peak
    (-1.95, [(0.0, 0.78), (0.42, 0.80), (0.86, 0.78), (0.98, 0.68), (0.98, 0.26), (0.80, 0.24), (0.42, 0.22), (0.0, 0.22)]), # Rear Engine Deck to Kamm
    (-2.35, [(0.0, 0.68), (0.38, 0.69), (0.76, 0.68), (0.88, 0.58), (0.88, 0.28), (0.72, 0.28), (0.38, 0.25), (0.0, 0.25)])  # Rear Diffuser & Spoiler
]

verts = []
faces = []

num_cs = len(cross_sections)
num_pts = len(cross_sections[0][1])

for y, profile in cross_sections:
    # Right side vertices (positive X)
    for x, z in profile:
        verts.append((x, y, z))
    # Left side vertices (negative X)
    for x, z in profile[1:-1]:
        verts.append((-x, y, z))

pts_per_cs = num_pts + (num_pts - 2)

for i in range(num_cs - 1):
    cs1_offset = i * pts_per_cs
    cs2_offset = (i + 1) * pts_per_cs
    
    # Right half quads
    for j in range(num_pts - 1):
        v1 = cs1_offset + j
        v2 = cs1_offset + j + 1
        v3 = cs2_offset + j + 1
        v4 = cs2_offset + j
        faces.append((v1, v2, v3, v4))
    
    # Left half quads
    l_pts_count = num_pts - 2
    v1_rt = cs1_offset + 0
    v2_lt = cs1_offset + num_pts
    v3_lt = cs2_offset + num_pts
    v4_rt = cs2_offset + 0
    faces.append((v1_rt, v4_rt, v3_lt, v2_lt))
    
    for j in range(l_pts_count - 1):
        v1 = cs1_offset + num_pts + j
        v2 = cs1_offset + num_pts + j + 1
        v3 = cs2_offset + num_pts + j + 1
        v4 = cs2_offset + num_pts + j
        faces.append((v1, v4, v3, v2))
        
    v1_lb = cs1_offset + num_pts + l_pts_count - 1
    v2_cb = cs1_offset + 7
    v3_cb = cs2_offset + 7
    v4_lb = cs2_offset + num_pts + l_pts_count - 1
    faces.append((v1_lb, v2_cb, v3_cb, v4_lb))

front_cap = list(range(pts_per_cs))
faces.append(tuple(front_cap[:4]))

rear_offset = (num_cs - 1) * pts_per_cs
rear_cap = [rear_offset + k for k in range(pts_per_cs)]
faces.append(tuple(rear_cap[:4]))

body_mesh = bpy.data.meshes.new("Ferrari_SF90_Body_Mesh")
body_mesh.from_pydata(verts, [], faces)
body_mesh.update()

body_obj = bpy.data.objects.new("Ferrari_SF90_Chassis", body_mesh)
bpy.context.collection.objects.link(body_obj)
body_obj.parent = ferrari_master
body_obj.data.materials.append(mat_paint)

subsurf = body_obj.modifiers.new(name="Catmull_Clark_Subsurf", type='SUBSURF')
subsurf.levels = 3
subsurf.render_levels = 4
bpy.context.view_layer.objects.active = body_obj
bpy.ops.object.shade_smooth()

# 7. Aerodynamic Cockpit Glass Greenhouse Canopy
canopy_verts = [
    (0.0, 0.70, 0.74), (0.42, 0.68, 0.73), (-0.42, 0.68, 0.73),
    (0.0, -0.05, 1.18), (0.38, -0.05, 1.16), (-0.38, -0.05, 1.16),
    (0.0, -1.15, 0.88), (0.40, -1.15, 0.86), (-0.40, -1.15, 0.86)
]
canopy_faces = [
    (0, 1, 4, 3),
    (0, 3, 5, 2),
    (3, 4, 7, 6),
    (3, 6, 8, 5)
]
canopy_mesh = bpy.data.meshes.new("Ferrari_Canopy_Mesh")
canopy_mesh.from_pydata(canopy_verts, [], canopy_faces)
canopy_mesh.update()

canopy_obj = bpy.data.objects.new("Ferrari_Glass_Canopy", canopy_mesh)
bpy.context.collection.objects.link(canopy_obj)
canopy_obj.parent = ferrari_master
canopy_obj.data.materials.append(mat_glass)

c_sub = canopy_obj.modifiers.new(name="Subsurf", type='SUBSURF')
c_sub.levels = 3
c_sub.render_levels = 4
c_sol = canopy_obj.modifiers.new(name="Solidify", type='SOLIDIFY')
c_sol.thickness = 0.015

# 8. Twin-Turbo V8 Engine Block (Visible under rear glass hatch)
bpy.ops.mesh.primitive_cube_add(size=0.6, location=(0, -0.75, 0.64))
engine_block = bpy.context.view_layer.objects.active
engine_block.name = "Twin_Turbo_V8_Engine"
engine_block.scale = (0.9, 1.35, 0.45)
bpy.ops.object.transform_apply(scale=True)
engine_block.parent = ferrari_master

mat_eng = bpy.data.materials.new(name="Ferrari_Engine_Red")
mat_eng.use_nodes = True
eng_bsdf = mat_eng.node_tree.nodes.get("Principled BSDF")
if eng_bsdf:
    eng_bsdf.inputs['Base Color'].default_value = (0.75, 0.02, 0.02, 1.0)
    eng_bsdf.inputs['Roughness'].default_value = 0.45
engine_block.data.materials.append(mat_eng)

# 9. Front Carbon Splitter & Rear Diffuser with Strakes
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 2.38, 0.12))
front_splitter = bpy.context.view_layer.objects.active
front_splitter.name = "Carbon_Front_Splitter"
front_splitter.scale = (2.1, 0.38, 0.04)
bpy.ops.object.transform_apply(scale=True)
front_splitter.parent = ferrari_master
front_splitter.data.materials.append(mat_carbon)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -2.36, 0.22))
rear_diffuser = bpy.context.view_layer.objects.active
rear_diffuser.name = "Carbon_Rear_Diffuser"
rear_diffuser.scale = (2.12, 0.42, 0.06)
bpy.ops.object.transform_apply(scale=True)
rear_diffuser.parent = ferrari_master
rear_diffuser.data.materials.append(mat_carbon)

for s_idx in range(6):
    s_x = -0.85 + (s_idx * 0.34)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(s_x, -2.40, 0.18))
    strake = bpy.context.view_layer.objects.active
    strake.name = f"Diffuser_Strake_{s_idx+1}"
    strake.scale = (0.025, 0.35, 0.14)
    bpy.ops.object.transform_apply(scale=True)
    strake.parent = ferrari_master
    strake.data.materials.append(mat_carbon)

# Active Rear Wing (Gurney Flap)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -2.32, 0.75))
rear_wing = bpy.context.view_layer.objects.active
rear_wing.name = "Active_Aero_Rear_Wing"
rear_wing.scale = (1.95, 0.32, 0.035)
bpy.ops.object.transform_apply(scale=True)
rear_wing.parent = ferrari_master
rear_wing.data.materials.append(mat_carbon)

# Dual Center Titanium Exhaust Tips
for ex_side in [-0.14, 0.14]:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=0.25, location=(ex_side, -2.38, 0.52), rotation=(math.radians(90), 0, 0))
    exhaust = bpy.context.view_layer.objects.active
    exhaust.name = f"Titanium_Exhaust_{ex_side}"
    exhaust.parent = ferrari_master
    exhaust.data.materials.append(mat_alloy)

# 10. High-Detail Pro Wheels (Recessed Rim, 10 Spokes, Drilled Rotors, Yellow Brembos)
wheel_positions = [
    ("FL", -1.02,  1.45, 0.36),
    ("FR",  1.02,  1.45, 0.36),
    ("RL", -1.06, -1.45, 0.36),
    ("RR",  1.06, -1.45, 0.36)
]

# Yellow Ferrari Hubcap Shield Material
mat_shield = bpy.data.materials.new(name="Ferrari_Hubcap_Yellow")
mat_shield.use_nodes = True
s_bsdf = mat_shield.node_tree.nodes.get("Principled BSDF")
if s_bsdf:
    s_bsdf.inputs['Base Color'].default_value = (0.98, 0.85, 0.02, 1.0)
    s_bsdf.inputs['Roughness'].default_value = 0.2

for name, wx, wy, wz in wheel_positions:
    is_left = wx < 0
    face_dir = -1.0 if is_left else 1.0
    
    # A. Pirelli P-Zero Wide Tire (Tread & Sidewall)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.36, depth=0.30, location=(wx, wy, wz), rotation=(0, math.radians(90), 0))
    tire = bpy.context.view_layer.objects.active
    tire.name = f"Pirelli_Tire_{name}"
    tire.parent = ferrari_master
    tire.data.materials.append(mat_rubber)
    t_bev = tire.modifiers.new(name="Bevel", type='BEVEL')
    t_bev.width = 0.04
    t_bev.segments = 4
    
    # B. Deep-Dish Rim Lip (Recessed silver rim)
    rim_face_x = wx + (face_dir * 0.12)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.26, depth=0.06, location=(rim_face_x, wy, wz), rotation=(0, math.radians(90), 0))
    rim = bpy.context.view_layer.objects.active
    rim.name = f"Forged_Rim_Lip_{name}"
    rim.parent = ferrari_master
    rim.data.materials.append(mat_alloy)
    
    # C. Center Hubcap
    hub_x = wx + (face_dir * 0.14)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.055, depth=0.03, location=(hub_x, wy, wz), rotation=(0, math.radians(90), 0))
    hub = bpy.context.view_layer.objects.active
    hub.name = f"Ferrari_Hubcap_{name}"
    hub.parent = ferrari_master
    hub.data.materials.append(mat_shield)
    
    # D. 10 Sculpted Alloy Spokes radiating to the rim
    for spk_i in range(10):
        angle = (spk_i / 10.0) * math.pi * 2.0
        sy = wy + math.sin(angle) * 0.15
        sz = wz + math.cos(angle) * 0.15
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(rim_face_x + (face_dir * 0.015), sy, sz))
        spoke = bpy.context.view_layer.objects.active
        spoke.name = f"Spoke_{name}_{spk_i+1}"
        spoke.scale = (0.025, 0.030, 0.20)
        spoke.rotation_euler = (angle, 0, 0)
        bpy.ops.object.transform_apply(scale=True)
        spoke.parent = ferrari_master
        spoke.data.materials.append(mat_alloy)
        
    # E. Carbon Ceramic Drilled Brake Rotor
    rotor_x = wx - (face_dir * 0.02)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.23, depth=0.025, location=(rotor_x, wy, wz), rotation=(0, math.radians(90), 0))
    rotor = bpy.context.view_layer.objects.active
    rotor.name = f"Brake_Rotor_{name}"
    rotor.parent = ferrari_master
    rotor.data.materials.append(mat_disc)
    
    # F. Giallo Modena Brembo 6-Piston Caliper
    caliper_x = wx + (face_dir * 0.03)
    caliper_y = wy + 0.14
    caliper_z = wz + 0.10
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(caliper_x, caliper_y, caliper_z))
    caliper = bpy.context.view_layer.objects.active
    caliper.name = f"Brembo_Caliper_{name}"
    caliper.scale = (0.08, 0.16, 0.09)
    bpy.ops.object.transform_apply(scale=True)
    caliper.parent = ferrari_master
    caliper.data.materials.append(mat_caliper)

# 11. Headlight Matrix & Forward Projector Spotlights
mat_headlight_led = bpy.data.materials.new(name="Matrix_LED_Headlight")
mat_headlight_led.use_nodes = True
hl_bsdf = mat_headlight_led.node_tree.nodes.get("Principled BSDF")
if hl_bsdf:
    hl_bsdf.inputs['Base Color'].default_value = (0.92, 0.96, 1.0, 1.0)
    if 'Emission Color' in hl_bsdf.inputs:
        hl_bsdf.inputs['Emission Color'].default_value = (0.80, 0.92, 1.0, 1.0)
        hl_bsdf.inputs['Emission Strength'].default_value = 45.0

for hx in [-0.70, 0.70]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(hx, 2.05, 0.52))
    hl_obj = bpy.context.view_layer.objects.active
    hl_obj.name = f"Headlight_Matrix_{hx}"
    hl_obj.scale = (0.24, 0.14, 0.04)
    hl_obj.rotation_euler = (math.radians(-15), 0, math.radians(-10 if hx > 0 else 10))
    bpy.ops.object.transform_apply(scale=True)
    hl_obj.parent = ferrari_master
    hl_obj.data.materials.append(mat_headlight_led)
    
    beam_data = bpy.data.lights.new(name=f"Xenon_Projector_Beam_{hx}", type='SPOT')
    beam_data.energy = 4500.0
    beam_data.spot_size = math.radians(60)
    beam_data.spot_blend = 0.35
    beam_data.color = (0.82, 0.92, 1.0)
    beam_obj = bpy.data.objects.new(name=f"Xenon_Spot_{hx}", object_data=beam_data)
    beam_obj.location = (hx, 2.15, 0.52)
    beam_obj.rotation_euler = (math.radians(-80), 0, 0)
    bpy.context.collection.objects.link(beam_obj)
    beam_obj.parent = ferrari_master

# 12. Rear Crimson LED Taillight Bars & Rain Strobe
mat_tail_led = bpy.data.materials.new(name="Crimson_LED_Taillight")
mat_tail_led.use_nodes = True
tl_bsdf = mat_tail_led.node_tree.nodes.get("Principled BSDF")
if tl_bsdf:
    tl_bsdf.inputs['Base Color'].default_value = (1.0, 0.015, 0.025, 1.0)
    if 'Emission Color' in tl_bsdf.inputs:
        tl_bsdf.inputs['Emission Color'].default_value = (1.0, 0.015, 0.025, 1.0)
        tl_bsdf.inputs['Emission Strength'].default_value = 35.0 # Controlled emission

for tx in [-0.62, 0.62]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(tx, -2.36, 0.65))
    tl_obj = bpy.context.view_layer.objects.active
    tl_obj.name = f"Taillight_Bar_{tx}"
    tl_obj.scale = (0.38, 0.04, 0.035)
    bpy.ops.object.transform_apply(scale=True)
    tl_obj.parent = ferrari_master
    tl_obj.data.materials.append(mat_tail_led)

tl_bounce_data = bpy.data.lights.new(name="Rear_Taillight_Ground_Bounce", type='POINT')
tl_bounce_data.energy = 900.0
tl_bounce_data.color = (1.0, 0.02, 0.04)
tl_bounce_data.shadow_soft_size = 0.8
tl_bounce = bpy.data.objects.new("Rear_Bounce_Light", tl_bounce_data)
tl_bounce.location = (0, -2.6, 0.40)
bpy.context.collection.objects.link(tl_bounce)
tl_bounce.parent = ferrari_master

# 13. Tire Smoke & Atmospheric Spray (Billowing behind rear tires)
mat_tire_smoke = bpy.data.materials.new(name="Atmospheric_Tire_Mist")
mat_tire_smoke.use_nodes = True
sm_bsdf = mat_tire_smoke.node_tree.nodes.get("Principled BSDF")
if sm_bsdf:
    sm_bsdf.inputs['Base Color'].default_value = (0.75, 0.82, 0.90, 1.0)
    sm_bsdf.inputs['Roughness'].default_value = 0.95
    if 'Transmission Weight' in sm_bsdf.inputs:
        sm_bsdf.inputs['Transmission Weight'].default_value = 0.75
    elif 'Transmission' in sm_bsdf.inputs:
        sm_bsdf.inputs['Transmission'].default_value = 0.75

for sx in [-1.08, 1.08]:
    bpy.ops.mesh.primitive_plane_add(size=1.6, location=(sx, -2.65, 0.28), rotation=(math.radians(35), 0, math.radians(12 if sx < 0 else -12)))
    smoke_mesh = bpy.context.view_layer.objects.active
    smoke_mesh.name = f"Tire_Spray_Mist_{sx}"
    smoke_mesh.data.materials.append(mat_tire_smoke)
    smoke_mesh.parent = ferrari_master

# 14. Master Hollywood Film Key & Rim Lighting
key_data = bpy.data.lights.new(name="Track_High_Key", type='AREA')
key_data.energy = 3800.0
key_data.size = 8.0
key_data.color = (0.95, 0.97, 1.0)
key_obj = bpy.data.objects.new("Track_High_Key", key_data)
key_obj.location = (-5.5, 3.8, 6.5)
key_obj.rotation_euler = (math.radians(-50), math.radians(-28), math.radians(32))
bpy.context.collection.objects.link(key_obj)

rim_data = bpy.data.lights.new(name="Midnight_Cyan_Rim", type='SPOT')
rim_data.energy = 4800.0
rim_data.spot_size = math.radians(50)
rim_data.color = (0.28, 0.72, 1.0)
rim_obj = bpy.data.objects.new("Midnight_Cyan_Rim", rim_data)
rim_obj.location = (5.5, -4.8, 5.5)
rim_obj.rotation_euler = (math.radians(50), math.radians(24), math.radians(-130))
bpy.context.collection.objects.link(rim_obj)

# 15. Cinematic 3/4 Front Low Hero Camera with Track-To Constraint & f/1.8 Bokeh
cam_data = bpy.data.cameras.new("Hero_SF90_Camera")
cam_data.lens = 58.0 # Prime Cinema Lens
cam_data.sensor_width = 36.0
cam_data.dof.use_dof = True
cam_data.dof.focus_distance = 6.2
cam_data.dof.aperture_fstop = 1.8

cam_obj = bpy.data.objects.new("Camera", cam_data)
bpy.context.collection.objects.link(cam_obj)
# Position camera in front-left 3/4 hero position
cam_obj.location = (-4.2, 4.6, 1.15)

# Add Track-To Constraint aiming directly at front nose / chassis center
track_target = bpy.data.objects.new("Cam_Target", None)
track_target.location = (0.0, 0.45, 0.48)
bpy.context.collection.objects.link(track_target)

trk_con = cam_obj.constraints.new(type='TRACK_TO')
trk_con.target = track_target
trk_con.track_axis = 'TRACK_NEGATIVE_Z'
trk_con.up_axis = 'UP_Y'

scene.camera = cam_obj

# 16. Ensure Viewport Shading is in MATERIAL mode
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

# 17. Save .blend file & render test image
workspace_dir = r"c:\Users\subba\Downloads\prime -ps\face of me"
blend_path = os.path.join(workspace_dir, "unin_cinematic_scene.blend")
render_path = os.path.join(workspace_dir, "unin_cinematic_render.png")

bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print(f"[TEST V2 SUCCESS] Saved Blender project: {blend_path}")

scene.render.filepath = render_path
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
bpy.ops.render.render(write_still=True)
print(f"[TEST V2 SUCCESS] Rendered 1080p snapshot: {render_path}")
