// src/main/tools/astra/core/BlenderWorkspaceObserver.js — Deep Blender Workspace & State Observation Model (Phase 4)
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const logger = require('../../../../shared/Logger');

/**
 * Supported Blender Interaction Modes
 */
const BLENDER_MODE = Object.freeze({
  OBJECT: 'OBJECT',
  EDIT: 'EDIT',
  SCULPT: 'SCULPT',
  POSE: 'POSE',
  WEIGHT_PAINT: 'WEIGHT_PAINT',
  VERTEX_PAINT: 'VERTEX_PAINT',
  TEXTURE_PAINT: 'TEXTURE_PAINT'
});

/**
 * Editor / Area Types
 */
const BLENDER_EDITOR_TYPE = Object.freeze({
  VIEW_3D: 'VIEW_3D',
  NODE_EDITOR: 'NODE_EDITOR',
  DOPESHEET: 'DOPESHEET_EDITOR',
  DOPESHEET_EDITOR: 'DOPESHEET_EDITOR',
  TIMELINE: 'TIMELINE',
  GRAPH_EDITOR: 'GRAPH_EDITOR',
  OUTLINER: 'OUTLINER',
  PROPERTIES: 'PROPERTIES',
  IMAGE_EDITOR: 'IMAGE_EDITOR',
  UNKNOWN: 'UNKNOWN'
});

class BlenderWorkspaceObserver {
  constructor(sendRPC = null) {
    this.sendRPC = sendRPC;
  }

  /**
   * Alias for generateObservationScript
   */
  generateIntrospectionBpy() {
    return this.generateObservationScript();
  }

  /**
   * Generates the Python introspection script to extract structured scene & workspace telemetry
   */
  generateObservationScript() {
    return `
import bpy
import json
import math
import os
import tempfile

def observe_scene_workspace():
    context = bpy.context
    scene = context.scene

    # 1. Workspace & Screen State
    ws_name = bpy.context.workspace.name if hasattr(bpy.context, 'workspace') and bpy.context.workspace else "Default"
    active_mode = context.mode if hasattr(context, 'mode') else "OBJECT"

    # Editors & Active Region
    editors = []
    active_area = "VIEW_3D"
    if hasattr(context, 'window_manager') and context.window_manager:
        for win in context.window_manager.windows:
            if hasattr(win, 'screen') and win.screen:
                for area in win.screen.areas:
                    editors.append(area.type)
                    if hasattr(area, 'type') and area.type == 'VIEW_3D':
                        active_area = 'VIEW_3D'

    # 2. Active & Selected Objects
    act_obj = bpy.context.active_object or bpy.context.view_layer.objects.active
    act_info = None
    if act_obj:
        bbox = [list(c) for c in act_obj.bound_box] if hasattr(act_obj, 'bound_box') else []
        act_info = {
            "name": act_obj.name,
            "type": act_obj.type,
            "unin_id": act_obj.get("unin_id", None),
            "unin_world_id": act_obj.get("unin_world_id", None),
            "unin_version": act_obj.get("unin_version", 1),
            "location": [round(v, 4) for v in act_obj.location],
            "rotation_euler": [round(math.degrees(v), 2) for v in act_obj.rotation_euler],
            "scale": [round(v, 4) for v in act_obj.scale],
            "dimensions": [round(v, 4) for v in act_obj.dimensions] if hasattr(act_obj, 'dimensions') else [0, 0, 0],
            "bbox": bbox,
            "parent": act_obj.parent.name if act_obj.parent else None,
            "children": [c.name for c in act_obj.children],
            "visible": not act_obj.hide_viewport,
            "modifiers": [
                {
                    "name": m.name,
                    "type": m.type,
                    "show_viewport": m.show_viewport
                } for m in act_obj.modifiers
            ],
            "constraints": [
                {
                    "name": c.name,
                    "type": c.type
                } for c in act_obj.constraints
            ] if hasattr(act_obj, 'constraints') else [],
            "materials": [
                mat.name for mat in act_obj.data.materials if mat
            ] if hasattr(act_obj, 'data') and hasattr(act_obj.data, 'materials') else []
        }

    selected = []
    for o in bpy.context.selected_objects:
        selected.append({
            "name": o.name,
            "unin_id": o.get("unin_id", None),
            "type": o.type
        })

    # 3. Outliner Collections
    collections = []
    def parse_col(col, parent=None):
        collections.append({
            "name": col.name,
            "parent": parent,
            "object_count": len(col.objects),
            "objects": [o.name for o in col.objects]
        })
        for c in col.children:
            parse_col(c, col.name)
    if hasattr(scene, 'collection'):
        parse_col(scene.collection, None)

    # 4. Camera & Optics
    cam = scene.camera
    cam_info = None
    if cam:
        cam_data = cam.data
        cam_info = {
            "name": cam.name,
            "unin_id": cam.get("unin_id", None),
            "lens": cam_data.lens,
            "sensor_width": cam_data.sensor_width,
            "dof_enabled": cam_data.dof.use_dof if hasattr(cam_data, 'dof') else False,
            "fstop": cam_data.dof.aperture_fstop if hasattr(cam_data, 'dof') else None,
            "focus_distance": round(cam_data.dof.focus_distance, 3) if hasattr(cam_data, 'dof') and cam_data.dof.focus_distance else None,
            "location": [round(v, 4) for v in cam.location],
            "rotation": [round(math.degrees(v), 2) for v in cam.rotation_euler]
        }

    # 5. Lighting Summary
    lights = []
    for o in scene.objects:
        if o.type == 'LIGHT' and hasattr(o, 'data'):
            l = o.data
            lights.append({
                "name": o.name,
                "unin_id": o.get("unin_id", None),
                "type": l.type,
                "energy": round(l.energy, 2),
                "color": [round(c, 3) for c in l.color],
                "location": [round(v, 3) for v in o.location]
            })

    # 6. Timeline & Animation Frame State
    anim_info = {
        "current_frame": scene.frame_current,
        "frame_start": scene.frame_start,
        "frame_end": scene.frame_end,
        "fps": scene.render.fps,
        "actions_count": len(bpy.data.actions) if hasattr(bpy.data, 'actions') else 0
    }

    # 7. Render Settings
    render_info = {
        "engine": scene.render.engine,
        "resolution_x": scene.render.resolution_x,
        "resolution_y": scene.render.resolution_y,
        "resolution_percentage": scene.render.resolution_percentage,
        "view_transform": scene.view_settings.view_transform if hasattr(scene, 'view_settings') else "Standard",
        "look": scene.view_settings.look if hasattr(scene, 'view_settings') else "None"
    }

    # 8. Mesh Complexity Statistics
    total_verts = 0
    total_faces = 0
    total_triangles = 0
    mesh_objects_count = 0
    for o in scene.objects:
        if o.type == 'MESH' and o.data:
            mesh_objects_count += 1
            total_verts += len(o.data.vertices)
            total_faces += len(o.data.polygons)
            # Triangles estimation (polygons * 2 avg or loop_triangles if evaluated)
            total_triangles += len(o.data.polygons) * 2

    obs_data = {
        "workspace": ws_name,
        "mode": active_mode,
        "active_editor": active_area,
        "active_object": act_info,
        "selected_objects": selected,
        "collections": collections,
        "camera": cam_info,
        "lights": lights,
        "animation": anim_info,
        "render": render_info,
        "mesh_stats": {
            "mesh_objects_count": mesh_objects_count,
            "total_vertices": total_verts,
            "total_faces": total_faces,
            "estimated_triangles": total_triangles,
            "total_scene_objects": len(scene.objects)
        }
    }
    obs_file = os.path.join(tempfile.gettempdir(), "unin_workspace_obs.json")
    try:
        with open(obs_file, "w", encoding="utf-8") as f:
            json.dump(obs_data, f)
    except Exception:
        pass
    return obs_data

observe_scene_workspace()
print("UNIN_WORKSPACE_OBSERVATION_DATA:" + json.dumps(observe_scene_workspace()))
print("UNIN_OBSERVE_JSON:" + json.dumps(observe_scene_workspace()))
`;
  }

  /**
   * Queries deep workspace state from live Blender session
   */
  async observeWorkspace() {
    if (!this.sendRPC) {
      throw new Error('[BlenderWorkspaceObserver] RPC bridge sender not initialized');
    }

    const script = this.generateObservationScript();
    const res = await this.sendRPC('execute_bpy', { code: script, autoCapture: false }, 30000);

    if (res.error) {
      logger.error(`[BlenderWorkspaceObserver] Failed to observe workspace: ${JSON.stringify(res.error)}`);
      throw new Error(`Observation failed: ${res.error.message || JSON.stringify(res.error)}`);
    }

    const tempFile = path.join(os.tmpdir(), 'unin_workspace_obs.json');
    let data = null;
    if (fs.existsSync(tempFile)) {
      try {
        data = JSON.parse(fs.readFileSync(tempFile, 'utf8'));
        try { fs.unlinkSync(tempFile); } catch (e) {}
      } catch (e) {
        data = null;
      }
    }

    if (!data) {
      const stdout = res.result?.stdout || res.stdout || '';
      const match = stdout.match(/UNIN_WORKSPACE_OBSERVATION_DATA:(.*)/) || stdout.match(/UNIN_OBSERVE_JSON:(.*)/);
      if (match) {
        try {
          data = JSON.parse(match[1]);
        } catch (e) {
          data = null;
        }
      }
    }

    if (!data && (res.sceneState || res.result?.sceneState)) {
      const ss = res.sceneState || res.result?.sceneState;
      data = {
        workspace: 'Layout',
        mode: 'OBJECT',
        active_editor: 'VIEW_3D',
        active_object: ss.activeObject ? { name: ss.activeObject } : null,
        objects_count: ss.objectsCount || 0,
        mesh_stats: {
          mesh_objects_count: (ss.objects || []).length,
          total_vertices: ss.totalVertices || 0,
          total_faces: ss.totalTriangles ? Math.floor(ss.totalTriangles / 2) : 0,
          estimated_triangles: ss.totalTriangles || 0,
          total_scene_objects: ss.objectsCount || 0
        },
        render: {
          engine: ss.renderEngine || 'BLENDER_EEVEE_NEXT',
          view_transform: 'AgX',
          viewTransform: 'AgX'
        },
        camera: ss.activeCamera ? {
          name: ss.activeCamera.name,
          lens: ss.activeCamera.focalLength,
          sensor_width: ss.activeCamera.sensorWidth,
          dof_enabled: ss.activeCamera.dofEnabled
        } : null,
        lights: (ss.lights || []).map(l => ({ name: l })),
        collections: []
      };
    }

    if (!data) {
      logger.warn('[BlenderWorkspaceObserver] No structured observation payload found in stdout. Returning fallback structure.');
      return this.createFallbackObservation();
    }

    try {
      return this.normalizeObservationData(data);
    } catch (e) {
      logger.error(`[BlenderWorkspaceObserver] Failed to parse observation data: ${e.message}`);
      return this.createFallbackObservation();
    }
  }

  /**
   * Normalizes raw telemetry into canonical structured report
   */
  normalizeObservationData(data = {}) {
    const render = data.render || { engine: 'BLENDER_EEVEE_NEXT', resolution_x: 1920, resolution_y: 1080 };
    if (!render.viewTransform) {
      render.viewTransform = render.view_transform || 'AgX';
    }

    const meshStats = data.mesh_stats || data.meshComplexity || {
      mesh_objects_count: 0,
      total_vertices: 0,
      total_faces: 0,
      estimated_triangles: 0,
      total_scene_objects: 0
    };
    const meshComplexity = data.meshComplexity || {
      totalObjects: meshStats.total_scene_objects || meshStats.mesh_objects_count || 0,
      totalVertices: meshStats.total_vertices || 0,
      totalPolygons: meshStats.total_faces || 0,
      totalTriangles: meshStats.estimated_triangles || meshStats.totalTriangles || 0
    };

    return {
      success: true,
      workspace: data.workspace || data.workspaceName || 'Default',
      mode: data.mode || BLENDER_MODE.OBJECT,
      activeEditor: data.active_editor || BLENDER_EDITOR_TYPE.VIEW_3D,
      activeObject: data.active_object || data.activeObject || null,
      selectedObjects: data.selected_objects || data.selectedObjects || [],
      collections: data.collections || [],
      camera: data.camera || null,
      lights: data.lights || [],
      animation: data.animation || data.timeline || { current_frame: 1, frame_start: 1, frame_end: 250, fps: 24, actions_count: 0 },
      timeline: {
        currentFrame: (data.animation || data.timeline)?.current_frame || 1,
        startFrame: (data.animation || data.timeline)?.frame_start || 1,
        endFrame: (data.animation || data.timeline)?.frame_end || 120,
        fps: (data.animation || data.timeline)?.fps || 24
      },
      render,
      renderEngine: render.engine,
      objectsCount: meshStats.total_scene_objects || meshStats.mesh_objects_count || meshComplexity.totalObjects || 0,
      meshStats,
      meshComplexity,
      observedAt: Date.now()
    };
  }

  /**
   * Fallback structured observation model
   */
  createFallbackObservation() {
    return {
      workspace: 'Layout',
      mode: BLENDER_MODE.OBJECT,
      activeEditor: BLENDER_EDITOR_TYPE.VIEW_3D,
      activeObject: null,
      selectedObjects: [],
      collections: [{ name: 'Scene Collection', parent: null, object_count: 0, objects: [] }],
      camera: null,
      lights: [],
      animation: { current_frame: 1, frame_start: 1, frame_end: 250, fps: 24, actions_count: 0 },
      render: { engine: 'BLENDER_EEVEE_NEXT', resolution_x: 1920, resolution_y: 1080 },
      meshStats: { mesh_objects_count: 0, total_vertices: 0, total_faces: 0, estimated_triangles: 0, total_scene_objects: 0 },
      observedAt: Date.now()
    };
  }
}

module.exports = {
  BlenderWorkspaceObserver,
  BLENDER_MODE,
  BLENDER_EDITOR_TYPE
};
