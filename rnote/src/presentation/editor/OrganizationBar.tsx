import type { LabelField } from '@domain/organization';
import { useOrganization } from '../state/organization';
import { useWorkspace } from '../state/workspace';
import { Chip } from '../components/Chip';
import { collectionIcon, type CollectionKind } from '../lib/collections';

const SOURCE_LABEL: Record<string, string> = { ai: 'via AI', user: 'edited', heuristic: 'auto' };

/**
 * The organization bar under a document's title: editable chips for the labels
 * that filed this note. Clicking a chip jumps to its collection; ✕ removes it
 * (recorded as a correction so re-analysis won't bring it back).
 */
export function OrganizationBar({ docId }: { docId: string }): JSX.Element | null {
  const org = useOrganization((s) => s.byId[docId]);
  const overrideLabel = useOrganization((s) => s.overrideLabel);
  const openCollection = useWorkspace((s) => s.openCollection);

  if (!org) return null;

  const labelChips: Array<{ field: LabelField; kind: CollectionKind; label: string }> = [
    ...org.categories.map((label) => ({ field: 'categories' as const, kind: 'category' as const, label })),
    ...org.projects.map((label) => ({ field: 'projects' as const, kind: 'project' as const, label })),
    ...org.people.map((label) => ({ field: 'people' as const, kind: 'person' as const, label })),
  ];

  if (labelChips.length === 0 && org.tags.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {labelChips.map(({ field, kind, label }) => (
        <Chip
          key={`${field}:${label}`}
          icon={collectionIcon(kind, label)}
          label={label}
          tone="primary"
          onClick={() => openCollection(kind, label)}
          onRemove={() => void overrideLabel(docId, field, label, 'remove')}
        />
      ))}
      {org.tags.map((tag) => (
        <Chip
          key={`tag:${tag}`}
          label={`#${tag}`}
          onRemove={() => void overrideLabel(docId, 'tags', tag, 'remove')}
        />
      ))}
      <span className="ml-1 text-[11px] text-subtle">{SOURCE_LABEL[org.source] ?? 'auto'}</span>
    </div>
  );
}
