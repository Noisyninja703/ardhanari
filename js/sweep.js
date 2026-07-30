/* ==========================================================================
   sweep.js: restarting the sweep reveal on an element that gets reused.

   Removing the class and adding it back does not work on its own. Style
   recalculation is lazy, so the browser can coalesce the two changes into one,
   never see `animation-name` change, and leave the element frozen exactly where
   the previous run finished. Fresh nodes are fine, because they have no previous
   run to be stuck in.

   That is the bug this exists to fix: reopening a letter left its title dark,
   and reopening a promise left the whole card dark, because those two elements
   are reused between opens while the letter's stanzas are rebuilt each time.

   Cancel whatever is running, force a style flush, then re-add.
   ========================================================================== */

export function restartSweep(el) {
  if (!el) return;

  el.classList.remove('is-swept');

  /* Cancel outright as well as un-classing. A finished animation can still be
     attached to the element, and `forwards` fill means its final frame is what
     you keep looking at. */
  el.getAnimations?.().forEach((animation) => animation.cancel());

  /* Reading a layout property forces the pending style change to be applied, so
     the class going back on is genuinely a change. Do not remove this line: it
     looks like it does nothing and it is the entire fix. */
  void el.offsetWidth;

  el.classList.add('is-swept');
}
