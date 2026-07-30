/* ==========================================================================
   main.js: builds the page from content.js, owns unlock state, and hands
   each section to its puzzle module.

   main.js knows nothing about how any individual puzzle works. Every puzzle
   exposes the same contract:

       export default function create({ section, data, solve }) {
         ...
         return { destroy() {} };
       }

   It calls solve() when the gate is passed. That's the whole interface.
   If a puzzle throws, we catch it and unlock the section instead, a bug
   in one interaction must never cost her a verse.
   ========================================================================== */

import { SECTIONS, SITE, UI } from './content.js';
import { initScroll, registerLayer, attachPointerGlow, prefersReducedMotion } from './scroll.js';
import { initParticles, setPreset } from './particles.js';

const STORE_KEY = 'ardh:unlocked';

/* Timers start when the section fills most of the screen, not when a sliver
   of it appears, so 3s means 3s of actually looking at it. */
const HINT_DELAY = 3000;
const SKIP_DELAY = 15000;

/* How much of a section must be on screen to count as "she's here". */
const IN_VIEW = 0.75;

/** Which particle preset each section runs. */
const PARTICLE_BY_SECTION = {
  amavasya: 'stars',
  bhasma: 'ash',
  ardhanarishvara: 'embers',
  tapasya: 'embers',
  trinetra: 'stars',
  /* The constellation brings its own sky, so the shared field stands down. */
  nakshatra: 'none',
  purnima: 'stars',
};

/* --- Unlock state --------------------------------------------------------
   Persisted so a refresh never makes her redo a puzzle. */

const unlocked = new Set(load());

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return []; /* private browsing, quota, whatever. Not worth caring about. */
  }
}

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify([...unlocked]));
  } catch {
    /* no-op: the site works fine without persistence */
  }
}

/* Wipe the visit and start over from the void.

   A full reload rather than resetting state in place: half a dozen things are
   set up once and only once, from the seam's birth to the lens she's carrying,
   and unpicking all of that by hand is a much better way to introduce a bug
   than letting the browser do it. Replacing the URL rather than reloading it
   also drops the scroll position, so she genuinely starts at the top. */
function forgetEverything() {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    /* nothing to clear, or storage is blocked. Reload anyway. */
  }
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  location.replace(location.pathname + location.search);
}

/* --- Building the DOM ---------------------------------------------------- */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function buildSection(data, index) {
  const section = el('section', `section ${data.id}`);
  section.id = data.id;
  section.dataset.puzzle = data.puzzle || '';
  section.setAttribute('aria-labelledby', `${data.id}-heading`);

  /* Two mist layers at different parallax speeds. The void gets none, absolute black is the whole point of that section. */
  if (data.id !== 'amavasya') {
    const cool = el('div', 'mist mist--cool');
    const warm = el('div', 'mist mist--warm');
    cool.setAttribute('aria-hidden', 'true');
    warm.setAttribute('aria-hidden', 'true');
    section.append(cool, warm);
    registerLayer(cool, 0.16, section);
    registerLayer(warm, -0.1, section);
  }

  /* Five proportional bands, sized in css/sections.css as percentages of the
     screen. Order here is the order down the screen. */
  const tithiRow = el('div', 'section__row section__tithi');
  const headRow = el('div', 'section__row section__head');
  const body = el('div', 'section__row section__body');
  const prompt = el('div', 'section__row section__prompt');
  const footer = el('div', 'section__row section__footer');

  /* Tithi label: the moon glyph plus the phase name. This is the structural
     device, the moon carries the progression, so nothing is numbered. It and
     the heading sweep in once she's a little way into the section. */
  const tithi = el('div', 'tithi sweep');
  tithi.style.setProperty('--i', '0');
  const phase = el('span', 'tithi__phase', data.phase);
  phase.setAttribute('aria-hidden', 'true');
  tithi.append(phase, el('span', 't-util', data.tithi));
  tithiRow.append(tithi);

  const heading = el('h2', 't-title sweep', data.heading);
  heading.id = `${data.id}-heading`;
  heading.style.setProperty('--i', '1');
  headRow.append(heading);

  /* Only build the verse block if there are verses. An empty one still took a
     grid row in the poem band and stretched to fill half of it, so sections
     whose content is a field rather than a poem, the constellation and the
     letters, were getting a quarter of the screen instead of the half the
     layout allots them. */
  if (data.verses?.length) {
    const verses = el('div', 'verses');
    data.verses.forEach((line, i) => {
      const p = el('p', 't-verse reveal', line);
      p.style.setProperty('--i', String(i + 2));
      verses.append(p);
    });
    body.append(verses);
  }

  /* Hint, skip and the onward cue all share the prompt band, none of them is
     ever wanted at the same moment as another. */
  if (data.puzzle) {
    const hint = el('p', 'hint t-util', data.hint || '');
    hint.setAttribute('aria-live', 'polite');
    prompt.append(hint);
    section._hint = hint;

    /* A section with no skipLabel has nothing to be stuck on, so it gets no way
       past and its hint is standing guidance rather than a nudge: it appears on
       arrival and stays. Nakshatra is the case, nothing to solve, but she does
       need telling that the stars can be touched. */
    if (data.skipLabel) {
      const skip = el('button', 'skip t-util', data.skipLabel);
      skip.type = 'button';
      prompt.append(skip);
      section._skip = skip;
    } else {
      section._guidance = true;
    }
  }

  /* Every section says "keep going" once it's solved. That's how she learns
     the next one has opened, now that solving doesn't scroll her onward.
     Hidden on the last section, where there is nothing below. */
  const cue = el('div', 'scroll-cue');
  const cueLine = el('div', 'scroll-cue__line');
  cueLine.setAttribute('aria-hidden', 'true');
  cue.append(cueLine, el('span', 't-util', UI.scrollCue));
  cue.hidden = index === SECTIONS.length - 1;
  prompt.append(cue);

  /* The last section offers a way back to the beginning, so she can walk the
     whole thing again from the dark. Only after she's finished it, so it never
     competes with the puzzle in front of her. */
  if (index === SECTIONS.length - 1) {
    const reset = el('button', 'reset t-util', UI.resetOffer);
    reset.type = 'button';
    reset.addEventListener('click', () => {
      if (reset.dataset.armed !== 'true') {
        /* Two steps: this wipes every puzzle she solved. */
        reset.dataset.armed = 'true';
        reset.textContent = UI.resetConfirm;
        reset.classList.add('is-armed');
        setTimeout(() => {
          if (reset.dataset.armed !== 'true') return;
          reset.dataset.armed = 'false';
          reset.textContent = UI.resetOffer;
          reset.classList.remove('is-armed');
        }, 5000);
        return;
      }
      forgetEverything();
    });
    prompt.append(reset);
  }

  /* Devanagari footer. Sweeps in when the section reaches full view, so it
     doubles as the signal that she's arrived, it sits at the very bottom of
     the section, so seeing it means the section fills the screen.
     aria-hidden: a screen reader should not try to pronounce ornament. */
  if (data.devanagari) {
    const sanskrit = el('div', 'section__sanskrit t-sanskrit sweep', data.devanagari);
    sanskrit.setAttribute('aria-hidden', 'true');
    footer.append(sanskrit);
    section._sanskrit = sanskrit;
  }

  /* The hidden line. Present from the first paint of every section, masked
     away to nothing until she has the lens from Trinetra. Absolutely placed so
     it can't disturb the five bands, and sitting just below the poem so the
     glass finds it without needing a hunt.

     Not aria-hidden: it's real writing, and once she has the lens it should be
     readable by a screen reader too. It simply isn't announced early, because
     it sits after everything else in the section's reading order. */
  if (data.lensSecret) {
    const secret = el('p', 'secret', data.lensSecret);
    section.append(secret);
    section._secret = secret;
  }

  section.append(tithiRow, headRow, body, prompt, footer);
  section._body = body;

  section._data = data;
  section._index = index;
  return section;
}

/* --- Puzzles ------------------------------------------------------------- */

const puzzleModules = {
  spark: () => import('./puzzles/spark.js'),
  ash: () => import('./puzzles/ash.js'),
  halves: () => import('./puzzles/halves.js'),
  flame: () => import('./puzzles/flame.js'),
  lens: () => import('./puzzles/lens.js'),
  constellation: () => import('./puzzles/constellation.js'),
  letters: () => import('./puzzles/letters.js'),
};

const mounted = new WeakSet();

async function mountPuzzle(section) {
  const name = section.dataset.puzzle;
  if (!name || mounted.has(section)) return;
  mounted.add(section);

  /* Already solved on a previous visit, or she's asked for less motion.
     The puzzle still mounts, it owns visuals like the ash-section photo
     that she should see either way, but with `solved: true` it skips the
     gate and shows everything immediately. */
  const preSolved = unlocked.has(section.id) || prefersReducedMotion();
  if (preSolved) markSolved(section, { silent: true });

  const loader = puzzleModules[name];
  if (!loader) {
    markSolved(section, { silent: true });
    return;
  }

  try {
    const mod = await loader();
    const instance = mod.default({
      section,
      /* The band a puzzle builds into: the 50% poem row, not the section. */
      body: section._body,
      data: section._data,
      solved: preSolved,
      solve: () => markSolved(section),
    });
    section._puzzle = instance || null;
  } catch (err) {
    /* A broken puzzle must never cost her a verse. */
    console.warn(`[ardh] puzzle "${name}" failed to mount; unlocking`, err);
    markSolved(section, { silent: true });
  }
}

function markSolved(section, { silent = false } = {}) {
  if (section.classList.contains('is-solved')) return;

  section.classList.add('is-solved');
  unlocked.add(section.id);
  save();

  clearTimers(section);
  /* Standing guidance survives solving; a puzzle hint doesn't. */
  if (!section._guidance) section._hint?.classList.remove('is-showing');
  section._skip?.classList.remove('is-showing');
  section._puzzle?.destroy?.();
  section._puzzle = null;

  updateSeals();
  updateExposure();
  updateMoonMeter({ popId: silent ? null : section.id });
  syncNav();

  if (!silent) section.dispatchEvent(new CustomEvent('ardh:solved', { bubbles: true }));
}

/* --- Sealing -------------------------------------------------------------
   Everything past the first unsolved section is taken out of the document,
   so the page literally ends there and she can't scroll past a puzzle she
   hasn't finished. Scrolling back up is unaffected.

   This is why there's no wheel-hijacking or scroll clamping anywhere: the
   document is exactly as long as she's earned. */

let allSections = [];

function updateSeals() {
  let frontierPassed = false;

  for (const section of allSections) {
    section.classList.toggle('section--sealed', frontierPassed);
    /* Everything after the first unsolved section is sealed. Read from the
       unlock set rather than the DOM, so this is correct before any puzzle has
       mounted and doesn't depend on the order things happen in. */
    if (!frontierPassed && !unlocked.has(section.id)) frontierPassed = true;
  }

  /* Deliberately no scrolling here. Solving used to jump her straight to the
     next section, which yanked the page out from under the moment she'd just
     earned. She stays where she is, the poem fades in, and the "keep going"
     cue tells her the next one is open. */
}

/* --- Exposure ------------------------------------------------------------
   The backdrop darkens as she progresses, so the poem becomes the only lit
   thing on screen by the end. */
function updateExposure() {
  const ratio = unlocked.size / Math.max(1, SECTIONS.length);
  document.documentElement.style.setProperty('--exposure', ratio.toFixed(3));
}

/* --- Hint / skip timers --------------------------------------------------
   She never gets stuck. Hint at 3s of the section filling the screen, an
   explicit way out at 15s. Timers only run while it's actually in view. */

function startTimers(section) {
  /* The unlock set is checked as well as the class, because puzzles mount
     lazily: a section solved on a previous visit hasn't had .is-solved applied
     yet if its module hasn't loaded, and she shouldn't be prompted to solve
     something she already has. */
  if (!section._hint || section.classList.contains('is-solved')) return;
  if (unlocked.has(section.id)) return;
  clearTimers(section);
  section._hintTimer = setTimeout(() => section._hint.classList.add('is-showing'), HINT_DELAY);
  section._skipTimer = setTimeout(() => section._skip.classList.add('is-showing'), SKIP_DELAY);
}

function clearTimers(section) {
  clearTimeout(section._hintTimer);
  clearTimeout(section._skipTimer);
}

/* --- Moon meter ---------------------------------------------------------- */

let meterDots = [];
let currentId = SECTIONS[0].id;

/* --- Travelling between sections -----------------------------------------
   Scrolling is locked and she moves a section at a time. Free scrolling on a
   phone was genuinely unpleasant here: every section owns a large puzzle
   surface that has to claim the gesture, mandatory snap fought whatever was
   left, and the result was a page that only moved if you found the right
   patch of empty background to drag. One section per press is predictable, and
   it suits a poem that was always meant to be read a phase at a time.

   The document is still the scroller and is still scrolled programmatically,
   so nothing here hijacks a wheel or fakes a transform. It simply isn't
   user-scrollable. */

let navBack = null;
let navOnward = null;

function reachableSections() {
  return allSections.filter((s) => !s.classList.contains('section--sealed'));
}

function currentIndex() {
  const open = reachableSections();
  const i = open.findIndex((s) => s.id === currentId);
  return i === -1 ? 0 : i;
}

function travel(step) {
  const open = reachableSections();
  const target = open[currentIndex() + step];
  if (!target) return;
  target.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'start',
  });
}

function syncNav() {
  if (!navBack) return;
  const open = reachableSections();
  const i = currentIndex();
  navBack.disabled = i <= 0;
  navOnward.disabled = i >= open.length - 1;

  /* Breathes only once this section is finished, so the arrow is telling her
     something rather than just sitting there: the way onward is open. */
  const here = open[i];
  navOnward.classList.toggle(
    'is-inviting',
    !navOnward.disabled && !!here && unlocked.has(here.id)
  );
}

function buildSectionNav() {
  const nav = el('nav', 'section-nav');
  nav.setAttribute('aria-label', UI.moonMeterLabel);

  const make = (dir, glyph, label) => {
    const button = el('button', `section-nav__step section-nav__step--${dir}`);
    button.type = 'button';
    button.innerHTML = `<span aria-hidden="true">${glyph}</span>`;
    button.append(el('span', 'visually-hidden', label));
    button.addEventListener('click', () => travel(dir === 'back' ? -1 : 1));
    return button;
  };

  navBack = make('back', '↑', UI.navBack);
  navOnward = make('onward', '↓', UI.navOnward);
  nav.append(navBack, navOnward);
  return nav;
}

/* --- Zoom ----------------------------------------------------------------
   Pinch zoom used to break the site completely. Every section is exactly one
   screen tall, scrolling is locked, and travel happens by scrolling the document
   programmatically. Zoom in and the visual viewport becomes a small window onto
   a layout that has not changed size, and with the scroller locked there is no
   way to reach the rest of it. A reload does not help either, because the
   browser remembers the scale, so the only escape was pinching back to almost
   exactly 1.

   Blocking zoom would have been the easy fix and it is the wrong one. Being able
   to enlarge text is an accessibility requirement, and iOS has ignored
   user-scalable=no for years precisely because sites kept doing this.

   So zoom is allowed and the paging gets out of its way: while she is zoomed in
   the document scrolls normally so she can pan wherever she likes, and when she
   comes back to 1 the lock returns and the section she is on is squared up
   again. */
function watchZoom() {
  const vv = window.visualViewport;
  if (!vv) return;

  const root = document.documentElement;
  let wasZoomed = false;

  function sync() {
    /* A little slack: pinch gestures settle on 1.0001 and similar, and toggling
       the scroll lock on that would be worse than the bug. */
    const zoomed = vv.scale > 1.05;
    if (zoomed === wasZoomed) return;
    wasZoomed = zoomed;
    root.classList.toggle('is-zoomed', zoomed);

    /* Coming back to normal: put her back on a whole section, since she has
       almost certainly drifted off the grid while panning around. */
    if (!zoomed) {
      const here = allSections.find((s) => s.id === currentId);
      here?.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }

  vv.addEventListener('resize', sync, { passive: true });
  vv.addEventListener('scroll', sync, { passive: true });
  sync();
}

function wireTravelKeys() {
  window.addEventListener(
    'keydown',
    (e) => {
      /* The lens takes the arrow keys while it's focused, and any control with
         its own key handling should keep it. */
      const active = document.activeElement;
      if (active && active !== document.body && active.closest('.lens, input, textarea')) return;

      const back = ['ArrowUp', 'PageUp'];
      const onward = ['ArrowDown', 'PageDown', ' '];
      if (back.includes(e.key)) { e.preventDefault(); travel(-1); }
      else if (onward.includes(e.key)) { e.preventDefault(); travel(1); }
    },
    { passive: false }
  );

  /* A wheel or trackpad still moves her a section at a time, so the page
     doesn't feel dead on a desktop. Rate-limited, or one flick of an inertial
     trackpad would skate through three sections. */
  let wheelLocked = false;
  window.addEventListener(
    'wheel',
    (e) => {
      if (wheelLocked || Math.abs(e.deltaY) < 12) return;
      wheelLocked = true;
      travel(e.deltaY > 0 ? 1 : -1);
      setTimeout(() => { wheelLocked = false; }, 700);
    },
    { passive: true }
  );
}

function buildMoonMeter() {
  const nav = el('nav', 'moon-meter');
  nav.setAttribute('aria-label', UI.moonMeterLabel);

  const dots = el('div', 'moon-meter__dots');
  meterDots = SECTIONS.map((data) => {
    const dot = el('a', 'moon-meter__dot');
    dot.href = `#${data.id}`;
    dot.innerHTML = `<span aria-hidden="true">${data.phase}</span>`;
    dot.append(el('span', 'visually-hidden', data.tithi));
    dots.append(dot);
    return dot;
  });

  nav.append(dots);
  return nav;
}

/**
 * @param {object} [opts]
 * @param {string|null} [opts.popId]  section whose moon should flare
 */
function updateMoonMeter({ popId = null } = {}) {
  SECTIONS.forEach((data, i) => {
    const dot = meterDots[i];
    if (!dot) return;
    const isUnlocked = unlocked.has(data.id);
    dot.classList.toggle('is-unlocked', isUnlocked);
    dot.classList.toggle('is-current', data.id === currentId);
    dot.setAttribute('aria-current', data.id === currentId ? 'true' : 'false');
    /* Sealed sections aren't reachable, so their dots shouldn't pretend. */
    dot.setAttribute('aria-disabled', isUnlocked || data.id === currentId ? 'false' : 'true');

    /* The glow lands on the moon she just earned, rather than on a bar. */
    if (popId && data.id === popId) {
      dot.classList.remove('is-popping');
      void dot.offsetWidth; /* reflow, so it replays on consecutive solves */
      dot.classList.add('is-popping');
      setTimeout(() => dot.classList.remove('is-popping'), 1700);
    }
  });
}

/* --- The glass toggle ----------------------------------------------------
   Chrome for putting the lens away and taking it back out. It does not exist
   until Trinetra hands her the glass: lens.js adds `lens-ready` to the root
   when she arrives at it, and the CSS both reveals this and plays a slow
   announcement so she has time to notice something new appeared.

   Three separate pieces of root state keep this honest, and the lens module
   reads all three:
     has-lens    she owns the glass at all
     lens-ready  it has actually been earned, so the toggle may show
     lens-off    she has chosen to put it away
     lens-busy   something modal is open, so the glass steps aside for now

   Deliberately not persisted. Reaching for the glass is the interesting state,
   so that's where a new visit should start. */

function buildLensToggle() {
  const root = document.documentElement;
  const button = el('button', 'lens-toggle');
  button.type = 'button';

  const glyph = el('span', 'lens-toggle__glyph');
  glyph.setAttribute('aria-hidden', 'true');

  const label = el('span', 'visually-hidden');
  button.append(glyph, label);

  function sync() {
    const off = root.classList.contains('lens-off');
    button.setAttribute('aria-pressed', off ? 'false' : 'true');
    label.textContent = off ? UI.lensShow : UI.lensHide;
    button.classList.toggle('is-off', off);
    /* A lens with something in it, or an empty ring. */
    glyph.textContent = off ? '◌' : '◎';
  }

  button.addEventListener('click', () => {
    root.classList.toggle('lens-off');
    sync();
  });

  /* The lens module can change this state on its own: on a later visit it
     starts the glass put away. The toggle is built before that module loads, so
     it watches the root rather than assuming it's the only thing writing here. */
  new MutationObserver(sync).observe(root, {
    attributes: true,
    attributeFilter: ['class'],
  });

  sync();
  return button;
}

/* --- Observers ----------------------------------------------------------- */

function observeReveals(root) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-revealed');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.01 }
  );
  root.querySelectorAll('.reveal').forEach((node) => io.observe(node));
}

/* Headings and tithi labels sweep in once she's a little way into the
   section, past them, but before the bottom of it. The negative bottom
   margin is what delays it until they've scrolled up the screen a bit. */
function observeSweeps(root) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-swept');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -28% 0px', threshold: 0.6 }
  );
  root.querySelectorAll('.tithi.sweep, .t-title.sweep').forEach((node) => io.observe(node));
}

function observeSections(sections) {
  /* Fine-grained thresholds so the progress bar can track her scroll through
     a section rather than jumping at a single trip point. */
  const steps = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const section = entry.target;
        const ratio = entry.intersectionRatio;

        if (entry.isIntersecting && ratio > 0.5) {
          currentId = section.id;
          setPreset(PARTICLE_BY_SECTION[section.id] || 'none');
          updateMoonMeter();
          syncNav();
        }

        /* The Devanagari footer sits at the very bottom of the section, so it
           arriving means the section fills the screen. That's the same moment
           the hint timer should start. */
        if (entry.isIntersecting && ratio >= IN_VIEW) {
          section._sanskrit?.classList.add('is-swept');
          /* Guidance doesn't wait, and doesn't care whether it's solved. */
          if (section._guidance) section._hint?.classList.add('is-showing');
          startTimers(section);
        } else if (ratio < IN_VIEW) {
          clearTimers(section);
        }
      }
    },
    { threshold: steps }
  );
  sections.forEach((s) => io.observe(s));
}

/* --- Boot ---------------------------------------------------------------- */

function boot() {
  const app = document.getElementById('app');
  document.title = `${SITE.title}, ${SITE.subtitle}`;

  initScroll();

  const sections = SECTIONS.map(buildSection);
  allSections = sections;
  app.append(...sections);

  /* One fixed strip at the bottom holds both the travel arrows and the moons,
     so a single reserve (--chrome-h) keeps every section clear of both. */
  const chrome = el('div', 'chrome');
  chrome.append(buildSectionNav(), buildMoonMeter());
  document.body.append(chrome, buildLensToggle());

  document.documentElement.classList.add('is-paged');
  wireTravelKeys();
  watchZoom();

  attachPointerGlow(document.querySelector('.pointer-glow'));
  initParticles(document.getElementById('particles'));

  observeReveals(app);
  observeSweeps(app);
  observeSections(sections);
  updateMoonMeter();
  updateExposure();
  syncNav();

  sections.forEach((section) => {
    section._skip?.addEventListener('click', () => markSolved(section));
  });

  updateSeals();

  /* Puzzles mount as she approaches their section, not all at once on load.
     Eager mounting leaked: the lens is a fixed, page-wide object, so building
     Trinetra's puzzle at boot handed her the glass on the very first screen,
     five sections before she earns it. Sealed sections are display:none and
     never intersect, so this also means a puzzle can't mount before its
     section is reachable.

     The rootMargin mounts it just before it scrolls into view, which keeps the
     dynamic import from landing a frame late and flashing un-withheld verse. */
  const mountIO = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        mountPuzzle(entry.target);
        mountIO.unobserve(entry.target);
      }
    },
    { rootMargin: '60% 0px' }
  );

  sections.forEach((section) => {
    /* A section she has already solved is mounted straight away rather than on
       approach. There's no gate left in it to leak, and things she has earned
       should be hers from the first frame wherever she happens to be: without
       this, the glass and its toggle only came back once she had scrolled
       within reach of Trinetra again. */
    if (unlocked.has(section.id)) mountPuzzle(section);
    else mountIO.observe(section);
  });

  /* The seam is invisible in the void and appears once she's through it, one being, before division. */
  /* The page's seam does not exist until she rejoins the halves. It's the
     thing she made, not scenery that was always there, so it's born at that
     moment: it flares at the centre, grows out to full height, and stays gold
     for every section after. */
  const seam = document.querySelector('.seam');
  const halvesSection = sections.find((s) => s.id === 'ardhanarishvara');

  function bearSeam({ animate }) {
    seam.style.setProperty('--seam-strength', '1');
    seam.classList.add('is-joined');
    /* Skip the birth animation when it was already earned on a previous
       visit, she shouldn't watch it hatch again on every reload. */
    if (animate) seam.classList.add('is-born');
  }

  if (halvesSection) {
    if (unlocked.has('ardhanarishvara')) bearSeam({ animate: false });
    else {
      halvesSection.addEventListener('ardh:solved', () => bearSeam({ animate: true }), {
        once: true,
      });
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
