const { AssetResolver } = require('../src/main/tools/astra/core/AssetResolver');

async function testResolution() {
  const resolver = new AssetResolver();
  const testCases = [
    { name: 'Ergonomic office chair with armrests', category: 'furniture' },
    { name: 'Executive wooden office desk with drawers', category: 'furniture' },
    { name: 'Sleek glass smartphone with camera lenses', category: 'electronics' },
    { name: 'Desktop computer tower with monitor and keyboard', category: 'electronics' },
    { name: 'High-performance red sports car', category: 'vehicle' },
    { name: 'Hero chopper motorcycle with chrome exhaust', category: 'vehicle' },
    { name: 'Modern residential small house with pitched roof', category: 'architecture' },
    { name: 'Canopy forest tree with branching foliage', category: 'vegetation' },
    { name: 'Mythical winged dragon creature', category: 'creature' },
    { name: 'Commercial passenger jet airliner', category: 'vehicle' },
    { name: 'Futuristic delta-wing spaceship interceptor', category: 'vehicle' }
  ];

  console.log('--- ASSET RESOLVER BENCHMARK RESULTS ---');
  for (const tc of testCases) {
    const entity = { id: `test_${tc.category}_${Date.now()}`, name: tc.name, category: tc.category, role: 'hero' };
    const res = await resolver.resolveEntity(entity);
    console.log(`\n[${tc.category.toUpperCase()}] "${tc.name}"`);
    console.log(`  Provider: ${res.provider}`);
    console.log(`  Strategy: ${res.strategy}`);
    console.log(`  AssemblyType: ${res.assemblyType || 'N/A'}`);
    console.log(`  Path: ${res.path || 'N/A'}`);
    console.log(`  Quality: ${res.qualityLevel}`);
    console.log(`  Reason: ${res.reason}`);
  }
}

testResolution().catch(console.error);
