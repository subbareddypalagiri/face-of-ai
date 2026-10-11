// src/main/tools/astra/core/SceneGraph.js — Canonical Structured Scene Graph for 3D Worlds
'use strict';

class SceneGraph {
  constructor(spec = {}) {
    this.version = '2.0.0';
    this.id = `unin_scene_${Date.now()}`;
    this.summary = spec.summary || 'Autonomous 3D Scene';
    this.style = spec.visualFidelity || 'photorealistic';
    this.environment = spec.environment || { type: 'urban_street', baseSurface: 'wet_asphalt', secondaryProps: [] };
    this.weather = spec.weather || { precipitation: 'none', puddles: false, wetReflections: false, fogDensity: 0.01 };
    this.timeOfDay = spec.timeOfDay || 'night';
    this.lighting = spec.lighting || { primaryType: 'streetlights', mood: 'moody_contrast', colors: [] };
    this.cinematography = spec.cinematography || { lensFocalLength: 35, cameraAngle: 'low_angle_hero', enableDoF: true, apertureFStop: 1.8 };
    this.constraints = spec.constraints || [];
    this.qualityTier = spec.qualityTier || (this.style === 'photorealistic' ? 'HERO' : 'STANDARD');
    this.triangleBudget = spec.triangleBudget || 1500000;

    this.entities = new Map();
    this.relationships = [];

    // Ingest entities from spec
    if (spec.heroEntities && Array.isArray(spec.heroEntities)) {
      spec.heroEntities.forEach((ent, idx) => {
        const canonicalId = ent.id || `unin.entity.${ent.category || 'hero'}_${idx}`;
        this.addEntity({
          id: canonicalId,
          name: ent.name || 'Hero Subject',
          category: ent.category || 'prop',
          role: ent.importance || 'hero',
          description: ent.description || '',
          estimatedDimensions: ent.estimatedDimensions || [1.0, 1.0, 1.0],
          targetLocation: [0.0, 0.0, 0.0],
          targetRotationEuler: [0.0, 0.0, 0.0],
          materials: ent.materials || ['principled_pbr'],
          qualityTier: ent.qualityTier || this.qualityTier,
          triangleBudget: ent.triangleBudget || this.triangleBudget,
          groundPlacement: ent.groundPlacement !== false,
          assetResolution: null // populated by AssetResolver
        });
      });
    }

    // Default foundation entity if not present
    this.addEntity({
      id: 'unin.environment.foundation',
      name: `Foundation_${this.environment.baseSurface}`,
      category: 'environment',
      role: 'foundation',
      description: `Ground plane terrain with ${this.environment.baseSurface} PBR shader`,
      estimatedDimensions: [40.0, 40.0, 1.0],
      targetLocation: [0.0, 0.0, 0.0],
      targetRotationEuler: [0.0, 0.0, 0.0],
      materials: [this.environment.baseSurface],
      groundPlacement: true,
      assetResolution: { strategy: 'procedural_grid', details: this.environment }
    });

    // Default camera entity
    this.addEntity({
      id: 'unin.camera.primary',
      name: 'Cinematic_Main_Camera',
      category: 'camera',
      role: 'camera',
      description: 'Primary camera with cinematic lens and tracking constraint',
      estimatedDimensions: [0.2, 0.3, 0.2],
      targetLocation: [-3.8, -4.5, 1.4],
      targetRotationEuler: [1.3, 0.0, -0.7],
      materials: [],
      groundPlacement: false,
      optics: this.cinematography
    });
  }

  addEntity(entity) {
    if (!entity || !entity.id) throw new Error('Entity must have a valid canonical id');
    this.entities.set(entity.id, entity);
    return entity;
  }

  getEntity(id) {
    return this.entities.get(id);
  }

  getHeroEntity() {
    for (const ent of this.entities.values()) {
      if (ent.role === 'hero') return ent;
    }
    return null;
  }

  getAllEntities() {
    return Array.from(this.entities.values());
  }

  addRelationship(sourceId, relationType, targetId) {
    this.relationships.push({
      source: sourceId,
      relation: relationType, // 'placed_on', 'facing', 'behind', 'orbiting'
      target: targetId
    });
  }

  /**
   * Validates integrity of the scene graph
   */
  validate() {
    const errors = [];
    if (!this.getHeroEntity()) {
      errors.push('SceneGraph must contain at least one hero entity');
    }
    if (!this.getEntity('unin.environment.foundation')) {
      errors.push('SceneGraph must have a foundation environment entity');
    }
    if (!this.getEntity('unin.camera.primary')) {
      errors.push('SceneGraph must have a primary camera entity');
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }

  toJSON() {
    return {
      id: this.id,
      version: this.version,
      summary: this.summary,
      style: this.style,
      environment: this.environment,
      weather: this.weather,
      timeOfDay: this.timeOfDay,
      lighting: this.lighting,
      cinematography: this.cinematography,
      entities: this.getAllEntities(),
      relationships: this.relationships,
      constraints: this.constraints
    };
  }
}

module.exports = { SceneGraph };
