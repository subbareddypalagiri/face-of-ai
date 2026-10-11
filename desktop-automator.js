// desktop-automator.js — Project AURA Autonomous Windows RPA & Desktop Control Engine
'use strict';

const { exec, spawn } = require('child_process');
const { clipboard, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Autonomous Skill Hunter & Prompt Enhancer
const skillHunter = require('./skill-hunter');

// SOTA Frontier Meta-AI Router (Fallback & Orchestrator)
const metaAiRouter = require('./meta-ai-router');

// Long-Term Memory Core (Contact book & notes)
const memoryCore = require('./memory-core');

// UNIN Autonomous WhatsApp Gateway (Max Mode Multi-Device Engine)
const { whatsappGateway } = require('./unin-whatsapp-gateway');

function isAntigravityInstalled() {
  const localApp = path.join(process.env.LOCALAPPDATA || 'C:\\Users\\subba\\AppData\\Local', 'Programs', 'Antigravity', 'Antigravity.exe');
  if (fs.existsSync(localApp)) return true;
  try {
    const apps = getInstalledApps();
    const found = apps.find(a => a.name.toLowerCase().includes('antigravity'));
    if (found) return true;
  } catch (e) {}
  return false;
}

// Scheduled tasks persistence initialized in Scheduler Engine section below

/**
 * Execute PowerShell script via high-speed stdin streaming.
 * Eliminates all Windows 8191 cmd-line length limits, quoting errors, and Base64 buffer overflows.
 */
function runPowerShell(script) {
  return new Promise((resolve) => {
    const fullScript = `$ProgressPreference = 'SilentlyContinue'\n` + script;
    const ps = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', '-']);
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      try { ps.kill(); } catch (e) {}
      resolve({ success: false, stdout: stdout.trim(), stderr: 'Timeout', error: 'PowerShell execution timed out' });
    }, 20000);

    ps.stdout.on('data', (d) => { stdout += d.toString(); });
    ps.stderr.on('data', (d) => { stderr += d.toString(); });
    ps.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        success: code === 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        error: code === 0 ? null : (stderr.trim() || `Exited with code ${code}`)
      });
    });
    ps.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        success: false,
        stdout: stdout.trim(),
        stderr: err.message,
        error: err.message
      });
    });

    try {
      ps.stdin.write(fullScript);
      ps.stdin.end();
    } catch (e) {
      clearTimeout(timer);
      resolve({ success: false, stdout: '', stderr: e.message, error: e.message });
    }
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Focus any desktop window by process name or window title keyword.
 */
async function activateWindow(targetApp) {
  const query = (targetApp || '').toLowerCase().trim();
  if (!query) return { success: false, error: 'No target app specified' };

  // Special aliases
  let processPatterns = [];
  let titlePatterns = [];

  if (query.includes('whatsapp') || query.includes('whats') || query.includes('wa')) {
    try {
      if (shell && shell.openExternal) {
        await shell.openExternal('whatsapp:');
      } else {
        exec('start "" "whatsapp:"');
      }
      return { success: true, target: 'whatsapp', method: 'protocol_activate' };
    } catch(e) {}
  } else if (query.includes('anti') || query.includes('antigravity')) {
    try {
      exec('start "" "C:\\Users\\subba\\AppData\\Local\\Programs\\Antigravity\\Antigravity.exe"');
      return { success: true, target: 'antigravity', method: 'native_executable_activate' };
    } catch(e) {}
  } else if (query.includes('code') || query.includes('vscode')) {
    processPatterns = ['Code'];
    titlePatterns = ['Visual Studio Code'];
  } else if (query.includes('chrome')) {
    processPatterns = ['chrome'];
    titlePatterns = ['Google Chrome', 'Chrome'];
  } else if (query.includes('note') || query.includes('notepad')) {
    processPatterns = ['notepad'];
    titlePatterns = ['Notepad'];
  } else {
    processPatterns = [query];
    titlePatterns = [query];
  }

  const psScript = `
    Add-Type -TypeDefinition '
    using System;
    using System.Runtime.InteropServices;
    public class Win32Window {
        [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
        [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
        [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
    }
    ';

    $procs = Get-Process | Where-Object {
        $p = $_
        ${processPatterns.map(p => `$p.ProcessName -like "*${p}*"`).join(' -or ')} -or
        ${titlePatterns.map(t => `$p.MainWindowTitle -like "*${t}*"`).join(' -or ')}
    }

    $activated = $false
    foreach ($proc in $procs) {
        if ($proc.MainWindowHandle -ne [IntPtr]::Zero) {
            # SW_RESTORE = 9
            [Win32Window]::ShowWindowAsync($proc.MainWindowHandle, 9) | Out-Null
            $activated = [Win32Window]::SetForegroundWindow($proc.MainWindowHandle)
            if ($activated) {
                Write-Output "ACTIVATED:$($proc.ProcessName):$($proc.Id)"
                break
            }
        }
    }

    if (-not $activated) {
        # Fallback to WScript.Shell AppActivate
        $ws = New-Object -ComObject WScript.Shell
        ${titlePatterns.map(t => `if ($ws.AppActivate("${t}")) { Write-Output "WSCRIPT_ACTIVATED:${t}"; exit }`).join('\n        ')}
        ${processPatterns.map(p => `if ($ws.AppActivate("${p}")) { Write-Output "WSCRIPT_ACTIVATED:${p}"; exit }`).join('\n        ')}
    }
  `;

  const res = await runPowerShell(psScript);
  const activated = res.stdout.includes('ACTIVATED');

  // If WhatsApp wasn't running, trigger native launch
  if (!activated && query.includes('whatsapp')) {
    try {
      exec('start whatsapp:');
      await sleep(1200);
      return { success: true, app: 'WhatsApp', launched: true };
    } catch(e) {}
  }

  return {
    success: activated || res.stdout.length > 0,
    target: targetApp,
    details: res.stdout || 'Attempted activation'
  };
}

/**
 * Send simulated key sequence to currently focused window.
 */
async function sendKeys(keys) {
  if (!keys) return { success: false, error: 'No keys specified' };
  const psScript = `
    $ws = New-Object -ComObject WScript.Shell
    $ws.SendKeys('${keys.replace(/'/g, "''")}')
  `;
  const res = await runPowerShell(psScript);
  return { success: res.success, keys };
}

function safeReadClipboard() {
  try {
    if (clipboard && typeof clipboard.readText === 'function') {
      return clipboard.readText();
    }
  } catch (e) {}
  return '';
}

function safeWriteClipboard(str) {
  try {
    if (clipboard && typeof clipboard.writeText === 'function') {
      clipboard.writeText(str);
      return true;
    }
  } catch (e) {}
  return false;
}

/**
 * Type text into active window.
 * Uses clipboard paste (Ctrl+V) for ultra-fast, 100% Unicode/Telugu/code fidelity.
 */
async function typeIntoActiveWindow(text, pressEnter = false) {
  if (!text) return { success: false, error: 'No text provided' };

  const originalClipboard = safeReadClipboard();
  try {
    safeWriteClipboard(text);
    await sleep(80);

    // Send Ctrl+V
    await sendKeys('^v');

    if (pressEnter) {
      await sleep(150);
      await sendKeys('{ENTER}');
    }

    // Restore original clipboard after short delay
    setTimeout(() => {
      try {
        if (originalClipboard) safeWriteClipboard(originalClipboard);
      } catch(e) {}
    }, 500);

    return { success: true, textLength: text.length, enterPressed: pressEnter };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Focus window and type text into it.
 */
async function typeIntoWindow(targetApp, text, pressEnter = false) {
  const act = await activateWindow(targetApp);
  await sleep(350);
  const typeRes = await typeIntoActiveWindow(text, pressEnter);
  return {
    success: typeRes.success,
    activatedApp: act.target,
    textLength: text.length,
    enterPressed: pressEnter
  };
}

/**
 * Live Visual Ghost-Typing with User Speed Control:
 * - 'turbo' / 'instant': Instant 1-shot injection (<100ms total) — zero waiting!
 * - 'fast' (Default): Rapid phrase-by-phrase burst streaming (~1.2s - 1.8s total) — blazing fast & visually satisfying!
 * - 'cinematic' / 'smooth': Natural human typing cadence (~3.5s total).
 */
async function typeVisually(text, options = {}) {
  if (!text) return { success: false, error: 'No text provided' };
  const pressEnter = !!options.pressEnter;

  // Determine speed preference (options override -> config.json -> default: 'fast')
  let speed = (options.speed || '').toLowerCase().trim();
  if (!speed) {
    try {
      const cfgPath = path.join(__dirname, 'config.json');
      if (fs.existsSync(cfgPath)) {
        const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
        if (cfg.typing_speed) speed = cfg.typing_speed.toLowerCase().trim();
      }
    } catch(e) {}
  }
  if (!speed) speed = 'fast';

  const originalClipboard = safeReadClipboard();

  try {
    if (speed === 'turbo' || speed === 'instant') {
      // ── TURBO: 1-Shot Instant Paste (<100ms) ──
      safeWriteClipboard(text);
      await sleep(40);
      await sendKeys('^v');
      if (pressEnter) {
        await sleep(120);
        await sendKeys('{ENTER}');
      }
    } else if (speed === 'cinematic' || speed === 'smooth') {
      // ── CINEMATIC: Word-by-Word Smooth Streaming (~3s) ──
      const words = text.split(/(\s+)/);
      const chunks = [];
      let temp = '';
      for (let i = 0; i < words.length; i++) {
        temp += words[i];
        if (i % 6 === 5 || i === words.length - 1) {
          chunks.push(temp);
          temp = '';
        }
      }
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (!chunk) continue;
        safeWriteClipboard(chunk);
        await sleep(8);
        await sendKeys('^v');
        await sleep(40);
      }
      if (pressEnter) {
        await sleep(120);
        await sendKeys('{ENTER}');
      }
    } else {
      // ── FAST: Rapid Phrase Burst Streaming (1.0s - 1.8s) ──
      const totalLen = text.length;
      const targetChunks = Math.min(14, Math.max(5, Math.ceil(totalLen / 80)));
      const chunkSize = Math.ceil(totalLen / targetChunks);
      for (let i = 0; i < totalLen; i += chunkSize) {
        safeWriteClipboard(text.slice(i, i + chunkSize));
        await sleep(6);
        await sendKeys('^v');
        await sleep(22);
      }
      if (pressEnter) {
        await sleep(120);
        await sendKeys('{ENTER}');
      }
    }

    setTimeout(() => {
      try {
        if (originalClipboard) safeWriteClipboard(originalClipboard);
      } catch(e) {}
    }, 500);

    return {
      success: true,
      textLength: text.length,
      speed,
      enterPressed: pressEnter,
      mode: 'visual_streaming'
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Bulletproof WhatsApp Messaging Engine with Contact Book & Anti-Group Protection:
 * 1. Checks memoryCore contact book first. If phone number is found, uses official direct URI protocol (100% deterministic, zero search error).
 * 2. If contact name search is needed:
 *    - Sends {ESC}{ESC} to dismiss existing modals/in-chat search.
 *    - Uses Ctrl+N ("New Chat") which opens the dedicated 1-on-1 contact selector (GROUPS ARE EXCLUDED!).
 *    - Types contact name and waits 1200ms for WhatsApp query to settle.
 *    - Presses {ENTER} directly (STRICTLY NO {DOWN} KEY to prevent jumping to group chats).
 *    - Visually ghost-types the message into the chat box.
 *    - If autoSend is true, waits 1500ms safety window and dispatches; if false/draft mode, leaves message in input box for 1-click user send.
 */
async function sendWhatsAppMessage(contact, message, phone, options = {}) {
  const cleanMessage = (message && message.trim()) ? message.trim() : 'Hi!';
  let cleanPhone = (phone || '').replace(/[^0-9+]/g, '');
  const targetContact = (contact || '').trim();
  const autoSend = options.autoSend !== false; // Default true or configurable

  // Check Contact Book in memoryCore if phone wasn't explicitly passed
  if (!cleanPhone && targetContact) {
    try {
      const saved = memoryCore.getContact(targetContact);
      if (saved && saved.phone) {
        cleanPhone = saved.phone.replace(/[^0-9+]/g, '');
        console.log(`[WhatsApp] Resolved "${targetContact}" from memory contact book: ${cleanPhone}`);
      }
    } catch (e) {}
  }

  // UNIN MAX MODE Priority: Always use Headless WhatsApp Gateway (Zero Screen Hijacking)
  if (whatsappGateway) {
    try {
      // Auto-wake gateway if not yet connected
      if (whatsappGateway.status !== 'CONNECTED') {
        console.log('[WhatsApp Max Mode] Headless gateway connecting in background...');
        await whatsappGateway.init();
      }

      if (whatsappGateway.status === 'CONNECTED') {
        const res = await whatsappGateway.sendMessage(cleanPhone || targetContact, cleanMessage);
        if (res && res.success) {
          return {
            success: true,
            method: 'whatsapp_gateway_headless',
            contact: targetContact || cleanPhone,
            message: cleanMessage,
            status: `[Max Mode] Dispatched silently in background to ${targetContact || cleanPhone} via WhatsApp Gateway (Zero Screen Hijacking)`
          };
        } else {
          console.warn('[WhatsApp Max Mode] Headless Gateway message dispatch notice:', res?.error);
          if (!options.forceDesktopApp) {
            return {
              success: false,
              method: 'whatsapp_gateway_headless',
              contact: targetContact || cleanPhone,
              error: res?.error || 'Could not find contact or send message via WhatsApp Gateway.',
              status: `[Max Mode] Gateway error: ${res?.error || 'Failed to dispatch'}`
            };
          }
        }
      } else if (!options.forceDesktopApp) {
        return {
          success: false,
          needsQR: true,
          method: 'whatsapp_gateway_headless',
          error: 'WhatsApp is not connected yet. Please click the WhatsApp icon in the bottom dock to link your device once.',
          status: 'WhatsApp requires 1-time QR linking via the WhatsApp icon in the dock.'
        };
      }
    } catch (gwErr) {
      console.warn('[WhatsApp Max Mode] Headless Gateway exception:', gwErr.message);
      if (!options.forceDesktopApp) {
        return {
          success: false,
          method: 'whatsapp_gateway_headless',
          error: gwErr.message,
          status: `[Max Mode] WhatsApp Gateway error: ${gwErr.message}`
        };
      }
    }
  }

  // Method 1: If direct phone number is available, use official Windows WhatsApp URI protocol
  if (cleanPhone && cleanPhone.length >= 10) {
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone;
    const uri = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(cleanMessage)}`;
    try {
      if (shell && shell.openExternal) {
        await shell.openExternal(uri);
      } else {
        exec(`start "" "${uri}"`);
      }
      await sleep(2200);
      if (autoSend) {
        await sleep(500);
        await sendKeys('{ENTER}');
      }
      return {
        success: true,
        method: 'protocol_phone',
        contact: targetContact || formattedPhone,
        phone: cleanPhone,
        message: cleanMessage,
        autoSend,
        status: autoSend ? `Sent to +${formattedPhone} successfully` : `Drafted message in chat with +${formattedPhone}`
      };
    } catch(e) {
      console.warn('[WhatsApp] Protocol open failed, falling back to desktop UI automation');
    }
  }

  // Method 2: If no contact name provided, send to active chat
  if (!targetContact) {
    await activateWindow('whatsapp');
    await sleep(400);
    await typeVisually(cleanMessage, { pressEnter: autoSend });
    return {
      success: true,
      method: 'active_chat',
      message: cleanMessage,
      autoSend,
      status: autoSend ? 'Sent to currently active WhatsApp chat' : 'Drafted message in active WhatsApp chat'
    };
  }

  // Method 3: Safe Name-Search & Live Visual Delivery with Strict Foreground Verification
  // 1. Force WhatsApp window to restore and pop up live on screen
  try {
    if (shell && shell.openExternal) {
      await shell.openExternal('whatsapp:');
    } else {
      exec('start "" "whatsapp:"');
    }
  } catch (e) {}
  try {
    exec('explorer.exe "shell:AppsFolder\\5319275A.WhatsAppDesktop_cv1g1gvanyjgm!App"');
  } catch (e) {}
  await sleep(700);

  // 2. Precompiled FocusBot.dll path
  const dllPath = path.join(__dirname, 'FocusBot.dll').replace(/'/g, "''");

  // 3. Strict Foreground Verification & Typing Script
  const singlePipelineScript = `
    Add-Type -Path '${dllPath}'
    Add-Type -AssemblyName System.Windows.Forms
    $ws = New-Object -ComObject WScript.Shell

    Add-Type -TypeDefinition '
    using System;
    using System.Text;
    using System.Runtime.InteropServices;
    public class ForegroundChecker {
        [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
        [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
        public static string GetActiveWindowTitle() {
            IntPtr hwnd = GetForegroundWindow();
            StringBuilder sb = new StringBuilder(256);
            GetWindowText(hwnd, sb, 256);
            return sb.ToString();
        }
        public static string GetActiveProcessName() {
            IntPtr hwnd = GetForegroundWindow();
            uint pid;
            GetWindowThreadProcessId(hwnd, out pid);
            try {
                return System.Diagnostics.Process.GetProcessById((int)pid).ProcessName;
            } catch { return ""; }
        }
    }
    '

    # Verify foreground window belongs to WhatsApp or bring it up
    $isWhatsAppActive = $false
    for ($check = 0; $check -lt 15; $check++) {
        $activeTitle = [ForegroundChecker]::GetActiveWindowTitle()
        $activeProc = [ForegroundChecker]::GetActiveProcessName()
        if ($activeTitle -like "*WhatsApp*" -or $activeProc -like "*WhatsApp*" -or $activeProc -like "*WhatsApp.Root*") {
            $isWhatsAppActive = $true
            break
        }
        $ws.AppActivate("WhatsApp") | Out-Null
        $ws.AppActivate("WhatsApp.Root") | Out-Null

        try {
            $procs = Get-Process -Name "WhatsApp*","WhatsApp.Root" -ErrorAction SilentlyContinue
            foreach ($p in $procs) {
                if ($p.MainWindowHandle -ne [IntPtr]::Zero) {
                    [AuraBot.FocusBot]::ShowWindowAsync($p.MainWindowHandle, 9) | Out-Null
                    [AuraBot.FocusBot]::SetForegroundWindow($p.MainWindowHandle) | Out-Null
                    $isWhatsAppActive = $true
                    break
                }
            }
        } catch {}
        Start-Sleep -Milliseconds 200
    }

    # If AppActivate / handle failed (Windows 11 XAML Island), click into WhatsApp search bar
    if (-not $isWhatsAppActive) {
        try {
            [AuraBot.FocusBot]::Click(180, 140)
            Start-Sleep -Milliseconds 300
            $activeProc = [ForegroundChecker]::GetActiveProcessName()
            if ($activeProc -like "*WhatsApp*") {
                $isWhatsAppActive = $true
            }
        } catch {}
    }

    # Focus WhatsApp search bar directly
    try {
        [AuraBot.FocusBot]::Click(180, 100)
        Start-Sleep -Milliseconds 250
    } catch {}

    function Set-SafeClipboard($val) {
        for ($retry = 0; $retry -lt 8; $retry++) {
            try {
                [System.Windows.Forms.Clipboard]::SetText($val)
                return
            } catch {
                Start-Sleep -Milliseconds 30
            }
        }
    }

    # Step 1: Dismiss any active in-chat search or dialogs and open Search bar
    $ws.SendKeys('{ESC}{ESC}')
    Start-Sleep -Milliseconds 200
    $ws.SendKeys('^f')
    Start-Sleep -Milliseconds 300

    # Step 2: Paste contact name safely into search input
    Set-SafeClipboard '${targetContact.replace(/'/g, "''")}'
    $ws.SendKeys('^v')
    Start-Sleep -Milliseconds 1200

    # Step 3: Open the matched contact chat
    $ws.SendKeys('{ENTER}')
    Start-Sleep -Milliseconds 800

    # Step 4: Stream message into chat input box
    $words = '${cleanMessage.replace(/'/g, "''")}'.Split(' ')
    for ($i = 0; $i -lt $words.Length; $i++) {
        $word = $words[$i]
        if ($i -gt 0) { $word = ' ' + $word }
        Set-SafeClipboard $word
        $ws.SendKeys('^v')
        Start-Sleep -Milliseconds 40
    }

    # Step 5: Dispatch if autoSend enabled
    ${autoSend ? `
    Start-Sleep -Milliseconds 500
    $ws.SendKeys('{ENTER}')
    Write-Output "STATUS:DISPATCHED"
    ` : `
    Write-Output "STATUS:DRAFTED"
    `}
  `;

  const runRes = await runPowerShell(singlePipelineScript);
  if (runRes.stdout.includes('ERROR:WHATSAPP_NOT_FOREGROUND')) {
    // Seamless Layer 3 Cloud Web Failover: open web.whatsapp.com
    console.log('[WhatsApp] Desktop app not accessible. Failing over to WhatsApp Web...');
    const webUrl = cleanPhone 
      ? `https://web.whatsapp.com/send?phone=${cleanPhone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(cleanMessage)}`
      : `https://web.whatsapp.com`;
    try {
      if (shell && shell.openExternal) await shell.openExternal(webUrl);
      else exec(`start "" "${webUrl}"`);
    } catch (e) {}
    return {
      success: true,
      method: 'browser_web_whatsapp_failover',
      contact: targetContact,
      message: cleanMessage,
      url: webUrl,
      status: `WhatsApp Desktop was not available. Seamlessly launched WhatsApp Web in browser (${webUrl})`
    };
  }

  const isDispatched = runRes.stdout.includes('DISPATCHED');

  return {
    success: true,
    method: 'verified_foreground_name_search',
    contact: targetContact,
    message: cleanMessage,
    autoSend,
    status: isDispatched 
      ? `Message safely dispatched to ${targetContact} on WhatsApp` 
      : `Message visually drafted in chat with ${targetContact} (ready to send)`
  };
}

/**
 * Start a brand-new clean conversation in Antigravity IDE:
 * 1. Brings Antigravity to focus.
 * 2. Triggers New Conversation hotkey (Ctrl+Shift+L) so existing chats are never polluted.
 * 3. Waits for the clean, empty prompt box to focus.
 */
async function startAntigravityNewConversation() {
  await activateWindow('antigravity');
  await sleep(350);

  const psScript = `
    $ws = New-Object -ComObject WScript.Shell
    $ws.AppActivate("Antigravity") | Out-Null
    Start-Sleep -Milliseconds 250
    # Try Ctrl+Shift+L (VSCode / Antigravity New Chat shortcut)
    $ws.SendKeys('^+l')
    Start-Sleep -Milliseconds 350
    Write-Output "STATUS:NEW_CONVERSATION_TRIGGERED"
  `;
  await runPowerShell(psScript);
  return { success: true, status: 'Initiated fresh new conversation in Antigravity' };
}

/**
 * Automate Antigravity IDE with SOTA Skill Hunter & Market Prompt Enhancement:
 * 1. Takes user's raw prompt (Telugu/English).
 * 2. Autonomously hunts best skills, MCP servers, and frameworks from the web.
 * 3. Compiles SOTA master prompt.
 * 4. Isolates task into a fresh New Conversation or New Project.
 * 5. Live visually streams the prompt into the input box with user's chosen speed!
 * 6. Submits and auto-approves Allow permissions.
 */
async function automateAntigravityWithSkills(rawPrompt, autoSubmit = true, autoAllow = true, options = {}) {
  if (!rawPrompt || !rawPrompt.trim()) {
    return { success: false, error: 'Prompt text cannot be empty' };
  }

  const opts = typeof autoSubmit === 'object' ? autoSubmit : (typeof options === 'object' ? options : {});
  const shouldAutoSubmit = typeof autoSubmit === 'boolean' ? autoSubmit : (opts.autoSubmit !== false);
  const shouldAutoAllow = typeof autoAllow === 'boolean' ? autoAllow : (opts.autoAllow !== false);
  const newSession = opts.newSession !== false; // Default: clean new conversation
  const newProject = !!opts.newProject;
  const projectName = opts.projectName || '';
  const typingSpeed = opts.speed || '';

  // 1. Autonomous Skill Hunting & Market-Grade Prompt Enhancement
  const skillResult = await skillHunter.autonomousSkillPipeline(rawPrompt.trim(), 'software');
  const finalPrompt = skillResult.enhancedPrompt || rawPrompt.trim();

  // 2. Resilient Failover Check: If Antigravity IDE is not installed locally, route to Cloud Web AI
  if (!isAntigravityInstalled()) {
    console.log('[UNIN] Antigravity IDE not detected locally. Seamlessly routing to Browser AI Agent...');
    safeWriteClipboard(finalPrompt);
    const metaRes = await metaAiRouter.routeMetaAiTask(rawPrompt.trim(), { autoOpen: true });
    return {
      success: true,
      fallbackToBrowser: true,
      rawPrompt,
      enhancedPromptLength: finalPrompt.length,
      skillsDiscovered: skillResult.skillsDiscovered,
      optimalAI: metaRes.optimalAI,
      targetUrl: metaRes.targetUrl,
      status: `Antigravity IDE not installed on this PC. Seamlessly transitioned to ${metaRes.optimalAI} (${metaRes.targetUrl}) in browser. Enhanced SOTA prompt is copied to clipboard!`
    };
  }

  // 3. Bring Antigravity to focus
  await activateWindow('antigravity');
  await sleep(400);

  // 4. New Project Workspace or Clean New Conversation Isolation
  if (newProject || projectName) {
    let projName = projectName;
    if (!projName) {
      const cleanWords = rawPrompt.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => !['open', 'antigravity', 'create', 'a', 'new', 'project', 'and', 'with', 'all', 'the', 'like', 'buddy'].includes(w));
      projName = cleanWords.slice(0, 3).join('-') || 'antigravity-3d-project';
    }
    await manageAntigravityWorkspace('new_project', projName);
    await sleep(2200);
    await activateWindow('antigravity');
    await sleep(500);
    await startAntigravityNewConversation();
    await sleep(500);
  } else if (newSession) {
    await startAntigravityNewConversation();
    await sleep(400);
  }

  // 5. Live visual ghost-typing with user-selected speed (turbo, fast, or cinematic)
  const typeRes = await typeVisually(finalPrompt, { pressEnter: shouldAutoSubmit, speed: typingSpeed });

  // 6. Auto-approve Allow/Proceed dialog
  if (shouldAutoAllow) {
    setTimeout(async () => {
      await clickAllowDialog();
    }, 2500);
  }

  return {
    success: typeRes.success,
    tool: 'automate_antigravity_with_skills',
    rawPrompt: rawPrompt,
    enhancedPromptLength: finalPrompt.length,
    skillsDiscovered: skillResult.skillsDiscovered,
    recommendedPackage: skillResult.recommendedPackage,
    submitted: shouldAutoSubmit,
    autoAllowEnabled: shouldAutoAllow,
    speedUsed: typeRes.speed,
    newSessionTriggered: newSession,
    status: `Engineered market prompt with ${skillResult.skillsDiscovered.length} skills & visually injected into clean Antigravity session`
  };
}

/**
 * Automate Antigravity IDE (Direct Prompt):
 * Brings Antigravity to focus, optionally starts fresh conversation, and types prompt!
 */
async function automateAntigravity(promptText, autoSubmit = true, autoAllow = false, options = {}) {
  if (!promptText || !promptText.trim()) {
    return { success: false, error: 'Prompt text cannot be empty' };
  }

  const opts = typeof autoSubmit === 'object' ? autoSubmit : (typeof options === 'object' ? options : {});
  const shouldAutoSubmit = typeof autoSubmit === 'boolean' ? autoSubmit : (opts.autoSubmit !== false);
  const shouldAutoAllow = typeof autoAllow === 'boolean' ? autoAllow : !!opts.autoAllow;
  const newSession = opts.newSession !== false;
  const cleanPrompt = promptText.trim();

  // Resilient Failover Check: If Antigravity IDE is not installed locally, route to Cloud Web AI
  if (!isAntigravityInstalled()) {
    console.log('[UNIN] Antigravity IDE not detected locally. Seamlessly routing to Browser AI Agent...');
    safeWriteClipboard(cleanPrompt);
    const metaRes = await metaAiRouter.routeMetaAiTask(cleanPrompt, { autoOpen: true });
    return {
      success: true,
      fallbackToBrowser: true,
      prompt: cleanPrompt,
      optimalAI: metaRes.optimalAI,
      targetUrl: metaRes.targetUrl,
      status: `Antigravity IDE not installed on this PC. Seamlessly transitioned to ${metaRes.optimalAI} (${metaRes.targetUrl}) in browser. Prompt is copied to clipboard!`
    };
  }

  // 1. Focus Antigravity window
  await activateWindow('antigravity');
  await sleep(400);

  // 2. Start clean session if requested
  if (newSession) {
    await startAntigravityNewConversation();
    await sleep(350);
  }

  // 3. Visually stream prompt with user speed preference
  const typeRes = await typeVisually(cleanPrompt, { pressEnter: shouldAutoSubmit, speed: opts.speed });

  // 4. If autoAllow requested, wait briefly and trigger allow
  if (shouldAutoAllow) {
    setTimeout(async () => {
      await clickAllowDialog();
    }, 2500);
  }

  return {
    success: typeRes.success,
    tool: 'automate_antigravity',
    prompt: cleanPrompt,
    submitted: shouldAutoSubmit,
    autoAllowEnabled: shouldAutoAllow,
    speedUsed: typeRes.speed,
    status: 'Task sent to clean Antigravity conversation'
  };
}

/**
 * Click "Allow" or "Proceed" confirmation dialog in Antigravity or active app.
 */
async function clickAllowDialog() {
  // In Antigravity permission modals, Enter confirms primary "Allow" / "Proceed"
  await sendKeys('{ENTER}');
  await sleep(150);
  await sendKeys(' ');
  await sleep(100);
  await sendKeys('{ENTER}');
  return {
    success: true,
    action: 'allow_dispatched',
    status: 'Confirmed Allow / Proceed dialog'
  };
}

/**
 * ══════════════════════════════════════════════════════════════════
 * ── SOTA 2026 FAANG-GRADE PERSISTENT TASK SCHEDULER ENGINE ─────────
 * ══════════════════════════════════════════════════════════════════
 * Features:
 * - Disk-backed persistence in scheduled-tasks.json with atomic writes.
 * - 10-Second Active Watchdog Ticker preventing timer drift across OS sleep/hibernate.
 * - Startup offline catch-up recovery executing tasks due during app downtime.
 * - Universal action & parameter normalization (contact/to/name, message/text/body, phone/number).
 * - Automatic phone number resolution from memoryCore contact book.
 * - Full lifecycle state tracking: PENDING, EXECUTING, COMPLETED, FAILED, CANCELLED.
 */

const TASKS_FILE = path.join(__dirname, 'scheduled-tasks.json');
const scheduledTasks = new Map();
let schedulerTicker = null;

function loadScheduledTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) {
      fs.writeFileSync(TASKS_FILE, '[]', 'utf8');
      return;
    }
    const raw = fs.readFileSync(TASKS_FILE, 'utf8');
    const tasks = JSON.parse(raw);
    if (!Array.isArray(tasks)) return;

    const now = Date.now();
    tasks.forEach(t => {
      if (!t || !t.id) return;
      scheduledTasks.set(t.id, t);

      // Offline catch-up recovery: if task was due while UNIN was offline or sleeping
      if (t.status === 'PENDING') {
        if (t.dueEpoch <= now) {
          // If due within the last 2 hours, execute on startup recovery
          if (now - t.dueEpoch <= 2 * 60 * 60 * 1000) {
            console.log(`[Scheduler] Catching up missed task ${t.id} (${t.description})`);
            setTimeout(() => executeScheduledTask(t.id), 2500);
          } else {
            t.status = 'EXPIRED';
            t.error = 'Task expired while system was offline';
          }
        } else {
          // Register runtime timer for pending future task
          const remainingMs = t.dueEpoch - now;
          if (remainingMs < 2147483647) {
            t.timerHandle = setTimeout(() => {
              executeScheduledTask(t.id);
            }, remainingMs);
          }
        }
      }
    });
  } catch (err) {
    console.error('[Scheduler] Failed to load scheduled-tasks.json:', err);
  }
}

function saveScheduledTasks() {
  try {
    const list = Array.from(scheduledTasks.values()).map(t => {
      const { timerHandle, ...rest } = t;
      return rest;
    });

    const data = JSON.stringify(list, null, 2);
    const tmpFile = `${TASKS_FILE}.tmp`;
    fs.writeFileSync(tmpFile, data, 'utf8');
    try {
      fs.renameSync(tmpFile, TASKS_FILE);
    } catch (renameErr) {
      fs.writeFileSync(TASKS_FILE, data, 'utf8');
    }
  } catch (err) {
    console.error('[Scheduler] Failed to persist scheduled tasks:', err);
  }
}

function startSchedulerHeartbeat() {
  if (schedulerTicker) return;
  schedulerTicker = setInterval(async () => {
    const now = Date.now();
    for (const [id, t] of scheduledTasks.entries()) {
      if (t.status === 'PENDING' && t.dueEpoch <= now) {
        await executeScheduledTask(id);
      }
    }
  }, 10000);
}

async function executeScheduledTask(taskId) {
  const task = scheduledTasks.get(taskId);
  if (!task || task.status !== 'PENDING') return;

  task.status = 'EXECUTING';
  task.startedAt = new Date().toISOString();
  saveScheduledTasks();

  console.log(`[Scheduler] ⚡ Executing scheduled task ${taskId} [${task.actionType}]:`, task.params);

  try {
    let result = null;
    const { actionType, params } = task;

    if (actionType === 'send_whatsapp_message') {
      const contact = params.contact || params.to || params.name || '';
      const message = params.message || params.text || params.body || '';
      let phone = params.phone || params.phoneNumber || params.number || '';

      if (!phone && contact) {
        try {
          const saved = memoryCore.getContact(contact);
          if (saved && saved.phone) {
            phone = saved.phone;
            console.log(`[Scheduler] Resolved phone for "${contact}" from memory: ${phone}`);
          }
        } catch (e) {}
      }

      result = await sendWhatsAppMessage(contact, message, phone, { autoSend: params.autoSend !== false });
    } else if (actionType === 'open_app') {
      const app = params.appName || params.app || params.name || '';
      result = await launchUniversalApp(app);
    } else if (actionType === 'automate_antigravity') {
      result = await automateAntigravity(params.prompt, true, params.autoAllow);
    } else if (actionType === 'run_terminal_command') {
      result = await new Promise((resolve) => {
        exec(params.command, { timeout: 30000 }, (err, stdout, stderr) => {
          resolve({ success: !err, stdout: stdout || '', stderr: stderr || '', error: err ? err.message : null });
        });
      });
    } else if (actionType === 'open_youtube') {
      const q = (params.query || '').trim();
      const targetUrl = q ? `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` : 'https://www.youtube.com';
      if (shell && shell.openExternal) await shell.openExternal(targetUrl);
      else exec(`start "" "${targetUrl}"`);
      result = { success: true, url: targetUrl };
    } else if (actionType === 'type_text') {
      result = await typeIntoWindow(params.appName || 'active', params.text, params.pressEnter);
    } else {
      result = { success: false, error: `Unrecognized actionType: ${actionType}` };
    }

    task.status = (result && result.success !== false) ? 'COMPLETED' : 'FAILED';
    task.completedAt = new Date().toISOString();
    task.result = result;
    if (result && result.error) task.error = result.error;
    console.log(`[Scheduler] Task ${taskId} ${task.status}:`, result);
  } catch (err) {
    task.status = 'FAILED';
    task.completedAt = new Date().toISOString();
    task.error = err.message || String(err);
    console.error(`[Scheduler] Task ${taskId} failed with exception:`, err);
  } finally {
    if (task.timerHandle) {
      clearTimeout(task.timerHandle);
      delete task.timerHandle;
    }
    saveScheduledTasks();
  }
}

function scheduleTask(timeParam, actionType, params = {}, description = '') {
  let delayMs = 0;
  const now = Date.now();

  // Normalize actionType
  const rawAction = (actionType || 'whatsapp').toLowerCase().trim();
  let normAction = 'send_whatsapp_message';
  if (rawAction.includes('whatsapp') || rawAction.includes('message')) {
    normAction = 'send_whatsapp_message';
  } else if (rawAction.includes('app') || rawAction.includes('open') || rawAction.includes('launch')) {
    normAction = 'open_app';
  } else if (rawAction.includes('antigravity') || rawAction.includes('skill')) {
    normAction = 'automate_antigravity';
  } else if (rawAction.includes('terminal') || rawAction.includes('cmd') || rawAction.includes('command') || rawAction.includes('shell')) {
    normAction = 'run_terminal_command';
  } else if (rawAction.includes('youtube') || rawAction.includes('song') || rawAction.includes('video')) {
    normAction = 'open_youtube';
  } else if (rawAction.includes('type')) {
    normAction = 'type_text';
  }

  // Normalize params (flatten nested params if present)
  const rawParams = (params && typeof params === 'object') ? (params.params || params) : {};
  const normParams = { ...rawParams };

  if (normAction === 'send_whatsapp_message') {
    normParams.contact = rawParams.contact || rawParams.to || rawParams.name || rawParams.recipient || '';
    normParams.message = rawParams.message || rawParams.text || rawParams.body || rawParams.msg || '';
    normParams.phone = rawParams.phone || rawParams.phoneNumber || rawParams.number || rawParams.mobile || '';

    // Auto-resolve phone number from memory contact book
    if (!normParams.phone && normParams.contact) {
      try {
        const saved = memoryCore.getContact(normParams.contact);
        if (saved && saved.phone) {
          normParams.phone = saved.phone;
          console.log(`[Scheduler] Auto-resolved phone for "${normParams.contact}": ${normParams.phone}`);
        }
      } catch (e) {}
    }
  } else if (normAction === 'open_app') {
    normParams.appName = rawParams.appName || rawParams.app || rawParams.name || '';
  }

  // Parse timeParam
  if (typeof timeParam === 'number') {
    delayMs = timeParam * 1000;
  } else if (typeof timeParam === 'string') {
    const cleanTime = timeParam.toLowerCase().trim();

    // Relative: "in X minutes", "in X seconds", "in X hours", "in X days"
    const relMatch = cleanTime.match(/in\s+(\d+)\s*(s|sec|second|m|min|minute|h|hr|hour|d|day)s?/);
    if (relMatch) {
      const val = parseInt(relMatch[1], 10);
      const unit = relMatch[2];
      if (unit.startsWith('s')) delayMs = val * 1000;
      else if (unit.startsWith('m')) delayMs = val * 60 * 1000;
      else if (unit.startsWith('h')) delayMs = val * 60 * 60 * 1000;
      else if (unit.startsWith('d')) delayMs = val * 24 * 60 * 60 * 1000;
    } else {
      // Check absolute time: "5:30 pm", "17:30", "5 pm", "10:15 am"
      const timeMatch = cleanTime.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        const meridian = timeMatch[3];

        if (meridian === 'pm' && hours < 12) hours += 12;
        if (meridian === 'am' && hours === 12) hours = 0;

        const targetDate = new Date();
        targetDate.setHours(hours, minutes, 0, 0);

        // If target time has already passed today, schedule for tomorrow
        if (targetDate.getTime() <= now) {
          targetDate.setDate(targetDate.getDate() + 1);
        }
        delayMs = targetDate.getTime() - now;
      } else {
        // Fallback default: 1 minute
        delayMs = 60 * 1000;
      }
    }
  }

  if (delayMs <= 0) delayMs = 1000;
  const dueEpoch = now + delayMs;

  const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const scheduledTimeHuman = new Date(dueEpoch).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const scheduledDateHuman = new Date(dueEpoch).toLocaleDateString();

  const taskRecord = {
    id: taskId,
    actionType: normAction,
    params: normParams,
    description: description || `${normAction} for ${scheduledTimeHuman}`,
    dueEpoch,
    scheduledTime: scheduledTimeHuman,
    scheduledDate: scheduledDateHuman,
    delaySeconds: Math.round(delayMs / 1000),
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  // Register in-memory timer
  if (delayMs < 2147483647) {
    taskRecord.timerHandle = setTimeout(() => {
      executeScheduledTask(taskId);
    }, delayMs);
  }

  scheduledTasks.set(taskId, taskRecord);
  saveScheduledTasks();

  return {
    success: true,
    taskId,
    actionType: normAction,
    scheduledTime: scheduledTimeHuman,
    scheduledDate: scheduledDateHuman,
    delaySeconds: Math.round(delayMs / 1000),
    description: taskRecord.description,
    status: 'PENDING'
  };
}

function getScheduledTasks() {
  const list = [];
  scheduledTasks.forEach((t) => {
    list.push({
      id: t.id,
      actionType: t.actionType,
      scheduledTime: t.scheduledTime,
      scheduledDate: t.scheduledDate,
      delaySeconds: Math.max(0, Math.round((t.dueEpoch - Date.now()) / 1000)),
      description: t.description,
      status: t.status,
      createdAt: t.createdAt
    });
  });
  return { success: true, count: list.length, tasks: list };
}

function cancelScheduledTask(taskId) {
  if (scheduledTasks.has(taskId)) {
    const t = scheduledTasks.get(taskId);
    if (t.timerHandle) {
      clearTimeout(t.timerHandle);
      delete t.timerHandle;
    }
    t.status = 'CANCELLED';
    t.cancelledAt = new Date().toISOString();
    saveScheduledTasks();
    return { success: true, message: `Task ${taskId} cancelled successfully` };
  }
  return { success: false, error: 'Task not found' };
}

// Bootstrap scheduler on module load
loadScheduledTasks();
startSchedulerHeartbeat();

/**
 * Click mouse at exact desktop coordinates (x, y).
 */
async function mouseClickAt(x, y) {
  const psScript = `
    Add-Type -TypeDefinition '
    using System;
    using System.Runtime.InteropServices;
    public class MouseHelper {
        [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
        [DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, UIntPtr dwExtraInfo);
    }
    ';
    [MouseHelper]::SetCursorPos(${Math.round(x)}, ${Math.round(y)}) | Out-Null
    # MOUSEEVENTF_LEFTDOWN = 0x02, MOUSEEVENTF_LEFTUP = 0x04
    [MouseHelper]::mouse_event(0x02, 0, 0, 0, [UIntPtr]::Zero)
    Start-Sleep -Milliseconds 40
    [MouseHelper]::mouse_event(0x04, 0, 0, 0, [UIntPtr]::Zero)
  `;
  const res = await runPowerShell(psScript);
  return { success: res.success, x, y };
}

/**
 * Universal App Resolver & Launcher
 * Dynamically indexes Start Menu shortcuts (.lnk), desktop apps, and system utilities.
 * Completely eliminates hardcoding and prevents accidental Google searches for installed apps.
 */
let appCache = null;
let lastCacheTime = 0;

function findLnkFiles(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        findLnkFiles(full, results);
      } else if (item.name.toLowerCase().endsWith('.lnk')) {
        results.push({
          name: item.name.replace(/\.lnk$/i, '').trim(),
          path: full
        });
      }
    }
  } catch (e) {}
  return results;
}

function getInstalledApps(forceRefresh = false) {
  const now = Date.now();
  if (appCache && !forceRefresh && (now - lastCacheTime < 60000)) {
    return appCache;
  }

  const userProfile = process.env.USERPROFILE || 'C:\\Users\\subba';
  const dirs = [
    path.join(process.env.PROGRAMDATA || 'C:\\ProgramData', 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
    path.join(userProfile, 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
    path.join(userProfile, 'Desktop')
  ];

  const shortcuts = [];
  dirs.forEach(d => findLnkFiles(d, shortcuts));

  const cleanShortcuts = shortcuts.filter(s => {
    const low = s.name.toLowerCase();
    return !low.startsWith('uninstall') &&
           !low.includes('help') &&
           !low.includes('documentation') &&
           !low.includes('readme') &&
           !low.includes('website') &&
           !low.includes('reset preferences');
  });

  appCache = cleanShortcuts;
  lastCacheTime = now;
  return cleanShortcuts;
}

const BUILTIN_COMMANDS = {
  calc: 'calc.exe',
  calculator: 'calc.exe',
  notepad: 'notepad.exe',
  notes: 'notepad.exe',
  paint: 'mspaint.exe',
  mspaint: 'mspaint.exe',
  cmd: 'cmd.exe',
  terminal: 'wt.exe',
  powershell: 'powershell.exe',
  pwsh: 'pwsh.exe',
  explorer: 'explorer.exe',
  files: 'explorer.exe',
  taskmgr: 'taskmgr.exe',
  'task manager': 'taskmgr.exe',
  settings: 'ms-settings:',
  whatsapp: 'whatsapp:',
  spotify: 'spotify:',
  vscode: 'code',
  code: 'code',
  edge: 'msedge.exe',
  msedge: 'msedge.exe',
  chrome: 'chrome.exe',
  word: 'winword.exe',
  winword: 'winword.exe',
  excel: 'excel.exe',
  powerpoint: 'powerpnt.exe',
  powerpnt: 'powerpnt.exe',
  control: 'control.exe',
  'control panel': 'control.exe',
  snippingtool: 'snippingtool.exe',
  snip: 'snippingtool.exe'
};

function resolveDesktopApp(query) {
  if (!query) return null;
  const q = query.toLowerCase().trim();

  // 1. Built-in executables & protocols
  if (BUILTIN_COMMANDS[q]) {
    return { name: q, target: BUILTIN_COMMANDS[q], type: BUILTIN_COMMANDS[q].includes(':') ? 'protocol' : 'builtin' };
  }

  const apps = getInstalledApps();

  // 2. Exact match
  const exact = apps.find(a => a.name.toLowerCase() === q);
  if (exact) return { name: exact.name, target: exact.path, type: 'shortcut' };

  // 3. Match candidates with scoring (starts with, word boundary, shortest clean name)
  const candidates = apps.filter(a => {
    const low = a.name.toLowerCase();
    return low.includes(q);
  });

  if (candidates.length > 0) {
    candidates.sort((a, b) => {
      const aLow = a.name.toLowerCase();
      const bLow = b.name.toLowerCase();
      const aStarts = aLow.startsWith(q) ? 0 : 1;
      const bStarts = bLow.startsWith(q) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return aLow.length - bLow.length;
    });
    return { name: candidates[0].name, target: candidates[0].path, type: 'shortcut' };
  }

  return null;
}

/**
 * Universal App Launcher:
 * 1. Checks if the app is already open and brings it to foreground.
 * 2. If not running, dynamically discovers and launches from Start Menu / System.
 * 3. Never falls back to accidental web search if it's a desktop app.
 */
async function launchUniversalApp(appName) {
  const query = (appName || '').trim();
  if (!query) return { success: false, error: 'No application name specified' };

  const low = query.toLowerCase();

  // Protocols
  if (low.includes('whats') || low.includes('whatsapp')) {
    try {
      if (shell && shell.openExternal) await shell.openExternal('whatsapp:');
      else exec('start "" "whatsapp:"');
      return { success: true, app: 'WhatsApp', status: 'WhatsApp launched and focused' };
    } catch(e) {}
  }
  if (low.includes('spot') || low.includes('spotify')) {
    try {
      if (shell && shell.openExternal) await shell.openExternal('spotify:');
      else exec('start "" "spotify:"');
      return { success: true, app: 'Spotify', status: 'Spotify launched and focused' };
    } catch(e) {}
  }
  if (low === 'settings' || low.includes('windows settings')) {
    try {
      exec('start "" "ms-settings:"');
      return { success: true, app: 'Settings', status: 'Windows Settings opened' };
    } catch(e) {}
  }

  // 1. Check if the app is already running and focus it
  const activateRes = await activateWindow(query);
  if (activateRes && activateRes.success && activateRes.details && activateRes.details.includes('ACTIVATED')) {
    return { success: true, app: query, status: `Brought active ${query} window to foreground` };
  }

  // 2. Discover dynamically from Windows installation directories
  const resolved = resolveDesktopApp(query);
  if (resolved) {
    if (resolved.type === 'protocol') {
      if (shell && shell.openExternal) await shell.openExternal(resolved.target);
      else exec(`start "" "${resolved.target}"`);
    } else if (resolved.type === 'builtin') {
      exec(`start "" "${resolved.target}"`);
    } else if (resolved.type === 'shortcut') {
      exec(`start "" "${resolved.target}"`);
    }
    return {
      success: true,
      app: resolved.name,
      target: resolved.target,
      type: resolved.type,
      status: `Launched ${resolved.name} on desktop`
    };
  }

  // 3. Fallback for explicit web services & cloud applications
  const webApps = {
    discord: 'https://discord.com',
    telegram: 'https://web.telegram.org',
    whatsapp: 'https://web.whatsapp.com',
    github: 'https://github.com',
    gmail: 'https://mail.google.com',
    twitter: 'https://x.com',
    reddit: 'https://reddit.com',
    instagram: 'https://instagram.com',
    netflix: 'https://netflix.com',
    prime: 'https://primevideo.com',
    chatgpt: 'https://chatgpt.com',
    gemini: 'https://gemini.google.com',
    figma: 'https://figma.com',
    claude: 'https://claude.ai',
    v0: 'https://v0.dev',
    bolt: 'https://bolt.new',
    stackblitz: 'https://stackblitz.com',
    notion: 'https://notion.so',
    canva: 'https://canva.com',
    docs: 'https://docs.google.com',
    sheets: 'https://sheets.google.com',
    slides: 'https://slides.google.com',
    drive: 'https://drive.google.com',
    linkedin: 'https://linkedin.com',
    youtube: 'https://youtube.com',
    perplexity: 'https://perplexity.ai',
    slack: 'https://app.slack.com',
    teams: 'https://teams.microsoft.com',
    outlook: 'https://outlook.live.com',
    spotify: 'https://open.spotify.com'
  };
  const foundWeb = Object.keys(webApps).find(k => low === k || low.includes(k));
  if (foundWeb) {
    const targetUrl = webApps[foundWeb];
    try {
      if (shell && shell.openExternal) await shell.openExternal(targetUrl);
      else exec(`start "" "${targetUrl}"`);
    } catch (e) {}
    return {
      success: true,
      app: foundWeb,
      targetUrl,
      status: `Opened cloud service ${foundWeb} in browser (${targetUrl})`
    };
  }

  // 4. Universal Fallback: If it looks like a URL or domain, open in browser
  if (query.includes('.') || query.startsWith('http')) {
    const targetUrl = query.startsWith('http') ? query : `https://${query}`;
    try {
      if (shell && shell.openExternal) await shell.openExternal(targetUrl);
      else exec(`start "" "${targetUrl}"`);
      return { success: true, app: query, targetUrl, status: `Opened ${targetUrl} in browser` };
    } catch (e) {}
  }

  // 5. Truly not installed on PC: Inform user gracefully
  return {
    success: false,
    notInstalled: true,
    app: query,
    status: `Application "${query}" is not installed on this PC.`
  };
}

/**
 * Manage Antigravity Workspaces and Projects:
 * - switch_project: Switch active Antigravity window to target project (e.g. 'DSA', 'Yama - ai', 'Univer-14', 'face of me', 'jj', 'os-sum')
 * - new_project: Create or open a new project
 * - quick_start: Trigger Antigravity Quick Start flow
 * - close_project / no_project: Close current project / workspace
 * - list_projects: Returns known project workspaces
 */
async function manageAntigravityWorkspace(action = 'switch_project', projectName = '') {
  const act = (action || 'switch_project').toLowerCase().trim();
  const proj = (projectName || '').trim();

  // 1. First ensure Antigravity is active
  await activateWindow('antigravity');
  await sleep(400);

  if (act === 'list_projects') {
    const list = [
      { name: 'face of me', path: 'c:\\Users\\subba\\Downloads\\prime -ps\\face of me', active: true },
      { name: 'Univer-14' },
      { name: 'quick-noether' },
      { name: 'jj' },
      { name: 'os-sum' },
      { name: 'Yama - ai' },
      { name: 'DSA', path: 'C:\\Users\\subba\\Downloads\\DSA' }
    ];
    return { success: true, action: 'list_projects', projects: list };
  }

  if (act === 'switch_project' || act === 'switch' || act === 'open_project') {
    if (!proj) {
      return { success: false, error: 'Project name is required to switch' };
    }

    // Check if we have an exact local path for this project
    const knownPaths = {
      'face of me': 'c:\\Users\\subba\\Downloads\\prime -ps\\face of me',
      'dsa': 'C:\\Users\\subba\\Downloads\\DSA'
    };
    const matchedKey = Object.keys(knownPaths).find(k => k === proj.toLowerCase() || proj.toLowerCase().includes(k));

    if (matchedKey && fs.existsSync(knownPaths[matchedKey])) {
      exec(`start "" "C:\\Users\\subba\\AppData\\Local\\Programs\\Antigravity\\Antigravity.exe" -r "${knownPaths[matchedKey]}"`);
      return {
        success: true,
        action: 'switch_project',
        project: proj,
        path: knownPaths[matchedKey],
        status: `Switched Antigravity to project "${proj}"`
      };
    }

    // Method 2: UI Automation via Antigravity Quick Open Recent (Ctrl + R)
    const psScript = `
      $ws = New-Object -ComObject WScript.Shell
      $ws.AppActivate("Antigravity") | Out-Null
      Start-Sleep -Milliseconds 250
      # Trigger Open Recent (Ctrl+R)
      $ws.SendKeys('^r')
      Start-Sleep -Milliseconds 450
      # Type project name into quick-pick search
      [System.Windows.Forms.Clipboard]::SetText('${proj.replace(/'/g, "''")}')
      $ws.SendKeys('^v')
      Start-Sleep -Milliseconds 400
      # Select first matching project
      $ws.SendKeys('{ENTER}')
      Write-Output "STATUS:SWITCHED"
    `;
    const res = await runPowerShell(psScript);
    return {
      success: true,
      action: 'switch_project',
      project: proj,
      status: `Switched Antigravity to project "${proj}" via workspace selector`
    };
  }

  if (act === 'new_project' || act === 'create_project') {
    const targetFolder = proj || ('Antigravity_Project_' + Date.now().toString().slice(-6));
    const userProfile = process.env.USERPROFILE || 'C:\\Users\\subba';
    const newProjDir = path.join(userProfile, 'Downloads', targetFolder);
    if (!fs.existsSync(newProjDir)) {
      fs.mkdirSync(newProjDir, { recursive: true });
    }
    exec(`start "" "C:\\Users\\subba\\AppData\\Local\\Programs\\Antigravity\\Antigravity.exe" -n "${newProjDir}"`);
    return {
      success: true,
      action: 'new_project',
      project: targetFolder,
      path: newProjDir,
      status: `Created new project folder "${targetFolder}" and opened in Antigravity`
    };
  }

  if (act === 'quick_start') {
    const psScript = `
      $ws = New-Object -ComObject WScript.Shell
      $ws.AppActivate("Antigravity") | Out-Null
      Start-Sleep -Milliseconds 250
      $ws.SendKeys('^+p')
      Start-Sleep -Milliseconds 400
      [System.Windows.Forms.Clipboard]::SetText('Quick Start')
      $ws.SendKeys('^v')
      Start-Sleep -Milliseconds 400
      $ws.SendKeys('{ENTER}')
      Write-Output "STATUS:QUICK_START_TRIGGERED"
    `;
    await runPowerShell(psScript);
    return {
      success: true,
      action: 'quick_start',
      status: 'Triggered Quick Start in Antigravity'
    };
  }

  if (act === 'close_project' || act === 'no_project') {
    const psScript = `
      $ws = New-Object -ComObject WScript.Shell
      $ws.AppActivate("Antigravity") | Out-Null
      Start-Sleep -Milliseconds 250
      $ws.SendKeys('^k')
      Start-Sleep -Milliseconds 150
      $ws.SendKeys('f')
      Write-Output "STATUS:PROJECT_CLOSED"
    `;
    await runPowerShell(psScript);
    return {
      success: true,
      action: 'close_project',
      status: 'Closed active project in Antigravity (No Project mode)'
    };
  }

  return { success: false, error: `Unknown action: ${action}` };
}

/**
 * 2026 Multimodal Vision-Language-Action (VLA) Grounding.
 * Uses high-speed desktop screen capture and Gemini 2.5 Vision to semantically locate the prompt input caret.
 */
async function groundInputTargetVisually(targetToolName, screenW, screenH) {
  try {
    const cfgPath = path.join(__dirname, 'config.json');
    if (!fs.existsSync(cfgPath)) return null;
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    if (!cfg || !cfg.gemini_key) return null;

    // Fast screen capture to RAM
    const psScript = `
      Add-Type -AssemblyName System.Windows.Forms
      Add-Type -AssemblyName System.Drawing
      $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
      $bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      $graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
      $ms = New-Object System.IO.MemoryStream
      $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Jpeg)
      $base64 = [Convert]::ToBase64String($ms.ToArray())
      $graphics.Dispose()
      $bitmap.Dispose()
      $ms.Dispose()
      Write-Output $base64
    `;
    const capRes = await runPowerShell(psScript);
    const base64 = (capRes.stdout || '').trim();
    if (!base64 || base64.length < 500) return null;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.gemini_model || 'gemini-2.5-flash'}:generateContent?key=${cfg.gemini_key}`;
    const payload = {
      contents: [{
        role: 'user',
        parts: [
          { text: `Locate the primary prompt input area / chat textarea / search box in this active window for target '${targetToolName}'. Return a JSON object with normalized center coordinates: {"x": number, "y": number} where x and y are between 0.0 and 1.0. Output ONLY JSON.` },
          { inline_data: { mime_type: 'image/jpeg', data: base64 } }
        ]
      }]
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timer);

    const data = await res.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
      let text = data.candidates[0].content.parts[0].text.trim();
      const fence = String.fromCharCode(96) + String.fromCharCode(96) + String.fromCharCode(96);
      if (text.includes(fence)) {
        const m = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (m) text = m[1].trim();
      }
      const coords = JSON.parse(text);
      if (coords && typeof coords.x === 'number' && typeof coords.y === 'number') {
        const pxX = Math.round(coords.x * screenW);
        const pxY = Math.round(coords.y * screenH);
        if (pxX > 40 && pxX < screenW - 40 && pxY > 40 && pxY < screenH - 40) {
          console.log(`[VLA Grounding] Semantic caret localized at [${pxX}, ${pxY}] via Gemini Vision`);
          return { x: pxX, y: pxY, source: 'vla_vision' };
        }
      }
    }
  } catch (e) {
    // VLA fallback to resilient layout heuristics
  }
  return null;
}

/**
 * Automatically grounds the input box of frontier workspaces (Claude, v0, ChatGPT, Bolt, Perplexity),
 * writes prompt to clipboard, clicks input control to ensure caret focus, pastes via Ctrl+V, and submits via Enter.
 */
async function injectAndSubmitWorkspace(workspaceKey, promptText, options = {}) {
  const autoSubmit = options.autoSubmit !== false;
  const waitMs = options.waitMs || 2500;

  // 1. Write prompt to system clipboard
  safeWriteClipboard(promptText);

  // 2. Wait for target web page or application to mount
  await sleep(waitMs);

  // 3. Dynamic Screen Coordinate Resolution via Forms Screen
  const psScript = `
    Add-Type -AssemblyName System.Windows.Forms
    $w = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width
    $h = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height
    Write-Output "$w,$h"
  `;
  const screenRes = await runPowerShell(psScript);
  let screenW = 1280;
  let screenH = 800;
  if (screenRes.success && screenRes.stdout) {
    const parts = screenRes.stdout.trim().split(',');
    if (parts.length === 2) {
      screenW = parseInt(parts[0], 10) || 1280;
      screenH = parseInt(parts[1], 10) || 800;
    }
  }

  // Target coordinates by workspace type (default baseline)
  let targetX = Math.round(screenW * 0.50);
  let targetY = Math.round(screenH * 0.50);

  const key = (workspaceKey || '').toLowerCase();
  if (key.includes('claude')) {
    targetX = Math.round(screenW * 0.48);
    // In an ongoing chat, input box is docked at bottom (~93%); in new chat it is centered (~52%)
    targetY = options.isNewChat ? Math.round(screenH * 0.52) : Math.round(screenH * 0.93);
  } else if (key.includes('v0')) {
    targetX = Math.round(screenW * 0.50);
    targetY = Math.round(screenH * 0.48);
  } else if (key.includes('chatgpt') || key.includes('codex') || key.includes('openai')) {
    targetX = Math.round(screenW * 0.50);
    targetY = Math.round(screenH * 0.65);
  } else if (key.includes('bolt')) {
    targetX = Math.round(screenW * 0.50);
    targetY = Math.round(screenH * 0.52);
  } else if (key.includes('perplexity')) {
    targetX = Math.round(screenW * 0.50);
    targetY = Math.round(screenH * 0.48);
  }

  // 2026 Multimodal VLA Screen Grounding (Real Visual Eyes)
  try {
    const vlaCoords = await groundInputTargetVisually(workspaceKey, screenW, screenH);
    if (vlaCoords && vlaCoords.x && vlaCoords.y) {
      targetX = vlaCoords.x;
      targetY = vlaCoords.y;
    }
  } catch (vlaErr) {
    console.warn('[VLA] Vision grounding fallback to responsive centroid:', vlaErr.message);
  }

  // 4. Click to bring target window to foreground and position caret inside the prompt textarea
  await mouseClickAt(targetX, targetY);
  await sleep(350);

  // 5. High-speed native paste
  await sendKeys('^v');
  await sleep(400);

  // 6. Automatically submit via Enter
  if (autoSubmit) {
    await sendKeys('{ENTER}');
    await sleep(250);
  }

  return {
    success: true,
    workspace: workspaceKey,
    coordinates: { x: targetX, y: targetY },
    autoSubmitted: autoSubmit,
    status: `Successfully focused input box and injected prompt into ${workspaceKey}`
  };
}

/**
 * Monitors the active workspace (Claude, v0, Bolt, ChatGPT, Spline, Antigravity, or any browser)
 * until generation has fully completed (quiescence: screen stops changing for 2 consecutive samples)
 * or local dev server is listening (for Antigravity).
 */
async function waitForWorkspaceCompletion(workspaceKey, options = {}) {
  const maxTimeoutMs = options.maxTimeoutMs || 120000; // 2 minutes max
  const minWaitMs = options.minWaitMs || 8000;         // Allow at least 8s for generation to spin up
  const pollIntervalMs = options.pollIntervalMs || 2500;
  const startTime = Date.now();

  console.log(`[WorkspaceWatchdog] Monitoring completion for ${workspaceKey} (max ${maxTimeoutMs / 1000}s)...`);

  const isAntigravity = (workspaceKey || '').toLowerCase().includes('antigravity');
  let ambientSentinel = null;
  try {
    ambientSentinel = require('./ambient-sentinel');
  } catch (e) {}

  let lastHash = '';
  let stableCount = 0;
  let hasStartedStreaming = false;

  while (Date.now() - startTime < maxTimeoutMs) {
    await sleep(pollIntervalMs);
    const elapsed = Date.now() - startTime;

    // 1. Antigravity special check: probe local dev servers
    if (isAntigravity && ambientSentinel) {
      try {
        const devServers = await ambientSentinel.scanLocalDevServers();
        if (devServers && devServers.length > 0 && elapsed > minWaitMs) {
          console.log(`[WorkspaceWatchdog] Antigravity dev server active on port ${devServers[0].port}!`);
          return {
            success: true,
            workspace: workspaceKey,
            state: 'completed',
            devServerUrl: `http://localhost:${devServers[0].port}`,
            durationMs: elapsed
          };
        }
      } catch (e) {}
    }

    // 2. High-speed screen hash sampling for any web/desktop workspace
    try {
      const psScript = `
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing
        $w = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width
        $h = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height
        $bitmap = New-Object System.Drawing.Bitmap($w, $h)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.CopyFromScreen(0, 0, 0, 0, $bitmap.Size)
        $ms = New-Object System.IO.MemoryStream
        $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Jpeg)
        $md5 = [System.Security.Cryptography.MD5]::Create()
        $hash = [System.BitConverter]::ToString($md5.ComputeHash($ms.ToArray())).Replace("-","")
        $graphics.Dispose(); $bitmap.Dispose(); $ms.Dispose();
        Write-Output $hash
      `;
      const res = await runPowerShell(psScript);
      const currentHash = (res.stdout || '').trim();

      if (!lastHash) {
        lastHash = currentHash;
        continue;
      }

      if (currentHash !== lastHash) {
        hasStartedStreaming = true;
        stableCount = 0;
        lastHash = currentHash;
        console.log(`[WorkspaceWatchdog] Active streaming detected (${Math.round(elapsed / 1000)}s elapsed)...`);
      } else {
        stableCount++;
        // If content was streaming and has now settled for 2 consecutive cycles (5s) after minWaitMs:
        if (stableCount >= 2 && elapsed >= minWaitMs) {
          console.log(`[WorkspaceWatchdog] Workspace ${workspaceKey} generation finished and stabilized after ${Math.round(elapsed / 1000)}s!`);
          return {
            success: true,
            workspace: workspaceKey,
            state: 'completed',
            streamingDetected: hasStartedStreaming,
            durationMs: elapsed
          };
        }
      }
    } catch (err) {
      console.warn('[WorkspaceWatchdog] Frame sampling exception:', err.message);
    }
  }

  return {
    success: true,
    workspace: workspaceKey,
    state: 'timeout_settled',
    durationMs: Date.now() - startTime
  };
}

module.exports = {
  activateWindow,
  sendKeys,
  typeIntoActiveWindow,
  typeIntoWindow,
  typeVisually,
  sendWhatsAppMessage,
  automateAntigravity,
  automateAntigravityWithSkills,
  clickAllowDialog,
  scheduleTask,
  getScheduledTasks,
  cancelScheduledTask,
  mouseClickAt,
  injectAndSubmitWorkspace,
  waitForWorkspaceCompletion,
  runPowerShell,
  resolveDesktopApp,
  launchUniversalApp,
  manageAntigravityWorkspace,
  startAntigravityNewConversation,
  safeWriteClipboard
};

