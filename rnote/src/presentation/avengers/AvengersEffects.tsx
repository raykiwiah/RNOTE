import { usePreferences } from '../state/preferences';
import { characterById, DEFAULT_CHARACTER_ID } from '../theme/avengersRoster';

/**
 * The ambient "crazy" effect that plays under the active Avengers character —
 * the counterpart to the Odysseus shooting stars. A fixed, pointer-events-none
 * overlay tinted in the character's palette; each `signature` maps to a distinct
 * animation defined in avengers.css (all gated by prefers-reduced-motion).
 * Rendered only under the Avengers skin.
 */
export function AvengersEffects(): JSX.Element | null {
  const skin = usePreferences((s) => s.skin);
  const variant = usePreferences((s) => s.skinVariant);
  if (skin !== 'avengers') return null;
  const character = characterById(variant) ?? characterById(DEFAULT_CHARACTER_ID);
  if (!character) return null;

  return (
    <div className="rn-av-fx pointer-events-none fixed inset-0 z-[6] overflow-hidden" aria-hidden="true">
      {character.signature === 'repulsor' && <Repulsor />}
      {character.signature === 'lightning' && <Lightning />}
      {character.signature === 'mystic' && <Mystic />}
      {character.signature === 'smash' && <Smash />}
      {character.signature === 'symbiote' && <Symbiote />}
      {character.signature === 'cosmic' && <Cosmic />}
      {character.signature === 'web' && <Web />}
      {character.signature === 'kinetic' && <Kinetic />}
    </div>
  );
}

/** Iron Man / Ultron — arc-reactor rings pulsing out from the top-right. */
function Repulsor(): JSX.Element {
  return (
    <div className="rn-fx-repulsor">
      <span />
      <span />
      <span />
    </div>
  );
}

/** Thor / Magneto — an occasional sky flash and a jagged bolt. */
function Lightning(): JSX.Element {
  return (
    <>
      <div className="rn-fx-flash" />
      <svg className="rn-fx-bolt" viewBox="0 0 100 200" preserveAspectRatio="none">
        <path d="M58 0 30 90 52 90 24 200 82 78 56 78 78 0Z" fill="hsl(var(--av-energy))" />
      </svg>
    </>
  );
}

/** Doctor Strange / Wanda / Loki / Hela — slow counter-rotating rune rings. */
function Mystic(): JSX.Element {
  return (
    <div className="rn-fx-mystic">
      <svg viewBox="0 0 120 120" className="rn-fx-mystic-a">
        <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--av-energy))" strokeWidth="1" strokeDasharray="2 10" />
        <circle cx="60" cy="60" r="44" fill="none" stroke="hsl(var(--accent))" strokeWidth="0.8" strokeDasharray="1 7" />
      </svg>
      <svg viewBox="0 0 120 120" className="rn-fx-mystic-b">
        <circle cx="60" cy="60" r="34" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="3 9" />
      </svg>
    </div>
  );
}

/** Hulk — periodic shockwave rings from the bottom. */
function Smash(): JSX.Element {
  return (
    <div className="rn-fx-smash">
      <span />
      <span />
    </div>
  );
}

/** Venom — living symbiote tendrils dripping from the top edge. */
function Symbiote(): JSX.Element {
  return (
    <svg className="rn-fx-symbiote" viewBox="0 0 100 30" preserveAspectRatio="none">
      <g fill="hsl(var(--primary))" opacity="0.5">
        <path d="M8 0 Q10 14 8 22 Q6 14 8 0Z" />
        <path d="M26 0 Q29 18 26 27 Q23 18 26 0Z" />
        <path d="M48 0 Q51 12 48 19 Q45 12 48 0Z" />
        <path d="M70 0 Q73 20 70 30 Q67 20 70 0Z" />
        <path d="M90 0 Q92 15 90 23 Q88 15 90 0Z" />
      </g>
    </svg>
  );
}

/** Thanos / Captain Marvel — drifting cosmic glints. */
function Cosmic(): JSX.Element {
  return (
    <div className="rn-fx-cosmic">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

/** Spider-Man — a shimmering web strung across a corner. */
function Web(): JSX.Element {
  return (
    <svg className="rn-fx-web" viewBox="0 0 120 120">
      <g fill="none" stroke="hsl(var(--av-energy))" strokeWidth="0.9">
        <path d="M0 0 L120 45M0 0 L45 120M0 0 L90 90M0 0 L20 120M0 0 L120 20" />
        <path d="M0 0 Q30 12 24 40" />
        <path d="M0 0 Q12 30 40 24" />
        <path d="M0 0 Q52 26 46 66" />
        <path d="M0 0 Q26 52 66 46" />
        <path d="M0 0 Q76 40 70 92" />
        <path d="M0 0 Q40 76 92 70" />
      </g>
    </svg>
  );
}

/** Captain America / Black Widow / Black Panther — fast diagonal energy streaks. */
function Kinetic(): JSX.Element {
  return (
    <div className="rn-fx-kinetic">
      <span />
      <span />
      <span />
    </div>
  );
}
