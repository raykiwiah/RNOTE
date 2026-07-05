import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Check,
  AlertCircle,
  Sparkles,
  Download,
  Upload,
  CalendarClock,
  RefreshCw,
  Trash2,
  Bell,
  Wifi,
  CloudOff,
  Lock,
} from 'lucide-react';
import { isWorkspaceBackup } from '@application/documents/backup';
import { NETWORK_CAPABILITIES, capabilitiesEnabled } from '@domain/connectivity';
import { useAiSettings } from '../state/aiSettings';
import { useWorkspace } from '../state/workspace';
import { useCalendar } from '../state/calendar';
import { useConnectivity } from '../state/connectivity';
import { AiConnection } from './AiConnection';
import { cn } from '../lib/cn';
import { downloadFile, pickTextFile } from '../lib/files';
import { markBackedUp } from '../lib/backupState';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Settings - AI (bring-your-own, off by default), auto-organization, and data.
 * Works fully with AI disabled; enabling shows explicit consent copy.
 */
export function SettingsModal({ open, onClose }: SettingsModalProps): JSX.Element | null {
  const s = useAiSettings();
  const buildBackup = useWorkspace((w) => w.buildBackup);
  const restoreBackup = useWorkspace((w) => w.restoreBackup);
  const cal = useCalendar();
  const conn = useConnectivity();
  const offline = conn.effective === 'offline';
  const [calUrl, setCalUrl] = useState('');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const exportBackup = async (): Promise<void> => {
    const backup = await buildBackup();
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(`rnote-backup-${stamp}.json`, JSON.stringify(backup, null, 2));
    markBackedUp();
  };

  const importBackup = async (): Promise<void> => {
    const text = await pickTextFile('application/json,.json');
    if (!text) return;
    try {
      const parsed: unknown = JSON.parse(text);
      if (!isWorkspaceBackup(parsed)) {
        window.alert('That file is not a valid RNOTE backup.');
        return;
      }
      const count = await restoreBackup(parsed);
      window.alert(`Imported ${count} page${count === 1 ? '' : 's'}.`);
    } catch {
      window.alert('Could not read that backup file.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center px-4 py-[6vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <motion.div
        className="absolute inset-0 bg-overlay/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="rn-panel relative flex max-h-[88vh] w-full max-w-[560px] flex-col overflow-hidden shadow-lg"
      >
        <header className="flex items-center gap-2 border-b border-border px-5 py-3.5">
          <span className="text-sm font-semibold text-foreground">Settings</span>
          <button
            type="button"
            aria-label="Close settings"
            onClick={onClose}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-hover hover:text-foreground"
          >
            <X size={16} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {/* Connectivity */}
          <Section
            icon={<Wifi size={15} className="text-primary" />}
            title="Connectivity"
          >
            <p className="text-xs leading-relaxed text-muted-foreground">
              Choose whether RNOTE may use the network. <strong>Offline</strong> keeps everything on
              this device - it also switches on automatically whenever you lose connection.{' '}
              <strong>Online</strong> unlocks the network features below.
            </p>

            <div
              role="radiogroup"
              aria-label="Connectivity mode"
              className="grid grid-cols-2 gap-2"
            >
              <ConnChoice
                selected={conn.preference === 'offline'}
                onClick={() => conn.setPreference('offline')}
                icon={<CloudOff size={16} />}
                title="Offline"
                subtitle="Fully local & private"
              />
              <ConnChoice
                selected={conn.preference === 'online'}
                onClick={() => conn.setPreference('online')}
                icon={<Wifi size={16} />}
                title="Online"
                subtitle="Network features on"
              />
            </div>

            <p
              className={cn(
                'flex items-start gap-2 rounded-lg border px-3 py-2 text-xs leading-relaxed',
                conn.autoOffline
                  ? 'border-warning/40 bg-warning/10 text-foreground'
                  : offline
                    ? 'border-border bg-surface text-muted-foreground'
                    : 'border-success/40 bg-success/10 text-foreground',
              )}
            >
              {conn.autoOffline ? (
                <>
                  <CloudOff size={15} className="mt-0.5 shrink-0 text-warning" />
                  No connection right now - RNOTE is automatically offline. Network features resume
                  the moment you reconnect; your work keeps saving locally.
                </>
              ) : offline ? (
                <>
                  <Lock size={15} className="mt-0.5 shrink-0 text-subtle" />
                  Offline - nothing leaves this device. Everything except the features below works
                  exactly the same.
                </>
              ) : (
                <>
                  <Wifi size={15} className="mt-0.5 shrink-0 text-success" />
                  Online - network features are available.
                </>
              )}
            </p>

            <ul className="flex flex-col gap-1.5">
              {NETWORK_CAPABILITIES.map((c) => {
                const enabled = capabilitiesEnabled(conn.effective);
                return (
                  <li key={c.id} className="flex items-start gap-2 text-xs">
                    <span
                      className={cn(
                        'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                        enabled ? 'bg-success/15 text-success' : 'bg-surface-hover text-subtle',
                      )}
                    >
                      {enabled ? <Check size={11} /> : <Lock size={10} />}
                    </span>
                    <span className={enabled ? 'text-foreground' : 'text-muted-foreground'}>
                      <span className="font-medium">{c.label}</span> - {c.summary}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Section>

          {/* AI */}
          <Section
            icon={<Sparkles size={15} className="text-primary" />}
            title="AI features"
            action={<Toggle checked={s.enabled} onChange={s.setEnabled} label="Enable AI features" />}
          >
            {offline && <OfflineNotice feature="AI" onGoOnline={() => conn.setPreference('online')} />}
            <AiConnection />
          </Section>

          {/* Auto-organization */}
          <Section
            title="Auto-organization"
            action={
              <Toggle
                checked={s.autoOrganize}
                onChange={s.setAutoOrganize}
                label="Enable auto-organization"
              />
            }
          >
            <p className="text-xs leading-relaxed text-muted-foreground">
              Let RNOTE detect categories, projects, people and tags so notes file themselves -
              no folders. Works offline with built-in rules; sharper with AI on.
            </p>
            <Field label={`Ask me below ${s.confidenceThreshold}% confidence`}>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={s.confidenceThreshold}
                onChange={(e) => s.setConfidenceThreshold(Number(e.target.value))}
                aria-label="Confidence threshold"
                className="w-full accent-[hsl(var(--primary))]"
              />
            </Field>
          </Section>

          {/* Calendar */}
          <Section
            icon={<CalendarClock size={15} className="text-primary" />}
            title="Calendar"
            action={
              cal.sources.length > 0 ? (
                <button
                  type="button"
                  onClick={() => void cal.refreshAll()}
                  disabled={cal.syncing}
                  className="flex h-7 items-center gap-1.5 rounded-md border border-border px-2 text-xs text-muted-foreground transition hover:bg-surface-hover disabled:opacity-50"
                >
                  <RefreshCw size={12} className={cal.syncing ? 'animate-spin' : undefined} />
                  Refresh
                </button>
              ) : undefined
            }
          >
            {offline && <OfflineNotice feature="Calendar sync" onGoOnline={() => conn.setPreference('online')} />}
            <p className="text-xs leading-relaxed text-muted-foreground">
              Connect a calendar so RNOTE shows today&apos;s agenda on Home and reminds you before
              events. Paste a calendar link (.ics), or import an exported .ics file - everything
              stays on this device.
            </p>

            {cal.sources.length > 0 && (
              <ul className="space-y-1.5">
                {cal.sources.map((source) => (
                  <li
                    key={source.id}
                    className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-foreground">{source.name}</span>
                      <span className="block text-[11px] text-subtle">
                        {source.eventCount} events · synced {new Date(source.lastSync).toLocaleString()}
                        {source.url ? '' : ' · file import'}
                      </span>
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${source.name}`}
                      onClick={() => void cal.removeSource(source.id)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-subtle hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center gap-2">
              <input
                value={calUrl}
                onChange={(e) => setCalUrl(e.target.value)}
                placeholder="https://…/calendar.ics"
                spellCheck={false}
                className="rn-field h-9 min-w-0 flex-1 rounded-md border border-border bg-surface px-2.5 text-sm text-foreground outline-none placeholder:text-subtle"
              />
              <button
                type="button"
                disabled={cal.syncing || calUrl.trim().length < 8}
                onClick={() => {
                  void cal.addUrlSource(calUrl).then((ok2) => {
                    if (ok2) setCalUrl('');
                  });
                }}
                className="h-9 shrink-0 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
              >
                {cal.syncing ? 'Adding…' : 'Add'}
              </button>
              <button
                type="button"
                disabled={cal.syncing}
                onClick={() => {
                  void (async () => {
                    const text = await pickTextFile('text/calendar,.ics');
                    if (text) await cal.importIcsFile('Imported calendar.ics', text);
                  })();
                }}
                className="h-9 shrink-0 rounded-md border border-border px-3 text-sm text-foreground transition hover:bg-surface-hover disabled:opacity-40"
              >
                Import file…
              </button>
            </div>
            {cal.error && (
              <p className="flex items-start gap-1.5 text-xs text-danger">
                <AlertCircle size={13} className="mt-0.5 shrink-0" /> {cal.error}
              </p>
            )}

            <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
              <span className="flex items-center gap-2 text-sm text-foreground">
                <Bell size={14} className="text-muted-foreground" />
                Remind me 15 minutes before events
              </span>
              <Toggle
                checked={cal.notifyEnabled}
                onChange={(on) => void cal.setNotifyEnabled(on)}
                label="Event reminders"
              />
            </div>
          </Section>

          {/* Data */}
          <Section title="Data">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Everything lives in this browser. Export a backup regularly so you never lose it.
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void exportBackup()}
                className="flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-foreground transition hover:bg-surface-hover"
              >
                <Download size={15} /> Export backup (.json)
              </button>
              <button
                type="button"
                onClick={() => void importBackup()}
                className="flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-foreground transition hover:bg-surface-hover"
              >
                <Upload size={15} /> Import backup…
              </button>
            </div>
          </Section>
        </div>
      </motion.div>
    </div>
  );
}

function Section({
  icon,
  title,
  action,
  children,
}: {
  icon?: ReactNode;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}): JSX.Element {
  return (
    <section className="border-b border-border py-4 first:pt-0 last:border-b-0">
      <div className="mb-2.5 flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action && <span className="ml-auto">{action}</span>}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

/** One choice in the Offline/Online segmented control. */
function ConnChoice({
  selected,
  onClick,
  icon,
  title,
  subtitle,
}: {
  selected: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  subtitle: string;
}): JSX.Element {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors',
        selected
          ? 'border-primary bg-primary/10'
          : 'border-border bg-surface hover:bg-surface-hover',
      )}
    >
      <span className={selected ? 'text-primary' : 'text-muted-foreground'}>{icon}</span>
      <span className="min-w-0">
        <span className={cn('block text-sm font-medium', selected ? 'text-foreground' : 'text-muted-foreground')}>
          {title}
        </span>
        <span className="block text-[11px] text-subtle">{subtitle}</span>
      </span>
    </button>
  );
}

/** Inline banner shown atop a network-only section while the app is offline. */
function OfflineNotice({ feature, onGoOnline }: { feature: string; onGoOnline: () => void }): JSX.Element {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs">
      <CloudOff size={14} className="shrink-0 text-warning" />
      <span className="flex-1 text-foreground">
        {feature} is paused in Offline mode. You can still set it up here.
      </span>
      <button
        type="button"
        onClick={onGoOnline}
        className="shrink-0 rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground transition hover:brightness-110"
      >
        Go Online
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}): JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-surface-hover',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}
