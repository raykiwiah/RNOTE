import { describe, it, expect } from 'vitest';
import {
  analyzeHeuristically,
  emptyOrganization,
  applyOverrides,
  isIntent,
  clampConfidence,
  hashContent,
  parseOrganization,
} from '@domain/organization';

describe('heuristic organization', () => {
  it('files a purchase as Shopping + task', () => {
    const o = analyzeHeuristically('', 'buy oat milk', 1000);
    expect(o.categories).toContain('Shopping');
    expect(o.tags).toContain('shopping');
    expect(o.intent).toBe('task');
    expect(o.source).toBe('heuristic');
    expect(o.analyzedAt).toBe(1000);
  });

  it('detects Finance and a deadline with high priority', () => {
    const o = analyzeHeuristically('Pay electricity bill', 'invoice of $40 due by Friday', 0);
    expect(o.categories).toContain('Finance');
    expect(o.tags).toContain('finance');
    expect(o.intent).toBe('task'); // "Pay" is an action verb
    expect(o.dueHint).toMatch(/Friday/);
    expect(o.priority).toBe('high');
  });

  it('extracts people and a weekday due-hint from a meeting note', () => {
    const o = analyzeHeuristically('', 'Meeting with Miriam about the budget on Friday', 0);
    expect(o.categories).toEqual(expect.arrayContaining(['Meetings', 'Finance']));
    expect(o.people).toContain('Miriam');
    expect(o.dueHint).toBe('on Friday');
    expect(o.priority).toBe('high');
    expect(o.intent).toBe('meeting');
  });

  it('recognises a journal entry', () => {
    const o = analyzeHeuristically('', 'Today I feel grateful for my family', 0);
    expect(o.categories).toContain('Journal');
    expect(o.intent).toBe('journal');
  });

  it('honours the AI-off acceptance: order … before meeting → Shopping + task', () => {
    const o = analyzeHeuristically(
      'Errand',
      'Need to order perfume bottles for Patoty Scents before meeting Godwin',
      0,
    );
    expect(o.categories).toContain('Shopping');
    expect(o.intent).toBe('task');
    expect(o.people).toContain('Godwin');
    expect(o.people).not.toContain('Patoty'); // "for X" must not be treated as a person
    expect(o.dueHint).toMatch(/before/i);
  });

  it('emits nothing for an unremarkable note', () => {
    const o = analyzeHeuristically('Random note', 'nothing special here', 0);
    expect(o.categories).toEqual([]);
    expect(o.people).toEqual([]);
    expect(o.intent).toBe('other');
    expect(o.priority).toBeNull();
    expect(o.dueHint).toBeNull();
  });
});

describe('organization value object', () => {
  it('hashes content stably and sensitively', () => {
    expect(hashContent('T', 'hello')).toBe(hashContent('T', 'hello'));
    expect(hashContent('T', 'hello')).not.toBe(hashContent('T', 'world'));
  });

  it('validates intents and clamps confidence', () => {
    expect(isIntent('task')).toBe(true);
    expect(isIntent('nope')).toBe(false);
    expect(clampConfidence({ a: 1.4, b: -0.2, c: 0.5, d: NaN })).toEqual({ a: 1, b: 0, c: 0.5 });
  });

  it('lets user overrides win and marks the source', () => {
    const base = { ...emptyOrganization(), categories: ['Shopping', 'Work'] };
    const merged = applyOverrides(base, {
      pinned: { categories: ['Personal'] },
      removed: { categories: ['Work'] },
    });
    expect(merged.categories).toEqual(['Personal', 'Shopping']);
    expect(merged.source).toBe('user');
  });

  it('is a no-op (keeps source) when there are no overrides', () => {
    const base = { ...emptyOrganization(), categories: ['Shopping'], source: 'heuristic' as const };
    const merged = applyOverrides(base, {});
    expect(merged.categories).toEqual(['Shopping']);
    expect(merged.source).toBe('heuristic');
  });
});

describe('parseOrganization (AI response validation)', () => {
  it('coerces, title-cases, lowercases tags and clamps confidence', () => {
    const o = parseOrganization(
      {
        categories: ['shopping', 'WORK'],
        projects: ['Patoty Scents'],
        people: ['Godwin'],
        tags: ['Perfume', 'ERRAND'],
        intent: 'task',
        priority: 'high',
        dueHint: 'before Friday',
        confidence: { Shopping: 1.5, Work: 0.2 },
      },
      5,
    );
    expect(o).not.toBeNull();
    expect(o?.categories).toEqual(['Shopping', 'Work']);
    expect(o?.tags).toEqual(['perfume', 'errand']);
    expect(o?.people).toEqual(['Godwin']);
    expect(o?.priority).toBe('high');
    expect(o?.confidence.Shopping).toBe(1);
    expect(o?.source).toBe('ai');
    expect(o?.analyzedAt).toBe(5);
  });

  it('rejects non-objects and falls back on unknown intent', () => {
    expect(parseOrganization('nope', 0)).toBeNull();
    expect(parseOrganization(null, 0)).toBeNull();
    expect(parseOrganization({ intent: 'banana' }, 0)?.intent).toBe('other');
  });
});
