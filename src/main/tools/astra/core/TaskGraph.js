// src/main/tools/astra/core/TaskGraph.js — Execution Directed Acyclic Graph (DAG) for 3D Tasks
'use strict';

const TASK_STATUS = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  RETRYING: 'RETRYING',
  BLOCKED: 'BLOCKED',
  CANCELLED: 'CANCELLED',
  VERIFIED: 'VERIFIED'
};

class TaskNode {
  constructor(options = {}) {
    this.id = options.id;
    this.title = options.title || options.id;
    this.description = options.description || '';
    this.dependencies = options.dependencies || [];
    this.status = TASK_STATUS.PENDING;
    this.retryCount = 0;
    this.maxRetries = options.maxRetries !== undefined ? options.maxRetries : 2;
    this.codeGenerator = options.codeGenerator || null; // function or python string
    this.outputs = null;
    this.error = null;
    this.startedAt = null;
    this.completedAt = null;
  }
}

class TaskGraph {
  constructor(sceneGraph) {
    this.sceneGraph = sceneGraph;
    this.tasks = new Map();
  }

  addTask(taskOptions) {
    const node = new TaskNode(taskOptions);
    this.tasks.set(node.id, node);
    return node;
  }

  getTask(id) {
    return this.tasks.get(id);
  }

  getAllTasks() {
    return Array.from(this.tasks.values());
  }

  /**
   * Returns tasks ready for execution (all dependencies succeeded)
   */
  getReadyTasks() {
    const ready = [];
    for (const task of this.tasks.values()) {
      if (task.status === TASK_STATUS.PENDING) {
        const depsMet = task.dependencies.every(depId => {
          const dep = this.tasks.get(depId);
          return dep && (dep.status === TASK_STATUS.SUCCEEDED || dep.status === TASK_STATUS.VERIFIED);
        });
        const anyDepFailed = task.dependencies.some(depId => {
          const dep = this.tasks.get(depId);
          return dep && (dep.status === TASK_STATUS.FAILED || dep.status === TASK_STATUS.BLOCKED);
        });

        if (anyDepFailed) {
          task.status = TASK_STATUS.BLOCKED;
        } else if (depsMet) {
          ready.push(task);
        }
      }
    }
    return ready;
  }

  isCompleted() {
    for (const task of this.tasks.values()) {
      if (task.status === TASK_STATUS.PENDING || task.status === TASK_STATUS.RUNNING) {
        return false;
      }
    }
    return true;
  }

  hasFailures() {
    for (const task of this.tasks.values()) {
      if (task.status === TASK_STATUS.FAILED || task.status === TASK_STATUS.BLOCKED) {
        return true;
      }
    }
    return false;
  }

  markRunning(id) {
    const task = this.getTask(id);
    if (task) {
      task.status = TASK_STATUS.RUNNING;
      task.startedAt = Date.now();
    }
  }

  markSucceeded(id, outputs = null) {
    const task = this.getTask(id);
    if (task) {
      task.status = TASK_STATUS.SUCCEEDED;
      task.outputs = outputs;
      task.completedAt = Date.now();
    }
  }

  markFailed(id, err) {
    const task = this.getTask(id);
    if (task) {
      task.error = err;
      if (task.retryCount < task.maxRetries) {
        task.retryCount++;
        task.status = TASK_STATUS.RETRYING;
      } else {
        task.status = TASK_STATUS.FAILED;
        task.completedAt = Date.now();
      }
    }
  }

  markCancelled(id, reason = 'Cancelled by user') {
    const task = this.getTask(id);
    if (task) {
      task.status = TASK_STATUS.CANCELLED;
      task.error = reason;
      task.completedAt = Date.now();
    }
  }

  cancelPending(reason = 'Cancelled by user') {
    let cancelledCount = 0;
    for (const task of this.tasks.values()) {
      if (task.status === TASK_STATUS.PENDING || task.status === TASK_STATUS.RETRYING) {
        task.status = TASK_STATUS.CANCELLED;
        task.error = reason;
        task.completedAt = Date.now();
        cancelledCount++;
      }
    }
    return cancelledCount;
  }

  getSummary() {
    const counts = {};
    for (const status of Object.values(TASK_STATUS)) counts[status] = 0;
    for (const task of this.tasks.values()) counts[task.status]++;
    return {
      total: this.tasks.size,
      counts,
      isCompleted: this.isCompleted(),
      hasFailures: this.hasFailures()
    };
  }
}

module.exports = { TaskGraph, TaskNode, TASK_STATUS };
