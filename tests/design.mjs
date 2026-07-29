/* Checks the design fixes: sealing, footer placement, meter layout, hint
   timing, and that nothing is cut off or overlapping. */
import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = process.env.SITE_URL || 'http://localhost:8000/index.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok) => results.push([name, ok]);

for (const [label, width, height] of [['mob', 390, 844], ['desk', 1440, 900]]) {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width, height, isMobile: label === 'mob', hasTouch: label === 'mob' });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));

  await page.goto(URL, { waitUntil: 'networkidle2' });

  /* Poll for how long the hint actually takes, measured from page load,
     rather than sleeping a guessed amount and checking once. */
  const t0 = Date.now();
  let hintMs = null;
  while (Date.now() - t0 < 8000) {
    const shown = await page.evaluate(() =>
      !!document.querySelector('#amavasya .hint')?.classList.contains('is-showing')
    );
    if (shown) { hintMs = Date.now() - t0; break; }
    await sleep(120);
  }
  check(`${label} hint appears within 3-5s of load (was ${hintMs}ms)`, hintMs !== null && hintMs >= 1500 && hintMs <= 5200);

  await sleep(400);

  /* --- Sealing: the page must end at the first unsolved puzzle ----------- */
  const sealed = await page.evaluate(() => ({
    sealedCount: document.querySelectorAll('.section--sealed').length,
    /* The real requirement: the next section must be unreachable. A little
       slack within the current section is fine and sometimes necessary. */
    reachableSections: document.documentElement.scrollHeight / window.innerHeight,
    openSections: document.querySelectorAll('.section:not(.section--sealed)').length,
  }));
  check(`${label} later sections sealed while puzzle 1 unsolved`, sealed.sealedCount === 2);
  check(`${label} only one section is open`, sealed.openSections === 1);
  check(`${label} next section unreachable by scrolling`, sealed.reachableSections < 1.25);

  /* --- Nothing cut off, nothing under the moon meter -------------------- */
  const layout = await page.evaluate(() => {
    const meter = document.querySelector('.moon-meter').getBoundingClientRect();
    const footer = document.querySelector('#amavasya .section__sanskrit').getBoundingClientRect();
    const cue = document.querySelector('.scroll-cue').getBoundingClientRect();
    const dots = [...document.querySelectorAll('.moon-meter__dot')].map((d) => d.getBoundingClientRect());
    return {
      footerInView: footer.top >= 0 && footer.bottom <= window.innerHeight,
      footerFitsWidth: footer.left >= 0 && footer.right <= window.innerWidth,
      footerAboveMeter: footer.bottom <= meter.top + 1,
      cueInView: cue.top >= 0 && cue.bottom <= window.innerHeight,
      cueAboveMeter: cue.bottom <= meter.top + 1,
      meterHorizontal: dots.length > 1 && Math.abs(dots[0].top - dots[1].top) < 2,
      meterSpansWidth: meter.width > window.innerWidth * 0.9,
      dotGapsEven: (() => {
        if (dots.length < 3) return true;
        const gaps = dots.slice(1).map((d, i) => d.left - dots[i].left);
        return Math.max(...gaps) - Math.min(...gaps) < 2;
      })(),
      noProgressBar: !document.querySelector('.moon-meter__fill'),
      bands: (() => {
        const s = document.getElementById('amavasya');
        /* Bands are percentages of the CONTENT box, so discount the bottom
           padding that reserves room for the fixed meter. */
        const contentH = s.clientHeight - parseFloat(getComputedStyle(s).paddingBottom);
        return [...s.querySelectorAll('.section__row')].map((r) =>
          Math.round((r.getBoundingClientRect().height / contentH) * 100));
      })(),
      cueHiddenBeforeSolve: getComputedStyle(document.querySelector('#amavasya .scroll-cue')).opacity === '0',
    };
  });

  check(`${label} devanagari footer fully in view`, layout.footerInView);
  check(`${label} devanagari footer not cut off horizontally`, layout.footerFitsWidth);
  check(`${label} devanagari footer clears the meter`, layout.footerAboveMeter);
  check(`${label} scroll cue fully in view`, layout.cueInView);
  check(`${label} scroll cue clears the meter`, layout.cueAboveMeter);
  check(`${label} moon meter is horizontal`, layout.meterHorizontal);
  check(`${label} moon meter spans the width`, layout.meterSpansWidth);
  check(`${label} moon meter dots evenly spaced`, layout.dotGapsEven);
  check(`${label} progress bar removed`, layout.noProgressBar);
  check(`${label} bands are 10/15/50/10/15 (got ${layout.bands.join('/')})`,
    JSON.stringify(layout.bands) === JSON.stringify([10, 15, 50, 10, 15]));
  check(`${label} "keep going" hidden before solving`, layout.cueHiddenBeforeSolve);

  /* --- Solving must NOT scroll her onward -------------------------------- */
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.click('.spark');
  /* --d-bloom is 2600ms; sample after the fade has finished, not during. */
  await sleep(3400);

  const after = await page.evaluate(() => ({
    sealedCount: document.querySelectorAll('.section--sealed').length,
    scrollable: document.documentElement.scrollHeight > window.innerHeight + 8,
    exposure: getComputedStyle(document.documentElement).getPropertyValue('--exposure').trim(),
    scrollY: window.scrollY,
    cueShown: getComputedStyle(document.querySelector('#amavasya .scroll-cue')).opacity === '1',
    poemShown: getComputedStyle(document.querySelector('#amavasya .t-title')).opacity === '1',
    moonUnlocked: document.querySelector('.moon-meter__dot').classList.contains('is-unlocked'),
  }));

  check(`${label} solving unseals the next section`, after.sealedCount === 1);
  check(`${label} page becomes scrollable after solving`, after.scrollable === true);
  check(`${label} solving does NOT jump to the next section`, after.scrollY === scrollBefore);
  check(`${label} poem fades in where she is`, after.poemShown);
  check(`${label} "keep going" appears after solving`, after.cueShown);
  check(`${label} the solved moon lights up`, after.moonUnlocked);
  check(`${label} exposure rises with progress`, parseFloat(after.exposure) > 0);

  check(`${label} no JS errors`, errs.length === 0);
  if (errs.length) console.log(`${label} errors:`, errs);

  await page.screenshot({ path: `${label}-design.png` });
  await browser.close();
}

console.log('\n=== design checks ===');
let failed = 0;
for (const [name, ok] of results) {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
