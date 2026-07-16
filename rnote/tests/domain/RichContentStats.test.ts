import { describe, it, expect } from 'vitest';
import {
  documentStats,
  readingTimeMinutes,
  emptyDoc,
  type RichDoc,
} from '@domain/blocks';

const doc: RichDoc = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Title' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Hello brave new world' }] },
  ],
};

describe('readingTimeMinutes', () => {
  it('is 0 for no words and at least 1 once there is any text', () => {
    expect(readingTimeMinutes(0)).toBe(0);
    expect(readingTimeMinutes(1)).toBe(1);
    expect(readingTimeMinutes(5)).toBe(1);
  });

  it('rounds to whole minutes at the default 200 wpm', () => {
    expect(readingTimeMinutes(200)).toBe(1);
    expect(readingTimeMinutes(300)).toBe(2); // 1.5 → 2
    expect(readingTimeMinutes(400)).toBe(2);
  });

  it('honours a custom reading speed', () => {
    expect(readingTimeMinutes(600, 300)).toBe(2);
  });
});

describe('documentStats', () => {
  it('reports zeros for an empty document', () => {
    expect(documentStats(emptyDoc())).toEqual({ words: 0, characters: 0, readingMinutes: 0 });
  });

  it('counts words, typed characters (no structural newlines), and reading time', () => {
    // extractText → "Title\nHello brave new world"
    expect(documentStats(doc)).toEqual({
      words: 5,
      characters: 26, // "Title" (5) + "Hello brave new world" (21), the block '\n' excluded
      readingMinutes: 1,
    });
  });

  it('scales reading time with length', () => {
    const para = (text: string): RichDoc['content'] => [
      { type: 'paragraph', content: [{ type: 'text', text }] },
    ];
    const longText = Array.from({ length: 500 }, () => 'word').join(' ');
    const stats = documentStats({ type: 'doc', content: para(longText) });
    expect(stats.words).toBe(500);
    expect(stats.readingMinutes).toBe(3); // 500 / 200 = 2.5 → 3
  });
});
