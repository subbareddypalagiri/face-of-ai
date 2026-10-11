const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const sessionDir = path.join(process.cwd(), 'unin_whatsapp_session');
  console.log('Connecting to live session...');
  const ctx = await chromium.launchPersistentContext(sessionDir, {
    headless: true,
    channel: 'msedge',
    viewport: { width: 1280, height: 800 }
  });
  const page = ctx.pages()[0] || await ctx.newPage();
  await page.goto('https://web.whatsapp.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // Check if "Continue" button or modal is visible
  const continueBtn = await page.$('button:has-text("Continue"), [role="button"]:has-text("Continue")');
  console.log('Continue button found?', !!continueBtn);
  if (continueBtn) {
    console.log('Clicking Continue button to dismiss modal...');
    await continueBtn.click();
    await page.waitForTimeout(1000);
  }

  // Also press Escape just in case
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Take screenshot after dismiss
  await page.screenshot({ path: path.join(__dirname, 'after-dismiss.png') });
  console.log('Saved screenshot to scratch/after-dismiss.png');

  // Now test finding Nikki
  const nikkiChat = await page.$('#pane-side span[title="Nikki"]');
  console.log('Nikki chat directly found in chat list?', !!nikkiChat);

  await ctx.close();
  console.log('Test completed successfully!');
  process.exit(0);
})();
