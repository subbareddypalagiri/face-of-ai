// scratch/test-batch2-blender-production.js — Comprehensive Test Suite for UNIN Batch 2
// Verifies:
// Phase 4: Deep Blender Control & Production Engine
// Phase 5: High-Fidelity Asset & Geometry Engine
// Phase 6: Animation, Physics & VFX Engine
// Persistent World State & Delta Mutator Integrations
// BlenderAstraEngine High-Level Facade
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const {
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
  PersistentWorldState,
  WorldDeltaMutator,
  Autonomous3DArchitect
} = require('../src/main/tools/astra/core');

const {
  BlenderAstraEngine
} = require('../src/main/tools/blenderAstraEngine');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] Test ${totalTests}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] Test ${totalTests}: ${name}`);
    console.error(`         ${err.message}`);
    if (err.stack) console.error(err.stack.split('\n').slice(1, 3).join('\n'));
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  [PASS] Test ${totalTests}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] Test ${totalTests}: ${name}`);
    console.error(`         ${err.message}`);
    if (err.stack) console.error(err.stack.split('\n').slice(1, 3).join('\n'));
  }
}

async function runAllTests() {
  console.log('========================================================================');
  console.log('  UNIN BATCH 2: DEEP BLENDER CONTROL, HIGH-FIDELITY & ANIMATION SUITE');
  console.log('  Phase 4: Deep Blender Control & Production Engine');
  console.log('  Phase 5: High-Fidelity Asset & Geometry Engine');
  console.log('  Phase 6: Animation + Physics + VFX Engine');
  console.log('========================================================================\n');

  // ===========================================================================
  // SUITE 1: PHASE 4 — BLENDER WORKSPACE OBSERVER
  // ===========================================================================
  console.log('--- SUITE 1: PHASE 4 — WORKSPACE OBSERVER & INTROSPECTION ---');

  runTest('BLENDER_MODE defines all standard Blender interaction modes', () => {
    assert.strictEqual(BLENDER_MODE.OBJECT, 'OBJECT');
    assert.strictEqual(BLENDER_MODE.EDIT, 'EDIT');
    assert.strictEqual(BLENDER_MODE.SCULPT, 'SCULPT');
    assert.strictEqual(BLENDER_MODE.POSE, 'POSE');
    assert.strictEqual(BLENDER_MODE.WEIGHT_PAINT, 'WEIGHT_PAINT');
    assert.strictEqual(BLENDER_MODE.TEXTURE_PAINT, 'TEXTURE_PAINT');
    assert.strictEqual(BLENDER_MODE.VERTEX_PAINT, 'VERTEX_PAINT');
  });

  runTest('BLENDER_EDITOR_TYPE defines all major space types', () => {
    assert.strictEqual(BLENDER_EDITOR_TYPE.VIEW_3D, 'VIEW_3D');
    assert.strictEqual(BLENDER_EDITOR_TYPE.NODE_EDITOR, 'NODE_EDITOR');
    assert.strictEqual(BLENDER_EDITOR_TYPE.DOPESHEET_EDITOR, 'DOPESHEET_EDITOR');
    assert.strictEqual(BLENDER_EDITOR_TYPE.GRAPH_EDITOR, 'GRAPH_EDITOR');
    assert.strictEqual(BLENDER_EDITOR_TYPE.OUTLINER, 'OUTLINER');
    assert.strictEqual(BLENDER_EDITOR_TYPE.PROPERTIES, 'PROPERTIES');
  });

  runTest('BlenderWorkspaceObserver generates valid python introspection code', () => {
    const observer = new BlenderWorkspaceObserver(async () => ({ success: true }));
    const py = observer.generateIntrospectionBpy();
    assert.ok(typeof py === 'string' && py.length > 200);
    assert.ok(py.includes('bpy.context.workspace'));
    assert.ok(py.includes('bpy.context.active_object'));
    assert.ok(py.includes('bpy.context.selected_objects'));
    assert.ok(py.includes('total_triangles'));
    assert.ok(py.includes('UNIN_WORKSPACE_OBSERVATION_DATA:'));
  });

  await runAsyncTest('BlenderWorkspaceObserver parses introspection payload correctly', async () => {
    const mockData = {
      workspaceName: 'Layout',
      mode: 'OBJECT',
      activeObject: { name: 'Harley_Davidson', type: 'MESH', unin_id: 'unin.entity.vehicle_0', location: [0, 0, 0] },
      selectedObjects: [{ name: 'Harley_Davidson', unin_id: 'unin.entity.vehicle_0' }],
      collections: [{ name: 'Scene Collection', objectCount: 1 }],
      camera: { name: 'Camera', lens: 35 },
      lightCount: 3,
      timeline: { currentFrame: 1, startFrame: 1, endFrame: 120, fps: 24 },
      render: { engine: 'BLENDER_EEVEE', viewTransform: 'AgX', resolution: [1920, 1080] },
      meshComplexity: { totalObjects: 5, totalVertices: 45000, totalPolygons: 40000, totalTriangles: 80000 }
    };

    const mockSendRPC = async (cmd, args) => {
      return {
        success: true,
        stdout: `Random log line\nUNIN_WORKSPACE_OBSERVATION_DATA:${JSON.stringify(mockData)}\nDone`
      };
    };

    const observer = new BlenderWorkspaceObserver(mockSendRPC);
    const observation = await observer.observeWorkspace();

    assert.strictEqual(observation.success, true);
    assert.strictEqual(observation.mode, 'OBJECT');
    assert.strictEqual(observation.activeObject.name, 'Harley_Davidson');
    assert.strictEqual(observation.activeObject.unin_id, 'unin.entity.vehicle_0');
    assert.strictEqual(observation.render.viewTransform, 'AgX');
    assert.strictEqual(observation.meshComplexity.totalTriangles, 80000);
  });

  // ===========================================================================
  // SUITE 2: PHASE 4 — BLENDER OPERATION DISPATCHER & NATIVE OPERATORS
  // ===========================================================================
  console.log('\n--- SUITE 2: PHASE 4 — OPERATOR DISPATCH & MODE SAFETY ---');

  runTest('wrapWithModeSafety guards execution with try/finally mode restore', () => {
    const dispatcher = new BlenderOperationDispatcher(async () => ({ success: true }));
    const wrapped = dispatcher.wrapWithModeSafety('print("doing edit")', 'EDIT', 'MyObj');
    assert.ok(wrapped.includes('original_mode ='));
    assert.ok(wrapped.includes('bpy.ops.object.mode_set(mode=\'EDIT\')'));
    assert.ok(wrapped.includes('print("doing edit")'));
    assert.ok(wrapped.includes('finally:'));
    assert.ok(wrapped.includes('bpy.ops.object.mode_set(mode=original_mode)'));
  });

  runTest('_objectLookupPython prioritizes canonical unin_id over Blender name', () => {
    const dispatcher = new BlenderOperationDispatcher(async () => ({ success: true }));
    const code = dispatcher._objectLookupPython('unin.entity.vehicle_0', 'target_obj');
    assert.ok(code.includes('target_obj = None'));
    assert.ok(code.includes('for o in bpy.context.scene.objects:'));
    assert.ok(code.includes('if o.get("unin_id") == "unin.entity.vehicle_0"'));
    assert.ok(code.includes('target_obj = bpy.data.objects.get("unin.entity.vehicle_0")'));
  });

  runTest('generateCreateCollectionBpy links collection to Scene Collection if parent null', () => {
    const dispatcher = new BlenderOperationDispatcher(async () => ({ success: true }));
    const py = dispatcher.generateCreateCollectionBpy('UNIN_Hero_Assets');
    assert.ok(py.includes('bpy.data.collections.get("UNIN_Hero_Assets")'));
    assert.ok(py.includes('bpy.context.scene.collection.children.link(col)'));
  });

  runTest('generateMoveToCollectionBpy moves object from other collections cleanly', () => {
    const dispatcher = new BlenderOperationDispatcher(async () => ({ success: true }));
    const py = dispatcher.generateMoveToCollectionBpy('unin.entity.vehicle_0', 'UNIN_Hero_Assets');
    assert.ok(py.includes('for col in target_obj.users_collection:'));
    assert.ok(py.includes('target_col.objects.link(target_obj)'));
  });

  runTest('MODIFIER_ORDER_PRIORITY enforces correct modifier ordering', () => {
    assert.ok(MODIFIER_ORDER_PRIORITY[MODIFIER_TYPE.MIRROR] < MODIFIER_ORDER_PRIORITY[MODIFIER_TYPE.BEVEL]);
    assert.ok(MODIFIER_ORDER_PRIORITY[MODIFIER_TYPE.BEVEL] < MODIFIER_ORDER_PRIORITY[MODIFIER_TYPE.SUBSURF]);
    assert.ok(MODIFIER_ORDER_PRIORITY[MODIFIER_TYPE.SUBSURF] < MODIFIER_ORDER_PRIORITY[MODIFIER_TYPE.WEIGHTED_NORMAL]);
  });

  runTest('generateAddModifierBpy configures modifier properties and priority sorting', () => {
    const dispatcher = new BlenderOperationDispatcher(async () => ({ success: true }));
    const py = dispatcher.generateAddModifierBpy('unin.entity.vehicle_0', MODIFIER_TYPE.BEVEL, {
      name: 'Hero_Bevel',
      width: 0.015,
      segments: 3
    });
    assert.ok(py.includes('target_obj.modifiers.new(name="Hero_Bevel", type=\'BEVEL\')'));
    assert.ok(py.includes('mod.width = 0.015'));
    assert.ok(py.includes('mod.segments = 3'));
    assert.ok(py.includes('order_map ='));
  });

  runTest('generatePBRShaderBpy builds complete Principled BSDF node network', () => {
    const dispatcher = new BlenderOperationDispatcher(async () => ({ success: true }));
    const py = dispatcher.generatePBRShaderBpy('unin.entity.vehicle_0', {
      materialName: 'Automotive_Black',
      baseColor: [0.02, 0.02, 0.02, 1.0],
      metallic: 0.95,
      roughness: 0.15,
      clearcoat: 1.0,
      microNoise: true
    });
    assert.ok(py.includes('ShaderNodeBsdfPrincipled'));
    assert.ok(py.includes('ShaderNodeTexNoise'));
    assert.ok(py.includes('ShaderNodeBump'));
    assert.ok(py.includes('Roughness'));
    assert.ok(py.includes('Metallic'));
    assert.ok(py.includes('Clearcoat'));
  });

  runTest('generateProceduralScatteringBpy constructs Geometry Nodes scattering tree', () => {
    const dispatcher = new BlenderOperationDispatcher(async () => ({ success: true }));
    const py = dispatcher.generateProceduralScatteringBpy('unin.environment.ground', 'Rock_Prop', {
      density: 12.5,
      seed: 42
    });
    assert.ok(py.includes('GeometryNodeDistributePointsOnFaces'));
    assert.ok(py.includes('GeometryNodeInstanceOnPoints'));
    assert.ok(py.includes('GeometryNodeRotateInstances'));
  });

  runTest('generateCameraRigBpy sets up Track To constraint and Depth of Field', () => {
    const dispatcher = new BlenderOperationDispatcher(async () => ({ success: true }));
    const py = dispatcher.generateCameraRigBpy({
      cameraName: 'Hero_Cinematic_Cam',
      lens: 50,
      fstop: 2.8,
      focusTargetId: 'unin.entity.vehicle_0',
      trackTarget: true
    });
    assert.ok(py.includes('TRACK_TO'));
    assert.ok(py.includes('TRACK_NEGATIVE_Z'));
    assert.ok(py.includes('dof.use_dof = True'));
    assert.ok(py.includes('dof.focus_object = focus_target'));
    assert.ok(py.includes('dof.aperture_fstop = 2.8'));
  });

  runTest('generateRenderConfigBpy configures AgX tone mapping and render settings', () => {
    const dispatcher = new BlenderOperationDispatcher(async () => ({ success: true }));
    const py = dispatcher.generateRenderConfigBpy({
      engine: 'BLENDER_EEVEE',
      viewTransform: 'AgX',
      look: 'High Contrast',
      resolution: [1920, 1080],
      samples: 64
    });
    assert.ok(py.includes('scene.view_settings.view_transform = "AgX"'));
    assert.ok(py.includes('scene.view_settings.look = "High Contrast"'));
    assert.ok(py.includes('scene.render.resolution_x = 1920'));
    assert.ok(py.includes('scene.render.resolution_y = 1080'));
  });

  // ===========================================================================
  // SUITE 3: PHASE 5 — HIGH-FIDELITY ASSET & GEOMETRY ENGINE
  // ===========================================================================
  console.log('\n--- SUITE 3: PHASE 5 — GEOMETRY FIDELITY, LOD & SCALE ---');

  runTest('GEOMETRY_BUDGET_TIER defines 4 standard budget brackets', () => {
    assert.ok(GEOMETRY_BUDGET_TIER.HERO.minTriangles >= 100000);
    assert.ok(GEOMETRY_BUDGET_TIER.HERO.maxTriangles <= 1500000);
    assert.ok(GEOMETRY_BUDGET_TIER.MIDGROUND.minTriangles >= 10000);
    assert.ok(GEOMETRY_BUDGET_TIER.BACKGROUND.minTriangles >= 1000);
    assert.ok(GEOMETRY_BUDGET_TIER.FAR.minTriangles >= 100);
  });

  runTest('calculateTriangleBudget assigns HERO tier for close-up hero entity', () => {
    const engine = new HighFidelityGeometryEngine();
    const budget = engine.calculateTriangleBudget({
      role: 'hero',
      cameraDistanceMeters: 3.5,
      isCloseUp: true
    });
    assert.strictEqual(budget.tier, 'HERO');
    assert.ok(budget.allocatedTriangles >= 100000);
  });

  runTest('calculateTriangleBudget assigns BACKGROUND or FAR tier for distant objects', () => {
    const engine = new HighFidelityGeometryEngine();
    const budget = engine.calculateTriangleBudget({
      role: 'prop',
      cameraDistanceMeters: 45.0,
      isCloseUp: false
    });
    assert.ok(budget.tier === 'BACKGROUND' || budget.tier === 'FAR');
    assert.ok(budget.allocatedTriangles <= 20000);
  });

  runTest('LOD_LEVEL defines LOD0 through LOD3 ratios', () => {
    assert.strictEqual(LOD_LEVEL.LOD0.ratio, 1.0);
    assert.strictEqual(LOD_LEVEL.LOD1.ratio, 0.5);
    assert.strictEqual(LOD_LEVEL.LOD2.ratio, 0.2);
    assert.strictEqual(LOD_LEVEL.LOD3.ratio, 0.05);
  });

  runTest('generateLODSetupBpy produces non-destructive Decimate modifier', () => {
    const engine = new HighFidelityGeometryEngine();
    const py = engine.generateLODSetupBpy('unin.entity.vehicle_0', 'LOD1');
    assert.ok(py.includes('DECIMATE'));
    assert.ok(py.includes('dec_mod.ratio = 0.5'));
    assert.ok(py.includes('target_obj["unin_lod"] = "LOD1"'));
  });

  runTest('generateTopologySmoothingBpy adds Subsurf and Weighted Normal modifiers', () => {
    const engine = new HighFidelityGeometryEngine();
    const py = engine.generateTopologySmoothingBpy('unin.entity.vehicle_0', {
      subsurfLevels: 2,
      useWeightedNormal: true
    });
    assert.ok(py.includes('SUBSURF'));
    assert.ok(py.includes('sub_mod.levels = 2'));
    assert.ok(py.includes('WEIGHTED_NORMAL'));
    assert.ok(py.includes('target_obj.data.use_auto_smooth = True'));
  });

  runTest('generateImperfectionShaderBpy generates micro-scratches, dust and edge wear nodes', () => {
    const engine = new HighFidelityGeometryEngine();
    const py = engine.generateImperfectionShaderBpy('unin.entity.vehicle_0', {
      scratchIntensity: 0.35,
      dustAmount: 0.15,
      edgeWear: 0.2
    });
    assert.ok(py.includes('ShaderNodeTexVoronoi'));
    assert.ok(py.includes('ShaderNodeTexNoise'));
    assert.ok(py.includes('ShaderNodeMix'));
    assert.ok(py.includes('ShaderNodeBump'));
  });

  runTest('PHYSICAL_SCALE_STANDARDS defines accurate real-world dimensions in meters', () => {
    const moto = PHYSICAL_SCALE_STANDARDS.motorcycle;
    assert.ok(moto.length >= 2.0 && moto.length <= 2.5);
    assert.ok(moto.height >= 1.0 && moto.height <= 1.4);

    const car = PHYSICAL_SCALE_STANDARDS.vehicle_car;
    assert.ok(car.length >= 4.0 && car.length <= 5.0);

    const human = PHYSICAL_SCALE_STANDARDS.human;
    assert.ok(human.height >= 1.7 && human.height <= 1.85);

    const lamp = PHYSICAL_SCALE_STANDARDS.streetlamp;
    assert.ok(lamp.height >= 5.0 && lamp.height <= 7.0);
  });

  runTest('getPhysicalDimensions returns valid scale for known and default entities', () => {
    const engine = new HighFidelityGeometryEngine();
    const bikeDim = engine.getPhysicalDimensions('Harley Davidson Motorcycle');
    assert.ok(bikeDim.length > 2.0);

    const unknownDim = engine.getPhysicalDimensions('Random alien artifact');
    assert.ok(unknownDim.length > 0 && unknownDim.width > 0 && unknownDim.height > 0);
  });

  // ===========================================================================
  // SUITE 4: PHASE 6 — ANIMATION, PHYSICS & VFX ENGINE
  // ===========================================================================
  console.log('\n--- SUITE 4: PHASE 6 — ANIMATION, PHYSICS & VFX ---');

  runTest('VFX_TYPE defines standard weather and atmospheric VFX systems', () => {
    assert.strictEqual(VFX_TYPE.RAIN, 'RAIN');
    assert.strictEqual(VFX_TYPE.SNOW, 'SNOW');
    assert.strictEqual(VFX_TYPE.FOG, 'FOG');
    assert.strictEqual(VFX_TYPE.DUST_PARTICLES, 'DUST_PARTICLES');
    assert.strictEqual(VFX_TYPE.FIRE_SPARKS, 'FIRE_SPARKS');
  });

  runTest('CAMERA_MOVE_TYPE defines cinematic movement primitives', () => {
    assert.strictEqual(CAMERA_MOVE_TYPE.PUSH_IN, 'PUSH_IN');
    assert.strictEqual(CAMERA_MOVE_TYPE.PULL_OUT, 'PULL_OUT');
    assert.strictEqual(CAMERA_MOVE_TYPE.ORBIT, 'ORBIT');
    assert.strictEqual(CAMERA_MOVE_TYPE.DOLLY_TRACK, 'DOLLY_TRACK');
    assert.strictEqual(CAMERA_MOVE_TYPE.HANDHELD_SHAKE, 'HANDHELD_SHAKE');
  });

  runTest('PHYSICS_TYPE defines standard simulation domains', () => {
    assert.strictEqual(PHYSICS_TYPE.RIGID_BODY, 'RIGID_BODY');
    assert.strictEqual(PHYSICS_TYPE.CLOTH, 'CLOTH');
    assert.strictEqual(PHYSICS_TYPE.FLUID, 'FLUID');
    assert.strictEqual(PHYSICS_TYPE.SOFT_BODY, 'SOFT_BODY');
  });

  runTest('planAnimationVFX decomposes prompt into camera moves, VFX and physics', () => {
    const engine = new AnimationPhysicsVFXEngine();
    const plan = engine.planAnimationVFX('Animate the camera slowly pushing in towards the motorcycle with heavy rain and wind');
    assert.strictEqual(plan.hasAnimation, true);
    assert.strictEqual(plan.cameraMove, 'PUSH_IN');
    assert.ok(plan.vfx.includes('RAIN'));
    assert.ok(plan.timeline.endFrame >= 60);
    assert.strictEqual(plan.timeline.fps, 24);
  });

  runTest('generateCameraAnimationBpy sets Bezier keyframes for PUSH_IN move', () => {
    const engine = new AnimationPhysicsVFXEngine();
    const py = engine.generateCameraAnimationBpy('Camera', CAMERA_MOVE_TYPE.PUSH_IN, 1, 120);
    assert.ok(py.includes('cam_obj.keyframe_insert(data_path="location", frame=1)'));
    assert.ok(py.includes('cam_obj.keyframe_insert(data_path="location", frame=120)'));
    assert.ok(py.includes('kp.interpolation = \'BEZIER\''));
  });

  runTest('generateTimelineSetupBpy configures frame bounds and frame rate', () => {
    const engine = new AnimationPhysicsVFXEngine();
    const py = engine.generateTimelineSetupBpy(1, 240, 30);
    assert.ok(py.includes('scene.frame_start = 1'));
    assert.ok(py.includes('scene.frame_end = 240'));
    assert.ok(py.includes('scene.render.fps = 30'));
  });

  runTest('generateRigidBodyBpy adds active or passive rigid body with physics params', () => {
    const engine = new AnimationPhysicsVFXEngine();
    const py = engine.generateRigidBodyBpy('unin.prop.barrel', {
      type: 'ACTIVE',
      mass: 15.0,
      friction: 0.6,
      restitution: 0.25
    });
    assert.ok(py.includes('target_obj.rigid_body'));
    assert.ok(py.includes('rb.type = \'ACTIVE\''));
    assert.ok(py.includes('rb.mass = 15'));
    assert.ok(py.includes('rb.friction = 0.6'));
    assert.ok(py.includes('rb.restitution = 0.25'));
  });

  runTest('generateClothBpy adds cloth modifier with physical parameters', () => {
    const engine = new AnimationPhysicsVFXEngine();
    const py = engine.generateClothBpy('unin.prop.tarp', {
      mass: 0.8,
      tension: 15.0,
      shrink: 0.05
    });
    assert.ok(py.includes('target_obj.modifiers.new(name="Cloth_Sim", type=\'CLOTH\')'));
    assert.ok(py.includes('cloth.settings.mass = 0.8'));
    assert.ok(py.includes('cloth.settings.tension_stiffness = 15'));
  });

  runTest('generateVFXRainSystemBpy generates instanced raindrop particle emitter', () => {
    const engine = new AnimationPhysicsVFXEngine();
    const py = engine.generateVFXRainSystemBpy({
      minX: -15, maxX: 15,
      minY: -15, maxY: 15,
      height: 12
    }, 3000);
    assert.ok(py.includes('raindrop_proto'));
    assert.ok(py.includes('PARTICLE_SYSTEM'));
    assert.ok(py.includes('ps.settings.count = 3000'));
    assert.ok(py.includes('ps.settings.render_type = \'OBJECT\''));
    assert.ok(py.includes('ps.settings.instance_object = proto'));
  });

  // ===========================================================================
  // SUITE 5: PERSISTENT WORLD STATE INTEGRATION
  // ===========================================================================
  console.log('\n--- SUITE 5: PERSISTENT WORLD STATE & DELTA INTEGRATION ---');

  runTest('PersistentWorldState tracks animation, physics and VFX states', () => {
    const world = new PersistentWorldState('unin_world_batch2_test');
    assert.ok(world.animationState !== undefined);
    assert.ok(world.physicsState !== undefined);
    assert.ok(world.vfxState !== undefined);

    world.setAnimationState({ cameraMove: 'PUSH_IN', timeline: { start: 1, end: 120 } });
    assert.strictEqual(world.animationState.cameraMove, 'PUSH_IN');

    world.setVFXState({ rainActive: true, particleCount: 2500 });
    assert.strictEqual(world.vfxState.rainActive, true);

    world.setPhysicsState({ rigidBodies: ['barrel_0'] });
    assert.strictEqual(world.physicsState.rigidBodies.length, 1);
  });

  runTest('PersistentWorldState persists animation/vfx state through disk serialization', () => {
    const world = new PersistentWorldState('unin_world_batch2_serial');
    world.setAnimationState({ cameraMove: 'ORBIT', startFrame: 1, endFrame: 150 });
    world.setVFXState({ rainActive: true });

    const json = world.toJSON();
    assert.strictEqual(json.animationState.cameraMove, 'ORBIT');
    assert.strictEqual(json.vfxState.rainActive, true);

    const rehydrated = PersistentWorldState.fromJSON(json);
    assert.strictEqual(rehydrated.animationState.cameraMove, 'ORBIT');
    assert.strictEqual(rehydrated.vfxState.rainActive, true);
  });

  runTest('WorldDeltaMutator recognizes ANIMATE and plans camera animation mutation', () => {
    const world = new PersistentWorldState('unin_world_batch2_mutator');
    world.registerEntity({
      canonicalId: 'unin.camera.main',
      blenderName: 'Camera',
      category: 'camera',
      role: 'primary_camera',
      transform: { location: [0, -5, 2] }
    });

    const mutator = new WorldDeltaMutator(async () => ({ success: true }), world);
    const plan = mutator.planDelta('Animate the camera slowly pushing in');

    assert.strictEqual(plan.action, 'ANIMATE');
    assert.strictEqual(plan.targetCanonicalId, 'unin.camera.main');
    assert.strictEqual(plan.parameters.cameraMove, 'PUSH_IN');
  });

  runTest('WorldDeltaMutator recognizes stop rain intent and plans VFX_CHANGE', () => {
    const world = new PersistentWorldState('unin_world_batch2_stop_rain');
    world.setVFXState({ rainActive: true });

    const mutator = new WorldDeltaMutator(async () => ({ success: true }), world);
    const plan = mutator.planDelta('Stop the rain');

    assert.strictEqual(plan.action, 'VFX_CHANGE');
    assert.strictEqual(plan.parameters.rainActive, false);
  });

  // ===========================================================================
  // SUITE 6: BLENDER ASTRA ENGINE FACADE INTEGRATION
  // ===========================================================================
  console.log('\n--- SUITE 6: BLENDER ASTRA ENGINE FACADE INTEGRATION ---');

  runTest('BlenderAstraEngine exposes all Phase 4, 5, 6 production methods', () => {
    const engine = new BlenderAstraEngine();

    assert.strictEqual(typeof engine.observeBlenderWorkspace, 'function');
    assert.strictEqual(typeof engine.dispatchNativeOperation, 'function');
    assert.strictEqual(typeof engine.configureEntityLOD, 'function');
    assert.strictEqual(typeof engine.applyHeroTopologyPolish, 'function');
    assert.strictEqual(typeof engine.applyImperfections, 'function');
    assert.strictEqual(typeof engine.planAnimationVFX, 'function');
    assert.strictEqual(typeof engine.applyCameraMotion, 'function');
    assert.strictEqual(typeof engine.applyRainVFX, 'function');
    assert.strictEqual(typeof engine.applyRigidBodyPhysics, 'function');
  });

  runTest('Autonomous3DArchitect exposes workspaceObserver, geometryEngine, animVfxEngine', () => {
    const architect = new Autonomous3DArchitect(async () => ({ success: true }));

    assert.ok(architect.workspaceObserver instanceof BlenderWorkspaceObserver);
    assert.ok(architect.operationDispatcher instanceof BlenderOperationDispatcher);
    assert.ok(architect.geometryEngine instanceof HighFidelityGeometryEngine);
    assert.ok(architect.animVfxEngine instanceof AnimationPhysicsVFXEngine);
  });

  console.log('\n========================================================================');
  console.log(`  FINAL RESULT: ${passedTests}/${totalTests} TESTS PASSED (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  console.log('========================================================================\n');

  if (passedTests < totalTests) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});
