// src/main/tools/astra/core/assets/CachedAssetProvider.js — High-Speed Disk Cache Asset Provider
'use strict';

const { BaseAssetProvider } = require('./BaseAssetProvider');
const { PROVIDER_STATUS, RESOLUTION_STRATEGY, MATCH_CONFIDENCE, QUALITY_TIER } = require('./AssetTypes');
const logger = require('../../../../../shared/Logger');

class CachedAssetProvider extends BaseAssetProvider {
  constructor(options = {}) {
    super('CachedAssetProvider', { priority: 2, initialStatus: PROVIDER_STATUS.AVAILABLE, ...options });
    this.cacheManager = options.cacheManager;
  }

  setCacheManager(manager) {
    this.cacheManager = manager;
  }

  async canResolve(entity, requirements = {}) {
    if (!this.cacheManager) {
      return { canResolve: false, confidence: MATCH_CONFIDENCE.NONE, reason: 'CacheManager not initialized' };
    }

    const query = entity.name || entity.description || '';
    const category = entity.category || 'prop';
    const quality = requirements.qualityTier || QUALITY_TIER.STANDARD;

    const hit = await this.cacheManager.get(query, category, quality);
    if (hit.found) {
      return {
        canResolve: true,
        confidence: MATCH_CONFIDENCE.STRONG_SEMANTIC,
        strategy: RESOLUTION_STRATEGY.LOCAL_CACHE,
        reason: `Found cached 3D model for "${query}" (${hit.key})`,
        hit
      };
    }

    return {
      canResolve: false,
      confidence: MATCH_CONFIDENCE.NONE,
      strategy: RESOLUTION_STRATEGY.LOCAL_CACHE,
      reason: `No cached asset found for "${query}"`
    };
  }

  async resolve(entity, requirements = {}, context = {}) {
    const manager = this.cacheManager || context.cacheManager;
    if (!manager) {
      return {
        success: false,
        strategy: RESOLUTION_STRATEGY.LOCAL_CACHE,
        provider: this.name,
        error: 'CacheManager instance unavailable'
      };
    }

    const query = entity.name || entity.description || '';
    const category = entity.category || 'prop';
    const quality = requirements.qualityTier || QUALITY_TIER.STANDARD;

    const hit = await manager.get(query, category, quality);
    if (!hit.found) {
      return {
        success: false,
        strategy: RESOLUTION_STRATEGY.LOCAL_CACHE,
        provider: this.name,
        error: `No cached asset available for "${query}"`
      };
    }

    // Deep validation of cached asset
    if (context.validator) {
      const val = await context.validator.validate(hit.assetPath, {
        triangleBudget: requirements.triangleBudget
      });
      if (!val.valid) {
        logger.warn(`[CachedAssetProvider] Cached asset "${hit.key}" failed validation: ${val.errors.join(', ')}`);
        return {
          success: false,
          strategy: RESOLUTION_STRATEGY.LOCAL_CACHE,
          provider: this.name,
          error: `Cached asset failed integrity check: ${val.errors.join(', ')}`
        };
      }
    }

    logger.info(`[CachedAssetProvider] Successfully resolved from cache: "${hit.assetPath}" ✓`);
    return {
      success: true,
      strategy: RESOLUTION_STRATEGY.LOCAL_CACHE,
      provider: this.name,
      assetPath: hit.assetPath,
      format: (hit.metadata && hit.metadata.format) || 'GLB',
      quality: (hit.metadata && hit.metadata.quality) || quality,
      confidence: MATCH_CONFIDENCE.STRONG_SEMANTIC,
      reason: `Retrieved validated model from disk cache (${hit.key})`,
      metadata: hit.metadata
    };
  }
}

module.exports = { CachedAssetProvider };
