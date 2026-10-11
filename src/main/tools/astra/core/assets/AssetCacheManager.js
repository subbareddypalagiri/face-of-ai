// src/main/tools/astra/core/assets/AssetCacheManager.js — Deterministic 3D Model & Metadata Cache Engine
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../../../../../shared/Logger');

class AssetCacheManager {
  constructor(options = {}) {
    this.workspaceRoot = path.resolve(options.workspaceRoot || path.join(__dirname, '../../../../../../'));
    this.cacheDir = options.cacheDir || path.join(this.workspaceRoot, 'assets', 'cache');
    this.modelsDir = path.join(this.cacheDir, 'models');
    this.metadataDir = path.join(this.cacheDir, 'metadata');
    this.tmpDir = path.join(this.cacheDir, 'tmp');

    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.cacheDir, this.modelsDir, this.metadataDir, this.tmpDir].forEach(dir => {
      try {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      } catch (e) {
        logger.warn(`[AssetCacheManager] Failed to create cache directory "${dir}": ${e.message}`);
      }
    });
  }

  /**
   * Generates a deterministic, filesystem-safe cache key from entity query & category
   */
  generateCacheKey(query, category = 'prop', quality = 'STANDARD') {
    const cleanQuery = (query || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
    const hash = crypto.createHash('sha256').update(`${query}:${category}:${quality}`).digest('hex').substring(0, 10);
    return `${category}_${cleanQuery.substring(0, 32)}_${hash}`;
  }

  /**
   * Retrieves cached model if it exists and passes validation
   */
  async get(query, category = 'prop', quality = 'STANDARD') {
    // 1. Direct key check (if query is already a cache key or direct filename)
    const directModel = path.join(this.modelsDir, `${query}.glb`);
    const directMeta = path.join(this.metadataDir, `${query}.json`);
    if (fs.existsSync(directModel)) {
      try {
        const metadata = fs.existsSync(directMeta) ? JSON.parse(fs.readFileSync(directMeta, 'utf8')) : { format: 'GLB' };
        const stat = fs.statSync(directModel);
        if (stat.size > 0) {
          logger.info(`[AssetCacheManager] Direct Cache HIT for "${query}" ✓`);
          return {
            found: true,
            assetPath: directModel.replace(/\\/g, '/'),
            metadata,
            key: query
          };
        }
      } catch {}
    }

    // 2. Deterministic hashed key check
    const key = this.generateCacheKey(query, category, quality);
    const modelPath = path.join(this.modelsDir, `${key}.glb`);
    const metaPath = path.join(this.metadataDir, `${key}.json`);

    if (fs.existsSync(modelPath) && fs.existsSync(metaPath)) {
      try {
        const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        const stat = fs.statSync(modelPath);

        if (stat.size > 0 && stat.size === metadata.sizeBytes) {
          logger.info(`[AssetCacheManager] Cache HIT for "${query}" (${key}) ✓`);
          return {
            found: true,
            assetPath: modelPath.replace(/\\/g, '/'),
            metadata,
            key
          };
        }
      } catch (err) {
        logger.warn(`[AssetCacheManager] Corrupt cache entry for "${key}": ${err.message}`);
      }
    }

    // 3. Secondary semantic search across cached filenames
    try {
      const files = fs.readdirSync(this.modelsDir);
      const cleanSlug = (query || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
      for (const f of files) {
        if (f.endsWith('.glb') && f.toLowerCase().includes(cleanSlug)) {
          const directPath = path.join(this.modelsDir, f);
          const stat = fs.statSync(directPath);
          if (stat.size > 0) {
            logger.info(`[AssetCacheManager] Cache Semantic Match for "${query}": ${f} ✓`);
            return {
              found: true,
              assetPath: directPath.replace(/\\/g, '/'),
              metadata: {
                assetId: f.replace('.glb', ''),
                source: 'disk_cache',
                query,
                format: 'GLB',
                sizeBytes: stat.size,
                quality
              },
              key: f.replace('.glb', '')
            };
          }
        }
      }
    } catch {}

    return { found: false, key };
  }

  /**
   * Stores a validated model into the cache along with rich metadata
   */
  async put(key, sourceFilePath, metadata = {}) {
    if (!fs.existsSync(sourceFilePath)) {
      throw new Error(`Cannot cache non-existent file: ${sourceFilePath}`);
    }

    const ext = path.extname(sourceFilePath).toLowerCase() || '.glb';
    const targetModelPath = path.join(this.modelsDir, `${key}${ext}`);
    const targetMetaPath = path.join(this.metadataDir, `${key}.json`);

    // Non-destructive copy to cache models directory
    fs.copyFileSync(sourceFilePath, targetModelPath);
    const stats = fs.statSync(targetModelPath);

    const record = {
      assetId: key,
      source: metadata.source || 'ingested',
      provider: metadata.provider || 'unknown',
      query: metadata.query || key,
      createdAt: new Date().toISOString(),
      format: ext.replace('.', '').toUpperCase(),
      sizeBytes: stats.size,
      triangles: metadata.triangles || 0,
      materials: metadata.materials || 0,
      quality: metadata.quality || 'STANDARD',
      checksum: metadata.checksum || null,
      validated: metadata.validated !== false
    };

    fs.writeFileSync(targetMetaPath, JSON.stringify(record, null, 2), 'utf8');
    logger.info(`[AssetCacheManager] Cached asset "${key}" (${(stats.size / 1024 / 1024).toFixed(2)} MB) ✓`);

    return {
      assetPath: targetModelPath.replace(/\\/g, '/'),
      metadataPath: targetMetaPath.replace(/\\/g, '/'),
      metadata: record
    };
  }

  /**
   * Provides a safe temporary file path for incoming downloads
   */
  getTempFilePath(prefix = 'download', ext = '.glb') {
    const filename = `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
    return path.join(this.tmpDir, filename).replace(/\\/g, '/');
  }
}

module.exports = { AssetCacheManager };
