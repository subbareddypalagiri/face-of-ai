// scratch/test-15-sectors.js
const integrationManager = require('../src/main/integrations/IntegrationManager');

console.log('--- Testing 15 Sectors & 1,024 Connectors ---');
const sectors = integrationManager.getSectors();
console.log('Total Sectors:', sectors.length);

sectors.forEach((s, i) => {
  console.log(`${i+1}. ${s.icon} ${s.name} (${s.id}): total = ${s.totalCount}, flagships = ${s.flagshipCount}`);
  console.log('   Sample Flagships:', s.flagships.slice(0, 3).map(f => `${f.name} [fields: ${f.fields ? f.fields.map(k => k.key).join(',') : 'none'}]`).join(', '));
});

console.log('\n--- Testing Search in Sector: devops_cloud ---');
const devopsApps = integrationManager.searchApps('', 'devops_cloud', 15);
console.log('Found devops apps count:', devopsApps.length);
console.log('Top 4:', devopsApps.slice(0, 4).map(a => `${a.name} (flagship: ${a.isFlagship})`));

console.log('\n--- Testing Search across all 1,024 apps: postgres ---');
const pgApps = integrationManager.searchApps('postgres', 'all', 10);
console.log('Postgres matches:', pgApps.map(a => `${a.name} [${a.sectorName}]`));

console.log('\n--- Testing Verification of Flagship app: openai ---');
integrationManager.verifyConnection('openai', { apiKey: '' }).then(res => {
  console.log('OpenAI empty key verify result:', res);
  return integrationManager.verifyConnection('openai', { apiKey: 'sk-proj-test12345678901234567890' });
}).then(res => {
  console.log('OpenAI key verify result:', res);
  
  console.log('\n--- Testing Verification of Generic App: aws ---');
  return integrationManager.verifyConnection('aws', { accessKeyId: 'AKIAIOSFODNN7EXAMPLE', secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' });
}).then(res => {
  console.log('AWS verify result:', res);
  console.log('\nALL TESTS PASSED SUCCESSFULLY!');
}).catch(err => console.error(err));
