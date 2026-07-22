const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__clicks = [];
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof HTMLElement) {
        window.__clicks.push({ tag: target.tagName, text: target.innerText, id: target.id, classes: target.className });
      }
    }, true);
  });
  page.on('console', (msg) => console.log('CONSOLE', msg.text()));
  await page.goto('/documento');
  console.log('page loaded');
  await page.click('button:has-text("Fazer login")');
  console.log('clicked login trigger');
  await page.waitForTimeout(1000);
  const clicks = await page.evaluate(() => window.__clicks);
  console.log('clicks', clicks);
  const dialogExists = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
  console.log('dialogExists', dialogExists);
  await browser.close();
})();
