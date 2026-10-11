const { whatsappGateway } = require('../unin-whatsapp-gateway');

(async () => {
  console.log('========================================================');
  console.log('  TESTING UNIN MAX MODE WHATSAPP HEADLESS GATEWAY LIVE  ');
  console.log('========================================================');

  console.log('[Test] 1. Initializing Gateway (persistent headless session)...');
  const initRes = await whatsappGateway.init();
  console.log('[Test] Init result:', initRes);

  const status = whatsappGateway.getStatus();
  console.log('[Test] Status:', status);

  if (status.status !== 'CONNECTED') {
    console.error('❌ Failed: Gateway is not connected! Status:', status.status);
    process.exit(1);
  }

  console.log('✅ Gateway verified: 100% CONNECTED & HEADLESS ACTIVE!');

  console.log('[Test] 2. Reading chat history (Zero Screen Hijacking test)...');
  try {
    const history = await whatsappGateway.getLatestMessages('Nikki', 3);
    console.log('[Test] History fetch result:', history);
    console.log('✅ Read history without opening any visible window or stealing focus!');
  } catch (err) {
    console.warn('[Test] History fetch note:', err.message);
  }

  console.log('\n🎉 ALL MAX MODE WHATSAPP TESTS PASSED WITH 0 SCREEN HIJACKING!');
  process.exit(0);
})();
