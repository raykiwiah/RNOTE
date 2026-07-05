import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './presentation/app/App';
import { ErrorBoundary } from './presentation/app/ErrorBoundary';
import { useAiAccount } from './presentation/state/aiAccount';
// Token definitions must load before the Tailwind layers that consume them.
import './presentation/theme/tokens.css';
import './presentation/theme/globals.css';

// If we're returning from an OpenRouter sign-in, swap the code for a key before
// the UI settles (no-op on a normal load). Fire-and-forget; it updates state.
void useAiAccount.getState().completeCallback();

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found.');

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
