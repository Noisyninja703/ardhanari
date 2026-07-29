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

**The site's seam is born here.** It does not exist in the first three
sections. The moment she closes the gap it flares at the centre and grows out
to full height, then stays gold for every section after. That's deliberate: the
seam is the thing she made, not scenery that was always there. Reloading a
solved site skips the birth animation, since she shouldn't watch it hatch
again.

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

### ◒ Trinetra — not built

The third eye. Seeing what's actually there.

Puzzle: she drags a **glass lens** and text invisible to the naked eye becomes
readable through it. Crucially, hidden lines are seeded in **every earlier
section too** (`lensSecret` already exists on each entry in `content.js`), so
scrolling back up with the lens rewards curiosity. This is the easter-egg
engine, not a one-off.

### ◓ Nakshatra — not built

Our constellation. The breather: **no puzzle**, pure reward — five sections of
gated verse in a row would be a chore, not a gift.

A slow star field where certain stars are photos of the two of them. Tap one
and a memory card blooms with a line. Constellation shape to be drawn from her
initial or a date that matters.

Needs: 4–6 photos with a line each, and a decision on the shape.

### ○ Purnima — not built

The full moon, and the only section where **she can write back**.

- **Write:** a glass composer. On send the letter folds, takes a kumkum wax
  seal, and drifts up into the field.
- **Read:** letters float as folded-paper glyphs in dark space, draggable with
  soft inertia, tappable to open. Letters Sivan wrote in advance are already
  there when she arrives.

Storage: Firestore for the instant write, plus an hourly GitHub Action that
commits them to `data/letters.json` so they're archived in git forever. See
[PLAN.md](PLAN.md).

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
