import { create } from 'zustand';
import { isOnline } from '@infrastructure/net/connectivity';
import { writeKey, writeProvider, writeEnabled } from '@infrastructure/ai/aiConfig';
import {
  randomToken,
  codeChallenge,
  buildAuthUrl,
  parseCallback,
  buildExchangeInit,
  extractKey,
  OPENROUTER_EXCHANGE_URL,
} from '@infrastructure/ai/oauth';
import { useAiSettings } from './aiSettings';

/**
 * "Sign in with your account" for AI, via OpenRouter's PKCE OAuth. The user
 * authorizes on OpenRouter (RNOTE never sees a password); we exchange the
 * returned code for a user-scoped key that spends their own credits, stored
 * locally exactly like a pasted key - so the rest of the app is unchanged. The
 * pasted-key path stays available; this is a second, friendlier option.
 */
const PENDING_KEY = 'rnote.ai.oauth.pending'; // { verifier, state, email }
const ACCOUNT_KEY = 'rnote.ai.account'; // { email, connectedAt }

interface ConnectedAccount {
  provider: 'openrouter';
  email: string;
  connectedAt: number;
}

interface Pending {
  verifier: string;
  state: string;
  email: string;
}

type Status = 'idle' | 'connecting' | 'exchanging' | 'error';

interface AiAccountState {
  account: ConnectedAccount | null;
  status: Status;
  error: string | null;
  /** Begin the OAuth redirect (requires Online). `email` is a local label. */
  connect: (email: string) => Promise<void>;
  /** Finish the redirect: if the URL carries a code, swap it for a key. */
  completeCallback: () => Promise<void>;
  disconnect: () => void;
}

function readAccount(): ConnectedAccount | null {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as Partial<ConnectedAccount>;
    if (typeof obj.email === 'string' && typeof obj.connectedAt === 'number') {
      return { provider: 'openrouter', email: obj.email, connectedAt: obj.connectedAt };
    }
    return null;
  } catch {
    return null;
  }
}

function readPending(): Pending | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as Partial<Pending>;
    if (typeof obj.verifier === 'string' && typeof obj.state === 'string') {
      return { verifier: obj.verifier, state: obj.state, email: obj.email ?? '' };
    }
    return null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode - session only */
  }
}
function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Reflect the freshly-stored key/provider into the reactive AI settings store. */
function refreshAiSettings(): void {
  const ai = useAiSettings.getState();
  ai.setProvider('openrouter'); // re-snapshots (picks up the new key)
  ai.setEnabled(true);
}

export const useAiAccount = create<AiAccountState>((set) => ({
  account: readAccount(),
  status: 'idle',
  error: null,

  connect: async (email) => {
    if (!isOnline()) {
      set({ status: 'error', error: 'Switch to Online to connect an account.' });
      return;
    }
    set({ status: 'connecting', error: null });
    const verifier = randomToken();
    const state = randomToken(16);
    const challenge = await codeChallenge(verifier);
    safeSet(PENDING_KEY, JSON.stringify({ verifier, state, email: email.trim() }));
    const callbackUrl = window.location.origin + window.location.pathname;
    window.location.assign(buildAuthUrl({ callbackUrl, challenge, state }));
  },

  completeCallback: async () => {
    const { code, state } = parseCallback(window.location.search);
    if (!code) return;
    const pending = readPending();
    // Always scrub the code from the URL so a reload can't re-trigger.
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);
    if (!pending || pending.state !== state) {
      set({ status: 'error', error: 'That sign-in link did not match this device. Try again.' });
      safeRemove(PENDING_KEY);
      return;
    }
    set({ status: 'exchanging', error: null });
    try {
      const res = await fetch(OPENROUTER_EXCHANGE_URL, buildExchangeInit(code, pending.verifier));
      const key = extractKey(await res.json().catch(() => null));
      if (!res.ok || !key) {
        set({ status: 'error', error: 'Could not complete the connection. Please try again.' });
        safeRemove(PENDING_KEY);
        return;
      }
      writeKey('openrouter', key);
      writeProvider('openrouter');
      writeEnabled(true);
      const account: ConnectedAccount = {
        provider: 'openrouter',
        email: pending.email,
        connectedAt: Date.now(),
      };
      safeSet(ACCOUNT_KEY, JSON.stringify({ email: account.email, connectedAt: account.connectedAt }));
      safeRemove(PENDING_KEY);
      refreshAiSettings();
      set({ account, status: 'idle', error: null });
    } catch {
      set({ status: 'error', error: 'Could not reach OpenRouter. Check your connection and retry.' });
      safeRemove(PENDING_KEY);
    }
  },

  disconnect: () => {
    writeKey('openrouter', '');
    safeRemove(ACCOUNT_KEY);
    safeRemove(PENDING_KEY);
    useAiSettings.getState().setProvider('openrouter'); // re-snapshot (key now empty)
    set({ account: null, status: 'idle', error: null });
  },
}));
