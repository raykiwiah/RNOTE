import type {
  OrganizationRepository,
  StoredOrganization,
} from '@application/ports/OrganizationRepository';
import type { RnoteDatabase } from './database';
import type { OrganizationRecord } from './records';

/**
 * IndexedDB-backed organization store. `OrganizationRecord` and
 * `StoredOrganization` are structurally identical, so no field mapping is
 * needed — the multiEntry indexes on the label arrays do the query work.
 */
export class DexieOrganizationRepository implements OrganizationRepository {
  constructor(private readonly db: RnoteDatabase) {}

  async get(docId: string): Promise<StoredOrganization | null> {
    const record = await this.db.organizations.get(docId);
    return record ?? null;
  }

  async listByWorkspace(workspaceId: string): Promise<StoredOrganization[]> {
    return this.db.organizations.where('workspaceId').equals(workspaceId).toArray();
  }

  async put(record: StoredOrganization): Promise<void> {
    await this.db.organizations.put(record as OrganizationRecord);
  }

  async delete(docId: string): Promise<void> {
    await this.db.organizations.delete(docId);
  }
}
