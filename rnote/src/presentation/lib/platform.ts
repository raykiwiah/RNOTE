/**
 * Platform detection for UI affordances. Shortcuts *work* on both ⌘ and Ctrl
 * (see useHotkey), but the labels shown should match the user's keyboard.
 */
export const isMac: boolean =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || '');

/** The modifier-key label for the current platform, e.g. "⌘K" / "Ctrl+K". */
export function modLabel(key: string): string {
  return isMac ? `⌘${key}` : `Ctrl+${key}`;
}
