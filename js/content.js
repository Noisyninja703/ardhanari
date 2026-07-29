/* ==========================================================================
   content.js — every word on the site lives here.
   Edit this file to change the writing. You never need to touch layout
   or puzzle code to rewrite a verse.

   Anything wrapped in [BRACKETS] is a placeholder waiting on Sivan.
   ========================================================================== */

/* Fill these in and they propagate everywhere. */
export const HER = {
  name: 'Maniksha',
  /* What you actually call her. Falls back to her name until you set it. */
  petName: 'Meri jaan',
};

/* Prefer the pet name where there is one — it's warmer than the formal one. */
export const CALL_HER = HER.petName || HER.name;

export const SITE = {
  title: 'Ardhanarishvara',
  subtitle: 'for ' + CALL_HER + ', on the first of August',
  /* Shown to screen readers and search previews. */
  description:
    'A celestial love letter. Seven phases of the moon, from the void to the full.',
};

/* --- Sections -------------------------------------------------------------
   Order here is the order on the page. `id` is the DOM id and the
   localStorage key for unlock state, so don't rename one without the other.

   phase   — the moon glyph shown in the tithi label and the moon meter
   tithi   — the Sanskrit name of the phase, transliterated
   devanagari — decorative, rendered aria-hidden as background texture
   puzzle  — module name in js/puzzles/, or null for a section with no gate
   ------------------------------------------------------------------------ */

export const SECTIONS = [
  {
    id: 'amavasya',
    phase: '●',            // ● new moon: the dark one
    tithi: 'Amavasya',
    devanagari: 'अमावस्या',
    puzzle: 'spark',
    heading: 'Before Light',
    verses: [
      'Before there was light, there was the wanting of it.',
      'Before the first star, someone was already looking up.',
    ],
    hint: 'Find the light.',
    skipLabel: 'Let there be light',
    /* Revealed only through the lens in section 4. */
    lensSecret: 'You were the reason I started paying attention.',
  },

  {
    id: 'bhasma',
    phase: '◖',            // ◖ waning: light beginning to return
    tithi: 'Bhasma',
    devanagari: 'भस्म',
    puzzle: 'ash',
    heading: 'The Ash Years',
    verses: [
      'When he lost her, he did not build a shrine.',
      'He wore her as ash across his shoulders and called it clothing.',
      'Three thousand years of that, and not one of them spent forgetting.',
      'I understand him better than I would like to admit.',
    ],
    hint: 'Brush the ash away.',
    skipLabel: 'Clear the ash',
    lensSecret: 'Grief is just love with nowhere to go. Mine had somewhere.',
    /* Drop a file at this path and it appears beneath the ash.
       Until then the verse sits on the void, which also looks fine. */
    photo: {
      src: 'assets/img/ash.webp',
      alt: '[DESCRIBE THE PHOTO. This is read aloud by screen readers.]',
    },
  },

  {
    id: 'ardhanarishvara',
    phase: '◐',            // ◐ half moon: the two halves, evenly divided
    tithi: 'Ardhanarishvara',
    devanagari: 'अर्धनारीश्वर',
    puzzle: 'halves',
    heading: 'One Body, Divided',

    /* The verse is torn across the two halves and unreadable until she
       brings them together. Each fragment has to make a kind of sense
       alone, and a better one joined. */
    torn: {
      a: 'half of me',
      b: 'was always walking toward you',
    },

    /* Shown once the halves meet. */
    verses: [
      'They are not two who met and stayed.',
      'They are one body that spent an age learning its own left side.',
      'I have stopped pretending I was ever whole on my own.',
    ],

    hint: 'Pull them together.',
    skipLabel: 'Make them one',
    lensSecret: 'Ardhanarishvara: not two halves of a couple. One being, remembering itself.',
  },
];

/* --- Chrome and interface copy -------------------------------------------
   Interface words are design material. Active voice, sentence case,
   nothing apologises and nothing is vague. */
export const UI = {
  skipToContent: 'Skip to the poem',
  moonMeterLabel: 'Phases of the moon. Jump to a section.',
  soundOn: 'Turn sound on',
  soundOff: 'Turn sound off',
  locked: 'Not yet reached',
  scrollCue: 'Keep going',
};
