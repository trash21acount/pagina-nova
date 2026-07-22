const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const page = await context.newPage();
  page.on('console', msg => console.log('CONSOLE', msg.text()));
  await page.goto('/documento');
  await page.waitForTimeout(3000);
  const loginTrigger = page.getByRole('button', { name: 'Fazer login' }).first();
  console.log('login trigger count', await loginTrigger.count());
  console.log('login trigger visible', await loginTrigger.isVisible());
  await loginTrigger.click({ force: true });
  await page.waitForTimeout(1000);
  const dialog = page.locator('[role="dialog"]').first();
  console.log('dialog count', await dialog.count());
  console.log('dialog visible', await dialog.isVisible().catch((err) => err.message));
  if (await dialog.count() > 0) {
    console.log('dialog html', await dialog.evaluate((el) => el.outerHTML));
  }
  await browser.close();
})();
