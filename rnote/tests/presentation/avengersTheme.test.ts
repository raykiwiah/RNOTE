import { describe, it, expect, beforeEach } from 'vitest';
import { usePreferences } from '@/presentation/state/preferences';
import { lex, achievementTitle } from '@/presentation/theme/lexicon';
import {
  THEMES,
  themeById,
  themesForMode,
  isThemeAvailable,
  themeRequiresVariant,
} from '@/presentation/theme/skins';
import {
  AVENGERS_CHARACTERS,
  AV_TOKEN_KEYS,
  AVENGERS_CHARACTER_IDS,
  DEFAULT_CHARACTER_ID,
  characterById,
} from '@/presentation/theme/avengersRoster';
import { characterHomeIcon } from '@/presentation/avengers/characterIcons';

const SIGNATURES = ['repulsor', 'lightning', 'mystic', 'smash', 'symbiote', 'cosmic', 'web', 'kinetic'];

const HSL_TRIPLE = /^\d{1,3} \d{1,3}% \d{1,3}%$/;
const CORE_KEYS = ['--primary', '--primary-foreground', '--accent', '--accent-foreground', '--ring', '--av-energy'];

function resetPrefs(): void {
  localStorage.clear();
  usePreferences.setState({ skin: 'default', skinVariant: null, mode: 'genz', theme: 'dark' });
  const root = document.documentElement;
  for (const key of AV_TOKEN_KEYS) root.style.removeProperty(key);
  root.removeAttribute('data-skin-variant');
}

describe('theme registry (skins.ts)', () => {
  it('exposes the three known themes', () => {
    expect(THEMES.map((t) => t.id)).toEqual(['default', 'odysseus', 'avengers']);
  });

  it('gates Avengers to Gen Z only; Default and Odysseus are universal', () => {
    expect(isThemeAvailable('avengers', 'genz')).toBe(true);
    expect(isThemeAvailable('avengers', 'millennial')).toBe(false);
    for (const mode of ['genz', 'millennial'] as const) {
      expect(isThemeAvailable('default', mode)).toBe(true);
      expect(isThemeAvailable('odysseus', mode)).toBe(true);
    }
  });

  it('themesForMode reflects the gating', () => {
    expect(themesForMode('genz').map((t) => t.id)).toContain('avengers');
    expect(themesForMode('millennial').map((t) => t.id)).not.toContain('avengers');
  });

  it('only Avengers requires a variant, and it lists every character', () => {
    expect(themeRequiresVariant('avengers')).toBe(true);
    expect(themeRequiresVariant('odysseus')).toBe(false);
    expect(themeRequiresVariant('default')).toBe(false);
    expect(themeById('avengers').variants?.map((v) => v.id)).toEqual(AVENGERS_CHARACTER_IDS);
  });
});

describe('Avengers roster data', () => {
  it('has unique character ids and a valid default', () => {
    const ids = AVENGERS_CHARACTERS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(AVENGERS_CHARACTER_IDS).toContain(DEFAULT_CHARACTER_ID);
    expect(characterById(DEFAULT_CHARACTER_ID)).toBeDefined();
  });

  it('includes both heroes and villains, with Thanos among them', () => {
    expect(AVENGERS_CHARACTERS.some((c) => c.group === 'hero')).toBe(true);
    expect(AVENGERS_CHARACTERS.some((c) => c.group === 'villain')).toBe(true);
    expect(AVENGERS_CHARACTERS.find((c) => c.id === 'thanos')?.group).toBe('villain');
  });

  it('every character defines the core accent tokens as valid HSL triples', () => {
    for (const c of AVENGERS_CHARACTERS) {
      for (const key of CORE_KEYS) {
        expect(c.vars[key], `${c.id} ${key}`).toMatch(HSL_TRIPLE);
      }
    }
  });

  it('every overridden token is part of the clearable key set', () => {
    for (const c of AVENGERS_CHARACTERS) {
      for (const key of Object.keys(c.vars)) {
        expect(AV_TOKEN_KEYS as readonly string[], `${c.id} ${key}`).toContain(key);
      }
    }
  });

  it('characterById returns undefined for unknown / empty ids', () => {
    expect(characterById('not-a-hero')).toBeUndefined();
    expect(characterById(null)).toBeUndefined();
    expect(characterById(undefined)).toBeUndefined();
  });
});

describe('preferences · Avengers skin + variant', () => {
  beforeEach(resetPrefs);

  it('applies data-skin, data-skin-variant and the character palette to :root', () => {
    usePreferences.getState().setSkin('avengers');
    usePreferences.getState().setSkinVariant('hulk');
    const root = document.documentElement;
    expect(root.getAttribute('data-skin')).toBe('avengers');
    expect(root.getAttribute('data-skin-variant')).toBe('hulk');
    expect(root.style.getPropertyValue('--primary')).toBe('122 50% 36%');
  });

  it('switching character swaps the palette cleanly (no stale mood tokens)', () => {
    const root = document.documentElement;
    usePreferences.getState().setSkin('avengers');
    usePreferences.getState().setSkinVariant('venom'); // mood: sets --background
    expect(root.style.getPropertyValue('--background')).toBe('0 0% 4%');
    usePreferences.getState().setSkinVariant('iron-man'); // accent-only: no --background
    expect(root.style.getPropertyValue('--background')).toBe('');
    expect(root.style.getPropertyValue('--primary')).toBe('0 74% 47%');
  });

  it('seeds a default character when none is chosen', () => {
    usePreferences.getState().setSkin('avengers');
    expect(usePreferences.getState().skinVariant).toBe(DEFAULT_CHARACTER_ID);
    expect(document.documentElement.getAttribute('data-skin-variant')).toBe(DEFAULT_CHARACTER_ID);
  });

  it('leaving the Avengers skin clears the inline palette and variant attribute', () => {
    const root = document.documentElement;
    usePreferences.getState().setSkin('avengers');
    usePreferences.getState().setSkinVariant('thanos');
    usePreferences.getState().setSkin('odysseus');
    expect(root.getAttribute('data-skin')).toBe('odysseus');
    expect(root.getAttribute('data-skin-variant')).toBeNull();
    for (const key of AV_TOKEN_KEYS) expect(root.style.getPropertyValue(key)).toBe('');
  });

  it('switching to Millennial drops the Gen-Z-only Avengers skin to default', () => {
    usePreferences.getState().setSkin('avengers');
    usePreferences.getState().setSkinVariant('loki');
    usePreferences.getState().setMode('millennial');
    expect(usePreferences.getState().skin).toBe('default');
    expect(localStorage.getItem('rnote.skin')).toBe('default');
    expect(document.documentElement.getAttribute('data-skin')).toBe('default');
  });

  it('keeps Odysseus when switching to Millennial (it is not gated)', () => {
    usePreferences.getState().setSkin('odysseus');
    usePreferences.getState().setMode('millennial');
    expect(usePreferences.getState().skin).toBe('odysseus');
  });
});

describe('lexicon · Avengers', () => {
  it('re-languages the key surfaces under Avengers', () => {
    expect(lex('avengers', 'nav.home')).toBe('The Tower');
    expect(lex('avengers', 'nav.trash')).toBe('Snapped');
    expect(lex('avengers', 'nav.settings')).toBe('The Lab');
    expect(lex('avengers', 'home.captureButton')).toBe('Log');
    expect(lex('avengers', 'home.recent')).toBe('Recent Missions');
  });

  it('falls back to default copy for keys it does not override', () => {
    // stats.xp has no Avengers override → default 'XP'
    expect(lex('avengers', 'stats.xp')).toBe('XP');
    expect(lex('avengers', 'stats.dayMany')).toBe('days');
  });

  it('renames achievements under Avengers, default otherwise', () => {
    expect(achievementTitle('level-5', 'Rising Star', 'avengers')).toBe('Legend');
    expect(achievementTitle('unknown-id', 'Rising Star', 'avengers')).toBe('Rising Star');
    expect(achievementTitle('level-5', 'Rising Star', 'default')).toBe('Rising Star');
  });
});

describe('per-character flourishes (emblem / voice / icon / signature)', () => {
  it('every character has a valid signature effect and a full voice', () => {
    for (const c of AVENGERS_CHARACTERS) {
      expect(SIGNATURES, c.id).toContain(c.signature);
      expect(c.voice?.greeting, c.id).toBeTruthy();
      expect(c.voice?.capture, c.id).toBeTruthy();
      expect(c.voice?.logButton, c.id).toBeTruthy();
      expect(c.voice?.empty, c.id).toBeTruthy();
    }
  });

  it('lex resolves the character voice first under Avengers', () => {
    // greeting.* → the character's greeting
    expect(lex('avengers', 'greeting.morning', 'hulk')).toBe('HULK READY.');
    expect(lex('avengers', 'greeting.evening', 'thor')).toBe('Well met, warrior.');
    // capture placeholder + button
    expect(lex('avengers', 'home.capturePlaceholder', 'venom')).toBe('Feed us a thought…');
    expect(lex('avengers', 'home.captureButton', 'venom')).toBe('Devour');
    // empty states
    expect(lex('avengers', 'empty.noPages', 'thanos')).toContain('Balance');
  });

  it('falls back to the base Avengers copy for keys the voice does not touch', () => {
    // nav.home has no voice override → base Avengers 'The Tower' for any character
    expect(lex('avengers', 'nav.home', 'hulk')).toBe('The Tower');
    expect(lex('avengers', 'nav.trash', 'loki')).toBe('Snapped');
  });

  it('ignores voice when the skin is not Avengers', () => {
    expect(lex('odysseus', 'greeting.morning', 'hulk')).toBe('Fair winds');
    expect(lex('default', 'home.captureButton', 'venom')).toBe('Capture');
  });

  it('maps every character to a signature home icon', () => {
    for (const c of AVENGERS_CHARACTERS) {
      expect(characterHomeIcon(c.id), c.id).toBeTruthy();
    }
    expect(characterHomeIcon('not-a-hero')).toBeUndefined();
    expect(characterHomeIcon(null)).toBeUndefined();
  });
});
