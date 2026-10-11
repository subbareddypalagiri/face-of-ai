// src/main/tools/astra/core/CheckpointManager.js — Non-Destructive Scene Checkpointing & Rollback
'use strict';

const path = require('path');
const fs = require('fs');
const logger = require('../../../../shared/Logger');

class CheckpointManager {
  constructor(bridgeRpcCaller, options = {}) {
    this.sendRPC = bridgeRpcCaller;
    this.checkpointDir = options.checkpointDir || path.resolve(__dirname, '../../../../../scratch/checkpoints');
    this.ensureDir();
    this.history = [];
  }

  ensureDir() {
    try {
      if (!fs.existsSync(this.checkpointDir)) {
        fs.mkdirSync(this.checkpointDir, { recursive: true });
      }
    } catch (e) {}
  }

  /**
   * Captures a non-destructive .blend checkpoint file on disk via Blender RPC
   */
  async createCheckpoint(checkpointTag = 'step') {
    const filename = `checkpoint_${Date.now()}_${checkpointTag}.blend`;
    const fullPath = path.join(this.checkpointDir, filename).replace(/\\/g, '/');

    logger.info(`[CheckpointManager] Saving scene checkpoint to: "${filename}"...`);

    const py = `
import bpy
try:
    bpy.ops.wm.save_as_mainfile(filepath=r"${fullPath}", copy=True)
    print("CHECKPOINT_SAVED_SUCCESS")
except Exception as e:
    print("CHECKPOINT_ERROR:", e)
`;

    try {
      const res = await this.sendRPC('execute_bpy', { code: py, autoCapture: false });
      const record = {
        id: `chk_${Date.now()}`,
        tag: checkpointTag,
        filePath: fullPath,
        timestamp: Date.now(),
        verified: res && !res.error
      };
      this.history.push(record);
      return record;
    } catch (e) {
      logger.warn(`[CheckpointManager] Failed to create checkpoint: ${e.message}`);
      return null;
    }
  }

  /**
   * Reverts Blender active scene to the latest verified checkpoint
   */
  async rollbackToLatest() {
    if (this.history.length === 0) {
      logger.warn('[CheckpointManager] No checkpoints available for rollback.');
      return false;
    }

    const latest = this.history[this.history.length - 1];
    logger.info(`[CheckpointManager] Reverting scene state to checkpoint: "${latest.filePath}"...`);

    const py = `
import bpy
try:
    bpy.ops.wm.open_mainfile(filepath=r"${latest.filePath}")
    print("ROLLBACK_RESTORED_SUCCESS")
except Exception as e:
    print("ROLLBACK_ERROR:", e)
`;

    try {
      const res = await this.sendRPC('execute_bpy', { code: py, autoCapture: false });
      return res && !res.error;
    } catch (e) {
      logger.error(`[CheckpointManager] Rollback failed: ${e.message}`);
      return false;
    }
  }
}

module.exports = { CheckpointManager };
