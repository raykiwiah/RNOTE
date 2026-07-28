import { Shield, Skull } from 'lucide-react';
import { usePreferences } from '../state/preferences';
import { characterById, DEFAULT_CHARACTER_ID } from '../theme/avengersRoster';

/**
 * Fills the quiet stretch of the sidebar under the Avengers skin with the chosen
 * character's insignia, name and signature line — so the pick is felt
 * throughout, not just in the accent colours. A power-core emblem (targeting
 * ring + core) tinted in the active palette; heroes wear a shield, villains a
 * skull. Only rendered under the Avengers skin. Motion lives in avengers.css and
 * is dropped under prefers-reduced-motion.
 */
export function AvengersEmblemPanel(): JSX.Element | null {
  const variant = usePreferences((s) => s.skinVariant);
  const character = characterById(variant) ?? characterById(DEFAULT_CHARACTER_ID);
  if (!character) return null;

  const GroupIcon = character.group === 'villain' ? Skull : Shield;

  return (
    <div className="mt-auto shrink-0 px-3 pb-1 pt-6" aria-hidden="true">
      <div className="rn-av-card relative overflow-hidden rounded-xl border border-primary/25 bg-primary/[0.05] px-3 pb-3 pt-4 text-center">
        <div className="rn-av-emblem relative mx-auto mb-2.5 flex h-16 w-16 items-center justify-center text-primary">
          <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full" fill="none">
            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" opacity="0.75" />
            <circle
              cx="32"
              cy="32"
              r="21"
              stroke="hsl(var(--accent))"
              strokeWidth="1.4"
              strokeDasharray="3 4"
              opacity="0.7"
            />
            <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7">
              <path d="M32 3v6" />
              <path d="M32 55v6" />
              <path d="M3 32h6" />
              <path d="M55 32h6" />
            </g>
          </svg>
          <GroupIcon size={22} className="relative" />
        </div>
        <div className="font-display text-sm font-bold text-foreground">{character.name}</div>
        <div className="text-[11px] text-muted-foreground">{character.alias}</div>
        <p className="mt-1.5 font-display text-[11px] italic leading-snug text-primary/80">
          “{character.quote}”
        </p>
      </div>
    </div>
  );
}
