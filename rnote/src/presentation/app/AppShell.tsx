import { lazy, Suspense, useEffect, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { Zap, Minimize2, BookOpen } from 'lucide-react';
import { Sidebar } from '../sidebar/Sidebar';
import { Topbar } from '../topbar/Topbar';
import { DocumentEditor } from '../editor/DocumentEditor';
import { Home } from '../home/Home';
import { CollectionView } from '../collection/CollectionView';
import { TimeMachine } from '../timeline/TimeMachine';
import { MobileDock } from './MobileDock';
import { Celebration } from '../gamification/Celebration';
import { ConnectivityToast } from './ConnectivityToast';
import { AiConnectToast } from './AiConnectToast';
import { ProductTour } from '../tour/ProductTour';
import { useWorkspace } from '../state/workspace';
import { useViewMode } from '../state/viewMode';
import { useCalendar } from '../state/calendar';
import { useTour } from '../state/tour';
import { TOUR_VERSION } from '../tour/tourSteps';
import { useOdysseusRipple } from '../hooks/useOdysseusRipple';
import { useSound } from '../state/sound';
import { usePreferences } from '../state/preferences';
import { startSoundscape, stopSoundscape } from '@infrastructure/audio/soundscape';
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

const MOBILE_QUERY = '(max-width: 767px)';

/** Track the mobile breakpoint reactively (resize + orientation changes). */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = (e: MediaQueryListEvent): void => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isMobile;
}

/** The main workspace shell: sidebar · topbar · content, plus overlays. */
export function AppShell(): JSX.Element {
  const isMobile = useIsMobile();
  useOdysseusRipple();
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
    'n',
    (e) => {
      e.preventDefault();
      setCaptureOpen(true);
    },
    { meta: true, shift: true, allowInEditable: true },
  );
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

  // Calendar reminders: load once, then check for imminent events each minute
  // while the app is open (local notifications - no backend, no tracking).
  useEffect(() => {
    const cal = useCalendar.getState();
    if (cal.sources.length > 0) void cal.load();
    const timer = window.setInterval(() => {
      const state = useCalendar.getState();
      if (state.sources.length === 0) return;
      void state.load().then(() => state.checkNotifications());
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // First-run product tour: auto-start shortly after the workspace mounts,
  // unless the user has already seen or skipped this version.
  const startTour = useTour((s) => s.start);
  const tourSeen = useTour((s) => s.completedVersion === TOUR_VERSION);
  useEffect(() => {
    if (tourSeen || useTour.getState().active) return undefined;
    const t = window.setTimeout(() => {
      if (!useTour.getState().active) startTour();
    }, 700);
    return () => window.clearTimeout(t);
  }, [tourSeen, startTour]);

  // Optional Odysseus ambient sea — only when enabled and on the Odysseus skin.
  const soundEnabled = useSound((s) => s.enabled);
  const odysseus = usePreferences((s) => s.skin) === 'odysseus';
  useEffect(() => {
    if (soundEnabled && odysseus) void startSoundscape();
    else stopSoundscape();
    return () => stopSoundscape();
  }, [soundEnabled, odysseus]);

  return (
    <MotionConfig reducedMotion="user">
    <div className="rn-canvas relative flex h-[100dvh] w-screen overflow-hidden bg-background text-foreground">
      {/* Desktop: a static column, plainly mounted/unmounted (no exit dependency). */}
      {!isMobile && !immersive && sidebarOpen && (
        <Sidebar onOpenSearch={() => setPaletteOpen(true)} />
      )}

      {/* Mobile: an always-mounted slide-over drawer. Animating by state (never
          exit-unmount) guarantees a closed drawer can never leave an invisible
          scrim intercepting taps. */}
      {isMobile && (
        <>
          <motion.div
            initial={false}
            animate={{ opacity: !immersive && sidebarOpen ? 1 : 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-overlay/50 backdrop-blur-sm"
            style={{ pointerEvents: !immersive && sidebarOpen ? 'auto' : 'none' }}
            aria-hidden="true"
          />
          <motion.div
            initial={false}
            animate={{ x: !immersive && sidebarOpen ? 0 : -300 }}
            transition={{ type: 'tween', duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 left-0 z-40 shadow-lg"
            style={{ pointerEvents: !immersive && sidebarOpen ? 'auto' : 'none' }}
            aria-hidden={!(!immersive && sidebarOpen)}
          >
            <Sidebar onOpenSearch={() => setPaletteOpen(true)} />
          </motion.div>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {!immersive && (
          <Topbar
            onOpenSearch={() => setPaletteOpen(true)}
            onToggleSidebar={() => setSidebarOpen((o) => !o)}
          />
        )}
        <main className="relative min-h-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={
                view === 'document'
                  ? `doc:${activeId}`
                  : view === 'collection'
                    ? `col:${activeCollection?.kind}:${activeCollection?.label}`
                    : view
              }
              className="h-full"
              initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {view === 'home' ? (
                <Home />
              ) : view === 'collection' ? (
                <CollectionView />
              ) : view === 'timeline' ? (
                <TimeMachine />
              ) : (
                <DocumentEditor />
              )}
            </motion.div>
          </AnimatePresence>
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

      {/* Desktop: floating quick-capture. Mobile: the bottom dock (below). */}
      {!immersive && (
        <motion.button
          type="button"
          data-tour="capture"
          aria-label="Quick capture"
          onClick={() => emit(OPEN_CAPTURE_EVENT)}
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.1, rotate: 6 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          className="fixed bottom-5 right-5 z-30 hidden h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg md:flex"
        >
          <Zap size={20} />
        </motion.button>
      )}

      {!immersive && (
        <MobileDock
          onOpenSearch={() => setPaletteOpen(true)}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
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
      <ConnectivityToast />
      <AiConnectToast />
      <ProductTour />
      <span className="rn-shooting-star" aria-hidden />
    </div>
    </MotionConfig>
  );
}
