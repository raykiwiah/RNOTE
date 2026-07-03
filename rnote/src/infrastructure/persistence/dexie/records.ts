import type { RichDoc } from '@domain/blocks';
import type { DocumentOrganization } from '@domain/organization';

/**
 * Persistence records — the on-disk shape in IndexedDB. Deliberately decoupled
 * from domain entities so storage concerns (indexable types, migrations) never
 * bleed into the model.
 *
 * Notes:
 *  - `parentId` uses '' for root because IndexedDB cannot index `null`.
 *  - `isArchived` is 0|1 so it can participate in a compound index.
 */
export interface DocumentRecord {
  id: string;
  workspaceId: string;
  parentId: string;
  title: string;
  icon: string;
  content: RichDoc;
  position: number;
  isArchived: 0 | 1;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceRecord {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Derived organization metadata for a document, in its own table so writes never
 * clobber the document record and collections can query multiEntry indexes on
 * the label arrays. The top-level fields are the *resolved* labels (raw analysis
 * with user overrides applied); `raw` keeps the pre-override analysis and
 * `pinned`/`removed` the user's edits, so re-analysis never undoes a manual edit.
 */
export interface OrganizationRecord extends DocumentOrganization {
  docId: string;
  workspaceId: string;
  raw: DocumentOrganization;
  pinned: Record<string, string[]>;
  removed: Record<string, string[]>;
}

export const ROOT_PARENT = '';
