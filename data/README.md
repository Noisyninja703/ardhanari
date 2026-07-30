# data

## letters.json

The letters shown in Purnima, the last section. This file is the whole store.
There is no database and no sync: the letters are written in advance, committed,
and read straight from here.

**To add one:** append an object to `letters` and commit. That's it.

### Shape

```json
{
  "updated": "ISO timestamp, when I last touched this file",
  "letters": [
    {
      "title": "Short title, shown beside my name when she opens it",
      "author": "sivan | her",
      "createdAt": "ISO timestamp",
      "body": "The poem. A single \n is a line break. \n\n starts a new stanza."
    }
  ]
}
```

`title` is what appears next to the signature on the opened letter, so it wants
to be short and it wants to mean something. `author` is `sivan` or `her`: hers
renders with a gold seal instead of kumkum, so if there is ever something she
wrote to me worth including, it drops in and looks right with no code change.

**Line breaks matter here.** These are poems, so a single `
` inside the JSON
string is a line break I meant, and `

` starts a new stanza. The section
renders them exactly that way.

Newest last. The section sorts by `createdAt` anyway, but keeping the file in
order makes it readable.

### The seeded letters

The five currently in here are **placeholders in the right register**, written
to show the tone rather than to be sent. Replace them with real ones.

Two things worth keeping when rewriting:

- **No em dashes.** They read as AI-written, which is fatal here. See
  `docs/STORYLINE.md`.
- Paragraph breaks are `\n\n` inside the JSON string. A single `\n` is a line
  break within a paragraph.

Anything genuinely written to her beats anything invented for her. If there are
real messages, use those.
