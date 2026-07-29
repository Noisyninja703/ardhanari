/* ==========================================================================
   particles.js — one canvas, one loop, per-section presets.

   Deliberately one shared canvas rather than one per section: seven
   canvases each running their own RAF is how you cook a phone. The active
   preset changes as sections come into view; particles cross-fade.
   ========================================================================== */

import { prefersReducedMotion } from './scroll.js';

const PRESETS = {
  /* Fine grey motes falling slowly, with lateral drift. Shiva's ash. */
  ash: {
    count: 90,
    colour: [140, 135, 148],
    size: [0.5, 1.8],
    vy: [0.08, 0.34],
    vx: [-0.12, 0.12],
    alpha: [0.12, 0.42],
    twinkle: 0,
  },
  /* Almost-static points that breathe. The night sky. */
  stars: {
    count: 130,
    colour: [239, 233, 220],
    size: [0.4, 1.3],
    vy: [-0.01, 0.01],
    vx: [-0.02, 0.02],
    alpha: [0.08, 0.6],
    twinkle: 0.014,
  },
  /* Warm flecks rising. Used from Tapasya onward. */
  embers: {
    count: 55,
    colour: [201, 162, 75],
    size: [0.6, 1.9],
    vy: [-0.42, -0.12],
    vx: [-0.16, 0.16],
    alpha: [0.14, 0.5],
    twinkle: 0.008,
  },
  none: { count: 0, colour: [0, 0, 0], size: [0, 0], vy: [0, 0], vx: [0, 0], alpha: [0, 0], twinkle: 0 },
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

/* Budget scales to screen area and core count. A phone that thermal-throttles
   mid-poem is a worse outcome than fewer ash motes. */
function budget(count) {
  const area = w * h;
  const areaFactor = Math.min(1, area / (1440 * 900));
  const cores = navigator.hardwareConcurrency || 4;
  const coreFactor = cores <= 4 ? 0.5 : cores <= 8 ? 0.8 : 1;
  const isTouch = window.matchMedia('(hover: none)').matches;
  const touchFactor = isTouch ? 0.55 : 1;
  return Math.max(8, Math.round(count * areaFactor * coreFactor * touchFactor));
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
  targetPreset = next;
  rebuild();
  if (next.count > 0) start();
  else stop();
}
