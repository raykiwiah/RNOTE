import { create } from 'zustand';

export type ThemeName = 'light' | 'dark';
export type ModeName = 'genz' | 'millennial';

const THEME_KEY = 'rnote.theme';
const MODE_KEY = 'rnote.mode';
const ONBOARDED_KEY = 'rnote.onboarded';
const NAME_KEY = 'rnote.name';
const TERMS_KEY = 'rnote.terms.version';

interface PreferencesState {
  theme: ThemeName;
  mode: ModeName;
  onboarded: boolean;
  /** The user's first name, used to personalise greetings and notes. */
  userName: string;
  /** The Terms & Conditions version the user has accepted, or null if none yet. */
  termsAcceptedVersion: string | null;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
  setMode: (mode: ModeName) => void;
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

function persist(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Storage may be unavailable (private mode). Preferences degrade to session-only. */
  }
}

/** Reflect the two presentation axes onto <html> so CSS tokens resolve. */
function applyToDom(theme: ThemeName, mode: ModeName): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.setAttribute('data-mode', mode);
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

export const usePreferences = create<PreferencesState>((set, get) => ({
  theme: initialTheme,
  mode: initialMode,
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
    applyToDom(theme, get().mode);
    set({ theme });
  },

  toggleTheme: () => {
    const theme: ThemeName = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(theme);
  },

  setMode: (mode) => {
    persist(MODE_KEY, mode);
    applyToDom(get().theme, mode);
    set({ mode });
  },

  completeOnboarding: ({ mode, theme, name }) => {
    persist(MODE_KEY, mode);
    persist(THEME_KEY, theme);
    persist(ONBOARDED_KEY, '1');
    if (name !== undefined) persist(NAME_KEY, name.trim());
    applyToDom(theme, mode);
    set({
      mode,
      theme,
      onboarded: true,
      ...(name !== undefined ? { userName: name.trim() } : {}),
    });
  },
}));

// Ensure the DOM matches the store's initial values (covers the rare case where
// the inline boot script and persisted store diverge).
applyToDom(initialTheme, initialMode);
