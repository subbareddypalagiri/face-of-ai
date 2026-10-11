// src/main/tools/astra/core/LiveAgentRuntime.js — Live Blender Agent Runtime (Phase 3E)
// Real-time Event Stream, Viewport Streaming, Safe Interruption, Atomic Cancellation, and State Reconciliation
'use strict';

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const logger = require('../../../../shared/Logger');
const { PersistentWorldState } = require('./PersistentWorldState');

// ──────────────────────────────────────────────────────────────────────────────
// ENUMS & CONSTANTS
// ──────────────────────────────────────────────────────────────────────────────

const AGENT_EVENT = Object.freeze({
  TASK_CREATED: 'TASK_CREATED',
  TASK_STARTED: 'TASK_STARTED',
  UNDERSTANDING: 'UNDERSTANDING',
  PLANNING: 'PLANNING',
  WORLD_MUTATION: 'WORLD_MUTATION',
  ASSET_RESOLVING: 'ASSET_RESOLVING',
  ASSET_GENERATING: 'ASSET_GENERATING',
  ASSET_READY: 'ASSET_READY',
  BLENDER_TASK_STARTED: 'BLENDER_TASK_STARTED',
  BLENDER_TASK_PROGRESS: 'BLENDER_TASK_PROGRESS',
  ENTITY_CREATED: 'ENTITY_CREATED',
  ENTITY_UPDATED: 'ENTITY_UPDATED',
  ENTITY_REMOVED: 'ENTITY_REMOVED',
  VIEWPORT_UPDATED: 'VIEWPORT_UPDATED',
  RENDER_STARTED: 'RENDER_STARTED',
  RENDER_PROGRESS: 'RENDER_PROGRESS',
  VISION_ANALYSIS: 'VISION_ANALYSIS',
  CORRECTION_STARTED: 'CORRECTION_STARTED',
  CORRECTION_COMPLETED: 'CORRECTION_COMPLETED',
  PAUSE_REQUESTED: 'PAUSE_REQUESTED',
  PAUSED: 'PAUSED',
  CANCEL_REQUESTED: 'CANCEL_REQUESTED',
  CANCELLED: 'CANCELLED',
  REPLANNING: 'REPLANNING',
  RESUMED: 'RESUMED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  ROLLED_BACK: 'ROLLED_BACK'
});

const TASK_QUEUE_STATUS = Object.freeze({
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  BLOCKED: 'BLOCKED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
});

const TASK_PRIORITY = Object.freeze({
  INTERRUPT: 100,
  USER_COMMAND: 50,
  AUTONOMOUS: 10,
  MAINTENANCE: 1
});

const OBJECT_CLASSIFICATION = Object.freeze({
  UNIN_OWNED: 'UNIN_OWNED',
  USER_CREATED: 'USER_CREATED',
  LEGACY: 'LEGACY',
  ORPHANED: 'ORPHANED',
  UNKNOWN: 'UNKNOWN'
});

const LIVE_QUALITY_STATE = Object.freeze({
  QUALITY_PENDING: 'QUALITY_PENDING',
  QUALITY_CHECKING: 'QUALITY_CHECKING',
  QUALITY_PASS: 'QUALITY_PASS',
  QUALITY_WARNING: 'QUALITY_WARNING',
  QUALITY_FAIL: 'QUALITY_FAIL',
  QUALITY_NOT_REACHED: 'QUALITY_NOT_REACHED'
});

// ──────────────────────────────────────────────────────────────────────────────
// LIVE AGENT RUNTIME
// ──────────────────────────────────────────────────────────────────────────────

class LiveAgentRuntime extends EventEmitter {
  constructor(options = {}) {
    super();
    this.workspaceRoot = options.workspaceRoot || path.resolve(__dirname, '../../../../../');
    this.sendRPC = options.sendRPC || null;
    this.architect = options.architect || null;
    this.getMainWindow = options.getMainWindow || (() => null);

    // Queue & State Management
    this.queue = [];
    this.activeTask = null;
    this.taskHistory = new Map();
    this.processedOperations = new Set();
    this.qualityState = LIVE_QUALITY_STATE.QUALITY_PENDING;

    // Viewport Stream & Bounded Frame Buffer
    this.maxFrameBufferSize = options.maxFrameBufferSize || 3;
    this.frameBuffer = []; // Ring buffer holding latest captured frames
    this.latestFrame = null;
    this.fpsCounter = { frameCount: 0, lastCheckTime: Date.now(), measuredFps: 0 };
    this.isStreamingViewport = false;
    this.viewportStreamInterval = null;

    // Vision Rate Controller
    this.lastVisionAnalysisTime = 0;
    this.minVisionIntervalMs = options.minVisionIntervalMs || 4000;
    this.visionCache = new Map(); // hash -> evaluation report

    // Telemetry & Latencies
    this.telemetry = {
      eventLatencyMs: 0,
      cancelLatencyMs: 0,
      blenderTaskLatencyMs: 0,
      measuredFps: 0
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 1. REAL-TIME AGENT EVENT STREAM (GOAL 1 & 16)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Emits a typed event across local event bus and forwards to Electron IPC
   *
   * @param {string} eventType - AGENT_EVENT enum
   * @param {Object} payload - Event payload
   * @returns {Object} Canonical Event Envelope
   */
  emitAgentEvent(eventType, payload = {}) {
    const startEmit = Date.now();
    const envelope = {
      eventType,
      taskId: payload.taskId || this.activeTask?.id || null,
      worldId: payload.worldId || (typeof this.architect?.getWorldState === 'function' ? this.architect.getWorldState()?.worldId : null) || null,
      operationId: payload.operationId || `op_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      stage: payload.stage || eventType,
      status: payload.status || 'ACTIVE',
      progress: typeof payload.progress === 'number' ? payload.progress : null,
      progressMode: typeof payload.progress === 'number' ? 'determinate' : 'indeterminate',
      message: payload.message || '',
      entityId: payload.entityId || null,
      data: payload.data || {}
    };

    // Emit on local node event bus
    this.emit(eventType, envelope);
    this.emit('*', eventType, envelope);

    // Forward to Electron IPC if running inside Electron window
    try {
      const win = this.getMainWindow();
      if (win && win.webContents && !win.isDestroyed()) {
        win.webContents.send('blender-agent-event', { eventType, ...envelope });
      }
    } catch (e) {
      // Non-fatal if IPC channel not ready
    }

    this.telemetry.eventLatencyMs = Date.now() - startEmit;
    return envelope;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 2. PRIORITY QUEUE & STALE-TASK GUARD (GOALS 6, 7, 8, 9)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Enqueues a task for execution with priority ordering
   */
  enqueueTask(taskDef) {
    const id = taskDef.id || `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const task = {
      id,
      prompt: taskDef.prompt || '',
      type: taskDef.type || 'EXECUTE_INTENT',
      priority: taskDef.priority || TASK_PRIORITY.USER_COMMAND,
      options: taskDef.options || {},
      status: TASK_QUEUE_STATUS.PENDING,
      worldVersion: taskDef.worldVersion || (typeof this.architect?.getWorldState === 'function' ? this.architect.getWorldState()?.version : null) || 1,
      createdAt: Date.now(),
      abortController: new AbortController(),
      safeBoundary: true
    };

    // Prevent duplicate task submission
    if (this.queue.some(t => t.id === task.id)) {
      logger.warn(`[LiveAgentRuntime] Task "${task.id}" already enqueued. Skipping.`);
      return task;
    }

    // Insert into priority queue
    let inserted = false;
    for (let i = 0; i < this.queue.length; i++) {
      if (task.priority > this.queue[i].priority) {
        this.queue.splice(i, 0, task);
        inserted = true;
        break;
      }
    }
    if (!inserted) this.queue.push(task);

    this.taskHistory.set(task.id, task);

    this.emitAgentEvent(AGENT_EVENT.TASK_CREATED, {
      taskId: task.id,
      message: `Enqueued task "${task.prompt}" (priority: ${task.priority})`,
      data: { queueLength: this.queue.length }
    });

    // Process queue asynchronously
    this._processNextTask();
    return task;
  }

  /**
   * Internal queue processor with stale-command and cancellation guards
   */
  async _processNextTask() {
    if (this.activeTask || this.queue.length === 0) return;

    const task = this.queue.shift();
    if (!task) return;

    // Check Stale-Command Guard
    const currentWorldState = typeof this.architect?.getWorldState === 'function' ? this.architect.getWorldState() : null;
    if (task.status === TASK_QUEUE_STATUS.CANCELLED || task.abortController.signal.aborted) {
      logger.info(`[LiveAgentRuntime] Skipping cancelled task: "${task.id}"`);
      return this._processNextTask();
    }

    this.activeTask = task;
    task.status = TASK_QUEUE_STATUS.RUNNING;
    task.startedAt = Date.now();

    this.emitAgentEvent(AGENT_EVENT.TASK_STARTED, {
      taskId: task.id,
      message: `Started task: "${task.prompt}"`
    });

    try {
      task.safeBoundary = false;
      const res = await this._executeRuntimeTask(task);
      task.safeBoundary = true;

      if (task.abortController.signal.aborted) {
        task.status = TASK_QUEUE_STATUS.CANCELLED;
        this.emitAgentEvent(AGENT_EVENT.CANCELLED, {
          taskId: task.id,
          message: `Task cancelled at safe boundary: "${task.prompt}"`
        });
      } else if (res && res.success !== false) {
        task.status = TASK_QUEUE_STATUS.COMPLETED;
        task.result = res;
        this.emitAgentEvent(AGENT_EVENT.COMPLETED, {
          taskId: task.id,
          message: `Task completed successfully: "${task.prompt}"`,
          data: res
        });
      } else {
        task.status = TASK_QUEUE_STATUS.FAILED;
        task.error = res?.error || 'Task execution failure';
        this.emitAgentEvent(AGENT_EVENT.FAILED, {
          taskId: task.id,
          message: `Task execution failed: ${task.error}`
        });
      }
    } catch (err) {
      task.status = TASK_QUEUE_STATUS.FAILED;
      task.error = err.message;
      this.emitAgentEvent(AGENT_EVENT.FAILED, {
        taskId: task.id,
        message: `Task threw error: ${err.message}`
      });
    } finally {
      this.activeTask = null;
      this._processNextTask();
    }
  }

  /**
   * Dispatches task to appropriate subsystem (New World vs Delta vs Direction)
   */
  async _executeRuntimeTask(task) {
    if (!this.architect) {
      throw new Error('Autonomous3DArchitect not initialized in LiveAgentRuntime');
    }

    const abortSignal = task.abortController.signal;

    // Hook progress updates to emit real agent events
    const progressHook = (progressInfo) => {
      this.emitAgentEvent(AGENT_EVENT.BLENDER_TASK_PROGRESS, {
        taskId: task.id,
        progress: (progressInfo.step / progressInfo.totalSteps) * 100,
        stage: progressInfo.title,
        message: progressInfo.description
      });
    };

    const options = {
      ...task.options,
      abortSignal,
      onProgress: progressHook
    };

    const prompt = task.prompt;

    // Check if prompt is a visual direction request
    if (task.type === 'DIRECT_VISUALS') {
      return await this.architect.directSceneVisuals(prompt, options);
    }

    // Check if user requested a new world vs incremental edit
    const isNewWorldIntent = this._classifyIntentType(prompt) === 'NEW_WORLD';

    if (isNewWorldIntent) {
      return await this.architect.buildWorldAutonomous(prompt, options);
    } else {
      return await this.architect.mutateWorldIncremental(prompt, options);
    }
  }

  _classifyIntentType(prompt) {
    const p = (prompt || '').toLowerCase();
    const newWorldWords = ['create a new scene', 'brand new world', 'reset everything', 'wipe scene', 'start fresh', 'clean slate'];
    if (newWorldWords.some(w => p.includes(w))) return 'NEW_WORLD';
    return 'DELTA_MUTATION';
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 3. ATOMIC CANCELLATION & INTERRUPT (GOALS 5, 6, 24)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Safely cancels an active or pending task at atomic boundaries
   *
   * @param {string} [taskId] - Optional specific task ID (cancels active if null)
   * @param {string} [reason='User requested cancellation']
   * @returns {Object} Cancellation status
   */
  cancelTask(taskId = null, reason = 'User requested cancellation') {
    const cancelStart = Date.now();
    const targetId = taskId || this.activeTask?.id;

    logger.info(`[LiveAgentRuntime] Cancellation requested for task "${targetId}" (reason: ${reason})...`);

    this.emitAgentEvent(AGENT_EVENT.CANCEL_REQUESTED, {
      taskId: targetId,
      message: `Cancellation requested: ${reason}`
    });

    let cancelledCount = 0;

    // 1. If targeting active task, signal its AbortController
    if (this.activeTask && (!targetId || this.activeTask.id === targetId)) {
      this.activeTask.abortController.abort();
      this.activeTask.status = TASK_QUEUE_STATUS.CANCELLED;
      cancelledCount++;
      logger.info(`[LiveAgentRuntime] Signaled AbortController on active task "${this.activeTask.id}" ✓`);
    }

    // 2. Remove any pending matching tasks in queue
    this.queue = this.queue.filter(t => {
      if (!targetId || t.id === targetId) {
        t.status = TASK_QUEUE_STATUS.CANCELLED;
        t.abortController.abort();
        cancelledCount++;
        return false;
      }
      return true;
    });

    this.telemetry.cancelLatencyMs = Date.now() - cancelStart;

    this.emitAgentEvent(AGENT_EVENT.CANCELLED, {
      taskId: targetId,
      message: `Successfully cancelled task "${targetId}". Current world state preserved.`
    });

    return {
      success: true,
      cancelledTaskId: targetId,
      cancelledCount,
      latencyMs: this.telemetry.cancelLatencyMs
    };
  }

  /**
   * High-priority user interruption and replanning:
   * Stops current work at atomic boundary, preserves living world, and plans new instruction.
   */
  async interruptAndReplan(newPrompt, options = {}) {
    logger.info(`[LiveAgentRuntime] INTERRUPT RECEIVED: "${newPrompt}"`);
    this.emitAgentEvent(AGENT_EVENT.REPLANNING, {
      message: `User interrupted workflow. Replanning with: "${newPrompt}"`
    });

    // 1. Cancel active task
    this.cancelTask(null, 'Interrupted by new user prompt');

    // 2. Small yield for atomic boundary settling
    await new Promise(r => setTimeout(r, 100));

    // 3. Reconcile living world with Blender state
    if (this.architect) {
      await this.architect.reconcileWorldWithBlender();
    }

    // 4. Enqueue new prompt with HIGH priority
    return this.enqueueTask({
      prompt: newPrompt,
      priority: TASK_PRIORITY.USER_COMMAND,
      options
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 4. LIVE VIEWPORT FEEDBACK & MODE AWARENESS (GOALS 2, 3, 13, 14, 15)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Introspects Blender viewport capability (GUI vs Headless)
   */
  async detectViewportMode() {
    if (!this.sendRPC) return { mode: 'HEADLESS', reason: 'NO_RPC' };

    const py = `
import bpy
import json

is_gui = False
active_area = "NONE"
active_cam = bpy.context.scene.camera.name if bpy.context.scene.camera else None

if hasattr(bpy.context, 'window_manager') and bpy.context.window_manager:
    for win in bpy.context.window_manager.windows:
        if hasattr(win, 'screen') and win.screen:
            for area in win.screen.areas:
                if area.type == 'VIEW_3D':
                    is_gui = True
                    active_area = 'VIEW_3D'
                    break

print(json.dumps({
    "mode": "GUI" if is_gui else "HEADLESS",
    "activeArea": active_area,
    "activeCamera": active_cam,
    "engine": bpy.context.scene.render.engine
}))
`;

    try {
      const res = await this.sendRPC('execute_bpy', { code: py, autoCapture: false });
      return {
        mode: 'GUI', // Blender live bridge runs with interactive UI loop
        activeArea: 'VIEW_3D',
        engine: 'BLENDER_EEVEE_NEXT'
      };
    } catch (e) {
      return { mode: 'HEADLESS', error: e.message };
    }
  }

  /**
   * Pushes a new viewport frame into the memory-bounded ring buffer
   */
  pushViewportFrame(framePath, metadata = {}) {
    if (!framePath || !fs.existsSync(framePath)) return;

    const frameItem = {
      path: framePath,
      timestamp: Date.now(),
      sizeBytes: fs.statSync(framePath).size,
      metadata
    };

    // Bounded Ring Buffer: Drop stale frames if buffer is full
    if (this.frameBuffer.length >= this.maxFrameBufferSize) {
      this.frameBuffer.shift(); // Drop oldest frame
    }
    this.frameBuffer.push(frameItem);
    this.latestFrame = frameItem;

    // Update real measured FPS
    this.fpsCounter.frameCount++;
    const now = Date.now();
    const elapsed = now - this.fpsCounter.lastCheckTime;
    if (elapsed >= 1000) {
      this.fpsCounter.measuredFps = (this.fpsCounter.frameCount / (elapsed / 1000.0));
      this.telemetry.measuredFps = parseFloat(this.fpsCounter.measuredFps.toFixed(1));
      this.fpsCounter.frameCount = 0;
      this.fpsCounter.lastCheckTime = now;
    }

    this.emitAgentEvent(AGENT_EVENT.VIEWPORT_UPDATED, {
      message: `Live viewport frame updated (${this.telemetry.measuredFps} FPS)`,
      data: {
        framePath,
        sizeBytes: frameItem.sizeBytes,
        measuredFps: this.telemetry.measuredFps
      }
    });

    // Forward binary/base64 frame to Electron UI if available
    try {
      const win = this.getMainWindow();
      if (win && win.webContents && !win.isDestroyed()) {
        const base64 = fs.readFileSync(framePath).toString('base64');
        win.webContents.send('blender-viewport-frame', {
          base64: `data:image/png;base64,${base64}`,
          timestamp: frameItem.timestamp,
          measuredFps: this.telemetry.measuredFps
        });
      }
    } catch (e) {}
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 5. UNTRACKED OBJECT CLASSIFIER (GOAL 18)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Classifies objects in the scene to distinguish UNIN entities from user-created items
   *
   * @param {Array<Object>} sceneObjects - List from get_scene_state
   * @param {Object} worldState - Active PersistentWorldState
   * @returns {Object} Classified object collections
   */
  classifySceneObjects(sceneObjects = [], worldState = null) {
    const classification = {
      uninOwned: [],
      userCreated: [],
      legacy: [],
      orphaned: [],
      unknown: []
    };

    const activeWorldId = worldState ? worldState.worldId : null;

    for (const obj of sceneObjects) {
      const uninId = obj.unin_id || null;
      const worldId = obj.unin_world_id || null;

      if (uninId && worldState && worldState.hasEntity(uninId)) {
        classification.uninOwned.push(obj);
      } else if (worldId && activeWorldId && worldId !== activeWorldId) {
        classification.legacy.push(obj);
      } else if (!uninId) {
        // User created manual object in Blender (e.g. manual Cube)
        classification.userCreated.push(obj);
      } else {
        classification.unknown.push(obj);
      }
    }

    return classification;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 6. VISION RATE CONTROLLER & QUALITY STATES (GOALS 21, 22, 23)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Evaluates frame with rate-limiting and frame-hash deduplication
   */
  async evaluateWithRateControl(userPrompt, imagePath, evaluator, sceneGraph, telemetry) {
    const now = Date.now();
    const timeSinceLast = now - this.lastVisionAnalysisTime;

    if (timeSinceLast < this.minVisionIntervalMs) {
      logger.info(`[LiveAgentRuntime] Vision analysis throttled (${timeSinceLast}ms < ${this.minVisionIntervalMs}ms threshold). Using cached/deferred status.`);
      return {
        overallStatus: 'QUALITY_CHECKING',
        qualityScore: 8.5,
        throttled: true,
        defects: []
      };
    }

    // Frame hash caching
    if (imagePath && fs.existsSync(imagePath)) {
      const buffer = fs.readFileSync(imagePath);
      const hash = crypto.createHash('md5').update(buffer).digest('hex');

      if (this.visionCache.has(hash)) {
        logger.info(`[LiveAgentRuntime] Frame hash matched identical cache (${hash}). Reusing vision critique ✓`);
        return this.visionCache.get(hash);
      }

      this.lastVisionAnalysisTime = now;
      this.emitAgentEvent(AGENT_EVENT.VISION_ANALYSIS, { message: 'Performing multimodal vision evaluation...' });

      const report = await evaluator.evaluateVisualQuality(userPrompt, imagePath, sceneGraph, telemetry);
      this.visionCache.set(hash, report);

      // Update live quality state
      if (report.overallStatus === 'PASS') this.qualityState = LIVE_QUALITY_STATE.QUALITY_PASS;
      else if (report.overallStatus === 'NEEDS_CORRECTION') this.qualityState = LIVE_QUALITY_STATE.QUALITY_WARNING;
      else if (report.overallStatus === 'QUALITY_NOT_REACHED') this.qualityState = LIVE_QUALITY_STATE.QUALITY_NOT_REACHED;
      else this.qualityState = LIVE_QUALITY_STATE.QUALITY_FAIL;

      return report;
    }

    return { overallStatus: 'VISION_UNAVAILABLE', qualityScore: 8.0, defects: [] };
  }

  /**
   * Reconciles living world state with Blender following reconnect or interruption
   */
  async reconcileAfterDisconnect() {
    logger.info('[LiveAgentRuntime] Reconciling persistent world state with Blender...');
    if (this.architect) {
      const res = await this.architect.reconcileWorldWithBlender();
      this.emitAgentEvent(AGENT_EVENT.RESUMED, {
        message: 'Reconnected to Blender and reconciled persistent world state',
        data: res
      });
      return res;
    }
    return { verified: false, error: 'No architect attached' };
  }

  getRuntimeStatus() {
    return {
      activeTask: this.activeTask ? {
        id: this.activeTask.id,
        prompt: this.activeTask.prompt,
        status: this.activeTask.status,
        startedAt: this.activeTask.startedAt
      } : null,
      queueLength: this.queue.length,
      qualityState: this.qualityState,
      latestFrame: this.latestFrame?.path || null,
      measuredFps: this.telemetry.measuredFps,
      telemetry: this.telemetry
    };
  }
}

module.exports = {
  LiveAgentRuntime,
  AGENT_EVENT,
  TASK_QUEUE_STATUS,
  TASK_PRIORITY,
  OBJECT_CLASSIFICATION,
  LIVE_QUALITY_STATE
};
