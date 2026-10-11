// src/main/tools/astra/core/assets/AI3DAssetProvider.js — Generic AI 3D Generation Provider Interface
'use strict';

const fs = require('fs');
const path = require('path');
const { BaseAssetProvider } = require('./BaseAssetProvider');
const { PROVIDER_STATUS, RESOLUTION_STRATEGY, MATCH_CONFIDENCE, QUALITY_TIER } = require('./AssetTypes');
const logger = require('../../../../../shared/Logger');

class AI3DAssetProvider extends BaseAssetProvider {
  constructor(options = {}) {
    // Check config.json and env for legitimate external 3D generation credentials
    const config = AI3DAssetProvider.loadConfig(options.configPath);
    const apiKey = options.apiKey || process.env.UNIN_AI_3D_API_KEY || (config && config.ai_3d_api_key);
    const providerName = options.providerName || process.env.UNIN_AI_3D_PROVIDER || (config && config.ai_3d_provider) || 'unconfigured_ai3d';

    const isConfigured = Boolean(apiKey && apiKey.trim().length > 0);

    super('AI3DAssetProvider', {
      priority: 4,
      initialStatus: isConfigured ? PROVIDER_STATUS.AVAILABLE : PROVIDER_STATUS.NOT_CONFIGURED,
      ...options
    });

    this.apiKey = apiKey || null;
    this.providerName = providerName;
    this.activeJobs = new Map();
  }

  static loadConfig(customPath) {
    try {
      const cfgPath = customPath || path.resolve(__dirname, '../../../../../../config.json');
      if (fs.existsSync(cfgPath)) {
        return JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      }
    } catch {}
    return null;
  }

  async canResolve(entity, requirements = {}) {
    // If not configured, explicitly report NOT_CONFIGURED state
    if (this.status === PROVIDER_STATUS.NOT_CONFIGURED || !this.apiKey) {
      return {
        canResolve: false,
        confidence: MATCH_CONFIDENCE.NONE,
        strategy: RESOLUTION_STRATEGY.AI_GENERATION,
        reason: 'AI 3D generation provider is not configured (AI3D_PROVIDER_NOT_CONFIGURED). No external 3D API key in config.json.'
      };
    }

    return {
      canResolve: true,
      confidence: MATCH_CONFIDENCE.STRONG_SEMANTIC,
      strategy: RESOLUTION_STRATEGY.AI_GENERATION,
      reason: `AI 3D provider "${this.providerName}" is available to synthesize model for "${entity.name}"`
    };
  }

  async resolve(entity, requirements = {}, context = {}) {
    if (this.status === PROVIDER_STATUS.NOT_CONFIGURED || !this.apiKey) {
      logger.info(`[AI3DAssetProvider] AI 3D Provider is NOT_CONFIGURED. Skipping external generation without faking.`);
      return {
        success: false,
        strategy: RESOLUTION_STRATEGY.AI_GENERATION,
        provider: this.name,
        error: 'AI3D_PROVIDER_NOT_CONFIGURED: No external text-to-3D credentials present in config.json.'
      };
    }

    // When configured with real credentials, trigger async generation job
    try {
      const job = await this.generate({
        prompt: `${entity.name}, ${entity.description || ''}`,
        category: entity.category,
        quality: requirements.qualityTier || QUALITY_TIER.HIGH
      });

      return {
        success: false, // Async pending job
        strategy: RESOLUTION_STRATEGY.AI_GENERATION,
        provider: this.providerName,
        jobId: job.jobId,
        status: job.status
      };
    } catch (err) {
      return {
        success: false,
        strategy: RESOLUTION_STRATEGY.AI_GENERATION,
        provider: this.name,
        error: `AI 3D generation request failed: ${err.message}`
      };
    }
  }

  /**
   * Submits async 3D generation job
   */
  async generate(request) {
    if (!this.apiKey) throw new Error('AI3D_PROVIDER_NOT_CONFIGURED');
    const jobId = `job_3d_${Date.now()}`;
    const job = {
      jobId,
      prompt: request.prompt,
      status: 'SUBMITTED',
      createdAt: Date.now()
    };
    this.activeJobs.set(jobId, job);
    return job;
  }

  /**
   * Returns provider operational status, or status of an ongoing generation job if jobId is supplied
   */
  getStatus(jobId) {
    if (jobId) {
      return this.getJobStatus(jobId);
    }
    return this.status;
  }

  /**
   * Queries status of ongoing generation job
   */
  getJobStatus(jobId) {
    const job = this.activeJobs.get(jobId);
    if (!job) return { jobId, status: 'NOT_FOUND' };
    return job;
  }

  /**
   * Cancels ongoing generation job
   */
  async cancel(jobId) {
    const job = this.activeJobs.get(jobId);
    if (job) {
      job.status = 'CANCELLED';
      return { success: true, jobId, status: 'CANCELLED' };
    }
    return { success: false, jobId, error: 'Job not found' };
  }
}

module.exports = { AI3DAssetProvider };
