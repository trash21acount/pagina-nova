const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const page = await context.newPage();
  page.on('console', msg => console.log('CONSOLE', msg.text()));
  await page.goto('/documento');
  await page.waitForTimeout(2000);
  const loginTrigger = page.getByRole('button', { name: 'Fazer login' }).first();
  console.log('login trigger count', await loginTrigger.count());
  console.log('login trigger visible', await loginTrigger.isVisible());
  await loginTrigger.click({ force: true });
  await page.waitForTimeout(2500);
  const dialogs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[role="dialog"]')).map((el) => {
      const style = getComputedStyle(el);
      return { outerHTML: el.outerHTML.slice(0, 400), visibility: style.visibility, opacity: style.opacity, display: style.display, className: el.className };
    });
  });
  console.log('dialogs', dialogs);
  await browser.close();
})();
