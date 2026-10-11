// src/main/tools/automationTools.js — Desktop Automation & RPA Tools for UNIN
'use strict';

const path = require('path');
const logger = require('../../shared/Logger');

function registerAutomationTools(registry, dependencies = {}) {
  const {
    desktopAutomator,
    browserAgent,
    skillHunter,
    nativeUiaBridge,
    memoryCore,
    getMainWindow
  } = dependencies;

  // 1. Universal Desktop App Launcher
  registry.register('open_app', {
    description: 'Launches or focuses any installed desktop application on the PC',
    validator: (params) => {
      if (!params || (!params.appName && !params.query)) {
        return { valid: false, error: 'Parameter "appName" is required.' };
      }
      return { valid: true };
    },
    handler: async (params) => {
      const target = params.appName || params.query || '';
      return await desktopAutomator.launchUniversalApp(target);
    }
  });

  // 2. Focus Window
  registry.register('focus_window', {
    description: 'Brings an application window directly to the foreground',
    validator: (params) => {
      if (!params || (!params.appName && !params.target && !params.app)) {
        return { valid: false, error: 'Target app name is required.' };
      }
      return { valid: true };
    },
    handler: async (params) => {
      const target = params.appName || params.target || params.app;
      return await desktopAutomator.activateWindow(target);
    }
  });

  // 3. WhatsApp Message Automation
  registry.register('send_whatsapp_message', {
    description: 'Sends a verified message to a WhatsApp contact',
    validator: (params) => {
      if (!params || (!params.contact && !params.phone && !params.name)) {
        return { valid: false, error: 'Contact name or phone number is required.' };
      }
      return { valid: true };
    },
    handler: async (params) => {
      const contact = params.contact || params.to || params.name || '';
      const message = (params.message || params.text || params.body || 'Hi!').trim();
      const phone = params.phone || params.phoneNumber || '';
      const autoSend = params.autoSend !== undefined ? !!params.autoSend : true;

      const res = await desktopAutomator.sendWhatsAppMessage(contact, message, phone, { autoSend });
      return res;
    }
  });

  // 4. Contact Management
  registry.register('save_contact', {
    description: 'Saves a contact into UNIN memory core',
    handler: async (params) => {
      const cName = params?.name || params?.contact || '';
      const cPhone = params?.phone || params?.phoneNumber || '';
      const cNotes = params?.notes || '';
      return memoryCore.saveContact(cName, cPhone, cNotes);
    }
  });

  registry.register('get_contacts', {
    description: 'Retrieves all saved contacts from memory core',
    handler: async () => {
      return { success: true, contacts: memoryCore.listContacts() };
    }
  });

  // 5. Antigravity IDE Automation & Workspace Switcher
  registry.register('automate_antigravity', {
    description: 'Injects prompts and drives Antigravity IDE with Auto-Allow options',
    handler: async (params) => {
      const promptText = params?.prompt || params?.task || params?.query || '';
      const autoSubmit = params?.autoSubmit !== false;
      const autoAllow = !!params?.autoAllow;
      return await desktopAutomator.automateAntigravity(promptText, autoSubmit, autoAllow, params || {});
    }
  });

  registry.register('manage_antigravity_workspace', {
    description: 'Switches Antigravity projects or creates new workspaces',
    handler: async (params) => {
      const action = params?.action || 'switch_project';
      const projectName = params?.projectName || params?.project || params?.name || '';
      return await desktopAutomator.manageAntigravityWorkspace(action, projectName);
    }
  });

  // 6. Direct UI Dialogs & Mouse/Keyboard
  registry.register('click_allow', {
    description: 'Automatically detects and clicks Allow/Proceed on permission prompts',
    handler: async () => {
      return await desktopAutomator.clickAllowDialog();
    }
  });

  registry.register('type_visually', {
    description: 'Simulates human typing cadence into the active window',
    handler: async (params) => {
      const text = params?.text || '';
      const pressEnter = !!params?.pressEnter;
      return await desktopAutomator.typeVisually(text, { pressEnter, speed: params?.speed });
    }
  });

  registry.register('type_into_window', {
    description: 'Types or pastes text into a specific target application',
    handler: async (params) => {
      const appName = params?.appName || params?.targetApp || 'active';
      const text = params?.text || '';
      const pressEnter = !!params?.pressEnter;
      return await desktopAutomator.typeIntoWindow(appName, text, pressEnter);
    }
  });

  registry.register('mouse_click', {
    description: 'Executes direct mouse click at specified screen coordinates',
    handler: async (params) => {
      return await desktopAutomator.mouseClickAt(params?.x || 0, params?.y || 0);
    }
  });

  registry.register('send_keys', {
    description: 'Dispatches raw keystrokes to active window',
    handler: async (params) => {
      return await desktopAutomator.sendKeys(params?.keys || '');
    }
  });

  // 6b. Universal Workspace Input Injection & Grounding
  registry.register('inject_and_submit_workspace', {
    description: 'Grounds target AI workspace input box, pastes prompt, and submits via Enter',
    handler: async (params) => {
      const workspaceKey = params?.workspace || params?.target || params?.workspaceKey || 'claude';
      const promptText = params?.prompt || params?.compiledPrompt || params?.text || '';
      const autoSubmit = params?.autoSubmit !== false;
      const waitMs = params?.waitMs || 2500;

      const mainWindow = typeof getMainWindow === 'function' ? getMainWindow() : null;
      if (mainWindow && !mainWindow.isDestroyed()) {
        try {
          mainWindow.blur();
        } catch (e) {}
      }

      return await desktopAutomator.injectAndSubmitWorkspace(workspaceKey, promptText, { autoSubmit, waitMs });
    }
  });

  // 6c. SOTA 2026 Dynamic Tool & Sector Discovery
  registry.register('discover_optimal_tools', {
    description: 'Discovers the top 3-4 world-class tools and local apps for any user intent',
    handler: async (params) => {
      const prompt = params?.prompt || params?.task || params?.intent || '';
      const metaAiRouter = require('../../../meta-ai-router');
      return await metaAiRouter.synthesizeDynamicToolOptions(prompt);
    }
  });

  // 6d. SOTA 2026 Universal Generation Completion Watchdog
  registry.register('wait_for_workspace_completion', {
    description: 'Monitors the active workspace (Claude, v0, Bolt, ChatGPT, Antigravity) until generation has completed',
    handler: async (params) => {
      const workspaceKey = params?.workspace || params?.target || 'workspace';
      return await desktopAutomator.waitForWorkspaceCompletion(workspaceKey, params || {});
    }
  });

  // 7. Background Task Scheduler
  registry.register('schedule_task', {
    description: 'Schedules timed automated actions (WhatsApp, Antigravity, Terminal)',
    validator: (params) => {
      if (!params || (params.time === undefined && params.delay === undefined && params.delaySeconds === undefined)) {
        return { valid: false, error: 'Parameter "time" or "delay" is required for schedule_task.' };
      }
      return { valid: true };
    },
    handler: async (params) => {
      const timeParam = params?.time || params?.delay || params?.delaySeconds || 60;
      const actionType = params?.actionType || params?.action || 'send_whatsapp_message';
      const actionParams = (params?.params && typeof params.params === 'object') ? { ...params, ...params.params } : params;
      const description = params?.description || '';
      return desktopAutomator.scheduleTask(timeParam, actionType, actionParams, description);
    }
  });

  registry.register('get_scheduled_tasks', {
    description: 'Lists all pending scheduled tasks',
    handler: async () => {
      return desktopAutomator.getScheduledTasks();
    }
  });

  registry.register('cancel_scheduled_task', {
    description: 'Cancels a pending scheduled task by ID',
    handler: async (params) => {
      return desktopAutomator.cancelScheduledTask(params?.taskId || params?.id);
    }
  });

  // 8. Skill Hunter & Prompt Enhancer
  registry.register('automate_with_skills', {
    description: 'Hunts best MCP skills on the web, compiles SOTA prompt, and drives Antigravity',
    handler: async (params) => {
      const rawPrompt = params?.prompt || params?.task || params?.query || '';
      const autoSubmit = params?.autoSubmit !== false;
      const autoAllow = params?.autoAllow !== false;
      return await desktopAutomator.automateAntigravityWithSkills(rawPrompt, autoSubmit, autoAllow, params || {});
    }
  });

  registry.register('discover_skills', {
    description: 'Discovers top MCPs and skills for any developer intent',
    handler: async (params) => {
      const query = params?.intent || params?.query || '';
      return await skillHunter.discoverBestSkillsAndMCPs(query);
    }
  });

  registry.register('enhance_prompt', {
    description: 'Compiles raw prompt into SOTA engineering specification',
    handler: async (params) => {
      const query = params?.prompt || params?.query || '';
      const domain = params?.domain || 'software';
      return await skillHunter.autonomousSkillPipeline(query, domain);
    }
  });

  // 9. Native Windows UI Automation (UIA)
  registry.register('uia_set_value', {
    description: 'Injects text directly into Windows UI controls without SendKeys',
    handler: async (params) => {
      const win = params?.windowTitle || params?.window || '.*';
      const ctrl = params?.controlName || params?.control || '';
      const text = params?.text || params?.value || '';
      const type = params?.controlType || 'Edit';
      return await nativeUiaBridge.setElementValue(win, ctrl, text, type);
    }
  });

  registry.register('uia_invoke', {
    description: 'Invokes buttons or controls in native Windows UI without coordinates',
    handler: async (params) => {
      const win = params?.windowTitle || params?.window || '.*';
      const btn = params?.buttonName || params?.controlName || 'Allow|Proceed';
      const type = params?.controlType || 'Button';
      return await nativeUiaBridge.invokeElement(win, btn, type);
    }
  });

  // 10. Web & Browser Automation
  registry.register('open_youtube', {
    description: 'Plays music or videos directly in YouTube tab',
    handler: async (params) => {
      const q = (params?.query || '').replace(/youtube/gi, '').trim();
      if (q) {
        return await browserAgent.executeAction('search_youtube', { query: q });
      } else {
        return await browserAgent.executeAction('navigate', { url: 'https://www.youtube.com' });
      }
    }
  });

  registry.register('search_google', {
    description: 'Searches Google via headless/live browser session',
    handler: async (params) => {
      return await browserAgent.executeAction('search_google', { query: params?.query || '' });
    }
  });

  registry.register('open_url', {
    description: 'Navigates browser to target web address',
    handler: async (params) => {
      let url = params?.url || params?.query || '';
      if (!url.startsWith('http')) url = 'https://' + url;
      return await browserAgent.executeAction('navigate', { url });
    }
  });

  // 11. Windows Auto-Start Configuration
  registry.register('configure_autostart', {
    description: 'Configures UNIN to automatically start on Windows boot (minimized to tray)',
    validator: (params) => {
      if (typeof params?.enable !== 'boolean') {
        return { valid: false, error: 'Parameter "enable" (boolean) is required.' };
      }
      return { valid: true };
    },
    handler: async (params) => {
      try {
        const electron = require('electron');
        const electronApp = electron.app;
        if (electronApp && typeof electronApp.setLoginItemSettings === 'function') {
          electronApp.setLoginItemSettings({
            openAtLogin: params.enable,
            openAsHidden: true,
            path: process.execPath,
            args: ['--hidden']
          });
          const status = electronApp.getLoginItemSettings();
          return {
            success: true,
            openAtLogin: status.openAtLogin,
            message: params.enable 
              ? 'UNIN Windows auto-start successfully enabled (starts minimized in tray).'
              : 'UNIN Windows auto-start disabled.'
          };
        }
        return { success: true, openAtLogin: params.enable, message: 'Auto-start configured (emulated in current environment).' };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  });

  registry.register('get_autostart_status', {
    description: 'Queries whether UNIN is configured to start on Windows boot',
    validator: () => ({ valid: true }),
    handler: async () => {
      try {
        const electron = require('electron');
        const electronApp = electron.app;
        if (electronApp && typeof electronApp.getLoginItemSettings === 'function') {
          const status = electronApp.getLoginItemSettings();
          return { success: true, openAtLogin: status.openAtLogin };
        }
        return { success: true, openAtLogin: false };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  });

  // ── SOTA 2026 Native Group 1 & Group 2 Adapters ──
  const { claudeAdapter, v0Adapter, localAdapter } = require('../adapters');

  // Tool 52: Generate Claude Skill ZIP
  registry.register('generate_claude_skill_zip', {
    description: 'Generates official Anthropic-compliant unin-skills.zip package with SKILL.md and uncompressed references',
    validator: () => ({ valid: true }),
    handler: async (params = {}) => {
      try {
        const res = await claudeAdapter.generateSkillZip();
        if (params.reveal !== false) {
          claudeAdapter.revealZipInExplorer();
        }
        return res;
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  });

  // Tool 53: Start Claude Remote MCP Bridge
  registry.register('start_claude_mcp_bridge', {
    description: 'Starts the Local Streamable HTTP/SSE MCP Server on port 3845 for Claude.ai Custom Connectors',
    validator: () => ({ valid: true }),
    handler: async (params = {}) => {
      try {
        if (params.taskTitle) {
          claudeAdapter.setActiveTask(params.taskTitle, params.taskDesc || '', params.category || 'UI_FRONTEND');
        }
        const srv = await claudeAdapter.startMcpServer();
        return {
          success: true,
          port: srv.port,
          status: srv.status,
          sseEndpoint: `http://localhost:${srv.port}/mcp/sse`,
          message: 'Local MCP Server active. Connect via Cloudflare Tunnel or local proxy.'
        };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  });

  // Tool 54: Launch Claude Desktop with Native MCP (Group 1)
  registry.register('launch_claude_desktop_native', {
    description: 'Launches Claude Desktop Windows application with native Stdio MCP configuration',
    validator: () => ({ valid: true }),
    handler: async () => {
      try {
        localAdapter.ensureClaudeDesktopMcpConfig();
        return await localAdapter.launchClaudeDesktop();
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  });

  // Tool 55: Configure v0 Project Rules & Design Tokens (Group 2 v0)
  registry.register('configure_v0_rules', {
    description: 'Generates v0.dev Project Rules (.v0/rules.md) with FAANG Shadcn/Tailwind design tokens',
    validator: () => ({ valid: true }),
    handler: async (params = {}) => {
      try {
        return v0Adapter.generateProjectRules(params.intent || '');
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  });

  // Tool 56: Autonomous CDP Upload of Skill into Claude.ai
  registry.register('auto_upload_claude_skill', {
    description: 'Autonomous CDP/Playwright upload of unin-skills.zip directly into Claude.ai with assisted fallback',
    validator: () => ({ valid: true }),
    handler: async () => {
      try {
        return await claudeAdapter.autoUploadSkillToClaude();
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  });

  // Tool 57: Start Cloudflare Quick Tunnel for Claude.ai Remote MCP
  registry.register('start_cloudflare_tunnel', {
    description: 'Launches 100% Free Cloudflare Quick Tunnel generating public HTTPS URL for Claude.ai Custom Connectors',
    validator: () => ({ valid: true }),
    handler: async () => {
      try {
        // Ensure local server is up first
        await claudeAdapter.startMcpServer();
        const res = await claudeAdapter.startCloudflareTunnel();
        if (res.success && res.sseUrl) {
          const { clipboard } = require('electron');
          if (clipboard && clipboard.writeText) {
            clipboard.writeText(res.sseUrl);
          }
        }
        return res;
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  });

  // Tool 58: Pull v0.dev Component via Vercel CLI
  registry.register('pull_v0_component', {
    description: 'Pulls a generated component from v0.dev into the local workspace using Vercel CLI',
    validator: (params) => {
      if (!params || !params.componentId) {
        return { valid: false, error: 'Parameter "componentId" is required.' };
      }
      return { valid: true };
    },
    handler: async (params) => {
      try {
        return await v0Adapter.pullV0Component(params.componentId);
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  });

  // Tool 59: Get Claude Connector & Skills Suite Info
  registry.register('get_connector_info', {
    description: 'Retrieves current Cloudflare MCP Tunnel URL, skill count, and zip bundle status',
    validator: () => ({ valid: true }),
    handler: async () => {
      try {
        const fs = require('fs');
        const infoFile = path.join(process.cwd(), 'output', 'mcp-connector-info.json');
        let fileInfo = {};
        if (fs.existsSync(infoFile)) {
          try {
            fileInfo = JSON.parse(fs.readFileSync(infoFile, 'utf8'));
          } catch(e) {}
        }
        
        let venarCount = 50;
        try {
          const venarPath = path.join(process.env.USERPROFILE || process.env.HOME || '', '.venar', 'registry.json');
          if (fs.existsSync(venarPath)) {
            const raw = JSON.parse(fs.readFileSync(venarPath, 'utf8'));
            venarCount = (raw.skills || []).length || 50;
          }
        } catch(e) {}

        const sseUrl = claudeAdapter.publicTunnelUrl 
          ? `${claudeAdapter.publicTunnelUrl}/mcp/sse`
          : (fileInfo.sseUrl || 'https://raleigh-paste-shower-boutique.trycloudflare.com/mcp/sse');

        const zipPath = path.join(process.cwd(), 'output', 'unin-skills.zip');
        const zipExists = fs.existsSync(zipPath);

        return {
          success: true,
          sseUrl,
          tunnelUrl: claudeAdapter.publicTunnelUrl || fileInfo.tunnelUrl || 'https://raleigh-paste-shower-boutique.trycloudflare.com',
          port: claudeAdapter.port || 3845,
          skillCount: venarCount,
          zipExists,
          zipPath
        };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  });
}

module.exports = { registerAutomationTools };

