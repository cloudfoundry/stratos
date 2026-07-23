import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ListStateStore, ListStateDefaults } from './list-state-store.service';

const DEFAULTS: ListStateDefaults = {
  viewMode: 'table',
  pageSize: [24, 25],
  pageIndex: [0, 0],
  sort: [{ field: 'name', direction: 'asc' }, { field: 'name', direction: 'asc' }],
};

function store(): ListStateStore {
  return TestBed.inject(ListStateStore);
}

beforeEach(() => {
  TestBed.resetTestingModule();
  localStorage.clear();
});

describe('ListStateStore', () => {
  it('restores persisted preferences but never pageIndex (#5670)', () => {
    // A prior session left the list on page 14 — position is navigation
    // state, not a preference; restoring it is how a stale index lands on
    // a fresh visit and blanks a smaller list.
    localStorage.setItem('stratos.list-state.v1.test-list', JSON.stringify({
      viewMode: 'card',
      pageSize: [6, 25],
      pageIndex: [14, 3],
      sort: DEFAULTS.sort,
    }));
    const state = store().bind('test-list', DEFAULTS);
    expect(state.viewMode()).toBe('card');
    expect(state.pageSizeByMode()).toEqual([6, 25]);
    expect(state.pageIndexByMode()).toEqual([0, 0]);
  });

  describe('resetPageOnScopeChange', () => {
    it('keeps the page position when the scope is unchanged', () => {
      const state = store().bind('test-list', DEFAULTS);
      state.resetPageOnScopeChange('cf-1');
      state.pageIndex.set(4);
      state.resetPageOnScopeChange('cf-1');
      expect(state.pageIndex()).toBe(4);
    });

    it('resets both mode slots when the scope changes', () => {
      const state = store().bind('test-list', DEFAULTS);
      state.resetPageOnScopeChange('org-1');
      state.pageIndexByMode.set([2, 5]);
      state.resetPageOnScopeChange('org-2');
      expect(state.pageIndexByMode()).toEqual([0, 0]);
    });

    it('first call records the scope without disturbing position', () => {
      const state = store().bind('test-list', DEFAULTS);
      state.pageIndex.set(3);
      state.resetPageOnScopeChange('cf-1');
      expect(state.pageIndex()).toBe(3);
    });
  });
});
