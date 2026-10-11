// preload.js — Secure Bridge between Electron Host and Autonomous Desktop Engine
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronDesktopAPI', {
  getAppConfig: () => {
    return ipcRenderer.invoke('get-app-config');
  },
  saveAppConfig: (config) => {
    ipcRenderer.send('save-app-config', config);
  },
  getScreenBounds: () => {
    return ipcRenderer.invoke('get-screen-bounds');
  },
  moveWindowStep: (x, y) => {
    ipcRenderer.send('move-window-step', { x, y });
  },
  dragWindow: (deltaX, deltaY) => {
    ipcRenderer.send('drag-window', { deltaX, deltaY });
  },
  showAura: () => {
    ipcRenderer.send('show-aura');
  },
  hideAura: () => {
    ipcRenderer.send('hide-aura');
  },
  closeAura: () => {
    ipcRenderer.send('close-aura');
  },
  executeDesktopTool: (name, params) => {
    return ipcRenderer.invoke('execute-desktop-tool', { name, params });
  },
  executeBrowserAction: (action, params) => {
    return ipcRenderer.invoke('execute-browser-action', { action, params });
  },
  synthesizeEdgeTTS: (text, voice) => {
    return ipcRenderer.invoke('synthesize-edge-tts', { text, voice });
  },
  captureScreenSnapshot: () => {
    return ipcRenderer.invoke('capture-screen-snapshot');
  },
  captureCompanionWindow: () => {
    return ipcRenderer.invoke('capture-companion-window');
  },
  clipboardRead: () => {
    return ipcRenderer.invoke('clipboard-read');
  },
  clipboardWrite: (text) => {
    return ipcRenderer.invoke('clipboard-write', text);
  },
  getMemory: () => {
    return ipcRenderer.invoke('get-memory');
  },
  updateMemory: (updates) => {
    return ipcRenderer.invoke('update-memory', updates);
  },
  saveQuickNote: (noteText) => {
    return ipcRenderer.invoke('save-quick-note', noteText);
  },
  getQuickNotes: () => {
    return ipcRenderer.invoke('get-quick-notes');
  },
  // Multi-App Pairing & Zero-Trust Integration Hub
  getIntegrationsStatus: () => {
    return ipcRenderer.invoke('get-integrations-status');
  },
  verifyIntegration: (appId, credentials) => {
    return ipcRenderer.invoke('verify-integration', { appId, credentials });
  },
  pairIntegration: (appId, credentials) => {
    return ipcRenderer.invoke('pair-integration', { appId, credentials });
  },
  disconnectIntegration: (appId) => {
    return ipcRenderer.invoke('disconnect-integration', { appId });
  },
  searchIntegrationApps: (params) => {
    return ipcRenderer.invoke('search-integration-apps', params || {});
  },
  getMasterCatalog: (params) => {
    return ipcRenderer.invoke('get-master-catalog', params || {});
  },
  getIntegrationSectors: () => {
    return ipcRenderer.invoke('get-integration-sectors');
  },
  recordTaskCompletion: () => {
    return ipcRenderer.invoke('record-task-completion');
  },
  recordActivity: (task, category, details) => {
    return ipcRenderer.invoke('record-activity', { task, category, details });
  },
  getTimeline: (limit) => {
    return ipcRenderer.invoke('get-timeline', limit);
  },
  getXPStats: () => {
    return ipcRenderer.invoke('get-xp-stats');
  },
  addXP: (points, reason) => {
    return ipcRenderer.invoke('add-xp', { points, reason });
  },
  sendWhatsAppMessage: (contact, message, phone, autoSend) => {
    return ipcRenderer.invoke('execute-desktop-tool', { name: 'send_whatsapp_message', params: { contact, message, phone, autoSend } });
  },
  saveContact: (name, phone, notes) => {
    return ipcRenderer.invoke('execute-desktop-tool', { name: 'save_contact', params: { name, phone, notes } });
  },
  getContacts: () => {
    return ipcRenderer.invoke('execute-desktop-tool', { name: 'get_contacts', params: {} });
  },
  automateAntigravity: (prompt, autoSubmit, autoAllow) => {
    return ipcRenderer.invoke('execute-desktop-tool', { name: 'automate_antigravity', params: { prompt, autoSubmit, autoAllow } });
  },
  automateWithSkills: (prompt, autoSubmit, autoAllow) => {
    return ipcRenderer.invoke('execute-desktop-tool', { name: 'automate_with_skills', params: { prompt, autoSubmit, autoAllow } });
  },
  discoverSkills: (intent) => {
    return ipcRenderer.invoke('execute-desktop-tool', { name: 'discover_skills', params: { intent } });
  },
  enhancePrompt: (prompt, domain) => {
    return ipcRenderer.invoke('execute-desktop-tool', { name: 'enhance_prompt', params: { prompt, domain } });
  },
  typeVisually: (text, pressEnter) => {
    return ipcRenderer.invoke('execute-desktop-tool', { name: 'type_visually', params: { text, pressEnter } });
  },
  clickAllowDialog: () => {
    return ipcRenderer.invoke('execute-desktop-tool', { name: 'click_allow', params: {} });
  },
  scheduleTask: (time, actionType, params, description) => {
    return ipcRenderer.invoke('execute-desktop-tool', { name: 'schedule_task', params: { time, actionType, params, description } });
  },
  executeAutonomousGoal: (goal, targetDir) => {
    return ipcRenderer.invoke('execute-desktop-tool', { name: 'execute_autonomous_goal', params: { goal, targetDir } });
  },
  onGoalTelemetry: (callback) => {
    ipcRenderer.on('goal-telemetry', (event, data) => callback(data));
  },
  executeSwarmTask: (task, targetDir) => {
    return ipcRenderer.invoke('execute-desktop-tool', { name: 'execute_swarm_task', params: { task, targetDir } });
  },
  onSwarmTelemetry: (callback) => {
    ipcRenderer.on('swarm-telemetry', (event, data) => callback(data));
  },
  startVisualWatchdog: (intervalMs, options) => {
    return ipcRenderer.invoke('execute-desktop-tool', { name: 'start_visual_watchdog', params: { intervalMs, options } });
  },
  stopVisualWatchdog: () => {
    return ipcRenderer.invoke('execute-desktop-tool', { name: 'stop_visual_watchdog', params: {} });
  },
  inspectScreenSpatial: (elementCategory, screenResolution) => {
    return ipcRenderer.invoke('execute-desktop-tool', { name: 'inspect_screen_spatial', params: { elementCategory, screenResolution } });
  },
  onWatchdogTelemetry: (callback) => {
    ipcRenderer.on('watchdog-telemetry', (event, data) => callback(data));
  },
  onResetPosition: (callback) => {
    ipcRenderer.on('aura-reset-pos', () => callback());
  },
  onToggleVoiceMic: (callback) => {
    ipcRenderer.on('toggle-voice-mic', () => callback());
  },
  onToggleLiveCall: (callback) => {
    ipcRenderer.on('toggle-live-call', () => callback());
  },
  onAllowTriggered: (callback) => {
    ipcRenderer.on('aura-allow-triggered', () => callback());
  },
  onGlobalMouseMove: (callback) => {
    ipcRenderer.on('global-mouse-move', (event, pos) => callback(pos));
  },
  getAutoStartStatus: () => {
    return ipcRenderer.invoke('get-autostart-status');
  },
  setAutoStartStatus: (enable) => {
    return ipcRenderer.invoke('set-autostart-status', enable);
  },
  onTriggerAstraAction: (callback) => {
    ipcRenderer.on('trigger-astra-action', (event, data) => callback(data));
  },
  onWakeWordSpotted: (callback) => {
    ipcRenderer.on('wake-word-spotted', (event, data) => callback(data));
  },
  setWakeWordEnabled: (enabled) => {
    ipcRenderer.send('set-wake-word-enabled', enabled);
  },
  // Blender Technical Director (TD) Max Mode
  blenderTDInquire: (prompt) => {
    return ipcRenderer.invoke('blender-td-inquire', { prompt });
  },
  blenderTDInspectAsset: (filePath) => {
    return ipcRenderer.invoke('blender-td-inspect-asset', { filePath });
  },
  blenderTDPickFile: () => {
    return ipcRenderer.invoke('blender-td-pick-file');
  },
  blenderTDBuildScene: (config) => {
    return ipcRenderer.invoke('blender-td-build-scene', config);
  },
  blenderTDOpenGUI: (blendPath) => {
    return ipcRenderer.invoke('blender-td-open-gui', { blendPath });
  },
  // WhatsApp Autonomous Gateway (Max Mode)
  whatsappGatewayInit: () => {
    return ipcRenderer.invoke('whatsapp-gateway-init');
  },
  whatsappGatewayStatus: () => {
    return ipcRenderer.invoke('whatsapp-gateway-status');
  },
  whatsappGatewaySend: (contact, message) => {
    return ipcRenderer.invoke('whatsapp-gateway-send', { contact, message });
  },
  whatsappGatewayMessages: (contact, limit) => {
    return ipcRenderer.invoke('whatsapp-gateway-messages', { contact, limit });
  },
  whatsappGatewayOpenManual: () => {
    return ipcRenderer.invoke('whatsapp-gateway-open-manual');
  },
  onWhatsAppMessage: (callback) => {
    ipcRenderer.on('whatsapp-incoming-message', (event, data) => callback(data));
  },
  onWhatsAppQR: (callback) => {
    ipcRenderer.on('whatsapp-qr-code', (event, data) => callback(data));
  },
  onWhatsAppStatus: (callback) => {
    ipcRenderer.on('whatsapp-status-update', (event, data) => callback(data));
  }
});

