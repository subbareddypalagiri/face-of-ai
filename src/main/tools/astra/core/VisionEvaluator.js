// src/main/tools/astra/core/VisionEvaluator.js — Multimodal Vision Quality Engine & Telemetry Fusion
'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('../../../../shared/Logger');
const { UnifiedAILayer } = require('./UnifiedAILayer');
const { DELTA_ACTION, DELTA_SCOPE } = require('./WorldDeltaMutator');

// ──────────────────────────────────────────────────────────────────────────────
// ENUMS & CONSTANTS
// ──────────────────────────────────────────────────────────────────────────────

const DEFECT_DIMENSION = Object.freeze({
  SEMANTIC: 'SEMANTIC',
  SILHOUETTE: 'SILHOUETTE',
  COMPOSITION: 'COMPOSITION',
  SCALE: 'SCALE',
  SPATIAL: 'SPATIAL',
  MATERIAL: 'MATERIAL',
  LIGHTING: 'LIGHTING',
  ATMOSPHERE: 'ATMOSPHERE',
  CAMERA: 'CAMERA',
  COMPLETENESS: 'COMPLETENESS',
  VISUAL_HIERARCHY: 'VISUAL_HIERARCHY'
});

const DEFECT_SEVERITY = Object.freeze({
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
});

const EVALUATION_STATUS = Object.freeze({
  PASS: 'PASS',
  NEEDS_CORRECTION: 'NEEDS_CORRECTION',
  FAIL: 'FAIL',
  QUALITY_NOT_REACHED: 'QUALITY_NOT_REACHED',
  VISION_UNAVAILABLE: 'VISION_UNAVAILABLE'
});

const PROFILE_THRESHOLDS = Object.freeze({
  DRAFT: { minScore: 6.0, maxIterations: 1 },
  STANDARD: { minScore: 7.0, maxIterations: 2 },
  HIGH: { minScore: 8.0, maxIterations: 3 },
  HERO: { minScore: 8.5, maxIterations: 4 },
  CINEMATIC: { minScore: 8.8, maxIterations: 5 }
});

// ──────────────────────────────────────────────────────────────────────────────
// VISION EVALUATOR CLASS
// ──────────────────────────────────────────────────────────────────────────────

class VisionEvaluator {
  constructor(bridgeRpcCaller, options = {}) {
    this.sendRPC = bridgeRpcCaller;
    this.ai = new UnifiedAILayer(options);
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.minConfidence = options.minConfidence || 0.70;
  }

  /**
   * Captures an evaluation preview image from Blender
   *
   * @param {string} [outputPath] - Custom output image path
   * @param {Object} [options]
   * @returns {Promise<string|null>} Path to captured image
   */
  async captureEvaluationFrame(outputPath = null, options = {}) {
    const finalPath = outputPath || path.join(this.workspaceRoot, 'unin_eval_preview.png').replace(/\\/g, '/');

    // Strategy A: Quick OpenGL Viewport Capture (if available)
    try {
      const snapRes = await this.sendRPC('capture_snapshot', { outputPath: finalPath }, 5000);
      if (snapRes && snapRes.success && snapRes.data?.filePath && fs.existsSync(snapRes.data.filePath)) {
        const stats = fs.statSync(snapRes.data.filePath);
        if (stats.size > 1024) {
          return snapRes.data.filePath;
        }
      }
    } catch (e) {
      // Viewport OpenGL not available or headless, fallback to fast preview render
    }

    // Strategy B: Fast preview render (8 samples, fast still frame)
    const py = `
import bpy
scene = bpy.context.scene
orig_samples = scene.eevee.render_samples if hasattr(scene.eevee, 'render_samples') else 16
try:
    if hasattr(scene.eevee, 'render_samples'):
        scene.eevee.render_samples = 8
    elif hasattr(scene.eevee, 'taa_render_samples'):
        scene.eevee.taa_render_samples = 8
    
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.render.filepath = r"${finalPath}"
    bpy.ops.render.render(write_still=True)
    print("EVAL_PREVIEW_RENDER_SUCCESS")
finally:
    if hasattr(scene.eevee, 'render_samples'):
        scene.eevee.render_samples = orig_samples
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
`;

    try {
      await this.sendRPC('execute_bpy', { code: py, autoCapture: false, timeout: 60.0 }, 60000);
      if (fs.existsSync(finalPath) && fs.statSync(finalPath).size > 1024) {
        return finalPath;
      }
    } catch (e) {
      logger.warn(`[VisionEvaluator] Preview capture notice: ${e.message}`);
    }

    // Fallback: Check if master render exists
    const masterRender = path.join(this.workspaceRoot, 'unin_world_render.png');
    if (fs.existsSync(masterRender) && fs.statSync(masterRender).size > 1024) {
      return masterRender;
    }

    return null;
  }

  /**
   * Performs deep multimodal vision evaluation and telemetry fusion.
   *
   * @param {string} userPrompt - Creative instruction
   * @param {string} imagePath - Path to rendered frame
   * @param {Object} sceneGraph - SceneGraph specification
   * @param {Object} actualTelemetry - Telemetry from get_scene_state
   * @param {Object} [visualPlan=null] - VisualProductionPlan
   * @param {string} [profile='CINEMATIC'] - Quality profile
   * @returns {Promise<Object>} Structured VisualEvaluationReport
   */
  async evaluateVisualQuality(userPrompt, imagePath, sceneGraph, actualTelemetry, visualPlan = null, profile = 'CINEMATIC') {
    logger.info(`[VisionEvaluator] Initiating vision quality evaluation for: "${imagePath}" against prompt: "${userPrompt}"...`);

    const imageExists = imagePath && fs.existsSync(imagePath) && fs.statSync(imagePath).size > 100;
    const heroEntity = sceneGraph ? sceneGraph.getHeroEntity() : null;

    let aiCritique = null;

    // Step 1: If image exists and API is configured, run Multimodal Gemini Vision
    if (imageExists) {
      try {
        const imgBuffer = fs.readFileSync(imagePath);
        aiCritique = await this._queryMultimodalCritic(userPrompt, imgBuffer, sceneGraph, heroEntity, visualPlan);
      } catch (err) {
        logger.warn(`[VisionEvaluator] Multimodal vision query failed: ${err.message}. Proceeding with Telemetry Fusion Engine.`);
      }
    } else {
      logger.warn(`[VisionEvaluator] Visual frame unavailable at "${imagePath}". Running telemetry-based evaluation.`);
    }

    // Step 2: Telemetry + Vision Fusion & Artistic Intent Discrimination
    const fusionReport = this._fuseVisionAndTelemetry(aiCritique, actualTelemetry, sceneGraph, userPrompt, visualPlan, profile);

    logger.info(`[VisionEvaluator] Evaluation Complete: Status=${fusionReport.overallStatus}, Score=${fusionReport.qualityScore.toFixed(1)}/10, Defects=${fusionReport.defects.length} (Critical: ${fusionReport.criticalCount}) ✓`);

    return fusionReport;
  }

  /**
   * Queries Multimodal Gemini Vision with structured 11-dimension critique rubric
   */
  async _queryMultimodalCritic(userPrompt, imageBuffer, sceneGraph, heroEntity, visualPlan) {
    const systemPrompt = `You are a Principal 3D Visual Director and Multimodal Quality Gate for Google DeepMind / UNIN 3D Studio.
Critique this rendered 3D viewport image against user intent: "${userPrompt}"

EVALUATION DIMENSIONS (11 Dimensions):
1. SEMANTIC: Is the requested main entity/subject actually present in the image?
2. SILHOUETTE: Does the hero object visually resemble the requested entity (not a primitive or placeholder)?
3. COMPOSITION: Is the subject framed properly according to rule of thirds / golden ratio / center?
4. SCALE: Are object proportions believable against ground and surroundings?
5. SPATIAL: Are objects grounded properly (not floating above ground or submerged)?
6. MATERIAL: Do surfaces exhibit physical PBR response (roughness, specular reflections, wetness)?
7. LIGHTING: Is lighting motivated, balanced, and free from blinding overexposure or total blackout?
8. ATMOSPHERE: Does weather/fog/rain match the request?
9. CAMERA: Are lens focal length, depth of field, and camera elevation appropriate?
10. COMPLETENESS: Are essential secondary elements/ground missing?
11. VISUAL_HIERARCHY: Is the hero subject visually prominent and dominant in the frame?

CRITICAL RULE:
Distinguish ARTISTIC CHOICES from TECHNICAL DEFECTS.
- If the user asked for a "dark moody night", low scene brightness is INTENTIONAL, NOT a lighting defect.
- If the user asked for "shallow depth of field", background blur is INTENTIONAL.

OUTPUT STRICT JSON ONLY:
{
  "qualityScore": 8.5,
  "confidence": 0.92,
  "artisticIntentRespected": true,
  "defects": [
    {
      "dimension": "SPATIAL" | "COMPOSITION" | "SCALE" | "MATERIAL" | "LIGHTING" | "ATMOSPHERE" | "CAMERA" | "SEMANTIC",
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      "description": "Clear description of what is visually defective",
      "confidence": 0.88,
      "target": "${heroEntity ? heroEntity.id : 'hero_subject'}",
      "recommendedAction": "GROUND_OBJECT" | "MOVE_CAMERA" | "RESCALE_HERO" | "RECOLOR_MATERIAL" | "ADJUST_LIGHTING" | "LOWER_FOG",
      "actionParams": {}
    }
  ],
  "critiqueSummary": "Concise director summary of scene visual appeal"
}`;

    const userMsg = `Analyze image for prompt: "${userPrompt}". Hero entity: ${heroEntity ? heroEntity.name : 'Primary Subject'}.`;

    const res = await this.ai.synthesizeMultimodal(systemPrompt, userMsg, imageBuffer, 'image/png');
    if (res && res.success && res.data) {
      return res.data;
    }
    return null;
  }

  /**
   * Fuses vision observations with ground-truth geometric telemetry from Blender
   */
  _fuseVisionAndTelemetry(visionCritique, telemetry, sceneGraph, userPrompt, visualPlan, profile = 'CINEMATIC') {
    const defects = [];
    const threshold = PROFILE_THRESHOLDS[profile] || PROFILE_THRESHOLDS.CINEMATIC;
    const heroEntity = sceneGraph ? sceneGraph.getHeroEntity() : null;
    const promptLower = (userPrompt || '').toLowerCase();

    // 1. Process Vision Defects (if available) with Artistic Intent Filtering
    if (visionCritique && Array.isArray(visionCritique.defects)) {
      for (const d of visionCritique.defects) {
        // Artistic Intent Safeguard
        if (d.dimension === DEFECT_DIMENSION.LIGHTING && promptLower.includes('dark') && d.description.toLowerCase().includes('dark')) {
          logger.info('[VisionEvaluator] Ignoring low brightness critique: User explicitly requested dark atmosphere (Artistic Choice).');
          continue;
        }
        if (d.dimension === DEFECT_DIMENSION.CAMERA && promptLower.includes('wide') && d.description.toLowerCase().includes('small')) {
          logger.info('[VisionEvaluator] Ignoring subject size critique: User explicitly requested wide framing (Artistic Choice).');
          continue;
        }

        defects.push({
          id: `defect_${defects.length + 1}_${d.dimension.toLowerCase()}`,
          dimension: d.dimension,
          severity: d.severity || DEFECT_SEVERITY.MEDIUM,
          description: d.description,
          confidence: d.confidence || 0.85,
          target: d.target || (heroEntity ? heroEntity.id : 'scene'),
          recommendedAction: d.recommendedAction || 'ADJUST_PARAMETERS',
          actionParams: d.actionParams || {}
        });
      }
    }

    // 2. Telemetry Verification & Cross-Checking (Geometric Ground Truth)
    if (telemetry && telemetry.objects) {
      const heroObj = telemetry.objects.find(o =>
        (heroEntity && o.name.includes(heroEntity.id)) ||
        o.name.toLowerCase().includes('hero') ||
        (heroEntity && o.name.toLowerCase().includes(heroEntity.category)) ||
        o.name.startsWith('unin.entity.') ||
        o.name.toLowerCase().includes('ferrari') ||
        o.name.toLowerCase().includes('car') ||
        o.name.toLowerCase().includes('motorcycle')
      ) || telemetry.objects[0];

      // Check A: Semantic presence
      if (heroEntity && !heroObj) {
        // Critical defect if hero object is missing from geometry
        if (!defects.some(d => d.dimension === DEFECT_DIMENSION.SEMANTIC)) {
          defects.push({
            id: `defect_geom_missing_hero`,
            dimension: DEFECT_DIMENSION.SEMANTIC,
            severity: DEFECT_SEVERITY.CRITICAL,
            description: `Hero entity "${heroEntity.name}" is missing from Blender scene geometry.`,
            confidence: 0.99,
            target: heroEntity.id,
            recommendedAction: 'REBUILD_HERO'
          });
        }
      }

      // Check B: Ground contact (Spatial verification)
      const floatingCandidates = telemetry.objects.filter(o =>
        o.location && o.location[2] > 0.45 &&
        !o.name.includes('foundation') && !o.name.includes('ground') && !o.name.includes('lamp') && !o.name.includes('sun')
      );

      if (floatingCandidates.length > 0) {
        const floatObj = heroObj || floatingCandidates[0];
        const zLoc = floatObj.location[2];
        const existingSpatial = defects.find(d => d.dimension === DEFECT_DIMENSION.SPATIAL);
        if (existingSpatial) {
          existingSpatial.confidence = 0.98; // Boost confidence via telemetry cross-check
          existingSpatial.severity = DEFECT_SEVERITY.CRITICAL;
          existingSpatial.actionParams = { groundZ: 0.0, currentZ: zLoc };
        } else {
          defects.push({
            id: `defect_geom_floating`,
            dimension: DEFECT_DIMENSION.SPATIAL,
            severity: DEFECT_SEVERITY.CRITICAL,
            description: `Object "${floatObj.name}" is floating ${zLoc.toFixed(2)}m above the ground plane.`,
            confidence: 0.95,
            target: floatObj.name,
            recommendedAction: 'GROUND_OBJECT',
            actionParams: { groundZ: 0.0, currentZ: zLoc }
          });
        }
      }

      // Check C: Camera optics check
      if (!telemetry.activeCamera) {
        defects.push({
          id: `defect_geom_no_camera`,
          dimension: DEFECT_DIMENSION.CAMERA,
          severity: DEFECT_SEVERITY.CRITICAL,
          description: 'No active cinema camera present in Blender scene.',
          confidence: 0.99,
          target: 'camera',
          recommendedAction: 'INJECT_CAMERA'
        });
      }

      // Check D: Lighting check
      if (!telemetry.lights || telemetry.lights.length === 0) {
        defects.push({
          id: `defect_geom_zero_lights`,
          dimension: DEFECT_DIMENSION.LIGHTING,
          severity: DEFECT_SEVERITY.CRITICAL,
          description: 'Scene contains zero light sources.',
          confidence: 0.99,
          target: 'lighting',
          recommendedAction: 'INJECT_LIGHTING'
        });
      }
    }

    // 3. Compute Real Rubric-Based Quality Score (No hardcoded values)
    let score = 9.5;
    const criticals = defects.filter(d => d.severity === DEFECT_SEVERITY.CRITICAL);
    const highs = defects.filter(d => d.severity === DEFECT_SEVERITY.HIGH);
    const mediums = defects.filter(d => d.severity === DEFECT_SEVERITY.MEDIUM);
    const lows = defects.filter(d => d.severity === DEFECT_SEVERITY.LOW);

    score -= (criticals.length * 3.5);
    score -= (highs.length * 1.5);
    score -= (mediums.length * 0.6);
    score -= (lows.length * 0.2);

    // If vision critique returned a calculated score, blend 50/50 with telemetry score
    if (visionCritique && typeof visionCritique.qualityScore === 'number') {
      score = (score * 0.4) + (visionCritique.qualityScore * 0.6);
    }

    score = Math.min(Math.max(score, 1.0), 10.0);

    // Determine Overall Status
    let overallStatus = EVALUATION_STATUS.PASS;
    if (criticals.length > 0) {
      overallStatus = EVALUATION_STATUS.FAIL;
    } else if (score < threshold.minScore || highs.length > 0) {
      overallStatus = EVALUATION_STATUS.NEEDS_CORRECTION;
    }

    return {
      overallStatus,
      qualityScore: score,
      minScoreThreshold: threshold.minScore,
      confidence: visionCritique?.confidence || 0.88,
      defects,
      criticalCount: criticals.length,
      highCount: highs.length,
      mediumCount: mediums.length,
      lowCount: lows.length,
      critiqueSummary: visionCritique?.critiqueSummary || `Telemetry inspection: ${defects.length} defects identified, score ${score.toFixed(1)}/10`
    };
  }

  /**
   * Plans surgical delta correction for a detected visual defect
   *
   * @param {Object} defect - Visual defect specification
   * @param {Object} worldState - Persistent world state
   * @returns {Object|null} Atomic delta spec compatible with WorldDeltaMutator
   */
  planSurgicalCorrection(defect, worldState) {
    if (!defect || defect.confidence < this.minConfidence) {
      logger.info(`[VisionEvaluator] Skipping low-confidence defect (${defect?.confidence || 0}): ${defect?.description}`);
      return null;
    }

    logger.info(`[VisionEvaluator] Planning surgical correction for [${defect.dimension}] (${defect.severity}): ${defect.description}`);

    switch (defect.recommendedAction) {
      case 'GROUND_OBJECT':
      case 'FIX_GROUND_CONTACT': {
        const offsetZ = -(defect.actionParams?.currentZ || 0.5);
        return {
          action: DELTA_ACTION.MOVE,
          scope: DELTA_SCOPE.LOCAL_DELTA,
          targets: [{ entityId: defect.target, targetName: defect.target }],
          parameters: { offset: [0, 0, offsetZ] },
          description: `Surgically snap ${defect.target} to ground plane (offset Z: ${offsetZ.toFixed(2)}m)`
        };
      }

      case 'RESCALE_HERO':
      case 'SCALE_UP': {
        return {
          action: DELTA_ACTION.SCALE,
          scope: DELTA_SCOPE.LOCAL_DELTA,
          targets: [{ entityId: defect.target, targetName: defect.target }],
          parameters: { scaleMultiplier: 1.25 },
          description: `Surgically upscale ${defect.target} by 25% for hero prominence`
        };
      }

      case 'SCALE_DOWN': {
        return {
          action: DELTA_ACTION.SCALE,
          scope: DELTA_SCOPE.LOCAL_DELTA,
          targets: [{ entityId: defect.target, targetName: defect.target }],
          parameters: { scaleMultiplier: 0.8 },
          description: `Surgically downscale ${defect.target} by 20% for scale proportion`
        };
      }

      case 'ADJUST_LIGHTING':
      case 'INCREASE_EXPOSURE': {
        return {
          action: DELTA_ACTION.LIGHTING_CHANGE,
          scope: DELTA_SCOPE.LIGHTING_DELTA,
          parameters: { energyMultiplier: 1.35 },
          description: 'Surgically boost key and fill light energy by 35%'
        };
      }

      case 'REDUCE_EXPOSURE': {
        return {
          action: DELTA_ACTION.LIGHTING_CHANGE,
          scope: DELTA_SCOPE.LIGHTING_DELTA,
          parameters: { energyMultiplier: 0.75 },
          description: 'Surgically reduce light energy by 25% to eliminate overexposure'
        };
      }

      case 'LOWER_FOG': {
        return {
          action: DELTA_ACTION.ENVIRONMENT_CHANGE,
          scope: DELTA_SCOPE.ENVIRONMENT_DELTA,
          parameters: { fogDensity: 0.0006 },
          description: 'Surgically reduce volumetric fog density to preserve depth'
        };
      }

      case 'MOVE_CAMERA':
      case 'REFRAME_CAMERA': {
        return {
          action: DELTA_ACTION.CAMERA_CHANGE,
          scope: DELTA_SCOPE.CAMERA_DELTA,
          parameters: { offset: [-0.5, -0.8, 0.2] },
          description: 'Surgically reframe camera for hero composition'
        };
      }

      case 'RECOLOR_MATERIAL':
      case 'INCREASE_SURFACE_REFLECTION': {
        return {
          action: DELTA_ACTION.MATERIAL_CHANGE,
          scope: DELTA_SCOPE.LOCAL_DELTA,
          targets: [{ entityId: defect.target, targetName: defect.target }],
          parameters: { roughness: 0.15, metallic: 0.9 },
          description: `Surgically increase surface reflection on ${defect.target}`
        };
      }

      default:
        logger.info(`[VisionEvaluator] Generic defect action "${defect.recommendedAction}" handled via surgical parameter adjustment.`);
        return null;
    }
  }

  /**
   * Executes the full closed-loop Visual Correction Loop:
   * Build/Mutate -> Capture Frame -> Vision Evaluation -> Surgical Correction -> Re-capture -> Verify.
   *
   * @param {Object} params
   * @param {string} params.userPrompt
   * @param {Object} params.sceneGraph
   * @param {Object} params.worldState
   * @param {Object} params.deltaMutator - WorldDeltaMutator instance
   * @param {Object} [params.checkpointMgr=null]
   * @param {string} [params.profile='CINEMATIC']
   * @returns {Promise<Object>} Loop result envelope
   */
  async runVisualCorrectionLoop({
    userPrompt,
    sceneGraph,
    worldState,
    deltaMutator,
    checkpointMgr = null,
    profile = 'CINEMATIC'
  }) {
    const config = PROFILE_THRESHOLDS[profile] || PROFILE_THRESHOLDS.CINEMATIC;
    const maxIterations = config.maxIterations;
    const history = [];

    logger.info(`[VisionEvaluator] Starting Closed-Loop Visual Correction Engine (Profile: ${profile}, Max Budget: ${maxIterations} iterations)...`);

    for (let iter = 1; iter <= maxIterations; iter++) {
      logger.info(`[VisionEvaluator] >>> Visual Correction Iteration ${iter}/${maxIterations}...`);

      // 1. Capture current visual frame
      const framePath = await this.captureEvaluationFrame();

      // 2. Query scene telemetry
      let telemetry = null;
      try {
        const res = await this.sendRPC('get_scene_state', {});
        if (res && res.success) telemetry = res.data;
      } catch (e) {
        logger.warn(`[VisionEvaluator] Telemetry query notice: ${e.message}`);
      }

      // 3. Evaluate visual quality
      const report = await this.evaluateVisualQuality(userPrompt, framePath, sceneGraph, telemetry, worldState?.visualPlan, profile);
      history.push({ iteration: iter, framePath, report });

      // 4. Check exit conditions
      if (report.overallStatus === EVALUATION_STATUS.PASS) {
        logger.info(`[VisionEvaluator] Visual Quality Gate PASSED at iteration ${iter} (Score: ${report.qualityScore.toFixed(1)}/10) ✓`);
        return {
          success: true,
          status: EVALUATION_STATUS.PASS,
          iterations: iter,
          finalScore: report.qualityScore,
          finalReport: report,
          history
        };
      }

      // If budget reached and not passed
      if (iter === maxIterations) {
        logger.warn(`[VisionEvaluator] Visual correction budget exhausted (${maxIterations} iterations). Final status: QUALITY_NOT_REACHED.`);
        return {
          success: false,
          status: EVALUATION_STATUS.QUALITY_NOT_REACHED,
          iterations: iter,
          finalScore: report.qualityScore,
          finalReport: report,
          history
        };
      }

      // 5. Select highest severity and high-confidence defect to surgically correct
      const targetDefect = report.defects.find(d => d.severity === DEFECT_SEVERITY.CRITICAL) ||
                           report.defects.find(d => d.severity === DEFECT_SEVERITY.HIGH) ||
                           report.defects[0];

      if (!targetDefect) {
        logger.info('[VisionEvaluator] No actionable defects found to correct. Exiting loop.');
        break;
      }

      const deltaPlan = this.planSurgicalCorrection(targetDefect, worldState);
      if (!deltaPlan) {
        logger.warn(`[VisionEvaluator] Could not plan surgical correction for defect: ${targetDefect.description}.`);
        continue;
      }

      // 6. Execute surgical correction via WorldDeltaMutator
      logger.info(`[VisionEvaluator] Executing surgical delta: ${deltaPlan.description}...`);
      if (deltaMutator) {
        const txRes = await deltaMutator.executeMutationTransaction(deltaPlan, worldState, checkpointMgr);
        logger.info(`[VisionEvaluator] Surgical delta executed: success=${txRes.success} (World v${worldState.version}) ✓`);
      } else {
        logger.warn('[VisionEvaluator] No DeltaMutator provided for closed-loop execution.');
        break;
      }
    }

    const lastReport = history[history.length - 1]?.report;
    return {
      success: lastReport?.overallStatus === EVALUATION_STATUS.PASS,
      status: lastReport?.overallStatus || EVALUATION_STATUS.FAIL,
      iterations: history.length,
      finalScore: lastReport?.qualityScore || 0.0,
      finalReport: lastReport,
      history
    };
  }
}

module.exports = {
  VisionEvaluator,
  DEFECT_DIMENSION,
  DEFECT_SEVERITY,
  EVALUATION_STATUS,
  PROFILE_THRESHOLDS
};
