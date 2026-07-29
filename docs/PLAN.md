# Plan

**Deadline: 1 August.** All seven sections are built and the poem is walkable
end to end. Nothing left is structural.

From here the highest-value work is words and photographs, not code.

---

## Phase 3 — the remaining poem · COMPLETE

### 1. ◑ Tapasya — tend the flame · BUILT, awaiting review

`js/puzzles/flame.js`. Types into the existing verse paragraphs so the copy
stays in `content.js`. Proximity on a pointer, press-and-hold on touch, focus
on a keyboard. Click finishes it outright. `destroy()` fills in whatever is
unwritten, which is what makes the skip link land on a whole verse.

Two things worth knowing if it needs changing:

- Line heights are **measured and reserved** before anything is typed, and
  re-measured on `document.fonts.ready` and on resize. Without that the
  vertically-centred band shoves each line upward as the next arrives and the
  verse jitters onto the screen.
- The caret blinks only while the flame is out. That's what stops a paused
  verse reading as broken, which was the main risk with this mechanic.

Tuning knobs: `NEAR_PX` (190) and `CHARS_PER_S` (26) at the top of the module.

### 2. ◒ Trinetra — the lens · BUILT, awaiting review

`js/puzzles/lens.js`. The hidden lines come from `lensSecret`, which now pays
off in every section rather than sitting unused.

Things to know before changing it:

- **The lens deliberately outlives its puzzle.** `destroy()` is empty, where
  every other puzzle tears itself down. She earned the glass, so she keeps it
  and it has to go on working in sections she scrolls back to.
- The reveal is a mask, not an opacity fade: a circle at the lens position in
  each hidden line's own coordinate space, rewritten each frame. That
  element-relative maths is the reason it isn't pure CSS.
- `RADIUS` in the module and `.lens` width/height in CSS must stay in step
  (width is twice the radius).
- Hidden lines are anchored to the **bottom** of their section, below the
  Devanagari footer and just above the fixed moon meter. That strip is the only
  place a fully packed section reliably has free: placed at 66% down they
  collided with the poem wherever the body band was tall, which the flame
  section is. Keep each `lensSecret` short enough for two lines at phone width,
  around 60 characters.

### 3. ◓ Nakshatra — the constellation · BUILT, needs photos

`js/puzzles/constellation.js`. Lives in the puzzle system because that's how
sections get built and unsealed, but it calls `solve()` on arrival rather than
gating anything.

- **Drop photos at `assets/img/nakshatra/1.webp` … `6.webp`** and write the six
  captions in `content.js`. Missing files are handled, so it works without them.
- Panning and pinch-zoom from the original plan were dropped. They were a
  landscape-era idea; the field now fits the poem band, which avoids fighting
  the page scroll for gestures.
- A section whose `content.js` entry has a `hint` but **no `skipLabel`** gets
  standing guidance instead of a puzzle hint: shown on arrival and never
  cleared. That's how "Touch a star." survives a section that solves itself.

### 4. ○ Purnima — the letters · BUILT

`js/puzzles/letters.js` reads `data/letters.json`, scatters the letters as
folded paper, and lets her push them around and open them. A missing or
unreadable archive shows one quiet line rather than breaking the section.

**Decision: the letters are pre-written and that's all they are.** No Firestore,
no archive Action, no composer, and she does not write back through the site.
Sivan writes them, commits them, and that's the section. Everything that made
this the most complicated part of the project is simply gone.

Two consequences worth keeping:

- Letter bodies are rendered as text nodes, never `innerHTML`. Nothing untrusted
  reaches them now, but data still shouldn't be parsed as markup.
- `author` stays in the schema (`sivan` or `her`) with a gold seal for hers, so
  if Sivan ever wants to include something she wrote to him, it renders
  correctly with no code change.

To add a letter: append an object to `letters` in `data/letters.json`. See
`data/README.md`.

---

## Phase 4 — depth, if time allows

- **Sound.** A low tanpura drone plus a bell on unlock. Off by default,
  toggle top-right; the markup already reserves it. Never autoplay.
- **Easter eggs.** Tap the moon three times for a damaru beat and a hidden
  line; trace a trishula on the star field; a private joke behind a sequence.
- **Polish pass.** Read the whole thing on a phone, cold, as if you were her.
  Cut anything that feels like homework.

If the 1st gets tight, Phase 4 becomes "part two" shown later — which is
arguably a better gift than a rushed everything.

---

## Ship checklist

1. Fill in the real copy (see below). This is the highest-value work left.
2. Add the photos: `assets/img/ash.webp` and the constellation set, as WebP.
3. Run all six suites in `tests/`. Screenshot and *look*.
4. Test on a real phone. LAN won't work on the work laptop — use Chrome USB
   port forwarding (README).
5. Reduced motion: toggle the OS setting, reload, confirm every verse is
   readable and every section reachable.
6. **Make the repo public**, then Settings → Pages → `main` / root.
7. Open `noisyninja703.github.io/ardhanari` on a phone and walk it end to end.
   Test the live URL, not just localhost — paths behave differently from a
   subfolder.
8. Open a letter and a star and confirm both fill the screen and scroll.

---

## Open questions for Sivan

- Constellation shape: her initial, or a date?
- Sound: yes or no? It's the easiest thing to cut.
- Anything he'd rather write himself than have written for him.

---

## What the project still needs from Sivan

The layout is built with `[PLACEHOLDER]` copy. **Ask for these; they matter
more than any remaining feature.** The verses currently in `content.js` are
about Shiva, not about Maniksha.

1. How they met — one or two concrete images from it, not a summary.
2. 3–5 dates that matter.
3. Six photos for the constellation, each with a line about what was happening.
4. Two or three inside jokes.
5. Any Hindu or family references she'd love to see done properly.
6. **The letters themselves.** Five placeholders sit in `data/letters.json`;
   anything he has actually written to her beats all of them.
7. Whether her name or a date should shape the constellation.
