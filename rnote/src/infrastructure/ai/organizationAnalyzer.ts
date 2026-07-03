import type { AiProvider } from '@application/ports/AiProvider';
import { parseOrganization, type DocumentOrganization } from '@domain/organization';
import { parseJsonLoose } from './parseJson';

export interface OrgCorrection {
  label: string;
  kind: string;
  action: 'removed' | 'pinned';
}

export interface OrgContext {
  projects: string[];
  people: string[];
  categories: string[];
  corrections: OrgCorrection[];
}

/**
 * Build the AI organization analyzer — the richer base that
 * `OrganizationService.analyze` uses when the user has AI on. Returns null on
 * any failure so the service falls back to the offline heuristics.
 */
export function makeAiAnalyzer(
  provider: AiProvider,
  ctx: OrgContext,
  signal?: AbortSignal,
): (title: string, text: string) => Promise<DocumentOrganization | null> {
  return async (title, text) => {
    const res = await provider.complete(
      {
        messages: [
          { role: 'system', content: buildSystemPrompt(ctx) },
          { role: 'user', content: `Note title: ${title || '(untitled)'}\nNote text: ${text.slice(0, 2000)}` },
        ],
        jsonSchemaHint: 'DocumentOrganization JSON object',
        maxTokens: 500,
        temperature: 0,
      },
      signal,
    );
    if (!res.ok) return null;
    const parsed = parseJsonLoose(res.value);
    return parseOrganization(parsed, Date.now());
  };
}

function buildSystemPrompt(ctx: OrgContext): string {
  const list = (xs: string[]): string => (xs.length ? xs.join(', ') : 'none');
  const avoid = list(ctx.corrections.filter((c) => c.action === 'removed').map((c) => c.label));
  const prefer = list(ctx.corrections.filter((c) => c.action === 'pinned').map((c) => c.label));
  return [
    'You are the organization engine inside RNOTE, a personal notes app.',
    'Given one note, extract organization metadata. Reply with ONLY a JSON object:',
    '{"categories": string[] (1-3, Title Case, from or consistent with: Shopping, Business,',
    ' Personal, Finance, Work, Ideas, Health, Fitness, Travel, Family, School, Meetings,',
    ' Research, Journal, Recipes, Books, Investments — invent a new one only when clearly needed),',
    ' "projects": string[] (proper nouns that look like ongoing endeavours),',
    ' "people": string[] (personal names mentioned), "places": string[],',
    ' "tags": string[] (3-6, lowercase, single words or short phrases),',
    ' "intent": one of task|idea|journal|meeting|shopping|finance|research|goal|habit|reference|other,',
    ' "priority": low|medium|high|null, "dueHint": string|null (verbatim time phrase from the note),',
    ' "confidence": {label: 0..1 for every category/project/person you emitted}}',
    `Known projects: ${list(ctx.projects)}. Known people: ${list(ctx.people)}. Known categories: ${list(ctx.categories)}.`,
    'Prefer reusing known labels over inventing near-duplicates.',
    `Avoid these labels unless clearly warranted: ${avoid}. Prefer these when relevant: ${prefer}.`,
  ].join('\n');
}
