/**
 * Shared types for "variant skins" — atmospheres whose exact palette comes from a
 * chosen character (Avengers → a Marvel character; Pantheon → a Greek/Norse
 * figure). Each character is data: a set of design-token overrides applied to
 * :root as inline custom properties. This is a leaf module (no imports) so the
 * rosters and the variants registry can share it without cycles.
 */

/** High-visibility strings rewritten in a character's own voice. */
export interface CharacterVoice {
  /** Replaces the big time-of-day greeting on Home (stands alone; no name). */
  greeting?: string;
  /** The quick-capture placeholder. */
  capture?: string;
  /** The quick-capture button label. */
  logButton?: string;
  /** The empty-workspace line. */
  empty?: string;
}

export interface VariantCharacter {
  id: string;
  name: string;
  /** Epithet / true name, shown as a subtitle in the picker and emblem. */
  alias: string;
  /** Grouping for the picker — theme-defined (e.g. 'hero'|'villain', 'god'|'norse'). */
  group: string;
  /** A short, signature line shown on the emblem panel. */
  quote: string;
  /** Ambient effect key — theme-defined; see each theme's effects component. */
  signature: string;
  /** Microcopy rewritten in this character's voice (falls back to skin → default). */
  voice?: CharacterVoice;
  /** Inline design-token overrides (CSS var → HSL channel triple, e.g. "0 74% 47%"). */
  vars: Record<string, string>;
}

/**
 * Every token key any variant may override — the superset cleared from :root when
 * leaving a variant skin, so switching away (or switching character) never leaves
 * colour behind. A test enforces that every character stays within this set.
 */
export const VARIANT_TOKEN_KEYS = [
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
