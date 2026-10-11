const desktopAutomator = require('../desktop-automator');

(async () => {
  console.log('Testing desktopAutomator.sendWhatsAppMessage with Max Mode Gateway priority...');
  
  // Test with a mock contact or self
  // We check if it selects method 'whatsapp_gateway_headless'
  const res = await desktopAutomator.sendWhatsAppMessage('Nikki', 'Test ping from UNIN Autonomous Agent');
  console.log('Result:', res);

  if (res && res.method === 'whatsapp_gateway_headless') {
    console.log('🎉 SUCCESS: sendWhatsAppMessage executed via Headless Gateway (0% screen hijacking)!');
    process.exit(0);
  } else {
    console.error('❌ Failed: unexpected method:', res?.method);
    process.exit(1);
  }
})();
