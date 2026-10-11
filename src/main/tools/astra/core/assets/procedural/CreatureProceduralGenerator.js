// src/main/tools/astra/core/assets/procedural/CreatureProceduralGenerator.js
// Parametric High-Poly Creature Procedural Assembly Engine
'use strict';

class CreatureProceduralGenerator {
  /**
   * Generates Blender Python script for a high-fidelity Mythical Winged Dragon
   */
  static generateDragonBpy(entityId, loc = [0, 0, 0], dim = [4.0, 7.5, 3.2]) {
    return `
# ==============================================================================
# PROCEDURAL CREATURE: MYTHICAL WINGED DRAGON (BIOMORPHIC ASSEMBLY ENGINE V2)
# Dimensions: ~${dim[0]}m W x ~${dim[1]}m L x ~${dim[2]}m H
# Assembly: Sculpted Reptilian Head, Brow Ridges, Quad Swept Horns, Glowing Amber
# Eyes, Segmented Serpentine Neck, Muscular Torso, 4 Articulated Claws,
# Swept Bat-Wing Membrane Spars, Tapered Spined Serpentine Tail
# ==============================================================================
import bpy
import bmesh
import math
import mathutils

entity_id = "${entityId}"
base_loc = (${loc[0]}, ${loc[1]}, ${loc[2]})

dragon_root = bpy.data.objects.new(entity_id, None)
dragon_root["unin_id"] = entity_id
dragon_root.empty_display_type = 'ARROWS'
dragon_root.location = base_loc
bpy.context.collection.objects.link(dragon_root)

# Materials
mat_scales = bpy.data.materials.new(name=f"{entity_id}_Reptilian_Scales")
mat_scales.use_nodes = True
b_sc = mat_scales.node_tree.nodes.get('Principled BSDF')
if b_sc:
    b_sc.inputs['Base Color'].default_value = (0.05, 0.14, 0.08, 1.0)
    b_sc.inputs['Roughness'].default_value = 0.38
    if 'Metallic' in b_sc.inputs: b_sc.inputs['Metallic'].default_value = 0.15

mat_horn = bpy.data.materials.new(name=f"{entity_id}_Obsidian_Horn")
mat_horn.use_nodes = True
b_hn = mat_horn.node_tree.nodes.get('Principled BSDF')
if b_hn:
    b_hn.inputs['Base Color'].default_value = (0.02, 0.02, 0.02, 1.0)
    b_hn.inputs['Roughness'].default_value = 0.15
    if 'Metallic' in b_hn.inputs: b_hn.inputs['Metallic'].default_value = 0.3

mat_eye = bpy.data.materials.new(name=f"{entity_id}_Amber_Eye_Emission")
mat_eye.use_nodes = True
b_ey = mat_eye.node_tree.nodes.get('Principled BSDF')
if b_ey:
    b_ey.inputs['Base Color'].default_value = (1.0, 0.65, 0.05, 1.0)
    if 'Emission Color' in b_ey.inputs:
        b_ey.inputs['Emission Color'].default_value = (1.0, 0.65, 0.05, 1.0)
        b_ey.inputs['Emission Strength'].default_value = 18.0

mat_wing = bpy.data.materials.new(name=f"{entity_id}_Wing_Membrane")
mat_wing.use_nodes = True
b_wg = mat_wing.node_tree.nodes.get('Principled BSDF')
if b_wg:
    b_wg.inputs['Base Color'].default_value = (0.08, 0.06, 0.05, 1.0)
    b_wg.inputs['Roughness'].default_value = 0.45

def add_part(name, mesh_func, loc_rel, rot_rel=(0,0,0), mat=mat_scales):
    obj = mesh_func()
    obj.name = f"{entity_id}_{name}"
    obj["unin_id"] = f"{entity_id}_{name}"
    obj.location = (base_loc[0] + loc_rel[0], base_loc[1] + loc_rel[1], base_loc[2] + loc_rel[2])
    obj.rotation_euler = rot_rel
    obj.parent = dragon_root
    if mat: obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return obj

# ----------------- 1. HEAD & SKULL ASSEMBLY -----------------
# Cranium & Brow Ridge
def create_cranium():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.36, 0.45, 0.28)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.06
    bev.segments = 3
    return o
add_part("Skull_Cranium", create_cranium, (0, 1.95, 2.15), mat=mat_scales)

# Tapered Snout & Upper Jaw
def create_snout():
    bpy.ops.mesh.primitive_cone_add(radius1=0.22, radius2=0.10, depth=0.55, vertices=16)
    o = bpy.context.view_layer.objects.active
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.02
    bev.segments = 2
    return o
add_part("Snout_UpperJaw", create_snout, (0, 2.38, 2.05), rot_rel=(math.radians(82), 0, 0), mat=mat_scales)

# Lower Jaw
def create_lower_jaw():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.24, 0.48, 0.10)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.02
    bev.segments = 2
    return o
add_part("Lower_Jaw", create_lower_jaw, (0, 2.28, 1.92), rot_rel=(math.radians(6), 0, 0), mat=mat_scales)

# Glowing Amber Slit Eyes (Left & Right)
def create_eye():
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.045, segments=16, ring_count=12)
    return bpy.context.view_layer.objects.active
add_part("Eye_L", create_eye, (-0.16, 2.05, 2.22), mat=mat_eye)
add_part("Eye_R", create_eye, (0.16, 2.05, 2.22), mat=mat_eye)

# Swept Horns (Primary Dorsal Horns)
def create_main_horn(curve_dir):
    bpy.ops.mesh.primitive_cone_add(radius1=0.075, depth=0.75, vertices=16)
    o = bpy.context.view_layer.objects.active
    return o
add_part("Horn_Main_L", lambda: create_main_horn(-1), (-0.15, 1.72, 2.45), rot_rel=(math.radians(-35), math.radians(-15), 0), mat=mat_horn)
add_part("Horn_Main_R", lambda: create_main_horn(1), (0.15, 1.72, 2.45), rot_rel=(math.radians(-35), math.radians(15), 0), mat=mat_horn)

# Cheek Horn Spikes
add_part("Horn_Cheek_L", lambda: create_main_horn(-1), (-0.22, 1.88, 2.08), rot_rel=(math.radians(-10), math.radians(-45), 0), mat=mat_horn)
add_part("Horn_Cheek_R", lambda: create_main_horn(1), (0.22, 1.88, 2.08), rot_rel=(math.radians(-10), math.radians(45), 0), mat=mat_horn)

# ----------------- 2. SERPENTINE NECK & MUSCULAR TORSO -----------------
# S-Curved Neck Segments (3 articulated vertebrae)
for i in range(3):
    t = (i + 1) / 3.0
    ny = 1.6 - (t * 0.7)
    nz = 1.95 - (t * 0.45)
    def create_neck_seg(r):
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=0.45, vertices=16)
        o = bpy.context.view_layer.objects.active
        bev = o.modifiers.new("Bevel", 'BEVEL')
        bev.width = 0.02
        bev.segments = 2
        return o
    add_part(f"Neck_Segment_{i+1}", lambda: create_neck_seg(0.24 - i*0.02), (0, ny, nz), rot_rel=(math.radians(25), 0, 0), mat=mat_scales)

# Muscular Chest & Torso Core
def create_torso():
    bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=1.65, vertices=20)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.75, 1.0, 0.70)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.08
    bev.segments = 3
    return o
add_part("Torso_Core", create_torso, (0, 0.10, 1.35), rot_rel=(math.radians(90), 0, 0), mat=mat_scales)

# Dorsal Spine Plates along back
for sp in range(5):
    sy = 0.75 - sp * 0.32
    def create_dorsal_spine():
        bpy.ops.mesh.primitive_cone_add(radius1=0.045, depth=0.22, vertices=8)
        return bpy.context.view_layer.objects.active
    add_part(f"Dorsal_Spine_{sp+1}", create_dorsal_spine, (0, sy, 1.78), rot_rel=(math.radians(-15), 0, 0), mat=mat_horn)

# ----------------- 3. ARTICULATED FORE & HIND LIMBS -----------------
# Forelimbs (Left & Right)
for sx in [-1, 1]:
    pfx = 'L' if sx < 0 else 'R'
    # Shoulder / Upper Arm
    def create_arm():
        bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.55, vertices=16)
        return bpy.context.view_layer.objects.active
    add_part(f"Foreleg_Upper_{pfx}", create_arm, (sx * 0.48, 0.65, 1.15), rot_rel=(math.radians(-15), math.radians(sx * 15), 0), mat=mat_scales)
    
    # Forearm & Claws
    def create_forearm():
        bpy.ops.mesh.primitive_cylinder_add(radius=0.09, depth=0.60, vertices=16)
        return bpy.context.view_layer.objects.active
    add_part(f"Foreleg_Lower_{pfx}", create_forearm, (sx * 0.52, 0.72, 0.58), rot_rel=(math.radians(10), 0, 0), mat=mat_scales)
    
    # Claw Foot
    def create_claw_foot():
        bpy.ops.mesh.primitive_cube_add(size=1.0)
        o = bpy.context.view_layer.objects.active
        o.scale = (0.22, 0.30, 0.08)
        bpy.ops.object.transform_apply(scale=True)
        return o
    add_part(f"Claw_Foot_Front_{pfx}", create_claw_foot, (sx * 0.52, 0.80, 0.04), mat=mat_horn)

# Hind Limbs (Left & Right with powerful thighs)
for sx in [-1, 1]:
    pfx = 'L' if sx < 0 else 'R'
    def create_thigh():
        bpy.ops.mesh.primitive_cylinder_add(radius=0.20, depth=0.70, vertices=16)
        return bpy.context.view_layer.objects.active
    add_part(f"Hindleg_Thigh_{pfx}", create_thigh, (sx * 0.52, -0.48, 1.10), rot_rel=(math.radians(25), math.radians(sx * 15), 0), mat=mat_scales)
    
    def create_shin():
        bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.72, vertices=16)
        return bpy.context.view_layer.objects.active
    add_part(f"Hindleg_Shin_{pfx}", create_shin, (sx * 0.55, -0.58, 0.52), rot_rel=(math.radians(-20), 0, 0), mat=mat_scales)
    
    add_part(f"Claw_Foot_Rear_{pfx}", create_claw_foot, (sx * 0.55, -0.52, 0.04), mat=mat_horn)

# ----------------- 4. SWEPT BAT WINGS WITH BONE SPARS -----------------
for sx in [-1, 1]:
    pfx = 'L' if sx < 0 else 'R'
    # Main Wing Arm Spar
    def create_wing_arm():
        bpy.ops.mesh.primitive_cylinder_add(radius=0.075, depth=1.65, vertices=16)
        return bpy.context.view_layer.objects.active
    add_part(f"Wing_Arm_{pfx}", create_wing_arm, (sx * 0.85, 0.20, 1.95), rot_rel=(math.radians(15), math.radians(sx * 48), 0), mat=mat_scales)
    
    # Outer Radiating Finger Spars (3 spars)
    for f_idx, fang in enumerate([-25, 0, 25]):
        def create_finger():
            bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=1.55, vertices=12)
            return bpy.context.view_layer.objects.active
        add_part(f"Wing_Spar_{pfx}_{f_idx+1}", create_finger, (sx * 1.85, 0.10 + f_idx*0.2, 2.30), rot_rel=(math.radians(fang), math.radians(sx * 70), 0), mat=mat_horn)
        
    # Wing Membrane Webbing
    def create_membrane():
        bpy.ops.mesh.primitive_cube_add(size=1.0)
        o = bpy.context.view_layer.objects.active
        o.scale = (1.80, 1.25, 0.015)
        bpy.ops.object.transform_apply(scale=True)
        return o
    add_part(f"Wing_Membrane_{pfx}", create_membrane, (sx * 1.55, 0.20, 2.10), rot_rel=(math.radians(10), math.radians(sx * 22), 0), mat=mat_wing)

# ----------------- 5. SERPENTINE SPINED TAIL -----------------
# 4 Tapered Tail Segments
for ti in range(4):
    ty = -0.95 - ti * 0.65
    tz = 1.15 - ti * 0.22
    t_rad = 0.28 * (1.0 - ti * 0.22)
    def create_tail_seg(r):
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=0.72, vertices=16)
        return bpy.context.view_layer.objects.active
    add_part(f"Tail_Segment_{ti+1}", lambda: create_tail_seg(t_rad), (0, ty, tz), rot_rel=(math.radians(95), 0, 0), mat=mat_scales)
`;
  }
}

module.exports = { CreatureProceduralGenerator };
