# scratch/audit_physics_sim.py — Rigid Body Simulation Behavior Audit
import bpy

# Setup clean scene for rigid body test
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# 1. Floor (Passive Rigid Body)
bpy.ops.mesh.primitive_plane_add(size=10, location=(0, 0, 0))
floor = bpy.context.active_object
floor.name = "Floor_Passive"
bpy.ops.rigidbody.object_add()
floor.rigid_body.type = 'PASSIVE'
floor.rigid_body.collision_shape = 'BOX'
floor.rigid_body.friction = 0.5

# 2. Falling Box (Active Rigid Body)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 5.0))
box = bpy.context.active_object
box.name = "Box_Active"
bpy.ops.rigidbody.object_add()
box.rigid_body.type = 'ACTIVE'
box.rigid_body.mass = 2.0
box.rigid_body.collision_shape = 'BOX'

# Step through simulation frames and sample box Z position
print("=== RIGID BODY SIMULATION TEST START ===")
traj = {}
for f in [1, 5, 10, 15, 20, 25, 30, 40, 50]:
    scene.frame_set(f)
    depsgraph = bpy.context.evaluated_depsgraph_get()
    eval_box = box.evaluated_get(depsgraph)
    z_loc = round(eval_box.matrix_world.translation.z, 4)
    traj[f] = z_loc
    print(f"Frame {f:2d}: Box Z = {z_loc:.4f}")

initial_z = traj[1]
collision_z = traj[50]
falling = traj[10] < traj[1]
resting_on_floor = 0.45 <= collision_z <= 0.65 # Half-height of 1m cube is 0.5m

print(f"Initial Z: {initial_z}")
print(f"Final Z (Frame 50): {collision_z}")
print(f"Gravity Working: {falling}")
print(f"Collision Rest on Floor: {resting_on_floor}")
print("=== RIGID BODY SIMULATION TEST END ===")
