import type { AiProvider } from '@application/ports/AiProvider';
import { parseRecap, type Recap } from '@domain/timeline';
import { parseJsonLoose } from './parseJson';

/** Warm, evidence-based month recap. Returns null on any failure. */
export function makeRecapAnalyzer(
  provider: AiProvider,
): (periodLabel: string, digest: string, signal?: AbortSignal) => Promise<Recap | null> {
  return async (periodLabel, digest, signal) => {
    const res = await provider.complete(
      {
        messages: [
          { role: 'system', content: recapSystem(periodLabel) },
          { role: 'user', content: `Digest: ${digest.slice(0, 3000)}` },
        ],
        jsonSchemaHint: 'Recap JSON object',
        maxTokens: 600,
        temperature: 0.3,
      },
      signal,
    );
    if (!res.ok) return null;
    return parseRecap(parseJsonLoose(res.value));
  };
}

function recapSystem(periodLabel: string): string {
  return [
    `You are the memory engine of a personal notes app. Given this activity digest for ${periodLabel},`,
    'write a warm second-person recap. Reply ONLY JSON:',
    '{"focus": string[] (3-5 "You were focused on…" items),',
    ' "mood": {"overall": one of happy|motivated|stressed|burned-out|creative|focused|mixed,',
    '          "note": string (one sentence, evidence-based, no diagnosis)},',
    ' "highlights": string[] (3-5 concrete moments worth remembering),',
    ' "people": string[] (most present people),',
    ' "openLoops": string[] (things started but not finished)}',
    'Mood must be a light, evidence-based vibe from the language and volume — never clinical.',
  ].join('\n');
}

/** One-shot natural-language answer over a compact history digest. */
export function makeTimelineAsk(
  provider: AiProvider,
): (question: string, digest: string, today: string, signal?: AbortSignal) => Promise<string | null> {
  return async (question, digest, today, signal) => {
    const res = await provider.complete(
      {
        messages: [
          {
            role: 'system',
            content: `You are the memory of a personal notes app. Today is ${today}. Answer the user's question about their own history using ONLY the digest below. Be concise and warm (1-3 sentences). If the digest doesn't contain the answer, say so briefly.`,
          },
          { role: 'user', content: `Question: ${question}\n\nDigest:\n${digest.slice(0, 3000)}` },
        ],
        maxTokens: 300,
        temperature: 0.3,
      },
      signal,
    );
    if (!res.ok) return null;
    return res.value.trim() || null;
  };
}
