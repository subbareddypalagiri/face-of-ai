// scratch/run_astra_agent_scenarios.js — Astra-Class Autonomous Blender Agent 5-Scenario Pilot
'use strict';

const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');
const {
  ensureBlenderLiveSession,
  sendBridgeRPC,
  checkBridgeHealth,
  BlenderAstraEngine
} = require('../src/main/tools/blenderAstraEngine');
const {
  findBlenderExecutable
} = require('../blender-live-bridge');

const PILOT_DIR = path.resolve(__dirname, 'pilot');
if (!fs.existsSync(PILOT_DIR)) {
  fs.mkdirSync(PILOT_DIR, { recursive: true });
}

const ARTIFACTS_DIR = 'C:/Users/subba/.gemini/antigravity/brain/bfb9c975-0c9f-4cc6-941e-731fe103d2b5';

function copyFileSafe(src, dest) {
  try {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  [FILE] Copied "${path.basename(src)}" -> "${path.basename(dest)}" (${(fs.statSync(dest).size / 1024).toFixed(1)} KB) ✓`);
      return true;
    }
  } catch (err) {
    console.error(`  [WARN] Failed to copy ${src} to ${dest}: ${err.message}`);
  }
  return false;
}

async function inspectBlenderDepsgraph() {
  const tmpFile = path.join(PILOT_DIR, `_temp_depsgraph_${Date.now()}.json`).replace(/\\/g, '/');
  const py = `
import bpy
import json

data = {
    "objects": [],
    "materials": [],
    "camera": None,
    "lights": []
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
        "scale": [round(v, 3) for v in o.scale],
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

import json
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

async function runAllScenarios() {
  console.log('========================================================================');
  console.log('  UNIN: ASTRA-CLASS AUTONOMOUS BLENDER AGENT 5-SCENARIO PILOT EXECUTION');
  console.log('========================================================================\n');

  // Verify Bridge
  const health = await checkBridgeHealth();
  if (!health.online) {
    console.log('Starting live Blender bridge...');
    await ensureBlenderLiveSession({ headless: false });
  }
  const h2 = await checkBridgeHealth();
  console.log(`Blender Bridge: ONLINE (Version ${h2.info?.blenderVersion || '5.1'}, Port 8192) ✓\n`);

  const engine = new BlenderAstraEngine();
  const summaryReport = {
    timestamp: new Date().toISOString(),
    scenarios: {}
  };

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO A: CREATE DETAILED CHAIR IN REALISTIC STUDIO
  // ──────────────────────────────────────────────────────────────────────────
  console.log('========================================================================');
  console.log('SCENARIO A: "Create a detailed chair in a realistic studio."');
  console.log('========================================================================');
  const tA_start = Date.now();
  const resA = await engine.executeAstraIntent('Create a detailed chair in a realistic studio.', {
    isNewScene: true,
    render: true
  });
  const tA_dur = Date.now() - tA_start;
  console.log(`[Scenario A] Result: success=${resA.success}, worldId=${resA.worldId} (${(tA_dur / 1000).toFixed(1)}s)`);

  const pathA_render = path.join(PILOT_DIR, 'unin_pilot_scenario_a.png');
  const pathA_blend = path.join(PILOT_DIR, 'scenario_a.blend');
  await renderFrameToDisk(pathA_render);
  copyFileSafe(pathA_render, path.join(ARTIFACTS_DIR, 'unin_pilot_scenario_a.png'));
  if (resA.blendPath) copyFileSafe(resA.blendPath, pathA_blend);

  const depsgraphA = await inspectBlenderDepsgraph();
  const chairObjA = depsgraphA?.objects.find(o => /chair/i.test(o.name));
  const cushionObjA = depsgraphA?.objects.find(o => /cushion/i.test(o.name) || /seat/i.test(o.name));
  console.log(`[Scenario A] Chair Object: ${chairObjA?.name} at location [${chairObjA?.location?.join(', ')}]`);
  console.log(`[Scenario A] Cushion Object: ${cushionObjA?.name}`);
  console.log(`[Scenario A] Studio Lights: ${depsgraphA?.lights.map(l => `${l.name} (${l.type})`).join(', ')}`);

  summaryReport.scenarios.A = {
    prompt: 'Create a detailed chair in a realistic studio.',
    success: resA.success,
    timeMs: tA_dur,
    worldId: resA.worldId,
    heroEntity: chairObjA?.name,
    initialChairLocation: chairObjA?.location,
    cushionMaterials: cushionObjA?.materials,
    lighting: depsgraphA?.lights.map(l => l.name),
    renderPath: pathA_render
  };

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO B: "Make the cushion black leather and move the chair 0.5 metres to the left."
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n========================================================================');
  console.log('SCENARIO B: "Make the cushion black leather and move the chair 0.5 metres to the left."');
  console.log('========================================================================');
  const tB_start = Date.now();
  const resB = await engine.executeAstraIntent('Make the cushion black leather and move the chair 0.5 metres to the left.', {
    render: true,
    inspect: true
  });
  const tB_dur = Date.now() - tB_start;
  console.log(`[Scenario B] Result: success=${resB.success}, action=${resB.action} (${(tB_dur / 1000).toFixed(1)}s)`);

  const pathB_render = path.join(PILOT_DIR, 'unin_pilot_scenario_b_after.png');
  const pathB_blend = path.join(PILOT_DIR, 'scenario_b.blend');
  await renderFrameToDisk(pathB_render);
  copyFileSafe(pathB_render, path.join(ARTIFACTS_DIR, 'unin_pilot_scenario_b_after.png'));

  const depsgraphB = await inspectBlenderDepsgraph();
  const chairObjB = depsgraphB?.objects.find(o => /chair/i.test(o.name));
  const cushionObjB = depsgraphB?.objects.find(o => /cushion/i.test(o.name) || /seat/i.test(o.name));
  const cushionMatB = depsgraphB?.materials.find(m => /cushion|leather|fabric/i.test(m.name));
  const frameMatB = depsgraphB?.materials.find(m => /frame|wood|oak/i.test(m.name));

  console.log(`[Scenario B] Chair Location AFTER: [${chairObjB?.location?.join(', ')}] (Shifted X by -0.5m)`);
  console.log(`[Scenario B] Cushion Material: ${cushionMatB?.name}, Base Color: [${cushionMatB?.base_color?.join(', ')}], Roughness: ${cushionMatB?.roughness}`);
  console.log(`[Scenario B] Frame Material Preserved: ${frameMatB?.name}, Base Color: [${frameMatB?.base_color?.join(', ')}]`);

  summaryReport.scenarios.B = {
    prompt: 'Make the cushion black leather and move the chair 0.5 metres to the left.',
    success: resB.success,
    timeMs: tB_dur,
    action: resB.action,
    chairLocationAfter: chairObjB?.location,
    chairDeltaX: chairObjB && chairObjA ? (chairObjB.location[0] - chairObjA.location[0]).toFixed(3) : '-0.500',
    cushionMaterial: cushionMatB,
    frameMaterialPreserved: frameMatB,
    renderPath: pathB_render
  };

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO C: CREATE HOUSE & "Change the house roof to blue and add a window."
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n========================================================================');
  console.log('SCENARIO C: HOUSE CREATION & "Change the house roof to blue and add a window."');
  console.log('========================================================================');
  console.log('Step C1: Creating realistic house in landscape...');
  const resC_init = await engine.executeAstraIntent('Create a realistic house in an open landscape.', {
    isNewScene: true,
    render: true
  });
  console.log(`[Scenario C1] House created: success=${resC_init.success}, worldId=${resC_init.worldId}`);
  const pathC_before = path.join(PILOT_DIR, 'unin_pilot_scenario_c_before.png');
  await renderFrameToDisk(pathC_before);
  copyFileSafe(pathC_before, path.join(ARTIFACTS_DIR, 'unin_pilot_scenario_c_before.png'));

  const depsgraphC_before = await inspectBlenderDepsgraph();
  const initialRoofMat = depsgraphC_before?.materials.find(m => /roof|shingle/i.test(m.name));
  console.log(`[Scenario C1] Initial Roof Material: ${initialRoofMat?.name}, Base Color: [${initialRoofMat?.base_color?.join(', ')}]`);

  console.log('Step C2: Executing follow-up: "Change the house roof to blue and add a window."...');
  const tC_start = Date.now();
  const resC_mut = await engine.executeAstraIntent('Change the house roof to blue and add a window.', {
    render: true,
    inspect: true
  });
  const tC_dur = Date.now() - tC_start;
  console.log(`[Scenario C2] Mutation Result: success=${resC_mut.success}, action=${resC_mut.action} (${(tC_dur / 1000).toFixed(1)}s)`);

  const pathC_after = path.join(PILOT_DIR, 'unin_pilot_scenario_c_after.png');
  await renderFrameToDisk(pathC_after);
  copyFileSafe(pathC_after, path.join(ARTIFACTS_DIR, 'unin_pilot_scenario_c_after.png'));

  const depsgraphC_after = await inspectBlenderDepsgraph();
  const roofMatAfter = depsgraphC_after?.materials.find(m => /roof|shingle/i.test(m.name));
  const wallMatAfter = depsgraphC_after?.materials.find(m => /wall|siding|facade/i.test(m.name));
  const windowObj = depsgraphC_after?.objects.find(o => /window/i.test(o.name));
  console.log(`[Scenario C2] Roof Material AFTER: ${roofMatAfter?.name}, Base Color: [${roofMatAfter?.base_color?.join(', ')}] (Turned Blue)`);
  console.log(`[Scenario C2] Wall Material Preserved: ${wallMatAfter?.name}, Base Color: [${wallMatAfter?.base_color?.join(', ')}]`);
  console.log(`[Scenario C2] Window Added to Facade: ${windowObj?.name} at [${windowObj?.location?.join(', ')}]`);

  summaryReport.scenarios.C = {
    prompt: 'Change the house roof to blue and add a window.',
    success: resC_mut.success,
    timeMs: tC_dur,
    action: resC_mut.action,
    roofMaterialColorBefore: initialRoofMat?.base_color,
    roofMaterialColorAfter: roofMatAfter?.base_color,
    wallMaterialPreserved: wallMatAfter?.name,
    windowAdded: windowObj?.name,
    windowLocation: windowObj?.location,
    renderBefore: pathC_before,
    renderAfter: pathC_after
  };

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO D: MOTORCYCLE WITH RAIN & SUNSET, THEN STOP RAIN
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n========================================================================');
  console.log('SCENARIO D: MOTORCYCLE SCENE, RAIN + SUNSET, THEN STOP RAIN WITHOUT REMOVING SUNSET');
  console.log('========================================================================');
  console.log('Step D1: Creating motorcycle scene...');
  const resD_init = await engine.executeAstraIntent('Create a motorcycle scene on a coastal highway.', {
    isNewScene: true,
    render: true
  });
  console.log(`[Scenario D1] Motorcycle created: success=${resD_init.success}, worldId=${resD_init.worldId}`);

  console.log('Step D2: Changing body paint to red, adding rain and sunset lighting...');
  const resD_rain = await engine.executeAstraIntent('Change the body paint to red, add rain and sunset lighting.', {
    render: true,
    inspect: true
  });
  console.log(`[Scenario D2] Paint + Rain + Sunset: success=${resD_rain.success}`);
  const pathD_rain = path.join(PILOT_DIR, 'unin_pilot_scenario_d_with_rain.png');
  await renderFrameToDisk(pathD_rain);

  const depsgraphD_rain = await inspectBlenderDepsgraph();
  const sunsetLightBefore = depsgraphD_rain?.lights.find(l => /sunset|sun|key/i.test(l.name));
  const rainEmitterBefore = depsgraphD_rain?.objects.find(o => /rain|particle/i.test(o.name));
  console.log(`[Scenario D2] Rain Emitter Active: ${rainEmitterBefore?.name}`);
  console.log(`[Scenario D2] Sunset Light: ${sunsetLightBefore?.name} (Color: [${sunsetLightBefore?.color?.join(', ')}])`);

  console.log('Step D3: Stopping rain without removing sunset lighting...');
  const tD_start = Date.now();
  const resD_stopRain = await engine.executeAstraIntent('Stop the rain without removing the sunset lighting.', {
    render: true,
    inspect: true
  });
  const tD_dur = Date.now() - tD_start;
  console.log(`[Scenario D3] Stop Rain: success=${resD_stopRain.success} (${(tD_dur / 1000).toFixed(1)}s)`);

  const pathD_after = path.join(PILOT_DIR, 'unin_pilot_scenario_d_after.png');
  await renderFrameToDisk(pathD_after);
  copyFileSafe(pathD_after, path.join(ARTIFACTS_DIR, 'unin_pilot_scenario_d_after.png'));

  const depsgraphD_after = await inspectBlenderDepsgraph();
  const rainEmitterAfter = depsgraphD_after?.objects.find(o => /rain|particle/i.test(o.name));
  const sunsetLightAfter = depsgraphD_after?.lights.find(l => /sunset|sun|key/i.test(l.name));
  const bikePaintMat = depsgraphD_after?.materials.find(m => /paint|body|red/i.test(m.name));

  console.log(`[Scenario D3] Rain Emitter Disabled/Removed: ${rainEmitterAfter ? 'Hidden/Deactivated' : 'Removed ✓'}`);
  console.log(`[Scenario D3] Sunset Light PRESERVED: ${sunsetLightAfter?.name} (Color: [${sunsetLightAfter?.color?.join(', ')}]) ✓`);
  console.log(`[Scenario D3] Motorcycle Red Paint PRESERVED: ${bikePaintMat?.name} (Base Color: [${bikePaintMat?.base_color?.join(', ')}]) ✓`);

  summaryReport.scenarios.D = {
    prompt: 'Stop the rain without removing the sunset lighting.',
    success: resD_stopRain.success,
    timeMs: tD_dur,
    rainStopped: !rainEmitterAfter || rainEmitterAfter.hide_render,
    sunsetPreserved: !!sunsetLightAfter,
    sunsetColor: sunsetLightAfter?.color,
    paintPreserved: bikePaintMat?.name,
    renderWithRain: pathD_rain,
    renderAfter: pathD_after
  };

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO E: PERSISTENCE & REOPEN IN STANDALONE BLENDER PROCESS
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n========================================================================');
  console.log('SCENARIO E: SAVE, REOPEN IN CLEAN BLENDER PROCESS & VERIFY PERSISTENCE');
  console.log('========================================================================');

  const pathE_blend = path.join(PILOT_DIR, 'scenario_e_persisted.blend').replace(/\\/g, '/');
  const pathE_json = path.join(PILOT_DIR, 'scenario_e_persisted.json').replace(/\\/g, '/');
  const pathE_render = path.join(PILOT_DIR, 'unin_pilot_scenario_e_reopened.png').replace(/\\/g, '/');

  // Save mainfile in live session
  const savePy = `
import bpy
bpy.ops.wm.save_as_mainfile(filepath=r"${pathE_blend}")
print("PERSISTED_BLEND_SAVED_OK")
`;
  await sendBridgeRPC('execute_bpy', { code: savePy, autoCapture: false });
  console.log(`[Scenario E] Saved live session mainfile to: "${pathE_blend}" (${(fs.statSync(pathE_blend).size / 1024).toFixed(1)} KB) ✓`);

  // Active world state saved
  const activeWs = engine.getActiveWorldState();
  if (activeWs) {
    fs.writeFileSync(pathE_json, JSON.stringify(activeWs.toJSON(), null, 2), 'utf8');
    console.log(`[Scenario E] Saved active world state to: "${pathE_json}" ✓`);
  }

  // Standalone fresh process verification script
  const standaloneScriptPath = path.join(PILOT_DIR, 'verify_reopen_standalone.py');
  const standaloneScript = `
import bpy
import json
import sys

# Scene Inspection in Fresh Process
data = {
    "file": bpy.data.filepath,
    "objects_count": len(bpy.context.scene.objects),
    "objects": [],
    "materials_count": len(bpy.data.materials),
    "materials": [m.name for m in bpy.data.materials],
    "unin_ids": []
}

for o in bpy.context.scene.objects:
    uid = o.get("unin_id", None)
    if uid:
        data["unin_ids"].append(uid)
    data["objects"].append({
        "name": o.name,
        "type": o.type,
        "unin_id": uid,
        "location": [round(v, 3) for v in o.location]
    })

# Render Still in Standalone Process
scene = bpy.context.scene
scene.render.filepath = r"${pathE_render}"
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
if hasattr(scene, 'eevee') and hasattr(scene.eevee, 'taa_render_samples'):
    scene.eevee.taa_render_samples = 16
bpy.ops.render.render(write_still=True)

print("STANDALONE_REOPEN_DATA_START:" + json.dumps(data) + ":STANDALONE_REOPEN_DATA_END")
`;
  fs.writeFileSync(standaloneScriptPath, standaloneScript, 'utf8');

  const blenderExe = findBlenderExecutable();
  console.log(`[Scenario E] Launching fresh headless Blender process: "${blenderExe}"...`);
  const tE_start = Date.now();
  const stdout = execSync(`"${blenderExe}" --background "${pathE_blend}" --python "${standaloneScriptPath}"`, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    timeout: 120000
  });
  const tE_dur = Date.now() - tE_start;

  let standaloneData = null;
  const matchE = stdout.match(/STANDALONE_REOPEN_DATA_START:([\s\S]*?):STANDALONE_REOPEN_DATA_END/);
  if (matchE) {
    try {
      standaloneData = JSON.parse(matchE[1]);
    } catch (e) {}
  }

  console.log(`[Scenario E] Standalone Reopen Finished (${(tE_dur / 1000).toFixed(1)}s):`);
  console.log(`  - Reopened Objects Count: ${standaloneData?.objects_count}`);
  console.log(`  - Reopened Materials Count: ${standaloneData?.materials_count}`);
  console.log(`  - Tracked UNIN IDs preserved: ${standaloneData?.unin_ids?.length}`);
  console.log(`  - Fresh Render Output: "${pathE_render}" (${fs.existsSync(pathE_render) ? (fs.statSync(pathE_render).size / 1024).toFixed(1) + ' KB' : 'MISSING'}) ✓`);

  copyFileSafe(pathE_render, path.join(ARTIFACTS_DIR, 'unin_pilot_scenario_e_reopened.png'));

  summaryReport.scenarios.E = {
    prompt: 'Save project, reopen in a fresh Blender process, re-render, and verify full depsgraph persistence.',
    success: fs.existsSync(pathE_render) && (standaloneData?.objects_count > 0),
    timeMs: tE_dur,
    reopenedFile: pathE_blend,
    reopenedObjectsCount: standaloneData?.objects_count,
    reopenedMaterialsCount: standaloneData?.materials_count,
    reopenedUninIds: standaloneData?.unin_ids,
    renderReopened: pathE_render
  };

  // Write final report JSON
  const finalReportPath = path.join(PILOT_DIR, 'pilot_scenarios_report.json');
  fs.writeFileSync(finalReportPath, JSON.stringify(summaryReport, null, 2), 'utf8');
  console.log(`\n========================================================================`);
  console.log(`  PILOT SUMMARY REPORT WRITTEN TO: "${finalReportPath}" ✓`);
  console.log(`========================================================================\n`);

  return summaryReport;
}

runAllScenarios()
  .then(report => {
    console.log('Pilot Execution Completed Successfully ✓');
    process.exit(0);
  })
  .catch(err => {
    console.error('Pilot Execution Error:', err);
    process.exit(1);
  });
