const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const page = await context.newPage();
  await page.goto('/documento');
  await page.waitForTimeout(2000);
  const count = await page.getByRole('button', { name: 'Fazer login' }).count();
  console.log('role count', count);
  for (let i = 0; i < count; i++) {
    const locator = page.getByRole('button', { name: 'Fazer login' }).nth(i);
    const visible = await locator.isVisible();
    const html = await locator.evaluate((el) => el.outerHTML);
    console.log('button', i, visible, html);
  }
  await page.click('button:has-text("Fazer login")', { force: true });
  await page.waitForTimeout(1500);
  console.log('after click dialog count css', await page.locator('[role="dialog"]').count());
  await page.reload();
  await page.waitForTimeout(2000);
  const count2 = await page.getByRole('button', { name: 'Fazer login' }).count();
  console.log('role count after reload', count2);
  for (let i = 0; i < count2; i++) {
    const locator = page.getByRole('button', { name: 'Fazer login' }).nth(i);
    const visible = await locator.isVisible();
    const html = await locator.evaluate((el) => el.outerHTML);
    console.log('button after reload', i, visible, html);
  }
  await browser.close();
})();
