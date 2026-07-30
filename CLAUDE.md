# ardhanari: start here

A gift, not a website. This is a scrollable celestial love letter I am building
for Maniksha, my girlfriend, for **1 August**. It goes on GitHub Pages at
`noisyninja703.github.io/ardhanari` once I make the repo public.

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
| [README.md](README.md) | How to run and deploy it |
| [tests/README.md](tests/README.md) | The 91 browser checks and how to run them |

---

## Current state

**All seven sections are built.** The poem is walkable end to end. What's left
is words, not structure.

I am happy with the first five. Nakshatra and Purnima are running on placeholder
writing, six promises and five letters, so what they need from me is words rather
than code. The only image the site wants is `assets/img/ash.webp`.

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
| ◓ Nakshatra | The Stars I Follow to You | Tap stars to open promises | Built, needs his promises |
| ○ Purnima | Everything I Wrote Down | Drift and open folded letters | Built, needs letters |

Nothing is pushed. The repo is private on purpose. Pages needs it public, and
it goes public on the 1st.

---

## Ground rules

These are settled. Do not reopen any of them without asking me first.

- **No build step, no npm, no framework.** Vanilla HTML/CSS/JS with ES modules.
  I am learning web dev, so the code I read is the code the browser runs.
- **One portrait column at every width.** No orientation branches, no
  responsive breakpoints. The only `@media` rules are
  `prefers-reduced-motion` and `hover: none`, both accessibility, not layout.
  Reach for `clamp()`, never a breakpoint. Width is one token: `--column`.
- **Every section is exactly one screen**, divided into five proportional
  bands (10/15/50/10/15). See [docs/DESIGN.md](docs/DESIGN.md).
- **All copy lives in `js/content.js`.** Never hard-code a word anywhere else.
- **No em dashes in anything the site displays**, verses, headings, hints,
  labels, meta descriptions, aria-labels. They read as AI-written. Code
  comments are exempt. (This rule is written with one deliberately, in a file
  she will never see, purely so the contrast is obvious.)
- **Do not run the test suites unless I ask.** They cost minutes of real Chrome
    time and I test on real devices anyway. Make the change, tell me what to look
    for, and offer.
- **Puzzles are interchangeable modules** with one contract. `main.js` knows
  nothing about how any of them work.
- **She can never get stuck.** Hint at 3s, an explicit way past at 15s,
  reduced motion reveals everything without puzzles.
- **Nothing autoplays audio.**

## The puzzle contract

```js
// js/puzzles/<name>.js
export default function create({ section, body, data, solved, solve }) {
  // `body` is the 50% poem band, build into THIS, never into `section`,
  // which is a fixed five-row grid.
  // `solved: true` means show the finished state and wire up no input.
  // Call solve() to open the gate.
  return { destroy() {} };
}
```

Register it in the `puzzleModules` map in `js/main.js` and add its section to
`SECTIONS` in `js/content.js`. If a puzzle throws, `main.js` catches it and
unlocks the section instead, a bug must never cost her a verse.

---

## How to work on this

```sh
python serve.py          # localhost:8000, plus a LAN URL
```

Then in `tests/`: `npm i puppeteer-core@23` once, and run the suites.

**Verify by looking, not just by asserting.** This is the single most
important lesson from the project so far: three separate layout bugs passed
every test while being visually broken, the ash sat *under* the verse so
there was nothing to wipe, the section rendered in the wrong order, and
sealing silently did nothing. Take screenshots. Open them. Judge them.

**Reset progress** when the site looks "already finished", solved state,
backdrop dimming and lit moons all persist:

```js
localStorage.removeItem('ardh:unlocked'); location.reload();
```

## What I still owe this

The layout is built with placeholder copy in `js/content.js`, and a lot of the
writing is still about Shiva rather than about her. The full list is at the
bottom of [docs/PLAN.md](docs/PLAN.md): the six promises, the letters, dates,
inside jokes, and anything I have already written to her. These matter more than
any remaining feature, so ask me for them rather than inventing more.

## How I want this worked on

I test on real devices and my feedback is usually right, so take it at face value
and go looking for the cause rather than defending the code. Twice I reported
something as "not working" when it was in fact working but invisible, and both
times there was a real bug underneath.

Tell me plainly when something cannot work. A static page cannot be scraped by a
cron job, and a GPO locked laptop cannot accept LAN connections. I would much
rather hear that than be handed a workaround that quietly does not.
