import { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Sparkles,
  Trash2,
  Home as HomeIcon,
  CalendarDays,
  Settings,
  History,
  Anchor,
  Sun,
  Compass,
  Telescope,
  Feather,
  Skull,
  Landmark,
} from 'lucide-react';
import { useWorkspace } from '../state/workspace';
import { usePreferences } from '../state/preferences';
import { useConnectivity } from '../state/connectivity';
import { useLexicon } from '../theme/lexicon';
import { DocTreeItem } from './DocTreeItem';
import { SmartCollections } from './SmartCollections';
import { Kbd } from '../components/Kbd';
import { ThemeModeControls } from '../components/ThemeModeControls';
import { ConnectivityControls } from '../components/ConnectivityControls';
import { AtmosphereControls } from '../components/AtmosphereControls';
import { OdysseusVoyagePanel } from '../components/OdysseusVoyagePanel';
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
  const skin = usePreferences((s) => s.skin);
  const effective = useConnectivity((s) => s.effective);
  const autoOffline = useConnectivity((s) => s.autoOffline);
  const [trashOpen, setTrashOpen] = useState(false);
  const t = useLexicon();

  // Under Odysseus, generic icons become refined mythology symbols.
  const ody = skin === 'odysseus';
  const IHome = ody ? Anchor : HomeIcon;
  const IToday = ody ? Sun : CalendarDays;
  const ITime = ody ? Compass : History;
  const ISearch = ody ? Telescope : Search;
  const INew = ody ? Feather : Plus;
  const ITrash = ody ? Skull : Trash2;
  const ISettings = ody ? Landmark : Settings;

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
          <IHome size={15} className="relative" />
          <span className="relative flex-1 text-left">{t('nav.home')}</span>
        </button>
        <button
          type="button"
          onClick={() => void openToday()}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface-hover"
        >
          <IToday size={15} />
          <span className="flex-1 text-left">{t('nav.today')}</span>
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
          <ITime size={15} className="relative" />
          <span className="relative flex-1 text-left">{t('nav.timeMachine')}</span>
        </button>
        <button
          type="button"
          data-tour="search"
          onClick={onOpenSearch}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface-hover"
        >
          <ISearch size={15} />
          <span className="flex-1 text-left">{t('nav.search')}</span>
          <Kbd>{modLabel('K')}</Kbd>
        </button>
        <button
          type="button"
          data-tour="new-page"
          onClick={() => createDocument(null)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface-hover"
        >
          <INew size={15} />
          <span className="flex-1 text-left">{t('nav.newPage')}</span>
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-4">
        <SmartCollections />

        <div className="mt-1 px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wide text-subtle">
          {t('nav.private')}
        </div>
        <nav aria-label="Pages" data-tour="pages" className="px-2">
          {tree.length === 0 ? (
            <p className="px-2 py-3 text-xs text-subtle">{t('empty.noPages')}</p>
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

        {/* Fills the quiet stretch of the sidebar with an Odyssey sea-chart. */}
        {ody && <OdysseusVoyagePanel />}
      </div>

      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={() => setTrashOpen(true)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface-hover"
        >
          <ITrash size={15} />
          <span className="flex-1 text-left">{t('nav.trash')}</span>
        </button>
        <button
          type="button"
          data-tour="settings"
          onClick={() => emit(OPEN_SETTINGS_EVENT)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface-hover"
        >
          <ISettings size={15} />
          <span className="flex-1 text-left">{t('nav.settings')}</span>
        </button>
        <div className="px-1 pt-2" data-tour="connectivity">
          <ConnectivityControls />
        </div>
        <div className="px-1 pt-2" data-tour="mode">
          <ThemeModeControls />
        </div>
        <div className="flex items-center justify-between px-1 pt-2" data-tour="atmosphere">
          <span className="text-[10px] font-medium uppercase tracking-wide text-subtle">
            Atmosphere
          </span>
          <AtmosphereControls />
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
