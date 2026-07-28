/**
 * Original, stylised line-art insignia for each Pantheon patron — the unique
 * symbol that fills their sidebar panel (the myth-skin counterpart of the
 * Odysseus ship / Avengers emblem). Our own simple glyphs evoking each figure,
 * not copyrighted artwork, so the app stays offline-first. Drawn in currentColor
 * (the patron's --primary), with a few highlights in hsl(var(--accent)).
 */

const ACCENT = 'hsl(var(--accent))';

const GLYPHS: Record<string, () => JSX.Element> = {
  // ── Olympians ──
  zeus: () => (
    <path d="M27 5 16 26 24 26 20 43 33 21 25 21 31 5Z" fill="currentColor" stroke="none" />
  ),
  poseidon: () => (
    <>
      <path d="M24 44V15" />
      <path d="M13 19V10M24 15V6M35 19V10" />
      <path d="M13 19H35" />
      <path d="M10 12 13 8 16 12M21 9 24 5 27 9M32 12 35 8 38 12" stroke={ACCENT} strokeWidth="1.6" />
    </>
  ),
  hades: () => (
    <>
      <path d="M24 44V16" />
      <path d="M16 20V11M32 20V11" />
      <path d="M16 20H32" />
      <path d="M13 13 16 8 19 13M29 13 32 8 35 13" stroke={ACCENT} strokeWidth="1.6" />
      <circle cx="24" cy="30" r="2.4" fill={ACCENT} stroke="none" />
    </>
  ),
  athena: () => (
    <>
      <ellipse cx="24" cy="29" rx="9.5" ry="11" />
      <circle cx="20" cy="25" r="4" stroke={ACCENT} />
      <circle cx="28" cy="25" r="4" stroke={ACCENT} />
      <path d="M24 27 22 30 26 30Z" fill={ACCENT} stroke="none" />
      <path d="M16 19 14 12M32 19 34 12" />
    </>
  ),
  apollo: () => (
    <>
      <path d="M16 40 Q9 24 18 11M32 40 Q39 24 30 11" />
      <path d="M18 11 Q24 7 30 11" stroke={ACCENT} />
      <path d="M16 40H32" />
      <path d="M20 15V38M24 14V39M28 15V38" stroke={ACCENT} strokeWidth="1" />
    </>
  ),
  artemis: () => (
    <>
      <path d="M16 9 A9 9 0 1 0 24 23 A7 7 0 1 1 16 9Z" fill={ACCENT} stroke="none" />
      <path d="M22 42 Q13 34 22 26" />
      <path d="M22 26V42" stroke={ACCENT} />
      <path d="M18 34H36M32 31 36 34 32 37" strokeWidth="1.6" />
    </>
  ),
  aphrodite: () => (
    <>
      <path d="M24 40 Q8 40 10 22 Q24 11 38 22 Q40 40 24 40Z" />
      <path d="M24 40V16M18 40 Q17 26 20 18M30 40 Q31 26 28 18M14 38 Q14 27 17 21M34 38 Q34 27 31 21" stroke={ACCENT} strokeWidth="1" />
    </>
  ),
  // ── Heroes & Champions ──
  heracles: () => (
    <>
      <path d="M14 41 L31 18" strokeWidth="4.5" />
      <circle cx="33" cy="15" r="5.5" />
      <circle cx="30" cy="20" r="2.4" stroke={ACCENT} />
      <circle cx="25" cy="26" r="2" stroke={ACCENT} />
    </>
  ),
  perseus: () => (
    <>
      <circle cx="24" cy="24" r="16" />
      <circle cx="24" cy="24" r="10" stroke={ACCENT} />
      <circle cx="24" cy="24" r="3.5" fill={ACCENT} stroke="none" />
      <path d="M14 18 Q20 14 26 15" stroke={ACCENT} strokeWidth="1.4" />
    </>
  ),
  atalanta: () => (
    <>
      <circle cx="24" cy="28" r="12" />
      <path d="M24 16 Q25 10 28 9" />
      <path d="M25 12 Q31 9 30 15 Q25 15 25 12Z" fill={ACCENT} stroke="none" />
      <path d="M18 23 Q20 20 23 20" stroke={ACCENT} strokeWidth="1.2" />
    </>
  ),
  nike: () => (
    <>
      <path d="M24 13V39" strokeWidth="1.6" />
      <path d="M23 17 Q10 15 6 27 Q16 23 22 31" />
      <path d="M25 17 Q38 15 42 27 Q32 23 26 31" />
      <path d="M20 40 Q24 36 28 40" stroke={ACCENT} strokeWidth="1.6" />
    </>
  ),
  // ── Monsters & Titans ──
  medusa: () => (
    <>
      <circle cx="24" cy="27" r="9" />
      <path d="M20 26 22 27M28 26 26 27" stroke={ACCENT} strokeWidth="1.6" />
      <path d="M24 26 22 30 26 30Z" fill={ACCENT} stroke="none" />
      <path d="M17 19 Q12 13 15 7M24 17 Q24 9 19 6M31 19 Q36 13 33 7M16 22 Q9 18 8 11M32 22 Q39 18 40 11" stroke={ACCENT} strokeWidth="1.5" />
    </>
  ),
  minotaur: () => (
    <>
      <path d="M14 22 Q14 35 24 37 Q34 35 34 22" />
      <path d="M14 22 Q7 18 7 11 Q13 15 16 20M34 22 Q41 18 41 11 Q35 15 32 20" />
      <path d="M19 25 21 26M29 25 27 26" stroke={ACCENT} strokeWidth="1.6" />
      <path d="M22 31H23M25 31H26" strokeWidth="2" stroke={ACCENT} />
    </>
  ),
  kronos: () => (
    <>
      <path d="M16 42 Q31 38 34 10" />
      <path d="M34 10 Q19 8 13 17 Q26 15 34 10Z" fill={ACCENT} stroke="none" />
      <path d="M21 40 25 36" />
    </>
  ),
  // ── The Norse ──
  odin: () => (
    <>
      <path d="M24 7 15 24 33 24Z" />
      <path d="M15 15 12 33 30 27Z" stroke={ACCENT} />
      <path d="M33 15 18 27 36 33Z" stroke={ACCENT} />
    </>
  ),
  thor: () => (
    <>
      <rect x="13" y="11" width="22" height="13" rx="2.5" />
      <path d="M24 24V41" strokeWidth="4" />
      <path d="M13 18H35" stroke={ACCENT} strokeWidth="1.4" />
      <path d="M20 14 24 20 28 14" stroke={ACCENT} strokeWidth="1.6" />
    </>
  ),
  freya: () => (
    <>
      <path d="M24 9 A14 14 0 1 1 19.5 9.6" />
      <circle cx="24" cy="9" r="2" fill="currentColor" stroke="none" />
      <circle cx="19" cy="10" r="2" fill="currentColor" stroke="none" />
      <path d="M24 25 20.5 31 24 37 27.5 31Z" fill={ACCENT} stroke="none" />
    </>
  ),
  brynhildr: () => (
    <>
      <path d="M16 35 Q16 18 24 18 Q32 18 32 35Z" />
      <path d="M24 35V22" />
      <path d="M16 26 Q8 22 4 27 Q10 26 14 31M32 26 Q40 22 44 27 Q38 26 34 31" stroke={ACCENT} strokeWidth="1.6" />
    </>
  ),
};

export function GreekEmblem({
  characterId,
  size = 56,
  className,
}: {
  characterId: string;
  size?: number;
  className?: string;
}): JSX.Element {
  const Glyph = GLYPHS[characterId] ?? GLYPHS['zeus']!;
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
