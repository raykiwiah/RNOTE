import { useState, type ReactNode } from 'react';
import {
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  ShieldCheck,
  KeyRound,
  LogIn,
  LogOut,
} from 'lucide-react';
import type { AiProviderId } from '@application/ports/AiProvider';
import { getAiProvider } from '@/composition/container';
import { AI_PROVIDER_IDS, PROVIDER_LABELS, DEFAULT_MODELS } from '@infrastructure/ai/aiConfig';
import { useAiSettings } from '../state/aiSettings';
import { useAiAccount } from '../state/aiAccount';
import { useConnectivity } from '../state/connectivity';
import { cn } from '../lib/cn';

type Method = 'key' | 'account';
type TestState = { status: 'idle' | 'testing' } | { status: 'ok' | 'error'; message: string };

/**
 * Two ways to bring your own AI, side by side:
 *  - API key: paste a key for any provider (unchanged).
 *  - Sign in: authorize RNOTE on OpenRouter (PKCE OAuth) - no key to copy, no
 *    password shared, spends your own credits. Both write the same local config.
 */
export function AiConnection(): JSX.Element {
  const account = useAiAccount((a) => a.account);
  const [method, setMethod] = useState<Method>(account ? 'account' : 'key');

  return (
    <>
      <p className="flex gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck size={26} className="shrink-0 text-success" />
        Your note text is sent only to the provider you connect, using your own account. Nothing is
        sent anywhere until you turn this on, and credentials are stored only on this device.
      </p>

      <div role="radiogroup" aria-label="AI connection method" className="grid grid-cols-2 gap-2">
        <MethodChoice
          selected={method === 'key'}
          onClick={() => setMethod('key')}
          icon={<KeyRound size={15} />}
          title="API key"
          subtitle="Paste a key"
        />
        <MethodChoice
          selected={method === 'account'}
          onClick={() => setMethod('account')}
          icon={<LogIn size={15} />}
          title="Sign in"
          subtitle="Authorize an account"
        />
      </div>

      {method === 'key' ? <ApiKeyMethod /> : <AccountMethod />}
    </>
  );
}

// API key
function ApiKeyMethod(): JSX.Element {
  const s = useAiSettings();
  const [showKey, setShowKey] = useState(false);
  const [test, setTest] = useState<TestState>({ status: 'idle' });

  const runTest = async (): Promise<void> => {
    setTest({ status: 'testing' });
    const provider = getAiProvider({ ignoreEnabled: true });
    if (!provider) {
      setTest({ status: 'error', message: 'Enter an API key first.' });
      return;
    }
    const res = await provider.complete({
      messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
      maxTokens: 5,
      temperature: 0,
    });
    if (res.ok) {
      setTest({ status: 'ok', message: `Connected - the model replied "${res.value.trim().slice(0, 40)}".` });
    } else {
      setTest({ status: 'error', message: res.error.message });
    }
  };

  return (
    <>
      <Field label="Provider">
        <select
          value={s.provider}
          onChange={(e) => s.setProvider(e.target.value as AiProviderId)}
          className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm text-foreground outline-none focus:border-border-strong"
        >
          {AI_PROVIDER_IDS.map((id) => (
            <option key={id} value={id}>
              {PROVIDER_LABELS[id]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Model">
        <input
          value={s.model}
          onChange={(e) => s.setModel(e.target.value)}
          placeholder={DEFAULT_MODELS[s.provider]}
          spellCheck={false}
          className="h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-foreground outline-none focus:border-border-strong"
        />
      </Field>

      <Field label="API key">
        <div className="flex items-center gap-2">
          <input
            type={showKey ? 'text' : 'password'}
            value={s.apiKey}
            onChange={(e) => s.setApiKey(e.target.value)}
            placeholder="Paste your key…"
            autoComplete="off"
            spellCheck={false}
            className="h-9 min-w-0 flex-1 rounded-md border border-border bg-surface px-2.5 font-mono text-sm text-foreground outline-none focus:border-border-strong"
          />
          <button
            type="button"
            aria-label={showKey ? 'Hide API key' : 'Show API key'}
            onClick={() => setShowKey((v) => !v)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-surface-hover"
          >
            {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </Field>

      <div className="mt-1 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void runTest()}
          disabled={test.status === 'testing' || !s.apiKey}
          className="flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
        >
          {test.status === 'testing' && <Loader2 size={14} className="animate-spin" />}
          Test connection
        </button>
        {(test.status === 'ok' || test.status === 'error') && (
          <span
            className={cn(
              'flex items-center gap-1.5 text-xs',
              test.status === 'ok' ? 'text-success' : 'text-danger',
            )}
          >
            {test.status === 'ok' ? <Check size={13} /> : <AlertCircle size={13} />}
            {test.message}
          </span>
        )}
      </div>
    </>
  );
}

// Sign in (OpenRouter OAuth)
function AccountMethod(): JSX.Element {
  const account = useAiAccount((a) => a.account);
  const status = useAiAccount((a) => a.status);
  const error = useAiAccount((a) => a.error);
  const connect = useAiAccount((a) => a.connect);
  const disconnect = useAiAccount((a) => a.disconnect);
  const offline = useConnectivity((c) => c.effective === 'offline');
  const [email, setEmail] = useState('');

  if (account) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-success/40 bg-success/10 px-3 py-2.5">
        <Check size={16} className="shrink-0 text-success" />
        <span className="min-w-0 flex-1 text-sm text-foreground">
          Connected to OpenRouter{account.email ? ` as ${account.email}` : ''}.
          <span className="block text-[11px] text-subtle">
            Using your own credits · since {new Date(account.connectedAt).toLocaleDateString()}
          </span>
        </span>
        <button
          type="button"
          onClick={disconnect}
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs text-muted-foreground transition hover:bg-surface-hover hover:text-danger"
        >
          <LogOut size={13} /> Disconnect
        </button>
      </div>
    );
  }

  const busy = status === 'connecting' || status === 'exchanging';

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Authorize RNOTE on OpenRouter to use AI with your own account — no key to copy or store.
        You sign in on OpenRouter’s own page; RNOTE only receives a key scoped to you.
      </p>
      <Field label="Account email (label)">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          spellCheck={false}
          className="h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-foreground outline-none focus:border-border-strong"
        />
      </Field>
      <button
        type="button"
        disabled={offline || busy}
        onClick={() => void connect(email)}
        className="flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
        {status === 'exchanging' ? 'Finishing…' : busy ? 'Redirecting…' : 'Connect OpenRouter account'}
      </button>
      {offline && (
        <p className="text-[11px] text-warning">Switch to Online to connect an account.</p>
      )}
      {error && (
        <p className="flex items-start gap-1.5 text-xs text-danger">
          <AlertCircle size={13} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

// Bits
function MethodChoice({
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
        'flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors',
        selected ? 'border-primary bg-primary/10' : 'border-border bg-surface hover:bg-surface-hover',
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

function Field({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
