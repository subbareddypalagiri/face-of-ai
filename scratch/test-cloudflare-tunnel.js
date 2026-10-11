// scratch/test-cloudflare-tunnel.js — Verification test for Cloudflare Tunnel on Group2ClaudeAdapter
const Group2ClaudeAdapter = require('../src/main/adapters/Group2ClaudeAdapter.js');

async function testTunnel() {
  console.log('🧪 Starting Cloudflare Tunnel live verification...');
  const adapter = new Group2ClaudeAdapter({ port: 3848 });

  // 1. Start local server
  console.log('[1/2] Starting local MCP server on port 3848...');
  await adapter.startMcpServer();

  // 2. Start Cloudflare Tunnel
  console.log('[2/2] Spawning Cloudflare Quick Tunnel (zero account, free HTTPS)...');
  const tunnelRes = await adapter.startCloudflareTunnel();
  console.log('✅ Tunnel Result:', tunnelRes);

  if (tunnelRes.success) {
    console.log(`\n🎉 VERIFICATION SUCCESSFUL!`);
    console.log(`🌍 Public Tunnel URL: ${tunnelRes.tunnelUrl}`);
    console.log(`🔌 Claude Connector SSE URL: ${tunnelRes.sseUrl}`);
  } else {
    console.error('❌ Tunnel failed:', tunnelRes.error);
  }

  // Clean up
  adapter.stopCloudflareTunnel();
  process.exit(tunnelRes.success ? 0 : 1);
}

testTunnel().catch(err => {
  console.error('❌ Test crashed:', err);
  process.exit(1);
});
