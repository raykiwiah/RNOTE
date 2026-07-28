import type { LucideIcon } from 'lucide-react';
import {
  Zap,
  Waves,
  Flame,
  BookOpen,
  Sun,
  Moon,
  Heart,
  Dumbbell,
  Shield,
  Rabbit,
  Award,
  Eye,
  Route,
  Hourglass,
  Bird,
  Hammer,
  Feather,
  Swords,
} from 'lucide-react';

/**
 * Each patron's signature nav icon, shown as their Home/base item in the Pantheon
 * sidebar. The remaining nav slots keep the coherent temple-ops icon set (see
 * Sidebar). Unknown ids fall back to the base set by returning undefined.
 */
const PANTHEON_HOME_ICON: Record<string, LucideIcon> = {
  zeus: Zap,
  poseidon: Waves,
  hades: Flame,
  athena: BookOpen,
  apollo: Sun,
  artemis: Moon,
  aphrodite: Heart,
  heracles: Dumbbell,
  perseus: Shield,
  atalanta: Rabbit,
  nike: Award,
  medusa: Eye,
  minotaur: Route,
  kronos: Hourglass,
  odin: Bird,
  thor: Hammer,
  freya: Feather,
  brynhildr: Swords,
};

export function pantheonHomeIcon(id: string | null | undefined): LucideIcon | undefined {
  if (!id) return undefined;
  return PANTHEON_HOME_ICON[id];
}
