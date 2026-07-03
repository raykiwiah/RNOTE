import { describe, it, expect } from 'vitest';
import type { AiProvider } from '@application/ports/AiProvider';
import { makeRecapAnalyzer, makeTimelineAsk } from '@infrastructure/ai/recapAnalyzer';
import { ok, err } from '@domain/shared/Result';

function provider(complete: AiProvider['complete']): AiProvider {
  return { id: 'openai', complete };
}

describe('makeRecapAnalyzer', () => {
  it('parses a provider JSON recap', async () => {
    const analyze = makeRecapAnalyzer(
      provider(async () =>
        ok('{"focus":["ship"],"mood":{"overall":"focused","note":"n"},"highlights":["h"]}'),
      ),
    );
    const recap = await analyze('July 2026', 'digest');
    expect(recap?.focus).toEqual(['ship']);
    expect(recap?.mood.overall).toBe('focused');
  });

  it('returns null on provider error (degrades to the statistical digest)', async () => {
    const analyze = makeRecapAnalyzer(provider(async () => err({ code: 'ai.network', message: 'x' })));
    expect(await analyze('m', 'd')).toBeNull();
  });
});

describe('makeTimelineAsk', () => {
  it('returns a trimmed answer', async () => {
    const ask = makeTimelineAsk(provider(async () => ok('  You were busy shipping.  ')));
    expect(await ask('what did I do', 'digest', '2026-07-03')).toBe('You were busy shipping.');
  });

  it('returns null on error', async () => {
    const ask = makeTimelineAsk(provider(async () => err({ code: 'ai.timeout', message: 'x' })));
    expect(await ask('q', 'd', '2026-07-03')).toBeNull();
  });
});
