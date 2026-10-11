const fs = require('fs');
const http = require('http');
const path = require('path');

const tmpFile = path.resolve(__dirname, 'temp_all_objects.json').replace(/\\/g, '/');

const py = `
import bpy, json
data = []
for o in bpy.context.scene.objects:
    data.append({
        'name': o.name,
        'type': o.type,
        'local': [round(v, 2) for v in o.location],
        'world': [round(v, 2) for v in o.matrix_world.translation],
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
        console.log(`Total objects: ${d.length}`);
        const chairs = d.filter(o => o.name.toLowerCase().includes('chair') || o.name.toLowerCase().includes('seat'));
        const houses = d.filter(o => o.name.toLowerCase().includes('house') || o.name.toLowerCase().includes('roof') || o.name.toLowerCase().includes('wall') || o.name.toLowerCase().includes('window') || o.name.toLowerCase().includes('facade') || o.name.toLowerCase().includes('cabin'));
        console.log(`Chair objects (${chairs.length}):`, chairs.map(c => `${c.name} (world: [${c.world}], mats: [${c.materials}])`));
        console.log(`House/Architecture objects (${houses.length}):`, houses.map(h => `${h.name} (world: [${h.world}], mats: [${h.materials}])`));
        fs.unlinkSync(tmpFile);
      }
    }, 400);
  });
  res.resume();
});

req.write(payload);
req.end();
