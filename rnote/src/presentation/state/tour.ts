import { create } from 'zustand';
import { TOUR_VERSION, TOUR_STEPS } from '../tour/tourSteps';

/**
 * Drives the first-run product tour. Completion (whether finished or skipped) is
 * persisted by version so the tour shows once, and again only if TOUR_VERSION is
 * bumped. It can be replayed on demand from Settings.
 */
const TOUR_KEY = 'rnote.tour.version';

interface TourState {
  active: boolean;
  index: number;
  /** The TOUR_VERSION the user has already completed/skipped, or null. */
  completedVersion: string | null;
  start: () => void;
  next: () => void;
  prev: () => void;
  /** Dismiss the tour without finishing; still counts as "seen". */
  skip: () => void;
  finish: () => void;
}

function markSeen(): void {
  try {
    localStorage.setItem(TOUR_KEY, TOUR_VERSION);
  } catch {
    /* private mode — tour will simply reappear next session */
  }
}

export const useTour = create<TourState>((set, get) => ({
  active: false,
  index: 0,
  completedVersion: (() => {
    try {
      return localStorage.getItem(TOUR_KEY);
    } catch {
      return null;
    }
  })(),

  start: () => set({ active: true, index: 0 }),

  next: () => {
    const { index } = get();
    if (index >= TOUR_STEPS.length - 1) {
      get().finish();
      return;
    }
    set({ index: index + 1 });
  },

  prev: () => set((s) => ({ index: Math.max(0, s.index - 1) })),

  skip: () => {
    markSeen();
    set({ active: false, index: 0, completedVersion: TOUR_VERSION });
  },

  finish: () => {
    markSeen();
    set({ active: false, index: 0, completedVersion: TOUR_VERSION });
  },
}));
