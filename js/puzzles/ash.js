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
   - touch-action: none on the surface (set in CSS) is load-bearing. Without
     it the browser claims the gesture and scrolls the page mid-wipe.
   ========================================================================== */

import { prefersReducedMotion } from '../scroll.js';

const SOLVE_AT = 0.9;      /* fraction of cells cleared before the gate opens */
const GRID = 16;            /* progress sampling resolution, per axis */
const BRUSH_MIN = 46;
const BRUSH_MAX = 86;
const REGROW_MS = 1400;     /* how often ash creeps back at the edges */

export default function create({ section, data, solved: preSolved = false, solve }) {
  const inner = section.querySelector('.section__inner');
  const verses = inner.querySelector('.verses');

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
  inner.insertBefore(wipe, inner.querySelector('.hint'));

  const ctx = canvas.getContext('2d');

  /* --- Ash rendering ---------------------------------------------------- */

  let w = 0;
  let h = 0;
  let dpr = 1;
  /** cleared[i] = true once that grid cell has been brushed */
  let cleared = new Array(GRID * GRID).fill(false);
  let solved = preSolved;

  function paintAsh() {
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);

    /* Base: near-void, slightly warmer than the page so the panel reads as
       a layer of dust rather than a hole. */
    const base = ctx.createLinearGradient(0, 0, w, h);
    base.addColorStop(0, 'rgba(16, 12, 22, 0.97)');
    base.addColorStop(0.5, 'rgba(26, 22, 32, 0.99)');
    base.addColorStop(1, 'rgba(14, 10, 20, 0.97)');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    /* Texture: soft grey blooms so the ash isn't a flat rectangle. */
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
    stopRegrow();
    /* Clear the rest for her rather than making her scrub the corners. */
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fillRect(0, 0, w, h);
    canvas.style.transition = 'opacity var(--d-slow) var(--ease-out)';
    canvas.style.opacity = '0';
    solve();
  }

  /* --- Regrowth ---------------------------------------------------------
     Ash creeps back in from the edges. Only ever at the perimeter, and
     never once she's solved it. */

  let regrowTimer = null;

  function regrow() {
    if (solved) return;
    ctx.globalCompositeOperation = 'source-over';

    const edge = Math.min(w, h) * 0.16;
    for (let i = 0; i < 5; i++) {
      /* Pick a point on the perimeter band. */
      const onVertical = Math.random() < 0.5;
      const x = onVertical ? (Math.random() < 0.5 ? Math.random() * edge : w - Math.random() * edge) : Math.random() * w;
      const y = onVertical ? Math.random() * h : (Math.random() < 0.5 ? Math.random() * edge : h - Math.random() * edge);
      const r = 30 + Math.random() * 50;

      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(20, 16, 26, 0.55)');
      g.addColorStop(1, 'rgba(20, 16, 26, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function startRegrow() {
    if (prefersReducedMotion() || regrowTimer) return;
    regrowTimer = setInterval(regrow, REGROW_MS);
  }
  function stopRegrow() {
    clearInterval(regrowTimer);
    regrowTimer = null;
  }

  /* --- Input ------------------------------------------------------------
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

  startRegrow();

  return {
    destroy() {
      stopRegrow();
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointermove', onHover);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    },
  };
}
