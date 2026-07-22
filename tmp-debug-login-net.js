const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const page = await context.newPage();
  page.on('console', msg => console.log('CONSOLE', msg.text()));
  page.on('request', request => {
    if (request.url().includes('/api/login')) {
      console.log('REQUEST', request.method(), request.url(), request.postData());
    }
  });
  page.on('response', async response => {
    if (response.url().includes('/api/login')) {
      console.log('RESPONSE', response.status(), await response.text().catch(() => '<no body>'));
      console.log('response headers', JSON.stringify(Object.fromEntries(response.headers())));
    }
  });
  await page.goto('/documento');
  await page.waitForSelector('button:has-text("Fazer login")', { state: 'visible', timeout: 10000 });
  await page.click('button:has-text("Fazer login")', { force: true });
  await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10000 });
  await page.fill('#login-modal-username', 'luiz');
  await page.fill('#login-modal-password', 'luiz123');
  await page.click('button:has-text("Entrar")', { force: true });
  const resp = await page.waitForResponse((r) => r.url().includes('/api/login') && r.request().method() === 'POST', { timeout: 10000 }).catch((err) => {
    console.log('waitForResponse failed', err.message);
    return null;
  });
  console.log('waitForResponse got', !!resp);
  const logoutButtonCount = await page.locator('button:has-text("Sair")').count();
  console.log('logout count', logoutButtonCount);
  const body = await page.evaluate(() => document.body.innerText);
  console.log('body contains Sair?', body.includes('Sair'));
  await browser.close();
})();
