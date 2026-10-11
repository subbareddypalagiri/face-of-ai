// src/main/tools/astra/core/assets/procedural/ElectronicsProceduralGenerator.js
// Parametric High-Poly Electronics Procedural Assembly Engine
'use strict';

class ElectronicsProceduralGenerator {
  /**
   * Generates Blender Python script for a high-fidelity Smartphone
   */
  static generateSmartphoneBpy(entityId, loc = [0, 0, 0], dim = [0.08, 0.02, 0.16]) {
    return `
# ==============================================================================
# PROCEDURAL ELECTRONICS: ULTRA-THIN TITANIUM SMARTPHONE
# Dimensions: ~${dim[0]}m W x ~${dim[1]}m L x ~${dim[2]}m H
# Assembly: Chamfered Titanium Chassis, Edge-to-Edge OLED Display, Frosted Glass
# Back, Triple-Lens Camera Island, Metallic Bezel Rings, Side Power/Volume Buttons
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
mat_frame = bpy.data.materials.new(name=f"{entity_id}_Titanium_Frame")
mat_frame.use_nodes = True
b_fr = mat_frame.node_tree.nodes.get('Principled BSDF')
if b_fr:
    b_fr.inputs['Base Color'].default_value = (0.28, 0.28, 0.30, 1.0)
    b_fr.inputs['Roughness'].default_value = 0.25
    if 'Metallic' in b_fr.inputs: b_fr.inputs['Metallic'].default_value = 0.92

mat_screen = bpy.data.materials.new(name=f"{entity_id}_OLED_Display")
mat_screen.use_nodes = True
b_sc = mat_screen.node_tree.nodes.get('Principled BSDF')
if b_sc:
    b_sc.inputs['Base Color'].default_value = (0.02, 0.03, 0.05, 1.0)
    b_sc.inputs['Roughness'].default_value = 0.04
    if 'Emission Color' in b_sc.inputs:
        b_sc.inputs['Emission Color'].default_value = (0.05, 0.08, 0.15, 1.0)
        b_sc.inputs['Emission Strength'].default_value = 0.3

mat_lens = bpy.data.materials.new(name=f"{entity_id}_Camera_Optics")
mat_lens.use_nodes = True
b_le = mat_lens.node_tree.nodes.get('Principled BSDF')
if b_le:
    b_le.inputs['Base Color'].default_value = (0.01, 0.02, 0.04, 1.0)
    b_le.inputs['Roughness'].default_value = 0.02
    if 'Metallic' in b_le.inputs: b_le.inputs['Metallic'].default_value = 0.2

mat_back = bpy.data.materials.new(name=f"{entity_id}_Frosted_Glass")
mat_back.use_nodes = True
b_bk = mat_back.node_tree.nodes.get('Principled BSDF')
if b_bk:
    b_bk.inputs['Base Color'].default_value = (0.22, 0.23, 0.25, 1.0)
    b_bk.inputs['Roughness'].default_value = 0.18

def add_part(name, mesh_func, loc_rel, rot_rel=(0,0,0), mat=mat_frame):
    obj = mesh_func()
    obj.name = f"{entity_id}_{name}"
    obj["unin_id"] = f"{entity_id}_{name}"
    obj.location = (base_loc[0] + loc_rel[0], base_loc[1] + loc_rel[1], base_loc[2] + loc_rel[2])
    obj.rotation_euler = rot_rel
    obj.parent = focal_root
    if mat: obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return obj

# 1. Main Titanium Chassis Body
def create_body():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.076, 0.008, 0.160)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("CornerBevel", 'BEVEL')
    bev.width = 0.007
    bev.segments = 4
    return o
add_part("Chassis_Body", create_body, (0, 0, 0.08), mat=mat_frame)

# 2. Front OLED Display Screen
def create_screen():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.072, 0.0008, 0.154)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("ScreenBevel", 'BEVEL')
    bev.width = 0.005
    bev.segments = 3
    return o
add_part("Display_OLED", create_screen, (0, -0.0041, 0.08), mat=mat_screen)

# 3. Frosted Glass Rear Panel
def create_rear_glass():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.072, 0.0008, 0.154)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("BackBevel", 'BEVEL')
    bev.width = 0.005
    bev.segments = 3
    return o
add_part("Rear_Glass", create_rear_glass, (0, 0.0041, 0.08), mat=mat_back)

# 4. Camera Island Plateau (Rear Top Left)
def create_camera_island():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.030, 0.0025, 0.034)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("IslandBevel", 'BEVEL')
    bev.width = 0.003
    bev.segments = 3
    return o
add_part("Camera_Island", create_camera_island, (-0.018, 0.0052, 0.136), mat=mat_frame)

# 5. Three Camera Lenses & Bezels
def create_lens():
    bpy.ops.mesh.primitive_cylinder_add(radius=0.0055, depth=0.002, vertices=20)
    o = bpy.context.view_layer.objects.active
    bev = o.modifiers.new("LensBevel", 'BEVEL')
    bev.width = 0.0006
    bev.segments = 2
    return o

add_part("Lens_Top", create_lens, (-0.024, 0.0068, 0.144), rot_rel=(math.radians(90), 0, 0), mat=mat_lens)
add_part("Lens_Mid", create_lens, (-0.024, 0.0068, 0.130), rot_rel=(math.radians(90), 0, 0), mat=mat_lens)
add_part("Lens_Right", create_lens, (-0.012, 0.0068, 0.137), rot_rel=(math.radians(90), 0, 0), mat=mat_lens)

# 6. LED Flash Unit
def create_flash():
    bpy.ops.mesh.primitive_cylinder_add(radius=0.0022, depth=0.0015, vertices=16)
    o = bpy.context.view_layer.objects.active
    return o
add_part("LED_Flash", create_flash, (-0.012, 0.0066, 0.148), rot_rel=(math.radians(90), 0, 0), mat=mat_screen)

# 7. Side Physical Buttons (Power & Volume)
def create_button(h):
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.0012, 0.003, h)
    bpy.ops.object.transform_apply(scale=True)
    return o

add_part("Power_Button", lambda: create_button(0.018), (0.0385, 0, 0.11), mat=mat_frame)
add_part("Volume_Up", lambda: create_button(0.014), (-0.0385, 0, 0.115), mat=mat_frame)
add_part("Volume_Down", lambda: create_button(0.014), (-0.0385, 0, 0.095), mat=mat_frame)
`;
  }

  /**
   * Generates Blender Python script for a high-fidelity Desktop Computer Workstation
   */
  static generateComputerBpy(entityId, loc = [0, 0, 0], dim = [1.2, 0.8, 0.65]) {
    return `
# ==============================================================================
# PROCEDURAL ELECTRONICS: DESKTOP WORKSTATION (PC TOWER + MONITOR + KEYBOARD)
# Dimensions: ~${dim[0]}m W x ~${dim[1]}m L x ~${dim[2]}m H
# Assembly: Mid-Tower ATX Chassis, Front Mesh Grille, Tempered Glass Side Panel,
# Widescreen Gaming Monitor with Articulated Stand, Ergonomic Desktop Keyboard
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
mat_chassis = bpy.data.materials.new(name=f"{entity_id}_Powder_Steel")
mat_chassis.use_nodes = True
b_ch = mat_chassis.node_tree.nodes.get('Principled BSDF')
if b_ch:
    b_ch.inputs['Base Color'].default_value = (0.08, 0.09, 0.10, 1.0)
    b_ch.inputs['Roughness'].default_value = 0.35
    if 'Metallic' in b_ch.inputs: b_ch.inputs['Metallic'].default_value = 0.8

mat_screen = bpy.data.materials.new(name=f"{entity_id}_Monitor_Screen")
mat_screen.use_nodes = True
b_sc = mat_screen.node_tree.nodes.get('Principled BSDF')
if b_sc:
    b_sc.inputs['Base Color'].default_value = (0.03, 0.04, 0.06, 1.0)
    b_sc.inputs['Roughness'].default_value = 0.08
    if 'Emission Color' in b_sc.inputs:
        b_sc.inputs['Emission Color'].default_value = (0.04, 0.09, 0.18, 1.0)
        b_sc.inputs['Emission Strength'].default_value = 0.25

mat_alum = bpy.data.materials.new(name=f"{entity_id}_Brushed_Alum")
mat_alum.use_nodes = True
b_al = mat_alum.node_tree.nodes.get('Principled BSDF')
if b_al:
    b_al.inputs['Base Color'].default_value = (0.75, 0.76, 0.78, 1.0)
    b_al.inputs['Roughness'].default_value = 0.20
    if 'Metallic' in b_al.inputs: b_al.inputs['Metallic'].default_value = 0.95

mat_glass = bpy.data.materials.new(name=f"{entity_id}_Tempered_Glass")
mat_glass.use_nodes = True
b_gl = mat_glass.node_tree.nodes.get('Principled BSDF')
if b_gl:
    b_gl.inputs['Base Color'].default_value = (0.1, 0.12, 0.15, 1.0)
    b_gl.inputs['Roughness'].default_value = 0.05
    if 'Transmission Weight' in b_gl.inputs: b_gl.inputs['Transmission Weight'].default_value = 0.85

def add_part(name, mesh_func, loc_rel, rot_rel=(0,0,0), mat=mat_chassis):
    obj = mesh_func()
    obj.name = f"{entity_id}_{name}"
    obj["unin_id"] = f"{entity_id}_{name}"
    obj.location = (base_loc[0] + loc_rel[0], base_loc[1] + loc_rel[1], base_loc[2] + loc_rel[2])
    obj.rotation_euler = rot_rel
    obj.parent = focal_root
    if mat: obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return obj

# ----------------- 1. PC TOWER (Right Side) -----------------
# Main Tower Chassis
def create_tower():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.21, 0.44, 0.46)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("TowerBevel", 'BEVEL')
    bev.width = 0.008
    bev.segments = 3
    return o
add_part("Tower_Chassis", create_tower, (0.42, 0.05, 0.23), mat=mat_chassis)

# Tower Tempered Glass Side Window
def create_tower_glass():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.004, 0.38, 0.40)
    bpy.ops.object.transform_apply(scale=True)
    return o
add_part("Tower_Glass_Panel", create_tower_glass, (0.312, 0.05, 0.23), mat=mat_glass)

# Tower Front Ventilation Mesh Inset
def create_tower_front():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.19, 0.012, 0.42)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.005
    bev.segments = 2
    return o
add_part("Tower_Front_Mesh", create_tower_front, (0.42, -0.175, 0.23), mat=mat_chassis)

# ----------------- 2. WIDESCREEN MONITOR (Center) -----------------
# Monitor Display Bezel & Casing
def create_monitor_casing():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.64, 0.024, 0.38)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.006
    bev.segments = 3
    return o
add_part("Monitor_Casing", create_monitor_casing, (-0.12, 0.05, 0.36), mat=mat_chassis)

# Monitor Screen Face
def create_monitor_screen():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.62, 0.002, 0.36)
    bpy.ops.object.transform_apply(scale=True)
    return o
add_part("Monitor_Screen", create_monitor_screen, (-0.12, 0.037, 0.36), mat=mat_screen)

# Monitor Articulated Stand Neck
def create_stand_neck():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.045, 0.045, 0.26)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.004
    bev.segments = 2
    return o
add_part("Monitor_Stand_Neck", create_stand_neck, (-0.12, 0.09, 0.20), mat=mat_alum)

# Monitor Stand Base Plate
def create_stand_base():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.24, 0.20, 0.012)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.004
    bev.segments = 2
    return o
add_part("Monitor_Stand_Base", create_stand_base, (-0.12, 0.05, 0.006), mat=mat_alum)

# ----------------- 3. DESKTOP KEYBOARD (Front Center) -----------------
# Keyboard Wedge Body
def create_keyboard():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.44, 0.14, 0.016)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.003
    bev.segments = 2
    return o
add_part("Keyboard_Body", create_keyboard, (-0.12, -0.22, 0.008), rot_rel=(math.radians(3), 0, 0), mat=mat_chassis)

# Keyboard Keycap Matrix Plate
def create_keybed():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.41, 0.12, 0.006)
    bpy.ops.object.transform_apply(scale=True)
    return o
add_part("Keyboard_Keys", create_keybed, (-0.12, -0.22, 0.018), rot_rel=(math.radians(3), 0, 0), mat=mat_screen)
`;
  }
}

module.exports = { ElectronicsProceduralGenerator };
