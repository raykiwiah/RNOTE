/**
 * AI period-recap value object + validator. Mood stays humble and
 * evidence-based — a light vibe, never a diagnosis. Pure domain.
 */
export const MOODS = [
  'happy',
  'motivated',
  'stressed',
  'burned-out',
  'creative',
  'focused',
  'mixed',
] as const;

export type Mood = (typeof MOODS)[number];

export interface Recap {
  focus: string[];
  mood: { overall: Mood; note: string };
  highlights: string[];
  people: string[];
  openLoops: string[];
}

function stringList(value: unknown, max: number): string[] {
  return Array.isArray(value)
    ? value.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((x) => x.trim()).slice(0, max)
    : [];
}

export function parseRecap(input: unknown): Recap | null {
  if (!input || typeof input !== 'object') return null;
  const o = input as Record<string, unknown>;
  const moodObj = (o.mood && typeof o.mood === 'object' ? o.mood : {}) as Record<string, unknown>;
  const overall = (MOODS as readonly string[]).includes(moodObj.overall as string)
    ? (moodObj.overall as Mood)
    : 'mixed';
  const focus = stringList(o.focus, 5);
  const highlights = stringList(o.highlights, 5);
  // Require at least some substance to treat it as a valid recap.
  if (focus.length === 0 && highlights.length === 0) return null;
  return {
    focus,
    mood: { overall, note: typeof moodObj.note === 'string' ? moodObj.note.trim() : '' },
    highlights,
    people: stringList(o.people, 6),
    openLoops: stringList(o.openLoops, 5),
  };
}
