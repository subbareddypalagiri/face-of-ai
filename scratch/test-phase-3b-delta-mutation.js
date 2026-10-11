// scratch/test-phase-3b-delta-mutation.js — Phase 3B Delta Mutation & Incremental World Editing Engine Test Suite
'use strict';

const fs = require('fs');
const path = require('path');
const {
  PersistentWorldState,
  ENTITY_STATUS,
  Autonomous3DArchitect,
  WorldDeltaMutator,
  DELTA_ACTION,
  DELTA_ERROR,
  DELTA_SCOPE,
  COLOR_PALETTE
} = require('../src/main/tools/astra/core');
const {
  BlenderAstraEngine,
  sendBridgeRPC,
  checkBridgeHealth
} = require('../src/main/tools/blenderAstraEngine');

async function runPhase3BTestSuite() {
  console.log('========================================================================');
  console.log('  UNIN PHASE 3B: DELTA MUTATION & INCREMENTAL EDITING ENGINE SUITE');
  console.log('========================================================================\n');

  let passedTests = 0;
  let totalTests = 0;
  const testWorldsDir = path.resolve(__dirname, 'worlds_test_3b');

  function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  [PASS] Test ${totalTests}: ${testName} ${details ? '(' + details + ')' : ''}`);
      return true;
    } else {
      console.error(`  [FAIL] Test ${totalTests}: ${testName} ${details ? '— ' + details : ''}`);
      return false;
    }
  }

  // Ensure clean test directory
  if (fs.existsSync(testWorldsDir)) {
    fs.rmSync(testWorldsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testWorldsDir, { recursive: true });

  try {
    // Mock RPC and state tracker simulating live Blender
    const mockBlenderScene = {
      objects: [
        { name: 'unin.environment.foundation', unin_id: 'unin.environment.foundation', location: [0, 0, 0] },
        { name: 'unin.lighting.key', unin_id: 'unin.lighting.key', energy: 1000 },
        { name: 'unin.camera.primary', unin_id: 'unin.camera.primary', location: [-2.2, -3.2, 1.1], lens: 40 }
      ]
    };

    const mockRpc = async (endpoint, params) => {
      if (endpoint === 'get_scene_state') {
        return { success: true, objects: mockBlenderScene.objects, objectsCount: mockBlenderScene.objects.length };
      }
      if (endpoint === 'execute_bpy') {
        // Handle ADD simulation
        const addMatch = params.code.match(/root\s*=\s*bpy\.data\.objects\.new\("([^"]+)", None\)/);
        if (addMatch) {
          const name = addMatch[1];
          const uidMatch = params.code.match(/root\["unin_id"\]\s*=\s*"([^"]+)"/);
          mockBlenderScene.objects.push({
            name,
            unin_id: uidMatch ? uidMatch[1] : name,
            location: [0, -3.5, 0],
            scale: [1, 1, 1],
            color: 'red'
          });
        }
        // Handle REMOVE simulation
        const remMatch = params.code.match(/target_id\s*=\s*"([^"]+)"/);
        if (remMatch && params.code.includes('bpy.data.objects.remove')) {
          const tid = remMatch[1];
          mockBlenderScene.objects = mockBlenderScene.objects.filter(o => o.unin_id !== tid && o.name !== tid);
        }
        // Handle MOVE simulation
        if (params.code.includes('DELTA_MOVED') || params.code.includes('obj.location')) {
          const moveMatch = params.code.match(/target_id\s*=\s*"([^"]+)"/);
          if (moveMatch) {
            const obj = mockBlenderScene.objects.find(o => o.unin_id === moveMatch[1]);
            if (obj) obj.location[0] -= 2.0; // Simulate 2m left
          }
        }
        // Handle SCALE simulation
        if (params.code.includes('DELTA_SCALED')) {
          const scaleMatch = params.code.match(/target_id\s*=\s*"([^"]+)"/);
          if (scaleMatch) {
            const obj = mockBlenderScene.objects.find(o => o.unin_id === scaleMatch[1]);
            if (obj) obj.scale = [1.2, 1.2, 1.2];
          }
        }
        // Handle MATERIAL simulation
        if (params.code.includes('DELTA_MATERIAL_MODIFIED')) {
          const matMatch = params.code.match(/target_id\s*=\s*"([^"]+)"/);
          if (matMatch) {
            const obj = mockBlenderScene.objects.find(o => o.unin_id === matMatch[1]);
            if (obj) obj.color = 'black';
          }
        }
        return { success: true };
      }
      return { success: true };
    };

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 1: ADD ENTITY
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 1: ADD ENTITY DELTA ---');
    const worldState = PersistentWorldState.createNew({
      description: 'Futuristic Neo-City Living World',
      storageDir: testWorldsDir
    });

    worldState.registerEntity({
      uninId: 'unin.environment.foundation',
      blenderName: 'Urban_Foundation_Road',
      category: 'environment',
      role: 'foundation'
    });
    worldState.registerEntity({
      uninId: 'unin.camera.primary',
      blenderName: 'Cinema_Primary_Cam',
      category: 'camera',
      role: 'camera'
    });

    const mutator = new WorldDeltaMutator(mockRpc);
    const architect = new Autonomous3DArchitect(mockRpc, {
      workspaceRoot: path.resolve(__dirname, '..'),
      worldsDir: testWorldsDir
    });
    architect.worldState = worldState;

    const addRes = await architect.mutateWorldIncremental('Add a red Ferrari near the entrance');
    assert(addRes.success === true, 'Add Ferrari delta executed successfully');
    assert(addRes.action === DELTA_ACTION.ADD, 'Action identified as ADD');
    assert(addRes.versionBefore === 1 && addRes.versionAfter === 2, 'World version incremented v1 -> v2', `v${addRes.versionAfter}`);
    assert(addRes.targetsAffected.length === 1, 'Target affected registered');
    const ferrariId = addRes.targetsAffected[0];
    assert(ferrariId.startsWith('unin.entity.vehicle.ferrari_sports_car'), 'Ferrari assigned canonical entity ID', ferrariId);
    assert(worldState.hasEntity(ferrariId) === true, 'Ferrari entity registered in worldState');
    assert(worldState.hasEntity('unin.environment.foundation') === true, 'Existing foundation remains intact (no wipe)');
    assert(worldState.hasEntity('unin.camera.primary') === true, 'Existing camera remains intact');

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 2: MODIFY (MATERIAL_CHANGE)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 2: MODIFY MATERIAL (RECOLOR) ---');
    const colorRes = await architect.mutateWorldIncremental('Make the Ferrari black');
    assert(colorRes.success === true, 'Recolor Ferrari delta executed successfully');
    assert(colorRes.action === DELTA_ACTION.MATERIAL_CHANGE, 'Action identified as MATERIAL_CHANGE');
    assert(colorRes.targetsAffected[0] === ferrariId, 'Same canonical Ferrari ID modified', colorRes.targetsAffected[0]);
    assert(colorRes.versionBefore === 2 && colorRes.versionAfter === 3, 'World version incremented v2 -> v3', `v${colorRes.versionAfter}`);
    const ferrariEnt = worldState.getEntity(ferrariId);
    assert(ferrariEnt.metadata.primaryColor === 'black', 'Entity metadata updated with black color');
    assert(worldState.hasEntity('unin.environment.foundation') === true, 'Foundation remains intact');

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 3: MOVE (TRANSLATE)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 3: MOVE ENTITY (TRANSLATE) ---');
    const moveRes = await architect.mutateWorldIncremental('Move the Ferrari 2 meters left');
    assert(moveRes.success === true, 'Move Ferrari delta executed successfully');
    assert(moveRes.action === DELTA_ACTION.MOVE, 'Action identified as MOVE');
    assert(moveRes.targetsAffected[0] === ferrariId, 'Same canonical Ferrari ID moved');
    assert(moveRes.versionBefore === 3 && moveRes.versionAfter === 4, 'World version incremented v3 -> v4', `v${moveRes.versionAfter}`);
    assert(moveRes.parameters.offset[0] === -2.0, 'Calculated lateral offset is -2.0m', `${moveRes.parameters.offset[0]}m`);
    assert(worldState.getEntity(ferrariId).metadata.targetLocation[0] === -2.0, 'Entity target location updated');

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 4: SCALE
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 4: SCALE ENTITY ---');
    const scaleRes = await architect.mutateWorldIncremental('Make the Ferrari 20% bigger');
    assert(scaleRes.success === true, 'Scale Ferrari delta executed successfully');
    assert(scaleRes.action === DELTA_ACTION.SCALE, 'Action identified as SCALE');
    assert(scaleRes.targetsAffected[0] === ferrariId, 'Same canonical Ferrari ID scaled');
    assert(scaleRes.versionBefore === 4 && scaleRes.versionAfter === 5, 'World version incremented v4 -> v5', `v${scaleRes.versionAfter}`);
    assert(scaleRes.parameters.factor === 1.2, 'Scale factor is exactly 1.2 (+20%)', `${scaleRes.parameters.factor}`);
    assert(worldState.getEntity(ferrariId).metadata.scaleMultiplier === 1.2, 'Entity scaleMultiplier recorded');

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 5: REMOVE
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 5: REMOVE ENTITY ---');
    const removeRes = await architect.mutateWorldIncremental('Remove the Ferrari');
    assert(removeRes.success === true, 'Remove Ferrari delta executed successfully');
    assert(removeRes.action === DELTA_ACTION.REMOVE, 'Action identified as REMOVE');
    assert(removeRes.targetsAffected[0] === ferrariId, 'Targeted Ferrari entity removed');
    assert(removeRes.versionBefore === 5 && removeRes.versionAfter === 6, 'World version incremented v5 -> v6', `v${removeRes.versionAfter}`);
    assert(worldState.getEntity(ferrariId).status === ENTITY_STATUS.REMOVED, 'Ferrari marked as REMOVED in registry');
    assert(worldState.hasEntity(ferrariId) === false, 'hasEntity returns false for removed entity');
    assert(worldState.hasEntity('unin.environment.foundation') === true, 'Foundation remains active');

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 6: CAMERA MUTATION
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 6: CAMERA MUTATION ---');
    const camRes = await architect.mutateWorldIncremental('Move camera lower and zoom in');
    assert(camRes.success === true, 'Camera delta executed successfully');
    assert(camRes.action === DELTA_ACTION.CAMERA_CHANGE, 'Action identified as CAMERA_CHANGE');
    assert(camRes.targetsAffected[0] === 'unin.camera.primary', 'Primary cinema camera targeted');
    assert(camRes.versionBefore === 6 && camRes.versionAfter === 7, 'World version incremented v6 -> v7');
    assert(camRes.parameters.offset[2] < 0, 'Camera offset lower in Z axis');
    assert(camRes.parameters.focalDelta > 0, 'Camera lens zoomed in');

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 7: ENVIRONMENT MUTATION
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 7: ENVIRONMENT MUTATION ---');
    const envRes = await architect.mutateWorldIncremental('Add rain with wet puddles and thicker fog');
    assert(envRes.success === true, 'Environment delta executed successfully');
    assert(envRes.action === DELTA_ACTION.ENVIRONMENT_CHANGE, 'Action identified as ENVIRONMENT_CHANGE');
    assert(envRes.versionBefore === 7 && envRes.versionAfter === 8, 'World version incremented v7 -> v8');
    assert(envRes.parameters.weather === 'rain', 'Rain precipitation configured');
    assert(envRes.parameters.puddles === true, 'Puddles response configured');
    assert(worldState.environmentState.weather === 'rain', 'WorldState environment updated');
    assert(worldState.hasEntity('unin.environment.foundation') === true, 'Foundation still active');

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 8: CONTEXTUAL REFERENCE RESOLUTION
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 8: CONTEXTUAL REFERENCE RESOLUTION ---');
    // Spawn a new car to test conversational follow-ups
    const addCar2 = await architect.mutateWorldIncremental('Add a yellow sports car on the right');
    assert(addCar2.success === true, 'Added yellow car');
    const car2Id = addCar2.targetsAffected[0];

    // Follow up 1: "Make it black"
    const pron1 = await architect.mutateWorldIncremental('Make it black');
    assert(pron1.success === true, 'Pronoun "it" resolves to recent car');
    assert(pron1.targetsAffected[0] === car2Id, 'Pronoun modified exact active car');

    // Follow up 2: "Move it 3 meters forward"
    const pron2 = await architect.mutateWorldIncremental('Move it 3 meters forward');
    assert(pron2.success === true, 'Pronoun "it" resolves to same car for movement');
    assert(pron2.targetsAffected[0] === car2Id, 'Same car moved');

    // Follow up 3: "Make that 20% bigger"
    const pron3 = await architect.mutateWorldIncremental('Make that 20% bigger');
    assert(pron3.success === true, 'Reference "that" resolves to same car for scaling');
    assert(pron3.targetsAffected[0] === car2Id, 'Same car scaled');

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 9: AMBIGUITY DETECTION
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 9: AMBIGUITY DETECTION ---');
    // Add another vehicle so that two active vehicles exist simultaneously
    const addCar3 = await architect.mutateWorldIncremental('Add a blue car on the left');
    const car3Id = addCar3.targetsAffected[0];

    // Clear focus to simulate new user turn with ambiguous intent
    architect.conversationContext.lastFocusedEntityId = null;

    // Ambiguous prompt: "Move the car" (two cars exist: car2 and car3)
    const ambigRes = await architect.mutateWorldIncremental('Move the car');
    assert(ambigRes.success === false, 'Ambiguous prompt correctly rejected without guessing');
    assert(ambigRes.error === DELTA_ERROR.AMBIGUOUS_TARGET, 'Error code is AMBIGUOUS_TARGET');
    assert(Array.isArray(ambigRes.candidates) && ambigRes.candidates.length >= 2, 'Candidates array returned for user disambiguation', `count=${ambigRes.candidates.length}`);

    // Disambiguated prompt: "Move the left car"
    const disambigRes = await architect.mutateWorldIncremental('Move the left car');
    assert(disambigRes.success === true, 'Spatial disambiguation "left car" successfully resolved');
    assert(disambigRes.targetsAffected[0] === car3Id, 'Left car correctly targeted');

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 10: IDEMPOTENCY
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 10: IDEMPOTENCY ---');
    const plannedOp = mutator.planDelta('Make the blue car green', worldState, architect.conversationContext);
    const exec1 = await mutator.executeMutationTransaction(plannedOp, worldState);
    assert(exec1.success === true, 'Initial execution succeeded');

    // Re-submit exact same planned operation
    const exec2 = await mutator.executeMutationTransaction(plannedOp, worldState);
    assert(exec2.success === true, 'Duplicate execution returned success');
    assert(exec1.operationId === exec2.operationId, 'Operation ID matches');
    assert(exec1.versionAfter === exec2.versionAfter, 'World version not falsely incremented twice');

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 11: VERSION CONFLICT DETECTION
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 11: VERSION CONFLICT DETECTION ---');
    // Create stale delta for already removed Ferrari
    const staleDelta = {
      operationId: 'op_stale_999',
      worldId: worldState.worldId,
      baseVersion: 1, // Stale version
      action: DELTA_ACTION.MOVE,
      targets: [{ entityId: ferrariId }], // Was removed at v6!
      parameters: { offset: [1, 0, 0] }
    };
    const staleRes = await mutator.executeMutationTransaction(staleDelta, worldState);
    assert(staleRes.success === false, 'Stale delta on deleted entity rejected');
    assert(staleRes.error === DELTA_ERROR.ENTITY_NOT_FOUND || staleRes.error === DELTA_ERROR.WORLD_VERSION_CONFLICT, 'Reported entity/version conflict error', staleRes.error);

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 12: MANUAL BLENDER EDIT RECONCILIATION
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 12: MANUAL BLENDER EDIT RECONCILIATION ---');
    // Simulate user renaming car3 in Blender Outliner
    const mockBlenderInspectionRpc = async (endpoint, params) => {
      if (endpoint === 'execute_bpy') {
        const match = params.code.match(/with\s+open\(r?"([^"]+)"/);
        if (match) {
          const tempPath = match[1];
          const mockInspectionData = [
            { name: 'Urban_Foundation_Road', unin_id: 'unin.environment.foundation', unin_world_id: worldState.worldId, unin_version: 1, type: 'MESH' },
            { name: 'MyUserRenamedFerrari', unin_id: car3Id, unin_world_id: worldState.worldId, unin_version: 1, type: 'EMPTY' }
          ];
          fs.writeFileSync(tempPath, JSON.stringify(mockInspectionData));
        }
        return { success: true };
      }
      return { success: true };
    };

    const reconRes = await worldState.reconcileWithBlender(mockBlenderInspectionRpc);
    assert(reconRes.verifiedEntities.length === 2, 'Reconciliation verified entities');
    assert(reconRes.renamedEntities.length === 1, 'Manual Outliner rename detected');
    assert(worldState.getEntity(car3Id).blenderName === 'MyUserRenamedFerrari', 'Registry auto-synced new Blender name');

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 13: TRANSACTION ROLLBACK ON INJECTED FAILURE
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 13: TRANSACTION ROLLBACK ---');
    let rollbackInvoked = false;
    const mockCheckpointMgr = {
      createCheckpoint: async (tag) => ({ id: 'chk_test', tag, filePath: 'mock.blend' }),
      rollbackToLatest: async () => { rollbackInvoked = true; return true; }
    };

    const failingRpc = async (endpoint, params) => {
      if (endpoint === 'execute_bpy') {
        throw new Error('Simulated Python Syntax Error in Blender execution');
      }
      return { success: true };
    };

    const failingMutator = new WorldDeltaMutator(failingRpc);
    const failingPlan = {
      operationId: 'op_fail_test',
      worldId: worldState.worldId,
      baseVersion: worldState.version,
      action: DELTA_ACTION.MOVE,
      targets: [{ entityId: car2Id, blenderName: 'YellowCar' }],
      parameters: { offset: [0, 0, 1] }
    };

    const versionBeforeFail = worldState.version;
    const failRes = await failingMutator.executeMutationTransaction(failingPlan, worldState, mockCheckpointMgr);
    assert(failRes.success === false, 'Failing mutation returned failure');
    assert(failRes.error === DELTA_ERROR.BLENDER_EXECUTION_FAILED, 'Reported BLENDER_EXECUTION_FAILED error');
    assert(rollbackInvoked === true, 'Checkpoint rollback was invoked upon failure');
    assert(worldState.version === versionBeforeFail, 'World version was NOT incremented falsely', `version=${worldState.version}`);

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 14: BLENDER ASTRA ENGINE ROUTING INTEGRATION
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 14: BLENDER ASTRA ENGINE INTEGRATION ---');
    const engine = new BlenderAstraEngine();
    assert(typeof engine.mutateActiveWorld === 'function', 'engine.mutateActiveWorld is defined');

    // Test incremental dispatch through engine
    const engineRes = await engine.mutateActiveWorld('Make it yellow');
    assert(engineRes !== null && typeof engineRes === 'object', 'Engine dispatched incremental mutation');

  } finally {
    // Clean up test world storage
    if (fs.existsSync(testWorldsDir)) {
      fs.rmSync(testWorldsDir, { recursive: true, force: true });
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Summary
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n========================================================================');
  console.log(`  PHASE 3B VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  console.log('========================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runPhase3BTestSuite().catch(err => {
  console.error('Phase 3B test suite error:', err);
  process.exit(1);
});
