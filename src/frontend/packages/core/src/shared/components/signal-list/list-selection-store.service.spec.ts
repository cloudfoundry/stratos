import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ListSelectionStore } from './list-selection-store.service';

interface Row { id: string; name: string }

describe('ListSelectionStore', () => {
  let store: ListSelectionStore<Row>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ListSelectionStore] });
    store = TestBed.inject(ListSelectionStore) as ListSelectionStore<Row>;
  });

  it('starts empty with isSelecting=false', () => {
    const bound = store.bind(r => r.id);
    expect(bound.selectedRows().size).toBe(0);
    expect(bound.isSelecting()).toBe(false);
  });

  it('toggle adds then removes a row', () => {
    const bound = store.bind(r => r.id);
    const row = { id: 'r1', name: 'one' };
    bound.toggle(row);
    expect(bound.selectedRows().size).toBe(1);
    expect(bound.selectedRows().get('r1')).toBe(row);
    expect(bound.isSelecting()).toBe(true);
    bound.toggle(row);
    expect(bound.selectedRows().size).toBe(0);
    expect(bound.isSelecting()).toBe(false);
  });

  it('selectAll replaces the selection with the supplied rows', () => {
    const bound = store.bind(r => r.id);
    bound.toggle({ id: 'preexisting', name: 'will be replaced' });
    bound.selectAll([
      { id: 'r1', name: 'one' },
      { id: 'r2', name: 'two' },
    ]);
    expect(bound.selectedRows().size).toBe(2);
    expect(bound.selectedRows().has('preexisting')).toBe(false);
    expect(bound.selectedRows().has('r1')).toBe(true);
    expect(bound.selectedRows().has('r2')).toBe(true);
  });

  it('clear empties the selection', () => {
    const bound = store.bind(r => r.id);
    bound.selectAll([{ id: 'r1', name: 'one' }]);
    bound.clear();
    expect(bound.selectedRows().size).toBe(0);
    expect(bound.isSelecting()).toBe(false);
  });

  it('isAllSelected reports true when every supplied row is selected', () => {
    const bound = store.bind(r => r.id);
    const rows: Row[] = [
      { id: 'r1', name: 'one' },
      { id: 'r2', name: 'two' },
    ];
    expect(bound.isAllSelected(rows)).toBe(false);
    bound.selectAll(rows);
    expect(bound.isAllSelected(rows)).toBe(true);
    expect(bound.isAllSelected([...rows, { id: 'r3', name: 'three' }])).toBe(false);
  });

  it('isAllSelected reports false for an empty rows array', () => {
    const bound = store.bind(r => r.id);
    expect(bound.isAllSelected([])).toBe(false);
  });
});
