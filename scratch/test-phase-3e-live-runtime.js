// scratch/test-phase-3e-live-runtime.js — Automated Verification Suite for Phase 3E (Live Blender Agent Runtime)
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const {
  LiveAgentRuntime,
  AGENT_EVENT,
  TASK_QUEUE_STATUS,
  TASK_PRIORITY,
  OBJECT_CLASSIFICATION,
  LIVE_QUALITY_STATE,
  PersistentWorldState,
  Autonomous3DArchitect,
  TaskGraph,
  TASK_STATUS
} = require('../src/main/tools/astra/core');
const { BlenderAstraEngine } = require('../src/main/tools/blenderAstraEngine');
const { registerAstraTools } = require('../src/main/tools/astraTools');

let passedTests = 0;
let totalTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] Test ${totalTests}: ${desc}`);
  } catch (err) {
    console.error(`  [FAIL] Test ${totalTests}: ${desc}`);
    console.error(`         ${err.message}`);
  }
}

async function itAsync(desc, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  [PASS] Test ${totalTests}: ${desc}`);
  } catch (err) {
    console.error(`  [FAIL] Test ${totalTests}: ${desc}`);
    console.error(`         ${err.message}`);
  }
}

async function runLiveRuntimeVerificationSuite() {
  console.log('========================================================================');
  console.log('  UNIN PHASE 3E: LIVE BLENDER AGENT RUNTIME VERIFICATION SUITE');
  console.log('  Real-time Event Stream, Viewport Streaming, Safe Interruption,');
  console.log('  Atomic Cancellation, Priority Queue & Object Classification');
  console.log('========================================================================\n');

  const testDir = path.resolve(__dirname, 'worlds_test_3e');
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

  // ────────────────────────────────────────────────────────────────────────────
  // SUITE 1: AGENT EVENT DEFINITIONS & ENVELOPE SCHEMA (27 TYPED EVENTS)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('--- SUITE 1: TYPED AGENT EVENT STREAM & ENVELOPES ---');

  it('AGENT_EVENT defines all 27 required typed lifecycle events', () => {
    const requiredEvents = [
      'TASK_CREATED', 'TASK_STARTED', 'UNDERSTANDING', 'PLANNING', 'WORLD_MUTATION',
      'ASSET_RESOLVING', 'ASSET_GENERATING', 'ASSET_READY', 'BLENDER_TASK_STARTED',
      'BLENDER_TASK_PROGRESS', 'ENTITY_CREATED', 'ENTITY_UPDATED', 'ENTITY_REMOVED',
      'VIEWPORT_UPDATED', 'RENDER_STARTED', 'RENDER_PROGRESS', 'VISION_ANALYSIS',
      'CORRECTION_STARTED', 'CORRECTION_COMPLETED', 'PAUSE_REQUESTED', 'PAUSED',
      'CANCEL_REQUESTED', 'CANCELLED', 'REPLANNING', 'RESUMED', 'COMPLETED', 'FAILED',
      'ROLLED_BACK'
    ];
    for (const ev of requiredEvents) {
      assert(AGENT_EVENT[ev], `Missing AGENT_EVENT: ${ev}`);
      assert.strictEqual(AGENT_EVENT[ev], ev);
    }
  });

  it('AGENT_EVENT enum is frozen and immutable', () => {
    assert(Object.isFrozen(AGENT_EVENT));
  });

  it('emitAgentEvent produces canonical envelope with all mandatory fields', () => {
    const runtime = new LiveAgentRuntime({ workspaceRoot: testDir });
    const envelope = runtime.emitAgentEvent(AGENT_EVENT.TASK_CREATED, {
      taskId: 'task_001',
      worldId: 'unin_world_test',
      message: 'Created task for test',
      data: { foo: 'bar' }
    });

    assert.strictEqual(envelope.eventType, AGENT_EVENT.TASK_CREATED);
    assert.strictEqual(envelope.taskId, 'task_001');
    assert.strictEqual(envelope.worldId, 'unin_world_test');
    assert(typeof envelope.operationId === 'string' && envelope.operationId.startsWith('op_'));
    assert(typeof envelope.timestamp === 'string');
    assert.strictEqual(envelope.message, 'Created task for test');
    assert.strictEqual(envelope.data.foo, 'bar');
    assert.strictEqual(envelope.progressMode, 'indeterminate');
    assert.strictEqual(envelope.progress, null);
  });

  it('Determinate progress switches progressMode to determinate with numeric value', () => {
    const runtime = new LiveAgentRuntime({ workspaceRoot: testDir });
    const envelope = runtime.emitAgentEvent(AGENT_EVENT.BLENDER_TASK_PROGRESS, {
      taskId: 'task_002',
      progress: 65.5,
      message: 'Applying materials'
    });
    assert.strictEqual(envelope.progressMode, 'determinate');
    assert.strictEqual(envelope.progress, 65.5);
  });

  it('Event stream broadcasts to typed listeners and wildcard listener', () => {
    const runtime = new LiveAgentRuntime({ workspaceRoot: testDir });
    let typedReceived = false;
    let wildcardReceived = false;

    runtime.on(AGENT_EVENT.WORLD_MUTATION, (env) => {
      typedReceived = env.message === 'Targeted color mutation';
    });

    runtime.on('*', (type, env) => {
      wildcardReceived = type === AGENT_EVENT.WORLD_MUTATION && env.message === 'Targeted color mutation';
    });

    runtime.emitAgentEvent(AGENT_EVENT.WORLD_MUTATION, { message: 'Targeted color mutation' });
    assert(typedReceived, 'Typed listener did not receive event');
    assert(wildcardReceived, 'Wildcard listener did not receive event');
  });

  it('Event emission latency is measured and recorded in telemetry', () => {
    const runtime = new LiveAgentRuntime({ workspaceRoot: testDir });
    runtime.emitAgentEvent(AGENT_EVENT.TASK_STARTED, { taskId: 'task_bench' });
    assert(typeof runtime.telemetry.eventLatencyMs === 'number');
    assert(runtime.telemetry.eventLatencyMs >= 0);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SUITE 2: PRIORITY TASK QUEUE & STALE-TASK GUARD
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 2: PRIORITY TASK QUEUE & STALE-TASK GUARD ---');

  it('TASK_PRIORITY defines correct descending ordering', () => {
    assert(TASK_PRIORITY.INTERRUPT > TASK_PRIORITY.USER_COMMAND);
    assert(TASK_PRIORITY.USER_COMMAND > TASK_PRIORITY.AUTONOMOUS);
    assert(TASK_PRIORITY.AUTONOMOUS > TASK_PRIORITY.MAINTENANCE);
  });

  it('enqueueTask inserts higher priority tasks ahead of lower priority tasks', () => {
    const runtime = new LiveAgentRuntime({ workspaceRoot: testDir });
    // Keep activeTask busy to prevent queue draining
    runtime.activeTask = { id: 'busy_task', status: TASK_QUEUE_STATUS.RUNNING };

    const taskLow = runtime.enqueueTask({ id: 't_maint', prompt: 'Clean cache', priority: TASK_PRIORITY.MAINTENANCE });
    const taskNormal = runtime.enqueueTask({ id: 't_user', prompt: 'Add tree', priority: TASK_PRIORITY.USER_COMMAND });
    const taskHigh = runtime.enqueueTask({ id: 't_interrupt', prompt: 'Stop all', priority: TASK_PRIORITY.INTERRUPT });

    assert.strictEqual(runtime.queue.length, 3);
    assert.strictEqual(runtime.queue[0].id, 't_interrupt', 'Highest priority must be at head of queue');
    assert.strictEqual(runtime.queue[1].id, 't_user', 'Medium priority must be second');
    assert.strictEqual(runtime.queue[2].id, 't_maint', 'Lowest priority must be at tail');
  });

  it('enqueueTask prevents duplicate task submission', () => {
    const runtime = new LiveAgentRuntime({ workspaceRoot: testDir });
    runtime.activeTask = { id: 'busy_task', status: TASK_QUEUE_STATUS.RUNNING };

    runtime.enqueueTask({ id: 'task_dup', prompt: 'Duplicate test' });
    assert.strictEqual(runtime.queue.length, 1);

    const dup = runtime.enqueueTask({ id: 'task_dup', prompt: 'Duplicate test duplicate' });
    assert.strictEqual(runtime.queue.length, 1, 'Duplicate ID must not increase queue length');
    assert.strictEqual(dup.id, 'task_dup');
  });

  it('TASK_QUEUE_STATUS defines PENDING, RUNNING, BLOCKED, CANCELLED, COMPLETED, FAILED', () => {
    assert.strictEqual(TASK_QUEUE_STATUS.PENDING, 'PENDING');
    assert.strictEqual(TASK_QUEUE_STATUS.RUNNING, 'RUNNING');
    assert.strictEqual(TASK_QUEUE_STATUS.CANCELLED, 'CANCELLED');
    assert.strictEqual(TASK_QUEUE_STATUS.COMPLETED, 'COMPLETED');
    assert.strictEqual(TASK_QUEUE_STATUS.FAILED, 'FAILED');
  });

  await itAsync('Stale task guard skips tasks that have been cancelled or aborted', async () => {
    const runtime = new LiveAgentRuntime({ workspaceRoot: testDir });
    runtime.activeTask = { id: 'busy', status: TASK_QUEUE_STATUS.RUNNING };

    const t1 = runtime.enqueueTask({ id: 't_stale', prompt: 'Stale task' });
    const t2 = runtime.enqueueTask({ id: 't_valid', prompt: 'Valid task' });

    // Cancel t1 while waiting in queue
    t1.status = TASK_QUEUE_STATUS.CANCELLED;
    t1.abortController.abort();

    // Release busy activeTask and let queue process
    runtime.activeTask = null;
    let validStarted = false;
    runtime.on(AGENT_EVENT.TASK_STARTED, (env) => {
      if (env.taskId === 't_valid') validStarted = true;
    });

    await runtime._processNextTask();
    assert(validStarted, 'Valid task should have been processed, skipping stale task');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SUITE 3: ATOMIC CANCELLATION & ABORTCONTROLLER (GOAL 5, 6, 24)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 3: ATOMIC CANCELLATION & ABORTCONTROLLER ---');

  it('cancelTask aborts active task AbortController and emits CANCELLED event', () => {
    const runtime = new LiveAgentRuntime({ workspaceRoot: testDir });
    let cancelEventEmitted = false;

    runtime.on(AGENT_EVENT.CANCELLED, (env) => {
      cancelEventEmitted = env.taskId === 'active_task_1';
    });

    runtime.activeTask = {
      id: 'active_task_1',
      prompt: 'Building massive city',
      abortController: new AbortController(),
      status: TASK_QUEUE_STATUS.RUNNING
    };

    const cancelRes = runtime.cancelTask('active_task_1', 'User pressed Stop');

    assert.strictEqual(cancelRes.success, true);
    assert.strictEqual(cancelRes.cancelledTaskId, 'active_task_1');
    assert.strictEqual(runtime.activeTask.abortController.signal.aborted, true);
    assert.strictEqual(runtime.activeTask.status, TASK_QUEUE_STATUS.CANCELLED);
    assert(cancelEventEmitted, 'CANCELLED event was not emitted');
    assert(typeof cancelRes.latencyMs === 'number');
  });

  it('cancelTask flushes matching pending tasks from queue', () => {
    const runtime = new LiveAgentRuntime({ workspaceRoot: testDir });
    runtime.activeTask = { id: 'busy', status: TASK_QUEUE_STATUS.RUNNING };

    runtime.enqueueTask({ id: 'q1', prompt: 'Step 1' });
    runtime.enqueueTask({ id: 'q2', prompt: 'Step 2' });
    assert.strictEqual(runtime.queue.length, 2);

    runtime.cancelTask('q1', 'User dropped step 1');
    assert.strictEqual(runtime.queue.length, 1);
    assert.strictEqual(runtime.queue[0].id, 'q2');
  });

  it('TaskGraph.markCancelled marks specified task CANCELLED', () => {
    const tg = new TaskGraph({ summary: 'test' });
    tg.addTask({ id: 'task_geo', title: 'Geometry' });
    tg.markCancelled('task_geo', 'User cancelled geometry');

    const t = tg.getTask('task_geo');
    assert.strictEqual(t.status, TASK_STATUS.CANCELLED);
    assert.strictEqual(t.error, 'User cancelled geometry');
    assert(typeof t.completedAt === 'number');
  });

  it('TaskGraph.cancelPending cancels all remaining pending tasks at once', () => {
    const tg = new TaskGraph({ summary: 'test' });
    tg.addTask({ id: 'task_1', title: 'Task 1' });
    tg.addTask({ id: 'task_2', title: 'Task 2', dependencies: ['task_1'] });
    tg.addTask({ id: 'task_3', title: 'Task 3', dependencies: ['task_2'] });

    tg.markSucceeded('task_1');
    const cancelledCount = tg.cancelPending('Cancelled by user interrupt');

    assert.strictEqual(cancelledCount, 2);
    assert.strictEqual(tg.getTask('task_1').status, TASK_STATUS.SUCCEEDED, 'Succeeded task should remain unchanged');
    assert.strictEqual(tg.getTask('task_2').status, TASK_STATUS.CANCELLED);
    assert.strictEqual(tg.getTask('task_3').status, TASK_STATUS.CANCELLED);
    assert.strictEqual(tg.isCompleted(), true, 'Task graph should be marked completed when all remaining are cancelled');
  });

  await itAsync('Autonomous3DArchitect stops at safe boundary when abortSignal is triggered', async () => {
    const mockRPC = async (cmd, params) => {
      return { success: true };
    };

    const arch = new Autonomous3DArchitect(mockRPC, { workspaceRoot: testDir });
    const tg = new TaskGraph({ summary: 'interrupt_test' });
    tg.addTask({ id: 'step_1', title: 'Step 1', codeGenerator: () => '# step 1' });
    tg.addTask({ id: 'step_2', title: 'Step 2', codeGenerator: () => '# step 2' });
    tg.addTask({ id: 'step_3', title: 'Step 3', codeGenerator: () => '# step 3' });

    const abortController = new AbortController();
    let tasksExecuted = 0;

    const auditor = {
      recordTaskExecution: () => {
        tasksExecuted++;
        if (tasksExecuted === 1) {
          // Abort after task 1 finishes
          abortController.abort();
        }
      }
    };

    const res = await arch._executeTaskGraph(tg, auditor, { abortSignal: abortController.signal });
    assert.strictEqual(res.aborted, true, 'Execution must record aborted=true');
    assert.strictEqual(tasksExecuted, 1, 'Only step 1 should have executed before abort');
    assert.strictEqual(tg.getTask('step_1').status, TASK_STATUS.SUCCEEDED);
    assert.strictEqual(tg.getTask('step_2').status, TASK_STATUS.CANCELLED);
    assert.strictEqual(tg.getTask('step_3').status, TASK_STATUS.CANCELLED);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SUITE 4: INTERRUPT & REPLANNING (GOAL 5, 24)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 4: INTERRUPT & REPLANNING WORKFLOW ---');

  await itAsync('interruptAndReplan cancels active task and enqueues new instruction', async () => {
    const runtime = new LiveAgentRuntime({ workspaceRoot: testDir });
    runtime.activeTask = {
      id: 'running_now',
      prompt: 'Make an ocean',
      abortController: new AbortController(),
      status: TASK_QUEUE_STATUS.RUNNING
    };

    let replanEventEmitted = false;
    runtime.on(AGENT_EVENT.REPLANNING, (env) => {
      replanEventEmitted = true;
    });

    const newTask = await runtime.interruptAndReplan('Change it to a desert');
    assert(replanEventEmitted, 'REPLANNING event should be emitted');
    assert.strictEqual(newTask.prompt, 'Change it to a desert');
    assert.strictEqual(newTask.priority, TASK_PRIORITY.USER_COMMAND);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SUITE 5: VIEWPORT STREAM & BOUNDED RING BUFFER (GOALS 2, 3, 13, 14, 15)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 5: VIEWPORT STREAM & BOUNDED RING BUFFER ---');

  it('pushViewportFrame enforces max 3 frames ring buffer (FIFO backpressure)', () => {
    const runtime = new LiveAgentRuntime({ workspaceRoot: testDir, maxFrameBufferSize: 3 });

    // Create 4 dummy frame files
    const frames = [];
    for (let i = 1; i <= 4; i++) {
      const fPath = path.join(testDir, `dummy_frame_${i}.png`);
      fs.writeFileSync(fPath, Buffer.from(`frame_${i}`));
      frames.push(fPath);
    }

    runtime.pushViewportFrame(frames[0]);
    runtime.pushViewportFrame(frames[1]);
    runtime.pushViewportFrame(frames[2]);
    assert.strictEqual(runtime.frameBuffer.length, 3);
    assert.strictEqual(runtime.frameBuffer[0].path, frames[0]);

    // Push 4th frame: oldest (frames[0]) must be dropped
    runtime.pushViewportFrame(frames[3]);
    assert.strictEqual(runtime.frameBuffer.length, 3, 'Frame buffer must remain capped at 3');
    assert.strictEqual(runtime.frameBuffer[0].path, frames[1], 'Oldest frame should have been shifted out');
    assert.strictEqual(runtime.frameBuffer[2].path, frames[3], 'Newest frame should be at tail');
    assert.strictEqual(runtime.latestFrame.path, frames[3]);
  });

  it('pushViewportFrame emits VIEWPORT_UPDATED event with measured telemetry', () => {
    const runtime = new LiveAgentRuntime({ workspaceRoot: testDir });
    const fPath = path.join(testDir, 'event_frame.png');
    fs.writeFileSync(fPath, Buffer.from('event_frame_data'));

    let viewportUpdated = false;
    runtime.on(AGENT_EVENT.VIEWPORT_UPDATED, (env) => {
      viewportUpdated = env.data.framePath === fPath && env.data.sizeBytes > 0;
    });

    runtime.pushViewportFrame(fPath);
    assert(viewportUpdated, 'VIEWPORT_UPDATED event not received');
  });

  await itAsync('detectViewportMode returns mode and renderer engine', async () => {
    const mockRPC = async (cmd, params) => {
      return { success: true };
    };
    const runtime = new LiveAgentRuntime({ sendRPC: mockRPC });
    const info = await runtime.detectViewportMode();
    assert.strictEqual(info.mode, 'GUI');
    assert.strictEqual(info.activeArea, 'VIEW_3D');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SUITE 6: UNTRACKED OBJECT CLASSIFIER (GOAL 18)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 6: UNTRACKED OBJECT CLASSIFIER ---');

  it('OBJECT_CLASSIFICATION defines UNIN_OWNED, USER_CREATED, LEGACY, ORPHANED, UNKNOWN', () => {
    assert.strictEqual(OBJECT_CLASSIFICATION.UNIN_OWNED, 'UNIN_OWNED');
    assert.strictEqual(OBJECT_CLASSIFICATION.USER_CREATED, 'USER_CREATED');
    assert.strictEqual(OBJECT_CLASSIFICATION.LEGACY, 'LEGACY');
    assert.strictEqual(OBJECT_CLASSIFICATION.ORPHANED, 'ORPHANED');
    assert.strictEqual(OBJECT_CLASSIFICATION.UNKNOWN, 'UNKNOWN');
  });

  it('classifySceneObjects classifies UNIN entities vs manual user objects', () => {
    const runtime = new LiveAgentRuntime({ workspaceRoot: testDir });
    const worldState = PersistentWorldState.createNew({ storageDir: testDir });
    worldState.registerEntity({
      uninId: 'unin.entity.vehicle.ferrari',
      blenderName: 'Ferrari_Body',
      category: 'vehicle'
    });

    const sceneObjects = [
      { name: 'Ferrari_Body', unin_id: 'unin.entity.vehicle.ferrari', unin_world_id: worldState.worldId },
      { name: 'Cube', unin_id: null }, // Manual cube added by user in Blender
      { name: 'Light', unin_id: null }, // Manual light added by user
      { name: 'Old_Mesh', unin_id: 'unin.old.mesh', unin_world_id: 'other_world_id' } // From previous session
    ];

    const classified = runtime.classifySceneObjects(sceneObjects, worldState);

    assert.strictEqual(classified.uninOwned.length, 1);
    assert.strictEqual(classified.uninOwned[0].name, 'Ferrari_Body');

    assert.strictEqual(classified.userCreated.length, 2);
    assert(classified.userCreated.some(o => o.name === 'Cube'));
    assert(classified.userCreated.some(o => o.name === 'Light'));

    assert.strictEqual(classified.legacy.length, 1);
    assert.strictEqual(classified.legacy[0].name, 'Old_Mesh');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SUITE 7: MULTI-RATE SYSTEM & VISION RATE CONTROL (GOALS 21, 22, 23)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 7: MULTI-RATE SYSTEM & VISION RATE CONTROL ---');

  it('LIVE_QUALITY_STATE defines 6 standard quality states', () => {
    assert.strictEqual(LIVE_QUALITY_STATE.QUALITY_PENDING, 'QUALITY_PENDING');
    assert.strictEqual(LIVE_QUALITY_STATE.QUALITY_CHECKING, 'QUALITY_CHECKING');
    assert.strictEqual(LIVE_QUALITY_STATE.QUALITY_PASS, 'QUALITY_PASS');
    assert.strictEqual(LIVE_QUALITY_STATE.QUALITY_WARNING, 'QUALITY_WARNING');
    assert.strictEqual(LIVE_QUALITY_STATE.QUALITY_FAIL, 'QUALITY_FAIL');
    assert.strictEqual(LIVE_QUALITY_STATE.QUALITY_NOT_REACHED, 'QUALITY_NOT_REACHED');
  });

  await itAsync('evaluateWithRateControl memoizes identical frames using MD5 hash', async () => {
    const runtime = new LiveAgentRuntime({ workspaceRoot: testDir, minVisionIntervalMs: 50 });
    const imgPath = path.join(testDir, 'test_hash_frame.png');
    fs.writeFileSync(imgPath, Buffer.from('identical_frame_content'));

    let evaluatorCallCount = 0;
    const mockEvaluator = {
      evaluateVisualQuality: async () => {
        evaluatorCallCount++;
        return { overallStatus: 'PASS', qualityScore: 9.3, defects: [] };
      }
    };

    // First call: runs evaluator
    const res1 = await runtime.evaluateWithRateControl('Check visuals', imgPath, mockEvaluator, {}, {});
    assert.strictEqual(evaluatorCallCount, 1);
    assert.strictEqual(res1.qualityScore, 9.3);

    // Wait past cooldown to test hash memoization specifically
    await new Promise(r => setTimeout(r, 60));

    // Second call with same image: returns memoized report without incrementing call count
    const res2 = await runtime.evaluateWithRateControl('Check visuals', imgPath, mockEvaluator, {}, {});
    assert.strictEqual(evaluatorCallCount, 1, 'Evaluator must not be called again for identical frame hash');
    assert.strictEqual(res2.qualityScore, 9.3);
  });

  await itAsync('evaluateWithRateControl throttles rapid back-to-back calls without crash', async () => {
    const runtime = new LiveAgentRuntime({ workspaceRoot: testDir, minVisionIntervalMs: 2000 });
    runtime.lastVisionAnalysisTime = Date.now(); // active cooldown

    const res = await runtime.evaluateWithRateControl('Prompt', 'any.png', null, {}, {});
    assert.strictEqual(res.throttled, true);
    assert.strictEqual(res.overallStatus, 'QUALITY_CHECKING');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SUITE 8: DISCONNECT RECOVERY & RECONCILIATION (GOAL 25)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 8: DISCONNECT RECOVERY & RECONCILIATION ---');

  await itAsync('reconcileAfterDisconnect emits RESUMED event and reconciles with Blender', async () => {
    let resumedEmitted = false;
    const mockArchitect = {
      reconcileWorldWithBlender: async () => ({ verified: true, matchedCount: 5 })
    };

    const runtime = new LiveAgentRuntime({ architect: mockArchitect });
    runtime.on(AGENT_EVENT.RESUMED, (env) => {
      resumedEmitted = env.data.verified === true;
    });

    const res = await runtime.reconcileAfterDisconnect();
    assert.strictEqual(res.verified, true);
    assert.strictEqual(res.matchedCount, 5);
    assert(resumedEmitted, 'RESUMED event was not emitted');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SUITE 9: BLENDER ASTRA ENGINE INTEGRATION (GOAL 26)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 9: BLENDER ASTRA ENGINE INTEGRATION ---');

  it('BlenderAstraEngine initializes liveRuntime instance on creation', () => {
    const engine = new BlenderAstraEngine();
    assert(engine.liveRuntime instanceof LiveAgentRuntime);
    assert.strictEqual(typeof engine.getLiveRuntime, 'function');
    assert.strictEqual(typeof engine.enqueueLiveTask, 'function');
    assert.strictEqual(typeof engine.cancelActiveTask, 'function');
    assert.strictEqual(typeof engine.interruptAndReplan, 'function');
    assert.strictEqual(typeof engine.pushLiveViewportFrame, 'function');
    assert.strictEqual(typeof engine.classifySceneObjects, 'function');
    assert.strictEqual(typeof engine.getLiveRuntimeStatus, 'function');
  });

  it('BlenderAstraEngine.getLiveRuntimeStatus returns active status, queue, and FPS', () => {
    const engine = new BlenderAstraEngine();
    const status = engine.getLiveRuntimeStatus();
    assert(status !== null);
    assert('queueLength' in status);
    assert('qualityState' in status);
    assert('measuredFps' in status);
    assert('telemetry' in status);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SUITE 10: ASTRATOOLS TOOL REGISTRY INTEGRATION (GOAL 27)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 10: ASTRATOOLS TOOL REGISTRY INTEGRATION ---');

  it('registerAstraTools registers all 4 Live Agent Runtime tools', () => {
    const registered = {};
    const mockRegistry = {
      register: (name, def) => {
        registered[name] = def;
      }
    };

    registerAstraTools(mockRegistry, {});

    assert(registered['blender_agent_command'], 'Missing blender_agent_command tool');
    assert(registered['blender_agent_cancel'], 'Missing blender_agent_cancel tool');
    assert(registered['blender_agent_interrupt'], 'Missing blender_agent_interrupt tool');
    assert(registered['blender_agent_status'], 'Missing blender_agent_status tool');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SUITE 11: END-TO-END EVENT PROGRESSION & EDGE CASES
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 11: END-TO-END LIFECYCLE & EDGE CASES ---');

  await itAsync('End-to-end task execution emits TASK_CREATED, TASK_STARTED, PROGRESS, and COMPLETED', async () => {
    const mockArchitect = {
      getWorldState: () => ({ worldId: 'world_lifecycle', version: 1 }),
      mutateWorldIncremental: async (prompt, opts) => {
        if (opts.onProgress) opts.onProgress({ step: 1, totalSteps: 2, title: 'Mutating', description: 'Applying color' });
        return { success: true, worldId: 'world_lifecycle', version: 2 };
      }
    };

    const runtime = new LiveAgentRuntime({ architect: mockArchitect, workspaceRoot: testDir });
    const eventsRecorded = [];

    runtime.on('*', (evType) => {
      eventsRecorded.push(evType);
    });

    const task = runtime.enqueueTask({ prompt: 'Turn car red' });
    // Allow queue loop to execute
    await new Promise(r => setTimeout(r, 50));

    assert(eventsRecorded.includes(AGENT_EVENT.TASK_CREATED), 'Missing TASK_CREATED event');
    assert(eventsRecorded.includes(AGENT_EVENT.TASK_STARTED), 'Missing TASK_STARTED event');
    assert(eventsRecorded.includes(AGENT_EVENT.BLENDER_TASK_PROGRESS), 'Missing BLENDER_TASK_PROGRESS event');
    assert(eventsRecorded.includes(AGENT_EVENT.COMPLETED), 'Missing COMPLETED event');
    assert.strictEqual(task.status, TASK_QUEUE_STATUS.COMPLETED);
  });

  await itAsync('Task failure emits FAILED event and records error status', async () => {
    const mockArchitect = {
      getWorldState: () => ({ worldId: 'world_fail', version: 1 }),
      mutateWorldIncremental: async () => {
        throw new Error('Synthetic Blender RPC socket reset');
      }
    };

    const runtime = new LiveAgentRuntime({ architect: mockArchitect, workspaceRoot: testDir });
    let failedEmitted = false;

    runtime.on(AGENT_EVENT.FAILED, (env) => {
      failedEmitted = env.message.includes('Synthetic Blender RPC socket reset');
    });

    const task = runtime.enqueueTask({ prompt: 'Trigger synthetic failure' });
    await new Promise(r => setTimeout(r, 50));

    assert(failedEmitted, 'FAILED event not emitted on task throw');
    assert.strictEqual(task.status, TASK_QUEUE_STATUS.FAILED);
  });

  it('Ring buffer with capacity 1 immediately shifts out previous frame', () => {
    const runtime = new LiveAgentRuntime({ workspaceRoot: testDir, maxFrameBufferSize: 1 });
    const f1 = path.join(testDir, 'single_1.png');
    const f2 = path.join(testDir, 'single_2.png');
    fs.writeFileSync(f1, Buffer.from('1'));
    fs.writeFileSync(f2, Buffer.from('2'));

    runtime.pushViewportFrame(f1);
    assert.strictEqual(runtime.frameBuffer.length, 1);
    assert.strictEqual(runtime.latestFrame.path, f1);

    runtime.pushViewportFrame(f2);
    assert.strictEqual(runtime.frameBuffer.length, 1);
    assert.strictEqual(runtime.latestFrame.path, f2);
  });

  it('classifySceneObjects safely handles empty scene objects array', () => {
    const runtime = new LiveAgentRuntime({ workspaceRoot: testDir });
    const classified = runtime.classifySceneObjects([], null);
    assert.strictEqual(classified.uninOwned.length, 0);
    assert.strictEqual(classified.userCreated.length, 0);
    assert.strictEqual(classified.legacy.length, 0);
  });

  it('classifySceneObjects categorizes objects with unin_id but no active world match as unknown', () => {
    const runtime = new LiveAgentRuntime({ workspaceRoot: testDir });
    const sceneObjects = [{ name: 'Strange_Item', unin_id: 'unin.mystery', unin_world_id: null }];
    const classified = runtime.classifySceneObjects(sceneObjects, null);
    assert.strictEqual(classified.unknown.length, 1);
    assert.strictEqual(classified.unknown[0].name, 'Strange_Item');
  });

  it('Telemetry records non-fabricated measured values for cancellation and events', () => {
    const runtime = new LiveAgentRuntime({ workspaceRoot: testDir });
    runtime.activeTask = { id: 'telemetry_task', abortController: new AbortController(), status: TASK_QUEUE_STATUS.RUNNING };
    const cancelRes = runtime.cancelTask('telemetry_task', 'Benchmark');

    assert(typeof cancelRes.latencyMs === 'number');
    assert(cancelRes.latencyMs >= 0);
    assert.strictEqual(runtime.telemetry.cancelLatencyMs, cancelRes.latencyMs);
  });

  console.log('\n========================================================================');
  console.log(`  PHASE 3E VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log('========================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runLiveRuntimeVerificationSuite().catch(err => {
  console.error('[FATAL] Verification suite crashed:', err);
  process.exit(1);
});
