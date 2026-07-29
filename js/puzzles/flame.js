/* ==========================================================================
   puzzles/flame.js — Tapasya

   One small flame. The verse types itself only while she keeps a pointer or a
   finger near it; drift away and the flame dims and the words stop. The
   mechanic is the devotion: it asks her to be still and stay, which is exactly
   what Parvati did for a hundred years.

   Notes:
   - Types into the existing verse paragraphs rather than a separate element,
     so the copy stays in content.js and is never duplicated.
   - Touch has no idle cursor, so there it's press-and-hold rather than
     hover-proximity. Same as the spark puzzle.
   - destroy() fills in whatever is left unwritten, which is what makes the
     "Let it burn" skip land on a complete verse.
   ========================================================================== */

const NEAR_PX = 190;    /* how close counts as tending the flame */
const CHARS_PER_S = 26; /* typing speed while it's burning */

export default function create({ section, body, data, solved: preSolved = false, solve }) {
  const verses = body.querySelector('.verses');
  const paragraphs = [...verses.querySelectorAll('p')];

  paragraphs.forEach((p, i) => {
    p.dataset.full = data.verses[i] ?? p.textContent;
    p.textContent = '';
  });

  /* Reserve each line's final height before anything is typed. The band is
     vertically centred, so without this every new line would shove the ones
     above it upward and the verse would jitter its way onto the screen.
     Measured by briefly putting the real text back. */
  function reserveHeights() {
    const detached = caret.parentElement;
    caret.remove();

    for (const p of paragraphs) {
      const typed = p.textContent;
      p.style.minHeight = '';
      p.textContent = p.dataset.full;
      p.style.minHeight = `${p.getBoundingClientRect().height}px`;
      p.textContent = typed;
    }

    if (detached) detached.append(caret);
  }

  /* --- Build ------------------------------------------------------------- */

  const flame = document.createElement('button');
  flame.type = 'button';
  flame.className = 'flame';
  flame.setAttribute('aria-label', 'Tend the flame to bring the verse in');

  const wick = document.createElement('span');
  wick.className = 'flame__body';
  wick.setAttribute('aria-hidden', 'true');
  flame.append(wick);

  body.prepend(flame);

  const caret = document.createElement('span');
  caret.className = 'caret';
  caret.setAttribute('aria-hidden', 'true');

  /* --- State ------------------------------------------------------------- */

  let line = 0;          /* which paragraph is being written */
  let chars = 0;         /* how far into it */
  let warm = false;      /* is she tending the flame right now */
  let done = false;
  let raf = null;
  let lastTs = 0;
  let carry = 0;         /* fractional characters between frames */

  function fillEverything() {
    for (const p of paragraphs) p.textContent = p.dataset.full;
    caret.remove();
  }

  function finish() {
    if (done) return;
    done = true;
    setWarm(false);
    stopLoop();
    fillEverything();
    flame.classList.add('is-lit');
    flame.disabled = true;
    flame.setAttribute('aria-label', 'Lit');
    solve();
  }

  if (preSolved) {
    /* Already done, or reduced motion: the verse is simply there. */
    fillEverything();
    flame.classList.add('is-lit');
    flame.disabled = true;
    flame.setAttribute('aria-label', 'Lit');
    return { destroy() {} };
  }

  /* --- Typing ------------------------------------------------------------ */

  function writeChars(n) {
    for (let i = 0; i < n; i++) {
      const p = paragraphs[line];
      if (!p) { finish(); return; }

      const full = p.dataset.full;
      if (chars >= full.length) {
        /* Line complete: settle it and move down. */
        p.textContent = full;
        line += 1;
        chars = 0;
        if (line >= paragraphs.length) { finish(); return; }
        continue;
      }

      chars += 1;
      p.textContent = full.slice(0, chars);
      p.append(caret);
    }
  }

  function tick(ts) {
    if (done) return;
    const dt = lastTs ? Math.min(ts - lastTs, 120) : 16;
    lastTs = ts;

    if (warm) {
      carry += (dt / 1000) * CHARS_PER_S;
      const whole = Math.floor(carry);
      if (whole > 0) {
        carry -= whole;
        writeChars(whole);
      }
    } else {
      carry = 0;
    }

    if (!done) raf = requestAnimationFrame(tick);
  }

  function startLoop() {
    if (raf || done) return;
    lastTs = 0;
    raf = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  function setWarm(next) {
    if (warm === next || done) return;
    warm = next;
    flame.classList.toggle('is-warm', warm);
    /* The caret only blinks while the flame is out, so a paused verse looks
       like it's waiting for her rather than broken. */
    caret.classList.toggle('is-waiting', !warm);
    if (warm) startLoop();
  }

  /* --- Pointer (mouse / trackpad): proximity ----------------------------- */

  function onPointerMove(e) {
    if (done || e.pointerType === 'touch') return;
    const r = flame.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    setWarm(Math.hypot(dx, dy) < NEAR_PX);
  }

  function onPointerLeave() {
    if (done) return;
    setWarm(false);
  }

  /* --- Touch: press and hold -------------------------------------------- */

  function onPointerDown(e) {
    if (done || e.pointerType !== 'touch') return;
    const r = flame.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < NEAR_PX * 1.4) setWarm(true);
  }

  function onPointerUp() {
    if (done) return;
    setWarm(false);
  }

  /* --- Keyboard --------------------------------------------------------- */

  function onFocus() { setWarm(true); }   /* holding focus is holding still */
  function onBlur() { setWarm(false); }

  flame.addEventListener('focus', onFocus);
  flame.addEventListener('blur', onBlur);
  /* A click finishes it outright: she's found the flame, don't make her hover. */
  flame.addEventListener('click', finish);

  section.addEventListener('pointermove', onPointerMove, { passive: true });
  section.addEventListener('pointerleave', onPointerLeave, { passive: true });
  section.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { passive: true });
  window.addEventListener('pointercancel', onPointerUp, { passive: true });

  /* Start the caret waiting at the top of the verse so there's something to
     notice before she works out what to do. */
  paragraphs[0]?.append(caret);
  caret.classList.add('is-waiting');

  reserveHeights();
  /* Re-measure once the display face has actually loaded, and whenever the
     column changes width and the lines rewrap. */
  document.fonts?.ready.then(reserveHeights).catch(() => {});

  let resizeQueued = false;
  function onResize() {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => {
      resizeQueued = false;
      reserveHeights();
    });
  }
  window.addEventListener('resize', onResize, { passive: true });

  return {
    destroy() {
      stopLoop();
      window.removeEventListener('resize', onResize);
      /* Whatever is left unwritten arrives now. This is what makes the skip
         link land on a whole verse rather than half a line. */
      fillEverything();
      section.removeEventListener('pointermove', onPointerMove);
      section.removeEventListener('pointerleave', onPointerLeave);
      section.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      flame.removeEventListener('focus', onFocus);
      flame.removeEventListener('blur', onBlur);
      flame.removeEventListener('click', finish);
    },
  };
}
