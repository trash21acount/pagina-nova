const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const page = await context.newPage();
  page.on('console', (msg) => console.log('CONSOLE', msg.text()));
  page.on('pageerror', (err) => console.log('PAGEERROR', err));
  page.on('request', (req) => { if (req.url().includes('/api/login')) console.log('REQUEST', req.method(), req.url()); });
  page.on('response', (res) => { if (res.url().includes('/api/login')) console.log('RESPONSE', res.status(), res.url()); });
  await page.goto('/documento');
  console.log('page loaded');
  const loginButtons = page.getByRole('button', { name: 'Fazer login' });
  console.log('login button count', await loginButtons.count());
  for (let i = 0; i < await loginButtons.count(); i++) {
    const button = loginButtons.nth(i);
    console.log('button text', await button.textContent());
    console.log('button bbox', await button.boundingBox());
    console.log('button outerHTML', await button.evaluate((el) => el.outerHTML));
  }
  await page.getByRole('button', { name: 'Fazer login' }).first().click();
  console.log('clicked login trigger');
  await page.waitForTimeout(1000);
  console.log('after wait 1s');
  const loginDialog = page.locator('div[role="dialog"]');
  console.log('dialog count after click', await loginDialog.count());
  if ((await loginDialog.count()) > 0) {
    console.log('dialog visible state', await loginDialog.isVisible());
    console.log('dialog outerHTML', await loginDialog.first().evaluate((el) => el.outerHTML));
  }
  await browser.close();
})();
