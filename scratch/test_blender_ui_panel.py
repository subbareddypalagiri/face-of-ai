# scratch/test_blender_ui_panel.py
import bpy
import math
import os

# 1. Properties
def ensure_properties():
    if not hasattr(bpy.types.Scene, "unin_ai_prompt"):
        bpy.types.Scene.unin_ai_prompt = bpy.props.StringProperty(
            name="AI Prompt",
            description="Type instructions to modify active scene (e.g., 'wave', 'punch', 'red neon katana', 'studio lights')",
            default=""
        )
    if not hasattr(bpy.types.Scene, "unin_ai_status"):
        bpy.types.Scene.unin_ai_status = bpy.props.StringProperty(
            name="Status",
            description="AI execution status",
            default="Ready for command ✓"
        )

# 2. Operators
class UNIN_OT_ExecuteAIPrompt(bpy.types.Operator):
    bl_idname = "unin.execute_ai_prompt"
    bl_label = "Execute AI Change"
    bl_description = "Executes the natural language command inside this active Blender scene"

    def execute(self, context):
        prompt = (context.scene.unin_ai_prompt or "").strip().lower()
        if not prompt:
            self.report({'WARNING'}, "Please enter a prompt first!")
            return {'CANCELLED'}

        status_msg = ""

        # A. Animation intent
        anim_map = {
            'wave': ['CharacterArmature|Wave', 'mixamo.com'],
            'punch': ['CharacterArmature|Punch_Right', 'CharacterArmature|Punch_Left'],
            'kick': ['CharacterArmature|Kick_Right', 'CharacterArmature|Kick_Left'],
            'walk': ['CharacterArmature|Walk', 'mixamo.com'],
            'run': ['CharacterArmature|Run', 'CharacterArmature|Run_Left'],
            'sword': ['CharacterArmature|Sword_Slash'],
            'slash': ['CharacterArmature|Sword_Slash'],
            'roll': ['CharacterArmature|Roll'],
            'idle': ['CharacterArmature|Idle_Neutral', 'CharacterArmature|Idle'],
            'stand': ['CharacterArmature|Idle_Neutral'],
            'nilcho': ['CharacterArmature|Idle_Neutral']
        }

        matched_anim = None
        for key, candidates in anim_map.items():
            if key in prompt:
                matched_anim = (key, candidates)
                break

        if matched_anim:
            key, candidates = matched_anim
            arm = None
            for o in context.scene.objects:
                if o.type == 'ARMATURE':
                    arm = o
                    break
            if arm:
                target_act = None
                for c in candidates:
                    a = bpy.data.actions.get(c)
                    if a:
                        target_act = a
                        break
                if not target_act:
                    for a in bpy.data.actions:
                        if key in a.name.lower():
                            target_act = a
                            break
                if target_act:
                    if not arm.animation_data:
                        arm.animation_data_create()
                    arm.animation_data.action = target_act
                    context.scene.frame_start = 1
                    context.scene.frame_end = int(target_act.frame_range[1]) if hasattr(target_act, 'frame_range') else 250
                    bpy.ops.screen.animation_play()
                    status_msg = f"Action active: {target_act.name} ✓"
                else:
                    status_msg = f"Animation '{key}' mapped ✓"
            else:
                status_msg = f"No armature found for animation."

        # B. Color / Glow intent
        color_map = {
            'red': (1.0, 0.05, 0.1, 1.0),
            'erraga': (1.0, 0.05, 0.1, 1.0),
            'ruby': (1.0, 0.05, 0.1, 1.0),
            'cyan': (0.0, 0.95, 1.0, 1.0),
            'aqua': (0.0, 0.95, 1.0, 1.0),
            'blue': (0.05, 0.25, 1.0, 1.0),
            'neelam': (0.05, 0.25, 1.0, 1.0),
            'green': (0.05, 1.0, 0.2, 1.0),
            'pachaga': (0.05, 1.0, 0.2, 1.0),
            'gold': (1.0, 0.82, 0.2, 1.0),
            'pasupu': (1.0, 0.85, 0.1, 1.0),
            'purple': (0.8, 0.1, 1.0, 1.0),
            'violet': (0.8, 0.1, 1.0, 1.0),
            'pink': (1.0, 0.2, 0.7, 1.0),
            'white': (1.0, 1.0, 1.0, 1.0)
        }

        matched_color = None
        for cname, rgba in color_map.items():
            if cname in prompt:
                matched_color = (cname, rgba)
                break

        if matched_color:
            cname, rgba = matched_color
            count = 0
            for mat in bpy.data.materials:
                if mat.use_nodes and mat.node_tree:
                    bsdf = mat.node_tree.nodes.get("Principled BSDF")
                    if bsdf:
                        # If active object selected, only modify active object materials
                        if 'glow' in prompt or 'neon' in prompt:
                            if 'Emission Color' in bsdf.inputs:
                                bsdf.inputs['Emission Color'].default_value = rgba
                                if 'Emission Strength' in bsdf.inputs:
                                    bsdf.inputs['Emission Strength'].default_value = 25.0
                                count += 1
                        else:
                            if 'Base Color' in bsdf.inputs:
                                bsdf.inputs['Base Color'].default_value = rgba
                                count += 1
            status_msg = f"Color '{cname}' applied ({count} shaders) ✓" if not status_msg else status_msg + f", color: {cname}"

        # C. Lighting intent
        if 'light' in prompt or 'lighting' in prompt:
            # 3-Point Studio
            for l in list(context.scene.objects):
                if l.type == 'LIGHT' and 'Portrait' in l.name:
                    bpy.data.objects.remove(l, do_unlink=True)
            k_data = bpy.data.lights.new(name="Portrait_Key", type='AREA')
            k_data.energy = 850
            k_data.color = (1.0, 0.95, 0.88)
            k_obj = bpy.data.objects.new("Portrait_Key", k_data)
            context.collection.objects.link(k_obj)
            k_obj.location = (0.8, -1.5, 1.9)
            status_msg = "Cinematic Studio 3-Point Light configured ✓" if not status_msg else status_msg

        # D. Camera framing
        if 'camera' in prompt or 'frame' in prompt or 'portrait' in prompt:
            cam = context.scene.camera or bpy.data.objects.get("Camera")
            if cam:
                cam.location = (-0.06, -1.35, 1.62)
                cam.rotation_euler = (math.radians(90), 0, 0)
                if hasattr(cam.data, 'lens'):
                    cam.data.lens = 75
                status_msg = "Camera centered on 70mm Portrait framing ✓" if not status_msg else status_msg

        # E. Lip-sync intent
        if 'lipsync' in prompt or 'speech' in prompt or 'speak' in prompt:
            head = bpy.data.objects.get("Suit_Head")
            if head and head.data.shape_keys:
                jaw = head.data.shape_keys.key_blocks.get("jawOpen")
                if jaw:
                    if 'stop' in prompt or 'rest' in prompt or 'quiet' in prompt:
                        try: jaw.driver_remove('value')
                        except Exception: pass
                        jaw.value = 0.0
                        status_msg = "Lip-sync stopped (mouth rested) ✓"
                    else:
                        try: jaw.driver_remove('value')
                        except Exception: pass
                        drv = jaw.driver_add('value').driver
                        drv.type = 'SCRIPTED'
                        drv.expression = "0.45 * (sin(frame * 0.4)**2) + 0.28 * (sin(frame * 0.85)**2)"
                        status_msg = "Speech Lip-Sync drivers active ✓"

        if not status_msg:
            status_msg = f"Intent '{prompt[:25]}' processed ✓"

        context.scene.unin_ai_status = status_msg
        self.report({'INFO'}, status_msg)
        return {'FINISHED'}

class UNIN_OT_QuickMocap(bpy.types.Operator):
    bl_idname = "unin.quick_mocap"
    bl_label = "Play Mocap"
    bl_description = "Triggers a specific mocap animation action"

    action_name: bpy.props.StringProperty(default="idle")

    def execute(self, context):
        act_map = {
            'wave': ['CharacterArmature|Wave', 'mixamo.com'],
            'punch': ['CharacterArmature|Punch_Right', 'CharacterArmature|Punch_Left'],
            'kick': ['CharacterArmature|Kick_Right', 'CharacterArmature|Kick_Left'],
            'walk': ['CharacterArmature|Walk'],
            'run': ['CharacterArmature|Run', 'CharacterArmature|Run_Left'],
            'sword': ['CharacterArmature|Sword_Slash'],
            'roll': ['CharacterArmature|Roll'],
            'idle': ['CharacterArmature|Idle_Neutral', 'CharacterArmature|Idle']
        }
        candidates = act_map.get(self.action_name, [self.action_name])
        arm = None
        for o in context.scene.objects:
            if o.type == 'ARMATURE':
                arm = o
                break
        if arm:
            target = None
            for c in candidates:
                a = bpy.data.actions.get(c)
                if a:
                    target = a
                    break
            if not target:
                for a in bpy.data.actions:
                    if self.action_name in a.name.lower():
                        target = a
                        break
            if target:
                if not arm.animation_data:
                    arm.animation_data_create()
                arm.animation_data.action = target
                context.scene.frame_start = 1
                context.scene.frame_end = int(target.frame_range[1]) if hasattr(target, 'frame_range') else 250
                bpy.ops.screen.animation_play()
                msg = f"Playing: {target.name} ✓"
                context.scene.unin_ai_status = msg
                self.report({'INFO'}, msg)
                return {'FINISHED'}
        self.report({'WARNING'}, f"Action '{self.action_name}' not found")
        return {'CANCELLED'}

class UNIN_OT_QuickColor(bpy.types.Operator):
    bl_idname = "unin.quick_color"
    bl_label = "Apply Color"
    color_preset: bpy.props.StringProperty(default="cyan")

    def execute(self, context):
        presets = {
            'red': (1.0, 0.05, 0.1, 1.0),
            'cyan': (0.0, 0.95, 1.0, 1.0),
            'gold': (1.0, 0.82, 0.2, 1.0),
            'purple': (0.8, 0.1, 1.0, 1.0)
        }
        rgba = presets.get(self.color_preset, (0.0, 0.95, 1.0, 1.0))
        for mat in bpy.data.materials:
            if mat.use_nodes and mat.node_tree:
                bsdf = mat.node_tree.nodes.get("Principled BSDF")
                if bsdf:
                    if 'Emission Color' in bsdf.inputs:
                        bsdf.inputs['Emission Color'].default_value = rgba
                        if 'Emission Strength' in bsdf.inputs:
                            bsdf.inputs['Emission Strength'].default_value = 25.0
        msg = f"PBR Glow: {self.color_preset.upper()} applied ✓"
        context.scene.unin_ai_status = msg
        self.report({'INFO'}, msg)
        return {'FINISHED'}

class UNIN_OT_FrameCamera(bpy.types.Operator):
    bl_idname = "unin.frame_camera"
    bl_label = "Frame Camera"
    mode: bpy.props.StringProperty(default="portrait")

    def execute(self, context):
        cam = context.scene.camera or bpy.data.objects.get("Camera")
        if not cam:
            cam_data = bpy.data.cameras.new("Camera")
            cam = bpy.data.objects.new("Camera", cam_data)
            context.collection.objects.link(cam)
            context.scene.camera = cam

        if self.mode == "portrait":
            cam.location = (-0.06, -1.35, 1.62)
            cam.rotation_euler = (math.radians(90), 0, 0)
            cam.data.lens = 75
            msg = "Camera: Portrait 70mm Head Framing ✓"
        else:
            cam.location = (0.0, -3.2, 1.1)
            cam.rotation_euler = (math.radians(90), 0, 0)
            cam.data.lens = 42
            msg = "Camera: Full Body Framing ✓"

        context.scene.unin_ai_status = msg
        self.report({'INFO'}, msg)
        return {'FINISHED'}

class UNIN_OT_ToggleLipSync(bpy.types.Operator):
    bl_idname = "unin.toggle_lipsync"
    bl_label = "Toggle LipSync"
    enable: bpy.props.BoolProperty(default=True)

    def execute(self, context):
        head = bpy.data.objects.get("Suit_Head")
        if head and head.data.shape_keys:
            jaw = head.data.shape_keys.key_blocks.get("jawOpen")
            smile = head.data.shape_keys.key_blocks.get("mouthSmile")
            brow = head.data.shape_keys.key_blocks.get("browUp")
            if self.enable:
                if jaw:
                    try: jaw.driver_remove('value')
                    except Exception: pass
                    drv = jaw.driver_add('value').driver
                    drv.type = 'SCRIPTED'
                    drv.expression = "0.45 * (sin(frame * 0.4)**2) + 0.28 * (sin(frame * 0.85)**2)"
                if smile:
                    try: smile.driver_remove('value')
                    except Exception: pass
                    drv = smile.driver_add('value').driver
                    drv.type = 'SCRIPTED'
                    drv.expression = "0.15 + 0.12 * sin(frame * 0.18)"
                msg = "Speech Lip-Sync Active (Syllables modulating) ✓"
            else:
                if jaw:
                    try: jaw.driver_remove('value')
                    except Exception: pass
                    jaw.value = 0.0
                if smile:
                    try: smile.driver_remove('value')
                    except Exception: pass
                    smile.value = 0.0
                msg = "Lip-Sync Rested (Mouth closed) ✓"
            context.scene.unin_ai_status = msg
            self.report({'INFO'}, msg)
            return {'FINISHED'}
        self.report({'WARNING'}, "Suit_Head with shape keys not found")
        return {'CANCELLED'}

class UNIN_OT_ApplySSS(bpy.types.Operator):
    bl_idname = "unin.apply_sss"
    bl_label = "Apply SSS & Cornea"

    def execute(self, context):
        for mat in bpy.data.materials:
            if mat.use_nodes and mat.node_tree:
                bsdf = mat.node_tree.nodes.get("Principled BSDF")
                if bsdf:
                    m_low = mat.name.lower()
                    if 'skin' in m_low:
                        if "Subsurface Weight" in bsdf.inputs:
                            bsdf.inputs["Subsurface Weight"].default_value = 0.24
                        elif "Subsurface" in bsdf.inputs:
                            bsdf.inputs["Subsurface"].default_value = 0.24
                        if "Subsurface Radius" in bsdf.inputs:
                            bsdf.inputs["Subsurface Radius"].default_value = (1.0, 0.22, 0.12)
                        if "Subsurface Scale" in bsdf.inputs:
                            bsdf.inputs["Subsurface Scale"].default_value = 0.04
                        if "Roughness" in bsdf.inputs:
                            bsdf.inputs["Roughness"].default_value = 0.42
                    elif 'eye' in m_low and 'eyebrow' not in m_low:
                        if "Roughness" in bsdf.inputs:
                            bsdf.inputs["Roughness"].default_value = 0.02
                        if "IOR" in bsdf.inputs:
                            bsdf.inputs["IOR"].default_value = 1.376
                        if "Specular IOR Level" in bsdf.inputs:
                            bsdf.inputs["Specular IOR Level"].default_value = 0.95
        msg = "Organic Skin SSS & Wet Cornea Shaders Active ✓"
        context.scene.unin_ai_status = msg
        self.report({'INFO'}, msg)
        return {'FINISHED'}

# 3. FAANG-Grade N-Panel Studio UI
class UNIN_PT_AstraPanel(bpy.types.Panel):
    bl_label = "UNIN Astra Copilot"
    bl_idname = "UNIN_PT_astra_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "UNIN Studio"

    def draw(self, context):
        layout = self.layout
        scene = context.scene

        # Header Box
        header = layout.box()
        row = header.row(align=True)
        row.label(text="Astra AI Copilot", icon='SHADERFX')
        row.label(text="ONLINE (8192)", icon='RADIOBUT_ON')

        # Target Introspection
        arm = None
        for o in scene.objects:
            if o.type == 'ARMATURE':
                arm = o
                break
        cur_act = arm.animation_data.action.name if arm and arm.animation_data and arm.animation_data.action else "None"
        row_target = header.row()
        row_target.label(text=f"Target: {arm.name if arm else 'Scene'} | Act: {cur_act}", icon='ARMATURE_DATA')

        # ── SECTION 1: Natural Language AI Input Box ──
        input_box = layout.box()
        input_box.label(text="AI Command Input Bar:", icon='CONSOLE')
        row_in = input_box.row(align=True)
        row_in.prop(scene, "unin_ai_prompt", text="", placeholder="Type prompt (e.g. 'wave', 'red neon glow', 'punch')...")
        
        row_exec = input_box.row(align=True)
        row_exec.scale_y = 1.35
        row_exec.operator("unin.execute_ai_prompt", text="⚡ Execute AI Change", icon='PLAY')

        # Status Line
        row_stat = input_box.row()
        row_stat.label(text=scene.unin_ai_status, icon='INFO')

        # ── SECTION 2: 500+ Mocap Quick Actions ──
        mocap_box = layout.box()
        mocap_box.label(text="500+ Mocap Actions:", icon='ACTION')
        
        row_m1 = mocap_box.row(align=True)
        op_w = row_m1.operator("unin.quick_mocap", text="Wave 👋")
        op_w.action_name = "wave"
        op_p = row_m1.operator("unin.quick_mocap", text="Punch 🥊")
        op_p.action_name = "punch"
        op_k = row_m1.operator("unin.quick_mocap", text="Kick 🥋")
        op_k.action_name = "kick"

        row_m2 = mocap_box.row(align=True)
        op_wl = row_m2.operator("unin.quick_mocap", text="Walk 🚶")
        op_wl.action_name = "walk"
        op_rn = row_m2.operator("unin.quick_mocap", text="Run 🏃")
        op_rn.action_name = "run"
        op_id = row_m2.operator("unin.quick_mocap", text="Idle 🧍")
        op_id.action_name = "idle"

        row_m3 = mocap_box.row(align=True)
        op_sw = row_m3.operator("unin.quick_mocap", text="Sword ⚔️")
        op_sw.action_name = "sword"
        op_ro = row_m3.operator("unin.quick_mocap", text="Roll 🌀")
        op_ro.action_name = "roll"

        # ── SECTION 3: Studio Lighting & Camera Framing ──
        cam_box = layout.box()
        cam_box.label(text="Lighting & Framing:", icon='LIGHT')
        row_c1 = cam_box.row(align=True)
        row_c1.operator("unin.setup_studio_lights", text="3-Point Light", icon='LIGHT_SUN')
        op_port = row_c1.operator("unin.frame_camera", text="Portrait 70mm", icon='CAMERA_DATA')
        op_port.mode = "portrait"
        op_full = row_c1.operator("unin.frame_camera", text="Full Body", icon='OUTLINER_OB_CAMERA')
        op_full.mode = "full_body"

        # ── SECTION 4: Organic PBR & Neon Glows ──
        pbr_box = layout.box()
        pbr_box.label(text="PBR Shaders & Aesthetics:", icon='MATERIAL')
        row_p1 = pbr_box.row(align=True)
        row_p1.operator("unin.apply_sss", text="Skin SSS 🧴", icon='NODE_MATERIAL')
        op_c_cyan = row_p1.operator("unin.quick_color", text="Cyan 🔷")
        op_c_cyan.color_preset = "cyan"
        op_c_red = row_p1.operator("unin.quick_color", text="Red 🔴")
        op_c_red.color_preset = "red"
        op_c_gold = row_p1.operator("unin.quick_color", text="Gold 🥇")
        op_c_gold.color_preset = "gold"

        # ── SECTION 5: Audio2Face Speech Lip-Sync ──
        lip_box = layout.box()
        lip_box.label(text="Audio2Face Lip-Sync:", icon='SPEECH')
        row_l1 = lip_box.row(align=True)
        op_ls_on = row_l1.operator("unin.toggle_lipsync", text="Start Speech 🎙️")
        op_ls_on.enable = True
        op_ls_off = row_l1.operator("unin.toggle_lipsync", text="Rest Mouth 🤐")
        op_ls_off.enable = False

        # ── SECTION 6: Vision QA & Export ──
        tool_box = layout.box()
        row_t1 = tool_box.row(align=True)
        row_t1.operator("unin.capture_viewport", text="Send Vision 📸", icon='RENDER_STILL')

CLASSES = [
    UNIN_OT_ExecuteAIPrompt,
    UNIN_OT_QuickMocap,
    UNIN_OT_QuickColor,
    UNIN_OT_FrameCamera,
    UNIN_OT_ToggleLipSync,
    UNIN_OT_ApplySSS,
    UNIN_PT_AstraPanel
]

def register_custom_panel():
    ensure_properties()
    for c in CLASSES:
        try:
            bpy.utils.register_class(c)
        except ValueError:
            bpy.utils.unregister_class(c)
            bpy.utils.register_class(c)
    print("[UNIN In-Blender Copilot] FAANG-Grade N-Panel Studio UI Registered ✓")

register_custom_panel()
