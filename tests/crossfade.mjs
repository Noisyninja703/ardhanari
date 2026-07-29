/* The particle field must never blink out while switching sections. Samples
   lit-pixel count continuously across a preset change and checks the floor. */
import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = process.env.SITE_URL || 'http://localhost:8000/index.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));

await page.goto(URL, { waitUntil: 'networkidle2' });
await sleep(600);
/* Open every section so we can scroll between them freely. */
await page.evaluate(() =>
  localStorage.setItem('ardh:unlocked', JSON.stringify(['amavasya', 'bhasma', 'ardhanarishvara']))
);
await page.reload({ waitUntil: 'networkidle2' });
await sleep(2500);

/* Sample inside the page so the timing isn't distorted by CDP round-trips. */
const trace = await page.evaluate(async () => {
  const c = document.getElementById('particles');
  const ctx = c.getContext('2d');
  const lit = () => {
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
    return n;
  };

  const samples = [];
  const before = lit();

  /* Jump to the next section, which changes the preset from stars to ash. */
  document.getElementById('bhasma').scrollIntoView({ behavior: 'instant' });

  const t0 = performance.now();
  while (performance.now() - t0 < 2000) {
    samples.push(lit());
    await new Promise((r) => setTimeout(r, 50));
  }
  return { before, samples, after: lit() };
});

const min = Math.min(...trace.samples);
const steady = Math.max(trace.before, trace.after);
const floor = Math.round(steady * 0.5);

const results = [
  [`steady field is populated (${steady} lit pixels)`, steady > 1200],
  [`never blinks out mid-transition (min ${min}, floor ${floor})`, min >= floor],
  [`field is still populated after the change (${trace.after})`, trace.after > 1200],
  ['no JS errors', errs.length === 0],
];

if (errs.length) console.log('errors:', errs);
console.log(`samples: ${trace.samples.join(' ')}`);

await browser.close();

console.log('\n=== cross-fade ===');
let failed = 0;
for (const [n, ok] of results) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}`); }
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
