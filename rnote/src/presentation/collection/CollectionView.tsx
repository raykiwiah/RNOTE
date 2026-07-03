import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import type { DocumentTreeNode } from '@application/dto';
import type { StoredOrganization } from '@application/ports/OrganizationRepository';
import { useWorkspace } from '../state/workspace';
import { useOrganization } from '../state/organization';
import { docIdsForCollection, collectionIcon } from '../lib/collections';
import { Chip } from '../components/Chip';

/** A live collection: the card grid of notes matching an auto-generated label. */
export function CollectionView(): JSX.Element {
  const activeCollection = useWorkspace((s) => s.activeCollection);
  const tree = useWorkspace((s) => s.tree);
  const open = useWorkspace((s) => s.open);
  const byId = useOrganization((s) => s.byId);
  const [subFilter, setSubFilter] = useState<string | null>(null);

  const flat = useMemo(() => flatten(tree), [tree]);
  const orgs = useMemo(() => Object.values(byId), [byId]);

  const docs = useMemo(() => {
    if (!activeCollection) return [];
    const ids = docIdsForCollection(activeCollection.kind, activeCollection.label, orgs);
    return flat.filter((n) => ids.has(n.id)).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [activeCollection, orgs, flat]);

  const subLabels = useMemo(() => collectSubLabels(docs, byId), [docs, byId]);

  const visible = useMemo(
    () => (subFilter ? docs.filter((n) => matchesLabel(byId[n.id], subFilter)) : docs),
    [docs, byId, subFilter],
  );

  if (!activeCollection) {
    return <div className="p-10 text-sm text-muted-foreground">No collection selected.</div>;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[880px] px-6 pb-24 pt-14 sm:px-10">
        <header className="flex items-center gap-3">
          <span className="text-3xl leading-none">
            {collectionIcon(activeCollection.kind, activeCollection.label)}
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              {activeCollection.label}
            </h1>
            <p className="text-sm text-muted-foreground">
              {docs.length} {docs.length === 1 ? 'note' : 'notes'} · a live collection, not a folder
            </p>
          </div>
        </header>

        {subLabels.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            <Chip label="All" active={subFilter === null} onClick={() => setSubFilter(null)} />
            {subLabels.map((label) => (
              <Chip
                key={label}
                label={label}
                active={subFilter === label}
                onClick={() => setSubFilter((cur) => (cur === label ? null : label))}
              />
            ))}
          </div>
        )}

        {visible.length === 0 ? (
          <div className="mt-8 rn-panel flex flex-col items-center gap-2 px-6 py-12 text-center">
            <FileText size={26} className="text-subtle" />
            <p className="text-sm text-muted-foreground">Nothing here yet.</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visible.map((node, i) => (
              <motion.button
                key={node.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: 0.03 * Math.min(i, 8), ease: [0.16, 1, 0.3, 1] }}
                onClick={() => void open(node.id)}
                className="rn-panel group flex flex-col gap-1 p-4 text-left transition hover:border-border-strong hover:shadow-md"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">
                    {node.icon || <FileText size={16} className="text-subtle" />}
                  </span>
                  <span className="truncate text-sm font-medium text-foreground">{node.title || 'Untitled'}</span>
                </div>
                {node.preview && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{node.preview}</p>
                )}
                <LabelStrip org={byId[node.id]} />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LabelStrip({ org }: { org: StoredOrganization | undefined }): JSX.Element | null {
  if (!org) return null;
  const labels = [...org.categories, ...org.people, ...org.projects].slice(0, 4);
  if (labels.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {labels.map((l) => (
        <span key={l} className="rounded-full bg-surface-hover px-2 py-0.5 text-[10px] text-muted-foreground">
          {l}
        </span>
      ))}
    </div>
  );
}

function collectSubLabels(docs: DocumentTreeNode[], byId: Record<string, StoredOrganization>): string[] {
  const counts = new Map<string, number>();
  for (const doc of docs) {
    const org = byId[doc.id];
    if (!org) continue;
    for (const label of [...org.projects, ...org.people, ...org.tags]) {
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([label]) => label);
}

function matchesLabel(org: StoredOrganization | undefined, label: string): boolean {
  if (!org) return false;
  return [...org.projects, ...org.people, ...org.tags].some((l) => l === label);
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
