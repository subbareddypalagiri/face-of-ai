// src/main/tools/astra/core/assets/procedural/VehicleProceduralGenerator.js
// Parametric High-Poly Vehicle Procedural Assembly Engine (Airliners, Spaceships, Ground Vehicles)
'use strict';

class VehicleProceduralGenerator {
  /**
   * Generates Blender Python script for a high-fidelity Commercial Passenger Airliner
   */
  static generateAirplaneBpy(entityId, loc = [0, 0, 0], dim = [28.0, 32.0, 8.5]) {
    return `
# ==============================================================================
# PROCEDURAL VEHICLE: COMMERCIAL PASSENGER AIRLINER (HIGH-FIDELITY ASSEMBLY)
# Dimensions: ~${dim[0]}m W x ~${dim[1]}m L x ~${dim[2]}m H
# Assembly: Aerodynamic Cylindrical Fuselage, Tapered Nose Radome, Cockpit Windshield,
# Low Swept Cantilever Wings with Winglets, Twin Underslung Turbofan Jet Engines,
# Pylon Struts, Intake Fan Spinners, Exhaust Nozzles, Swept Empennage (Vertical &
# Horizontal Stabilizers), Tricycle Landing Gear with Rubber Tires
# ==============================================================================
import bpy
import bmesh
import math
import mathutils

entity_id = "${entityId}"
base_loc = (${loc[0]}, ${loc[1]}, ${loc[2]})

airliner_root = bpy.data.objects.new(entity_id, None)
airliner_root["unin_id"] = entity_id
airliner_root.empty_display_type = 'ARROWS'
airliner_root.location = base_loc
bpy.context.collection.objects.link(airliner_root)

# Materials
mat_livery = bpy.data.materials.new(name=f"{entity_id}_Airliner_Livery_White")
mat_livery.use_nodes = True
b_lv = mat_livery.node_tree.nodes.get('Principled BSDF')
if b_lv:
    b_lv.inputs['Base Color'].default_value = (0.92, 0.93, 0.95, 1.0)
    b_lv.inputs['Roughness'].default_value = 0.20
    if 'Clearcoat Weight' in b_lv.inputs: b_lv.inputs['Clearcoat Weight'].default_value = 0.85
    elif 'Clearcoat' in b_lv.inputs: b_lv.inputs['Clearcoat'].default_value = 0.85

mat_alum = bpy.data.materials.new(name=f"{entity_id}_Polished_Aluminum")
mat_alum.use_nodes = True
b_al = mat_alum.node_tree.nodes.get('Principled BSDF')
if b_al:
    b_al.inputs['Base Color'].default_value = (0.88, 0.89, 0.91, 1.0)
    b_al.inputs['Roughness'].default_value = 0.12
    if 'Metallic' in b_al.inputs: b_al.inputs['Metallic'].default_value = 0.95

mat_titanium = bpy.data.materials.new(name=f"{entity_id}_Turbine_Titanium")
mat_titanium.use_nodes = True
b_ti = mat_titanium.node_tree.nodes.get('Principled BSDF')
if b_ti:
    b_ti.inputs['Base Color'].default_value = (0.24, 0.25, 0.27, 1.0)
    b_ti.inputs['Roughness'].default_value = 0.32
    if 'Metallic' in b_ti.inputs: b_ti.inputs['Metallic'].default_value = 0.88

mat_glass = bpy.data.materials.new(name=f"{entity_id}_Cockpit_Glass")
mat_glass.use_nodes = True
b_gl = mat_glass.node_tree.nodes.get('Principled BSDF')
if b_gl:
    b_gl.inputs['Base Color'].default_value = (0.05, 0.08, 0.12, 1.0)
    b_gl.inputs['Roughness'].default_value = 0.04
    if 'Metallic' in b_gl.inputs: b_gl.inputs['Metallic'].default_value = 0.1

mat_tire = bpy.data.materials.new(name=f"{entity_id}_Rubber_Tire")
mat_tire.use_nodes = True
b_tr = mat_tire.node_tree.nodes.get('Principled BSDF')
if b_tr:
    b_tr.inputs['Base Color'].default_value = (0.015, 0.015, 0.016, 1.0)
    b_tr.inputs['Roughness'].default_value = 0.80

def add_part(name, mesh_func, loc_rel, rot_rel=(0,0,0), mat=mat_livery):
    obj = mesh_func()
    obj.name = f"{entity_id}_{name}"
    obj["unin_id"] = f"{entity_id}_{name}"
    obj.location = (base_loc[0] + loc_rel[0], base_loc[1] + loc_rel[1], base_loc[2] + loc_rel[2])
    obj.rotation_euler = rot_rel
    obj.parent = airliner_root
    if mat: obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return obj

# ----------------- 1. STREAMLINED FUSELAGE -----------------
# Main Cabin Cylinder
def create_fuselage_tube():
    bpy.ops.mesh.primitive_cylinder_add(radius=1.85, depth=22.0, vertices=32)
    o = bpy.context.view_layer.objects.active
    return o
add_part("Fuselage_Main", create_fuselage_tube, (0, 0, 4.2), rot_rel=(math.radians(90), 0, 0), mat=mat_livery)

# Tapered Nose Radome (Front)
def create_nose_radome():
    bpy.ops.mesh.primitive_cone_add(radius1=1.85, radius2=0.35, depth=4.8, vertices=32)
    o = bpy.context.view_layer.objects.active
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.08
    bev.segments = 2
    return o
add_part("Nose_Radome", create_nose_radome, (0, 13.4, 4.2), rot_rel=(math.radians(90), 0, 0), mat=mat_livery)

# Cockpit Windshield Glass Band
def create_windshield():
    bpy.ops.mesh.primitive_cylinder_add(radius=1.86, depth=1.6, vertices=32)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.95, 1.0, 0.45)
    bpy.ops.object.transform_apply(scale=True)
    return o
add_part("Cockpit_Windshield", create_windshield, (0, 12.2, 4.95), rot_rel=(math.radians(110), 0, 0), mat=mat_glass)

# Tailcone (Rear Taper)
def create_tailcone():
    bpy.ops.mesh.primitive_cone_add(radius1=1.85, radius2=0.25, depth=7.5, vertices=32)
    o = bpy.context.view_layer.objects.active
    return o
add_part("Tailcone", create_tailcone, (0, -14.75, 4.4), rot_rel=(math.radians(-90), 0, 0), mat=mat_livery)

# ----------------- 2. SWEPT WINGS & WINGLETS -----------------
for sx in [-1, 1]:
    pfx = 'L' if sx < 0 else 'R'
    # Main Swept Cantilever Wing
    def create_wing():
        bpy.ops.mesh.primitive_cube_add(size=1.0)
        o = bpy.context.view_layer.objects.active
        o.scale = (12.8, 3.4, 0.38)
        bpy.ops.object.transform_apply(scale=True)
        bev = o.modifiers.new("WingBevel", 'BEVEL')
        bev.width = 0.06
        bev.segments = 2
        return o
    add_part(f"Main_Wing_{pfx}", create_wing, (sx * 7.6, -1.2, 3.4), rot_rel=(math.radians(sx * -4), math.radians(sx * 4), math.radians(sx * 24)), mat=mat_livery)
    
    # Upturned Winglet Tip
    def create_winglet():
        bpy.ops.mesh.primitive_cube_add(size=1.0)
        o = bpy.context.view_layer.objects.active
        o.scale = (0.22, 1.4, 1.6)
        bpy.ops.object.transform_apply(scale=True)
        bev = o.modifiers.new("Bevel", 'BEVEL')
        bev.width = 0.04
        bev.segments = 2
        return o
    add_part(f"Winglet_{pfx}", create_winglet, (sx * 14.2, -3.2, 4.3), rot_rel=(0, math.radians(sx * 12), math.radians(sx * 24)), mat=mat_alum)

# ----------------- 3. TWIN UNDERSLUNG TURBOFAN JET ENGINES -----------------
for sx in [-1, 1]:
    pfx = 'L' if sx < 0 else 'R'
    ey = 0.6
    ex = sx * 5.2
    ez = 2.3
    
    # Engine Pylon Strut
    def create_pylon():
        bpy.ops.mesh.primitive_cube_add(size=1.0)
        o = bpy.context.view_layer.objects.active
        o.scale = (0.24, 2.8, 1.2)
        bpy.ops.object.transform_apply(scale=True)
        return o
    add_part(f"Engine_Pylon_{pfx}", create_pylon, (ex, ey, ez + 0.7), mat=mat_titanium)
    
    # Nacelle Outer Cowling
    def create_nacelle():
        bpy.ops.mesh.primitive_cylinder_add(radius=1.1, depth=4.2, vertices=28)
        o = bpy.context.view_layer.objects.active
        bev = o.modifiers.new("Bevel", 'BEVEL')
        bev.width = 0.08
        bev.segments = 3
        return o
    add_part(f"Engine_Nacelle_{pfx}", create_nacelle, (ex, ey, ez), rot_rel=(math.radians(90), 0, 0), mat=mat_livery)
    
    # Front Intake Spinner Cone
    def create_spinner():
        bpy.ops.mesh.primitive_cone_add(radius1=0.45, depth=0.9, vertices=20)
        return bpy.context.view_layer.objects.active
    add_part(f"Intake_Spinner_{pfx}", create_spinner, (ex, ey + 2.15, ez), rot_rel=(math.radians(-90), 0, 0), mat=mat_titanium)
    
    # Rear Exhaust Cone Nozzle
    def create_exhaust():
        bpy.ops.mesh.primitive_cone_add(radius1=0.75, radius2=0.55, depth=1.2, vertices=24)
        return bpy.context.view_layer.objects.active
    add_part(f"Exhaust_Nozzle_{pfx}", create_exhaust, (ex, ey - 2.5, ez), rot_rel=(math.radians(90), 0, 0), mat=mat_titanium)

# ----------------- 4. EMPENNAGE (TAIL ASSEMBLY) -----------------
# Swept Vertical Tail Fin Stabilizer
def create_vertical_fin():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.28, 4.4, 5.8)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.05
    bev.segments = 2
    return o
add_part("Vertical_Fin", create_vertical_fin, (0, -15.2, 7.8), rot_rel=(math.radians(-32), 0, 0), mat=mat_livery)

# Horizontal Tailplane Elevators (Left & Right)
for sx in [-1, 1]:
    pfx = 'L' if sx < 0 else 'R'
    def create_horizontal_tail():
        bpy.ops.mesh.primitive_cube_add(size=1.0)
        o = bpy.context.view_layer.objects.active
        o.scale = (4.8, 1.8, 0.18)
        bpy.ops.object.transform_apply(scale=True)
        bev = o.modifiers.new("Bevel", 'BEVEL')
        bev.width = 0.03
        bev.segments = 2
        return o
    add_part(f"Horizontal_Stabilizer_{pfx}", create_horizontal_tail, (sx * 2.8, -17.2, 5.2), rot_rel=(0, 0, math.radians(sx * 20)), mat=mat_alum)

# ----------------- 5. TRICYCLE LANDING GEAR (TIRES & STRUTS) -----------------
# Nose Gear (Front Center)
def create_gear_strut(depth):
    bpy.ops.mesh.primitive_cylinder_add(radius=0.10, depth=depth, vertices=16)
    return bpy.context.view_layer.objects.active
add_part("Nose_Gear_Strut", lambda: create_gear_strut(2.3), (0, 11.2, 1.15), mat=mat_titanium)

def create_wheel(r=0.45, w=0.25):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=w, vertices=24)
    return bpy.context.view_layer.objects.active
add_part("Nose_Wheel_L", lambda: create_wheel(0.40, 0.20), (-0.22, 11.2, 0.40), rot_rel=(0, math.radians(90), 0), mat=mat_tire)
add_part("Nose_Wheel_R", lambda: create_wheel(0.40, 0.20), (0.22, 11.2, 0.40), rot_rel=(0, math.radians(90), 0), mat=mat_tire)

# Main Gear (Left & Right under wings)
for sx in [-1, 1]:
    pfx = 'L' if sx < 0 else 'R'
    add_part(f"Main_Gear_Strut_{pfx}", lambda: create_gear_strut(2.4), (sx * 2.8, -1.2, 1.20), mat=mat_titanium)
    add_part(f"Main_Wheel_{pfx}_1", lambda: create_wheel(0.55, 0.32), (sx * 2.8 - 0.28, -0.85, 0.55), rot_rel=(0, math.radians(90), 0), mat=mat_tire)
    add_part(f"Main_Wheel_{pfx}_2", lambda: create_wheel(0.55, 0.32), (sx * 2.8 + 0.28, -0.85, 0.55), rot_rel=(0, math.radians(90), 0), mat=mat_tire)
    add_part(f"Main_Wheel_{pfx}_3", lambda: create_wheel(0.55, 0.32), (sx * 2.8 - 0.28, -1.55, 0.55), rot_rel=(0, math.radians(90), 0), mat=mat_tire)
    add_part(f"Main_Wheel_{pfx}_4", lambda: create_wheel(0.55, 0.32), (sx * 2.8 + 0.28, -1.55, 0.55), rot_rel=(0, math.radians(90), 0), mat=mat_tire)
`;
  }

  /**
   * Generates Blender Python script for a high-fidelity Sci-Fi Spaceship Interceptor
   */
  static generateSpaceshipBpy(entityId, loc = [0, 0, 0], dim = [7.5, 12.0, 3.2]) {
    return `
# ==============================================================================
# PROCEDURAL VEHICLE: SCI-FI STEALTH INTERCEPTOR SPACESHIP (HIGH-FIDELITY)
# Dimensions: ~${dim[0]}m W x ~${dim[1]}m L x ~${dim[2]}m H
# Assembly: Faceted Lifting Body Hull, Composite Armor Plates, Recessed Canopy
# Cockpit with Iridescent Shield Glass, Swept Canted Wings with Wingtip Rails,
# Twin Ion Plasma Thrusters with Glowing Blue Cores, Radiator Cooling Dorsal Fins
# ==============================================================================
import bpy
import bmesh
import math
import mathutils

entity_id = "${entityId}"
base_loc = (${loc[0]}, ${loc[1]}, ${loc[2]})

ship_root = bpy.data.objects.new(entity_id, None)
ship_root["unin_id"] = entity_id
ship_root.empty_display_type = 'ARROWS'
ship_root.location = base_loc
bpy.context.collection.objects.link(ship_root)

# Materials
mat_composite = bpy.data.materials.new(name=f"{entity_id}_Stealth_Composite")
mat_composite.use_nodes = True
b_cp = mat_composite.node_tree.nodes.get('Principled BSDF')
if b_cp:
    b_cp.inputs['Base Color'].default_value = (0.05, 0.06, 0.08, 1.0)
    b_cp.inputs['Roughness'].default_value = 0.22
    if 'Metallic' in b_cp.inputs: b_cp.inputs['Metallic'].default_value = 0.88

mat_plasma = bpy.data.materials.new(name=f"{entity_id}_Plasma_Thruster_Core")
mat_plasma.use_nodes = True
b_pl = mat_plasma.node_tree.nodes.get('Principled BSDF')
if b_pl:
    b_pl.inputs['Base Color'].default_value = (0.0, 0.85, 1.0, 1.0)
    if 'Emission Color' in b_pl.inputs:
        b_pl.inputs['Emission Color'].default_value = (0.0, 0.85, 1.0, 1.0)
        b_pl.inputs['Emission Strength'].default_value = 35.0

mat_canopy = bpy.data.materials.new(name=f"{entity_id}_Shield_Canopy_Glass")
mat_canopy.use_nodes = True
b_cn = mat_canopy.node_tree.nodes.get('Principled BSDF')
if b_cn:
    b_cn.inputs['Base Color'].default_value = (0.02, 0.12, 0.18, 1.0)
    b_cn.inputs['Roughness'].default_value = 0.05
    if 'Metallic' in b_cn.inputs: b_cn.inputs['Metallic'].default_value = 0.45

mat_trim = bpy.data.materials.new(name=f"{entity_id}_Alloy_Armor_Trim")
mat_trim.use_nodes = True
b_tr = mat_trim.node_tree.nodes.get('Principled BSDF')
if b_tr:
    b_tr.inputs['Base Color'].default_value = (0.18, 0.20, 0.24, 1.0)
    b_tr.inputs['Roughness'].default_value = 0.28
    if 'Metallic' in b_tr.inputs: b_tr.inputs['Metallic'].default_value = 0.92

def add_part(name, mesh_func, loc_rel, rot_rel=(0,0,0), mat=mat_composite):
    obj = mesh_func()
    obj.name = f"{entity_id}_{name}"
    obj["unin_id"] = f"{entity_id}_{name}"
    obj.location = (base_loc[0] + loc_rel[0], base_loc[1] + loc_rel[1], base_loc[2] + loc_rel[2])
    obj.rotation_euler = rot_rel
    obj.parent = ship_root
    if mat: obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return obj

# ----------------- 1. FACETED LIFTING BODY HULL -----------------
# Main Central Lifting Body
def create_central_hull():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (2.4, 8.5, 0.95)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("HullBevel", 'BEVEL')
    bev.width = 0.18
    bev.segments = 3
    return o
add_part("Central_Hull", create_central_hull, (0, 0, 1.1), mat=mat_composite)

# Chiseled Forward Nosecone
def create_nose_cone():
    bpy.ops.mesh.primitive_cone_add(radius1=1.2, depth=3.8, vertices=16)
    o = bpy.context.view_layer.objects.active
    o.scale = (1.0, 1.0, 0.45)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("NoseBevel", 'BEVEL')
    bev.width = 0.05
    bev.segments = 2
    return o
add_part("Forward_Nosecone", create_nose_cone, (0, 5.8, 1.05), rot_rel=(math.radians(90), 0, 0), mat=mat_composite)

# Recessed Cockpit Canopy
def create_canopy():
    bpy.ops.mesh.primitive_cylinder_add(radius=0.75, depth=2.8, vertices=24)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.75, 1.0, 0.42)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("CanopyBevel", 'BEVEL')
    bev.width = 0.06
    bev.segments = 2
    return o
add_part("Cockpit_Canopy", create_canopy, (0, 2.2, 1.62), rot_rel=(math.radians(82), 0, 0), mat=mat_canopy)

# ----------------- 2. SWEPT CANTED WINGS & WINGLETS -----------------
for sx in [-1, 1]:
    pfx = 'L' if sx < 0 else 'R'
    # Main Swept Delta Wing Plate
    def create_delta_wing():
        bpy.ops.mesh.primitive_cube_add(size=1.0)
        o = bpy.context.view_layer.objects.active
        o.scale = (3.2, 4.8, 0.14)
        bpy.ops.object.transform_apply(scale=True)
        bev = o.modifiers.new("Bevel", 'BEVEL')
        bev.width = 0.04
        bev.segments = 2
        return o
    add_part(f"Delta_Wing_{pfx}", create_delta_wing, (sx * 2.4, -0.6, 1.05), rot_rel=(0, math.radians(sx * -6), math.radians(sx * 26)), mat=mat_composite)
    
    # Canted Wingtip Stabilizer Fin
    def create_canted_fin():
        bpy.ops.mesh.primitive_cube_add(size=1.0)
        o = bpy.context.view_layer.objects.active
        o.scale = (0.12, 2.2, 1.4)
        bpy.ops.object.transform_apply(scale=True)
        bev = o.modifiers.new("Bevel", 'BEVEL')
        bev.width = 0.03
        bev.segments = 2
        return o
    add_part(f"Canted_Fin_{pfx}", create_canted_fin, (sx * 3.8, -1.8, 1.65), rot_rel=(math.radians(-15), math.radians(sx * 28), 0), mat=mat_trim)

# ----------------- 3. DUAL ION PLASMA ENGINE THRUSTERS -----------------
for sx in [-1, 1]:
    pfx = 'L' if sx < 0 else 'R'
    tx = sx * 0.95
    ty = -4.6
    tz = 1.15
    
    # Outer Heavy Thruster Housing
    def create_thruster_bell():
        bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=2.4, vertices=24)
        o = bpy.context.view_layer.objects.active
        bev = o.modifiers.new("Bevel", 'BEVEL')
        bev.width = 0.05
        bev.segments = 2
        return o
    add_part(f"Ion_Housing_{pfx}", create_thruster_bell, (tx, ty, tz), rot_rel=(math.radians(90), 0, 0), mat=mat_trim)
    
    # Glowing Plasma Interior Core
    def create_plasma_core():
        bpy.ops.mesh.primitive_cylinder_add(radius=0.38, depth=0.6, vertices=24)
        return bpy.context.view_layer.objects.active
    add_part(f"Plasma_Core_{pfx}", create_plasma_core, (tx, ty - 1.05, tz), rot_rel=(math.radians(90), 0, 0), mat=mat_plasma)

# ----------------- 4. DORSAL RADIATOR FINS & GREEBLES -----------------
# Central Dorsal Spine Fin
def create_spine_fin():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.12, 3.6, 0.65)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.02
    bev.segments = 2
    return o
add_part("Dorsal_Spine_Fin", create_spine_fin, (0, -1.2, 1.82), mat=mat_trim)

# Left & Right Heat Dissipation Radiator Grilles
for sx in [-1, 1]:
    pfx = 'L' if sx < 0 else 'R'
    def create_radiator():
        bpy.ops.mesh.primitive_cube_add(size=1.0)
        o = bpy.context.view_layer.objects.active
        o.scale = (0.45, 2.2, 0.06)
        bpy.ops.object.transform_apply(scale=True)
        return o
    add_part(f"Radiator_Grille_{pfx}", create_radiator, (sx * 0.9, -0.8, 1.58), rot_rel=(0, math.radians(sx * 8), 0), mat=mat_trim)
`;
  }
}

module.exports = { VehicleProceduralGenerator };
