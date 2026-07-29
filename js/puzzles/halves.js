/* ==========================================================================
   puzzles/halves.js — Ardhanarishvara

   The viewport's centre is torn open. Two panels hold two fragments of one
   verse, pulled apart, unreadable alone. She drags them back together; they
   snap magnetically at the centre, the seam flares gold, and the verse
   completes as a single line.

   Dragging either half moves BOTH, mirrored. You cannot bring one half back
   without the other, which is the entire point of the form — and it halves
   the work.

   One axis at every width: the halves are stacked and dragged vertically.
   The site is a portrait column everywhere, so the drag moves with the
   scroll rather than across it, and there's no second layout to maintain.
   ========================================================================== */

const SNAP_PX = 40;      /* magnetic pull distance, as planned */
const KEY_STEP = 0.28;   /* how much one arrow press closes the gap */

export default function create({ body, data, solved: preSolved = false, solve }) {
  const verses = body.querySelector('.verses');

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
      `${text} — drag toward the middle, or press the arrow keys, to rejoin the verse`
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
  body.insertBefore(stage, verses);

  /* --- State ------------------------------------------------------------- */

  let gap = 1;              /* 1 = fully torn apart, 0 = joined */
  let joined = false;

  /** Half the total separation, in px. Each panel travels this far. */
  function maxOffset() {
    return stage.clientHeight * 0.15;
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

  /* --- Pointer ------------------------------------------------------------
     The whole band is the drag surface, not just the two panels. When the
     halves are fully apart there's a wide gap of empty stage between them,
     and requiring her to land on the text itself meant a touch in that gap
     did nothing at all. Anywhere in the band now works.

     Which way the drag closes comes from where it started: begin above the
     middle and you're pulling the top half down, begin below it and you're
     pulling the bottom half up. */

  let dragging = null;   /* { pointerId, start, startGap, fromTop } */

  function onDown(e) {
    if (joined) return;
    const mid = stage.getBoundingClientRect().top + stage.clientHeight / 2;
    stage.setPointerCapture?.(e.pointerId);
    dragging = {
      pointerId: e.pointerId,
      start: e.clientY,
      startGap: gap,
      fromTop: e.clientY <= mid,
    };
    stage.classList.add('is-dragging');
  }

  function onMove(e) {
    if (!dragging || joined || e.pointerId !== dragging.pointerId) return;

    const direction = dragging.fromTop ? 1 : -1;
    const travelled = (e.clientY - dragging.start) * direction;

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

  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onUp);

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

  render();

  return {
    destroy() {
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', onUp);
      stage.removeEventListener('pointercancel', onUp);
      panelA.removeEventListener('keydown', onKey);
      panelB.removeEventListener('keydown', onKey);
    },
  };
}
