const fs = require('fs');
const http = require('http');
const path = require('path');

const tmpFile = path.resolve(__dirname, 'temp_objects.json').replace(/\\/g, '/');

const py = `
import bpy, json
data = []
for o in bpy.context.scene.objects:
    if any(k in o.name.lower() for k in ['chair', 'seat', 'cushion', 'house', 'roof', 'window', 'motorcycle']):
        data.append({
            'name': o.name,
            'type': o.type,
            'local_loc': [round(v, 3) for v in o.location],
            'world_loc': [round(v, 3) for v in o.matrix_world.translation],
            'parent': o.parent.name if o.parent else None,
            'materials': [m.name for m in o.data.materials] if hasattr(o.data, 'materials') and o.data.materials else []
        })
with open(r"${tmpFile}", "w", encoding="utf-8") as f:
    json.dump(data, f)
`;

const payload = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'execute_bpy',
  params: { code: py, autoCapture: false }
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
  res.on('end', () => {
    setTimeout(() => {
      if (fs.existsSync(tmpFile)) {
        const d = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
        console.log(`Found ${d.length} matching objects:`);
        d.forEach(o => console.log(`  - ${o.name} | parent: ${o.parent} | local: [${o.local_loc}] | world: [${o.world_loc}] | mats: [${o.materials}]`));
        fs.unlinkSync(tmpFile);
      } else {
        console.log('No temp file generated');
      }
    }, 400);
  });
  res.resume();
});

req.write(payload);
req.end();
