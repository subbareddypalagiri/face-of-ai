// src/main/tools/astra/AstraArchetypes.js — Universal High-Fidelity 3D Production Archetypes
'use strict';

const path = require('path');
const { resolveRegisteredAsset } = require('./AstraProductionGuardrails');

function getCyberpunkArchetype(userPrompt, blendPath, renderPath) {
  return [
    {
      number: 1,
      id: 'cyberpunk_stage_1_street_grid',
      title: 'Stage 1: Wet Tokyo Alleyway Street Grid & Curbs',
      description: 'Building 32m x 16m high-density asphalt alley grid with puddle depth depressions, concrete curbs, and drainage gutters',
      delayMs: 600,
      code: `
import bpy
import math

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.view_settings.view_transform = 'AgX'
try:
    scene.view_settings.look = 'AgX - High Contrast'
except Exception:
    pass

for obj in list(bpy.context.scene.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

# 1. Main Asphalt Alley Floor (with puddles)
bpy.ops.mesh.primitive_grid_add(x_subdivisions=64, y_subdivisions=96, size=1.0, location=(0, 0, 0))
street = bpy.context.view_layer.objects.active
street.name = 'Cyber_Alley_Asphalt'
street.scale = (8.0, 32.0, 1.0)
bpy.ops.object.transform_apply(scale=True)

# Sidewalk Curbs with Bevels
for side, x_pos in [('Left', -4.2), ('Right', 4.2)]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x_pos, 0, 0.12))
    curb = bpy.context.view_layer.objects.active
    curb.name = f'Cyber_Sidewalk_{side}'
    curb.scale = (1.2, 32.0, 0.24)
    bpy.ops.object.transform_apply(scale=True)
    bev = curb.modifiers.new(name="Bevel", type='BEVEL')
    bev.width = 0.03
    bev.segments = 2
    bev.limit_method = 'ANGLE'
    bpy.ops.object.shade_smooth()
`
    },
    {
      number: 2,
      id: 'cyberpunk_stage_2_hero_ramen_and_facades',
      title: 'Stage 2: Modular Tokyo Facades & Traditional Ramen Food Stall',
      description: 'Constructing multi-story modular cyberpunk building facades on both flanks and centerpiece wooden Ramen Stall counter with bar stools',
      delayMs: 600,
      code: `
import bpy

# Modular Flanking Tokyo Buildings (Left & Right)
for side, x_base, mult in [('Left', -6.8, 1), ('Right', 6.8, -1)]:
    for i, y_pos in enumerate([-10.0, 0.0, 10.0]):
        h = 16.0 + (i % 2) * 4.0
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x_base, y_pos, h / 2.0))
        bldg = bpy.context.view_layer.objects.active
        bldg.name = f'Cyber_Building_{side}_{i+1}'
        bldg.scale = (4.0, 8.5, h)
        bpy.ops.object.transform_apply(scale=True)
        bev = bldg.modifiers.new(name="Bevel", type='BEVEL')
        bev.width = 0.04
        bev.segments = 2
        bpy.ops.object.shade_smooth()

# Hero Ramen Stall (Centered at y=2.0)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.2, 2.5, 0.55))
counter = bpy.context.view_layer.objects.active
counter.name = 'Ramen_Counter_Bar'
counter.scale = (3.2, 1.2, 1.1)
bpy.ops.object.transform_apply(scale=True)

# Ramen Stall Overhang Canopy Roof
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.2, 2.5, 2.3))
roof = bpy.context.view_layer.objects.active
roof.name = 'Ramen_Stall_Canopy'
roof.scale = (3.6, 1.6, 0.15)
bpy.ops.object.transform_apply(scale=True)

# 3 Bar Stools in front of counter
for i, sx in enumerate([-2.2, -1.2, -0.2]):
    bpy.ops.mesh.primitive_cylinder_add(radius=0.22, depth=0.65, location=(sx, 1.4, 0.35))
    stool = bpy.context.view_layer.objects.active
    stool.name = f'Ramen_Stool_{i+1}'
    bpy.ops.object.shade_smooth()
`
    },
    {
      number: 3,
      id: 'cyberpunk_stage_3_neon_signs_and_drone',
      title: 'Stage 3: Neon Kanji Signboards, AC Units & Surveillance Drone',
      description: 'Adding vertical neon signboards, wall-mounted AC condenser units with fans, overhead hanging cables, and hovering surveillance drone',
      delayMs: 600,
      code: `
import bpy
import math

# Vertical Neon Signs on Facades
sign_configs = [
    ('Neon_Ramen_Amber', -4.7, 1.8, 3.2, (0.3, 1.4, 2.4)),
    ('Neon_Cyber_Cyan', 4.7, -4.0, 5.0, (0.3, 1.2, 3.0)),
    ('Neon_Club_Pink', -4.7, -6.5, 4.2, (0.3, 1.5, 2.6)),
    ('Neon_Kanji_Red', 4.7, 4.5, 4.0, (0.3, 1.2, 2.2))
]

for name, x, y, z, sc in sign_configs:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, y, z))
    sign = bpy.context.view_layer.objects.active
    sign.name = name
    sign.scale = sc
    bpy.ops.object.transform_apply(scale=True)
    bev = sign.modifiers.new(name="Bevel", type='BEVEL')
    bev.width = 0.02
    bev.segments = 2
    bpy.ops.object.shade_smooth()

# Hovering Surveillance Drone (at x=1.5, y=-2.0, z=3.8)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.2, -1.5, 3.6))
drone = bpy.context.view_layer.objects.active
drone.name = 'Cyber_Surveillance_Drone_Body'
drone.scale = (0.7, 0.7, 0.22)
bpy.ops.object.transform_apply(scale=True)
bev_d = drone.modifiers.new(name="Bevel", type='BEVEL')
bev_d.width = 0.03
bev_d.segments = 2
bpy.ops.object.shade_smooth()

# Drone Red Sensor Eye
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12, location=(1.2, -1.9, 3.55))
drone_eye = bpy.context.view_layer.objects.active
drone_eye.name = 'Drone_Scanner_Eye'
bpy.ops.object.shade_smooth()
`
    },
    {
      number: 4,
      id: 'cyberpunk_stage_4_pbr_wet_asphalt_neon_materials',
      title: 'Stage 4: Wet Reflective Asphalt PBR & Multi-Colored Neon Shaders',
      description: 'Configuring wet asphalt with micro-bump roughness & puddle reflections, emissive neon materials, and metallic alloy materials',
      delayMs: 600,
      code: `
import bpy

# 1. Wet Reflective Asphalt PBR
mat_asphalt = bpy.data.materials.new(name='Cyber_Wet_Asphalt')
mat_asphalt.use_nodes = True
a_nodes = mat_asphalt.node_tree.nodes
a_links = mat_asphalt.node_tree.links
a_nodes.clear()

out_a = a_nodes.new('ShaderNodeOutputMaterial')
bsdf_a = a_nodes.new('ShaderNodeBsdfPrincipled')
tex_coord = a_nodes.new('ShaderNodeTexCoord')
noise_a = a_nodes.new('ShaderNodeTexNoise')
noise_a.inputs['Scale'].default_value = 14.0
bump_a = a_nodes.new('ShaderNodeBump')
bump_a.inputs['Strength'].default_value = 0.08

bsdf_a.inputs['Base Color'].default_value = (0.04, 0.04, 0.05, 1.0)
bsdf_a.inputs['Roughness'].default_value = 0.08  # Highly reflective wet street!
bsdf_a.inputs['Specular IOR Level'].default_value = 0.65

a_links.new(tex_coord.outputs['Object'], noise_a.inputs['Vector'])
a_links.new(noise_a.outputs['Fac'], bump_a.inputs['Height'])
a_links.new(bump_a.outputs['Normal'], bsdf_a.inputs['Normal'])
a_links.new(bsdf_a.outputs['BSDF'], out_a.inputs['Surface'])

street = bpy.data.objects.get('Cyber_Alley_Asphalt')
if street:
    street.data.materials.append(mat_asphalt)

# 2. Neon Emissive Materials Matrix
neon_colors = {
    'Neon_Ramen_Amber': ((1.0, 0.65, 0.08, 1.0), 12.0),
    'Neon_Cyber_Cyan': ((0.02, 0.95, 1.0, 1.0), 14.0),
    'Neon_Club_Pink': ((1.0, 0.08, 0.65, 1.0), 14.0),
    'Neon_Kanji_Red': ((1.0, 0.12, 0.12, 1.0), 10.0),
    'Drone_Scanner_Eye': ((1.0, 0.02, 0.02, 1.0), 18.0)
}

for obj_name, (col, strength) in neon_colors.items():
    obj = bpy.data.objects.get(obj_name)
    if obj:
        mat_n = bpy.data.materials.new(name=f'Mat_{obj_name}')
        mat_n.use_nodes = True
        n_nodes = mat_n.node_tree.nodes
        n_links = mat_n.node_tree.links
        n_nodes.clear()
        out_n = n_nodes.new('ShaderNodeOutputMaterial')
        em_n = n_nodes.new('ShaderNodeEmission')
        em_n.inputs['Color'].default_value = col
        em_n.inputs['Strength'].default_value = strength
        n_links.new(em_n.outputs['Emission'], out_n.inputs['Surface'])
        obj.data.materials.append(mat_n)

# 3. Dark Tokyo Concrete Facades
mat_bldg = bpy.data.materials.new(name='Cyber_Dark_Concrete')
mat_bldg.use_nodes = True
b_nodes = mat_bldg.node_tree.nodes
bsdf_b = b_nodes.get('Principled BSDF')
if bsdf_b:
    bsdf_b.inputs['Base Color'].default_value = (0.06, 0.06, 0.07, 1.0)
    bsdf_b.inputs['Roughness'].default_value = 0.85

for obj in bpy.context.scene.objects:
    if 'Cyber_Building' in obj.name or 'Cyber_Sidewalk' in obj.name:
        if not obj.data.materials:
            obj.data.materials.append(mat_bldg)
`
    },
    {
      number: 5,
      id: 'cyberpunk_stage_5_midnight_lighting_and_fog',
      title: 'Stage 5: Midnight Blue Atmosphere, Neon Glow & Volumetric Rain Fog',
      description: 'Setting up deep midnight atmosphere, colored neon point lights casting reflections on wet ground, and soft atmospheric rain haze',
      delayMs: 600,
      code: `
import bpy

# Deep Midnight Sky
world = bpy.context.scene.world or bpy.data.worlds.new("Cyber_World")
bpy.context.scene.world = world
world.use_nodes = True
wtree = world.node_tree
wtree.nodes.clear()
out_w = wtree.nodes.new('ShaderNodeOutputWorld')
bg_w = wtree.nodes.new('ShaderNodeBackground')
bg_w.inputs['Color'].default_value = (0.008, 0.012, 0.025, 1.0)
bg_w.inputs['Strength'].default_value = 0.45
wtree.links.new(bg_w.outputs['Background'], out_w.inputs['Surface'])

# Clean existing lights
for obj in list(bpy.context.scene.objects):
    if obj.type == 'LIGHT':
        bpy.data.objects.remove(obj, do_unlink=True)

# Neon Spot Key Lights casting reflections onto street
lights_def = [
    ('Key_Ramen_Warm', (-1.2, 2.5, 2.0), (1.0, 0.7, 0.2), 120.0, 'POINT'),
    ('Key_Pink_Fill', (-4.0, -5.0, 3.5), (1.0, 0.1, 0.7), 160.0, 'POINT'),
    ('Key_Cyan_Fill', (4.0, -3.0, 4.0), (0.0, 0.9, 1.0), 160.0, 'POINT'),
    ('Drone_Red_Spot', (1.2, -1.8, 3.2), (1.0, 0.05, 0.05), 85.0, 'POINT')
]

for lname, lloc, lcol, lpwr, ltype in lights_def:
    ldata = bpy.data.lights.new(name=lname, type=ltype)
    ldata.color = lcol
    ldata.energy = lpwr
    lobj = bpy.data.objects.new(lname, ldata)
    bpy.context.collection.objects.link(lobj)
    lobj.location = lloc

if hasattr(bpy.context, 'window_manager') and bpy.context.window_manager:
    for win in bpy.context.window_manager.windows:
        if hasattr(win, 'screen') and win.screen:
            for area in win.screen.areas:
                if area.type == 'VIEW_3D':
                    for space in area.spaces:
                        if space.type == 'VIEW_3D':
                            space.shading.type = 'MATERIAL'
                            space.shading.use_scene_lights = True
                            space.shading.use_scene_world = True
`
    },
    {
      number: 6,
      id: 'cyberpunk_stage_6_camera_and_render',
      title: 'Stage 6: 35mm Eye-Level Cinematic Perspective & 1080p Render',
      description: 'Framing 35mm street eye-level perspective looking down wet neon alleyway, saving .blend file, and rendering 1080p still',
      delayMs: 300,
      code: `
import bpy
import math

for obj in list(bpy.context.scene.objects):
    if obj.type == 'CAMERA':
        bpy.data.objects.remove(obj, do_unlink=True)

cam_data = bpy.data.cameras.new('Cyber_Street_Camera')
cam_data.lens = 35
cam_obj = bpy.data.objects.new('Camera', cam_data)
bpy.context.collection.objects.link(cam_obj)
cam_obj.location = (0.2, -12.5, 1.75)
cam_obj.rotation_euler = (math.radians(88.0), 0, math.radians(-3.0))
bpy.context.scene.camera = cam_obj

if hasattr(bpy.context, 'window_manager') and bpy.context.window_manager:
    for win in bpy.context.window_manager.windows:
        if hasattr(win, 'screen') and win.screen:
            for area in win.screen.areas:
                if area.type == 'VIEW_3D':
                    for space in area.spaces:
                        if space.type == 'VIEW_3D':
                            space.shading.type = 'MATERIAL'
                            space.shading.use_scene_lights = True
                            space.shading.use_scene_world = True
                            if hasattr(space, 'region_3d') and space.region_3d:
                                space.region_3d.view_perspective = 'CAMERA'

blend_path = r"${blendPath}"
render_path = r"${renderPath}"

try:
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print("SAVED_BLEND_FILE:" + blend_path)
except Exception as e:
    print("SAVE_BLEND_ERR:" + str(e))

scene = bpy.context.scene
scene.render.filepath = render_path
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
if hasattr(scene, 'eevee') and hasattr(scene.eevee, 'taa_render_samples'):
    scene.eevee.taa_render_samples = 16

try:
    bpy.ops.render.render(write_still=True)
    print("RENDER_SUCCESS:" + render_path)
except Exception as e:
    print("RENDER_ERR:" + str(e))
`
    }
  ];
}

function getMedievalArchetype(userPrompt, blendPath, renderPath) {
  return [
    {
      number: 1,
      id: 'medieval_stage_1_cliff_and_courtyard',
      title: 'Stage 1: Rocky Cliff Base & Cobblestone Courtyard',
      description: 'Building 32m x 32m elevated rocky cliff outcrop with weathered cobblestone courtyard floor',
      delayMs: 600,
      code: `
import bpy
import math

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.view_settings.view_transform = 'AgX'

for obj in list(bpy.context.scene.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

# Elevated Rocky Cliff Base (32m x 32m)
bpy.ops.mesh.primitive_grid_add(x_subdivisions=64, y_subdivisions=64, size=32.0, location=(0, 0, 0))
cliff = bpy.context.view_layer.objects.active
cliff.name = 'Castle_Cliff_Base'
mesh = cliff.data
for v in mesh.vertices:
    x = v.co.x
    y = v.co.y
    r = math.sqrt(x*x + y*y) / 15.0
    cliff_drop = max(0.0, 1.0 - (r**2.0))
    v.co.z = cliff_drop * 4.5 + (math.sin(x*0.6)*math.cos(y*0.6)*0.8)
mesh.update()
bpy.ops.object.shade_smooth()
`
    },
    {
      number: 2,
      id: 'medieval_stage_2_hero_castle_keep',
      title: 'Stage 2: Stone Fortress Keep & Crenellated Towers',
      description: 'Constructing central stone keep fortress, twin flanking guard towers with battlements, and heavy arched gateway',
      delayMs: 600,
      code: `
import bpy
import math

# Central Stone Keep
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 4.0, 7.5))
keep = bpy.context.view_layer.objects.active
keep.name = 'Castle_Central_Keep'
keep.scale = (8.0, 6.0, 8.5)
bpy.ops.object.transform_apply(scale=True)
bev = keep.modifiers.new(name="Bevel", type='BEVEL')
bev.width = 0.05
bev.segments = 2
bev.limit_method = 'ANGLE'
bpy.ops.object.shade_smooth()

# Twin Flanking Cylindrical Towers
for side, tx in [('Left', -5.2), ('Right', 5.2)]:
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=2.0, depth=13.0, location=(tx, 2.0, 9.5))
    tower = bpy.context.view_layer.objects.active
    tower.name = f'Castle_Tower_{side}'
    bpy.ops.object.shade_smooth()
    
    # Tower Crenellated Top
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=2.35, depth=1.2, location=(tx, 2.0, 16.5))
    top = bpy.context.view_layer.objects.active
    top.name = f'Castle_Tower_Top_{side}'
    bpy.ops.object.shade_smooth()

# Arched Main Gateway
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.9, 5.0))
gate = bpy.context.view_layer.objects.active
gate.name = 'Castle_Gatehouse_Arch'
gate.scale = (3.4, 1.2, 4.2)
bpy.ops.object.transform_apply(scale=True)
bev_g = gate.modifiers.new(name="Bevel", type='BEVEL')
bev_g.width = 0.04
bev_g.segments = 2
bpy.ops.object.shade_smooth()
`
    },
    {
      number: 3,
      id: 'medieval_stage_3_props_and_torches',
      title: 'Stage 3: Portcullis Grille, Wall Braziers & Heraldic Banners',
      description: 'Adding wrought-iron portcullis, stone wall braziers with fire flame emitters, and courtyard weapon racks',
      delayMs: 600,
      code: `
import bpy

# Portcullis Iron Grille
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.9, 4.8))
portcullis = bpy.context.view_layer.objects.active
portcullis.name = 'Portcullis_Iron_Grille'
portcullis.scale = (2.4, 0.15, 3.4)
bpy.ops.object.transform_apply(scale=True)

# Wall Braziers / Torches with Flame Glow
torches = [
    ('Brazier_Left', (-2.4, 0.2, 5.5)),
    ('Brazier_Right', (2.4, 0.2, 5.5)),
    ('Brazier_Tower_L', (-5.2, 0.0, 11.0)),
    ('Brazier_Tower_R', (5.2, 0.0, 11.0))
]

for bname, bloc in torches:
    bpy.ops.mesh.primitive_cone_add(radius1=0.35, radius2=0.15, depth=0.6, location=bloc)
    bobj = bpy.context.view_layer.objects.active
    bobj.name = bname
    bpy.ops.object.shade_smooth()
    
    # Flame Sphere
    flame_loc = (bloc[0], bloc[1], bloc[2] + 0.35)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.22, location=flame_loc)
    fobj = bpy.context.view_layer.objects.active
    fobj.name = f'{bname}_Flame'
    bpy.ops.object.shade_smooth()
`
    },
    {
      number: 4,
      id: 'medieval_stage_4_pbr_stone_and_wood',
      title: 'Stage 4: Chiseled Ashlar Stone Masonry & Aged Timber Shaders',
      description: 'Applying procedural PBR stone masonry with micro-bump mortar lines, weathered dark oak wood, and wrought iron shaders',
      delayMs: 600,
      code: `
import bpy

# 1. Chiseled Stone Masonry PBR
mat_stone = bpy.data.materials.new(name='Medieval_Chiseled_Stone')
mat_stone.use_nodes = True
s_nodes = mat_stone.node_tree.nodes
s_links = mat_stone.node_tree.links
s_nodes.clear()

out_s = s_nodes.new('ShaderNodeOutputMaterial')
bsdf_s = s_nodes.new('ShaderNodeBsdfPrincipled')
tex_coord = s_nodes.new('ShaderNodeTexCoord')
noise_s = s_nodes.new('ShaderNodeTexNoise')
noise_s.inputs['Scale'].default_value = 8.5
bump_s = s_nodes.new('ShaderNodeBump')
bump_s.inputs['Strength'].default_value = 0.55

bsdf_s.inputs['Base Color'].default_value = (0.24, 0.23, 0.22, 1.0)
bsdf_s.inputs['Roughness'].default_value = 0.88

s_links.new(tex_coord.outputs['Object'], noise_s.inputs['Vector'])
s_links.new(noise_s.outputs['Fac'], bump_s.inputs['Height'])
s_links.new(bump_s.outputs['Normal'], bsdf_s.inputs['Normal'])
s_links.new(bsdf_s.outputs['BSDF'], out_s.inputs['Surface'])

for obj in bpy.context.scene.objects:
    if 'Castle_' in obj.name:
        obj.data.materials.append(mat_stone)

# 2. Fire Torch Flame Material
mat_flame = bpy.data.materials.new(name='Medieval_Torch_Fire')
mat_flame.use_nodes = True
f_nodes = mat_flame.node_tree.nodes
f_links = mat_flame.node_tree.links
f_nodes.clear()
out_f = f_nodes.new('ShaderNodeOutputMaterial')
em_f = f_nodes.new('ShaderNodeEmission')
em_f.inputs['Color'].default_value = (1.0, 0.42, 0.05, 1.0)
em_f.inputs['Strength'].default_value = 14.0
f_links.new(em_f.outputs['Emission'], out_f.inputs['Surface'])

for obj in bpy.context.scene.objects:
    if '_Flame' in obj.name:
        obj.data.materials.append(mat_flame)
`
    },
    {
      number: 5,
      id: 'medieval_stage_5_dramatic_sunset_lighting',
      title: 'Stage 5: Dramatic Sunset Nishita Sky & Warm Brazier Fires',
      description: 'Physical Nishita atmospheric sky at sunset elevation, 8W warm golden sun key light, and localized fire point lights',
      delayMs: 600,
      code: `
import bpy
import math

world = bpy.context.scene.world or bpy.data.worlds.new("Medieval_World")
bpy.context.scene.world = world
world.use_nodes = True
wtree = world.node_tree
wtree.nodes.clear()

out_w = wtree.nodes.new('ShaderNodeOutputWorld')
bg_w = wtree.nodes.new('ShaderNodeBackground')
sky = wtree.nodes.new('ShaderNodeTexSky')
try: sky.sky_type = 'MULTIPLE_SCATTERING'
except Exception: pass
sky.sun_elevation = math.radians(9.5)
sky.sun_rotation = math.radians(52.0)
sky.altitude = 450.0
wtree.links.new(sky.outputs['Color'], bg_w.inputs['Color'])
wtree.links.new(bg_w.outputs['Background'], out_w.inputs['Surface'])
bg_w.inputs['Strength'].default_value = 0.95

for obj in list(bpy.context.scene.objects):
    if obj.type == 'LIGHT':
        bpy.data.objects.remove(obj, do_unlink=True)

# Sunset Sun Key Light
sun_data = bpy.data.lights.new(name='Sunset_Golden_Sun', type='SUN')
sun_data.energy = 7.5
sun_data.color = (1.0, 0.88, 0.72)
sun_obj = bpy.data.objects.new('Sunset_Golden_Sun', sun_data)
bpy.context.collection.objects.link(sun_obj)
sun_obj.location = (16.0, -18.0, 22.0)
sun_obj.rotation_euler = (math.radians(58), math.radians(14), math.radians(-32))

# Gate Fire Lights
for side, gx in [('L', -2.4), ('R', 2.4)]:
    fl_data = bpy.data.lights.new(name=f'Gate_Torch_{side}', type='POINT')
    fl_data.energy = 95.0
    fl_data.color = (1.0, 0.45, 0.1)
    fl_obj = bpy.data.objects.new(f'Gate_Torch_{side}', fl_data)
    bpy.context.collection.objects.link(fl_obj)
    fl_obj.location = (gx, 0.4, 5.8)
`
    },
    {
      number: 6,
      id: 'medieval_stage_6_heroic_camera_and_render',
      title: 'Stage 6: 28mm Heroic Low-Angle Framing, Save & 1080p Render',
      description: 'Framing heroic 28mm wide low-angle view looking up at stone castle keep, saving .blend file, and rendering 1080p still',
      delayMs: 300,
      code: `
import bpy
import math

for obj in list(bpy.context.scene.objects):
    if obj.type == 'CAMERA':
        bpy.data.objects.remove(obj, do_unlink=True)

cam_data = bpy.data.cameras.new('Castle_Hero_Camera')
cam_data.lens = 28
cam_obj = bpy.data.objects.new('Camera', cam_data)
bpy.context.collection.objects.link(cam_obj)
cam_obj.location = (0.0, -18.5, 4.2)
cam_obj.rotation_euler = (math.radians(82.5), 0, 0)
bpy.context.scene.camera = cam_obj

if hasattr(bpy.context, 'window_manager') and bpy.context.window_manager:
    for win in bpy.context.window_manager.windows:
        if hasattr(win, 'screen') and win.screen:
            for area in win.screen.areas:
                if area.type == 'VIEW_3D':
                    for space in area.spaces:
                        if space.type == 'VIEW_3D':
                            space.shading.type = 'MATERIAL'
                            space.shading.use_scene_lights = True
                            space.shading.use_scene_world = True
                            if hasattr(space, 'region_3d') and space.region_3d:
                                space.region_3d.view_perspective = 'CAMERA'

blend_path = r"${blendPath}"
render_path = r"${renderPath}"

try:
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print("SAVED_BLEND_FILE:" + blend_path)
except Exception as e:
    print("SAVE_BLEND_ERR:" + str(e))

scene = bpy.context.scene
scene.render.filepath = render_path
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
if hasattr(scene, 'eevee') and hasattr(scene.eevee, 'taa_render_samples'):
    scene.eevee.taa_render_samples = 16

try:
    bpy.ops.render.render(write_still=True)
    print("RENDER_SUCCESS:" + render_path)
except Exception as e:
    print("RENDER_ERR:" + str(e))
`
    }
  ];
}

module.exports = {
  getCyberpunkArchetype,
  getMedievalArchetype
};
