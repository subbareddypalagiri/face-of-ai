// src/main/tools/systemTools.js — System & OS Tools for UNIN
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const { exec } = require('child_process');
const logger = require('../../shared/Logger');

function registerSystemTools(registry, workspaceRoot = path.resolve(__dirname, '../../../')) {
  // 1. Terminal Command Runner
  registry.register('run_terminal_command', {
    description: 'Executes terminal/PowerShell commands in the workspace',
    validator: (params) => {
      if (!params || !params.command || typeof params.command !== 'string') {
        return { valid: false, error: 'Parameter "command" is required.' };
      }
      return { valid: true };
    },
    handler: async (params) => {
      const cmd = params.command.trim();
      const targetCwd = params.cwd 
        ? (path.isAbsolute(params.cwd) ? params.cwd : path.resolve(workspaceRoot, params.cwd))
        : workspaceRoot;
      const timeout = params.timeout || 35000;

      return new Promise((resolve) => {
        exec(cmd, {
          cwd: targetCwd,
          timeout: timeout,
          maxBuffer: 1024 * 1024 * 4, // 4MB buffer
          windowsHide: true,
          shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/bash'
        }, (err, stdout, stderr) => {
          const outClean = (stdout || '').trim();
          const errClean = (stderr || '').trim();
          const exitCode = err ? (err.code !== undefined ? err.code : 1) : 0;

          resolve({
            success: exitCode === 0,
            exitCode: exitCode,
            command: cmd,
            cwd: targetCwd,
            stdout: outClean.length > 8000 ? outClean.slice(0, 8000) + '\n...[truncated]' : outClean,
            stderr: errClean.length > 4000 ? errClean.slice(0, 4000) + '\n...[truncated]' : errClean
          });
        });
      });
    }
  });

  // 2. Read File
  registry.register('read_file', {
    description: 'Reads content from a workspace file with line slicing',
    validator: (params) => {
      if (!params || !params.filePath) return { valid: false, error: 'Parameter "filePath" is required.' };
      return { valid: true };
    },
    handler: async (params) => {
      const relOrAbs = params.filePath;
      const fullPath = path.isAbsolute(relOrAbs) ? relOrAbs : path.resolve(workspaceRoot, relOrAbs);

      if (!fs.existsSync(fullPath)) {
        return { success: false, error: `File not found: ${fullPath}` };
      }
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        return { success: false, error: `Path is a directory: ${fullPath}` };
      }

      const maxLines = params.maxLines || 300;
      const startLine = Math.max(1, params.startLine || 1);
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split(/\r?\n/);
      const sliced = lines.slice(startLine - 1, startLine - 1 + maxLines).join('\n');

      return {
        success: true,
        filePath: fullPath,
        fileName: path.basename(fullPath),
        totalLines: lines.length,
        startLine: startLine,
        endLine: Math.min(lines.length, startLine - 1 + maxLines),
        content: sliced
      };
    }
  });

  // 3. Write File
  registry.register('write_file', {
    description: 'Writes or appends content to a workspace file',
    validator: (params) => {
      if (!params || !params.filePath) return { valid: false, error: 'Parameter "filePath" is required.' };
      return { valid: true };
    },
    handler: async (params) => {
      const relOrAbs = params.filePath;
      const fileContent = params.content !== undefined ? params.content : '';
      const append = !!params.append;
      const fullPath = path.isAbsolute(relOrAbs) ? relOrAbs : path.resolve(workspaceRoot, relOrAbs);

      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (append) {
        fs.appendFileSync(fullPath, fileContent, 'utf8');
      } else {
        fs.writeFileSync(fullPath, fileContent, 'utf8');
      }

      return {
        success: true,
        filePath: fullPath,
        fileName: path.basename(fullPath),
        bytesWritten: Buffer.byteLength(fileContent, 'utf8'),
        mode: append ? 'append' : 'overwrite'
      };
    }
  });

  // 4. List Directory
  registry.register('list_directory', {
    description: 'Inspects folder contents and directory entries',
    handler: async (params) => {
      const targetDir = params?.dirPath 
        ? (path.isAbsolute(params.dirPath) ? params.dirPath : path.resolve(workspaceRoot, params.dirPath))
        : workspaceRoot;

      if (!fs.existsSync(targetDir)) {
        return { success: false, error: `Directory not found: ${targetDir}` };
      }

      const items = fs.readdirSync(targetDir, { withFileTypes: true });
      const entries = items.slice(0, 100).map(item => {
        const itemPath = path.join(targetDir, item.name);
        let size = 0;
        try {
          if (item.isFile()) size = fs.statSync(itemPath).size;
        } catch(e){}
        return {
          name: item.name,
          type: item.isDirectory() ? 'dir' : (item.isFile() ? 'file' : 'other'),
          sizeBytes: size
        };
      });

      return {
        success: true,
        dirPath: targetDir,
        totalCount: items.length,
        entries
      };
    }
  });

  // 5. Active Processes & Port Checker
  registry.register('get_active_processes', {
    description: 'Queries active system processes or checks open network ports',
    handler: async (params) => {
      const filter = (params?.filter || '').toLowerCase();

      return new Promise((resolve) => {
        if (process.platform === 'win32') {
          if (/^\d{2,5}$/.test(filter)) {
            exec(`netstat -ano | findstr :${filter}`, (err, stdout) => {
              const lines = (stdout || '').trim().split('\n').filter(Boolean);
              resolve({ success: true, type: 'port_check', port: filter, connections: lines.slice(0, 10) });
            });
            return;
          }

          const psCmd = 'powershell -NoProfile -Command "Get-Process | Where-Object { $_.WorkingSet64 -gt 25MB } | Sort-Object WorkingSet64 -Descending | Select-Object -First 20 ProcessName, Id, @{Name=\'MemoryMB\';Expression={[math]::Round($_.WorkingSet64 / 1MB, 1)}} | ConvertTo-Json"';
          exec(psCmd, { timeout: 8000 }, (err, stdout) => {
            try {
              if (stdout) {
                let list = JSON.parse(stdout.trim());
                if (!Array.isArray(list)) list = [list];
                if (filter) {
                  list = list.filter(p => (p.ProcessName || '').toLowerCase().includes(filter) || String(p.Id).includes(filter));
                }
                resolve({ success: true, count: list.length, processes: list });
              } else {
                resolve({ success: true, count: 0, processes: [] });
              }
            } catch(e) {
              resolve({ success: true, raw: (stdout || '').slice(0, 2000) });
            }
          });
        } else {
          exec('ps aux --sort=-%mem | head -n 20', { timeout: 5000 }, (err, stdout) => {
            resolve({ success: true, raw: (stdout || '').slice(0, 2000) });
          });
        }
      });
    }
  });

  // 6. Kill Process
  registry.register('kill_process', {
    description: 'Terminates stuck system processes by PID or process name',
    validator: (params) => {
      if (!params || (!params.pid && !params.processName)) {
        return { valid: false, error: 'Must specify "pid" or "processName".' };
      }
      return { valid: true };
    },
    handler: async (params) => {
      const pid = params.pid;
      const processName = params.processName;

      return new Promise((resolve) => {
        const cmd = pid ? `taskkill /F /PID ${pid}` : `taskkill /F /IM "${processName}.exe"`;
        exec(cmd, (err, stdout, stderr) => {
          if (err) {
            resolve({ success: false, error: stderr || err.message });
          } else {
            resolve({ success: true, message: stdout.trim() || `Terminated ${pid || processName}` });
          }
        });
      });
    }
  });

  // 7. System Stats
  registry.register('get_system_stats', {
    description: 'Queries live CPU core count, RAM utilization, and uptime',
    handler: async () => {
      const freeMemMB = Math.round(os.freemem() / (1024 * 1024));
      const totalMemMB = Math.round(os.totalmem() / (1024 * 1024));
      const usedPercent = Math.round(((totalMemMB - freeMemMB) / totalMemMB) * 100);

      return {
        success: true,
        cpuCores: os.cpus().length,
        totalMemGB: (totalMemMB / 1024).toFixed(1),
        usedMemPercent: usedPercent,
        uptimeHours: (os.uptime() / 3600).toFixed(1)
      };
    }
  });

  // 8. Workspace Info
  registry.register('get_workspace_info', {
    description: 'Retrieves current git branch, repository status, and workspace path',
    handler: async () => {
      return new Promise((resolve) => {
        exec('git branch --show-current; git status --short', { cwd: workspaceRoot, timeout: 6000 }, (err, stdout) => {
          const out = (stdout || '').trim().split('\n');
          const branch = out[0] || 'unknown';
          const statusLines = out.slice(1).filter(Boolean);
          resolve({
            success: true,
            workspacePath: workspaceRoot,
            platform: process.platform,
            nodeVersion: process.version,
            gitBranch: branch,
            modifiedFilesCount: statusLines.length,
            gitStatusPreview: statusLines.slice(0, 10).join('\n')
          });
        });
      });
    }
  });

  // 9. Web Search
  registry.register('web_search', {
    description: 'Executes real-time web search for information and error documentation',
    validator: (params) => {
      if (!params || !params.query) return { valid: false, error: 'Search query is required.' };
      return { valid: true };
    },
    handler: async (params) => {
      const query = params.query.trim();
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=4&namespace=0&format=json`;

      return new Promise((resolve) => {
        const req = https.get(wikiUrl, { headers: { 'User-Agent': 'UNINAutonomousAgent/2.0' } }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const parsedWiki = JSON.parse(data);
              const titles = parsedWiki[1] || [];
              const descriptions = parsedWiki[2] || [];
              const urls = parsedWiki[3] || [];
              const results = titles.map((t, i) => ({
                title: t,
                snippet: descriptions[i] || '',
                url: urls[i] || ''
              }));
              resolve({ success: true, query, resultsCount: results.length, results });
            } catch(e) {
              resolve({ success: true, query, results: [{ title: query, snippet: 'Direct search query', url: `https://www.google.com/search?q=${encodeURIComponent(query)}` }] });
            }
          });
        });
        req.on('error', (err) => resolve({ success: false, error: err.message, query }));
        req.setTimeout(8000, () => {
          req.destroy();
          resolve({ success: false, error: 'Web search timed out', query });
        });
      });
    }
  });

  // 10. Long-Term Memory & Context Synthesis
  registry.register('get_memory_context', {
    description: 'Synthesizes long-term user profile, saved contacts, and recent episodic memory',
    validator: () => ({ valid: true }),
    handler: async () => {
      const memoryPath = path.resolve(workspaceRoot, 'memory.json');
      let data = {};

      try {
        if (fs.existsSync(memoryPath)) {
          data = JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
        }
      } catch (e) {
        logger.warn('ToolRegistry', `Failed to parse memory.json: ${e.message}`);
      }

      const user = data.user || data.user_profile || {};
      let contacts = [];
      if (Array.isArray(data.contacts)) {
        contacts = data.contacts;
      } else if (data.contacts && typeof data.contacts === 'object') {
        contacts = Object.entries(data.contacts).map(([name, info]) => {
          if (typeof info === 'string') return { name, phone: info };
          return { name, ...info };
        });
      } else if (user.top_contacts && Array.isArray(user.top_contacts)) {
        contacts = user.top_contacts;
      }

      const rawTasks = data.timeline || data.episodic || [];
      const recentTasks = rawTasks.slice(0, 4).map(t => ({
        timestamp: t.timestamp,
        task: t.task,
        category: t.category,
        details: t.details
      }));

      return {
        success: true,
        user: {
          name: user.name || 'Subba Reddy',
          preferred_name: user.preferred_name || user.name || 'Buddy',
          role: user.role || 'Senior AI Engineer / Creator',
          dev_environment: user.dev_environment || 'Windows 11 + PowerShell + Antigravity'
        },
        learnings: data.learnings || [],
        contacts,
        recentTasks,
        gamification: data.gamification || {}
      };
    }
  });
}

module.exports = { registerSystemTools };


