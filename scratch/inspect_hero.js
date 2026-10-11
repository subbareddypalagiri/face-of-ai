const { sendBridgeRPC } = require('../src/main/tools/blenderAstraEngine');
const fs = require('fs');

async function testFraming() {
  const py = `
import bpy, math, mathutils

scene = bpy.context.scene

# Collect root hero objects
root_objs = []
for o in bpy.context.scene.objects:
    if o.get("unin_hero") or o.name.startswith("hero_") or "Chair_Root" in o.name:
        root_objs.append(o)
if not root_objs:
    for o in bpy.context.scene.objects:
        if o.type == 'MESH' and not any(k in o.name.lower() for k in ['ground', 'foundation', 'floor', 'plane', 'streetlamp', 'curb', 'emitter']):
            root_objs.append(o)

# Recursively collect all descendants
all_subject_objs = []
def collect_descendants(obj):
    if obj not in all_subject_objs:
        all_subject_objs.append(obj)
    for ch in obj.children:
        collect_descendants(ch)

for ro in root_objs:
    collect_descendants(ro)

coords = []
for o in all_subject_objs:
    if hasattr(o, "bound_box") and o.bound_box:
        for corner in o.bound_box:
            coords.append(o.matrix_world @ mathutils.Vector(corner))

if coords:
    min_x = min(c.x for c in coords)
    max_x = max(c.x for c in coords)
    min_y = min(c.y for c in coords)
    max_y = max(c.y for c in coords)
    min_z = min(c.z for c in coords)
    max_z = max(c.z for c in coords)
    center = mathutils.Vector(((min_x + max_x) / 2.0, (min_y + max_y) / 2.0, (min_z + max_z) / 2.0))
    dims = mathutils.Vector((max(0.1, max_x - min_x), max(0.1, max_y - min_y), max(0.1, max_z - min_z)))
else:
    center = mathutils.Vector((0.0, 0.0, 0.65))
    dims = mathutils.Vector((1.0, 1.0, 1.0))

cam_obj = bpy.data.objects.get("unin.camera.primary")
if not cam_obj:
    cam_data = bpy.data.cameras.new("Cinematic_Master_Camera")
    cam_obj = bpy.data.objects.new("unin.camera.primary", cam_data)
    bpy.context.collection.objects.link(cam_obj)

cam_data = cam_obj.data
focal_l = getattr(cam_data, 'lens', 40.0)
sensor_w = getattr(cam_data, 'sensor_width', 36.0)
fov_h = 2.0 * math.atan(sensor_w / (2.0 * focal_l))

res_x = scene.render.resolution_x
res_y = max(1, scene.render.resolution_y)
aspect = res_x / res_y
sensor_h = sensor_w / aspect
fov_v = 2.0 * math.atan(sensor_h / (2.0 * focal_l))

xy_span = math.sqrt(dims.x**2 + dims.y**2)
z_span = dims.z

dist_h = xy_span / (2.0 * math.tan(fov_h / 2.0))
dist_v = z_span / (2.0 * math.tan(fov_v / 2.0))

fit_dist = max(dist_h, dist_v) * 1.35
fit_dist = max(fit_dist, 2.2)

elev = math.radians(16.0)
azimuth = math.radians(-35.0)

cam_x = center.x + fit_dist * math.cos(elev) * math.sin(azimuth)
cam_y = center.y - fit_dist * math.cos(elev) * math.cos(azimuth)
cam_z = center.z + fit_dist * math.sin(elev)
cam_obj.location = (cam_x, cam_y, cam_z)

look_target = bpy.data.objects.get("unin.camera.look_target")
if not look_target:
    look_target = bpy.data.objects.new("unin.camera.look_target", None)
    bpy.context.collection.objects.link(look_target)
look_target.location = center

trk = None
for c in cam_obj.constraints:
    if c.type == 'TRACK_TO':
        trk = c
        break
if not trk:
    trk = cam_obj.constraints.new(type='TRACK_TO')
trk.target = look_target
trk.track_axis = 'TRACK_NEGATIVE_Z'
trk.up_axis = 'UP_Y'

cam_data.dof.focus_distance = (cam_obj.location - look_target.location).length
scene.camera = cam_obj

# Render preview still
out_path = r"C:/Users/subba/Downloads/prime -ps/face of me/scratch/test_framed_render.png"
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
with open(r"C:/Users/subba/Downloads/prime -ps/face of me/scratch/framing_result.json", "w") as f:
    import json
    json.dump(out, f, indent=2)
`;
  await sendBridgeRPC('execute_bpy', { code: py, autoCapture: false });
  const data = JSON.parse(fs.readFileSync('C:/Users/subba/Downloads/prime -ps/face of me/scratch/framing_result.json', 'utf8'));
  console.log(JSON.stringify(data, null, 2));
}

testFraming().catch(console.error);
