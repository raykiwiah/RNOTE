import { lazy, Suspense, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { Sidebar } from '../sidebar/Sidebar';
import { Topbar } from '../topbar/Topbar';
import { DocumentEditor } from '../editor/DocumentEditor';
import { Home } from '../home/Home';
import { useWorkspace } from '../state/workspace';
import { useHotkey } from '../hooks/useHotkey';
import { emit, OPEN_TEMPLATES_EVENT, OPEN_CAPTURE_EVENT, OPEN_SEARCH_EVENT } from '../lib/events';

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

/** The main workspace shell: sidebar · topbar · content, plus overlays. */
export function AppShell(): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const view = useWorkspace((s) => s.view);
  const activeId = useWorkspace((s) => s.activeId);

  useHotkey('k', () => setPaletteOpen((o) => !o), { meta: true, allowInEditable: true });
  useHotkey('\\', () => setSidebarOpen((o) => !o), { meta: true, allowInEditable: true });

  // Cross-surface open events for the template gallery, quick capture, and search.
  useEffect(() => {
    const openTemplates = (): void => setTemplatesOpen(true);
    const openCapture = (): void => setCaptureOpen(true);
    const openSearch = (): void => setPaletteOpen(true);
    window.addEventListener(OPEN_TEMPLATES_EVENT, openTemplates);
    window.addEventListener(OPEN_CAPTURE_EVENT, openCapture);
    window.addEventListener(OPEN_SEARCH_EVENT, openSearch);
    return () => {
      window.removeEventListener(OPEN_TEMPLATES_EVENT, openTemplates);
      window.removeEventListener(OPEN_CAPTURE_EVENT, openCapture);
      window.removeEventListener(OPEN_SEARCH_EVENT, openSearch);
    };
  }, []);

  // On mobile, close the drawer whenever navigation changes the content.
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [activeId, view]);

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <AnimatePresence>
        {sidebarOpen && (
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
        <Topbar
          onOpenSearch={() => setPaletteOpen(true)}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
        />
        <main className="min-h-0 flex-1">{view === 'home' ? <Home /> : <DocumentEditor />}</main>
      </div>

      {/* Floating quick-capture button */}
      <button
        type="button"
        aria-label="Quick capture"
        onClick={() => emit(OPEN_CAPTURE_EVENT)}
        className="fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:brightness-110 active:scale-95"
      >
        <Zap size={20} />
      </button>

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
    </div>
  );
}
