import type { StoredOrganization } from '@application/ports/OrganizationRepository';

export type CollectionKind = 'category' | 'person' | 'project';

export interface Collection {
  kind: CollectionKind;
  label: string;
  count: number;
  lastActive: number;
  docIds: string[];
}

const FIELD: Record<CollectionKind, 'categories' | 'people' | 'projects'> = {
  category: 'categories',
  person: 'people',
  project: 'projects',
};

/**
 * Live collections are pure queries over the organization index — never folders.
 * Group documents by the labels in one field, most-recently-active first.
 */
export function buildCollections(
  kind: CollectionKind,
  orgs: StoredOrganization[],
  updatedAtById: Map<string, number>,
): Collection[] {
  const field = FIELD[kind];
  const groups = new Map<string, { docIds: string[]; lastActive: number }>();
  for (const org of orgs) {
    for (const label of org[field]) {
      const entry = groups.get(label) ?? { docIds: [], lastActive: 0 };
      if (!entry.docIds.includes(org.docId)) entry.docIds.push(org.docId);
      entry.lastActive = Math.max(entry.lastActive, updatedAtById.get(org.docId) ?? 0);
      groups.set(label, entry);
    }
  }
  return [...groups.entries()]
    .map(([label, e]) => ({ kind, label, count: e.docIds.length, lastActive: e.lastActive, docIds: e.docIds }))
    .sort((a, b) => b.lastActive - a.lastActive || b.count - a.count || a.label.localeCompare(b.label));
}

/** The set of document ids belonging to a given collection. */
export function docIdsForCollection(
  kind: CollectionKind,
  label: string,
  orgs: StoredOrganization[],
): Set<string> {
  const field = FIELD[kind];
  const key = label.toLowerCase();
  const ids = new Set<string>();
  for (const org of orgs) {
    if (org[field].some((l) => l.toLowerCase() === key)) ids.add(org.docId);
  }
  return ids;
}

const CATEGORY_EMOJI: Record<string, string> = {
  shopping: '🛍️',
  finance: '💰',
  meetings: '🗓️',
  health: '🩺',
  fitness: '💪',
  travel: '✈️',
  journal: '📓',
  ideas: '💡',
  research: '🔬',
  work: '💼',
  business: '💼',
  personal: '🏠',
  family: '👪',
  school: '🎓',
  books: '📚',
  recipes: '🍳',
  investments: '📈',
};

/** A stable emoji for a collection chip (category gets a themed icon). */
export function collectionIcon(kind: CollectionKind, label: string): string {
  if (kind === 'person') return '🧑';
  if (kind === 'project') return '📁';
  return CATEGORY_EMOJI[label.toLowerCase()] ?? '🏷️';
}
