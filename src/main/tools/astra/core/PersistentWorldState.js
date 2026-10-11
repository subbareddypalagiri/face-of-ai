// src/main/tools/astra/core/PersistentWorldState.js — Persistent Living 3D World State & Canonical Entity Registry
'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('../../../../shared/Logger');

/**
 * Valid Entity Status Lifecycle
 */
const ENTITY_STATUS = {
  ACTIVE: 'ACTIVE',
  REMOVED: 'REMOVED',
  PENDING: 'PENDING'
};

class PersistentWorldState {
  /**
   * @param {Object} spec
   * @param {string} [spec.worldId] - Unique immutable world identifier
   * @param {number} [spec.version=1] - Monotonically increasing mutation version
   * @param {string} [spec.storageDir] - Directory where world state JSON files are persisted
   */
  constructor(spec = {}) {
    if (typeof spec === 'string') {
      spec = { worldId: spec };
    }
    this.worldId = spec.worldId || `unin_world_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.version = typeof spec.version === 'number' ? spec.version : 1;
    this.createdAt = spec.createdAt || new Date().toISOString();
    this.updatedAt = spec.updatedAt || new Date().toISOString();
    this.activeCheckpoint = spec.activeCheckpoint || null;
    this.blendFilePath = spec.blendFilePath || null;
    this.lastSavedBlendPath = spec.lastSavedBlendPath || null;

    // Canonical Entity Registry: Map<canonicalId, WorldEntity>
    this.entityRegistry = new Map();

    // Ingest entities if provided
    if (spec.entities) {
      if (Array.isArray(spec.entities)) {
        for (const ent of spec.entities) {
          const id = ent?.uninId || ent?.canonicalId;
          if (ent && id) this.entityRegistry.set(id, { ...ent, uninId: id });
        }
      } else if (typeof spec.entities === 'object') {
        for (const [id, ent] of Object.entries(spec.entities)) {
          if (ent && (ent.uninId || ent.canonicalId || id)) {
            const uninId = ent.uninId || ent.canonicalId || id;
            this.entityRegistry.set(uninId, { ...ent, uninId });
          }
        }
      }
    }

    // World subsystems state
    this.environmentState = spec.environmentState || {
      baseSurface: 'wet_asphalt',
      weather: 'rain',
      fogDensity: 0.02,
      puddles: true
    };

    this.lightingState = spec.lightingState || {
      mood: 'cinematic_contrast',
      timeOfDay: 'night',
      keyColor: [1.0, 0.95, 0.88],
      rimColor: [0.2, 0.85, 1.0],
      fillColor: [0.4, 0.6, 0.9]
    };

    this.cameraState = spec.cameraState || {
      lensFocalLength: 40,
      apertureFStop: 3.2,
      targetEntityId: null
    };

    // Active Visual Production Plan (Phase 3C)
    this.visualPlan = spec.visualPlan || null;

    // Animation, Physics & VFX State (Phase 6)
    this.animationState = spec.animationState || {
      timeline: { start: 1, end: 120, fps: 24 },
      activeTracks: []
    };
    this.physicsState = spec.physicsState || {
      activeSimulations: []
    };
    this.vfxState = spec.vfxState || {
      activeVFX: []
    };

    // Append-only structured mutation history
    this.mutationHistory = Array.isArray(spec.mutationHistory) ? [...spec.mutationHistory] : [];

    // Current active task metadata
    this.currentTask = spec.currentTask || null;

    // Persistence storage configuration
    this.storageDir = spec.storageDir || path.resolve(__dirname, '../../../../../scratch/worlds');
    this._ensureStorageDirectory();
  }

  _ensureStorageDirectory() {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
    } catch (err) {
      logger.warn(`[PersistentWorldState] Directory creation warning: ${err.message}`);
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // STATIC FACTORIES & DISK REHYDRATION
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Creates a fresh active world session
   */
  static createNew(options = {}) {
    const worldId = `unin_world_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const instance = new PersistentWorldState({
      worldId,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      storageDir: options.storageDir,
      currentTask: options.task || null,
      environmentState: options.environmentState,
      lightingState: options.lightingState,
      cameraState: options.cameraState
    });

    logger.info(`[PersistentWorldState] Initialized new world: ${worldId} (v1)`);
    return instance;
  }

  /**
   * Loads specific world by ID from disk
   */
  static load(worldId, storageDir = null) {
    const targetDir = storageDir || path.resolve(__dirname, '../../../../../scratch/worlds');
    const filePath = path.join(targetDir, `${worldId}.json`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Persistent world file not found: ${filePath}`);
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(raw);
      data.storageDir = targetDir;
      const instance = new PersistentWorldState(data);
      logger.info(`[PersistentWorldState] Successfully rehydrated world: ${worldId} (v${instance.version}, entities: ${instance.entityRegistry.size}) ✓`);
      return instance;
    } catch (err) {
      logger.error(`[PersistentWorldState] Failed to rehydrate world ${worldId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Loads currently active world from scratch/worlds/active_world.json pointer
   */
  static loadActive(storageDir = null) {
    const targetDir = storageDir || path.resolve(__dirname, '../../../../../scratch/worlds');
    const pointerPath = path.join(targetDir, 'active_world.json');

    if (!fs.existsSync(pointerPath)) {
      return null;
    }

    try {
      const raw = fs.readFileSync(pointerPath, 'utf8');
      const pointer = JSON.parse(raw);
      if (!pointer || !pointer.activeWorldId) return null;
      return PersistentWorldState.load(pointer.activeWorldId, targetDir);
    } catch (err) {
      logger.warn(`[PersistentWorldState] Active world pointer unreadable: ${err.message}`);
      return null;
    }
  }

  /**
   * Rehydrates PersistentWorldState from a serialized JSON object or string
   */
  static fromJSON(data) {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    return new PersistentWorldState(data);
  }

  /**
   * Updates animation timeline and active tracks
   */
  setAnimationState(state = {}) {
    this.animationState = { ...(this.animationState || {}), ...state };
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Updates physics simulation domain state
   */
  setPhysicsState(state = {}) {
    this.physicsState = { ...(this.physicsState || {}), ...state };
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Updates active VFX emitters state
   */
  setVFXState(state = {}) {
    this.vfxState = { ...(this.vfxState || {}), ...state };
    this.updatedAt = new Date().toISOString();
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ENTITY REGISTRY MANAGEMENT (CANONICAL IDENTITY)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Registers a new canonical entity in the persistent registry
   * @param {Object} entity
   * @param {string} [entity.uninId] - Canonical GUID
   * @param {string} [entity.canonicalId] - Canonical GUID alias
   * @param {string} [entity.blenderName] - Active Blender object name
   * @param {string} [entity.category='prop'] - Category (vehicle, architecture, creature, light, camera)
   * @param {string} [entity.role='hero'] - Role (hero, foundation, prop, light, camera)
   */
  registerEntity(entity) {
    const uninId = entity?.uninId || entity?.canonicalId;
    if (!entity || !uninId) {
      throw new Error('Entity must have a non-empty canonical uninId');
    }
    entity.uninId = uninId;

    const now = new Date().toISOString();
    const existing = this.entityRegistry.get(entity.uninId);

    const record = {
      uninId: entity.uninId,
      worldId: this.worldId,
      blenderName: entity.blenderName || (existing ? existing.blenderName : entity.uninId),
      category: entity.category || (existing ? existing.category : 'prop'),
      role: entity.role || (existing ? existing.role : 'prop'),
      assetId: entity.assetId || (existing ? existing.assetId : null),
      version: existing ? existing.version + 1 : (entity.version || 1),
      createdAt: existing ? existing.createdAt : (entity.createdAt || now),
      updatedAt: now,
      status: entity.status || ENTITY_STATUS.ACTIVE,
      metadata: {
        ...(existing?.metadata || {}),
        ...(entity.metadata || {}),
        estimatedDimensions: entity.estimatedDimensions || entity.metadata?.estimatedDimensions || existing?.metadata?.estimatedDimensions || [1.0, 1.0, 1.0],
        targetLocation: entity.targetLocation || entity.metadata?.targetLocation || existing?.metadata?.targetLocation || [0.0, 0.0, 0.0],
        materials: entity.materials || entity.metadata?.materials || existing?.metadata?.materials || []
      }
    };

    this.entityRegistry.set(entity.uninId, record);
    this.updatedAt = now;
    return record;
  }

  /**
   * Retrieves an entity by its canonical UNIN ID
   */
  getEntity(uninId) {
    return this.entityRegistry.get(uninId) || null;
  }

  /**
   * Checks if an active entity exists by its canonical UNIN ID
   */
  hasEntity(uninId) {
    const ent = this.entityRegistry.get(uninId);
    return Boolean(ent && ent.status === ENTITY_STATUS.ACTIVE);
  }

  /**
   * Updates an existing entity's metadata or status
   */
  updateEntity(uninId, updates = {}, options = {}) {
    const existing = this.entityRegistry.get(uninId);
    if (!existing) {
      throw new Error(`Cannot update entity: "${uninId}" not found in registry`);
    }

    const now = new Date().toISOString();
    const updated = {
      ...existing,
      ...updates,
      uninId,
      worldId: this.worldId,
      version: existing.version + 1,
      updatedAt: now,
      metadata: {
        ...existing.metadata,
        ...(updates.metadata || {})
      }
    };

    this.entityRegistry.set(uninId, updated);
    if (options.bumpVersion !== false) {
      this.version += 1;
    }
    this.updatedAt = now;
    return updated;
  }

  /**
   * Marks an entity as REMOVED (soft delete with preserved history)
   */
  removeEntity(uninId, reason = 'User requested removal', options = {}) {
    const existing = this.entityRegistry.get(uninId);
    if (!existing) {
      throw new Error(`Cannot remove entity: "${uninId}" not found in registry`);
    }

    return this.updateEntity(uninId, {
      status: ENTITY_STATUS.REMOVED,
      removalReason: reason
    }, options);
  }

  /**
   * Retrieves all registered entities, optionally filtered
   */
  getAllEntities(filter = {}) {
    const list = Array.from(this.entityRegistry.values());
    return list.filter(ent => {
      if (filter.status && ent.status !== filter.status) return false;
      if (filter.category && ent.category !== filter.category) return false;
      if (filter.role && ent.role !== filter.role) return false;
      return true;
    });
  }

  /**
   * Locates the primary hero entity
   */
  getHeroEntity() {
    for (const ent of this.entityRegistry.values()) {
      if (ent.role === 'hero' && ent.status === ENTITY_STATUS.ACTIVE) {
        return ent;
      }
    }
    return null;
  }

  /**
   * Finds an active entity matching a concept, keyword, or name
   * @param {string} concept
   */
  findEntityByConcept(concept) {
    if (!concept) return null;
    const clean = String(concept).toLowerCase().trim();
    for (const ent of this.entityRegistry.values()) {
      if (ent.status !== ENTITY_STATUS.ACTIVE) continue;
      const uninId = (ent.uninId || ent.canonicalId || '').toLowerCase();
      const name = (ent.blenderName || '').toLowerCase();
      const category = (ent.category || '').toLowerCase();
      const role = (ent.role || '').toLowerCase();
      if (uninId.includes(clean) || name.includes(clean) || category.includes(clean) || role.includes(clean)) {
        return ent;
      }
    }
    return null;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // MUTATION HISTORY & CHECKPOINT TRACKING
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Records a discrete world mutation into append-only history
   * @param {string} action - 'CREATE_WORLD' | 'ADD_ENTITY' | 'MUTATE_ENTITY' | 'MOVE_ENTITY' | 'REMOVE_ENTITY'
   * @param {Object} details
   */
  recordMutation(action, details = {}) {
    const now = new Date().toISOString();
    const vBefore = this.version;
    const vAfter = vBefore + 1;

    const mutation = {
      operationId: `op_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      versionBefore: vBefore,
      versionAfter: vAfter,
      action: action.toUpperCase(),
      entityIds: Array.isArray(details.entityIds) ? details.entityIds : (details.entityId ? [details.entityId] : []),
      timestamp: now,
      status: details.status || 'SUCCEEDED',
      details: details.details || details
    };

    this.version = vAfter;
    this.updatedAt = now;
    this.mutationHistory.push(mutation);

    logger.info(`[PersistentWorldState] Mutation recorded: [${mutation.action}] v${vBefore} -> v${vAfter} (Op: ${mutation.operationId})`);
    return mutation;
  }

  /**
   * Sets the active disk checkpoint reference
   */
  setActiveCheckpoint(checkpointPath) {
    this.activeCheckpoint = checkpointPath;
    this.updatedAt = new Date().toISOString();
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RECONCILIATION WITH ACTIVE BLENDER INSTANCE
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Queries actual Blender runtime and reconciles canonical entities against live scene objects
   * Uses obj.get("unin_id") custom properties as authoritative identity
   * @param {Function} bridgeRpcCaller - sendBridgeRPC function
   * @returns {Promise<Object>} Reconciliation report
   */
  async reconcileWithBlender(bridgeRpcCaller) {
    if (typeof bridgeRpcCaller !== 'function') {
      throw new Error('bridgeRpcCaller must be an async function');
    }

    const tempDumpFile = path.join(this.storageDir, `.reconcile_${Date.now()}.json`).replace(/\\/g, '/');

    const pyQuery = `
# Canonical UNIN Entity Introspection Query
import bpy
import json

dump_data = []
for obj in bpy.context.scene.objects:
    uid = obj.get("unin_id", None)
    wid = obj.get("unin_world_id", None)
    ver = obj.get("unin_version", None)
    
    loc = [round(v, 4) for v in obj.location]
    dims = [round(v, 4) for v in obj.dimensions] if hasattr(obj, "dimensions") else [0.0, 0.0, 0.0]
    
    dump_data.append({
        "name": obj.name,
        "type": obj.type,
        "unin_id": str(uid) if uid is not None else None,
        "unin_world_id": str(wid) if wid is not None else None,
        "unin_version": int(ver) if ver is not None else None,
        "location": loc,
        "dimensions": dims,
        "visible": not obj.hide_viewport
    })

try:
    with open(r"${tempDumpFile}", "w", encoding="utf-8") as f:
        json.dump(dump_data, f)
except Exception as e:
    pass
`;

    try {
      const rpcRes = await bridgeRpcCaller('execute_bpy', { code: pyQuery, autoCapture: false });
      if (rpcRes && rpcRes.error) {
        throw new Error(`Blender introspection failed: ${rpcRes.error.message || JSON.stringify(rpcRes.error)}`);
      }

      if (!fs.existsSync(tempDumpFile)) {
        return {
          verified: false,
          error: 'Blender introspection dump file was not generated',
          counts: { verifiedCount: 0, missingCount: this.entityRegistry.size, orphanedCount: 0 }
        };
      }

      const raw = fs.readFileSync(tempDumpFile, 'utf8');
      try { fs.unlinkSync(tempDumpFile); } catch (e) {}

      const blenderObjects = JSON.parse(raw);
      const objectsByUninId = new Map();
      const untrackedObjects = [];

      for (const bObj of blenderObjects) {
        if (bObj.unin_id) {
          objectsByUninId.set(bObj.unin_id, bObj);
        } else {
          untrackedObjects.push(bObj);
        }
      }

      const verifiedEntities = [];
      const renamedEntities = [];
      const missingInBlender = [];
      const orphanedInBlender = [];

      // 1. Verify registered active entities against Blender
      for (const [uninId, ent] of this.entityRegistry.entries()) {
        if (ent.status !== ENTITY_STATUS.ACTIVE) continue;

        if (objectsByUninId.has(uninId)) {
          const bObj = objectsByUninId.get(uninId);
          // Auto-sync display name if renamed in Blender Outliner
          if (bObj.name !== ent.blenderName) {
            logger.info(`[PersistentWorldState] Entity "${uninId}" renamed in Blender: "${ent.blenderName}" -> "${bObj.name}"`);
            renamedEntities.push({
              uninId,
              previousBlenderName: ent.blenderName,
              currentBlenderName: bObj.name
            });
            ent.blenderName = bObj.name;
          }
          verifiedEntities.push({
            uninId,
            blenderName: bObj.name,
            blenderVersion: bObj.unin_version,
            expectedVersion: ent.version,
            location: bObj.location
          });
        } else {
          missingInBlender.push({
            uninId,
            expectedBlenderName: ent.blenderName,
            category: ent.category
          });
        }
      }

      // 2. Identify orphaned objects in Blender tagged with UNIN IDs not active in registry
      for (const [uninId, bObj] of objectsByUninId.entries()) {
        const reg = this.entityRegistry.get(uninId);
        if (!reg || reg.status !== ENTITY_STATUS.ACTIVE) {
          orphanedInBlender.push({
            uninId,
            blenderName: bObj.name,
            reason: !reg ? 'NOT_IN_REGISTRY' : 'MARKED_REMOVED_IN_STATE'
          });
        }
      }

      const isClean = missingInBlender.length === 0;

      logger.info(`[PersistentWorldState] Reconciliation complete: verified=${verifiedEntities.length}, renamed=${renamedEntities.length}, missing=${missingInBlender.length}, orphaned=${orphanedInBlender.length}, untracked=${untrackedObjects.length} ✓`);

      return {
        verified: isClean,
        worldId: this.worldId,
        version: this.version,
        counts: {
          totalRegistered: this.entityRegistry.size,
          verifiedCount: verifiedEntities.length,
          renamedCount: renamedEntities.length,
          missingCount: missingInBlender.length,
          orphanedCount: orphanedInBlender.length,
          untrackedCount: untrackedObjects.length
        },
        verifiedEntities,
        renamedEntities,
        missingInBlender,
        orphanedInBlender,
        untrackedObjects
      };
    } catch (err) {
      if (fs.existsSync(tempDumpFile)) {
        try { fs.unlinkSync(tempDumpFile); } catch (e) {}
      }
      logger.error(`[PersistentWorldState] Reconciliation failed: ${err.message}`);
      return {
        verified: false,
        error: err.message,
        counts: { verifiedCount: 0, missingCount: 0, orphanedCount: 0 }
      };
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ATOMIC PERSISTENCE
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Serializes world state atomically to disk (.tmp file then atomic rename)
   */
  async save() {
    this._ensureStorageDirectory();
    this.updatedAt = new Date().toISOString();

    const entitiesObj = {};
    for (const [id, ent] of this.entityRegistry.entries()) {
      entitiesObj[id] = ent;
    }

    const payload = {
      worldId: this.worldId,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      activeCheckpoint: this.activeCheckpoint,
      blendFilePath: this.blendFilePath,
      lastSavedBlendPath: this.lastSavedBlendPath,
      currentTask: this.currentTask,
      environmentState: this.environmentState,
      lightingState: this.lightingState,
      cameraState: this.cameraState,
      visualPlan: this.visualPlan,
      animationState: this.animationState,
      physicsState: this.physicsState,
      vfxState: this.vfxState,
      entities: entitiesObj,
      mutationHistory: this.mutationHistory
    };

    const targetFile = path.join(this.storageDir, `${this.worldId}.json`);
    const tempFile = path.join(this.storageDir, `.${this.worldId}_${Date.now()}.tmp`);

    try {
      const jsonStr = JSON.stringify(payload, null, 2);
      fs.writeFileSync(tempFile, jsonStr, 'utf8');
      fs.renameSync(tempFile, targetFile);

      // Update active world pointer atomically
      const pointerFile = path.join(this.storageDir, 'active_world.json');
      const pointerTmp = path.join(this.storageDir, `.active_world_${Date.now()}.tmp`);
      const pointerPayload = {
        activeWorldId: this.worldId,
        version: this.version,
        updatedAt: this.updatedAt
      };
      fs.writeFileSync(pointerTmp, JSON.stringify(pointerPayload, null, 2), 'utf8');
      fs.renameSync(pointerTmp, pointerFile);

      logger.info(`[PersistentWorldState] Persisted world state: "${this.worldId}" (v${this.version}) to "${targetFile}" ✓`);
      return { success: true, filePath: targetFile, version: this.version };
    } catch (err) {
      if (fs.existsSync(tempFile)) {
        try { fs.unlinkSync(tempFile); } catch (e) {}
      }
      logger.error(`[PersistentWorldState] Failed to persist world state: ${err.message}`);
      throw err;
    }
  }

  toJSON() {
    const entitiesObj = {};
    for (const [id, ent] of this.entityRegistry.entries()) {
      entitiesObj[id] = ent;
    }
    return {
      worldId: this.worldId,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      activeCheckpoint: this.activeCheckpoint,
      blendFilePath: this.blendFilePath,
      lastSavedBlendPath: this.lastSavedBlendPath,
      currentTask: this.currentTask,
      environmentState: this.environmentState,
      lightingState: this.lightingState,
      cameraState: this.cameraState,
      visualPlan: this.visualPlan,
      animationState: this.animationState,
      physicsState: this.physicsState,
      vfxState: this.vfxState,
      entities: entitiesObj,
      mutationHistory: this.mutationHistory
    };
  }
}

module.exports = {
  PersistentWorldState,
  ENTITY_STATUS
};
