const { chromium } = require('playwright');
const path = require('path');

(async () => {
  try {
    const sessionDir = path.join(process.cwd(), 'unin_whatsapp_session');
    const ctx = await chromium.launchPersistentContext(sessionDir, {
      headless: true,
      channel: 'msedge',
      viewport: { width: 1280, height: 800 }
    });
    const p = ctx.pages()[0] || await ctx.newPage();
    console.log('Navigating...');
    await p.goto('https://web.whatsapp.com', { waitUntil: 'domcontentloaded' });
    await p.waitForSelector('#pane-side', { timeout: 20000 });
    console.log('✅ #pane-side verified!');

    // Test Search Selector
    const searchSelector = 'input[data-tab="3"], input[aria-label*="Search"], [data-testid="chat-list-search"]';
    const searchEl = await p.waitForSelector(searchSelector, { timeout: 8000 });
    console.log('✅ Search input found:', !!searchEl);

    if (searchEl) {
      await searchEl.click();
      await searchEl.fill('Nikki');
      await p.waitForTimeout(1500);

      // Find chat item
      const chatItems = await p.$$('#pane-side div[role="listitem"]');
      console.log('Found chat items after search:', chatItems.length);

      if (chatItems.length > 0) {
        await chatItems[0].click();
        await p.waitForTimeout(2000);

        // Find composer
        const composerSelector = 'footer div[contenteditable="true"], [data-testid="conversation-compose-box-input"], [aria-label*="Type a message"]';
        const composerEl = await p.waitForSelector(composerSelector, { timeout: 8000 });
        console.log('✅ Message composer found:', !!composerEl);

        const placeholder = await composerEl?.getAttribute('aria-label');
        console.log('Composer aria-label:', placeholder);
      }
    }

    await ctx.close();
    console.log('Test completed successfully!');
  } catch (err) {
    console.error('Test error:', err);
  }
})();
