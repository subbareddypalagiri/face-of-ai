const { runPowerShell } = require('../desktop-automator.js');

async function getScreenHash() {
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
    $len = $ms.Length
    $graphics.Dispose()
    $bitmap.Dispose()
    $ms.Dispose()
    Write-Output "$len,$hash"
  `;
  const t0 = Date.now();
  const res = await runPowerShell(psScript);
  const dt = Date.now() - t0;
  return { dt, output: (res.stdout || '').trim() };
}

(async () => {
  console.log('Testing Screen Hash...');
  const h1 = await getScreenHash();
  console.log('Frame 1:', h1);
  const h2 = await getScreenHash();
  console.log('Frame 2:', h2);
})();
