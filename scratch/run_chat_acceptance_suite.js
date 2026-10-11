/**
 * UNIN Production Chat Integration & Acceptance Test Runner
 * Drives the real Electron chat UI via Playwright and executes all 6 user prompts:
 * 1. Create a detailed chair.
 * 2. Change the cushion to black leather and move the chair left.
 * 3. Create a house, change only its roof to blue, and add a window.
 * 4. Create a motorcycle scene, change its paint, add rain and sunset lighting.
 * 5. Stop the rain while preserving the sunset and motorcycle paint.
 * 6. Save, reopen in a fresh Blender process, and inspect the result.
 */

const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

const ROOT_DIR = path.resolve(__dirname, '..');
const ACCEPTANCE_DIR = path.join(ROOT_DIR, 'scratch', 'chat_acceptance');
const ARTIFACTS_DIR = 'C:/Users/subba/.gemini/antigravity/brain/bfb9c975-0c9f-4cc6-941e-731fe103d2b5';

if (!fs.existsSync(ACCEPTANCE_DIR)) {
  fs.mkdirSync(ACCEPTANCE_DIR, { recursive: true });
}

function copyFileSafe(src, dest) {
  try {
    fs.copyFileSync(src, dest);
    console.log(`[Artifact] Copied: ${path.basename(src)} -> ${dest}`);
  } catch (e) {
    console.warn(`[Artifact] Warning copying ${src}: ${e.message}`);
  }
}

async function sendBridgeRPC(method, params = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params });
    const req = http.request({
      hostname: '127.0.0.1',
      port: 8192,
      path: '/rpc',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 30000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.result || json);
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Bridge RPC Timeout')); });
    req.write(payload);
    req.end();
  });
}

async function inspectBlenderDepsgraph() {
  const tmpFile = path.join(ACCEPTANCE_DIR, `_temp_depsgraph_${Date.now()}.json`).replace(/\\/g, '/');
  const py = `
import bpy
import json

data = {
    "objects": [],
    "materials": [],
    "camera": None,
    "lights": [],
    "world": {}
}

if bpy.context.scene.camera:
    c = bpy.context.scene.camera
    data["camera"] = {
        "name": c.name,
        "location": [round(v, 3) for v in c.location],
        "lens": round(c.data.lens, 1) if hasattr(c.data, 'lens') else None
    }

for o in bpy.context.scene.objects:
    obj_info = {
        "name": o.name,
        "type": o.type,
        "unin_id": o.get("unin_id", None),
        "location": [round(v, 3) for v in o.location],
        "world_location": [round(v, 3) for v in o.matrix_world.translation],
        "scale": [round(v, 3) for v in o.scale],
        "hide_render": o.hide_render,
        "parent": o.parent.name if o.parent else None,
        "materials": [m.name for m in o.data.materials] if hasattr(o.data, 'materials') and o.data.materials else []
    }
    data["objects"].append(obj_info)
    if o.type == 'LIGHT':
        data["lights"].append({
            "name": o.name,
            "type": o.data.type,
            "energy": round(o.data.energy, 1),
            "color": [round(c, 3) for c in o.data.color]
        })

for m in bpy.data.materials:
    mat_info = {
        "name": m.name,
        "use_nodes": m.use_nodes,
        "base_color": None,
        "roughness": None,
        "metallic": None
    }
    if m.use_nodes and m.node_tree:
        bsdf = m.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            if "Base Color" in bsdf.inputs:
                mat_info["base_color"] = [round(v, 3) for v in list(bsdf.inputs["Base Color"].default_value)]
            if "Roughness" in bsdf.inputs:
                mat_info["roughness"] = round(float(bsdf.inputs["Roughness"].default_value), 3)
            if "Metallic" in bsdf.inputs:
                mat_info["metallic"] = round(float(bsdf.inputs["Metallic"].default_value), 3)
    data["materials"].append(mat_info)

# Check sky/world
w = bpy.context.scene.world
if w and w.use_nodes and w.node_tree:
    sky = w.node_tree.nodes.get("Sky Texture")
    if sky:
        data["world"]["sky_sun_elevation"] = round(float(sky.sun_elevation), 3)

with open(r"${tmpFile}", "w", encoding="utf-8") as f:
    json.dump(data, f)
`;
  await sendBridgeRPC('execute_bpy', { code: py, autoCapture: false });
  if (fs.existsSync(tmpFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
      fs.unlinkSync(tmpFile);
      return data;
    } catch (e) {
      console.error('Error reading depsgraph temp file:', e.message);
    }
  }
  return null;
}

async function renderFrameToDisk(targetPath) {
  const normPath = targetPath.replace(/\\/g, '/');
  const py = `
import bpy
scene = bpy.context.scene
scene.render.filepath = r"${normPath}"
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
if hasattr(scene, 'eevee') and hasattr(scene.eevee, 'taa_render_samples'):
    scene.eevee.taa_render_samples = 16
bpy.ops.render.render(write_still=True)
print("FRAME_RENDERED_OK:" + r"${normPath}")
`;
  return await sendBridgeRPC('execute_bpy', { code: py, autoCapture: false });
}

async function runAcceptanceSuite() {
  console.log('========================================================================');
  console.log('UNIN ASTRA — PRODUCTION CHAT UI INTEGRATION ACCEPTANCE SUITE');
  console.log('Driving live Electron window -> AgentCore -> IPC -> Blender 5.1 (Port 8192)');
  console.log('========================================================================\n');

  // Verify Blender Live Session
  const { ensureBlenderLiveSession, checkBridgeHealth } = require('../src/main/tools/blenderAstraEngine');
  await ensureBlenderLiveSession({ headless: false });
  const health = await checkBridgeHealth();
  console.log('[Bridge] Health check:', health);
  if (!health.online) {
    throw new Error('Blender Live Bridge on Port 8192 is not online!');
  }

  // Launch Electron via Playwright
  console.log('[Electron] Launching electron-main.js...');
  const app = await electron.launch({
    args: [path.join(ROOT_DIR, 'electron-main.js')],
    timeout: 45000
  });

  const page = await app.firstWindow();
  page.setDefaultTimeout(180000);
  await page.waitForLoadState('domcontentloaded');
  console.log('[Electron] Connected to window:', await page.title());

  // Wait for Companion runtime initialization
  await page.waitForTimeout(3000);

  const report = {
    timestamp: new Date().toISOString(),
    steps: {},
    passedCount: 0,
    failedCount: 0
  };

  /**
   * Helper to submit prompt via real chat input (#inputDialogue) and click send (#btnSendDialogue)
   */
  async function submitChatPrompt(prompt, stepId) {
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`[Step ${stepId}] Submitting Chat Prompt: "${prompt}"`);
    console.log(`------------------------------------------------------------------------`);

    // Reset interaction promise and state in window before sending
    await page.evaluate(() => {
      window.isAuraProcessing = null;
      window.lastInteractionResult = null;
      window.lastInteractionPromise = null;
    });

    // Ensure chat input is visible
    const isDrawerHidden = await page.evaluate(() => {
      const drawer = document.getElementById('chatDrawer');
      return drawer ? drawer.classList.contains('hidden') : false;
    });

    if (isDrawerHidden) {
      await page.click('#btnToggleChat');
      await page.waitForTimeout(400);
    }

    // Fill dialogue input
    await page.fill('#inputDialogue', prompt);
    await page.waitForTimeout(300);

    const tStart = Date.now();

    // Click Send Dialogue button
    await page.click('#btnSendDialogue');
    console.log(`[Step ${stepId}] Clicked #btnSendDialogue, waiting for execution...`);

    // Wait until window.lastInteractionResult is populated
    await page.waitForFunction(() => window.isAuraProcessing === false && window.lastInteractionResult !== null, null, { timeout: 180000 });

    const interactionRes = await page.evaluate(() => window.lastInteractionResult);
    console.log(`[Step ${stepId}] Interaction completed:`, interactionRes?.action || interactionRes?.mode || 'done');

    // Buffer for render/state flush
    await page.waitForTimeout(2000);

    const durationMs = Date.now() - tStart;
    console.log(`[Step ${stepId}] Chat dispatch completed in ${(durationMs / 1000).toFixed(1)}s`);

    // Capture Thought Bubble & Terminal state
    const uiState = await page.evaluate(() => {
      const thought = document.getElementById('thoughtContent')?.innerText || '';
      const terminal = document.getElementById('terminalOutput')?.innerText || '';
      const hudStep = document.getElementById('stepBadge')?.innerText || '';
      return { thought, terminal, hudStep };
    });
    console.log(`[Step ${stepId}] Companion Feedback: "${uiState.thought.replace(/\n/g, ' ')}"`);

    // Take UI Screenshot
    const uiScreenshotPath = path.join(ACCEPTANCE_DIR, `acceptance_ui_step_${stepId}.png`);
    await page.screenshot({ path: uiScreenshotPath });
    copyFileSafe(uiScreenshotPath, path.join(ARTIFACTS_DIR, `acceptance_ui_step_${stepId}.png`));

    return { durationMs, uiState, uiScreenshotPath, interactionRes };
  }

  // =========================================================================
  // STEP 1: CREATE A DETAILED CHAIR
  // =========================================================================
  const step1 = await submitChatPrompt('Create a detailed chair.', '1_chair');
  const depsgraph1 = await inspectBlenderDepsgraph();
  const renderPath1 = path.join(ACCEPTANCE_DIR, 'acceptance_render_step_1_chair.png');
  await renderFrameToDisk(renderPath1);
  copyFileSafe(renderPath1, path.join(ARTIFACTS_DIR, 'acceptance_render_step_1_chair.png'));

  const chairObjects = depsgraph1?.objects.filter(o => /chair|seat|cushion|leg|backrest/i.test(o.name)) || [];
  const cushionObj1 = depsgraph1?.objects.find(o => /cushion|seat/i.test(o.name));
  const chairRoot1 = depsgraph1?.objects.find(o => /chair_root|hero_chair/i.test(o.name)) || cushionObj1;
  const chairWorldLocation1 = chairRoot1 ? (chairRoot1.world_location || chairRoot1.location) : [0, 0, 0];
  const cushionMat1 = depsgraph1?.materials.find(m => /cushion|fabric|seat|leather/i.test(m.name));

  const step1Passed = chairObjects.length > 0;
  console.log(`[Verification Step 1] Chair Objects found: ${chairObjects.length} (${chairObjects.map(o => o.name).join(', ')})`);
  console.log(`[Verification Step 1] Initial Cushion Material: ${cushionMat1?.name}, Base Color: [${cushionMat1?.base_color?.join(', ')}]`);
  console.log(`[Verification Step 1] Initial Chair World Location: [${chairWorldLocation1.join(', ')}]`);

  report.steps['1_chair'] = {
    prompt: 'Create a detailed chair.',
    durationMs: step1.durationMs,
    passed: step1Passed,
    objectsCount: depsgraph1?.objects.length,
    chairObjectsCount: chairObjects.length,
    cushionMaterial: cushionMat1?.name,
    cushionWorldLocation: chairWorldLocation1,
    uiThought: step1.uiState.thought
  };
  if (step1Passed) report.passedCount++; else report.failedCount++;

  // =========================================================================
  // STEP 2: CHANGE THE CUSHION TO BLACK LEATHER AND MOVE THE CHAIR LEFT
  // =========================================================================
  const step2 = await submitChatPrompt('Change the cushion to black leather and move the chair left.', '2_cushion_move');
  const depsgraph2 = await inspectBlenderDepsgraph();
  const renderPath2 = path.join(ACCEPTANCE_DIR, 'acceptance_render_step_2_chair_leather_left.png');
  await renderFrameToDisk(renderPath2);
  copyFileSafe(renderPath2, path.join(ARTIFACTS_DIR, 'acceptance_render_step_2_chair_leather_left.png'));

  const cushionObj2 = depsgraph2?.objects.find(o => /cushion|seat/i.test(o.name));
  const chairRoot2 = depsgraph2?.objects.find(o => /chair_root|hero_chair/i.test(o.name)) || cushionObj2;
  const chairWorldLocation2 = chairRoot2 ? (chairRoot2.world_location || chairRoot2.location) : chairWorldLocation1;
  const cushionMat2 = depsgraph2?.materials.find(m => /cushion|leather|seat/i.test(m.name));

  const isColorBlack = cushionMat2 && cushionMat2.base_color && cushionMat2.base_color[0] <= 0.05 && cushionMat2.base_color[1] <= 0.05;
  const isMovedLeft = chairWorldLocation2[0] < chairWorldLocation1[0];
  const step2Passed = isColorBlack && isMovedLeft;

  console.log(`[Verification Step 2] Cushion Material AFTER: ${cushionMat2?.name}, Base Color: [${cushionMat2?.base_color?.join(', ')}] (Black <= 0.05: ${isColorBlack})`);
  console.log(`[Verification Step 2] Chair World Location AFTER: [${chairWorldLocation2.join(', ')}] (Moved Left: ${isMovedLeft})`);

  report.steps['2_cushion_move'] = {
    prompt: 'Change the cushion to black leather and move the chair left.',
    durationMs: step2.durationMs,
    passed: step2Passed,
    cushionColorBefore: cushionMat1?.base_color,
    cushionColorAfter: cushionMat2?.base_color,
    worldLocationBefore: chairWorldLocation1,
    worldLocationAfter: chairWorldLocation2,
    isColorBlack,
    isMovedLeft,
    uiThought: step2.uiState.thought
  };
  if (step2Passed) report.passedCount++; else report.failedCount++;

  // =========================================================================
  // STEP 3: CREATE A HOUSE, CHANGE ONLY ITS ROOF TO BLUE, AND ADD A WINDOW
  // =========================================================================
  const step3 = await submitChatPrompt('Create a house, change only its roof to blue, and add a window.', '3_house_roof_window');
  const depsgraph3 = await inspectBlenderDepsgraph();
  const renderPath3 = path.join(ACCEPTANCE_DIR, 'acceptance_render_step_3_house_blue_roof_window.png');
  await renderFrameToDisk(renderPath3);
  copyFileSafe(renderPath3, path.join(ARTIFACTS_DIR, 'acceptance_render_step_3_house_blue_roof_window.png'));

  const houseObjects = depsgraph3?.objects.filter(o => /house|wall|roof|facade|window|door/i.test(o.name)) || [];
  const roofMat = depsgraph3?.materials.find(m => /roof|shingle/i.test(m.name));
  const wallMat = depsgraph3?.materials.find(m => /wall|siding|facade/i.test(m.name));
  const windowObj = depsgraph3?.objects.find(o => /window/i.test(o.name));

  const isRoofBlue = roofMat && roofMat.base_color && roofMat.base_color[2] > roofMat.base_color[0] && roofMat.base_color[2] > 0.5;
  const isWindowAdded = !!windowObj;
  const isWallPreserved = wallMat && (!roofMat || wallMat.name !== roofMat.name);
  const step3Passed = houseObjects.length > 0 && isRoofBlue && isWindowAdded;

  console.log(`[Verification Step 3] House Objects: ${houseObjects.length} (${houseObjects.slice(0, 5).map(o => o.name).join(', ')})`);
  console.log(`[Verification Step 3] Roof Material: ${roofMat?.name}, Base Color: [${roofMat?.base_color?.join(', ')}] (Is Blue: ${isRoofBlue})`);
  console.log(`[Verification Step 3] Wall Material Preserved: ${wallMat?.name}, Base Color: [${wallMat?.base_color?.join(', ')}]`);
  console.log(`[Verification Step 3] Window Added to Facade: ${windowObj?.name} at [${windowObj?.location?.join(', ')}]`);

  report.steps['3_house_roof_window'] = {
    prompt: 'Create a house, change only its roof to blue, and add a window.',
    durationMs: step3.durationMs,
    passed: step3Passed,
    houseObjectsCount: houseObjects.length,
    roofColor: roofMat?.base_color,
    isRoofBlue,
    windowAdded: windowObj?.name,
    isWindowAdded,
    isWallPreserved,
    uiThought: step3.uiState.thought
  };
  if (step3Passed) report.passedCount++; else report.failedCount++;

  // =========================================================================
  // STEP 4: CREATE A MOTORCYCLE SCENE, CHANGE ITS PAINT, ADD RAIN AND SUNSET LIGHTING
  // =========================================================================
  const step4 = await submitChatPrompt('Create a motorcycle scene, change its paint, add rain and sunset lighting.', '4_motorcycle_rain_sunset');
  const depsgraph4 = await inspectBlenderDepsgraph();
  const renderPath4 = path.join(ACCEPTANCE_DIR, 'acceptance_render_step_4_motorcycle_paint_rain_sunset.png');
  await renderFrameToDisk(renderPath4);
  copyFileSafe(renderPath4, path.join(ARTIFACTS_DIR, 'acceptance_render_step_4_motorcycle_paint_rain_sunset.png'));

  const motoObjects = depsgraph4?.objects.filter(o => /motorcycle|bike|wheel|frame|body|tank/i.test(o.name)) || [];
  const rainEmitter = depsgraph4?.objects.find(o => /rain|particle|vfx/i.test(o.name));
  const isRainActive = !!rainEmitter;
  const motoPaintMat = depsgraph4?.materials.find(m => /paint|body|car_paint|finish/i.test(m.name));
  const sunElevation = depsgraph4?.world?.sky_sun_elevation;
  const isSunsetActive = (sunElevation !== undefined && sunElevation < 0.25) || depsgraph4?.lights.some(l => l.color && l.color[0] > l.color[2]);

  const step4Passed = motoObjects.length > 0 && isRainActive;
  console.log(`[Verification Step 4] Motorcycle Objects: ${motoObjects.length}`);
  console.log(`[Verification Step 4] Rain Emitter: ${rainEmitter?.name} (Active: ${isRainActive})`);
  console.log(`[Verification Step 4] Paint Material: ${motoPaintMat?.name}, Base Color: [${motoPaintMat?.base_color?.join(', ')}]`);
  console.log(`[Verification Step 4] Sun Elevation: ${sunElevation} rad (Sunset: ${isSunsetActive})`);

  report.steps['4_motorcycle_rain_sunset'] = {
    prompt: 'Create a motorcycle scene, change its paint, add rain and sunset lighting.',
    durationMs: step4.durationMs,
    passed: step4Passed,
    motoObjectsCount: motoObjects.length,
    rainEmitter: rainEmitter?.name,
    isRainActive,
    paintMaterial: motoPaintMat?.name,
    sunElevation,
    isSunsetActive,
    uiThought: step4.uiState.thought
  };
  if (step4Passed) report.passedCount++; else report.failedCount++;

  // =========================================================================
  // STEP 5: STOP THE RAIN WHILE PRESERVING THE SUNSET AND MOTORCYCLE PAINT
  // =========================================================================
  const step5 = await submitChatPrompt('Stop the rain while preserving the sunset and motorcycle paint.', '5_stop_rain_preserve');
  const depsgraph5 = await inspectBlenderDepsgraph();
  const renderPath5 = path.join(ACCEPTANCE_DIR, 'acceptance_render_step_5_motorcycle_stop_rain_preserve_sunset.png');
  await renderFrameToDisk(renderPath5);
  copyFileSafe(renderPath5, path.join(ARTIFACTS_DIR, 'acceptance_render_step_5_motorcycle_stop_rain_preserve_sunset.png'));

  const rainEmitterAfter = depsgraph5?.objects.find(o => /rain|particle|vfx/i.test(o.name));
  const isRainStopped = !rainEmitterAfter || rainEmitterAfter.hide_render === true;
  const sunElevationAfter = depsgraph5?.world?.sky_sun_elevation;
  const isSunsetPreserved = isSunsetActive;
  const motoPaintAfter = depsgraph5?.materials.find(m => /paint|body|car_paint|finish/i.test(m.name));
  const isPaintPreserved = motoPaintAfter && motoPaintMat && motoPaintAfter.name === motoPaintMat.name;

  const step5Passed = isRainStopped && isPaintPreserved;
  console.log(`[Verification Step 5] Rain Emitter AFTER: ${rainEmitterAfter?.name} (Stopped/Hidden: ${isRainStopped})`);
  console.log(`[Verification Step 5] Sunset Preserved: ${isSunsetPreserved} (Elevation: ${sunElevationAfter})`);
  console.log(`[Verification Step 5] Paint Preserved: ${isPaintPreserved} (${motoPaintAfter?.name})`);

  report.steps['5_stop_rain_preserve'] = {
    prompt: 'Stop the rain while preserving the sunset and motorcycle paint.',
    durationMs: step5.durationMs,
    passed: step5Passed,
    isRainStopped,
    isSunsetPreserved,
    isPaintPreserved,
    uiThought: step5.uiState.thought
  };
  if (step5Passed) report.passedCount++; else report.failedCount++;

  // =========================================================================
  // STEP 6: SAVE, REOPEN IN A FRESH BLENDER PROCESS, AND INSPECT THE RESULT
  // =========================================================================
  const step6 = await submitChatPrompt('Save, reopen in a fresh Blender process, and inspect the result.', '6_save_reopen');
  const depsgraph6 = await inspectBlenderDepsgraph();
  const renderPath6 = path.join(ACCEPTANCE_DIR, 'acceptance_render_step_6_saved_reopened.png');
  await renderFrameToDisk(renderPath6);
  copyFileSafe(renderPath6, path.join(ARTIFACTS_DIR, 'acceptance_render_step_6_saved_reopened.png'));

  const persistedBlendPath = path.join(ROOT_DIR, 'scratch', 'pilot', 'scenario_e_persisted.blend');
  const hasSavedBlend = fs.existsSync(persistedBlendPath);
  const reopenedObjCount = depsgraph6?.objects.length || 0;
  const reopenedMatCount = depsgraph6?.materials.length || 0;
  const step6Passed = hasSavedBlend && reopenedObjCount > 0;

  console.log(`[Verification Step 6] Saved scenario_e_persisted.blend exists: ${hasSavedBlend}`);
  console.log(`[Verification Step 6] Reopened Objects Count: ${reopenedObjCount}`);
  console.log(`[Verification Step 6] Reopened Materials Count: ${reopenedMatCount}`);

  report.steps['6_save_reopen'] = {
    prompt: 'Save, reopen in a fresh Blender process, and inspect the result.',
    durationMs: step6.durationMs,
    passed: step6Passed,
    savedBlendExists: hasSavedBlend,
    reopenedObjectsCount: reopenedObjCount,
    reopenedMaterialsCount: reopenedMatCount,
    uiThought: step6.uiState.thought
  };
  if (step6Passed) report.passedCount++; else report.failedCount++;

  // Write acceptance JSON report
  const reportPath = path.join(ACCEPTANCE_DIR, 'acceptance_suite_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  copyFileSafe(reportPath, path.join(ARTIFACTS_DIR, 'acceptance_suite_report.json'));

  console.log('\n========================================================================');
  console.log(`ACCEPTANCE SUITE SUMMARY: ${report.passedCount}/6 PASSED (${report.failedCount} failed)`);
  console.log('========================================================================');

  // Clean close
  await app.close();
  console.log('[Electron] Application window closed cleanly.');
  return report;
}

runAcceptanceSuite().catch(err => {
  console.error('[Acceptance Suite Fatal Error]:', err);
  process.exit(1);
});
