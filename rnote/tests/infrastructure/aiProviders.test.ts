import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { AnthropicProvider } from '@infrastructure/ai/providers/AnthropicProvider';
import { OpenAiProvider } from '@infrastructure/ai/providers/OpenAiProvider';
import { GeminiProvider } from '@infrastructure/ai/providers/GeminiProvider';
import { OpenRouterProvider } from '@infrastructure/ai/providers/OpenRouterProvider';
import { CONNECTIVITY_KEY } from '@infrastructure/net/connectivity';

// Providers only run when the app is Online, so opt in for these HTTP tests
// (the network guard otherwise short-circuits before fetch).
beforeEach(() => localStorage.setItem(CONNECTIVITY_KEY, 'online'));

function mockFetch(response: { ok: boolean; status?: number; json?: unknown; text?: string }): ReturnType<typeof vi.fn> {
  const fn = vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status ?? 200,
    json: async () => response.json,
    text: async () => response.text ?? '',
  });
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

function lastBody(fn: ReturnType<typeof vi.fn>): Record<string, unknown> {
  const init = fn.mock.calls[0]![1] as { body: string };
  return JSON.parse(init.body) as Record<string, unknown>;
}
function lastUrl(fn: ReturnType<typeof vi.fn>): string {
  return fn.mock.calls[0]![0] as string;
}
function lastHeaders(fn: ReturnType<typeof vi.fn>): Record<string, string> {
  const init = fn.mock.calls[0]![1] as { headers: Record<string, string> };
  return init.headers;
}

afterEach(() => vi.restoreAllMocks());

describe('AnthropicProvider', () => {
  it('splits the system prompt, sets browser header, and extracts text', async () => {
    const fn = mockFetch({ ok: true, json: { content: [{ type: 'text', text: 'Hello' }] } });
    const provider = new AnthropicProvider({ apiKey: 'sk-ant', model: 'claude-haiku-4-5' });
    const res = await provider.complete({
      messages: [
        { role: 'system', content: 'Be terse' },
        { role: 'user', content: 'Hi' },
      ],
    });
    expect(res.ok && res.value).toBe('Hello');
    expect(lastUrl(fn)).toBe('https://api.anthropic.com/v1/messages');
    expect(lastHeaders(fn)['x-api-key']).toBe('sk-ant');
    expect(lastHeaders(fn)['anthropic-dangerous-direct-browser-access']).toBe('true');
    const body = lastBody(fn);
    expect(body.system).toBe('Be terse');
    expect(body.model).toBe('claude-haiku-4-5');
    expect(body.messages).toEqual([{ role: 'user', content: 'Hi' }]);
  });
});

describe('OpenAiProvider', () => {
  it('requests a JSON object when hinted and extracts message content', async () => {
    const fn = mockFetch({ ok: true, json: { choices: [{ message: { content: '{"ok":true}' } }] } });
    const provider = new OpenAiProvider({ apiKey: 'sk-oai', model: 'gpt-4o-mini' });
    const res = await provider.complete({
      messages: [{ role: 'user', content: 'Hi' }],
      jsonSchemaHint: '{...}',
    });
    expect(res.ok && res.value).toBe('{"ok":true}');
    expect(lastUrl(fn)).toBe('https://api.openai.com/v1/chat/completions');
    expect(lastHeaders(fn).authorization).toBe('Bearer sk-oai');
    expect(lastBody(fn).response_format).toEqual({ type: 'json_object' });
  });

  it('maps 401 to ai.unauthorized and 429 to ai.rate-limited', async () => {
    mockFetch({ ok: false, status: 401, text: 'nope' });
    const provider = new OpenAiProvider({ apiKey: 'bad', model: 'gpt-4o-mini' });
    const unauth = await provider.complete({ messages: [{ role: 'user', content: 'Hi' }] });
    expect(unauth.ok).toBe(false);
    if (!unauth.ok) expect(unauth.error.code).toBe('ai.unauthorized');

    mockFetch({ ok: false, status: 429, text: 'slow down' });
    const limited = await provider.complete({ messages: [{ role: 'user', content: 'Hi' }] });
    if (!limited.ok) expect(limited.error.code).toBe('ai.rate-limited');
  });
});

describe('GeminiProvider', () => {
  it('maps roles to user/model, moves system to systemInstruction, extracts parts', async () => {
    const fn = mockFetch({ ok: true, json: { candidates: [{ content: { parts: [{ text: 'G' }] } }] } });
    const provider = new GeminiProvider({ apiKey: 'k', model: 'gemini-2.0-flash' });
    const res = await provider.complete({
      messages: [
        { role: 'system', content: 'S' },
        { role: 'assistant', content: 'A' },
        { role: 'user', content: 'U' },
      ],
    });
    expect(res.ok && res.value).toBe('G');
    expect(lastUrl(fn)).toContain('/models/gemini-2.0-flash:generateContent?key=k');
    const body = lastBody(fn);
    expect(body.systemInstruction).toEqual({ parts: [{ text: 'S' }] });
    expect(body.contents).toEqual([
      { role: 'model', parts: [{ text: 'A' }] },
      { role: 'user', parts: [{ text: 'U' }] },
    ]);
  });
});

describe('OpenRouterProvider', () => {
  it('is OpenAI-shaped and extracts message content', async () => {
    const fn = mockFetch({ ok: true, json: { choices: [{ message: { content: 'OR' } }] } });
    const provider = new OpenRouterProvider({ apiKey: 'or', model: 'anthropic/claude-3.5-haiku' });
    const res = await provider.complete({ messages: [{ role: 'user', content: 'Hi' }] });
    expect(res.ok && res.value).toBe('OR');
    expect(lastUrl(fn)).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(lastHeaders(fn).authorization).toBe('Bearer or');
  });
});
