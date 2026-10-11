const { sendBridgeRPC } = require('../src/main/tools/blenderAstraEngine');
const py = `
import bpy
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r'C:/Users/subba/Downloads/prime -ps/face of me/assets/models/house.glb')
for o in bpy.context.scene.objects:
    print('OBJ:', o.name, 'DIM:', [round(v, 2) for v in o.dimensions], 'LOC:', [round(v, 2) for v in o.location])
`;
sendBridgeRPC('execute_bpy', { code: py, autoCapture: false }).then(r => console.log(r.stdout || r));
