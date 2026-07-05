import { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Sparkles, Trash2, Home as HomeIcon, CalendarDays, Settings, History } from 'lucide-react';
import { useWorkspace } from '../state/workspace';
import { usePreferences } from '../state/preferences';
import { useConnectivity } from '../state/connectivity';
import { DocTreeItem } from './DocTreeItem';
import { SmartCollections } from './SmartCollections';
import { Kbd } from '../components/Kbd';
import { ThemeModeControls } from '../components/ThemeModeControls';
import { ConnectivityControls } from '../components/ConnectivityControls';
import { cn } from '../lib/cn';
import { modLabel } from '../lib/platform';
import { emit, OPEN_SETTINGS_EVENT } from '../lib/events';

const TrashModal = lazy(() =>
  import('../trash/TrashModal').then((m) => ({ default: m.TrashModal })),
);

interface SidebarProps {
  onOpenSearch: () => void;
}

export function Sidebar({ onOpenSearch }: SidebarProps): JSX.Element {
  const workspaceName = useWorkspace((s) => s.workspaceName);
  const tree = useWorkspace((s) => s.tree);
  const createDocument = useWorkspace((s) => s.createDocument);
  const showHome = useWorkspace((s) => s.showHome);
  const openToday = useWorkspace((s) => s.openToday);
  const openTimeline = useWorkspace((s) => s.openTimeline);
  const view = useWorkspace((s) => s.view);
  const mode = usePreferences((s) => s.mode);
  const effective = useConnectivity((s) => s.effective);
  const autoOffline = useConnectivity((s) => s.autoOffline);
  const [trashOpen, setTrashOpen] = useState(false);

  // The workspace stance, shown as a tiny live chip next to the presentation mode.
  const conn =
    effective === 'online'
      ? { label: 'Online', dot: 'bg-success' }
      : autoOffline
        ? { label: 'Offline', dot: 'bg-warning' }
        : { label: 'Local', dot: 'bg-subtle/60' };

  return (
    <aside className="flex h-full w-[264px] shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2.5 px-3.5 pb-2 pt-3.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-glow">
          <span className="font-display text-sm font-bold">R</span>
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">{workspaceName}</div>
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-subtle">
            {mode === 'genz' && <Sparkles size={9} />}
            {mode === 'genz' ? 'Gen Z' : 'Millennial'} ·
            <span className={cn('h-1.5 w-1.5 rounded-full', conn.dot)} aria-hidden />
            {conn.label}
          </div>
        </div>
      </div>

      <div className="px-2.5 pb-1">
        <button
          type="button"
          onClick={showHome}
          className={cn(
            'relative flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
            view === 'home' ? 'text-foreground' : 'text-muted-foreground hover:bg-surface-hover',
          )}
        >
          {view === 'home' && <NavPill />}
          <HomeIcon size={15} className="relative" />
          <span className="relative flex-1 text-left">Home</span>
        </button>
        <button
          type="button"
          onClick={() => void openToday()}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface-hover"
        >
          <CalendarDays size={15} />
          <span className="flex-1 text-left">Today</span>
        </button>
        <button
          type="button"
          onClick={openTimeline}
          className={cn(
            'relative flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
            view === 'timeline' ? 'text-foreground' : 'text-muted-foreground hover:bg-surface-hover',
          )}
        >
          {view === 'timeline' && <NavPill />}
          <History size={15} className="relative" />
          <span className="relative flex-1 text-left">Time Machine</span>
        </button>
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface-hover"
        >
          <Search size={15} />
          <span className="flex-1 text-left">Search</span>
          <Kbd>{modLabel('K')}</Kbd>
        </button>
        <button
          type="button"
          onClick={() => createDocument(null)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface-hover"
        >
          <Plus size={15} />
          <span className="flex-1 text-left">New page</span>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        <SmartCollections />

        <div className="mt-1 px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wide text-subtle">
          Private
        </div>
        <nav aria-label="Pages" className="px-2">
          {tree.length === 0 ? (
            <p className="px-2 py-3 text-xs text-subtle">No pages yet.</p>
          ) : (
            tree.map((node, i) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i, 10) * 0.035, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <DocTreeItem node={node} depth={0} />
              </motion.div>
            ))
          )}
        </nav>
      </div>

      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={() => setTrashOpen(true)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface-hover"
        >
          <Trash2 size={15} />
          <span className="flex-1 text-left">Trash</span>
        </button>
        <button
          type="button"
          onClick={() => emit(OPEN_SETTINGS_EVENT)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface-hover"
        >
          <Settings size={15} />
          <span className="flex-1 text-left">Settings</span>
        </button>
        <div className="px-1 pt-2">
          <ConnectivityControls />
        </div>
        <div className="px-1 pt-2">
          <ThemeModeControls />
        </div>
      </div>

      <Suspense fallback={null}>
        {trashOpen && <TrashModal open onClose={() => setTrashOpen(false)} />}
      </Suspense>
    </aside>
  );
}

/** Shared sliding highlight behind the active nav item (Linear-style). */
function NavPill(): JSX.Element {
  return (
    <motion.span
      layoutId="rn-nav-pill"
      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
      className="absolute inset-0 rounded-md bg-primary/10"
      aria-hidden
    />
  );
}
