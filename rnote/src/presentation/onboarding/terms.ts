/**
 * The Terms & Conditions a user must accept before using RNOTE for the first
 * time. Kept as plain data (not markup) so it stays easy to read, translate, and
 * version. Bump TERMS_VERSION whenever the wording changes materially — the app
 * re-prompts for acceptance when the stored version no longer matches.
 */
export const TERMS_VERSION = '1.0';
export const TERMS_EFFECTIVE_DATE = '18 July 2026';

/** A one-line, plain-language summary shown above the full terms. */
export const TERMS_SUMMARY =
  'In short: RNOTE runs on your device, keeps your notes private and local, and ' +
  'never sends anything anywhere unless you switch on an optional online feature ' +
  'yourself. The full terms are below.';

export interface TermsSection {
  heading: string;
  body: string;
}

export const TERMS_SECTIONS: TermsSection[] = [
  {
    heading: '1. Accepting these terms',
    body:
      'By selecting “Accept”, you agree to these Terms & Conditions. If you select ' +
      '“Decline”, you will not be able to use RNOTE. You can stop using RNOTE at any ' +
      'time by clearing its data from your browser.',
  },
  {
    heading: '2. What RNOTE is',
    body:
      'RNOTE is a personal, offline-first productivity app that runs entirely in your ' +
      'web browser. There is no account to create and no central server — by default it ' +
      'works without an internet connection and keeps working while you are offline.',
  },
  {
    heading: '3. Your data stays on your device',
    body:
      'Everything you create in RNOTE — notes, pages, databases, and settings — is ' +
      'stored locally in this browser, on this device. RNOTE does not upload, transmit, ' +
      'collect, sell, or share your content, and it contains no advertising, analytics, ' +
      'or tracking.',
  },
  {
    heading: '4. Backups are your responsibility',
    body:
      'Because your data lives only in this browser, it can be lost if you clear your ' +
      'browser data, use private/incognito mode, uninstall your browser, or your device ' +
      'fails. RNOTE includes an export/backup feature — please back up regularly. RNOTE ' +
      'is not responsible for any loss of data.',
  },
  {
    heading: '5. Optional online features and AI',
    body:
      'Online mode, calendar connections, and AI features are optional and off by ' +
      'default. If you enable them, some data leaves your device: for example, when you ' +
      'connect an AI provider (using your own API key or account), the notes you choose ' +
      'to process are sent to that third-party provider and handled under their terms, ' +
      'using your own credits or subscription. You are responsible for those third-party ' +
      'accounts, costs, and terms; RNOTE is not affiliated with and not responsible for ' +
      'them.',
  },
  {
    heading: '6. Acceptable use',
    body:
      'Use RNOTE only for lawful, personal purposes. You are solely responsible for the ' +
      'content you create and store, and for complying with the laws that apply to you.',
  },
  {
    heading: '7. No warranty',
    body:
      'RNOTE is provided “as is” and “as available”, without warranties of any kind, ' +
      'express or implied — including fitness for a particular purpose or reliability, ' +
      'and without any guarantee that it will be uninterrupted, error-free, or preserve ' +
      'your data.',
  },
  {
    heading: '8. Limitation of liability',
    body:
      'To the maximum extent permitted by law, RNOTE and its authors will not be liable ' +
      'for any indirect, incidental, or consequential damages, or for any loss of data, ' +
      'arising from your use of the app.',
  },
  {
    heading: '9. Changes to these terms',
    body:
      'These terms may be updated as RNOTE evolves. When they change materially, you ' +
      'will be asked to review and accept the new version before continuing to use the app.',
  },
];
