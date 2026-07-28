import type { LucideIcon } from 'lucide-react';
import {
  Cpu,
  ShieldCheck,
  Hammer,
  Angry,
  Cat,
  Grab,
  Eye,
  WandSparkles,
  Star,
  Crosshair,
  Gem,
  Drama,
  Bot,
  Biohazard,
  Magnet,
  Crown,
} from 'lucide-react';

/**
 * Each character's signature nav icon, shown as their Home/base item in the
 * sidebar and dock so the pick reads at a glance. The remaining nav slots keep
 * the coherent Avengers mission-ops icon set (see Sidebar). Unknown ids fall
 * back to the base set by returning undefined.
 */
const CHARACTER_HOME_ICON: Record<string, LucideIcon> = {
  'iron-man': Cpu,
  'captain-america': ShieldCheck,
  thor: Hammer,
  hulk: Angry,
  'black-panther': Cat,
  'spider-man': Grab,
  'doctor-strange': Eye,
  'scarlet-witch': WandSparkles,
  'captain-marvel': Star,
  'black-widow': Crosshair,
  thanos: Gem,
  loki: Drama,
  ultron: Bot,
  venom: Biohazard,
  magneto: Magnet,
  hela: Crown,
};

export function characterHomeIcon(id: string | null | undefined): LucideIcon | undefined {
  if (!id) return undefined;
  return CHARACTER_HOME_ICON[id];
}
