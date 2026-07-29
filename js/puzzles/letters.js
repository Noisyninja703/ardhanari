/* ==========================================================================
   puzzles/letters.js — Purnima

   The full moon, and the last section. Every letter drifts in the dark as a
   folded piece of paper. She can push them around, and opening one unfolds it
   into something readable.

   Letters are read from data/letters.json and that file is the whole store.
   By decision there is no database, no sync and no composer: they're written in
   advance and committed. She doesn't write back through the site, which also
   means the last thing she reads here is unambiguously his.

   Like the constellation, this section has no gate. It opens on arrival.
   ========================================================================== */

import { AUTHORS } from '../content.js';

const SOURCE = 'data/letters.json';
const TAP_SLOP = 7;        /* px of movement still counted as a tap, not a drag */
const FRICTION = 0.92;     /* how quickly a flicked letter comes to rest */
const MIN_V = 0.04;

export default function create({ section, body, data, solved: preSolved = false, solve }) {
  const field = document.createElement('div');
  field.className = 'letters';

  const card = buildCard();
  body.append(field);

  /* The open letter belongs to the section, not the field, so it can fill the
     screen instead of being confined to the poem band. The CSS adds back the
     padding that keeps it clear of the gutters and the moon meter. */
  section.append(card.root);

  /* --- Loading ----------------------------------------------------------- */

  let items = [];

  async function load() {
    try {
      const res = await fetch(SOURCE, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const json = await res.json();
      items = Array.isArray(json?.letters) ? json.letters : [];
    } catch (err) {
      /* A missing or unreadable archive must not take the section down. She
         gets a quiet line instead of an empty screen. */
      console.warn('[ardh] could not read', SOURCE, err);
      items = [];
    }

    items.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));

    if (items.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'letters__empty t-verse';
      empty.textContent = data.emptyLetters ?? '';
      field.append(empty);
      return;
    }

    items.forEach(makeLetter);
  }

  /* --- One folded letter -------------------------------------------------- */

  const paper = [];   /* { el, x, y, vx, vy } in percentages of the field */

  function makeLetter(letter, i) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'letter';
    if (letter.author === 'her') el.classList.add('letter--her');

    el.innerHTML = '<span class="letter__fold" aria-hidden="true"></span>' +
                   '<span class="letter__seal" aria-hidden="true"></span>';
    el.setAttribute('aria-label', `Letter from ${who(letter.author)}, ${when(letter.createdAt)}. Open it.`);

    /* Scattered on a loose grid so they never start in a heap, with enough
       jitter that the grid doesn't show. */
    const cols = 3;
    const cx = ((i % cols) + 0.5) / cols;
    const cy = (Math.floor(i / cols) + 0.5) / Math.max(1, Math.ceil(items.length / cols));
    const state = {
      el,
      x: clamp(cx * 100 + rand(-9, 9), 8, 92),
      y: clamp(cy * 100 + rand(-12, 12), 12, 88),
      vx: 0,
      vy: 0,
    };

    /* Each one hangs at its own angle and drifts on its own clock. */
    el.style.setProperty('--tilt', `${rand(-11, 11).toFixed(1)}deg`);
    el.style.animationDelay = `${(Math.random() * 8).toFixed(2)}s`;
    el.style.animationDuration = `${(13 + Math.random() * 9).toFixed(2)}s`;

    place(state);
    paper.push(state);
    field.append(el);

    wireDrag(state, letter);
  }

  function place(s) {
    s.el.style.left = `${s.x}%`;
    s.el.style.top = `${s.y}%`;
  }

  /* --- Dragging, with a little inertia ----------------------------------- */

  let glide = null;   /* the RAF that lets a flicked letter coast to a stop */

  function coast() {
    let moving = false;

    for (const s of paper) {
      if (Math.abs(s.vx) < MIN_V && Math.abs(s.vy) < MIN_V) { s.vx = 0; s.vy = 0; continue; }
      s.x = clamp(s.x + s.vx, 4, 96);
      s.y = clamp(s.y + s.vy, 6, 94);
      s.vx *= FRICTION;
      s.vy *= FRICTION;
      place(s);
      moving = true;
    }

    glide = moving ? requestAnimationFrame(coast) : null;
  }

  function startCoasting() {
    if (!glide) glide = requestAnimationFrame(coast);
  }

  function wireDrag(s, letter) {
    let drag = null;

    s.el.addEventListener('pointerdown', (e) => {
      s.el.setPointerCapture?.(e.pointerId);
      s.vx = 0;
      s.vy = 0;
      drag = {
        id: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        moved: 0,
      };
      s.el.classList.add('is-held');
    });

    s.el.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;

      const r = field.getBoundingClientRect();
      if (!r.width || !r.height) return;

      /* Work in percentages so a resize doesn't fling everything off. */
      const dx = ((e.clientX - drag.lastX) / r.width) * 100;
      const dy = ((e.clientY - drag.lastY) / r.height) * 100;

      s.x = clamp(s.x + dx, 4, 96);
      s.y = clamp(s.y + dy, 6, 94);
      place(s);

      s.vx = dx;
      s.vy = dy;
      drag.moved += Math.hypot(e.clientX - drag.lastX, e.clientY - drag.lastY);
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
    });

    function release(e) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      const wasTap = drag.moved < TAP_SLOP;
      drag = null;
      s.el.classList.remove('is-held');

      if (wasTap) {
        /* A tap opens it. Nudge nothing, or the letter slides out from under
           her finger as the card appears. */
        s.vx = 0;
        s.vy = 0;
        card.open(letter);
      } else {
        startCoasting();
      }
    }

    s.el.addEventListener('pointerup', release);
    s.el.addEventListener('pointercancel', release);
  }

  /* --- Reading one ------------------------------------------------------- */

  function buildCard() {
    const root = document.createElement('div');
    root.className = 'letter-card glass';
    root.hidden = true;

    const meta = document.createElement('p');
    meta.className = 'letter-card__meta t-util';

    const bodyEl = document.createElement('div');
    bodyEl.className = 'letter-card__body';

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'letter-card__close t-util';
    close.textContent = 'Fold it up';

    root.append(meta, bodyEl, close);

    let opener = null;

    function open(letter) {
      meta.textContent = `${who(letter.author)}, ${when(letter.createdAt)}`;

      /* Paragraphs, not innerHTML: the body is data and must never be parsed
         as markup. Once she can write her own letters this is the line that
         keeps a stray angle bracket from becoming a bug. */
      bodyEl.replaceChildren(
        ...String(letter.body ?? '')
          .split(/\n{2,}/)
          .map((para) => {
            const p = document.createElement('p');
            p.className = 't-verse';
            p.textContent = para.trim();
            return p;
          })
      );

      root.hidden = false;
      requestAnimationFrame(() => root.classList.add('is-open'));

      /* The glass steps aside while a letter is open. It's covering the words
         she came here to read. */
      document.documentElement.classList.add('lens-busy');
      opener = document.activeElement;
      close.focus({ preventScroll: true });
    }

    function shut() {
      document.documentElement.classList.remove('lens-busy');
      root.classList.remove('is-open');
      setTimeout(() => {
        if (!root.classList.contains('is-open')) root.hidden = true;
      }, 420);
      if (opener instanceof HTMLElement) opener.focus({ preventScroll: true });
      opener = null;
    }

    close.addEventListener('click', shut);
    return { root, open, shut, isOpen: () => root.classList.contains('is-open') };
  }

  function onKey(e) {
    if (e.key === 'Escape' && card.isOpen()) card.shut();
  }
  window.addEventListener('keydown', onKey);

  load();

  /* --- Opening the section ----------------------------------------------- */

  if (preSolved) {
    return { destroy() {} };
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.intersectionRatio < 0.7) continue;
        io.disconnect();
        solve();
      }
    },
    { threshold: [0, 0.7, 1] }
  );
  io.observe(section);

  return {
    destroy() {
      io.disconnect();
      /* The letters stay draggable and Escape keeps closing a card: this
         section is solved the moment she arrives, and it would be a strange
         gift that stopped working once it was finished. */
    },
  };
}

/* --- Small helpers -------------------------------------------------------- */

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const rand = (lo, hi) => lo + Math.random() * (hi - lo);

function who(author) {
  return AUTHORS[author] ?? AUTHORS.sivan;
}

function when(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'undated';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}
