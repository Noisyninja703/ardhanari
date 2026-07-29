/* Drives the site the way she would: finds the spark, wipes the ash,
   and screenshots the result. Fails loudly if a puzzle doesn't solve. */
import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = process.env.SITE_URL || 'http://localhost:8000/index.html';
const OUT = '';  /* screenshots land in the current directory */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];

async function run(label, width, height, isMobile) {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || CHROME,
    headless: true,
    args: ['--no-sandbox', '--hide-scrollbars'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile, hasTouch: isMobile });

  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e.message)));

  await page.goto(URL, { waitUntil: 'networkidle2' });
  await sleep(1200);

  /* --- Amavasya: hold the pointer near the spark ------------------------- */
  const spark = await page.$('.spark');
  const box = await spark.boundingBox();
  await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 20);
  await sleep(2200);   /* HOLD_MS is 1600 */

  const voidSolved = await page.$eval('#amavasya', (s) => s.classList.contains('is-solved'));
  results.push([`${label} void puzzle solves by holding still`, voidSolved]);

  await sleep(2600);   /* let the bloom finish before capturing */
  await page.screenshot({ path: `${OUT}${label}-1-void.png` });

  const seam = await page.$eval('.seam', (s) => getComputedStyle(s).opacity);
  results.push([`${label} seam appears after the void`, seam === '1']);

  /* --- Bhasma: wipe the ash --------------------------------------------- */
  await page.evaluate(() => document.getElementById('bhasma').scrollIntoView({ behavior: 'instant' }));
  await sleep(1600);
  await page.screenshot({ path: `${OUT}${label}-2-ash-covered.png` });

  const wipeBox = await (await page.$('.wipe')).boundingBox();
  /* Sweep in horizontal bands until the section reports solved. */
  for (let row = 0; row < 8; row++) {
    const y = wipeBox.y + (wipeBox.height / 8) * (row + 0.5);
    await page.mouse.move(wipeBox.x + 4, y);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(wipeBox.x + (wipeBox.width / 10) * i, y);
    }
    await page.mouse.up();
    const done = await page.$eval('#bhasma', (s) => s.classList.contains('is-solved'));
    if (done) { results.push([`${label} ash puzzle solves after ${row + 1} sweeps`, true]); break; }
    if (row === 7) results.push([`${label} ash puzzle solves within 8 sweeps`, false]);
  }

  await sleep(1800);
  await page.screenshot({ path: `${OUT}${label}-3-ash-cleared.png` });

  /* --- Ardhanarishvara: drag the halves together ------------------------ */
  await page.evaluate(() => document.getElementById('ardhanarishvara').scrollIntoView({ behavior: 'instant' }));
  await sleep(1200);

  await page.screenshot({ path: `${OUT}${label}-4-halves-torn.png` });

  /* One layout everywhere: stacked halves dragged vertically. */
  const stacked = await page.$eval('#ardhanarishvara .halves__panel--a', (p) =>
    getComputedStyle(p).height !== getComputedStyle(p.parentElement).height
  );
  results.push([`${label} halves are stacked (single portrait layout)`, stacked]);

  const panel = await page.$('#ardhanarishvara .halves__panel--a');
  const pBox = await panel.boundingBox();
  const from = { x: pBox.x + pBox.width / 2, y: pBox.y + pBox.height / 2 };

  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  /* Drag panel A toward the centre in steps, so pointermove actually fires. */
  for (let i = 1; i <= 12; i++) {
    const t = i / 12;
    const travel = 240 * t;
    await page.mouse.move(from.x, from.y + travel);
  }
  await page.mouse.up();
  await sleep(1200);

  const halvesSolved = await page.$eval('#ardhanarishvara', (s) => s.classList.contains('is-solved'));
  results.push([`${label} halves join by dragging`, halvesSolved]);

  const joinedState = await page.evaluate(() => ({
    pageSeamJoined: document.querySelector('.seam').classList.contains('is-joined'),
    verseShown: !document.querySelector('#ardhanarishvara .verses').classList.contains('verses--withheld'),
  }));
  results.push([`${label} page seam flares after the join`, joinedState.pageSeamJoined]);
  results.push([`${label} completed verse revealed`, joinedState.verseShown]);

  await sleep(900);
  await page.screenshot({ path: `${OUT}${label}-5-halves-joined.png` });

  /* --- Sanity checks ---------------------------------------------------- */
  const checks = await page.evaluate(() => ({
    hOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    unlocked: JSON.parse(localStorage.getItem('ardh:unlocked') || '[]'),
    meterUnlocked: document.querySelectorAll('.moon-meter__dot.is-unlocked').length,
    verseVisible: getComputedStyle(document.querySelector('#bhasma .t-verse')).opacity,
  }));

  results.push([`${label} no horizontal overflow`, !checks.hOverflow]);
  results.push([`${label} progress persisted to localStorage`, checks.unlocked.length === 3]);
  results.push([`${label} moon meter shows 3 unlocked`, checks.meterUnlocked === 3]);
  results.push([`${label} no JS errors`, errs.length === 0]);
  if (errs.length) console.log(`${label} errors:`, errs);

  /* --- Reload: progress must survive ------------------------------------ */
  await page.reload({ waitUntil: 'networkidle2' });
  await sleep(1500);
  const stillSolved = await page.$eval('#bhasma', (s) => s.classList.contains('is-solved'));
  results.push([`${label} progress survives a reload`, stillSolved]);

  await browser.close();
}

await run('desk', 1440, 900, false);
await run('mob', 390, 844, true);

console.log('\n=== results ===');
let failed = 0;
for (const [name, ok] of results) {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
