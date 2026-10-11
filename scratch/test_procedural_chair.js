const { sendBridgeRPC } = require('../src/main/tools/blenderAstraEngine');
const fs = require('fs');

async function testProceduralChair() {
  const py = `
import bpy, bmesh, math, mathutils

# 1. Reset Scene
for o in list(bpy.context.scene.objects):
    bpy.data.objects.remove(o, do_unlink=True)

# 2. Studio Ground Foundation
bpy.ops.mesh.primitive_plane_add(size=30.0, location=(0, 0, 0))
ground = bpy.context.view_layer.objects.active
ground.name = "unin.environment.foundation"
mat_ground = bpy.data.materials.new(name="PBR_Studio_Floor")
mat_ground.use_nodes = True
b_g = mat_ground.node_tree.nodes.get('Principled BSDF')
if b_g:
    b_g.inputs['Base Color'].default_value = (0.20, 0.22, 0.25, 1.0)
    b_g.inputs['Roughness'].default_value = 0.40
ground.data.materials.append(mat_ground)

# 3. Create Procedural Wooden Chair Assembly
entity_id = "hero_chair"
base_loc = (0.0, 0.0, 0.0)

focal_root = bpy.data.objects.new(entity_id, None)
focal_root["unin_id"] = entity_id
focal_root["unin_hero"] = 1
focal_root.empty_display_type = 'ARROWS'
focal_root.location = base_loc
bpy.context.collection.objects.link(focal_root)

# Procedural Oak Wood Shader with Organic Grain
mat_wood = bpy.data.materials.new(name=f"{entity_id}_Oak_Wood")
mat_wood.use_nodes = True
w_tree = mat_wood.node_tree
w_nodes = w_tree.nodes
w_links = w_tree.links
w_nodes.clear()

w_out = w_nodes.new('ShaderNodeOutputMaterial')
w_bsdf = w_nodes.new('ShaderNodeBsdfPrincipled')
w_tc = w_nodes.new('ShaderNodeTexCoord')
w_map = w_nodes.new('ShaderNodeMapping')
w_map.inputs['Scale'].default_value = (1.5, 1.5, 12.0)
w_wave = w_nodes.new('ShaderNodeTexWave')
w_wave.wave_type = 'BANDS'
w_wave.rings_direction = 'Z'
w_wave.inputs['Scale'].default_value = 5.0
w_wave.inputs['Distortion'].default_value = 2.2
w_wave.inputs['Detail'].default_value = 3.5
w_wave.inputs['Detail Roughness'].default_value = 0.65

w_ramp = w_nodes.new('ShaderNodeValToRGB')
w_ramp.color_ramp.elements[0].position = 0.20
w_ramp.color_ramp.elements[0].color = (0.24, 0.12, 0.06, 1.0) # Rich dark grain
w_ramp.color_ramp.elements[1].position = 0.85
w_ramp.color_ramp.elements[1].color = (0.50, 0.30, 0.15, 1.0) # Warm golden oak

w_bump = w_nodes.new('ShaderNodeBump')
w_bump.inputs['Strength'].default_value = 0.06

w_links.new(w_tc.outputs['Object'], w_map.inputs['Vector'])
w_links.new(w_map.outputs['Vector'], w_wave.inputs['Vector'])
w_links.new(w_wave.outputs['Color'], w_ramp.inputs['Fac'])
w_links.new(w_ramp.outputs['Color'], w_bsdf.inputs['Base Color'])
w_links.new(w_wave.outputs['Fac'], w_bump.inputs['Height'])
w_links.new(w_bump.outputs['Normal'], w_bsdf.inputs['Normal'])

w_bsdf.inputs['Roughness'].default_value = 0.32
if 'Specular IOR Level' in w_bsdf.inputs: w_bsdf.inputs['Specular IOR Level'].default_value = 0.5
w_links.new(w_bsdf.outputs['BSDF'], w_out.inputs['Surface'])

# Procedural Textured Fabric Cushion Shader
mat_fabric = bpy.data.materials.new(name=f"{entity_id}_Fabric_Cushion")
mat_fabric.use_nodes = True
f_tree = mat_fabric.node_tree
f_nodes = f_tree.nodes
f_links = f_tree.links
f_nodes.clear()

f_out = f_nodes.new('ShaderNodeOutputMaterial')
f_bsdf = f_nodes.new('ShaderNodeBsdfPrincipled')
f_tc = f_nodes.new('ShaderNodeTexCoord')
f_noise = f_nodes.new('ShaderNodeTexNoise')
f_noise.inputs['Scale'].default_value = 75.0
f_noise.inputs['Detail'].default_value = 4.0
f_bump = f_nodes.new('ShaderNodeBump')
f_bump.inputs['Strength'].default_value = 0.05

f_links.new(f_tc.outputs['Object'], f_noise.inputs['Vector'])
f_links.new(f_noise.outputs['Fac'], f_bump.inputs['Height'])
f_links.new(f_bump.outputs['Normal'], f_bsdf.inputs['Normal'])
f_bsdf.inputs['Base Color'].default_value = (0.16, 0.20, 0.26, 1.0) # Deep charcoal slate
f_bsdf.inputs['Roughness'].default_value = 0.85
if 'Sheen Weight' in f_bsdf.inputs: f_bsdf.inputs['Sheen Weight'].default_value = 0.8
f_links.new(f_bsdf.outputs['BSDF'], f_out.inputs['Surface'])

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

# 1. Solid Oak Wood Seat Plate
def create_seat_plate():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.48, 0.46, 0.035)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.012
    bev.segments = 3
    return o
add_part("Seat_Plate", create_seat_plate, (0, 0, 0.44), mat=mat_wood)

# 2. Upholstered Seat Cushion
def create_cushion():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.45, 0.43, 0.065)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.035
    bev.segments = 4
    return o
add_part("Seat_Cushion", create_cushion, (0, -0.01, 0.49), mat=mat_fabric)

# 3. Ergonomic Contoured CURVED Backrest
def create_curved_backrest():
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.view_layer.objects.active
    o.scale = (0.46, 0.038, 0.24)
    bpy.ops.object.transform_apply(scale=True)
    
    # Subdivide along X to allow smooth curving
    sub = o.modifiers.new("Subsurf", 'SUBSURF')
    sub.levels = 2
    
    # Simple Deform Bend modifier along Z to curve ergonomically around the back
    bend = o.modifiers.new("Curved_Backrest", 'SIMPLE_DEFORM')
    bend.deform_method = 'BEND'
    bend.deform_axis = 'Z'
    bend.angle = math.radians(-32.0)
    
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.012
    bev.segments = 3
    return o
add_part("Backrest_Panel", create_curved_backrest, (0, 0.19, 0.76), rot_rel=(math.radians(-7), 0, 0), mat=mat_wood)

# 4. Turned Backrest Support Stiles
def create_stile():
    bpy.ops.mesh.primitive_cylinder_add(radius=0.016, depth=0.42, vertices=20)
    o = bpy.context.view_layer.objects.active
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.004
    bev.segments = 2
    return o
add_part("Back_Stile_L", create_stile, (-0.18, 0.18, 0.65), rot_rel=(math.radians(-7), 0, 0), mat=mat_wood)
add_part("Back_Stile_R", create_stile, (0.18, 0.18, 0.65), rot_rel=(math.radians(-7), 0, 0), mat=mat_wood)

# 5. Front Legs (Left & Right Tapered Wood)
def create_front_leg():
    bpy.ops.mesh.primitive_cylinder_add(radius=0.022, depth=0.44, vertices=20)
    o = bpy.context.view_layer.objects.active
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.005
    bev.segments = 2
    return o
add_part("Leg_Front_L", create_front_leg, (-0.19, -0.18, 0.22), rot_rel=(math.radians(3), math.radians(-3), 0), mat=mat_wood)
add_part("Leg_Front_R", create_front_leg, (0.19, -0.18, 0.22), rot_rel=(math.radians(3), math.radians(3), 0), mat=mat_wood)

# 6. Rear Legs (Left & Right Tapered Wood with Splay)
def create_rear_leg():
    bpy.ops.mesh.primitive_cylinder_add(radius=0.022, depth=0.44, vertices=20)
    o = bpy.context.view_layer.objects.active
    bev = o.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.005
    bev.segments = 2
    return o
add_part("Leg_Rear_L", create_rear_leg, (-0.19, 0.18, 0.22), rot_rel=(math.radians(-6), math.radians(-3), 0), mat=mat_wood)
add_part("Leg_Rear_R", create_rear_leg, (0.19, 0.18, 0.22), rot_rel=(math.radians(-6), math.radians(3), 0), mat=mat_wood)

# 7. Structural Bracing Stretchers
def create_stretcher(depth):
    bpy.ops.mesh.primitive_cylinder_add(radius=0.012, depth=depth, vertices=16)
    o = bpy.context.view_layer.objects.active
    return o
add_part("Stretcher_Side_L", lambda: create_stretcher(0.36), (-0.19, 0.0, 0.16), rot_rel=(math.radians(90), 0, 0), mat=mat_wood)
add_part("Stretcher_Side_R", lambda: create_stretcher(0.36), (0.19, 0.0, 0.16), rot_rel=(math.radians(90), 0, 0), mat=mat_wood)
add_part("Stretcher_Cross", lambda: create_stretcher(0.38), (0.0, 0.0, 0.16), rot_rel=(0, math.radians(90), 0), mat=mat_wood)

# 4. Cinematic Studio 3-Point Lighting
# Key
kd = bpy.data.lights.new(name="Key_Light_Data", type='AREA')
kd.energy = 2200.0
kd.color = (1.0, 0.96, 0.92)
kd.size = 3.0
k_obj = bpy.data.objects.new("unin.lighting.key", kd)
k_obj.location = (2.8, -3.2, 3.2)
bpy.context.collection.objects.link(k_obj)

# Fill
fd = bpy.data.lights.new(name="Fill_Light_Data", type='AREA')
fd.energy = 700.0
fd.color = (0.85, 0.92, 1.0)
fd.size = 4.0
f_obj = bpy.data.objects.new("unin.lighting.fill", fd)
f_obj.location = (-2.8, -2.5, 2.2)
bpy.context.collection.objects.link(f_obj)

# Rim
rd = bpy.data.lights.new(name="Rim_Light_Data", type='SPOT')
rd.energy = 1600.0
rd.color = (1.0, 0.98, 1.0)
rd.spot_size = math.radians(50)
rd.spot_blend = 0.4
r_obj = bpy.data.objects.new("unin.lighting.rim", rd)
r_obj.location = (0.0, 3.0, 2.8)
bpy.context.collection.objects.link(r_obj)

# 5. DYNAMIC BOUNDING BOX CAMERA FRAMING
all_subject_objs = []
def collect_descendants(obj):
    if obj not in all_subject_objs:
        all_subject_objs.append(obj)
    for ch in obj.children:
        collect_descendants(ch)
collect_descendants(focal_root)

coords = []
for o in all_subject_objs:
    if hasattr(o, "bound_box") and o.bound_box:
        for corner in o.bound_box:
            coords.append(o.matrix_world @ mathutils.Vector(corner))

min_x = min(c.x for c in coords)
max_x = max(c.x for c in coords)
min_y = min(c.y for c in coords)
max_y = max(c.y for c in coords)
min_z = min(c.z for c in coords)
max_z = max(c.z for c in coords)
center = mathutils.Vector(((min_x + max_x) / 2.0, (min_y + max_y) / 2.0, (min_z + max_z) / 2.0))
dims = mathutils.Vector((max(0.1, max_x - min_x), max(0.1, max_y - min_y), max(0.1, max_z - min_z)))

cam_data = bpy.data.cameras.new("Cinematic_Master_Camera")
cam_data.lens = 45.0
cam_data.sensor_width = 36.0
cam_data.dof.use_dof = True
cam_data.dof.aperture_fstop = 3.5

cam_obj = bpy.data.objects.new("unin.camera.primary", cam_data)
bpy.context.collection.objects.link(cam_obj)

# Camera distance calculation
res_x = scene.render.resolution_x
res_y = max(1, scene.render.resolution_y)
aspect = res_x / res_y
sensor_h = cam_data.sensor_width / aspect
fov_h = 2.0 * math.atan(cam_data.sensor_width / (2.0 * cam_data.lens))
fov_v = 2.0 * math.atan(sensor_h / (2.0 * cam_data.lens))

xy_span = math.sqrt(dims.x**2 + dims.y**2)
z_span = dims.z
dist_h = xy_span / (2.0 * math.tan(fov_h / 2.0))
dist_v = z_span / (2.0 * math.tan(fov_v / 2.0))
fit_dist = max(dist_h, dist_v) * 1.35

elev = math.radians(16.0)
azimuth = math.radians(-32.0)

cam_obj.location = (
    center.x + fit_dist * math.cos(elev) * math.sin(azimuth),
    center.y - fit_dist * math.cos(elev) * math.cos(azimuth),
    center.z + fit_dist * math.sin(elev)
)

look_target = bpy.data.objects.new("unin.camera.look_target", None)
look_target.location = center
bpy.context.collection.objects.link(look_target)

# Track to center
trk = cam_obj.constraints.new(type='TRACK_TO')
trk.target = look_target
trk.track_axis = 'TRACK_NEGATIVE_Z'
trk.up_axis = 'UP_Y'

# Aim lights to center
for l_obj in [k_obj, f_obj, r_obj]:
    l_trk = l_obj.constraints.new(type='TRACK_TO')
    l_trk.target = look_target
    l_trk.track_axis = 'TRACK_NEGATIVE_Z'
    l_trk.up_axis = 'UP_Y'

cam_data.dof.focus_distance = (cam_obj.location - look_target.location).length
scene.camera = cam_obj

# Color Management
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'High Contrast'

# Render 1080p
out_path = r"C:/Users/subba/Downloads/prime -ps/face of me/scratch/procedural_wooden_chair_framed.png"
scene.render.filepath = out_path
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
bpy.ops.render.render(write_still=True)

out = {
    "center": [round(v, 3) for v in center],
    "dims": [round(v, 3) for v in dims],
    "fit_dist": round(fit_dist, 3),
    "cam_loc": [round(v, 3) for v in cam_obj.location],
    "render": out_path
}
with open(r"C:/Users/subba/Downloads/prime -ps/face of me/scratch/chair_test_out.json", "w") as f:
    import json
    json.dump(out, f, indent=2)
`;
  const res = await sendBridgeRPC('execute_bpy', { code: py, autoCapture: false });
  console.log('Bridge Response:', res);
  if (fs.existsSync('C:/Users/subba/Downloads/prime -ps/face of me/scratch/chair_test_out.json')) {
    const data = JSON.parse(fs.readFileSync('C:/Users/subba/Downloads/prime -ps/face of me/scratch/chair_test_out.json', 'utf8'));
    console.log(JSON.stringify(data, null, 2));
  }
}

testProceduralChair().catch(console.error);
