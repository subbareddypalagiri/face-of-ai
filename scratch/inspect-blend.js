const { executeBlenderScript } = require('../blender-live-bridge');

const inspectPy = `
import bpy
bpy.ops.wm.open_mainfile(filepath='unin_cinematic_scene.blend')
print("OBJECTS_IN_BLEND:", [obj.name for obj in bpy.data.objects])
print("MATERIALS_IN_BLEND:", [mat.name for mat in bpy.data.materials])
`;

executeBlenderScript(inspectPy, { headless: true }).then(r => {
  const matchObj = r.stdout.match(/OBJECTS_IN_BLEND:.*\]/);
  const matchMat = r.stdout.match(/MATERIALS_IN_BLEND:.*\]/);
  if (matchObj) console.log(matchObj[0]);
  if (matchMat) console.log(matchMat[0]);
}).catch(console.error);
