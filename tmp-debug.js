const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const page = await context.newPage();
  page.on('console', (msg) => console.log('CONSOLE', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.log('PAGEERROR', err));
  page.on('request', (req) => {
    if (req.url().includes('/api/login')) console.log('REQUEST', req.method(), req.url());
    if (req.url().includes('/api/comments')) console.log('REQUEST COMMENTS', req.method(), req.url());
  });
  page.on('response', (res) => {
    if (res.url().includes('/api/login')) console.log('RESPONSE', res.status(), res.url());
  });
  await page.goto('/documento');
  console.log('page loaded');
  await page.getByRole('button', { name: 'Fazer login' }).click();
  console.log('clicked login trigger');
  const loginDialog = page.locator('div[role="dialog"]');
  await loginDialog.waitFor({ state: 'visible', timeout: 10000 });
  console.log('dialog visible');
  const buttons = await loginDialog.locator('button').allTextContents();
  console.log('dialog buttons', buttons);
  await loginDialog.locator('#login-modal-username').fill('luiz');
  await loginDialog.locator('#login-modal-password').fill('luiz123');
  console.log('filled');
  const enterButton = loginDialog.locator('button', { hasText: 'Entrar' }).first();
  console.log('enterButton count', await enterButton.count());
  await enterButton.click();
  console.log('clicked enter');
  await page.waitForTimeout(5000);
  await browser.close();
})();
