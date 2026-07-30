# Gotchas

Traps already paid for. Every entry here cost real debugging time. Read the
CSS and touch sections before editing either.

---

## The meta-lesson: green tests hid dead visuals

Three separate bugs shipped with a full passing suite:

- The ash sat **under** the verse (`z-index` on `.wipe__verse`), so the puzzle
  "worked" and there was nothing to wipe.
- The section rendered **in the wrong order**. Devanagari above the heading, because the spark took a grid row.
- Sealing did **nothing**, while the test asserting the class was applied
  passed happily.

All three were obvious in a screenshot and invisible to assertions. **Take
screenshots and look at them.** Prefer assertions that measure outcomes
(rectangles, computed styles, canvas pixels, scroll offsets) over ones that
measure mechanisms (a class exists).

---

## Touch and scrolling

**`overscroll-behavior` must go on the ROOT element.** It only propagates to
the viewport from `html`. It was on `body` for several commits, where it does
nothing, so pull-to-refresh was never actually guarded despite a comment
claiming it was.

**`overscroll-behavior` on a non-scrollable element blocks scroll chaining.**
This is the nastiest one. On `.wipe` it did *not* stop pull-to-refresh; it
stopped the scroll from chaining out to the page, so a finger starting
anywhere on that panel couldn't scroll **at all**, at any swipe distance, even
after the puzzle was solved and `touch-action` was back to `auto`. Measured:
0px of movement over the panel versus 844px over the heading, same gesture.
Never put it on anything that isn't the scroller.

**A sideways drag triggers Chrome's swipe-to-go-back.** A horizontal wipe
starting near the screen edge navigated clean off the page mid-puzzle. Guarded
by `overscroll-behavior: none` on `html`, which is the *only* reason that
declaration exists.

**`touch-action` policy for puzzle surfaces.** `none` while unsolved so the
surface owns the whole gesture, `auto` the moment it's solved:

```css
.wipe   { touch-action: none; }
.is-solved .wipe { touch-action: auto; }
```

`pan-y` was tried as a compromise and rejected: wiping dust is a diagonal,
scribbly motion, and handing the vertical component to the scroller mid-stroke
feels like the page fighting you. The cost of `none` is that she can't scroll
*back* with a finger starting on the panel while it's unsolved. That's a
deliberate, accepted trade.

**Drag targets must be forgiving.** The halves puzzle was originally draggable
only on its two text panels, which sit ~114px apart at rest, a touch in the
gap between them did nothing. The whole band is the drag surface now, with the
direction taken from which side of the middle the drag starts.

---

## CSS layout

**Specificity vs source order.** `.section--sealed { display: none }` sat
*before* `.section { display: grid }` with equal specificity, so the shell rule
won and sealing silently did nothing. It's `.section.section--sealed` now.
When a state class fights a base rule, raise its specificity rather than
relying on order.

**A bare `1fr` track has a min-content floor**, so tall content grows the
container past its intended height. Use `minmax(0, 1fr)`. (This was *not*, in
the end, the cause of the overflow it was blamed for, the content genuinely
was taller than the space. Measure before concluding.)

**A grid's auto column is content-sized, so `width: 100%` children collapse to
zero.** Every puzzle surface uses `width: 100%`, and the halves stage came out
0px wide. `.section__row` therefore declares
`grid-template-columns: minmax(0, 1fr)` explicitly. If a puzzle surface
mysteriously has no width, this is why.

**`place-content: center` sets `justify-content`, which beats
`justify-items`.** It silently defeated the alignment that makes the two torn
halves *meet*, the payoff of the signature section simply didn't exist.

**`isolation: isolate` on a section traps its content below fixed overlays.**
It made each section a stacking context, so the fixed exposure vignette painted
over the poem instead of behind it, and the whole page read as uniformly
dimmed. Sections must not be isolated.

**`overflow: clip` on `.section` is load-bearing.** The mist layers are
deliberately oversized (`inset: -20%`); without the clip they extend the
document sideways. They're masked to fade before the top and bottom edges so
the clip never shows as a seam, that mask *is* the fix for the harsh
boundaries between segments.

**`--column` must never be wider than the padded width.** It was `min(92vw,
34rem)` while the sections already inset themselves by `--gutter`. On a 390px
phone that made the column 8.8px too wide, its `margin-inline: auto` collapsed,
and every section's content sat **4.4px right of centre** while the fixed seam
stayed on the true middle. The spark and the flame are the tell, because they're
the two things meant to sit exactly on the seam. It's `min(100%, 34rem)` now, so
it cannot overflow whatever the gutter does.

**`dvh`, never `vh`.** Mobile browser chrome collapses on scroll and `100vh`
causes the classic jumping-gap bug.

**Puzzles must not add direct children to `.section`.** It's a fixed five-row
grid; an extra child takes a row and shoves everything out of order. Build into
the `body` band passed into the puzzle.

**Paint order is load-bearing and documented in `css/tokens.css`.** Backdrop 0,
exposure 1, particles 3, content 10, grain 60, chrome 70. Check that comment
before inventing a `z-index`.

---

## Animation and canvas

**Re-adding a class does not restart a CSS animation.** Style recalculation is
lazy, so removing `is-swept` and adding it straight back gets coalesced into no
change at all: the browser never sees `animation-name` go away, and with
`forwards` fill the element sits on the last frame of the previous run forever.
Reopening a letter left its title dark and reopening a promise left the whole card
dark, while the letter's stanzas were fine because they are rebuilt as new nodes
each time. Proved it rather than guessed it: the naive remove-then-add leaves
`getAnimations()[0].playState === 'finished'`, and cancel plus a forced flush
leaves it `'running'`. Use `restartSweep()` from `js/sweep.js`, and do not delete
the `void el.offsetWidth` line in it, which looks like it does nothing and is the
entire fix.

**A mask sweep must finish on the opaque part of the mask.** The first version
ended mid-gradient, leaving part of every line permanently semi-transparent and
hard to read. The mask is 300% wide and travels the full distance so it lands
on the solid third.

**Cross-fade means both fields alive at once.** Fading a canvas to zero,
swapping its contents, and fading back in leaves a visible gap with nothing on
screen, it reads as a blink. `particles.js` keeps multiple layers with
independent fade weights and draws them in the same frame. It caps at three
layers, because fast scrolling would otherwise stack one field per section.

**Sub-pixel particles are invisible.** 0.4–1.3px radii at alpha 0.08 produced
about 100 lit pixels across a whole phone screen, technically drawing,
practically absent. Sizes and alphas are now well clear of sub-pixel and each
particle gets a cheap second arc as a halo. ~4000 lit pixels now.

**A canvas sized in `dvh` needs a `ResizeObserver`, not just `resize`.** The
particle canvas renders stretched on first load on a phone: collapsing browser
chrome changes its CSS height without reliably firing a window `resize`, so the
backing store keeps its old dimensions. It corrects itself the moment anything
else triggers a re-measure, which is why scrolling to another section and back
"fixed" it. Observe the canvas itself, and re-measure after the first frame and
on `load`.

**Fade with the frame timestamp, not per frame**, or transitions run at
different speeds on 60Hz and 144Hz displays.

**A dynamic `import()` lands a frame or two late.** Hiding the void's poem via
a JS-applied class made it flash fully visible on every load. State that must
be true at first paint belongs in CSS.

**Don't blanket-reveal children.** `.is-solved .section__inner > *
{ opacity: 1 }` overrode the hint and skip link's own hidden state and left
them on screen after solving. List what you mean.

---

## Progress state

**Solved progress persists in `localStorage`**, and so does everything derived
from it, backdrop dimming, lit moons, the "keep going" cue. A finished run
makes the site look permanently at maximum exposure, which reads as a bug and
isn't. Reset:

```js
localStorage.removeItem('ardh:unlocked'); location.reload();
```

**The page is paged, not scrolled.** `html.is-paged { overflow: hidden }` and
she travels a section at a time via the arrows bottom right, the wheel, or the
keyboard. Free scrolling on a phone was miserable: every section owns a large
puzzle surface that has to claim the gesture, and mandatory snap fought whatever
was left, so the page only moved if you found the right patch of empty
background. The document is still the scroller and is still scrolled
programmatically with `scrollIntoView`, so nothing is transformed or faked, and
any test can still drive it the same way. The class is added by JS, so without
scripting the page stays a normal scrolling document.

**Sections after the first unsolved one are removed from the document**
(`display: none`), so the page ends at the frontier and she can't scroll past
an unfinished puzzle. Consequences: no wheel hijacking is needed anywhere, and
any test must solve puzzles **in order** or the later sections won't exist.

---

## Environment (Windows, managed laptop)

**LAN testing is impossible on this machine.** Group Policy sets the private
firewall profile to `BlockInbound` *and* reports `LocalFirewallRules: N/A
(GPO-store only)`, so a rule allowing Python through would be ignored even with
admin rights, and notifications are suppressed, so no prompt ever appears.
I am not a local admin on it either. Use Chrome USB port forwarding instead
(`chrome://inspect` → Port forwarding); see the README. iPhone has no
equivalent.

**`pkill` from Git Bash does not kill Windows processes.** Stray `serve.py`
instances hold ports invisibly. Use:

```powershell
Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
  Where-Object { $_.CommandLine -like '*serve.py*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

**Bash heredocs eat backslashes**, which mangles Windows paths in generated JS
(`C:\Program Files\...` becomes `C:Program Files...`). Write such files with
the Write tool, or pass paths via environment variables.

**`SO_REUSEADDR` on Windows lets a second server bind a port already in use**,
so two servers fight over it silently. `serve.py` sets `SO_EXCLUSIVEADDRUSE`
instead and errors cleanly.

**Chrome's headless `--screenshot` needs absolute Windows paths** and fails
with a bare filename; PowerShell handles the quoting better than Bash here.

---

## Hosting

**Pages requires a public repo** on a free account, and once public the site is
on the open internet. `noindex` is set, but that's politeness, not privacy.

**All paths must stay relative** (`css/tokens.css`, not `/css/tokens.css`).
Pages serves from a subfolder, so a leading slash works locally and breaks live.

