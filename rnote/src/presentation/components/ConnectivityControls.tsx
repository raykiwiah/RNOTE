import { CloudOff, Wifi } from 'lucide-react';
import { useConnectivity } from '../state/connectivity';
import { cn } from '../lib/cn';
import type { ConnectivityPreference } from '@domain/connectivity';

/**
 * One-tap Online/Offline switch for the sidebar footer - the same idea as the
 * Millennial/Gen Z pill, so the stance is changeable without opening Settings.
 * Bound to the preference; when Online is chosen but the device has no network,
 * the Online segment tints amber to explain the automatic-offline state.
 */
export function ConnectivityControls(): JSX.Element {
  const preference = useConnectivity((s) => s.preference);
  const autoOffline = useConnectivity((s) => s.autoOffline);
  const setPreference = useConnectivity((s) => s.setPreference);

  const options: { value: ConnectivityPreference; label: string; icon: JSX.Element }[] = [
    { value: 'offline', label: 'Offline', icon: <CloudOff size={12} /> },
    { value: 'online', label: 'Online', icon: <Wifi size={12} /> },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Connectivity"
      className="flex items-center rounded-md border border-border bg-background p-0.5"
    >
      {options.map((o) => {
        const selected = preference === o.value;
        const warn = selected && o.value === 'online' && autoOffline;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setPreference(o.value)}
            title={warn ? 'Online chosen, but no connection right now' : `Go ${o.label}`}
            className={cn(
              'flex flex-1 items-center justify-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors',
              selected
                ? warn
                  ? 'bg-warning text-white'
                  : 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
