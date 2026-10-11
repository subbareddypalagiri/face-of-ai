# scratch/test_ferrari_pro_build_v3.py
# FAANG-Grade Ferrari SF90 Stradale Master Procedural Engine
import bpy
import math
import mathutils
import os

print("[TEST V3] Building Master High-Fidelity Ferrari SF90...")

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

# 3. Environment & Atmospheric Volumetric Mist
scene.world = bpy.data.worlds.new("Midnight_Circuit_World")
scene.world.use_nodes = True
w_nodes = scene.world.node_tree.nodes
w_links = scene.world.node_tree.links
w_nodes.clear()

w_out = w_nodes.new('ShaderNodeOutputWorld')
w_bg = w_nodes.new('ShaderNodeBackground')
w_bg.inputs['Color'].default_value = (0.008, 0.012, 0.024, 1.0)
w_bg.inputs['Strength'].default_value = 0.5
w_links.new(w_bg.outputs['Background'], w_out.inputs['Surface'])

w_vol = w_nodes.new('ShaderNodeVolumeScatter')
w_vol.inputs['Density'].default_value = 0.012
w_vol.inputs['Anisotropy'].default_value = 0.68
w_vol.inputs['Color'].default_value = (0.80, 0.88, 1.0, 1.0)
w_links.new(w_vol.outputs['Volume'], w_out.inputs['Volume'])

# 4. Wet Racing Circuit with Procedural Puddles (45m x 45m)
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
t_bsdf.inputs['Base Color'].default_value = (0.022, 0.022, 0.025, 1.0)
t_bsdf.inputs['Metallic'].default_value = 0.08

t_noise = t_nodes.new('ShaderNodeTexNoise')
t_noise.inputs['Scale'].default_value = 16.0
t_noise.inputs['Detail'].default_value = 6.0
t_ramp = t_nodes.new('ShaderNodeValToRGB')
t_ramp.color_ramp.elements[0].position = 0.35
t_ramp.color_ramp.elements[0].color = (0.015, 0.015, 0.015, 1.0) # Mirror puddle
t_ramp.color_ramp.elements[1].position = 0.65
t_ramp.color_ramp.elements[1].color = (0.55, 0.55, 0.55, 1.0) # Rough tarmac

t_links.new(t_noise.outputs['Fac'], t_ramp.inputs['Fac'])
t_links.new(t_ramp.outputs['Color'], t_bsdf.inputs['Roughness'])
t_links.new(t_bsdf.outputs['BSDF'], t_out.inputs['Surface'])
track.data.materials.append(mat_track)

# Red & White Apex Kerbs
for k_side in [-1, 1]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(k_side * 5.4, 0, 0.02))
    kerb = bpy.context.view_layer.objects.active
    kerb.name = f"Apex_Kerb_{k_side}"
    kerb.scale = (0.55, 22.0, 0.02)
    bpy.ops.object.transform_apply(scale=True)
    
    mat_kerb = bpy.data.materials.new(name=f"Racing_Kerb_Mat_{k_side}")
    mat_kerb.use_nodes = True
    k_bsdf = mat_kerb.node_tree.nodes.get("Principled BSDF")
    if k_bsdf:
        k_bsdf.inputs['Base Color'].default_value = (0.85, 0.04, 0.05, 1.0) if k_side < 0 else (0.92, 0.92, 0.92, 1.0)
        k_bsdf.inputs['Roughness'].default_value = 0.35
    kerb.data.materials.append(mat_kerb)

# 5. Master Ferrari Group
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
ferrari_master = bpy.context.view_layer.objects.active
ferrari_master.name = "Ferrari_SF90_Master"

# --- SHADERS ---
# Rosso Corsa Metallic Clearcoat
mat_paint = bpy.data.materials.new(name="Ferrari_Rosso_Corsa")
mat_paint.use_nodes = True
p_bsdf = mat_paint.node_tree.nodes.get("Principled BSDF")
if p_bsdf:
    p_bsdf.inputs['Base Color'].default_value = (0.84, 0.010, 0.018, 1.0)
    p_bsdf.inputs['Metallic'].default_value = 0.22
    p_bsdf.inputs['Roughness'].default_value = 0.09
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
    g_bsdf.inputs['Roughness'].default_value = 0.02
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
    c_bsdf.inputs['Roughness'].default_value = 0.20

# Pirelli P-Zero Rubber Tire
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
    cal_bsdf.inputs['Base Color'].default_value = (0.98, 0.82, 0.02, 1.0)
    cal_bsdf.inputs['Metallic'].default_value = 0.35
    cal_bsdf.inputs['Roughness'].default_value = 0.18

# Forged Silver Alloy Rim
mat_alloy = bpy.data.materials.new(name="Forged_Alloy_Silver")
mat_alloy.use_nodes = True
a_bsdf = mat_alloy.node_tree.nodes.get("Principled BSDF")
if a_bsdf:
    a_bsdf.inputs['Base Color'].default_value = (0.72, 0.74, 0.78, 1.0)
    a_bsdf.inputs['Metallic'].default_value = 0.98
    a_bsdf.inputs['Roughness'].default_value = 0.10

# Carbon Ceramic Brake Disc
mat_disc = bpy.data.materials.new(name="Carbon_Ceramic_Disc")
mat_disc.use_nodes = True
d_bsdf = mat_disc.node_tree.nodes.get("Principled BSDF")
if d_bsdf:
    d_bsdf.inputs['Base Color'].default_value = (0.12, 0.12, 0.13, 1.0)
    d_bsdf.inputs['Metallic'].default_value = 0.90
    d_bsdf.inputs['Roughness'].default_value = 0.25

# Yellow Ferrari Scuderia Shield Badge Material
mat_shield = bpy.data.materials.new(name="Ferrari_Scuderia_Yellow")
mat_shield.use_nodes = True
s_bsdf = mat_shield.node_tree.nodes.get("Principled BSDF")
if s_bsdf:
    s_bsdf.inputs['Base Color'].default_value = (0.98, 0.84, 0.02, 1.0)
    s_bsdf.inputs['Roughness'].default_value = 0.15

# 6. Sculpted Aerodynamic Bodywork with Wheel Arches
# Cross-sections engineered with wheel arch cutouts at Y=1.45 and Y=-1.45
cross_sections = [
    # Y,       X_mid, X_outer, Z_bottom, Z_mid, Z_top
    ( 2.40,    0.40,  0.88,    0.14,     0.22,  0.24), # Splitter tip
    ( 2.05,    0.45,  0.92,    0.16,     0.32,  0.46), # Nose cone & nostrils
    ( 1.55,    0.46,  0.72,    0.38,     0.52,  0.72), # Front wheel arch top (recessed bottom for wheel)
    ( 1.35,    0.46,  0.72,    0.38,     0.52,  0.72), # Front wheel arch rear
    ( 0.75,    0.42,  0.90,    0.18,     0.45,  0.75), # Base of A-pillar & hood
    ( 0.00,    0.40,  0.82,    0.18,     0.42,  0.68), # Waistline / Door scoop
    (-0.75,    0.45,  0.98,    0.18,     0.48,  0.78), # Side intercooler intake
    (-1.35,    0.48,  0.78,    0.38,     0.56,  0.86), # Rear wheel arch front
    (-1.55,    0.48,  0.78,    0.38,     0.56,  0.86), # Rear wheel arch peak
    (-1.95,    0.44,  0.96,    0.20,     0.46,  0.76), # Rear engine deck
    (-2.38,    0.38,  0.88,    0.22,     0.38,  0.66)  # Rear diffuser & Kamm tail
]

verts = []
faces = []

num_cs = len(cross_sections)
for y, xm, xo, zb, zm, zt in cross_sections:
    # 6 points per cross section across width
    # 0: Center Top, 1: Right Mid, 2: Right Outer, 3: Right Bottom, 4: Center Bottom
    # 5: Left Bottom, 6: Left Outer, 7: Left Mid
    verts.append((0.0, y, zt))     # Top center
    verts.append((xm,  y, zm))     # Right upper
    verts.append((xo,  y, zm*0.8)) # Right outer crease
    verts.append((xm,  y, zb))     # Right bottom
    verts.append((0.0, y, zb))     # Center bottom
    verts.append((-xm, y, zb))     # Left bottom
    verts.append((-xo, y, zm*0.8)) # Left outer crease
    verts.append((-xm, y, zm))     # Left upper

pts_per_cs = 8

for i in range(num_cs - 1):
    c1 = i * pts_per_cs
    c2 = (i + 1) * pts_per_cs
    
    # Quad loops around the circumference
    for j in range(pts_per_cs):
        next_j = (j + 1) % pts_per_cs
        faces.append((c1 + j, c1 + next_j, c2 + next_j, c2 + j))

# End caps
front_cap = [0, 1, 2, 3, 4, 5, 6, 7]
faces.append(tuple(front_cap[:4]))
faces.append(tuple([front_cap[0], front_cap[3], front_cap[4], front_cap[7]]))
faces.append(tuple([front_cap[4], front_cap[5], front_cap[6], front_cap[7]]))

rear_offset = (num_cs - 1) * pts_per_cs
rear_cap = [rear_offset + k for k in range(pts_per_cs)]
faces.append(tuple([rear_cap[3], rear_cap[2], rear_cap[1], rear_cap[0]]))
faces.append(tuple([rear_cap[7], rear_cap[4], rear_cap[3], rear_cap[0]]))
faces.append(tuple([rear_cap[7], rear_cap[6], rear_cap[5], rear_cap[4]]))

body_mesh = bpy.data.meshes.new("Ferrari_SF90_Body_Mesh")
body_mesh.from_pydata(verts, [], faces)
body_mesh.update()

body_obj = bpy.data.objects.new("Ferrari_SF90_Chassis", body_mesh)
bpy.context.collection.objects.link(body_obj)
body_obj.parent = ferrari_master
body_obj.data.materials.append(mat_paint)

subsurf = body_obj.modifiers.new(name="Subsurf", type='SUBSURF')
subsurf.levels = 3
subsurf.render_levels = 4
bpy.context.view_layer.objects.active = body_obj
bpy.ops.object.shade_smooth()

# 7. Aerodynamic Cockpit Glass Greenhouse
canopy_verts = [
    (0.0, 0.70, 0.75), (0.40, 0.68, 0.74), (-0.40, 0.68, 0.74),
    (0.0, -0.05, 1.18), (0.36, -0.05, 1.16), (-0.36, -0.05, 1.16),
    (0.0, -1.10, 0.88), (0.38, -1.10, 0.86), (-0.38, -1.10, 0.86)
]
canopy_faces = [
    (0, 1, 4, 3), (0, 3, 5, 2),
    (3, 4, 7, 6), (3, 6, 8, 5)
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
c_sol = canopy_obj.modifiers.new(name="Solidify", type='SOLIDIFY')
c_sol.thickness = 0.015

# 8. Twin-Turbo V8 Engine Block (under rear glass hatch)
bpy.ops.mesh.primitive_cube_add(size=0.6, location=(0, -0.72, 0.65))
engine_block = bpy.context.view_layer.objects.active
engine_block.name = "Twin_Turbo_V8_Engine"
engine_block.scale = (0.85, 1.30, 0.42)
bpy.ops.object.transform_apply(scale=True)
engine_block.parent = ferrari_master

mat_eng = bpy.data.materials.new(name="Ferrari_Engine_Red")
mat_eng.use_nodes = True
eng_bsdf = mat_eng.node_tree.nodes.get("Principled BSDF")
if eng_bsdf:
    eng_bsdf.inputs['Base Color'].default_value = (0.75, 0.02, 0.02, 1.0)
    eng_bsdf.inputs['Roughness'].default_value = 0.45
engine_block.data.materials.append(mat_eng)

# 9. Scuderia Ferrari Hood Shield Badge
bpy.ops.mesh.primitive_cylinder_add(radius=0.045, depth=0.01, location=(0, 2.15, 0.38), rotation=(math.radians(35), 0, 0))
badge = bpy.context.view_layer.objects.active
badge.name = "Scuderia_Ferrari_Badge"
badge.scale = (1.0, 1.3, 1.0)
badge.parent = ferrari_master
badge.data.materials.append(mat_shield)

# 10. Carbon Fiber Aero Splitter & Rear Diffuser
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 2.42, 0.12))
front_splitter = bpy.context.view_layer.objects.active
front_splitter.name = "Carbon_Front_Splitter"
front_splitter.scale = (2.05, 0.35, 0.035)
bpy.ops.object.transform_apply(scale=True)
front_splitter.parent = ferrari_master
front_splitter.data.materials.append(mat_carbon)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -2.40, 0.22))
rear_diffuser = bpy.context.view_layer.objects.active
rear_diffuser.name = "Carbon_Rear_Diffuser"
rear_diffuser.scale = (2.08, 0.38, 0.05)
bpy.ops.object.transform_apply(scale=True)
rear_diffuser.parent = ferrari_master
rear_diffuser.data.materials.append(mat_carbon)

for s_idx in range(6):
    s_x = -0.82 + (s_idx * 0.33)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(s_x, -2.42, 0.18))
    strake = bpy.context.view_layer.objects.active
    strake.name = f"Diffuser_Strake_{s_idx+1}"
    strake.scale = (0.022, 0.32, 0.12)
    bpy.ops.object.transform_apply(scale=True)
    strake.parent = ferrari_master
    strake.data.materials.append(mat_carbon)

# Active Rear Wing (Gurney Flap)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -2.35, 0.74))
rear_wing = bpy.context.view_layer.objects.active
rear_wing.name = "Active_Aero_Rear_Wing"
rear_wing.scale = (1.92, 0.28, 0.03)
bpy.ops.object.transform_apply(scale=True)
rear_wing.parent = ferrari_master
rear_wing.data.materials.append(mat_carbon)

# Dual Center Titanium Exhaust Tips
for ex_side in [-0.13, 0.13]:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.065, depth=0.22, location=(ex_side, -2.40, 0.52), rotation=(math.radians(90), 0, 0))
    exhaust = bpy.context.view_layer.objects.active
    exhaust.name = f"Titanium_Exhaust_{ex_side}"
    exhaust.parent = ferrari_master
    exhaust.data.materials.append(mat_alloy)

# 11. Pro High-Detail Wheels (Recessed Rim, 10 Silver Spokes, Drilled Rotors, Yellow Brembos)
wheel_positions = [
    ("FL", -0.96,  1.45, 0.36),
    ("FR",  0.96,  1.45, 0.36),
    ("RL", -1.02, -1.45, 0.36),
    ("RR",  1.02, -1.45, 0.36)
]

for name, wx, wy, wz in wheel_positions:
    is_left = wx < 0
    face_dir = -1.0 if is_left else 1.0
    
    # A. Pirelli P-Zero Wide Tire
    bpy.ops.mesh.primitive_cylinder_add(radius=0.36, depth=0.28, location=(wx, wy, wz), rotation=(0, math.radians(90), 0))
    tire = bpy.context.view_layer.objects.active
    tire.name = f"Pirelli_Tire_{name}"
    tire.parent = ferrari_master
    tire.data.materials.append(mat_rubber)
    t_bev = tire.modifiers.new(name="Bevel", type='BEVEL')
    t_bev.width = 0.035
    t_bev.segments = 4
    
    # B. Deep-Dish Silver Rim Lip (Outer Rim)
    rim_face_x = wx + (face_dir * 0.11)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.27, depth=0.05, location=(rim_face_x, wy, wz), rotation=(0, math.radians(90), 0))
    rim = bpy.context.view_layer.objects.active
    rim.name = f"Forged_Rim_Lip_{name}"
    rim.parent = ferrari_master
    rim.data.materials.append(mat_alloy)
    
    # C. Center Yellow Hubcap
    hub_x = wx + (face_dir * 0.13)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.055, depth=0.025, location=(hub_x, wy, wz), rotation=(0, math.radians(90), 0))
    hub = bpy.context.view_layer.objects.active
    hub.name = f"Ferrari_Hubcap_{name}"
    hub.parent = ferrari_master
    hub.data.materials.append(mat_shield)
    
    # D. 10 Sculpted Silver Alloy Spokes
    for spk_i in range(10):
        angle = (spk_i / 10.0) * math.pi * 2.0
        sy = wy + math.sin(angle) * 0.14
        sz = wz + math.cos(angle) * 0.14
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(rim_face_x + (face_dir * 0.015), sy, sz))
        spoke = bpy.context.view_layer.objects.active
        spoke.name = f"Spoke_{name}_{spk_i+1}"
        spoke.scale = (0.025, 0.028, 0.19)
        spoke.rotation_euler = (angle, 0, 0)
        bpy.ops.object.transform_apply(scale=True)
        spoke.parent = ferrari_master
        spoke.data.materials.append(mat_alloy)
        
    # E. Carbon Ceramic Drilled Brake Rotor
    rotor_x = wx - (face_dir * 0.02)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.24, depth=0.025, location=(rotor_x, wy, wz), rotation=(0, math.radians(90), 0))
    rotor = bpy.context.view_layer.objects.active
    rotor.name = f"Brake_Rotor_{name}"
    rotor.parent = ferrari_master
    rotor.data.materials.append(mat_disc)
    
    # F. Giallo Modena Brembo 6-Piston Caliper
    caliper_x = wx + (face_dir * 0.03)
    caliper_y = wy + 0.13
    caliper_z = wz + 0.10
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(caliper_x, caliper_y, caliper_z))
    caliper = bpy.context.view_layer.objects.active
    caliper.name = f"Brembo_Caliper_{name}"
    caliper.scale = (0.075, 0.15, 0.085)
    bpy.ops.object.transform_apply(scale=True)
    caliper.parent = ferrari_master
    caliper.data.materials.append(mat_caliper)

# 12. Aerodynamic Recessed Headlights & Forward Spot Projectors
mat_hl_housing = bpy.data.materials.new(name="Headlight_Black_Housing")
mat_hl_housing.use_nodes = True
hlh_bsdf = mat_hl_housing.node_tree.nodes.get("Principled BSDF")
if hlh_bsdf:
    hlh_bsdf.inputs['Base Color'].default_value = (0.02, 0.02, 0.025, 1.0)
    hlh_bsdf.inputs['Roughness'].default_value = 0.2

mat_headlight_led = bpy.data.materials.new(name="Matrix_LED_Headlight")
mat_headlight_led.use_nodes = True
hl_bsdf = mat_headlight_led.node_tree.nodes.get("Principled BSDF")
if hl_bsdf:
    hl_bsdf.inputs['Base Color'].default_value = (0.92, 0.96, 1.0, 1.0)
    if 'Emission Color' in hl_bsdf.inputs:
        hl_bsdf.inputs['Emission Color'].default_value = (0.80, 0.92, 1.0, 1.0)
        hl_bsdf.inputs['Emission Strength'].default_value = 35.0

for hx in [-0.68, 0.68]:
    # Flush aerodynamic housing
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(hx, 2.05, 0.48))
    hl_house = bpy.context.view_layer.objects.active
    hl_house.name = f"Headlight_Housing_{hx}"
    hl_house.scale = (0.22, 0.14, 0.035)
    hl_house.rotation_euler = (math.radians(-18), 0, math.radians(-10 if hx > 0 else 10))
    bpy.ops.object.transform_apply(scale=True)
    hl_house.parent = ferrari_master
    hl_house.data.materials.append(mat_hl_housing)
    
    # Internal LED Projector Bar
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(hx, 2.06, 0.49))
    hl_led = bpy.context.view_layer.objects.active
    hl_led.name = f"Headlight_LED_{hx}"
    hl_led.scale = (0.16, 0.08, 0.02)
    hl_led.rotation_euler = (math.radians(-18), 0, math.radians(-10 if hx > 0 else 10))
    bpy.ops.object.transform_apply(scale=True)
    hl_led.parent = ferrari_master
    hl_led.data.materials.append(mat_headlight_led)
    
    # Forward projecting Xenon spotlight beam casting onto wet puddles
    beam_data = bpy.data.lights.new(name=f"Xenon_Projector_Beam_{hx}", type='SPOT')
    beam_data.energy = 4200.0
    beam_data.spot_size = math.radians(60)
    beam_data.spot_blend = 0.35
    beam_data.color = (0.82, 0.92, 1.0)
    beam_obj = bpy.data.objects.new(name=f"Xenon_Spot_{hx}", object_data=beam_data)
    beam_obj.location = (hx, 2.15, 0.50)
    beam_obj.rotation_euler = (math.radians(-80), 0, 0)
    bpy.context.collection.objects.link(beam_obj)
    beam_obj.parent = ferrari_master

# 13. Rear Crimson LED Taillight Bars & Rain Strobe
mat_tail_led = bpy.data.materials.new(name="Crimson_LED_Taillight")
mat_tail_led.use_nodes = True
tl_bsdf = mat_tail_led.node_tree.nodes.get("Principled BSDF")
if tl_bsdf:
    tl_bsdf.inputs['Base Color'].default_value = (1.0, 0.015, 0.025, 1.0)
    if 'Emission Color' in tl_bsdf.inputs:
        tl_bsdf.inputs['Emission Color'].default_value = (1.0, 0.015, 0.025, 1.0)
        tl_bsdf.inputs['Emission Strength'].default_value = 28.0

for tx in [-0.58, 0.58]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(tx, -2.38, 0.65))
    tl_obj = bpy.context.view_layer.objects.active
    tl_obj.name = f"Taillight_Bar_{tx}"
    tl_obj.scale = (0.32, 0.035, 0.03)
    bpy.ops.object.transform_apply(scale=True)
    tl_obj.parent = ferrari_master
    tl_obj.data.materials.append(mat_tail_led)

tl_bounce_data = bpy.data.lights.new(name="Rear_Taillight_Ground_Bounce", type='POINT')
tl_bounce_data.energy = 600.0
tl_bounce_data.color = (1.0, 0.02, 0.04)
tl_bounce_data.shadow_soft_size = 0.8
tl_bounce = bpy.data.objects.new("Rear_Bounce_Light", tl_bounce_data)
tl_bounce.location = (0, -2.6, 0.38)
bpy.context.collection.objects.link(tl_bounce)
tl_bounce.parent = ferrari_master

# 14. Tire Smoke & Atmospheric Spray
mat_tire_smoke = bpy.data.materials.new(name="Atmospheric_Tire_Mist")
mat_tire_smoke.use_nodes = True
sm_bsdf = mat_tire_smoke.node_tree.nodes.get("Principled BSDF")
if sm_bsdf:
    sm_bsdf.inputs['Base Color'].default_value = (0.75, 0.82, 0.90, 1.0)
    sm_bsdf.inputs['Roughness'].default_value = 0.95
    if 'Transmission Weight' in sm_bsdf.inputs:
        sm_bsdf.inputs['Transmission Weight'].default_value = 0.82
    elif 'Transmission' in sm_bsdf.inputs:
        sm_bsdf.inputs['Transmission'].default_value = 0.82

for sx in [-1.05, 1.05]:
    bpy.ops.mesh.primitive_plane_add(size=1.4, location=(sx, -2.65, 0.24), rotation=(math.radians(35), 0, math.radians(12 if sx < 0 else -12)))
    smoke_mesh = bpy.context.view_layer.objects.active
    smoke_mesh.name = f"Tire_Spray_Mist_{sx}"
    smoke_mesh.data.materials.append(mat_tire_smoke)
    smoke_mesh.parent = ferrari_master

# 15. Studio Key & Rim Lights
key_data = bpy.data.lights.new(name="Track_High_Key", type='AREA')
key_data.energy = 3400.0
key_data.size = 8.0
key_data.color = (0.95, 0.97, 1.0)
key_obj = bpy.data.objects.new("Track_High_Key", key_data)
key_obj.location = (-5.5, 4.2, 5.8)
key_obj.rotation_euler = (math.radians(-48), math.radians(-26), math.radians(30))
bpy.context.collection.objects.link(key_obj)

rim_data = bpy.data.lights.new(name="Midnight_Cyan_Rim", type='SPOT')
rim_data.energy = 4200.0
rim_data.spot_size = math.radians(50)
rim_data.color = (0.28, 0.72, 1.0)
rim_obj = bpy.data.objects.new("Midnight_Cyan_Rim", rim_data)
rim_obj.location = (5.5, -4.5, 5.2)
rim_obj.rotation_euler = (math.radians(48), math.radians(22), math.radians(-125))
bpy.context.collection.objects.link(rim_obj)

# 16. Hero 3/4 Front Low Camera Framing (Razor-Sharp Focus on Car)
cam_data = bpy.data.cameras.new("Hero_SF90_Camera")
cam_data.lens = 62.0 # Prime Cinema Lens
cam_data.sensor_width = 36.0
cam_data.dof.use_dof = True
# Accurate distance to car focal center
cam_obj = bpy.data.objects.new("Camera", cam_data)
bpy.context.collection.objects.link(cam_obj)

# Position camera in dynamic low 3/4 front hero view
cam_obj.location = (-4.4, 4.8, 1.25)

# Target aiming at front three-quarters of Ferrari
track_target = bpy.data.objects.new("Cam_Target", None)
track_target.location = (-0.15, 0.55, 0.48)
bpy.context.collection.objects.link(track_target)

trk_con = cam_obj.constraints.new(type='TRACK_TO')
trk_con.target = track_target
trk_con.track_axis = 'TRACK_NEGATIVE_Z'
trk_con.up_axis = 'UP_Y'

# Set precise focus distance to target
cam_dist = (cam_obj.location - track_target.location).length
cam_data.dof.focus_distance = cam_dist
cam_data.dof.aperture_fstop = 2.8 # Crisp depth-of-field

scene.camera = cam_obj

# 17. Ensure Viewport Shading is in MATERIAL mode
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

# 18. Save .blend file & render test image
workspace_dir = r"c:\Users\subba\Downloads\prime -ps\face of me"
blend_path = os.path.join(workspace_dir, "unin_cinematic_scene.blend")
render_path = os.path.join(workspace_dir, "unin_cinematic_render.png")

bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print(f"[TEST V3 SUCCESS] Saved Blender project: {blend_path}")

scene.render.filepath = render_path
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
bpy.ops.render.render(write_still=True)
print(f"[TEST V3 SUCCESS] Rendered 1080p snapshot: {render_path}")
