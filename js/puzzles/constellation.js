/* ==========================================================================
   puzzles/constellation.js — Nakshatra

   The breather. There is nothing to solve here: five gated sections in a row
   would be a chore rather than a gift, so this one just opens. It still lives
   in the puzzle system because that's how sections get built and how the next
   one is unsealed, but it calls solve() when she arrives rather than making her
   earn it.

   A slow field of stars. Six of them are photographs. Tapping one opens it.
   A missing photo file is not a failure: the star and its line still work, the
   same way the ash section's photo does.
   ========================================================================== */

const AMBIENT = 46;   /* how many plain stars sit behind the memories */

export default function create({ section, body, data, solved: preSolved = false, solve }) {
  const field = document.createElement('div');
  field.className = 'sky';

  /* --- Ambient stars ----------------------------------------------------- */

  const drift = document.createElement('div');
  drift.className = 'sky__drift';
  drift.setAttribute('aria-hidden', 'true');

  for (let i = 0; i < AMBIENT; i++) {
    const star = document.createElement('span');
    star.className = 'sky__star';
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.setProperty('--s', `${0.6 + Math.random() * 1.7}px`);
    star.style.setProperty('--a', (0.25 + Math.random() * 0.6).toFixed(2));
    /* Spread the twinkle out so they don't blink in unison. */
    star.style.animationDelay = `${(Math.random() * 6).toFixed(2)}s`;
    star.style.animationDuration = `${(3.5 + Math.random() * 4).toFixed(2)}s`;
    drift.append(star);
  }

  /* --- The lines between the memories -----------------------------------
     Drawn before the stars so they sit behind them, and in the order the
     memories are listed, so the shape reads as one asterism. */

  const memories = data.memories ?? [];
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'sky__lines');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');

  if (memories.length > 1) {
    const line = document.createElementNS(svgNS, 'polyline');
    line.setAttribute('points', memories.map((m) => `${m.at[0]},${m.at[1]}`).join(' '));
    svg.append(line);
  }

  field.append(svg, drift);

  /* --- The card a memory opens into -------------------------------------- */

  const card = document.createElement('div');
  card.className = 'memory glass';
  card.hidden = true;

  const cardImg = document.createElement('img');
  cardImg.className = 'memory__photo';
  cardImg.loading = 'lazy';
  cardImg.decoding = 'async';

  const cardLine = document.createElement('p');
  cardLine.className = 'memory__line t-verse';

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'memory__close t-util';
  close.textContent = 'Close';

  card.append(cardImg, cardLine, close);

  let openStar = null;

  function openMemory(memory, star) {
    cardLine.textContent = memory.line ?? '';

    /* Only show the frame if there's actually a picture in it. */
    if (memory.src) {
      cardImg.hidden = false;
      cardImg.src = memory.src;
      cardImg.alt = memory.alt ?? '';
    } else {
      cardImg.hidden = true;
    }

    card.hidden = false;
    /* Next frame, so the transition has a start state to run from. */
    requestAnimationFrame(() => card.classList.add('is-open'));

    /* The glass steps aside while something is open over the page. It would
       otherwise sit on top of the photograph, and reading a memory through a
       lens is not the point of the lens. */
    document.documentElement.classList.add('lens-busy');

    openStar?.classList.remove('is-open');
    openStar = star;
    star.classList.add('is-open');
    star.setAttribute('aria-expanded', 'true');
    close.focus({ preventScroll: true });
  }

  function closeMemory() {
    document.documentElement.classList.remove('lens-busy');
    card.classList.remove('is-open');
    openStar?.setAttribute('aria-expanded', 'false');
    openStar?.classList.remove('is-open');
    const returnTo = openStar;
    openStar = null;
    /* Wait for the fade before pulling it out of the layout. */
    setTimeout(() => {
      if (!card.classList.contains('is-open')) card.hidden = true;
    }, 420);
    returnTo?.focus({ preventScroll: true });
  }

  cardImg.addEventListener('error', () => { cardImg.hidden = true; });
  close.addEventListener('click', closeMemory);

  /* --- Memory stars ------------------------------------------------------ */

  for (const memory of memories) {
    const star = document.createElement('button');
    star.type = 'button';
    star.className = 'sky__memory';
    star.style.left = `${memory.at[0]}%`;
    star.style.top = `${memory.at[1]}%`;
    star.setAttribute('aria-expanded', 'false');
    star.setAttribute('aria-label', memory.line ? `Memory: ${memory.line}` : 'A memory');
    star.addEventListener('click', () => {
      if (openStar === star) closeMemory();
      else openMemory(memory, star);
    });
    field.append(star);
  }

  body.append(field);

  /* The card belongs to the section, not the star field, so it can fill the
     screen. Inside the field it was confined to the poem band and a photograph
     had a third of a screen to live in. The CSS adds back the padding that
     keeps it clear of the moon meter. */
  section.append(card);

  function onKey(e) {
    if (e.key === 'Escape' && openStar) closeMemory();
  }
  window.addEventListener('keydown', onKey);

  /* --- Opening the section ----------------------------------------------- */

  if (preSolved) {
    return {
      destroy() { window.removeEventListener('keydown', onKey); },
    };
  }

  /* Solved on arrival rather than on a gate. Waiting for her to actually be
     looking at it means the moon lights up and the onward cue appears while
     she's here to see it, instead of firing off screen as she approaches. */
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
      /* The keydown listener stays: Escape has to keep closing memory cards
         after the section is marked solved, which happens the moment she
         arrives. */
    },
  };
}
