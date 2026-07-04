import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Sun,
  Moon,
  Sparkles,
  FileText,
  CornerDownLeft,
  Download,
  Upload,
  FileDown,
  LayoutTemplate,
  Maximize2,
  BookOpen,
  Settings,
  History,
  Table2,
  Zap,
} from 'lucide-react';
import type { DocumentTreeNode } from '@application/dto';
import { isWorkspaceBackup } from '@application/documents/backup';
import { useWorkspace } from '../state/workspace';
import { useViewMode } from '../state/viewMode';
import { usePreferences } from '../state/preferences';
import { Kbd } from '../components/Kbd';
import { cn } from '../lib/cn';
import { downloadFile, pickTextFile, slugify } from '../lib/files';
import { modLabel } from '../lib/platform';
import { richDocToMarkdown } from '../lib/markdown';
import { emit, OPEN_TEMPLATES_EVENT, OPEN_CAPTURE_EVENT, OPEN_SETTINGS_EVENT } from '../lib/events';
import { TEMPLATES, TABLE_TEMPLATE_ID } from '../templates/templates';
import { markBackedUp } from '../lib/backupState';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface CommandItem {
  key: string;
  group: 'Pages' | 'Actions';
  icon: ReactNode;
  title: string;
  subtitle?: string;
  run: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps): JSX.Element | null {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const tree = useWorkspace((s) => s.tree);
  const openDoc = useWorkspace((s) => s.open);
  const createDocument = useWorkspace((s) => s.createDocument);
  const search = useWorkspace((s) => s.search);
  const openTimeline = useWorkspace((s) => s.openTimeline);
  const mode = usePreferences((s) => s.mode);
  const theme = usePreferences((s) => s.theme);
  const toggleTheme = usePreferences((s) => s.toggleTheme);
  const setMode = usePreferences((s) => s.setMode);
  const reading = useViewMode((s) => s.reading);
  const focus = useViewMode((s) => s.focus);
  const toggleFocus = useViewMode((s) => s.toggleFocus);
  const toggleReading = useViewMode((s) => s.toggleReading);

  useEffect(() => {
    if (open) {
      setQuery('');
      setIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const items = useMemo<CommandItem[]>(() => {
    const q = query.trim();

    const allActions: CommandItem[] = [
      {
        key: 'new-page',
        group: 'Actions',
        icon: <Plus size={16} />,
        title: 'Create new page',
        run: () => void createDocument(null),
      },
      {
        key: 'new-from-template',
        group: 'Actions',
        icon: <LayoutTemplate size={16} />,
        title: 'New page from template…',
        run: () => emit(OPEN_TEMPLATES_EVENT),
      },
      {
        key: 'new-table',
        group: 'Actions',
        icon: <Table2 size={16} />,
        title: 'New table',
        subtitle: 'A database with typed columns',
        run: () => {
          const table = TEMPLATES.find((t) => t.id === TABLE_TEMPLATE_ID);
          if (table) void useWorkspace.getState().createFromTemplate(table);
        },
      },
      {
        key: 'quick-capture',
        group: 'Actions',
        icon: <Zap size={16} />,
        title: 'Quick capture',
        run: () => emit(OPEN_CAPTURE_EVENT),
      },
      {
        key: 'toggle-theme',
        group: 'Actions',
        icon: theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />,
        title: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        run: toggleTheme,
      },
      {
        key: 'switch-mode',
        group: 'Actions',
        icon: <Sparkles size={16} />,
        title: mode === 'genz' ? 'Switch to Millennial mode' : 'Switch to Gen Z mode',
        run: () => setMode(mode === 'genz' ? 'millennial' : 'genz'),
      },
      {
        key: 'toggle-focus',
        group: 'Actions',
        icon: <Maximize2 size={16} />,
        title: focus ? 'Exit focus mode' : 'Enter focus mode',
        subtitle: `Immersive writing · ${modLabel('.')}`,
        run: toggleFocus,
      },
      {
        key: 'toggle-reading',
        group: 'Actions',
        icon: <BookOpen size={16} />,
        title: reading ? 'Exit reading mode' : 'Enter reading mode',
        subtitle: 'Distraction-free, read-only',
        run: toggleReading,
      },
      {
        key: 'time-machine',
        group: 'Actions',
        icon: <History size={16} />,
        title: 'Open Time Machine',
        subtitle: 'Travel through your history',
        run: () => openTimeline(),
      },
      {
        key: 'open-settings',
        group: 'Actions',
        icon: <Settings size={16} />,
        title: 'Settings',
        subtitle: 'AI, auto-organization, data',
        run: () => emit(OPEN_SETTINGS_EVENT),
      },
      {
        key: 'export-backup',
        group: 'Actions',
        icon: <Download size={16} />,
        title: 'Export backup (.json)',
        run: async () => {
          const backup = await useWorkspace.getState().buildBackup();
          const stamp = new Date().toISOString().slice(0, 10);
          downloadFile(`rnote-backup-${stamp}.json`, JSON.stringify(backup, null, 2));
          markBackedUp();
        },
      },
      {
        key: 'import-backup',
        group: 'Actions',
        icon: <Upload size={16} />,
        title: 'Import backup…',
        run: async () => {
          const text = await pickTextFile('application/json,.json');
          if (!text) return;
          try {
            const parsed: unknown = JSON.parse(text);
            if (!isWorkspaceBackup(parsed)) {
              window.alert('That file is not a valid RNOTE backup.');
              return;
            }
            const count = await useWorkspace.getState().restoreBackup(parsed);
            window.alert(`Imported ${count} page${count === 1 ? '' : 's'}.`);
          } catch {
            window.alert('Could not read that backup file.');
          }
        },
      },
      {
        key: 'export-markdown',
        group: 'Actions',
        icon: <FileDown size={16} />,
        title: 'Export current page as Markdown',
        run: () => {
          const doc = useWorkspace.getState().activeDoc;
          if (!doc) return;
          downloadFile(`${slugify(doc.title)}.md`, richDocToMarkdown(doc.content), 'text/markdown');
        },
      },
    ];
    const actions = allActions.filter(
      (a) => q.length === 0 || a.title.toLowerCase().includes(q.toLowerCase()),
    );

    const pages: CommandItem[] = q
      ? search(q).map((hit) => ({
          key: hit.id,
          group: 'Pages' as const,
          icon: <FileText size={16} />,
          title: hit.title,
          subtitle: hit.snippet,
          run: () => void openDoc(hit.id),
        }))
      : flattenTree(tree)
          .slice(0, 8)
          .map((node) => ({
            key: node.id,
            group: 'Pages' as const,
            icon: node.icon ? <span className="text-base leading-none">{node.icon}</span> : <FileText size={16} />,
            title: node.title,
            run: () => void openDoc(node.id),
          }));

    return q ? [...pages, ...actions] : [...actions, ...pages];
  }, [
    query,
    tree,
    mode,
    theme,
    focus,
    reading,
    search,
    createDocument,
    openDoc,
    setMode,
    toggleTheme,
    toggleFocus,
    toggleReading,
    openTimeline,
  ]);

  useEffect(() => {
    setIndex(0);
  }, [query]);

  useEffect(() => {
    const active = listRef.current?.children[index] as HTMLElement | undefined;
    active?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  if (!open) return null;

  const runItem = (item: CommandItem | undefined): void => {
    if (!item) return;
    item.run();
    onClose();
  };

  const onKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIndex((i) => (items.length ? (i + 1) % items.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIndex((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      runItem(items[index]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <motion.div
        className="absolute inset-0 bg-overlay/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="rn-panel relative w-full max-w-[600px] overflow-hidden shadow-lg"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search size={18} className="shrink-0 text-subtle" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages or type a command…"
            className="h-12 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-subtle"
          />
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {items.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No results for “{query}”
            </div>
          ) : (
            items.map((item, i) => {
              const showHeader = i === 0 || items[i - 1]?.group !== item.group;
              return (
                <div key={item.key}>
                  {showHeader && (
                    <div className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-subtle">
                      {item.group}
                    </div>
                  )}
                  <button
                    type="button"
                    onMouseEnter={() => setIndex(i)}
                    onClick={() => runItem(item)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left',
                      i === index ? 'bg-primary/10' : 'hover:bg-surface-hover',
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground">
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-foreground">{item.title}</span>
                      {item.subtitle && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.subtitle}
                        </span>
                      )}
                    </span>
                    {i === index && <CornerDownLeft size={14} className="shrink-0 text-subtle" />}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[11px] text-subtle">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <Kbd>↵</Kbd> select
          </span>
          <span className="flex items-center gap-1">
            <Kbd>esc</Kbd> close
          </span>
        </div>
      </motion.div>
    </div>
  );
}

function flattenTree(tree: DocumentTreeNode[]): DocumentTreeNode[] {
  const out: DocumentTreeNode[] = [];
  const walk = (nodes: DocumentTreeNode[]): void => {
    for (const node of nodes) {
      out.push(node);
      walk(node.children);
    }
  };
  walk(tree);
  return out;
}
