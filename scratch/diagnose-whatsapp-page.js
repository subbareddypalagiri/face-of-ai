const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const sessionDir = path.join(__dirname, '..', 'unin_whatsapp_session');
  console.log('Testing session in:', sessionDir);

  const context = await chromium.launchPersistentContext(sessionDir, {
    headless: true,
    channel: 'msedge',
    viewport: { width: 1280, height: 800 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
  console.log('Navigating to web.whatsapp.com...');
  await page.goto('https://web.whatsapp.com', { waitUntil: 'domcontentloaded', timeout: 60000 });

  console.log('Waiting 8 seconds for page to hydrate...');
  await page.waitForTimeout(8000);

  const title = await page.title();
  const url = page.url();
  console.log('Page Title:', title);
  console.log('Page URL:', url);

  const chatPane = await page.$('#pane-side, [data-testid="chat-list"]');
  console.log('Chat pane exists?', !!chatPane);

  const qrCanvas = await page.$('canvas[aria-label*="QR"], [data-ref], [data-testid="qrcode"]');
  console.log('QR Canvas exists?', !!qrCanvas);

  const textBody = await page.evaluate(() => document.body.innerText.slice(0, 300));
  console.log('Page text snippet:\n', textBody);

  await page.screenshot({ path: path.join(__dirname, 'whatsapp-diagnosis.png') });
  console.log('Saved screenshot to scratch/whatsapp-diagnosis.png');

  await context.close();
  console.log('Done!');
  process.exit(0);
})();
