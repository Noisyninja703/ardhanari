/* Exposure must ramp with progress, sit under the poem, and never hide the
   particles. */
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

const exposure = () =>
  page.evaluate(() =>
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--exposure'))
  );

const litPixels = () =>
  page.evaluate(() => {
    const c = document.getElementById('particles');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
    return n;
  });

await page.goto(URL, { waitUntil: 'networkidle2' });
await sleep(2200);

check('exposure starts at 0 on a fresh visit', (await exposure()) === 0);
const litAtStart = await litPixels();
check(`particles are clearly visible (${litAtStart} lit pixels)`, litAtStart > 1200);

/* Stacking order that keeps the poem lit and the stars crisp. */
const order = await page.evaluate(() => {
  const z = (sel) => parseInt(getComputedStyle(document.querySelector(sel)).zIndex, 10);
  return {
    exposure: z('.exposure'),
    particles: z('#particles'),
    row: z('.section__row'),
    isolation: getComputedStyle(document.querySelector('.section')).isolation,
  };
});
check('particles paint above the exposure layer', order.particles > order.exposure);
check('the poem paints above the exposure layer', order.row > order.exposure);
check('sections are not isolated (so the vignette stays behind the poem)', order.isolation === 'auto');

/* Ramp: one third per puzzle, and it must actually change each time. */
await page.click('.spark');
await sleep(1200);
const afterOne = await exposure();
check(`exposure rises after puzzle 1 (${afterOne})`, afterOne > 0 && afterOne < 0.5);

await page.evaluate(() =>
  localStorage.setItem('ardh:unlocked', JSON.stringify(['amavasya', 'bhasma']))
);
await page.reload({ waitUntil: 'networkidle2' });
await sleep(1600);
const afterTwo = await exposure();
check(`exposure rises again after puzzle 2 (${afterTwo})`, afterTwo > afterOne);

await page.evaluate(() =>
  localStorage.setItem('ardh:unlocked', JSON.stringify(['amavasya', 'bhasma', 'ardhanarishvara']))
);
await page.reload({ waitUntil: 'networkidle2' });
await sleep(1600);
const afterAll = await exposure();
check(`exposure reaches full after every puzzle (${afterAll})`, afterAll > afterTwo);

const litAtMax = await litPixels();
check(`particles still drawing at full exposure (${litAtMax} lit pixels)`, litAtMax > 1200);

check('no JS errors', errs.length === 0);
if (errs.length) console.log('errors:', errs);

await page.screenshot({ path: 'atmosphere-max.png' });
await browser.close();

console.log('\n=== atmosphere ===');
let failed = 0;
for (const [n, ok] of results) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}`); }
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
