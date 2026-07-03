/** Lightweight cross-surface UI events (dispatched on `window`). */
export const OPEN_TEMPLATES_EVENT = 'rnote:new-from-template';
export const OPEN_CAPTURE_EVENT = 'rnote:quick-capture';
export const OPEN_SEARCH_EVENT = 'rnote:open-search';

export function emit(name: string): void {
  window.dispatchEvent(new Event(name));
}
