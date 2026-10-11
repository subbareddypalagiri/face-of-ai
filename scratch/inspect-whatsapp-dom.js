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

  const domInfo = await page.evaluate(() => {
    const searchInputs = Array.from(document.querySelectorAll('div[contenteditable="true"], input[type="text"], [role="textbox"]')).map(el => ({
      tagName: el.tagName,
      role: el.getAttribute('role'),
      dataTab: el.getAttribute('data-tab'),
      dataTestid: el.getAttribute('data-testid'),
      ariaLabel: el.getAttribute('aria-label'),
      title: el.getAttribute('title')
    }));

    const chatItems = Array.from(document.querySelectorAll('#pane-side div[role="listitem"], #pane-side [data-testid="cell-frame-container"]')).slice(0, 5).map(el => {
      const titleSpan = el.querySelector('span[title]');
      return titleSpan ? titleSpan.getAttribute('title') : el.innerText.split('\n')[0];
    });

    return {
      title: document.title,
      inputs: searchInputs,
      sampleChats: chatItems
    };
  });

  console.log('DOM Info:', JSON.stringify(domInfo, null, 2));
  await context.close();
  process.exit(0);
})();
