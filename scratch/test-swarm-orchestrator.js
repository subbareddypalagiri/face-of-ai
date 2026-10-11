// test-swarm-orchestrator.js — Automated Verification for UNIN Multi-Agent Swarm Orchestrator
const swarmOrchestrator = require('../unin-swarm-orchestrator');
const path = require('path');
const fs = require('fs');

async function runSwarmTest() {
  console.log("=== STARTING UNIN MULTI-AGENT SWARM VERIFICATION ===");

  let reviewRoundsObserved = 0;
  let reviewerRejections = 0;
  let reviewerApprovals = 0;

  swarmOrchestrator.on('swarm_started', (s) => console.log(`[Swarm Orchestrator]: Started swarm task: "${s.task}"`));
  swarmOrchestrator.on('agent_active', (a) => console.log(`>>> [${a.role} Agent Active]: ${a.action}`));
  swarmOrchestrator.on('agent_thought', (t) => console.log(`    💭 ${t.role}: "${t.thought}"`));
  
  swarmOrchestrator.on('review_round', (r) => {
    reviewRoundsObserved++;
    if (r.approved) {
      reviewerApprovals++;
      console.log(`    🛡️ Reviewer Round ${r.round}: APPROVED!`);
    } else {
      reviewerRejections++;
      console.warn(`    ⚠️ Reviewer Round ${r.round}: REJECTED! Found ${r.issuesCount} issue(s):`, r.issues.map(i => i.message));
    }
  });

  swarmOrchestrator.on('consensus_achieved', (c) => console.log(`🏆 SWARM CONSENSUS ACHIEVED: ${c.statusMessage}`));

  const task = "build a secure token authentication module with adversarial review";
  const result = await swarmOrchestrator.executeSwarmTask(task, { targetDir: 'scratch/unin-swarm-test' });

  console.log("\n=== SWARM EXECUTION SUMMARY ===");
  console.log("Success:", result.success);
  console.log("Consensus Achieved:", result.consensusAchieved);
  console.log("Total Review Rounds:", result.totalReviewRounds);
  console.log("Target File:", result.targetFile);
  console.log("Duration:", result.durationMs, "ms");
  console.log("Agents Participated:", result.agentsParticipated);

  if (!result.success || !result.consensusAchieved) {
    console.error("FAIL: Swarm did not reach consensus!");
    process.exit(1);
  }

  if (reviewerRejections !== 1 || reviewerApprovals !== 1) {
    console.error(`FAIL: Expected 1 rejection and 1 approval, but got ${reviewerRejections} rejections and ${reviewerApprovals} approvals!`);
    process.exit(1);
  }

  // Verify code on disk has crypto and no Math.random
  const generatedFile = path.join(__dirname, 'unin-swarm-test', 'secure-token-auth.js');
  if (!fs.existsSync(generatedFile)) {
    console.error("FAIL: Generated file does not exist on disk:", generatedFile);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(generatedFile, 'utf8');
  if (fileContent.includes('Math.random')) {
    console.error("FAIL: Insecure Math.random still exists in final code!");
    process.exit(1);
  }

  if (!fileContent.includes('crypto.randomBytes')) {
    console.error("FAIL: crypto.randomBytes not found in final code!");
    process.exit(1);
  }

  console.log("✓ Final code verified: 100% hardened with crypto.randomBytes!");
  console.log(">>> UNIN MULTI-AGENT SWARM ORCHESTRATION VERIFICATION PASSED 100%! <<<");
}

runSwarmTest().catch((err) => {
  console.error("FATAL SWARM TEST ERROR:", err);
  process.exit(1);
});
