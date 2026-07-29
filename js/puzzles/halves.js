/* ==========================================================================
   puzzles/halves.js — Ardhanarishvara

   The viewport's centre is torn open. Two panels hold two fragments of one
   verse, pulled apart, unreadable alone. She drags them back together; they
   snap magnetically at the centre, the seam flares gold, and the verse
   completes as a single line.

   Two deliberate choices:

   - Dragging either half moves BOTH, mirrored. You cannot bring one half
     back without the other, which is the entire point of the form. It also
     halves the work.
   - The axis follows the viewport. On a portrait phone the split is
     horizontal and she drags vertically; anywhere wider it's vertical and
     she drags across. Same interaction, same meaning, rotated — so the
     landscape nudge stays an invitation rather than a requirement.
   ========================================================================== */

import { attachNudge, isPortraitPhone, onOrientationChange } from '../orientation-nudge.js';

const SNAP_PX = 40;      /* magnetic pull distance, as planned */
const KEY_STEP = 0.28;   /* how much one arrow press closes the gap */

export default function create({ section, data, solved: preSolved = false, solve }) {
  const inner = section.querySelector('.section__inner');
  const verses = inner.querySelector('.verses');

  /* The completed verse is hidden until the halves meet. */
  verses.classList.add('verses--withheld');

  /* --- Build ------------------------------------------------------------- */

  const stage = document.createElement('div');
  stage.className = 'halves';

  const seam = document.createElement('div');
  seam.className = 'halves__seam';
  seam.setAttribute('aria-hidden', 'true');

  /* Panels are buttons so they're focusable and operable without a pointer. */
  const makePanel = (side, text) => {
    const panel = document.createElement('button');
    panel.type = 'button';
    panel.className = `halves__panel halves__panel--${side}`;
    panel.setAttribute(
      'aria-label',
      `${text} — drag toward the centre, or press the arrow keys, to rejoin the verse`
    );
    const span = document.createElement('span');
    span.className = 'halves__fragment t-verse';
    span.textContent = text;
    panel.append(span);
    return panel;
  };

  const panelA = makePanel('a', data.torn.a);
  const panelB = makePanel('b', data.torn.b);

  stage.append(panelA, seam, panelB);
  /* Above the completed verse, not below it: she joins the torn line first,
     and the rest of the verse blooms underneath as the reward. */
  inner.insertBefore(stage, verses);

  /* --- State ------------------------------------------------------------- */

  let gap = 1;              /* 1 = fully torn apart, 0 = joined */
  let joined = false;
  let axis = 'x';           /* 'x' = drag across, 'y' = drag up/down */

  /** Half the total separation, in px. Each panel travels this far. */
  function maxOffset() {
    const size = axis === 'x' ? stage.clientWidth : stage.clientHeight;
    return size * 0.15;
  }

  function applyAxis() {
    axis = isPortraitPhone() ? 'y' : 'x';
    stage.classList.toggle('halves--x', axis === 'x');
    stage.classList.toggle('halves--y', axis === 'y');
    render();
  }

  function render() {
    stage.style.setProperty('--gap', gap.toFixed(4));
    /* The seam brightens as they close, so she gets feedback the whole way
       rather than only at the end. */
    seam.style.setProperty('--seam-glow', (1 - gap).toFixed(4));
  }

  function setGap(next, { animate = false } = {}) {
    if (joined) return;
    stage.classList.toggle('is-settling', animate);
    gap = Math.min(1, Math.max(0, next));
    render();
    if (gap === 0) join();
  }

  function join() {
    if (joined) return;
    joined = true;
    gap = 0;
    stage.classList.add('is-settling', 'is-joined');
    render();

    for (const panel of [panelA, panelB]) {
      panel.disabled = true;
      panel.setAttribute('aria-label', 'Rejoined');
    }
    verses.classList.remove('verses--withheld');
    solve();
  }

  if (preSolved) {
    /* Already done, or reduced motion: show it whole. */
    join();
    return { destroy() {} };
  }

  /* --- Pointer ----------------------------------------------------------- */

  let dragging = null;   /* { pointerId, start, startGap } */

  function coord(e) {
    return axis === 'x' ? e.clientX : e.clientY;
  }

  function onDown(e) {
    if (joined) return;
    const panel = e.currentTarget;
    panel.setPointerCapture?.(e.pointerId);
    dragging = { pointerId: e.pointerId, start: coord(e), startGap: gap, panel };
    stage.classList.add('is-dragging');
  }

  function onMove(e) {
    if (!dragging || joined || e.pointerId !== dragging.pointerId) return;

    /* Panel A closes the gap by moving forward along the axis; panel B by
       moving back. Normalising here means one formula below. */
    const direction = dragging.panel === panelA ? 1 : -1;
    const travelled = (coord(e) - dragging.start) * direction;

    setGap(dragging.startGap - travelled / maxOffset());
  }

  function onUp() {
    if (!dragging) return;
    stage.classList.remove('is-dragging');
    dragging = null;
    if (joined) return;

    /* Magnetic snap: inside SNAP_PX of touching, let them fall together.
       The remaining separation is gap * maxOffset on each side, so twice
       that is the actual distance between them. */
    if (gap * maxOffset() * 2 <= SNAP_PX) join();
  }

  for (const panel of [panelA, panelB]) {
    panel.addEventListener('pointerdown', onDown);
    panel.addEventListener('pointermove', onMove);
    panel.addEventListener('pointerup', onUp);
    panel.addEventListener('pointercancel', onUp);
  }

  /* --- Keyboard ----------------------------------------------------------
     Arrow keys close the gap; Enter or Space finishes it outright. Without
     this the section is unreachable for anyone not using a pointer. */

  function onKey(e) {
    if (joined) return;
    const closing = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    if (closing.includes(e.key)) {
      e.preventDefault();
      setGap(gap - KEY_STEP, { animate: true });
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      join();
    }
  }

  panelA.addEventListener('keydown', onKey);
  panelB.addEventListener('keydown', onKey);

  /* --- Orientation ------------------------------------------------------- */

  const nudge = attachNudge(section, 'This one wants more sky — turn me sideways.');
  const stopWatching = onOrientationChange(applyAxis);

  applyAxis();

  return {
    destroy() {
      stopWatching();
      nudge.destroy();
      for (const panel of [panelA, panelB]) {
        panel.removeEventListener('pointerdown', onDown);
        panel.removeEventListener('pointermove', onMove);
        panel.removeEventListener('pointerup', onUp);
        panel.removeEventListener('pointercancel', onUp);
        panel.removeEventListener('keydown', onKey);
      }
    },
  };
}
