const { sendBridgeRPC } = require('../src/main/tools/blenderAstraEngine');

async function restore() {
  const code = `
import bpy

# Reset emission strength on all non-glow materials
for mat in bpy.data.materials:
    if mat.use_nodes and mat.node_tree:
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            m_low = mat.name.lower()
            if 'skin' in m_low or 'hair' in m_low or 'eye' in m_low or 'suit' in m_low or 'tie' in m_low:
                if 'Emission Strength' in bsdf.inputs:
                    bsdf.inputs['Emission Strength'].default_value = 0.0
                if 'Emission Color' in bsdf.inputs:
                    bsdf.inputs['Emission Color'].default_value = (0.0, 0.0, 0.0, 1.0)
            
            if 'skin' in m_low:
                if "Subsurface Weight" in bsdf.inputs:
                    bsdf.inputs["Subsurface Weight"].default_value = 0.24
                if "Subsurface Radius" in bsdf.inputs:
                    bsdf.inputs["Subsurface Radius"].default_value = (1.0, 0.22, 0.12)
                if "Roughness" in bsdf.inputs:
                    bsdf.inputs["Roughness"].default_value = 0.42
                if "Base Color" in bsdf.inputs:
                    bsdf.inputs["Base Color"].default_value = (0.85, 0.65, 0.52, 1.0)

# Return to Idle Neutral
arm = bpy.data.objects.get("CharacterArmature")
idle = bpy.data.actions.get("CharacterArmature|Idle_Neutral")
if arm and idle:
    arm.animation_data.action = idle
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = 250
    bpy.ops.screen.animation_play()

bpy.context.scene.frame_set(1)
bpy.context.scene.render.filepath = "C:/Users/subba/Desktop/Blender_Avatar_Restored.png"
bpy.ops.render.render(write_still=True)
`;
  const res = await sendBridgeRPC('execute_bpy', { code, autoCapture: false });
  console.log("Restore Result:", res.success);
}

restore().catch(console.error);
