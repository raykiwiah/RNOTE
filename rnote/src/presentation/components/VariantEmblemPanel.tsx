import { usePreferences } from '../state/preferences';
import { isVariantSkin, variantCharacterById, defaultVariantId } from '../theme/variants';
import { AvengersEmblem } from '../avengers/AvengersEmblem';
import { GreekEmblem } from '../pantheon/GreekEmblem';

/**
 * Fills the quiet stretch of the sidebar under a variant skin with the chosen
 * character's own insignia, name and signature line — the Avengers/Pantheon
 * counterpart of the Odysseus ship. The emblem art is skin-specific; the frame,
 * pulse and hover sheen (rn-av-* classes) are shared and re-styled per skin in
 * each theme's CSS. Only rendered under a variant skin.
 */
export function VariantEmblemPanel(): JSX.Element | null {
  const skin = usePreferences((s) => s.skin);
  const variant = usePreferences((s) => s.skinVariant);
  if (!isVariantSkin(skin)) return null;
  const character =
    variantCharacterById(skin, variant) ?? variantCharacterById(skin, defaultVariantId(skin));
  if (!character) return null;

  return (
    <div className="mt-auto shrink-0 px-3 pb-1 pt-6" aria-hidden="true">
      <div className="rn-av-card relative overflow-hidden rounded-xl border border-primary/25 bg-primary/[0.05] px-3 pb-3 pt-4 text-center">
        <div className="rn-av-emblem relative mx-auto mb-2.5 flex h-[70px] w-[70px] items-center justify-center text-primary">
          {/* Faint targeting ring frames the insignia. */}
          <svg viewBox="0 0 72 72" className="absolute inset-0 h-full w-full" fill="none">
            <circle cx="36" cy="36" r="34" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
            <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.5">
              <path d="M36 3v5" />
              <path d="M36 64v5" />
              <path d="M3 36h5" />
              <path d="M64 36h5" />
            </g>
          </svg>
          {skin === 'pantheon' ? (
            <GreekEmblem characterId={character.id} size={44} className="relative" />
          ) : (
            <AvengersEmblem characterId={character.id} size={44} className="relative" />
          )}
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
