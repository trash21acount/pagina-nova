const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const page = await context.newPage();
  await page.goto('/documento');
  await page.waitForSelector('button:has-text("Fazer login")', { state: 'visible', timeout: 10000 });
  await page.waitForTimeout(500);
  await page.click('button:has-text("Fazer login")', { force: true });
  await page.waitForTimeout(2000);
  console.log('dialog count', await page.locator('[role="dialog"]').count());
  console.log('dialog visible', await page.locator('[role="dialog"]').first().isVisible().catch((err) => err.message));
  await browser.close();
})();
