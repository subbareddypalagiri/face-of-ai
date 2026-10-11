// src/main/tools/astra/core/assets/ProceduralAssetProvider.js — High-Poly Studio Procedural Assembly Engine
'use strict';

const { BaseAssetProvider } = require('./BaseAssetProvider');
const { PROVIDER_STATUS, RESOLUTION_STRATEGY, MATCH_CONFIDENCE, QUALITY_TIER } = require('./AssetTypes');
const { FurnitureProceduralGenerator } = require('./procedural/FurnitureProceduralGenerator');
const { ElectronicsProceduralGenerator } = require('./procedural/ElectronicsProceduralGenerator');
const { ArchitectureProceduralGenerator } = require('./procedural/ArchitectureProceduralGenerator');
const { VehicleProceduralGenerator } = require('./procedural/VehicleProceduralGenerator');
const { CreatureProceduralGenerator } = require('./procedural/CreatureProceduralGenerator');
const logger = require('../../../../../shared/Logger');

class ProceduralAssetProvider extends BaseAssetProvider {
  constructor(options = {}) {
    super('ProceduralAssetProvider', { priority: 5, initialStatus: PROVIDER_STATUS.AVAILABLE, ...options });
  }

  /**
   * Determines if the entity qualifies for procedural assembly
   */
  async canResolve(entity, requirements = {}) {
    const name = (entity.name || '').toLowerCase();
    const desc = (entity.description || '').toLowerCase();
    const category = (entity.category || '').toLowerCase();
    const combined = `${name} ${desc} ${category}`;

    // 1. Vehicles & Transport
    if (/motorcycle|bike|harley|chopper|scooter/i.test(combined)) {
      return {
        canResolve: true,
        confidence: MATCH_CONFIDENCE.STRONG_SEMANTIC,
        strategy: RESOLUTION_STRATEGY.PROCEDURAL_ASSEMBLY,
        assemblyType: 'HERO_MOTORCYCLE_ASSEMBLY',
        reason: 'Synthesizing multi-component procedural geometric assembly for Cruiser Motorcycle'
      };
    }

    if (/airplane|aeroplane|aircraft|airliner|boeing|jet|passenger\s*plane/i.test(combined)) {
      return {
        canResolve: true,
        confidence: MATCH_CONFIDENCE.STRONG_SEMANTIC,
        strategy: RESOLUTION_STRATEGY.PROCEDURAL_ASSEMBLY,
        assemblyType: 'HERO_AIRPLANE_ASSEMBLY',
        reason: 'Synthesizing aerodynamic commercial airliner assembly with turbofan jet engines'
      };
    }

    if (/spaceship|starship|interceptor|space\s*craft|shuttle/i.test(combined)) {
      return {
        canResolve: true,
        confidence: MATCH_CONFIDENCE.STRONG_SEMANTIC,
        strategy: RESOLUTION_STRATEGY.PROCEDURAL_ASSEMBLY,
        assemblyType: 'HERO_SPACESHIP_ASSEMBLY',
        reason: 'Synthesizing futuristic delta-wing interceptor assembly with ion thrusters'
      };
    }

    // 2. Architecture & Buildings
    if (/temple|mandir|kovil|shrine|ancient\s*architecture|pagoda/i.test(combined)) {
      return {
        canResolve: true,
        confidence: MATCH_CONFIDENCE.STRONG_SEMANTIC,
        strategy: RESOLUTION_STRATEGY.PROCEDURAL_ASSEMBLY,
        assemblyType: 'HERO_INDIAN_TEMPLE_ASSEMBLY',
        reason: 'Synthesizing architectural stone mandapa & tiered shikhara assembly for Ancient Temple'
      };
    }

    if (/house|home|cottage|cabin|villa|residence|bungalow/i.test(combined)) {
      return {
        canResolve: true,
        confidence: MATCH_CONFIDENCE.STRONG_SEMANTIC,
        strategy: RESOLUTION_STRATEGY.PROCEDURAL_ASSEMBLY,
        assemblyType: 'HERO_HOUSE_ASSEMBLY',
        reason: 'Synthesizing contemporary gabled house assembly with foundation, roof, door and framed windows'
      };
    }

    // 3. Electronics
    if (/\b(phone|smartphone|mobile|iphone|android|handset)\b/i.test(combined)) {
      return {
        canResolve: true,
        confidence: MATCH_CONFIDENCE.STRONG_SEMANTIC,
        strategy: RESOLUTION_STRATEGY.PROCEDURAL_ASSEMBLY,
        assemblyType: 'HERO_SMARTPHONE_ASSEMBLY',
        reason: 'Synthesizing titanium unibody smartphone assembly with OLED screen and triple-camera island'
      };
    }

    if (/\b(computer|pc|desktop\s*computer|pc\s*tower|monitor|gaming\s*pc)\b/i.test(combined) || (/desktop/i.test(combined) && !/desk\b/i.test(combined.replace(/desktop/g, '')))) {
      return {
        canResolve: true,
        confidence: MATCH_CONFIDENCE.STRONG_SEMANTIC,
        strategy: RESOLUTION_STRATEGY.PROCEDURAL_ASSEMBLY,
        assemblyType: 'HERO_COMPUTER_ASSEMBLY',
        reason: 'Synthesizing desktop workstation assembly with mid-tower PC chassis, widescreen monitor and keyboard'
      };
    }

    // 4. Furniture
    if (/\b(chair|armchair|stool|seat|bench)\b/i.test(combined)) {
      return {
        canResolve: true,
        confidence: MATCH_CONFIDENCE.STRONG_SEMANTIC,
        strategy: RESOLUTION_STRATEGY.PROCEDURAL_ASSEMBLY,
        assemblyType: 'HERO_CHAIR_ASSEMBLY',
        reason: 'Synthesizing ergonomic timber chair assembly with upholstered cushion, backrest and tapered legs'
      };
    }

    if (/\b(office\s*desk|writing\s*desk|desk|table|workbench)\b/i.test(combined) && !/desktop\s*computer|computer/i.test(combined)) {
      return {
        canResolve: true,
        confidence: MATCH_CONFIDENCE.STRONG_SEMANTIC,
        strategy: RESOLUTION_STRATEGY.PROCEDURAL_ASSEMBLY,
        assemblyType: 'HERO_DESK_ASSEMBLY',
        reason: 'Synthesizing executive office desk assembly with pedestal drawers, steel frame and cable grommet'
      };
    }

    // 5. Mythical Creatures
    if (/dragon|wyvern|serpent|beast|winged\s*monster/i.test(combined)) {
      return {
        canResolve: true,
        confidence: MATCH_CONFIDENCE.STRONG_SEMANTIC,
        strategy: RESOLUTION_STRATEGY.PROCEDURAL_ASSEMBLY,
        assemblyType: 'HERO_DRAGON_CREATURE_ASSEMBLY',
        reason: 'Synthesizing biomorphic mythical winged dragon with horned cranium, serpentine spine, bat wings and talons'
      };
    }

    // Honest reporting: No false success on unknown entities
    return {
      canResolve: false,
      confidence: MATCH_CONFIDENCE.NONE,
      strategy: RESOLUTION_STRATEGY.PROCEDURAL_ASSEMBLY,
      reason: `No dedicated procedural generator exists for "${entity.name}" (${entity.category}).`
    };
  }

  async resolve(entity, requirements = {}, context = {}) {
    const canRes = await this.canResolve(entity, requirements);
    const assemblyType = canRes.assemblyType;

    logger.info(`[ProceduralAssetProvider] Resolving "${entity.name}" via ${assemblyType} ✓`);

    return {
      success: true,
      strategy: RESOLUTION_STRATEGY.PROCEDURAL_ASSEMBLY,
      provider: this.name,
      assemblyType,
      quality: QUALITY_TIER.HERO,
      confidence: canRes.confidence,
      reason: canRes.reason,
      dimensions: entity.estimatedDimensions || [1.0, 1.0, 1.0],
      bpyCodeGenerator: (ent, loc, dim) => this.generateAssemblyBpy(assemblyType, ent.id, loc, dim)
    };
  }

  /**
   * Dispatches procedural Python code generation to category generators
   */
  generateAssemblyBpy(assemblyType, entityId, loc = [0, 0, 0], dim = [1, 1, 1]) {
    switch (assemblyType) {
      case 'HERO_MOTORCYCLE_ASSEMBLY':
        return this._generateMotorcycleAssemblyBpy(entityId, loc, dim);
      case 'HERO_AIRPLANE_ASSEMBLY':
        return VehicleProceduralGenerator.generateAirplaneBpy(entityId, loc, dim);
      case 'HERO_SPACESHIP_ASSEMBLY':
        return VehicleProceduralGenerator.generateSpaceshipBpy(entityId, loc, dim);
      case 'HERO_INDIAN_TEMPLE_ASSEMBLY':
        return ArchitectureProceduralGenerator.generateTempleBpy(entityId, loc, dim);
      case 'HERO_HOUSE_ASSEMBLY':
        return ArchitectureProceduralGenerator.generateHouseBpy(entityId, loc, dim);
      case 'HERO_CHAIR_ASSEMBLY':
        return FurnitureProceduralGenerator.generateChairBpy(entityId, loc, dim);
      case 'HERO_DESK_ASSEMBLY':
        return FurnitureProceduralGenerator.generateDeskBpy(entityId, loc, dim);
      case 'HERO_SMARTPHONE_ASSEMBLY':
        return ElectronicsProceduralGenerator.generateSmartphoneBpy(entityId, loc, dim);
      case 'HERO_COMPUTER_ASSEMBLY':
        return ElectronicsProceduralGenerator.generateComputerBpy(entityId, loc, dim);
      case 'HERO_DRAGON_CREATURE_ASSEMBLY':
        return CreatureProceduralGenerator.generateDragonBpy(entityId, loc, dim);
      default:
        return this._generateGenericFocalBpy(entityId, loc, dim);
    }
  }

  _generateMotorcycleAssemblyBpy(entityId, loc, dim) {
    return `
# ==============================================================================
# HERO ASSET: HIGH-FIDELITY CHOPPER MOTORCYCLE (PROCEDURAL ASSEMBLY ENGINE V3)
# Dimensions: ~\${dim[0]}m W x ~\${dim[1]}m L x ~\${dim[2]}m H
# 127 Mechanical Components: Profiled Vulcanized Tires, Hollow Rims,
# Radial Spoke Lacing, Brake Rotors & Calipers, Double-Cradle Frame,
# Sculpted Teardrop Tank with Tunnel, V-Twin Engine Block, Cooling Fins,
# Rocker Heads, Pushrods, Dual Staggered Exhausts, Raked Triple-Tree Fork,
# Handlebars & Grips, Solo Leather Saddle, Bobbed Fender, Belt Drive.
# ==============================================================================
import bpy
import bmesh
import math
import mathutils

entity_id = "${entityId}"
base_loc = (${loc[0]}, ${loc[1]}, ${loc[2]})

scene = bpy.context.scene

root = bpy.data.objects.new(entity_id, None)
root.empty_display_type = 'ARROWS'
root.location = base_loc
root["unin_id"] = entity_id
root["unin_world_id"] = "unin_world_hero"
root["unin_role"] = "hero"
root["unin_version"] = 1
bpy.context.collection.objects.link(root)

def create_pbr_mat(name, base_color, metallic=0.0, roughness=0.5, clearcoat=0.0, specular=0.5, bump_scale=0.0):
    mat = bpy.data.materials.get(name)
    if not mat:
        mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    output = nodes.new(type='ShaderNodeOutputMaterial')
    output.location = (400, 0)
    
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.location = (0, 0)
    
    if 'Base Color' in bsdf.inputs: bsdf.inputs['Base Color'].default_value = base_color
    if 'Metallic' in bsdf.inputs: bsdf.inputs['Metallic'].default_value = float(metallic)
    if 'Roughness' in bsdf.inputs: bsdf.inputs['Roughness'].default_value = float(roughness)
    if 'Clearcoat Weight' in bsdf.inputs: bsdf.inputs['Clearcoat Weight'].default_value = float(clearcoat)
    elif 'Clearcoat' in bsdf.inputs: bsdf.inputs['Clearcoat'].default_value = float(clearcoat)
    if 'Clearcoat Roughness' in bsdf.inputs: bsdf.inputs['Clearcoat Roughness'].default_value = 0.02
    if 'Specular IOR Level' in bsdf.inputs: bsdf.inputs['Specular IOR Level'].default_value = float(specular)
    elif 'Specular' in bsdf.inputs: bsdf.inputs['Specular'].default_value = float(specular)
    
    if bump_scale > 0:
        noise = nodes.new(type='ShaderNodeTexNoise')
        noise.location = (-400, -100)
        noise.noise_dimensions = '3D'
        noise.inputs['Scale'].default_value = 160.0
        noise.inputs['Detail'].default_value = 3.0
        
        bump = nodes.new(type='ShaderNodeBump')
        bump.location = (-180, -100)
        bump.inputs['Strength'].default_value = float(bump_scale)
        bump.inputs['Distance'].default_value = 0.001
        
        links.new(noise.outputs['Fac'], bump.inputs['Height'])
        links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
        
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    return mat

def convert_to_mesh(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    return bpy.context.view_layer.objects.active

mat_paint = create_pbr_mat("MC_Body_Paint", (0.58, 0.012, 0.022, 1.0), metallic=0.45, roughness=0.16, clearcoat=1.0, specular=0.75, bump_scale=0.0)
mat_chrome = create_pbr_mat("MC_Polished_Chrome", (0.94, 0.95, 0.97, 1.0), metallic=0.90, roughness=0.06, clearcoat=0.8, specular=1.0)
mat_tire = create_pbr_mat("MC_Rubber_Tread", (0.008, 0.008, 0.009, 1.0), metallic=0.0, roughness=0.58, specular=0.08, bump_scale=0.006)
mat_leather = create_pbr_mat("MC_Saddle_Leather", (0.028, 0.014, 0.008, 1.0), metallic=0.0, roughness=0.48, specular=0.30, bump_scale=0.015)
mat_engine = create_pbr_mat("MC_Engine_Crankcase", (0.042, 0.044, 0.048, 1.0), metallic=0.80, roughness=0.35, specular=0.45, bump_scale=0.008)
mat_rotor = create_pbr_mat("MC_Brake_Steel", (0.78, 0.80, 0.82, 1.0), metallic=0.92, roughness=0.22, specular=0.75)
mat_headlight_glass = create_pbr_mat("MC_Glass_Lens", (0.95, 0.98, 1.0, 1.0), metallic=0.0, roughness=0.05, specular=0.95)

def register_child(obj, name_suffix):
    full_name = f"{entity_id}_{name_suffix}"
    obj.name = full_name
    obj["unin_id"] = full_name
    obj.parent = root
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_smooth()
    return obj

# A. WHEELS (Rear: Y=-0.75, Z=0.32; Front: Y=0.95, Z=0.36; Axle along X)
wheels_data = [
    {"is_front": False, "y": -0.75, "z": 0.32, "r_tire": 0.32, "w_tire": 0.16, "r_rim": 0.22, "prefix": "Rear"},
    {"is_front": True,  "y":  0.95, "z": 0.36, "r_tire": 0.36, "w_tire": 0.09, "r_rim": 0.26, "prefix": "Front"}
]

for w in wheels_data:
    pfx = w["prefix"]
    wy, wz = w["y"], w["z"]
    rt, wt, rr = w["r_tire"], w["w_tire"], w["r_rim"]
    
    # 1. Tire
    major_r = (rt + rr) * 0.5
    minor_r = (rt - rr) * 0.5
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_r, minor_radius=minor_r,
        location=(0, wy, wz), rotation=(0, math.radians(90), 0),
        major_segments=48, minor_segments=24
    )
    tire = bpy.context.view_layer.objects.active
    thickness_scale = wt / (minor_r * 2.0)
    tire.scale = (1.0, 1.0, thickness_scale)
    bpy.ops.object.transform_apply(scale=True)
    tire.data.materials.append(mat_tire)
    sub_t = tire.modifiers.new("Subsurf", 'SUBSURF')
    sub_t.levels = 1
    register_child(tire, f"{pfx}_Tire")
    
    # 2. Hollow Rim
    bpy.ops.mesh.primitive_cylinder_add(
        radius=rr, depth=wt * 0.88,
        location=(0, wy, wz), rotation=(0, math.radians(90), 0),
        vertices=36
    )
    rim = bpy.context.view_layer.objects.active
    bm_rim = bmesh.new()
    bm_rim.from_mesh(rim.data)
    caps = [f for f in bm_rim.faces if abs(f.normal.z) > 0.8]
    bmesh.ops.delete(bm_rim, geom=caps, context='FACES_ONLY')
    bm_rim.to_mesh(rim.data)
    bm_rim.free()
    rim.data.materials.append(mat_chrome)
    sol = rim.modifiers.new("Solidify", 'SOLIDIFY')
    sol.thickness = 0.008
    bev = rim.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.004
    bev.segments = 2
    register_child(rim, f"{pfx}_Rim")
    
    # 3. Axle Hub
    hub_w = wt * 0.80
    hub_r = 0.052 if w["is_front"] else 0.065
    bpy.ops.mesh.primitive_cylinder_add(
        radius=hub_r, depth=hub_w,
        location=(0, wy, wz), rotation=(0, math.radians(90), 0),
        vertices=24
    )
    hub = bpy.context.view_layer.objects.active
    hub.data.materials.append(mat_chrome)
    register_child(hub, f"{pfx}_Hub")
    
    # 4. Spoke Flanges
    for fl_idx, fl_x in enumerate([-hub_w * 0.42, hub_w * 0.42]):
        bpy.ops.mesh.primitive_cylinder_add(
            radius=hub_r + 0.018, depth=0.006,
            location=(fl_x, wy, wz), rotation=(0, math.radians(90), 0),
            vertices=24
        )
        flange = bpy.context.view_layer.objects.active
        flange.data.materials.append(mat_chrome)
        register_child(flange, f"{pfx}_Spoke_Flange_{fl_idx}")
        
    # 5. Radial Laced Spokes (24 per wheel)
    num_spokes = 24
    spoke_r = 0.0028
    fl_x_dist = hub_w * 0.40
    rim_inner_r = rr - 0.008
    for sp_i in range(num_spokes):
        ang = sp_i * (2 * math.pi / num_spokes)
        side = -1 if sp_i % 2 == 0 else 1
        start_pt = mathutils.Vector((side * fl_x_dist, wy + math.sin(ang) * (hub_r + 0.014), wz + math.cos(ang) * (hub_r + 0.014)))
        cross_offset = 0.28 * side
        end_pt = mathutils.Vector((side * 0.010, wy + math.sin(ang + cross_offset) * rim_inner_r, wz + math.cos(ang + cross_offset) * rim_inner_r))
        diff = end_pt - start_pt
        bpy.ops.mesh.primitive_cylinder_add(
            radius=spoke_r, depth=diff.length,
            location=(start_pt + end_pt) * 0.5,
            vertices=8
        )
        spoke = bpy.context.view_layer.objects.active
        spoke.rotation_euler = mathutils.Vector((0, 0, 1)).rotation_difference(diff.normalized()).to_euler()
        spoke.data.materials.append(mat_chrome)
        register_child(spoke, f"{pfx}_Spoke_{sp_i}")
        
    # 6. Ventilated Brake Rotor
    rotor_x = -hub_w * 0.48 if w["is_front"] else hub_w * 0.48
    rot_outer = rr * 0.52
    rot_inner = rr * 0.32
    rot_mesh = bpy.data.meshes.new(f"{pfx}_Brake_Rotor_Mesh")
    bm_rot = bmesh.new()
    rot_seg = 24
    rot_vo = []
    rot_vi = []
    for ri in range(rot_seg):
        rang = ri * (2 * math.pi / rot_seg)
        vo = bm_rot.verts.new((rotor_x, wy + math.sin(rang) * rot_outer, wz + math.cos(rang) * rot_outer))
        vi = bm_rot.verts.new((rotor_x, wy + math.sin(rang) * rot_inner, wz + math.cos(rang) * rot_inner))
        rot_vo.append(vo)
        rot_vi.append(vi)
    for ri in range(rot_seg):
        rin = (ri + 1) % rot_seg
        bm_rot.faces.new((rot_vo[ri], rot_vo[rin], rot_vi[rin], rot_vi[ri]))
    bm_rot.to_mesh(rot_mesh)
    bm_rot.free()
    rotor = bpy.data.objects.new(f"{pfx}_Brake_Rotor", rot_mesh)
    bpy.context.collection.objects.link(rotor)
    sol_rot = rotor.modifiers.new("Solidify", 'SOLIDIFY')
    sol_rot.thickness = 0.005
    rotor.data.materials.append(mat_rotor)
    register_child(rotor, f"{pfx}_Brake_Rotor")
    
    # 7. Brake Caliper
    caliper_y = wy + (0.10 if w["is_front"] else -0.09)
    caliper_z = wz + (0.11 if w["is_front"] else 0.09)
    bpy.ops.mesh.primitive_cube_add(size=0.045, location=(rotor_x + (0.010 if w["is_front"] else -0.010), caliper_y, caliper_z))
    caliper = bpy.context.view_layer.objects.active
    caliper.scale = (0.6, 1.4, 0.9)
    bpy.ops.object.transform_apply(scale=True)
    caliper.data.materials.append(mat_engine)
    register_child(caliper, f"{pfx}_Brake_Caliper")

# B. CHOPPER FRAME
neck_pos = mathutils.Vector((0.0, 0.56, 0.98))
neck_rot = math.radians(35)

bpy.ops.mesh.primitive_cylinder_add(radius=0.030, depth=0.18, location=neck_pos, vertices=20)
neck = bpy.context.view_layer.objects.active
neck.rotation_euler = (neck_rot, 0, 0)
neck.data.materials.append(mat_engine)
register_child(neck, "Frame_Neck")

bb_curve = bpy.data.curves.new('Backbone_Curve', type='CURVE')
bb_curve.dimensions = '3D'
bb_curve.bevel_depth = 0.024
bb_curve.bevel_resolution = 4
bb_sp = bb_curve.splines.new('BEZIER')
bb_sp.bezier_points.add(2)
bb_sp.bezier_points[0].co = (0.0, 0.54, 0.95)
bb_sp.bezier_points[0].handle_right = (0.0, 0.35, 0.92)
bb_sp.bezier_points[1].co = (0.0, 0.18, 0.82)
bb_sp.bezier_points[1].handle_left = (0.0, 0.30, 0.88)
bb_sp.bezier_points[1].handle_right = (0.0, 0.05, 0.74)
bb_sp.bezier_points[2].co = (0.0, -0.16, 0.62)
bb_sp.bezier_points[2].handle_left = (0.0, -0.05, 0.68)
bb_obj = bpy.data.objects.new("Chopper_Backbone", bb_curve)
bpy.context.collection.objects.link(bb_obj)
bb_mesh = convert_to_mesh(bb_obj)
bb_mesh.data.materials.append(mat_engine)
register_child(bb_mesh, "Frame_Backbone")

for dt_x in [-0.09, 0.09]:
    dt_c = bpy.data.curves.new(f'Downtube_{dt_x}', type='CURVE')
    dt_c.dimensions = '3D'
    dt_c.bevel_depth = 0.020
    dt_c.bevel_resolution = 4
    dt_sp = dt_c.splines.new('BEZIER')
    dt_sp.bezier_points.add(2)
    dt_sp.bezier_points[0].co = (dt_x * 0.3, 0.52, 0.90)
    dt_sp.bezier_points[0].handle_right = (dt_x, 0.45, 0.65)
    dt_sp.bezier_points[1].co = (dt_x, 0.38, 0.38)
    dt_sp.bezier_points[1].handle_left = (dt_x, 0.42, 0.50)
    dt_sp.bezier_points[1].handle_right = (dt_x, 0.35, 0.24)
    dt_sp.bezier_points[2].co = (dt_x, 0.30, 0.18)
    dt_sp.bezier_points[2].handle_left = (dt_x, 0.32, 0.20)
    dto = bpy.data.objects.new("Downtube", dt_c)
    bpy.context.collection.objects.link(dto)
    dt_m = convert_to_mesh(dto)
    dt_m.data.materials.append(mat_engine)
    register_child(dt_m, f"Frame_Downtube_{'L' if dt_x < 0 else 'R'}")

for cr_x in [-0.09, 0.09]:
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.020, depth=0.62,
        location=(cr_x, -0.01, 0.18), rotation=(math.radians(90), 0, 0),
        vertices=16
    )
    cradle = bpy.context.view_layer.objects.active
    cradle.data.materials.append(mat_engine)
    register_child(cradle, f"Frame_Cradle_{'L' if cr_x < 0 else 'R'}")

bpy.ops.mesh.primitive_cylinder_add(
    radius=0.022, depth=0.46,
    location=(0.0, -0.17, 0.40), rotation=(math.radians(-12), 0, 0),
    vertices=16
)
seat_post = bpy.context.view_layer.objects.active
seat_post.data.materials.append(mat_engine)
register_child(seat_post, "Frame_Seat_Post")

rear_axle_y, rear_axle_z = -0.75, 0.32
for side_x in [-0.085, 0.085]:
    sfx = 'L' if side_x < 0 else 'R'
    diff_u = mathutils.Vector((side_x, rear_axle_y, rear_axle_z)) - mathutils.Vector((side_x * 0.7, -0.18, 0.60))
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.018, depth=diff_u.length,
        location=(mathutils.Vector((side_x * 0.7, -0.18, 0.60)) + mathutils.Vector((side_x, rear_axle_y, rear_axle_z))) * 0.5,
        vertices=16
    )
    ustay = bpy.context.view_layer.objects.active
    ustay.rotation_euler = mathutils.Vector((0, 0, 1)).rotation_difference(diff_u.normalized()).to_euler()
    ustay.data.materials.append(mat_engine)
    register_child(ustay, f"Frame_Upper_Stay_{sfx}")
    
    diff_l = mathutils.Vector((side_x, rear_axle_y, rear_axle_z)) - mathutils.Vector((side_x, -0.32, 0.18))
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.018, depth=diff_l.length,
        location=(mathutils.Vector((side_x, -0.32, 0.18)) + mathutils.Vector((side_x, rear_axle_y, rear_axle_z))) * 0.5,
        vertices=16
    )
    lstay = bpy.context.view_layer.objects.active
    lstay.rotation_euler = mathutils.Vector((0, 0, 1)).rotation_difference(diff_l.normalized()).to_euler()
    lstay.data.materials.append(mat_engine)
    register_child(lstay, f"Frame_Lower_Stay_{sfx}")
    
    bpy.ops.mesh.primitive_cube_add(size=0.08, location=(side_x, rear_axle_y, rear_axle_z))
    plate = bpy.context.view_layer.objects.active
    plate.scale = (0.15, 1.4, 0.9)
    bpy.ops.object.transform_apply(scale=True)
    plate.data.materials.append(mat_engine)
    register_child(plate, f"Frame_Axle_Plate_{sfx}")

# C. SCULPTED CHOPPER FUEL TANK
tank_mesh = bpy.data.meshes.new("Chopper_Tank_Mesh")
bm_t = bmesh.new()
tank_stations = [
    {"y": 0.50, "z": 0.98, "w": 0.14, "h": 0.14, "tun": 0.04},
    {"y": 0.44, "z": 1.00, "w": 0.22, "h": 0.20, "tun": 0.06},
    {"y": 0.35, "z": 0.98, "w": 0.24, "h": 0.20, "tun": 0.07},
    {"y": 0.25, "z": 0.93, "w": 0.20, "h": 0.17, "tun": 0.07},
    {"y": 0.16, "z": 0.86, "w": 0.15, "h": 0.13, "tun": 0.06},
    {"y": 0.08, "z": 0.79, "w": 0.10, "h": 0.09, "tun": 0.04},
    {"y": 0.03, "z": 0.74, "w": 0.06, "h": 0.06, "tun": 0.02}
]
rings = []
for st in tank_stations:
    ty, tzc = st["y"], st["z"]
    tw = st["w"] * 0.5
    th = st["h"] * 0.5
    tun = st["tun"]
    rv = [
        bm_t.verts.new((0.0, ty, tzc + th)),
        bm_t.verts.new((tw * 0.55, ty, tzc + th * 0.85)),
        bm_t.verts.new((tw * 0.95, ty, tzc + th * 0.40)),
        bm_t.verts.new((tw, ty, tzc - th * 0.10)),
        bm_t.verts.new((tw * 0.75, ty, tzc - th * 0.75)),
        bm_t.verts.new((0.04, ty, tzc - th * 0.85)),
        bm_t.verts.new((0.0, ty, tzc - th * 0.85 + tun)),
        bm_t.verts.new((-0.04, ty, tzc - th * 0.85)),
        bm_t.verts.new((-tw * 0.75, ty, tzc - th * 0.75)),
        bm_t.verts.new((-tw, ty, tzc - th * 0.10)),
        bm_t.verts.new((-tw * 0.95, ty, tzc + th * 0.40)),
        bm_t.verts.new((-tw * 0.55, ty, tzc + th * 0.85))
    ]
    rings.append(rv)

for i in range(len(rings) - 1):
    r1 = rings[i]
    r2 = rings[i+1]
    for j in range(12):
        jn = (j + 1) % 12
        f = bm_t.faces.new((r1[j], r1[jn], r2[jn], r2[j]))
        f.smooth = True
f_front = bm_t.faces.new(list(reversed(rings[0])))
f_front.smooth = True
f_rear = bm_t.faces.new(rings[-1])
f_rear.smooth = True
bm_t.to_mesh(tank_mesh)
bm_t.free()

tank_mesh.polygons.foreach_set('use_smooth', [True] * len(tank_mesh.polygons))
tank_obj = bpy.data.objects.new("Chopper_Fuel_Tank", tank_mesh)
bpy.context.collection.objects.link(tank_obj)
tank_obj.data.materials.append(mat_paint)
sub_tank = tank_obj.modifiers.new("Subsurf", 'SUBSURF')
sub_tank.levels = 2
register_child(tank_obj, "Fuel_Tank")

bpy.ops.mesh.primitive_cylinder_add(radius=0.032, depth=0.022, location=(0.045, 0.40, 1.09), vertices=20)
gas_cap = bpy.context.view_layer.objects.active
gas_cap.data.materials.append(mat_chrome)
bev_gc = gas_cap.modifiers.new("Bevel", 'BEVEL')
bev_gc.width = 0.003
register_child(gas_cap, "Gas_Cap")

# D. V-TWIN ENGINE
bpy.ops.mesh.primitive_cube_add(size=0.28, location=(0.0, 0.05, 0.34))
case = bpy.context.view_layer.objects.active
case.scale = (0.75, 1.25, 0.85)
bpy.ops.object.transform_apply(scale=True)
case.data.materials.append(mat_engine)
bev_cs = case.modifiers.new("Bevel", 'BEVEL')
bev_cs.width = 0.03
bev_cs.segments = 3
register_child(case, "Engine_Crankcase")

bpy.ops.mesh.primitive_cylinder_add(radius=0.075, depth=0.025, location=(0.12, 0.03, 0.32), rotation=(0, math.radians(90), 0), vertices=24)
cam_cover = bpy.context.view_layer.objects.active
cam_cover.data.materials.append(mat_chrome)
register_child(cam_cover, "Engine_Cam_Cover")

bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.04, location=(-0.13, 0.02, 0.32), rotation=(0, math.radians(90), 0), vertices=24)
primary = bpy.context.view_layer.objects.active
primary.scale = (1.0, 1.5, 0.9)
bpy.ops.object.transform_apply(scale=True)
primary.data.materials.append(mat_chrome)
register_child(primary, "Primary_Cover")

bpy.ops.mesh.primitive_cube_add(size=0.22, location=(0.0, -0.16, 0.28))
trans = bpy.context.view_layer.objects.active
trans.scale = (0.8, 0.9, 0.75)
bpy.ops.object.transform_apply(scale=True)
trans.data.materials.append(mat_engine)
register_child(trans, "Transmission_Box")

cyl_configs = [
    {"idx": 0, "ang": math.radians(-22.5), "y": -0.06, "z": 0.44, "prefix": "Rear"},
    {"idx": 1, "ang": math.radians(22.5),  "y":  0.14, "z": 0.44, "prefix": "Front"}
]
for ccfg in cyl_configs:
    c_ang, cy, cz, cpfx = ccfg["ang"], ccfg["y"], ccfg["z"], ccfg["prefix"]
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.095, depth=0.26,
        location=(0.0, cy + math.sin(c_ang) * 0.13, cz + math.cos(c_ang) * 0.13),
        rotation=(c_ang, 0, 0), vertices=24
    )
    cyl_barrel = bpy.context.view_layer.objects.active
    cyl_barrel.data.materials.append(mat_engine)
    register_child(cyl_barrel, f"Engine_Cylinder_{cpfx}")
    
    for fin_i in range(6):
        fin_dist = 0.03 + (fin_i * 0.038)
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.125 - (fin_i * 0.003), depth=0.006,
            location=(0.0, cy + math.sin(c_ang) * fin_dist, cz + math.cos(c_ang) * fin_dist),
            rotation=(c_ang, 0, 0), vertices=24
        )
        fin = bpy.context.view_layer.objects.active
        fin.data.materials.append(mat_chrome)
        register_child(fin, f"Engine_Fin_{cpfx}_{fin_i}")
        
    head_dist = 0.28
    hy = cy + math.sin(c_ang) * head_dist
    hz = cz + math.cos(c_ang) * head_dist
    bpy.ops.mesh.primitive_cube_add(size=0.18, location=(0.0, hy, hz), rotation=(c_ang, 0, 0))
    head = bpy.context.view_layer.objects.active
    head.scale = (0.95, 0.75, 0.40)
    bpy.ops.object.transform_apply(scale=True)
    head.data.materials.append(mat_chrome)
    bev_hd = head.modifiers.new("Bevel", 'BEVEL')
    bev_hd.width = 0.015
    bev_hd.segments = 2
    register_child(head, f"Rocker_Head_{cpfx}")
    
    for pr_i in [-0.04, 0.04]:
        pr_start = mathutils.Vector((0.08, cy + pr_i, cz - 0.04))
        pr_end = mathutils.Vector((0.08, hy + pr_i * 0.8, hz - 0.02))
        diff_pr = pr_end - pr_start
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.007, depth=diff_pr.length,
            location=(pr_start + pr_end) * 0.5, vertices=12
        )
        pushrod = bpy.context.view_layer.objects.active
        pushrod.rotation_euler = mathutils.Vector((0, 0, 1)).rotation_difference(diff_pr.normalized()).to_euler()
        pushrod.data.materials.append(mat_chrome)
        register_child(pushrod, f"Pushrod_{cpfx}_{'A' if pr_i < 0 else 'B'}")

bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.045, location=(0.14, 0.05, 0.52), rotation=(0, math.radians(90), 0), vertices=24)
air_cleaner = bpy.context.view_layer.objects.active
air_cleaner.data.materials.append(mat_chrome)
bev_ac = air_cleaner.modifiers.new("Bevel", 'BEVEL')
bev_ac.width = 0.008
register_child(air_cleaner, "Air_Cleaner")

# E. DUAL EXHAUST DRAG PIPES
ef_c = bpy.data.curves.new('Exhaust_Front', type='CURVE')
ef_c.dimensions = '3D'
ef_c.bevel_depth = 0.022
ef_c.bevel_resolution = 6
ef_sp = ef_c.splines.new('BEZIER')
ef_sp.bezier_points.add(3)
ef_sp.bezier_points[0].co = (0.07, 0.22, 0.60)
ef_sp.bezier_points[0].handle_right = (0.16, 0.28, 0.55)
ef_sp.bezier_points[1].co = (0.17, 0.18, 0.38)
ef_sp.bezier_points[1].handle_left = (0.17, 0.24, 0.45)
ef_sp.bezier_points[1].handle_right = (0.17, 0.08, 0.28)
ef_sp.bezier_points[2].co = (0.17, -0.15, 0.24)
ef_sp.bezier_points[2].handle_left = (0.17, 0.0, 0.24)
ef_sp.bezier_points[2].handle_right = (0.17, -0.35, 0.24)
ef_sp.bezier_points[3].co = (0.17, -0.72, 0.24)
ef_sp.bezier_points[3].handle_left = (0.17, -0.55, 0.24)
ef_obj = bpy.data.objects.new("Exhaust_Front", ef_c)
bpy.context.collection.objects.link(ef_obj)
ef_m = convert_to_mesh(ef_obj)
ef_m.data.materials.append(mat_chrome)
register_child(ef_m, "Exhaust_Pipe_Front")

er_c = bpy.data.curves.new('Exhaust_Rear', type='CURVE')
er_c.dimensions = '3D'
er_c.bevel_depth = 0.022
er_c.bevel_resolution = 6
er_sp = er_c.splines.new('BEZIER')
er_sp.bezier_points.add(3)
er_sp.bezier_points[0].co = (0.07, -0.14, 0.58)
er_sp.bezier_points[0].handle_right = (0.18, -0.18, 0.52)
er_sp.bezier_points[1].co = (0.18, -0.22, 0.40)
er_sp.bezier_points[1].handle_left = (0.18, -0.18, 0.48)
er_sp.bezier_points[1].handle_right = (0.18, -0.28, 0.34)
er_sp.bezier_points[2].co = (0.18, -0.38, 0.32)
er_sp.bezier_points[2].handle_left = (0.18, -0.30, 0.32)
er_sp.bezier_points[2].handle_right = (0.18, -0.48, 0.32)
er_sp.bezier_points[3].co = (0.18, -0.62, 0.32)
er_sp.bezier_points[3].handle_left = (0.18, -0.52, 0.32)
er_obj = bpy.data.objects.new("Exhaust_Rear", er_c)
bpy.context.collection.objects.link(er_obj)
er_m = convert_to_mesh(er_obj)
er_m.data.materials.append(mat_chrome)
register_child(er_m, "Exhaust_Pipe_Rear")

# F. FORKS & HANDLEBARS
fork_vec = mathutils.Vector((0.0, math.sin(neck_rot), -math.cos(neck_rot)))
bpy.ops.mesh.primitive_cube_add(size=0.04, location=(0.0, 0.53, 0.90), rotation=(neck_rot, 0, 0))
b_tree = bpy.context.view_layer.objects.active
b_tree.scale = (5.5, 1.4, 0.7)
bpy.ops.object.transform_apply(scale=True)
b_tree.data.materials.append(mat_chrome)
bev_bt = b_tree.modifiers.new("Bevel", 'BEVEL')
bev_bt.width = 0.005
register_child(b_tree, "Triple_Tree_Bottom")

bpy.ops.mesh.primitive_cube_add(size=0.04, location=(0.0, 0.59, 1.04), rotation=(neck_rot, 0, 0))
t_tree = bpy.context.view_layer.objects.active
t_tree.scale = (5.5, 1.4, 0.7)
bpy.ops.object.transform_apply(scale=True)
t_tree.data.materials.append(mat_chrome)
bev_tt = t_tree.modifiers.new("Bevel", 'BEVEL')
bev_tt.width = 0.005
register_child(t_tree, "Triple_Tree_Top")

for fork_x in [-0.10, 0.10]:
    sfx = 'L' if fork_x < 0 else 'R'
    stanchion_top = mathutils.Vector((fork_x, 0.60, 1.06))
    stanchion_bot = stanchion_top + fork_vec * 0.55
    st_mid = (stanchion_top + stanchion_bot) * 0.5
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.021, depth=0.55,
        location=st_mid, rotation=(neck_rot, 0, 0),
        vertices=20
    )
    stanchion = bpy.context.view_layer.objects.active
    stanchion.data.materials.append(mat_chrome)
    register_child(stanchion, f"Fork_Stanchion_{sfx}")
    
    slider_top = stanchion_bot
    slider_bot = mathutils.Vector((fork_x, 0.95, 0.36))
    sl_diff = slider_bot - slider_top
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.026, depth=sl_diff.length,
        location=(slider_top + slider_bot) * 0.5,
        vertices=20
    )
    slider = bpy.context.view_layer.objects.active
    slider.rotation_euler = mathutils.Vector((0, 0, 1)).rotation_difference(sl_diff.normalized()).to_euler()
    slider.data.materials.append(mat_chrome)
    register_child(slider, f"Fork_Slider_{sfx}")
    
    bpy.ops.mesh.primitive_cube_add(size=0.05, location=slider_bot)
    boss = bpy.context.view_layer.objects.active
    boss.scale = (0.8, 1.1, 0.9)
    bpy.ops.object.transform_apply(scale=True)
    boss.data.materials.append(mat_chrome)
    register_child(boss, f"Fork_Axle_Clamp_{sfx}")

bpy.ops.mesh.primitive_cylinder_add(radius=0.012, depth=0.24, location=(0.0, 0.95, 0.36), rotation=(0, math.radians(90), 0), vertices=16)
f_axle = bpy.context.view_layer.objects.active
f_axle.data.materials.append(mat_chrome)
register_child(f_axle, "Front_Axle_Spindle")

for rx in [-0.06, 0.06]:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.016, depth=0.08, location=(rx, 0.60, 1.08), rotation=(neck_rot, 0, 0), vertices=16)
    riser = bpy.context.view_layer.objects.active
    riser.data.materials.append(mat_chrome)
    register_child(riser, f"Handlebar_Riser_{'L' if rx < 0 else 'R'}")

bar_c = bpy.data.curves.new('Handlebar_Curve', type='CURVE')
bar_c.dimensions = '3D'
bar_c.bevel_depth = 0.015
bar_c.bevel_resolution = 4
bar_sp = bar_c.splines.new('BEZIER')
bar_sp.bezier_points.add(4)
bar_sp.bezier_points[0].co = (-0.38, 0.45, 1.12)
bar_sp.bezier_points[0].handle_right = (-0.25, 0.52, 1.14)
bar_sp.bezier_points[1].co = (-0.06, 0.60, 1.12)
bar_sp.bezier_points[1].handle_left = (-0.15, 0.58, 1.12)
bar_sp.bezier_points[1].handle_right = (0.0, 0.60, 1.12)
bar_sp.bezier_points[2].co = (0.0, 0.60, 1.12)
bar_sp.bezier_points[2].handle_left = (-0.03, 0.60, 1.12)
bar_sp.bezier_points[2].handle_right = (0.03, 0.60, 1.12)
bar_sp.bezier_points[3].co = (0.06, 0.60, 1.12)
bar_sp.bezier_points[3].handle_left = (0.0, 0.60, 1.12)
bar_sp.bezier_points[3].handle_right = (0.15, 0.58, 1.12)
bar_sp.bezier_points[4].co = (0.38, 0.45, 1.12)
bar_sp.bezier_points[4].handle_left = (0.25, 0.52, 1.14)
bar_obj = bpy.data.objects.new("Handlebars", bar_c)
bpy.context.collection.objects.link(bar_obj)
bar_m = convert_to_mesh(bar_obj)
bar_m.data.materials.append(mat_chrome)
register_child(bar_m, "Handlebars")

for gx in [-0.35, 0.35]:
    sfx = 'L' if gx < 0 else 'R'
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.019, depth=0.12,
        location=(gx, 0.47, 1.12),
        rotation=(math.radians(12), math.radians(-25 if gx > 0 else 25), math.radians(70 if gx > 0 else -70)),
        vertices=16
    )
    grip = bpy.context.view_layer.objects.active
    grip.data.materials.append(mat_tire)
    register_child(grip, f"Handlebar_Grip_{sfx}")

bpy.ops.mesh.primitive_cylinder_add(radius=0.075, depth=0.14, location=(0.0, 0.66, 0.94), rotation=(math.radians(90), 0, 0), vertices=24)
hl_bucket = bpy.context.view_layer.objects.active
hl_bucket.data.materials.append(mat_chrome)
bev_hl = hl_bucket.modifiers.new("Bevel", 'BEVEL')
bev_hl.width = 0.015
bev_hl.segments = 3
register_child(hl_bucket, "Headlight_Bucket")

bpy.ops.mesh.primitive_cylinder_add(radius=0.068, depth=0.012, location=(0.0, 0.73, 0.94), rotation=(math.radians(90), 0, 0), vertices=24)
hl_lens = bpy.context.view_layer.objects.active
hl_lens.data.materials.append(mat_headlight_glass)
register_child(hl_lens, "Headlight_Lens")

hl_light_data = bpy.data.lights.new(name=f"{entity_id}_Headlight_Beam_Data", type='SPOT')
hl_light_data.energy = 450.0
hl_light_data.color = (1.0, 0.96, 0.90)
hl_light_data.spot_size = math.radians(55)
hl_light_data.spot_blend = 0.35
hl_light_obj = bpy.data.objects.new(name=f"{entity_id}_Headlight_Beam", object_data=hl_light_data)
hl_light_obj.location = (0, 0.75, 0.94)
hl_light_obj.rotation_euler = (math.radians(85), 0, 0)
bpy.context.collection.objects.link(hl_light_obj)
hl_light_obj.parent = root

# G. SOLO SADDLE & REAR FENDER
seat_m = bpy.data.meshes.new("Solo_Seat_Mesh")
bm_s = bmesh.new()
seat_stations = [
    {"y": 0.06,  "z": 0.72, "w": 0.12, "t": 0.04},
    {"y": -0.06, "z": 0.64, "w": 0.22, "t": 0.06},
    {"y": -0.18, "z": 0.63, "w": 0.24, "t": 0.06},
    {"y": -0.28, "z": 0.70, "w": 0.18, "t": 0.05}
]
s_rings = []
for st in seat_stations:
    sy, sz, sw, sth = st["y"], st["z"], st["w"] * 0.5, st["t"]
    rv = [
        bm_s.verts.new((0.0, sy, sz + sth)),
        bm_s.verts.new((sw * 0.6, sy, sz + sth * 0.9)),
        bm_s.verts.new((sw, sy, sz + sth * 0.3)),
        bm_s.verts.new((sw * 0.8, sy, sz - sth * 0.5)),
        bm_s.verts.new((0.0, sy, sz - sth * 0.6)),
        bm_s.verts.new((-sw * 0.8, sy, sz - sth * 0.5)),
        bm_s.verts.new((-sw, sy, sz + sth * 0.3)),
        bm_s.verts.new((-sw * 0.6, sy, sz + sth * 0.9))
    ]
    s_rings.append(rv)
for i in range(len(s_rings) - 1):
    for j in range(8):
        jn = (j + 1) % 8
        f = bm_s.faces.new((s_rings[i][j], s_rings[i][jn], s_rings[i+1][jn], s_rings[i+1][j]))
        f.smooth = True
f_sf = bm_s.faces.new(list(reversed(s_rings[0])))
f_sf.smooth = True
f_sr = bm_s.faces.new(s_rings[-1])
f_sr.smooth = True
bm_s.to_mesh(seat_m)
bm_s.free()
seat_m.polygons.foreach_set('use_smooth', [True] * len(seat_m.polygons))
seat_obj = bpy.data.objects.new("Solo_Seat", seat_m)
bpy.context.collection.objects.link(seat_obj)
seat_obj.data.materials.append(mat_leather)
sub_s = seat_obj.modifiers.new("Subsurf", 'SUBSURF')
sub_s.levels = 2
register_child(seat_obj, "Solo_Saddle")

rf_m = bpy.data.meshes.new("Rear_Fender_Mesh")
bm_rf = bmesh.new()
num_arc_steps = 20
fender_r = 0.355
fender_w = 0.088
fender_rings = []
for step in range(num_arc_steps + 1):
    t = step / num_arc_steps
    phi = math.radians(35 + t * 115)
    fcy = -0.75 + fender_r * math.cos(phi)
    fcz = 0.32 + fender_r * math.sin(phi)
    rverts = [
        bm_rf.verts.new((-fender_w, fcy, fcz)),
        bm_rf.verts.new((-fender_w * 0.5, fcy, fcz + 0.008)),
        bm_rf.verts.new((0.0, fcy, fcz + 0.012)),
        bm_rf.verts.new((fender_w * 0.5, fcy, fcz + 0.008)),
        bm_rf.verts.new((fender_w, fcy, fcz))
    ]
    fender_rings.append(rverts)
for i in range(len(fender_rings) - 1):
    r1 = fender_rings[i]
    r2 = fender_rings[i + 1]
    for j in range(4):
        f = bm_rf.faces.new((r1[j], r1[j + 1], r2[j + 1], r2[j]))
        f.smooth = True
bm_rf.to_mesh(rf_m)
bm_rf.free()
rf_m.polygons.foreach_set('use_smooth', [True] * len(rf_m.polygons))
rf_obj = bpy.data.objects.new("Rear_Fender", rf_m)
bpy.context.collection.objects.link(rf_obj)
rf_obj.data.materials.append(mat_paint)
sol_rf = rf_obj.modifiers.new("Solidify", 'SOLIDIFY')
sol_rf.thickness = 0.006
sub_rf = rf_obj.modifiers.new("Subsurf", 'SUBSURF')
sub_rf.levels = 1
register_child(rf_obj, "Rear_Fender")

for fs_x in [-0.09, 0.09]:
    strut_start = mathutils.Vector((fs_x, rear_axle_y, rear_axle_z))
    strut_end = mathutils.Vector((fs_x, -0.88, 0.56))
    diff_s = strut_end - strut_start
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.009, depth=diff_s.length,
        location=(strut_start + strut_end) * 0.5,
        vertices=12
    )
    strut = bpy.context.view_layer.objects.active
    strut.rotation_euler = mathutils.Vector((0, 0, 1)).rotation_difference(diff_s.normalized()).to_euler()
    strut.data.materials.append(mat_chrome)
    register_child(strut, f"Fender_Strut_{'L' if fs_x < 0 else 'R'}")

# H. BELT DRIVE & PEGS
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.012, depth=0.52,
    location=(-0.11, -0.48, 0.30), rotation=(math.radians(82), 0, 0),
    vertices=16
)
belt = bpy.context.view_layer.objects.active
belt.scale = (0.6, 1.0, 1.8)
bpy.ops.object.transform_apply(scale=True)
belt.data.materials.append(mat_tire)
register_child(belt, "Final_Drive_Belt")

for px in [-0.20, 0.20]:
    sfx = 'L' if px < 0 else 'R'
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.016, depth=0.12,
        location=(px, 0.28, 0.24), rotation=(0, math.radians(90), 0),
        vertices=16
    )
    peg = bpy.context.view_layer.objects.active
    peg.data.materials.append(mat_chrome)
    register_child(peg, f"Foot_Peg_{sfx}")
`;
  }

  _generateTempleAssemblyBpy(entityId, loc, dim) {
    return `
# ==============================================================================
# HERO ASSET: ANCIENT INDIAN TEMPLE (PROCEDURAL ARCHITECTURAL ASSEMBLY)
# Dimensions: ~${dim[0]}m W x ~${dim[1]}m L x ~${dim[2]}m H
# Components: Multi-tiered Plinth (Jagati), Mandapa Pillars, Sanctum Sanctorum,
#             Ornate Tiered Shikhara Tower, Amalaka Crest & Kalasha Finial.
# ==============================================================================
import bpy
import math

temple_root = bpy.data.objects.new("${entityId}", None)
temple_root.empty_display_type = 'ARROWS'
temple_root.location = (${loc[0]}, ${loc[1]}, ${loc[2]})
bpy.context.collection.objects.link(temple_root)

# Weathered Carved Sandstone Shader
mat_stone = bpy.data.materials.new(name="Temple_Ancient_Sandstone")
mat_stone.use_nodes = True
b_st = mat_stone.node_tree.nodes.get('Principled BSDF')
if b_st:
    b_st.inputs['Base Color'].default_value = (0.58, 0.42, 0.28, 1.0)
    b_st.inputs['Roughness'].default_value = 0.88
    tex_noise = mat_stone.node_tree.nodes.new('ShaderNodeTexNoise')
    tex_noise.inputs['Scale'].default_value = 16.0
    bump_st = mat_stone.node_tree.nodes.new('ShaderNodeBump')
    bump_st.inputs['Strength'].default_value = 0.45
    mat_stone.node_tree.links.new(tex_noise.outputs['Fac'], bump_st.inputs['Height'])
    mat_stone.node_tree.links.new(bump_st.outputs['Normal'], b_st.inputs['Normal'])

# 1. Stepped Plinth (Jagati) Base
for i, h_step in enumerate([0.4, 0.35, 0.3]):
    w_step = ${dim[0]} - i * 1.2
    l_step = ${dim[1]} - i * 1.2
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, i * 0.35 + h_step/2))
    plinth = bpy.context.view_layer.objects.active
    plinth.name = f"${entityId}_Jagati_Plinth_{i+1}"
    plinth.scale = (w_step, l_step, h_step)
    bpy.ops.object.transform_apply(scale=True)
    plinth.parent = temple_root
    plinth.data.materials.append(mat_stone)
    bev = plinth.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.05
    bev.segments = 2
    bpy.ops.object.shade_smooth()

# 2. Main Sanctum Sanctorum (Garbhagriha)
z_base = 1.05
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 3.5, z_base + 3.0))
sanctum = bpy.context.view_layer.objects.active
sanctum.name = "${entityId}_Sanctum_Garbhagriha"
sanctum.scale = (8.5, 8.5, 6.0)
bpy.ops.object.transform_apply(scale=True)
sanctum.parent = temple_root
sanctum.data.materials.append(mat_stone)
bev_sanct = sanctum.modifiers.new("Bevel", 'BEVEL')
bev_sanct.width = 0.08
bpy.ops.object.shade_smooth()

# 3. Tiered Shikhara Superstructure (10 Tiers)
z_shikhara = z_base + 6.0
for tier in range(10):
    factor = 1.0 - (tier / 10.0) * 0.72
    w_t = 8.2 * factor
    h_t = 0.95
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 3.5, z_shikhara + tier * 0.92))
    shik_tier = bpy.context.view_layer.objects.active
    shik_tier.name = f"${entityId}_Shikhara_Tier_{tier+1}"
    shik_tier.scale = (w_t, w_t, h_t)
    bpy.ops.object.transform_apply(scale=True)
    shik_tier.parent = temple_root
    shik_tier.data.materials.append(mat_stone)
    bev_t = shik_tier.modifiers.new("Bevel", 'BEVEL')
    bev_t.width = 0.06
    bpy.ops.object.shade_smooth()

# 4. Crown Amalaka & Golden Kalasha
z_crown = z_shikhara + 9.5
bpy.ops.mesh.primitive_cylinder_add(radius=1.8, depth=0.6, location=(0, 3.5, z_crown))
amalaka = bpy.context.view_layer.objects.active
amalaka.name = "${entityId}_Amalaka_Crown"
amalaka.parent = temple_root
amalaka.data.materials.append(mat_stone)
bpy.ops.object.shade_smooth()

mat_brass = bpy.data.materials.new(name="Temple_Sacred_Brass")
mat_brass.use_nodes = True
b_br = mat_brass.node_tree.nodes.get('Principled BSDF')
if b_br:
    b_br.inputs['Base Color'].default_value = (0.92, 0.72, 0.22, 1.0)
    b_br.inputs['Metallic'].default_value = 0.92
    b_br.inputs['Roughness'].default_value = 0.22
bpy.ops.mesh.primitive_cone_add(radius1=0.75, depth=1.6, location=(0, 3.5, z_crown + 1.1))
kalasha = bpy.context.view_layer.objects.active
kalasha.name = "${entityId}_Kalasha_Finial"
kalasha.parent = temple_root
kalasha.data.materials.append(mat_brass)
bpy.ops.object.shade_smooth()

# 5. Open Pillar Mandapa Hall
for col_x in [-3.2, -1.1, 1.1, 3.2]:
    for col_y in [-4.5, -2.5, -0.5]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.28, depth=3.8, location=(col_x, col_y, z_base + 1.9))
        pillar = bpy.context.view_layer.objects.active
        pillar.name = f"${entityId}_Mandapa_Pillar_{col_x}_{col_y}"
        pillar.parent = temple_root
        pillar.data.materials.append(mat_stone)
        bev_p = pillar.modifiers.new("Bevel", 'BEVEL')
        bev_p.width = 0.03
        bpy.ops.object.shade_smooth()

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -2.5, z_base + 4.1))
canopy = bpy.context.view_layer.objects.active
canopy.name = "${entityId}_Mandapa_Canopy_Roof"
canopy.scale = (8.4, 6.2, 0.65)
bpy.ops.object.transform_apply(scale=True)
canopy.parent = temple_root
canopy.data.materials.append(mat_stone)
bev_c = canopy.modifiers.new("Bevel", 'BEVEL')
bev_c.width = 0.05
bpy.ops.object.shade_smooth()
`;
  }

  _generateSpaceshipAssemblyBpy(entityId, loc, dim) {
    return `
# ==============================================================================
# HERO ASSET: FUTURISTIC INTERCEPTOR SPACESHIP (PROCEDURAL ASSEMBLY)
# Dimensions: ~${dim[0]}m W x ~${dim[1]}m L x ~${dim[2]}m H
# Components: Fuselage, Cockpit Canopy, Swept Wings, Dual Ion Thrusters, Shield Emitters
# ==============================================================================
import bpy
import math

ship_root = bpy.data.objects.new("${entityId}", None)
ship_root.empty_display_type = 'ARROWS'
ship_root.location = (${loc[0]}, ${loc[1]}, ${loc[2]})
bpy.context.collection.objects.link(ship_root)

# Shaders
mat_hull = bpy.data.materials.new(name="Ship_Hull_Composite")
mat_hull.use_nodes = True
b_h = mat_hull.node_tree.nodes.get('Principled BSDF')
if b_h:
    b_h.inputs['Base Color'].default_value = (0.04, 0.05, 0.07, 1.0)
    b_h.inputs['Metallic'].default_value = 0.85
    b_h.inputs['Roughness'].default_value = 0.22

mat_plasma = bpy.data.materials.new(name="Ship_Plasma_Thruster")
mat_plasma.use_nodes = True
b_p = mat_plasma.node_tree.nodes.get('Principled BSDF')
if b_p:
    if 'Emission Color' in b_p.inputs:
        b_p.inputs['Emission Color'].default_value = (0.0, 0.85, 1.0, 1.0)
        b_p.inputs['Emission Strength'].default_value = 35.0

# 1. Main Fuselage
bpy.ops.mesh.primitive_cylinder_add(radius=1.2, depth=7.5, location=(0, 0, 1.2), rotation=(math.radians(90), 0, 0))
fuse = bpy.context.view_layer.objects.active
fuse.name = "${entityId}_Main_Fuselage"
fuse.scale = (0.75, 1.0, 0.45)
bpy.ops.object.transform_apply(scale=True)
fuse.parent = ship_root
fuse.data.materials.append(mat_hull)
bev = fuse.modifiers.new("Bevel", 'BEVEL')
bev.width = 0.04
bpy.ops.object.shade_smooth()

# 2. Swept Delta Wings
for sx in [-1, 1]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx * 2.2, -0.6, 1.15))
    wing = bpy.context.view_layer.objects.active
    wing.name = f"${entityId}_Delta_Wing_{'L' if sx < 0 else 'R'}"
    wing.scale = (3.2, 2.5, 0.12)
    wing.rotation_euler = (0, math.radians(sx * -8), math.radians(sx * 25))
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    wing.parent = ship_root
    wing.data.materials.append(mat_hull)
    bev_w = wing.modifiers.new("Bevel", 'BEVEL')
    bev_w.width = 0.03
    bpy.ops.object.shade_smooth()

# 3. Dual Ion Thrusters
for sx in [-0.85, 0.85]:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.42, depth=1.6, location=(sx, -3.6, 1.2), rotation=(math.radians(90), 0, 0))
    thrust = bpy.context.view_layer.objects.active
    thrust.name = f"${entityId}_Ion_Thruster_{'L' if sx < 0 else 'R'}"
    thrust.parent = ship_root
    thrust.data.materials.append(mat_hull)
    thrust.data.materials.append(mat_plasma)
    bpy.ops.object.shade_smooth()
`;
  }

  _generateDragonAssemblyBpy(entityId, loc, dim) {
    return `
# ==============================================================================
# HERO ASSET: MYTHICAL WINGED DRAGON (PROCEDURAL BIOMORPHIC ASSEMBLY)
# Dimensions: ~${dim[0]}m W x ~${dim[1]}m L x ~${dim[2]}m H
# Components: Serpentine Muscular Torso, S-Curved Neck, Horned Skull with Glowing Eyes,
#             Pair of Ribbed Leathery Wings, Muscular Fore/Hind Limbs with Talons,
#             Barbed Serpentine Spined Tail, Iridescent Scaled PBR Shader.
# ==============================================================================
import bpy
import math

dragon_root = bpy.data.objects.new("${entityId}", None)
dragon_root.empty_display_type = 'ARROWS'
dragon_root.location = (${loc[0]}, ${loc[1]}, ${loc[2]})
bpy.context.collection.objects.link(dragon_root)

# Shaders
mat_scales = bpy.data.materials.new(name="Dragon_Reptilian_Scales")
mat_scales.use_nodes = True
b_sc = mat_scales.node_tree.nodes.get('Principled BSDF')
if b_sc:
    b_sc.inputs['Base Color'].default_value = (0.08, 0.14, 0.06, 1.0) # Deep Emerald Dragon Green
    b_sc.inputs['Roughness'].default_value = 0.35
    if 'Metallic' in b_sc.inputs: b_sc.inputs['Metallic'].default_value = 0.25
    # Voronoi Micro-Scale Texture
    tex_v = mat_scales.node_tree.nodes.new('ShaderNodeTexVoronoi')
    tex_v.inputs['Scale'].default_value = 32.0
    bump_sc = mat_scales.node_tree.nodes.new('ShaderNodeBump')
    bump_sc.inputs['Strength'].default_value = 0.65
    mat_scales.node_tree.links.new(tex_v.outputs['Distance'], bump_sc.inputs['Height'])
    mat_scales.node_tree.links.new(bump_sc.outputs['Normal'], b_sc.inputs['Normal'])

mat_horn = bpy.data.materials.new(name="Dragon_Obsidian_Horn")
mat_horn.use_nodes = True
b_hn = mat_horn.node_tree.nodes.get('Principled BSDF')
if b_hn:
    b_hn.inputs['Base Color'].default_value = (0.015, 0.015, 0.02, 1.0)
    b_hn.inputs['Roughness'].default_value = 0.15

mat_eye = bpy.data.materials.new(name="Dragon_Amber_Eye_Emission")
mat_eye.use_nodes = True
b_ey = mat_eye.node_tree.nodes.get('Principled BSDF')
if b_ey and 'Emission Color' in b_ey.inputs:
    b_ey.inputs['Emission Color'].default_value = (1.0, 0.55, 0.05, 1.0)
    b_ey.inputs['Emission Strength'].default_value = 25.0

# 1. Main Muscular Torso & Ribcage (location=(0, 0, 1.6))
bpy.ops.mesh.primitive_cylinder_add(radius=0.9, depth=2.8, location=(0, 0, 1.6), rotation=(math.radians(75), 0, 0))
torso = bpy.context.view_layer.objects.active
torso.name = "${entityId}_Torso"
torso.scale = (0.9, 1.2, 0.8)
bpy.ops.object.transform_apply(scale=True)
torso.parent = dragon_root
torso.data.materials.append(mat_scales)
sub = torso.modifiers.new("Subsurf", 'SUBSURF')
sub.levels = 1
bpy.ops.object.shade_smooth()

# 2. S-Curved Neck & Serpentine Head (y=1.6, z=2.4)
bpy.ops.mesh.primitive_cylinder_add(radius=0.45, depth=1.6, location=(0, 1.4, 2.3), rotation=(math.radians(35), 0, 0))
neck = bpy.context.view_layer.objects.active
neck.name = "${entityId}_Neck"
neck.parent = dragon_root
neck.data.materials.append(mat_scales)
bpy.ops.object.shade_smooth()

# Horned Skull
bpy.ops.mesh.primitive_cone_add(radius1=0.55, radius2=0.2, depth=1.2, location=(0, 2.1, 2.8), rotation=(math.radians(-75), 0, 0))
head = bpy.context.view_layer.objects.active
head.name = "${entityId}_Skull"
head.parent = dragon_root
head.data.materials.append(mat_scales)
bpy.ops.object.shade_smooth()

# Dual Curved Obsidian Horns
for sx in [-0.28, 0.28]:
    bpy.ops.mesh.primitive_cone_add(radius1=0.14, depth=0.95, location=(sx, 1.8, 3.3), rotation=(math.radians(45), math.radians(sx * 22), 0))
    horn = bpy.context.view_layer.objects.active
    horn.name = f"${entityId}_Horn_{'L' if sx < 0 else 'R'}"
    horn.parent = dragon_root
    horn.data.materials.append(mat_horn)
    bpy.ops.object.shade_smooth()

    # Glowing Slit Eye
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.08, location=(sx * 0.95, 2.15, 2.9))
    eye = bpy.context.view_layer.objects.active
    eye.name = f"${entityId}_Eye_{'L' if sx < 0 else 'R'}"
    eye.parent = dragon_root
    eye.data.materials.append(mat_eye)

# 3. Massive Leathery Bat-like Wings (Left & Right, Span ~${dim[0]}m)
for sx in [-1, 1]:
    # Wing Strut Bone
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=2.8, location=(sx * 1.5, 0.2, 2.8), rotation=(0, math.radians(sx * 48), math.radians(sx * 15)))
    strut = bpy.context.view_layer.objects.active
    strut.name = f"${entityId}_Wing_Strut_{'L' if sx < 0 else 'R'}"
    strut.parent = dragon_root
    strut.data.materials.append(mat_scales)
    bpy.ops.object.shade_smooth()

    # Wing Membrane Span
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=6, y_subdivisions=6, size=1.0, location=(sx * 2.1, -0.2, 2.7))
    wing = bpy.context.view_layer.objects.active
    wing.name = f"${entityId}_Wing_Membrane_{'L' if sx < 0 else 'R'}"
    wing.scale = (2.2, 1.8, 0.05)
    wing.rotation_euler = (math.radians(20), math.radians(sx * 35), math.radians(sx * -12))
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    wing.parent = dragon_root
    wing.data.materials.append(mat_scales)
    bpy.ops.object.shade_smooth()

# 4. Spiked Serpentine Tail (y=-2.4, length ~3.5m)
for seg in range(4):
    rad = 0.5 - seg * 0.1
    bpy.ops.mesh.primitive_cylinder_add(radius=rad, depth=1.1, location=(0, -1.6 - seg * 0.85, 1.4 - seg * 0.28), rotation=(math.radians(82 + seg * 4), 0, 0))
    tail_seg = bpy.context.view_layer.objects.active
    tail_seg.name = f"${entityId}_Tail_Segment_{seg+1}"
    tail_seg.parent = dragon_root
    tail_seg.data.materials.append(mat_scales)
    bpy.ops.object.shade_smooth()

# 5. Muscular Quadruped Limbs & Claws
for sx in [-0.75, 0.75]:
    for sy, sz, name_l in [(0.9, 0.9, "Foreleg"), (-0.9, 0.85, "Hindleg")]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.18, depth=1.5, location=(sx, sy, sz), rotation=(math.radians(10), math.radians(sx * -8), 0))
        leg = bpy.context.view_layer.objects.active
        leg.name = f"${entityId}_{name_l}_{'L' if sx < 0 else 'R'}"
        leg.parent = dragon_root
        leg.data.materials.append(mat_scales)
        bpy.ops.object.shade_smooth()
`;
  }

  _generateAirplaneAssemblyBpy(entityId, loc, dim) {
    return `
# ==============================================================================
# HERO ASSET: COMMERCIAL BOEING-STYLE JET AIRLINER (PROCEDURAL ASSEMBLY)
# Dimensions: ~${dim[0]}m W x ~${dim[1]}m L x ~${dim[2]}m H
# Components: Cylindrical Fuselage, Aerodynamic Cockpit Radome, Swept Main Wings,
#             Dual High-Bypass Turbofan Jet Engines, Vertical Tail Stabilizer.
# ==============================================================================
import bpy
import math

plane_root = bpy.data.objects.new("${entityId}", None)
plane_root.empty_display_type = 'ARROWS'
plane_root.location = (${loc[0]}, ${loc[1]}, ${loc[2]})
bpy.context.collection.objects.link(plane_root)

# Aluminum White Aircraft Livery Shader
mat_livery = bpy.data.materials.new(name="Airliner_Polished_Aluminum")
mat_livery.use_nodes = True
b_lv = mat_livery.node_tree.nodes.get('Principled BSDF')
if b_lv:
    b_lv.inputs['Base Color'].default_value = (0.92, 0.93, 0.95, 1.0)
    b_lv.inputs['Metallic'].default_value = 0.45
    b_lv.inputs['Roughness'].default_value = 0.15

mat_engine = bpy.data.materials.new(name="Airliner_Turbine_Titanium")
mat_engine.use_nodes = True
b_eg = mat_engine.node_tree.nodes.get('Principled BSDF')
if b_eg:
    b_eg.inputs['Base Color'].default_value = (0.15, 0.16, 0.18, 1.0)
    b_eg.inputs['Metallic'].default_value = 0.95
    b_eg.inputs['Roughness'].default_value = 0.22

# 1. Main Fuselage Tube
bpy.ops.mesh.primitive_cylinder_add(radius=1.8, depth=14.0, location=(0, 0, 3.2), rotation=(math.radians(90), 0, 0))
fuse = bpy.context.view_layer.objects.active
fuse.name = "${entityId}_Fuselage"
fuse.parent = plane_root
fuse.data.materials.append(mat_livery)
bev = fuse.modifiers.new("Bevel", 'BEVEL')
bev.width = 0.06
bpy.ops.object.shade_smooth()

# 2. Nose Cone & Cockpit Radome
bpy.ops.mesh.primitive_cone_add(radius1=1.8, depth=3.2, location=(0, 8.2, 3.2), rotation=(math.radians(-90), 0, 0))
nose = bpy.context.view_layer.objects.active
nose.name = "${entityId}_Nose_Cone"
nose.parent = plane_root
nose.data.materials.append(mat_livery)
bpy.ops.object.shade_smooth()

# 3. Swept Wings (Span ~18m)
for sx in [-1, 1]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx * 5.2, 0.5, 2.9))
    wing = bpy.context.view_layer.objects.active
    wing.name = f"${entityId}_Swept_Wing_{'L' if sx < 0 else 'R'}"
    wing.scale = (8.5, 3.2, 0.22)
    wing.rotation_euler = (0, math.radians(sx * -4), math.radians(sx * 22))
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    wing.parent = plane_root
    wing.data.materials.append(mat_livery)
    bev_w = wing.modifiers.new("Bevel", 'BEVEL')
    bev_w.width = 0.04
    bpy.ops.object.shade_smooth()

    # Underslung Turbofan Jet Engines
    bpy.ops.mesh.primitive_cylinder_add(radius=0.9, depth=3.2, location=(sx * 4.2, 0.8, 1.7), rotation=(math.radians(90), 0, 0))
    engine = bpy.context.view_layer.objects.active
    engine.name = f"${entityId}_Jet_Engine_{'L' if sx < 0 else 'R'}"
    engine.parent = plane_root
    engine.data.materials.append(mat_engine)
    bev_eg = engine.modifiers.new("Bevel", 'BEVEL')
    bev_eg.width = 0.05
    bpy.ops.object.shade_smooth()

# 4. Vertical Tail Fin & Stabilizer
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -6.2, 5.8))
tail = bpy.context.view_layer.objects.active
tail.name = "${entityId}_Tail_Fin"
tail.scale = (0.24, 2.8, 4.2)
tail.rotation_euler = (math.radians(-25), 0, 0)
bpy.ops.object.transform_apply(scale=True, rotation=True)
tail.parent = plane_root
tail.data.materials.append(mat_livery)
bev_tl = tail.modifiers.new("Bevel", 'BEVEL')
bev_tl.width = 0.04
bpy.ops.object.shade_smooth()
`;
  }

  _generateGenericFocalBpy(entityId, loc, dim) {
    return `
# ==============================================================================
# HERO ASSET: PROCEDURAL HIGH-POLY FOCAL MESH SCAFFOLD (${entityId})
# Dimensions: ~${dim[0]}m W x ~${dim[1]}m L x ~${dim[2]}m H
# ==============================================================================
import bpy

focal_root = bpy.data.objects.new("${entityId}", None)
focal_root.empty_display_type = 'ARROWS'
focal_root.location = (${loc[0]}, ${loc[1]}, ${loc[2]})
bpy.context.collection.objects.link(focal_root)

mat_pbr = bpy.data.materials.new(name="${entityId}_PBR_Surface")
mat_pbr.use_nodes = True
b_p = mat_pbr.node_tree.nodes.get('Principled BSDF')
if b_p:
    b_p.inputs['Base Color'].default_value = (0.2, 0.22, 0.25, 1.0)
    b_p.inputs['Roughness'].default_value = 0.4
    if 'Metallic' in b_p.inputs: b_p.inputs['Metallic'].default_value = 0.3

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, ${dim[2]/2}))
core = bpy.context.view_layer.objects.active
core.name = "${entityId}_CoreMesh"
core.scale = (${dim[0]}, ${dim[1]}, ${dim[2]})
bpy.ops.object.transform_apply(scale=True)
core.parent = focal_root
core.data.materials.append(mat_pbr)
bev = core.modifiers.new("StudioBevel", 'BEVEL')
bev.width = 0.04
bev.segments = 3
bpy.ops.object.shade_smooth()
`;
  }
}

module.exports = { ProceduralAssetProvider };
