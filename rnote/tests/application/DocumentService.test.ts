import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentService } from '@application/documents/DocumentService';
import { FlexSearchIndex } from '@infrastructure/search/FlexSearchIndex';
import type { RichDoc } from '@domain/blocks';
import { FakeClock, InMemoryDocumentRepository } from '../support/fakes';

const WS = 'ws-1';
const body = (text: string): RichDoc => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

let repo: InMemoryDocumentRepository;
let service: DocumentService;

beforeEach(() => {
  repo = new InMemoryDocumentRepository();
  service = new DocumentService(repo, new FlexSearchIndex(), new FakeClock());
});

async function create(title: string, parentId: string | null = null): Promise<string> {
  const result = await service.createDocument({ workspaceId: WS, title, parentId });
  if (!result.ok) throw new Error(result.error.message);
  return result.value.id;
}

describe('DocumentService · tree', () => {
  it('nests children under their parent, ordered by position', async () => {
    const parent = await create('Parent');
    await create('Child B', parent);
    await create('Child A', parent);

    const tree = await service.listTree(WS);
    expect(tree).toHaveLength(1);
    expect(tree[0]?.title).toBe('Parent');
    expect(tree[0]?.children.map((c) => c.title)).toEqual(['Child B', 'Child A']);
  });
});

describe('DocumentService · move', () => {
  it('prevents moving a document into its own descendant', async () => {
    const a = await create('A');
    const b = await create('B', a);
    const result = await service.moveDocument(a, b, 0);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('document.cycle');
  });

  it('allows a legal move', async () => {
    const a = await create('A');
    const b = await create('B');
    expect((await service.moveDocument(b, a, 0)).ok).toBe(true);
    const tree = await service.listTree(WS);
    expect(tree).toHaveLength(1);
    expect(tree[0]?.children[0]?.title).toBe('B');
  });
});

describe('DocumentService · archive & delete cascade', () => {
  it('archives the whole subtree', async () => {
    const parent = await create('Parent');
    await create('Child', parent);
    await service.archiveDocument(parent);

    expect(await service.listTree(WS)).toHaveLength(0);
    expect(await service.listSummaries(WS, { includeArchived: true })).toHaveLength(2);
  });

  it('deletes the whole subtree', async () => {
    const parent = await create('Parent');
    await create('Child', parent);
    await service.deleteDocument(parent);
    expect(repo.size).toBe(0);
  });

  it('lists archived documents and restores a single page', async () => {
    const parent = await create('Parent');
    await create('Child', parent);
    await service.archiveDocument(parent);
    expect(await service.listArchived(WS)).toHaveLength(2);

    await service.restoreDocument(parent);
    expect((await service.listArchived(WS)).map((d) => d.title)).toEqual(['Child']);
    expect(await service.listTree(WS)).toHaveLength(1);
  });
});

describe('DocumentService · search', () => {
  it('finds documents by title and body, scoped to the workspace', async () => {
    const id = await create('Quantum Notes');
    await service.updateContent(id, body('entanglement and superposition'));
    await service.createDocument({ workspaceId: 'other-ws', title: 'Quantum Elsewhere' });

    const byTitle = service.searchDocuments(WS, 'quantum');
    expect(byTitle.map((h) => h.id)).toEqual([id]);

    const byBody = service.searchDocuments(WS, 'superposition');
    expect(byBody[0]?.id).toBe(id);
  });

  it('drops archived documents from the index', async () => {
    const id = await create('Findable');
    expect(service.searchDocuments(WS, 'findable')).toHaveLength(1);
    await service.archiveDocument(id);
    expect(service.searchDocuments(WS, 'findable')).toHaveLength(0);
  });
});
