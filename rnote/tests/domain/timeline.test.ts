import { describe, it, expect } from 'vitest';
import {
  buildChapters,
  periodStats,
  parseRecap,
  type ActivityKind,
  type TimelineEvent,
} from '@domain/timeline';

const ev = (at: number, kind: ActivityKind, docId = 'd'): TimelineEvent => ({
  at,
  kind,
  docId,
  title: 'T',
  snippet: '',
});

describe('buildChapters', () => {
  it('groups by month (newest first), then day (newest first)', () => {
    const jul3a = new Date('2026-07-03T10:00:00').getTime();
    const jul3b = new Date('2026-07-03T15:00:00').getTime();
    const jun1 = new Date('2026-06-01T09:00:00').getTime();
    const chapters = buildChapters([ev(jun1, 'created'), ev(jul3a, 'edited'), ev(jul3b, 'captured')]);

    expect(chapters.map((c) => c.label)).toEqual(['July 2026', 'June 2026']);
    expect(chapters[0]!.total).toBe(2);
    expect(chapters[0]!.days).toHaveLength(1);
    expect(chapters[0]!.days[0]!.events[0]!.at).toBe(jul3b); // newest first within the day
  });
});

describe('periodStats', () => {
  it('counts kinds, active days, and the busiest day', () => {
    const d1a = new Date('2026-07-03T10:00:00').getTime();
    const d1b = new Date('2026-07-03T12:00:00').getTime();
    const d2 = new Date('2026-07-04T10:00:00').getTime();
    const s = periodStats([ev(d1a, 'created'), ev(d1b, 'edited'), ev(d2, 'captured')]);

    expect(s.created).toBe(1);
    expect(s.edited).toBe(1);
    expect(s.captured).toBe(1);
    expect(s.total).toBe(3);
    expect(s.activeDays).toBe(2);
    expect(s.busiestDay).toBe('2026-07-03');
  });
});

describe('parseRecap', () => {
  it('parses a valid recap', () => {
    const r = parseRecap({
      focus: ['shipping RNOTE'],
      mood: { overall: 'motivated', note: 'busy but upbeat' },
      highlights: ['launched Phase B'],
      people: ['Godwin'],
      openLoops: ['pay invoice'],
    });
    expect(r?.mood.overall).toBe('motivated');
    expect(r?.focus).toEqual(['shipping RNOTE']);
    expect(r?.openLoops).toEqual(['pay invoice']);
  });

  it('defaults unknown mood to mixed and rejects empty/non-objects', () => {
    expect(parseRecap({ focus: ['x'], mood: { overall: 'banana' } })?.mood.overall).toBe('mixed');
    expect(parseRecap({})).toBeNull();
    expect(parseRecap('nope')).toBeNull();
  });
});
