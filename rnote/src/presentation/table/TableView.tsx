import { useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus,
  Search,
  Trash2,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Type as TypeIcon,
  Hash,
  ListFilter,
  CalendarDays,
  CheckSquare,
  X,
  Table2,
  Kanban,
  LayoutGrid,
} from 'lucide-react';
import type { RichDoc } from '@domain/blocks';
import {
  tableFromDoc,
  docFromTable,
  addRow,
  removeRow,
  updateCell,
  addColumn,
  renameColumn,
  removeColumn,
  setColumnType,
  addSelectOption,
  sortRows,
  filterRows,
  createTable,
  setView,
  type TableData,
  type TableColumn,
  type ColumnType,
  type CellValue,
  type SortDirection,
  type TableViewMode,
} from '@domain/table';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { BoardView } from './BoardView';
import { GalleryView } from './GalleryView';
import { cn } from '../lib/cn';

const TYPE_META: Record<ColumnType, { label: string; icon: ReactNode }> = {
  text: { label: 'Text', icon: <TypeIcon size={13} /> },
  number: { label: 'Number', icon: <Hash size={13} /> },
  select: { label: 'Select', icon: <ListFilter size={13} /> },
  date: { label: 'Date', icon: <CalendarDays size={13} /> },
  checkbox: { label: 'Checkbox', icon: <CheckSquare size={13} /> },
};

interface TableViewProps {
  content: RichDoc;
  onChange: (doc: RichDoc) => void;
}

/**
 * Databases v1 — the table view. Typed columns, inline cell editing, column
 * management, click-to-sort headers (rows shuffle with layout springs), and a
 * live filter. A saved Table · Board · Gallery switch re-renders the same rows
 * as a kanban of select-column lanes or a grid of visual cards. Pure operations
 * from @domain/table; persistence flows through the normal document save path.
 */
export function TableView({ content, onChange }: TableViewProps): JSX.Element {
  const [table, setTable] = useState<TableData>(() => tableFromDoc(content) ?? createTable());
  const [sort, setSort] = useState<{ columnId: string; direction: SortDirection } | null>(null);
  const [query, setQuery] = useState('');
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [optionDraft, setOptionDraft] = useState<{ rowId: string; columnId: string } | null>(null);

  const apply = (next: TableData): void => {
    setTable(next);
    onChange(docFromTable(next));
  };

  const mode: TableViewMode = table.view ?? 'table';

  const visibleRows = useMemo(() => {
    const filtered = filterRows(table.rows, query);
    const sortColumn = sort ? table.columns.find((c) => c.id === sort.columnId) : undefined;
    return sortColumn && sort ? sortRows(filtered, sortColumn, sort.direction) : filtered;
  }, [table, sort, query]);

  const cycleSort = (columnId: string): void => {
    setSort((cur) => {
      if (cur?.columnId !== columnId) return { columnId, direction: 'asc' };
      if (cur.direction === 'asc') return { columnId, direction: 'desc' };
      return null;
    });
  };

  const gridTemplate = `36px repeat(${table.columns.length}, minmax(150px, 1fr)) 44px`;

  return (
    <div className="mt-2">
      {/* Toolbar: layout toggle + filter + active sort */}
      <div className="mb-2 flex items-center gap-2">
        <div
          role="tablist"
          aria-label="Layout"
          className="flex h-8 shrink-0 items-center gap-0.5 rounded-md border border-border bg-surface p-0.5"
        >
          {(
            [
              { value: 'table', label: 'Table', icon: <Table2 size={13} /> },
              { value: 'board', label: 'Board', icon: <Kanban size={13} /> },
              { value: 'gallery', label: 'Gallery', icon: <LayoutGrid size={13} /> },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={mode === option.value}
              onClick={() => mode !== option.value && apply(setView(table, option.value))}
              className={cn(
                'flex h-[26px] items-center gap-1.5 rounded px-2 text-xs font-medium transition-colors',
                mode === option.value
                  ? 'bg-primary/15 text-primary'
                  : 'text-subtle hover:bg-surface-hover hover:text-foreground',
              )}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
        <div className="rn-field flex h-8 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-2.5 sm:max-w-[280px]">
          <Search size={13} className="shrink-0 text-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === 'table' ? 'Filter rows…' : 'Filter cards…'}
            className="h-full w-full bg-transparent text-sm text-foreground outline-none placeholder:text-subtle"
          />
        </div>
        {sort && mode === 'table' && (
          <button
            type="button"
            onClick={() => setSort(null)}
            className="flex h-8 items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 text-xs font-medium text-primary"
          >
            {table.columns.find((c) => c.id === sort.columnId)?.name}
            {sort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            <X size={12} />
          </button>
        )}
        <span className="ml-auto text-xs text-subtle">
          {visibleRows.length === table.rows.length
            ? `${table.rows.length} rows`
            : `${visibleRows.length} of ${table.rows.length} rows`}
        </span>
      </div>

      {mode === 'board' ? (
        <BoardView table={table} query={query} apply={apply} />
      ) : mode === 'gallery' ? (
        <GalleryView table={table} query={query} apply={apply} />
      ) : (
      <div className="rn-panel overflow-x-auto">
        <div role="table" aria-label="Table" className="min-w-fit text-sm">
          {/* Header */}
          <div
            role="row"
            className="grid border-b border-border bg-surface"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <span aria-hidden className="border-r border-border" />
            {table.columns.map((column) => (
              <div key={column.id} role="columnheader" className="relative flex items-center border-r border-border">
                <button
                  type="button"
                  onClick={() => cycleSort(column.id)}
                  title="Sort"
                  className="flex h-9 min-w-0 flex-1 items-center gap-1.5 px-2.5 text-left font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="shrink-0 text-subtle">{TYPE_META[column.type].icon}</span>
                  <span className="truncate">{column.name}</span>
                  {sort?.columnId === column.id &&
                    (sort.direction === 'asc' ? (
                      <ArrowUp size={12} className="shrink-0 text-primary" />
                    ) : (
                      <ArrowDown size={12} className="shrink-0 text-primary" />
                    ))}
                </button>
                <button
                  type="button"
                  aria-label={`${column.name} column options`}
                  onClick={() => setMenuFor((cur) => (cur === column.id ? null : column.id))}
                  className="mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-subtle hover:bg-surface-hover hover:text-foreground"
                >
                  <ChevronDown size={13} />
                </button>
                {menuFor === column.id && (
                  <ColumnMenu
                    column={column}
                    onClose={() => setMenuFor(null)}
                    onRename={(name) => apply(renameColumn(table, column.id, name))}
                    onType={(type) => apply(setColumnType(table, column.id, type))}
                    onDelete={() => {
                      apply(removeColumn(table, column.id));
                      setMenuFor(null);
                    }}
                    canDelete={table.columns.length > 1}
                  />
                )}
              </div>
            ))}
            <div className="relative flex items-center justify-center">
              <button
                type="button"
                aria-label="Add column"
                onClick={() => setAdding((v) => !v)}
                className="flex h-6 w-6 items-center justify-center rounded text-subtle hover:bg-surface-hover hover:text-foreground"
              >
                <Plus size={14} />
              </button>
              {adding && (
                <AddColumnMenu
                  onClose={() => setAdding(false)}
                  onAdd={(name, type) => {
                    apply(addColumn(table, name, type));
                    setAdding(false);
                  }}
                />
              )}
            </div>
          </div>

          {/* Rows — layout springs make sorting/filtering physically shuffle. */}
          <AnimatePresence initial={false}>
            {visibleRows.map((row, index) => (
              <motion.div
                key={row.id}
                role="row"
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                className="group/row grid border-b border-border last:border-b-0 hover:bg-surface-hover/50"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                <span className="flex items-center justify-center border-r border-border text-[11px] tabular-nums text-subtle">
                  {index + 1}
                </span>
                {table.columns.map((column) => (
                  <div key={column.id} role="cell" className="border-r border-border">
                    <Cell
                      column={column}
                      value={row.cells[column.id] ?? null}
                      addingOption={
                        optionDraft?.rowId === row.id && optionDraft.columnId === column.id
                      }
                      onStartAddOption={() => setOptionDraft({ rowId: row.id, columnId: column.id })}
                      onAddOption={(option) => {
                        let next = addSelectOption(table, column.id, option);
                        next = updateCell(next, row.id, column.id, option.trim());
                        apply(next);
                        setOptionDraft(null);
                      }}
                      onCancelAddOption={() => setOptionDraft(null)}
                      onChange={(value) => apply(updateCell(table, row.id, column.id, value))}
                    />
                  </div>
                ))}
                <span className="flex items-center justify-center">
                  <button
                    type="button"
                    aria-label="Delete row"
                    onClick={() => apply(removeRow(table, row.id))}
                    className="flex h-6 w-6 items-center justify-center rounded text-subtle opacity-0 transition-opacity hover:bg-danger/10 hover:text-danger group-hover/row:opacity-100"
                  >
                    <Trash2 size={13} />
                  </button>
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* New row */}
          <button
            type="button"
            onClick={() => apply(addRow(table))}
            className="flex h-9 w-full items-center gap-1.5 px-2.5 text-sm text-subtle transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <Plus size={14} /> New row
          </button>
        </div>
      </div>
      )}
    </div>
  );
}

// ── Cells ────────────────────────────────────────────────────────────────────
function Cell({
  column,
  value,
  addingOption,
  onStartAddOption,
  onAddOption,
  onCancelAddOption,
  onChange,
}: {
  column: TableColumn;
  value: CellValue;
  addingOption: boolean;
  onStartAddOption: () => void;
  onAddOption: (option: string) => void;
  onCancelAddOption: () => void;
  onChange: (value: CellValue) => void;
}): JSX.Element {
  const base =
    'h-9 w-full bg-transparent px-2.5 text-sm text-foreground outline-none placeholder:text-subtle';

  if (column.type === 'checkbox') {
    return (
      <label className="flex h-9 cursor-pointer items-center px-2.5">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={column.name}
          className="h-4 w-4 accent-[hsl(var(--primary))]"
        />
      </label>
    );
  }
  if (column.type === 'number') {
    return (
      <input
        type="number"
        value={value === null || value === undefined ? '' : String(value)}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        placeholder="—"
        aria-label={column.name}
        className={cn(base, 'tabular-nums')}
      />
    );
  }
  if (column.type === 'date') {
    return (
      <input
        type="date"
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value || null)}
        aria-label={column.name}
        className={cn(base, 'text-muted-foreground [&:not(:placeholder-shown)]:text-foreground')}
      />
    );
  }
  if (column.type === 'select') {
    if (addingOption) {
      return (
        <input
          autoFocus
          placeholder="New option…"
          aria-label={`New ${column.name} option`}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onAddOption((e.target as HTMLInputElement).value);
            if (e.key === 'Escape') onCancelAddOption();
          }}
          onBlur={onCancelAddOption}
          className={base}
        />
      );
    }
    return (
      <select
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => {
          if (e.target.value === '__add__') onStartAddOption();
          else onChange(e.target.value || null);
        }}
        aria-label={column.name}
        className={cn(base, 'cursor-pointer appearance-none', !value && 'text-subtle')}
      >
        <option value="">—</option>
        {(column.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value="__add__">＋ Add option…</option>
      </select>
    );
  }
  return (
    <input
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value || null)}
      placeholder="—"
      aria-label={column.name}
      className={base}
    />
  );
}

// ── Header popovers ────────────────────────────────────────────────────────────
function ColumnMenu({
  column,
  canDelete,
  onClose,
  onRename,
  onType,
  onDelete,
}: {
  column: TableColumn;
  canDelete: boolean;
  onClose: () => void;
  onRename: (name: string) => void;
  onType: (type: ColumnType) => void;
  onDelete: () => void;
}): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, onClose, true);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -4, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
      className="rn-panel absolute right-0 top-9 z-30 w-52 p-2 shadow-lg"
    >
      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-subtle">
        Column name
      </label>
      <input
        defaultValue={column.name}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onRename((e.target as HTMLInputElement).value);
            onClose();
          }
          if (e.key === 'Escape') onClose();
        }}
        onBlur={(e) => onRename(e.target.value)}
        className="rn-field mb-2 h-8 w-full rounded-md border border-border bg-surface px-2 text-sm text-foreground outline-none"
      />
      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-subtle">
        Type
      </label>
      <select
        value={column.type}
        onChange={(e) => onType(e.target.value as ColumnType)}
        className="mb-2 h-8 w-full cursor-pointer rounded-md border border-border bg-surface px-1.5 text-sm text-foreground outline-none"
      >
        {(Object.keys(TYPE_META) as ColumnType[]).map((t) => (
          <option key={t} value={t}>
            {TYPE_META[t].label}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!canDelete}
        onClick={onDelete}
        className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm text-danger transition-colors hover:bg-danger/10 disabled:opacity-40"
      >
        <Trash2 size={13} /> Delete column
      </button>
    </motion.div>
  );
}

function AddColumnMenu({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (name: string, type: ColumnType) => void;
}): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<ColumnType>('text');
  useOnClickOutside(ref, onClose, true);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -4, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
      className="rn-panel absolute right-0 top-9 z-30 w-52 p-2 shadow-lg"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        placeholder="Column name"
        onKeyDown={(e) => {
          if (e.key === 'Enter') onAdd(name, type);
          if (e.key === 'Escape') onClose();
        }}
        className="rn-field mb-2 h-8 w-full rounded-md border border-border bg-surface px-2 text-sm text-foreground outline-none placeholder:text-subtle"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as ColumnType)}
        className="mb-2 h-8 w-full cursor-pointer rounded-md border border-border bg-surface px-1.5 text-sm text-foreground outline-none"
      >
        {(Object.keys(TYPE_META) as ColumnType[]).map((t) => (
          <option key={t} value={t}>
            {TYPE_META[t].label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onAdd(name, type)}
        className="h-8 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground transition hover:brightness-110"
      >
        Add column
      </button>
    </motion.div>
  );
}
