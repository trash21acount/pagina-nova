const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const page = await context.newPage();
  const requests = [];
  const responses = [];
  page.on('request', request => {
    if (request.url().includes('/api/login')) {
      requests.push({ method: request.method(), url: request.url(), postData: request.postData() });
      console.log('REQUEST', request.method(), request.url(), request.postData());
    }
  });
  page.on('response', async response => {
    if (response.url().includes('/api/login')) {
      const text = await response.text().catch(() => '<no body>');
      responses.push({ status: response.status(), url: response.url(), body: text, headers: response.headers() });
      console.log('RESPONSE', response.status(), response.url(), text);
    }
  });
  await page.goto('/documento');
  await page.waitForSelector('button:has-text("Fazer login")', { state: 'visible', timeout: 10000 });
  await page.click('button:has-text("Fazer login")', { force: true });
  const loginDialog = await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10000 });
  console.log('dialog outerHTML', await loginDialog.evaluate(node => node.outerHTML));
  const enterButtons = await loginDialog.$$(':scope button:has-text("Entrar")');
  console.log('enter button count in dialog', enterButtons.length);
  if (enterButtons.length > 0) {
    console.log('enter button html', await enterButtons[0].evaluate(node => node.outerHTML));
    await enterButtons[0].click({ force: true });
  }
  await page.waitForTimeout(2000);
  console.log('requests', JSON.stringify(requests, null, 2));
  console.log('responses', JSON.stringify(responses, null, 2));
  const logoutCount = await page.locator('button:has-text("Sair")').count();
  console.log('logout count', logoutCount);
  const bodyText = await page.evaluate(() => document.body.outerText);
  console.log('body contains Sair', bodyText.includes('Sair'));
  console.log('body contains Fazer login', bodyText.includes('Fazer login'));
  await page.screenshot({ path: 'tmp-login-post.png', fullPage: true });
  await browser.close();
})();
