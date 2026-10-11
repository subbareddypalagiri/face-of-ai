// src/main/tools/astra/core/CorrectionEngine.js — Surgical Delta Correction Engine for 3D Scenes
'use strict';

const logger = require('../../../../shared/Logger');

class CorrectionEngine {
  constructor(bridgeRpcCaller) {
    this.sendRPC = bridgeRpcCaller;
  }

  /**
   * Applies targeted surgical fixes for detected inspection flaws
   */
  async applyCorrections(flaws, sceneGraph) {
    if (!flaws || flaws.length === 0) return { fixedCount: 0, appliedFixes: [] };

    logger.info(`[CorrectionEngine] Generating targeted surgical delta fixes for ${flaws.length} flaws...`);
    const appliedFixes = [];

    for (const flaw of flaws) {
      let fixCode = null;

      switch (flaw.code) {
        case 'OBJECT_FLOATING': {
          fixCode = this.generateFixFloatingObjectBpy(flaw.target, 0.0);
          appliedFixes.push({ flaw: flaw.code, target: flaw.target, action: 'Ground Elevation Correction' });
          break;
        }
        case 'OBJECT_SUBMERGED': {
          fixCode = this.generateFixFloatingObjectBpy(flaw.target, 0.0);
          appliedFixes.push({ flaw: flaw.code, target: flaw.target, action: 'Submergence Elevation Lift' });
          break;
        }
        case 'DIMENSION_TOO_SMALL': {
          const rawRatio = flaw.targetMax / (flaw.actualMax || 0.1);
          const ratio = Math.min(Math.max(rawRatio, 1.05), 3.0);
          fixCode = this.generateFixScaleBpy(flaw.target, ratio);
          appliedFixes.push({ flaw: flaw.code, target: flaw.target, action: `Upscale by ${ratio.toFixed(2)}x` });
          break;
        }
        case 'DIMENSION_TOO_LARGE': {
          const rawRatio = flaw.targetMax / (flaw.actualMax || 10.0);
          const ratio = Math.min(Math.max(rawRatio, 0.33), 0.95);
          fixCode = this.generateFixScaleBpy(flaw.target, ratio);
          appliedFixes.push({ flaw: flaw.code, target: flaw.target, action: `Downscale by ${ratio.toFixed(2)}x` });
          break;
        }
        case 'ZERO_LIGHTS': {
          fixCode = this.generateFixLightingBpy();
          appliedFixes.push({ flaw: flaw.code, action: 'Inject Three-Point Studio Lighting Rig' });
          break;
        }
        case 'NO_ACTIVE_CAMERA': {
          fixCode = this.generateFixCameraBpy(sceneGraph.cinematography);
          appliedFixes.push({ flaw: flaw.code, action: 'Inject Active Cinema Camera' });
          break;
        }
        default:
          break;
      }

      if (fixCode) {
        try {
          logger.info(`[CorrectionEngine] Executing surgical fix for "${flaw.code}" on "${flaw.target || 'scene'}"...`);
          const res = await this.sendRPC('execute_bpy', { code: fixCode, autoCapture: false });
          if (res && res.error) {
            logger.warn(`[CorrectionEngine] Fix for "${flaw.code}" warning: ${res.error.message || JSON.stringify(res.error)}`);
          }
        } catch (e) {
          logger.warn(`[CorrectionEngine] Failed to apply fix for "${flaw.code}": ${e.message}`);
        }
      }
    }

    return {
      fixedCount: appliedFixes.length,
      appliedFixes
    };
  }

  generateFixFloatingObjectBpy(targetName, groundZ = 0.0) {
    return `
# Surgical Fix: Ground Contact Correction
import bpy
import mathutils

obj = bpy.data.objects.get("${targetName}")
if obj:
    # Compute true lowest world vertex/bounding box point
    lowest_z = obj.location.z
    if obj.type == 'MESH' and obj.data:
        lowest_z = min(obj.matrix_world @ mathutils.Vector(v) for v in obj.bound_box)[2]
    elif obj.children:
        child_bottoms = []
        for ch in obj.children:
            if ch.type == 'MESH':
                child_bottoms.append(min((ch.matrix_world @ mathutils.Vector(v))[2] for v in ch.bound_box))
        if child_bottoms:
            lowest_z = min(child_bottoms)

    offset_z = ${groundZ} - lowest_z
    obj.location.z += offset_z
    print(f"[CorrectionEngine] Shifted {obj.name} Z by {offset_z:.4f}m to sit flush on ground Z=${groundZ}")
`;
  }

  generateFixScaleBpy(targetName, scaleMultiplier) {
    return `
# Surgical Fix: Scale Normalization
import bpy

obj = bpy.data.objects.get("${targetName}")
if obj:
    mult = ${parseFloat(scaleMultiplier) || 1.0}
    obj.scale *= mult
    print(f"[CorrectionEngine] Rescaled {obj.name} by multiplier {mult:.4f}")
`;
  }

  generateFixLightingBpy() {
    return `
# Surgical Fix: Inject 3-Point Motivated Lighting
import bpy
import math

# 1. Key Light
kd = bpy.data.lights.new(name="Surgical_Key_Light_Data", type='AREA')
kd.energy = 1200.0
kd.color = (1.0, 0.95, 0.85)
kd.size = 2.5
k_obj = bpy.data.objects.new(name="Surgical_Key_Light", object_data=kd)
k_obj.location = (4.0, -4.5, 4.0)
k_obj.rotation_euler = (math.radians(48), math.radians(15), math.radians(35))
bpy.context.collection.objects.link(k_obj)

# 2. Rim Light
rd = bpy.data.lights.new(name="Surgical_Rim_Light_Data", type='SPOT')
rd.energy = 2200.0
rd.color = (0.2, 0.85, 1.0)
rd.spot_size = math.radians(45)
r_obj = bpy.data.objects.new(name="Surgical_Rim_Light", object_data=rd)
r_obj.location = (-2.5, 3.8, 3.5)
r_obj.rotation_euler = (math.radians(-45), 0, math.radians(145))
bpy.context.collection.objects.link(r_obj)
`;
  }

  generateFixCameraBpy(cinematography = {}) {
    const focal = cinematography.lensFocalLength || 35;
    return `
# Surgical Fix: Inject Active Cinema Camera
import bpy
import math

cam_data = bpy.data.cameras.new("Surgical_Cinema_Camera")
cam_data.lens = ${focal}
cam_data.sensor_width = 36.0
cam_obj = bpy.data.objects.new("Surgical_Cinema_Camera_Obj", cam_data)
cam_obj.location = (-3.8, -4.6, 1.5)
cam_obj.rotation_euler = (math.radians(76), 0, math.radians(-38))
bpy.context.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj
`;
  }
}

module.exports = { CorrectionEngine };
