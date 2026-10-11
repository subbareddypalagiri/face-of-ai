const fs = require('fs');
const path = require('path');
const { runPowerShell } = require('../desktop-automator.js');

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));

async function testVla() {
  console.log('1. Capturing active screen...');
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
  const base64 = capRes.stdout.trim();
  console.log('Screen captured, size:', base64.length);

  console.log('2. Querying Gemini 2.5 Vision for VLA Grounding...');
  const apiKey = cfg.gemini_key;
  const model = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{
      role: 'user',
      parts: [
        { text: 'Analyze this desktop screen. Locate the primary prompt input area, chat text box, or search field in the active window. Return a STRICT JSON object with normalized coordinates between 0 and 1: {"x": number, "y": number, "description": string}. Return ONLY JSON.' },
        { inline_data: { mime_type: 'image/jpeg', data: base64 } }
      ]
    }]
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  const text = data.candidates[0].content.parts[0].text;
  console.log('Gemini VLA Grounding result:\n', text);
  process.exit(0);
}

testVla().catch(e => {
  console.error(e);
  process.exit(1);
});
