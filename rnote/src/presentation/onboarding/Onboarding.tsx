import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Briefcase, Sun, Moon, ArrowRight, Check, Wand2, ShieldCheck, CloudOff, Wifi } from 'lucide-react';
import type { ConnectivityPreference } from '@domain/connectivity';
import { usePreferences, type ModeName, type ThemeName } from '../state/preferences';
import { useAiSettings } from '../state/aiSettings';
import { useConnectivity } from '../state/connectivity';
import { Button } from '../components/Button';
import { cn } from '../lib/cn';
import { TermsSheet, TermsDeclined } from './TermsSheet';
import { TERMS_VERSION } from './terms';

const MODES: {
  id: ModeName;
  name: string;
  tagline: string;
  icon: typeof Sparkles;
  chips: string[];
}[] = [
  {
    id: 'millennial',
    name: 'Millennial',
    tagline: 'Calm, minimal, professional.',
    icon: Briefcase,
    chips: ['Muted palette', 'Reduced motion', 'Focus-first'],
  },
  {
    id: 'genz',
    name: 'Gen Z',
    tagline: 'Vibrant, animated, playful.',
    icon: Sparkles,
    chips: ['Bold gradients', 'Delightful motion', 'Gamified'],
  },
];

export function Onboarding(): JSX.Element {
  const initialMode = usePreferences((s) => s.mode);
  const initialTheme = usePreferences((s) => s.theme);
  const setMode = usePreferences((s) => s.setMode);
  const setTheme = usePreferences((s) => s.setTheme);
  const completeOnboarding = usePreferences((s) => s.completeOnboarding);
  const acceptTerms = usePreferences((s) => s.acceptTerms);
  const setAutoOrganize = useAiSettings((s) => s.setAutoOrganize);
  const connectivity = useConnectivity((s) => s.preference);
  const setConnectivity = useConnectivity((s) => s.setPreference);

  const [mode, setLocalMode] = useState<ModeName>(initialMode);
  const [theme, setLocalTheme] = useState<ThemeName>(initialTheme);
  const [autoOrganize, setAutoOrganizeLocal] = useState(false);
  const [name, setName] = useState('');

  // Existing users (onboarded before terms existed) go straight to the terms
  // gate; new users see setup first, then terms. Captured once so it's stable.
  const [alreadyOnboarded] = useState(() => usePreferences.getState().onboarded);
  const [step, setStep] = useState<'setup' | 'terms' | 'declined'>(
    alreadyOnboarded ? 'terms' : 'setup',
  );

  const finish = (): void => {
    setAutoOrganize(autoOrganize);
    completeOnboarding({ mode, theme, name });
  };

  const handleAccept = (): void => {
    acceptTerms(TERMS_VERSION);
    // New users finish onboarding (persist name/mode/theme); already-onboarded
    // users only needed to accept — their existing profile is untouched.
    if (!alreadyOnboarded) finish();
  };

  if (step === 'declined') return <TermsDeclined onReview={() => setStep('terms')} />;
  if (step === 'terms') {
    return (
      <TermsSheet
        onAccept={handleAccept}
        onDecline={() => setStep('declined')}
        onBack={alreadyOnboarded ? undefined : () => setStep('setup')}
      />
    );
  }

  // Apply choices live so the whole screen previews the selection.
  const chooseMode = (m: ModeName): void => {
    setLocalMode(m);
    setMode(m);
  };
  const chooseTheme = (t: ThemeName): void => {
    setLocalTheme(t);
    setTheme(t);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
            <span className="font-display text-2xl font-bold">R</span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Welcome to RNOTE
          </h1>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-muted-foreground">
            Your private, offline-first life OS. Choose how it should feel — you can change this
            anytime. It only changes the look, never the features.
          </p>
        </div>

        {/* Name — so RNOTE can greet you and personalise your notes. */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-7 max-w-xs"
        >
          <label htmlFor="rnote-name" className="mb-1.5 block text-center text-sm font-medium text-muted-foreground">
            What should we call you?
          </label>
          <input
            id="rnote-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setStep('terms');
            }}
            placeholder="Your name"
            autoFocus
            autoComplete="given-name"
            className="rn-field block w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-center text-[15px] text-foreground outline-none placeholder:text-subtle"
          />
        </motion.div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            const selected = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => chooseMode(m.id)}
                className={cn(
                  'group relative overflow-hidden rounded-xl border p-5 text-left transition-all',
                  selected
                    ? 'border-primary bg-primary/5 shadow-glow'
                    : 'border-border bg-surface hover:border-border-strong',
                )}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      selected ? 'bg-primary text-primary-foreground' : 'bg-surface-hover text-muted-foreground',
                    )}
                  >
                    <Icon size={20} />
                  </span>
                  {selected && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    >
                      <Check size={14} strokeWidth={3} />
                    </motion.span>
                  )}
                </div>
                <div className="text-lg font-semibold text-foreground">{m.name}</div>
                <div className="mb-3 text-sm text-muted-foreground">{m.tagline}</div>
                <div className="flex flex-wrap gap-1.5">
                  {m.chips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mb-4 flex items-center justify-center gap-3">
          <span className="text-sm text-muted-foreground">Appearance</span>
          <div className="flex items-center rounded-lg border border-border bg-surface p-0.5">
            {(
              [
                { id: 'light' as ThemeName, label: 'Light', icon: Sun },
                { id: 'dark' as ThemeName, label: 'Dark', icon: Moon },
              ]
            ).map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => chooseTheme(t.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                    theme === t.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon size={14} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Connectivity — the privacy stance, chosen up front (changeable anytime). */}
        <div className="mb-2 flex items-center justify-center gap-3">
          <span className="text-sm text-muted-foreground">Connectivity</span>
          <div className="flex items-center rounded-lg border border-border bg-surface p-0.5">
            {(
              [
                { id: 'offline' as ConnectivityPreference, label: 'Offline', icon: CloudOff },
                { id: 'online' as ConnectivityPreference, label: 'Online', icon: Wifi },
              ]
            ).map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setConnectivity(c.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                    connectivity === c.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon size={14} />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
        <p className="mb-8 text-center text-xs text-subtle">
          Offline keeps everything on this device; Online unlocks AI &amp; calendar sync. Auto-falls
          back to offline whenever you lose connection.
        </p>

        {/* Auto-organization — privacy-forward, defaults off. */}
        <div className="mb-8 rounded-xl border border-border bg-surface p-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Wand2 size={16} />
              </span>
              <span className="text-sm font-semibold text-foreground">Organize my notes automatically</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoOrganize}
              aria-label="Enable AI auto-organization"
              onClick={() => setAutoOrganizeLocal((v) => !v)}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
                autoOrganize ? 'bg-primary' : 'bg-surface-hover',
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  autoOrganize ? 'translate-x-4' : 'translate-x-0.5',
                )}
              />
            </button>
          </div>
          <p className="mt-2 flex gap-2 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck size={24} className="shrink-0 text-success" />
            RNOTE sorts notes into Smart Collections on this device, for free, offline. Turn this on
            to also use AI for sharper labels — you add your own API key in Settings, and nothing is
            sent anywhere until you do.
          </p>
          <AnimatePresence>
            {autoOrganize && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-surface-hover px-3 py-2 text-xs">
                  <span className="text-muted-foreground">“buy oat milk” →</span>
                  {['🛍️ Shopping', '#shopping', '✓ task'].map((chip, i) => (
                    <motion.span
                      key={chip}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + i * 0.08, type: 'spring', stiffness: 400, damping: 24 }}
                      className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-primary"
                    >
                      {chip}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-center">
          <Button variant="primary" size="lg" onClick={() => setStep('terms')} className="min-w-[220px]">
            Continue
            <ArrowRight size={18} />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
