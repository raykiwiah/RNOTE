import { DocumentService } from '@application/documents/DocumentService';
import { WorkspaceService } from '@application/workspace/WorkspaceService';
import { OrganizationService } from '@application/organization/OrganizationService';
import type { SearchIndexPort } from '@application/ports/SearchIndex';
import type { DocumentRepository } from '@application/ports/DocumentRepository';
import type { WorkspaceRepository } from '@application/ports/WorkspaceRepository';
import { getDatabase } from '@infrastructure/persistence/dexie/database';
import { DexieDocumentRepository } from '@infrastructure/persistence/dexie/DexieDocumentRepository';
import { DexieWorkspaceRepository } from '@infrastructure/persistence/dexie/DexieWorkspaceRepository';
import { DexieOrganizationRepository } from '@infrastructure/persistence/dexie/DexieOrganizationRepository';
import { TauriSqliteDocumentRepository } from '@infrastructure/persistence/sqlite/TauriSqliteDocumentRepository';
import { TauriSqliteWorkspaceRepository } from '@infrastructure/persistence/sqlite/TauriSqliteWorkspaceRepository';
import { FlexSearchIndex } from '@infrastructure/search/FlexSearchIndex';
import { SystemClock } from '@infrastructure/time/SystemClock';
import { isTauri } from '@infrastructure/platform';
import type { AiProvider } from '@application/ports/AiProvider';
import { readAiConfig, resolveModel, resolveKey } from '@infrastructure/ai/aiConfig';
import { createAiProvider } from '@infrastructure/ai/createAiProvider';

/**
 * The composition root — the *only* module that knows both the ports and their
 * concrete implementations. Wiring lives here so every other layer stays
 * dependency-inverted and testable. Swapping IndexedDB for SQLite/Tauri, or the
 * search engine, is a one-line change confined to this file.
 */
export interface Container {
  documents: DocumentService;
  workspaces: WorkspaceService;
  organization: OrganizationService;
  search: SearchIndexPort;
}

export function createContainer(): Container {
  const clock = new SystemClock();
  const search = new FlexSearchIndex();

  // Same ports, different adapter per platform: SQLite on the Tauri desktop
  // shell, IndexedDB in the browser. Nothing above this line changes.
  let documentRepository: DocumentRepository;
  let workspaceRepository: WorkspaceRepository;

  if (isTauri()) {
    documentRepository = new TauriSqliteDocumentRepository();
    workspaceRepository = new TauriSqliteWorkspaceRepository();
  } else {
    const db = getDatabase();
    documentRepository = new DexieDocumentRepository(db);
    workspaceRepository = new DexieWorkspaceRepository(db);
  }

  // Organization metadata always lives in IndexedDB (its own table), even on the
  // Tauri shell — documents may be in SQLite, but collections are a browser-side
  // query concern and this keeps the desktop path working without a SQLite port.
  const organizationRepository = new DexieOrganizationRepository(getDatabase());

  return {
    documents: new DocumentService(documentRepository, search, clock),
    workspaces: new WorkspaceService(workspaceRepository, clock),
    organization: new OrganizationService(organizationRepository),
    search,
  };
}

/** App-wide singleton container for the running client. */
export const container: Container = createContainer();

/**
 * Resolve the user's configured AI provider, or `null` when AI is off or no key
 * is set. Read lazily from local settings on every call so toggling AI in
 * Settings takes effect immediately. Every caller must handle the null
 * (degraded/offline) path — AI is always optional.
 *
 * @param opts.ignoreEnabled - build the provider even when the master toggle is
 *   off (used by the Settings "Test connection" button during setup).
 */
export function getAiProvider(opts?: { ignoreEnabled?: boolean }): AiProvider | null {
  const cfg = readAiConfig();
  if (!opts?.ignoreEnabled && !cfg.enabled) return null;
  const apiKey = resolveKey(cfg);
  if (!apiKey) return null;
  return createAiProvider({ id: cfg.provider, apiKey, model: resolveModel(cfg) });
}
