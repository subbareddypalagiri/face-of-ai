import bpy
import bmesh
import math
import mathutils
import os

out_dir = os.path.abspath("assets/models")
os.makedirs(out_dir, exist_ok=True)

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def export_current_to_glb(filepath):
    # Select all objects
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        use_selection=True,
        export_apply=True
    )
    print(f"[EXPORT] Successfully saved: {filepath} ({os.path.getsize(filepath):,} bytes)")

# ==============================================================================
# 1. HIGH-FIDELITY CHAIR (assets/models/chair.glb)
# ==============================================================================
def build_chair():
    reset_scene()
    root = bpy.data.objects.new("Chair_Root", None)
    bpy.context.collection.objects.link(root)
    
    # Materials
    mat_wood = bpy.data.materials.new("Chair_Oak_Wood")
    mat_wood.use_nodes = True
    b_w = mat_wood.node_tree.nodes.get("Principled BSDF")
    if b_w:
        b_w.inputs['Base Color'].default_value = (0.38, 0.23, 0.13, 1.0)
        b_w.inputs['Roughness'].default_value = 0.32
        
    mat_leather = bpy.data.materials.new("Chair_Black_Leather")
    mat_leather.use_nodes = True
    b_l = mat_leather.node_tree.nodes.get("Principled BSDF")
    if b_l:
        b_l.inputs['Base Color'].default_value = (0.025, 0.025, 0.03, 1.0)
        b_l.inputs['Roughness'].default_value = 0.45
        
    mat_metal = bpy.data.materials.new("Chair_Steel_Brace")
    mat_metal.use_nodes = True
    b_m = mat_metal.node_tree.nodes.get("Principled BSDF")
    if b_m:
        b_m.inputs['Base Color'].default_value = (0.12, 0.12, 0.14, 1.0)
        b_m.inputs['Roughness'].default_value = 0.22
        b_m.inputs['Metallic'].default_value = 0.95
        
    # 1. Sculpted Seat Cushion
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.46))
    cushion = bpy.context.active_object
    cushion.name = "Seat_Cushion"
    cushion.scale = (0.48, 0.46, 0.08)
    bpy.ops.object.transform_apply(scale=True)
    # Bevel
    bev = cushion.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.035
    bev.segments = 4
    # Subsurf for organic cushion look
    sub = cushion.modifiers.new("Subsurf", 'SUBSURF')
    sub.levels = 1
    sub.render_levels = 2
    cushion.data.materials.append(mat_leather)
    cushion.parent = root
    
    # 2. Solid Wood Seat Pan
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.41))
    pan = bpy.context.active_object
    pan.name = "Seat_Pan"
    pan.scale = (0.50, 0.48, 0.03)
    bpy.ops.object.transform_apply(scale=True)
    bev2 = pan.modifiers.new("Bevel", 'BEVEL')
    bev2.width = 0.015
    bev2.segments = 3
    pan.data.materials.append(mat_wood)
    pan.parent = root
    
    # 3. Curved Bentwood Backrest
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.22, 0.80))
    back = bpy.context.active_object
    back.name = "Backrest_Panel"
    back.scale = (0.46, 0.04, 0.32)
    back.rotation_euler.x = math.radians(-8)
    bpy.ops.object.transform_apply(scale=True, rotation=False)
    bev3 = back.modifiers.new("Bevel", 'BEVEL')
    bev3.width = 0.02
    bev3.segments = 3
    back.data.materials.append(mat_wood)
    back.parent = root
    
    # 4. Backrest Support Posts
    for x in [-0.18, 0.18]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.016, depth=0.45, vertices=24, location=(x, 0.20, 0.65))
        post = bpy.context.active_object
        post.rotation_euler.x = math.radians(-8)
        post.data.materials.append(mat_wood)
        post.parent = root
        
    # 5. Splayed Tapered Wooden Legs
    leg_coords = [
        (-0.19, -0.18, 0.20, math.radians(4), math.radians(-4)),
        (0.19, -0.18, 0.20, math.radians(4), math.radians(4)),
        (-0.19, 0.18, 0.20, math.radians(-5), math.radians(-4)),
        (0.19, 0.18, 0.20, math.radians(-5), math.radians(4))
    ]
    for lx, ly, lz, rx, ry in leg_coords:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.018, depth=0.42, vertices=24, location=(lx, ly, lz))
        leg = bpy.context.active_object
        leg.rotation_euler = (rx, ry, 0)
        leg.data.materials.append(mat_wood)
        leg.parent = root
        
    # 6. Steel Cross Stretcher
    bpy.ops.mesh.primitive_cylinder_add(radius=0.006, depth=0.40, vertices=16, location=(0, 0, 0.16))
    str1 = bpy.context.active_object
    str1.rotation_euler.y = math.radians(90)
    str1.data.materials.append(mat_metal)
    str1.parent = root
    
    bpy.ops.mesh.primitive_cylinder_add(radius=0.006, depth=0.38, vertices=16, location=(0, 0, 0.16))
    str2 = bpy.context.active_object
    str2.rotation_euler.x = math.radians(90)
    str2.data.materials.append(mat_metal)
    str2.parent = root
    
    export_current_to_glb(os.path.join(out_dir, "chair.glb"))

# ==============================================================================
# 2. HIGH-FIDELITY SMARTPHONE (assets/models/smartphone.glb)
# ==============================================================================
def build_smartphone():
    reset_scene()
    root = bpy.data.objects.new("Phone_Root", None)
    bpy.context.collection.objects.link(root)
    
    mat_ti = bpy.data.materials.new("Phone_Titanium_Frame")
    mat_ti.use_nodes = True
    b_ti = mat_ti.node_tree.nodes.get("Principled BSDF")
    if b_ti:
        b_ti.inputs['Base Color'].default_value = (0.35, 0.35, 0.37, 1.0)
        b_ti.inputs['Metallic'].default_value = 0.95
        b_ti.inputs['Roughness'].default_value = 0.22
        
    mat_glass = bpy.data.materials.new("Phone_Frosted_Back")
    mat_glass.use_nodes = True
    b_g = mat_glass.node_tree.nodes.get("Principled BSDF")
    if b_g:
        b_g.inputs['Base Color'].default_value = (0.18, 0.19, 0.22, 1.0)
        b_g.inputs['Roughness'].default_value = 0.12
        
    mat_screen = bpy.data.materials.new("Phone_OLED_Display")
    mat_screen.use_nodes = True
    b_s = mat_screen.node_tree.nodes.get("Principled BSDF")
    if b_s:
        b_s.inputs['Base Color'].default_value = (0.01, 0.02, 0.04, 1.0)
        b_s.inputs['Roughness'].default_value = 0.02
        if 'Emission Color' in b_s.inputs:
            b_s.inputs['Emission Color'].default_value = (0.15, 0.35, 0.65, 1.0)
            b_s.inputs['Emission Strength'].default_value = 1.2
            
    mat_lens = bpy.data.materials.new("Phone_Sapphire_Lens")
    mat_lens.use_nodes = True
    b_l = mat_lens.node_tree.nodes.get("Principled BSDF")
    if b_l:
        b_l.inputs['Base Color'].default_value = (0.01, 0.02, 0.05, 1.0)
        b_l.inputs['Roughness'].default_value = 0.01
        b_l.inputs['Metallic'].default_value = 0.4
        
    # Main Body
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.08))
    body = bpy.context.active_object
    body.name = "Phone_Chassis"
    body.scale = (0.076, 0.008, 0.158)
    bpy.ops.object.transform_apply(scale=True)
    bev = body.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.008
    bev.segments = 5
    body.data.materials.append(mat_ti)
    body.parent = root
    
    # Front Screen
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.0041, 0.08))
    screen = bpy.context.active_object
    screen.name = "Display_OLED"
    screen.scale = (0.071, 0.0006, 0.152)
    bpy.ops.object.transform_apply(scale=True)
    bev2 = screen.modifiers.new("Bevel", 'BEVEL')
    bev2.width = 0.006
    bev2.segments = 4
    screen.data.materials.append(mat_screen)
    screen.parent = root
    
    # Rear Glass Panel
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.0041, 0.08))
    back = bpy.context.active_object
    back.name = "Rear_Glass"
    back.scale = (0.072, 0.0006, 0.154)
    bpy.ops.object.transform_apply(scale=True)
    bev3 = back.modifiers.new("Bevel", 'BEVEL')
    bev3.width = 0.006
    bev3.segments = 4
    back.data.materials.append(mat_glass)
    back.parent = root
    
    # Camera Island Plateau
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.019, 0.0055, 0.132))
    island = bpy.context.active_object
    island.name = "Camera_Island"
    island.scale = (0.030, 0.0022, 0.034)
    bpy.ops.object.transform_apply(scale=True)
    bev4 = island.modifiers.new("Bevel", 'BEVEL')
    bev4.width = 0.004
    bev4.segments = 3
    island.data.materials.append(mat_glass)
    island.parent = root
    
    # Triple Camera Lenses
    lens_offsets = [
        (-0.024, 0.007, 0.140),
        (-0.024, 0.007, 0.124),
        (-0.012, 0.007, 0.132)
    ]
    for i, (lx, ly, lz) in enumerate(lens_offsets):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.0055, depth=0.0025, vertices=32, location=(lx, ly, lz))
        lens = bpy.context.active_object
        lens.name = f"Lens_Ring_{i+1}"
        lens.rotation_euler.x = math.radians(90)
        lens.data.materials.append(mat_ti)
        lens.parent = root
        
        # Inner optic
        bpy.ops.mesh.primitive_cylinder_add(radius=0.0042, depth=0.0026, vertices=32, location=(lx, ly + 0.0002, lz))
        optic = bpy.context.active_object
        optic.rotation_euler.x = math.radians(90)
        optic.data.materials.append(mat_lens)
        optic.parent = root
        
    export_current_to_glb(os.path.join(out_dir, "smartphone.glb"))

# ==============================================================================
# 3. HIGH-FIDELITY COMMERCIAL AIRPLANE (assets/models/airplane.glb)
# ==============================================================================
def build_airplane():
    reset_scene()
    root = bpy.data.objects.new("Airplane_Root", None)
    bpy.context.collection.objects.link(root)
    
    mat_livery = bpy.data.materials.new("Airframe_Livery_White")
    mat_livery.use_nodes = True
    b_l = mat_livery.node_tree.nodes.get("Principled BSDF")
    if b_l:
        b_l.inputs['Base Color'].default_value = (0.92, 0.93, 0.96, 1.0)
        b_l.inputs['Roughness'].default_value = 0.15
        if 'Clearcoat' in b_l.inputs: b_l.inputs['Clearcoat'].default_value = 0.8
        
    mat_glass = bpy.data.materials.new("Cockpit_Glass_Dark")
    mat_glass.use_nodes = True
    b_g = mat_glass.node_tree.nodes.get("Principled BSDF")
    if b_g:
        b_g.inputs['Base Color'].default_value = (0.02, 0.04, 0.08, 1.0)
        b_g.inputs['Roughness'].default_value = 0.05
        
    mat_metal = bpy.data.materials.new("Turbine_Titanium")
    mat_metal.use_nodes = True
    b_m = mat_metal.node_tree.nodes.get("Principled BSDF")
    if b_m:
        b_m.inputs['Base Color'].default_value = (0.35, 0.36, 0.38, 1.0)
        b_m.inputs['Metallic'].default_value = 0.92
        b_m.inputs['Roughness'].default_value = 0.28
        
    # Fuselage: Scaled to 32m length
    bpy.ops.mesh.primitive_cylinder_add(radius=1.85, depth=26.0, vertices=32, location=(0, 0, 2.5))
    fuselage = bpy.context.active_object
    fuselage.name = "Fuselage"
    fuselage.rotation_euler.x = math.radians(90)
    bpy.ops.object.shade_smooth()
    fuselage.data.materials.append(mat_livery)
    fuselage.parent = root
    
    # Nose Cone
    bpy.ops.mesh.primitive_cone_add(radius1=1.85, radius2=0.25, depth=5.0, vertices=32, location=(0, -15.5, 2.5))
    nose = bpy.context.active_object
    nose.rotation_euler.x = math.radians(-90)
    bpy.ops.object.shade_smooth()
    nose.data.materials.append(mat_livery)
    nose.parent = root
    
    # Cockpit Windshield Band
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -14.2, 3.25))
    windshield = bpy.context.active_object
    windshield.scale = (2.2, 1.4, 0.8)
    bpy.ops.object.transform_apply(scale=True)
    windshield.rotation_euler.x = math.radians(28)
    windshield.data.materials.append(mat_glass)
    windshield.parent = root
    
    # Tail Cone
    bpy.ops.mesh.primitive_cone_add(radius1=1.85, radius2=0.35, depth=7.0, vertices=32, location=(0, 16.5, 2.7))
    tail = bpy.context.active_object
    tail.rotation_euler.x = math.radians(90)
    bpy.ops.object.shade_smooth()
    tail.data.materials.append(mat_livery)
    tail.parent = root
    
    # Swept Main Wings (Left and Right)
    for side, sign in [("L", -1), ("R", 1)]:
        bm = bmesh.new()
        v1 = bm.verts.new((0, 0, 0))
        v2 = bm.verts.new((sign * 14.0, 5.5, 0.8))
        v3 = bm.verts.new((sign * 13.5, 8.0, 0.8))
        v4 = bm.verts.new((0, 7.5, 0))
        f = bm.faces.new([v1, v2, v3, v4])
        bmesh.ops.solidify(bm, geom=[f], thickness=0.32)
        
        me = bpy.data.meshes.new(f"Main_Wing_{side}")
        bm.to_mesh(me)
        bm.free()
        
        wing = bpy.data.objects.new(f"Main_Wing_{side}", me)
        wing.location = (sign * 1.6, -2.0, 2.2)
        bpy.context.collection.objects.link(wing)
        wing.data.materials.append(mat_livery)
        wing.parent = root
        
        # Winglet
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sign * 15.2, 4.2, 3.4))
        wlet = bpy.context.active_object
        wlet.scale = (0.12, 1.6, 1.4)
        wlet.rotation_euler.y = math.radians(sign * 15)
        bpy.ops.object.transform_apply(scale=True)
        wlet.data.materials.append(mat_livery)
        wlet.parent = root
        
        # Turbofan Engine
        bpy.ops.mesh.primitive_cylinder_add(radius=1.1, depth=4.2, vertices=32, location=(sign * 5.2, 0.5, 1.1))
        engine = bpy.context.active_object
        engine.name = f"Engine_{side}"
        engine.rotation_euler.x = math.radians(90)
        bpy.ops.object.shade_smooth()
        engine.data.materials.append(mat_livery)
        engine.parent = root
        
        # Engine Titanium Core
        bpy.ops.mesh.primitive_cylinder_add(radius=0.75, depth=4.4, vertices=24, location=(sign * 5.2, 0.5, 1.1))
        core = bpy.context.active_object
        core.rotation_euler.x = math.radians(90)
        core.data.materials.append(mat_metal)
        core.parent = root
        
    # Vertical Stabilizer Fin
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 16.5, 5.8))
    vfin = bpy.context.active_object
    vfin.name = "Vertical_Stabilizer"
    vfin.scale = (0.24, 4.2, 4.6)
    vfin.rotation_euler.x = math.radians(-32)
    bpy.ops.object.transform_apply(scale=True, rotation=False)
    vfin.data.materials.append(mat_livery)
    vfin.parent = root
    
    # Horizontal Stabilizers
    for side, sign in [("L", -1), ("R", 1)]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sign * 3.5, 17.5, 3.6))
        hfin = bpy.context.active_object
        hfin.scale = (4.5, 2.2, 0.18)
        hfin.rotation_euler.x = math.radians(-12)
        bpy.ops.object.transform_apply(scale=True)
        hfin.data.materials.append(mat_livery)
        hfin.parent = root
        
    export_current_to_glb(os.path.join(out_dir, "airplane.glb"))

# ==============================================================================
# 4. HIGH-FIDELITY OFFICE DESK (assets/models/desk.glb)
# ==============================================================================
def build_desk():
    reset_scene()
    root = bpy.data.objects.new("Desk_Root", None)
    bpy.context.collection.objects.link(root)
    
    mat_oak = bpy.data.materials.new("Desk_Oak_Top")
    mat_oak.use_nodes = True
    b_o = mat_oak.node_tree.nodes.get("Principled BSDF")
    if b_o:
        b_o.inputs['Base Color'].default_value = (0.42, 0.28, 0.16, 1.0)
        b_o.inputs['Roughness'].default_value = 0.30
        
    mat_steel = bpy.data.materials.new("Desk_Black_Steel")
    mat_steel.use_nodes = True
    b_s = mat_steel.node_tree.nodes.get("Principled BSDF")
    if b_s:
        b_s.inputs['Base Color'].default_value = (0.05, 0.05, 0.06, 1.0)
        b_s.inputs['Roughness'].default_value = 0.25
        b_s.inputs['Metallic'].default_value = 0.85
        
    mat_brass = bpy.data.materials.new("Desk_Brass_Handle")
    mat_brass.use_nodes = True
    b_b = mat_brass.node_tree.nodes.get("Principled BSDF")
    if b_b:
        b_b.inputs['Base Color'].default_value = (0.92, 0.72, 0.25, 1.0)
        b_b.inputs['Metallic'].default_value = 0.95
        b_b.inputs['Roughness'].default_value = 0.18
        
    # 1. Solid Desktop Slab
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.74))
    top = bpy.context.active_object
    top.name = "Desktop_Slab"
    top.scale = (1.60, 0.80, 0.04)
    bpy.ops.object.transform_apply(scale=True)
    bev = top.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.015
    bev.segments = 3
    top.data.materials.append(mat_oak)
    top.parent = root
    
    # 2. Modern Steel Trestle Legs (Left and Right U-Frames)
    for x in [-0.68, 0.68]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, 0, 0.35))
        leg = bpy.context.active_object
        leg.scale = (0.05, 0.72, 0.70)
        bpy.ops.object.transform_apply(scale=True)
        bev2 = leg.modifiers.new("Bevel", 'BEVEL')
        bev2.width = 0.008
        bev2.segments = 2
        leg.data.materials.append(mat_steel)
        leg.parent = root
        
    # 3. Floating Side Drawer Pedestal
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.42, 0, 0.44))
    ped = bpy.context.active_object
    ped.name = "Drawer_Pedestal"
    ped.scale = (0.42, 0.64, 0.52)
    bpy.ops.object.transform_apply(scale=True)
    bev3 = ped.modifiers.new("Bevel", 'BEVEL')
    bev3.width = 0.01
    bev3.segments = 2
    ped.data.materials.append(mat_oak)
    ped.parent = root
    
    # 3 Brass Drawer Pulls
    for z in [0.58, 0.44, 0.30]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.006, depth=0.18, vertices=16, location=(0.42, -0.33, z))
        pull = bpy.context.active_object
        pull.rotation_euler.y = math.radians(90)
        pull.data.materials.append(mat_brass)
        pull.parent = root
        
    export_current_to_glb(os.path.join(out_dir, "desk.glb"))

# ==============================================================================
# 5. HIGH-FIDELITY HOUSE (assets/models/house.glb)
# ==============================================================================
def build_house():
    reset_scene()
    root = bpy.data.objects.new("House_Root", None)
    bpy.context.collection.objects.link(root)
    
    mat_siding = bpy.data.materials.new("House_Timber_Siding")
    mat_siding.use_nodes = True
    b_s = mat_siding.node_tree.nodes.get("Principled BSDF")
    if b_s:
        b_s.inputs['Base Color'].default_value = (0.84, 0.83, 0.80, 1.0)
        b_s.inputs['Roughness'].default_value = 0.50
        
    mat_shingle = bpy.data.materials.new("House_Roof_Shingle")
    mat_shingle.use_nodes = True
    b_sh = mat_shingle.node_tree.nodes.get("Principled BSDF")
    if b_sh:
        b_sh.inputs['Base Color'].default_value = (0.18, 0.19, 0.22, 1.0)
        b_sh.inputs['Roughness'].default_value = 0.55
        
    mat_trim = bpy.data.materials.new("House_White_Trim")
    mat_trim.use_nodes = True
    b_t = mat_trim.node_tree.nodes.get("Principled BSDF")
    if b_t:
        b_t.inputs['Base Color'].default_value = (0.94, 0.94, 0.92, 1.0)
        b_t.inputs['Roughness'].default_value = 0.30
        
    mat_brick = bpy.data.materials.new("House_Red_Brick")
    mat_brick.use_nodes = True
    b_b = mat_brick.node_tree.nodes.get("Principled BSDF")
    if b_b:
        b_b.inputs['Base Color'].default_value = (0.48, 0.20, 0.14, 1.0)
        b_b.inputs['Roughness'].default_value = 0.78
        
    mat_glass = bpy.data.materials.new("House_Glass")
    mat_glass.use_nodes = True
    b_g = mat_glass.node_tree.nodes.get("Principled BSDF")
    if b_g:
        b_g.inputs['Base Color'].default_value = (0.1, 0.15, 0.25, 1.0)
        b_g.inputs['Roughness'].default_value = 0.05
        if 'Transmission Weight' in b_g.inputs: b_g.inputs['Transmission Weight'].default_value = 0.85
        
    # Foundation Plinth
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.20))
    plinth = bpy.context.active_object
    plinth.scale = (6.4, 8.4, 0.40)
    bpy.ops.object.transform_apply(scale=True)
    plinth.data.materials.append(mat_trim)
    plinth.parent = root
    
    # Main Walls
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.80))
    walls = bpy.context.active_object
    walls.scale = (5.8, 7.8, 2.80)
    bpy.ops.object.transform_apply(scale=True)
    bev = walls.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.04
    bev.segments = 2
    walls.data.materials.append(mat_siding)
    walls.parent = root
    
    # Correct Pitched Gabled Roof Slopes (Left and Right - Peak at Center!)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.55, 0, 4.05))
    roof_l = bpy.context.active_object
    roof_l.name = "Roof_L"
    roof_l.scale = (3.6, 8.6, 0.18)
    roof_l.rotation_euler.y = math.radians(-32)  # Upward towards center!
    bpy.ops.object.transform_apply(scale=True, rotation=False)
    roof_l.data.materials.append(mat_shingle)
    roof_l.parent = root
    
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.55, 0, 4.05))
    roof_r = bpy.context.active_object
    roof_r.name = "Roof_R"
    roof_r.scale = (3.6, 8.6, 0.18)
    roof_r.rotation_euler.y = math.radians(32)   # Upward towards center!
    bpy.ops.object.transform_apply(scale=True, rotation=False)
    roof_r.data.materials.append(mat_shingle)
    roof_r.parent = root
    
    # Roof Ridge Cap at Peak
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 5.02))
    ridge = bpy.context.active_object
    ridge.scale = (0.28, 8.8, 0.14)
    bpy.ops.object.transform_apply(scale=True)
    ridge.data.materials.append(mat_trim)
    ridge.parent = root
    
    # Brick Chimney
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.6, 1.8, 4.4))
    chim = bpy.context.active_object
    chim.scale = (0.75, 0.75, 2.8)
    bpy.ops.object.transform_apply(scale=True)
    chim.data.materials.append(mat_brick)
    chim.parent = root
    
    # Front Porch Step & Door
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -3.95, 1.45))
    door = bpy.context.active_object
    door.scale = (1.10, 0.12, 2.10)
    bpy.ops.object.transform_apply(scale=True)
    door.data.materials.append(mat_trim)
    door.parent = root
    
    # Multi-pane Windows with Glass & Mullions
    for wx in [-1.6, 1.6]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(wx, -3.94, 1.65))
        win = bpy.context.active_object
        win.scale = (1.10, 0.10, 1.30)
        bpy.ops.object.transform_apply(scale=True)
        win.data.materials.append(mat_glass)
        win.parent = root
        
    export_current_to_glb(os.path.join(out_dir, "house.glb"))

# ==============================================================================
# 6. HIGH-FIDELITY SPACESHIP (assets/models/spaceship.glb)
# ==============================================================================
def build_spaceship():
    reset_scene()
    root = bpy.data.objects.new("Spaceship_Root", None)
    bpy.context.collection.objects.link(root)
    
    mat_hull = bpy.data.materials.new("Hull_Dark_Composite")
    mat_hull.use_nodes = True
    b_h = mat_hull.node_tree.nodes.get("Principled BSDF")
    if b_h:
        b_h.inputs['Base Color'].default_value = (0.10, 0.11, 0.13, 1.0)
        b_h.inputs['Metallic'].default_value = 0.85
        b_h.inputs['Roughness'].default_value = 0.28
        
    mat_cockpit = bpy.data.materials.new("Cockpit_Canopy_Gold")
    mat_cockpit.use_nodes = True
    b_c = mat_cockpit.node_tree.nodes.get("Principled BSDF")
    if b_c:
        b_c.inputs['Base Color'].default_value = (0.92, 0.72, 0.18, 1.0)
        b_c.inputs['Metallic'].default_value = 0.98
        b_c.inputs['Roughness'].default_value = 0.08
        
    mat_thrust = bpy.data.materials.new("Thruster_Ion_Blue")
    mat_thrust.use_nodes = True
    b_t = mat_thrust.node_tree.nodes.get("Principled BSDF")
    if b_t:
        b_t.inputs['Base Color'].default_value = (0.0, 0.75, 1.0, 1.0)
        if 'Emission Color' in b_t.inputs:
            b_t.inputs['Emission Color'].default_value = (0.0, 0.85, 1.0, 1.0)
            b_t.inputs['Emission Strength'].default_value = 4.5
            
    # Main Fuselage Wedge
    bm = bmesh.new()
    v1 = bm.verts.new((0, -4.5, 0))       # Nose tip
    v2 = bm.verts.new((-1.2, 3.2, -0.4))  # Left rear bottom
    v3 = bm.verts.new((1.2, 3.2, -0.4))   # Right rear bottom
    v4 = bm.verts.new((-1.0, 3.2, 0.6))   # Left rear top
    v5 = bm.verts.new((1.0, 3.2, 0.6))    # Right rear top
    v6 = bm.verts.new((0, -2.5, 0.45))    # Cockpit ridge
    f1 = bm.faces.new([v1, v2, v3])
    f2 = bm.faces.new([v1, v6, v4, v2])
    f3 = bm.faces.new([v1, v3, v5, v6])
    f4 = bm.faces.new([v6, v5, v4])
    f5 = bm.faces.new([v2, v4, v5, v3])
    me = bpy.data.meshes.new("Fuselage_Mesh")
    bm.to_mesh(me)
    bm.free()
    
    hull = bpy.data.objects.new("Fuselage", me)
    bpy.context.collection.objects.link(hull)
    bpy.ops.object.shade_smooth()
    bev = hull.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.03
    bev.segments = 2
    hull.data.materials.append(mat_hull)
    hull.parent = root
    
    # Cockpit Canopy
    bpy.ops.mesh.primitive_cylinder_add(radius=0.42, depth=1.6, vertices=24, location=(0, -1.2, 0.48))
    canopy = bpy.context.active_object
    canopy.scale = (0.8, 1.0, 0.45)
    canopy.rotation_euler.x = math.radians(78)
    bpy.ops.object.shade_smooth()
    canopy.data.materials.append(mat_cockpit)
    canopy.parent = root
    
    # Delta Wings
    for sign in [-1, 1]:
        bmw = bmesh.new()
        wv1 = bmw.verts.new((sign * 1.0, -1.2, 0.0))
        wv2 = bmw.verts.new((sign * 3.8, 2.8, 0.2))
        wv3 = bmw.verts.new((sign * 3.5, 3.4, 0.2))
        wv4 = bmw.verts.new((sign * 1.0, 3.2, 0.0))
        wf = bmw.faces.new([wv1, wv2, wv3, wv4])
        bmesh.ops.solidify(bmw, geom=[wf], thickness=0.08)
        wme = bpy.data.meshes.new(f"Wing_{sign}")
        bmw.to_mesh(wme)
        bmw.free()
        
        wing = bpy.data.objects.new(f"Wing_{sign}", wme)
        bpy.context.collection.objects.link(wing)
        wing.data.materials.append(mat_hull)
        wing.parent = root
        
        # Twin Ion Thruster Nozzles
        bpy.ops.mesh.primitive_cylinder_add(radius=0.32, depth=0.9, vertices=24, location=(sign * 0.65, 3.6, 0.1))
        nozzle = bpy.context.active_object
        nozzle.rotation_euler.x = math.radians(90)
        nozzle.data.materials.append(mat_hull)
        nozzle.parent = root
        
        # Emissive Thruster Core
        bpy.ops.mesh.primitive_cylinder_add(radius=0.22, depth=0.2, vertices=24, location=(sign * 0.65, 3.9, 0.1))
        core = bpy.context.active_object
        core.rotation_euler.x = math.radians(90)
        core.data.materials.append(mat_thrust)
        core.parent = root
        
    export_current_to_glb(os.path.join(out_dir, "spaceship.glb"))

# Execute All Builders
print("\n>>> BUILDING CURATED ASSET CATALOG IN assets/models/...")
build_chair()
build_smartphone()
build_airplane()
build_desk()
build_house()
build_spaceship()
print(">>> ALL 6 ASSETS SUCCESSFULLY BUILT AND EXPORTED TO GLB!\n")
