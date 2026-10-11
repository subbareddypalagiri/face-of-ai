const path = require('path');
const { exec } = require('child_process');

function runPowerShell(script) {
  return new Promise((resolve) => {
    const fullScript = `$ProgressPreference = 'SilentlyContinue'\n` + script;
    const encoded = Buffer.from(fullScript, 'utf16le').toString('base64');
    exec(`powershell.exe -NoProfile -NonInteractive -EncodedCommand ${encoded}`, { timeout: 15000 }, (err, stdout, stderr) => {
      resolve({
        success: !err,
        stdout: (stdout || '').trim(),
        stderr: (stderr || '').trim(),
        error: err ? err.message : null
      });
    });
  });
}

const dllPath = path.join(__dirname, '..', 'FocusBot.dll').replace(/'/g, "''");
const targetContact = 'Nikki';
const cleanMessage = 'Hi!';
const autoSend = true;

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
        Write-Output "CHECK $check Title: $activeTitle Proc: $activeProc"
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

    Write-Output "isWhatsAppActive: $isWhatsAppActive"

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

    # Step 1: Dismiss any active in-chat search or dialogs and open New Chat selector
    $ws.SendKeys('{ESC}{ESC}')
    Start-Sleep -Milliseconds 200
    $ws.SendKeys('^n')
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

runPowerShell(singlePipelineScript).then(res => {
  console.log('STDOUT:\n', res.stdout);
  console.log('STDERR:\n', res.stderr);
  console.log('ERROR:\n', res.error);
});
