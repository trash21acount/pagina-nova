const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const page = await context.newPage();
  page.on('console', (msg) => console.log('CONSOLE', msg.text()));
  await page.goto('/documento');
  console.log('page loaded');
  await page.evaluate(() => {
    const btn = document.querySelector('button:has-text("Fazer login")');
    console.log('eval button', btn ? 'found' : 'not found');
    if (btn) {
      btn.addEventListener('click', () => console.log('button clicked event fired'), { once: true });
    }
  });
  await page.click('button:has-text("Fazer login")');
  await page.waitForTimeout(1000);
  console.log('after click');
  const clickFired = await page.evaluate(() => {
    const btn = document.querySelector('button:has-text("Fazer login")');
    return btn ? btn.getAttribute('data-clicked') : 'no-btn';
  });
  console.log('clickFired', clickFired);
  await browser.close();
})();
