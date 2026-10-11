// scratch/run-option-a.js — Executes Option A (Auto-Setup CDP Skill Upload)
const Group2ClaudeAdapter = require('../src/main/adapters/Group2ClaudeAdapter.js');

async function main() {
  console.log('🚀 Triggering Option A: Autonomous CDP Skill Upload to Claude.ai...');
  const adapter = new Group2ClaudeAdapter();

  const res = await adapter.autoUploadSkillToClaude();
  console.log('\n✅ Option A Result:', res);
}

main().catch(err => {
  console.error('❌ Option A Error:', err);
  process.exit(1);
});
