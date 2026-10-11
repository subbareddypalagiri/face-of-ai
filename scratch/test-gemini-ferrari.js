const fs = require('fs');
const path = require('path');
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));
const { executeBlenderScript } = require('../blender-live-bridge');

const prompt = 'Red Ferrari SF90 on wet racing track at midnight with rain reflections and tire smoke';

async function run() {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + cfg.gemini_key;

  const systemInstruction = `You are a World-Class Principal 3D Technical Artist & Blender 5.1 Python Engineer.
Your job is to generate 100% executable Blender 5.1 Python ('bpy') code responding to the user's prompt.
CRITICAL OPERATIONAL RULES:
1. OUTPUT ONLY RAW EXECUTABLE PYTHON CODE inside a single \`\`\`python code block. No explanations.
2. ABSOLUTELY NEVER call bpy.ops.wm.read_factory_settings() or bpy.ops.wm.quit_blender().
3. Clear existing objects:
   for obj in list(bpy.context.scene.objects):
       bpy.data.objects.remove(obj, do_unlink=True)
4. BLENDER 5.1 RULES:
   - When creating or modifying materials, ALWAYS use:
     def get_bsdf(mat):
         if not mat.use_nodes: mat.use_nodes = True
         b = mat.node_tree.nodes.get('Principled BSDF')
         if not b:
             for n in mat.node_tree.nodes:
                 if n.type == 'BSDF_PRINCIPLED': return n
             b = mat.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
         return b
   - Always check before assigning:
     bsdf = get_bsdf(mat)
     if 'Base Color' in bsdf.inputs: bsdf.inputs['Base Color'].default_value = (r, g, b, 1.0)
     if 'Metallic' in bsdf.inputs: bsdf.inputs['Metallic'].default_value = float(...)
     if 'Roughness' in bsdf.inputs: bsdf.inputs['Roughness'].default_value = float(...)
   - Set EEVEE engine in Blender 5.1:
     bpy.context.scene.render.engine = 'BLENDER_EEVEE'
   - In EEVEE / Blender 5.1, NEVER set use_bloom or eevee.bloom!
5. Build the Red Ferrari SF90 supercar on wet racing track with puddle reflections and tire smoke.`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 6000 }
    })
  });

  const data = await resp.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    console.error('No candidate returned:', data);
    return;
  }

  let code = rawText.match(/```(?:python|py)?([\s\S]*?)```/i)?.[1]?.trim() || rawText;
  fs.writeFileSync('scratch/gemini_ferrari.py', code, 'utf8');
  console.log('Gemini generated code bytes:', code.length);

  const res = await executeBlenderScript(code, {
    renderPngPath: 'scratch/gemini_render.png',
    timeoutMs: 60000
  });

  console.log('Blender execution result:', res.success);
  if (!res.success) {
    console.log('Error:', res.error);
  } else {
    console.log('Render saved to scratch/gemini_render.png');
  }
}

run().catch(console.error);
