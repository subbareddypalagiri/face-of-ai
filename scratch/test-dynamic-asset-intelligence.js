// scratch/test-dynamic-asset-intelligence.js — Phase 2 Dynamic Asset Intelligence Verification Suite
'use strict';

const fs = require('fs');
const path = require('path');
const {
  AssetResolver,
  AssetValidator,
  AssetCacheManager,
  AssetProviderRegistry,
  LocalAssetProvider,
  CachedAssetProvider,
  ProceduralAssetProvider,
  AI3DAssetProvider,
  RemoteAssetProvider,
  PROVIDER_STATUS,
  RESOLUTION_STRATEGY,
  QUALITY_TIER,
  Autonomous3DArchitect
} = require('../src/main/tools/astra/core');
const { BlenderAstraEngine } = require('../src/main/tools/blenderAstraEngine');

async function runPhase2TestSuite() {
  console.log('========================================================================');
  console.log('  UNIN PHASE 2: DYNAMIC ASSET INTELLIGENCE ENGINE TEST SUITE');
  console.log('========================================================================\n');

  let passedTests = 0;
  let totalTests = 0;
  const timings = {};

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
  // SUITE 1: Provider Architecture & Explicit States (No Faking)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 1: PROVIDER ARCHITECTURE & EXPLICIT STATES ---');
  const ai3dProvider = new AI3DAssetProvider();
  assert(ai3dProvider.getStatus() === PROVIDER_STATUS.NOT_CONFIGURED, 'AI3D Provider reports NOT_CONFIGURED when unconfigured', ai3dProvider.getStatus());

  const remoteProvider = new RemoteAssetProvider();
  assert(remoteProvider.getStatus() === PROVIDER_STATUS.NOT_CONFIGURED, 'Remote Provider reports NOT_CONFIGURED when unconfigured', remoteProvider.getStatus());

  const localProvider = new LocalAssetProvider();
  assert(localProvider.getStatus() === PROVIDER_STATUS.AVAILABLE, 'Local Provider reports AVAILABLE', localProvider.getStatus());

  const proceduralProvider = new ProceduralAssetProvider();
  assert(proceduralProvider.getStatus() === PROVIDER_STATUS.AVAILABLE, 'Procedural Provider reports AVAILABLE', proceduralProvider.getStatus());

  const registry = new AssetProviderRegistry();
  assert(registry.getProviders().length >= 5, 'Registry has at least 5 registered providers', `Count: ${registry.getProviders().length}`);

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 2: Deep Asset Validation & Security Pipeline
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 2: DEEP ASSET VALIDATION & SECURITY PIPELINE ---');
  const validator = new AssetValidator();

  // A. Valid local GLB
  const tValStart = Date.now();
  const ferrariPath = path.resolve(__dirname, '../ferrari.glb');
  const validReport = await validator.validate(ferrariPath);
  timings.validationMs = Date.now() - tValStart;
  assert(validReport.valid === true, 'Valid local GLB passes validation', `Triangles: ~${validReport.metrics.estimatedTriangles}`);
  assert(validReport.metrics.format === 'GLB', 'Format is GLB', validReport.metrics.format);
  assert(validReport.metrics.checksum !== null, 'Checksum computed', validReport.metrics.checksum?.substring(0, 16) + '...');

  // B. Missing file
  const missingReport = await validator.validate(path.resolve(__dirname, '../non_existent_model.glb'));
  assert(missingReport.valid === false, 'Missing file rejected', missingReport.errors[0]);

  // C. Path Traversal Attack Attempt
  const traversalReport = await validator.validate('c:/windows/system32/calc.exe');
  assert(traversalReport.valid === false && traversalReport.errors.some(e => e.includes('PATH_TRAVERSAL')), 'Path traversal attempt blocked', traversalReport.errors[0]);

  // D. Empty file
  const emptyTmpPath = path.resolve(__dirname, 'empty_tmp_test.glb');
  fs.writeFileSync(emptyTmpPath, '');
  const emptyReport = await validator.validate(emptyTmpPath);
  try { fs.unlinkSync(emptyTmpPath); } catch {}
  assert(emptyReport.valid === false && emptyReport.errors.some(e => e.includes('EMPTY_FILE')), '0-byte empty file rejected', emptyReport.errors[0]);

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 3: Deterministic Asset Caching & Metadata
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 3: DETERMINISTIC ASSET CACHE & METADATA ---');
  const cacheManager = new AssetCacheManager();
  const key1 = cacheManager.generateCacheKey('Cyberpunk Motorcycle', 'vehicle', QUALITY_TIER.HERO);
  const key2 = cacheManager.generateCacheKey('Cyberpunk Motorcycle', 'vehicle', QUALITY_TIER.HERO);
  assert(key1 === key2, 'Deterministic cache key generation', key1);

  // Cache put and get
  const cachedRes = await cacheManager.put('test_ferrari_cache_entry', ferrariPath, {
    query: 'Ferrari Supercar',
    triangles: validReport.metrics.estimatedTriangles,
    quality: QUALITY_TIER.HERO
  });
  assert(fs.existsSync(cachedRes.assetPath), 'Model cached in assets/cache/models', cachedRes.assetPath);
  assert(fs.existsSync(cachedRes.metadataPath), 'Metadata cached in assets/cache/metadata', cachedRes.metadataPath);

  const tCacheStart = Date.now();
  const cacheGet = await cacheManager.get('test_ferrari_cache_entry', 'vehicle');
  timings.cacheLookupMs = Date.now() - tCacheStart;
  assert(cacheGet.found === true, 'Cache lookup returns cached entry', `Found in ${timings.cacheLookupMs}ms`);

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 4: Multi-Tiered Semantic Asset Resolution
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 4: MULTI-TIERED SEMANTIC ASSET RESOLUTION ---');
  const resolver = new AssetResolver();

  // A. Local Asset: Ferrari
  const tResStart = Date.now();
  const resFerrari = await resolver.resolveEntity({ name: 'Ferrari SF90 Supercar', category: 'vehicle' });
  timings.resolutionMs = Date.now() - tResStart;
  assert(resFerrari.strategy === RESOLUTION_STRATEGY.LOCAL_CATALOG, 'Ferrari resolves to Local Catalog', resFerrari.provider);
  assert(resFerrari.path.includes('ferrari.glb'), 'Ferrari path points to ferrari.glb', resFerrari.path);

  // B. Local Asset: Forest Tree
  const resTree = await resolver.resolveEntity({ name: 'Canopy Oak Tree', category: 'vegetation' });
  assert(resTree.strategy === RESOLUTION_STRATEGY.LOCAL_CATALOG, 'Tree resolves to Local Catalog', resTree.path);

  // C. Procedural: Harley Davidson Motorcycle (Never car or tree!)
  const resMC = await resolver.resolveEntity({ name: 'Harley Davidson Motorcycle on street', category: 'vehicle' });
  assert(resMC.strategy === RESOLUTION_STRATEGY.PROCEDURAL_ASSEMBLY, 'Motorcycle resolves to Procedural Assembly', resMC.assemblyType);
  assert(resMC.assemblyType === 'HERO_MOTORCYCLE_ASSEMBLY', 'Assembly is HERO_MOTORCYCLE_ASSEMBLY');

  // D. Procedural: Indian Temple
  const resTemple = await resolver.resolveEntity({ name: 'Ancient Stone Temple', category: 'architecture' });
  assert(resTemple.strategy === RESOLUTION_STRATEGY.PROCEDURAL_ASSEMBLY, 'Temple resolves to Procedural Architecture', resTemple.assemblyType);

  // E. Procedural: Spaceship
  const resShip = await resolver.resolveEntity({ name: 'Interceptor Spaceship', category: 'vehicle' });
  assert(resShip.strategy === RESOLUTION_STRATEGY.PROCEDURAL_ASSEMBLY, 'Spaceship resolves to Procedural Spaceship', resShip.assemblyType);

  // F. Unknown Complex Creature: Mythical Dragon
  const resDragon = await resolver.resolveEntity({ name: 'Mythical Dragon', category: 'creature' });
  assert(resDragon.strategy === RESOLUTION_STRATEGY.PROCEDURAL_ASSEMBLY, 'Dragon resolves to Procedural Biomorphic Assembly', resDragon.assemblyType);
  assert(resDragon.assemblyType === 'HERO_DRAGON_CREATURE_ASSEMBLY', 'Assembly is HERO_DRAGON_CREATURE_ASSEMBLY');

  // Verify Audit Attempts for Dragon show AI3D NOT_CONFIGURED without faking
  const aiAttempt = resDragon.attempts.find(a => a.provider === 'AI3DAssetProvider');
  assert(aiAttempt && aiAttempt.status === PROVIDER_STATUS.NOT_CONFIGURED, 'Audit trail records AI3DProvider as NOT_CONFIGURED without faking', aiAttempt?.reason?.slice(0, 60) + '...');

  // G. Unknown Complex Vehicle: Boeing Commercial Airplane (Never primitive cube or building!)
  const resPlane = await resolver.resolveEntity({ name: 'Boeing-style Commercial Airplane', category: 'vehicle' });
  assert(resPlane.strategy === RESOLUTION_STRATEGY.PROCEDURAL_ASSEMBLY, 'Airplane resolves to Procedural Airliner Assembly', resPlane.assemblyType);
  assert(resPlane.assemblyType === 'HERO_AIRPLANE_ASSEMBLY', 'Assembly is HERO_AIRPLANE_ASSEMBLY');

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 5: Live Blender 5.1 End-to-End Build: Realistic Dragon on Mountain
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 5: LIVE BLENDER 5.1 END-TO-END BUILD (DRAGON ON MOUNTAIN) ---');
  const engine = new BlenderAstraEngine();

  const dragonMission = 'Create a realistic dragon standing on a rocky mountain at sunset';
  console.log(`  Executing: "${dragonMission}"...`);

  const tBuildStart = Date.now();
  const buildResult = await engine.executeAstraIntent(dragonMission, {
    isNewScene: true,
    onProgress: (p) => {
      console.log(`    [Progress ${p.step}/${p.totalSteps}] ${p.title}: ${p.description}`);
    }
  });
  timings.liveBuildMs = Date.now() - tBuildStart;

  assert(buildResult.success === true, 'Closed-Loop Dragon Build Succeeded', `${(timings.liveBuildMs / 1000).toFixed(1)}s`);
  assert(buildResult.mode === 'autonomous_3d_architect_god_mode', 'Engine Mode is God Mode Architect', buildResult.mode);
  assert(/dragon/i.test(buildResult.heroEntity), 'Hero Entity is Dragon', buildResult.heroEntity);
  assert(buildResult.assetStrategy === RESOLUTION_STRATEGY.PROCEDURAL_ASSEMBLY, 'Asset Strategy is Procedural Assembly', buildResult.assetStrategy);

  // Physical Output Verification
  assert(fs.existsSync(buildResult.renderPath), '1080p Render Image exists on disk', buildResult.renderPath);
  if (fs.existsSync(buildResult.renderPath)) {
    const rStat = fs.statSync(buildResult.renderPath);
    assert(rStat.size > 50000, 'Render Image is non-empty frame', `${(rStat.size / 1024 / 1024).toFixed(2)} MB`);
  }

  assert(fs.existsSync(buildResult.blendPath), 'Master .blend project exists on disk', buildResult.blendPath);
  if (fs.existsSync(buildResult.blendPath)) {
    const bStat = fs.statSync(buildResult.blendPath);
    assert(bStat.size > 100000, 'Master .blend file is fully saved', `${(bStat.size / 1024 / 1024).toFixed(2)} MB`);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PERFORMANCE & TELEMETRY REPORT
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n========================================================================');
  console.log('  PERFORMANCE TIMINGS & TELEMETRY SUMMARY:');
  console.log(`  - Validation Time:    ${timings.validationMs} ms`);
  console.log(`  - Cache Lookup Time:  ${timings.cacheLookupMs} ms`);
  console.log(`  - Asset Resolution:   ${timings.resolutionMs} ms`);
  console.log(`  - Full 3D World Build: ${(timings.liveBuildMs / 1000).toFixed(2)} s`);
  console.log(`  FINAL RESULT: ${passedTests}/${totalTests} TESTS PASSED (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  console.log('========================================================================');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPhase2TestSuite().catch(err => {
  console.error('\n[FATAL TEST RUNNER ERROR]:', err);
  process.exit(1);
});
