const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const page = await context.newPage();
  const commentsRequests = [];
  page.on('request', (request) => {
    const url = request.url();
    if (request.method() === 'GET' && url.includes('/api/comments?paragraphId=')) {
      commentsRequests.push(url);
    }
  });
  await page.goto('/documento');
  const loginTrigger = page.getByRole('button', { name: 'Fazer login' }).first();
  await loginTrigger.waitFor({ state: 'visible', timeout: 10000 });
  console.log('initial comments requests', commentsRequests.length);
  await page.waitForTimeout(2000);
  await loginTrigger.click({ force: true });
  await page.waitForTimeout(2000);
  const dialogCount = await page.locator('[role="dialog"]').count();
  console.log('dialog count after click', dialogCount);
  const dialogVisible = await page.locator('[role="dialog"]').first().isVisible().catch(() => false);
  console.log('dialog visible after click', dialogVisible);
  if (dialogCount > 0) {
    console.log('dialog html', await page.locator('[role="dialog"]').first().evaluate((el) => el.outerHTML));
  }
  await page.locator('#login-modal-username').fill('luiz');
  await page.locator('#login-modal-password').fill('luiz123');
  await page.getByRole('button', { name: 'Entrar' }).first().click({ force: true });
  await page.waitForTimeout(2000);
  console.log('login button count', await page.getByRole('button', { name: 'Sair' }).count());
  console.log('comments requests after login', commentsRequests.length, commentsRequests.slice(-5));
  await browser.close();
})();
