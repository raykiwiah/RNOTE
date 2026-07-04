import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../lib/cn';

export type ChipTone = 'neutral' | 'primary' | 'success' | 'warning';

const TONES: Record<ChipTone, string> = {
  neutral: 'border-border bg-surface text-muted-foreground',
  primary: 'border-primary/30 bg-primary/10 text-primary',
  success: 'border-success/30 bg-success/10 text-success',
  warning: 'border-warning/40 bg-warning/10 text-warning',
};

interface ChipProps {
  label: string;
  icon?: ReactNode;
  tone?: ChipTone;
  active?: boolean;
  title?: string;
  onClick?: () => void;
  /** Renders a trailing ✕ that fires this instead of onClick. */
  onRemove?: () => void;
}

/**
 * The pill used across organization, collections and timeline filters. A button
 * when interactive (keyboard-reachable, `aria-pressed` when it toggles).
 */
export function Chip({ label, icon, tone = 'neutral', active, title, onClick, onRemove }: ChipProps): JSX.Element {
  const interactive = Boolean(onClick);
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.82 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 520, damping: 28 }}
      whileTap={interactive ? { scale: 0.94 } : undefined}
      className={cn(
        'inline-flex h-7 items-center gap-1 rounded-full border pl-2 text-xs font-medium transition-colors',
        onRemove ? 'pr-1' : 'pr-2.5',
        active ? TONES.primary : TONES[tone],
        interactive && 'hover:border-border-strong hover:text-foreground',
      )}
    >
      {icon && <span className="text-[13px] leading-none">{icon}</span>}
      {interactive ? (
        <button
          type="button"
          onClick={onClick}
          aria-pressed={active}
          title={title ?? label}
          className="max-w-[160px] truncate outline-none"
        >
          {label}
        </button>
      ) : (
        <span className="max-w-[160px] truncate" title={title ?? label}>
          {label}
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${label}`}
          onClick={onRemove}
          className="flex h-5 w-5 items-center justify-center rounded-full text-subtle hover:bg-surface-hover hover:text-danger"
        >
          <X size={12} />
        </button>
      )}
    </motion.span>
  );
}
