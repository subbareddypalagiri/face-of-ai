const fs = require('fs');
const path = require('path');

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let missing = [];
  const builtins = new Set(['fs', 'path', 'os', 'child_process', 'crypto', 'events', 'http', 'https', 'tls', 'net', 'url', 'util', 'stream', 'buffer', 'assert', 'zlib', 'electron', 'v8', 'perf_hooks', 'worker_threads', 'cluster', 'readline', 'string_decoder', 'dgram', 'dns']);

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'vendor' || entry.name === 'dist') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      missing = missing.concat(scanDir(fullPath));
    } else if (entry.name.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const regex = /require\(['"]([^'"]+)['"]\)/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const pkg = match[1];
        if (pkg.startsWith('.') || pkg.startsWith('/') || pkg.includes(':\\')) continue;
        const mainPkg = pkg.startsWith('@') ? pkg.split('/').slice(0, 2).join('/') : pkg.split('/')[0];
        if (builtins.has(mainPkg)) continue;
        try {
          require.resolve(pkg);
        } catch (e) {
          missing.push({ file: path.relative('.', fullPath), pkg: mainPkg });
        }
      }
    }
  }
  return missing;
}

const missing = scanDir('.');
const unique = {};
for (const m of missing) {
  if (!unique[m.pkg]) unique[m.pkg] = [];
  unique[m.pkg].push(m.file);
}

console.log('MISSING MODULES SUMMARY:');
console.log(JSON.stringify(unique, null, 2));
