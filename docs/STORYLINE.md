# Storyline

## The thesis

**Ardhanarishvara** — Shiva and Parvati as one body split down the middle.
Not two people who met, but one being that spent an age learning its own left
side. Every section serves that idea; the site's own vertical seam is its
spine, and it dissolves when she rejoins the halves.

Register: **devotional cosmic**. Tapasya, ash, moonlight, longing, reunion.
Tender and reverent — not gore, not fury. Kali stays out of it.

Chosen deliberately with Sivan: **"Sivan" is the Tamil form of "Shiva".** The
theme isn't a metaphor he's borrowing; it's already sitting in his name. Lean
on that, but never state it outright in the copy — let her notice.

## The structural device: tithi, not numbers

Sections are **lunar phases**, new moon to full. Never `01 / 02 / 03`. The moon
encodes the emotional progression *and* is Shiva's crescent, and the moons
across the bottom of the screen double as the progress display.

```
●  →  ◖  →  ◐  →  ◑  →  ◒  →  ◓  →  ○
void   ash   union  resolve  sight  us    fullness
```

## The arc

Absence → grief → reunion → devotion → seeing truly → the two of them
specifically → speaking to each other. The first three are about the myth, and
the last four bring it home to Sivan and Maniksha. That shift is intentional:
the myth earns the intimacy, then gets out of the way.

---

## The seven sections

### ● Amavasya — "Before Light" · built

The new moon. Total black, one point of light breathing. She holds still near
it and it ignites into the poem.

> Before there was light, there was the wanting of it.
> Before the first star, someone was already looking up.

The interaction *is* the theme: nothing arrives until she stops moving and pays
attention. No seam yet — one being, before division.

### ◖ Bhasma — "The Ash Years" · built

Shiva after Sati's death. The verse is buried under ash; she wipes it away.

> When he lost her, he did not build a shrine.
> He wore her as ash across his shoulders and called it clothing.
> Three thousand years of that, and not one of them spent forgetting.
> I understand him better than I would like to admit.

That last line is the hinge of the whole site — the first moment the speaker
admits he's talking about himself. **A photo belongs under this ash**
(`assets/img/ash.webp`); it appears automatically if present.

### ◐ Ardhanarishvara — "One Body, Divided" · built

The signature. One verse torn across two halves, unreadable apart. Dragging
either half moves both, because you cannot bring one back without the other.

> *half of me* · *was always walking toward you*

**The second half is withheld.** It's blurred and dimmed in proportion to the
gap, so it only becomes readable as she closes it. Seeing the ending early
gives the whole thing away; earning it word by word is the point. Both halves
drift gently on their own rhythms so they read as pieces adrift in space, and
settle onto one shared drift once joined, so the completed line breathes as a
single piece.

The halves sit **side by side** and are dragged together sideways, so the seam
they make is vertical, matching the seam that runs down the rest of the site.

Once they meet, the two halves **dissolve into a single line** of text that
flows and wraps across the whole column. They can't just stay where they are:
each half only has half a column, so the short one is a single line and the
long one is two, and the "joined" result reads as two mismatched blocks instead
of a sentence.

**The site's seam is born here.** It does not exist in the first three
sections. The moment she closes the gap, a bloom bursts from the centre of the
screen and the seam grows out to the full height of the viewport, then stays
gold for every section after. It's a full-page element behind all the text, not
tied to where the words met, so the burst belongs to the whole page rather than
to a block of type. That's deliberate: the seam is the thing she made, not
scenery that was always there. Reloading a solved site skips the birth, since
she shouldn't watch it hatch again.

### ◑ Tapasya — "She Did the Waiting" · built

Parvati's austerity. Cold, still, one small flame guttering. **She's** the one
who refuses to give up in this story, and this section is where that lands.

> She did not wait to be chosen.
> She stood in the snow until the snow gave up,
> and kept one flame alive for a hundred years,
> until even a god had to open his eyes and look.

Puzzle: **tend the flame.** The verse types itself only while her pointer or
finger stays near it; drift away and the flame gutters and the words stop. The
interaction forces stillness, so the mechanic *is* the devotion. The caret
blinks while the flame is out, so a paused verse reads as waiting for her
rather than broken.

Deliberate: Parvati is the active party here and the verse says so plainly.
"She did not wait to be chosen" is the line that keeps this section from making
her passive, which would break the whole myth.

The turn toward Maniksha is held back to the lens secret, so it lands later:
*"You did the waiting. I have never once forgotten what that cost you."*

### ◒ Trinetra — "The Third Eye" · built

Seeing what's actually there.

> The third eye is not for burning.
> It is for looking at one thing long enough to see what it actually is.
> I have been looking at you for years and I am nowhere near finished.

Puzzle: she drags a **piece of glass** across the page. Lines invisible to the
naked eye are readable through it. Holding it over this section's own hidden
line opens the eye and solves it.

**This is the easter-egg engine, not a one-off.** Every section has carried a
hidden line since it was written (`lensSecret` in `content.js`), and the lens
persists for the rest of the visit, so she can carry it back up the page and
sweep everything she has already read. This section's own secret is what tells
her that: *"Everything you have already read has something hidden in it. Take
this back with you."*

The reveal is a real window, not a fade: each hidden line is fully coloured
text masked away to nothing, and the mask is a circle at the lens position
expressed in that element's own coordinates. That's why it runs in a frame loop
rather than in pure CSS.

**Add a `lensSecret` to every future section.** It costs one line and it's the
most personal writing on the site, because it's the part she has to go looking
for.

### ◓ Nakshatra — "The Stars I Follow to You" · built

The breather. **Nothing to solve**, because five gated sections in a row would
be a chore rather than a gift. It opens the moment she arrives.

A slow field of ambient stars, and six brighter ones wired together by a faint
asterism. **Each of those six is a promise.** Tapping one opens it full screen,
alone, with nothing else on the page.

Not memories, and not photographs. The promises are measured against what
Shiva's devotion actually consists of rather than what it looks like from
outside: staying through the ash years, waiting without making the waiting a
debt, guarding her without owning her, carrying her whatever happens.

Two of them deliberately answer earlier sections, so by the time she reaches
this sky she has already read the myth they come from:

> That if the worst ever comes, I will carry you the way he carried her. Not as
> grief. As clothing.

answers Bhasma, and

> That your name sits beside mine in everything. Never after it.

answers Ardhanarishvara. That's the payoff of putting this section sixth: the
promises only land because the myth has already done the work.

The star labels deliberately say only "A promise, 3 of 6", never the text.
Opening one is the whole gesture, and six promises readable off the labels would
spend the section before she starts.

Only the ambient stars drift. The promise stars stay put, because she has to be
able to aim at them, and a moving target is a worse gift.

**These are Sivan's to rewrite.** They should sound like him, and a promise he
would not actually keep has no business being up there.

### ○ Purnima — "Everything I Wrote Down" · built

The full moon. Nothing left hidden.

Letters drift as folded paper with a wax seal. She can push them around, they
coast to a stop when flicked, and tapping one opens it full-screen to read. No
verse here either: the letters are the writing.

**They are written in advance and that is the whole section.** She does not write
back through the site, by decision: no composer, no database, no sync. Sivan
writes them, commits them, done. It also means the last thing she reads is
unambiguously his, which is a better ending than a text box.

The five seeded letters are placeholders in the right register. The `author`
field survives with a gold seal for hers, so anything she has written to him can
be dropped in and renders correctly.

This is also where the **"Walk it again"** control lives, since it's the last
section: it appears once she's finished, and takes her back to the dark.

---

## Writing notes

- **No em dashes. Ever.** Not in verses, headings, hints, button labels, meta
  descriptions or aria-labels. They are a tell, and they make the writing read
  as AI-generated, which is fatal for a love letter meant to sound like Sivan.
  Split the sentence instead of reaching for a semicolon.
- **Her words matter more than mine.** Anything Sivan has already written to
  her beats anything generated. Ask for it.
- The current verses are decent and entirely generic — they're about Shiva, not
  about Maniksha. Every section wants one concrete, specific, true detail.
- Second person, sparingly. The poem mostly speaks *about* the myth and lets
  the last line of each section turn toward her.
- Sanskrit is texture, not content — rendered `aria-hidden`, one word per
  section, in the same typeface as the English so they speak in one voice.
- No emoji, no exclamation marks, nothing arch. The tone is reverent.
- Hindu references must be done properly or not at all. If unsure whether
  something lands as devotional or as costume, ask Sivan — she's the one who'll
  know.

## The one line the site is for

Everything above is scaffolding for the moment she reads
*"half of me was always walking toward you"* and the two halves click together
under her thumb. Protect that moment when making changes.
