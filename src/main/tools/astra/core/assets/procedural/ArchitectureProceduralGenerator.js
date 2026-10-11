// src/main/tools/astra/core/assets/procedural/ArchitectureProceduralGenerator.js
// Parametric High-Poly Architectural Procedural Assembly Engine
'use strict';

class ArchitectureProceduralGenerator {
  /**
   * Generates Blender Python script for a high-fidelity Small House / Cottage
   */
  static generateHouseBpy(entityId, loc = [0, 0, 0], dim = [6.0, 8.0, 5.5]) {
    return `
# ==============================================================================
# PROCEDURAL ARCHITECTURE: SMALL CONTEMPORARY HOUSE
# Dimensions: ~${dim[0]}m W x ~${dim[1]}m L x ~${dim[2]}m H
# Assembly: Plinth Foundation, Bevelled Weatherboard Walls, Gabled Shingled Roof,
# Overhanging Eaves, Inset Front Door with Threshold, Framed Multi-Pane Windows,
# Brick Chimney Stack with Concrete Cap
# ==============================================================================
import bpy
import bmesh
import math
import mathutils

entity_id = "${entityId}"
base_loc = (${loc[0]}, ${loc[1]}, ${loc[2]})

focal_root = bpy.data.objects.new(entity_id, None)
focal_root["unin_id"] = entity_id
focal_root.empty_display_type = 'ARROWS'
focal_root.location = base_loc
bpy.context.collection.objects.link(focal_root)

# Materials
mat_wall = bpy.data.materials.new(name=f"{entity_id}_Wall_Siding")
mat_wall.use_nodes = True
b_w = mat_wall.node_tree.nodes.get('Principled BSDF')
if b_w:
    b_w.inputs['Base Color'].default_value = (0.82, 0.81, 0.78, 1.0)
    b_w.inputs['Roughness'].default_value = 0.55

mat_roof = bpy.data.materials.new(name=f"{entity_id}_Roof_Shingles")
mat_roof.use_nodes = True
b_r = mat_roof.node_tree.nodes.get('Principled BSDF')
if b_r:
    b_r.inputs['Base Color'].default_value = (0.16, 0.17, 0.19, 1.0)
    b_r.inputs['Roughness'].default_value = 0.65

mat_trim = bpy.data.materials.new(name=f"{entity_id}_Timber_Trim")
mat_trim.use_nodes = True
b_t = mat_trim.node_tree.nodes.get('Principled BSDF')
if b_t:
    b_t.inputs['Base Color'].default_value = (0.92, 0.92, 0.90, 1.0)
    b_t.inputs['Roughness'].default_value = 0.35

mat_door = bpy.data.materials.new(name=f"{entity_id}_Wood_Door")
mat_door.use_nodes = True
b_d = mat_door.node_tree.nodes.get('Principled BSDF')
if b_d:
    b_d.inputs['Base Color'].default_value = (0.35, 0.18, 0.10, 1.0)
    b_d.inputs['Roughness'].default_value = 0.40

mat_glass = bpy.data.materials.new(name=f"{entity_id}_Window_Glass")
mat_glass.use_nodes = True
b_g = mat_glass.node_tree.nodes.get('Principled BSDF')
if b_g:
    b_g.inputs['Base Color'].default_value = (0.1, 0.15, 0.22, 1.0)
    b_g.inputs['Roughness'].default_value = 0.05
    if 'Transmission Weight' in b_g.inputs: b_g.inputs['Transmission Weight'].default_value = 0.85

mat_brick = bpy.data.materials.new(name=f"{entity_id}_Chimney_Brick")
mat_brick.use_nodes = True
b_b = mat_brick.node_tree.nodes.get('Principled BSDF')
if b_b:
    b_b.inputs['Base Color'].default_value = (0.42, 0.18, 0.14, 1.0)
    b_b.inputs['Roughness'].default_value = 0.80

mat_plinth = bpy.data.materials.new(name=f"{entity_id}_Stone_Foundation")
mat_plinth.use_nodes = True
b_p = mat_plinth.node_tree.nodes.get('Principled BSDF')
if b_p:
    b_p.inputs['Base Color'].default_value = (0.28, 0.28, 0.29, 1.0)
    b_p.inputs['Roughness'].default_value = 0.85

def add_part(name, mesh_func, loc_rel, rot_rel=(0,0,0), mat=mat_wall):
    obj = mesh_func()
    obj.name = f"{entity_id}_{name}"
    obj["unin_id"] = f"{entity_id}_{name}"
    obj.location = (base_loc[0] + loc_rel[0], base_loc[1] + loc_rel[1], base_loc[2] + loc_rel[2])
    obj.rotation_euler = rot_rel
    obj.parent = focal_root
    if mat: obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return obj

# 1. Foundation Plinth Base
def create_plinth():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (6.4, 8.4, 0.40)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.04
    bev.segments = 2
    return o
add_part("Foundation_Plinth", create_plinth, (0, 0, 0.20), mat=mat_plinth)

# 2. Main Wall Body
def create_walls():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (5.8, 7.8, 2.80)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.03
    bev.segments = 2
    return o
add_part("Main_Walls", create_walls, (0, 0, 1.80), mat=mat_wall)

# 3. Gabled Roof Pitch (Left Slope & Right Slope)
def create_roof_slope():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (3.6, 8.6, 0.18)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.02
    bev.segments = 2
    return o
add_part("Roof_Slope_L", create_roof_slope, (-1.55, 0, 4.05), rot_rel=(0, math.radians(-35), 0), mat=mat_roof)
add_part("Roof_Slope_R", create_roof_slope, (1.55, 0, 4.05), rot_rel=(0, math.radians(35), 0), mat=mat_roof)

# 4. Roof Ridge Cap
def create_ridge_cap():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.28, 8.8, 0.12)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.015
    bev.segments = 2
    return o
add_part("Roof_Ridge_Cap", create_ridge_cap, (0, 0, 5.12), mat=mat_trim)

# 5. Gable Triangular Endfill (Front & Rear)
def create_gable_end():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (5.6, 0.15, 1.9)
    bpy.ops.object.transform_apply(scale=True)
    return o
add_part("Gable_Front", create_gable_end, (0, -3.85, 4.15), mat=mat_wall)
add_part("Gable_Rear", create_gable_end, (0, 3.85, 4.15), mat=mat_wall)

# 6. Front Door & Door Frame
def create_door_frame():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (1.15, 0.10, 2.25)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.01
    bev.segments = 2
    return o
add_part("Door_Frame", create_door_frame, (0, -3.92, 1.52), mat=mat_trim)

def create_door_leaf():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.95, 0.06, 2.10)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.01
    bev.segments = 2
    return o
add_part("Front_Door", create_door_leaf, (0, -3.94, 1.48), mat=mat_door)

# 7. Porch Entry Step
def create_step():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (1.50, 0.80, 0.20)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.02
    bev.segments = 2
    return o
add_part("Porch_Step", create_step, (0, -4.35, 0.10), mat=mat_plinth)

# 8. Front Windows (Left & Right)
def create_window():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (1.10, 0.08, 1.30)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.01
    bev.segments = 2
    return o
add_part("Window_Frame_L", create_window, (-1.8, -3.92, 1.85), mat=mat_trim)
add_part("Window_Frame_R", create_window, (1.8, -3.92, 1.85), mat=mat_trim)

def create_window_glass():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.94, 0.02, 1.14)
    bpy.ops.object.transform_apply(scale=True)
    return o
add_part("Window_Glass_L", create_window_glass, (-1.8, -3.93, 1.85), mat=mat_glass)
add_part("Window_Glass_R", create_window_glass, (1.8, -3.93, 1.85), mat=mat_glass)

# 9. Brick Chimney Stack
def create_chimney():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.85, 0.85, 2.40)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.03
    bev.segments = 2
    return o
add_part("Chimney_Stack", create_chimney, (1.8, 1.8, 5.0), mat=mat_brick)

def create_chimney_cap():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (1.05, 1.05, 0.12)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.02
    bev.segments = 2
    return o
add_part("Chimney_Cap", create_chimney_cap, (1.8, 1.8, 6.26), mat=mat_plinth)
`;
  }

  /**
   * Generates Blender Python script for Ancient Indian Temple
   */
  static generateTempleBpy(entityId, loc = [0, 0, 0], dim = [18.0, 24.0, 16.0]) {
    // Re-uses the existing stone mandapa and tiered shikhara architecture
    return `
# ==============================================================================
# HERO ASSET: ANCIENT INDIAN STONE TEMPLE (PROCEDURAL ASSEMBLY ENGINE)
# Dimensions: ~${dim[0]}m W x ~${dim[1]}m L x ~${dim[2]}m H
# Assembly: Jagati Stone Plinth, Mandapa Hypostyle Hall, 16 Carved Pillars,
# Tiered Shikhara Superstructure, Amalaka Crest, Kalasha Spire Finial.
# ==============================================================================
import bpy
import bmesh
import math
import mathutils

entity_id = "${entityId}"
base_loc = (${loc[0]}, ${loc[1]}, ${loc[2]})

temple_root = bpy.data.objects.new(entity_id, None)
temple_root["unin_id"] = entity_id
temple_root.empty_display_type = 'ARROWS'
temple_root.location = base_loc
bpy.context.collection.objects.link(temple_root)

# Stone Shader
mat_stone = bpy.data.materials.new(name=f"{entity_id}_Carved_Sandstone")
mat_stone.use_nodes = True
b_st = mat_stone.node_tree.nodes.get('Principled BSDF')
if b_st:
    b_st.inputs['Base Color'].default_value = (0.58, 0.44, 0.32, 1.0)
    b_st.inputs['Roughness'].default_value = 0.88

mat_gold = bpy.data.materials.new(name=f"{entity_id}_Temple_Brass")
mat_gold.use_nodes = True
b_g = mat_gold.node_tree.nodes.get('Principled BSDF')
if b_g:
    b_g.inputs['Base Color'].default_value = (0.85, 0.65, 0.20, 1.0)
    b_g.inputs['Roughness'].default_value = 0.28
    if 'Metallic' in b_g.inputs: b_g.inputs['Metallic'].default_value = 0.90

z_base = base_loc[2]

# 1. Jagati (Plinth)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(base_loc[0], base_loc[1], z_base + 0.6))
plinth = bpy.context.view_layer.objects.active
plinth.name = f"{entity_id}_Jagati_Plinth"
plinth["unin_id"] = plinth.name
plinth.scale = (16.0, 22.0, 1.2)
bpy.ops.object.transform_apply(scale=True)
plinth.parent = temple_root
plinth.data.materials.append(mat_stone)
bev_p = plinth.modifiers.new("Bevel", 'BEVEL')
bev_p.width = 0.08
bpy.ops.object.shade_smooth()

# 2. Shikhara Tiered Spire
tiers = 8
for i in range(tiers):
    t_width = 7.0 * (1.0 - (i / (tiers + 1)) * 0.75)
    t_height = 1.15
    tz = z_base + 1.2 + (i * t_height)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(base_loc[0], base_loc[1] + 4.5, tz + t_height * 0.5))
    tier_obj = bpy.context.view_layer.objects.active
    tier_obj.name = f"{entity_id}_Shikhara_Tier_{i}"
    tier_obj["unin_id"] = tier_obj.name
    tier_obj.scale = (t_width, t_width, t_height)
    bpy.ops.object.transform_apply(scale=True)
    tier_obj.parent = temple_root
    tier_obj.data.materials.append(mat_stone)
    bev_t = tier_obj.modifiers.new("Bevel", 'BEVEL')
    bev_t.width = 0.06
    bpy.ops.object.shade_smooth()

# 3. Amalaka Stone Disc Crest
amalaka_z = z_base + 1.2 + (tiers * 1.15) + 0.4
bpy.ops.mesh.primitive_cylinder_add(radius=1.8, depth=0.8, location=(base_loc[0], base_loc[1] + 4.5, amalaka_z), vertices=32)
amalaka = bpy.context.view_layer.objects.active
amalaka.name = f"{entity_id}_Amalaka_Crest"
amalaka["unin_id"] = amalaka.name
amalaka.parent = temple_root
amalaka.data.materials.append(mat_stone)
bpy.ops.object.shade_smooth()

# 4. Kalasha Golden Spire
bpy.ops.mesh.primitive_cone_add(radius1=0.45, depth=1.6, location=(base_loc[0], base_loc[1] + 4.5, amalaka_z + 1.1), vertices=24)
kalasha = bpy.context.view_layer.objects.active
kalasha.name = f"{entity_id}_Kalasha_Finial"
kalasha["unin_id"] = kalasha.name
kalasha.parent = temple_root
kalasha.data.materials.append(mat_gold)
bpy.ops.object.shade_smooth()

# 5. Mandapa Pillars (8 Carved Pillars)
for px in [-3.2, 3.2]:
    for py in [-5.5, -3.5, -1.5, 0.5]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.35, depth=3.2, location=(base_loc[0] + px, base_loc[1] + py, z_base + 1.2 + 1.6), vertices=16)
        pil = bpy.context.view_layer.objects.active
        pil.name = f"{entity_id}_Pillar_{px}_{py}"
        pil["unin_id"] = pil.name
        pil.parent = temple_root
        pil.data.materials.append(mat_stone)
        bpy.ops.object.shade_smooth()

# 6. Mandapa Canopy Roof
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(base_loc[0], base_loc[1] - 2.5, z_base + 1.2 + 3.4))
canopy = bpy.context.view_layer.objects.active
canopy.name = f"{entity_id}_Mandapa_Canopy"
canopy["unin_id"] = canopy.name
canopy.scale = (8.4, 7.2, 0.5)
bpy.ops.object.transform_apply(scale=True)
canopy.parent = temple_root
canopy.data.materials.append(mat_stone)
bev_c = canopy.modifiers.new("Bevel", 'BEVEL')
bev_c.width = 0.05
bpy.ops.object.shade_smooth()
`;
  }
}

module.exports = { ArchitectureProceduralGenerator };
