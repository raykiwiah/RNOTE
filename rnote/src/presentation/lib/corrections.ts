import type { OrgCorrection } from '@infrastructure/ai/organizationAnalyzer';

/**
 * Learning from corrections. When a user removes (or pins) a suggested label we
 * remember it and feed the most frequent back into the AI prompt so predictions
 * improve over time. Kept in localStorage (bounded, local-only).
 */
const KEY = 'rnote.org.corrections';
const MAX = 40;

interface CorrectionEntry extends OrgCorrection {
  count: number;
  updatedAt: number;
}

function read(): CorrectionEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as CorrectionEntry[]) : [];
  } catch {
    return [];
  }
}

function write(entries: CorrectionEntry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)));
  } catch {
    /* storage unavailable — corrections simply won't persist */
  }
}

export function recordCorrection(kind: string, label: string, action: 'removed' | 'pinned'): void {
  const entries = read();
  const key = `${kind}:${label.toLowerCase()}:${action}`;
  const existing = entries.find((e) => `${e.kind}:${e.label.toLowerCase()}:${e.action}` === key);
  if (existing) {
    existing.count += 1;
    existing.updatedAt = Date.now();
  } else {
    entries.push({ kind, label, action, count: 1, updatedAt: Date.now() });
  }
  entries.sort((a, b) => b.count - a.count || b.updatedAt - a.updatedAt);
  write(entries);
}

/** The most-frequent corrections to inject into the extraction prompt. */
export function topCorrections(limit = 20): OrgCorrection[] {
  return read()
    .slice(0, limit)
    .map(({ label, kind, action }) => ({ label, kind, action }));
}
