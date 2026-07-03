import { create } from 'zustand';
import type { RichDoc, RichNode } from '@domain/blocks';
import type { DocumentDetail, DocumentSummary, DocumentTreeNode } from '@application/dto';
import type { WorkspaceBackup } from '@application/documents/backup';
import type { SearchHit } from '@application/ports/SearchIndex';
import { container } from '@/composition/container';
import { useGameStats } from './gameStats';
import { useOrganization } from './organization';
import type { CollectionKind } from '../lib/collections';
import { WELCOME_DOC } from './welcome';
import {
  TEMPLATES,
  todayNoteTitle,
  DAILY_TEMPLATE_ID,
  type PageTemplate,
} from '../templates/templates';

interface WorkspaceState {
  status: 'idle' | 'loading' | 'ready';
  workspaceId: string | null;
  workspaceName: string;
  tree: DocumentTreeNode[];
  expanded: Record<string, boolean>;
  activeId: string | null;
  activeDoc: DocumentDetail | null;
  saving: boolean;
  archived: DocumentSummary[];
  view: 'home' | 'document' | 'collection';
  activeCollection: { kind: CollectionKind; label: string } | null;

  bootstrap: () => Promise<void>;
  refreshTree: () => Promise<void>;
  open: (id: string) => Promise<void>;
  showHome: () => void;
  openCollection: (kind: CollectionKind, label: string) => void;
  createDocument: (parentId?: string | null) => Promise<string | null>;
  createFromTemplate: (template: PageTemplate) => Promise<void>;
  /** Append a thought to the 📥 Inbox (creating it on first use) without navigating; returns its id. */
  quickCapture: (text: string) => Promise<string | null>;
  openToday: () => Promise<void>;
  rename: (id: string, title: string) => Promise<void>;
  setIcon: (id: string, icon: string) => Promise<void>;
  saveContent: (id: string, content: RichDoc) => Promise<void>;
  archive: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  move: (id: string, parentId: string | null, position: number) => Promise<void>;
  restore: (id: string) => Promise<void>;
  loadArchived: () => Promise<void>;
  buildBackup: () => Promise<WorkspaceBackup>;
  restoreBackup: (backup: WorkspaceBackup) => Promise<number>;
  toggleExpanded: (id: string) => void;
  search: (query: string) => SearchHit[];
}

const { documents, workspaces } = container;

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  status: 'idle',
  workspaceId: null,
  workspaceName: '',
  tree: [],
  expanded: {},
  activeId: null,
  activeDoc: null,
  saving: false,
  archived: [],
  view: 'home',
  activeCollection: null,

  bootstrap: async () => {
    if (get().status !== 'idle') return;
    set({ status: 'loading' });

    const workspace = await workspaces.ensureDefault();
    await documents.reindexWorkspace(workspace.id);
    set({ workspaceId: workspace.id, workspaceName: workspace.name });

    let tree = await documents.listTree(workspace.id);

    // First run: seed a welcoming page so the workspace is never empty.
    if (tree.length === 0) {
      const created = await documents.createDocument({
        workspaceId: workspace.id,
        title: 'Welcome to RNOTE',
        icon: '👋',
      });
      if (created.ok) {
        await documents.updateContent(created.value.id, WELCOME_DOC);
        tree = await documents.listTree(workspace.id);
      }
    }

    // Land on the Home dashboard rather than auto-opening a page.
    set({ tree, status: 'ready', view: 'home' });

    // Count today's visit toward the daily streak.
    useGameStats.getState().checkIn();

    // Load cached organization, then backfill any not-yet-analyzed docs so
    // Smart Collections populate immediately (offline heuristics, in background).
    const orgStore = useOrganization.getState();
    void orgStore.loadAll(workspace.id).then(() => {
      const flat = flattenTree(get().tree).map((n) => ({ id: n.id, title: n.title }));
      void orgStore.backfill(workspace.id, flat);
    });
  },

  refreshTree: async () => {
    const { workspaceId } = get();
    if (!workspaceId) return;
    set({ tree: await documents.listTree(workspaceId) });
  },

  open: async (id) => {
    const detail = await documents.getDocument(id);
    if (!detail) return;
    // Expand the ancestor chain so the opened page is visible in the tree.
    const path = findPath(get().tree, id) ?? [];
    const expanded = { ...get().expanded };
    for (const ancestor of path) expanded[ancestor] = true;
    set({ activeId: id, activeDoc: detail, expanded, view: 'document' });
  },

  showHome: () => set({ view: 'home' }),

  openCollection: (kind, label) => set({ view: 'collection', activeCollection: { kind, label } }),

  createDocument: async (parentId = null) => {
    const { workspaceId } = get();
    if (!workspaceId) return null;

    const created = await documents.createDocument({ workspaceId, parentId });
    if (!created.ok) return null;

    await get().refreshTree();
    if (parentId) set({ expanded: { ...get().expanded, [parentId]: true } });
    await get().open(created.value.id);
    useGameStats.getState().recordAction('page');
    return created.value.id;
  },

  createFromTemplate: async (template) => {
    const { workspaceId } = get();
    if (!workspaceId) return;
    const { title, icon, content } = template.create();
    const created = await documents.createDocument({ workspaceId, title, icon, content });
    if (!created.ok) return;
    await get().refreshTree();
    await get().open(created.value.id);
    useGameStats.getState().recordAction('template');
    void useOrganization.getState().analyzeDoc({ docId: created.value.id, workspaceId, title, content });
  },

  quickCapture: async (rawText) => {
    const text = rawText.trim();
    const { workspaceId } = get();
    if (!text || !workspaceId) return null;

    // Append to a single "Inbox" page (created on first capture) without
    // navigating away — the essence of frictionless capture.
    const summaries = await documents.listSummaries(workspaceId);
    let inboxId = summaries.find((s) => s.title === 'Inbox')?.id;
    if (!inboxId) {
      const created = await documents.createDocument({
        workspaceId,
        title: 'Inbox',
        icon: '📥',
        content: emptyInbox(),
      });
      if (!created.ok) return null;
      inboxId = created.value.id;
    }

    const detail = await documents.getDocument(inboxId);
    if (!detail) return null;
    const updated = appendCapture(detail.content, text);
    await documents.updateContent(inboxId, updated);
    await get().refreshTree();
    if (get().activeId === inboxId) await get().open(inboxId);
    useGameStats.getState().recordAction('capture');
    void useOrganization.getState().analyzeDoc({ docId: inboxId, workspaceId, title: 'Inbox', content: updated });
    return inboxId;
  },

  openToday: async () => {
    const { workspaceId } = get();
    if (!workspaceId) return;
    const title = todayNoteTitle();
    const summaries = await documents.listSummaries(workspaceId);
    const existing = summaries.find((s) => s.title === title);
    if (existing) {
      await get().open(existing.id);
      return;
    }
    const daily = TEMPLATES.find((t) => t.id === DAILY_TEMPLATE_ID);
    if (daily) await get().createFromTemplate(daily);
  },

  rename: async (id, title) => {
    const result = await documents.renameDocument(id, title);
    if (!result.ok) return;
    set((state) => ({
      tree: patchTree(state.tree, id, { title: result.value.title }),
      activeDoc:
        state.activeDoc?.id === id
          ? { ...state.activeDoc, title: result.value.title }
          : state.activeDoc,
    }));
  },

  setIcon: async (id, icon) => {
    const result = await documents.setIcon(id, icon);
    if (!result.ok) return;
    set((state) => ({
      tree: patchTree(state.tree, id, { icon }),
      activeDoc: state.activeDoc?.id === id ? { ...state.activeDoc, icon } : state.activeDoc,
    }));
  },

  saveContent: async (id, content) => {
    set({ saving: true });
    const result = await documents.updateContent(id, content);
    if (result.ok) {
      const summary: DocumentSummary = result.value;
      set((state) => ({ tree: patchTree(state.tree, id, { preview: summary.preview }) }));
    }
    set({ saving: false });

    // Re-derive organization from the new content (skips if the hash is unchanged).
    const { workspaceId, activeDoc } = get();
    if (workspaceId) {
      const title = activeDoc?.id === id ? activeDoc.title : '';
      void useOrganization.getState().analyzeDoc({ docId: id, workspaceId, title, content });
    }
  },

  archive: async (id) => {
    await documents.archiveDocument(id);
    await get().refreshTree();
    if (get().activeId === id || !nodeExists(get().tree, get().activeId)) {
      const next = get().tree[0];
      if (next) await get().open(next.id);
      else set({ activeId: null, activeDoc: null });
    }
  },

  remove: async (id) => {
    await documents.deleteDocument(id);
    useOrganization.getState().forget(id);
    await Promise.all([get().refreshTree(), get().loadArchived()]);
    if (!nodeExists(get().tree, get().activeId)) {
      const next = get().tree[0];
      if (next) await get().open(next.id);
      else set({ activeId: null, activeDoc: null });
    }
  },

  move: async (id, parentId, position) => {
    const result = await documents.moveDocument(id, parentId, position);
    if (result.ok) await get().refreshTree();
  },

  restore: async (id) => {
    await documents.restoreDocument(id);
    await Promise.all([get().refreshTree(), get().loadArchived()]);
    await get().open(id);
  },

  loadArchived: async () => {
    const { workspaceId } = get();
    if (!workspaceId) return;
    set({ archived: await documents.listArchived(workspaceId) });
  },

  buildBackup: async () => {
    const { workspaceId, workspaceName } = get();
    const docs = workspaceId ? await documents.exportDocuments(workspaceId) : [];
    return {
      format: 'rnote.backup' as const,
      version: 1 as const,
      exportedAt: Date.now(),
      workspaceName,
      documents: docs,
    };
  },

  restoreBackup: async (backup) => {
    const { workspaceId } = get();
    if (!workspaceId) return 0;
    const result = await documents.importDocuments(workspaceId, backup.documents);
    await get().refreshTree();
    return result.ok ? result.value : 0;
  },

  toggleExpanded: (id) =>
    set((state) => ({ expanded: { ...state.expanded, [id]: !state.expanded[id] } })),

  search: (query) => {
    const { workspaceId } = get();
    if (!workspaceId) return [];
    return documents.searchDocuments(workspaceId, query);
  },
}));

// ── Quick-capture helpers (pure) ─────────────────────────────────────────────
function emptyInbox(): RichDoc {
  return {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Inbox' }] },
      { type: 'taskList', content: [] },
    ],
  };
}

/** Append a captured line as a new unchecked task to the doc's task list. */
function appendCapture(doc: RichDoc, text: string): RichDoc {
  const item: RichNode = {
    type: 'taskItem',
    attrs: { checked: false },
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  };
  const content: RichNode[] = [...(doc.content ?? [])];
  const index = content.findIndex((n) => n.type === 'taskList');
  const list = index >= 0 ? content[index] : undefined;
  if (list) {
    content[index] = { ...list, content: [...(list.content ?? []), item] };
  } else {
    content.push({ type: 'taskList', content: [item] });
  }
  return { type: 'doc', content };
}

// ── Tree helpers (pure) ──────────────────────────────────────────────────────
function flattenTree(tree: DocumentTreeNode[]): DocumentTreeNode[] {
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

function patchTree(
  tree: DocumentTreeNode[],
  id: string,
  patch: Partial<DocumentTreeNode>,
): DocumentTreeNode[] {
  return tree.map((node) => {
    if (node.id === id) return { ...node, ...patch };
    if (node.children.length > 0) return { ...node, children: patchTree(node.children, id, patch) };
    return node;
  });
}

/** Ancestor ids of `id` (root-first), or null when `id` is not in the tree. */
function findPath(tree: DocumentTreeNode[], id: string, trail: string[] = []): string[] | null {
  for (const node of tree) {
    if (node.id === id) return trail;
    const found = findPath(node.children, id, [...trail, node.id]);
    if (found) return found;
  }
  return null;
}

function nodeExists(tree: DocumentTreeNode[], id: string | null): boolean {
  if (!id) return false;
  for (const node of tree) {
    if (node.id === id) return true;
    if (nodeExists(node.children, id)) return true;
  }
  return false;
}
