const http = require('http');

const code = `
import bpy
for o in bpy.context.scene.objects:
    if o.type in ('MESH', 'EMPTY'):
        print(f"OBJ: {o.name} | loc: {[round(v, 2) for v in o.location]} | matrix_world_loc: {[round(v, 2) for v in o.matrix_world.translation]} | parent: {o.parent.name if o.parent else None}")
`;

const payload = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'execute_bpy',
  params: { code, autoCapture: true }
});

const req = http.request({
  hostname: '127.0.0.1',
  port: 8192,
  path: '/rpc',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, res => {
  let d = '';
  res.on('data', chunk => d += chunk);
  res.on('end', () => {
    try {
      const j = JSON.parse(d);
      console.log(j.result ? j.result.stdout : j);
    } catch (e) {
      console.log(d);
    }
  });
});

req.write(payload);
req.end();
