// src/main/tools/astra/core/AssetSanitizer.js — 3D Asset Normalization & Sanitization Protocol
'use strict';

class AssetSanitizer {
  /**
   * Generates Python code to import, normalize, and sanitize any 3D asset (GLB, FBX, OBJ)
   */
  generateSanitizationBpy(filePath, entityId, targetDimensions = [1.0, 1.0, 1.0], targetLocation = [0.0, 0.0, 0.0], options = {}) {
    const cleanPath = filePath.replace(/\\/g, '/');
    const ext = cleanPath.split('.').pop().toLowerCase();
    const triangleBudget = options.triangleBudget || null;

    return `
# ==============================================================================
# ASSET INGESTION & SANITIZATION PROTOCOL (${entityId})
# Target Dimensions: ${targetDimensions[0]}m x ${targetDimensions[1]}m x ${targetDimensions[2]}m
# Triangle Budget: ${triangleBudget ? triangleBudget : 'Unlimited'}
# ==============================================================================
import bpy
import os
import mathutils

pre_objects = set(bpy.context.scene.objects)

# 1. Format-specific non-destructive import
asset_path = r"${cleanPath}"
if os.path.exists(asset_path):
    ${ext === 'glb' || ext === 'gltf' ? `bpy.ops.import_scene.gltf(filepath=asset_path)` :
      ext === 'fbx' ? `bpy.ops.import_scene.fbx(filepath=asset_path)` :
      ext === 'obj' ? `bpy.ops.wm.obj_import(filepath=asset_path)` : `bpy.ops.import_scene.gltf(filepath=asset_path)`}

# 2. Identify newly imported objects
new_objects = [o for o in bpy.context.scene.objects if o not in pre_objects]
mesh_objects = [o for o in new_objects if o.type == 'MESH']

if new_objects:
    # Create canonical master root parent
    master_root = bpy.data.objects.new("${entityId}", None)
    master_root.empty_display_type = 'ARROWS'
    bpy.context.collection.objects.link(master_root)

    # Parent all top-level imported objects to master root
    for o in new_objects:
        if not o.parent or o.parent not in new_objects:
            o.parent = master_root

    # Calculate collective bounding box of all imported meshes
    if mesh_objects:
        min_co = [float('inf')] * 3
        max_co = [float('-inf')] * 3

        for obj in mesh_objects:
            dg = bpy.context.evaluated_depsgraph_get()
            eval_obj = obj.evaluated_get(dg)
            for pt in eval_obj.bound_box:
                world_pt = obj.matrix_world @ mathutils.Vector(pt)
                for i in range(3):
                    min_co[i] = min(min_co[i], world_pt[i])
                    max_co[i] = max(max_co[i], world_pt[i])

        cur_dx = max(0.001, max_co[0] - min_co[0])
        cur_dy = max(0.001, max_co[1] - min_co[1])
        cur_dz = max(0.001, max_co[2] - min_co[2])

        target_dx = ${targetDimensions[0]}
        target_dy = ${targetDimensions[1]}
        target_dz = ${targetDimensions[2]}

        # Compute uniform scale factor based on largest dimension constraint
        scale_fac = min(target_dx / cur_dx, target_dy / cur_dy, target_dz / cur_dz)

        # Apply scale to master root
        master_root.scale = (scale_fac, scale_fac, scale_fac)

        # Ground-center offset adjustment (sit flush on Z=0)
        center_x = (min_co[0] + max_co[0]) / 2.0 * scale_fac
        center_y = (min_co[1] + max_co[1]) / 2.0 * scale_fac
        bottom_z = min_co[2] * scale_fac

        master_root.location = (
            ${targetLocation[0]} - center_x,
            ${targetLocation[1]} - center_y,
            ${targetLocation[2]} - bottom_z
        )

        # Triangle Budget Enforcement via Adaptive Decimation
        ${triangleBudget ? `
        total_mesh_tris = sum((sum(len(p.vertices) - 2 for p in m.data.polygons) if m.data.polygons else 0) for m in mesh_objects)
        budget = ${triangleBudget}
        if total_mesh_tris > budget and total_mesh_tris > 5000:
            decimate_ratio = max(0.1, min(0.95, budget / total_mesh_tris))
            print(f"[AssetSanitizer] Decimating {total_mesh_tris} triangles to fit budget {budget} (ratio: {decimate_ratio:.2f})")
            for m in mesh_objects:
                if len(m.data.polygons) > 500:
                    dec = m.modifiers.new("BudgetDecimate", 'DECIMATE')
                    dec.ratio = decimate_ratio
        ` : ''}

    # 3. PBR Normal Harmonization & Smooth Shading
    for obj in mesh_objects:
        bpy.context.view_layer.objects.active = obj
        try:
            bpy.ops.object.shade_smooth()
        except Exception:
            pass

        # Ensure Bevel on hard-surface meshes without existing modifiers
        if not any(m.type == 'BEVEL' for m in obj.modifiers):
            try:
                bev = obj.modifiers.new("AutoBevel", 'BEVEL')
                bev.width = 0.015
                bev.segments = 2
                bev.limit_method = 'ANGLE'
            except Exception:
                pass

        # Texture and Material Sanitization
        if hasattr(obj.data, 'materials'):
            for mat in obj.data.materials:
                if mat and mat.use_nodes:
                    b_node = mat.node_tree.nodes.get('Principled BSDF')
                    if b_node:
                        # Ensure valid roughness and metallic defaults if empty
                        if 'Roughness' in b_node.inputs and b_node.inputs['Roughness'].default_value is None:
                            b_node.inputs['Roughness'].default_value = 0.5
`;
  }
}

module.exports = { AssetSanitizer };
