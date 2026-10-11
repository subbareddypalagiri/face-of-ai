// src/main/tools/astra/core/assets/AssetValidator.js — Deep 3D Asset Validation & Security Pipeline
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../../../../../shared/Logger');

const SUPPORTED_FORMATS = ['glb', 'gltf', 'fbx', 'obj'];
const GLB_MAGIC = 0x46546C67; // "glTF" in little-endian uint32
const DEFAULT_MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

class AssetValidator {
  constructor(options = {}) {
    this.workspaceRoot = path.resolve(options.workspaceRoot || path.join(__dirname, '../../../../../../'));
    this.allowedRoots = (options.allowedRoots || [
      this.workspaceRoot,
      path.join(this.workspaceRoot, 'assets'),
      path.join(this.workspaceRoot, 'scratch')
    ]).map(r => path.resolve(r));
    this.maxSizeBytes = options.maxSizeBytes || DEFAULT_MAX_SIZE_BYTES;
  }

  /**
   * Validates safety of file path against path traversal attacks
   */
  isPathSecure(targetPath) {
    if (!targetPath || typeof targetPath !== 'string') return false;
    const resolved = path.resolve(targetPath);

    // Ensure path resides strictly inside an approved workspace or cache directory
    const isContained = this.allowedRoots.some(root => {
      const rel = path.relative(root, resolved);
      return !rel.startsWith('..') && !path.isAbsolute(rel);
    });

    return isContained;
  }

  /**
   * Computes SHA-256 checksum of file for deterministic cache tracking
   */
  computeChecksum(filePath) {
    try {
      const buffer = fs.readFileSync(filePath);
      return crypto.createHash('sha256').update(buffer).digest('hex');
    } catch {
      return null;
    }
  }

  /**
   * Full Deep Validation of a 3D asset file
   */
  async validate(filePath, options = {}) {
    const report = {
      valid: false,
      filePath,
      errors: [],
      warnings: [],
      metrics: {
        format: null,
        sizeBytes: 0,
        estimatedTriangles: 0,
        vertexCount: 0,
        meshCount: 0,
        materialCount: 0,
        hasTextures: false,
        checksum: null
      }
    };

    // 1. Security: Path Traversal Check
    if (!this.isPathSecure(filePath)) {
      report.errors.push(`SECURITY_PATH_TRAVERSAL: File path "${filePath}" is outside authorized asset root directories.`);
      return report;
    }

    // 2. Existence & Accessibility
    if (!fs.existsSync(filePath)) {
      report.errors.push(`FILE_NOT_FOUND: Asset file does not exist at "${filePath}".`);
      return report;
    }

    let stats;
    try {
      stats = fs.statSync(filePath);
    } catch (e) {
      report.errors.push(`FILE_READ_ERROR: Cannot read file stats: ${e.message}`);
      return report;
    }

    if (!stats.isFile()) {
      report.errors.push(`NOT_A_FILE: Target path is a directory or special file.`);
      return report;
    }

    report.metrics.sizeBytes = stats.size;

    // 3. File Size Checks
    if (stats.size === 0) {
      report.errors.push(`EMPTY_FILE: Asset file is 0 bytes.`);
      return report;
    }

    if (stats.size > this.maxSizeBytes) {
      report.errors.push(`FILE_TOO_LARGE: Asset size (${(stats.size / 1024 / 1024).toFixed(1)}MB) exceeds limit of ${(this.maxSizeBytes / 1024 / 1024).toFixed(1)}MB.`);
      return report;
    }

    // 4. Format Verification
    const ext = path.extname(filePath).replace('.', '').toLowerCase();
    if (!SUPPORTED_FORMATS.includes(ext)) {
      report.errors.push(`UNSUPPORTED_FORMAT: Format ".${ext}" is not supported. Must be one of: ${SUPPORTED_FORMATS.join(', ')}.`);
      return report;
    }
    report.metrics.format = ext.toUpperCase();

    // 5. Binary / Structural Integrity Verification
    try {
      if (ext === 'glb') {
        this._validateGlbHeader(filePath, stats.size, report);
      } else if (ext === 'gltf') {
        this._validateGltfContent(filePath, report);
      } else if (ext === 'obj') {
        this._validateObjContent(filePath, report);
      } else if (ext === 'fbx') {
        this._validateFbxHeader(filePath, report);
      }
    } catch (err) {
      report.errors.push(`STRUCTURAL_VALIDATION_ERROR: ${err.message}`);
    }

    // 6. Checksum computation
    if (report.errors.length === 0) {
      report.metrics.checksum = this.computeChecksum(filePath);
      report.valid = true;
    }

    // 7. Triangle Budget Warnings
    const budget = options.triangleBudget;
    if (budget && report.metrics.estimatedTriangles > budget) {
      report.warnings.push(`BUDGET_EXCEEDED: Estimated triangles (${report.metrics.estimatedTriangles}) exceeds budget (${budget}). Decimation will be applied.`);
    }

    return report;
  }

  _validateGlbHeader(filePath, expectedSize, report) {
    const fd = fs.openSync(filePath, 'r');
    const headerBuf = Buffer.alloc(20);
    fs.readSync(fd, headerBuf, 0, 20, 0);

    const magic = headerBuf.readUInt32LE(0);
    const version = headerBuf.readUInt32LE(4);
    const length = headerBuf.readUInt32LE(8);

    if (magic !== GLB_MAGIC) {
      fs.closeSync(fd);
      report.errors.push(`CORRUPT_GLB_MAGIC: Invalid GLB header magic (0x${magic.toString(16)} != 0x${GLB_MAGIC.toString(16)}).`);
      return;
    }

    if (version !== 2 && version !== 1) {
      report.warnings.push(`UNUSUAL_GLTF_VERSION: GLTF container reports version ${version}.`);
    }

    if (length > expectedSize) {
      report.warnings.push(`TRUNCATED_GLB_WARNING: Header reports ${length} bytes but file has ${expectedSize} bytes.`);
    }

    // Read Chunk 0 (JSON) to extract lightweight scene metrics
    try {
      const chunk0Length = headerBuf.readUInt32LE(12);
      const chunk0Type = headerBuf.readUInt32LE(16); // 0x4E4F534A = "JSON"

      if (chunk0Type === 0x4E4F534A && chunk0Length > 0 && chunk0Length < 5 * 1024 * 1024) {
        const jsonBuf = Buffer.alloc(chunk0Length);
        fs.readSync(fd, jsonBuf, 0, chunk0Length, 20);
        fs.closeSync(fd);

        const gltf = JSON.parse(jsonBuf.toString('utf8'));
        report.metrics.meshCount = (gltf.meshes || []).length;
        report.metrics.materialCount = (gltf.materials || []).length;
        report.metrics.hasTextures = (gltf.textures || []).length > 0;

        // Estimate triangles from accessors
        let estimatedTris = 0;
        let estimatedVerts = 0;
        if (gltf.meshes && Array.isArray(gltf.meshes)) {
          for (const mesh of gltf.meshes) {
            for (const prim of (mesh.primitives || [])) {
              if (prim.indices !== undefined && gltf.accessors && gltf.accessors[prim.indices]) {
                const count = gltf.accessors[prim.indices].count || 0;
                estimatedTris += Math.floor(count / 3);
              }
              if (prim.attributes && prim.attributes.POSITION !== undefined && gltf.accessors) {
                const vertAccessor = gltf.accessors[prim.attributes.POSITION];
                if (vertAccessor) estimatedVerts += vertAccessor.count || 0;
              }
            }
          }
        }
        report.metrics.estimatedTriangles = estimatedTris > 0 ? estimatedTris : Math.max(120, estimatedVerts);
        report.metrics.vertexCount = estimatedVerts;
        return;
      }
    } catch {
      // Fallback estimate
    }

    try { fs.closeSync(fd); } catch {}
    report.metrics.estimatedTriangles = Math.max(500, Math.floor(expectedSize / 64));
  }

  _validateGltfContent(filePath, report) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const gltf = JSON.parse(raw);
    if (!gltf.asset || !gltf.asset.version) {
      report.errors.push(`INVALID_GLTF_STRUCTURE: Missing asset.version in glTF JSON.`);
      return;
    }
    report.metrics.meshCount = (gltf.meshes || []).length;
    report.metrics.materialCount = (gltf.materials || []).length;
    report.metrics.hasTextures = (gltf.textures || []).length > 0;
    report.metrics.estimatedTriangles = Math.max(100, (gltf.meshes || []).length * 1500);
  }

  _validateObjContent(filePath, report) {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(4096);
    const bytesRead = fs.readSync(fd, buf, 0, 4096, 0);
    fs.closeSync(fd);

    const snippet = buf.toString('utf8', 0, bytesRead);
    if (!snippet.includes('v ') && !snippet.includes('#') && !snippet.includes('f ')) {
      report.errors.push(`INVALID_OBJ_FORMAT: File does not contain standard Wavefront OBJ geometric vertices.`);
      return;
    }
    report.metrics.estimatedTriangles = Math.max(300, Math.floor(fs.statSync(filePath).size / 48));
  }

  _validateFbxHeader(filePath, report) {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(256);
    const bytesRead = fs.readSync(fd, buf, 0, 256, 0);
    fs.closeSync(fd);

    const header = buf.toString('utf8', 0, bytesRead);
    if (!header.includes('Kaydara FBX Binary') && !header.includes('FBX') && !header.includes(';') && !header.includes('Version')) {
      report.warnings.push(`UNUSUAL_FBX_HEADER: Could not verify standard Autodesk FBX header signature.`);
    }
    report.metrics.estimatedTriangles = Math.max(1000, Math.floor(fs.statSync(filePath).size / 72));
  }
}

module.exports = { AssetValidator, SUPPORTED_FORMATS };
