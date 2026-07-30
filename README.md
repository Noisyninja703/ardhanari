# ardhanari

For Maniksha. 1 August.

A scrollable celestial love letter. Seven phases of the moon, from the dark of it
to the full, built on **Ardhanarishvara**: Shiva and Parvati as one body split
down the middle. Most sections hold their verse behind a small interaction, so she
has to do something to be given it.

Live at <https://noisyninja703.github.io/ardhanari/> once I make the repo public.

## The docs

| File | What it is |
| --- | --- |
| [docs/STORYLINE.md](docs/STORYLINE.md) | The whole story. The myths I used, what each section means, where I bent the tradition. Read this one. |
| [docs/DESIGN.md](docs/DESIGN.md) | Tokens, type, the layout system, paint order |
| [docs/GOTCHAS.md](docs/GOTCHAS.md) | Traps already paid for. Read before touching CSS or touch handling. |
| [docs/PLAN.md](docs/PLAN.md) | What is left, which is mostly writing |
| [CLAUDE.md](CLAUDE.md) | Orientation for an AI agent picking this up, and the fastest summary of where things stand |
| [tests/README.md](tests/README.md) | The browser checks and how to run them |

## The seven sections

All seven are built. The poem walks end to end.

| Phase | Section | What she does |
| --- | --- | --- |
| ● Amavasya | Before Light | Holds still near a spark until it catches |
| ◖ Bhasma | The Ash Years | Wipes ash off a buried verse |
| ◐ Ardhanarishvara | One Body, Divided | Drags two torn halves back into one line |
| ◑ Tapasya | She Did the Waiting | Tends a flame, and the verse writes itself while she stays |
| ◒ Trinetra | The Third Eye | Drags a piece of glass over text she cannot otherwise see |
| ◓ Nakshatra | The Stars I Follow to You | Opens six stars, one promise each |
| ○ Purnima | Everything I Wrote Down | Opens six folded letters |

Two things run across all of it. **Every section hides a line** that can only be
read through the glass from Trinetra, and once she has the glass she keeps it, so
she can go back up and sweep everything she has already read. And **the seam down
the middle of the page does not exist** until she rejoins the halves in section
three, at which point it is born and stays to the end.

---

## Run it locally

The site uses ES modules, which browsers refuse to load over `file://`. It needs
a real HTTP origin, so double-clicking `index.html` will *not* work. Serve it:

```sh
python serve.py          # port 8000
python serve.py 3000     # or any other port
```

It prints two URLs:

```text
  This machine   http://localhost:8000
  Your phone     http://192.168.1.158:8000
```

`serve.py` sends no-cache headers on everything, so a hard reload is never
needed. That matters more than it sounds: phone browsers cache hard, and I would
otherwise waste an afternoon convinced a change had not applied.

### Reset my progress

Solved puzzles are remembered, and so is everything derived from them: the
backdrop dimming, the lit moons, the "keep going" cue, whether she has the glass.
If the site looks darker than expected or already finished, that is a completed
run and not a bug. In the browser console:

```js
localStorage.removeItem('ardh:unlocked'); location.reload();
```

There is also a **"Walk it again"** button on the last section once it is
finished, which does the same thing and takes her back to the dark.

---

## Testing on my phone

**This matters.** The puzzles take different code paths on touch. The spark is
press and hold instead of hover proximity, the flame the same, the ash wipe uses
a bigger brush, and every drag surface claims the gesture in a way a mouse never
exercises. Desktop device emulation does not test any of it properly.

### The LAN URL will not work on this laptop

Not a bug in `serve.py`, and not the router. This machine is work managed, and
Group Policy sets:

```text
Firewall Policy      BlockInbound,AllowOutbound
LocalFirewallRules   N/A (GPO-store only)
```

All inbound connections are blocked and local firewall rules are disabled, so a
rule allowing Python through would be ignored *even if I had admin rights*.
Notifications are suppressed too, which is why no "Allow Python?" prompt ever
appears. There is no local fix. `serve.py` detects this and says so on startup.

### Chrome USB port forwarding instead (Android)

This tunnels the phone's `localhost` down the cable. No inbound connection, no
firewall rule, no admin, nothing exposed to the network. Better than the LAN
approach even on an unlocked machine.

1. On the phone: Settings, About phone, tap *Build number* seven times to enable
   Developer options. Then Developer options, **USB debugging** on.
2. Plug the phone in. Accept the "Allow USB debugging?" prompt, ticking *always
   allow*.
3. Start the server: `python serve.py`
4. On the laptop open Chrome, then `chrome://inspect/#devices`
5. Tick **Discover USB devices**. The phone appears by name.
6. Click **Port forwarding**, tick *Enable port forwarding*, and add:
   - Port: `8000`
   - IP address and port: `localhost:8000`
7. On the phone, open Chrome and go to **`http://localhost:8000`**

That `localhost` is the phone's own, forwarded over USB. It only works while
Chrome is open on the laptop and the cable is connected.

Bonus: the phone's page shows up under `chrome://inspect` with an **inspect**
link, which gives real DevTools against the actual phone. Console, elements, the
lot.

### On an iPhone

No equivalent. Safari's Web Inspector can debug a page but cannot forward ports.
Options, best first:

- Serve from a personal machine on home wifi. `serve.py` works the same there and
  a home laptop has none of the GPO lockdown.
- Ask IT for a firewall exception. Slow, and unlikely for a personal project.
- Wait for Pages. Once the repo is public the real URL works on any device, so
  phone testing becomes the last check before I send it.

---

## Deploy to GitHub Pages

Pages serves static files straight from the repo. No build step, and no Action
needed for the site itself. What is in the repo is what gets served.

**The repo has to be public** for Pages on a free account, and the moment it is
public the site is on the open internet. That is why it stays private until it is
finished. `noindex` is set in `index.html` so search engines will not list it, but
that is politeness rather than privacy: anyone with the URL can open it. Nothing
goes in here I would not want a stranger reading.

1. Push to `main`.
2. Repo, **Settings**, **Pages**.
3. Under *Build and deployment*, set **Source: Deploy from a branch**.
4. Choose branch `main`, folder `/ (root)`. Save.
5. Wait about a minute. The URL appears at the top of that same page:
   `https://noisyninja703.github.io/ardhanari/`.

Every push to `main` republishes. If a change does not show up it is almost
always browser cache, so hard reload with `Ctrl+Shift+R`.

### Test the live URL, not just localhost

Paths behave differently once the site is served from a subfolder
(`/ardhanari/`). Every path in here is **relative** (`css/tokens.css`, never
`/css/tokens.css`) precisely so this works. A leading slash will work locally and
break on Pages.

---

## How it is put together

No framework, no npm, no build. The code I read is the code the browser runs.

```text
index.html          the shell: atmosphere layers and an empty <main>
serve.py            local dev server, no-cache, prints a phone URL
css/
  tokens.css        every colour, font, size, duration, z-index. Start here.
  base.css          reset, type roles, accessibility, reduced motion
  effects.css       grain, the seam, glass, mist, exposure, the sweep reveal
  sections.css      per-section layout and the fixed chrome
js/
  content.js        EVERY WORD on the site. Edit this to change the writing.
  main.js           builds the page from content.js, owns unlock state
  scroll.js         one RAF loop driving all parallax
  particles.js      one shared canvas, per-section fields, cross-faded
  puzzles/          one module per section
data/
  letters.json      the six letters in the last section
docs/               storyline, design, plan, gotchas
tests/              browser checks, dev only
```

### To change the writing

Edit `js/content.js`, and nothing else. Verses, headings, hints, hidden lines and
the six promises are all data, and the layout reads them. The only copy that
lives elsewhere is the letters, in `data/letters.json`.

### To add a photo to the ash section

Drop a file at `assets/img/ash.webp`. It appears under the ash automatically. If
it is not there the verse just sits on the void, which also looks fine, so a
missing photo never breaks anything. It is the only image the site wants.

### To change the letters

Edit `data/letters.json`. Each letter has a title, an author, a date and a body.
In the body a single `\n` is a line break and `\n\n` starts a new stanza, because
they are poems rather than paragraphs. See [data/README.md](data/README.md).

### To add a section

Append an entry to `SECTIONS` in `js/content.js`, then register its module in the
`puzzleModules` map in `js/main.js`. Every module has the same shape:

```js
export default function create({ section, body, data, solved, solve }) {
  // Build into `body`, the 50% band. Never into `section`, which is a fixed
  // five-row grid. Call solve() to open the gate.
  return { destroy() {} };
}
```

`main.js` knows nothing about how any of them work. If one throws it is caught
and the section unlocks anyway, because a bug in an interaction must never cost
her a verse. Give the new section a hidden line too, or it is a section with
nothing to find.

---

## Layout: one portrait column, everywhere

There are **no orientation branches and no responsive breakpoints** in this
project, on purpose. It is a single centred column that scales with width, set by
one token in `css/tokens.css`:

```css
--column: min(100%, 34rem);
```

Full width on a phone, and a tall centred column on a monitor rather than
spreading out. That is what preserves the pacing: a poem that goes wide stops
reading as a poem.

**To change how wide the site feels, change that one value.** Everything follows
from it. If I ever reach for a `@media` query, reach for a `clamp()` instead.

Each section is exactly one screen, divided into five bands as percentages of the
device's own height:

```text
10%   the phase label
15%   the heading
50%   the poem or the puzzle
10%   hint, skip, or "keep going"
15%   the Devanagari footer
```

Plus a strip at the bottom reserved by `--chrome-h` for the travel arrows and the
moons.

---

## Getting around

**Scrolling is locked.** She moves one section at a time using the arrows at the
bottom right, the wheel, or the keyboard. Free scrolling on a phone was miserable
here: every section owns a large drag surface that has to claim the gesture, and
snapping fought whatever was left, so the page only moved if you found the right
patch of empty background.

The document is still the scroller and is still moved with `scrollIntoView`, so
nothing is transformed or faked. It simply is not user scrollable, and the class
that does it is added by JavaScript so the page stays an ordinary scrolling
document if the script never runs.

**Zoom is locked.** Pinching broke the site: a zoomed visual viewport is a small
window onto a layout that has not changed size, and with scrolling locked there
was no way to reach the rest of it, which a reload did not fix because the browser
remembers the scale. I tried letting her pan while zoomed instead and it was worse
on a real phone, so the site simply does not zoom now. The viewport meta handles
Android, and `lockZoom()` in `js/main.js` refuses the pinch by hand because iOS
ignores the meta. Double-tap-to-zoom is off everywhere too, since that is never
what she meant by tapping a letter twice.

**Sections she has not reached are not in the document at all**, so the page ends
at whatever she has finished. That is what stops her scrolling past an unsolved
puzzle, with no scroll maths anywhere.

---

## Things that are deliberate

- **She can never get stuck.** A hint appears 3 seconds after a section fills the
  screen, and an explicit way past at 15 seconds. Reduced motion reveals
  everything without any puzzle at all.
- **`prefers-reduced-motion`** turns off parallax, drift and animation, and gives
  a static starfield rather than no starfield. Respecting the preference should
  not mean deleting the atmosphere.
- **Nothing autoplays audio.** There is no sound at all yet, and if it arrives it
  is off by default.
- **Progress persists** in `localStorage`, so a refresh never means redoing a
  puzzle.
- **No em dashes anywhere the site displays**, including aria-labels. They read as
  machine written, which is fatal for a love letter.
- **`dvh`, never `vh`.** Mobile browser chrome collapses on scroll and `100vh`
  makes sections jump.
- **`touch-action: none` on a drag surface while it is unsolved**, and released
  the moment it is solved, so it can never block scrolling afterwards.
- **`overscroll-behavior: none` on the root element**, which stops
  pull-to-refresh and stops a sideways wipe triggering the browser's swipe to go
  back. It has to be the root: on `body` it does nothing.
- **`noindex`.** This is a present, not a portfolio piece.
