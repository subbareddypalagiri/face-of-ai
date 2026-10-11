const fs = require('fs');
const path = require('path');
const { sendBridgeRPC } = require('../src/main/tools/blenderAstraEngine');

async function inject() {
  const pyCode = fs.readFileSync(path.join(__dirname, 'test_blender_ui_panel.py'), 'utf8');
  console.log("Injecting FAANG-grade in-Blender N-Panel UI into Blender 5.1...");
  const res = await sendBridgeRPC('execute_bpy', { code: pyCode, autoCapture: false });
  console.log("INJECTION RESULT:", res.success, res.error);
}

inject().catch(console.error);
