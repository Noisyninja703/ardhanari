/* ==========================================================================
   main.js — builds the page from content.js, owns unlock state, and hands
   each section to its puzzle module.

   main.js knows nothing about how any individual puzzle works. Every puzzle
   exposes the same contract:

       export default function create({ section, data, solve }) {
         ...
         return { destroy() {} };
       }

   It calls solve() when the gate is passed. That's the whole interface.
   If a puzzle throws, we catch it and unlock the section instead — a bug
   in one interaction must never cost her a verse.
   ========================================================================== */

import { SECTIONS, SITE, UI } from './content.js';
import { initScroll, registerLayer, attachPointerGlow, prefersReducedMotion } from './scroll.js';
import { initParticles, setPreset } from './particles.js';

const STORE_KEY = 'ardh:unlocked';

/* Timers start when the section fills most of the screen, not when a sliver
   of it appears — so 3s means 3s of actually looking at it. */
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

  /* Two mist layers at different parallax speeds. The void gets none —
     absolute black is the whole point of that section. */
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
     device — the moon carries the progression, so nothing is numbered. It and
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

  const verses = el('div', 'verses');
  data.verses.forEach((line, i) => {
    const p = el('p', 't-verse reveal', line);
    p.style.setProperty('--i', String(i + 2));
    verses.append(p);
  });
  body.append(verses);

  /* Hint, skip and the onward cue all share the prompt band — none of them is
     ever wanted at the same moment as another. */
  if (data.puzzle) {
    const hint = el('p', 'hint t-util', data.hint || '');
    hint.setAttribute('aria-live', 'polite');

    const skip = el('button', 'skip t-util', data.skipLabel || 'Show me');
    skip.type = 'button';

    prompt.append(hint, skip);
    section._hint = hint;
    section._skip = skip;
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

  /* Devanagari footer. Sweeps in when the section reaches full view, so it
     doubles as the signal that she's arrived — it sits at the very bottom of
     the section, so seeing it means the section fills the screen.
     aria-hidden: a screen reader should not try to pronounce ornament. */
  if (data.devanagari) {
    const sanskrit = el('div', 'section__sanskrit t-sanskrit sweep', data.devanagari);
    sanskrit.setAttribute('aria-hidden', 'true');
    footer.append(sanskrit);
    section._sanskrit = sanskrit;
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
};

async function mountPuzzle(section) {
  const name = section.dataset.puzzle;
  if (!name) return;

  /* Already solved on a previous visit, or she's asked for less motion.
     The puzzle still mounts — it owns visuals like the ash-section photo
     that she should see either way — but with `solved: true` it skips the
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
  section._hint?.classList.remove('is-showing');
  section._skip?.classList.remove('is-showing');
  section._puzzle?.destroy?.();
  section._puzzle = null;

  updateSeals();
  updateExposure();
  updateMoonMeter({ popId: silent ? null : section.id });

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
    /* Everything after the first unsolved section is sealed. */
    if (!frontierPassed && !section.classList.contains('is-solved')) frontierPassed = true;
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
  if (!section._hint || section.classList.contains('is-solved')) return;
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
   section — past them, but before the bottom of it. The negative bottom
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
        }

        /* The Devanagari footer sits at the very bottom of the section, so it
           arriving means the section fills the screen. That's the same moment
           the hint timer should start. */
        if (entry.isIntersecting && ratio >= IN_VIEW) {
          section._sanskrit?.classList.add('is-swept');
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

  document.body.append(buildMoonMeter());

  attachPointerGlow(document.querySelector('.pointer-glow'));
  initParticles(document.getElementById('particles'));

  observeReveals(app);
  observeSweeps(app);
  observeSections(sections);
  updateMoonMeter();
  updateExposure();

  sections.forEach((section) => {
    section._skip?.addEventListener('click', () => markSolved(section));
    mountPuzzle(section);
  });

  /* Seal after mounting, so sections already solved on a previous visit are
     open from the first paint. */
  updateSeals();

  /* The seam is invisible in the void and appears once she's through it —
     one being, before division. */
  const seam = document.querySelector('.seam');
  const revealSeam = () => seam.style.setProperty('--seam-strength', '1');
  if (unlocked.has('amavasya')) revealSeam();
  else sections[0].addEventListener('ardh:solved', revealSeam, { once: true });

  /* Once the halves are rejoined the page's own seam flares gold and the
     ash/gold division softens — the change persists for every section
     after it, which is the whole arc of the site in one class. */
  const joinSeam = () => seam.classList.add('is-joined');
  const halvesSection = sections.find((s) => s.id === 'ardhanarishvara');
  if (halvesSection) {
    if (unlocked.has('ardhanarishvara')) joinSeam();
    else halvesSection.addEventListener('ardh:solved', joinSeam, { once: true });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
