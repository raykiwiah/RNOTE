import { describe, it, expect, beforeEach } from 'vitest';
import { usePreferences } from '@/presentation/state/preferences';
import { lex, achievementTitle } from '@/presentation/theme/lexicon';
import { themeById, themeRequiresVariant } from '@/presentation/theme/skins';
import {
  VARIANT_TOKEN_KEYS,
  isVariantSkin,
  ALL_VARIANT_IDS,
} from '@/presentation/theme/variants';
import { GREEK_CHARACTERS, GREEK_CHARACTER_IDS, DEFAULT_GREEK_ID } from '@/presentation/theme/greekRoster';
import { pantheonHomeIcon } from '@/presentation/pantheon/characterIcons';

const HSL_TRIPLE = /^\d{1,3} \d{1,3}% \d{1,3}%$/;
const CORE_KEYS = ['--primary', '--primary-foreground', '--accent', '--accent-foreground', '--ring', '--av-energy'];
const SIGNATURES = ['thunder', 'tide', 'embers', 'radiance', 'moonlight', 'petals', 'wings', 'quake', 'serpents'];

function resetPrefs(): void {
  localStorage.clear();
  usePreferences.setState({ skin: 'default', skinVariant: null, mode: 'millennial', theme: 'light' });
  const root = document.documentElement;
  for (const key of VARIANT_TOKEN_KEYS) root.style.removeProperty(key);
  root.removeAttribute('data-skin-variant');
}

describe('Pantheon registry + roster', () => {
  it('registers Pantheon as a Millennial-only variant skin', () => {
    expect(isVariantSkin('pantheon')).toBe(true);
    expect(themeRequiresVariant('pantheon')).toBe(true);
    expect(themeById('pantheon').modes).toEqual(['millennial']);
    expect(themeById('pantheon').variants?.map((v) => v.id)).toEqual(GREEK_CHARACTER_IDS);
  });

  it('has unique ids, a valid default, and all four groups', () => {
    const ids = GREEK_CHARACTERS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(GREEK_CHARACTER_IDS).toContain(DEFAULT_GREEK_ID);
    for (const group of ['god', 'hero', 'monster', 'norse']) {
      expect(GREEK_CHARACTERS.some((c) => c.group === group), group).toBe(true);
    }
  });

  it('includes the requested figures — Zeus, a Valkyrie, and Norse gods', () => {
    const ids = GREEK_CHARACTER_IDS;
    expect(ids).toContain('zeus');
    expect(ids).toContain('brynhildr'); // the Valkyrie
    expect(ids).toContain('odin');
    expect(GREEK_CHARACTERS.find((c) => c.id === 'brynhildr')?.group).toBe('norse');
  });

  it('every figure defines valid core tokens, a valid signature, and a full voice', () => {
    for (const c of GREEK_CHARACTERS) {
      for (const key of CORE_KEYS) expect(c.vars[key], `${c.id} ${key}`).toMatch(HSL_TRIPLE);
      for (const key of Object.keys(c.vars)) {
        expect(VARIANT_TOKEN_KEYS as readonly string[], `${c.id} ${key}`).toContain(key);
      }
      expect(SIGNATURES, c.id).toContain(c.signature);
      expect(c.voice?.greeting, c.id).toBeTruthy();
      expect(c.voice?.capture, c.id).toBeTruthy();
      expect(c.voice?.logButton, c.id).toBeTruthy();
      expect(c.voice?.empty, c.id).toBeTruthy();
    }
  });

  it('maps every figure to a signature home icon', () => {
    for (const c of GREEK_CHARACTERS) expect(pantheonHomeIcon(c.id), c.id).toBeTruthy();
    expect(pantheonHomeIcon('nobody')).toBeUndefined();
  });

  it('exposes both skins’ ids in the shared validation set', () => {
    expect(ALL_VARIANT_IDS).toContain('zeus');
    expect(ALL_VARIANT_IDS).toContain('iron-man');
  });
});

describe('preferences · Pantheon skin + patron', () => {
  beforeEach(resetPrefs);

  it('applies data-skin, data-skin-variant and the patron palette to :root', () => {
    usePreferences.getState().setSkin('pantheon');
    usePreferences.getState().setSkinVariant('poseidon');
    const root = document.documentElement;
    expect(root.getAttribute('data-skin')).toBe('pantheon');
    expect(root.getAttribute('data-skin-variant')).toBe('poseidon');
    expect(root.style.getPropertyValue('--primary')).toBe('185 62% 44%');
    expect(root.style.getPropertyValue('--background')).toBe('205 55% 10%'); // Poseidon is a mood patron
  });

  it('seeds Zeus when no patron is chosen', () => {
    usePreferences.getState().setSkin('pantheon');
    expect(usePreferences.getState().skinVariant).toBe(DEFAULT_GREEK_ID);
  });

  it('switching a mood → accent patron clears stale structural tokens', () => {
    const root = document.documentElement;
    usePreferences.getState().setSkin('pantheon');
    usePreferences.getState().setSkinVariant('hades'); // mood: sets --background
    expect(root.style.getPropertyValue('--background')).toBe('270 18% 8%');
    usePreferences.getState().setSkinVariant('zeus'); // accent-only
    expect(root.style.getPropertyValue('--background')).toBe('');
    expect(root.style.getPropertyValue('--primary')).toBe('222 60% 42%');
  });

  it('switching to Gen Z drops the Millennial-only Pantheon skin to default', () => {
    usePreferences.getState().setSkin('pantheon');
    usePreferences.getState().setSkinVariant('athena');
    usePreferences.getState().setMode('genz');
    expect(usePreferences.getState().skin).toBe('default');
    expect(document.documentElement.getAttribute('data-skin')).toBe('default');
  });

  it('leaving Pantheon clears the inline palette and variant attribute', () => {
    const root = document.documentElement;
    usePreferences.getState().setSkin('pantheon');
    usePreferences.getState().setSkinVariant('medusa');
    usePreferences.getState().setSkin('default');
    expect(root.getAttribute('data-skin-variant')).toBeNull();
    for (const key of VARIANT_TOKEN_KEYS) expect(root.style.getPropertyValue(key)).toBe('');
  });
});

describe('lexicon · Pantheon', () => {
  it('resolves the patron voice first', () => {
    expect(lex('pantheon', 'greeting.morning', 'zeus')).toBe('The heavens attend you.');
    expect(lex('pantheon', 'home.captureButton', 'hades')).toBe('Inter');
    expect(lex('pantheon', 'home.capturePlaceholder', 'poseidon')).toBe('Speak to the deep…');
  });

  it('falls back to the base Pantheon copy for untouched keys', () => {
    expect(lex('pantheon', 'nav.home', 'zeus')).toBe('The Pantheon');
    expect(lex('pantheon', 'nav.trash', 'odin')).toBe('Tartarus');
    expect(lex('pantheon', 'stats.xp', 'zeus')).toBe('kleos');
  });

  it('renames achievements under Pantheon', () => {
    expect(achievementTitle('level-5', 'Rising Star', 'pantheon')).toBe('Ascended');
    expect(achievementTitle('unknown', 'Rising Star', 'pantheon')).toBe('Rising Star');
  });

  it('does not leak the patron voice under other skins', () => {
    expect(lex('default', 'greeting.morning', 'zeus')).toBe('Good morning');
  });
});
