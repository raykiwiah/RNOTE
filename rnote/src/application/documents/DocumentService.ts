import { Document, DocumentContent, type DocumentId } from '@domain/documents';
import { idFrom } from '@domain/shared';
import type { Clock } from '@domain/shared';
import type { WorkspaceId } from '@domain/workspace';
import type { RichDoc } from '@domain/blocks';
import { ok, err, type Result, domainError } from '@domain/shared';
import type { DocumentRepository } from '../ports/DocumentRepository';
import type { SearchHit, SearchIndexPort } from '../ports/SearchIndex';
import type { DocumentDetail, DocumentSummary, DocumentTreeNode } from '../dto';
import { toDetail, toSummary, buildTree } from './mappers';

const docId = (id: string): DocumentId => idFrom<'Document'>(id);
const wsId = (id: string): WorkspaceId => idFrom<'Workspace'>(id);

export interface CreateDocumentCommand {
  workspaceId: string;
  parentId?: string | null;
  title?: string;
  icon?: string;
}

/**
 * DocumentService — the application's use cases for documents.
 *
 * Every method is a single, transaction-like unit: mutate the aggregate, persist
 * it, then keep the search index consistent. It returns `Result`/DTOs, never
 * throwing for expected failures and never leaking domain entities to the UI.
 */
export class DocumentService {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly search: SearchIndexPort,
    private readonly clock: Clock,
  ) {}

  async createDocument(command: CreateDocumentCommand): Promise<Result<DocumentDetail>> {
    const created = Document.create(
      {
        workspaceId: wsId(command.workspaceId),
        parentId: command.parentId ? docId(command.parentId) : null,
        title: command.title,
        icon: command.icon,
      },
      this.clock,
    );
    if (!created.ok) return created;

    const document = created.value;
    await this.documents.save(document);
    this.indexDocument(document);
    return ok(toDetail(document));
  }

  async getDocument(id: string): Promise<DocumentDetail | null> {
    const document = await this.documents.findById(docId(id));
    return document ? toDetail(document) : null;
  }

  async listSummaries(
    workspaceId: string,
    options?: { includeArchived?: boolean },
  ): Promise<DocumentSummary[]> {
    const docs = await this.documents.findByWorkspace(wsId(workspaceId), options);
    return docs.map(toSummary);
  }

  async listTree(workspaceId: string): Promise<DocumentTreeNode[]> {
    const summaries = await this.listSummaries(workspaceId);
    return buildTree(summaries);
  }

  /** Archived ("trashed") documents, most recently updated first. */
  async listArchived(workspaceId: string): Promise<DocumentSummary[]> {
    const docs = await this.documents.findByWorkspace(wsId(workspaceId), { includeArchived: true });
    return docs
      .filter((doc) => doc.isArchived)
      .map(toSummary)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async renameDocument(id: string, title: string): Promise<Result<DocumentSummary>> {
    const document = await this.documents.findById(docId(id));
    if (!document) return this.notFound();

    const renamed = document.rename(title, this.clock);
    if (!renamed.ok) return renamed;

    await this.documents.save(document);
    this.indexDocument(document);
    return ok(toSummary(document));
  }

  async setIcon(id: string, icon: string): Promise<Result<DocumentSummary>> {
    const document = await this.documents.findById(docId(id));
    if (!document) return this.notFound();
    document.changeIcon(icon, this.clock);
    await this.documents.save(document);
    return ok(toSummary(document));
  }

  async updateContent(id: string, content: RichDoc): Promise<Result<DocumentSummary>> {
    const document = await this.documents.findById(docId(id));
    if (!document) return this.notFound();

    const parsed = DocumentContent.fromJSON(content);
    if (!parsed.ok) return parsed;

    document.replaceContent(parsed.value, this.clock);
    await this.documents.save(document);
    this.indexDocument(document);
    return ok(toSummary(document));
  }

  async moveDocument(
    id: string,
    newParentId: string | null,
    position: number,
  ): Promise<Result<void>> {
    const document = await this.documents.findById(docId(id));
    if (!document) return this.notFound();

    if (newParentId && (await this.wouldCreateCycle(docId(id), docId(newParentId)))) {
      return err(
        domainError('document.cycle', 'Cannot move a document into one of its own descendants.'),
      );
    }

    const moved = document.moveTo(newParentId ? docId(newParentId) : null, position, this.clock);
    if (!moved.ok) return moved;

    await this.documents.save(document);
    return ok(undefined);
  }

  async archiveDocument(id: string): Promise<Result<void>> {
    const root = await this.documents.findById(docId(id));
    if (!root) return this.notFound();

    // Archive the whole subtree so nothing is orphaned in the tree view.
    const subtree = await this.collectSubtree(root);
    for (const document of subtree) {
      document.archive(this.clock);
      await this.documents.save(document);
      this.search.remove(document.id);
    }
    return ok(undefined);
  }

  async restoreDocument(id: string): Promise<Result<void>> {
    const document = await this.documents.findById(docId(id));
    if (!document) return this.notFound();

    // If the parent is gone or still archived, resurface at the root.
    if (document.parentId) {
      const parent = await this.documents.findById(document.parentId);
      if (!parent || parent.isArchived) {
        document.moveTo(null, document.position, this.clock);
      }
    }
    document.restore(this.clock);
    await this.documents.save(document);
    this.indexDocument(document);
    return ok(undefined);
  }

  async deleteDocument(id: string): Promise<Result<void>> {
    const root = await this.documents.findById(docId(id));
    if (!root) return this.notFound();

    const subtree = await this.collectSubtree(root);
    const ids = subtree.map((d) => d.id);
    await this.documents.deleteMany(ids);
    for (const removedId of ids) this.search.remove(removedId);
    return ok(undefined);
  }

  searchDocuments(workspaceId: string, query: string, limit = 20): SearchHit[] {
    return this.search.search(workspaceId, query, limit);
  }

  /** Rebuild the in-memory search index from persistence (called on boot). */
  async reindexWorkspace(workspaceId: string): Promise<void> {
    const docs = await this.documents.findByWorkspace(wsId(workspaceId));
    for (const document of docs) this.indexDocument(document);
  }

  // ── Internals ──────────────────────────────────────────────────────────────
  private indexDocument(document: Document): void {
    if (document.isArchived) {
      this.search.remove(document.id);
      return;
    }
    this.search.upsert({
      id: document.id,
      workspaceId: document.workspaceId,
      title: document.displayTitle,
      body: document.content.toPlainText(),
    });
  }

  private async collectSubtree(root: Document): Promise<Document[]> {
    const result: Document[] = [root];
    const queue: Document[] = [root];
    while (queue.length > 0) {
      const current = queue.shift() as Document;
      const children = await this.documents.findChildren(current.workspaceId, current.id);
      for (const child of children) {
        result.push(child);
        queue.push(child);
      }
    }
    return result;
  }

  private async wouldCreateCycle(
    movingId: DocumentId,
    targetParentId: DocumentId,
  ): Promise<boolean> {
    let cursor: DocumentId | null = targetParentId;
    const guard = new Set<string>();
    while (cursor) {
      if (cursor === movingId) return true;
      if (guard.has(cursor)) return true; // defensive against pre-existing corruption
      guard.add(cursor);
      const parent: Document | null = await this.documents.findById(cursor);
      cursor = parent ? parent.parentId : null;
    }
    return false;
  }

  private notFound(): Result<never> {
    return err(domainError('document.not-found', 'Document not found.'));
  }
}
