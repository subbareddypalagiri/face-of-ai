# scratch/test_ferrari_pro_build_v4.py
# High-End Pro Ferrari SF90 Stradale Master Procedural Engine (Toroidal Tires, Crisp Lighting, Muscular Aero)
import bpy
import math
import mathutils
import os

print("[TEST V4] Building Ultra High-Fidelity Ferrari SF90 Stradale...")

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

# 3. Midnight World & Atmospheric Mist
scene.world = bpy.data.worlds.new("Midnight_Circuit_World")
scene.world.use_nodes = True
w_nodes = scene.world.node_tree.nodes
w_links = scene.world.node_tree.links
w_nodes.clear()

w_out = w_nodes.new('ShaderNodeOutputWorld')
w_bg = w_nodes.new('ShaderNodeBackground')
w_bg.inputs['Color'].default_value = (0.006, 0.008, 0.018, 1.0)
w_bg.inputs['Strength'].default_value = 0.65
w_links.new(w_bg.outputs['Background'], w_out.inputs['Surface'])

# Subtle god-ray mist (very low density to keep paint crisp and vibrant!)
w_vol = w_nodes.new('ShaderNodeVolumeScatter')
w_vol.inputs['Density'].default_value = 0.0018
w_vol.inputs['Anisotropy'].default_value = 0.72
w_vol.inputs['Color'].default_value = (0.75, 0.85, 1.0, 1.0)
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
t_bsdf.inputs['Base Color'].default_value = (0.020, 0.020, 0.022, 1.0)
t_bsdf.inputs['Metallic'].default_value = 0.08

t_noise = t_nodes.new('ShaderNodeTexNoise')
t_noise.inputs['Scale'].default_value = 14.0
t_noise.inputs['Detail'].default_value = 5.0
t_ramp = t_nodes.new('ShaderNodeValToRGB')
t_ramp.color_ramp.elements[0].position = 0.32
t_ramp.color_ramp.elements[0].color = (0.01, 0.01, 0.01, 1.0) # Mirror wet puddle
t_ramp.color_ramp.elements[1].position = 0.62
t_ramp.color_ramp.elements[1].color = (0.50, 0.50, 0.50, 1.0) # Rough tarmac

t_links.new(t_noise.outputs['Fac'], t_ramp.inputs['Fac'])
t_links.new(t_ramp.outputs['Color'], t_bsdf.inputs['Roughness'])
t_links.new(t_bsdf.outputs['BSDF'], t_out.inputs['Surface'])
track.data.materials.append(mat_track)

# Red & White Apex Kerbs
for k_side in [-1, 1]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(k_side * 5.6, 0, 0.02))
    kerb = bpy.context.view_layer.objects.active
    kerb.name = f"Apex_Kerb_{k_side}"
    kerb.scale = (0.6, 24.0, 0.02)
    bpy.ops.object.transform_apply(scale=True)
    
    mat_kerb = bpy.data.materials.new(name=f"Racing_Kerb_Mat_{k_side}")
    mat_kerb.use_nodes = True
    k_bsdf = mat_kerb.node_tree.nodes.get("Principled BSDF")
    if k_bsdf:
        k_bsdf.inputs['Base Color'].default_value = (0.85, 0.04, 0.05, 1.0) if k_side < 0 else (0.92, 0.92, 0.92, 1.0)
        k_bsdf.inputs['Roughness'].default_value = 0.35
    kerb.data.materials.append(mat_kerb)

# 5. Master Ferrari Group Root
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
ferrari_master = bpy.context.view_layer.objects.active
ferrari_master.name = "Ferrari_SF90_Master"

# --- SHADERS ---
# Rosso Corsa Metallic Clearcoat
mat_paint = bpy.data.materials.new(name="Ferrari_Rosso_Corsa")
mat_paint.use_nodes = True
p_bsdf = mat_paint.node_tree.nodes.get("Principled BSDF")
if p_bsdf:
    p_bsdf.inputs['Base Color'].default_value = (0.86, 0.010, 0.016, 1.0)
    p_bsdf.inputs['Metallic'].default_value = 0.25
    p_bsdf.inputs['Roughness'].default_value = 0.08
    if 'Coat Weight' in p_bsdf.inputs:
        p_bsdf.inputs['Coat Weight'].default_value = 1.0
        if 'Coat Roughness' in p_bsdf.inputs:
            p_bsdf.inputs['Coat Roughness'].default_value = 0.018
    elif 'Clearcoat' in p_bsdf.inputs:
        p_bsdf.inputs['Clearcoat'].default_value = 1.0
        if 'Clearcoat Roughness' in p_bsdf.inputs:
            p_bsdf.inputs['Clearcoat Roughness'].default_value = 0.018

# Obsidian Tinted Glass
mat_glass = bpy.data.materials.new(name="Obsidian_Tinted_Glass")
mat_glass.use_nodes = True
g_bsdf = mat_glass.node_tree.nodes.get("Principled BSDF")
if g_bsdf:
    g_bsdf.inputs['Base Color'].default_value = (0.012, 0.018, 0.030, 1.0)
    g_bsdf.inputs['Roughness'].default_value = 0.018
    g_bsdf.inputs['IOR'].default_value = 1.52
    if 'Transmission Weight' in g_bsdf.inputs:
        g_bsdf.inputs['Transmission Weight'].default_value = 0.94
    elif 'Transmission' in g_bsdf.inputs:
        g_bsdf.inputs['Transmission'].default_value = 0.94

# Satin Carbon Fiber
mat_carbon = bpy.data.materials.new(name="PBR_Carbon_Fiber_Weave")
mat_carbon.use_nodes = True
c_bsdf = mat_carbon.node_tree.nodes.get("Principled BSDF")
if c_bsdf:
    c_bsdf.inputs['Base Color'].default_value = (0.022, 0.022, 0.025, 1.0)
    c_bsdf.inputs['Metallic'].default_value = 0.88
    c_bsdf.inputs['Roughness'].default_value = 0.18

# Pirelli Rubber Tire
mat_rubber = bpy.data.materials.new(name="Pirelli_PZero_Rubber")
mat_rubber.use_nodes = True
r_bsdf = mat_rubber.node_tree.nodes.get("Principled BSDF")
if r_bsdf:
    r_bsdf.inputs['Base Color'].default_value = (0.018, 0.018, 0.018, 1.0)
    r_bsdf.inputs['Roughness'].default_value = 0.58

# Brembo Yellow Brake Caliper
mat_caliper = bpy.data.materials.new(name="Giallo_Modena_Caliper")
mat_caliper.use_nodes = True
cal_bsdf = mat_caliper.node_tree.nodes.get("Principled BSDF")
if cal_bsdf:
    cal_bsdf.inputs['Base Color'].default_value = (0.98, 0.82, 0.02, 1.0)
    cal_bsdf.inputs['Metallic'].default_value = 0.35
    cal_bsdf.inputs['Roughness'].default_value = 0.16

# Forged Bright Liquid Silver Alloy Rim
mat_alloy = bpy.data.materials.new(name="Forged_Alloy_Silver")
mat_alloy.use_nodes = True
a_bsdf = mat_alloy.node_tree.nodes.get("Principled BSDF")
if a_bsdf:
    a_bsdf.inputs['Base Color'].default_value = (0.80, 0.82, 0.86, 1.0)
    a_bsdf.inputs['Metallic'].default_value = 0.98
    a_bsdf.inputs['Roughness'].default_value = 0.08

# Carbon Ceramic Brake Disc
mat_disc = bpy.data.materials.new(name="Carbon_Ceramic_Disc")
mat_disc.use_nodes = True
d_bsdf = mat_disc.node_tree.nodes.get("Principled BSDF")
if d_bsdf:
    d_bsdf.inputs['Base Color'].default_value = (0.10, 0.10, 0.11, 1.0)
    d_bsdf.inputs['Metallic'].default_value = 0.90
    d_bsdf.inputs['Roughness'].default_value = 0.25

# Scuderia Yellow Shield Badge
mat_shield = bpy.data.materials.new(name="Ferrari_Scuderia_Yellow")
mat_shield.use_nodes = True
s_bsdf = mat_shield.node_tree.nodes.get("Principled BSDF")
if s_bsdf:
    s_bsdf.inputs['Base Color'].default_value = (0.98, 0.84, 0.02, 1.0)
    s_bsdf.inputs['Roughness'].default_value = 0.12

# 6. Ferrari SF90 Stradale Aerodynamic Monocoque Body
# Main body: Sculpted unibody with pronounced wheel arch blisters, low hood, and side air scoops
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.10, 0.46))
body = bpy.context.view_layer.objects.active
body.name = "Ferrari_SF90_Main_Body"
body.scale = (1.92, 4.65, 0.48)
bpy.ops.object.transform_apply(scale=True)
body.parent = ferrari_master
body.data.materials.append(mat_paint)

# Front Nose Taper Modifier: Taper front down
bev_body = body.modifiers.new(name="Bevel", type='BEVEL')
bev_body.width = 0.18
bev_body.segments = 4

sub_body = body.modifiers.new(name="Subdivision", type='SUBSURF')
sub_body.levels = 3
sub_body.render_levels = 4
bpy.ops.object.shade_smooth()

# Aerodynamic Sculpted Front Hood (S-Duct Nostril Channels)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 1.35, 0.58))
hood = bpy.context.view_layer.objects.active
hood.name = "Ferrari_Aero_Hood"
hood.scale = (1.52, 1.75, 0.22)
hood.rotation_euler = (math.radians(-8), 0, 0)
bpy.ops.object.transform_apply(scale=True, rotation=True)
hood.parent = ferrari_master
hood.data.materials.append(mat_paint)

bev_hood = hood.modifiers.new(name="Bevel", type='BEVEL')
bev_hood.width = 0.12
bev_hood.segments = 3
sub_hood = hood.modifiers.new(name="Subsurf", type='SUBSURF')
sub_hood.levels = 2
bpy.ops.object.shade_smooth()

# 4 Flared Muscular Wheel Fender Haunches (Wrapping over tires)
fender_coords = [
    ("FL", -0.92,  1.45, 0.52, 0.32, 1.15, 0.36),
    ("FR",  0.92,  1.45, 0.52, 0.32, 1.15, 0.36),
    ("RL", -0.96, -1.45, 0.58, 0.36, 1.25, 0.42),
    ("RR",  0.96, -1.45, 0.58, 0.36, 1.25, 0.42)
]

for fname, fx, fy, fz, sx, sy, sz in fender_coords:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.48, depth=0.28, location=(fx, fy, fz), rotation=(0, math.radians(90), 0))
    fender = bpy.context.view_layer.objects.active
    fender.name = f"Fender_Haunch_{fname}"
    fender.scale = (1.0, 1.25, 0.85)
    bpy.ops.object.transform_apply(scale=True)
    fender.parent = ferrari_master
    fender.data.materials.append(mat_paint)
    
    f_sub = fender.modifiers.new(name="Subsurf", type='SUBSURF')
    f_sub.levels = 2
    bpy.ops.object.shade_smooth()

# 7. Aerodynamic Cockpit Teardrop Greenhouse Canopy
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.05, 0.88))
canopy = bpy.context.view_layer.objects.active
canopy.name = "Ferrari_Glass_Canopy"
canopy.scale = (1.30, 2.10, 0.42)
bpy.ops.object.transform_apply(scale=True)
canopy.parent = ferrari_master
canopy.data.materials.append(mat_glass)

c_bev = canopy.modifiers.new(name="Bevel", type='BEVEL')
c_bev.width = 0.22
c_bev.segments = 5
c_sub = canopy.modifiers.new(name="Subsurf", type='SUBSURF')
c_sub.levels = 3
bpy.ops.object.shade_smooth()

# Cockpit Roof Cap (Rosso Corsa Roof Center)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.10, 1.08))
roof = bpy.context.view_layer.objects.active
roof.name = "Ferrari_Roof_Cap"
roof.scale = (1.05, 1.40, 0.05)
bpy.ops.object.transform_apply(scale=True)
roof.parent = ferrari_master
roof.data.materials.append(mat_paint)

r_bev = roof.modifiers.new(name="Bevel", type='BEVEL')
r_bev.width = 0.08
r_bev.segments = 3
bpy.ops.object.shade_smooth()

# 8. Twin-Turbo V8 Engine Block (under rear glass hatch)
bpy.ops.mesh.primitive_cube_add(size=0.6, location=(0, -0.72, 0.68))
engine_block = bpy.context.view_layer.objects.active
engine_block.name = "Twin_Turbo_V8_Engine"
engine_block.scale = (0.85, 1.25, 0.38)
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
bpy.ops.mesh.primitive_cylinder_add(radius=0.045, depth=0.01, location=(0, 2.22, 0.46), rotation=(math.radians(35), 0, 0))
badge = bpy.context.view_layer.objects.active
badge.name = "Scuderia_Ferrari_Badge"
badge.scale = (1.0, 1.3, 1.0)
badge.parent = ferrari_master
badge.data.materials.append(mat_shield)

# 10. Carbon Fiber Aero Splitter, Side Skirts, Rear Diffuser & Wing
# Front 3-Piece Carbon Splitter
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 2.45, 0.16))
front_splitter = bpy.context.view_layer.objects.active
front_splitter.name = "Carbon_Front_Splitter"
front_splitter.scale = (2.08, 0.45, 0.05)
bpy.ops.object.transform_apply(scale=True)
front_splitter.parent = ferrari_master
front_splitter.data.materials.append(mat_carbon)

# Splitter Side Winglets
for wx in [-1.02, 1.02]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(wx, 2.40, 0.25))
    winglet = bpy.context.view_layer.objects.active
    winglet.name = f"Splitter_Winglet_{wx}"
    winglet.scale = (0.04, 0.35, 0.18)
    bpy.ops.object.transform_apply(scale=True)
    winglet.parent = ferrari_master
    winglet.data.materials.append(mat_carbon)

# Side Skirt Rocker Panels
for sx in [-0.98, 0.98]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx, 0.0, 0.20))
    skirt = bpy.context.view_layer.objects.active
    skirt.name = f"Carbon_Side_Skirt_{sx}"
    skirt.scale = (0.12, 2.2, 0.04)
    bpy.ops.object.transform_apply(scale=True)
    skirt.parent = ferrari_master
    skirt.data.materials.append(mat_carbon)

# Rear Carbon Diffuser with Strakes
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -2.35, 0.22))
rear_diffuser = bpy.context.view_layer.objects.active
rear_diffuser.name = "Carbon_Rear_Diffuser"
rear_diffuser.scale = (2.10, 0.42, 0.06)
bpy.ops.object.transform_apply(scale=True)
rear_diffuser.parent = ferrari_master
rear_diffuser.data.materials.append(mat_carbon)

for s_idx in range(6):
    s_x = -0.84 + (s_idx * 0.33)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(s_x, -2.38, 0.18))
    strake = bpy.context.view_layer.objects.active
    strake.name = f"Diffuser_Strake_{s_idx+1}"
    strake.scale = (0.025, 0.35, 0.14)
    bpy.ops.object.transform_apply(scale=True)
    strake.parent = ferrari_master
    strake.data.materials.append(mat_carbon)

# Active Rear Wing (Gurney Flap)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -2.30, 0.76))
rear_wing = bpy.context.view_layer.objects.active
rear_wing.name = "Active_Aero_Rear_Wing"
rear_wing.scale = (1.98, 0.30, 0.035)
bpy.ops.object.transform_apply(scale=True)
rear_wing.parent = ferrari_master
rear_wing.data.materials.append(mat_carbon)

# Dual Center Titanium Exhaust Tips
for ex_side in [-0.13, 0.13]:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=0.25, location=(ex_side, -2.36, 0.54), rotation=(math.radians(90), 0, 0))
    exhaust = bpy.context.view_layer.objects.active
    exhaust.name = f"Titanium_Exhaust_{ex_side}"
    exhaust.parent = ferrari_master
    exhaust.data.materials.append(mat_alloy)

# 11. Pro High-Detail Wheel Assemblies (Torus Hollow Tires, Recessed Silver Rims, 10 Spokes, Drilled Rotors, Yellow Brembos)
wheel_positions = [
    ("FL", -0.96,  1.45, 0.36),
    ("FR",  0.96,  1.45, 0.36),
    ("RL", -1.00, -1.45, 0.36),
    ("RR",  1.00, -1.45, 0.36)
]

for name, wx, wy, wz in wheel_positions:
    is_left = wx < 0
    face_dir = -1.0 if is_left else 1.0
    
    # A. Pirelli P-Zero Curved Torus Tire (Hollow center so rim & spokes are 100% visible!)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.28, minor_radius=0.08, location=(wx, wy, wz), rotation=(0, math.radians(90), 0))
    tire = bpy.context.view_layer.objects.active
    tire.name = f"Pirelli_Tire_{name}"
    tire.scale = (1.5, 1.0, 1.0) # Width along X
    bpy.ops.object.transform_apply(scale=True)
    tire.parent = ferrari_master
    tire.data.materials.append(mat_rubber)
    bpy.ops.object.shade_smooth()
    
    # B. Forged Silver Rim Cylinder Lip inside the torus
    rim_x = wx + (face_dir * 0.04)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.24, depth=0.14, location=(rim_x, wy, wz), rotation=(0, math.radians(90), 0))
    rim = bpy.context.view_layer.objects.active
    rim.name = f"Forged_Rim_{name}"
    rim.parent = ferrari_master
    rim.data.materials.append(mat_alloy)
    r_bev = rim.modifiers.new(name="Bevel", type='BEVEL')
    r_bev.width = 0.02
    bpy.ops.object.shade_smooth()
    
    # C. Center Yellow Hubcap
    hub_x = wx + (face_dir * 0.10)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=0.03, location=(hub_x, wy, wz), rotation=(0, math.radians(90), 0))
    hub = bpy.context.view_layer.objects.active
    hub.name = f"Ferrari_Hubcap_{name}"
    hub.parent = ferrari_master
    hub.data.materials.append(mat_shield)
    
    # D. 10 Sculpted Silver Alloy Spokes
    spoke_outer_x = wx + (face_dir * 0.08)
    for spk_i in range(10):
        angle = (spk_i / 10.0) * math.pi * 2.0
        sy = wy + math.sin(angle) * 0.13
        sz = wz + math.cos(angle) * 0.13
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(spoke_outer_x, sy, sz))
        spoke = bpy.context.view_layer.objects.active
        spoke.name = f"Spoke_{name}_{spk_i+1}"
        spoke.scale = (0.022, 0.025, 0.18)
        spoke.rotation_euler = (angle, 0, 0)
        bpy.ops.object.transform_apply(scale=True)
        spoke.parent = ferrari_master
        spoke.data.materials.append(mat_alloy)
        
    # E. Carbon Ceramic Drilled Brake Rotor (Inside the wheel)
    rotor_x = wx - (face_dir * 0.02)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.21, depth=0.025, location=(rotor_x, wy, wz), rotation=(0, math.radians(90), 0))
    rotor = bpy.context.view_layer.objects.active
    rotor.name = f"Brake_Rotor_{name}"
    rotor.parent = ferrari_master
    rotor.data.materials.append(mat_disc)
    
    # F. Giallo Modena Brembo 6-Piston Caliper (Visible at 2 o'clock!)
    caliper_x = wx + (face_dir * 0.02)
    caliper_y = wy + 0.12
    caliper_z = wz + 0.09
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(caliper_x, caliper_y, caliper_z))
    caliper = bpy.context.view_layer.objects.active
    caliper.name = f"Brembo_Caliper_{name}"
    caliper.scale = (0.07, 0.14, 0.08)
    bpy.ops.object.transform_apply(scale=True)
    caliper.parent = ferrari_master
    caliper.data.materials.append(mat_caliper)

# 12. Headlights: Aerodynamic Recessed Housings with Glowing Xenon Projectors
mat_hl_housing = bpy.data.materials.new(name="Headlight_Black_Housing")
mat_hl_housing.use_nodes = True
hlh_bsdf = mat_hl_housing.node_tree.nodes.get("Principled BSDF")
if hlh_bsdf:
    hlh_bsdf.inputs['Base Color'].default_value = (0.015, 0.015, 0.020, 1.0)
    hlh_bsdf.inputs['Roughness'].default_value = 0.15

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
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(hx, 2.10, 0.54))
    hl_house = bpy.context.view_layer.objects.active
    hl_house.name = f"Headlight_Housing_{hx}"
    hl_house.scale = (0.24, 0.16, 0.04)
    hl_house.rotation_euler = (math.radians(-16), 0, math.radians(-12 if hx > 0 else 12))
    bpy.ops.object.transform_apply(scale=True)
    hl_house.parent = ferrari_master
    hl_house.data.materials.append(mat_hl_housing)
    
    # Internal LED Projector Bar
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(hx, 2.12, 0.55))
    hl_led = bpy.context.view_layer.objects.active
    hl_led.name = f"Headlight_LED_{hx}"
    hl_led.scale = (0.18, 0.09, 0.02)
    hl_led.rotation_euler = (math.radians(-16), 0, math.radians(-12 if hx > 0 else 12))
    bpy.ops.object.transform_apply(scale=True)
    hl_led.parent = ferrari_master
    hl_led.data.materials.append(mat_headlight_led)
    
    # Forward projecting Xenon spotlight beam
    beam_data = bpy.data.lights.new(name=f"Xenon_Projector_Beam_{hx}", type='SPOT')
    beam_data.energy = 4200.0
    beam_data.spot_size = math.radians(60)
    beam_data.spot_blend = 0.35
    beam_data.color = (0.82, 0.92, 1.0)
    beam_obj = bpy.data.objects.new(name=f"Xenon_Spot_{hx}", object_data=beam_data)
    beam_obj.location = (hx, 2.22, 0.55)
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
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(tx, -2.36, 0.65))
    tl_obj = bpy.context.view_layer.objects.active
    tl_obj.name = f"Taillight_Bar_{tx}"
    tl_obj.scale = (0.34, 0.035, 0.03)
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

for sx in [-1.02, 1.02]:
    bpy.ops.mesh.primitive_plane_add(size=1.4, location=(sx, -2.65, 0.24), rotation=(math.radians(35), 0, math.radians(12 if sx < 0 else -12)))
    smoke_mesh = bpy.context.view_layer.objects.active
    smoke_mesh.name = f"Tire_Spray_Mist_{sx}"
    smoke_mesh.data.materials.append(mat_tire_smoke)
    smoke_mesh.parent = ferrari_master

# 15. Studio Key & Rim Lights
key_data = bpy.data.lights.new(name="Track_High_Key", type='AREA')
key_data.energy = 3600.0
key_data.size = 8.0
key_data.color = (0.95, 0.97, 1.0)
key_obj = bpy.data.objects.new("Track_High_Key", key_data)
key_obj.location = (-5.5, 4.2, 5.8)
key_obj.rotation_euler = (math.radians(-48), math.radians(-26), math.radians(30))
bpy.context.collection.objects.link(key_obj)

rim_data = bpy.data.lights.new(name="Midnight_Cyan_Rim", type='SPOT')
rim_data.energy = 4500.0
rim_data.spot_size = math.radians(50)
rim_data.color = (0.28, 0.72, 1.0)
rim_obj = bpy.data.objects.new("Midnight_Cyan_Rim", rim_data)
rim_obj.location = (5.5, -4.5, 5.2)
rim_obj.rotation_euler = (math.radians(48), math.radians(22), math.radians(-125))
bpy.context.collection.objects.link(rim_obj)

# Front Hero Fill Light for Rosso Corsa Gloss Highlights
front_fill_data = bpy.data.lights.new(name="Front_Hero_Fill", type='AREA')
front_fill_data.energy = 1800.0
front_fill_data.size = 4.0
front_fill_data.color = (1.0, 0.95, 0.92)
front_fill = bpy.data.objects.new("Front_Hero_Fill", front_fill_data)
front_fill.location = (-2.5, 5.5, 2.5)
front_fill.rotation_euler = (math.radians(-35), math.radians(15), 0)
bpy.context.collection.objects.link(front_fill)

# 16. Hero 3/4 Front Low Camera (Crisp Telephoto Compression, Razor Focus)
cam_data = bpy.data.cameras.new("Hero_SF90_Camera")
cam_data.lens = 65.0 # Prime Cinema Lens
cam_data.sensor_width = 36.0
cam_data.dof.use_dof = True

cam_obj = bpy.data.objects.new("Camera", cam_data)
bpy.context.collection.objects.link(cam_obj)

# Position camera in classic low 3/4 front hero view
cam_obj.location = (-4.6, 5.2, 1.25)

# Target aiming at front three-quarters of Ferrari
track_target = bpy.data.objects.new("Cam_Target", None)
track_target.location = (-0.10, 0.65, 0.48)
bpy.context.collection.objects.link(track_target)

trk_con = cam_obj.constraints.new(type='TRACK_TO')
trk_con.target = track_target
trk_con.track_axis = 'TRACK_NEGATIVE_Z'
trk_con.up_axis = 'UP_Y'

# Set focus distance directly to the car
cam_dist = (cam_obj.location - track_target.location).length
cam_data.dof.focus_distance = cam_dist
cam_data.dof.aperture_fstop = 3.5 # Crisp, clear focus across entire vehicle!

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
print(f"[TEST V4 SUCCESS] Saved Blender project: {blend_path}")

scene.render.filepath = render_path
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
bpy.ops.render.render(write_still=True)
print(f"[TEST V4 SUCCESS] Rendered 1080p snapshot: {render_path}")
