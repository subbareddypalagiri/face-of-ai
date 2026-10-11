// scratch/test-phase-3a-persistent-world.js — Phase 3A Persistent World State & Stable Entity Identity Verification
'use strict';

const fs = require('fs');
const path = require('path');
const {
  PersistentWorldState,
  ENTITY_STATUS,
  Autonomous3DArchitect
} = require('../src/main/tools/astra/core');
const {
  BlenderAstraEngine,
  sendBridgeRPC,
  checkBridgeHealth
} = require('../src/main/tools/blenderAstraEngine');

async function runPhase3ATestSuite() {
  console.log('========================================================================');
  console.log('  UNIN PHASE 3A: PERSISTENT WORLD STATE & STABLE ENTITY IDENTITY SUITE');
  console.log('========================================================================\n');

  let passedTests = 0;
  let totalTests = 0;
  const testWorldsDir = path.resolve(__dirname, 'worlds_test');

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
    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 1: PersistentWorldState Lifecycle & Data Structure
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 1: PERSISTENT WORLD STATE LIFECYCLE & DATA STRUCTURE ---');

    const world = PersistentWorldState.createNew({
      description: 'Cyberpunk Neo-Tokyo Street',
      storageDir: testWorldsDir
    });

    assert(world.worldId.startsWith('unin_world_'), 'worldId initialized with canonical prefix', world.worldId);
    assert(world.version === 1, 'Initial world version starts at 1', `version=${world.version}`);
    assert(typeof world.createdAt === 'string' && typeof world.updatedAt === 'string', 'Created and updated timestamps initialized');
    assert(world.entityRegistry instanceof Map && world.entityRegistry.size === 0, 'Entity registry initialized as empty Map');
    assert(Array.isArray(world.mutationHistory) && world.mutationHistory.length === 0, 'Mutation history initialized as empty array');

    // Register entities
    const foundationEntity = world.registerEntity({
      uninId: 'unin.environment.foundation',
      blenderName: 'Urban_Asphalt_Road',
      category: 'environment',
      role: 'foundation',
      metadata: { width: 50, length: 100 }
    });
    assert(foundationEntity.uninId === 'unin.environment.foundation', 'Foundation entity registered with canonical ID', foundationEntity.uninId);
    assert(foundationEntity.status === ENTITY_STATUS.ACTIVE, 'Registered entity has ACTIVE status');

    const heroEntity = world.registerEntity({
      uninId: 'unin.entity.vehicle_0',
      blenderName: 'Cyberpunk_Chopper_Assembly',
      category: 'vehicle',
      role: 'hero',
      metadata: { assetStrategy: 'procedural_assembly', primaryColor: 'neon_cyan' }
    });
    assert(heroEntity.role === 'hero', 'Hero entity registered', heroEntity.uninId);
    assert(world.entityRegistry.size === 2, 'Registry size reflects registered entities', `count=${world.entityRegistry.size}`);

    // Query tests
    assert(world.hasEntity('unin.entity.vehicle_0') === true, 'hasEntity returns true for existing entity');
    assert(world.hasEntity('unin.entity.non_existent') === false, 'hasEntity returns false for missing entity');

    const retrievedHero = world.getHeroEntity();
    assert(retrievedHero !== null && retrievedHero.uninId === 'unin.entity.vehicle_0', 'getHeroEntity correctly identifies hero role', retrievedHero?.uninId);

    // Entity update
    const updated = world.updateEntity('unin.entity.vehicle_0', {
      metadata: { assetStrategy: 'procedural_assembly', primaryColor: 'matte_black', modified: true }
    });
    assert(Boolean(updated) && updated.uninId === 'unin.entity.vehicle_0', 'updateEntity returns updated entity object');
    assert(world.version === 2, 'Entity update increments monotonic world version to 2', `version=${world.version}`);
    assert(world.getEntity('unin.entity.vehicle_0').metadata.primaryColor === 'matte_black', 'Entity metadata properly updated');

    // Entity soft removal
    const removed = world.removeEntity('unin.entity.vehicle_0');
    assert(Boolean(removed) && removed.status === ENTITY_STATUS.REMOVED, 'removeEntity marks status as REMOVED');
    assert(world.getEntity('unin.entity.vehicle_0').status === ENTITY_STATUS.REMOVED, 'Registry reflects REMOVED status');
    assert(world.version === 3, 'Entity removal increments monotonic world version to 3', `version=${world.version}`);

    // Re-register hero for subsequent tests
    world.registerEntity({
      uninId: 'unin.entity.vehicle_0',
      blenderName: 'Cyberpunk_Chopper_Assembly',
      category: 'vehicle',
      role: 'hero',
      metadata: { assetStrategy: 'procedural_assembly', primaryColor: 'cherry_red' }
    });

    // Mutation logging
    const mutation = world.recordMutation('UPDATE_MATERIAL', {
      entityIds: ['unin.entity.vehicle_0'],
      notes: 'Applied cherry red metallic car paint'
    });
    assert(mutation.action === 'UPDATE_MATERIAL', 'recordMutation records correct action');
    assert(mutation.versionBefore === 3 && mutation.versionAfter === 4, 'recordMutation increments version monotonically', `v${mutation.versionBefore}->v${mutation.versionAfter}`);
    assert(world.mutationHistory.length === 1, 'Mutation added to mutationHistory log');

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 2: Atomic Persistence & Rehydration
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 2: ATOMIC PERSISTENCE & REHYDRATION ---');

    const saveRes = await world.save();
    assert(saveRes.success === true && fs.existsSync(saveRes.filePath), 'World file written to disk atomically', path.basename(saveRes.filePath));

    const activePointerPath = path.join(testWorldsDir, 'active_world.json');
    assert(fs.existsSync(activePointerPath), 'active_world.json pointer file written to disk');
    const activePointer = JSON.parse(fs.readFileSync(activePointerPath, 'utf8'));
    assert(activePointer.activeWorldId === world.worldId, 'active_world.json points to current worldId', activePointer.activeWorldId);

    // Rehydrate from specific worldId
    const rehydrated = PersistentWorldState.load(world.worldId, testWorldsDir);
    assert(rehydrated !== null, 'PersistentWorldState.load loads world instance');
    assert(rehydrated.worldId === world.worldId, 'Rehydrated worldId matches original', rehydrated.worldId);
    assert(rehydrated.version === world.version, 'Rehydrated world version matches original', `v${rehydrated.version}`);
    assert(rehydrated.entityRegistry instanceof Map, 'Rehydrated entityRegistry is a Map');
    assert(rehydrated.entityRegistry.size === world.entityRegistry.size, 'Rehydrated entity count matches', `count=${rehydrated.entityRegistry.size}`);
    assert(rehydrated.hasEntity('unin.environment.foundation') === true, 'Foundation entity rehydrated');
    assert(rehydrated.hasEntity('unin.entity.vehicle_0') === true, 'Hero entity rehydrated');
    assert(rehydrated.mutationHistory.length === 1, 'Mutation history rehydrated', `mutations=${rehydrated.mutationHistory.length}`);

    // Rehydrate active world
    const activeRehydrated = PersistentWorldState.loadActive(testWorldsDir);
    assert(activeRehydrated !== null && activeRehydrated.worldId === world.worldId, 'PersistentWorldState.loadActive loads active world from pointer');

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 3: Autonomous3DArchitect BPY Entity Tagging & World Linking
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 3: AUTONOMOUS 3D ARCHITECT BPY ENTITY TAGGING ---');

    const mockRpc = async (endpoint, params) => {
      if (endpoint === 'get_scene_state') {
        return { success: true, objects: [], objectsCount: 0 };
      }
      return { success: true };
    };

    const architect = new Autonomous3DArchitect(mockRpc, {
      workspaceRoot: path.resolve(__dirname, '..'),
      worldsDir: testWorldsDir
    });

    const mockSceneGraph = {
      environment: { type: 'urban_street' },
      weather: { precipitation: 'rain', wetReflections: true, fogDensity: 0.05 },
      timeOfDay: 'night',
      cinematography: { lensFocalLength: 35, apertureFStop: 2.8 }
    };

    // Test Foundation Code Generation for Unin ID Tagging
    const foundationBpy = architect._generateFoundationBpy(mockSceneGraph, world.worldId);
    assert(foundationBpy.includes('ground["unin_id"] = "unin.environment.foundation"'), 'Foundation BPY tags ground["unin_id"]');
    assert(foundationBpy.includes(`ground["unin_world_id"] = "${world.worldId}"`), 'Foundation BPY tags ground["unin_world_id"]');
    assert(foundationBpy.includes('ground["unin_version"] = 1'), 'Foundation BPY tags ground["unin_version"]');

    // Test Hero Asset Code Generation for Unin ID Tagging
    const mockHeroEntity = {
      id: 'unin.entity.vehicle_0',
      category: 'vehicle',
      targetLocation: [0, 0, 0],
      estimatedDimensions: [2.2, 0.8, 1.1],
      assetResolution: {
        strategy: 'PROCEDURAL_ASSEMBLY',
        assetId: 'chopper_motorcycle',
        meshData: {}
      }
    };
    const heroBpy = architect._generateHeroAssetBpy(mockHeroEntity, mockSceneGraph, world.worldId);
    assert(heroBpy.includes(`_hero_cand["unin_id"] = "${mockHeroEntity.id}"`), 'Hero BPY tags _hero_cand["unin_id"]');
    assert(heroBpy.includes(`_hero_cand["unin_world_id"] = "${world.worldId}"`), 'Hero BPY tags _hero_cand["unin_world_id"]');
    assert(heroBpy.includes('_hero_cand["unin_version"] = 1'), 'Hero BPY tags _hero_cand["unin_version"]');

    // Test Secondary Props Code Generation for Unin ID Tagging
    const propsBpy = architect._generateSecondaryPropsBpy(mockSceneGraph, mockHeroEntity, world.worldId);
    assert(propsBpy.includes('curb["unin_id"] = f"unin.prop.curb_'), 'Props BPY tags curb["unin_id"] with dynamic side');
    assert(propsBpy.includes(`curb["unin_world_id"] = "${world.worldId}"`), 'Props BPY tags curb["unin_world_id"]');
    assert(propsBpy.includes('pole["unin_id"] = f"unin.prop.streetlamp_pole_{i+1}"'), 'Props BPY tags streetlamp pole["unin_id"] with dynamic index');

    // Test Lighting Atmosphere Code Generation for Unin ID Tagging
    const lightingBpy = architect._generateLightingAtmosphereBpy(mockSceneGraph, mockHeroEntity, world.worldId);
    assert(lightingBpy.includes('look_target["unin_id"] = "unin.camera.look_target"'), 'Lighting BPY tags look_target["unin_id"]');
    assert(lightingBpy.includes('fill_obj["unin_id"] = "unin.lighting.fill"'), 'Lighting BPY tags fill_obj["unin_id"]');
    assert(lightingBpy.includes(`fill_obj["unin_world_id"] = "${world.worldId}"`), 'Lighting BPY tags fill_obj["unin_world_id"]');

    // Test Camera Optics Code Generation for Unin ID Tagging
    const cameraBpy = architect._generateCameraOpticsBpy(mockSceneGraph, mockHeroEntity, world.worldId);
    assert(cameraBpy.includes('cam_obj["unin_id"] = "unin.camera.primary"'), 'Camera BPY tags cam_obj["unin_id"]');
    assert(cameraBpy.includes(`cam_obj["unin_world_id"] = "${world.worldId}"`), 'Camera BPY tags cam_obj["unin_world_id"]');

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 4: Scene Reconciliation Engine (Outliner Renames & Edge Cases)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 4: SCENE RECONCILIATION ENGINE ---');

    const reconWorld = PersistentWorldState.createNew({
      description: 'Reconciliation Test Scene',
      storageDir: testWorldsDir
    });

    reconWorld.registerEntity({
      uninId: 'unin.environment.foundation',
      blenderName: 'Urban_Asphalt_Road',
      category: 'environment',
      role: 'foundation'
    });

    reconWorld.registerEntity({
      uninId: 'unin.entity.vehicle_0',
      blenderName: 'Chopper_Motorcycle_Assembly',
      category: 'vehicle',
      role: 'hero'
    });

    reconWorld.registerEntity({
      uninId: 'unin.prop.streetlamp_0',
      blenderName: 'Streetlamp_0',
      category: 'prop',
      role: 'secondary'
    });

    // Mock bridge RPC simulating a live Blender scene inspection
    const mockBlenderInspectionRpc = async (endpoint, params) => {
      if (endpoint === 'execute_bpy') {
        const match = params.code.match(/with\s+open\(r?"([^"]+)"/);
        if (match) {
          const tempPath = match[1];
          const mockInspectionData = [
            { name: 'Urban_Asphalt_Road', unin_id: 'unin.environment.foundation', unin_world_id: reconWorld.worldId, unin_version: 1, type: 'MESH', location: [0, 0, 0] },
            { name: 'MyCustomHarley', unin_id: 'unin.entity.vehicle_0', unin_world_id: reconWorld.worldId, unin_version: 1, type: 'EMPTY', location: [0, 0, 0] },
            { name: 'Cube', unin_id: null, unin_world_id: null, unin_version: null, type: 'MESH', location: [1, 2, 0] },
            { name: 'OldAlienShip', unin_id: 'unin.entity.vehicle_alien', unin_world_id: 'world_old_999', unin_version: 1, type: 'MESH', location: [-5, 0, 2] }
          ];
          fs.writeFileSync(tempPath, JSON.stringify(mockInspectionData));
        }
        return { success: true };
      }
      return { success: true };
    };

    const reconResult = await reconWorld.reconcileWithBlender(mockBlenderInspectionRpc);

    assert(reconResult.counts !== undefined, 'Reconciliation executes and populates counts');
    assert(reconResult.verifiedEntities.length === 2, 'Two entities verified in scene', `count=${reconResult.verifiedEntities.length}`);
    assert(reconResult.renamedEntities.length === 1, 'Outliner rename accurately detected', reconResult.renamedEntities[0]?.uninId);
    assert(reconResult.renamedEntities[0].currentBlenderName === 'MyCustomHarley', 'New Outliner name captured', reconResult.renamedEntities[0]?.currentBlenderName);
    assert(reconWorld.getEntity('unin.entity.vehicle_0').blenderName === 'MyCustomHarley', 'Registry blenderName updated after rename');
    assert(reconResult.missingInBlender.length === 1, 'Deleted streetlamp flagged as missing', reconResult.missingInBlender[0]?.uninId);
    assert(reconResult.untrackedObjects.length === 1, 'Manually added Cube flagged as untracked', reconResult.untrackedObjects[0]?.name);
    assert(reconResult.orphanedInBlender.length === 1, 'Object from older world flagged as orphaned', reconResult.orphanedInBlender[0]?.name);

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 5: BlenderAstraEngine High-Level Integration
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 5: BLENDER ASTRA ENGINE INTEGRATION ---');

    const engine = new BlenderAstraEngine();
    assert(typeof engine.reconcileActiveWorld === 'function', 'engine.reconcileActiveWorld is defined');
    assert(typeof engine.getActiveWorldState === 'function', 'engine.getActiveWorldState is defined');

    // Check if Blender live bridge is online
    const bridgeHealth = await checkBridgeHealth();
    console.log(`  [INFO] Blender Live Bridge status: ${bridgeHealth.online ? 'ONLINE (Port 8192, v' + bridgeHealth.blenderVersion + ')' : 'OFFLINE'}`);

    if (bridgeHealth.online) {
      console.log('  [INFO] Running live Blender RPC tagging and reconciliation test...');
      
      // Execute live BPY to create a tagged test entity in live Blender session
      const testTagBpy = `
import bpy
test_obj = bpy.data.objects.get("UNIN_Phase3A_Test_Entity")
if not test_obj:
    mesh = bpy.data.meshes.new("UNIN_Phase3A_Test_Mesh")
    test_obj = bpy.data.objects.new("UNIN_Phase3A_Test_Entity", mesh)
    bpy.context.collection.objects.link(test_obj)

test_obj["unin_id"] = "unin.test.phase3a_probe"
test_obj["unin_world_id"] = "${reconWorld.worldId}"
test_obj["unin_version"] = 1
`;
      const liveRpcRes = await sendBridgeRPC('execute_bpy', { code: testTagBpy, autoCapture: false });
      assert(liveRpcRes.success === true, 'Live Blender BPY execution with custom properties succeeded');

      // Now query custom properties directly from live Blender
      const queryBpy = `
import bpy
obj = bpy.data.objects.get("UNIN_Phase3A_Test_Entity")
if obj:
    tag_id = obj.get("unin_id")
    tag_world = obj.get("unin_world_id")
    print(f"UNIN_LIVE_TAG: {tag_id} | {tag_world}")
`;
      const queryRes = await sendBridgeRPC('execute_bpy', { code: queryBpy, autoCapture: false });
      assert(queryRes.success === true, 'Live Blender BPY tag query succeeded');

      // Cleanup probe entity
      const cleanupBpy = `
import bpy
obj = bpy.data.objects.get("UNIN_Phase3A_Test_Entity")
if obj:
    bpy.data.objects.remove(obj, do_unlink=True)
`;
      await sendBridgeRPC('execute_bpy', { code: cleanupBpy, autoCapture: false });
    } else {
      console.log('  [INFO] Blender Live Bridge is offline; live socket verification skipped (mock verification complete).');
    }

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
  console.log(`  PHASE 3A VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  console.log('========================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runPhase3ATestSuite().catch(err => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
