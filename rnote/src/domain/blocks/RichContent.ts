/**
 * A minimal, structural description of a ProseMirror/Tiptap document.
 *
 * The domain does not depend on Tiptap; it only knows the shape of the JSON that
 * flows through it. Keeping these types here (rather than importing from Tiptap)
 * preserves the dependency rule: nothing in `domain/` imports a framework.
 */
export interface RichMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface RichNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichNode[];
  marks?: RichMark[];
  text?: string;
}

export interface RichDoc extends RichNode {
  type: 'doc';
  content?: RichNode[];
}

/** The canonical empty document: a single empty paragraph. */
export function emptyDoc(): RichDoc {
  return { type: 'doc', content: [{ type: 'paragraph' }] };
}

export function isRichDoc(value: unknown): value is RichDoc {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: unknown }).type === 'doc'
  );
}

/**
 * Extract readable plain text from a document, inserting line breaks between
 * block-level nodes. Used to build the search index and previews. Pure and
 * recursion-safe for the shallow trees produced by the editor.
 */
export function extractText(node: RichNode): string {
  if (node.text) return node.text;
  if (!node.content || node.content.length === 0) return '';

  const blockLevel = node.type === 'doc' || /list|heading|paragraph|blockquote/i.test(node.type);
  const separator = blockLevel ? '\n' : '';
  return node.content.map(extractText).join(separator);
}

export function isEmptyDoc(doc: RichDoc): boolean {
  return extractText(doc).trim().length === 0;
}

export function countWords(doc: RichDoc): number {
  const text = extractText(doc).trim();
  if (text.length === 0) return 0;
  return text.split(/\s+/).length;
}

/** Average adult silent-reading speed, in words per minute. */
export const READING_WPM = 200;

/**
 * Whole-minute reading estimate for a word count: 0 for an empty doc, and at
 * least 1 once there is any text (so a short note never reads as "0 min").
 */
export function readingTimeMinutes(words: number, wpm: number = READING_WPM): number {
  if (words <= 0) return 0;
  return Math.max(1, Math.round(words / wpm));
}

/** Reading/typing statistics for a document, powering the editor's insight panel. */
export interface DocStats {
  words: number;
  /** Characters actually typed (text nodes), excluding structural line breaks. */
  characters: number;
  /** Estimated silent-reading time in whole minutes (see {@link readingTimeMinutes}). */
  readingMinutes: number;
}

/** Words, characters and reading time for a document, computed in one pass. */
export function documentStats(doc: RichDoc): DocStats {
  const text = extractText(doc);
  const trimmed = text.trim();
  const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
  // extractText joins block nodes with '\n'; strip those so only typed
  // characters (with their spaces) are counted.
  const characters = text.replace(/\n/g, '').length;
  return { words, characters, readingMinutes: readingTimeMinutes(words) };
}
