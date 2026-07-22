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
  await page.waitForTimeout(1000);
  const htmlContainsDialog = await page.evaluate(() => document.body.innerHTML.includes('role="dialog"'));
  console.log('dialog string present', htmlContainsDialog);
  const dialogHtml = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    return d ? d.outerHTML : null;
  });
  console.log('dialog outerHTML', dialogHtml);
  const openState = await page.evaluate(() => {
    return {
      hasLoginModal: !!document.querySelector('[role="dialog"]'),
      numDialogs: document.querySelectorAll('[role="dialog"]').length,
      numButtons: document.querySelectorAll('button').length,
    };
  });
  console.log('openState', openState);
  await browser.close();
})();
