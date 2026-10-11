const { runPowerShell } = require('../desktop-automator.js');

async function testScreenCapture() {
  console.log('Capturing screen frame via native PowerShell in RAM...');
  const t0 = Date.now();
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
  const duration = Date.now() - t0;
  console.log('Capture success:', res.success, 'Duration:', duration + 'ms', 'Base64 length:', res.stdout ? res.stdout.length : 0);
  if (!res.stdout || res.stdout.length < 500) throw new Error('Capture failed');
  console.log('✓ Fast Native Screen Capture verified!');
  process.exit(0);
}

testScreenCapture().catch(e => {
  console.error(e);
  process.exit(1);
});
