import { useMemo } from 'react';
import type { DocumentTreeNode } from '@application/dto';
import { useWorkspace } from '../state/workspace';
import { useOrganization } from '../state/organization';
import { buildCollections, collectionIcon, type Collection } from '../lib/collections';
import { cn } from '../lib/cn';

/**
 * Smart Collections — live, auto-generated groupings over the organization
 * index. No "create folder" anywhere; sections appear, grow and vanish on their
 * own as notes are written and organized.
 */
export function SmartCollections(): JSX.Element | null {
  const byId = useOrganization((s) => s.byId);
  const tree = useWorkspace((s) => s.tree);
  const openCollection = useWorkspace((s) => s.openCollection);
  const activeCollection = useWorkspace((s) => s.activeCollection);
  const view = useWorkspace((s) => s.view);

  const { categories, people, projects } = useMemo(() => {
    const orgs = Object.values(byId);
    const updatedAtById = new Map(flatten(tree).map((n) => [n.id, n.updatedAt]));
    return {
      categories: buildCollections('category', orgs, updatedAtById).slice(0, 12),
      people: buildCollections('person', orgs, updatedAtById).slice(0, 8),
      projects: buildCollections('project', orgs, updatedAtById).slice(0, 8),
    };
  }, [byId, tree]);

  if (categories.length === 0 && people.length === 0 && projects.length === 0) return null;

  const isActive = (c: Collection): boolean =>
    view === 'collection' &&
    activeCollection?.kind === c.kind &&
    activeCollection.label === c.label;

  const renderSection = (title: string, items: Collection[]): JSX.Element | null =>
    items.length === 0 ? null : (
      <div className="mb-1">
        <div className="px-2.5 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-subtle">
          {title}
        </div>
        {items.map((c) => (
          <button
            key={`${c.kind}:${c.label}`}
            type="button"
            onClick={() => openCollection(c.kind, c.label)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
              isActive(c)
                ? 'bg-primary/10 text-foreground'
                : 'text-muted-foreground hover:bg-surface-hover',
            )}
          >
            <span className="text-[15px] leading-none">{collectionIcon(c.kind, c.label)}</span>
            <span className="flex-1 truncate text-left">{c.label}</span>
            <span className="text-xs text-subtle">{c.count}</span>
          </button>
        ))}
      </div>
    );

  return (
    <div className="px-2">
      {renderSection('Collections', categories)}
      {renderSection('People', people)}
      {renderSection('Projects', projects)}
    </div>
  );
}

function flatten(tree: DocumentTreeNode[]): DocumentTreeNode[] {
  const out: DocumentTreeNode[] = [];
  const walk = (nodes: DocumentTreeNode[]): void => {
    for (const node of nodes) {
      out.push(node);
      walk(node.children);
    }
  };
  walk(tree);
  return out;
}
