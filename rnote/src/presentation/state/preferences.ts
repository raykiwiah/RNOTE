import { create } from 'zustand';
import {
  AV_TOKEN_KEYS,
  AVENGERS_CHARACTER_IDS,
  DEFAULT_CHARACTER_ID,
  characterById,
} from '../theme/avengersRoster';
import { isThemeAvailable } from '../theme/skins';

export type ThemeName = 'light' | 'dark';
export type ModeName = 'genz' | 'millennial';
/**
 * A "skin" is a third, orthogonal presentation axis on top of theme + mode. It
 * re-imagines the entire atmosphere (palette, typography, textures, language)
 * without touching any feature. 'default' is the original app; 'odysseus' is the
 * cinematic Homeric voyage; 'avengers' is the Gen-Z-only Marvel skin whose exact
 * colours come from a chosen character (see `skinVariant`). Themes are described
 * in theme/skins.ts.
 */
export type SkinName = 'default' | 'odysseus' | 'avengers';

const THEME_KEY = 'rnote.theme';
const MODE_KEY = 'rnote.mode';
const SKIN_KEY = 'rnote.skin';
const SKIN_VARIANT_KEY = 'rnote.skin.variant';
const ONBOARDED_KEY = 'rnote.onboarded';
const NAME_KEY = 'rnote.name';
const TERMS_KEY = 'rnote.terms.version';

interface PreferencesState {
  theme: ThemeName;
  mode: ModeName;
  skin: SkinName;
  /** The chosen sub-palette for skins that have variants (an Avengers character
   *  id), or null. Persisted so re-selecting the skin restores the choice. */
  skinVariant: string | null;
  onboarded: boolean;
  /** The user's first name, used to personalise greetings and notes. */
  userName: string;
  /** The Terms & Conditions version the user has accepted, or null if none yet. */
  termsAcceptedVersion: string | null;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
  setMode: (mode: ModeName) => void;
  /** Switch the atmosphere. Instant, purely presentational, touches no data. */
  setSkin: (skin: SkinName) => void;
  /** Choose the active skin's variant (e.g. an Avengers character). */
  setSkinVariant: (variant: string | null) => void;
  setUserName: (name: string) => void;
  /** Record acceptance of a given Terms & Conditions version. */
  acceptTerms: (version: string) => void;
  completeOnboarding: (choice: { mode: ModeName; theme: ThemeName; name?: string }) => void;
}

function read<T extends string>(key: string, fallback: T, allowed: readonly T[]): T {
  try {
    const value = localStorage.getItem(key);
    return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}

function readVariant(): string | null {
  try {
    const value = localStorage.getItem(SKIN_VARIANT_KEY);
    return value && AVENGERS_CHARACTER_IDS.includes(value) ? value : null;
  } catch {
    return null;
  }
}

function persist(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Storage may be unavailable (private mode). Preferences degrade to session-only. */
  }
}

/**
 * Reflect the presentation axes onto <html> so CSS tokens resolve. For skins
 * with variants (Avengers), the chosen character's design-token overrides are
 * applied as inline custom properties on :root and fully cleared otherwise, so
 * switching character — or leaving the skin — never leaves colour behind.
 */
function applyToDom(theme: ThemeName, mode: ModeName, skin: SkinName, variant: string | null): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.setAttribute('data-mode', mode);
  root.setAttribute('data-skin', skin);

  if (skin === 'avengers') {
    const character = characterById(variant) ?? characterById(DEFAULT_CHARACTER_ID)!;
    root.setAttribute('data-skin-variant', character.id);
    for (const key of AV_TOKEN_KEYS) root.style.removeProperty(key);
    for (const [key, value] of Object.entries(character.vars)) root.style.setProperty(key, value);
  } else {
    root.removeAttribute('data-skin-variant');
    for (const key of AV_TOKEN_KEYS) root.style.removeProperty(key);
  }
}

const systemPrefersDark = (): boolean => {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
};

const initialTheme = read<ThemeName>(THEME_KEY, systemPrefersDark() ? 'dark' : 'light', [
  'light',
  'dark',
]);
const initialMode = read<ModeName>(MODE_KEY, 'millennial', ['genz', 'millennial']);
let initialSkin = read<SkinName>(SKIN_KEY, 'default', ['default', 'odysseus', 'avengers']);
// Enforce mode-gating up front (e.g. a stored Avengers skin under Millennial).
if (!isThemeAvailable(initialSkin, initialMode)) initialSkin = 'default';
const initialSkinVariant = readVariant();

export const usePreferences = create<PreferencesState>((set, get) => ({
  theme: initialTheme,
  mode: initialMode,
  skin: initialSkin,
  skinVariant: initialSkinVariant,
  onboarded: (() => {
    try {
      return localStorage.getItem(ONBOARDED_KEY) === '1';
    } catch {
      return false;
    }
  })(),
  userName: (() => {
    try {
      return localStorage.getItem(NAME_KEY) ?? '';
    } catch {
      return '';
    }
  })(),
  termsAcceptedVersion: (() => {
    try {
      return localStorage.getItem(TERMS_KEY);
    } catch {
      return null;
    }
  })(),

  acceptTerms: (version) => {
    persist(TERMS_KEY, version);
    set({ termsAcceptedVersion: version });
  },

  setUserName: (name) => {
    const value = name.trim();
    persist(NAME_KEY, value);
    set({ userName: value });
  },

  setTheme: (theme) => {
    persist(THEME_KEY, theme);
    applyToDom(theme, get().mode, get().skin, get().skinVariant);
    set({ theme });
  },

  toggleTheme: () => {
    const theme: ThemeName = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(theme);
  },

  setMode: (mode) => {
    persist(MODE_KEY, mode);
    // A skin only available in other modes falls back to default when we leave
    // its mode (e.g. Avengers is Gen Z only).
    let skin = get().skin;
    if (!isThemeAvailable(skin, mode)) {
      skin = 'default';
      persist(SKIN_KEY, skin);
    }
    applyToDom(get().theme, mode, skin, get().skinVariant);
    set({ mode, skin });
  },

  setSkin: (skin) => {
    persist(SKIN_KEY, skin);
    // If a skin needs a variant and none is chosen yet, seed a sensible default
    // so it never renders half-styled; the picker will refine it.
    let variant = get().skinVariant;
    if (skin === 'avengers' && !characterById(variant)) {
      variant = DEFAULT_CHARACTER_ID;
      persist(SKIN_VARIANT_KEY, variant);
    }
    applyToDom(get().theme, get().mode, skin, variant);
    set({ skin, skinVariant: variant });
  },

  setSkinVariant: (variant) => {
    persist(SKIN_VARIANT_KEY, variant ?? '');
    applyToDom(get().theme, get().mode, get().skin, variant);
    set({ skinVariant: variant });
  },

  completeOnboarding: ({ mode, theme, name }) => {
    persist(MODE_KEY, mode);
    persist(THEME_KEY, theme);
    persist(ONBOARDED_KEY, '1');
    if (name !== undefined) persist(NAME_KEY, name.trim());
    let skin = get().skin;
    if (!isThemeAvailable(skin, mode)) {
      skin = 'default';
      persist(SKIN_KEY, skin);
    }
    applyToDom(theme, mode, skin, get().skinVariant);
    set({
      mode,
      theme,
      skin,
      onboarded: true,
      ...(name !== undefined ? { userName: name.trim() } : {}),
    });
  },
}));

// Ensure the DOM matches the store's initial values (covers the rare case where
// the inline boot script and persisted store diverge).
applyToDom(initialTheme, initialMode, initialSkin, initialSkinVariant);
