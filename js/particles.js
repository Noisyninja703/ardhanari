/* ==========================================================================
   particles.js: one canvas, one loop, per-section presets.

   Deliberately one shared canvas rather than one per section: seven canvases
   each running their own RAF is how you cook a phone.

   Presets cross-fade properly: when the section changes, the outgoing field
   keeps running and fades out while the incoming one fades in over the top,
   both drawn in the same frame. An earlier version faded the whole canvas to
   zero, swapped the field, then faded back in, which left a visible moment
   with no particles at all, and read as a blink rather than a transition.
   ========================================================================== */

import { prefersReducedMotion } from './scroll.js';

/* How long a field takes to fade all the way in or out. */
const FADE_MS = 900;

/* Sizes and alphas are deliberately well clear of sub-pixel. An earlier pass
   used 0.4-1.3px at alpha 0.08 and the result was technically drawing and
   practically invisible, a few dozen lit pixels on a whole phone screen.
   `halo` adds a soft second pass around each particle so they read as points
   of light rather than dots. */
const PRESETS = {
  /* Fine grey motes falling slowly, with lateral drift. Shiva's ash. */
  ash: {
    count: 110,
    colour: [163, 158, 170],
    size: [0.9, 2.4],
    vy: [0.08, 0.34],
    vx: [-0.12, 0.12],
    alpha: [0.22, 0.6],
    twinkle: 0,
    halo: 0.5,
  },
  /* Points that breathe. The night sky. */
  stars: {
    count: 150,
    colour: [242, 238, 228],
    size: [0.7, 2],
    vy: [-0.01, 0.01],
    vx: [-0.02, 0.02],
    alpha: [0.3, 1],
    twinkle: 0.014,
    halo: 1,
  },
  /* Warm flecks rising. Used from Tapasya onward. */
  embers: {
    count: 70,
    colour: [214, 176, 92],
    size: [1, 2.6],
    vy: [-0.42, -0.12],
    vx: [-0.16, 0.16],
    alpha: [0.28, 0.75],
    twinkle: 0.008,
    halo: 1,
  },
  none: {
    count: 0, colour: [0, 0, 0], size: [0, 0], vy: [0, 0], vx: [0, 0],
    alpha: [0, 0], twinkle: 0, halo: 0,
  },
};

const rand = (min, max) => min + Math.random() * (max - min);

let canvas = null;
let ctx = null;
let dpr = 1;
let w = 0;
let h = 0;

/* Each layer is one preset's field of particles plus its own fade weight.
   More than one can be alive at a time, that's what makes the cross-fade
   work. Oldest first, so the incoming field draws over the outgoing one. */
let layers = [];
let current = PRESETS.none;

let running = false;
let visible = true;
let lastFrame = 0;

/* Budget scales to screen area and core count. A phone that thermal-throttles
   mid-poem is a worse outcome than fewer ash motes. */
function budget(count) {
  if (count === 0) return 0;
  const area = w * h;
  const areaFactor = Math.min(1, area / (1440 * 900));
  const cores = navigator.hardwareConcurrency || 4;
  const coreFactor = cores <= 4 ? 0.7 : cores <= 8 ? 0.9 : 1;
  const isTouch = window.matchMedia('(hover: none)').matches;
  const touchFactor = isTouch ? 0.75 : 1;
  /* A floor high enough that a small screen still looks like a sky rather
     than a handful of stray dots. */
  return Math.max(45, Math.round(count * areaFactor * coreFactor * touchFactor));
}

function spawn(preset) {
  const a = rand(preset.alpha[0], preset.alpha[1]);
  return {
    x: rand(0, w),
    y: rand(0, h),
    r: rand(preset.size[0], preset.size[1]),
    vx: rand(preset.vx[0], preset.vx[1]),
    vy: rand(preset.vy[0], preset.vy[1]),
    a,
    baseA: a,
    phase: rand(0, Math.PI * 2),
  };
}

function makeLayer(preset, weight) {
  return {
    preset,
    particles: Array.from({ length: budget(preset.count) }, () => spawn(preset)),
    weight,
    target: 1,
  };
}

function resize() {
  if (!canvas) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2); /* 3x on a phone buys nothing */
  w = canvas.clientWidth;
  h = canvas.clientHeight;
  if (!w || !h) return;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  /* Respawn into the new bounds, keeping each layer's fade state so a resize
     mid-transition doesn't restart it. */
  for (const layer of layers) {
    layer.particles = Array.from({ length: budget(layer.preset.count) }, () => spawn(layer.preset));
  }

  /* The static sky doesn't redraw itself, so a resize has to. */
  if (prefersReducedMotion()) renderStatic();
}

function drawLayer(layer) {
  const { preset, particles, weight } = layer;
  const [cr, cg, cb] = preset.colour;

  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;

    if (preset.twinkle) {
      p.phase += preset.twinkle;
      p.a = p.baseA * (0.55 + 0.45 * Math.sin(p.phase));
    }

    /* Wrap rather than respawn: no popping in at the edges. */
    if (p.y > h + 4) { p.y = -4; p.x = rand(0, w); }
    else if (p.y < -4) { p.y = h + 4; p.x = rand(0, w); }
    if (p.x > w + 4) p.x = -4;
    else if (p.x < -4) p.x = w + 4;

    const alpha = p.a * weight;
    if (alpha <= 0.002) continue;

    /* Halo first, then the core on top: two cheap arcs give a soft bloom
       without a per-particle gradient or a canvas blur. */
    if (preset.halo) {
      ctx.beginPath();
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${(alpha * 0.16 * preset.halo).toFixed(3)})`;
      ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`;
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function frame(ts) {
  if (!running) return;

  /* Time-based rather than per-frame, so the fade takes the same wall-clock
     time on a 60Hz phone and a 144Hz monitor. */
  const dt = lastFrame ? Math.min(ts - lastFrame, 100) : 16;
  lastFrame = ts;
  const step = dt / FADE_MS;

  ctx.clearRect(0, 0, w, h);

  for (const layer of layers) {
    if (layer.weight < layer.target) layer.weight = Math.min(layer.target, layer.weight + step);
    else if (layer.weight > layer.target) layer.weight = Math.max(layer.target, layer.weight - step);
    drawLayer(layer);
  }

  /* Retire fields that have finished fading out. */
  layers = layers.filter((l) => l.target > 0 || l.weight > 0.002);

  if (layers.length === 0) {
    running = false;
    lastFrame = 0;
    return;
  }

  requestAnimationFrame(frame);
}

/* Reduced motion still gets a sky, it just doesn't move. One frame, drawn
   once, is the difference between respecting the preference and removing the
   atmosphere from the page. */
function renderStatic() {
  if (!ctx || !w || !h) return;
  ctx.clearRect(0, 0, w, h);
  for (const layer of layers) {
    if (layer.target > 0) drawLayer(layer);
  }
}

function start() {
  if (prefersReducedMotion()) {
    renderStatic();
    return;
  }
  if (running || !visible || layers.length === 0) return;
  running = true;
  lastFrame = 0;
  requestAnimationFrame(frame);
}

function stop() {
  running = false;
  lastFrame = 0;
}

/* --- Public API ---------------------------------------------------------- */

export function initParticles(el) {
  canvas = el;
  ctx = canvas.getContext('2d', { alpha: true });
  resize();

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('orientationchange', () => requestAnimationFrame(resize));

  /* A ResizeObserver on the canvas itself, because `resize` is not enough on a
     phone. The canvas is sized in dvh, so collapsing browser chrome changes its
     CSS height without necessarily firing a window resize: the backing store
     keeps its old dimensions and the whole field renders stretched until
     something else happens to trigger a re-measure. That's why it looked wrong
     on first load and corrected itself the moment you scrolled to another
     section and back. */
  new ResizeObserver(resize).observe(canvas);

  /* The first measurement can also land before layout has settled. Re-measure
     once more after the first frame and once the page has fully loaded. */
  requestAnimationFrame(resize);
  if (document.readyState !== 'complete') {
    window.addEventListener('load', () => requestAnimationFrame(resize), { once: true });
  }

  /* Backgrounded tab: stop entirely. Nobody is watching. */
  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    if (visible) start();
    else stop();
  });
}

/** Switch fields as sections come into view. @param {keyof PRESETS} name */
export function setPreset(name) {
  const next = PRESETS[name] || PRESETS.none;
  if (next === current) return;
  current = next;

  /* Everything already on screen starts fading out, and keeps drifting while
     it does. Nothing is cleared, so there is never a frame with no particles. */
  for (const layer of layers) layer.target = 0;

  if (next.count > 0) {
    /* Reduced motion gets no fade, it arrives already at full strength. */
    layers.push(makeLayer(next, prefersReducedMotion() ? 1 : 0));
  }

  /* Scrolling quickly through several sections would otherwise stack a field
     per section and multiply the draw cost. Keep the newest few; the older
     ones are nearly transparent by then, so dropping them isn't visible. */
  const MAX_LAYERS = 3;
  if (layers.length > MAX_LAYERS) layers = layers.slice(-MAX_LAYERS);

  start();
}
