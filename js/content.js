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

/* Who signed a letter. Keys match the `author` field in data/letters.json, so
   this is the only place the mapping from a stored key to a name she reads
   lives. */
export const AUTHORS = {
  sivan: 'Sivan',
  her: HER.name,
};

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
    lensSecret: 'Not two halves of a couple. One being, remembering itself.',
  },

  {
    id: 'tapasya',
    phase: '◑',            // ◑ waxing: the light she earned back
    tithi: 'Tapasya',
    devanagari: 'तपस्या',
    puzzle: 'flame',
    heading: 'She Did the Waiting',

    /* Typed out, one character at a time, and only while she keeps her hand
       near the flame. Parvati is the active party in this myth and the verse
       has to say so. */
    verses: [
      'She did not wait to be chosen.',
      'She stood in the snow until the snow gave up,',
      'and kept one flame alive for a hundred years,',
      'until even a god had to open his eyes and look.',
    ],

    hint: 'Keep the flame safe.',
    skipLabel: 'Let it burn',
    lensSecret: 'You did the waiting. I have not forgotten what it cost you.',
  },

  {
    id: 'trinetra',
    phase: '◒',            // ◒ waxing further: seeing more of it
    tithi: 'Trinetra',
    devanagari: 'त्रिनेत्र',
    puzzle: 'lens',
    heading: 'The Third Eye',

    verses: [
      'The third eye is not for burning.',
      'It is for looking at one thing long enough to see what it actually is.',
      'I have been looking at you all this time and I am nowhere near finished.',
    ],

    hint: 'Move the glass across the dark.',
    skipLabel: 'Open the eye',

    /* This one is the reward for solving the section, and it tells her the
       lens works everywhere. Every earlier section has had a line hidden in it
       since the day it was written. */
    lensSecret: 'Every part you have already read is hiding something. Go back.',
  },

  {
    id: 'nakshatra',
    phase: '◓',            // ◓ nearly full: almost all of it lit
    tithi: 'Nakshatra',
    devanagari: 'नक्षत्र',
    puzzle: 'constellation',
    heading: 'The Stars I Follow to You',

    /* No verse here on purpose. This section is the breather: five gated
       sections in a row would be a chore, so the reward is that there's nothing
       to solve. The promises below carry the words. */
    verses: [],

    /* Each star is a promise. Tapping one opens it.

       Measured against what Shiva's devotion actually consists of rather than
       what it looks like from outside: staying through the ash years, waiting
       without making the waiting a debt, guarding her without owning her, and
       carrying her whatever happens. Two of them deliberately answer earlier
       sections, so by the time she reaches this sky she has already read the
       myth they come from.

       `at` is [x%, y%] within the field, and the order below is the order the
       constellation lines are drawn in, so it reads as one shape rather than
       scattered dots. Six is the number the shape is drawn for.

       Written as vows spoken straight to her rather than clauses hanging off an
       unwritten "I promise that". Nothing on screen completes that stem, so the
       lines have to stand up on their own.

       These are Sivan's to rewrite. They should sound like him, and a promise
       he would not actually keep has no business being up there. */
    promises: [
      {
        at: [18, 74],
        text: 'I will never need you at your best to stay. Ash or moonlight, I am not going anywhere.',
      },
      {
        at: [33, 46],
        text: 'When you need time, take it. I will be here, and I will never hand you the bill for it.',
      },
      {
        at: [49, 60],
        text: 'I will stand between you and whatever is coming. Never between you and what you want.',
      },
      {
        at: [64, 31],
        text: 'I will keep looking at you properly, and tell you what I see, even when silence would be easier.',
      },
      {
        at: [79, 48],
        text: 'Your name goes beside mine in everything. Never after it.',
      },
      {
        at: [89, 19],
        text: 'If the worst ever comes, I will carry you the way he carried her. Not as grief. As clothing.',
      },
    ],

    hint: 'Touch a star.',
    lensSecret: 'I did not choose these because they were the easy ones to promise.',
  },

  {
    id: 'purnima',
    phase: '○',            // ○ full moon: all of it lit, nothing left hidden
    tithi: 'Purnima',
    devanagari: 'पूर्णिमा',
    puzzle: 'letters',
    heading: 'Everything I Wrote Down',

    /* No verse. The letters are the writing, and there are a lot of them. */
    verses: [],

    /* Standing guidance: no skipLabel, because there is nothing here to be
       stuck on. */
    hint: 'Open one.',

    /* Shown when there are no letters to read at all, which should only ever
       happen if data/letters.json is missing or unreadable. */
    emptyLetters: 'The letters have not arrived yet.',

    lensSecret: 'I wrote all of these before I knew whether I would send any.',
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

  /* The glass toggle, top right. Only exists once Trinetra has given it to her. */
  lensHide: 'Put the glass away',
  lensShow: 'Take the glass out',

  /* Moving between sections. Scrolling is locked, so these are how she travels. */
  navBack: 'Back a phase',
  navOnward: 'Onward a phase',
  locked: 'Not yet reached',
  scrollCue: 'Keep going',

  /* On the last section only, once she's finished. Two steps, because it wipes
     every puzzle she solved and it should take more than one stray tap. */
  resetOffer: 'Walk it again?',
  resetConfirm: 'Yes, start from the dark.',
};
