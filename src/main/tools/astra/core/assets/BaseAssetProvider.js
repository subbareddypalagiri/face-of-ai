// src/main/tools/astra/core/assets/BaseAssetProvider.js — Abstract 3D Asset Provider Interface
'use strict';

const { PROVIDER_STATUS, RESOLUTION_STRATEGY, MATCH_CONFIDENCE } = require('./AssetTypes');

class BaseAssetProvider {
  constructor(name, options = {}) {
    if (!name) throw new Error('AssetProvider must have a unique name identifier');
    this.name = name;
    this.options = options;
    this.status = options.initialStatus || PROVIDER_STATUS.AVAILABLE;
    this.priority = options.priority || 100;
  }

  getStatus() {
    return this.status;
  }

  isAvailable() {
    return this.status === PROVIDER_STATUS.AVAILABLE;
  }

  /**
   * Evaluates if this provider can handle the requested entity and returns confidence
   * @param {Object} entity - { id, name, category, role, description, estimatedDimensions }
   * @param {Object} requirements - { qualityTier, triangleBudget, style }
   * @returns {Promise<{ canResolve: boolean, confidence: number, strategy: string, reason: string }>}
   */
  async canResolve(entity, requirements = {}) {
    throw new Error(`[BaseAssetProvider:${this.name}] canResolve() must be implemented by subclass.`);
  }

  /**
   * Resolves or generates the asset
   * @param {Object} entity
   * @param {Object} requirements
   * @param {Object} context - { validator, cacheManager, logger }
   * @returns {Promise<{ success: boolean, assetPath?: string, format?: string, quality?: string, confidence?: number, strategy: string, provider: string, metadata?: Object, error?: string }>}
   */
  async resolve(entity, requirements = {}, context = {}) {
    throw new Error(`[BaseAssetProvider:${this.name}] resolve() must be implemented by subclass.`);
  }
}

module.exports = { BaseAssetProvider };
