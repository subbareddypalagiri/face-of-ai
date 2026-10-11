// src/main/tools/astra/core/index.js — Barrel Export for UNIN 3D Intelligence Subsystem
'use strict';

const { UnifiedAILayer } = require('./UnifiedAILayer');
const { IntentInterpreter } = require('./IntentInterpreter');
const { SceneGraph } = require('./SceneGraph');
const { TaskGraph, TaskNode, TASK_STATUS } = require('./TaskGraph');
const { AssetResolver } = require('./AssetResolver');
const { AssetSanitizer } = require('./AssetSanitizer');
const { SceneInspector } = require('./SceneInspector');
const { CorrectionEngine } = require('./CorrectionEngine');
const { CheckpointManager } = require('./CheckpointManager');
const { AuditLogger } = require('./AuditLogger');
const { Autonomous3DArchitect } = require('./Autonomous3DArchitect');
const { PersistentWorldState, ENTITY_STATUS } = require('./PersistentWorldState');
const {
  WorldDeltaMutator,
  DELTA_ACTION,
  DELTA_ERROR,
  DELTA_SCOPE,
  COLOR_PALETTE
} = require('./WorldDeltaMutator');
const {
  VisualDirector,
  SHOT_TYPE,
  COMPOSITION_RULE,
  CAMERA_ANGLE,
  LIGHTING_STRATEGY,
  QUALITY_PROFILE,
  COLOR_TEMPERATURE_PRESETS,
  LOOKDEV_PRESETS,
  kelvinToRgb
} = require('./VisualDirector');
const {
  VisionEvaluator,
  DEFECT_DIMENSION,
  DEFECT_SEVERITY,
  EVALUATION_STATUS,
  PROFILE_THRESHOLDS
} = require('./VisionEvaluator');
const {
  LiveAgentRuntime,
  AGENT_EVENT,
  TASK_QUEUE_STATUS,
  TASK_PRIORITY,
  OBJECT_CLASSIFICATION,
  LIVE_QUALITY_STATE
} = require('./LiveAgentRuntime');
const {
  BlenderWorkspaceObserver,
  BLENDER_MODE,
  BLENDER_EDITOR_TYPE
} = require('./BlenderWorkspaceObserver');
const {
  BlenderOperationDispatcher,
  MODIFIER_TYPE,
  MODIFIER_ORDER_PRIORITY
} = require('./BlenderOperationDispatcher');
const {
  HighFidelityGeometryEngine,
  GEOMETRY_BUDGET_TIER,
  LOD_LEVEL,
  PHYSICAL_SCALE_STANDARDS
} = require('./HighFidelityGeometryEngine');
const {
  AnimationPhysicsVFXEngine,
  VFX_TYPE,
  CAMERA_MOVE_TYPE,
  PHYSICS_TYPE
} = require('./AnimationPhysicsVFXEngine');
const assets = require('./assets');

module.exports = {
  UnifiedAILayer,
  IntentInterpreter,
  SceneGraph,
  TaskGraph,
  TaskNode,
  TASK_STATUS,
  AssetResolver,
  AssetSanitizer,
  SceneInspector,
  CorrectionEngine,
  CheckpointManager,
  AuditLogger,
  Autonomous3DArchitect,
  PersistentWorldState,
  ENTITY_STATUS,
  WorldDeltaMutator,
  DELTA_ACTION,
  DELTA_ERROR,
  DELTA_SCOPE,
  COLOR_PALETTE,
  VisualDirector,
  SHOT_TYPE,
  COMPOSITION_RULE,
  CAMERA_ANGLE,
  LIGHTING_STRATEGY,
  QUALITY_PROFILE,
  COLOR_TEMPERATURE_PRESETS,
  LOOKDEV_PRESETS,
  kelvinToRgb,
  VisionEvaluator,
  DEFECT_DIMENSION,
  DEFECT_SEVERITY,
  EVALUATION_STATUS,
  PROFILE_THRESHOLDS,
  LiveAgentRuntime,
  AGENT_EVENT,
  TASK_QUEUE_STATUS,
  TASK_PRIORITY,
  OBJECT_CLASSIFICATION,
  LIVE_QUALITY_STATE,
  BlenderWorkspaceObserver,
  BLENDER_MODE,
  BLENDER_EDITOR_TYPE,
  BlenderOperationDispatcher,
  MODIFIER_TYPE,
  MODIFIER_ORDER_PRIORITY,
  HighFidelityGeometryEngine,
  GEOMETRY_BUDGET_TIER,
  LOD_LEVEL,
  PHYSICAL_SCALE_STANDARDS,
  AnimationPhysicsVFXEngine,
  VFX_TYPE,
  CAMERA_MOVE_TYPE,
  PHYSICS_TYPE,
  assets,
  ...assets
};
