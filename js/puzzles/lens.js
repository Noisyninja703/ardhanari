/* ==========================================================================
   puzzles/lens.js — Trinetra

   A piece of glass she drags around the screen. Lines that are invisible to
   the naked eye are readable through it, and once she's earned it the lens
   stays for the rest of the visit, so she can carry it back up the page and
   sweep every section she has already read. Each of those has had a line
   hidden in it since it was written.

   How the reveal works: every hidden line is a normal, fully-coloured element
   that is masked away to nothing. The mask is a radial gradient positioned at
   the lens, in that element's own coordinates, so what she sees is genuinely a
   window rather than a fade. Element-relative coordinates are the reason this
   is done in a frame loop instead of pure CSS.

   The lens outlives the puzzle deliberately: destroy() hands over rather than
   tearing down, because the whole point is that she keeps it.
   ========================================================================== */

const RADIUS = 92;      /* lens radius in px */
const HOLD_MS = 700;    /* how long the section's own secret must be held in view */
const KEY_STEP = 28;

export default function create({ section, body, solved: preSolved = false, solve }) {
  const root = document.documentElement;

  /* --- The glass --------------------------------------------------------- */

  const lens = document.createElement('button');
  lens.type = 'button';
  lens.className = 'lens';
  lens.setAttribute(
    'aria-label',
    'A piece of glass. Drag it across the page, or move it with the arrow keys, to read what is hidden.'
  );
  document.body.append(lens);

  /* A state hook, not a gate. The hidden lines are already invisible on their
     own, because their mask sits far off screen until this module starts
     moving it. This just makes "she has the glass" inspectable from CSS. */
  root.classList.add('has-lens');

  let x = 0;
  let y = 0;
  let held = 0;          /* ms this section's own secret has been under the glass */
  let done = preSolved;
  let raf = null;
  let lastTs = 0;

  /* Start over this section's poem, so it's found rather than hunted for. */
  function centreOnSection() {
    const r = (body || section).getBoundingClientRect();
    x = r.left + r.width / 2;
    y = r.top + r.height / 2;
  }

  function writePosition() {
    root.style.setProperty('--lens-x', `${x}px`);
    root.style.setProperty('--lens-y', `${y}px`);
    root.style.setProperty('--lens-r', `${RADIUS}px`);
    lens.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
  }

  /* Each hidden line needs the lens position in its own coordinate space. Only
     the ones actually on screen are touched, so this stays cheap however many
     sections exist. */
  function updateSecrets() {
    const secrets = document.querySelectorAll('.secret');
    for (const el of secrets) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -RADIUS || r.top > window.innerHeight + RADIUS) continue;
      el.style.setProperty('--mx', `${x - r.left}px`);
      el.style.setProperty('--my', `${y - r.top}px`);
    }
  }

  /* --- Solving -----------------------------------------------------------
     The gate is this section's own hidden line: hold the glass over it and the
     eye opens. */

  function ownSecretCoverage() {
    const el = section.querySelector('.secret');
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const cx = Math.max(r.left, Math.min(x, r.right));
    const cy = Math.max(r.top, Math.min(y, r.bottom));
    return Math.hypot(x - cx, y - cy) < RADIUS * 0.8 ? 1 : 0;
  }

  function finish() {
    if (done) return;
    done = true;
    held = HOLD_MS;
    lens.classList.add('is-found');
    solve();
  }

  function tick(ts) {
    const dt = lastTs ? Math.min(ts - lastTs, 100) : 16;
    lastTs = ts;

    writePosition();
    updateSecrets();

    if (!done) {
      if (ownSecretCoverage() > 0) {
        held += dt;
        lens.classList.add('is-reading');
        if (held >= HOLD_MS) finish();
      } else {
        held = Math.max(0, held - dt * 0.6);
        lens.classList.remove('is-reading');
      }
    }

    raf = requestAnimationFrame(tick);
  }

  /* --- Input -------------------------------------------------------------- */

  let dragging = null;

  function onDown(e) {
    lens.setPointerCapture?.(e.pointerId);
    dragging = { id: e.pointerId, dx: x - e.clientX, dy: y - e.clientY };
    lens.classList.add('is-held');
  }

  function onMove(e) {
    if (!dragging || e.pointerId !== dragging.id) return;
    x = e.clientX + dragging.dx;
    y = e.clientY + dragging.dy;
  }

  function onUp() {
    dragging = null;
    lens.classList.remove('is-held');
  }

  function onKey(e) {
    const steps = {
      ArrowLeft: [-KEY_STEP, 0], ArrowRight: [KEY_STEP, 0],
      ArrowUp: [0, -KEY_STEP], ArrowDown: [0, KEY_STEP],
    };
    const move = steps[e.key];
    if (!move) return;
    e.preventDefault();
    x += move[0];
    y += move[1];
  }

  /* Keep it on screen when the viewport changes under it. */
  function clampToViewport() {
    x = Math.max(RADIUS * 0.4, Math.min(x, window.innerWidth - RADIUS * 0.4));
    y = Math.max(RADIUS * 0.4, Math.min(y, window.innerHeight - RADIUS * 0.4));
  }

  lens.addEventListener('pointerdown', onDown);
  lens.addEventListener('pointermove', onMove);
  lens.addEventListener('pointerup', onUp);
  lens.addEventListener('pointercancel', onUp);
  lens.addEventListener('keydown', onKey);
  window.addEventListener('resize', clampToViewport, { passive: true });

  centreOnSection();
  clampToViewport();
  writePosition();
  raf = requestAnimationFrame(tick);

  if (preSolved) lens.classList.add('is-found');

  return {
    /* Deliberately empty. Every other puzzle tears itself down when its
       section is solved; this one hands over instead. She earned the glass, so
       she keeps it, and it has to go on working in every section she scrolls
       back to. The frame loop and its listeners live for the page's lifetime. */
    destroy() {},
  };
}
