import { describe, it, expect, beforeEach } from 'vitest';
import {
  TERMS_VERSION,
  TERMS_SECTIONS,
  TERMS_SUMMARY,
  TERMS_EFFECTIVE_DATE,
} from '@/presentation/onboarding/terms';
import { usePreferences } from '@/presentation/state/preferences';

describe('Terms & Conditions content', () => {
  it('exposes a version, effective date, summary and non-empty sections', () => {
    expect(TERMS_VERSION).toMatch(/\d/);
    expect(TERMS_EFFECTIVE_DATE.trim().length).toBeGreaterThan(0);
    expect(TERMS_SUMMARY.length).toBeGreaterThan(20);
    expect(TERMS_SECTIONS.length).toBeGreaterThanOrEqual(5);
    for (const section of TERMS_SECTIONS) {
      expect(section.heading.trim().length).toBeGreaterThan(0);
      expect(section.body.trim().length).toBeGreaterThan(0);
    }
  });

  it('covers the privacy-critical points a local-first app must state', () => {
    const all = TERMS_SECTIONS.map((s) => `${s.heading} ${s.body}`).join(' ').toLowerCase();
    for (const topic of ['device', 'backup', 'warrant', 'liab', 'accept', 'decline']) {
      expect(all).toContain(topic);
    }
  });
});

describe('preferences.acceptTerms', () => {
  beforeEach(() => localStorage.removeItem('rnote.terms.version'));

  it('records and persists the accepted terms version', () => {
    usePreferences.getState().acceptTerms(TERMS_VERSION);
    expect(usePreferences.getState().termsAcceptedVersion).toBe(TERMS_VERSION);
    expect(localStorage.getItem('rnote.terms.version')).toBe(TERMS_VERSION);
  });
});
