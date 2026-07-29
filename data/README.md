# data

## letters.json

The letters shown in Purnima, the last section. This file is the whole store.
There is no database and no sync: the letters are written in advance, committed,
and read straight from here.

**To add one:** append an object to `letters` and commit. That's it.

### Shape

```json
{
  "updated": "ISO timestamp, when this file was last written",
  "letters": [
    {
      "id": "unique string",
      "author": "sivan | her",
      "createdAt": "ISO timestamp",
      "body": "The letter. \\n\\n separates paragraphs."
    }
  ]
}
```

`id` only needs to be unique. `author` is `sivan` or `her`: hers renders with a
gold seal instead of kumkum, so if there's something she wrote to him worth
including, it drops in and looks right without any code change.

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
