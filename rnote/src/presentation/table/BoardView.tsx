import { useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { Plus, Trash2, ListFilter } from 'lucide-react';
import {
  addColumn,
  addSelectOption,
  addRow,
  removeRow,
  updateCell,
  setGroupBy,
  boardColumn,
  groupRows,
  primaryColumn,
  filterRows,
  type TableData,
  type TableColumn,
  type TableRow,
  type BoardLane,
} from '@domain/table';
import { laneHue } from './accent';
import { cn } from '../lib/cn';

interface BoardViewProps {
  table: TableData;
  /** Shared toolbar filter — cards are filtered the same way table rows are. */
  query: string;
  apply: (next: TableData) => void;
}

/**
 * Databases v1.5 — the board (kanban) view. Lanes are the options of a select
 * column; cards are rows. Moving a card just rewrites that one select cell, so
 * table and board are always two lenses on the same data. Cards fly between
 * lanes with shared layoutIds; drops highlight the target lane.
 */
export function BoardView({ table, query, apply }: BoardViewProps): JSX.Element {
  const column = boardColumn(table);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropLane, setDropLane] = useState<string | null>(null);

  if (!column) return <NeedsSelectColumn table={table} apply={apply} />;

  const title = primaryColumn(table);
  const lanes = groupRows(filterRows(table.rows, query), column);
  const selectColumns = table.columns.filter((c) => c.type === 'select');

  const addCard = (lane: BoardLane): void => {
    let next = addRow(table);
    const created = next.rows[next.rows.length - 1];
    if (created && lane.option !== null) {
      next = updateCell(next, created.id, column.id, lane.option);
    }
    apply(next);
  };

  const dropOn = (lane: BoardLane, rowId: string): void => {
    apply(updateCell(table, rowId, column.id, lane.option));
  };

  return (
    <div>
      {selectColumns.length > 1 && (
        <label className="mb-2 flex w-fit items-center gap-1.5 text-xs text-subtle">
          <ListFilter size={12} />
          Grouped by
          <select
            value={column.id}
            onChange={(e) => apply(setGroupBy(table, e.target.value))}
            aria-label="Group board by"
            className="h-6 cursor-pointer rounded border border-border bg-surface px-1 text-xs text-foreground outline-none"
          >
            {selectColumns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <LayoutGroup>
        <div role="list" aria-label="Board" className="flex items-start gap-3 overflow-x-auto pb-3">
          {lanes.map((lane, index) => {
            const laneKey = lane.option ?? '__none__';
            const hue = lane.option === null ? null : laneHue(index);
            return (
              <section
                key={laneKey}
                role="listitem"
                aria-label={`${lane.option ?? `No ${column.name}`} lane`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDropLane(laneKey);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropLane(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const rowId = e.dataTransfer.getData('text/rn-row');
                  if (rowId) dropOn(lane, rowId);
                  setDropLane(null);
                  setDragging(null);
                }}
                className={cn(
                  'w-[248px] shrink-0 rounded-xl border bg-surface/60 p-2 transition-colors',
                  dropLane === laneKey && dragging
                    ? 'border-primary/60 bg-primary/5'
                    : 'border-border',
                )}
              >
                <header className="mb-2 flex items-center gap-2 px-1">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      background:
                        hue === null ? 'hsl(var(--muted-foreground) / 0.45)' : `hsl(${hue} 62% 52%)`,
                    }}
                  />
                  <h3 className="truncate text-[13px] font-semibold text-foreground">
                    {lane.option ?? `No ${column.name}`}
                  </h3>
                  <span className="ml-auto rounded-full bg-surface-hover px-1.5 text-[11px] tabular-nums text-subtle">
                    {lane.rows.length}
                  </span>
                </header>

                <div className="flex min-h-[8px] flex-col gap-1.5">
                  <AnimatePresence initial={false}>
                    {lane.rows.map((row) => (
                      <Card
                        key={row.id}
                        row={row}
                        table={table}
                        titleColumn={title}
                        groupColumn={column}
                        dragging={dragging === row.id}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/rn-row', row.id);
                          e.dataTransfer.effectAllowed = 'move';
                          setDragging(row.id);
                        }}
                        onDragEnd={() => {
                          setDragging(null);
                          setDropLane(null);
                        }}
                        onTitle={(value) => title && apply(updateCell(table, row.id, title.id, value))}
                        onMove={(option) => apply(updateCell(table, row.id, column.id, option))}
                        onDelete={() => apply(removeRow(table, row.id))}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  onClick={() => addCard(lane)}
                  className="mt-1.5 flex h-8 w-full items-center gap-1.5 rounded-lg px-2 text-[13px] text-subtle transition-colors hover:bg-surface-hover hover:text-foreground"
                >
                  <Plus size={13} /> New
                </button>
              </section>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}

function Card({
  row,
  table,
  titleColumn,
  groupColumn,
  dragging,
  onDragStart,
  onDragEnd,
  onTitle,
  onMove,
  onDelete,
}: {
  row: TableRow;
  table: TableData;
  titleColumn: TableColumn | null;
  groupColumn: TableColumn;
  dragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onTitle: (value: string | null) => void;
  onMove: (option: string | null) => void;
  onDelete: () => void;
}): JSX.Element {
  const titleValue = titleColumn ? row.cells[titleColumn.id] : null;
  const laneValue = row.cells[groupColumn.id];
  // Up to two other non-empty cells become quiet meta chips under the title.
  const meta = table.columns
    .filter((c) => c.id !== titleColumn?.id && c.id !== groupColumn.id)
    .map((c) => ({ column: c, value: row.cells[c.id] }))
    .filter(({ column: c, value: v }) =>
      c.type === 'checkbox' ? v === true : v !== null && v !== undefined && v !== '',
    )
    .slice(0, 2);

  return (
    // framer-motion claims onDragStart/onDragEnd for its pan gestures, so the
    // motion element only animates layout; native HTML5 drag lives on the
    // inner article.
    <motion.div
      layoutId={row.id}
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
    >
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      aria-label={typeof titleValue === 'string' && titleValue ? titleValue : 'Untitled card'}
      className={cn(
        'group/card cursor-grab rounded-lg border border-border bg-surface p-2 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing',
        dragging && 'opacity-60 ring-1 ring-primary/50',
      )}
    >
      <div className="flex items-start gap-1.5">
        <input
          value={typeof titleValue === 'string' ? titleValue : ''}
          onChange={(e) => onTitle(e.target.value || null)}
          placeholder="Untitled"
          aria-label="Card title"
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-subtle"
        />
        <button
          type="button"
          aria-label="Delete card"
          onClick={onDelete}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-subtle opacity-0 transition-opacity hover:bg-danger/10 hover:text-danger group-hover/card:opacity-100"
        >
          <Trash2 size={12} />
        </button>
      </div>
      {meta.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {meta.map(({ column: c, value: v }) => (
            <span
              key={c.id}
              className="rounded bg-surface-hover px-1.5 py-0.5 text-[11px] text-muted-foreground"
            >
              {c.type === 'checkbox' ? `✓ ${c.name}` : String(v)}
            </span>
          ))}
        </div>
      )}
      {/* Drag-free move — the only way to change lanes on touch screens, and a
          keyboard-accessible alternative everywhere. Hidden until hover/focus on
          pointer devices; always visible on small screens. */}
      <div className="mt-1.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover/card:opacity-100 max-md:opacity-100">
        <select
          value={typeof laneValue === 'string' && (groupColumn.options ?? []).includes(laneValue) ? laneValue : ''}
          onChange={(e) => onMove(e.target.value || null)}
          aria-label="Move card"
          className="h-6 w-full cursor-pointer rounded border border-border bg-background px-1 text-[11px] text-muted-foreground outline-none hover:text-foreground"
        >
          <option value="">No {groupColumn.name}</option>
          {(groupColumn.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </article>
    </motion.div>
  );
}

/** Empty state when the table has no select column to group by. */
function NeedsSelectColumn({
  table,
  apply,
}: {
  table: TableData;
  apply: (next: TableData) => void;
}): JSX.Element {
  const createStatus = (): void => {
    let next = addColumn(table, 'Status', 'select');
    const created = next.columns[next.columns.length - 1];
    if (!created) return;
    for (const option of ['Todo', 'Doing', 'Done']) {
      next = addSelectOption(next, created.id, option);
    }
    apply(setGroupBy(next, created.id));
  };
  return (
    <div className="rn-panel flex flex-col items-start gap-2 p-5">
      <p className="text-sm text-muted-foreground">
        Boards group rows by a <strong>Select</strong> column — this table doesn’t have one yet.
      </p>
      <button
        type="button"
        onClick={createStatus}
        className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:brightness-110"
      >
        <Plus size={14} /> Add a Status column
      </button>
    </div>
  );
}
