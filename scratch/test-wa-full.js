const { spawn } = require('child_process');
const path = require('path');

function runPowerShell(script) {
  return new Promise((resolve) => {
    const fullScript = `$ProgressPreference = 'SilentlyContinue'\n` + script;
    const ps = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', '-']);
    let stdout = '';
    let stderr = '';
    let timer = setTimeout(() => {
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

const dllPath = path.join(__dirname, '..', 'FocusBot.dll').replace(/'/g, "''");
const targetContact = 'Nikki';
const cleanMessage = 'Hi!';
const autoSend = true;

const script = `
    Add-Type -Path '${dllPath}'
    Add-Type -AssemblyName System.Windows.Forms
    $ws = New-Object -ComObject WScript.Shell

    Start-Sleep -Milliseconds 450

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

    # Step 1: Click directly inside WhatsApp search box (x: 180, y: 92)
    # This simultaneously forces WhatsApp to foreground AND focuses the search input!
    try {
        [AuraBot.FocusBot]::Click(180, 92)
    } catch {
        Write-Output "FocusBot click error: $_"
    }
    Start-Sleep -Milliseconds 250

    # Step 2: Ensure search box is 100% focused and wipe previous query
    $ws.SendKeys('^f^a{BS}')
    Start-Sleep -Milliseconds 150

    # Step 3: Paste contact name safely into search input
    Set-SafeClipboard '${targetContact.replace(/'/g, "''")}'
    $ws.SendKeys('^v')
    Start-Sleep -Milliseconds 1000

    # Step 4: Open the top contact result (groups excluded by direct query)
    $ws.SendKeys('{ENTER}')
    Start-Sleep -Milliseconds 800

    # Step 5: Live visual streaming of message into chat input box (70ms word delay)
    $words = '${cleanMessage.replace(/'/g, "''")}'.Split(' ')
    for ($i = 0; $i -lt $words.Length; $i++) {
        $word = $words[$i]
        if ($i -gt 0) { $word = ' ' + $word }
        Set-SafeClipboard $word
        $ws.SendKeys('^v')
        Start-Sleep -Milliseconds 70
    }

    # Step 6: Dispatch if autoSend enabled
    ${autoSend ? `
    Start-Sleep -Milliseconds 500
    $ws.SendKeys('{ENTER}')
    Write-Output "STATUS:DISPATCHED"
    ` : `
    Write-Output "STATUS:DRAFTED"
    `}
`;

runPowerShell(script).then(res => {
  console.log('SUCCESS:', res.success);
  console.log('STDOUT:\n', res.stdout);
  console.log('STDERR:\n', res.stderr);
  console.log('ERROR:\n', res.error);
});
