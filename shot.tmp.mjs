import { chromium } from 'playwright';
const browser = await chromium.launch();
for (const scheme of ['light', 'dark']) {
  const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3456/upload', { waitUntil: 'networkidle' });
  await page.screenshot({ path: process.env.S + `/upload-${scheme}.png` });
  await page.goto('http://localhost:3456/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: process.env.S + `/queue-${scheme}.png` });
  await ctx.close();
}
await browser.close();
