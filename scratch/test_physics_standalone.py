import bpy
import json

# Clear scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# 1. Initialize rigid body world
if not scene.rigidbody_world:
    bpy.ops.rigidbody.world_add()

rw = scene.rigidbody_world
rw.enabled = True
rw.time_scale = 1.0

# 2. Create passive floor at Z=0
bpy.ops.mesh.primitive_plane_add(size=20, location=(0,0,0))
floor = bpy.context.view_layer.objects.active
floor.name = "test_floor"
bpy.ops.rigidbody.object_add()
floor.rigid_body.type = 'PASSIVE'

# 3. Create active falling cube at Z=5.0
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0,0,5.0))
box = bpy.context.view_layer.objects.active
box.name = "test_box"
bpy.ops.rigidbody.object_add()
box.rigid_body.type = 'ACTIVE'
box.rigid_body.mass = 5.0

# 4. Step simulation from frame 1 to frame 40
positions = []
scene.frame_set(1)
positions.append((1, float(box.matrix_world.translation.z)))

for f in range(2, 41):
    scene.frame_set(f)
    positions.append((f, float(box.matrix_world.translation.z)))

res = {
    "world_enabled": bool(scene.rigidbody_world.enabled),
    "f1_z": round(positions[0][1], 4),
    "f10_z": round(positions[9][1], 4),
    "f20_z": round(positions[19][1], 4),
    "f40_z": round(positions[39][1], 4),
    "fell": positions[-1][1] < positions[0][1],
    "collision_on_floor": 0.45 <= positions[-1][1] <= 0.65
}
print("STANDALONE_PHYSICS_RESULT:" + json.dumps(res))
