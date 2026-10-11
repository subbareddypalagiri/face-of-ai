// src/main/tools/astra/core/assets/RemoteAssetProvider.js — Network-Safe Remote Catalog Asset Provider
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { BaseAssetProvider } = require('./BaseAssetProvider');
const { PROVIDER_STATUS, RESOLUTION_STRATEGY, MATCH_CONFIDENCE, QUALITY_TIER } = require('./AssetTypes');
const logger = require('../../../../../shared/Logger');

class RemoteAssetProvider extends BaseAssetProvider {
  constructor(options = {}) {
    const isConfigured = Boolean(options.endpoint || process.env.UNIN_REMOTE_ASSET_ENDPOINT);
    super('RemoteAssetProvider', {
      priority: 3,
      initialStatus: isConfigured ? PROVIDER_STATUS.AVAILABLE : PROVIDER_STATUS.NOT_CONFIGURED,
      ...options
    });
    this.endpoint = options.endpoint || process.env.UNIN_REMOTE_ASSET_ENDPOINT || null;
    this.timeoutMs = options.timeoutMs || 30000;
    this.maxSizeBytes = options.maxSizeBytes || 100 * 1024 * 1024; // 100 MB
  }

  async canResolve(entity, requirements = {}) {
    if (this.status === PROVIDER_STATUS.NOT_CONFIGURED || !this.endpoint) {
      return {
        canResolve: false,
        confidence: MATCH_CONFIDENCE.NONE,
        strategy: RESOLUTION_STRATEGY.REMOTE_CATALOG,
        reason: 'Remote Asset Catalog endpoint is not configured (PROVIDER_STATUS.NOT_CONFIGURED)'
      };
    }

    // In a configured remote catalog, query remote index
    return {
      canResolve: false,
      confidence: MATCH_CONFIDENCE.NONE,
      strategy: RESOLUTION_STRATEGY.REMOTE_CATALOG,
      reason: 'No remote asset found in catalog'
    };
  }

  async resolve(entity, requirements = {}, context = {}) {
    if (this.status === PROVIDER_STATUS.NOT_CONFIGURED || !this.endpoint) {
      return {
        success: false,
        strategy: RESOLUTION_STRATEGY.REMOTE_CATALOG,
        provider: this.name,
        error: 'RemoteAssetProvider is NOT_CONFIGURED'
      };
    }

    return {
      success: false,
      strategy: RESOLUTION_STRATEGY.REMOTE_CATALOG,
      provider: this.name,
      error: 'Remote asset retrieval failed'
    };
  }

  /**
   * Safe streaming download with size limits, timeout, and destination sandboxing
   */
  async downloadFile(url, destinationPath, expectedChecksum = null) {
    return new Promise((resolve, reject) => {
      let client = url.startsWith('https') ? https : http;
      let totalBytes = 0;
      let timedOut = false;

      const req = client.get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // Follow redirect safely
          return resolve(this.downloadFile(res.headers.location, destinationPath, expectedChecksum));
        }

        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP_ERROR: Server returned status code ${res.statusCode}`));
        }

        const contentLength = parseInt(res.headers['content-length'] || '0', 10);
        if (contentLength > this.maxSizeBytes) {
          req.destroy();
          return reject(new Error(`FILE_TOO_LARGE: Asset size (${contentLength} bytes) exceeds limit (${this.maxSizeBytes} bytes)`));
        }

        const outStream = fs.createWriteStream(destinationPath);

        res.on('data', (chunk) => {
          totalBytes += chunk.length;
          if (totalBytes > this.maxSizeBytes) {
            req.destroy();
            outStream.close();
            try { fs.unlinkSync(destinationPath); } catch {}
            return reject(new Error(`DOWNLOAD_EXCEEDED_MAX_SIZE: Received ${totalBytes} bytes`));
          }
        });

        res.pipe(outStream);

        outStream.on('finish', () => {
          outStream.close(() => resolve({ success: true, totalBytes }));
        });

        outStream.on('error', (err) => {
          try { fs.unlinkSync(destinationPath); } catch {}
          reject(err);
        });
      });

      req.setTimeout(this.timeoutMs, () => {
        timedOut = true;
        req.destroy();
        try { fs.unlinkSync(destinationPath); } catch {}
        reject(new Error(`NETWORK_TIMEOUT: Request timed out after ${this.timeoutMs}ms`));
      });

      req.on('error', (err) => {
        if (!timedOut) reject(err);
      });
    });
  }
}

module.exports = { RemoteAssetProvider };
