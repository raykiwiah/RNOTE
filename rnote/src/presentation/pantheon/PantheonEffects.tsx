import { usePreferences } from '../state/preferences';
import { variantCharacterById, defaultVariantId } from '../theme/variants';

/**
 * The ambient signature effect that plays under the active Pantheon patron —
 * the Odysseus-shooting-star counterpart for the myth skin. A fixed,
 * pointer-events-none overlay tinted in the patron's palette; each `signature`
 * maps to a distinct animation in pantheon.css (all gated by reduced motion).
 * Rendered only under the Pantheon skin.
 */
export function PantheonEffects(): JSX.Element | null {
  const skin = usePreferences((s) => s.skin);
  const variant = usePreferences((s) => s.skinVariant);
  if (skin !== 'pantheon') return null;
  const character =
    variantCharacterById('pantheon', variant) ?? variantCharacterById('pantheon', defaultVariantId('pantheon'));
  if (!character) return null;

  return (
    <div className="rn-pan-fx pointer-events-none fixed inset-0 z-[6] overflow-hidden" aria-hidden="true">
      {character.signature === 'thunder' && <Thunder />}
      {character.signature === 'tide' && <Tide />}
      {character.signature === 'embers' && <Embers />}
      {character.signature === 'radiance' && <div className="rn-pan-radiance" />}
      {character.signature === 'moonlight' && <Moonlight />}
      {character.signature === 'petals' && <Petals />}
      {character.signature === 'wings' && <Wings />}
      {character.signature === 'quake' && <Quake />}
      {character.signature === 'serpents' && <Serpents />}
    </div>
  );
}

function Thunder(): JSX.Element {
  return (
    <>
      <div className="rn-pan-flash" />
      <svg className="rn-pan-bolt" viewBox="0 0 100 200" preserveAspectRatio="none">
        <path d="M58 0 30 90 52 90 24 200 82 78 56 78 78 0Z" fill="hsl(var(--av-energy))" />
      </svg>
    </>
  );
}

function Tide(): JSX.Element {
  return (
    <svg className="rn-pan-tide" viewBox="0 0 100 90" preserveAspectRatio="none">
      <path
        d="M0 42 Q 12 26 25 42 T 50 42 T 75 42 T 100 42 V90 H0 Z"
        fill="hsl(var(--primary) / 0.35)"
      />
      <path
        d="M0 54 Q 12 40 25 54 T 50 54 T 75 54 T 100 54 V90 H0 Z"
        fill="hsl(var(--av-energy) / 0.22)"
      />
    </svg>
  );
}

function Embers(): JSX.Element {
  return (
    <div className="rn-pan-embers">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

function Moonlight(): JSX.Element {
  return (
    <>
      <div className="rn-pan-moon" />
      <div className="rn-pan-stars">
        <span />
        <span />
        <span />
        <span />
      </div>
    </>
  );
}

function Petals(): JSX.Element {
  return (
    <div className="rn-pan-petals">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

function Wings(): JSX.Element {
  return (
    <>
      <svg className="rn-pan-wings" viewBox="0 0 46 26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M2 15 Q12 3 23 15 Q34 3 44 15" />
      </svg>
      <svg className="rn-pan-wings rn-pan-wings-2" viewBox="0 0 46 26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M2 15 Q12 3 23 15 Q34 3 44 15" />
      </svg>
    </>
  );
}

function Quake(): JSX.Element {
  return (
    <>
      <div className="rn-pan-quake" />
      <div className="rn-pan-dust">
        <span />
        <span />
        <span />
      </div>
    </>
  );
}

function Serpents(): JSX.Element {
  const path = 'M35 0 Q12 22 35 44 Q58 66 35 88 Q12 110 35 132 Q58 154 35 176 Q12 198 35 220';
  return (
    <div className="rn-pan-serpents">
      <svg className="rn-pan-serpent-l" viewBox="0 0 70 220" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
        <path d={path} />
      </svg>
      <svg className="rn-pan-serpent-r" viewBox="0 0 70 220" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
        <path d={path} />
      </svg>
    </div>
  );
}
