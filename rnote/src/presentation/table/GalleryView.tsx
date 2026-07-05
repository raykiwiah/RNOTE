import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import {
  addRow,
  removeRow,
  updateCell,
  boardColumn,
  primaryColumn,
  filterRows,
  type TableData,
  type TableRow,
  type TableColumn,
  type CellValue,
} from '@domain/table';
import { accentForValue } from './accent';

interface GalleryViewProps {
  table: TableData;
  /** Shared toolbar filter — cards are filtered the same way table rows are. */
  query: string;
  apply: (next: TableData) => void;
}

/**
 * Databases v1.5 — the gallery view. The same rows as visual cards in a
 * responsive grid: an accent header tinted by the row's select value (same hue
 * mapping as board lanes, so identity carries across views), an inline-editable
 * title, and quiet meta chips. A third lens over one dataset — nothing new is
 * stored beyond `view: 'gallery'`.
 */
export function GalleryView({ table, query, apply }: GalleryViewProps): JSX.Element {
  const title = primaryColumn(table);
  const status = boardColumn(table); // used for the accent + status chip, if present
  const rows = filterRows(table.rows, query);

  return (
    <div
      role="list"
      aria-label="Gallery"
      className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3"
    >
      <AnimatePresence initial={false}>
        {rows.map((row) => (
          <GalleryCard
            key={row.id}
            row={row}
            table={table}
            titleColumn={title}
            statusColumn={status}
            onTitle={(value) => title && apply(updateCell(table, row.id, title.id, value))}
            onDelete={() => apply(removeRow(table, row.id))}
          />
        ))}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => apply(addRow(table))}
        className="flex min-h-[120px] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-sm text-subtle transition-colors hover:border-border-strong hover:bg-surface-hover hover:text-foreground"
      >
        <Plus size={16} /> New card
      </button>
    </div>
  );
}

function GalleryCard({
  row,
  table,
  titleColumn,
  statusColumn,
  onTitle,
  onDelete,
}: {
  row: TableRow;
  table: TableData;
  titleColumn: TableColumn | null;
  statusColumn: TableColumn | null;
  onTitle: (value: CellValue) => void;
  onDelete: () => void;
}): JSX.Element {
  const titleValue = titleColumn ? row.cells[titleColumn.id] : null;
  const statusValue = statusColumn ? row.cells[statusColumn.id] : null;
  const hue = statusColumn ? accentForValue(statusColumn.options, statusValue) : null;

  // Up to three other non-empty cells as quiet meta chips.
  const meta = table.columns
    .filter((c) => c.id !== titleColumn?.id && c.id !== statusColumn?.id)
    .map((c) => ({ column: c, value: row.cells[c.id] }))
    .filter(({ column: c, value: v }) =>
      c.type === 'checkbox' ? v === true : v !== null && v !== undefined && v !== '',
    )
    .slice(0, 3);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
      aria-label={typeof titleValue === 'string' && titleValue ? titleValue : 'Untitled card'}
      className="group/gcard overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Accent header — tinted by the row's select value; soft neutral otherwise. */}
      <div
        aria-hidden
        className="h-12 w-full"
        style={{
          background:
            hue === null
              ? 'linear-gradient(135deg, hsl(var(--surface-hover)) 0%, hsl(var(--surface)) 100%)'
              : `linear-gradient(135deg, hsl(${hue} 65% 55% / 0.85) 0%, hsl(${(hue + 40) % 360} 70% 60% / 0.65) 100%)`,
        }}
      />
      <div className="p-2.5">
        <div className="flex items-start gap-1.5">
          <input
            value={typeof titleValue === 'string' ? titleValue : ''}
            onChange={(e) => onTitle(e.target.value || null)}
            placeholder="Untitled"
            aria-label="Card title"
            className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-subtle"
          />
          <button
            type="button"
            aria-label="Delete card"
            onClick={onDelete}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-subtle opacity-0 transition-opacity hover:bg-danger/10 hover:text-danger group-hover/gcard:opacity-100"
          >
            <Trash2 size={12} />
          </button>
        </div>
        {(typeof statusValue === 'string' && statusValue !== '') || meta.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {typeof statusValue === 'string' && statusValue !== '' && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[11px] font-medium"
                style={
                  hue === null
                    ? undefined
                    : { background: `hsl(${hue} 60% 50% / 0.15)`, color: `hsl(${hue} 70% 60%)` }
                }
              >
                {statusValue}
              </span>
            )}
            {meta.map(({ column: c, value: v }) => (
              <span
                key={c.id}
                className="rounded bg-surface-hover px-1.5 py-0.5 text-[11px] text-muted-foreground"
              >
                {c.type === 'checkbox' ? `✓ ${c.name}` : String(v)}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </motion.article>
  );
}
