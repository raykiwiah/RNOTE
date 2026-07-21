import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import type { DocStats, RichDoc } from '@domain/blocks';
import { documentStats } from '@domain/blocks';
import { isTableDoc, tableFromDoc } from '@domain/table';
import type { DocumentDetail } from '@application/dto';
import { useWorkspace } from '../state/workspace';
import { useViewMode } from '../state/viewMode';
import { usePreferences } from '../state/preferences';
import { useLexicon } from '../theme/lexicon';
import { OdysseusMark } from '../components/OdysseusMark';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import { cn } from '../lib/cn';
import { Editor } from './Editor';
import { IconPicker } from './IconPicker';
import { OrganizationBar } from './OrganizationBar';
import { TableView } from '../table/TableView';

const EMPTY_STATS: DocStats = { words: 0, characters: 0, readingMinutes: 0 };

/** Content pane. Resolves the active document and renders it, or an empty state. */
export function DocumentEditor(): JSX.Element {
  const activeDoc = useWorkspace((s) => s.activeDoc);
  if (!activeDoc) return <EmptyState />;
  // Key by id so switching documents remounts the editor — clean content and
  // an isolated undo history per page.
  return <DocumentEditorInner key={activeDoc.id} doc={activeDoc} />;
}

function DocumentEditorInner({ doc }: { doc: DocumentDetail }): JSX.Element {
  const rename = useWorkspace((s) => s.rename);
  const saveContent = useWorkspace((s) => s.saveContent);
  const setIcon = useWorkspace((s) => s.setIcon);
  const saving = useWorkspace((s) => s.saving);
  const reading = useViewMode((s) => s.reading);
  const t = useLexicon();

  // A "table page" renders the database view instead of the rich-text editor.
  const isTable = useMemo(() => isTableDoc(doc.content), [doc.content]);

  const [title, setTitle] = useState(doc.title);
  const [rows, setRows] = useState(() =>
    isTable ? (tableFromDoc(doc.content)?.rows.length ?? 0) : 0,
  );
  const [stats, setStats] = useState<DocStats>(() =>
    isTable ? EMPTY_STATS : documentStats(doc.content),
  );
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const debouncedRename = useDebouncedCallback((value: string) => rename(doc.id, value), 500);
  const debouncedSave = useDebouncedCallback((content: RichDoc) => saveContent(doc.id, content), 700);

  const handleContentChange = useCallback(
    (content: RichDoc) => {
      const table = tableFromDoc(content);
      if (table) setRows(table.rows.length);
      else setStats(documentStats(content));
      debouncedSave(content);
    },
    [debouncedSave],
  );

  const handleTitleChange = (value: string): void => {
    setTitle(value);
    debouncedRename(value);
    const el = titleRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  return (
    <div className={cn('flex h-full flex-col overflow-y-auto', reading && 'rn-reading')}>
      <div className="rn-doc-page mx-auto w-full max-w-[760px] flex-1 px-6 pb-40 pt-14 sm:px-10">
        <IconPicker value={doc.icon} onChange={(icon) => setIcon(doc.id, icon)} />

        <textarea
          ref={titleRef}
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          onKeyDown={(e) => {
            // Enter in the title should drop into the body, not add a newline.
            if (e.key === 'Enter') {
              e.preventDefault();
              const el = document.querySelector<HTMLElement>('.rn-editor .ProseMirror');
              el?.focus();
            }
          }}
          rows={1}
          placeholder={t('editor.untitled')}
          spellCheck={false}
          readOnly={reading}
          aria-label="Page title"
          className="rn-page-title mt-2 w-full resize-none border-none bg-transparent font-display text-[2.4rem] font-bold leading-tight tracking-tight text-foreground outline-none placeholder:text-subtle"
        />

        {!reading && <OrganizationBar docId={doc.id} />}

        {isTable ? (
          <TableView content={doc.content} onChange={handleContentChange} />
        ) : (
          <div className="mt-2">
            <Editor initialContent={doc.content} onChange={handleContentChange} editable={!reading} />
          </div>
        )}
      </div>

      <footer className="sticky bottom-0 flex items-center justify-between border-t border-border bg-background/80 px-6 py-2 text-xs text-subtle backdrop-blur sm:px-10">
        {isTable ? (
          <span>{`${rows} ${rows === 1 ? 'row' : 'rows'}`}</span>
        ) : (
          <FooterStats stats={stats} />
        )}
        <span className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              saving ? 'bg-warning' : 'bg-success'
            }`}
          />
          {saving ? t('editor.saving') : t('editor.saved')}
        </span>
      </footer>
    </div>
  );
}

/**
 * The footer word count, upgraded to a live "N words · M min read" summary that
 * opens a small insights popover (words · characters · reading time) on click.
 */
function FooterStats({ stats }: { stats: DocStats }): JSX.Element {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const summary =
    stats.words === 0
      ? 'Empty page'
      : `${stats.words.toLocaleString()} ${stats.words === 1 ? 'word' : 'words'} · ${stats.readingMinutes} min read`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Document insights"
        className="rounded-sm tabular-nums outline-none transition-colors hover:text-foreground focus-visible:text-foreground"
      >
        {summary}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute bottom-full left-0 mb-2 w-48 rounded-lg border border-border bg-surface p-3 text-foreground shadow-lg"
          >
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-subtle">
              Insights
            </p>
            <StatRow label="Words" value={stats.words.toLocaleString()} />
            <StatRow label="Characters" value={stats.characters.toLocaleString()} />
            <StatRow
              label="Reading time"
              value={stats.readingMinutes === 0 ? '—' : `~${stats.readingMinutes} min`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex items-center justify-between py-0.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function EmptyState(): JSX.Element {
  const t = useLexicon();
  const odysseus = usePreferences((s) => s.skin) === 'odysseus';
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-hover text-muted-foreground">
        {odysseus ? <OdysseusMark size={40} className="text-primary" /> : <FileText size={28} strokeWidth={1.5} />}
      </div>
      <div>
        <p className="text-base font-medium text-foreground">{t('editor.emptyTitle')}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t('editor.emptyBody')}</p>
      </div>
    </div>
  );
}
