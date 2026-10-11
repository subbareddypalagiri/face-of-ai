// test-goal-engine.js — Automated Verification for UNIN SOTA Autonomous Goal Engine & Self-Healing
const goalEngine = require('../unin-goal-engine');
const path = require('path');
const fs = require('fs');

async function runTest() {
  console.log("=== STARTING UNIN AUTONOMOUS GOAL ENGINE VERIFICATION ===");

  goalEngine.on('progress', (p) => console.log(`[Goal Progress]: [${p.stage}] ${p.message}`));
  goalEngine.on('step_started', (s) => console.log(`>>> Step ${s.stepId}/${s.totalSteps}: ${s.title}`));
  goalEngine.on('step_succeeded', (s) => console.log(`    ✓ Succeeded: ${s.title}`));
  goalEngine.on('healing_attempt', (h) => console.warn(`    ⚠️ Healing attempt ${h.attempt}/${h.maxAttempts}: ${h.error}`));
  goalEngine.on('healing_succeeded', (h) => console.log(`    ★ Healing succeeded: ${h.message}`));
  goalEngine.on('goal_completed', (g) => console.log(`🏆 GOAL ACCOMPLISHED: ${g.statusMessage}`));

  const testGoal = "build mini express server with health check and verify with zero errors";
  const result = await goalEngine.runGoal(testGoal, { targetDir: 'scratch/unin-test-service' });

  console.log("\n=== EXECUTION SUMMARY ===");
  console.log("Success:", result.success);
  console.log("Total Steps:", result.totalSteps);
  console.log("Completed Steps:", result.completedStepsCount);
  console.log("Healed Count:", result.healedCount);
  console.log("Duration:", result.durationMs, "ms");

  if (!result.success || result.completedStepsCount < 4) {
    console.error("FAIL: Goal was not accomplished with zero errors!");
    process.exit(1);
  }

  // Correct path verification
  const srvPath = path.join(__dirname, 'unin-test-service', 'server.js');
  const pkgPath = path.join(__dirname, 'unin-test-service', 'package.json');

  if (!fs.existsSync(srvPath) || !fs.existsSync(pkgPath)) {
    console.error("FAIL: Scaffolded files do not exist at:", srvPath);
    process.exit(1);
  }

  console.log("✓ All scaffolded files verified on disk!");

  // Now verify Self-Healing directly: inject a deliberate syntax error into server.js and trigger validation
  console.log("\n=== TESTING DELIBERATE FAILURE & SELF-HEALING RECOVERY ===");
  fs.writeFileSync(srvPath, 'INVALID SYNTAX {{{ const foo =', 'utf8');

  const healingStep = {
    id: 99,
    title: 'Self-Healing Test: Auto-repair broken server.js',
    tool: 'run_terminal_command',
    params: {
      command: `node -c "${srvPath}"`,
      cwd: path.dirname(srvPath),
      filePath: srvPath
    },
    verification: { type: 'exit_code_zero' }
  };

  const initialRun = await goalEngine.executeStepTool(healingStep);
  const verifyFailure = goalEngine.verifyStepResult(healingStep, initialRun);

  if (!verifyFailure.passed) {
    console.log("✓ Step failed as expected (SyntaxError detected):", verifyFailure.reason);
    const healRes = await goalEngine.selfHealStep(healingStep, initialRun, verifyFailure, 1);
    if (healRes.healed) {
      console.log("★ SELF-HEALING ENGINE SUCCESSFULLY REPAIRED THE BROKEN CODE!");
      console.log(">>> UNIN AUTONOMOUS GOAL ENGINE & SELF-HEALING VERIFICATION PASSED 100%! <<<");
      process.exit(0);
    } else {
      console.error("FAIL: Self-healing did not repair the code!");
      process.exit(1);
    }
  } else {
    console.error("FAIL: Broken code unexpectedly passed syntax check!");
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error("FATAL TEST ERROR:", err);
  process.exit(1);
});
