# ardhanari — start here

A gift, not a website. Sivan is building a scrollable celestial love letter for
his girlfriend **Maniksha** ("Meri jaan"), for **1 August**. Hosted on GitHub
Pages at `noisyninja703.github.io/ardhanari` once the repo goes public.

**Read this file, then [docs/GOTCHAS.md](docs/GOTCHAS.md) before touching CSS.**
Most of the bugs in this project's history were not logic errors; they were
layout and gesture traps, and they are all written down there.

---

## Read in this order

| File | What it's for |
| --- | --- |
| **This file** | Orientation, ground rules, current state |
| [docs/GOTCHAS.md](docs/GOTCHAS.md) | Traps already paid for. Read before editing CSS or touch handling. |
| [docs/STORYLINE.md](docs/STORYLINE.md) | The seven sections, the theme, what each verse is doing |
| [docs/DESIGN.md](docs/DESIGN.md) | Tokens, type, the layout system, paint order |
| [docs/PLAN.md](docs/PLAN.md) | What's left to build, in order, with the deadline |
| [README.md](README.md) | How to run and deploy it (written for Sivan, not for you) |
| [tests/README.md](tests/README.md) | The 91 browser checks and how to run them |

---

## Current state

**All seven sections are built.** The poem is walkable end to end. What's left
is content and the letters' write-back half, not structure.

The first five are reviewed and Sivan is happy with them. Nakshatra runs on
`[PLACEHOLDER]` photos and captions, and Purnima on placeholder letters, so both
need content rather than code.

**Settled: the letters are pre-written only.** No database, no sync, no
composer, and she does not write back through the site. Don't reintroduce it.

**Every section needs a `lensSecret`** in `content.js`. Trinetra's lens can
reveal hidden lines in any section, so a section without one is a section that
quietly has nothing to find.

| Phase | Section | Interaction | Status |
| --- | --- | --- | --- |
| ● Amavasya | Before Light | Hold still near the spark | Done |
| ◖ Bhasma | The Ash Years | Wipe ash off the buried verse | Done |
| ◐ Ardhanarishvara | One Body, Divided | Drag the two torn halves together | Done |
| ◑ Tapasya | She Did the Waiting | Tend a flame to keep the verse writing itself | Done, awaiting review |
| ◒ Trinetra | The Third Eye | Drag glass over hidden text | Done, awaiting review |
| ◓ Nakshatra | The Sky We Made | Tap photo-stars in a constellation | Built, needs photos |
| ○ Purnima | Everything I Wrote Down | Drift and open folded letters | Built, needs letters |

Nothing is pushed. The repo is private on purpose — Pages needs it public, and
it goes public on the 1st.

---

## Ground rules

These are settled decisions. Don't relitigate them without asking Sivan.

- **No build step, no npm, no framework.** Vanilla HTML/CSS/JS with ES modules.
  He is learning web dev; the code he reads is the code the browser runs.
- **One portrait column at every width.** No orientation branches, no
  responsive breakpoints. The only `@media` rules are
  `prefers-reduced-motion` and `hover: none` — both accessibility, not layout.
  Reach for `clamp()`, never a breakpoint. Width is one token: `--column`.
- **Every section is exactly one screen**, divided into five proportional
  bands (10/15/50/10/15). See [docs/DESIGN.md](docs/DESIGN.md).
- **All copy lives in `js/content.js`.** Never hard-code a word anywhere else.
- **No em dashes in anything the site displays** — verses, headings, hints,
  labels, meta descriptions, aria-labels. They read as AI-written. Code
  comments are exempt. (This rule is written with one deliberately, in a file
  she will never see, purely so the contrast is obvious.)
- **Don't run the test suites unprompted.** They cost minutes of real Chrome
  time and Sivan tests on real devices anyway. Make the change, say what to
  look for, and offer.
- **Puzzles are interchangeable modules** with one contract. `main.js` knows
  nothing about how any of them work.
- **She can never get stuck.** Hint at 3s, an explicit way past at 15s,
  reduced motion reveals everything without puzzles.
- **Nothing autoplays audio.**

## The puzzle contract

```js
// js/puzzles/<name>.js
export default function create({ section, body, data, solved, solve }) {
  // `body` is the 50% poem band — build into THIS, never into `section`,
  // which is a fixed five-row grid.
  // `solved: true` means show the finished state and wire up no input.
  // Call solve() to open the gate.
  return { destroy() {} };
}
```

Register it in the `puzzleModules` map in `js/main.js` and add its section to
`SECTIONS` in `js/content.js`. If a puzzle throws, `main.js` catches it and
unlocks the section instead — a bug must never cost her a verse.

---

## How to work on this

```sh
python serve.py          # localhost:8000, plus a LAN URL
```

Then in `tests/`: `npm i puppeteer-core@23` once, and run the suites.

**Verify by looking, not just by asserting.** This is the single most
important lesson from the project so far: three separate layout bugs passed
every test while being visually broken — the ash sat *under* the verse so
there was nothing to wipe, the section rendered in the wrong order, and
sealing silently did nothing. Take screenshots. Open them. Judge them.

**Reset progress** when the site looks "already finished" — solved state,
backdrop dimming and lit moons all persist:

```js
localStorage.removeItem('ardh:unlocked'); location.reload();
```

## What Sivan still owes the project

The layout is built with `[PLACEHOLDER]` copy in `js/content.js`. The writing
is currently mine and it's about Shiva, not about Maniksha. The full list is
at the bottom of [docs/PLAN.md](docs/PLAN.md) — photos, dates, inside jokes,
and anything he's already written to her. **Ask for these.** They matter more
than any remaining feature.

## Working with Sivan

He tests on real devices and gives precise, correct feedback — take it at face
value and go looking for the cause rather than defending the code. Twice he
reported something "not working" that was in fact working but invisible, and
twice the underlying cause was real. He prefers being told plainly when
something can't work (a static page can't be scraped by a cron job; a
GPO-locked laptop can't accept LAN connections) over being given a workaround
that quietly doesn't.
