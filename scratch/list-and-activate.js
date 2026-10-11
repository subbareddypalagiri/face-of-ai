// scratch/list-and-activate.js
const { execSync } = require('child_process');

try {
  const ps = `
Add-Type @"
  using System;
  using System.Runtime.InteropServices;
  public class WinAct {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  }
"@
Get-Process | Where-Object { $_.MainWindowTitle -ne '' } | ForEach-Object {
  Write-Output "$($_.Id)|$($_.ProcessName)|$($_.MainWindowTitle)"
}
`;
  const out = execSync(`powershell -NoProfile -Command "${ps.replace(/\r?\n/g, ' ')}"`).toString();
  console.log('Open Windows:');
  out.split('\n').filter(Boolean).forEach(l => console.log(' - ' + l.trim()));
} catch (e) {
  console.error(e);
}
