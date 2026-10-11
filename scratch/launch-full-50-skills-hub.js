// scratch/launch-full-50-skills-hub.js
const Group2ClaudeAdapter = require('../src/main/adapters/Group2ClaudeAdapter.js');

async function main() {
  console.log('🚀 Initializing UNIN Complete 50-Skills Hub & Cloudflare Tunnel...');
  const adapter = new Group2ClaudeAdapter();

  // 1. Generate full 50-skills package
  console.log('Step 1: Generating unin-skills.zip with all 50 skills...');
  const zipRes = await adapter.generateSkillZip();
  console.log('✅ ZIP Generated:', zipRes);

  // 2. Start local MCP Server on port 3845
  console.log('Step 2: Starting local MCP Server (port 3845)...');
  const serverRes = await adapter.startMcpServer();
  console.log('✅ Local MCP Server running:', serverRes);

  // 3. Start Cloudflare Tunnel for public HTTPS access
  console.log('Step 3: Spinning up Cloudflare Quick Tunnel...');
  const tunnelRes = await adapter.startCloudflareTunnel();
  console.log('✅ Cloudflare Tunnel Live:', tunnelRes);

  // 4. Reveal ZIP in Explorer
  adapter.revealZipInExplorer();

  console.log('\n================================================================');
  console.log('🎉 50-SKILLS MASTER PACKAGE & MCP CONNECTOR READY!');
  console.log('================================================================');
  console.log(`📁 Skills ZIP File: ${zipRes.zipPath}`);
  console.log(`🔗 Claude Connector URL (SSE): ${tunnelRes.sseUrl}`);
  console.log('================================================================\n');

  // Keep alive so tunnel stays running
  setInterval(() => {}, 60000);
}

main().catch(err => {
  console.error('❌ Error in 50-Skills Hub:', err);
  process.exit(1);
});
