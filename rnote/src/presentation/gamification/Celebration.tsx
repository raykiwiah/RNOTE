import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStats } from '../state/gameStats';
import { usePreferences } from '../state/preferences';
import { cue } from '../lib/sound';

const CONFETTI = ['#f59e0b', '#ec4899', '#8b5cf6', '#22c55e', '#3b82f6'];

/**
 * Level-up / achievement toast. Presentation-only: Gen Z gets a celebratory
 * burst; Millennial stays calm and renders nothing. Mounted once by AppShell.
 */
export function Celebration(): JSX.Element | null {
  const celebration = useGameStats((s) => s.celebration);
  const dismiss = useGameStats((s) => s.dismissCelebration);
  const mode = usePreferences((s) => s.mode);

  useEffect(() => {
    if (!celebration) return;
    cue('achievement'); // a lyre flourish under Odysseus (no-op otherwise)
    const timer = window.setTimeout(dismiss, 3800);
    return () => window.clearTimeout(timer);
  }, [celebration, dismiss]);

  if (mode !== 'genz') return null;

  return (
    <AnimatePresence>
      {celebration && (
        <motion.div
          key={`${celebration.title}-${celebration.subtitle}`}
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2"
          role="status"
          aria-live="polite"
        >
          <div className="relative">
            <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center" aria-hidden>
              {CONFETTI.map((color, i) => (
                <motion.span
                  key={color}
                  className="absolute h-2 w-2 rounded-sm"
                  style={{ backgroundColor: color }}
                  initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
                  animate={{ opacity: 0, x: (i - 2) * 36, y: -48 - i * 5, rotate: 200 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="flex items-center gap-3 rounded-xl border border-primary/30 bg-surface px-4 py-2.5 shadow-lg transition hover:border-primary/50"
            >
              <span className="text-2xl" aria-hidden>
                {celebration.icon}
              </span>
              <span className="text-left">
                <span className="block text-sm font-semibold text-foreground">{celebration.title}</span>
                <span className="block text-xs text-muted-foreground">{celebration.subtitle}</span>
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
