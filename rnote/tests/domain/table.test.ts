import { describe, it, expect } from 'vitest';
import {
  createTable,
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
  docFromTable,
  tableFromDoc,
  isTableDoc,
} from '@domain/table';

describe('table model', () => {
  it('creates a starter table with 3 typed columns and 3 empty rows', () => {
    const t = createTable();
    expect(t.columns.map((c) => c.type)).toEqual(['text', 'select', 'checkbox']);
    expect(t.rows).toHaveLength(3);
    expect(t.rows[0]!.cells[t.columns[2]!.id]).toBe(false); // checkbox default
  });

  it('adds/removes rows and updates cells immutably', () => {
    const t = createTable();
    const grown = addRow(t);
    expect(grown.rows).toHaveLength(4);
    expect(t.rows).toHaveLength(3); // original untouched

    const col = t.columns[0]!;
    const row = t.rows[0]!;
    const edited = updateCell(t, row.id, col.id, 'Buy milk');
    expect(edited.rows[0]!.cells[col.id]).toBe('Buy milk');
    expect(t.rows[0]!.cells[col.id]).toBeNull();

    const shrunk = removeRow(t, row.id);
    expect(shrunk.rows).toHaveLength(2);
  });

  it('adds, renames, retypes and removes columns (never the last one)', () => {
    let t = createTable();
    t = addColumn(t, 'Price', 'number');
    const price = t.columns[3]!;
    expect(price.type).toBe('number');
    expect(t.rows[0]!.cells[price.id]).toBeNull();

    t = renameColumn(t, price.id, 'Cost');
    expect(t.columns[3]!.name).toBe('Cost');

    t = setColumnType(t, price.id, 'text');
    expect(t.columns[3]!.type).toBe('text');

    t = removeColumn(t, price.id);
    expect(t.columns).toHaveLength(3);

    let solo: import('@domain/table').TableData = { columns: [t.columns[0]!], rows: [] };
    solo = removeColumn(solo, t.columns[0]!.id);
    expect(solo.columns).toHaveLength(1); // last column is protected
  });

  it('manages select options without case-duplicates', () => {
    let t = createTable();
    const status = t.columns[1]!;
    t = addSelectOption(t, status.id, 'Blocked');
    t = addSelectOption(t, status.id, 'blocked'); // dup, ignored
    expect(t.columns[1]!.options).toEqual(['Todo', 'Doing', 'Done', 'Blocked']);
  });

  it('sorts by type (numeric, natural text, checked-first) with empties last', () => {
    let t = createTable();
    t = addColumn(t, 'Price', 'number');
    const name = t.columns[0]!;
    const price = t.columns[3]!;
    const [r1, r2] = t.rows as [(typeof t.rows)[0], (typeof t.rows)[0]];
    t = updateCell(t, r1.id, name.id, 'item 10');
    t = updateCell(t, r2.id, name.id, 'item 2');
    t = updateCell(t, r1.id, price.id, 5);
    t = updateCell(t, r2.id, price.id, 50);

    const byName = sortRows(t.rows, name, 'asc').map((r) => r.cells[name.id]);
    expect(byName).toEqual(['item 2', 'item 10', null]); // natural sort, empty last

    const byPriceDesc = sortRows(t.rows, price, 'desc').map((r) => r.cells[price.id]);
    expect(byPriceDesc).toEqual([50, 5, null]);
  });

  it('filters across all cells, case-insensitively', () => {
    let t = createTable();
    const name = t.columns[0]!;
    t = updateCell(t, t.rows[0]!.id, name.id, 'Groceries run');
    t = updateCell(t, t.rows[1]!.id, name.id, 'Call landlord');
    expect(filterRows(t.rows, 'groc')).toHaveLength(1);
    expect(filterRows(t.rows, '')).toHaveLength(3);
  });

  it('round-trips through a document body', () => {
    const t = createTable();
    const doc = docFromTable(t);
    expect(isTableDoc(doc)).toBe(true);
    expect(tableFromDoc(doc)).toEqual(t);
    expect(isTableDoc({ type: 'doc', content: [{ type: 'paragraph' }] })).toBe(false);
  });
});
