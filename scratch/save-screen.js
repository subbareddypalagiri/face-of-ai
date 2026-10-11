// scratch/save-screen.js
const { runPowerShell } = require('../desktop-automator.js');
const fs = require('fs');
const path = require('path');

async function main() {
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
  const res = await runPowerShell(psScript);
  if (res.stdout && res.stdout.length > 500) {
    const buf = Buffer.from(res.stdout.trim(), 'base64');
    const outPath = path.join(__dirname, 'screen.jpg');
    fs.writeFileSync(outPath, buf);
    console.log('Saved screenshot to:', outPath);
  } else {
    console.error('Failed to capture screen');
  }
}

main().catch(console.error);
