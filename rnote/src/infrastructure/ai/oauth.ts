/**
 * OpenRouter OAuth (PKCE) - "sign in with your account" instead of pasting a
 * raw API key. This is the one AI connection that works from a static,
 * backend-less app: PKCE needs no client secret, the user authorizes on
 * OpenRouter's own site (RNOTE never sees a password), and we exchange the
 * returned code for a user-scoped key that spends the user's own credits.
 *
 * Everything here is pure/deterministic except the two Web Crypto calls, so the
 * URL building, callback parsing and exchange shaping are all unit-testable.
 */
export const OPENROUTER_AUTH_URL = 'https://openrouter.ai/auth';
export const OPENROUTER_EXCHANGE_URL = 'https://openrouter.ai/api/v1/auth/keys';
/** Query param carrying our CSRF/state token through the redirect. */
export const OAUTH_STATE_PARAM = 'rnote_oauth';

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** A URL-safe random token (used for both the PKCE verifier and the state). */
export function randomToken(bytes = 48): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return base64Url(buf);
}

/** S256 code challenge for a verifier (async: uses SubtleCrypto). */
export async function codeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

/** The URL to send the user to so they can authorize RNOTE on OpenRouter. */
export function buildAuthUrl(opts: {
  callbackUrl: string;
  challenge: string;
  state: string;
}): string {
  const url = new URL(OPENROUTER_AUTH_URL);
  // Round-trip our state on the callback URL (OpenRouter echoes it back verbatim).
  const callback = new URL(opts.callbackUrl);
  callback.searchParams.set(OAUTH_STATE_PARAM, opts.state);
  url.searchParams.set('callback_url', callback.toString());
  url.searchParams.set('code_challenge', opts.challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return url.toString();
}

/** Pull `{ code, state }` out of a returned `?...` query string. */
export function parseCallback(search: string): { code: string | null; state: string | null } {
  const params = new URLSearchParams(search);
  return { code: params.get('code'), state: params.get(OAUTH_STATE_PARAM) };
}

/** The fetch init for exchanging an authorization code for an API key. */
export function buildExchangeInit(code: string, verifier: string): RequestInit {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code, code_verifier: verifier, code_challenge_method: 'S256' }),
  };
}

/** Extract the issued key from the exchange response, or null if malformed. */
export function extractKey(json: unknown): string | null {
  if (json && typeof json === 'object' && 'key' in json) {
    const key = (json as { key: unknown }).key;
    if (typeof key === 'string' && key.trim() !== '') return key;
  }
  return null;
}
