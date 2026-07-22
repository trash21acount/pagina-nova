const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const page = await context.newPage();
  page.on('console', (msg) => console.log('CONSOLE', msg.text()));
  page.on('request', (req) => {
    if (req.url().includes('/api/login')) console.log('REQUEST', req.method(), req.url(), req.postData());
  });
  page.on('response', (res) => {
    if (res.url().includes('/api/login')) console.log('RESPONSE', res.status(), res.url());
  });
  try {
    await page.goto('/documento');
    await page.waitForTimeout(2000);
    const initialLoginButtons = await page.locator('button:has-text("Fazer login")').count();
    console.log('initial login buttons', initialLoginButtons);
    await page.click('button:has-text("Fazer login")');
    await page.waitForTimeout(1000);
    const dialogCount = await page.locator('[role="dialog"]').count();
    console.log('dialog count', dialogCount);
    if (dialogCount > 0) {
      const dialogHtml = await page.locator('[role="dialog"]').first().evaluate((el) => el.outerHTML);
      console.log('dialog html', dialogHtml.slice(0, 500));
    }
    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input')).map((el) => ({ id: el.id, type: el.type, value: (el as HTMLInputElement).value }));
    });
    console.log('inputs', inputs);
    await page.fill('#login-modal-username', 'luiz');
    await page.fill('#login-modal-password', 'luiz123');
    const enterButtonCount = await page.locator('button:has-text("Entrar")').count();
    const enterButtonTexts = await page.locator('button:has-text("Entrar")').allTextContents();
    console.log('enterButton count', enterButtonCount, enterButtonTexts);
    await page.click('button:has-text("Entrar")', { force: true });
    console.log('clicked enter');
    const resp = await page.waitForResponse((response) => response.url().includes('/api/login') && response.request().method() === 'POST', { timeout: 10000 }).catch((err) => {
      console.log('waitForResponse error', err.message);
      return null;
    });
    console.log('login response', !!resp, resp && resp.status());
    await page.waitForTimeout(2000);
    const buttonsAfter = await page.locator('button').allTextContents();
    console.log('buttons after login', buttonsAfter);
    const s = await page.locator('button:has-text("Sair")').count();
    console.log('logout button count', s);
  } catch (err) {
    console.error('ERROR', err);
  } finally {
    await browser.close();
  }
})();
