/**
 * Organization metadata for a document — the heart of "content organizes
 * itself". One note carries many labels (categories, projects, people, tags);
 * collections are *queries* over these, never folders. Pure domain: no
 * framework, no persistence, no AI dependency (heuristics are the offline floor
 * and the AI's ceiling both flow into this same shape).
 */
export const INTENTS = [
  'task',
  'idea',
  'journal',
  'meeting',
  'shopping',
  'finance',
  'research',
  'goal',
  'habit',
  'reference',
  'other',
] as const;

export type Intent = (typeof INTENTS)[number];
export type Priority = 'low' | 'medium' | 'high' | null;
export type OrganizationSource = 'ai' | 'heuristic' | 'user';

export interface DocumentOrganization {
  categories: string[];
  projects: string[];
  people: string[];
  places: string[];
  tags: string[];
  intent: Intent;
  priority: Priority;
  /** Raw time phrase, e.g. "before Friday". Not parsed into a date here. */
  dueHint: string | null;
  /** label → 0..1 */
  confidence: Record<string, number>;
  source: OrganizationSource;
  /** When this was computed (ms). 0 = never analyzed. */
  analyzedAt: number;
  /** Guard so analysis only re-runs when the text actually changed. */
  contentHash: string;
}

export function emptyOrganization(): DocumentOrganization {
  return {
    categories: [],
    projects: [],
    people: [],
    places: [],
    tags: [],
    intent: 'other',
    priority: null,
    dueHint: null,
    confidence: {},
    source: 'heuristic',
    analyzedAt: 0,
    contentHash: '',
  };
}

export function isIntent(value: unknown): value is Intent {
  return typeof value === 'string' && (INTENTS as readonly string[]).includes(value);
}

export function isPriority(value: unknown): value is Priority {
  return value === 'low' || value === 'medium' || value === 'high' || value === null;
}

/** Stable, cheap content hash (djb2) over title + body — the re-analysis guard. */
export function hashContent(title: string, text: string): string {
  const input = `${title}\n${text}`;
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) {
    h = (((h << 5) + h) + input.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

/** Title Case a label ("office supplies" → "Office Supplies"). */
export function titleCase(label: string): string {
  return label
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

/** Case-insensitive de-duplication that preserves first-seen display form. */
export function dedupe(list: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

/** Clamp a confidence map into [0,1], dropping non-finite entries. */
export function clampConfidence(confidence: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [label, value] of Object.entries(confidence)) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      out[label] = Math.min(1, Math.max(0, value));
    }
  }
  return out;
}

/**
 * Merge freshly-computed organization with the labels a user explicitly pinned
 * or removed. User intent always wins: pinned labels are force-included, removed
 * labels are force-excluded, and the source is marked accordingly.
 */
export const LABEL_FIELDS = ['categories', 'projects', 'people', 'places', 'tags'] as const;
export type LabelField = (typeof LABEL_FIELDS)[number];

export interface UserOverrides {
  pinned?: Partial<Record<LabelField, string[]>>;
  removed?: Partial<Record<LabelField, string[]>>;
}

export function applyOverrides(
  organization: DocumentOrganization,
  overrides: UserOverrides,
): DocumentOrganization {
  const next: DocumentOrganization = { ...organization };
  let touched = false;
  for (const field of LABEL_FIELDS) {
    const removed = new Set((overrides.removed?.[field] ?? []).map((s) => s.toLowerCase()));
    const pinned = overrides.pinned?.[field] ?? [];
    if (removed.size === 0 && pinned.length === 0) continue;
    touched = true;
    const kept = organization[field].filter((label) => !removed.has(label.toLowerCase()));
    next[field] = dedupe([...pinned, ...kept]);
  }
  if (touched) next.source = 'user';
  return next;
}
