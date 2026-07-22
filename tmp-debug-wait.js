const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const page = await context.newPage();
  page.on('console', (msg) => console.log('CONSOLE', msg.text()));
  await page.goto('/documento');
  console.log('page loaded');
  await page.waitForTimeout(2000);
  console.log('waited 2s');
  await page.click('button:has-text("Fazer login")');
  console.log('clicked login trigger');
  await page.waitForTimeout(1000);
  const dialogExists = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
  console.log('dialogExists', dialogExists);
  await browser.close();
})();
