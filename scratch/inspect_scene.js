const { sendBridgeRPC } = require('../src/main/tools/blenderAstraEngine');
const py = `
import bpy
cam = bpy.context.scene.camera
if cam:
    print('CAMERA:', cam.name, [round(v, 2) for v in cam.location])
lights = [(l.name, l.data.energy, [round(c, 2) for c in l.data.color]) for l in bpy.context.scene.objects if l.type == 'LIGHT']
print('LIGHTS:', lights)
objs = [(o.name, [round(v, 2) for v in o.location]) for o in bpy.context.scene.objects if o.type == 'MESH']
print('MESHES:', objs[:10])
`;
sendBridgeRPC('execute_bpy', { code: py, autoCapture: false }).then(r => console.log(r.stdout || r));
