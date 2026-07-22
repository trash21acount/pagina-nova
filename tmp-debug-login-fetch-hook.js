const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const page = await context.newPage();
  page.on('console', msg => console.log('CONSOLE', msg.text()));
  page.on('pageerror', err => console.log('PAGEERROR', err.message));
  await page.goto('/documento');
  await page.evaluate(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      console.log('FETCH CALL', input, init && init.method, init && init.body);
      try {
        const response = await originalFetch(input, init);
        console.log('FETCH RESPONSE', response.status, response.url);
        return response;
      } catch (err) {
        console.log('FETCH ERROR', err.message);
        throw err;
      }
    };
  });
  await page.waitForSelector('button:has-text("Fazer login")', { state: 'visible', timeout: 10000 });
  await page.click('button:has-text("Fazer login")', { force: true });
  await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10000 });
  await page.fill('#login-modal-username', 'luiz');
  await page.fill('#login-modal-password', 'luiz123');
  await page.click('button:has-text("Entrar")', { force: true });
  await page.waitForTimeout(3000);
  await browser.close();
})();
