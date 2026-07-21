import type { ReactNode } from 'react';
import { Home as HomeIcon, Search, Zap, History, Menu } from 'lucide-react';
import { useWorkspace } from '../state/workspace';
import { emit, OPEN_CAPTURE_EVENT } from '../lib/events';
import { cn } from '../lib/cn';

interface MobileDockProps {
  onOpenSearch: () => void;
  onOpenSidebar: () => void;
}

/**
 * Bottom action dock for phones — the primary way to move around without the
 * drawer. Desktop keeps the sidebar (this is `md:hidden`).
 */
export function MobileDock({ onOpenSearch, onOpenSidebar }: MobileDockProps): JSX.Element {
  const view = useWorkspace((s) => s.view);
  const showHome = useWorkspace((s) => s.showHome);
  const openTimeline = useWorkspace((s) => s.openTimeline);

  return (
    <nav
      aria-label="Primary"
      className="rn-panel fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 mx-auto flex w-max items-center gap-1 rounded-full px-2 py-1.5 shadow-lg md:hidden"
    >
      <DockButton label="Home" active={view === 'home'} onClick={showHome}>
        <HomeIcon size={19} />
      </DockButton>
      <DockButton label="Search" onClick={onOpenSearch}>
        <Search size={19} />
      </DockButton>

      {/* Prominent quick-capture — gradient in Gen Z via the accent stops. */}
      <button
        type="button"
        aria-label="Quick capture"
        onClick={() => emit(OPEN_CAPTURE_EVENT)}
        className="mx-0.5 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md transition active:scale-95"
      >
        <Zap size={22} />
      </button>

      <DockButton label="Time Machine" active={view === 'timeline'} onClick={openTimeline}>
        <History size={19} />
      </DockButton>
      <DockButton label="Menu" onClick={onOpenSidebar}>
        <Menu size={19} />
      </DockButton>
    </nav>
  );
}

function DockButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}): JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-full transition-colors',
        active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-surface-hover',
      )}
    >
      {children}
    </button>
  );
}
