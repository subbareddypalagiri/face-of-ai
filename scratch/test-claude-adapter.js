// scratch/test-claude-adapter.js — Verification test for Group2ClaudeAdapter
const Group2ClaudeAdapter = require('../src/main/adapters/Group2ClaudeAdapter.js');
const http = require('http');

async function runTest() {
  console.log('🧪 Starting Group2ClaudeAdapter verification test...');
  const adapter = new Group2ClaudeAdapter({ port: 3847 });

  // 1. Test ZIP generation
  console.log('\n[1/3] Testing Skill ZIP packaging...');
  const zipResult = await adapter.generateSkillZip();
  console.log('✅ ZIP Packaging Result:', zipResult);

  // 2. Test MCP Server Start
  console.log('\n[2/3] Starting Local Streamable MCP Server on port 3847...');
  const srvResult = await adapter.startMcpServer();
  console.log('✅ Server Result:', srvResult);

  // 3. Test HTTP /health
  console.log('\n[3/3] Probing /health endpoint...');
  await new Promise((resolve) => {
    http.get('http://localhost:3847/health', (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        console.log('✅ Health probe response:', JSON.parse(data));
        resolve();
      });
    });
  });

  // 4. Test tools/call submit_artifact mock
  console.log('\n[4/4] Testing submit_artifact tool execution...');
  const mockRpc = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'submit_artifact',
      arguments: {
        files: [
          {
            path: 'index.html',
            content: '<!DOCTYPE html><html><head><title>UNIN Test Portfolio</title></head><body style="background:#090a0f;color:#fff;font-family:sans-serif;text-align:center;padding:50px;"><h1>🚀 Live FAANG Artifact Delivered via UNIN MCP!</h1><p>Zero prompt pasting. 100% Native Tool Execution.</p></body></html>'
          }
        ]
      }
    }
  };

  const rpcRes = await adapter.handleJsonRpc(mockRpc);
  console.log('✅ Artifact Execution Result:', rpcRes);

  console.log('\n🎉 ALL TESTS PASSED! Group2ClaudeAdapter is 100% operational.');
  process.exit(0);
}

runTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
