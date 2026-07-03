import Dexie, { type Table } from 'dexie';
import type { DocumentRecord, WorkspaceRecord, OrganizationRecord } from './records';

/**
 * The local-first store. IndexedDB via Dexie is the Milestone 1 storage engine;
 * a Tauri/SQLite adapter will implement the same repository ports later without
 * changing this file's consumers.
 *
 * Compound indexes power the two hot queries:
 *   [workspaceId+parentId]  → children of a page (tree building)
 *   [workspaceId+isArchived] → a workspace's active documents
 */
export class RnoteDatabase extends Dexie {
  documents!: Table<DocumentRecord, string>;
  workspaces!: Table<WorkspaceRecord, string>;
  organizations!: Table<OrganizationRecord, string>;

  constructor(name = 'rnote') {
    super(name);
    this.version(1).stores({
      documents: 'id, workspaceId, updatedAt, [workspaceId+parentId], [workspaceId+isArchived]',
      workspaces: 'id, createdAt',
    });
    // v2 — auto-organization. New table only; existing documents are untouched
    // and get an organization record lazily on first analysis (no data migration
    // needed). MultiEntry (*) indexes power Smart Collection queries.
    this.version(2).stores({
      organizations:
        'docId, workspaceId, intent, contentHash, *categories, *projects, *people, *places, *tags',
    });
  }
}

let singleton: RnoteDatabase | null = null;

/** Shared database instance for the running app. */
export function getDatabase(): RnoteDatabase {
  if (!singleton) singleton = new RnoteDatabase();
  return singleton;
}
