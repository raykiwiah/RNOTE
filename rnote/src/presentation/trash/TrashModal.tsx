import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, RotateCcw, FileText, X } from 'lucide-react';
import { useWorkspace } from '../state/workspace';
import { cn } from '../lib/cn';

interface TrashModalProps {
  open: boolean;
  onClose: () => void;
}

/** Lists archived ("trashed") pages with restore and permanent-delete actions. */
export function TrashModal({ open, onClose }: TrashModalProps): JSX.Element | null {
  const archived = useWorkspace((s) => s.archived);
  const loadArchived = useWorkspace((s) => s.loadArchived);
  const restore = useWorkspace((s) => s.restore);
  const remove = useWorkspace((s) => s.remove);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      void loadArchived();
      setConfirmId(null);
    }
  }, [open, loadArchived]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Trash"
    >
      <motion.div
        className="absolute inset-0 bg-overlay/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="rn-panel relative w-full max-w-[560px] overflow-hidden shadow-lg"
      >
        <header className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Trash2 size={17} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Trash</h2>
          <span className="text-xs text-subtle">
            {archived.length > 0 && `· ${archived.length}`}
          </span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-subtle hover:bg-surface-hover hover:text-foreground"
          >
            <X size={16} />
          </button>
        </header>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {archived.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-3 py-12 text-center">
              <Trash2 size={26} className="text-subtle" />
              <p className="text-sm text-muted-foreground">Trash is empty</p>
              <p className="text-xs text-subtle">Pages you move to Trash appear here.</p>
            </div>
          ) : (
            archived.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-surface-hover"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground">
                  {doc.icon ? (
                    <span className="text-base leading-none">{doc.icon}</span>
                  ) : (
                    <FileText size={15} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">{doc.title}</span>
                  {doc.preview && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {doc.preview}
                    </span>
                  )}
                </span>

                {confirmId === doc.id ? (
                  <span className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        void remove(doc.id);
                        setConfirmId(null);
                      }}
                      className="rounded-md bg-danger px-2 py-1 text-xs font-medium text-white hover:brightness-110"
                    >
                      Delete forever
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-surface-hover"
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <span className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      aria-label={`Restore ${doc.title}`}
                      title="Restore"
                      onClick={() => void restore(doc.id)}
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-md',
                        'text-subtle hover:bg-surface-hover hover:text-foreground',
                      )}
                    >
                      <RotateCcw size={15} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${doc.title} forever`}
                      title="Delete forever"
                      onClick={() => setConfirmId(doc.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-subtle hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 size={15} />
                    </button>
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
