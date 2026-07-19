import { describe, it, expect, beforeEach } from 'vitest';
import { useTour } from '@/presentation/state/tour';
import { TOUR_VERSION, TOUR_STEPS } from '@/presentation/tour/tourSteps';

describe('product tour steps', () => {
  it('has a version and a non-trivial, well-formed set of steps', () => {
    expect(TOUR_VERSION).toMatch(/\w/);
    expect(TOUR_STEPS.length).toBeGreaterThanOrEqual(5);
    for (const step of TOUR_STEPS) {
      expect(step.title.trim().length).toBeGreaterThan(0);
      expect(step.body.trim().length).toBeGreaterThan(0);
    }
    // The first and last steps are centred (welcome / finish, no target).
    expect(TOUR_STEPS[0]?.target).toBeUndefined();
    expect(TOUR_STEPS.at(-1)?.target).toBeUndefined();
  });
});

describe('useTour', () => {
  beforeEach(() => {
    localStorage.removeItem('rnote.tour.version');
    useTour.setState({ active: false, index: 0, completedVersion: null });
  });

  it('starts at the first step and advances / goes back, clamped at the start', () => {
    useTour.getState().start();
    expect(useTour.getState().active).toBe(true);
    expect(useTour.getState().index).toBe(0);

    useTour.getState().prev();
    expect(useTour.getState().index).toBe(0); // clamped, never negative

    useTour.getState().next();
    expect(useTour.getState().index).toBe(1);
  });

  it('advancing past the last step finishes and persists completion', () => {
    useTour.getState().start();
    useTour.setState({ index: TOUR_STEPS.length - 1 });
    useTour.getState().next(); // past the end → finish

    expect(useTour.getState().active).toBe(false);
    expect(useTour.getState().completedVersion).toBe(TOUR_VERSION);
    expect(localStorage.getItem('rnote.tour.version')).toBe(TOUR_VERSION);
  });

  it('skipping also records the tour as seen', () => {
    useTour.getState().start();
    useTour.getState().skip();
    expect(useTour.getState().active).toBe(false);
    expect(localStorage.getItem('rnote.tour.version')).toBe(TOUR_VERSION);
  });
});
