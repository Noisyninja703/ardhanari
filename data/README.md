# data

## letters.json

The letters shown in Purnima, the last section. This file is the archive: the
site reads Firestore first when that exists, and falls back to this, so the
letters survive Firebase disappearing entirely.

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

`author`, `createdAt` and `body` are deliberately the same three fields the
planned Firestore documents use, so the archive Action can write this file
without translating anything. `id` is added by the archive from the document
key; hand-written letters just need it to be unique.

Newest last. The section sorts by `createdAt` anyway, but keeping the file in
order makes it readable.

### The seeded letters

The five currently in here are **placeholders in the right register**, written
to show the tone rather than to be sent. Replace them with real ones. They are
all from `sivan` on purpose: her side of the sky starts empty and fills up when
she writes, which is better than finding words there that she never wrote.

Two things worth keeping when rewriting:

- **No em dashes.** They read as AI-written, which is fatal here. See
  `docs/STORYLINE.md`.
- Paragraph breaks are `\n\n` inside the JSON string. A single `\n` is a line
  break within a paragraph.

Anything genuinely written to her beats anything invented for her. If there are
real messages, use those.
