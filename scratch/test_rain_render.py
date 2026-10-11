import bpy
import os

# Clear scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# Create camera
cam_data = bpy.data.cameras.new(name="Camera")
cam_obj = bpy.data.objects.new(name="Camera", object_data=cam_data)
scene.collection.objects.link(cam_obj)
cam_obj.location = (0, -6, 2)
cam_obj.rotation_euler = (1.3, 0, 0)
scene.camera = cam_obj

# Create light
light_data = bpy.data.lights.new(name="Sun", type='SUN')
light_data.energy = 5.0
light_obj = bpy.data.objects.new(name="Sun", object_data=light_data)
scene.collection.objects.link(light_obj)

# Create floor
bpy.ops.mesh.primitive_plane_add(size=20, location=(0,0,0))

# Test A: Particle system with bake
bpy.ops.mesh.primitive_plane_add(size=10, location=(0, 0, 8))
emitter = bpy.context.view_layer.objects.active
emitter.name = "Rain_Emitter"

# Drop proto
bpy.ops.mesh.primitive_cylinder_add(radius=0.01, depth=0.4, location=(0,0,-50))
drop = bpy.context.view_layer.objects.active
drop.name = "Rain_Drop_Proto"

mat = bpy.data.materials.new("RainMat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get("Principled BSDF")
if bsdf:
    bsdf.inputs['Roughness'].default_value = 0.0
    if 'Transmission Weight' in bsdf.inputs:
        bsdf.inputs['Transmission Weight'].default_value = 1.0
    elif 'Transmission' in bsdf.inputs:
        bsdf.inputs['Transmission'].default_value = 1.0
drop.data.materials.append(mat)

emitter.modifiers.new("Rain", type='PARTICLE_SYSTEM')
ps = emitter.particle_systems["Rain"]
ps.settings.count = 2000
ps.settings.frame_start = 1
ps.settings.frame_end = 120
ps.settings.lifetime = 50
ps.settings.render_type = 'OBJECT'
ps.settings.instance_object = drop
ps.settings.normal_factor = -15.0

# Check particle count at frame 10 before bake
scene.frame_set(10)
depsgraph = bpy.context.evaluated_depsgraph_get()
eval_emitter = emitter.evaluated_get(depsgraph)
eval_ps = eval_emitter.particle_systems[0]
print("BEFORE_BAKE_PARTICLES:", len(eval_ps.particles))

# Now bake point cache
override = bpy.context.copy()
override['point_cache'] = ps.point_cache
try:
    bpy.ops.ptcache.bake_all(bake=True)
    print("PTCACHE_BAKE_SUCCESS")
except Exception as e:
    print("PTCACHE_BAKE_ERROR:", e)

scene.frame_set(10)
depsgraph = bpy.context.evaluated_depsgraph_get()
eval_emitter = emitter.evaluated_get(depsgraph)
eval_ps = eval_emitter.particle_systems[0]
alive = sum(1 for p in eval_ps.particles if p.alive_state == 'ALIVE')
print("AFTER_BAKE_ALIVE_PARTICLES:", alive)
