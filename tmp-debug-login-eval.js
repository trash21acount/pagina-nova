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
  await page.goto('/documento');
  await page.waitForTimeout(2000);
  await page.click('button:has-text("Fazer login")');
  await page.waitForTimeout(1000);
  await page.fill('#login-modal-username', 'luiz');
  await page.fill('#login-modal-password', 'luiz123');
  await page.evaluate(() => {
    const btn = document.querySelector('[role="dialog"] button[type="button"]:not([class*=\"cancel\"])');
    console.log('eval button found', !!btn, btn?.textContent);
    if (btn) btn.click();
  });
  await page.waitForTimeout(2000);
  await browser.close();
})();
