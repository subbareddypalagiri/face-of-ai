// src/main/tools/astra/core/AuditLogger.js — Full Traceability & Observability Engine
'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('../../../../shared/Logger');

class AuditLogger {
  constructor(taskId, prompt, options = {}) {
    this.taskId = taskId || `task_3d_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.prompt = prompt;
    this.startTime = Date.now();
    this.endTime = null;
    this.logDir = options.logDir || path.resolve(__dirname, '../../../../../scratch/telemetry');
    this.ensureDir();

    this.auditTrail = {
      taskId: this.taskId,
      prompt: this.prompt,
      timestamp: new Date().toISOString(),
      stages: {},
      assetDecisions: [],
      executionLog: [],
      inspections: [],
      corrections: [],
      finalStatus: 'INITIALIZED'
    };
  }

  ensureDir() {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (e) {}
  }

  recordIntent(intent) {
    this.auditTrail.stages.intent = intent;
    logger.info(`[AuditLogger][${this.taskId}] Intent recorded: taskType=${intent.taskType}, entities=${(intent.heroEntities || []).length}`);
  }

  recordSceneGraph(sceneGraphData) {
    this.auditTrail.stages.sceneGraph = sceneGraphData;
    logger.info(`[AuditLogger][${this.taskId}] SceneGraph recorded: ${sceneGraphData.summary}`);
  }

  recordAssetDecision(entityName, decision) {
    this.auditTrail.assetDecisions.push({
      entity: entityName,
      strategy: decision.strategy,
      provider: decision.provider,
      assemblyType: decision.assemblyType,
      qualityLevel: decision.qualityLevel,
      reason: decision.reason,
      limitations: decision.limitations,
      path: decision.path,
      format: decision.format,
      attempts: decision.attempts || [],
      validation: decision.validation || null,
      timestamp: Date.now()
    });
    logger.info(`[AuditLogger][${this.taskId}] Asset decision for "${entityName}": ${decision.strategy} via [${decision.provider || 'default'}] (${decision.qualityLevel})`);
  }

  recordTaskExecution(taskNode, result) {
    this.auditTrail.executionLog.push({
      taskId: taskNode.id,
      title: taskNode.title,
      status: taskNode.status,
      success: result ? !result.error : false,
      error: result?.error || null,
      timestamp: Date.now()
    });
  }

  recordInspection(inspectionReport) {
    this.auditTrail.inspections.push({
      verified: inspectionReport.verified,
      flawsCount: (inspectionReport.flaws || []).length,
      flaws: inspectionReport.flaws,
      metrics: inspectionReport.metrics,
      timestamp: Date.now()
    });
    logger.info(`[AuditLogger][${this.taskId}] Scene inspection: verified=${inspectionReport.verified}, flaws=${(inspectionReport.flaws || []).length}`);
  }

  recordCorrections(corrections) {
    this.auditTrail.corrections.push({
      appliedCount: corrections.fixedCount,
      fixes: corrections.appliedFixes,
      timestamp: Date.now()
    });
    logger.info(`[AuditLogger][${this.taskId}] Applied ${corrections.fixedCount} targeted corrections.`);
  }

  finalize(finalStatus = 'SUCCEEDED', renderOutput = null) {
    this.endTime = Date.now();
    this.auditTrail.finalStatus = finalStatus;
    this.auditTrail.durationMs = this.endTime - this.startTime;
    this.auditTrail.renderOutput = renderOutput;

    const logFile = path.join(this.logDir, `${this.taskId}.json`);
    try {
      fs.writeFileSync(logFile, JSON.stringify(this.auditTrail, null, 2), 'utf8');
      logger.info(`[AuditLogger][${this.taskId}] Complete audit telemetry written to "${logFile}" ✓`);
    } catch (e) {
      logger.warn(`[AuditLogger] Failed to write log file: ${e.message}`);
    }

    return this.auditTrail;
  }
}

module.exports = { AuditLogger };
