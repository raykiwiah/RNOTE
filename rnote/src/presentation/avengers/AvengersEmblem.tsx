/**
 * Original, stylised line-art insignia for each Avengers character — the unique
 * "symbol" that fills the character's sidebar panel (the Avengers equivalent of
 * the Odysseus ship). These are our own simple glyphs evoking each character, not
 * copyrighted artwork, so the app stays offline-first and self-contained.
 *
 * Everything is drawn in `currentColor` (the character's --primary via a
 * text-primary container); a few highlights use hsl(var(--accent)).
 */

const ACCENT = 'hsl(var(--accent))';

// Each entry returns the inner marks for a 48×48 viewBox.
const GLYPHS: Record<string, () => JSX.Element> = {
  'iron-man': () => (
    <>
      <circle cx="24" cy="24" r="17" />
      <circle cx="24" cy="24" r="9" stroke={ACCENT} />
      <path d="M24 17.5 30.5 29 17.5 29Z" stroke={ACCENT} />
      <circle cx="24" cy="25" r="2.4" fill={ACCENT} stroke="none" />
    </>
  ),
  'captain-america': () => (
    <>
      <circle cx="24" cy="24" r="17" />
      <circle cx="24" cy="24" r="11" stroke={ACCENT} />
      <circle cx="24" cy="24" r="5.5" />
      <path
        d="M24 15.5 25.9 21.4 32.1 21.4 27.1 25.1 29 31 24 27.4 19 31 20.9 25.1 15.9 21.4 22.1 21.4Z"
        fill={ACCENT}
        stroke="none"
      />
    </>
  ),
  thor: () => (
    <>
      <rect x="13" y="10" width="22" height="14" rx="3.5" />
      <rect x="21" y="24" width="6" height="15" rx="2.5" />
      <path d="M24 14 21 19 25 19 22 24" stroke={ACCENT} strokeWidth="1.6" />
    </>
  ),
  hulk: () => (
    <>
      <path d="M14 23q0-6 5-6h10q5 0 5 6v9q0 4-4 4H18q-4 0-4-4z" />
      <path d="M18 21v6M23 20v7M28 21v6" strokeWidth="1.6" />
      <path d="M14 27q-4 0-4 3.2 0 3 4 3" />
      <path d="M12 15 15 18M24 12v3M36 15 33 18" stroke={ACCENT} strokeWidth="1.6" />
    </>
  ),
  'black-panther': () => (
    <>
      <path d="M24 13 16.5 8.5 17.5 18M24 13 31.5 8.5 30.5 18" />
      <path d="M14 19q10-6 20 0 2 12-10 20Q12 31 14 19Z" />
      <path d="M19 23 23 25M29 23 25 25" stroke={ACCENT} strokeWidth="1.8" />
      <path d="M24 30v4" strokeWidth="1.6" />
    </>
  ),
  'spider-man': () => (
    <>
      <ellipse cx="24" cy="21" rx="3" ry="4" fill="currentColor" stroke="none" />
      <ellipse cx="24" cy="29" rx="4.4" ry="5.4" fill="currentColor" stroke="none" />
      <path
        d="M21 19 13 13M27 19 35 13M20 23 11 22M28 23 37 22M20 28 12 31M28 28 36 31M21 32 15 38M27 32 33 38"
        strokeWidth="1.5"
        stroke={ACCENT}
      />
    </>
  ),
  'doctor-strange': () => (
    <>
      <circle cx="24" cy="24" r="16" />
      <path d="M10 24q14-10 28 0-14 10-28 0Z" stroke={ACCENT} />
      <circle cx="24" cy="24" r="4.5" />
      <circle cx="24" cy="24" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  'scarlet-witch': () => (
    <>
      <path d="M24 9q15 5 9 20-4 9-13 8" stroke={ACCENT} />
      <path d="M24 39q-15-5-9-20 4-9 13-8" />
      <circle cx="24" cy="24" r="2.4" fill={ACCENT} stroke="none" />
    </>
  ),
  'captain-marvel': () => (
    <>
      <path
        d="M24 7 27 20 40 24 27 28 24 41 21 28 8 24 21 20Z"
        stroke={ACCENT}
      />
      <path d="M24 14 26 22 34 24 26 26 24 34 22 26 14 24 22 22Z" />
    </>
  ),
  'black-widow': () => (
    <>
      <circle cx="24" cy="24" r="16.5" stroke={ACCENT} strokeWidth="1.4" opacity="0.6" />
      <path d="M15 11H33L24 23Z" fill="currentColor" stroke="none" />
      <path d="M15 37H33L24 25Z" fill="currentColor" stroke="none" />
    </>
  ),
  thanos: () => (
    <>
      <path d="M15 23q0-5 4-5h10q4 0 4 5v6q0 9-9 9-9 0-9-9z" />
      <circle cx="18.5" cy="20.5" r="1.8" fill={ACCENT} stroke="none" />
      <circle cx="24" cy="19.5" r="1.8" fill={ACCENT} stroke="none" />
      <circle cx="29.5" cy="20.5" r="1.8" fill={ACCENT} stroke="none" />
      <circle cx="24" cy="30" r="3" fill={ACCENT} stroke="none" />
    </>
  ),
  loki: () => (
    <>
      <path d="M16 35q0-16 8-16 8 0 8 16" />
      <path d="M18.5 21Q11 12 15 5" stroke={ACCENT} />
      <path d="M29.5 21Q37 12 33 5" stroke={ACCENT} />
      <path d="M24 21v14" strokeWidth="1.6" />
    </>
  ),
  ultron: () => (
    <>
      <path d="M14 17q10-8 20 0v10q-10 10-20 0z" />
      <path d="M18 22 22.5 24.5M30 22 25.5 24.5" strokeWidth="1.8" stroke={ACCENT} />
      <path d="M18 30h12M20 33.5h8" strokeWidth="1.5" />
    </>
  ),
  venom: () => (
    <>
      <path d="M11 17 15 23 18 17 21 23 24 17 27 23 30 17 33 23 37 17" stroke={ACCENT} />
      <path d="M12 33 16 27 19 33 22 27 26 33 29 27 32 33 36 27" stroke={ACCENT} />
      <path d="M24 23q2 9 1 15 1-6 3-13" strokeWidth="1.6" />
    </>
  ),
  magneto: () => (
    <>
      <path d="M15 35q-2-21 9-23 11 2 9 23z" />
      <path d="M20 20q4-4 8 0v8q-4 3-8 0z" stroke={ACCENT} />
      <path d="M24 12v-4" strokeWidth="1.6" />
    </>
  ),
  hela: () => (
    <>
      <path d="M15 33q9-4 18 0" />
      <path
        d="M24 30V7M24 13 16 5M24 13 32 5M24 19 12.5 12M24 19 35.5 12M24 25 11 21M24 25 37 21"
        stroke={ACCENT}
        strokeWidth="1.7"
      />
    </>
  ),
};

export function AvengersEmblem({
  characterId,
  size = 56,
  className,
}: {
  characterId: string;
  size?: number;
  className?: string;
}): JSX.Element {
  const Glyph = GLYPHS[characterId] ?? GLYPHS['iron-man']!;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <Glyph />
    </svg>
  );
}
