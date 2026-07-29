/* The ash panel owns every gesture while unsolved, and none once solved. */
import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = process.env.SITE_URL || 'http://localhost:8000/index.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (n, ok) => results.push([n, ok]);

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));

async function openWith(unlocked) {
  await page.goto(URL, { waitUntil: 'networkidle2' });
  await sleep(500);
  await page.evaluate((u) => localStorage.setItem('ardh:unlocked', JSON.stringify(u)), unlocked);
  await page.reload({ waitUntil: 'networkidle2' });
  await sleep(1800);
  await page.evaluate(() => document.getElementById('bhasma').scrollIntoView({ behavior: 'instant' }));
  await sleep(1000);
  return page.evaluate(() => {
    const w = document.querySelector('#bhasma .wipe').getBoundingClientRect();
    return {
      mid: { x: Math.round(w.x + w.width / 2), y: Math.round(w.y + w.height / 2) },
      box: { x: Math.round(w.x), y: Math.round(w.y), w: Math.round(w.width), h: Math.round(w.height) },
      scrollY: window.scrollY,
      touchAction: getComputedStyle(document.querySelector('#bhasma .wipe')).touchAction,
    };
  });
}

/* --- Unsolved: gestures wipe, nothing scrolls ---------------------------- */
let s = await openWith(['amavasya']);
check(`unsolved panel claims gestures (touch-action: ${s.touchAction})`, s.touchAction === 'none');

/* A vertical drag must NOT scroll the page. */
await page.touchscreen.touchStart(s.mid.x, s.mid.y);
for (let i = 1; i <= 12; i++) await page.touchscreen.touchMove(s.mid.x, s.mid.y + i * 30);
await page.touchscreen.touchEnd();
await sleep(1200);
check('unsolved: vertical drag over the panel does not scroll',
  (await page.evaluate(() => window.scrollY)) === s.scrollY);

/* A diagonal, scribbly wipe — the way a person actually does it — must clear
   the ash without the scroller stealing the vertical component. */
s = await openWith(['amavasya']);
for (let pass = 0; pass < 7; pass++) {
  const y = s.box.y + 30 + pass * ((s.box.h - 60) / 6);
  await page.touchscreen.touchStart(s.box.x + 40, y);
  for (let i = 1; i <= 12; i++) {
    await page.touchscreen.touchMove(
      s.box.x + 40 + (s.box.w - 80) * (i / 12),
      y + Math.sin(i / 2) * 26            /* wobble, like a real hand */
    );
  }
  await page.touchscreen.touchEnd();
}
await sleep(1400);
const wiped = await page.evaluate(() => ({
  href: location.href,
  sections: document.querySelectorAll('.section').length,
  bodyKids: document.body.childElementCount,
  solved: !!document.getElementById('bhasma')?.classList.contains('is-solved'),
  scrollY: window.scrollY,
}));
console.log('  after wipe:', JSON.stringify(wiped));
check('unsolved: a diagonal scribbly wipe clears the ash', wiped.solved);
check('unsolved: wiping never scrolls the page', wiped.scrollY === s.scrollY);

/* --- Solved: the area hands every gesture back --------------------------- */
s = await openWith(['amavasya', 'bhasma', 'ardhanarishvara']);
check(`solved panel releases gestures (touch-action: ${s.touchAction})`, s.touchAction === 'auto');

await page.touchscreen.touchStart(s.mid.x, s.mid.y);
for (let i = 1; i <= 10; i++) await page.touchscreen.touchMove(s.mid.x, s.mid.y - i * 24);
await page.touchscreen.touchEnd();
await sleep(1400);
check('solved: finger scroll works over the panel',
  (await page.evaluate(() => window.scrollY)) !== s.scrollY);

check('no JS errors', errs.length === 0);
if (errs.length) console.log('errors:', errs);

await browser.close();

console.log('\n=== ash gestures ===');
let failed = 0;
for (const [n, ok] of results) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}`); }
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
