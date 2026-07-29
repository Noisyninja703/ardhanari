/* Landscape isn't a supported layout, but rotating must not BREAK anything. */
import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = process.env.SITE_URL || 'http://localhost:8000/index.html';

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || CHROME,
  headless: true,
  args: ['--no-sandbox', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true });

const errs = [];
page.on('pageerror', (e) => errs.push(e.message));

await page.goto(URL, { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 900));
/* Sections are sealed until solved, so open them before inspecting layout. */
await page.evaluate(() =>
  localStorage.setItem('ardh:unlocked', JSON.stringify(['amavasya', 'bhasma', 'ardhanarishvara']))
);
await page.reload({ waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 1500));
await page.evaluate(() => document.getElementById('bhasma').scrollIntoView({ behavior: 'instant' }));
await new Promise((r) => setTimeout(r, 1200));

const report = await page.evaluate(() => ({
  horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  wipeFitsWidth: document.querySelector('.wipe').getBoundingClientRect().width <= window.innerWidth,
  columnWidth: getComputedStyle(document.querySelector('.section__body')).width,
  everySectionReachable: [...document.querySelectorAll('.section')].every(
    (s) => s.getBoundingClientRect().height > 0
  ),
}));

console.log(JSON.stringify(report, null, 2), '\nerrors:', errs.length ? errs : 'none');
await page.screenshot({ path: 'landscape.png' });
await browser.close();
