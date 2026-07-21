import { useState } from 'react';

/**
 * A decorative sea-chart that fills the quiet space in the Odysseus sidebar so
 * the "ship" never feels empty. It shows the Great Bear — the constellation
 * Odysseus kept on his left hand as he sailed (Odyssey V) — a small vessel
 * crossing the wine-dark sea toward distant Ithaca, and a line of counsel.
 *
 * Pure inline SVG in currentColor (no asset weight). Only rendered under the
 * Odysseus skin. Gentle motion (ship bob, a twinkling star) lives in
 * odysseus.css and is dropped under prefers-reduced-motion.
 */

// Seven stars of the Great Bear (the Plough / Ursa Major), the navigator's mark.
const BEAR: { x: number; y: number; r: number; bright?: boolean }[] = [
  { x: 40, y: 23, r: 1.5 }, // Alkaid (handle tip)
  { x: 58, y: 18, r: 1.5 }, // Mizar
  { x: 76, y: 20, r: 1.6 }, // Alioth
  { x: 92, y: 26, r: 1.5 }, // Megrez
  { x: 104, y: 14, r: 2.4, bright: true }, // Dubhe (pointer, brightest)
  { x: 110, y: 32, r: 1.8 }, // Merak (pointer)
  { x: 94, y: 40, r: 1.5 }, // Phecda
];
// Edges tracing the handle, then closing the bowl.
const BEAR_LINES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 3],
];

// A few faint stars scattered across the rest of the sky.
const DUST: { x: number; y: number; r: number; o: number }[] = [
  { x: 20, y: 40, r: 0.9, o: 0.5 },
  { x: 138, y: 16, r: 1, o: 0.55 },
  { x: 150, y: 44, r: 0.8, o: 0.4 },
  { x: 168, y: 26, r: 1.1, o: 0.5 },
  { x: 128, y: 52, r: 0.8, o: 0.35 },
  { x: 30, y: 58, r: 0.8, o: 0.4 },
  { x: 190, y: 40, r: 0.9, o: 0.45 },
  { x: 62, y: 46, r: 0.8, o: 0.35 },
];

const LINES = [
  'Keep the Bear on your left hand.',
  'The wine-dark sea awaits.',
  'Steer by the steadfast stars.',
  'Ithaca lies beyond the dawn.',
  'Even the long way home is home.',
  'Sing of the man of twists and turns.',
];

/** A smooth wave built from alternating quadratic curves across the chart. */
function wave(y: number, amp: number): string {
  const seg = 16;
  const count = 14;
  let d = `M0 ${y}`;
  for (let i = 0; i < count; i += 1) {
    d += ` q ${seg / 2} ${i % 2 === 0 ? -amp : amp} ${seg} 0`;
  }
  return d;
}

export function OdysseusVoyagePanel(): JSX.Element {
  // Pick a line once per mount — fresh each session, no running timer.
  const [line] = useState(() => LINES[Math.floor(Math.random() * LINES.length)]);

  return (
    <div className="mt-auto shrink-0 px-3 pb-1 pt-6" aria-hidden="true">
      <div className="rn-ody-chart relative overflow-hidden rounded-xl border border-primary/25 bg-primary/[0.04] px-3 pb-2.5 pt-3 text-primary">
        <svg viewBox="0 0 216 150" className="h-auto w-full" fill="none">
          {/* Constellation lines */}
          <g stroke="currentColor" strokeWidth="0.9" opacity="0.4" strokeLinecap="round">
            {BEAR_LINES.map(([a, b], i) => {
              const p = BEAR[a];
              const q = BEAR[b];
              if (!p || !q) return null;
              return <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} />;
            })}
          </g>
          {/* Constellation + scattered stars */}
          <g fill="currentColor">
            {DUST.map((s, i) => (
              <circle key={`d${i}`} cx={s.x} cy={s.y} r={s.r} opacity={s.o} />
            ))}
            {BEAR.map((s, i) => (
              <circle
                key={`b${i}`}
                cx={s.x}
                cy={s.y}
                r={s.r}
                opacity={s.bright ? 1 : 0.85}
                className={s.bright ? 'rn-ody-twinkle' : undefined}
                style={s.bright ? { transformOrigin: `${s.x}px ${s.y}px` } : undefined}
              />
            ))}
          </g>

          {/* Distant Ithaca on the horizon */}
          <path
            d="M170 100c3-13 8-18 13-18s6 4 8 4c3 0 4-6 8-6 5 0 7 9 8 20z"
            fill="currentColor"
            opacity="0.16"
          />
          {/* Horizon */}
          <line x1="0" y1="100" x2="216" y2="100" stroke="currentColor" strokeWidth="0.75" opacity="0.2" />

          {/* The ship, gently bobbing on the swell */}
          <g className="rn-ody-ship" stroke="currentColor" strokeLinejoin="round" strokeLinecap="round" fill="none">
            <path d="M104 68v34" strokeWidth="1.4" />
            <path d="M104 72c7 2.4 11 6 12.6 11.6-5.2 1.4-9.2 1.4-12.6 0z" strokeWidth="1.4" />
            <path d="M104 75c-5.6 1.8-9 4.4-10.4 8.8 4 1.1 7.4 1.1 10.4 0z" strokeWidth="1.3" opacity="0.8" />
            <path d="M104 68l6.5 2.2-6.5 2.2" strokeWidth="1.2" opacity="0.75" />
            <path d="M87 102h34l-4.4 7.6a4 4 0 0 1-3.5 1.9H94.9a4 4 0 0 1-3.5-1.9z" strokeWidth="1.5" />
          </g>

          {/* Layered swell */}
          <g stroke="currentColor" fill="none" strokeLinecap="round">
            <path d={wave(116, 2.2)} strokeWidth="1.3" opacity="0.5" />
            <path d={wave(125, 2.6)} strokeWidth="1.3" opacity="0.34" />
            <path d={wave(134, 2.2)} strokeWidth="1.2" opacity="0.2" />
          </g>
        </svg>

        <p className="mt-1.5 text-center font-display text-[11px] italic leading-snug text-primary/70">
          {line}
        </p>
      </div>
    </div>
  );
}
