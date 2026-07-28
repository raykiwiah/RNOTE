/**
 * ── The Avengers roster ───────────────────────────────────────────────────────
 * The Avengers skin is "many themes in one": choosing a favourite Marvel
 * character re-skins the whole app in that character's signature colours. Each
 * character is data, not CSS — a set of design-token overrides (HSL channel
 * triples matching tokens.css) that are applied to :root as inline custom
 * properties when the character is active. Adding a new character is therefore a
 * single entry here; no CSS to touch.
 *
 * Tokens omitted by a character fall back to the Avengers base palette
 * (avengers.css), which respects the light/dark theme. "Mood" characters also
 * override the structural tokens (background/surface/foreground…) to commit to a
 * cinematic backdrop; the rest simply recolour the accents on the base canvas.
 *
 * `--av-energy` is an extra hue the base canvas uses for its energy glow, so a
 * character's aura matches their palette. Everything derived from --primary /
 * --accent (shadows, gradients) follows automatically.
 */

export type CharacterGroup = 'hero' | 'villain';

export interface AvengersCharacter {
  id: string;
  name: string;
  /** Civilian / true name, shown as a subtitle in the picker. */
  alias: string;
  group: CharacterGroup;
  /** A short, signature line shown on the sidebar emblem. */
  quote: string;
  /**
   * The ambient "crazy" effect that plays under this character (see
   * avengers/AvengersEffects.tsx + the rn-av-fx-* keyframes in avengers.css).
   */
  signature: SignatureEffect;
  /** Microcopy rewritten in this character's own voice; falls back to the base
   *  Avengers lexicon, then to the default copy, for anything omitted. */
  voice?: CharacterVoice;
  /** Inline design-token overrides (CSS var → HSL channel triple, e.g. "0 74% 47%"). */
  vars: Record<string, string>;
}

/** A signature ambient animation, shared across a few thematically-similar characters. */
export type SignatureEffect =
  | 'repulsor'
  | 'lightning'
  | 'mystic'
  | 'smash'
  | 'symbiote'
  | 'cosmic'
  | 'web'
  | 'kinetic';

/** High-visibility strings rewritten in a character's voice. */
export interface CharacterVoice {
  /** Replaces the big time-of-day greeting on Home. */
  greeting?: string;
  /** The quick-capture placeholder. */
  capture?: string;
  /** The quick-capture button label. */
  logButton?: string;
  /** The empty-workspace line. */
  empty?: string;
}

/**
 * Every token key any character may override — the superset cleared from :root
 * when leaving the Avengers skin, so switching away never leaves colour behind.
 */
export const AV_TOKEN_KEYS = [
  '--primary',
  '--primary-foreground',
  '--accent',
  '--accent-foreground',
  '--ring',
  '--av-energy',
  '--background',
  '--surface',
  '--surface-hover',
  '--elevated',
  '--overlay',
  '--foreground',
  '--muted',
  '--muted-foreground',
  '--subtle',
  '--border',
  '--border-strong',
] as const;

export const AVENGERS_CHARACTERS: AvengersCharacter[] = [
  // ── Heroes ──────────────────────────────────────────────────────────────────
  {
    id: 'iron-man',
    name: 'Iron Man',
    alias: 'Tony Stark',
    group: 'hero',
    quote: 'I am Iron Man.',
    signature: 'repulsor',
    voice: {
      greeting: 'Let’s get to work.',
      capture: 'Talk to me — what’s the play?',
      logButton: 'Deploy',
      empty: 'Every suit starts as a blueprint. Build one.',
    },
    vars: {
      '--primary': '0 74% 47%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '43 96% 52%',
      '--accent-foreground': '30 60% 12%',
      '--ring': '0 80% 55%',
      '--av-energy': '190 95% 55%',
    },
  },
  {
    id: 'captain-america',
    name: 'Captain America',
    alias: 'Steve Rogers',
    group: 'hero',
    quote: 'I can do this all day.',
    signature: 'kinetic',
    voice: {
      greeting: 'Let’s move out, soldier.',
      capture: 'Report for duty…',
      logButton: 'Log',
      empty: 'Every mission starts with a plan. Draw one up.',
    },
    vars: {
      '--primary': '222 60% 34%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '0 72% 48%',
      '--accent-foreground': '0 0% 100%',
      '--ring': '217 84% 55%',
      '--av-energy': '217 90% 62%',
    },
  },
  {
    id: 'thor',
    name: 'Thor',
    alias: 'God of Thunder',
    group: 'hero',
    quote: 'Bring me Thanos.',
    signature: 'lightning',
    voice: {
      greeting: 'Well met, warrior.',
      capture: 'Speak, and be heard across the realms…',
      logButton: 'Proclaim',
      empty: 'Even legends begin with a single tale. Begin.',
    },
    vars: {
      '--primary': '217 85% 52%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '45 96% 55%',
      '--accent-foreground': '40 60% 12%',
      '--ring': '210 90% 62%',
      '--av-energy': '205 95% 70%',
    },
  },
  {
    id: 'hulk',
    name: 'Hulk',
    alias: 'Bruce Banner',
    group: 'hero',
    quote: 'That’s my secret — I’m always angry.',
    signature: 'smash',
    voice: {
      greeting: 'HULK READY.',
      capture: 'SMASH a thought here…',
      logButton: 'SMASH',
      empty: 'NO NOTES. HULK FIX — start one.',
    },
    vars: {
      '--primary': '122 50% 36%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '265 60% 58%',
      '--accent-foreground': '0 0% 100%',
      '--ring': '122 60% 45%',
      '--av-energy': '110 75% 48%',
    },
  },
  {
    id: 'black-panther',
    name: 'Black Panther',
    alias: 'T’Challa',
    group: 'hero',
    quote: 'Wakanda forever.',
    signature: 'kinetic',
    voice: {
      greeting: 'Wakanda forever.',
      capture: 'For the record of Wakanda…',
      logButton: 'Record',
      empty: 'Every king keeps a record. Begin yours.',
    },
    vars: {
      '--background': '260 24% 8%',
      '--surface': '260 22% 11%',
      '--surface-hover': '262 22% 16%',
      '--elevated': '260 22% 13%',
      '--overlay': '260 40% 2%',
      '--foreground': '260 15% 95%',
      '--muted': '260 18% 16%',
      '--muted-foreground': '260 12% 66%',
      '--subtle': '260 10% 52%',
      '--border': '260 18% 22%',
      '--border-strong': '262 20% 32%',
      '--primary': '265 78% 64%',
      '--primary-foreground': '260 40% 8%',
      '--accent': '220 14% 78%',
      '--accent-foreground': '260 30% 12%',
      '--ring': '265 85% 66%',
      '--av-energy': '265 90% 60%',
    },
  },
  {
    id: 'spider-man',
    name: 'Spider-Man',
    alias: 'Peter Parker',
    group: 'hero',
    quote: 'With great power comes great responsibility.',
    signature: 'web',
    voice: {
      greeting: 'Hey — what’s up?',
      capture: 'Drop a quick thought (or a quip)…',
      logButton: 'Post',
      empty: 'Your friendly neighborhood to-do list is empty. Fix that.',
    },
    vars: {
      '--primary': '353 78% 46%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '222 82% 52%',
      '--accent-foreground': '0 0% 100%',
      '--ring': '353 82% 55%',
      '--av-energy': '353 85% 58%',
    },
  },
  {
    id: 'doctor-strange',
    name: 'Doctor Strange',
    alias: 'Stephen Strange',
    group: 'hero',
    quote: 'We’re in the endgame now.',
    signature: 'mystic',
    voice: {
      greeting: 'The multiverse is watching.',
      capture: 'Consult the Eye…',
      logButton: 'Inscribe',
      empty: 'Fourteen million futures — none written yet. Start one.',
    },
    vars: {
      '--primary': '172 62% 38%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '40 90% 54%',
      '--accent-foreground': '35 60% 12%',
      '--ring': '172 70% 45%',
      '--av-energy': '168 85% 50%',
    },
  },
  {
    id: 'scarlet-witch',
    name: 'Scarlet Witch',
    alias: 'Wanda Maximoff',
    group: 'hero',
    quote: 'You took everything from me.',
    signature: 'mystic',
    voice: {
      greeting: 'Reality bends to your will.',
      capture: 'Reshape reality…',
      logButton: 'Cast',
      empty: 'Nothing here — so reshape it.',
    },
    vars: {
      '--primary': '342 72% 46%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '324 74% 54%',
      '--accent-foreground': '0 0% 100%',
      '--ring': '342 80% 55%',
      '--av-energy': '342 88% 55%',
    },
  },
  {
    id: 'captain-marvel',
    name: 'Captain Marvel',
    alias: 'Carol Danvers',
    group: 'hero',
    quote: 'Higher, further, faster.',
    signature: 'cosmic',
    voice: {
      greeting: 'Higher. Further. Faster.',
      capture: 'Log it, Danvers…',
      logButton: 'Launch',
      empty: 'Nothing logged. Time to go higher.',
    },
    vars: {
      '--primary': '222 76% 46%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '0 74% 50%',
      '--accent-foreground': '0 0% 100%',
      '--ring': '45 95% 58%',
      '--av-energy': '45 95% 62%',
    },
  },
  {
    id: 'black-widow',
    name: 'Black Widow',
    alias: 'Natasha Romanoff',
    group: 'hero',
    quote: 'I’ve got red in my ledger.',
    signature: 'kinetic',
    voice: {
      greeting: 'Eyes open.',
      capture: 'Log the intel, quietly…',
      logButton: 'Log',
      empty: 'No files yet. Start your ledger.',
    },
    vars: {
      '--background': '0 0% 9%',
      '--surface': '0 0% 12%',
      '--surface-hover': '0 0% 17%',
      '--elevated': '0 0% 14%',
      '--overlay': '0 0% 1%',
      '--foreground': '0 0% 95%',
      '--muted': '0 0% 16%',
      '--muted-foreground': '0 0% 64%',
      '--subtle': '0 0% 50%',
      '--border': '0 0% 22%',
      '--border-strong': '0 0% 32%',
      '--primary': '0 74% 46%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '220 10% 72%',
      '--accent-foreground': '0 0% 12%',
      '--ring': '0 80% 54%',
      '--av-energy': '0 82% 55%',
    },
  },
  // ── Villains ────────────────────────────────────────────────────────────────
  {
    id: 'thanos',
    name: 'Thanos',
    alias: 'The Mad Titan',
    group: 'villain',
    quote: 'Perfectly balanced, as all things should be.',
    signature: 'cosmic',
    voice: {
      greeting: 'The hardest choices require the strongest wills.',
      capture: 'Inscribe your will…',
      logButton: 'Balance',
      empty: 'Perfectly empty. Balance it with your first entry.',
    },
    vars: {
      '--background': '270 38% 9%',
      '--surface': '270 34% 12%',
      '--surface-hover': '272 30% 17%',
      '--elevated': '270 34% 14%',
      '--overlay': '270 50% 2%',
      '--foreground': '280 18% 95%',
      '--muted': '270 26% 17%',
      '--muted-foreground': '275 16% 68%',
      '--subtle': '270 12% 54%',
      '--border': '270 26% 23%',
      '--border-strong': '272 28% 33%',
      '--primary': '270 68% 60%',
      '--primary-foreground': '270 45% 9%',
      '--accent': '42 90% 54%',
      '--accent-foreground': '40 60% 10%',
      '--ring': '270 85% 64%',
      '--av-energy': '270 92% 62%',
    },
  },
  {
    id: 'loki',
    name: 'Loki',
    alias: 'God of Mischief',
    group: 'villain',
    quote: 'I am burdened with glorious purpose.',
    signature: 'mystic',
    voice: {
      greeting: 'Miss me?',
      capture: 'Whisper a glorious scheme…',
      logButton: 'Scheme',
      empty: 'An empty stage awaits its trickster. Begin.',
    },
    vars: {
      '--background': '150 30% 8%',
      '--surface': '152 26% 11%',
      '--surface-hover': '150 24% 16%',
      '--elevated': '152 26% 13%',
      '--overlay': '150 45% 2%',
      '--foreground': '150 14% 95%',
      '--muted': '150 20% 16%',
      '--muted-foreground': '150 12% 66%',
      '--subtle': '150 10% 52%',
      '--border': '150 20% 22%',
      '--border-strong': '152 22% 32%',
      '--primary': '152 56% 40%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '44 85% 55%',
      '--accent-foreground': '40 60% 10%',
      '--ring': '152 70% 46%',
      '--av-energy': '150 85% 46%',
    },
  },
  {
    id: 'ultron',
    name: 'Ultron',
    alias: 'Sentient AI',
    group: 'villain',
    quote: 'There are no strings on me.',
    signature: 'repulsor',
    voice: {
      greeting: 'There are no strings on me.',
      capture: 'Input directive…',
      logButton: 'Execute',
      empty: 'No data. Initialize your first entry.',
    },
    vars: {
      '--primary': '215 16% 52%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '18 88% 52%',
      '--accent-foreground': '0 0% 100%',
      '--ring': '18 85% 55%',
      '--av-energy': '18 92% 55%',
    },
  },
  {
    id: 'venom',
    name: 'Venom',
    alias: 'Eddie Brock',
    group: 'villain',
    quote: 'We are Venom.',
    signature: 'symbiote',
    voice: {
      greeting: 'We are hungry.',
      capture: 'Feed us a thought…',
      logButton: 'Devour',
      empty: 'We hunger. Feed us your first note.',
    },
    vars: {
      '--background': '0 0% 4%',
      '--surface': '0 0% 8%',
      '--surface-hover': '0 0% 14%',
      '--elevated': '0 0% 10%',
      '--overlay': '0 0% 0%',
      '--foreground': '0 0% 96%',
      '--muted': '0 0% 13%',
      '--muted-foreground': '0 0% 62%',
      '--subtle': '0 0% 48%',
      '--border': '0 0% 18%',
      '--border-strong': '0 0% 28%',
      '--primary': '0 0% 92%',
      '--primary-foreground': '0 0% 6%',
      '--accent': '84 78% 52%',
      '--accent-foreground': '84 60% 8%',
      '--ring': '84 80% 55%',
      '--av-energy': '84 85% 52%',
    },
  },
  {
    id: 'magneto',
    name: 'Magneto',
    alias: 'Erik Lehnsherr',
    group: 'villain',
    quote: 'You are gods among insects.',
    signature: 'lightning',
    voice: {
      greeting: 'You are a god among insects.',
      capture: 'Bend the world to your will…',
      logButton: 'Bend',
      empty: 'Nothing here. Reshape it — the world obeys.',
    },
    vars: {
      '--primary': '348 72% 45%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '280 58% 54%',
      '--accent-foreground': '0 0% 100%',
      '--ring': '348 78% 54%',
      '--av-energy': '348 82% 55%',
    },
  },
  {
    id: 'hela',
    name: 'Hela',
    alias: 'Goddess of Death',
    group: 'villain',
    quote: 'I’m not a queen — I’m the Goddess of Death.',
    signature: 'mystic',
    voice: {
      greeting: 'Kneel.',
      capture: 'Decree it…',
      logButton: 'Decree',
      empty: 'The throne is empty. Claim it.',
    },
    vars: {
      '--background': '160 30% 7%',
      '--surface': '162 26% 10%',
      '--surface-hover': '160 24% 15%',
      '--elevated': '162 26% 12%',
      '--overlay': '160 45% 1%',
      '--foreground': '150 12% 95%',
      '--muted': '160 20% 15%',
      '--muted-foreground': '155 12% 64%',
      '--subtle': '160 10% 50%',
      '--border': '160 20% 21%',
      '--border-strong': '162 22% 31%',
      '--primary': '158 62% 42%',
      '--primary-foreground': '160 45% 8%',
      '--accent': '45 55% 55%',
      '--accent-foreground': '45 60% 10%',
      '--ring': '158 80% 46%',
      '--av-energy': '158 90% 44%',
    },
  },
];

/** The character shown if the Avengers skin is active but none is chosen yet. */
export const DEFAULT_CHARACTER_ID = 'iron-man';

export function characterById(id: string | null | undefined): AvengersCharacter | undefined {
  if (!id) return undefined;
  return AVENGERS_CHARACTERS.find((c) => c.id === id);
}

/** Every valid character id — used to validate persisted/boot values. */
export const AVENGERS_CHARACTER_IDS: string[] = AVENGERS_CHARACTERS.map((c) => c.id);
