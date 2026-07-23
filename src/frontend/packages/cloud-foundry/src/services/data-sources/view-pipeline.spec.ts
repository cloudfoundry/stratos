import { describe, it, expect } from 'vitest';
import { signal } from '@angular/core';
import { ViewPipeline } from './view-pipeline';

interface Row { name: string; created: number; }

describe('ViewPipeline', () => {
  it('filters, sorts, and slices by page', () => {
    const items = signal<Row[]>([
      { name: 'alpha', created: 3 },
      { name: 'beta', created: 1 },
      { name: 'gamma', created: 2 },
      { name: 'delta', created: 5 },
      { name: 'epsilon', created: 4 },
    ]).asReadonly();
    const filter = signal<(r: Row) => boolean>(r => r.name.length > 4);
    const sort = signal<{ field: keyof Row; direction: 'asc' | 'desc' }>({ field: 'created', direction: 'asc' });
    const pageSize = signal(2);
    const pageIndex = signal(0);

    const pipe = new ViewPipeline<Row>(items, filter, sort, pageSize, pageIndex);

    expect(pipe.filteredItems().map(r => r.name)).toEqual(['alpha', 'gamma', 'delta', 'epsilon']);
    expect(pipe.sortedItems().map(r => r.name)).toEqual(['gamma', 'alpha', 'epsilon', 'delta']);
    expect(pipe.pagedItems().map(r => r.name)).toEqual(['gamma', 'alpha']);
    expect(pipe.totalItems()).toBe(5);
    expect(pipe.totalFilteredResults()).toBe(4);
    expect(pipe.totalPages()).toBe(2);

    pageIndex.set(1);
    expect(pipe.pagedItems().map(r => r.name)).toEqual(['epsilon', 'delta']);
  });

  it('totalItems stays unfiltered when filter narrows the view', () => {
    const items = signal<Row[]>([
      { name: 'a', created: 1 },
      { name: 'b', created: 2 },
      { name: 'c', created: 3 },
    ]).asReadonly();
    const filter = signal<(r: Row) => boolean>(r => r.name === 'zzz');
    const pipe = new ViewPipeline<Row>(items, filter, signal({ field: 'created', direction: 'asc' }), signal(10), signal(0));
    expect(pipe.totalItems()).toBe(3);
    expect(pipe.totalFilteredResults()).toBe(0);
  });

  it('strings sort case-insensitively and naturally (numeric-aware)', () => {
    // Without natural sort: 'OrgNoSelectedQuota' < 'e2e' (capital O = 0x4F
    // < lowercase e = 0x65) and 'org_10' lands between 'org_1' and 'org_2'.
    // With localeCompare(numeric, sensitivity:'base') case folds away and
    // numbers sort by value.
    const items = signal<{ name: string }[]>([
      { name: 'org_10' },
      { name: 'org_2' },
      { name: 'OrgAlpha' },
      { name: 'org_1' },
      { name: 'eee' },
    ]).asReadonly();
    const filter = signal<(r: { name: string }) => boolean>(() => true);
    const sort = signal<{ field: 'name'; direction: 'asc' | 'desc' }>({ field: 'name', direction: 'asc' });
    const pipe = new ViewPipeline(items, filter, sort, signal(10), signal(0));
    expect(pipe.sortedItems().map(r => r.name)).toEqual(['eee', 'org_1', 'org_2', 'org_10', 'OrgAlpha']);
  });

  it('descending sort', () => {
    const items = signal<Row[]>([{ name: 'a', created: 1 }, { name: 'b', created: 2 }]).asReadonly();
    const filter = signal<(r: Row) => boolean>(() => true);
    const sort = signal<{ field: keyof Row; direction: 'asc' | 'desc' }>({ field: 'created', direction: 'desc' });
    const pipe = new ViewPipeline<Row>(items, filter, sort, signal(10), signal(0));
    expect(pipe.sortedItems().map(r => r.name)).toEqual(['b', 'a']);
  });

  // #5670: pageIndex persists in the shared list state across wall ↔ space
  // navigation, so a stale index can point past the end of a smaller data
  // set. An unclamped slice then renders an empty page over a non-empty
  // list (a 1-app space showed no rows because the wall left index 14).
  describe('stale pageIndex clamping', () => {
    const sort = signal<{ field: keyof Row; direction: 'asc' | 'desc' }>({ field: 'created', direction: 'asc' });

    it('clamps an out-of-range pageIndex to the last available page', () => {
      const items = signal<Row[]>([{ name: 'only', created: 1 }]).asReadonly();
      const pipe = new ViewPipeline<Row>(items, signal(() => true), sort, signal(6), signal(14));
      expect(pipe.pagedItems().map(r => r.name)).toEqual(['only']);
    });

    it('clamped index lands on the last partial page of a multi-page set', () => {
      const items = signal<Row[]>([
        { name: 'a', created: 1 }, { name: 'b', created: 2 }, { name: 'c', created: 3 },
        { name: 'd', created: 4 }, { name: 'e', created: 5 },
      ]).asReadonly();
      const pipe = new ViewPipeline<Row>(items, signal(() => true), sort, signal(2), signal(99));
      expect(pipe.pagedItems().map(r => r.name)).toEqual(['e']);
    });

    it('an empty filtered set stays empty regardless of pageIndex', () => {
      const items = signal<Row[]>([{ name: 'a', created: 1 }]).asReadonly();
      const pipe = new ViewPipeline<Row>(items, signal<(r: Row) => boolean>(() => false), sort, signal(6), signal(14));
      expect(pipe.pagedItems()).toEqual([]);
    });

    it('non-positive page size (the "All" sentinel) renders every row', () => {
      const items = signal<Row[]>([{ name: 'a', created: 1 }, { name: 'b', created: 2 }]).asReadonly();
      const pipe = new ViewPipeline<Row>(items, signal(() => true), sort, signal(-1), signal(3));
      expect(pipe.pagedItems().map(r => r.name)).toEqual(['a', 'b']);
    });
  });
});
