import {
  analyzeHeuristically,
  applyOverrides,
  hashContent,
  type DocumentOrganization,
  type LabelField,
  type UserOverrides,
} from '@domain/organization';
import type {
  OrganizationRepository,
  StoredOrganization,
} from '../ports/OrganizationRepository';

export interface AnalyzeInput {
  docId: string;
  workspaceId: string;
  title: string;
  text: string;
}

export interface AnalyzeOptions {
  /** Re-analyze even when the content hash is unchanged. */
  force?: boolean;
  /**
   * Optional richer analyzer (the AI path). When it resolves to a value that
   * becomes the base; on null/throw we fall back to the offline heuristics.
   */
  analyzer?: (title: string, text: string) => Promise<DocumentOrganization | null>;
}

/**
 * Computes and persists a document's organization. The heuristic engine is the
 * always-available floor; an optional `analyzer` (Phase B AI) can supply a
 * richer base. User overrides (pin/remove) are re-applied on every analysis so a
 * manual edit is never undone.
 */
export class OrganizationService {
  constructor(private readonly repo: OrganizationRepository) {}

  get(docId: string): Promise<StoredOrganization | null> {
    return this.repo.get(docId);
  }

  list(workspaceId: string): Promise<StoredOrganization[]> {
    return this.repo.listByWorkspace(workspaceId);
  }

  remove(docId: string): Promise<void> {
    return this.repo.delete(docId);
  }

  async analyze(input: AnalyzeInput, opts: AnalyzeOptions = {}): Promise<StoredOrganization | null> {
    const contentHash = hashContent(input.title, input.text);
    const existing = await this.repo.get(input.docId);
    if (!opts.force && existing && existing.contentHash === contentHash) return existing;

    let base: DocumentOrganization | null = null;
    if (opts.analyzer) {
      try {
        base = await opts.analyzer(input.title, input.text);
      } catch {
        base = null;
      }
    }
    if (!base) base = analyzeHeuristically(input.title, input.text, Date.now());

    const pinned = existing?.pinned ?? {};
    const removed = existing?.removed ?? {};
    const resolved = applyOverrides(base, asOverrides(pinned, removed));
    const stored: StoredOrganization = {
      ...resolved,
      docId: input.docId,
      workspaceId: input.workspaceId,
      raw: base,
      pinned,
      removed,
      contentHash,
    };
    await this.repo.put(stored);
    return stored;
  }

  /** Pin or remove a single label; records the override and re-resolves. */
  async override(
    docId: string,
    field: LabelField,
    label: string,
    action: 'pin' | 'remove',
  ): Promise<StoredOrganization | null> {
    const existing = await this.repo.get(docId);
    if (!existing) return null;
    const pinned = cloneMap(existing.pinned);
    const removed = cloneMap(existing.removed);
    if (action === 'pin') {
      pinned[field] = pushUnique(pinned[field], label);
      removed[field] = without(removed[field], label);
    } else {
      removed[field] = pushUnique(removed[field], label);
      pinned[field] = without(pinned[field], label);
    }
    const resolved = applyOverrides(existing.raw, asOverrides(pinned, removed));
    const stored: StoredOrganization = {
      ...resolved,
      docId: existing.docId,
      workspaceId: existing.workspaceId,
      raw: existing.raw,
      pinned,
      removed,
      contentHash: existing.contentHash,
    };
    await this.repo.put(stored);
    return stored;
  }
}

function asOverrides(
  pinned: Record<string, string[]>,
  removed: Record<string, string[]>,
): UserOverrides {
  return {
    pinned: pinned as UserOverrides['pinned'],
    removed: removed as UserOverrides['removed'],
  };
}

function cloneMap(map: Record<string, string[]>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const key of Object.keys(map)) out[key] = [...(map[key] ?? [])];
  return out;
}

function pushUnique(list: string[] | undefined, label: string): string[] {
  const current = list ?? [];
  return current.some((x) => x.toLowerCase() === label.toLowerCase())
    ? current
    : [...current, label];
}

function without(list: string[] | undefined, label: string): string[] {
  return (list ?? []).filter((x) => x.toLowerCase() !== label.toLowerCase());
}
