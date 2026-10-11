// src/main/tools/ToolRegistry.js — Production-Grade Extensible Tool Registry for UNIN
'use strict';

const EventEmitter = require('events');
const logger = require('../../shared/Logger');

class ToolRegistry extends EventEmitter {
  constructor() {
    super();
    this.tools = new Map();
  }

  /**
   * Register a new tool with the registry
   * @param {string} name - Unique identifier of the tool
   * @param {Object} definition - Tool specification
   * @param {Function} definition.handler - Async execution function
   * @param {string} [definition.description] - Tool summary
   * @param {Function} [definition.validator] - Optional param validation function
   * @param {number} [definition.timeoutMs] - Optional execution timeout in milliseconds
   */
  register(name, definition) {
    if (!name || typeof name !== 'string') {
      throw new Error(`Invalid tool name: ${name}`);
    }
    if (!definition || typeof definition.handler !== 'function') {
      throw new Error(`Tool "${name}" must provide an async handler function.`);
    }

    this.tools.set(name, {
      name,
      description: definition.description || '',
      validator: definition.validator || null,
      timeoutMs: definition.timeoutMs || 60000,
      handler: definition.handler
    });

    logger.debug(`[ToolRegistry] Registered tool: ${name}`);
  }

  /**
   * Check if a tool is registered
   */
  has(name) {
    return this.tools.has(name);
  }

  /**
   * Get metadata for all registered tools
   */
  getToolList() {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description,
      timeoutMs: t.timeoutMs
    }));
  }

  /**
   * Dispatches and executes a tool call with telemetry, validation, and error isolation
   * @param {string} name - The tool to execute
   * @param {Object} [params={}] - The parameters for the tool
   * @param {Object} [context={}] - Optional contextual state
   * @returns {Promise<Object>} Standardized envelope { success, ..., durationMs }
   */
  async dispatch(name, params = {}, context = {}) {
    const startTime = Date.now();

    if (!this.tools.has(name)) {
      const errorMsg = `Tool "${name}" is not registered in ToolRegistry. Available: [${Array.from(this.tools.keys()).join(', ')}]`;
      logger.warn(`[ToolRegistry] ${errorMsg}`);
      return {
        success: false,
        error: errorMsg,
        durationMs: Date.now() - startTime
      };
    }

    const tool = this.tools.get(name);
    this.emit('tool_started', { name, params, timestamp: startTime });
    logger.info(`[ToolRegistry] Executing: ${name}`, { params: Object.keys(params || {}) });

    // Optional parameter validation
    if (typeof tool.validator === 'function') {
      try {
        const validation = tool.validator(params);
        if (validation && validation.valid === false) {
          const valError = validation.error || `Invalid parameters provided for "${name}"`;
          logger.warn(`[ToolRegistry] Validation failed for ${name}: ${valError}`);
          return {
            success: false,
            error: valError,
            durationMs: Date.now() - startTime
          };
        }
      } catch (valEx) {
        logger.error(`[ToolRegistry] Exception in validator for ${name}: ${valEx.message}`);
        return {
          success: false,
          error: `Validator error: ${valEx.message}`,
          durationMs: Date.now() - startTime
        };
      }
    }

    // Execute with timeout circuit breaker
    try {
      let timeoutId = null;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Tool "${name}" timed out after ${tool.timeoutMs}ms`));
        }, tool.timeoutMs);
      });

      const execPromise = tool.handler(params, context);
      const rawResult = await Promise.race([execPromise, timeoutPromise]);
      clearTimeout(timeoutId);

      const durationMs = Date.now() - startTime;
      let finalResult = {};

      if (Array.isArray(rawResult)) {
        finalResult = {
          success: true,
          tools: rawResult,
          data: rawResult
        };
      } else if (rawResult && typeof rawResult === 'object') {
        finalResult = Object.assign({}, rawResult);
        if (finalResult.success === undefined) {
          finalResult.success = true;
        }
      } else {
        finalResult = {
          success: true,
          data: rawResult
        };
      }

      finalResult.durationMs = durationMs;

      this.emit('tool_completed', { name, success: finalResult.success, durationMs });
      logger.info(`[ToolRegistry] Succeeded: ${name} (${durationMs}ms)`);
      return finalResult;
    } catch (err) {
      const durationMs = Date.now() - startTime;
      logger.error(`[ToolRegistry] Failed: ${name} (${durationMs}ms) - ${err.message}`, err);

      this.emit('tool_failed', { name, error: err.message, durationMs });
      return {
        success: false,
        error: err.message || `Execution failure in ${name}`,
        durationMs
      };
    }
  }
}

module.exports = new ToolRegistry();
module.exports.ToolRegistry = ToolRegistry;
