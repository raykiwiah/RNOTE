import type { LucideIcon } from 'lucide-react';
import { Shield, Skull, Landmark, Swords, Flame, Snowflake } from 'lucide-react';
import type { SkinName } from '../state/preferences';
import type { VariantCharacter } from './variantTypes';
import { AVENGERS_CHARACTERS, DEFAULT_CHARACTER_ID as AVENGERS_DEFAULT } from './avengersRoster';
import { GREEK_CHARACTERS, DEFAULT_GREEK_ID } from './greekRoster';

export { VARIANT_TOKEN_KEYS } from './variantTypes';
export type { VariantCharacter } from './variantTypes';

/**
 * The generic registry for "variant skins" (Avengers, Pantheon). It maps a skin
 * to its roster, default character, picker groups and picker copy, so the store
 * (palette application), the lexicon (voice), and the shared picker are all
 * skin-agnostic. Adding another variant skin is a config entry here plus a
 * roster file.
 */
export interface VariantGroup {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface VariantSkinConfig {
  characters: VariantCharacter[];
  defaultId: string;
  groups: VariantGroup[];
  pickerTitle: string;
  pickerSubtitle: string;
}

const CONFIG: Partial<Record<SkinName, VariantSkinConfig>> = {
  avengers: {
    characters: AVENGERS_CHARACTERS,
    defaultId: AVENGERS_DEFAULT,
    groups: [
      { id: 'hero', label: 'Heroes', icon: Shield },
      { id: 'villain', label: 'Villains', icon: Skull },
    ],
    pickerTitle: 'Choose your character',
    pickerSubtitle: 'Their colours become your RNOTE. Change anytime.',
  },
  pantheon: {
    characters: GREEK_CHARACTERS,
    defaultId: DEFAULT_GREEK_ID,
    groups: [
      { id: 'god', label: 'Olympians', icon: Landmark },
      { id: 'hero', label: 'Heroes & Champions', icon: Swords },
      { id: 'monster', label: 'Monsters & Titans', icon: Flame },
      { id: 'norse', label: 'The Norse', icon: Snowflake },
    ],
    pickerTitle: 'Choose your patron',
    pickerSubtitle: 'Their myth becomes your RNOTE. Change anytime.',
  },
};

/** Whether a skin draws its exact palette from a chosen character. */
export function isVariantSkin(skin: SkinName): boolean {
  return skin in CONFIG;
}

export function variantConfig(skin: SkinName): VariantSkinConfig | undefined {
  return CONFIG[skin];
}

export function variantCharacters(skin: SkinName): VariantCharacter[] {
  return CONFIG[skin]?.characters ?? [];
}

export function variantCharacterById(
  skin: SkinName,
  id: string | null | undefined,
): VariantCharacter | undefined {
  if (!id) return undefined;
  return CONFIG[skin]?.characters.find((c) => c.id === id);
}

export function defaultVariantId(skin: SkinName): string | undefined {
  return CONFIG[skin]?.defaultId;
}

/** Every valid variant id across all variant skins — for validating persisted values. */
export const ALL_VARIANT_IDS: string[] = Object.values(CONFIG).flatMap((c) =>
  c ? c.characters.map((ch) => ch.id) : [],
);
