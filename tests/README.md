# tests

Browser-driven checks. They drive a real Chrome, actually solve the puzzles,
and assert on measured geometry and canvas pixels — not on the DOM alone.
**This matters:** several bugs in this project shipped green because a test
asserted a class was applied while the thing it controlled was visually dead.
Where a check can measure pixels or rectangles instead of classes, it does.

## Running them

The site must be served first (from the repo root):

```sh
python serve.py          # port 8000, which is what the tests default to
```

Then, in `tests/`:

```sh
npm i puppeteer-core@23  # once; node_modules and package.json are gitignored
node play.mjs
```

The project itself has **no dependencies** and no build step. Puppeteer is a
dev-only tool that deliberately lives outside that promise, which is why
`tests/node_modules`, `package.json` and `package-lock.json` are gitignored.

Overrides:

- `SITE_URL` — full URL if you're serving on another port
- `CHROME_PATH` — Chrome binary if it isn't at the default Windows location

## The suites

| File | Checks | What it covers |
| --- | --- | --- |
| `play.mjs` | 24 | Full playthrough: solves all three puzzles at 1440×900 and 390×844, checks unlock state, persistence across reload, seam flare, no overflow. Also writes screenshots. |
| `design.mjs` | 46 | Layout and progression: band proportions, sealing, no-jump-on-solve, hint timing, footer clearance, meter layout, moon glow. |
| `atmosphere.mjs` | 10 | Exposure ramps 0 → ⅓ → ⅔ → 1, stacking order, particles visible at both zero and full exposure. |
| `crossfade.mjs` | 4 | Samples canvas lit-pixel count every 50ms across a section change; fails if the field ever blinks out. |
| `ashgestures.mjs` | 7 | The ash panel owns gestures while unsolved (diagonal wipe works, no scrolling) and releases them once solved. |
| `land.mjs` | — | Prints landscape geometry at 844×390. Landscape isn't a supported layout; this only proves it degrades rather than breaks. |

91 assertions total. All passing as of the last commit.

## Writing more

Two habits worth keeping:

1. **Measure the outcome, not the mechanism.** `classList.contains('is-solved')`
   passed happily while the ash sat *under* the verse and there was nothing to
   wipe. Prefer rectangles, computed styles, canvas pixels, scroll positions.
2. **Screenshot and actually look.** Three separate layout bugs were invisible
   to assertions and obvious in a PNG.

Known quirk: with `isMobile`/`hasTouch` emulation, puppeteer's synthetic touch
coordinates don't always land where the CSS rect says they should. If a drag
test fails, check `document.elementFromPoint` and what the event target
actually was before assuming the product is broken — but treat a gap that a
real finger could miss as a real bug, because one of them was.
