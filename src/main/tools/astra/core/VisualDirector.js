// src/main/tools/astra/core/VisualDirector.js — FAANG-Tier Autonomous Visual Director for 3D Scenes
'use strict';

const logger = require('../../../../shared/Logger');
const { UnifiedAILayer } = require('./UnifiedAILayer');

// ──────────────────────────────────────────────────────────────────────────────
// ENUMS & CONSTANTS
// ──────────────────────────────────────────────────────────────────────────────

const SHOT_TYPE = Object.freeze({
  EXTREME_WIDE: 'EXTREME_WIDE',
  WIDE: 'WIDE',
  MEDIUM_WIDE: 'MEDIUM_WIDE',
  HERO_MEDIUM: 'HERO_MEDIUM',
  MEDIUM_CLOSE_UP: 'MEDIUM_CLOSE_UP',
  CLOSE_UP: 'CLOSE_UP',
  MACRO: 'MACRO'
});

const COMPOSITION_RULE = Object.freeze({
  RULE_OF_THIRDS: 'RULE_OF_THIRDS',
  CENTER_HERO: 'CENTER_HERO',
  GOLDEN_RATIO: 'GOLDEN_RATIO',
  NEGATIVE_SPACE: 'NEGATIVE_SPACE',
  DUTCH_ANGLE: 'DUTCH_ANGLE'
});

const CAMERA_ANGLE = Object.freeze({
  EYE_LEVEL: 'EYE_LEVEL',
  LOW_ANGLE_HERO: 'LOW_ANGLE_HERO',
  HIGH_ANGLE: 'HIGH_ANGLE',
  WORM_EYE: 'WORM_EYE',
  DUTCH_TILT: 'DUTCH_TILT'
});

const LIGHTING_STRATEGY = Object.freeze({
  MOTIVATED_PRACTICAL: 'MOTIVATED_PRACTICAL',
  THREE_POINT_CINEMATIC: 'THREE_POINT_CINEMATIC',
  STUDIO_COMMERCIAL: 'STUDIO_COMMERCIAL',
  NATURAL_GOLDEN_HOUR: 'NATURAL_GOLDEN_HOUR',
  MOONLIT_ATMOSPHERIC: 'MOONLIT_ATMOSPHERIC',
  DARK_NOIR_THRILLER: 'DARK_NOIR_THRILLER',
  CYBERPUNK_NEON: 'CYBERPUNK_NEON'
});

const QUALITY_PROFILE = Object.freeze({
  DRAFT: 'DRAFT',
  STANDARD: 'STANDARD',
  HIGH: 'HIGH',
  HERO: 'HERO',
  CINEMATIC: 'CINEMATIC'
});

/**
 * Color temperature (Kelvin) to calibrated linear sRGB/Rec709 conversion
 */
function kelvinToRgb(kelvin) {
  const k = Math.min(Math.max(kelvin, 1500), 15000) / 100.0;
  let r, g, b;

  if (k <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(k) - 161.1195681661;
    b = k <= 19 ? 0 : 138.5177312231 * Math.log(k - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(k - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(k - 60, -0.0755148492);
    b = 255;
  }

  return [
    Math.min(Math.max(r / 255.0, 0.0), 1.0),
    Math.min(Math.max(g / 255.0, 0.0), 1.0),
    Math.min(Math.max(b / 255.0, 0.0), 1.0)
  ];
}

const COLOR_TEMPERATURE_PRESETS = Object.freeze({
  SODIUM_VAPOR_STREET: kelvinToRgb(2100),
  CANDLE_AMBER: kelvinToRgb(1900),
  WARM_TUNGSTEN: kelvinToRgb(2800),
  STUDIO_HALOGEN: kelvinToRgb(3200),
  GOLDEN_HOUR_SUN: kelvinToRgb(3400),
  DIRECT_DAYLIGHT: kelvinToRgb(5500),
  OVERCAST_SKY: kelvinToRgb(6500),
  COOL_MOONLIGHT: kelvinToRgb(7800),
  DEEP_TWILIGHT: kelvinToRgb(9500)
});

const LOOKDEV_PRESETS = Object.freeze({
  automotive_clearcoat: {
    metallic: 0.94,
    roughness: 0.16,
    clearcoat: 0.90,
    clearcoatRoughness: 0.05,
    description: 'High-gloss automotive metallic paint with multi-stage clearcoat'
  },
  wet_asphalt_rain: {
    metallic: 0.0,
    roughness: 0.12,
    specular: 0.85,
    puddleCoverage: 0.65,
    description: 'Dark saturated pavement with micro-puddle reflections and damp aggregate'
  },
  brushed_metal: {
    metallic: 0.95,
    roughness: 0.32,
    anisotropic: 0.55,
    description: 'Industrial machined metal with anisotropic brush direction'
  },
  optical_glass: {
    transmission: 1.0,
    roughness: 0.02,
    ior: 1.52,
    description: 'Pure optical glass with high transmission and sharp caustics'
  },
  weathered_stone: {
    metallic: 0.0,
    roughness: 0.72,
    specular: 0.35,
    description: 'Rough geological stone with natural micro-surface porosity'
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// VISUAL DIRECTOR CLASS
// ──────────────────────────────────────────────────────────────────────────────

class VisualDirector {
  constructor(bridgeRpcCaller, options = {}) {
    this.sendRPC = bridgeRpcCaller;
    this.ai = new UnifiedAILayer(options);
    this.defaultQuality = options.qualityProfile || QUALITY_PROFILE.CINEMATIC;
  }

  /**
   * Translates natural language prompt and scene semantics into a structured Visual Production Plan.
   *
   * @param {string} userPrompt - Creative instruction
   * @param {Object} sceneGraph - Active scene graph
   * @param {Object} [worldState=null] - Persistent living world state
   * @param {Object} [options={}] - Custom overrides
   * @returns {Promise<Object>} Validated VisualProductionPlan
   */
  async planVisualProduction(userPrompt, sceneGraph, worldState = null, options = {}) {
    logger.info(`[VisualDirector] Formulating production visual plan for: "${userPrompt}"...`);

    const heroEntity = sceneGraph ? sceneGraph.getHeroEntity() : null;
    const heroCategory = heroEntity ? (heroEntity.category || 'prop') : 'object';

    // Step 1: Semantic style and mood analysis
    const semanticIntent = this._interpretSemanticStyle(userPrompt, sceneGraph);

    // Step 2: Attempt AI synthesis if available
    let visualPlan = null;
    try {
      const aiRes = await this._synthesizePlanWithAI(userPrompt, semanticIntent, sceneGraph, heroEntity);
      if (aiRes && aiRes.success && aiRes.data) {
        visualPlan = aiRes.data;
      }
    } catch (e) {
      logger.warn(`[VisualDirector] AI plan synthesis notice: ${e.message}. Using deterministic director engine.`);
    }

    // Step 3: Deterministic fallback & validation
    if (!visualPlan) {
      visualPlan = this._generateDeterministicVisualPlan(userPrompt, semanticIntent, sceneGraph, heroEntity, options);
    }

    // Step 4: Validate plan against strict schema & physicality
    const validation = this.validatePlan(visualPlan);
    if (!validation.valid) {
      logger.warn(`[VisualDirector] Initial plan validation issues: ${validation.errors.join(', ')}. Sanitizing plan...`);
      visualPlan = this._sanitizePlan(visualPlan, semanticIntent);
    }

    logger.info(`[VisualDirector] Visual plan finalized: style="${visualPlan.visualIntent.style}", strategy="${visualPlan.lighting.strategy}", lens=${visualPlan.camera.focalLength}mm, f/${visualPlan.camera.aperture} ✓`);

    return visualPlan;
  }

  /**
   * Deterministic semantic analysis of user style, mood, lighting, and camera intent
   */
  _interpretSemanticStyle(prompt, sceneGraph) {
    const p = (prompt || '').toLowerCase();

    // Time of day
    let timeOfDay = 'night';
    if (p.includes('sunset') || p.includes('golden hour') || p.includes('dusk')) timeOfDay = 'sunset';
    else if (p.includes('sunrise') || p.includes('dawn') || p.includes('morning')) timeOfDay = 'morning';
    else if (p.includes('noon') || p.includes('midday') || p.includes('daylight') || p.includes('bright day')) timeOfDay = 'day';
    else if (sceneGraph?.timeOfDay) timeOfDay = sceneGraph.timeOfDay;

    // Weather & Atmosphere
    let weather = 'clear';
    let isRain = p.includes('rain') || p.includes('wet') || p.includes('puddle');
    let isFog = p.includes('fog') || p.includes('mist') || p.includes('haze') || p.includes('smoke');
    if (isRain && isFog) weather = 'rain_and_fog';
    else if (isRain) weather = 'rain';
    else if (isFog) weather = 'fog';

    // Cinematic Style & Genre
    let style = 'cinematic_realism';
    let lightingStrategy = LIGHTING_STRATEGY.THREE_POINT_CINEMATIC;
    let composition = COMPOSITION_RULE.RULE_OF_THIRDS;
    let shotType = SHOT_TYPE.HERO_MEDIUM;
    let cameraAngle = CAMERA_ANGLE.LOW_ANGLE_HERO;

    if (p.includes('commercial') || p.includes('advertisement') || p.includes('studio') || p.includes('showroom')) {
      style = 'luxury_commercial';
      lightingStrategy = LIGHTING_STRATEGY.STUDIO_COMMERCIAL;
      composition = COMPOSITION_RULE.CENTER_HERO;
      shotType = SHOT_TYPE.HERO_MEDIUM;
      cameraAngle = CAMERA_ANGLE.LOW_ANGLE_HERO;
    } else if (p.includes('thriller') || p.includes('noir') || p.includes('dark psychological') || p.includes('gritty')) {
      style = 'dark_noir_thriller';
      lightingStrategy = LIGHTING_STRATEGY.DARK_NOIR_THRILLER;
      composition = COMPOSITION_RULE.NEGATIVE_SPACE;
      cameraAngle = CAMERA_ANGLE.DUTCH_TILT;
    } else if (p.includes('cyberpunk') || p.includes('neon') || p.includes('futuristic')) {
      style = 'cyberpunk_sci_fi';
      lightingStrategy = LIGHTING_STRATEGY.CYBERPUNK_NEON;
      cameraAngle = CAMERA_ANGLE.LOW_ANGLE_HERO;
    } else if (p.includes('epic') || p.includes('fantasy') || p.includes('dragon') || p.includes('mountain')) {
      style = 'epic_fantasy_cinematography';
      lightingStrategy = timeOfDay === 'sunset' ? LIGHTING_STRATEGY.NATURAL_GOLDEN_HOUR : LIGHTING_STRATEGY.THREE_POINT_CINEMATIC;
      shotType = SHOT_TYPE.WIDE;
      composition = COMPOSITION_RULE.GOLDEN_RATIO;
    } else if (p.includes('street') || p.includes('urban') || p.includes('indian street') || p.includes('traffic light')) {
      style = 'motivated_urban_cinematic';
      lightingStrategy = LIGHTING_STRATEGY.MOTIVATED_PRACTICAL;
      cameraAngle = CAMERA_ANGLE.LOW_ANGLE_HERO;
    } else if (timeOfDay === 'sunset') {
      lightingStrategy = LIGHTING_STRATEGY.NATURAL_GOLDEN_HOUR;
    }

    return {
      style,
      timeOfDay,
      weather,
      isRain,
      isFog,
      lightingStrategy,
      composition,
      shotType,
      cameraAngle
    };
  }

  /**
   * AI-driven synthesis of VisualProductionPlan
   */
  async _synthesizePlanWithAI(prompt, intent, sceneGraph, heroEntity) {
    const systemPrompt = `You are an Award-Winning Hollywood Visual Director & Director of Photography (DP) collaborating with Google DeepMind / UNIN 3D Studio.
Your mission is to translate artistic intent into a fully structured, physically consistent Visual Production Plan for Blender 5.1.

PHYSICAL CINEMATOGRAPHY RULES:
1. Camera lenses must be standard cinema primes (e.g. 24mm, 35mm, 40mm, 50mm, 65mm, 85mm, 105mm). Full-frame 36x24mm sensor.
2. Depth of Field (DOF) must be physically calculated. Hero medium shots use f/2.8 to f/4.0; macro/close-up f/1.8 to f/2.8; wide landscapes f/8.0 to f/11.0.
3. Lighting rigs must be motivated by the story/environment, never arbitrary random points.
4. Volumetric fog density in Blender must stay between 0.0004 and 0.0025 to preserve photon path tracing.
5. Color management should specify AgX / Filmic view transforms and appropriate contrast.

OUTPUT STRICT JSON ONLY:
{
  "visualIntent": {
    "style": "string",
    "mood": "string",
    "timeOfDay": "night" | "sunset" | "day" | "morning",
    "weather": "clear" | "rain" | "fog" | "rain_and_fog"
  },
  "camera": {
    "shotType": "${intent.shotType}",
    "focalLength": 40.0,
    "aperture": 3.2,
    "sensorWidth": 36.0,
    "subject": "${heroEntity ? heroEntity.id : 'hero_subject'}",
    "composition": "${intent.composition}",
    "cameraHeight": 1.1,
    "cameraDistance": 3.8,
    "cameraAngle": "${intent.cameraAngle}",
    "dofEnabled": true
  },
  "lighting": {
    "strategy": "${intent.lightingStrategy}",
    "key": {
      "type": "AREA" | "SPOT" | "SUN",
      "energy": 1400.0,
      "color": [1.0, 0.95, 0.85],
      "size": 2.5,
      "location": [3.5, -4.0, 3.5]
    },
    "fill": {
      "type": "AREA" | "POINT",
      "energy": 550.0,
      "color": [0.4, 0.6, 0.9],
      "size": 3.5,
      "location": [-3.5, -2.5, 2.0]
    },
    "rim": {
      "type": "SPOT",
      "energy": 2400.0,
      "color": [0.2, 0.85, 1.0],
      "size": 0.8,
      "location": [0.0, 4.2, 3.0]
    },
    "practicals": []
  },
  "environment": {
    "fog": {
      "enabled": true,
      "density": 0.0012,
      "color": [0.15, 0.20, 0.30]
    },
    "rain": {
      "active": false,
      "puddleCoverage": 0.5
    },
    "surfaceWetness": 0.8
  },
  "lookDev": {
    "contrast": "High Contrast",
    "viewTransform": "AgX",
    "exposure": 0.0,
    "materialVariation": true
  },
  "qualityProfile": "CINEMATIC"
}`;

    const userMsg = `Produce a Visual Production Plan for: "${prompt}"
Context: Hero is ${heroEntity ? heroEntity.name : 'Primary Subject'} (${heroEntity ? heroEntity.category : 'prop'}).
Scene Mood: ${intent.style}. Time: ${intent.timeOfDay}. Weather: ${intent.weather}.`;

    return await this.ai.synthesizeJson(systemPrompt, userMsg, (plan) => this.validatePlan(plan));
  }

  /**
   * Deterministic director engine producing production-grade visual specifications
   */
  _generateDeterministicVisualPlan(prompt, intent, sceneGraph, heroEntity, options = {}) {
    const isNight = intent.timeOfDay === 'night';
    const isSunset = intent.timeOfDay === 'sunset';
    const isCommercial = intent.style === 'luxury_commercial';

    // 1. Camera parameters based on hero and style
    let focalLength = 40.0;
    let aperture = 3.2;
    let cameraDistance = 3.8;
    let cameraHeight = 1.1;

    if (isCommercial) {
      focalLength = 65.0; // Long-lens compression for automotive/product ads
      aperture = 2.8;
      cameraDistance = 5.2;
      cameraHeight = 0.95;
    } else if (intent.shotType === SHOT_TYPE.WIDE) {
      focalLength = 28.0;
      aperture = 5.6;
      cameraDistance = 7.5;
      cameraHeight = 2.4;
    }

    // 2. Lighting Rig Specification
    let keyColor = isSunset ? COLOR_TEMPERATURE_PRESETS.GOLDEN_HOUR_SUN : (isNight ? [1.0, 0.72, 0.28] : COLOR_TEMPERATURE_PRESETS.DIRECT_DAYLIGHT);
    let fillColor = isNight ? [0.25, 0.45, 0.85] : (isSunset ? [0.65, 0.45, 0.75] : COLOR_TEMPERATURE_PRESETS.OVERCAST_SKY);
    let rimColor = isNight ? [0.15, 0.85, 1.0] : (isSunset ? [1.0, 0.5, 0.15] : [1.0, 1.0, 1.0]);

    let keyEnergy = isCommercial ? 1800.0 : (isNight ? 1200.0 : 2500.0);
    let fillEnergy = keyEnergy * 0.35;
    let rimEnergy = isNight ? 2400.0 : 1500.0;

    const practicals = [];
    if (intent.lightingStrategy === LIGHTING_STRATEGY.MOTIVATED_PRACTICAL) {
      practicals.push({
        id: 'unin.light.practical_streetlamp_1',
        name: 'Streetlamp Amber Sodium Light',
        type: 'SPOT',
        energy: 2200.0,
        color: COLOR_TEMPERATURE_PRESETS.SODIUM_VAPOR_STREET,
        location: [-4.4, -8.0, 5.3],
        spotSize: 1.25
      });
      practicals.push({
        id: 'unin.light.practical_streetlamp_2',
        name: 'Streetlamp Amber Sodium Light 2',
        type: 'SPOT',
        energy: 2200.0,
        color: COLOR_TEMPERATURE_PRESETS.SODIUM_VAPOR_STREET,
        location: [-4.4, 7.0, 5.3],
        spotSize: 1.25
      });
    }

    // 3. Environment & Atmosphere
    const fogDensity = intent.isFog ? 0.0012 : 0.0003;
    const surfaceWetness = intent.isRain ? 0.95 : 0.2;

    return {
      visualIntent: {
        style: intent.style,
        mood: isNight ? 'dramatic_cinematic' : (isSunset ? 'warm_epic' : 'neutral_production'),
        timeOfDay: intent.timeOfDay,
        weather: intent.weather
      },
      camera: {
        shotType: intent.shotType,
        focalLength,
        aperture,
        sensorWidth: 36.0,
        subject: heroEntity ? heroEntity.id : 'unin.camera.look_target',
        composition: intent.composition,
        cameraHeight,
        cameraDistance,
        cameraAngle: intent.cameraAngle,
        dofEnabled: true
      },
      lighting: {
        strategy: intent.lightingStrategy,
        key: {
          type: isSunset ? 'SUN' : 'AREA',
          energy: keyEnergy,
          color: keyColor,
          size: isCommercial ? 4.0 : 2.5,
          location: [3.5, -4.0, 3.5]
        },
        fill: {
          type: 'AREA',
          energy: fillEnergy,
          color: fillColor,
          size: 3.5,
          location: [-3.5, -2.5, 2.0]
        },
        rim: {
          type: 'SPOT',
          energy: rimEnergy,
          color: rimColor,
          size: 0.8,
          location: [0.0, 4.2, 3.0]
        },
        practicals
      },
      environment: {
        fog: {
          enabled: intent.isFog,
          density: fogDensity,
          color: isNight ? [0.12, 0.16, 0.24] : [0.75, 0.70, 0.65]
        },
        rain: {
          active: intent.isRain,
          puddleCoverage: intent.isRain ? 0.65 : 0.0
        },
        surfaceWetness
      },
      lookDev: {
        contrast: isCommercial ? 'Medium High Contrast' : 'High Contrast',
        viewTransform: 'AgX',
        exposure: isNight ? -0.3 : 0.0,
        materialVariation: true
      },
      qualityProfile: options.qualityProfile || this.defaultQuality
    };
  }

  /**
   * Validates a VisualProductionPlan object
   */
  validatePlan(plan) {
    const errors = [];
    if (!plan || typeof plan !== 'object') {
      return { valid: false, errors: ['Plan must be a valid non-null object'] };
    }

    if (!plan.visualIntent || !plan.visualIntent.style) {
      errors.push('Missing visualIntent.style');
    }

    if (!plan.camera) {
      errors.push('Missing camera section');
    } else {
      const c = plan.camera;
      if (typeof c.focalLength !== 'number' || c.focalLength < 10 || c.focalLength > 400) {
        errors.push(`Invalid focalLength (${c.focalLength}): must be between 10mm and 400mm`);
      }
      if (typeof c.aperture !== 'number' || c.aperture < 0.5 || c.aperture > 32) {
        errors.push(`Invalid aperture (${c.aperture}): must be between f/0.5 and f/32`);
      }
    }

    if (!plan.lighting) {
      errors.push('Missing lighting section');
    } else {
      const l = plan.lighting;
      if (!l.strategy) errors.push('Missing lighting.strategy');
      if (!l.key || typeof l.key.energy !== 'number') errors.push('Missing or invalid lighting.key');
    }

    if (!plan.environment) {
      errors.push('Missing environment section');
    } else {
      const env = plan.environment;
      if (env.fog && typeof env.fog.density === 'number' && (env.fog.density < 0 || env.fog.density > 0.05)) {
        errors.push(`Unsafe fog density (${env.fog.density}): causes photon extinction in path tracing`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Auto-sanitizes flawed plan parameters into safe production ranges
   */
  _sanitizePlan(plan, intent) {
    const clean = JSON.parse(JSON.stringify(plan));
    clean.visualIntent = clean.visualIntent || { style: intent.style, timeOfDay: intent.timeOfDay };
    clean.camera = clean.camera || {};
    if (intent.shotType) clean.camera.shotType = intent.shotType;
    if (intent.composition) clean.camera.composition = intent.composition;
    if (intent.cameraAngle) clean.camera.cameraAngle = intent.cameraAngle;
    clean.camera.focalLength = Math.min(Math.max(clean.camera.focalLength || 40.0, 18.0), 200.0);
    clean.camera.aperture = Math.min(Math.max(clean.camera.aperture || 3.2, 1.2), 16.0);
    clean.camera.sensorWidth = clean.camera.sensorWidth || 36.0;

    clean.lighting = clean.lighting || {};
    clean.lighting.strategy = clean.lighting.strategy || intent.lightingStrategy;
    clean.lighting.key = clean.lighting.key || { type: 'AREA', energy: 1200.0, color: [1.0, 0.9, 0.8], size: 2.5, location: [3.5, -4.0, 3.5] };
    clean.lighting.key.energy = Math.min(Math.max(clean.lighting.key.energy, 100.0), 10000.0);

    clean.environment = clean.environment || {};
    if (clean.environment.fog) {
      clean.environment.fog.density = Math.min(Math.max(clean.environment.fog.density || 0.001, 0.0002), 0.003);
    }

    clean.lookDev = clean.lookDev || { viewTransform: 'AgX', contrast: 'High Contrast' };
    clean.qualityProfile = clean.qualityProfile || QUALITY_PROFILE.CINEMATIC;
    return clean;
  }

  /**
   * Generates production-ready, idempotent Blender Python code for the visual plan
   *
   * @param {Object} plan - VisualProductionPlan
   * @param {string} worldId - Canonical world identifier
   * @returns {string} Executable Blender 5.1 Python script
   */
  generateVisualBpy(plan, worldId = 'unin_world_default') {
    const cam = plan.camera;
    const lgt = plan.lighting;
    const env = plan.environment;
    const look = plan.lookDev;

    return `
# ==============================================================================
# UNIN VISUAL DIRECTOR PRODUCTION RIG (Phase 3C)
# Style: ${plan.visualIntent.style} | Mood: ${plan.visualIntent.mood}
# ==============================================================================
import bpy
import math
import mathutils

scene = bpy.context.scene

# 1. COLOR MANAGEMENT & TONE MAPPING
try:
    if hasattr(scene.view_settings, 'view_transform'):
        # Check if AgX is supported in Blender 4.0+/5.0+
        scene.view_settings.view_transform = "${look.viewTransform || 'AgX'}"
    if hasattr(scene.view_settings, 'look'):
        scene.view_settings.look = "${look.contrast || 'High Contrast'}"
    if hasattr(scene.view_settings, 'exposure'):
        scene.view_settings.exposure = ${look.exposure || 0.0}
except Exception as e:
    print("[VisualDirector] Color management warning:", e)

# 2. CAMERA RIG CONFIGURATION
cam_obj = bpy.data.objects.get("unin.camera.primary")
if not cam_obj:
    cam_data = bpy.data.cameras.new("Cinematic_Master_Camera")
    cam_obj = bpy.data.objects.new("unin.camera.primary", cam_data)
    bpy.context.collection.objects.link(cam_obj)

cam_obj["unin_id"] = "unin.camera.primary"
cam_obj["unin_world_id"] = "${worldId}"
cam_obj["unin_version"] = 1

# Camera Optics
cam_data = cam_obj.data
cam_data.lens = ${cam.focalLength}
cam_data.sensor_width = ${cam.sensorWidth || 36.0}
cam_data.dof.use_dof = ${cam.dofEnabled ? 'True' : 'False'}
cam_data.dof.aperture_fstop = ${cam.aperture}
cam_data.dof.aperture_blades = 7

# Evaluated World-Space Bounding Box & Adaptive Framing
import mathutils

def get_evaluated_bounds():
    hero = None
    for o in bpy.context.scene.objects:
        if o.get("unin_hero") or "hero" in o.name.lower() or o.name.startswith("hero_"):
            hero = o
            break
    if not hero:
        subj_name = "${cam.subject || ''}"
        if subj_name:
            hero = bpy.data.objects.get(subj_name)
    if not hero:
        for o in bpy.context.scene.objects:
            if o.type == 'MESH' and not any(k in o.name.lower() for k in ['ground', 'floor', 'plane', 'sky', 'emitter']):
                hero = o
                break

    if hero:
        objs = [hero]
        def collect_ch(p):
            for c in p.children:
                objs.append(c)
                collect_ch(c)
        collect_ch(hero)

        coords = []
        for o in objs:
            if hasattr(o, "bound_box") and o.bound_box:
                for corner in o.bound_box:
                    coords.append(o.matrix_world @ mathutils.Vector(corner))
        if coords:
            min_x = min(c.x for c in coords)
            max_x = max(c.x for c in coords)
            min_y = min(c.y for c in coords)
            max_y = max(c.y for c in coords)
            min_z = min(c.z for c in coords)
            max_z = max(c.z for c in coords)
            center = mathutils.Vector(((min_x + max_x) / 2.0, (min_y + max_y) / 2.0, (min_z + max_z) / 2.0))
            dims = mathutils.Vector((max(0.2, max_x - min_x), max(0.2, max_y - min_y), max(0.2, max_z - min_z)))
            return center, dims

    return mathutils.Vector((0.0, 0.0, 0.65)), mathutils.Vector((0.85, 2.2, 1.25))

hero_center, hero_dims = get_evaluated_bounds()

# Target Tracking Hook
look_target = bpy.data.objects.get("unin.camera.look_target")
if not look_target:
    look_target = bpy.data.objects.new("unin.camera.look_target", None)
    bpy.context.collection.objects.link(look_target)
look_target.location = mathutils.Vector(hero_center)
look_target["unin_id"] = "unin.camera.look_target"
look_target["unin_world_id"] = "${worldId}"

# Adaptive Safe Distance calculation based on evaluated bounds, aspect ratio & FOV
render = scene.render
aspect = (render.resolution_x * render.pixel_aspect_x) / (render.resolution_y * render.pixel_aspect_y)
sensor_w = getattr(cam_data, 'sensor_width', 36.0)
sensor_h = cam_data.sensor_height if getattr(cam_data, 'sensor_fit', 'AUTO') == 'VERTICAL' else (sensor_w / aspect)
focal_l = cam_data.lens

fov_h = 2.0 * math.atan((sensor_w / 2.0) / focal_l)
fov_v = 2.0 * math.atan((sensor_h / 2.0) / focal_l)

xy_span = math.sqrt(hero_dims.x**2 + hero_dims.y**2)
dist_h = (xy_span / 2.0) / math.tan(fov_h / 2.0)
dist_v = (hero_dims.z / 2.0) / math.tan(fov_v / 2.0)

fit_dist = max(dist_h, dist_v) * 1.35
fit_dist = max(fit_dist, ${cam.cameraDistance || 2.5})

azimuth = math.radians(-38.0)
elevation = math.radians(16.0)
${cam.composition === COMPOSITION_RULE.RULE_OF_THIRDS ? `
look_target.location.x += hero_dims.x * 0.12
` : ''}

cam_x = hero_center.x + fit_dist * math.cos(elevation) * math.sin(azimuth)
cam_y = hero_center.y - fit_dist * math.cos(elevation) * math.cos(azimuth)
${cam.cameraAngle === CAMERA_ANGLE.LOW_ANGLE_HERO ? `
cam_z = max(0.42, hero_center.z - 0.15)
` : `
cam_z = hero_center.z + fit_dist * math.sin(elevation)
`}
cam_obj.location = (cam_x, cam_y, cam_z)

# Ensure Track To constraint
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

# Focus distance
cam_data.dof.focus_distance = (cam_obj.location - look_target.location).length
scene.camera = cam_obj

# 3. MOTIVATED LIGHTING RIG
# Key Light
k_data = bpy.data.lights.get("Key_Light_Data") or bpy.data.lights.new(name="Key_Light_Data", type='${lgt.key.type || 'AREA'}')
k_data.energy = ${lgt.key.energy}
k_data.color = (${lgt.key.color[0]}, ${lgt.key.color[1]}, ${lgt.key.color[2]})
if hasattr(k_data, 'size'):
    k_data.size = ${lgt.key.size || 2.5}

k_obj = bpy.data.objects.get("unin.lighting.key")
if not k_obj:
    k_obj = bpy.data.objects.new("unin.lighting.key", object_data=k_data)
    bpy.context.collection.objects.link(k_obj)
k_obj["unin_id"] = "unin.lighting.key"
k_obj["unin_world_id"] = "${worldId}"
k_obj.location = (${lgt.key.location[0]}, ${lgt.key.location[1]}, ${lgt.key.location[2]})

# Fill Light
f_data = bpy.data.lights.get("Fill_Light_Data") or bpy.data.lights.new(name="Fill_Light_Data", type='${lgt.fill.type || 'AREA'}')
f_data.energy = ${lgt.fill.energy}
f_data.color = (${lgt.fill.color[0]}, ${lgt.fill.color[1]}, ${lgt.fill.color[2]})
if hasattr(f_data, 'size'):
    f_data.size = ${lgt.fill.size || 3.5}

f_obj = bpy.data.objects.get("unin.lighting.fill")
if not f_obj:
    f_obj = bpy.data.objects.new("unin.lighting.fill", object_data=f_data)
    bpy.context.collection.objects.link(f_obj)
f_obj["unin_id"] = "unin.lighting.fill"
f_obj["unin_world_id"] = "${worldId}"
f_obj.location = (${lgt.fill.location[0]}, ${lgt.fill.location[1]}, ${lgt.fill.location[2]})

# Rim Light
r_data = bpy.data.lights.get("Rim_Light_Data") or bpy.data.lights.new(name="Rim_Light_Data", type='${lgt.rim.type || 'SPOT'}')
r_data.energy = ${lgt.rim.energy}
r_data.color = (${lgt.rim.color[0]}, ${lgt.rim.color[1]}, ${lgt.rim.color[2]})
if hasattr(r_data, 'spot_size'):
    r_data.spot_size = math.radians(45)

r_obj = bpy.data.objects.get("unin.lighting.rim")
if not r_obj:
    r_obj = bpy.data.objects.new("unin.lighting.rim", object_data=r_data)
    bpy.context.collection.objects.link(r_obj)
r_obj["unin_id"] = "unin.lighting.rim"
r_obj["unin_world_id"] = "${worldId}"
r_obj.location = (${lgt.rim.location[0]}, ${lgt.rim.location[1]}, ${lgt.rim.location[2]})
r_obj.rotation_euler = (math.radians(-45), 0, math.radians(180))

# 4. VOLUMETRIC ATMOSPHERE & WORLD ENVIRONMENT
world = scene.world or bpy.data.worlds.new("UNIN_Cinematic_World")
scene.world = world
world.use_nodes = True
w_nodes = world.node_tree.nodes
w_links = world.node_tree.links

bg_node = w_nodes.get("Background")
out_node = w_nodes.get("World Output")

if bg_node:
    bg_node.inputs['Color'].default_value = (0.02, 0.03, 0.05, 1.0)
    bg_node.inputs['Strength'].default_value = 0.45

${env.fog && env.fog.enabled ? `
# Safe Volumetric Fog Setup
vol_node = w_nodes.get("Principled Volume")
if not vol_node:
    vol_node = w_nodes.new(type='ShaderNodeVolumePrincipled')
vol_node.inputs['Density'].default_value = ${env.fog.density}
vol_node.inputs['Color'].default_value = (${env.fog.color[0]}, ${env.fog.color[1]}, ${env.fog.color[2]}, 1.0)
if out_node:
    w_links.new(vol_node.outputs['Volume'], out_node.inputs['Volume'])
` : `
# Disconnect volume if fog disabled
if out_node and out_node.inputs['Volume'].is_linked:
    for link in list(out_node.inputs['Volume'].links):
        w_links.remove(link)
`}

print("[VisualDirector] Production visual rig successfully configured ✓")
`;
  }

  /**
   * Applies the visual production plan to active Blender session via RPC
   * and synchronizes PersistentWorldState.
   *
   * @param {Object} plan - VisualProductionPlan
   * @param {Object} [worldState=null]
   * @returns {Promise<Object>}
   */
  async applyVisualPlan(plan, worldState = null) {
    const wid = worldState ? worldState.worldId : 'unin_world_default';
    const py = this.generateVisualBpy(plan, wid);

    logger.info(`[VisualDirector] Applying visual production rig to active Blender session (world: ${wid})...`);
    const rpcRes = await this.sendRPC('execute_bpy', {
      code: py,
      autoCapture: false,
      timeout: 60.0
    }, 60000);

    if (worldState) {
      // Synchronize world state
      worldState.cameraState = {
        focalLength: plan.camera.focalLength,
        aperture: plan.camera.aperture,
        sensorWidth: plan.camera.sensorWidth,
        composition: plan.camera.composition,
        dofEnabled: plan.camera.dofEnabled,
        cameraAngle: plan.camera.cameraAngle
      };
      worldState.lightingState = {
        strategy: plan.lighting.strategy,
        key: plan.lighting.key,
        fill: plan.lighting.fill,
        rim: plan.lighting.rim
      };
      worldState.environmentState = {
        ...worldState.environmentState,
        fog: plan.environment.fog,
        surfaceWetness: plan.environment.surfaceWetness
      };
      worldState.visualPlan = plan;
      worldState.recordMutation('VISUAL_DIRECTION', {
        style: plan.visualIntent.style,
        strategy: plan.lighting.strategy,
        lens: plan.camera.focalLength
      });
      await worldState.save();
    }

    return {
      success: !(rpcRes && rpcRes.error),
      error: rpcRes?.error,
      plan
    };
  }
}

module.exports = {
  VisualDirector,
  SHOT_TYPE,
  COMPOSITION_RULE,
  CAMERA_ANGLE,
  LIGHTING_STRATEGY,
  QUALITY_PROFILE,
  COLOR_TEMPERATURE_PRESETS,
  LOOKDEV_PRESETS,
  kelvinToRgb
};
