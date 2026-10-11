// scratch/start-permanent-mcp-tunnel.js
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

async function main() {
  console.log('🚀 Spawning Cloudflare Quick Tunnel for UNIN MCP Server on port 3845...');

  const binPath = path.join(process.cwd(), 'bin', 'cloudflared.exe');
  if (!fs.existsSync(binPath)) {
    throw new Error('bin/cloudflared.exe not found!');
  }

  const tunnel = spawn(binPath, ['tunnel', '--url', 'http://localhost:3845'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });

  let tunnelUrl = null;
  let sseUrl = null;

  const urlRegex = /https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/g;

  function handleOutput(data) {
    const text = data.toString();
    const matches = text.match(urlRegex);
    if (matches && matches.length > 0 && !tunnelUrl) {
      tunnelUrl = matches[0];
      sseUrl = `${tunnelUrl}/mcp/sse`;

      console.log('\n================================================================');
      console.log('🎉 CLOUDFLARE MCP CONNECTOR IS LIVE (100% FREE)!');
      console.log('================================================================');
      console.log(`🌍 Base Tunnel URL: ${tunnelUrl}`);
      console.log(`🔌 Claude Connector URL: ${sseUrl}`);
      console.log('================================================================\n');

      // Auto-copy to Windows Clipboard
      exec(`powershell.exe -NoProfile -Command "Set-Clipboard -Value '${sseUrl}'"`, () => {
        console.log('📋 Connector SSE URL auto-copied to Windows Clipboard!');
      });

      // Reveal unin-skills.zip in Explorer
      const zipPath = path.join(process.cwd(), 'output', 'unin-skills.zip');
      if (fs.existsSync(zipPath)) {
        exec(`explorer.exe /select,"${zipPath}"`);
        console.log('📂 Highlighted unin-skills.zip in Windows Explorer!');
      }
    }
  }

  tunnel.stdout.on('data', handleOutput);
  tunnel.stderr.on('data', handleOutput);

  tunnel.on('close', code => {
    console.log(`Cloudflare tunnel process exited with code ${code}`);
  });

  // Keep process alive indefinitely
  setInterval(() => {}, 60000);
}

main().catch(console.error);
