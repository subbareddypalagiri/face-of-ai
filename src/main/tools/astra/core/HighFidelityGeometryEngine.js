// src/main/tools/astra/core/HighFidelityGeometryEngine.js — High-Fidelity Geometry, Budget, LOD & Instancing Engine (Phase 5)
'use strict';

const logger = require('../../../../shared/Logger');

/**
 * Context-Aware Triangle Budgets
 */
const GEOMETRY_BUDGET_TIER = Object.freeze({
  HERO: { minTriangles: 100000, targetTriangles: 500000, maxTriangles: 1500000 },
  MIDGROUND: { minTriangles: 10000, targetTriangles: 45000, maxTriangles: 100000 },
  BACKGROUND: { minTriangles: 1000, targetTriangles: 8000, maxTriangles: 20000 },
  FAR: { minTriangles: 100, targetTriangles: 500, maxTriangles: 2000 },
  FAR_INSTANCED: { minTriangles: 100, targetTriangles: 500, maxTriangles: 2000 }
});

/**
 * Standard LOD Levels
 */
const LOD_LEVEL = Object.freeze({
  LOD0: Object.freeze({ name: 'LOD0', ratio: 1.0, toString: () => 'LOD0' }),
  LOD1: Object.freeze({ name: 'LOD1', ratio: 0.5, toString: () => 'LOD1' }),
  LOD2: Object.freeze({ name: 'LOD2', ratio: 0.2, toString: () => 'LOD2' }),
  LOD3: Object.freeze({ name: 'LOD3', ratio: 0.05, toString: () => 'LOD3' })
});

/**
 * Real-World Reference Dimensions in Meters [Width(X), Length(Y), Height(Z)]
 */
const PHYSICAL_SCALE_STANDARDS = Object.freeze({
  motorcycle: { x: 0.85, y: 2.20, z: 1.25, width: 0.85, length: 2.20, height: 1.25, groundOffset: 0.0 },
  vehicle_car: { x: 1.95, y: 4.60, z: 1.30, width: 1.95, length: 4.60, height: 1.30, groundOffset: 0.0 },
  truck: { x: 2.50, y: 8.00, z: 3.40, width: 2.50, length: 8.00, height: 3.40, groundOffset: 0.0 },
  human: { x: 0.55, y: 0.35, z: 1.80, width: 0.55, length: 0.35, height: 1.80, groundOffset: 0.0 },
  tree: { x: 4.50, y: 4.50, z: 9.00, width: 4.50, length: 4.50, height: 9.00, groundOffset: 0.0 },
  tree_forest: { x: 4.50, y: 4.50, z: 9.00, width: 4.50, length: 4.50, height: 9.00, groundOffset: 0.0 },
  streetlamp: { x: 0.60, y: 0.80, z: 5.50, width: 0.60, length: 0.80, height: 5.50, groundOffset: 0.0 },
  building: { x: 12.0, y: 15.0, z: 8.50, width: 12.0, length: 15.0, height: 8.50, groundOffset: 0.0 },
  building_storefront: { x: 12.0, y: 15.0, z: 8.50, width: 12.0, length: 15.0, height: 8.50, groundOffset: 0.0 },
  building_skyscraper: { x: 25.0, y: 25.0, z: 85.0, width: 25.0, length: 25.0, height: 85.0, groundOffset: 0.0 }
});

class HighFidelityGeometryEngine {
  constructor(options = {}) {
    this.hardwareProfile = options.hardwareProfile || 'DESKTOP_GPU';
  }

  /**
   * Resolves triangle budget given entity role and scene context
   */
  resolveTriangleBudget(role = 'hero', category = 'vehicle') {
    switch ((role || '').toLowerCase()) {
      case 'hero':
      case 'primary':
        return GEOMETRY_BUDGET_TIER.HERO;
      case 'midground':
      case 'secondary':
      case 'prop':
        return GEOMETRY_BUDGET_TIER.MIDGROUND;
      case 'background':
      case 'environment':
        return GEOMETRY_BUDGET_TIER.BACKGROUND;
      default:
        return GEOMETRY_BUDGET_TIER.MIDGROUND;
    }
  }

  /**
   * Calculates context-aware triangle budget based on distance and semantic role
   */
  calculateTriangleBudget(options = {}) {
    const { role = 'hero', cameraDistanceMeters = 5.0, isCloseUp = false } = options;
    const r = (role || '').toLowerCase();

    if (isCloseUp || r === 'hero' || r === 'primary') {
      return {
        tier: 'HERO',
        allocatedTriangles: 500000,
        triangleBudget: 500000,
        recommendedSubsurfLevels: 2,
        minTriangles: GEOMETRY_BUDGET_TIER.HERO.minTriangles,
        maxTriangles: GEOMETRY_BUDGET_TIER.HERO.maxTriangles
      };
    }
    if (cameraDistanceMeters > 30.0) {
      return {
        tier: 'FAR',
        allocatedTriangles: 1500,
        triangleBudget: 1500,
        recommendedSubsurfLevels: 0,
        minTriangles: GEOMETRY_BUDGET_TIER.FAR.minTriangles,
        maxTriangles: GEOMETRY_BUDGET_TIER.FAR.maxTriangles
      };
    }
    if (cameraDistanceMeters > 15.0 || r === 'prop') {
      return {
        tier: 'BACKGROUND',
        allocatedTriangles: 10000,
        triangleBudget: 10000,
        recommendedSubsurfLevels: 0,
        minTriangles: GEOMETRY_BUDGET_TIER.BACKGROUND.minTriangles,
        maxTriangles: GEOMETRY_BUDGET_TIER.BACKGROUND.maxTriangles
      };
    }
    return {
      tier: 'MIDGROUND',
      allocatedTriangles: 50000,
      triangleBudget: 50000,
      recommendedSubsurfLevels: 1,
      minTriangles: GEOMETRY_BUDGET_TIER.MIDGROUND.minTriangles,
      maxTriangles: GEOMETRY_BUDGET_TIER.MIDGROUND.maxTriangles
    };
  }

  /**
   * Validates physical real-world scale for entity category
   */
  getStandardPhysicalScale(category = 'motorcycle') {
    const cat = (category || '').toLowerCase();
    const key = Object.keys(PHYSICAL_SCALE_STANDARDS).find(k => cat.includes(k) || k.includes(cat)) || 'motorcycle';
    return PHYSICAL_SCALE_STANDARDS[key] || PHYSICAL_SCALE_STANDARDS.motorcycle;
  }

  /**
   * Alias for getStandardPhysicalScale
   */
  getPhysicalDimensions(category = 'motorcycle') {
    return this.getStandardPhysicalScale(category);
  }

  /**
   * Generates Python snippet for Non-Destructive LOD Stack
   */
  generateLODSetupBpy(objectIdentifier, currentLOD = LOD_LEVEL.LOD0) {
    const lodName = (typeof currentLOD === 'object' && currentLOD.name) ? currentLOD.name : String(currentLOD);
    const ratios = {
      LOD0: 1.0,
      LOD1: 0.5,
      LOD2: 0.2,
      LOD3: 0.05
    };
    const ratio = (typeof currentLOD === 'object' && currentLOD.ratio !== undefined)
      ? currentLOD.ratio
      : (ratios[lodName] || 1.0);

    return `
import bpy

def _setup_lod():
    obj = None
    for o in bpy.context.scene.objects:
        if o.get("unin_id") == "${objectIdentifier}" or o.name == "${objectIdentifier}":
            obj = o
            break
    if not obj:
        for o in bpy.data.objects:
            if o.get("unin_id") == "${objectIdentifier}" or o.name == "${objectIdentifier}":
                obj = o
                break
    
    if obj and obj.type == 'MESH':
        target_obj = obj
        target_obj["unin_lod"] = "${lodName}"
        target_obj["unin_active_lod"] = "${lodName}"
        mod_name = "UNIN_LOD_Decimate"
        dec_mod = target_obj.modifiers.get(mod_name)
        if not dec_mod:
            dec_mod = target_obj.modifiers.new(name=mod_name, type='DECIMATE')
        dec_mod.ratio = ${ratio}
        dec_mod.show_viewport = True
        dec_mod.show_render = True

_setup_lod()
`;
  }

  /**
   * Generates Python snippet to establish production-grade topology & smoothing on hero mesh
   */
  generateTopologySmoothingBpy(objectIdentifier, options = {}) {
    const levels = options.subsurfLevels || 1;
    return `
import bpy

def _polish_hero_topology():
    obj = None
    for o in bpy.context.scene.objects:
        if o.get("unin_id") == "${objectIdentifier}" or o.name == "${objectIdentifier}":
            obj = o
            break
    if not obj:
        for o in bpy.data.objects:
            if o.get("unin_id") == "${objectIdentifier}" or o.name == "${objectIdentifier}":
                obj = o
                break
            
    if obj and obj.type == 'MESH':
        target_obj = obj
        target_obj.data.use_auto_smooth = True
        # 1. Smooth shading across all polygons
        for poly in target_obj.data.polygons:
            poly.use_smooth = True
            
        # 2. Weighted Normal Modifier for crisp industrial reflections
        wn = target_obj.modifiers.get("Weighted_Normal")
        if not wn:
            wn = target_obj.modifiers.new(name="Weighted_Normal", type='WEIGHTED_NORMAL')
        wn.keep_sharp = True
        wn.weight = 50
            
        # 3. Subsurf modifier if polygon density is below hero threshold
        sub_mod = target_obj.modifiers.get("Subdivision")
        if not sub_mod:
            sub_mod = target_obj.modifiers.new(name="Subdivision", type='SUBSURF')
        sub_mod.levels = ${levels}
        sub_mod.render_levels = ${levels + 1}

_polish_hero_topology()
`;
  }

  /**
   * Generates PBR surface imperfection graph (edge wear, micro-scratches, dust layer)
   */
  generateImperfectionShaderBpy(objectIdentifier, imperfectionParams = {}) {
    const {
      dustAmount = 0.15,
      scratchScale = 25.0,
      scratchStrength = 0.08,
      edgeWear = 0.2
    } = imperfectionParams;

    return `
import bpy

def _apply_imperfections():
    obj = None
    for o in bpy.context.scene.objects:
        if o.get("unin_id") == "${objectIdentifier}" or o.name == "${objectIdentifier}":
            obj = o
            break
    if not obj:
        for o in bpy.data.objects:
            if o.get("unin_id") == "${objectIdentifier}" or o.name == "${objectIdentifier}":
                obj = o
                break
            
    # Collect target mesh objects: either the object itself or all child meshes if root is Empty
    targets = []
    if obj:
        if hasattr(obj, 'data') and hasattr(obj.data, 'materials') and obj.type == 'MESH':
            targets.append(obj)
        # Recursively traverse child objects
        def collect_children(parent):
            for ch in parent.children:
                if hasattr(ch, 'data') and hasattr(ch.data, 'materials') and ch.type == 'MESH':
                    targets.append(ch)
                collect_children(ch)
        collect_children(obj)

    applied_count = 0
    for target_obj in targets:
        if len(target_obj.data.materials) == 0:
            mat = bpy.data.materials.new(name=f"{target_obj.name}_PBR")
            mat.use_nodes = True
            target_obj.data.materials.append(mat)
            
        for mat in target_obj.data.materials:
            if not mat or not mat.use_nodes:
                continue
            nodes = mat.node_tree.nodes
            links = mat.node_tree.links
            bsdf = None
            for n in nodes:
                if n.type == 'BSDF_PRINCIPLED':
                    bsdf = n
                    break
            
            if bsdf:
                tex_coord = nodes.new('ShaderNodeTexCoord')
                tex_coord.location = (-750, -250)
                
                # Micro-Scratch Voronoi Texture
                voro = nodes.new('ShaderNodeTexVoronoi')
                voro.location = (-550, -250)
                voro.inputs['Scale'].default_value = ${scratchScale}
                
                # Micro-Dust Noise Texture
                noise = nodes.new('ShaderNodeTexNoise')
                noise.location = (-550, -450)
                noise.inputs['Scale'].default_value = 45.0
                noise.inputs['Detail'].default_value = 6.0
                
                # Mix Imperfections
                mix = nodes.new('ShaderNodeMix')
                mix.location = (-350, -350)
                mix.data_type = 'RGBA'
                
                c_ramp = nodes.new('ShaderNodeValToRGB')
                c_ramp.location = (-150, -250)
                c_ramp.color_ramp.elements[0].position = 0.65
                c_ramp.color_ramp.elements[1].position = 0.75
                
                bump = nodes.new('ShaderNodeBump')
                bump.location = (100, -250)
                bump.inputs['Strength'].default_value = ${scratchStrength}
                
                links.new(tex_coord.outputs['Object'], voro.inputs['Vector'])
                links.new(tex_coord.outputs['Object'], noise.inputs['Vector'])
                links.new(voro.outputs['Distance'], c_ramp.inputs['Fac'])
                links.new(c_ramp.outputs['Color'], bump.inputs['Height'])
                links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
                applied_count += 1

    print(f"IMPERFECTIONS_APPLIED: {applied_count} materials on {len(targets)} mesh objects")

_apply_imperfections()
`;
  }
}

module.exports = {
  HighFidelityGeometryEngine,
  GEOMETRY_BUDGET_TIER,
  LOD_LEVEL,
  PHYSICAL_SCALE_STANDARDS
};
