import { useCallback, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import type { RichDoc } from '@domain/blocks';
import { countWords } from '@domain/blocks';
import type { DocumentDetail } from '@application/dto';
import { useWorkspace } from '../state/workspace';
import { useViewMode } from '../state/viewMode';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import { cn } from '../lib/cn';
import { Editor } from './Editor';
import { IconPicker } from './IconPicker';
import { OrganizationBar } from './OrganizationBar';

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

  const [title, setTitle] = useState(doc.title);
  const [wordCount, setWordCount] = useState(doc.wordCount);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const debouncedRename = useDebouncedCallback((value: string) => rename(doc.id, value), 500);
  const debouncedSave = useDebouncedCallback((content: RichDoc) => saveContent(doc.id, content), 700);

  const handleContentChange = useCallback(
    (content: RichDoc) => {
      setWordCount(countWords(content));
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
      <div className="mx-auto w-full max-w-[760px] flex-1 px-6 pb-40 pt-14 sm:px-10">
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
          placeholder="Untitled"
          spellCheck={false}
          readOnly={reading}
          aria-label="Page title"
          className="rn-page-title mt-2 w-full resize-none border-none bg-transparent font-display text-[2.4rem] font-bold leading-tight tracking-tight text-foreground outline-none placeholder:text-subtle"
        />

        {!reading && <OrganizationBar docId={doc.id} />}

        <div className="mt-2">
          <Editor initialContent={doc.content} onChange={handleContentChange} editable={!reading} />
        </div>
      </div>

      <footer className="sticky bottom-0 flex items-center justify-between border-t border-border bg-background/80 px-6 py-2 text-xs text-subtle backdrop-blur sm:px-10">
        <span>{wordCount === 1 ? '1 word' : `${wordCount} words`}</span>
        <span className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              saving ? 'bg-warning' : 'bg-success'
            }`}
          />
          {saving ? 'Saving…' : 'Saved locally'}
        </span>
      </footer>
    </div>
  );
}

function EmptyState(): JSX.Element {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-hover text-muted-foreground">
        <FileText size={28} strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-base font-medium text-foreground">No page open</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a page from the sidebar or create a new one.
        </p>
      </div>
    </div>
  );
}
