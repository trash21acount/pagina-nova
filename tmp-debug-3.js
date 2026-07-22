const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const page = await context.newPage();
  page.on('console', (msg) => console.log('CONSOLE', msg.text()));
  await page.goto('/documento');
  console.log('page loaded');
  await page.click('button:has-text("Fazer login")');
  console.log('clicked login trigger');
  await page.waitForTimeout(5000);
  const dialogCount = await page.evaluate(() => document.querySelectorAll('[role="dialog"]').length);
  console.log('dialog count', dialogCount);
  const htmlSnippet = await page.evaluate(() => {
    const el = document.querySelector('body');
    return el ? el.innerHTML.slice(0, 2000) : 'no body';
  });
  console.log('body snippet', htmlSnippet);
  await browser.close();
})();
