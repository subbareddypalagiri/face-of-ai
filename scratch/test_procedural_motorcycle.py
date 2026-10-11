import bpy
import math
import json

# Clear scene
bpy.ops.wm.read_factory_settings(use_empty=True)

entityId = "hero_motorcycle"
loc = (0.0, 0.0, 0.0)
dim = (0.85, 2.2, 1.25)

mc_root = bpy.data.objects.new(entityId, None)
mc_root.empty_display_type = 'ARROWS'
mc_root.location = (loc[0], loc[1], loc[2])
mc_root["unin_id"] = entityId
mc_root["unin_hero"] = True
bpy.context.collection.objects.link(mc_root)

# Shaders
def create_pbr_mat(name, color, metallic=0.0, roughness=0.5, clearcoat=0.0, emission=None):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    b = mat.node_tree.nodes.get('Principled BSDF')
    if b:
        if 'Base Color' in b.inputs: b.inputs['Base Color'].default_value = color
        if 'Metallic' in b.inputs: b.inputs['Metallic'].default_value = float(metallic)
        if 'Roughness' in b.inputs: b.inputs['Roughness'].default_value = float(roughness)
        if 'Clearcoat Weight' in b.inputs: b.inputs['Clearcoat Weight'].default_value = float(clearcoat)
        elif 'Clearcoat' in b.inputs: b.inputs['Clearcoat'].default_value = float(clearcoat)
        if emission and 'Emission Color' in b.inputs:
            b.inputs['Emission Color'].default_value = emission
            if 'Emission Strength' in b.inputs: b.inputs['Emission Strength'].default_value = 8.0
    return mat

mat_paint = create_pbr_mat("MC_Obsidian_Gloss_Black", (0.015, 0.015, 0.018, 1.0), metallic=0.85, roughness=0.12, clearcoat=1.0)
mat_chrome = create_pbr_mat("MC_Polished_Chrome", (0.95, 0.96, 0.98, 1.0), metallic=1.0, roughness=0.06)
mat_tire = create_pbr_mat("MC_Rubber_Tread", (0.018, 0.018, 0.020, 1.0), metallic=0.0, roughness=0.82)
mat_leather = create_pbr_mat("MC_Saddle_Leather", (0.07, 0.035, 0.018, 1.0), metallic=0.0, roughness=0.48)
mat_headlight = create_pbr_mat("MC_LED_Headlight", (1.0, 0.95, 0.85, 1.0), emission=(1.0, 0.95, 0.85, 1.0))
mat_taillight = create_pbr_mat("MC_LED_Taillight", (0.9, 0.02, 0.02, 1.0), emission=(1.0, 0.02, 0.02, 1.0))
mat_engine_case = create_pbr_mat("MC_Engine_Crankcase", (0.05, 0.05, 0.055, 1.0), metallic=0.4, roughness=0.35)
mat_rotor = create_pbr_mat("MC_Brake_Steel", (0.85, 0.86, 0.88, 1.0), metallic=0.98, roughness=0.20)

# 1. Wheels (Rear at y=-0.65, Front at y=0.85)
for is_front, y_pos, radius, width in [(False, -0.65, 0.34, 0.18), (True, 0.85, 0.36, 0.13)]:
    prefix = f"{entityId}_{'Front' if is_front else 'Rear'}"
    # Tire profile
    bpy.ops.mesh.primitive_torus_add(
        major_radius=radius - (width * 0.42),
        minor_radius=width * 0.45,
        location=(0, y_pos, radius),
        rotation=(math.radians(90), 0, 0),
        major_segments=48,
        minor_segments=24
    )
    tire = bpy.context.view_layer.objects.active
    tire.name = f"{prefix}_Tire"
    tire["unin_id"] = f"{prefix}_Tire"
    tire.parent = mc_root
    tire.data.materials.append(mat_tire)
    sub_tire = tire.modifiers.new("Subdivision", 'SUBSURF')
    sub_tire.levels = 1
    bpy.ops.object.shade_smooth()

    # Outer Chrome Rim Hoop
    bpy.ops.mesh.primitive_cylinder_add(
        radius=radius * 0.78,
        depth=width * 0.85,
        location=(0, y_pos, radius),
        rotation=(math.radians(90), 0, 0),
        vertices=36
    )
    rim = bpy.context.view_layer.objects.active
    rim.name = f"{prefix}_Rim"
    rim["unin_id"] = f"{prefix}_Rim"
    rim.parent = mc_root
    rim.data.materials.append(mat_chrome)
    bev_rim = rim.modifiers.new("Bevel", 'BEVEL')
    bev_rim.width = 0.012
    bev_rim.segments = 2
    bpy.ops.object.shade_smooth()

    # Central Axle Hub
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.065,
        depth=width * 0.95,
        location=(0, y_pos, radius),
        rotation=(math.radians(90), 0, 0),
        vertices=24
    )
    hub = bpy.context.view_layer.objects.active
    hub.name = f"{prefix}_Hub"
    hub["unin_id"] = f"{prefix}_Hub"
    hub.parent = mc_root
    hub.data.materials.append(mat_chrome)
    bpy.ops.object.shade_smooth()

    # Radial Wire Spokes (16 spokes)
    for sp_idx in range(16):
        ang = sp_idx * (2 * math.pi / 16)
        sx = 0.02 * (1 if sp_idx % 2 == 0 else -1)
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.0035,
            depth=radius * 0.72,
            location=(sx, y_pos + (radius * 0.38 * math.sin(ang)), radius + (radius * 0.38 * math.cos(ang))),
            rotation=(ang, 0, 0),
            vertices=8
        )
        spoke = bpy.context.view_layer.objects.active
        spoke.name = f"{prefix}_Spoke_{sp_idx}"
        spoke["unin_id"] = f"{prefix}_Spoke_{sp_idx}"
        spoke.parent = mc_root
        spoke.data.materials.append(mat_chrome)
        bpy.ops.object.shade_smooth()

    # Brake Rotor Disc
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.20,
        depth=0.008,
        location=(width * 0.48, y_pos, radius),
        rotation=(math.radians(90), 0, 0),
        vertices=32
    )
    rotor = bpy.context.view_layer.objects.active
    rotor.name = f"{prefix}_Brake_Rotor"
    rotor["unin_id"] = f"{prefix}_Brake_Rotor"
    rotor.parent = mc_root
    rotor.data.materials.append(mat_rotor)
    bpy.ops.object.shade_smooth()

    # Brake Caliper
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(width * 0.48, y_pos - 0.12, radius + 0.10)
    )
    caliper = bpy.context.view_layer.objects.active
    caliper.name = f"{prefix}_Brake_Caliper"
    caliper["unin_id"] = f"{prefix}_Brake_Caliper"
    caliper.scale = (0.035, 0.08, 0.06)
    bpy.ops.object.transform_apply(scale=True)
    caliper.parent = mc_root
    caliper.data.materials.append(mat_engine_case)
    bev_cal = caliper.modifiers.new("Bevel", 'BEVEL')
    bev_cal.width = 0.008
    bev_cal.segments = 2
    bpy.ops.object.shade_smooth()

# 2. V-Twin Engine Block & Transmission (y=0.05, z=0.46)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.05, 0.36))
crankcase = bpy.context.view_layer.objects.active
crankcase.name = f"{entityId}_Crankcase"
crankcase["unin_id"] = f"{entityId}_Crankcase"
crankcase.scale = (0.34, 0.55, 0.28)
bpy.ops.object.transform_apply(scale=True)
crankcase.parent = mc_root
crankcase.data.materials.append(mat_engine_case)
bev_cc = crankcase.modifiers.new("Bevel", 'BEVEL')
bev_cc.width = 0.025
bev_cc.segments = 3
bpy.ops.object.shade_smooth()

# V-Twin Finned Cylinders (45 degree angle: front +22.5 deg, rear -22.5 deg)
for cyl_idx, ang_deg, y_offset in [(1, 22.5, 0.16), (2, -22.5, -0.08)]:
    ang_rad = math.radians(ang_deg)
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.09,
        depth=0.28,
        location=(0, y_offset, 0.58),
        rotation=(ang_rad, 0, 0),
        vertices=24
    )
    cyl = bpy.context.view_layer.objects.active
    cyl.name = f"{entityId}_Cylinder_{cyl_idx}"
    cyl["unin_id"] = f"{entityId}_Cylinder_{cyl_idx}"
    cyl.parent = mc_root
    cyl.data.materials.append(mat_engine_case)
    bpy.ops.object.shade_smooth()

    # Rocker Cover Head (Chrome)
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(0, y_offset + (0.16 * math.sin(ang_rad)), 0.58 + (0.16 * math.cos(ang_rad)))
    )
    head = bpy.context.view_layer.objects.active
    head.name = f"{entityId}_Rocker_Head_{cyl_idx}"
    head["unin_id"] = f"{entityId}_Rocker_Head_{cyl_idx}"
    head.scale = (0.22, 0.20, 0.07)
    head.rotation_euler = (ang_rad, 0, 0)
    bpy.ops.object.transform_apply(scale=True)
    head.parent = mc_root
    head.data.materials.append(mat_chrome)
    bev_head = head.modifiers.new("Bevel", 'BEVEL')
    bev_head.width = 0.015
    bev_head.segments = 2
    bpy.ops.object.shade_smooth()

    # Cooling fins (5 fin rings per cylinder)
    for fin_idx in range(5):
        f_dist = -0.10 + fin_idx * 0.05
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.115,
            depth=0.008,
            location=(0, y_offset + (f_dist * math.sin(ang_rad)), 0.58 + (f_dist * math.cos(ang_rad))),
            rotation=(ang_rad, 0, 0),
            vertices=24
        )
        fin = bpy.context.view_layer.objects.active
        fin.name = f"{entityId}_Fin_{cyl_idx}_{fin_idx}"
        fin["unin_id"] = f"{entityId}_Fin_{cyl_idx}_{fin_idx}"
        fin.parent = mc_root
        fin.data.materials.append(mat_chrome)
        bpy.ops.object.shade_smooth()

# Air Filter Cleaner Box (Right side)
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.08,
    depth=0.06,
    location=(0.20, 0.04, 0.52),
    rotation=(0, math.radians(90), 0),
    vertices=24
)
airbox = bpy.context.view_layer.objects.active
airbox.name = f"{entityId}_Air_Filter_Box"
airbox["unin_id"] = f"{entityId}_Air_Filter_Box"
airbox.parent = mc_root
airbox.data.materials.append(mat_chrome)
bev_ab = airbox.modifiers.new("Bevel", 'BEVEL')
bev_ab.width = 0.01
bpy.ops.object.shade_smooth()

# 3. Double Cradle Frame (Tubular Steel)
for side_x in [-0.15, 0.15]:
    # Lower cradle tube
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.018,
        depth=1.10,
        location=(side_x, 0.08, 0.22),
        rotation=(math.radians(90), 0, 0),
        vertices=16
    )
    tube = bpy.context.view_layer.objects.active
    tube.name = f"{entityId}_Frame_Lower_{'L' if side_x < 0 else 'R'}"
    tube["unin_id"] = f"{entityId}_Frame_Lower_{'L' if side_x < 0 else 'R'}"
    tube.parent = mc_root
    tube.data.materials.append(mat_paint)
    bpy.ops.object.shade_smooth()

# Backbone tube
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.022,
    depth=0.95,
    location=(0, 0.28, 0.72),
    rotation=(math.radians(65), 0, 0),
    vertices=16
)
bb = bpy.context.view_layer.objects.active
bb.name = f"{entityId}_Frame_Backbone"
bb["unin_id"] = f"{entityId}_Frame_Backbone"
bb.parent = mc_root
bb.data.materials.append(mat_paint)
bpy.ops.object.shade_smooth()

# 4. Teardrop Fuel Tank & Chrome Gas Cap
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.20,
    depth=0.72,
    location=(0, 0.28, 0.84),
    rotation=(math.radians(76), 0, 0),
    vertices=32
)
tank = bpy.context.view_layer.objects.active
tank.name = f"{entityId}_Teardrop_Fuel_Tank"
tank["unin_id"] = f"{entityId}_Teardrop_Fuel_Tank"
tank.scale = (0.78, 1.0, 0.72)
bpy.ops.object.transform_apply(scale=True)
tank.parent = mc_root
tank.data.materials.append(mat_paint)
sub_tank = tank.modifiers.new("Subsurf", 'SUBSURF')
sub_tank.levels = 2
bev_tank = tank.modifiers.new("Bevel", 'BEVEL')
bev_tank.width = 0.015
bev_tank.segments = 2
bpy.ops.object.shade_smooth()

# Chrome Filler Cap
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.038,
    depth=0.02,
    location=(0.04, 0.32, 0.98),
    rotation=(math.radians(14), 0, 0),
    vertices=20
)
cap = bpy.context.view_layer.objects.active
cap.name = f"{entityId}_Gas_Cap"
cap["unin_id"] = f"{entityId}_Gas_Cap"
cap.parent = mc_root
cap.data.materials.append(mat_chrome)
bpy.ops.object.shade_smooth()

# 5. Contoured Leather Solo Saddle & Pillion
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.22, 0.70))
seat = bpy.context.view_layer.objects.active
seat.name = f"{entityId}_Leather_Saddle"
seat["unin_id"] = f"{entityId}_Leather_Saddle"
seat.scale = (0.32, 0.38, 0.09)
bpy.ops.object.transform_apply(scale=True)
seat.parent = mc_root
seat.data.materials.append(mat_leather)
bev_seat = seat.modifiers.new("Bevel", 'BEVEL')
bev_seat.width = 0.035
bev_seat.segments = 3
bpy.ops.object.shade_smooth()

# 6. Sculpted Fenders (Front & Rear)
# Front fender
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.40,
    depth=0.15,
    location=(0, 0.85, 0.48),
    rotation=(math.radians(90), 0, 0),
    vertices=32
)
ff = bpy.context.view_layer.objects.active
ff.name = f"{entityId}_Front_Fender"
ff["unin_id"] = f"{entityId}_Front_Fender"
ff.scale = (0.85, 1.0, 0.45)
bpy.ops.object.transform_apply(scale=True)
ff.parent = mc_root
ff.data.materials.append(mat_paint)
bpy.ops.object.shade_smooth()

# Rear fender
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.38,
    depth=0.20,
    location=(0, -0.65, 0.44),
    rotation=(math.radians(90), 0, 0),
    vertices=32
)
rf = bpy.context.view_layer.objects.active
rf.name = f"{entityId}_Rear_Fender"
rf["unin_id"] = f"{entityId}_Rear_Fender"
rf.scale = (0.90, 1.0, 0.48)
bpy.ops.object.transform_apply(scale=True)
rf.parent = mc_root
rf.data.materials.append(mat_paint)
bpy.ops.object.shade_smooth()

# Rear LED taillight
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.92, 0.52))
tl = bpy.context.view_layer.objects.active
tl.name = f"{entityId}_Rear_Taillight"
tl["unin_id"] = f"{entityId}_Rear_Taillight"
tl.scale = (0.12, 0.03, 0.04)
bpy.ops.object.transform_apply(scale=True)
tl.parent = mc_root
tl.data.materials.append(mat_taillight)
bpy.ops.object.shade_smooth()

# 7. Dual Staggered Slash-Cut Chrome Exhaust Pipes
for i, z_pipe in enumerate([0.22, 0.34]):
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.038,
        depth=1.35,
        location=(0.24, -0.18, z_pipe),
        rotation=(math.radians(88), math.radians(2), 0),
        vertices=24
    )
    pipe = bpy.context.view_layer.objects.active
    pipe.name = f"{entityId}_Exhaust_Pipe_{i+1}"
    pipe["unin_id"] = f"{entityId}_Exhaust_Pipe_{i+1}"
    pipe.parent = mc_root
    pipe.data.materials.append(mat_chrome)
    bev_pipe = pipe.modifiers.new("Bevel", 'BEVEL')
    bev_pipe.width = 0.008
    bev_pipe.segments = 2
    bpy.ops.object.shade_smooth()

# 8. Front Fork Suspension, Triple-Tree Clamps & Handlebars
for sx in [-0.15, 0.15]:
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.030,
        depth=0.92,
        location=(sx, 0.78, 0.64),
        rotation=(math.radians(-24), 0, 0),
        vertices=20
    )
    fork = bpy.context.view_layer.objects.active
    fork.name = f"{entityId}_Front_Fork_{'L' if sx < 0 else 'R'}"
    fork["unin_id"] = f"{entityId}_Front_Fork_{'L' if sx < 0 else 'R'}"
    fork.parent = mc_root
    fork.data.materials.append(mat_chrome)
    bpy.ops.object.shade_smooth()

# Triple tree clamp
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.68, 0.94))
clamp = bpy.context.view_layer.objects.active
clamp.name = f"{entityId}_Triple_Tree_Clamp"
clamp["unin_id"] = f"{entityId}_Triple_Tree_Clamp"
clamp.scale = (0.34, 0.08, 0.04)
clamp.rotation_euler = (math.radians(-24), 0, 0)
bpy.ops.object.transform_apply(scale=True)
clamp.parent = mc_root
clamp.data.materials.append(mat_chrome)
bpy.ops.object.shade_smooth()

# Ape Handlebars with Rubber Grips & Levers
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.022,
    depth=0.86,
    location=(0, 0.62, 1.04),
    rotation=(0, math.radians(90), 0),
    vertices=20
)
bars = bpy.context.view_layer.objects.active
bars.name = f"{entityId}_Handlebars"
bars["unin_id"] = f"{entityId}_Handlebars"
bars.parent = mc_root
bars.data.materials.append(mat_chrome)
bpy.ops.object.shade_smooth()

# Rubber Hand Grips (L & R)
for gx in [-0.38, 0.38]:
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.028,
        depth=0.14,
        location=(gx, 0.62, 1.04),
        rotation=(0, math.radians(90), 0),
        vertices=16
    )
    grip = bpy.context.view_layer.objects.active
    grip.name = f"{entityId}_Grip_{'L' if gx < 0 else 'R'}"
    grip["unin_id"] = f"{entityId}_Grip_{'L' if gx < 0 else 'R'}"
    grip.parent = mc_root
    grip.data.materials.append(mat_tire)
    bpy.ops.object.shade_smooth()

# 9. Chrome Bullet Headlight & Real Spotlight
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.10,
    depth=0.16,
    location=(0, 0.95, 0.88),
    rotation=(math.radians(90), 0, 0),
    vertices=24
)
hl = bpy.context.view_layer.objects.active
hl.name = f"{entityId}_Bullet_Headlight"
hl["unin_id"] = f"{entityId}_Bullet_Headlight"
hl.parent = mc_root
hl.data.materials.append(mat_headlight)
bev_hl = hl.modifiers.new("Bevel", 'BEVEL')
bev_hl.width = 0.015
bev_hl.segments = 2
bpy.ops.object.shade_smooth()

# Measure evaluated triangle counts
depsgraph = bpy.context.evaluated_depsgraph_get()
eval_objects = [o.evaluated_get(depsgraph) for o in mc_root.children if o.type == 'MESH']
total_raw_tris = 0
total_eval_tris = 0

for o in mc_root.children:
    if o.type == 'MESH':
        total_raw_tris += sum(len(p.vertices) - 2 for p in o.data.polygons)

for o in eval_objects:
    total_eval_tris += sum(len(p.vertices) - 2 for p in o.data.polygons)

res = {
    "components_count": len(mc_root.children),
    "total_raw_tris": total_raw_tris,
    "total_eval_tris": total_eval_tris
}
print("MOTORCYCLE_MODEL_STATS:" + json.dumps(res))
