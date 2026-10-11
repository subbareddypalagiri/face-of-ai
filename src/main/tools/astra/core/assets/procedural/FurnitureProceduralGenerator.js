// src/main/tools/astra/core/assets/procedural/FurnitureProceduralGenerator.js
// Parametric High-Poly Furniture Procedural Assembly Engine
'use strict';

class FurnitureProceduralGenerator {
  /**
   * Generates Blender Python script for a high-fidelity Ergonomic Chair
   */
  static generateChairBpy(entityId, loc = [0, 0, 0], dim = [0.6, 0.6, 0.95]) {
    return `
# ==============================================================================
# PROCEDURAL FURNITURE: ERGONOMIC TIMBER & FABRIC CHAIR
# Dimensions: ~${dim[0]}m W x ~${dim[1]}m L x ~${dim[2]}m H
# Assembly: Contoured Backrest, Upholstered Seat Cushion, Solid Wood Base Plate,
# Tapered Angled Legs, Structural Stretchers, Floor Glides
# ==============================================================================
import bpy
import bmesh
import math
import mathutils

entity_id = "${entityId}"
base_loc = (${loc[0]}, ${loc[1]}, ${loc[2]})

focal_root = bpy.data.objects.new(entity_id, None)
focal_root["unin_id"] = entity_id
focal_root["unin_hero"] = 1
focal_root.empty_display_type = 'ARROWS'
focal_root.location = base_loc
bpy.context.collection.objects.link(focal_root)

# 1. Procedural Honey Oak Wood with organic grain & micro-bump
mat_wood = bpy.data.materials.new(name=f"{entity_id}_Oak_Wood")
mat_wood.use_nodes = True
w_nodes = mat_wood.node_tree.nodes
w_links = mat_wood.node_tree.links
w_nodes.clear()

node_out = w_nodes.new('ShaderNodeOutputMaterial')
node_bsdf = w_nodes.new('ShaderNodeBsdfPrincipled')
node_tc = w_nodes.new('ShaderNodeTexCoord')
node_map = w_nodes.new('ShaderNodeMapping')
node_wave = w_nodes.new('ShaderNodeTexWave')
node_ramp = w_nodes.new('ShaderNodeValToRGB')
node_bump = w_nodes.new('ShaderNodeBump')

node_wave.wave_type = 'BANDS'
node_wave.bands_direction = 'Y'
node_wave.inputs['Scale'].default_value = 5.0
node_wave.inputs['Distortion'].default_value = 1.6
node_wave.inputs['Detail'].default_value = 3.0

ramp = node_ramp.color_ramp
ramp.elements[0].position = 0.35
ramp.elements[0].color = (0.50, 0.28, 0.12, 1.0) # Warm Honey Oak
ramp.elements[1].position = 0.75
ramp.elements[1].color = (0.28, 0.14, 0.06, 1.0) # Deep Grain Walnut

node_bump.inputs['Strength'].default_value = 0.025
node_bump.inputs['Distance'].default_value = 0.015

w_links.new(node_tc.outputs['Object'], node_map.inputs['Vector'])
w_links.new(node_map.outputs['Vector'], node_wave.inputs['Vector'])
w_links.new(node_wave.outputs['Color'], node_ramp.inputs['Fac'])
w_links.new(node_ramp.outputs['Color'], node_bsdf.inputs['Base Color'])
w_links.new(node_wave.outputs['Fac'], node_bump.inputs['Height'])
w_links.new(node_bump.outputs['Normal'], node_bsdf.inputs['Normal'])

node_bsdf.inputs['Roughness'].default_value = 0.36
w_links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])

# 2. Procedural Upholstered Fabric Cushion
mat_fabric = bpy.data.materials.new(name=f"{entity_id}_Fabric_Cushion")
mat_fabric.use_nodes = True
f_nodes = mat_fabric.node_tree.nodes
f_links = mat_fabric.node_tree.links
f_nodes.clear()

f_out = f_nodes.new('ShaderNodeOutputMaterial')
f_bsdf = f_nodes.new('ShaderNodeBsdfPrincipled')
f_tc = f_nodes.new('ShaderNodeTexCoord')
f_noise = f_nodes.new('ShaderNodeTexNoise')
f_bump = f_nodes.new('ShaderNodeBump')

f_noise.inputs['Scale'].default_value = 45.0
f_noise.inputs['Detail'].default_value = 4.0
f_bump.inputs['Strength'].default_value = 0.04
f_bump.inputs['Distance'].default_value = 0.01

f_links.new(f_tc.outputs['Object'], f_noise.inputs['Vector'])
f_links.new(f_noise.outputs['Fac'], f_bump.inputs['Height'])
f_links.new(f_bump.outputs['Normal'], f_bsdf.inputs['Normal'])

f_bsdf.inputs['Base Color'].default_value = (0.12, 0.15, 0.20, 1.0)
f_bsdf.inputs['Roughness'].default_value = 0.88
if 'Sheen Weight' in f_bsdf.inputs:
    f_bsdf.inputs['Sheen Weight'].default_value = 0.65
elif 'Sheen' in f_bsdf.inputs:
    f_bsdf.inputs['Sheen'].default_value = 0.65

f_links.new(f_bsdf.outputs['BSDF'], f_out.inputs['Surface'])

# 3. Structural Glides Steel
mat_metal = bpy.data.materials.new(name=f"{entity_id}_Dark_Steel")
mat_metal.use_nodes = True
b_m = mat_metal.node_tree.nodes.get('Principled BSDF')
if b_m:
    b_m.inputs['Base Color'].default_value = (0.1, 0.1, 0.1, 1.0)
    b_m.inputs['Roughness'].default_value = 0.25
    if 'Metallic' in b_m.inputs: b_m.inputs['Metallic'].default_value = 0.9

def add_part(name, mesh_func, loc_rel, rot_rel=(0,0,0), mat=mat_wood):
    obj = mesh_func()
    obj.name = f"{entity_id}_{name}"
    obj["unin_id"] = f"{entity_id}_{name}"
    obj.location = (base_loc[0] + loc_rel[0], base_loc[1] + loc_rel[1], base_loc[2] + loc_rel[2])
    obj.rotation_euler = rot_rel
    obj.parent = focal_root
    if mat: obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return obj

# 1. Solid Seat Base Plate
def create_seat_plate():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.50, 0.48, 0.04)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.015
    bev.segments = 3
    return o
add_part("Seat_Plate", create_seat_plate, (0, 0, 0.42), mat=mat_wood)

# 2. Upholstered Seat Cushion
def create_cushion():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.47, 0.45, 0.07)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.03
    bev.segments = 4
    return o
add_part("Seat_Cushion", create_cushion, (0, -0.01, 0.47), mat=mat_fabric)

# 3. Ergonomic Contoured Backrest with Bend Curvature
def create_backrest():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.46, 0.045, 0.28)
    bpy.ops.object.transform_apply(scale=True)
    sub = o.modifiers.new("Subsurf", 'SUBSURF')
    sub.levels = 2
    sub.render_levels = 2
    bend = o.modifiers.new("Bend", 'SIMPLE_DEFORM')
    bend.deform_method = 'BEND'
    bend.deform_axis = 'Z'
    bend.angle = math.radians(28)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.015
    bev.segments = 3
    return o
add_part("Backrest_Panel", create_backrest, (0, 0.20, 0.78), rot_rel=(math.radians(-6), 0, 0), mat=mat_wood)

# 4. Backrest Support Stiles (Left & Right)
def create_stile():
    bpy.ops.mesh.primitive_cylinder_add(radius=0.018, depth=0.48, vertices=16)
    o = bpy.context.view_layer.objects.active
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.005
    bev.segments = 2
    return o
add_part("Back_Stile_L", create_stile, (-0.18, 0.19, 0.66), rot_rel=(math.radians(-6), 0, 0), mat=mat_wood)
add_part("Back_Stile_R", create_stile, (0.18, 0.19, 0.66), rot_rel=(math.radians(-6), 0, 0), mat=mat_wood)

# 5. Front Legs (Left & Right)
def create_front_leg():
    bpy.ops.mesh.primitive_cylinder_add(radius=0.022, depth=0.42, vertices=16)
    o = bpy.context.view_layer.objects.active
    o.scale = (1.0, 1.0, 1.0)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.005
    bev.segments = 2
    return o
add_part("Leg_Front_L", create_front_leg, (-0.20, -0.19, 0.21), rot_rel=(math.radians(3), math.radians(-3), 0), mat=mat_wood)
add_part("Leg_Front_R", create_front_leg, (0.20, -0.19, 0.21), rot_rel=(math.radians(3), math.radians(3), 0), mat=mat_wood)

# 6. Rear Legs (Left & Right with splay)
def create_rear_leg():
    bpy.ops.mesh.primitive_cylinder_add(radius=0.022, depth=0.42, vertices=16)
    o = bpy.context.view_layer.objects.active
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.005
    bev.segments = 2
    return o
add_part("Leg_Rear_L", create_rear_leg, (-0.20, 0.18, 0.21), rot_rel=(math.radians(-5), math.radians(-3), 0), mat=mat_wood)
add_part("Leg_Rear_R", create_rear_leg, (0.20, 0.18, 0.21), rot_rel=(math.radians(-5), math.radians(3), 0), mat=mat_wood)

# 7. Structural Stretchers (Bracing rails)
def create_stretcher():
    bpy.ops.mesh.primitive_cylinder_add(radius=0.012, depth=0.36, vertices=12)
    o = bpy.context.view_layer.objects.active
    return o
add_part("Stretcher_Side_L", create_stretcher, (-0.20, 0.0, 0.15), rot_rel=(math.radians(90), 0, 0), mat=mat_wood)
add_part("Stretcher_Side_R", create_stretcher, (0.20, 0.0, 0.15), rot_rel=(math.radians(90), 0, 0), mat=mat_wood)
add_part("Stretcher_Cross", create_stretcher, (0.0, 0.0, 0.15), rot_rel=(0, math.radians(90), 0), mat=mat_wood)
`;
  }

  /**
   * Generates Blender Python script for a high-fidelity Executive Office Desk
   */
  static generateDeskBpy(entityId, loc = [0, 0, 0], dim = [1.6, 0.8, 0.76]) {
    return `
# ==============================================================================
# PROCEDURAL FURNITURE: EXECUTIVE OFFICE DESK
# Dimensions: ~${dim[0]}m W x ~${dim[1]}m L x ~${dim[2]}m H
# Assembly: Bevelled Desktop Slab, Pedestal Unit with 3 Drawers, Aluminum Bar
# Handles, Cable Pass-Through Port, Heavy-Gauge Steel Leg Frame, Modesty Panel
# ==============================================================================
import bpy
import bmesh
import math
import mathutils

entity_id = "${entityId}"
base_loc = (${loc[0]}, ${loc[1]}, ${loc[2]})

focal_root = bpy.data.objects.new(entity_id, None)
focal_root["unin_id"] = entity_id
focal_root["unin_hero"] = 1
focal_root.empty_display_type = 'ARROWS'
focal_root.location = base_loc
bpy.context.collection.objects.link(focal_root)

# Materials
mat_timber = bpy.data.materials.new(name=f"{entity_id}_Walnut_Timber")
mat_timber.use_nodes = True
b_t = mat_timber.node_tree.nodes.get('Principled BSDF')
if b_t:
    b_t.inputs['Base Color'].default_value = (0.25, 0.15, 0.09, 1.0)
    b_t.inputs['Roughness'].default_value = 0.38

mat_steel = bpy.data.materials.new(name=f"{entity_id}_Powder_Steel")
mat_steel.use_nodes = True
b_s = mat_steel.node_tree.nodes.get('Principled BSDF')
if b_s:
    b_s.inputs['Base Color'].default_value = (0.08, 0.08, 0.09, 1.0)
    b_s.inputs['Roughness'].default_value = 0.40
    if 'Metallic' in b_s.inputs: b_s.inputs['Metallic'].default_value = 0.8

mat_alum = bpy.data.materials.new(name=f"{entity_id}_Brushed_Alum")
mat_alum.use_nodes = True
b_a = mat_alum.node_tree.nodes.get('Principled BSDF')
if b_a:
    b_a.inputs['Base Color'].default_value = (0.85, 0.86, 0.88, 1.0)
    b_a.inputs['Roughness'].default_value = 0.22
    if 'Metallic' in b_a.inputs: b_a.inputs['Metallic'].default_value = 0.95

def add_part(name, mesh_func, loc_rel, rot_rel=(0,0,0), mat=mat_timber):
    obj = mesh_func()
    obj.name = f"{entity_id}_{name}"
    obj["unin_id"] = f"{entity_id}_{name}"
    obj.location = (base_loc[0] + loc_rel[0], base_loc[1] + loc_rel[1], base_loc[2] + loc_rel[2])
    obj.rotation_euler = rot_rel
    obj.parent = focal_root
    if mat: obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return obj

# 1. Main Desktop Slab
def create_desktop():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (1.60, 0.80, 0.05)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.015
    bev.segments = 3
    return o
add_part("Desktop_Surface", create_desktop, (0, 0, 0.74), mat=mat_timber)

# 2. Cable Grommet Insert
def create_grommet():
    bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=0.055, vertices=24)
    o = bpy.context.view_layer.objects.active
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.005
    bev.segments = 2
    return o
add_part("Cable_Grommet", create_grommet, (0.58, 0.28, 0.745), mat=mat_alum)

# 3. Left Steel Leg Frame (Loop)
def create_leg_frame():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.06, 0.74, 0.71)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.008
    bev.segments = 2
    return o
add_part("Leg_Frame_Left", create_leg_frame, (-0.72, 0, 0.36), mat=mat_steel)

# 4. Modesty Back Panel
def create_modesty_panel():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (1.38, 0.03, 0.38)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.005
    bev.segments = 2
    return o
add_part("Modesty_Panel", create_modesty_panel, (-0.05, 0.32, 0.48), mat=mat_timber)

# 5. Right Pedestal Cabinet Box
def create_cabinet():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.44, 0.70, 0.66)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.012
    bev.segments = 3
    return o
add_part("Pedestal_Cabinet", create_cabinet, (0.52, 0, 0.36), mat=mat_timber)

# 6. Three Stacked Drawers (Top, Middle, Bottom)
def create_drawer(h):
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.41, 0.03, h)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.006
    bev.segments = 2
    return o

add_part("Drawer_Top", lambda: create_drawer(0.16), (0.52, -0.36, 0.58), mat=mat_timber)
add_part("Drawer_Mid", lambda: create_drawer(0.18), (0.52, -0.36, 0.38), mat=mat_timber)
add_part("Drawer_Bot", lambda: create_drawer(0.22), (0.52, -0.36, 0.16), mat=mat_timber)

# 7. Brushed Aluminum Drawer Pull Handles
def create_handle():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.18, 0.02, 0.015)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.003
    bev.segments = 2
    return o

add_part("Handle_Top", create_handle, (0.52, -0.385, 0.58), mat=mat_alum)
add_part("Handle_Mid", create_handle, (0.52, -0.385, 0.38), mat=mat_alum)
add_part("Handle_Bot", create_handle, (0.52, -0.385, 0.16), mat=mat_alum)
`;
  }
}

module.exports = { FurnitureProceduralGenerator };
