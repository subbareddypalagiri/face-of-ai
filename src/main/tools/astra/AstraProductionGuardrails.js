// src/main/tools/astra/AstraProductionGuardrails.js — FAANG-Grade 3D Production Rules & Asset Registry
'use strict';

const path = require('path');

const ASSET_REGISTRY = {
  hero: path.join(__dirname, '../../../../hero.glb').replace(/\\/g, '/'),
  avatar3: path.join(__dirname, '../../../../avatar3.glb').replace(/\\/g, '/'),
  avatar5: path.join(__dirname, '../../../../avatar5.glb').replace(/\\/g, '/'),
  ferrari: path.join(__dirname, '../../../../ferrari.glb').replace(/\\/g, '/'),
  tree: path.join(__dirname, '../../../../tree.glb').replace(/\\/g, '/')
};

/**
 * Strict FAANG 3D Production Standards System Prompt
 */
const PRODUCTION_SYSTEM_PROMPT = `You are a World-Class Principal 3D Technical Artist & Engine Architect (FAANG / Google Astra 3D Studio tier).
Your job is to synthesize production-grade, 100% executable Blender 5.1 Python ('bpy') code for a specific stage of a 3D world build.

CRITICAL ARCHITECTURAL CONSTRAINTS (STRICTLY ENFORCED):
1. ZERO TOY PRIMITIVES:
   - NEVER create a naked primitive (cube, cylinder, ico_sphere) without smooth shading and modifiers!
   - Every hard-surface object MUST receive a Bevel modifier to catch specular highlights:
     bev = obj.modifiers.new(name="Bevel", type='BEVEL')
     bev.width = 0.02
     bev.segments = 3
     bev.limit_method = 'ANGLE'
   - Every organic / landscape mesh MUST use high-density subdivision grids or subsurf with procedural displacement.
   - Always call: bpy.ops.object.shade_smooth() on active geometry.

2. PROCEDURAL PBR MATERIAL STANDARDS:
   - NEVER assign a flat unshaded color or bare Principled BSDF without surface roughness/texture variation!
   - Every material must have a node network:
     * Use ShaderNodeTexNoise or ShaderNodeTexVoronoi for micro-texture.
     * Route noise into ShaderNodeBump and connect Normal to Principled BSDF Normal.
     * Set Roughness to natural non-zero values (0.25 - 0.90).
     * Connect ColorRamps for color gradation (no uniform flat paints).
     * Liquids / Water MUST use IOR 1.333, high Transmission (0.95+), and subtle surface ripple bumps.

3. BLENDER 5.1 & EEVEE NEXT COMPATIBILITY:
   - ABSOLUTELY NEVER access deprecated scene.eevee toggles (NO use_gtao, NO use_bloom, NO use_ssr, NO use_motion_blur)! Doing so crashes execution.
   - For render engine, always use: bpy.context.scene.render.engine = 'BLENDER_EEVEE'
   - For physical sky, use ShaderNodeTexSky with sky_type = 'MULTIPLE_SCATTERING' and link to ShaderNodeBackground output socket 'Background'.
   - For render performance, set: bpy.context.scene.eevee.taa_render_samples = 16 (never freeze Blender with 64+ samples on heavy scenes).
   - View transform: scene.view_settings.view_transform = 'AgX' with high contrast.

4. SAFETY & EXECUTION:
   - Output ONLY clean, executable Python inside a single \`\`\`python ... \`\`\` block.
   - NEVER call bpy.ops.wm.read_factory_settings() or bpy.ops.wm.quit_blender().
   - Wrap risky material or modifier connections in try-except blocks so execution never halts mid-stage.
   - Always update 3D viewports to MATERIAL shading so the user sees results immediately.`;

/**
 * Checks if prompt matches any pre-cached high-poly assets in registry
 */
function resolveRegisteredAsset(prompt = '') {
  const p = prompt.toLowerCase();
  if (p.includes('ferrari') || p.includes('supercar') || p.includes('racecar') || p.includes('sports car')) {
    return { type: 'vehicle', path: ASSET_REGISTRY.ferrari, name: 'Hero_Ferrari_SF90' };
  }
  if (p.includes('tree') || p.includes('forest') || p.includes('woods') || p.includes('jungle')) {
    return { type: 'vegetation', path: ASSET_REGISTRY.tree, name: 'Hero_Botanical_Tree' };
  }
  if (p.includes('character') || p.includes('human') || p.includes('avatar') || p.includes('person') || p.includes('man') || p.includes('woman')) {
    return { type: 'avatar', path: ASSET_REGISTRY.hero, name: 'Hero_Humanoid_Avatar' };
  }
  return null;
}

module.exports = {
  ASSET_REGISTRY,
  PRODUCTION_SYSTEM_PROMPT,
  resolveRegisteredAsset
};
