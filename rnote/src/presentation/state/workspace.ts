import { create } from 'zustand';
import type { RichDoc } from '@domain/blocks';
import type { DocumentDetail, DocumentSummary, DocumentTreeNode } from '@application/dto';
import type { SearchHit } from '@application/ports/SearchIndex';
import { container } from '@/composition/container';
import { WELCOME_DOC } from './welcome';

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

  bootstrap: () => Promise<void>;
  refreshTree: () => Promise<void>;
  open: (id: string) => Promise<void>;
  createDocument: (parentId?: string | null) => Promise<string | null>;
  rename: (id: string, title: string) => Promise<void>;
  setIcon: (id: string, icon: string) => Promise<void>;
  saveContent: (id: string, content: RichDoc) => Promise<void>;
  archive: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  move: (id: string, parentId: string | null, position: number) => Promise<void>;
  restore: (id: string) => Promise<void>;
  loadArchived: () => Promise<void>;
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

    set({ tree, status: 'ready' });
    const first = tree[0];
    if (first) await get().open(first.id);
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
    set({ activeId: id, activeDoc: detail, expanded });
  },

  createDocument: async (parentId = null) => {
    const { workspaceId } = get();
    if (!workspaceId) return null;

    const created = await documents.createDocument({ workspaceId, parentId });
    if (!created.ok) return null;

    await get().refreshTree();
    if (parentId) set({ expanded: { ...get().expanded, [parentId]: true } });
    await get().open(created.value.id);
    return created.value.id;
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

  toggleExpanded: (id) =>
    set((state) => ({ expanded: { ...state.expanded, [id]: !state.expanded[id] } })),

  search: (query) => {
    const { workspaceId } = get();
    if (!workspaceId) return [];
    return documents.searchDocuments(workspaceId, query);
  },
}));

// ── Tree helpers (pure) ──────────────────────────────────────────────────────
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
