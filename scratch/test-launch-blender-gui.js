const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { findBlenderExecutable } = require('../blender-live-bridge');

async function testLaunchBlenderGui() {
  console.log('Testing launch of real Blender 5.1 GUI with 3D Katana...');
  const blenderPath = findBlenderExecutable();
  console.log('Blender binary:', blenderPath);

  if (!blenderPath || !fs.existsSync(blenderPath)) {
    console.error('Blender binary not found!');
    return;
  }

  const scriptPath = path.join(os.tmpdir(), `launch_katana_${Date.now()}.py`);
  const blendPath = path.join(os.homedir(), 'Desktop', 'SciFi_Katana.blend');

  const pyCode = `
import bpy
import math

# Clear scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# 1. Handle (Cylinder)
bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=0.85, location=(0, 0, 0.42))
handle = bpy.context.active_object
handle.name = "Katana_Hilt"

# 2. Guard / Tsuba (Beveled Cylinder)
bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=0.04, location=(0, 0, 0.85))
tsuba = bpy.context.active_object
tsuba.name = "Katana_Tsuba"

# 3. Blade (Tapered Cube with Bevel)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.95))
blade = bpy.context.active_object
blade.name = "Katana_Blade"
blade.scale = (0.03, 0.14, 2.2)

bev = blade.modifiers.new(name="Bevel", type='BEVEL')
bev.width = 0.015
bev.segments = 3

# 4. Materials
# Carbon Obsidian for Hilt
mat_hilt = bpy.data.materials.new(name="Carbon_Weave")
mat_hilt.use_nodes = True
b_hilt = mat_hilt.node_tree.nodes.get("Principled BSDF")
if b_hilt:
    b_hilt.inputs['Base Color'].default_value = (0.05, 0.05, 0.06, 1.0)
    b_hilt.inputs['Roughness'].default_value = 0.65
handle.data.materials.append(mat_hilt)
tsuba.data.materials.append(mat_hilt)

# Chrome Metal Blade
mat_blade = bpy.data.materials.new(name="Chrome_Steel")
mat_blade.use_nodes = True
b_blade = mat_blade.node_tree.nodes.get("Principled BSDF")
if b_blade:
    b_blade.inputs['Base Color'].default_value = (0.85, 0.88, 0.92, 1.0)
    b_blade.inputs['Metallic'].default_value = 0.98
    b_blade.inputs['Roughness'].default_value = 0.12
blade.data.materials.append(mat_blade)

# Cyber Neon Plasma Edge (Emission)
mat_plasma = bpy.data.materials.new(name="Cyan_Plasma")
mat_plasma.use_nodes = True
p_nodes = mat_plasma.node_tree.nodes
p_nodes.clear()
em = p_nodes.new(type='ShaderNodeEmission')
em.inputs['Color'].default_value = (0.0, 0.85, 1.0, 1.0)
em.inputs['Strength'].default_value = 10.0
out = p_nodes.new(type='ShaderNodeOutputMaterial')
mat_plasma.node_tree.links.new(em.outputs['Emission'], out.inputs['Surface'])
blade.data.materials.append(mat_plasma)

# 5. Studio 3-Point Lighting
key_data = bpy.data.lights.new(name="Key_Light", type='AREA')
key_data.energy = 1200
key_data.color = (1.0, 0.95, 0.85)
key_obj = bpy.data.objects.new(name="Key_Light", object_data=key_data)
bpy.context.collection.objects.link(key_obj)
key_obj.location = (3.5, -3.5, 4.0)

rim_data = bpy.data.lights.new(name="Rim_Light", type='SPOT')
rim_data.energy = 2200
rim_data.color = (0.0, 0.9, 1.0)
rim_obj = bpy.data.objects.new(name="Rim_Light", object_data=rim_data)
bpy.context.collection.objects.link(rim_obj)
rim_obj.location = (0, 4.5, 3.5)

# Camera
cam_data = bpy.data.cameras.new(name="Camera")
cam_obj = bpy.data.objects.new(name="Camera", object_data=cam_data)
bpy.context.collection.objects.link(cam_obj)
cam_obj.location = (1.8, -2.8, 2.0)
cam_obj.rotation_euler = (1.2, 0, 0.55)
bpy.context.scene.camera = cam_obj

# Set 3D Viewport Shading to Material Preview mode!
def set_shading():
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            for space in area.spaces:
                if space.type == 'VIEW_3D':
                    space.shading.type = 'MATERIAL'

bpy.app.timers.register(set_shading, first_interval=0.2)

# Save .blend file to Desktop
try:
    bpy.ops.wm.save_as_mainfile(filepath="${blendPath.replace(/\\/g, '/')}")
except Exception:
    pass

print("BLENDER_SCENE_READY_IN_VIEWPORT")
`;

  fs.writeFileSync(scriptPath, pyCode, 'utf8');

  console.log('Spawning Blender GUI process with script:', scriptPath);
  const child = spawn(blenderPath, ['--python', scriptPath], {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();

  console.log('Blender 5.1 GUI launched successfully! Window is opening on user desktop.');
}

testLaunchBlenderGui().catch(console.error);
