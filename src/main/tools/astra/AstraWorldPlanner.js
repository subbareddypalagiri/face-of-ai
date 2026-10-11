// src/main/tools/astra/AstraWorldPlanner.js — Universal Dynamic Astra 3D World Planner
'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('../../../shared/Logger');
const { PRODUCTION_SYSTEM_PROMPT, resolveRegisteredAsset } = require('./AstraProductionGuardrails');
const { getCyberpunkArchetype, getMedievalArchetype } = require('./AstraArchetypes');

function getGeminiConfig() {
  try {
    const configPath = path.join(__dirname, '../../../../config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) {
    logger.warn(`[AstraWorldPlanner] Could not read config.json: ${e.message}`);
  }
  return null;
}

class AstraWorldPlanner {
  constructor(port = 8192) {
    this.port = port;
  }

  /**
   * Plans an autonomous 5-6 Stage Architectural Build for ANY user prompt.
   * Leverages Gemini 2.5 Flash with structured decomposition, with procedural fallback.
   */
  async planWorldStages(userPrompt, sceneState = {}, isNewScene = true) {
    logger.info(`[AstraWorldPlanner] Deconstructing 3D world intent: "${userPrompt}"`);

    const cfg = getGeminiConfig();
    if (cfg && cfg.gemini_key) {
      try {
        const plannedStages = await this._synthesizeStagesWithAI(userPrompt, sceneState, isNewScene, cfg);
        if (plannedStages && plannedStages.length >= 4) {
          logger.info(`[AstraWorldPlanner] Successfully synthesized ${plannedStages.length}-Stage Dynamic Plan via Gemini ✓`);
          return plannedStages;
        }
      } catch (err) {
        logger.warn(`[AstraWorldPlanner] AI Dynamic Planning failed (${err.message}), engaging Universal Archetype Synthesizer...`);
      }
    }

    // Heuristic Archetype Fallback (Guarantees zero downtime)
    return this._generateArchetypePlan(userPrompt, sceneState, isNewScene);
  }

  /**
   * Calls Gemini 2.5 Flash to synthesize staged execution plan with executable bpy code
   */
  async _synthesizeStagesWithAI(userPrompt, sceneState, isNewScene, cfg) {
    const model = cfg.gemini_model || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cfg.gemini_key}`;

    const assetInfo = resolveRegisteredAsset(userPrompt);
    const assetHint = assetInfo
      ? `\nA high-poly 3D scanned asset is available at: "${assetInfo.path}". In Stage 2, import it using bpy.ops.import_scene.gltf(filepath=r"${assetInfo.path}") and scale/position it appropriately.`
      : '';

    const workspaceDir = path.resolve(__dirname, '../../../../').replace(/\\/g, '/');
    const blendPath = `${workspaceDir}/unin_dynamic_scene.blend`;
    const renderPath = `${workspaceDir}/unin_dynamic_render.png`;

    const prompt = `Deconstruct and generate a complete 6-Stage Autonomous 3D Build Plan in Blender 5.1 Python for the user prompt:
"${userPrompt}"

Current scene context: ${sceneState.objectsCount || 0} objects in scene.
isNewScene: ${isNewScene}.${assetHint}

You must return a valid JSON array containing exactly 6 stages. Each stage has:
- "number": integer (1 to 6)
- "id": string (stage identifier)
- "title": string (descriptive title)
- "description": string (architectural details)
- "delayMs": integer (suggested delay in ms, e.g. 500)
- "code": string (100% EXECUTABLE Blender 5.1 Python code)

STAGE RESPONSIBILITIES:
- Stage 1 (Foundation): If isNewScene, wipe objects cleanly. Build high-density ground/terrain/floor/street foundation with bevel/subsurf.
- Stage 2 (Hero Geometry): Build or import main focal subject with bevels, smooth shading, and high-detail subdivisions.
- Stage 3 (Secondary Props & Clutter): Scatter secondary objects (foliage, rocks, lamps, crates, particles) with natural noise distribution and clear camera vista.
- Stage 4 (PBR Optics): Assign multi-node procedural PBR shaders (Principled BSDF + procedural noise bump + roughness variations + metallic/specular response).
- Stage 5 (Atmosphere & Lighting): Setup physical sky (ShaderNodeTexSky MULTIPLE_SCATTERING) or studio 3-point key/fill/rim lights, volumetric fog/godrays.
- Stage 6 (Cinematography & Render): Setup camera with appropriate focal lens (24mm panorama, 35mm cinematic, 50mm natural), lock viewport into camera view, save to "${blendPath}", set scene.eevee.taa_render_samples = 16, and render 1080p still to "${renderPath}".

CRITICAL: Return ONLY valid JSON (in a markdown json block: \`\`\`json [ ... ] \`\`\`). No other conversational text.`;

    const reqBody = {
      contents: [{
        parts: [
          { text: PRODUCTION_SYSTEM_PROMPT },
          { text: prompt }
        ]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: "application/json"
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody)
    });

    if (!res.ok) {
      throw new Error(`Gemini API returned status ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Empty candidate response from Gemini API');

    let cleanJson = rawText.trim();
    if (cleanJson.startsWith('```json')) cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
    else if (cleanJson.startsWith('```')) cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();

    try {
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length >= 4) {
        return parsed;
      }
    } catch (parseErr) {
      logger.warn(`[AstraWorldPlanner] Full JSON parse warning (${parseErr.message}), falling back to archetype...`);
      throw parseErr;
    }
    throw new Error('Parsed response does not contain valid stage array');
  }

  /**
   * Universal Procedural Archetype Generator (Offline / High-Fidelity Fallback)
   * Intelligently selects matching archetype: Nature, Urban/Cyberpunk, Sci-Fi/Space, Medieval/Castle, Product/Vehicle
   */
  _generateArchetypePlan(userPrompt, sceneState, isNewScene) {
    const p = (userPrompt || '').toLowerCase();
    const workspaceDir = path.resolve(__dirname, '../../../../').replace(/\\/g, '/');
    const blendPath = `${workspaceDir}/unin_world_scene.blend`;
    const renderPath = `${workspaceDir}/unin_world_render.png`;

    logger.info(`[AstraWorldPlanner] Synthesizing high-fidelity archetype for prompt: "${userPrompt}"`);

    // 1. Nature / Forest / Mountain / River / Waterfall / Island
    if (p.includes('forest') || p.includes('forst') || p.includes('jungle') || p.includes('river') || p.includes('mountain') || p.includes('waterfall') || p.includes('trees') || p.includes('nature') || p.includes('rainbow') || p.includes('woods') || p.includes('adavi')) {
      logger.info('[AstraWorldPlanner] Routing to Nature / Landscape Archetype ✓');
      return this._getUniversalNatureArchetype(userPrompt, blendPath, renderPath, isNewScene);
    }

    // 2. Cyberpunk / Futuristic City / Night Street
    if (p.includes('cyber') || p.includes('neon') || p.includes('tokyo') || p.includes('alley') || p.includes('ramen') || (/\brain\b/i.test(p) && !p.includes('rainbow')) || p.includes('drone')) {
      logger.info('[AstraWorldPlanner] Routing to Cyberpunk / Urban Night Archetype ✓');
      return getCyberpunkArchetype(userPrompt, blendPath, renderPath);
    }

    // 3. Medieval / Fortress / Castle / Temple
    if (p.includes('castle') || p.includes('medieval') || p.includes('fortress') || p.includes('temple') || p.includes('dungeon') || p.includes('ancient') || p.includes('ruins') || p.includes('palace') || p.includes('knight')) {
      logger.info('[AstraWorldPlanner] Routing to Medieval Fortress / Castle Archetype ✓');
      return getMedievalArchetype(userPrompt, blendPath, renderPath);
    }

    // 4. Default Landscape Fallback
    logger.info('[AstraWorldPlanner] Defaulting to Nature / Landscape Archetype ✓');
    return this._getUniversalNatureArchetype(userPrompt, blendPath, renderPath, isNewScene);
  }

  _getUniversalNatureArchetype(userPrompt, blendPath, renderPath, isNewScene) {
    const treeAsset = resolveRegisteredAsset('tree')?.path || '';

    return [
      {
        number: 1,
        id: 'stage_1_geological_terrain',
        title: 'Stage 1: Geological Environment & Elevation Grid',
        description: '64m x 64m multi-octave harmonic landscape grid with carved canyon contours and organic slope variation',
        delayMs: 600,
        code: `
import bpy
import math

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.view_settings.view_transform = 'AgX'
try:
    scene.view_settings.look = 'AgX - High Contrast'
except Exception:
    pass

for obj in list(bpy.context.scene.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

# 64m High-Density Geological Base Grid (10,000+ vertices)
bpy.ops.mesh.primitive_grid_add(x_subdivisions=96, y_subdivisions=96, size=64.0, location=(0, 0, 0))
terrain = bpy.context.view_layer.objects.active
terrain.name = 'Astra_Geological_Terrain'
mesh = terrain.data

for v in mesh.vertices:
    x = v.co.x
    y = v.co.y
    river_x = math.sin(y * 0.16) * 5.0 + math.cos(y * 0.08) * 2.2
    dist_r = abs(x - river_x)
    h_noise = (math.sin(x * 0.22) * math.cos(y * 0.22) * 1.8 +
               math.sin(x * 0.48 + y * 0.36) * 0.85 +
               math.cos(x * 0.95 - y * 0.8) * 0.40)
    if dist_r < 4.2:
        v.co.z = -1.4 * (1.0 - (dist_r / 4.2)**2) + h_noise * 0.08
    else:
        v.co.z = (dist_r - 4.2) * 0.44 + h_noise * 0.95
        if y > 6:
            v.co.z += (y - 6) * 0.45

mesh.update()
bpy.ops.object.shade_smooth()

# Deep Loam & Moss Shader
mat_terr = bpy.data.materials.new(name='Astra_Terrain_Loam')
mat_terr.use_nodes = True
t_nodes = mat_terr.node_tree.nodes
t_links = mat_terr.node_tree.links
t_nodes.clear()

out_t = t_nodes.new('ShaderNodeOutputMaterial')
bsdf_t = t_nodes.new('ShaderNodeBsdfPrincipled')
tex_coord = t_nodes.new('ShaderNodeTexCoord')
noise_soil = t_nodes.new('ShaderNodeTexNoise')
noise_soil.inputs['Scale'].default_value = 8.5
c_soil = t_nodes.new('ShaderNodeValToRGB')
c_soil.color_ramp.elements[0].position = 0.35
c_soil.color_ramp.elements[0].color = (0.045, 0.030, 0.018, 1.0)
c_soil.color_ramp.elements[1].position = 0.65
c_soil.color_ramp.elements[1].color = (0.032, 0.11, 0.038, 1.0)

t_links.new(tex_coord.outputs['Object'], noise_soil.inputs['Vector'])
t_links.new(noise_soil.outputs['Fac'], c_soil.inputs['Fac'])
t_links.new(c_soil.outputs['Color'], bsdf_t.inputs['Base Color'])
bsdf_t.inputs['Roughness'].default_value = 0.85
t_links.new(bsdf_t.outputs['BSDF'], out_t.inputs['Surface'])
terrain.data.materials.append(mat_terr)

if hasattr(bpy.context, 'window_manager') and bpy.context.window_manager:
    for win in bpy.context.window_manager.windows:
        if hasattr(win, 'screen') and win.screen:
            for area in win.screen.areas:
                if area.type == 'VIEW_3D':
                    for space in area.spaces:
                        if space.type == 'VIEW_3D':
                            space.shading.type = 'MATERIAL'
                            space.shading.use_scene_lights = True
                            space.shading.use_scene_world = True
`
      },
      {
        number: 2,
        id: 'stage_2_hero_mountains_architecture',
        title: 'Stage 2: Hero Alpine Mountain Massifs & Geological Peaks',
        description: '128x128 multi-fractal mountain massifs with dual-layer fractured granite rock and glistening alpine snow shader',
        delayMs: 600,
        code: `
import bpy
import math

mat_mountain = bpy.data.materials.new(name='Astra_Mountain_Rock_Snow')
mat_mountain.use_nodes = True
m_nodes = mat_mountain.node_tree.nodes
m_links = mat_mountain.node_tree.links
m_nodes.clear()

out_node = m_nodes.new('ShaderNodeOutputMaterial')
bsdf_rock = m_nodes.new('ShaderNodeBsdfPrincipled')
bsdf_snow = m_nodes.new('ShaderNodeBsdfPrincipled')
mix_shader = m_nodes.new('ShaderNodeMixShader')

tex_coord = m_nodes.new('ShaderNodeTexCoord')
noise_rock = m_nodes.new('ShaderNodeTexNoise')
noise_rock.inputs['Scale'].default_value = 8.5
bump_rock = m_nodes.new('ShaderNodeBump')
bump_rock.inputs['Strength'].default_value = 0.65

bsdf_rock.inputs['Base Color'].default_value = (0.12, 0.12, 0.14, 1.0)
bsdf_rock.inputs['Roughness'].default_value = 0.90
m_links.new(tex_coord.outputs['Object'], noise_rock.inputs['Vector'])
m_links.new(noise_rock.outputs['Fac'], bump_rock.inputs['Height'])
m_links.new(bump_rock.outputs['Normal'], bsdf_rock.inputs['Normal'])

bsdf_snow.inputs['Base Color'].default_value = (0.96, 0.98, 1.0, 1.0)
bsdf_snow.inputs['Roughness'].default_value = 0.35

geom_node = m_nodes.new('ShaderNodeNewGeometry')
sep_norm = m_nodes.new('ShaderNodeSeparateXYZ')
sep_pos = m_nodes.new('ShaderNodeSeparateXYZ')
math_slope = m_nodes.new('ShaderNodeMath')
math_slope.operation = 'MULTIPLY'
c_ramp = m_nodes.new('ShaderNodeValToRGB')
c_ramp.color_ramp.elements[0].position = 0.40
c_ramp.color_ramp.elements[1].position = 0.62

m_links.new(geom_node.outputs['Normal'], sep_norm.inputs['Vector'])
m_links.new(tex_coord.outputs['Generated'], sep_pos.inputs['Vector'])
m_links.new(sep_norm.outputs['Z'], math_slope.inputs[0])
m_links.new(sep_pos.outputs['Z'], math_slope.inputs[1])
m_links.new(math_slope.outputs['Value'], c_ramp.inputs['Fac'])

m_links.new(c_ramp.outputs['Color'], mix_shader.inputs['Fac'])
m_links.new(bsdf_rock.outputs['BSDF'], mix_shader.inputs[1])
m_links.new(bsdf_snow.outputs['BSDF'], mix_shader.inputs[2])
m_links.new(mix_shader.outputs['Shader'], out_node.inputs['Surface'])

# Center Grand Alpine Massif Peak (16,384 vertices)
bpy.ops.mesh.primitive_grid_add(x_subdivisions=128, y_subdivisions=128, size=48.0, location=(0, 24, 0))
m1 = bpy.context.view_layer.objects.active
m1.name = 'Astra_Alpine_Grand_Peak'
mesh_m1 = m1.data

for v in mesh_m1.vertices:
    x = v.co.x
    y = v.co.y
    r = math.sqrt(x*x + y*y) / 23.0
    env = max(0.0, 1.0 - (r ** 1.3))
    spine = (1.0 - abs(math.sin(x * 0.25 + y * 0.12))) ** 2.8 * 16.0
    facet = (math.sin(x * 0.6) * math.cos(y * 0.6) * 3.5 +
             math.sin(x * 1.2 + y * 0.9) * 1.8 +
             math.cos(x * 2.2 - y * 1.8) * 0.8)
    v.co.z = env * (18.0 + spine + facet)

mesh_m1.update()
bpy.ops.object.shade_smooth()
m1.data.materials.append(mat_mountain)

# Left and Right Flanking Ridges
for side, loc_x in [('Left', -19), ('Right', 19)]:
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=64, y_subdivisions=64, size=32.0, location=(loc_x, 21, 0))
    ridge = bpy.context.view_layer.objects.active
    ridge.name = f'Astra_Alpine_Ridge_{side}'
    m_r = ridge.data
    for v in m_r.vertices:
        x = v.co.x
        y = v.co.y
        r = math.sqrt(x*x + y*y) / 15.0
        env = max(0.0, 1.0 - (r ** 1.35))
        spine = (1.0 - abs(math.sin(x * 0.30 - y * 0.20))) ** 2.4 * 11.5
        facet = math.sin(x * 0.45) * math.cos(y * 0.45) * 2.8
        v.co.z = env * (11.0 + spine + facet)
    m_r.update()
    bpy.ops.object.shade_smooth()
    ridge.data.materials.append(mat_mountain)
`
      },
      {
        number: 3,
        id: 'stage_3_waterfall_and_river',
        title: 'Stage 3: Cascading Waterfall & Refractive River',
        description: 'Building sheer 12m cascading waterfall with frothing rapids, plunge pool, and 64m refractive crystal turquoise river with ripple bump',
        delayMs: 600,
        code: `
import bpy
import math

# Vertical Cascading Waterfall
bpy.ops.mesh.primitive_grid_add(x_subdivisions=36, y_subdivisions=54, size=1.0, location=(0.2, 14.8, 6.2))
wf = bpy.context.view_layer.objects.active
wf.name = 'Astra_Waterfall_Cascade'
wf.scale = (7.2, 1.2, 12.0)
wf.rotation_euler = (math.radians(10), 0, 0)
bpy.ops.object.transform_apply(scale=True, rotation=True)

mesh_wf = wf.data
for v in mesh_wf.vertices:
    v.co.x += math.sin(v.co.z * 2.2) * 0.16
    v.co.y += math.cos(v.co.z * 3.0) * 0.12
mesh_wf.update()
bpy.ops.object.shade_smooth()

# Whitewater Foam Rapids Shader
mat_wf = bpy.data.materials.new(name='Astra_Waterfall_Foam')
mat_wf.use_nodes = True
wf_nodes = mat_wf.node_tree.nodes
wf_links = mat_wf.node_tree.links
wf_nodes.clear()

out_wf = wf_nodes.new('ShaderNodeOutputMaterial')
bsdf_wf = wf_nodes.new('ShaderNodeBsdfPrincipled')
em_wf = wf_nodes.new('ShaderNodeEmission')
mix_wf = wf_nodes.new('ShaderNodeMixShader')
em_wf.inputs['Color'].default_value = (0.95, 0.98, 1.0, 1.0)
em_wf.inputs['Strength'].default_value = 8.0
bsdf_wf.inputs['Base Color'].default_value = (0.18, 0.72, 0.88, 1.0)
bsdf_wf.inputs['Roughness'].default_value = 0.05
if 'Transmission Weight' in bsdf_wf.inputs: bsdf_wf.inputs['Transmission Weight'].default_value = 0.92
elif 'Transmission' in bsdf_wf.inputs: bsdf_wf.inputs['Transmission'].default_value = 0.92
mix_wf.inputs['Fac'].default_value = 0.50
wf_links.new(bsdf_wf.outputs['BSDF'], mix_wf.inputs[1])
wf_links.new(em_wf.outputs['Emission'], mix_wf.inputs[2])
wf_links.new(mix_wf.outputs['Shader'], out_wf.inputs['Surface'])
wf.data.materials.append(mat_wf)

# Plunge Pool
bpy.ops.mesh.primitive_cylinder_add(radius=7.0, depth=0.45, location=(0.2, 13.0, 0.12))
pool = bpy.context.view_layer.objects.active
pool.name = 'Astra_Plunge_Pool'

# 64m Winding River Plane
bpy.ops.mesh.primitive_plane_add(size=64.0, location=(0, 0, -0.22))
river = bpy.context.view_layer.objects.active
river.name = 'Astra_River_Surface'
river.scale = (0.35, 1.0, 1.0)
bpy.ops.object.transform_apply(scale=True)

mat_river = bpy.data.materials.new(name='Astra_PBR_River')
mat_river.use_nodes = True
r_nodes = mat_river.node_tree.nodes
r_links = mat_river.node_tree.links
r_nodes.clear()
out_r = r_nodes.new('ShaderNodeOutputMaterial')
bsdf_r = r_nodes.new('ShaderNodeBsdfPrincipled')
bump_r = r_nodes.new('ShaderNodeBump')
noise_r = r_nodes.new('ShaderNodeTexNoise')
noise_r.inputs['Scale'].default_value = 16.0
bump_r.inputs['Strength'].default_value = 0.06
bsdf_r.inputs['Base Color'].default_value = (0.015, 0.48, 0.58, 1.0)
bsdf_r.inputs['Roughness'].default_value = 0.02
bsdf_r.inputs['IOR'].default_value = 1.333
if 'Transmission Weight' in bsdf_r.inputs: bsdf_r.inputs['Transmission Weight'].default_value = 0.98
elif 'Transmission' in bsdf_r.inputs: bsdf_r.inputs['Transmission'].default_value = 0.98
r_links.new(noise_r.outputs['Fac'], bump_r.inputs['Height'])
r_links.new(bump_r.outputs['Normal'], bsdf_r.inputs['Normal'])
r_links.new(bsdf_r.outputs['BSDF'], out_r.inputs['Surface'])
river.data.materials.append(mat_river)
`
      },
      {
        number: 4,
        id: 'stage_4_botanical_asset_scatter',
        title: 'Stage 4: 3D Botanical Ingestion & Sightline Scattering',
        description: 'Ingesting high-poly botanical 3D assets, applying emerald foliage color grading, and scattering across valley contours with camera vista clearing',
        delayMs: 600,
        code: `
import bpy
import os
import math
import random

tree_path = r"${treeAsset}"
has_glb = False

if os.path.exists(tree_path):
    try:
        bpy.ops.import_scene.gltf(filepath=tree_path)
        has_glb = True
    except Exception as e:
        print("GLB_IMPORT_ERR:", e)

tree_mesh = None
if has_glb:
    imported_parts = []
    for obj in bpy.context.scene.objects:
        if 'Tree_0' in obj.name or 'Tree_1' in obj.name or 'beech' in obj.name.lower():
            if obj.type == 'MESH':
                imported_parts.append(obj)
    if imported_parts:
        for p in imported_parts:
            p.select_set(True)
        bpy.context.view_layer.objects.active = imported_parts[0]
        bpy.ops.object.join()
        master_tree = bpy.context.view_layer.objects.active
        master_tree.name = 'Astra_Hero_Tree_Master'
        master_tree.scale = (2.2, 2.2, 2.2)
        bpy.ops.object.transform_apply(scale=True)
        tree_mesh = master_tree.data
        master_tree.location = (0, 0, -80.0)

        # Enhance Tree Materials with Lush Forest Green & Warm Bark Tint
        for m in bpy.data.materials:
            if 'Tree_1' in m.name and m.node_tree:
                bsdf = m.node_tree.nodes.get('Principled BSDF')
                if bsdf and bsdf.inputs['Base Color'].is_linked:
                    from_sock = bsdf.inputs['Base Color'].links[0].from_socket
                    if from_sock.node.name != 'Lush_Green_Tint':
                        try:
                            mix = m.node_tree.nodes.new('ShaderNodeMix')
                            mix.name = 'Lush_Green_Tint'
                            mix.data_type = 'RGBA'
                            mix.blend_type = 'MULTIPLY'
                            mix.inputs['Factor'].default_value = 0.85
                            mix.inputs['B'].default_value = (0.22, 0.70, 0.16, 1.0)
                            m.node_tree.links.new(from_sock, mix.inputs['A'])
                            m.node_tree.links.new(mix.outputs['Result'], bsdf.inputs['Base Color'])
                        except Exception: pass
            if 'Tree_0' in m.name and m.node_tree:
                bsdf = m.node_tree.nodes.get('Principled BSDF')
                if bsdf and bsdf.inputs['Base Color'].is_linked:
                    from_sock = bsdf.inputs['Base Color'].links[0].from_socket
                    if from_sock.node.name != 'Bark_Tone_Tint':
                        try:
                            mix_b = m.node_tree.nodes.new('ShaderNodeMix')
                            mix_b.name = 'Bark_Tone_Tint'
                            mix_b.data_type = 'RGBA'
                            mix_b.blend_type = 'MULTIPLY'
                            mix_b.inputs['Factor'].default_value = 0.65
                            mix_b.inputs['B'].default_value = (0.35, 0.22, 0.14, 1.0)
                            m.node_tree.links.new(from_sock, mix_b.inputs['A'])
                            m.node_tree.links.new(mix_b.outputs['Result'], bsdf.inputs['Base Color'])
                        except Exception: pass

forest_coll = bpy.data.collections.new('Astra_Botanical_Collection')
bpy.context.scene.collection.children.link(forest_coll)

rng = random.Random(42)
count = 0
attempts = 0
while count < 240 and attempts < 1400:
    attempts += 1
    tx = rng.uniform(-27.0, 27.0)
    ty = rng.uniform(-26.0, 14.0)
    
    river_x = math.sin(ty * 0.16) * 5.0 + math.cos(ty * 0.08) * 2.2
    if abs(tx - river_x) < 5.2: continue
    if ty < -16.0 and abs(tx) < 12.0: continue
    if ty > 8.0 and abs(tx) < 7.0: continue
        
    dist_r = abs(tx - river_x)
    h_noise = (math.sin(tx * 0.22) * math.cos(ty * 0.22) * 1.8 +
               math.sin(tx * 0.48 + ty * 0.36) * 0.85 +
               math.cos(tx * 0.95 - ty * 0.8) * 0.40)
    tz = (dist_r - 3.6) * 0.42 + h_noise * 0.95
    if ty > 6: tz += (ty - 6) * 0.48
    if tz > 15.0: continue
        
    t_obj = bpy.data.objects.new(f'Astra_Tree_{count+1}', tree_mesh)
    t_obj.location = (tx, ty, tz)
    s = rng.uniform(0.70, 1.30)
    t_obj.scale = (s, s, s)
    t_obj.rotation_euler = (rng.uniform(-0.03, 0.03), rng.uniform(-0.03, 0.03), rng.uniform(0, 6.28))
    forest_coll.objects.link(t_obj)
    count += 1
`
      },
      {
        number: 5,
        id: 'stage_5_atmosphere_and_rainbow',
        title: 'Stage 5: Nishita Physical Atmospheric Sky, Golden Sun & Prismatic Rainbow',
        description: 'Calculating physical Rayleigh atmospheric scattering with Nishita sky, 6.0W golden alpine sun, and radiant optical prismatic rainbow arc',
        delayMs: 600,
        code: `
import bpy
import math

# Prismatic Rainbow Arc
bpy.ops.mesh.primitive_torus_add(major_radius=16.0, minor_radius=0.65, location=(0.0, 16.0, 14.5), rotation=(math.radians(82), math.radians(6), 0))
rainbow = bpy.context.view_layer.objects.active
rainbow.name = 'Astra_Prismatic_Rainbow'
rainbow.scale = (1.25, 1.0, 0.75)

mat_rb = bpy.data.materials.new(name='Astra_Rainbow_Glow')
mat_rb.use_nodes = True
p_nodes = mat_rb.node_tree.nodes
p_links = mat_rb.node_tree.links
p_nodes.clear()

em_rb = p_nodes.new(type='ShaderNodeEmission')
em_rb.inputs['Color'].default_value = (1.0, 0.55, 0.85, 1.0)
em_rb.inputs['Strength'].default_value = 8.5
trans_rb = p_nodes.new(type='ShaderNodeBsdfTransparent')
mix_rb = p_nodes.new(type='ShaderNodeMixShader')
mix_rb.inputs['Fac'].default_value = 0.55
out_rb = p_nodes.new(type='ShaderNodeOutputMaterial')
p_links.new(trans_rb.outputs['BSDF'], mix_rb.inputs[1])
p_links.new(em_rb.outputs['Emission'], mix_rb.inputs[2])
p_links.new(mix_rb.outputs['Shader'], out_rb.inputs['Surface'])
rainbow.data.materials.append(mat_rb)

# Physical Nishita Sky
world = bpy.context.scene.world or bpy.data.worlds.new("Astra_World")
bpy.context.scene.world = world
world.use_nodes = True
wtree = world.node_tree
wtree.nodes.clear()

out_w = wtree.nodes.new(type='ShaderNodeOutputWorld')
bg = wtree.nodes.new(type='ShaderNodeBackground')
sky = wtree.nodes.new(type='ShaderNodeTexSky')
try: sky.sky_type = 'MULTIPLE_SCATTERING'
except Exception: pass
sky.sun_elevation = math.radians(18.0)
sky.sun_rotation = math.radians(68.0)
sky.altitude = 650.0
sky.air_density = 1.0
if hasattr(sky, 'aerosol_density'): sky.aerosol_density = 0.5
if hasattr(sky, 'ozone_density'): sky.ozone_density = 2.0
if hasattr(sky, 'sun_disc'): sky.sun_disc = True

wtree.links.new(sky.outputs['Color'], bg.inputs['Color'])
wtree.links.new(bg.outputs['Background'], out_w.inputs['Surface'])
bg.inputs['Strength'].default_value = 0.95

# Clean existing lights
for obj in list(bpy.context.scene.objects):
    if obj.type == 'LIGHT':
        bpy.data.objects.remove(obj, do_unlink=True)

sun_data = bpy.data.lights.new(name='Astra_Golden_Sun', type='SUN')
sun_data.energy = 6.0
sun_data.color = (1.0, 0.95, 0.88)
sun_obj = bpy.data.objects.new('Astra_Golden_Sun', sun_data)
bpy.context.collection.objects.link(sun_obj)
sun_obj.location = (18.0, -16.0, 32.0)
sun_obj.rotation_euler = (math.radians(50), math.radians(16), math.radians(-32))

amb_data = bpy.data.lights.new(name='Astra_Sky_Ambient', type='AREA')
amb_data.energy = 40.0
amb_data.color = (0.75, 0.88, 1.0)
amb_obj = bpy.data.objects.new('Astra_Sky_Ambient', amb_data)
bpy.context.collection.objects.link(amb_obj)
amb_obj.location = (0.0, -4.0, 24.0)
amb_obj.scale = (20.0, 20.0, 1.0)
`
      },
      {
        number: 6,
        id: 'stage_6_panoramic_director_camera',
        title: 'Stage 6: 24mm Director Panorama Framing, Save & 1080p Render',
        description: 'Locking 24mm director camera perspective, saving master .blend file, and rendering 1080p frame buffer',
        delayMs: 300,
        code: `
import bpy
import math

for obj in list(bpy.context.scene.objects):
    if obj.type == 'CAMERA':
        bpy.data.objects.remove(obj, do_unlink=True)

cam_data = bpy.data.cameras.new('Astra_Director_Camera')
cam_data.lens = 24
cam_obj = bpy.data.objects.new('Camera', cam_data)
bpy.context.collection.objects.link(cam_obj)
cam_obj.location = (0.0, -38.0, 7.5)
cam_obj.rotation_euler = (math.radians(85.5), 0, 0)
bpy.context.scene.camera = cam_obj

if hasattr(bpy.context, 'window_manager') and bpy.context.window_manager:
    for win in bpy.context.window_manager.windows:
        if hasattr(win, 'screen') and win.screen:
            for area in win.screen.areas:
                if area.type == 'VIEW_3D':
                    for space in area.spaces:
                        if space.type == 'VIEW_3D':
                            space.shading.type = 'MATERIAL'
                            space.shading.use_scene_lights = True
                            space.shading.use_scene_world = True
                            if hasattr(space, 'region_3d') and space.region_3d:
                                space.region_3d.view_perspective = 'CAMERA'

blend_path = r"${blendPath}"
render_path = r"${renderPath}"

try:
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print("SAVED_BLEND_FILE:" + blend_path)
except Exception as e:
    print("SAVE_BLEND_ERR:" + str(e))

scene = bpy.context.scene
scene.render.filepath = render_path
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
if hasattr(scene, 'eevee') and hasattr(scene.eevee, 'taa_render_samples'):
    scene.eevee.taa_render_samples = 16

try:
    bpy.ops.render.render(write_still=True)
    print("RENDER_SUCCESS:" + render_path)
except Exception as e:
    print("RENDER_ERR:" + str(e))
`
      }
    ];
  }
}

module.exports = { AstraWorldPlanner };
