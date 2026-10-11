const fs = require('fs');
const preload = fs.readFileSync('preload.js', 'utf8');
const html = fs.readFileSync('desktop-companion.html', 'utf8');

const requiredInPreload = [
  'blenderTDInquire',
  'blenderTDInspectAsset',
  'blenderTDBuildScene',
  'whatsappGatewayInit',
  'whatsappGatewayStatus',
  'whatsappGatewaySend',
  'whatsappGatewayMessages',
  'whatsappGatewayOpenManual'
];

let ok = true;
requiredInPreload.forEach(k => {
  if (!preload.includes(k)) {
    console.error('MISSING IN PRELOAD:', k);
    ok = false;
  }
});

const matches = html.match(/require\s*\(\s*['"]electron['"]\s*\)/g);
if (matches) {
  console.error('FOUND ROGUE require(electron) IN HTML:', matches.length);
  ok = false;
}

const childProcMatches = html.match(/require\s*\(\s*['"]child_process['"]\s*\)/g);
if (childProcMatches) {
  console.error('FOUND ROGUE require(child_process) IN HTML:', childProcMatches.length);
  ok = false;
}

if (ok) {
  console.log('✅ ALL PRELOAD BRIDGES & HTML ELECTRON CALLS VERIFIED 100% CLEAN!');
} else {
  process.exit(1);
}
