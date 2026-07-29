/* ==========================================================================
   scroll.js — one RAF loop drives every parallax transform on the page.

   The mistake this file exists to prevent: seven sections each attaching
   their own scroll listener and each writing transforms. That thrashes
   layout and drops frames on any phone. Instead, everything registers
   here, and we write all transforms once per frame.
   ========================================================================== */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');

/** @type {Array<{el: HTMLElement, speed: number, section: HTMLElement}>} */
const layers = [];

const pointer = { x: 0, y: 0, active: false };
let glowEl = null;

let frameQueued = false;
let viewportH = window.innerHeight;

/* --- Registration -------------------------------------------------------- */

/**
 * Register an element to be moved as the page scrolls.
 * @param {HTMLElement} el       the layer to transform
 * @param {number} speed         0 = pinned to the page, 1 = moves a full
 *                               viewport height across the section's travel.
 *                               Sensible range is 0.05–0.4. Negative moves
 *                               against the scroll.
 * @param {HTMLElement} [section] the section used to measure progress;
 *                                defaults to the layer's closest .section
 */
export function registerLayer(el, speed, section) {
  const host = section || el.closest('.section');
  if (!host) return;
  el.classList.add('parallax-layer');
  layers.push({ el, speed, section: host });
  queue();
}

export function attachPointerGlow(el) {
  glowEl = el;
}

/* --- The loop ------------------------------------------------------------ */

function queue() {
  if (frameQueued) return;
  frameQueued = true;
  requestAnimationFrame(render);
}

function render() {
  frameQueued = false;
  if (REDUCED.matches) return;

  for (const layer of layers) {
    const rect = layer.section.getBoundingClientRect();

    /* Skip anything comfortably offscreen — no point writing transforms
       to elements nobody can see. */
    if (rect.bottom < -viewportH * 0.5 || rect.top > viewportH * 1.5) continue;

    /* progress: -1 when the section sits a full viewport below the fold,
       0 when centred, +1 when it has scrolled a viewport above. */
    const centre = rect.top + rect.height / 2;
    const progress = (viewportH / 2 - centre) / viewportH;

    const shift = progress * layer.speed * viewportH;
    layer.el.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0)`;
  }

  if (glowEl && pointer.active) {
    glowEl.style.setProperty('--glow-x', `${pointer.x}px`);
    glowEl.style.setProperty('--glow-y', `${pointer.y}px`);
  }
}

/* --- Wiring -------------------------------------------------------------- */

export function initScroll() {
  window.addEventListener('scroll', queue, { passive: true });

  window.addEventListener(
    'resize',
    () => {
      viewportH = window.innerHeight;
      queue();
    },
    { passive: true }
  );

  /* Orientation change fires before the new dimensions settle on iOS, so
     re-measure on the next frame as well as immediately. */
  window.addEventListener('orientationchange', () => {
    requestAnimationFrame(() => {
      viewportH = window.innerHeight;
      queue();
    });
  });

  /* Pointer glow. Only meaningful with a real cursor; the element is
     display:none under (hover: none) so this is cheap on touch anyway. */
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch') return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      if (!pointer.active) {
        pointer.active = true;
        if (glowEl) glowEl.style.setProperty('--glow-opacity', '1');
      }
      queue();
    },
    { passive: true }
  );

  REDUCED.addEventListener('change', () => {
    if (REDUCED.matches) {
      for (const layer of layers) layer.el.style.transform = '';
    } else {
      queue();
    }
  });

  queue();
}

export const prefersReducedMotion = () => REDUCED.matches;
