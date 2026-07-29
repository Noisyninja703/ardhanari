/* ==========================================================================
   puzzles/ash.js — Bhasma, the ash years

   The verse is buried under ash. She wipes it away with a finger or the
   cursor. Ash creeps back at the edges so it never fully clears — the
   point is not to win, it's that clearing it takes effort and it always
   returns a little.

   Implementation notes worth knowing:
   - We erase with destination-out compositing, which is far cheaper than
     maintaining a separate mask canvas.
   - Progress is measured by sampling a coarse grid of cells rather than
     reading every pixel. Reading full ImageData every frame on a phone is
     a stutter you can feel.
   - The ash has soft, irregular edges: it's drawn as a field of overlapping
     blobs and then feathered at the border, so it reads as a drift of dust
     rather than a grey rectangle.
   - touch-action is none while there's ash left (set in CSS), so the panel
     owns the whole gesture — wiping is diagonal and scribbly, and letting the
     scroller take the vertical component made it feel like it was fighting
     her. It's released to auto the moment the section is solved, so the area
     never blocks scrolling afterwards.
   ========================================================================== */

const SOLVE_AT = 0.9;      /* fraction of cells cleared before the gate opens */
const GRID = 16;            /* progress sampling resolution, per axis */
const BRUSH_MIN = 46;
const BRUSH_MAX = 86;

export default function create({ body, data, solved: preSolved = false, solve }) {
  const verses = body.querySelector('.verses');

  /* --- Build the wipe surface, moving the existing verse into it so the
         copy is never duplicated between here and content.js. ------------ */

  const wipe = document.createElement('div');
  wipe.className = 'wipe';

  const beneath = document.createElement('div');
  beneath.className = 'wipe__beneath';

  if (data.photo?.src) {
    const img = document.createElement('img');
    img.className = 'wipe__photo';
    img.src = data.photo.src;
    img.alt = data.photo.alt || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    /* If the photo isn't there yet the verse still reads fine on the void. */
    img.addEventListener('error', () => img.remove());
    beneath.append(img);
  }

  verses.classList.add('wipe__verse');
  beneath.append(verses);

  const canvas = document.createElement('canvas');
  canvas.className = 'wipe__canvas';
  canvas.setAttribute('aria-hidden', 'true');

  wipe.append(beneath, canvas);
  body.append(wipe);

  const ctx = canvas.getContext('2d');

  /* --- Ash rendering ---------------------------------------------------- */

  let w = 0;
  let h = 0;
  let dpr = 1;
  /** cleared[i] = true once that grid cell has been brushed */
  let cleared = new Array(GRID * GRID).fill(false);
  let solved = preSolved;

  /* A soft blob of ash. Used both for the body of the field and, at the
     edges, for the ragged outline. */
  function blob(x, y, r, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(24, 20, 30, ${alpha})`);
    g.addColorStop(0.6, `rgba(22, 18, 28, ${alpha * 0.85})`);
    g.addColorStop(1, 'rgba(20, 16, 26, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function paintAsh() {
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);

    /* The body: an opaque core inset from the edges, so the border is built
       from blobs rather than being a straight cut. */
    const inset = Math.min(w, h) * 0.14;
    const base = ctx.createLinearGradient(0, 0, w, h);
    base.addColorStop(0, 'rgba(18, 14, 24, 0.98)');
    base.addColorStop(0.5, 'rgba(26, 22, 32, 0.99)');
    base.addColorStop(1, 'rgba(16, 12, 22, 0.98)');
    ctx.fillStyle = base;
    ctx.fillRect(inset, inset, w - inset * 2, h - inset * 2);

    /* The ragged outline: overlapping blobs walked around the perimeter, so
       the ash has an uneven, drifted edge instead of four straight sides. */
    const steps = 44;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const jitter = 0.55 + Math.random() * 0.85;
      const r = inset * jitter * 1.6;

      /* Walk the rectangle perimeter. */
      let x;
      let y;
      if (t < 0.25) { x = (t / 0.25) * w; y = inset * (0.5 + Math.random() * 0.5); }
      else if (t < 0.5) { x = w - inset * (0.5 + Math.random() * 0.5); y = ((t - 0.25) / 0.25) * h; }
      else if (t < 0.75) { x = (1 - (t - 0.5) / 0.25) * w; y = h - inset * (0.5 + Math.random() * 0.5); }
      else { x = inset * (0.5 + Math.random() * 0.5); y = (1 - (t - 0.75) / 0.25) * h; }

      blob(x, y, r, 0.9);
    }

    /* Interior texture: pale grey blooms so it isn't a flat field. */
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = 12 + Math.random() * 70;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const a = 0.02 + Math.random() * 0.07;
      g.addColorStop(0, `rgba(140, 135, 148, ${a})`);
      g.addColorStop(1, 'rgba(140, 135, 148, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    /* Feather the outermost band so the ash dissolves into the page instead
       of ending on a hard line. */
    ctx.globalCompositeOperation = 'destination-out';
    const feather = inset * 1.15;
    const edges = [
      [0, 0, w, feather, 0, 0, 0, feather],                  /* top */
      [0, h - feather, w, feather, 0, h, 0, h - feather],     /* bottom */
      [0, 0, feather, h, 0, 0, feather, 0],                   /* left */
      [w - feather, 0, feather, h, w, 0, w - feather, 0],     /* right */
    ];
    for (const [rx, ry, rw, rh, x0, y0, x1, y1] of edges) {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(0.55, 'rgba(0,0,0,0.45)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(rx, ry, rw, rh);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = wipe.clientWidth;
    h = wipe.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* A resize repaints the ash, so previously cleared ground is covered
       again. Reset progress to match what she can actually see — telling
       her she's 90% done while showing full ash would be a lie. */
    cleared = new Array(GRID * GRID).fill(false);
    if (solved) {
      ctx.clearRect(0, 0, w, h);
      return;
    }
    paintAsh();
    markFeatherCleared();
  }

  /* The feathered border has no ash on it, so those cells must not count
     against her — otherwise the last of the progress is spent scrubbing
     empty corners to reach the threshold. Progress should only measure ash
     that's actually there. */
  function markFeatherCleared() {
    const inset = Math.min(w, h) * 0.14;
    const cw = w / GRID;
    const ch = h / GRID;

    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const cx = (c + 0.5) * cw;
        const cy = (r + 0.5) * ch;
        const inFeather = cx < inset || cx > w - inset || cy < inset || cy > h - inset;
        if (inFeather) cleared[r * GRID + c] = true;
      }
    }
  }

  /* --- Erasing ---------------------------------------------------------- */

  function erase(x, y, radius) {
    ctx.globalCompositeOperation = 'destination-out';

    /* Soft-edged brush: a hard circle looks like a cookie cutter. */
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.55, 'rgba(0,0,0,0.85)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    markCleared(x, y, radius * 0.6);
  }

  function markCleared(x, y, radius) {
    const cw = w / GRID;
    const ch = h / GRID;
    const c0 = Math.max(0, Math.floor((x - radius) / cw));
    const c1 = Math.min(GRID - 1, Math.floor((x + radius) / cw));
    const r0 = Math.max(0, Math.floor((y - radius) / ch));
    const r1 = Math.min(GRID - 1, Math.floor((y + radius) / ch));

    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) cleared[r * GRID + c] = true;
    }
  }

  function progress() {
    let n = 0;
    for (const c of cleared) if (c) n++;
    return n / cleared.length;
  }

  function checkSolved() {
    if (solved || progress() < SOLVE_AT) return;
    solved = true;

    /* Everything still on the canvas goes at once, as one slow fade. It used
       to be erased instantly and in patches, which looked abrupt and made the
       last of the ash vanish in pieces. Fading the whole layer keeps it calm
       and means she never has to scrub the corners. */
    canvas.style.transition = 'opacity 1.6s var(--ease-out)';
    canvas.style.opacity = '0';
    solve();
  }

  /* Ash used to creep back at the edges on a timer. It read as sporadic and
     harsh — random dark patches appearing while she worked — so it's gone.
     What she clears stays cleared.

     --- Input ------------------------------------------------------------
     One code path for mouse and touch via Pointer Events. Interpolating
     between the last point and this one matters: a fast swipe fires
     pointermove sparsely and you'd otherwise wipe a dotted line. */

  let drawing = false;
  let prev = null;

  function localPoint(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function brushSize(e) {
    /* Coarse pointers get a bigger brush — a fingertip is not a cursor. */
    const touch = e.pointerType === 'touch';
    return touch ? BRUSH_MAX : BRUSH_MIN;
  }

  function onDown(e) {
    if (solved) return;
    drawing = true;
    canvas.setPointerCapture?.(e.pointerId);
    prev = localPoint(e);
    erase(prev.x, prev.y, brushSize(e));
    checkSolved();
  }

  function onMove(e) {
    if (!drawing || solved) return;
    const p = localPoint(e);
    const r = brushSize(e);

    /* Fill the gap since the last event so fast swipes leave a solid trail. */
    const dist = Math.hypot(p.x - prev.x, p.y - prev.y);
    const steps = Math.min(24, Math.ceil(dist / (r * 0.4)));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      erase(prev.x + (p.x - prev.x) * t, prev.y + (p.y - prev.y) * t, r);
    }
    if (steps === 0) erase(p.x, p.y, r);

    prev = p;
    checkSolved();
  }

  function onUp() {
    drawing = false;
    prev = null;
  }

  /* Hovering with a mouse also brushes lightly — discoverable without
     needing to guess that you're meant to press. */
  function onHover(e) {
    if (drawing || solved || e.pointerType === 'touch') return;
    const p = localPoint(e);
    erase(p.x, p.y, BRUSH_MIN * 0.5);
    checkSolved();
  }

  const ro = new ResizeObserver(resize);
  ro.observe(wipe);
  resize();

  /* Pre-solved: she keeps the photo and the verse, and there's nothing to
     wipe. Attach no input, run no timers. */
  if (preSolved) {
    canvas.style.opacity = '0';
    return { destroy() { ro.disconnect(); } };
  }

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointermove', onHover);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);

  return {
    destroy() {
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointermove', onHover);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    },
  };
}
