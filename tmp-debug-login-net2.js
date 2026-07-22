const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const page = await context.newPage();
  page.on('console', msg => console.log('CONSOLE', msg.text()));
  page.on('pageerror', err => console.log('PAGEERROR', err.message));
  page.on('request', request => {
    if (request.url().includes('/api/login')) {
      console.log('REQUEST', request.method(), request.url(), request.postData());
    }
  });
  page.on('response', async response => {
    if (response.url().includes('/api/login')) {
      console.log('RESPONSE', response.status(), await response.text().catch(() => '<no body>'));
      console.log('response headers', response.headers());
    }
  });
  await page.goto('/documento');
  await page.waitForSelector('button:has-text("Fazer login")', { state: 'visible', timeout: 10000 });
  await page.click('button:has-text("Fazer login")', { force: true });
  await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10000 });
  await page.fill('#login-modal-username', 'luiz');
  await page.fill('#login-modal-password', 'luiz123');
  await page.click('button:has-text("Entrar")', { force: true });
  const post = await page.waitForRequest((r) => r.url().includes('/api/login') && r.method() === 'POST', { timeout: 10000 }).catch((err) => {
    console.log('no post request', err.message);
    return null;
  });
  console.log('post request observed', !!post, post && post.postData());
  const body = await page.evaluate(() => document.body.innerText);
  console.log('body contains Sair?', body.includes('Sair'));
  const modalText = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    return dialog ? dialog.textContent : null;
  });
  console.log('dialog text', modalText && modalText.slice(0, 400));
  await page.screenshot({ path: 'tmp-login-net2.png', fullPage: true });
  await browser.close();
})();
