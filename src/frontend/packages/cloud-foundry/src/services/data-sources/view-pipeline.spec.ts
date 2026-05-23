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

  it('descending sort', () => {
    const items = signal<Row[]>([{ name: 'a', created: 1 }, { name: 'b', created: 2 }]).asReadonly();
    const filter = signal<(r: Row) => boolean>(() => true);
    const sort = signal<{ field: keyof Row; direction: 'asc' | 'desc' }>({ field: 'created', direction: 'desc' });
    const pipe = new ViewPipeline<Row>(items, filter, sort, signal(10), signal(0));
    expect(pipe.sortedItems().map(r => r.name)).toEqual(['b', 'a']);
  });
});
