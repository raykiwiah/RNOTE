import type { DocumentOrganization } from '@domain/organization';

/**
 * A document's persisted organization: the resolved labels (top-level, from
 * `DocumentOrganization`), the pre-override `raw` analysis, and the user's
 * `pinned`/`removed` edits keyed by label field.
 */
export interface StoredOrganization extends DocumentOrganization {
  docId: string;
  workspaceId: string;
  raw: DocumentOrganization;
  pinned: Record<string, string[]>;
  removed: Record<string, string[]>;
}

export interface OrganizationRepository {
  get(docId: string): Promise<StoredOrganization | null>;
  listByWorkspace(workspaceId: string): Promise<StoredOrganization[]>;
  put(record: StoredOrganization): Promise<void>;
  delete(docId: string): Promise<void>;
}
