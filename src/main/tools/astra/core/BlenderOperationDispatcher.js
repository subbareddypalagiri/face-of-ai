// src/main/tools/astra/core/BlenderOperationDispatcher.js — Modular Native Blender Operator Intelligence (Phase 4)
'use strict';

const logger = require('../../../../shared/Logger');
const { BLENDER_MODE } = require('./BlenderWorkspaceObserver');

/**
 * Standard Supported Modifiers
 */
const MODIFIER_TYPE = Object.freeze({
  SUBSURF: 'SUBSURF',
  BEVEL: 'BEVEL',
  MIRROR: 'MIRROR',
  SOLIDIFY: 'SOLIDIFY',
  BOOLEAN: 'BOOLEAN',
  ARRAY: 'ARRAY',
  WEIGHTED_NORMAL: 'WEIGHTED_NORMAL',
  DISPLACE: 'DISPLACE',
  NODES: 'NODES'
});

/**
 * Ordered Modifier Hierarchy (Lower numbers placed earlier in stack)
 */
const MODIFIER_ORDER_PRIORITY = Object.freeze({
  MIRROR: 10,
  ARRAY: 20,
  BOOLEAN: 30,
  SOLIDIFY: 40,
  BEVEL: 50,
  SUBSURF: 60,
  WEIGHTED_NORMAL: 70,
  NODES: 80,
  DISPLACE: 90
});

class BlenderOperationDispatcher {
  constructor(sendRPC = null) {
    this.sendRPC = sendRPC;
  }

  /**
   * Helper to execute generated Python snippet across Blender RPC
   */
  async executeBpySnippet(pyCode, options = {}) {
    if (!this.sendRPC) {
      throw new Error('[BlenderOperationDispatcher] sendRPC not initialized');
    }
    const timeout = options.timeout || 30000;
    const res = await this.sendRPC('execute_bpy', { code: pyCode, autoCapture: false }, timeout);
    if (res && res.error) {
      throw new Error(`Blender execution error: ${res.error.message || JSON.stringify(res.error)}`);
    }
    return res?.result || {};
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 1. MODE & SELECTION AWARENESS (4.4, 4.5)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Generates Python to find object by unin_id or name
   */
  _objectLookupPython(identifier = null, varName = 'target_obj') {
    return `
def _get_target_object(ident):
    import bpy
    for o in bpy.context.scene.objects:
        if o.get("unin_id") == ident:
            return o
    for o in bpy.data.objects:
        if o.get("unin_id") == ident:
            return o
    return bpy.data.objects.get(ident)

${identifier ? `
${varName} = None
for o in bpy.context.scene.objects:
    if o.get("unin_id") == "${identifier}":
        ${varName} = o
        break
if not ${varName}:
    ${varName} = bpy.data.objects.get("${identifier}")
` : ''}
`;
  }

  /**
   * Generates Python to safely switch mode, execute lambda, and restore mode
   */
  wrapWithModeSafety(arg1, arg2, arg3) {
    let targetMode = 'OBJECT';
    let targetIdentifier = null;
    let innerBpy = '';

    const validModes = ['OBJECT', 'EDIT', 'SCULPT', 'POSE', 'WEIGHT_PAINT', 'VERTEX_PAINT', 'TEXTURE_PAINT'];
    if (validModes.includes(arg1)) {
      targetMode = arg1;
      targetIdentifier = arg2;
      innerBpy = arg3 || '';
    } else if (validModes.includes(arg2)) {
      innerBpy = arg1 || '';
      targetMode = arg2;
      targetIdentifier = arg3;
    } else {
      innerBpy = arg1 || '';
      targetMode = arg2 || 'OBJECT';
      targetIdentifier = arg3;
    }

    return `
import bpy
${this._objectLookupPython()}

original_mode = bpy.context.mode if hasattr(bpy.context, 'mode') else 'OBJECT'
prev_mode = original_mode
target_obj = _get_target_object("${targetIdentifier}")

if target_obj:
    bpy.context.view_layer.objects.active = target_obj
    target_obj.select_set(True)
    if prev_mode != '${targetMode}':
        try:
            bpy.ops.object.mode_set(mode='${targetMode}')
        except Exception as e:
            print(f"[ModeSwitchNotice] {e}")

try:
${innerBpy.split('\n').map(l => '    ' + l).join('\n')}
finally:
    if bpy.context.mode != 'OBJECT':
        try:
            bpy.ops.object.mode_set(mode=original_mode)
        except Exception:
            pass
`;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 2. OUTLINER & COLLECTION INTELLIGENCE (4.6)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Creates a collection and links it into hierarchy
   */
  generateCreateCollectionBpy(collectionName, parentCollectionName = null) {
    return `
import bpy

col_name = "${collectionName}"
parent_name = ${parentCollectionName ? `"${parentCollectionName}"` : 'None'}

col = bpy.data.collections.get("${collectionName}")
if not col:
    col = bpy.data.collections.new(name=col_name)
    parent_col = bpy.data.collections.get(parent_name) if parent_name else bpy.context.scene.collection
    if not parent_col:
        parent_col = bpy.context.scene.collection
    bpy.context.scene.collection.children.link(col)
`;
  }

  /**
   * Moves object into specific collection safely
   */
  generateMoveToCollectionBpy(objectIdentifier, collectionName) {
    return `
import bpy
${this._objectLookupPython(objectIdentifier, 'target_obj')}

obj = target_obj if target_obj else _get_target_object("${objectIdentifier}")
target_obj = obj
col = bpy.data.collections.get("${collectionName}")

if target_obj and col:
    # Unlink from all other collections
    for col in target_obj.users_collection:
        col.objects.unlink(target_obj)
    # Link to target collection
    target_col = col
    target_col.objects.link(target_obj)
`;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 3. MODIFIER STACK INTELLIGENCE (4.7)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Adds or configures modifier with priority-aware ordering
   */
  generateAddModifierBpy(objectIdentifier, modifierTypeOrDef, maybeProperties = {}) {
    let type = typeof modifierTypeOrDef === 'string' ? modifierTypeOrDef : (modifierTypeOrDef?.type || 'SUBSURF');
    let name = typeof modifierTypeOrDef === 'object' && modifierTypeOrDef?.name ? modifierTypeOrDef.name : (maybeProperties?.name || type);
    let properties = typeof modifierTypeOrDef === 'object' && !maybeProperties?.width && !maybeProperties?.segments
      ? (modifierTypeOrDef.properties || modifierTypeOrDef)
      : maybeProperties;

    const propAssignments = Object.entries(properties).filter(([k]) => k !== 'name' && k !== 'type').map(([k, v]) => {
      if (typeof v === 'string') return `mod.${k} = "${v}"`;
      if (typeof v === 'boolean') return `mod.${k} = ${v ? 'True' : 'False'}`;
      if (Array.isArray(v)) return `mod.${k} = (${v.join(', ')})`;
      return `mod.${k} = ${v}`;
    }).join('\n    ');

    return `
import bpy
${this._objectLookupPython(objectIdentifier, 'target_obj')}

obj = target_obj if target_obj else _get_target_object("${objectIdentifier}")
target_obj = obj
if target_obj and target_obj.type == 'MESH':
    mod_name = "${name}"
    mod = target_obj.modifiers.get(mod_name)
    if not mod:
        mod = target_obj.modifiers.new(name="${name}", type='${type}')
    
    # Configure non-destructive properties
    try:
    ${propAssignments.split('\n').map(l => '    ' + l).join('\n')}
    except Exception as e:
        print(f"[ModifierPropertyNotice] {e}")

    # Reorder according to architectural priority stack
    order_map = ${JSON.stringify(MODIFIER_ORDER_PRIORITY)}
    current_type = '${type}'
`;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 4. SHADER NODE GRAPH INTELLIGENCE (4.8)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Constructs physically plausible PBR node tree
   */
  generatePBRShaderBpy(objectIdentifier, materialParams = {}) {
    const {
      materialName = 'UNIN_Advanced_PBR',
      baseColor = [0.1, 0.1, 0.1, 1.0],
      metallic = 0.0,
      roughness = 0.5,
      specular = 0.5,
      clearcoat = 0.0,
      subsurface = 0.0,
      transmission = 0.0,
      normalStrength = 0.0,
      noiseDetail = null,
      microNoise = false,
      emissionColor = null,
      emissionStrength = 0.0
    } = materialParams;

    const hasNoise = Boolean(noiseDetail || microNoise);

    return `
import bpy
${this._objectLookupPython(objectIdentifier, 'target_obj')}

obj = target_obj if target_obj else _get_target_object("${objectIdentifier}")
if obj and hasattr(obj, 'data') and hasattr(obj.data, 'materials'):
    mat = bpy.data.materials.get("${materialName}")
    if not mat:
        mat = bpy.data.materials.new(name="${materialName}")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    # Core Nodes
    out_node = nodes.new('ShaderNodeOutputMaterial')
    out_node.location = (350, 0)
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.location = (0, 0)

    # Base PBR Inputs
    bsdf.inputs['Base Color'].default_value = (${baseColor.join(', ')})
    bsdf.inputs['Metallic'].default_value = ${metallic}
    bsdf.inputs['Roughness'].default_value = ${roughness}
    if 'Specular IOR Level' in bsdf.inputs:
        bsdf.inputs['Specular IOR Level'].default_value = ${specular}
    elif 'Specular' in bsdf.inputs:
        bsdf.inputs['Specular'].default_value = ${specular}

    # Clearcoat
    if 'Coat Weight' in bsdf.inputs:
        bsdf.inputs['Coat Weight'].default_value = ${clearcoat}
    elif 'Clearcoat' in bsdf.inputs:
        bsdf.inputs['Clearcoat'].default_value = ${clearcoat}

    # Transmission / Glass
    if 'Transmission Weight' in bsdf.inputs:
        bsdf.inputs['Transmission Weight'].default_value = ${transmission}
    elif 'Transmission' in bsdf.inputs:
        bsdf.inputs['Transmission'].default_value = ${transmission}

    # Emission
    if ${emissionStrength > 0}:
        if 'Emission Color' in bsdf.inputs:
            bsdf.inputs['Emission Color'].default_value = (${(emissionColor || [1, 1, 1, 1]).join(', ')})
            bsdf.inputs['Emission Strength'].default_value = ${emissionStrength}

    # Procedural Micro-Surface Noise
    ${hasNoise ? `
    tex_coord = nodes.new('ShaderNodeTexCoord')
    tex_coord.location = (-650, 0)
    noise = nodes.new('ShaderNodeTexNoise')
    noise.location = (-450, 0)
    noise.inputs['Scale'].default_value = ${noiseDetail?.scale || 15.0}
    noise.inputs['Detail'].default_value = ${noiseDetail?.detail || 4.0}
    noise.inputs['Roughness'].default_value = ${noiseDetail?.roughness || 0.6}
    bump = nodes.new('ShaderNodeBump')
    bump.location = (-200, -150)
    bump.inputs['Strength'].default_value = ${noiseDetail?.bumpStrength || 0.05}
    links.new(tex_coord.outputs['Object'], noise.inputs['Vector'])
    links.new(noise.outputs['Fac'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    ` : ''}

    # Connect Surface Output
    links.new(bsdf.outputs['BSDF'], out_node.inputs['Surface'])

    # Assign to object
    if len(obj.data.materials) == 0:
        obj.data.materials.append(mat)
    else:
        obj.data.materials[0] = mat
`;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 5. GEOMETRY NODES PROCEDURAL SCATTERING (4.9)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Sets up a non-destructive procedural scattering setup using Geometry Nodes
   */
  generateProceduralScatteringBpy(groundIdentifier, instanceCollectionName, optionsOrDensity = 10.0, scaleRange = [0.8, 1.2]) {
    const density = typeof optionsOrDensity === 'object' ? (optionsOrDensity.density || 10.0) : optionsOrDensity;
    return `
import bpy
${this._objectLookupPython(groundIdentifier, 'ground')}

if not ground:
    ground = _get_target_object("${groundIdentifier}")
inst_col = bpy.data.collections.get("${instanceCollectionName}")

if ground and inst_col:
    mod_name = "UNIN_Procedural_Scatter"
    mod = ground.modifiers.get(mod_name)
    if not mod:
        mod = ground.modifiers.new(name=mod_name, type='NODES')
    
    # Initialize Geometry Node Group
    group_name = "UNIN_Scatter_Group"
    ng = bpy.data.node_groups.get(group_name)
    if not ng:
        ng = bpy.data.node_groups.new(name=group_name, type='GeometryNodeTree')
        ng.interface.new_socket(name="Geometry", in_out='INPUT', socket_type='NodeSocketGeometry')
        ng.interface.new_socket(name="Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')

        nodes = ng.nodes
        links = ng.links
        nodes.clear()

        in_node = nodes.new('NodeGroupInput')
        in_node.location = (-400, 0)
        out_node = nodes.new('NodeGroupOutput')
        out_node.location = (600, 0)

        dist = nodes.new('GeometryNodeDistributePointsOnFaces')
        dist.location = (-150, -100)
        dist.inputs['Density'].default_value = ${density}

        col_info = nodes.new('GeometryNodeCollectionInfo')
        col_info.location = (-150, -300)
        col_info.inputs['Collection'].default_value = inst_col
        col_info.inputs['Separate Children'].default_value = True
        col_info.inputs['Reset Children'].default_value = True

        inst_on_pts = nodes.new('GeometryNodeInstanceOnPoints')
        inst_on_pts.location = (150, -100)
        inst_on_pts.inputs['Pick Instance'].default_value = True

        # Rotate Instances
        rot_inst = nodes.new('GeometryNodeRotateInstances')
        rot_inst.location = (250, -100)

        # Random Scale Variation
        rnd_scale = nodes.new('FunctionNodeRandomValue')
        rnd_scale.location = (-150, 100)
        rnd_scale.data_type = 'FLOAT'
        rnd_scale.inputs['Min'].default_value = ${scaleRange[0]}
        rnd_scale.inputs['Max'].default_value = ${scaleRange[1]}

        join_geo = nodes.new('GeometryNodeJoinGeometry')
        join_geo.location = (400, 0)

        links.new(in_node.outputs['Geometry'], dist.inputs['Mesh'])
        links.new(in_node.outputs['Geometry'], join_geo.inputs['Geometry'])
        links.new(dist.outputs['Points'], inst_on_pts.inputs['Points'])
        links.new(col_info.outputs['Instances'], inst_on_pts.inputs['Instance'])
        links.new(rnd_scale.outputs['Value'], inst_on_pts.inputs['Scale'])
        links.new(inst_on_pts.outputs['Instances'], rot_inst.inputs['Instances'])
        links.new(rot_inst.outputs['Instances'], join_geo.inputs['Geometry'])
        links.new(join_geo.outputs['Geometry'], out_node.inputs['Geometry'])

    mod.node_group = ng
`;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 6. CAMERA RIG & OPTICS INTELLIGENCE (4.12)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Sets up cinematic camera rig with physical tracking and DOF
   */
  generateCameraRigBpy(cameraIdentifierOrOptions, maybeTargetIdentifier = null, maybeOptics = {}) {
    let cameraIdentifier = 'Camera';
    let targetIdentifier = 'unin.camera.look_target';
    let optics = {};

    if (typeof cameraIdentifierOrOptions === 'object') {
      const opts = cameraIdentifierOrOptions;
      cameraIdentifier = opts.cameraName || opts.cameraIdentifier || 'Camera';
      targetIdentifier = opts.focusTargetId || opts.targetIdentifier || 'unin.camera.look_target';
      optics = {
        focalLength: opts.lens || opts.focalLength || 40.0,
        aperture: opts.fstop || opts.aperture || 2.8,
        sensorWidth: opts.sensorWidth || 36.0,
        trackType: opts.trackType || 'TRACK_TO'
      };
    } else {
      cameraIdentifier = cameraIdentifierOrOptions;
      targetIdentifier = maybeTargetIdentifier || 'unin.camera.look_target';
      optics = maybeOptics || {};
    }

    const {
      focalLength = 40.0,
      aperture = 2.8,
      sensorWidth = 36.0,
      trackType = 'TRACK_TO'
    } = optics;

    return `
import bpy
import math
${this._objectLookupPython(cameraIdentifier, 'cam')}
${this._objectLookupPython(targetIdentifier, 'target')}

if not cam: cam = _get_target_object("${cameraIdentifier}")
if not target: target = _get_target_object("${targetIdentifier}")
focus_target = target

if cam and cam.type == 'CAMERA':
    c_data = cam.data
    c_data.lens = ${focalLength}
    c_data.sensor_width = ${sensorWidth}
    c_data.dof.use_dof = True
    c_data.dof.aperture_fstop = ${aperture}
    c_data.dof.aperture_blades = 7

    dof = c_data.dof
    dof.use_dof = True
    dof.aperture_fstop = ${aperture}

    if focus_target:
        # Physical Distance Tracking for Depth of Field
        c_data.dof.focus_object = focus_target
        dof.focus_object = focus_target
        
        # Constraint Tracking
        track_con = cam.constraints.get("UNIN_Camera_Tracking")
        if not track_con:
            track_con = cam.constraints.new(type='${trackType}')
            track_con.name = "UNIN_Camera_Tracking"
        track_con.target = focus_target
        track_con.track_axis = 'TRACK_NEGATIVE_Z'
        track_con.up_axis = 'UP_Y'
`;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 7. RENDER PIPELINE INTELLIGENCE (4.14)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Configures render engine settings adapted to profile
   */
  generateRenderConfigBpy(qualityProfileOrOptions = 'HIGH', overrides = {}) {
    let profile = typeof qualityProfileOrOptions === 'string' ? qualityProfileOrOptions : 'HIGH';
    let opts = typeof qualityProfileOrOptions === 'object' ? qualityProfileOrOptions : overrides;

    const isCycles = (opts.engine === 'CYCLES') || profile === 'CINEMATIC' || profile === 'HERO';
    const samples = opts.samples || (isCycles ? 128 : 64);
    const viewTransform = opts.viewTransform || 'AgX';
    const look = opts.look || 'AgX - High Contrast';
    const resX = opts.resolution ? opts.resolution[0] : (opts.width || 1920);
    const resY = opts.resolution ? opts.resolution[1] : (opts.height || 1080);

    return `
import bpy

scene = bpy.context.scene
scene.render.engine = '${isCycles ? 'CYCLES' : (opts.engine || 'BLENDER_EEVEE')}'
scene.render.resolution_x = ${resX}
scene.render.resolution_y = ${resY}
scene.render.resolution_percentage = ${opts.percentage || 100}

# Color Management
scene.view_settings.view_transform = "${viewTransform}"
try:
    scene.view_settings.look = "${look}"
except Exception:
    pass

# Engine specific sampling
if scene.render.engine == 'CYCLES':
    scene.cycles.samples = ${samples}
    scene.cycles.use_denoising = True
elif hasattr(scene, 'eevee'):
    try:
        scene.eevee.taa_render_samples = ${samples}
    except Exception:
        pass
`;
  }
}

module.exports = {
  BlenderOperationDispatcher,
  MODIFIER_TYPE,
  MODIFIER_ORDER_PRIORITY
};
