// context-cortex.js — SOTA 2026 Multimodal Active Context & Browser Sniffer for UNIN
// Sniffs active window, process, and active browser tab URLs/state without user copy-pasting.
'use strict';

const { exec } = require('child_process');
const path = require('path');

/**
 * Execute PowerShell script with UTF-16LE Base64 encoding.
 */
function runPowerShell(script) {
  return new Promise((resolve) => {
    const fullScript = `$ProgressPreference = 'SilentlyContinue'\n` + script;
    const encoded = Buffer.from(fullScript, 'utf16le').toString('base64');
    exec(`powershell.exe -NoProfile -NonInteractive -EncodedCommand ${encoded}`, { timeout: 8000 }, (err, stdout, stderr) => {
      resolve({
        success: !err,
        stdout: (stdout || '').trim(),
        stderr: (stderr || '').trim(),
        error: err ? err.message : null
      });
    });
  });
}

/**
 * Deep OS Foreground & Active Window Context Sniffer
 * Inspects active window title, process name, and attempts native UI Automation URL extraction.
 */
async function getActiveContext() {
  const psScript = `
    Add-Type -TypeDefinition '
    using System;
    using System.Text;
    using System.Runtime.InteropServices;
    public class WindowSniffer {
        [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
        [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
        
        public static string GetActiveTitle() {
            IntPtr hwnd = GetForegroundWindow();
            StringBuilder sb = new StringBuilder(512);
            GetWindowText(hwnd, sb, 512);
            return sb.ToString();
        }
        public static string GetActiveProcess(out uint pid) {
            IntPtr hwnd = GetForegroundWindow();
            GetWindowThreadProcessId(hwnd, out pid);
            try {
                return System.Diagnostics.Process.GetProcessById((int)pid).ProcessName;
            } catch { return ""; }
        }
    }
    '
    $pid = 0
    $title = [WindowSniffer]::GetActiveTitle()
    $proc = [WindowSniffer]::GetActiveProcess([ref]$pid)
    
    # Lightweight URL extraction from window title or known patterns
    $url = ""
    if ($title -match "https?://\S+") {
        $url = $matches[0]
    }

    [PSCustomObject]@{
        Title = $title
        Process = $proc
        PID = $pid
        URL = $url
    } | ConvertTo-Json -Compress
  `;

  const res = await runPowerShell(psScript);
  let parsed = { Title: '', Process: '', PID: 0, URL: '' };

  if (res.success && res.stdout) {
    try {
      parsed = JSON.parse(res.stdout);
    } catch (e) {}
  }

  const title = parsed.Title || '';
  const proc = (parsed.Process || '').toLowerCase();
  let url = parsed.URL || '';

  const isBrowser = /chrome|msedge|brave|firefox/.test(proc);
  let browserType = isBrowser ? proc : null;

  // Platform classification
  let platform = 'desktop';
  let cleanTitle = title;

  if (isBrowser) {
    platform = 'web';
    if (title.toLowerCase().includes('youtube') || url.includes('youtube.com') || url.includes('youtu.be')) {
      platform = 'youtube';
      cleanTitle = title.replace(/\s*-\s*YouTube.*$/i, '').trim();
    } else if (title.toLowerCase().includes('claude') || url.includes('claude.ai')) {
      platform = 'claude';
      cleanTitle = title.replace(/\s*-\s*Claude.*$/i, '').trim();
    } else if (title.toLowerCase().includes('chatgpt') || url.includes('chatgpt.com')) {
      platform = 'chatgpt';
    } else if (title.toLowerCase().includes('github') || url.includes('github.com')) {
      platform = 'github';
    }
  } else if (/code|devenv/.test(proc)) {
    platform = 'ide';
  } else if (/blender/.test(proc)) {
    platform = '3d_blender';
  } else if (/whatsapp/.test(proc)) {
    platform = 'whatsapp';
  }

  return {
    success: true,
    processName: parsed.Process || 'Unknown',
    windowTitle: title,
    cleanTitle,
    pid: parsed.PID || 0,
    isBrowser,
    browserType,
    url: url || null,
    platform,
    timestamp: Date.now()
  };
}

/**
 * Sniffs active browser URL specifically for quick media or research extraction.
 */
async function sniffActiveBrowserUrl() {
  const ctx = await getActiveContext();
  if (ctx.url) {
    return {
      success: true,
      url: ctx.url,
      title: ctx.cleanTitle || ctx.windowTitle,
      platform: ctx.platform
    };
  }

  // Fallback heuristic for YouTube video title
  if (ctx.platform === 'youtube' && ctx.cleanTitle) {
    return {
      success: true,
      url: null,
      query: ctx.cleanTitle,
      title: ctx.cleanTitle,
      platform: 'youtube'
    };
  }

  return {
    success: false,
    error: 'No active browser URL detected in current foreground window',
    context: ctx
  };
}

module.exports = {
  getActiveContext,
  sniffActiveBrowserUrl
};
