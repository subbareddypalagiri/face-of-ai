// src/main/tools/index.js — Tool Subsystem Initializer & Aggregator
'use strict';

const path = require('path');
const toolRegistry = require('./ToolRegistry');
const { registerSystemTools } = require('./systemTools');
const { registerAutomationTools } = require('./automationTools');
const { registerAstraTools } = require('./astraTools');
const { registerUniversalTools } = require('./universalTools');
const logger = require('../../shared/Logger');

const ComposioEnterpriseMesh = require('./ComposioEnterpriseMesh');
const McpHubEngine = require('../mcp/McpHubEngine');

const composioMesh = new ComposioEnterpriseMesh();
const mcpHub = new McpHubEngine();

/**
 * Initializes and registers all UNIN desktop tools
 * @param {Object} dependencies - External engine dependencies
 */
function initToolRegistry(dependencies = {}) {
  const workspaceRoot = dependencies.workspaceRoot || path.resolve(__dirname, '../../../');

  logger.info('[ToolRegistry] Bootstrapping domain toolsets...');
  registerSystemTools(toolRegistry, workspaceRoot);
  registerAutomationTools(toolRegistry, dependencies);
  registerAstraTools(toolRegistry, dependencies);
  registerUniversalTools(toolRegistry, dependencies);

  // Initialize Enterprise App & MCP Mesh
  composioMesh.initialize(toolRegistry);
  mcpHub.initialize(toolRegistry);

  logger.info(`[ToolRegistry] Successfully initialized ${toolRegistry.tools.size} desktop tools.`);
  return toolRegistry;
}

module.exports = {
  toolRegistry,
  initToolRegistry,
  composioMesh,
  mcpHub
};
