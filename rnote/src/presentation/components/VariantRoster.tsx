import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { usePreferences } from '../state/preferences';
import {
  isVariantSkin,
  variantConfig,
  type VariantGroup,
  type VariantCharacter,
} from '../theme/variants';
import { OPEN_VARIANT_ROSTER_EVENT } from '../lib/events';
import { cn } from '../lib/cn';

/**
 * The character/patron picker for any variant skin (Avengers, Pantheon). It reads
 * the active skin's config from the variants registry — title, groups, roster —
 * so it is fully skin-agnostic. Choosing applies the palette live (the dialog
 * uses the same tokens, so it recolours instantly as a preview). Opened via
 * OPEN_VARIANT_ROSTER_EVENT from the atmosphere switch, onboarding, or settings.
 */
export function VariantRoster(): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const skin = usePreferences((s) => s.skin);
  const skinVariant = usePreferences((s) => s.skinVariant);
  const setSkinVariant = usePreferences((s) => s.setSkinVariant);

  useEffect(() => {
    const onOpen = (): void => setOpen(true);
    window.addEventListener(OPEN_VARIANT_ROSTER_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_VARIANT_ROSTER_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const config = isVariantSkin(skin) ? variantConfig(skin) : undefined;
  if (!open || !config) return null;
  const HeaderIcon = config.groups[0]?.icon;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[8vh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rnote-roster-title"
    >
      <motion.div
        className="absolute inset-0 bg-overlay/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setOpen(false)}
      />
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="rn-panel relative flex max-h-[84vh] w-full max-w-[640px] flex-col overflow-hidden shadow-lg"
      >
        <header className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow">
            {HeaderIcon ? <HeaderIcon size={18} /> : null}
          </span>
          <div className="min-w-0">
            <h2 id="rnote-roster-title" className="font-display text-base font-bold text-foreground">
              {config.pickerTitle}
            </h2>
            <p className="text-xs text-muted-foreground">{config.pickerSubtitle}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-subtle hover:bg-surface-hover hover:text-foreground"
          >
            <X size={17} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {config.groups.map((group, i) => {
            const members = config.characters.filter((c) => c.group === group.id);
            if (members.length === 0) return null;
            return (
              <RosterGroup
                key={group.id}
                group={group}
                characters={members}
                selectedId={skinVariant}
                onPick={(c) => setSkinVariant(c.id)}
                className={i > 0 ? 'mt-6' : undefined}
              />
            );
          })}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
          <span className="text-xs text-subtle">{config.characters.length} to choose from</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-110 active:scale-95"
          >
            Done
          </button>
        </footer>
      </motion.div>
    </div>
  );
}

function RosterGroup({
  group,
  characters,
  selectedId,
  onPick,
  className,
}: {
  group: VariantGroup;
  characters: VariantCharacter[];
  selectedId: string | null;
  onPick: (c: VariantCharacter) => void;
  className?: string;
}): JSX.Element {
  const Icon = group.icon;
  return (
    <section className={className}>
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-subtle">
        <Icon size={12} />
        {group.label}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {characters.map((c) => (
          <CharacterCard
            key={c.id}
            character={c}
            selected={selectedId === c.id}
            onPick={() => onPick(c)}
          />
        ))}
      </div>
    </section>
  );
}

function CharacterCard({
  character,
  selected,
  onPick,
}: {
  character: VariantCharacter;
  selected: boolean;
  onPick: () => void;
}): JSX.Element {
  const primary = character.vars['--primary'];
  const accent = character.vars['--accent'];
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all',
        selected
          ? 'border-transparent ring-2 ring-primary'
          : 'border-border bg-surface hover:border-border-strong hover:bg-surface-hover',
      )}
    >
      <span
        className="relative h-11 w-11 shrink-0 rounded-lg shadow-sm"
        style={{ background: `linear-gradient(135deg, hsl(${primary}), hsl(${accent}))` }}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{character.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{character.alias}</span>
      </span>
      {selected && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          <Check size={14} strokeWidth={3} />
        </motion.span>
      )}
    </button>
  );
}
