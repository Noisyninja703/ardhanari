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
const HINT_DELAY = 8000;
const SKIP_DELAY = 25000;

/** Which particle preset each section runs. */
const PARTICLE_BY_SECTION = {
  amavasya: 'stars',
  bhasma: 'ash',
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
  if (data.align === 'left') section.classList.add('section--left');
  if (data.align === 'right') section.classList.add('section--right');
  section.setAttribute('aria-labelledby', `${data.id}-heading`);

  /* Decorative Devanagari as background texture. aria-hidden: a screen
     reader should not attempt to pronounce ornament. */
  if (data.devanagari) {
    const sanskrit = el('div', 'section__sanskrit t-sanskrit', data.devanagari);
    sanskrit.setAttribute('aria-hidden', 'true');
    section.append(sanskrit);
  }

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

  const inner = el('div', 'section__inner');

  /* Tithi label: the moon glyph plus the phase name. This is the structural
     device — the moon carries the progression, so nothing is numbered. */
  const tithi = el('div', 'tithi reveal');
  tithi.style.setProperty('--i', '0');
  const phase = el('span', 'tithi__phase', data.phase);
  phase.setAttribute('aria-hidden', 'true');
  tithi.append(phase, el('span', 't-util', data.tithi));

  const heading = el('h2', 't-title reveal', data.heading);
  heading.id = `${data.id}-heading`;
  heading.style.setProperty('--i', '1');

  const verses = el('div', 'verses');
  data.verses.forEach((line, i) => {
    const p = el('p', 't-verse reveal', line);
    p.style.setProperty('--i', String(i + 2));
    verses.append(p);
  });

  inner.append(tithi, heading, verses);
  section.append(inner);

  /* Hint and skip live in the section but are driven by the timers below. */
  if (data.puzzle) {
    const hint = el('p', 'hint t-util', data.hint || '');
    hint.setAttribute('aria-live', 'polite');

    const skip = el('button', 'skip t-util', data.skipLabel || 'Show me');
    skip.type = 'button';

    inner.append(hint, skip);
    section._hint = hint;
    section._skip = skip;
  }

  /* The first section needs to tell her there's more below it. Without this
     the void reads as the whole site. Later sections don't need it — by then
     scrolling is established. */
  if (index === 0) {
    const cue = el('div', 'scroll-cue');
    const line = el('div', 'scroll-cue__line');
    line.setAttribute('aria-hidden', 'true');
    cue.append(line, el('span', 't-util', UI.scrollCue));
    inner.append(cue);
  }

  section._data = data;
  section._index = index;
  return section;
}

/* --- Puzzles ------------------------------------------------------------- */

const puzzleModules = {
  void: () => import('./puzzles/void.js'),
  ash: () => import('./puzzles/ash.js'),
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

  updateMoonMeter();

  if (!silent) section.dispatchEvent(new CustomEvent('ardh:solved', { bubbles: true }));
}

/* --- Hint / skip timers --------------------------------------------------
   She never gets stuck. Hint at 8s of being in view, an explicit way out
   at 25s. Timers only run while the section is actually on screen. */

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

  meterDots = SECTIONS.map((data) => {
    const dot = el('a', 'moon-meter__dot');
    dot.href = `#${data.id}`;
    dot.innerHTML = `<span aria-hidden="true">${data.phase}</span>`;
    dot.append(el('span', 'visually-hidden', data.tithi));
    nav.append(dot);
    return dot;
  });

  return nav;
}

function updateMoonMeter() {
  SECTIONS.forEach((data, i) => {
    const dot = meterDots[i];
    if (!dot) return;
    dot.classList.toggle('is-unlocked', unlocked.has(data.id));
    dot.classList.toggle('is-current', data.id === currentId);
    dot.setAttribute('aria-current', data.id === currentId ? 'true' : 'false');
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

function observeSections(sections) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const section = entry.target;
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          currentId = section.id;
          setPreset(PARTICLE_BY_SECTION[section.id] || 'none');
          updateMoonMeter();
          startTimers(section);
        } else if (!entry.isIntersecting) {
          clearTimers(section);
        }
      }
    },
    { threshold: [0, 0.5] }
  );
  sections.forEach((s) => io.observe(s));
}

/* --- Boot ---------------------------------------------------------------- */

function boot() {
  const app = document.getElementById('app');
  document.title = `${SITE.title} — ${SITE.subtitle}`;

  initScroll();

  const sections = SECTIONS.map(buildSection);
  app.append(...sections);

  document.body.append(buildMoonMeter());

  attachPointerGlow(document.querySelector('.pointer-glow'));
  initParticles(document.getElementById('particles'));

  observeReveals(app);
  observeSections(sections);
  updateMoonMeter();

  sections.forEach((section) => {
    section._skip?.addEventListener('click', () => markSolved(section));
    mountPuzzle(section);
  });

  /* The seam is invisible in the void and appears once she's through it —
     one being, before division. */
  const seam = document.querySelector('.seam');
  const revealSeam = () => seam.style.setProperty('--seam-strength', '1');
  if (unlocked.has('amavasya')) revealSeam();
  else sections[0].addEventListener('ardh:solved', revealSeam, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
