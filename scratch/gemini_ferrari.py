import bpy
import math

# Clear existing objects
for obj in list(bpy.context.scene.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

# Set render engine to EEVEE
bpy.context.scene.render.engine = 'BLENDER_EEVEE'
bpy.context.scene.eevee.use_gtao = True
bpy.context.scene.eevee.use_ssr = True
bpy.context.scene.eevee.use_ssr_refraction = True
bpy.context.scene.eevee.use_shadows = True
bpy.context.scene.eevee.shadow_cube_size = '1024'
bpy.context.scene.eevee.shadow_cascade_size = '1024'

# --- Create Materials ---
def get_bsdf(mat):
    if not mat.use_nodes: mat.use_nodes = True
    b = mat.node_tree.nodes.get('Principled BSDF')
    if not b:
        for n in mat.node_tree.nodes:
            if n.type == 'BSDF_PRINCIPLED': return n
        b = mat.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
    return b

def create_material(name, color=(0.8, 0.8, 0.8, 1.0), metallic=0.0, roughness=0.5):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = get_bsdf(mat)
    if 'Base Color' in bsdf.inputs: bsdf.inputs['Base Color'].default_value = color
    if 'Metallic' in bsdf.inputs: bsdf.inputs['Metallic'].default_value = metallic
    if 'Roughness' in bsdf.inputs: bsdf.inputs['Roughness'].default_value = roughness
    return mat

red_paint = create_material("RedPaint", color=(0.8, 0.05, 0.05, 1.0), roughness=0.2)
black_rubber = create_material("BlackRubber", color=(0.02, 0.02, 0.02, 1.0), roughness=0.8)
track_asphalt = create_material("TrackAsphalt", color=(0.1, 0.1, 0.1, 1.0), roughness=0.9)
puddle_water = create_material("PuddleWater", color=(0.1, 0.15, 0.2, 1.0), roughness=0.1)
smoke_material = create_material("Smoke", color=(0.1, 0.1, 0.1, 0.5), roughness=0.9)

# --- Create Track ---
bpy.ops.mesh.primitive_plane_add(size=50, location=(0, 0, 0))
track = bpy.context.object
track.name = "RacingTrack"
track.data.materials.append(track_asphalt)

# Add some undulation to the track for realism
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.subdivide(number_cuts=10)
bpy.ops.mesh.subdivide(number_cuts=5)
bpy.ops.mesh.randomize_transform(
    location=(0, 0, 0),
    rotation=(0, 0, 0),
    scale=(0.05, 0.05, 0.05),
    use_nodes=False,
    seed=0,
    use_even_distribution=False,
    use_uniform_scale=False,
    use_random_scale=False,
    use_random_rotation=False,
    use_random_location=True,
    use_random_scale_xyz=False,
    use_random_rotation_xyz=False,
    use_random_location_xyz=True
)
bpy.ops.object.mode_set(mode='OBJECT')

# Create puddles
for i in range(15):
    x = (bpy.context.scene.objects["RacingTrack"].dimensions.x / 2) * (0.8 - 1.6 * bpy.types.Scene.random_float())
    y = (bpy.context.scene.objects["RacingTrack"].dimensions.y / 2) * (0.8 - 1.6 * bpy.types.Scene.random_float())
    size = 1.5 + 3.0 * bpy.types.Scene.random_float()
    bpy.ops.mesh.primitive_plane_add(size=size, location=(x, y, 0.01))
    puddle = bpy.context.object
    puddle.name = f"Puddle_{i}"
    puddle.data.materials.append(puddle_water)
    # Make puddles slightly lower than the track
    puddle.location.z = -0.005

# --- Create Ferrari SF90 (Simplified Model) ---
# This is a placeholder for a complex model. We'll create a basic shape.
# For a real SF90, you'd import an .obj or .fbx file.

# Body
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 1.5))
sf90_body = bpy.context.object
sf90_body.name = "SF90_Body"
sf90_body.scale = (3.0, 1.2, 0.8)
sf90_body.data.materials.append(red_paint)

# Add some basic shaping
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.subdivide(number_cuts=2)
bpy.ops.mesh.extrude_region_move(
    MESH_OT_extrude_region={"use_normal_flip":False, "use_dissolve_ortho_edges":False, "mirror":False},
    TRANSFORM_OT_translate={"value":(0, -1.5, 0), "constraint_axis":(False, True, False), "mirror":False, "use_proportional_edit":True, "proportional_edit_falloff":'SMOOTH', "proportional_size":1, "use_proportional_projected":False, "snap":False, "snap_target":'CLOSEST', "snap_point":(0, 0, 0), "snap_align":False, "snap_normal":(0, 0, 0), "gpencil_metadata":None, "cursor_transform":False, "texture_space":False, "remove_on_cancel":False, "view_align":False, "object_align":False, "relative_offset":0, "global_offset":0, "use_db_snap":False, "db_snap_point":(0, 0, 0), "db_snap_normal":(0, 0, 0)}
)
bpy.ops.mesh.select_all(action='DESELECT')
bpy.ops.object.mode_set(mode='OBJECT')

# Wheels (Simplified)
wheel_radius = 0.35
wheel_width = 0.25
wheel_positions = [
    (2.0, 1.0, wheel_radius),
    (2.0, -1.0, wheel_radius),
    (-2.0, 1.0, wheel_radius),
    (-2.0, -1.0, wheel_radius)
]

for i, pos in enumerate(wheel_positions):
    bpy.ops.mesh.primitive_cylinder_add(
        radius=wheel_radius,
        depth=wheel_width,
        location=pos,
        rotation=(math.radians(90), 0, 0)
    )
    wheel = bpy.context.object
    wheel.name = f"SF90_Wheel_{i}"
    wheel.data.materials.append(black_rubber)
    # Add inner rim detail
    bpy.ops.mesh.primitive_cylinder_add(
        radius=wheel_radius * 0.6,
        depth=wheel_width * 1.1,
        location=pos,
        rotation=(math.radians(90), 0, 0)
    )
    rim = bpy.context.object
    rim.name = f"SF90_Rim_{i}"
    rim_mat = create_material("RimMetal", color=(0.7, 0.7, 0.7, 1.0), metallic=1.0, roughness=0.3)
    rim.data.materials.append(rim_mat)

# --- Tire Smoke (Particle System) ---
# Create a small plane for smoke emission
bpy.ops.mesh.primitive_plane_add(size=0.1, location=(0, 0, 0.5))
smoke_emitter = bpy.context.object
smoke_emitter.name = "SmokeEmitter"
smoke_emitter.hide_render = True # Hide the emitter itself
smoke_emitter.hide_viewport = True

# Add particle system
bpy.ops.object.particle_system_add()
psys = smoke_emitter.particle_systems[-1]
psys.settings.type = 'EMITTER'
psys.settings.count = 5000
psys.settings.frame_start = 1
psys.settings.frame_end = 60
psys.settings.lifetime = 120
psys.settings.lifetime_random = 0.5
psys.settings.emit_from = 'VOLUME'
psys.settings.distribution = 'RAND'
psys.settings.normal_factor = 0.0
psys.settings.object_align_factor = 0.0
psys.settings.phase_factor = 0.0
psys.settings.size = 0.5
psys.settings.size_random = 0.8
psys.settings.scale_random = 0.5
psys.settings.speed_factor = 0.1
psys.settings.random_factor = 0.5
psys.settings.use_modifier_stack = True
psys.settings.use_emit_random = True
psys.settings.render_type = 'OBJECT'
psys.settings.instance_object = bpy.data.objects["SmokeParticle"] # Placeholder, will create this

# Create a simple smoke particle object
bpy.ops.mesh.primitive_ico_sphere_add(radius=0.1, subdivisions=1, location=(0,0,0))
smoke_particle = bpy.context.object
smoke_particle.name = "SmokeParticle"
smoke_particle.data.materials.append(smoke_material)
smoke_particle.hide_render = True
smoke_particle.hide_viewport = True

# Assign the smoke particle to the particle system
psys.settings.instance_object = smoke_particle

# Configure particle physics for smoke
psys.settings.physics_type = 'NEWTON'
psys.settings.use_gravity = False
psys.settings. Brownian_factor = 0.2
psys.settings.damping = 0.1

# --- Lighting ---
# Midnight scene, so dim ambient light, maybe a moon or distant stadium lights
bpy.context.scene.world.use_nodes = True
world_nodes = bpy.context.scene.world.node_tree.nodes
bg_node = world_nodes.get("Background")
if bg_node:
    bg_node.inputs["Color"].default_value = (0.01, 0.01, 0.02, 1.0) # Very dark blue
    bg_node.inputs["Strength"].default_value = 0.5

# Add a subtle directional light for highlights
bpy.ops.object.light_add(type='SUN', location=(50, -50, 50))
sun_light = bpy.context.object
sun_light.data.energy = 0.1
sun_light.rotation_euler = (math.radians(45), math.radians(30), math.radians(-45))

# Add some point lights to simulate trackside lighting
for i in range(5):
    x = 20 * math.cos(i * 2 * math.pi / 5)
    y = 20 * math.sin(i * 2 * math.pi / 5)
    bpy.ops.object.light_add(type='POINT', location=(x, y, 10))
    track_light = bpy.context.object
    track_light.data.energy = 50
    track_light.data.color = (0.9, 0.8, 0.6)

# --- Camera ---
bpy.ops.object.camera_add(location=(0, -15, 5), rotation=(math.radians(80), 0, 0))
camera = bpy.context.object
camera.name = "Camera"
bpy.context.scene.camera = camera

# --- Animation (for smoke) ---
# Move the emitter to simulate the car moving and emitting smoke
for frame in range(1, 60):
    smoke_emitter.location.x = frame * 0.2
    smoke_emitter.location.y = math.sin(frame * 0.1) * 0.5
    smoke_emitter.location.z = 0.3

# --- Post-processing (for reflections) ---
# Enable Screen Space Reflections and Refraction in Eevee
bpy.context.scene.eevee.use_ssr = True
bpy.context.scene.eevee.use_ssr_refraction = True
bpy.context.scene.eevee.ssr_resolution = 'HIGH'
bpy.context.scene.eevee.ssr_bounce = 4

# Add a subtle volumetric fog for atmosphere
bpy.context.scene.world.node_tree.nodes.new('ShaderNodeVolumeScatter')
volume_scatter = bpy.context.scene.world.node_tree.nodes.get('Volume Scatter')
volume_scatter.inputs['Density'].default_value = 0.05
volume_scatter.inputs['Anisotropy'].default_value = 0.2
volume_scatter.inputs['Color'].default_value = (0.01, 0.01, 0.02, 1.0)

# Link volume scatter to world output
world_output = bpy.context.scene.world.node_tree.nodes.get('Output')
bpy.context.scene.world.node_tree.links.new(volume_scatter.outputs['Volume'], world_output.inputs['Volume'])

# Set render resolution and frame range
bpy.context.scene.render.resolution_x = 1920
bpy.context.scene.render.resolution_y = 1080
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end = 60

# Ensure the smoke particle object is created if it doesn't exist
if "SmokeParticle" not in bpy.data.objects:
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.1, subdivisions=1, location=(0,0,0))
    smoke_particle = bpy.context.object
    smoke_particle.name = "SmokeParticle"
    smoke_particle.data.materials.append(smoke_material)
    smoke_particle.hide_render = True
    smoke_particle.hide_viewport = True

# Assign the smoke particle to the particle system if it's not already assigned
if psys.settings.instance_object is None:
    psys.settings.instance_object = bpy.data.objects["SmokeParticle"]