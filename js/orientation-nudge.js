/* ==========================================================================
   orientation-nudge.js — invites landscape where a section genuinely wants
   the extra room. Never demands it.

   Two rules this module exists to enforce:

   1. It is an invitation with a dismiss, not a gate. Every section that
      shows it has a working portrait layout, so "stay as you are" is an
      honest offer rather than a dead end.
   2. It is never a full-page overlay. It covers the section that wants
      rotating and nothing else.

   Detection is matchMedia. Not window.orientation (deprecated), and
   definitely not screen.orientation.lock() — unsupported on iOS Safari, and
   forcing someone's screen around would be hostile even where it works.
   ========================================================================== */

const QUERY = '(orientation: portrait) and (max-width: 820px)';
const DISMISS_KEY = 'ardh:nudge-dismissed';

const mql = window.matchMedia(QUERY);

function dismissed() {
  try {
    return JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]');
  } catch {
    return [];
  }
}

function rememberDismissal(id) {
  try {
    const all = new Set(dismissed());
    all.add(id);
    localStorage.setItem(DISMISS_KEY, JSON.stringify([...all]));
  } catch {
    /* no-op: it just asks again next time, which is survivable */
  }
}

/**
 * Attach a rotate invitation to one section.
 * @param {HTMLElement} section
 * @param {string} message  one line, in the site's voice
 * @returns {{destroy(): void}}
 */
export function attachNudge(section, message) {
  const overlay = document.createElement('div');
  overlay.className = 'nudge';
  overlay.hidden = true;

  const inner = document.createElement('div');
  inner.className = 'nudge__inner glass';

  const glyph = document.createElement('div');
  glyph.className = 'nudge__glyph';
  glyph.setAttribute('aria-hidden', 'true');
  glyph.textContent = '▭';

  const text = document.createElement('p');
  text.className = 'nudge__text t-verse';
  text.textContent = message;

  const stay = document.createElement('button');
  stay.type = 'button';
  stay.className = 'nudge__stay t-util';
  stay.textContent = 'Stay as you are';

  inner.append(glyph, text, stay);
  overlay.append(inner);
  section.append(overlay);

  let userDismissed = dismissed().includes(section.id);

  function sync() {
    /* Rotating counts as accepting the invitation, so landscape always
       hides it regardless of what was dismissed before. */
    overlay.hidden = userDismissed || !mql.matches;
  }

  stay.addEventListener('click', () => {
    userDismissed = true;
    rememberDismissal(section.id);
    sync();
  });

  mql.addEventListener('change', sync);
  sync();

  return {
    destroy() {
      mql.removeEventListener('change', sync);
      overlay.remove();
    },
  };
}

/** True when the viewport is a portrait phone. Puzzles use this to pick an axis. */
export const isPortraitPhone = () => mql.matches;

/** Run a callback whenever that changes, so a puzzle can re-lay out live. */
export function onOrientationChange(fn) {
  mql.addEventListener('change', fn);
  return () => mql.removeEventListener('change', fn);
}
