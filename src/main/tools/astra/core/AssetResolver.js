// src/main/tools/astra/core/AssetResolver.js — Dynamic Asset Intelligence & Multi-Tiered Provider Registry
'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('../../../../shared/Logger');

const {
  AssetTypes,
  AssetValidator,
  AssetCacheManager,
  AssetProviderRegistry,
  RESOLUTION_STRATEGY,
  QUALITY_TIER,
  MATCH_CONFIDENCE
} = require('./assets');

class AssetResolver {
  constructor(options = {}) {
    this.workspaceRoot = path.resolve(options.workspaceRoot || path.join(__dirname, '../../../../../'));
    this.cacheDir = options.cacheDir || path.join(this.workspaceRoot, 'assets', 'cache');

    // Subsystem components
    this.validator = options.validator || new AssetValidator({ workspaceRoot: this.workspaceRoot });
    this.cacheManager = options.cacheManager || new AssetCacheManager({ workspaceRoot: this.workspaceRoot, cacheDir: this.cacheDir });
    this.registry = options.registry || new AssetProviderRegistry({
      workspaceRoot: this.workspaceRoot,
      validator: this.validator,
      cacheManager: this.cacheManager,
      ...options
    });

    // Backward compatibility: expose localCatalog
    this.localCatalog = {
      'car': path.join(this.workspaceRoot, 'ferrari.glb').replace(/\\/g, '/'),
      'supercar': path.join(this.workspaceRoot, 'ferrari.glb').replace(/\\/g, '/'),
      'ferrari': path.join(this.workspaceRoot, 'ferrari.glb').replace(/\\/g, '/'),
      'tree': path.join(this.workspaceRoot, 'tree.glb').replace(/\\/g, '/'),
      'forest_tree': path.join(this.workspaceRoot, 'tree.glb').replace(/\\/g, '/'),
      'human': path.join(this.workspaceRoot, 'hero.glb').replace(/\\/g, '/'),
      'avatar': path.join(this.workspaceRoot, 'hero.glb').replace(/\\/g, '/'),
      'character': path.join(this.workspaceRoot, 'hero.glb').replace(/\\/g, '/'),
      'anime': path.join(this.workspaceRoot, 'avatar3.glb').replace(/\\/g, '/'),
      'animal': path.join(this.workspaceRoot, 'animal.fbx').replace(/\\/g, '/')
    };
  }

  ensureCacheDirectory() {
    this.cacheManager.ensureDirectories();
  }

  getProviderRegistry() {
    return this.registry;
  }

  getCacheManager() {
    return this.cacheManager;
  }

  getValidator() {
    return this.validator;
  }

  /**
   * Resolves the optimal 3D asset via provider priority registry with deep validation
   */
  async resolveEntity(entity, requirements = {}) {
    logger.info(`[AssetResolver] Resolving asset for "${entity.name}" (role: ${entity.role || 'hero'})...`);

    const regResult = await this.registry.resolveEntity(entity, requirements);

    // Map to backward-compatible schema for existing callers and tests
    const isLocal = regResult.strategy === RESOLUTION_STRATEGY.LOCAL_CATALOG;
    const isCache = regResult.strategy === RESOLUTION_STRATEGY.LOCAL_CACHE;
    const isProcedural = regResult.strategy === RESOLUTION_STRATEGY.PROCEDURAL_ASSEMBLY;

    const backwardCompatibleResult = {
      strategy: regResult.strategy,
      provider: regResult.provider,
      assemblyType: regResult.assemblyType,
      path: regResult.assetPath,
      format: regResult.format,
      qualityLevel: isProcedural ? 'PROCEDURAL_STUDIO_GRADE' :
        isLocal ? 'HIGH_FIDELITY_VERIFIED' :
        isCache ? 'HIGH_FIDELITY_CACHED' : (regResult.qualityLevel || 'PREVIEW'),
      confidence: regResult.confidence,
      reason: regResult.reason,
      limitations: isProcedural ? 'Procedural component geometry' :
        isLocal ? 'Static pre-authored geometry' : 'Bounding reference scaffold (unsupported category)',
      targetDimensions: regResult.dimensions || entity.estimatedDimensions || [1.0, 1.0, 1.0],
      sanitizationRequired: isLocal || isCache,
      validation: regResult.validation,
      attempts: regResult.attempts
    };

    return backwardCompatibleResult;
  }

  /**
   * Generates procedural Python bpy code for a multi-component assembled hero entity
   */
  generateProceduralAssemblyBpy(entity, resolution) {
    const assemblyType = resolution.assemblyType;
    const loc = entity.targetLocation || [0.0, 0.0, 0.0];
    const dim = entity.estimatedDimensions || resolution.targetDimensions || [1.0, 1.0, 1.0];

    const proceduralProvider = this.registry.getProvider('ProceduralAssetProvider');
    if (proceduralProvider) {
      return proceduralProvider.generateAssemblyBpy(assemblyType, entity.id, loc, dim);
    }

    return '# Procedural provider unavailable';
  }
}

module.exports = { AssetResolver };
