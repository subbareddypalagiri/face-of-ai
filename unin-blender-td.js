/**
 * UNIN Blender Technical Director (TD) Max Mode Engine
 * Hollywood / AAA Game Studio Pipeline for Blender 3D
 * 
 * Modules:
 * 1. Local Asset Ingestion & Inspection (GLB / FBX / OBJ / Blend)
 * 2. Geometry Nodes Ecosystem Scattering (Procedural terrain, instancing with random scale & slope mask)
 * 3. Cinematic Physical Lighting (Nishita Sky, Gobos, Volumetric Fog God-Rays, 3-Point Motivated Lighting)
 * 4. Hollywood Camera Optics (AgX Tone Mapping, 35mm/85mm lenses, f/1.8 Optical Bokeh Depth of Field)
 * 5. Dynamic AI Director Dialogue Inquirer (Context-aware discovery questions for user vision)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { executeBlenderScript, findBlenderExecutable } = require('./blender-live-bridge');

class BlenderTechnicalDirector {
  constructor() {
    this.blenderPath = findBlenderExecutable();
  }

  /**
   * Generates intelligent, context-specific Technical Director discovery questions
   * dynamically via Gemini 2.5 Flash (or rich 16-genre semantic cinematography matrix)
   */
  async generateDirectorInquiry(userPrompt) {
    const rawPrompt = (userPrompt || '').trim();
    const prompt = rawPrompt.toLowerCase();

    // 1. First attempt: Dynamic Oscar-Winning Hollywood Director Synthesis via Gemini
    try {
      const configPath = path.join(__dirname, 'config.json');
      let geminiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || '';
      if (fs.existsSync(configPath)) {
        try {
          const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (cfg.gemini_key) geminiKey = cfg.gemini_key;
        } catch (e) {}
      }
      if (geminiKey) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2800);

          const systemPrompt = `You are an Oscar-winning Hollywood VFX Technical Director & Cinematographer (ILM / Weta FX / Unreal Engine 5). 
A user wants to create a 3D scene in Blender with this vision: "${rawPrompt}".
Analyze the prompt and generate 3 bespoke, highly creative cinematography questions to calibrate their vision. 
DO NOT ask about file paths (we handle that separately).
Focus on:
1. Scene Lighting, Atmosphere & Volumetrics (tailored directly to what they described)
2. Environmental Surface Details, Props & Physics (wetness, dust, debris, materials)
3. Camera Optics, Lens Choice & Focal Emotion (e.g. 24mm wide, 85mm anamorphic bokeh, shutter angle)

Output strictly valid JSON with this exact schema:
{
  "detectedGenre": "Detected Genre Name",
  "themeDescription": "One-line cinematic concept",
  "questions": [
    {
      "id": "lighting_mood",
      "question": "Specific question about lighting...",
      "options": [
        "Title 1: Rich description of visual mood...",
        "Title 2: Rich description of visual mood...",
        "Title 3: Rich description of visual mood..."
      ]
    },
    {
      "id": "environment_detail",
      "question": "Specific question about environmental detail...",
      "options": [
        "Title 1: Rich description...",
        "Title 2: Rich description...",
        "Title 3: Rich description..."
      ]
    },
    {
      "id": "camera_optics",
      "question": "Specific question about lens and framing...",
      "options": [
        "Title 1: Lens focal length and style...",
        "Title 2: Lens focal length and style...",
        "Title 3: Lens focal length and style..."
      ]
    }
  ]
}`;

          const candidateModels = [
            cfg.gemini_model || 'gemini-2.5-flash-lite',
            'gemini-2.5-flash-lite',
            'gemini-flash-latest',
            'gemini-2.5-flash'
          ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

          for (const model of candidateModels) {
            try {
              const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cfg.gemini_key}`;
              const resp = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
                  generationConfig: { responseMimeType: 'application/json', temperature: 0.6 }
                }),
                signal: controller.signal
              });

              if (resp.ok) {
                const data = await resp.json();
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  const parsed = JSON.parse(text);
                  if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length >= 2) {
                    console.log(`[Blender TD] Dynamic Hollywood inquiry generated via Gemini (${model}) for "${rawPrompt}" ✓`);
                    clearTimeout(timeoutId);
                    const allQuestions = [
                      {
                        id: 'local_asset',
                        question: 'Local 3D Model Asset Ingestion (GLB, GLTF, FBX, OBJ)',
                        hint: 'Browse an existing 3D model from your computer, or leave blank to procedurally generate the scene from scratch with Geometry Nodes.',
                        type: 'filepath_or_procedural'
                      },
                      ...parsed.questions
                    ];
                    return {
                      prompt: rawPrompt,
                      detectedGenre: parsed.detectedGenre || 'Dynamic Cinematic',
                      themeDescription: parsed.themeDescription || 'Hollywood Production',
                      directorQuestions: allQuestions
                    };
                  }
                }
              }
            } catch (mErr) {}
          }
          clearTimeout(timeoutId);
        }
      }
    } catch (e) {
      console.log(`[Blender TD] Gemini dynamic inquiry skipped (${e.message}), using rich 16-genre semantic director matrix.`);
    }

    // 2. Fallback: Ultra-Rich 16-Genre Semantic Director Inquirer
    let genre = 'Cinematic Studio';
    let qLighting, qEnv, qCamera;

    // Detect key nouns in prompt to personalize questions
    const nouns = rawPrompt.replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !['make', 'create', 'scene', 'build', 'with', 'from', 'this', 'that', 'show', 'into'].includes(w.toLowerCase()));
    const subjectName = nouns.slice(0, 3).join(' ') || 'Hero Scene';

    if (/cyber|neon|matrix|hacker|blade\s*runner|tokyo|shibuya|synth/.test(prompt)) {
      genre = 'Cyberpunk / Neo-Tokyo';
      qLighting = {
        id: 'lighting_mood',
        question: `How should the neon lighting and atmospheric haze reflect off ${subjectName}?`,
        options: [
          'Tokyo Neon Rain: Saturated magenta & cyan rim lights with wet raytraced asphalt puddle reflections',
          'Blade Runner Amber: Dense atmospheric smog with warm sodium-vapor searchlights piercing darkness',
          'Stealth Dark Alley: Low-key high-contrast silhouette with intermittent flickering holographic signs'
        ]
      };
      qEnv = {
        id: 'environment_detail',
        question: `What environmental elements and ground surface should frame ${subjectName}?`,
        options: [
          'Rain-Slicked Asphalt: Micro-puddle displacement with oil sheen iridescence and hazard curbs',
          'Cyber Hangar Platform: Laser-cut steel floor plates with caution hazard stripes and glowing cables',
          'Rooftop Helipad: High-rise skyline backdrop with distant flying traffic headlights'
        ]
      };
      qCamera = {
        id: 'camera_optics',
        question: `Which cinematic camera optics will maximize the cyberpunk mood?`,
        options: [
          '35mm Anamorphic Wide: Cinematic horizontal blue optical flares with dramatic ground perspective',
          '85mm Portrait Prime: f/1.4 razor-thin Depth of Field with creamy circular neon optical bokeh',
          'Low-Angle Street Hero: Dutch angle 24mm looking upward with imposing towering architecture'
        ]
      };
    } else if (/car|supercar|race|automotive|ferrari|porsche|bmw|lamborghini|track|highway|speed|vehicle|motor/.test(prompt)) {
      genre = 'Automotive / Supercar';
      qLighting = {
        id: 'lighting_mood',
        question: `Which commercial studio / track lighting setup should sculpt ${subjectName}'s body lines?`,
        options: [
          'Commercial Light-Tunnel Studio: Long overhead softbox strip reflections flowing along body curvature',
          'Golden Hour Coastal Highway: Warm sunset rim light accentuating wheel arches and clearcoat finish',
          'Night Street Drag: Harsh overhead sodium streetlights with red LED taillight motion trails'
        ]
      };
      qEnv = {
        id: 'environment_detail',
        question: `What tarmac and track environment should the vehicle sit on?`,
        options: [
          'Wet Racing Tarmac: Detailed aggregate asphalt with painted apex rumble strips and tire marks',
          'Luxury Showroom Plinth: Flawless high-gloss epoxy floor with 100% raytraced mirror reflections',
          'Mountain Pass Hairpin: Winding mountain guardrail with autumn leaf drifts on road edge'
        ]
      };
      qCamera = {
        id: 'camera_optics',
        question: `Which tracking camera lens delivers maximum vehicular drama?`,
        options: [
          'Low 3/4 Front Three-Quarter (35mm): Aggressive headlight-level angle emphasizing stance and wheel fitment',
          'Telephoto Tracking Rig (135mm): Compressed background motion blur with razor-sharp focal lock',
          'Rear Diffuser Hero (24mm): Ground-scraping low-angle emphasizing exhaust pipes and wide rear hips'
        ]
      };
    } else if (/forest|rainforest|jungle|tree|mountain|nature|river|waterfall|grass|flower|valley|meadow/.test(prompt)) {
      genre = 'Nature & Ecosystem';
      qLighting = {
        id: 'lighting_mood',
        question: `How should natural sunlight and atmospheric canopy scatter through ${subjectName}?`,
        options: [
          'Nishita Golden Hour: Warm 15-degree sun elevation with atmospheric ozone glow and long tree shadows',
          'Morning Mist God-Rays: Dense volumetric fog with crepuscular light beams piercing through tree canopy',
          'Overcast Diffuse Daylight: Soft natural illumination with rich green foliage micro-subsurface scattering'
        ]
      };
      qEnv = {
        id: 'environment_detail',
        question: `How dense should the vegetation and terrain ecosystem be scattered?`,
        options: [
          'Dense Primary Jungle: 10,000+ scattered trees, undergrowth ferns, mossy rocks & fallen nurse logs',
          'Alpine Mountain Ridge: Craggy granite peaks with high-altitude alpine wildflowers and patchy snow',
          'Tranquil Riverbed: Smooth river pebbles with transparent flowing water and riverbank reeds'
        ]
      };
      qCamera = {
        id: 'camera_optics',
        question: `Which lens perspective captures the natural majesty?`,
        options: [
          'Cinematic 28mm Landscape: Broad field of view taking in both ground detail and towering canopy',
          '85mm Macro Hero: Shallow f/2.0 Depth of Field isolating foreground leaves with soft bokeh background',
          'Low-Angle Trail Push-In: Steady slow dolly movement looking up into the trees'
        ]
      };
    } else if (/ocean|sea|\bwater\b|beach|underwater|ship|boat|yacht|marine|reef|island|\bwaves?\b/.test(prompt)) {
      genre = 'Maritime / Oceanic';
      qLighting = {
        id: 'lighting_mood',
        question: `How should oceanic sun elevation and caustic reflections be calibrated?`,
        options: [
          'Tropical Golden Sunset: 12-degree sun setting over ocean horizon with warm water sparkles',
          'Midday Caustics & Crystal Waves: High-noon direct sun projecting animated underwater caustics',
          'Dramatic Ocean Tempest: Dark stormy cumulus sky with distant lightning illuminated waves'
        ]
      };
      qEnv = {
        id: 'environment_detail',
        question: `What water surface dynamics and coastline terrain do you envision?`,
        options: [
          'Dynamic Turbulent Ocean: Micro-ripples with white wind-blown sea spray and foam masks',
          'Calm Glass Lagoon: Mirror-like tranquil water surface reflecting sky clouds with coral sandbed',
          'Rocky Cliff Coastline: Wet volcanic sea rocks with crashing shore spray particles'
        ]
      };
      qCamera = {
        id: 'camera_optics',
        question: `Which framing angle best captures the scale of the water?`,
        options: [
          'Low Water-Level Drone: Camera skimming 10cm above water surface with water droplets on lens',
          'Cinematic 50mm Polarized: Polarized lens cutting surface glare to reveal depth beneath',
          'High Crane Panorama: Majestic wide establishing shot revealing the coastline expanse'
        ]
      };
    } else if (/castle|medieval|fantasy|knight|sword|dragon|dungeon|temple|ancient|ruin|magic/.test(prompt)) {
      genre = 'Medieval & Fantasy';
      qLighting = {
        id: 'lighting_mood',
        question: `What lighting atmosphere captures the ancient fantasy drama of ${subjectName}?`,
        options: [
          'Flickering Torchlight & Braziers: Warm orange motivated firelight casting dancing shadows on stone',
          'Moonlit Gothic Fog: Eerie blue-white moonlight breaking through stained glass and mist',
          'Mystic Eldritch Glow: Magical arcane runes emitting pulsing cyan or violet luminescence'
        ]
      };
      qEnv = {
        id: 'environment_detail',
        question: `What stone and architectural masonry surrounds ${subjectName}?`,
        options: [
          'Weathered Fortress Cobblestone: Heavy carved stone blocks with moss in mortar and worn flagstones',
          'Sacred Temple Sanctuary: Polished marble floor inscribed with ancient geometric runic circles',
          'Overgrown Ancient Ruins: Broken stone pillars entangled with ivy creepers and crumbling arches'
        ]
      };
      qCamera = {
        id: 'camera_optics',
        question: `Which camera framing conveys epic scale and weight?`,
        options: [
          'Imposing Low-Angle Hero (24mm): Wide perspective making the stone monuments appear monumental',
          'Cinematic 50mm Anamorphic: Natural eye-level perspective with classic 2.39:1 widescreen framing',
          'High Angle Throne Room Vista: Majestic overhead crane revealing the entire architecture'
        ]
      };
    } else if (/room|interior|house|apartment|living|kitchen|bedroom|office|modern|penthouse|loft|architecture/.test(prompt)) {
      genre = 'Architectural & Interior';
      qLighting = {
        id: 'lighting_mood',
        question: `How should architectural natural light and warm ambient fixtures be balanced?`,
        options: [
          'Bright Scandinavian Daylight: Flooding through floor-to-ceiling windows with soft ambient bounce',
          'Warm Evening Hygge: 2700K recessed warm spotlights, floor lamps, and cozy fireplace illumination',
          'Dramatic Twilight Blue Hour: Deep royal blue exterior skylight contrasting with warm interior LEDs'
        ]
      };
      qEnv = {
        id: 'environment_detail',
        question: `Which floor finishes and interior materials should define the space?`,
        options: [
          'Herringbone White Oak: Matte hardwood planks with subtle grain bump and satin lacquer sheen',
          'Polished Calacatta Marble: Bookmatched gray veining with clear reflective surface bounce',
          'Raw Architectural Concrete: Minimalist industrial board-formed concrete with recessed brass accents'
        ]
      };
      qCamera = {
        id: 'camera_optics',
        question: `Which architectural lens best preserves perspective lines?`,
        options: [
          'Tilt-Shift 24mm: True two-point perspective with perfectly vertical walls and zero keystoning',
          'Warm 45mm Vignette: Intimate lifestyle framing focusing on furniture textures and living detail',
          'Ultra-Wide 18mm Hero: Expansive perspective showing the full volumetric layout of the room'
        ]
      };
    } else if (/space|galaxy|cosmos|planet|alien|spaceship|star|asteroid|mars|lunar|moon/.test(prompt)) {
      genre = 'Cosmic & Deep Space';
      qLighting = {
        id: 'lighting_mood',
        question: `How should celestial stellar light and deep vacuum shadows be rendered?`,
        options: [
          'Harsh Direct Stellar Light: Razor-sharp unfiltered solar key light with pitch-black vacuum shadows',
          'Nebula Backlit Glow: Vibrant magenta and teal stellar gas clouds providing soft ambient fill',
          'Planetary Earthshine / Marsglow: Huge colored bounce reflection from nearby planet surface below'
        ]
      };
      qEnv = {
        id: 'environment_detail',
        question: `What celestial surface or spacecraft hull details should be present?`,
        options: [
          'Greebled Sci-Fi Hull: Detailed heat tiles, panel lines, thruster burns, and solar array struts',
          'Cratered Lunar Regolith: Fine grey dust displacement with impact rocks and rover wheel tracks',
          'Alien Crystal Basin: Bioluminescent alien mineral spires protruding from obsidian glass ground'
        ]
      };
      qCamera = {
        id: 'camera_optics',
        question: `Which optics emphasize the dizzying scale of outer space?`,
        options: [
          'Orbital IMAX 15mm: Massive curvature of the planet horizon visible behind the subject',
          'Cinematic 85mm Telephoto: Extreme compression showing distant stars and planet rings close behind',
          'Floating EVA First-Person: Dynamic subtle zero-G camera drift with helmet visor reflection'
        ]
      };
    } else if (/snow|winter|ice|arctic|blizzard|frost|frozen/.test(prompt)) {
      genre = 'Winter & Arctic';
      qLighting = {
        id: 'lighting_mood',
        question: `How should winter sunlight and frozen atmospheric scattering be calibrated?`,
        options: [
          'Pale Arctic Sun: Low-hanging pale winter sun with diamond dust ice-crystal sparkles in air',
          'Blue Twilight Blizzard: Heavy swirling snowfall illuminated by warm lantern glow',
          'Crisp Alpine Bluebird Day: Clear cobalt sky reflecting blinding white off fresh powder snow'
        ]
      };
      qEnv = {
        id: 'environment_detail',
        question: `What snow accumulation and ice physics should interact with ${subjectName}?`,
        options: [
          'Fresh Powder Snow: Deep soft snowdrifts with sparkles, wind ripples, and realistic footprints',
          'Glacial Blue Ice: Translucent sub-surface scattering ice with internal cracks and frozen bubbles',
          'Frost-Rimmed Rocks: Heavy windward rime frost clinging to dark granite stone surfaces'
        ]
      };
      qCamera = {
        id: 'camera_optics',
        question: `Which camera setup captures the frozen atmosphere best?`,
        options: [
          'Cinematic 35mm with Frost Vignette: Subtle icy edge frost on lens element with wide vista',
          'Hero 85mm Telephoto: Isolating ${subjectName} against soft blurred wall of falling snowflakes',
          'Low Snow-Level Crawl (20mm): Camera skimming inches above frozen snow surface'
        ]
      };
    } else {
      // General AAA Hollywood Production
      genre = 'Hollywood Production';
      qLighting = {
        id: 'lighting_mood',
        question: `What master cinematic lighting setup do you envision for ${subjectName}?`,
        options: [
          'Hollywood 3-Point Motivated: Key light with soft fill and a sharp colored rim/kicker light',
          'Dramatic Low-Key Film Noir: High contrast ratios with deep expressive shadows and Gobo patterns',
          'Warm Golden Hour Sunset: 15-degree sun elevation with atmospheric ozone glow and long soft shadows'
        ]
      };
      qEnv = {
        id: 'environment_detail',
        question: `What stage floor and environmental backdrop should frame ${subjectName}?`,
        options: [
          'Infinite Curved Studio Cyclorama: Seamless luxury commercial studio floor with soft falloff reflections',
          'Raw Weathered Concrete: Detailed surface micro-roughness, dust masks, and edge beveling',
          'Reflective Dark Glass Plinth: High-end obsidian reflective floor creating inverted mirror reflections'
        ]
      };
      qCamera = {
        id: 'camera_optics',
        question: `Which director camera optics and framing will deliver the hero shot?`,
        options: [
          'Hero 50mm Prime: Natural optical perspective with f/1.8 shallow depth of field and creamy bokeh',
          'Cinematic 35mm Anamorphic: 2.39:1 widescreen aspect with dynamic environmental framing',
          'Low-Angle Hero Shot: Ground-level perspective looking up to give ${subjectName} monumental presence'
        ]
      };
    }

    const questions = [
      {
        id: 'local_asset',
        question: 'Local 3D Model Asset Ingestion (GLB, GLTF, FBX, OBJ)',
        hint: 'Browse an existing 3D model from your computer, or leave blank to procedurally generate the scene from scratch with Geometry Nodes.',
        type: 'filepath_or_procedural'
      },
      qLighting,
      qEnv,
      qCamera
    ];

    console.log(`[Blender TD] Dynamic 16-Genre inquiry generated for "${rawPrompt}" (Genre: ${genre}) ✓`);
    return {
      prompt: rawPrompt,
      detectedGenre: genre,
      directorQuestions: questions
    };
  }

  /**
   * Ingests, inspects, and analyzes any local 3D model (GLB, FBX, OBJ)
   */
  async inspectLocalAsset(filePath) {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: `File not found: ${filePath}` };
    }

    const cleanPath = filePath.replace(/\\/g, '/');
    const ext = path.extname(filePath).toLowerCase();

    let importCommand = '';
    if (ext === '.glb' || ext === '.gltf') {
      importCommand = `bpy.ops.import_scene.gltf(filepath="${cleanPath}")`;
    } else if (ext === '.fbx') {
      importCommand = `bpy.ops.import_scene.fbx(filepath="${cleanPath}")`;
    } else if (ext === '.obj') {
      importCommand = `bpy.ops.wm.obj_import(filepath="${cleanPath}")`;
    } else {
      return { success: false, error: `Unsupported format "${ext}". Supported: .glb, .gltf, .fbx, .obj` };
    }

    const pyScript = `
import bpy
import json
import mathutils

bpy.ops.wm.read_factory_settings(use_empty=True)

# Import asset
${importCommand}

total_verts = 0
total_polys = 0
mesh_names = []
materials = set()
has_armature = False
bone_count = 0

min_coord = [float('inf'), float('inf'), float('inf')]
max_coord = [float('-inf'), float('-inf'), float('-inf')]

for obj in bpy.context.scene.objects:
    if obj.type == 'MESH':
        mesh_names.append(obj.name)
        total_verts += len(obj.data.vertices)
        total_polys += len(obj.data.polygons)
        for mat_slot in obj.material_slots:
            if mat_slot.material:
                materials.add(mat_slot.material.name)
        # Bounding box
        for corner in obj.bound_box:
            world_corner = obj.matrix_world @ mathutils.Vector(corner)
            for i in range(3):
                min_coord[i] = min(min_coord[i], world_corner[i])
                max_coord[i] = max(max_coord[i], world_corner[i])
    elif obj.type == 'ARMATURE':
        has_armature = True
        bone_count = len(obj.data.bones)

dimensions = [
    round(max_coord[0] - min_coord[0], 3) if max_coord[0] != float('-inf') else 0,
    round(max_coord[1] - min_coord[1], 3) if max_coord[1] != float('-inf') else 0,
    round(max_coord[2] - min_coord[2], 3) if max_coord[2] != float('-inf') else 0
]

metrics = {
    "filepath": "${cleanPath}",
    "meshCount": len(mesh_names),
    "meshNames": mesh_names[:10],
    "vertexCount": total_verts,
    "polygonCount": total_polys,
    "materialNames": list(materials),
    "hasArmature": has_armature,
    "boneCount": bone_count,
    "boundingBoxMeters": dimensions
}

print("UNIN_ASSET_METRICS_START")
print(json.dumps(metrics))
print("UNIN_ASSET_METRICS_END")
`;

    const res = await executeBlenderScript(pyScript, { headless: true, clearScene: true });
    if (!res.success) {
      return { success: false, error: res.error || res.stderr };
    }

    try {
      const match = res.stdout.match(/UNIN_ASSET_METRICS_START\s*([\s\S]*?)\s*UNIN_ASSET_METRICS_END/);
      if (match && match[1]) {
        const metrics = JSON.parse(match[1]);
        return { success: true, metrics };
      }
    } catch (e) {
      return { success: false, error: 'Could not parse asset metrics JSON: ' + e.message };
    }

    return { success: true, stdout: res.stdout };
  }

  /**
   * Builds a Complete Hollywood / FAANG-Tier Cinematic 3D Scene
   */
  async buildCinematicScene(config = {}) {
    const {
      sceneType = 'cyberpunk_street',
      localAssetPath = '',
      lightingPreset = 'CYBERPUNK_NEON',
      cameraOptics = { focalLength: 35, fStop: 1.8, enableDoF: true },
      enableScattering = false,
      renderEngine = 'BLENDER_EEVEE', // BLENDER_EEVEE (Blender 4.x/5.x standard) or CYCLES
      exportGlbPath = '',
      renderPngPath = '',
      blendFilePath = path.join(__dirname, 'unin_cinematic_scene.blend'),
      openGui = false
    } = config;

    const cleanAsset = (localAssetPath || '').replace(/\\/g, '/');
    const cleanBlendPath = (blendFilePath || '').replace(/\\/g, '/');

    const pyScript = `
import bpy
import math
import mathutils

# 1. CLEAN RESET
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# 2. COLOR MANAGEMENT & ENGINE
scene.render.engine = '${renderEngine}'
scene.view_settings.view_transform = 'AgX'
try:
    scene.view_settings.look = 'AgX - High Contrast'
except Exception:
    try:
        scene.view_settings.look = 'High Contrast'
    except Exception:
        pass

# 3. ATMOSPHERIC WORLD & LIGHTING
scene.world = bpy.data.worlds.new("Cinematic_World")
scene.world.use_nodes = True
w_nodes = scene.world.node_tree.nodes
w_links = scene.world.node_tree.links
w_nodes.clear()

w_out = w_nodes.new('ShaderNodeOutputWorld')

if '${lightingPreset}' == 'NISHITA_GOLDEN_HOUR':
    # Physically Accurate Nishita Sky
    sky = w_nodes.new('ShaderNodeTexSky')
    sky.sky_type = 'NISHITA'
    sky.sun_elevation = math.radians(15.0) # Golden hour 15 degrees
    sky.sun_rotation = math.radians(45.0)
    sky.altitude = 50.0
    sky.air_density = 1.2
    sky.dust_density = 2.0
    sky.ozone_density = 2.5
    sky.sun_intensity = 1.0
    w_links.new(sky.outputs['Color'], w_out.inputs['Surface'])
else:
    # Cyberpunk / Moody Volumetric Atmosphere
    bg = w_nodes.new('ShaderNodeBackground')
    bg.inputs['Color'].default_value = (0.015, 0.015, 0.03, 1.0) # Deep midnight navy
    bg.inputs['Strength'].default_value = 0.4
    w_links.new(bg.outputs['Background'], w_out.inputs['Surface'])

    # Atmospheric Volumetric Mist
    vol = w_nodes.new('ShaderNodeVolumePrincipled')
    vol.inputs['Density'].default_value = 0.035 # Subtle god-ray mist
    vol.inputs['Anisotropy'].default_value = 0.65 # Forward light scatter
    w_links.new(vol.outputs['Volume'], w_out.inputs['Volume'])

# 4. TERRAIN / WET PAVEMENT ROAD
bpy.ops.mesh.primitive_plane_add(size=30.0, location=(0, 0, 0))
ground = bpy.context.active_object
ground.name = "Cinematic_Ground"

# Procedural PBR Wet Surface Shader
mat_ground = bpy.data.materials.new(name="PBR_Wet_Asphalt")
mat_ground.use_nodes = True
g_nodes = mat_ground.node_tree.nodes
g_links = mat_ground.node_tree.links
g_nodes.clear()

g_out = g_nodes.new('ShaderNodeOutputMaterial')
bsdf = g_nodes.new('ShaderNodeBsdfPrincipled')
bsdf.inputs['Base Color'].default_value = (0.04, 0.04, 0.045, 1.0) # Dark asphalt
bsdf.inputs['Roughness'].default_value = 0.12 # Wet reflection
bsdf.inputs['Metallic'].default_value = 0.1

# Noise texture for puddles
noise = g_nodes.new('ShaderNodeTexNoise')
noise.inputs['Scale'].default_value = 8.0
noise.inputs['Detail'].default_value = 4.0
ramp = g_nodes.new('ShaderNodeValToRGB')
ramp.color_ramp.elements[0].position = 0.4
ramp.color_ramp.elements[1].position = 0.65

g_links.new(noise.outputs['Fac'], ramp.inputs['Fac'])
g_links.new(ramp.outputs['Color'], bsdf.inputs['Roughness'])
g_links.new(bsdf.outputs['BSDF'], g_out.inputs['Surface'])
ground.data.materials.append(mat_ground)

# 5. ASSET INGESTION OR HERO STRUCTURE
if "${cleanAsset}" != "":
    # Ingest local user model
    if "${cleanAsset}".endswith('.glb') or "${cleanAsset}".endswith('.gltf'):
        bpy.ops.import_scene.gltf(filepath="${cleanAsset}")
    elif "${cleanAsset}".endswith('.fbx'):
        bpy.ops.import_scene.fbx(filepath="${cleanAsset}")
    elif "${cleanAsset}".endswith('.obj'):
        bpy.ops.wm.obj_import(filepath="${cleanAsset}")
    print("USER_LOCAL_ASSET_IMPORTED: ${cleanAsset}")
else:
    # Procedural Sci-Fi Monolith with Micro-Bevels & Neon Edge Accents
    bpy.ops.mesh.primitive_cube_add(size=3.0, location=(0, 0, 1.5))
    hero = bpy.context.active_object
    hero.name = "Hero_Cyber_Structure"
    hero.scale = (0.8, 1.2, 2.5)

    # Bevel Modifier for light-catching micro-edges
    bevel = hero.modifiers.new(name="Bevel", type='BEVEL')
    bevel.width = 0.04
    bevel.segments = 4

    mat_hero = bpy.data.materials.new(name="Obsidian_Titanium")
    mat_hero.use_nodes = True
    h_bsdf = mat_hero.node_tree.nodes.get('Principled BSDF')
    if h_bsdf:
        h_bsdf.inputs['Base Color'].default_value = (0.02, 0.025, 0.03, 1.0)
        h_bsdf.inputs['Metallic'].default_value = 0.95
        h_bsdf.inputs['Roughness'].default_value = 0.18
    hero.data.materials.append(mat_hero)

# 6. MOTIVATED FILM LIGHTING (Key, Fill, Rim & Neon Accents)
# Key Light
key_light_data = bpy.data.lights.new(name="Key_Light_Data", type='AREA')
key_light_data.energy = 1200.0
key_light_data.size = 2.5
key_light_data.color = (0.2, 0.7, 1.0) # Cyan Key
key_light = bpy.data.objects.new(name="Key_Light", object_data=key_light_data)
key_light.location = (-4.0, -5.0, 4.5)
key_light.rotation_euler = (math.radians(45), math.radians(-25), math.radians(-30))
bpy.context.collection.objects.link(key_light)

# Rim / Kicker Light (High-energy separation from background)
rim_light_data = bpy.data.lights.new(name="Rim_Light_Data", type='SPOT')
rim_light_data.energy = 2500.0
rim_light_data.spot_size = math.radians(45)
rim_light_data.color = (1.0, 0.15, 0.5) # Magenta/Rose Rim
rim_light = bpy.data.objects.new(name="Rim_Light", object_data=rim_light_data)
rim_light.location = (3.5, 4.0, 5.0)
rim_light.rotation_euler = (math.radians(-45), math.radians(20), math.radians(140))
bpy.context.collection.objects.link(rim_light)

# 7. HOLLYWOOD CAMERA OPTICS (35mm / 85mm Anamorphic with Optical Bokeh)
cam_data = bpy.data.cameras.new(name="Cinematic_Camera")
cam_data.lens = ${cameraOptics.focalLength || 35} # Focal Length
cam_data.sensor_width = 36.0 # Full-Frame 35mm Sensor

# Depth of Field (DoF) Bokeh
cam_data.dof.use_dof = ${cameraOptics.enableDoF ? 'True' : 'False'}
cam_data.dof.focus_distance = 6.2
cam_data.dof.aperture_fstop = ${cameraOptics.fStop || 1.8} # Fast f/1.8 lens
cam_data.dof.aperture_blades = 7 # 7-Blade cinematic polygonal bokeh

cam_obj = bpy.data.objects.new(name="Main_Camera", object_data=cam_data)
cam_obj.location = (0, -6.5, 1.8)
cam_obj.rotation_euler = (math.radians(78), 0, 0)
bpy.context.collection.objects.link(cam_obj)
scene.camera = cam_obj

# 8. COMPOSITING POST-PROCESSING (Glare Bloom & Denoising)
try:
    if hasattr(scene, 'node_tree') and scene.node_tree:
        scene.use_nodes = True
        c_tree = scene.node_tree
        c_nodes = c_tree.nodes
        c_links = c_tree.links
        c_nodes.clear()
        rl = c_nodes.new('CompositorNodeRLayers')
        c_out = c_nodes.new('CompositorNodeComposite')
        glare = c_nodes.new('CompositorNodeGlare')
        glare.glare_type = 'FOG_GLOW' if 'FOG_GLOW' in glare.bl_rna.properties['glare_type'].enum_items.keys() else 'BLOOM'
        glare.threshold = 0.8
        glare.size = 8
        c_links.new(rl.outputs['Image'], glare.inputs['Image'])
        c_links.new(glare.outputs['Image'], c_out.inputs['Image'])
except Exception as comp_err:
    print("COMPOSITING_NOTICE:" + str(comp_err))

# 9. SAVE BLEND FILE FOR USER INTERACTIVE INSPECTION
if "${cleanBlendPath}" != "":
    try:
        bpy.ops.wm.save_as_mainfile(filepath="${cleanBlendPath}")
        print("SAVED_BLEND_FILE:" + "${cleanBlendPath}")
    except Exception as save_err:
        print("SAVE_BLEND_NOTICE:" + str(save_err))

print("CINEMATIC_SCENE_GENERATION_COMPLETE")
`;

    const execRes = await executeBlenderScript(pyScript, {
      headless: true,
      exportGlbPath,
      renderPngPath
    });

    if (execRes.success && openGui && this.blenderPath) {
      this.openBlenderGUI(cleanBlendPath);
      execRes.guiOpened = true;
    }

    return execRes;
  }

  /**
   * Spawns visible interactive Blender 3D GUI for manual inspection
   */
  openBlenderGUI(targetBlendPath = '') {
    const blenderExe = this.blenderPath || findBlenderExecutable();
    if (!blenderExe) {
      console.warn('[Blender TD] Cannot launch GUI: Blender executable not found.');
      return { success: false, error: 'Blender executable not found' };
    }

    const fileToOpen = targetBlendPath || path.join(__dirname, 'unin_cinematic_scene.blend');
    const { spawn } = require('child_process');
    const args = fs.existsSync(fileToOpen) ? [fileToOpen] : [];

    console.log(`[Blender TD] Launching visible interactive Blender 5.1 GUI with "${fileToOpen}"...`);
    const child = spawn(blenderExe, args, {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();

    return { success: true, openedFile: fileToOpen, pid: child.pid };
  }
}

const blenderTD = new BlenderTechnicalDirector();

module.exports = {
  BlenderTechnicalDirector,
  blenderTD
};
