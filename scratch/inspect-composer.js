const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const sessionDir = path.join(__dirname, '..', 'unin_whatsapp_session');
  const context = await chromium.launchPersistentContext(sessionDir, {
    headless: true,
    channel: 'msedge',
    viewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
  await page.goto('https://web.whatsapp.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);

  // Click on the first chat
  const firstChat = await page.$('#pane-side div[role="listitem"]');
  if (firstChat) {
    console.log('Clicking first chat...');
    await firstChat.click();
    await page.waitForTimeout(2000);

    const composerInfo = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('footer div[contenteditable="true"], footer [role="textbox"], [data-testid="conversation-compose-box-input"], [aria-label*="Type a message"]')).map(el => ({
        tagName: el.tagName,
        role: el.getAttribute('role'),
        dataTab: el.getAttribute('data-tab'),
        dataTestid: el.getAttribute('data-testid'),
        ariaLabel: el.getAttribute('aria-label')
      }));
      const sendBtns = Array.from(document.querySelectorAll('button[aria-label*="Send"], [data-testid="send"], [data-icon="send"]')).map(el => ({
        ariaLabel: el.getAttribute('aria-label'),
        dataTestid: el.getAttribute('data-testid')
      }));
      return { composers: els, sendBtns };
    });

    console.log('Composer info:', JSON.stringify(composerInfo, null, 2));
  }

  await context.close();
  process.exit(0);
})();
