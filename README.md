# StarBoard — Ardhanarishvara

A scrollable celestial love letter. Seven phases of the moon, from the void to
the full, themed on Shiva and Parvati. Each section gates its verse behind a
small interaction.

Currently built: **phase 1** — Amavasya (the void) and Bhasma (the ash years).

---

## Run it locally

The site uses ES modules, which browsers refuse to load over `file://`. You
need a real HTTP origin, so opening `index.html` by double-clicking will *not*
work. Serve it instead:

```sh
python -m http.server 8000
```

Then open <http://localhost:8000>. Any static server does the same job.

**Reset your progress** (solved puzzles are remembered) — in the browser console:

```js
localStorage.removeItem('ardh:unlocked'); location.reload();
```

---

## Deploy to GitHub Pages

Pages serves static files straight from the repo. There's no build step and no
Action needed for the site itself — what's in the repo is what gets served.

1. Push to `main`.
2. Repo → **Settings** → **Pages**.
3. Under *Build and deployment*, set **Source: Deploy from a branch**.
4. Choose branch `main`, folder `/ (root)`. Save.
5. Wait ~1 minute. The URL appears at the top of that same page, as
   `https://<username>.github.io/StarBoard/`.

Every push to `main` republishes automatically. If a change doesn't show up,
it's almost always browser cache — hard-reload with `Ctrl+Shift+R`.

### Test on the live URL, not just locally

Paths behave differently once the site is served from a subfolder
(`/StarBoard/`). All paths here are **relative** (`css/tokens.css`, not
`/css/tokens.css`) precisely so this works — if you ever add a leading slash,
it will work locally and break on Pages.

---

## How it's put together

No framework, no npm, no build. The code you read is the code the browser runs.

```
index.html          the shell: atmosphere layers + an empty <main>
css/
  tokens.css        every colour, font, size and duration. Start here.
  base.css          reset, type roles, accessibility, reduced-motion
  effects.css       grain, the seam, glass, mist, glow, reveal
  sections.css      per-section layout and the fixed chrome
js/
  content.js        EVERY WORD on the site. Edit this to change the writing.
  main.js           builds the page from content.js, owns unlock state
  scroll.js         one RAF loop driving all parallax
  particles.js      one shared canvas, per-section presets
  puzzles/          one module per interaction
```

### To change the writing

Edit `js/content.js`. Nothing else. Verses are data — layout reads them.

### To add a photo to the ash section

Drop a file at `assets/img/ash.webp`. It appears beneath the ash automatically.
If the file isn't there the verse just sits on the void, which also looks fine,
so a missing photo never breaks anything.

### To add a section

Append an entry to `SECTIONS` in `js/content.js`, then register its puzzle in
the `puzzleModules` map in `js/main.js`. Every puzzle exposes the same
contract:

```js
export default function create({ section, data, solved, solve }) {
  // solve() opens the gate. That's the whole interface.
  return { destroy() {} };
}
```

`main.js` knows nothing about how any puzzle works. If one throws, it's caught
and the section unlocks instead — a bug in an interaction must never cost a
verse.

---

## Things that are deliberate

- **Nothing autoplays audio**, and sound is off by default.
- **`prefers-reduced-motion`** turns off parallax, particles and drift, and
  reveals every verse without a puzzle.
- **Progress persists** in `localStorage`, so a refresh never means redoing a
  puzzle.
- **Hints appear after 8s** of being on screen; an explicit way past the puzzle
  appears at 25s. She never gets stuck.
- **`dvh` not `vh`** — mobile browser chrome collapses on scroll and `100vh`
  causes sections to jump.
- **`touch-action: none`** on drag surfaces, or the browser steals the gesture
  and scrolls the page mid-wipe.
- **`noindex`** — this is a present, not a portfolio piece.
