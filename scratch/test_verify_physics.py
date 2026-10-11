import urllib.request
import json

code = """
import bpy
scene = bpy.context.scene

# Ensure rigid body world exists
if not scene.rigidbody_world:
    bpy.ops.rigidbody.world_add()

rw = scene.rigidbody_world
rw.enabled = True

# Clear any previous test objects
for o in list(scene.objects):
    if o.name.startswith("test_physics_"):
        bpy.data.objects.remove(o, do_unlink=True)

# Create passive ground floor at Z=0
bpy.ops.mesh.primitive_plane_add(size=20, location=(0,0,0))
floor = bpy.context.view_layer.objects.active
floor.name = "test_physics_floor"
bpy.ops.rigidbody.object_add()
floor.rigid_body.type = 'PASSIVE'

# Create active dynamic cube at Z=5.0
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0,0,5.0))
box = bpy.context.view_layer.objects.active
box.name = "test_physics_box"
bpy.ops.rigidbody.object_add()
box.rigid_body.type = 'ACTIVE'
box.rigid_body.mass = 5.0

# Evaluate across 30 frames
positions = []
scene.frame_set(1)
positions.append((1, float(box.matrix_world.translation.z)))

for f in range(2, 41):
    scene.frame_set(f)
    positions.append((f, float(box.matrix_world.translation.z)))

res = {
    "world_enabled": bool(scene.rigidbody_world.enabled),
    "f1_z": round(positions[0][1], 4),
    "f20_z": round(positions[19][1], 4),
    "f40_z": round(positions[39][1], 4),
    "fell": positions[-1][1] < positions[0][1],
    "ground_collision": positions[-1][1] >= 0.45 and positions[-1][1] <= 0.65
}
print("PHYSICS_TEST_RESULT:" + json.dumps(res))
"""

payload = json.dumps({
    "id": "req_physics_test",
    "method": "execute_bpy",
    "params": {"code": code, "autoCapture": False}
}).encode('utf-8')

req = urllib.request.Request("http://127.0.0.1:8192/rpc", data=payload, headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req, timeout=15) as resp:
    data = resp.read().decode('utf-8')
    print("RESPONSE:", data)
