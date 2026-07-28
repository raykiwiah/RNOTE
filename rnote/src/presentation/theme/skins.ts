/**
 * ── The skin (atmosphere) registry ────────────────────────────────────────────
 * One place that describes every optional atmosphere. The UI (atmosphere
 * switch, onboarding, settings) and the store's gating all read from here, so
 * adding a theme is a data change, not a hunt through components.
 *
 * To add a new theme:
 *   1. Add its id to `SkinName` in state/preferences.ts.
 *   2. Create `theme/<name>.css`, scoped to [data-skin='<name>'] (mirror the
 *      specificity of odysseus.css so it wins over any mode/theme), and import it
 *      in main.tsx after tokens.css.
 *   3. (Optional) Add microcopy overrides in theme/lexicon.ts — only the strings
 *      you want to change; everything else falls back to `default`.
 *   4. Register a ThemeDescriptor below. If it should only appear in some
 *      presentation modes, set `modes`. If it has character/style sub-palettes,
 *      give it `variants` (and the store will treat it as requiring a choice).
 *
 * See docs/THEMES.md for the full guide.
 */
import type { LucideIcon } from 'lucide-react';
import { Compass, Shield, Landmark } from 'lucide-react';
import type { ModeName, SkinName } from '../state/preferences';
import { AVENGERS_CHARACTERS } from './avengersRoster';
import { GREEK_CHARACTERS } from './greekRoster';

export interface ThemeVariant {
  id: string;
  label: string;
}

export interface ThemeDescriptor {
  id: SkinName;
  label: string;
  tagline: string;
  /** Icon shown beside the label in the atmosphere control (default has none). */
  icon?: LucideIcon;
  /** If set, the theme is only offered in these presentation modes. */
  modes?: ModeName[];
  /** Sub-palettes (e.g. Avengers characters). Presence => a choice is required. */
  variants?: ThemeVariant[];
}

export const THEMES: ThemeDescriptor[] = [
  {
    id: 'default',
    label: 'Default',
    tagline: 'The original RNOTE.',
  },
  {
    id: 'odysseus',
    label: 'Odysseus',
    tagline: 'A cinematic Homeric voyage — navy seas, bronze and constellations.',
    icon: Compass,
  },
  {
    id: 'avengers',
    label: 'Avengers',
    tagline: 'Earth’s Mightiest — pick a hero or villain and wear their colours.',
    icon: Shield,
    modes: ['genz'],
    variants: AVENGERS_CHARACTERS.map((c) => ({ id: c.id, label: c.name })),
  },
  {
    id: 'pantheon',
    label: 'Pantheon',
    tagline: 'Gods, heroes and monsters of Greek & Norse myth — choose your patron.',
    icon: Landmark,
    modes: ['millennial'],
    variants: GREEK_CHARACTERS.map((c) => ({ id: c.id, label: c.name })),
  },
];

export function themeById(id: SkinName): ThemeDescriptor {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]!;
}

/** Whether a theme may be used in a given presentation mode. */
export function isThemeAvailable(id: SkinName, mode: ModeName): boolean {
  const theme = themeById(id);
  return !theme.modes || theme.modes.includes(mode);
}

/** The themes offered for a presentation mode, in registry order. */
export function themesForMode(mode: ModeName): ThemeDescriptor[] {
  return THEMES.filter((t) => isThemeAvailable(t.id, mode));
}

/** Whether choosing this theme requires picking a variant (sub-palette). */
export function themeRequiresVariant(id: SkinName): boolean {
  return (themeById(id).variants?.length ?? 0) > 0;
}
