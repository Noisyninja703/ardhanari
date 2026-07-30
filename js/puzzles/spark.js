/* ==========================================================================
   puzzles/spark.js: Amavasya

   The section looks empty. Moving the pointer reveals a faint glow that
   follows it; hold still near the spark and it ignites, blooming into the
   title. The interaction is the theme: nothing arrives until she stops
   moving and pays attention.

   Touch has no idle cursor, so there it's press-and-hold instead.
   Keyboard gets a real focusable button, because a puzzle nobody can
   reach with a keyboard is just a wall.
   ========================================================================== */

const HOLD_MS = 1600;
const NEAR_PX = 160;   /* how close the pointer must be to count as "near" */
const JITTER_PX = 14;  /* movement under this still counts as holding still */

export default function create({ section, body, solved = false, solve }) {
  /* The section's content starts hidden via CSS (see sections.css) and is
     revealed by .is-solved, so there's nothing to hide here. */

  /* The spark is a button so it's focusable and announced. It goes in the poem
     band, which is where the light belongs, the section's own rows are fixed
     proportions of the screen and must not gain extra children. */
  const spark = document.createElement('button');
  spark.type = 'button';
  spark.className = 'spark';
  spark.setAttribute('aria-label', 'Light the first star');
  body.prepend(spark);

  /* Already lit on a previous visit, or reduced motion is on: show the star
     burning and wire up nothing. */
  if (solved) {
    spark.classList.add('is-ignited', 'glow-soft');
    spark.disabled = true;
    spark.setAttribute('aria-label', 'Lit');
    return { destroy() {} };
  }

  const isTouch = window.matchMedia('(hover: none)').matches;

  let holdTimer = null;
  let last = { x: 0, y: 0 };
  let ignited = false;

  function centreOf(node) {
    const r = node.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function beginHold() {
    if (holdTimer || ignited) return;
    holdTimer = setTimeout(ignite, HOLD_MS);
  }

  function cancelHold() {
    clearTimeout(holdTimer);
    holdTimer = null;
  }

  function ignite() {
    if (ignited) return;
    ignited = true;
    cancelHold();
    spark.classList.remove('is-near');
    spark.classList.add('is-ignited', 'glow-soft');
    spark.disabled = true;
    spark.setAttribute('aria-label', 'Lit');
    solve();
  }

  /* --- Pointer (mouse / trackpad) --------------------------------------- */

  function onPointerMove(e) {
    if (ignited || e.pointerType === 'touch') return;

    const c = centreOf(spark);
    const distance = Math.hypot(e.clientX - c.x, e.clientY - c.y);
    const moved = Math.hypot(e.clientX - last.x, e.clientY - last.y);
    last = { x: e.clientX, y: e.clientY };

    const near = distance < NEAR_PX;
    spark.classList.toggle('is-near', near);

    /* Any real movement restarts the clock. Small jitter is forgiven, nobody can hold a trackpad perfectly still. */
    if (moved > JITTER_PX) cancelHold();
    if (near) beginHold();
    else cancelHold();
  }

  /* --- Touch: press and hold -------------------------------------------- */

  function onPointerDown(e) {
    if (ignited || e.pointerType !== 'touch') return;
    spark.classList.add('is-near');
    beginHold();
  }

  function onPointerUp() {
    if (ignited) return;
    spark.classList.remove('is-near');
    cancelHold();
  }

  /* --- Keyboard --------------------------------------------------------- */

  function onFocus() {
    if (ignited) return;
    spark.classList.add('is-near');
    beginHold();          /* holding focus is holding still */
  }
  function onBlur() {
    if (ignited) return;
    spark.classList.remove('is-near');
    cancelHold();
  }

  /* A direct click or Enter/Space lights it immediately. If she's found the
     one thing on a black screen, she's solved it, don't make her wait. */
  spark.addEventListener('click', ignite);
  spark.addEventListener('focus', onFocus);
  spark.addEventListener('blur', onBlur);

  section.addEventListener('pointermove', onPointerMove, { passive: true });
  section.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { passive: true });
  window.addEventListener('pointercancel', onPointerUp, { passive: true });

  /* On touch, tell her what to do, there's no cursor to discover with. */
  if (isTouch) {
    spark.classList.add('is-near');
  }

  return {
    destroy() {
      cancelHold();
      section.removeEventListener('pointermove', onPointerMove);
      section.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    },
  };
}
