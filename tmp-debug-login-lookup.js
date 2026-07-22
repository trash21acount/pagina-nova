const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const page = await context.newPage();
  page.on('console', msg => console.log('CONSOLE', msg.text()));
  await page.goto('/documento');
  await page.waitForTimeout(3000);
  console.log('before click dialog count', await page.locator('[role="dialog"]').count());
  console.log('before click login count', await page.getByRole('button', { name: 'Fazer login' }).count());
  await page.click('button:has-text("Fazer login")', { force: true });
  await page.waitForTimeout(2000);
  console.log('after click dialog count', await page.locator('[role="dialog"]').count());
  const bodyHtml = await page.evaluate(() => document.body.innerHTML.slice(0, 2000));
  console.log('body snippet', bodyHtml);
  await page.screenshot({ path: 'tmp-login-after-click.png', fullPage: true });
  await browser.close();
})();
