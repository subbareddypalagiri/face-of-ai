// src/main/tools/astra/core/SceneInspector.js — Real 3D Scene Inspection & Telemetry Analyzer
'use strict';

const logger = require('../../../../shared/Logger');

class SceneInspector {
  constructor(bridgeRpcCaller) {
    this.sendRPC = bridgeRpcCaller;
  }

  /**
   * Fetches deep geometric telemetry from active Blender session
   */
  async querySceneState() {
    try {
      const res = await this.sendRPC('get_scene_state', {});
      if (res && res.success && res.data) {
        return res.data;
      }
      return null;
    } catch (err) {
      logger.warn(`[SceneInspector] Failed to query scene state: ${err.message}`);
      return null;
    }
  }

  /**
   * Compares expected SceneGraph specification against actual Blender runtime geometry
   */
  inspectScene(sceneGraph, actualState) {
    if (!actualState || !actualState.objects) {
      return {
        verified: false,
        criticalError: 'Could not connect to or retrieve Blender scene state',
        flaws: ['BLENDER_STATE_UNAVAILABLE']
      };
    }

    const flaws = [];
    const metrics = {
      objectsCount: actualState.objectsCount || 0,
      totalTriangles: actualState.totalTriangles || 0,
      totalVertices: actualState.totalVertices || 0,
      lightsCount: (actualState.lights || []).length,
      camerasCount: (actualState.cameras || []).length,
      activeCamera: actualState.activeCamera || null
    };

    const heroEntity = sceneGraph.getHeroEntity();
    let heroFound = false;
    let heroActual = null;

    if (heroEntity) {
      // Find matching hero object or master root in Blender scene
      for (const obj of actualState.objects) {
        if (obj.name === heroEntity.id || obj.name.includes(heroEntity.id) || obj.name.toLowerCase().includes(heroEntity.category)) {
          heroFound = true;
          heroActual = obj;
          break;
        }
      }

      if (!heroFound) {
        flaws.push({
          code: 'HERO_OBJECT_MISSING',
          severity: 'CRITICAL',
          message: `Hero entity "${heroEntity.name}" (${heroEntity.id}) was not found in active Blender scene.`
        });
      } else {
        // 1. Check Ground Contact Elevation (Floating vs Submerged)
        const zLoc = heroActual.location[2];
        if (zLoc > 0.45) {
          flaws.push({
            code: 'OBJECT_FLOATING',
            severity: 'MEDIUM',
            target: heroActual.name,
            currentZ: zLoc,
            message: `Hero entity "${heroActual.name}" is floating ${zLoc.toFixed(2)}m above the ground plane.`
          });
        } else if (zLoc < -0.30) {
          flaws.push({
            code: 'OBJECT_SUBMERGED',
            severity: 'MEDIUM',
            target: heroActual.name,
            currentZ: zLoc,
            message: `Hero entity "${heroActual.name}" is sinking ${Math.abs(zLoc).toFixed(2)}m into the ground.`
          });
        }

        // 2. Check Metric Dimensions
        if (heroActual.dimensions) {
          const actualDim = heroActual.dimensions;
          const targetDim = heroEntity.estimatedDimensions || [1.0, 1.0, 1.0];
          const maxTarget = Math.max(...targetDim);
          const maxActual = Math.max(...actualDim);

          if (maxActual < maxTarget * 0.25) {
            flaws.push({
              code: 'DIMENSION_TOO_SMALL',
              severity: 'HIGH',
              target: heroActual.name,
              actualMax: maxActual,
              targetMax: maxTarget,
              message: `Hero entity scale is too small (${maxActual.toFixed(2)}m vs target ${maxTarget.toFixed(2)}m).`
            });
          } else if (maxActual > maxTarget * 4.0) {
            flaws.push({
              code: 'DIMENSION_TOO_LARGE',
              severity: 'HIGH',
              target: heroActual.name,
              actualMax: maxActual,
              targetMax: maxTarget,
              message: `Hero entity scale is abnormally large (${maxActual.toFixed(2)}m vs target ${maxTarget.toFixed(2)}m).`
            });
          }
        }
      }
    }

    // 3. Check Lighting Sufficiency
    if (metrics.lightsCount === 0) {
      flaws.push({
        code: 'ZERO_LIGHTS',
        severity: 'HIGH',
        message: 'Scene contains zero light objects. Viewport may appear completely black.'
      });
    }

    // 4. Check Camera Presence
    if (metrics.camerasCount === 0 || !actualState.activeCamera) {
      flaws.push({
        code: 'NO_ACTIVE_CAMERA',
        severity: 'CRITICAL',
        message: 'Scene lacks an active cinema camera for rendering.'
      });
    }

    const verified = flaws.filter(f => f.severity === 'CRITICAL').length === 0;

    return {
      verified,
      heroFound,
      heroObject: heroActual,
      flaws,
      metrics,
      passedChecks: flaws.length === 0
    };
  }
}

module.exports = { SceneInspector };
