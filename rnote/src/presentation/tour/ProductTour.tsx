import { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, X, Check } from 'lucide-react';
import { useTour } from '../state/tour';
import { TOUR_STEPS, type TourPlacement } from './tourSteps';

const TOOLTIP_W = 320;
const EST_H = 200;
const GAP = 14;

interface Placed {
  top: number;
  left: number;
  transform?: string;
}

/** Position the coach-mark near the spotlit element, clamped to the viewport. */
function placeTooltip(rect: DOMRect | null, placement: TourPlacement | undefined): Placed {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (!rect || placement === 'center') {
    return { top: vh / 2, left: vw / 2, transform: 'translate(-50%, -50%)' };
  }
  const clampX = (x: number): number => Math.max(GAP, Math.min(x, vw - TOOLTIP_W - GAP));
  const clampY = (y: number): number => Math.max(GAP, Math.min(y, vh - EST_H - GAP));
  switch (placement) {
    case 'right':
      return { top: clampY(rect.top), left: clampX(rect.right + GAP) };
    case 'left':
      return { top: clampY(rect.top), left: clampX(rect.left - GAP - TOOLTIP_W) };
    case 'top':
      return { top: clampY(rect.top - GAP - EST_H), left: clampX(rect.left) };
    case 'bottom':
    default:
      return { top: clampY(rect.bottom + GAP), left: clampX(rect.left) };
  }
}

function isOnScreen(r: DOMRect): boolean {
  return (
    r.width > 0 &&
    r.height > 0 &&
    r.right > 0 &&
    r.bottom > 0 &&
    r.left < window.innerWidth &&
    r.top < window.innerHeight
  );
}

/**
 * The first-run product tour overlay: dims the app, spotlights one element at a
 * time, and explains it in a coach-mark with Back / Next / Skip. Steps without a
 * target (or whose target is off-screen, e.g. a collapsed mobile sidebar) render
 * centred so the guidance is never lost.
 */
export function ProductTour(): JSX.Element | null {
  const active = useTour((s) => s.active);
  const index = useTour((s) => s.index);
  const next = useTour((s) => s.next);
  const prev = useTour((s) => s.prev);
  const skip = useTour((s) => s.skip);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = TOUR_STEPS[index];

  useLayoutEffect(() => {
    if (!active || !step) return undefined;
    if (!step.target) {
      setRect(null);
      return undefined;
    }
    let raf = 0;
    const measure = (): void => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      if (!el) {
        setRect(null);
        return;
      }
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      const r = el.getBoundingClientRect();
      setRect(isOnScreen(r) ? r : null);
    };
    measure();
    raf = requestAnimationFrame(measure); // re-measure once scrolling settles
    const onChange = (): void => measure();
    window.addEventListener('resize', onChange);
    window.addEventListener('scroll', onChange, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onChange);
      window.removeEventListener('scroll', onChange, true);
    };
  }, [active, index, step]);

  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') skip();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, next, prev, skip]);

  if (!active || !step) return null;

  const isLast = index === TOUR_STEPS.length - 1;
  const pad = 6;
  const pos = placeTooltip(rect, step.placement);

  return createPortal(
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-label="Product tour">
      {/* Interaction blocker + dimmer. When a target is spotlit, the box-shadow
          cutout dims everything except its rectangle; otherwise a flat scrim. */}
      {rect ? (
        <motion.div
          aria-hidden
          initial={false}
          animate={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
          transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          className="pointer-events-none absolute rounded-lg ring-2 ring-primary"
          style={{ boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.62)' }}
        />
      ) : (
        <div className="absolute inset-0 bg-overlay/70" aria-hidden />
      )}

      {/* Catches clicks on the dimmed area so the app underneath stays inert. */}
      <div className="absolute inset-0" aria-hidden />

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, scale: 0.96, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 6 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          style={{ position: 'absolute', top: pos.top, left: pos.left, transform: pos.transform, width: TOOLTIP_W }}
          className="max-w-[calc(100vw-28px)] rounded-xl border border-border bg-surface p-4 shadow-xl"
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              Step {index + 1} of {TOUR_STEPS.length}
            </span>
            <button
              type="button"
              onClick={skip}
              aria-label="Skip tour"
              className="flex h-6 w-6 items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <X size={14} />
            </button>
          </div>

          <h2 className="text-base font-semibold text-foreground">{step.title}</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{step.body}</p>

          <div className="mt-3.5 flex items-center gap-2">
            <div className="flex flex-1 items-center gap-1" aria-hidden>
              {TOUR_STEPS.map((s, i) => (
                <span
                  key={s.id}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? 'w-4 bg-primary' : 'w-1.5 bg-border'
                  }`}
                />
              ))}
            </div>
            {index > 0 && (
              <button
                type="button"
                onClick={prev}
                className="flex h-8 items-center gap-1 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                <ArrowLeft size={15} />
                Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:brightness-110"
            >
              {isLast ? (
                <>
                  Done
                  <Check size={15} />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>

          {index === 0 && (
            <button
              type="button"
              onClick={skip}
              className="mt-2 w-full text-center text-xs text-subtle transition-colors hover:text-muted-foreground"
            >
              Skip the tour
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body,
  );
}
