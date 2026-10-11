// scratch/test-autonomous-3d-architect.js — End-to-End Verification of God Mode Autonomous 3D Architect
'use strict';

const fs = require('fs');
const path = require('path');
const { BlenderAstraEngine } = require('../src/main/tools/blenderAstraEngine');
const { UnifiedAILayer } = require('../src/main/tools/astra/core/UnifiedAILayer');
const { IntentInterpreter } = require('../src/main/tools/astra/core/IntentInterpreter');
const { SceneGraph } = require('../src/main/tools/astra/core/SceneGraph');
const { AssetResolver } = require('../src/main/tools/astra/core/AssetResolver');

async function runTestSuite() {
  console.log('========================================================================');
  console.log('  UNIN GOD MODE — AUTONOMOUS 3D WORLD ARCHITECT TEST SUITE');
  console.log('========================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

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

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: Semantic Intent Understanding across Diverse Queries
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 1: SEMANTIC 3D INTENT UNDERSTANDING ---');
  const ai = new UnifiedAILayer();
  const interpreter = new IntentInterpreter(ai);

  const testPrompts = [
    {
      prompt: 'Create a photorealistic Harley Davidson motorcycle on a wet Indian street at night, with rain, puddles, reflections, traffic lights, atmospheric fog and cinematic camera composition',
      expectedCategory: 'vehicle',
      expectedWeather: 'rain'
    },
    {
      prompt: 'Build an ancient Indian temple in morning mist with stone pillars',
      expectedCategory: 'architecture',
      expectedWeather: 'mist'
    },
    {
      prompt: 'Make a futuristic spaceship flying through space',
      expectedCategory: 'vehicle',
      expectedWeather: 'none'
    },
    {
      prompt: 'Create a mythical dragon on a rocky mountain',
      expectedCategory: 'creature',
      expectedWeather: 'none'
    }
  ];

  for (const item of testPrompts) {
    const spec = await interpreter.interpret(item.prompt);
    assert(spec && spec.heroEntities && spec.heroEntities.length > 0, `Parse: "${item.prompt.slice(0, 40)}..."`);
    const hero = spec.heroEntities[0];
    assert(hero && hero.category === item.expectedCategory, `Entity Category "${hero.category}" === "${item.expectedCategory}"`);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: SceneGraph Schema Integrity & Canonical Validation
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 2: CANONICAL SCENE GRAPH INTEGRITY ---');
  const sampleSpec = await interpreter.interpret(testPrompts[0].prompt);
  const sg = new SceneGraph(sampleSpec);
  const val = sg.validate();
  assert(val.valid === true, 'SceneGraph Schema Validation', `Errors: ${val.errors.join(', ')}`);
  assert(sg.getHeroEntity() !== null, 'Hero entity present in SceneGraph', sg.getHeroEntity().name);
  assert(sg.getEntity('unin.environment.foundation') !== null, 'Foundation ground entity present');
  assert(sg.getEntity('unin.camera.primary') !== null, 'Primary camera entity present');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: Multi-Tiered Asset Intelligence & Hero Asset Rules
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 3: ASSET RESOLVER MULTI-TIER REASONING ---');
  const resolver = new AssetResolver();

  // A. Harley Motorcycle
  const mcEntity = { name: 'Harley Davidson Motorcycle', category: 'vehicle', description: 'cruiser bike' };
  const mcRes = await resolver.resolveEntity(mcEntity);
  assert(mcRes.strategy === 'PROCEDURAL_ASSEMBLY', 'Motorcycle resolves to Procedural Component Assembly (Never toy cube!)', mcRes.assemblyType);
  assert(mcRes.qualityLevel === 'PROCEDURAL_STUDIO_GRADE', 'Quality Level Studio Grade');

  // B. Ferrari / Car
  const carEntity = { name: 'Ferrari SF90 Supercar', category: 'vehicle', description: 'red sports car' };
  const carRes = await resolver.resolveEntity(carEntity);
  assert(carRes.strategy === 'LOCAL_CATALOG', 'Car resolves to Local Catalog Asset', carRes.path);

  // C. Ancient Temple
  const templeEntity = { name: 'Ancient Temple', category: 'architecture', description: 'stone mandapa' };
  const templeRes = await resolver.resolveEntity(templeEntity);
  assert(templeRes.strategy === 'PROCEDURAL_ASSEMBLY', 'Temple resolves to Procedural Architectural Assembly', templeRes.assemblyType);

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: Live Blender 5.1 End-to-End Closed-Loop Execution
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 4: LIVE BLENDER 5.1 CLOSED-LOOP EXECUTION (PORT 8192) ---');
  const engine = new BlenderAstraEngine();

  const targetMission = 'Create a photorealistic Harley Davidson motorcycle on a wet Indian street at night, with rain, puddles, reflections, traffic lights, atmospheric fog and cinematic camera composition';

  console.log(`  Executing: "${targetMission}"...`);
  const buildResult = await engine.executeAstraIntent(targetMission, {
    isNewScene: true,
    onProgress: (p) => {
      console.log(`    [Progress ${p.step}/${p.totalSteps}] ${p.title}: ${p.description}`);
    }
  });

  assert(buildResult.success === true, 'Closed-Loop Build Succeeded');
  assert(buildResult.mode === 'autonomous_3d_architect_god_mode', 'Engine Mode is God Mode Architect', buildResult.mode);
  assert(buildResult.heroEntity && /motorcycle/i.test(buildResult.heroEntity), 'Hero Entity is Motorcycle', buildResult.heroEntity);
  assert(buildResult.assetStrategy === 'PROCEDURAL_ASSEMBLY', 'Asset Strategy was Procedural Assembly', buildResult.assetStrategy);

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: Geometric Telemetry & Physical Outputs Verification
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 5: GEOMETRIC TELEMETRY & PHYSICAL OUTPUT VERIFICATION ---');
  assert(buildResult.telemetry && buildResult.telemetry.objectsCount >= 8, 'Scene contains multi-component objects', `Count: ${buildResult.telemetry?.objectsCount}`);
  assert(buildResult.telemetry && buildResult.telemetry.totalTriangles >= 1000, 'Scene has rich geometry mesh density', `Triangles: ${buildResult.telemetry?.totalTriangles}`);

  // Check physical render file on disk
  const renderPath = buildResult.renderPath;
  assert(fs.existsSync(renderPath), '1080p Render Image exists on disk', renderPath);
  if (fs.existsSync(renderPath)) {
    const stats = fs.statSync(renderPath);
    assert(stats.size > 50000, 'Render Image is non-empty rendered frame', `${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  }

  // Check master blend file on disk
  const blendPath = buildResult.blendPath;
  assert(fs.existsSync(blendPath), 'Master .blend project file exists on disk', blendPath);
  if (fs.existsSync(blendPath)) {
    const stats = fs.statSync(blendPath);
    assert(stats.size > 100000, 'Master .blend file is fully saved', `${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  }

  console.log('\n========================================================================');
  console.log(`  FINAL RESULT: ${passedTests}/${totalTests} TESTS PASSED (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  console.log('========================================================================');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('\n[FATAL TEST RUNNER ERROR]:', err);
  process.exit(1);
});
