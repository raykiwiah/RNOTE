import { Search, PanelLeft, Maximize2, BookOpen } from 'lucide-react';
import { useWorkspace } from '../state/workspace';
import { useViewMode } from '../state/viewMode';
import { IconButton } from '../components/IconButton';
import { Kbd } from '../components/Kbd';
import { modLabel } from '../lib/platform';

interface TopbarProps {
  onOpenSearch: () => void;
  onToggleSidebar: () => void;
}

export function Topbar({ onOpenSearch, onToggleSidebar }: TopbarProps): JSX.Element {
  const workspaceName = useWorkspace((s) => s.workspaceName);
  const activeDoc = useWorkspace((s) => s.activeDoc);
  const view = useWorkspace((s) => s.view);
  const activeCollection = useWorkspace((s) => s.activeCollection);
  const reading = useViewMode((s) => s.reading);
  const toggleFocus = useViewMode((s) => s.toggleFocus);
  const toggleReading = useViewMode((s) => s.toggleReading);

  return (
    <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border bg-background/70 px-3 backdrop-blur">
      <IconButton label="Toggle sidebar" size="sm" onClick={onToggleSidebar}>
        <PanelLeft size={16} />
      </IconButton>

      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
        <span className="shrink-0 text-muted-foreground">{workspaceName}</span>
        <span className="text-subtle">/</span>
        {view === 'home' ? (
          <span className="font-medium text-foreground">Home</span>
        ) : view === 'collection' ? (
          <span className="font-medium text-foreground">{activeCollection?.label ?? 'Collection'}</span>
        ) : activeDoc ? (
          <span className="flex min-w-0 items-center gap-1.5 text-foreground">
            {activeDoc.icon && <span className="shrink-0">{activeDoc.icon}</span>}
            <span className="truncate font-medium">{activeDoc.title || 'Untitled'}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">…</span>
        )}
      </nav>

      <div className="ml-auto flex items-center gap-1">
        {view === 'document' && (
          <>
            <IconButton
              label={reading ? 'Exit reading mode' : 'Reading mode'}
              size="sm"
              onClick={() => toggleReading()}
              className={reading ? 'text-primary' : undefined}
            >
              <BookOpen size={16} />
            </IconButton>
            <IconButton label="Focus mode" size="sm" onClick={() => toggleFocus()}>
              <Maximize2 size={16} />
            </IconButton>
          </>
        )}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-surface-hover"
        >
          <Search size={13} />
          <span className="hidden sm:inline">Search</span>
          <Kbd className="hidden sm:inline-flex">{modLabel('K')}</Kbd>
        </button>
      </div>
    </header>
  );
}
