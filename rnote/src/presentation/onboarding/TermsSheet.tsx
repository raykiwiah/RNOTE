import { motion } from 'framer-motion';
import { ScrollText, Check, X, ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import {
  TERMS_SECTIONS,
  TERMS_SUMMARY,
  TERMS_VERSION,
  TERMS_EFFECTIVE_DATE,
} from './terms';

interface TermsSheetProps {
  onAccept: () => void;
  onDecline: () => void;
  /** Shown only when the user can return to a previous onboarding step. */
  onBack?: () => void;
}

/**
 * The Terms & Conditions the user reads on first launch. A scrollable sheet with
 * explicit Accept / Decline actions — accepting is required before RNOTE opens.
 */
export function TermsSheet({ onAccept, onDecline, onBack }: TermsSheetProps): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rnote-terms-title"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
            <ScrollText size={26} />
          </div>
          <h1
            id="rnote-terms-title"
            className="font-display text-3xl font-bold tracking-tight text-foreground"
          >
            Terms &amp; Conditions
          </h1>
          <p className="mt-1.5 text-xs text-subtle">
            Version {TERMS_VERSION} · Effective {TERMS_EFFECTIVE_DATE}
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            {TERMS_SUMMARY}
          </p>
        </div>

        <div
          tabIndex={0}
          aria-label="Terms and conditions text"
          className="max-h-[42vh] overflow-y-auto rounded-xl border border-border bg-surface p-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {TERMS_SECTIONS.map((section) => (
            <section key={section.heading} className="mb-4 last:mb-0">
              <h2 className="mb-1 text-sm font-semibold text-foreground">{section.heading}</h2>
              <p className="text-[13px] leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-6 flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={15} />
              Back
            </button>
          ) : (
            <span />
          )}
          <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row">
            <Button variant="secondary" size="lg" onClick={onDecline}>
              <X size={17} />
              Decline
            </Button>
            <Button variant="primary" size="lg" onClick={onAccept} className="min-w-[200px]">
              <Check size={17} />
              Accept &amp; Enter RNOTE
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Shown when a user declines the terms. RNOTE cannot be used without accepting,
 * so this offers a calm explanation and a way back to review them.
 */
export function TermsDeclined({ onReview }: { onReview: () => void }): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md text-center"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-hover text-muted-foreground">
          <ScrollText size={26} strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          You declined the terms
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          RNOTE can’t be opened until the Terms &amp; Conditions are accepted. Nothing has been
          saved. You can review them again whenever you’re ready.
        </p>
        <div className="mt-6 flex justify-center">
          <Button variant="primary" size="lg" onClick={onReview} className="min-w-[200px]">
            Review terms
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
