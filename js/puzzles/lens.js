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
  let parked = false;   /* are the hidden lines' masks currently shoved off screen */

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

  /* Shove every mask back off screen. Without this, putting the glass away
     simply stopped updating the masks, so whatever window was open at that
     moment stayed open and the hidden line under it remained readable with no
     lens in sight. Every one of them, not just the visible ones: a line
     scrolled past keeps its stale position otherwise. */
  function parkSecrets() {
    for (const el of document.querySelectorAll('.secret')) {
      el.style.setProperty('--mx', '-9999px');
      el.style.setProperty('--my', '-9999px');
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

    /* Write nothing unless the glass is actually in her hand. That covers
       before she arrives, after she puts it away, and while a letter or a
       memory is open. The hidden lines' masks stay parked off screen, so
       nothing anywhere on the page can be read through a lens that isn't
       there. */
    const inHand = arrived
      && !root.classList.contains('lens-off')
      && !root.classList.contains('lens-busy');

    if (!inHand) {
      /* Park once on the way out rather than every frame. */
      if (!parked) {
        parkSecrets();
        parked = true;
      }
      raf = requestAnimationFrame(tick);
      return;
    }
    parked = false;

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

  /* The glass only appears once this section is actually on screen, and it
     fades in when it does. main.js already mounts puzzles lazily, but the lens
     is a page-wide object and this section is the only place it can be earned,
     so it gets a second guard: she must never see it before she arrives.

     After that first arrival it stays available everywhere, which is the whole
     point of it. */
  let arrived = false;

  /* Handing over the glass. `lens-ready` is what lets the toggle in the top
     corner exist at all, and what triggers its announcement. */
  function handOver({ announce }) {
    if (arrived) return;
    arrived = true;
    lens.classList.add('is-available');
    root.classList.add('lens-ready');
    if (announce) root.classList.add('lens-new');
    centreOnSection();
    clampToViewport();
  }

  const arrivalIO = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.intersectionRatio < 0.55) continue;
        arrivalIO.disconnect();
        handOver({ announce: true });
      }
    },
    { threshold: [0, 0.55, 1] }
  );
  arrivalIO.observe(section);

  /* A later visit: the glass is hers, but it starts put away rather than
     floating over the page before she's asked for it. The toggle announces
     itself instead, which is both the hint that the glass exists and the hint
     that the control in the corner is what summons it.

     Only on later visits. On the visit that earns it, handOver above leaves it
     out and in her hand, because that's the moment it means something. */
  if (preSolved) {
    arrivalIO.disconnect();
    root.classList.add('lens-off');
    handOver({ announce: true });
  }

  return {
    /* Deliberately empty. Every other puzzle tears itself down when its
       section is solved; this one hands over instead. She earned the glass, so
       she keeps it, and it has to go on working in every section she scrolls
       back to. The frame loop and its listeners live for the page's lifetime. */
    destroy() {},
  };
}
