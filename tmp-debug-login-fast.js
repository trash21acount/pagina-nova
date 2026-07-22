const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/documento');
  const loginTrigger = page.locator('button', { hasText: 'Fazer login' }).first();
  console.log('count', await loginTrigger.count());
  await loginTrigger.click({ force: true });
  await page.waitForTimeout(1000);
  console.log('dialog count after fast click', await page.locator('[role="dialog"]').count());
  await browser.close();
})();
