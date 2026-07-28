import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Skull, X, Check } from 'lucide-react';
import { usePreferences } from '../state/preferences';
import { AVENGERS_CHARACTERS, type AvengersCharacter } from '../theme/avengersRoster';
import { OPEN_AVENGERS_ROSTER_EVENT } from '../lib/events';
import { cn } from '../lib/cn';

/**
 * The Avengers character picker. Choosing a character applies it live — the
 * whole app (and this dialog, which uses the same tokens) recolours instantly —
 * so it doubles as a preview. Opened via OPEN_AVENGERS_ROSTER_EVENT from the
 * atmosphere switch, onboarding, or settings.
 */
export function AvengersRoster(): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const skin = usePreferences((s) => s.skin);
  const skinVariant = usePreferences((s) => s.skinVariant);
  const setSkin = usePreferences((s) => s.setSkin);
  const setSkinVariant = usePreferences((s) => s.setSkinVariant);

  useEffect(() => {
    const onOpen = (): void => setOpen(true);
    window.addEventListener(OPEN_AVENGERS_ROSTER_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_AVENGERS_ROSTER_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const choose = (c: AvengersCharacter): void => {
    // Ensure the skin is active (no-op if already) and set the character.
    if (skin !== 'avengers') setSkin('avengers');
    setSkinVariant(c.id);
  };

  const heroes = AVENGERS_CHARACTERS.filter((c) => c.group === 'hero');
  const villains = AVENGERS_CHARACTERS.filter((c) => c.group === 'villain');

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
            <Shield size={18} />
          </span>
          <div className="min-w-0">
            <h2 id="rnote-roster-title" className="font-display text-base font-bold text-foreground">
              Choose your character
            </h2>
            <p className="text-xs text-muted-foreground">
              Their colours become your RNOTE. Change anytime.
            </p>
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
          <RosterGroup
            label="Heroes"
            icon={Shield}
            characters={heroes}
            selectedId={skin === 'avengers' ? skinVariant : null}
            onPick={choose}
          />
          <RosterGroup
            label="Villains"
            icon={Skull}
            characters={villains}
            selectedId={skin === 'avengers' ? skinVariant : null}
            onPick={choose}
            className="mt-6"
          />
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
          <span className="text-xs text-subtle">
            {AVENGERS_CHARACTERS.length} characters · heroes &amp; villains
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-110 active:scale-95"
          >
            Assemble
          </button>
        </footer>
      </motion.div>
    </div>
  );
}

function RosterGroup({
  label,
  icon: Icon,
  characters,
  selectedId,
  onPick,
  className,
}: {
  label: string;
  icon: typeof Shield;
  characters: AvengersCharacter[];
  selectedId: string | null;
  onPick: (c: AvengersCharacter) => void;
  className?: string;
}): JSX.Element {
  return (
    <section className={className}>
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-subtle">
        <Icon size={12} />
        {label}
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
  character: AvengersCharacter;
  selected: boolean;
  onPick: () => void;
}): JSX.Element {
  const primary = character.vars['--primary'];
  const accent = character.vars['--accent'];
  const groupIcon =
    character.group === 'villain' ? <Skull size={13} /> : <Shield size={13} />;

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
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
        style={{ background: `linear-gradient(135deg, hsl(${primary}), hsl(${accent}))` }}
      >
        <span className="opacity-80">{groupIcon}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">
          {character.name}
        </span>
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
