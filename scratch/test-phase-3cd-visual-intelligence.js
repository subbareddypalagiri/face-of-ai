// scratch/test-phase-3cd-visual-intelligence.js — Verification Suite for Phase 3C (Visual Director) + 3D (Vision Evaluator)
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const {
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
  PersistentWorldState,
  Autonomous3DArchitect,
  SceneGraph,
  WorldDeltaMutator,
  DELTA_ACTION
} = require('../src/main/tools/astra/core');
const { BlenderAstraEngine } = require('../src/main/tools/blenderAstraEngine');

let passedTests = 0;
let totalTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] Test ${totalTests}: ${desc}`);
  } catch (err) {
    console.error(`  [FAIL] Test ${totalTests}: ${desc}`);
    console.error(`         ${err.message}`);
  }
}

async function itAsync(desc, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  [PASS] Test ${totalTests}: ${desc}`);
  } catch (err) {
    console.error(`  [FAIL] Test ${totalTests}: ${desc}`);
    console.error(`         ${err.message}`);
  }
}

async function runVisualIntelligenceSuite() {
  console.log('========================================================================');
  console.log('  UNIN PHASE 3C + 3D: VISUAL DIRECTOR & MULTIMODAL VISION QUALITY SUITE');
  console.log('========================================================================\n');

  const mockRpc = async (method, params) => {
    if (method === 'get_scene_state') {
      return {
        success: true,
        data: {
          objectsCount: 12,
          totalTriangles: 14500,
          totalVertices: 8200,
          lights: ['unin.lighting.key', 'unin.lighting.fill', 'unin.lighting.rim'],
          cameras: ['unin.camera.primary'],
          activeCamera: {
            name: 'unin.camera.primary',
            location: [-2.2, -3.8, 1.1],
            focalLength: 50.0,
            sensorWidth: 36.0,
            dofEnabled: true,
            fStop: 2.8,
            focusDistance: 4.2
          },
          objects: [
            { name: 'unin.entity.vehicle.ferrari', location: [0, 0, 0], dimensions: [4.2, 1.9, 1.2], bound_box: [[0,0,0]] }
          ]
        }
      };
    }
    if (method === 'execute_bpy') {
      return { success: true };
    }
    if (method === 'capture_snapshot') {
      return { success: true, data: { filePath: 'test_snapshot.png' } };
    }
    return { success: true };
  };

  const director = new VisualDirector(mockRpc);
  const evaluator = new VisionEvaluator(mockRpc);

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 1: VISUAL DIRECTOR — STYLE & GENRE TRANSLATION
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- SUITE 1: VISUAL DIRECTOR — STYLE & GENRE TRANSLATION ---');

  const nightStreetPlan = await director.planVisualProduction(
    'Create a photorealistic motorcycle on a wet Indian street at night with rain and fog',
    null
  );

  it('Night street maps to motivated practical or dramatic lighting', () => {
    assert.ok(nightStreetPlan.lighting.strategy === LIGHTING_STRATEGY.MOTIVATED_PRACTICAL ||
              nightStreetPlan.lighting.strategy === LIGHTING_STRATEGY.THREE_POINT_CINEMATIC);
  });

  it('Night street detects timeOfDay as night', () => {
    assert.strictEqual(nightStreetPlan.visualIntent.timeOfDay, 'night');
  });

  it('Night street detects rain and fog environment', () => {
    assert.strictEqual(nightStreetPlan.environment.fog.enabled, true);
    assert.strictEqual(nightStreetPlan.environment.rain.active, true);
    assert.ok(nightStreetPlan.environment.surfaceWetness > 0.7);
  });

  const carAdPlan = await director.planVisualProduction(
    'Luxury car advertisement commercial in studio showroom with clean reflections',
    null
  );

  it('Luxury car commercial maps to STUDIO_COMMERCIAL lighting', () => {
    assert.strictEqual(carAdPlan.lighting.strategy, LIGHTING_STRATEGY.STUDIO_COMMERCIAL);
  });

  it('Luxury car commercial uses long-lens compression (>= 50mm)', () => {
    assert.ok(carAdPlan.camera.focalLength >= 50.0);
  });

  it('Luxury car commercial uses hero composition (CENTER_HERO or RULE_OF_THIRDS)', () => {
    assert.ok(
      carAdPlan.camera.composition === COMPOSITION_RULE.CENTER_HERO || carAdPlan.camera.composition === COMPOSITION_RULE.RULE_OF_THIRDS,
      `Expected CENTER_HERO or RULE_OF_THIRDS, got ${carAdPlan.camera.composition}`
    );
  });

  const thrillerPlan = await director.planVisualProduction(
    'Dark psychological thriller in misty alley with dramatic negative fill',
    null
  );

  it('Thriller maps to DARK_NOIR_THRILLER lighting strategy', () => {
    assert.strictEqual(thrillerPlan.lighting.strategy, LIGHTING_STRATEGY.DARK_NOIR_THRILLER);
  });

  it('Thriller uses NEGATIVE_SPACE composition', () => {
    assert.strictEqual(thrillerPlan.camera.composition, COMPOSITION_RULE.NEGATIVE_SPACE);
  });

  const sunsetPlan = await director.planVisualProduction(
    'Realistic dragon standing on a rocky mountain at sunset',
    null
  );

  it('Sunset mountain maps to NATURAL_GOLDEN_HOUR lighting', () => {
    assert.strictEqual(sunsetPlan.lighting.strategy, LIGHTING_STRATEGY.NATURAL_GOLDEN_HOUR);
  });

  it('Sunset mountain uses wide shot type', () => {
    assert.ok(
      sunsetPlan.camera.shotType === SHOT_TYPE.WIDE || sunsetPlan.camera.shotType === SHOT_TYPE.MEDIUM_WIDE,
      `Expected WIDE or MEDIUM_WIDE, got ${sunsetPlan.camera.shotType}`
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 2: CINEMATOGRAPHY & CAMERA PHYSICALITY
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 2: CINEMATOGRAPHY & CAMERA PHYSICALITY ---');

  it('Camera focal length is physically valid (18mm - 200mm)', () => {
    assert.ok(nightStreetPlan.camera.focalLength >= 18.0 && nightStreetPlan.camera.focalLength <= 200.0);
    assert.ok(carAdPlan.camera.focalLength >= 18.0 && carAdPlan.camera.focalLength <= 200.0);
  });

  it('Camera aperture is physically valid (f/1.2 - f/16)', () => {
    assert.ok(nightStreetPlan.camera.aperture >= 1.2 && nightStreetPlan.camera.aperture <= 16.0);
  });

  it('Camera sensor width is standard full-frame 36mm', () => {
    assert.strictEqual(nightStreetPlan.camera.sensorWidth, 36.0);
  });

  it('Depth of Field is enabled with realistic distance', () => {
    assert.strictEqual(nightStreetPlan.camera.dofEnabled, true);
    assert.ok(nightStreetPlan.camera.cameraDistance > 0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 3: MOTIVATED LIGHTING & PHYSICALITY
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 3: MOTIVATED LIGHTING & PHYSICALITY ---');

  it('kelvinToRgb converts 3200K tungsten to warm golden RGB', () => {
    const rgb = kelvinToRgb(3200);
    assert.ok(Array.isArray(rgb) && rgb.length === 3);
    assert.ok(rgb[0] > rgb[2], 'Red component exceeds blue in 3200K');
    assert.ok(rgb[0] >= 0 && rgb[0] <= 1.0);
  });

  it('kelvinToRgb converts 7800K moonlight to cool blue RGB', () => {
    const rgb = kelvinToRgb(7800);
    assert.ok(rgb[2] > rgb[1], 'Blue component exceeds green in 7800K');
  });

  it('Sodium vapor street preset is defined', () => {
    assert.ok(COLOR_TEMPERATURE_PRESETS.SODIUM_VAPOR_STREET);
    assert.ok(COLOR_TEMPERATURE_PRESETS.SODIUM_VAPOR_STREET[0] > 0.9);
  });

  it('Key light energy is significantly greater than fill light energy', () => {
    assert.ok(nightStreetPlan.lighting.key.energy > nightStreetPlan.lighting.fill.energy);
  });

  it('Fill light size is broad and diffuse (size >= 2.5m)', () => {
    assert.ok(nightStreetPlan.lighting.fill.size >= 2.5);
  });

  it('Rim light exists to provide silhouette accent', () => {
    assert.ok(nightStreetPlan.lighting.rim);
    assert.ok(nightStreetPlan.lighting.rim.energy > 0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 4: LOOKDEV & MATERIAL PRESETS
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 4: LOOKDEV & MATERIAL PRESETS ---');

  it('Automotive clearcoat preset has high metallic and clearcoat', () => {
    const p = LOOKDEV_PRESETS.automotive_clearcoat;
    assert.ok(p.metallic >= 0.9);
    assert.ok(p.clearcoat >= 0.85);
  });

  it('Wet asphalt rain preset has low roughness and high specular', () => {
    const p = LOOKDEV_PRESETS.wet_asphalt_rain;
    assert.ok(p.roughness <= 0.2);
    assert.ok(p.specular >= 0.8);
  });

  it('Brushed metal preset specifies anisotropic response', () => {
    const p = LOOKDEV_PRESETS.brushed_metal;
    assert.ok(p.anisotropic > 0.5);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 5: ENVIRONMENT & VOLUMETRIC BOUNDS
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 5: ENVIRONMENT & VOLUMETRIC BOUNDS ---');

  it('Fog density is bounded safely (0.0002 to 0.003) to prevent photon extinction', () => {
    assert.ok(nightStreetPlan.environment.fog.density >= 0.0002);
    assert.ok(nightStreetPlan.environment.fog.density <= 0.003);
  });

  it('Surface wetness reflects rain condition', () => {
    assert.ok(nightStreetPlan.environment.surfaceWetness >= 0.8);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 6: COLOR MANAGEMENT & VIEW TRANSFORMS
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 6: COLOR MANAGEMENT & VIEW TRANSFORMS ---');

  it('LookDev specifies AgX view transform', () => {
    assert.strictEqual(nightStreetPlan.lookDev.viewTransform, 'AgX');
  });

  it('LookDev specifies high or medium contrast', () => {
    assert.ok(nightStreetPlan.lookDev.contrast.includes('Contrast'));
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 7: VISUAL PRODUCTION PLAN SCHEMA VALIDATION
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 7: VISUAL PRODUCTION PLAN SCHEMA VALIDATION ---');

  it('Valid plan passes validatePlan', () => {
    const res = director.validatePlan(nightStreetPlan);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.errors.length, 0);
  });

  it('Missing visualIntent is rejected by validatePlan', () => {
    const invalid = { ...nightStreetPlan, visualIntent: null };
    const res = director.validatePlan(invalid);
    assert.strictEqual(res.valid, false);
  });

  it('Focal length out of bounds (<10mm) is rejected', () => {
    const invalid = JSON.parse(JSON.stringify(nightStreetPlan));
    invalid.camera.focalLength = 4.0;
    const res = director.validatePlan(invalid);
    assert.strictEqual(res.valid, false);
  });

  it('Excessive fog density (>0.05) is rejected for photon safety', () => {
    const invalid = JSON.parse(JSON.stringify(nightStreetPlan));
    invalid.environment.fog.density = 0.15;
    const res = director.validatePlan(invalid);
    assert.strictEqual(res.valid, false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 8: BPY SCRIPT GENERATION & CANONICAL TAGGING
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 8: BPY SCRIPT GENERATION & CANONICAL TAGGING ---');

  const bpyScript = director.generateVisualBpy(nightStreetPlan, 'unin_world_test_vid');

  it('Generated BPY configures AgX color management', () => {
    assert.ok(bpyScript.includes('view_transform = "AgX"'));
  });

  it('Generated BPY tags camera with unin_id', () => {
    assert.ok(bpyScript.includes('cam_obj["unin_id"] = "unin.camera.primary"'));
    assert.ok(bpyScript.includes('cam_obj["unin_world_id"] = "unin_world_test_vid"'));
  });

  it('Generated BPY tags look target with unin_id', () => {
    assert.ok(bpyScript.includes('look_target["unin_id"] = "unin.camera.look_target"'));
  });

  it('Generated BPY tags lighting objects', () => {
    assert.ok(bpyScript.includes('k_obj["unin_id"] = "unin.lighting.key"'));
    assert.ok(bpyScript.includes('f_obj["unin_id"] = "unin.lighting.fill"'));
    assert.ok(bpyScript.includes('r_obj["unin_id"] = "unin.lighting.rim"'));
  });

  it('Generated BPY sets volumetric principled fog', () => {
    assert.ok(bpyScript.includes('Principled Volume'));
    assert.ok(bpyScript.includes('ShaderNodeVolumePrincipled'));
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 9: VISION EVALUATOR — 11 DEFECT DIMENSIONS & SEVERITY
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 9: VISION EVALUATOR — 11 DEFECT DIMENSIONS & SEVERITY ---');

  it('All 11 defect dimensions are defined', () => {
    assert.strictEqual(DEFECT_DIMENSION.SEMANTIC, 'SEMANTIC');
    assert.strictEqual(DEFECT_DIMENSION.SILHOUETTE, 'SILHOUETTE');
    assert.strictEqual(DEFECT_DIMENSION.COMPOSITION, 'COMPOSITION');
    assert.strictEqual(DEFECT_DIMENSION.SCALE, 'SCALE');
    assert.strictEqual(DEFECT_DIMENSION.SPATIAL, 'SPATIAL');
    assert.strictEqual(DEFECT_DIMENSION.MATERIAL, 'MATERIAL');
    assert.strictEqual(DEFECT_DIMENSION.LIGHTING, 'LIGHTING');
    assert.strictEqual(DEFECT_DIMENSION.ATMOSPHERE, 'ATMOSPHERE');
    assert.strictEqual(DEFECT_DIMENSION.CAMERA, 'CAMERA');
    assert.strictEqual(DEFECT_DIMENSION.COMPLETENESS, 'COMPLETENESS');
    assert.strictEqual(DEFECT_DIMENSION.VISUAL_HIERARCHY, 'VISUAL_HIERARCHY');
  });

  it('Defect severities encompass CRITICAL, HIGH, MEDIUM, LOW', () => {
    assert.strictEqual(DEFECT_SEVERITY.CRITICAL, 'CRITICAL');
    assert.strictEqual(DEFECT_SEVERITY.HIGH, 'HIGH');
    assert.strictEqual(DEFECT_SEVERITY.MEDIUM, 'MEDIUM');
    assert.strictEqual(DEFECT_SEVERITY.LOW, 'LOW');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 10: TELEMETRY + VISION FUSION & CONSISTENCY CHECK
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 10: TELEMETRY + VISION FUSION & CONSISTENCY CHECK ---');

  const perfectTelemetry = {
    objects: [{ name: 'unin.entity.vehicle.ferrari', location: [0, 0, 0], dimensions: [4.0, 1.8, 1.2] }],
    lights: ['unin.lighting.key', 'unin.lighting.fill'],
    activeCamera: { name: 'unin.camera.primary' }
  };

  const perfectReport = evaluator._fuseVisionAndTelemetry(
    { qualityScore: 9.2, confidence: 0.95, defects: [] },
    perfectTelemetry,
    null,
    'Create a red Ferrari',
    nightStreetPlan,
    'CINEMATIC'
  );

  it('Perfect scene passes quality gate (status PASS)', () => {
    assert.strictEqual(perfectReport.overallStatus, EVALUATION_STATUS.PASS);
    assert.ok(perfectReport.qualityScore >= 8.8);
    assert.strictEqual(perfectReport.criticalCount, 0);
  });

  const floatingTelemetry = {
    objects: [{ name: 'unin.entity.vehicle.ferrari', location: [0, 0, 0.85], dimensions: [4.0, 1.8, 1.2] }],
    lights: ['unin.lighting.key'],
    activeCamera: { name: 'unin.camera.primary' }
  };

  const floatingReport = evaluator._fuseVisionAndTelemetry(
    { qualityScore: 7.0, defects: [{ dimension: DEFECT_DIMENSION.SPATIAL, description: 'Car looks floating' }] },
    floatingTelemetry,
    null,
    'Create a red Ferrari',
    nightStreetPlan,
    'CINEMATIC'
  );

  it('Floating telemetry cross-check escalates to CRITICAL spatial defect', () => {
    assert.ok(floatingReport.criticalCount > 0);
    assert.strictEqual(floatingReport.overallStatus, EVALUATION_STATUS.FAIL);
    const spatial = floatingReport.defects.find(d => d.dimension === DEFECT_DIMENSION.SPATIAL);
    assert.ok(spatial);
    assert.strictEqual(spatial.severity, DEFECT_SEVERITY.CRITICAL);
    assert.ok(spatial.confidence >= 0.95);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 11: ARTISTIC INTENT DISCRIMINATION (NO FAKE FAILURES)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 11: ARTISTIC INTENT DISCRIMINATION (NO FAKE FAILURES) ---');

  const darkSceneCritique = {
    qualityScore: 8.8,
    defects: [
      { dimension: DEFECT_DIMENSION.LIGHTING, description: 'Scene has very dark background lighting' }
    ]
  };

  const darkIntentReport = evaluator._fuseVisionAndTelemetry(
    darkSceneCritique,
    perfectTelemetry,
    null,
    'Create a dark moody thriller scene at night',
    nightStreetPlan,
    'CINEMATIC'
  );

  it('User-requested dark mood ignores lighting darkness critique as artistic choice', () => {
    const hasLightingDefect = darkIntentReport.defects.some(d => d.dimension === DEFECT_DIMENSION.LIGHTING);
    assert.strictEqual(hasLightingDefect, false, 'Should filter out dark lighting defect when dark requested');
  });

  const wideSceneCritique = {
    qualityScore: 8.5,
    defects: [
      { dimension: DEFECT_DIMENSION.CAMERA, description: 'Subject is small in the distance' }
    ]
  };

  const wideIntentReport = evaluator._fuseVisionAndTelemetry(
    wideSceneCritique,
    perfectTelemetry,
    null,
    'Panoramic wide establishing shot of castle',
    nightStreetPlan,
    'CINEMATIC'
  );

  it('User-requested wide shot ignores subject distance critique as artistic choice', () => {
    const hasCameraDefect = wideIntentReport.defects.some(d => d.dimension === DEFECT_DIMENSION.CAMERA);
    assert.strictEqual(hasCameraDefect, false, 'Should filter out small subject critique when wide requested');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 12: REAL VISUAL DEFECT INJECTION TESTS & CORRECTION MAPPING
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 12: REAL VISUAL DEFECT INJECTION TESTS & CORRECTION MAPPING ---');

  // Defect A: Floating Object
  const floatingDefect = {
    id: 'def_float_1',
    dimension: DEFECT_DIMENSION.SPATIAL,
    severity: DEFECT_SEVERITY.CRITICAL,
    confidence: 0.92,
    target: 'Ferrari_Car',
    recommendedAction: 'GROUND_OBJECT',
    actionParams: { currentZ: 0.85 }
  };
  const fixA = evaluator.planSurgicalCorrection(floatingDefect);

  it('Floating defect maps to surgical MOVE with negative z-offset', () => {
    assert.strictEqual(fixA.action, DELTA_ACTION.MOVE);
    assert.strictEqual(fixA.targets[0].entityId, 'Ferrari_Car');
    assert.ok(fixA.parameters.offset[2] < -0.5);
  });

  // Defect B: Hero too small
  const scaleDefect = {
    id: 'def_scale_1',
    dimension: DEFECT_DIMENSION.SCALE,
    severity: DEFECT_SEVERITY.HIGH,
    confidence: 0.88,
    target: 'Ferrari_Car',
    recommendedAction: 'RESCALE_HERO'
  };
  const fixB = evaluator.planSurgicalCorrection(scaleDefect);

  it('Hero too small defect maps to surgical SCALE with >1.0 multiplier', () => {
    assert.strictEqual(fixB.action, DELTA_ACTION.SCALE);
    assert.ok(fixB.parameters.scaleMultiplier > 1.0);
  });

  // Defect C: Excessive Fog
  const fogDefect = {
    id: 'def_fog_1',
    dimension: DEFECT_DIMENSION.ATMOSPHERE,
    severity: DEFECT_SEVERITY.MEDIUM,
    confidence: 0.85,
    target: 'environment',
    recommendedAction: 'LOWER_FOG'
  };
  const fixC = evaluator.planSurgicalCorrection(fogDefect);

  it('Excessive fog defect maps to surgical ENVIRONMENT_CHANGE', () => {
    assert.strictEqual(fixC.action, DELTA_ACTION.ENVIRONMENT_CHANGE);
    assert.ok(fixC.parameters.fogDensity < 0.001);
  });

  // Defect D: Under-exposed dark lighting
  const darkDefect = {
    id: 'def_dark_1',
    dimension: DEFECT_DIMENSION.LIGHTING,
    severity: DEFECT_SEVERITY.HIGH,
    confidence: 0.89,
    target: 'lighting',
    recommendedAction: 'INCREASE_EXPOSURE'
  };
  const fixD = evaluator.planSurgicalCorrection(darkDefect);

  it('Under-exposure defect maps to LIGHTING_CHANGE with boost multiplier', () => {
    assert.strictEqual(fixD.action, DELTA_ACTION.LIGHTING_CHANGE);
    assert.ok(fixD.parameters.energyMultiplier > 1.0);
  });

  // Defect E: Low-confidence defect skipped
  const lowConfDefect = {
    id: 'def_low_1',
    dimension: DEFECT_DIMENSION.MATERIAL,
    confidence: 0.45,
    recommendedAction: 'RECOLOR_MATERIAL'
  };
  const fixE = evaluator.planSurgicalCorrection(lowConfDefect);

  it('Low confidence defect (< 0.70) is skipped to avoid destructive edits', () => {
    assert.strictEqual(fixE, null);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 13: CLOSED-LOOP VISUAL CORRECTION LOOP & BUDGET
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 13: CLOSED-LOOP VISUAL CORRECTION LOOP & BUDGET ---');

  const testWorldDir = path.join(__dirname, 'worlds_test_3cd');
  if (!fs.existsSync(testWorldDir)) fs.mkdirSync(testWorldDir, { recursive: true });
  const testWorld = PersistentWorldState.createNew({ storageDir: testWorldDir });
  testWorld.registerEntity({ uninId: 'unin.entity.vehicle.ferrari', blenderName: 'Ferrari_Car', category: 'vehicle', role: 'hero' });

  const mockDeltaMutator = {
    executeMutationTransaction: async (plan, ws) => {
      ws.recordMutation(plan.action, plan.parameters);
      return { success: true };
    }
  };

  // Mock evaluator that passes on iteration 2
  let loopCallCount = 0;
  evaluator.captureEvaluationFrame = async () => 'test_frame.png';
  evaluator.evaluateVisualQuality = async () => {
    loopCallCount++;
    if (loopCallCount === 1) {
      return {
        overallStatus: EVALUATION_STATUS.NEEDS_CORRECTION,
        qualityScore: 7.2,
        defects: [
          {
            dimension: DEFECT_DIMENSION.SPATIAL,
            severity: DEFECT_SEVERITY.HIGH,
            confidence: 0.90,
            target: 'unin.entity.vehicle.ferrari',
            recommendedAction: 'GROUND_OBJECT',
            actionParams: { currentZ: 0.5 }
          }
        ]
      };
    }
    return {
      overallStatus: EVALUATION_STATUS.PASS,
      qualityScore: 9.1,
      defects: []
    };
  };

  const loopResult = await evaluator.runVisualCorrectionLoop({
    userPrompt: 'Create red Ferrari',
    sceneGraph: null,
    worldState: testWorld,
    deltaMutator: mockDeltaMutator,
    profile: 'HIGH'
  });

  it('Visual correction loop converges and passes on iteration 2', () => {
    assert.strictEqual(loopResult.success, true);
    assert.strictEqual(loopResult.status, EVALUATION_STATUS.PASS);
    assert.strictEqual(loopResult.iterations, 2);
    assert.ok(loopResult.finalScore >= 8.0);
  });

  // Test budget exhaustion without faking pass
  let exhaustingCallCount = 0;
  evaluator.evaluateVisualQuality = async () => {
    exhaustingCallCount++;
    return {
      overallStatus: EVALUATION_STATUS.FAIL,
      qualityScore: 5.5,
      defects: [
        {
          dimension: DEFECT_DIMENSION.SEMANTIC,
          severity: DEFECT_SEVERITY.CRITICAL,
          confidence: 0.95,
          target: 'unin.entity.vehicle.ferrari',
          recommendedAction: 'RESCALE_HERO'
        }
      ]
    };
  };

  const exhaustResult = await evaluator.runVisualCorrectionLoop({
    userPrompt: 'Create impossible subject',
    sceneGraph: null,
    worldState: testWorld,
    deltaMutator: mockDeltaMutator,
    profile: 'DRAFT' // max 1 iteration
  });

  it('Budget exhaustion terminates with QUALITY_NOT_REACHED without faking pass', () => {
    assert.strictEqual(exhaustResult.success, false);
    assert.strictEqual(exhaustResult.status, EVALUATION_STATUS.QUALITY_NOT_REACHED);
    assert.strictEqual(exhaustResult.iterations, 1);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 14: WORLD STATE & ENGINE INTEGRATION
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 14: WORLD STATE & ENGINE INTEGRATION ---');

  testWorld.visualPlan = nightStreetPlan;
  await testWorld.save();
  const rehydratedWorld = PersistentWorldState.load(testWorld.worldId, testWorldDir);

  it('PersistentWorldState preserves visualPlan through disk serialization', () => {
    assert.ok(rehydratedWorld.visualPlan);
    assert.strictEqual(rehydratedWorld.visualPlan.visualIntent.style, nightStreetPlan.visualIntent.style);
    assert.strictEqual(rehydratedWorld.visualPlan.camera.focalLength, nightStreetPlan.camera.focalLength);
  });

  it('PersistentWorldState toJSON includes visualPlan', () => {
    const json = testWorld.toJSON();
    assert.ok(json.visualPlan);
    assert.strictEqual(json.visualPlan.lighting.strategy, nightStreetPlan.lighting.strategy);
  });

  const architect = new Autonomous3DArchitect(mockRpc, { worldsDir: testWorldDir });

  it('Autonomous3DArchitect has directSceneVisuals method', () => {
    assert.strictEqual(typeof architect.directSceneVisuals, 'function');
  });

  it('Autonomous3DArchitect has evaluateSceneVisually method', () => {
    assert.strictEqual(typeof architect.evaluateSceneVisually, 'function');
  });

  it('Autonomous3DArchitect has runVisualCorrectionLoop method', () => {
    assert.strictEqual(typeof architect.runVisualCorrectionLoop, 'function');
  });

  const engine = new BlenderAstraEngine();

  it('BlenderAstraEngine has directActiveWorld method', () => {
    assert.strictEqual(typeof engine.directActiveWorld, 'function');
  });

  it('BlenderAstraEngine has evaluateVisualQuality method', () => {
    assert.strictEqual(typeof engine.evaluateVisualQuality, 'function');
  });

  it('BlenderAstraEngine has runVisualCorrectionLoop method', () => {
    assert.strictEqual(typeof engine.runVisualCorrectionLoop, 'function');
  });

  console.log('\n========================================================================');
  console.log(`  PHASE 3C + 3D VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  console.log('========================================================================\n');

  try {
    fs.rmSync(testWorldDir, { recursive: true, force: true });
  } catch (e) {}

  process.exit(passedTests === totalTests ? 0 : 1);
}

runVisualIntelligenceSuite().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
