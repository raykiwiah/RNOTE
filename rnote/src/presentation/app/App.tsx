import { useEffect, lazy, Suspense } from 'react';
import { usePreferences } from '../state/preferences';
import { useWorkspace } from '../state/workspace';
import { TERMS_VERSION } from '../onboarding/terms';
import { AppShell } from './AppShell';
import { Spinner } from '../components/Spinner';

// Onboarding is shown only on first run, so it is loaded on demand.
const Onboarding = lazy(() =>
  import('../onboarding/Onboarding').then((m) => ({ default: m.Onboarding })),
);

export function App(): JSX.Element {
  const onboarded = usePreferences((s) => s.onboarded);
  const termsAccepted = usePreferences((s) => s.termsAcceptedVersion === TERMS_VERSION);
  const status = useWorkspace((s) => s.status);
  const bootstrap = useWorkspace((s) => s.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // First run — or an existing user who hasn't accepted the current Terms — is
  // routed through onboarding, which ends at the Terms gate.
  if (!onboarded || !termsAccepted) {
    return (
      <Suspense fallback={<BootScreen />}>
        <Onboarding />
      </Suspense>
    );
  }
  if (status !== 'ready') return <BootScreen />;
  return <AppShell />;
}

function BootScreen(): JSX.Element {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
        <span className="font-display text-xl font-bold">R</span>
      </div>
      <Spinner />
    </div>
  );
}
