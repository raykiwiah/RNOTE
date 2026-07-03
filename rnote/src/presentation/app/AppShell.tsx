import { lazy, Suspense, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Zap, Minimize2, BookOpen } from 'lucide-react';
import { Sidebar } from '../sidebar/Sidebar';
import { Topbar } from '../topbar/Topbar';
import { DocumentEditor } from '../editor/DocumentEditor';
import { Home } from '../home/Home';
import { CollectionView } from '../collection/CollectionView';
import { Celebration } from '../gamification/Celebration';
import { useWorkspace } from '../state/workspace';
import { useViewMode } from '../state/viewMode';
import { useHotkey } from '../hooks/useHotkey';
import { IconButton } from '../components/IconButton';
import {
  emit,
  OPEN_TEMPLATES_EVENT,
  OPEN_CAPTURE_EVENT,
  OPEN_SEARCH_EVENT,
  OPEN_SETTINGS_EVENT,
} from '../lib/events';

// Loaded on demand.
const CommandPalette = lazy(() =>
  import('../command-palette/CommandPalette').then((m) => ({ default: m.CommandPalette })),
);
const TemplatePicker = lazy(() =>
  import('../templates/TemplatePicker').then((m) => ({ default: m.TemplatePicker })),
);
const QuickCapture = lazy(() =>
  import('../capture/QuickCapture').then((m) => ({ default: m.QuickCapture })),
);
const SettingsModal = lazy(() =>
  import('../settings/SettingsModal').then((m) => ({ default: m.SettingsModal })),
);

/** The main workspace shell: sidebar · topbar · content, plus overlays. */
export function AppShell(): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const view = useWorkspace((s) => s.view);
  const activeId = useWorkspace((s) => s.activeId);
  const activeCollection = useWorkspace((s) => s.activeCollection);
  const focus = useViewMode((s) => s.focus);
  const reading = useViewMode((s) => s.reading);
  const toggleFocus = useViewMode((s) => s.toggleFocus);
  const toggleReading = useViewMode((s) => s.toggleReading);
  const exitViewMode = useViewMode((s) => s.exit);

  // Immersive writing hides all chrome; only applies on a document surface.
  const immersive = focus && view === 'document';

  useHotkey('k', () => setPaletteOpen((o) => !o), { meta: true, allowInEditable: true });
  useHotkey('\\', () => setSidebarOpen((o) => !o), { meta: true, allowInEditable: true });
  useHotkey('.', () => toggleFocus(), { meta: true, allowInEditable: true });
  useHotkey(
    'Escape',
    () => {
      if (focus && !paletteOpen && !templatesOpen && !captureOpen) exitViewMode();
    },
    { allowInEditable: true },
  );

  // Cross-surface open events for the template gallery, quick capture, and search.
  useEffect(() => {
    const openTemplates = (): void => setTemplatesOpen(true);
    const openCapture = (): void => setCaptureOpen(true);
    const openSearch = (): void => setPaletteOpen(true);
    const openSettings = (): void => setSettingsOpen(true);
    window.addEventListener(OPEN_TEMPLATES_EVENT, openTemplates);
    window.addEventListener(OPEN_CAPTURE_EVENT, openCapture);
    window.addEventListener(OPEN_SEARCH_EVENT, openSearch);
    window.addEventListener(OPEN_SETTINGS_EVENT, openSettings);
    return () => {
      window.removeEventListener(OPEN_TEMPLATES_EVENT, openTemplates);
      window.removeEventListener(OPEN_CAPTURE_EVENT, openCapture);
      window.removeEventListener(OPEN_SEARCH_EVENT, openSearch);
      window.removeEventListener(OPEN_SETTINGS_EVENT, openSettings);
    };
  }, []);

  // On mobile, close the drawer whenever navigation changes the content.
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [activeId, view]);

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <AnimatePresence>
        {!immersive && sidebarOpen && (
          <>
            {/* Scrim — mobile only */}
            <motion.div
              key="scrim"
              className="fixed inset-0 z-40 bg-overlay/50 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            {/* Static column on md+, slide-over drawer on mobile */}
            <motion.div
              key="drawer"
              className="fixed inset-y-0 left-0 z-40 shadow-lg md:relative md:z-auto md:shadow-none"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <Sidebar onOpenSearch={() => setPaletteOpen(true)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        {!immersive && (
          <Topbar
            onOpenSearch={() => setPaletteOpen(true)}
            onToggleSidebar={() => setSidebarOpen((o) => !o)}
          />
        )}
        <main className="min-h-0 flex-1">
          {view === 'home' ? (
            <Home />
          ) : view === 'collection' ? (
            <CollectionView key={`${activeCollection?.kind}:${activeCollection?.label}`} />
          ) : (
            <DocumentEditor />
          )}
        </main>
      </div>

      {/* Immersive-mode controls: a calm, always-reachable exit + reading toggle. */}
      <AnimatePresence>
        {immersive && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rn-panel fixed right-4 top-4 z-30 flex items-center gap-0.5 p-1 shadow-sm"
          >
            <IconButton
              label={reading ? 'Exit reading mode' : 'Reading mode'}
              size="sm"
              onClick={() => toggleReading()}
              className={reading ? 'text-primary' : undefined}
            >
              <BookOpen size={16} />
            </IconButton>
            <IconButton label="Exit focus mode" size="sm" onClick={() => exitViewMode()}>
              <Minimize2 size={16} />
            </IconButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating quick-capture button (hidden while writing in focus mode) */}
      {!immersive && (
        <button
          type="button"
          aria-label="Quick capture"
          onClick={() => emit(OPEN_CAPTURE_EVENT)}
          className="fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:brightness-110 active:scale-95"
        >
          <Zap size={20} />
        </button>
      )}

      <Suspense fallback={null}>
        <AnimatePresence>
          {paletteOpen && <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />}
        </AnimatePresence>
      </Suspense>
      <Suspense fallback={null}>
        {templatesOpen && <TemplatePicker open onClose={() => setTemplatesOpen(false)} />}
      </Suspense>
      <Suspense fallback={null}>
        {captureOpen && <QuickCapture open onClose={() => setCaptureOpen(false)} />}
      </Suspense>
      <Suspense fallback={null}>
        {settingsOpen && <SettingsModal open onClose={() => setSettingsOpen(false)} />}
      </Suspense>

      <Celebration />
    </div>
  );
}
