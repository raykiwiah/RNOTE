import { create } from 'zustand';
import { container } from '@/composition/container';
import type { StoredOrganization } from '@application/ports/OrganizationRepository';
import type { LabelField } from '@domain/organization';
import { extractText, type RichDoc } from '@domain/blocks';

const service = container.organization;

interface AnalyzeArgs {
  docId: string;
  workspaceId: string;
  title: string;
  content: RichDoc;
}

interface OrganizationState {
  byId: Record<string, StoredOrganization>;
  loaded: boolean;
  loadAll: (workspaceId: string) => Promise<void>;
  /** Analyze one document (heuristic) and cache the result. */
  analyzeDoc: (args: AnalyzeArgs) => Promise<void>;
  /** Analyze any documents that have no organization yet (background backfill). */
  backfill: (workspaceId: string, docs: Array<{ id: string; title: string }>) => Promise<void>;
  overrideLabel: (
    docId: string,
    field: LabelField,
    label: string,
    action: 'pin' | 'remove',
  ) => Promise<void>;
  forget: (docId: string) => void;
}

export const useOrganization = create<OrganizationState>((set, get) => ({
  byId: {},
  loaded: false,

  loadAll: async (workspaceId) => {
    const list = await service.list(workspaceId);
    const byId: Record<string, StoredOrganization> = {};
    for (const record of list) byId[record.docId] = record;
    set({ byId, loaded: true });
  },

  analyzeDoc: async ({ docId, workspaceId, title, content }) => {
    const text = extractText(content);
    const result = await service.analyze({ docId, workspaceId, title, text });
    if (result) set((s) => ({ byId: { ...s.byId, [docId]: result } }));
  },

  backfill: async (workspaceId, docs) => {
    const { byId } = get();
    for (const doc of docs) {
      if (byId[doc.id]) continue; // already organized
      const detail = await container.documents.getDocument(doc.id);
      if (!detail) continue;
      const result = await service.analyze({
        docId: doc.id,
        workspaceId,
        title: detail.title,
        text: extractText(detail.content),
      });
      if (result) set((s) => ({ byId: { ...s.byId, [doc.id]: result } }));
    }
  },

  overrideLabel: async (docId, field, label, action) => {
    const result = await service.override(docId, field, label, action);
    if (result) set((s) => ({ byId: { ...s.byId, [docId]: result } }));
  },

  forget: (docId) => {
    void service.remove(docId);
    set((s) => {
      const next = { ...s.byId };
      delete next[docId];
      return { byId: next };
    });
  },
}));
