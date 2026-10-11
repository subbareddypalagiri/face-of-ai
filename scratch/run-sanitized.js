const fs = require('fs');
const { executeBlenderScript } = require('../blender-live-bridge');

let code = fs.readFileSync('scratch/gemini_ferrari.py', 'utf8');
code = code.replace(/(?:scene|context\.scene)\.eevee\.\w+\s*=\s*[^;\n]+/g, '# [Blender 5.1 EEVEE-Next] Deprecated eevee property neutralized');
code = code.replace(/bpy\.context\.scene\.render\.engine\s*=\s*['"]BLENDER_EEVEE_NEXT['"]/g, "bpy.context.scene.render.engine = 'BLENDER_EEVEE'");

executeBlenderScript(code, {
  renderPngPath: 'scratch/gemini_sanitized_render.png',
  timeoutMs: 60000
}).then(res => {
  console.log('Sanitized execution result:', res.success);
  if (!res.success) {
    console.log('Error:', res.error);
  } else {
    console.log('Success! Render saved to scratch/gemini_sanitized_render.png');
  }
}).catch(console.error);
