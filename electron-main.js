const { app, BrowserWindow, ipcMain, screen, Tray, Menu, globalShortcut, desktopCapturer, clipboard, session, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Long-Term Memory Core
const memoryCore = require('./memory-core');

// Suppress benign internal Chromium pipe warnings & Electron dev security warnings
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
app.commandLine.appendSwitch('log-level', '3');
app.commandLine.appendSwitch('disable-logging');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('use-fake-ui-for-media-stream');

// Browser Automation Agent (Playwright)
const browserAgent = require('./browser-agent');

// Autonomous Windows RPA & Desktop Automation Engine
const desktopAutomator = require('./desktop-automator');

// Autonomous Skill Hunter & Prompt Enhancer
const skillHunter = require('./skill-hunter');

// SOTA Native Windows UI Automation Engine (UIA)
const nativeUiaBridge = require('./native-uia-bridge');

// UNIN Autonomous WhatsApp Gateway (Max Mode Multi-Device Engine)
const { whatsappGateway } = require('./unin-whatsapp-gateway');

// SOTA Blender 3D Procedural Engine
const blenderLiveBridge = require('./blender-live-bridge');
const { blenderTD } = require('./unin-blender-td');

// SOTA Anti-Bot CDP Stealth Engine
const cdpStealth = require('./cdp-stealth-engine');

// SOTA Autonomous Goal & Self-Healing Execution Engine for UNIN
const goalEngine = require('./unin-goal-engine');

// SOTA Multi-Agent Swarm Orchestrator for UNIN
const swarmOrchestrator = require('./unin-swarm-orchestrator');

// SOTA Continuous Visual Watchdog & Spatial Grounding for UNIN
const visualWatchdog = require('./unin-visual-watchdog');

// SOTA 100% Offline Native Windows Wake-Word Engine (SAPI / System.Speech)
const nativeWakeWord = require('./native-wake-word');

// Production-Grade Tool Registry Subsystem
const { initToolRegistry } = require('./src/main/tools');
const integrationManager = require('./src/main/integrations/IntegrationManager');
const toolRegistry = initToolRegistry({
  workspaceRoot: __dirname,
  desktopAutomator,
  browserAgent,
  skillHunter,
  nativeUiaBridge,
  memoryCore,
  goalEngine,
  swarmOrchestrator,
  visualWatchdog,
  blenderLiveBridge,
  getMainWindow: () => mainWindow
});

// Ensure Single Instance Lock so hotkeys and processes never conflict
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('[AURA] Another instance is already running. Bringing it to focus and quitting duplicate.');
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (!mainWindow.isVisible()) mainWindow.show();
    mainWindow.setAlwaysOnTop(true, 'status');
    mainWindow.focus();
  }
});

let mainWindow = null;
let tray = null;
let isVisible = true;
let roamInterval = null;

function createDesktopWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const winWidth = 545;
  const winHeight = 780;

  // Initial position: Bottom right above the taskbar
  const initX = screenWidth - winWidth - 30;
  const initY = screenHeight - winHeight - 10;

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: initX,
    y: initY,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    skipTaskbar: false,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      backgroundThrottling: false
    }
  });

  // Show window only after renderer is fully loaded (avoids white flash & invisible window)
  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow.show();
    mainWindow.setAlwaysOnTop(true, 'status');
    mainWindow.focus();
    console.log('[UNIN] Window shown after full load ✓');
  });

  // Open all external web links in user's default browser (Chrome/Edge)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const { shell } = require('electron');
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.setAlwaysOnTop(true, 'status');
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const logLine = `[Renderer Console ${level}]: ${message} (at ${path.basename(sourceId || '')}:${line})\n`;
    console.log(logLine.trim());
    try { fs.appendFileSync(path.join(__dirname, 'renderer-debug.log'), logLine); } catch(e){}
  });

  // Read config.json on start
  let config = {};
  try {
    const cfgPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(cfgPath)) {
      config = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    }
  } catch (e) {}

  ipcMain.handle('get-app-config', () => config);

  ipcMain.on('save-app-config', (event, newConfig) => {
    try {
      config = { ...config, ...newConfig };
      const cfgPath = path.join(__dirname, 'config.json');
      fs.writeFileSync(cfgPath, JSON.stringify(config, null, 2), 'utf8');
    } catch (e) {}
  });

  ipcMain.handle('get-screen-bounds', () => {
    return primaryDisplay.workAreaSize;
  });

  // Smooth Native Desktop Window Locomotion (Walk across screen)
  ipcMain.on('move-window-step', (event, { x, y }) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setPosition(Math.round(x), Math.round(y));
    }
  });

  // Window drag helper
  ipcMain.on('drag-window', (event, { deltaX, deltaY }) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const [currentX, currentY] = mainWindow.getPosition();
      mainWindow.setPosition(currentX + deltaX, currentY + deltaY);
    }
  });

  // Desktop System Action & Tool Execution (YouTube, Apps, Search, Web)
  const { shell } = require('electron');
  const { exec } = require('child_process');

  // Desktop System Action & Tool Execution via Production ToolRegistry
  ipcMain.handle('execute-desktop-tool', async (event, { name, params }) => {
    return await toolRegistry.dispatch(name, params || {});
  });

  // ── UNIN Multi-App Pairing & Zero-Trust Integration Hub ──
  ipcMain.handle('get-integrations-status', async () => {
    return integrationManager.getStatuses();
  });

  ipcMain.handle('verify-integration', async (event, { appId, credentials }) => {
    return await integrationManager.verifyConnection(appId, credentials);
  });

  ipcMain.handle('pair-integration', async (event, { appId, credentials }) => {
    return await integrationManager.pairApp(appId, credentials);
  });

  ipcMain.handle('disconnect-integration', async (event, { appId }) => {
    return integrationManager.disconnectApp(appId);
  });

  ipcMain.handle('search-integration-apps', async (event, { query, category, limit }) => {
    return integrationManager.searchApps(query, category, limit);
  });

  ipcMain.handle('get-master-catalog', async (event, { offset, limit, category }) => {
    return integrationManager.getMasterCatalog({ offset, limit, category });
  });

  ipcMain.handle('get-integration-sectors', async () => {
    return integrationManager.getSectors();
  });

  // ── Browser In-Tab Actions (Playwright Automation) ──────────
  ipcMain.handle('execute-browser-action', async (event, { action, params }) => {
    try {
      const result = await browserAgent.executeAction(action, params || {});
      return result;
    } catch (err) {
      console.error('Browser action error:', err);
      return { success: false, error: err.message };
    }
  });

  // ── UNIN Autonomous WhatsApp Gateway IPC (Max Mode) ──
  ipcMain.handle('whatsapp-gateway-init', async () => {
    return await whatsappGateway.init();
  });

  ipcMain.handle('whatsapp-gateway-status', async () => {
    // If disconnected and not initialized, auto-trigger init in background to restore session
    if (!whatsappGateway.initialized && whatsappGateway.status === 'DISCONNECTED') {
      whatsappGateway.init().catch(err => console.warn('[WhatsApp Gateway auto-init]:', err.message));
    }
    return whatsappGateway.getStatus();
  });

  ipcMain.handle('whatsapp-gateway-open-manual', async () => {
    try {
      const { exec } = require('child_process');
      exec('node login-whatsapp.js', { cwd: __dirname });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('whatsapp-gateway-send', async (event, { contact, message }) => {
    return await whatsappGateway.sendMessage(contact, message);
  });

  ipcMain.handle('whatsapp-gateway-messages', async (event, { contact, limit }) => {
    return await whatsappGateway.getLatestMessages(contact, limit);
  });

  // Forward incoming messages to frontend window
  whatsappGateway.on('message', (msgData) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('whatsapp-incoming-message', msgData);
    }
  });

  whatsappGateway.on('qr', (qrData) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('whatsapp-qr-code', qrData);
    }
  });

  whatsappGateway.on('status', (statusData) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('whatsapp-status-update', statusData);
    }
  });

  // ── UNIN Blender Technical Director (TD) Max Mode IPC ──
  ipcMain.handle('blender-td-inquire', (event, { prompt }) => {
    return blenderTD.generateDirectorInquiry(prompt);
  });

  ipcMain.handle('blender-td-inspect-asset', async (event, { filePath }) => {
    return await blenderTD.inspectLocalAsset(filePath);
  });

  ipcMain.handle('blender-td-pick-file', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Select 3D Asset (GLB, GLTF, FBX, OBJ)',
        properties: ['openFile'],
        filters: [
          { name: '3D Models (*.glb, *.gltf, *.fbx, *.obj)', extensions: ['glb', 'gltf', 'fbx', 'obj'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
        return { success: false, canceled: true };
      }
      return { success: true, filePath: result.filePaths[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('blender-td-build-scene', async (event, config) => {
    return await blenderTD.buildCinematicScene(config);
  });

  ipcMain.handle('blender-td-open-gui', (event, { blendPath } = {}) => {
    return blenderTD.openBlenderGUI(blendPath);
  });

  // ── Microsoft Edge Neural Studio TTS (100% Free Indian & Global Voices) ──
  const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
  let edgeTTSInstance = null;
  let currentLoadedVoice = null;

  ipcMain.handle('synthesize-edge-tts', async (event, { text, voice }) => {
    try {
      const cleanText = (text || '').replace(/[\u{1F600}-\u{1F6FF}|[\u{2600}-\u{26FF}]/gu, '').trim();
      if (!cleanText) return { success: false, error: 'Empty text' };

      const selectedVoice = voice || 'te-IN-MohanNeural';
      if (!edgeTTSInstance || currentLoadedVoice !== selectedVoice) {
        edgeTTSInstance = new MsEdgeTTS();
        await edgeTTSInstance.setMetadata(selectedVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
        currentLoadedVoice = selectedVoice;
      }

      const { audioStream } = edgeTTSInstance.toStream(cleanText);
      const chunks = [];

      return await new Promise((resolve) => {
        audioStream.on('data', chunk => chunks.push(chunk));
        audioStream.on('end', () => {
          const totalBuffer = Buffer.concat(chunks);
          const base64 = totalBuffer.toString('base64');
          resolve({ success: true, audioData: `data:audio/mp3;base64,${base64}` });
        });
        audioStream.on('error', err => {
          console.error('[EdgeTTS] Audio stream error:', err);
          resolve({ success: false, error: err.message });
        });
      });
    } catch (err) {
      console.error('[EdgeTTS] Synthesis failed:', err);
      return { success: false, error: err.message };
    }
  });

  // ── Desktop Screen Vision Capture ──────────────────────────
  ipcMain.handle('capture-screen-snapshot', async () => {
    try {
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.size;
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: Math.min(width, 1920), height: Math.min(height, 1080) }
      });
      if (sources.length > 0) {
        const thumbnail = sources[0].thumbnail;
        const base64 = thumbnail.toJPEG(75).toString('base64');
        return { success: true, base64: base64, dataUrl: `data:image/jpeg;base64,${base64}`, mimeType: 'image/jpeg' };
      }
      return { success: false, error: 'No display screen detected' };
    } catch (err) {
      console.error('[Vision] Screen capture error:', err);
      return { success: false, error: err.message };
    }
  });

  // ── High-Fidelity Direct Companion Window Capture ───────────
  ipcMain.handle('capture-companion-window', async () => {
    try {
      if (!mainWindow) return { success: false, error: 'No companion window' };
      const image = await mainWindow.webContents.capturePage();
      const saveDir = path.join(__dirname, 'scratch');
      if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir, { recursive: true });
      const savePath = path.join(saveDir, 'companion-snapshot.png');
      fs.writeFileSync(savePath, image.toPNG());
      return { success: true, path: savePath };
    } catch (err) {
      console.error('[Capture] Companion window capture error:', err);
      return { success: false, error: err.message };
    }
  });

  // ── Desktop Clipboard Tools ────────────────────────────────
  ipcMain.handle('clipboard-read', () => {
    try {
      return { success: true, text: clipboard.readText() };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('clipboard-write', (event, text) => {
    try {
      clipboard.writeText(text || '');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ── Long-Term Memory & Notes IPC ───────────────────────────
  ipcMain.handle('get-memory', () => {
    return memoryCore.getMemory();
  });

  ipcMain.handle('update-memory', (event, updates) => {
    return memoryCore.updateMemory(updates);
  });

  ipcMain.handle('save-quick-note', (event, noteText) => {
    return memoryCore.saveNote(noteText);
  });

  ipcMain.handle('get-quick-notes', () => {
    return memoryCore.getNotes();
  });

  ipcMain.handle('record-task-completion', () => {
    return memoryCore.recordTaskCompletion();
  });

  ipcMain.handle('record-activity', (event, { task, category, details }) => {
    return memoryCore.recordActivity(task, category, details);
  });

  ipcMain.handle('get-timeline', (event, limit) => {
    return memoryCore.getTimeline(limit);
  });

  ipcMain.handle('get-xp-stats', () => {
    return memoryCore.getXPStats();
  });

  ipcMain.handle('add-xp', (event, { points, reason }) => {
    return memoryCore.addXP(points, reason);
  });

  // ── Windows Auto-Start on Boot ──────────────────────────────
  ipcMain.handle('get-autostart-status', () => {
    try {
      return { success: true, openAtLogin: app.getLoginItemSettings().openAtLogin };
    } catch (err) {
      return { success: false, error: err.message, openAtLogin: false };
    }
  });

  ipcMain.handle('set-autostart-status', (event, enable) => {
    try {
      app.setLoginItemSettings({
        openAtLogin: !!enable,
        openAsHidden: true,
        path: process.execPath,
        args: ['--hidden']
      });
      const current = app.getLoginItemSettings();
      logger.info('AutoStart', `Windows auto-start set to: ${current.openAtLogin}`);
      return { success: true, openAtLogin: current.openAtLogin };
    } catch (err) {
      logger.error('AutoStart', `Failed to set autostart: ${err.message}`);
      return { success: false, error: err.message };
    }
  });

  ipcMain.on('show-aura', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (!mainWindow.isVisible()) {
        mainWindow.show();
      }
      mainWindow.setAlwaysOnTop(true, 'status');
      mainWindow.focus();
    }
  });

  ipcMain.on('hide-aura', () => {
    toggleAuraVisibility();
  });

  ipcMain.on('close-aura', () => {
    app.quit();
  });

  mainWindow.loadFile(path.join(__dirname, 'desktop-companion.html'));

  // Global desktop mouse tracking for 3D avatar head/eye tracking
  const mouseTrackInterval = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
      try {
        const cursor = screen.getCursorScreenPoint();
        const [winX, winY] = mainWindow.getPosition();
        const [winW, winH] = mainWindow.getSize();
        const relX = (cursor.x - (winX + winW / 2)) / (winW / 2);
        const relY = -(cursor.y - (winY + winH / 2)) / (winH / 2);
        mainWindow.webContents.send('global-mouse-move', {
          x: Math.max(-2, Math.min(2, relX)),
          y: Math.max(-2, Math.min(2, relY))
        });
      } catch (e) {}
    }
  }, 40);

  mainWindow.on('closed', () => {
    clearInterval(mouseTrackInterval);
    mainWindow = null;
  });
}

function toggleAuraVisibility() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.setAlwaysOnTop(true, 'status');
    mainWindow.focus();
  }
}

function resetToDefaultPosition() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  mainWindow.setPosition(screenWidth - 400, screenHeight - 540);
}

function setupTray() {
  const contextMenu = Menu.buildFromTemplate([
    { label: '🤖 Project AURA Companion', enabled: false },
    { type: 'separator' },
    { 
      label: '🎙️ Live Voice Call (Alt+C)', 
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
          mainWindow.webContents.send('toggle-live-call');
        }
      } 
    },
    { 
      label: '👁️ Toggle Show / Hide (Alt+S)', 
      click: () => toggleAuraVisibility() 
    },
    { 
      label: '📸 Take Screenshot to Desktop', 
      click: async () => {
        const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1920, height: 1080 } });
        if (sources.length > 0) {
          const img = sources[0].thumbnail.toPNG();
          const filePath = path.join(app.getPath('desktop'), `Aura_Screenshot_${Date.now()}.png`);
          fs.writeFileSync(filePath, img);
        }
      } 
    },
    { 
      label: '🔇 Toggle Volume Mute', 
      click: () => {
        exec('powershell -command "(New-Object -ComObject WScript.Shell).SendKeys([char]173)"');
      } 
    },
    { 
      label: '📍 Reset Position (Bottom-Right)', 
      click: () => resetToDefaultPosition() 
    },
    { type: 'separator' },
    { 
      label: '✕ Exit Aura Completely', 
      click: () => {
        app.isQuitting = true;
        app.quit();
      } 
    }
  ]);

  try {
    const iconPath = path.join(__dirname, 'tray-icon.png');
    tray = new Tray(iconPath);
    tray.setToolTip('UNIN — Universal Neural Intelligence Network (Alt+S / Alt+C)');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => toggleAuraVisibility());
    tray.on('double-click', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (e) {
    console.warn('[Tray] Setup error:', e);
  }
}

app.whenReady().then(() => {
  // Unrestricted Microphone & Media Permission Access for SOTA Neural Ear
  if (session && session.defaultSession) {
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      callback(true);
    });
    session.defaultSession.setPermissionCheckHandler(() => true);
  }

  createDesktopWindow();
  setupTray();

  // UNIN Max Mode: Auto-boot Headless WhatsApp Gateway silently in background
  whatsappGateway.init().then(res => {
    console.log('[Electron Main Max Mode] WhatsApp Gateway status:', res?.status);
  }).catch(err => {
    console.warn('[Electron Main Max Mode] WhatsApp Gateway boot notice:', err.message);
  });

  // Forward UNIN Goal Engine Telemetry directly to HUD
  goalEngine.on('step_started', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('goal-telemetry', { type: 'step_started', data });
    }
  });
  goalEngine.on('healing_attempt', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('goal-telemetry', { type: 'healing_attempt', data });
    }
  });
  goalEngine.on('healing_succeeded', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('goal-telemetry', { type: 'healing_succeeded', data });
    }
  });
  goalEngine.on('goal_completed', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('goal-telemetry', { type: 'goal_completed', data });
    }
  });

  // Forward UNIN Swarm Telemetry directly to HUD
  swarmOrchestrator.on('agent_active', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('swarm-telemetry', { type: 'agent_active', data });
    }
  });
  swarmOrchestrator.on('review_round', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('swarm-telemetry', { type: 'review_round', data });
    }
  });
  swarmOrchestrator.on('consensus_achieved', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('swarm-telemetry', { type: 'consensus_achieved', data });
    }
  });

  // Forward Offline Native Windows Wake-Word Events to Companion UI (lazy start)
  // nativeWakeWord.start();
  nativeWakeWord.on('wake_word', (word, confidence) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('wake-word-spotted', { word, confidence });
    }
  });

  ipcMain.on('set-wake-word-enabled', (event, enabled) => {
    if (enabled) nativeWakeWord.start();
    else nativeWakeWord.stop();
  });

  // Forward UNIN Visual Watchdog Telemetry directly to HUD
  visualWatchdog.on('watchdog_started', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('watchdog-telemetry', { type: 'watchdog_started', data });
    }
  });
  visualWatchdog.on('watchdog_stopped', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('watchdog-telemetry', { type: 'watchdog_stopped', data });
    }
  });
  visualWatchdog.on('anomaly_detected', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('watchdog-telemetry', { type: 'anomaly_detected', data });
    }
  });
  visualWatchdog.on('modal_spotted', async (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('watchdog-telemetry', { type: 'modal_spotted', data });
    }
    if (data.autoAction === 'TRIGGER_AUTO_ALLOW') {
      try {
        console.log('[VisualWatchdog] Auto-allowing detected permission modal...');
        await desktopAutomator.clickAllowDialog();
      } catch (e) {}
    }
  });

  // Attach native capture provider to Visual Watchdog
  visualWatchdog.setCaptureProvider(async () => {
    try {
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.size;
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: Math.min(width, 1280), height: Math.min(height, 720) }
      });
      if (sources.length > 0) {
        return { text: '' };
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  // Robust multi-hotkey registration
  const hideHotkeys = ['Alt+S', 'Alt+H', 'Alt+Q', 'Alt+X', 'CommandOrControl+Shift+H', 'CommandOrControl+Shift+A'];
  hideHotkeys.forEach(key => {
    try {
      const registered = globalShortcut.register(key, () => toggleAuraVisibility());
      console.log(`[Hotkey] ${key} active: ${registered}`);
    } catch (e) {}
  });

  globalShortcut.register('Alt+V', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('toggle-voice-mic');
    }
  });

  globalShortcut.register('Alt+C', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.webContents.send('toggle-live-call');
    }
  });

  let isAllowProcessing = false;
  globalShortcut.register('Alt+A', async () => {
    if (isAllowProcessing) return;
    isAllowProcessing = true;
    console.log('[Hotkey] Alt+A triggered: Click Allow / Proceed');
    try {
      await desktopAutomator.clickAllowDialog();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('aura-allow-triggered');
      }
    } catch (e) {
      console.error('[Hotkey] Alt+A error:', e.message);
    } finally {
      setTimeout(() => { isAllowProcessing = false; }, 1200);
    }
  });

  // Astra-6 Global Fast Hotkeys
  globalShortcut.register('CommandOrControl+Shift+D', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      console.log('[Hotkey] Ctrl+Shift+D: Instant Media Download Triggered');
      mainWindow.webContents.send('trigger-astra-action', { action: 'download_active_media' });
    }
  });

  globalShortcut.register('CommandOrControl+Shift+S', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      console.log('[Hotkey] Ctrl+Shift+S: Instant Context Sniff Triggered');
      mainWindow.webContents.send('trigger-astra-action', { action: 'sniff_context' });
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createDesktopWindow();
  });
});

app.on('will-quit', () => {
  nativeWakeWord.stop();
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
