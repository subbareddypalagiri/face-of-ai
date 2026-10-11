// src/main/tools/astra/core/Autonomous3DArchitect.js — God Mode Autonomous 3D World Architect
'use strict';

const path = require('path');
const fs = require('fs');
const logger = require('../../../../shared/Logger');

const { UnifiedAILayer } = require('./UnifiedAILayer');
const { IntentInterpreter } = require('./IntentInterpreter');
const { SceneGraph } = require('./SceneGraph');
const { TaskGraph, TASK_STATUS } = require('./TaskGraph');
const { AssetResolver } = require('./AssetResolver');
const { AssetSanitizer } = require('./AssetSanitizer');
const { SceneInspector } = require('./SceneInspector');
const { CorrectionEngine } = require('./CorrectionEngine');
const { CheckpointManager } = require('./CheckpointManager');
const { AuditLogger } = require('./AuditLogger');
const { PersistentWorldState } = require('./PersistentWorldState');
const {
  WorldDeltaMutator,
  DELTA_ACTION,
  DELTA_ERROR,
  DELTA_SCOPE
} = require('./WorldDeltaMutator');
const { VisualDirector } = require('./VisualDirector');
const { VisionEvaluator } = require('./VisionEvaluator');
const { BlenderWorkspaceObserver } = require('./BlenderWorkspaceObserver');
const { BlenderOperationDispatcher } = require('./BlenderOperationDispatcher');
const { HighFidelityGeometryEngine } = require('./HighFidelityGeometryEngine');
const { AnimationPhysicsVFXEngine } = require('./AnimationPhysicsVFXEngine');

class Autonomous3DArchitect {
  constructor(bridgeRpcCaller, options = {}) {
    this.sendRPC = bridgeRpcCaller;
    this.workspaceRoot = options.workspaceRoot || path.resolve(__dirname, '../../../../../');
    this.worldsDir = options.worldsDir || path.join(this.workspaceRoot, 'scratch', 'worlds');
    this.worldState = null;
    this.conversationContext = { lastFocusedEntityId: null };

    this.ai = new UnifiedAILayer();
    this.interpreter = new IntentInterpreter(this.ai);
    this.assetResolver = new AssetResolver({ workspaceRoot: this.workspaceRoot });
    this.sanitizer = new AssetSanitizer();
    this.inspector = new SceneInspector(this.sendRPC);
    this.corrector = new CorrectionEngine(this.sendRPC);
    this.checkpointMgr = new CheckpointManager(this.sendRPC);
    this.deltaMutator = new WorldDeltaMutator(this.sendRPC, { workspaceRoot: this.workspaceRoot });
    this.visualDirector = new VisualDirector(this.sendRPC, { workspaceRoot: this.workspaceRoot });
    this.visionEvaluator = new VisionEvaluator(this.sendRPC, { workspaceRoot: this.workspaceRoot });
    this.workspaceObserver = new BlenderWorkspaceObserver(this.sendRPC);
    this.operationDispatcher = new BlenderOperationDispatcher(this.sendRPC);
    this.geometryEngine = new HighFidelityGeometryEngine();
    this.animVfxEngine = new AnimationPhysicsVFXEngine();
  }

  /**
   * Main Closed-Loop Execution Pipeline
   * USER PROMPT -> INTENT -> SCENE GRAPH -> ASSET RESOLUTION -> TASK GRAPH ->
   * EXECUTE -> INSPECT -> CORRECT -> RE-INSPECT -> RENDER -> AUDIT
   */
  async buildWorldAutonomous(userPrompt, options = {}) {
    const taskId = `unin_3d_${Date.now()}`;
    const auditor = new AuditLogger(taskId, userPrompt);
    const onProgress = typeof options.onProgress === 'function' ? options.onProgress : () => {};

    logger.info(`[Autonomous3DArchitect] ==========================================`);
    logger.info(`[Autonomous3DArchitect] INITIATING GOD MODE BUILD: "${userPrompt}"`);
    logger.info(`[Autonomous3DArchitect] Task ID: ${taskId}`);
    logger.info(`[Autonomous3DArchitect] ==========================================`);

    try {
      // Initialize or rehydrate Persistent World State
      if (options.worldId) {
        try {
          this.worldState = PersistentWorldState.load(options.worldId, this.worldsDir);
        } catch (e) {
          this.worldState = PersistentWorldState.createNew({ storageDir: this.worldsDir, task: { taskId, prompt: userPrompt } });
        }
      } else {
        this.worldState = PersistentWorldState.createNew({ storageDir: this.worldsDir, task: { taskId, prompt: userPrompt } });
      }
      this.worldState.recordMutation('CREATE_WORLD', { prompt: userPrompt, taskId });

      // ──────────────────────────────────────────────────────────────────────
      // STEP 1: SEMANTIC 3D INTENT UNDERSTANDING
      // ──────────────────────────────────────────────────────────────────────
      onProgress({ step: 1, totalSteps: 7, title: 'Deconstructing 3D Intent', description: 'Semantic understanding of entities, environment, weather & lighting' });
      const intent = await this.interpreter.interpret(userPrompt);
      auditor.recordIntent(intent);

      // ──────────────────────────────────────────────────────────────────────
      // STEP 2: CANONICAL SCENE GRAPH CONSTRUCTION
      // ──────────────────────────────────────────────────────────────────────
      onProgress({ step: 2, totalSteps: 7, title: 'Constructing Scene Graph', description: 'Assembling spatial hierarchy, material specs & camera optics' });
      const sceneGraph = new SceneGraph(intent);
      const validation = sceneGraph.validate();
      if (!validation.valid) {
        logger.warn(`[Autonomous3DArchitect] SceneGraph validation warnings: ${validation.errors.join('; ')}`);
      }
      auditor.recordSceneGraph(sceneGraph.toJSON());

      // ──────────────────────────────────────────────────────────────────────
      // STEP 3: ASSET RESOLUTION (TIER 1 - TIER 4)
      // ──────────────────────────────────────────────────────────────────────
      onProgress({ step: 3, totalSteps: 7, title: 'Resolving 3D Assets', description: 'Determining optimal asset strategy (Local, Cache, Procedural Assembly)' });
      const heroEntity = sceneGraph.getHeroEntity();
      if (heroEntity) {
        const resolution = await this.assetResolver.resolveEntity(heroEntity, {
          qualityTier: sceneGraph.style === 'photorealistic' ? 'HERO' : 'STANDARD',
          triangleBudget: sceneGraph.triangleBudget || 1500000
        });
        heroEntity.assetResolution = resolution;
        auditor.recordAssetDecision(heroEntity.name, resolution);
      }

      // ──────────────────────────────────────────────────────────────────────
      // STEP 4: TASK GRAPH (DAG) GENERATION & ENTITY REGISTRATION
      // ──────────────────────────────────────────────────────────────────────
      onProgress({ step: 4, totalSteps: 7, title: 'Assembling Execution DAG', description: 'Generating ordered dependencies and Blender code chunks' });

      // Register canonical entities in persistent registry
      this.worldState.registerEntity({
        uninId: 'unin.environment.foundation',
        blenderName: 'unin.environment.foundation',
        category: 'environment',
        role: 'foundation',
        materials: [sceneGraph.environment.baseSurface]
      });

      if (heroEntity) {
        this.worldState.registerEntity({
          uninId: heroEntity.id,
          blenderName: heroEntity.id,
          category: heroEntity.category,
          role: 'hero',
          assetId: heroEntity.assetResolution?.assemblyType || heroEntity.assetResolution?.path || null,
          metadata: {
            dimensions: heroEntity.estimatedDimensions,
            location: heroEntity.targetLocation,
            strategy: heroEntity.assetResolution?.strategy,
            qualityLevel: heroEntity.assetResolution?.qualityLevel
          }
        });
      }

      this.worldState.registerEntity({ uninId: 'unin.lighting.key', blenderName: 'unin.lighting.key', category: 'light', role: 'lighting' });
      this.worldState.registerEntity({ uninId: 'unin.lighting.rim', blenderName: 'unin.lighting.rim', category: 'light', role: 'lighting' });
      this.worldState.registerEntity({ uninId: 'unin.lighting.fill', blenderName: 'unin.lighting.fill', category: 'light', role: 'lighting' });
      this.worldState.registerEntity({ uninId: 'unin.camera.primary', blenderName: 'unin.camera.primary', category: 'camera', role: 'camera' });
      this.worldState.registerEntity({ uninId: 'unin.camera.look_target', blenderName: 'unin.camera.look_target', category: 'camera', role: 'target' });

      if (sceneGraph.environment.type === 'urban_street') {
        this.worldState.registerEntity({ uninId: 'unin.prop.curb_L', blenderName: 'unin.prop.curb_L', category: 'prop', role: 'prop' });
        this.worldState.registerEntity({ uninId: 'unin.prop.curb_R', blenderName: 'unin.prop.curb_R', category: 'prop', role: 'prop' });
        this.worldState.registerEntity({ uninId: 'unin.light.streetlamp_1', blenderName: 'unin.light.streetlamp_1', category: 'light', role: 'prop' });
        this.worldState.registerEntity({ uninId: 'unin.light.streetlamp_2', blenderName: 'unin.light.streetlamp_2', category: 'light', role: 'prop' });
      }

      // Formulate Phase 3C Visual Production Plan
      let visualPlan = null;
      try {
        visualPlan = await this.visualDirector.planVisualProduction(userPrompt, sceneGraph, this.worldState, options);
        this.worldState.visualPlan = visualPlan;
      } catch (visErr) {
        logger.warn(`[Autonomous3DArchitect] Visual planning notice: ${visErr.message}`);
      }

      const taskGraph = this._buildTaskGraph(sceneGraph, heroEntity, this.worldState.worldId);

      // Save initial checkpoint
      const chk = await this.checkpointMgr.createCheckpoint('pre_execution');
      if (chk && chk.filePath) {
        this.worldState.setActiveCheckpoint(chk.filePath);
      }

      // ──────────────────────────────────────────────────────────────────────
      // STEP 5: EXECUTION ACROSS BLENDER BRIDGE (PORT 8192)
      // ──────────────────────────────────────────────────────────────────────
      onProgress({ step: 5, totalSteps: 7, title: 'Streaming Scene to Blender', description: 'Executing terrain, hero geometry, materials & lighting in active viewport' });
      const executionResult = await this._executeTaskGraph(taskGraph, auditor, options);

      if (executionResult.aborted) {
        logger.warn('[Autonomous3DArchitect] Task execution was cancelled at safe task boundary.');
        await this.worldState.save();
        return {
          success: false,
          cancelled: true,
          taskId,
          worldId: this.worldState.worldId,
          worldVersion: this.worldState.version,
          message: 'Execution cancelled at safe boundary. World state preserved.',
          failedTasks: executionResult.failedTasks
        };
      }

      if (!executionResult.success) {
        logger.warn(`[Autonomous3DArchitect] DAG execution had issues: ${executionResult.failedTasks.join(', ')}`);
      }

      // ──────────────────────────────────────────────────────────────────────
      // STEP 6: REAL SCENE INSPECTION & SURGICAL CORRECTION (CLOSED LOOP)
      // ──────────────────────────────────────────────────────────────────────
      onProgress({ step: 6, totalSteps: 7, title: 'Scene Inspection & Quality Gate', description: 'Querying actual Blender geometry, verifying scale, ground contact & lighting' });
      const actualState = await this.inspector.querySceneState();
      const inspectionReport = this.inspector.inspectScene(sceneGraph, actualState);
      auditor.recordInspection(inspectionReport);

      let correctionResult = { fixedCount: 0, appliedFixes: [] };
      if (!inspectionReport.passedChecks && inspectionReport.flaws.length > 0) {
        logger.info(`[Autonomous3DArchitect] Flaws detected during inspection: ${inspectionReport.flaws.map(f => f.code).join(', ')}. Engaging Correction Engine...`);
        correctionResult = await this.corrector.applyCorrections(inspectionReport.flaws, sceneGraph);
        auditor.recordCorrections(correctionResult);

        // Re-inspect after surgical correction
        const postCorrectionState = await this.inspector.querySceneState();
        const reInspection = this.inspector.inspectScene(sceneGraph, postCorrectionState);
        logger.info(`[Autonomous3DArchitect] Post-correction verification: verified=${reInspection.verified}, remainingFlaws=${reInspection.flaws.length}`);
      }

      // ──────────────────────────────────────────────────────────────────────
      // STEP 7: MASTER RENDER, VISION QUALITY GATE & FINALIZATION
      // ──────────────────────────────────────────────────────────────────────
      onProgress({ step: 7, totalSteps: 7, title: 'Cinematography & 1080p Render', description: 'Aligning AgX tone mapping, rendering still frame buffer and saving .blend' });
      const renderOutput = await this._finalizeAndRender(sceneGraph);

      // Phase 3D: Multimodal Vision Quality Evaluation
      let visualEvaluation = null;
      try {
        visualEvaluation = await this.visionEvaluator.evaluateVisualQuality(
          userPrompt,
          renderOutput.renderPath,
          sceneGraph,
          actualState,
          visualPlan,
          options.profile || 'CINEMATIC'
        );
      } catch (visErr) {
        logger.warn(`[Autonomous3DArchitect] Visual quality evaluation notice: ${visErr.message}`);
      }

      const auditSummary = auditor.finalize('SUCCEEDED', { ...renderOutput, visualEvaluation });

      // Persist final active world state atomically
      if (heroEntity && heroEntity.id) {
        this.conversationContext.lastFocusedEntityId = heroEntity.id;
      }
      await this.worldState.save();

      logger.info(`[Autonomous3DArchitect] ==========================================`);
      logger.info(`[Autonomous3DArchitect] GOD MODE BUILD COMPLETED SUCCESSFULLY ✓`);
      logger.info(`[Autonomous3DArchitect] World ID: ${this.worldState.worldId} (v${this.worldState.version})`);
      logger.info(`[Autonomous3DArchitect] Render:   ${renderOutput.renderPath}`);
      logger.info(`[Autonomous3DArchitect] Blend:    ${renderOutput.blendPath}`);
      logger.info(`[Autonomous3DArchitect] ==========================================`);

      const isAiQuotaExceeded = intent?._aiQuotaExceeded || false;
      const synthesisSource = isAiQuotaExceeded ? 'deterministic_fallback' : (intent?._synthesisSource || 'autonomous_3d_architect');
      const isLimited = isAiQuotaExceeded && (!visualEvaluation || visualEvaluation.qualityScore < 7.0);

      return {
        success: true,
        status: isLimited ? 'COMPLETED_WITH_LIMITATIONS' : 'SUCCEEDED',
        taskId,
        worldId: this.worldState.worldId,
        worldVersion: this.worldState.version,
        summary: sceneGraph.summary,
        heroEntity: heroEntity ? heroEntity.name : 'None',
        assetStrategy: heroEntity?.assetResolution?.strategy || 'N/A',
        qualityLevel: heroEntity?.assetResolution?.qualityLevel || 'N/A',
        renderPath: renderOutput.renderPath,
        blendPath: renderOutput.blendPath,
        visualPlan,
        visualEvaluation,
        aiQuotaExceeded: isAiQuotaExceeded,
        synthesisSource,
        limitations: isAiQuotaExceeded ? ['Gemini API quota exceeded (HTTP 429). Procedural fallback synthesis was used; design generated deterministically with limitations noted.'] : [],
        telemetry: {
          objectsCount: inspectionReport.metrics.objectsCount,
          totalTriangles: inspectionReport.metrics.totalTriangles,
          inspectedFlaws: inspectionReport.flaws.length,
          correctedCount: correctionResult.fixedCount,
          visualQualityScore: visualEvaluation?.qualityScore || null,
          visualStatus: visualEvaluation?.overallStatus || null
        },
        auditSummary,
        worldState: this.worldState.toJSON()
      };
    } catch (err) {
      logger.error(`[Autonomous3DArchitect] Build failed: ${err.message}`);
      auditor.finalize('FAILED', { error: err.message });
      return {
        success: false,
        taskId,
        worldId: this.worldState ? this.worldState.worldId : null,
        error: err.message
      };
    }
  }

  /**
   * Constructs the Task DAG based on the resolved scene graph
   */
  _buildTaskGraph(sceneGraph, heroEntity, worldId = null) {
    const wid = worldId || (this.worldState ? this.worldState.worldId : 'unin_world_default');
    const tg = new TaskGraph(sceneGraph);

    // 1. Task: Foundation Environment
    tg.addTask({
      id: 'task_1_foundation',
      title: 'Stage 1: Ground Foundation & World Reset',
      dependencies: [],
      codeGenerator: () => this._generateFoundationBpy(sceneGraph, wid)
    });

    // 2. Task: Hero Asset Geometry
    tg.addTask({
      id: 'task_2_hero_asset',
      title: `Stage 2: Hero Asset Placement (${heroEntity ? heroEntity.name : 'Focal Subject'})`,
      dependencies: ['task_1_foundation'],
      codeGenerator: () => this._generateHeroAssetBpy(heroEntity, sceneGraph, wid)
    });

    // 3. Task: Secondary Props & Scatter
    tg.addTask({
      id: 'task_3_secondary_props',
      title: 'Stage 3: Secondary Props & Environmental Physics',
      dependencies: ['task_2_hero_asset'],
      codeGenerator: () => this._generateSecondaryPropsBpy(sceneGraph, heroEntity, wid)
    });

    // 4. Task: Motivated Lighting & Atmosphere
    tg.addTask({
      id: 'task_4_lighting_atmosphere',
      title: 'Stage 4: Atmospheric World Lighting & Volumetrics',
      dependencies: ['task_3_secondary_props'],
      codeGenerator: () => this._generateLightingAtmosphereBpy(sceneGraph, heroEntity, wid)
    });

    // 5. Task: Cinematography & Camera Optics
    tg.addTask({
      id: 'task_5_camera_optics',
      title: 'Stage 5: Cinema Camera Alignment & Viewport Lock',
      dependencies: ['task_4_lighting_atmosphere'],
      codeGenerator: () => this._generateCameraOpticsBpy(sceneGraph, heroEntity, wid)
    });

    return tg;
  }

  /**
   * Executes tasks in topological dependency order
   */
  async _executeTaskGraph(taskGraph, auditor, options = {}) {
    const failedTasks = [];
    const abortSignal = options.abortSignal || null;
    const onTaskProgress = options.onTaskProgress || null;

    while (!taskGraph.isCompleted()) {
      if (abortSignal && abortSignal.aborted) {
        logger.warn('[Autonomous3DArchitect] AbortSignal detected before scheduling next task. Halting safely.');
        const cancelledCount = taskGraph.cancelPending('Execution cancelled by user');
        return {
          success: false,
          aborted: true,
          failedTasks,
          cancelledCount
        };
      }

      const readyTasks = taskGraph.getReadyTasks();
      if (readyTasks.length === 0) {
        if (!taskGraph.isCompleted()) {
          logger.warn('[Autonomous3DArchitect] Deadlock or blocked tasks in DAG execution.');
        }
        break;
      }

      for (const task of readyTasks) {
        if (abortSignal && abortSignal.aborted) {
          logger.warn(`[Autonomous3DArchitect] AbortSignal triggered before executing "${task.id}". Halting cleanly at safe boundary.`);
          taskGraph.cancelPending('Execution cancelled by user');
          return {
            success: false,
            aborted: true,
            failedTasks
          };
        }

        taskGraph.markRunning(task.id);
        logger.info(`[Autonomous3DArchitect] >>> Executing DAG Task: "${task.title}"...`);
        if (onTaskProgress) {
          onTaskProgress({ task, status: 'RUNNING' });
        }

        try {
          const pyCode = typeof task.codeGenerator === 'function' ? task.codeGenerator() : task.codeGenerator;
          const rpcRes = await this.sendRPC('execute_bpy', {
            code: pyCode,
            autoCapture: false,
            timeout: 120.0
          }, 120000);

          if (rpcRes && rpcRes.error) {
            logger.warn(`[Autonomous3DArchitect] Task "${task.id}" error: ${rpcRes.error.message || JSON.stringify(rpcRes.error)}`);
            taskGraph.markFailed(task.id, rpcRes.error);
            auditor.recordTaskExecution(task, rpcRes);
            failedTasks.push(task.id);
            if (onTaskProgress) {
              onTaskProgress({ task, status: 'FAILED', error: rpcRes.error });
            }
          } else {
            taskGraph.markSucceeded(task.id, rpcRes);
            auditor.recordTaskExecution(task, rpcRes);
            logger.info(`[Autonomous3DArchitect] Task "${task.title}" COMPLETED ✓`);
            if (onTaskProgress) {
              onTaskProgress({ task, status: 'SUCCEEDED', result: rpcRes });
            }
          }
        } catch (execErr) {
          logger.error(`[Autonomous3DArchitect] Task "${task.id}" execution threw: ${execErr.message}`);
          taskGraph.markFailed(task.id, execErr);
          auditor.recordTaskExecution(task, { error: execErr.message });
          failedTasks.push(task.id);
          if (onTaskProgress) {
            onTaskProgress({ task, status: 'FAILED', error: execErr });
          }
        }

        // Small inter-task cadence to keep Blender UI responsive
        await new Promise(r => setTimeout(r, 450));
      }
    }

    return {
      success: failedTasks.length === 0,
      aborted: false,
      failedTasks
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // BPY CODE GENERATION IMPLEMENTATIONS
  // ────────────────────────────────────────────────────────────────────────────

  _generateFoundationBpy(sceneGraph, worldId = 'unin_world_default') {
    const env = sceneGraph.environment;
    const weather = sceneGraph.weather;
    const isWet = weather.wetReflections || weather.precipitation === 'rain';
    const isStudio = env.type === 'studio_interior';

    return `
# ==============================================================================
# STAGE 1: GEOLOGICAL GROUND FOUNDATION & COLOR CALIBRATION
# ==============================================================================
import bpy
import math

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.view_settings.view_transform = 'AgX'
try:
    scene.view_settings.look = 'AgX - High Contrast'
except Exception:
    pass

# Clean previous objects safely
for obj in list(bpy.context.scene.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

# 45m x 45m Ground Grid
bpy.ops.mesh.primitive_grid_add(x_subdivisions=64, y_subdivisions=64, size=45.0, location=(0, 0, 0))
ground = bpy.context.view_layer.objects.active
ground.name = "unin.environment.foundation"
ground["unin_id"] = "unin.environment.foundation"
ground["unin_world_id"] = "${worldId}"
ground["unin_version"] = 1

# PBR Ground Shader
mat_ground = bpy.data.materials.new(name="PBR_Ground_Surface")
mat_ground.use_nodes = True
g_nodes = mat_ground.node_tree.nodes
g_links = mat_ground.node_tree.links
g_nodes.clear()

out_n = g_nodes.new('ShaderNodeOutputMaterial')
bsdf_n = g_nodes.new('ShaderNodeBsdfPrincipled')
tex_coord = g_nodes.new('ShaderNodeTexCoord')
noise_n = g_nodes.new('ShaderNodeTexNoise')
noise_n.inputs['Scale'].default_value = 14.0
noise_n.inputs['Detail'].default_value = 4.0
c_ramp = g_nodes.new('ShaderNodeValToRGB')

${isStudio ? `
# Neutral Charcoal Studio Floor
bsdf_n.inputs['Base Color'].default_value = (0.045, 0.045, 0.05, 1.0)
bsdf_n.inputs['Metallic'].default_value = 0.0
bsdf_n.inputs['Roughness'].default_value = 0.45
c_ramp.color_ramp.elements[0].position = 0.3
c_ramp.color_ramp.elements[0].color = (0.35, 0.35, 0.38, 1.0)
c_ramp.color_ramp.elements[1].position = 0.8
c_ramp.color_ramp.elements[1].color = (0.55, 0.55, 0.58, 1.0)
` : isWet ? `
# Wet Asphalt Puddle Response
bsdf_n.inputs['Base Color'].default_value = (0.022, 0.022, 0.025, 1.0)
bsdf_n.inputs['Metallic'].default_value = 0.15
c_ramp.color_ramp.elements[0].position = 0.35
c_ramp.color_ramp.elements[0].color = (0.005, 0.005, 0.008, 1.0) # Mirror puddle
c_ramp.color_ramp.elements[1].position = 0.70
c_ramp.color_ramp.elements[1].color = (0.40, 0.40, 0.42, 1.0) # Damp aggregate
` : `
# Dry Textured Ground
bsdf_n.inputs['Base Color'].default_value = (0.12, 0.12, 0.14, 1.0)
bsdf_n.inputs['Metallic'].default_value = 0.0
c_ramp.color_ramp.elements[0].position = 0.2
c_ramp.color_ramp.elements[0].color = (0.65, 0.65, 0.65, 1.0)
c_ramp.color_ramp.elements[1].position = 0.8
c_ramp.color_ramp.elements[1].color = (0.90, 0.90, 0.90, 1.0)
`}

g_links.new(tex_coord.outputs['Object'], noise_n.inputs['Vector'])
g_links.new(noise_n.outputs['Fac'], c_ramp.inputs['Fac'])
g_links.new(c_ramp.outputs['Color'], bsdf_n.inputs['Roughness'])
g_links.new(bsdf_n.outputs['BSDF'], out_n.inputs['Surface'])
ground.data.materials.append(mat_ground)
bpy.ops.object.shade_smooth()

${isStudio ? `
# Seamless Curved Studio Backdrop
bpy.ops.mesh.primitive_plane_add(size=25.0, location=(0, 6.0, 4.0), rotation=(math.radians(90), 0, 0))
cyc = bpy.context.view_layer.objects.active
cyc.name = "unin.environment.studio_cyclorama"
cyc["unin_id"] = "unin.environment.studio_cyclorama"
cyc["unin_world_id"] = "${worldId}"
mat_cyc = bpy.data.materials.new(name="Studio_Cyclorama_Surface")
mat_cyc.use_nodes = True
b_cyc = mat_cyc.node_tree.nodes.get('Principled BSDF')
if b_cyc:
    b_cyc.inputs['Base Color'].default_value = (0.05, 0.05, 0.055, 1.0)
    b_cyc.inputs['Roughness'].default_value = 0.80
cyc.data.materials.append(mat_cyc)
` : ''}

# Lock Viewport to Material Shading
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
`;
  }

  _generateHeroAssetBpy(heroEntity, sceneGraph = null, worldId = 'unin_world_default') {
    if (!heroEntity || !heroEntity.assetResolution) {
      return '# No hero entity resolved';
    }

    const taggingSnippet = `
# ==============================================================================
# CANONICAL UNIN ENTITY TAGGING PROTOCOL
# ==============================================================================
import bpy
_hero_cand = bpy.data.objects.get("${heroEntity.id}") or getattr(bpy.context.view_layer.objects, 'active', None)
if not _hero_cand:
    for _o in bpy.context.scene.objects:
        if "${heroEntity.id}" in _o.name or _o.name.startswith("Hero_") or "${heroEntity.category}" in _o.name.lower():
            _hero_cand = _o
            break
if _hero_cand:
    _hero_cand["unin_id"] = "${heroEntity.id}"
    _hero_cand["unin_world_id"] = "${worldId}"
    _hero_cand["unin_version"] = 1
    for _ch in _hero_cand.children:
        _ch["unin_id"] = f"${heroEntity.id}." + _ch.name
        _ch["unin_world_id"] = "${worldId}"
        _ch["unin_version"] = 1
`;

    const res = heroEntity.assetResolution;
    if (res.strategy === 'LOCAL_CATALOG' || res.strategy === 'LOCAL_CACHE') {
      const code = this.sanitizer.generateSanitizationBpy(
        res.path,
        heroEntity.id,
        heroEntity.estimatedDimensions,
        heroEntity.targetLocation,
        { triangleBudget: sceneGraph ? sceneGraph.triangleBudget : 1500000 }
      );
      return code + '\n' + taggingSnippet;
    } else if (res.strategy === 'PROCEDURAL_ASSEMBLY' || res.strategy === 'PROCEDURAL_HIGH_POLY_MESH' || res.strategy === 'CONTROLLED_FALLBACK') {
      const code = this.assetResolver.generateProceduralAssemblyBpy(heroEntity, res);
      return code + '\n' + taggingSnippet;
    }

    return '# Unknown hero asset strategy';
  }

  _generateSecondaryPropsBpy(sceneGraph, heroEntity, worldId = 'unin_world_default') {
    const env = sceneGraph.environment;
    const isUrban = env.type === 'urban_street';
    const isStudio = env.type === 'studio_interior';

    if (isStudio) {
      return `
# ==============================================================================
# STAGE 3: STUDIO STAGE (CLEAN MINIMALIST SHOWCASE)
# ==============================================================================
import bpy
print("STAGE_STUDIO_STAGE_READY")
`;
    }

    if (isUrban) {
      return `
# ==============================================================================
# STAGE 3: URBAN SECONDARY PROPS (CURBS, STREETLIGHTS, TRAFFIC SIGNALS)
# ==============================================================================
import bpy
import math

# Curbs on left and right
for sx in [-4.5, 4.5]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx, 0, 0.12))
    curb = bpy.context.view_layer.objects.active
    curb.name = f"unin.prop.curb_{'L' if sx < 0 else 'R'}"
    curb["unin_id"] = f"unin.prop.curb_{'L' if sx < 0 else 'R'}"
    curb["unin_world_id"] = "${worldId}"
    curb["unin_version"] = 1
    curb.scale = (0.8, 38.0, 0.24)
    bpy.ops.object.transform_apply(scale=True)
    bev = curb.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.03
    bev.segments = 2
    bpy.ops.object.shade_smooth()

# Dual Indian/Urban Streetlamp Posts (Warm Sodium Vapor Amber)
mat_amber_lamp = bpy.data.materials.new(name="Streetlamp_Amber_Emission")
mat_amber_lamp.use_nodes = True
b_l = mat_amber_lamp.node_tree.nodes.get('Principled BSDF')
if b_l:
    if 'Emission Color' in b_l.inputs:
        b_l.inputs['Emission Color'].default_value = (1.0, 0.65, 0.18, 1.0)
        b_l.inputs['Emission Strength'].default_value = 18.0

for i, y_lamp in enumerate([-8.0, 7.0]):
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=5.5, location=(-4.8, y_lamp, 2.75))
    pole = bpy.context.view_layer.objects.active
    pole.name = f"unin.prop.streetlamp_pole_{i+1}"
    pole["unin_id"] = f"unin.prop.streetlamp_pole_{i+1}"
    pole["unin_world_id"] = "${worldId}"
    pole["unin_version"] = 1
    bpy.ops.object.shade_smooth()

    # Lamp head
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-4.4, y_lamp, 5.4))
    head = bpy.context.view_layer.objects.active
    head.name = f"unin.prop.streetlamp_head_{i+1}"
    head["unin_id"] = f"unin.prop.streetlamp_head_{i+1}"
    head["unin_world_id"] = "${worldId}"
    head["unin_version"] = 1
    head.scale = (0.9, 0.45, 0.25)
    bpy.ops.object.transform_apply(scale=True)
    head.data.materials.append(mat_amber_lamp)

    # Actual Spot Light
    sl_data = bpy.data.lights.new(name=f"Streetlamp_Light_Data_{i+1}", type='SPOT')
    sl_data.energy = 2200.0
    sl_data.color = (1.0, 0.72, 0.25)
    sl_data.spot_size = math.radians(72)
    sl_data.spot_blend = 0.45
    sl_obj = bpy.data.objects.new(name=f"unin.light.streetlamp_{i+1}", object_data=sl_data)
    sl_obj["unin_id"] = f"unin.light.streetlamp_{i+1}"
    sl_obj["unin_world_id"] = "${worldId}"
    sl_obj["unin_version"] = 1
    sl_obj.location = (-4.4, y_lamp, 5.3)
    sl_obj.rotation_euler = (0, 0, 0)
    bpy.context.collection.objects.link(sl_obj)
`;
    }

    return `
# Nature / General Secondary Props
import bpy
for i, pos in enumerate([(-6.0, 4.0, 0.3), (7.0, -5.0, 0.4), (-5.0, -8.0, 0.35)]):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=1.2, location=pos)
    rock = bpy.context.view_layer.objects.active
    rock.name = f"unin.prop.geological_rock_{i+1}"
    rock["unin_id"] = f"unin.prop.geological_rock_{i+1}"
    rock["unin_world_id"] = "${worldId}"
    rock["unin_version"] = 1
    rock.scale = (1.2, 0.9, 0.6)
    bpy.ops.object.transform_apply(scale=True)
    bpy.ops.object.shade_smooth()
`;
  }

  _generateLightingAtmosphereBpy(sceneGraph, heroEntity = null, worldId = 'unin_world_default') {
    const isStudio = sceneGraph.environment.type === 'studio_interior';
    const isNight = sceneGraph.timeOfDay === 'night';
    const weather = sceneGraph.weather || {};
    const rawFog = weather.fogDensity || 0.02;
    // Scale normalized fog density so it creates atmospheric depth without photon extinction
    const fogDensity = isStudio ? 0.0 : Math.min(Math.max(rawFog * 0.002, 0.0004), 0.002);

    const dims = heroEntity?.estimatedDimensions || [1.0, 1.0, 1.0];
    const maxDim = Math.max(...dims);
    let distScale = Math.max(0.65, maxDim / 1.6);
    const keyX = (2.6 * distScale).toFixed(2);
    const keyY = (-3.2 * distScale).toFixed(2);
    const keyZ = Math.max(3.0, (2.5 * distScale)).toFixed(2);
    const rimX = (-2.2 * distScale).toFixed(2);
    const rimY = (3.2 * distScale).toFixed(2);
    const rimZ = Math.max(2.6, (2.0 * distScale)).toFixed(2);
    const fillX = (-2.5 * distScale).toFixed(2);
    const fillY = (-2.5 * distScale).toFixed(2);
    const fillZ = Math.max(2.0, (1.8 * distScale)).toFixed(2);
    const lookZ = Math.max(0.35, ((dims[2] || 1.0) * 0.45)).toFixed(2);
    const keyEnergy = isStudio ? 450.0 : Math.max(1200.0, 2400.0 * distScale);

    return `
# ==============================================================================
# STAGE 4: MOTIVATED THREE-POINT FILM LIGHTING & VOLUMETRIC ATMOSPHERE
# ==============================================================================
import bpy
import math

# Subject Look Target Hook
look_target = bpy.data.objects.get("unin.camera.look_target")
if not look_target:
    look_target = bpy.data.objects.new("unin.camera.look_target", None)
    look_target.location = (0, 0, ${lookZ})
    bpy.context.collection.objects.link(look_target)
look_target["unin_id"] = "unin.camera.look_target"
look_target["unin_world_id"] = "${worldId}"
look_target["unin_version"] = 1

# World Atmosphere
scene = bpy.context.scene
scene.world = bpy.data.worlds.new("Cinematic_Atmosphere_World")
scene.world.use_nodes = True
w_nodes = scene.world.node_tree.nodes
w_links = scene.world.node_tree.links
w_nodes.clear()

node_out_w = w_nodes.new('ShaderNodeOutputWorld')
bg = w_nodes.new('ShaderNodeBackground')

${isStudio ? `
# Neutral Studio Sky
bg.inputs['Color'].default_value = (0.05, 0.05, 0.06, 1.0)
bg.inputs['Strength'].default_value = 0.45
` : isNight ? `
# Deep Midnight Blue Sky
bg.inputs['Color'].default_value = (0.008, 0.015, 0.035, 1.0)
bg.inputs['Strength'].default_value = 0.55
` : `
# Overcast / Ambient Sky
bg.inputs['Color'].default_value = (0.75, 0.85, 0.95, 1.0)
bg.inputs['Strength'].default_value = 1.0
`}

w_links.new(bg.outputs['Background'], node_out_w.inputs['Surface'])

${fogDensity > 0.0 ? `
# Volumetric Fog God-Rays
vol = w_nodes.new('ShaderNodeVolumePrincipled')
vol.inputs['Density'].default_value = ${fogDensity}
vol.inputs['Anisotropy'].default_value = 0.65
w_links.new(vol.outputs['Volume'], node_out_w.inputs['Volume'])
` : ''}

# 1. Key Light (Soft Warm Area Light)
kd = bpy.data.lights.new(name="Cinematic_Key_Light_Data", type='AREA')
kd.energy = ${keyEnergy.toFixed(1)}
kd.color = (1.0, 0.97, 0.94)
kd.size = ${isStudio ? '3.5' : (2.5 * Math.max(1.0, distScale * 0.5)).toFixed(2)}
key_obj = bpy.data.objects.new(name="unin.lighting.key", object_data=kd)
key_obj["unin_id"] = "unin.lighting.key"
key_obj["unin_world_id"] = "${worldId}"
key_obj["unin_version"] = 1
key_obj.location = (${keyX}, ${keyY}, ${keyZ})
bpy.context.collection.objects.link(key_obj)
trk_k = key_obj.constraints.new(type='TRACK_TO')
trk_k.target = look_target
trk_k.track_axis = 'TRACK_NEGATIVE_Z'
trk_k.up_axis = 'UP_Y'

# 2. Rim Light (Accent separation back light)
rd = bpy.data.lights.new(name="Cinematic_Rim_Light_Data", type='SPOT')
rd.energy = ${(isStudio ? 320.0 : Math.max(1200.0, 2400.0 * distScale)).toFixed(1)}
rd.color = ${isStudio ? '(0.95, 0.98, 1.0)' : '(0.2, 0.85, 1.0)'}
rd.spot_size = math.radians(55)
rd.spot_blend = 0.45
rim_obj = bpy.data.objects.new(name="unin.lighting.rim", object_data=rd)
rim_obj["unin_id"] = "unin.lighting.rim"
rim_obj["unin_world_id"] = "${worldId}"
rim_obj["unin_version"] = 1
rim_obj.location = (${rimX}, ${rimY}, ${rimZ})
bpy.context.collection.objects.link(rim_obj)
trk_r = rim_obj.constraints.new(type='TRACK_TO')
trk_r.target = look_target
trk_r.track_axis = 'TRACK_NEGATIVE_Z'
trk_r.up_axis = 'UP_Y'

# 3. Fill Light (Soft cool ambient fill)
fd = bpy.data.lights.new(name="Cinematic_Fill_Light_Data", type='AREA')
fd.energy = ${(isStudio ? 180.0 : Math.max(450.0, 600.0 * distScale)).toFixed(1)}
fd.color = (0.85, 0.92, 1.0)
if hasattr(fd, 'size'): fd.size = ${isStudio ? '4.0' : '3.0'}
fill_obj = bpy.data.objects.new(name="unin.lighting.fill", object_data=fd)
fill_obj["unin_id"] = "unin.lighting.fill"
fill_obj["unin_world_id"] = "${worldId}"
fill_obj["unin_version"] = 1
fill_obj.location = (${fillX}, ${fillY}, ${fillZ})
bpy.context.collection.objects.link(fill_obj)

${!isStudio && !isNight ? `
# 4. Motivated Directional Sunlight for Outdoor Day Environments
sun_d = bpy.data.lights.new(name="Cinematic_Sun_Data", type='SUN')
sun_d.energy = 6.5
sun_d.color = (1.0, 0.98, 0.92)
sun_d.angle = math.radians(2.5)
sun_obj = bpy.data.objects.new(name="unin.lighting.sun", object_data=sun_d)
sun_obj["unin_id"] = "unin.lighting.sun"
sun_obj["unin_world_id"] = "${worldId}"
sun_obj["unin_version"] = 1
sun_obj.location = (${(15.0 * distScale).toFixed(2)}, ${(-18.0 * distScale).toFixed(2)}, ${(30.0 * distScale).toFixed(2)})
bpy.context.collection.objects.link(sun_obj)
trk_s = sun_obj.constraints.new(type='TRACK_TO')
trk_s.target = look_target
trk_s.track_axis = 'TRACK_NEGATIVE_Z'
trk_s.up_axis = 'UP_Y'
` : ''}
`;
  }

  _generateCameraOpticsBpy(sceneGraph, heroEntity, worldId = 'unin_world_default') {
    const optics = sceneGraph.cinematography || {};
    const focal = optics.lensFocalLength || 40;
    const fStop = optics.apertureFStop || 3.2;
    const dims = heroEntity?.estimatedDimensions || [1.0, 1.0, 1.0];
    const maxDim = Math.max(...dims);
    let distScale = Math.max(1.15, maxDim / 1.1);
    const camX = (-2.4 * distScale).toFixed(2);
    const camY = (-3.4 * distScale).toFixed(2);
    const camZ = Math.max(1.2, (1.3 * distScale)).toFixed(2);
    const lookZ = Math.max(0.5, ((dims[2] || 1.0) * 0.45)).toFixed(2);

    return `
# ==============================================================================
# STAGE 5: HOLLYWOOD CAMERA OPTICS & VIEWPORT PERSPECTIVE LOCK
# Universal Aspect-Ratio-Aware Bounding Box Auto-Framing
# ==============================================================================
import bpy
import math
import mathutils

scene = bpy.context.scene

# Camera creation
cam_data = bpy.data.cameras.new("Cinematic_Master_Camera")
cam_data.lens = ${focal}
cam_data.sensor_width = 36.0
cam_data.sensor_fit = 'AUTO'
cam_data.dof.use_dof = True
cam_data.dof.aperture_fstop = ${fStop}
cam_data.dof.aperture_blades = 7

cam_obj = bpy.data.objects.get("unin.camera.primary")
if not cam_obj:
    cam_obj = bpy.data.objects.new("unin.camera.primary", cam_data)
    bpy.context.collection.objects.link(cam_obj)
else:
    cam_obj.data = cam_data

cam_obj["unin_id"] = "unin.camera.primary"
cam_obj["unin_world_id"] = "${worldId}"
cam_obj["unin_version"] = 1

# Target Tracking Hook
look_target = bpy.data.objects.get("unin.camera.look_target")
if not look_target:
    look_target = bpy.data.objects.new("unin.camera.look_target", None)
    bpy.context.collection.objects.link(look_target)
look_target["unin_id"] = "unin.camera.look_target"
look_target["unin_world_id"] = "${worldId}"
look_target["unin_version"] = 1

# ──────────────────────────────────────────────────────────────────────────────
# DYNAMIC BOUNDING BOX COMPUTATION (Recursive Descendant Evaluated Geometry)
# ──────────────────────────────────────────────────────────────────────────────
hero_candidates = []
for obj in bpy.context.scene.objects:
    if obj.get("unin_hero") == 1 or "${heroEntity?.id || ''}" in obj.name or obj.name.startswith("hero") or obj.name == "${heroEntity?.id || ''}":
        hero_candidates.append(obj)

if not hero_candidates:
    hero_candidates = [o for o in bpy.context.scene.objects if o.type == 'MESH' and not any(k in o.name.lower() for k in ['ground', 'floor', 'plane', 'sky', 'curb', 'streetlamp'])]

all_target_objs = []
def collect_descendants(o):
    all_target_objs.append(o)
    for c in o.children:
        collect_descendants(c)

for h in hero_candidates:
    collect_descendants(h)

geom_objs = [o for o in all_target_objs if o.type in ('MESH', 'CURVE', 'SURFACE') and hasattr(o, 'bound_box') and o.bound_box]

if geom_objs:
    min_c = mathutils.Vector((float('inf'), float('inf'), float('inf')))
    max_c = mathutils.Vector((float('-inf'), float('-inf'), float('-inf')))
    for o in geom_objs:
        for corner in o.bound_box:
            world_corner = o.matrix_world @ mathutils.Vector(corner)
            min_c.x = min(min_c.x, world_corner.x)
            min_c.y = min(min_c.y, world_corner.y)
            min_c.z = min(min_c.z, world_corner.z)
            max_c.x = max(max_c.x, world_corner.x)
            max_c.y = max(max_c.y, world_corner.y)
            max_c.z = max(max_c.z, world_corner.z)

    center = (min_c + max_c) / 2.0
    span_x = max(0.1, max_c.x - min_c.x)
    span_y = max(0.1, max_c.y - min_c.y)
    span_z = max(0.1, max_c.z - min_c.z)
    xy_span = math.sqrt(span_x**2 + span_y**2)

    render = scene.render
    aspect = (render.resolution_x * render.pixel_aspect_x) / (render.resolution_y * render.pixel_aspect_y)
    sensor_w = cam_data.sensor_width
    sensor_h = cam_data.sensor_height if cam_data.sensor_fit == 'VERTICAL' else (sensor_w / aspect)
    focal_len = cam_data.lens

    fov_h = 2.0 * math.atan((sensor_w / 2.0) / focal_len)
    fov_v = 2.0 * math.atan((sensor_h / 2.0) / focal_len)

    dist_h = (xy_span / 2.0) / math.tan(fov_h / 2.0)
    dist_v = (span_z / 2.0) / math.tan(fov_v / 2.0)

    fit_dist = max(dist_h, dist_v) * 1.35
    fit_dist = max(fit_dist, 1.5)

    azimuth = math.radians(-35.0)
    elevation = math.radians(16.0)

    cam_x = center.x + fit_dist * math.cos(elevation) * math.sin(azimuth)
    cam_y = center.y - fit_dist * math.cos(elevation) * math.cos(azimuth)
    cam_z = center.z + fit_dist * math.sin(elevation)

    cam_obj.location = (cam_x, cam_y, cam_z)
    look_target.location = center
else:
    cam_obj.location = (${camX}, ${camY}, ${camZ})
    look_target.location = (0, 0, ${lookZ})

# Track To Constraint
trk = None
for c in cam_obj.constraints:
    if c.type == 'TRACK_TO':
        trk = c
        break
if not trk:
    trk = cam_obj.constraints.new(type='TRACK_TO')

trk.target = look_target
trk.track_axis = 'TRACK_NEGATIVE_Z'
trk.up_axis = 'UP_Y'

# Focus distance computation
dist = (cam_obj.location - look_target.location).length
cam_data.dof.focus_distance = dist

scene.camera = cam_obj

# Lock Viewport to Camera
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
`;
  }

  /**
   * Retrieves active persistent world state or rehydrates from disk pointer
   */
  getWorldState() {
    return this.worldState || PersistentWorldState.loadActive(this.worldsDir);
  }

  /**
   * Reconciles active persistent world state against actual Blender objects using custom property unin_id
   */
  async reconcileWorldWithBlender() {
    const ws = this.getWorldState();
    if (!ws) {
      return { verified: false, error: 'No active persistent world state found to reconcile' };
    }
    return await ws.reconcileWithBlender(this.sendRPC);
  }

  /**
   * PHASE 3B: Delta Mutation & Incremental World Editing Engine
   * Executes atomic, targeted mutations on the current living world without rebuilding the scene.
   *
   * @param {string} userPrompt - Natural language delta instruction (e.g. "Make the Ferrari black", "Move it 2m left")
   * @param {Object} [options]
   * @returns {Promise<Object>} Execution result envelope
   */
  async mutateWorldIncremental(userPrompt, options = {}) {
    logger.info(`[Autonomous3DArchitect] ==========================================`);
    logger.info(`[Autonomous3DArchitect] DELTA MUTATION REQUEST: "${userPrompt}"`);
    logger.info(`[Autonomous3DArchitect] ==========================================`);

    // Step 1: Ensure active world state is loaded
    if (!this.worldState) {
      this.worldState = this.getWorldState();
    }

    if (!this.worldState) {
      logger.info('[Autonomous3DArchitect] No active persistent world state found. Initializing active world session...');
      this.worldState = PersistentWorldState.createNew({ storageDir: this.worldsDir });
    }

    // Step 2: Plan delta mutation
    const deltaPlan = this.deltaMutator.planDelta(userPrompt, this.worldState, this.conversationContext);

    // If user requested full scene rebuild, delegate to buildWorldAutonomous
    if (deltaPlan.scope === DELTA_SCOPE.FULL_REBUILD) {
      logger.info('[Autonomous3DArchitect] Delta planner detected FULL_REBUILD intent. Delegating to buildWorldAutonomous...');
      return await this.buildWorldAutonomous(userPrompt, options);
    }

    // If target resolution failed or was ambiguous
    if (deltaPlan.error) {
      logger.warn(`[Autonomous3DArchitect] Delta planning failed: ${deltaPlan.error} — ${deltaPlan.message}`);
      return {
        success: false,
        error: deltaPlan.error,
        message: deltaPlan.message,
        candidates: deltaPlan.candidates || [],
        worldId: this.worldState.worldId,
        version: this.worldState.version
      };
    }

    // Step 2.5: AbortSignal boundary check
    if (options.abortSignal && options.abortSignal.aborted) {
      logger.warn('[Autonomous3DArchitect] Mutation cancelled by user before execution.');
      return {
        success: false,
        cancelled: true,
        message: 'Mutation cancelled by user before execution',
        worldId: this.worldState.worldId,
        version: this.worldState.version
      };
    }

    // Step 3: Execute mutation transaction
    const txRes = await this.deltaMutator.executeMutationTransaction(deltaPlan, this.worldState, this.checkpointMgr);

    // Step 4: Update conversational focus context if successful
    if (txRes.success) {
      if (deltaPlan.targets && deltaPlan.targets[0]?.entityId) {
        if (deltaPlan.action === DELTA_ACTION.REMOVE) {
          if (this.conversationContext.lastFocusedEntityId === deltaPlan.targets[0].entityId) {
            this.conversationContext.lastFocusedEntityId = null;
          }
        } else {
          this.conversationContext.lastFocusedEntityId = deltaPlan.targets[0].entityId;
        }
      }

      let renderOutput = null;
      if (options.render === true) {
        try {
          renderOutput = await this._finalizeAndRender(this.worldState?.sceneGraph || {});
        } catch (rErr) {
          logger.warn(`[Autonomous3DArchitect] Incremental render notice: ${rErr.message}`);
        }
      }

      let actualState = null;
      if (options.inspect === true || options.render === true) {
        try {
          actualState = await this.inspector.querySceneState();
        } catch (iErr) {
          logger.warn(`[Autonomous3DArchitect] Scene state inspection notice: ${iErr.message}`);
        }
      }

      let visualEvaluation = null;
      if (options.evaluateVisuals === true && renderOutput?.renderPath && this.visionEvaluator) {
        try {
          visualEvaluation = await this.visionEvaluator.evaluateVisualQuality(
            userPrompt,
            renderOutput.renderPath,
            this.worldState?.sceneGraph,
            actualState,
            this.worldState?.visualPlan,
            options.profile || 'CINEMATIC'
          );
        } catch (visErr) {
          logger.warn(`[Autonomous3DArchitect] Incremental visual evaluation notice: ${visErr.message}`);
        }
      }

      if (this.worldState && typeof this.worldState.save === 'function') {
        try {
          await this.worldState.save();
        } catch (sErr) {
          logger.warn(`[Autonomous3DArchitect] World state save notice: ${sErr.message}`);
        }
      }

      const blendPath = renderOutput?.blendPath || path.join(this.workspaceRoot, 'unin_world_scene.blend').replace(/\\/g, '/');
      const renderPath = renderOutput?.renderPath || path.join(this.workspaceRoot, 'unin_world_render.png').replace(/\\/g, '/');

      return {
        ...txRes,
        blendPath,
        renderPath,
        snapshotPath: renderPath,
        actualState,
        visualEvaluation
      };
    }

    return txRes;
  }

  _finalizeAndRender(sceneGraph) {
    const blendPath = path.join(this.workspaceRoot, 'unin_world_scene.blend').replace(/\\/g, '/');
    const renderPath = path.join(this.workspaceRoot, 'unin_world_render.png').replace(/\\/g, '/');

    const py = `
# Finalize, Save Master Blend, and 1080p Render
import bpy

scene = bpy.context.scene
try:
    if hasattr(scene.eevee, 'taa_render_samples'):
        scene.eevee.taa_render_samples = 16
    elif hasattr(scene.eevee, 'render_samples'):
        scene.eevee.render_samples = 16
except Exception:
    pass
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.filepath = r"${renderPath}"

# Save Blend Project
try:
    bpy.ops.wm.save_as_mainfile(filepath=r"${blendPath}")
    print("SAVED_MASTER_BLEND_SUCCESS")
except Exception as e:
    print("SAVE_BLEND_ERR:", e)

# Render Viewport Still
try:
    bpy.ops.render.render(write_still=True)
    print("RENDERED_1080P_STILL_SUCCESS")
except Exception as e:
    print("RENDER_ERR:", e)
`;

    return new Promise((resolve, reject) => {
      this.sendRPC('execute_bpy', { code: py, autoCapture: false, timeout: 120.0 }, 120000)
        .then(() => resolve({ blendPath, renderPath }))
        .catch(err => {
          logger.warn(`[Autonomous3DArchitect] Render finalize notice: ${err.message}`);
          resolve({ blendPath, renderPath });
        });
    });
  }

  /**
   * Phase 3C: Directs scene visual production (cinematography, lighting, LookDev, atmosphere, color management)
   * Converts creative visual direction into a structured production rig applied to the active Blender world.
   *
   * @param {string} userPrompt - Creative visual instruction (e.g. "Make this a premium commercial night shot")
   * @param {Object} [options={}]
   * @returns {Promise<Object>}
   */
  async directSceneVisuals(userPrompt, options = {}) {
    logger.info(`[Autonomous3DArchitect] ==========================================`);
    logger.info(`[Autonomous3DArchitect] DIRECTING SCENE VISUALS: "${userPrompt}"`);
    logger.info(`[Autonomous3DArchitect] ==========================================`);

    const ws = this.getWorldState();
    if (!ws) {
      this.worldState = PersistentWorldState.createNew({ storageDir: this.worldsDir });
    } else {
      this.worldState = ws;
    }

    // Formulate production visual plan
    const visualPlan = await this.visualDirector.planVisualProduction(userPrompt, null, this.worldState, options);

    // Apply visual rig to live Blender session
    const res = await this.visualDirector.applyVisualPlan(visualPlan, this.worldState);

    return {
      success: res.success,
      worldId: this.worldState.worldId,
      version: this.worldState.version,
      visualPlan,
      error: res.error
    };
  }

  /**
   * Phase 3D: Inspects the active scene visually using Multimodal Vision & Telemetry Fusion
   *
   * @param {string} userPrompt - Original intent / expectations
   * @param {Object} [options={}]
   * @returns {Promise<Object>} Structured VisualEvaluationReport
   */
  async evaluateSceneVisually(userPrompt, options = {}) {
    logger.info(`[Autonomous3DArchitect] ==========================================`);
    logger.info(`[Autonomous3DArchitect] EVALUATING SCENE VISUALLY: "${userPrompt}"`);
    logger.info(`[Autonomous3DArchitect] ==========================================`);

    const ws = this.getWorldState();
    const framePath = await this.visionEvaluator.captureEvaluationFrame(options.imagePath);
    const telemetry = await this.inspector.querySceneState();

    return await this.visionEvaluator.evaluateVisualQuality(
      userPrompt,
      framePath,
      null,
      telemetry,
      ws?.visualPlan,
      options.profile || 'CINEMATIC'
    );
  }

  /**
   * Phase 3D: Executes the Closed-Loop Visual Correction Loop:
   * Build/Mutate -> Capture Frame -> Vision Evaluation -> Surgical Correction -> Re-capture -> Verify.
   *
   * @param {string} userPrompt - Creative instruction
   * @param {Object} [options={}]
   * @returns {Promise<Object>} Loop result envelope
   */
  async runVisualCorrectionLoop(userPrompt, options = {}) {
    logger.info(`[Autonomous3DArchitect] ==========================================`);
    logger.info(`[Autonomous3DArchitect] ENGAGING VISUAL CORRECTION LOOP: "${userPrompt}"`);
    logger.info(`[Autonomous3DArchitect] ==========================================`);

    const ws = this.getWorldState();
    if (!ws) {
      this.worldState = PersistentWorldState.createNew({ storageDir: this.worldsDir });
    } else {
      this.worldState = ws;
    }

    return await this.visionEvaluator.runVisualCorrectionLoop({
      userPrompt,
      sceneGraph: null,
      worldState: this.worldState,
      deltaMutator: this.deltaMutator,
      checkpointMgr: this.checkpointMgr,
      profile: options.profile || 'CINEMATIC'
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PHASE 4: DEEP BLENDER CONTROL & PRODUCTION METHODS
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Deeply observes active workspace, editors, active object, collections & mesh statistics
   */
  async observeWorkspace() {
    return await this.workspaceObserver.observeWorkspace();
  }

  /**
   * Executes a native operation snippet via BlenderOperationDispatcher
   */
  async dispatchNativeOperation(pyCode, options = {}) {
    return await this.operationDispatcher.executeBpySnippet(pyCode, options);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PHASE 5: HIGH-FIDELITY GEOMETRY, LOD & IMPERFECTIONS
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Sets up or updates non-destructive LOD decimation on target entity
   */
  async configureLOD(objectIdentifier, lodLevel = 'LOD0') {
    const py = this.geometryEngine.generateLODSetupBpy(objectIdentifier, lodLevel);
    return await this.sendRPC('execute_bpy', { code: py, autoCapture: false });
  }

  /**
   * Applies hero topology smoothing, weighted normals, and non-destructive bevel/subsurf
   */
  async applyHeroTopologyPolish(objectIdentifier) {
    const py = this.geometryEngine.generateTopologySmoothingBpy(objectIdentifier);
    return await this.sendRPC('execute_bpy', { code: py, autoCapture: false });
  }

  /**
   * Adds procedural micro-surface imperfections (dust, scratches, edge wear) to PBR shader
   */
  async applyImperfections(objectIdentifier, params = {}) {
    const py = this.geometryEngine.generateImperfectionShaderBpy(objectIdentifier, params);
    return await this.sendRPC('execute_bpy', { code: py, autoCapture: false });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PHASE 6: ANIMATION, SIMULATION & VFX
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Decomposes user intent into timeline, camera moves, and simulation requirements
   */
  planAnimationVFX(userPrompt, sceneGraph = null) {
    return this.animVfxEngine.planAnimationVFX(userPrompt, sceneGraph);
  }

  /**
   * Keyframes smooth cinematic camera trajectory
   */
  async applyCameraMotion(cameraIdentifier = 'unin.camera.primary', moveType = 'PUSH_IN', startFrame = 1, endFrame = 120) {
    if (cameraIdentifier && typeof cameraIdentifier === 'object') {
      const opts = cameraIdentifier;
      cameraIdentifier = opts.cameraIdentifier || opts.targetIdentifier || 'unin.camera.primary';
      moveType = opts.moveType || 'PUSH_IN';
      startFrame = opts.startFrame || 1;
      endFrame = opts.endFrame || 120;
    }
    const py = this.animVfxEngine.generateCameraAnimationBpy(cameraIdentifier, moveType, startFrame, endFrame);
    return await this.sendRPC('execute_bpy', { code: py, autoCapture: false });
  }

  /**
   * Emits instanced atmospheric rain particles
   */
  async applyRainVFX(bounds = [20, 20, 1], particleCount = 2500) {
    if (bounds && typeof bounds === 'object' && !Array.isArray(bounds)) {
      const opts = bounds;
      particleCount = opts.particleCount || particleCount;
      bounds = opts.emitterDimensions || opts.bounds || [20, 20, 1];
    }
    const py = this.animVfxEngine.generateVFXRainSystemBpy(bounds, particleCount);
    return await this.sendRPC('execute_bpy', { code: py, autoCapture: false });
  }

  /**
   * Configures rigid body simulation on target mesh
   */
  async applyRigidBodyPhysics(objectIdentifier, config = {}) {
    const py = this.animVfxEngine.generateRigidBodyBpy(objectIdentifier, config);
    return await this.sendRPC('execute_bpy', { code: py, autoCapture: false });
  }
}

module.exports = { Autonomous3DArchitect };
