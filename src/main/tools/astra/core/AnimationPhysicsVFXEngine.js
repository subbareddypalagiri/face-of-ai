// src/main/tools/astra/core/AnimationPhysicsVFXEngine.js — Animation, Physics Simulation & VFX Engine (Phase 6)
'use strict';

const logger = require('../../../../shared/Logger');

/**
 * Standard VFX Presets
 */
const VFX_TYPE = Object.freeze({
  RAIN: 'RAIN',
  SNOW: 'SNOW',
  FOG: 'FOG',
  FIRE: 'FIRE',
  SMOKE: 'SMOKE',
  SPARKS: 'SPARKS',
  FIRE_SPARKS: 'FIRE_SPARKS',
  DUST: 'DUST',
  DUST_PARTICLES: 'DUST_PARTICLES'
});

/**
 * Camera Motion Profiles
 */
const CAMERA_MOVE_TYPE = Object.freeze({
  PUSH_IN: 'PUSH_IN',
  PULL_OUT: 'PULL_OUT',
  ORBIT: 'ORBIT',
  DOLLY_TRACK: 'DOLLY_TRACK',
  PAN_TILT: 'PAN_TILT',
  HANDHELD_SHAKE: 'HANDHELD_SHAKE'
});

/**
 * Physics Simulation Types
 */
const PHYSICS_TYPE = Object.freeze({
  RIGID_BODY: 'RIGID_BODY',
  CLOTH: 'CLOTH',
  FLUID: 'FLUID',
  SOFT_BODY: 'SOFT_BODY',
  COLLISION: 'COLLISION',
  FORCE_FIELD: 'FORCE_FIELD'
});

class AnimationPhysicsVFXEngine {
  constructor(options = {}) {
    this.defaultFPS = options.fps || 24;
    this.defaultDurationSec = options.durationSec || 5;
  }

  /**
   * Plans animation, simulation and VFX requirements from user intent
   */
  planAnimationVFX(userPrompt = '', sceneGraph = null) {
    const p = userPrompt.toLowerCase();
    const plan = {
      hasAnimation: false,
      hasPhysics: false,
      hasVFX: false,
      cameraMotion: null,
      vfxTypes: [],
      physicsTypes: [],
      timeline: {
        startFrame: 1,
        endFrame: this.defaultFPS * this.defaultDurationSec,
        fps: this.defaultFPS
      }
    };

    if (p.includes('animat') || p.includes('camera') || p.includes('move')) {
      plan.hasAnimation = true;
    }

    // Camera Motion Detection
    if (/\bpush(?:ing)?[- ]?in\b/i.test(p) || p.includes('move toward') || p.includes('zoom in')) {
      plan.hasAnimation = true;
      plan.cameraMotion = CAMERA_MOVE_TYPE.PUSH_IN;
    } else if (/\bpull(?:ing)?[- ]?out\b/i.test(p) || p.includes('move back')) {
      plan.hasAnimation = true;
      plan.cameraMotion = CAMERA_MOVE_TYPE.PULL_OUT;
    } else if (p.includes('orbit') || p.includes('circle around')) {
      plan.hasAnimation = true;
      plan.cameraMotion = CAMERA_MOVE_TYPE.ORBIT;
    } else if (p.includes('track') || p.includes('dolly') || p.includes('follow')) {
      plan.hasAnimation = true;
      plan.cameraMotion = CAMERA_MOVE_TYPE.DOLLY_TRACK;
    } else if (p.includes('handheld') || p.includes('shake')) {
      plan.hasAnimation = true;
      plan.cameraMotion = CAMERA_MOVE_TYPE.HANDHELD_SHAKE;
    }

    // VFX Detection
    if (p.includes('rain') || p.includes('wet') || p.includes('puddles')) {
      plan.hasVFX = true;
      plan.vfxTypes.push(VFX_TYPE.RAIN);
    }
    if (p.includes('snow') || p.includes('blizzard')) {
      plan.hasVFX = true;
      plan.vfxTypes.push(VFX_TYPE.SNOW);
    }
    if (p.includes('fog') || p.includes('mist') || p.includes('atmospheric') || p.includes('haze')) {
      plan.hasVFX = true;
      plan.vfxTypes.push(VFX_TYPE.FOG);
    }
    if (p.includes('fire') || p.includes('flame') || p.includes('burning')) {
      plan.hasVFX = true;
      plan.vfxTypes.push(VFX_TYPE.FIRE);
    }
    if (p.includes('smoke')) {
      plan.hasVFX = true;
      plan.vfxTypes.push(VFX_TYPE.SMOKE);
    }

    // Physics Simulation Detection
    if (p.includes('fall') || p.includes('drop') || p.includes('crash') || p.includes('gravity') || p.includes('rigid body')) {
      plan.hasPhysics = true;
      plan.physicsTypes.push(PHYSICS_TYPE.RIGID_BODY);
    }
    if (p.includes('cloth') || p.includes('flag') || p.includes('fabric') || p.includes('wind')) {
      plan.hasPhysics = true;
      plan.physicsTypes.push(PHYSICS_TYPE.CLOTH);
    }

    // Duration Detection (e.g. "10 seconds", "10s", "10 sec")
    const secMatch = p.match(/(\d+)\s*(?:seconds?|secs?|s)\b/);
    if (secMatch) {
      const durSec = parseInt(secMatch[1], 10);
      if (durSec > 0 && durSec <= 60) {
        plan.timeline.endFrame = plan.timeline.fps * durSec;
      }
    }

    plan.cameraMove = plan.cameraMotion;
    plan.vfx = plan.vfxTypes;
    plan.physics = plan.physicsTypes;

    return plan;
  }

  /**
   * Generates Python to configure Timeline Frame Range and FPS
   */
  generateTimelineSetupBpy(startFrame = 1, endFrame = 120, fps = 24) {
    return `
import bpy

scene = bpy.context.scene
scene.frame_start = ${startFrame}
scene.frame_end = ${endFrame}
scene.render.fps = ${fps}
scene.frame_current = ${startFrame}
`;
  }

  /**
   * Generates Python for Camera Animation with Keyframed Transforms & Interpolation
   */
  generateCameraAnimationBpy(cameraIdentifier, moveType = CAMERA_MOVE_TYPE.PUSH_IN, startFrame = 1, endFrame = 120, targetLocation = [0, 0, 0.65]) {
    return `
import bpy
import math

def _animate_camera():
    cam = None
    for o in bpy.context.scene.objects:
        if o.get("unin_id") == "${cameraIdentifier}" or o.name == "${cameraIdentifier}":
            cam = o
            break
    if not cam:
        for o in bpy.data.objects:
            if o.get("unin_id") == "${cameraIdentifier}" or o.name == "${cameraIdentifier}":
                cam = o
                break
            
    if not cam or cam.type != 'CAMERA':
        return

    cam_obj = cam
    cam_obj.animation_data_clear()

    start_f = ${startFrame}
    end_f = ${endFrame}

    ${moveType === CAMERA_MOVE_TYPE.PUSH_IN ? `
    cam_obj.location = (-2.8, -3.8, 1.4)
    cam_obj.keyframe_insert(data_path="location", frame=${startFrame})
    cam_obj.location = (-1.6, -2.2, 0.95)
    cam_obj.keyframe_insert(data_path="location", frame=${endFrame})
    ` : moveType === CAMERA_MOVE_TYPE.PULL_OUT ? `
    cam_obj.location = (-1.5, -2.0, 0.9)
    cam_obj.keyframe_insert(data_path="location", frame=${startFrame})
    cam_obj.location = (-4.0, -5.5, 2.0)
    cam_obj.keyframe_insert(data_path="location", frame=${endFrame})
    ` : moveType === CAMERA_MOVE_TYPE.ORBIT ? `
    radius = 3.5
    height = 1.2
    for f in range(start_f, end_f + 1, 15):
        angle = math.radians((f - start_f) / (end_f - start_f) * 60 - 30)
        cam_obj.location = (
            ${targetLocation[0]} + radius * math.sin(angle),
            ${targetLocation[1]} - radius * math.cos(angle),
            height
        )
        cam_obj.keyframe_insert(data_path="location", frame=f)
    ` : `
    cam_obj.location = (-2.5, -3.5, 1.2)
    cam_obj.keyframe_insert(data_path="location", frame=${startFrame})
    cam_obj.location = (-2.0, -2.8, 1.1)
    cam_obj.keyframe_insert(data_path="location", frame=${endFrame})
    `}

    # Set Bezier Smooth Interpolation
    try:
        if cam_obj.animation_data and cam_obj.animation_data.action:
            act = cam_obj.animation_data.action
            curves = getattr(act, 'fcurves', None)
            if curves is None and hasattr(act, 'layers'):
                curves = []
                for layer in act.layers:
                    for strip in getattr(layer, 'strips', []):
                        for cb in getattr(strip, 'channelbags', []):
                            curves.extend(getattr(cb, 'fcurves', []))
            if curves:
                for fcurve in curves:
                    for kp in fcurve.keyframe_points:
                        kp.interpolation = 'BEZIER'
    except Exception:
        pass

_animate_camera()
`;
  }

  /**
   * Generates Python to configure Rigid Body physics on an object
   */
  generateRigidBodyBpy(objectIdentifier, physicsConfig = {}) {
    const type = physicsConfig.type || 'ACTIVE';
    const mass = physicsConfig.mass !== undefined ? physicsConfig.mass : 15.0;
    const collisionShape = physicsConfig.collisionShape || 'CONVEX_HULL';
    const friction = physicsConfig.friction !== undefined ? physicsConfig.friction : 0.5;
    const restitution = physicsConfig.restitution !== undefined
      ? physicsConfig.restitution
      : (physicsConfig.bounciness !== undefined ? physicsConfig.bounciness : 0.1);

    return `
import bpy

def _setup_rigid_body():
    scene = bpy.context.scene
    # CRITICAL: Initialize Rigid Body World simulation domain if not present
    if not scene.rigidbody_world:
        try:
            bpy.ops.rigidbody.world_add()
        except Exception:
            pass
    rw = scene.rigidbody_world
    if rw:
        rw.enabled = True
        rw.time_scale = 1.0
        rw.substeps_per_frame = 10
        rw.solver_iterations = 10

    obj = None
    for o in bpy.context.scene.objects:
        if o.get("unin_id") == "${objectIdentifier}" or o.name == "${objectIdentifier}":
            obj = o
            break
    if not obj:
        for o in bpy.data.objects:
            if o.get("unin_id") == "${objectIdentifier}" or o.name == "${objectIdentifier}":
                obj = o
                break
            
    if obj and obj.type == 'MESH':
        target_obj = obj
        if not target_obj.rigid_body:
            bpy.context.view_layer.objects.active = target_obj
            target_obj.select_set(True)
            bpy.ops.rigidbody.object_add()
            
        rb = target_obj.rigid_body
        rb.type = '${type}'
        rb.mass = ${mass}
        rb.collision_shape = '${collisionShape}'
        rb.friction = ${friction}
        rb.restitution = ${restitution}

_setup_rigid_body()
`;
  }

  /**
   * Generates Python for Cloth Simulation (e.g. flag, canopy, fabric)
   */
  generateClothBpy(objectIdentifier, clothConfig = {}) {
    const name = clothConfig.name || 'Cloth_Sim';
    const mass = clothConfig.mass !== undefined ? clothConfig.mass : 0.3;
    const tensionStiffness = clothConfig.tensionStiffness !== undefined ? clothConfig.tensionStiffness : (clothConfig.tension !== undefined ? clothConfig.tension : 15.0);
    const compressionStiffness = clothConfig.compressionStiffness !== undefined ? clothConfig.compressionStiffness : 15.0;
    const shearStiffness = clothConfig.shearStiffness !== undefined ? clothConfig.shearStiffness : 5.0;
    const bendingStiffness = clothConfig.bendingStiffness !== undefined ? clothConfig.bendingStiffness : 0.5;

    return `
import bpy

def _setup_cloth():
    obj = None
    for o in bpy.context.scene.objects:
        if o.get("unin_id") == "${objectIdentifier}" or o.name == "${objectIdentifier}":
            obj = o
            break
    if not obj:
        for o in bpy.data.objects:
            if o.get("unin_id") == "${objectIdentifier}" or o.name == "${objectIdentifier}":
                obj = o
                break
            
    if obj and obj.type == 'MESH':
        target_obj = obj
        mod = target_obj.modifiers.get("${name}")
        if not mod:
            mod = target_obj.modifiers.new(name="${name}", type='CLOTH')
            
        cloth = mod
        cloth.settings.mass = ${mass}
        cloth.settings.tension_stiffness = ${tensionStiffness}
        cs = mod.settings
        cs.mass = ${mass}
        cs.tension_stiffness = ${tensionStiffness}
        cs.compression_stiffness = ${compressionStiffness}
        cs.shear_stiffness = ${shearStiffness}
        cs.bending_stiffness = ${bendingStiffness}
        cs.quality = 5

_setup_cloth()
`;
  }

  /**
   * Generates Python for Atmospheric Rain VFX using non-destructive instanced emission
   */
  generateVFXRainSystemBpy(emitterBounds = { minX: -15, maxX: 15, minY: -15, maxY: 15, height: 14.0 }, particleCount = 2500) {
    const heightZ = emitterBounds.height || emitterBounds.heightZ || 14.0;
    const sizeX = emitterBounds.sizeX || (Math.abs((emitterBounds.maxX || 15) - (emitterBounds.minX || -15)) || 30.0);
    const sizeY = emitterBounds.sizeY || (Math.abs((emitterBounds.maxY || 15) - (emitterBounds.minY || -15)) || 30.0);

    return `
import bpy

def _setup_rain_vfx():
    scene = bpy.context.scene
    
    # Check if rain emitter already exists
    rain_emitter = bpy.data.objects.get("unin.vfx.rain_emitter")
    if not rain_emitter:
        bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, 0, ${heightZ}))
        rain_emitter = bpy.context.view_layer.objects.active
        rain_emitter.name = "unin.vfx.rain_emitter"
        rain_emitter["unin_id"] = "unin.vfx.rain_emitter"
        rain_emitter.scale = (${sizeX}, ${sizeY}, 1.0)
        rain_emitter.hide_render = True
        rain_emitter.hide_viewport = True

    # Raindrop Master Prototype (single instanced streak)
    drop_obj = bpy.data.objects.get("unin.vfx.raindrop_proto")
    if not drop_obj:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.004, depth=0.18, location=(0, 0, -50))
        drop_obj = bpy.context.view_layer.objects.active
        drop_obj.name = "unin.vfx.raindrop_proto"
        drop_obj["unin_id"] = "unin.vfx.raindrop_proto"
        drop_obj.hide_viewport = True
        drop_obj.hide_render = True
        
        # High-Fidelity Rain Streak Shader (Specular reflection + subtle atmospheric luminance)
        mat = bpy.data.materials.new(name="Raindrop_Water_Shader")
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            bsdf.inputs['Base Color'].default_value = (0.92, 0.96, 1.0, 1.0)
            bsdf.inputs['Roughness'].default_value = 0.10
            if 'Transmission Weight' in bsdf.inputs:
                bsdf.inputs['Transmission Weight'].default_value = 0.75
            elif 'Transmission' in bsdf.inputs:
                bsdf.inputs['Transmission'].default_value = 0.75
            if 'Specular IOR Level' in bsdf.inputs:
                bsdf.inputs['Specular IOR Level'].default_value = 1.0
            if 'Emission Color' in bsdf.inputs:
                bsdf.inputs['Emission Color'].default_value = (0.85, 0.92, 1.0, 1.0)
                if 'Emission Strength' in bsdf.inputs:
                    bsdf.inputs['Emission Strength'].default_value = 1.2
            elif 'Emission' in bsdf.inputs:
                bsdf.inputs['Emission'].default_value = (0.85, 0.92, 1.0, 1.0)
        drop_obj.data.materials.append(mat)

    # Particle System Setup
    ps = rain_emitter.particle_systems.get("Rain_Particles")
    if not ps:
        rain_emitter.modifiers.new("Rain_Particles", type='PARTICLE_SYSTEM')
        ps = rain_emitter.particle_systems["Rain_Particles"]
        
    p_set = ps.settings
    p_set.count = ${particleCount}
    ps.settings.count = ${particleCount}
    p_set.frame_start = 1
    p_set.frame_end = scene.frame_end
    p_set.lifetime = 35
    proto = drop_obj
    ps.settings.render_type = 'OBJECT'
    p_set.render_type = 'OBJECT'
    ps.settings.instance_object = proto
    p_set.instance_object = proto
    p_set.particle_size = 1.0
    p_set.size_random = 0.35
    p_set.normal_factor = -12.0

    # Ensure point cache is baked for headless EEVEE evaluation
    try:
        bpy.ops.ptcache.bake_all(bake=True)
    except Exception:
        pass

_setup_rain_vfx()
`;
  }
}

module.exports = {
  AnimationPhysicsVFXEngine,
  VFX_TYPE,
  CAMERA_MOVE_TYPE,
  PHYSICS_TYPE
};
