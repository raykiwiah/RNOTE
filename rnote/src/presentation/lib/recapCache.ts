import type { Recap } from '@domain/timeline';

/**
 * Cache month recaps by period + digest hash so they regenerate only when the
 * underlying activity changed — never on a schedule (there is no backend).
 */
const KEY = 'rnote.recaps';
const MAX_ENTRIES = 60;

function hash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) h = (((h << 5) + h) + input.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function recapCacheKey(periodKey: string, digest: string): string {
  return `${periodKey}:${hash(digest)}`;
}

function readAll(): Record<string, Recap> {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, Recap>) : {};
  } catch {
    return {};
  }
}

export function getCachedRecap(key: string): Recap | null {
  return readAll()[key] ?? null;
}

export function setCachedRecap(key: string, recap: Recap): void {
  try {
    const all = readAll();
    all[key] = recap;
    const keys = Object.keys(all);
    if (keys.length > MAX_ENTRIES) delete all[keys[0]!];
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable — recap simply won't cache */
  }
}
