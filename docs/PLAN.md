# Plan

**Deadline: 1 August.** Three of seven sections are built, reviewed, and liked.
The site is already a coherent gift as it stands — that matters, because it
means everything below is upside rather than rescue.

Order is deliberate: the two sections that need nothing from Sivan come first,
so progress never blocks on waiting for content.

---

## Phase 3 — the remaining poem

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

### 2. ◒ Trinetra — the lens

A draggable glass circle that reveals text invisible to the naked eye.

- `lensSecret` **already exists** on every section in `content.js` and is
  currently unused. This section makes those pay off: hidden lines are seeded in
  every earlier section, so scrolling back up with the lens rewards curiosity.
- Implementation: a circle with `backdrop-filter: invert(1) blur(2px)`, with a
  feature-query fallback (Safari is where this will bite).
- The hidden text must exist in the DOM at very low opacity, not be injected on
  hover — it has to be there for the lens to find.
- Touch: the lens follows the finger; give it a larger radius on coarse
  pointers.

### 3. ◓ Nakshatra — the constellation *(needs photos)*

The breather. **No puzzle** — pure reward.

- Slow-rotating star field; certain stars are photos. Tap one, a glass memory
  card blooms with a line.
- Pannable and pinch-zoomable, since it's larger than the viewport.
- Blocked on: 4–6 photos with a line each, and the constellation shape (her
  initial, or a meaningful date).

### 4. ○ Purnima — the letters *(needs Firebase setup from Sivan)*

Ship this in **two stages** so it's never half-broken:

**Stage A — read only, no backend.** Letters Sivan wrote in advance, committed
by hand to `data/letters.json`, rendered as folded-paper glyphs floating in dark
space: draggable with soft inertia, tappable to open into a glass card. This
alone is a complete, giftable section.

**Stage B — she can write back.**

- Firestore for the instant write. Rules do the security work, not secrecy —
  the web config is public by design:

  ```text
  allow read: if true;
  allow create: if request.resource.data.keys().hasOnly(['author','body','createdAt'])
                && request.resource.data.body.size() < 4000
                && request.resource.data.author in ['sivan','her'];
  allow update, delete: if false;
  ```

  Nothing can be edited or deleted from the browser, length is capped, shape is
  fixed. Worst case a stranger adds a letter.
- `.github/workflows/archive-letters.yml`, hourly cron plus
  `workflow_dispatch`: read the collection with a service account from GitHub
  Secrets, write `data/letters.json`, commit only if changed.
- The site reads Firestore first and **falls back to `data/letters.json`**, so
  the letters survive Firebase disappearing entirely.
- Sivan's ~15 minutes of console work: create the project, enable Firestore,
  paste the rules, generate a service-account key, add it as `FIREBASE_SA`.

Note the correction already made to the original idea: a static page has
nowhere to hold a submitted message, so **no cron job can scrape letters off
the page.** Firestore is what makes the archive possible.

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
8. Letters end-to-end if Stage B ships: submit → visible in Firestore → run the
   Action manually → confirm `data/letters.json` committed → hard reload →
   break the Firebase config and confirm the JSON fallback still renders.

---

## Open questions for Sivan

- Constellation shape: her initial, or a date?
- Does he want the archive Action, or is Firestore alone enough?
- Sound: yes or no? It's the easiest thing to cut.
- Anything he'd rather write himself than have written for him.

---

## What the project still needs from Sivan

The layout is built with `[PLACEHOLDER]` copy. **Ask for these; they matter
more than any remaining feature.** The verses currently in `content.js` are
about Shiva, not about Maniksha.

1. How they met — one or two concrete images from it, not a summary.
2. 3–5 dates that matter.
3. 4–6 photos, each with a line about what was happening.
4. Two or three inside jokes.
5. Any Hindu or family references she'd love to see done properly.
6. **Anything he's already written to her.** His words beat mine every time.
7. Whether her name or a date should shape the constellation.
