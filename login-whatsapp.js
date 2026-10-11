// login-whatsapp.js — Open Visible Browser for 1-Click WhatsApp QR Scan
const { WhatsAppGateway } = require('./unin-whatsapp-gateway');

console.log('====================================================');
console.log('  OPENING VISIBLE BROWSER FOR WHATSAPP LINKING...   ');
console.log('====================================================');
console.log('1. A visible browser window will open in a moment.');
console.log('2. Scan the QR code with WhatsApp on your phone.');
console.log('3. Once linked, session is saved permanently in ./unin_whatsapp_session.\n');

const gateway = new WhatsAppGateway({ headless: false });

gateway.on('ready', () => {
  console.log('\n🎉 SUCCESS! WhatsApp linked and authenticated!');
  console.log('You can now close the browser window or press Ctrl+C.');
  console.log('UNIN can now send and read messages silently in the background.');
});

gateway.init();
