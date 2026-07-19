/**
 * The first-run product tour: a sequence of coach-marks that spotlight parts of
 * the UI and explain, step by step, how to use RNOTE. Steps with a `target`
 * point at the element carrying the matching `data-tour="…"` attribute; steps
 * without one are shown centred (welcome / finish). Bump TOUR_VERSION to re-show
 * the tour after a meaningful UI change.
 */
export const TOUR_VERSION = '1';

export type TourPlacement = 'right' | 'left' | 'top' | 'bottom' | 'center';

export interface TourStep {
  id: string;
  /** `data-tour` value of the element to spotlight; omit for a centred step. */
  target?: string;
  title: string;
  body: string;
  placement?: TourPlacement;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to RNOTE 👋',
    body: 'Here’s a quick tour so you know where everything is and how to use it. It takes about a minute — you can skip whenever you like.',
    placement: 'center',
  },
  {
    id: 'pages',
    target: 'pages',
    title: 'Your pages live here',
    body: 'Every note and page you create shows up in this list. Click one to open it — this is your whole workspace.',
    placement: 'right',
  },
  {
    id: 'new-page',
    target: 'new-page',
    title: 'Create a page',
    body: 'Start a fresh page anytime. Inside a page, type “/” to drop in headings, to-dos, tables, callouts and more.',
    placement: 'right',
  },
  {
    id: 'search',
    target: 'search',
    title: 'Find anything, fast',
    body: 'Search every page or run commands from the command palette — press ⌘K (Ctrl+K) from anywhere in the app.',
    placement: 'right',
  },
  {
    id: 'capture',
    target: 'capture',
    title: 'Capture a quick thought',
    body: 'Jot something down without leaving what you’re doing. It lands in your Inbox so nothing gets lost.',
    placement: 'left',
  },
  {
    id: 'connectivity',
    target: 'connectivity',
    title: 'Offline or Online — your call',
    body: 'Offline keeps everything private on this device. Online unlocks AI and calendar sync, and it falls back to offline automatically whenever you lose connection.',
    placement: 'right',
  },
  {
    id: 'mode',
    target: 'mode',
    title: 'Make it yours',
    body: 'Switch the vibe between Gen Z and Millennial, and toggle light or dark — anytime, without changing any features.',
    placement: 'right',
  },
  {
    id: 'settings',
    target: 'settings',
    title: 'Settings & backups',
    body: 'Connect an AI provider, export a backup, and manage everything here. You can replay this tour from Settings whenever you want.',
    placement: 'right',
  },
  {
    id: 'done',
    title: 'You’re all set! 🎉',
    body: 'That’s the tour. Create a page, capture a thought, and make RNOTE yours. Everything stays on your device — welcome aboard!',
    placement: 'center',
  },
];
