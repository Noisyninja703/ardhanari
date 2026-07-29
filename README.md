# ardhanari

For Maniksha, from Sivan. 1 August.

A scrollable celestial love letter. Seven phases of the moon, from the void to
the full, built on **Ardhanarishvara** — Shiva and Parvati as one body split
down the middle. Each section gates its verse behind a small interaction.

Live at <https://noisyninja703.github.io/ardhanari/> once the repo is public.

**Docs:** [CLAUDE.md](CLAUDE.md) is the start-here overview (written for the
next AI agent, but it's the fastest way to see where things stand).
[docs/STORYLINE.md](docs/STORYLINE.md) is the seven sections and the theme,
[docs/DESIGN.md](docs/DESIGN.md) the tokens and layout system,
[docs/PLAN.md](docs/PLAN.md) what's left to build, and
[docs/GOTCHAS.md](docs/GOTCHAS.md) the traps already paid for.

Built so far:

| Phase | Section | Interaction |
| --- | --- | --- |
| ● Amavasya | Before Light | Hold still near the spark to light it |
| ◖ Bhasma | The Ash Years | Wipe the ash off the buried verse |
| ◐ Ardhanarishvara | One Body, Divided | Drag the two torn halves back together |

---

## Run it locally

The site uses ES modules, which browsers refuse to load over `file://`. You
need a real HTTP origin, so opening `index.html` by double-clicking will *not*
work. Serve it instead:

```sh
python serve.py          # port 8000
python serve.py 3000     # or any other port
```

It prints two URLs:

```text
  This machine   http://localhost:8000
  Your phone     http://192.168.1.158:8000
```

`serve.py` sends no-cache headers on everything, so a hard-reload is never
needed — which matters more than it sounds, because phone browsers cache
aggressively and you'll otherwise waste time convinced a change didn't apply.

---

## Testing on your phone

**This matters.** The puzzles take different code paths on touch: the void
section uses press-and-hold instead of hover-proximity, and the ash wipe uses
a bigger brush. Desktop device-emulation does not exercise either properly.

### The LAN URL doesn't work on this machine

Not a bug in `serve.py`, and not the router. This laptop is work-managed, and
Group Policy sets:

```text
Firewall Policy      BlockInbound,AllowOutbound
LocalFirewallRules   N/A (GPO-store only)
```

All inbound connections are blocked, and local firewall rules are disabled —
so a rule allowing Python through would be *ignored even if created with
admin rights*. Notifications are suppressed too, which is why no "Allow
Python?" prompt ever appears. There is no local fix. `serve.py` detects this
and says so on startup.

### Use Chrome USB port forwarding instead (Android)

This tunnels the phone's `localhost` to this machine over the USB cable. No
inbound connection, no firewall rule, no admin, and nothing exposed to the
network — strictly better than the LAN approach even on an unlocked machine.

1. On the phone: Settings → About phone → tap *Build number* seven times to
   enable Developer options. Then Developer options → **USB debugging** on.
2. Plug the phone into the laptop. Accept the "Allow USB debugging?" prompt on
   the phone, ticking *always allow*.
3. Start the server: `python serve.py`
4. On the laptop, open Chrome → `chrome://inspect/#devices`
5. Tick **Discover USB devices**. The phone should appear by name.
6. Click **Port forwarding…**, tick *Enable port forwarding*, and add:
   - Port: `8000`
   - IP address and port: `localhost:8000`
7. On the phone, open Chrome and go to **`http://localhost:8000`**

That `localhost` is the phone's own localhost, forwarded down the cable. It
only works while Chrome is open on the laptop and the cable is connected.

Bonus: the phone's page appears under `chrome://inspect` with an **inspect**
link, giving you real DevTools — console, elements, the works — against the
actual phone. Better than anything the LAN approach offers.

### On an iPhone

There's no equivalent — Safari's Web Inspector debugs a page but can't forward
ports. Options, roughly best first:

- Serve from a personal (non-work) machine on your home wifi. `serve.py` works
  the same there, and a home laptop won't have the GPO lockdown.
- Ask IT for a firewall exception. Slow, and unlikely for a personal project.
- Wait for Pages. Once the repo goes public on 1 August the real URL works on
  any device, so treat phone testing as the last check before you send it.

---

## Handy while developing

Solved puzzles are remembered, which also means the backdrop dimming
(`--exposure`) and the lit moons start where you left them. If the site looks
darker than you expect, or the "keep going" cue is already showing, you're
seeing a finished run — reset and reload.

**Reset your progress** (solved puzzles are remembered) — in the browser console:

```js
localStorage.removeItem('ardh:unlocked'); location.reload();
```

---

## Deploy to GitHub Pages

Pages serves static files straight from the repo. There's no build step and no
Action needed for the site itself — what's in the repo is what gets served.

**The repo has to be public** for Pages to work on a free account, and once
it's public the site is on the open internet. That's why it stays private
until it's finished — test locally with `serve.py` until then. `noindex` is
set in `index.html` so search engines won't list it, but that's politeness,
not privacy: anyone with the URL can open it. Don't put anything in here you
wouldn't want a stranger reading.

1. Push to `main`.
2. Repo → **Settings** → **Pages**.
3. Under *Build and deployment*, set **Source: Deploy from a branch**.
4. Choose branch `main`, folder `/ (root)`. Save.
5. Wait ~1 minute. The URL appears at the top of that same page:
   `https://noisyninja703.github.io/ardhanari/`.

Every push to `main` republishes automatically. If a change doesn't show up,
it's almost always browser cache — hard-reload with `Ctrl+Shift+R`.

### Test on the live URL, not just locally

Paths behave differently once the site is served from a subfolder
(`/ardhanari/`). All paths here are **relative** (`css/tokens.css`, not
`/css/tokens.css`) precisely so this works — if you ever add a leading slash,
it will work locally and break on Pages.

---

## How it's put together

No framework, no npm, no build. The code you read is the code the browser runs.

```text
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

## Layout: one portrait column, everywhere

There are **no orientation branches and no responsive breakpoints** in this
project, on purpose. The site is a single centred column that scales with
width via `--column` in `css/tokens.css`:

```css
--column: min(92vw, 34rem);
```

On a phone that's the full width; on a wide monitor it stays a tall centred
column rather than spreading out. That's what preserves the pacing of the
vertical scroll — a poem that goes wide stops feeling like a poem.

Practical consequence: **to change how wide the site feels, change that one
value.** Everything else follows. If you find yourself reaching for a
`@media` query, reach for a `clamp()` instead.

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
