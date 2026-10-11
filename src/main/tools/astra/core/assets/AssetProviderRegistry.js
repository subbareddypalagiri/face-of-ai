// src/main/tools/astra/core/assets/AssetProviderRegistry.js — Priority-Based Asset Provider Orchestrator
'use strict';

const { LocalAssetProvider } = require('./LocalAssetProvider');
const { CachedAssetProvider } = require('./CachedAssetProvider');
const { RemoteAssetProvider } = require('./RemoteAssetProvider');
const { AI3DAssetProvider } = require('./AI3DAssetProvider');
const { ProceduralAssetProvider } = require('./ProceduralAssetProvider');
const { RESOLUTION_STRATEGY, PROVIDER_STATUS, MATCH_CONFIDENCE, QUALITY_TIER } = require('./AssetTypes');
const logger = require('../../../../../shared/Logger');

class AssetProviderRegistry {
  constructor(options = {}) {
    this.validator = options.validator;
    this.cacheManager = options.cacheManager;
    this.providers = [];

    // Register default priority chain
    this.registerProvider(new LocalAssetProvider(options));
    this.registerProvider(new CachedAssetProvider({ cacheManager: this.cacheManager, ...options }));
    this.registerProvider(new RemoteAssetProvider(options));
    this.registerProvider(new AI3DAssetProvider(options));
    this.registerProvider(new ProceduralAssetProvider(options));
  }

  registerProvider(provider) {
    this.providers.push(provider);
    // Sort ascending by priority number (1 = highest priority)
    this.providers.sort((a, b) => a.priority - b.priority);
  }

  getProviders() {
    return [...this.providers];
  }

  getProvider(name) {
    return this.providers.find(p => p.name === name);
  }

  /**
   * Orchestrates multi-tiered provider resolution with full audit logging
   */
  async resolveEntity(entity, requirements = {}) {
    const attempts = [];
    logger.info(`[AssetProviderRegistry] Resolving asset for "${entity.name}" (category: ${entity.category}, role: ${entity.role})...`);

    const context = {
      validator: this.validator,
      cacheManager: this.cacheManager,
      logger
    };

    for (const provider of this.providers) {
      const status = provider.getStatus();
      let canRes = { canResolve: false, confidence: 0, reason: 'Evaluation skipped' };

      try {
        canRes = await provider.canResolve(entity, requirements);
      } catch (err) {
        canRes = { canResolve: false, confidence: 0, reason: `canResolve error: ${err.message}` };
      }

      attempts.push({
        provider: provider.name,
        status,
        canResolve: canRes.canResolve,
        confidence: canRes.confidence,
        strategy: canRes.strategy,
        reason: canRes.reason
      });

      if (canRes.canResolve && status === PROVIDER_STATUS.AVAILABLE) {
        try {
          const res = await provider.resolve(entity, requirements, context);
          if (res.success) {
            logger.info(`[AssetProviderRegistry] Resolved "${entity.name}" via [${provider.name}] (${res.strategy}) ✓`);

            return {
              success: true,
              entityId: entity.id,
              requestedDescription: entity.name,
              strategy: res.strategy,
              provider: provider.name,
              assemblyType: res.assemblyType || null,
              assetPath: res.assetPath || null,
              format: res.format || (res.assetPath ? res.assetPath.split('.').pop().toUpperCase() : 'PROCEDURAL'),
              qualityLevel: res.quality || QUALITY_TIER.HIGH,
              confidence: res.confidence || canRes.confidence,
              reason: res.reason || canRes.reason,
              dimensions: res.dimensions || entity.estimatedDimensions || [1.0, 1.0, 1.0],
              bpyCodeGenerator: res.bpyCodeGenerator || null,
              validation: res.metadata?.validation || { valid: true },
              attempts
            };
          } else {
            logger.warn(`[AssetProviderRegistry] Provider "${provider.name}" failed resolution: ${res.error}. Cascading to next tier.`);
          }
        } catch (err) {
          logger.warn(`[AssetProviderRegistry] Provider "${provider.name}" threw error: ${err.message}. Cascading to next tier.`);
        }
      }
    }

    // Controlled honest fallback if all tiers exhausted
    logger.warn(`[AssetProviderRegistry] All primary providers exhausted for "${entity.name}". Engaging controlled reference scaffold fallback.`);
    const proceduralProvider = this.getProvider('ProceduralAssetProvider');
    const fallbackBpy = proceduralProvider ?
      (ent, loc, dim) => proceduralProvider.generateAssemblyBpy('PROCEDURAL_FOCAL_HERO', ent.id, loc, dim) : null;

    return {
      success: true,
      entityId: entity.id,
      requestedDescription: entity.name,
      strategy: RESOLUTION_STRATEGY.CONTROLLED_FALLBACK,
      provider: 'ProceduralFallback',
      assemblyType: 'UNSUPPORTED_CATEGORY_SCAFFOLD',
      assetPath: null,
      format: 'PROCEDURAL',
      qualityLevel: QUALITY_TIER.PREVIEW,
      confidence: 0.1,
      reason: `UNSUPPORTED_CATEGORY_SCAFFOLD: No dedicated procedural generator or local model exists for "${entity.name}". Generated reference bounding scaffold.`,
      dimensions: entity.estimatedDimensions || [1.0, 1.0, 1.0],
      bpyCodeGenerator: fallbackBpy,
      attempts
    };
  }
}

module.exports = { AssetProviderRegistry };
