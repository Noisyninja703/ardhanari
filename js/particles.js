/* ==========================================================================
   particles.js — one canvas, one loop, per-section presets.

   Deliberately one shared canvas rather than one per section: seven
   canvases each running their own RAF is how you cook a phone. The active
   preset changes as sections come into view; particles cross-fade.
   ========================================================================== */

import { prefersReducedMotion } from './scroll.js';

/* Sizes and alphas are deliberately well clear of sub-pixel. An earlier pass
   used 0.4-1.3px at alpha 0.08 and the result was technically drawing and
   practically invisible — a few dozen lit pixels on a whole phone screen.
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

let particles = [];
let preset = PRESETS.none;
let targetPreset = PRESETS.none;
let running = false;
let visible = true;
let swapTimer = null;

/* Budget scales to screen area and core count. A phone that thermal-throttles
   mid-poem is a worse outcome than fewer ash motes. */
function budget(count) {
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

function spawn(p = {}) {
  const s = targetPreset;
  return {
    x: p.x ?? rand(0, w),
    y: p.y ?? rand(0, h),
    r: rand(s.size[0], s.size[1]),
    vx: rand(s.vx[0], s.vx[1]),
    vy: rand(s.vy[0], s.vy[1]),
    a: rand(s.alpha[0], s.alpha[1]),
    baseA: 0,
    phase: rand(0, Math.PI * 2),
  };
}

function rebuild() {
  const n = budget(targetPreset.count);
  particles = Array.from({ length: n }, () => {
    const p = spawn();
    p.baseA = p.a;
    return p;
  });
  preset = targetPreset;
}

function resize() {
  if (!canvas) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2); /* 3x on a phone buys nothing */
  w = canvas.clientWidth;
  h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  rebuild();
}

function frame() {
  if (!running) return;

  ctx.clearRect(0, 0, w, h);
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

    /* Halo first, then the core on top: two cheap arcs give a soft bloom
       without a per-particle gradient or a canvas blur. */
    if (preset.halo) {
      ctx.beginPath();
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${(p.a * 0.16 * preset.halo).toFixed(3)})`;
      ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${p.a.toFixed(3)})`;
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  requestAnimationFrame(frame);
}

function start() {
  if (running || prefersReducedMotion() || !visible) return;
  running = true;
  requestAnimationFrame(frame);
}

function stop() {
  running = false;
}

/* --- Public API ---------------------------------------------------------- */

export function initParticles(el) {
  canvas = el;
  ctx = canvas.getContext('2d', { alpha: true });
  resize();

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('orientationchange', () => requestAnimationFrame(resize));

  /* Backgrounded tab: stop entirely. Nobody is watching. */
  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    visible ? start() : stop();
  });

  if (!prefersReducedMotion()) start();
}

/** Switch presets as sections come into view. @param {keyof PRESETS} name */
export function setPreset(name) {
  const next = PRESETS[name] || PRESETS.none;
  if (next === targetPreset) return;

  const first = targetPreset === PRESETS.none && particles.length === 0;
  targetPreset = next;

  /* Cross-fade rather than swapping instantly: ash becoming stars mid-scroll
     used to pop, which added to the harshness at section boundaries. Fade the
     canvas out, change the field while nobody can see it, fade back in. */
  if (first || prefersReducedMotion()) {
    rebuild();
    next.count > 0 ? start() : stop();
    return;
  }

  canvas.style.transition = 'opacity 620ms ease';
  canvas.style.opacity = '0';

  clearTimeout(swapTimer);
  swapTimer = setTimeout(() => {
    rebuild();
    if (next.count > 0) {
      start();
      canvas.style.opacity = '1';
    } else {
      stop();
    }
  }, 620);
}

