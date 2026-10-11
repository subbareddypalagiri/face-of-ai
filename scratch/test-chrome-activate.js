const { runPowerShell } = require('../desktop-automator.js');

async function test() {
  const ps = `
    $ws = New-Object -ComObject WScript.Shell
    $res = $ws.AppActivate('Google Chrome')
    Write-Output "APP_ACTIVATE_CHROME:$res"
    $res2 = $ws.AppActivate('Claude')
    Write-Output "APP_ACTIVATE_CLAUDE:$res2"
  `;
  const res = await runPowerShell(ps);
  console.log('Result:', res);
  process.exit(0);
}

test();
