// src/main/tools/astra/core/IntentInterpreter.js — Semantic 3D Intent Understanding Engine
'use strict';

const logger = require('../../../../shared/Logger');

const INTENT_SYSTEM_PROMPT = `You are a Principal 3D Technical Director and World Architect (FAANG / AAA Game Studio level).
Your task is to analyze arbitrary natural language 3D creation requests (in English, Telugu, or mixed Tenglish) and produce a rigorous, structured 3D Scene Specification.

CRITICAL RULES:
1. Extract ALL semantic dimensions: task type, focal hero entities, environmental foundation, lighting mood, weather physics, time of day, camera optics, spatial relationships, and fidelity constraints.
2. For ANY entity requested (e.g. "Harley Davidson motorcycle", "temple", "dragon", "spaceship", "car", "character"):
   - Assign a canonical ID (e.g. "hero_motorcycle", "hero_temple").
   - Categorize accurately: "vehicle", "architecture", "creature", "character", "prop", "vegetation".
   - Estimate realistic metric dimensions in meters: [width_x, length_y, height_z] (e.g. motorcycle = [0.9, 2.2, 1.2], car = [1.9, 4.6, 1.3], human = [0.5, 0.4, 1.8], temple = [18.0, 24.0, 16.0]).
3. Identify exact atmospheric conditions: rain, puddles, fog, reflections, time of day.
4. Output strictly valid JSON conforming to the requested schema.`;

class IntentInterpreter {
  constructor(aiLayer) {
    this.ai = aiLayer;
  }

  /**
   * Deconstructs arbitrary natural language into a canonical semantic 3D specification
   */
  async interpret(userPrompt) {
    logger.info(`[IntentInterpreter] Deconstructing 3D intent: "${userPrompt}"`);

    const userQuery = `Analyze this 3D creation request and extract the full semantic specification:
"${userPrompt}"

Output strictly a JSON object with this exact schema:
{
  "taskType": "create_world" | "modify_world" | "add_entity" | "render_only",
  "visualFidelity": "photorealistic" | "cinematic" | "stylized",
  "summary": "Concise summary of the world to build",
  "heroEntities": [
    {
      "id": "hero_primary",
      "name": "Standardized entity name",
      "category": "vehicle" | "architecture" | "character" | "creature" | "prop" | "vegetation",
      "description": "Rich visual description",
      "importance": "hero" | "secondary" | "scatter",
      "estimatedDimensions": [width_x, length_y, height_z],
      "materials": ["metallic_paint", "chrome", "rubber", "glass"],
      "groundPlacement": true
    }
  ],
  "environment": {
    "type": "urban_street" | "forest_nature" | "scifi_interior" | "temple_sacred" | "coastal_ocean" | "open_terrain",
    "baseSurface": "wet_asphalt" | "mossy_soil" | "ancient_stone_tiles" | "sand" | "concrete",
    "secondaryProps": ["traffic_lights", "curbs", "puddles", "street_lamps", "debris"]
  },
  "weather": {
    "precipitation": "rain" | "snow" | "mist" | "clear",
    "puddles": true | false,
    "wetReflections": true | false,
    "fogDensity": 0.0 to 1.0
  },
  "timeOfDay": "night" | "golden_hour" | "sunset" | "sunrise" | "overcast" | "noon",
  "lighting": {
    "primaryType": "streetlights" | "neon_accents" | "sun" | "studio_3point",
    "mood": "moody_contrast" | "bright_natural" | "cyber_vibrant",
    "colors": ["amber", "cyan", "deep_midnight"]
  },
  "cinematography": {
    "lensFocalLength": 24 | 35 | 50 | 85,
    "cameraAngle": "low_angle_hero" | "eye_level" | "wide_establishing" | "cinematic_glide",
    "enableDoF": true | false,
    "apertureFStop": 1.8 | 2.8 | 4.0
  },
  "constraints": ["wet asphalt mirror reflections", "accurate ground contact", "high-poly bevels"]
}`;

    const aiRes = await this.ai.synthesizeJson(INTENT_SYSTEM_PROMPT, userQuery, (data) => {
      return {
        valid: data && data.heroEntities && Array.isArray(data.heroEntities) && data.environment,
        reason: 'Missing heroEntities array or environment definition'
      };
    });

    if (aiRes.success && aiRes.data) {
      logger.info(`[IntentInterpreter] Semantic intent resolved via ${aiRes.model}: Found ${aiRes.data.heroEntities.length} entities in ${aiRes.data.environment.type} ✓`);
      aiRes.data._synthesisSource = aiRes.model;
      aiRes.data._aiQuotaExceeded = false;
      return aiRes.data;
    }

    logger.warn(`[IntentInterpreter] AI synthesis unavailable (quotaExceeded=${!!aiRes.aiQuotaExceeded}). Engaging Deterministic Semantic Fallback Engine...`);
    const fallbackIntent = this._semanticDeterministicFallback(userPrompt);
    fallbackIntent._synthesisSource = 'deterministic_fallback';
    fallbackIntent._aiQuotaExceeded = !!aiRes.aiQuotaExceeded;
    return fallbackIntent;
  }

  /**
   * Deterministic semantic decomposition fallback for offline resilience
   */
  _semanticDeterministicFallback(prompt = '') {
    const p = prompt.toLowerCase();

    // 1. Detect Hero Entity
    let hero = {
      id: 'hero_subject',
      name: 'Custom 3D Subject',
      category: 'prop',
      description: prompt,
      importance: 'hero',
      estimatedDimensions: [1.5, 2.0, 1.5],
      materials: ['principled_pbr'],
      groundPlacement: true
    };

    if (/motorcycle|bike|harley|bullet|ducati|yamaha|scooter|two-wheeler/i.test(p)) {
      hero = {
        id: 'hero_motorcycle',
        name: 'Harley Davidson Motorcycle',
        category: 'vehicle',
        description: 'Cruiser style motorcycle with chrome engine block, spoked wheels, handlebars, and exhaust pipes',
        importance: 'hero',
        estimatedDimensions: [0.9, 2.2, 1.25],
        materials: ['gloss_black_paint', 'polished_chrome', 'rubber_tread', 'clear_glass'],
        groundPlacement: true
      };
    } else if (/car|ferrari|sports\s*car|supercar|vehicle|automobile/i.test(p)) {
      hero = {
        id: 'hero_vehicle',
        name: 'High-Performance Sports Car',
        category: 'vehicle',
        description: 'Aerodynamic supercar body with alloy wheels, carbon fiber trim, and headlights',
        importance: 'hero',
        estimatedDimensions: [1.95, 4.6, 1.25],
        materials: ['metallic_paint', 'carbon_fiber', 'rubber', 'glass'],
        groundPlacement: true
      };
    } else if (/temple|mandir|kovil|shrine|ancient\s*architecture/i.test(p)) {
      hero = {
        id: 'hero_temple',
        name: 'Ancient Indian Temple',
        category: 'architecture',
        description: 'Carved stone sanctum sanctorum with tiered shikhara tower, mandapa pillars, and stone steps',
        importance: 'hero',
        estimatedDimensions: [14.0, 20.0, 15.0],
        materials: ['carved_sandstone', 'weathered_granite', 'brass_accents'],
        groundPlacement: true
      };
    } else if (/dragon|monster|creature|beast/i.test(p)) {
      hero = {
        id: 'hero_dragon',
        name: 'Mythical Dragon',
        category: 'creature',
        description: 'Horned quadrupedal winged dragon with serpentine tail and scaled hide',
        importance: 'hero',
        estimatedDimensions: [4.0, 7.5, 3.2],
        materials: ['scaled_leather', 'bone_horns', 'obsidian_claws'],
        groundPlacement: true
      };
    } else if (/spaceship|starship|craft|shuttle|ufo/i.test(p)) {
      hero = {
        id: 'hero_spaceship',
        name: 'Futuristic Spaceship',
        category: 'vehicle',
        description: 'Sleek interceptor spacecraft with ion propulsion thrusters and cockpit canopy',
        importance: 'hero',
        estimatedDimensions: [6.5, 12.0, 3.5],
        materials: ['hull_plating', 'shield_glass', 'plasma_glow'],
        groundPlacement: true
      };
    } else if (/tree|forest|plant|nature|jungle/i.test(p)) {
      hero = {
        id: 'hero_tree',
        name: 'Botanical Canopy Tree',
        category: 'vegetation',
        description: 'Detailed branching trunk with rich foliage canopy and root flare',
        importance: 'hero',
        estimatedDimensions: [5.0, 5.0, 8.0],
        materials: ['bark_pbr', 'leaf_translucent'],
        groundPlacement: true
      };
    } else if (/chair|armchair|stool|seat|bench/i.test(p)) {
      hero = {
        id: 'hero_chair',
        name: 'Ergonomic Wooden Chair',
        category: 'furniture',
        description: 'Timber frame chair with upholstered seat cushion, curved backrest and tapered legs',
        importance: 'hero',
        estimatedDimensions: [0.6, 0.6, 0.95],
        materials: ['oak_wood', 'fabric_cushion', 'dark_steel'],
        groundPlacement: true
      };
    } else if (/desk|office\s*desk|table/i.test(p)) {
      hero = {
        id: 'hero_desk',
        name: 'Executive Office Desk',
        category: 'furniture',
        description: 'Solid walnut executive desk with 3 stacked drawers, aluminum pull handles and steel frame',
        importance: 'hero',
        estimatedDimensions: [1.6, 0.8, 0.76],
        materials: ['walnut_timber', 'powdercoated_steel', 'brushed_aluminum'],
        groundPlacement: true
      };
    } else if (/phone|smartphone|mobile|iphone|android/i.test(p)) {
      hero = {
        id: 'hero_phone',
        name: 'Sleek Titanium Smartphone',
        category: 'electronics',
        description: 'Unibody titanium smartphone with edge-to-edge OLED display and triple camera island',
        importance: 'hero',
        estimatedDimensions: [0.08, 0.02, 0.16],
        materials: ['titanium_frame', 'oled_screen', 'camera_optics'],
        groundPlacement: true
      };
    } else if (/computer|desktop(\s*computer)?|pc|tower|monitor/i.test(p)) {
      hero = {
        id: 'hero_computer',
        name: 'Desktop Computer Workstation',
        category: 'electronics',
        description: 'Workstation setup with mid-tower PC chassis, widescreen display monitor and keyboard',
        importance: 'hero',
        estimatedDimensions: [1.2, 0.8, 0.65],
        materials: ['powdercoated_steel', 'tempered_glass', 'monitor_display', 'brushed_aluminum'],
        groundPlacement: true
      };
    } else if (/house|home|cottage|cabin|villa|residence/i.test(p)) {
      hero = {
        id: 'hero_house',
        name: 'Small Contemporary House',
        category: 'architecture',
        description: 'Gabled contemporary house with weatherboard siding, shingled roof, front door and windows',
        importance: 'hero',
        estimatedDimensions: [6.0, 8.0, 5.5],
        materials: ['wall_siding', 'roof_shingles', 'window_glass', 'timber_trim', 'chimney_brick'],
        groundPlacement: true
      };
    } else if (/airplane|aeroplane|aircraft|airliner|boeing|jet/i.test(p)) {
      hero = {
        id: 'hero_airplane',
        name: 'Commercial Passenger Airliner',
        category: 'vehicle',
        description: 'Streamlined airliner with swept cantilever wings, twin turbofan jet engines and landing gear',
        importance: 'hero',
        estimatedDimensions: [28.0, 32.0, 8.5],
        materials: ['polished_aluminum', 'fuselage_livery', 'turbine_titanium', 'cockpit_glass'],
        groundPlacement: true
      };
    }

    // 2. Detect Environment & Surface
    let envType = 'urban_street';
    let baseSurface = 'wet_asphalt';
    let secondaryProps = ['curbs', 'street_lights', 'puddles'];

    if (hero.category === 'furniture' || hero.category === 'electronics' || /studio|showroom|commercial|indoor|interior|room|stage|chair|desk|table|phone|computer/i.test(p)) {
      envType = 'studio_interior';
      baseSurface = 'neutral_charcoal_floor';
      secondaryProps = ['studio_cyclorama', 'softbox_rig'];
    } else if (/forest|jungle|river|mountain|trees|woods/i.test(p)) {
      envType = 'forest_nature';
      baseSurface = 'mossy_soil';
      secondaryProps = ['river_stream', 'rocks', 'ferns', 'canopy_trees'];
    } else if (/temple|ancient|ruins|castle|fortress/i.test(p)) {
      envType = 'temple_sacred';
      baseSurface = 'ancient_stone_tiles';
      secondaryProps = ['stone_pillars', 'incense_smoke', 'torches', 'steps'];
    }

    // 3. Detect Weather & Atmosphere
    const isStudio = envType === 'studio_interior';
    const isRain = !isStudio && /rain|wet|puddle|water|shower|storm/i.test(p);
    const isFog = !isStudio && /fog|mist|smoke|haze|atmospheric/i.test(p);
    const isNight = !isStudio && (/night|dark|midnight|moon|evening/i.test(p) || !/day|noon|sunrise|morning/i.test(p));

    let precip = 'none';
    if (isRain) precip = 'rain';
    else if (/snow|blizzard/i.test(p)) precip = 'snow';
    else if (/mist/i.test(p)) precip = 'mist';

    return {
      taskType: 'create_world',
      visualFidelity: 'photorealistic',
      summary: `Autonomous 3D build for: ${prompt}`,
      heroEntities: [hero],
      environment: {
        type: envType,
        baseSurface,
        secondaryProps
      },
      weather: {
        precipitation: precip,
        puddles: isRain,
        wetReflections: isRain,
        fogDensity: isFog ? 0.04 : (isStudio ? 0.0001 : 0.015)
      },
      timeOfDay: isStudio ? 'studio' : (isNight ? 'night' : 'golden_hour'),
      lighting: {
        primaryType: isStudio ? 'studio_3point' : (isNight ? 'streetlights' : 'sun'),
        mood: isStudio ? 'studio_commercial' : 'moody_contrast',
        colors: isStudio ? ['soft_neutral', 'warm_accent'] : (isNight ? ['cyan', 'amber', 'deep_navy'] : ['warm_amber', 'golden_white'])
      },
      cinematography: {
        lensFocalLength: 35,
        cameraAngle: 'low_angle_hero',
        enableDoF: true,
        apertureFStop: 1.8
      },
      constraints: ['ground contact zero penetration', 'PBR specular reflection', 'cinematic framing']
    };
  }
}

module.exports = { IntentInterpreter };
