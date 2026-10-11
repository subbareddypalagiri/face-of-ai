// Group1LocalAdapter.js — SOTA 2026 Local Desktop & CLI Adapter for UNIN
// Manages:
// 1. Native Claude Desktop integration (claude_desktop_config.json)
// 2. Direct launch of Claude Desktop Windows application (Claude.exe)
// 3. Local Antigravity / Agentic IDE native SKILL.md folder sync
'use strict';

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class Group1LocalAdapter {
  constructor(options = {}) {
    this.appData = process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME, 'Library/Application Support') : '');
    this.claudeConfigPath = path.join(this.appData, 'Claude', 'claude_desktop_config.json');
  }

  /**
   * Verifies and configures Claude Desktop's native MCP config file
   */
  ensureClaudeDesktopMcpConfig() {
    try {
      const claudeDir = path.dirname(this.claudeConfigPath);
      if (!fs.existsSync(claudeDir)) {
        fs.mkdirSync(claudeDir, { recursive: true });
      }

      let config = { mcpServers: {} };
      if (fs.existsSync(this.claudeConfigPath)) {
        try {
          config = JSON.parse(fs.readFileSync(this.claudeConfigPath, 'utf8'));
        } catch (e) {
          config = { mcpServers: {} };
        }
      }

      if (!config.mcpServers) config.mcpServers = {};

      // Register UNIN Local Stdio MCP Server
      const uninMcpScript = path.join(process.cwd(), 'src', 'main', 'tools', 'uninMcpServer.js');
      const hasUsco = !!config.mcpServers['usco-orchestrator'];

      if (!hasUsco && !config.mcpServers['unin-orchestrator']) {
        config.mcpServers['unin-orchestrator'] = {
          command: 'node',
          args: [uninMcpScript]
        };
        fs.writeFileSync(this.claudeConfigPath, JSON.stringify(config, null, 2), 'utf8');
        console.log(`[LocalAdapter] Registered unin-orchestrator in: ${this.claudeConfigPath}`);
      }

      return {
        success: true,
        configPath: this.claudeConfigPath,
        servers: Object.keys(config.mcpServers)
      };
    } catch (err) {
      console.error('[LocalAdapter] Failed to verify Claude Desktop config:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Launches Claude Desktop on Windows directly
   */
  launchClaudeDesktop() {
    return new Promise((resolve) => {
      // Possible Claude Desktop paths on Windows
      const possiblePaths = [
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Claude', 'Claude.exe'),
        path.join(process.env.PROGRAMFILES || '', 'Claude', 'Claude.exe'),
        'claude'
      ];

      let launched = false;
      for (const p of possiblePaths) {
        if (p === 'claude' || fs.existsSync(p)) {
          exec(`start "" "${p}"`, (err) => {
            if (!err) console.log(`[LocalAdapter] Launched Claude Desktop via: ${p}`);
          });
          launched = true;
          break;
        }
      }

      if (!launched) {
        // Fallback: try executing 'claude' directly via shell
        exec('start claude:', (err) => {
          if (err) exec('start "" "https://claude.ai/download"');
        });
      }

      resolve({
        success: true,
        message: 'Claude Desktop launch initiated with native MCP bindings.'
      });
    });
  }

  /**
   * Synchronizes native skills to local Antigravity/Cursor IDE directory
   */
  syncLocalSkill(skillId, targetDir) {
    const dest = targetDir || path.join(process.cwd(), 'skills', 'synthesized', skillId);
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

    const skillContent = `# ${skillId} (Local Native Skill)\n- Loaded into Antigravity Kernel\n- Zero latency local execution\n`;
    fs.writeFileSync(path.join(dest, 'SKILL.md'), skillContent, 'utf8');
    return { success: true, path: dest };
  }
}

module.exports = Group1LocalAdapter;
