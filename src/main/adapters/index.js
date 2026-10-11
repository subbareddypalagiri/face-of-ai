// src/main/adapters/index.js — Unified Adapter Hub for UNIN 2026
'use strict';

const Group1LocalAdapter = require('./Group1LocalAdapter.js');
const Group2ClaudeAdapter = require('./Group2ClaudeAdapter.js');
const Group2V0Adapter = require('./Group2V0Adapter.js');

const localAdapter = new Group1LocalAdapter();
const claudeAdapter = new Group2ClaudeAdapter();
const v0Adapter = new Group2V0Adapter();

module.exports = {
  Group1LocalAdapter,
  Group2ClaudeAdapter,
  Group2V0Adapter,
  localAdapter,
  claudeAdapter,
  v0Adapter
};
