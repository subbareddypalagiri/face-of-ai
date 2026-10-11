// scratch/test-scheduler.js — Automated FAANG-Grade Verification for SOTA Persistent Scheduler & App Launcher
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const desktopAutomator = require('../desktop-automator');
const memoryCore = require('../memory-core');

async function runSchedulerTestSuite() {
  console.log('=== [UNIN TEST SUITE] SOTA 2026 Persistent Scheduler & Launcher Verification ===\n');

  const tasksFilePath = path.join(__dirname, '..', 'scheduled-tasks.json');

  // ── [1/5] Testing Parameter Normalization & Disk Persistence ──
  console.log('[1/5] Testing Parameter Normalization & Atomic Disk Persistence...');
  
  const scheduleRes = desktopAutomator.scheduleTask(
    'in 2 seconds',
    'send_whatsapp_message',
    { to: 'TestUser', text: 'Persistent test message' },
    'Automated Verification Task'
  );

  assert.strictEqual(scheduleRes.success, true, 'Task scheduling should return success: true');
  assert.strictEqual(scheduleRes.actionType, 'send_whatsapp_message', 'Action type should normalize to send_whatsapp_message');
  assert.ok(scheduleRes.taskId, 'Task ID must be generated');
  assert.strictEqual(scheduleRes.status, 'PENDING', 'Initial task status must be PENDING');

  // Verify file on disk
  assert.ok(fs.existsSync(tasksFilePath), 'scheduled-tasks.json must exist on disk');
  const diskContent = JSON.parse(fs.readFileSync(tasksFilePath, 'utf8'));
  assert.ok(Array.isArray(diskContent), 'Persisted content must be an array');
  const savedTask = diskContent.find(t => t.id === scheduleRes.taskId);
  assert.ok(savedTask, 'Scheduled task must be persisted in scheduled-tasks.json');
  assert.strictEqual(savedTask.params.contact, 'TestUser', 'Param "to" must be normalized to "contact"');
  assert.strictEqual(savedTask.params.message, 'Persistent test message', 'Param "text" must be normalized to "message"');
  console.log('  -> Task persisted to disk successfully with normalized params.');

  // ── [2/5] Testing getScheduledTasks & cancelScheduledTask ──
  console.log('\n[2/5] Testing Task Query & Cancellation...');
  const tasksList = desktopAutomator.getScheduledTasks();
  assert.strictEqual(tasksList.success, true);
  assert.ok(tasksList.count >= 1, 'Task count must be at least 1');
  const listedTask = tasksList.tasks.find(t => t.id === scheduleRes.taskId);
  assert.ok(listedTask, 'Task must appear in active task list');

  const cancelRes = desktopAutomator.cancelScheduledTask(scheduleRes.taskId);
  assert.strictEqual(cancelRes.success, true, 'Cancel must return success: true');

  const diskAfterCancel = JSON.parse(fs.readFileSync(tasksFilePath, 'utf8'));
  const cancelledOnDisk = diskAfterCancel.find(t => t.id === scheduleRes.taskId);
  assert.strictEqual(cancelledOnDisk.status, 'CANCELLED', 'Status must be updated to CANCELLED on disk');
  console.log('  -> Task query and cancellation verified.');

  // ── [3/5] Testing Memory Contact Book Auto-Resolution ──
  console.log('\n[3/5] Testing Contact Book Phone Auto-Resolution...');
  memoryCore.saveContact({
    name: 'Jayanth',
    phone: '+919988776655',
    notes: 'Astra Test Contact'
  });

  const contactSchedule = desktopAutomator.scheduleTask(
    'in 10 minutes',
    'whatsapp',
    { contact: 'Jayanth', message: 'Hey Jayanth, build succeeded!' },
    'Auto-resolve phone test'
  );

  assert.strictEqual(contactSchedule.success, true);
  const diskAfterContact = JSON.parse(fs.readFileSync(tasksFilePath, 'utf8'));
  const contactTask = diskAfterContact.find(t => t.id === contactSchedule.taskId);
  assert.strictEqual(contactTask.params.phone, '+919988776655', 'Phone number must be auto-resolved from memory contact book');
  console.log('  -> Contact phone "+919988776655" auto-resolved from memoryCore.');

  // Clean up contact task
  desktopAutomator.cancelScheduledTask(contactSchedule.taskId);

  // ── [4/5] Testing Universal App Launcher Resolution ──
  console.log('\n[4/5] Testing Universal App Launcher Resolution...');
  
  const calcApp = desktopAutomator.resolveDesktopApp('calc');
  assert.ok(calcApp && calcApp.target === 'calc.exe', 'calc must resolve to calc.exe');

  const codeApp = desktopAutomator.resolveDesktopApp('vscode');
  assert.ok(codeApp && codeApp.target === 'code', 'vscode must resolve to code');

  const edgeApp = desktopAutomator.resolveDesktopApp('edge');
  assert.ok(edgeApp && edgeApp.target === 'msedge.exe', 'edge must resolve to msedge.exe');

  const waApp = desktopAutomator.resolveDesktopApp('whatsapp');
  assert.ok(waApp && waApp.type === 'protocol', 'whatsapp must resolve as protocol');

  console.log('  -> App launcher resolution verified for calc, vscode, edge, whatsapp.');

  // ── [5/5] Testing Relative & Absolute Time Parsing ──
  console.log('\n[5/5] Testing Time Parsing Accuracy...');

  const t1 = desktopAutomator.scheduleTask('in 30 seconds', 'open_app', { app: 'calc' });
  assert.ok(t1.delaySeconds >= 29 && t1.delaySeconds <= 31, 'Delay should be ~30 seconds');
  desktopAutomator.cancelScheduledTask(t1.taskId);

  const t2 = desktopAutomator.scheduleTask('in 1 hour', 'open_app', { app: 'notepad' });
  assert.ok(t2.delaySeconds >= 3590 && t2.delaySeconds <= 3610, 'Delay should be ~3600 seconds');
  desktopAutomator.cancelScheduledTask(t2.taskId);

  console.log('  -> Timing parsing verified.');

  console.log('\n=== ALL ASSERTIONS PASSED! 2026 Persistent Scheduler is Production Ready ===');
  process.exit(0);
}

runSchedulerTestSuite().catch(err => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
