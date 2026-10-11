const { spawn } = require('child_process');

function test() {
  const ps = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', '-']);
  let out = '';
  let err = '';
  ps.stdout.on('data', d => out += d);
  ps.stderr.on('data', d => err += d);
  ps.on('close', code => {
    console.log('EXIT CODE:', code);
    console.log('OUTPUT:', out.trim());
    console.log('ERRORS:', err.trim());
  });

  const script = `
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.Clipboard]::SetText("FAANG-GRADE")
    $res = [System.Windows.Forms.Clipboard]::GetText()
    Write-Output "CLIPBOARD_VALUE: $res"
  `;
  ps.stdin.write(script);
  ps.stdin.end();
}

test();
