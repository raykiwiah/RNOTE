import { create } from 'zustand';
import { container, getAiProvider } from '@/composition/container';
import type { StoredOrganization } from '@application/ports/OrganizationRepository';
import type { LabelField } from '@domain/organization';
import { extractText, type RichDoc } from '@domain/blocks';
import { makeAiAnalyzer, type OrgContext } from '@infrastructure/ai/organizationAnalyzer';
import { useAiSettings } from './aiSettings';
import { topCorrections, recordCorrection } from '../lib/corrections';

const service = container.organization;

// AI analysis is debounced and cancellable per document so typing never blocks
// on a model call and superseded requests abort.
const AI_DEBOUNCE_MS = 4000;
const aiTimers: Record<string, ReturnType<typeof setTimeout>> = {};
const aiAborts: Record<string, AbortController> = {};

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
  analyzeDoc: (args: AnalyzeArgs) => Promise<void>;
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
    // Instant heuristic pass so chips + collections update immediately.
    const base = await service.analyze({ docId, workspaceId, title, text });
    if (base) set((s) => ({ byId: { ...s.byId, [docId]: base } }));

    // Debounced AI upgrade when the user has it on (never blocks typing).
    const ai = useAiSettings.getState();
    if (!(ai.enabled && ai.autoOrganize)) return;
    clearTimeout(aiTimers[docId]);
    aiTimers[docId] = setTimeout(() => {
      void runAiAnalysis({ docId, workspaceId, title, text });
    }, AI_DEBOUNCE_MS);
  },

  backfill: async (workspaceId, docs) => {
    for (const doc of docs) {
      if (get().byId[doc.id]) continue; // already organized
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
    recordCorrection(field, label, action === 'remove' ? 'removed' : 'pinned');
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

/** Run the (cancellable) AI analysis and replace the doc's organization. */
async function runAiAnalysis(input: {
  docId: string;
  workspaceId: string;
  title: string;
  text: string;
}): Promise<void> {
  const provider = getAiProvider();
  if (!provider) return;
  aiAborts[input.docId]?.abort();
  const controller = new AbortController();
  aiAborts[input.docId] = controller;
  const analyzer = makeAiAnalyzer(provider, buildContext(useOrganization.getState().byId), controller.signal);
  const result = await service.analyze(
    { docId: input.docId, workspaceId: input.workspaceId, title: input.title, text: input.text },
    { analyzer, force: true },
  );
  if (result && !controller.signal.aborted) {
    useOrganization.setState((s) => ({ byId: { ...s.byId, [input.docId]: result } }));
  }
}

/** Known labels + recent corrections, to steer the model toward consistency. */
function buildContext(byId: Record<string, StoredOrganization>): OrgContext {
  const projects = new Set<string>();
  const people = new Set<string>();
  const categories = new Set<string>();
  for (const org of Object.values(byId)) {
    org.projects.forEach((p) => projects.add(p));
    org.people.forEach((p) => people.add(p));
    org.categories.forEach((c) => categories.add(c));
  }
  return {
    projects: [...projects].slice(0, 30),
    people: [...people].slice(0, 30),
    categories: [...categories].slice(0, 30),
    corrections: topCorrections(20),
  };
}
