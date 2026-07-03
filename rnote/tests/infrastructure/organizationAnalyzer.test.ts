import { describe, it, expect } from 'vitest';
import type { AiProvider } from '@application/ports/AiProvider';
import { makeAiAnalyzer, type OrgContext } from '@infrastructure/ai/organizationAnalyzer';
import { ok, err } from '@domain/shared/Result';

const CTX: OrgContext = { projects: [], people: [], categories: [], corrections: [] };

function provider(complete: AiProvider['complete']): AiProvider {
  return { id: 'openai', complete };
}

describe('makeAiAnalyzer', () => {
  it('parses a fenced JSON completion into a validated organization', async () => {
    const analyze = makeAiAnalyzer(
      provider(async () => ok('```json\n{"categories":["Shopping"],"intent":"task","tags":["errand"]}\n```')),
      CTX,
    );
    const org = await analyze('', 'buy milk');
    expect(org?.categories).toEqual(['Shopping']);
    expect(org?.intent).toBe('task');
    expect(org?.source).toBe('ai');
  });

  it('sends known labels + corrections in the system prompt', async () => {
    let systemPrompt = '';
    const analyze = makeAiAnalyzer(
      provider(async (req) => {
        systemPrompt = req.messages.find((m) => m.role === 'system')?.content ?? '';
        return ok('{"categories":["Work"]}');
      }),
      { projects: ['Patoty Scents'], people: ['Godwin'], categories: ['Work'], corrections: [{ label: 'Spam', kind: 'categories', action: 'removed' }] },
    );
    await analyze('t', 'x');
    expect(systemPrompt).toContain('Patoty Scents');
    expect(systemPrompt).toContain('Godwin');
    expect(systemPrompt).toContain('Spam');
  });

  it('returns null when the provider fails (degrades to heuristics)', async () => {
    const analyze = makeAiAnalyzer(
      provider(async () => err({ code: 'ai.network', message: 'offline' })),
      CTX,
    );
    expect(await analyze('', 'x')).toBeNull();
  });

  it('returns null on unparseable output', async () => {
    const analyze = makeAiAnalyzer(provider(async () => ok('I could not do that')), CTX);
    expect(await analyze('', 'x')).toBeNull();
  });
});
